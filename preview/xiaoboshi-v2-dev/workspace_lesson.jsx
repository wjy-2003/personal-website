// workspace_lesson.jsx — 写教案：真实成稿的教学设计工作台
// 左侧对话驱动，右侧生成一份结构完整、可直接编辑的教学设计文档。
const { useState: lS, useEffect: lE, useRef: lR } = React;

// ---- 从自然语言里解析课题信息 ----
function parseLessonQuery(q) {
  const text = q || "";
  const edition = (text.match(/(人教版|北师大版|部编版|苏教版|外研社|湘教版|沪科版|译林版|统编版)/) || [])[1] || null;
  const gradeRaw = (text.match(/(高[一二三]|[一二三四五六七八九]年级(上|下)?册?|[七八九][上下]册?)/) || [])[0] || null;
  const subject = (text.match(/(数学|语文|英语|物理|化学|生物|历史|地理|政治|道德与法治|音乐|美术|体育|科学|信息技术)/) || [])[1] || null;
  // 课题：优先书名号，其次去掉修饰词后的主体
  let topic = (text.match(/《([^》]+)》/) || [])[1];
  if (!topic) {
    topic = text
      .replace(/(帮我|请|给我|来一?份|写个?|做个?|生成|出个?)/g, "")
      .replace(/(人教版|北师大版|部编版|苏教版|外研社|湘教版|沪科版|译林版|统编版)/g, "")
      .replace(/(高[一二三]|[一二三四五六七八九]年级(上|下)?册?|[七八九][上下]册?)/g, "")
      .replace(/(数学|语文|英语|物理|化学|生物|历史|地理|政治|道德与法治|音乐|美术|体育|科学|信息技术)/g, "")
      .replace(/(的)?(教学设计|教案|详案|学案|导学案|学习任务单|说课稿?|教学方案)/g, "")
      .replace(/第\d+课/g, (m) => m)
      .trim()
      .replace(/^[,，、·\s]+|[,，、·\s]+$/g, "");
  }
  if (!topic) topic = "本节课内容";
  return { topic, edition, grade: gradeRaw, subject };
}

// ---- 文档类型：教案 / 学案 两大类，各含子类型 ----
const LESSON_CATEGORIES = [
  { key: "教案", types: ["教学设计", "讲义", "学历案", "作业设计方案"] },
  { key: "学案", types: ["导学案", "学习任务单", "知识清单", "实验报告单"] },
];

// ---- 每种文档类型对应的大纲模板（结构各不相同，可在此基础上增删改）----
const OUTLINE_TEMPLATES = {
  "教学设计": [
    ["analysis", "教材分析", "本节在知识体系中的地位与作用"],
    ["students", "学情分析", "学生已有基础、认知特点与困难"],
    ["objectives", "教学目标", "知识技能 / 过程方法 / 情感态度"],
    ["keypoints", "教学重难点", "重点、难点与突破策略"],
    ["prep", "教学准备", "课件、教具、学具与分组"],
    ["process", "教学过程", "导入→探究→精讲→巩固→小结"],
    ["board", "板书设计", "核心板书结构"],
    ["homework", "作业布置", "必做 / 选做 分层作业"],
  ],
  "讲义": [
    ["objectives", "学习目标", "本节要达成的目标"],
    ["knowledge", "知识梳理", "核心概念与结论逐条梳理"],
    ["examples", "典型例题", "例题 + 思路点拨"],
    ["methods", "方法归纳", "解题方法与规律总结"],
    ["exercises", "巩固练习", "分层练习题"],
    ["summary", "课堂小结", "知识与方法回顾"],
  ],
  "学历案": [
    ["objectives", "学习目标", "可评可测的学习目标"],
    ["situation", "情境与任务", "真实情境与驱动任务"],
    ["process", "学习过程", "自主—合作—展示的学习活动"],
    ["evaluation", "评价任务", "对应目标的评价标准"],
    ["summary", "学后反思", "学生自我反思与延伸"],
  ],
  "作业设计方案": [
    ["objectives", "作业目标", "作业要巩固的核心目标"],
    ["layered", "分层作业", "A 基础 / B 提升 / C 拓展"],
    ["expand", "实践拓展", "跨学科或生活化实践任务"],
    ["answer", "参考答案与评价", "答案要点与评价标准"],
  ],
  "导学案": [
    ["objectives", "学习目标", "本节学习目标"],
    ["selfstudy", "自主学习", "课前自学与填空"],
    ["explore", "合作探究", "小组探究问题串"],
    ["check", "当堂检测", "当堂达标检测题"],
    ["summary", "归纳小结", "知识网络梳理"],
  ],
  "学习任务单": [
    ["objectives", "学习目标", "任务要达成的目标"],
    ["tasks", "学习任务", "逐项学习任务"],
    ["record", "学习记录", "学习过程记录区"],
    ["check", "自我检测", "自评与互评"],
  ],
  "知识清单": [
    ["knowledge", "知识要点", "本节知识点逐条罗列"],
    ["formula", "核心公式 / 结论", "必记公式与结论"],
    ["wrong", "易错提醒", "常见错误与辨析"],
    ["map", "知识结构图", "知识之间的逻辑结构"],
  ],
  "实验报告单": [
    ["purpose", "实验目的", "本实验要解决的问题"],
    ["material", "实验器材", "所需器材与药品"],
    ["expsteps", "实验步骤", "操作步骤与注意事项"],
    ["record", "数据记录", "数据表格与现象记录"],
    ["conclusion", "实验结论", "结论与误差分析"],
  ],
};
function buildOutline(type) {
  const t = OUTLINE_TEMPLATES[type] || OUTLINE_TEMPLATES["教学设计"];
  return t.map((o, i) => ({ id: "o" + i, key: o[0], name: o[1], hint: o[2] }));
}
function lessonMeta(q, mem) {
  const p = parseLessonQuery(q);
  return {
    topic: p.topic,
    edition: p.edition || (mem && mem.edition) || "人教版",
    grade: p.grade || (mem && (mem.grade || (mem.book ? lzGrade(mem) : null))) || "七年级",
    subject: p.subject || (mem && mem.subject) || "数学",
    periods: "1 课时", type: "新授课",
  };
}

