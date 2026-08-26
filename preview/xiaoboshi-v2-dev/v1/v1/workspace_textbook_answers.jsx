// workspace_textbook_answers.jsx — 问教材：固定组织原则，动态生成回答结构
// 原则：先理解问的是哪类知识问题，再选对应的回答结构。
// 模板控制"回答质量"（先给直接答案、能溯源就给出处、结构服务理解），
// 不控制"回答长相"——用户看到的是贴合问题的自然回答，而非每次一样的固定表格。

// ── 1. 问题分类器 ──
// concept 概念解释 | reason 原因解释 | mechanism 原理机制 | compare 对比分析 | summary 归纳总结 |
// application 应用理解 | misconception 易错辨析 | thread 知识脉络 | locate 教材定位 | interpret 教材解读 |
// teach 课堂讲解 | design 教学设计启发 | exam 考法分析 | qlocate 题目知识点定位 |
// general 泛知识问答 | uncategorized 教材相关未分类 | clarify 需要澄清（14 业务类型 + 3 兜底）
function classifyQuestion(q) {
  const t = q || "";
  if (!t.trim() || /^(帮我讲讲|讲一下|说说这个|这个呢|继续|嗯|好的)$/.test(t.trim())) return "clarify";
  if (/(这|此|该|上面那)道?题|这题|本题/.test(t) && /考|知识点|对应教材|属于哪/.test(t)) return "qlocate";
  if (/在教材|在课本|在哪一?节|哪一?章|哪一?课|哪一?页|教材哪里|出现在|在书的哪/.test(t)) return "locate";
  if (/怎么考|考法|常考|高频考|题型有哪|考点有哪|怎么出题|考试.{0,4}(怎么|形式)/.test(t)) return "exam";
  if (/怎么导入|导入|教学设计|活动设计|课堂活动|情境创设|教学环节|怎么安排这节课/.test(t)) return "design";
  if (/怎么讲|怎么教|如何讲|讲清楚|给学生讲|讲解思路|怎么跟学生|怎样讲明白/.test(t)) return "teach";
  if (/编者|为什么这样(安排|编排)|教材.{0,4}(意图|目的)|这一?节.{0,4}(重点|目的|为什么)|教材解读|怎么理解这段教材/.test(t)) return "interpret";
  if (/知识脉络|知识结构|脉络|这一?章.{0,6}(知识|内容|怎么串)|整本|框架|体系|串起来|梳理.{0,4}知识/.test(t)) return "thread";
  if (/是不是|对吗|对不对|是否正确|错在哪|误区|为什么不是|不是没有|算不算|能不能说/.test(t)) return "misconception";
  if (/异同|区别|对比|相比|不同点|和.{0,8}的?不同|与.{0,8}的?区别|哪个更|谁更|有什么不一样/.test(t)) return "compare";
  if (/原理|机理|机制|工作.{0,2}原理|内部.{0,4}怎么|本质上.{0,4}(怎么|为什么)/.test(t)) return "mechanism";
  if (/为什么|为何|原因|凭什么|怎么.{0,6}(的|来的)|如何.{0,4}(产生|形成|发生|实现)|道理/.test(t)) return "reason";
  if (/(有)?哪些|作用是?什么|作用有|包括|分为|分类|归纳|总结|特点有|意义|方法有/.test(t)) return "summary";
  if (/怎么用|如何(应用|运用|使用)|应用|用在|在.{0,8}(里|中).{0,4}(怎么|如何)|解决.{0,6}问题|实际中/.test(t)) return "application";
  return "concept"; // 什么是 / 是什么 / 定义 / 含义，以及兜底
}

const TYPE_META = {
  concept: { label: "概念解释", icon: "book", hue: 210, structure: "定义 → 出处 → 要点 → 示例 → 易错" },
  reason: { label: "原因解释", icon: "spark", hue: 35, structure: "结论 → 原因链 → 情境还原 → 误区" },
  mechanism: { label: "原理机制", icon: "refresh", hue: 48, structure: "结论 → 出处 → 机制步骤 → 易错" },
  compare: { label: "对比分析", icon: "layers", hue: 265, structure: "总体区别 → 维度对比 → 易混点 → 记忆法" },
  summary: { label: "归纳总结", icon: "list", hue: 150, structure: "总括 → 分点 → 场景 → 示例" },
  application: { label: "应用理解", icon: "target", hue: 25, structure: "场景 → 知识点 → 例子 → 提醒" },
  misconception: { label: "易错辨析", icon: "alert", hue: 8, structure: "结论 → 误解vs正解 → 辨析 → 记忆法" },
  thread: { label: "知识脉络", icon: "mindmap", hue: 285, structure: "总括 → 脉络链 → 节点要点 → 提醒" },
  locate: { label: "教材定位", icon: "search", hue: 200, structure: "直答位置 → 出处 → 周边导航" },
  interpret: { label: "教材解读", icon: "book", hue: 320, structure: "编排意图 → 出处 → 重难点 → 示例" },
  teach: { label: "课堂讲解", icon: "slides", hue: 175, structure: "讲解思路 → 分步 → 课堂活动 → 提醒" },
  design: { label: "教学设计启发", icon: "spark", hue: 128, structure: "思路 → 导入/活动/小结 → 建议" },
  exam: { label: "考法分析", icon: "paper", hue: 340, structure: "总括 → 常见考法 → 题型×考点 → 易错" },
  qlocate: { label: "题目知识点定位", icon: "target", hue: 190, structure: "考点 → 对应教材 → 转题目解析" },
  general: { label: "泛知识问答", icon: "book", hue: 230, structure: "直答 → 要点 → 通用知识标注" },
  uncategorized: { label: "教材相关", icon: "quote", hue: 235, structure: "直答 → 轻引导" },
  clarify: { label: "需要澄清", icon: "alert", hue: 60, structure: "澄清问题 → 可能的意思" },
};

