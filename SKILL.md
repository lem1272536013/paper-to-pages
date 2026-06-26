---
name: letter-paper-html-export
description: Convert Markdown or plain text into polished A4 ruled letter-paper HTML with multi-page pagination, handwriting-style typography, lined-paper alignment, semantic visual components, optional author/date metadata, and one-PNG-per-page export. Use when Codex needs to create printable A4 stationery, ruled-paper HTML, multi-page letter-paper documents, handwriting-style article visuals, or per-page PNG images from Markdown/plain text.
---

# 信纸 HTML 导出

## 工作流程

1. 读取源 Markdown 或纯文本。保留标题、段落、列表、引用、表格、分隔线、加粗文本和代码围栏的语义。
2. 若需要解析公式、流程、映射、指标、问题清单或编辑组件，读取 [references/semantic-components.md](references/semantic-components.md)；需要视觉参照时打开 [assets/showcase.html](assets/showcase.html)。
3. 生成一个自包含 HTML 文件。页面使用重复的 `.page` 元素，每页包含 `.content` 子元素。
4. 用真实 DOM 高度分页，而不是按字数估算。只在当前页溢出时把内容块移动到下一页。
5. 在真实浏览器中验证页数、横线对齐、组件裁切和 Markdown 标记清理情况。
6. 用户需要图片时，使用 `scripts/export_pages.mjs` 将每个 `.page` 导出为单独 PNG。

## HTML 页面结构

默认页面结构：

```html
<main class="document">
  <section class="page">
    <div class="content"></div>
    <div class="page-no">01</div>
  </section>
</main>
```

基础 CSS：

```css
:root {
  --line: 7.55mm;
}

.page {
  width: 210mm;
  height: 297mm;
  overflow: hidden;
  position: relative;
  padding: 20mm 19mm 16mm 29mm;
}

.content {
  height: 100%;
  overflow: hidden;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent calc(var(--line) - 0.23mm),
    rgba(87, 129, 158, 0.26) calc(var(--line) - 0.23mm),
    rgba(87, 129, 158, 0.26) var(--line)
  );
  background-position: 0 0;
}

p, h2, .list-line, blockquote, td, th {
  line-height: var(--line);
}
```

横线背景必须画在 `.content` 上，不要画在整张 `.page` 上。标题、表格、组件块和普通段落之后，正文基线仍要落回同一套 `--line` 网格。除非只影响块内视觉且不会改变后续基线，否则垂直间距使用 `var(--line)` 的整数倍。

## Markdown 解析原则

至少处理：

- `#` / `##` 标题。
- `---` 分隔线。用户要求移除视觉分隔线时，只在仍需占位时保留空 `.separator`。
- `**bold**` 加粗，包括跨行片段。使用 `/\*\*([\s\S]+?)\*\*/g`，不要使用只能匹配单行的 `.+?`。
- 无序列表和有序列表。有序列表保留源 Markdown 序号，不要在空行后重置为 `1`。
- `>` 引用块。信纸风格中，除非用户要求引用样式，否则优先渲染为加粗文本；左侧竖线容易像多余装饰。
- Markdown 表格。转换为真实 `<table>`，但保持表格行高与行网格对齐。

解析段落时，先把同一段落内的源文本行用空格合并，再拆成显示段落。不要为了填满纸面强行重组作者原文；除非用户明确要求，否则遵循源 Markdown 的空行和段落结构。

## 语义组件路由

不要把 Markdown 代码块一律渲染为普通代码。对 `text` / `math` 围栏内容先做语义分流，再选择最合适的信纸组件。

核心识别顺序：

1. `math` 或明显公式 -> `.math-block`
2. 独立 `↓` 多行流程 -> `.flow-block`
3. 每行包含 `→` 的映射 -> `.map-block`
4. 三行且中间为 `VS` -> `.compare-block`
5. 每行都是 `标签：值` / `label: value` -> `.metric-block`
6. 单行结果短语 -> `.result-block`
7. 多行问句 -> `.question-block`
8. 2-10 行短文本清单 -> `.note-block`
9. 只有真实代码 -> `.code-block`

完整组件目录、检测 helper、适用场景和 15 个可选编辑组件都以 [references/semantic-components.md](references/semantic-components.md) 为准。修改样式或新增模板前，打开 [assets/showcase.html](assets/showcase.html) 对照类名、间距、居中方式和色彩关系；它是样式精灵图，不是最终文档模板。

## 自动加粗

当源内容是没有人工强调的纯文本时，可以添加克制的语义加粗，为信纸视觉提供阅读锚点。

- 只在整份源内容没有任何 `**bold**` 标记、作者也没有标出强调时应用。
- 每段最多一个加粗片段，跳过没有真实强调点的段落。
- 加粗核心结论或关键词，不要加粗整句、连接词、标题、列表标记、表格单元格或引用块。
- 在渲染前向 Markdown 中插入真实 `**...**` 标记，让现有加粗解析器统一处理。

## 标题与元信息

标题、作者、日期、标签、署名和页码都应弱化处理，不能抢正文视觉权重。

元信息来源优先级：

1. 用户显式提供的作者、日期、标签或署名。
2. Markdown frontmatter 或源文开头的明确元信息。
3. 用户要求自动日期时，使用当前日期。
4. 未提供作者时不要编造作者。

标题区规则：

