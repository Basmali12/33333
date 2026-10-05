/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Smartphone,
  Battery,
  BatteryCharging,
  Globe,
  Monitor,
  Clock,
  Wifi,
  Cpu,
  Layers,
  Moon,
  Copy,
  Check,
  RefreshCw,
  QrCode,
  Terminal,
  Lock,
  MapPin,
  Camera,
  Image as ImageIcon,
  Users,
  History,
  Share2,
  FileText,
  AlertTriangle,
  Scan
} from 'lucide-react';
import {
  detectRealClientEnhanced,
  fetchPublicNetworkData,
  RealFingerprintData,
  NetworkIpData
} from './utils/fingerprint';
import { QrCardModal } from './components/QrCardModal';
import { ScanLogModal, ScanLogEntry } from './components/ScanLogModal';
import { ShareModal } from './components/ShareModal';
import { ImageForensicsTab } from './components/ImageForensicsTab';

export default function App() {
  const [activeTab, setActiveTab] = useState<'recon' | 'forensics'>('recon');
  const [data, setData] = useState<RealFingerprintData | null>(null);
  const [networkIp, setNetworkIp] = useState<NetworkIpData>({
    ip: 'جاري التحميل...',
    isp: 'جاري الفحص...',
    location: 'جاري التحديد...',
    country: '',
    city: '',
    loading: true,
  });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [showLogsModal, setShowLogsModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [scanLogs, setScanLogs] = useState<ScanLogEntry[]>([]);

  // تحميل السجل المحفوظ محلياً عند بدء التشغيل
  useEffect(() => {
    try {
      const saved = localStorage.getItem('recon_scan_logs');
      if (saved) {
        setScanLogs(JSON.parse(saved));
      }
    } catch {
      // Ignore
    }
  }, []);

  // تحديث البيانات وقراءة البطارية والموديل بشكل حي وحفظ السجل
  const refreshData = async () => {
    setLoading(true);
    try {
      const res = await detectRealClientEnhanced();
      setData(res);

      // جلب بصمة الـ IP العام ومزود الخدمة بشكل غير متزامن
      fetchPublicNetworkData().then((netData) => {
        setNetworkIp(netData);
      });

      // تسجيل الفحص في سجل الفحوصات المحلي
      const newEntry: ScanLogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        phoneModel: res.phoneModel,
        deviceAndOS: res.deviceAndOS,
        batteryStatus: res.batteryStatus,
        gpuRenderer: res.gpuRenderer,
        screenResolution: res.screenResolution,
        networkType: res.networkType,
      };

      setScanLogs((prev) => {
        // منع التكرار الفوري إذا كان الفحص الأخير هو نفس الجهاز في نفس الدقيقة
        const isDuplicate = prev.length > 0 && prev[0].phoneModel === newEntry.phoneModel && prev[0].batteryStatus === newEntry.batteryStatus;
        if (isDuplicate) return prev;

        const updated = [newEntry, ...prev.slice(0, 19)]; // حفظ آخر 20 فحص
        try {
          localStorage.setItem('recon_scan_logs', JSON.stringify(updated));
        } catch {
          // Ignore
        }
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();

    // الاستماع لتغييرات حالة البطارية والشاحن فوراً في المتصفح
    let batteryInstance: any = null;
    const updateBatteryLive = () => {
      if (batteryInstance) {
        const pct = Math.round(batteryInstance.level * 100);
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            batteryLevel: `${pct}%`,
            batteryCharging: batteryInstance.charging,
            batteryStatus: batteryInstance.charging ? `⚡ جاري الشحن (${pct}%)` : `🔋 يعمل على البطارية (${pct}%)`,
          };
        });
      }
    };

    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((b: any) => {
        batteryInstance = b;
        b.addEventListener('chargingchange', updateBatteryLive);
        b.addEventListener('levelchange', updateBatteryLive);
      }).catch(() => {});
    }

    const handleResize = () => refreshData();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (batteryInstance) {
        batteryInstance.removeEventListener('chargingchange', updateBatteryLive);
        batteryInstance.removeEventListener('levelchange', updateBatteryLive);
      }
    };
  }, []);

  const handleClearLogs = () => {
    setScanLogs([]);
    try {
      localStorage.removeItem('recon_scan_logs');
    } catch {
      // Ignore
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // تجربة حية تطلب إذن الموقع الجغرافي لتوضيح الفرق بين البيانات المكشوفة والمحمية
  const testLocationPermission = () => {
    if (!navigator.geolocation) {
      setGeoStatus('واجهة الموقع الجغرافي غير مدعومة في هذا المتصفح.');
      return;
    }
    setGeoStatus('جارٍ إظهار نافذة المتصفح لطلب الإذن الصريح...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoStatus(`✅ تم منح الإذن بنجاح: خط العرض ${pos.coords.latitude.toFixed(4)}، خط الطول ${pos.coords.longitude.toFixed(4)} (لاحظ أن المتصفح لم يشاركها إلا بعد موافقتك الصريحة!)`);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoStatus('🛡️ تم رفض الإذن من قِبل المستخدم. لاحظ أن جدار حماية المتصفح منع الموقع تماماً من معرفة مكانك، بعكس مواصفات الهاتف التي تم كشفها تلقائياً!');
        } else {
          setGeoStatus(`تعذر تحديد الموقع: ${err.message}`);
        }
      },
      { timeout: 10000 }
    );
  };

  const formatReportText = () => {
    if (!data) return '';
    return `=== تقرير استطلاع البصمة الرقمية للهاتف والمتصفح ===
الجهاز والموديل: ${data.phoneModel} (${data.deviceType})
نظام التشغيل: ${data.deviceAndOS}
معالج الرسوميات (GPU): ${data.gpuRenderer} (${data.gpuVendor})
مظهر النظام: ${data.systemTheme} | الإدخال: ${data.inputMethod}

عنوان الـ IP العام: ${networkIp.ip}
مزود خدمة الإنترنت (ISP): ${networkIp.isp}
الموقع الجغرافي للشبكة: ${networkIp.location}

شحن البطارية: ${data.batteryStatus} (${data.batteryNote})
المتصفح: ${data.browserAndVersion} (محرك العرض: ${data.browserEngine})
أبعاد الشاشة: ${data.screenResolution} (كثافة: ${data.pixelRatio} - اتجاه: ${data.orientation})
الشبكة: ${data.networkType} (${data.networkSpeed})
العتاد: ${data.hardwareCores} | الذاكرة: ${data.deviceMemory}
اللغة والتوقيت: ${data.languageAndTimezone} (الوقت المحلي: ${data.localTime})

User-Agent:
${data.rawUserAgent}

رسالة أمنية: هذه البيانات يرسلها المتصفح تلقائياً عند فتح الرابط، وتُستخدم في تحديد بيئة الهدف (Reconnaissance).`;
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-[#070b13] flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
          <span>جارٍ فحص الهاتف واستخراج نسبة الشحن والمواصفات الحية...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      
      {/* Top Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base sm:text-lg text-slate-100 tracking-tight">
                لوحة تشخيص البصمة الرقمية للهاتف
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline mr-2 font-mono">
                Digital Footprint Demo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowQrModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 rounded-lg hover:bg-emerald-900/60 transition-colors whitespace-nowrap shadow-sm"
              title="توليد بطاقة QR لمسحها عبر كاميرا الهاتف"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>بطاقة الـ QR</span>
            </button>

            <button
              onClick={() => setShowLogsModal(true)}
              className="relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-700/80 rounded-lg hover:bg-slate-800 hover:border-slate-600 transition-colors whitespace-nowrap"
              title="عرض سجل الفحوصات والأجهزة المسجلة"
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>سجل الفحوصات</span>
              {scanLogs.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center border border-amber-500/30 mr-0.5">
                  {scanLogs.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap shadow-sm"
              title="إرسال ومشاركة التقرير عبر واتساب أو البريد"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>إرسال التقرير</span>
            </button>

            <button
              onClick={refreshData}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
              title="إعادة فحص المتصفح الآن"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setActiveTab('recon')}
            className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'recon'
                ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-950/30'
                : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>بصمة الجهاز والشبكة (Reconnaissance)</span>
          </button>

          <button
            onClick={() => setActiveTab('forensics')}
            className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'forensics'
                ? 'bg-cyan-950/70 border border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-950/30'
                : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Scan className="w-4 h-4 text-cyan-400" />
            <span>المحلل الجنائي</span>
            <span className="text-[10px] font-mono bg-cyan-950 px-1.5 py-0.5 rounded text-cyan-300 border border-cyan-800/60 hidden sm:inline">
              جديد
            </span>
          </button>
        </div>

        {activeTab === 'forensics' ? (
          <ImageForensicsTab />
        ) : (
          <>
            {/* Title Banner */}
            <section className="text-center sm:text-right space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 px-2.5 py-1 bg-emerald-950/40 border border-emerald-500/20 rounded-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>استطلاع فوري حي للهاتف والبطارية مع ميزة حفظ وإرسال السجل</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
                لوحة تشخيص البصمة الرقمية للمتصفح والهاتف
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-3xl leading-relaxed">
                عند مسح الرمز بالهاتف أو فتح الرابط، يستطيع أي خادم ويب قراءة <strong>نسبة شحن البطارية</strong>، و<strong>طراز الهاتف</strong>، و<strong>معالج الرسوميات (GPU)</strong>، و<strong>مظهر النظام</strong> تلقائياً دون إذن. ويمكنك أرشفة الفحوصات وإرسال التقرير فوراً.
              </p>
            </section>

        {/* Live Metrics Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          
          {/* 1. اسم وموديل الهاتف الفعلي */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                  <Smartphone className="w-4 h-4 text-sky-400" />
                  <span>طراز وموديل الهاتف / الجهاز</span>
                </div>
                <span className="text-[10px] font-mono text-sky-400 bg-sky-950/50 px-2 py-0.5 rounded border border-sky-800/60">
                  DEVICE MODEL
                </span>
              </div>
              <div className="pt-1">
                <div className="text-xs text-slate-400 mb-1">الموديل المكتشف:</div>
                <div className="font-mono text-base font-bold text-sky-300 leading-snug select-all" dir="ltr">
                  {data.phoneModel}
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  النظام: <span className="font-mono text-slate-200" dir="ltr">{data.deviceAndOS}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. نسبة وحالة شحن البطارية الفورية */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                  {data.batteryCharging ? (
                    <BatteryCharging className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Battery className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>نسبة وحالة شحن البطارية</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/60">
                  BATTERY API
                </span>
              </div>
              <div className="pt-1">
                <div className="text-xs text-slate-400 mb-1">الحالة المباشرة الآن:</div>
                <div className="font-mono text-base font-bold text-emerald-400 select-all" dir="ltr">
                  {data.batteryStatus}
                </div>
                <div className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  {data.batteryNote}
                </div>
              </div>
            </div>
          </div>

          {/* 3. كرت الشاشة ومعالج الرسوميات المكشوف (GPU) */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>معالج الرسوميات (GPU WebGL)</span>
                </div>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-950/50 px-2 py-0.5 rounded border border-purple-800/60">
                  GPU CHIPSET
                </span>
              </div>
              <div className="pt-1">
                <div className="text-xs text-slate-400 mb-1">شريحة المعالجة الرسومية:</div>
                <div className="font-mono text-xs font-bold text-purple-300 leading-snug break-all select-all" dir="ltr">
                  {data.gpuRenderer}
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  المصنع: <span className="font-mono text-slate-200">{data.gpuVendor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. مظهر وإعدادات النظام الحية */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                  <Moon className="w-4 h-4 text-amber-400" />
                  <span>مظهر النظام وأسلوب الإدخال</span>
                </div>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/60">
                  SYSTEM THEME
                </span>
              </div>
              <div className="pt-1">
                <div className="text-xs text-slate-400 mb-1">مظهر شاشة الهاتف/الحاسوب:</div>
                <div className="font-mono text-base font-bold text-amber-300 select-all" dir="ltr">
                  {data.systemTheme}
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  {data.inputMethod} · {data.hoverSupport}
                </div>
              </div>
            </div>
          </div>

          {/* 5. بصمة الشبكة والاتصال (Network Footprint) */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>بصمة الشبكة والاتصال (Network Footprint)</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/60">
                  PUBLIC IP & ISP
                </span>
              </div>
              <div className="pt-1">
                <div className="text-xs text-slate-400 mb-1">عنوان الـ IP العام:</div>
                <div className="font-mono text-base font-bold text-cyan-300 leading-snug select-all flex items-center gap-2" dir="ltr">
                  {networkIp.loading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0" />}
                  <span>{networkIp.ip}</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-2 space-y-0.5">
                  <div>مزود الخدمة: <span className="font-mono text-slate-100">{networkIp.isp}</span></div>
                  <div>الموقع التقديري: <span className="font-mono text-slate-100">{networkIp.location}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* 6. شبكة الاتصال وسرعتها */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                  <Wifi className="w-4 h-4 text-indigo-400" />
                  <span>شبكة الاتصال والسرعة</span>
                </div>
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-800/60">
                  NETWORK
                </span>
              </div>
              <div className="pt-1">
                <div className="text-xs text-slate-400 mb-1">نوع الاتصال:</div>
                <div className="font-mono text-base font-bold text-indigo-300 select-all" dir="ltr">
                  {data.networkType}
                </div>
                <div className="text-[11px] text-slate-400 mt-2" dir="ltr">
                  {data.networkSpeed}
                </div>
              </div>
            </div>
          </div>

          {/* 6. اسم المتصفح وإصداره */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                  <Globe className="w-4 h-4 text-sky-400" />
                  <span>اسم المتصفح وإصداره</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  BROWSER
                </span>
              </div>
              <div className="pt-1">
                <div className="text-xs text-slate-400 mb-1">المتصفح النشط:</div>
                <div className="font-mono text-base font-bold text-slate-100 select-all" dir="ltr">
                  {data.browserAndVersion}
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  المحرك: <span className="font-mono text-slate-300" dir="ltr">{data.browserEngine}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 7. أبعاد ودقة الشاشة والاتجاه */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                  <Monitor className="w-4 h-4 text-purple-400" />
                  <span>أبعاد الشاشة ودقتها (Display)</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  SCREEN
                </span>
              </div>
              <div className="pt-1">
                <div className="text-xs text-slate-400 mb-1">الدقة الفعلية:</div>
                <div className="font-mono text-base font-bold text-slate-100 select-all" dir="ltr">
                  {data.screenResolution}
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  كثافة البكسل: <span className="font-mono text-slate-300">{data.pixelRatio}</span> · {data.orientation}
                </div>
              </div>
            </div>
          </div>

          {/* 8. مواصفات المعالجة والذاكرة المكشوفة */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  <span>المعالجة والذاكرة (Hardware)</span>
                </div>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/60">
                  HARDWARE
                </span>
              </div>
              <div className="pt-1">
                <div className="text-xs text-slate-400 mb-1">أنوية المعالج والرام:</div>
                <div className="font-mono text-base font-bold text-amber-300 select-all" dir="ltr">
                  {data.hardwareCores}
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  الذاكرة: {data.deviceMemory} · {data.touchPoints}
                </div>
              </div>
            </div>
          </div>

          {/* 9. المنطقة الزمنية واللغة */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>لغة النظام والمنطقة الزمنية</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/60">
                  TIMEZONE
                </span>
              </div>
              <div className="pt-1">
                <div className="text-xs text-slate-400 mb-1">المنطقة والوقت المحلي:</div>
                <div className="font-mono text-sm font-bold text-emerald-300 select-all" dir="ltr">
                  {data.languageAndTimezone}
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  الوقت في جهازك: <span className="font-mono text-slate-200">{data.localTime}</span>
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* INTERACTIVE SECURITY AWARENESS & PERMISSION SANDBOX TEST */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-slate-100 font-bold text-base">
              <Lock className="w-5 h-5 text-emerald-400" />
              <span>مفهوم أمني محوري: الفارق بين البيانات المكشوفة والبيانات المحمية (Browser Sandbox)</span>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800/60">
              EDUCATIONAL COMPARISON
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Left: What is leaked automatically */}
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-4 space-y-2">
              <div className="font-bold text-emerald-400 text-sm flex items-center gap-1.5">
                <span>⚠️ ما يستطيع أي رابط كشفه فوراً (بدون إذن):</span>
              </div>
              <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                <li>نسبة وحالة شحن البطارية (Battery API)</li>
                <li>طراز الهاتف الدقيق وموديله ونظامه (Device & OS)</li>
                <li>معالج الرسوميات وكرت الشاشة (GPU WebGL)</li>
                <li>دقة الشاشة وأبعادها واتجاهها (Resolution)</li>
                <li>مظهر النظام (الوضع الليلي Dark Mode أو الفاتح)</li>
                <li>نوع اتصال الشبكة وسرعتها التقريبية</li>
              </ul>
              <div className="text-emerald-400/90 font-medium text-[11px] pt-1">
                السبب: يرسلها المتصفح تلقائياً لتنسيق أبعاد الصفحة بما يتوافق مع جهازك!
              </div>
            </div>

            {/* Right: What the browser protects strictly */}
            <div className="bg-sky-950/20 border border-sky-500/30 rounded-lg p-4 space-y-2">
              <div className="font-bold text-sky-400 text-sm flex items-center gap-1.5">
                <span>🛡️ ما يحميه جدار المتصفح ويمنع كشفه (إلا بإذن صريح):</span>
              </div>
              <ul className="space-y-1.5 text-slate-300">
                <li className="flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5 text-sky-400" /> صور الاستوديو والملفات الشخصية (ممنوعة تماماً)</li>
                <li className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-sky-400" /> جهات الاتصال وحسابات البريد المسجلة (معزولة)</li>
                <li className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-sky-400" /> سجل المواقع التي زرتها سابقاً (محمي بعزل التصفح)</li>
                <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-sky-400" /> إحداثيات الموقع الدقيق GPS (تتطلب موافقة)</li>
                <li className="flex items-center gap-1.5"><Camera className="w-3.5 h-3.5 text-sky-400" /> الكاميرا والميكروفون (تتطلب نافذة إذن صريحة)</li>
              </ul>
              <div className="text-sky-300 font-medium text-[11px] pt-1">
                جدار العزل (Sandbox): يمنع أي موقع ويب من الوصول للملفات الخاصة أو سجل التصفح القديم.
              </div>
            </div>
          </div>

          {/* Live Permission Test Button for Presentation */}
          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-lg space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-200 text-xs sm:text-sm">
                  تجربة حية أمام اللجنة: شاهد كيف يتدخل نظام الهاتف لحمايتك عند طلب بيانات حساسة!
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  اضغط الزر لتطلب الصفحة الموقع الجغرافي (GPS)، وراقب ظهور نافذة الاستئذان الرسمية:
                </div>
              </div>
              <button
                onClick={testLocationPermission}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors shrink-0 shadow-sm"
              >
                <MapPin className="w-4 h-4" />
                <span>اختبار طلب إذن الموقع (GPS)</span>
              </button>
            </div>

            {geoStatus && (
              <div className="p-2.5 rounded bg-slate-900 border border-sky-500/40 text-xs text-sky-300 leading-relaxed font-mono">
                {geoStatus}
              </div>
            )}
          </div>
        </section>

        {/* Real User-Agent String */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-slate-200 text-sm">
                نص معرّف المتصفح الكامل الحقيقي (User-Agent String):
              </h3>
            </div>
            <button
              onClick={() => handleCopy(data.rawUserAgent, 'ua-raw')}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              {copiedKey === 'ua-raw' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ النص</span>
                </>
              )}
            </button>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-300 break-all text-left select-all" dir="ltr">
            {data.rawUserAgent}
          </div>
        </section>

        {/* MANDATORY SECURITY AWARENESS CALLOUT (المتطلب رقم 4 ورقم 5) */}
        <section className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-base sm:text-lg">
            <AlertTriangle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>رسالة توعوية أمنية (Security Awareness Note)</span>
          </div>

          <p className="text-sm sm:text-base font-semibold text-slate-100 bg-slate-950/60 border border-emerald-500/20 p-3.5 rounded-lg leading-relaxed">
            "هذه البيانات يرسلها المتصفح بشكل طبيعي لأي خادم ويب، وتُستخدم في التحليل الأمني وتحديد بيئة الهدف (Reconnaissance)."
          </p>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            الهدف من هذا العرض إثبات أن مجرد فتح رابط عادي في المتصفح أو عبر مسح رمز QR يمكّن الطرف الآخر من معرفة <strong>نوع هاتفك بدقة</strong>، و<strong>نسبة شحن بطاريتك</strong>، و<strong>طراز كرت الشاشة</strong>، و<strong>مظهر نظامك</strong>، دون أن يطلب المتصفح منك أي موافقة. وتُستغل هذه التفاصيل في مرحلة جمع المعلومات (Reconnaissance) في الهجمات السيبرانية.
          </p>

          <div className="pt-2 flex items-center gap-2 text-xs text-emerald-400/90 font-mono">
            <Lock className="w-3.5 h-3.5" />
            <span>عرض فوري محلي 100% يعمل داخل متصفح هاتفك أو حاسوبك دون تخزين أو إرسال أي بيانات لخوادم خارجية.</span>
          </div>
        </section>
        </>
      )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/50 py-6 text-center text-xs text-slate-400 mt-8 space-y-2">
        <p>لوحة تشخيص البصمة الرقمية للهاتف والمتصفح - Security Awareness Demo</p>
        <div className="flex items-center justify-center gap-4 text-slate-400">
          <button
            onClick={() => setShowQrModal(true)}
            className="hover:text-emerald-400 transition-colors underline underline-offset-4"
          >
            بطاقة الـ QR للعرض التقديمي
          </button>
          <span>·</span>
          <button
            onClick={() => setShowLogsModal(true)}
            className="hover:text-amber-400 transition-colors underline underline-offset-4"
          >
            سجل الفحوصات ({scanLogs.length})
          </button>
          <span>·</span>
          <button
            onClick={() => setShowShareModal(true)}
            className="hover:text-sky-400 transition-colors underline underline-offset-4"
          >
            إرسال التقرير
          </button>
        </div>
      </footer>

      {/* Modal: QR Code Demo Card Generator */}
      <QrCardModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
      />

      {/* Modal: Scan Logs History */}
      <ScanLogModal
        isOpen={showLogsModal}
        onClose={() => setShowLogsModal(false)}
        logs={scanLogs}
        onClearLogs={handleClearLogs}
        onShareLogs={() => {
          setShowLogsModal(false);
          setShowShareModal(true);
        }}
      />

      {/* Modal: Share Report Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        reportText={formatReportText()}
        phoneModel={data.phoneModel}
      />
    </div>
  );
}
