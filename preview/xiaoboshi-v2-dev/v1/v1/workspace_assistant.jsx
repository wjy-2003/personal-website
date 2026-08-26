// workspace_assistant.jsx — 通用助手 (general assistant)
// Intent recognition happens HERE first; if a specific scenario is matched,
// we hand off to that workspace. Otherwise the assistant answers directly.
const { useState: gaS, useEffect: gaE, useRef: gaR } = React;

// ---- content-aware mock answers (knowledge Q&A / teaching consult / grade analysis) ----
// A small hand-written knowledge base + pattern responses so the assistant feels
// like it actually answered, instead of echoing a template.
const GA_KB = [
  { re: /悬浊液|乳浊液/, title: "悬浊液 vs 乳浊液", body: [
    "都是把一种物质分散到液体里、静置会分层的不均一、不稳定混合物，区别在分散质的状态：",
    "· 悬浊液：固体小颗粒分散在液体中，如泥水、石灰乳；",
    "· 乳浊液：小液滴分散在液体中，如牛奶、油水混合物。",
    "课堂上可让学生各举一例并解释为什么久置会分层。",
  ] },
  { re: /牛顿第二定律|F\s*=\s*ma|加速度.*合外力|合外力.*加速度/, title: "牛顿第二定律", body: [
    "F = ma：物体加速度的大小与所受合外力成正比、与质量成反比，方向与合外力方向相同。",
    "讲解三个易错点：① 是「合外力」而非某一个力；② 瞬时对应（力变 a 立即变）；③ 矢量式，要分方向列方程。",
    "建议用「同一辆车，空载 vs 满载，同样的推力谁加速更快」的情境引入。",
  ] },
  { re: /蒸发|沸腾/, title: "蒸发与沸腾的区别", body: [
    "两者都是汽化，但：蒸发只在液体表面、任何温度都能发生、缓慢；沸腾在液体表面和内部同时进行、要达到沸点、剧烈。",
    "可用「湿衣服晾干」对「烧开水冒泡」两个生活场景对比引出。",
  ] },
  { re: /文言|实词|虚词|之乎者也|翻译.*(文言|古文)/, title: "文言文复习思路", body: [
    "抓「一词多义、古今异义、词类活用、特殊句式」四条主线，配合课文逐句落实。",
    "建议先做课内重点篇目的字词清单，再用同主题课外短文迁移检测。",
  ] },
];

function gradeAnalysis(query) {
  const nums = (query.match(/\d+(\.\d+)?/g) || []).map(Number);
  const avg = nums.find((n) => n > 0 && n <= 150);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.75 }}>
        收到这组成绩数据，我从<b style={{ color: "var(--brand-deep)" }}>整体水平、分化程度、薄弱点</b>三方面给你一个分析框架：
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.85 }}>
        <li><b>整体水平</b>：{avg ? `平均分 ${avg}` : "平均分"}对照年级均分判断班级位次，及格率反映基础达标情况。</li>
        <li><b>分化程度</b>：优秀率与及格率的差距越大，说明两极分化越明显，需关注「中间段」学生。</li>
        <li><b>薄弱点定位</b>：建议把试卷按知识板块统计得分率，找出全班得分率最低的 2–3 个考点重点讲评。</li>
      </ul>
      <div style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.7 }}>
        把成绩表传给我，我可以直接生成<b style={{ color: "var(--brand-deep)" }}>班级质量分析报告</b>，含分数段分布、薄弱知识点和针对性建议。
      </div>
    </div>
  );
}

