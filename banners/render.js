const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const TEMPLATE_PATH = path.join(__dirname, 'template.html');
const OUTPUT_DIR = path.join(__dirname, 'output');
const CONFIG_PATH = path.join(__dirname, 'banners.json');

const CONTOUR_SVG = `
<svg viewBox="0 0 1600 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <path class="c" d="M 330 220 Q 450 190 570 240 Q 610 310 560 390 Q 460 440 360 420 Q 280 360 300 280 Z"/>
  <path class="c major" d="M 260 160 Q 440 120 620 180 Q 690 280 620 410 Q 460 480 290 450 Q 200 370 220 260 Z"/>
  <path class="c" d="M 180 100 Q 420 60 670 120 Q 770 250 690 410 Q 480 520 250 480 Q 110 380 140 220 Z"/>
  <path class="c" d="M 100 30 Q 390 0 730 70 Q 860 220 770 440 Q 510 580 200 520 Q 20 390 60 190 Z"/>
  <path class="c" opacity="0.55" d="M 0 -40 Q 360 -70 810 10 Q 970 190 870 480 Q 560 650 130 580 Q -80 430 -30 160 Z"/>
</svg>`;

const GRINDER_ART = `
<div class="art-scene">
  <div class="g-card g-chart">
    <div class="g-chart-label">Difficulty</div>
    <div class="g-bars">
      <div class="g-bar" style="height:26%"></div>
      <div class="g-bar" style="height:46%"></div>
      <div class="g-bar" style="height:68%"></div>
      <div class="g-bar" style="height:92%"><span class="dot"></span></div>
    </div>
  </div>
  <div class="g-card g-list">
    <div class="g-row"><span class="g-dot done"></span><span class="g-row-text">Two Sum</span><span class="g-tag easy">Easy</span></div>
    <div class="g-row"><span class="g-dot done"></span><span class="g-row-text">Binary Search</span><span class="g-tag med">Medium</span></div>
    <div class="g-row"><span class="g-dot"></span><span class="g-row-text">Graph Paths</span><span class="g-tag hard">Hard</span></div>
  </div>
  <div class="g-card g-chip">
    <div class="g-chip-num">14<span class="g-chip-unit">d</span></div>
    <div class="g-chip-label">Streak</div>
  </div>
  <div class="g-tile">&lt;/&gt;</div>
</div>`;

const FOUNDER_ART = `
<div class="founder-scene">
  <div class="photo-frame">
    <img src="../assets/illustrations/vikas-aditya.png" style="object-position: 50% 22%;">
    <div class="scrim"></div>
    <div class="quote-mark">&ldquo;</div>
    <div class="attr">
      <div class="name">Vikas Aditya</div>
      <div class="role">CEO, HackerEarth</div>
    </div>
  </div>
</div>`;

function artFor(config) {
  if (config.art === 'founder') return FOUNDER_ART;
  const bucket = config.bucket;
  if (bucket === 'careerist') {
    return `<img src="../assets/illustrations/careerist-hero.png" style="object-position: 55% 28%;">`;
  }
  if (bucket === 'builder') {
    return `<img src="../assets/illustrations/builder-hero.png" style="object-position: 50% 32%;">`;
  }
  if (bucket === 'grinder') {
    return GRINDER_ART;
  }
  throw new Error(`Unknown bucket: ${bucket}`);
}

function render(config) {
  let html = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const subcopyHtml = config.subcopy
    ? `<div class="subcopy">${config.subcopy}</div>`
    : '';
  html = html
    .replace('__CONTOURS__', CONTOUR_SVG)
    .replace('__EYEBROW__', config.eyebrow.toUpperCase())
    .replace('__HEADLINE__', config.headline)
    .replace('__SUBCOPY__', subcopyHtml)
    .replace('__CTA__', config.cta)
    .replace('__ART__', artFor(config));
  return html;
}

async function main() {
  const configs = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

  for (const config of configs) {
    const html = render(config);
    const tmpPath = path.join(__dirname, `_tmp_${config.id}.html`);
    fs.writeFileSync(tmpPath, html);

    // 1x — exact 600x250, the dimensions to set on the <img> in the email
    const page1x = await browser.newPage({ viewport: { width: 600, height: 250 }, deviceScaleFactor: 1 });
    await page1x.goto('file://' + tmpPath);
    await page1x.waitForTimeout(150);
    await page1x.screenshot({ path: path.join(OUTPUT_DIR, `${config.id}.png`) });
    await page1x.close();

    // 2x — retina source, 1200x500, use this as the actual image src
    const page2x = await browser.newPage({ viewport: { width: 600, height: 250 }, deviceScaleFactor: 2 });
    await page2x.goto('file://' + tmpPath);
    await page2x.waitForTimeout(150);
    await page2x.screenshot({ path: path.join(OUTPUT_DIR, `${config.id}@2x.png`) });
    await page2x.close();

    fs.unlinkSync(tmpPath);
    console.log('Rendered', config.id);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
