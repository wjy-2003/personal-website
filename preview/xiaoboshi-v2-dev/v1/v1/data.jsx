// data.jsx — scenario definitions + mock authoritative content
// All content is illustrative mock data for the prototype.

const SCENARIOS = [
  {
    id: "find",
    name: "找资源",
    tagline: "从资源库精准检索",
    desc: "基于学科网资源库，按学段·学科·版本智能匹配",
    icon: "search",
    hue: 150,
    sample: "人教版七年级上册《有理数》同步练习（含解析）",
    samples: ["人教版七年级上册《有理数》同步练习（含解析）", "鲁教版高中地理 热力环流 复习课件", "2025年云南昆明中考化学试卷", "凸透镜成像规律 实验视频"],
  },
  {
    id: "paper",
    name: "出卷子",
    tagline: "组卷一键成型",
    desc: "基于学科网题库智能组卷，难度梯度、知识点全覆盖",
    icon: "paper",
    hue: 25,
    sample: "按湖北物理中考结构，出一份物理中考模拟卷",
    samples: ["按湖北物理中考结构，出一份物理中考模拟卷", "八上生物这节课 选择题30道，答案放最后", "平面向量 概念与模长 出10道题", "正余弦定理 易错题专项，含解析"],
  },
  {
    id: "courseware",
    name: "做课件",
    tagline: "大纲编辑 + 内容生成",
    desc: "告诉课题或选教材章节，先列大纲再展开内容，最后挑模板成稿",
    icon: "slides",
    hue: 255,
    sample: "人教版小学数学三下 第一单元 课件",
    samples: ["人教版小学数学三下 第一单元 课件", "七年级开学班会课件：收心、纪律、学习计划、卫生", "外研版英语必修二 第三单元 早读课件，精美一些", "中考作文赏析与方法总结 PPT，背景浅蓝"],
  },
  {
    id: "lesson",
    name: "写教案",
    tagline: "大纲编辑 + 内容生成",
    desc: "告诉课题或选教材章节，先列大纲再展开内容，编辑或下载成稿",
    icon: "lesson",
    hue: 320,
    sample: "北师大版八下 6.2 平行四边形的判定 教学设计",
    samples: ["北师大版八下 6.2 平行四边形的判定 教学设计", "部编版历史八下 第18课 教学设计", "高一英语外研社必修2 Unit6 教材分析+学情分析+教学方案", "苏教版六下数学《正比例的意义》学习任务单"],
  },
  {
    id: "textbook",
    name: "问教材",
    tagline: "教材问答有据可依",
    desc: "答案逐条引用教材原文，章节页码可溯源",
    icon: "book",
    hue: 200,
    sample: "光反应和暗反应有什么区别？",
    samples: ["光反应和暗反应有什么区别？", "「光合作用」在哪些教材里出现过？", "悬浊液和乳浊液的区别", "椭圆的极点与极线 怎么证明？"],
  },
  {
    id: "mindmap",
    name: "画导图",
    tagline: "知识结构可视化",
    desc: "把章节知识点梳理成清晰的思维导图",
    icon: "mindmap",
    hue: 95,
    sample: "七下数学 第七章 相交线 思维导图",
    samples: ["七下数学 第七章 相交线 思维导图", "九年级 二次函数 思维导图", "高中政治部编版 选必二 第一课 思维导图", "中考一轮复习 分式 考点思维导图"],
  },
  {
    id: "grade",
    name: "改作业",
    tagline: "作业批改与讲评",
    desc: "上传作业，AI 逐题批改、分析错因，并生成评语与班级统计",
    icon: "grade",
    hue: 8,
    sample: "批改这份七年级数学《有理数》随堂练习",
    samples: ["批改这份七年级数学《有理数》随堂练习", "整班批改八上英语 Unit2 单元卷，给质量分析", "这份作文按中考标准评分并写评语", "批改这份物理实验报告，标出问题"],
    badge: "拍照可批",
  },
  {
    id: "explain",
    name: "AI 讲卷",
    tagline: "逐题讲解，讲评成稿",
    desc: "上传试卷或作业，AI 逐题讲解思路与考点，生成可直接投屏的讲评稿",
    icon: "megaphone",
    hue: 40,
    sample: "讲评这份七年级数学《有理数》随堂练习",
    samples: ["讲评这份七年级数学《有理数》随堂练习", "把这份物理卷按错误率排序逐题讲", "生成一份可投屏的讲评课件"],
  },
  {
    id: "image",
    name: "AI 生图",
    tagline: "教学配图一键生成",
    desc: "描述需求即可生成课件插图、情境图与板书示意，风格可控",
    icon: "image",
    hue: 285,
    sample: "生成一张光合作用过程的示意图",
    samples: ["生成一张光合作用过程的示意图", "画一张适合小学的数轴情境图", "给这页课件配一张扁平风插图"],
  },
  {
    id: "agent",
    name: "智能体",
    tagline: "可编排的教学智能体",
    desc: "把多步教学任务编排成可复用的智能体，一次描述、自动执行",
    icon: "spark",
    hue: 210,
    sample: "搭一个「每周错题讲评」智能体",
    samples: ["搭一个「每周错题讲评」智能体", "创建一个自动出周测卷的智能体", "编排一个备课全流程智能体"],
  },
];

