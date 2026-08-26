// intentflow.jsx — AI intent recognition transition
const { useState: useStateIF, useEffect: useEffectIF } = React;

// crude keyword-based intent detection over the 7 scenarios
function detectScenario(text) {
  const t = text || "";
  // grading is checked first — it must win over data-analysis & paper when a
  // teacher says 批改/改作业 (even if the query also mentions 卷 or 质量分析).
  if (/(批改|改作业|阅卷|批一批|批一下|批这|帮我批|打个分|评分并|写评语)/.test(t)) return "grade";
  // route teaching-consult / planning / data-analysis / translation to the
  // general assistant FIRST — these shouldn't be pulled into a making-tool.
  if (/(公开课|有什么建议|有何建议|教学建议|怎么(上|讲|教|引入)|如何(上|讲|教|提升|引入|设计)|教学计划|复习计划|备考方案|教学规划|教学反思|心得体会)/.test(t)) return "general";
  if (/(平均分|及格率|优秀率|质量分析|成绩分析|学情分析)/.test(t) && /\d/.test(t)) return "general";
  if (/(翻译|translate)/.test(t)) return "general";
  const rules = [
    { id: "grade", kw: ["批改", "批批", "改作业", "改一下", "打分", "评分", "阅卷", "给这份", "这份作业", "学生作业", "错因", "写评语", "批一下"] },
    { id: "paper", kw: ["卷", "试卷", "组卷", "测试卷", "考试", "练习卷", "测验", "出题", "出一道", "出一套", "命题", "变式题", "每日一练"] },
    { id: "lesson", kw: ["教案", "教学设计", "详案", "学案", "导学案", "学习任务单", "说课"] },
    { id: "courseware", kw: ["课件", "ppt", "幻灯", "演示", "互动", "拖拽", "课堂活动", "抢答", "互动课件"] },
    { id: "mindmap", kw: ["导图", "思维导图", "知识结构", "脑图"] },
    { id: "textbook", kw: ["区别", "为什么", "什么是", "原理", "讲讲", "怎么理解", "有什么不同", "怎么证明", "是什么意思"] },
    { id: "find", kw: ["找", "搜索", "查找", "资源", "练习", "微课", "素材", "下载", "真题", "课件", "讲义", "知识清单", "视频", "专辑", "合集", "实验"] },
  ];
  for (const r of rules) {
    if (r.kw.some((k) => t.toLowerCase().includes(k.toLowerCase()))) return r.id;
  }
  return "general";
}

// Stricter detector used for RE-ROUTING inside a workspace. Only fires on an
// explicit "make a different thing" cue — weak/ambiguous words (题, 练习, 互动…)
// must NOT pull the teacher out of the tool they're already iterating in.
function detectSwitchTarget(text) {
  const t = (text || "").toLowerCase();
  const strong = [
    { id: "grade", kw: ["批改作业", "批一批", "改作业", "批改这", "整班批改", "帮我批改", "打个分", "评分并", "阅卷", "生成质量分析"] },
    { id: "paper", kw: ["出卷", "出一份卷", "出张卷", "组卷", "出试卷", "出一套", "出份卷", "生成试卷", "出测试卷", "出练习卷", "来份卷子", "出个卷子", "出份卷子", "做份卷子", "做一份卷子", "出道卷子"] },
    { id: "lesson", kw: ["写教案", "出教案", "做教案", "生成教案", "教学设计", "写个教案", "来份教案"] },
    { id: "courseware", kw: ["做课件", "做个课件", "做ppt", "做个ppt", "生成课件", "做互动课件", "来个课件", "做张ppt", "做幻灯", "做演示文稿"] },
    { id: "mindmap", kw: ["思维导图", "画导图", "做导图", "知识导图", "脑图", "画个导图", "画张导图"] },
    { id: "find", kw: ["找资源", "找一些", "找一份", "找点", "找几份", "找现成", "搜资源", "搜一些", "下载资源", "有没有现成"] },
    { id: "textbook", kw: ["问教材", "查教材", "翻教材", "教材里", "课本里", "课本上", "教材上"] },
  ];
  for (const r of strong) {
    if (r.kw.some((k) => t.includes(k))) return r.id;
  }
  return null; // no explicit switch cue
}

// extract pseudo entities to display
function extractEntities(text) {
  const t = text || "";
  const ents = [];
  const editions = ["人教版", "北师大版", "苏教版", "外研版", "统编版", "沪教版"];
  const grades = ["七年级", "八年级", "九年级", "高一", "高二", "高三", "初一", "初二", "初三", "一年级", "二年级", "三年级", "四年级", "五年级", "六年级"];
  const subjects = ["语文", "数学", "英语", "物理", "化学", "生物", "历史", "地理", "政治", "道德与法治", "科学"];
  editions.forEach((e) => t.includes(e) && ents.push({ k: "版本", v: e }));
  grades.forEach((g) => t.includes(g) && ents.push({ k: "学段", v: g }));
  subjects.forEach((s) => t.includes(s) && ents.push({ k: "学科", v: s }));
  // grab a 《》 topic
  const m = t.match(/《(.+?)》/);
  if (m) ents.push({ k: "知识点", v: m[1] });
  if (ents.length === 0) ents.push({ k: "需求", v: "教学创作" });
  return ents;
}

