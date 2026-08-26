// components.jsx — shared UI atoms

// AI 小博士 brand mark — uses the finalized graduation-cap asset (white knockout on transparent).
// variant: "white" (for colored backgrounds) | "blue" (for light backgrounds).
function GradCapMark({ size = 40, variant = "white" }) {
  const src = variant === "blue" ? "assets/logo-cap-blue.png" : "assets/logo-cap-white.png";
  return (
    <img src={src} alt="" aria-hidden="true" style={{ width: size, height: "auto", display: "block", flexShrink: 0, pointerEvents: "none" }} />
  );
}

function BotAvatar({ size = 40, glow = false }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "30% 30% 38% 38%",
        background: "linear-gradient(160deg, var(--brand), var(--brand-deep))",
        display: "grid",
        placeItems: "center",
        boxShadow: glow
          ? "0 10px 26px -8px var(--brand-glow), 0 0 0 5px color-mix(in oklab, var(--brand), transparent 92%), inset 0 1px 0 rgba(255,255,255,.38)"
          : "inset 0 1px 0 rgba(255,255,255,.38)",
        position: "relative",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      <GradCapMark size={size * 0.62} variant="white" />
    </div>
  );
}

// Authority badge — the core differentiator chip
function AuthorityBadge({ compact = false, label = "三审三校 · 权威认证" }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: compact ? "2px 8px" : "4px 11px",
        borderRadius: 999,
        background: "var(--auth-bg)",
        color: "var(--auth-ink)",
        fontSize: compact ? 11.5 : 12.5,
        fontWeight: 700,
        border: "1px solid var(--auth-border)",
        whiteSpace: "nowrap",
        fontFamily: "var(--font-zh)",
      }}
    >
      <Icon name="shield" size={compact ? 12 : 14} sw={2} />
      {label}
    </span>
  );
}

function Btn({ children, kind = "primary", size = "md", icon, iconRight, onClick, style, disabled }) {
  const sizes = {
    sm: { p: "7px 13px", f: 13, g: 6 },
    md: { p: "10px 18px", f: 14.5, g: 7 },
    lg: { p: "14px 24px", f: 16, g: 8 },
  }[size];
  const kinds = {
    primary: {
      background: "var(--brand-grad)",
      color: "#fff",
      border: "1px solid transparent",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.22), 0 4px 14px -5px var(--brand-glow)",
    },
    soft: {
      background: "var(--brand-soft)",
      color: "var(--brand-deep)",
      border: "1px solid var(--brand-soft-border)",
    },
    ghost: {
      background: "transparent",
      color: "var(--ink-2)",
      border: "1px solid var(--line)",
    },
    plain: {
      background: "transparent",
      color: "var(--ink-2)",
      border: "1px solid transparent",
    },
  }[kind];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: sizes.g,
        padding: sizes.p,
        fontSize: sizes.f,
        fontWeight: 600,
        borderRadius: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        fontFamily: "var(--font-zh)",
        transition: "transform .12s ease, box-shadow .2s ease, background .2s ease",
        ...kinds,
        ...style,
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {icon && <Icon name={icon} size={sizes.f + 2} />}
      {children}
      {iconRight && <Icon name={iconRight} size={sizes.f + 2} />}
    </button>
  );
}

// Scenario glyph tile (colored, uses scenario hue)
function ScenarioGlyph({ icon, hue, size = 46, active }) {
  return <CIcon name={icon} size={size} active />;
}

// thinking dots
function Dots() {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--brand)",
            animation: `bobDot 1s ${i * 0.16}s infinite ease-in-out`,
          }}
        />
      ))}
    </span>
  );
}

// pill chip (filter / suggestion)
function Chip({ children, active, onClick, icon, removable, onRemove }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 13px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "var(--font-zh)",
        border: active ? "1px solid var(--brand)" : "1px solid var(--line)",
        background: active ? "var(--brand-soft)" : "var(--surface)",
        color: active ? "var(--brand-deep)" : "var(--ink-2)",
        transition: "all .15s ease",
        whiteSpace: "nowrap",
      }}
    >
      {icon && <Icon name={icon} size={14} />}
      {children}
      {removable && (
        <span onClick={onRemove} style={{ display: "inline-flex", marginLeft: 1, opacity: 0.6 }}>
          <Icon name="close" size={12} sw={2.4} />
        </span>
      )}
    </button>
  );
}

