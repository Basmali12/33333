/**
 * Digital Fingerprint Real Extraction Utilities
 * 100% Real Live Client Data - Comprehensive Browser & Mobile Reconnaissance
 */

export interface RealFingerprintData {
  // 1. نوع الجهاز والموديل الدقيق
  deviceAndOS: string;
  phoneModel: string;
  phoneBrand: string;
  deviceType: 'هاتف ذكي (Mobile)' | 'جهاز لوحي (Tablet)' | 'حاسوب (Desktop/Laptop)' | 'غير محدد';

  // 2. حالة الشحن والبطارية
  batteryLevel: string;
  batteryStatus: string;
  batteryCharging: boolean | null;
  batteryNote: string;

  // 3. معالج الرسوميات وكرت الشاشة (GPU Telemetry)
  gpuRenderer: string;
  gpuVendor: string;

  // 4. مظهر وإعدادات النظام الحية
  systemTheme: 'الوضع الداكن (Dark Mode)' | 'الوضع الفاتح (Light Mode)';
  inputMethod: string;
  hoverSupport: string;

  // 5. اسم المتصفح وإصداره ومحرك العرض
  browserAndVersion: string;
  browserEngine: string;

  // 6. أبعاد الشاشة ودقتها والاتجاه
  screenResolution: string;
  pixelRatio: string;
  orientation: string;

  // 7. لغة النظام والمنطقة الزمنية
  languageAndTimezone: string;
  localTime: string;

  // 8. شبكة الاتصال وسرعتها
  networkType: string;
  networkSpeed: string;

  // 9. مواصفات المعالجة والذاكرة
  hardwareCores: string;
  deviceMemory: string;
  touchPoints: string;

  // 10. نص User-Agent الكامل الفعلي
  rawUserAgent: string;
}

export interface NetworkIpData {
  ip: string;
  isp: string;
  location: string;
  country: string;
  city: string;
  loading: boolean;
  error?: string;
}

export async function fetchPublicNetworkData(): Promise<NetworkIpData> {
  // 1. المحاولة الأساسية: عبر ipapi.co للحصول على الـ IP ومزود الخدمة والمدينة والدولة
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://ipapi.co/json/', {
      cache: 'no-cache',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.ip) {
        const city = data.city || '';
        const country = data.country_name || '';
        return {
          ip: data.ip,
          isp: data.org || data.asn || 'مزود خدمة محلي',
          city: city || 'مدينة غير محددة',
          country: country || 'دولة غير محددة',
          location: `${city ? city + '، ' : ''}${country}`.trim() || 'الموقع التقديري للشبكة',
          loading: false,
        };
      }
    }
  } catch {
    // الانتقال للبديل
  }

  // 2. المحاولة البديلة الأولى: ipwho.is (CORS مفتوح ودعم سريع)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://ipwho.is/', {
      cache: 'no-cache',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.ip) {
        const city = data.city || '';
        const country = data.country || '';
        return {
          ip: data.ip,
          isp: data.connection?.isp || data.connection?.org || 'مزود خدمة محلي',
          city: city || 'مدينة غير محددة',
          country: country || 'دولة غير محددة',
          location: `${city ? city + '، ' : ''}${country}`.trim() || 'الموقع التقديري للشبكة',
          loading: false,
        };
      }
    }
  } catch {
    // الانتقال للبديل الثاني
  }

  // 3. المحاولة البديلة الثانية: api.ipify.org
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://api.ipify.org?format=json', {
      cache: 'no-cache',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.ip) {
        return {
          ip: data.ip,
          isp: 'مزود خدمة إنترنت (ISP)',
          city: 'المدينة التقديرية',
          country: 'الموقع الجغرافي للشبكة',
          location: 'موقع الشبكة التقديري',
          loading: false,
        };
      }
    }
  } catch {
    // فشل
  }

  return {
    ip: 'محمي أو غير متاح',
    isp: 'غير متاح',
    city: 'غير محدد',
    country: 'غير محدد',
    location: 'تعذر الاتصال بالخادم الخارجي',
    loading: false,
    error: 'تعذر جلب عنوان الـ IP (قد يكون بسبب مانع إعلانات أو قيود اتصال)'
  };
}

