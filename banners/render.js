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

const CONFETTI = `
<div class="m-confetti">
  <span class="bar" style="top:30px; left:184px; background:var(--lime); transform: rotate(18deg);"></span>
  <span class="dot" style="top:54px; left:238px; background:var(--cta);"></span>
  <span class="dot" style="top:16px; left:132px; background:var(--accent); opacity:0.5;"></span>
  <span class="bar" style="top:198px; left:66px; background:var(--cta); transform: rotate(-16deg);"></span>
  <span class="dot" style="top:212px; left:150px; background:var(--lime);"></span>
  <span class="dot" style="top:186px; left:276px; background:var(--accent); opacity:0.5;"></span>
  <span class="dot" style="top:104px; left:14px; background:var(--cta); opacity:0.6;"></span>
  <span class="bar" style="top:148px; left:296px; background:var(--lime); transform: rotate(28deg);"></span>
</div>`;

const MILESTONE_ART = {
  'first-problem': `
<div class="m-scene">
  ${CONFETTI}
  <div class="m-medal"><div class="num">1st</div><div class="ord">Solve</div></div>
  <div class="m-card">
    <div class="m-card-head">
      <div class="m-dots"><span class="m-dot red"></span><span class="m-dot amber"></span><span class="m-dot green"></span></div>
      <div class="m-card-label">Problem #1</div>
    </div>
    <div class="m-card-body">
      <div class="m-check"><svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#020109" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <div>
        <div class="m-result-title">Accepted</div>
        <div class="m-result-sub">Runtime beats 84%</div>
      </div>
    </div>
  </div>
</div>`,
  'first-hiring-challenge': `
<div class="m-scene">
  ${CONFETTI}
  <div class="m-medal">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
    <div class="ord" style="margin-top:6px;">Applied</div>
  </div>
  <div class="m-card">
    <div class="m-card-head">
      <div class="m-dots"><span class="m-dot red"></span><span class="m-dot amber"></span><span class="m-dot green"></span></div>
      <div class="m-card-label">Hiring Challenge #1</div>
    </div>
    <div class="m-card-body">
      <div class="m-check"><svg viewBox="0 0 24 24" fill="none" stroke="#020109" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg></div>
      <div>
        <div class="m-result-title">Submitted</div>
        <div class="m-result-sub">Under review</div>
      </div>
    </div>
  </div>
</div>`,
  'first-hackathon': `
<div class="m-scene">
  ${CONFETTI}
  <div class="m-medal">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 0V3s-1 1-4 1-5-2-8 0z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
    <div class="ord" style="margin-top:6px;">Entered</div>
  </div>
  <div class="m-card m-card--code">
    <div class="m-card-head">
      <div class="m-dots"><span class="m-dot red"></span><span class="m-dot amber"></span><span class="m-dot green"></span></div>
      <div class="m-card-label">hackathon.js</div>
    </div>
    <div class="m-card-body m-code">
      <div class="m-code-line" style="width:82%; background: rgba(255,255,255,0.55);"></div>
      <div class="m-code-line" style="width:52%; background: var(--cta);"></div>
      <div class="m-code-line" style="width:88%; background: rgba(255,255,255,0.3);"></div>
      <div class="m-code-line" style="width:38%; background: var(--lime);"></div>
      <div class="m-code-status">
        <span class="m-code-check"><svg viewBox="0 0 24 24" fill="none" stroke="#020109" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg></span>
        Submitted
      </div>
    </div>
  </div>
</div>`,
  'first-mock-assessment': `
<div class="m-scene">
  ${CONFETTI}
  <div class="m-medal">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
    <div class="ord" style="margin-top:6px;">Attempted</div>
  </div>
  <div class="m-card m-card--assess">
    <div class="m-card-head">
      <div class="m-dots"><span class="m-dot red"></span><span class="m-dot amber"></span><span class="m-dot green"></span></div>
      <div class="m-card-label">Mock Assessment #1</div>
    </div>
    <div class="m-card-body m-assess">
      <div class="m-assess-row">
        <div class="m-check"><svg viewBox="0 0 24 24" fill="none" stroke="#020109" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
        <div>
          <div class="m-result-title">Completed</div>
          <div class="m-result-sub">18 min · 12 questions</div>
        </div>
      </div>
      <div>
        <div class="m-meter"><div class="m-meter-fill" style="width:74%;"></div></div>
        <div class="m-meter-label">Score 74%</div>
      </div>
    </div>
  </div>
</div>`,
  'first-vibecode': `
<div class="m-scene">
  ${CONFETTI}
  <div class="m-medal"><div class="num">1st</div><div class="ord">Vibecode</div></div>
  <div class="m-card m-card--vibe">
    <div class="m-card-head">
      <div class="m-vibe-lang"><span class="m-vibe-chip">&lt;/&gt;</span>JS</div>
      <div class="m-card-label">VibeCode Arena</div>
    </div>
    <div class="m-card-body m-code">
      <div class="m-vibe-prompt">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--lime)" stroke="none"><path d="M12 2l1.8 6.4L20 10l-6.2 1.6L12 18l-1.8-6.4L4 10l6.2-1.6z"/></svg>
        "Build a login form"
      </div>
      <div class="m-code-line" style="width:85%; background: rgba(255,255,255,0.5);"></div>
      <div class="m-code-line" style="width:48%; background: var(--cta);"></div>
      <div class="m-code-status">
        <span class="m-code-check"><svg viewBox="0 0 24 24" fill="none" stroke="#020109" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg></span>
        Ran successfully
      </div>
    </div>
  </div>
</div>`,
};

