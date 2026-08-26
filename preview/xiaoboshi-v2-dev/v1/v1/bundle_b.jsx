// ======== workspace_find.jsx ========
// workspace_find.jsx — 找资源 workspace (human-AI collaboration)
const { useState: uS, useEffect: uE, useRef: uR } = React;

// ---- Shared workspace shell (top bar) ----
const MIN_CHAT_W = 320;   // chat panel never narrower than a phone screen
const MIN_CONTENT_W = 380; // content side keeps at least this much room

// Resizable two-pane: [ChatPanel, content]. Drag the seam to rebalance.
function ChatResizer({ children }) {
  const kids = React.Children.toArray(children);
  const first = kids[0];
  const rest = kids.slice(1);
  const wrapRef = uR(null);
  const [w, setW] = uS(() => {
    const s = parseInt(localStorage.getItem("aida_chat_w") || "", 10);
    return Number.isFinite(s) && s >= MIN_CHAT_W ? s : (first.props.width || 380);
  });
  const [dragging, setDragging] = uS(false);
  const dref = uR(false);

  uE(() => { try { localStorage.setItem("aida_chat_w", String(Math.round(w))); } catch (e) {} }, [w]);

  uE(() => {
    const clamp = (val) => {
      const total = wrapRef.current ? wrapRef.current.getBoundingClientRect().width : 99999;
      const maxW = Math.max(MIN_CHAT_W, total - MIN_CONTENT_W);
      return Math.min(Math.max(val, MIN_CHAT_W), maxW);
    };
    const move = (e) => {
      if (!dref.current || !wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      setW(clamp(e.clientX - rect.left));
    };
    const up = () => {
      if (!dref.current) return;
      dref.current = false; setDragging(false);
      document.body.style.cursor = ""; document.body.style.userSelect = "";
    };
    const onResize = () => setW((v) => clamp(v));
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("resize", onResize);
    setW((v) => clamp(v)); // clamp on mount to the live container size
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const startDrag = (e) => {
    dref.current = true; setDragging(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    e.preventDefault();
  };

  return (
    <div ref={wrapRef} style={{ flex: 1, minWidth: 0, display: "flex" }}>
      {React.cloneElement(first, { width: w })}
      <div
        className={"ws-resizer" + (dragging ? " dragging" : "")}
        onPointerDown={startDrag}
        title="拖动调整左右宽度"
        style={{ width: 12, margin: "0 -6px", flexShrink: 0, cursor: "col-resize", position: "relative", zIndex: 6, touchAction: "none" }}
      >
        <span className="ws-resizer-grip" />
      </div>
      {rest}
    </div>
  );
}

// ---- Current-scenario label: lives at the TOP OF THE STAGE (right pane). Pure
// status ("你在哪") — it no longer switches scenarios. Switching now happens down
// by the composer (see ScenePills), the same visual focus area as typing. ----
function StageScenarioLabel({ scenario }) {
  if (!scenario) return null;
  return (
    <div data-screen-label="当前场景标识" style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px 6px 12px", minWidth: 0 }}>
      <ScenarioGlyph icon={scenario.icon} hue={scenario.hue} size={22} active />
      <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{scenario.name}</span>
    </div>
  );
}

// ---- Scene pills: lives ABOVE THE COMPOSER (left pane, same visual focus area as
// typing). Clicking a pill is a manual scene switch — the session's conversation
// keeps flowing, only the right-side workspace (and this row's highlight) changes.
// Overflow rule: whatever doesn't fit in one row collapses into a "更多" menu; if the
// CURRENT scenario would land in that collapsed set, it's swapped into the visible
// row instead — the active scene must always stay visible. ----
function ScenePills({ scenario, onSwitch, disabled }) {
  const HID = window.AIDATA.HIDDEN_SCENARIOS || [];
  const SC = window.AIDATA.SCENARIOS.filter((s) => !HID.includes(s.id) || (scenario && s.id === scenario.id));
  const wrapRef = uR(null);
  const measureRefs = uR([]);
  const moreRef = uR(null);
  const [fit, setFit] = uS(SC.length);
  const [moreOpen, setMoreOpen] = uS(false);
  const canSwitch = typeof onSwitch === "function" && !disabled;

  const recalc = () => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const avail = wrap.clientWidth;
    const GAP = 6;
    const widths = measureRefs.current.map((el) => (el ? el.getBoundingClientRect().width : 0));
    const moreW = (moreRef.current ? moreRef.current.getBoundingClientRect().width : 64) + GAP;
    let total = 0, count = 0;
    for (let i = 0; i < widths.length; i++) {
      const w = widths[i] + (i > 0 ? GAP : 0);
      const isLast = i === widths.length - 1;
      const budget = isLast ? avail : avail - moreW;
      if (total + w <= budget) { total += w; count = i + 1; } else break;
    }
    setFit(Math.max(1, count));
  };

  uE(() => {
    recalc();
    const ro = new ResizeObserver(() => recalc());
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  uE(() => {
    if (!moreOpen) return;
    const close = (e) => { if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [moreOpen]);

  const activeIdx = SC.findIndex((s) => scenario && s.id === scenario.id);
  let visible = SC.slice(0, fit);
  let overflow = SC.slice(fit);
  if (activeIdx >= fit && fit > 0) {
    visible = [...SC.slice(0, fit - 1), SC[activeIdx]];
    overflow = SC.filter((s) => !visible.some((v) => v.id === s.id));
  }

  const pillStyle = (active) => ({
    display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0, whiteSpace: "nowrap",
    padding: "5px 11px 5px 6px", borderRadius: 999,
    border: "1px solid " + (active ? "var(--brand-soft-border)" : "var(--line)"),
    background: active ? "var(--brand-soft)" : "var(--surface)",
    color: active ? "var(--brand-deep)" : "var(--ink-2)",
    fontSize: 12.5, fontWeight: active ? 800 : 600,
    cursor: active || !canSwitch ? "default" : "pointer", fontFamily: "var(--font-zh)",
    opacity: disabled ? 0.55 : 1,
    transition: "background .15s, border-color .15s, color .15s",
  });
  const Pill = ({ s, refCb }) => {
    const active = scenario && s.id === scenario.id;
    return (
      <button
        data-scenario-pill
        ref={refCb}
        key={s.id}
        onClick={() => { if (canSwitch && !active) { window.ChatSession && (window.ChatSession.switchMeta = { source: "manual" }); onSwitch(s.id, ""); } }}
        title={active ? "当前场景" : "切换到" + s.name}
        style={pillStyle(active)}
        onMouseEnter={(e) => { if (canSwitch && !active) e.currentTarget.style.background = "var(--surface-2)"; }}
        onMouseLeave={(e) => { if (canSwitch && !active) e.currentTarget.style.background = active ? "var(--brand-soft)" : "var(--surface)"; }}
      >
        <ScenarioGlyph icon={s.icon} hue={s.hue} size={20} active={active} />
        {s.name}
      </button>
    );
  };

  return (
    <div ref={wrapRef} data-screen-label="场景切换胶囊" style={{ position: "relative", display: "flex", alignItems: "center", gap: 6, minWidth: 0, marginBottom: 8 }}>
      {/* hidden measuring row — same markup as the real pills, used only to learn natural widths */}
      <div style={{ position: "absolute", top: 0, left: 0, visibility: "hidden", pointerEvents: "none", display: "flex", gap: 6, zIndex: -1 }} aria-hidden="true">
        {SC.map((s, i) => <Pill key={s.id} s={s} refCb={(el) => (measureRefs.current[i] = el)} />)}
      </div>
      {visible.map((s) => <Pill key={s.id} s={s} />)}
      {overflow.length > 0 && (
        <div ref={moreRef} style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={() => setMoreOpen((v) => !v)}
            style={{ ...pillStyle(false), cursor: canSwitch ? "pointer" : "default", paddingLeft: 11 }}
          >
            更多 <span style={{ display: "inline-flex", transform: moreOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }}><Icon name="chevron" size={12} /></span>
          </button>
          {moreOpen && (
            <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: 0, minWidth: 168, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "0 12px 32px -10px rgba(20,30,50,.22)", padding: 6, zIndex: 40 }}>
              {overflow.map((s) => {
                const active = scenario && s.id === scenario.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => { setMoreOpen(false); if (canSwitch && !active) { window.ChatSession && (window.ChatSession.switchMeta = { source: "manual" }); onSwitch(s.id, ""); } }}
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 9px", borderRadius: 8, border: "none", background: active ? "var(--brand-soft)" : "transparent", color: active ? "var(--brand-deep)" : "var(--ink-2)", fontSize: 12.5, fontWeight: active ? 800 : 600, fontFamily: "var(--font-zh)", cursor: active || !canSwitch ? "default" : "pointer", textAlign: "left" }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--surface-2)"; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                  >
                    <ScenarioGlyph icon={s.icon} hue={s.hue} size={20} active={active} />
                    {s.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WorkspaceShell({ scenario, onHome, onSwitch, children, right, afterTitle, titleMeta, subtitleOverride, recognizing, headerRecognizing, mobilePanelLabel = "结果", mobilePanelIcon = "layers", openSheetKey, nav, chatLed }) {
  const showRec = recognizing || headerRecognizing;
  const mobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [navOpen, setNavOpen] = React.useState(false); // mobile nav drawer
  // desktop rail: collapsed = fully hidden, just an expand button in the header (Claude/豆包 style)
  const [railOpen, setRailOpenState] = React.useState(() => localStorage.getItem("aida_rail_open") !== "0");
  const setRailOpen = (v) => { setRailOpenState(v); try { localStorage.setItem("aida_rail_open", v ? "1" : "0"); } catch (e) {} };
  // right stage pane: collapse-to-edge (give the conversation full width) and fullscreen (focus the output)
  const [stageCollapsed, setStageCollapsedState] = React.useState(() => localStorage.getItem("aida_stage_collapsed") === "1");
  const setStageCollapsed = (v) => { setStageCollapsedState(v); try { localStorage.setItem("aida_stage_collapsed", v ? "1" : "0"); } catch (e) {} };
  const [stageFull, setStageFull] = React.useState(false);
  const kids = React.Children.toArray(children);
  const isChatLed = chatLed || (kids.length >= 2 && kids[0] && kids[0].type === ChatPanel);
  // live messages of the chat column — drives the 成果 (artifacts) quick-menu in the header
  const chatMsgs = (isChatLed && kids[0] && kids[0].props && kids[0].props.messages) || [];
  // mobile: auto-slide the content sheet up when the result pane becomes ready
  // or the user opens a specific item (key changes). Never auto-opens twice for
  // the same state, so it stays out of the way once dismissed.
  const lastKey = React.useRef(undefined);
  React.useEffect(() => {
    if (!isChatLed) { lastKey.current = openSheetKey; return; }
    if (openSheetKey && openSheetKey !== lastKey.current) {
      if (mobile) setSheetOpen(true);
      else { setStageCollapsed(false); setStageFull(false); } // new content arrived → reveal collapsed stage AND drop fullscreen so the conversation is visible
    }
    lastKey.current = openSheetKey;
  }, [openSheetKey, mobile, isChatLed]);

  // assistant identity — mobile header only (the desktop rail already carries the brand,
  // so the chat column gets a slim status line instead of a second avatar)
  const identity = (small) => showRec ? (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
      <div style={{ position: "relative", flexShrink: 0 }}><BotAvatar size={small ? 30 : 32} glow /><span className="bot-ring" /></div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: small ? 13.5 : 14.5, fontWeight: 800, color: "var(--ink)", display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>正在识别你的需求 <Dots /></div>
        <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, whiteSpace: "nowrap" }}>判断该用哪个场景为你服务…</div>
      </div>
    </div>
  ) : (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
      <BotAvatar size={small ? 30 : 32} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: small ? 13.5 : 14.5, fontWeight: 800, color: "var(--ink)", display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" }}>AI 小博士 {titleMeta}</div>
        <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{subtitleOverride || (scenario && scenario.id !== "general" ? `正在陪你 · ${scenario.name}` : "有问必答，全程陪伴的教学助手")}</div>
      </div>
    </div>
  );

  // expand + new-chat buttons shown when the rail is collapsed — no narrow icon bar, just these
  const iconBtnStyle = { width: 32, height: 32, borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 };
  const hoverFx = {
    onMouseEnter: (e) => (e.currentTarget.style.background = "var(--surface-2)"),
    onMouseLeave: (e) => (e.currentTarget.style.background = "var(--surface)"),
  };
  const expandBtn = nav && !mobile && !railOpen ? (
    <span style={{ display: "inline-flex", gap: 6 }}>
      <button data-home-nav onClick={() => setRailOpen(true)} data-tip="展开菜单" data-tip-pos="bottom-left" aria-label="展开菜单" style={iconBtnStyle} {...hoverFx}>
        <Icon name="panelLeftOpen" size={17} />
      </button>
      {nav.onNewChat && (
        <button data-home-nav onClick={() => nav.onNewChat()} data-tip="新对话" aria-label="新对话" style={iconBtnStyle} {...hoverFx}>
          <Icon name="plus" size={17} />
        </button>
      )}
    </span>
  ) : null;

  // collapse / fullscreen controls for the RIGHT stage pane (desktop, chat-led only)
  const stageCtrlBtn = { width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 };
  const stageControls = (!mobile && isChatLed) ? (
    <span style={{ display: "inline-flex", gap: 6, marginLeft: 8 }}>
      {stageFull ? (
        <button onClick={() => setStageFull(false)} data-tip="退出全屏" data-tip-pos="bottom-right" aria-label="退出全屏" style={stageCtrlBtn} {...hoverFx}>
          <Icon name="exitFull" size={16} />
        </button>
      ) : (
        <React.Fragment>
          <button onClick={() => setStageFull(true)} data-tip="全屏" data-tip-pos="bottom-right" aria-label="进入全屏" style={stageCtrlBtn} {...hoverFx}>
            <Icon name="enterFull" size={16} />
          </button>
          <button onClick={() => setStageCollapsed(true)} data-tip="收起面板" data-tip-pos="bottom-right" aria-label="收起面板" style={stageCtrlBtn} {...hoverFx}>
            <Icon name="panelRightClose" size={17} />
          </button>
        </React.Fragment>
      )}
    </span>
  ) : null;

  // slim chat-column header: status only — the avatar lives in the rail, not here.
  // rightSlot lets the collapsed state drop an "expand panel" button at the top-right.
  const makeChatHeader = (rightSlot) => (
    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 12px", borderBottom: "1px solid var(--line)", background: "var(--surface)", flexShrink: 0, height: 51 }}>
      {expandBtn}
      {showRec ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 800, color: "var(--brand-deep)", minWidth: 0, whiteSpace: "nowrap" }}>
          正在识别你的需求 <Dots />
        </span>
      ) : (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: "var(--ink-2)", minWidth: 0 }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: "oklch(0.72 0.17 150)", flexShrink: 0 }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtitleOverride || (scenario && scenario.id !== "general" ? `正在陪你 · ${scenario.name}` : "有问必答 · 全程陪伴")}</span>
        </span>
      )}
      {titleMeta}
      <div style={{ flex: 1 }} />
      {!showRec && <SessionArtifactsMenu messages={chatMsgs} />}
      {rightSlot}
    </div>
  );
  const chatHeader = makeChatHeader(null);
  // when the stage is collapsed, the conversation goes full-width and this button (top-right of the
  // chat header, same spot the collapse button lived) brings the panel back — no weird full-height rail.
  const expandStageBtn = (
    <button onClick={() => setStageCollapsed(false)} data-tip={`展开${mobilePanelLabel}面板`} data-tip-pos="bottom-right" aria-label="展开面板" style={stageCtrlBtn} {...hoverFx}>
      <Icon name="panelRightOpen" size={17} />
    </button>
  );

  // stage header — scenario tabs + per-scenario controls + actions, top of the RIGHT pane
  const stageHeader = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 12px 0 4px", background: "var(--surface)", borderBottom: "1px solid var(--line)", flexShrink: 0, minHeight: 51 }}>
      {!isChatLed && expandBtn && <span style={{ marginLeft: 8, display: "inline-flex" }}>{expandBtn}</span>}
      {!isChatLed && showRec && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 11px", marginLeft: 8, borderRadius: 999, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", fontSize: 12, fontWeight: 700, color: "var(--brand-deep)", whiteSpace: "nowrap", flexShrink: 0 }}>
          <BotAvatar size={20} /> 正在识别需求 <Dots />
        </span>
      )}
      <StageScenarioLabel scenario={scenario} />
      {!showRec && afterTitle}
      <div style={{ flex: 1 }} />
      {!mobile && right}
      {stageControls}
    </div>
  );

  const stage = (content) => (
    <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", background: "var(--canvas)" }}>
      {stageHeader}
      <div style={{ flex: 1, minHeight: 0, display: "flex", position: "relative" }}>{content}</div>
    </div>
  );

  return (
    <WSMobileContext.Provider value={{ mobile, sheetOpen, setSheetOpen, isChatLed }}>
    <div style={{ height: "100dvh", display: "flex", background: "var(--canvas)", overflow: "hidden" }}>
      {nav && (mobile
        ? <LeftRail page="" {...nav} mobile mobileOpen={navOpen} onCloseMobile={() => setNavOpen(false)} />
        : railOpen
        ? <LeftRail page="" {...nav} forceOpen onCollapse={() => setRailOpen(false)} />
        : null)}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {mobile && (
          <header style={{ display: "flex", alignItems: "center", gap: 8, height: 56, padding: "0 12px", background: "var(--surface)", borderBottom: "1px solid var(--line)", flexShrink: 0, zIndex: 30 }}>
            {nav ? (
              <button onClick={() => setNavOpen(true)} aria-label="打开菜单" style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 11, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer" }}>
                <Icon name="menu" size={19} />
              </button>
            ) : (
              <button onClick={onHome} aria-label="返回首页" style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 11, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer" }}>
                <Icon name="home" size={18} />
              </button>
            )}
            {identity(true)}
            {!showRec && isChatLed && <SessionArtifactsMenu messages={chatMsgs} />}
            {!showRec && (isChatLed ? <SheetPill label={mobilePanelLabel} icon={mobilePanelIcon} onClick={() => setSheetOpen(true)} /> : right)}
          </header>
        )}
        <div style={{ flex: 1, minHeight: 0, display: "flex", position: "relative" }}>
          {mobile && isChatLed ? (
            <React.Fragment>
              {React.cloneElement(kids[0], { width: "100%", scenario, onSwitch })}
              <MobileSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={mobilePanelLabel} headerRight={right}>
                {stage(kids.slice(1))}
              </MobileSheet>
            </React.Fragment>
          ) : isChatLed ? (
            stageFull ? (
              <React.Fragment>
                {/* fullscreen: stage covers the ENTIRE viewport (incl. left rail) via a fixed overlay;
                    chat stays mounted (hidden) so its state survives */}
                <div style={{ display: "none" }}>{React.cloneElement(kids[0], { header: null, scenario, onSwitch })}</div>
                <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "var(--canvas)", display: "flex", flexDirection: "column" }}>
                  {stage(kids.slice(1))}
                </div>
              </React.Fragment>
            ) : stageCollapsed ? (
              // only the conversation remains — full-width chrome, content centered in a readable column (WorkBuddy-style)
              React.cloneElement(kids[0], { header: makeChatHeader(expandStageBtn), width: "100%", centered: true, scenario, onSwitch })
            ) : (
              <ChatResizer>
                {React.cloneElement(kids[0], { header: chatHeader, scenario, onSwitch })}
                {stage(kids.slice(1))}
              </ChatResizer>
            )
          ) : (
            stage(children)
          )}
        </div>
      </div>
    </div>
    </WSMobileContext.Provider>
  );
}

// neutral right-side placeholder shown while intent is still being recognised
function RecognizingPanel() {
  return (
    <div style={{ flex: 1, display: "grid", placeItems: "center", padding: "30px 24px", textAlign: "center" }}>
      <div className="home-fade" style={{ maxWidth: 360 }}>
        <div style={{ position: "relative", display: "inline-flex", marginBottom: 18 }}>
          <BotAvatar size={56} glow />
          <span className="bot-ring" />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", margin: "0 0 8px" }}>正在识别你的需求…</h2>
        <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.65, margin: 0 }}>小博士正从<b style={{ color: "var(--brand-deep)" }}>学科网资源库</b>判断最合适的场景，稍候就为你打开对应的工作台。</p>
      </div>
    </div>
  );
}

// ---- Session task bar (pinned above the composer) ----
// Surfaces an in-progress 出卷子/写教案 task started this session, so a teacher who
// jumped here (e.g. tapped a 引用 card) always has a fixed way back to their draft.
// Two visual states: 草稿条 (dashed/muted, draft in progress) → 结果条 (solid/brand, built).
// The bar is a "you left something elsewhere" anchor — gated on POSITION, not progress:
// only surfaces a task whose home scenario ≠ where the teacher currently is. So while
// you're inside 出卷子 it never points at the卷子 in front of you (which also sidesteps
// 出卷子 having no guided empty-state — its config screen would otherwise read as a draft
// the instant you arrive). built only toggles the wording (查看成品 vs 继续编辑).
function deriveSessionTask(currentScenario) {
  const clean = (s) => (s || "").replace(/[《》]/g, "").trim();
  const p = window.ChatSession.scratch.paper2;
  if (p && (p.q || p.paper) && currentScenario !== "paper") {
    const topic = clean((p.paper && p.paper.meta && p.paper.meta.topic) || ((p.q || "").match(/《(.+?)》/) || [])[1] || (p.q || "").replace(/^据/, "").slice(0, 12) || "卷子");
    return { scenario: "paper", icon: "paper", kind: "卷子", topic, built: !!p.paper };
  }
  const l = window.ChatSession.scratch.lesson;
  if (l && (l.q || l.doc) && currentScenario !== "lesson") {
    const topic = clean((l.doc && l.doc.topic) || ((l.q || "").match(/《(.+?)》/) || [])[1] || (l.q || "").replace(/^据/, "").slice(0, 12) || "教案");
    return { scenario: "lesson", icon: "lesson", kind: "教案", topic, built: !!l.doc };
  }
  return null;
}
function SessionTaskBar({ task, onOpen }) {
  if (!task) return null;
  const built = task.built;
  return (
    <div style={{ padding: "0 14px 10px" }}>
      <button onClick={onOpen} title={built ? "打开成品" : "回到草稿继续编辑"} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left", cursor: "pointer", fontFamily: "var(--font-zh)",
        padding: "9px 11px", borderRadius: 12,
        border: built ? "1px solid var(--brand-soft-border)" : "1.5px dashed var(--line-2)",
        background: built ? "var(--brand-soft)" : "var(--surface-2)",
        transition: "all .15s",
      }}>
        <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: "grid", placeItems: "center",
          background: built ? "var(--surface)" : "transparent",
          border: built ? "1px solid var(--brand-soft-border)" : "1px dashed var(--line-2)",
          color: built ? "var(--brand-deep)" : "var(--ink-4)" }}>
          <Icon name={task.icon} size={15} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 800, letterSpacing: ".3px", color: built ? "var(--brand-deep)" : "var(--ink-4)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: built ? "oklch(0.72 0.17 150)" : "var(--ink-4)", flexShrink: 0 }} />
            {built ? "已生成 · 点击查看" : "草稿编辑中 · 进度已保留"}
          </span>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
            {built ? "" : "继续编辑 "}《{task.topic}》{task.kind}
          </span>
        </span>
        <Icon name="chevronRight" size={16} />
      </button>
    </div>
  );
}

