// workspace_textbook_cards.jsx — 知识卡片：把一次问教材回答二次加工成一张紧凑、可嵌课件 / 供学生复习的卡片。
// 卡片结构随问题类型变化（对比→表、原因/原理→步骤、归纳/概念→清单），但都从回答里提炼，继承其依据。

function TbCardSection({ s }) {
  if (s.kind === "table") {
    return (
      <div style={{ border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden", marginTop: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 1fr", background: "var(--surface-2)", fontSize: 12, fontWeight: 800, color: "var(--ink-2)" }}>
          <div style={{ padding: "7px 10px" }}>维度</div>
          <div style={{ padding: "7px 10px", borderLeft: "1px solid var(--line)", color: `oklch(0.5 0.13 ${s.colHues ? s.colHues[0] : 200})` }}>{s.cols[0]}</div>
          <div style={{ padding: "7px 10px", borderLeft: "1px solid var(--line)", color: `oklch(0.52 0.12 ${s.colHues ? s.colHues[1] : 145})` }}>{s.cols[1]}</div>
        </div>
        {s.rows.map((r, j) => (
          <div key={j} style={{ display: "grid", gridTemplateColumns: "70px 1fr 1fr", fontSize: 12, lineHeight: 1.5, borderTop: "1px solid var(--line)" }}>
            <div style={{ padding: "8px 10px", fontWeight: 700, color: "var(--ink-2)", background: "var(--surface-2)" }}>{r.label}</div>
            <div style={{ padding: "8px 10px", borderLeft: "1px solid var(--line)", color: "var(--ink)" }}>{r.a}</div>
            <div style={{ padding: "8px 10px", borderLeft: "1px solid var(--line)", color: "var(--ink)" }}>{r.b}</div>
          </div>
        ))}
      </div>
    );
  }
  if (s.kind === "steps") {
    return (
      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-2)", marginBottom: 7 }}>{s.title}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {s.items.map((it, j) => (
            <div key={j} style={{ display: "flex", gap: 9, alignItems: "stretch" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <span style={{ width: 20, height: 20, borderRadius: 999, background: "var(--brand)", color: "#fff", fontSize: 11, fontWeight: 800, display: "grid", placeItems: "center", fontFamily: "var(--font-num)" }}>{j + 1}</span>
                {j < s.items.length - 1 && <span style={{ flex: 1, width: 2, background: "var(--brand-soft-border)", minHeight: 10 }} />}
              </div>
              <p style={{ margin: 0, paddingBottom: j < s.items.length - 1 ? 11 : 0, fontSize: 12.5, lineHeight: 1.6, color: "var(--ink)", flex: 1 }}>{it}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  // list
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-2)", marginBottom: 7 }}>{s.title}</div>
      <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
        {s.items.map((it, j) => (
          <li key={j} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12.5, lineHeight: 1.6, color: "var(--ink)" }}>
            <span style={{ flexShrink: 0, width: 5, height: 5, borderRadius: 2, background: "var(--brand)", marginTop: 7 }} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// the card surface itself (also reusable inline / for export preview)
function KnowledgeCardFace({ card }) {
  return (
    <div style={{ background: "var(--surface)", borderRadius: 14, border: "1px solid var(--line)", overflow: "hidden" }}>
      <div style={{ padding: "16px 18px 14px", background: `linear-gradient(135deg, oklch(0.96 0.04 ${card.hue}), oklch(0.99 0.012 ${card.hue}))`, borderBottom: `1px solid oklch(0.9 0.05 ${card.hue})` }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 9px", borderRadius: 999, background: "#fff", border: `1px solid oklch(0.88 0.06 ${card.hue})`, color: `oklch(0.45 0.12 ${card.hue})`, fontSize: 10.5, fontWeight: 800, marginBottom: 9 }}>
          <Icon name={card.icon} size={11} /> {card.typeLabel} · 知识卡片
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, color: "var(--ink)", letterSpacing: "-.2px", lineHeight: 1.3 }}>{card.title}</div>
      </div>
      <div style={{ padding: "14px 18px 16px" }}>
        {card.summary && <p style={{ margin: 0, fontSize: 13, lineHeight: 1.68, color: "var(--ink)", fontWeight: 500 }}>{card.summary}</p>}
        {card.sections.map((s, i) => <TbCardSection key={i} s={s} />)}
        {card.memo && (
          <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center", padding: "9px 12px", borderRadius: 10, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)" }}>
            <Icon name="spark" size={14} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--brand-deep)", lineHeight: 1.55 }}>{card.memo}</span>
          </div>
        )}
        <div style={{ marginTop: 13, paddingTop: 10, borderTop: "1px dashed var(--line)", display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, color: "var(--ink-3)", fontWeight: 600 }}>
          {card.grounded
            ? <React.Fragment><Icon name="shield" size={12} /> <span>{card.basisLabel || "依据教材整理"}</span></React.Fragment>
            : <React.Fragment><Icon name="alert" size={12} /> <span>{card.basisLabel || "通用知识，未绑定教材版本"}</span></React.Fragment>}
        </div>
      </div>
    </div>
  );
}