// ---- 单个章节的内容生成器：按 key 产出对应正文（不同文档类型共用同一份生成库）----
function buildSection(key, name, c) {
  const { topic, edition, grade, subject } = c;
  switch (key) {
    case "analysis":
      return { paras: [
        `「${topic}」是${edition}${subject}${grade}教材中的重要内容，在知识体系中起承上启下的作用：它既是对已学知识的延伸与综合，又为后续学习奠定方法与思维基础。`,
        `教材通过具体情境引出${topic}，遵循“感知—理解—运用”的认知路径，注重引导学生经历知识的形成过程，体会其中蕴含的基本思想方法。`,
      ] };
    case "students":
      return { paras: [
        `${grade}学生已具备一定的前置知识与生活经验，能在教师引导下进行观察、比较和归纳，但抽象概括能力仍在发展中，对${topic}的本质理解容易停留在表面。`,
        `教学中需要借助直观素材与递进式问题串，帮助学生从具体情境逐步过渡到抽象理解，并通过变式练习巩固易混点。`,
      ] };
    case "objectives":
      return { list: [
        { tag: "知识与技能", text: `理解${topic}的核心概念与基本结论，能准确表述并在典型情境中正确运用。` },
        { tag: "过程与方法", text: `经历观察、猜想、验证、归纳的探究过程，体会从特殊到一般的思想方法，发展合作交流与表达能力。` },
        { tag: "情感态度与价值观", text: `在探究活动中获得成功体验，感受${subject}与现实生活的联系，激发学习兴趣与求知欲。` },
      ] };
    case "keypoints":
      return { list: [
        { tag: "重点", text: `${topic}的核心概念、基本结论及其简单运用。` },
        { tag: "难点", text: `${topic}本质特征的抽象与概括，以及在变式情境中的灵活迁移。` },
        { tag: "突破策略", text: "以问题串驱动探究，借助直观演示与小组讨论搭建脚手架，通过对比辨析突破易混点。" },
      ] };
    case "prep":
      return { paras: ["多媒体课件、导学单；学生分组（4 人一组）；板书用具及相关教具 / 学具。"] };
    case "process":
      return { steps: [
        { stage: "一、情境导入", time: "5 分钟", teacher: `呈现与${topic}相关的生活情境或旧知问题，提出核心问题，引发认知冲突。`, student: "观察情境，尝试用已有知识回答，发现新问题。", intent: "从学生最近发展区切入，自然引出课题，明确学习目标。" },
        { stage: "二、探究新知", time: "15 分钟", teacher: `组织学生围绕${topic}开展操作 / 观察活动，用问题串引导：你发现了什么规律？能否用自己的话概括？`, student: "动手操作、小组讨论，记录发现，尝试归纳结论并汇报交流。", intent: "让学生经历知识的形成过程，在做中学，培养归纳概括能力。" },
        { stage: "三、精讲点拨", time: "8 分钟", teacher: `结合学生汇报，规范表述${topic}的结论；通过例题示范规范的思考路径与书写格式。`, student: "对照修正自己的表述，跟随例题理清思路，提出疑问。", intent: "在学生自主建构的基础上精准点拨，规范知识与方法。" },
        { stage: "四、巩固练习", time: "9 分钟", teacher: "布置基础题与变式题各 2 道，巡视指导，收集典型错误进行投影讲评。", student: "独立完成练习，同桌互批，参与错例分析。", intent: "分层递进巩固新知，通过错例辨析突破难点。" },
        { stage: "五、小结作业", time: "3 分钟", teacher: "引导学生从知识、方法、感受三方面总结；布置作业。", student: "自主梳理本课收获，互相补充。", intent: "完善认知结构，实现课内向课外的延伸。" },
      ] };
    case "board":
    case "map":
      return { board: { title: topic, left: ["核心概念 / 结论", "关键条件与注意点"], right: ["典型例题思路", "方法小结：观察 → 猜想 → 验证 → 归纳"] } };
    case "homework":
      return { list: [
        { tag: "必做", text: "教材本节课后习题（基础巩固）。" },
        { tag: "选做", text: `完成一道与${topic}相关的拓展题，下节课分享思路。` },
      ] };
    case "layered":
      return { list: [
        { tag: "A 层 · 基础", text: "教材课后基础题，巩固本课核心结论，面向全体学生。" },
        { tag: "B 层 · 提升", text: "变式练习 2 道，要求写出完整思考过程。" },
        { tag: "C 层 · 拓展", text: `查找一个${topic}的实际应用例子，写一段说明，下节课分享。` },
      ] };
    case "knowledge":
      return { list: [
        { tag: "要点一", text: `${topic}的定义与表示方法，能用自己的话准确复述。` },
        { tag: "要点二", text: `${topic}的基本性质与适用条件。` },
        { tag: "要点三", text: `${topic}与已学知识的联系与区别。` },
      ] };
    case "examples":
      return { list: [
        { tag: "例 1", text: `围绕${topic}的基础题：考查概念的直接运用，给出规范解答步骤。` },
        { tag: "例 2", text: `${topic}的变式题：在新情境中迁移运用，并提示易错处。` },
      ] };
    case "methods":
      return { list: [
        { tag: "通法", text: `${topic}一类问题的通用思路：审题 → 找关键条件 → 选择策略 → 规范作答。` },
        { tag: "提醒", text: "关注适用条件，避免把结论用错范围；先估算再精算便于检查。" },
      ] };
    case "exercises":
    case "check":
      return { list: [
        { tag: "基础", text: `针对${topic}的达标题 3 道（概念识记与直接运用）。` },
        { tag: "提升", text: "综合 / 变式题 2 道，检测灵活迁移能力。" },
      ] };
    case "summary":
      return { paras: [
        `从知识、方法、感受三方面回顾本节：${topic}是什么、怎么用、易错在哪。`,
        "用一句话或一张知识结构图把本节内容串起来，并指出与下节课的联系。",
      ] };
    case "situation":
      return { paras: [
        `创设与${topic}相关的真实情境，提出一个驱动性问题，让学生带着任务进入学习。`,
        "明确本节要完成的核心任务与最终成果形式（如一份说明、一组结论）。",
      ] };
    case "evaluation":
      return { list: [
        { tag: "评价任务一", text: "能用自己的话说清核心概念——对应「学习目标 1」。" },
        { tag: "评价任务二", text: `能在新情境中正确运用${topic}——对应「学习目标 2」。` },
        { tag: "评价标准", text: "分「达成 / 基本达成 / 待加强」三级，附简要描述供自评互评。" },
      ] };
    case "expand":
      return { paras: [
        `设计一项与${topic}相关的实践或跨学科任务，让学生在真实问题中迁移运用所学。`,
        "鼓励以小组协作完成，下节课展示成果，关注过程与表达。",
      ] };
    case "answer":
      return { list: [
        { tag: "答案要点", text: "给出各题关键步骤与最终结果，标注得分点。" },
        { tag: "评价说明", text: "说明分层作业的批改重点与反馈方式，便于精准讲评。" },
      ] };
    case "formula":
      return { list: [
        { tag: "必记", text: `${topic}的核心公式 / 结论及其文字表述。` },
        { tag: "条件", text: "公式成立的前提条件与常见变形。" },
      ] };
    case "wrong":
      return { list: [
        { tag: "易错一", text: `忽略${topic}的适用条件，导致结论用错范围。` },
        { tag: "易错二", text: "符号、单位或表述不规范；通过正反例对比加以辨析。" },
      ] };
    case "purpose":
      return { paras: [`通过实验探究与${topic}相关的规律 / 现象，理解其本质并学会规范操作。`] };
    case "material":
      return { paras: ["列出本实验所需的主要器材、药品 / 材料及数量，并标注安全注意事项。"] };
    case "expsteps":
      return { list: [
        { tag: "步骤 1", text: "组装与检查器材，明确观察对象。" },
        { tag: "步骤 2", text: `按方案进行操作，记录与${topic}相关的现象 / 数据。` },
        { tag: "步骤 3", text: "重复测量，整理数据，规范收尾。" },
      ] };
    case "record":
      return { paras: ["此处为数据 / 学习记录区：用表格记录每次测量或学习过程的关键信息，便于后续分析。"] };
    case "conclusion":
      return { paras: [
        `根据数据与现象归纳结论，回应实验目的中关于${topic}的问题。`,
        "分析可能的误差来源与改进方法。",
      ] };
    case "selfstudy":
      return { list: [
        { tag: "自学一", text: `阅读教材，圈出${topic}的定义与关键词，尝试填空式记录。` },
        { tag: "自学二", text: "完成 2 道前置小题，标记不会的地方，带到课堂讨论。" },
      ] };
    case "explore":
      return { steps: [
        { stage: "探究一", time: "8 分钟", teacher: `提出关于${topic}的核心问题，引导小组观察与讨论。`, student: "小组合作，记录发现并尝试归纳。", intent: "在做中学，培养归纳概括能力。" },
        { stage: "探究二", time: "7 分钟", teacher: "组织汇报，针对分歧追问，规范结论表述。", student: "展示成果，互相质疑补充。", intent: "在交流中完善认知，规范知识与方法。" },
      ] };
    case "tasks":
      return { list: [
        { tag: "任务一", text: `读懂${topic}：用自己的话写出它的含义。` },
        { tag: "任务二", text: "做一做：完成配套小题并记录思路。" },
        { tag: "任务三", text: "想一想：举一个生活中的例子。" },
      ] };
    case "reflect":
      return { paras: [
        "本课以学生活动为主线，探究环节学生参与度较高；但部分小组归纳结论时表述不够严谨，下次可提前给出表述支架。",
        "练习反馈显示变式题正确率偏低，难点突破还需加强——可在精讲环节增加一组对比辨析，并布置针对性补偿练习。",
      ] };
    default:
      return { paras: [`（${name}）这一部分先留好位置——告诉我具体要求，我来帮你补充内容；也可以直接在此点击撰写。`] };
  }
}

// ---- 备课文档生成器：按课题 + 文档类型 + 大纲产出完整文档 ----
function buildLessonDoc(q, mem, outline, type) {
  const m = lessonMeta(q, mem);
  const ctx = { topic: m.topic, edition: m.edition, grade: m.grade, subject: m.subject };
  const ol = outline && outline.length ? outline : buildOutline(type);
  const sections = ol.map((o) => ({ id: o.key, name: o.name, ...buildSection(o.key, o.name, ctx) }));
  return { topic: m.topic, edition: m.edition, grade: m.grade, subject: m.subject, periods: m.periods, type: m.type, docType: type || "教学设计", sections };
}

