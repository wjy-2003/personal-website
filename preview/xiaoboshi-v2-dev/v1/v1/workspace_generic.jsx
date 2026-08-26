// workspace_generic.jsx — scaffold for the other scenarios
const { useState: gS } = React;

const GENERIC_CONFIG = {
  paper: {
    canvasTitle: "试卷预览",
    canvasNote: "组好的卷子会在这里成型 —— 题目均取自权威题库",
    greet: (q) => <span>好的，我来帮你<b style={{ color: "var(--brand-deep)" }}>组卷</b>。先从学科网权威题库选题，再按难度梯度排布。你希望多少道题、哪些题型？</span>,
    sugs: ["20 道，选择+填空+解答", "难度梯度由易到难", "附标准答案与解析"],
    blocks: ["一、选择题（10 题）", "二、填空题（6 题）", "三、解答题（4 题）"],
  },
  courseware: {
    canvasTitle: "课件大纲",
    canvasNote: "课件页面会在这里逐张生成 —— 结构对齐权威教案",
    greet: (q) => <span>我来帮你做<b style={{ color: "var(--brand-deep)" }}>课件</b>。我会参照学科网权威教案搭建框架，再逐页填充。先确认课时与重点？</span>,
    sugs: ["两课时", "突出情境导入", "每页配板书要点"],
    blocks: ["封面 · 课题", "情境导入", "新知讲解", "课堂练习", "小结与作业"],
  },
  lesson: {
    canvasTitle: "教案正文",
    canvasNote: "教学设计会在这里成稿 —— 三维目标对齐课程标准",
    greet: (q) => <span>我来帮你写<b style={{ color: "var(--brand-deep)" }}>教案</b>。依据课程标准生成三维目标、重难点与教学过程，所有内容可溯源到权威范例。</span>,
    sugs: ["补充教学反思", "重难点再细化", "加入分层作业"],
    blocks: ["教学目标（三维）", "教学重难点", "教学过程", "板书设计", "作业布置"],
  },
  mindmap: {
    canvasTitle: "思维导图",
    canvasNote: "知识结构会在这里展开 —— 知识点取自权威教材",
    greet: (q) => <span>我来帮你<b style={{ color: "var(--brand-deep)" }}>画导图</b>。按教材章节把知识点梳理成层级结构，你可以随时增删节点。</span>,
    sugs: ["按重要程度标注", "补充易错点", "导出为图片"],
    blocks: ["中心主题", "一级分支 ×4", "二级知识点 ×12"],
  },
  interactive: {
    canvasTitle: "互动预览",
    canvasNote: "可点选 / 拖拽的互动环节会在这里生成 —— 内容基于权威素材",
    greet: (q) => <span>我来帮你做<b style={{ color: "var(--brand-deep)" }}>互动课件</b>。可生成抢答、连线、拖拽分类等课堂活动，素材来自权威资源库。</span>,
    sugs: ["做一个拖拽分类", "加入抢答环节", "适合小组合作"],
    blocks: ["互动 1 · 拖拽分类", "互动 2 · 抢答", "互动 3 · 连一连"],
  },
};

const GENERIC_COLD = {
  paper: ["按湖北中考结构 出一份物理中考模拟卷", "八上生物这节课 选择题30道，答案放最后", "平面向量 概念与模 出10道题，含解析", "苏教版六下数学 扇形统计图 常考易错题", "正余弦定理 易错题专项"],
  lesson: ["北师大版八下 平行四边形的判定 教学设计", "部编版历史八下 第18课 教学设计", "高一英语外研社必修2 Unit6 教材+学情分析", "苏教版六下数学《正比例的意义》学习任务单", "强军战歌 教学设计（音乐）"],
  mindmap: ["七下数学 第七章 相交线 思维导图", "九年级 二次函数 思维导图", "高中政治部编版 选必二第一课 思维导图", "中考一轮复习 分式 考点思维导图", "三年级下册《荷花》思维导图"],
  interactive: ["勾股定理 互动探究动画（HTML）", "光合作用过程 拖拽分类活动", "单词消消乐 七下英语预习用", "平行四边形动态演示 固定一边和对角线", "古诗文名句 连线抢答"],
};