// ── 2. 主题识别（给回答注入贴合问题的措辞；纯演示用，非真模型）──
function topicOf(q) {
  const t = q || "";
  const KNOWN = [
    { re: /光反应|暗反应|光合作用/, key: "photosynthesis" },
    { re: /有丝分裂|减数分裂/, key: "mitosis" },
    { re: /三角函数/, key: "trig" },
    { re: /电磁感应|法拉第/, key: "faraday" },
    { re: /噬菌体/, key: "phage" },
    { re: /环境描写/, key: "scenery" },
  ];
  const hit = KNOWN.find((k) => k.re.test(t));
  // 抽取一个"名词主体"用于兜底措辞
  const subject = (t.match(/《([^》]+)》/) || [])[1] ||
    (t.replace(/[?？。，,、]/g, "").replace(/^(什么是|请问|老师|为什么|怎么|如何|有哪些|说说|讲讲|解释一下|介绍一下)/, "").replace(/(是什么|的区别|的异同|有哪些|是怎么.*|怎么用|的作用|的原因|的意义).*$/, "").trim()) ||
    "这个知识点";
  return { key: hit ? hit.key : null, subject };
}

// ── 3. 回答生成器：根据"类型 + 主题"产出结构化回答 ──
// 每个回答 = { type, basis, blocks:[...], follow:[...], citations:[...] }
// block.kind: answer/source/points/chain/table/example/pitfall/scene

// 依据类型（透明原则：指定 / 多本 / 上传 是有据可港的“结论”；候选 / 通用 必须明示不确定性）
function tbBasis(book, q) {
  if (/上传的材料|上传的教材|上传的页|这页|这张图|截图|这幅图/.test(q || "")) return { type: "uploaded", grounded: true, label: "根据你上传的教材页整理" };
  if (book && book.multi) return { type: "multi", grounded: true, label: `已对照 ${book.list.length} 本教材内容，分别标注出处` };
  if (book && book.free) return { type: "candidate", grounded: false, label: "可能关联教材内容。选择具体版本后可获得更贴合课本的解释" };
  if (book && book.edition) return { type: "specified", grounded: true, label: `基于：${book.edition} ${book.subject || ""}${book.name ? " · " + book.name : ""}`.trim() };
  return { type: "general", grounded: false, label: "当前按通用学科知识回答。选择教材后可获得更贴合课本的解释" };
}

function buildTbAnswer(q, book) {
  const ans = buildTbAnswerCore(q, book);
  ans.basis = tbBasis(book, q);
  // 候选 / 通用 不能声称教材出处：把引用重标为“可能关联”，不作为原文依据
  if (!ans.basis.grounded && ans.citations) {
    ans.citations = ans.citations.map((c) => ({ ...c, candidate: true }));
  }
  ans.card = buildKnowledgeCard(ans, q);
  return ans;
}

// ── 知识卡片：把当前回答二次加工成一张可嵌课件 / 供复习的紧凑卡片（继承回答依据）──
// 卡片结构随问题类型变化，但都从回答 blocks 里提炼，保证“卡片 = 该回答的浓缩”。
function buildKnowledgeCard(ans, q) {
  const meta = TYPE_META[ans.type] || TYPE_META.concept;
  const blocks = ans.blocks || [];
  const find = (k) => blocks.find((b) => b.kind === k);
  const subject = (q && (q.match(/《([^》]+)》/) || [])[1]) ||
    (q ? q.replace(/[?？。，,、]/g, "").replace(/^(什么是|请问|老师|为什么|怎么|如何|有哪些|说说|讲讲|解释一下|介绍一下)/, "").replace(/(是什么|的区别|的异同|有哪些|是怎么.*|怎么用|的作用|的原因|的意义|怎么讲|考什么).*$/, "").trim() : "") || "本知识点";
  const sections = [];
  const ansBlock = find("answer");
  // body sections by block kind (type-driven layout)
  const tbl = find("table");
  const chain = find("chain");
  const points = find("points");
  const note = find("note");
  const pit = find("pitfall");
  if (tbl) sections.push({ kind: "table", cols: tbl.cols, colHues: tbl.colHues, rows: tbl.rows });
  if (chain) sections.push({ kind: "steps", title: chain.title || "关键步骤", items: chain.steps });
  if (points) sections.push({ kind: "list", title: points.title || "要点", items: points.items.map((it) => (it.label && !points.ordered ? `${it.label}：${it.text}` : it.text)) });
  if (!tbl && !chain && !points) {
    const ex = find("example") || find("scene");
    if (ex) sections.push({ kind: "list", title: "要点", items: ex.items ? ex.items : [ex.text] });
  }
  const memo = (note && note.text) || (pit && pit.items && ("易错：" + pit.items[0])) || null;
  return {
    title: subject,
    typeLabel: meta.label,
    icon: meta.icon,
    hue: meta.hue,
    summary: ansBlock ? ansBlock.text : "",
    sections,
    memo,
    basisLabel: (ans.basis && ans.basis.label) || "",
    grounded: !(ans.basis && ans.basis.grounded === false),
  };
}

