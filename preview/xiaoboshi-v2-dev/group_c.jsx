// ======== workspace_find_media.jsx ========
// workspace_find_media.jsx — video & album presentation for 找资源
const { useState: mS, useEffect: mE, useRef: mR } = React;

function parseDur(d) {
  const p = String(d).split(":").map(Number);
  return p.length === 2 ? p[0] * 60 + p[1] : p[0];
}
function fmtTime(s) {
  s = Math.max(0, Math.floor(s));
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, "0");
  return `${m}:${ss}`;
}

// ---- VIDEO CARD ---- (compact, scannable list row — detail lives in the player)
function VideoCard({ v, onPlay, onDownload, source }) {
  const mobile = useIsMobile();
  const thumbW = mobile ? 116 : 150;
  return (
    <div
      className="res-card"
      style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 10, display: "flex", flexDirection: "row", gap: 12, cursor: "pointer", transition: "box-shadow .2s, border-color .2s" }}
      onClick={onPlay}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 10px 24px -18px rgba(0,0,0,.3)"; e.currentTarget.style.borderColor = "var(--brand-soft-border)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "var(--line)"; }}
    >
      {/* thumbnail */}
      <div className="ph-stripe" style={{ width: thumbW, flexShrink: 0, aspectRatio: "16/9", borderRadius: 10, position: "relative", display: "grid", placeItems: "center", overflow: "hidden" }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,.92)", display: "grid", placeItems: "center", boxShadow: "0 4px 14px rgba(0,0,0,.25)", color: "var(--brand-deep)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        </div>
        <span style={{ position: "absolute", bottom: 5, right: 5, background: "rgba(0,0,0,.72)", color: "#fff", fontSize: 10.5, fontWeight: 700, padding: "1px 5px", borderRadius: 4, fontFamily: "var(--font-num)" }}>{v.duration}</span>
        <span style={{ position: "absolute", top: 5, left: 5, background: "var(--accent)", color: "#fff", fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 4 }}>{v.cat}</span>
      </div>
      {/* body */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{v.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11.5, color: "var(--ink-3)", flexWrap: "wrap", rowGap: 3 }}>
          <span style={{ fontWeight: 700, color: "var(--ink-2)", whiteSpace: "nowrap" }}>{v.grade}{v.subject}</span>
          <span style={{ whiteSpace: "nowrap" }}>{v.quality}</span>
          <span style={{ whiteSpace: "nowrap" }}>{v.chapters.length} 章节</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}><Icon name="eye" size={12} /> {v.plays}</span>
        </div>
      </div>
    </div>
  );
}