// ---- 对话指令 → 文档修改 ----
function applyLessonCommand(text, doc) {
  const t = text || "";
  const clone = { ...doc, sections: doc.sections.map((s) => ({ ...s })) };
  if (/反思/.test(t)) {
    if (!clone.sections.find((s) => s.id === "reflect")) {
      clone.sections = [...clone.sections, {
        id: "reflect", name: "教学反思",
        paras: [
          "本课以学生活动为主线，探究环节学生参与度较高；但部分小组归纳结论时表述不够严谨，下次可提前给出表述支架。",
          "练习反馈显示变式题正确率偏低，说明难点突破还需加强——可在精讲环节增加一组对比辨析，并在课后布置针对性补偿练习。",
        ],
      }];
      return { doc: clone, reply: "已在文末补充「教学反思」，从课堂效果和改进方向两个角度写了初稿，你可以直接在右侧修改。" };
    }
    return { doc, reply: "「教学反思」已经在文档里了，可以直接在右侧编辑补充。" };
  }
  if (/分层/.test(t)) {
    clone.sections = clone.sections.map((s) => s.id === "homework" ? {
      ...s,
      list: [
        { tag: "A 层 · 基础", text: "教材课后习题 1–3 题，巩固本课核心结论。" },
        { tag: "B 层 · 提升", text: `变式练习 2 道，要求写出完整的思考过程。` },
        { tag: "C 层 · 拓展", text: `查找一个${clone.topic}在实际中的应用例子，写一段说明，下节课分享。` },
      ],
    } : s);
    return { doc: clone, reply: "已把作业改为 A/B/C 三层：基础巩固、能力提升、实践拓展，各层要求都写明了。" };
  }
  if (/细化|重难点/.test(t)) {
    clone.sections = clone.sections.map((s) => s.id === "keypoints" ? {
      ...s,
      list: [
        { tag: "重点", text: `${clone.topic}的核心概念、基本结论及其简单运用。` },
        { tag: "重点落实", text: "通过探究活动让结论由学生自己归纳得出；例题示范后安排同型练习即时检测。" },
        { tag: "难点", text: `${clone.topic}本质特征的抽象与概括，以及在变式情境中的灵活迁移。` },
        { tag: "难点成因", text: "学生的抽象概括能力尚在发展，容易被表面特征干扰，对适用条件关注不足。" },
        { tag: "突破策略", text: "①直观演示降低抽象度；②正反例对比辨析适用条件；③变式梯度练习实现迁移。" },
      ],
    } : s);
    return { doc: clone, reply: "已细化「教学重难点」：补充了重点落实方式、难点成因分析和三步突破策略。" };
  }
  if (/课时/.test(t)) {
    const m = t.match(/([一二两三四12234])\s*课时/);
    const n = m ? m[1].replace("两", "二") : "二";
    clone.periods = `${n} 课时`;
    return { doc: clone, reply: `已把课时调整为 ${clone.periods}，教学过程的环节安排你可以按课时在右侧拆分调整。` };
  }
  if (/导入|情境/.test(t)) {
    clone.sections = clone.sections.map((s) => s.id === "process" ? {
      ...s,
      steps: s.steps.map((st, i) => i === 0 ? { ...st, teacher: `播放一段贴近学生生活的短视频/实物演示，引出与${clone.topic}相关的真实问题，请学生先猜一猜。`, intent: "用真实情境激发兴趣，让学生带着问题进入学习。" } : st),
    } : s);
    return { doc: clone, reply: "已把导入环节改为更具体的情境式导入（短视频/实物演示 + 猜想），设计意图也同步更新了。" };
  }
  return null;
}

const LESSON_COLD = ["北师大版八下 平行四边形的判定 教学设计", "部编版历史八下 第18课 教学设计", "苏教版六下数学《正比例的意义》教案", "高一英语外研社必修2 Unit6 教学设计"];

// ---- 教材选择维度：学段 / 学科 / 版本 / 册别（与「问教材」一致）----
const LZ_STAGES = ["小学", "初中", "高中"];
const LZ_SUBJECTS = ["语文", "数学", "英语", "物理", "化学", "生物", "历史", "地理", "道德与法治", "科学"];
const LZ_EDITIONS = ["人教版", "统编版", "北师大版", "苏教版", "外研版", "沪教版"];
function lzBooks(stage) {
  if (stage === "高中") return ["必修1", "必修2", "选择性必修1", "选择性必修2"];
  if (stage === "小学") return ["一年级上册", "二年级上册", "三年级上册", "四年级上册", "五年级上册", "六年级上册"];
  return ["七年级上册", "七年级下册", "八年级上册", "八年级下册", "九年级上册", "九年级下册"];
}
function lzGrade(tb) {
  if (tb.stage === "高中") return "高一";
  const m = (tb.book || "").match(/^(.+?年级)/);
  return m ? m[1] : "七年级";
}
// ---- 章节目录（按 学科|册别 取，缺省给通用目录）----
const LZ_CATALOG = {
  "数学|七年级上册": [
    { ch: "第一章 有理数", secs: ["正数和负数", "有理数", "有理数的加减法", "有理数的乘除法", "有理数的乘方"] },
    { ch: "第二章 整式的加减", secs: ["整式", "整式的加减"] },
    { ch: "第三章 一元一次方程", secs: ["从算式到方程", "解一元一次方程", "实际问题与一元一次方程"] },
    { ch: "第四章 几何图形初步", secs: ["几何图形", "直线、射线、线段", "角"] },
  ],
  "数学|八年级上册": [
    { ch: "第十一章 三角形", secs: ["与三角形有关的线段", "与三角形有关的角", "多边形及其内角和"] },
    { ch: "第十二章 全等三角形", secs: ["全等三角形", "三角形全等的判定", "角的平分线的性质"] },
    { ch: "第十三章 轴对称", secs: ["轴对称", "画轴对称图形", "等腰三角形"] },
  ],
  "语文|七年级上册": [
    { ch: "第一单元", secs: ["春", "济南的冬天", "雨的四季", "古代诗歌四首"] },
    { ch: "第二单元", secs: ["秋天的怀念", "散步", "散文诗二首", "《世说新语》二则"] },
  ],
  "生物|必修1": [
    { ch: "第5章 细胞的能量供应和利用", secs: ["降低化学反应活化能的酶", "细胞的能量“货币”ATP", "ATP的主要来源——细胞呼吸", "光合作用与能量转化"] },
    { ch: "第6章 细胞的生命历程", secs: ["细胞的增殖", "细胞的分化", "细胞的衰老和死亡"] },
  ],
  "物理|九年级上册": [
    { ch: "第十三章 内能", secs: ["分子热运动", "内能", "比热容"] },
    { ch: "第十五章 电流和电路", secs: ["两种电荷", "电流和电路", "串联和并联"] },
  ],
};
function lzCatalog(tb) {
  return LZ_CATALOG[`${tb.subject}|${tb.book}`] || [
    { ch: "第一单元", secs: ["第 1 节", "第 2 节", "第 3 节"] },
    { ch: "第二单元", secs: ["第 1 节", "第 2 节", "第 3 节"] },
  ];
}
function lzLabel(tb) { return `${tb.edition} · ${tb.subject} · ${tb.book}`; }
// 登录用户的记忆默认教材
function lessonTextbookFor(mem) {
  if (mem) return { stage: "初中", subject: mem.subject || "数学", edition: mem.edition || "人教版", book: "七年级上册" };
  return { stage: "初中", subject: "数学", edition: "人教版", book: "七年级上册" };
}