function buildTbAnswerCore(q, book) {
  const type = classifyQuestion(q);
  const { key, subject } = topicOf(q);
  const A = window.AIDATA.TEXTBOOK_ANSWER;
  const src = book && book.edition ? `${book.edition} ${book.subject || ""}`.trim() : "人教版教材";

  // —— 精修样例：光反应 vs 暗反应（对比型，复用权威数据）——
  if (key === "photosynthesis" && type === "compare") {
    return {
      type: "compare",
      blocks: [
        { kind: "answer", text: A.summary },
        { kind: "table", cols: ["光反应", "暗反应"], colHues: [200, 145], rows: A.points.map((p) => ({ label: p.label, a: p.light, b: p.dark })) },
        { kind: "pitfall", title: "易混点", items: ["暗反应≠在黑暗中进行，有光无光均可，名字只是相对光反应而言。", "ATP 和 [H] 是两阶段的「纽带」，光反应供给、暗反应消耗，停光后很快耗尽。"] },
        { kind: "note", text: "记忆法：光反应「见光、放氧、产能」，暗反应「固碳、还原、耗能」。" },
      ],
      follow: ["举个例子", "生成对比导图", "生成知识卡片", "出几道练习题"],
      citations: A.citations,
    };
  }

  // —— 三角函数（概念解释型·数学）——
  if (key === "trig" && type === "concept") {
    return {
      type: "concept",
      blocks: [
        { kind: "answer", text: "三角函数是以角为自变量、以单位圆上点的坐标（或其比值）为函数值的一类函数。最基本的是正弦、余弦、正切：把角放到平面直角坐标系里，终边与单位圆交于点 P(x, y)，则 sinα=y，cosα=x，tanα=y/x。" },
        { kind: "source", source: "人教A版 · 数学 必修第一册", loc: "第5章 三角函数 · 5.1–5.2" },
        { kind: "points", title: "核心要点", items: [
          { label: "任意角", text: "角从锐角推广到任意大小的正角、负角和零角，用终边旋转刻画。" },
          { label: "弧度制", text: "用弧长与半径之比度量角，π rad = 180°，便于与实数一一对应。" },
          { label: "单位圆定义", text: "在单位圆上用终边交点坐标定义 sin、cos，正切为两者之比。" },
        ] },
        { kind: "example", text: "例：α=π/6 时终边交单位圆于 (√3/2, 1/2)，故 sin(π/6)=1/2、cos(π/6)=√3/2、tan(π/6)=√3/3。" },
        { kind: "pitfall", title: "易错点", items: ["弧度与角度混用：sin30 与 sin(π/6) 含义不同，注意单位。", "正切在 α=π/2+kπ 处无定义（cos=0）。"] },
      ],
      follow: ["展开讲诱导公式", "生成知识卡片", "查看相关资源"],
      citations: [
        { id: "t1", source: "人教A版 · 数学 必修第一册", loc: "5.1 任意角和弧度制 · P172", quote: "一般地，我们规定：一条射线绕它的端点按逆时针方向旋转所形成的角叫做正角。" },
        { id: "t2", source: "人教A版 · 数学 必修第一册", loc: "5.2 三角函数的概念 · P179", quote: "设 α 是一个任意角，它的终边与单位圆交于点 P(x, y)，那么 y 叫做 α 的正弦。" },
      ],
    };
  }

  // —— 电磁感应 / 为什么产生感应电流（原因解释型·物理）——
  if (key === "faraday" && type === "reason") {
    return {
      type: "reason",
      blocks: [
        { kind: "answer", text: "直接结论：只要穿过闭合回路的磁通量发生变化，回路里就会产生感应电动势；回路闭合时即有感应电流。变化是根本原因——磁场强弱、面积、夹角任一改变都算。" },
        { kind: "source", source: "人教版 · 物理 选择性必修2", loc: "第2章 电磁感应 · 2.1–2.2" },
        { kind: "chain", title: "原因链条", steps: [
          "磁通量 Φ=B·S·cosθ 发生变化（B、S 或 θ 任一改变）。",
          "由法拉第电磁感应定律，感应电动势 E=n·ΔΦ/Δt，与磁通量变化率成正比。",
          "回路闭合则由 E 驱动产生感应电流，方向由楞次定律判定（阻碍磁通量的变化）。",
        ] },
        { kind: "scene", title: "情境还原", items: ["条形磁铁插入线圈：插入与拔出时磁通量变化方向相反，故电流方向相反；停在中间不动则无电流。"] },
        { kind: "pitfall", title: "常见误区", items: ["「有磁通量」不等于「有感应电流」，关键是磁通量在“变化”。", "楞次定律是“阻碍变化”，不是“阻碍磁通量本身”。"] },
      ],
      follow: ["讲讲楞次定律", "生成知识卡片", "出几道练习题"],
      citations: [
        { id: "f1", source: "人教版 · 物理 选择性必修2", loc: "2.2 法拉第电磁感应定律 · P21", quote: "电路中感应电动势的大小，跟穿过这一电路的磁通量的变化率成正比。" },
        { id: "f2", source: "人教版 · 物理 选择性必修2", loc: "2.1 楞次定律 · P15", quote: "感应电流的方向，总是要阻碍引起感应电流的磁通量的变化。" },
      ],
    };
  }

  // —— 环境描写的作用（归纳总结型·语文）——
  if (key === "scenery" && type === "summary") {
    return {
      type: "summary",
      blocks: [
        { kind: "answer", text: "环境描写包括自然环境和社会环境描写，在记叙文 / 小说里主要承担以下作用，答题时按“点—析”逐条对应即可：" },
        { kind: "source", source: "统编版 · 语文 九年级上册", loc: "第四单元 小说 · 单元导读" },
        { kind: "points", title: "分点归纳", ordered: true, items: [
          { label: "一", text: "交代背景：点明时间、地点、季节、社会环境，为故事提供舞台。" },
          { label: "二", text: "渲染气氛：用景物色调奠定情感基调（如阴沉、肃杀、欢快）。" },
          { label: "三", text: "烘托人物：以景衡情，表现人物心理与性格。" },
          { label: "四", text: "推动情节：环境变化引出或转折情节，作铺垫、埋伏笔。" },
          { label: "五", text: "深化主旨：借环境寄寓象征意义，升华主题。" },
        ] },
        { kind: "scene", title: "使用场景", items: ["遇到“分析画线句环境描写的作用”，先判断自然 / 社会环境，再从上面五点里选贴合的 2–3 点结合原文分析。"] },
        { kind: "example", text: "示例：《故乡》开篇“苍黄的天底下，远近横着几个萧索的荒村”——渲染了萧条气氛，烘托“我”悲凉的心情，并为下文故乡的衰败作铺垫。" },
      ],
      follow: ["配一个答题模板", "生成知识卡片", "查看相关资源"],
      citations: [
        { id: "s1", source: "统编版 · 语文 九年级上册", loc: "第四单元 单元导读 · P78", quote: "小说常常通过环境描写来交代背景、渲染气氛、烘托人物形象。" },
        { id: "s2", source: "统编版 · 语文 九年级上册", loc: "《故乡》鲁迅 · P82", quote: "时候既然是深冬；苍黄的天底下，远近横着几个萧索的荒村，没有一些活气。" },
      ],
    };
  }

  // —— 通用模板（按类型生成贴合问题的自然回答）——
  const cite = (loc, quote) => ({ id: "c" + Math.random().toString(36).slice(2, 7), source: src || "教材", loc, quote });
  const defaultCites = [
    cite("教材正文 · 本节", `教材在介绍「${subject}」时给出了定义与典型例证，可作为作答依据。`),
  ];

  if (type === "concept") {
    return {
      type,
      blocks: [
        { kind: "answer", text: `${subject}是本节的核心概念——一句话说，它指的是教材中所界定的、用来刻画对应现象/对象的基本规定。` },
        { kind: "source", source: src, loc: "本节正文 · 概念定义处" },
        { kind: "points", title: "核心要点", items: [
          { label: "内涵", text: `${subject}的本质特征是什么——抓住定义里的关键限定词。` },
          { label: "外延", text: "它适用的范围与不适用的情形，避免以偏概全。" },
          { label: "联系", text: "与前后知识点的关系，理解它在知识体系中的位置。" },
        ] },
        { kind: "example", text: `举个例子：在典型情境中，${subject}表现为……（结合教材例题即可直观理解）。` },
        { kind: "pitfall", title: "易错点", items: [`容易把${subject}与相近概念混淆，注意定义里的限定条件。`] },
      ],
      follow: ["展开解释", "举个例子", "生成知识卡片", "查看相关资源"],
      citations: defaultCites,
    };
  }
  if (type === "reason") {
    return {
      type,
      blocks: [
        { kind: "answer", text: `直接结论：之所以如此，根本原因在于${subject}背后的核心机制在起作用。` },
        { kind: "chain", title: "原因链条", steps: [
          "前提条件具备 —— 相关因素满足触发的基础。",
          "关键环节发生 —— 核心机制按规律推进。",
          "因此导致结果 —— 由机制必然推出所观察到的现象。",
        ] },
        { kind: "scene", title: "情境还原", items: ["把过程放回教材给出的实验/情境里，逐步对照每一环，结论就自然成立。"] },
        { kind: "pitfall", title: "常见误区", items: ["不要把「相关」当成「因果」，注意区分必要条件与充分条件。"] },
      ],
      follow: ["展开原因链", "还原实验过程", "出一道辨析题"],
      citations: defaultCites,
    };
  }
  if (type === "compare") {
    return {
      type,
      blocks: [
        { kind: "answer", text: `总体区别：两者在关键维度上各有侧重，下面按维度逐项对照最清楚。` },
        { kind: "table", cols: ["前者", "后者"], colHues: [200, 25], rows: [
          { label: "本质", a: "侧重点一", b: "侧重点二" },
          { label: "条件", a: "适用情形 A", b: "适用情形 B" },
          { label: "结果", a: "对应表现 A", b: "对应表现 B" },
        ] },
        { kind: "pitfall", title: "易混点", items: ["两者最容易被混淆的是……抓住本质维度即可区分。"] },
        { kind: "note", text: "记忆法：用一句口诀把两者的关键差异串起来，考试时不易记反。" },
      ],
      follow: ["举例说明", "生成对比导图", "出几道练习题"],
      citations: defaultCites,
    };
  }
  if (type === "summary") {
    return {
      type,
      blocks: [
        { kind: "answer", text: `总括来说，${subject}主要可以归纳为以下几个方面：` },
        { kind: "points", title: "分点归纳", ordered: true, items: [
          { label: "一", text: "第一方面 —— 最主要、最常考的一点。" },
          { label: "二", text: "第二方面 —— 与第一点并列或递进。" },
          { label: "三", text: "第三方面 —— 容易被忽略但同样重要。" },
        ] },
        { kind: "scene", title: "使用场景", items: ["答这类题时，先判断属于哪一类，再套用对应要点，做到不漏点。"] },
        { kind: "example", text: "示例：结合一段具体材料，逐条对应上面的归纳点即可形成完整答案。" },
      ],
      follow: ["每点展开", "生成知识卡片", "查看相关资源"],
      citations: defaultCites,
    };
  }
  if (type === "mechanism") {
    return {
      type,
      blocks: [
        { kind: "answer", text: `直接结论：${subject}的工作原理，核心是把“输入”按特定机制一步步转化为“输出”，下面把内部机制拆开看。` },
        { kind: "source", source: src, loc: "本节正文 · 原理阐述处" },
        { kind: "chain", title: "机制步骤", steps: [
          "起点：系统从初始状态接收驱动条件。",
          "核心转化：关键结构/反应按规律推进，是机制的“引擎”。",
          "输出：转化累积，表现为可观察的最终结果。",
        ] },
        { kind: "note", text: `一句话抓住机制：${subject} = 条件 → 核心转化 → 结果，三段缺一不可。` },
        { kind: "pitfall", title: "易错点", items: ["把“现象”当“原理”——原理要讲清“为什么会这样转化”，而非只描述结果。"] },
      ],
      follow: ["每步展开", "生成知识卡片", "出几道练习题"],
      citations: defaultCites,
    };
  }
  if (type === "misconception") {
    return {
      type,
      blocks: [
        { kind: "answer", text: `这是一个常见误区。关于「${subject}」，先给结论：常见说法里藏着一个想当然的错误，下面把误解和正解对照清楚。` },
        { kind: "table", cols: ["常见误解", "正确理解"], colHues: [8, 150], rows: [
          { label: "说法", a: "凭直觉得到的错误结论", b: "教材依据下的正确结论" },
          { label: "为什么", a: "忽略了关键限定条件", b: "扣住定义里的限定才成立" },
        ] },
        { kind: "pitfall", title: "辨析要点", items: [`判断「${subject}」类说法时，先回到教材定义，逐字核对限定条件再下结论。`] },
        { kind: "note", text: "记忆法：把“想当然”的那一步标红，考试时遇到先停一秒核对前提。" },
      ],
      follow: ["再举一个易错例", "生成知识卡片", "出一道辨析题"],
      citations: defaultCites,
    };
  }
  if (type === "thread") {
    return {
      type,
      blocks: [
        { kind: "answer", text: `总括来说，「${subject}」这条线索可以串成一条由浅入深的知识脉络，理清主干就不容易乱。` },
        { kind: "chain", title: "知识脉络", steps: [
          "起点概念：本章/本主题的基础定义与对象。",
          "展开主干：在基础上推导出的核心规律与方法。",
          "延伸应用：把规律用于解决问题、与其他章节衔接。",
        ] },
        { kind: "points", title: "节点要点", items: [
          { label: "主干", text: "抓住贯穿全章的那条主线，其余都是它的展开。" },
          { label: "衔接", text: "留意与前后章节的承接点，便于整体复习。" },
        ] },
        { kind: "note", text: "建议把这条脉络画成一张导图，复习时按主干回忆分支。" },
      ],
      follow: ["生成知识导图", "生成知识卡片", "查看相关资源"],
      citations: defaultCites,
    };
  }
  if (type === "locate") {
    return {
      type,
      blocks: [
        { kind: "answer", text: `「${subject}」在教材里的位置如下，直接定位到对应章节即可。` },
        { kind: "source", source: src, loc: "对应章节 · 见下方导航" },
        { kind: "points", title: "位置导航", items: [
          { label: "所在章", text: "本知识点归属的章/单元。" },
          { label: "所在节", text: "具体到小节标题，方便翻书。" },
          { label: "页码", text: "正文起始页与配套例题页（右侧可查原文）。" },
        ] },
        { kind: "note", text: "需要的话，我可以直接打开这一节的教材原文扫描页给你看。" },
      ],
      follow: ["打开教材原文", "讲讲这一节", "查看相关资源"],
      citations: defaultCites,
    };
  }
  if (type === "interpret") {
    return {
      type,
      blocks: [
        { kind: "answer", text: `从编排意图看，教材这样安排「${subject}」是有用意的：先铺垫认知基础，再引出核心，符合学生的认知顺序。` },
        { kind: "source", source: src, loc: "本节 · 编写说明 / 单元导读" },
        { kind: "points", title: "重难点与意图", items: [
          { label: "重点", text: "编者着力强调的核心内容，是教学的落脚点。" },
          { label: "难点", text: "学生最容易卡住的地方，需要额外铺垫。" },
          { label: "编排意图", text: "为什么放在这个位置、与前后内容如何呼应。" },
        ] },
        { kind: "example", text: "示例：本节先给情境再给定义，意图是让学生“先感受、后抽象”，降低理解门槛。" },
      ],
      follow: ["怎么讲这节", "生成知识卡片", "查看相关资源"],
      citations: defaultCites,
    };
  }
  if (type === "teach") {
    return {
      type,
      blocks: [
        { kind: "answer", text: `给学生讲「${subject}」，建议按“由具体到抽象、由扶到放”的思路展开，下面是一条可直接用的讲解线。` },
        { kind: "points", title: "讲解分步", ordered: true, items: [
          { label: "一", text: "情境引入：用贴近生活的例子唤起已有经验。" },
          { label: "二", text: "抽象建构：从例子提炼出概念/规律，板书关键定义。" },
          { label: "三", text: "巩固运用：一道典型例题边讲边练，暴露并纠正易错。" },
        ] },
        { kind: "scene", title: "课堂活动", items: ["可设计一次小组讨论或动手验证，让学生自己得出结论，比直接给答案印象更深。"] },
        { kind: "note", text: "提醒：讲完留一道变式题当堂检测，及时发现没听懂的学生。" },
      ],
      follow: ["给一份教学设计", "生成知识卡片", "出几道练习题"],
      citations: defaultCites,
    };
  }
  if (type === "design") {
    return {
      type,
      blocks: [
        { kind: "answer", text: `围绕「${subject}」做教学设计，可以从导入、活动、小结三段来搭，下面给一套可直接改用的启发。` },
        { kind: "points", title: "环节建议", ordered: true, items: [
          { label: "导入", text: "用一个真实问题或冲突情境制造悬念，激发探究欲。" },
          { label: "活动", text: "设计探究/合作任务，让学生在动手中建构理解。" },
          { label: "小结", text: "引导学生自己归纳，教师补充提炼，形成知识结构。" },
        ] },
        { kind: "scene", title: "情境创设", items: ["情境要贴合学情，最好能延续到课后作业，形成“课上探究—课后应用”的闭环。"] },
        { kind: "note", text: "需要完整教案的话，我可以把这套思路交给「写教案」帮你成稿。" },
      ],
      follow: ["生成完整教案", "生成知识卡片", "查看相关资源"],
      citations: defaultCites,
    };
  }
  if (type === "exam") {
    return {
      type,
      blocks: [
        { kind: "answer", text: `「${subject}」在考试里有几种常见考法，摸清题型与对应考点，复习就有的放矢。` },
        { kind: "points", title: "常见考法", items: [
          { label: "直接考", text: "考定义/性质的再认与简单运用。" },
          { label: "综合考", text: "与其他知识点结合，出在中档大题里。" },
        ] },
        { kind: "table", cols: ["题型", "侧重考点"], colHues: [340, 200], rows: [
          { label: "选择/填空", a: "基础概念辨析", b: "扣定义、易错点" },
          { label: "解答题", a: "综合运用与推理", b: "过程规范、步骤分" },
        ] },
        { kind: "pitfall", title: "易错提醒", items: ["综合题里本知识点常作为“隐藏考点”出现，审题时要敏感。"] },
      ],
      follow: ["按考法出一份卷子", "生成知识卡片", "查看相关资源"],
      citations: defaultCites,
    };
  }
  if (type === "qlocate") {
    return {
      type,
      blocks: [
        { kind: "answer", text: `这道题主要考查「${subject}」相关的知识点。我先帮你定位它在教材里的依据，至于具体解法可以转「题目解析」。` },
        { kind: "points", title: "涉及考点", items: [
          { label: "核心考点", text: `题目落脚在「${subject}」的理解与运用上。` },
          { label: "关联点", text: "可能还牵涉前置概念，作答时需一并回顾。" },
        ] },
        { kind: "source", source: src, loc: "对应章节 · 概念与例题处" },
        { kind: "note", text: "想要这道题的完整答案和解题步骤，可以让我转到「题目解析」来逐步讲解。" },
      ],
      follow: ["讲讲这道题怎么做", "讲清这个知识点", "查看相关资源"],
      citations: defaultCites,
    };
  }
  if (type === "general") {
    return {
      type,
      blocks: [
        { kind: "answer", text: `关于「${subject}」，先给一个直接回答：（按通用学科知识作答，未绑定具体教材版本）。` },
        { kind: "points", title: "要点", items: [
          { label: "是什么", text: "用一句话概括其含义。" },
          { label: "关键", text: "理解时最该抓住的一点。" },
        ] },
        { kind: "note", text: "如果你告诉我具体教材版本，我可以给出更贴合课本的解释与出处。" },
      ],
      follow: ["选择教材再问", "展开解释", "查看相关资源"],
      citations: defaultCites,
    };
  }
  if (type === "clarify") {
    return {
      type,
      blocks: [
        { kind: "answer", text: "我还没太确定你想问的是哪方面，能补充一下吗？比如学科、具体知识点，或把题目/教材页发给我。" },
        { kind: "scene", title: "你可能想问", items: ["某个概念是什么、为什么会这样、两个概念的区别，或这道题考什么知识点——告诉我一个方向即可。"] },
      ],
      follow: [],
      citations: [],
    };
  }
  if (type === "uncategorized") {
    return {
      type,
      blocks: [
        { kind: "answer", text: `关于「${subject}」，我先按教材相关内容给你一个回答；如果方向不对，告诉我更具体的点，我再聚焦。` },
        { kind: "note", text: "可以补充学科、章节或把相关页面发给我，我能答得更准。" },
      ],
      follow: ["展开解释", "选择教材再问", "查看相关资源"],
      citations: defaultCites,
    };
  }
  // application
  return {
    type,
    blocks: [
      { kind: "answer", text: `应用场景：${subject}常用于解决以下这类实际问题。` },
      { kind: "points", title: "对应知识点", items: [
        { label: "用到", text: "解决问题时会调用的核心概念与公式/规律。" },
        { label: "怎么套", text: "把实际情境抽象成模型，再代入对应方法。" },
      ] },
      { kind: "example", text: "例子：给定一个真实情境，一步步把它转化为可计算/可分析的形式并求解。" },
      { kind: "pitfall", title: "易错提醒", items: ["注意单位、范围与适用条件，建模时别丢掉关键约束。"] },
    ],
    follow: ["给个完整例题", "讲讲建模思路", "出几道练习题"],
    citations: defaultCites,
  };
}