// مطابقة موديلات هواتف الآيفون بدقة من خلال أبعاد الشاشة وكثافة البكسل
function detectIPhoneModel(): string {
  const w = Math.min(window.screen.width, window.screen.height);
  const h = Math.max(window.screen.width, window.screen.height);
  const r = window.devicePixelRatio || 1;

  if (w === 440 && h === 956) return 'Apple iPhone 16 Pro Max';
  if (w === 402 && h === 874) return 'Apple iPhone 16 Pro';
  if (w === 430 && h === 932) return 'Apple iPhone 15 Pro Max / 15 Plus / 14 Pro Max';
  if (w === 393 && h === 852) return 'Apple iPhone 15 / 15 Pro / 14 Pro / 16';
  if (w === 428 && h === 926) return 'Apple iPhone 14 Plus / 13 Pro Max / 12 Pro Max';
  if (w === 390 && h === 844) return 'Apple iPhone 14 / 13 / 13 Pro / 12 / 12 Pro';
  if (w === 375 && h === 812) return 'Apple iPhone 13 mini / 12 mini / 11 Pro / XS / X';
  if (w === 414 && h === 896 && r === 3) return 'Apple iPhone 11 Pro Max / XS Max';
  if (w === 414 && h === 896 && r === 2) return 'Apple iPhone 11 / XR';
  if (w === 414 && h === 736) return 'Apple iPhone 8 Plus / 7 Plus / 6s Plus';
  if (w === 375 && h === 667) return 'Apple iPhone SE (2nd/3rd gen) / 8 / 7';
  return 'Apple iPhone';
}

// استخراج طراز وموديل هواتف أندرويد
function detectAndroidModel(ua: string): { brand: string; model: string } {
  const samMatch = ua.match(/SM-([A-Z0-9]+)/i);
  if (samMatch) {
    const code = samMatch[0].toUpperCase();
    if (code.startsWith('SM-S928')) return { brand: 'Samsung', model: `Samsung Galaxy S24 Ultra (${code})` };
    if (code.startsWith('SM-S926')) return { brand: 'Samsung', model: `Samsung Galaxy S24+ (${code})` };
    if (code.startsWith('SM-S921')) return { brand: 'Samsung', model: `Samsung Galaxy S24 (${code})` };
    if (code.startsWith('SM-S918')) return { brand: 'Samsung', model: `Samsung Galaxy S23 Ultra (${code})` };
    if (code.startsWith('SM-S916')) return { brand: 'Samsung', model: `Samsung Galaxy S23+ (${code})` };
    if (code.startsWith('SM-S911')) return { brand: 'Samsung', model: `Samsung Galaxy S23 (${code})` };
    if (code.startsWith('SM-S908')) return { brand: 'Samsung', model: `Samsung Galaxy S22 Ultra (${code})` };
    if (code.startsWith('SM-G998')) return { brand: 'Samsung', model: `Samsung Galaxy S21 Ultra (${code})` };
    if (code.startsWith('SM-A546')) return { brand: 'Samsung', model: `Samsung Galaxy A54 5G (${code})` };
    if (code.startsWith('SM-A536')) return { brand: 'Samsung', model: `Samsung Galaxy A53 5G (${code})` };
    if (code.startsWith('SM-F946')) return { brand: 'Samsung', model: `Samsung Galaxy Z Fold 5 (${code})` };
    if (code.startsWith('SM-F731')) return { brand: 'Samsung', model: `Samsung Galaxy Z Flip 5 (${code})` };
    return { brand: 'Samsung', model: `Samsung Galaxy (${code})` };
  }

  const pixelMatch = ua.match(/Pixel\s?([0-9a-zA-Z\s]+?)(?:Build|\)|;)/i);
  if (pixelMatch) {
    return { brand: 'Google', model: `Google Pixel ${pixelMatch[1].trim()}` };
  }

  if (/Redmi/i.test(ua)) {
    const match = ua.match(/Redmi\s?([0-9a-zA-Z\s]+?)(?:Build|\)|;)/i);
    return { brand: 'Xiaomi', model: match ? `Xiaomi Redmi ${match[1].trim()}` : 'Xiaomi Redmi' };
  }
  if (/POCO/i.test(ua)) {
    const match = ua.match(/POCO\s?([0-9a-zA-Z\s]+?)(?:Build|\)|;)/i);
    return { brand: 'POCO', model: match ? `Xiaomi POCO ${match[1].trim()}` : 'Xiaomi POCO' };
  }

  const buildMatch = ua.match(/;\s([A-Za-z0-9_\-\s]+)\sBuild\//);
  if (buildMatch) {
    return { brand: 'Android', model: `هاتف Android (${buildMatch[1].trim()})` };
  }

  return { brand: 'Android', model: 'هاتف ذكي Android' };
}