// ---- 文档区的小组件 ----
function LsTag({ children }) {
  return <span style={{ flexShrink: 0, alignSelf: "flex-start", padding: "3px 9px", borderRadius: 7, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", color: "var(--brand-deep)", fontSize: 11.5, fontWeight: 800, whiteSpace: "nowrap" }}>{children}</span>;
}

function LsSection({ sec, idx, animate }) {
  const body = sec.paras ? (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {sec.paras.map((p, i) => (
        <p key={i} contentEditable suppressContentEditableWarning style={{ margin: 0, fontSize: 13.5, lineHeight: 1.85, color: "var(--ink)", outline: "none" }}>{p}</p>
      ))}
    </div>
  ) : sec.list ? (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {sec.list.map((it, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <LsTag>{it.tag}</LsTag>
          <p contentEditable suppressContentEditableWarning style={{ margin: 0, flex: 1, fontSize: 13.5, lineHeight: 1.75, color: "var(--ink)", outline: "none" }}>{it.text}</p>
        </div>
      ))}
    </div>
  ) : sec.steps ? (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {sec.steps.map((st, i) => (
        <div key={i} style={{ border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 13px", background: "var(--surface-2)", borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>{st.stage}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", fontFamily: "var(--font-num)" }}>{st.time}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            <div style={{ padding: "9px 13px", borderRight: "1px solid var(--line)" }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: "var(--brand-deep)", marginBottom: 4 }}>教师活动</div>
              <p contentEditable suppressContentEditableWarning style={{ margin: 0, fontSize: 12.5, lineHeight: 1.7, color: "var(--ink-2)", outline: "none" }}>{st.teacher}</p>
            </div>
            <div style={{ padding: "9px 13px" }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: "oklch(0.55 0.12 175)", marginBottom: 4 }}>学生活动</div>
              <p contentEditable suppressContentEditableWarning style={{ margin: 0, fontSize: 12.5, lineHeight: 1.7, color: "var(--ink-2)", outline: "none" }}>{st.student}</p>
            </div>
          </div>
          <div style={{ padding: "7px 13px", borderTop: "1px dashed var(--line)", display: "flex", gap: 7, alignItems: "baseline" }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: "var(--ink-3)", flexShrink: 0 }}>设计意图</span>
            <p contentEditable suppressContentEditableWarning style={{ margin: 0, fontSize: 12, lineHeight: 1.65, color: "var(--ink-3)", outline: "none" }}>{st.intent}</p>
          </div>
        </div>
      ))}
    </div>
  ) : sec.board ? (
    <div style={{ border: "1.5px solid var(--ink)", borderRadius: 4, padding: "14px 18px", background: "var(--surface-2)" }}>
      <div style={{ textAlign: "center", fontSize: 14.5, fontWeight: 800, color: "var(--ink)", marginBottom: 10 }}>{sec.board.title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sec.board.left.map((l, i) => <div key={i} contentEditable suppressContentEditableWarning style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.6, outline: "none" }}>· {l}</div>)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sec.board.right.map((l, i) => <div key={i} contentEditable suppressContentEditableWarning style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.6, outline: "none" }}>· {l}</div>)}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <section className={animate ? "block-pop" : ""} style={{ animationDelay: `${idx * 0.09}s` }}>
      <h3 style={{ display: "flex", alignItems: "center", gap: 9, margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>
        <span style={{ width: 22, height: 22, borderRadius: 7, background: "var(--brand-grad)", backgroundColor: "var(--brand)", color: "#fff", fontSize: 11.5, fontWeight: 800, display: "grid", placeItems: "center", fontFamily: "var(--font-num)", flexShrink: 0 }}>{idx + 1}</span>
        {sec.name}
      </h3>
      {body}
    </section>
  );
}

function LessonOutlinePanel({ meta, docType, outline, setOutline, onConfirm, mobile }) {
  const rename = (id, name) => setOutline((o) => o.map((x) => (x.id === id ? { ...x, name } : x)));
  const remove = (id) => setOutline((o) => (o.length <= 2 ? o : o.filter((x) => x.id !== id)));
  const move = (id, dir) => setOutline((o) => {
    const i = o.findIndex((x) => x.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= o.length) return o;
    const n = o.slice();
    [n[i], n[j]] = [n[j], n[i]];
    return n;
  });
  const add = () => setOutline((o) => [...o, { id: "c" + Date.now().toString(36), key: "custom" + Date.now(), name: "新部分", hint: "自定义部分，点标题改名" }]);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 18 }}>
        <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", color: "var(--brand-deep)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="list" size={20} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "var(--ink)" }}>《{meta.topic}》{docType || "教学设计"}大纲</h2>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[meta.edition, meta.subject, meta.grade, meta.periods].map((c, i) => (
              <span key={i} style={{ padding: "2px 9px", borderRadius: 999, background: "var(--surface-2)", border: "1px solid var(--line)", fontSize: 11, fontWeight: 700, color: "var(--ink-2)" }}>{c}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 12.5, color: "var(--ink-3)", fontWeight: 600 }}>
        <Icon name="spark" size={14} /> 先确认教案结构 —— 增删条目、调整顺序或改名，满意后再展开成完整内容。
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {outline.map((o, i) => (
          <div key={o.id} className="block-pop" style={{ animationDelay: `${i * 0.05}s`, display: "flex", alignItems: "center", gap: 12, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 13, padding: "12px 14px" }}>
            <span style={{ width: 24, height: 24, borderRadius: 7, background: "var(--brand-grad)", backgroundColor: "var(--brand)", color: "#fff", fontSize: 12, fontWeight: 800, display: "grid", placeItems: "center", fontFamily: "var(--font-num)", flexShrink: 0 }}>{i + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <input value={o.name} onChange={(e) => rename(o.id, e.target.value)} spellCheck={false}
                style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: 14.5, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-zh)", padding: 0 }} />
              <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>{o.hint}</div>
            </div>
            <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
              <button onClick={() => move(o.id, -1)} disabled={i === 0} aria-label="上移" style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: i === 0 ? "var(--line)" : "var(--ink-3)", display: "grid", placeItems: "center", cursor: i === 0 ? "default" : "pointer" }}><span style={{ display: "inline-flex", transform: "rotate(180deg)" }}><Icon name="chevron" size={14} /></span></button>
              <button onClick={() => move(o.id, 1)} disabled={i === outline.length - 1} aria-label="下移" style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: i === outline.length - 1 ? "var(--line)" : "var(--ink-3)", display: "grid", placeItems: "center", cursor: i === outline.length - 1 ? "default" : "pointer" }}><Icon name="chevron" size={14} /></button>
              <button onClick={() => remove(o.id)} aria-label="删除" data-tip="删除" style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-3)", display: "grid", placeItems: "center", cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "oklch(0.55 0.18 25)"; e.currentTarget.style.borderColor = "oklch(0.8 0.1 25)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ink-3)"; e.currentTarget.style.borderColor = "var(--line)"; }}><Icon name="trash" size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={add} style={{ width: "100%", marginTop: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px", borderRadius: 12, border: "1px dashed var(--line)", background: "transparent", color: "var(--ink-3)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", transition: "all .15s" }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.color = "var(--brand-deep)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--ink-3)"; }}>
        <Icon name="plus" size={15} sw={2.2} /> 添加一个部分
      </button>

      <div style={{ position: "sticky", bottom: 0, marginTop: 20, paddingTop: 14, display: "flex", justifyContent: "center" }}>
        <button onClick={onConfirm} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 26px", borderRadius: 13, border: "none", background: "var(--brand-grad)", backgroundColor: "var(--brand)", color: "#fff", fontSize: 14.5, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-zh)", boxShadow: "0 10px 26px -12px var(--brand-glow)" }}>
          <Icon name="check" size={16} sw={2.6} /> 生成教案内容
        </button>
      </div>
    </div>
  );
}

