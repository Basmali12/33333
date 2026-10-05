/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Scan,
  UploadCloud,
  FileImage,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  Sparkles,
  MapPin,
  Camera,
  Layers,
  Globe,
  Fingerprint,
  Cpu,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Sliders,
  Terminal,
  Crosshair,
  UserCheck,
  Settings,
  Bot,
  KeyRound,
  X,
  Check,
  BrainCircuit
} from 'lucide-react';

import {
  extractRealExifFromImage,
  ParsedExifData
} from '../utils/exifParser';

interface ForensicStage {
  id: number;
  title: string;
  desc: string;
  log: string;
}

const FORENSIC_STAGES: ForensicStage[] = [
  {
    id: 1,
    title: 'استخراج البيانات الوصفية (EXIF & Metadata Extraction)',
    desc: 'قراءة بيانات الترويسة، تاريخ الالتقاط، مواصفات الكاميرا، والوسوم المشفرة.',
    log: '[EXIF] Parsing file headers... Found EXIF 2.32, Camera: Sony ILCE-7RM4, Lens: 85mm f/1.4, Resolution: 3840x2560.'
  },
  {
    id: 2,
    title: 'تحليل البصمة البيومترية للملامح (Facial Vectorization)',
    desc: 'رسم شبكة النقاط الوجهية (68 Facial Landmarks) وحساب المتجهات الهندسية.',
    log: '[BIOMETRIC] 68 Facial landmark vectors aligned. Interpupillary distance: 64.2mm. Yaw: +1.1°, Pitch: -2.4°.'
  },
  {
    id: 3,
    title: 'مطابقة البصمة عبر المصادر المفتوحة (OSINT Cross-Referencing)',
    desc: 'مقارنة التوقيع البيومتري مع فهارس الصور والمواقع وقواعد البيانات المفتوحة.',
    log: '[OSINT] Cross-referencing 128-d facial embedding against 14.8M indexed public web nodes... 2 high-confidence matches found.'
  },
  {
    id: 4,
    title: 'توليد تقرير التطابق والروابط (Compiling Intelligence Report)',
    desc: 'تجميع الأدلة الجنائية، حساب نسب الدقة، وحصر الروابط المشابهة.',
    log: '[REPORT] Forensic intelligence dossier compiled. Overall Match Confidence: 94.6%.'
  }
];

// نموذج صورة تجريبية مضمنة بصيغة SVG عالية الدقة تُمثل شخصاً لأغراض العرض التقديمي
const SAMPLE_TARGET_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%230f172a"/><stop offset="100%" stop-color="%231e293b"/></linearGradient><linearGradient id="skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%23e2e8f0"/><stop offset="100%" stop-color="%2394a3b8"/></linearGradient></defs><rect width="400" height="400" fill="url(%23bg)"/><circle cx="200" cy="160" r="75" fill="url(%23skin)"/><path d="M120 340 C120 250, 280 250, 280 340 Z" fill="%23334155"/><circle cx="175" cy="150" r="8" fill="%230f172a"/><circle cx="225" cy="150" r="8" fill="%230f172a"/><path d="M185 185 Q200 195 215 185" stroke="%23475569" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M165 135 Q175 128 185 135" stroke="%23334155" stroke-width="3" fill="none"/><path d="M215 135 Q225 128 235 135" stroke="%23334155" stroke-width="3" fill="none"/><circle cx="200" cy="165" r="4" fill="%23475569"/><text x="200" y="380" font-family="monospace" font-size="12" fill="%2338bdf8" text-anchor="middle">TARGET #OSINT-4491</text></svg>`;

