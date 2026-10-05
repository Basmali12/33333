/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  History,
  X,
  Trash2,
  Download,
  Share2,
  Smartphone,
  Battery,
  Layers,
  Clock,
  Check
} from 'lucide-react';

export interface ScanLogEntry {
  id: string;
  timestamp: string;
  phoneModel: string;
  deviceAndOS: string;
  batteryStatus: string;
  gpuRenderer: string;
  screenResolution: string;
  networkType: string;
}

interface ScanLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ScanLogEntry[];
  onClearLogs: () => void;
  onShareLogs: () => void;
}

export function ScanLogModal({
  isOpen,
  onClose,
  logs,
  onClearLogs,
  onShareLogs
}: ScanLogModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (logs.length === 0) return;
    const content = `=== سجل فحوصات واستطلاع البصمة الرقمية ===
تم استخراج هذا السجل التعليمي بتاريخ: ${new Date().toLocaleString('ar-SA')}
عدد الأجهزة المسجلة: ${logs.length}
--------------------------------------------------

${logs
  .map(
    (log, i) => `[فحص رقم ${i + 1}] - التاريخ: ${log.timestamp}
• الجهاز والموديل: ${log.phoneModel}
• نظام التشغيل: ${log.deviceAndOS}
• شحن البطارية: ${log.batteryStatus}
• كرت الشاشة: ${log.gpuRenderer}
• أبعاد الشاشة: ${log.screenResolution}
• الشبكة: ${log.networkType}
--------------------------------------------------`
  )
  .join('\n\n')}

رسالة أمنية توعوية: هذه البيانات يرسلها المتصفح تلقائياً عند فتح الرابط، وتُستخدم في تحديد بيئة الهدف (Reconnaissance).`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fingerprint_scan_logs_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyLogs = () => {
    if (logs.length === 0) return;
    const text = logs
      .map(
        (log, i) =>
          `[${i + 1}] ${log.phoneModel} (${log.deviceAndOS}) | بطارية: ${log.batteryStatus} | وقت: ${log.timestamp}`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                سجل الفحوصات والاستطلاع (Scan History Log)
              </h3>
              <p className="text-xs text-slate-400">
                الأجهزة التي تم فحصها محلياً أثناء هذه الجلسة ({logs.length} عملية فحص)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informational note about browser history */}
        <div className="p-3.5 bg-slate-950/80 border-b border-slate-800/80 text-xs text-slate-300 leading-relaxed">
          <span className="text-emerald-400 font-semibold">💡 توضيح أمني حول سجل التصفح: </span>
          هذا السجل يسجل فقط عمليات الفحص التي تمت عبر هذه الصفحة. يمنع جدار حماية المتصفح (Browser Sandbox) أي موقع ويب من قراءة سجل تصفحك السابق أو المواقع التي زرتها سابقاً لحماية خصوصيتك!
        </div>

        {/* Logs List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {logs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <History className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
              <p className="text-sm">لا توجد سجلات مسجلة بعد.</p>
              <p className="text-xs text-slate-400">
                عند مسح الرمز بالهاتف أو تحديث الفحص، ستتم أرشفة بيانات الجهاز هنا تلقائياً.
              </p>
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={log.id}
                className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 hover:border-slate-700 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs border-b border-slate-800/70 pb-2">
                  <div className="flex items-center gap-1.5 text-sky-400 font-semibold">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>فحص #{logs.length - index}: {log.phoneModel}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                    <Clock className="w-3 h-3" />
                    <span>{log.timestamp}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1 font-mono">
                  <div>
                    <span className="text-slate-400 block">نظام التشغيل:</span>
                    <span className="text-slate-200">{log.deviceAndOS}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">البطارية:</span>
                    <span className="text-emerald-400">{log.batteryStatus}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">الشاشة:</span>
                    <span className="text-slate-200">{log.screenResolution}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">كرت الشاشة:</span>
                    <span className="text-purple-300 truncate block" title={log.gpuRenderer}>
                      {log.gpuRenderer}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={logs.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 rounded-lg transition-colors font-medium"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>تنزيل السجل (.txt)</span>
            </button>

            <button
              onClick={onShareLogs}
              disabled={logs.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 rounded-lg transition-colors font-medium"
            >
              <Share2 className="w-3.5 h-3.5 text-sky-400" />
              <span>إرسال السجل</span>
            </button>

            <button
              onClick={handleCopyLogs}
              disabled={logs.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">تم النسخ</span>
                </>
              ) : (
                <span>نسخ سريع</span>
              )}
            </button>
          </div>

          <button
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 disabled:opacity-40 disabled:pointer-events-none rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>مسح السجل</span>
          </button>
        </div>

      </div>
    </div>
  );
}
