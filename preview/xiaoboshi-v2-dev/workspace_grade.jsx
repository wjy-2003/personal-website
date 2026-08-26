// workspace_grade.jsx — 改作业 workspace (homework grading: single精批 + 整班批改)
const { useState: grS, useEffect: grE, useRef: grR } = React;

const GRADE_SUGS_SINGLE = ["生成一句鼓励性评语", "把错题加入错题本", "出 3 道同类巩固题", "讲讲第 2 题为什么错"];
const GRADE_SUGS_CLASS = ["导出班级质量分析", "做一份讲评课件", "针对薄弱点出练习", "列出需重点关注的学生"];

// ✓对 / ✗错 / ◐半对 状态徽标
function GradeStatus({ status, size = "md" }) {
  const map = {
    right: { bg: "oklch(0.95 0.05 150)", fg: "oklch(0.45 0.13 150)", t: "对", ic: "check" },
    wrong: { bg: "oklch(0.95 0.04 25)", fg: "oklch(0.55 0.18 25)", t: "错", ic: "close" },
    half: { bg: "oklch(0.96 0.06 75)", fg: "oklch(0.5 0.12 75)", t: "半对", ic: "minus" },
  };
  const c = map[status] || map.right;
  const pad = size === "sm" ? "2px 8px" : "3px 10px";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: pad, borderRadius: 999, background: c.bg, color: c.fg, fontSize: 11.5, fontWeight: 800, fontFamily: "var(--font-zh)", flexShrink: 0 }}>
      <Icon name={c.ic} size={12} sw={2.8} /> {c.t}
    </span>
  );
}