function teachingConsult(query) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.75 }}>
        这是个教学设计层面的问题，给你几条可落地的思路：
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.85 }}>
        <li><b>情境驱动</b>：用一个贴近学生生活或真实问题的情境导入，让知识「有用武之地」。</li>
        <li><b>活动设计</b>：设置 1–2 个学生动手或合作的环节（实验、辩论、小组探究），避免满堂灌。</li>
        <li><b>AI 应用</b>：可用互动课件做即时投票/抢答，或用 AI 生成分层练习当堂检测。</li>
        <li><b>评价闭环</b>：留 3–5 分钟用小问题检验目标达成，并预留弹性时间。</li>
      </ul>
      <div style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.7 }}>
        需要的话，我可以直接把它落成<b style={{ color: "var(--brand-deep)" }}>教案、课件或教学计划</b>——说一声就带你进对应工作台。
      </div>
    </div>
  );
}

function knowledgeAnswer(query, hit) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>{hit.title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.8 }}>
        {hit.body.map((line, i) => <div key={i}>{line}</div>)}
      </div>
    </div>
  );
}

function GeneralAnswer({ query, fallback }) {
  const q = query || "";
  const hit = GA_KB.find((k) => k.re.test(q));
  const isTranslate = /翻译|translate|用英(语|文)|英文怎么(说|表达)|中文怎么说/.test(q);
  const isGrades = /(平均分|及格率|优秀率|成绩|质量分析)/.test(q) && /\d/.test(q);
  const isConsult = /(公开课|建议|教学计划|复习计划|备课|怎么(讲|上|教|引入|提升|设计)|如何(讲|上|教|提升|设计|引入)|有没有.*办法|思路)/.test(q);

  let content;
  if (hit) content = knowledgeAnswer(q, hit);
  else if (isGrades) content = gradeAnalysis(q);
  else if (isTranslate) content = (
    <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.75 }}>
      可以，把要翻译的<b style={{ color: "var(--brand-deep)" }}>原文（中/英）</b>发给我即可。我会给出准确译文，并可按需附上重点字词的解释，适合直接用于课堂或讲义。
    </div>
  );
  else if (isConsult) content = teachingConsult(q);
  else content = (
    <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.75 }}>
      关于「{q.replace(/[《》"]/g, "").slice(0, 24)}」，我的建议是：先用一句话讲清核心概念，再用一个贴近学生生活的情境切入，最后用 2–3 个由浅入深的小问题检验理解。需要我把它做成<b style={{ color: "var(--brand-deep)" }}>课件、教案或练习</b>，随时说一声，我就带你进对应的工作台。
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {content}
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--auth-ink)", background: "var(--auth-bg)", border: "1px solid var(--auth-border)", borderRadius: 10, padding: "8px 11px" }}>
        <Icon name="shield" size={13} /> 回答参考学科网权威教研资源，成稿可一键溯源教材原文
      </div>
      {fallback && (
        <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.7, marginTop: 2 }}>
          「{fallback.intent}」这个功能暂时还没融合到对话里，你可以点左侧菜单的<span style={{ color: "var(--brand-deep)", fontWeight: 700, cursor: "pointer", textDecoration: "underline", textDecorationColor: "color-mix(in oklab, var(--brand-deep), transparent 60%)", textUnderlineOffset: 2 }}>「{fallback.entry}」</span>直接使用。
        </div>
      )}
    </div>
  );
}