// 通用助手 — fallback scenario when intent doesn't match a specific tool.
// Also the place where intent recognition first happens before handing off.
const GENERAL = {
  id: "general",
  name: "通用助手",
  tagline: "有问必答，自动判断该用哪个工具",
  desc: "教学问题随便问，识别到具体需求会带你进入对应工作台",
  icon: "spark",
  hue: 230,
  sample: "我要上一节地理公开课，有什么学生活动或 AI 应用的建议？",
  samples: ["我要上一节地理公开课，有什么学生活动或 AI 应用的建议？", "制定北师大八下数学 从第四单元到期末的十周教学计划", "近三年化学高考 实验安全 的考查规律，三句话总结", "这次期末平均 72、及格率 85%、优秀率 23%，帮我分析问题"],
};

// 真实风格的首页快捷示例（取自真实教师提问，覆盖多学科、查找与生成两类意图）
const HOME_EXAMPLES = [
  { t: "人教版七年级上《有理数》同步练习，含解析", to: "find" },
  { t: "按湖北中考结构出一份物理中考模拟卷", to: "paper" },
  { t: "外研版英语必修二 Unit3 早读课件，精美一些", to: "courseware" },
  { t: "北师大版八下 平行四边形的判定 教学设计", to: "lesson" },
  { t: "九年级 二次函数 思维导图", to: "mindmap" },
  { t: "光反应和暗反应有什么区别？", to: "textbook" },
  { t: "批改这份七年级数学《有理数》随堂练习", to: "grade" },
];


// Mock resource results for 找资源
const RESOURCES = [
  {
    id: 1,
    title: "人教版数学七年级上册 1.2 有理数 同步练习（含解析）",
    type: "同步练",
    grade: "七年级",
    subject: "数学",
    edition: "人教版",
    diff: "基础",
    match: 98,
    downloads: "3.2万",
    pages: 6,
    qcount: 24,
    reviewed: true,
    updated: "2025-08",
    tags: ["有理数", "随堂", "含答案"],
    chips: ["2025–2026学年", "上学期", "同步教学", "答案+解析"],
  },
  {
    id: 2,
    title: "《有理数及其运算》单元检测卷 A 卷",
    type: "单元卷",
    grade: "七年级",
    subject: "数学",
    edition: "人教版",
    diff: "中等",
    match: 95,
    downloads: "1.8万",
    pages: 4,
    qcount: 22,
    reviewed: true,
    updated: "2025-07",
    tags: ["单元卷", "梯度难度"],
    chips: ["上学期", "单元复习", "校考", "答案+解析"],
  },
  {
    id: 3,
    title: "有理数的加减法 微课 + 配套学案",
    type: "学案",
    grade: "七年级",
    subject: "数学",
    edition: "人教版",
    diff: "基础",
    match: 92,
    downloads: "9621",
    pages: 8,
    qcount: 16,
    reviewed: true,
    updated: "2025-09",
    tags: ["微课", "学案", "新授"],
    chips: ["上学期", "新授课", "配套音视频"],
  },
  {
    id: 4,
    title: "有理数易错题精选 30 题（培优）",
    type: "专项训练",
    grade: "七年级",
    subject: "数学",
    edition: "通用",
    diff: "拔高",
    match: 88,
    downloads: "1.1万",
    pages: 5,
    qcount: 30,
    reviewed: true,
    updated: "2025-06",
    tags: ["易错", "培优", "压轴"],
    chips: ["上学期", "专项复习", "精品", "答案+解析"],
  },
  {
    id: 5,
    title: "有理数概念课 教学课件（精品）",
    type: "课件",
    grade: "七年级",
    subject: "数学",
    edition: "人教版",
    diff: "基础",
    match: 84,
    downloads: "2.4万",
    pages: 28,
    qcount: 0,
    reviewed: true,
    updated: "2025-08",
    tags: ["课件", "新授", "情境导入"],
    chips: ["上学期", "新授课", "精品"],
  },
];

