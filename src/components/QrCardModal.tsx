/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { QrCode, Download, Copy, Check, ExternalLink, Terminal, Shield, RefreshCw } from 'lucide-react';

interface QrCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultUrl?: string;
}

export const QrCardModal: React.FC<QrCardModalProps> = ({ isOpen, onClose, defaultUrl }) => {
  const [targetUrl, setTargetUrl] = useState<string>(
    defaultUrl || (typeof window !== 'undefined' ? window.location.href : 'https://example.com/demo.html')
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'python'>('preview');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const pythonScript = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
مولّد بطاقة رمز الاستجابة السريعة (QR Code Card Generator)
مخصص للعروض التقديمية والتوعية بأمن المعلومات (Security Awareness Demo)

المتطلبات:
    pip install "qrcode[pil]" pillow arabic-reshaper python-bidi

الاستخدام:
    python3 generate_qr_card.py
    أو مع رابط مخصص:
    python3 generate_qr_card.py "${targetUrl}"
"""

import sys
import os
import qrcode
from PIL import Image, ImageDraw, ImageFont

try:
    import arabic_reshaper
    from bidi.algorithm import get_display
    HAS_ARABIC_SUPPORT = True
except ImportError:
    HAS_ARABIC_SUPPORT = False

def format_arabic(text: str) -> str:
    if HAS_ARABIC_SUPPORT:
        try:
            return get_display(arabic_reshaper.reshape(text))
        except Exception:
            return text
    return text

def find_system_font(size: int = 24):
    paths = [
        "C:\\\\Windows\\\\Fonts\\\\tahoma.ttf",
        "C:\\\\Windows\\\\Fonts\\\\arial.ttf",
        "/System/Library/Fonts/GeezaPro.ttc",
        "/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    ]
    for p in paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    try:
        return ImageFont.truetype("arial.ttf", size)
    except Exception:
        return ImageFont.load_default()

def generate_qr_card(target_url: str = "${targetUrl}", output_filename: str = "demo_qr_card.png"):
    print(f"🚀 جاري إنشاء بطاقة الـ QR للرابط: {target_url}")
    
    card_w, card_h = 800, 1000
    card = Image.new("RGB", (card_w, card_h), (9, 13, 22))
    draw = ImageDraw.Draw(card)

    # خلفية البطاقة الداخلية
    draw.rounded_rectangle([(30, 30), (card_w - 30, card_h - 30)], radius=20, fill=(15, 23, 42), outline=(30, 41, 59), width=2)
    draw.rounded_rectangle([(30, 30), (card_w - 30, 38)], radius=4, fill=(16, 185, 129))

    font_badge = find_system_font(14)
    font_title = find_system_font(26)
    font_desc = find_system_font(18)
    font_url = find_system_font(14)

    # النصوص العلوية
    b_text = "SECURITY AWARENESS DEMO · DIGITAL FORENSICS"
    b_bbox = draw.textbbox((0, 0), b_text, font=font_badge)
    draw.text(((card_w - (b_bbox[2] - b_bbox[0])) // 2, 70), b_text, fill=(16, 185, 129), font=font_badge)

    t_text = format_arabic("فحص البصمة الرقمية للمتصفح - Digital Footprint Demo")
    t_bbox = draw.textbbox((0, 0), t_text, font=font_title)
    draw.text(((card_w - (t_bbox[2] - t_bbox[0])) // 2, 105), t_text, fill=(248, 250, 252), font=font_title)
    draw.line([(100, 160), (card_w - 100, 160)], fill=(30, 41, 59), width=1)

    # توليد الـ QR
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=10, border=2)
    qr.add_data(target_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="#000000", back_color="#ffffff").convert("RGB")
    qr_size = 380
    qr_img = qr_img.resize((qr_size, qr_size), Image.Resampling.LANCZOS)
    
    qx = (card_w - qr_size) // 2
    qy = 200
    draw.rounded_rectangle([(qx - 16, qy - 16), (qx + qr_size + 16, qy + qr_size + 16)], radius=14, fill=(255, 255, 255), outline=(16, 185, 129), width=3)
    card.paste(qr_img, (qx, qy))

    # النص التوجيهي
    d_text = format_arabic("امسح الرمز عبر كاميرا الهاتف لعرض البيانات التقنية التي يشاركها متصفحك تلقائياً")
    draw.rounded_rectangle([(70, 640), (card_w - 70, 750)], radius=12, fill=(11, 19, 41), outline=(56, 189, 248), width=1)
    d_bbox = draw.textbbox((0, 0), d_text, font=font_desc)
    draw.text(((card_w - (d_bbox[2] - d_bbox[0])) // 2, 664), d_text, fill=(248, 250, 252), font=font_desc)

    en_text = "Scan via mobile camera to reveal live client fingerprint telemetry"
    e_bbox = draw.textbbox((0, 0), en_text, font=font_url)
    draw.text(((card_w - (e_bbox[2] - e_bbox[0])) // 2, 705), en_text, fill=(56, 189, 248), font=font_url)

    # الرابط والتذييل
    u_text = format_arabic(f"رابط مباشر: {target_url[:65]}")
    u_bbox = draw.textbbox((0, 0), u_text, font=font_url)
    draw.text(((card_w - (u_bbox[2] - u_bbox[0])) // 2, 785), u_text, fill=(148, 163, 184), font=font_url)

    card.save(output_filename, format="PNG", quality=95)
    print(f"✅ تم حفظ بطاقة العرض التوعوي بنجاح: {output_filename}")

if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else "${targetUrl}"
    generate_qr_card(url, "demo_qr_card.png")
`;

  // Draw the high-resolution presentation card onto the canvas
  const drawCardOnCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsGenerating(true);

    try {
      const width = 800;
      const height = 1000;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Inner card
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      roundRect(ctx, 30, 30, width - 60, height - 60, 20, true, true);

      // Top decorative emerald strip
      ctx.fillStyle = '#10b981';
      roundRect(ctx, 30, 30, width - 60, 8, 4, true, false);

      // Header Badge
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SECURITY AWARENESS DEMO · DIGITAL FORENSICS', width / 2, 75);

      // Main Title
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 24px "Cairo", sans-serif';
      ctx.fillText('فحص البصمة الرقمية للمتصفح - Digital Footprint Demo', width / 2, 115);

      // Hairline divider
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(100, 160);
      ctx.lineTo(width - 100, 160);
      ctx.stroke();

      // Generate High-Res QR code
      const qrDataUrl = await QRCode.toDataURL(targetUrl, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 380,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      const qrImage = new Image();
      qrImage.src = qrDataUrl;
      await new Promise<void>((resolve) => {
        qrImage.onload = () => resolve();
      });

      const qrSize = 380;
      const qx = (width - qrSize) / 2;
      const qy = 200;

      // QR Code container with border
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 4;
      roundRect(ctx, qx - 16, qy - 16, qrSize + 32, qrSize + 32, 16, true, true);

      // Draw QR image
      ctx.drawImage(qrImage, qx, qy, qrSize, qrSize);

      // Guide banner box
      const guideY = 640;
      ctx.fillStyle = '#0b1329';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      roundRect(ctx, 70, guideY, width - 140, 115, 12, true, true);

      // Guide Arabic text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px "Cairo", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('امسح الرمز عبر كاميرا الهاتف لكشف نسبة شحن البطارية واسم وموديل هاتفك الحقيقي', width / 2, guideY + 45);

      // English secondary hint
      ctx.fillStyle = '#38bdf8';
      ctx.font = '14px "Cairo", sans-serif';
      ctx.fillText('Live Battery Level, Device Model, Screen & Hardware Reconnaissance', width / 2, guideY + 85);

      // Direct URL
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px "JetBrains Mono", monospace';
      const truncatedUrl = targetUrl.length > 55 ? targetUrl.substring(0, 52) + '...' : targetUrl;
      ctx.fillText(`رابط الوصول: ${truncatedUrl}`, width / 2, 790);

      // Footer
      ctx.fillStyle = '#10b981';
      ctx.font = '13px "Cairo", sans-serif';
      ctx.fillText('● فحص محلي 100% داخل المتصفح · لا يتم تخزين أو نقل أي بيانات شخصية', width / 2, 840);

    } catch (err) {
      console.error('Failed to draw QR card', err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      drawCardOnCanvas();
    }
  }, [isOpen, targetUrl]);

  // Canvas helper for rounded rectangles
  function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    fill = true,
    stroke = true
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'demo_qr_card.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                بطاقة رمز الاستجابة السريعة (QR Code Demo Card)
              </h3>
              <p className="text-xs text-slate-400">
                مخصصة للعروض التقديمية في قاعات التدريب والمؤتمرات التوعوية بأمن المعلومات
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadImage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors shadow-sm"
              title="تنزيل البطاقة كصورة PNG عالية الدقة (demo_qr_card.png)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تنزيل الصورة (PNG)</span>
            </button>
            <button
              onClick={onClose}
              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>

        {/* URL Input Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <label className="text-xs font-medium text-slate-300 shrink-0">
            رابط صفحة الفحص المستهدف:
          </label>
          <div className="flex-1 relative">
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 text-left"
              dir="ltr"
              placeholder="https://example.com/demo.html"
            />
          </div>
          <button
            onClick={drawCardOnCanvas}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>تحديث الرمز</span>
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/20 text-xs font-medium px-4">
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'preview'
                ? 'border-emerald-400 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            معاينة البطاقة الجاهزة (Image Preview)
          </button>
          <button
            onClick={() => setActiveTab('python')}
            className={`py-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'python'
                ? 'border-emerald-400 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            كود بايثون المستقل (Python Code & Pip Instructions)
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-950/60 flex flex-col items-center">
          {activeTab === 'preview' ? (
            <div className="space-y-4 max-w-xl w-full flex flex-col items-center">
              <div className="border border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-black max-w-[420px] w-full aspect-[4/5] flex items-center justify-center relative">
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="w-full flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  دقة البطاقة: 800 × 1000 بكسل (عالية الدقة جاهزة للطباعة أو العرض)
                </span>
                <button
                  onClick={handleDownloadImage}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4"
                >
                  تنزيل demo_qr_card.png
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-4 text-xs text-slate-300">
              {/* Pip instructions */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
                <div className="font-semibold text-emerald-400 text-sm flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  <span>خطوات تثبيت وتشغيل كود بايثون:</span>
                </div>
                <p className="text-slate-400 text-xs">
                  قم بتثبيت المكتبات المطلوبة بواسطة أمر pip التالي:
                </p>
                <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded border border-slate-800 font-mono text-xs text-emerald-400 text-left" dir="ltr">
                  <span>pip install "qrcode[pil]" pillow arabic-reshaper python-bidi</span>
                  <button
                    onClick={() => handleCopyText('pip install "qrcode[pil]" pillow arabic-reshaper python-bidi', 'pip-cmd')}
                    className="p-1 hover:text-white transition-colors"
                    title="نسخ الأمر"
                  >
                    {copiedKey === 'pip-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                </div>
                <p className="text-slate-400 text-xs mt-1">
                  ثم شغل السكربت لتوليد البطاقة بصيغة <code className="text-sky-300">demo_qr_card.png</code>:
                </p>
                <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded border border-slate-800 font-mono text-xs text-sky-400 text-left" dir="ltr">
                  <span>python generate_qr_card.py</span>
                  <button
                    onClick={() => handleCopyText('python generate_qr_card.py', 'py-run')}
                    className="p-1 hover:text-white transition-colors"
                  >
                    {copiedKey === 'py-run' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                </div>
              </div>

              {/* Python Code box */}
              <div className="relative border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800">
                  <span className="font-mono text-slate-400 text-xs">generate_qr_card.py</span>
                  <button
                    onClick={() => handleCopyText(pythonScript, 'py-code')}
                    className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white"
                  >
                    {copiedKey === 'py-code' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">تم نسخ الكود</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ كود بايثون</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 font-mono text-xs text-slate-300 overflow-x-auto text-left max-h-[340px]" dir="ltr">
                  {pythonScript}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
