/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Share2,
  X,
  MessageCircle,
  Mail,
  Copy,
  Check,
  Download,
  Smartphone,
  Send
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportText: string;
  phoneModel: string;
}

export function ShareModal({
  isOpen,
  onClose,
  reportText,
  phoneModel
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: 'تقرير استطلاع البصمة الرقمية للهاتف',
        text: reportText,
      });
    } catch {
      // User cancelled or unsupported
    }
  };

  const handleWhatsAppShare = () => {
    const encoded = encodeURIComponent(reportText);
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`تقرير استطلاع البصمة الرقمية (${phoneModel})`);
    const body = encodeURIComponent(reportText);
    const url = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = url;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recon_report_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-5 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-950/60 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                إرسال ومشاركة تقرير الفحص
              </h3>
              <p className="text-xs text-slate-400">
                مشاركة نتائج استطلاع البصمة ومواصفات الجهاز
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

        {/* Share Options */}
        <div className="space-y-2.5">
          
          {/* Option 1: Native Share (if supported on mobile/desktop) */}
          {hasNativeShare && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center justify-between p-3.5 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-500/30 rounded-xl transition-colors group text-right"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-100 text-xs sm:text-sm">
                    مشاركة مباشرة عبر الهاتف
                  </div>
                  <div className="text-[11px] text-slate-400">
                    واتساب، AirDrop، تيليجرام، أو الرسائل
                  </div>
                </div>
              </div>
              <Send className="w-4 h-4 text-emerald-400 group-hover:translate-x-[-2px] transition-transform" />
            </button>
          )}

          {/* Option 2: WhatsApp Direct */}
          <button
            onClick={handleWhatsAppShare}
            className="w-full flex items-center justify-between p-3.5 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-colors group text-right"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-100 text-xs sm:text-sm">
                  إرسال عبر واتساب (WhatsApp)
                </div>
                <div className="text-[11px] text-slate-400">
                  فتح محادثة واتساب وإرسال التقرير فوراً
                </div>
              </div>
            </div>
            <Send className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
          </button>

          {/* Option 3: Email Direct */}
          <button
            onClick={handleEmailShare}
            className="w-full flex items-center justify-between p-3.5 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-colors group text-right"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-100 text-xs sm:text-sm">
                  إرسال عبر البريد الإلكتروني (Email)
                </div>
                <div className="text-[11px] text-slate-400">
                  إنشاء رسالة إيميل تحتوي على نتائج الفحص
                </div>
              </div>
            </div>
            <Send className="w-4 h-4 text-slate-400 group-hover:text-sky-400 transition-colors" />
          </button>

          {/* Option 4: Copy to clipboard */}
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-between p-3.5 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-colors group text-right"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center">
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </div>
              <div>
                <div className="font-semibold text-slate-100 text-xs sm:text-sm">
                  {copied ? 'تم نسخ التقرير إلى الحافظة' : 'نسخ التقرير نصياً (Clipboard)'}
                </div>
                <div className="text-[11px] text-slate-400">
                  نسخ النص ولصقه في أي تطبيق
                </div>
              </div>
            </div>
            {copied && <span className="text-xs text-emerald-400 font-semibold">جاهز للصق</span>}
          </button>

          {/* Option 5: Download TXT file */}
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-between p-3.5 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-colors group text-right"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-100 text-xs sm:text-sm">
                  تنزيل التقرير كملف نصي (.txt)
                </div>
                <div className="text-[11px] text-slate-400">
                  حفظ التقرير كملف تقرير أمني محلي
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition-colors" />
          </button>

        </div>

      </div>
    </div>
  );
}
