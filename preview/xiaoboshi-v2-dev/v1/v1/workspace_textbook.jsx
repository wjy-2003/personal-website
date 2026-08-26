// workspace_textbook.jsx — 问教材 workspace (grounded answers w/ citations)
const { useState: tS, useEffect: tE, useRef: tR } = React;

const TB_STAGES = ["小学", "初中", "高中"];
const TB_SUBJECTS = ["语文", "数学", "英语", "物理", "化学", "生物", "历史", "地理", "道德与法治", "科学"];
const TB_EDITIONS = ["人教版", "统编版", "北师大版", "苏教版", "外研版", "沪教版"];
const TB_BOOKS = ["必修1", "必修2", "上册", "下册", "选择性必修1"];
const MIN_CITE_W = 268;
const MIN_CENTER_W = 380;

// chat column for 问教材 — fixed-width on desktop (resizable via the shell seam), full-bleed on mobile
function TbChat({ width, header, mobile, children }) {
  return (
    <div style={{ width: mobile ? undefined : width || 400, flex: mobile ? 1 : "0 0 auto", minWidth: 0, display: "flex", flexDirection: "column", background: mobile ? "var(--canvas)" : "var(--surface)", borderRight: mobile ? "none" : "1px solid var(--line)" }}>
      {header}
      {children}
    </div>
  );
}

