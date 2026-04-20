#!/usr/bin/env bun
/**
 * AI Daily Digest - Data Collection Script
 * 
 * 功能：
 * 1. 读取 creators.json
 * 2. 每天轮换选择一批创作者（确保每周每人都被浏览一次且只一次）
 * 3. 获取每个创作者最近一周的推文
 * 4. 过滤和分类内容
 * 5. 生成结构化数据
 * 
 * 作者：Kai
 * 日期：2026-03-10
 * 更新：实现每周循环调度机制
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
  language?: string;
}

interface SchedulingConfig {
  mode: string;
  creatorsPerDay: number;
  ensureWeeklyCoverage: boolean;
  weekStartDay: string;
}

interface CreatorsConfig {
  version: string;
  lastUpdated: string;
  source: string;
  scheduling: SchedulingConfig;
  creators: Creator[];
  keywords: string[];
  excludeKeywords: string[];
  settings: {
    updateTime: string;
    timezone: string;
    maxTweetsPerCreator: number;
    minEngagement: number;
    daysToFetch: number;
    weeklyRotation: boolean;
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
  weekNumber: number;
  dayOfWeek: number;
  totalTweets: number;
  activeCreators: number;
  scheduledCreators: string[];
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

interface SchedulingState {
  weekNumber: number;
  lastUpdate: string;
  creatorSchedule: {
    [username: string]: number; // 最后一次抓取的周数
  };
}

// 读取创作者列表
function loadCreators(): CreatorsConfig {
  const configPath = path.join(ROOT_DIR, 'creators.json');
  const content = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(content);
}

// 读取或初始化调度状态
function loadSchedulingState(): SchedulingState {
  const statePath = path.join(ROOT_DIR, 'data', 'scheduling-state.json');
  
  if (fs.existsSync(statePath)) {
    const content = fs.readFileSync(statePath, 'utf-8');
    return JSON.parse(content);
  }
  
  // 初始化状态
  return {
    weekNumber: 0,
    lastUpdate: '',
    creatorSchedule: {}
  };
}

// 保存调度状态
function saveSchedulingState(state: SchedulingState): void {
  const statePath = path.join(ROOT_DIR, 'data', 'scheduling-state.json');
  const dataDir = path.dirname(statePath);
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

// 获取当前日期的周数和星期几
function getWeekInfo(date: Date = new Date()): { weekNumber: number; dayOfWeek: number } {
  // 计算周数（ISO 8601）
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  
  // 获取星期几（0=周日，1=周一，...）
  const dayOfWeek = date.getDay();
  
  return { weekNumber, dayOfWeek };
}

// 获取今天的日期 (YYYY-MM-DD)
function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 获取一周前的日期 (YYYY-MM-DD)
function getWeekAgoDate(): string {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const year = weekAgo.getFullYear();
  const month = String(weekAgo.getMonth() + 1).padStart(2, '0');
  const day = String(weekAgo.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 选择今天要抓取的创作者（每周循环调度）
function selectCreatorsForToday(
  config: CreatorsConfig,
  state: SchedulingState,
  currentWeek: number
): Creator[] {
  const activeCreators = config.creators.filter(c => c.active);
  const creatorsPerDay = config.scheduling.creatorsPerDay;
  
  // 如果是新的一周，重置所有创作者的调度状态
  if (currentWeek !== state.weekNumber) {
    console.log(`📅 New week detected: Week ${currentWeek}`);
    state.weekNumber = currentWeek;
    state.creatorSchedule = {};
  }
  
  // 找出本周还没有被抓取的创作者
  const unscheduledCreators = activeCreators.filter(
    c => state.creatorSchedule[c.username] !== currentWeek
  );
  
  console.log(`📊 Total active creators: ${activeCreators.length}`);
  console.log(`📋 Unscheduled this week: ${unscheduledCreators.length}`);
  
  // 如果所有创作者都已经被抓取过，重新开始（这种情况不应该发生，但作为保险）
  const creatorsToChooseFrom = unscheduledCreators.length > 0 
    ? unscheduledCreators 
    : activeCreators;
  
  // 按优先级和类别排序
  const sortedCreators = creatorsToChooseFrom.sort((a, b) => {
    // 优先级：high > medium > low
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                        (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
    if (priorityDiff !== 0) return priorityDiff;
    
    // 如果优先级相同，随机打乱（避免总是选择同样的人）
    return Math.random() - 0.5;
  });
  
  // 选择今天要抓取的创作者
  const selectedCreators = sortedCreators.slice(0, creatorsPerDay);
  
  // 更新调度状态
  for (const creator of selectedCreators) {
    state.creatorSchedule[creator.username] = currentWeek;
  }
  
  state.lastUpdate = getTodayDate();
  saveSchedulingState(state);
  
  return selectedCreators;
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

// 获取创作者的推文（最近一周）- 使用浏览器抓取
async function fetchTweetsForCreator(username: string, startDate: string, endDate: string): Promise<Tweet[]> {
  console.log(`[Collecting] Fetching tweets for @${username} (${startDate} to ${endDate})...`);
  
  try {
    // 使用 baoyu-url-to-markdown 浏览器方式获取用户时间线
    const skillPath = '/Users/seanliang/projects/sean-s-skills/skills/baoyu-url-to-markdown';
    const tmpFile = `/tmp/x-${username}-${Date.now()}.md`;
    
    // 执行抓取（获取用户最近的推文）
    // 设置环境变量使用用户的 Chrome profile（包含登录态 cookies）
    const { spawnSync } = await import('node:child_process');
    const result = spawnSync(
      process.env.HOME + '/.bun/bin/bun',
      [
        `${skillPath}/scripts/main.ts`,
        `https://x.com/${username}`,
        '-o',
        tmpFile,
        '--timeout',
        '90000'
      ],
      {
        encoding: 'utf-8',
        timeout: 120000, // 120秒超时
        env: {
          ...process.env,
          HOME: process.env.HOME,
          URL_CHROME_PATH: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          URL_CHROME_PROFILE_DIR: process.env.HOME + '/Library/Application Support/Google/Chrome/Default'
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
      console.log(`  ⚠️  No output file generated: ${tmpFile}`);
      return [];
    }

    const content = fs.readFileSync(tmpFile, 'utf-8');
    console.log(`  📄 Captured content: ${content.length} chars, lines: ${content.split('\n').length}`);
    
    // 清理临时文件
    fs.unlinkSync(tmpFile);

    // 解析 Markdown 提取推文数据（最近一周）
    const tweets = parseMarkdownToTweets(content, username, startDate, endDate);
    
    // Debug: check for dates in content
    const dateMatches = content.match(/\d+月\d+日|\d{4}年\d+月\d+日/g);
    console.log(`  🔍 Found dates in content:`, dateMatches ? dateMatches.slice(0, 5) : 'none');
    
    return tweets;

  } catch (error: any) {
    console.error(`  ❌ Error fetching @${username}:`, error.message);
    return [];
  }
}

// 解析 Markdown 内容提取推文
function parseMarkdownToTweets(
  markdown: string, 
  username: string,
  startDate: string,
  endDate: string
): Tweet[] {
  const tweets: Tweet[] = [];
  
  const lines = markdown.split('\n');
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  let currentTweet: Partial<Tweet> = {};
  let contentBuffer: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 匹配日期格式: [2025年12月4日](链接) 或 [3月8日](链接)
    // 也支持纯文本日期格式（新抓取工具输出）: 2025年12月4日 或 3月8日 或 Oct 30
    const fullDateMatch = line.match(/\[(\d{4})年(\d{1,2})月(\d{1,2})日\]\(([^)]+)\)/);
    const shortDateMatch = line.match(/\[(\d{1,2})月(\d{1,2})日\]\(([^)]+)\)/);
    const engFullMatch = line.match(/\[([A-Za-z]{3}\s\d{1,2},\s\d{4})\]\(([^)]+)\)/);
    const engShortMatch = line.match(/\[([A-Za-z]{3}\s\d{1,2})\]\(([^)]+)\)/);
    
    // 纯文本日期匹配（无链接格式）
    const fullDateTextMatch = line.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日\s*$/);
    const shortDateTextMatch = line.match(/^(\d{1,2})月(\d{1,2})日\s*$/);
    const engDateTextMatch = line.match(/^([A-Za-z]{3})\s+(\d{1,2})(?:,\s*(\d{4}))?\s*$/);
    
    if (fullDateMatch || shortDateMatch || engFullMatch || engShortMatch || fullDateTextMatch || shortDateTextMatch || engDateTextMatch) {
      // 保存上一条推文（现在也支持无链接的纯文本日期）
      if (contentBuffer.length > 0 && (currentTweet.url || currentTweet.createdAt)) {
        const content = contentBuffer.join('\n').trim();
        if (content && isWithinDateRange(currentTweet.createdAt || '', startDate, endDate)) {
          tweets.push({
            id: currentTweet.id || generateTweetId(),
            author: currentTweet.author || username,
            username: username,
            content: content,
            createdAt: currentTweet.createdAt || new Date().toISOString(),
            likes: currentTweet.likes || 0,
            retweets: currentTweet.retweets || 0,
            replies: currentTweet.replies || 0,
            url: currentTweet.url
          });
        }
      }
      
      // 开始新推文
      currentTweet = { username };
      contentBuffer = [];
      
      // 解析日期
      if (fullDateMatch) {
        const [, year, month, day] = fullDateMatch;
        currentTweet.createdAt = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`;
        currentTweet.url = fullDateMatch[4];
      } else if (shortDateMatch) {
        const [, month, day] = shortDateMatch;
        const monthNum = parseInt(month);
        const year = monthNum > currentMonth ? currentYear - 1 : currentYear;
        currentTweet.createdAt = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`;
        currentTweet.url = shortDateMatch[3];
      } else if (engFullMatch) {
        const [, dateStr, url] = engFullMatch;
        const [, monthStr, day, year] = dateStr.match(/([A-Za-z]{3})\s+(\d{1,2}),?\s+(\d{4})/) || [];
        const monthMap: Record<string, string> = {
          'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
          'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        };
        currentTweet.createdAt = `${year}-${monthMap[monthStr] || '01'}-${day.padStart(2, '0')}T00:00:00.000Z`;
        currentTweet.url = url;
      } else if (engShortMatch) {
        const [, dateStr, url] = engShortMatch;
        const [, monthStr, day] = dateStr.match(/([A-Za-z]{3})\s+(\d{1,2})/) || [];
        const monthMap: Record<string, string> = {
          'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
          'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        };
        const monthNum = parseInt(monthMap[monthStr] || '01');
        const year = monthNum > currentMonth ? currentYear - 1 : currentYear;
        currentTweet.createdAt = `${year}-${monthMap[monthStr] || '01'}-${day.padStart(2, '0')}T00:00:00.000Z`;
        currentTweet.url = url;
      } else if (fullDateTextMatch) {
        // 纯文本日期: 2025年12月4日
        const [, year, month, day] = fullDateTextMatch;
        currentTweet.createdAt = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`;
        currentTweet.url = '';
      } else if (shortDateTextMatch) {
        // 纯文本日期: 3月8日
        const [, month, day] = shortDateTextMatch;
        const monthNum = parseInt(month);
        const year = monthNum > currentMonth ? currentYear - 1 : currentYear;
        currentTweet.createdAt = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`;
        currentTweet.url = '';
      } else if (engDateTextMatch) {
        // 纯文本日期: Oct 30 或 Oct 30, 2025
        const [, monthStr, day, yearOpt] = engDateTextMatch;
        const monthMap: Record<string, string> = {
          'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
          'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        };
        const monthNum = parseInt(monthMap[monthStr] || '01');
        const year = yearOpt || (monthNum > currentMonth ? String(currentYear - 1) : String(currentYear));
        currentTweet.createdAt = `${year}-${monthMap[monthStr] || '01'}-${day.padStart(2, '0')}T00:00:00.000Z`;
        currentTweet.url = '';
      }
      
      // 提取推文 ID
      const idMatch = currentTweet.url?.match(/status\/(\d+)/);
      if (idMatch) currentTweet.id = idMatch[1];
      
      continue;
    }
    
    // 提取互动数据 (纯数字行 或 中文万单位)
    const numMatch = line.match(/^([\d,]+)\s*$/);
    const cnNumMatch = line.match(/^([\d.]+)(万|千)\s*$/); // 中文数字格式如 7.2万
    
    if (cnNumMatch && currentTweet.url) {
      // 转换中文数字格式
      let num = parseFloat(cnNumMatch[1]);
      if (cnNumMatch[2] === '万') num *= 10000;
      else if (cnNumMatch[2] === '千') num *= 1000;
      if (!currentTweet.likes) currentTweet.likes = num;
      else if (!currentTweet.retweets) currentTweet.retweets = num;
      else if (!currentTweet.replies) currentTweet.replies = num;
      continue;
    } else if (numMatch && currentTweet.url) {
      const num = parseInt(numMatch[1].replace(/,/g, ''));
      if (!currentTweet.likes) currentTweet.likes = num;
      else if (!currentTweet.retweets) currentTweet.retweets = num;
      else if (!currentTweet.replies) currentTweet.replies = num;
      continue;
    }
    
    // 收集内容 (非特殊行) - 现在也支持无链接的纯文本日期
    if (line && (currentTweet.url || currentTweet.createdAt) && !line.startsWith('#') && !line.startsWith('---') && 
        !line.startsWith('![') && !line.startsWith('http') && !line.startsWith('```')) {
      // 移除链接但保留文字
      const cleanedLine = line.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      if (cleanedLine.trim() && cleanedLine.length > 2) {
        contentBuffer.push(cleanedLine);
      }
    }
  }
  
  // 保存最后一条推文（现在也支持无链接的纯文本日期）
  if (contentBuffer.length > 0 && (currentTweet.url || currentTweet.createdAt)) {
    const content = contentBuffer.join('\n').trim();
    if (content && isWithinDateRange(currentTweet.createdAt || '', startDate, endDate)) {
      tweets.push({
        id: currentTweet.id || generateTweetId(),
        author: currentTweet.author || username,
        username: username,
        content: content,
        createdAt: currentTweet.createdAt || new Date().toISOString(),
        likes: currentTweet.likes || 0,
        retweets: currentTweet.retweets || 0,
        replies: currentTweet.replies || 0,
        url: currentTweet.url || ''
      });
    }
  }

  console.log(`  ✅ Parsed ${tweets.length} tweets from the last week`);
  return tweets;
}

// 检查日期是否在指定范围内（最近一周）
function isWithinDateRange(dateStr: string, startDate: string, endDate: string): boolean {
  if (!dateStr) return false;
  const tweetDate = dateStr.split('T')[0];
  return tweetDate >= startDate && tweetDate <= endDate;
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
  console.log('🤖 AI Daily Digest - Data Collection (Weekly Rotation)');
  console.log('========================================================\n');

  const config = loadCreators();
  const state = loadSchedulingState();
  
  const today = getTodayDate();
  const weekAgo = getWeekAgoDate();
  const { weekNumber, dayOfWeek } = getWeekInfo();
  
  console.log(`📅 Date: ${today}`);
  console.log(`📅 Date range: ${weekAgo} to ${today}`);
  console.log(`📆 Week: ${weekNumber}, Day: ${dayOfWeek}\n`);
  
  // 选择今天要抓取的创作者
  const creatorsToFetch = selectCreatorsForToday(config, state, weekNumber);
  
  console.log(`\n🎯 Selected ${creatorsToFetch.length} creators for today:`);
  creatorsToFetch.forEach((c, i) => {
    console.log(`   ${i + 1}. @${c.username} (${c.name}) - ${c.priority} priority`);
  });
  console.log('');

  const allTweets: Tweet[] = [];
  let successCount = 0;

  // 收集所有创作者的推文
  for (let i = 0; i < creatorsToFetch.length; i++) {
    const creator = creatorsToFetch[i];

    try {
      const tweets = await fetchTweetsForCreator(creator.username, weekAgo, today);
      
      if (tweets.length > 0) {
        successCount++;
        allTweets.push(...tweets);
        console.log(`✅ @${creator.username}: ${tweets.length} tweets`);
      } else {
        console.log(`⚪ @${creator.username}: No tweets in the last week`);
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
    weekNumber,
    dayOfWeek,
    totalTweets: allTweets.length,
    activeCreators: successCount,
    scheduledCreators: creatorsToFetch.map(c => c.username),
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
  console.log(`\n📊 Weekly coverage status:`);
  
  // 显示本周的覆盖情况
  const totalActive = config.creators.filter(c => c.active).length;
  const scheduledThisWeek = Object.values(state.creatorSchedule).filter(w => w === weekNumber).length;
  console.log(`   - Total active creators: ${totalActive}`);
  console.log(`   - Scheduled this week: ${scheduledThisWeek}`);
  console.log(`   - Remaining: ${totalActive - scheduledThisWeek}`);

  return digest;
}

// 运行
if (import.meta.main) {
  main().catch(console.error);
}

export { main, type DailyDigest };