Object.assign(window, { BotAvatar, GradCapMark, AuthorityBadge, Btn, ScenarioGlyph, Dots, Chip });

// ---- Attachment / reference-material atoms ----
function ClipButton({ onFiles, label = "参考资料", compact = false }) {
  const ref = React.useRef(null);
  return (
    <React.Fragment>
      <input
        ref={ref}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={(e) => {
          const names = [...e.target.files].map((f) => f.name);
          if (names.length) onFiles(names);
          e.target.value = "";
        }}
      />
      <button
        onClick={() => ref.current && ref.current.click()}
        title="上传你手头的素材 / 教案，让小博士基于它创作"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: compact ? "6px 8px" : "7px 12px",
          borderRadius: 10,
          border: "1px dashed var(--input-border)",
          background: "transparent",
          color: "var(--ink-3)",
          fontSize: 12.5,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "var(--font-zh)",
          transition: "color .15s, border-color .15s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--brand-deep)";
          e.currentTarget.style.borderColor = "var(--brand-soft-border)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--ink-3)";
          e.currentTarget.style.borderColor = "var(--input-border)";
        }}
      >
        <CIcon name="clip" size={15} />
        {!compact && label}
      </button>
    </React.Fragment>
  );
}

function FileChips({ files, onRemove, onView, style }) {
  if (!files || files.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7, ...style }}>
      {files.map((f, i) => {
        const name = typeof f === "string" ? f : f.name;
        const status = typeof f === "string" ? "ready" : (f.status || "ready");
        const busy = status !== "ready";
        const note = status === "uploading" ? "上传中" : status === "parsing" ? "解析中" : null;
        return (
          <span
            key={i}
            className="ent-pop"
            onClick={() => !busy && onView && onView(name)}
            title={busy ? undefined : (onView ? "点击查看" : undefined)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 8px 5px 9px",
              borderRadius: 9,
              background: "var(--brand-soft)",
              border: "1px solid var(--brand-soft-border)",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--brand-deep)",
              maxWidth: 240,
              cursor: (!busy && onView) ? "pointer" : "default",
              opacity: busy ? 0.9 : 1,
            }}
          >
            {busy ? <span className="mini-spin" /> : <Icon name="file" size={13} />}
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
            {note && <span style={{ fontSize: 10, fontWeight: 700, color: "var(--ink-3)", whiteSpace: "nowrap" }}>· {note}</span>}
            {onRemove && (
              <span onClick={(e) => { e.stopPropagation(); onRemove(i); }} style={{ display: "inline-flex", cursor: "pointer", opacity: 0.6 }}>
                <Icon name="close" size={12} sw={2.4} />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

// ---- Attachment preview modal (demo: mock filenames, so we render a stand-in preview) ----
function FileViewer({ name, onClose }) {
  if (!name) return null;
  const ext = (name.split(".").pop() || "").toLowerCase();
  const isImg = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext);
  const kind = isImg ? "图片" : ext === "pdf" ? "PDF" : ext === "mp4" ? "视频" : "文档";
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 120, background: "rgba(18,24,38,.5)", backdropFilter: "blur(2px)", display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(520px,92vw)", maxHeight: "86vh", background: "var(--surface)", borderRadius: 16, border: "1px solid var(--line)", boxShadow: "0 24px 60px -20px rgba(0,0,0,.4)", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "var(--font-zh)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", borderBottom: "1px solid var(--line)", flexShrink: 0 }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}><Icon name="file" size={15} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 1 }}>{(ext || "file").toUpperCase()} · 附件预览</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}><Icon name="close" size={15} sw={2.4} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px", background: "var(--surface-2)" }}>
          {isImg ? (
            <div className="ph-stripe" style={{ width: "100%", aspectRatio: "4 / 3", borderRadius: 10, display: "grid", placeItems: "center", color: "var(--ink-3)", fontSize: 12.5, fontWeight: 700 }}>图片预览</div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 8, border: "1px solid var(--line)", padding: "26px 26px", boxShadow: "0 6px 20px -14px rgba(0,0,0,.3)", aspectRatio: "1 / 1.3" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#1a1a1a", textAlign: "center", marginBottom: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
              {[...Array(7)].map((_, k) => (<div key={k} style={{ height: 7, background: "#eee", borderRadius: 3, marginBottom: 10, width: `${88 - ((k * 11) % 40)}%` }} />))}
            </div>
          )}
          <div style={{ marginTop: 14, fontSize: 11.5, color: "var(--ink-3)", textAlign: "center", lineHeight: 1.6 }}>演示环境暂不解析真实文件；正式版会在此预览你上传的{kind}。</div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ClipButton, FileChips, FileViewer });