// modal shown when the teacher clicks 「生成知识卡片」on an answer
function KnowledgeCardModal({ card, onClose, onToast }) {
  if (!card) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 130, background: "rgba(18,24,38,.5)", backdropFilter: "blur(2px)", display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(460px, 94vw)", maxHeight: "88vh", display: "flex", flexDirection: "column", fontFamily: "var(--font-zh)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", display: "inline-flex", alignItems: "center", gap: 7 }}>
            <Icon name="spark" size={15} /> 知识卡片
          </span>
          <button onClick={onClose} aria-label="关闭" style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "rgba(255,255,255,.18)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}><Icon name="close" size={15} sw={2.4} /></button>
        </div>
        <div style={{ overflowY: "auto", borderRadius: 14, boxShadow: "0 24px 60px -20px rgba(0,0,0,.5)" }}>
          <KnowledgeCardFace card={card} />
        </div>
        <div style={{ display: "flex", gap: 9, marginTop: 12, justifyContent: "center" }}>
          <button onClick={() => { onToast && onToast("已复制卡片内容（演示）"); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,.3)", background: "rgba(255,255,255,.14)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>
            <Icon name="quote" size={14} /> 复制文本
          </button>
          <button onClick={() => { onToast && onToast("已加入「我的内容」（演示）"); onClose && onClose(); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, border: "none", background: "var(--brand)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>
            <Icon name="plus" size={14} /> 存入我的内容
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 把知识卡片渲染成一张 16:9 的 PPT 尺寸图片（真实可下载 / 可插入课件）──
function oklchToRgb(L, C, H) {
  const hr = (H * Math.PI) / 180;
  const a = Math.cos(hr) * C, b = Math.sin(hr) * C;
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  const f = (x) => { x = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055; return Math.max(0, Math.min(1, x)); };
  return [Math.round(f(r) * 255), Math.round(f(g) * 255), Math.round(f(bl) * 255)];
}
const oklchCss = (L, C, H) => { const [r, g, b] = oklchToRgb(L, C, H); return `rgb(${r},${g},${b})`; };

function drawKnowledgeCardCanvas(card, scale) {
  scale = scale || 2;
  const W = 1600, H = 900, PAD = 80;
  const cv = document.createElement("canvas");
  cv.width = W * scale; cv.height = H * scale;
  const ctx = cv.getContext("2d");
  ctx.scale(scale, scale);
  const ZH = '"PingFang SC","Microsoft YaHei",system-ui,sans-serif';
  const font = (sz, w) => `${w || 400} ${sz}px ${ZH}`;
  const hue = card.hue || 210;
  const accent = oklchCss(0.55, 0.14, hue), accentDeep = oklchCss(0.42, 0.13, hue);
  const soft = oklchCss(0.96, 0.035, hue), soft2 = oklchCss(0.985, 0.012, hue), softBd = oklchCss(0.88, 0.06, hue);
  const INK = "#1f2430", INK2 = "#39414d", INK3 = "#6b7280", LINE = "#e5e8ee", SURF2 = "#f5f7fa";
  const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  const wrap = (text, maxW) => {
    const out = []; let line = "";
    for (const ch of String(text || "")) {
      if (ch === "\n") { out.push(line); line = ""; continue; }
      if (ctx.measureText(line + ch).width > maxW && line) { out.push(line); line = ch; } else line += ch;
    }
    if (line) out.push(line);
    return out;
  };

  // bg
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
  // header band
  ctx.fillStyle = soft; rr(0, 0, W, 196, 0); ctx.fill();
  ctx.fillStyle = soft2; ctx.fillRect(0, 150, W, 46);
  // accent left bar
  ctx.fillStyle = accent; ctx.fillRect(0, 0, 12, H);
  // pill
  ctx.font = font(22, 700);
  const pillText = `${card.typeLabel} · 知识卡片`;
  const pw = ctx.measureText(pillText).width + 56;
  ctx.fillStyle = "#fff"; rr(PAD, 48, pw, 44, 22); ctx.fill();
  ctx.strokeStyle = softBd; ctx.lineWidth = 1.5; rr(PAD, 48, pw, 44, 22); ctx.stroke();
  ctx.fillStyle = accentDeep; ctx.beginPath(); ctx.arc(PAD + 26, 70, 7, 0, 7); ctx.fill();
  ctx.fillStyle = accentDeep; ctx.textBaseline = "middle"; ctx.fillText(pillText, PAD + 42, 71);
  // title
  ctx.fillStyle = INK; ctx.textBaseline = "alphabetic";
  ctx.font = font(50, 800);
  const titleLines = wrap(card.title, W - PAD * 2).slice(0, 2);
  let ty = 150;
  titleLines.forEach((ln) => { ctx.fillText(ln, PAD, ty); ty += 60; });

  // body
  let y = 250;
  if (card.summary) {
    ctx.fillStyle = INK2; ctx.font = font(28, 500);
    const lines = wrap(card.summary, W - PAD * 2).slice(0, 3);
    lines.forEach((ln) => { ctx.fillText(ln, PAD, y); y += 44; });
    y += 14;
  }

  const sec = (card.sections || [])[0];
  const footY = 812;
  const memoH = card.memo ? 84 : 0;
  const avail = footY - memoH - 24 - y;
  if (sec && sec.kind === "table") {
    const x0 = PAD, tableW = W - PAD * 2;
    const c0 = 230, c1 = (tableW - c0) / 2;
    const hHues = sec.colHues || [200, 145];
    const rows = sec.rows.slice(0, 4);
    // measure row heights
    ctx.font = font(24, 400);
    const cellLines = rows.map((r) => Math.max(wrap(r.a, c1 - 36).length, wrap(r.b, c1 - 36).length, 1));
    const headH = 50;
    let rowHs = cellLines.map((n) => Math.max(58, n * 34 + 26));
    let total = headH + rowHs.reduce((a, b) => a + b, 0);
    if (total > avail) { const k = avail / total; rowHs = rowHs.map((h) => h * k); total = avail; }
    // header
    ctx.fillStyle = SURF2; rr(x0, y, tableW, headH, 12); ctx.fill();
    ctx.font = font(23, 800);
    ctx.fillStyle = INK2; ctx.textBaseline = "middle"; ctx.fillText("维度", x0 + 22, y + headH / 2);
    ctx.fillStyle = oklchCss(0.5, 0.13, hHues[0]); ctx.fillText(sec.cols[0], x0 + c0 + 22, y + headH / 2);
    ctx.fillStyle = oklchCss(0.5, 0.12, hHues[1]); ctx.fillText(sec.cols[1], x0 + c0 + c1 + 22, y + headH / 2);
    let ry = y + headH;
    rows.forEach((r, i) => {
      const h = rowHs[i];
      ctx.fillStyle = SURF2; ctx.fillRect(x0, ry, c0, h);
      ctx.strokeStyle = LINE; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, ry); ctx.lineTo(x0 + tableW, ry); ctx.stroke();
      ctx.font = font(23, 700); ctx.fillStyle = INK2; ctx.textBaseline = "middle"; ctx.fillText(r.label, x0 + 22, ry + h / 2);
      ctx.font = font(23, 400); ctx.fillStyle = INK;
      const drawCell = (txt, cx, cw) => {
        const ls = wrap(txt, cw - 36); const lh = 32; const sy = ry + h / 2 - ((ls.length - 1) * lh) / 2;
        ls.forEach((ln, k) => ctx.fillText(ln, cx + 18, sy + k * lh));
      };
      drawCell(r.a, x0 + c0, c1); drawCell(r.b, x0 + c0 + c1, c1);
      ry += h;
    });
    // outer border + column dividers
    ctx.strokeStyle = LINE; ctx.lineWidth = 1.5; rr(x0, y, tableW, ry - y, 12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0 + c0, y); ctx.lineTo(x0 + c0, ry); ctx.moveTo(x0 + c0 + c1, y); ctx.lineTo(x0 + c0 + c1, ry); ctx.stroke();
    y = ry + 18;
  } else if (sec && (sec.kind === "steps" || sec.kind === "list")) {
    ctx.textBaseline = "alphabetic";
    ctx.font = font(24, 800); ctx.fillStyle = INK2; ctx.fillText(sec.title || "要点", PAD, y); y += 40;
    ctx.font = font(25, 400);
    sec.items.slice(0, 5).forEach((it, i) => {
      const num = sec.kind === "steps" ? `${i + 1}` : "•";
      ctx.fillStyle = accentDeep; ctx.font = font(22, 800); ctx.fillText(num, PAD, y);
      ctx.fillStyle = INK; ctx.font = font(25, 400);
      const ls = wrap(it, W - PAD * 2 - 44);
      ls.forEach((ln, k) => { ctx.fillText(ln, PAD + 40, y + k * 38); });
      y += Math.max(44, ls.length * 38 + 8);
    });
  }

  // memo
  if (card.memo) {
    const my = footY - memoH;
    ctx.fillStyle = soft; rr(PAD, my, W - PAD * 2, 64, 12); ctx.fill();
    ctx.strokeStyle = softBd; ctx.lineWidth = 1.5; rr(PAD, my, W - PAD * 2, 64, 12); ctx.stroke();
    ctx.fillStyle = accentDeep; ctx.font = font(24, 700); ctx.textBaseline = "middle";
    const memoLine = wrap(card.memo, W - PAD * 2 - 48)[0];
    ctx.fillText(memoLine, PAD + 24, my + 33);
    ctx.textBaseline = "alphabetic";
  }
  // footer
  ctx.fillStyle = INK3; ctx.font = font(20, 600);
  ctx.fillText((card.grounded ? "● " : "○ ") + (card.basisLabel || "依据教材整理") + "　·　AI 小博士 · 知识卡片", PAD, 868);
  return cv;
}

// 内联展示用：把卡片画成 16:9 图片，并提供真实下载 / 存入我的内容（作为可插课件的图片）
function KnowledgeCardImage({ card, onToast, compact }) {
  const [url, setUrl] = React.useState(null);
  const canvasRef = React.useRef(null);
  React.useEffect(() => {
    try {
      const cv = drawKnowledgeCardCanvas(card, 2);
      canvasRef.current = cv;
      setUrl(cv.toDataURL("image/png"));
    } catch (e) { /* noop */ }
  }, [card]);
  const fname = `知识卡片-${(card.title || "card").slice(0, 16)}.png`;
  const download = () => {
    const cv = canvasRef.current; if (!cv) return;
    cv.toBlob((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = fname; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    }, "image/png");
    onToast && onToast("已下载知识卡片图片");
  };
  const save = () => {
    try {
      const store = JSON.parse(localStorage.getItem("aida_mycontent") || "[]");
      store.unshift({ id: "kc" + Date.now(), kind: "image", title: card.title, dataURL: url, w: 1600, h: 900, when: Date.now() });
      localStorage.setItem("aida_mycontent", JSON.stringify(store.slice(0, 40)));
    } catch (e) { /* quota */ }
    onToast && onToast("已存入「我的内容」· 可在做课件中插入");
  };
  return (
    <div style={{ width: "100%", maxWidth: compact ? 460 : 520 }}>
      <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: 14, border: "1px solid var(--line)", overflow: "hidden", background: "var(--surface-2)", boxShadow: "0 14px 36px -22px rgba(0,0,0,.4)" }}>
        {url
          ? <img src={url} alt="知识卡片" style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "var(--ink-3)", fontSize: 12.5 }}>正在生成卡片图片…</div>}
      </div>
      {!compact && (
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={save} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "none", background: "var(--brand)", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}><Icon name="plus" size={13} /> 存入我的内容</button>
          <button onClick={download} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}><Icon name="download" size={13} /> 下载图片</button>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { KnowledgeCardFace, KnowledgeCardModal, KnowledgeCardImage, drawKnowledgeCardCanvas });
