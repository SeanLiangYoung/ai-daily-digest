#!/usr/bin/env bun
/**
 * AI Daily Digest - Report Generation Script
 * 
 * 功能：
 * 1. 读取收集的数据 (data/{date}.json)
 * 2. 生成 Markdown 报告
 * 3. 保存到 reports/ 目录
 * 
 * 作者：Kai
 * 日期：2026-03-08
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DailyDigest } from './collect';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// 格式化推文内容
function formatTweet(tweet: any): string {
  const engagement = tweet.likes + tweet.retweets + tweet.replies;
  return `### [@${tweet.username}](https://x.com/${tweet.username})

**内容：**
${tweet.content}

**互动：** 👍 ${tweet.likes} | 🔄 ${tweet.retweets} | 💬 ${tweet.replies} (总计: ${engagement})

**链接：** ${tweet.url}

**时间：** ${new Date(tweet.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}

---
`;
}

// 格式化推文列表
function formatTweetList(tweets: any[]): string {
  if (tweets.length === 0) {
    return '_本分类暂无内容_\n';
  }

  return tweets
    .sort((a, b) => (b.likes + b.retweets + b.replies) - (a.likes + a.retweets + a.replies))
    .slice(0, 10) // 每个分类最多 10 条
    .map(formatTweet)
    .join('\n');
}

// 提取主要话题
function extractTopics(tweets: any[], count: number = 5): string {
  // TODO: 实现更智能的话题提取（使用 NLP 或 LLM）
  // 现在返回简单的关键词统计
  const keywords = ['AI', 'LLM', 'GPT', 'Claude', 'Gemini', 'OpenAI', 'Research', 'Model'];
  return keywords.slice(0, count).join(', ');
}

// 生成创作者列表
function generateCreatorsList(tweets: any[]): string {
  const creators = new Map<string, { name: string; count: number }>();

  for (const tweet of tweets) {
    const key = tweet.username;
    if (creators.has(key)) {
      creators.get(key)!.count++;
    } else {
      creators.set(key, { name: tweet.author, count: 1 });
    }
  }

  return Array.from(creators.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .map(([username, info]) => `- [@${username}](https://x.com/${username}) - ${info.name} (${info.count} 条推文)`)
    .join('\n');
}

// 生成报告
function generateReport(digest: DailyDigest): string {
  const { date, totalTweets, activeCreators, categories, statistics } = digest;

  const topTopics = extractTopics(digest.tweets);
  const generatedTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

  const hotContent = formatTweetList(
    digest.tweets
      .sort((a, b) => (b.likes + b.retweets + b.replies) - (a.likes + a.retweets + a.replies))
      .slice(0, 5)
  );

  const creatorsList = generateCreatorsList(digest.tweets);

  const topTweetInfo = statistics.topTweet
    ? `[@${statistics.topTweet.username}](${statistics.topTweet.url}) - ${statistics.topTweet.likes + statistics.topTweet.retweets + statistics.topTweet.replies} 次互动`
    : '_暂无数据_';

  const report = `# AI Daily Digest - ${date}

> 每日精选 AI 领域创作者的优质内容

## 📊 今日概览

- **收集推文数：** ${totalTweets}
- **活跃创作者数：** ${activeCreators}
- **主要话题：** ${topTopics}
- **生成时间：** ${generatedTime}

---

## 🔥 热门内容

${hotContent}

---

## 📝 分类内容

### 🚀 技术突破

${formatTweetList(categories.techBreakthrough)}

### 📦 产品发布

${formatTweetList(categories.productLaunch)}

### 💭 行业观点

${formatTweetList(categories.industryInsights)}

### 📚 教程/资源

${formatTweetList(categories.tutorialsResources)}

### 💡 有趣发现

${formatTweetList(categories.interestingFinds)}

---

## 🔗 创作者列表

${creatorsList}

---

## 📈 统计信息

- **数据来源：** X (Twitter)
- **收集时间范围：** ${date} 00:00 - 23:59 (GMT+8)
- **总互动数：** ${statistics.totalEngagement.toLocaleString()} (点赞 + 转发 + 评论)
- **最高互动推文：** ${topTweetInfo}

---

_本报告由 AI 助手 Kai 自动生成 🌊_

_数据更新时间：${generatedTime}_
`;

  return report;
}

// 保存报告
function saveReport(date: string, content: string): string {
  const [year, month] = date.split('-');
  const reportDir = path.join(ROOT_DIR, 'reports', year, month);

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.join(reportDir, `${date}.md`);
  fs.writeFileSync(reportPath, content, 'utf-8');

  return reportPath;
}

// 主函数
async function main(date?: string) {
  console.log('📝 AI Daily Digest - Report Generation');
  console.log('======================================\n');

  const targetDate = date || new Date().toISOString().split('T')[0];
  const dataPath = path.join(ROOT_DIR, 'data', `${targetDate}.json`);

  if (!fs.existsSync(dataPath)) {
    console.error(`❌ Data file not found: ${dataPath}`);
    console.log('💡 Tip: Run collect.ts first to gather data');
    process.exit(1);
  }

  console.log(`📅 Date: ${targetDate}`);
  console.log(`📂 Reading: ${dataPath}\n`);

  const digest: DailyDigest = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  console.log(`📊 Tweets: ${digest.totalTweets}`);
  console.log(`👥 Creators: ${digest.activeCreators}\n`);

  const report = generateReport(digest);
  const reportPath = saveReport(targetDate, report);

  console.log(`✅ Report generated: ${reportPath}`);
  console.log(`\n✨ Generation complete!`);

  return reportPath;
}

// 运行
if (import.meta.main) {
  const date = process.argv[2];
  main(date).catch(console.error);
}

export { main };