// Mock VIDEO resources for 找资源
const VIDEOS = [
  {
    id: "v1",
    kind: "video",
    title: "【实验】探究凸透镜成像规律 演示实验",
    cat: "实验视频",
    subject: "物理",
    grade: "八年级",
    edition: "人教版",
    duration: "12:34",
    quality: "1080P",
    plays: "5.6万",
    match: 96,
    reviewed: true,
    updated: "2025-09",
    chapters: [
      { t: "00:00", name: "实验器材与原理" },
      { t: "02:18", name: "u>2f 成倒立缩小实像" },
      { t: "05:40", name: "f<u<2f 成倒立放大实像" },
      { t: "08:55", name: "u<f 成正立放大虚像" },
      { t: "11:02", name: "数据记录与结论" },
    ],
  },
  {
    id: "v2",
    kind: "video",
    title: "【化学实验】氧气的实验室制取与性质",
    cat: "实验视频",
    subject: "化学",
    grade: "九年级",
    edition: "人教版",
    duration: "09:48",
    quality: "1080P",
    plays: "3.9万",
    match: 90,
    reviewed: true,
    updated: "2025-08",
    chapters: [
      { t: "00:00", name: "药品与装置选择" },
      { t: "03:12", name: "加热高锰酸钾制氧气" },
      { t: "06:30", name: "氧气的验满与收集" },
      { t: "08:05", name: "氧气的性质实验" },
    ],
  },
  {
    id: "v3",
    kind: "video",
    title: "【生物实验】观察根尖分生区细胞的有丝分裂",
    cat: "实验视频",
    subject: "生物学",
    grade: "高一",
    edition: "人教版",
    duration: "14:20",
    quality: "1080P",
    plays: "2.1万",
    match: 88,
    reviewed: true,
    updated: "2025-07",
    chapters: [
      { t: "00:00", name: "装片的制作：解离·漂洗·染色·制片" },
      { t: "05:24", name: "显微镜下观察各分裂时期" },
      { t: "10:10", name: "绘图与时期判断" },
    ],
  },
  {
    id: "v4",
    kind: "video",
    title: "【教师研修】新课标下的大单元教学设计",
    cat: "研修视频",
    subject: "通用",
    grade: "全学段",
    edition: "通用",
    duration: "38:12",
    quality: "1080P",
    plays: "1.4万",
    match: 84,
    reviewed: true,
    updated: "2025-06",
    chapters: [
      { t: "00:00", name: "为什么要做大单元教学" },
      { t: "08:30", name: "单元目标的提取与分解" },
      { t: "19:45", name: "学习任务群的设计" },
      { t: "30:10", name: "评价量规与课例展示" },
    ],
  },
];

