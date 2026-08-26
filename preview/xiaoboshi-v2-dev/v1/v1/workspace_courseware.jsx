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
        {false && allDone && (
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
