// zxxk-chrome.jsx — 学科网站点 chrome（顶栏/导航/内容示意）+ 三种搜索区方案
const { useState: cS } = React;

// ---------- 通用：站点 chrome（搜索区以 children 注入）----------
function ZxxkChrome({ children, popOpen }) {
  const util = ["开通学校服务", "帮助中心", "网站导航", "旗下产品", "APP下载", "关怀"];
  const hot = ["高考作文", "高考真题", "期末模拟金卷", "期末备考", "期末模拟卷", "期末真题", "橙子学"];
  const nav = ["同步", "高考", "知识点", "作业", "试卷", "作文"];
  const nav2 = ["精品", "名校", "教辅", "中职"];
  return (
    <div style={{ background: "#fff", height: "100%", display: "flex", flexDirection: "column", fontFamily: "var(--font-zh)" }}>
      {/* 顶部工具条 */}
      <div style={{ height: 38, borderBottom: "1px solid #f0f2f6", display: "flex", alignItems: "center", padding: "0 34px", fontSize: 12.5, color: "#6b7689" }}>
        <span style={{ color: "#2f73e0", fontWeight: 800 }}>学科网</span>
        <span style={{ margin: "0 8px", color: "#c3ccda" }}>—</span>
        <span>让教与学更高效</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 18 }}>
          {util.map((u, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 3, cursor: "pointer", color: i === 0 ? "#2f73e0" : "#6b7689", fontWeight: i === 0 ? 700 : 500 }}>
              {u}{i >= 2 && i <= 4 && <ZIcon name="caret" size={12} color="#aab4c4" />}
            </span>
          ))}
          <span style={{ padding: "4px 16px", borderRadius: 6, background: "#2f73e0", color: "#fff", fontWeight: 700, cursor: "pointer" }}>登录</span>
          <span style={{ padding: "4px 16px", borderRadius: 6, border: "1px solid #2f73e0", color: "#2f73e0", fontWeight: 700, cursor: "pointer" }}>注册</span>
        </div>
      </div>

      {/* 主头区：Logo + 搜索区 + 右侧入口 */}
      <div style={{ padding: "22px 34px 0", display: "flex", alignItems: "flex-start", gap: 26, position: "relative", zIndex: popOpen ? 50 : 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 4 }}>
          <ZxxkLogo />
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 14, fontWeight: 700, color: "#37445e" }}>
            <ZIcon name="pin" size={15} color="#2f73e0" /> 内蒙古 <ZIcon name="caret" size={13} color="#aab4c4" />
          </span>
        </div>
        {/* —— 搜索区（方案注入处）—— */}
        <div style={{ flex: 1, minWidth: 0, maxWidth: 760, paddingTop: 2 }}>{children}</div>
        {/* 右侧入口 */}
        <div style={{ display: "flex", alignItems: "center", gap: 26, paddingTop: 6 }}>
          {[{ i: "school", t: "网校通" }, { i: "crown", t: "会员" }, { i: "upload", t: "上传" }].map((x, k) => (
            <span key={k} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer", color: "#46506a" }}>
              <ZIcon name={x.i} size={22} color="#2f73e0" />
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>{x.t}</span>
            </span>
          ))}
        </div>
      </div>

      {/* 导航条 */}
      <div style={{ padding: "16px 34px 0", display: "flex", alignItems: "center", gap: 0 }}>
        <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: "1px solid #e6ebf3", marginRight: 22 }}>
          {["高中", "初中", "小学"].map((g, i) => (
            <span key={i} style={{ padding: "9px 20px", fontSize: 15, fontWeight: 800, cursor: "pointer", background: i === 0 ? "#2f73e0" : "#fff", color: i === 0 ? "#fff" : "#46506a" }}>{g}</span>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 22, fontSize: 16, fontWeight: 700, color: "#37445e" }}>
          {nav.map((n, i) => (
            <span key={i} style={{ position: "relative", cursor: "pointer" }}>
              {n}
              {n === "作业" && <span style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", fontSize: 9, fontWeight: 800, color: "#fff", background: "#ff7a59", padding: "1px 5px", borderRadius: 6 }}>new</span>}
            </span>
          ))}
          <span style={{ width: 1, height: 16, background: "#e1e6ef" }} />
          {nav2.map((n, i) => (
            <span key={i} style={{ position: "relative", cursor: "pointer" }}>
              {n}
              {n === "中职" && <span style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", fontSize: 9, fontWeight: 800, color: "#fff", background: "#ff7a59", padding: "1px 5px", borderRadius: 6 }}>new</span>}
            </span>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 22, fontSize: 15, fontWeight: 700, color: "#46506a" }}>
          {["研修", "备课", "组卷"].map((n, i) => <span key={i} style={{ cursor: "pointer" }}>{n}</span>)}
        </div>
      </div>

      {/* 内容示意（聚焦顶部，下方简化）*/}
      <div style={{ flex: 1, minHeight: 0, padding: "18px 34px 26px", display: "flex", gap: 16 }}>
        <div style={{ flex: 1, borderRadius: 14, background: "linear-gradient(120deg,#eaf6ef,#dff0ff)", display: "grid", placeItems: "center", color: "#5b8fb0", fontSize: 14, fontWeight: 700, position: "relative", overflow: "hidden" }}>
          <span style={{ opacity: .8 }}>首页 Banner（示意）</span>
        </div>
        <div style={{ width: 168, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ flex: 1, borderRadius: 12, background: "#f5f7fb", border: "1px solid #eef1f6" }} />
          <div style={{ flex: 1, borderRadius: 12, background: "#f5f7fb", border: "1px solid #eef1f6" }} />
        </div>
      </div>
    </div>
  );
}

// 热词行（搜索框下方共用）
function HotWords() {
  const hot = ["高考作文", "高考真题", "期末模拟金卷", "期末备考", "期末模拟卷", "期末真题", "橙子学"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 9, paddingLeft: 4, fontSize: 13, flexWrap: "wrap" }}>
      {hot.map((h, i) => (
        <span key={i} style={{ cursor: "pointer", color: i === 0 ? "#ff6a3d" : "#7d8799", fontWeight: i === 0 ? 700 : 500 }}>{h}</span>
      ))}
    </div>
  );
}