// Mock ALBUM (专辑/合集) resources for 找资源
// 专辑详情按「单元 → 课文/专题 → 资料」层级全量展开（参考学科网专辑页层级），
// 资料行只展示文档类，样式与资源列表一致。fmt 决定文件图标（PPT/Word/分层作业/讲义…）。
const ALBUMS = [
  {
    id: "a1",
    kind: "album",
    title: "【上好课】2025-2026学年六年级语文下学期期末考点大串讲",
    subject: "语文",
    grade: "六年级",
    edition: "统编版",
    total: 19,
    downloads: "8.7万",
    match: 94,
    reviewed: true,
    updated: "2025-12",
    composition: [
      { type: "课件", n: 6 },
      { type: "教案", n: 4 },
      { type: "作业", n: 5 },
      { type: "讲义", n: 2 },
      { type: "试卷", n: 2 },
    ],
    units: [
      {
        name: "第一单元 民风民俗",
        lessons: [
          { name: "1 北京的春节/老舍", items: [
            { type: "课件", fmt: "PPT", title: "1 北京的春节（素养进阶教学课件）语文统编版六下", pages: 30 },
            { type: "教案", fmt: "Word", title: "1 北京的春节（素养进阶教学设计）语文统编版六下", pages: 8 },
            { type: "作业", fmt: "作业", title: "1 北京的春节（素养进阶分层作业）语文统编版六下", pages: 5 },
            { type: "讲义", fmt: "讲义", title: "1 北京的春节：详略与场景描写（讲义）语文统编版六下", pages: 6 },
          ] },
          { name: "2 腊八粥/沈从文", items: [
            { type: "课件", fmt: "PPT", title: "2 腊八粥（素养进阶教学课件）语文统编版六下", pages: 28 },
            { type: "教案", fmt: "Word", title: "2 腊八粥（素养进阶教学设计）语文统编版六下", pages: 7 },
            { type: "作业", fmt: "作业", title: "2 腊八粥（素养进阶分层作业）语文统编版六下", pages: 5 },
          ] },
          { name: "3 古诗三首", items: [
            { type: "课件", fmt: "PPT", title: "3 古诗三首（素养进阶教学课件）语文统编版六下", pages: 26 },
            { type: "作业", fmt: "作业", title: "3 古诗三首（素养进阶分层作业）语文统编版六下", pages: 4 },
          ] },
          { name: "4* 藏戏/马晨明", items: [
            { type: "课件", fmt: "PPT", title: "4* 藏戏（素养进阶教学课件）语文统编版六下", pages: 22 },
            { type: "作业", fmt: "作业", title: "4* 藏戏（素养进阶分层作业）语文统编版六下", pages: 4 },
          ] },
        ],
      },
      {
        name: "期末复习专题",
        lessons: [
          { name: "专项 · 阅读理解", items: [
            { type: "讲义", fmt: "讲义", title: "记叙文阅读答题方法 考点精讲（讲义）", pages: 9 },
            { type: "作业", fmt: "作业", title: "课外阅读理解 专项训练（含答案）", pages: 8 },
          ] },
          { name: "专项 · 习作（写人记事）", items: [
            { type: "课件", fmt: "PPT", title: "习作复习：写人记事 考点串讲课件", pages: 24 },
          ] },
          { name: "期末检测", items: [
            { type: "试卷", fmt: "Word", title: "六年级语文下册 期末模拟检测卷（一）含答案", pages: 6, q: 26 },
            { type: "试卷", fmt: "Word", title: "六年级语文下册 期末真题汇编卷（近三年）", pages: 8, q: 30 },
          ] },
        ],
      },
    ],
  },
  {
    id: "a2",
    kind: "album",
    title: "【一轮复习】高三数学《函数与导数》专题突破合集",
    subject: "数学",
    grade: "高三",
    edition: "通用",
    total: 14,
    downloads: "5.2万",
    match: 89,
    reviewed: true,
    updated: "2025-11",
    composition: [
      { type: "课件", n: 5 },
      { type: "讲义", n: 3 },
      { type: "作业", n: 2 },
      { type: "题集", n: 2 },
      { type: "试卷", n: 2 },
    ],
    units: [
      {
        name: "专题一 函数的概念与性质",
        lessons: [
          { name: "1.1 函数的概念与表示", items: [
            { type: "课件", fmt: "PPT", title: "1.1 函数的概念与表示 一轮精讲课件", pages: 38 },
            { type: "教案", fmt: "Word", title: "1.1 函数的概念与表示 一轮复习教学设计", pages: 7 },
            { type: "作业", fmt: "作业", title: "1.1 函数的概念与表示 分层训练（含答案）", pages: 5 },
          ] },
          { name: "1.2 函数的基本性质", items: [
            { type: "课件", fmt: "PPT", title: "1.2 单调性·奇偶性·周期性 专题突破课件", pages: 40 },
            { type: "讲义", fmt: "讲义", title: "1.2 函数性质综合应用（讲义）", pages: 8 },
          ] },
        ],
      },
      {
        name: "专题二 导数及其应用",
        lessons: [
          { name: "2.1 导数的概念与几何意义", items: [
            { type: "课件", fmt: "PPT", title: "2.1 导数的概念与几何意义 一轮精讲课件", pages: 34 },
            { type: "讲义", fmt: "讲义", title: "2.1 导数的几何意义 易错点精讲（讲义）", pages: 6 },
            { type: "题集", fmt: "题集", title: "2.1 导数的几何意义 易错题精选", pages: 5 },
          ] },
          { name: "2.2 导数与函数单调性", items: [
            { type: "课件", fmt: "PPT", title: "2.2 导数与函数单调性 专题突破课件", pages: 36 },
            { type: "作业", fmt: "作业", title: "2.2 导数与单调性 分层训练（含答案）", pages: 5 },
          ] },
          { name: "2.3 导数中的恒成立与压轴", items: [
            { type: "讲义", fmt: "讲义", title: "2.3 恒成立与能成立问题 方法归纳（讲义）", pages: 7 },
            { type: "题集", fmt: "题集", title: "2.3 压轴题：导数中的恒成立问题精选", pages: 4 },
          ] },
        ],
      },
      {
        name: "综合检测",
        lessons: [
          { name: "专题综合检测", items: [
            { type: "试卷", fmt: "Word", title: "函数与导数 专题滚动训练卷（一）含答案", pages: 6, q: 22 },
            { type: "试卷", fmt: "Word", title: "函数与导数 综合检测卷（含解析）", pages: 8, q: 24 },
          ] },
        ],
      },
    ],
  },
];