// استخراج معلومات معالج الرسوميات (GPU) الفعلي بدون أي تصريح عبر WebGL
function detectRealGPU(): { vendor: string; renderer: string } {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) {
      return { vendor: 'غير مدعوم', renderer: 'WebGL غير متاح' };
    }
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) {
      return {
        vendor: gl.getParameter(gl.VENDOR) || 'محمي من المتصفح',
        renderer: gl.getParameter(gl.RENDERER) || 'محمي من المتصفح'
      };
    }
    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'غير متاح';
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'غير متاح';
    return { vendor, renderer };
  } catch {
    return { vendor: 'محمي أمنياً', renderer: 'محمي أمنياً' };
  }
}

export async function detectRealClientEnhanced(): Promise<RealFingerprintData> {
  const ua = navigator.userAgent || '';

  // 1. نوع الجهاز والموديل
  let os = 'نظام غير محدد';
  let phoneBrand = 'غير معروف';
  let phoneModel = 'جهاز كمبيوتر مكتبي / محمول';
  let deviceType: 'هاتف ذكي (Mobile)' | 'جهاز لوحي (Tablet)' | 'حاسوب (Desktop/Laptop)' | 'غير محدد' = 'حاسوب (Desktop/Laptop)';

  if (/iPhone/i.test(ua)) {
    deviceType = 'هاتف ذكي (Mobile)';
    phoneBrand = 'Apple';
    phoneModel = detectIPhoneModel();
    const match = ua.match(/OS ([0-9_]+)/i);
    const ver = match ? match[1].replace(/_/g, '.') : '';
    os = `iOS ${ver}`;
  } else if (/iPad/i.test(ua)) {
    deviceType = 'جهاز لوحي (Tablet)';
    phoneBrand = 'Apple';
    phoneModel = 'Apple iPad';
    const match = ua.match(/OS ([0-9_]+)/i);
    const ver = match ? match[1].replace(/_/g, '.') : '';
    os = `iPadOS ${ver}`;
  } else if (/Android/i.test(ua)) {
    const isTablet = /Tablet/i.test(ua);
    deviceType = isTablet ? 'جهاز لوحي (Tablet)' : 'هاتف ذكي (Mobile)';
    const androidInfo = detectAndroidModel(ua);
    phoneBrand = androidInfo.brand;
    phoneModel = androidInfo.model;
    const ver = ua.match(/Android ([0-9\.]+)/i)?.[1] || '';
    os = `Android ${ver}`;

    try {
      const uaData = (navigator as unknown as { userAgentData?: { getHighEntropyValues: (hints: string[]) => Promise<{ model?: string }> } }).userAgentData;
      if (uaData) {
        const hints = await uaData.getHighEntropyValues(['model']);
        if (hints.model) {
          phoneModel = `${phoneBrand} ${hints.model}`;
        }
      }
    } catch {
      // Ignore
    }
  } else if (/Windows NT 10.0/i.test(ua)) {
    os = 'Windows 10 / 11';
    phoneBrand = 'PC';
    phoneModel = 'حاسوب شخصي (Windows PC)';
    deviceType = 'حاسوب (Desktop/Laptop)';
  } else if (/Mac OS X/i.test(ua)) {
    const ver = ua.match(/Mac OS X ([0-9_\.]+)/i)?.[1]?.replace(/_/g, '.') || '';
    os = `macOS ${ver}`;
    phoneBrand = 'Apple';
    phoneModel = 'Apple Mac (MacBook / iMac)';
    deviceType = 'حاسوب (Desktop/Laptop)';
  } else if (/CrOS/i.test(ua)) {
    os = 'ChromeOS';
    phoneBrand = 'Google';
    phoneModel = 'Google Chromebook';
    deviceType = 'حاسوب (Desktop/Laptop)';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
    phoneBrand = 'PC';
    phoneModel = 'جهاز حاسوب Linux';
    deviceType = 'حاسوب (Desktop/Laptop)';
  }

  // 2. فحص البطارية
  let batteryLevel = 'غير متاح';
  let batteryStatus = 'غير مدعوم';
  let batteryCharging: boolean | null = null;
  let batteryNote = '';

  try {
    const nav = navigator as unknown as { getBattery?: () => Promise<{ level: number; charging: boolean }> };
    if (typeof nav.getBattery === 'function') {
      const b = await nav.getBattery();
      const pct = Math.round(b.level * 100);
      batteryLevel = `${pct}%`;
      batteryCharging = b.charging;
      batteryStatus = b.charging ? `⚡ جاري الشحن (${pct}%)` : `🔋 يعمل على البطارية (${pct}%)`;
      batteryNote = 'تمت قراءة نسبة الشحن المباشرة عبر Battery Status API بدون إذن.';
    } else {
      if (/iPhone|iPad/i.test(ua)) {
        batteryStatus = 'محجوبة في iOS Safari';
        batteryNote = 'حجبت Apple قراءة البطارية لحماية الخصوصية لمنع استخدامها كبصمة تعقب.';
      } else {
        batteryStatus = 'غير مدعومة في المتصفح';
        batteryNote = 'المتصفح الحالي لا يوفر واجهة قراءة البطارية.';
      }
    }
  } catch {
    batteryStatus = 'محجوبة برمجياً';
  }

  // 3. معالج الرسوميات (GPU)
  const gpu = detectRealGPU();

  // 4. مظهر النظام وإعدادات الواجهة
  const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const systemTheme = isDark ? 'الوضع الداكن (Dark Mode)' : 'الوضع الفاتح (Light Mode)';

  const isCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const inputMethod = isCoarse ? 'شاشة لمس إصبعية (Touchscreen)' : 'مؤشر ماوس دقيق (Mouse / Trackpad)';

  const canHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;
  const hoverSupport = canHover ? 'يدعم تمرير الفأرة (Hover)' : 'نقر مباشر فقط (شاشة هاتف)';

  // 5. اسم المتصفح
  let browser = 'متصفح قياسي';
  let browserEngine = 'Blink';
  if (/Edg\/([0-9\.]+)/i.test(ua)) {
    browser = `Microsoft Edge ${RegExp.$1}`;
    browserEngine = 'Blink (Chromium)';
  } else if (/OPR\/([0-9\.]+)/i.test(ua)) {
    browser = `Opera ${RegExp.$1}`;
    browserEngine = 'Blink (Chromium)';
  } else if (/SamsungBrowser\/([0-9\.]+)/i.test(ua)) {
    browser = `Samsung Internet ${RegExp.$1}`;
    browserEngine = 'Blink (Chromium)';
  } else if (/Chrome\/([0-9\.]+)/i.test(ua)) {
    browser = `Google Chrome ${RegExp.$1}`;
    browserEngine = 'Blink (Chromium)';
  } else if (/Firefox\/([0-9\.]+)/i.test(ua)) {
    browser = `Mozilla Firefox ${RegExp.$1}`;
    browserEngine = 'Gecko';
  } else if (/Version\/([0-9\.]+) Safari/i.test(ua)) {
    browser = `Apple Safari ${RegExp.$1}`;
    browserEngine = 'WebKit';
  }

  // 6. الشاشة
  const resolution = `${window.screen.width} × ${window.screen.height} بكسل`;
  const pixelRatio = `${window.devicePixelRatio || 1}x`;

  let orientation = 'أفقي (Landscape)';
  if (window.screen.orientation?.type) {
    orientation = window.screen.orientation.type.includes('portrait') ? 'عمودي (Portrait)' : 'أفقي (Landscape)';
  } else if (window.innerHeight > window.innerWidth) {
    orientation = 'عمودي (Portrait)';
  }

  // 7. المنطقة الزمنية واللغة
  const lang = navigator.language || 'غير محدد';
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'غير محدد';
  const offsetHours = -(new Date().getTimezoneOffset() / 60);
  const offsetStr = `UTC${offsetHours >= 0 ? '+' : ''}${offsetHours}`;
  const languageAndTimezone = `${lang} · ${timeZone} (${offsetStr})`;
  const localTime = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // 8. شبكة الاتصال
  let networkType = 'غير مكشوفة';
  let networkSpeed = 'غير محدد';
  const conn = (navigator as unknown as { connection?: { effectiveType?: string; downlink?: number; rtt?: number } }).connection;
  if (conn) {
    networkType = conn.effectiveType ? conn.effectiveType.toUpperCase() : 'Wi-Fi / Cellular';
    networkSpeed = conn.downlink ? `${conn.downlink} Mbps تقريباً (Latency: ${conn.rtt || 0}ms)` : 'سرعة قياسية';
  }

  // 9. المعالجة والذاكرة
  const hardwareCores = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} أنوية معالجة` : 'غير مصرح';
  const devMem = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
  const deviceMemory = devMem ? `${devMem} GB RAM تقريباً` : 'محمي من النظام';
  const touchPoints = navigator.maxTouchPoints ? `${navigator.maxTouchPoints} نقاط لمس متزامنة` : 'لا توجد شاشة لمس';

  return {
    deviceAndOS: os,
    phoneModel,
    phoneBrand,
    deviceType,
    batteryLevel,
    batteryStatus,
    batteryCharging,
    batteryNote,
    gpuRenderer: gpu.renderer,
    gpuVendor: gpu.vendor,
    systemTheme,
    inputMethod,
    hoverSupport,
    browserAndVersion: browser,
    browserEngine,
    screenResolution: resolution,
    pixelRatio,
    orientation,
    languageAndTimezone,
    localTime,
    networkType,
    networkSpeed,
    hardwareCores,
    deviceMemory,
    touchPoints,
    rawUserAgent: ua,
  };
}

export function generateCleanSingleHtml(data: RealFingerprintData): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>لوحة تشخيص البصمة الرقمية للهاتف والمتصفح - Digital Footprint Demo</title>
  <style>
    :root {
      --bg: #070b13;
      --card-bg: #0f172a;
      --border: #1e293b;
      --border-hover: #334155;
      --primary: #10b981;
      --cyan: #38bdf8;
      --purple: #c084fc;
      --amber: #f59e0b;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --code-bg: #030712;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      padding: 24px 16px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .container { max-width: 980px; width: 100%; }
    header { margin-bottom: 24px; text-align: center; }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      color: var(--primary);
      margin-bottom: 6px;
      font-family: monospace;
      letter-spacing: 0.5px;
    }
    h1 {
      font-size: clamp(20px, 4vw, 28px);
      font-weight: 700;
      color: var(--text);
      margin-bottom: 6px;
    }
    .subtitle {
      color: var(--text-muted);
      font-size: 14px;
      max-width: 680px;
      margin: 0 auto;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 14px;
      margin-bottom: 20px;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 18px;
      transition: border-color 0.2s;
    }
    .card:hover { border-color: var(--border-hover); }
    .card-title {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-muted);
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .card-value {
      font-size: 16px;
      font-weight: 700;
      color: var(--text);
      direction: ltr;
      text-align: right;
      font-family: monospace;
      word-break: break-word;
    }
    .card-value.highlight { color: var(--primary); }
    .card-value.cyan { color: var(--cyan); }
    .card-value.purple { color: var(--purple); font-size: 13px; }
    .card-value.amber { color: var(--amber); }
    .card-note { font-size: 11px; color: var(--text-muted); margin-top: 6px; }
    .sandbox-sec {
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .sandbox-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 14px;
      margin: 14px 0;
      font-size: 12px;
    }
    .leaked-box {
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 14px;
      border-radius: 8px;
    }
    .protected-box {
      background: rgba(56, 189, 248, 0.08);
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 14px;
      border-radius: 8px;
    }
    .btn-test {
      background: #0284c7;
      color: #fff;
      border: none;
      padding: 8px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      transition: background 0.2s;
    }
    .btn-test:hover { background: #0369a1; }
    .raw-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 18px;
      margin-bottom: 20px;
    }
    .raw-title { font-size: 13px; font-weight: 600; color: var(--text-muted); margin-bottom: 8px; }
    .raw-box {
      background: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      font-family: monospace;
      font-size: 12px;
      color: #94a3b8;
      word-break: break-all;
      direction: ltr;
      text-align: left;
    }
    .banner {
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.35);
      border-radius: 12px;
      padding: 18px;
    }
    .banner-title { font-weight: 700; color: var(--primary); font-size: 15px; margin-bottom: 6px; }
    .banner-text { font-size: 14px; color: #e2e8f0; line-height: 1.7; }
    footer { margin-top: 28px; text-align: center; font-size: 12px; color: var(--text-muted); }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="badge">● LIVE CLIENT RECONNAISSANCE · SECURITY DEMO</div>
      <h1>لوحة تشخيص البصمة الرقمية للهاتف والمتصفح</h1>
      <p class="subtitle">فحص حقيقي يكشف ما يشاركه هاتفك تلقائياً (البطارية، الموديل، كرت الشاشة، المظهر)، وما يمنعه جدار الحماية (الصور، GPS).</p>
    </header>

    <div class="grid">
      <!-- 1. اسم وموديل الهاتف -->
      <div class="card">
        <div class="card-title">📱 طراز وموديل الهاتف / الجهاز</div>
        <div class="card-value cyan" id="p-model">${data.phoneModel}</div>
        <div class="card-note">نظام التشغيل: ${data.deviceAndOS}</div>
      </div>

      <!-- 2. شحن البطارية -->
      <div class="card">
        <div class="card-title">🔋 نسبة وحالة شحن البطارية (Battery API)</div>
        <div class="card-value highlight" id="p-batt">${data.batteryStatus}</div>
        <div class="card-note" id="p-batt-note">${data.batteryNote}</div>
      </div>

      <!-- 3. كرت الشاشة GPU -->
      <div class="card">
        <div class="card-title">🎮 معالج الرسوميات (GPU WebGL)</div>
        <div class="card-value purple" id="p-gpu">${data.gpuRenderer}</div>
        <div class="card-note">المصنّع: ${data.gpuVendor}</div>
      </div>

      <!-- 4. مظهر النظام وأسلوب الإدخال -->
      <div class="card">
        <div class="card-title">🌓 مظهر النظام وأسلوب الإدخال</div>
        <div class="card-value amber" id="p-theme">${data.systemTheme}</div>
        <div class="card-note">${data.inputMethod} · ${data.hoverSupport}</div>
      </div>

      <!-- 5. بصمة الشبكة والاتصال (Network Footprint) -->
      <div class="card">
        <div class="card-title">🌐 بصمة الشبكة والاتصال (Network Footprint)</div>
        <div class="card-value cyan" id="p-ip">جاري التحميل...</div>
        <div class="card-note" id="p-isp">مزود الخدمة: جاري الفحص...</div>
        <div class="card-note" id="p-loc" style="color: #cbd5e1; font-weight: 500; margin-top: 3px;">الموقع: جاري التحديد...</div>
      </div>

      <!-- 6. شبكة الاتصال والسرعة -->
      <div class="card">
        <div class="card-title">📶 نوع وسرعة شبكة الاتصال</div>
        <div class="card-value cyan" id="p-net">${data.networkType} (${data.networkSpeed})</div>
        <div class="card-note">تُستخرج عبر واجهة Network Information API</div>
      </div>

      <!-- 6. المتصفح -->
      <div class="card">
        <div class="card-title">🌐 اسم المتصفح وإصداره</div>
        <div class="card-value highlight" id="p-browser">${data.browserAndVersion}</div>
        <div class="card-note">المحرك: ${data.browserEngine}</div>
      </div>

      <!-- 7. الشاشة -->
      <div class="card">
        <div class="card-title">🖥️ أبعاد ودقة الشاشة (Display)</div>
        <div class="card-value" id="p-screen">${data.screenResolution}</div>
        <div class="card-note">كثافة البكسل: ${data.pixelRatio} · ${data.orientation}</div>
      </div>

      <!-- 8. المعالجة والذاكرة -->
      <div class="card">
        <div class="card-title">⚡ المعالجة والذاكرة (Hardware)</div>
        <div class="card-value amber" id="p-hw">${data.hardwareCores}</div>
        <div class="card-note">الذاكرة: ${data.deviceMemory} · ${data.touchPoints}</div>
      </div>

      <!-- 9. اللغة والتوقيت -->
      <div class="card">
        <div class="card-title">🌍 لغة النظام والمنطقة الزمنية</div>
        <div class="card-value" id="p-tz">${data.languageAndTimezone}</div>
        <div class="card-note">الوقت في جهازك: ${data.localTime}</div>
      </div>
    </div>

    <!-- قسم المقارنة الأمنية التفاعلي -->
    <div class="sandbox-sec">
      <div style="font-weight: 700; color: #10b981; font-size: 15px;">🛡️ المفهوم الأمني: الفارق بين البيانات المكشوفة والبيانات المحمية (Sandbox)</div>
      <div class="sandbox-grid">
        <div class="leaked-box">
          <strong style="color: #10b981;">⚠️ مكشوف تلقائياً (بدون إذن):</strong>
          <ul style="margin-top: 6px; padding-right: 16px;">
            <li>نسبة شحن البطارية وحالة التوصيل بالشاحن</li>
            <li>اسم وموديل الهاتف الدقيق ونظام التشغيل</li>
            <li>شريحة كرت الشاشة (GPU WebGL)</li>
            <li>مظهر النظام (Dark/Light Mode) وأبعاد الشاشة</li>
          </ul>
        </div>
        <div class="protected-box">
          <strong style="color: #38bdf8;">🔒 محمي بجدار المتصفح (يتطلب إذن صريح):</strong>
          <ul style="margin-top: 6px; padding-right: 16px;">
            <li>صور الاستوديو والملفات (ممنوع تماماً)</li>
            <li>جهات الاتصال والإيميل المسجل (معزولة)</li>
            <li>إحداثيات الموقع الدقيق GPS (يتطلب موافقة)</li>
            <li>الكاميرا والميكروفون (نافذة تصريح رسمية)</li>
          </ul>
        </div>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: gap: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.06);">
        <span style="font-size: 12px; color: #94a3b8;">شاهد تدخل نظام الهاتف لحمايتك عند طلب بيانات حساسة:</span>
        <button class="btn-test" onclick="testGPS()">اختبار طلب إذن الموقع (GPS)</button>
      </div>
      <div id="gps-status" style="margin-top: 10px; font-size: 11px; font-family: monospace; color: #38bdf8;"></div>
    </div>

    <!-- نص User-Agent الكامل الفعلي -->
    <div class="raw-card">
      <div class="raw-title">🔍 نص معرّف المتصفح الكامل (User-Agent String):</div>
      <div class="raw-box" id="p-ua">${data.rawUserAgent}</div>
    </div>

    <!-- الرسالة التوعوية المطلوبة -->
    <div class="banner">
      <div class="banner-title">🛡️ رسالة توعوية أمنية (Security Note):</div>
      <p class="banner-text">
        <strong>هذه البيانات يرسلها المتصفح بشكل طبيعي لأي خادم ويب، وتُستخدم في التحليل الأمني وتحديد بيئة الهدف (Reconnaissance).</strong>
      </p>
    </div>

    <footer>
      بيانات حقيقية 100% مستخرجة مباشرة من جهازك الحالي بدون أي حفظ خارجي أو تعقب.
    </footer>
  </div>

  <script>
    // Live Battery update
    if (navigator.getBattery) {
      navigator.getBattery().then(function(b) {
        function updateB() {
          var pct = Math.round(b.level * 100);
          var txt = b.charging ? ('⚡ جاري الشحن (' + pct + '%)') : ('🔋 يعمل على البطارية (' + pct + '%)');
          var el = document.getElementById('p-batt');
          if (el) el.textContent = txt;
        }
        updateB();
        b.addEventListener('chargingchange', updateB);
        b.addEventListener('levelchange', updateB);
      }).catch(function(){});
    }

    // GPS test
    function testGPS() {
      var st = document.getElementById('gps-status');
      if (!navigator.geolocation) {
        st.textContent = 'واجهة الموقع غير مدعومة في هذا المتصفح.';
        return;
      }
      st.textContent = 'جارٍ إظهار نافذة المتصفح الرسمية لطلب إذنك...';
      navigator.geolocation.getCurrentPosition(
        function(pos) {
          st.textContent = '✅ وافقت على الإذن: تم جلب الإحداثيات بنجاح (' + pos.coords.latitude.toFixed(3) + ', ' + pos.coords.longitude.toFixed(3) + '). لاحظ أن المتصفح لم يشاركها إلا بعد موافقتك الصريحة!';
        },
        function(err) {
          st.textContent = '🛡️ تم رفض الإذن: منع جدار حماية المتصفح أخذ موقعك، بعكس مواصفات الهاتف التي كُشفت تلقائياً!';
        }
      );
    }

    // جلب بصمة الشبكة: الـ IP العام ومزود الخدمة والمدينة والدولة
    async function loadNetworkFootprint() {
      var ipEl = document.getElementById('p-ip');
      var ispEl = document.getElementById('p-isp');
      var locEl = document.getElementById('p-loc');

      // 1. المحاولة الأساسية عبر ipapi.co
      try {
        var res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
          var d = await res.json();
          if (d && d.ip) {
            if (ipEl) ipEl.textContent = d.ip;
            if (ispEl) ispEl.textContent = 'مزود الخدمة: ' + (d.org || d.asn || 'شركة اتصالات محلية');
            if (locEl) locEl.textContent = 'الموقع: ' + [d.city, d.country_name].filter(Boolean).join('، ');
            return;
          }
        }
      } catch (e) {}

      // 2. المحاولة البديلة الأولى عبر ipwho.is
      try {
        var res2 = await fetch('https://ipwho.is/');
        if (res2.ok) {
          var d2 = await res2.json();
          if (d2 && d2.ip) {
            if (ipEl) ipEl.textContent = d2.ip;
            if (ispEl) ispEl.textContent = 'مزود الخدمة: ' + ((d2.connection && d2.connection.isp) || 'شركة اتصالات');
            if (locEl) locEl.textContent = 'الموقع: ' + [d2.city, d2.country].filter(Boolean).join('، ');
            return;
          }
        }
      } catch (e2) {}

      // 3. المحاولة البديلة الثانية عبر api.ipify.org
      try {
        var res3 = await fetch('https://api.ipify.org?format=json');
        if (res3.ok) {
          var d3 = await res3.json();
          if (d3 && d3.ip) {
            if (ipEl) ipEl.textContent = d3.ip;
            if (ispEl) ispEl.textContent = 'مزود الخدمة: مزود إنترنت محلي';
            if (locEl) locEl.textContent = 'الموقع: موقع الشبكة التقديري';
            return;
          }
        }
      } catch (e3) {}

      if (ipEl) ipEl.textContent = 'تعذر الجلب (مانع إعلانات)';
      if (ispEl) ispEl.textContent = 'مزود الخدمة: غير متاح';
      if (locEl) locEl.textContent = 'الموقع: غير متاح';
    }
    loadNetworkFootprint();
  </script>
</body>
</html>`;
}
