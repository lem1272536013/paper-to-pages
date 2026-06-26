# 语义组件规范

当 Markdown 中出现代码围栏、短结构化文本或编辑性信息块，但内容并不是真实代码时，先按语义渲染为视觉组件，再考虑兜底为 `.code-block`。

所有组件的视觉示例见 `assets/showcase.html`。

## 目录

- 识别顺序
- 核心组件
- 可选编辑组件
- 识别函数
- 渲染护栏

## 识别顺序

按以下顺序判断围栏块：

1. `math` 围栏，或明显公式内容：`.math-block`。
2. 多行中包含独立 `↓`：`.flow-block`。
3. 每个非空行都包含 `→`：`.map-block`。
4. 三行结构，且中间行为 `VS`：`.compare-block`。
5. 每个非空行都是 `标签: 值` 或 `标签：值`：`.metric-block`。
6. 单行短结果，包含 `节省`、`减少`、`提升`、`降低`、`%`、`％` 等结果词：`.result-block`。
7. 三行以上都以 `?` 或 `？` 结尾，可带 `1.` 这类序号：`.question-block`。
8. 二到十行短文本，不含箭头、`VS` 或冒号指标：`.note-block`。
9. 只有真实源码或命令示例才使用：`.code-block`。

如果多个规则同时命中，选择更靠前的规则。尤其注意：`VS` 对比不是编号清单，冒号指标也不是普通短文本。

## 核心组件

### `.math-block`

用于公式和紧凑变量说明。

- 公式整体居中。
- 把 `\times` 显示为 `×`。
- 把 `T_s`、`C_l`、`C_c` 等变量显示为下标。
- 不要让变量反引号泄漏到页面。
- 先压缩间距或字号，再考虑允许横向裁切。
- 源文提供中文变量说明时，把公式和中文标识配套呈现。

### `.flow-block`

用于招聘、报销、合同审批、系统配置等固定纵向流程。

- 每一步渲染为圆角节点。
- 步骤之间用细线和箭头连接。
- 整组居中。
- 不要把原始 `↓` 留成纯文本。
- 流程过长时拆页，不要让组件超过页面内容高度。

### `.map-block`

用于“用户动作 -> 产品反应”这类左右映射。

- 使用左右两列，中间放小箭头。
- 左右文本保持视觉平衡。
- 不要渲染成普通居中文本行。
- 行内容较长时，优先让单元格内部换行，不要把整组缩得太小。

### `.compare-block`

用于 `A / VS / B` 对比。

- 不要编号。
- 上下两项放入居中的标签或胶囊。
- `VS` 放在中间，并配一条轻量分隔线。
- 整体保持紧凑、居中。

### `.metric-block`

用于 `标签: 值` 或 `标签：值` 指标行。

- 标签和值分离，使用居中的标签-数值布局。
- 数值可以使用弱强调色。
- 支持一到七行指标。
- 避免整组看起来偏右。
- 不要把多行指标留成代码块。

### `.result-block`

用于 `节省90%时间` 这类单行结果。

- 渲染为居中的结果胶囊或紧凑提示块。
- 强调要克制，让它像结果，不像警告。
- 普通句子没有可衡量结果时，不要使用该组件。

### `.question-block`

用于问题清单和产品判断问题。

- 无编号问题使用 `?` 标记。
- 源文有 `1.`、`2.` 等显式序号时保留。
- 每个问题独立成行。
- 不要强行把所有问题清单改成编号列表，保留作者原意。

### `.note-block`

用于短文本组。

- 只有内容确实表达顺序或步骤时才加序号。
- 简单居中陈述用干净行样式，不要伪装成流程。
- 如果内容包含箭头、`VS` 或冒号指标，先路由到更具体的组件。

### `.code-block`

只用于真实源码或命令示例。

- 保留等宽排版。
- 不要把公式、流程、映射、指标、结果、问题清单渲染成代码块。
- 普通文章输出里，`.code-block` 数量通常应为 `0`。