// ---- Chat panel (left) ----
function ChatPanel({ messages, onSend, suggestions, placeholder, width = 380, pinnedCard, roundsById, shownId, onOpenRound, retrieving, header, onOpenRef, clarify, onResolveClarify, onSkipClarify, clarifyNode, taskBar, centered, scenario, onSwitch }) {
  const [draft, setDraft] = uS("");
  const [att, setAtt] = uS([]);          // { id, name, status: uploading|parsing|ready }
  const [viewFile, setViewFile] = uS(null);
  const [atBottom, setAtBottom] = uS(true);
  const scrollRef = uR(null);
  const taRef = uR(null);
  const atBottomRef = uR(true);
  const prevLenRef = uR(messages.length);
  const TA_MAX = 116; // ~5 lines, then scroll in place
  const aiBusy = messages.some((m) => m.typing);

  // auto-scroll to latest ONLY when a new message arrives AND the user is already
  // at the bottom — never yank them up from history (clicking history = no jump)
  const recomputeBottom = () => {
    const el = scrollRef.current; if (!el) return;
    const nb = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    atBottomRef.current = nb; setAtBottom(nb);
  };
  // Always snap to the latest when the message list actually changes — sends, AI
  // replies, handoff seeds all reach the bottom. Clicking a history result card does
  // NOT change `messages`, so this effect won't fire and the chat stays put.
  uE(() => {
    const el = scrollRef.current; if (!el) return;
    el.scrollTop = el.scrollHeight;
    recomputeBottom();
  }, [messages]);
  const scrollToBottom = () => { const el = scrollRef.current; if (!el) return; el.scrollTop = el.scrollHeight; atBottomRef.current = true; setAtBottom(true); };

  // grow the textarea up to 5 lines, then keep height and scroll internally
  uE(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, TA_MAX) + "px";
    el.style.overflowY = el.scrollHeight > TA_MAX ? "auto" : "hidden";
  }, [draft]);

  // attachments: simulate upload → parse → ready so it feels real
  const addFiles = (names) => {
    const incoming = names.map((n) => ({ id: Math.random().toString(36).slice(2), name: n, status: "uploading" }));
    setAtt((f) => [...f, ...incoming].slice(0, 6));
    incoming.forEach((it) => {
      setTimeout(() => setAtt((f) => f.map((x) => (x.id === it.id && x.status === "uploading" ? { ...x, status: "parsing" } : x))), 700);
      setTimeout(() => setAtt((f) => f.map((x) => (x.id === it.id ? { ...x, status: "ready" } : x))), 1700);
    });
  };
  const busyUpload = att.some((a) => a.status !== "ready");

  // Opening a round (clicking a result pill) must NOT move the chat — it only swaps the
  // right pane. Capture the scroll position and pin it across the re-render frames, so
  // the conversation stays exactly where the teacher was reading.
  const handleOpenRound = (id) => {
    const el = scrollRef.current;
    const keep = el ? el.scrollTop : 0;
    onOpenRound && onOpenRound(id);
    const pin = () => { if (scrollRef.current) scrollRef.current.scrollTop = keep; };
    requestAnimationFrame(pin);
    requestAnimationFrame(() => requestAnimationFrame(pin));
    setTimeout(pin, 80);
  };

  const send = (txt) => {
    const v = (txt ?? draft).trim();
    if (!v && att.length === 0) return;
    if (busyUpload) return; // wait until attachments finish parsing
    onSend(v, att.map((a) => a.name));
    setDraft("");
    setAtt([]);
  };

  // 追问 dedup — mock 建议不得与会话中已发送过的消息重复（按发送文本比对）
  const sentTexts = new Set(messages.filter((m) => m.role === "user" && typeof m.text === "string").map((m) => m.text.trim()));
  const sugs = (suggestions || [])
    .filter((s) => { const t = (typeof s === "string" ? s : (s.send_text || s.label)) || ""; return !sentTexts.has(t.trim()); })
    .slice(0, 3); // 最多 3 条
  const CW = 760; // readable column width when the stage is collapsed (content centers, chrome stays full-width)
  const colWrap = centered ? { maxWidth: CW, marginLeft: "auto", marginRight: "auto", width: "100%" } : null;
  return (
    <div style={{ width, flexShrink: 0, display: "flex", flexDirection: "column", background: "var(--surface)", borderRight: centered ? "none" : "1px solid var(--line)" }}>
      {header}
      <div ref={scrollRef} onScroll={recomputeBottom} style={{ flex: 1, overflowY: "auto", padding: "20px 14px" }}>
        <div style={{ ...colWrap, display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.map((m, i) => {
          const round = roundsById && m.roundId != null ? roundsById[m.roundId] : null;
          const prev = messages[i - 1];
          const grouped = m.role !== "user" && m.role !== "sys" && !!prev && prev.role !== "user" && prev.role !== "sys";
          return <Bubble key={i} m={m} round={round} active={round && round.id === shownId && !retrieving} onOpenRound={handleOpenRound} grouped={grouped} onOpenRef={onOpenRef} onViewFile={setViewFile} />;
        })}
        {/* 追问 chips — live IN the chat flow, hanging under the latest AI reply (PRD 追问推荐 §4.1).
            Round-scoped and short-lived: the workspace clears `suggestions` the moment the user
            sends anything, so at most one group exists and it never lingers in history.
            Only render when the thread actually ends on an AI turn — never under a user message. */}
        {sugs.length > 0 && !clarify && !retrieving && messages.length > 0 && messages[messages.length - 1].role !== "user" && (
          <div data-screen-label="追问推荐" style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingLeft: 4, marginTop: -9, marginBottom: 4 }}>
            {sugs.map((s, i) => {
              const label = typeof s === "string" ? s : s.label;
              const sendText = typeof s === "string" ? s : (s.send_text || s.label);
              return (
                <button
                  key={label}
                  onClick={() => send(sendText)}
                  title={sendText !== label ? sendText : undefined}
                  className="sug-pop"
                  style={{
                    animationDelay: `${i * 0.05}s`,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "4px 10px",
                    borderRadius: 999,
                    border: "1px dashed var(--brand-soft-border)",
                    background: "transparent",
                    color: "var(--brand-deep)",
                    fontSize: 11.5,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "var(--font-zh)",
                    transition: "background .15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--brand-soft)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <Icon name="spark" size={11} /> {label}
                </button>
              );
            })}
          </div>
        )}
        {pinnedCard}
        </div>
      </div>
      {clarify && (clarifyNode || <ClarifyPopover analysis={clarify.analysis} onResolve={onResolveClarify} onSkip={onSkipClarify} />)}
      {!clarify && taskBar}
      <div style={{ padding: "8px 14px 12px", position: "relative" }}>
        {/* scroll-to-bottom — appears when scrolled up; heartbeats while 小博士 is outputting */}
        {!atBottom && (
          <button onClick={scrollToBottom} title={aiBusy ? "小博士正在输出…" : "回到最新"} className={aiBusy ? "heartbeat" : ""} style={{ position: "absolute", top: -44, left: "50%", transform: "translateX(-50%)", width: 34, height: 34, borderRadius: "50%", border: "1px solid var(--line)", background: "var(--surface)", boxShadow: "0 8px 20px -8px rgba(20,30,50,.3)", color: "var(--brand-deep)", display: "grid", placeItems: "center", cursor: "pointer", zIndex: 6 }}>
            {aiBusy ? <span className="mini-spin" /> : <Icon name="chevron" size={18} />}
          </button>
        )}
        {/* homepage-style composer: attachments (top, inside box) → input area → button row */}
        {scenario && (
          <div style={colWrap || undefined}>
            <ScenePills scenario={scenario} onSwitch={onSwitch} disabled={!!clarify} />
          </div>
        )}
        <div
          onFocusCapture={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.boxShadow = "var(--ring), var(--input-shadow)"; }}
          onBlurCapture={(e) => { e.currentTarget.style.borderColor = "var(--input-border)"; e.currentTarget.style.boxShadow = "none"; }}
          style={{ ...colWrap, background: "var(--surface)", border: "1.5px solid var(--input-border)", borderRadius: 16, padding: "10px 12px 8px", transition: "border-color .2s, box-shadow .25s" }}
        >
          <FileChips files={att} onRemove={(i) => setAtt((f) => f.filter((_, j) => j !== i))} onView={(n) => setViewFile(n)} style={{ marginBottom: att.length ? 8 : 0 }} />
          <textarea
            ref={taRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder={clarify ? "选上方，或直接在这里描述你要找的资源…" : (placeholder || "继续告诉我你的调整…")}
            style={{ width: "100%", display: "block", border: "none", outline: "none", background: "transparent", resize: "none", fontSize: 13.5, fontFamily: "var(--font-zh)", color: "var(--ink)", lineHeight: 1.5, padding: "2px 2px", maxHeight: TA_MAX, overflowY: "hidden", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 6 }}>
            <ClipButton onFiles={addFiles} compact />
            <button
              onClick={() => send()}
              disabled={busyUpload}
              title={busyUpload ? "附件解析中…" : "发送"}
              style={{ width: 34, height: 34, borderRadius: 10, border: "none", background: busyUpload ? "var(--line)" : "var(--brand-grad)", backgroundColor: busyUpload ? "var(--line)" : "var(--brand)", color: busyUpload ? "var(--ink-3)" : "#fff", display: "grid", placeItems: "center", cursor: busyUpload ? "default" : "pointer", flexShrink: 0, transition: "background .2s" }}
            >
              <Icon name="send" size={16} />
            </button>
          </div>
        </div>
        <div style={{ ...colWrap, textAlign: "center", fontSize: 10.5, color: "var(--ink-4)", marginTop: 5, lineHeight: 1.2 }}>AI 内容仅供教研参考</div>
      </div>
      {viewFile && <FileViewer name={viewFile} onClose={() => setViewFile(null)} />}
    </div>
  );
}

// artifact chip — a frozen round/creation carried across scenarios; click to reopen it
function ArtifactChip({ a }) {
  const S = (window.AIDATA.SCENARIOS.find((s) => s.id === a.scenario)) || window.AIDATA.GENERAL;
  const hue = S.hue || 255;
  const iconKey = a.icon || S.icon;
  const accent = (window.ICON_ACCENT && window.ICON_ACCENT[iconKey]) || `oklch(0.6 0.15 ${hue})`;
  const tags = [a.stage, a.subject, a.edition, a.book].filter(Boolean);
  if (!tags.length && a.meta) a.meta.split(/\s*·\s*/).forEach((t) => t && tags.push(t));
  const aKey = a.scenario + ":" + (a._uid || a.id || a.title);
  const [active, setActive] = uS(window.__activeArtifactKey === aKey);
  uE(() => {
    const handler = (e) => setActive(e.detail === aKey);
    window.addEventListener("artifact-select", handler);
    return () => window.removeEventListener("artifact-select", handler);
  }, [aKey]);
  const activeBg = accent + "18";
  const activeBorder = accent + "66";
  const handleClick = () => {
    window.__activeArtifactKey = aKey;
    window.dispatchEvent(new CustomEvent("artifact-select", { detail: aKey }));
    window.openSessionArtifact && window.openSessionArtifact(a);
  };
  return (
    <button
      onClick={handleClick}
      title={"重新打开这轮结果"}
      style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, textAlign: "left", padding: "10px 12px", borderRadius: 12, border: active ? `1.5px solid ${activeBorder}` : "1px solid var(--line)", background: active ? activeBg : "var(--surface)", cursor: "pointer", fontFamily: "var(--font-zh)", transition: "border-color .15s, background .15s" }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = "var(--brand-soft-border)"; e.currentTarget.style.background = "oklch(0.97 0.01 260)"; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.background = "var(--surface)"; } }}
    >
      <ScenarioGlyph icon={iconKey} hue={hue} size={28} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
        <div style={{ display: "flex", gap: 5, marginTop: 3, flexWrap: "wrap" }}>
          {(tags.length ? tags : [S.name]).map((t, i) => (
            <span key={i} style={{ padding: "1px 7px", borderRadius: 6, background: active ? "rgba(255,255,255,.6)" : "var(--surface-2)", border: "1px solid " + (active ? activeBorder : "var(--line)"), fontSize: 10.5, fontWeight: 600, color: "var(--ink-3)", whiteSpace: "nowrap" }}>{t}</span>
          ))}
        </div>
      </div>
      {active ? <span style={{ color: accent, display: "inline-flex" }}><Icon name="check" size={16} sw={2.6} /></span> : <Icon name="chevronRight" size={15} />}
    </button>
  );
}

// ── Session 成果 (consolidated artifacts) ──────────────────────────────────
// Across a single conversation the assistant freezes finished outputs (matched
// resources, papers, lessons, courseware, mind-maps…). They scroll away in the
// thread, so the chat header carries a quick-access menu listing every one with
// its creation time — click to reopen that round in its workspace.
function sessionArtifacts(liveMsgs) {
  const times = window.ChatSession.artifactTimes || (window.ChatSession.artifactTimes = {});
  // Pull from BOTH the frozen global log (carries artifacts from every scenario the
  // teacher has been through this session) and the live current-workspace messages
  // (newest artifacts not yet flushed to the log). Dedupe by stable key.
  const sources = [].concat(window.ChatSession.take() || [], liveMsgs || []);
  const seen = new Set();
  const out = [];
  sources.forEach((m, i) => {
    if (m && m.artifact && m.artifact.scenario) {
      const a = m.artifact;
      const key = a.scenario + ":" + (a.id || a.title || i);
      if (seen.has(key)) return;
      seen.add(key);
      if (!times[key]) times[key] = Date.now();
      out.push({ ...a, _key: key, ts: times[key] });
    }
  });
  return out;
}