function TextbookWorkspace({ scenario, query, onHome, onSwitch, fromIntent, loggedIn, nav }) {
  const TREE = window.AIDATA.TEXTBOOK_TREE;
  const A = window.AIDATA.TEXTBOOK_ANSWER;
  const CMP = window.AIDATA.TEXTBOOK_COMPARE;
  const M = window.AIDATA.USER_MEMORY;
  const mobile = useIsMobile();
  const isCompareQ = (q) => /哪些教材|哪些版本|各版本|各个版本|不同版本|不同教材|跨教材|对比.*教材|教材.*对比|几个版本|都出现|哪几本/.test(q || "");
  const startAnswered = !fromIntent && !!(query && /[?？]|区别|为什么|什么|怎么|原理|讲|解释/.test(query));
  // a clicked artifact chip (from any scenario) reopens that answered round
  const pendingA = window.ChatSession.pendingArtifact && window.ChatSession.pendingArtifact.scenario === "textbook" ? window.ChatSession.pendingArtifact : null;
  if (pendingA) window.ChatSession.pendingArtifact = null;
  const tbStored = window.ChatSession.scratch.textbook || {};
  const [activeCite, setActiveCite] = tS(null);
  const [answered, setAnswered] = tS(pendingA ? (pendingA.kind === "compare" ? "compare" : true) : (startAnswered || tbStored.answered || false));
  const [thinking, setThinking] = tS(false);
  const mkAns = (q) => window.buildTbAnswer(q, book);
  const [curAns, setCurAns] = tS(() => {
    if (pendingA && pendingA.kind !== "compare") return window.buildTbAnswer(pendingA.title || query || A.question);
    if (startAnswered && query) return window.buildTbAnswer(query);
    return null;
  });

  // ---- which textbook is open (cold-start) ----
  const demoBook = { edition: TREE.edition, subject: TREE.subject, name: "必修1", stage: "高中", section: "第5章 第4节 · 能量之源——光合作用" };
  const memBook = loggedIn && M.textbook ? { edition: M.textbook.edition, subject: M.textbook.subject || "生物", name: (M.textbook.book || "必修1").replace(/^.*·\s*/, ""), stage: M.textbook.stage, section: M.textbook.section, when: M.textbook.when } : null;
  const [book, setBook] = tS(() => tbStored.book || (pendingA ? demoBook : (query ? demoBook : null))); // null → show guide/picker
  // memory is no longer auto-opened into an empty pane; it's offered as a 「继续上次」 resume card on the guide page
  const viaMemory = false;

  // ---- which chapter/section is open in the catalog (clickable TOC) ----
  const findActiveSec = () => { for (let ci = 0; ci < TREE.chapters.length; ci++) for (let si = 0; si < TREE.chapters[ci].sections.length; si++) if (TREE.chapters[ci].sections[si].active) return { ci, si }; return { ci: 0, si: 0 }; };
  const [activeSec, setActiveSec] = tS(findActiveSec);
  const curSection = TREE.chapters[activeSec.ci] ? TREE.chapters[activeSec.ci].sections[activeSec.si] : null;

  // ---- layout: collapsible catalog + resizable citation pane ----
  const [navOpen, setNavOpen] = tS(false); // catalog drawer (left overlay)
  const [switcherOpen, setSwitcherOpen] = tS(false); // 切换教材 drawer (right overlay)
  const [pdfCite, setPdfCite] = tS(null); // citation whose 教材原文 PDF page is open
  const [cardModal, setCardModal] = tS(null); // knowledge card (二次加工) shown in a modal
  const [tbToast, setTbToast] = tS(null);
  const toast = (msg) => { setTbToast(msg); setTimeout(() => setTbToast(null), 2200); };
  const isSingle = !!(book && !book.free && !book.multi);
  const bookLabel = !book ? "" : book.free ? "不限教材" : book.multi ? `${book.list.length} 本教材` : `${book.edition} ${book.subject} · ${book.name}`;
  const [citeOpen, setCiteOpen] = tS(false);
  const [paneView, setPaneView] = tS("cite"); // 右侧窗格视图：教材依据 | 教材目录
  tE(() => { if (answered || thinking) setPaneView("cite"); }, [answered, thinking]);
  const [citeW, setCiteW] = tS(() => { const s = parseInt(localStorage.getItem("aida_cite_w") || "", 10); return Number.isFinite(s) && s >= MIN_CITE_W ? s : 332; });
  const [citeDragging, setCiteDragging] = tS(false);
  const citeRef = tR(null);
  const cdrag = tR(false);
  tE(() => { try { localStorage.setItem("aida_cite_w", String(Math.round(citeW))); } catch (e) {} }, [citeW]);
  tE(() => {
    const clampC = (val) => {
      const rightEdge = citeRef.current ? citeRef.current.getBoundingClientRect().right : window.innerWidth;
      const navW = navOpen ? 252 : 50;
      const maxC = Math.max(MIN_CITE_W, rightEdge - navW - MIN_CENTER_W);
      return Math.min(Math.max(val, MIN_CITE_W), maxC);
    };
    const move = (e) => { if (!cdrag.current || !citeRef.current) return; const rightEdge = citeRef.current.getBoundingClientRect().right; setCiteW(clampC(rightEdge - e.clientX)); };
    const up = () => { if (!cdrag.current) return; cdrag.current = false; setCiteDragging(false); document.body.style.cursor = ""; document.body.style.userSelect = ""; };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [navOpen]);
  const startCiteDrag = (e) => { cdrag.current = true; setCiteDragging(true); document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"; e.preventDefault(); };

  const greetFor = (bk, kind) => ({
    role: "ai",
    node:
      bk && bk.free ? (
        <div>好的，<b style={{ color: "var(--brand-deep)" }}>不限定教材</b>，你可以直接问任何学科问题。我会优先依据教材作答并<b style={{ color: "var(--auth-ink)" }}>标注原文出处</b>；想锁定某一本教材，点顶部<b>选择教材</b>即可。</div>
      ) : bk && bk.multi ? (
        <div>已选好 <b style={{ color: "var(--brand-deep)" }}>{bk.list.length} 本教材</b>（{bk.list.map((b) => b.subject + b.name).join("、")}），适合<b>跨年级综合复习</b>。我会在多本教材之间对照作答，并<b style={{ color: "var(--auth-ink)" }}>分别标注各自出处</b>。</div>
      ) : kind === "memory" ? (
        <div>欢迎回来！已按你常看的 <b style={{ color: "var(--brand-deep)" }}>{bk.edition} {bk.subject} · {bk.name}</b> 打开{bk.section ? <span>（上次看到 <b>{bk.section}</b>）</span> : null}。问我本教材的任何问题，回答都会<b style={{ color: "var(--auth-ink)" }}>逐条标注原文出处</b>。也可在顶部<b>切换教材</b>。</div>
      ) : kind === "picked" ? (
        <div>已为你打开 <b style={{ color: "var(--brand-deep)" }}>{bk.edition} {bk.subject} · {bk.name}</b>。问我本教材的任何问题，我的回答会<b style={{ color: "var(--auth-ink)" }}>逐条标注教材原文出处</b>，绝不凭空作答。</div>
      ) : (
        <div>这是<b style={{ color: "var(--brand-deep)" }}>{bk.edition} {bk.subject} {bk.name} · 第5章第4节</b>。问我关于本节教材的任何问题，我的回答会<b style={{ color: "var(--auth-ink)" }}>逐条标注教材原文出处</b>，绝不凭空作答。</div>
      ),
  });

  const [thread, setThread] = tS(() => {
    const hist = window.ChatSession.take();
    if (pendingA) {
      return [...hist, ...window.takeSwitchDivider(scenario, hist.length > 0), pendingA.kind === "compare" ? { role: "ai", compare: true } : { role: "ai", answer: true, ans: curAns }];
    }
    if (!book) {
      // cold start (no textbook yet): greet on a fresh session; on a mid-session
      // switch just leave the standard 「已切换」 divider — the right-stage picker guides.
      return window.enterThread(scenario, (
        <span>你好！我是你的<b>教材助手</b>。在{mobile ? "下方" : "右侧"}选择一本教材开始，或直接提问——我的回答都会标注<b style={{ color: "var(--auth-ink)" }}>教材原文出处</b>。</span>
      ));
    }
    const greet = greetFor(book, viaMemory ? "memory" : "plain");
    if (fromIntent && query) {
      return [
        ...hist,
        ...window.takeSwitchDivider(scenario, hist.length > 0),
        ...(window.ChatSession.echoed(query) ? [] : [{ role: "user", text: query }]),
        { role: "ai", wide: true, intent: query, render: () => <InlineIntent query={query} onDone={() => { const a = mkAns(query); setCurAns(a); setThread((t) => [...t, greet]); setThinking(true); setTimeout(() => { setThinking(false); setThread((t) => [...t, { role: "ai", answer: true, ans: a }]); setAnswered(true); }, 1100); }} /> },
      ];
    }
    if (query && /[?？]|区别|为什么|什么|怎么|原理|讲|解释/.test(query)) {
      return [...hist, ...window.takeSwitchDivider(scenario, hist.length > 0), greet, ...(window.ChatSession.echoed(query) ? [] : [{ role: "user", text: query }]), { role: "ai", answer: true, ans: curAns }];
    }
    if (hist.length) return window.enterThread(scenario);
    return [...hist, greet];
  });
  // persist the thread — one assistant conversation across scenario switches
  tE(() => { window.ChatSession.save(window.freezeChat(thread)); }, [thread]);
  // keep the opened book + answered state so switching scenarios doesn't reset this stage
  tE(() => { window.ChatSession.scratch.textbook = { ...(window.ChatSession.scratch.textbook || {}), book, answered }; }, [book, answered]);

  // switching a textbook should NOT wipe the conversation — only a cold (first) open starts a fresh greeting.
  const hasConvo = (t) => t.some((m) => m.role === "user" || m.answer || m.compare);
  const switchNote = (bk) => ({ role: "sys", icon: "refresh", text: bk.free ? "已切换为「不限教材」· 后续提问不再锁定教材" : bk.multi ? `已切换为 ${bk.list.length} 本教材综合` : `已切换教材 · ${bk.edition} ${bk.subject} · ${bk.name}` });
  const applyBook = (bk, kind) => {
    if (book && hasConvo(thread)) {
      // switching mid-conversation must NOT silently rewrite the prior answer — keep it,
      // drop a divider, and offer an explicit 「按新教材重新回答」 for the last question.
      const lastQ = (() => { for (let i = thread.length - 1; i >= 0; i--) if (thread[i].role === "user") return thread[i].text; return null; })();
      const hadAnswer = thread.some((m) => m.answer || m.compare);
      const lbl = bk.free ? "不限教材" : bk.multi ? `${bk.list.length} 本教材` : `${bk.edition} ${bk.subject} · ${bk.name}`;
      setBook(bk);
      setThread((t) => [...t, switchNote(bk), ...(lastQ && hadAnswer ? [{ role: "ai", reanswer: { q: lastQ, label: lbl } }] : [])]);
    } else { setBook(bk); setThread((t) => [...t.filter((m) => m.role === "user" || m.node || m.text || m.answer || m.compare), greetFor(bk, kind)]); setAnswered(false); }
  };
  // open / switch a textbook chosen from the picker
  const openBook = (bk) => applyBook(bk, "picked");
  const openFree = () => applyBook({ free: true }, "free");
  const openMulti = (list) => applyBook({ multi: true, list }, "multi");
  // click a section in the catalog → locate it + show recommended questions as quick-ask chips
  const secQuestions = (secName) => {
    const base = secName.replace(/第\d+节\s*·?\s*/, "").replace(/——.*/, "").trim();
    return [
      `${base}的核心概念是什么？`,
      `${base}的教学重难点有哪些？`,
      `${base}有哪些常见考点？`,
      `怎么给学生讲清楚${base}？`,
    ];
  };
  const pickSection = (ci, si) => {
    const sec = TREE.chapters[ci] && TREE.chapters[ci].sections[si];
    if (!sec) return;
    setActiveSec({ ci, si });
    setNavOpen(false);
    const qs = secQuestions(sec.name);
    const marker = { role: "sys", icon: "book", locate: true, text: `已定位到 ${TREE.chapters[ci].name} · ${sec.name}`, questions: qs };
    // collapse rapid catalog hopping: if the last thing in the thread is itself a
    // 定位 marker (teacher just clicked around without asking anything), swap it in
    // place — one live "已定位到…" line whose content changes, not a growing pile.
    setThread((t) => {
      const last = t[t.length - 1];
      if (last && last.locate) return [...t.slice(0, -1), marker];
      return [...t, marker];
    });
    setSampleQs(qs);
  };
  // switching an already-open book slides the picker in from the right (smoother than swapping the page)
  const switchBook = () => setSwitcherOpen(true);
  const pickFromDrawer = (bk) => { openBook(bk); setSwitcherOpen(false); };
  const freeFromDrawer = () => { openFree(); setSwitcherOpen(false); };
  const multiFromDrawer = (list) => { openMulti(list); setSwitcherOpen(false); };

  const scrollRef = tR(null);
  tE(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [thread, thinking]);

  const ask = (q) => {
    const compare = (book && book.multi) || isCompareQ(q);
    setThread((t) => [...t, { role: "user", text: q }]);
    setThinking(true);
    setAnswered(false);
    setTimeout(() => {
      setThinking(false);
      const art = null; // 问教材的回答始终在左侧对话中展示，不需要跨场景 artifact 收缩
      if (compare) {
        setThread((t) => [...t, { role: "ai", compare: true }]);
        setAnswered("compare");
      } else {
        const a = mkAns(q);
        setCurAns(a);
        setThread((t) => [...t, { role: "ai", answer: true, ans: a }]);
        setAnswered(true);
      }
    }, compare ? 1600 : 1400);
  };
  // 后续动作：展开/举例留在问教材；生成导图/练习题交给对应场景；查看资源跳找资源（同一个助手）
  const lastUserQ = () => { for (let i = thread.length - 1; i >= 0; i--) if (thread[i].role === "user") return thread[i].text; return ""; };
  // 真正的"问题"（跳过举例/卡片等后续动作注入的用户气泡），用于定位当前知识点
  const lastRealQ = () => { for (let i = thread.length - 1; i >= 0; i--) { const m = thread[i]; if (m.role === "user" && !m.follow) return m.text; } return lastUserQ(); };
  // 当前主题短语（用于 handoff 时让目标场景的用户气泡读起来自然，并带上知识点）
  const topicPhrase = () => {
    const q = lastRealQ() || (curAns && curAns.blocks && curAns.blocks[0] && curAns.blocks[0].text) || "这个知识点";
    return q.replace(/[？?。.！!]/g, "").replace(/^(什么是|请问|老师|为什么|怎么样?|如何|有哪些|说说|讲讲)/, "").trim().slice(0, 22);
  };
  // 后续动作：每次点击都先作为"用户消息"进入对话流；
  // 二次加工（举例/展开/知识卡片）留在问教材内并继承当前回答；
  // 生成类（导图/资源/练习题/教案）作为用户请求 handoff 到对应场景。
  const onFollow = (f, ans) => {
    const a = ans || curAns;
    const tp = topicPhrase();
    // —— handoff：动作 + 知识点 作为用户消息带进下一个场景 ——
    if (/导图/.test(f)) return onSwitch && onSwitch("mindmap", `把「${tp}」生成${/对比/.test(f) ? "对比" : "知识"}导图`);
    if (/资源|课件|试卷|相关/.test(f)) return onSwitch && onSwitch("find", `找「${tp}」相关的资源`);
    if (/教案|教学设计/.test(f)) return onSwitch && onSwitch("lesson", `按「${tp}」写一份教案`);
    if (/练习|题/.test(f) && !/辨析|这道题/.test(f)) return onSwitch && onSwitch("paper", `给「${tp}」出几道练习题`);
    // —— 留在问教材内的二次加工 ——
    if (/卡片/.test(f)) {
      const card = (a && a.card) || (curAns && curAns.card) || (window.buildKnowledgeCard && window.buildKnowledgeCard(a || curAns, lastRealQ()));
      if (!card) return;
      setThread((t) => [...t, { role: "user", text: f, follow: true }]);
      setThinking(true);
      setTimeout(() => { setThinking(false); setThread((t) => [...t, { role: "ai", card }]); }, 900);
      return;
    }
    if (/选择教材|选教材/.test(f)) { setSwitcherOpen(true); return; }
    if (/打开教材原文|原文/.test(f)) { const c = (a && a.citations && a.citations[0]) || (curAns && curAns.citations && curAns.citations[0]); if (c) { setPdfCite(c); return; } }
    // 举例 / 展开 / 讲讲 …… —— 紧扣当前回答给出上下文回答
    setThread((t) => [...t, { role: "user", text: f, follow: true }]);
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      const followAns = window.buildTbFollow(f, a, lastRealQ(), book);
      setCurAns(followAns);
      setThread((t) => [...t, { role: "ai", answer: true, ans: followAns }]);
      setAnswered(true);
    }, 1100);
  };

  const [sampleQs, setSampleQs] = tS(["光反应和暗反应有什么区别？", "为什么会产生感应电流？", "这部分知识中考/高考怎么考？", "这节课怎么给学生讲清楚？"]);
  const { headerRecognizing, send } = useSmartSend({ scenarioId: scenario.id, onSwitch, setMessages: setThread, localSend: ask });

  // ---- cold start: no textbook selected (switched in / logged out / no memory) ----
  // keep the assistant (left chat) visible; show the guide/picker as the right stage.
  if (!book) {
    const coldSend = (q) => { openFree(); ask(q); };
    const picker = <TextbookPicker onOpen={openBook} onFree={openFree} onMulti={openMulti} onResume={memBook ? () => applyBook(memBook, "memory") : null} memBook={memBook} demoBook={demoBook} />;
    return (
      <WorkspaceShell scenario={scenario} onHome={onHome} onSwitch={onSwitch} nav={nav} headerRecognizing={headerRecognizing} chatLed={!mobile} mobilePanelLabel="选择教材" mobilePanelIcon="book">
        <TbChat mobile={mobile}>
          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: mobile ? "18px 16px" : "20px 16px" }}>
            <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
              {thread.map((m, i) => {
                const prev = thread[i - 1];
                const grouped = m.role !== "user" && m.role !== "sys" && !!prev && prev.role !== "user" && prev.role !== "sys";
                return <Bubble key={i} m={m} grouped={grouped} />;
              })}
              {thinking && (
                <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
                  <BotAvatar size={28} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, background: "var(--surface)", border: "1px solid var(--line)", padding: "10px 14px", borderRadius: 12 }}>
                    <span style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 600, display: "inline-flex", gap: 7, alignItems: "center" }}>
                      <CIcon name="book" size={13} /> 正在比对教材原文 <Dots />
                    </span>
                  </div>
                </div>
              )}
              {/* on mobile the picker lives inline under the greeting */}
              {mobile && (
                <div style={{ border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden", background: "var(--surface)" }}>{picker}</div>
              )}
            </div>
          </div>
          <div style={{ padding: "0 16px", background: "var(--surface)" }}>
            <div style={{ maxWidth: 720, margin: "0 auto", padding: "4px 0 12px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                {sampleQs.map((q, i) => (
                  <button key={i} onClick={() => coldSend(q)} className="sug-pop" style={{ animationDelay: `${i * 0.05}s`, display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 999, border: "1px dashed var(--brand-soft-border)", background: "var(--brand-soft)", color: "var(--brand-deep)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)" }}>
                    <Icon name="chat" size={13} /> {q}
                  </button>
                ))}
              </div>
              <TextbookInput onAsk={coldSend} scenario={scenario} onSwitch={onSwitch} />
            </div>
          </div>
        </TbChat>
        {/* right stage: the guide / textbook picker (desktop only; mobile shows it inline above) */}
        {!mobile && (
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "var(--surface)" }}>
            {picker}
          </div>
        )}
      </WorkspaceShell>
    );
  }

  // —— right pane structure, first principles: the pane IS the textbook ——
  // 1) book bar = which book is open (identity + where + switch)
  // 2) view tabs = two ways to look at it: 依据（跟随回答） / 目录（翻书）
  const bookBar = (
    <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 14px", borderBottom: "1px solid var(--line)", background: "var(--surface)", flexShrink: 0 }}>
      <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", color: "var(--brand-deep)", display: "grid", placeItems: "center", flexShrink: 0 }}>
        <Icon name={book.multi ? "layers" : book.free ? "spark" : "book"} size={18} />
      </span>
      <div style={{ flex: 1, minWidth: 0, lineHeight: 1.3 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bookLabel}</div>
        <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {isSingle && curSection ? `${TREE.chapters[activeSec.ci].name} · ${curSection.name}` : book.free ? "不锁定教材，跨教材为你检索" : "多本教材综合作答"}
        </div>
      </div>
      <button onClick={switchBook} data-tip="切换 / 选择教材"
        style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", flexShrink: 0, transition: "border-color .15s, background .15s" }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand-soft-border)"; e.currentTarget.style.background = "var(--brand-soft)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.background = "var(--surface)"; }}>
        <Icon name="refresh" size={13} /> 切换教材
      </button>
    </div>
  );

  const paneCites = curAns ? curAns.citations : A.citations;
  const citeCount = answered === "compare" ? CMP.editions.length : answered ? paneCites.length : 0;
  const paneTabs = isSingle ? (
    <div style={{ display: "flex", gap: 4, padding: "8px 14px", borderBottom: "1px solid var(--line)", background: "var(--surface)", flexShrink: 0 }}>
      {[
        { k: "cite", label: "教材依据", icon: "shield", badge: citeCount || null },
        { k: "toc", label: "教材目录", icon: "menu", badge: null },
      ].map((tab) => {
        const on = paneView === tab.k;
        return (
          <button key={tab.k} onClick={() => setPaneView(tab.k)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 9, border: "1px solid " + (on ? "var(--brand-soft-border)" : "transparent"), background: on ? "var(--brand-soft)" : "transparent", color: on ? "var(--brand-deep)" : "var(--ink-2)", fontSize: 12.5, fontWeight: on ? 800 : 600, cursor: on ? "default" : "pointer", fontFamily: "var(--font-zh)", transition: "background .15s, color .15s" }}
            onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = "var(--surface-2)"; }}
            onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = "transparent"; }}>
            <Icon name={tab.icon} size={14} /> {tab.label}
            {tab.badge != null && <span style={{ minWidth: 17, height: 17, padding: "0 5px", borderRadius: 999, background: on ? "var(--brand)" : "var(--surface-2)", color: on ? "#fff" : "var(--ink-3)", fontSize: 10.5, fontWeight: 800, display: "inline-grid", placeItems: "center", fontFamily: "var(--font-num)" }}>{tab.badge}</span>}
          </button>
        );
      })}
    </div>
  ) : null;

  // inline catalog — the 目录 view of the right pane (desktop)
  const tocInline = isSingle ? (
    <div>
      {TREE.chapters.map((ch, ci) => (
        <div key={ci} style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-2)", padding: "6px 8px" }}>{ch.name}</div>
          {ch.sections.map((sec, si) => {
            const on = activeSec.ci === ci && activeSec.si === si;
            return (
              <button key={si} onClick={() => pickSection(ci, si)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", fontFamily: "var(--font-zh)", fontSize: 12.5, padding: "8px 10px 8px 16px", borderRadius: 9, marginBottom: 2, cursor: "pointer", fontWeight: on ? 700 : 500, color: on ? "var(--brand-deep)" : "var(--ink-2)", background: on ? "var(--brand-soft)" : "transparent", border: "none", borderLeft: `2px solid ${on ? "var(--brand)" : "transparent"}`, transition: "background .15s, color .15s" }}
                onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = "var(--surface-2)"; }}
                onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = "transparent"; }}>
                <span style={{ flex: 1, minWidth: 0 }}>{sec.name}</span>
                {on && <span style={{ color: "var(--brand)", flexShrink: 0, display: "inline-flex" }}><Icon name="check" size={13} sw={2.6} /></span>}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  ) : null;

  return (
    <WorkspaceShell scenario={scenario} onHome={onHome} onSwitch={onSwitch} nav={nav} headerRecognizing={headerRecognizing} chatLed={!mobile} mobilePanelLabel="教材依据" mobilePanelIcon="shield" openSheetKey={answered ? "tb" + thread.length : null}>
      {/* left: the assistant's conversation · right: 问教材 stage (教材切换 + 目录 + 教材依据) */}
      <TbChat mobile={mobile}>
        {mobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: "1px solid var(--line)", background: "var(--surface)", flexShrink: 0 }}>
            {/* textbook first, then catalog */}
            <button onClick={switchBook} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 11px", borderRadius: 10, border: "1px solid var(--brand-soft-border)", background: "var(--brand-soft)", color: "var(--brand-deep)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", minWidth: 0, maxWidth: isSingle ? 152 : "none" }}>
              <Icon name={book.multi ? "layers" : book.free ? "spark" : "book"} size={15} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.free ? "不限教材" : book.multi ? bookLabel : book.subject + book.name}</span>
              <Icon name="chevron" size={13} />
            </button>
            {isSingle && (
              <button onClick={() => setNavOpen(true)} title="教材目录" style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 10px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", flexShrink: 0 }}>
                <Icon name="menu" size={15} /> 目录
              </button>
            )}
            <div style={{ flex: 1 }} />
            <button onClick={() => setCiteOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 11px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", flexShrink: 0 }}>
              <Icon name="shield" size={15} /> 依据{answered === "compare" ? ` · ${CMP.editions.length}` : answered ? ` · ${paneCites.length}` : ""}
            </button>
          </div>
        )}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: mobile ? "18px 16px" : "20px 16px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
            {viaMemory && answered === false && thread.length <= 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 12, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)" }}>
                <Icon name="spark" size={15} />
                <span style={{ fontSize: 12.5, color: "var(--brand-deep)", fontWeight: 600, lineHeight: 1.5 }}>已根据「记忆」自动打开你常看的教材——若要换一本，点顶部「切换」即可。</span>
              </div>
            )}
            {thread.map((m, i) => {
              const prev = thread[i - 1];
              const grouped = m.role !== "user" && m.role !== "sys" && !!prev && prev.role !== "user" && prev.role !== "sys";
              return m.answer ? (
                <DynamicAnswer key={i} ans={m.ans || curAns} activeCite={activeCite} setActiveCite={setActiveCite} onFollow={onFollow} grouped={grouped} />
              ) : m.card ? (
                <div key={i} className="ans-pop" style={{ display: "flex", gap: 11, alignItems: "flex-start", marginTop: grouped ? -8 : 0 }}>
                  {grouped ? <div style={{ width: 30, flexShrink: 0 }} /> : <BotAvatar size={30} glow />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: "var(--ink-2)", fontWeight: 600, marginBottom: 9 }}>已把上面的回答做成一张 <b style={{ color: "var(--brand-deep)" }}>16:9 知识卡片</b>（继承教材依据）。可下载，或存入「我的内容」后直接插入课件：</div>
                    <KnowledgeCardImage card={m.card} onToast={toast} />
                  </div>
                </div>
              ) : m.reanswer ? (
                <div key={i} className="ans-pop" style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                  <BotAvatar size={30} />
                  <div style={{ flex: 1, minWidth: 0, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "4px 16px 16px 16px", padding: "14px 16px", boxShadow: "0 8px 26px -20px rgba(0,0,0,.3)" }}>
                    <p style={{ margin: "0 0 11px", fontSize: 13.5, lineHeight: 1.65, color: "var(--ink)" }}>已切换到 <b style={{ color: "var(--brand-deep)" }}>{m.reanswer.label}</b>。要按新教材重新回答上一个问题吗？<span style={{ color: "var(--ink-3)" }}>（旧答案会保留）</span></p>
                    <button onClick={() => ask(m.reanswer.q)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "none", background: "var(--brand)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>
                      <Icon name="refresh" size={14} /> 按新教材重新回答
                    </button>
                  </div>
                </div>
              ) : m.compare ? (
                <CompareBlock key={i} CMP={CMP} activeCite={activeCite} setActiveCite={setActiveCite} onAsk={ask} onFollow={onFollow} grouped={grouped} />
              ) : m.role === "sys" ? (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8, padding: "2px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: "var(--ink-3)", background: "var(--surface-2)", border: "1px solid var(--line)", padding: "4px 12px", borderRadius: 999, maxWidth: "100%" }}>
                      <Icon name={m.icon || "refresh"} size={12} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.text}</span>
                      {m.back && (
                        <button
                          onClick={() => { window.ChatSession && (window.ChatSession.switchMeta = { source: "manual" }); window.__aidaSwitch && window.__aidaSwitch(m.back.id, ""); }}
                          title={"切回" + m.back.name}
                          style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 2, padding: "1px 8px", borderRadius: 999, border: "1px solid var(--brand-soft-border)", background: "var(--brand-soft)", color: "var(--brand-deep)", fontSize: 11.5, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-zh)", flexShrink: 0 }}
                        >
                          切回{m.back.name}
                        </button>
                      )}
                    </span>
                    <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
                  </div>
                  {m.questions && m.questions.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", padding: "0 8px" }}>
                      {m.questions.map((q, qi) => (
                        <button key={qi} onClick={() => ask(q)} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", transition: "all .15s" }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.color = "var(--brand-deep)"; e.currentTarget.style.background = "var(--brand-soft)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--ink-2)"; e.currentTarget.style.background = "var(--surface)"; }}>
                          <Icon name="spark" size={12} /> {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Bubble key={i} m={m} grouped={grouped} />
              );
            })}
            {thinking && (
              <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
                <BotAvatar size={28} />
                <div style={{ display: "flex", flexDirection: "column", gap: 5, background: "var(--surface)", border: "1px solid var(--line)", padding: "10px 14px", borderRadius: 12 }}>
                  <span style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 600, display: "inline-flex", gap: 7, alignItems: "center" }}>
                    <CIcon name="book" size={13} /> 正在比对教材原文 <Dots />
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* sample questions + input */}
        <div style={{ padding: "0 16px", background: "var(--surface)" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "4px 0 12px" }}>
            {!answered && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                {sampleQs.map((q, i) => (
                  <button key={i} onClick={() => ask(q)} className="sug-pop" style={{ animationDelay: `${i * 0.05}s`, display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 999, border: "1px dashed var(--brand-soft-border)", background: "var(--brand-soft)", color: "var(--brand-deep)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)" }}>
                    <Icon name="chat" size={13} /> {q}
                  </button>
                ))}
              </div>
            )}
            <TextbookInput onAsk={send} scenario={scenario} onSwitch={onSwitch} />
          </div>
        </div>
      </TbChat>

      {/* right stage: 这本教材 — 身份栏 + 两个视图（依据 / 目录） */}
      <div style={mobile ? { display: "contents" } : { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "var(--surface)" }}>
      {!mobile && bookBar}
      {!mobile && paneTabs}
      {mobile && <div onClick={() => setCiteOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(20,16,10,.42)", backdropFilter: "blur(2px)", opacity: citeOpen ? 1 : 0, pointerEvents: citeOpen ? "auto" : "none", transition: "opacity .26s" }} />}
      <div ref={citeRef} style={mobile ? { position: "fixed", left: 0, right: 0, bottom: 0, height: "82dvh", zIndex: 71, background: "var(--surface)", borderTop: "1px solid var(--line)", borderRadius: "18px 18px 0 0", display: "flex", flexDirection: "column", transform: citeOpen ? "translateY(0)" : "translateY(101%)", transition: "transform .3s cubic-bezier(.32,.72,0,1)", boxShadow: "0 -18px 50px -24px rgba(0,0,0,.5)", overflow: "hidden" } : { flex: 1, minHeight: 0, background: "var(--surface)", display: "flex", flexDirection: "column" }}>
        {mobile && <div style={{ width: 40, height: 4, borderRadius: 999, background: "var(--line)", margin: "8px auto 0", flexShrink: 0 }} />}
        {(mobile || !isSingle) && (
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="shield" size={16} sw={2} />
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>教材依据</span>
          <span style={{ fontSize: 11, color: "var(--ink-3)", marginLeft: "auto" }}>{answered === "compare" ? `${CMP.editions.length} 个版本` : answered ? `${paneCites.length} 处引用` : "等待提问"}</span>
          {mobile && (
            <button onClick={() => setCiteOpen(false)} aria-label="关闭" style={{ width: 30, height: 30, marginLeft: 8, borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}>
              <Icon name="close" size={15} sw={2.4} />
            </button>
          )}
        </div>
        )}
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {!mobile && isSingle && paneView === "toc" ? tocInline : !answered ? (            <div style={{ textAlign: "center", padding: "50px 16px", color: "var(--ink-3)" }}>
              <div style={{ display: "inline-flex", marginBottom: 12, color: "var(--line)" }}>
                <Icon name="quote" size={42} sw={1.4} />
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                提问后，这里会显示答案<br />引用的<b style={{ color: "var(--ink-2)" }}>教材原文出处</b>
              </div>
            </div>
          ) : answered === "compare" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {CMP.editions.map((e, i) => (
                <div
                  key={i}
                  onMouseEnter={() => setActiveCite("e" + i)}
                  onMouseLeave={() => setActiveCite(null)}
                  className="cite-pop"
                  style={{ animationDelay: `${i * 0.1}s`, border: activeCite === "e" + i ? "1px solid var(--brand)" : "1px solid var(--line)", background: activeCite === "e" + i ? "var(--brand-soft)" : "var(--surface-2)", borderRadius: 14, padding: 13, transition: "all .18s" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                    <span style={{ width: 20, height: 20, borderRadius: 6, background: e.stage === "高中" ? "var(--brand)" : "oklch(0.55 0.13 175)", color: "#fff", fontSize: 10, fontWeight: 800, display: "grid", placeItems: "center" }}>{e.stage[0]}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)" }}>{e.edition}</span>
                    <span style={{ fontSize: 10.5, color: "var(--ink-3)", fontWeight: 600 }}>{e.book}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--brand-deep)", fontWeight: 700, marginBottom: 7 }}>{e.loc}</div>
                  <div className="ph-stripe" style={{ borderRadius: 8, padding: "10px 12px", fontSize: 12, lineHeight: 1.7, color: "var(--ink-2)", borderLeft: "3px solid var(--brand)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--ink-3)", fontSize: 10.5, fontWeight: 700, marginBottom: 4 }}>
                      <Icon name="quote" size={12} /> 教材原文
                    </span>
                    <div>{e.quote}</div>
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.6, padding: "4px 4px 0", textAlign: "center" }}>
                各版本原文均来自学科网教材库 · 可点开对照
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {paneCites.map((c, i) => (
                <div
                  key={c.id}
                  onMouseEnter={() => setActiveCite(c.id)}
                  onMouseLeave={() => setActiveCite(null)}
                  onClick={() => setPdfCite(c)}
                  className="cite-pop"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    border: activeCite === c.id ? "1px solid var(--brand)" : "1px solid var(--line)",
                    background: activeCite === c.id ? "var(--brand-soft)" : "var(--surface-2)",
                    borderRadius: 14,
                    padding: 13,
                    cursor: "pointer",
                    transition: "all .18s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                    <span style={{ width: 20, height: 20, borderRadius: 6, background: "var(--brand-grad)", backgroundColor: "var(--brand)", color: "#fff", fontSize: 11, fontWeight: 800, display: "grid", placeItems: "center", fontFamily: "var(--font-num)" }}>{i + 1}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)" }}>{c.source}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--brand-deep)", fontWeight: 700, marginBottom: 7 }}>{c.loc}</div>
                  {/* page preview placeholder */}
                  <div className="ph-stripe" style={{ borderRadius: 8, padding: "10px 12px", fontSize: 12, lineHeight: 1.7, color: "var(--ink-2)", borderLeft: "3px solid var(--brand)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--ink-3)", fontSize: 10.5, fontWeight: 700, marginBottom: 4 }}>
                      <Icon name="quote" size={12} /> 教材原文
                    </span>
                    <div>{c.quote}</div>
                  </div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 9, fontSize: 11.5, fontWeight: 700, color: "var(--brand-deep)" }}>
                    <CIcon name="book" size={13} /> 查看教材原文（扫描页） <Icon name="arrow" size={13} />
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.6, padding: "4px 4px 0", textAlign: "center" }}>
                所有结论均可回链至教材原文 · 由学科网权威内容保障
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* ===== catalog drawer — mobile only (desktop has the 目录 view inline) ===== */}
      {isSingle && mobile && (
        <React.Fragment>
          <div onClick={() => setNavOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(20,16,10,.42)", backdropFilter: "blur(2px)", opacity: navOpen ? 1 : 0, pointerEvents: navOpen ? "auto" : "none", transition: "opacity .26s" }} />
          <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: mobile ? "min(300px,84vw)" : 320, zIndex: 81, background: "var(--surface)", borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", overflow: "hidden", transform: navOpen ? "translateX(0)" : "translateX(-102%)", transition: "transform .3s cubic-bezier(.32,.72,0,1)", boxShadow: navOpen ? "0 20px 60px -20px rgba(0,0,0,.5)" : "none" }}>
            <div style={{ padding: 16, borderBottom: "1px solid var(--line)" }}>
              <div style={{ display: "flex", gap: 11 }}>
                <div className="ph-stripe" style={{ width: 46, height: 62, borderRadius: 6, flexShrink: 0, display: "grid", placeItems: "center", color: "var(--ink-3)", fontSize: 9, fontWeight: 700, textAlign: "center" }}>教材<br />封面</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)", lineHeight: 1.4 }}>{book.subject} {book.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 3 }}>{book.edition}</div>
                  <div style={{ marginTop: 7, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 7px", borderRadius: 6, background: "var(--auth-bg)", border: "1px solid var(--auth-border)", fontSize: 10.5, fontWeight: 700, color: "var(--auth-ink)" }}><Icon name="check" size={11} sw={2.6} /> 官方教材</span>
                    <button onClick={() => { setNavOpen(false); switchBook(); }} style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 7px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-3)", fontSize: 10.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}><Icon name="refresh" size={10} /> 切换</button>
                  </div>
                </div>
                <button onClick={() => setNavOpen(false)} title="收起教材目录" style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-3)", display: "grid", placeItems: "center", cursor: "pointer" }}><Icon name="close" size={14} sw={2.2} /></button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
              {TREE.chapters.map((ch, ci) => (
                <div key={ci} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-2)", padding: "8px 10px" }}>{ch.name}</div>
                  {ch.sections.map((sec, si) => {
                    const on = activeSec.ci === ci && activeSec.si === si;
                    return (
                      <button key={si} onClick={() => pickSection(ci, si)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", fontFamily: "var(--font-zh)", fontSize: 12.5, padding: "8px 10px 8px 16px", borderRadius: 9, marginBottom: 2, cursor: "pointer", fontWeight: on ? 700 : 500, color: on ? "var(--brand-deep)" : "var(--ink-2)", background: on ? "var(--brand-soft)" : "transparent", border: "none", borderLeft: `2px solid ${on ? "var(--brand)" : "transparent"}`, transition: "background .15s, color .15s" }}
                        onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = "var(--surface-2)"; }}
                        onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = "transparent"; }}>
                        <span style={{ flex: 1, minWidth: 0 }}>{sec.name}</span>
                        {on && <span style={{ color: "var(--brand)", flexShrink: 0, display: "inline-flex" }}><Icon name="check" size={13} sw={2.6} /></span>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </React.Fragment>
      )}

      {/* ===== switch-textbook drawer (right overlay) — smoother than swapping the whole page ===== */}
      <div onClick={() => setSwitcherOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 84, background: "rgba(20,16,10,.42)", backdropFilter: "blur(2px)", opacity: switcherOpen ? 1 : 0, pointerEvents: switcherOpen ? "auto" : "none", transition: "opacity .26s" }} />
      <div style={mobile
        ? { position: "fixed", left: 0, right: 0, bottom: 0, height: "88dvh", zIndex: 85, background: "var(--canvas)", borderRadius: "18px 18px 0 0", display: "flex", flexDirection: "column", overflow: "hidden", transform: switcherOpen ? "translateY(0)" : "translateY(101%)", transition: "transform .3s cubic-bezier(.32,.72,0,1)", boxShadow: "0 -18px 50px -24px rgba(0,0,0,.5)" }
        : { position: "fixed", top: 0, right: 0, bottom: 0, width: "min(560px, 96vw)", zIndex: 85, background: "var(--canvas)", display: "flex", flexDirection: "column", overflow: "hidden", transform: switcherOpen ? "translateX(0)" : "translateX(102%)", transition: "transform .3s cubic-bezier(.32,.72,0,1)", boxShadow: "0 18px 60px -24px rgba(0,0,0,.5)" }}>
        {mobile && <div style={{ width: 40, height: 4, borderRadius: 999, background: "var(--line)", margin: "8px auto 0", flexShrink: 0 }} />}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 10, padding: "13px 18px", borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}><CIcon name="book" size={17} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>切换 / 选择教材</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600 }}>当前：{bookLabel}</div>
          </div>
          <button onClick={() => setSwitcherOpen(false)} aria-label="关闭" style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}><Icon name="close" size={16} sw={2.4} /></button>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", position: "relative" }}>
          {switcherOpen && <TextbookPicker onOpen={pickFromDrawer} onFree={freeFromDrawer} onMulti={multiFromDrawer} demoBook={demoBook} compact currentBook={book} />}
        </div>
      </div>

      {/* ===== 教材原文 PDF page viewer ===== */}
      {pdfCite && <PdfPagePreview cite={pdfCite} onClose={() => setPdfCite(null)} mobile={mobile} />}
      {/* ===== 知识卡片（二次加工）===== */}
      {cardModal && <KnowledgeCardModal card={cardModal} onClose={() => setCardModal(null)} onToast={toast} />}
      {tbToast && (
        <div className="enter-pop" style={{ position: "fixed", bottom: 26, left: "50%", transform: "translateX(-50%)", zIndex: 140, background: "var(--ink)", color: "var(--surface)", padding: "11px 18px", borderRadius: 11, fontSize: 13, fontWeight: 700, boxShadow: "0 12px 30px -10px rgba(0,0,0,.4)" }}>{tbToast}</div>
      )}
    </WorkspaceShell>
  );
}

