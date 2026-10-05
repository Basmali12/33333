/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ParsedExifData {
  hasExif: boolean;
  cameraMake: string;
  cameraModel: string;
  captureDate: string;
  dimensions: string;
  fileSize: string;
  gpsCoordinates: string;
  hasGps: boolean;
  privacyNote: string;
  compression: string;
}

/**
 * قارئ بيانات EXIF حقيقي من مصفوفة بايتات الصورة (Binary ArrayBuffer)
 * يستخرج نوع الهاتف الحقيقي وموقع الـ GPS الفعلي إذا كان مضمناً
 */
export async function extractRealExifFromImage(file: File): Promise<ParsedExifData> {
  const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
  const sizeKB = Math.round(file.size / 1024);
  const fileSizeStr = file.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;

  // أبعاد الصورة الحقيقية
  const dimensions = await getImageDimensions(file);

  try {
    const buffer = await file.arrayBuffer();
    const view = new DataView(buffer);

    // التحقق من ترويسة JPEG (0xFFD8)
    if (view.getUint16(0, false) !== 0xffd8) {
      return {
        hasExif: false,
        cameraMake: 'صيغة غير مدعومة لـ EXIF (ليست JPEG)',
        cameraModel: file.type || 'صورة مستند / PNG',
        captureDate: new Date(file.lastModified).toLocaleDateString('ar-SA'),
        dimensions,
        fileSize: fileSizeStr,
        gpsCoordinates: 'غير متوفرة',
        hasGps: false,
        privacyNote: 'تمت إزالة الترويسة الوصفية بواسطة التطبيق أو نظام التشغيل لحماية الخصوصية.',
        compression: 'معالجة محلية قياسية'
      };
    }

    let offset = 2;
    const length = view.byteLength;

    while (offset < length) {
      if (view.getUint8(offset) !== 0xff) break;
      const marker = view.getUint8(offset + 1);

      // APP1 Marker (EXIF)
      if (marker === 0xe1) {
        const exifData = parseApp1Exif(view, offset + 4);
        return {
          ...exifData,
          dimensions,
          fileSize: fileSizeStr
        };
      }

      const segmentLength = view.getUint16(offset + 2, false);
      offset += 2 + segmentLength;
    }
  } catch (e) {
    console.warn('Could not parse EXIF binary:', e);
  }

  // في حال كانت الصورة مأخوذة بهاتف ولكن تم إرسالها عبر واتساب/تليغرام أو لقطة شاشة
  return {
    hasExif: false,
    cameraMake: 'هاتف ذكي (بيانات الكاميرا محجوبة)',
    cameraModel: 'الصورة تمت مشاركتها عبر تطبيق قام بمسح بيانات المصنع',
    captureDate: new Date(file.lastModified).toLocaleString('ar-SA'),
    dimensions,
    fileSize: fileSizeStr,
    gpsCoordinates: '🔒 لا توجد إحداثيات GPS مضمنة في الصورة',
    hasGps: false,
    privacyNote: 'معظم الهواتف وتطبيقات المراسلة (واتساب، تليغرام) تقوم بحذف إحداثيات الموقع ونوع الهاتف تلقائياً لحماية خصوصية المستخدمين ومنع تعقبهم.',
    compression: 'ضغط رقمي قياسي'
  };
}

function getImageDimensions(file: File): Promise<string> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(`${img.naturalWidth} × ${img.naturalHeight} px`);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve('غير محدد');
    };
    img.src = url;
  });
}