function ArtifactsPopover({ items, onClose }) {
  const fmt = (ts) => { const d = new Date(ts); const p = (n) => String(n).padStart(2, "0"); return `${p(d.getHours())}:${p(d.getMinutes())}`; };
  return (
    <div className="drawer-pop" style={{ position: "absolute", top: "calc(100% + 9px)", right: 0, width: 304, maxHeight: 392, overflowY: "auto", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 15, boxShadow: "var(--shadow-card)", zIndex: 320, padding: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px 9px" }}>
        <Icon name="artifacts" size={14} />
        <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--ink)" }}>本次对话的成果</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-3)", fontFamily: "var(--font-num)" }}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div style={{ padding: "16px 14px 22px", textAlign: "center", fontSize: 12, color: "var(--ink-3)", lineHeight: 1.75 }}>
          本次对话还没有固化的成果。<br />生成卷子、教案、课件等结果后，会自动出现在这里。
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {items.slice().reverse().map((a) => {
            const S = (window.AIDATA.SCENARIOS.find((s) => s.id === a.scenario)) || window.AIDATA.GENERAL;
            return (
              <button
                key={a._key}
                onClick={() => { onClose(); window.openSessionArtifact && window.openSessionArtifact(a); }}
                title={"重新打开：" + a.title}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left", padding: "8px 9px", borderRadius: 11, border: "1px solid transparent", background: "transparent", cursor: "pointer", fontFamily: "var(--font-zh)", transition: "background .14s, border-color .14s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.borderColor = "var(--line)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
              >
                <ScenarioGlyph icon={a.icon || S.icon} hue={S.hue} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
                  <div style={{ fontSize: 10.5, color: "var(--ink-3)", fontWeight: 600, marginTop: 2 }}>创建时间：{fmt(a.ts)}</div>
                </div>
                <Icon name="chevronRight" size={15} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// trigger button (+ count badge) that lives at the top-right of the chat column
function SessionArtifactsMenu({ messages }) {
  const items = sessionArtifacts(messages);
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);
  const count = items.length;
  if (count === 0) return null; // nothing frozen yet → no empty button cluttering the header
  return (
    <div ref={wrapRef} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        data-tip="本次对话的成果" data-tip-pos="bottom-right" aria-label="本次对话的成果"
        style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 30, padding: "0 8px", borderRadius: 8, border: "1px solid " + (open ? "var(--brand-soft-border)" : "var(--line)"), background: open ? "var(--brand-soft)" : "var(--surface)", color: open ? "var(--brand-deep)" : (count ? "var(--ink-2)" : "var(--ink-3)"), cursor: "pointer", fontFamily: "var(--font-zh)", transition: "background .14s, color .14s, border-color .14s" }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = "var(--surface-2)"; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = "var(--surface)"; }}
      >
        <Icon name="artifacts" size={16} />
        <span style={{ fontSize: 12, fontWeight: 800, fontFamily: "var(--font-num)", minWidth: 7, textAlign: "center" }}>{count}</span>
      </button>
      {open && <ArtifactsPopover items={items} onClose={() => setOpen(false)} />}
    </div>
  );
}
Object.assign(window, { SessionArtifactsMenu });

function Bubble({ m, round, active, onOpenRound, grouped, onOpenRef, onViewFile }) {
  // slim system marker — scenario switches etc. A divider, not a chat bubble.
  if (m.role === "sys") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "1px 0", justifyContent: "center" }}>
        <span style={{ width: 24, height: 1, background: "var(--line)", flexShrink: 0 }} />
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
          {m.icon && <Icon name={m.icon} size={13} />}
          {m.text}
          {m.back && (
            <button
              onClick={() => { window.ChatSession && (window.ChatSession.switchMeta = { source: "manual" }); window.__aidaSwitch && window.__aidaSwitch(m.back.id, ""); }}
              title={"切回" + m.back.name}
              style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 2, padding: "2px 9px", borderRadius: 999, border: "1px solid var(--brand-soft-border)", background: "var(--brand-soft)", color: "var(--brand-deep)", fontSize: 11.5, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-zh)" }}
            >
              切回
            </button>
          )}
        </span>
        <span style={{ width: 24, height: 1, background: "var(--line)", flexShrink: 0 }} />
      </div>
    );
  }
  if (m.role === "user") {
    return (
      <div style={{ alignSelf: "flex-end", maxWidth: "85%", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
        {/* resource reference card — shown ABOVE the bubble when the question came from a resource detail */}
        {m.ref && (
          <button
            onClick={() => onOpenRef && m.refItem && onOpenRef(m.refItem)}
            title={m.refItem ? "查看这份资源" : ""}
            style={{ display: "flex", alignItems: "center", gap: 8, maxWidth: 260, padding: "7px 11px", borderRadius: 11, border: "1px solid var(--brand-soft-border)", background: "var(--brand-soft)", cursor: m.refItem ? "pointer" : "default", textAlign: "left", fontFamily: "var(--font-zh)" }}
          >
            <span style={{ width: 24, height: 24, borderRadius: 7, background: "var(--surface)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}><Icon name="quote" size={12} /></span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 11.5, fontWeight: 800, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 210 }}>{m.ref.title}</span>
              <span style={{ display: "block", fontSize: 10, color: "var(--brand-deep)", fontWeight: 700, marginTop: 1 }}>引用·{m.ref.type}{m.refItem ? " · 点此查看" : ""}</span>
            </span>
          </button>
        )}
        {m.files && m.files.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "flex-end" }}>
            {m.files.map((name, i) => (
              <span key={i} onClick={() => onViewFile && onViewFile(name)} title={onViewFile ? "点击查看" : undefined} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 8px", borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--line)", fontSize: 11.5, fontWeight: 600, color: "var(--ink-2)", maxWidth: 180, cursor: onViewFile ? "pointer" : "default" }}>
                <Icon name="file" size={12} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
              </span>
            ))}
          </div>
        )}
        {m.text && (
          <div style={{ background: "var(--brand-grad)", backgroundColor: "var(--brand)", color: "#fff", padding: "10px 13px", borderRadius: "14px 14px 4px 14px", fontSize: 13.5, lineHeight: 1.6, fontWeight: 500, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
            {m.text}
          </div>
        )}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", gap: 9, alignItems: "flex-start", maxWidth: "92%", width: m.wide ? "100%" : "auto", marginTop: grouped ? -8 : 0 }}>
      <div style={{ flex: m.wide ? 1 : "0 1 auto", minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {m.answered ? (
          /* resolved 追问 — a compact summary card inside the AI turn (question + chosen value) */
          <div style={{ border: "1px solid var(--line)", borderRadius: 13, background: "var(--surface)", padding: "11px 14px" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)", lineHeight: 1.45 }}>{m.answered.q}</div>
            <div style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 600, marginTop: 3, display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="check" size={13} sw={2.4} />{m.answered.value}</div>
          </div>
        ) : (
          <div style={{ background: "var(--surface-2)", border: "1px solid var(--line)", padding: "10px 13px", borderRadius: "4px 14px 14px 14px", fontSize: 13.5, lineHeight: 1.65, color: "var(--ink)" }}>
            {m.typing ? <Dots /> : m.render ? m.render() : (m.node || m.text)}
          </div>
        )}
        {/* per-round result pill — a sibling BELOW the bubble, not nested inside it */}
        {!m.typing && round && (
          <ResultPill count={round.count} active={active} onOpen={() => onOpenRound && onOpenRound(round.id)} />
        )}
        {/* cross-scenario artifact chip — reopens an earlier round/creation, even from another scenario */}
        {!m.typing && !round && m.artifact && (
          <ArtifactChip a={m.artifact} />
        )}
      </div>
    </div>
  );
}

// ---- 找资源 workspace ----
// 与标签树对齐：筛选维度 = 学段 / 学科 / 版本 / 类型[41] / 难度（业务流程§5.4）
const MORE_FILTERS = [
  { key: "stage", label: "学段", opts: ["小学", "初中", "高中", "中职"] },
  { key: "subject", label: "学科", opts: ["语文", "数学", "英语", "物理", "化学", "生物学", "历史", "地理", "道德与法治", "科学"] },
  { key: "edition", label: "版本", opts: ["人教版", "统编版", "北师大版", "苏教版", "外研版", "通用"] },
  { key: "type", label: "类型", opts: ["课件", "教案", "学案", "作业", "试卷", "题集", "素材", "示范课", "备课综合"] },
  { key: "diff", label: "难度", opts: ["基础", "中等", "拔高"] },
];

const HANDOFF = [
  { id: "paper", icon: "paper", label: "直接出一份卷子", hue: 25, hint: "从学科网题库智能组卷" },
  { id: "lesson", icon: "lesson", label: "生成配套教案", hue: 320, hint: "对齐课标的教学设计" },
  { id: "courseware", icon: "slides", label: "做成课件", hue: 255, hint: "结构清晰的 PPT / 互动课件" },
];

const RESULT_TABS = [
  { k: "all", label: "全部" },
  { k: "doc", label: "文档" },
  { k: "video", label: "视频" },
  { k: "album", label: "专辑" },
];
// 解析用别名表：含口语化写法，长名在前优先命中（生物学 > 生物、历史与社会 > 历史）
const SUBJ_LIST = ["语文", "数学", "英语", "物理", "化学", "生物学", "生物", "历史与社会", "历史", "地理", "道德与法治", "思想政治", "政治", "科学", "信息技术"];
const GRADE_LIST = ["七年级", "八年级", "九年级", "高一", "高二", "高三", "六年级", "五年级", "四年级", "三年级"];
function pickSubject(q) { return q ? SUBJ_LIST.find((s) => q.includes(s)) : null; }
function pickGrade(q) { return q ? GRADE_LIST.find((g) => q.includes(g)) : null; }
// does this message look like a resource-find request (vs. a vague follow-up / chit-chat)?
function isFindLike(q) {
  if (!q) return false;
  if (detectKind(q) !== "all") return true;
  return /找|搜|有没有|有无|资源|试卷|卷子|课件|教案|讲义|学案|练习|习题|真题|素材|课时|下载|来一?[份点个]|帮我找|推荐|有什么/.test(q);
}
// content-aware, self-consistent replies grounded in a resource/video's REAL fields
function replyForResource(q, item) {
  const isVideo = item && (item.kind === "video" || item.cat || item.chapters);
  const t = (item && item.title) || "这份资料";
  const tags = (item && item.tags) || [];
  const tagStr = tags.length ? tags.join("、") : "本节核心知识点";

  // album-level questions (专辑只回答合集级问题)
  if (item && (item.composition || item._kind === "album")) {
    const comp = (item.composition || []).map((c) => `${c.type}${c.n}`).join("、");
    if (/主题|涵盖|知识|范围|考点|重点/.test(q)) return <span>《{t}》是一套 <b>{item.total || ""} 份</b>的成套合集，含 {comp}，覆盖 <b style={{ color: "var(--brand-deep)" }}>{tagStr}</b> 等主题。可整套打包，也可只取其中的试卷或课件单独使用 —— 你想先看哪一类我都能帮你拆出来。</span>;
  }
  // 讲题（A 类，AI 从原卷挑典型题，不要求用户先指定哪道）
  if (/这道题|怎么讲|讲一下|讲题|讲解这|典型题|讲讲|挑几道/.test(q)) {
    return <span>好的，我从《{t}》里挑一道<b>典型题</b>来讲：先帮学生厘清 <b style={{ color: "var(--brand-deep)" }}>{tags[0] || "核心知识点"}</b> 的解题入口，再分步推导、标注易错点。你也可以指定第几题，我据原卷逐题讲解。</span>;
  }
  // 考点 / 教学重点 / 教学目标 / 学习目标 / 教学流程（A 类内容总结）
  if (/考点|教学重点|教学目标|学习目标|学习重点|要点|教学设计思路|教学流程|学习流程/.test(q)) {
    if (isVideo) return <span>《{t}》的核心要点：依次覆盖 {(item.chapters || []).slice(0, 3).map((c) => c.name).join("、") || tagStr}。我可整理成<b>逐条要点清单</b>，或据此<b style={{ color: "var(--brand-deep)" }}>配套出题</b>巩固。</span>;
    const lead = /流程/.test(q) ? "教学流程" : /设计思路/.test(q) ? "教学设计思路" : /学习目标|学习重点/.test(q) ? "学习目标与重点" : /目标/.test(q) ? "教学目标" : /考点/.test(q) ? "考点" : "教学重点";
    return <span>已通读《{t}》，为你梳理其<b>{lead}</b>：围绕 <b style={{ color: "var(--brand-deep)" }}>{tagStr}</b> 展开{item && item.qcount ? `，配 ${item.qcount} 道题逐层巩固` : ""}{item && item.pages ? `，共 ${item.pages} 页` : ""}。需要我整理成可直接用的清单，或据此<b>生成教案 / 出题</b>都行。</span>;
  }

  if (/出卷|出题|组卷|生成|做一份|出一份|出份/.test(q)) {
    if (isVideo) return <span>《{t}》是<b>{item.cat || "教学视频"}</b>，我可以按它讲解的知识点，<b style={{ color: "var(--brand-deep)" }}>配一套同步练习</b>。对我说「出卷子」即可带着这些知识点过去。</span>;
    return <span>没问题 —— 我可以基于《{t}》的知识点（{tagStr}）与<b>{item && item.diff ? item.diff : "中等"}</b>难度，<b style={{ color: "var(--brand-deep)" }}>直接组一份新卷子</b>。点下方「送去出卷子」，或对我说「出卷子」。</span>;
  }
  if (/适合|学情|班级|难不难|难度/.test(q)) {
    if (isVideo) return <span>《{t}》为 <b>{item.grade}{item.subject}</b>、{item.duration} {item.quality}，{item.chapters ? `分 ${item.chapters.length} 个章节、可按需跳转` : "时长适中"}，{item.cat === "实验视频" ? "适合课堂演示或课前预习" : "适合课堂讲解或研修"}。</span>;
    return <span>《{t}》为 <b>{item.grade}{item.subject} · {item.edition}</b>、难度<b>{item.diff || "中等"}</b>{item.qcount ? `、含 ${item.qcount} 题` : ""}，与你班级常用难度匹配度较高{item.match ? `（匹配度 ${item.match}%）` : ""}。需要更基础或更拔高的版本，我可再筛一批。</span>;
  }
  if (isVideo && /环节|哪个|什么时候|怎么用|课堂/.test(q)) {
    const chap = item.chapters && item.chapters[1];
    return <span>建议把《{t}》用在<b>新授或探究环节</b>：{item.chapters ? <span>例如「{chap.name}」一段（{chap.t} 起）很适合定格讲解。</span> : "可整段播放后组织讨论。"}已为 {item.grade}{item.subject} 学情做过校验。</span>;
  }
  if (isVideo) {
    const names = (item.chapters || []).slice(0, 3).map((c) => c.name).join("、");
    return <span>《{t}》是 <b>{item.cat}</b>（{item.duration}）：{item.chapters ? <span>依次讲解 {names} 等 {item.chapters.length} 个环节</span> : "完整呈现了该知识点"}，画质 {item.quality}，已播放 {item.plays}。需要我<b>提取讲解要点</b>或<b>配套出题</b>都可以。</span>;
  }
  return <span>我已通读《{t}》：<b>{item ? item.type : "资料"}</b>，{item && item.pages ? `共 ${item.pages} 页` : "篇幅适中"}{item && item.qcount ? `、含 ${item.qcount} 道题` : ""}，覆盖 {tagStr}，{item && item.reviewed ? "已通过学科网审校，" : ""}可直接用于课堂。需要我<b>提取讲解要点</b>或<b>据此出卷</b>都行。</span>;
}

function detectKind(q) {
  if (!q) return "all";
  if (/专辑|合集|套|打包|串讲|资源包|大单元|上好课/.test(q)) return "album";
  if (/视频|实验|研修|示范课|微课视频|讲解视频/.test(q)) return "video";
  return "all";
}

// ---- per-round result model ----------------------------------------------
// Every query produces a FROZEN result set ("round"). Each AI reply carries its
// round's id; clicking that reply's pill re-opens exactly those results. Rounds
// are never overwritten — "given to you, it's yours."

const SOURCE_STYLE = {
  "学科网": { label: "学科网", icon: "shield", c: "var(--auth-ink)", bg: "var(--auth-bg)", bd: "var(--auth-border)" },
  "我的内容": { label: "我的内容", icon: "grid", c: "oklch(0.47 0.13 300)", bg: "oklch(0.965 0.025 300)", bd: "oklch(0.88 0.05 300)" },
  "资源篮": { label: "资源篮", icon: "basket", c: "oklch(0.48 0.12 55)", bg: "oklch(0.965 0.04 75)", bd: "oklch(0.88 0.07 70)" },
};
function SourceTag({ source }) {
  const s = SOURCE_STYLE[source] || SOURCE_STYLE["学科网"];
  // low-key: a small dot + muted label, no colored pill (sources shouldn't dominate the card)
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.c, opacity: 0.75, flexShrink: 0 }} /> {s.label}
    </span>
  );
}

const KIND_LABEL = { all: "文档·视频·专辑", doc: "文档", video: "视频", album: "专辑" };

// build a frozen, source-tagged, mixed item list for one round
function buildRound(text, id, ctx, loggedIn, basketTitles) {
  const R = window.AIDATA.RESOURCES, V = window.AIDATA.VIDEOS, A = window.AIDATA.ALBUMS;
  const kind = detectKind(text);
  const subject = pickSubject(text) || ctx.subject;
  const grade = pickGrade(text) || ctx.grade;
  ctx.subject = subject; ctx.grade = grade; // remember for vague follow-ups
  const sjOK = (x) => !subject || x.subject === subject || x.subject === "通用";
  const grOK = (x) => !grade || !x.grade || x.grade === grade;
  let docs = R.filter((x) => sjOK(x) && grOK(x));
  if (!docs.length) docs = R.filter(sjOK);
  if (!docs.length) docs = R.slice();
  let vids = V.filter(sjOK); if (!vids.length) vids = V.slice();
  let albs = A.filter(sjOK); if (!albs.length) albs = A.slice();
  const tag = (arr, k) => arr.map((x) => ({ ...x, _kind: k }));
  let items;
  if (kind === "video") items = [...tag(vids, "video"), ...tag(albs.slice(0, 1), "album"), ...tag(docs.slice(0, 3), "doc")];
  else if (kind === "album") items = [...tag(albs, "album"), ...tag(docs.slice(0, 5), "doc"), ...tag(vids.slice(0, 2), "video")];
  else items = [...tag(albs.slice(0, 2), "album"), ...tag(docs.slice(0, 8), "doc"), ...tag(vids.slice(0, 3), "video")];
  items = items.slice(0, 14).map((x) => ({ ...x, _source: "学科网" }));
  const bt = basketTitles || [];
  items = items.map((it) => (bt.some((t) => t && (it.title.includes(t) || t.includes(it.title))) ? { ...it, _source: "资源篮" } : it));
  if (loggedIn) {
    const di = items.findIndex((x) => x._kind === "doc" && x._source === "学科网");
    if (di >= 0) items[di] = { ...items[di], _source: "我的内容" };
  }
  if (bt.length && !items.some((x) => x._source === "资源篮")) {
    const di = items.findIndex((x) => x._source === "学科网");
    if (di >= 0) items[di] = { ...items[di], _source: "资源篮" };
  }
  const rank = { "我的内容": 0, "资源篮": 1, "学科网": 2 };
  items.sort((a, b) => rank[a._source] - rank[b._source]);
  return { id, query: text, items, count: items.length, kind, subject, grade };
}

function roundReplyNode(round) {
  const ctxBits = [round.grade, round.subject].filter(Boolean).join("");
  const cnt = (s) => round.items.filter((x) => x._source === s).length;
  const mine = cnt("我的内容"), bag = cnt("资源篮");
  const extra = [];
  if (mine) extra.push(`${mine} 项来自你的内容`);
  if (bag) extra.push(`${bag} 项来自资源篮收藏`);
  return (
    <span>
      已按你的需求{ctxBits ? <span>（理解为 <b style={{ color: "var(--brand-deep)" }}>{ctxBits}</b>）</span> : null}，从<b style={{ color: "var(--auth-ink)" }}>学科网资源库</b>检索整理出 <b>{round.count}</b> 项{extra.length ? <span>，其中 {extra.join("、")}</span> : null}。点下方查看，合适就收藏或下载，不合适我也能直接生成。
    </span>
  );
}

const ROUND_SUGS = {
  video: ["只看实验视频", "教师研修视频", "下载这个视频", "据此配套出题"],
  album: ["展开专辑内容", "整套打包下载", "只要试卷部分", "换个复习专辑"],
  all: ["只看视频", "有没有成套专辑", "只要含答案的文档", "难度再高一点"],
};

// follow-up chips above the input — grounded in THIS round's真实理解（学科 / 章节 / 形态），
// 而不是一组写死的通用词。
function roundSuggestions(round) {
  if (!round) return [];
  const subj = round.subject || "";
  const topic = ((round.query || "").match(/《(.+?)》/) || [])[1] || "";
  if (round.kind === "video") return ["只看实验视频", "教师研修视频", topic ? `${topic}讲解视频` : "换个知识点的视频", "据此配套出题"];
  if (round.kind === "album") return ["展开专辑内容", "整套打包下载", "只要其中的试卷", "换个复习专辑"];
  // 文档 / 混合轨
  const s = ["只要含答案解析", "难度再高一点"];
  s.push(topic ? `${topic}易错题专项` : (subj ? `${subj}其它章节` : "换个章节"));
  s.push("有没有配套微课");
  return s;
}

// result pill — sits BELOW the reply bubble (not nested inside it), width follows the bubble column
function ResultPill({ count, active, onOpen }) {
  return (
    <button onClick={onOpen} style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, textAlign: "left", padding: "9px 11px", borderRadius: 11, border: `1px solid ${active ? "var(--brand)" : "var(--brand-soft-border)"}`, background: active ? "var(--brand-soft)" : "var(--surface)", cursor: "pointer", fontFamily: "var(--font-zh)" }}>
      <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}><CIcon name="search" size={15} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--brand-deep)" }}>已为你匹配 {count} 个资源</div>
        <div style={{ fontSize: 10.5, color: "var(--ink-3)", fontWeight: 600, marginTop: 1 }}>{active ? "当前正在查看" : "点此查看本轮结果"}</div>
      </div>
      <Icon name={active ? "check" : "chevronRight"} size={15} />
    </button>
  );
}

// right-pane skeleton shown WHILE retrieving (so results never appear before the reply)
function RetrievingPanel() {
  const mobile = useIsMobile();
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: mobile ? "12px 16px" : "14px 22px", borderBottom: "1px solid var(--line)", background: "var(--surface)", display: "flex", alignItems: "center", gap: 10 }}>
        <Dots /> <span style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 600 }}>正在从 <b style={{ color: "var(--auth-ink)" }}>学科网资源库</b> 检索匹配…</span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: mobile ? "14px 16px" : "16px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-row" style={{ height: 76, borderRadius: 14, background: "var(--surface-2)", border: "1px solid var(--line)", animationDelay: `${i * 0.12}s` }} />
        ))}
      </div>
    </div>
  );
}

// ---- resource-detail question list (资源详情页「问小博士」) ------------------
// Per《资源详情页-问题列表交互设计》：题组按资源类别生成，纯前端，2 固定 + 1~2 动态，
// 上限 4。固定的「适合我的班级」依赖记忆系统，未登录（记忆未就绪）时隐藏。
function resourceCategory(item) {
  if (!item) return "paper";
  if (item._kind === "video" || item.kind === "video" || item.cat || item.chapters) return "video";
  if (item._kind === "album" || item.composition) return "album";
  const t = (item.type || "") + "";
  if (/课件|PPT|幻灯/.test(t)) return "courseware";
  if (/学案|导学案|学习任务单|知识清单|实验报告单/.test(t)) return "studyguide";
  if (/教案|讲义|教学设计|学历案|作业设计|说课/.test(t)) return "lesson";
  if (/同步练|单元卷|作业|假期|寒假|暑假/.test(t)) return "homework";
  if (/微课/.test(t)) return "video";
  if (/素材|图片|图集|音频|动画/.test(t)) return "material";
  if (/备课|综合/.test(t)) return "comprehensive";
  return "paper"; // 试卷 / 题集（试题汇编·专项训练·综合训练）/ 真题…
}

// short category label shown on the chat reference card
function refLabel(item) {
  if (!item) return "资料";
  if (item.composition || item._kind === "album") return "专辑合集 · " + (item.total || (item.composition || []).reduce((s, c) => s + c.n, 0)) + " 份";
  return item.type || item.cat || "资料";
}

// build the ordered question list for one resource (cls: A 内容RAG / B 画像对比 / C 生成handoff)
function buildResourceAsks(item, loggedIn) {
  const cat = resourceCategory(item);
  const summary = {
    paper: "总结这份资料的考点", homework: "总结这份作业的考点",
    courseware: "总结这份课件的教学重点", lesson: "总结这份教案的教学重点",
    studyguide: "总结这份学案的教学重点", comprehensive: "总结这份资料的教学重点",
    video: "总结这个视频的要点", album: "总结这个合集的主题范围", material: null,
  }[cat];
  const dynamic = {
    paper: [{ text: "挑几道典型题讲讲", cls: "A" }, { text: "据此出一份同类卷子", cls: "C", to: "paper" }],
    homework: [{ text: "挑几道典型题讲讲", cls: "A" }, { text: "据此出一份同类练习", cls: "C", to: "paper" }],
    courseware: [{ text: "提取这份课件的教学目标", cls: "A" }, { text: "据此生成一份教案", cls: "C", to: "lesson" }],
    lesson: [{ text: "整理一下这份教案的教学流程", cls: "A" }],
    studyguide: [{ text: "提取学生学习目标和重点", cls: "A" }],
    comprehensive: [{ text: "提取这份资料的教学设计思路", cls: "A" }],
    video: [{ text: "这个视频适合课堂哪个环节", cls: "A" }],
    album: [{ text: "这个合集涵盖哪些知识主题", cls: "A" }],
    material: [],
  }[cat] || [];
  const list = [];
  if (summary) list.push({ text: summary, cls: "A" });
  if (loggedIn) list.push({ text: cat === "album" ? "这个合集适合我的班级吗？" : "这份适合我的班级吗？", cls: "B" });
  list.push(...dynamic);
  return list.slice(0, 4);
}