// Mock textbook Q&A for 问教材
const TEXTBOOK_TREE = {
  edition: "人教版",
  subject: "生物学",
  grade: "高中必修1",
  chapters: [
    {
      name: "第5章 细胞的能量供应和利用",
      sections: [
        { name: "第1节 降低化学反应活化能的酶", active: false },
        { name: "第2节 细胞的能量\"货币\"ATP", active: false },
        { name: "第3节 ATP的主要来源——细胞呼吸", active: false },
        { name: "第4节 光合作用与能量转化", active: true },
      ],
    },
    {
      name: "第6章 细胞的生命历程",
      sections: [
        { name: "第1节 细胞的增殖", active: false },
        { name: "第2节 细胞的分化", active: false },
      ],
    },
  ],
};

const TEXTBOOK_ANSWER = {
  question: "光合作用的光反应和暗反应有什么区别？",
  summary:
    "光反应与暗反应是光合作用相互衔接的两个阶段，主要区别在于场所、条件、物质变化和能量变化四个方面。",
  points: [
    {
      label: "场所",
      light: "类囊体薄膜上",
      dark: "叶绿体基质中",
    },
    {
      label: "条件",
      light: "需要光、色素、酶",
      dark: "有光无光均可进行，需要多种酶",
    },
    {
      label: "物质变化",
      light: "水的光解释放 O₂，生成 [H] 和 ATP",
      dark: "CO₂ 的固定与 C₃ 的还原，生成有机物",
    },
    {
      label: "能量变化",
      light: "光能 → 活跃化学能（ATP）",
      dark: "活跃化学能 → 有机物中稳定化学能",
    },
  ],
  citations: [
    {
      id: "c1",
      source: "人教版生物 必修1",
      loc: "第5章 第4节 · P103",
      quote:
        "光反应阶段必须有光才能进行，在这个阶段中，叶绿体的色素吸收光能……水在光下分解为 [H] 和 O₂。",
    },
    {
      id: "c2",
      source: "人教版生物 必修1",
      loc: "第5章 第4节 · P104",
      quote:
        "暗反应阶段有光、无光都能进行……CO₂ 被 C₅ 固定形成 C₃，再被 [H] 还原成有机物。",
    },
  ],
};