function TextbookInput({ onAsk, scenario, onSwitch }) {
  const [v, setV] = tS("");
  const [att, setAtt] = tS([]);
  const [viewFile, setViewFile] = tS(null);
  const taRef = tR(null);
  const TA_MAX = Math.round(13.5 * 1.5 * 5) + 8; // ~5 lines, then scroll in place
  // auto-grow: 1 line → up to 5 lines, then scroll inside
  tE(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, TA_MAX) + "px";
    el.style.overflowY = el.scrollHeight > TA_MAX + 1 ? "auto" : "hidden";
  }, [v]);
  const send = () => {
    if (!v.trim() && att.length === 0) return;
    onAsk(v.trim() || "（请结合我上传的材料分析）");
    setV("");
    setAtt([]);
  };
  return (
    <div>
      {scenario && <ScenePills scenario={scenario} onSwitch={onSwitch} />}
      {/* homepage-style composer: attachments (top, inside box) → input area → button row, focus border animates */}
      <div
        onFocusCapture={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.boxShadow = "var(--ring), var(--input-shadow)"; }}
        onBlurCapture={(e) => { e.currentTarget.style.borderColor = "var(--input-border)"; e.currentTarget.style.boxShadow = "none"; }}
        style={{ background: "var(--surface)", border: "1.5px solid var(--input-border)", borderRadius: 16, padding: "10px 12px 8px", transition: "border-color .2s, box-shadow .25s" }}
      >
        <FileChips files={att} onRemove={(i) => setAtt((f) => f.filter((_, j) => j !== i))} onView={(n) => setViewFile(n)} style={{ marginBottom: att.length ? 8 : 0 }} />
        <textarea
          ref={taRef}
          value={v}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="就本节教材内容提问，答案有据可依…"
          style={{ width: "100%", display: "block", border: "none", outline: "none", background: "transparent", resize: "none", fontSize: 13.5, fontFamily: "var(--font-zh)", color: "var(--ink)", lineHeight: 1.5, padding: "2px 2px", maxHeight: TA_MAX, overflowY: "hidden", boxSizing: "border-box" }}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 6 }}>
          <ClipButton onFiles={(names) => setAtt((f) => [...f, ...names].slice(0, 6))} compact />
          <button onClick={send} style={{ width: 34, height: 34, borderRadius: 10, border: "none", background: "var(--brand-grad)", backgroundColor: "var(--brand)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}>
            <Icon name="send" size={16} />
          </button>
        </div>
      </div>
      <div style={{ textAlign: "center", fontSize: 10.5, color: "var(--ink-4)", marginTop: 5, lineHeight: 1.2 }}>AI 内容仅供教研参考</div>
      {viewFile && <FileViewer name={viewFile} onClose={() => setViewFile(null)} />}
    </div>
  );
}

