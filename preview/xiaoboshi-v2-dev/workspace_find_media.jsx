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
