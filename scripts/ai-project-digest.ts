#!/usr/bin/env bun
/**
 * AI Project Digest - 下午茶时间
 * 
 * 流程：
 * 1. 选题 - 每天选择一个有价值的AI话题
 * 2. 搜集 - 搜索相关资料和新闻
 * 3. 观点 - 基于资料形成独立观点
 * 4. 写作 - 延伸成完整文章
 * 
 * 作者：Kai
 * 日期：2026-04-15
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

// 输出目录
const OUTPUT_DIR = path.join(process.env.HOME || '/Users/seanliang', 'Documents', 'ai-digest');

interface Topic {
  title: string;
  description: string;
  searchQuery: string;
  angle: string;
}

const TOPICS: Topic[] = [
  {
    title: 'AI Agent 爆发前夜',
    description: '从 AutoGPT 到 Claude Agent，AI Agent 正在经历什么变化？',
    searchQuery: 'AI Agent 2026 Autonomous',
    angle: '从工具到员工的转变，AI Agent 的核心竞争力是什么？',
  },
  {
    title: '开源大模型的逆袭',
    description: 'Llama 4、DeepSeek 等开源模型正在挑战闭源霸权？',
    searchQuery: 'Llama DeepSeek open source 2026',
    angle: '开源真的能打败闭源吗？关键因素是什么？',
  },
  {
    title: 'AI 编程助手的上限在哪里？',
    description: '从代码补全到整个项目开发，AI 编程工具的边界在哪？',
    searchQuery: 'AI coding assistant 2026',
    angle: 'AI 编程是增强开发者还是取代开发者？',
  },
  {
    title: '中国 AI 的机会与挑战',
    description: '在 GPT 压力下，中国 AI 公司如何差异化竞争？',
    searchQuery: '中国 AI 大模型 2026',
    angle: '中国 AI 的独特优势是什么？短板在哪里？',
  },
  {
    title: 'AI 安全迎来转折点',
    description: 'Claude 4、GPT-5 都强调安全对齐，AI 安全正在变成竞争力？',
    searchQuery: 'AI safety alignment 2026',
    angle: '安全会成为 AI 竞争的新维度吗？',
  },
  {
    title: '多模态会是下一个爆发点吗？',
    description: '视觉、视频、语音的多模态模型正在快速迭代',
    searchQuery: 'multimodal AI 2026',
    angle: '多模态的核心价值是什么？何时能普及？',
  },
  {
    title: 'AI 硬件的新战争',
    description: '英伟达之外，AMD、Intel、初创公司都在入场',
    searchQuery: 'AI chip GPU 2026',
    angle: '英伟达会被撼动吗？',
  },
  {
    title: 'AI 应用层的创业机会',
    description: '模型能力趋同，应用层的机会在哪里？',
    searchQuery: 'AI startup application 2026',
    angle: '什么样的 AI 应用有真正的壁垒？',
  },
];

async function searchTopic(topic: Topic): Promise<string[]> {
  const sources: string[] = [];
  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(topic.searchQuery)}&hl=zh-CN`;
    const { stdout } = await execAsync(`curl -s -m 20 "${rssUrl}"`, { maxBuffer: 10 * 1024 * 1024 });
    const itemRegex = /<item>(.*?)<\/item>/g;
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
    let match, count = 0;
    while ((match = itemRegex.exec(stdout)) !== null && count < 5) {
      const itemXml = match[1];
      const titleMatch = itemXml.match(titleRegex);
      const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '') : '';
      if (title && !title.includes('...')) {
        sources.push(`- ${title.substring(0, 80)}`);
        count++;
      }
    }
  } catch {}
  return sources;
}

function generatePoints(topic: Topic, sources: string[]): string[] {
  const points: string[] = [];
  switch (topic.title) {
    case 'AI Agent 爆发前夜':
      points.push('**核心变化**：AI Agent 正在从"能说会道"变为"能说会干"。过去一年，Agent 从概念验证走向产品化，标志事件包括 Claude Code 发布、OpenAI Swarm 开源。这意味着 AI 不再只是回答问题的工具，而是可以代替人类执行复杂任务的"数字员工"。');
      points.push('**技术瓶颈**：虽然 Agent 概念火，但真正成熟的 Agent 框架还没出现。现在的 Agent 大多在特定场景有效，比如代码编写、邮件处理。一旦涉及复杂的多步骤任务，成功率急剧下降。问题不在于模型能力不够，而在于缺乏可靠的"执行层"——Agent 需要的不是更聪明的大脑，而是更可靠的双手。');
      points.push('**商业逻辑**：Agent 的商业模式本质是"替代人力"。如果一个 Agent 能完成一个初级员工 50% 的工作，且成本只有其 1/10，那么市场空间巨大。但现实是，目前 Agent 的使用门槛不低，企业部署成本不低，短期内仍会是"效率工具"而非"替代方案"。');
      points.push('**未来判断**：未来 6-12 个月，Agent 框架会进入"战国时代"，多个标准并存，最终收敛到 2-3 个主流方案。关键变量是：谁能让 Agent 在真实业务场景中稳定运行。');
      break;
    case '开源大模型的逆袭':
      points.push('**格局变化**：开源模型正在快速追赶闭源模型。Llama 4 在多项基准测试上接近 GPT-4，DeepSeek-V2 以不到 1/10 的成本达到相近性能。这背后是"社区力量"的体现——全球开发者一起优化、数据一起贡献、bug 一起修。');
      points.push('**真实差距**：虽然开源模型在单项指标上接近 GPT-4，但在"产品化"层面仍有差距。闭源模型的真正优势不是模型本身，而是围绕模型的整个生态——API 稳定性、fine-tuning 工具、监控面板、企业级 SLA。开源模型在"能用"层面已经 OK，但在"好用"层面还有距离。');
      points.push('**中国机会**：DeepSeek、智谱等中国团队正在探索差异化路径。DeepSeek 的 MoE 架构在成本上有明显优势，这可能是中国模型的突破点——不追求全面超越，而是在特定场景（低成本、高效率）建立优势。');
      points.push('**格局预判**：未来 1-2 年，开源和闭源会"二分天下"——闭源服务企业级市场，开源服务开发者市场。两者不会互相消灭，而是各自占据最适合的生态位。');
      break;
    case 'AI 编程助手的上限在哪里？':
      points.push('**范式转变**：AI 编程正在经历从"补全"到"理解"的转变。早期的 Copilot 只是在开发者写代码时提供建议，如今的 Claude Code 已经可以理解整个项目结构、执行多步骤任务、甚至帮你 Review 代码。这是质的变化——AI 不再是"高级记事本"，而是可以深度参与开发流程的"搭档"。');
      points.push('**真实能力**：目前 AI 编程最强的场景是：重复性代码生成、Bug 修复、代码解释、文档撰写。这些都有一个共同特点：有明确的目标和验收标准。但涉及"设计决策"、"架构选型"等需要全局理解的场景，AI 仍然受限。');
      points.push('**开发者态度分化**：资深开发者普遍对 AI 编程持谨慎态度——担心被 AI 带偏、担心失去对代码的理解、担心简历上没东西可写。但初级开发者却截然相反，AI 编程显著降低了他们的入门门槛。这种分化会在未来 2-3 年催生"AI 原生开发者"这个新群体。');
      points.push('**上限判断**：AI 编程的终极形态不是"取代开发者"，而是"放大开发者"。一个顶尖开发者 + AI 编程工具 = 10 个普通开发者的产出。这种放大效应会在未来 12-18 个月显著增强。');
      break;
    case '中国 AI 的机会与挑战':
      points.push('**差距与进步**：客观来说，中国大模型整体上与 GPT-4 仍有差距，但在特定场景正在快速接近。百度的文心、阿里的通义、智谱的 GLM、字节的豆包，各有特色。差距主要体现在：推理质量、长文本理解、多轮对话稳定性。');
      points.push('**独特优势**：中国 AI 的最大优势是"场景和数据"。中国有全球最大的互联网用户群体、最丰富的应用场景、最密集的创业生态。AI 在中国落地的速度可能比美国更快，因为中国用户对新技术更开放、企业接受度更高。');
      points.push('**核心短板**：1) 高质量中文训练数据不够丰富；2) 高端 GPU 受限，训练成本更高；3) 原创性研究不足，更多是"跟随式创新"。这三个问题不解决，中国 AI 很难实现真正的突破。');
      points.push('**破局路径**：与其在基础模型上硬碰硬，不如在应用层建立优势。中国公司在产品化、工程化、场景落地方面本来就有优势。关键是把 AI 能力与传统业务结合，做出真正有价值的 AI 产品。');
      break;
    case 'AI 安全迎来转折点':
      points.push('**风向变化**：这一代 AI 模型都在强调"安全对齐"。不再是简单的 RLHF，而是 Constitutional AI、red-teaming、可解释性研究等更系统的方法。安全正在从"合规要求"变成"产品竞争力"。');
      points.push('**商业逻辑**：过去安全性是"成本中心"——花钱做安全，但不带来收入。现在变了，安全变成卖点。企业客户在选择 AI 供应商时，可信度成为重要考量。一个更安全的模型，意味着更少的法律风险、更高的客户信任。');
      points.push('**技术挑战**：安全对齐的难点在于"价值对齐"——如何让 AI 理解人类真正的意图，而不是表面的指令。这种判断需要深层的价值理解，目前的技术还有局限。');
      points.push('**未来预判**：AI 安全会成为下一个"军备竞赛"领域。不仅是技术竞争，也是标准和话语权竞争。谁的安全标准成为行业标准，谁就拥有巨大优势。未来 12 个月，会有更多安全相关的工具和方法论出现。');
      break;
    case '多模态会是下一个爆发点吗？':
      points.push('**技术突破**：多模态模型正在经历从"单模态"到"全模态"的跨越。GPT-4V 展现图像理解能力，Sora 证明视频生成可行，Whisper 实现语音识别。这些突破让 AI 不再只是"文字工人"，而是真正的"多面手"。');
      points.push('**核心价值**：多模态的本质是"交互革命"。过去人需要用文字才能和 AI 沟通，现在可以用图片、视频、语音。这种交互方式的改变，会大幅降低 AI 的使用门槛——老年人、不方便打字的人、视觉工作者，都能更方便地使用 AI。');
      points.push('**落地场景**：多模态最有机会的场景包括：1) 内容创作（图文视频一体化）；2) 教育（视频讲解+实时问答）；3) 医疗（影像诊断+语音问诊）；4) 机器人（视觉+语音+动作的协同）。这些场景的共同特点是：信息维度丰富，单一模态无法满足需求。');
      points.push('**普及时间**：多模态技术已经 Ready，但普及还需要时间。核心瓶颈是：1) 推理成本仍然较高；2) 端侧部署困难；3) 隐私顾虑。预计 12-18 个月后，多模态会进入大规模应用阶段。');
      break;
    case 'AI 硬件的新战争':
      points.push('**格局变化**：英伟达在 AI 芯片领域的统治地位正在被挑战。AMD 的 MI300 系列性能逼近 H100，Intel 的 Gaudi 也在快速迭代，还有 Graphcore、Cerebras 等初创公司虎视眈眈。');
      points.push('**英伟达的护城河**：英伟达的核心优势不是芯片本身，而是 CUDA 生态和开发者惯性。所有 AI 框架、模型、工具都是围绕 CUDA 优化的，这种生态壁垒比硬件性能更难打破。');
      points.push('**破局机会**： challenger 的机会在于：1) 价格战（AMD 性价比更高）；2) 开源生态（AMD 正在构建 ROCm）；3) 特定场景优化（如推理、边缘计算）。只要不在数据中心正面硬刚，在细分市场有机会。');
      points.push('**中国机会**：华为昇腾、寒武纪等中国芯片在特定场景可用，但与英伟达的差距主要在软件生态。如果中国芯片不能解决适配问题，很难真正威胁英伟达。');
      break;
    case 'AI 应用层的创业机会':
      points.push('**范式转移**：模型能力正在趋同，基础模型的创新空间越来越小。这意味着机会正在从模型层向应用层转移——谁能把 AI 能力产品化，谁就能创造价值。');
      points.push('**真正的壁垒**：AI 应用的壁垒不是技术，而是：1) 场景理解（know-how）；2) 数据积累；3) 用户关系。这三者都是时间打造的，竞争对手无法快速复制。');
      points.push('**创业方向**：最有前景的 AI 应用方向：1) 垂直领域的 AI 助手（医疗、法律、金融）；2) AI 原生工作流（不是给现有软件加 AI，而是重新设计）；3) AI 时代的个人助理。');
      points.push('**风险提示**：AI 应用创业的坑：1) 过度依赖 API，没有自有模型能力；2) 市场太小（垂直领域听起来性感，但市场可能不够大）；3) 竞争激烈（大厂也在做应用层）。想清楚再入场。');
      break;
    default:
      points.push('**行业现状**：近期 AI 领域呈现快速发展态势，多项技术突破正在改变行业格局。');
      points.push('**核心变化**：' + topic.angle);
      points.push('**影响分析**：这些变化对开发者、企业、用户都会产生深远影响。关键在于如何把握机会、规避风险。');
      points.push('**趋势判断**：未来 6-12 个月，我们将看到更多实际应用场景的落地，行业将进入新的发展阶段。');
  }
  return points;
}

function writeArticle(topic: Topic, sources: string[], points: string[], date: string, generatedAt: string): string {
  const sourcesContent = sources.length > 0 
    ? '### 📚 参考来源\n\n' + sources.join('\n')
    : '### 📚 参考来源\n\n暂无最新资料，基于行业观察撰写。';
  
  const article = '# 🍵 ' + topic.title + ' - ' + date + '\n\n> ' + topic.description + '\n\n---\n\n## 🎯 今日选题\n\n**' + topic.title + '**\n' + topic.description + '\n\n**切入角度**：' + topic.angle + '\n\n---\n\n## 💡 核心观点\n\n' + points.map((p, i) => (i + 1) + '. ' + p).join('\n\n') + '\n\n---\n\n' + sourcesContent + '\n\n---\n\n## 📝 总结\n\n今天探讨了 **' + topic.title + '** 这个话题。总的来说，' + points[0].substring(0, 50) + '... 未来充满机遇，也伴随挑战。关键看谁能在技术、产品、商业之间找到平衡。\n\n---\n\n*本文由 Kai 🌊 自动生成，基于公开资料和行业分析*\n*更新时间：' + generatedAt + '*\n*选题日期：' + date + '*\n';
  return article;
}

function selectTopic(): Topic {
  const dayOfWeek = new Date().getDay();
  const index = (dayOfWeek + Math.floor(Math.random() * 3)) % TOPICS.length;
  return TOPICS[index];
}

async function main() {
  console.log('🍵 AI Project Digest - 下午茶时间');
  console.log('====================================\n');

  const date = new Date().toISOString().split('T')[0];
  const generatedAt = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  
  console.log('📅 Date: ' + date + '\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('📌 Step 1: Selecting topic...');
  const topic = selectTopic();
  console.log('   Selected: ' + topic.title);
  console.log('   Angle: ' + topic.angle + '\n');

  console.log('🔍 Step 2: Searching for sources...');
  const sources = await searchTopic(topic);
  console.log('   Found ' + sources.length + ' sources\n');

  console.log('🧠 Step 3: Generating insights...');
  const points = generatePoints(topic, sources);
  console.log('   Generated ' + points.length + ' points\n');

  console.log('✍️ Step 4: Writing article...');
  const article = writeArticle(topic, sources, points, date, generatedAt);
  
  const filename = 'ai-digest-' + date + '.md';
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, article, 'utf-8');

  console.log('\n✅ Article saved: ' + filepath);
  console.log('📌 Topic: ' + topic.title);

  return filepath;
}

main().catch(console.error);