// ================= 方案 A：统一智能框（一框双用·自动识别）=================
// 不再往框里塞一个独立按钮：整个框本身是智能的——左侧 AI 小博士标识表明
// 「这个框听得懂需求」，右侧主按钮随输入在「搜索 / 智能搜索」之间自动切换。
function SearchUnified({ t, onPop }) {
  const [v, setV] = cS("");
  const [foc, setFoc] = cS(false);
  React.useEffect(() => { onPop && onPop(foc); }, [foc]);
  const sc = t.entryScale;
  const nl = looksLikeNL(v);          // 是否像一句自然语言需求
  const aiMode = nl;                   // 关键词→传统搜索；需求→AI 智能搜索
  const submit = () => { if (aiMode) gotoAI(v || AI_EXAMPLES[0]); };
  return (
    <div style={{ position: "relative" }}>
      <div style={{
        display: "flex", alignItems: "center", height: 54, borderRadius: 14, paddingLeft: 8,
        border: "2px solid #2f73e0", background: "#fff", overflow: "hidden",
        boxShadow: foc ? "0 0 0 4px rgba(47,115,224,.13), 0 14px 34px -16px rgba(31,75,158,.4)" : "none", transition: "box-shadow .2s",
      }}>
        {/* 左：AI 小博士标识 —— 表明这是一个听得懂需求的智能框 */}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, paddingLeft: 6, paddingRight: 12, flexShrink: 0 }}>
          <AiCap size={30 * sc} accent={t.accent} />
        </span>
        <input value={v} onChange={(e) => setV(e.target.value)}
          onFocus={() => setFoc(true)} onBlur={() => setTimeout(() => setFoc(false), 160)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder="搜资源，或直接说出你的教学需求…"
          style={{ flex: 1, minWidth: 0, border: "none", outline: "none", fontSize: 15.5, padding: "0 6px", background: "transparent", fontFamily: "inherit", color: "#2a3346" }} />
        {/* 实时模式提示（仅在有输入时显示，融在框内）*/}
        {v.trim() && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, marginRight: 6, padding: "4px 10px", borderRadius: 999, flexShrink: 0,
            background: aiMode ? "#eaf2ff" : "#f1f4f8", color: aiMode ? "#1f5bc4" : "#7a8aa0", fontSize: 11.5, fontWeight: 800, whiteSpace: "nowrap" }}>
            {aiMode ? <><ZIcon name="spark" size={12} color="#1f5bc4" /> AI 理解需求</> : <><ZIcon name="search" size={12} color="#8a96aa" /> 关键词检索</>}
          </span>
        )}
        {/* 单一自适应主按钮：随输入在 搜索 / 智能搜索 间切换 */}
        <button onMouseDown={(e) => { e.preventDefault(); submit(); }}
          className={aiMode ? "zx-ai-btn" : ""}
          style={{
            height: "100%", minWidth: aiMode ? "auto" : 96, padding: aiMode ? "0 26px" : "0 30px", border: "none", cursor: "pointer", fontFamily: "inherit",
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 16, fontWeight: 800, color: "#fff", whiteSpace: "nowrap",
            background: aiMode ? t.accent : "#2f73e0", transition: "background .25s, padding .2s",
          }}>
          {aiMode ? <><ZIcon name="spark" size={16} color="#fff" /> {t.aiLabel}{t.showBadge && <span style={{ fontSize: 9, fontWeight: 800, background: "#fff", color: "#2f73e0", padding: "1px 5px", borderRadius: 6 }}>NEW</span>}</> : "搜索"}
        </button>
      </div>
      <HotWords />
      {foc && t.showExamples && <FocusPanel value={v} accent={t.accent} onPick={(q) => gotoAI(q)} />}
    </div>
  );
}

