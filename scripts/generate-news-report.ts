#!/usr/bin/env bun
/**
 * AI Daily Digest - News Report Generation Script
 * 
 * 功能：
 * 1. 读取收集的新闻数据
 * 2. 生成 Markdown 格式报告
 * 3. 保存到 reports/ 目录
 * 
 * 作者：Kai
 * 日期：2026-04-10
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DailyNewsDigest } from './collect-news';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// 格式化新闻列表
function formatNewsList(news: any[], title: string): string {
  if (news.length === 0) {
    return `### ${title}\n\n_暂无内容_\n`;
  }

  const items = news.map((item, index) => 
    `${index + 1}. [${item.title}](${item.url})
   > ${item.snippet.substring(0, 150)}...
   > 来源: ${item.source}`
  ).join('\n\n');

  return `### ${title}\n\n${items}\n`;
}

// 生成报告
function generateReport(digest: DailyNewsDigest): string {
  const { date, generatedAt, categories, summary } = digest;

  const report = `# 🌊 AI Daily Digest - ${date}

> 每日精选科技、AI、Crypto、Web3、商业创业新闻

## 📊 今日概览

- **文章总数：** ${summary.totalArticles}
- **生成时间：** ${generatedAt}

---

## 🤖 AI & 科技

${formatNewsList(categories.aiTech, 'AI 科技要闻')}

---

## ₿ Crypto & Web3

${formatNewsList(categories.cryptoWeb3, 'Crypto & Web3 要闻')}

---

## 💼 商业 & 创业

${formatNewsList(categories.businessStartup, '商业创业要闻')}

---

## 🔗 热门推荐

${summary.topStories.map((story, i) => `${i + 1}. ${story}`).join('\n')}

---

_本报告由 AI 助手 Kai 自动生成 🌊_

_数据更新时间：${generatedAt}_
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
  console.log('📝 AI Daily Digest - News Report Generation');
  console.log('============================================\n');

  const targetDate = date || new Date().toISOString().split('T')[0];
  const dataPath = path.join(ROOT_DIR, 'data', 'news', `${targetDate}.json`);

  if (!fs.existsSync(dataPath)) {
    console.error(`❌ Data file not found: ${dataPath}`);
    console.log('💡 Tip: Run collect-news.ts first to gather data');
    process.exit(1);
  }

  console.log(`📅 Date: ${targetDate}`);
  console.log(`📂 Reading: ${dataPath}\n`);

  const digest: DailyNewsDigest = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  console.log(`📰 Articles: ${digest.summary.totalArticles}\n`);

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