function AnswerBlock({ A, activeCite, setActiveCite }) {
  const CiteMark = ({ id, n }) => (
    <sup
      onMouseEnter={() => setActiveCite(id)}
      onMouseLeave={() => setActiveCite(null)}
      style={{
        cursor: "pointer",
        fontSize: 10,
        fontWeight: 800,
        color: "#fff",
        background: activeCite === id ? "var(--accent)" : "var(--brand)",
        borderRadius: 5,
        padding: "1px 5px",
        margin: "0 2px",
        fontFamily: "var(--font-num)",
        transition: "background .15s",
        verticalAlign: "super",
      }}
    >
      {n}
    </sup>
  );
  return (
    <div className="ans-pop" style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
      <BotAvatar size={30} glow />
      <div style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "4px 16px 16px 16px", padding: "18px 20px", boxShadow: "0 8px 26px -20px rgba(0,0,0,.3)" }}>
        <p style={{ margin: "0 0 16px", fontSize: 14.5, lineHeight: 1.7, color: "var(--ink)" }}>
          {A.summary}
          <CiteMark id="c1" n="1" />
          <CiteMark id="c2" n="2" />
        </p>
        {/* comparison table */}
        <div style={{ border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "84px 1fr 1fr", background: "var(--surface-2)", fontSize: 12.5, fontWeight: 800, color: "var(--ink-2)" }}>
            <div style={{ padding: "9px 12px" }}>对比项</div>
            <div style={{ padding: "9px 12px", borderLeft: "1px solid var(--line)", color: "oklch(0.5 0.13 200)" }}>光反应</div>
            <div style={{ padding: "9px 12px", borderLeft: "1px solid var(--line)", color: "oklch(0.52 0.12 145)" }}>暗反应</div>
          </div>
          {A.points.map((p, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "84px 1fr 1fr", fontSize: 12.5, lineHeight: 1.55, borderTop: "1px solid var(--line)" }}>
              <div style={{ padding: "10px 12px", fontWeight: 700, color: "var(--ink-2)", background: "var(--surface-2)" }}>{p.label}</div>
              <div style={{ padding: "10px 12px", borderLeft: "1px solid var(--line)", color: "var(--ink)" }}>{p.light}</div>
              <div style={{ padding: "10px 12px", borderLeft: "1px solid var(--line)", color: "var(--ink)" }}>{p.dark}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--auth-ink)", fontWeight: 700 }}>
            <Icon name="shield" size={14} /> 本回答依据教材原文 {A.citations.length} 处，可查看出处
          </span>
          <div style={{ flex: 1 }} />
          <Btn size="sm" kind="soft" icon="mindmap" onClick={() => onFollow && onFollow("生成知识导图")}>生成知识导图</Btn>
          <Btn size="sm" kind="soft" icon="paper" onClick={() => onFollow && onFollow("出几道练习题")}>出几道练习题</Btn>
        </div>
      </div>
    </div>
  );
}