// Whitelist: only these scenarios auto-route; others get legacy fallback
const INTENT_WHITELIST = ["find", "courseware", "lesson", "mindmap"];
const LEGACY_MAP = {
  paper: { intent: "出卷子", entry: "智能组卷" },
  textbook: { intent: "问教材", entry: "教材百科" },
  grade: { intent: "改作业", entry: "作文批改" },
  explain: { intent: "讲卷", entry: "AI 讲卷" },
  image: { intent: "生成图片", entry: "AI 生图" },
  agent: { intent: "智能体", entry: "智能体" },
};

function detectMultiIntent(text) {
  const t = (text || "").toLowerCase();
  const groups = [
    { id: "find", kw: ["找资源","找一份","找一些","找点","搜资源","找现成","找几份","找份"] },
    { id: "courseware", kw: ["做课件","做个课件","生成课件","做ppt","做个ppt"] },
    { id: "lesson", kw: ["写教案","做教案","生成教案"] },
    { id: "mindmap", kw: ["思维导图","画导图","做导图"] },
  ];
  const hits = groups.filter(g => g.kw.some(k => t.includes(k)));
  return hits.length > 1 ? hits.map(h => h.id) : null;
}

function resolveIntent(query) {
  const multi = detectMultiIntent(query);
  if (multi) return { type: "multi", intents: multi, entities: extractEntities(query) };
  const raw = detectScenario(query);
  const entities = extractEntities(query);
  const hidden = window.AIDATA.HIDDEN_SCENARIOS || [];
  if (raw === "general") return { type: "nomatch", entities };
  if (hidden.includes(raw)) return { type: "legacy", scenarioId: raw, legacy: LEGACY_MAP[raw] || { intent: raw, entry: raw }, entities };
  const scenario = (window.AIDATA.SCENARIOS || []).find(s => s.id === raw);
  return { type: "hit", scenarioId: raw, scenario, entities };
}

