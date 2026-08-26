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
