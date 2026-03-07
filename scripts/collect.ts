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

// 延迟函数（避免请求过快）
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 随机延迟（3-8秒之间，模拟人类行为）
async function randomDelay(): Promise<void> {
  const delay = 3000 + Math.random() * 5000; // 3-8秒
  console.log(`  ⏳ Waiting ${(delay / 1000).toFixed(1)}s...`);
  await sleep(delay);
}

// 获取创作者的推文
async function fetchTweetsForCreator(username: string, date: string): Promise<Tweet[]> {
  console.log(`[Collecting] Fetching tweets for @${username}...`);
  
  try {
    // 使用 baoyu-danger-x-to-markdown skill 获取用户时间线
    const skillPath = '/Users/seanliang/projects/sean-s-skills/skills/baoyu-danger-x-to-markdown';
    const tmpFile = `/tmp/x-${username}-${Date.now()}.md`;
    
    // 执行抓取（获取用户最近的推文）
    const { spawnSync } = await import('node:child_process');
    const result = spawnSync(
      process.env.HOME + '/.bun/bin/bun',
      [
        `${skillPath}/scripts/main.ts`,
        `https://x.com/${username}`,
        '--output',
        tmpFile
      ],
      {
        encoding: 'utf-8',
        timeout: 60000, // 60秒超时
        env: {
          ...process.env,
          HOME: process.env.HOME,
        }
      }
    );

    if (result.error) {
      throw new Error(`Failed to execute: ${result.error.message}`);
    }

    if (result.status !== 0) {
      console.error(`  ❌ Error output:`, result.stderr);
      return [];
    }

    // 读取并解析结果
    if (!fs.existsSync(tmpFile)) {
      console.log(`  ⚠️  No output file generated`);
      return [];
    }

    const content = fs.readFileSync(tmpFile, 'utf-8');
    
    // 清理临时文件
    fs.unlinkSync(tmpFile);

    // 解析 Markdown 提取推文数据
    const tweets = parseMarkdownToTweets(content, username, date);
    
    return tweets;

  } catch (error: any) {
    console.error(`  ❌ Error fetching @${username}:`, error.message);
    return [];
  }
}

// 解析 Markdown 内容提取推文
function parseMarkdownToTweets(markdown: string, username: string, targetDate: string): Tweet[] {
  const tweets: Tweet[] = [];
  
  // 简单的 Markdown 解析（寻找推文块）
  // 格式通常是：## Tweet 或包含时间戳的段落
  const lines = markdown.split('\n');
  
  let currentTweet: Partial<Tweet> = {};
  let inTweetBlock = false;
  let contentBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 检测推文开始（通常以 ## 或 ### 开头）
    if (line.startsWith('##') || line.startsWith('###')) {
      // 保存上一条推文
      if (inTweetBlock && contentBuffer.length > 0) {
        const content = contentBuffer.join('\n').trim();
        if (content && isToday(currentTweet.createdAt || '', targetDate)) {
          tweets.push({
            id: currentTweet.id || generateTweetId(),
            author: currentTweet.author || username,
            username: username,
            content: content,
            createdAt: currentTweet.createdAt || new Date().toISOString(),
            likes: currentTweet.likes || 0,
            retweets: currentTweet.retweets || 0,
            replies: currentTweet.replies || 0,
            url: currentTweet.url || `https://x.com/${username}/status/${currentTweet.id}`
          });
        }
      }
      
      // 开始新推文
      inTweetBlock = true;
      contentBuffer = [];
      currentTweet = { username };
      continue;
    }
    
    // 提取时间戳
    const dateMatch = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
    if (dateMatch) {
      currentTweet.createdAt = dateMatch[1];
    }
    
    // 提取互动数据
    const likesMatch = line.match(/(\d+)\s*(likes?|👍)/i);
    if (likesMatch) currentTweet.likes = parseInt(likesMatch[1]);
    
    const retweetsMatch = line.match(/(\d+)\s*(retweets?|🔄)/i);
    if (retweetsMatch) currentTweet.retweets = parseInt(retweetsMatch[1]);
    
    const repliesMatch = line.match(/(\d+)\s*(replies?|💬)/i);
    if (repliesMatch) currentTweet.replies = parseInt(repliesMatch[1]);
    
    // 提取 URL
    const urlMatch = line.match(/https:\/\/x\.com\/\w+\/status\/(\d+)/);
    if (urlMatch) {
      currentTweet.id = urlMatch[1];
      currentTweet.url = urlMatch[0];
    }
    
    // 收集推文内容
    if (inTweetBlock && line && !line.startsWith('---')) {
      contentBuffer.push(line);
    }
  }
  
  // 保存最后一条推文
  if (inTweetBlock && contentBuffer.length > 0) {
    const content = contentBuffer.join('\n').trim();
    if (content && isToday(currentTweet.createdAt || '', targetDate)) {
      tweets.push({
        id: currentTweet.id || generateTweetId(),
        author: currentTweet.author || username,
        username: username,
        content: content,
        createdAt: currentTweet.createdAt || new Date().toISOString(),
        likes: currentTweet.likes || 0,
        retweets: currentTweet.retweets || 0,
        replies: currentTweet.replies || 0,
        url: currentTweet.url || `https://x.com/${username}/status/${currentTweet.id}`
      });
    }
  }

  console.log(`  ✅ Parsed ${tweets.length} tweets from today`);
  return tweets;
}

// 检查日期是否是今天
function isToday(dateStr: string, targetDate: string): boolean {
  if (!dateStr) return false;
  const tweetDate = dateStr.split('T')[0];
  return tweetDate === targetDate;
}

// 生成临时推文 ID
function generateTweetId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
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
  
  // 只抓取高优先级创作者（避免请求过多）
  const activeCreators = config.creators.filter(c => c.active);
  const highPriorityCreators = activeCreators.filter(c => c.priority === 'high');
  const creatorsToFetch = highPriorityCreators.length > 0 ? highPriorityCreators : activeCreators.slice(0, 5);
  
  console.log(`👥 Active creators: ${activeCreators.length}`);
  console.log(`🎯 High priority: ${highPriorityCreators.length}`);
  console.log(`📊 Will fetch: ${creatorsToFetch.length} (to avoid rate limits)\n`);

  const allTweets: Tweet[] = [];
  let successCount = 0;

  // 收集所有创作者的推文
  for (let i = 0; i < creatorsToFetch.length; i++) {
    const creator = creatorsToFetch[i];

    try {
      const tweets = await fetchTweetsForCreator(creator.username, today);
      
      if (tweets.length > 0) {
        successCount++;
        allTweets.push(...tweets);
        console.log(`✅ @${creator.username}: ${tweets.length} tweets`);
      } else {
        console.log(`⚪ @${creator.username}: No tweets today`);
      }
      
      // 在请求之间添加随机延迟（除了最后一个）
      if (i < creatorsToFetch.length - 1) {
        await randomDelay();
      }
      
    } catch (error: any) {
      console.error(`❌ @${creator.username}: Error - ${error.message}`);
      // 出错后也延迟，避免快速重试
      if (i < creatorsToFetch.length - 1) {
        await sleep(5000); // 出错后等待5秒
      }
    }
  }

  console.log(`\n📊 Total collected: ${allTweets.length} tweets from ${successCount} creators\n`);

  // 分类和统计
  const categories = categorizeTweets(allTweets, config.keywords);
  const statistics = calculateStatistics(allTweets);

  const digest: DailyDigest = {
    date: today,
    totalTweets: allTweets.length,
    activeCreators: successCount,
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