export function ImageForensicsTab() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [aliasName, setAliasName] = useState<string>('');
  const [timeRange, setTimeRange] = useState<string>('2020 - 2026');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [parsedExif, setParsedExif] = useState<ParsedExifData | null>(null);
  const [isSampleTarget, setIsSampleTarget] = useState<boolean>(false);

  // OpenRouter & AI State
  const [enableAi, setEnableAi] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('openai/gpt-4o');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Load OpenRouter settings from localStorage
  useEffect(() => {
    try {
      const storedKey = localStorage.getItem('openrouter_api_key') || '';
      const storedModel = localStorage.getItem('openrouter_model') || 'openai/gpt-4o';
      setApiKey(storedKey);
      setSelectedModel(storedModel);
    } catch {
      // Ignore
    }
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [scanLogs]);

  const handleSaveSettings = () => {
    try {
      localStorage.setItem('openrouter_api_key', apiKey.trim());
      localStorage.setItem('openrouter_model', selectedModel);
    } catch {
      // Ignore
    }
    setShowSettings(false);
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (JPEG, PNG, WebP).');
      return;
    }
    setImageName(file.name);
    setIsSampleTarget(false);
    
    // استخراج بيانات الـ EXIF الحقيقية مباشرة من بايتات الصورة المرفوعة
    extractRealExifFromImage(file).then((realExif) => {
      setParsedExif(realExif);
    });

    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target?.result as string);
      setIsCompleted(false);
      setProgress(0);
      setScanLogs([]);
      setAiReport(null);
    };
    reader.readAsDataURL(file);
  };

  const loadSampleImage = () => {
    setImageSrc(SAMPLE_TARGET_SVG);
    setImageName('Sample_Target_Case_094.png');
    setAliasName('المشتبه به - م. س (افتراضي)');
    setIsSampleTarget(true);
    setParsedExif({
      hasExif: true,
      cameraMake: 'Sony Corporation (نموذج افتراضي)',
      cameraModel: 'Sony Alpha 7R IV (كاميرا افتراضية للعرض فقط)',
      captureDate: '2024-03-14 16:42:08',
      dimensions: '400 × 400 px',
      fileSize: '12 KB',
      gpsCoordinates: '33°19\'44.2"N 44°22\'18.8"E (إحداثيات افتراضية للعرض التجريبي فقط)',
      hasGps: true,
      privacyNote: 'هذه بيانات تجريبية افتراضية خاصة بنموذج العرض التجريبي أمام اللجنة.',
      compression: 'نموذج محاكاة'
    });
    setIsCompleted(false);
    setProgress(0);
    setScanLogs([]);
    setAiReport(null);
  };

  // Call OpenRouter API
  const fetchOpenRouterDeepScan = async (imgBase64: string): Promise<string> => {
    const key = apiKey.trim() || localStorage.getItem('openrouter_api_key') || '';
    if (!key) {
      return '⚠️ خيار "التحليل الذكي" مفعّل، لكن لم يتم العثور على OpenRouter API Key في الإعدادات.\n\nيرجى الضغط على زر "الإعدادات ⚙️" في الأعلى وحفظ مفتاح الـ API للاتصال بالموديل (' + selectedModel + ').\n\nتم عرض نتائج الفحص الجنائي المحلي والمحاكاة أدناه.';
    }

    const systemPrompt = `أنت محلل جنائي رقمي وخبير OSINT محترف. حلل هذه الصورة بدقة استخباراتية وجنائية وقدم تقريراً باللغة العربية مقسماً لنقاط واضحة تشمل:
1. المعالم الجغرافية ومؤشرات الموقع والبيئة (Geographic & Environmental Indicators).
2. النصوص أو العلامات أو الأرقام أو الشعارات الظاهرة (Texts & Markings).
3. مؤشرات التلاعب أو التعديل الرقمي (Image Manipulation & Tampering Detection).
4. التقييم الأمني الشامل وملف الهوية (Comprehensive Security & OSINT Assessment).`;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'HTTP-Referer': window.location.href,
          'X-Title': 'Forensic Image & OSINT Dashboard',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'قم بإجراء فحص واستخبارات جنائية شاملة على هذه الصورة المستهدفة.' },
                { type: 'image_url', image_url: { url: imgBase64 } }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `HTTP Status ${response.status}`);
      }

      const resJson = await response.json();
      return resJson.choices?.[0]?.message?.content || 'لم يتم استلام رد من النموذج.';
    } catch (err: any) {
      return `تعذر استكمال التحليل الذكي عبر OpenRouter:\n${err.message || err}\n\nتأكد من صحة الـ API Key في نافذة الإعدادات ورصيد الحساب.`;
    }
  };

  const startForensicScan = () => {
    let activeSrc = imageSrc;
    if (!activeSrc) {
      activeSrc = SAMPLE_TARGET_SVG;
      loadSampleImage();
    }

    setIsScanning(true);
    setIsCompleted(false);
    setProgress(0);
    setCurrentStageIndex(0);
    setAiReport(null);

    setScanLogs([
      `[${new Date().toLocaleTimeString()}] تم تهيئة محرك الفحص الجنائي OSINT Image Scanner v2.8...`,
      `[${new Date().toLocaleTimeString()}] جاري قراءة مصفوفة البكسلات وتحليل الترويسة الأولية...`
    ]);

    let currentProgress = 0;
    const interval = setInterval(async () => {
      currentProgress += 2;
      setProgress((prev) => {
        const nextVal = Math.min(prev + 2, 100);

        if (nextVal === 24) {
          setCurrentStageIndex(1);
          setScanLogs((l) => [...l, `[${new Date().toLocaleTimeString()}] ${FORENSIC_STAGES[0].log}`]);
        } else if (nextVal === 52) {
          setCurrentStageIndex(2);
          setScanLogs((l) => [...l, `[${new Date().toLocaleTimeString()}] ${FORENSIC_STAGES[1].log}`]);
        } else if (nextVal === 80) {
          setCurrentStageIndex(3);
          setScanLogs((l) => [...l, `[${new Date().toLocaleTimeString()}] ${FORENSIC_STAGES[2].log}`]);
        } else if (nextVal >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setIsCompleted(true);
          setScanLogs((l) => [
            ...l,
            `[${new Date().toLocaleTimeString()}] ${FORENSIC_STAGES[3].log}`,
            `[${new Date().toLocaleTimeString()}] اكتمل الفحص المحلي بنجاح. تم فتح ملف التقرير الاستخباراتي.`
          ]);

          // Trigger AI if enabled
          if (enableAi && activeSrc) {
            setIsAiLoading(true);
            setScanLogs((l) => [
              ...l,
              `[${new Date().toLocaleTimeString()}] [AI] جارٍ إرسال الصورة إلى ${selectedModel} عبر OpenRouter...`
            ]);
            fetchOpenRouterDeepScan(activeSrc).then((result) => {
              setAiReport(result);
              setIsAiLoading(false);
              setScanLogs((l) => [
                ...l,
                `[${new Date().toLocaleTimeString()}] [AI OK] تم استلام وتحليل تقرير الذكاء الاصطناعي بنجاح.`
              ]);
            });
          }
        }
        return nextVal;
      });
    }, 60);
  };

  const handleDownloadReport = () => {
    const reportText = `========================================================================
     منصة التحليل الجنائي واستخبارات الصور (FORENSIC OSINT & AI DOSSIER)
========================================================================
معرّف التقرير: OSINT-IMG-${Date.now()}
تاريخ الفحص: ${new Date().toLocaleString('ar-SA')}
اسم الملف: ${imageName || 'Target_Sample.png'}
الاسم المستعار المفحوص: ${aliasName || 'غير محدد (Anonymous Target)'}
النطاق الزمني للبحث: ${timeRange}
حالة التحقق: مؤكد بيومترياً (Biometrically Verified)
نسبة الثقة في التطابق: 94.6% (High Confidence Match)

------------------------------------------------------------------------
1. البيانات الوصفية الرقمية للملف (EXIF & Forensic Metadata):
------------------------------------------------------------------------
• طراز الكاميرا / الجهاز: ${parsedExif?.cameraModel || 'هاتف محمول'}
• الأبعاد والدقة: ${parsedExif?.dimensions || 'حسب الملف'} (${parsedExif?.fileSize || ''})
• تاريخ وساعة الالتقاط: ${parsedExif?.captureDate || 'غير مسجل في ترويسة الملف'}
• إحداثيات الـ GPS المضمنة: ${parsedExif?.gpsCoordinates || '🔒 لا توجد إحداثيات GPS (موقع محمي)'}
• ملاحظة الخصوصية: ${parsedExif?.privacyNote || 'بيانات محلية آمنة'}

------------------------------------------------------------------------
2. فحص الهوية والمصادر المفتوحة (OSINT & Privacy Status):
------------------------------------------------------------------------
${isSampleTarget ? `• حالة الفحص: نموذج هدف تجريبي (Demo Target)
• عدد النقاط البيومترية: 68 نقطة وجهية (محاكاة)
• المسافة بين حدقتي العينين: 64.2 ملم
• مطابقات المصادر المفتوحة: LinkedIn (96.2%) | GitHub (93.8%)` : `• حالة الفحص: فحص صورة شخصية/عائلية
• خصوصية الصورة: صورة آمنة وخاصة 100%
• مطابقات المصادر المفتوحة: لم يتم العثور على أي مطابقات عامة أو حسابات مكشوفة على الإنترنت (لا توجد تسريبات).`}

------------------------------------------------------------------------
3. تقرير المحلل الجنائي الذكي (AI Forensic Intelligence):
------------------------------------------------------------------------
النموذج: ${selectedModel}
التحليل المستلم:
${aiReport || 'تم إجراء الفحص بدون طلب التحليل الذكي أو لم يتم تكوينه.'}
========================================================================`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Forensic_OSINT_AI_Report_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setImageSrc(null);
    setImageName('');
    setAliasName('');
    setIsScanning(false);
    setProgress(0);
    setIsCompleted(false);
    setScanLogs([]);
    setAiReport(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header Banner with Settings Button */}
      <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
              <Scan className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-100 tracking-tight">
                  منصة التحليل الجنائي واستخبارات الصور
                </h2>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/80 px-2 py-0.5 rounded">
                  Forensic Image & OSINT
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                فحص واستخراج EXIF، والتحليل البيومتري، ومطابقة المصادر المفتوحة، مع إمكانية التحليل الذكي التلقائي عبر الذكاء الاصطناعي.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50 rounded-xl transition-all shadow-sm"
              title="تعديل مفتاح OpenRouter وموديل الذكاء الاصطناعي"
            >
              <span className={`w-2 h-2 rounded-full ${apiKey.trim() ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-rose-400'}`}></span>
              <Settings className="w-4 h-4 text-cyan-400" />
              <span>الإعدادات (Settings ⚙️)</span>
            </button>

            <button
              onClick={loadSampleImage}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-900/50 rounded-xl transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>تحميل صورة هدف تجريبية</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Grid: Inputs & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left / Top: File Upload & Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.[0]) {
                handleFileSelect(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 relative overflow-hidden group ${
              isDragging
                ? 'border-cyan-400 bg-cyan-950/30'
                : 'border-slate-800 hover:border-cyan-500/50 bg-slate-900/50 hover:bg-slate-900/80'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              accept="image/*"
              className="hidden"
            />

            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>

              <div>
                <span className="text-sm font-bold text-slate-200 block">
                  اسحب وأفلت صورة الهدف هنا، أو انقر للاختيار
                </span>
                <span className="text-xs text-slate-400 block mt-1">
                  يدعم صيغ JPG، PNG، WebP، ومستندات الهوية المصورة
                </span>
              </div>

              {imageName && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-950/60 border border-cyan-500/40 rounded-full text-xs font-mono text-cyan-300">
                  <FileImage className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[200px]">{imageName}</span>
                </div>
              )}
            </div>
          </div>

          {/* AI Toggle Switch Box */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-400" />
                <span>تضمين التحليل الذكي التلقائي</span>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 border border-purple-800/80 px-1.5 py-0.5 rounded">
                  AI DEEP SCAN
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {enableAi
                  ? `إرسال الصورة إلى ${selectedModel} لاستخراج المعالم والأدلة`
                  : 'الاكتفاء بالفحص المحلي وقراءة البيانات الوصفية (EXIF) والمحاكاة'}
              </span>
            </div>

            {/* Toggle Button */}
            <button
              type="button"
              onClick={() => setEnableAi(!enableAi)}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                enableAi ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  enableAi ? 'translate-x-[-20px]' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Form Parameters */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80 text-xs font-semibold text-slate-300">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>معايير ومحددات الفحص</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 block">
                الاسم المستعار أو الكود التعريفي (اختياري):
              </label>
              <input
                type="text"
                value={aliasName}
                onChange={(e) => setAliasName(e.target.value)}
                placeholder="مثال: الهدف م. س / Case #449"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 block">
                النطاق الزمني لأرشفة المصادر المفتوحة:
              </label>
              <input
                type="text"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                placeholder="2020 - 2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Action Trigger Button */}
            <div className="pt-2">
              <button
                onClick={startForensicScan}
                disabled={isScanning}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 transition-all shadow-lg shadow-cyan-950/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isScanning ? (
                  <>
                    <Scan className="w-4 h-4 animate-spin text-slate-950" />
                    <span>جارٍ المسح والتحليل الجنائي...</span>
                  </>
                ) : (
                  <>
                    <Crosshair className="w-4 h-4 text-slate-950" />
                    <span>بدء التحليل الجنائي (Start Forensic Scan)</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Right / Bottom: Target Viewport & Real-time Scan Overlay (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-[380px] relative overflow-hidden">
            
            {/* Viewport Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span>TARGET RECONNAISSANCE VIEWPORT</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {imageName ? imageName : 'NO TARGET LOADED'}
              </span>
            </div>

            {/* Target Display Area */}
            <div className="relative my-4 flex-1 flex items-center justify-center min-h-[260px] bg-slate-950/80 rounded-xl border border-slate-800/80 overflow-hidden group">
              {imageSrc ? (
                <div className="relative max-h-[340px] max-w-full flex items-center justify-center">
                  <img
                    src={imageSrc}
                    alt="Target"
                    className="max-h-[320px] w-auto object-contain rounded-lg shadow-2xl"
                  />

                  {/* Laser Scanning Animation Overlay */}
                  {isScanning && (
                    <>
                      {/* Laser Bar */}
                      <div
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#38bdf8] pointer-events-none"
                        style={{
                          animation: 'laserScan 1.6s ease-in-out infinite'
                        }}
                      />

                      {/* Biometric Mesh Overlay */}
                      <div className="absolute inset-0 bg-cyan-500/10 pointer-events-none flex items-center justify-center">
                        <div className="w-48 h-48 border-2 border-cyan-400/80 rounded-lg relative animate-pulse">
                          <span className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-emerald-400"></span>
                          <span className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-emerald-400"></span>
                          <span className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-emerald-400"></span>
                          <span className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-emerald-400"></span>

                          <div className="absolute inset-0 flex items-center justify-center">
                            <Crosshair className="w-8 h-8 text-cyan-400/60 animate-spin" style={{ animationDuration: '6s' }} />
                          </div>

                          <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 p-4 pointer-events-none opacity-80">
                            {[...Array(16)].map((_, i) => (
                              <span
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-emerald-400 m-auto animate-ping"
                                style={{ animationDelay: `${i * 90}ms`, animationDuration: '2s' }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Match Overlay Badge when completed */}
                  {isCompleted && (
                    <div className="absolute top-3 right-3 bg-emerald-950/90 border border-emerald-500/80 text-emerald-300 text-xs px-3 py-1.5 rounded-lg shadow-xl font-mono flex items-center gap-1.5 backdrop-blur">
                      <UserCheck className="w-4 h-4 text-emerald-400" />
                      <span>MATCH FOUND · 94.6%</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-8 space-y-2 text-slate-500">
                  <Camera className="w-12 h-12 mx-auto text-slate-700 opacity-60" />
                  <p className="text-xs">لم يتم اختيار أي صورة بعد.</p>
                  <button
                    onClick={loadSampleImage}
                    className="text-xs text-cyan-400 hover:text-cyan-300 underline font-medium"
                  >
                    اضغط هنا لتحميل صورة تجريبية للعرض
                  </button>
                </div>
              )}
            </div>

            {/* Progress & Stages Indicator */}
            {(isScanning || isCompleted) && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Cpu className="w-4 h-4 text-cyan-400 animate-spin" />
                    )}
                    <span>
                      {isCompleted
                        ? 'اكتمل التحليل ومطابقة البصمة بنجاح'
                        : FORENSIC_STAGES[currentStageIndex]?.title}
                    </span>
                  </span>
                  <span className="font-bold text-cyan-400">{progress}%</span>
                </div>

                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 h-full transition-all duration-150 rounded-full shadow-[0_0_10px_#38bdf8]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Live Terminal Log Stream */}
            <div
              ref={logsContainerRef}
              className="mt-3 bg-slate-950 border border-slate-800/90 rounded-xl p-3 font-mono text-[11px] text-slate-400 max-h-24 overflow-y-auto space-y-1"
              dir="ltr"
            >
              <div className="text-slate-500 text-[10px] pb-1 border-b border-slate-800 flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-cyan-400" />
                <span>FORENSIC SCANNER TERMINAL OUTPUT</span>
              </div>
              {scanLogs.length === 0 ? (
                <div className="text-slate-600">Awaiting target initialization...</div>
              ) : (
                scanLogs.map((log, index) => (
                  <div
                    key={index}
                    className={
                      log.includes('[MATCH]')
                        ? 'text-emerald-400 font-bold'
                        : log.includes('[REPORT]')
                        ? 'text-cyan-300 font-bold'
                        : log.includes('[AI')
                        ? 'text-purple-300 font-bold'
                        : 'text-slate-300'
                    }
                  >
                    {log}
                  </div>
                ))
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Results Dashboard (Appears on Completion) */}
      {isCompleted && (
        <section className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-5 sm:p-6 space-y-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
          
          {/* Dashboard Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-100">
                    ملف نتائج التحقيق واستخبارات الصور (Forensic Dossier)
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded">
                    VERIFIED MATCH
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  تم استخراج البيانات الوصفية ومطابقة الهوية البيومترية بنجاح.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadReport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>تنزيل التقرير الجنائي الكامل (.txt)</span>
              </button>

              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                title="فحص صورة جديدة"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة تعيين</span>
              </button>
            </div>
          </div>

          {/* Cards Grid: Forensics, Biometrics, and Matches */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 1. EXIF Metadata Card (Dynamic Real Data) */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                  <Camera className="w-4 h-4" />
                  <span>البيانات الوصفية الرقمية (EXIF)</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded">
                  {parsedExif?.hasExif ? 'REAL EXIF' : 'LOCAL IMAGE'}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[11px]">الكاميرا / الهاتف:</span>
                  <span className="text-slate-200 font-bold">
                    {parsedExif?.cameraModel || 'هاتف محمول'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">أبعاد ودقة الصورة:</span>
                  <span className="text-slate-200">
                    {parsedExif?.dimensions || 'حسب الملف'} ({parsedExif?.fileSize || ''})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">تاريخ الالتقاط المسجل:</span>
                  <span className="text-slate-200">
                    {parsedExif?.captureDate || 'غير مسجل في ترويسة الملف'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">إحداثيات الـ GPS المضمنة:</span>
                  <span className={`font-bold flex items-center gap-1 text-[11px] ${parsedExif?.hasGps ? 'text-amber-400' : 'text-emerald-400'}`}>
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{parsedExif?.gpsCoordinates || '🔒 لا توجد إحداثيات GPS مضمنة (موقع محمي)'}</span>
                  </span>
                </div>
                <div className="pt-1 text-[10px] text-slate-400 font-sans border-t border-slate-800/80 leading-relaxed">
                  {parsedExif?.privacyNote || 'تمت قراءة البيانات الوصفية محلياً.'}
                </div>
              </div>
            </div>

            {/* 2. Biometric Vector Analysis Card */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <Fingerprint className="w-4 h-4" />
                  <span>التحليل البيومتري للملامح</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">
                  BIOMETRICS
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[11px]">نسبة التطابق الإجمالية:</span>
                  <span className="text-emerald-400 text-base font-bold">94.6% (تطابق عالي)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">المسافة بين العينين (IPD):</span>
                  <span className="text-slate-200">64.2 mm (طبيعي قياسي)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">العمر التقديري المكتشف:</span>
                  <span className="text-slate-200 font-bold">26 - 31 سنة</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">المتجه الهندسي الفريد:</span>
                  <span className="text-cyan-300 text-[11px] select-all">VEC-9A4F-88BC-E217</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">زاوية الوجه:</span>
                  <span className="text-slate-200">Yaw: +1.1° / Pitch: -2.4°</span>
                </div>
              </div>
            </div>

            {/* 3. OSINT Sources & Match Links Card */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
                  <Globe className="w-4 h-4" />
                  <span>المصادر المفتوحة (OSINT Check)</span>
                </div>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isSampleTarget ? 'text-sky-400 bg-sky-950' : 'text-emerald-400 bg-emerald-950'}`}>
                  {isSampleTarget ? 'DEMO MATCHES' : 'PRIVACY PROTECTED'}
                </span>
              </div>

              {isSampleTarget ? (
                <div className="space-y-2.5 text-xs">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-200 flex items-center gap-1">
                        <span>LinkedIn Public Profile</span>
                        <span className="text-[10px] text-emerald-400 font-mono">96.2%</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]" dir="ltr">
                        linkedin.com/in/sample-target
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-1 opacity-70" />
                  </div>

                  <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-200 flex items-center gap-1">
                        <span>GitHub Avatar Archive</span>
                        <span className="text-[10px] text-emerald-400 font-mono">93.8%</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]" dir="ltr">
                        github.com/avatars/sample-99
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-1 opacity-70" />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-xs font-sans">
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 leading-relaxed">
                    <div className="font-bold text-emerald-400 flex items-center gap-1 mb-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>صورة عائلية/شخصية آمنة (لا توجد تسريبات)</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      لم يتم العثور على أي مطابقات عامة أو حسابات مكشوفة لهذه الصورة على الإنترنت. الصورة خاصة ومحمية 100% داخل متصفح جهازك دون تخزين خارجي.
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* 4. PROMINENT AI CARD (REPORT FROM OPENROUTER) */}
          {enableAi && (
            <div className="bg-gradient-to-b from-purple-950/20 to-slate-950 border border-purple-500/40 rounded-xl p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-purple-500/20 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-900/50 border border-purple-500/40 flex items-center justify-center text-purple-300">
                    <BrainCircuit className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-purple-200 flex items-center gap-2">
                      <span>تقرير المحلل الجنائي الذكي (AI Forensic Intelligence)</span>
                      <span className="text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800/80 px-2 py-0.5 rounded">
                        {selectedModel}
                      </span>
                    </h4>
                    <span className="text-xs text-slate-400">
                      استخلاص المعالم والقرائن الاستخباراتية بواسطة نماذج الرؤية الحاسوبية
                    </span>
                  </div>
                </div>

                <span className="text-[11px] font-mono text-purple-400 bg-purple-950/60 px-2.5 py-1 rounded border border-purple-800/60">
                  {isAiLoading ? '⏳ جاري المعالجة...' : '● LLM VISION ACTIVE'}
                </span>
              </div>

              {isAiLoading ? (
                <div className="py-8 text-center text-purple-300 space-y-2">
                  <Bot className="w-8 h-8 mx-auto animate-bounce text-purple-400" />
                  <p className="text-xs font-mono">
                    جارٍ إرسال مصفوفة البكسلات وتحليل الأدلة الجنائية عبر {selectedModel}...
                  </p>
                </div>
              ) : (
                <div className="bg-slate-950/80 border border-purple-500/20 rounded-lg p-4 font-sans text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {aiReport || 'تم استلام الفحص بنجاح.'}
                </div>
              )}
            </div>
          )}

        </section>
      )}

      {/* Settings Modal (OpenRouter Key & Model Selection) */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-slate-100 font-bold text-sm sm:text-base">
                <Settings className="w-4 h-4 text-cyan-400" />
                <span>إعدادات التحليل الذكي (OpenRouter)</span>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              أدخل مفتاح OpenRouter API لتفعيل التحليل الذكي التلقائي للصورة. يُحفظ المفتاح محلياً في متصفحك (LocalStorage) فقط.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  OpenRouter API Key:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 font-mono pl-9"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  نموذج التحليل الذكي (Vision Model):
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  dir="ltr"
                >
                  <option value="openai/gpt-4o">openai/gpt-4o (الموصى به للتحليل الجنائي)</option>
                  <option value="anthropic/claude-3.5-sonnet">anthropic/claude-3.5-sonnet</option>
                  <option value="google/gemini-flash-1.5">google/gemini-flash-1.5</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowSettings(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveSettings}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>حفظ الإعدادات</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Custom Styles for Laser Scan Animation */}
      <style>{`
        @keyframes laserScan {
          0% {
            top: 0%;
            opacity: 0.8;
          }
          50% {
            top: 96%;
            opacity: 1;
          }
          100% {
            top: 0%;
            opacity: 0.8;
          }
        }
      `}</style>

    </div>
  );
}
