# Semantic Components Reference

Use this reference when Markdown contains fenced blocks, short structured text, or editorial snippets that are not real source code. Route each block to a semantic visual component before falling back to `.code-block`.

For visual examples of all classes, open `assets/showcase.html`.

## Contents

- Detection order
- Core components
- Optional editorial components
- Recognition helpers
- Rendering guardrails

## Detection Order

Evaluate fenced blocks in this order:

1. `math` fence, or formula-like content: `.math-block`.
2. Lines containing standalone `↓`: `.flow-block`.
3. Every non-empty line contains `→`: `.map-block`.
4. Three lines where the middle line is `VS`: `.compare-block`.
5. Every non-empty line is `label: value` or `label：value`: `.metric-block`.
6. One short line containing result words such as `save`, `reduce`, `increase`, `decrease`, `节省`, `减少`, `提升`, `降低`, `%`, `％`: `.result-block`.
7. Three or more lines ending in `?` or `？`, optionally prefixed with `1.`: `.question-block`.
8. Two to ten short lines without arrows, `VS`, or metric colons: `.note-block`.
9. Real source code only: `.code-block`.

When more than one rule matches, choose the earlier rule. In particular, `VS` compare is not a numbered list, and colon metrics are not plain notes.

## Core Components

### `.math-block`

Use for formulas and compact variable definitions.

- Center the formula.
- Convert `\times` to `×`.
- Render variables like `T_s`, `C_l`, and `C_c` with subscript.
- Do not leak variable backticks into the page.
- Reduce spacing or font size before allowing horizontal clipping.
- Pair the formula with Chinese labels or variable explanations when the source provides them.

### `.flow-block`

Use for vertical fixed processes such as recruitment, reimbursement, contract approval, or setup sequences.

- Render each step as a rounded node.
- Connect steps with a thin vertical line and arrow.
- Center the whole group.
- Do not leave the original `↓` characters as plain text.
- Split long flows across pages if the component would exceed the page content height.

### `.map-block`

Use for left-right mappings such as user action -> product response.

- Use two columns with a small center arrow.
- Keep left and right labels visually balanced.
- Do not render these as centered plain text rows.
- If rows are long, allow wrapping inside each column rather than shrinking the entire block too aggressively.

### `.compare-block`

Use for `A / VS / B` comparisons.

- Do not number the lines.
- Put the top item and bottom item in centered capsules or labels.
- Put `VS` in the middle with a subtle divider line.
- Keep the block compact and centered.

### `.metric-block`

Use for `label: value` or `标签：值` rows.

- Separate label and value into a centered label-value layout.
- Values may use a muted accent color.
- Support one to seven rows.
- Avoid visual drift where the whole block looks too far right.
- Do not leave multi-line metric text as a code block.

### `.result-block`

Use for one-line results such as `节省90%时间`.

- Render as a centered pill or compact callout.
- Keep emphasis restrained; it should read as a result, not a warning.
- Do not use this for ordinary sentences with no measurable outcome.

### `.question-block`

Use for question checklists and product-evaluation prompts.

- Use `?` markers for unnumbered questions.
- Preserve explicit numeric markers when the source has `1.`, `2.`, etc.
- Put each question on its own row.
- Do not force all question lists into numbered lists; preserve the author's intent.

### `.note-block`

Use for short non-sequential text groups.

- Only add numbers when the content expresses real order or steps.
- For simple centered statements, use clean rows rather than fake process styling.
- If the content contains arrows, `VS`, or metric colons, route it to the more specific component first.

### `.code-block`

Use only for real source code or command examples.

- Preserve monospace formatting.
- Do not use code style for formulas, flows, mappings, metrics, result pills, or question lists.
- In ordinary article output, `.code-block` count should usually be `0`.

## Optional Editorial Components

Use these components when the source text naturally contains editorial structure. Do not invent them just to decorate the page.

- `.abstract-block`: compact opening summary. Use for an abstract or brief overview, not for ordinary paragraphs.
- `.takeaway-block`: key takeaways. Use diamond or short markers rather than numeric steps.
- `.callout-block`: notice, tip, warning, or risk. Keep colors light and avoid visual alarm unless the user asks.
- `.pullquote-block`: centered pull quote for a core judgment or memorable sentence.
- `.definition-block`: term-definition pairs such as `TRM: Time Return Model`.
- `.timeline-block`: stages over time. Use for past/current/future or phase evolution, not action workflows.
- `.level-block`: hierarchical levels such as L1/L2/L3 or first/second/third layer.
- `.pros-cons-block`: two-column opportunities vs risks, pros vs cons, advantages vs problems.
- `.decision-block`: condition plus recommendation/result.
- `.score-block`: visual score bar for low/medium/high or weak/strong values.
- `.footnote-block`: source, assumption, or caveat notes.
- `.caption`: image, table, or figure caption.
- `.margin-note`: short side note. Avoid on narrow layouts or dense pages.
- `.stamp`: light status mark such as draft, sample, verified.
- `.toc-block`: table of contents for long documents.

## Optional Routing Hints

- Route `摘要`, `Abstract`, or an opening overview block to `.abstract-block`.
- Route `核心结论`, `关键要点`, or `Key takeaways` to `.takeaway-block`.
- Route `注意`, `提示`, `风险`, `Warning`, or `Note` to `.callout-block`.
- Route short standalone quoted conclusions to `.pullquote-block`.
- Route repeated `term: definition` concept explanations to `.definition-block`.
- Route `过去/现在/未来` or date/phase sequences to `.timeline-block`.
- Route `第一层/第二层/第三层`, `L1/L2/L3`, or maturity models to `.level-block`.
- Route paired positive/negative sections to `.pros-cons-block`.
- Route `if condition then recommendation` structures to `.decision-block`.
- Route numeric or ordinal evaluation values to `.score-block` when a visual scale is clearer than text.

## Recognition Helpers

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

## Rendering Guardrails

- Keep component heights and vertical margins aligned to the same `--line` variable as the ruled paper background.
- After rendering, check `scrollWidth <= clientWidth` for every semantic component.
- Prefer subtle borders, muted fills, and compact labels. These components live inside a handwritten article, not a dashboard.
- Do not use decorative colors so strongly that they compete with headings or body emphasis.
- Split, wrap, or reduce internal font size when a component would overflow horizontally.
- Split long components across pages before shrinking them below readable size.