function GenericWorkspace({ scenario, query, onHome, onSwitch, fromIntent, resume, nav }) {
  const cfg = GENERIC_CONFIG[scenario.id] || GENERIC_CONFIG.paper;
  const colds = GENERIC_COLD[scenario.id] || GENERIC_COLD.paper;
  const isResume = !!resume;
  const gStored = window.ChatSession.scratch[scenario.id] || {};
  const [qShown, setQShown] = gS(query || gStored.query || "");
  const [started, setStarted] = gS((!!query && !fromIntent) || isResume || !!gStored.started);

  const restoreNote = () => (
    <span>
      已为你恢复 <b>{resume.when}</b> 创作的《{(resume.title || "").replace(/[《》]/g, "")}》，下面就是当时的成稿——你可以接着上次的进度继续修改。
    </span>
  );

  const [messages, setMessages] = gS(() => {
    if (isResume) {
      return [
        { role: "ai", node: restoreNote() },
      ];
    }
    if (fromIntent && query) {
      return [
        ...window.ChatSession.take(),
        ...window.takeSwitchDivider(scenario, window.ChatSession.log.length > 0),
        ...(window.ChatSession.echoed(query) ? [] : [{ role: "user", text: query }]),
        { role: "ai", wide: true, intent: query, render: () => <InlineIntent query={query} onDone={() => { setStarted(true); setMessages((m) => [...m, { role: "ai", node: cfg.greet(query) }]); }} /> },
      ];
    }
    if (query) return [...window.ChatSession.take(), ...window.takeSwitchDivider(scenario, window.ChatSession.log.length > 0), ...(window.ChatSession.echoed(query) ? [] : [{ role: "user", text: query }]), { role: "ai", node: cfg.greet(query) }];
    return window.enterThread(scenario, cfg.greet(query));
  });
  const [sugs, setSugs] = gS((query && !fromIntent) || isResume || gStored.started ? cfg.sugs : []);
  const [built, setBuilt] = gS((!!query && !fromIntent) || isResume || !!gStored.started);
  // persist the thread — one assistant conversation across scenario switches
  React.useEffect(() => { window.ChatSession.save(window.freezeChat(messages)); }, [messages]);
  // keep this stage's progress so switching scenarios doesn't reset it
  React.useEffect(() => { window.ChatSession.scratch[scenario.id] = { started, query: qShown }; }, [started, qShown]);

  const MEM_NOTE = {
    paper: "已按你的记忆默认 人教版 · 七年级 · 数学，难度梯度参考你常出的中等偏上。",
    courseware: "已套用你的记忆：人教版 · 七年级 · 数学，并沿用你偏好的情境导入风格。",
    lesson: "已按你的记忆默认 人教版 · 七年级 · 数学，三维目标对齐你常用的课标版本。",
    mindmap: "已按你的记忆默认 人教版 · 七年级 · 数学 的章节结构来梳理。",
    interactive: "已套用你的记忆：人教版 · 七年级 · 数学，活动难度贴合你的班级学情。",
  };

  const handleSend = (text, files) => {
    setMessages((m) => [...m, { role: "user", text, files }, { role: "ai", typing: true }]);
    const wasStarted = started;
    if (!started) { setStarted(true); setSugs(cfg.sugs); setQShown(text); }
    setTimeout(() => {
      const art = !wasStarted ? { scenario: scenario.id, icon: scenario.icon, title: text, meta: cfg.canvasTitle } : undefined;
      const note = !wasStarted
        ? <span>好的，正在为你生成「{text}」，内容以学科网<b style={{ color: "var(--auth-ink)" }}>权威资源</b>为底座，稍后即可见到框架。</span>
        : files && files.length
        ? <span>已结合你上传的材料更新。所有内容以学科网<b style={{ color: "var(--auth-ink)" }}>三审三校</b>权威资源为底座。</span>
        : <span>已根据「{text}」更新。所有内容均以学科网<b style={{ color: "var(--auth-ink)" }}>三审三校</b>权威资源为底座。</span>;
      setMessages((m) => [...m.slice(0, -1), { role: "ai", node: note, artifact: art }]);
      setBuilt(true);
    }, 700);
  };
  const { headerRecognizing, send } = useSmartSend({ scenarioId: scenario.id, onSwitch, setMessages, localSend: handleSend });

  return (
    <WorkspaceShell scenario={scenario} onHome={onHome} onSwitch={onSwitch} nav={nav} headerRecognizing={headerRecognizing} mobilePanelLabel={cfg.canvasTitle} mobilePanelIcon={scenario.icon} openSheetKey={built ? "gn" + messages.length : null}>
      <ChatPanel messages={messages} onSend={send} suggestions={sugs} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "var(--canvas)" }}>
        <div style={{ padding: "13px 22px", borderBottom: "1px solid var(--line)", background: "var(--surface)", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14.5, fontWeight: 800, color: "var(--ink)" }}>{cfg.canvasTitle}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--auth-ink)", fontWeight: 700 }}>
            <Icon name="shield" size={13} /> 权威底座
          </span>
          <div style={{ flex: 1 }} />
          <Btn size="sm" kind="soft" icon="download">导出</Btn>
        </div>
        {!started ? (
          <div style={{ flex: 1, overflowY: "auto", display: "grid", placeItems: "center", padding: "30px 24px" }}>
            <div className="home-fade" style={{ width: "min(540px, 100%)", textAlign: "center" }}>
              <div style={{ display: "inline-flex", marginBottom: 14 }}><ScenarioGlyph icon={scenario.icon} hue={scenario.hue} size={56} active /></div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", margin: "0 0 7px" }}>来做{scenario.name}吧</h2>
              <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "0 0 22px", lineHeight: 1.6 }}>{scenario.desc}。在左侧描述需求，或从下面的例子开始：</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {colds.map((c, i) => (
                  <button key={i} onClick={() => handleSend(c)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "13px 16px", borderRadius: 13, border: "1px solid var(--line)", background: "var(--surface)", cursor: "pointer", fontFamily: "var(--font-zh)", textAlign: "left", transition: "all .15s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.transform = "none"; }}>
                    <Icon name="spark" size={16} />
                    <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{c}</span>
                    <Icon name="arrow" size={15} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
        <div style={{ flex: 1, overflowY: "auto", padding: "24px clamp(20px,5%,56px)" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 12px", borderRadius: 999, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", fontSize: 12, fontWeight: 700, color: "var(--brand-deep)" }}>
              <ScenarioGlyph icon={scenario.icon} hue={scenario.hue} size={20} /> {scenario.name} · {qShown || query || scenario.sample}
            </div>
            {isResume && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 999, background: "var(--surface-2)", border: "1px solid var(--line)", fontSize: 11.5, fontWeight: 700, color: "var(--ink-3)" }}>
                <CIcon name="history" size={13} /> 历史创作 · 恢复自{resume.when}
              </span>
            )}
          </div>
            {!isResume && <MemoryNote text={MEM_NOTE[scenario.id] || MEM_NOTE.paper} style={{ marginBottom: 14 }} />}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {cfg.blocks.map((b, i) => (
                <div key={i} className={built ? "block-pop" : ""} style={{ animationDelay: `${i * 0.08}s`, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ width: 26, height: 26, borderRadius: 8, background: "var(--brand-soft)", color: "var(--brand-deep)", fontSize: 12, fontWeight: 800, display: "grid", placeItems: "center", flexShrink: 0, fontFamily: "var(--font-num)" }}>{i + 1}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{b}</span>
                  <div style={{ flex: 1 }} />
                  <div className="ph-stripe" style={{ width: 120, height: 12, borderRadius: 4 }} />
                </div>
              ))}
              <div style={{ textAlign: "center", padding: "20px 16px", color: "var(--ink-3)", fontSize: 13, lineHeight: 1.6 }}>
                <div style={{ display: "inline-flex", marginBottom: 8, color: "var(--line)" }}>
                  <Icon name={scenario.icon} size={36} sw={1.4} />
                </div>
                <div>{cfg.canvasNote}</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>（此场景为流程占位演示，重点已落在「找资源」「问教材」「做课件」）</div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </WorkspaceShell>
  );
}

Object.assign(window, { GenericWorkspace });
