// zxxk-search.jsx — 学科网资源站 顶栏 + 搜索区（含三种智能搜索改造方案）
// 所有方案共用同一套站点 chrome（顶栏 / Logo / 热词 / 导航 / 内容示意），
// 只有「搜索区」不同。点击智能搜索 → 跳转到 AI 教学助手并带入输入内容。
const { useState: zS, useEffect: zE, useRef: zR } = React;

// 跳转目标：AI 小博士 · 教学助手「找资源」流程（自动带入 q）
const AI_APP = "index.html";
function gotoAI(q) {
  const v = (q || "").trim();
  const url = AI_APP + (v ? "?q=" + encodeURIComponent(v) : "");
  // 顶层导航，演示「从资源站跳进 AI 助手」的完整动作
  try { (window.top || window).location.href = url; } catch (e) { window.location.href = url; }
}

// 极简判断：自然语言提问 vs 传统关键词
function looksLikeNL(text) {
  const s = (text || "").trim();
  if (!s) return false;
  if (s.length >= 11) return true;
  return /[？?吗呢的了和与帮我给我怎么如何为什么区别按照根据出一份生成讲讲设计制作一套不少于]/.test(s) || /\s/.test(s);
}

// ---- 图标 ----
function ZIcon({ name, size = 18, sw = 2, color = "currentColor" }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
    caret: <path d="m6 9 6 6 6-6" />,
    spark: <path d="M12 3v4m0 10v4m9-9h-4M7 12H3m13.5-5.5-2.5 2.5m-4 4-2.5 2.5m9 0-2.5-2.5m-4-4L7 7" />,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    pin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    upload: <><path d="M12 16V4m0 0 4 4m-4-4-4 4" /><path d="M5 20h14" /></>,
    crown: <path d="M3 7l4 4 5-6 5 6 4-4-2 12H5L3 7Z" />,
    school: <><path d="M3 9.5 12 5l9 4.5-9 4.5-9-4.5Z" /><path d="M7 11.5V16c0 1.1 2.2 2 5 2s5-.9 5-2v-4.5" /></>,
  };
  return <svg {...p} style={{ display: "block", flexShrink: 0 }}>{paths[name] || null}</svg>;
}

// AI 小博士 头像（毕业帽 logo 白色镂空 + 学科网蓝渐变，凸显 AI 能力）
function AiCap({ size = 30, accent }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: "30% 30% 38% 38%",
      background: accent || "linear-gradient(150deg,#3a93f5,#2f73e0 60%,#1f5bc4)",
      display: "grid", placeItems: "center", flexShrink: 0,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.4), 0 4px 12px -4px rgba(47,115,224,.55)",
      position: "relative", overflow: "hidden",
    }}>
      <img src="assets/logo-cap-white.png" alt="" aria-hidden="true" style={{ width: size * 0.62, height: "auto", display: "block" }} />
    </span>
  );
}

// 学科网 wordmark（重绘近似：眼镜帽脸 + 学科网 + 网址）
function ZxxkLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
      <svg width="42" height="42" viewBox="0 0 48 48" style={{ display: "block" }}>
        <circle cx="24" cy="24" r="22" fill="#ffd24a" />
        <path d="M6 18 L24 9 L42 18 L24 27 Z" fill="#3b3b3b" />
        <rect x="22.5" y="22" width="3" height="9" fill="#3b3b3b" />
        <circle cx="22.5" cy="32" r="2.2" fill="#3b3b3b" />
        <circle cx="17" cy="27" r="5.2" fill="#fff" stroke="#3b3b3b" strokeWidth="2" />
        <circle cx="31" cy="27" r="5.2" fill="#fff" stroke="#3b3b3b" strokeWidth="2" />
        <path d="M22.2 27h3.6" stroke="#3b3b3b" strokeWidth="2" />
        <circle cx="17" cy="27" r="1.7" fill="#3b3b3b" />
        <circle cx="31" cy="27" r="1.7" fill="#3b3b3b" />
      </svg>
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontSize: 27, fontWeight: 900, color: "#2f73e0", letterSpacing: 1 }}>学科网</div>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#9aa7bd", letterSpacing: 1.5, marginTop: 3 }}>WWW.ZXXK.COM</div>
      </div>
    </div>
  );
}

