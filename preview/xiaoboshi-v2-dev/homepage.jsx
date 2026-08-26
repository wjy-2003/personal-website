// homepage.jsx — unified entry, 3 switchable directions
const { useState, useRef, useEffect } = React;

// 首页输入框下方场景标签中隐藏这些场景（仍可从左侧菜单进入）
const HIDDEN_HOME = ["paper", "textbook", "grade", "explain", "image", "agent"];

function MenuRow({ icon, label, accent, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 9, border: "none", background: "transparent", color: accent ? "var(--brand-deep)" : "var(--ink-2)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", textAlign: "left" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <Icon name={icon} size={15} /> {label}
    </button>
  );
}

// 外观（浅色/深色）—— removed for v1

const LEGACY_LABELS = { "legacy:paper": "智能组卷", "legacy:interactive": "互动课件", "legacy:textbook": "教材百科", "legacy:grade": "作文批改", "legacy:image": "AI 生图", "legacy:explain": "AI 讲卷", "legacy:agent": "智能体" };
const LEGACY_ICONS = { "legacy:paper": "file", "legacy:interactive": "interactive", "legacy:textbook": "book", "legacy:grade": "grade", "legacy:image": "image", "legacy:explain": "megaphone", "legacy:agent": "spark" };
function LegacyPlaceholder({ page }) {
  const label = LEGACY_LABELS[page] || page;
  const icon = LEGACY_ICONS[page] || "spark";
  return (
    <div style={{ flex: 1, display: "grid", placeItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "inline-flex", marginBottom: 14 }}><Icon name={icon} size={48} /></div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", margin: "0 0 8px" }}>{label}</h2>
        <p style={{ fontSize: 14, color: "var(--ink-3)", margin: 0 }}>该功能将在旧版页面中打开</p>
      </div>
    </div>
  );
}

// The shared smart input box
function SmartInput({ value, setValue, onSubmit, big, placeholder, ghost }) {
  const ref = useRef(null);
  const [files, setFiles] = useState([]);
  const fs = big ? 17 : 15;
  const lh = 1.55;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const maxH = Math.round(fs * lh * 5); // cap at 5 lines
    const next = Math.min(el.scrollHeight, maxH);
    el.style.height = next + "px";
    el.style.overflowY = el.scrollHeight > maxH + 1 ? "auto" : "hidden";
  }, [value, fs]);
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1.5px solid var(--input-border)",
        borderRadius: 22,
        boxShadow: "var(--input-shadow)",
        padding: big ? "18px 18px 12px" : "12px 12px 8px",
        transition: "border-color .2s, box-shadow .25s",
      }}
      onFocusCapture={(e) => {
        e.currentTarget.style.borderColor = "var(--brand)";
        e.currentTarget.style.boxShadow = "var(--ring), var(--input-shadow)";
      }}
      onBlurCapture={(e) => {
        e.currentTarget.style.borderColor = "var(--input-border)";
        e.currentTarget.style.boxShadow = "var(--input-shadow)";
      }}
    >
      <FileChips files={files} onRemove={(i) => setFiles((f) => f.filter((_, j) => j !== i))} style={{ margin: "0 2px 4px" }} />
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          } else if (e.key === "Tab" && !e.shiftKey && ghost && !value.trim()) {
            // accept the rotating example as input
            e.preventDefault();
            setValue(ghost);
          }
        }}
        placeholder={placeholder}
        rows={big ? 2 : 1}
        style={{
          width: "100%",
          border: "none",
          outline: "none",
          resize: "none",
          background: "transparent",
          fontSize: fs,
          lineHeight: lh,
          color: "var(--ink)",
          fontFamily: "var(--font-zh)",
          padding: "2px 4px",
          display: "block",
          overflowY: "hidden",
          boxSizing: "border-box",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 10,
          marginTop: big ? 6 : 2,
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <ClipButton onFiles={(names) => setFiles((f) => [...f, ...names].slice(0, 6))} compact />

          {ghost && !value.trim() && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--ink-3)", fontWeight: 600, whiteSpace: "nowrap" }}>
              <kbd style={{ fontFamily: "var(--font-zh)", fontSize: 10.5, fontWeight: 700, padding: "1px 6px", borderRadius: 5, border: "1px solid var(--line)", background: "var(--surface-2)", color: "var(--ink-2)" }}>Tab</kbd> 填入示例
            </span>
          )}
        </div>
        <button
          onClick={onSubmit}
          disabled={!value.trim()}
          aria-label="发送"
          data-tip="发送"
          style={{
            width: big ? 42 : 36,
            height: big ? 42 : 36,
            borderRadius: "50%",
            border: "none",
            display: "grid",
            placeItems: "center",
            background: value.trim() ? "var(--brand-grad)" : "var(--line)",
            color: value.trim() ? "#fff" : "var(--ink-3)",
            cursor: value.trim() ? "pointer" : "default",
            boxShadow: value.trim() ? "inset 0 1px 0 rgba(255,255,255,.25), 0 6px 16px -6px var(--brand-glow)" : "none",
            transition: "all .2s",
            flexShrink: 0,
          }}
        >
          <svg width={big ? 19 : 17} height={big ? 19 : 17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V6"></path><path d="m6 11.5 6-6 6 6"></path></svg>
        </button>
      </div>
    </div>
  );
}

// ---------- Direction A: 对话优先 ----------
function HomeConversation({ value, setValue, onSubmit, onPick, onResume, loggedIn, onLogin, onManageMemory, onOpenWorks }) {
  const S = window.AIDATA.SCENARIOS;
  const EX = window.AIDATA.HOME_EXAMPLES || [];
  const mobile = useIsMobile();
  const onWriteLesson = () => onPick && onPick("lesson");
  // rotating ghost example drawn from real teacher prompts (Tab to fill)
  const phs = ["人教版七年级上《有理数》同步练习，含解析", "按湖北中考结构出一份物理中考模拟卷", "外研版英语必修二 Unit3 早读课件，精美一些", "九年级 二次函数 思维导图", "光反应和暗反应有什么区别？"];
  const [phi, setPhi] = useState(0);
  useEffect(() => { const id = setInterval(() => setPhi((i) => (i + 1) % phs.length), 3400); return () => clearInterval(id); }, []);
  return (
    <div className="home-fade" style={{ padding: mobile ? "2vh 16px 20px" : "3vh 24px 22px", textAlign: "center", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 0 }}>
      <div style={{ maxWidth: 760, margin: "0 auto", width: "100%" }}>
        <h1 style={{ fontSize: mobile ? 25 : 36, fontWeight: 800, color: "var(--ink)", margin: "0 0 12px", letterSpacing: "-0.8px" }}>
          老师好，有什么我能帮你的？
        </h1>
        <p style={{ fontSize: mobile ? 14.5 : 16, color: "var(--ink-2)", margin: 0, lineHeight: 1.6 }}>
          说出你的需求，我会从<b style={{ color: "var(--brand-deep)" }}>学科网资源库</b>出发，陪你一起完成。
        </p>
        <div style={{ height: mobile ? 26 : 40 }} />
        <SmartInput
          value={value}
          setValue={setValue}
          onSubmit={onSubmit}
          big
          ghost={phs[phi]}
          placeholder={phs[phi]}
        />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center", marginTop: 22, maxWidth: "min(940px, 96vw)", marginLeft: "auto", marginRight: "auto" }}>
        {S.filter((s) => !HIDDEN_HOME.includes(s.id)).map((s) => (
          <button data-scenario-chip
            key={s.id}
            onClick={() => onPick(s.id)}
            className="chip-pop"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 15px 6px 12px",
              borderRadius: 13,
              boxShadow: "0 1px 4px oklch(0.4 0.08 260 / .06)",
              border: "1px solid var(--line)",
              background: "var(--surface)",
              cursor: "pointer",
              fontFamily: "var(--font-zh)",
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "transform .15s, box-shadow .2s, border-color .2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = `0 10px 24px -12px ${accentFor(s.icon, 0.6)}`;
              e.currentTarget.style.borderColor = accentFor(s.icon);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 1px 4px oklch(0.4 0.08 260 / .06)";
              e.currentTarget.style.borderColor = "var(--line)";
            }}
          >
            <span style={{ width: 22, height: 22, display: "grid", placeItems: "center", flexShrink: 0 }}><CIcon name={s.icon} size={20} active /></span>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{s.name}</span>
          </button>
        ))}
      </div>
      {/* 写教案快速入口卡片 */}
      <div style={{ maxWidth: 720, margin: "0 auto", marginTop: 32, padding: "0 16px" }}>
        <div
          onClick={onWriteLesson}
          style={{
            background: "var(--surface)",
            border: "1.5px solid var(--brand-soft-border)",
            borderRadius: 16,
            padding: "18px 22px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            cursor: "pointer",
            transition: "box-shadow .2s, border-color .2s, transform .2s",
            boxShadow: "0 1px 4px oklch(0.4 0.08 260 / .06)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--brand)";
            e.currentTarget.style.boxShadow = "0 8px 24px -8px " + accentFor("book", 0.5);
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--brand-soft-border)";
            e.currentTarget.style.boxShadow = "0 1px 4px oklch(0.4 0.08 260 / .06)";
            e.currentTarget.style.transform = "none";
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 11, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <CIcon name="book" size={22} active />
          </div>
          <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)", marginBottom: 3 }}>智能写教案</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.45 }}>选择学科、学段、版本，快速生成完整教学设计</div>
          </div>
          <Icon name="chevron" size={18} style={{ color: "var(--ink-3)", flexShrink: 0 }} />
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", alignItems: "center", marginTop: 32, maxWidth: 760, marginLeft: "auto", marginRight: "auto" }}>
        <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="spark" size={13} /> 老师们在问</span>
        {EX.slice(0, mobile ? 3 : 5).map((ex, i) => (
          <button key={i} onClick={() => onSubmit(ex.t)} className="chip-pop ex-chip" style={{ animationDelay: `${i * 0.04}s`, maxWidth: "100%", padding: "7px 14px", borderRadius: 999, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-3)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ex.t}</button>
        ))}
      </div>
      <div style={{ maxWidth: 760, margin: "0 auto", width: "100%" }}>
        {loggedIn ? <MemoryPanel onResume={onResume} onManageMemory={onManageMemory} onOpenWorks={onOpenWorks} /> : <LoginHook onLogin={onLogin} />}
      </div>
    </div>
  );
}