// ---- cold-start textbook picker (the 问教材 guide page) ----
function TextbookPicker({ onOpen, onFree, onMulti, onResume, memBook, demoBook, compact, currentBook }) {
  const mobile = useIsMobile();
  const [stage, setStage] = tS(currentBook && !currentBook.free && !currentBook.multi ? (currentBook.stage || "") : "");
  const [subject, setSubject] = tS(currentBook && !currentBook.free && !currentBook.multi ? (currentBook.subject || "") : "");
  const [edition, setEdition] = tS(currentBook && !currentBook.free && !currentBook.multi ? (currentBook.edition || "") : "");
  const [name, setName] = tS(currentBook && !currentBook.free && !currentBook.multi ? (currentBook.name || "") : "");
  const [sel, setSel] = tS([]); // multi-select for 综合复习
  const ready = stage && subject && edition && name;
  const keyOf = (b) => `${b.edition}/${b.subject}/${b.name}`;
  const inSel = (b) => sel.some((x) => keyOf(x) === keyOf(b));
  const toggle = (b) => setSel((s) => (s.some((x) => keyOf(x) === keyOf(b)) ? s.filter((x) => keyOf(x) !== keyOf(b)) : [...s, b]));
  const addManual = () => { if (!ready) return; const b = { stage, subject, edition, name }; if (!inSel(b)) setSel((s) => [...s, b]); };
  const enter = () => { if (sel.length === 0) return; if (sel.length === 1) onOpen(sel[0]); else onMulti(sel); };

  // a grade-spanning list so 综合复习 across 七→九 is demonstrable
  const HOT = [
    { ...demoBook, label: "上次大家都在查", recommend: true },
    { edition: "人教版", subject: "数学", name: "七年级上册", stage: "初中" },
    { edition: "人教版", subject: "数学", name: "八年级上册", stage: "初中" },
    { edition: "人教版", subject: "数学", name: "九年级上册", stage: "初中" },
    { edition: "统编版", subject: "语文", name: "七年级上册", stage: "初中" },
    { edition: "统编版", subject: "历史", name: "八年级下册", stage: "初中" },
  ];

  const ChipRow = ({ label, opts, value, set }) => (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-3)", width: 44, flexShrink: 0, paddingTop: 7 }}>{label}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {opts.map((o) => (
          <button key={o} onClick={() => set(o)} style={{ padding: "6px 13px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", border: value === o ? "1px solid var(--brand)" : "1px solid var(--line)", background: value === o ? "var(--brand-soft)" : "var(--surface)", color: value === o ? "var(--brand-deep)" : "var(--ink-2)", transition: "all .15s" }}>{o}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, overflowY: "auto", display: "grid", placeItems: "center", padding: "32px 24px", background: "var(--canvas)" }}>
      <div className="home-fade" style={{ width: "min(680px, 100%)", paddingBottom: sel.length ? 80 : 0 }}>
        <div style={{ textAlign: "center", marginBottom: 22, display: compact ? "none" : "block" }}>
          <div style={{ display: "inline-flex", marginBottom: 12 }}><ScenarioGlyph icon="book" hue={210} size={52} active /></div>
          <h2 style={{ fontSize: 21, fontWeight: 800, color: "var(--ink)", margin: "0 0 7px" }}>问教材，答案有据可依</h2>
          <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: 0, lineHeight: 1.6 }}>每条回答都会<b style={{ color: "var(--brand-deep)" }}>标注教材原文出处</b>。可指定一本、勾选多本做<b>综合复习</b>，也可以不限教材直接问。</p>
        </div>

        {/* continue last — surfaced from 「记忆」 when logged in */}
        {!compact && onResume && memBook && (
          <button onClick={onResume} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, border: "1px solid var(--brand)", background: "var(--brand-soft)", cursor: "pointer", fontFamily: "var(--font-zh)", marginBottom: 12, textAlign: "left", position: "relative" }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 10px 26px -16px var(--brand)")}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}>
            <span style={{ position: "absolute", top: 11, right: 12, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 800, color: "var(--brand-deep)" }}><Icon name="spark" size={11} /> 来自记忆</span>
            <span style={{ width: 40, height: 40, borderRadius: 11, background: "var(--surface)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}><CIcon name="book" size={20} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", marginBottom: 2 }}>继续上次</div>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{memBook.edition} {memBook.subject} · {memBook.name}</div>
              {memBook.section && <div style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>上次看到 {memBook.section}</div>}
            </div>
            <Icon name="arrow" size={18} />
          </button>
        )}

        {/* free ask — no textbook needed */}
        <button onClick={onFree} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderRadius: 14, border: "1px dashed var(--brand-soft-border)", background: "var(--brand-soft)", cursor: "pointer", fontFamily: "var(--font-zh)", marginBottom: 20, textAlign: "left" }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--brand-soft-border)")}>
          <span style={{ width: 38, height: 38, borderRadius: 11, background: "var(--surface)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}><Icon name="spark" size={19} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--brand-deep)" }}>不限教材，直接提问</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600, marginTop: 1 }}>先问起来，需要时再锁定具体教材</div>
          </div>
          <Icon name="arrow" size={18} />
        </button>

        {/* hot / recommended — multi-selectable */}
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-3)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <CIcon name="book" size={14} /> 选择教材 <span style={{ fontWeight: 600, color: "var(--ink-3)" }}>· 可勾选多本做综合复习</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 10, marginBottom: 18 }}>
          {HOT.map((b, i) => {
            const on = inSel(b);
            return (
              <button key={i} onClick={() => toggle(b)} style={{ textAlign: "left", padding: 13, borderRadius: 14, border: on ? "1px solid var(--brand)" : (b.recommend ? "1px solid var(--brand-soft-border)" : "1px solid var(--line)"), background: on ? "var(--brand-soft)" : (b.recommend ? "var(--brand-soft)" : "var(--surface)"), cursor: "pointer", fontFamily: "var(--font-zh)", transition: "all .15s", position: "relative" }} onMouseEnter={(e) => { if (!on) e.currentTarget.style.borderColor = "var(--brand)"; }} onMouseLeave={(e) => { if (!on) e.currentTarget.style.borderColor = b.recommend ? "var(--brand-soft-border)" : "var(--line)"; }}>
                <span style={{ position: "absolute", top: 10, right: 10, width: 18, height: 18, borderRadius: 6, border: on ? "none" : "1.5px solid var(--line)", background: on ? "var(--brand)" : "transparent", color: "#fff", display: "grid", placeItems: "center" }}>{on && <Icon name="check" size={12} sw={3} />}</span>
                <div className="ph-stripe" style={{ width: 34, height: 44, borderRadius: 5, marginBottom: 9, display: "grid", placeItems: "center", color: "var(--ink-3)", fontSize: 8, fontWeight: 700 }}>封面</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)", lineHeight: 1.35, paddingRight: 18 }}>{b.subject} · {b.name}</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 3 }}>{b.edition} · {b.stage}</div>
              </button>
            );
          })}
        </div>

        {/* manual select → add to selection */}
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-3)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ flex: 1, height: 1, background: "var(--line)" }} /> 或手动指定 <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: "16px 18px" }}>
          <ChipRow label="学段" opts={TB_STAGES} value={stage} set={setStage} />
          <ChipRow label="学科" opts={TB_SUBJECTS} value={subject} set={setSubject} />
          <ChipRow label="版本" opts={TB_EDITIONS} value={edition} set={setEdition} />
          <ChipRow label="册次" opts={TB_BOOKS} value={name} set={setName} />
          <button onClick={addManual} disabled={!ready} style={{ width: "100%", marginTop: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px", borderRadius: 12, border: "1px solid " + (ready ? "var(--brand)" : "var(--line)"), background: ready ? "var(--brand-soft)" : "var(--surface)", color: ready ? "var(--brand-deep)" : "var(--ink-3)", fontSize: 13.5, fontWeight: 800, cursor: ready ? "pointer" : "default", fontFamily: "var(--font-zh)", transition: "all .2s" }}>
            <Icon name="plus" size={15} sw={2.4} /> 加入已选
          </button>
          {!ready && <div style={{ textAlign: "center", fontSize: 11, color: "var(--ink-3)", marginTop: 8 }}>选齐学段、学科、版本与册次后可加入</div>}
        </div>
      </div>

      {/* sticky footer: selected books + enter */}
      {sel.length > 0 && (
        <div className="enter-pop" style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: "var(--surface)", borderTop: "1px solid var(--line)", boxShadow: "0 -12px 30px -18px rgba(0,0,0,.3)", padding: mobile ? "10px 14px" : "12px 22px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 7, overflowX: "auto", scrollbarWidth: "none" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-3)", flexShrink: 0 }}>已选 {sel.length} 本</span>
            {sel.map((b, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 6px 4px 10px", borderRadius: 999, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", fontSize: 11.5, fontWeight: 700, color: "var(--brand-deep)", whiteSpace: "nowrap", flexShrink: 0 }}>
                {b.subject}{b.name}
                <span onClick={() => toggle(b)} style={{ display: "inline-flex", cursor: "pointer", opacity: 0.6 }}><Icon name="close" size={12} sw={2.6} /></span>
              </span>
            ))}
          </div>
          <button onClick={enter} style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 20px", borderRadius: 12, border: "none", background: "var(--brand-grad)", backgroundColor: "var(--brand)", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-zh)", boxShadow: "0 6px 18px -8px var(--brand-glow)" }}>
            {sel.length === 1 ? "进入问答" : `综合问答（${sel.length} 本）`} <Icon name="arrow" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function CompareBlock({ CMP, activeCite, setActiveCite, onAsk, onFollow, grouped }) {
  const mobile = useIsMobile();
  const depthColor = (d) => (d.includes("深入") ? { c: "var(--brand-deep)", bg: "var(--brand-soft)", bd: "var(--brand-soft-border)" } : { c: "oklch(0.45 0.11 175)", bg: "oklch(0.95 0.04 175)", bd: "oklch(0.86 0.06 175)" });
  return (
    <div className="cite-pop" style={{ display: "flex", gap: 11, marginTop: grouped ? -8 : 0 }}>
      {grouped ? <div style={{ width: 28, flexShrink: 0 }} /> : <BotAvatar size={28} />}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 13 }}>
        {/* summary */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "4px 14px 14px 14px", padding: "14px 16px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 800, color: "var(--brand-deep)", background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", padding: "3px 9px", borderRadius: 999, marginBottom: 10 }}>
            <Icon name="layers" size={13} /> 跨教材对比 · {CMP.topic}
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.75 }}>{CMP.summary}</p>
        </div>

        {/* edition cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 10 }}>
          {CMP.editions.map((e, i) => {
            const dc = depthColor(e.depth);
            const on = activeCite === "e" + i;
            return (
              <div
                key={i}
                onMouseEnter={() => setActiveCite("e" + i)}
                onMouseLeave={() => setActiveCite(null)}
                style={{ background: "var(--surface)", border: on ? "1px solid var(--brand)" : "1px solid var(--line)", borderRadius: 14, padding: 14, transition: "border-color .18s, box-shadow .18s", boxShadow: on ? "0 10px 24px -16px rgba(0,0,0,.3)" : "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                  <span style={{ width: 26, height: 26, borderRadius: 8, background: e.stage === "高中" ? "var(--brand-soft)" : "oklch(0.95 0.04 175)", color: e.stage === "高中" ? "var(--brand-deep)" : "oklch(0.45 0.11 175)", border: "1px solid " + (e.stage === "高中" ? "var(--brand-soft-border)" : "oklch(0.86 0.06 175)"), display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{e.stage[0]}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.edition}</div>
                    <div style={{ fontSize: 10.5, color: "var(--ink-3)", fontWeight: 600 }}>{e.stage} · {e.book}</div>
                  </div>
                </div>
                <span style={{ display: "inline-block", fontSize: 10.5, fontWeight: 700, color: dc.c, background: dc.bg, border: `1px solid ${dc.bd}`, padding: "2px 8px", borderRadius: 999, marginBottom: 9 }}>{e.depth}</span>
                <p style={{ margin: "0 0 9px", fontSize: 12, color: "var(--ink-2)", lineHeight: 1.65 }}>{e.angle}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 9 }}>
                  {e.tags.map((t, k) => (
                    <span key={k} style={{ fontSize: 10.5, fontWeight: 600, color: "var(--ink-3)", background: "var(--surface-2)", border: "1px solid var(--line)", padding: "2px 7px", borderRadius: 6 }}>{t}</span>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--brand-deep)", fontWeight: 700, paddingTop: 8, borderTop: "1px dashed var(--line)" }}>
                  <Icon name="quote" size={12} /> {e.loc}
                </div>
              </div>
            );
          })}
        </div>

        {/* junior vs senior diff table */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "84px 1fr 1fr", background: "var(--surface-2)", borderBottom: "1px solid var(--line)" }}>
            <div style={{ padding: "9px 12px", fontSize: 11.5, fontWeight: 700, color: "var(--ink-3)" }}>对比维度</div>
            <div style={{ padding: "9px 12px", fontSize: 11.5, fontWeight: 800, color: "oklch(0.45 0.11 175)", borderLeft: "1px solid var(--line)" }}>初中教材</div>
            <div style={{ padding: "9px 12px", fontSize: 11.5, fontWeight: 800, color: "var(--brand-deep)", borderLeft: "1px solid var(--line)" }}>高中教材</div>
          </div>
          {CMP.diff.map((d, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "84px 1fr 1fr", borderBottom: i < CMP.diff.length - 1 ? "1px solid var(--line)" : "none" }}>
              <div style={{ padding: "10px 12px", fontSize: 12, fontWeight: 700, color: "var(--ink-2)" }}>{d.aspect}</div>
              <div style={{ padding: "10px 12px", fontSize: 12, color: "var(--ink-2)", lineHeight: 1.55, borderLeft: "1px solid var(--line)" }}>{d.junior}</div>
              <div style={{ padding: "10px 12px", fontSize: 12, color: "var(--ink-2)", lineHeight: 1.55, borderLeft: "1px solid var(--line)" }}>{d.senior}</div>
            </div>
          ))}
        </div>

        {/* follow-ups */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {["重点对比初中两个版本", "高中人教版怎么讲光反应？", "据此做一份跨学段衔接教案"].map((q, i) => (
            <button key={i} onClick={() => onAsk(q)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 999, border: "1px dashed var(--brand-soft-border)", background: "var(--brand-soft)", color: "var(--brand-deep)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)" }}>
              <Icon name="chat" size={12} /> {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TextbookWorkspace });

// ---- 教材原文 PDF page viewer (scanned-page lightbox) ----
function PdfPagePreview({ cite, onClose, mobile }) {
  const [zoom, setZoom] = tS(1);
  // pull page number out of the loc string (e.g. "第5章 第4节 · P103")
  const pageNo = (cite.loc.match(/P\s*(\d+)/i) || [])[1] || "—";
  const chapter = (cite.loc.split("·")[0] || "").trim();
  // simulated body paragraphs around the highlighted passage so it reads like a real scanned page
  const before = [
    "光合作用是绿色植物通过叶绿体，利用光能，把二氧化碳和水转化成储存着能量的有机物，并且释放出氧气的过程。根据是否需要光，可以把光合作用分为光反应和暗反应两个阶段。",
    "科学家通过一系列实验，逐步揭示了光反应与暗反应之间的物质联系和能量联系。下面我们分别讨论这两个阶段各自的场所、条件以及发生的物质与能量变化。",
  ];
  const after = [
    "由此可见，光反应为暗反应提供了 [H] 和 ATP，暗反应则为光反应再生出 NADP⁺、ADP 和 Pi。两个阶段紧密联系，构成一个完整的光合作用过程。",
    "想一想：如果突然停止光照，短时间内 C₃ 和 C₅ 的含量会发生怎样的变化？请结合上述过程加以分析。",
  ];
  const Line = ({ w }) => <div style={{ height: 9, borderRadius: 3, background: "oklch(0.9 0.006 90)", width: w }} />;
  const Para = ({ text }) => (
    <p style={{ margin: "0 0 14px", fontSize: 13.5, lineHeight: 2, color: "oklch(0.32 0.01 80)", textIndent: "2em", fontFamily: "var(--font-zh)" }}>{text}</p>
  );

  return (
    <React.Fragment>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(20,16,10,.6)", backdropFilter: "blur(3px)", animation: "fadeIn .2s ease" }} />
      <div style={{ position: "fixed", zIndex: 91, inset: mobile ? "0" : "50% auto auto 50%", transform: mobile ? "none" : "translate(-50%, -50%)", width: mobile ? "100%" : "min(720px, 94vw)", height: mobile ? "100%" : "min(88vh, 940px)", display: "flex", flexDirection: "column", background: "var(--surface)", borderRadius: mobile ? 0 : 18, overflow: "hidden", boxShadow: "0 40px 100px -30px rgba(0,0,0,.6)" }}>
        {/* header */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}><CIcon name="book" size={17} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cite.source} · 教材原文</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600 }}>{cite.loc} · 扫描原件</div>
          </div>
          {!mobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginRight: 4 }}>
              <button onClick={() => setZoom((z) => Math.max(0.8, +(z - 0.15).toFixed(2)))} title="缩小" style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer" }}><Icon name="minus" size={15} /></button>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-3)", width: 44, textAlign: "center", fontFamily: "var(--font-num)" }}>{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.15).toFixed(2)))} title="放大" style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer" }}><Icon name="plus" size={15} /></button>
            </div>
          )}
          <button onClick={onClose} aria-label="关闭" style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}><Icon name="close" size={16} sw={2.4} /></button>
        </div>

        {/* scanned page surface */}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", background: "oklch(0.36 0.01 80)", padding: mobile ? "16px 12px" : "26px" }}>
          <div style={{ width: 560 * zoom, maxWidth: "100%", margin: "0 auto", transformOrigin: "top center" }}>
            <div style={{ background: "oklch(0.975 0.008 85)", borderRadius: 3, boxShadow: "0 18px 50px -16px rgba(0,0,0,.5)", padding: mobile ? "30px 22px 40px" : "46px 48px 56px", position: "relative", fontFamily: "var(--font-zh)" }}>
              {/* faint scan texture */}
              <div style={{ position: "absolute", inset: 0, borderRadius: 3, pointerEvents: "none", background: "repeating-linear-gradient(0deg, transparent, transparent 26px, oklch(0.5 0.02 80 / .025) 27px)", mixBlendMode: "multiply" }} />
              {/* running head */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid oklch(0.85 0.01 80)", paddingBottom: 8, marginBottom: 22 }}>
                <span style={{ fontSize: 11.5, color: "oklch(0.5 0.02 80)", fontWeight: 600 }}>{chapter || "第5章 能量供应和利用"}</span>
                <span style={{ fontSize: 11.5, color: "oklch(0.5 0.02 80)", fontWeight: 600 }}>{cite.source}</span>
              </div>
              {/* section title */}
              <h3 style={{ fontSize: mobile ? 18 : 21, fontWeight: 800, color: "oklch(0.25 0.01 80)", margin: "0 0 18px", textAlign: "center", letterSpacing: "1px" }}>第4节　能量之源——光与光合作用</h3>

              {before.map((t, i) => <Para key={i} text={t} />)}

              {/* the cited passage — highlighted like a marker pen, with a margin tab */}
              <div style={{ position: "relative", margin: "0 -8px 16px", padding: "12px 14px 12px", borderRadius: 6, background: "oklch(0.93 0.13 95 / .55)", boxShadow: "inset 0 0 0 1px oklch(0.8 0.12 95 / .6)" }}>
                <span style={{ position: "absolute", top: -1, left: -1, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 800, color: "#fff", background: "var(--brand)", padding: "3px 8px", borderRadius: "6px 0 8px 0", fontFamily: "var(--font-zh)" }}><Icon name="quote" size={11} /> 本回答引用</span>
                <p style={{ margin: "14px 0 0", fontSize: 13.5, lineHeight: 2, color: "oklch(0.28 0.02 70)", textIndent: "2em", fontWeight: 600 }}>{cite.quote}</p>
              </div>

              {after.map((t, i) => <Para key={i} text={t} />)}

              {/* page footer */}
              <div style={{ display: "flex", justifyContent: "center", marginTop: 26, paddingTop: 10, borderTop: "1px solid oklch(0.85 0.01 80)" }}>
                <span style={{ fontSize: 12, color: "oklch(0.5 0.02 80)", fontWeight: 700, fontFamily: "var(--font-num)" }}>— {pageNo} —</span>
              </div>
            </div>
          </div>
        </div>

        {/* copyright / provenance footer */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderTop: "1px solid var(--line)", background: "var(--surface-2)" }}>
          <Icon name="shield" size={14} sw={2} />
          <span style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.5 }}>教材原件由学科网授权扫描收录，仅供教师备课参考，请勿外传或商用。</span>
        </div>
      </div>
    </React.Fragment>
  );
}