- 标题区域使用固定高度块，高度为 `var(--line)` 的整数倍。
- 作者/日期在标题块内绝对定位，避免改变文档流。
- 不要用负 margin 处理标题元数据。
- `.byline` 用于标题下方作者/日期，居中、弱化颜色，可用 Georgia / Times 一类衬线数字字体。
- `.meta-line` + `.meta-chip` 用于正文中的来源、分类、标签等一行元信息。
- `.date-stamp` 用于需要强调的日期，像轻微印章，不要大角度旋转或重边框。
- `.signature-line` + `.signature-name` 用于落款，靠右对齐。
- `.page-no` / `.page-number` 放在页面右下角，不参与 `.content` 流式分页。

标题示例：

```css
h1 {
  height: calc(var(--line) * 4);
  margin: 0;
  line-height: calc(var(--line) * 2);
  position: relative;
  padding-top: var(--line);
}

.byline {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(var(--line) * 3);
  line-height: var(--line);
  text-align: center;
}

.page-no {
  position: absolute;
  right: 23mm;
  bottom: 9mm;
}
```

## 分页

按真实 DOM 高度分页：

1. 创建隐藏测量页。
2. 将渲染后的块节点追加到测量页 `.content`。
3. 记录 `maxHeight = measureContent.clientHeight`。
4. 重建页面并持续追加内容块。
5. 如果 `currentContent.scrollHeight > maxHeight`，移除最新块，创建新页面，再把该块追加到新页。

除非用户明确要求每页密度一致，否则不要按目标平均页高过度均衡。过早均衡会产生稀疏页面。单个语义组件超过页面可用高度时，优先拆分内容；确实不可拆时再压缩内部间距或字号。

## 表格对齐

表格使用 `border-collapse: separate` 和 `box-shadow` 模拟网格，避免普通边框累积高度导致后续基线漂移。

```css
table {
  border-collapse: separate;
  border-spacing: 0;
  line-height: var(--line);
  margin: var(--line) 0;
  outline: 1px solid rgba(37, 51, 79, 0.34);
}

tr, td, th {
  height: var(--line);
  line-height: var(--line);
}

td, th {
  border: 0;
  padding: 0 1.2mm;
  vertical-align: middle;
  box-shadow:
    inset -1px 0 rgba(37, 51, 79, 0.28),
    inset 0 -1px rgba(37, 51, 79, 0.28);
}
```

## 手写效果

不要逐字包裹 `span` 制造手写效果；中文会被异常拉开。手写质感应加在块级元素上，例如轻微 `text-shadow` 和小角度 `transform`，并保证不改变行网格。

```css
.handwritten {
  text-shadow:
    0.18px 0 rgba(37, 51, 79, 0.28),
    0 0.45px rgba(37, 51, 79, 0.08);
  transform: translateY(1.08mm) rotate(var(--turn));
}
```

## 导出页面为 PNG

HTML 稳定后，使用 `scripts/export_pages.mjs`。脚本需要 Node.js 22+，并需要本机安装 Chrome、Chromium 或 Microsoft Edge。脚本会自动查找常见浏览器路径；失败时使用 `--chrome <path>` 或设置 `CHROME_PATH`。

跨平台示例：

```bash
node /path/to/letter-paper-html-export/scripts/export_pages.mjs \
  --html /path/to/letter-paper.html \
  --out /path/to/pages \
  --clean
```

Windows PowerShell 示例：

```powershell
node .\scripts\export_pages.mjs `
  --html "C:\path\to\letter-paper.html" `
  --out "C:\path\to\pages" `
  --clean
```

常用参数：

- `--clean`：导出前删除输出目录中的旧 `page-*.png`。
- `--chrome <path>`：指定 Chrome/Chromium/Edge 可执行文件。
- `--selector <css>`：指定页面选择器，默认 `.page:not(.measure)`。
- `--wait <ms>`：截图前等待时间，复杂页面可调大。
- `--width` / `--height` / `--scale`：控制视口和输出分辨率。
- `--port <port>`：指定 DevTools 端口；默认自动选择空闲端口。

脚本通过 DevTools 协议打开浏览器，裁切每个 `.page:not(.measure)`，保存为 `page-01.png`、`page-02.png` 等文件。临时浏览器 profile 清理失败只给 warning，不应影响已经导出的图片。

## 验证清单

内容解析：

- 文本中不显示 `**`、行首 `>`、反引号等原始 Markdown 泄漏。
- 公式中不显示 `\times`、变量反引号或未处理的下划线变量。
- 纯文本自动加粗稀疏；源内容已有 `**` 时不额外加粗。

语义组件：

- 结构化代码块已经语义分流；除真实代码示例外，`.code-block` 数量应尽量为 `0`。
- 公式、流程、映射、对比、指标、结论、问题清单、短文本清单和可选编辑组件不横向裁切。
- `VS` 对比不编号；冒号指标块使用居中的标签-数值布局。

版式基线：

- 页数与源内容长度相符。
- 标题元数据、表格、引用块和组件块之后，正文仍与横线对齐。
- 作者、日期、标签、署名和页码保持弱化。
- 用户要求移除分隔线时，不残留装饰性短横线。

PNG 导出：

- 使用 `--clean` 或等效方式清理旧 `page-*.png`。
- 每张 PNG 只包含一页 A4 页面，而不是视口截图。
- 导出后核对图片数量、尺寸和页码连续性。

## 实现护栏

- 不要写死本机绝对路径；HTML 输入、图片输出、浏览器路径都来自用户参数或环境变量。
- 不要依赖临时 HTTP 服务作为最终导出方案；优先使用 `scripts/export_pages.mjs`。
- 横线背景必须对齐 `.content`。
- 标题元数据不要使用负 margin。
- 普通代码块只保留真实代码；公式、流程、映射、指标、结论、问题清单等结构化内容先做语义识别。
- 不要把 `assets/showcase.html` 当最终文档模板直接复制；正式输出仍应根据源文内容分页生成。
