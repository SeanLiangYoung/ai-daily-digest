#!/bin/bash
# AI Daily Digest - Main Entry Point
# 
# 功能：完整的每日流程
# 1. 收集 Twitter 数据
# 2. 收集新闻资讯
# 3. 生成报告
# 4. Git 提交
# 5. Telegram 通知
#
# 作者：Kai
# 日期：2026-03-08
# 更新：2026-04-15 添加新闻收集

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "${SCRIPT_DIR}")"

cd "${ROOT_DIR}"

echo "🤖 AI Daily Digest - Complete Workflow"
echo "======================================"
echo ""

DATE=$(date +%Y-%m-%d)
echo "📅 Date: ${DATE}"
echo ""

# Step 1: 收集 Twitter 数据
echo "🐦 Step 1/5: Collecting Twitter data..."
bun run "${SCRIPT_DIR}/collect.ts"
echo ""

# Step 2: 收集新闻资讯
echo "📰 Step 2/5: Collecting news..."
bun run "${SCRIPT_DIR}/collect-news.ts"
echo ""

# Step 3: 生成报告 (包含 Twitter 和新闻)
echo "📝 Step 3/5: Generating report..."
bun run "${SCRIPT_DIR}/generate-news-report.ts" "${DATE}"
echo ""

# Step 4: Git 提交
echo "🚀 Step 4/5: Publishing to GitHub..."
"${SCRIPT_DIR}/publish.sh"
echo ""

# Step 5: Telegram 通知
echo "📱 Step 5/5: Sending Telegram notification..."
REPORT_PATH_TWITTER="reports/$(date +%Y)/$(date +%m)/${DATE}.md"
GITHUB_URL_TWITTER="https://github.com/SeanLiangYoung/ai-daily-digest/blob/main/${REPORT_PATH_TWITTER}"

MESSAGE="🌊 AI Daily Digest - ${DATE}

✅ 今日报告已生成

📰 报告内容：
• Twitter 推文汇总
• AI & 科技新闻
• Crypto & Web3 新闻
• 商业 & 创业新闻

🔗 查看报告：
${GITHUB_URL_TWITTER}

⏰ 下次更新：明天 08:00

_— Kai 🌊_"

# 使用 OpenClaw CLI 发送 Telegram 消息
openclaw message send --channel telegram --target 6021345841 --message "${MESSAGE}"

echo ""
echo "✨ Daily digest workflow complete!"
echo ""
echo "📋 Summary:"
echo "  - Twitter data collected ✓"
echo "  - News data collected ✓"
echo "  - Report generated ✓"
echo "  - Pushed to GitHub ✓"
echo "  - Notification sent ✓"
