// icons.jsx — minimal line icons (simple geometric shapes only)
// Each takes { size, stroke } and renders on currentColor.

function Icon({ name, size = 24, sw = 1.8 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: sw,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  const paths = {
    sun: (
      <g>
        <circle cx="12" cy="12" r="4.5" />
        <line x1="12" y1="2.5" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="21.5" />
        <line x1="2.5" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="21.5" y2="12" />
        <line x1="5.2" y1="5.2" x2="7" y2="7" />
        <line x1="17" y1="17" x2="18.8" y2="18.8" />
        <line x1="18.8" y1="5.2" x2="17" y2="7" />
        <line x1="7" y1="17" x2="5.2" y2="18.8" />
      </g>
    ),
    moon: (
      <g>
        <path d="M20 14.5A8 8 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5z" />
      </g>
    ),
    search: (
      <g>
        <circle cx="11" cy="11" r="6.5" />
        <line x1="20" y1="20" x2="16" y2="16" />
      </g>
    ),
    paper: (
      <g>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <line x1="8.5" y1="8" x2="15.5" y2="8" />
        <line x1="8.5" y1="12" x2="15.5" y2="12" />
        <line x1="8.5" y1="16" x2="12.5" y2="16" />
      </g>
    ),
    slides: (
      <g>
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <line x1="9" y1="21" x2="15" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </g>
    ),
    lesson: (
      <g>
        <path d="M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4z" />
        <line x1="8.5" y1="9" x2="13.5" y2="9" />
        <line x1="8.5" y1="13" x2="12" y2="13" />
      </g>
    ),
    book: (
      <g>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5z" />
        <line x1="4" y1="20.5" x2="20" y2="20.5" />
        <line x1="12" y1="3" x2="12" y2="18" />
      </g>
    ),
    mindmap: (
      <g>
        <circle cx="5" cy="12" r="2.4" />
        <circle cx="19" cy="6" r="2.2" />
        <circle cx="19" cy="18" r="2.2" />
        <path d="M7.3 11l9.5-4M7.3 13l9.5 4" />
      </g>
    ),
    interactive: (
      <g>
        <path d="M8 8l9 3.5-3.8 1.4L12 17z" />
        <path d="M5 4.5l1 1M5 11.5l1-1M11.5 5l-1 1" />
      </g>
    ),
    send: (
      <g>
        <path d="M4 12l16-7-7 16-2.2-6.5L4 12z" />
      </g>
    ),
    spark: (
      <g>
        <path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6L12 4z" />
      </g>
    ),
    brain: (
      <g>
        <path d="M12 5a2.5 2.5 0 0 0-4.8.5 2.7 2.7 0 0 0-2.2 2.8 2.6 2.6 0 0 0-1.1 2.4 2.6 2.6 0 0 0 1 4 2.7 2.7 0 0 0 2.4 3.9A2.5 2.5 0 0 0 12 18.6z" />
        <path d="M12 5a2.5 2.5 0 0 1 4.8.5 2.7 2.7 0 0 1 2.2 2.8 2.6 2.6 0 0 1 1.1 2.4 2.6 2.6 0 0 1-1 4 2.7 2.7 0 0 1-2.4 3.9A2.5 2.5 0 0 1 12 18.6z" />
        <path d="M12 13c-.8.9-1.9 1.2-2.8 1M12 13c.8.9 1.9 1.2 2.8 1" />
      </g>
    ),
    cart: (
      <g>
        <path d="M3.5 4.5h1.9l2.3 10.6a1.4 1.4 0 0 0 1.4 1.1h7.8a1.4 1.4 0 0 0 1.4-1.1l1.5-7.1H6" />
        <circle cx="9.7" cy="19.5" r="1.25" />
        <circle cx="16.5" cy="19.5" r="1.25" />
      </g>
    ),
    shield: (
      <g>
        <path d="M12 3l7 2.5v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9v-5L12 3z" />
        <path d="M9 12l2 2 4-4" />
      </g>
    ),
    check: (
      <g>
        <path d="M5 12.5l4 4 10-10" />
      </g>
    ),
    grade: (
      <g>
        <rect x="4" y="4" width="16" height="16" rx="3.2" />
        <path d="M8.2 12.4l2.6 2.6 5-5.6" />
      </g>
    ),
    download: (
      <g>
        <line x1="12" y1="4" x2="12" y2="15" />
        <path d="M8 11l4 4 4-4" />
        <line x1="5" y1="20" x2="19" y2="20" />
      </g>
    ),
    arrow: (
      <g>
        <line x1="5" y1="12" x2="19" y2="12" />
        <path d="M13 6l6 6-6 6" />
      </g>
    ),
    back: (
      <g>
        <line x1="19" y1="12" x2="5" y2="12" />
        <path d="M11 6l-6 6 6 6" />
      </g>
    ),
    filter: (
      <g>
        <path d="M4 6h16M7 12h10M10 18h4" />
      </g>
    ),
    home: (
      <g>
        <path d="M4 11.5L12 4l8 7.5" />
        <path d="M6 10v9.5h12V10" />
      </g>
    ),
    chevron: (
      <g>
        <path d="M6 9l6 6 6-6" />
      </g>
    ),
    chevronRight: (
      <g>
        <path d="M9 6l6 6-6 6" />
      </g>
    ),
    chevronLeft: (
      <g>
        <path d="M15 6l-6 6 6 6" />
      </g>
    ),
    chevronDown: (
      <g>
        <path d="M6 9l6 6 6-6" />
      </g>
    ),
    plus: (
      <g>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </g>
    ),
    minus: (
      <g>
        <line x1="5" y1="12" x2="19" y2="12" />
      </g>
    ),
    quote: (
      <g>
        <path d="M7 7h4v4c0 2-1.5 3.5-3.5 4M14 7h4v4c0 2-1.5 3.5-3.5 4" />
      </g>
    ),
    refresh: (
      <g>
        <path d="M19 8a7 7 0 1 0 1.5 6" />
        <path d="M20 4v4h-4" />
      </g>
    ),
    layers: (
      <g>
        <path d="M12 4l8 4-8 4-8-4 8-4z" />
        <path d="M4 12l8 4 8-4M4 16l8 4 8-4" />
      </g>
    ),
    chat: (
      <g>
        <path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3V6a1 1 0 0 1 1-1z" />
      </g>
    ),
    history: (
      <g>
        <path d="M5 12a7 7 0 1 1 2 5" />
        <path d="M5 17v-4h4" />
        <path d="M12 8v4l3 2" />
      </g>
    ),
    close: (
      <g>
        <line x1="6" y1="6" x2="18" y2="18" />
        <line x1="18" y1="6" x2="6" y2="18" />
      </g>
    ),
    grid: (
      <g>
        <rect x="4" y="4" width="6.5" height="6.5" rx="1.4" />
        <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4" />
        <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4" />
        <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.4" />
      </g>
    ),
    clip: (
      <g>
        <path d="M20 11.5l-7.6 7.6a4 4 0 0 1-5.7-5.7l8-8a2.6 2.6 0 0 1 3.7 3.7l-7.8 7.8a1.2 1.2 0 0 1-1.7-1.7l7-7" />
      </g>
    ),
    list: (
      <g>
        <line x1="9" y1="6" x2="20" y2="6" />
        <line x1="9" y1="12" x2="20" y2="12" />
        <line x1="9" y1="18" x2="20" y2="18" />
        <circle cx="4.5" cy="6" r="1.3" />
        <circle cx="4.5" cy="12" r="1.3" />
        <circle cx="4.5" cy="18" r="1.3" />
      </g>
    ),
    target: (
      <g>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="1" />
      </g>
    ),
    alert: (
      <g>
        <path d="M12 4l9 16H3L12 4z" />
        <line x1="12" y1="10" x2="12" y2="14.5" />
        <line x1="12" y1="17.5" x2="12" y2="17.6" />
      </g>
    ),
    eye: (
      <g>
        <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
        <circle cx="12" cy="12" r="3" />
      </g>
    ),
    file: (
      <g>
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M14 3v4h4" />
      </g>
    ),
    sparkArrow: (
      <g>
        <path d="M5 12h11" />
        <path d="M12 7l5 5-5 5" />
        <path d="M5 5l1.2 1.2M5 19l1.2-1.2" />
      </g>
    ),
    sidebar: (
      <g>
        <rect x="3.5" y="5" width="17" height="14" rx="2.2" />
        <line x1="9.5" y1="5" x2="9.5" y2="19" />
      </g>
    ),
    artifacts: (
      <g>
        <rect x="4" y="3.5" width="16" height="17" rx="3.4" />
        <line x1="8" y1="9" x2="14" y2="9" />
      </g>
    ),
    panelCollapse: (
      <g>
        <rect x="3.5" y="5" width="17" height="14" rx="2.2" />
        <line x1="9.5" y1="5" x2="9.5" y2="19" />
        <path d="M16.8 9.6 14.4 12l2.4 2.4" />
      </g>
    ),
    panelExpand: (
      <g>
        <rect x="3.5" y="5" width="17" height="14" rx="2.2" />
        <line x1="9.5" y1="5" x2="9.5" y2="19" />
        <path d="M14.2 9.6 16.6 12l-2.4 2.4" />
      </g>
    ),
    panelLeftClose: (
      <g>
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M9 3v18" />
        <path d="m16 15-3-3 3-3" />
      </g>
    ),
    panelLeftOpen: (
      <g>
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M9 3v18" />
        <path d="m14 9 3 3-3 3" />
      </g>
    ),
    panelRightClose: (
      <g>
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M15 3v18" />
        <path d="m8 9 3 3-3 3" />
      </g>
    ),
    panelRightOpen: (
      <g>
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M15 3v18" />
        <path d="m10 15-3-3 3-3" />
      </g>
    ),
    enterFull: (
      <g>
        <path d="M4 9V5a1 1 0 0 1 1-1h4" />
        <path d="M20 9V5a1 1 0 0 0-1-1h-4" />
        <path d="M4 15v4a1 1 0 0 0 1 1h4" />
        <path d="M20 15v4a1 1 0 0 1-1 1h-4" />
      </g>
    ),
    exitFull: (
      <g>
        <path d="M9 4v3a2 2 0 0 1-2 2H4" />
        <path d="M15 4v3a2 2 0 0 0 2 2h3" />
        <path d="M9 20v-3a2 2 0 0 0-2-2H4" />
        <path d="M15 20v-3a2 2 0 0 1 2-2h3" />
      </g>
    ),
    menu: (
      <g>
        <line x1="4" y1="7" x2="20" y2="7" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="17" x2="20" y2="17" />
      </g>
    ),
    basket: (
      <g>
        <path d="M5 9h14l-1.2 9.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 9z" />
        <path d="M9 9l1.5-5M15 9l-1.5-5" />
        <line x1="3.5" y1="9" x2="20.5" y2="9" />
      </g>
    ),
    trash: (
      <g>
        <path d="M5 7h14M10 7V5h4v2M6 7l1 13h10l1-13" />
      </g>
    ),
    login: (
      <g>
        <path d="M14 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-4" />
        <path d="M4 12h11M11 8l4 4-4 4" />
      </g>
    ),
    external: (
      <g>
        <path d="M14 4h6v6" />
        <path d="M20 4l-9 9" />
        <path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
      </g>
    ),
    wand: (
      <g>
        <path d="M5 19l9-9" />
        <path d="M13 5.5l1 1M17 9.5l1 1M16.5 5l.7-2M20.5 9l2-.7M18 13l2 1" />
        <path d="M14.5 8.5l1.8-1.8a1.3 1.3 0 0 1 1.8 1.8L16.3 10.3" />
      </g>
    ),
    image: (
      <g>
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <circle cx="9" cy="10" r="1.6" />
        <path d="M5 17l4.5-4.5L13 16l3-3 3 3" />
      </g>
    ),
    template: (
      <g>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <line x1="4" y1="9" x2="20" y2="9" />
        <line x1="11" y1="9" x2="11" y2="20" />
      </g>
    ),
    upload: (
      <g>
        <path d="M12 16V5" />
        <path d="M8 9l4-4 4 4" />
        <path d="M5 18v1a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1" />
      </g>
    ),
    edit: (
      <g>
        <path d="M5 19h3l9-9-3-3-9 9v3z" />
        <path d="M14 7l3 3" />
      </g>
    ),
    sliders: (
      <g>
        <line x1="4" y1="8" x2="20" y2="8" />
        <line x1="4" y1="16" x2="20" y2="16" />
        <circle cx="9" cy="8" r="2.2" />
        <circle cx="15" cy="16" r="2.2" />
      </g>
    ),
    feedback: (
      <g>
        <path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3V6a1 1 0 0 1 1-1z" />
        <line x1="8.5" y1="10" x2="8.5" y2="10.01" />
        <line x1="12" y1="10" x2="12" y2="10.01" />
        <line x1="15.5" y1="10" x2="15.5" y2="10.01" />
      </g>
    ),
    help: (
      <g>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M9.5 9.3a2.5 2.5 0 1 1 3.7 2.2c-.8.5-1.2 1-1.2 2.1" />
        <line x1="12" y1="16.6" x2="12" y2="16.62" />
      </g>
    ),
    megaphone: (
      <g>
        <path d="M4 10v4a1 1 0 0 0 1 1h2l7 4V5l-7 4H5a1 1 0 0 0-1 1z" />
        <path d="M18 9a4 4 0 0 1 0 6" />
      </g>
    ),
  };
  return <svg {...common}>{paths[name] || paths.spark}</svg>;
}

// Custom SVG icon mapping — uses uploaded SVG files as <img>
// Each key maps to [default_path, active_path]
const CUSTOM_ICON_MAP = {
  search:  ["assets/icons/找资源1.svg",   "assets/icons/找资源2.svg"],
  paper:   ["assets/icons/出卷子1.svg",   "assets/icons/出卷子2.svg"],
  slides:  ["assets/icons/做课件1.svg",   "assets/icons/做课件2.svg"],
  lesson:  ["assets/icons/写教案1.svg",   "assets/icons/写教案2.svg"],
  book:    ["assets/icons/问教材1.svg",   "assets/icons/问教材2.svg"],
  mindmap: ["assets/icons/画导图2.svg",   "assets/icons/画导图2.svg"],
  grade:   ["assets/icons/改作业2.svg",   "assets/icons/改作业2.svg"],
  history: ["assets/icons/历史.svg",       "assets/icons/历史.svg"],
  scenarioSpark: ["assets/icons/识别场景.svg", "assets/icons/识别场景.svg"],
  clip:    ["assets/icons/附件.svg",       "assets/icons/附件.svg"],
  brain:   ["assets/icons/我的记忆（默认）.svg", "assets/icons/我的记忆（选中）.svg"],
  grid:    ["assets/icons/我的内容（默认）.svg", "assets/icons/我的内容（选中）.svg"],
  cart:    ["assets/icons/资源篮（默认）.svg",   "assets/icons/资源篮（选中）.svg"],
};

function CIcon({ name, size = 16, active = false }) {
  const entry = CUSTOM_ICON_MAP[name];
  if (!entry) return <Icon name={name} size={size} />;
  const [defSrc, actSrc] = entry;
  // Render both variants stacked and cross-fade via opacity so neither
  // image is ever re-fetched/re-decoded on state change (no flicker).
  const imgBase = { display: "block", width: size, height: size, position: "absolute", inset: 0 };
  if (defSrc === actSrc) {
    return <img src={defSrc} width={size} height={size} style={{ display: "block", flexShrink: 0 }} alt="" />;
  }
  return (
    <span style={{ position: "relative", display: "block", width: size, height: size, flexShrink: 0 }}>
      <img src={defSrc} width={size} height={size} style={{ ...imgBase, opacity: active ? 0 : 1 }} alt="" />
      <img src={actSrc} width={size} height={size} style={{ ...imgBase, opacity: active ? 1 : 0 }} alt="" />
    </span>
  );
}

// Exact accent color for each scenario icon — sampled from the real SVG fills
// so hover borders/shadows match the icon color precisely (not an oklch approximation).
const ICON_ACCENT = {
  search:  "#00BA3F",
  paper:   "#624AFF",
  slides:  "#FF8200",
  lesson:  "#1890FF",
  book:    "#00BA3F",
  mindmap: "#F23CFF",
  grade:   "#FF443F",
  spark:   "#5B6CFF",
};
// Returns the icon's exact accent hex. `alpha` (0–1) appends an 8-digit hex alpha.
function accentFor(icon, alpha) {
  const hex = ICON_ACCENT[icon] || "#5B6CFF";
  if (alpha == null) return hex;
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, "0");
  return hex + a;
}

window.Icon = Icon;
window.CIcon = CIcon;
window.CUSTOM_ICON_MAP = CUSTOM_ICON_MAP;
window.ICON_ACCENT = ICON_ACCENT;
window.accentFor = accentFor;