// ================= 方案 B：Tab 切换（资源搜索 / AI 智能搜索）=================
function SearchTab({ t, onPop }) {
  const [tab, setTab] = cS("ai"); // 'res' | 'ai'
  const [v, setV] = cS("");
  const [foc, setFoc] = cS(false);
  const ai = tab === "ai";
  React.useEffect(() => { onPop && onPop(foc && ai); }, [foc, ai]);
  const sc = t.entryScale;
  return (
    <div style={{ position: "relative" }}>
      {/* tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: -1, position: "relative", zIndex: 2 }}>
        {[{ k: "res", n: "资源搜索", icon: "search" }, { k: "ai", n: "AI 智能搜索", icon: "spark" }].map((x) => {
          const on = tab === x.k;
          return (
            <button key={x.k} onClick={() => setTab(x.k)} style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", cursor: "pointer", fontFamily: "inherit",
              border: "none", borderRadius: "10px 10px 0 0", fontSize: 14, fontWeight: 800,
              background: on ? (x.k === "ai" ? t.accent : "#2f73e0") : "#eef2f8",
              color: on ? "#fff" : "#6b7689",
            }}>
              {x.k === "ai" ? <AiCap size={18} accent="rgba(255,255,255,.18)" /> : <ZIcon name="search" size={15} color={on ? "#fff" : "#9aa7bd"} />}
              {x.n}
              {x.k === "ai" && t.showBadge && <span style={{ fontSize: 9, fontWeight: 800, background: on ? "#fff" : "#ff7a59", color: on ? "#2f73e0" : "#fff", padding: "1px 5px", borderRadius: 6 }}>NEW</span>}
            </button>
          );
        })}
      </div>
      <div style={{
        display: "flex", alignItems: "center", height: 52, borderRadius: "0 12px 12px 12px",
        border: "2px solid " + (ai ? "#2f73e0" : "#2f73e0"), background: "#fff", overflow: "hidden",
        boxShadow: ai ? "0 0 0 4px rgba(47,115,224,.13), 0 14px 34px -16px rgba(31,75,158,.4)" : "none", transition: "box-shadow .2s",
      }}>
        <span style={{ paddingLeft: 15, display: "flex" }}>
          {ai ? <AiCap size={24} accent={t.accent} /> : <ZIcon name="search" size={20} color="#aab4c4" />}
        </span>
        <input value={v} onChange={(e) => setV(e.target.value)}
          onFocus={() => setFoc(true)} onBlur={() => setTimeout(() => setFoc(false), 160)}
          onKeyDown={(e) => { if (e.key === "Enter" && ai) gotoAI(v || AI_EXAMPLES[0]); }}
          placeholder={ai ? "用一句话描述需求，例：按高考结构出一份物理模拟卷" : "请输入关键字"}
          style={{ flex: 1, minWidth: 0, border: "none", outline: "none", fontSize: 15, padding: "0 12px", background: "transparent", fontFamily: "inherit", color: "#2a3346" }} />
        <button onMouseDown={(e) => { e.preventDefault(); if (ai) gotoAI(v || AI_EXAMPLES[0]); }}
          style={{
            height: "100%", padding: "0 28px", border: "none", cursor: "pointer", fontFamily: "inherit",
            display: "inline-flex", alignItems: "center", gap: 7, fontSize: 16, fontWeight: 700, color: "#fff",
            background: ai ? t.accent : "#2f73e0",
          }}>
          {ai && <ZIcon name="spark" size={16} color="#fff" />}{ai ? t.aiLabel : "搜索"}
        </button>
      </div>
      <HotWords />
      {ai && foc && t.showExamples && <FocusPanel value={v} accent={t.accent} onPick={(q) => gotoAI(q)} />}
    </div>
  );
}

// ================= 方案 C：独立 AI 智能搜索按钮（并列）=================
function SearchSeparate({ t }) {
  const [v, setV] = cS("");
  const sc = t.entryScale;
  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "stretch", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", height: 52, borderRadius: 12, border: "2px solid #2f73e0", background: "#fff", overflow: "hidden" }}>
          <span style={{ paddingLeft: 16, display: "flex" }}><ZIcon name="search" size={20} color="#aab4c4" /></span>
          <input value={v} onChange={(e) => setV(e.target.value)} placeholder="请输入关键字"
            style={{ flex: 1, minWidth: 0, border: "none", outline: "none", fontSize: 15, padding: "0 12px", background: "transparent", fontFamily: "inherit", color: "#2a3346" }} />
          <button style={{ height: "100%", padding: "0 30px", border: "none", background: "#2f73e0", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>搜索</button>
        </div>
        {/* 独立 AI 入口 */}
        <button onClick={() => gotoAI(v || AI_EXAMPLES[0])} className="zx-ai-btn"
          style={{
            flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 9 * sc, padding: `0 ${22 * sc}px`, height: 52,
            borderRadius: 12, border: "none", cursor: "pointer", position: "relative",
            background: t.accent, color: "#fff", fontSize: 16 * sc, fontWeight: 800, fontFamily: "inherit", whiteSpace: "nowrap",
            boxShadow: "0 10px 24px -10px rgba(47,115,224,.7), inset 0 1px 0 rgba(255,255,255,.3)",
          }}>
          <AiCap size={28 * sc} accent="rgba(255,255,255,.18)" />
          <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.15 }}>
            <span>{t.aiLabel}</span>
            <span style={{ fontSize: 10.5 * sc, fontWeight: 600, opacity: .9 }}>AI 小博士 · 找资源</span>
          </span>
          {t.showBadge && <span style={{ position: "absolute", top: -8, right: 10, fontSize: 9, fontWeight: 800, background: "#ff7a59", color: "#fff", padding: "1px 6px", borderRadius: 6 }}>NEW</span>}
        </button>
      </div>
      <HotWords />
    </div>
  );
}

