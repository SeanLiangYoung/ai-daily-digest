#!/bin/bash
# AI Daily Digest - News Collection Script
# 
# 功能：
# 1. 使用 web_search 工具搜索科技/AI、Crypto/Web3、商业/创业新闻
# 2. 生成结构化数据
# 
# 注意：此脚本由 AI Agent 执行，会自动使用内置的 web_search 工具
#
# 作者：Kai
# 日期：2026-04-10

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "${SCRIPT_DIR}")"

cd "${ROOT_DIR}"

DATE=$(date +%Y-%m-%d)
DATA_DIR="data/news"
DATA_FILE="${DATA_DIR}/${DATE}.json"

mkdir -p "${DATA_DIR}"

echo "🌊 AI Daily Digest - News Collection"
echo "===================================="
echo "📅 Date: ${DATE}"
echo ""

# 创建占位数据文件
# 实际数据收集由 AI Agent 使用 web_search 工具完成
cat > "${DATA_FILE}" << EOF
{
  "date": "${DATE}",
  "generatedAt": "$(date '+%Y-%m-%d %H:%M:%S %Z')",
  "categories": {
    "aiTech": [],
    "cryptoWeb3": [],
    "businessStartup": []
  },
  "summary": {
    "totalArticles": 0,
    "topStories": []
  },
  "note": "Data will be collected by AI Agent during cron execution"
}
EOF

echo "✅ Placeholder data file created: ${DATA_FILE}"
echo ""
echo "📊 AI Agent will populate this file with real news data"
echo "   using web_search tool during cron execution"