// ---------- Login hook (shown when logged out, in place of memory) ----------
function LoginHook({ onLogin }) {
  const M = window.AIDATA.USER_MEMORY;
  const teases = [
    { icon: "spark", t: "记住你的学科、学段与版本偏好" },
    { icon: "history", t: "一键续作上次的课件、试卷与教案" },
    { icon: "layers", t: "同步你的收藏与下载，随处可取" },
  ];
  return (
    <div
      style={{
        marginTop: 26,
        position: "relative",
        background: "var(--surface)",
        border: "1px dashed var(--brand-soft-border)",
        borderRadius: 20,
        overflow: "hidden",
        textAlign: "left",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "20px 22px", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 11px", borderRadius: 999, background: "var(--brand-soft)", color: "var(--brand-deep)", fontSize: 11.5, fontWeight: 700, marginBottom: 11 }}>
            <Icon name="spark" size={13} /> 登录解锁「小博士记忆」
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)", marginBottom: 6 }}>
            登录后，小博士会记住你、越用越懂你
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {teases.map((x, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "var(--ink-2)" }}>
                <span style={{ width: 22, height: 22, borderRadius: 7, background: "var(--surface-2)", border: "1px solid var(--line)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}>
                  <Icon name={x.icon} size={13} />
                </span>
                {x.t}
              </div>
            ))}
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <button
            onClick={onLogin}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 26px", borderRadius: 13, border: "none", background: "var(--brand-grad)", backgroundColor: "var(--brand)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", boxShadow: "0 6px 18px -6px var(--brand-glow)", whiteSpace: "nowrap" }}
          >
            登录 / 注册 <Icon name="arrow" size={17} />
          </button>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", textAlign: "center", marginTop: 8 }}>未登录也可正常使用全部场景</div>
        </div>
      </div>
    </div>
  );
}

// ---------- AI memory: learned teacher profile ----------
function MemoryPanel({ onResume, onManageMemory, onOpenWorks }) {
  const M = window.AIDATA.USER_MEMORY;
  const S = window.AIDATA.SCENARIOS;
  const mobile = useIsMobile();
  // closed → the panel is gone for the rest of this session (not collapsed to a strip),
  // but resets on page refresh so the flow stays testable. teachers can still reach
  // memory anytime via the sidebar「我的记忆」entry.
  const [hidden, setHidden] = useState(true);
  if (hidden) return null;
  const dismiss = () => setHidden(true);

  return (
    <div
      className="mem-card"
      style={{
        marginTop: 26,
        maxWidth: 920,
        marginLeft: "auto",
        marginRight: "auto",
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "var(--shadow-card)",
        textAlign: "left",
      }}
    >
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "13px 18px", borderBottom: "1px solid var(--line)", background: "var(--brand-soft)" }}>
        <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--surface)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}>
          <Icon name="spark" size={16} />
        </span>
        <div style={{ lineHeight: 1.25, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>小博士还记得你</div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            从你的创作与收藏中学习 · 记忆更新于 {M.updated}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={onManageMemory}
          style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 9, border: "1px solid var(--brand-soft-border)", background: "var(--surface)", color: "var(--brand-deep)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", flexShrink: 0 }}
        >
          <Icon name="filter" size={13} /> 管理记忆
        </button>
        <button
          onClick={dismiss}
          title="关闭记忆面板"
          style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--brand-soft-border)", background: "var(--surface)", color: "var(--ink-3)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}
        >
          <Icon name="close" size={14} sw={2.4} />
        </button>
      </div>
      {/* body */}
      <div className="mem-grid" style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1.15fr 0.85fr" }}>
        {/* left: summary + tags + stats */}
        <div className="mem-left" style={{ padding: "16px 18px", borderRight: mobile ? "none" : undefined, borderBottom: mobile ? "1px solid var(--line)" : undefined }}>
          <p style={{ margin: "0 0 13px", fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.7 }}>
            {M.summary}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
            {M.tags.map((t, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--line)", fontSize: 12 }}>
                <span style={{ color: "var(--ink-3)", fontSize: 11 }}>{t.k}</span>
                <span style={{ color: "var(--brand-deep)", fontWeight: 700 }}>{t.v}</span>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, paddingTop: 13, borderTop: "1px dashed var(--line)" }}>
            {M.stats.map((s, i) => (
              <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                <span style={{ color: "var(--ink-3)" }}><CIcon name={s.icon} size={15} /></span>
                <span style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)", fontFamily: "var(--font-num)" }}>{s.n}</span>
                <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        {/* right: resume recent creations */}
        <div style={{ padding: "14px 16px", background: "var(--surface-2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--ink-3)", marginBottom: 11 }}>
            <CIcon name="history" size={14} /> 继续上次创作
            <div style={{ flex: 1 }} />
            <button onClick={onOpenWorks} style={{ display: "inline-flex", alignItems: "center", gap: 3, border: "none", background: "transparent", color: "var(--brand-deep)", fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>
              我的内容 <Icon name="arrow" size={13} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {M.recent.map((r, i) => (
              <button
                key={i}
                onClick={() => onResume && onResume(r)}
                style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 11px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", cursor: "pointer", fontFamily: "var(--font-zh)", textAlign: "left", transition: "transform .15s, border-color .2s, box-shadow .2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateX(3px)"; e.currentTarget.style.borderColor = accentFor(r.icon); e.currentTarget.style.boxShadow = `0 8px 18px -12px ${accentFor(r.icon, 0.5)}`; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <ScenarioGlyph icon={r.icon} hue={r.hue} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.meta} · {r.when}</div>
                </div>
                <span style={{ color: "var(--ink-3)", flexShrink: 0 }}><Icon name="arrow" size={16} /></span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Direction B: 场景宫格 (same shell as 对话优先, scenarios as a balanced grid) ----------
function HomeGrid({ value, setValue, onSubmit, onPick, onResume, loggedIn, onLogin, onManageMemory, onOpenWorks }) {
  const S = window.AIDATA.SCENARIOS;
  const mobile = useIsMobile();
  const narrow = useIsMobile(NARROW_BP);
  const cols = Math.ceil(S.length / 2); // 6→3+3, 7→4+3, 8→4+4
  const gridCols = narrow ? 1 : mobile ? 2 : cols;
  return (
    <div className="home-fade" style={{ padding: mobile ? "2vh 16px 36px" : "4vh 24px 40px", textAlign: "center" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: mobile ? 16 : 20 }}>
          <BotAvatar size={mobile ? 54 : 66} glow />
        </div>
        <h1 style={{ fontSize: mobile ? 24 : 34, fontWeight: 800, color: "var(--ink)", margin: "0 0 10px", letterSpacing: "-0.5px" }}>
          选个场景，或直接告诉我你的需求
        </h1>
        <p style={{ fontSize: mobile ? 14.5 : 16, color: "var(--ink-2)", margin: "0 0 28px", lineHeight: 1.6 }}>
          说出你的需求，我会从<b style={{ color: "var(--brand-deep)" }}>学科网资源库</b>出发，陪你一起完成。
        </p>
        <SmartInput
          value={value}
          setValue={setValue}
          onSubmit={onSubmit}
          big
          placeholder="描述你的教学需求，AI 自动判断该进入哪个场景…"
        />
      </div>
      <div
        style={{
          maxWidth: 1000,
          margin: mobile ? "20px auto 0" : "26px auto 0",
          display: "grid",
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gap: mobile ? 12 : 16,
        }}
      >
        {S.filter((s) => !HIDDEN_HOME.includes(s.id)).map((s) => (
          <button data-scenario-chip
            key={s.id}
            onClick={() => onPick(s.id)}
            className="chip-pop"
            style={{
              textAlign: "left",
              padding: 20,
              borderRadius: 18,
              border: "1px solid var(--line)",
              background: "var(--surface)",
              cursor: "pointer",
              fontFamily: "var(--font-zh)",
              transition: "transform .18s, box-shadow .25s, border-color .2s",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = `0 16px 32px -16px ${accentFor(s.icon, 0.55)}`;
              e.currentTarget.style.borderColor = accentFor(s.icon);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = "var(--line)";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <ScenarioGlyph icon={s.icon} hue={s.hue} size={46} />
              <span style={{ color: accentFor(s.icon), opacity: 0.5 }}>
                <Icon name="arrow" size={18} />
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)" }}>{s.name}</div>
              {s.badge && (
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "oklch(0.5 0.13 45)", background: "oklch(0.95 0.05 45)", padding: "2px 7px", borderRadius: 999 }}>{s.badge}</span>
              )}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: accentFor(s.icon), marginTop: 3 }}>
              {s.tagline}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 8, lineHeight: 1.55 }}>{s.desc}</div>
          </button>
        ))}
      </div>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {loggedIn ? <MemoryPanel onResume={onResume} onManageMemory={onManageMemory} onOpenWorks={onOpenWorks} /> : <LoginHook onLogin={onLogin} />}
      </div>
    </div>
  );
}

// ---------- Direction C: 助手人格 ----------
function HomePersona({ value, setValue, onSubmit, onPick, onResume, loggedIn, onLogin, onManageMemory, onOpenWorks }) {
  const S = window.AIDATA.SCENARIOS;
  const M = window.AIDATA.USER_MEMORY;
  const mobile = useIsMobile();
  return (
    <div className="home-fade" style={{ maxWidth: 1080, margin: "0 auto", padding: mobile ? "1vh 16px 36px" : "2vh 24px 40px" }}>
    <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "minmax(300px, 0.9fr) 1.1fr", gap: mobile ? 18 : 40, alignItems: "start" }}>
      {/* left: the assistant — who I am + what I remember about you */}
      <div>
        <BotAvatar size={mobile ? 68 : 88} glow />
        <div
          style={{
            marginTop: 20,
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "4px 20px 20px 20px",
            padding: "18px 20px",
            boxShadow: "var(--shadow-card)",
            position: "relative",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", marginBottom: 2 }}>
            我是 AI 小博士 👋
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--brand-deep)", marginBottom: 9 }}>
            你的 AI 教学助手
          </div>
          <p style={{ fontSize: 14.5, color: "var(--ink-2)", lineHeight: 1.7, margin: 0 }}>
            和别的 AI 不同，我的每一份产出都<b style={{ color: "var(--brand-deep)" }}>是站在学科网的资源库之上</b> —— 不是凭空生成，而是有据可依。
          </p>
        </div>

        {/* memory belongs to the assistant's persona — folded in here, not laid flat */}
        {loggedIn ? (
          <div className="mem-card" style={{ marginTop: 16, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 18, overflow: "hidden", boxShadow: "var(--shadow-card)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid var(--line)", background: "var(--brand-soft)" }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--surface)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}>
                <Icon name="spark" size={15} />
              </span>
              <div style={{ lineHeight: 1.25, minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>而且，我还记得你</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600 }}>记忆更新于 {M.updated}</div>
              </div>
              <button onClick={onManageMemory} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 9, border: "1px solid var(--brand-soft-border)", background: "var(--surface)", color: "var(--brand-deep)", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", flexShrink: 0 }}>
                <Icon name="filter" size={12} /> 管理
              </button>
            </div>
            <div style={{ padding: "14px 16px" }}>
              <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--ink-2)", lineHeight: 1.7 }}>{M.summary}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 13 }}>
                {M.tags.map((t, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--line)", fontSize: 12 }}>
                    <span style={{ color: "var(--ink-3)", fontSize: 11 }}>{t.k}</span>
                    <span style={{ color: "var(--brand-deep)", fontWeight: 700 }}>{t.v}</span>
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 6, marginBottom: 9, paddingTop: 12, borderTop: "1px dashed var(--line)" }}>
                <CIcon name="history" size={13} /> 继续上次创作
                <div style={{ flex: 1 }} />
                <button onClick={onOpenWorks} style={{ display: "inline-flex", alignItems: "center", gap: 3, border: "none", background: "transparent", color: "var(--brand-deep)", fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>
                  我的内容 <Icon name="arrow" size={12} />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {M.recent.slice(0, 2).map((r, i) => (
                  <button
                    key={i}
                    onClick={() => onResume && onResume(r)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface-2)", cursor: "pointer", fontFamily: "var(--font-zh)", textAlign: "left", transition: "transform .15s, border-color .2s, box-shadow .2s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateX(3px)"; e.currentTarget.style.borderColor = accentFor(r.icon); e.currentTarget.style.boxShadow = `0 8px 18px -12px ${accentFor(r.icon, 0.5)}`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <ScenarioGlyph icon={r.icon} hue={r.hue} size={32} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.meta} · {r.when}</div>
                    </div>
                    <span style={{ color: "var(--ink-3)", flexShrink: 0 }}><Icon name="arrow" size={15} /></span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          {/* memory removed for v1 */}
        )}
      </div>
      {/* right input + actions */}
      <div>
        <SmartInput
          value={value}
          setValue={setValue}
          onSubmit={onSubmit}
          big
          placeholder="描述你的教学需求，AI 自动判断该进入哪个场景…"
        />
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-3)", margin: "22px 2px 12px" }}>
          我可以帮你 —
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {S.filter((s) => !HIDDEN_HOME.includes(s.id)).map((s) => (
            <button data-scenario-chip
              key={s.id}
              onClick={() => onPick(s.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "9px 14px",
                borderRadius: 14,
                border: "1px solid var(--line)",
                background: "var(--surface)",
                cursor: "pointer",
                fontFamily: "var(--font-zh)",
                textAlign: "left",
                transition: "transform .15s, border-color .2s, background .2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = accentFor(s.icon);
                e.currentTarget.style.transform = "translateX(3px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--line)";
                e.currentTarget.style.transform = "none";
              }}
            >
              <ScenarioGlyph icon={s.icon} hue={s.hue} size={38} />
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)", display: "flex", alignItems: "center", gap: 6 }}>
                  {s.name}
                  {s.badge && (
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: "oklch(0.5 0.13 45)", background: "oklch(0.95 0.05 45)", padding: "1px 6px", borderRadius: 999 }}>{s.badge}</span>
                  )}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 1 }}>{s.tagline}</div>
              </div>
            </button>
          ))}
        </div>
        {/* not sure which? the assistant figures it out */}
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 11, padding: "13px 16px", borderRadius: 14, border: "1px dashed var(--brand-soft-border)", background: "var(--brand-soft)" }}>
          <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--surface)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}>
            <Icon name="spark" size={16} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>不确定用哪个？直接说就好</div>
            <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 1, lineHeight: 1.5 }}>把需求写在上面的输入框，小博士会自动判断该进入哪个场景，没有合适的就直接回答你。</div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