// ================= 方案 A1：统一智能框 + 智能搜索开关（用户自主决定）=================
// 同一个框，框内一个明确的「智能搜索」开关：
//   开 → AI 智能搜索（说出需求，回车交给 AI 小博士）
//   关 → 完全回到原有的关键词检索逻辑，用户自己掌控
function SearchUnifiedToggle({ t, onPop }) {
  const [v, setV] = cS("");
  const [foc, setFoc] = cS(false);
  const [ai, setAi] = cS(true); // 智能搜索开关，默认开
  React.useEffect(() => { onPop && onPop(foc && ai); }, [foc, ai]);
  const sc = t.entryScale;
  const submit = () => { if (ai) gotoAI(v || AI_EXAMPLES[0]); };
  return (
    <div style={{ position: "relative" }}>
      <div style={{
        display: "flex", alignItems: "center", height: 54, borderRadius: 14, paddingLeft: 8,
        border: "2px solid #2f73e0", background: "#fff", overflow: "hidden",
        boxShadow: foc ? "0 0 0 4px rgba(47,115,224,.13), 0 14px 34px -16px rgba(31,75,158,.4)" : "none", transition: "box-shadow .2s",
      }}>
        {/* 框内「智能搜索」开关 —— 用户自主决定走 AI 还是传统检索 */}
        <button onMouseDown={(e) => { e.preventDefault(); setAi((x) => !x); }}
          title={ai ? "智能搜索已开启，点击切回普通搜索" : "点击开启智能搜索"}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0, cursor: "pointer", fontFamily: "inherit",
            padding: "6px 10px 6px 8px", margin: "0 4px 0 0", borderRadius: 999, border: "1px solid " + (ai ? "transparent" : "#dce3ee"),
            background: ai ? "#eaf2ff" : "#f4f6fa", transition: "background .2s, border-color .2s",
          }}>
          {ai ? <AiCap size={24 * sc} accent={t.accent} /> : <ZIcon name="spark" size={18} color="#9aa7bd" />}
          <span style={{ fontSize: 13, fontWeight: 800, color: ai ? "#1f5bc4" : "#8492ab", whiteSpace: "nowrap" }}>智能搜索</span>
          {/* 开关轨道 */}
          <span style={{ position: "relative", width: 34, height: 18, borderRadius: 999, background: ai ? t.accent : "#cdd5e2", transition: "background .2s", flexShrink: 0 }}>
            <span style={{ position: "absolute", top: 2, left: ai ? 18 : 2, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left .18s", boxShadow: "0 1px 3px rgba(0,0,0,.25)" }} />
          </span>
        </button>
        <span style={{ width: 1, height: 24, background: "#e7ecf3", flexShrink: 0, margin: "0 6px 0 2px" }} />
        <input value={v} onChange={(e) => setV(e.target.value)}
          onFocus={() => setFoc(true)} onBlur={() => setTimeout(() => setFoc(false), 160)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder={ai ? "用一句话描述需求，例：按高考结构出一份物理模拟卷" : "请输入关键字"}
          style={{ flex: 1, minWidth: 0, border: "none", outline: "none", fontSize: 15.5, padding: "0 8px", background: "transparent", fontFamily: "inherit", color: "#2a3346" }} />
        <button onMouseDown={(e) => { e.preventDefault(); submit(); }}
          className={ai ? "zx-ai-btn" : ""}
          style={{
            height: "100%", padding: "0 28px", border: "none", cursor: "pointer", fontFamily: "inherit",
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 16, fontWeight: 800, color: "#fff", whiteSpace: "nowrap",
            background: ai ? t.accent : "#2f73e0", transition: "background .25s",
          }}>
          {ai ? <><ZIcon name="spark" size={16} color="#fff" /> {t.aiLabel}</> : "搜索"}
        </button>
      </div>
      <HotWords />
      {ai && foc && t.showExamples && <FocusPanel value={v} accent={t.accent} onPick={(q) => gotoAI(q)} />}
    </div>
  );
}

Object.assign(window, { ZxxkChrome, SearchUnified, SearchUnifiedToggle, SearchTab, SearchSeparate, HotWords });