## 可选编辑组件

只有源文自然包含对应结构时才使用，不要为了装饰强行生成。

- `.abstract-block`：摘要，用于文章开头的内容概览，不用于普通段落。
- `.takeaway-block`：关键要点，用短标记或菱形符号，不要伪装成步骤。
- `.callout-block`：提示、注意、风险或限制，颜色要轻，除非用户要求，不要做成强警告。
- `.pullquote-block`：金句摘录，用于核心判断或值得突出的一句话。
- `.definition-block`：术语定义，例如 `TRM：时间回报模型`。
- `.timeline-block`：时间线，用于过去、现在、未来或阶段演进，不用于动作流程。
- `.level-block`：层级模型，例如 L1/L2/L3、第一层/第二层/第三层。
- `.pros-cons-block`：优缺点、机会与风险、收益与问题的双列对照。
- `.decision-block`：条件与判断结果。
- `.score-block`：高/中/低、强/弱等评价值的评分条。
- `.footnote-block`：来源、假设、口径说明等脚注。
- `.caption`：图片、表格、图示或截图说明。
- `.margin-note`：边注，只放短注释；窄版或密集页面慎用。不要让边注浮动侵入后续目录、印章、结果块等组件，必要时使用独立双栏容器或清除浮动。
- `.stamp`：轻量状态印章，例如“草稿”“示例”“已验证”。
- `.toc-block`：目录，用于长文的章节入口。

## 可选路由提示

- `摘要`、`概览`、文章开头的总述块 -> `.abstract-block`。
- `核心结论`、`关键要点` -> `.takeaway-block`。
- `注意`、`提示`、`风险`、`限制` -> `.callout-block`。
- 短的独立引用或结论句 -> `.pullquote-block`。
- 连续的 `术语：解释` -> `.definition-block`。
- `过去/现在/未来` 或阶段序列 -> `.timeline-block`。
- `第一层/第二层/第三层`、`L1/L2/L3` 或成熟度模型 -> `.level-block`。
- 成对的正反面、收益风险、机会陷阱 -> `.pros-cons-block`。
- “如果满足条件，则建议/结果为……” -> `.decision-block`。
- 数值型或等级型评价 -> `.score-block`，前提是可视化评分比纯文本更清楚。

## 识别函数

```js
const linesOf = (text) => text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
const hasStandaloneDownArrow = (text) => /(^|\n)\s*↓\s*(\n|$)/.test(text);
const isMap = (text) => linesOf(text).length >= 2 && linesOf(text).every((line) => line.includes("→"));
const isCompare = (text) => {
  const lines = linesOf(text);
  return lines.length === 3 && /^vs$/i.test(lines[1]);
};
const isMetric = (text) => {
  const lines = linesOf(text);
  return lines.length >= 1 && lines.length <= 7 && lines.every((line) => /[：:]/.test(line));
};
const isQuestion = (text) => {
  const rows = linesOf(text).map((line) => line.replace(/^\s*\d+[.、]\s*/, ""));
  return rows.length >= 3 && rows.every((line) => /[?？]$/.test(line));
};
const isResult = (text) => {
  const lines = linesOf(text);
  return lines.length === 1 && lines[0].length <= 24 && /[%％]|节省|减少|提升|降低|save|reduce|increase|decrease/i.test(lines[0]);
};
```

## 渲染护栏

- 组件高度和垂直间距尽量对齐信纸背景使用的同一个 `--line` 变量。
- 渲染后检查每个语义组件的 `scrollWidth <= clientWidth`。
- 优先使用细边框、弱底色、紧凑标签。组件属于手写风文章，不是仪表盘。
- 装饰色不要强到压过标题或正文强调。
- 组件横向溢出时，先换行、拆分或微调内部字号。
- 长组件先拆页，再考虑缩小到接近不可读的程度。