// ---- VIDEO PLAYER (modal) ----
function VideoPlayer({ v, onClose, onDownload, onAsk, onAddBasket, loggedIn }) {
  const mobile = useIsMobile();
  const total = parseDur(v.duration);
  const [playing, setPlaying] = mS(true);
  const [cur, setCur] = mS(0);
  mE(() => {
    if (!playing) return;
    const id = setInterval(() => setCur((c) => (c >= total ? (clearInterval(id), total) : c + 1)), 250);
    return () => clearInterval(id);
  }, [playing, total]);
  const pct = total ? (cur / total) * 100 : 0;
  const seek = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setCur(Math.round(((e.clientX - r.left) / r.width) * total));
  };
  const activeChapter = [...v.chapters].reverse().find((c) => parseDur(c.t) <= cur);

  return (
    <div className="drawer-pop" style={{ position: "absolute", inset: 0, zIndex: 25, background: "var(--surface)", display: "flex", flexDirection: "column" }}>
      {/* header */}
      <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)", background: "var(--surface)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <button onClick={onClose} title="返回结果" style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}>
          <Icon name="back" size={16} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.title}</div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>学科网 · 教学视频 · {v.duration} · {v.quality}</div>
        </div>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}>
          <Icon name="close" size={16} sw={2.4} />
        </button>
      </div>
      {/* body: stage + chapters (asks & actions live at the bottom, thumb-reachable) */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: mobile ? "column" : "row" }}>
          {/* stage + controls */}
          <div style={{ flex: 1, minWidth: 0, minHeight: mobile ? 220 : 0, background: "#0c0b0a", display: "flex", flexDirection: "column" }}>
            <div style={{ position: "relative", flex: 1, minHeight: 0, background: "radial-gradient(circle at 50% 40%, #2a2722, #0c0b0a)", display: "grid", placeItems: "center" }}>
              <div onClick={() => setPlaying((p) => !p)} style={{ width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,.16)", backdropFilter: "blur(4px)", display: "grid", placeItems: "center", cursor: "pointer", color: "#fff", border: "2px solid rgba(255,255,255,.5)" }}>
                {playing ? (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                )}
              </div>
              <div style={{ position: "absolute", top: 14, left: 16, color: "rgba(255,255,255,.85)", fontSize: 12.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ background: "var(--accent)", padding: "2px 8px", borderRadius: 5, fontWeight: 800, fontSize: 11 }}>{v.cat}</span>
                {activeChapter ? activeChapter.name : "准备播放"}
              </div>
              <div style={{ position: "absolute", bottom: 14, right: 16, color: "rgba(255,255,255,.5)", fontSize: 11, fontWeight: 700 }}>学科网 · 教学视频 · {v.quality}</div>
            </div>
            {/* control bar */}
            <div style={{ padding: "12px 16px 16px", flexShrink: 0 }}>
              <div onClick={seek} style={{ height: 6, background: "rgba(255,255,255,.18)", borderRadius: 4, cursor: "pointer", position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: "var(--brand)", borderRadius: 4 }} />
                <div style={{ position: "absolute", left: `${pct}%`, top: "50%", transform: "translate(-50%,-50%)", width: 13, height: 13, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.4)" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 11, color: "rgba(255,255,255,.85)" }}>
                <span onClick={() => setPlaying((p) => !p)} style={{ cursor: "pointer", display: "inline-flex" }}>
                  {playing ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  )}
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 700, fontFamily: "var(--font-num)" }}>{fmtTime(cur)} / {v.duration}</span>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 12, border: "1px solid rgba(255,255,255,.3)", padding: "2px 7px", borderRadius: 5, cursor: "pointer" }}>倍速 1.0x</span>
                <span style={{ fontSize: 12, border: "1px solid rgba(255,255,255,.3)", padding: "2px 7px", borderRadius: 5, cursor: "pointer" }}>{v.quality}</span>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ cursor: "pointer" }}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" strokeLinecap="round" /></svg>
              </div>
            </div>
          </div>
          {/* chapters sidebar */}
          <div style={{ width: mobile ? "100%" : 268, flexShrink: 0, borderLeft: mobile ? "none" : "1px solid var(--line)", borderTop: mobile ? "1px solid var(--line)" : "none", display: "flex", flexDirection: "column", minHeight: 0, maxHeight: mobile ? "42%" : "none" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>视频章节</span>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
              {v.chapters.map((c, i) => {
                const on = activeChapter && activeChapter.t === c.t;
                return (
                  <div key={i} onClick={() => setCur(parseDur(c.t))} style={{ display: "flex", gap: 10, padding: "9px 10px", borderRadius: 10, cursor: "pointer", background: on ? "var(--brand-soft)" : "transparent" }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: on ? "var(--brand-deep)" : "var(--ink-3)", fontFamily: "var(--font-num)", flexShrink: 0, paddingTop: 1 }}>{c.t}</span>
                    <span style={{ fontSize: 12.5, fontWeight: on ? 700 : 500, color: on ? "var(--brand-deep)" : "var(--ink-2)", lineHeight: 1.5 }}>{c.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
      </div>
      {/* bottom: keep-collaborating asks (sticky) + actions */}
      <div style={{ flexShrink: 0, borderTop: "1px solid var(--line)", background: "var(--surface)" }}>
        <AskBar item={v} loggedIn={loggedIn} onAsk={onAsk} />
        <div style={{ padding: 14, display: "flex", gap: 10, alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap", rowGap: 10 }}>
          <Btn kind="soft" icon="basket" onClick={() => onAddBasket && onAddBasket({ id: v.id, title: v.title, type: v.cat || "教学视频", meta: [v.grade, v.subject, v.duration].filter(Boolean).join(" · ") })}>加入资源篮</Btn>
          <Btn kind="primary" icon="download" onClick={onDownload}>下载视频</Btn>
        </div>
      </div>
    </div>
  );
}

// ---- ALBUM CARD (in results) ----
const TYPE_HUE = { 课件: 255, 教案: 320, 学案: 200, 作业: 25, 试卷: 25, 题集: 150, 素材: 95, 微课: 200, 视频: 200 };

// file-type badge for album resource rows (P=课件/PPT, W=教案/Word, 练=作业, 讲=讲义…)
const FILE_BADGE = {
  PPT: { ch: "P", c: "#E0742F", bg: "#FBEDE3" },
  Word: { ch: "W", c: "#2A6FDB", bg: "#E8F0FC" },
  作业: { ch: "练", c: "#E0742F", bg: "#FBEDE3" },
  讲义: { ch: "讲", c: "#7A5AF0", bg: "#EDE9FB" },
  题集: { ch: "题", c: "#1F9D55", bg: "#E6F4EC" },
};
function FileBadge({ fmt, type }) {
  const b = FILE_BADGE[fmt] || FILE_BADGE[type] || { ch: (type || "资").slice(0, 1), c: "var(--brand-deep)", bg: "var(--brand-soft)" };
  return <span style={{ width: 24, height: 24, borderRadius: 6, background: b.bg, color: b.c, border: `1px solid ${b.c}40`, display: "grid", placeItems: "center", fontSize: 12.5, fontWeight: 800, flexShrink: 0, fontFamily: "var(--font-num)" }}>{b.ch}</span>;
}
function albumCount(a) { return (a.units || []).reduce((s, u) => s + u.lessons.reduce((t, l) => t + l.items.length, 0), 0); }

function AlbumCard({ a, onOpen, source }) {
  return (
    <div
      className="res-card"
      style={{ position: "relative", background: "var(--surface)", border: "1px solid var(--brand-soft-border)", borderRadius: 14, padding: 11, cursor: "pointer", transition: "box-shadow .2s, transform .15s", display: "flex", gap: 12, alignItems: "center" }}
      onClick={onOpen}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 12px 28px -16px rgba(0,0,0,.3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
    >
      {/* stacked cover (compact) */}
      <div style={{ position: "relative", width: 64, height: 80, flexShrink: 0 }}>
        <div className="ph-stripe" style={{ position: "absolute", inset: "6px 0 0 7px", borderRadius: 7, opacity: 0.5 }} />
        <div className="ph-stripe" style={{ position: "absolute", inset: "3px 3px 3px 4px", borderRadius: 7, opacity: 0.75 }} />
        <div style={{ position: "absolute", inset: "0 6px 6px 0", borderRadius: 7, background: "linear-gradient(160deg, var(--brand), var(--brand-deep))", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 8, color: "#fff" }}>
          <Icon name="layers" size={16} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "var(--font-num)", lineHeight: 1 }}>{a.total}</div>
            <div style={{ fontSize: 9, opacity: 0.9 }}>份资料</div>
          </div>
        </div>
      </div>
      {/* body */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", rowGap: 4 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "var(--brand-soft)", color: "var(--brand-deep)", border: "1px solid var(--brand-soft-border)", fontSize: 10, fontWeight: 800, padding: "1px 7px", borderRadius: 5, flexShrink: 0 }}>
            <Icon name="layers" size={11} /> 专辑
          </span>
          <span style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.edition} · {a.grade}{a.subject}</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.title}</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          含 {a.composition.map((c) => `${c.type}${c.n}`).join(" · ")}
        </div>
      </div>
      <Icon name="chevronRight" size={18} />
    </div>
  );
}

// ---- ALBUM PAGE (overlay) ----
function AlbumPage({ a, onClose, onPreviewItem, onPlayItem, onDownload, onAddBasket, onAsk, loggedIn }) {
  const mobile = useIsMobile();
  const total = a.composition.reduce((s, c) => s + c.n, 0);
  return (
    <div className="drawer-pop" style={{ position: "absolute", inset: 0, background: "var(--canvas)", zIndex: 25, display: "flex", flexDirection: "column" }}>
      {/* slim sticky back bar — only this stays fixed, so the resource list gets full room */}
      <div style={{ padding: "10px 24px", borderBottom: "1px solid var(--line)", background: "var(--surface)", flexShrink: 0 }}>
        <button onClick={onClose} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 11px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)" }}>
          <Icon name="back" size={15} /> 返回搜索结果
        </button>
      </div>
      {/* cover + title + composition scroll WITH the list (no longer frozen) */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: "16px 24px 18px", borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
        <div style={{ display: "flex", gap: 18 }}>
          <div style={{ width: 92, height: 118, flexShrink: 0, borderRadius: 10, background: "linear-gradient(160deg, var(--brand), var(--brand-deep))", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 12, color: "#fff", boxShadow: "0 10px 24px -12px var(--brand-glow)" }}>
            <Icon name="layers" size={22} />
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "var(--font-num)", lineHeight: 1 }}>{a.total}</div>
              <div style={{ fontSize: 10.5, opacity: 0.9 }}>份精品资料</div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--brand-grad)", backgroundColor: "var(--brand)", color: "#fff", fontSize: 11.5, fontWeight: 800, padding: "3px 10px", borderRadius: 6 }}><Icon name="layers" size={13} /> 专辑合集</span>
            </div>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: "var(--ink)", margin: "0 0 10px", lineHeight: 1.4 }}>{a.title}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: mobile ? 12 : 18, fontSize: 12.5, color: "var(--ink-3)", flexWrap: "wrap", rowGap: 10 }}>
              <span>{a.edition} · {a.grade} · {a.subject}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="download" size={13} /> {a.downloads} 次下载</span>
              <span>更新 {a.updated}</span>
              <div style={{ flex: 1, minWidth: mobile ? 0 : 12 }} />
              <Btn kind="soft" icon="basket" onClick={() => onAddBasket && onAddBasket({ id: a.id, title: a.title, type: "专辑·" + a.total + "份", meta: [a.edition, a.grade, a.subject].filter(Boolean).join(" · ") })}>加入资源篮</Btn>
              <Btn kind="primary" icon="download" onClick={() => onDownload("已开始打包下载整个专辑")}>一键打包下载</Btn>
            </div>
          </div>
        </div>
        {/* composition bar */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", height: 9, borderRadius: 5, overflow: "hidden", border: "1px solid var(--line)" }}>
            {a.composition.map((c, i) => (
              <div key={i} title={`${c.type} ${c.n}`} style={{ width: `${(c.n / total) * 100}%`, background: `oklch(0.62 0.13 ${TYPE_HUE[c.type] || 150})` }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
            {a.composition.map((c, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: `oklch(0.62 0.13 ${TYPE_HUE[c.type] || 150})` }} /> {c.type} {c.n}
              </span>
            ))}
          </div>
        </div>
        </div>
        {/* item list — 全量层级展开：单元 → 课文 / 专题 → 资料（仅文档类，样式与资源列表一致）*/}
        <div style={{ padding: "10px 24px 24px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "8px 2px 10px", borderBottom: "1px solid var(--line)", marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--ink-2)" }}>专辑内全部资料</span>
          <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>共 {albumCount(a)} 份 · 按单元 / 课时编排</span>
        </div>
        {(a.units || []).map((u, ui) => (
          <div key={ui} style={{ marginTop: ui ? 14 : 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 2px" }}>
              <Icon name="layers" size={14} />
              <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>{u.name}</span>
            </div>
            {u.lessons.map((l, li) => (
              <div key={li} style={{ marginLeft: 6 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-2)", padding: "8px 0 5px 16px" }}>{l.name}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 1, marginLeft: 16, paddingLeft: 9, borderLeft: "1.5px solid var(--line)" }}>
                  {l.items.map((it, ii) => (
                    <div
                      key={ii}
                      onClick={() => onPreviewItem(it)}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 9, cursor: "pointer", transition: "background .15s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-2)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <FileBadge fmt={it.fmt} type={it.type} />
                      <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--ink)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</span>
                      <span style={{ fontSize: 11, color: "var(--ink-3)", whiteSpace: "nowrap", flexShrink: 0 }}>{it.type}{it.pages ? ` · ${it.pages}页` : ""}{it.q ? ` · ${it.q}题` : ""}</span>
                      <Icon name="chevronRight" size={15} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
        </div>
      </div>
      {/* album-level 问小博士 — pinned at the bottom, consistent with 文档预览 / 视频播放 */}
      <div style={{ flexShrink: 0, borderTop: "1px solid var(--line)", background: "var(--surface)" }}>
        <AskBar item={a} loggedIn={loggedIn} onAsk={onAsk} />
      </div>
    </div>
  );
}

Object.assign(window, { VideoCard, VideoPlayer, AlbumCard, AlbumPage, parseDur, fmtTime });


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
