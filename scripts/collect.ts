#!/usr/bin/env bun
/**
 * AI Daily Digest - Data Collection Script
 * 
 * 功能：
 * 1. 读取 creators.json
 * 2. 获取每个创作者今天的推文
 * 3. 过滤和分类内容
 * 4. 生成结构化数据
 * 
 * 作者：Kai
 * 日期：2026-03-08
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

interface Creator {
  username: string;
  name: string;
  bio: string;
  category: string;
  priority: string;
  active: boolean;
}

interface CreatorsConfig {
  version: string;
  lastUpdated: string;
  source: string;
  creators: Creator[];
  keywords: string[];
  excludeKeywords: string[];
  settings: {
    updateTime: string;
    timezone: string;
    maxTweetsPerCreator: number;
    minEngagement: number;
  };
}

interface Tweet {
  id: string;
  author: string;
  username: string;
  content: string;
  createdAt: string;
  likes: number;
  retweets: number;
  replies: number;
  url: string;
}

interface DailyDigest {
  date: string;
  totalTweets: number;
  activeCreators: number;
  tweets: Tweet[];
  categories: {
    techBreakthrough: Tweet[];
    productLaunch: Tweet[];
    industryInsights: Tweet[];
    tutorialsResources: Tweet[];
    interestingFinds: Tweet[];
  };
  statistics: {
    totalEngagement: number;
    topTweet: Tweet | null;
  };
}

// 读取创作者列表
function loadCreators(): CreatorsConfig {
  const configPath = path.join(ROOT_DIR, 'creators.json');
  const content = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(content);
}

// 获取今天的日期 (YYYY-MM-DD)
function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 获取创作者的推文 (TODO: 实现实际的 API 调用)
async function fetchTweetsForCreator(username: string, date: string): Promise<Tweet[]> {
  console.log(`[Collecting] Fetching tweets for @${username}...`);
  
  // TODO: 集成 X API 或 xurl skill
  // 目前返回模拟数据
  return [];
}

// 分类推文
function categorizeTweets(tweets: Tweet[], keywords: string[]): DailyDigest['categories'] {
  const categories = {
    techBreakthrough: [] as Tweet[],
    productLaunch: [] as Tweet[],
    industryInsights: [] as Tweet[],
    tutorialsResources: [] as Tweet[],
    interestingFinds: [] as Tweet[],
  };

  for (const tweet of tweets) {
    const content = tweet.content.toLowerCase();
    
    // 简单的关键词匹配分类
    if (content.includes('release') || content.includes('launch') || content.includes('发布')) {
      categories.productLaunch.push(tweet);
    } else if (content.includes('breakthrough') || content.includes('research') || content.includes('突破')) {
      categories.techBreakthrough.push(tweet);
    } else if (content.includes('tutorial') || content.includes('how to') || content.includes('教程')) {
      categories.tutorialsResources.push(tweet);
    } else if (content.includes('think') || content.includes('opinion') || content.includes('认为')) {
      categories.industryInsights.push(tweet);
    } else {
      categories.interestingFinds.push(tweet);
    }
  }

  return categories;
}

// 计算统计信息
function calculateStatistics(tweets: Tweet[]): DailyDigest['statistics'] {
  let totalEngagement = 0;
  let topTweet: Tweet | null = null;
  let maxEngagement = 0;

  for (const tweet of tweets) {
    const engagement = tweet.likes + tweet.retweets + tweet.replies;
    totalEngagement += engagement;

    if (engagement > maxEngagement) {
      maxEngagement = engagement;
      topTweet = tweet;
    }
  }

  return {
    totalEngagement,
    topTweet,
  };
}

// 主函数
async function main() {
  console.log('🤖 AI Daily Digest - Data Collection');
  console.log('=====================================\n');

  const config = loadCreators();
  const today = getTodayDate();
  
  console.log(`📅 Date: ${today}`);
  console.log(`👥 Active creators: ${config.creators.filter(c => c.active).length}\n`);

  const allTweets: Tweet[] = [];
  let activeCreators = 0;

  // 收集所有创作者的推文
  for (const creator of config.creators) {
    if (!creator.active) continue;

    try {
      const tweets = await fetchTweetsForCreator(creator.username, today);
      
      if (tweets.length > 0) {
        activeCreators++;
        allTweets.push(...tweets);
        console.log(`✅ @${creator.username}: ${tweets.length} tweets`);
      } else {
        console.log(`⚪ @${creator.username}: No tweets today`);
      }
    } catch (error) {
      console.error(`❌ @${creator.username}: Error - ${error}`);
    }
  }

  console.log(`\n📊 Total collected: ${allTweets.length} tweets from ${activeCreators} creators\n`);

  // 分类和统计
  const categories = categorizeTweets(allTweets, config.keywords);
  const statistics = calculateStatistics(allTweets);

  const digest: DailyDigest = {
    date: today,
    totalTweets: allTweets.length,
    activeCreators,
    tweets: allTweets,
    categories,
    statistics,
  };

  // 保存数据
  const outputDir = path.join(ROOT_DIR, 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `${today}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(digest, null, 2));

  console.log(`💾 Data saved: ${outputPath}`);
  console.log(`\n✨ Collection complete!`);

  return digest;
}

// 运行
if (import.meta.main) {
  main().catch(console.error);
}

export { main, type DailyDigest };