// ---- AI memory / learned teacher profile (mock) ----
const USER_MEMORY = {
  teacher: "李",
  role: "初中数学教师",
  updated: "今天 09:24",
  summary:
    "最近一个月你主要在准备七年级数学，偏好人教版、难度多设为中等。常做随堂练习与单元测试，重点关注《有理数》《整式的加减》等章节；也收藏了不少配套微课与同步课件。",
  tags: [
    { k: "学科", v: "数学" },
    { k: "学段", v: "七年级·上册" },
    { k: "常用版本", v: "人教版" },
    { k: "偏好难度", v: "中等" },
    { k: "常做", v: "随堂练习" },
  ],
  stats: [
    { icon: "slides", label: "课件", n: 12 },
    { icon: "paper", label: "卷子", n: 8 },
    { icon: "lesson", label: "教案", n: 5 },
    { icon: "layers", label: "收藏", n: 36 },
    { icon: "download", label: "下载", n: 120 },
  ],
  recent: [
    { scenario: "paper", icon: "paper", hue: 25, title: "《有理数》随堂练习卷", meta: "人教版 · 七年级 · 中等", when: "昨天", done: true },
    { scenario: "courseware", icon: "slides", hue: 255, title: "《整式的加减》互动课件", meta: "人教版 · 七年级 · 2 课时", when: "3 天前", done: true },
    { scenario: "find", icon: "search", hue: 150, title: "一元一次方程 同步微课", meta: "已收藏 5 个资源", when: "上周", done: true },
  ],
  // discrete memories the AI has formed — shown & editable in 记忆管理
  entries: [
    { id: "e1", icon: "book", text: "常用人教版教材", basis: "近 30 天 25 次创作中 23 次选择人教版", on: true },
    { id: "e2", icon: "filter", text: "出题偏好「中等」难度", basis: "组卷 / 选题时多次设为中等", on: true },
    { id: "e3", icon: "paper", text: "当前重点是七年级上册数学", basis: "近期创作集中在《有理数》《整式的加减》", on: true },
    { id: "e4", icon: "lesson", text: "教案偏好「情境导入」结构", basis: "近 3 份教案均包含情境导入环节", on: true },
    { id: "e5", icon: "search", text: "喜欢配套微课与实验视频", basis: "收藏夹中有 12 个视频类资源", on: true },
  ],
  // last textbook the teacher was reading in 问教材
  textbook: { edition: "人教版", stage: "高中", book: "生物 · 必修1", section: "第5章 第4节 · 能量之源——光合作用", when: "2 天前" },
  // 历史对话 — past chat SESSIONS (process). Click to resume the conversation.
  conversations: [
    { id: "v1", scenario: "find", icon: "search", hue: 150, title: "一元一次方程 同步微课", last: "收藏了 5 个资源", when: "今天", messages: [
      { role: "ai", text: "老师你好，告诉我你要找什么，我会从学科网资源库为你精准匹配。" },
      { role: "user", text: "一元一次方程 同步微课" },
      { role: "ai", text: "好的，已从学科网资源库为你检索到 5 项相关资源。" },
      { role: "user", text: "第二个不错，收藏一下" },
      { role: "ai", text: "已收藏《一元一次方程》同步微课到你的内容。" },
    ] },
    { id: "v2", scenario: "courseware", icon: "slides", hue: 255, title: "《整式的加减》课件", last: "加一个抢答环节", when: "昨天", messages: [
      { role: "ai", text: "好的，我来帮你做课件。告诉我课题，或者在右侧选好教材章节，我先给你列个大纲。" },
      { role: "user", text: "人教版七年级上 整式的加减 课件" },
      { role: "ai", text: "大纲已列在右侧了，你可以增删条目、调整顺序。满意后点「生成课件内容」。" },
      { role: "user", text: "加一个抢答环节" },
      { role: "ai", text: "已在「课堂互动」模块中加入抢答环节。" },
    ] },
    { id: "v3", scenario: "lesson", icon: "lesson", hue: 320, title: "《数轴》教案（情境导入）", last: "导出为 Word", when: "上周", messages: [
      { role: "ai", text: "好的，我来帮你写教案。告诉我课题，或者在右侧选好教材章节，我先给你列个大纲。" },
      { role: "user", text: "人教版七年级上 数轴 教案，情境导入" },
      { role: "ai", text: "大纲已列好，共 5 个模块。确认后点「生成教案内容」。" },
      { role: "user", text: "确认，开始生成" },
      { role: "ai", text: "《数轴》的教案已经写好了，共 5 个模块。可以点「编辑」继续改，也可以直接下载。" },
    ] },
    { id: "v4", scenario: "mindmap", icon: "mindmap", hue: 95, title: "《有理数》知识网络图", last: "已生成思维导图", when: "上周", messages: [
      { role: "ai", text: "好的，我来帮你画导图。告诉我主题，我直接生成。" },
      { role: "user", text: "人教版七年级上 有理数 知识网络图" },
      { role: "ai", text: "《有理数》的思维导图已经画好了，右侧可以编辑节点。" },
    ] },
  ],
  // 我的内容 — everything the teacher has: AI-generated, or downloaded from 找资源…
  works: [
    { id: "w1", scenario: "paper", icon: "paper", hue: 25, title: "《有理数》随堂练习卷", kind: "试卷", source: "AI 生成", meta: "人教版 · 七年级 · 中等 · 12 题", when: "昨天", status: "done" },
    { id: "w2", scenario: "courseware", icon: "slides", hue: 255, title: "《整式的加减》互动课件", kind: "互动课件", source: "AI 生成", meta: "人教版 · 七年级 · 18 页 · 2 课时", when: "3 天前", status: "done" },
    { id: "w3", scenario: "lesson", icon: "lesson", hue: 320, title: "《数轴》教学设计", kind: "教案", source: "AI 生成", meta: "人教版 · 七年级 · 情境导入", when: "上周", status: "done" },
    { id: "w7", scenario: "find", icon: "slides", hue: 210, title: "《一元一次方程》名师同步课件", kind: "课件", source: "找资源下载", meta: "人教版 · 七年级 · 来自资源库", when: "上周", status: "saved" },
    { id: "w4", scenario: "paper", icon: "paper", hue: 25, title: "第一单元《有理数》单元测试", kind: "试卷", source: "找资源下载", meta: "人教版 · 七年级 · 中等 · 24 题", when: "上周", status: "saved" },
    { id: "w5", scenario: "courseware", icon: "slides", hue: 255, title: "《正数和负数》导入课件", kind: "PPT 课件", source: "AI 生成", meta: "人教版 · 七年级 · 12 页", when: "2 周前", status: "draft" },
    { id: "w6", scenario: "mindmap", icon: "mindmap", hue: 95, title: "《有理数》知识网络图", kind: "思维导图", source: "AI 生成", meta: "人教版 · 七年级 · 一章", when: "2 周前", status: "done" },
  ],
};

