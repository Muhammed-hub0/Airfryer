import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { EXCLUDED_BRANDS, MAX_PRICE, MIN_PRICE } from './config.mjs';
import { productKey } from './naming.mjs';

export const ROOT = fileURLToPath(new URL('..', import.meta.url));
export const DATA_DIR = join(ROOT, 'data');
export const OUT_DIR = join(ROOT, 'public');

const emptyDash = '—';

const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatPrice = (value) =>
  Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (value) => {
  const date = value ? new Date(value) : new Date();
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'Africa/Cairo',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 16).replace('T', ' ');
  }
};

// الصفوف اللي هتظهر: نشِطة + سعرها منطقي + عندها صورة + مش براند مستثنى
export function visibleOffers(offers) {
  const list = offers
    .filter((o) => o && o.active !== false)
    .filter((o) => !EXCLUDED_BRANDS.includes(String(o.brand || '').trim()))
    .filter((o) => Number.isFinite(Number(o.price)))
    .map((o) => ({ ...o, price: Number(o.price) }))
    .filter((o) => o.price >= MIN_PRICE && o.price <= MAX_PRICE)
    .filter((o) => typeof o.img === 'string' && /^https:\/\//.test(o.img))
    .sort((a, b) => a.price - b.price);

  // نفس المنتج بأكتر من ASIN → نخلي الأرخص بس
  const seen = new Set();
  const rows = [];
  for (const offer of list) {
    const key = productKey(offer);
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(offer);
  }
  return rows;
}

function filterScript() {
  return `(function () {
  var rows = Array.prototype.slice.call(document.querySelectorAll('#tbl tbody tr'));
  var fBrand = document.getElementById('fBrand');
  var fCap = document.getElementById('fCap');
  var fWatt = document.getElementById('fWatt');
  var fMin = document.getElementById('fMin');
  var fMax = document.getElementById('fMax');
  var cnt = document.getElementById('cnt');
  var total = rows.length;

  function fill(sel, attr, numeric) {
    var set = {};
    rows.forEach(function (r) { var v = r.getAttribute(attr); if (v) set[v] = 1; });
    var vals = Object.keys(set);
    vals.sort(numeric
      ? function (a, b) { return parseFloat(a) - parseFloat(b); }
      : function (a, b) { return a.localeCompare(b, 'ar'); });
    vals.forEach(function (v) {
      var o = document.createElement('option');
      o.value = v;
      o.textContent = v;
      sel.appendChild(o);
    });
  }
  fill(fCap, 'data-cap', true);
  fill(fWatt, 'data-watt', true);
  fill(fBrand, 'data-brand', false);

  function apply() {
    var b = fBrand.value, c = fCap.value, w = fWatt.value;
    var mn = parseFloat(fMin.value), mx = parseFloat(fMax.value);
    var shown = 0;
    rows.forEach(function (r) {
      var ok = (!b || r.getAttribute('data-brand') === b)
            && (!c || r.getAttribute('data-cap') === c)
            && (!w || r.getAttribute('data-watt') === w);
      var p = parseFloat(r.getAttribute('data-price'));
      if (!isNaN(mn)) { ok = ok && p >= mn; }
      if (!isNaN(mx)) { ok = ok && p <= mx; }
      r.style.display = ok ? '' : 'none';
      r.className = ok && (shown % 2 === 1) ? 'alt' : '';
      if (ok) { shown++; }
    });
    cnt.textContent = shown + ' من ' + total + ' منتج';
  }

  [fBrand, fCap, fWatt, fMin, fMax].forEach(function (el) {
    el.addEventListener('input', apply);
    el.addEventListener('change', apply);
  });
  document.getElementById('fReset').addEventListener('click', function () {
    fBrand.value = ''; fCap.value = ''; fWatt.value = ''; fMin.value = ''; fMax.value = '';
    apply();
  });
  apply();
})();`;
}

function themeScript() {
  return `(function () {
  var btn = document.getElementById('themeToggleBtn');
  var icon = document.getElementById('themeIcon');
  try {
    if (localStorage.getItem('af-theme') === 'dark') {
      document.documentElement.dataset.theme = 'dark';
      icon.textContent = '☀️';
    }
  } catch (e) {}
  btn.addEventListener('click', function () {
    var dark = document.documentElement.dataset.theme === 'dark';
    document.documentElement.dataset.theme = dark ? 'light' : 'dark';
    icon.textContent = dark ? '🌙' : '☀️';
    try { localStorage.setItem('af-theme', dark ? 'light' : 'dark'); } catch (e) {}
  });
})();`;
}

export function renderHtml(offers, options = {}) {
  const rows = visibleOffers(offers);
  const updatedAt = options.updatedAt || new Date().toISOString();

  const body = rows
    .map((offer, index) => {
      const warranty = esc(offer.warranty || '').replace(/\s\|\s/g, '<br>') || emptyDash;
      const ship = esc(offer.ship || '') || emptyDash;
      const cap = offer.cap ? esc(offer.cap) : emptyDash;
      const watt = offer.watt ? esc(offer.watt) : emptyDash;
      const url = esc(offer.url || '');
      const image = `<a href='${url}' target='_blank' rel='nofollow sponsored'><img src='${esc(
        offer.img,
      )}' loading='lazy' alt='${esc(offer.name)}' style='width:76px;height:76px;object-fit:contain'></a>`;
      return `<tr data-brand='${esc(offer.brand || '')}' data-cap='${esc(offer.cap || '')}' data-watt='${esc(
        offer.watt || '',
      )}' data-price='${offer.price}'><td class='n'>${index + 1}</td><td class='im'>${image}</td><td class='nm'>${esc(
        offer.name,
      )}</td><td class='sp'>${cap}</td><td class='sp'>${watt}</td><td class='w'>${warranty}</td><td>${ship}</td><td class='p'>${formatPrice(
        offer.price,
      )} ج.م</td><td class='lk'><a href='${url}' target='_blank' rel='nofollow sponsored'>افتح المنتج</a></td></tr>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>دليل القلايات الهوائية في مصر | مشترياتك صح</title>
<meta name="description" content="قارن أسعار القلايات الهوائية في مصر: السعة والقوة والضمان والسعر من أمازون مصر مع تحديث تلقائي.">
<meta name="theme-color" content="#0f253d">
<meta property="og:type" content="website">
<meta property="og:title" content="دليل القلايات الهوائية في مصر | مشترياتك صح">
<meta property="og:description" content="قارن بين أشهر القلايات الهوائية واختار الأنسب لمطبخك.">
<meta property="og:image" content="og-image.jpg">
<link rel="icon" href="logo.jpg">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-X7SD1FVX33"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', 'G-X7SD1FVX33');
</script>
<style>
:root{--bg:#f6f7f9;--surface:#ffffff;--surface-alt:#f0f3f7;--text:#1b1f24;--muted:#5d6670;--line:#e3e6ea;--a:#1c3d63;--a-soft:#e8eef6;--b:#9a6f1e;--b-soft:#f8f0de;--win:#0f7a4a;--win-soft:#e3f5ec;--accent:#b8892f;color-scheme:light}
:root[data-theme="dark"]{--bg:#0b1a2b;--surface:#11273f;--surface-alt:#183350;--text:#eceff2;--muted:#9aa4af;--line:#27415e;--a:#86b4e8;--a-soft:#15283f;--b:#e0c080;--b-soft:#3a2f16;--win:#4fd08f;--win-soft:#13301f;--accent:#e0c080;color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font-family:"Cairo","Segoe UI",Tahoma,Arial,sans-serif;line-height:1.65;transition:background-color .2s ease,color .2s ease}
.wrap{max-width:1100px;margin:0 auto;padding:16px}
header.top{background:var(--surface);border-bottom:1px solid var(--line);position:sticky;top:0;z-index:20}
.head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding-block:10px}
.brand{display:flex;align-items:center;gap:10px}
.brand img{width:44px;height:44px;border-radius:12px;border:1px solid var(--line)}
.brand b{font-size:17px;font-weight:800}
.socials{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.social-pill{display:inline-flex;align-items:center;gap:6px;padding:7px 11px;border-radius:12px;text-decoration:none;font-size:12px;font-weight:700;color:var(--text);background:var(--surface-alt);border:1px solid var(--line)}
.theme-btn{padding:7px 11px;border-radius:12px;border:1px solid var(--line);background:var(--surface-alt);color:var(--text);font-weight:700;cursor:pointer}
h1{font-size:22px;margin:18px 0 12px}
.surface-card{background:var(--surface);border:1px solid var(--line);border-radius:16px}
.bar{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;padding:12px 14px;margin-bottom:14px}
.fld{display:flex;flex-direction:column;gap:4px}
.fld label{font-size:12px;color:var(--muted);font-weight:600}
select,input{font-family:inherit;font-size:14px;padding:9px 11px;border:2px solid var(--line);border-radius:12px;background:var(--surface);color:var(--text);min-width:130px}
button.reset{font-family:inherit;font-size:14px;padding:9px 14px;border:1px solid var(--b);border-radius:12px;background:var(--b);color:#fff;font-weight:700;cursor:pointer}
:root[data-theme="dark"] button.reset{color:#0b1a2b}
.cnt{font-size:13px;color:var(--win);font-weight:700;margin-inline-start:auto;padding-bottom:8px}
table{width:100%;border-collapse:separate;border-spacing:0;overflow:hidden;font-size:14px}
th{background:var(--a);color:#fff;padding:11px 10px;text-align:right;position:sticky;top:0;z-index:1;white-space:nowrap}
td{padding:9px 10px;border-bottom:1px solid var(--line);vertical-align:top}
tr.alt td{background:var(--surface-alt)}
.n{color:var(--muted);width:34px}
.nm{font-weight:700}
.sp{white-space:nowrap}
.p{font-weight:800;white-space:nowrap;color:var(--win)}
.w{color:var(--muted);font-size:12px}
.im{width:90px;text-align:center}
a{color:var(--a);text-decoration:none}
a:hover{text-decoration:underline}
.ft{margin:16px 0 0;color:var(--muted);font-size:12px;line-height:1.8}
.banner{display:block;width:100%;height:auto;border-radius:16px;border:1px solid var(--line);margin:0 0 14px}
@media(max-width:720px){.wrap{padding:10px}select,input{min-width:0;width:100%}.fld{flex:1 1 140px}.cnt{width:100%;margin-inline-start:0}}
</style></head><body>
<header class="top"><div class="wrap head">
  <div class="brand"><img src="logo.jpg" alt="مشترياتك صح"><b>مشترياتك صح · دليل القلايات الهوائية</b></div>
  <div class="socials">
    <a class="social-pill" href="https://www.facebook.com/share/1d5zsrA3L8/" target="_blank" rel="noopener">صفحتنا</a>
    <a class="social-pill" href="https://www.facebook.com/share/g/1HzNFsMQCc/" target="_blank" rel="noopener">الجروب</a>
    <button id="themeToggleBtn" class="theme-btn" type="button" title="تغيير المظهر"><span id="themeIcon">🌙</span></button>
  </div>
</div></header>
<main class="wrap">
<h1>القلايات الهوائية على أمازون مصر</h1>
<img class="banner" src="banner.jpg" alt="مشترياتك صح — دليلك للمقارنة الذكية واختيار الأفضل" width="1024" height="390">
<div class="bar surface-card">
  <div class="fld"><label for="fBrand">البراند</label><select id="fBrand"><option value="">الكل</option></select></div>
  <div class="fld"><label for="fCap">السعة (لتر)</label><select id="fCap"><option value="">الكل</option></select></div>
  <div class="fld"><label for="fWatt">القدرة (وات)</label><select id="fWatt"><option value="">الكل</option></select></div>
  <div class="fld"><label for="fMin">السعر من</label><input id="fMin" type="number" inputmode="numeric" placeholder="0" min="0"></div>
  <div class="fld"><label for="fMax">السعر إلى</label><input id="fMax" type="number" inputmode="numeric" placeholder="∞" min="0"></div>
  <button id="fReset" class="reset">مسح الفلاتر</button>
  <div class="cnt" id="cnt">${rows.length} من ${rows.length} منتج</div>
</div>
<table id="tbl" class="surface-card">
<thead><tr><th></th><th>الصورة</th><th>الاسم</th><th>السعة (لتر)</th><th>القدرة (وات)</th><th>الضمان</th><th>الشحن</th><th>السعر</th><th>الرابط</th></tr></thead>
<tbody>
${body}
</tbody></table>
<div class="ft">
  <div>آخر فحص تلقائي: ${esc(formatDate(updatedAt))} · ${rows.length} منتج</div>
  <div>كأفلييت أمازون: قد نحصل على عمولة من عمليات الشراء اللي بتحصل عن طريق روابط الصفحة، من غير أي تكلفة إضافية عليك. الأسعار والمقاسات بتتحدث تلقائيًا وقد تختلف لحظة الشراء.</div>
</div>
</main>
<script>
${filterScript()}
${themeScript()}
</script>
</body></html>
`;
}

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export function renderCsv(offers) {
  const rows = visibleOffers(offers);
  const lines = [
    ['م', 'الصورة', 'الاسم', 'البراند', 'السعة (لتر)', 'القدرة (وات)', 'الضمان', 'الشحن', 'السعر', 'الرابط'],
  ];

  rows.forEach((offer, index) => {
    lines.push([
      index + 1,
      offer.img || '',
      offer.name || '',
      offer.brand || '',
      offer.cap || '',
      offer.watt || '',
      offer.warranty || emptyDash,
      offer.ship || emptyDash,
      offer.price,
      offer.url || '',
    ]);
  });

  return '\uFEFF' + lines.map((line) => line.map(csvCell).join(',')).join('\r\n');
}

export async function writePublic(offers, options = {}) {
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(join(OUT_DIR, 'index.html'), renderHtml(offers, options), 'utf8');
  await writeFile(join(OUT_DIR, 'all-airfryers.csv'), renderCsv(offers), 'utf8');
  await writeFile(join(OUT_DIR, '.nojekyll'), '', 'utf8');
  return visibleOffers(offers).length;
}

async function main() {
  const raw = await readFile(join(DATA_DIR, 'offers.json'), 'utf8');
  const offers = JSON.parse(raw);
  const count = await writePublic(offers);
  console.log(`تم بناء الصفحة: ${count} منتج`);
}

if (process.argv[1] && process.argv[1].endsWith('render.mjs')) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