function AuthorityStrip() {
  const mobile = useIsMobile();
  const stats = [
    ["2000万+", "精品资源"],
    ["20年", "教研沉淀"],
    ["三审三校", "质量把关"],
    ["全学段", "覆盖"],
  ];
  return (
    <div style={{ marginTop: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: mobile ? "column" : "row", alignItems: "center", gap: mobile ? 8 : 16, padding: mobile ? "10px 16px" : "9px 24px", borderRadius: mobile ? 14 : 999, maxWidth: "100%", background: "color-mix(in oklab, var(--auth-bg), var(--surface) 35%)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600, color: "color-mix(in oklab, var(--auth-ink), var(--surface) 22%)", whiteSpace: "nowrap" }}>
          <Icon name="shield" size={14} /> 每一份生成，都有学科网资源库支撑
        </span>
        {!mobile && <span style={{ width: 1, height: 14, background: "color-mix(in oklab, var(--auth-border), var(--surface) 30%)", flexShrink: 0 }} />}
        <span style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: mobile ? "4px 14px" : "4px 16px" }}>
          {stats.map(([n, l], i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "baseline", gap: 4, fontSize: 12, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
              <b style={{ fontSize: 12, fontWeight: 700, color: "color-mix(in oklab, var(--auth-ink), var(--surface) 18%)", fontFamily: "var(--font-num)" }}>{n}</b>{l}
            </span>
          ))}
        </span>
      </div>
      <div style={{ textAlign: "center", fontSize: 11, color: "color-mix(in oklab, var(--ink-3), var(--surface) 25%)", marginTop: 7, lineHeight: 1.6 }}>
        AI 内容仅供教研参考，请结合实际教学进行调整
      </div>
    </div>
  );
}

