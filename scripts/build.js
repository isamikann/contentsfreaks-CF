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
  'single.css',
  'style.css',
  'loading.css',
  'microinteractions.css',
  'page-works.css',
  'page-history.css',
  'page-profile.css',
  'page-episodes.css',
  'page-blog.css',
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
    <nav class="header-nav">
      <a href="/" class="nav-link">ホーム</a>
      <a href="/episodes/" class="nav-link">エピソード</a>
      <a href="/blog/" class="nav-link">ブログ</a>
      <a href="/profile/" class="nav-link">プロフィール</a>
      <a href="/history/" class="nav-link">コンフリの歩み</a>
    </nav>
    <div class="header-actions">
      <a class="pill-button" href="/episodes/">最新を聴く</a>
    </div>
  </div>
</header>
<main id="main-content" class="site-main">
`;
}

function renderFooter() {
  const year = new Date().getFullYear();
  return `</main>
<footer id="contentfreaks-footer">
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
    .map((host) => {
      const socials = host.social || {};
      const links = Object.entries(socials)
        .filter(([, url]) => url)
        .map(([platform, url]) => `<a href="${url}" class="social-link" target="_blank" rel="noopener">${platform === 'youtube' ? '📺' : '🔗'}</a>`) 
        .join('');
      return `<div class="host-card">
  <div class="host-image">${host.image ? `<img src="${host.image}" alt="${host.name}">` : '🎙️'}</div>
  <div class="host-content">
    <h3 class="host-name">${host.name}</h3>
    <div class="host-role">${host.role || ''}</div>
    <div class="host-bio">${host.bio || ''}</div>
    <div class="host-social">${links}</div>
  </div>
</div>`;
    })
    .join('\n');
  return `<div class="hosts-grid">${cards}</div>`;
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
<section class="episodes-hero"><div class="episodes-hero-bg"><div class="hero-pattern"></div></div><div class="episodes-hero-content"><div class="episodes-hero-icon">🎙️</div><h1>Podcast Episodes</h1><p class="episodes-hero-description">コンテンツフリークスの全エピソードを一覧でお楽しみください。</p><div class="episodes-hero-stats"><div class="episodes-stat"><span class="episodes-stat-number">${episodes.length}</span><span class="episodes-stat-label">エピソード</span></div><div class="episodes-stat"><span class="episodes-stat-number">🔥</span><span class="episodes-stat-label">熱い語り</span></div><div class="episodes-stat"><span class="episodes-stat-number">🔍</span><span class="episodes-stat-label">深掘り分析</span></div></div></div></section>
<section class="episodes-content-section"><div class="episodes-container"><div class="search-controls"><div class="search-box"><input type="text" id="episode-search" class="search-input" placeholder="エピソードを検索..." /></div></div><div class="episodes-grid" id="episodes-grid">${cards}</div>${pagination}</div></section>
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
<div class="single-episode-container site-main">
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
${renderFooter()}`;

    writePage(`episodes/${ep.slug}/index.html`, html);
  });
}

function buildBlog({ posts }) {
  const pages = chunk(posts, BLOG_PAGE_SIZE);
  const makeHtml = (pageItems, pageNumber) => {
    const cards = pageItems.length ? pageItems.map(renderBlogCard).join('\n') : '<div class="no-blog-posts"><p>ブログ記事が見つかりませんでした。</p><p>新しい記事を追加してください。</p></div>';
    const pagination = pages.length > 1
      ? `<div class="pagination">${pages
          .map((_, i) => {
            const n = i + 1;
            const href = n === 1 ? '/blog/' : `/blog/page/${n}/`;
            const cls = n === pageNumber ? 'page-number active' : 'page-number';
            return `<a class="${cls}" href="${href}">${n}</a>`;
          })
          .join('')}</div>`
      : '';
    return `${renderHead('ブログ')}
<section class="content-area blog-area">
  <section class="blog-hero">
    <div class="blog-hero-bg"><div class="hero-pattern"></div></div>
    <div class="blog-hero-content"><div class="blog-hero-icon">📖</div><h1>Blog Articles</h1><p class="blog-hero-description">ポッドキャスト分析、レビュー、コラムなど、じっくり読める記事をお届けします。</p></div>
  </section>
  <div class="main-content">
    <div class="blog-grid" id="blog-grid">${cards}</div>
    ${pagination}
  </div>
</section>
${renderFooter()}`;
  };

  pages.forEach((pageItems, idx) => {
    const pageNumber = idx + 1;
    const rel = pageNumber === 1 ? 'blog/index.html' : `blog/page/${pageNumber}/index.html`;
    writePage(rel, makeHtml(pageItems, pageNumber));
  });
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

  console.log(`✅ Build completed. Episodes: ${episodes.length}, Blogs: ${posts.length}`);
}

buildStaticSite();