const FEATURE_ART = {
  'hiring-challenges': `
<div class="m-scene">
  ${CONFETTI}
  <div class="m-medal"><div class="num">12</div><div class="ord">Live</div></div>
  <div class="m-card m-card--vibe">
    <div class="m-card-head">
      <div class="m-vibe-lang"><span class="m-vibe-chip"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg></span>Hiring</div>
      <div class="m-card-label">Matched</div>
    </div>
    <div class="m-card-body m-assess">
      <div class="m-assess-row">
        <div class="m-check"><svg viewBox="0 0 24 24" fill="none" stroke="#020109" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg></div>
        <div>
          <div class="m-result-title">3 challenges match</div>
          <div class="m-result-sub">Based on your stack</div>
        </div>
      </div>
      <div class="m-tag-row">
        <span class="m-skill-tag">Python</span>
        <span class="m-skill-tag">SQL</span>
        <span class="m-skill-tag">React</span>
      </div>
    </div>
  </div>
</div>`,
  practice: GRINDER_ART,
  compete: `
<div class="m-scene">
  ${CONFETTI}
  <div class="m-medal"><div class="num" style="font-size:17px;">MAY</div><div class="ord">Vibecode</div></div>
  <div class="m-card m-card--assess">
    <div class="m-card-head">
      <div class="m-vibe-lang"><span class="m-vibe-chip"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8m-4-4v4M4 4h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z"/></svg></span>Compete</div>
      <div class="m-card-label">Live now</div>
    </div>
    <div class="m-card-body m-assess">
      <div class="m-lead-row"><span class="m-lead-rank gold">1</span><span class="m-lead-bar" style="width:72%;"></span></div>
      <div class="m-lead-row"><span class="m-lead-rank">2</span><span class="m-lead-bar" style="width:56%;"></span></div>
      <div class="m-lead-row"><span class="m-lead-rank">3</span><span class="m-lead-bar" style="width:44%;"></span></div>
    </div>
  </div>
</div>`,
  'mock-assessment': `
<div class="m-scene">
  ${CONFETTI}
  <div class="m-card m-card--vibe">
    <div class="m-card-head">
      <div class="m-vibe-lang"><span class="m-vibe-chip"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>Assessment</div>
      <div class="m-card-label">New</div>
    </div>
    <div class="m-card-body m-assess">
      <div class="m-assess-row">
        <div class="m-check"><svg viewBox="0 0 24 24" fill="none" stroke="#020109" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5v14l11-7z"/></svg></div>
        <div>
          <div class="m-result-title">Ready when you are</div>
          <div class="m-result-sub">Same format · same pressure</div>
        </div>
      </div>
      <div class="m-tag-row">
        <span class="m-skill-tag">Timed</span>
        <span class="m-skill-tag">Real format</span>
      </div>
    </div>
  </div>
</div>`,
  'vibecode-promo': `
<div class="m-scene">
  ${CONFETTI}
  <div class="m-card m-card--vibe">
    <div class="m-card-head">
      <div class="m-vibe-lang"><span class="m-vibe-chip">&lt;/&gt;</span>JS</div>
      <div class="m-card-label">VibeCode Arena</div>
    </div>
    <div class="m-card-body m-code">
      <div class="m-vibe-prompt">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--lime)" stroke="none"><path d="M12 2l1.8 6.4L20 10l-6.2 1.6L12 18l-1.8-6.4L4 10l6.2-1.6z"/></svg>
        "Build a REST API"
      </div>
      <div class="m-code-line" style="width:80%; background: rgba(255,255,255,0.5);"></div>
      <div class="m-code-line" style="width:56%; background: var(--cta);"></div>
      <div class="m-code-status">
        <span class="m-code-check"><svg viewBox="0 0 24 24" fill="none" stroke="#020109" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg></span>
        Ran successfully
      </div>
    </div>
  </div>
</div>`,
  'jobs-surface': `
<div class="m-scene">
  ${CONFETTI}
  <div class="m-card m-card--vibe">
    <div class="m-card-head">
      <div class="m-vibe-lang"><span class="m-vibe-chip"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></span>Profile</div>
      <div class="m-card-label">Visible</div>
    </div>
    <div class="m-card-body m-assess">
      <div class="m-assess-row">
        <div class="m-check"><svg viewBox="0 0 24 24" fill="none" stroke="#020109" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></div>
        <div>
          <div class="m-result-title">Companies are watching</div>
          <div class="m-result-sub">Hiring challenges match your profile</div>
        </div>
      </div>
      <div class="m-tag-row">
        <span class="m-skill-tag">Active</span>
        <span class="m-skill-tag">42 Solved</span>
      </div>
    </div>
  </div>
</div>`,
  'profile-nudge': `
<div class="m-scene">
  <div class="m-card m-card--vibe">
    <div class="m-card-head">
      <div class="m-vibe-lang"><span class="m-vibe-chip"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0 1 14 0v1"/></svg></span>Profile</div>
      <div class="m-card-label">68%</div>
    </div>
    <div class="m-card-body m-assess">
      <div class="m-assess-row">
        <div class="m-check"><svg viewBox="0 0 24 24" fill="none" stroke="#020109" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0 1 14 0v1"/></svg></div>
        <div>
          <div class="m-result-title">Your profile</div>
          <div class="m-result-sub">3 sections missing</div>
        </div>
      </div>
      <div>
        <div class="m-meter"><div class="m-meter-fill" style="width:62%;"></div></div>
        <div class="m-meter-label">62% complete</div>
      </div>
    </div>
  </div>
  <div class="m-nudge" style="top: 171px; left: 207px;">
    <span class="ring ring1"></span>
    <span class="ring ring2"></span>
    <span class="core">
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 12V6.5a1.5 1.5 0 0 1 3 0V11"/>
        <path d="M12 11V4.5a1.5 1.5 0 0 1 3 0V11"/>
        <path d="M15 11V7.5a1.5 1.5 0 0 1 3 0V13c0 3.3-2.7 6-6 6h-1a5 5 0 0 1-4.2-2.3L5 13.8a1.5 1.5 0 1 1 2.5-1.6L9 14"/>
      </svg>
    </span>
  </div>
</div>`,
};

