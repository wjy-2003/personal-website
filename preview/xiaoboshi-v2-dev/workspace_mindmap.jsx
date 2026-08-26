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