// 跨教材对比 — same knowledge point across editions (问教材 multi-book compare)
const TEXTBOOK_COMPARE = {
  question: "「光合作用」这个知识点在哪些教材里出现过？各版本怎么讲的？",
  topic: "光合作用",
  summary:
    "「光合作用」在初中与高中多版本教材中均有编排，但深度与侧重差异明显：初中重在现象与意义，高中深入到光反应 / 暗反应的物质与能量变化。共在 4 个版本中检索到对应章节。",
  editions: [
    {
      edition: "人教版", stage: "高中", book: "生物 · 必修1", loc: "第5章 第4节 · P101–105", depth: "深入（机理）",
      angle: "以「能量之源」为线索，系统讲解光反应与暗反应的场所、条件、物质与能量变化，含经典实验（恩格尔曼、鲁宾与卡门同位素标记）。",
      quote: "光反应阶段必须有光才能进行……暗反应阶段有光、无光都能进行，CO₂ 被 C₅ 固定形成 C₃。",
      tags: ["光反应/暗反应", "同位素标记实验", "ATP 与 [H]"],
    },
    {
      edition: "统编版（北师大）", stage: "高中", book: "生物 · 必修1", loc: "第3章 第5节", depth: "深入（机理）",
      angle: "先呈现探究历程（普利斯特利、英格豪斯实验），再归纳反应式，强调科学史与探究方法。",
      quote: "绿色植物通过叶绿体，利用光能，把二氧化碳和水转化成储存着能量的有机物，并释放出氧气。",
      tags: ["科学史导入", "探究方法", "反应式归纳"],
    },
    {
      edition: "人教版", stage: "初中", book: "生物 · 七年级上册", loc: "第3单元 第4章 · P119", depth: "基础（现象与意义）",
      angle: "从绿叶在光下制造有机物的实验切入，重点是光合作用的概念、原料产物与对生物圈的意义，不涉及光暗反应。",
      quote: "光合作用是指绿色植物通过叶绿体，利用光能，制造有机物并释放氧气的过程。",
      tags: ["淀粉检验实验", "原料与产物", "对生物圈的意义"],
    },
    {
      edition: "苏教版", stage: "初中", book: "生物 · 七年级上册", loc: "第3章 第6节", depth: "基础（现象与意义）",
      angle: "结合「绿色植物是有机物的生产者」展开，突出光合作用与呼吸作用的对比，贴近生活应用。",
      quote: "光合作用制造的有机物，不仅满足了自身的需要，还为其他生物提供了食物和能量来源。",
      tags: ["与呼吸作用对比", "生活应用", "有机物的生产"],
    },
  ],
  diff: [
    { aspect: "深度", junior: "现象、概念、意义", senior: "光反应 / 暗反应的物质与能量变化" },
    { aspect: "实验", junior: "绿叶在光下制造淀粉（碘液检验）", senior: "同位素标记、叶绿体色素提取分离" },
    { aspect: "落点", junior: "对生物圈 / 食物链的意义", senior: "反应机理与能量转化、ATP" },
  ],
};