function parseApp1Exif(view: DataView, startOffset: number) {
  // فحص توقيع Exif\0\0
  const isExif =
    view.getUint8(startOffset) === 0x45 &&
    view.getUint8(startOffset + 1) === 0x78 &&
    view.getUint8(startOffset + 2) === 0x69 &&
    view.getUint8(startOffset + 3) === 0x66;

  if (!isExif) {
    return {
      hasExif: false,
      cameraMake: 'غير معلن',
      cameraModel: 'هاتف محمول',
      captureDate: 'غير محدد',
      gpsCoordinates: '🔒 لا توجد بيانات موقع',
      hasGps: false,
      privacyNote: 'الصورة لا تحتوي على ترويسة EXIF قياسية.',
      compression: 'معالجة قياسية'
    };
  }

  const tiffOffset = startOffset + 6;
  const littleEndian = view.getUint16(tiffOffset) === 0x4949; // 'II'

  const ifd0Offset = tiffOffset + view.getUint32(tiffOffset + 4, littleEndian);
  const numEntries = view.getUint16(ifd0Offset, littleEndian);

  let make = '';
  let model = '';
  let dateTime = '';
  let gpsOffset = 0;

  for (let i = 0; i < numEntries; i++) {
    const entryOffset = ifd0Offset + 2 + i * 12;
    const tag = view.getUint16(entryOffset, littleEndian);

    if (tag === 0x010f) {
      // Make
      make = readString(view, entryOffset, tiffOffset, littleEndian);
    } else if (tag === 0x0110) {
      // Model
      model = readString(view, entryOffset, tiffOffset, littleEndian);
    } else if (tag === 0x0132) {
      // DateTime
      dateTime = readString(view, entryOffset, tiffOffset, littleEndian);
    } else if (tag === 0x8825) {
      // GPS IFD
      gpsOffset = tiffOffset + view.getUint32(entryOffset + 8, littleEndian);
    }
  }

  let gpsCoords = '🔒 لا توجد إحداثيات GPS مضمنة في الصورة';
  let hasGps = false;

  if (gpsOffset > 0) {
    try {
      const gpsEntries = view.getUint16(gpsOffset, littleEndian);
      let latRef = '';
      let lat = 0;
      let lonRef = '';
      let lon = 0;

      for (let j = 0; j < gpsEntries; j++) {
        const gEntry = gpsOffset + 2 + j * 12;
        const gTag = view.getUint16(gEntry, littleEndian);

        if (gTag === 1) {
          latRef = String.fromCharCode(view.getUint8(gEntry + 8));
        } else if (gTag === 2) {
          lat = readGpsCoordinate(view, gEntry, tiffOffset, littleEndian);
        } else if (gTag === 3) {
          lonRef = String.fromCharCode(view.getUint8(gEntry + 8));
        } else if (gTag === 4) {
          lon = readGpsCoordinate(view, gEntry, tiffOffset, littleEndian);
        }
      }

      if (lat > 0 && lon > 0) {
        hasGps = true;
        gpsCoords = `${lat.toFixed(4)}°${latRef || 'N'} ${lon.toFixed(4)}°${lonRef || 'E'} (مستخرج حقيقي من الصورة)`;
      }
    } catch {
      // Ignore
    }
  }

  return {
    hasExif: !!(make || model || dateTime || hasGps),
    cameraMake: make || 'هاتف محمول',
    cameraModel: model ? `${make ? make + ' ' : ''}${model}` : (make || 'هاتف محمول'),
    captureDate: dateTime || 'تاريخ الالتقاط غير محفوظ في الملف',
    gpsCoordinates: gpsCoords,
    hasGps,
    privacyNote: hasGps
      ? '⚠️ تم العثور على إحداثيات جغرافية حقيقية مضمنة داخل الملف الأصلي!'
      : '🔒 لا توجد إحداثيات GPS (موقع الصورة محمي ولم يتم تسجيله عند الالتقاط أو تم حذفه).',
    compression: 'ملف صورة أصلي'
  };
}

function readString(view: DataView, entryOffset: number, tiffOffset: number, littleEndian: boolean): string {
  const count = view.getUint32(entryOffset + 4, littleEndian);
  if (count <= 0) return '';
  const valueOffset = count > 4 ? tiffOffset + view.getUint32(entryOffset + 8, littleEndian) : entryOffset + 8;

  let str = '';
  for (let i = 0; i < count - 1; i++) {
    const charCode = view.getUint8(valueOffset + i);
    if (charCode === 0) break;
    str += String.fromCharCode(charCode);
  }
  return str.trim();
}

function readGpsCoordinate(view: DataView, entryOffset: number, tiffOffset: number, littleEndian: boolean): number {
  const valOffset = tiffOffset + view.getUint32(entryOffset + 8, littleEndian);
  const degNum = view.getUint32(valOffset, littleEndian);
  const degDen = view.getUint32(valOffset + 4, littleEndian);
  const minNum = view.getUint32(valOffset + 8, littleEndian);
  const minDen = view.getUint32(valOffset + 12, littleEndian);
  const secNum = view.getUint32(valOffset + 16, littleEndian);
  const secDen = view.getUint32(valOffset + 20, littleEndian);

  const degrees = degDen ? degNum / degDen : 0;
  const minutes = minDen ? minNum / minDen : 0;
  const seconds = secDen ? secNum / secDen : 0;

  return degrees + minutes / 60 + seconds / 3600;
}