const PATH_ROWS = [
  {
    key: 'hiring',
    label: 'Hiring Challenges',
    icon: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  },
  {
    key: 'practice',
    label: 'Practice',
    icon: '<path d="M8 6L3 12l5 6"/><path d="M16 6l5 6-5 6"/>',
  },
  {
    key: 'compete',
    label: 'Compete',
    icon: '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h2a2 2 0 0 1 0 4h-2"/><path d="M7 5H5a2 2 0 0 0 0 4h2"/>',
  },
];

const BUCKET_TO_PATH_KEY = { careerist: 'hiring', grinder: 'practice', builder: 'compete' };

function getStartedArt(bucket) {
  const activeKey = BUCKET_TO_PATH_KEY[bucket];
  const rows = PATH_ROWS.map((row) => {
    const isActive = row.key === activeKey;
    return `
      <div class="m-path-row${isActive ? ' active' : ''}">
        <span class="m-path-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${row.icon}</svg></span>
        <span class="m-path-label">${row.label}</span>
        <span class="m-path-arrow">→</span>
      </div>`;
  }).join('');
  return `
<div class="m-scene">
  ${CONFETTI}
  <div class="m-medal">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
    <div class="ord" style="margin-top:6px;">Start Here</div>
  </div>
  <div class="m-card m-card--nudge">
    <div class="m-card-head">
      <div class="m-vibe-lang"><span class="m-vibe-chip"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg></span>Get Started</div>
      <div class="m-card-label">Day 3</div>
    </div>
    <div class="m-card-body m-paths">${rows}
    </div>
  </div>
</div>`;
}

function artFor(config) {
  if (config.art === 'founder') return FOUNDER_ART;
  if (config.art === 'nudge:get-started') return getStartedArt(config.bucket);
  if (config.art && config.art.startsWith('milestone:')) {
    const key = config.art.split(':')[1];
    const art = MILESTONE_ART[key];
    if (!art) throw new Error(`Unknown milestone art: ${key}`);
    return art;
  }
  if (config.art && config.art.startsWith('feature:')) {
    const key = config.art.split(':')[1];
    const art = FEATURE_ART[key];
    if (!art) throw new Error(`Unknown feature art: ${key}`);
    return art;
  }
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
  const greetingHtml = config.greeting
    ? `<div class="greeting">${config.greeting}</div>`
    : '';
  const eyebrowBlock = config.eyebrow
    ? `<div class="eyebrow"><span class="bracket">[</span>${config.eyebrow.toUpperCase()}<span class="bracket">]</span></div>`
    : '';
  const ctaBlock = config.cta
    ? `<div class="cta">${config.cta} →</div>`
    : '';
  const isOnDark = config.theme === 'dark' || config.theme === 'navy';
  const themeClass = config.theme === 'dark' ? 'theme-dark' : config.theme === 'navy' ? 'theme-navy' : '';
  html = html
    .replace('__THEME_CLASS__', themeClass)
    .replace('__LOGO_SRC__', isOnDark ? '../assets/logo/logo-light.svg' : '../assets/logo/logo-dark.svg')
    .replace('__CONTOURS__', CONTOUR_SVG)
    .replace('__EYEBROW_BLOCK__', eyebrowBlock)
    .replace('__GREETING__', greetingHtml)
    .replace('__HEADLINE__', config.headline)
    .replace('__SUBCOPY__', subcopyHtml)
    .replace('__CTA_BLOCK__', ctaBlock)
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