function LessonWorkspace({ scenario, query, onHome, onSwitch, fromIntent, resume, loggedIn, nav }) {
  const mobile = useIsMobile();
  const M = window.AIDATA.USER_MEMORY;
  const mem = loggedIn ? { edition: "人教版", grade: "七年级", subject: "数学" } : null;
  const stored = window.ChatSession.scratch.lesson || {};
  // 选中的教材（版本/年级/学科，可在工具栏「教材」处更换）—— 必须在 doc 初始化前声明
  const [textbook, setTextbook] = lS(stored.textbook || lessonTextbookFor(mem));
  const isResume = !!resume;
  const initialQ = query || (isResume ? resume.title : "") || stored.q || "";
  const buildResumeDoc = isResume && !stored.doc;
  const [doc, setDoc] = lS(() => stored.doc || (buildResumeDoc ? buildLessonDoc(initialQ, textbook, null, stored.docType || "教学设计") : null));
  const freshQuery = !isResume && !stored.doc && !!initialQ;
  const [meta, setMeta] = lS(() => (freshQuery ? lessonMeta(initialQ, textbook) : null));
  const [outline, setOutline] = lS(() => (freshQuery && !fromIntent ? buildOutline(stored.docType || "教学设计") : null));
  const [rawQ, setRawQ] = lS(freshQuery ? initialQ : "");
  const [generating, setGenerating] = lS(false);
  const [toast, setToast] = lS(null);
  const docRef = lR(null);
  // 文档分类（教案 / 学案）与具体类型；默认选中第一个，绝不阻断用户
  const [docCat, setDocCat] = lS(stored.docCat || "教案");
  const [docType, setDocType] = lS(stored.docType || "教学设计");
  // 已保存的文档列表 + 下拉/教材选择的弹层开关
  const [savedDocs, setSavedDocs] = lS(stored.savedDocs || []);
  const [savedOpen, setSavedOpen] = lS(false);
  const [pickTextbook, setPickTextbook] = lS(false);
  // 学情/备课设置（右侧抽屉）
  const [setupInputs, setSetupInputs] = lS(stored.setupInputs || { base: "基础一般", periods: "2 课时", style: "素养启发式", files: ["format"] });
  const [setupOpen, setSetupOpen] = lS(stored.setupOpen ?? true);
  // 检查卡片（导出前）
  const [auditOpen, setAuditOpen] = lS(false);

  const greet = <span>好的，我来帮你<b style={{ color: "var(--brand-deep)" }}>写教案</b>。告诉我课题，或者在右侧选好教材章节，我先给你列个大纲。</span>;

  // 保存（独立动作，不新建）—— 同课题+同类型覆盖，避免重复堆叠
  const saveDoc = () => {
    if (!doc) return;
    const key = doc.topic + "|" + docType;
    setSavedDocs((s) => [...s.filter((x) => (x.doc.topic + "|" + x.docType) !== key), { doc, meta, rawQ, docCat, docType, when: "刚刚" }]);
    setToast(`已保存《${doc.topic}》${docType || ""}`);
    setTimeout(() => setToast(null), 1800);
  };
  // 新建（独立动作，不保存）—— 清空当前，回到选择态
  const createNew = () => {
    setDoc(null); setOutline(null); setMeta(null); setRawQ(""); setSugs([]);
    window.__activeArtifactKey = null; window.dispatchEvent(new CustomEvent("artifact-select", { detail: null }));
    setMessages((m) => [...m, { role: "ai", node: <span>已新建一份空白文档——在右上选好教材章节和文档类型，或直接告诉我课题。</span> }]);
  };

  // 打开已保存文档：静默切换，仅用轻提示，不再往对话里堆消息
  const openSaved = (idx) => {
    const s = savedDocs[idx];
    if (!s) return;
    setDoc(s.doc); setMeta(s.meta); setRawQ(s.rawQ); setDocCat(s.docCat); setDocType(s.docType);
    setOutline(null); setSavedOpen(false); setSugs(LESSON_SUGS);
    setToast(`已打开《${s.doc.topic}》${s.docType}`);
    setTimeout(() => setToast(null), 1800);
  };
  const removeSaved = (idx) => setSavedDocs((s) => s.filter((_, i) => i !== idx));

  const genDoc = (q, ol, type, after) => {
    setGenerating(true);
    setOutline(null);
    setTimeout(() => {
      const d = buildLessonDoc(q, textbook, ol, type || docType || "教学设计");
      setDoc(d);
      setGenerating(false);
      after && after(d);
    }, 1300);
  };
  const outlineNote = (m, type) => (
    <span>我先把《<b>{m.topic}</b>》这节课的<b>{type || docType || "教学设计"}</b>大纲列在右侧了——你可以增删条目、调整顺序或改名字。满意后点 <b style={{ color: "var(--brand-deep)" }}>「确认大纲，开始生成」</b>，我再把每一部分展开成完整内容。</span>
  );
  const proposeOutline = (q) => {
    const t = docType || "教学设计";
    if (!docType) setDocType(t);
    const m = lessonMeta(q, textbook);
    setMeta(m); setRawQ(q); setDoc(null); setOutline(buildOutline(t));
    window.__activeArtifactKey = null; window.dispatchEvent(new CustomEvent("artifact-select", { detail: null }));
    setMessages((ms) => [...ms.filter((x) => !x.typing), { role: "ai", node: outlineNote(m, t) }]);
  };
  const confirmOutline = () => {
    const m = meta;
    setMessages((ms) => [...ms, { role: "ai", node: <span>好的，正在按确认后的大纲展开《{m.topic}》的完整{docType || "教学设计"}…</span> }]);
    genDoc(rawQ || m.topic, outline, docType, (d) => { setMessages((ms) => [...ms, { role: "ai", node: doneNote(d), artifact: artFor(d) }]); setSugs(LESSON_SUGS); });
  };

  // 分类切换：默认选中该类第一个子类型，不阻断
  const chooseCat = (key) => {
    if (key === docCat) return;
    const cat = LESSON_CATEGORIES.find((c) => c.key === key) || LESSON_CATEGORIES[0];
    setDocCat(key);
    chooseType(cat.types[0]);
  };
  // 类型切换：若已有成稿/大纲，按新类型重建（不同类型大纲不同）
  const chooseType = (t) => {
    if (t === docType) return;
    setDocType(t);
    if (doc) {
      setMessages((ms) => [...ms, { role: "ai", node: <span>已切换为 <b style={{ color: "var(--brand-deep)" }}>{t}</b> —— 右侧大纲与正文已按「{t}」的结构重新生成。</span> }]);
      genDoc(rawQ || doc.topic, buildOutline(t), t, () => {});
    } else if (outline) {
      setMeta(meta); setOutline(buildOutline(t));
    }
  };

  const [messages, setMessages] = lS(() => {
    if (isResume) {
      return [{ role: "ai", node: <span>已为你恢复 <b>{resume.when}</b> 写的《{(resume.title || "").replace(/[《》]/g, "")}》教学设计，右侧就是当时的成稿，接着改就行。</span> }];
    }
    if (stored.doc) return window.enterThread(scenario);
    if (fromIntent && query) {
      return [
        ...window.ChatSession.take(),
        ...window.takeSwitchDivider(scenario, window.ChatSession.log.length > 0),
        ...(window.ChatSession.echoed(query) ? [] : [window.ChatSession.seedUser(query)]),
        { role: "ai", wide: true, intent: query, render: () => <InlineIntent query={query} onDone={() => { const m = lessonMeta(query, textbook); setMeta(m); setRawQ(query); setOutline(buildOutline(stored.docType || "教学设计")); setMessages((ms) => [...ms, { role: "ai", node: outlineNote(m, stored.docType || "教学设计") }]); }} /> },
      ];
    }
    if (freshQuery) return [...window.ChatSession.take(), ...window.takeSwitchDivider(scenario, window.ChatSession.log.length > 0), ...(window.ChatSession.echoed(query) ? [] : [window.ChatSession.seedUser(query)]), { role: "ai", node: outlineNote(lessonMeta(initialQ, textbook), stored.docType || "教学设计") }];
    return window.enterThread(scenario, greet);
  });
  const LESSON_SUGS = ["补充教学反思", "作业改成分层", "重难点再细化", "导入换成情境式"];
  const [sugs, setSugs] = lS(doc ? LESSON_SUGS : []);

  const artFor = (d) => { const a = { scenario: "lesson", icon: "lesson", title: `《${d.topic}》${d.docType || "教学设计"}`, meta: `${d.edition} · ${d.grade} · ${d.subject}`, _uid: "ls" + Date.now() }; window.__activeArtifactKey = "lesson:" + a._uid; window.dispatchEvent(new CustomEvent("artifact-select", { detail: "lesson:" + a._uid })); return a; };
  const doneNote = (d) => (
    <span>《<b>{d.topic}</b>》的教案已经写好了，共 <b>{d.sections.length}</b> 个模块。可以点「编辑」继续改，也可以直接下载。</span>
  );

  // 持久化
  lE(() => { window.ChatSession.save(window.freezeChat(messages)); }, [messages]);
  lE(() => { window.ChatSession.scratch.lesson = { doc, q: initialQ, docCat, docType, savedDocs, textbook, setupInputs, setupOpen }; }, [doc, docCat, docType, savedDocs, textbook, setupInputs, setupOpen]);

  const handleSend = (text, files) => {
    setMessages((m) => [...m, { role: "user", text, files }, { role: "ai", typing: true }]);
    setTimeout(() => {
      // 已成稿 → 先看是不是修改指令
      if (doc) {
        const r = applyLessonCommand(text, doc);
        if (r) {
          setDoc(r.doc);
          setMessages((m) => [...m.slice(0, -1), { role: "ai", node: <span>{r.reply}</span> }]);
          return;
        }
        if ((text || "").length >= 4) { setMessages((m) => m.slice(0, -1)); proposeOutline(text); return; }
        setMessages((m) => [...m.slice(0, -1), { role: "ai", node: <span>可以告诉我具体改哪里——比如「补充教学反思」「作业改成分层」，或者直接给我一个新课题。</span> }]);
        return;
      }
      // 大纲阶段 → 可用对话调整大纲，或重新列
      if (outline) {
        if (/反思/.test(text) && !outline.some((o) => o.key === "reflect")) {
          setOutline((o) => [...o, { id: "reflect", key: "reflect", name: "教学反思", hint: "课后反思与改进方向" }]);
          setMessages((m) => [...m.slice(0, -1), { role: "ai", node: <span>已在大纲末尾加上「教学反思」，确认后会一并展开。</span> }]);
          return;
        }
        if ((text || "").length >= 4) { setMessages((m) => m.slice(0, -1)); proposeOutline(text); return; }
        setMessages((m) => [...m.slice(0, -1), { role: "ai", node: <span>可以在右侧直接调整大纲；或者告诉我新的课题，我重新列。确认后我才开始展开。</span> }]);
        return;
      }
      // 还没有大纲/文档（问候态）→ 当作课题，先列大纲
      if ((text || "").length >= 2) { setMessages((m) => m.slice(0, -1)); proposeOutline(text); return; }
      setMessages((m) => [...m.slice(0, -1), { role: "ai", node: <span>告诉我课题（最好带上版本和年级），我先列个大纲给你过目。</span> }]);
    }, 600);
  };
  const { headerRecognizing, send } = useSmartSend({ scenarioId: scenario.id, onSwitch, setMessages, localSend: handleSend });

  // 从章节直接开写（docType 始终有默认值，不阻断）
  const writeSection = (topic) => {
    send(`${textbook.edition}${lzGrade(textbook)}${textbook.subject}《${topic}》${docType}`);
  };

  const exportDoc = () => { setAuditOpen(true); };
  const startFromSetup = () => {
    setSetupOpen(false);
    if (rawQ || meta?.topic) {
      proposeOutline(rawQ || meta?.topic);
    } else {
      setMessages((m) => [...m, { role: "ai", node: <span>学情已记录。请告诉我课题，或直接在右侧选好教材章节，我先给你列个大纲。</span> }]);
    }
  };
  const closeSetup = () => setSetupOpen(false);
  // 返回上一层级：离开当前文档，回到「写教案」选择页。离开前自动留存，方便从「接着上次」找回。
  const goBack = () => {
    if (doc) {
      const key = doc.topic + "|" + docType;
      setSavedDocs((s) => [...s.filter((x) => (x.doc.topic + "|" + x.docType) !== key), { doc, meta, rawQ, docCat, docType, when: "刚刚" }]);
    }
    setDoc(null); setSugs([]);
    window.__activeArtifactKey = null; window.dispatchEvent(new CustomEvent("artifact-select", { detail: null }));
  };

  return (
    <WorkspaceShell scenario={scenario} onHome={onHome} onSwitch={onSwitch} nav={nav} headerRecognizing={headerRecognizing} mobilePanelLabel="教案" mobilePanelIcon="lesson" openSheetKey={doc ? doc.topic : null}>
      <ChatPanel messages={messages} onSend={send} suggestions={sugs} placeholder="课题，或要修改的地方…" onOpenRef={(item) => { window.ChatSession.pendingOpenResource = item; onSwitch && onSwitch("find", ""); }} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "var(--canvas)" }}>
        {/* 文档工具栏 —— 上排：选择教材；下排：文档类型 + 操作 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: doc ? "10px 16px" : (outline || generating) ? "9px 16px" : "0", borderBottom: (doc || outline || generating) ? "1px solid var(--line)" : "none", background: "var(--surface)", flexShrink: 0 }}>
          {doc ? (
            /* 编辑阶段：极简头——返回 + 当前文档 + 下载 */
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={goBack} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px 5px 8px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.color = "var(--brand-deep)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--ink-2)"; }}>
                <span style={{ display: "inline-flex", transform: "rotate(180deg)" }}><Icon name="arrow" size={15} /></span> 返回
              </button>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: "var(--ink-2)" }}><span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--brand)", display: "inline-block" }} />正在编辑 · {doc.docType || "教学设计"}</span>
              <div style={{ flex: 1 }} />
              <Btn size="sm" kind="primary" onClick={() => { setToast("正在跳转文档编辑页（演示）"); setTimeout(() => setToast(null), 2200); }}>编辑</Btn>
              <Btn size="sm" kind="ghost" icon="download" onClick={exportDoc}>下载</Btn>
            </div>
          ) : (
          <React.Fragment>
          {/* 上排：当前教材身份 — hide on start page since catalog has it inline */}
          {(outline || generating) && <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ width: 26, height: 26, borderRadius: 8, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}><CIcon name="book" size={14} /></span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)", lineHeight: 1.2 }}>{lzLabel(textbook)}</div>
              <div style={{ fontSize: 10.5, color: "var(--ink-3)", fontWeight: 600 }}>{textbook.stage} · {lzGrade(textbook)}</div>
            </div>
            <button onClick={() => setPickTextbook(true)} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface-2)", color: "var(--ink-2)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.color = "var(--brand-deep)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--ink-2)"; }}>
              <Icon name="refresh" size={13} /> 切换教材
            </button>
            <div style={{ flex: 1 }} />
            {savedDocs.length > 0 && (
              <div style={{ position: "relative" }}>
                <button onClick={() => setSavedOpen((v) => !v)} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 8, border: "1px solid var(--line)", background: savedOpen ? "var(--brand-soft)" : "var(--surface-2)", color: savedOpen ? "var(--brand-deep)" : "var(--ink-2)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>
                  <CIcon name="lesson" size={13} /> 已保存 {savedDocs.length}
                  <span style={{ display: "inline-flex", transform: savedOpen ? "rotate(180deg)" : "none", transition: "transform .15s", color: "var(--ink-3)" }}><Icon name="chevron" size={12} /></span>
                </button>
                {savedOpen && (
                  <React.Fragment>
                    <div onClick={() => setSavedOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 49 }} />
                    <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50, width: 268, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "0 16px 40px -18px rgba(20,30,50,.34)", padding: 6 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 800, color: "var(--ink-3)", padding: "5px 8px" }}>已保存的文档</div>
                      {savedDocs.map((s, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: 4, borderRadius: 9, padding: "2px 2px 2px 0" }}>
                          <button onClick={() => openSaved(idx)} style={{ flex: 1, minWidth: 0, textAlign: "left", display: "flex", alignItems: "center", gap: 8, padding: "8px 9px", borderRadius: 9, border: "none", background: "transparent", color: "var(--ink-2)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-2)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                            <CIcon name="lesson" size={13} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>《{s.doc.topic}》{s.docType}</span>
                          </button>
                          <button onClick={() => removeSaved(idx)} aria-label="删除" style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 7, border: "none", background: "transparent", color: "var(--ink-3)", display: "grid", placeItems: "center", cursor: "pointer" }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "oklch(0.55 0.18 25)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ink-3)"; }}><Icon name="trash" size={13} /></button>
                        </div>
                      ))}
                    </div>
                  </React.Fragment>
                )}
              </div>
            )}
          </div>}

          </React.Fragment>
          )}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: mobile ? "16px 14px" : "26px clamp(18px,4%,48px)" }}>
          {generating ? (
            <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, color: "var(--brand-deep)", fontSize: 13, fontWeight: 700 }}>
                <BotAvatar size={26} glow /> 正在按课标生成{docType || "教学设计"} <Dots />
              </div>
              {[180, 320, 260, 380, 300].map((w, i) => (
                <div key={i} className="ph-stripe" style={{ height: i === 0 ? 30 : 70, borderRadius: 12, maxWidth: i === 0 ? w + 200 : "100%" }} />
              ))}
            </div>
          ) : outline ? (
            <LessonOutlinePanel meta={meta} docType={docType} outline={outline} setOutline={setOutline} onConfirm={confirmOutline} mobile={mobile} />
          ) : !doc ? (
            <LessonStartPage
              textbook={textbook}
              docType={docType}
              setupOpen={setupOpen}
              setupInputs={setupInputs}
              setSetupInputs={setSetupInputs}
              onGenerate={startFromSetup}
              onCloseSetup={closeSetup}
              onWrite={writeSection}
              onPickTextbook={() => setPickTextbook(true)}
              onExample={(c) => send(c)}
              onOpenSaved={openSaved}
              mobile={mobile}
            />
          ) : (
            <article ref={docRef} style={{ maxWidth: 800, margin: "0 auto", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "var(--shadow-card, 0 10px 30px -18px rgba(30,40,60,.18))", padding: mobile ? "22px 18px" : "34px 42px" }}>
            <header style={{ textAlign: "center", marginBottom: 22 }}>
              <h1 contentEditable suppressContentEditableWarning style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 800, color: "var(--ink)", outline: "none" }}>《{doc.topic}》{doc.docType || "教学设计"}</h1>
              <div style={{ display: "flex", justifyContent: "center", gap: 7, flexWrap: "wrap" }}>
                {[doc.edition, doc.subject, doc.grade, doc.periods, doc.type].map((c, i) => (
                  <span key={i} style={{ padding: "3px 11px", borderRadius: 999, background: "var(--surface-2)", border: "1px solid var(--line)", fontSize: 11.5, fontWeight: 700, color: "var(--ink-2)" }}>{c}</span>
                ))}
              </div>
            </header>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {doc.sections.map((sec, i) => <LsSection key={sec.id} sec={sec} idx={i} animate />)}
            </div>
            <footer style={{ marginTop: 26, paddingTop: 14, borderTop: "1px dashed var(--line)", textAlign: "center", fontSize: 11.5, color: "var(--ink-3)" }}>
              本设计对齐课程标准 · 结构参考学科网三审三校权威范例
            </footer>
            </article>
          )}
        </div>
        {toast && (
          <div style={{ position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)", background: "oklch(0.3 0.01 260 / .95)", color: "#fff", fontSize: 12.5, fontWeight: 600, padding: "9px 16px", borderRadius: 11, zIndex: 40, whiteSpace: "nowrap" }}>{toast}</div>
        )}
        {auditOpen && (
          <LessonAuditModal
            inputs={setupInputs}
            onClose={() => setAuditOpen(false)}
            onExport={() => { setAuditOpen(false); setToast("已开始下载（演示）— 实际产品中将下载文档文件"); setTimeout(() => setToast(null), 2600); }}
          />
        )}
        {/* 切换教材抽屉：学段 / 学科 / 版本 / 册别 → 章节目录 */}
        <div onClick={() => setPickTextbook(false)} style={{ position: "fixed", inset: 0, zIndex: 84, background: "rgba(20,16,10,.42)", backdropFilter: "blur(2px)", opacity: pickTextbook ? 1 : 0, pointerEvents: pickTextbook ? "auto" : "none", transition: "opacity .2s" }} />
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 85, width: mobile ? "100%" : "min(560px, 94vw)", background: "var(--canvas)", boxShadow: "-20px 0 60px -30px rgba(0,0,0,.5)", transform: pickTextbook ? "translateX(0)" : "translateX(102%)", transition: "transform .26s cubic-bezier(.22,1,.36,1)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "13px 18px", borderBottom: "1px solid var(--line)", background: "var(--surface)", flexShrink: 0 }}>
            <span style={{ width: 28, height: 28, borderRadius: 9, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)" }}><CIcon name="book" size={16} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--ink)" }}>选择教材</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600 }}>学段 · 学科 · 版本 · 册别 → 章节目录</div>
            </div>
            <button onClick={() => setPickTextbook(false)} aria-label="关闭" style={{ width: 30, height: 30, borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-3)", display: "grid", placeItems: "center", cursor: "pointer" }}><Icon name="close" size={15} /></button>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            {pickTextbook && <LessonTextbookPicker current={textbook} onApply={(tb) => { setTextbook({ ...tb, _chosen: true }); setPickTextbook(false); }} onWrite={(tb, topic) => { setTextbook({ ...tb, _chosen: true }); setPickTextbook(false); send(`${tb.edition}${lzGrade(tb)}${tb.subject}《${topic}》${docType}`); }} docType={docType} mobile={mobile} />}
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}

