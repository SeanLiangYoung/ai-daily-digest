#!/usr/bin/env bun
/**
 * AI Daily Digest - News Collection Script
 * 
 * 功能：
 * 1. 使用 web_fetch 工具获取科技/AI、Crypto/Web3、商业/创业新闻
 * 2. 生成结构化数据
 * 
 * 作者：Kai
 * 日期：2026-04-15
 * 更新：使用 web_fetch 替代不存在的 web_search
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

interface NewsItem {
  title: string;
  url: string;
  snippet: string;
  date: string;
  source: string;
  category: string;
}

interface DailyNewsDigest {
  date: string;
  generatedAt: string;
  categories: {
    aiTech: NewsItem[];
    cryptoWeb3: NewsItem[];
    businessStartup: NewsItem[];
  };
  summary: {
    totalArticles: number;
    topStories: string[];
  };
}

// 使用 OpenClaw web_fetch 获取搜索结果页面
async function fetchSearchResults(query: string): Promise<string> {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://www.google.com/search?q=${encodedQuery}&tbm=nws&hl=zh-CN`;
  
  try {
    const { stdout } = await execAsync(
      `openclaw tools exec --command 'web_fetch({\"url\":\"${url}\",\"maxChars\":15000})' 2>&1`,
      { maxBuffer: 20 * 1024 * 1024 }
    );
    return stdout;
  } catch (error: any) {
    console.error(`❌ Error fetching search results for "${query}":`, error.message);
    return '';
  }
}

// 解析 Google 新闻搜索结果
function parseGoogleNews(html: string, category: string): NewsItem[] {
  const items: NewsItem[] = [];
  
  // 简单的正则匹配标题和链接
  const titleRegex = /<div class="BNeawe vv4jUC U7i59c AP7Wnb.*?>(.*?)<\/div>/g;
  const linkRegex = /<a href="(\/url\?q=([^"]+)|https:\/\/([^"]+))"/g;
  
  // 更简单的方法：匹配 Google 新闻的结构化数据
  const matches = html.matchAll(/"title":"([^"]+)".*"url":"([^"]+)"/g);
  
  for (const match of matches) {
    const title = match[1];
    let url = match[2];
    
    // 清理 URL
    url = url.replace(/\\/g, '');
    if (url.startsWith('/url?q=')) {
      url = url.substring(7).split('&')[0];
    }
    
    if (title && url && url.startsWith('http')) {
      items.push({
        title: title.substring(0, 200),
        url: url,
        snippet: '',
        date: new Date().toISOString().split('T')[0],
        source: new URL(url).hostname.replace('www.', ''),
        category,
      });
    }
  }
  
  return items.slice(0, 10);
}

// 主函数
async function main() {
  console.log('🌊 AI Daily Digest - News Collection');
  console.log('=====================================\n');

  const date = new Date().toISOString().split('T')[0];
  console.log(`📅 Date: ${date}\n`);

  // 尝试使用简单的 HTTP 请求获取新闻
  const news: DailyNewsDigest = {
    date,
    generatedAt: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
    categories: {
      aiTech: [],
      cryptoWeb3: [],
      businessStartup: [],
    },
    summary: {
      totalArticles: 0,
      topStories: [],
    },
  };

  // 如果数据目录已有数据，检查是否需要更新
  const dataPath = path.join(ROOT_DIR, 'data', 'news', `${date}.json`);
  const dataDir = path.dirname(dataPath);
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 使用 English 查询（中文 RSS 经常返回空结果）
  const categories = [
    { name: 'aiTech', query: 'AI technology breaking news' },
    { name: 'cryptoWeb3', query: 'Cryptocurrency Bitcoin blockchain news' },
    { name: 'businessStartup', query: 'business startup investment news' },
  ];

  for (const cat of categories) {
    console.log(`🔍 Searching ${cat.name}...`);
    
    try {
      // 使用 Google 新闻 RSS (英文)
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(cat.query)}&hl=en&gl=US&ceid=US:en`;
      const { stdout, stderr } = await execAsync(`curl -sL "${rssUrl}"`, { maxBuffer: 10 * 1024 * 1024 });
      
      // 解析 RSS
      const itemRegex = /<item>(.*?)<\/item>/g;
      const items: NewsItem[] = [];
      
      let match;
      while ((match = itemRegex.exec(stdout)) !== null && items.length < 10) {
        const itemXml = match[1];
        const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
        const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
        const sourceMatch = itemXml.match(/<source><!\[CDATA\[(.*?)\]\]><\/source>|<source>(.*?)<\/source>/);
        
        const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '') : '';
        const link = linkMatch ? linkMatch[1] : '';
        const source = sourceMatch ? (sourceMatch[1] || sourceMatch[2] || '') : 'Unknown';
        
        if (title && link) {
          items.push({
            title: title.substring(0, 200),
            url: link,
            snippet: '',
            date: date,
            source: source,
            category: cat.name,
          });
        }
      }
      
      (news.categories as any)[cat.name] = items;
      console.log(`   ✅ Found ${items.length} articles`);
      
    } catch (error: any) {
      console.log(`   ⚠️  Error: ${error.message}`);
      console.log(`   💡 使用之前的数据或尝试备选方案...`);
    }
  }

  news.summary.totalArticles = 
    news.categories.aiTech.length + 
    news.categories.cryptoWeb3.length + 
    news.categories.businessStartup.length;

  // 取前 3 条作为热门
  news.summary.topStories = news.categories.aiTech.slice(0, 3).map(i => i.title);

  // 保存数据
  fs.writeFileSync(dataPath, JSON.stringify(news, null, 2), 'utf-8');
  
  console.log(`\n✅ Data saved: ${dataPath}`);
  console.log(`📊 Total articles: ${news.summary.totalArticles}`);

  return news;
}

// 运行
main().catch(console.error);
