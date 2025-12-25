#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');

const FEED_URL = process.env.CONTENTFREAKS_FEED_URL || 'https://anchor.fm/s/d8cfdc48/podcast/rss';
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'episodes.json');

const parser = new Parser({
  customFields: {
    item: [
      ['itunes:image', 'itunesImage'],
      ['itunes:duration', 'itunesDuration'],
      ['content:encoded', 'contentEncoded']
    ]
  }
});

function normalizeAudioUrl(url) {
  if (!url) return '';
  if (url.includes('anchor.fm/s/d8cfdc48/podcast/play/')) {
    return url
      .replace('https://anchor.fm/s/d8cfdc48/podcast/play/', 'https://d3ctxlq1ktw2nl.cloudfront.net/')
      .replace('/play/', '/');
  }
  if (url.includes('https%3A%2F%2F')) {
    try {
      const decoded = decodeURIComponent(url);
      if (decoded.startsWith('https://d3ctxlq1ktw2nl.cloudfront.net/')) {
        return decoded;
      }
    } catch (err) {
      // ignore decode errors
    }
  }
  return url;
}

function extractEpisodeNumber(title) {
  if (!title) return '';
  const match = title.match(/[#＃](\d+)/);
  return match ? match[1] : '';
}

function deriveCategory(title) {
  if (!title) return 'エピソード';
  const lower = title.toLowerCase();
  if (lower.includes('special') || title.includes('スペシャル')) return 'スペシャル';
  return 'エピソード';
}

function extractTags(title) {
  if (!title) return [];
  const tags = [];
  const regex = /『([^』]+)』/g;
  let match;
  while ((match = regex.exec(title)) !== null) {
    tags.push(match[1]);
  }
  return tags;
}

function stripTags(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function pickThumbnail(item) {
  if (item.itunesImage && item.itunesImage.href) return item.itunesImage.href;
  if (item.itunes && item.itunes.image) return item.itunes.image;
  if (item.enclosure && item.enclosure.thumbnail) return item.enclosure.thumbnail;
  const content = item.contentEncoded || item.content || '';
  const match = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match) return match[1];
  if (item.link) {
    const anchorMatch = item.link.match(/anchor\.fm\/s\/([^/]+)/);
    if (anchorMatch) {
      return `https://d3t3ozftmdmh3i.cloudfront.net/production/podcast_uploaded_nologo/${anchorMatch[1]}/artwork.png`;
    }
  }
  return '';
}

function parseDuration(raw) {
  if (!raw) return '';
  if (typeof raw === 'number') {
    const minutes = Math.floor(raw / 60);
    const seconds = raw % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }
  if (/^\d+$/.test(raw)) {
    const seconds = parseInt(raw, 10);
    const minutes = Math.floor(seconds / 60);
    const remain = seconds % 60;
    return `${minutes}:${String(remain).padStart(2, '0')}`;
  }
  const parts = raw.split(':').map((p) => p.trim());
  if (parts.length === 3) {
    const [h, m, s] = parts.map((p) => parseInt(p || '0', 10));
    const total = h * 3600 + m * 60 + s;
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }
  if (parts.length === 2) {
    const [m, s] = parts.map((p) => parseInt(p || '0', 10));
    return `${m}:${String(s).padStart(2, '0')}`;
  }
  return String(raw);
}

function toSlug(title, fallback) {
  if (!title) return fallback ? String(fallback) : '';
  const base = title
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (base) return base;
  if (fallback) return String(fallback).replace(/[^a-z0-9]+/gi, '-');
  return '';
}

function mapItem(item) {
  const title = item.title || '';
  if (!title) return null;
  const fullDescription =
    item.contentEncoded ||
    item.content ||
    item.summary ||
    item['content:encoded'] ||
    '';
  const description = item.contentSnippet || stripTags(fullDescription);
  const audioUrl = normalizeAudioUrl(item.enclosure && item.enclosure.url ? item.enclosure.url : '');
  return {
    id: item.guid || item.id || null,
    slug: toSlug(title, item.guid || item.link || ''),
    title,
    publishedAt: item.isoDate || item.pubDate || null,
    link: item.link || '',
    description: description,
    fullDescription: fullDescription,
    audioUrl,
    originalAudioUrl: item.enclosure && item.enclosure.url ? item.enclosure.url : '',
    episodeNumber: extractEpisodeNumber(title),
    duration: parseDuration(item.itunesDuration || (item.itunes && item.itunes.duration) || (item.enclosure && item.enclosure.duration)),
    category: deriveCategory(title),
    tags: extractTags(title),
    thumbnail: pickThumbnail(item)
  };
}

async function main() {
  const feed = await parser.parseURL(FEED_URL);
  const items = (feed.items || []).map(mapItem).filter(Boolean);
  const payload = {
    source: FEED_URL,
    generatedAt: new Date().toISOString(),
    count: items.length,
    items
  };
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2));
  console.log(`Wrote ${items.length} episodes to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('RSS fetch failed:', err.message || err);
  process.exit(1);
});
