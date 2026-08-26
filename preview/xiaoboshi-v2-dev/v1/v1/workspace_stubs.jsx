// workspace_stubs.jsx — lightweight placeholders for non-core workspaces (旧版保留入口)
// Keeps the app routing intact without the full 234KB of Babel compilation.

function StubWorkspace({ scenario, onHome, nav, label }) {
  const mobile = useIsMobile();
  return (
    <WorkspaceShell scenario={scenario} onHome={onHome} nav={nav} mobilePanelLabel={label} mobilePanelIcon={scenario.icon}>
      <div style={{ flex: 1 }} />
      <div style={{ flex: 1, display: "grid", placeItems: "center", background: "var(--canvas)" }}>
        <div style={{ textAlign: "center", padding: 32 }}>
          <ScenarioGlyph icon={scenario.icon} hue={scenario.hue} size={56} active />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", margin: "16px 0 8px" }}>{scenario.name}</h2>
          <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "0 0 20px", lineHeight: 1.6 }}>该功能将在旧版页面中打开</p>
          <button onClick={onHome} style={{ padding: "10px 22px", borderRadius: 11, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>返回首页</button>
        </div>
      </div>
    </WorkspaceShell>
  );
}

function PaperWorkspace(props) { return <StubWorkspace {...props} label="组卷" />; }
function GradeWorkspace(props) { return <StubWorkspace {...props} label="批改" />; }
function TextbookWorkspace(props) { return <StubWorkspace {...props} label="教材" />; }
function GenericWorkspace(props) { return <StubWorkspace {...props} label="助手" />; }

Object.assign(window, { PaperWorkspace, GradeWorkspace, TextbookWorkspace, GenericWorkspace });