function Homepage({ page, layout, value, setValue, onSubmit, onPick, onResume, loggedIn, onLogin, onLogout, onNavigate, onNewChat, onRequireLogin, onOpenBasket, basketCount, basketItems, onRemoveBasket, onClearBasket, conversations }) {
  const Comp =
    layout === "场景宫格" ? HomeGrid : layout === "助手人格" ? HomePersona : HomeConversation;
  const mobile = useIsMobile();
  const [navOpen, setNavOpen] = useState(false);
  const closeNav = () => setNavOpen(false);
  const navTo = (p) => { onNavigate(p); closeNav(); };
  const newChat = () => { onNewChat(); closeNav(); };
  // desktop rail: collapsed = fully hidden + a slim expand button (matches the workspace
  // 工作台 behavior), instead of shrinking to a 72px icon strip. Shares the same
  // persisted key so the choice carries between 首页 and 场景工作台.
  const [railOpen, setRailOpenState] = useState(() => localStorage.getItem("aida_rail_open") !== "0");
  const setRailOpen = (v) => { setRailOpenState(v); try { localStorage.setItem("aida_rail_open", v ? "1" : "0"); } catch (e) {} };
  const railIconBtn = { width: 32, height: 32, borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 };
  const railHoverFx = {
    onMouseEnter: (e) => (e.currentTarget.style.background = "var(--surface-2)"),
    onMouseLeave: (e) => (e.currentTarget.style.background = "var(--surface)"),
  };
  const gate = (fn) => (loggedIn ? fn : onRequireLogin);
  const memProps = {
    onResume: loggedIn ? onResume : (() => onRequireLogin()),
    loggedIn,
    onLogin: onRequireLogin,
        onOpenWorks: () => (loggedIn ? onNavigate("works") : onRequireLogin()),
  };
  return (
    <div style={{ height: "100dvh", display: "flex", overflow: "hidden" }}>
      {mobile ? (
        <LeftRail
          page={page}
          loggedIn={loggedIn}
          onNavigate={navTo}
          onPick={onPick}
          onNewChat={newChat}
          onResume={(it) => { onResume && onResume(it); closeNav(); }}
          onLogout={onLogout}
          onRequireLogin={onRequireLogin}
          mobile={mobile}
          mobileOpen={navOpen}
          onCloseMobile={closeNav}
          onOpenBasket={() => { onOpenBasket && onOpenBasket(); closeNav(); }}
          basketCount={basketCount}
          conversations={conversations}
        />
      ) : railOpen ? (
        <LeftRail
          page={page}
          loggedIn={loggedIn}
          onNavigate={navTo}
          onPick={onPick}
          onNewChat={newChat}
          onResume={(it) => { onResume && onResume(it); closeNav(); }}
          onLogout={onLogout}
          onRequireLogin={onRequireLogin}
          mobile={mobile}
          onOpenBasket={() => { onOpenBasket && onOpenBasket(); closeNav(); }}
          basketCount={basketCount}
          conversations={conversations}
          forceOpen
          onCollapse={() => setRailOpen(false)}
        />
      ) : null}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", position: "relative", background: "var(--surface)" }}>
        {!mobile && !railOpen && (
          <div style={{ position: "absolute", top: 14, left: 14, zIndex: 20, display: "inline-flex", gap: 6 }}>
            <button onClick={() => setRailOpen(true)} data-tip="展开菜单" data-tip-pos="bottom-left" aria-label="展开菜单" style={railIconBtn} {...railHoverFx}>
              <Icon name="panelLeftOpen" size={17} />
            </button>
            <button onClick={newChat} data-tip="新对话" aria-label="新对话" style={railIconBtn} {...railHoverFx}>
              <Icon name="plus" size={17} />
            </button>
          </div>
        )}
        {mobile && (
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--surface)", borderBottom: "1px solid var(--line)", zIndex: 5 }}>
            <button onClick={() => setNavOpen(true)} aria-label="打开菜单" style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 11, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer" }}>
              <Icon name="menu" size={20} />
            </button>
            <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 9 }}>
              <BotAvatar size={32} glow />
              <div style={{ minWidth: 0, lineHeight: 1.2 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "var(--ink)" }}>AI 小博士</div>
                <div style={{ fontSize: 10.5, color: "var(--ink-3)", fontWeight: 600 }}>你的备课教学助手</div>
              </div>
            </div>
            <button onClick={newChat} aria-label="新对话" style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 11, border: "none", background: "var(--brand-grad)", backgroundColor: "var(--brand)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer", boxShadow: "0 4px 14px -6px var(--brand-glow)" }}>
              <Icon name="plus" size={20} sw={2.4} />
            </button>
          </div>
        )}
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflowY: "auto" }}>
          {loggedIn && page === "works" ? (
            <WorksPage onResume={onResume} onNewChat={onNewChat} />
          ) : loggedIn && page === "history" ? (
            <HistoryPage onResume={onResume} onNewChat={onNewChat} conversations={conversations} />
          ) : loggedIn && page === "basket" ? (
            <BasketPage items={basketItems || []} onRemove={onRemoveBasket} onClear={onClearBasket} onOpenContent={() => onNavigate("works")} onNewChat={onNewChat} onGoFind={() => onPick && onPick("find")} />
          ) : page === "feedback" ? (
            <FeedbackPage loggedIn={loggedIn} onRequireLogin={onRequireLogin} />
          ) : page === "help" ? (
            <HelpPage onNavigate={onNavigate} />
          ) : page === "changelog" ? (
            <ChangelogPage />
          ) : page && page.startsWith("legacy:") ? (
            <LegacyPlaceholder page={page} />
          ) : (
            <React.Fragment>
              <div style={{ margin: "auto 0", width: "100%", display: "flex", flexDirection: "column", flex: 1 }}>
                <Comp value={value} setValue={setValue} onSubmit={onSubmit} onPick={onPick} {...memProps} />
                <div style={{ marginTop: "auto", padding: "28px 16px 16px" }}>
                  <AuthorityStrip />
                </div>
              </div>
            </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Left navigation rail (always visible) ----------
function LeftRail({ page, loggedIn, onNavigate, onPick, onNewChat, onResume, onLogout, onRequireLogin, mobile, mobileOpen, onCloseMobile, onOpenBasket, basketCount = 0, forceOpen, onCollapse, conversations }) {
  const M = window.AIDATA.USER_MEMORY;
  const convs = conversations || M.conversations;
  const [openState, setOpen] = useState(() => localStorage.getItem("aida_rail_open") !== "0");
  const open = mobile ? true : forceOpen ? true : openState; // on mobile the drawer always shows full content
  const [acctMenu, setAcctMenu] = useState(false);
  useEffect(() => { try { localStorage.setItem("aida_rail_open", openState ? "1" : "0"); } catch (e) {} }, [openState]);
  const collapse = () => (mobile ? onCloseMobile() : onCollapse ? onCollapse() : setOpen(false));

  const go = (p) => (loggedIn ? onNavigate(p) : onRequireLogin());

  const NavItem = ({ icon, label, active, onClick, accent }) => (
    <button
      data-nav-item
      onClick={onClick}
      title={label}
      style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: open ? "10px 12px" : "10px 0", justifyContent: open ? "flex-start" : "center", borderRadius: 11, border: "none", cursor: "pointer", fontFamily: "var(--font-zh)", fontSize: 14, fontWeight: 600, background: active ? "var(--brand-soft)" : "transparent", color: active ? "var(--brand-deep)" : "var(--ink-2)", transition: "background .15s" }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--surface)"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ flexShrink: 0, width: 20, height: 20, display: "grid", placeItems: "center" }}><CIcon name={icon} size={18} active={active} /></span>
      {open && <span style={{ whiteSpace: "nowrap", lineHeight: 1 }}>{label}</span>}
    </button>
  );

  const asideStyle = mobile
    ? { position: "fixed", top: 0, left: 0, bottom: 0, width: "min(300px, 84vw)", zIndex: 81, background: "var(--surface-2)", display: "flex", flexDirection: "column", transform: mobileOpen ? "translateX(0)" : "translateX(-102%)", transition: "transform .3s cubic-bezier(.32,.72,0,1)", boxShadow: mobileOpen ? "0 20px 60px -20px rgba(0,0,0,.5)" : "none" }
    : { width: open ? 252 : 72, flexShrink: 0, background: "var(--surface-2)", display: "flex", flexDirection: "column", transition: "width .2s" };

  return (
    <React.Fragment>
    {mobile && (
      <div onClick={onCloseMobile} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(20,16,10,.42)", backdropFilter: "blur(2px)", opacity: mobileOpen ? 1 : 0, pointerEvents: mobileOpen ? "auto" : "none", transition: "opacity .26s ease" }} />
    )}
    <aside style={asideStyle}>
      {/* brand + collapse */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: open ? "15px 6px 12px 14px" : "15px 0 12px", justifyContent: "center" }}>
        {open ? (
          <React.Fragment>
            <BotAvatar size={40} glow />
            <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
              <div style={{ fontWeight: 800, fontSize: 15.5, color: "var(--ink)" }}>AI 小博士</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, marginTop: 1 }}>你的备课教学助手</div>
            </div>
            <button data-home-nav onClick={collapse} data-tip={mobile ? "关闭菜单" : "收起菜单"} aria-label={mobile ? "关闭菜单" : "收起菜单"} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent", color: "var(--ink-3)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0, transition: "background .15s, color .15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.color = "var(--ink-2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--ink-3)"; }}>
              <Icon name={mobile ? "close" : "panelLeftClose"} size={17} sw={mobile ? 2.4 : 1.8} />
            </button>
          </React.Fragment>
        ) : (
          <button
            onClick={() => setOpen(true)}
            data-tip="展开菜单"
            data-tip-pos="right"
            aria-label="展开菜单"
            className="rail-brand-toggle"
            style={{ position: "relative", width: 44, height: 44, borderRadius: 12, border: "none", background: "transparent", padding: 0, cursor: "pointer", display: "grid", placeItems: "center" }}
          >
            <span className="rbt-avatar"><BotAvatar size={40} glow /></span>
            <span className="rbt-icon" style={{ position: "absolute", inset: 0, borderRadius: 12, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", color: "var(--brand-deep)", display: "grid", placeItems: "center" }}>
              <Icon name="panelLeftOpen" size={19} />
            </span>
          </button>
        )}
      </div>

      {/* new chat */}
      <div style={{ padding: open ? "0 12px 8px" : "0 12px 8px" }}>
        <button
          data-home-nav
          onClick={onNewChat}
          title="新对话"
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: open ? "11px 14px" : "11px 0", borderRadius: 999, border: "none", background: "var(--surface)", color: "var(--ink)", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", boxShadow: "0 1px 4px oklch(0.3 0.02 260 / .14)" }}
        >
          <Icon name="plus" size={17} sw={2.4} /> {open && "新对话"}
        </button>
      </div>

      {/* nav */}
      <div style={{ padding: open ? "8px 12px" : "8px 12px", display: "flex", flexDirection: "column", gap: 3 }}>
        <NavItem icon="file" label="智能组卷" active={page === "legacy:paper"} onClick={() => go("legacy:paper")} />
        <NavItem icon="interactive" label="互动课件" active={page === "legacy:interactive"} onClick={() => go("legacy:interactive")} />
        <NavItem icon="book" label="教材百科" active={page === "legacy:textbook"} onClick={() => go("legacy:textbook")} />
        <NavItem icon="grade" label="作文批改" active={page === "legacy:grade"} onClick={() => go("legacy:grade")} />
        <NavItem icon="image" label="AI 生图" active={page === "legacy:image"} onClick={() => go("legacy:image")} />
        <NavItem icon="megaphone" label="AI 讲卷" active={page === "legacy:explain"} onClick={() => go("legacy:explain")} />
        <NavItem icon="spark" label="智能体" active={page === "legacy:agent"} onClick={() => go("legacy:agent")} />
        <NavItem icon="grid" label="我的内容" active={page === "works"} onClick={() => go("works")} />
        {!open && (
          <NavItem icon="chat" label="历史对话" active={page === "history"} onClick={() => (loggedIn ? onNavigate("history") : onRequireLogin())} />
        )}
      </div>

      {/* conversation history (expanded only) */}
      {open && (
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", paddingTop: 6 }}>
          <div style={{ padding: "4px 8px 8px 18px", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-3)" }}>历史对话</span>
            <div style={{ flex: 1 }} />
            {loggedIn && (
              <button
                onClick={() => onNavigate("history")}
                data-tip="全部历史对话"
                aria-label="全部历史对话"
                style={{ border: "none", background: "transparent", color: "var(--ink-3)", cursor: "pointer", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7, transition: "background .15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <CIcon name="history" size={16} />
              </button>
            )}
          </div>
          {loggedIn ? (
            <div style={{ flex: 1, overflowY: "auto", padding: "0 10px 10px", display: "flex", flexDirection: "column", gap: 1 }}>
              {convs.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onResume && onResume({ ...c, isConversation: true })}
                  title={c.title}
                  style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 10, border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-zh)", textAlign: "left", transition: "background .15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ flexShrink: 0, display: "grid", placeItems: "center", width: 18 }}><CIcon name={c.icon} size={15} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ flex: 1 }}>
              <button onClick={onRequireLogin} style={{ margin: "4px 12px", padding: "16px 14px", width: "calc(100% - 24px)", borderRadius: 12, border: "1px dashed var(--line)", background: "var(--surface)", cursor: "pointer", fontFamily: "var(--font-zh)", textAlign: "center" }}>
                <div style={{ fontSize: 12.5, color: "var(--ink-2)", fontWeight: 600, lineHeight: 1.6 }}>登录后查看历史对话<br /><span style={{ color: "var(--ink-3)", fontWeight: 500 }}>你的每一次创作都会自动保存</span></div>
              </button>
            </div>
          )}
        </div>
      )}
      {!open && <div style={{ flex: 1 }} />}

      {/* account (bottom) */}
      <div style={{ padding: open ? "8px 12px 12px" : "8px 8px 12px", position: "relative" }}>
        {loggedIn ? (
          <React.Fragment>
            <button
              onClick={() => setAcctMenu((m) => !m)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: open ? "8px 10px" : "7px 0", justifyContent: open ? "flex-start" : "center", borderRadius: 12, border: "none", background: "transparent", boxShadow: "none", cursor: "pointer", fontFamily: "var(--font-zh)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "oklch(0.94 0.01 260)")}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", fontWeight: 700, fontSize: 13.5, flexShrink: 0 }}>李</span>
              {open && (
                <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>李老师</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>初中数学</div>
                </div>
              )}
              {open && <Icon name="filter" size={14} />}
            </button>
            {acctMenu && (
              <React.Fragment>
                <div onClick={() => setAcctMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 30 }} />
                <div className="enter-pop" style={{ position: "absolute", left: open ? 12 : 8, right: open ? 12 : "auto", bottom: "calc(100% - 2px)", minWidth: 180, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 13, boxShadow: "0 18px 44px -22px rgba(0,0,0,.4)", padding: 7, zIndex: 31 }}>
                  <MenuRow icon="feedback" label="反馈" onClick={() => { setAcctMenu(false); onNavigate("feedback"); }} />
                  <MenuRow icon="help" label="帮助" onClick={() => { setAcctMenu(false); onNavigate("help"); }} />
                  <MenuRow icon="megaphone" label="产品更新动态" onClick={() => { setAcctMenu(false); onNavigate("changelog"); }} />
                  
                  <div style={{ height: 1, background: "var(--line)", margin: "5px 4px" }} />
                  <MenuRow icon="back" label="退出登录" onClick={() => { setAcctMenu(false); onLogout && onLogout(); }} />
                </div>
              </React.Fragment>
            )}
          </React.Fragment>
        ) : (
          <button
            onClick={onRequireLogin}
            title="登录 / 注册"
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: open ? "10px 14px" : "10px 0", borderRadius: 11, border: "1px solid var(--brand)", background: "var(--brand-soft)", color: "var(--brand-deep)", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", whiteSpace: "nowrap" }}
          >
            <Icon name="login" size={17} /> {open && "登录 / 注册"}
          </button>
        )}
      </div>
    </aside>
    </React.Fragment>
  );
}

