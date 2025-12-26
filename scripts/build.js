#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const DATA_DIR = path.join(ROOT, 'data');
const SITE_NAME = 'ContentFreaks';
const EPISODE_PAGE_SIZE = 12;
const BLOG_PAGE_SIZE = 12;

const STATIC_ASSETS = [
  'critical.css',
  'design-system.css',
  'components.css',
  'front-page.css',
  'page-episodes.css',
  'page-blog.css',
  'page-profile.css',
  'page-history.css',
  'single.css',
  'style.css',
  'loading.css',
  'microinteractions.css',
  'page-works.css',
  'css-async.js',
  'microinteractions.js',
  'page-works.js'
];

function readJson(file, fallback) {
  try {
    const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
}

function rimraf(target) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}年${m}月${day}日`;
}

function toSlug(input, fallback) {
  if (!input && !fallback) return '';
  const base = String(input || fallback)
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || (fallback ? String(fallback).replace(/[^a-z0-9]+/gi, '-') : '');
}

function normalizeEpisode(item, index) {
  const publishedAt = item.publishedAt || item.pubDate || item.date || null;
  const slug = item.slug || toSlug(item.title, item.id || index);
  return {
    id: item.id || item.guid || slug || String(index),
    slug,
    title: item.title || 'エピソード',
    description: item.description || '',
    fullDescription: item.fullDescription || item.description || '',
    publishedAt,
    formattedDate: formatDate(publishedAt),
    audioUrl: item.audioUrl || item.originalAudioUrl || '',
    episodeNumber: item.episodeNumber || '',
    duration: item.duration || '',
    category: item.category || 'エピソード',
    tags: Array.isArray(item.tags) ? item.tags : [],
    thumbnail: item.thumbnail || '',
    link: item.link || ''
  };
}

function normalizeBlog(item, index) {
  const publishedAt = item.publishedAt || item.date || null;
  const slug = item.slug || toSlug(item.title, item.id || index);
  return {
    id: item.id || slug || String(index),
    slug,
    title: item.title || 'ブログ記事',
    excerpt: item.excerpt || '',
    body: item.body || '',
    publishedAt,
    formattedDate: formatDate(publishedAt),
    image: item.image || '',
    tags: Array.isArray(item.tags) ? item.tags : [],
    category: item.category || '記事'
  };
}

function copyAssets() {
  STATIC_ASSETS.forEach((file) => {
    const src = path.join(ROOT, file);
    if (fs.existsSync(src)) {
      ensureDir(path.dirname(path.join(DIST, file)));
      fs.copyFileSync(src, path.join(DIST, file));
    }
  });
}

function renderHead(title, description) {
  const desc = description || 'ContentFreaks podcast static site';
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title ? `${title} - ${SITE_NAME}` : SITE_NAME}</title>
  <meta name="description" content="${desc}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+JP:wght@400;500;700;900&display=swap">
  <link rel="stylesheet" href="/critical.css">
  <link rel="stylesheet" href="/design-system.css">
  <link rel="stylesheet" href="/components.css">
  <link rel="stylesheet" href="/front-page.css">
  <link rel="stylesheet" href="/page-episodes.css">
  <link rel="stylesheet" href="/page-blog.css">
  <link rel="stylesheet" href="/page-profile.css">
  <link rel="stylesheet" href="/page-history.css">
  <link rel="stylesheet" href="/single.css">
  <link rel="stylesheet" href="/style.css">
  <link rel="stylesheet" href="/loading.css">
  <link rel="stylesheet" href="/microinteractions.css">
</head>
<body>
<a class="skip-link" href="#main-content">コンテンツへスキップ</a>
<header id="contentfreaks-header" class="minimal-header">
  <div class="header-container">
    <div class="brand-home">
      <a class="brand-link" href="/">
        <div class="brand-container">
          <div class="brand-icon">🎙️</div>
          <span class="brand-text">ContentFreaks</span>
        </div>
      </a>
    </div>
    <nav class="header-nav desktop-nav" aria-label="メインメニュー">
      <a href="/" class="nav-link">ホーム</a>
      <a href="/episodes/" class="nav-link">エピソード</a>
      <a href="/blog/" class="nav-link">ブログ</a>
      <a href="/profile/" class="nav-link">プロフィール</a>
      <a href="/history/" class="nav-link">コンフリの歩み</a>
    </nav>
    <div class="header-actions">
      <a class="pill-button" href="/episodes/">最新を聴く</a>
      <button class="menu-toggle" aria-expanded="false" aria-controls="mobile-nav"><span class="menu-icon-line"></span><span class="menu-icon-line"></span><span class="menu-icon-line"></span><span class="sr-only">メニュー</span></button>
    </div>
  </div>
</header>
<div class="nav-overlay" aria-hidden="true"></div>
<nav id="mobile-nav" class="mobile-slide-nav" aria-label="モバイルメニュー">
  <div class="mobile-nav-header">
    <div class="brand-home">
      <a class="brand-link" href="/">
        <div class="brand-container">
          <div class="brand-icon">🎙️</div>
          <span class="brand-text">ContentFreaks</span>
        </div>
      </a>
    </div>
    <button class="mobile-close" aria-label="メニューを閉じる">×</button>
  </div>
  <ul class="mobile-nav-links">
    <li><a href="/">ホーム</a></li>
    <li><a href="/episodes/">エピソード</a></li>
    <li><a href="/blog/">ブログ</a></li>
    <li><a href="/profile/">プロフィール</a></li>
    <li><a href="/history/">コンフリの歩み</a></li>
  </ul>
  <div class="mobile-nav-footer">
    <a class="pill-button" href="/episodes/">最新を聴く</a>
  </div>
</nav>
<script>
  (() => {
    const toggle = () => {
      const nav = document.getElementById('mobile-nav');
      const overlay = document.querySelector('.nav-overlay');
      const button = document.querySelector('.menu-toggle');
      if (!nav || !overlay || !button) return;
      const isOpen = nav.classList.contains('open');
      nav.classList.toggle('open', !isOpen);
      overlay.classList.toggle('active', !isOpen);
      document.body.classList.toggle('nav-open', !isOpen);
      button.setAttribute('aria-expanded', String(!isOpen));
    };

    const closeMenu = () => {
      const nav = document.getElementById('mobile-nav');
      const overlay = document.querySelector('.nav-overlay');
      const button = document.querySelector('.menu-toggle');
      if (!nav || !overlay || !button) return;
      nav.classList.remove('open');
      overlay.classList.remove('active');
      document.body.classList.remove('nav-open');
      button.setAttribute('aria-expanded', 'false');
    };

    document.addEventListener('DOMContentLoaded', () => {
      const trigger = document.querySelector('.menu-toggle');
      const overlay = document.querySelector('.nav-overlay');
      const close = document.querySelector('.mobile-close');
      const navLinks = document.querySelectorAll('.mobile-slide-nav a');
      trigger?.addEventListener('click', toggle);
      overlay?.addEventListener('click', closeMenu);
      close?.addEventListener('click', closeMenu);
      navLinks.forEach((link) => link.addEventListener('click', closeMenu));
    });
  })();
</script>
`;
}

function renderFooter() {
  const year = new Date().getFullYear();
  return `<footer id="contentfreaks-footer">
  <div class="footer-content">
    <div class="footer-section">
      <h3>${SITE_NAME}</h3>
      <ul class="footer-links">
        <li><a href="/">ホーム</a></li>
        <li><a href="/episodes/">エピソード</a></li>
        <li><a href="/blog/">ブログ</a></li>
        <li><a href="/profile/">プロフィール</a></li>
        <li><a href="/history/">コンフリの歩み</a></li>
      </ul>
    </div>
    <div class="footer-section">
      <h3>コンテンツ</h3>
      <ul class="footer-links">
        <li><a href="/episodes/">最新エピソード</a></li>
        <li><a href="https://anchor.fm/s/d8cfdc48/podcast/rss" target="_blank" rel="noopener">RSS</a></li>
      </ul>
    </div>
    <div class="footer-section">
      <h3>プラットフォーム</h3>
      <ul class="footer-links">
        <li><a href="https://open.spotify.com/show/20otj7CiCZ0hcWYkkEpnLL?si=w3Jlrpg5Ssmk0TGa_Flb8g" target="_blank" rel="noopener">Spotify</a></li>
        <li><a href="https://podcasts.apple.com/jp/podcast/%E3%82%B3%E3%83%B3%E3%83%86%E3%83%B3%E3%83%84%E3%83%95%E3%83%AA%E3%83%BC%E3%82%AF%E3%82%B9/id1692185758" target="_blank" rel="noopener">Apple Podcasts</a></li>
        <li><a href="https://youtube.com/@contentfreaks" target="_blank" rel="noopener">YouTube</a></li>
      </ul>
    </div>
    <div class="footer-section">
      <h3>お問い合わせ</h3>
      <ul class="footer-links">
        <li><a href="/contact/">お問い合わせフォーム</a></li>
        <li><a href="/privacy/">プライバシーポリシー</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <p>&copy; ${year} ${SITE_NAME}. All rights reserved.</p>
  </div>
</footer>
<script src="/css-async.js" defer></script>
<script src="/microinteractions.js" defer></script>
</body>
</html>`;
}

function renderPlatforms(platforms) {
  if (!Array.isArray(platforms)) return '';
  const items = platforms
    .map(
      (p) => `<a href="${p.url}" class="platform-link platform-${p.key}" target="_blank" rel="noopener">
  <div class="platform-icon">🎧</div>
  <div class="platform-name">${p.name}</div>
  <div class="platform-action">今すぐ聴く</div>
</a>`
    )
    .join('\n');
  return `<div class="platforms-grid">${items}</div>`;
}