// ---- 改作业 mock data：单份精批 + 整班批改 ----
const GRADE_DATA = {
  single: {
    student: "王梓涵",
    title: "《有理数》随堂练习",
    subject: "数学", grade: "七年级", edition: "人教版",
    total: 100, score: 86, correctRate: 82, used: "约 12 秒",
    questions: [
      { n: 1, type: "选择", status: "right", stu: "B", ans: "B", got: 4, full: 4, point: "相反数的概念" },
      { n: 2, type: "选择", status: "wrong", stu: "C", ans: "D", got: 0, full: 4, point: "有理数大小比较", reason: "两个负数比较大小时，绝对值大的反而小——把 −3 当成比 −1 大了。" },
      { n: 3, type: "填空", status: "right", stu: "−7", ans: "−7", got: 4, full: 4, point: "绝对值" },
      { n: 4, type: "填空", status: "wrong", stu: "8", ans: "−8", got: 0, full: 4, point: "去括号法则", reason: "去括号时括号前是负号，括号内各项都要变号，漏变了符号。" },
      { n: 5, type: "计算", status: "right", stu: "−1", ans: "−1", got: 8, full: 8, point: "有理数混合运算" },
      { n: 6, type: "计算", status: "half", stu: "过程见卷", ans: "−5/6", got: 6, full: 10, point: "分数四则运算", reason: "运算顺序正确，但通分时最小公倍数取错，最后结果未化为最简分数。" },
      { n: 7, type: "解答", status: "half", stu: "过程见卷", ans: "见解析", got: 8, full: 12, point: "数轴与绝对值应用", reason: "建模思路清晰，分类讨论时漏掉了点在原点左侧的情形，丢了一种解。" },
    ],
    comment: "整体掌握良好，基本运算法则清晰、书写规范。失分集中在两类：① 负数的大小比较与符号处理（第 2、4 题）；② 解答题分类讨论不全面（第 7 题）。建议本周针对「负号与绝对值」再做一组专项练习，并在解答题中养成「先列举所有情形」的习惯。",
  },
  classMode: {
    title: "八（3）班 ·《有理数》随堂练习",
    count: 42, graded: 42, avg: 78.5, max: 98, min: 41, passRate: 88, excellentRate: 26,
    perQuestion: [
      { n: 1, rate: 95 }, { n: 2, rate: 62 }, { n: 3, rate: 90 }, { n: 4, rate: 55 },
      { n: 5, rate: 83 }, { n: 6, rate: 67 }, { n: 7, rate: 48 },
    ],
    commonErrors: [
      { q: "第 2 题", point: "有理数大小比较", rate: 38, note: "两个负数比较，误以为绝对值大的更大" },
      { q: "第 4 题", point: "去括号法则", rate: 45, note: "括号前为负号时漏变内部各项符号" },
      { q: "第 7 题", point: "分类讨论", rate: 52, note: "数轴应用题中遗漏点在原点左侧的情形" },
    ],
    weakPoints: ["负数的大小比较与符号处理", "去括号法则的符号变化", "解答题的分类讨论意识"],
    watch: [
      { name: "陈一鸣", score: 41, note: "多道基础题失分，符号概念需个别辅导" },
      { name: "刘思远", score: 53, note: "运算法则薄弱，建议补充基础训练" },
      { name: "周子萱", score: 58, note: "会做但书写不规范，过程分丢失较多" },
    ],
  },
};

// 暂时隐藏的场景（首页快捷、工作台场景切换胶囊、通用助手入口都不展示；仍可从左侧菜单进入）
const HIDDEN_SCENARIOS = ["paper", "textbook", "grade", "explain", "image", "agent"];

window.AIDATA = { SCENARIOS, GENERAL, HIDDEN_SCENARIOS, HOME_EXAMPLES, RESOURCES, TEXTBOOK_TREE, TEXTBOOK_ANSWER, TEXTBOOK_COMPARE, VIDEOS, ALBUMS, USER_MEMORY, GRADE_DATA };