// centered single-column chat (assistant feel, not the split workspace)
function CenteredChat({ messages, onSend, suggestions, placeholder, recognizing }) {
  const [draft, setDraft] = gaS("");
  const [att, setAtt] = gaS([]);
  const scrollRef = gaR(null);
  const taRef = gaR(null);
  gaE(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);
  // auto-grow textarea: 1 line → up to 5 lines, then scroll inside
  gaE(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxH = Math.round(14 * 1.5 * 5) + 10; // 5 lines + padding
    const next = Math.min(el.scrollHeight, maxH);
    el.style.height = next + "px";
    el.style.overflowY = el.scrollHeight > maxH + 1 ? "auto" : "hidden";
  }, [draft]);
  const send = (txt) => {
    const v = (txt ?? draft).trim();
    if (!v && att.length === 0) return;
    onSend(v, att);
    setDraft("");
    setAtt([]);
  };
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "var(--canvas)" }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "26px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
          {messages.map((m, i) => (
            <Bubble key={i} m={m} />
          ))}
        </div>
      </div>
      {!recognizing && (
        <div style={{ padding: "0 24px 18px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            {suggestions && suggestions.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => send(s)}
                    className="sug-pop"
                    style={{ animationDelay: `${i * 0.05}s`, display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 999, border: "1px dashed var(--brand-soft-border)", background: "var(--brand-soft)", color: "var(--brand-deep)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)" }}
                  >
                    <Icon name="spark" size={12} /> {s}
                  </button>
                ))}
              </div>
            )}
            <FileChips files={att} onRemove={(i) => setAtt((f) => f.filter((_, j) => j !== i))} style={{ marginBottom: 8 }} />
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: 10, boxShadow: "0 6px 20px -16px rgba(0,0,0,.3)" }}>
              <textarea
                ref={taRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                rows={1}
                placeholder={placeholder || "问我任何教学问题…"}
                style={{ flex: 1, border: "none", outline: "none", background: "transparent", resize: "none", fontSize: 14, fontFamily: "var(--font-zh)", color: "var(--ink)", lineHeight: 1.5, padding: "5px 4px", overflowY: "hidden", boxSizing: "border-box" }}
              />
              <ClipButton onFiles={(names) => setAtt((f) => [...f, ...names].slice(0, 6))} compact />
              <button onClick={() => send()} style={{ width: 36, height: 36, borderRadius: 11, border: "none", background: "var(--brand-grad)", backgroundColor: "var(--brand)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}>
                <Icon name="send" size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- The stage (right pane) for the general assistant: scenarios open here ----
function GeneralStage({ onSwitch, recognizing }) {
  const SC = window.AIDATA.SCENARIOS.filter((s) => !(window.AIDATA.HIDDEN_SCENARIOS || []).includes(s.id));
  return (
    <div style={{ flex: 1, minWidth: 0, overflowY: "auto", display: "grid", placeItems: "center", padding: "30px 24px", background: "var(--canvas)" }}>
      <div className="home-fade" style={{ width: "min(560px, 100%)", textAlign: "center" }}>
        {recognizing ? (
          <React.Fragment>
            <div style={{ position: "relative", display: "inline-flex", marginBottom: 16 }}>
              <BotAvatar size={52} glow />
              <span className="bot-ring" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", margin: "0 0 8px" }}>正在理解你的需求…</h2>
            <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.65, margin: 0 }}>如果需要动手创作，我会在这里为你打开对应的场景。</p>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", margin: "0 0 8px" }}>这里是场景区</h2>
            <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.7, margin: "0 0 22px" }}>
              在左侧告诉我你想做什么，我理解后会在这里为你打开对应场景；<br />也可以直接选一个开始 —— 对话不会中断。
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
              {SC.map((s, i) => (
                <button
                  key={s.id}
                  className="chip-pop"
                  onClick={() => onSwitch && onSwitch(s.id, "")}
                  style={{ animationDelay: `${i * 0.05}s`, display: "flex", alignItems: "center", gap: 10, padding: "12px 13px", borderRadius: 14, border: "1px solid var(--line)", background: "var(--surface)", cursor: "pointer", fontFamily: "var(--font-zh)", textAlign: "left", transition: "transform .18s var(--ease-out), border-color .2s, box-shadow .2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = `oklch(0.78 0.09 ${s.hue})`; e.currentTarget.style.boxShadow = `0 10px 22px -12px oklch(0.55 0.12 ${s.hue} / .5)`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <ScenarioGlyph icon={s.icon} hue={s.hue} size={36} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.tagline}</div>
                  </div>
                </button>
              ))}
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

function GeneralWorkspace({ query, fromIntent, onHome, onSwitch, nav }) {
  const GEN = window.AIDATA.GENERAL;
  const willRecognize = fromIntent && !!query;
  const [recognizing, setRecognizing] = gaS(willRecognize);

  const recapRef = gaR(null);
  const handleRecognized = (result) => {
    if (result.type === "hit") {
      if (fromIntent) {
        // Homepage first entry → no divider, user hasn't been in any workspace
        window.ChatSession.noDivider = true;
      } else {
        window.ChatSession.switchMeta = { source: "auto", from: window.AIDATA.GENERAL };
      }
      onSwitch(result.scenarioId, query);
      return;
    }
    setRecognizing(false);
    if (result.type === "multi") {
      const S = window.AIDATA.SCENARIOS;
      const matched = result.intents.map(id => S.find(s => s.id === id)).filter(Boolean);
      setMessages((m) => [...m, { role: "ai", node: <MultiIntentAsk intents={matched} onPick={(id) => { window.ChatSession.switchMeta = { source: "auto", from: window.AIDATA.GENERAL }; onSwitch(id, query); }} /> }]);
      setSugs([]);
    } else if (result.type === "legacy") {
      setMessages((m) => [...m, { role: "ai", node: <GeneralAnswer query={query} fallback={result.legacy} /> }]);
      setSugs(["展开讲讲", "帮我整理成要点"]);
    } else {
      setMessages((m) => [...m, { role: "ai", node: <GeneralAnswer query={query} /> }]);
      setSugs(["展开讲讲", "给我一个课堂导入", "帮我整理成要点"]);
    }
  };

  const [messages, setMessages] = gaS(() => {
    if (willRecognize) {
      return [
        ...window.ChatSession.take(),
        ...window.takeSwitchDivider(GEN, window.ChatSession.log.length > 0),
        ...(window.ChatSession.echoed(query) ? [] : [{ role: "user", text: query }]),
        { role: "ai", wide: true, intent: query, render: () => <InlineIntent query={query} onDone={(t) => recapRef.current(t)} /> },
      ];
    }
    const hist = window.ChatSession.take();
    if (hist.length) return window.enterThread(GEN);
    return [
      ...hist,
      { role: "ai", node: (
        <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.75 }}>
          <span>你好，我是 <b style={{ color: "var(--brand-deep)" }}>AI 小博士</b>。教学上的问题都可以问我；当你需要找资料、做课件、写教案时，我会在右侧为你打开对应的场景。</span>
        </div>
      ) },
    ];
  });
  const [sugs, setSugs] = gaS(willRecognize ? [] : ["悬浊液和乳浊液的区别", "我要上公开课，有什么学生活动建议？", "平均分 72、及格率 85%，帮我分析", "近三年化学高考实验安全的考查规律"]);
  recapRef.current = handleRecognized;
  // persist the thread — the assistant keeps ONE conversation across scenario switches
  gaE(() => { window.ChatSession.save(window.freezeChat(messages)); }, [messages]);

  const handleSend = (text) => {
    // a follow-up might itself be a specific request → re-route
    const t = window.detectSwitchTarget ? window.detectSwitchTarget(text) : null;
    if (t && t !== "general") {
      setMessages((m) => [...m, { role: "user", text }]);
      setTimeout(() => onSwitch(t, text), 300);
      return;
    }
    setMessages((m) => [...m, { role: "user", text }, { role: "ai", node: <GeneralAnswer query={text} /> }]);
    setSugs([]);
  };

  return (
    <WorkspaceShell scenario={GEN} onHome={onHome} onSwitch={onSwitch} nav={nav} headerRecognizing={recognizing} mobilePanelLabel="场景" mobilePanelIcon="grid">
      <ChatPanel
        messages={messages}
        onSend={handleSend}
        suggestions={recognizing ? [] : sugs}
        placeholder="问我任何教学问题，或描述你想创作的内容…"
      />
      <GeneralStage onSwitch={onSwitch} recognizing={recognizing} />
    </WorkspaceShell>
  );
}

Object.assign(window, { GeneralWorkspace });