function renderHosts(hosts) {
  if (!Array.isArray(hosts)) return '';
  const cards = hosts
    .map((host, idx) => {
      const socials = host.social || {};
      const links = Object.entries(socials)
        .filter(([, url]) => url)
        .map(([platform, url]) => `<a href="${url}" class="social-link" target="_blank" rel="noopener">${platform === 'youtube' ? '📺' : '🐦'}</a>`) 
        .join('');
      const tagList = host.tags || [];
      const tagBadges = tagList.map((t) => `<span class="host-tag primary">${t}</span>`).join('');
      const badge = idx === 0 ? 'Host' : 'Co-Host';
      return `<div class="host-profile-card ${idx === 0 ? 'host-card-primary' : 'host-card-secondary'}">
  <div class="host-profile-header">
    <div class="host-profile-avatar">
      ${host.image ? `<img src="${host.image}" alt="${host.name}" class="host-avatar-image">` : `<div class="avatar-placeholder ${idx === 0 ? 'primary-gradient' : 'secondary-gradient'}"><span class="avatar-icon">${host.emoji || '🎙️'}</span></div>`}
      <div class="avatar-badge">${badge}</div>
    </div>
    <div class="host-profile-info">
      <h2 class="host-name">${host.name}</h2>
      <p class="host-role">${host.role || ''}</p>
      <div class="host-tags">${tagBadges || ''}</div>
      <div class="host-social-links">${links}</div>
    </div>
  </div>
  <div class="host-profile-content">
    <div class="host-description"><p>${host.bio || ''}</p></div>
  </div>
</div>`;
    })
    .join('\n');
  return `<div class="profile-details-container">${cards}</div>`;
}

function renderEpisodeCard(ep) {
  const tags = (ep.tags || []).map((t) => `<span class="episode-tag">#${t}</span>`).join('');
  return `<article class="episode-card" data-category="${ep.category}">
  <div class="episode-card-header">
    <div class="episode-thumbnail">
      <a href="/episodes/${ep.slug}/">
        ${ep.thumbnail ? `<img src="${ep.thumbnail}" alt="${ep.title}" loading="lazy">` : '<div class="default-thumbnail"><div style="background: linear-gradient(135deg, #f7ff0b, #ff6b35); width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 3rem; border-radius: 12px;">🎙️</div></div>'}
      </a>
    </div>
  </div>
  <div class="episode-card-content">
    <div class="episode-meta">
      <div class="episode-meta-left">
        <span class="episode-date">${ep.formattedDate}</span>
        ${tags ? `<div class="episode-tags">${tags}</div>` : ''}
      </div>
    </div>
    <h3 class="episode-title"><a href="/episodes/${ep.slug}/">${ep.title}</a></h3>
  </div>
</article>`;
}