// 一道题的批改卡
function QuestionRow({ q, i }) {
  const isWrong = q.status === "wrong" || q.status === "half";
  return (
    <div className="block-pop" style={{ animationDelay: `${i * 0.06}s`, border: "1px solid var(--line)", borderRadius: 13, background: "var(--surface)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: "var(--surface-2)", borderBottom: isWrong ? "1px solid var(--line)" : "none" }}>
        <span style={{ width: 24, height: 24, borderRadius: 7, background: "var(--brand)", color: "#fff", fontSize: 12, fontWeight: 800, display: "grid", placeItems: "center", fontFamily: "var(--font-num)", flexShrink: 0 }}>{q.n}</span>
        <span style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 700, background: "var(--surface)", border: "1px solid var(--line)", padding: "2px 8px", borderRadius: 6 }}>{q.type}</span>
        <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>{q.point}</span>
        <div style={{ flex: 1 }} />
        <GradeStatus status={q.status} />
        <span style={{ fontSize: 13, fontWeight: 800, color: q.status === "right" ? "oklch(0.5 0.12 150)" : q.status === "wrong" ? "oklch(0.55 0.18 25)" : "oklch(0.5 0.12 75)", fontFamily: "var(--font-num)", minWidth: 40, textAlign: "right" }}>{q.got}/{q.full}</span>
      </div>
      {isWrong && (
        <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 9 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 120px", minWidth: 0 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--ink-3)", marginBottom: 3 }}>学生作答</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "oklch(0.55 0.18 25)", fontFamily: "var(--font-num)" }}>{q.stu}</div>
            </div>
            <div style={{ flex: "1 1 120px", minWidth: 0 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--ink-3)", marginBottom: 3 }}>正确答案</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "oklch(0.5 0.12 150)", fontFamily: "var(--font-num)" }}>{q.ans}</div>
            </div>
          </div>
          {q.reason && (
            <div style={{ display: "flex", gap: 8, padding: "9px 11px", borderRadius: 9, background: "oklch(0.97 0.02 25)", border: "1px solid oklch(0.9 0.04 25)" }}>
              <span style={{ color: "oklch(0.55 0.18 25)", flexShrink: 0, marginTop: 1 }}><Icon name="alert" size={14} /></span>
              <div style={{ fontSize: 12.5, lineHeight: 1.6, color: "var(--ink-2)" }}><b style={{ color: "oklch(0.5 0.16 25)" }}>错因 · </b>{q.reason}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 班级逐题正确率柱
function RateBar({ q }) {
  const low = q.rate < 60;
  const mid = q.rate >= 60 && q.rate < 80;
  const col = low ? "oklch(0.6 0.18 25)" : mid ? "oklch(0.7 0.13 75)" : "oklch(0.62 0.14 150)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ width: 40, fontSize: 11.5, fontWeight: 700, color: "var(--ink-3)", flexShrink: 0 }}>第{q.n}题</span>
      <div style={{ flex: 1, height: 14, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden", position: "relative" }}>
        <div className="grade-bar" style={{ width: q.rate + "%", height: "100%", borderRadius: 999, background: col, transition: "width .6s cubic-bezier(.22,1,.36,1)" }} />
      </div>
      <span style={{ width: 38, fontSize: 12, fontWeight: 800, color: col, fontFamily: "var(--font-num)", textAlign: "right", flexShrink: 0 }}>{q.rate}%</span>
    </div>
  );
}

function GradeStat({ n, label, tone }) {
  const col = tone === "good" ? "oklch(0.55 0.13 150)" : tone === "warn" ? "oklch(0.6 0.16 35)" : "var(--brand)";
  return (
    <div style={{ flex: 1, textAlign: "center", padding: "12px 6px" }}>
      <div style={{ fontFamily: "var(--font-num)", fontWeight: 900, fontSize: 22, color: col, lineHeight: 1 }}>{n}</div>
      <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ---- cold-start guide page ----
function GradeGuide({ mode, setMode, onStart }) {
  const mobile = useIsMobile();
  const [over, setOver] = grS(false);
  const examples = mode === "class"
    ? ["整班批改 八上英语 Unit2 单元卷", "批改并统计 七年级数学《有理数》随堂练习"]
    : ["批改这份七年级数学《有理数》随堂练习", "这份作文按中考标准评分并写评语"];
  return (
    <div style={{ flex: 1, overflowY: "auto", display: "grid", placeItems: "center", padding: "32px 24px", background: "var(--canvas)" }}>
      <div className="home-fade" style={{ width: "min(560px, 100%)" }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ display: "inline-flex", marginBottom: 12 }}><ScenarioGlyph icon="grade" hue={8} size={54} active /></div>
          <h2 style={{ fontSize: 21, fontWeight: 800, color: "var(--ink)", margin: "0 0 7px" }}>改作业，AI 帮你批</h2>
          <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: 0, lineHeight: 1.6 }}>上传学生作业，逐题<b style={{ color: "var(--brand-deep)" }}>判对错、析错因、给评语</b>。批改标准对齐学科网权威答案与课标。</p>
        </div>

        {/* mode toggle */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {[
            { k: "single", t: "单份精批", d: "一名学生 · 逐题详批", ic: "file" },
            { k: "class", t: "整班批改", d: "全班作业 · 质量分析", ic: "grid" },
          ].map((m) => {
            const on = mode === m.k;
            return (
              <button key={m.k} onClick={() => setMode(m.k)} style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", borderRadius: 13, border: on ? "1px solid var(--brand)" : "1px solid var(--line)", background: on ? "var(--brand-soft)" : "var(--surface)", cursor: "pointer", fontFamily: "var(--font-zh)", textAlign: "left", transition: "all .15s" }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, background: on ? "var(--surface)" : "var(--surface-2)", border: on ? "1px solid var(--brand-soft-border)" : "1px solid var(--line)", color: on ? "var(--brand-deep)" : "var(--ink-3)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={m.ic} size={17} /></span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: on ? "var(--brand-deep)" : "var(--ink)" }}>{m.t}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, marginTop: 1 }}>{m.d}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* upload zone */}
        <button
          onClick={() => onStart(examples[0])}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); onStart(examples[0]); }}
          style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "30px 20px", borderRadius: 16, border: `1.5px dashed ${over ? "var(--brand)" : "var(--brand-soft-border)"}`, background: over ? "var(--brand-soft)" : "var(--surface)", cursor: "pointer", fontFamily: "var(--font-zh)", marginBottom: 18, transition: "all .15s" }}>
          <span style={{ width: 46, height: 46, borderRadius: 13, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", color: "var(--brand-deep)", display: "grid", placeItems: "center" }}><CIcon name="clip" size={22} /></span>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>拖入或<span style={{ color: "var(--brand-deep)" }}>拍照上传</span>{mode === "class" ? "全班作业" : "学生作业"}</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600 }}>支持照片 / PDF / Word · {mode === "class" ? "可一次上传多份" : "单份逐题精批"}</div>
        </button>

        {/* examples */}
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-3)", marginBottom: 9 }}>或从示例开始</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {examples.map((c, i) => (
            <button key={i} onClick={() => onStart(c)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 15px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", cursor: "pointer", fontFamily: "var(--font-zh)", textAlign: "left", transition: "all .15s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.transform = "none"; }}>
              <Icon name="spark" size={15} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{c}</span>
              <Icon name="arrow" size={15} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function GradeWorkspace({ scenario, query, onHome, onSwitch, fromIntent, resume, loggedIn, nav }) {
  const D = window.AIDATA.GRADE_DATA;
  const mobile = useIsMobile();
  const stored = window.ChatSession.scratch.grade || {};
  const wantsClass = (q) => /整班|全班|班级|质量分析|统计/.test(q || "");
  const startNow = !!query && !fromIntent;

  const [mode, setMode] = grS(stored.mode || (query ? (wantsClass(query) ? "class" : "single") : "single"));
  const [graded, setGraded] = grS(startNow || stored.graded || false);
  const [grading, setGrading] = grS(false);
  const result = mode === "class" ? D.classMode : D.single;

  const greet = (
    <span>好的，我来帮你<b style={{ color: "var(--brand-deep)" }}>批改作业</b>。上传或拍照学生作业即可，我会逐题判对错、分析错因；批改标准对齐学科网<b style={{ color: "var(--auth-ink)" }}>权威答案</b>，最终请你过目确认。</span>
  );

  const [messages, setMessages] = grS(() => {
    const hist = window.ChatSession.take();
    if (fromIntent && query) {
      return [
        ...hist,
        ...window.takeSwitchDivider(scenario, hist.length > 0),
        ...(window.ChatSession.echoed(query) ? [] : [{ role: "user", text: query }]),
        { role: "ai", wide: true, intent: query, render: () => <InlineIntent query={query} onDone={() => { runGrade(wantsClass(query) ? "class" : "single", true); }} /> },
      ];
    }
    if (startNow) {
      return [...hist, ...window.takeSwitchDivider(scenario, hist.length > 0), ...(window.ChatSession.echoed(query) ? [] : [{ role: "user", text: query }]), { role: "ai", node: doneNote(wantsClass(query) ? "class" : "single") }];
    }
    if (hist.length) return window.enterThread(scenario);
    return [...hist, { role: "ai", node: greet }];
  });
  const [sugs, setSugs] = grS(startNow ? (wantsClass(query) ? GRADE_SUGS_CLASS : GRADE_SUGS_SINGLE) : []);

  grE(() => { window.ChatSession.save(window.freezeChat(messages)); }, [messages]);
  grE(() => { window.ChatSession.scratch.grade = { mode, graded }; }, [mode, graded]);

  function doneNote(m) {
    return m === "class"
      ? <span>已完成<b style={{ color: "var(--brand-deep)" }}>整班批改</b>（{D.classMode.graded}/{D.classMode.count} 份）。右侧是班级质量分析——逐题正确率、共性错误与薄弱点都列出来了，可一键生成讲评课件。</span>
      : <span>已批改完《{D.single.title}》（{D.single.student}）。右侧是逐题批改结果，错题都标注了<b style={{ color: "var(--auth-ink)" }}>错因</b>，并附一条整体评语。</span>;
  }

  // run a grading pass — used by intent done, examples, and mode switches
  function runGrade(m, silent) {
    setMode(m);
    setGrading(true);
    setGraded(false);
    setSugs([]);
    if (!silent) setMessages((mm) => [...mm, { role: "ai", typing: true }]);
    setTimeout(() => {
      setGrading(false);
      setGraded(true);
      setSugs(m === "class" ? GRADE_SUGS_CLASS : GRADE_SUGS_SINGLE);
      const art = { scenario: "grade", icon: "grade", title: m === "class" ? D.classMode.title : `${D.single.title} · ${D.single.student}`, meta: m === "class" ? "班级质量分析" : "逐题批改" };
      setMessages((mm) => {
        const base = silent ? mm : mm.slice(0, -1);
        return [...base, { role: "ai", node: doneNote(m), artifact: art }];
      });
    }, silent ? 900 : 1500);
  }

  // start from cold-guide example/upload
  const startFromGuide = (text) => {
    const m = wantsClass(text) ? "class" : mode;
    setMessages((mm) => [...mm, { role: "user", text }]);
    runGrade(m, false);
  };

  // follow-up chat handler
  const localSend = (text) => {
    setMessages((mm) => [...mm, { role: "user", text }, { role: "ai", typing: true }]);
    setTimeout(() => {
      let note;
      if (/相似|巩固|练习|同类/.test(text)) { onSwitch && onSwitch("paper", `针对「${result.weakPoints ? result.weakPoints[0] : "本次错题"}」出一组巩固练习`); return; }
      if (/讲评课件|课件/.test(text)) { onSwitch && onSwitch("courseware", `${mode === "class" ? D.classMode.title : D.single.title} 错题讲评课件`); return; }
      if (/导图/.test(text)) { onSwitch && onSwitch("mindmap", "本次作业错题知识点 思维导图"); return; }
      if (/为什么错|讲讲第|错在哪/.test(text)) { const wq = D.single.questions.find((q) => q.status === "wrong") || D.single.questions[1]; note = <span>第 {wq.n} 题考查<b>{wq.point}</b>：学生答 <b style={{ color: "oklch(0.55 0.18 25)" }}>{wq.stu}</b>，正确答案 <b style={{ color: "oklch(0.5 0.12 150)" }}>{wq.ans}</b>。{wq.reason}建议配 2–3 道同类变式巩固。</span>; }
      else if (/评语/.test(text)) note = <span>已生成评语：<b style={{ color: "var(--ink)" }}>"{D.single.comment.slice(0, 38)}…"</b>（完整评语见右侧底部，可直接复制到作业本）。</span>;
      else if (/错题本/.test(text)) note = <span>已把本次错题加入<b style={{ color: "var(--brand-deep)" }}>错题本</b>，可在「我的内容」按知识点查看与重组。</span>;
      else if (/关注|学生/.test(text)) note = <span>本次需重点关注 <b style={{ color: "var(--brand-deep)" }}>{D.classMode.watch.length}</b> 名学生，已在右侧列出并附原因建议。</span>;
      else if (/导出|质量分析/.test(text)) note = <span>已导出<b style={{ color: "var(--brand-deep)" }}>班级质量分析</b>（含逐题正确率、共性错误、薄弱点），可在「我的内容」下载。</span>;
      else note = <span>好的，已根据「{text}」更新。批改结果均对齐学科网<b style={{ color: "var(--auth-ink)" }}>权威答案</b>，最终以你的确认为准。</span>;
      setMessages((mm) => [...mm.slice(0, -1), { role: "ai", node: note }]);
    }, 700);
  };

  const { headerRecognizing, send } = useSmartSend({ scenarioId: scenario.id, onSwitch, setMessages, localSend });

  // ---- right stage ----
  // 模式切换 + 导出按钮放在内容区顶部（而非场景栏），避免场景栏高度不一致
  const stageHeaderRight = null;

  const contentBar = graded ? (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 22px", borderBottom: "1px solid var(--line)", background: "var(--surface)", flexShrink: 0 }}>
      <div style={{ display: "flex", gap: 2, padding: 3, borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--line)" }}>
        {[{ k: "single", t: "单份精批" }, { k: "class", t: "整班批改" }].map((m) => {
          const on = mode === m.k;
          return <button key={m.k} onClick={() => { if (!on) runGrade(m.k, true); }} style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: on ? "var(--surface)" : "transparent", color: on ? "var(--brand-deep)" : "var(--ink-3)", fontSize: 12, fontWeight: 800, cursor: on ? "default" : "pointer", fontFamily: "var(--font-zh)", boxShadow: on ? "0 1px 4px rgba(0,0,0,.08)" : "none" }}>{m.t}</button>;
        })}
      </div>
      <div style={{ flex: 1 }} />
      <Btn size="sm" kind="soft" icon="download">导出</Btn>
    </div>
  ) : null;

  let stageBody;
  if (grading) {
    stageBody = (
      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 30 }}>
        <div style={{ textAlign: "center", color: "var(--ink-3)" }}>
          <div style={{ display: "inline-flex", marginBottom: 12 }}><BotAvatar size={42} glow /></div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-2)", display: "inline-flex", gap: 7, alignItems: "center" }}><CIcon name="grade" size={15} /> 正在比对权威答案、逐题批改 <Dots /></div>
        </div>
      </div>
    );
  } else if (!graded) {
    stageBody = <GradeGuide mode={mode} setMode={setMode} onStart={startFromGuide} />;
  } else if (mode === "single") {
    const r = D.single;
    stageBody = (
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {contentBar}
        <div style={{ flex: 1, overflowY: "auto", padding: "22px clamp(18px,4%,40px)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          {/* score header */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 18px", borderRadius: 16, border: "1px solid var(--line)", background: "var(--surface)", marginBottom: 16 }}>
            <div style={{ width: 70, height: 70, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0, background: `conic-gradient(var(--brand) ${r.score * 3.6}deg, var(--surface-2) 0)` }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--surface)", display: "grid", placeItems: "center", flexDirection: "column" }}>
                <span style={{ fontFamily: "var(--font-num)", fontWeight: 900, fontSize: 22, color: "var(--brand-deep)", lineHeight: 1 }}>{r.score}</span>
                <span style={{ fontSize: 9.5, color: "var(--ink-3)", fontWeight: 600 }}>/ {r.total}</span>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>{r.student} · 《{r.title}》</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600, marginTop: 3 }}>{r.edition} · {r.grade} · {r.subject} · 批改用时 {r.used}</div>
              <div style={{ marginTop: 8, display: "flex", gap: 7, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--auth-ink)", display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="shield" size={13} /> 对齐权威答案</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-3)" }}>· 正确率 {r.correctRate}%</span>
              </div>
            </div>
          </div>
          {/* questions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {r.questions.map((q, i) => <QuestionRow key={q.n} q={q} i={i} />)}
          </div>
          {/* comment */}
          <div style={{ marginTop: 16, padding: "15px 17px", borderRadius: 14, border: "1px solid var(--brand-soft-border)", background: "var(--brand-soft)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
              <Icon name="quote" size={15} /> <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--brand-deep)" }}>整体评语</span>
              <div style={{ flex: 1 }} />
              <Btn size="sm" kind="soft" icon="check">复制</Btn>
            </div>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.75, color: "var(--ink)" }}>{r.comment}</p>
          </div>
          <div style={{ marginTop: 14, display: "flex", gap: 9, flexWrap: "wrap" }}>
            <Btn size="sm" kind="soft" icon="paper" onClick={() => onSwitch && onSwitch("paper", `针对「${D.classMode.weakPoints[0]}」出一组巩固练习`)}>出同类巩固题</Btn>
            <Btn size="sm" kind="soft" icon="grade" onClick={() => send("把错题加入错题本")}>加入错题本</Btn>
          </div>
          <div style={{ textAlign: "center", fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.6, padding: "16px 4px 0" }}>AI 批改仅供参考，最终评分与评语请老师确认后下发</div>
        </div>
        </div>
      </div>
    );
  } else if (mode === "class") {
    const r = D.classMode;
    stageBody = (
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {contentBar}
        <div style={{ flex: 1, overflowY: "auto", padding: "22px clamp(18px,4%,40px)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", marginBottom: 3 }}>{r.title}</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600, marginBottom: 14 }}>已批改 {r.graded}/{r.count} 份 · 对齐学科网权威答案</div>
          {/* overview stats */}
          <div style={{ display: "flex", border: "1px solid var(--line)", borderRadius: 14, background: "var(--surface)", marginBottom: 16, overflow: "hidden", flexWrap: "wrap" }}>
            <GradeStat n={r.avg} label="平均分" />
            <div style={{ width: 1, background: "var(--line)" }} />
            <GradeStat n={r.max} label="最高分" tone="good" />
            <div style={{ width: 1, background: "var(--line)" }} />
            <GradeStat n={r.min} label="最低分" tone="warn" />
            <div style={{ width: 1, background: "var(--line)" }} />
            <GradeStat n={r.passRate + "%"} label="及格率" tone="good" />
            <div style={{ width: 1, background: "var(--line)" }} />
            <GradeStat n={r.excellentRate + "%"} label="优秀率" />
          </div>
          {/* per-question rate */}
          <div style={{ padding: "16px 18px", borderRadius: 14, border: "1px solid var(--line)", background: "var(--surface)", marginBottom: 16 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)", marginBottom: 13 }}>逐题正确率</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {r.perQuestion.map((q) => <RateBar key={q.n} q={q} />)}
            </div>
          </div>
          {/* common errors */}
          <div style={{ padding: "16px 18px", borderRadius: 14, border: "1px solid var(--line)", background: "var(--surface)", marginBottom: 16 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)", marginBottom: 11, display: "inline-flex", alignItems: "center", gap: 7 }}><Icon name="alert" size={15} /> 共性错误</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {r.commonErrors.map((e, i) => (
                <div key={i} style={{ display: "flex", gap: 11, alignItems: "center", padding: "10px 12px", borderRadius: 10, background: "var(--surface-2)" }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "var(--ink)", flexShrink: 0 }}>{e.q}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-2)" }}>{e.point}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 1 }}>{e.note}</div>
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: "oklch(0.58 0.18 25)", fontFamily: "var(--font-num)", flexShrink: 0 }}>错 {e.rate}%</span>
                </div>
              ))}
            </div>
          </div>
          {/* weak points + watch students */}
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div style={{ padding: "15px 16px", borderRadius: 14, border: "1px solid var(--line)", background: "var(--surface)" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)", marginBottom: 10, display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="target" size={14} /> 薄弱知识点</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {r.weakPoints.map((w, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.5 }}>
                    <span style={{ width: 5, height: 5, borderRadius: 2, background: "var(--brand)", marginTop: 7, flexShrink: 0 }} />{w}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: "15px 16px", borderRadius: 14, border: "1px solid var(--line)", background: "var(--surface)" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)", marginBottom: 10, display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="eye" size={14} /> 重点关注学生</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {r.watch.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 9, alignItems: "center" }}>
                    <span style={{ width: 26, height: 26, borderRadius: 8, background: "var(--surface-2)", color: "var(--ink-2)", fontSize: 11.5, fontWeight: 800, display: "grid", placeItems: "center", flexShrink: 0 }}>{s.name[0]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)" }}>{s.name} <span style={{ color: "oklch(0.58 0.18 25)", fontFamily: "var(--font-num)" }}>{s.score}</span></div>
                      <div style={{ fontSize: 11, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            <Btn size="sm" kind="soft" icon="slides" onClick={() => onSwitch && onSwitch("courseware", `${r.title} 错题讲评课件`)}>做讲评课件</Btn>
            <Btn size="sm" kind="soft" icon="paper" onClick={() => onSwitch && onSwitch("paper", `针对「${r.weakPoints[0]}」出一组针对性练习`)}>出针对性练习</Btn>
          </div>
          <div style={{ textAlign: "center", fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.6, padding: "16px 4px 0" }}>AI 批改与统计仅供参考，最终结果请老师复核</div>
        </div>
      </div>
      </div>
    );
  }

  return (
    <WorkspaceShell scenario={scenario} onHome={onHome} onSwitch={onSwitch} nav={nav} headerRecognizing={headerRecognizing} right={stageHeaderRight} mobilePanelLabel={mode === "class" ? "班级分析" : "批改结果"} mobilePanelIcon="grade" openSheetKey={graded ? mode : null}>
      <ChatPanel messages={messages} onSend={send} suggestions={sugs} placeholder="上传作业，或描述批改要求…" />
      {stageBody}
    </WorkspaceShell>
  );
}

Object.assign(window, { GradeWorkspace });
