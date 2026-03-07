#!/bin/bash
# AI Daily Digest - Main Entry Point
# 
# 功能：完整的每日流程
# 1. 数据收集
# 2. 报告生成  
# 3. Git 提交
# 4. Telegram 通知
#
# 作者：Kai
# 日期：2026-03-08

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

# Step 1: 数据收集
echo "📊 Step 1/4: Collecting data..."
bun run "${SCRIPT_DIR}/collect.ts"
echo ""

# Step 2: 生成报告
echo "📝 Step 2/4: Generating report..."
bun run "${SCRIPT_DIR}/generate-report.ts" "${DATE}"
echo ""

# Step 3: Git 提交
echo "🚀 Step 3/4: Publishing to GitHub..."
"${SCRIPT_DIR}/publish.sh"
echo ""

# Step 4: Telegram 通知
echo "📱 Step 4/4: Sending Telegram notification..."
REPORT_PATH="reports/$(date +%Y)/$(date +%m)/${DATE}.md"
GITHUB_URL="https://github.com/SeanLiangYoung/ai-daily-digest/blob/main/${REPORT_PATH}"

MESSAGE="📰 AI Daily Digest - ${DATE}

✅ 今日报告已生成并提交

🔗 查看报告：
${GITHUB_URL}

⏰ 下次更新：明天 08:00

_— Kai 🌊_"

# 使用 OpenClaw CLI 发送 Telegram 消息
openclaw message send --channel telegram --target 6021345841 --message "${MESSAGE}"

echo ""
echo "✨ Daily digest workflow complete!"
echo ""
echo "📋 Summary:"
echo "  - Data collected ✓"
echo "  - Report generated ✓"
echo "  - Pushed to GitHub ✓"
echo "  - Notification sent ✓"