function renderBlogCard(post) {
  const tags = (post.tags || []).slice(0, 3).map((t) => `<span class="blog-tag">#${t}</span>`).join('');
  return `<article class="blog-card" data-category="${post.category}">
  <div class="blog-thumbnail">
    ${post.image ? `<img src="${post.image}" alt="${post.title}" loading="lazy">` : '<div class="blog-placeholder">📖</div>'}
    <div class="blog-category-badge">${post.category}</div>
    <div class="blog-date-badge">${post.formattedDate}</div>
  </div>
  <div class="blog-content">
    <div class="blog-meta">
      <span class="blog-author">ContentFreaks</span>
      <span class="blog-read-time">読了目安</span>
    </div>
    <h3 class="blog-title"><a href="/blog/${post.slug}/">${post.title}</a></h3>
    <div class="blog-excerpt">${post.excerpt}</div>
    <div class="blog-actions">
      <a href="/blog/${post.slug}/" class="blog-read-more">続きを読む</a>
      <div class="blog-tags">${tags}</div>
    </div>
  </div>
</article>`;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function writePage(relPath, html) {
  const outPath = path.join(DIST, relPath);
  ensureDir(path.dirname(outPath));
  fs.writeFileSync(outPath, html);
}

function buildHome({ episodes, site }) {
  const latest = episodes[0];
  const recent = episodes.slice(1, 4);
  const listenerCount = site.listenerCount || 1500;
  const platforms = renderPlatforms(site.platforms || []);
  const hosts = renderHosts(site.hosts || []);

  const latestBlock = latest
    ? `<div class="featured-episode">
  <div class="featured-episode-content">
    <div class="featured-episode-image">
      ${latest.thumbnail ? `<img src="${latest.thumbnail}" alt="${latest.title}" loading="eager">` : '<div class="featured-episode-default-thumbnail">🎙️</div>'}
    </div>
    <div class="featured-episode-details">
      <div class="episode-meta-info">
        <span class="episode-date">${latest.formattedDate}</span>
      </div>
      <h3 class="featured-episode-title">${latest.title}</h3>
      <div class="episode-actions"><a href="/episodes/${latest.slug}/" class="episode-share-btn">詳細を見る</a></div>
    </div>
  </div>
</div>`
    : '<p>最新エピソードがありません。</p>';

  const recentList = recent.map(renderEpisodeCard).join('\n');

  const html = `${renderHead('ホーム')}
<main id="main-content" class="site-main home-page">
<section class="podcast-hero" aria-labelledby="hero-title">
  <div class="podcast-hero-particles">${'<div class="particle"></div>'.repeat(9)}</div>
  <div class="podcast-hero-content">
    <div class="podcast-hero-main">
      <h1 id="hero-title" class="hero-title">ContentFreaks</h1>
      <p class="hero-subtitle">好きな作品、語り尽くそう！</p>
      <div class="podcast-hero-content-block">
        <div class="podcast-hero-artwork">
          <div class="podcast-artwork" style="background: var(--latest-episode-badge-bg); display: flex; align-items: center; justify-content: center; font-size: 4rem; color: var(--black);">🎙️</div>
        </div>
        <div class="podcast-hero-text">
          <div class="podcast-hero-description">「コンテンツフリークス」は、大学時代からの友人2人で「いま気になる」注目のエンタメコンテンツを熱く語るポッドキャスト</div>
          <div class="history-cta"><a href="/history/" class="history-btn">📜 コンフリの歩みを見る</a></div>
        </div>
      </div>
    </div>
    <div class="podcast-hero-sidebar">
      <div class="stats-section">
        <h3 class="sidebar-section-title">📊 ポッドキャスト情報</h3>
        <div class="podcast-stats">
          <div class="podcast-stat"><span class="podcast-stat-number" data-count="${episodes.length}">${episodes.length}</span><span class="podcast-stat-label">エピソード</span></div>
          <div class="podcast-stat"><span class="podcast-stat-number" data-count="${listenerCount}">${listenerCount}+</span><span class="podcast-stat-label">リスナー</span></div>
          <div class="podcast-stat"><span class="podcast-stat-number" data-count="4.7" data-decimal="true">4.7</span><span class="podcast-stat-label">評価</span></div>
        </div>
      </div>
    </div>
  </div>
</section>
<section id="latest-episode" class="latest-episode-section">
  <div class="latest-episode-container">
    <div class="latest-episode-header"><h2>最新エピソード</h2></div>
    ${latestBlock}
  </div>
</section>
<section class="episodes-section">
  <div class="episodes-container">
    <div class="episodes-header fade-in"><h2>最近のエピソード</h2></div>
    <div class="episodes-grid">${recentList}</div>
    <div class="episodes-cta">
      <a href="/episodes/" class="episodes-view-all-btn">🎧 全エピソードを見る</a>
      <a href="/blog/" class="blog-view-all-btn">📖 ブログ記事を見る</a>
    </div>
  </div>
</section>
<section class="hosts-section">
  <div class="hosts-container">
    <div class="hosts-header fade-in"><h2>ABOUT US</h2></div>
    <div class="slide-up delay-100">${hosts}</div>
    <div class="hosts-cta fade-in delay-200"><a href="/profile/" class="hosts-profile-btn btn-primary btn-shine">👥 詳しいプロフィールを見る</a></div>
  </div>
</section>
<section class="testimonials-section">
  <div class="testimonials-container">
    <div class="testimonials-header fade-in"><h2>リスナーの声</h2></div>
    <div class="testimonials-grid">
      <div class="testimonial-card scale-in delay-100"><div class="testimonial-quote">いつも配信ありがとうございます！毎度楽しく拝聴しています。</div><div class="testimonial-author"><div class="author-avatar">チ</div><div class="author-info"><h4>チャリさん</h4><div class="author-role">リスナー</div></div></div></div>
      <div class="testimonial-card scale-in delay-200"><div class="testimonial-quote">自分と違う視点の感想を聞くことが出来て、一緒に盛り上がれるのが嬉しいです。</div><div class="testimonial-author"><div class="author-avatar">の</div><div class="author-info"><h4>のじかさん</h4><div class="author-role">リスナー</div></div></div></div>
    </div>
  </div>
</section>
<section id="platforms" class="podcast-platforms-section">
  <div class="platforms-container">
    <div class="platforms-header fade-in"><h2>どこでも聴ける</h2><p class="platforms-subtitle">お好みのプラットフォームでコンテンツフリークスをお楽しみください</p></div>
    <div class="slide-up delay-100">${platforms}</div>
  </div>
</section>
</main>
${renderFooter()}`;

  writePage('index.html', html);
}

function buildEpisodeList({ episodes }) {
  const pages = chunk(episodes, EPISODE_PAGE_SIZE);
  pages.forEach((pageItems, idx) => {
    const pageNumber = idx + 1;
    const cards = pageItems.map(renderEpisodeCard).join('\n');
    const pagination = pages.length > 1
      ? `<div class="pagination">${pages
          .map((_, i) => {
            const n = i + 1;
            const href = n === 1 ? '/episodes/' : `/episodes/page/${n}/`;
            const cls = n === pageNumber ? 'page-number active' : 'page-number';
            return `<a class="${cls}" href="${href}">${n}</a>`;
          })
          .join('')}</div>`
      : '';
    const html = `${renderHead('エピソード一覧')}
  <main id="main-content" class="site-main contentfreaks-episodes-page">
  <section class="episodes-hero"><div class="episodes-hero-bg"><div class="hero-pattern"></div></div><div class="episodes-hero-content"><div class="episodes-hero-icon">🎙️</div><h1>Podcast Episodes</h1><p class="episodes-hero-description">コンテンツフリークスの全エピソードを一覧でお楽しみください。</p><div class="episodes-hero-stats"><div class="episodes-stat"><span class="episodes-stat-number">${episodes.length}</span><span class="episodes-stat-label">エピソード</span></div><div class="episodes-stat"><span class="episodes-stat-number">🔥</span><span class="episodes-stat-label">熱い語り</span></div><div class="episodes-stat"><span class="episodes-stat-number">🔍</span><span class="episodes-stat-label">深掘り分析</span></div></div></div></section>
  <section class="episodes-content-section"><div class="episodes-container"><div class="search-controls"><div class="search-box"><input type="text" id="episode-search" class="search-input" placeholder="エピソードを検索..." /></div></div><div class="episodes-grid" id="episodes-grid">${cards}</div>${pagination}</div></section>
  </main>
  ${renderFooter()}`;
    const rel = pageNumber === 1 ? 'episodes/index.html' : `episodes/page/${pageNumber}/index.html`;
    writePage(rel, html);
  });
}

function buildEpisodeDetails({ episodes }) {
  episodes.forEach((ep, idx) => {
    const related = episodes.filter((e) => e.id !== ep.id).slice(0, 3);
    const relatedCards = related
      .map(
        (r) => `<article class="related-episode-card">
  <div class="related-episode-thumbnail">
    <a href="/episodes/${r.slug}/">${r.thumbnail ? `<img src="${r.thumbnail}" alt="${r.title}" loading="lazy">` : '<div style="background: linear-gradient(135deg, #f7ff0b, #ff6b35); width: 100%; height: 150px; display: flex; align-items: center; justify-content: center; font-size: 2rem; border-radius: 10px;">🎙️</div>'}</a>
  </div>
  <div class="related-episode-info">
    <div class="related-episode-date">${r.formattedDate}</div>
    <h4 class="related-episode-title"><a href="/episodes/${r.slug}/">${r.title}</a></h4>
    ${r.duration ? `<div class="related-episode-duration">⏱️ ${r.duration}</div>` : ''}
  </div>
</article>`
      )
      .join('\n');

    const tags = (ep.tags || []).map((t) => `<a class="episode-tag" href="/tags/${toSlug(t)}/">🏷️ ${t}</a>`).join('');

    const html = `${renderHead(ep.title)}
  <main id="main-content" class="site-main">
  <div class="single-episode-container">
  <article class="single-episode">
    <header class="episode-header">
      <div class="episode-header-content">
        <div class="episode-featured-image">${ep.thumbnail ? `<img src="${ep.thumbnail}" alt="${ep.title}" loading="eager">` : '<div class="default-episode-image"><div style="background: linear-gradient(135deg, #f7ff0b, #ff6b35); width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 4rem; border-radius: 15px;">🎙️</div></div>'}${ep.episodeNumber ? `<div class="episode-number-large">EP.${ep.episodeNumber}</div>` : ''}</div>
        <div class="episode-info">
          <div class="episode-meta"><span class="episode-date">${ep.formattedDate}</span>${ep.duration ? `<span class="episode-duration">⏱️ ${ep.duration}</span>` : ''}${tags ? `<span class="episode-tags">${tags}</span>` : ''}</div>
          <h1 class="episode-title">${ep.title}</h1>
        </div>
      </div>
      <div class="episode-platform-links"><h3 class="platform-links-title">🎧 お好みのアプリで聴く</h3>${renderPlatforms((readJson('site.json', {}).platforms || []))}</div>
    </header>
    <div class="episode-content"><div class="episode-content-wrapper"><div class="content-text">${ep.fullDescription || ep.description || ''}</div></div></div>
    <div class="related-episodes"><h3 class="related-episodes-title">🎵 関連エピソード</h3><div class="related-episodes-grid">${relatedCards}</div></div>
    <div class="episode-navigation"><div class="episode-nav-links"><div class="nav-center"><a href="/episodes/" class="episode-nav-link episodes-list">🎧 エピソード一覧</a></div></div></div>
  </article>
</div>
</main>
${renderFooter()}`;

    writePage(`episodes/${ep.slug}/index.html`, html);
  });
}

function buildBlog({ posts }) {
  const pages = chunk(posts, BLOG_PAGE_SIZE);
  if (pages.length === 0) {
    pages.push([]); // データがなくても一覧ページを出力し404を防ぐ
  }
  const makeHtml = (pageItems, pageNumber) => {
    const cards = pageItems.length
      ? pageItems.map(renderBlogCard).join('\n')
      : '<div class="no-blog-posts"><p>ブログ記事が見つかりませんでした。</p><p>新しい記事を追加してください。</p></div>';

    const pagination = pages.length > 1
      ? `<div class="load-more-container"><div class="pagination">${pages
          .map((_, i) => {
            const n = i + 1;
            const href = n === 1 ? '/blog/' : `/blog/page/${n}/`;
            const cls = n === pageNumber ? 'page-number active' : 'page-number';
            return `<a class="${cls}" href="${href}">${n}</a>`;
          })
          .join('')}</div></div>`
      : '';

    return `${renderHead('ブログ')}
  <main id="main-content" class="site-main contentfreaks-episodes-page">
  <div class="content-area">
    <section class="blog-hero">
      <div class="blog-hero-bg">
        <div class="hero-pattern"></div>
      </div>
      <div class="blog-hero-particles">
        <div class="blog-particle"></div><div class="blog-particle"></div><div class="blog-particle"></div><div class="blog-particle"></div><div class="blog-particle"></div><div class="blog-particle"></div>
      </div>
      <div class="blog-hero-content">
        <div class="blog-hero-icon">📖</div>
        <h1>Blog Articles</h1>
        <p class="blog-hero-description">コンテンツフリークスの手動投稿ブログ記事。ポッドキャスト分析、レビュー、コラムなど、じっくり読める記事をお届けします。</p>
        <div class="blog-stats">
          <div class="blog-stat"><span class="blog-stat-number">${posts.length}</span><span class="blog-stat-label">記事</span></div>
          <div class="blog-stat"><span class="blog-stat-number">✍️</span><span class="blog-stat-label">執筆記事</span></div>
          <div class="blog-stat"><span class="blog-stat-number">💡</span><span class="blog-stat-label">分析</span></div>
        </div>
      </div>
    </section>

    <div class="main-content">
      <div class="blog-filters">
        <button class="blog-filter-btn active" data-filter="all">すべて</button>
        <button class="blog-filter-btn" data-filter="レビュー">レビュー</button>
        <button class="blog-filter-btn" data-filter="コラム">コラム</button>
        <button class="blog-filter-btn" data-filter="分析">分析</button>
      </div>

      <div class="blog-grid" id="blog-grid">${cards}</div>
      ${pagination}
    </div>
  </div>
</main>
${renderFooter()}`;
  };

  pages.forEach((pageItems, idx) => {
    const pageNumber = idx + 1;
    const rel = pageNumber === 1 ? 'blog/index.html' : `blog/page/${pageNumber}/index.html`;
    writePage(rel, makeHtml(pageItems, pageNumber));
  });
}

function buildBlogDetails({ posts }) {
  if (!posts.length) return;
  posts.forEach((post) => {
    const tags = (post.tags || []).map((t) => `<span class="blog-tag">#${t}</span>`).join('');
    const html = `${renderHead(post.title)}
  <main id="main-content" class="site-main contentfreaks-episodes-page">
  <div class="content-area">
    <section class="blog-hero">
      <div class="blog-hero-bg"><div class="hero-pattern"></div></div>
      <div class="blog-hero-content">
        <div class="blog-hero-icon">📖</div>
        <h1>${post.title}</h1>
        <p class="blog-hero-description">${post.excerpt || ''}</p>
      </div>
    </section>

    <article class="blog-card blog-detail">
      <div class="blog-thumbnail">
        ${post.image ? `<img src="${post.image}" alt="${post.title}" loading="eager">` : '<div class="blog-placeholder">📖</div>'}
        <div class="blog-category-badge">${post.category}</div>
        <div class="blog-date-badge">${post.formattedDate}</div>
      </div>
      <div class="blog-content">
        <div class="blog-meta">
          <span class="blog-author">ContentFreaks</span>
          <span class="blog-read-time">読了 ${post.readTime || '3分'}</span>
        </div>
        <h3 class="blog-title">${post.title}</h3>
        <div class="blog-excerpt">${post.excerpt || ''}</div>
        <div class="blog-body">${post.body || ''}</div>
        <div class="blog-actions">
          <a href="/blog/" class="blog-read-more">ブログ一覧へ戻る</a>
          <div class="blog-tags">${tags}</div>
        </div>
      </div>
    </article>
  </div>
</main>
${renderFooter()}`;
    writePage(`blog/${post.slug}/index.html`, html);
  });
}

function buildProfile({ site, episodes }) {
  const hosts = renderHosts(site.hosts || []);
  const hostCount = (site.hosts || []).length;
  const episodeCount = episodes.length;
  const listenerCount = site.listenerCount || 1500;
  const html = `${renderHead('プロフィール')}
<main id="main-content" class="site-main profile-page">
  <section class="profile-hero">
    <div class="profile-hero-bg"><div class="hero-pattern"></div></div>
    <div class="profile-hero-content">
      <div class="profile-hero-header">
        <div class="profile-hero-icon">🎙️</div>
        <h1 class="profile-hero-title">Meet the Team</h1>
        <p class="profile-hero-subtitle">コンテンツフリークスを支える2人のパーソナリティをご紹介</p>
        <div class="profile-hero-stats">
          <div class="hero-stat"><span class="stat-number">${hostCount}</span><span class="stat-label">パーソナリティ</span></div>
          <div class="hero-stat"><span class="stat-number">${episodeCount}</span><span class="stat-label">エピソード</span></div>
          <div class="hero-stat"><span class="stat-number">${listenerCount}+</span><span class="stat-label">リスナー</span></div>
        </div>
      </div>
    </div>
  </section>

  <section class="profile-details-section">
    ${hosts || '<div class="profile-details-container"><p>ホスト情報がまだありません。</p></div>'}
  </section>

  <section class="team-dynamics-section">
    <div class="team-dynamics-container">
      <div class="section-header">
        <h2 class="section-title">Perfect Chemistry</h2>
        <p class="section-subtitle">それぞれの個性を活かした絶妙なコンビネーション</p>
      </div>
      <div class="dynamics-visual">
        <div class="host-connection">
          <div class="host-bubble host1"><div class="bubble-icon">🎙️</div><div class="bubble-content"><h4>みっくん</h4><p>深掘り＆分析</p></div></div>
          <div class="connection-line"><div class="connection-icon">⚡</div></div>
          <div class="host-bubble host2"><div class="bubble-icon">🎧</div><div class="bubble-content"><h4>あっきー</h4><p>親しみやすさ</p></div></div>
        </div>
      </div>
      <div class="roles-grid">
        <div class="role-card featured">
          <div class="role-header"><div class="role-icon primary">🎙️</div><h3 class="role-title">みっくん</h3><span class="role-badge">Main Host</span></div>
          <div class="role-description">
            <p class="role-summary"><strong>司会進行＆深掘り担当</strong></p>
            <ul class="role-list">
              <li><span class="list-icon">🔍</span>作品の裏側や制作背景を分析</li>
              <li><span class="list-icon">🎯</span>話題の引き出しと流れの管理</li>
              <li><span class="list-icon">🔥</span>熱いトークで盛り上げ役</li>
            </ul>
          </div>
        </div>
        <div class="role-card featured">
          <div class="role-header"><div class="role-icon secondary">🎧</div><h3 class="role-title">あっきー</h3><span class="role-badge">Co-Host</span></div>
          <div class="role-description">
            <p class="role-summary"><strong>一般目線＆親しみやすさ担当</strong></p>
            <ul class="role-list">
              <li><span class="list-icon">👁️</span>リスナーと同じ視点での感想</li>
              <li><span class="list-icon">😊</span>親しみやすい雰囲気作り</li>
              <li><span class="list-icon">💭</span>気軽に楽しめるトーク</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="teamwork-highlights">
    <div class="teamwork-container">
      <h2 class="section-title">What Makes Us Special</h2>
      <div class="highlights-grid">
        <div class="highlight-card"><div class="highlight-icon">🎯</div><h3>絶妙なバランス</h3><p>深い分析と親しみやすさの完璧な組み合わせで、すべてのリスナーが楽しめるコンテンツを提供</p></div>
        <div class="highlight-card"><div class="highlight-icon">🔄</div><h3>相互補完</h3><p>お互いの強みを活かし、弱みを補い合う理想的なパートナーシップ</p></div>
        <div class="highlight-card"><div class="highlight-icon">🎨</div><h3>多角的視点</h3><p>異なるバックグラウンドから生まれる多様な視点で、コンテンツを多面的に解析</p></div>
      </div>
    </div>
  </section>

  <section class="contact-cta-section">
    <div class="contact-cta-bg"><div class="cta-pattern"></div></div>
    <div class="contact-cta-container">
      <div class="contact-cta-content">
        <div class="cta-icon">💌</div>
        <h2 class="contact-cta-title">Let's Connect!</h2>
        <p class="contact-cta-description">番組への感想、取り上げてほしいコンテンツ、ご質問など、どんなメッセージもお待ちしています！</p>
        <div class="cta-buttons">
          <a href="/contact/" class="contact-cta-button primary"><span class="btn-icon">✉️</span>お問い合わせ</a>
          <a href="/episodes/" class="contact-cta-button secondary"><span class="btn-icon">🎧</span>エピソード一覧</a>
        </div>
      </div>
    </div>
  </section>
</main>
${renderFooter()}`;

  writePage('profile/index.html', html);
}

function buildHistory({ site, episodes }) {
  const episodeCount = episodes.length;
  const listenerCount = site.listenerCount || 1500;
  const days = Math.max(1, Math.floor((Date.now() - new Date('2023-06-01').getTime()) / (1000 * 60 * 60 * 24)));
  const html = `${renderHead('コンフリの歩み')}
<main id="main-content" class="site-main history-page">
  <section class="history-hero">
    <div class="history-hero-bg"><div class="hero-particles"></div><div class="hero-waves"></div></div>
    <div class="history-hero-content">
      <div class="history-hero-header">
        <div class="hero-icon-container"><div class="hero-icon">📖</div><div class="hero-icon-glow"></div></div>
        <h1 class="history-hero-title">Our Journey</h1>
        <p class="history-hero-subtitle">「カラビナFM」から「コンテンツフリークス」へ<br>2人の成長と番組の進化の軌跡</p>
        <div class="journey-stats">
          <div class="journey-stat"><span class="stat-value">${episodeCount}+</span><span class="stat-unit">エピソード</span></div>
          <div class="journey-stat"><span class="stat-value">200+</span><span class="stat-unit">配信時間</span></div>
          <div class="journey-stat"><span class="stat-value">${listenerCount}+</span><span class="stat-unit">フォロワー</span></div>
          <div class="journey-stat"><span class="stat-value">${days}+</span><span class="stat-unit">継続日数</span></div>
        </div>
      </div>
    </div>
  </section>

  <section class="timeline-section">
    <div class="timeline-container">
      <div class="timeline-intro">
        <h2 class="timeline-title">The Story Unfolds</h2>
        <p class="timeline-subtitle">小さな雑談番組から愛される番組への成長ストーリー</p>
      </div>
      <div class="year-section" data-year="2023">
        <div class="year-header"><div class="year-badge"><span class="year-number">2023</span><div class="year-accent"></div></div><div class="year-info"><h3 class="year-title">The Beginning</h3><p class="year-subtitle">「コンテンツを語る楽しさ」に気付いた一年</p></div></div>
        <div class="timeline">
          <div class="timeline-item launch" data-aos="fade-up"><div class="timeline-marker"><div class="marker-icon">🎙️</div><div class="marker-pulse"></div></div><div class="timeline-date"><span class="date-month">6月</span><span class="date-year">2023</span></div><div class="timeline-content"><div class="content-header"><h4 class="timeline-title">ポッドキャスト番組スタート！</h4><span class="timeline-badge launch-badge">Launch</span></div><p class="timeline-description">みっくんが大学時代の友人・あっきーを誘い、ポッドキャスト番組「カラビナFM」をスタート！当初は「お互いが気になる話題を持ち寄る雑談番組」として始動。</p><div class="timeline-impact"><span class="impact-label">Impact:</span><span class="impact-text">番組の原点となる記念すべき第一歩</span></div><div class="artwork-showcase"><img src="https://content-freaks.jp/wp-content/uploads/2024/05/1000017105.jpg" alt="カラビナFM初期アートワーク" class="artwork-image"><div class="artwork-caption"><span class="caption-label">🎨</span><span class="caption-text">カラビナFM初期アートワーク</span></div></div></div></div>
          <div class="timeline-item milestone" data-aos="fade-up" data-aos-delay="100"><div class="timeline-marker"><div class="marker-icon">🎬</div><div class="marker-pulse"></div></div><div class="timeline-date"><span class="date-month">7月</span><span class="date-year">2023</span></div><div class="timeline-content"><div class="content-header"><h4 class="timeline-title">初のコンテンツ回を配信</h4><span class="timeline-badge milestone-badge">Milestone</span></div><p class="timeline-description">初のコンテンツ回となる #4「アニメ『推しの子』は何が凄かったのか？」を配信。コンテンツについて語る楽しさに気付き、番組の方向性が少しずつ固まり始める。</p><div class="timeline-actions"><a href="https://open.spotify.com/episode/1Jz9gurZNUnVGoN8suwWiN?si=r1jmQN8QT--sSQR2Ox9Mdg" class="timeline-link" target="_blank" rel="noopener"><span class="link-icon">▶</span>エピソードを聴く</a></div></div></div>
          <div class="timeline-item innovation" data-aos="fade-up" data-aos-delay="200"><div class="timeline-marker"><div class="marker-icon">📊</div><div class="marker-pulse"></div></div><div class="timeline-date"><span class="date-month">8〜9月</span><span class="date-year">2023</span></div><div class="timeline-content"><div class="content-header"><h4 class="timeline-title">初の分析回で新たな構想が誕生</h4><span class="timeline-badge innovation-badge">Innovation</span></div><p class="timeline-description">初の分析回 #10「配信をした感想とデータ分析から見る今後のカラビナFMの進む道」を配信。コンテンツ回の再生数の伸びを受け、みっくんの頭の中に「コンテンツフリークス構想」が生まれる。</p><div class="timeline-actions"><a href="https://open.spotify.com/episode/2KbVneYdYlnpjSwdM2koEt?si=FquwD8KQSs6zezavnpe1cg" class="timeline-link" target="_blank" rel="noopener"><span class="link-icon">▶</span>エピソードを聴く</a></div></div></div>
          <div class="timeline-item featured breakthrough" data-aos="fade-up" data-aos-delay="300"><div class="timeline-marker featured-marker"><div class="marker-icon">⭐</div><div class="marker-pulse featured-pulse"></div></div><div class="timeline-date"><span class="date-month">10月</span><span class="date-year">2023</span></div><div class="timeline-content featured-content"><div class="content-header"><h4 class="timeline-title">人気エピソード誕生＆リニューアル発表</h4><span class="timeline-badge breakthrough-badge">Breakthrough</span></div><p class="timeline-description">アニメ「葬送のフリーレン」回（#20）を配信。当時No1の人気エピソードに！<br><br>このタイミングで<strong>番組リニューアルを発表</strong>。「カラビナFM」から「コンテンツフリークス」へと改名！</p><div class="timeline-actions"><a href="https://open.spotify.com/episode/44KqaSVB1BSEtZm3cYMwLP?si=WeGYuKVrRZygWA9rowc8bg" class="timeline-link featured-link" target="_blank" rel="noopener"><span class="link-icon">▶</span>エピソードを聴く</a></div><div class="timeline-visual"><div class="artwork-showcase"><img src="https://content-freaks.jp/wp-content/uploads/2024/05/1000014856-1024x1024.png" alt="コンテンツフリークス初期アートワーク" class="artwork-image"><div class="artwork-caption"><span class="caption-label">🎨</span><span class="caption-text">コンテンツフリークス初期アートワーク</span></div></div></div></div></div>
          <div class="timeline-item community" data-aos="fade-up" data-aos-delay="400"><div class="timeline-marker"><div class="marker-icon">🔬</div><div class="marker-pulse"></div></div><div class="timeline-date"><span class="date-month">11月</span><span class="date-year">2023</span></div><div class="timeline-content"><div class="content-header"><h4 class="timeline-title">科学系ポッドキャストの日に初参加</h4><span class="timeline-badge community-badge">Community</span></div><p class="timeline-description">「科学系ポッドキャストの日」に初参加。#25 映画『私は確信する』回を配信。科学系ポッドキャスト「サイエントーク」の大ファンであるみっくん＆あっきー、大歓喜！</p><div class="timeline-actions"><a href="https://open.spotify.com/episode/2doICgnSs0wVdKyqK9BXaE?si=uBKftPsrRJCRkTgo69Wvsw" class="timeline-link" target="_blank" rel="noopener"><span class="link-icon">▶</span>エピソードを聴く</a></div></div></div>
          <div class="timeline-item awards" data-aos="fade-up" data-aos-delay="500"><div class="timeline-marker"><div class="marker-icon">🏆</div><div class="marker-pulse"></div></div><div class="timeline-date"><span class="date-month">12月</span><span class="date-year">2023</span></div><div class="timeline-content"><div class="content-header"><h4 class="timeline-title">2023年コンテンツフリークス大賞を発表</h4><span class="timeline-badge awards-badge">Awards</span></div><p class="timeline-description">「2023年コンテンツフリークス大賞」を発表！</p><div class="awards-list"><div class="award-item grand"><span class="award-icon">🏆</span><span class="award-text">コンテンツフリークス大賞：「PLUTO」</span></div><div class="award-item"><span class="award-icon">🎖</span><span class="award-text">みっくん賞：「私は確信する」</span></div><div class="award-item"><span class="award-icon">🎖</span><span class="award-text">あっきー賞：「ゴジラ-1.0」</span></div></div><div class="timeline-actions"><a href="https://open.spotify.com/episode/3G1nDsYBljNCbUnA496aBp?si=XqUBDXOaRxeIg64cpFmVkA" class="timeline-link" target="_blank" rel="noopener"><span class="link-icon">▶</span>エピソードを聴く</a></div></div></div>
        </div>
      </div>

      <div class="year-section" data-year="2024">
        <div class="year-header"><div class="year-badge"><span class="year-number">2024</span><div class="year-accent"></div></div><div class="year-info"><h3 class="year-title">Growth & Evolution</h3><p class="year-subtitle">「コンテンツを語る楽しさ」を痛感した一年</p></div></div>
        <div class="timeline">
          <div class="timeline-item upgrade" data-aos="fade-up"><div class="timeline-marker"><div class="marker-icon">🎵</div><div class="marker-pulse"></div></div><div class="timeline-date"><span class="date-month">1月</span><span class="date-year">2024</span></div><div class="timeline-content"><div class="content-header"><h4 class="timeline-title">番組クオリティ向上プロジェクト</h4><span class="timeline-badge upgrade-badge">Upgrade</span></div><p class="timeline-description">番組のクオリティ向上を目指し、さまざまな試みをスタート！</p><div class="improvement-list"><div class="improvement-item"><span class="improvement-icon">🎶</span><span class="improvement-text">BGMを追加</span></div><div class="improvement-item"><span class="improvement-icon">🔊</span><span class="improvement-text">ジングルを2種類作成</span></div><div class="improvement-item"><span class="improvement-icon">🎼</span><span class="improvement-text">オリジナルテーマソングを制作</span></div></div></div></div>
          <div class="timeline-item featured celebration" data-aos="fade-up" data-aos-delay="100"><div class="timeline-marker featured-marker"><div class="marker-icon">🎉</div><div class="marker-pulse featured-pulse"></div></div><div class="timeline-date"><span class="date-month">2〜3月</span><span class="date-year">2024</span></div><div class="timeline-content featured-content"><div class="content-header"><h4 class="timeline-title">50回配信達成＆アートワークリニューアル</h4><span class="timeline-badge celebration-badge">Celebration</span></div><p class="timeline-description">50回配信を達成！記念としてアートワークをリニューアル！</p><div class="timeline-visual"><div class="artwork-showcase"><img src="https://content-freaks.jp/wp-content/uploads/2024/05/1000015915-1024x1024.png" alt="最新アートワーク" class="artwork-image"><div class="artwork-caption"><span class="caption-label">🎨</span><span class="caption-text">50回記念アートワーク</span></div></div></div></div></div>
          <div class="timeline-item collaboration" data-aos="fade-up" data-aos-delay="200"><div class="timeline-marker"><div class="marker-icon">🎙</div><div class="marker-pulse"></div></div><div class="timeline-date"><span class="date-month">4月</span><span class="date-year">2024</span></div><div class="timeline-content"><div class="content-header"><h4 class="timeline-title">初のコラボ回を配信</h4><span class="timeline-badge collaboration-badge">Collaboration</span></div><p class="timeline-description">初のコラボ回を配信！ゲストに「平成男女のイドバタラジオ」の"みな"さんを迎え、熱いトークを展開！<br><br>さらに、人気コンテンツの完結感想回を配信。<br>#68-69「葬送のフリーレン」「るぷナナ」完結感想回</p><div class="timeline-actions"><a href="https://open.spotify.com/episode/661RG21Jp2Rs7PFggQ4nXE?si=1Q6tg0v4RaydL_krSec_sQ" class="timeline-link" target="_blank" rel="noopener"><span class="link-icon">▶</span>エピソードを聴く</a></div></div></div>
          <div class="timeline-item collaboration" data-aos="fade-up" data-aos-delay="300"><div class="timeline-marker"><div class="marker-icon">🎙</div><div class="marker-pulse"></div></div><div class="timeline-date"><span class="date-month">5月</span><span class="date-year">2024</span></div><div class="timeline-content"><div class="content-header"><h4 class="timeline-title">コラボ回第2弾</h4><span class="timeline-badge collaboration-badge">Collaboration</span></div><p class="timeline-description">コラボ回を再び配信！ゲストに「ひよっこ研究者のさばいばる日記」の"はち"さんを迎える。<br>#72「劇場版 名探偵コナン」完結感想回</p><div class="timeline-actions"><a href="https://open.spotify.com/episode/5NX4d5OYHQ7bh0VlNT42wj?si=BbHpDgGvTiqBl6xmkErO2Q" class="timeline-link" target="_blank" rel="noopener"><span class="link-icon">▶</span>エピソードを聴く</a></div></div></div>
          <div class="timeline-item launch" data-aos="fade-up" data-aos-delay="400"><div class="timeline-marker"><div class="marker-icon">🌐</div><div class="marker-pulse"></div></div><div class="timeline-date"><span class="date-month">6月</span><span class="date-year">2024</span></div><div class="timeline-content"><div class="content-header"><h4 class="timeline-title">公式ホームページ開設</h4><span class="timeline-badge launch-badge">Launch</span></div><p class="timeline-description">コンテンツフリークスの公式ホームページを開設！初期コンテンツとして「トップページ」「プロフィール」「コンテンツフリークスの歩み」を準備。</p><div class="timeline-impact"><span class="impact-label">Impact:</span><span class="impact-text">デジタルプレゼンスの大幅向上</span></div></div></div>
          <div class="timeline-item milestone" data-aos="fade-up" data-aos-delay="500"><div class="timeline-marker"><div class="marker-icon">🎯</div><div class="marker-pulse"></div></div><div class="timeline-date"><span class="date-month">7月</span><span class="date-year">2024</span></div><div class="timeline-content"><div class="content-header"><h4 class="timeline-title">🎉 Spotify 100フォロワー突破</h4><span class="timeline-badge milestone-badge">Milestone</span></div><p class="timeline-description">Spotifyのフォロワー数が100人を突破！ひとつの大台にのった瞬間で、番組開始当初からは考えられない成長に驚きと喜びを感じました。<br><br>ブログページに新たに2記事を追加し、ポッドキャスト運営の知見を共有：「ポッドキャスターを喜ばせる方法」「ポッドキャスト1年の振り返り」</p><div class="timeline-impact"><span class="impact-label">Impact:</span><span class="impact-text">番組の継続と成長の確信を得られた記念すべき瞬間</span></div></div></div>
          <div class="timeline-item breakthrough" data-aos="fade-up" data-aos-delay="600"><div class="timeline-marker"><div class="marker-icon">📺</div><div class="marker-pulse"></div></div><div class="timeline-date"><span class="date-month">8月</span><span class="date-year">2024</span></div><div class="timeline-content"><div class="content-header"><h4 class="timeline-title">📺 YouTube 100登録者突破＆初メディア掲載</h4><span class="timeline-badge breakthrough-badge">Breakthrough</span></div><p class="timeline-description">YouTubeの登録者数が100人を突破！まだ戦略なく運営していた中での予想外の成長に驚きました。<br><br>「ポッドキャストランキング」様の「WEEKLY PICKUP!!」に選出！突然選ばれていてびっくりした、初めてメディアに載った記念すべき瞬間でした。</p><div class="timeline-impact"><span class="impact-label">Impact:</span><span class="impact-text">メディア掲載の影響かフォロワー数が大幅増加</span></div></div></div>
          <div class="timeline-item innovation" data-aos="fade-up" data-aos-delay="700"><div class="timeline-marker"><div class="marker-icon">🚀</div><div class="marker-pulse"></div></div><div class="timeline-date"><span class="date-month">9月</span><span class="date-year">2024</span></div><div class="timeline-content"><div class="content-header"><h4 class="timeline-title">📈 フォロワー成長＆YouTube ショート動画革命</h4><span class="timeline-badge innovation-badge">Innovation</span></div><p class="timeline-description">Spotifyのフォロワー数が150人突破！YouTubeの登録者数が300人突破！<br><br>YouTube登録者が増え、ショート動画を出してみたらどうなるか試してみたくて、初のショート動画を投稿開始！5分で作成可能なショート動画のフォーマットを確立。</p><div class="timeline-impact"><span class="impact-label">Impact:</span><span class="impact-text">ショート動画は番組が広がるきっかけになると実感</span></div></div></div>
          <div class="timeline-item viral" data-aos="fade-up" data-aos-delay="800"><div class="timeline-marker"><div class="marker-icon">🔥</div><div class="marker-pulse"></div></div><div class="timeline-date"><span class="date-month">10〜11月</span><span class="date-year">2024</span></div><div class="timeline-content"><div class="content-header"><h4 class="timeline-title">📈 YouTube爆発的成長期</h4><span class="timeline-badge viral-badge">Viral</span></div><p class="timeline-description">10月に400人突破、11月に600人突破！<br><br>目黒蓮主演の「海のはじまり」の感想動画がバズりまくって、ドラマ感想回を出す度に登録者が増えていく現象が発生！最終回動画は1.5万回以上再生。<br><br>11月にポッドキャストシンポジウム、ポッドキャストウィークエンドなどのリアルイベントに参加！</p><div class="timeline-impact"><span class="impact-label">Impact:</span><span class="impact-text">ドラマ感想回が番組成長の大きな要因となることを確信</span></div></div></div>
          <div class="timeline-item awards" data-aos="fade-up" data-aos-delay="900"><div class="timeline-marker"><div class="marker-icon">🏆</div><div class="marker-pulse"></div></div><div class="timeline-date"><span class="date-month">12月</span><span class="date-year">2024</span></div><div class="timeline-content"><div class="content-header"><h4 class="timeline-title">🏆 2024年コンテンツフリークス大賞</h4><span class="timeline-badge awards-badge">Awards</span></div><p class="timeline-description">2024年を締めくくる特別企画「2024年コンテンツフリークス大賞」を発表！</p><div class="awards-list"><div class="award-item grand"><span class="award-icon">🏆</span><span class="award-text">コンテンツフリークス大賞：「アンメット」</span></div><div class="award-item"><span class="award-icon">🎖</span><span class="award-text">ドラマ賞：「海のはじまり」</span></div><div class="award-item"><span class="award-icon">⭐</span><span class="award-text">ドラマキャスト大賞：「杉咲花」</span></div><div class="award-item"><span class="award-icon">🎖</span><span class="award-text">アニメ賞：「葬送のフリーレン」</span></div></div><div class="timeline-actions"><a href="#" class="timeline-link" target="_blank" rel="noopener"><span class="link-icon">▶</span>エピソードを聴く</a></div></div></div>
        </div>
      </div>

      <div class="year-section" data-year="2025">
        <div class="year-header"><div class="year-badge"><span class="year-number">2025</span><div class="year-accent"></div></div><div class="year-info"><h3 class="year-title">New Heights</h3><p class="year-subtitle">さらなる飛躍の年</p></div></div>
        <div class="timeline">
          <div class="timeline-item breakthrough" data-aos="fade-up"><div class="timeline-marker"><div class="marker-icon">🎉</div><div class="marker-pulse"></div></div><div class="timeline-date"><span class="date-month">1月</span><span class="date-year">2025</span></div><div class="timeline-content"><div class="content-header"><h4 class="timeline-title">🎉 総フォロワー数1000人突破！</h4><span class="timeline-badge breakthrough-badge">Breakthrough</span></div><p class="timeline-description">Spotifyのフォロワー数が200人を突破！<br>YouTubeの登録者数が700人を突破！<br><br>そして、Spotify、ApplePodcast、YouTubeの総フォロワー数が1000人を突破！番組開始時には想像もしていなかった数字です！</p><div class="timeline-impact"><span class="impact-label">Impact:</span><span class="impact-text">番組開始時には想像もしていなかった数字に到達</span></div></div></div>
          <div class="timeline-item featured celebration" data-aos="fade-up" data-aos-delay="100"><div class="timeline-marker featured-marker"><div class="marker-icon">🎨</div><div class="marker-pulse featured-pulse"></div></div><div class="timeline-date"><span class="date-month">2〜3月</span><span class="date-year">2025</span></div><div class="timeline-content featured-content"><div class="content-header"><h4 class="timeline-title">🎨 150回配信記念アートワークリニューアル</h4><span class="timeline-badge celebration-badge">Celebration</span></div><p class="timeline-description">ApplePodcastのフォロワー数が150人を突破！<br>150回配信を達成！<br><br>総フォロワー数が1000人＋150回配信記念としてアートワークをリニューアル！！<br>半年ほどアートワークを更新したいと思っていたので現状の理想を体現したものが完成！</p><div class="timeline-visual"><div class="artwork-showcase"><img src="https://content-freaks.jp/wp-content/uploads/2023/07/36275010-1739517733196-9955f073fd424-4.jpg" alt="最新アートワーク" class="artwork-image"><div class="artwork-caption"><span class="caption-label">🎨</span><span class="caption-text">最新アートワーク</span></div></div></div></div></div>
          <div class="timeline-item growth" data-aos="fade-up" data-aos-delay="200"><div class="timeline-marker"><div class="marker-icon">📈</div><div class="marker-pulse"></div></div><div class="timeline-date"><span class="date-month">4〜5月</span><span class="date-year">2025</span></div><div class="timeline-content"><div class="content-header"><h4 class="timeline-title">📈 さらなる成長継続</h4><span class="timeline-badge growth-badge">Growth</span></div><p class="timeline-description">4月：Spotifyのフォロワー数が300人を突破！<br>5月：YouTubeの登録者数が800人を突破！</p><div class="timeline-impact"><span class="impact-label">Impact:</span><span class="impact-text">継続的な成長により、番組の安定した人気を確立</span></div></div></div>
          <div class="timeline-item milestone" data-aos="fade-up" data-aos-delay="300"><div class="timeline-marker"><div class="marker-icon">🎯</div><div class="marker-pulse"></div></div><div class="timeline-date"><span class="date-month">6月</span><span class="date-year">2025</span></div><div class="timeline-content"><div class="content-header"><h4 class="timeline-title">🎯 Apple Podcast 200フォロワー突破</h4><span class="timeline-badge milestone-badge">Milestone</span></div><p class="timeline-description">Apple Podcastのフォロワー数が200人を突破！主要プラットフォームでの着実な成長を実現。</p><div class="timeline-impact"><span class="impact-label">Impact:</span><span class="impact-text">マルチプラットフォームでの認知度向上</span></div></div></div>
          <div class="timeline-item featured community" data-aos="fade-up" data-aos-delay="400"><div class="timeline-marker featured-marker"><div class="marker-icon">🎤</div><div class="marker-pulse featured-pulse"></div></div><div class="timeline-date"><span class="date-month">7月</span><span class="date-year">2025</span></div><div class="timeline-content featured-content"><div class="content-header"><h4 class="timeline-title">🎤 名古屋「ポッドキャストミキサー」に登壇！</h4><span class="timeline-badge community-badge">Community</span></div><p class="timeline-description">名古屋で開催された「ポッドキャストミキサー」に登壇！「ドタバタグッドボタン」のけーちゃんと一緒に、対談形式で名古屋にまつわるコンテンツクイズを実施。<br><br>会場は満席でワイワイ賑やかな雰囲気！クイズ中は真剣に考えたり、珍回答に大笑いしたり、メリハリがあって楽しい空間に。<br><br>さらに、イベントを機にポッドキャスト用のオリジナル名刺も制作！コンフリブランドカラーで統一し、新規のコンフリキャラクターもデザインに採用。</p><div class="timeline-impact"><span class="impact-label">Impact:</span><span class="impact-text">初の本格的なイベント登壇でリスナーとの交流を実現</span></div><div class="timeline-actions"><a href="https://content-freaks.jp/2025-2q-growth-podcast/" class="timeline-link featured-link" target="_blank" rel="noopener"><span class="link-icon">📝</span>詳細記事を読む</a></div></div></div>
          <div class="timeline-item innovation" data-aos="fade-up" data-aos-delay="500"><div class="timeline-marker"><div class="marker-icon">🎨</div><div class="marker-pulse"></div></div><div class="timeline-date"><span class="date-month">8月</span><span class="date-year">2025</span></div><div class="timeline-content"><div class="content-header"><h4 class="timeline-title">🎨 サムネイルデザイン刷新</h4><span class="timeline-badge innovation-badge">Innovation</span></div><p class="timeline-description">ポッドキャスト用とYouTube用の2種類のサムネイルフォーマットを新たに作成！<br><br>改善ポイント：<br>▶ コンフリカラーで統一感を実現<br>▶ 誰が見ても一目でコンフリだと分かるデザイン<br>▶ サムネイル作成がスムーズに<br>▶ ポッドキャストではコンフリマーク、YouTubeではPodcastマークを追加</p><div class="timeline-impact"><span class="impact-label">Impact:</span><span class="impact-text">YouTubeのクリック率が2〜4％から7〜10％に大幅アップ！</span></div></div></div>
          <div class="timeline-item breakthrough" data-aos="fade-up" data-aos-delay="600"><div class="timeline-marker"><div class="marker-icon">🎉</div><div class="marker-pulse"></div></div><div class="timeline-date"><span class="date-month">9月</span><span class="date-year">2025</span></div><div class="timeline-content"><div class="content-header"><h4 class="timeline-title">🎉 YouTube 900人突破＆コラボ配信</h4><span class="timeline-badge breakthrough-badge">Breakthrough</span></div><p class="timeline-description">YouTubeの登録者数が900人を突破！サムネイル改善の効果が着実に数字に表れる。<br><br>さらに、「推し活2次元LIFEラジオ」とコラボ配信を実施！番組間の交流がさらに活発に。</p><div class="timeline-impact"><span class="impact-label">Impact:</span><span class="impact-text">YouTube 1000人突破まであと少し！</span></div></div></div>
          <div class="timeline-item featured celebration" data-aos="fade-up" data-aos-delay="700"><div class="timeline-marker featured-marker"><div class="marker-icon">🏆</div><div class="marker-pulse featured-pulse"></div></div><div class="timeline-date"><span class="date-month">10月</span><span class="date-year">2025</span></div><div class="timeline-content featured-content"><div class="content-header"><h4 class="timeline-title">🏆 YouTube登録者1000人突破！！！</h4><span class="timeline-badge celebration-badge">Celebration</span></div><p class="timeline-description">ついに目標であったYouTube登録者数1000人を突破！！！<br><br>番組開始から約2年、サムネイル改善やコンテンツの充実により、ついに大台達成。これまで応援してくださったすべてのリスナーの皆様に心から感謝！</p><div class="timeline-impact"><span class="impact-label">Impact:</span><span class="impact-text">番組史上最大のマイルストーン達成！</span></div></div></div>
        </div>
      </div>
    </div>
  </section>

  <section class="artwork-evolution-section">
    <div class="evolution-container">
      <div class="section-header"><h2 class="section-title">Artwork Evolution</h2><p class="section-subtitle">番組の成長とともに進化してきたアートワーク</p></div>
      <div class="artwork-timeline">
        <div class="artwork-card" data-aos="fade-up"><div class="artwork-image-container"><img src="https://content-freaks.jp/wp-content/uploads/2024/05/1000017105.jpg" alt="カラビナFM初期アートワーク" class="evolution-artwork-image"><div class="artwork-overlay"><span class="artwork-year">2023.06</span></div></div><div class="artwork-info"><h3 class="artwork-title">カラビナFM</h3><p class="artwork-period">2023年6月〜10月</p><p class="artwork-description">番組スタート時のオリジナルアートワーク。雑談番組として始まった原点を表現。</p></div></div>
        <div class="artwork-card" data-aos="fade-up" data-aos-delay="100"><div class="artwork-image-container"><img src="https://content-freaks.jp/wp-content/uploads/2024/05/1000014856-1024x1024.png" alt="コンテンツフリークス初期アートワーク" class="evolution-artwork-image"><div class="artwork-overlay"><span class="artwork-year">2023.10</span></div></div><div class="artwork-info"><h3 class="artwork-title">コンテンツフリークス 1st</h3><p class="artwork-period">2023年10月〜2024年3月</p><p class="artwork-description">番組リニューアル記念。コンテンツを語る番組へと方向性が定まった時期。</p></div></div>
        <div class="artwork-card" data-aos="fade-up" data-aos-delay="200"><div class="artwork-image-container"><img src="https://content-freaks.jp/wp-content/uploads/2024/05/1000015915-1024x1024.png" alt="50回記念アートワーク" class="evolution-artwork-image"><div class="artwork-overlay"><span class="artwork-year">2024.03</span></div></div><div class="artwork-info"><h3 class="artwork-title">コンテンツフリークス 2nd</h3><p class="artwork-period">2024年3月〜2025年3月</p><p class="artwork-description">50回配信記念リニューアル。番組の成長と進化を象徴するデザイン。</p></div></div>
        <div class="artwork-card featured-artwork" data-aos="fade-up" data-aos-delay="300"><div class="artwork-image-container"><img src="https://content-freaks.jp/wp-content/uploads/2023/07/36275010-1739517733196-9955f073fd424-4.jpg" alt="最新アートワーク" class="evolution-artwork-image"><div class="artwork-overlay"><span class="artwork-year">2025.03</span><span class="artwork-badge">Latest</span></div></div><div class="artwork-info"><h3 class="artwork-title">コンテンツフリークス 3rd</h3><p class="artwork-period">2025年3月〜現在</p><p class="artwork-description">150回＆総フォロワー1000人突破記念。現在の理想を体現した最新デザイン。</p></div></div>
      </div>
    </div>
  </section>

  <section class="growth-graph-section">
    <div class="growth-container">
      <div class="section-header"><h2 class="section-title">Growth Timeline</h2><p class="section-subtitle">フォロワー数の成長推移</p></div>
      <div class="growth-chart">
        <div class="chart-y-axis"><span class="y-label">1500</span><span class="y-label">1200</span><span class="y-label">900</span><span class="y-label">600</span><span class="y-label">300</span><span class="y-label">0</span></div>
        <div class="chart-area">
          <div class="chart-grid"><div class="grid-line"></div><div class="grid-line"></div><div class="grid-line"></div><div class="grid-line"></div><div class="grid-line"></div></div>
          <div class="chart-line">
            <div class="data-point" style="left: 0%; bottom: 0%;" data-aos="zoom-in" data-aos-delay="0"><div class="point-marker start"></div><div class="point-label"><span class="point-value">0</span><span class="point-date">2023.06</span></div></div>
            <div class="data-point" style="left: 14%; bottom: 6.7%;" data-aos="zoom-in" data-aos-delay="100"><div class="point-marker"></div><div class="point-label"><span class="point-value">100</span><span class="point-date">2023.10</span></div></div>
            <div class="data-point" style="left: 28%; bottom: 12%;" data-aos="zoom-in" data-aos-delay="200"><div class="point-marker"></div><div class="point-label"><span class="point-value">200</span><span class="point-date">2024.03</span></div></div>
            <div class="data-point" style="left: 42%; bottom: 26.7%;" data-aos="zoom-in" data-aos-delay="300"><div class="point-marker"></div><div class="point-label"><span class="point-value">400</span><span class="point-date">2024.08</span></div></div>
            <div class="data-point" style="left: 56%; bottom: 40%;" data-aos="zoom-in" data-aos-delay="400"><div class="point-marker"></div><div class="point-label"><span class="point-value">600</span><span class="point-date">2024.11</span></div></div>
            <div class="data-point" style="left: 70%; bottom: 46.7%;" data-aos="zoom-in" data-aos-delay="500"><div class="point-marker"></div><div class="point-label"><span class="point-value">700</span><span class="point-date">2025.01</span></div></div>
            <div class="data-point" style="left: 84%; bottom: 60%;" data-aos="zoom-in" data-aos-delay="600"><div class="point-marker"></div><div class="point-label"><span class="point-value">900</span><span class="point-date">2025.07</span></div></div>
            <div class="data-point" style="left: 100%; bottom: 66.7%;" data-aos="zoom-in" data-aos-delay="700"><div class="point-marker end"></div><div class="point-label"><span class="point-value">1000</span><span class="point-date">2025.10</span></div></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="platform-growth-section">
    <div class="platform-growth-container">
      <div class="section-header"><h2 class="section-title">Platform Growth</h2><p class="section-subtitle">プラットフォーム別の成長推移</p></div>
      <div class="platform-growth-grid">
        <div class="platform-card" data-aos="fade-up"><div class="platform-header"><div class="platform-icon spotify">🎧</div><div class="platform-info"><h3>Spotify</h3><p>主要プラットフォーム</p></div><div class="platform-badge">Top</div></div><div class="platform-stats"><div class="platform-stat"><span class="stat-label">フォロワー</span><span class="stat-value">300+</span></div><div class="platform-stat"><span class="stat-label">急成長期間</span><span class="stat-value">2024.07-2025.04</span></div></div><div class="growth-bar"><div class="growth-fill" style="width: 70%"></div></div></div>
        <div class="platform-card" data-aos="fade-up" data-aos-delay="100"><div class="platform-header"><div class="platform-icon apple">🍎</div><div class="platform-info"><h3>Apple Podcasts</h3><p>リスナーとの相性◎</p></div></div><div class="platform-stats"><div class="platform-stat"><span class="stat-label">フォロワー</span><span class="stat-value">200+</span></div><div class="platform-stat"><span class="stat-label">急成長期間</span><span class="stat-value">2025.01-2025.06</span></div></div><div class="growth-bar"><div class="growth-fill apple" style="width: 50%"></div></div></div>
        <div class="platform-card" data-aos="fade-up" data-aos-delay="200"><div class="platform-header"><div class="platform-icon youtube">▶</div><div class="platform-info"><h3>YouTube</h3><p>動画とショートで急伸</p></div><div class="platform-badge accent">Boost</div></div><div class="platform-stats"><div class="platform-stat"><span class="stat-label">登録者</span><span class="stat-value">1000+</span></div><div class="platform-stat"><span class="stat-label">急成長期間</span><span class="stat-value">2024.08-2025.10</span></div></div><div class="growth-bar"><div class="growth-fill youtube" style="width: 100%"></div></div></div>
      </div>
      <div class="platform-bars">
        <div class="platform-bar" data-aos="fade-right"><div class="platform-info"><span class="platform-name"><span class="platform-icon-small spotify">🎧</span>Spotify</span><span class="platform-count">1,000+</span></div><div class="bar-container"><div class="bar-fill spotify-bar" style="width: 100%"></div></div></div>
        <div class="platform-bar" data-aos="fade-right" data-aos-delay="100"><div class="platform-info"><span class="platform-name"><span class="platform-icon-small youtube">▶</span>YouTube</span><span class="platform-count">1,000+</span></div><div class="bar-container"><div class="bar-fill youtube-bar" style="width: 100%"></div></div></div>
        <div class="platform-bar" data-aos="fade-right" data-aos-delay="200"><div class="platform-info"><span class="platform-name"><span class="platform-icon-small apple">🍎</span>Apple Podcasts</span><span class="platform-count">200+</span></div><div class="bar-container"><div class="bar-fill apple-bar" style="width: 40%"></div></div></div>
      </div>
    </div>
  </section>

  <section class="collab-events-section">
    <div class="collab-container">
      <div class="section-header"><h2 class="section-title">Collaborations & Events</h2><p class="section-subtitle">コラボレーションとイベントの軌跡</p></div>
      <div class="content-grid">
        <div class="content-box" data-aos="fade-up"><div class="box-header"><span class="box-icon">🎙️</span><h3 class="box-title">コラボレーション</h3></div><div class="collab-list"><div class="collab-item"><div class="collab-date">2024.04</div><div class="collab-content"><h4 class="collab-title">平成男女のイドバタラジオ</h4><p class="collab-desc">ゲスト: みな さん</p><a href="https://open.spotify.com/episode/661RG21Jp2Rs7PFggQ4nXE" class="collab-link" target="_blank" rel="noopener">エピソードを聴く →</a></div></div><div class="collab-item"><div class="collab-date">2024.05</div><div class="collab-content"><h4 class="collab-title">ひよっこ研究者のさばいばる日記</h4><p class="collab-desc">ゲスト: はち さん</p><a href="https://open.spotify.com/episode/5NX4d5OYHQ7bh0VlNT42wj" class="collab-link" target="_blank" rel="noopener">エピソードを聴く →</a></div></div><div class="collab-item"><div class="collab-date">2025.09</div><div class="collab-content"><h4 class="collab-title">推し活2次元LIFEラジオ</h4><p class="collab-desc">コラボ配信</p></div></div></div></div>
        <div class="content-box" data-aos="fade-up" data-aos-delay="100"><div class="box-header"><span class="box-icon">🎉</span><h3 class="box-title">イベント参加</h3></div><div class="event-list"><div class="event-item"><div class="event-badge">2023</div><div class="event-content"><h4 class="event-title">科学系ポッドキャストの日</h4><p class="event-desc">初参加・映画『私は確信する』回を配信</p></div></div><div class="event-item"><div class="event-badge">2024</div><div class="event-content"><h4 class="event-title">ポッドキャストシンポジウム</h4><p class="event-desc">ポッドキャストコミュニティに参加</p></div></div><div class="event-item"><div class="event-badge">2024</div><div class="event-content"><h4 class="event-title">ポッドキャストウィークエンド</h4><p class="event-desc">リアルイベントで交流</p></div></div><div class="event-item featured"><div class="event-badge featured-badge">2025</div><div class="event-content"><h4 class="event-title">ポッドキャストミキサー 名古屋</h4><p class="event-desc">登壇！コンテンツクイズ企画を実施</p><a href="https://content-freaks.jp/2025-2q-growth-podcast/" class="event-link" target="_blank" rel="noopener">詳細記事を読む →</a></div></div></div></div>
      </div>
    </div>
  </section>

  <section class="awards-section">
    <div class="awards-container">
      <div class="section-header"><h2 class="section-title">Annual Awards</h2><p class="section-subtitle">歴代コンテンツフリークス大賞</p></div>
      <div class="awards-grid">
        <div class="award-year-card" data-aos="fade-up"><div class="award-year-header"><span class="award-year-badge">2023</span><h3 class="award-year-title">第1回 コンテンツフリークス大賞</h3></div><div class="award-items"><div class="award-item grand-prize"><div class="award-icon">🏆</div><div class="award-info"><span class="award-category">コンテンツフリークス大賞</span><span class="award-winner">PLUTO</span></div></div><div class="award-item"><div class="award-icon">🎖️</div><div class="award-info"><span class="award-category">みっくん賞</span><span class="award-winner">私は確信する</span></div></div><div class="award-item"><div class="award-icon">🎖️</div><div class="award-info"><span class="award-category">あっきー賞</span><span class="award-winner">ゴジラ-1.0</span></div></div></div><a href="https://open.spotify.com/episode/3G1nDsYBljNCbUnA496aBp" class="award-episode-link" target="_blank" rel="noopener">エピソードを聴く →</a></div>
        <div class="award-year-card" data-aos="fade-up" data-aos-delay="100"><div class="award-year-header"><span class="award-year-badge">2024</span><h3 class="award-year-title">第2回 コンテンツフリークス大賞</h3></div><div class="award-items"><div class="award-item grand-prize"><div class="award-icon">🏆</div><div class="award-info"><span class="award-category">コンテンツフリークス大賞</span><span class="award-winner">アンメット</span></div></div><div class="award-item"><div class="award-icon">📺</div><div class="award-info"><span class="award-category">ドラマ賞</span><span class="award-winner">海のはじまり</span></div></div><div class="award-item"><div class="award-icon">⭐</div><div class="award-info"><span class="award-category">ドラマキャスト大賞</span><span class="award-winner">杉咲花</span></div></div><div class="award-item"><div class="award-icon">🎬</div><div class="award-info"><span class="award-category">アニメ賞</span><span class="award-winner">葬送のフリーレン</span></div></div></div></div>
      </div>
    </div>
  </section>

  <section class="testimonials-section">
    <div class="testimonials-container">
      <div class="section-header"><h2 class="section-title">Listener's Voice</h2><p class="section-subtitle">リスナーからの温かいメッセージ</p></div>
      <div class="testimonials-grid">
        <div class="testimonial-card" data-aos="fade-up"><div class="quote-icon">💬</div><p class="testimonial-text">「コンテンツへの深い愛情と考察が素晴らしい！いつも楽しみにしています。」</p><div class="testimonial-author">- リスナーAさん</div></div>
        <div class="testimonial-card" data-aos="fade-up" data-aos-delay="100"><div class="quote-icon">💬</div><p class="testimonial-text">「2人の掛け合いが最高！コンテンツを見る視点が変わりました。」</p><div class="testimonial-author">- リスナーBさん</div></div>
        <div class="testimonial-card" data-aos="fade-up" data-aos-delay="200"><div class="quote-icon">💬</div><p class="testimonial-text">「ドラマ感想回が特に好き。見終わった後すぐに聴きたくなります！」</p><div class="testimonial-author">- リスナーCさん</div></div>
      </div>
    </div>
  </section>

  <section class="content-analysis-section">
    <div class="analysis-container">
      <div class="section-header"><h2 class="section-title">Content Analysis</h2><p class="section-subtitle">ジャンル別エピソード分析</p></div>
      <div class="analysis-grid">
        <div class="genre-bar-chart" data-aos="fade-up">
          <div class="genre-item"><div class="genre-label">📺 ドラマ</div><div class="genre-bar-container"><div class="genre-bar drama-bar" style="width: 85%"><span class="genre-count">45+</span></div></div></div>
          <div class="genre-item"><div class="genre-label">🎬 アニメ</div><div class="genre-bar-container"><div class="genre-bar anime-bar" style="width: 70%"><span class="genre-count">35+</span></div></div></div>
          <div class="genre-item"><div class="genre-label">🎥 映画</div><div class="genre-bar-container"><div class="genre-bar movie-bar" style="width: 55%"><span class="genre-count">25+</span></div></div></div>
          <div class="genre-item"><div class="genre-label">💬 雑談・分析</div><div class="genre-bar-container"><div class="genre-bar talk-bar" style="width: 40%"><span class="genre-count">20+</span></div></div></div>
          <div class="genre-item"><div class="genre-label">📚 その他</div><div class="genre-bar-container"><div class="genre-bar other-bar" style="width: 25%"><span class="genre-count">10+</span></div></div></div>
        </div>
      </div>
    </div>
  </section>

  <section class="media-section">
    <div class="media-container">
      <div class="section-header"><h2 class="section-title">Media Coverage</h2><p class="section-subtitle">メディア掲載・外部露出</p></div>
      <div class="media-grid">
        <div class="media-card" data-aos="fade-up"><div class="media-icon">📰</div><div class="media-content"><h4 class="media-title">ポッドキャストランキング</h4><p class="media-date">2024年8月</p><p class="media-desc">「WEEKLY PICKUP!!」に選出</p></div></div>
        <div class="media-card" data-aos="fade-up" data-aos-delay="100"><div class="media-icon">🌐</div><div class="media-content"><h4 class="media-title">公式ウェブサイト開設</h4><p class="media-date">2024年6月</p><p class="media-desc">デジタルプレゼンスを強化</p></div></div>
        <div class="media-card" data-aos="fade-up" data-aos-delay="200"><div class="media-icon">📝</div><div class="media-content"><h4 class="media-title">ブログ記事公開</h4><p class="media-date">2024年7月〜</p><p class="media-desc">ポッドキャスト運営の知見を共有</p></div></div>
      </div>
    </div>
  </section>

  <section class="future-section">
    <div class="future-bg"><div class="future-pattern"></div></div>
    <div class="future-container">
      <div class="future-content">
        <div class="future-icon">🚀</div>
        <h2 class="future-title">The Journey Continues</h2>
        <p class="future-subtitle">これからの「コンテンツフリークス」</p>
        <p class="future-description">「カラビナFM」として始まった小さな雑談番組が、今では多くのリスナーの皆様に愛される「コンテンツフリークス」となりました。<br><br>これからも、コンテンツへの愛と熱い想いを胸に、みっくん＆あっきーは語り続けます。<br>新たなコンテンツとの出会い、新たなリスナーとの繋がりを大切に、番組を続けていきます。<br><br><strong>コンテンツフリークスの旅は、まだまだ始まったばかりです！</strong></p>
        <div class="future-cta"><a href="/episodes/" class="future-cta-button primary"><span class="btn-icon">🎧</span>最新エピソードを聴く</a><a href="/" class="future-cta-button secondary"><span class="btn-icon">🏠</span>ホームへ戻る</a></div>
      </div>
    </div>
  </section>
</main>
${renderFooter()}`;

  writePage('history/index.html', html);
}

function buildStaticSite() {
  rimraf(DIST);
  ensureDir(DIST);
  copyAssets();

  const episodesRaw = readJson('episodes.json', { items: [] });
  const site = readJson('site.json', { listenerCount: 1500, platforms: [], hosts: [] });
  const blogsRaw = readJson('blog.json', { items: [] });

  const episodes = (episodesRaw.items || []).map(normalizeEpisode).sort((a, b) => {
    const da = new Date(a.publishedAt || 0).getTime();
    const db = new Date(b.publishedAt || 0).getTime();
    return db - da;
  });
  const posts = (blogsRaw.items || []).map(normalizeBlog).sort((a, b) => {
    const da = new Date(a.publishedAt || 0).getTime();
    const db = new Date(b.publishedAt || 0).getTime();
    return db - da;
  });

  buildHome({ episodes, site });
  buildEpisodeList({ episodes });
  buildEpisodeDetails({ episodes });
  buildBlog({ posts });
  buildBlogDetails({ posts });
  buildProfile({ site, episodes });
  buildHistory({ site, episodes });

  console.log(`✅ Build completed. Episodes: ${episodes.length}, Blogs: ${posts.length}`);
}

buildStaticSite();