function IntentFlow({ query, onDone }) {
  const S = window.AIDATA.SCENARIOS;
  const target = detectScenario(query);
  const scenario = S.find((s) => s.id === target);
  const entities = extractEntities(query);
  const [step, setStep] = useStateIF(0);
  // steps: 0 understand, 1 entities, 2 retrieve authority, 3 matched, 4 done->transition

  useEffectIF(() => {
    const timers = [];
    timers.push(setTimeout(() => setStep(1), 700));
    timers.push(setTimeout(() => setStep(2), 1500));
    timers.push(setTimeout(() => setStep(3), 2500));
    timers.push(setTimeout(() => setStep(4), 3450));
    timers.push(setTimeout(() => onDone(target), 4350));
    return () => timers.forEach(clearTimeout);
  }, []);

  const Step = ({ idx, icon, children, accent }) => {
    const state = step > idx ? "done" : step === idx ? "active" : "wait";
    return (
      <div
        style={{
          display: "flex",
          gap: 14,
          alignItems: "flex-start",
          opacity: state === "wait" ? 0.3 : 1,
          transform: state === "wait" ? "translateY(6px)" : "none",
          transition: "all .4s ease",
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            background:
              state === "done"
                ? "var(--brand)"
                : state === "active"
                ? "var(--brand-soft)"
                : "var(--line)",
            color: state === "done" ? "#fff" : "var(--brand)",
            border: state === "active" ? "2px solid var(--brand)" : "none",
            transition: "all .3s",
          }}
        >
          {state === "done" ? (
            <Icon name="check" size={16} sw={2.6} />
          ) : (
            <Icon name={icon} size={15} sw={2} />
          )}
        </div>
        <div style={{ flex: 1, paddingTop: 3 }}>{children}</div>
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "var(--intent-bg)",
      }}
    >
      <div
        className="intent-card"
        style={{
          width: "min(560px, 92vw)",
          background: "var(--surface)",
          borderRadius: 26,
          border: "1px solid var(--line)",
          boxShadow: "0 40px 90px -50px rgba(0,0,0,.45)",
          padding: "34px 34px 30px",
        }}
      >
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
          <div style={{ position: "relative" }}>
            <BotAvatar size={48} glow />
            <span className="bot-ring" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", display: "flex", alignItems: "center", gap: 8 }}>
              AI 小博士正在理解 {step < 4 && <Dots />}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 600 }}>
              意图识别 · 自动匹配场景
            </div>
          </div>
        </div>

        {/* user query echo */}
        <div
          style={{
            background: "var(--brand-soft)",
            border: "1px solid var(--brand-soft-border)",
            borderRadius: "16px 16px 16px 4px",
            padding: "12px 15px",
            margin: "16px 0 22px",
            fontSize: 14.5,
            color: "var(--brand-deep)",
            lineHeight: 1.6,
            fontWeight: 500,
          }}
        >
          "{query}"
        </div>

        {/* steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Step idx={0} icon="spark">
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)" }}>理解你的需求</div>
          </Step>

          <Step idx={1} icon="filter">
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)", marginBottom: step >= 1 ? 9 : 0 }}>
              提取关键信息
            </div>
            {step >= 1 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {entities.map((e, i) => (
                  <span
                    key={i}
                    className="ent-pop"
                    style={{
                      animationDelay: `${i * 0.09}s`,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "4px 10px",
                      borderRadius: 8,
                      background: "var(--surface-2)",
                      border: "1px solid var(--line)",
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: "var(--ink-2)",
                    }}
                  >
                    <span style={{ color: "var(--ink-3)", fontSize: 11 }}>{e.k}</span>
                    <span style={{ color: "var(--brand-deep)", fontWeight: 700 }}>{e.v}</span>
                  </span>
                ))}
              </div>
            )}
          </Step>

          <Step idx={2} icon="shield">
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)" }}>
              检索学科网权威资源库
            </div>
            {step >= 2 && (
              <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 4, lineHeight: 1.5 }}>
                匹配 <b style={{ color: "var(--auth-ink)" }}>三审三校</b> 精品内容作为创作底座
              </div>
            )}
          </Step>

          <Step idx={3} icon="check">
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)" }}>识别场景</div>
            {step >= 3 && (
              <div
                className="match-pop"
                style={{
                  marginTop: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 12,
                  borderRadius: 14,
                  background: `oklch(0.96 0.04 ${scenario.hue})`,
                  border: `1px solid oklch(0.82 0.08 ${scenario.hue})`,
                }}
              >
                <ScenarioGlyph icon={scenario.icon} hue={scenario.hue} size={42} active />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)" }}>{scenario.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 1 }}>{scenario.tagline}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: `oklch(0.5 0.14 ${scenario.hue})`, fontFamily: "var(--font-num)" }}>
                    97%
                  </div>
                  <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}>匹配度</div>
                </div>
              </div>
            )}
          </Step>
        </div>

        {step >= 4 && (
          <div className="enter-pop" style={{ marginTop: 22, textAlign: "center", fontSize: 13.5, color: "var(--ink-2)", fontWeight: 600 }}>
            正在进入 <b style={{ color: "var(--brand-deep)" }}>{scenario.name}</b> 工作台…
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { IntentFlow, detectScenario, detectSwitchTarget, extractEntities, resolveIntent, detectMultiIntent, INTENT_WHITELIST, LEGACY_MAP });

// ---- Inline intent recognition: lives inside a chat bubble ----
// PRD: process state ("正在理解你的需求…") → brief result (~0.5s) → collapsed one-line.
// No step checklist, no confidence score.
function InlineIntent({ query, onDone, instant }) {
  const result = resolveIntent(query);
  const [phase, setPhase] = React.useState(instant ? "collapsed" : "loading");
  React.useEffect(() => {
    if (instant) return;
    const t1 = setTimeout(() => {
      setPhase("collapsed");
      onDone && onDone(result);
    }, 1200);
    return () => clearTimeout(t1);
  }, []);
  const entities = result.entities ? result.entities.filter(e => e.k !== "需求") : [];
  let lineContent;
  if (result.type === "hit") {
    const ps = entities.length > 0 ? entities.map(e => e.v).join(" · ") : "";
    lineContent = ps
      ? <span>已识别：<b style={{ color: "var(--ink)" }}>{ps}</b> → <b style={{ color: `oklch(0.45 0.12 ${result.scenario.hue})` }}>{result.scenario.name}</b></span>
      : <span>已识别 → <b style={{ color: `oklch(0.45 0.12 ${result.scenario.hue})` }}>{result.scenario.name}</b></span>;
  } else if (result.type === "multi") {
    lineContent = "识别到多个需求，先和你确认先做哪个";
  } else {
    lineContent = "未匹配到特定场景，直接为你解答";
  }
  if (phase === "loading") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-2)", fontWeight: 600, padding: "2px 0" }}>
        <span className="mini-spin" style={{ width: 14, height: 14 }} />
        正在理解你的需求…
      </div>
    );
  }
  return (
    <div style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 500, padding: "2px 0", animation: "pulseBg .5s ease" }}>
      {lineContent}
    </div>
  );
}

// Multi-intent confirmation: user picks which task to do first
function MultiIntentAsk({ intents, onPick }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.7 }}>
        你是想先{intents.map((s, i) => (
          <React.Fragment key={s.id}>
            {i > 0 && "，还是先"}
            <b style={{ color: `oklch(0.45 0.12 ${s.hue})` }}>{s.name}</b>
          </React.Fragment>
        ))}？我可以一件一件来。
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {intents.map(s => (
          <button key={s.id} onClick={() => onPick(s.id)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 10, border: `1px solid oklch(0.84 0.07 ${s.hue})`, background: `oklch(0.96 0.04 ${s.hue})`, cursor: "pointer", fontFamily: "var(--font-zh)", fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>
            <ScenarioGlyph icon={s.icon} hue={s.hue} size={24} active />
            先{s.name}
          </button>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { InlineIntent, MultiIntentAsk });