// ---- 写教案启动页（右侧辅助区）：对话优先，章节目录近顶部、按需展开 ----
function LessonStartPage({ textbook, docType, setupOpen, setupInputs, setSetupInputs, onGenerate, onPickTextbook, onExample, onOpenSaved, mobile, onCloseSetup }) {
  const catalog = lzCatalog(textbook);
  const [catOpen, setCatOpen] = lS(false);
  const firstSec = (catalog[0] && catalog[0].secs[0]) || "本节";
  const secondSec = (catalog[0] && catalog[0].secs[1]) || (catalog[1] && catalog[1].secs[0]) || firstSec;
  const examples = [
    `备《${firstSec}》的${docType}`,
    `${secondSec}，重点突出探究活动`,
    `这一节的重难点该怎么处理`,
  ];

  return (
    <div className="home-fade" style={{ height: "100%", display: "grid", placeItems: "center", padding: mobile ? 16 : 24 }}>
    <div style={{ width: "min(560px,100%)" }}>
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <div style={{ display: "inline-flex", marginBottom: 13 }}><ScenarioGlyph icon="lesson" hue={320} size={52} active /></div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", margin: "0 0 6px" }}>来写教案吧</h2>
        <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: 0, lineHeight: 1.6 }}>在左侧告诉我课题或描述写教案的需求，也可以直接选择教材章节</p>
      </div>

      {/* 学情 / 备课设置卡片 */}
      {setupOpen && (
        <LessonSetup
          inputs={setupInputs}
          setInputs={setSetupInputs}
          onGenerate={onGenerate}
          onClose={onCloseSetup}
          mobile={mobile}
        />
      )}

      {/* 本册目录 or 选教材入口 */}
      {textbook && textbook._chosen ? (
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", marginBottom: 18 }}>
        <button onClick={() => setCatOpen((v) => !v)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 15px", border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-zh)", textAlign: "left" }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}><Icon name="list" size={15} /></span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>从本册目录里挑一节</span>
            <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lzLabel(textbook)}</span>
          </span>
          <button onClick={(e) => { e.stopPropagation(); onPickTextbook(); }} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface-2)", color: "var(--ink-3)", fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", flexShrink: 0 }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.color = "var(--brand-deep)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--ink-3)"; }}>
            <Icon name="refresh" size={12} /> 换教材
          </button>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "var(--ink-3)", flexShrink: 0 }}>
            {catOpen ? "收起" : "展开"}
            <span style={{ display: "inline-flex", transform: catOpen ? "rotate(180deg)" : "none", transition: "transform .18s" }}><Icon name="chevron" size={14} /></span>
          </span>
        </button>
        {catOpen && (
          <div className="zx-pop" style={{ borderTop: "1px solid var(--line)" }}>
            {catalog.map((c, ci) => (
              <div key={ci} style={{ borderTop: ci ? "1px solid var(--line)" : "none" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-2)", padding: "10px 15px 6px", background: "var(--surface-2)" }}>{c.ch}</div>
                {c.secs.map((s, si) => (
                  <button key={si} onClick={() => onWrite(s)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 15px", border: "none", borderTop: si ? "1px solid var(--line)" : "none", background: "transparent", color: "var(--ink)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", textAlign: "left", transition: "background .14s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--brand-soft)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                    <span style={{ flex: 1, minWidth: 0 }}>{s}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "var(--brand-deep)", flexShrink: 0 }}>写{docType} <Icon name="arrow" size={12} /></span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      ) : (
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <button onClick={onPickTextbook} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", borderRadius: 13, border: "1px solid var(--brand-soft-border)", background: "var(--brand-soft)", color: "var(--brand-deep)", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", transition: "all .15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--brand)"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--brand-soft)"; e.currentTarget.style.color = "var(--brand-deep)"; }}>
          <CIcon name="book" size={16} /> 选教材章节
        </button>
      </div>
      )}

      {/* 试试这样问 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-3)", marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="spark" size={14} /> 试试这样问
        </div>
        {examples.map((ex, i) => (
          <button key={i} onClick={() => onExample(ex)} style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left", padding: "12px 14px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", fontSize: 13, fontWeight: 600, lineHeight: 1.5, cursor: "pointer", fontFamily: "var(--font-zh)", transition: "all .15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px -6px rgba(0,0,0,.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
            <Icon name="spark" size={14} />
            <span style={{ flex: 1 }}>{ex}</span>
            <Icon name="arrow" size={13} />
          </button>
        ))}
      </div>

      {/* 接着上次 */}
      {recents.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "0 2px 9px", fontSize: 12, fontWeight: 800, color: "var(--ink-3)" }}>
            <CIcon name="lesson" size={13} /> 接着上次
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recents.map((s, i) => {
              const idx = (savedDocs || []).indexOf(s);
              return (
                <button key={i} onClick={() => onOpenSaved(idx)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 14px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", cursor: "pointer", fontFamily: "var(--font-zh)", textAlign: "left", transition: "all .15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; }}>
                  <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--surface-2)", border: "1px solid var(--line)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}><CIcon name="lesson" size={15} /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>《{s.doc.topic}》{s.docType}</span>
                    <span style={{ display: "block", fontSize: 11, color: "var(--ink-3)", fontWeight: 600 }}>{s.doc.edition} · {s.doc.grade} · {s.when}</span>
                  </span>
                  <Icon name="arrow" size={14} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

// ---- 教材选择器（学段 / 学科 / 版本 / 册别 → 章节目录）----
function LessonTextbookPicker({ current, onApply, onWrite, docType, mobile }) {
  const [stage, setStage] = lS(current.stage || "初中");
  const [subject, setSubject] = lS(current.subject || "数学");
  const [edition, setEdition] = lS(current.edition || "人教版");
  const books = lzBooks(stage);
  const [book, setBook] = lS(books.includes(current.book) ? current.book : books[0]);
  const ready = stage && subject && edition && book;
  const tb = { stage, subject, edition, book };
  const catalog = ready ? lzCatalog(tb) : [];

  // 学段变化时，册别需重新归一
  const pickStage = (s) => { setStage(s); const bs = lzBooks(s); if (!bs.includes(book)) setBook(bs[0]); };

  const ChipRow = ({ label, opts, value, set }) => (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 13 }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-3)", width: 44, flexShrink: 0, paddingTop: 7 }}>{label}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {opts.map((o) => (
          <button key={o} onClick={() => set(o)} style={{ padding: "6px 13px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", border: value === o ? "1px solid var(--brand)" : "1px solid var(--line)", background: value === o ? "var(--brand-soft)" : "var(--surface)", color: value === o ? "var(--brand-deep)" : "var(--ink-2)", transition: "all .15s" }}>{o}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ padding: mobile ? "18px 16px 28px" : "22px 22px 32px" }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: "16px 18px", marginBottom: 18 }}>
        <ChipRow label="学段" opts={LZ_STAGES} value={stage} set={pickStage} />
        <ChipRow label="学科" opts={LZ_SUBJECTS} value={subject} set={setSubject} />
        <ChipRow label="版本" opts={LZ_EDITIONS} value={edition} set={setEdition} />
        <ChipRow label="册别" opts={books} value={book} set={setBook} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 11 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 800, color: "var(--ink-3)" }}><Icon name="list" size={14} /> {lzLabel(tb)} · 章节目录</span>
        <button onClick={() => onApply(tb)} style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 9, border: "1px solid var(--brand)", background: "var(--brand-soft)", color: "var(--brand-deep)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>
          <Icon name="check" size={13} /> 选用本教材
        </button>
      </div>
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden" }}>
        {catalog.map((c, ci) => (
          <div key={ci} style={{ borderTop: ci ? "1px solid var(--line)" : "none" }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--ink-2)", padding: "11px 15px 7px", background: "var(--surface-2)" }}>{c.ch}</div>
            {c.secs.map((s, si) => (
              <button key={si} onClick={() => onWrite(tb, s)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 15px", border: "none", borderTop: si ? "1px solid var(--line)" : "none", background: "transparent", color: "var(--ink)", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", textAlign: "left", transition: "background .14s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--brand-soft)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                <span style={{ flex: 1, minWidth: 0 }}>{s}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, color: "var(--brand-deep)", flexShrink: 0 }}>写{docType} <Icon name="arrow" size={13} /></span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}


// ---- 学情 / 备课设置卡片（工作台右侧栏内嵌） ----
function LessonSetup({ inputs, setInputs, onGenerate, onClose, mobile }) {
  const toggleFile = (key) => {
    setInputs((s) => {
      const has = (s.files || []).includes(key);
      const next = has ? s.files.filter((k) => k !== key) : [...(s.files || []), key];
      return { ...s, files: next };
    });
  };
  const setValue = (key, val) => setInputs((s) => ({ ...s, [key]: val }));
  const hasFormat = (inputs.files || []).includes("format");

  const Section = ({ label, optional, children }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 750, color: "var(--ink)", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {label}
        {optional && <span style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 500 }}>{optional}</span>}
      </div>
      {children}
    </div>
  );
  const Chip = ({ opts, value, onClick }) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {opts.map((o) => {
        const active = value === o;
        return (
          <button key={o} onClick={() => onClick(o)} style={{ padding: "7px 13px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", border: active ? "1px solid var(--brand)" : "1px solid var(--line)", background: active ? "var(--brand-soft)" : "var(--surface)", color: active ? "var(--brand-deep)" : "var(--ink-2)", transition: "all .15s", display: "inline-flex", alignItems: "center", gap: 6 }}>
            {active && <Icon name="check" size={13} />}{o}
          </button>
        );
      })}
    </div>
  );

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden", marginBottom: 18, boxShadow: "var(--shadow-card)" }}>
      <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid var(--line)" }}>
        <h3 style={{ margin: "0 0 5px", fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>先了解这节课</h3>
        <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.55 }}>只保留影响课堂设计的关键信息；不确定的内容可以跳过。</p>
      </div>
      <div style={{ padding: "18px 18px 8px" }}>
        <Section label="班级基础" optional="可跳过">
          <Chip opts={SETUP_GROUPS[0].opts} value={inputs.base} onClick={(v) => setValue("base", v)} />
        </Section>
        <Section label="课时长度" optional="可跳过">
          <Chip opts={PERIOD_OPTIONS} value={inputs.periods} onClick={(v) => setValue("periods", v)} />
        </Section>
        <Section label="备课风格" optional="可跳过">
          <Chip opts={STYLE_OPTIONS} value={inputs.style} onClick={(v) => setValue("style", v)} />
        </Section>
        <Section label="格式要求 / 教案框架文件" optional="请先上传">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {LESSON_FILES.filter((f) => f.required).map((f) => (
              <button key={f.key} onClick={() => toggleFile(f.key)} style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 11, border: hasFormat ? "1px solid #9dd9c0" : "1px dashed var(--line)", background: hasFormat ? "#edf9f4" : "var(--surface-2)", cursor: "pointer", transition: "all .15s" }}>
                <span style={{ width: 22, height: 22, borderRadius: 7, background: hasFormat ? "#1f9d67" : "var(--surface)", border: "1px solid var(--line)", display: "grid", placeItems: "center", color: "#fff", flexShrink: 0, marginTop: 1 }}>
                  {hasFormat ? <Icon name="check" size={14} /> : <Icon name="upload" size={13} />}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{f.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>{f.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </Section>
        <Section label="已有资料" optional="小博士已完成识别">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {LESSON_FILES.filter((f) => !f.required).map((f) => {
              const checked = (inputs.files || []).includes(f.key);
              return (
                <button key={f.key} onClick={() => toggleFile(f.key)} style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 11, border: checked ? "1px solid #9dd9c0" : "1px dashed var(--line)", background: checked ? "#edf9f4" : "var(--surface-2)", cursor: "pointer", transition: "all .15s" }}>
                  <span style={{ width: 22, height: 22, borderRadius: 7, background: checked ? "#1f9d67" : "var(--surface)", border: "1px solid var(--line)", display: "grid", placeItems: "center", color: "#fff", flexShrink: 0, marginTop: 1 }}>
                    {checked ? <Icon name="check" size={14} /> : <Icon name="upload" size={13} />}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{f.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>{f.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </Section>
      </div>
      <div style={{ padding: "14px 18px", borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>所有信息后续均可修改</span>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn size="sm" kind="ghost" onClick={onClose}>跳过</Btn>
          <Btn size="sm" kind="primary" icon="spark" onClick={onGenerate}>生成教案</Btn>
        </div>
      </div>
    </div>
  );
}

// ---- 导出前检查卡片 ----
function LessonAuditModal({ inputs, onClose, onExport }) {
  const formatReady = (inputs.files || []).includes("format");
  const items = [
    { ok: true, title: "两课时任务分配清晰", desc: "第一课时聚焦上阕与朗读，第二课时聚焦评史、明志与整合。" },
    { ok: true, title: "教学目标与活动对应", desc: "朗读、意象赏析、评史思辨和拓展表达均有课堂任务承接。" },
    { ok: formatReady, title: "格式要求文件是否准备好", desc: "当前教案已按格式要求文件的结构校验，可继续导出。", warn: true },
    { ok: true, title: "资料来源置信度已达标", desc: "参考资料、格式要求文件和原课件均已用于本次备课。" },
  ];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(26,35,48,.32)", display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(520px, 100%)", maxHeight: "90vh", overflow: "auto", background: "var(--surface)", borderRadius: 16, boxShadow: "var(--shadow-card)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "17px 20px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>导出前检查</h2>
          <button onClick={onClose} style={{ border: "none", background: "transparent", color: "var(--ink-3)", fontSize: 20, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 15, padding: 14, background: "#edf9f4", borderRadius: 12, marginBottom: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center", color: "#1f9d67", fontWeight: 800, fontSize: 17 }}>91</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>教案结构完整，可继续导出</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((it, i) => (
              <div key={i} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 12, display: "flex", gap: 10, background: it.warn && !it.ok ? "#fffdf8" : "var(--surface)", borderColor: it.warn && !it.ok ? "#ffdba3" : "var(--line)" }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: it.ok ? "#edf9f4" : "var(--surface-2)", display: "grid", placeItems: "center", color: it.ok ? "#1f9d67" : "oklch(0.6 0.16 55)", flexShrink: 0 }}>
                  {it.ok ? <Icon name="check" size={14} /> : <Icon name="alert" size={14} />}
                </span>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", marginBottom: 3 }}>{it.title}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", lineHeight: 1.5 }}>{it.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "13px 20px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Btn size="sm" kind="ghost" onClick={onClose}>继续修改</Btn>
          <Btn size="sm" kind="primary" onClick={onExport}>继续导出</Btn>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LessonWorkspace, LessonSetup, LessonAuditModal });
