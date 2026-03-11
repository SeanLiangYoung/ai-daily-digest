# AI Daily Digest

每日 AI 资讯聚合工具 - 自动收集、分类和汇总中文和英文 AI 领域创作者的推文。

## 🎯 核心功能

### 1. **每周循环调度机制**
- ✅ 每天轮换选择一批创作者（默认 7 人/天）
- ✅ 确保每周每个创作者都会被浏览一遍，且**只浏览一遍**
- ✅ 自动追踪调度状态，新的一周自动重置
- ✅ 按优先级（high > medium > low）智能排序

### 2. **获取最近一周的推文**
- ✅ 不再只获取当天推文，改为获取**最近 7 天**的推文
- ✅ 自动过滤日期范围（`YYYY-MM-DD` to `YYYY-MM-DD`）
- ✅ 更全面的内容覆盖，不错过周末内容

### 3. **中英文双语支持**
- ✅ 整合了 49 位**中文 AI 领域创作者**
  - AI 领域：宝玉、歸藏、Gorden_Sun、李开复等
  - 创业者：立党、铁锤人、李自然、Fenng 等
  - SaaS/产品：indie_maker_fox、HongyuanCao 等
- ✅ 保留了 10 位**英文国际 AI 领袖**
  - 组织：OpenAI、Anthropic、Meta AI
  - 研究者：Andrej Karpathy、Yann LeCun 等

### 4. **智能分类和统计**
- 🔬 技术突破 (Tech Breakthrough)
- 🚀 产品发布 (Product Launch)
- 💡 行业洞察 (Industry Insights)
- 📚 教程资源 (Tutorials & Resources)
- ✨ 有趣发现 (Interesting Finds)

## 📊 配置说明

### `creators.json` 结构

```json
{
  "version": "2.0",
  "scheduling": {
    "mode": "weekly-rotation",
    "creatorsPerDay": 7,              // 每天抓取 7 个创作者
    "ensureWeeklyCoverage": true,     // 确保每周全覆盖
    "weekStartDay": "monday"          // 一周开始日（周一）
  },
  "creators": [
    {
      "username": "dotey",
      "name": "宝玉",
      "bio": "中文 AI 圈高频信息源...",
      "category": "AI领域",
      "priority": "high",               // high | medium | low
      "active": true,
      "language": "zh"                  // zh | en
    }
  ],
  "settings": {
    "daysToFetch": 7,                   // 获取最近 7 天
    "weeklyRotation": true,             // 启用每周循环
    "maxTweetsPerCreator": 20,
    "minEngagement": 5
  }
}
```

### 调度状态文件

系统会自动维护 `data/scheduling-state.json`：

```json
{
  "weekNumber": 10,                     // 当前周数
  "lastUpdate": "2026-03-10",
  "creatorSchedule": {
    "dotey": 10,                        // 用户名 -> 最后抓取的周数
    "op7418": 10,
    "Gorden_Sun": 9                     // 这周还没抓取
  }
}
```

## 🚀 使用方法

### 1. 手动运行

```bash
cd ~/.openclaw/workspace/ai-daily-digest
bun run scripts/collect.ts
```

### 2. 自动化（Cron 定时任务）

每天早上 8:00 自动运行：

```bash
0 8 * * * cd ~/.openclaw/workspace/ai-daily-digest && bun run scripts/collect.ts
```

### 3. 生成日报

```bash
bun run scripts/generate-report.ts
```

## 📁 输出文件

### 每日数据文件：`data/YYYY-MM-DD.json`

```json
{
  "date": "2026-03-10",
  "weekNumber": 10,
  "dayOfWeek": 1,                       // 0=周日, 1=周一, ...
  "totalTweets": 156,
  "activeCreators": 7,
  "scheduledCreators": [                // 今天抓取的创作者列表
    "dotey", "op7418", "Gorden_Sun", ...
  ],
  "tweets": [...],
  "categories": {
    "techBreakthrough": [...],
    "productLaunch": [...],
    "industryInsights": [...],
    "tutorialsResources": [...],
    "interestingFinds": [...]
  },
  "statistics": {
    "totalEngagement": 12450,
    "topTweet": {...}
  }
}
```

## 🔄 调度逻辑

### 每周循环流程

1. **周一开始**：系统检测到新的一周（weekNumber 变化）
2. **重置状态**：清空所有创作者的调度记录
3. **每天选择**：
   - 找出本周还没被抓取的创作者
   - 按优先级排序（high > medium > low）
   - 选择前 N 个（默认 7 个）
   - 更新调度状态
4. **避免重复**：同一周内不会重复抓取同一个创作者
5. **全覆盖**：如果创作者数量 = 59，creatorsPerDay = 7，则一周内会覆盖 49 人（7天 × 7人/天）

### 示例时间表

| 日期 | 创作者 | 说明 |
|------|--------|------|
| 周一 | dotey, op7418, Gorden_Sun, ... (7人) | 优先选择 high priority |
| 周二 | xiaohu, shao__meng, ... (7人) | 继续选择未抓取的 |
| 周三 | 下一批 7 人 | ... |
| ... | ... | ... |
| 下周一 | dotey, op7418, ... | 重新开始循环 |

## 🛠️ 技术栈

- **Runtime**: Bun（快速 JS/TS 运行时）
- **爬虫**: baoyu-danger-x-to-markdown skill
- **存储**: JSON 文件
- **调度**: 自定义周循环算法

## 📝 更新日志

### v2.0 (2026-03-10)
- ✅ 新增 49 位中文 AI 创作者
- ✅ 实现每周循环调度机制
- ✅ 将获取范围从当天扩展到最近一周
- ✅ 新增调度状态追踪
- ✅ 优化优先级排序逻辑

### v1.0 (2026-03-08)
- ✅ 初始版本
- ✅ 支持 10 位英文 AI 创作者
- ✅ 基本的推文收集和分类

## 🔐 安全说明

- 使用反向工程的 X API（baoyu-danger-x-to-markdown）
- 建议添加随机延迟（3-8 秒）避免触发速率限制
- 不会泄露用户凭证，只读取公开推文

## 📞 维护

- **作者**: Kai
- **更新**: 2026-03-10
- **仓库**: ~/.openclaw/workspace/ai-daily-digest

---

**Pro Tip**: 如果创作者数量较多，建议增加 `creatorsPerDay` 以确保一周内全覆盖。例如：
- 59 位创作者 ÷ 7 天 = 每天约 8-9 人
- 建议设置 `creatorsPerDay: 9`
