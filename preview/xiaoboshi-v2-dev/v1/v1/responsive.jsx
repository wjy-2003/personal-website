// responsive.jsx — mobile/tablet adaptation primitives
// One global hook + a shared bottom-sheet used by the workspaces.
const { useState: rS, useEffect: rE } = React;

// Primary breakpoint: phones + portrait tablets (iPad portrait ≈ 768–834).
// At/below this we switch to the single-column, drawer/sheet patterns.
const MOBILE_BP = 900;
const NARROW_BP = 600; // finer tier for grids

function useIsMobile(bp) {
  bp = bp || MOBILE_BP;
  const get = () => {
    if (typeof window === "undefined") return false;
    const w = window.__forceW || window.innerWidth;
    return w <= bp;
  };
  const [m, setM] = rS(get);
  rE(() => {
    const on = () => setM(get());
    window.addEventListener("resize", on);
    window.addEventListener("orientationchange", on);
    return () => { window.removeEventListener("resize", on); window.removeEventListener("orientationchange", on); };
  }, [bp]);
  return m;
}

// Reflect mobile state on <body> so CSS media-query overrides can take effect.
function useBodyMobileFlag() {
  const mobile = useIsMobile();
  rE(() => { document.body.classList.toggle("is-mobile", mobile); }, [mobile]);
  return mobile;
}

// Context lets ChatPanel / content cards open or close the content sheet.
const WSMobileContext = React.createContext(null);

// ---- Bottom sheet: slides up from the bottom, fills the workspace area ----
// Used to present the workspace's "result / canvas / courseware" pane on phones
// while the chat stays the home base underneath.
function MobileSheet({ open, onClose, title, children, headerRight }) {
  // lock body scroll while open
  rE(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <React.Fragment>
      {/* scrim */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 70,
          background: "rgba(20,16,10,.42)",
          backdropFilter: "blur(2px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity .26s ease",
        }}
      />
      {/* sheet */}
      <div
        style={{
          position: "fixed", left: 0, right: 0, bottom: 0,
          height: "94dvh", maxHeight: "94vh",
          zIndex: 71,
          background: "var(--canvas)",
          borderRadius: "18px 18px 0 0",
          boxShadow: "0 -18px 50px -24px rgba(0,0,0,.5)",
          display: "flex", flexDirection: "column",
          transform: open ? "translateY(0)" : "translateY(101%)",
          transition: "transform .3s cubic-bezier(.32,.72,0,1)",
          overflow: "hidden",
        }}
      >
        {/* grab handle + header */}
        <div style={{ flexShrink: 0, paddingTop: 8 }}>
          <div style={{ width: 40, height: 4, borderRadius: 999, background: "var(--line)", margin: "0 auto 6px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 14px 12px", borderBottom: "1px solid var(--line)" }}>
            <button
              onClick={onClose}
              aria-label="返回对话"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 36, padding: "0 12px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", flexShrink: 0 }}
            >
              <Icon name="chat" size={16} /> 对话
            </button>
            <div style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 800, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "center" }}>{title}</div>
            {headerRight ? <div style={{ flexShrink: 0 }}>{headerRight}</div> : <div style={{ width: 64, flexShrink: 0 }} />}
          </div>
        </div>
        {/* body — the workspace content pane lives here, fills remaining space.
            We force the content root to flex/minHeight:0 so its own internal
            scroll regions (lists, drawers with pinned footers) work on mobile. */}
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", position: "relative" }}>
          {React.Children.map(children, (child) =>
            React.isValidElement(child)
              ? React.cloneElement(child, { style: { ...(child.props.style || {}), flex: 1, minHeight: 0, minWidth: 0 } })
              : child
          )}
        </div>
      </div>
    </React.Fragment>
  );
}

// A compact pill button (used in the workspace header to reveal the sheet).
function SheetPill({ label, icon = "layers", onClick, dot }) {
  return (
    <button
      onClick={onClick}
      style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6, height: 38, padding: "0 14px", borderRadius: 11, border: "none", background: "var(--brand-grad)", backgroundColor: "var(--brand)", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", flexShrink: 0, boxShadow: "0 4px 14px -6px var(--brand-glow)" }}
    >
      <Icon name={icon} size={16} /> {label}
      {dot && <span style={{ position: "absolute", top: 6, right: 8, width: 7, height: 7, borderRadius: "50%", background: "#fff", boxShadow: "0 0 0 2px var(--brand)" }} />}
    </button>
  );
}

// An in-chat card that reveals the content sheet — a softer, contextual
// alternative to the header pill. Reads as a continuation of 小博士's previous
// reply (no separate avatar; indented to align under that bubble). Mobile
// chat-led layouts only; returns null on desktop so the conversation is unchanged.
function ChatSheetCard({ label, count, icon = "layers", hint }) {
  const ctx = React.useContext(WSMobileContext);
  if (!ctx || !ctx.mobile || !ctx.isChatLed || ctx.sheetOpen) return null;
  return (
    <div style={{ display: "flex", maxWidth: "92%", marginTop: -6 }}>
      {/* spacer matching the avatar column above, so the card lines up under the reply bubble */}
      <div style={{ width: 28, flexShrink: 0, marginRight: 9 }} />
      <button
        onClick={() => ctx.setSheetOpen(true)}
        style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10, textAlign: "left", padding: "11px 12px", borderRadius: "4px 14px 14px 14px", border: "1px solid var(--brand-soft-border)", background: "var(--brand-soft)", cursor: "pointer", fontFamily: "var(--font-zh)" }}
      >
        <span style={{ width: 34, height: 34, borderRadius: 10, background: "var(--surface)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}>
          <Icon name={icon} size={17} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--brand-deep)", lineHeight: 1.35 }}>
            {typeof count === "number" ? `已为你整理 ${count} 个${label}` : `查看${label}`}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, marginTop: 2, display: "inline-flex", alignItems: "center", gap: 4 }}>
            {hint || "点此展开查看"} <Icon name="chevron" size={12} sw={2.4} />
          </div>
        </div>
      </button>
    </div>
  );
}

Object.assign(window, { useIsMobile, useBodyMobileFlag, WSMobileContext, MobileSheet, SheetPill, ChatSheetCard, MOBILE_BP, NARROW_BP });
