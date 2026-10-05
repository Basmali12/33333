#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
مولّد بطاقة رمز الاستجابة السريعة (QR Code Card Generator)
مخصص للعروض التقديمية والتوعية بأمن المعلومات (Security Awareness Demo)

المتطلبات:
    pip install qrcode[pil] pillow arabic-reshaper python-bidi

الاستخدام:
    python3 generate_qr_card.py
    أو مع تمرير رابط مخصص:
    python3 generate_qr_card.py "https://example.com/demo.html"
"""

import sys
import os
import qrcode
from PIL import Image, ImageDraw, ImageFont

# محاولة استيراد مكتبات معالجة النصوص العربية وتشكيل الحروف المتصلة (RTL)
try:
    import arabic_reshaper
    from bidi.algorithm import get_display
    HAS_ARABIC_SUPPORT = True
except ImportError:
    HAS_ARABIC_SUPPORT = False


def format_arabic(text: str) -> str:
    """معالجة النص العربي لضمان اتصال الحروف واتجاه اليمين إلى اليسار في مكتبة Pillow."""
    if HAS_ARABIC_SUPPORT:
        try:
            reshaped = arabic_reshaper.reshape(text)
            return get_display(reshaped)
        except Exception:
            return text
    return text


def find_system_font(size: int = 24, is_bold: bool = False) -> ImageFont.ImageFont:
    """البحث عن خط يدعم الحروف العربية في نظام التشغيل (Windows, macOS, Linux)."""
    candidates = []
    
    # خطوط شائعة تدعم العربية
    if sys.platform == "win32":
        candidates = [
            "C:\\Windows\\Fonts\\tahoma.ttf",
            "C:\\Windows\\Fonts\\arial.ttf",
            "C:\\Windows\\Fonts\\segoeui.ttf",
        ]
    elif sys.platform == "darwin":
        candidates = [
            "/System/Library/Fonts/GeezaPro.ttc",
            "/System/Library/Fonts/SFArabic.ttf",
            "/Library/Fonts/Arial.ttf",
        ]
    else:  # Linux / Unix
        candidates = [
            "/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
        ]
    
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue

    # خط احتياطي في حال عدم العثور على خط نظام
    try:
        return ImageFont.truetype("arial.ttf", size)
    except Exception:
        return ImageFont.load_default()


def generate_qr_card(
    target_url: str = "https://example.com/demo.html",
    output_filename: str = "demo_qr_card.png"
):
    print("=" * 60)
    print("🚀 بدء توليد بطاقة الـ QR التوعوية لأمن المعلومات...")
    print(f"🔗 الرابط المستهدف: {target_url}")
    print("=" * 60)

    # 1. إعدادات أبعاد البطاقة ولوحة الألوان (Dark Cybersecurity Theme)
    card_width = 800
    card_height = 1000
    
    # الألوان
    bg_color = (9, 13, 22)           # #090d16
    inner_card_bg = (15, 23, 42)     # #0f172a
    border_color = (30, 41, 59)      # #1e293b
    accent_emerald = (16, 185, 129)  # #10b981
    accent_cyan = (56, 189, 248)     # #38bdf8
    text_white = (248, 250, 252)     # #f8fafc
    text_muted = (148, 163, 184)     # #94a3b8

    # 2. إنشاء صورة البطاقة الرئيسية
    card = Image.new("RGB", (card_width, card_height), bg_color)
    draw = ImageDraw.Draw(card)

    # رسم إطار البطاقة الداخلية مع زوايا ناعمة وتدرج أنيق
    margin = 30
    draw.rounded_rectangle(
        [(margin, margin), (card_width - margin, card_height - margin)],
        radius=20,
        fill=inner_card_bg,
        outline=border_color,
        width=2
    )

    # شريط علوي بلون أخضر زمردي خفيف ليعطي طابع الأمان السيبراني
    draw.rounded_rectangle(
        [(margin, margin), (card_width - margin, margin + 8)],
        radius=4,
        fill=accent_emerald
    )

    # 3. إعداد الخطوط
    font_badge = find_system_font(14, is_bold=True)
    font_title = find_system_font(26, is_bold=True)
    font_desc = find_system_font(18, is_bold=False)
    font_url = find_system_font(14, is_bold=False)
    font_footer = find_system_font(13, is_bold=False)

    # 4. كتابة الشعار العلوي (Badge)
    badge_text = "SECURITY AWARENESS DEMO · DIGITAL FORENSICS"
    badge_bbox = draw.textbbox((0, 0), badge_text, font=font_badge)
    badge_w = badge_bbox[2] - badge_bbox[0]
    draw.text(
        ((card_width - badge_w) // 2, 70),
        badge_text,
        fill=accent_emerald,
        font=font_badge
    )

    # 5. كتابة العنوان الرئيسي (العنوان المطلوب)
    # "فحص البصمة الرقمية للمتصفح - Digital Footprint Demo"
    raw_title = "فحص البصمة الرقمية للمتصفح - Digital Footprint Demo"
    title_text = format_arabic(raw_title)
    title_bbox = draw.textbbox((0, 0), title_text, font=font_title)
    title_w = title_bbox[2] - title_bbox[0]
    draw.text(
        ((card_width - title_w) // 2, 105),
        title_text,
        fill=text_white,
        font=font_title
    )

    # خط فاصل رفيع تحت العنوان
    draw.line(
        [(100, 160), (card_width - 100, 160)],
        fill=border_color,
        width=1
    )

    # 6. توليد رمز الـ QR عالي الدقة باستخدام مكتبة qrcode
    # استخدام تصحيح خطأ مرتفع (ERROR_CORRECT_H = 30%) لسهولة المسح عبر شاشات العرض والكاميرات
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=2,
    )
    qr.add_data(target_url)
    qr.make(fit=True)

    # توليد صورة الـ QR مع خلفية بيضاء نقية لتباين فائق الدقة
    qr_img = qr.make_image(
        fill_color="#000000",
        back_color="#ffffff"
    ).convert("RGB")

    # إضافة إطار أبيض أنيق حول الـ QR لزيادة وضوح الحواف
    qr_size = 380
    qr_img = qr_img.resize((qr_size, qr_size), Image.Resampling.LANCZOS)
    
    # إطار خلفي للـ QR Code
    qr_box_x = (card_width - qr_size) // 2
    qr_box_y = 200
    
    # خلفية بيضاء مربعة مع زوايا ناعمة للرمز
    draw.rounded_rectangle(
        [(qr_box_x - 16, qr_box_y - 16), (qr_box_x + qr_size + 16, qr_box_y + qr_size + 16)],
        radius=14,
        fill=(255, 255, 255),
        outline=accent_emerald,
        width=3
    )

    # لصق صورة الـ QR داخل البطاقة
    card.paste(qr_img, (qr_box_x, qr_box_y))

    # 7. صندوق إرشادي لكتابة النص التوجيهي المطلوب في الأسفل:
    raw_desc = "امسح الرمز عبر كاميرا الهاتف لكشف نسبة شحن البطارية واسم وموديل هاتفك الحقيقي"
    desc_text = format_arabic(raw_desc)
    
    # خلفية تنبيه هادئة للنص التوجيهي
    guide_box_y = 640
    draw.rounded_rectangle(
        [(70, guide_box_y), (card_width - 70, guide_box_y + 110)],
        radius=12,
        fill=(11, 19, 41),
        outline=accent_cyan,
        width=1
    )

    # كتابة النص التوجيهي داخل الصندوق
    desc_bbox = draw.textbbox((0, 0), desc_text, font=font_desc)
    desc_w = desc_bbox[2] - desc_bbox[0]
    draw.text(
        ((card_width - desc_w) // 2, guide_box_y + 24),
        desc_text,
        fill=text_white,
        font=font_desc
    )

    # إضافة إرشاد باللغة الإنجليزية للجمهور التقني
    en_desc = "Live Battery Level, Device Model, Screen & Hardware Reconnaissance"
    en_bbox = draw.textbbox((0, 0), en_desc, font=font_url)
    en_w = en_bbox[2] - en_bbox[0]
    draw.text(
        ((card_width - en_w) // 2, guide_box_y + 65),
        en_desc,
        fill=accent_cyan,
        font=font_url
    )

    # 8. عرض نص الرابط المباشر
    url_display = target_url if len(target_url) <= 65 else target_url[:62] + "..."
    url_label = f"رابط الوصول المباشر: {url_display}"
    url_label_fmt = format_arabic(url_label)
    url_bbox = draw.textbbox((0, 0), url_label_fmt, font=font_url)
    url_w = url_bbox[2] - url_bbox[0]
    draw.text(
        ((card_width - url_w) // 2, 785),
        url_label_fmt,
        fill=text_muted,
        font=font_url
    )

    # 9. تذييل البطاقة التوعوي
    footer_text = format_arabic("100% Client-Side Privacy Awareness · لا يتم تسجيل أو إرسال أي بيانات شخصية")
    footer_bbox = draw.textbbox((0, 0), footer_text, font=font_footer)
    footer_w = footer_bbox[2] - footer_bbox[0]
    draw.text(
        ((card_width - footer_w) // 2, 840),
        footer_text,
        fill=accent_emerald,
        font=font_footer
    )

    # 10. حفظ الصورة النهائية
    card.save(output_filename, format="PNG", quality=95)
    print(f"✅ تم إنشاء البطاقة بنجاح وحفظها باسم: {output_filename}")
    print(f"📁 المسار الكامل: {os.path.abspath(output_filename)}")
    print(f"📐 دقة الصورة: {card_width} × {card_height} بكسل (عالية الدقة)")
    print("=" * 60)


if __name__ == "__main__":
    # يمكن تمرير الرابط عبر سطر الأوامر أو استخدام الرابط الافتراضي
    demo_url = sys.argv[1] if len(sys.argv) > 1 else "https://ais-dev-roio3cwu3uh7k3pyt5axra-390295852291.europe-west1.run.app"
    
    output_file = "demo_qr_card.png"
    generate_qr_card(target_url=demo_url, output_filename=output_file)