// shared 问小博士 bar at the bottom of every resource-detail surface (preview / player / album)
function AskBar({ item, loggedIn, onAsk }) {
  if (!onAsk) return null;
  const asks = buildResourceAsks(item, loggedIn);
  if (!asks.length) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: "1px solid var(--line)", background: "var(--brand-soft)" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "var(--brand-deep)", flexShrink: 0 }}>
        <Icon name="spark" size={14} /> 问小博士
      </span>
      <div style={{ flex: 1, minWidth: 0, display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2, scrollbarWidth: "none" }}>
        {asks.map((q, i) => (
          <button key={i} onClick={() => onAsk(q, item)} style={{ whiteSpace: "nowrap", flexShrink: 0, padding: "6px 12px", borderRadius: 999, border: "1px solid var(--brand-soft-border)", background: "var(--surface)", color: "var(--brand-deep)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", display: "inline-flex", alignItems: "center", gap: 5 }}>
            {q.text}{q.cls === "C" && <Icon name="sparkArrow" size={13} />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- 追问 / 澄清弹框（找资源「信息补全」引擎）---------------------------------
// 核心：根据用户意图识别已知字段，只追问「缺失的最小必要信息」。需要补的字段随
// 资源类型而变：课件/教案/学案 → 年级·学期·主题；试卷/作业 → 场景。
// 例：「沁园春雪」→ 已识别 初中·语文·九年级·上册·《沁园春雪》，只差「资料类型」。
const CLARIFY_STAGES = ["小学", "初中", "高中"];
const CLARIFY_SUBJECTS_BY_STAGE = {
  小学: ["语文", "数学", "英语", "科学", "道德与法治"],
  初中: ["语文", "数学", "英语", "物理", "化学", "生物学", "历史", "地理", "道德与法治"],
  高中: ["语文", "数学", "英语", "物理", "化学", "生物学", "历史", "地理", "思想政治"],
};
const CLARIFY_GRADES_BY_STAGE = {
  小学: ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"],
  初中: ["七年级", "八年级", "九年级"],
  高中: ["高一", "高二", "高三"],
};
// 资料类型（标签树[41]一级，对齐用户口径的 5 类）→ 决定其下需补字段
const FIND_TYPES = ["课件", "试卷", "教案", "学案", "作业"];
const PREP_TYPES = ["课件", "教案", "学案"];   // 备课类 → 年级·学期·主题
const ASSESS_TYPES = ["试卷", "作业"];          // 测练类 → 场景
const FIND_SEMESTERS = ["上册", "下册"];
// 场景（标签树[42]应用场景的常用取值）
const FIND_SCENES = ["开学", "周测", "阶段检测", "期中", "期末", "一模", "二模", "三模", "模拟预测", "真题"];
const FIELD_LABEL = { stage: "学段", subject: "学科", type: "资料类型", grade: "年级", semester: "学期", topic: "主题", scene: "场景" };
const ANY = "__any__"; // 「不限」哨兵值：算已选、但不进入检索条件

// —— 字段解析器（从一句话里抽取结构化条件）——
function stageOfGrade(g) {
  if (!g) return null;
  if (/[一二三四五六]年级/.test(g)) return "小学";
  if (/[七八九]年级/.test(g)) return "初中";
  if (/高[一二三]/.test(g)) return "高中";
  return null;
}
function pickStage(q) {
  if (!q) return null;
  if (/高中|高一(?![点些])|高二|高三/.test(q)) return "高中";
  if (/初中|初一|初二|初三|七年级|八年级|九年级/.test(q)) return "初中";
  if (/小学|一年级|二年级|三年级|四年级|五年级|六年级/.test(q)) return "小学";
  return null;
}
function pickGradeF(q) {
  if (!q) return null;
  const map = [["七年级", /七年级|初一/], ["八年级", /八年级|初二/], ["九年级", /九年级|初三/], ["高一", /高一(?![点些])/], ["高二", /高二/], ["高三", /高三/], ["六年级", /六年级/], ["五年级", /五年级/], ["四年级", /四年级/], ["三年级", /三年级/], ["二年级", /二年级/], ["一年级", /一年级/]];
  const hit = map.find(([, re]) => re.test(q));
  return hit ? hit[0] : null;
}
function pickSemester(q) {
  if (!q) return null;
  if (/上册|上学期/.test(q)) return "上册";
  if (/下册|下学期/.test(q)) return "下册";
  return null;
}
function pickType(q) {
  if (!q) return null;
  if (/学案|导学案|学习任务单|知识清单|实验报告单/.test(q)) return "学案";
  if (/教案|教学设计|讲义|学历案|说课|作业设计/.test(q)) return "教案";
  if (/课件|幻灯|PPT|ppt/.test(q)) return "课件";
  if (/同步练|单元卷|专项训练|综合训练|试题汇编|题集|练习|习题|作业/.test(q)) return "作业";
  if (/试卷|卷子|月考卷|期中卷|期末卷|模拟卷/.test(q)) return "试卷";
  return null;
}
function pickScene(q) {
  if (!q) return null;
  return FIND_SCENES.find((s) => q.includes(s)) || (/月考/.test(q) ? "阶段检测" : (/中考|高考|学业考试/.test(q) ? "真题" : null));
}

// —— 主题知识库：常见课文 / 知识点 → 可推断的 学段·学科·年级·学期·主题 ——
// 让「沁园春雪」这类输入无需用户明说就能识别到大部分字段，只剩最小缺口。
const TOPIC_KB = [
  { kw: ["沁园春雪", "沁园春·雪", "沁园春 雪"], stage: "初中", subject: "语文", grade: "九年级", semester: "上册", topic: "沁园春·雪" },
  { kw: ["背影"], stage: "初中", subject: "语文", grade: "八年级", semester: "上册", topic: "背影" },
  { kw: ["故乡"], stage: "初中", subject: "语文", grade: "九年级", semester: "上册", topic: "故乡" },
  { kw: ["腊八粥"], stage: "小学", subject: "语文", grade: "六年级", semester: "下册", topic: "腊八粥" },
  { kw: ["草原"], stage: "小学", subject: "语文", grade: "六年级", semester: "上册", topic: "草原" },
  { kw: ["荷塘月色"], stage: "高中", subject: "语文", grade: "高一", semester: "上册", topic: "荷塘月色" },
  { kw: ["有理数"], stage: "初中", subject: "数学", grade: "七年级", semester: "上册", topic: "有理数" },
  { kw: ["整式的加减", "整式"], stage: "初中", subject: "数学", grade: "七年级", semester: "上册", topic: "整式的加减" },
  { kw: ["一元一次方程"], stage: "初中", subject: "数学", grade: "七年级", semester: "上册", topic: "一元一次方程" },
  { kw: ["勾股定理"], stage: "初中", subject: "数学", grade: "八年级", semester: "下册", topic: "勾股定理" },
  { kw: ["平行四边形"], stage: "初中", subject: "数学", grade: "八年级", semester: "下册", topic: "平行四边形" },
  { kw: ["二次函数"], stage: "初中", subject: "数学", grade: "九年级", semester: "上册", topic: "二次函数" },
  { kw: ["函数的概念", "函数概念"], stage: "高中", subject: "数学", grade: "高一", semester: "上册", topic: "函数的概念" },
  { kw: ["凸透镜成像", "凸透镜"], stage: "初中", subject: "物理", grade: "八年级", semester: "上册", topic: "凸透镜成像规律" },
  { kw: ["欧姆定律"], stage: "初中", subject: "物理", grade: "九年级", semester: "上册", topic: "欧姆定律" },
  { kw: ["牛顿第一定律", "惯性"], stage: "初中", subject: "物理", grade: "八年级", semester: "下册", topic: "牛顿第一定律" },
  { kw: ["氧气的实验室制取", "氧气的制取", "制取氧气"], stage: "初中", subject: "化学", grade: "九年级", semester: "上册", topic: "氧气的实验室制取" },
  { kw: ["燃烧与灭火", "燃烧的条件"], stage: "初中", subject: "化学", grade: "九年级", semester: "上册", topic: "燃烧与灭火" },
  { kw: ["光合作用"], stage: "初中", subject: "生物学", grade: "七年级", semester: "上册", topic: "光合作用" },
  { kw: ["鸦片战争"], stage: "初中", subject: "历史", grade: "八年级", semester: "上册", topic: "鸦片战争" },
  { kw: ["热力环流"], stage: "高中", subject: "地理", grade: "高一", semester: "上册", topic: "热力环流" },
];

// 把一句话解析成完整画像 v + 各字段来源 src（kb 推断 / text 明示 / ctx 累积）
function analyzeFind(q, ctx) {
  const v = { stage: null, subject: null, type: null, grade: null, semester: null, topic: null, scene: null };
  const src = {};
  const kb = q ? TOPIC_KB.find((e) => e.kw.some((k) => q.includes(k))) : null;
  if (kb) ["stage", "subject", "grade", "semester", "topic"].forEach((k) => { if (kb[k]) { v[k] = kb[k]; src[k] = "kb"; } });
  const tEx = q && (q.match(/《(.+?)》/) || [])[1];
  if (tEx) { v.topic = tEx.replace(/\s/g, ""); src.topic = "text"; }
  const ex = { stage: pickStage(q), subject: pickSubject(q), type: pickType(q), grade: pickGradeF(q), semester: pickSemester(q), scene: pickScene(q) };
  Object.keys(ex).forEach((k) => { if (ex[k]) { v[k] = ex[k]; src[k] = "text"; } });
  if (!v.stage && v.grade) { v.stage = stageOfGrade(v.grade); if (v.stage) src.stage = "text"; }
  if (ctx) {
    if (!v.subject && ctx.subjectConfirmed && ctx.subject) { v.subject = ctx.subject; src.subject = "ctx"; }
    if (!v.grade && ctx.grade) { v.grade = ctx.grade; src.grade = "ctx"; }
    if (!v.stage && ctx.stage) { v.stage = ctx.stage; src.stage = "ctx"; }
    if (!v.stage && v.grade) { v.stage = stageOfGrade(v.grade); if (v.stage) src.stage = "ctx"; }
  }
  return { v, src };
}

// 资料类型决定「最小必要信息」需要哪些字段（学期作为软性项，不强制）
function requiredKeys(type) {
  const base = ["stage", "subject", "type"];
  if (PREP_TYPES.includes(type)) return [...base, "grade", "topic"]; // 备课类：年级 + 主题
  if (ASSESS_TYPES.includes(type)) return [...base, "scene"];        // 测练类：场景
  return base; // 类型未定，先把类型问出来
}
// 当前画像下，还缺哪些「最小必要信息」（顺序即追问顺序）
function findGaps(v) {
  return requiredKeys(v.type).filter((k) => v[k] == null);
}

// 把补全后的画像拼成一条检索 query（驱动下游 buildRound 的解析）
function valsToQuery(v) {
  const real = (x) => (x && x !== ANY) ? x : null;
  return [real(v.grade) || real(v.stage), real(v.subject), real(v.semester), real(v.type), real(v.scene), real(v.topic) ? `《${real(v.topic)}》` : null].filter(Boolean).join(" ");
}

// 触发追问前，小博士先回一句「随缺口程度而变」的铺垫话
function clarifyIntro(v, gaps, rawText) {
  const ctxStr = [v.stage, v.subject, v.grade, v.semester].filter(Boolean).join("·");
  const gapStr = gaps.map((k) => FIELD_LABEL[k]).join("、");
  const onlyType = gaps.length === 1 && gaps[0] === "type";
  if (onlyType && v.topic) {
    return <span>已经识别到你要找的是 <b style={{ color: "var(--brand-deep)" }}>《{v.topic}》</b>{ctxStr ? <span>（{ctxStr}）</span> : null} —— 只差一步：你想要哪<b>一类资料</b>？课件、教案还是试卷？下面选一下就好。</span>;
  }
  if (ctxStr || v.type) {
    return <span>好的{v.type ? <span>，帮你找<b>{v.type}</b></span> : null}{ctxStr ? <span>（已识别 <b style={{ color: "var(--brand-deep)" }}>{ctxStr}</b>）</span> : null} —— 再补一下 <b style={{ color: "var(--brand-deep)" }}>{gapStr}</b>，我就能精准检索。</span>;
  }
  const wantWord = (rawText.match(/试卷|卷子|课件|教案|讲义|学案|练习|习题|真题|作业|资源/) || ["资源"])[0];
  return <span>好的，帮你找{wantWord} —— 先确认 <b style={{ color: "var(--brand-deep)" }}>{gapStr}</b>，免得给你一堆不相关的。下面选一下，也可以直接打字告诉我。</span>;
}
// 动态「信息补全」卡：已识别字段折叠成一行，下方只渲染缺失的最小必要字段；
// 选了资料类型后，按类型展开它特有的字段（备课类→年级/学期/主题；测练类→场景）。
function ClarifyPopover({ analysis, onResolve, onSkip }) {
  const init = (analysis && analysis.v) || { stage: null, subject: null, type: null, grade: null, semester: null, topic: null, scene: null };
  const [vals, setVals] = uS(init);
  const [edit, setEdit] = uS({}); // 已识别字段被点「改」→ 重新展开为可选
  const valsRef = uR(vals); valsRef.current = vals;
  const real = (x) => (x && x !== ANY) ? x : null;
  const set = (k, val) => setVals((s) => ({ ...s, [k]: val }));
  const openEdit = (k) => setEdit((e) => ({ ...e, [k]: true }));
  // 字段是否处于「待选」态：初始就缺，或被点击重新编辑
  const open = (k) => (init[k] == null) || !!edit[k];

  const isPrep = PREP_TYPES.includes(vals.type);
  const isAssess = ASSESS_TYPES.includes(vals.type);
  const filled = (k) => vals[k] != null; // ANY（不限）也算已选
  const ready = requiredKeys(vals.type).every(filled);

  uE(() => {
    const onKey = (e) => {
      const typing = /^(input|textarea)$/i.test((e.target && e.target.tagName) || "");
      if (e.key === "Escape") { onSkip && onSkip(); return; }
      if (typing) return;
      if (e.key === "Enter" && requiredKeys(valsRef.current.type).every((k) => valsRef.current[k] != null)) { e.preventDefault(); onResolve(valsRef.current); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [vals.type]);

  const lbl = { fontSize: 11, fontWeight: 800, color: "var(--ink-3)", marginBottom: 8, letterSpacing: ".3px", display: "flex", alignItems: "center", gap: 6 };
  const wrap = { display: "flex", flexWrap: "wrap", gap: 7 };
  const chip = (active) => ({ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, border: `1px solid ${active ? "var(--brand)" : "var(--line)"}`, background: active ? "var(--brand-soft)" : "var(--surface)", color: active ? "var(--brand-deep)" : "var(--ink-2)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", transition: "all .12s" });

  // 已识别（锁定）字段 → 顶部一行小标签，可点「改」
  const lockedKeys = ["stage", "subject", "grade", "semester", "type", "topic", "scene"].filter((k) => !open(k) && vals[k] != null);
  const lockLabel = (k) => k === "topic" ? (real(vals.topic) ? `《${vals.topic}》` : "不限主题") : (vals[k] === ANY ? (k === "scene" ? "不限场景" : "不限") : vals[k]);

  const chooser = (k) => {
    if (k === "stage") return <div style={wrap}>{CLARIFY_STAGES.map((s) => <button key={s} style={chip(vals.stage === s)} onClick={() => { setVals((v) => ({ ...v, stage: s, subject: v.subject && !CLARIFY_SUBJECTS_BY_STAGE[s].includes(v.subject) ? null : v.subject, grade: v.grade && !CLARIFY_GRADES_BY_STAGE[s].includes(v.grade) ? null : v.grade })); }}>{s}</button>)}</div>;
    if (k === "subject") return vals.stage ? <div style={wrap}>{CLARIFY_SUBJECTS_BY_STAGE[vals.stage].map((s) => <button key={s} style={chip(vals.subject === s)} onClick={() => set("subject", s)}>{s}</button>)}</div> : <div style={{ fontSize: 12, color: "var(--ink-4)", fontWeight: 600 }}>请先选择学段</div>;
    if (k === "type") return <div style={wrap}>{FIND_TYPES.map((s) => <button key={s} style={chip(vals.type === s)} onClick={() => set("type", s)}>{s}</button>)}</div>;
    if (k === "grade") return vals.stage ? <div style={wrap}>{CLARIFY_GRADES_BY_STAGE[vals.stage].map((s) => <button key={s} style={chip(vals.grade === s)} onClick={() => set("grade", s)}>{s}</button>)}</div> : <div style={{ fontSize: 12, color: "var(--ink-4)", fontWeight: 600 }}>请先选择学段</div>;
    if (k === "semester") return <div style={wrap}>{FIND_SEMESTERS.map((s) => <button key={s} style={chip(vals.semester === s)} onClick={() => set("semester", s)}>{s}</button>)}<button style={chip(vals.semester === ANY)} onClick={() => set("semester", ANY)}>不限</button></div>;
    if (k === "scene") return <div style={wrap}>{FIND_SCENES.map((s) => <button key={s} style={chip(vals.scene === s)} onClick={() => set("scene", s)}>{s}</button>)}<button style={chip(vals.scene === ANY)} onClick={() => set("scene", ANY)}>不限场景</button></div>;
    if (k === "topic") return (
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
        <input value={real(vals.topic) || ""} onChange={(e) => set("topic", e.target.value ? e.target.value : null)} placeholder="输入知识点或章节，如 有理数 / 第一单元" style={{ flex: 1, minWidth: 190, padding: "7px 11px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 12.5, fontFamily: "var(--font-zh)", outline: "none", color: "var(--ink)", background: "var(--surface)" }} />
        <button style={chip(vals.topic === ANY)} onClick={() => set("topic", ANY)}>暂不指定</button>
      </div>
    );
    return null;
  };

  // 待选字段，按依赖顺序；类型未定时不展开其下字段
  const order = ["stage", "subject", "type"];
  if (vals.type && isPrep) order.push("grade", "semester", "topic");
  if (vals.type && isAssess) order.push("scene");
  const bodyFields = order.filter((k) => open(k));
  const optional = (k) => k === "semester" || k === "topic" || k === "scene";
  const onlyFew = bodyFields.filter((k) => k !== "semester").length <= 1;
  const summary = ["stage", "subject", "grade", "semester", "type", "scene"].map((k) => real(vals[k])).filter(Boolean).concat(real(vals.topic) ? [`《${vals.topic}》`] : []).join(" · ");

  return (
    <div className="clarify-pop" style={{ margin: "0 14px 10px", borderRadius: 16, border: "1px solid var(--line)", background: "var(--surface)", boxShadow: "0 16px 40px -16px rgba(20,30,50,0.28), 0 2px 8px -4px rgba(20,30,50,0.12)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "13px 14px 10px" }}>
        <span style={{ width: 26, height: 26, borderRadius: 8, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0, marginTop: 1 }}><Icon name="spark" size={14} /></span>
        <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: "var(--ink)", lineHeight: 1.5 }}>{onlyFew ? <span>只差一步 —— 补齐后我就能为你精准检索</span> : <span>帮你补齐<b style={{ color: "var(--brand-deep)" }}>最小必要信息</b>，筛得更准</span>}</div>
        <button onClick={() => onSkip && onSkip()} title="跳过（Esc）" style={{ width: 24, height: 24, borderRadius: 7, border: "none", background: "transparent", color: "var(--ink-4)", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="close" size={15} /></button>
      </div>

      {lockedKeys.length > 0 && (
        <div style={{ padding: "0 14px 11px" }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: "var(--ink-4)", marginBottom: 7, letterSpacing: ".3px", display: "flex", alignItems: "center", gap: 5 }}><Icon name="check" size={12} sw={2.6} /> 已为你识别</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {lockedKeys.map((k) => (
              <button key={k} onClick={() => openEdit(k)} title={`修改${FIELD_LABEL[k]}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 9px 5px 10px", borderRadius: 999, border: "1px solid var(--brand-soft-border)", background: "var(--brand-soft)", color: "var(--brand-deep)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>
                <span style={{ fontSize: 9.5, fontWeight: 800, color: "var(--ink-4)" }}>{FIELD_LABEL[k]}</span>{lockLabel(k)}<span style={{ fontSize: 10, fontWeight: 700, color: "var(--ink-4)", borderLeft: "1px solid var(--brand-soft-border)", paddingLeft: 6 }}>改</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: "2px 14px 12px", display: "flex", flexDirection: "column", gap: 13 }}>
        {bodyFields.map((k) => (
          <div key={k}>
            <div style={lbl}>{FIELD_LABEL[k]}{optional(k) ? <span style={{ fontWeight: 600, color: "var(--ink-4)" }}>（可不限）</span> : <span style={{ fontWeight: 700, color: "var(--brand-deep)" }}>必选</span>}</div>
            {chooser(k)}
          </div>
        ))}
        {!vals.type && <div style={{ fontSize: 11.5, color: "var(--ink-4)", fontWeight: 600, marginTop: -4 }}>选好资料类型后，我会按类型继续补齐它需要的字段。</div>}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 14px", borderTop: "1px solid var(--line-2)", background: "var(--surface-2)" }}>
        <button onClick={() => onSkip && onSkip()} style={{ border: "none", background: "transparent", color: "var(--ink-3)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)" }}>请补齐必选项</button>
        <button
          disabled={!ready}
          onClick={() => onResolve(vals)}
          style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: ready ? "var(--brand)" : "var(--line)", color: ready ? "#fff" : "var(--ink-4)", fontSize: 13, fontWeight: 700, cursor: ready ? "pointer" : "default", fontFamily: "var(--font-zh)", display: "inline-flex", alignItems: "center", gap: 6, maxWidth: 320 }}
        >
          <CIcon name="search" size={14} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>确认</span>
        </button>
      </div>
    </div>
  );
}

function FindWorkspace({ scenario, query, onHome, onSwitch, fromIntent, resume, loggedIn, nav, onAddBasket, onOpenBasket, onOpenContent, basketCount = 0, basketItems }) {
  const ALL = window.AIDATA.RESOURCES;
  const isResume = !!resume;
  const initKind = detectKind(query);
  const topicMatch = query && (query.match(/《(.+?)》/) || [])[1];
  const initSubject = pickSubject(query) || ((loggedIn && initKind === "all") ? "数学" : null);
  const initGrade = pickGrade(query) || ((loggedIn && initKind === "all") ? "七年级" : null);

  const [preview, setPreview] = uS(null);
  const [player, setPlayer] = uS(null);
  const [album, setAlbum] = uS(null);
  const [toast, setToast] = uS(null);
  const [clarify, setClarify] = uS(null); // {forText} when the slide-up 追问 popover is open
  const mobile = useIsMobile();

  // accumulated understanding (subject/grade) so vague follow-ups still resolve.
  // subjectConfirmed = 学科已由记忆画像 / 用户输入 / 追问确认（非软默认）；决定是否还需追问。
  const ctxRef = uR({ subject: initSubject, grade: initGrade, subjectConfirmed: !!pickSubject(query) || !!(loggedIn && initSubject) });
  const skippedRef = uR(false); // 跳过补全后，同一会话内不再追问（除非用户带了新的明确信息）
  const findStored = window.ChatSession.scratch.find || {};
  const idRef = uR(findStored.nextId || 0);
  const sheetSeqRef = uR(0);
  const basketTitles = (basketItems || []).map((b) => b.title).filter(Boolean);
  // a clicked artifact chip reopens that round, even when arriving from another scenario
  const pendingA = window.ChatSession.pendingArtifact && window.ChatSession.pendingArtifact.scenario === "find" ? window.ChatSession.pendingArtifact : null;
  if (pendingA) window.ChatSession.pendingArtifact = null;

  // every query → a FROZEN round; rounds are appended, never overwritten —
  // and they SURVIVE scenario switches via the session scratch store
  const [rounds, setRounds] = uS(() => {
    const prev = findStored.rounds || [];
    if (isResume) return [...prev, buildRound(resume.title || query || "", idRef.current++, ctxRef.current, loggedIn, basketTitles)];
    if (query && !fromIntent) return [...prev, buildRound(query, idRef.current++, ctxRef.current, loggedIn, basketTitles)];
    return prev;
  });
  const [activeRound, setActiveRound] = uS(pendingA ? pendingA.id : null); // null → show the latest round
  const [retrieving, setRetrieving] = uS(false);
  const [sheetAnchor, setSheetAnchor] = uS(""); // "" so the first round doesn't auto-cover the chat on mobile
  // persist rounds so every round stays reopenable for the whole session
  uE(() => { window.ChatSession.scratch.find = { rounds, nextId: idRef.current }; }, [rounds]);

  // an AI reply that carries its round: result pill locally + artifact chip across scenarios
  const roundMsg = (round, node) => ({
    role: "ai",
    roundId: round.id,
    artifact: (() => { const a = { scenario: "find", id: round.id, icon: "search", title: `已匹配 ${round.count} 个资源`, meta: (round.query || "").slice(0, 18), _uid: "fd" + round.id }; window.__activeArtifactKey = "find:" + a._uid; window.dispatchEvent(new CustomEvent("artifact-select", { detail: "find:" + a._uid })); return a; })(),
    node: node || roundReplyNode(round),
  });

  // build & commit the first round after the cross-scenario intent animation
  const beginFirstRound = (text) => {
    setRetrieving(true);
    setTimeout(() => {
      const round = buildRound(text, idRef.current++, ctxRef.current, loggedIn, basketTitles);
      setRounds([...(findStored.rounds || []), round]);
      setRetrieving(false);
      setActiveRound(round.id);
      setMessages((m) => [...m, roundMsg(round)]);
      setSuggestions(roundSuggestions(round));
    }, 220);
  };

  const [messages, setMessages] = uS(() => {
    if (isResume) {
      const r0 = rounds[rounds.length - 1];
      return [roundMsg(r0, (<div>已恢复你 <b>{resume.when}</b> 关于「{(resume.title || "").replace(/[《》]/g, "")}」的检索，下面就是当时整理的结果，<b style={{ color: "var(--brand-deep)" }}>已收藏的资源</b>也都还在。继续筛选或换个方向都行。</div>))];
    }
    if (fromIntent && query) {
      return [
        ...window.ChatSession.take(),
        ...window.takeSwitchDivider(scenario, window.ChatSession.log.length > 0),
        ...(window.ChatSession.echoed(query) ? [] : [{ role: "user", text: query }]),
        { role: "ai", wide: true, intent: query, render: () => <InlineIntent query={query} onDone={() => beginFirstRound(query)} /> },
      ];
    }
    if (query) {
      return [
        ...window.ChatSession.take(),
        ...window.takeSwitchDivider(scenario, window.ChatSession.log.length > 0),
        ...(window.ChatSession.echoed(query) ? [] : [{ role: "user", text: query }]),
        roundMsg(rounds[rounds.length - 1]),
      ];
    }
    {
      const hist = window.ChatSession.take();
      if (hist.length) return window.enterThread(scenario);
    }
    return [{ role: "ai", node: (<div>老师你好，告诉我你要找什么，我会从<b style={{ color: "var(--auth-ink)" }}>学科网资源库</b>为你精准匹配。</div>) }];
  });
  const [suggestions, setSuggestions] = uS(rounds.length ? roundSuggestions(rounds[rounds.length - 1]) : []);
  // persist the thread so the assistant keeps the SAME conversation across scenario switches
  uE(() => { window.ChatSession.save(window.freezeChat(messages)); }, [messages]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  // open a (frozen) round in the result pane; also close any open resource detail
  // (preview / player / album) so the chat's result entries stay clickable on top of a drawer
  const openRound = (id) => { setPreview(null); setPlayer(null); setAlbum(null); setRetrieving(false); setActiveRound(id); setSheetAnchor("r" + id + "#" + (sheetSeqRef.current++)); };

  // commit a retrieval round (shared by typed sends and 追问 resolution)
  const doRetrieve = (text) => {
    setMessages((m) => [...m, { role: "ai", typing: true }]);
    setRetrieving(true);
    setActiveRound(null);
    setSuggestions([]);
    const id = idRef.current++;
    setTimeout(() => {
      const round = buildRound(text, id, ctxRef.current, loggedIn, basketTitles);
      setRounds((rs) => [...rs, round]);
      setRetrieving(false);
      setActiveRound(round.id);
      setSheetAnchor("r" + round.id + "#" + (sheetSeqRef.current++));
      setMessages((m) => [...m.slice(0, -1), roundMsg(round)]);
      setSuggestions(roundSuggestions(round));
    }, 850);
  };

  const handleSend = (text, files) => {
    setMessages((m) => [...m, { role: "user", text, files }]);
    // keep an open item if the message is about it; otherwise the pane follows the chat
    const aboutCurrent = /这个|这份|这节|这道|这段|这本|它|当前|上面|本视频|本资料|本节|刚才/.test(text || "");
    if (!aboutCurrent && (preview || player || album)) { setPreview(null); setPlayer(null); setAlbum(null); }
    // explicit generation request → hand off to the 出卷子 scenario
    if (text.includes("出卷") && !aboutCurrent) { onSwitch && onSwitch("paper", text); return; }
    // 把一句话的解析结果并入累积上下文（学科/学段/年级）
    const absorb = (v) => {
      if (v.subject) { ctxRef.current.subject = v.subject; ctxRef.current.subjectConfirmed = true; }
      if (v.grade) ctxRef.current.grade = v.grade;
      if (v.stage) ctxRef.current.stage = v.stage;
    };
    // 追问弹框开着时，用户在输入框打字 = 独立的新一轮（不合并）
    // 关闭当前弹框 → 重新分析新输入 → 如果仍不完整，再弹一次补全卡
    if (clarify) {
      setClarify(null);
      // 继续往下走正常的补全判断流程（不 return）
    }
    // 信息补全判断：仅对「文档类」找资源意图生效（视频/专辑形态另走分轨，不在此补全）。
    // 触发条件 = 这条消息从「文本明示」或「知识库推断」抽到了 学科/类型/主题/年级/场景 等新条件
    //（而非「难度再高一点」这类仅靠累积上下文的模糊跟进）。
    const analysis = analyzeFind(text, ctxRef.current);
    const fromText = ["stage", "subject", "type", "grade", "semester", "topic", "scene"].some((k) => analysis.src[k] === "text" || analysis.src[k] === "kb");
    if (!aboutCurrent && detectKind(text) === "all" && (fromText || isFindLike(text))) {
      // 跳过过一次后，仅靠上下文的模糊输入不再追问；带了新的明确信息则重新激活
      if (fromText) skippedRef.current = false;
      if (skippedRef.current) { absorb(analysis.v); doRetrieve(text); return; }
      const gaps = findGaps(analysis.v);
      if (gaps.length) {
        const intro = clarifyIntro(analysis.v, gaps, text);
        setMessages((m) => [...m, { role: "ai", typing: true }]);
        setTimeout(() => {
          setMessages((m) => [...m.slice(0, -1), { role: "ai", node: intro }]);
          setClarify({ forText: text, analysis });
        }, 600);
        return;
      }
    }
    // 信息已足够（或视频/专辑/模糊跟进）→ 吸收上下文，直接检索
    absorb(analysis.v);
    doRetrieve(text);
  };

  // 补全卡提交后：写入上下文（标记已确认）→ 在 AI 回复里补一张紧凑的「已答」摘要卡 → 继续检索
  const resolveClarify = (vals) => {
    const real = (x) => (x && x !== "__any__") ? x : null;
    if (real(vals.subject)) { ctxRef.current.subject = real(vals.subject); ctxRef.current.subjectConfirmed = true; }
    if (real(vals.grade)) ctxRef.current.grade = real(vals.grade);
    if (real(vals.stage)) ctxRef.current.stage = real(vals.stage);
    const forText = clarify ? clarify.forText : "";
    setClarify(null);
    const value = ["stage", "subject", "grade", "semester", "type", "scene"].map((k) => real(vals[k])).filter(Boolean).concat(real(vals.topic) ? [`《${real(vals.topic)}》`] : []).join(" · ");
    setMessages((m) => [...m, { role: "ai", answered: { q: "补齐资源信息", value } }]);
    doRetrieve(valsToQuery(vals) || forText);
  };

  // 追问弹框跳过 / 关闭：不带学科，先给一批混合结果（不空手）
  // 记住跳过状态，后续模糊输入不再弹补全卡（除非用户带了新的明确信息）
  const skipClarify = () => {
    const forText = clarify ? clarify.forText : "";
    setClarify(null);
    skippedRef.current = true;
    doRetrieve(forText);
  };

  const { headerRecognizing, send } = useSmartSend({ scenarioId: scenario.id, onSwitch, setMessages, localSend: handleSend });

  // ask the AI about a specific open item. The question is sent to the SAME left
  // conversation (no new session); a resource reference card is pinned above the
  // user bubble. Replies stay grounded in the item's real fields. C-class questions
  // (出同类卷子 / 生成教案) hand off to the matching generation scenario — right pane
  // switches, the left conversation continues.
  const askAbout = (q, item) => {
    const text = typeof q === "string" ? q : q.text;
    const cls = (typeof q === "object" && q.cls) || "A";
    const ref = { title: item.title, type: refLabel(item) };
    if (cls === "C") {
      const to = (typeof q === "object" && q.to) || "paper";
      // carry the originating resource into the target scenario so its seeded user
      // message shows a reference card — otherwise "据此…" loses its anchor on scroll
      window.ChatSession.handoffRef = { title: item.title, type: refLabel(item), item };
      // strip any existing 《》 from the title so we don't double-wrap (e.g. 据《《有理数》…》)
      const cleanTitle = (item.title || "").replace(/[《》]/g, "").slice(0, 16);
      // honor the question's own verb (同类练习 vs 同类卷子) so the target seeds the right form
      const verb = to === "lesson" ? "生成配套教案" : /练习/.test(text || "") ? "出一份同类练习" : "出一份同类卷子";
      onSwitch && onSwitch(to, `据《${cleanTitle}》${verb}`);
      return;
    }
    setMessages((m) => [...m, { role: "user", text, ref, refItem: item }, { role: "ai", typing: true }]);
    // 场景区保持不变：桌面端详情（预览/播放器/专辑）留在原位，回答只进入左侧对话区；
    // 也不 bump anchor（否则会退出全屏/展开面板）。移动端无双栏，仍关闭详情并提示对话。
    if (mobile) {
      setPreview(null); setPlayer(null); setAlbum(null);
      setSheetAnchor("ask#" + (sheetSeqRef.current++));
    }
    setTimeout(() => {
      setMessages((m) => [...m.slice(0, -1), { role: "ai", node: replyForResource(text, item) }]);
    }, 750);
  };

  // reopen a resource referenced from a chat message (reference card click)
  const openRef = (item) => {
    if (!item) return;
    if (item._kind === "video" || item.kind === "video" || item.cat || item.chapters) { setAlbum(null); setPreview(null); setPlayer(item); }
    else if (item._kind === "album" || item.composition) { setPlayer(null); setPreview(null); setAlbum(item); }
    else { setPlayer(null); setAlbum(null); setPreview(item); }
  };

  // returning from a 出卷子/教案 handoff via the reference card → reopen that resource here
  uE(() => {
    const po = window.ChatSession.pendingOpenResource;
    if (po) { window.ChatSession.pendingOpenResource = null; setTimeout(() => openRef(po), 0); }
  }, []);

  // album item helpers
  const previewItem = (it) => setPreview({ title: it.title, pages: it.pages || 12, qcount: it.q || 0, updated: album ? album.updated : "2025", type: it.type });
  const playItem = (it) => setPlayer({ title: it.title, cat: "微课", subject: album ? album.subject : "", grade: album ? album.grade : "", edition: album ? album.edition : "", duration: it.dur || "08:00", quality: "1080P", plays: "—", updated: album ? album.updated : "2025", chapters: [{ t: "00:00", name: "精讲开始" }, { t: "03:00", name: "重点解析" }, { t: "06:00", name: "小结" }] });

  const addBasket = (item) => {
    // PRD FE-20：未登录时收藏被拦截并引导登录
    if (!loggedIn) { nav && nav.onRequireLogin && nav.onRequireLogin(); return; }
    const ok = onAddBasket ? onAddBasket(item) : true;
    showToast(ok ? "已加入资源篮" : "已在资源篮中");
  };

  // PRD §3.2：找资源的登录时机是「操作触发」—— 点击下载时拦截引导登录
  const guardDownload = (msg) => {
    if (!loggedIn) { nav && nav.onRequireLogin && nav.onRequireLogin(); return; }
    showToast(msg);
  };

  // which round is shown on the right (explicit selection, else the latest)
  const roundsById = {}; rounds.forEach((r) => { roundsById[r.id] = r; });
  const shownRound = (activeRound != null ? roundsById[activeRound] : null) || (rounds.length ? rounds[rounds.length - 1] : null);
  const shownId = shownRound ? shownRound.id : null;

  // mobile: which thing the sheet should reveal (open item overrides the round anchor).
  // 桌面端只传检索轮次锚点 —— 打开/关闭详情不得触发 shell 的「新内容展开 + 退出全屏」逻辑（全屏下关详情应保持全屏）
  const sheetKey = mobile
    ? (preview ? "p:" + preview.title : player ? "v:" + player.title : album ? "a:" + (album.id || album.title) : sheetAnchor)
    : sheetAnchor;

  const renderItem = (it, idx) => {
    const key = it._kind + "_" + (it.id || it.title) + "_" + idx;
    if (it._kind === "video") return <VideoCard key={key} v={it} source={it._source} onPlay={() => setPlayer(it)} onDownload={() => guardDownload(`已开始下载《${(it.title || "").slice(0, 12)}…》`)} />;
    if (it._kind === "album") return <AlbumCard key={key} a={it} source={it._source} onOpen={() => setAlbum(it)} />;
    return <ResourceCard key={key} r={it} source={it._source} onPreview={() => setPreview(it)} onDownload={() => guardDownload(`已开始下载《${(it.title || "").slice(0, 12)}…》`)} />;
  };

  const items = shownRound ? shownRound.items.filter((x) => x._kind !== "video" && x._kind !== "album") : [];
  const presentSources = ["我的内容", "资源篮", "学科网"].filter((s) => items.some((x) => x._source === s));
  const resultBody = items.length
    ? <React.Fragment>{items.map(renderItem)}<HandoffBar topic={shownRound.subject || ""} onSwitch={onSwitch} query={shownRound.query} /></React.Fragment>
    : <NotFound topic={shownRound ? (shownRound.subject || "") : ""} onSwitch={onSwitch} query={shownRound ? shownRound.query : query} />;

  const hdrBtn = { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", flexShrink: 0 };

  return (
    <WorkspaceShell scenario={scenario} onHome={onHome} onSwitch={onSwitch} nav={nav} headerRecognizing={headerRecognizing} mobilePanelLabel="资源" mobilePanelIcon="search" openSheetKey={sheetKey}>
      <ChatPanel messages={messages} onSend={send} suggestions={suggestions} placeholder="例如：只看实验视频 / 整套打包下载" roundsById={roundsById} shownId={shownId} retrieving={retrieving} onOpenRound={openRound} onOpenRef={openRef} clarify={clarify} onResolveClarify={resolveClarify} onSkipClarify={skipClarify} taskBar={(() => { const t = deriveSessionTask(scenario && scenario.id); return t ? <SessionTaskBar task={t} onOpen={() => onSwitch && onSwitch(t.scenario, "")} /> : null; })()} />
      {/* results */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", position: "relative" }}>
        {!rounds.length && !retrieving && <FindColdStart loggedIn={!resume && loggedIn} onPick={(q) => handleSend(q)} onLogin={() => nav && nav.onRequireLogin && nav.onRequireLogin()} />}
        {retrieving && <RetrievingPanel />}
        {!retrieving && shownRound && (
          <React.Fragment>
            <div style={{ padding: mobile ? "11px 16px" : "13px 22px", borderBottom: "1px solid var(--line)", background: "var(--surface)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", rowGap: 7 }}>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>以下是为你匹配的资源</span>
              <span style={{ fontSize: 11.5, fontWeight: 800, fontFamily: "var(--font-num)", padding: "1px 8px", borderRadius: 999, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", color: "var(--brand-deep)" }}>{items.length} 项</span>
              <div style={{ flex: 1 }} />
              {presentSources.length > 0 && null}
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: mobile ? "11px 16px 20px" : "14px 22px 24px", display: "flex", flexDirection: "column", gap: mobile ? 9 : 12 }}>
              {resultBody}
            </div>
          </React.Fragment>
        )}

        {album && <AlbumPage a={album} loggedIn={loggedIn} onAsk={askAbout} onClose={() => setAlbum(null)} onPreviewItem={previewItem} onPlayItem={playItem} onDownload={(msg) => guardDownload(msg)} onAddBasket={addBasket} />}
        {preview && <PreviewDrawer r={preview} loggedIn={loggedIn} onClose={() => setPreview(null)} onAsk={askAbout} onAddBasket={addBasket} onDownload={() => guardDownload("已开始下载，可在「资源篮」查看")} />}
        {player && <VideoPlayer v={player} loggedIn={loggedIn} onClose={() => setPlayer(null)} onAsk={askAbout} onAddBasket={addBasket} onDownload={() => guardDownload(`已开始下载视频《${player.title.slice(0, 12)}…》`)} />}
        {toast && (
          <div className="enter-pop" style={{ position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)", background: "var(--ink)", color: "var(--surface)", padding: "11px 18px", borderRadius: 12, fontSize: 13.5, fontWeight: 600, boxShadow: "0 12px 30px -12px rgba(0,0,0,.5)", display: "inline-flex", alignItems: "center", gap: 8, zIndex: 60 }}>
            <Icon name="check" size={16} sw={2.6} /> {toast}
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}

function HandoffBar({ topic, onSwitch, query }) {
  return (
    <div style={{ marginTop: 4, padding: 16, borderRadius: 16, border: "1px dashed var(--brand-soft-border)", background: "var(--brand-soft)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Icon name="sparkArrow" size={17} />
        <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--brand-deep)" }}>没找到完全合适的？把需求说得更具体些我再帮你精准筛选 —— 或让小博士基于学科网资源库直接生成</span>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {HANDOFF.map((h) => (
          <button
            key={h.id}
            onClick={() => onSwitch && onSwitch(h.id, query || `基于「${topic}」`)}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", cursor: "pointer", fontFamily: "var(--font-zh)", transition: "transform .15s, border-color .2s" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = `oklch(0.78 0.09 ${h.hue})`; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--line)"; }}
          >
            <ScenarioGlyph icon={h.icon} hue={h.hue} size={34} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{h.label}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 1 }}>{h.hint}</div>
            </div>
            <Icon name="arrow" size={16} />
          </button>
        ))}
      </div>
    </div>
  );
}

// cold-start panel: shown when teacher entered 找资源 without any input
function FindColdStart({ onPick, loggedIn, onLogin }) {
  const M = window.AIDATA.USER_MEMORY;
  const mobile = useIsMobile();
  const memExamples = [];
  const genExamples = [];
  const memHot = ["有理数 易错题", "整式的加减 课件", "七年级数学 期中卷"];
  const genHot = ["平行四边形的判定 教学设计", "热力环流 复习课件", "2025 昆明中考化学卷", "凸透镜成像 实验视频"];

  const examples = loggedIn ? memExamples : genExamples;
  const hot = loggedIn ? memHot : genHot;

  return (
    <div style={{ flex: 1, overflowY: "auto", display: "grid", placeItems: "center", padding: "30px 24px" }}>
      <div className="home-fade" style={{ width: "min(540px, 100%)" }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ display: "inline-flex", marginBottom: 12 }}><ScenarioGlyph icon="search" hue={150} size={52} active /></div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", margin: "0 0 7px" }}>想找点什么教学资源？</h2>
          <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: 0, lineHeight: 1.6 }}>在左侧用一句话描述你要查找的资源，包括但不限于<b style={{ color: "var(--brand-deep)" }}>试卷、教案、课件、作业</b>等</p>
        </div>

        {/* login prompt removed for v1 */}

        {/* example search cards */}
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-3)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="search" size={14} /> 试试这样问
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {(loggedIn ? [
            "人教版七年级上《有理数》同步练习",
            "七年级数学《整式的加减》易错题专项",
            "《一元一次方程》单元测试卷 含答案",
          ] : [
            "北师大版八下 平行四边形的判定 教学设计",
            "2025年云南昆明 中考化学试卷",
            "凸透镜成像规律 实验视频",
            "高三数学 函数与导数 一轮复习",
          ]).map((it, i) => (
            <button key={i} onClick={() => onPick(it)} style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left", padding: "12px 14px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", fontSize: 13, fontWeight: 600, lineHeight: 1.5, cursor: "pointer", fontFamily: "var(--font-zh)", transition: "all .15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px -6px rgba(0,0,0,.15)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
              <Icon name="search" size={14} />
              <span style={{ flex: 1 }}>{it}</span>
              <Icon name="arrow" size={13} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotFound({ topic, onSwitch, query }) {
  return (
    <div style={{ textAlign: "center", padding: "30px 20px 10px" }}>
      <div style={{ display: "inline-flex", marginBottom: 12, color: "var(--line)" }}>
        <CIcon name="search" size={44} sw={1.4} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", marginBottom: 6 }}>当前条件下暂无现成资源完全匹配</div>
      <div style={{ fontSize: 13.5, color: "var(--ink-3)", marginBottom: 22, lineHeight: 1.6 }}>
        先把需求说得更具体些（学段、版本、知识点、难度…），我再帮你精准筛一批；或者 —— 让小博士基于学科网资源库<b style={{ color: "var(--brand-deep)" }}>直接为你生成</b>
      </div>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <HandoffBar topic={topic} onSwitch={onSwitch} query={query} />
      </div>
    </div>
  );
}

function ResourceCard({ r, onPreview, onDownload, source }) {
  return (
    <div
      className="res-card"
      style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 13, transition: "box-shadow .2s, border-color .2s", cursor: "pointer", display: "flex", gap: 13, alignItems: "center" }}
      onClick={onPreview}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 10px 24px -18px rgba(0,0,0,.3)"; e.currentTarget.style.borderColor = "var(--brand-soft-border)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "var(--line)"; }}
    >
      <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 12, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center" }}>
        <CIcon name={/课件/.test(r.type) ? "slides" : /教案|讲义|学案|学历/.test(r.type) ? "doc" : /试卷|卷|练习|习题|真题|作业|检测|训练/.test(r.type) ? "paper" : "search"} size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 7 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: "var(--ink-3)", flexWrap: "wrap", rowGap: 5 }}>
          <span style={{ padding: "1.5px 8px", borderRadius: 6, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", color: "var(--brand-deep)", fontWeight: 800, whiteSpace: "nowrap" }}>{r.type}</span>
          <span style={{ fontWeight: 700, color: "var(--ink-2)", whiteSpace: "nowrap" }}>{r.edition} · {r.grade}{r.subject}</span>
          {(r.chips || []).slice(0, 4).map((c, i) => <span key={i} style={{ padding: "1.5px 7px", borderRadius: 6, background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--ink-3)", fontWeight: 600, whiteSpace: "nowrap" }}>{c}</span>)}
          {(r.qcount > 0 || r.pages) && <span style={{ whiteSpace: "nowrap" }}>{r.qcount > 0 ? `${r.qcount}题` : ""}{r.qcount > 0 && r.pages ? " · " : ""}{r.pages ? `${r.pages}页` : ""}</span>}
        </div>
      </div>
      <Icon name="chevronRight" size={18} />
    </div>
  );
}

function PreviewDrawer({ r, onClose, onDownload, onAsk, onAddBasket, loggedIn }) {
  return (
    <div className="drawer-pop" style={{ position: "absolute", inset: 0, zIndex: 25, background: "var(--canvas)", display: "flex", flexDirection: "column" }}>
      {/* header */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)", background: "var(--surface)", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <button onClick={onClose} title="返回结果" style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}>
          <Icon name="back" size={16} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)", lineHeight: 1.4 }}>{r.title}</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 3 }}>{r.pages} 页 · {r.qcount > 0 ? `${r.qcount} 题` : "课件"} · 更新 {r.updated}</div>
        </div>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}>
          <Icon name="close" size={16} sw={2.4} />
        </button>
      </div>
      {/* pages preview */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
        {[0, 1].map((p) => (
          <div key={p} style={{ width: "100%", maxWidth: 460, background: "#fff", borderRadius: 8, boxShadow: "0 6px 20px -12px rgba(0,0,0,.3)", border: "1px solid var(--line)", padding: "26px 28px", aspectRatio: "1 / 1.414" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#1a1a1a", textAlign: "center", marginBottom: 4 }}>{r.title}</div>
            <div style={{ fontSize: 10.5, color: "#888", textAlign: "center", marginBottom: 18 }}>学科网 · 精品资源 · 第 {p + 1} 页</div>
            {[...Array(6)].map((_, k) => (
              <div key={k} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#333", marginBottom: 6 }}>{p * 6 + k + 1}. 题目内容预览</div>
                <div style={{ height: 7, background: "#eee", borderRadius: 3, marginBottom: 5, width: "92%" }} />
                <div style={{ height: 7, background: "#eee", borderRadius: 3, width: `${60 + ((k * 13) % 35)}%` }} />
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* bottom: keep-collaborating asks (sticky, thumb-reachable) + actions */}
      <div style={{ flexShrink: 0, borderTop: "1px solid var(--line)", background: "var(--surface)" }}>
        <AskBar item={r} loggedIn={loggedIn} onAsk={onAsk} />
        <div style={{ padding: 14, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", rowGap: 10, justifyContent: "flex-end" }}>
          <Btn kind="soft" icon="basket" onClick={() => onAddBasket && onAddBasket(r)}>加入资源篮</Btn>
          <Btn kind="primary" icon="download" onClick={onDownload}>下载文档</Btn>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { FindWorkspace, WorkspaceShell, ChatPanel, Bubble, RecognizingPanel, SourceTag, AskBar, buildResourceAsks, ScenePills, StageScenarioLabel });


// ======== workspace_courseware.jsx ========
// workspace_courseware.jsx — 做课件 (PRD §3)
// 三态流程：初始态 → 大纲态 → 内容态 → 跳模板选择页(旧版)
const { useState: cwS, useRef: cwR, useEffect: cwE } = React;

// ---- 教材常量（与写教案共用结构）----
const CW_STAGES = ["小学", "初中", "高中"];
const CW_SUBJECTS = ["语文", "数学", "英语", "物理", "化学", "生物", "历史", "地理", "道德与法治", "科学"];
const CW_EDITIONS = ["人教版", "统编版", "北师大版", "苏教版", "外研版", "沪教版"];
function cwBooks(stage) {
  if (stage === "高中") return ["必修上册", "必修下册", "选择性必修上", "选择性必修下"];
  if (stage === "小学") return ["三年级上册", "三年级下册", "四年级上册", "四年级下册", "五年级上册", "六年级上册"];
  return ["七年级上册", "七年级下册", "八年级上册", "八年级下册", "九年级上册", "九年级下册"];
}
function cwGrade(tb) {
  if (tb.stage === "高中") return "高一";
  const m = (tb.book || "").match(/^(.+?年级)/);
  return m ? m[1] : "七年级";
}
function cwLabel(tb) { return `${tb.edition} · ${tb.subject} · ${tb.book}`; }
const CW_CATALOG = {
  "数学|七年级上册": [
    { ch: "第一章 有理数", secs: ["正数和负数", "有理数", "有理数的加减法", "有理数的乘除法", "有理数的乘方"] },
    { ch: "第二章 整式的加减", secs: ["整式", "整式的加减"] },
    { ch: "第三章 一元一次方程", secs: ["从算式到方程", "解一元一次方程", "实际问题与一元一次方程"] },
  ],
  "语文|七年级上册": [
    { ch: "第一单元", secs: ["春", "济南的冬天", "雨的四季", "古代诗歌四首"] },
    { ch: "第二单元", secs: ["秋天的怀念", "散步", "散文诗二首", "《世说新语》二则"] },
  ],
  "数学|八年级下册": [
    { ch: "第十六章 二次根式", secs: ["二次根式", "二次根式的乘除", "二次根式的加减"] },
    { ch: "第十七章 勾股定理", secs: ["勾股定理", "勾股定理的逆定理"] },
    { ch: "第十八章 平行四边形", secs: ["平行四边形", "特殊的平行四边形"] },
  ],
  "物理|九年级上册": [
    { ch: "第十三章 内能", secs: ["分子热运动", "内能", "比热容"] },
    { ch: "第十五章 电流和电路", secs: ["两种电荷", "电流和电路", "串联和并联"] },
  ],
};
function cwCatalog(tb) {
  return CW_CATALOG[`${tb.subject}|${tb.book}`] || [
    { ch: "第一单元", secs: ["第 1 节", "第 2 节", "第 3 节"] },
    { ch: "第二单元", secs: ["第 1 节", "第 2 节", "第 3 节"] },
  ];
}

// ---- 大纲模板 ----
let cwUid = 1;
const cwNode = (name, hint, children) => ({ id: "cw" + cwUid++, name, hint: hint || "", children: children || [] });
function cwDefaultOutline(topic) {
  cwUid = 1;
  return [
    cwNode("学习目标", "本节课的核心学习目标"),
    cwNode("课堂导入", "贴近生活的问题情境"),
    cwNode("探究新知", "核心知识讲解与探究活动", [
      cwNode("概念与原理", "新知识的引入与理解"),
      cwNode("例题精讲", "典型例题分析"),
    ]),
    cwNode("课堂总结", "知识框架回顾"),
  ];
}
const CW_EXTRAS = ["课堂练习", "分层作业", "课堂互动", "拓展延伸"];

// ---- 内容生成 ----
function cwBodyFor(name, topic) {
  if (/学习目标/.test(name)) return { list: [
    `理解${topic}的核心概念，能准确表述并在典型情境中正确运用。`,
    `经历观察、猜想、验证、归纳的探究过程，体会基本思想方法。`,
    `感受知识与现实生活的联系，激发学习兴趣与求知欲。`,
  ] };
  if (/课堂导入|情境/.test(name)) return { paras: [
    `【情境引入】呈现与「${topic}」相关的生活情境，通过一个贴近学生日常的具体问题引入，引发认知冲突。`,
    `引导学生观察现象、提出核心问题，自然过渡到新知学习。`,
  ] };
  if (/探究新知/.test(name)) return { paras: [
    `围绕「${topic}」设计递进式问题串，组织学生开展观察、操作与讨论。`,
    `学生在活动中记录发现，尝试归纳结论，教师适时追问深化理解。`,
  ] };
  if (/概念/.test(name)) return { paras: [
    `引出${topic}的核心概念，结合直观素材帮助学生建立初步理解。`,
    `通过正反例对比辨析，明确概念的内涵、外延与适用条件。`,
  ] };
  if (/例题/.test(name)) return { list: [
    `例 1：围绕${topic}的基础题，考查概念的直接运用，给出规范解答步骤。`,
    `例 2：变式题，在新情境中迁移运用，标注易错点与关键步骤。`,
  ] };
  if (/课堂总结/.test(name)) return { paras: [
    `从知识、方法、感受三方面引导学生回顾本节课内容。`,
    `用知识结构图把「${topic}」的核心要点串联起来，指出与下节课的联系。`,
  ] };
  if (/课堂练习/.test(name)) return { list: [
    `基础题 2 道：直接运用本课核心结论，检验概念理解。`,
    `变式题 2 道：在新情境中检测灵活迁移能力，含简要解析。`,
  ] };
  if (/分层/.test(name)) return { list: [
    `A 层 · 基础：课后习题 1–3 题，巩固核心结论，面向全体学生。`,
    `B 层 · 提升：变式练习 2 道，要求写出完整思考过程。`,
    `C 层 · 拓展：找一个${topic}的实际应用例子，写一段说明。`,
  ] };
  if (/互动/.test(name)) return { paras: [
    `设计一个可课堂操作的互动环节：随堂抢答 / 小组展示 / 连线配对。`,
    `互动结束后教师点评并归纳，强化本课核心要点。`,
  ] };
  return { paras: [`${name}——本部分内容将根据教材与课标要求展开，可在右侧直接编辑。`] };
}

function cwBuildDoc(outline, meta) {
  return outline.map((m) => ({
    ...m, body: cwBodyFor(m.name, meta.topic),
    children: (m.children || []).map((c) => ({ ...c, body: cwBodyFor(c.name, meta.topic) })),
  }));
}

// ---- 解析 ----
function parseCwQuery(q) {
  const t = q || "";
  const edition = (t.match(/(人教版|北师大版|部编版|苏教版|外研社|统编版)/) || [])[1] || null;
  const grade = (t.match(/(高[一二三]|[一二三四五六七八九]年级|[七八九][上下]册?)/) || [])[0] || null;
  const subject = (t.match(/(数学|语文|英语|物理|化学|生物|历史|地理|道德与法治|科学)/) || [])[1] || null;
  let topic = (t.match(/《([^》]+)》/) || [])[1];
  if (!topic) {
    topic = t.replace(/(帮我|请|给我|做个?|生成|出个?)/g, "").replace(/(人教版|北师大版|部编版|苏教版|外研社|统编版)/g, "")
      .replace(/(高[一二三]|[一二三四五六七八九]年级|[七八九][上下]册?)/g, "").replace(/(数学|语文|英语|物理|化学|生物|历史|地理|道德与法治|科学)/g, "")
      .replace(/(的)?(课件|PPT|ppt)/gi, "").trim().replace(/^[,，、·\s]+|[,，、·\s]+$/g, "");
  }
  return { topic: topic || "本节课", edition, grade, subject };
}
function cwMeta(q, loggedIn) {
  const p = parseCwQuery(q);
  return { topic: p.topic, edition: p.edition || (loggedIn ? "人教版" : ""), grade: p.grade || (loggedIn ? "七年级" : ""), subject: p.subject || (loggedIn ? "数学" : "") };
}

// ---- 初始态 ----
function CwInitPage({ onPickTextbook, onExample, mobile }) {
  const cold = ["人教版七年级上《有理数》课件", "统编版语文七上《春》课件", "外研版英语必修二 Unit3 早读课件"];
  return (
    <div className="home-fade" style={{ height: "100%", display: "grid", placeItems: "center", padding: mobile ? 16 : 24 }}>
      <div style={{ width: "min(540px,100%)", textAlign: "center" }}>
        <div style={{ display: "inline-flex", marginBottom: 14 }}><ScenarioGlyph icon="slides" hue={255} size={52} active /></div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", margin: "0 0 6px" }}>来做课件吧</h2>
        <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "0 0 22px", lineHeight: 1.6 }}>在左侧告诉我课题或描述做课件的需求，也可以直接选择教材章节</p>
        <button onClick={onPickTextbook} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", borderRadius: 13, border: "1px solid var(--brand-soft-border)", background: "var(--brand-soft)", color: "var(--brand-deep)", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", marginBottom: 22, transition: "all .15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--brand)"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--brand-soft)"; e.currentTarget.style.color = "var(--brand-deep)"; }}>
          <CIcon name="book" size={16} /> 选教材章节
        </button>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-3)", marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="spark" size={14} /> 试试这样问
          </div>
          {cold.map((c, i) => (
            <button key={i} onClick={() => onExample(c)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 15px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", cursor: "pointer", fontFamily: "var(--font-zh)", textAlign: "left", transition: "all .15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.transform = "none"; }}>
              <Icon name="spark" size={15} />
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{c}</span>
              <Icon name="arrow" size={14} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- 大纲态 ----
function CwOutlinePanel({ meta, outline, setOutline, extras, onConfirm, mobile }) {
  const rename = (id, v) => setOutline((o) => o.map((x) => x.id === id ? { ...x, name: v } : { ...x, children: (x.children || []).map((c) => c.id === id ? { ...c, name: v } : c) }));
  const remove = (id) => setOutline((o) => {
    const top = o.filter((x) => x.id !== id).map((x) => ({ ...x, children: (x.children || []).filter((c) => c.id !== id) }));
    return top;
  });
  const move = (id, dir) => setOutline((o) => {
    const i = o.findIndex((x) => x.id === id);
    if (i < 0) return o;
    const j = i + dir;
    if (j < 0 || j >= o.length) return o;
    const n = o.slice(); const tmp = n[i]; n[i] = n[j]; n[j] = tmp; return n;
  });
  const toggleFold = (id) => setOutline((o) => o.map((x) => x.id === id ? { ...x, folded: !x.folded } : x));
  const add = (name) => setOutline((o) => [...o, { id: "cw" + Date.now().toString(36), name, hint: "", children: [] }]);
  const usedNames = outline.map((x) => x.name);
  const availExtras = extras.filter((e) => !usedNames.includes(e));
  const canConfirm = outline.length > 0;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: mobile ? "16px 14px" : "26px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 18 }}>
        <span style={{ width: 38, height: 38, borderRadius: 11, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}><CIcon name="slides" size={18} /></span>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "var(--ink)" }}>《{meta.topic}》课件大纲</h2>
          <div style={{ display: "flex", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
            {[meta.edition, meta.subject, meta.grade].filter(Boolean).map((c, i) => (
              <span key={i} style={{ padding: "2px 8px", borderRadius: 999, background: "var(--surface-2)", border: "1px solid var(--line)", fontSize: 11, fontWeight: 700, color: "var(--ink-2)" }}>{c}</span>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {outline.map((o, i) => (
          <div key={o.id}>
            <div className="block-pop" style={{ animationDelay: `${i * 0.04}s`, display: "flex", alignItems: "center", gap: 10, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: "11px 13px" }}>
              <span style={{ color: "var(--ink-3)", cursor: "grab", flexShrink: 0, display: "grid", placeItems: "center" }}><Icon name="grip" size={14} /></span>
              {o.children && o.children.length > 0 && (
                <button onClick={() => toggleFold(o.id)} style={{ width: 20, height: 20, borderRadius: 6, border: "1px solid var(--line)", background: "var(--surface-2)", color: "var(--ink-3)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0, transform: o.folded ? "rotate(-90deg)" : "none", transition: "transform .15s" }}><Icon name="chevron" size={12} /></button>
              )}
              <input value={o.name} onChange={(e) => rename(o.id, e.target.value)} spellCheck={false} style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 14, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-zh)", padding: 0, minWidth: 0 }} />
              <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                <button onClick={() => move(o.id, -1)} disabled={i === 0} style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid var(--line)", background: "var(--surface)", color: i === 0 ? "var(--line)" : "var(--ink-3)", display: "grid", placeItems: "center", cursor: i === 0 ? "default" : "pointer" }}><span style={{ display: "inline-flex", transform: "rotate(180deg)" }}><Icon name="chevron" size={12} /></span></button>
                <button onClick={() => move(o.id, 1)} disabled={i === outline.length - 1} style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid var(--line)", background: "var(--surface)", color: i === outline.length - 1 ? "var(--line)" : "var(--ink-3)", display: "grid", placeItems: "center", cursor: i === outline.length - 1 ? "default" : "pointer" }}><Icon name="chevron" size={12} /></button>
                <button onClick={() => remove(o.id)} style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-3)", display: "grid", placeItems: "center", cursor: "pointer" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "oklch(0.55 0.18 25)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ink-3)"; }}><Icon name="close" size={13} sw={2.4} /></button>
              </div>
            </div>
            {!o.folded && o.children && o.children.length > 0 && (
              <div style={{ paddingLeft: 36, display: "flex", flexDirection: "column", gap: 5, marginTop: 5 }}>
                {o.children.map((c) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--line)" }}>
                    <span style={{ color: "var(--ink-3)", fontSize: 12 }}>·</span>
                    <input value={c.name} onChange={(e) => rename(c.id, e.target.value)} spellCheck={false} style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13, fontWeight: 600, color: "var(--ink-2)", fontFamily: "var(--font-zh)", padding: 0, minWidth: 0 }} />
                    <button onClick={() => remove(c.id)} style={{ width: 22, height: 22, borderRadius: 6, border: "none", background: "transparent", color: "var(--ink-3)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}><Icon name="close" size={11} sw={2.4} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {availExtras.length > 0 && (
        <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, border: "1px dashed var(--line)", background: "var(--surface)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-3)", marginBottom: 8 }}>添加模块</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {availExtras.map((e) => (
              <button key={e} onClick={() => add(e)} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 999, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)" }}
                onMouseEnter={(ev) => { ev.currentTarget.style.borderColor = "var(--brand)"; ev.currentTarget.style.color = "var(--brand-deep)"; }}
                onMouseLeave={(ev) => { ev.currentTarget.style.borderColor = "var(--line)"; ev.currentTarget.style.color = "var(--ink-2)"; }}>
                <Icon name="plus" size={12} /> {e}
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={{ marginTop: 22, display: "flex", justifyContent: "center" }}>
        <button onClick={onConfirm} disabled={!canConfirm} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", borderRadius: 13, border: "none", background: canConfirm ? "var(--brand-grad)" : "var(--line)", backgroundColor: canConfirm ? "var(--brand)" : "var(--line)", color: canConfirm ? "#fff" : "var(--ink-3)", fontSize: 14.5, fontWeight: 800, cursor: canConfirm ? "pointer" : "default", fontFamily: "var(--font-zh)", boxShadow: canConfirm ? "0 10px 26px -12px var(--brand-glow)" : "none" }}>
          <Icon name="spark" size={16} /> 生成课件内容
        </button>
      </div>
      {!canConfirm && <div style={{ textAlign: "center", fontSize: 11.5, color: "var(--ink-3)", marginTop: 7 }}>至少保留一个模块</div>}
    </div>
  );
}

// ---- 内容态 ----
function CwContentSection({ sec, idx }) {
  const body = sec.body;
  return (
    <section className="block-pop" style={{ animationDelay: `${idx * 0.08}s` }}>
      <h3 style={{ display: "flex", alignItems: "center", gap: 9, margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>
        <span style={{ width: 22, height: 22, borderRadius: 7, background: "var(--brand-grad)", backgroundColor: "var(--brand)", color: "#fff", fontSize: 11.5, fontWeight: 800, display: "grid", placeItems: "center", fontFamily: "var(--font-num)", flexShrink: 0 }}>{idx + 1}</span>
        {sec.name}
      </h3>
      {body && body.paras && body.paras.map((p, i) => (
        <p key={i} contentEditable suppressContentEditableWarning style={{ margin: "0 0 6px", fontSize: 13.5, lineHeight: 1.85, color: "var(--ink)", outline: "none" }}>{p}</p>
      ))}
      {body && body.list && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {body.list.map((it, i) => (
            <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
              <span style={{ flexShrink: 0, width: 18, height: 18, borderRadius: 6, background: "var(--brand-soft)", color: "var(--brand-deep)", fontSize: 10.5, fontWeight: 800, display: "grid", placeItems: "center", fontFamily: "var(--font-num)", marginTop: 2 }}>{i + 1}</span>
              <p contentEditable suppressContentEditableWarning style={{ margin: 0, flex: 1, fontSize: 13.5, lineHeight: 1.75, color: "var(--ink)", outline: "none" }}>{it}</p>
            </div>
          ))}
        </div>
      )}
      {sec.children && sec.children.length > 0 && (
        <div style={{ marginTop: 14, paddingLeft: 12, borderLeft: "3px solid var(--brand-soft-border)", display: "flex", flexDirection: "column", gap: 14 }}>
          {sec.children.map((c, ci) => <CwContentSection key={c.id} sec={c} idx={ci} />)}
        </div>
      )}
    </section>
  );
}

function CwContentView({ doc, meta, genProgress, onFinish, mobile }) {
  const allDone = genProgress >= doc.length;
  const scrollRef = cwR(null);
  const scrollTo = (idx) => {
    const el = scrollRef.current;
    if (!el) return;
    const targets = el.querySelectorAll("section");
    if (targets[idx]) targets[idx].scrollIntoView ? null : null; // avoid scrollIntoView per rules
  };
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: mobile ? "column" : "row" }}>
      {/* 浮动目录 */}
      <div style={{ width: mobile ? "100%" : 180, flexShrink: 0, borderRight: mobile ? "none" : "1px solid var(--line)", borderBottom: mobile ? "1px solid var(--line)" : "none", background: "var(--surface)", overflowY: "auto", padding: 10 }}>
        <div style={{ fontSize: 11.5, fontWeight: 800, color: "var(--ink-3)", padding: "6px 8px 10px" }}>目录</div>
        {doc.map((m, i) => {
          const done = i < genProgress;
          const active = i === genProgress && !allDone;
          const pending = i > genProgress && !allDone;
          return (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 9, marginBottom: 3, background: active ? "var(--brand-soft)" : "transparent", cursor: "pointer" }}>
              {done ? <span style={{ width: 16, height: 16, borderRadius: "50%", background: "var(--brand)", color: "#fff", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="check" size={10} sw={2.8} /></span>
                : active ? <span className="mini-spin" style={{ width: 14, height: 14, flexShrink: 0 }} />
                : <span style={{ width: 14, height: 14, borderRadius: "50%", border: "1.5px solid var(--line)", flexShrink: 0 }} />}
              <span style={{ fontSize: 12.5, fontWeight: done || active ? 700 : 600, color: pending ? "var(--ink-3)" : "var(--ink-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</span>
            </div>
          );
        })}
      </div>
      {/* 正文 */}
      <div ref={scrollRef} style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: mobile ? "16px 14px" : "26px clamp(18px,4%,48px)" }}>
        <article style={{ maxWidth: 760, margin: "0 auto", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "var(--shadow-card, 0 10px 30px -18px rgba(30,40,60,.18))", padding: mobile ? "20px 16px" : "30px 38px" }}>
          <header style={{ textAlign: "center", marginBottom: 20 }}>
            <h1 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "var(--ink)" }}>《{meta.topic}》课件内容</h1>
            <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
              {[meta.edition, meta.subject, meta.grade].filter(Boolean).map((c, i) => (
                <span key={i} style={{ padding: "2px 10px", borderRadius: 999, background: "var(--surface-2)", border: "1px solid var(--line)", fontSize: 11, fontWeight: 700, color: "var(--ink-2)" }}>{c}</span>
              ))}
            </div>
          </header>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {doc.map((sec, i) => {
              if (i > genProgress && !allDone) return (
                <div key={sec.id} style={{ padding: "14px 16px", borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--line)" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)" }}>{sec.name}</div>
                  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                    {[90, 70, 50].map((w, j) => <div key={j} style={{ height: 8, borderRadius: 4, background: "var(--line)", width: `${w}%` }} />)}
                  </div>
                </div>
              );
              if (i === genProgress && !allDone) return (
                <div key={sec.id}>
                  <CwContentSection sec={sec} idx={i} />
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 8, fontSize: 12.5, color: "var(--brand-deep)", fontWeight: 600 }}><span className="mini-spin" /> 生成中…</div>
                </div>
              );
              return <CwContentSection key={sec.id} sec={sec} idx={i} />;
            })}
          </div>
          <footer style={{ marginTop: 24, paddingTop: 12, borderTop: "1px dashed var(--line)", textAlign: "center", fontSize: 11.5, color: "var(--ink-3)" }}>
            对齐课程标准 · 结构参考学科网三审三校权威教案
          </footer>
        </article>
        {allDone && (
          <div style={{ position: "sticky", bottom: 0, padding: "16px 0 20px", background: "var(--canvas)", display: "flex", justifyContent: "center", zIndex: 5 }}>
            <button onClick={onFinish} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", borderRadius: 13, border: "none", background: "var(--brand-grad)", backgroundColor: "var(--brand)", color: "#fff", fontSize: 14.5, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-zh)", boxShadow: "0 10px 26px -12px var(--brand-glow)" }}>
              <CIcon name="slides" size={17} /> 生成课件
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- 补全卡 ----
function CwCompletionCard({ init, onResolve, onPickTextbook }) {
  const [vals, setVals] = cwS(init);
  const set = (k, v) => setVals((s) => ({ ...s, [k]: v }));
  const missing = ["stage", "subject", "edition"].filter((k) => !vals[k]);
  const allFilled = missing.length === 0 && vals.chapter;
  const title = missing.length >= 3 ? "告诉我给哪节课做课件" : `再补 ${missing.length + (vals.chapter ? 0 : 1)} 项就能开始`;
  const chip = (on) => ({ padding: "6px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", border: on ? "1.5px solid var(--brand)" : "1px solid var(--line)", background: on ? "var(--brand-soft)" : "var(--surface)", color: on ? "var(--brand-deep)" : "var(--ink-2)" });
  return (
    <div className="clarify-pop" style={{ margin: "0 14px 10px", borderRadius: 16, border: "1px solid var(--line)", background: "var(--surface)", boxShadow: "0 16px 40px -16px rgba(20,30,50,0.28)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "13px 14px 8px" }}>
        <span style={{ width: 26, height: 26, borderRadius: 8, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}><Icon name="spark" size={14} /></span>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>{title}</div>
      </div>
      <div style={{ padding: "0 14px 13px", display: "flex", flexDirection: "column", gap: 10 }}>
        {(!vals.stage || missing.includes("stage")) && (
          <div><div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-3)", marginBottom: 5 }}>学段</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{CW_STAGES.map((s) => <button key={s} style={chip(vals.stage === s)} onClick={() => set("stage", s)}>{s}</button>)}</div></div>
        )}
        <div><div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-3)", marginBottom: 5 }}>学科</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{CW_SUBJECTS.slice(0, 8).map((s) => <button key={s} style={chip(vals.subject === s)} onClick={() => set("subject", s)}>{s}</button>)}</div></div>
        <div><div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-3)", marginBottom: 5 }}>教材版本</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{CW_EDITIONS.map((e) => <button key={e} style={chip(vals.edition === e)} onClick={() => set("edition", e)}>{e}</button>)}</div></div>
        {vals.chapter ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)" }}>
            <Icon name="check" size={13} /><span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--brand-deep)" }}>{vals.chapter}</span>
            <button onClick={() => set("chapter", "")} style={{ marginLeft: "auto", color: "var(--ink-3)", background: "none", border: "none", cursor: "pointer" }}><Icon name="close" size={12} /></button>
          </div>
        ) : missing.length === 0 ? (
          <button onClick={() => onPickTextbook && onPickTextbook(vals)} style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px dashed var(--brand-soft-border)", background: "var(--brand-soft)", color: "var(--brand-deep)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>
            <Icon name="list" size={14} /> 选教材章节
          </button>
        ) : null}
        <button onClick={() => allFilled && onResolve(vals)} disabled={!allFilled} style={{ width: "100%", padding: "10px", borderRadius: 11, border: "none", background: allFilled ? "var(--brand)" : "var(--line)", color: allFilled ? "#fff" : "var(--ink-3)", fontSize: 13.5, fontWeight: 800, cursor: allFilled ? "pointer" : "default", fontFamily: "var(--font-zh)" }}>确定</button>
      </div>
    </div>
  );
}

// ---- 教材选择器抽屉 ----
function CwTextbookPicker({ current, onSelect, mobile }) {
  const [stage, setStage] = cwS(current ? current.stage || "初中" : "初中");
  const [subject, setSubject] = cwS(current ? current.subject || "数学" : "数学");
  const [edition, setEdition] = cwS(current ? current.edition || "人教版" : "人教版");
  const books = cwBooks(stage);
  const [book, setBook] = cwS(books[0]);
  const tb = { stage, subject, edition, book };
  const catalog = cwCatalog(tb);
  const pickStage = (s) => { setStage(s); const bs = cwBooks(s); setBook(bs[0]); };
  const ChipRow = ({ label, opts, value, set }) => (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-3)", width: 44, flexShrink: 0, paddingTop: 7 }}>{label}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {opts.map((o) => (
          <button key={o} onClick={() => set(o)} style={{ padding: "6px 12px", borderRadius: 9, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", border: value === o ? "1px solid var(--brand)" : "1px solid var(--line)", background: value === o ? "var(--brand-soft)" : "var(--surface)", color: value === o ? "var(--brand-deep)" : "var(--ink-2)" }}>{o}</button>
        ))}
      </div>
    </div>
  );
  return (
    <div style={{ padding: mobile ? "16px 14px 28px" : "20px 20px 30px" }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
        <ChipRow label="学段" opts={CW_STAGES} value={stage} set={pickStage} />
        <ChipRow label="学科" opts={CW_SUBJECTS} value={subject} set={setSubject} />
        <ChipRow label="版本" opts={CW_EDITIONS} value={edition} set={setEdition} />
        <ChipRow label="册别" opts={books} value={book} set={setBook} />
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--ink-3)", marginBottom: 10, display: "flex", alignItems: "center", gap: 7 }}><Icon name="list" size={14} /> {cwLabel(tb)} · 选一节开始</div>
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden" }}>
        {catalog.map((c, ci) => (
          <div key={ci} style={{ borderTop: ci ? "1px solid var(--line)" : "none" }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--ink-2)", padding: "10px 14px 6px", background: "var(--surface-2)" }}>{c.ch}</div>
            {c.secs.map((s, si) => (
              <button key={si} onClick={() => onSelect({ ...tb, chapter: s })} style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "10px 14px", border: "none", borderTop: si ? "1px solid var(--line)" : "none", background: "transparent", color: "var(--ink)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", textAlign: "left", transition: "background .14s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--brand-soft)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                <span style={{ flex: 1 }}>{s}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--brand-deep)", flexShrink: 0 }}>做课件 <Icon name="arrow" size={12} /></span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 主组件
// ============================================================
function CoursewareWorkspace({ scenario, query, onHome, onSwitch, fromIntent, resume, loggedIn, nav }) {
  const mobile = useIsMobile();
  const stored = window.ChatSession.scratch.courseware || {};
  const isResume = !!resume;
  const initialQ = query || (isResume ? resume.title : "") || "";
  const pendingA = window.ChatSession.pendingArtifact && window.ChatSession.pendingArtifact.scenario === "courseware" ? window.ChatSession.pendingArtifact : null;
  if (pendingA) window.ChatSession.pendingArtifact = null;

  const [stage, setStage] = cwS(stored.stage || (pendingA || isResume ? "content" : "init")); // init|outline|generating|content
  const [textbook, setTextbook] = cwS(stored.textbook || null);
  const [outline, setOutline] = cwS(stored.outline || null);
  const [doc, setDoc] = cwS(stored.doc || null);
  const [genProgress, setGenProgress] = cwS(stored.doc ? 999 : 0);
  const [pickOpen, setPickOpen] = cwS(false);
  const [clarify, setClarify] = cwS(null);
  const [toast, setToast] = cwS(null);
  const say = (m) => { setToast(m); setTimeout(() => setToast(null), 2200); };

  const greet = <span>好的，我来帮你<b style={{ color: "var(--brand-deep)" }}>做课件</b>。告诉我课题，或者在右侧选好教材章节，我先给你列个大纲。</span>;

  // ---- 流程函数 ----
  const goOutline = (meta, chapter) => {
    // Right side is changing — deselect any active artifact
    window.__activeArtifactKey = null;
    window.dispatchEvent(new CustomEvent("artifact-select", { detail: null }));
    const ol = cwDefaultOutline(meta.topic);
    setOutline(ol);
    setTextbook({ stage: meta.grade && /高/.test(meta.grade) ? "高中" : "初中", subject: meta.subject, edition: meta.edition, book: "", chapter: chapter || meta.topic });
    setStage("outline");
    setClarify(null);
    return { ol, meta };
  };
  const startGenerate = () => {
    if (!outline || outline.length === 0) return;
    const meta = { topic: textbook ? textbook.chapter || "本节课" : "本节课", edition: textbook ? textbook.edition : "", grade: textbook ? cwGrade(textbook) : "", subject: textbook ? textbook.subject : "" };
    const built = cwBuildDoc(outline, meta);
    setDoc(built);
    setGenProgress(0);
    setStage("generating");
    setMessages((m) => [...m, { role: "ai", node: <span>好的，正在按大纲展开《<b>{meta.topic}</b>》的课件内容…</span> }]);
    // simulate progressive generation
    let idx = 0;
    const tick = () => {
      idx++;
      setGenProgress(idx);
      if (idx < built.length) setTimeout(tick, 800);
      else {
        setStage("content");
        const grade = meta.grade || "";
        const stage = /高/.test(grade) ? "高中" : /[一二三四五六]年级/.test(grade) ? "小学" : "初中";
        const book = textbook ? textbook.book || "" : "";
        const art = { scenario: "courseware", icon: "slides", title: `《${meta.topic}》课件`, meta: `${meta.edition} · ${meta.subject}`, stage: stage, subject: meta.subject, edition: meta.edition, book: book || grade, _uid: "cw" + Date.now() };
        window.__activeArtifactKey = "courseware:" + art._uid;
        window.dispatchEvent(new CustomEvent("artifact-select", { detail: "courseware:" + art._uid }));
        setMessages((m) => [...m, { role: "ai", artifact: art, node: <span>《<b>{meta.topic}</b>》的课件内容已经生成好了，共 <b>{built.length}</b> 个模块。点右下角「生成课件」就可以挑模板、进编辑器成稿。</span> }]);
        setSugs(["突出情境导入", "加一页随堂练习", "换个主题重做"]);
      }
    };
    setTimeout(tick, 900);
  };

  const outlineNote = (meta) => <span>我先把《<b>{meta.topic}</b>》的课件大纲列在右侧了，你可以增删条目、调整顺序或改名字。满意后点「生成课件内容」，我再展开每一部分。</span>;

  const [messages, setMessages] = cwS(() => {
    if (isResume || pendingA) {
      const t = (resume && resume.title) || (pendingA && pendingA.title) || "课件";
      const hist = window.ChatSession.take();
      return [...hist];
    }
    const hist = window.ChatSession.take();
    if (fromIntent && query) {
      return [...hist, ...window.takeSwitchDivider(scenario, hist.length > 0),
        ...(window.ChatSession.echoed(query) ? [] : [{ role: "user", text: query }]),
        { role: "ai", wide: true, intent: query, render: () => <InlineIntent query={query} onDone={() => {
          const meta = cwMeta(query, loggedIn);
          const gaps = ["edition", "grade", "subject"].filter((k) => !meta[k]);
          if (gaps.length === 0 && meta.topic !== "本节课") {
            goOutline(meta, meta.topic);
            setMessages((m) => [...m, { role: "ai", node: outlineNote(meta) }]);
          } else {
            setClarify({ init: { stage: meta.grade && /高/.test(meta.grade) ? "高中" : "初中", subject: meta.subject || "", edition: meta.edition || "", chapter: meta.topic !== "本节课" ? meta.topic : "" } });
            setMessages((m) => [...m, { role: "ai", node: <span>补全一下教材信息，我就开始列大纲。</span> }]);
          }
        }} /> },
      ];
    }
    if (query && !fromIntent) {
      const meta = cwMeta(query, loggedIn);
      if (meta.topic !== "本节课" && meta.edition && meta.subject) {
        setTimeout(() => goOutline(meta, meta.topic), 0);
        return [...hist, ...window.takeSwitchDivider(scenario, hist.length > 0),
          ...(window.ChatSession.echoed(query) ? [] : [{ role: "user", text: query }]),
          { role: "ai", node: outlineNote(meta) }];
      }
      return [...hist, ...window.takeSwitchDivider(scenario, hist.length > 0),
        ...(window.ChatSession.echoed(query) ? [] : [{ role: "user", text: query }]),
        { role: "ai", node: greet }];
    }
    if (hist.length) return window.enterThread(scenario, greet);
    return [{ role: "ai", node: greet }];
  });
  const [sugs, setSugs] = cwS(stage === "content" ? ["突出情境导入", "加一页随堂练习", "换个主题重做"] : []);

  cwE(() => { window.ChatSession.save(window.freezeChat(messages)); }, [messages]);
  cwE(() => { window.ChatSession.scratch.courseware = { stage: stage === "generating" ? "content" : stage, textbook, outline, doc }; }, [stage, textbook, outline, doc]);

  const handleSend = (text, files) => {
    setClarify(null);
    setMessages((m) => [...m, { role: "user", text, files }, { role: "ai", typing: true }]);
    setTimeout(() => {
      if (stage === "content" && doc) {
        setMessages((m) => [...m.slice(0, -1), { role: "ai", node: <span>已根据「{text}」调整了课件内容。</span> }]);
        return;
      }
      const meta = cwMeta(text, loggedIn);
      if (meta.topic !== "本节课" && meta.edition && meta.subject) {
        goOutline(meta, meta.topic);
        setMessages((m) => [...m.slice(0, -1), { role: "ai", node: outlineNote(meta) }]);
        setSugs([]);
        return;
      }
      // params incomplete → show completion card
      setClarify({ init: { stage: meta.grade && /高/.test(meta.grade) ? "高中" : "初中", subject: meta.subject || (loggedIn ? "数学" : ""), edition: meta.edition || (loggedIn ? "人教版" : ""), chapter: meta.topic !== "本节课" ? meta.topic : "" } });
      setMessages((m) => [...m.slice(0, -1), { role: "ai", node: <span>补全一下教材信息，我就开始列大纲。</span> }]);
    }, 600);
  };

  const resolveClarify = (vals) => {
    setClarify(null);
    const meta = { topic: vals.chapter || "本节课", edition: vals.edition, grade: cwGrade({ stage: vals.stage, book: "" }), subject: vals.subject };
    goOutline(meta, vals.chapter);
    setMessages((m) => [...m, { role: "ai", node: outlineNote(meta) }]);
  };
  const onPickFromClarify = (vals) => {
    setClarify(null);
    setPickOpen(true);
  };

  const handleTextbookSelect = (tb) => {
    setPickOpen(false);
    setTextbook(tb);
    const meta = { topic: tb.chapter, edition: tb.edition, grade: cwGrade(tb), subject: tb.subject };
    goOutline(meta, tb.chapter);
    setMessages((m) => [...m, { role: "ai", node: outlineNote(meta) }]);
    setSugs([]);
  };

  const { headerRecognizing, send } = useSmartSend({ scenarioId: scenario.id, onSwitch, setMessages, localSend: handleSend });

  const meta = textbook ? { topic: textbook.chapter || "本节课", edition: textbook.edition, grade: cwGrade(textbook), subject: textbook.subject } : { topic: "本节课", edition: "", grade: "", subject: "" };

  let body;
  if (stage === "init") {
    body = <CwInitPage onPickTextbook={() => setPickOpen(true)} onExample={(c) => send(c)} mobile={mobile} />;
  } else if (stage === "outline" && outline) {
    body = (
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <CwOutlinePanel meta={meta} outline={outline} setOutline={setOutline} extras={CW_EXTRAS} onConfirm={startGenerate} mobile={mobile} />
      </div>
    );
  } else if (stage === "generating") {
    body = doc ? <CwContentView doc={doc} meta={meta} genProgress={genProgress} onFinish={() => say("正在跳转模板选择页（演示）")} mobile={mobile} /> : (
      <div style={{ flex: 1, display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center" }}><BotAvatar size={42} glow /><div style={{ marginTop: 12, fontSize: 14, fontWeight: 700, color: "var(--ink-2)", display: "flex", alignItems: "center", gap: 7 }}>正在生成课件内容 <Dots /></div></div>
      </div>
    );
  } else if (stage === "content" && doc) {
    body = <CwContentView doc={doc} meta={meta} genProgress={999} onFinish={() => say("正在跳转模板选择页（演示）— 实际产品中将进入模板挑选与课件编辑器")} mobile={mobile} />;
  } else {
    body = <CwInitPage onPickTextbook={() => setPickOpen(true)} onExample={(c) => send(c)} mobile={mobile} />;
  }

  return (
    <WorkspaceShell scenario={scenario} onHome={onHome} onSwitch={onSwitch} nav={nav} headerRecognizing={headerRecognizing} mobilePanelLabel="课件" mobilePanelIcon="slides" openSheetKey={stage !== "init" ? "cw" + stage : null}>
      <ChatPanel messages={messages} onSend={send} suggestions={sugs} placeholder={stage === "content" ? "例如：突出情境导入 / 加一页随堂练习" : "告诉我课题，或描述课件需求…"}
        clarifyNode={clarify ? <CwCompletionCard init={clarify.init} onResolve={resolveClarify} onPickTextbook={onPickFromClarify} /> : null} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "var(--canvas)", position: "relative" }}>
        {/* 教材条 or 编辑工具条 */}
        {stage === "content" && doc ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: "1px solid var(--line)", background: "var(--surface)", flexShrink: 0 }}>
            <button onClick={() => setStage("outline")} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px 5px 8px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.color = "var(--brand-deep)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--ink-2)"; }}>
              <span style={{ display: "inline-flex", transform: "rotate(180deg)" }}><Icon name="arrow" size={15} /></span> 返回
            </button>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: "var(--ink-2)" }}><span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--brand)", display: "inline-block" }} />课件内容已生成</span>
            <div style={{ flex: 1 }} />
            <button onClick={() => say("正在跳转模板选择页（演示）")} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 9, border: "none", background: "var(--brand)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-zh)" }}><CIcon name="slides" size={15} /> 生成课件</button>
          </div>
        ) : textbook && (stage === "outline" || stage === "generating") ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderBottom: "1px solid var(--line)", background: "var(--surface)", flexShrink: 0 }}>
            <CIcon name="book" size={14} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", flex: 1 }}>{textbook.edition} · {textbook.subject} · {textbook.book ? textbook.book + " · " : ""}{textbook.chapter}</span>
            <button onClick={() => setPickOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface-2)", color: "var(--ink-2)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>
              <Icon name="refresh" size={12} /> 切换
            </button>
          </div>
        ) : null}
        {body}
        {toast && (
          <div className="enter-pop" style={{ position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)", background: "var(--ink)", color: "var(--surface)", padding: "11px 18px", borderRadius: 12, fontSize: 13.5, fontWeight: 600, boxShadow: "0 12px 30px -12px rgba(0,0,0,.5)", display: "inline-flex", alignItems: "center", gap: 8, zIndex: 30, whiteSpace: "nowrap" }}>
            <Icon name="check" size={16} sw={2.6} /> {toast}
          </div>
        )}
      </div>
      {/* 教材选择器抽屉 */}
      <div onClick={() => setPickOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 84, background: "rgba(20,16,10,.42)", backdropFilter: "blur(2px)", opacity: pickOpen ? 1 : 0, pointerEvents: pickOpen ? "auto" : "none", transition: "opacity .2s" }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 85, width: mobile ? "100%" : "min(540px,94vw)", background: "var(--canvas)", boxShadow: "-20px 0 60px -30px rgba(0,0,0,.5)", transform: pickOpen ? "translateX(0)" : "translateX(102%)", transition: "transform .26s cubic-bezier(.22,1,.36,1)", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "13px 18px", borderBottom: "1px solid var(--line)", background: "var(--surface)", flexShrink: 0 }}>
          <span style={{ width: 28, height: 28, borderRadius: 9, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)" }}><CIcon name="book" size={16} /></span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--ink)" }}>选教材章节</div><div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600 }}>选好章节后自动列出课件大纲</div></div>
          <button onClick={() => setPickOpen(false)} style={{ width: 30, height: 30, borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-3)", display: "grid", placeItems: "center", cursor: "pointer" }}><Icon name="close" size={15} /></button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          {pickOpen && <CwTextbookPicker current={textbook} onSelect={handleTextbookSelect} mobile={mobile} />}
        </div>
      </div>
    </WorkspaceShell>
  );
}

Object.assign(window, { CoursewareWorkspace });


// ======== workspace_lesson.jsx ========
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
  lE(() => { window.ChatSession.scratch.lesson = { doc, q: initialQ, docCat, docType, savedDocs, textbook }; }, [doc, docCat, docType, savedDocs, textbook]);

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

  const exportDoc = () => { setToast("已开始下载（演示）— 实际产品中将下载文档文件"); setTimeout(() => setToast(null), 2600); };
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
            <LessonStartPage textbook={textbook} docType={docType} loggedIn={loggedIn} savedDocs={savedDocs} onWrite={writeSection} onPickTextbook={() => setPickTextbook(true)} onExample={(c) => send(c)} onOpenSaved={openSaved} mobile={mobile} />
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
function LessonStartPage({ textbook, docType, loggedIn, savedDocs, onWrite, onPickTextbook, onExample, onOpenSaved, mobile }) {
  const catalog = lzCatalog(textbook);
  const [catOpen, setCatOpen] = lS(false);
  const firstSec = (catalog[0] && catalog[0].secs[0]) || "本节";
  const secondSec = (catalog[0] && catalog[0].secs[1]) || (catalog[1] && catalog[1].secs[0]) || firstSec;
  // 自然语言示例 —— 桥：教用户怎么向左侧对话框开口
  const examples = [
    `备《${firstSec}》的${docType}`,
    `${secondSec}，重点突出探究活动`,
    `这一节的重难点该怎么处理`,
  ];
  const recents = (savedDocs || []).slice(-3).reverse();

  return (
    <div className="home-fade" style={{ height: "100%", display: "grid", placeItems: "center", padding: mobile ? 16 : 24 }}>
    <div style={{ width: "min(540px,100%)" }}>
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ display: "inline-flex", marginBottom: 13 }}><ScenarioGlyph icon="lesson" hue={320} size={52} active /></div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", margin: "0 0 6px" }}>来写教案吧</h2>
        <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: 0, lineHeight: 1.6 }}>在左侧告诉我课题或描述写教案的需求，也可以直接选择教材章节</p>
      </div>

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

Object.assign(window, { LessonWorkspace });


// ======== workspace_mindmap.jsx ========
// workspace_mindmap.jsx — 画导图：真实可编辑的思维导图工作台
// 左侧对话驱动，右侧用 HTML 节点 + SVG 连线渲染一张可编辑、可折叠的导图。
const { useState: mS, useEffect: mE, useMemo: mM, useRef: mR } = React;

// ---- 课题解析（与教案共用思路）----
function parseMindQuery(q) {
  const text = q || "";
  let topic = (text.match(/《([^》]+)》/) || [])[1];
  if (!topic) {
    topic = text
      .replace(/(帮我|请|给我|来一?份|画个?|做个?|生成|整理|梳理)/g, "")
      .replace(/(人教版|北师大版|部编版|苏教版|外研社|湘教版|沪科版|译林版|统编版)/g, "")
      .replace(/(高[一二三]|[一二三四五六七八九]年级(上|下)?册?|[七八九][上下]册?)/g, "")
      .replace(/(数学|语文|英语|物理|化学|生物|历史|地理|政治|道德与法治|科学)/g, "")
      .replace(/(的)?(思维导图|导图|知识结构|知识树|脑图|考点)/g, "")
      .replace(/第[一二三四五六七八九十\d]+[章课单元]/g, (m) => m)
      .trim().replace(/^[,，、·\s]+|[,，、·\s]+$/g, "");
  }
  return topic || "本章知识";
}

let mindUid = 1;
const mn = (text, children, extra) => ({ id: "n" + mindUid++, text, children: children || [], ...(extra || {}) });

// ---- 导图内容生成 ----
function buildMindmap(q) {
  const topic = parseMindQuery(q);
  return {
    topic,
    root: mn(topic, [
      mn("核心概念", [
        mn(`${topic}的定义`, [], { imp: true }),
        mn("关键要素与表示方法"),
        mn("与已学知识的联系"),
      ]),
      mn("性质与规律", [
        mn("基本性质", [], { imp: true }),
        mn("重要结论 / 定理"),
        mn("特殊情形"),
      ]),
      mn("方法与应用", [
        mn("典型题型与解题步骤", [], { imp: true }),
        mn("常用思想方法"),
        mn("实际应用情境"),
      ]),
      mn("复习要点", [
        mn("高频考点"),
        mn("与中考/期末的关联"),
      ]),
    ]),
  };
}

// ---- 对话指令 → 导图修改 ----
function applyMindCommand(text, map) {
  const t = text || "";
  if (/易错|易混/.test(t)) {
    if (map.root.children.some((b) => /易错/.test(b.text))) return { map, reply: "「易混易错点」分支已经在图上了，可以直接点击节点继续补充。" };
    const branch = mn("易混易错点", [
      mn("概念辨析：相近概念的区别", [], { err: true }),
      mn("常见错误：忽略适用条件", [], { err: true }),
      mn("纠错策略：先判型再下笔", [], { err: true }),
    ]);
    return { map: { ...map, root: { ...map.root, children: [...map.root.children, branch] } }, reply: "已加上「易混易错点」分支（红色标记），列了概念辨析、常见错误和纠错策略三个点，你可以继续往下挂节点。" };
  }
  if (/重要|重点|标注/.test(t)) {
    const mark = (n, depth) => ({ ...n, imp: depth === 2 && /定义|性质|题型|定理|结论/.test(n.text) ? true : n.imp, children: n.children.map((c) => mark(c, depth + 1)) });
    return { map: { ...map, root: mark(map.root, 0) }, reply: "已按重要程度标注：核心节点加了 ★ 标记，复习时优先看带星的。" };
  }
  if (/导出|图片|下载/.test(t)) return { map, reply: null, export: true };
  if (/精简|简化/.test(t)) {
    const trim = (n, depth) => ({ ...n, children: depth >= 1 ? n.children.filter((c) => c.imp || c.err || n.children.length <= 2).map((c) => trim(c, depth + 1)) : n.children.map((c) => trim(c, depth + 1)) });
    return { map: { ...map, root: trim(map.root, 0) }, reply: "已精简：保留了带标记的核心节点，去掉了次要细节。" };
  }
  return null;
}

const MIND_COLD = ["七下数学 第七章 相交线 思维导图", "九年级 二次函数 思维导图", "中考一轮复习 分式 考点思维导图", "三年级下册《荷花》思维导图"];
const MIND_SUGS = ["补充易错点", "按重要程度标注", "精简一下", "导出为图片"];

// ---- 布局：root 在左，分支向右展开 ----
const MIND_NODE_H = 36, MIND_VGAP = 9, MIND_HGAP = 52;
function mindWidth(n, depth) {
  const fs = depth === 0 ? 15 : depth === 1 ? 13.5 : 12.5;
  const pad = depth === 0 ? 36 : 26;
  const btn = n.children.length ? 24 : 0;
  const star = n.imp ? 20 : 0;
  return Math.min(330, Math.ceil(n.text.length * (fs + 1)) + pad + btn + star);
}
function mindLayout(map, collapsed) {
  const cols = []; // max width per depth
  const nodes = [], links = [];
  const measure = (n, depth) => {
    cols[depth] = Math.max(cols[depth] || 0, mindWidth(n, depth));
    const kids = collapsed[n.id] ? [] : n.children;
    if (!kids.length) return MIND_NODE_H + MIND_VGAP;
    let h = 0;
    kids.forEach((c) => (h += measure(c, depth + 1)));
    return Math.max(h, MIND_NODE_H + MIND_VGAP);
  };
  const totalH = measure(map.root, 0);
  const colX = [16];
  for (let d = 1; d < cols.length; d++) colX[d] = colX[d - 1] + cols[d - 1] + MIND_HGAP;
  const place = (n, depth, top, branchHue) => {
    const kids = collapsed[n.id] ? [] : n.children;
    const myH = (() => { if (!kids.length) return MIND_NODE_H + MIND_VGAP; let h = 0; kids.forEach((c) => { h += sizeOf(c, depth + 1); }); return Math.max(h, MIND_NODE_H + MIND_VGAP); })();
    const y = top + myH / 2;
    const w = mindWidth(n, depth);
    nodes.push({ n, depth, x: colX[depth], y, w, hue: branchHue });
    let cTop = top + Math.max(0, (myH - kids.reduce((s, c) => s + sizeOf(c, depth + 1), 0)) / 2);
    kids.forEach((c, i) => {
      const hue = depth === 0 ? [248, 175, 320, 38, 12][i % 5] : branchHue;
      const ch = sizeOf(c, depth + 1);
      links.push({ from: { x: colX[depth] + w, y }, to: { x: colX[depth + 1], y: cTop + ch / 2 }, hue });
      place(c, depth + 1, cTop, hue);
      cTop += ch;
    });
  };
  const sizeCache = {};
  function sizeOf(n, depth) {
    const key = n.id;
    if (sizeCache[key] != null) return sizeCache[key];
    const kids = collapsed[n.id] ? [] : n.children;
    let h;
    if (!kids.length) h = MIND_NODE_H + MIND_VGAP;
    else { h = 0; kids.forEach((c) => (h += sizeOf(c, depth + 1))); h = Math.max(h, MIND_NODE_H + MIND_VGAP); }
    sizeCache[key] = h;
    return h;
  }
  place(map.root, 0, 12, 248);
  const width = colX[cols.length - 1] + (cols[cols.length - 1] || 0) + 30;
  return { nodes, links, width, height: totalH + 24 };
}

function countNodes(n) { return 1 + n.children.reduce((s, c) => s + countNodes(c), 0); }

// ---- 单个节点 ----
function MindNode({ item, selected, onSelect, onToggle, onEdit, collapsedCount }) {
  const { n, depth, x, y, w, hue } = item;
  const isRoot = depth === 0;
  const c = n.err ? 12 : hue;
  const bg = isRoot ? "var(--brand-grad)" : depth === 1 ? `oklch(0.95 0.025 ${c})` : "var(--surface)";
  const border = isRoot ? "transparent" : depth === 1 ? `oklch(0.82 0.07 ${c})` : selected ? "var(--brand)" : "var(--line)";
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onSelect(n.id); }}
      style={{ position: "absolute", left: x, top: y - MIND_NODE_H / 2, width: w, height: MIND_NODE_H, display: "flex", alignItems: "center", gap: 5, padding: isRoot ? "0 16px" : "0 11px", borderRadius: isRoot ? 12 : 10, background: bg, backgroundColor: isRoot ? "var(--brand)" : undefined, border: `1.5px solid ${border}`, boxShadow: selected ? "0 0 0 3px var(--brand-soft)" : isRoot ? "0 8px 22px -10px var(--brand-glow)" : "none", cursor: "pointer", zIndex: 2, transition: "box-shadow .15s" }}
    >
      {n.imp && <span style={{ color: isRoot ? "#ffd76a" : `oklch(0.7 0.15 75)`, fontSize: 13, flexShrink: 0 }}>★</span>}
      <span
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onEdit(n.id, e.currentTarget.textContent.trim() || n.text)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } }}
        style={{ flex: 1, minWidth: 0, fontSize: isRoot ? 15 : depth === 1 ? 13.5 : 12.5, fontWeight: isRoot ? 800 : depth === 1 ? 700 : 600, color: isRoot ? "#fff" : n.err ? "oklch(0.5 0.16 18)" : "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", outline: "none" }}
      >{n.text}</span>
      {n.children.length > 0 && (
        <button onClick={(e) => { e.stopPropagation(); onToggle(n.id); }} data-tip={collapsedCount ? "展开" : "收起"}
          style={{ width: 17, height: 17, borderRadius: 999, border: `1px solid ${isRoot ? "rgba(255,255,255,.5)" : "var(--line)"}`, background: collapsedCount ? "var(--brand)" : isRoot ? "rgba(255,255,255,.2)" : "var(--surface-2)", color: collapsedCount ? "#fff" : isRoot ? "#fff" : "var(--ink-3)", fontSize: 10, fontWeight: 800, display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0, fontFamily: "var(--font-num)", lineHeight: 1 }}>
          {collapsedCount ? collapsedCount : "−"}
        </button>
      )}
    </div>
  );
}

function MindmapWorkspace({ scenario, query, onHome, onSwitch, fromIntent, resume, nav }) {
  const mobile = useIsMobile();
  const stored = window.ChatSession.scratch.mindmap || {};
  const isResume = !!resume;
  const initialQ = query || (isResume ? resume.title : "") || stored.q || "";
  const [map, setMap] = mS(() => stored.map || (initialQ && (!fromIntent || stored.map) ? buildMindmap(initialQ) : null));
  const [generating, setGenerating] = mS(false);
  const [collapsed, setCollapsed] = mS({});
  const [selected, setSelected] = mS(null);
  const [toast, setToast] = mS(null);
  const say = (s) => { setToast(s); setTimeout(() => setToast(null), 2600); };

  const greet = <span>我来帮你<b style={{ color: "var(--brand-deep)" }}>画思维导图</b>。告诉我章节或主题，我会按教材结构梳理成层级图——节点可以直接点击改文字，也能折叠、加星、补易错点。</span>;

  const genMap = (q, after) => {
    setGenerating(true);
    setTimeout(() => { const m2 = buildMindmap(q); setMap(m2); setCollapsed({}); setGenerating(false); after && after(m2); }, 1200);
  };
  const artFor = (m) => { const a = { scenario: "mindmap", icon: "mindmap", title: `《${m.topic}》思维导图`, meta: `${countNodes(m.root)} 个节点`, _uid: "mm" + Date.now() }; window.__activeArtifactKey = "mindmap:" + a._uid; window.dispatchEvent(new CustomEvent("artifact-select", { detail: "mindmap:" + a._uid })); return a; };
  const doneNote = (m) => <span>《<b>{m.topic}</b>》的思维导图画好了——{m.root.children.length} 个一级分支、共 {countNodes(m.root) - 1} 个知识点，结构对齐<b style={{ color: "var(--auth-ink)" }}>权威教材</b>。点击节点可以直接改文字，选中后还能加子节点；也可以继续吩咐我调整。</span>;

  const [messages, setMessages] = mS(() => {
    if (isResume) return [{ role: "ai", node: <span>已为你恢复 <b>{resume.when}</b> 画的《{(resume.title || "").replace(/[《》]/g, "")}》思维导图，右侧接着编辑就行。</span> }];
    if (fromIntent && query) {
      return [
        ...window.ChatSession.take(),
        ...window.takeSwitchDivider(scenario, window.ChatSession.log.length > 0),
        ...(window.ChatSession.echoed(query) ? [] : [{ role: "user", text: query }]),
        { role: "ai", wide: true, intent: query, render: () => <InlineIntent query={query} onDone={() => { genMap(query, (m2) => { setMessages((ms) => [...ms, { role: "ai", node: doneNote(m2), artifact: artFor(m2) }]); setSugs(MIND_SUGS); }); }} /> },
      ];
    }
    if (query) { const m2 = map || buildMindmap(query); return [...window.ChatSession.take(), ...window.takeSwitchDivider(scenario, window.ChatSession.log.length > 0), ...(window.ChatSession.echoed(query) ? [] : [{ role: "user", text: query }]), { role: "ai", node: doneNote(m2), artifact: artFor(m2) }]; }
    if (stored.map) return window.enterThread(scenario);
    return window.enterThread(scenario, greet);
  });
  const [sugs, setSugs] = mS(map ? MIND_SUGS : []);

  mE(() => { window.ChatSession.save(window.freezeChat(messages)); }, [messages]);
  mE(() => { window.ChatSession.scratch.mindmap = { map, q: initialQ }; }, [map]);

  // ---- 节点操作 ----
  const mut = (fn) => setMap((m) => (m ? { ...m, root: fn(structuredClone ? structuredClone(m.root) : JSON.parse(JSON.stringify(m.root))) } : m));
  const findAnd = (n, id, fn, parent) => {
    if (n.id === id) { fn(n, parent); return true; }
    return n.children.some((c) => findAnd(c, id, fn, n));
  };
  const editNode = (id, text) => mut((root) => { findAnd(root, id, (n) => (n.text = text)); return root; });
  const addChild = () => { if (!selected) return; mut((root) => { findAnd(root, selected, (n) => n.children.push(mn("新知识点"))); return root; }); setCollapsed((c) => ({ ...c, [selected]: false })); };
  const delNode = () => {
    if (!selected || (map && selected === map.root.id)) return;
    mut((root) => { findAnd(root, selected, (n, p) => { if (p) p.children = p.children.filter((c) => c.id !== n.id); }); return root; });
    setSelected(null);
  };
  const starNode = () => { if (!selected) return; mut((root) => { findAnd(root, selected, (n) => (n.imp = !n.imp)); return root; }); };
  const toggle = (id) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  const handleSend = (text, files) => {
    setMessages((m) => [...m, { role: "user", text, files }, { role: "ai", typing: true }]);
    setTimeout(() => {
      if (map) {
        const r = applyMindCommand(text, map);
        if (r) {
          if (r.export) { setMessages((m) => [...m.slice(0, -1), { role: "ai", node: <span>已为你导出 PNG 图片（演示）——实际产品中会下载到本地，也可以一键存入「我的内容」。</span> }]); say("已生成图片（演示）"); return; }
          setMap(r.map);
          setMessages((m) => [...m.slice(0, -1), { role: "ai", node: <span>{r.reply}</span> }]);
          return;
        }
      }
      if ((text || "").length >= 4) {
        setMessages((m) => [...m.slice(0, -1), { role: "ai", node: <span>好的，正在为你梳理《{parseMindQuery(text)}》的知识结构…</span> }]);
        genMap(text, (m2) => { setMessages((ms) => [...ms, { role: "ai", node: doneNote(m2), artifact: artFor(m2) }]); setSugs(MIND_SUGS); });
        return;
      }
      setMessages((m) => [...m.slice(0, -1), { role: "ai", node: <span>可以说「补充易错点」「按重要程度标注」，选中节点后也能在右上角加子节点；或者给我一个新主题重新画。</span> }]);
    }, 600);
  };
  const { headerRecognizing, send } = useSmartSend({ scenarioId: scenario.id, onSwitch, setMessages, localSend: handleSend });

  const lay = mM(() => (map ? mindLayout(map, collapsed) : null), [map, collapsed]);
  const collapsedCountOf = (n) => (collapsed[n.id] ? countNodes(n) - 1 : 0);

  return (
    <WorkspaceShell scenario={scenario} onHome={onHome} onSwitch={onSwitch} nav={nav} headerRecognizing={headerRecognizing} mobilePanelLabel="导图" mobilePanelIcon="mindmap" openSheetKey={map ? map.topic : null}>
      <ChatPanel messages={messages} onSend={send} suggestions={sugs} placeholder="章节主题，或要调整的地方…" />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "var(--canvas)", position: "relative" }}>
        {/* 工具栏 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderBottom: "1px solid var(--line)", background: "var(--surface)", flexShrink: 0 }}>
          <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>思维导图</span>
          {map && <span style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600, fontFamily: "var(--font-num)" }}>{countNodes(map.root)} 节点</span>}
          <div style={{ flex: 1 }} />
          {map && selected && (
            <span style={{ display: "inline-flex", gap: 6 }}>
              <Btn size="sm" kind="soft" icon="plus" onClick={addChild}>子节点</Btn>
              <Btn size="sm" kind="ghost" onClick={starNode}>★ 标重点</Btn>
              {selected !== map.root.id && <Btn size="sm" kind="ghost" icon="close" onClick={delNode}>删除</Btn>}
            </span>
          )}
          {map && !selected && <span style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600 }}>点击节点编辑 · 选中后可加子节点</span>}
          {map && <Btn size="sm" kind="soft" icon="download" onClick={() => say("已生成 PNG 图片（演示）")}>导出图片</Btn>}
        </div>
        {/* 画布 */}
        <div style={{ flex: 1, overflow: "auto", padding: mobile ? 10 : 18 }} onClick={() => setSelected(null)}>
          {generating ? (
            <div style={{ height: "100%", display: "grid", placeItems: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ display: "inline-flex", marginBottom: 12 }}><BotAvatar size={40} glow thinking /></div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--brand-deep)", display: "flex", alignItems: "center", gap: 7 }}>正在按教材结构梳理知识点 <Dots /></div>
              </div>
            </div>
          ) : !map ? (
            <div style={{ height: "100%", display: "grid", placeItems: "center" }}>
              <div className="home-fade" style={{ width: "min(540px,100%)", textAlign: "center" }}>
                <div style={{ display: "inline-flex", marginBottom: 14 }}><ScenarioGlyph icon="mindmap" hue={38} size={52} active /></div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", margin: "0 0 7px" }}>来画一张思维导图吧</h2>
                <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "0 0 22px", lineHeight: 1.6 }}>在左侧告诉我章节或主题，我来帮你生成</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 9, textAlign: "left" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-3)", marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="spark" size={14} /> 试试这样问
                  </div>
                  {MIND_COLD.map((c, i) => (
                    <button key={i} onClick={() => send(c)} style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left", padding: "12px 14px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", fontSize: 13, fontWeight: 600, lineHeight: 1.5, cursor: "pointer", fontFamily: "var(--font-zh)", transition: "all .15s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px -6px rgba(0,0,0,.15)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                      <Icon name="spark" size={14} />
                      <span style={{ flex: 1 }}>{c}</span>
                      <Icon name="arrow" size={13} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : lay ? (
            <div style={{ position: "relative", width: lay.width, height: lay.height, minWidth: "100%" }}>
              <svg width={lay.width} height={lay.height} style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}>
                {lay.links.map((l, i) => {
                  const mx = (l.from.x + l.to.x) / 2;
                  return <path key={i} d={`M ${l.from.x} ${l.from.y} C ${mx} ${l.from.y}, ${mx} ${l.to.y}, ${l.to.x} ${l.to.y}`} fill="none" stroke={`oklch(0.78 0.06 ${l.hue})`} strokeWidth="1.8" />;
                })}
              </svg>
              {lay.nodes.map((item) => (
                <MindNode key={item.n.id} item={item} selected={selected === item.n.id} onSelect={setSelected} onToggle={toggle} onEdit={editNode} collapsedCount={collapsedCountOf(item.n)} />
              ))}
            </div>
          ) : null}
        </div>
        {map && (
          <div style={{ padding: "7px 16px", borderTop: "1px solid var(--line)", background: "var(--surface)", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <Icon name="shield" size={13} />
            <span style={{ fontSize: 11.5, color: "var(--auth-ink)", fontWeight: 700 }}>知识点结构对齐权威教材目录</span>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600 }}>★ 重点 · 红字 易错</span>
          </div>
        )}
        {toast && (
          <div style={{ position: "absolute", bottom: 52, left: "50%", transform: "translateX(-50%)", background: "oklch(0.3 0.01 260 / .95)", color: "#fff", fontSize: 12.5, fontWeight: 600, padding: "9px 16px", borderRadius: 11, zIndex: 40, whiteSpace: "nowrap" }}>{toast}</div>
        )}
      </div>
    </WorkspaceShell>
  );
}

Object.assign(window, { MindmapWorkspace });


// ======== workspace_assistant.jsx ========
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
      window.ChatSession.switchMeta = { source: "auto", from: window.AIDATA.GENERAL };
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


// ======== workspace_stubs.jsx ========
// workspace_stubs.jsx — lightweight placeholders for non-core workspaces (旧版保留入口)
// Keeps the app routing intact without the full 234KB of Babel compilation.

function StubWorkspace({ scenario, onHome, nav, label }) {
  const mobile = useIsMobile();
  return (
    <WorkspaceShell scenario={scenario} onHome={onHome} nav={nav} mobilePanelLabel={label} mobilePanelIcon={scenario.icon}>
      <div style={{ flex: 1 }} />
      <div style={{ flex: 1, display: "grid", placeItems: "center", background: "var(--canvas)" }}>
        <div style={{ textAlign: "center", padding: 32 }}>
          <ScenarioGlyph icon={scenario.icon} hue={scenario.hue} size={56} active />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", margin: "16px 0 8px" }}>{scenario.name}</h2>
          <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "0 0 20px", lineHeight: 1.6 }}>该功能将在旧版页面中打开</p>
          <button onClick={onHome} style={{ padding: "10px 22px", borderRadius: 11, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>返回首页</button>
        </div>
      </div>
    </WorkspaceShell>
  );
}

function PaperWorkspace(props) { return <StubWorkspace {...props} label="组卷" />; }
function GradeWorkspace(props) { return <StubWorkspace {...props} label="批改" />; }
function TextbookWorkspace(props) { return <StubWorkspace {...props} label="教材" />; }
function GenericWorkspace(props) { return <StubWorkspace {...props} label="助手" />; }

Object.assign(window, { PaperWorkspace, GradeWorkspace, TextbookWorkspace, GenericWorkspace });


// ======== app.jsx ========
// app.jsx — state machine + tweaks wiring
const { useState: aS, useEffect: aE } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/ {
  primary: "#2f73e0",
  homeLayout: "对话优先",
  dark: false,
} /*EDITMODE-END*/;

const PRIMARY_OPTIONS = ["#2f73e0", "#16a37b", "#e8743b", "#7a5cf0", "#d23f66"];

function applyTheme(t) {
  const root = document.documentElement;
  root.style.setProperty("--brand", t.primary);
  root.classList.toggle("dark", !!t.dark);
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  useBodyMobileFlag();
  const [screen, setScreen] = aS("home"); // home | recognizing | workspace
  const [query, setQuery] = aS("");
  const [scenarioId, setScenarioId] = aS(null);
  const [draft, setDraft] = aS("");
  const [fromIntent, setFromIntent] = aS(false);
  const [resume, setResume] = aS(null); // {scenario,title} when resuming a past creation
  const [loggedIn, setLoggedIn] = aS(true);
  const [loginOpen, setLoginOpen] = aS(false);
  const [pendingPick, setPendingPick] = aS(null); // 登录后继续进入的场景（出卷子登录拦截）
  // 资源篮 — a teacher's collected resources, persisted across the session
  const [basket, setBasket] = aS(() => { try { return JSON.parse(localStorage.getItem("aida_basket") || "[]"); } catch (e) { return []; } });
  const [basketOpen, setBasketOpen] = aS(false);
  const [contentOpen, setContentOpen] = aS(false);
  const [wsNonce, setWsNonce] = aS(0); // bumped when an artifact chip is clicked → forces the stage to re-open it
  // 历史对话 — live list seeded from mock; a new record is logged the moment a fresh
  // conversation produces its first round (see window.recordConversation below).
  const [convs, setConvs] = aS(() => window.AIDATA.USER_MEMORY.conversations.slice());
  aE(() => {
    window.recordConversation = (c) => {
      setConvs((list) => {
        const idx = list.findIndex((x) => x.sid === c.sid);
        if (idx >= 0) {
          const ex = list[idx];
          if (ex.last === c.last && ex.title === c.title) return list; // nothing changed
          const updated = { ...ex, title: c.title, last: c.last, when: "刚刚" };
          const next = list.slice(); next.splice(idx, 1);
          return [updated, ...next]; // bubble the active conversation to the top
        }
        return [{ id: c.sid, sid: c.sid, scenario: c.scenario, icon: c.icon, hue: c.hue, title: c.title, last: c.last, when: "刚刚" }, ...list];
      });
    };
    return () => { delete window.recordConversation; };
  }, []);
  aE(() => { try { localStorage.setItem("aida_basket", JSON.stringify(basket)); } catch (e) {} }, [basket]);
  const addToBasket = (item) => {
    const bid = item.id || item.title;
    let added = true;
    setBasket((b) => { if (b.find((x) => x.bid === bid)) { added = false; return b; } return [...b, { bid, title: item.title, type: item.type || item.cat || "资料", meta: item.meta || [item.edition, item.grade, item.subject].filter(Boolean).join(" · ") }]; });
    return added;
  };
  const removeFromBasket = (bid) => setBasket((b) => b.filter((x) => x.bid !== bid));

  aE(() => applyTheme(t), [t.primary, t.dark]);

  // 未登录：工作台内的操作按钮拦截弹登录框；首页场景入口和导航按钮放行
  aE(() => {
    if (loggedIn) return;
    const onClick = (e) => {
      const el = e.target.closest && e.target.closest('button, a, [role="button"]');
      if (!el) return;
      if (el.closest('[data-login-modal]') || el.closest('[data-omelette-chrome]')) return;
      // 放行：首页场景chips、左侧导航、场景切换pills
      if (el.closest('[data-scenario-chip]') || el.closest('[data-nav-item]') || el.closest('[data-scenario-pill]') || el.closest('[data-home-nav]')) return;
      e.preventDefault();
      e.stopPropagation();
      setLoginOpen(true);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [loggedIn]);
  // expose theme handle so the account menu can toggle 浅色/深色
  window.__aidaDark = !!t.dark;
  window.__aidaSetDark = (v) => setTweak("dark", v);
  // one-click 切回 on the auto-switch chat divider → equivalent to a manual switch
  window.__aidaSwitch = (id, q) => switchScenario(id, q);

  const S = window.AIDATA.SCENARIOS;
  const scenario = scenarioId === "general" ? window.AIDATA.GENERAL : (S.find((s) => s.id === scenarioId) || S[0]);

  // submit free text from home → enter the 通用助手, which runs intent
  // recognition inline and either hands off to a specific tool or answers.
  const goIntent = (txt) => {
    const q = (typeof txt === "string" ? txt : draft).trim();
    if (!q) return;
    window.ChatSession && window.ChatSession.clear();
    setQuery(q);
    setDraft(q);
    setScenarioId("general");
    setFromIntent(true);
    setResume(null);
    setScreen("workspace");
  };
  const pickScenario = (id) => {
    doPick(id);
  };
  const doPick = (id) => {
    window.ChatSession && window.ChatSession.clear();
    setScenarioId(id);
    setQuery(draft.trim());
    setFromIntent(false);
    setResume(null);
    setScreen("workspace");
  };
  const goHome = () => {
    window.ChatSession && window.ChatSession.clear();
    setScreen("home");
    setDraft("");
    setQuery("");
    setScenarioId(null);
    setFromIntent(false);
    setResume(null);
  };
  const switchScenario = (id, q) => {
    setScenarioId(id);
    if (q !== undefined) setQuery(q);
    setFromIntent(false);
    setResume(null);
    setScreen("workspace");
  };
  // resume a finished past creation → open its workspace in the COMPLETED state
  const resumeCreation = (item) => {
    window.ChatSession && window.ChatSession.clear();
    if (window.ChatSession) window.ChatSession.suppressHistory = true;
    // Pre-populate chat history from saved conversation messages
    if (item.messages && item.messages.length && window.ChatSession) {
      window.ChatSession.save(item.messages.map((m) => m.role === "user" ? { role: "user", text: m.text } : { role: "ai", node: m.text }));
    }
    setScenarioId(item.scenario);
    setQuery(item.title);
    setFromIntent(false);
    setResume(item);
    setScreen("workspace");
  };

  const isHomeShell = screen === "home" || screen === "memory" || screen === "works" || screen === "history" || screen === "basket" || screen === "feedback" || screen === "help" || screen === "changelog" || (screen && screen.startsWith("legacy:"));

  // tell ChatSession which workspace is in view, so a logged history record can carry
  // the right scenario icon/hue and the 成果 menu the right glyph.
  aE(() => {
    if (screen === "workspace" && scenario) {
      window.ChatSession.activeScenario = { id: scenario.id, icon: scenario.icon, hue: scenario.hue, name: scenario.name };
    }
  }, [screen, scenarioId]);

  // clicking an artifact chip in the chat reopens that round/creation — even from another scenario
  aE(() => {
    window.openSessionArtifact = (a) => {
      if (!a || !a.scenario) return;
      // Deselect any previously active artifact first
      window.__activeArtifactKey = a.scenario + ":" + (a._uid || a.id || a.title);
      window.dispatchEvent(new CustomEvent("artifact-select", { detail: window.__activeArtifactKey }));
      window.ChatSession.pendingArtifact = a;
      setScenarioId(a.scenario);
      setQuery("");
      setFromIntent(false);
      setResume(null);
      setWsNonce((n) => n + 1);
      setScreen("workspace");
    };
    return () => { delete window.openSessionArtifact; };
  }, []);

  // 从学科网资源站「智能搜索」跳转进来 —— 自动带入用户输入的内容，并直接进入
  // 通用助手的意图识别流程（信息不全则按追问/补全方式继续，与站内一致）。
  aE(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const q = (p.get("q") || p.get("query") || "").trim();
      if (q) {
        // strip the param so a refresh doesn't re-trigger, but keep history clean
        const url = window.location.pathname + window.location.hash;
        window.history.replaceState({}, "", url);
        goIntent(q);
      }
    } catch (e) {}
  }, []);

  // left rail props shared by homepage AND workspaces (the menu stays in every screen)
  const railNav = {
    loggedIn,
    onNavigate: (p) => setScreen(p),
    onNewChat: goHome,
    onResume: (it) => resumeCreation(it),
    onLogout: () => { setLoggedIn(false); setScreen("home"); },
    onRequireLogin: () => setLoginOpen(true),
    onOpenBasket: () => setBasketOpen(true),
    basketCount: basket.length,
    conversations: convs,
  };

  let view;
  if (isHomeShell) {
    view = (
      <Homepage
        page={screen}
        layout={t.homeLayout}
        value={draft}
        setValue={setDraft}
        onSubmit={goIntent}
        onPick={pickScenario}
        onResume={(item) => resumeCreation(item)}
        loggedIn={loggedIn}
        onLogin={() => setLoggedIn(true)}
        onLogout={() => { setLoggedIn(false); setScreen("home"); }}
        onNavigate={(p) => setScreen(p)}
        onNewChat={goHome}
        onRequireLogin={() => setLoginOpen(true)}
        onOpenBasket={() => setBasketOpen(true)}
        basketCount={basket.length}
        basketItems={basket}
        onRemoveBasket={removeFromBasket}
        onClearBasket={() => setBasket([])}
        conversations={convs}
      />
    );
  } else {
    const wsKey = (fromIntent ? "i:" : "") + (resume ? "r:" : "") + scenarioId + ":" + query + ":" + wsNonce;
    const common = { scenario, query, fromIntent, resume, loggedIn, nav: railNav, onHome: goHome, onSwitch: switchScenario, onAddBasket: addToBasket, onOpenBasket: () => setBasketOpen(true), onOpenContent: () => setContentOpen(true), basketCount: basket.length, basketItems: basket };
    if (scenarioId === "general") view = <GeneralWorkspace key={wsKey} {...common} />;
    else if (scenarioId === "find") view = <FindWorkspace key={wsKey} {...common} />;
    else if (scenarioId === "textbook") view = <TextbookWorkspace key={wsKey} {...common} />;
    else if (scenarioId === "courseware") view = <CoursewareWorkspace key={wsKey} {...common} />;
    else if (scenarioId === "lesson") view = <LessonWorkspace key={wsKey} {...common} />;
    else if (scenarioId === "paper") view = <PaperWorkspace key={wsKey} {...common} />;
    else if (scenarioId === "mindmap") view = <MindmapWorkspace key={wsKey} {...common} />;
    else if (scenarioId === "grade") view = <GradeWorkspace key={wsKey} {...common} />;
    else view = <GenericWorkspace key={wsKey} {...common} />;
  }

  return (
    <React.Fragment>
      {view}
      {loginOpen && <LoginModal onClose={() => { setLoginOpen(false); setPendingPick(null); }} onLogin={() => { setLoggedIn(true); setLoginOpen(false); if (pendingPick) { const id = pendingPick; setPendingPick(null); doPick(id); } }} />}
      <BasketPanel open={basketOpen} items={basket} onClose={() => setBasketOpen(false)} onRemove={removeFromBasket} onClear={() => setBasket([])} onOpenContent={() => { setBasketOpen(false); setScreen("works"); }} />
      <ContentPanel open={contentOpen} onClose={() => setContentOpen(false)} onResume={(item) => { setContentOpen(false); resumeCreation(item); }} />
      <TweaksPanel>
        <TweakSection label="主题" />
        <TweakColor label="主色" value={t.primary} options={PRIMARY_OPTIONS} onChange={(v) => setTweak("primary", v)} />
        <TweakSection label="首页方向" />
        <TweakRadio
          label="布局"
          value={t.homeLayout}
          options={["对话优先", "场景宫格", "助手人格"]}
          onChange={(v) => setTweak("homeLayout", v)}
        />
        <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.6, padding: "4px 2px 0" }}>
          切换首页的三种入口方案，体验「直接选场景」与「输入需求 → AI 识别」两条路径。
        </div>
        <TweakSection label="账号" />
        <TweakToggle label="已登录" value={loggedIn} onChange={(v) => setLoggedIn(v)} />
        <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.6, padding: "4px 2px 0" }}>
          关闭可预览「未登录」首页——记忆功能收起，改为引导登录的钩子。
        </div>
      </TweaksPanel>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