// ---- 聚焦下拉：AI 推荐问法 / 场景示例 ----
const AI_EXAMPLES = [
  "人教版七年级上《有理数》同步练习，含解析",
  "按湖北中考结构出一份物理中考模拟卷",
  "外研版英语必修二 Unit3 早读课件，精美一些",
  "光合作用的光反应和暗反应有什么区别？",
];
const SCENES = [
  { n: "找资源", q: "帮我找高中数学必修一《函数的概念》的优质课件" },
  { n: "出卷子", q: "按高考结构组一份高三数学模拟卷" },
  { n: "写教案", q: "写一份《将进酒》的教学设计，对齐课标" },
  { n: "问教材", q: "光合作用的光反应和暗反应有什么区别？" },
];

function FocusPanel({ value, onPick, accent }) {
  return (
    <div className="zx-pop" style={{
      position: "absolute", top: "calc(100% + 10px)", left: 0, right: 0, zIndex: 40,
      background: "#fff", border: "1px solid #e7ecf5", borderRadius: 16,
      boxShadow: "0 18px 50px -18px rgba(31,75,158,.32), 0 2px 8px rgba(20,40,80,.06)",
      padding: "14px 16px 16px", textAlign: "left",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 800, color: "#2f73e0", marginBottom: 10 }}>
        <ZIcon name="spark" size={14} color="#2f73e0" /> 让 AI 小博士帮你 —— 试试这样问
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {AI_EXAMPLES.map((ex, i) => (
          <button key={i} className="zx-exrow" onMouseDown={(e) => { e.preventDefault(); onPick(ex); }}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "9px 11px", borderRadius: 11, border: "1px solid transparent", background: "#f6f8fc", cursor: "pointer", fontFamily: "inherit" }}>
            <AiCap size={22} accent={accent} />
            <span style={{ fontSize: 13.5, color: "#34405a", fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ex}</span>
            <ZIcon name="arrow" size={15} color="#9aa7bd" />
          </button>
        ))}
      </div>
      <div style={{ height: 1, background: "#eef2f8", margin: "13px 0 11px" }} />
      <div style={{ fontSize: 11.5, fontWeight: 800, color: "#8492ab", marginBottom: 9 }}>按场景直达</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {SCENES.map((s, i) => (
          <button key={i} onMouseDown={(e) => { e.preventDefault(); onPick(s.q); }}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 13px", borderRadius: 999, border: "1px solid #dce6f6", background: "#fff", color: "#2f73e0", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            <ZIcon name="spark" size={12} color="#2f73e0" /> {s.n}
          </button>
        ))}
      </div>
    </div>
  );
}

// 实时「自然语言」识别提示条
function NLHint({ value, accent }) {
  const nl = looksLikeNL(value);
  if (!value.trim()) return null;
  return (
    <div style={{
      position: "absolute", top: "calc(100% + 10px)", left: 2, zIndex: 30,
      display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 12px", borderRadius: 999,
      background: nl ? "#eaf2ff" : "#f2f4f8", border: "1px solid " + (nl ? "#cfe0ff" : "#e3e8f0"),
      fontSize: 12, fontWeight: 700, color: nl ? "#1f5bc4" : "#7a8aa0",
      boxShadow: "0 6px 18px -10px rgba(31,75,158,.3)", whiteSpace: "nowrap",
    }}>
      {nl
        ? <><AiCap size={16} accent={accent} /> 像是一句需求 —— 回车交给 AI 小博士</>
        : <><ZIcon name="search" size={13} color="#8a96aa" /> 关键词检索 · 或回车让 AI 理解</>}
    </div>
  );
}

Object.assign(window, { ZIcon, AiCap, ZxxkLogo, FocusPanel, NLHint, gotoAI, looksLikeNL, AI_EXAMPLES, SCENES });
