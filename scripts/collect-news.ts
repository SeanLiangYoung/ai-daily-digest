#!/usr/bin/env bun
/**
 * AI Daily Digest - News Collection Script
 * 
 * 功能：
 * 1. 使用 web_search 搜索科技/AI、Crypto/Web3、商业/创业新闻
 * 2. 生成结构化数据
 * 
 * 作者：Kai
 * 日期：2026-04-10
 */

import { web_search } from 'web_search';
import fs from 'node:fs';
import path from 'node:path';

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

// 搜索新闻
async function searchNews(query: string, category: string): Promise<NewsItem[]> {
  try {
    const result = await web_search({
      query: query,
      count: 10,
      freshness: 'day',
      country: 'CN',
      search_lang: 'zh',
    });
    
    const items: NewsItem[] = [];
    
    for (const item of (result.results || []).slice(0, 10)) {
      items.push({
        title: item.title || '',
        url: item.url || '',
        snippet: item.snippet || '',
        date: new Date().toISOString().split('T')[0],
        source: item.url ? new URL(item.url).hostname.replace('www.', '') : 'unknown',
        category,
      });
    }
    
    return items;
  } catch (error) {
    console.error(`❌ Error searching ${query}:`, error);
    return [];
  }
}

// 主函数
async function main() {
  console.log('🌊 AI Daily Digest - News Collection');
  console.log('=====================================\n');

  const date = new Date().toISOString().split('T')[0];
  console.log(`📅 Date: ${date}\n`);

  // 并行搜索三个类别
  console.log('🔍 Searching AI & Tech news...');
  const aiTech = await searchNews('AI 科技 最新新闻', 'aiTech');
  console.log(`   Found ${aiTech.length} articles`);
  
  console.log('🔍 Searching Crypto & Web3 news...');
  const cryptoWeb3 = await searchNews('Crypto Web3 区块链 最新新闻', 'cryptoWeb3');
  console.log(`   Found ${cryptoWeb3.length} articles`);
  
  console.log('🔍 Searching Business & Startup news...');
  const businessStartup = await searchNews('商业 创业 投资 最新新闻', 'businessStartup');
  console.log(`   Found ${businessStartup.length} articles`);

  const digest: DailyNewsDigest = {
    date,
    generatedAt: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
    categories: {
      aiTech,
      cryptoWeb3,
      businessStartup,
    },
    summary: {
      totalArticles: aiTech.length + cryptoWeb3.length + businessStartup.length,
      topStories: aiTech.slice(0, 3).map(i => i.title),
    },
  };

  // 保存数据
  const dataDir = './data/news';
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const dataPath = `${dataDir}/${date}.json`;
  fs.writeFileSync(dataPath, JSON.stringify(digest, null, 2), 'utf-8');
  
  console.log(`\n✅ Data saved: ${dataPath}`);
  console.log(`📊 Total articles: ${digest.summary.totalArticles}`);

  return digest;
}

// 运行
main().catch(console.error);
