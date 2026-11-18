// إعدادات ثابتة للمشروع
export const MARKETPLACE = 'www.amazon.eg';
export const PARTNER_TAG = process.env.PARTNER_TAG || 'fineartslab-21';
export const CURRENCY = 'EGP';

// مصر تتبع منطقة أوروبا (EU 3.2) في الـ API
export const TOKEN_ENDPOINT = 'https://api.amazon.co.uk/auth/o2/token';
export const API_BASE = 'https://creatorsapi.amazon';

// حدود السعر (بالجنيه): MIN_PRICE أقل سعر مقبول، MAX_PRICE حد أمان ضد الأرقام الشاذة
export const MIN_PRICE = 500;
export const MAX_PRICE = 600000;

// أقصى سعر للبحث عن منتجات جديدة (عشان البحث ميجيبش أجهزة غالية جدًا)
export const SEARCH_MAX_PRICE = 60000;

// لو منتج فضل غير متاح أكتر من كام يوم، يتشال من الجدول
export const MAX_STALE_DAYS = 7;

// حاجات تشيلها لو ظهرت في البحث (ليست إير فراير)
export const ACCESSORY_RE =
  /liner|accessor|parchment|silicone|paper|mold|skewer|replacement|cover|rack|\bmat\b|brush|glove|tong|disposable|steamer|egg|grill pan|baking|seasoning|spice|book|guide|recipe|cookbook|kindle|manual/i;

export const FRYER_RE = /air\s?fryer|airfryer|friteuse|قلاية/i;

// ماركات عامة/كلمات مش ماركات
export const GENERIC_RE =
  /^(air|airfryer|fryer|electric|digital|portable|multi|multifunction|smart|home|new|8|\d+)$/i;

// براندات مستثناة حسب طلب صاحب الموقع (تُقارن بالاسم العربي)
export const EXCLUDED_BRANDS = [
  'سيلفر',
  'إير فراير',
  'Dollar',
  'بنز',
  'Multifunctional',
  'White',
  'هاي واي',
  'بلاك آند وايت',
  'كابري',
  'GEOVINA',
  'Silvertine',
  'دي إس بي',
];

// ترشيحاتنا الموثوقة — ASINs بترتيب العرض في جدول "أفضل قيمة مقابل سعر"
// لو منتج اتشال من المتوفر، الجدول يتجاهله تلقائيًا من غير ما نلمس الكود
export const FEATURED_ASINS = [
  'B0DJR78662', // فيليبس 6.2 لتر 1700 وات
  'B0CPGPD4BY', // فيليبس 9 لتر 2750 وات
  'B0DYK9SXY5', // بوش 6.1 لتر
  'B0FCS4NLY7', // ميديا 9 لتر
  'B0FQCM5738', // تورنيدو 8 لتر 1800 وات
  'B0DC6BBRKW', // بلاك أند ديكر 8 لتر تاتش
  'B0FV8JH3S2', // توشيبا 7.4 لتر (الأقرب المتوفر لـ 7.5)
  'B0CJVNGMFL', // نينجا 10.4 لتر
  'B09CQCF1FH', // تيفال 4.2 لتر
  'B08KGDTNG6', // فيليبس 4.1 لتر
  'B0BB2NP5B8', // بلاك أند ديكر 5.6 لتر
  'B0F1NB8JKK', // بلاك أند ديكر 7.2 لتر
];

// تحويل أسماء الماركات الإنجليزية لعربي
export const BRAND_MAP = [
  [/black\s*&?\s*decker|black\+decker/i, 'بلاك أند ديكر'],
  [/philips|versuni/i, 'فيليبس'],
  [/tefal/i, 'تيفال'],
  [/kenwood/i, 'كينوود'],
  [/midea/i, 'ميديا'],
  [/xiaomi/i, 'شاومي'],
  [/ninja/i, 'نينجا'],
  [/bosch/i, 'بوش'],
  [/panasonic/i, 'باناسونيك'],
  [/sharp/i, 'شارب'],
  [/tornado/i, 'تورنيدو'],
  [/fresh/i, 'فريش'],
  [/sokany|sokani/i, 'سوكاني'],
  [/akai/i, 'أكاي'],
  [/\bdsp\b/i, 'دي إس بي'],
  [/oraimo/i, 'أورايمو'],
  [/arion/i, 'أريون'],
  [/\bsilver\b/i, 'سيلفر'],
  [/capri/i, 'كابري'],
  [/\bbenz\b/i, 'بنز'],
  [/mienta/i, 'مينتا'],
  [/hi-?way/i, 'هاي واي'],
  [/black\s*&\s*white/i, 'بلاك آند وايت'],
  [/jamaki/i, 'جاماكي'],
  [/samsung/i, 'سامسونج'],
  [/nutricook/i, 'نيوتريكوك'],
  [/toshiba/i, 'توشيبا'],
  [/delonghi/i, 'ديلونجي'],
];