// ── 4. 回答渲染器：按 block 类型渲染，长相随问题而变 ──
function TbAnsBlocks({ blocks, CiteMark }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {blocks.map((b, i) => {
        if (b.kind === "answer") {
          return (
            <p key={i} style={{ margin: 0, fontSize: 14.5, lineHeight: 1.72, color: "var(--ink)", fontWeight: 500 }}>
              {b.text}
              {CiteMark && <CiteMark id="c1" n="1" />}
            </p>
          );
        }
        if (b.kind === "source") {
          return (
            <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 7, alignSelf: "flex-start", padding: "5px 11px", borderRadius: 9, background: "var(--auth-bg)", border: "1px solid var(--auth-border)", fontSize: 12, fontWeight: 700, color: "var(--auth-ink)" }}>
              <Icon name="shield" size={13} /> 依据 {b.source} · {b.loc}
            </div>
          );
        }
        if (b.kind === "points") {
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {b.title && <SecLabel icon="list">{b.title}</SecLabel>}
              {b.items.map((it, j) => (
                <div key={j} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ flexShrink: 0, minWidth: 22, height: 22, padding: "0 7px", borderRadius: 7, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", color: "var(--brand-deep)", fontSize: 11.5, fontWeight: 800, display: "inline-grid", placeItems: "center", marginTop: 1 }}>{b.ordered ? j + 1 : it.label}</span>
                  <p style={{ margin: 0, flex: 1, fontSize: 13.5, lineHeight: 1.7, color: "var(--ink)" }}>
                    {!b.ordered && <b style={{ color: "var(--ink)" }}>{it.label}：</b>}{it.text}
                  </p>
                </div>
              ))}
            </div>
          );
        }
        if (b.kind === "chain") {
          return (
            <div key={i}>
              {b.title && <SecLabel icon="spark">{b.title}</SecLabel>}
              <div style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: 8 }}>
                {b.steps.map((s, j) => (
                  <div key={j} style={{ display: "flex", gap: 11, alignItems: "stretch" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                      <span style={{ width: 24, height: 24, borderRadius: 999, background: "var(--brand-grad)", backgroundColor: "var(--brand)", color: "#fff", fontSize: 12, fontWeight: 800, display: "grid", placeItems: "center", fontFamily: "var(--font-num)" }}>{j + 1}</span>
                      {j < b.steps.length - 1 && <span style={{ flex: 1, width: 2, background: "var(--brand-soft-border)", minHeight: 14 }} />}
                    </div>
                    <p style={{ margin: 0, paddingBottom: j < b.steps.length - 1 ? 14 : 0, fontSize: 13.5, lineHeight: 1.65, color: "var(--ink)", flex: 1 }}>{s}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        if (b.kind === "table") {
          return (
            <div key={i} style={{ border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "78px 1fr 1fr", background: "var(--surface-2)", fontSize: 12.5, fontWeight: 800, color: "var(--ink-2)" }}>
                <div style={{ padding: "9px 12px" }}>维度</div>
                <div style={{ padding: "9px 12px", borderLeft: "1px solid var(--line)", color: `oklch(0.5 0.13 ${b.colHues ? b.colHues[0] : 200})` }}>{b.cols[0]}</div>
                <div style={{ padding: "9px 12px", borderLeft: "1px solid var(--line)", color: `oklch(0.52 0.12 ${b.colHues ? b.colHues[1] : 145})` }}>{b.cols[1]}</div>
              </div>
              {b.rows.map((r, j) => (
                <div key={j} style={{ display: "grid", gridTemplateColumns: "78px 1fr 1fr", fontSize: 12.5, lineHeight: 1.55, borderTop: "1px solid var(--line)" }}>
                  <div style={{ padding: "10px 12px", fontWeight: 700, color: "var(--ink-2)", background: "var(--surface-2)" }}>{r.label}</div>
                  <div style={{ padding: "10px 12px", borderLeft: "1px solid var(--line)", color: "var(--ink)" }}>{r.a}</div>
                  <div style={{ padding: "10px 12px", borderLeft: "1px solid var(--line)", color: "var(--ink)" }}>{r.b}</div>
                </div>
              ))}
            </div>
          );
        }
        if (b.kind === "example") {
          return (
            <div key={i} style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--line)" }}>
              <span style={{ flexShrink: 0, color: "var(--brand-deep)", marginTop: 1 }}><Icon name="spark" size={16} /></span>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: "var(--ink-2)" }}>{b.text}</p>
            </div>
          );
        }
        if (b.kind === "scene") {
          return (
            <div key={i}>
              {b.title && <SecLabel icon="target">{b.title}</SecLabel>}
              <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
                {b.items.map((s, j) => (
                  <p key={j} style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: "var(--ink-2)" }}>{s}</p>
                ))}
              </div>
            </div>
          );
        }
        if (b.kind === "pitfall") {
          return (
            <div key={i} style={{ borderRadius: 12, background: "oklch(0.97 0.025 60)", border: "1px solid oklch(0.88 0.06 60)", padding: "11px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: "oklch(0.5 0.12 55)", marginBottom: 6 }}>
                <Icon name="alert" size={13} /> {b.title || "易错点"}
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
                {b.items.map((s, j) => <li key={j} style={{ fontSize: 12.5, lineHeight: 1.65, color: "var(--ink-2)" }}>{s}</li>)}
              </ul>
            </div>
          );
        }
        if (b.kind === "note") {
          return (
            <div key={i} style={{ display: "flex", gap: 9, alignItems: "center", padding: "10px 13px", borderRadius: 10, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)" }}>
              <Icon name="spark" size={15} />
              <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: "var(--brand-deep)", lineHeight: 1.6 }}>{b.text}</p>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

function SecLabel({ icon, children }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 800, color: "var(--ink-2)" }}>
      <Icon name={icon} size={14} /> {children}
    </div>
  );
}

// 完整回答气泡（替代旧的写死 AnswerBlock）
function DynamicAnswer({ ans, activeCite, setActiveCite, onFollow, grouped }) {
  const meta = TYPE_META[ans.type] || TYPE_META.concept;
  const CiteMark = ({ id, n }) => (
    <sup onMouseEnter={() => setActiveCite(id)} onMouseLeave={() => setActiveCite(null)}
      style={{ cursor: "pointer", fontSize: 10, fontWeight: 800, color: "#fff", background: activeCite === id ? "var(--accent)" : "var(--brand)", borderRadius: 5, padding: "1px 5px", margin: "0 2px", fontFamily: "var(--font-num)", transition: "background .15s", verticalAlign: "super" }}>{n}</sup>
  );
  return (
    <div className="ans-pop" style={{ display: "flex", gap: 11, alignItems: "flex-start", marginTop: grouped ? -8 : 0 }}>
      {grouped ? <div style={{ width: 30, flexShrink: 0 }} /> : <BotAvatar size={30} glow />}
      <div style={{ flex: 1, minWidth: 0, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "4px 16px 16px 16px", padding: "16px 18px", boxShadow: "0 8px 26px -20px rgba(0,0,0,.3)" }}>
        {/* 回答类型标识 — 让用户看到"系统理解了这是哪类问题" */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 999, background: `oklch(0.96 0.03 ${meta.hue})`, border: `1px solid oklch(0.88 0.06 ${meta.hue})`, color: `oklch(0.45 0.12 ${meta.hue})`, fontSize: 11, fontWeight: 800, marginBottom: 12 }}>
          <Icon name={meta.icon} size={12} /> {meta.label}
        </div>
        <TbAnsBlocks blocks={ans.blocks} CiteMark={CiteMark} />
        {/* 依据条 — 区分 指定/多本/上传（有据可溯）与 候选/通用（明示不确定性） */}
        {(() => {
          const basis = ans.basis || { type: "specified", grounded: true, label: "" };
          if (basis.grounded) {
            return (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 999, background: "var(--auth-bg)", border: "1px solid var(--auth-border)", fontSize: 11.5, color: "var(--auth-ink)", fontWeight: 700 }}>
                  <Icon name="shield" size={13} /> {basis.label}
                </span>
                <span style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600 }}>· {ans.citations.length} 处引用，右侧可查原文</span>
              </div>
            );
          }
          // 候选 / 通用：黄色信息条，不声称教材原文
          return (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "9px 12px", borderRadius: 10, background: "oklch(0.97 0.025 70)", border: "1px solid oklch(0.88 0.06 70)" }}>
                <span style={{ flexShrink: 0, color: "oklch(0.55 0.12 65)", marginTop: 1 }}><Icon name="alert" size={14} /></span>
                <span style={{ fontSize: 12, color: "oklch(0.42 0.07 60)", fontWeight: 600, lineHeight: 1.55 }}>{basis.label}</span>
              </div>
            </div>
          );
        })()}
        {/* 后续动作 — 控制默认长度，把"展开/举例/讲义版"交给用户 */}
        {ans.follow && ans.follow.length > 0 && (
          <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ans.follow.map((f, i) => (
              <button key={i} onClick={() => onFollow && onFollow(f, ans)} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 13px", borderRadius: 999, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", transition: "all .15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.color = "var(--brand-deep)"; e.currentTarget.style.background = "var(--brand-soft)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--ink-2)"; e.currentTarget.style.background = "var(--surface)"; }}>
                <Icon name={f.includes("导图") ? "mindmap" : f.includes("练习") || f.includes("题") ? "paper" : f.includes("例") ? "spark" : "plus"} size={13} /> {f}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { classifyQuestion, buildTbAnswer, buildTbFollow, buildKnowledgeCard, DynamicAnswer, TYPE_META, FrozenTbAnswer, FrozenTbCompare });

// ── 后续动作的"上下文回答"（继承当前回答，不重新发散）──
// 举例 / 展开 等留在问教材内的二次加工：必须紧扣当前回答的主题与依据。
function buildTbFollow(action, ans, q, book) {
  const isExample = /举|例/.test(action || "");
  const t = (q || "") + " " + ((ans && ans.blocks && ans.blocks[0] && ans.blocks[0].text) || "");
  const photo = /光合|光反应|暗反应|叶绿体/.test(t);
  const faraday = /感应电流|电磁感应|磁通量|楞次/.test(t);
  const inherit = { basis: ans && ans.basis, citations: (ans && ans.citations) || [] };

  if (photo) {
    if (isExample) return {
      type: "application",
      blocks: [
        { kind: "answer", text: "用「一片水稻叶子一天里的变化」来体会光反应与暗反应怎样衔接、又怎样不同：" },
        { kind: "example", text: "正午强光下：类囊体薄膜上的光反应把光能转成 ATP 和 [H]，水被光解、放出 O₂；这些 ATP 和 [H] 立刻被基质中的暗反应拿去，把 CO₂ 固定、还原成糖。两阶段一供一耗，环环相扣。" },
        { kind: "scene", title: "再看一个对照", items: ["傍晚突然遮光：光反应停了、ATP 和 [H] 断供，暗反应里 C₃ 来不及被还原而积累、C₅ 减少，糖的生成很快减慢——这正说明暗反应虽不直接需要光，却依赖光反应的产物。"] },
        { kind: "note", text: "一句话：光反应「捕光产能」，暗反应「用能固碳」，例子里的 ATP/[H] 就是连接两阶段的纽带。" },
      ],
      ...inherit, follow: ["再展开讲讲", "出几道练习题", "生成知识卡片"],
    };
    return {
      type: "mechanism",
      blocks: [
        { kind: "answer", text: "顺着上面的对比，把两个阶段按「场所—物质—能量」再展开讲清楚：" },
        { kind: "chain", title: "光反应（类囊体薄膜上）", steps: ["色素吸收光能，水被光解：2H₂O → 4H⁺ + 4e⁻ + O₂↑。", "经电子传递把光能转为活跃化学能，生成 ATP 和 [H]（NADPH）。"] },
        { kind: "chain", title: "暗反应（叶绿体基质中）", steps: ["CO₂ 被 C₅ 固定生成 C₃（CO₂ 的固定）。", "C₃ 在 ATP、[H] 作用下被还原成有机物，并再生 C₅（C₃ 的还原）。"] },
        { kind: "note", text: "能量主线：光能 → ATP/[H] 中活跃化学能 → 有机物中稳定化学能；这与上面表格的「能量变化」一栏对应。" },
      ],
      ...inherit, follow: ["举个例子", "出几道练习题", "生成知识卡片"],
    };
  }
  if (faraday) {
    if (isExample) return {
      type: "application",
      blocks: [
        { kind: "answer", text: "用「条形磁铁进出线圈」这个最经典的例子，体会“磁通量变化才有感应电流”：" },
        { kind: "example", text: "把磁铁快速插入线圈，电流计指针偏转；停在线圈中不动，指针回零；再拔出，指针向相反方向偏转。插入和拔出磁通量分别增大、减小，方向相反，电流方向也相反。" },
        { kind: "note", text: "关键不在“有没有磁场”，而在“磁通量是否在变化”，且变化越快电流越大。" },
      ],
      ...inherit, follow: ["再展开讲讲", "出几道练习题", "生成知识卡片"],
    };
    return {
      type: "mechanism",
      blocks: [
        { kind: "answer", text: "把产生感应电流的原因链顺着上面的回答再展开：" },
        { kind: "chain", title: "原因链条", steps: ["磁通量 Φ=B·S·cosθ 发生变化（B、S 或 θ 任一改变）。", "由 E=n·ΔΦ/Δt，产生感应电动势，与磁通量变化率成正比。", "回路闭合则由 E 驱动产生感应电流，方向由楞次定律判定。"] },
        { kind: "note", text: "楞次定律的本质是“阻碍磁通量的变化”，而不是阻碍磁通量本身。" },
      ],
      ...inherit, follow: ["举个例子", "出几道练习题", "生成知识卡片"],
    };
  }
  // 通用兜底：仍紧扣当前主题与依据，不另起炉灶
  const lead = ans && ans.blocks && ans.blocks.find((b) => b.kind === "answer");
  const topicName = (q || "这个知识点").replace(/[？?。.！!，,]/g, "").replace(/^(什么是|请问|老师|为什么|怎么|如何|有哪些|说说|讲讲)/, "").slice(0, 18);
  if (isExample) return {
    type: "application",
    blocks: [
      { kind: "answer", text: `结合上面的回答，给「${topicName}」举一个贴近实际的例子：` },
      { kind: "example", text: `${lead ? lead.text.replace(/^[^，。]*[:：]/, "").slice(0, 46) + "……" : ""}把这个结论放进一个真实情境或一组具体数据里走一遍，学生更容易抓住要点。` },
      { kind: "note", text: "示例只是把上面的结论具体化，结论与依据保持一致。" },
    ],
    ...inherit, follow: ["再展开讲讲", "出几道练习题", "生成知识卡片"],
  };
  return {
    type: "concept",
    blocks: [
      { kind: "answer", text: `围绕「${topicName}」，在上面回答的基础上再展开说明，方便课堂讲解：` },
      ...(lead ? [{ kind: "answer", text: lead.text }] : []),
      { kind: "note", text: "展开内容与上面的结论、依据保持一致，不另作发散。" },
    ],
    ...inherit, follow: ["举个例子", "出几道练习题", "生成知识卡片"],
  };
}

// ── 跨场景的"问教材回答"静态快照 ──
// 「一条贯穿会话」：把鲜活的问教材回答冻结成一张可在任意场景渲染的静态卡片，
// 这样切到出卷子/做课件后，左侧对话里的回答依然完整可见，不会塌缩成一句话。
function FrozenTbAnswer({ ans }) {
  if (!ans) return <span>已依据教材原文作答（见「问教材」）。</span>;
  const meta = TYPE_META[ans.type] || TYPE_META.concept;
  const NoCite = () => null; // 静态快照不带可交互的引用角标
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 999, background: `oklch(0.96 0.03 ${meta.hue})`, border: `1px solid oklch(0.88 0.06 ${meta.hue})`, color: `oklch(0.45 0.12 ${meta.hue})`, fontSize: 11, fontWeight: 800 }}>
          <Icon name={meta.icon} size={12} /> {meta.label}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--ink-3)", fontWeight: 700 }}>
          <CIcon name="book" size={12} /> 问教材回答 · 已留存
        </span>
      </div>
      <TbAnsBlocks blocks={ans.blocks} CiteMark={NoCite} />
      {ans.citations && ans.citations.length > 0 && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--auth-ink)", fontWeight: 700 }}>
          <Icon name="shield" size={12} /> 依据教材原文 {ans.citations.length} 处（出处见「问教材」）
        </div>
      )}
    </div>
  );
}

// 跨教材对比的静态快照（多本对比回答）
function FrozenTbCompare({ cmp }) {
  const C = cmp || (window.AIDATA && window.AIDATA.TEXTBOOK_COMPARE) || {};
  const topic = C.topic || "跨教材对比";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 999, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", color: "var(--brand-deep)", fontSize: 11, fontWeight: 800, alignSelf: "flex-start" }}>
        <Icon name="layers" size={12} /> 跨教材对比 · {topic}
      </span>
      {C.summary && <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: "var(--ink-2)" }}>{C.summary}</p>}
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--auth-ink)", fontWeight: 700 }}>
        <CIcon name="book" size={12} /> 问教材回答 · 已留存
      </span>
    </div>
  );
}