// ---- Resource peek modal — non-destructive preview of a referenced resource ----
// Used when a teacher clicks a 引用卡片 inside 出卷子/写教案: instead of navigating away
// (which would hide their in-progress draft), we pop a lightweight summary so their work
// is never interrupted. They can choose to open it fully in 找资源, or just keep working.
function ResourcePeek({ item, onClose, onOpenInFind }) {
  if (!item) return null;
  const isAlbum = !!(item.composition || item.units);
  const isVideo = !!(item.chapters || item.cat);
  const kindLabel = isAlbum ? ("专辑 · " + (item.total || "") + " 份") : isVideo ? "视频" : (item.type || "资料");
  const metaLine = [item.edition, item.grade, item.subject].filter(Boolean).join(" · ");
  const chips = item.chips || item.tags || [];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 130, background: "rgba(18,24,38,.5)", backdropFilter: "blur(2px)", display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(460px,92vw)", background: "var(--surface)", borderRadius: 16, border: "1px solid var(--line)", boxShadow: "0 24px 60px -20px rgba(0,0,0,.4)", overflow: "hidden", fontFamily: "var(--font-zh)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "16px 18px 14px" }}>
          <span style={{ width: 38, height: 38, borderRadius: 10, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}><Icon name={isAlbum ? "layers" : isVideo ? "interactive" : "file"} size={18} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--brand-deep)", marginBottom: 3 }}>引用的资源 · {kindLabel}</div>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--ink)", lineHeight: 1.45 }}>{item.title}</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}><Icon name="close" size={14} sw={2.4} /></button>
        </div>
        <div style={{ padding: "0 18px 4px" }}>
          {metaLine && <div style={{ fontSize: 12.5, color: "var(--ink-2)", fontWeight: 600, marginBottom: 9 }}>{metaLine}</div>}
          {isAlbum && item.composition && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 9 }}>
              {item.composition.map((c, i) => <span key={i} style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-3)", background: "var(--surface-2)", border: "1px solid var(--line)", padding: "2px 9px", borderRadius: 7 }}>{c.type} {c.n}</span>)}
            </div>
          )}
          {!isAlbum && chips.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 9 }}>
              {chips.slice(0, 5).map((c, i) => <span key={i} style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-3)", background: "var(--surface-2)", border: "1px solid var(--line)", padding: "2px 9px", borderRadius: 7 }}>{c}</span>)}
            </div>
          )}
        </div>
        <div style={{ margin: "6px 18px 0", padding: "9px 12px", borderRadius: 10, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", fontSize: 12, color: "var(--brand-deep)", fontWeight: 600, lineHeight: 1.5, display: "flex", gap: 7 }}>
          <Icon name="spark" size={14} /> <span>这只是快速预览，<b>不会打断</b>你当前的草稿。</span>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", padding: "14px 18px 16px" }}>
          <button onClick={onClose} style={{ padding: "9px 15px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>继续当前工作</button>
          <button onClick={onOpenInFind} style={{ padding: "9px 15px", borderRadius: 10, border: "none", background: "var(--brand)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", display: "inline-flex", alignItems: "center", gap: 6 }}><CIcon name="search" size={14} /> 在「找资源」中打开</button>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { ResourcePeek });

// ── Shared: smart send with re-routing + a brief "recognizing" header flash ──
// Every workspace routes its chat input through this. On each send we run a
// quick intent check; if the text clearly belongs to a DIFFERENT scenario we
// switch there, otherwise we briefly show the "recognizing" header then hand
// off to the workspace's own local handler.
function useSmartSend({ scenarioId, onSwitch, setMessages, localSend }) {
  const [headerRecognizing, setHeaderRecognizing] = React.useState(false);
  const timer = React.useRef(null);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  const send = React.useCallback((text, files) => {
    const target = (typeof window.detectSwitchTarget === "function") ? window.detectSwitchTarget(text || "") : null;
    const willSwitch = !!(text && text.trim()) && target && target !== scenarioId && typeof onSwitch === "function";
    clearTimeout(timer.current);
    if (willSwitch) {
      // AI auto-switch — remember where we came from so the chat divider can offer a one-click 切回
      const cur = (window.AIDATA.SCENARIOS.find((s) => s.id === scenarioId)) || (window.AIDATA.GENERAL && window.AIDATA.GENERAL.id === scenarioId ? window.AIDATA.GENERAL : null);
      window.ChatSession.switchMeta = { source: "auto", from: cur ? { id: cur.id, name: cur.name } : null };
      // echo the user's message, flash recognizing, then route to the new tool
      setMessages && setMessages((m) => [...m, { role: "user", text, files }]);
      setHeaderRecognizing(true);
      timer.current = setTimeout(() => { setHeaderRecognizing(false); onSwitch(target, text); }, 950);
      return;
    }
    // same scenario → brief header flash, run local handler immediately
    setHeaderRecognizing(true);
    timer.current = setTimeout(() => setHeaderRecognizing(false), 720);
    localSend && localSend(text, files);
  }, [scenarioId, onSwitch, setMessages, localSend]);
  return { headerRecognizing, send };
}

// ── Shared: a small "memory in effect" note for workspaces ──
// Mirrors the 问教材 line — surfaces that the assistant has applied what it
// remembers about the teacher, with an affordance to adjust.
function MemoryNote({ text, actionLabel = "调整", onAction, style }) {
  return (
    <div
      className="trace-pop"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "8px 12px",
        borderRadius: 11,
        background: "var(--brand-soft)",
        border: "1px solid var(--brand-soft-border)",
        fontSize: 12.5,
        color: "var(--ink-2)",
        lineHeight: 1.55,
        ...style,
      }}
    >
      <span style={{ color: "var(--brand-deep)", flexShrink: 0, display: "grid", placeItems: "center" }}><Icon name="spark" size={14} /></span>
      <span style={{ flex: 1, minWidth: 0 }}>{text}</span>
      {onAction && (
        <button
          onClick={onAction}
          style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 8, border: "1px solid var(--brand-soft-border)", background: "var(--surface)", color: "var(--brand-deep)", fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

Object.assign(window, { useSmartSend, MemoryNote });

// ── Chat session: ONE assistant conversation that survives scenario switches ──
// The assistant never "changes sides": when the teacher moves between scenarios
// (找资源 → 出卷子 → …) the left chat keeps the whole thread. Only 新对话 /
// returning home starts a fresh session (cleared by app.jsx).
// distill a conversation title from the teacher's first message — prefer a 《…》
// work title, else strip polite lead-ins and clip to a scannable length.
function distillConvTitle(text) {
  let t = (text || "").replace(/[\n\r]+/g, " ").trim();
  const m = t.match(/《(.+?)》/);
  if (m) {
    const after = t.slice(t.indexOf(m[0]) + m[0].length).replace(/^[，,。·\s的]+/, "");
    const kind = (after.match(/(随堂练习卷|练习卷|单元卷|检测卷|试卷|教学设计|教案|课件|微课|思维导图|导图|答案|讲解|复习)/) || [])[0];
    return "《" + m[1] + "》" + (kind || "");
  }
  t = t.replace(/^(请帮我|帮我一下|帮我|请|帮忙|麻烦|我想要|我想|我要|给我|据|根据|按照|结合)/, "").trim();
  return t ? (t.length > 18 ? t.slice(0, 18) + "…" : t) : "新对话";
}

const ChatSession = {
  log: [],
  scratch: {},           // per-scenario live state (rounds, configs…) that survives switches
  pendingArtifact: null, // set when the teacher clicks an artifact chip from another scenario
  handoffRef: null,      // set when a resource-detail 「据此出卷/教案」 hands off — the target seeds a reference card
  artifactTimes: {},     // { artifactKey → first-seen timestamp } so the 成果 menu can show 创建时间
  sessionId: "s" + Date.now(), // one id per conversation; resets on 新对话 / 回首页
  suppressHistory: false,      // true when resuming an existing item (don't log a NEW history record)
  activeScenario: null,        // {id, icon, hue, name} of the workspace currently in view
  _convTitle: null,            // cached distilled title for this session
  take() {
    const log = this.log.slice();
    // drop trailing switch markers so rapid A→B→C hops leave one divider, not a stack
    while (log.length && log[log.length - 1].role === "sys") log.pop();
    return log;
  },
  save(msgs) {
    this.log = msgs || [];
    // once a session produces a real round (the teacher sent something), log/refresh
    // a single history record named from the FIRST message of the conversation.
    try {
      if (window.recordConversation && !this.suppressHistory && this.activeScenario) {
        const users = this.log.filter((m) => m && m.role === "user" && (m.text || "").trim());
        if (users.length) {
          if (!this._convTitle) this._convTitle = distillConvTitle(users[0].text);
          const sc = this.activeScenario;
          window.recordConversation({
            sid: this.sessionId,
            scenario: sc.id, icon: sc.icon || "chat", hue: sc.hue || 230,
            title: this._convTitle,
            last: (users[users.length - 1].text || "").trim(),
          });
        }
      }
    } catch (e) {}
  },
  clear() {
    this.log = []; this.scratch = {}; this.pendingArtifact = null; this.handoffRef = null; this.artifactTimes = {};
    this.sessionId = "s" + Date.now(); this.suppressHistory = false; this._convTitle = null;
  },
  // build the seeded user bubble for a handed-off query, attaching (and consuming) any handoffRef
  seedUser(q) { const r = this.handoffRef; this.handoffRef = null; return r ? { role: "user", text: q, ref: { title: r.title, type: r.type }, refItem: r.item } : { role: "user", text: q }; },
  echoed(q) {
    const v = (q || "").trim();
    return !!v && this.log.some((m) => m.role === "user" && (m.text || "").trim() === v);
  },
};

// Convert live workspace messages into a frozen, carry-anywhere form:
// drop typing indicators, replace live widgets (intent animation, setup cards)
// with static recaps, and strip per-workspace handles like roundId.
function freezeChat(msgs) {
  return (msgs || [])
    .filter((m) => m && !m.typing)
    .map((m) => {
      if (m.render) {
        if (m.intent) return { role: "ai", wide: true, node: <InlineIntent query={m.intent} instant /> };
        return null; // live setup widgets don't carry across scenarios
      }
      if (m.card) {
        return { role: "ai", node: window.KnowledgeCardImage ? <div style={{ maxWidth: 460 }}><window.KnowledgeCardImage card={m.card} compact /></div> : <span>已生成知识卡片（见「问教材」）。</span> };
      }
      if (m.answer || m.compare) {
        // 「一条贯穿会话」：把问教材回答冻结成可在任意场景渲染的静态快照，
        // 切到出卷子/做课件后，左侧对话里的回答依然完整可见。
        const node = m.compare
          ? (window.FrozenTbCompare ? <window.FrozenTbCompare cmp={m.cmp} /> : <span>已依据教材原文作答（见「问教材」）。</span>)
          : (window.FrozenTbAnswer ? <window.FrozenTbAnswer ans={m.ans} /> : <span>已依据教材原文作答（见「问教材」）。</span>);
        return { role: "ai", artifact: m.artifact, node };
      }
      const { roundId, ...rest } = m;
      return rest;
    })
    .filter(Boolean);
}

Object.assign(window, { ChatSession, freezeChat });

// ── Entering a scenario mid-session: a slim divider, not another chat bubble ──
// First entry of a session keeps the assistant's greeting (it orients the user);
// after that, tab switches only leave a quiet "已切换" marker — and rapid tab
// hopping collapses to a single marker instead of stacking noise.
function enterThread(scenario, greet) {
  const log = ChatSession.take();
  // drop trailing markers (and nothing else) so A→B→C leaves one marker, not three
  while (log.length && log[log.length - 1].role === "sys") log.pop();
  const div = takeSwitchDivider(scenario, log.length > 0);
  if (!log.length) return greet ? [{ role: "ai", node: greet }] : [];
  return [...log, ...div];
}
// ── Switch divider for query-seeded entries ──
// Consumes the switch provenance (ChatSession.switchMeta, set by whoever triggered the
// switch): AI auto-routes carry a one-click 「切回」 back to the previous scenario.
// Always call this when seeding a thread mid-session — it must clear the meta even
// when no divider is rendered, so stale provenance never leaks into a later switch.
function takeSwitchDivider(scenario, hasHistory) {
  const meta = ChatSession.switchMeta || null;
  ChatSession.switchMeta = null;
  const noDivider = ChatSession.noDivider || false;
  ChatSession.noDivider = false;
  if (!hasHistory || noDivider) return [];
  const back = meta && meta.source === "auto" && meta.from && meta.from.id !== scenario.id ? meta.from : null;
  return [{ role: "sys", text: `已切到「${scenario.name}」`, icon: scenario.icon, back }];
}
Object.assign(window, { enterThread, takeSwitchDivider });