Object.assign(window, { Homepage, LeftRail });

// ---------- 记忆管理 (memory management page) ----------
function MemSwitch({ on, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ width: 38, height: 22, borderRadius: 999, border: "none", cursor: "pointer", padding: 2, background: on ? "var(--brand)" : "var(--line)", transition: "background .2s", flexShrink: 0, display: "flex", justifyContent: on ? "flex-end" : "flex-start" }}
    >
      <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.3)", transition: "all .2s" }} />
    </button>
  );
}

function MemoryPage({ onResume }) {
  const M = window.AIDATA.USER_MEMORY;
  const mobile = useIsMobile();
  const [tags, setTags] = useState(M.tags);
  const [entries, setEntries] = useState(M.entries.map((e) => ({ ...e })));
  const [cleared, setCleared] = useState(false);

  const removeTag = (i) => setTags((t) => t.filter((_, j) => j !== i));
  const toggleEntry = (id) => setEntries((es) => es.map((e) => (e.id === id ? { ...e, on: !e.on } : e)));
  const removeEntry = (id) => setEntries((es) => es.filter((e) => e.id !== id));
  const clearAll = () => { setTags([]); setEntries([]); setCleared(true); };

  const activeCount = entries.filter((e) => e.on).length;

  const Section = ({ icon, title, hint, action, children }) => (
    <div style={{ marginBottom: 26 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
        <span style={{ color: "var(--ink-3)" }}><Icon name={icon} size={16} /></span>
        <span style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>{title}</span>
        {hint && <span style={{ fontSize: 12, color: "var(--ink-3)", marginLeft: 4, whiteSpace: "nowrap" }}>{hint}</span>}
        <div style={{ flex: 1 }} />
        {action}
      </div>
      {children}
    </div>
  );

  return (
    <div className="home-fade" style={{ flex: 1, overflowY: "auto", padding: mobile ? "8px 16px 48px" : "10px 24px 60px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* page heading */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 0 22px" }}>
          <span style={{ width: 46, height: 46, borderRadius: 14, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}>
            <Icon name="spark" size={22} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 23, fontWeight: 800, color: "var(--ink)", margin: 0 }}>我的记忆</h1>
            <div style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 600, marginTop: 2 }}>小博士从你的使用中学到的内容 · 你可以随时编辑或删除</div>
          </div>
          {!cleared && (
            <button onClick={clearAll} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 10, border: "1px solid oklch(0.85 0.07 25)", background: "oklch(0.97 0.02 25)", color: "oklch(0.5 0.16 25)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", flexShrink: 0 }}>
              清空全部
            </button>
          )}
        </div>

        {cleared ? (
          <div style={{ textAlign: "center", padding: "70px 20px", color: "var(--ink-3)" }}>
            <div style={{ display: "inline-flex", marginBottom: 12, color: "var(--line)" }}><Icon name="spark" size={48} sw={1.3} /></div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-2)", marginBottom: 6 }}>记忆已清空</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>小博士会在你继续使用的过程中，重新学习你的偏好。</div>
          </div>
        ) : (
          <React.Fragment>
            <Section icon="quote" title="小博士眼中的你">
              <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: "16px 18px" }}>
                <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.8, color: "var(--ink-2)" }}>{M.summary}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 13, paddingTop: 12, borderTop: "1px dashed var(--line)" }}>
                  <span style={{ fontSize: 12, color: "var(--ink-3)", whiteSpace: "nowrap" }}>记忆更新于 {M.updated}</span>
                </div>
              </div>
            </Section>

            <Section icon="filter" title="教学画像" hint="自动推断 · 点 × 移除">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {tags.length === 0 && <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>暂无画像标签</span>}
                {tags.map((t, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 10px 7px 12px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--line)", fontSize: 13 }}>
                    <span style={{ color: "var(--ink-3)", fontSize: 11.5 }}>{t.k}</span>
                    <span style={{ color: "var(--brand-deep)", fontWeight: 700 }}>{t.v}</span>
                    <span onClick={() => removeTag(i)} style={{ display: "inline-flex", cursor: "pointer", color: "var(--ink-3)", marginLeft: 1 }}><Icon name="close" size={13} sw={2.6} /></span>
                  </span>
                ))}
              </div>
            </Section>

            <Section icon="layers" title="记忆条目" hint={`${activeCount} 条生效 / 共 ${entries.length} 条`}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {entries.length === 0 && <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>暂无记忆条目</span>}
                {entries.map((e) => (
                  <div key={e.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: "14px 16px", opacity: e.on ? 1 : 0.55, transition: "opacity .2s" }}>
                    <span style={{ width: 32, height: 32, borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--line)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0, marginTop: 1 }}>
                      <Icon name={e.icon} size={16} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)" }}>{e.text}</div>
                      <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 3, lineHeight: 1.5, display: "flex", alignItems: "center", gap: 5 }}>
                        <Icon name="spark" size={12} /> {e.basis}
                      </div>
                    </div>
                    <MemSwitch on={e.on} onClick={() => toggleEntry(e.id)} />
                    <button onClick={() => removeEntry(e.id)} title="删除这条记忆" style={{ width: 30, height: 30, borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface-2)", color: "var(--ink-3)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}>
                      <Icon name="close" size={14} sw={2.4} />
                    </button>
                  </div>
                ))}
              </div>
            </Section>

            <Section icon="history" title="记忆来源" hint="基于你的真实使用">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 20, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: "16px 18px" }}>
                {M.stats.map((s, i) => (
                  <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                    <span style={{ color: "var(--ink-3)" }}><CIcon name={s.icon} size={16} /></span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", fontFamily: "var(--font-num)" }}>{s.n}</span>
                    <span style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 600 }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </Section>

            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ink-3)", lineHeight: 1.5, padding: "4px 2px" }}>
              <Icon name="shield" size={14} /> 记忆仅用于改善你的创作体验，可随时关闭或清空。
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

// ---------- 我的作品 (finished deliverables library) ----------
// ---------- 我的内容 (all content: generated, downloaded, 备课 products…) ----------
function WorksPage({ onResume, onNewChat }) {
  const M = window.AIDATA.USER_MEMORY;
  const mobile = useIsMobile();
  const SOURCES = ["全部", "AI 生成", "找资源下载"];
  const [filter, setFilter] = useState("全部");
  // list is the default view; teachers scan their library faster as a dense list,
  // and switch to cards when they want the visual previews. choice persists.
  const [view, setViewState] = useState(() => localStorage.getItem("aida_works_view") || "list");
  const setView = (v) => { setViewState(v); try { localStorage.setItem("aida_works_view", v); } catch (e) {} };
  const items = M.works.filter((w) => filter === "全部" || w.source === filter);
  const srcStyle = (src) => {
    if (src === "AI 生成") return { c: "var(--brand-deep)", bg: "var(--brand-soft)", bd: "var(--brand-soft-border)", icon: "spark" };
    return { c: "var(--auth-ink)", bg: "var(--auth-bg)", bd: "var(--auth-border)", icon: "download" };
  };
  const ViewToggle = () => (
    <div style={{ display: "inline-flex", padding: 3, gap: 2, borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", flexShrink: 0 }}>
      {[{ k: "list", ic: "list", t: "列表" }, { k: "card", ic: "grid", t: "卡片" }].map((o) => (
        <button key={o.k} onClick={() => setView(o.k)} data-tip={o.t} aria-label={o.t}
          style={{ width: 32, height: 28, borderRadius: 7, border: "none", cursor: "pointer", display: "grid", placeItems: "center", background: view === o.k ? "var(--brand-soft)" : "transparent", color: view === o.k ? "var(--brand-deep)" : "var(--ink-3)", transition: "background .15s, color .15s" }}>
          <Icon name={o.ic} size={16} />
        </button>
      ))}
    </div>
  );

  return (
    <div className="home-fade" style={{ flex: 1, overflowY: "auto", padding: mobile ? "8px 16px 48px" : "10px 24px 60px" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        {/* heading */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 0 16px" }}>
          <span style={{ width: 46, height: 46, borderRadius: 14, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}>
            <Icon name="grid" size={21} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 23, fontWeight: 800, color: "var(--ink)", margin: 0 }}>我的内容</h1>
            <div style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 600, marginTop: 2 }}>你的全部教学资料 · AI 生成与找资源下载，共 {M.works.length} 份</div>
          </div>
        </div>

        {/* filter by source + view toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
          {SOURCES.map((k) => (
            <button key={k} onClick={() => setFilter(k)} style={{ padding: "7px 15px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", border: filter === k ? "1px solid var(--brand)" : "1px solid var(--line)", background: filter === k ? "var(--brand-soft)" : "var(--surface)", color: filter === k ? "var(--brand-deep)" : "var(--ink-2)", transition: "all .15s" }}>{k}</button>
          ))}
          <div style={{ flex: 1 }} />
          <ViewToggle />
        </div>

        {/* list view (default) */}
        {view === "list" ? (
          <div style={{ border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", background: "var(--surface)" }}>
            {items.map((w, i) => {
              const ss = srcStyle(w.source);
              return (
                <div key={w.id} className="works-row" style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", borderTop: i === 0 ? "none" : "1px solid var(--line)", transition: "background .14s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <ScenarioGlyph icon={w.icon} hue={w.hue} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{w.title}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: `oklch(0.42 0.13 ${w.hue})`, background: `oklch(0.95 0.04 ${w.hue})`, border: `1px solid oklch(0.86 0.06 ${w.hue})`, padding: "1px 7px", borderRadius: 999, whiteSpace: "nowrap", flexShrink: 0 }}>{w.kind}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.meta}</div>
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10.5, fontWeight: 700, color: ss.c, background: ss.bg, border: `1px solid ${ss.bd}`, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap", flexShrink: 0 }}><Icon name={ss.icon} size={11} /> {w.source}</span>
                  <span style={{ fontSize: 11.5, color: "var(--ink-3)", flexShrink: 0, width: 84, textAlign: "right" }}>{w.status === "draft" ? "草稿 · " : ""}{w.when}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
                    <button title="预览" style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer" }}><Icon name="eye" size={15} /></button>
                    <button title="下载" style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer" }}><Icon name="download" size={15} /></button>
                    <button onClick={() => onResume && onResume(w)} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 9, border: "none", background: "var(--brand-soft)", color: "var(--brand-deep)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>{w.source === "AI 生成" ? "继续" : "打开"} <Icon name="arrow" size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
        /* card view */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {items.map((w) => {
            const ss = srcStyle(w.source);
            return (
            <div key={w.id} className="work-card" style={{ display: "flex", flexDirection: "column", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden", transition: "transform .18s, box-shadow .25s, border-color .2s" }}>
              {/* preview strip */}
              <div className="ph-stripe" style={{ height: 116, position: "relative", display: "grid", placeItems: "center" }}>
                <ScenarioGlyph icon={w.icon} hue={w.hue} size={46} active />
                <span style={{ position: "absolute", top: 10, left: 10, fontSize: 10.5, fontWeight: 700, color: `oklch(0.42 0.13 ${w.hue})`, background: `oklch(0.95 0.04 ${w.hue})`, border: `1px solid oklch(0.86 0.06 ${w.hue})`, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>{w.kind}</span>
                <span style={{ position: "absolute", top: 10, right: 10, display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, color: ss.c, background: ss.bg, border: `1px solid ${ss.bd}`, padding: "2px 7px", borderRadius: 999, whiteSpace: "nowrap" }}><Icon name={ss.icon} size={10} /> {w.source}</span>
              </div>
              {/* body */}
              <div style={{ padding: "13px 15px", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)", lineHeight: 1.4 }}>{w.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 4, lineHeight: 1.5 }}>{w.meta}</div>
                <div style={{ flex: 1 }} />
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 13 }}>
                  <span style={{ fontSize: 11, color: "var(--ink-3)", flex: 1 }}>{w.status === "draft" ? "草稿 · " : ""}{w.when}</span>
                  <button title="预览" style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer" }}><Icon name="eye" size={15} /></button>
                  <button title="下载" style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer" }}><Icon name="download" size={15} /></button>
                  <button onClick={() => onResume && onResume(w)} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 9, border: "none", background: "var(--brand-soft)", color: "var(--brand-deep)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>{w.source === "AI 生成" ? "继续" : "打开"} <Icon name="arrow" size={14} /></button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}

// ---------- 历史对话 (all chat sessions) — vertical timeline ----------
function HistoryPage({ onResume, onNewChat, conversations }) {
  const M = window.AIDATA.USER_MEMORY;
  const mobile = useIsMobile();
  const convs = conversations || M.conversations;
  // group conversations into timeline milestones by their time bucket, preserving
  // the newest-first order the list already carries.
  const groups = [];
  const seen = {};
  convs.forEach((c) => {
    const k = c.when || "更早";
    if (!seen[k]) { seen[k] = { when: k, items: [] }; groups.push(seen[k]); }
    seen[k].items.push(c);
  });
  const SPINE = 9; // x-center of the vertical rail

  return (
    <div className="home-fade" style={{ flex: 1, overflowY: "auto", padding: mobile ? "8px 16px 48px" : "10px 24px 60px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 0 18px" }}>
          <span style={{ width: 46, height: 46, borderRadius: 14, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}>
            <Icon name="chat" size={21} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 23, fontWeight: 800, color: "var(--ink)", margin: 0 }}>历史对话</h1>
            <div style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 600, marginTop: 2 }}>你与小博士的每一次对话都已保存 · 共 {convs.length} 段，点击任意一条继续</div>
          </div>
        </div>

        {/* timeline */}
        <div style={{ position: "relative", paddingLeft: 30 }}>
          {/* the spine */}
          <div style={{ position: "absolute", left: SPINE - 1, top: 12, bottom: 14, width: 2, background: "var(--line)" }} />
          {groups.map((g, gi) => (
            <div key={gi} style={{ position: "relative" }}>
              {/* milestone label */}
              <div style={{ position: "relative", display: "flex", alignItems: "center", padding: gi === 0 ? "2px 0 10px" : "20px 0 10px" }}>
                <span style={{ position: "absolute", left: SPINE - 30 - 5, top: "50%", marginTop: -5, width: 10, height: 10, borderRadius: 999, background: "var(--brand)", boxShadow: "0 0 0 4px var(--canvas)" }} />
                <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--ink-2)", letterSpacing: ".02em" }}>{g.when}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", marginLeft: 8, fontFamily: "var(--font-num)" }}>{g.items.length}</span>
              </div>
              {/* entries */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 4 }}>
                {g.items.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onResume && onResume({ ...c, isConversation: true })}
                    style={{ position: "relative", width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 13, border: "1px solid var(--line)", background: "var(--surface)", cursor: "pointer", fontFamily: "var(--font-zh)", textAlign: "left", transition: "transform .15s, border-color .2s, box-shadow .2s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateX(2px)"; e.currentTarget.style.borderColor = "var(--brand-soft-border)"; e.currentTarget.style.boxShadow = "0 8px 20px -16px rgba(0,0,0,.45)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    {/* node on the spine */}
                    <span style={{ position: "absolute", left: SPINE - 30 - 4, top: "50%", marginTop: -4, width: 9, height: 9, borderRadius: 999, background: "var(--canvas)", border: "2px solid var(--ink-4, var(--line))", boxShadow: "0 0 0 3px var(--canvas)" }} />
                    <span style={{ width: 28, height: 28, display: "grid", placeItems: "center", flexShrink: 0 }}><CIcon name={c.icon} size={18} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>最近：{c.last}</div>
                    </div>
                    <span style={{ color: "var(--ink-3)", flexShrink: 0, opacity: .55 }}><Icon name="chevronRight" size={16} /></span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- 反馈 ----------
function FeedbackPage({ loggedIn, onRequireLogin }) {
  const mobile = useIsMobile();
  const CATS = [
    { k: "bug", label: "问题反馈" },
    { k: "idea", label: "功能建议" },
    { k: "other", label: "其他" },
  ];
  const catLabel = (k) => (CATS.find((c) => c.k === k) || {}).label || k;
  const [cat, setCat] = useState("bug");
  const [text, setText] = useState("");
  const [images, setImages] = useState([]); // { id, url, name }
  const [sent, setSent] = useState(false);
  const fileRef = useRef(null);
  // local record of past submissions — there's no backend, so this lives in
  // localStorage on this device; good enough for "did I already report this".
  const [log, setLog] = useState(() => {
    try { return JSON.parse(localStorage.getItem("aida_feedback_log") || "[]"); } catch (e) { return []; }
  });

  const addImages = (files) => {
    const room = Math.max(0, 4 - images.length);
    const next = Array.from(files || []).slice(0, room).map((f) => ({ id: Math.random().toString(36).slice(2), url: URL.createObjectURL(f), name: f.name }));
    if (next.length) setImages((im) => [...im, ...next]);
  };
  const removeImage = (id) => setImages((im) => im.filter((i) => i.id !== id));

  const submit = () => {
    if (!loggedIn) { onRequireLogin && onRequireLogin(); return; }
    if (!text.trim()) return;
    const entry = {
      id: Math.random().toString(36).slice(2),
      cat,
      text: text.trim(),
      imageCount: images.length,
      when: new Date().toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
    };
    const nextLog = [entry, ...log].slice(0, 20);
    setLog(nextLog);
    try { localStorage.setItem("aida_feedback_log", JSON.stringify(nextLog)); } catch (e) {}
    setSent(true);
  };

  const reset = () => { setSent(false); setText(""); setImages([]); };
  const canSubmit = !loggedIn || !!text.trim();

  return (
    <div className="home-fade" style={{ flex: 1, overflowY: "auto", padding: mobile ? "8px 16px 48px" : "10px 24px 60px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 0 22px" }}>
          <span style={{ width: 46, height: 46, borderRadius: 14, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}>
            <Icon name="feedback" size={21} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 23, fontWeight: 800, color: "var(--ink)", margin: 0 }}>反馈</h1>
            <div style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 600, marginTop: 2 }}>遇到问题，或者有功能建议？告诉小博士。</div>
          </div>
        </div>

        {sent ? (
          <div style={{ textAlign: "center", padding: "70px 20px", color: "var(--ink-3)" }}>
            <div style={{ display: "inline-flex", marginBottom: 12, color: "var(--brand-deep)" }}><Icon name="check" size={44} sw={1.6} /></div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-2)", marginBottom: 6 }}>已收到你的反馈，谢谢！</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.6, marginBottom: 20 }}>我们会尽快查看这条反馈，感谢你帮小博士变得更好用。</div>
            <button onClick={reset} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 16px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>
              再提一条
            </button>
          </div>
        ) : (
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-2)", marginBottom: 9 }}>类型</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {CATS.map((c) => (
                <button key={c.k} onClick={() => setCat(c.k)} style={{ padding: "7px 15px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", border: cat === c.k ? "1px solid var(--brand)" : "1px solid var(--line)", background: cat === c.k ? "var(--brand-soft)" : "var(--surface)", color: cat === c.k ? "var(--brand-deep)" : "var(--ink-2)" }}>{c.label}</button>
              ))}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-2)", marginBottom: 9 }}>详细描述</div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="请描述你遇到的问题，或希望小博士支持的功能…"
              rows={6}
              style={{ width: "100%", boxSizing: "border-box", resize: "vertical", padding: "12px 14px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface-2)", color: "var(--ink)", fontSize: 14, lineHeight: 1.6, fontFamily: "var(--font-zh)", outline: "none" }}
            />
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-2)", margin: "16px 0 9px" }}>图片（选填，最多 4 张）</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {images.map((img) => (
                <div key={img.id} style={{ position: "relative", width: 76, height: 76, borderRadius: 10, overflow: "hidden", border: "1px solid var(--line)", flexShrink: 0 }}>
                  <img src={img.url} alt={img.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <button onClick={() => removeImage(img.id)} aria-label="删除图片" style={{ position: "absolute", top: 3, right: 3, width: 18, height: 18, borderRadius: "50%", border: "none", background: "rgba(0,0,0,.55)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}>
                    <Icon name="close" size={10} sw={3} />
                  </button>
                </div>
              ))}
              {images.length < 4 && (
                <button onClick={() => fileRef.current && fileRef.current.click()} style={{ width: 76, height: 76, borderRadius: 10, border: "1px dashed var(--line)", background: "var(--surface-2)", color: "var(--ink-3)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer", fontFamily: "var(--font-zh)", flexShrink: 0 }}>
                  <Icon name="image" size={18} />
                  <span style={{ fontSize: 10.5 }}>上传图片</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => { addImages(e.target.files); e.target.value = ""; }} />
            </div>
            <button
              onClick={submit}
              disabled={!canSubmit}
              style={{ marginTop: 18, display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 22px", borderRadius: 11, border: "none", background: canSubmit ? "var(--brand-grad)" : "var(--line)", backgroundColor: "var(--brand)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: canSubmit ? "pointer" : "default", fontFamily: "var(--font-zh)", opacity: canSubmit ? 1 : 0.6 }}
            >
              <Icon name="send" size={16} /> 提交反馈
            </button>
            {!loggedIn && (
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 9 }}>登录后才能提交反馈，点击上方按钮会先引导你登录。</div>
            )}
          </div>
        )}

        {log.length > 0 && (
          <div style={{ marginTop: 26 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-3)", marginBottom: 10 }}>我的反馈记录</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {log.map((e) => (
                <div key={e.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: "11px 13px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--brand-deep)", background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", padding: "2px 8px", borderRadius: 999, flexShrink: 0, marginTop: 1, whiteSpace: "nowrap" }}>{catLabel(e.cat)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{e.text}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                      {e.imageCount > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Icon name="image" size={11} /> {e.imageCount}</span>}
                      <span>{e.when}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- 帮助 ----------
function HelpPage({ onNavigate }) {
  const mobile = useIsMobile();
  const FAQS = [
    { q: "小博士能帮我做什么？", a: "找资源、问教材、写教案、做课件、出卷子、做思维导图、批改作业——七大教学场景，直接在输入框描述需求，AI 会自动判断该进入哪个场景。" },
    { q: "找到的资源可靠吗？", a: "小博士的资源库来自学科网，找资源时会优先展示你自己的内容与已收藏资源，其余来自学科网公共库，均经过三审三校。" },
    { q: "登录后有什么不同？", a: "登录后可以查看历史对话、我的内容，创作时自动预填常用配置与我的记忆，随时续作。" },
    { q: "生成的内容存在哪里？", a: "AI 生成的课件、教案、试卷、思维导图会自动存入「我的内容」；从找资源下载的资料也会归档在这里，可随时续作或重新下载。" },
      ];
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <div className="home-fade" style={{ flex: 1, overflowY: "auto", padding: mobile ? "8px 16px 48px" : "10px 24px 60px" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 0 22px" }}>
          <span style={{ width: 46, height: 46, borderRadius: 14, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}>
            <Icon name="help" size={22} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 23, fontWeight: 800, color: "var(--ink)", margin: 0 }}>帮助</h1>
            <div style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 600, marginTop: 2 }}>常见问题与使用说明</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {FAQS.map((f, i) => {
            const isOpen = openIdx === i;
            return (
              <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden" }}>
                <button onClick={() => setOpenIdx(isOpen ? -1 : i)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-zh)" }}>
                  <span style={{ flex: 1, fontSize: 14.5, fontWeight: 700, color: "var(--ink)" }}>{f.q}</span>
                  <span style={{ color: "var(--ink-3)", flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}><Icon name="chevronDown" size={16} /></span>
                </button>
                {isOpen && (
                  <div style={{ padding: "0 16px 16px", fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.7 }}>{f.a}</div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 11, padding: "14px 16px", borderRadius: 14, border: "1px dashed var(--brand-soft-border)", background: "var(--brand-soft)" }}>
          <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--surface)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}>
            <Icon name="feedback" size={16} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>没找到答案？</div>
            <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 1 }}>去反馈页告诉我们，我们会尽快跟进。</div>
          </div>
          <button onClick={() => onNavigate && onNavigate("feedback")} style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 10, border: "1px solid var(--brand-soft-border)", background: "var(--surface)", color: "var(--brand-deep)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>
            去反馈 <Icon name="arrow" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- 产品更新动态 ----------
function ChangelogPage() {
  const mobile = useIsMobile();
  const UPDATES = [
        { date: "2026-06-10", title: "互动课件新增课堂活动", points: ["课件中可直接插入抢答、随堂练习等互动组件", "支持「传统 PPT」与「互动课件」两种形态自由切换"] },
    { date: "2026-05-22", title: "找资源支持专辑与视频章节锚点", points: ["结果按全部 / 文档 / 视频 / 专辑分轨呈现", "视频支持章节锚点跳转，资源可一键收藏进资源篮"] },
    { date: "2026-05-02", title: "上线批改场景", points: ["支持整班作业批改，自动生成错题本与评语", "可导出班级质量分析，含逐题正确率与共性错误"] },
  ];
  const SPINE = 9;

  return (
    <div className="home-fade" style={{ flex: 1, overflowY: "auto", padding: mobile ? "8px 16px 48px" : "10px 24px 60px" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 0 22px" }}>
          <span style={{ width: 46, height: 46, borderRadius: 14, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}>
            <Icon name="megaphone" size={21} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 23, fontWeight: 800, color: "var(--ink)", margin: 0 }}>产品更新动态</h1>
            <div style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 600, marginTop: 2 }}>我们如何让小博士越来越好用</div>
          </div>
        </div>

        <div style={{ position: "relative", paddingLeft: 30 }}>
          <div style={{ position: "absolute", left: SPINE - 1, top: 6, bottom: 6, width: 2, background: "var(--line)" }} />
          {UPDATES.map((u, i) => (
            <div key={i} style={{ position: "relative", paddingBottom: i < UPDATES.length - 1 ? 22 : 0 }}>
              <span style={{ position: "absolute", left: SPINE - 5 - 30, top: 3, width: 10, height: 10, borderRadius: "50%", background: "var(--brand)", border: "3px solid var(--brand-soft)" }} />
              <div style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 700, marginBottom: 6, fontFamily: "var(--font-num)" }}>{u.date}</div>
              <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>{u.title}</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.8 }}>
                  {u.points.map((p, j) => <li key={j}>{p}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MemoryPage, WorksPage, HistoryPage, FeedbackPage, HelpPage, ChangelogPage });

// ---------- 资源篮 (resource basket) — full PAGE when opened from the menu ----------
// (the right-side drawer form, BasketPanel, is kept for in-scenario quick access)
function BasketPage({ items = [], onRemove, onClear, onOpenContent, onNewChat, onGoFind }) {
  const mobile = useIsMobile();
  return (
    <div className="home-fade" style={{ flex: 1, overflowY: "auto", padding: mobile ? "8px 16px 48px" : "10px 24px 60px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* heading */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 0 18px" }}>
          <span style={{ width: 46, height: 46, borderRadius: 14, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}>
            <Icon name="basket" size={21} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 23, fontWeight: 800, color: "var(--ink)", margin: 0 }}>资源篮</h1>
            <div style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 600, marginTop: 2 }}>{items.length > 0 ? `已收集 ${items.length} 份资源 · 可一并下载，或送去出卷 / 备课` : "你跨场景收集的资源都会汇总到这里"}</div>
          </div>
          {items.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
              <button onClick={onClear} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 14px", borderRadius: 11, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-3)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>
                <Icon name="trash" size={15} /> 清空
              </button>
              <button style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 11, border: "none", background: "var(--brand-grad)", backgroundColor: "var(--brand)", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", boxShadow: "0 4px 14px -6px var(--brand-glow)" }}>
                <Icon name="download" size={16} /> 打包下载 {items.length} 份
              </button>
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <div style={{ border: "1px dashed var(--line)", borderRadius: 16, padding: "56px 24px", textAlign: "center", background: "var(--surface)" }}>
            <div style={{ display: "inline-flex", marginBottom: 14, color: "var(--line)" }}><Icon name="basket" size={52} sw={1.4} /></div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", marginBottom: 7 }}>资源篮还是空的</div>
            <div style={{ fontSize: 13.5, color: "var(--ink-3)", lineHeight: 1.7, maxWidth: 340, margin: "0 auto 18px" }}>在「找资源」里预览任意文档或视频，点<b style={{ color: "var(--brand-deep)" }}>加入资源篮</b>，就会出现在这里，随时取用。</div>
            <button onClick={onGoFind} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 11, border: "none", background: "var(--brand-soft)", color: "var(--brand-deep)", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>
              <CIcon name="search" size={16} /> 去找资源
            </button>
          </div>
        ) : (
          <div style={{ border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", background: "var(--surface)" }}>
            {items.map((it, i) => {
              const isAlbum = /专辑|合集/.test(it.type || "");
              const isVideo = /视频|微课|实验/.test(it.type || "");
              const ic = isAlbum ? "layers" : isVideo ? "interactive" : "file";
              const tint = isAlbum ? { c: "var(--brand-deep)", bg: "var(--brand-soft)", bd: "var(--brand-soft-border)" } : isVideo ? { c: "oklch(0.5 0.13 200)", bg: "oklch(0.95 0.04 200)", bd: "oklch(0.86 0.06 200)" } : { c: "var(--ink-3)", bg: "var(--surface-2)", bd: "var(--line)" };
              return (
                <div key={it.bid} className="basket-row" style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 16px", borderTop: i === 0 ? "none" : "1px solid var(--line)", transition: "background .14s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <span style={{ width: 38, height: 38, borderRadius: 10, background: tint.bg, border: "1px solid " + tint.bd, display: "grid", placeItems: "center", color: tint.c, flexShrink: 0 }}><Icon name={ic} size={18} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 3 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 800, color: tint.c, background: tint.bg, border: "1px solid " + tint.bd, padding: "1px 7px", borderRadius: 6, flexShrink: 0 }}>{it.type}</span>
                      {it.meta && <span style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.meta}</span>}
                    </div>
                  </div>
                  <button title="下载" style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}><Icon name="download" size={15} /></button>
                  <button onClick={() => onRemove && onRemove(it.bid)} title="移出资源篮" style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-3)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}><Icon name="trash" size={15} /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { BasketPage });

// ---------- Login modal (triggered by gated actions) ----------
function LoginModal({ onClose, onLogin }) {
  const [phone, setPhone] = useState("");
  const benefits = [
    { icon: "spark", t: "小博士记住你的学科、版本与偏好" },
    { icon: "history", t: "历史对话与作品云端同步" },
    { icon: "shield", t: "创作有据可依，安全可信" },
  ];
  return (
    <div data-login-modal style={{ position: "fixed", inset: 0, zIndex: 90, display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(20,16,10,.5)", backdropFilter: "blur(3px)" }} />
      <div className="intent-card" style={{ position: "relative", width: "min(420px, 100%)", background: "var(--canvas)", borderRadius: 22, border: "1px solid var(--line)", boxShadow: "0 40px 90px -40px rgba(0,0,0,.55)", overflow: "hidden" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, width: 32, height: 32, borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-3)", display: "grid", placeItems: "center", cursor: "pointer", zIndex: 2 }}>
          <Icon name="close" size={15} sw={2.4} />
        </button>
        <div style={{ padding: "30px 30px 26px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}><BotAvatar size={52} glow /></div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", textAlign: "center", margin: "0 0 6px" }}>登录 AI 小博士</h2>
          <p style={{ fontSize: 13, color: "var(--ink-3)", textAlign: "center", margin: "0 0 20px", lineHeight: 1.6 }}>登录后即可使用历史对话与作品管理</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号"
              inputMode="numeric"
              style={{ width: "100%", padding: "13px 15px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 14.5, fontFamily: "var(--font-zh)", color: "var(--ink)", outline: "none", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 9 }}>
              <input placeholder="验证码" style={{ flex: 1, minWidth: 0, padding: "13px 15px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 14.5, fontFamily: "var(--font-zh)", color: "var(--ink)", outline: "none", boxSizing: "border-box" }} />
              <button style={{ flexShrink: 0, padding: "0 14px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface-2)", color: "var(--ink-2)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", whiteSpace: "nowrap" }}>获取验证码</button>
            </div>
          </div>

          <button
            onClick={onLogin}
            style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: "var(--brand-grad)", backgroundColor: "var(--brand)", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-zh)", boxShadow: "0 6px 18px -6px var(--brand-glow)" }}
          >
            登录 / 注册
          </button>

          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 20, paddingTop: 18, borderTop: "1px dashed var(--line)" }}>
            {benefits.map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, color: "var(--ink-2)" }}>
                <span style={{ width: 22, height: 22, borderRadius: 7, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}><Icon name={b.icon} size={12} /></span>
                {b.t}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
            登录即代表同意《用户协议》与《隐私政策》<br />演示环境，点击「登录」即可直接进入
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginModal });

// ---------- 资源篮 (resource basket) — global overlay, openable anywhere ----------
function BasketPanel({ open, items, onClose, onRemove, onClear, onOpenContent }) {
  const mobile = useIsMobile();
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const panelStyle = mobile
    ? { position: "fixed", left: 0, right: 0, bottom: 0, height: "82dvh", maxHeight: "82vh", borderRadius: "18px 18px 0 0", transform: open ? "translateY(0)" : "translateY(101%)" }
    : { position: "fixed", top: 0, right: 0, bottom: 0, width: "min(420px, 92vw)", borderRadius: 0, transform: open ? "translateX(0)" : "translateX(102%)" };

  return (
    <React.Fragment>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(20,16,10,.42)", backdropFilter: "blur(2px)", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity .26s ease" }} />
      <div style={{ ...panelStyle, zIndex: 91, background: "var(--canvas)", boxShadow: "0 -18px 50px -24px rgba(0,0,0,.5)", display: "flex", flexDirection: "column", overflow: "hidden", transition: "transform .3s cubic-bezier(.32,.72,0,1)" }}>
        {mobile && <div style={{ width: 40, height: 4, borderRadius: 999, background: "var(--line)", margin: "8px auto 0", flexShrink: 0 }} />}
        {/* header */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 11, padding: "14px 18px", borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
          <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}><Icon name="basket" size={19} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>资源篮</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600 }}>{items.length > 0 ? `已收集 ${items.length} 份资源，可一并下载或送去出卷` : "把找到的资源加进来，随时取用"}</div>
          </div>
          <button onClick={onClose} aria-label="关闭" style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}>
            <Icon name="close" size={16} sw={2.4} />
          </button>
        </div>
        {/* list */}
        {items.length === 0 ? (
          <div style={{ flex: 1, display: "grid", placeItems: "center", padding: "30px 24px", textAlign: "center" }}>
            <div>
              <div style={{ display: "inline-flex", marginBottom: 12, color: "var(--line)" }}><Icon name="basket" size={46} sw={1.4} /></div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)", marginBottom: 6 }}>资源篮还是空的</div>
              <div style={{ fontSize: 13, color: "var(--ink-3)", lineHeight: 1.6, maxWidth: 280 }}>在「找资源」里预览任意文档或视频，点<b style={{ color: "var(--brand-deep)" }}>加入资源篮</b>，就会出现在这里。</div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 9 }}>
            {items.map((it) => {
              const isAlbum = /专辑|合集/.test(it.type || "");
              const isVideo = /视频|微课|实验/.test(it.type || "");
              const ic = isAlbum ? "layers" : isVideo ? "interactive" : "file";
              const tint = isAlbum ? { c: "var(--brand-deep)", bg: "var(--brand-soft)", bd: "var(--brand-soft-border)" } : isVideo ? { c: "oklch(0.5 0.13 200)", bg: "oklch(0.95 0.04 200)", bd: "oklch(0.86 0.06 200)" } : { c: "var(--ink-3)", bg: "var(--surface-2)", bd: "var(--line)" };
              return (
                <div key={it.bid} style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 13px", borderRadius: 13, background: "var(--surface)", border: "1px solid var(--line)" }}>
                  <span style={{ width: 36, height: 36, borderRadius: 9, background: tint.bg, border: "1px solid " + tint.bd, display: "grid", placeItems: "center", color: tint.c, flexShrink: 0 }}><Icon name={ic} size={17} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 3 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 800, color: tint.c, background: tint.bg, border: "1px solid " + tint.bd, padding: "1px 7px", borderRadius: 6, flexShrink: 0 }}>{it.type}</span>
                      {it.meta && <span style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.meta}</span>}
                    </div>
                  </div>
                  <button onClick={() => onRemove(it.bid)} title="移出资源篮" style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-3)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}>
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {/* footer */}
        {items.length > 0 && (
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 10, padding: 14, borderTop: "1px solid var(--line)", background: "var(--surface)" }}>
            <button onClick={onClear} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 13px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-3)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>
              <Icon name="trash" size={15} /> 清空
            </button>
            <div style={{ flex: 1 }} />
            <Btn kind="primary" icon="download" onClick={onClose}>打包下载 {items.length} 份</Btn>
          </div>
        )}
      </div>
    </React.Fragment>
  );
}

Object.assign(window, { BasketPanel });

// ---------- 我的内容 (content library) — global overlay, openable from a workspace ----------
function ContentPanel({ open, onClose, onResume }) {
  const M = window.AIDATA.USER_MEMORY;
  const mobile = useIsMobile();
  const SOURCES = ["全部", "AI 生成", "找资源下载"];
  const [filter, setFilter] = useState("全部");
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  const items = M.works.filter((w) => filter === "全部" || w.source === filter);
  const srcStyle = (src) =>
    src === "AI 生成" ? { c: "var(--brand-deep)", bg: "var(--brand-soft)", bd: "var(--brand-soft-border)", icon: "spark" }
      : { c: "var(--auth-ink)", bg: "var(--auth-bg)", bd: "var(--auth-border)", icon: "download" };

  const panelStyle = mobile
    ? { position: "fixed", left: 0, right: 0, bottom: 0, height: "82dvh", maxHeight: "82vh", borderRadius: "18px 18px 0 0", transform: open ? "translateY(0)" : "translateY(101%)" }
    : { position: "fixed", top: 0, right: 0, bottom: 0, width: "min(440px, 94vw)", borderRadius: 0, transform: open ? "translateX(0)" : "translateX(102%)" };

  return (
    <React.Fragment>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(20,16,10,.42)", backdropFilter: "blur(2px)", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity .26s ease" }} />
      <div style={{ ...panelStyle, zIndex: 91, background: "var(--canvas)", boxShadow: "0 -18px 50px -24px rgba(0,0,0,.5)", display: "flex", flexDirection: "column", overflow: "hidden", transition: "transform .3s cubic-bezier(.32,.72,0,1)" }}>
        {mobile && <div style={{ width: 40, height: 4, borderRadius: 999, background: "var(--line)", margin: "8px auto 0", flexShrink: 0 }} />}
        {/* header */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 11, padding: "14px 18px 12px", borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
          <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}><Icon name="grid" size={18} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>我的内容</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600 }}>AI 生成与找资源下载，共 {M.works.length} 份</div>
          </div>
          <button onClick={onClose} aria-label="关闭" style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}>
            <Icon name="close" size={16} sw={2.4} />
          </button>
        </div>
        {/* source filter */}
        <div style={{ flexShrink: 0, display: "flex", gap: 7, padding: "10px 16px", borderBottom: "1px solid var(--line)", background: "var(--surface)", overflowX: "auto", scrollbarWidth: "none" }}>
          {SOURCES.map((k) => (
            <button key={k} onClick={() => setFilter(k)} style={{ flexShrink: 0, padding: "5px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", whiteSpace: "nowrap", border: filter === k ? "1px solid var(--brand)" : "1px solid var(--line)", background: filter === k ? "var(--brand-soft)" : "var(--surface)", color: filter === k ? "var(--brand-deep)" : "var(--ink-2)" }}>{k}</button>
          ))}
        </div>
        {/* slim list */}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 9 }}>
          {items.map((w) => {
            const ss = srcStyle(w.source);
            return (
              <button key={w.id} onClick={() => { onResume && onResume(w); onClose(); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 13, background: "var(--surface)", border: "1px solid var(--line)", cursor: "pointer", fontFamily: "var(--font-zh)", textAlign: "left", transition: "border-color .2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--brand-soft-border)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--line)")}>
                <ScenarioGlyph icon={w.icon} hue={w.hue} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.title}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 3 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, color: ss.c, background: ss.bg, border: "1px solid " + ss.bd, padding: "1px 7px", borderRadius: 999, flexShrink: 0 }}><Icon name={ss.icon} size={10} /> {w.source}</span>
                    <span style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.meta}</span>
                  </div>
                </div>
                <span style={{ fontSize: 11, color: "var(--ink-3)", flexShrink: 0 }}>{w.when}</span>
                <span style={{ color: "var(--ink-3)", flexShrink: 0 }}><Icon name="chevron" size={16} /></span>
              </button>
            );
          })}
        </div>
      </div>
    </React.Fragment>
  );
}

Object.assign(window, { ContentPanel });
