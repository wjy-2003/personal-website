// ======== tweaks-panel.jsx ========
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
// Exports (to window): useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider,
//   TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// TweakRadio is the segmented control for 2–3 short options (auto-falls-back to
// TweakSelect past ~16/~10 chars per label); reach for TweakSelect directly when
// options are many or long. For color tweaks always curate 3-4 options rather than
// a free picker; an option can also be a whole 2–5 color palette (the stored value
// is the array). The Tweak* controls are a floor, not a ceiling — build custom
// controls inside the panel if a tweak calls for UI they don't cover.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null
      ? keyOrEdits : { [keyOrEdits]: val };
    setValues((prev) => ({ ...prev, ...edits }));
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', { detail: edits }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({ title = 'Tweaks', children }) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({ x: 16, y: 16 });
  const PAD = 16;

  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth, h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y)),
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);

  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);

  React.useEffect(() => {
    const onMsg = (e) => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);
      else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*');
  };

  const onDragStart = (e) => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = (ev) => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy),
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  if (!open) return null;
  return (
    <>
      <style>{__TWEAKS_STYLE}</style>
      <div ref={dragRef} className="twk-panel" data-omelette-chrome=""
           style={{ right: offsetRef.current.x, bottom: offsetRef.current.y }}>
        <div className="twk-hd" onMouseDown={onDragStart}>
          <b>{title}</b>
          <button className="twk-x" aria-label="Close tweaks"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={dismiss}>✕</button>
        </div>
        <div className="twk-body">
          {children}
        </div>
      </div>
    </>
  );
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({ label, children }) {
  return (
    <>
      <div className="twk-sect">{label}</div>
      {children}
    </>
  );
}

function TweakRow({ label, value, children, inline = false }) {
  return (
    <div className={inline ? 'twk-row twk-row-h' : 'twk-row'}>
      <div className="twk-lbl">
        <span>{label}</span>
        {value != null && <span className="twk-val">{value}</span>}
      </div>
      {children}
    </div>
  );
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({ label, value, min = 0, max = 100, step = 1, unit = '', onChange }) {
  return (
    <TweakRow label={label} value={`${value}${unit}`}>
      <input type="range" className="twk-slider" min={min} max={max} step={step}
             value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </TweakRow>
  );
}

function TweakToggle({ label, value, onChange }) {
  return (
    <div className="twk-row twk-row-h">
      <div className="twk-lbl"><span>{label}</span></div>
      <button type="button" className="twk-toggle" data-on={value ? '1' : '0'}
              role="switch" aria-checked={!!value}
              onClick={() => onChange(!value)}><i /></button>
    </div>
  );
}

function TweakRadio({ label, value, options, onChange }) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = (o) => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({ 2: 16, 3: 10 }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = (s) => {
      const m = options.find((o) => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return <TweakSelect label={label} value={value} options={options}
                        onChange={(s) => onChange(resolve(s))} />;
  }
  const opts = options.map((o) => (typeof o === 'object' ? o : { value: o, label: o }));
  const idx = Math.max(0, opts.findIndex((o) => o.value === value));
  const n = opts.length;

  const segAt = (clientX) => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor(((clientX - r.left - 2) / inner) * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };

  const onPointerDown = (e) => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = (ev) => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <TweakRow label={label}>
      <div ref={trackRef} role="radiogroup" onPointerDown={onPointerDown}
           className={dragging ? 'twk-seg dragging' : 'twk-seg'}>
        <div className="twk-seg-thumb"
             style={{ left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
                      width: `calc((100% - 4px) / ${n})` }} />
        {opts.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={o.value === value}>
            {o.label}
          </button>
        ))}
      </div>
    </TweakRow>
  );
}

function TweakSelect({ label, value, options, onChange }) {
  return (
    <TweakRow label={label}>
      <select className="twk-field" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => {
          const v = typeof o === 'object' ? o.value : o;
          const l = typeof o === 'object' ? o.label : o;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    </TweakRow>
  );
}

function TweakText({ label, value, placeholder, onChange }) {
  return (
    <TweakRow label={label}>
      <input className="twk-field" type="text" value={value} placeholder={placeholder}
             onChange={(e) => onChange(e.target.value)} />
    </TweakRow>
  );
}

function TweakNumber({ label, value, min, max, step = 1, unit = '', onChange }) {
  const clamp = (n) => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({ x: 0, val: 0 });
  const onScrubStart = (e) => {
    e.preventDefault();
    startRef.current = { x: e.clientX, val: value };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = (ev) => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return (
    <div className="twk-num">
      <span className="twk-num-lbl" onPointerDown={onScrubStart}>{label}</span>
      <input type="number" value={value} min={min} max={max} step={step}
             onChange={(e) => onChange(clamp(Number(e.target.value)))} />
      {unit && <span className="twk-num-unit">{unit}</span>}
    </div>
  );
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}

const __TwkCheck = ({ light }) => (
  <svg viewBox="0 0 14 14" aria-hidden="true">
    <path d="M3 7.2 5.8 10 11 4.2" fill="none" strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round"
          stroke={light ? 'rgba(0,0,0,.78)' : '#fff'} />
  </svg>
);

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({ label, value, options, onChange }) {
  if (!options || !options.length) {
    return (
      <div className="twk-row twk-row-h">
        <div className="twk-lbl"><span>{label}</span></div>
        <input type="color" className="twk-swatch" value={value}
               onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = (o) => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return (
    <TweakRow label={label}>
      <div className="twk-chips" role="radiogroup">
        {options.map((o, i) => {
          const colors = Array.isArray(o) ? o : [o];
          const [hero, ...rest] = colors;
          const sup = rest.slice(0, 4);
          const on = key(o) === cur;
          return (
            <button key={i} type="button" className="twk-chip" role="radio"
                    aria-checked={on} data-on={on ? '1' : '0'}
                    aria-label={colors.join(', ')} title={colors.join(' · ')}
                    style={{ background: hero }}
                    onClick={() => onChange(o)}>
              {sup.length > 0 && (
                <span>
                  {sup.map((c, j) => <i key={j} style={{ background: c }} />)}
                </span>
              )}
              {on && <__TwkCheck light={__twkIsLight(hero)} />}
            </button>
          );
        })}
      </div>
    </TweakRow>
  );
}

function TweakButton({ label, onClick, secondary = false }) {
  return (
    <button type="button" className={secondary ? 'twk-btn secondary' : 'twk-btn'}
            onClick={onClick}>{label}</button>
  );
}

Object.assign(window, {
  useTweaks, TweaksPanel, TweakSection, TweakRow,
  TweakSlider, TweakToggle, TweakRadio, TweakSelect,
  TweakText, TweakNumber, TweakColor, TweakButton,
});


// ======== data.jsx ========
// data.jsx — scenario definitions + mock authoritative content
// All content is illustrative mock data for the prototype.

const SCENARIOS = [
  {
    id: "find",
    name: "找资源",
    tagline: "从资源库精准检索",
    desc: "基于学科网资源库，按学段·学科·版本智能匹配",
    icon: "search",
    hue: 150,
    sample: "人教版七年级上册《有理数》同步练习（含解析）",
    samples: ["人教版七年级上册《有理数》同步练习（含解析）", "鲁教版高中地理 热力环流 复习课件", "2025年云南昆明中考化学试卷", "凸透镜成像规律 实验视频"],
  },
  {
    id: "paper",
    name: "出卷子",
    tagline: "组卷一键成型",
    desc: "基于学科网题库智能组卷，难度梯度、知识点全覆盖",
    icon: "paper",
    hue: 25,
    sample: "按湖北物理中考结构，出一份物理中考模拟卷",
    samples: ["按湖北物理中考结构，出一份物理中考模拟卷", "八上生物这节课 选择题30道，答案放最后", "平面向量 概念与模长 出10道题", "正余弦定理 易错题专项，含解析"],
  },
  {
    id: "courseware",
    name: "做课件",
    tagline: "大纲编辑 + 内容生成",
    desc: "告诉课题或选教材章节，先列大纲再展开内容，最后挑模板成稿",
    icon: "slides",
    hue: 255,
    sample: "人教版小学数学三下 第一单元 课件",
    samples: ["人教版小学数学三下 第一单元 课件", "七年级开学班会课件：收心、纪律、学习计划、卫生", "外研版英语必修二 第三单元 早读课件，精美一些", "中考作文赏析与方法总结 PPT，背景浅蓝"],
  },
  {
    id: "lesson",
    name: "写教案",
    tagline: "大纲编辑 + 内容生成",
    desc: "告诉课题或选教材章节，先列大纲再展开内容，编辑或下载成稿",
    icon: "lesson",
    hue: 320,
    sample: "北师大版八下 6.2 平行四边形的判定 教学设计",
    samples: ["北师大版八下 6.2 平行四边形的判定 教学设计", "部编版历史八下 第18课 教学设计", "高一英语外研社必修2 Unit6 教材分析+学情分析+教学方案", "苏教版六下数学《正比例的意义》学习任务单"],
  },
  {
    id: "textbook",
    name: "问教材",
    tagline: "教材问答有据可依",
    desc: "答案逐条引用教材原文，章节页码可溯源",
    icon: "book",
    hue: 200,
    sample: "光反应和暗反应有什么区别？",
    samples: ["光反应和暗反应有什么区别？", "「光合作用」在哪些教材里出现过？", "悬浊液和乳浊液的区别", "椭圆的极点与极线 怎么证明？"],
  },
  {
    id: "mindmap",
    name: "画导图",
    tagline: "知识结构可视化",
    desc: "把章节知识点梳理成清晰的思维导图",
    icon: "mindmap",
    hue: 95,
    sample: "七下数学 第七章 相交线 思维导图",
    samples: ["七下数学 第七章 相交线 思维导图", "九年级 二次函数 思维导图", "高中政治部编版 选必二 第一课 思维导图", "中考一轮复习 分式 考点思维导图"],
  },
  {
    id: "grade",
    name: "改作业",
    tagline: "作业批改与讲评",
    desc: "上传作业，AI 逐题批改、分析错因，并生成评语与班级统计",
    icon: "grade",
    hue: 8,
    sample: "批改这份七年级数学《有理数》随堂练习",
    samples: ["批改这份七年级数学《有理数》随堂练习", "整班批改八上英语 Unit2 单元卷，给质量分析", "这份作文按中考标准评分并写评语", "批改这份物理实验报告，标出问题"],
    badge: "拍照可批",
  },
  {
    id: "explain",
    name: "AI 讲卷",
    tagline: "逐题讲解，讲评成稿",
    desc: "上传试卷或作业，AI 逐题讲解思路与考点，生成可直接投屏的讲评稿",
    icon: "megaphone",
    hue: 40,
    sample: "讲评这份七年级数学《有理数》随堂练习",
    samples: ["讲评这份七年级数学《有理数》随堂练习", "把这份物理卷按错误率排序逐题讲", "生成一份可投屏的讲评课件"],
  },
  {
    id: "image",
    name: "AI 生图",
    tagline: "教学配图一键生成",
    desc: "描述需求即可生成课件插图、情境图与板书示意，风格可控",
    icon: "image",
    hue: 285,
    sample: "生成一张光合作用过程的示意图",
    samples: ["生成一张光合作用过程的示意图", "画一张适合小学的数轴情境图", "给这页课件配一张扁平风插图"],
  },
  {
    id: "agent",
    name: "智能体",
    tagline: "可编排的教学智能体",
    desc: "把多步教学任务编排成可复用的智能体，一次描述、自动执行",
    icon: "spark",
    hue: 210,
    sample: "搭一个「每周错题讲评」智能体",
    samples: ["搭一个「每周错题讲评」智能体", "创建一个自动出周测卷的智能体", "编排一个备课全流程智能体"],
  },
];

// 通用助手 — fallback scenario when intent doesn't match a specific tool.
// Also the place where intent recognition first happens before handing off.
const GENERAL = {
  id: "general",
  name: "通用助手",
  tagline: "有问必答，自动判断该用哪个工具",
  desc: "教学问题随便问，识别到具体需求会带你进入对应工作台",
  icon: "spark",
  hue: 230,
  sample: "我要上一节地理公开课，有什么学生活动或 AI 应用的建议？",
  samples: ["我要上一节地理公开课，有什么学生活动或 AI 应用的建议？", "制定北师大八下数学 从第四单元到期末的十周教学计划", "近三年化学高考 实验安全 的考查规律，三句话总结", "这次期末平均 72、及格率 85%、优秀率 23%，帮我分析问题"],
};

// 真实风格的首页快捷示例（取自真实教师提问，覆盖多学科、查找与生成两类意图）
const HOME_EXAMPLES = [
  { t: "人教版七年级上《有理数》同步练习，含解析", to: "find" },
  { t: "按湖北中考结构出一份物理中考模拟卷", to: "paper" },
  { t: "外研版英语必修二 Unit3 早读课件，精美一些", to: "courseware" },
  { t: "北师大版八下 平行四边形的判定 教学设计", to: "lesson" },
  { t: "九年级 二次函数 思维导图", to: "mindmap" },
  { t: "光反应和暗反应有什么区别？", to: "textbook" },
  { t: "批改这份七年级数学《有理数》随堂练习", to: "grade" },
];


// Mock resource results for 找资源
const RESOURCES = [
  {
    id: 1,
    title: "人教版数学七年级上册 1.2 有理数 同步练习（含解析）",
    type: "同步练",
    grade: "七年级",
    subject: "数学",
    edition: "人教版",
    diff: "基础",
    match: 98,
    downloads: "3.2万",
    pages: 6,
    qcount: 24,
    reviewed: true,
    updated: "2025-08",
    tags: ["有理数", "随堂", "含答案"],
    chips: ["2025–2026学年", "上学期", "同步教学", "答案+解析"],
  },
  {
    id: 2,
    title: "《有理数及其运算》单元检测卷 A 卷",
    type: "单元卷",
    grade: "七年级",
    subject: "数学",
    edition: "人教版",
    diff: "中等",
    match: 95,
    downloads: "1.8万",
    pages: 4,
    qcount: 22,
    reviewed: true,
    updated: "2025-07",
    tags: ["单元卷", "梯度难度"],
    chips: ["上学期", "单元复习", "校考", "答案+解析"],
  },
  {
    id: 3,
    title: "有理数的加减法 微课 + 配套学案",
    type: "学案",
    grade: "七年级",
    subject: "数学",
    edition: "人教版",
    diff: "基础",
    match: 92,
    downloads: "9621",
    pages: 8,
    qcount: 16,
    reviewed: true,
    updated: "2025-09",
    tags: ["微课", "学案", "新授"],
    chips: ["上学期", "新授课", "配套音视频"],
  },
  {
    id: 4,
    title: "有理数易错题精选 30 题（培优）",
    type: "专项训练",
    grade: "七年级",
    subject: "数学",
    edition: "通用",
    diff: "拔高",
    match: 88,
    downloads: "1.1万",
    pages: 5,
    qcount: 30,
    reviewed: true,
    updated: "2025-06",
    tags: ["易错", "培优", "压轴"],
    chips: ["上学期", "专项复习", "精品", "答案+解析"],
  },
  {
    id: 5,
    title: "有理数概念课 教学课件（精品）",
    type: "课件",
    grade: "七年级",
    subject: "数学",
    edition: "人教版",
    diff: "基础",
    match: 84,
    downloads: "2.4万",
    pages: 28,
    qcount: 0,
    reviewed: true,
    updated: "2025-08",
    tags: ["课件", "新授", "情境导入"],
    chips: ["上学期", "新授课", "精品"],
  },
];

// Mock VIDEO resources for 找资源
const VIDEOS = [
  {
    id: "v1",
    kind: "video",
    title: "【实验】探究凸透镜成像规律 演示实验",
    cat: "实验视频",
    subject: "物理",
    grade: "八年级",
    edition: "人教版",
    duration: "12:34",
    quality: "1080P",
    plays: "5.6万",
    match: 96,
    reviewed: true,
    updated: "2025-09",
    chapters: [
      { t: "00:00", name: "实验器材与原理" },
      { t: "02:18", name: "u>2f 成倒立缩小实像" },
      { t: "05:40", name: "f<u<2f 成倒立放大实像" },
      { t: "08:55", name: "u<f 成正立放大虚像" },
      { t: "11:02", name: "数据记录与结论" },
    ],
  },
  {
    id: "v2",
    kind: "video",
    title: "【化学实验】氧气的实验室制取与性质",
    cat: "实验视频",
    subject: "化学",
    grade: "九年级",
    edition: "人教版",
    duration: "09:48",
    quality: "1080P",
    plays: "3.9万",
    match: 90,
    reviewed: true,
    updated: "2025-08",
    chapters: [
      { t: "00:00", name: "药品与装置选择" },
      { t: "03:12", name: "加热高锰酸钾制氧气" },
      { t: "06:30", name: "氧气的验满与收集" },
      { t: "08:05", name: "氧气的性质实验" },
    ],
  },
  {
    id: "v3",
    kind: "video",
    title: "【生物实验】观察根尖分生区细胞的有丝分裂",
    cat: "实验视频",
    subject: "生物学",
    grade: "高一",
    edition: "人教版",
    duration: "14:20",
    quality: "1080P",
    plays: "2.1万",
    match: 88,
    reviewed: true,
    updated: "2025-07",
    chapters: [
      { t: "00:00", name: "装片的制作：解离·漂洗·染色·制片" },
      { t: "05:24", name: "显微镜下观察各分裂时期" },
      { t: "10:10", name: "绘图与时期判断" },
    ],
  },
  {
    id: "v4",
    kind: "video",
    title: "【教师研修】新课标下的大单元教学设计",
    cat: "研修视频",
    subject: "通用",
    grade: "全学段",
    edition: "通用",
    duration: "38:12",
    quality: "1080P",
    plays: "1.4万",
    match: 84,
    reviewed: true,
    updated: "2025-06",
    chapters: [
      { t: "00:00", name: "为什么要做大单元教学" },
      { t: "08:30", name: "单元目标的提取与分解" },
      { t: "19:45", name: "学习任务群的设计" },
      { t: "30:10", name: "评价量规与课例展示" },
    ],
  },
];

// Mock ALBUM (专辑/合集) resources for 找资源
// 专辑详情按「单元 → 课文/专题 → 资料」层级全量展开（参考学科网专辑页层级），
// 资料行只展示文档类，样式与资源列表一致。fmt 决定文件图标（PPT/Word/分层作业/讲义…）。
const ALBUMS = [
  {
    id: "a1",
    kind: "album",
    title: "【上好课】2025-2026学年六年级语文下学期期末考点大串讲",
    subject: "语文",
    grade: "六年级",
    edition: "统编版",
    total: 19,
    downloads: "8.7万",
    match: 94,
    reviewed: true,
    updated: "2025-12",
    composition: [
      { type: "课件", n: 6 },
      { type: "教案", n: 4 },
      { type: "作业", n: 5 },
      { type: "讲义", n: 2 },
      { type: "试卷", n: 2 },
    ],
    units: [
      {
        name: "第一单元 民风民俗",
        lessons: [
          { name: "1 北京的春节/老舍", items: [
            { type: "课件", fmt: "PPT", title: "1 北京的春节（素养进阶教学课件）语文统编版六下", pages: 30 },
            { type: "教案", fmt: "Word", title: "1 北京的春节（素养进阶教学设计）语文统编版六下", pages: 8 },
            { type: "作业", fmt: "作业", title: "1 北京的春节（素养进阶分层作业）语文统编版六下", pages: 5 },
            { type: "讲义", fmt: "讲义", title: "1 北京的春节：详略与场景描写（讲义）语文统编版六下", pages: 6 },
          ] },
          { name: "2 腊八粥/沈从文", items: [
            { type: "课件", fmt: "PPT", title: "2 腊八粥（素养进阶教学课件）语文统编版六下", pages: 28 },
            { type: "教案", fmt: "Word", title: "2 腊八粥（素养进阶教学设计）语文统编版六下", pages: 7 },
            { type: "作业", fmt: "作业", title: "2 腊八粥（素养进阶分层作业）语文统编版六下", pages: 5 },
          ] },
          { name: "3 古诗三首", items: [
            { type: "课件", fmt: "PPT", title: "3 古诗三首（素养进阶教学课件）语文统编版六下", pages: 26 },
            { type: "作业", fmt: "作业", title: "3 古诗三首（素养进阶分层作业）语文统编版六下", pages: 4 },
          ] },
          { name: "4* 藏戏/马晨明", items: [
            { type: "课件", fmt: "PPT", title: "4* 藏戏（素养进阶教学课件）语文统编版六下", pages: 22 },
            { type: "作业", fmt: "作业", title: "4* 藏戏（素养进阶分层作业）语文统编版六下", pages: 4 },
          ] },
        ],
      },
      {
        name: "期末复习专题",
        lessons: [
          { name: "专项 · 阅读理解", items: [
            { type: "讲义", fmt: "讲义", title: "记叙文阅读答题方法 考点精讲（讲义）", pages: 9 },
            { type: "作业", fmt: "作业", title: "课外阅读理解 专项训练（含答案）", pages: 8 },
          ] },
          { name: "专项 · 习作（写人记事）", items: [
            { type: "课件", fmt: "PPT", title: "习作复习：写人记事 考点串讲课件", pages: 24 },
          ] },
          { name: "期末检测", items: [
            { type: "试卷", fmt: "Word", title: "六年级语文下册 期末模拟检测卷（一）含答案", pages: 6, q: 26 },
            { type: "试卷", fmt: "Word", title: "六年级语文下册 期末真题汇编卷（近三年）", pages: 8, q: 30 },
          ] },
        ],
      },
    ],
  },
  {
    id: "a2",
    kind: "album",
    title: "【一轮复习】高三数学《函数与导数》专题突破合集",
    subject: "数学",
    grade: "高三",
    edition: "通用",
    total: 14,
    downloads: "5.2万",
    match: 89,
    reviewed: true,
    updated: "2025-11",
    composition: [
      { type: "课件", n: 5 },
      { type: "讲义", n: 3 },
      { type: "作业", n: 2 },
      { type: "题集", n: 2 },
      { type: "试卷", n: 2 },
    ],
    units: [
      {
        name: "专题一 函数的概念与性质",
        lessons: [
          { name: "1.1 函数的概念与表示", items: [
            { type: "课件", fmt: "PPT", title: "1.1 函数的概念与表示 一轮精讲课件", pages: 38 },
            { type: "教案", fmt: "Word", title: "1.1 函数的概念与表示 一轮复习教学设计", pages: 7 },
            { type: "作业", fmt: "作业", title: "1.1 函数的概念与表示 分层训练（含答案）", pages: 5 },
          ] },
          { name: "1.2 函数的基本性质", items: [
            { type: "课件", fmt: "PPT", title: "1.2 单调性·奇偶性·周期性 专题突破课件", pages: 40 },
            { type: "讲义", fmt: "讲义", title: "1.2 函数性质综合应用（讲义）", pages: 8 },
          ] },
        ],
      },
      {
        name: "专题二 导数及其应用",
        lessons: [
          { name: "2.1 导数的概念与几何意义", items: [
            { type: "课件", fmt: "PPT", title: "2.1 导数的概念与几何意义 一轮精讲课件", pages: 34 },
            { type: "讲义", fmt: "讲义", title: "2.1 导数的几何意义 易错点精讲（讲义）", pages: 6 },
            { type: "题集", fmt: "题集", title: "2.1 导数的几何意义 易错题精选", pages: 5 },
          ] },
          { name: "2.2 导数与函数单调性", items: [
            { type: "课件", fmt: "PPT", title: "2.2 导数与函数单调性 专题突破课件", pages: 36 },
            { type: "作业", fmt: "作业", title: "2.2 导数与单调性 分层训练（含答案）", pages: 5 },
          ] },
          { name: "2.3 导数中的恒成立与压轴", items: [
            { type: "讲义", fmt: "讲义", title: "2.3 恒成立与能成立问题 方法归纳（讲义）", pages: 7 },
            { type: "题集", fmt: "题集", title: "2.3 压轴题：导数中的恒成立问题精选", pages: 4 },
          ] },
        ],
      },
      {
        name: "综合检测",
        lessons: [
          { name: "专题综合检测", items: [
            { type: "试卷", fmt: "Word", title: "函数与导数 专题滚动训练卷（一）含答案", pages: 6, q: 22 },
            { type: "试卷", fmt: "Word", title: "函数与导数 综合检测卷（含解析）", pages: 8, q: 24 },
          ] },
        ],
      },
    ],
  },
];

// Mock textbook Q&A for 问教材
const TEXTBOOK_TREE = {
  edition: "人教版",
  subject: "生物学",
  grade: "高中必修1",
  chapters: [
    {
      name: "第5章 细胞的能量供应和利用",
      sections: [
        { name: "第1节 降低化学反应活化能的酶", active: false },
        { name: "第2节 细胞的能量\"货币\"ATP", active: false },
        { name: "第3节 ATP的主要来源——细胞呼吸", active: false },
        { name: "第4节 光合作用与能量转化", active: true },
      ],
    },
    {
      name: "第6章 细胞的生命历程",
      sections: [
        { name: "第1节 细胞的增殖", active: false },
        { name: "第2节 细胞的分化", active: false },
      ],
    },
  ],
};

const TEXTBOOK_ANSWER = {
  question: "光合作用的光反应和暗反应有什么区别？",
  summary:
    "光反应与暗反应是光合作用相互衔接的两个阶段，主要区别在于场所、条件、物质变化和能量变化四个方面。",
  points: [
    {
      label: "场所",
      light: "类囊体薄膜上",
      dark: "叶绿体基质中",
    },
    {
      label: "条件",
      light: "需要光、色素、酶",
      dark: "有光无光均可进行，需要多种酶",
    },
    {
      label: "物质变化",
      light: "水的光解释放 O₂，生成 [H] 和 ATP",
      dark: "CO₂ 的固定与 C₃ 的还原，生成有机物",
    },
    {
      label: "能量变化",
      light: "光能 → 活跃化学能（ATP）",
      dark: "活跃化学能 → 有机物中稳定化学能",
    },
  ],
  citations: [
    {
      id: "c1",
      source: "人教版生物 必修1",
      loc: "第5章 第4节 · P103",
      quote:
        "光反应阶段必须有光才能进行，在这个阶段中，叶绿体的色素吸收光能……水在光下分解为 [H] 和 O₂。",
    },
    {
      id: "c2",
      source: "人教版生物 必修1",
      loc: "第5章 第4节 · P104",
      quote:
        "暗反应阶段有光、无光都能进行……CO₂ 被 C₅ 固定形成 C₃，再被 [H] 还原成有机物。",
    },
  ],
};

// ---- AI memory / learned teacher profile (mock) ----
const USER_MEMORY = {
  teacher: "李",
  role: "初中数学教师",
  updated: "今天 09:24",
  summary:
    "最近一个月你主要在准备七年级数学，偏好人教版、难度多设为中等。常做随堂练习与单元测试，重点关注《有理数》《整式的加减》等章节；也收藏了不少配套微课与同步课件。",
  tags: [
    { k: "学科", v: "数学" },
    { k: "学段", v: "七年级·上册" },
    { k: "常用版本", v: "人教版" },
    { k: "偏好难度", v: "中等" },
    { k: "常做", v: "随堂练习" },
  ],
  stats: [
    { icon: "slides", label: "课件", n: 12 },
    { icon: "paper", label: "卷子", n: 8 },
    { icon: "lesson", label: "教案", n: 5 },
    { icon: "layers", label: "收藏", n: 36 },
    { icon: "download", label: "下载", n: 120 },
  ],
  recent: [
    { scenario: "paper", icon: "paper", hue: 25, title: "《有理数》随堂练习卷", meta: "人教版 · 七年级 · 中等", when: "昨天", done: true },
    { scenario: "courseware", icon: "slides", hue: 255, title: "《整式的加减》互动课件", meta: "人教版 · 七年级 · 2 课时", when: "3 天前", done: true },
    { scenario: "find", icon: "search", hue: 150, title: "一元一次方程 同步微课", meta: "已收藏 5 个资源", when: "上周", done: true },
  ],
  // discrete memories the AI has formed — shown & editable in 记忆管理
  entries: [
    { id: "e1", icon: "book", text: "常用人教版教材", basis: "近 30 天 25 次创作中 23 次选择人教版", on: true },
    { id: "e2", icon: "filter", text: "出题偏好「中等」难度", basis: "组卷 / 选题时多次设为中等", on: true },
    { id: "e3", icon: "paper", text: "当前重点是七年级上册数学", basis: "近期创作集中在《有理数》《整式的加减》", on: true },
    { id: "e4", icon: "lesson", text: "教案偏好「情境导入」结构", basis: "近 3 份教案均包含情境导入环节", on: true },
    { id: "e5", icon: "search", text: "喜欢配套微课与实验视频", basis: "收藏夹中有 12 个视频类资源", on: true },
  ],
  // last textbook the teacher was reading in 问教材
  textbook: { edition: "人教版", stage: "高中", book: "生物 · 必修1", section: "第5章 第4节 · 能量之源——光合作用", when: "2 天前" },
  // 历史对话 — past chat SESSIONS (process). Click to resume the conversation.
  conversations: [
    { id: "v1", scenario: "find", icon: "search", hue: 150, title: "一元一次方程 同步微课", last: "收藏了 5 个资源", when: "今天", messages: [
      { role: "ai", text: "老师你好，告诉我你要找什么，我会从学科网资源库为你精准匹配。" },
      { role: "user", text: "一元一次方程 同步微课" },
      { role: "ai", text: "好的，已从学科网资源库为你检索到 5 项相关资源。" },
      { role: "user", text: "第二个不错，收藏一下" },
      { role: "ai", text: "已收藏《一元一次方程》同步微课到你的内容。" },
    ] },
    { id: "v2", scenario: "courseware", icon: "slides", hue: 255, title: "《整式的加减》课件", last: "加一个抢答环节", when: "昨天", messages: [
      { role: "ai", text: "好的，我来帮你做课件。告诉我课题，或者在右侧选好教材章节，我先给你列个大纲。" },
      { role: "user", text: "人教版七年级上 整式的加减 课件" },
      { role: "ai", text: "大纲已列在右侧了，你可以增删条目、调整顺序。满意后点「生成课件内容」。" },
      { role: "user", text: "加一个抢答环节" },
      { role: "ai", text: "已在「课堂互动」模块中加入抢答环节。" },
    ] },
    { id: "v3", scenario: "lesson", icon: "lesson", hue: 320, title: "《数轴》教案（情境导入）", last: "导出为 Word", when: "上周", messages: [
      { role: "ai", text: "好的，我来帮你写教案。告诉我课题，或者在右侧选好教材章节，我先给你列个大纲。" },
      { role: "user", text: "人教版七年级上 数轴 教案，情境导入" },
      { role: "ai", text: "大纲已列好，共 5 个模块。确认后点「生成教案内容」。" },
      { role: "user", text: "确认，开始生成" },
      { role: "ai", text: "《数轴》的教案已经写好了，共 5 个模块。可以点「编辑」继续改，也可以直接下载。" },
    ] },
    { id: "v4", scenario: "mindmap", icon: "mindmap", hue: 95, title: "《有理数》知识网络图", last: "已生成思维导图", when: "上周", messages: [
      { role: "ai", text: "好的，我来帮你画导图。告诉我主题，我直接生成。" },
      { role: "user", text: "人教版七年级上 有理数 知识网络图" },
      { role: "ai", text: "《有理数》的思维导图已经画好了，右侧可以编辑节点。" },
    ] },
  ],
  // 我的内容 — everything the teacher has: AI-generated, or downloaded from 找资源…
  works: [
    { id: "w1", scenario: "paper", icon: "paper", hue: 25, title: "《有理数》随堂练习卷", kind: "试卷", source: "AI 生成", meta: "人教版 · 七年级 · 中等 · 12 题", when: "昨天", status: "done" },
    { id: "w2", scenario: "courseware", icon: "slides", hue: 255, title: "《整式的加减》互动课件", kind: "互动课件", source: "AI 生成", meta: "人教版 · 七年级 · 18 页 · 2 课时", when: "3 天前", status: "done" },
    { id: "w3", scenario: "lesson", icon: "lesson", hue: 320, title: "《数轴》教学设计", kind: "教案", source: "AI 生成", meta: "人教版 · 七年级 · 情境导入", when: "上周", status: "done" },
    { id: "w7", scenario: "find", icon: "slides", hue: 210, title: "《一元一次方程》名师同步课件", kind: "课件", source: "找资源下载", meta: "人教版 · 七年级 · 来自资源库", when: "上周", status: "saved" },
    { id: "w4", scenario: "paper", icon: "paper", hue: 25, title: "第一单元《有理数》单元测试", kind: "试卷", source: "找资源下载", meta: "人教版 · 七年级 · 中等 · 24 题", when: "上周", status: "saved" },
    { id: "w5", scenario: "courseware", icon: "slides", hue: 255, title: "《正数和负数》导入课件", kind: "PPT 课件", source: "AI 生成", meta: "人教版 · 七年级 · 12 页", when: "2 周前", status: "draft" },
    { id: "w6", scenario: "mindmap", icon: "mindmap", hue: 95, title: "《有理数》知识网络图", kind: "思维导图", source: "AI 生成", meta: "人教版 · 七年级 · 一章", when: "2 周前", status: "done" },
  ],
};

// 跨教材对比 — same knowledge point across editions (问教材 multi-book compare)
const TEXTBOOK_COMPARE = {
  question: "「光合作用」这个知识点在哪些教材里出现过？各版本怎么讲的？",
  topic: "光合作用",
  summary:
    "「光合作用」在初中与高中多版本教材中均有编排，但深度与侧重差异明显：初中重在现象与意义，高中深入到光反应 / 暗反应的物质与能量变化。共在 4 个版本中检索到对应章节。",
  editions: [
    {
      edition: "人教版", stage: "高中", book: "生物 · 必修1", loc: "第5章 第4节 · P101–105", depth: "深入（机理）",
      angle: "以「能量之源」为线索，系统讲解光反应与暗反应的场所、条件、物质与能量变化，含经典实验（恩格尔曼、鲁宾与卡门同位素标记）。",
      quote: "光反应阶段必须有光才能进行……暗反应阶段有光、无光都能进行，CO₂ 被 C₅ 固定形成 C₃。",
      tags: ["光反应/暗反应", "同位素标记实验", "ATP 与 [H]"],
    },
    {
      edition: "统编版（北师大）", stage: "高中", book: "生物 · 必修1", loc: "第3章 第5节", depth: "深入（机理）",
      angle: "先呈现探究历程（普利斯特利、英格豪斯实验），再归纳反应式，强调科学史与探究方法。",
      quote: "绿色植物通过叶绿体，利用光能，把二氧化碳和水转化成储存着能量的有机物，并释放出氧气。",
      tags: ["科学史导入", "探究方法", "反应式归纳"],
    },
    {
      edition: "人教版", stage: "初中", book: "生物 · 七年级上册", loc: "第3单元 第4章 · P119", depth: "基础（现象与意义）",
      angle: "从绿叶在光下制造有机物的实验切入，重点是光合作用的概念、原料产物与对生物圈的意义，不涉及光暗反应。",
      quote: "光合作用是指绿色植物通过叶绿体，利用光能，制造有机物并释放氧气的过程。",
      tags: ["淀粉检验实验", "原料与产物", "对生物圈的意义"],
    },
    {
      edition: "苏教版", stage: "初中", book: "生物 · 七年级上册", loc: "第3章 第6节", depth: "基础（现象与意义）",
      angle: "结合「绿色植物是有机物的生产者」展开，突出光合作用与呼吸作用的对比，贴近生活应用。",
      quote: "光合作用制造的有机物，不仅满足了自身的需要，还为其他生物提供了食物和能量来源。",
      tags: ["与呼吸作用对比", "生活应用", "有机物的生产"],
    },
  ],
  diff: [
    { aspect: "深度", junior: "现象、概念、意义", senior: "光反应 / 暗反应的物质与能量变化" },
    { aspect: "实验", junior: "绿叶在光下制造淀粉（碘液检验）", senior: "同位素标记、叶绿体色素提取分离" },
    { aspect: "落点", junior: "对生物圈 / 食物链的意义", senior: "反应机理与能量转化、ATP" },
  ],
};

// ---- 改作业 mock data：单份精批 + 整班批改 ----
const GRADE_DATA = {
  single: {
    student: "王梓涵",
    title: "《有理数》随堂练习",
    subject: "数学", grade: "七年级", edition: "人教版",
    total: 100, score: 86, correctRate: 82, used: "约 12 秒",
    questions: [
      { n: 1, type: "选择", status: "right", stu: "B", ans: "B", got: 4, full: 4, point: "相反数的概念" },
      { n: 2, type: "选择", status: "wrong", stu: "C", ans: "D", got: 0, full: 4, point: "有理数大小比较", reason: "两个负数比较大小时，绝对值大的反而小——把 −3 当成比 −1 大了。" },
      { n: 3, type: "填空", status: "right", stu: "−7", ans: "−7", got: 4, full: 4, point: "绝对值" },
      { n: 4, type: "填空", status: "wrong", stu: "8", ans: "−8", got: 0, full: 4, point: "去括号法则", reason: "去括号时括号前是负号，括号内各项都要变号，漏变了符号。" },
      { n: 5, type: "计算", status: "right", stu: "−1", ans: "−1", got: 8, full: 8, point: "有理数混合运算" },
      { n: 6, type: "计算", status: "half", stu: "过程见卷", ans: "−5/6", got: 6, full: 10, point: "分数四则运算", reason: "运算顺序正确，但通分时最小公倍数取错，最后结果未化为最简分数。" },
      { n: 7, type: "解答", status: "half", stu: "过程见卷", ans: "见解析", got: 8, full: 12, point: "数轴与绝对值应用", reason: "建模思路清晰，分类讨论时漏掉了点在原点左侧的情形，丢了一种解。" },
    ],
    comment: "整体掌握良好，基本运算法则清晰、书写规范。失分集中在两类：① 负数的大小比较与符号处理（第 2、4 题）；② 解答题分类讨论不全面（第 7 题）。建议本周针对「负号与绝对值」再做一组专项练习，并在解答题中养成「先列举所有情形」的习惯。",
  },
  classMode: {
    title: "八（3）班 ·《有理数》随堂练习",
    count: 42, graded: 42, avg: 78.5, max: 98, min: 41, passRate: 88, excellentRate: 26,
    perQuestion: [
      { n: 1, rate: 95 }, { n: 2, rate: 62 }, { n: 3, rate: 90 }, { n: 4, rate: 55 },
      { n: 5, rate: 83 }, { n: 6, rate: 67 }, { n: 7, rate: 48 },
    ],
    commonErrors: [
      { q: "第 2 题", point: "有理数大小比较", rate: 38, note: "两个负数比较，误以为绝对值大的更大" },
      { q: "第 4 题", point: "去括号法则", rate: 45, note: "括号前为负号时漏变内部各项符号" },
      { q: "第 7 题", point: "分类讨论", rate: 52, note: "数轴应用题中遗漏点在原点左侧的情形" },
    ],
    weakPoints: ["负数的大小比较与符号处理", "去括号法则的符号变化", "解答题的分类讨论意识"],
    watch: [
      { name: "陈一鸣", score: 41, note: "多道基础题失分，符号概念需个别辅导" },
      { name: "刘思远", score: 53, note: "运算法则薄弱，建议补充基础训练" },
      { name: "周子萱", score: 58, note: "会做但书写不规范，过程分丢失较多" },
    ],
  },
};

// 暂时隐藏的场景（首页快捷、工作台场景切换胶囊、通用助手入口都不展示；仍可从左侧菜单进入）
const HIDDEN_SCENARIOS = ["paper", "textbook", "grade", "explain", "image", "agent"];

window.AIDATA = { SCENARIOS, GENERAL, HIDDEN_SCENARIOS, HOME_EXAMPLES, RESOURCES, TEXTBOOK_TREE, TEXTBOOK_ANSWER, TEXTBOOK_COMPARE, VIDEOS, ALBUMS, USER_MEMORY, GRADE_DATA };


// ======== icons.jsx ========
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


// ======== responsive.jsx ========
// responsive.jsx — mobile/tablet adaptation primitives
// One global hook + a shared bottom-sheet used by the workspaces.
const { useState: rS, useEffect: rE } = React;

// Primary breakpoint: phones + portrait tablets (iPad portrait ≈ 768–834).
// At/below this we switch to the single-column, drawer/sheet patterns.
const MOBILE_BP = 900;
const NARROW_BP = 600; // finer tier for grids

function useIsMobile(bp) {
  bp = bp || MOBILE_BP;
  const get = () => {
    if (typeof window === "undefined") return false;
    const w = window.__forceW || window.innerWidth;
    return w <= bp;
  };
  const [m, setM] = rS(get);
  rE(() => {
    const on = () => setM(get());
    window.addEventListener("resize", on);
    window.addEventListener("orientationchange", on);
    return () => { window.removeEventListener("resize", on); window.removeEventListener("orientationchange", on); };
  }, [bp]);
  return m;
}

// Reflect mobile state on <body> so CSS media-query overrides can take effect.
function useBodyMobileFlag() {
  const mobile = useIsMobile();
  rE(() => { document.body.classList.toggle("is-mobile", mobile); }, [mobile]);
  return mobile;
}

// Context lets ChatPanel / content cards open or close the content sheet.
const WSMobileContext = React.createContext(null);

// ---- Bottom sheet: slides up from the bottom, fills the workspace area ----
// Used to present the workspace's "result / canvas / courseware" pane on phones
// while the chat stays the home base underneath.
function MobileSheet({ open, onClose, title, children, headerRight }) {
  // lock body scroll while open
  rE(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <React.Fragment>
      {/* scrim */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 70,
          background: "rgba(20,16,10,.42)",
          backdropFilter: "blur(2px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity .26s ease",
        }}
      />
      {/* sheet */}
      <div
        style={{
          position: "fixed", left: 0, right: 0, bottom: 0,
          height: "94dvh", maxHeight: "94vh",
          zIndex: 71,
          background: "var(--canvas)",
          borderRadius: "18px 18px 0 0",
          boxShadow: "0 -18px 50px -24px rgba(0,0,0,.5)",
          display: "flex", flexDirection: "column",
          transform: open ? "translateY(0)" : "translateY(101%)",
          transition: "transform .3s cubic-bezier(.32,.72,0,1)",
          overflow: "hidden",
        }}
      >
        {/* grab handle + header */}
        <div style={{ flexShrink: 0, paddingTop: 8 }}>
          <div style={{ width: 40, height: 4, borderRadius: 999, background: "var(--line)", margin: "0 auto 6px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 14px 12px", borderBottom: "1px solid var(--line)" }}>
            <button
              onClick={onClose}
              aria-label="返回对话"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 36, padding: "0 12px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", flexShrink: 0 }}
            >
              <Icon name="chat" size={16} /> 对话
            </button>
            <div style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 800, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "center" }}>{title}</div>
            {headerRight ? <div style={{ flexShrink: 0 }}>{headerRight}</div> : <div style={{ width: 64, flexShrink: 0 }} />}
          </div>
        </div>
        {/* body — the workspace content pane lives here, fills remaining space.
            We force the content root to flex/minHeight:0 so its own internal
            scroll regions (lists, drawers with pinned footers) work on mobile. */}
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", position: "relative" }}>
          {React.Children.map(children, (child) =>
            React.isValidElement(child)
              ? React.cloneElement(child, { style: { ...(child.props.style || {}), flex: 1, minHeight: 0, minWidth: 0 } })
              : child
          )}
        </div>
      </div>
    </React.Fragment>
  );
}

// A compact pill button (used in the workspace header to reveal the sheet).
function SheetPill({ label, icon = "layers", onClick, dot }) {
  return (
    <button
      onClick={onClick}
      style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6, height: 38, padding: "0 14px", borderRadius: 11, border: "none", background: "var(--brand-grad)", backgroundColor: "var(--brand)", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", flexShrink: 0, boxShadow: "0 4px 14px -6px var(--brand-glow)" }}
    >
      <Icon name={icon} size={16} /> {label}
      {dot && <span style={{ position: "absolute", top: 6, right: 8, width: 7, height: 7, borderRadius: "50%", background: "#fff", boxShadow: "0 0 0 2px var(--brand)" }} />}
    </button>
  );
}

// An in-chat card that reveals the content sheet — a softer, contextual
// alternative to the header pill. Reads as a continuation of 小博士's previous
// reply (no separate avatar; indented to align under that bubble). Mobile
// chat-led layouts only; returns null on desktop so the conversation is unchanged.
function ChatSheetCard({ label, count, icon = "layers", hint }) {
  const ctx = React.useContext(WSMobileContext);
  if (!ctx || !ctx.mobile || !ctx.isChatLed || ctx.sheetOpen) return null;
  return (
    <div style={{ display: "flex", maxWidth: "92%", marginTop: -6 }}>
      {/* spacer matching the avatar column above, so the card lines up under the reply bubble */}
      <div style={{ width: 28, flexShrink: 0, marginRight: 9 }} />
      <button
        onClick={() => ctx.setSheetOpen(true)}
        style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10, textAlign: "left", padding: "11px 12px", borderRadius: "4px 14px 14px 14px", border: "1px solid var(--brand-soft-border)", background: "var(--brand-soft)", cursor: "pointer", fontFamily: "var(--font-zh)" }}
      >
        <span style={{ width: 34, height: 34, borderRadius: 10, background: "var(--surface)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}>
          <Icon name={icon} size={17} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--brand-deep)", lineHeight: 1.35 }}>
            {typeof count === "number" ? `已为你整理 ${count} 个${label}` : `查看${label}`}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, marginTop: 2, display: "inline-flex", alignItems: "center", gap: 4 }}>
            {hint || "点此展开查看"} <Icon name="chevron" size={12} sw={2.4} />
          </div>
        </div>
      </button>
    </div>
  );
}

Object.assign(window, { useIsMobile, useBodyMobileFlag, WSMobileContext, MobileSheet, SheetPill, ChatSheetCard, MOBILE_BP, NARROW_BP });


// ======== components.jsx ========
// components.jsx — shared UI atoms

// AI 小博士 brand mark — uses the finalized graduation-cap asset (white knockout on transparent).
// variant: "white" (for colored backgrounds) | "blue" (for light backgrounds).
function GradCapMark({ size = 40, variant = "white" }) {
  const src = variant === "blue" ? "assets/logo-cap-blue.png" : "assets/logo-cap-white.png";
  return (
    <img src={src} alt="" aria-hidden="true" style={{ width: size, height: "auto", display: "block", flexShrink: 0, pointerEvents: "none" }} />
  );
}

function BotAvatar({ size = 40, glow = false }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "30% 30% 38% 38%",
        background: "linear-gradient(160deg, var(--brand), var(--brand-deep))",
        display: "grid",
        placeItems: "center",
        boxShadow: glow
          ? "0 10px 26px -8px var(--brand-glow), 0 0 0 5px color-mix(in oklab, var(--brand), transparent 92%), inset 0 1px 0 rgba(255,255,255,.38)"
          : "inset 0 1px 0 rgba(255,255,255,.38)",
        position: "relative",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      <GradCapMark size={size * 0.62} variant="white" />
    </div>
  );
}

// Authority badge — the core differentiator chip
function AuthorityBadge({ compact = false, label = "三审三校 · 权威认证" }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: compact ? "2px 8px" : "4px 11px",
        borderRadius: 999,
        background: "var(--auth-bg)",
        color: "var(--auth-ink)",
        fontSize: compact ? 11.5 : 12.5,
        fontWeight: 700,
        border: "1px solid var(--auth-border)",
        whiteSpace: "nowrap",
        fontFamily: "var(--font-zh)",
      }}
    >
      <Icon name="shield" size={compact ? 12 : 14} sw={2} />
      {label}
    </span>
  );
}

function Btn({ children, kind = "primary", size = "md", icon, iconRight, onClick, style, disabled }) {
  const sizes = {
    sm: { p: "7px 13px", f: 13, g: 6 },
    md: { p: "10px 18px", f: 14.5, g: 7 },
    lg: { p: "14px 24px", f: 16, g: 8 },
  }[size];
  const kinds = {
    primary: {
      background: "var(--brand-grad)",
      color: "#fff",
      border: "1px solid transparent",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.22), 0 4px 14px -5px var(--brand-glow)",
    },
    soft: {
      background: "var(--brand-soft)",
      color: "var(--brand-deep)",
      border: "1px solid var(--brand-soft-border)",
    },
    ghost: {
      background: "transparent",
      color: "var(--ink-2)",
      border: "1px solid var(--line)",
    },
    plain: {
      background: "transparent",
      color: "var(--ink-2)",
      border: "1px solid transparent",
    },
  }[kind];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: sizes.g,
        padding: sizes.p,
        fontSize: sizes.f,
        fontWeight: 600,
        borderRadius: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        fontFamily: "var(--font-zh)",
        transition: "transform .12s ease, box-shadow .2s ease, background .2s ease",
        ...kinds,
        ...style,
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {icon && <Icon name={icon} size={sizes.f + 2} />}
      {children}
      {iconRight && <Icon name={iconRight} size={sizes.f + 2} />}
    </button>
  );
}

// Scenario glyph tile (colored, uses scenario hue)
function ScenarioGlyph({ icon, hue, size = 46, active }) {
  return <CIcon name={icon} size={size} active />;
}

// thinking dots
function Dots() {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--brand)",
            animation: `bobDot 1s ${i * 0.16}s infinite ease-in-out`,
          }}
        />
      ))}
    </span>
  );
}

// pill chip (filter / suggestion)
function Chip({ children, active, onClick, icon, removable, onRemove }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 13px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "var(--font-zh)",
        border: active ? "1px solid var(--brand)" : "1px solid var(--line)",
        background: active ? "var(--brand-soft)" : "var(--surface)",
        color: active ? "var(--brand-deep)" : "var(--ink-2)",
        transition: "all .15s ease",
        whiteSpace: "nowrap",
      }}
    >
      {icon && <Icon name={icon} size={14} />}
      {children}
      {removable && (
        <span onClick={onRemove} style={{ display: "inline-flex", marginLeft: 1, opacity: 0.6 }}>
          <Icon name="close" size={12} sw={2.4} />
        </span>
      )}
    </button>
  );
}

Object.assign(window, { BotAvatar, GradCapMark, AuthorityBadge, Btn, ScenarioGlyph, Dots, Chip });

// ---- Attachment / reference-material atoms ----
function ClipButton({ onFiles, label = "参考资料", compact = false }) {
  const ref = React.useRef(null);
  return (
    <React.Fragment>
      <input
        ref={ref}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={(e) => {
          const names = [...e.target.files].map((f) => f.name);
          if (names.length) onFiles(names);
          e.target.value = "";
        }}
      />
      <button
        onClick={() => ref.current && ref.current.click()}
        title="上传你手头的素材 / 教案，让小博士基于它创作"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: compact ? "6px 8px" : "7px 12px",
          borderRadius: 10,
          border: "1px dashed var(--input-border)",
          background: "transparent",
          color: "var(--ink-3)",
          fontSize: 12.5,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "var(--font-zh)",
          transition: "color .15s, border-color .15s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--brand-deep)";
          e.currentTarget.style.borderColor = "var(--brand-soft-border)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--ink-3)";
          e.currentTarget.style.borderColor = "var(--input-border)";
        }}
      >
        <CIcon name="clip" size={15} />
        {!compact && label}
      </button>
    </React.Fragment>
  );
}

function FileChips({ files, onRemove, onView, style }) {
  if (!files || files.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7, ...style }}>
      {files.map((f, i) => {
        const name = typeof f === "string" ? f : f.name;
        const status = typeof f === "string" ? "ready" : (f.status || "ready");
        const busy = status !== "ready";
        const note = status === "uploading" ? "上传中" : status === "parsing" ? "解析中" : null;
        return (
          <span
            key={i}
            className="ent-pop"
            onClick={() => !busy && onView && onView(name)}
            title={busy ? undefined : (onView ? "点击查看" : undefined)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 8px 5px 9px",
              borderRadius: 9,
              background: "var(--brand-soft)",
              border: "1px solid var(--brand-soft-border)",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--brand-deep)",
              maxWidth: 240,
              cursor: (!busy && onView) ? "pointer" : "default",
              opacity: busy ? 0.9 : 1,
            }}
          >
            {busy ? <span className="mini-spin" /> : <Icon name="file" size={13} />}
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
            {note && <span style={{ fontSize: 10, fontWeight: 700, color: "var(--ink-3)", whiteSpace: "nowrap" }}>· {note}</span>}
            {onRemove && (
              <span onClick={(e) => { e.stopPropagation(); onRemove(i); }} style={{ display: "inline-flex", cursor: "pointer", opacity: 0.6 }}>
                <Icon name="close" size={12} sw={2.4} />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

// ---- Attachment preview modal (demo: mock filenames, so we render a stand-in preview) ----
function FileViewer({ name, onClose }) {
  if (!name) return null;
  const ext = (name.split(".").pop() || "").toLowerCase();
  const isImg = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext);
  const kind = isImg ? "图片" : ext === "pdf" ? "PDF" : ext === "mp4" ? "视频" : "文档";
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 120, background: "rgba(18,24,38,.5)", backdropFilter: "blur(2px)", display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(520px,92vw)", maxHeight: "86vh", background: "var(--surface)", borderRadius: 16, border: "1px solid var(--line)", boxShadow: "0 24px 60px -20px rgba(0,0,0,.4)", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "var(--font-zh)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", borderBottom: "1px solid var(--line)", flexShrink: 0 }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}><Icon name="file" size={15} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 1 }}>{(ext || "file").toUpperCase()} · 附件预览</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}><Icon name="close" size={15} sw={2.4} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px", background: "var(--surface-2)" }}>
          {isImg ? (
            <div className="ph-stripe" style={{ width: "100%", aspectRatio: "4 / 3", borderRadius: 10, display: "grid", placeItems: "center", color: "var(--ink-3)", fontSize: 12.5, fontWeight: 700 }}>图片预览</div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 8, border: "1px solid var(--line)", padding: "26px 26px", boxShadow: "0 6px 20px -14px rgba(0,0,0,.3)", aspectRatio: "1 / 1.3" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#1a1a1a", textAlign: "center", marginBottom: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
              {[...Array(7)].map((_, k) => (<div key={k} style={{ height: 7, background: "#eee", borderRadius: 3, marginBottom: 10, width: `${88 - ((k * 11) % 40)}%` }} />))}
            </div>
          )}
          <div style={{ marginTop: 14, fontSize: 11.5, color: "var(--ink-3)", textAlign: "center", lineHeight: 1.6 }}>演示环境暂不解析真实文件；正式版会在此预览你上传的{kind}。</div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ClipButton, FileChips, FileViewer });

// ---- Resource peek modal — non-destructive preview of a referenced resource ----
// Used when a teacher clicks a 引用卡片 inside 出卷子/写教案: instead of navigating away
// (which would hide their in-progress draft), we pop a lightweight summary so their work
// is never interrupted. They can choose to open it fully in 找资源, or just keep working.
function ResourcePeek({ item, onClose, onOpenInFind }) {
  if (!item) return null;
  const isAlbum = !!(item.composition || item.units);
  const isVideo = !!(item.chapters || item.cat);
  const kindLabel = isAlbum ? ("专辑 · " + (item.total || "") + " 份") : isVideo ? "视频" : (item.type || "资料");
  const metaLine = [item.edition, item.grade, item.subject].filter(Boolean).join(" · ");
  const chips = item.chips || item.tags || [];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 130, background: "rgba(18,24,38,.5)", backdropFilter: "blur(2px)", display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(460px,92vw)", background: "var(--surface)", borderRadius: 16, border: "1px solid var(--line)", boxShadow: "0 24px 60px -20px rgba(0,0,0,.4)", overflow: "hidden", fontFamily: "var(--font-zh)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "16px 18px 14px" }}>
          <span style={{ width: 38, height: 38, borderRadius: 10, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}><Icon name={isAlbum ? "layers" : isVideo ? "interactive" : "file"} size={18} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--brand-deep)", marginBottom: 3 }}>引用的资源 · {kindLabel}</div>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--ink)", lineHeight: 1.45 }}>{item.title}</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}><Icon name="close" size={14} sw={2.4} /></button>
        </div>
        <div style={{ padding: "0 18px 4px" }}>
          {metaLine && <div style={{ fontSize: 12.5, color: "var(--ink-2)", fontWeight: 600, marginBottom: 9 }}>{metaLine}</div>}
          {isAlbum && item.composition && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 9 }}>
              {item.composition.map((c, i) => <span key={i} style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-3)", background: "var(--surface-2)", border: "1px solid var(--line)", padding: "2px 9px", borderRadius: 7 }}>{c.type} {c.n}</span>)}
            </div>
          )}
          {!isAlbum && chips.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 9 }}>
              {chips.slice(0, 5).map((c, i) => <span key={i} style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-3)", background: "var(--surface-2)", border: "1px solid var(--line)", padding: "2px 9px", borderRadius: 7 }}>{c}</span>)}
            </div>
          )}
        </div>
        <div style={{ margin: "6px 18px 0", padding: "9px 12px", borderRadius: 10, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", fontSize: 12, color: "var(--brand-deep)", fontWeight: 600, lineHeight: 1.5, display: "flex", gap: 7 }}>
          <Icon name="spark" size={14} /> <span>这只是快速预览，<b>不会打断</b>你当前的草稿。</span>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", padding: "14px 18px 16px" }}>
          <button onClick={onClose} style={{ padding: "9px 15px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>继续当前工作</button>
          <button onClick={onOpenInFind} style={{ padding: "9px 15px", borderRadius: 10, border: "none", background: "var(--brand)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", display: "inline-flex", alignItems: "center", gap: 6 }}><CIcon name="search" size={14} /> 在「找资源」中打开</button>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { ResourcePeek });

// ── Shared: smart send with re-routing + a brief "recognizing" header flash ──
// Every workspace routes its chat input through this. On each send we run a
// quick intent check; if the text clearly belongs to a DIFFERENT scenario we
// switch there, otherwise we briefly show the "recognizing" header then hand
// off to the workspace's own local handler.
function useSmartSend({ scenarioId, onSwitch, setMessages, localSend }) {
  const [headerRecognizing, setHeaderRecognizing] = React.useState(false);
  const timer = React.useRef(null);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  const send = React.useCallback((text, files) => {
    const target = (typeof window.detectSwitchTarget === "function") ? window.detectSwitchTarget(text || "") : null;
    const willSwitch = !!(text && text.trim()) && target && target !== scenarioId && typeof onSwitch === "function";
    clearTimeout(timer.current);
    if (willSwitch) {
      // AI auto-switch — remember where we came from so the chat divider can offer a one-click 切回
      const cur = (window.AIDATA.SCENARIOS.find((s) => s.id === scenarioId)) || (window.AIDATA.GENERAL && window.AIDATA.GENERAL.id === scenarioId ? window.AIDATA.GENERAL : null);
      window.ChatSession.switchMeta = { source: "auto", from: cur ? { id: cur.id, name: cur.name } : null };
      // echo the user's message, flash recognizing, then route to the new tool
      setMessages && setMessages((m) => [...m, { role: "user", text, files }]);
      setHeaderRecognizing(true);
      timer.current = setTimeout(() => { setHeaderRecognizing(false); onSwitch(target, text); }, 950);
      return;
    }
    // same scenario → brief header flash, run local handler immediately
    setHeaderRecognizing(true);
    timer.current = setTimeout(() => setHeaderRecognizing(false), 720);
    localSend && localSend(text, files);
  }, [scenarioId, onSwitch, setMessages, localSend]);
  return { headerRecognizing, send };
}

// ── Shared: a small "memory in effect" note for workspaces ──
// Mirrors the 问教材 line — surfaces that the assistant has applied what it
// remembers about the teacher, with an affordance to adjust.
function MemoryNote({ text, actionLabel = "调整", onAction, style }) {
  return (
    <div
      className="trace-pop"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "8px 12px",
        borderRadius: 11,
        background: "var(--brand-soft)",
        border: "1px solid var(--brand-soft-border)",
        fontSize: 12.5,
        color: "var(--ink-2)",
        lineHeight: 1.55,
        ...style,
      }}
    >
      <span style={{ color: "var(--brand-deep)", flexShrink: 0, display: "grid", placeItems: "center" }}><Icon name="spark" size={14} /></span>
      <span style={{ flex: 1, minWidth: 0 }}>{text}</span>
      {onAction && (
        <button
          onClick={onAction}
          style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 8, border: "1px solid var(--brand-soft-border)", background: "var(--surface)", color: "var(--brand-deep)", fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

Object.assign(window, { useSmartSend, MemoryNote });

// ── Chat session: ONE assistant conversation that survives scenario switches ──
// The assistant never "changes sides": when the teacher moves between scenarios
// (找资源 → 出卷子 → …) the left chat keeps the whole thread. Only 新对话 /
// returning home starts a fresh session (cleared by app.jsx).
// distill a conversation title from the teacher's first message — prefer a 《…》
// work title, else strip polite lead-ins and clip to a scannable length.
function distillConvTitle(text) {
  let t = (text || "").replace(/[\n\r]+/g, " ").trim();
  const m = t.match(/《(.+?)》/);
  if (m) {
    const after = t.slice(t.indexOf(m[0]) + m[0].length).replace(/^[，,。·\s的]+/, "");
    const kind = (after.match(/(随堂练习卷|练习卷|单元卷|检测卷|试卷|教学设计|教案|课件|微课|思维导图|导图|答案|讲解|复习)/) || [])[0];
    return "《" + m[1] + "》" + (kind || "");
  }
  t = t.replace(/^(请帮我|帮我一下|帮我|请|帮忙|麻烦|我想要|我想|我要|给我|据|根据|按照|结合)/, "").trim();
  return t ? (t.length > 18 ? t.slice(0, 18) + "…" : t) : "新对话";
}

const ChatSession = {
  log: [],
  scratch: {},           // per-scenario live state (rounds, configs…) that survives switches
  pendingArtifact: null, // set when the teacher clicks an artifact chip from another scenario
  handoffRef: null,      // set when a resource-detail 「据此出卷/教案」 hands off — the target seeds a reference card
  artifactTimes: {},     // { artifactKey → first-seen timestamp } so the 成果 menu can show 创建时间
  sessionId: "s" + Date.now(), // one id per conversation; resets on 新对话 / 回首页
  suppressHistory: false,      // true when resuming an existing item (don't log a NEW history record)
  activeScenario: null,        // {id, icon, hue, name} of the workspace currently in view
  _convTitle: null,            // cached distilled title for this session
  take() {
    const log = this.log.slice();
    // drop trailing switch markers so rapid A→B→C hops leave one divider, not a stack
    while (log.length && log[log.length - 1].role === "sys") log.pop();
    return log;
  },
  save(msgs) {
    this.log = msgs || [];
    // once a session produces a real round (the teacher sent something), log/refresh
    // a single history record named from the FIRST message of the conversation.
    try {
      if (window.recordConversation && !this.suppressHistory && this.activeScenario) {
        const users = this.log.filter((m) => m && m.role === "user" && (m.text || "").trim());
        if (users.length) {
          if (!this._convTitle) this._convTitle = distillConvTitle(users[0].text);
          const sc = this.activeScenario;
          window.recordConversation({
            sid: this.sessionId,
            scenario: sc.id, icon: sc.icon || "chat", hue: sc.hue || 230,
            title: this._convTitle,
            last: (users[users.length - 1].text || "").trim(),
          });
        }
      }
    } catch (e) {}
  },
  clear() {
    this.log = []; this.scratch = {}; this.pendingArtifact = null; this.handoffRef = null; this.artifactTimes = {};
    this.sessionId = "s" + Date.now(); this.suppressHistory = false; this._convTitle = null;
  },
  // build the seeded user bubble for a handed-off query, attaching (and consuming) any handoffRef
  seedUser(q) { const r = this.handoffRef; this.handoffRef = null; return r ? { role: "user", text: q, ref: { title: r.title, type: r.type }, refItem: r.item } : { role: "user", text: q }; },
  echoed(q) {
    const v = (q || "").trim();
    return !!v && this.log.some((m) => m.role === "user" && (m.text || "").trim() === v);
  },
};

// Convert live workspace messages into a frozen, carry-anywhere form:
// drop typing indicators, replace live widgets (intent animation, setup cards)
// with static recaps, and strip per-workspace handles like roundId.
function freezeChat(msgs) {
  return (msgs || [])
    .filter((m) => m && !m.typing)
    .map((m) => {
      if (m.render) {
        if (m.intent) return { role: "ai", wide: true, node: <InlineIntent query={m.intent} instant /> };
        return null; // live setup widgets don't carry across scenarios
      }
      if (m.card) {
        return { role: "ai", node: window.KnowledgeCardImage ? <div style={{ maxWidth: 460 }}><window.KnowledgeCardImage card={m.card} compact /></div> : <span>已生成知识卡片（见「问教材」）。</span> };
      }
      if (m.answer || m.compare) {
        // 「一条贯穿会话」：把问教材回答冻结成可在任意场景渲染的静态快照，
        // 切到出卷子/做课件后，左侧对话里的回答依然完整可见。
        const node = m.compare
          ? (window.FrozenTbCompare ? <window.FrozenTbCompare cmp={m.cmp} /> : <span>已依据教材原文作答（见「问教材」）。</span>)
          : (window.FrozenTbAnswer ? <window.FrozenTbAnswer ans={m.ans} /> : <span>已依据教材原文作答（见「问教材」）。</span>);
        return { role: "ai", artifact: m.artifact, node };
      }
      const { roundId, ...rest } = m;
      return rest;
    })
    .filter(Boolean);
}

Object.assign(window, { ChatSession, freezeChat });

// ── Entering a scenario mid-session: a slim divider, not another chat bubble ──
// First entry of a session keeps the assistant's greeting (it orients the user);
// after that, tab switches only leave a quiet "已切换" marker — and rapid tab
// hopping collapses to a single marker instead of stacking noise.
function enterThread(scenario, greet) {
  const log = ChatSession.take();
  // drop trailing markers (and nothing else) so A→B→C leaves one marker, not three
  while (log.length && log[log.length - 1].role === "sys") log.pop();
  const div = takeSwitchDivider(scenario, log.length > 0);
  if (!log.length) return greet ? [{ role: "ai", node: greet }] : [];
  return [...log, ...div];
}
// ── Switch divider for query-seeded entries ──
// Consumes the switch provenance (ChatSession.switchMeta, set by whoever triggered the
// switch): AI auto-routes carry a one-click 「切回」 back to the previous scenario.
// Always call this when seeding a thread mid-session — it must clear the meta even
// when no divider is rendered, so stale provenance never leaks into a later switch.
function takeSwitchDivider(scenario, hasHistory) {
  const meta = ChatSession.switchMeta || null;
  ChatSession.switchMeta = null;
  if (!hasHistory) return [];
  const back = meta && meta.source === "auto" && meta.from && meta.from.id !== scenario.id ? meta.from : null;
  return [{ role: "sys", text: `已切到「${scenario.name}」`, icon: scenario.icon, back }];
}
Object.assign(window, { enterThread, takeSwitchDivider });


// ======== homepage.jsx ========
// homepage.jsx — unified entry, 3 switchable directions
const { useState, useRef, useEffect } = React;

// 首页输入框下方场景标签中隐藏这些场景（仍可从左侧菜单进入）
const HIDDEN_HOME = ["paper", "textbook", "grade", "explain", "image", "agent"];

function MenuRow({ icon, label, accent, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 9, border: "none", background: "transparent", color: accent ? "var(--brand-deep)" : "var(--ink-2)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", textAlign: "left" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <Icon name={icon} size={15} /> {label}
    </button>
  );
}

// 外观（浅色/深色）—— removed for v1

const LEGACY_LABELS = { "legacy:paper": "智能组卷", "legacy:interactive": "互动课件", "legacy:textbook": "教材百科", "legacy:grade": "作文批改", "legacy:image": "AI 生图", "legacy:explain": "AI 讲卷", "legacy:agent": "智能体" };
const LEGACY_ICONS = { "legacy:paper": "file", "legacy:interactive": "interactive", "legacy:textbook": "book", "legacy:grade": "grade", "legacy:image": "image", "legacy:explain": "megaphone", "legacy:agent": "spark" };
function LegacyPlaceholder({ page }) {
  const label = LEGACY_LABELS[page] || page;
  const icon = LEGACY_ICONS[page] || "spark";
  return (
    <div style={{ flex: 1, display: "grid", placeItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "inline-flex", marginBottom: 14 }}><Icon name={icon} size={48} /></div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", margin: "0 0 8px" }}>{label}</h2>
        <p style={{ fontSize: 14, color: "var(--ink-3)", margin: 0 }}>该功能将在旧版页面中打开</p>
      </div>
    </div>
  );
}

// The shared smart input box
function SmartInput({ value, setValue, onSubmit, big, placeholder, ghost }) {
  const ref = useRef(null);
  const [files, setFiles] = useState([]);
  const fs = big ? 17 : 15;
  const lh = 1.55;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const maxH = Math.round(fs * lh * 5); // cap at 5 lines
    const next = Math.min(el.scrollHeight, maxH);
    el.style.height = next + "px";
    el.style.overflowY = el.scrollHeight > maxH + 1 ? "auto" : "hidden";
  }, [value, fs]);
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1.5px solid var(--input-border)",
        borderRadius: 22,
        boxShadow: "var(--input-shadow)",
        padding: big ? "18px 18px 12px" : "12px 12px 8px",
        transition: "border-color .2s, box-shadow .25s",
      }}
      onFocusCapture={(e) => {
        e.currentTarget.style.borderColor = "var(--brand)";
        e.currentTarget.style.boxShadow = "var(--ring), var(--input-shadow)";
      }}
      onBlurCapture={(e) => {
        e.currentTarget.style.borderColor = "var(--input-border)";
        e.currentTarget.style.boxShadow = "var(--input-shadow)";
      }}
    >
      <FileChips files={files} onRemove={(i) => setFiles((f) => f.filter((_, j) => j !== i))} style={{ margin: "0 2px 4px" }} />
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          } else if (e.key === "Tab" && !e.shiftKey && ghost && !value.trim()) {
            // accept the rotating example as input
            e.preventDefault();
            setValue(ghost);
          }
        }}
        placeholder={placeholder}
        rows={big ? 2 : 1}
        style={{
          width: "100%",
          border: "none",
          outline: "none",
          resize: "none",
          background: "transparent",
          fontSize: fs,
          lineHeight: lh,
          color: "var(--ink)",
          fontFamily: "var(--font-zh)",
          padding: "2px 4px",
          display: "block",
          overflowY: "hidden",
          boxSizing: "border-box",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 10,
          marginTop: big ? 6 : 2,
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <ClipButton onFiles={(names) => setFiles((f) => [...f, ...names].slice(0, 6))} compact />
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              lineHeight: 1,
              color: "var(--ink-3)",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ display: "grid", placeItems: "center", width: 14, height: 14 }}><CIcon name="scenarioSpark" size={14} /></span>
            AI 自动识别场景
          </span>
          {ghost && !value.trim() && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--ink-3)", fontWeight: 600, whiteSpace: "nowrap" }}>
              <kbd style={{ fontFamily: "var(--font-zh)", fontSize: 10.5, fontWeight: 700, padding: "1px 6px", borderRadius: 5, border: "1px solid var(--line)", background: "var(--surface-2)", color: "var(--ink-2)" }}>Tab</kbd> 填入示例
            </span>
          )}
        </div>
        <button
          onClick={onSubmit}
          disabled={!value.trim()}
          aria-label="发送"
          data-tip="发送"
          style={{
            width: big ? 42 : 36,
            height: big ? 42 : 36,
            borderRadius: "50%",
            border: "none",
            display: "grid",
            placeItems: "center",
            background: value.trim() ? "var(--brand-grad)" : "var(--line)",
            color: value.trim() ? "#fff" : "var(--ink-3)",
            cursor: value.trim() ? "pointer" : "default",
            boxShadow: value.trim() ? "inset 0 1px 0 rgba(255,255,255,.25), 0 6px 16px -6px var(--brand-glow)" : "none",
            transition: "all .2s",
            flexShrink: 0,
          }}
        >
          <svg width={big ? 19 : 17} height={big ? 19 : 17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V6"></path><path d="m6 11.5 6-6 6 6"></path></svg>
        </button>
      </div>
    </div>
  );
}

// ---------- Direction A: 对话优先 ----------
function HomeConversation({ value, setValue, onSubmit, onPick, onResume, loggedIn, onLogin, onManageMemory, onOpenWorks }) {
  const S = window.AIDATA.SCENARIOS;
  const EX = window.AIDATA.HOME_EXAMPLES || [];
  const mobile = useIsMobile();
  // rotating ghost example drawn from real teacher prompts (Tab to fill)
  const phs = ["人教版七年级上《有理数》同步练习，含解析", "按湖北中考结构出一份物理中考模拟卷", "外研版英语必修二 Unit3 早读课件，精美一些", "九年级 二次函数 思维导图", "光反应和暗反应有什么区别？"];
  const [phi, setPhi] = useState(0);
  useEffect(() => { const id = setInterval(() => setPhi((i) => (i + 1) % phs.length), 3400); return () => clearInterval(id); }, []);
  return (
    <div className="home-fade" style={{ padding: mobile ? "2vh 16px 20px" : "3vh 24px 22px", textAlign: "center", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 0 }}>
      <div style={{ maxWidth: 760, margin: "0 auto", width: "100%" }}>
        <h1 style={{ fontSize: mobile ? 25 : 36, fontWeight: 800, color: "var(--ink)", margin: "0 0 12px", letterSpacing: "-0.8px" }}>
          老师好，有什么我能帮你的？
        </h1>
        <p style={{ fontSize: mobile ? 14.5 : 16, color: "var(--ink-2)", margin: 0, lineHeight: 1.6 }}>
          说出你的需求，我会从<b style={{ color: "var(--brand-deep)" }}>学科网资源库</b>出发，陪你一起完成。
        </p>
        <div style={{ height: mobile ? 26 : 40 }} />
        <SmartInput
          value={value}
          setValue={setValue}
          onSubmit={onSubmit}
          big
          ghost={phs[phi]}
          placeholder={phs[phi]}
        />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center", marginTop: 22, maxWidth: "min(940px, 96vw)", marginLeft: "auto", marginRight: "auto" }}>
        {S.filter((s) => !HIDDEN_HOME.includes(s.id)).map((s) => (
          <button data-scenario-chip
            key={s.id}
            onClick={() => onPick(s.id)}
            className="chip-pop"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 15px 6px 12px",
              borderRadius: 13,
              boxShadow: "0 1px 4px oklch(0.4 0.08 260 / .06)",
              border: "1px solid var(--line)",
              background: "var(--surface)",
              cursor: "pointer",
              fontFamily: "var(--font-zh)",
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "transform .15s, box-shadow .2s, border-color .2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = `0 10px 24px -12px ${accentFor(s.icon, 0.6)}`;
              e.currentTarget.style.borderColor = accentFor(s.icon);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 1px 4px oklch(0.4 0.08 260 / .06)";
              e.currentTarget.style.borderColor = "var(--line)";
            }}
          >
            <span style={{ width: 22, height: 22, display: "grid", placeItems: "center", flexShrink: 0 }}><CIcon name={s.icon} size={20} active /></span>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{s.name}</span>
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", alignItems: "center", marginTop: 48, maxWidth: 760, marginLeft: "auto", marginRight: "auto" }}>
        <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="spark" size={13} /> 老师们在问</span>
        {EX.slice(0, mobile ? 3 : 5).map((ex, i) => (
          <button key={i} onClick={() => onSubmit(ex.t)} className="chip-pop ex-chip" style={{ animationDelay: `${i * 0.04}s`, maxWidth: "100%", padding: "7px 14px", borderRadius: 999, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-3)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ex.t}</button>
        ))}
      </div>
      <div style={{ maxWidth: 760, margin: "0 auto", width: "100%" }}>
        {loggedIn ? <MemoryPanel onResume={onResume} onManageMemory={onManageMemory} onOpenWorks={onOpenWorks} /> : <LoginHook onLogin={onLogin} />}
      </div>
    </div>
  );
}

// ---------- Login hook (shown when logged out, in place of memory) ----------
function LoginHook({ onLogin }) {
  const M = window.AIDATA.USER_MEMORY;
  const teases = [
    { icon: "spark", t: "记住你的学科、学段与版本偏好" },
    { icon: "history", t: "一键续作上次的课件、试卷与教案" },
    { icon: "layers", t: "同步你的收藏与下载，随处可取" },
  ];
  return (
    <div
      style={{
        marginTop: 26,
        position: "relative",
        background: "var(--surface)",
        border: "1px dashed var(--brand-soft-border)",
        borderRadius: 20,
        overflow: "hidden",
        textAlign: "left",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "20px 22px", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 11px", borderRadius: 999, background: "var(--brand-soft)", color: "var(--brand-deep)", fontSize: 11.5, fontWeight: 700, marginBottom: 11 }}>
            <Icon name="spark" size={13} /> 登录解锁「小博士记忆」
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)", marginBottom: 6 }}>
            登录后，小博士会记住你、越用越懂你
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {teases.map((x, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "var(--ink-2)" }}>
                <span style={{ width: 22, height: 22, borderRadius: 7, background: "var(--surface-2)", border: "1px solid var(--line)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}>
                  <Icon name={x.icon} size={13} />
                </span>
                {x.t}
              </div>
            ))}
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <button
            onClick={onLogin}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 26px", borderRadius: 13, border: "none", background: "var(--brand-grad)", backgroundColor: "var(--brand)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", boxShadow: "0 6px 18px -6px var(--brand-glow)", whiteSpace: "nowrap" }}
          >
            登录 / 注册 <Icon name="arrow" size={17} />
          </button>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", textAlign: "center", marginTop: 8 }}>未登录也可正常使用全部场景</div>
        </div>
      </div>
    </div>
  );
}

// ---------- AI memory: learned teacher profile ----------
function MemoryPanel({ onResume, onManageMemory, onOpenWorks }) {
  const M = window.AIDATA.USER_MEMORY;
  const S = window.AIDATA.SCENARIOS;
  const mobile = useIsMobile();
  // closed → the panel is gone for the rest of this session (not collapsed to a strip),
  // but resets on page refresh so the flow stays testable. teachers can still reach
  // memory anytime via the sidebar「我的记忆」entry.
  const [hidden, setHidden] = useState(true);
  if (hidden) return null;
  const dismiss = () => setHidden(true);

  return (
    <div
      className="mem-card"
      style={{
        marginTop: 26,
        maxWidth: 920,
        marginLeft: "auto",
        marginRight: "auto",
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "var(--shadow-card)",
        textAlign: "left",
      }}
    >
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "13px 18px", borderBottom: "1px solid var(--line)", background: "var(--brand-soft)" }}>
        <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--surface)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}>
          <Icon name="spark" size={16} />
        </span>
        <div style={{ lineHeight: 1.25, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>小博士还记得你</div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            从你的创作与收藏中学习 · 记忆更新于 {M.updated}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={onManageMemory}
          style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 9, border: "1px solid var(--brand-soft-border)", background: "var(--surface)", color: "var(--brand-deep)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", flexShrink: 0 }}
        >
          <Icon name="filter" size={13} /> 管理记忆
        </button>
        <button
          onClick={dismiss}
          title="关闭记忆面板"
          style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--brand-soft-border)", background: "var(--surface)", color: "var(--ink-3)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}
        >
          <Icon name="close" size={14} sw={2.4} />
        </button>
      </div>
      {/* body */}
      <div className="mem-grid" style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1.15fr 0.85fr" }}>
        {/* left: summary + tags + stats */}
        <div className="mem-left" style={{ padding: "16px 18px", borderRight: mobile ? "none" : undefined, borderBottom: mobile ? "1px solid var(--line)" : undefined }}>
          <p style={{ margin: "0 0 13px", fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.7 }}>
            {M.summary}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
            {M.tags.map((t, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--line)", fontSize: 12 }}>
                <span style={{ color: "var(--ink-3)", fontSize: 11 }}>{t.k}</span>
                <span style={{ color: "var(--brand-deep)", fontWeight: 700 }}>{t.v}</span>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, paddingTop: 13, borderTop: "1px dashed var(--line)" }}>
            {M.stats.map((s, i) => (
              <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                <span style={{ color: "var(--ink-3)" }}><CIcon name={s.icon} size={15} /></span>
                <span style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)", fontFamily: "var(--font-num)" }}>{s.n}</span>
                <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        {/* right: resume recent creations */}
        <div style={{ padding: "14px 16px", background: "var(--surface-2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--ink-3)", marginBottom: 11 }}>
            <CIcon name="history" size={14} /> 继续上次创作
            <div style={{ flex: 1 }} />
            <button onClick={onOpenWorks} style={{ display: "inline-flex", alignItems: "center", gap: 3, border: "none", background: "transparent", color: "var(--brand-deep)", fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>
              我的内容 <Icon name="arrow" size={13} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {M.recent.map((r, i) => (
              <button
                key={i}
                onClick={() => onResume && onResume(r)}
                style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 11px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", cursor: "pointer", fontFamily: "var(--font-zh)", textAlign: "left", transition: "transform .15s, border-color .2s, box-shadow .2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateX(3px)"; e.currentTarget.style.borderColor = accentFor(r.icon); e.currentTarget.style.boxShadow = `0 8px 18px -12px ${accentFor(r.icon, 0.5)}`; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <ScenarioGlyph icon={r.icon} hue={r.hue} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.meta} · {r.when}</div>
                </div>
                <span style={{ color: "var(--ink-3)", flexShrink: 0 }}><Icon name="arrow" size={16} /></span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Direction B: 场景宫格 (same shell as 对话优先, scenarios as a balanced grid) ----------
function HomeGrid({ value, setValue, onSubmit, onPick, onResume, loggedIn, onLogin, onManageMemory, onOpenWorks }) {
  const S = window.AIDATA.SCENARIOS;
  const mobile = useIsMobile();
  const narrow = useIsMobile(NARROW_BP);
  const cols = Math.ceil(S.length / 2); // 6→3+3, 7→4+3, 8→4+4
  const gridCols = narrow ? 1 : mobile ? 2 : cols;
  return (
    <div className="home-fade" style={{ padding: mobile ? "2vh 16px 36px" : "4vh 24px 40px", textAlign: "center" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: mobile ? 16 : 20 }}>
          <BotAvatar size={mobile ? 54 : 66} glow />
        </div>
        <h1 style={{ fontSize: mobile ? 24 : 34, fontWeight: 800, color: "var(--ink)", margin: "0 0 10px", letterSpacing: "-0.5px" }}>
          选个场景，或直接告诉我你的需求
        </h1>
        <p style={{ fontSize: mobile ? 14.5 : 16, color: "var(--ink-2)", margin: "0 0 28px", lineHeight: 1.6 }}>
          说出你的需求，我会从<b style={{ color: "var(--brand-deep)" }}>学科网资源库</b>出发，陪你一起完成。
        </p>
        <SmartInput
          value={value}
          setValue={setValue}
          onSubmit={onSubmit}
          big
          placeholder="描述你的教学需求，AI 自动判断该进入哪个场景…"
        />
      </div>
      <div
        style={{
          maxWidth: 1000,
          margin: mobile ? "20px auto 0" : "26px auto 0",
          display: "grid",
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gap: mobile ? 12 : 16,
        }}
      >
        {S.filter((s) => !HIDDEN_HOME.includes(s.id)).map((s) => (
          <button data-scenario-chip
            key={s.id}
            onClick={() => onPick(s.id)}
            className="chip-pop"
            style={{
              textAlign: "left",
              padding: 20,
              borderRadius: 18,
              border: "1px solid var(--line)",
              background: "var(--surface)",
              cursor: "pointer",
              fontFamily: "var(--font-zh)",
              transition: "transform .18s, box-shadow .25s, border-color .2s",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = `0 16px 32px -16px ${accentFor(s.icon, 0.55)}`;
              e.currentTarget.style.borderColor = accentFor(s.icon);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = "var(--line)";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <ScenarioGlyph icon={s.icon} hue={s.hue} size={46} />
              <span style={{ color: accentFor(s.icon), opacity: 0.5 }}>
                <Icon name="arrow" size={18} />
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)" }}>{s.name}</div>
              {s.badge && (
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "oklch(0.5 0.13 45)", background: "oklch(0.95 0.05 45)", padding: "2px 7px", borderRadius: 999 }}>{s.badge}</span>
              )}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: accentFor(s.icon), marginTop: 3 }}>
              {s.tagline}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 8, lineHeight: 1.55 }}>{s.desc}</div>
          </button>
        ))}
      </div>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {loggedIn ? <MemoryPanel onResume={onResume} onManageMemory={onManageMemory} onOpenWorks={onOpenWorks} /> : <LoginHook onLogin={onLogin} />}
      </div>
    </div>
  );
}

// ---------- Direction C: 助手人格 ----------
function HomePersona({ value, setValue, onSubmit, onPick, onResume, loggedIn, onLogin, onManageMemory, onOpenWorks }) {
  const S = window.AIDATA.SCENARIOS;
  const M = window.AIDATA.USER_MEMORY;
  const mobile = useIsMobile();
  return (
    <div className="home-fade" style={{ maxWidth: 1080, margin: "0 auto", padding: mobile ? "1vh 16px 36px" : "2vh 24px 40px" }}>
    <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "minmax(300px, 0.9fr) 1.1fr", gap: mobile ? 18 : 40, alignItems: "start" }}>
      {/* left: the assistant — who I am + what I remember about you */}
      <div>
        <BotAvatar size={mobile ? 68 : 88} glow />
        <div
          style={{
            marginTop: 20,
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "4px 20px 20px 20px",
            padding: "18px 20px",
            boxShadow: "var(--shadow-card)",
            position: "relative",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", marginBottom: 2 }}>
            我是 AI 小博士 👋
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--brand-deep)", marginBottom: 9 }}>
            你的 AI 教学助手
          </div>
          <p style={{ fontSize: 14.5, color: "var(--ink-2)", lineHeight: 1.7, margin: 0 }}>
            和别的 AI 不同，我的每一份产出都<b style={{ color: "var(--brand-deep)" }}>是站在学科网的资源库之上</b> —— 不是凭空生成，而是有据可依。
          </p>
        </div>

        {/* memory belongs to the assistant's persona — folded in here, not laid flat */}
        {loggedIn ? (
          <div className="mem-card" style={{ marginTop: 16, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 18, overflow: "hidden", boxShadow: "var(--shadow-card)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid var(--line)", background: "var(--brand-soft)" }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--surface)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}>
                <Icon name="spark" size={15} />
              </span>
              <div style={{ lineHeight: 1.25, minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>而且，我还记得你</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600 }}>记忆更新于 {M.updated}</div>
              </div>
              <button onClick={onManageMemory} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 9, border: "1px solid var(--brand-soft-border)", background: "var(--surface)", color: "var(--brand-deep)", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", flexShrink: 0 }}>
                <Icon name="filter" size={12} /> 管理
              </button>
            </div>
            <div style={{ padding: "14px 16px" }}>
              <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--ink-2)", lineHeight: 1.7 }}>{M.summary}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 13 }}>
                {M.tags.map((t, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--line)", fontSize: 12 }}>
                    <span style={{ color: "var(--ink-3)", fontSize: 11 }}>{t.k}</span>
                    <span style={{ color: "var(--brand-deep)", fontWeight: 700 }}>{t.v}</span>
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 6, marginBottom: 9, paddingTop: 12, borderTop: "1px dashed var(--line)" }}>
                <CIcon name="history" size={13} /> 继续上次创作
                <div style={{ flex: 1 }} />
                <button onClick={onOpenWorks} style={{ display: "inline-flex", alignItems: "center", gap: 3, border: "none", background: "transparent", color: "var(--brand-deep)", fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>
                  我的内容 <Icon name="arrow" size={12} />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {M.recent.slice(0, 2).map((r, i) => (
                  <button
                    key={i}
                    onClick={() => onResume && onResume(r)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface-2)", cursor: "pointer", fontFamily: "var(--font-zh)", textAlign: "left", transition: "transform .15s, border-color .2s, box-shadow .2s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateX(3px)"; e.currentTarget.style.borderColor = accentFor(r.icon); e.currentTarget.style.boxShadow = `0 8px 18px -12px ${accentFor(r.icon, 0.5)}`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <ScenarioGlyph icon={r.icon} hue={r.hue} size={32} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.meta} · {r.when}</div>
                    </div>
                    <span style={{ color: "var(--ink-3)", flexShrink: 0 }}><Icon name="arrow" size={15} /></span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          {/* memory removed for v1 */}
        )}
      </div>
      {/* right input + actions */}
      <div>
        <SmartInput
          value={value}
          setValue={setValue}
          onSubmit={onSubmit}
          big
          placeholder="描述你的教学需求，AI 自动判断该进入哪个场景…"
        />
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-3)", margin: "22px 2px 12px" }}>
          我可以帮你 —
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {S.filter((s) => !HIDDEN_HOME.includes(s.id)).map((s) => (
            <button data-scenario-chip
              key={s.id}
              onClick={() => onPick(s.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "9px 14px",
                borderRadius: 14,
                border: "1px solid var(--line)",
                background: "var(--surface)",
                cursor: "pointer",
                fontFamily: "var(--font-zh)",
                textAlign: "left",
                transition: "transform .15s, border-color .2s, background .2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = accentFor(s.icon);
                e.currentTarget.style.transform = "translateX(3px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--line)";
                e.currentTarget.style.transform = "none";
              }}
            >
              <ScenarioGlyph icon={s.icon} hue={s.hue} size={38} />
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)", display: "flex", alignItems: "center", gap: 6 }}>
                  {s.name}
                  {s.badge && (
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: "oklch(0.5 0.13 45)", background: "oklch(0.95 0.05 45)", padding: "1px 6px", borderRadius: 999 }}>{s.badge}</span>
                  )}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 1 }}>{s.tagline}</div>
              </div>
            </button>
          ))}
        </div>
        {/* not sure which? the assistant figures it out */}
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 11, padding: "13px 16px", borderRadius: 14, border: "1px dashed var(--brand-soft-border)", background: "var(--brand-soft)" }}>
          <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--surface)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}>
            <Icon name="spark" size={16} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>不确定用哪个？直接说就好</div>
            <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 1, lineHeight: 1.5 }}>把需求写在上面的输入框，小博士会自动判断该进入哪个场景，没有合适的就直接回答你。</div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

function AuthorityStrip() {
  const mobile = useIsMobile();
  const stats = [
    ["2000万+", "精品资源"],
    ["20年", "教研沉淀"],
    ["三审三校", "质量把关"],
    ["全学段", "覆盖"],
  ];
  return (
    <div style={{ marginTop: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: mobile ? "column" : "row", alignItems: "center", gap: mobile ? 8 : 16, padding: mobile ? "10px 16px" : "9px 24px", borderRadius: mobile ? 14 : 999, maxWidth: "100%", background: "color-mix(in oklab, var(--auth-bg), var(--surface) 35%)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600, color: "color-mix(in oklab, var(--auth-ink), var(--surface) 22%)", whiteSpace: "nowrap" }}>
          <Icon name="shield" size={14} /> 每一份生成，都有学科网资源库支撑
        </span>
        {!mobile && <span style={{ width: 1, height: 14, background: "color-mix(in oklab, var(--auth-border), var(--surface) 30%)", flexShrink: 0 }} />}
        <span style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: mobile ? "4px 14px" : "4px 16px" }}>
          {stats.map(([n, l], i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "baseline", gap: 4, fontSize: 12, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
              <b style={{ fontSize: 12, fontWeight: 700, color: "color-mix(in oklab, var(--auth-ink), var(--surface) 18%)", fontFamily: "var(--font-num)" }}>{n}</b>{l}
            </span>
          ))}
        </span>
      </div>
      <div style={{ textAlign: "center", fontSize: 11, color: "color-mix(in oklab, var(--ink-3), var(--surface) 25%)", marginTop: 7, lineHeight: 1.6 }}>
        AI 内容仅供教研参考，请结合实际教学进行调整
      </div>
    </div>
  );
}

function Homepage({ page, layout, value, setValue, onSubmit, onPick, onResume, loggedIn, onLogin, onLogout, onNavigate, onNewChat, onRequireLogin, onOpenBasket, basketCount, basketItems, onRemoveBasket, onClearBasket, conversations }) {
  const Comp =
    layout === "场景宫格" ? HomeGrid : layout === "助手人格" ? HomePersona : HomeConversation;
  const mobile = useIsMobile();
  const [navOpen, setNavOpen] = useState(false);
  const closeNav = () => setNavOpen(false);
  const navTo = (p) => { onNavigate(p); closeNav(); };
  const newChat = () => { onNewChat(); closeNav(); };
  // desktop rail: collapsed = fully hidden + a slim expand button (matches the workspace
  // 工作台 behavior), instead of shrinking to a 72px icon strip. Shares the same
  // persisted key so the choice carries between 首页 and 场景工作台.
  const [railOpen, setRailOpenState] = useState(() => localStorage.getItem("aida_rail_open") !== "0");
  const setRailOpen = (v) => { setRailOpenState(v); try { localStorage.setItem("aida_rail_open", v ? "1" : "0"); } catch (e) {} };
  const railIconBtn = { width: 32, height: 32, borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 };
  const railHoverFx = {
    onMouseEnter: (e) => (e.currentTarget.style.background = "var(--surface-2)"),
    onMouseLeave: (e) => (e.currentTarget.style.background = "var(--surface)"),
  };
  const gate = (fn) => (loggedIn ? fn : onRequireLogin);
  const memProps = {
    onResume: loggedIn ? onResume : (() => onRequireLogin()),
    loggedIn,
    onLogin: onRequireLogin,
        onOpenWorks: () => (loggedIn ? onNavigate("works") : onRequireLogin()),
  };
  return (
    <div style={{ height: "100dvh", display: "flex", overflow: "hidden" }}>
      {mobile ? (
        <LeftRail
          page={page}
          loggedIn={loggedIn}
          onNavigate={navTo}
          onPick={onPick}
          onNewChat={newChat}
          onResume={(it) => { onResume && onResume(it); closeNav(); }}
          onLogout={onLogout}
          onRequireLogin={onRequireLogin}
          mobile={mobile}
          mobileOpen={navOpen}
          onCloseMobile={closeNav}
          onOpenBasket={() => { onOpenBasket && onOpenBasket(); closeNav(); }}
          basketCount={basketCount}
          conversations={conversations}
        />
      ) : railOpen ? (
        <LeftRail
          page={page}
          loggedIn={loggedIn}
          onNavigate={navTo}
          onPick={onPick}
          onNewChat={newChat}
          onResume={(it) => { onResume && onResume(it); closeNav(); }}
          onLogout={onLogout}
          onRequireLogin={onRequireLogin}
          mobile={mobile}
          onOpenBasket={() => { onOpenBasket && onOpenBasket(); closeNav(); }}
          basketCount={basketCount}
          conversations={conversations}
          forceOpen
          onCollapse={() => setRailOpen(false)}
        />
      ) : null}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", position: "relative", background: "var(--surface)" }}>
        {!mobile && !railOpen && (
          <div style={{ position: "absolute", top: 14, left: 14, zIndex: 20, display: "inline-flex", gap: 6 }}>
            <button onClick={() => setRailOpen(true)} data-tip="展开菜单" data-tip-pos="bottom-left" aria-label="展开菜单" style={railIconBtn} {...railHoverFx}>
              <Icon name="panelLeftOpen" size={17} />
            </button>
            <button onClick={newChat} data-tip="新对话" aria-label="新对话" style={railIconBtn} {...railHoverFx}>
              <Icon name="plus" size={17} />
            </button>
          </div>
        )}
        {mobile && (
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--surface)", borderBottom: "1px solid var(--line)", zIndex: 5 }}>
            <button onClick={() => setNavOpen(true)} aria-label="打开菜单" style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 11, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer" }}>
              <Icon name="menu" size={20} />
            </button>
            <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 9 }}>
              <BotAvatar size={32} glow />
              <div style={{ minWidth: 0, lineHeight: 1.2 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "var(--ink)" }}>AI 小博士</div>
                <div style={{ fontSize: 10.5, color: "var(--ink-3)", fontWeight: 600 }}>你的备课教学助手</div>
              </div>
            </div>
            <button onClick={newChat} aria-label="新对话" style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 11, border: "none", background: "var(--brand-grad)", backgroundColor: "var(--brand)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer", boxShadow: "0 4px 14px -6px var(--brand-glow)" }}>
              <Icon name="plus" size={20} sw={2.4} />
            </button>
          </div>
        )}
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflowY: "auto" }}>
          {loggedIn && page === "works" ? (
            <WorksPage onResume={onResume} onNewChat={onNewChat} />
          ) : loggedIn && page === "history" ? (
            <HistoryPage onResume={onResume} onNewChat={onNewChat} conversations={conversations} />
          ) : loggedIn && page === "basket" ? (
            <BasketPage items={basketItems || []} onRemove={onRemoveBasket} onClear={onClearBasket} onOpenContent={() => onNavigate("works")} onNewChat={onNewChat} onGoFind={() => onPick && onPick("find")} />
          ) : page === "feedback" ? (
            <FeedbackPage loggedIn={loggedIn} onRequireLogin={onRequireLogin} />
          ) : page === "help" ? (
            <HelpPage onNavigate={onNavigate} />
          ) : page === "changelog" ? (
            <ChangelogPage />
          ) : page && page.startsWith("legacy:") ? (
            <LegacyPlaceholder page={page} />
          ) : (
            <React.Fragment>
              <div style={{ margin: "auto 0", width: "100%", display: "flex", flexDirection: "column", flex: 1 }}>
                <Comp value={value} setValue={setValue} onSubmit={onSubmit} onPick={onPick} {...memProps} />
                <div style={{ marginTop: "auto", padding: "28px 16px 16px" }}>
                  <AuthorityStrip />
                </div>
              </div>
            </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Left navigation rail (always visible) ----------
function LeftRail({ page, loggedIn, onNavigate, onPick, onNewChat, onResume, onLogout, onRequireLogin, mobile, mobileOpen, onCloseMobile, onOpenBasket, basketCount = 0, forceOpen, onCollapse, conversations }) {
  const M = window.AIDATA.USER_MEMORY;
  const convs = conversations || M.conversations;
  const [openState, setOpen] = useState(() => localStorage.getItem("aida_rail_open") !== "0");
  const open = mobile ? true : forceOpen ? true : openState; // on mobile the drawer always shows full content
  const [acctMenu, setAcctMenu] = useState(false);
  useEffect(() => { try { localStorage.setItem("aida_rail_open", openState ? "1" : "0"); } catch (e) {} }, [openState]);
  const collapse = () => (mobile ? onCloseMobile() : onCollapse ? onCollapse() : setOpen(false));

  const go = (p) => (loggedIn ? onNavigate(p) : onRequireLogin());

  const NavItem = ({ icon, label, active, onClick, accent }) => (
    <button
      data-nav-item
      onClick={onClick}
      title={label}
      style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: open ? "10px 12px" : "10px 0", justifyContent: open ? "flex-start" : "center", borderRadius: 11, border: "none", cursor: "pointer", fontFamily: "var(--font-zh)", fontSize: 14, fontWeight: 600, background: active ? "var(--brand-soft)" : "transparent", color: active ? "var(--brand-deep)" : "var(--ink-2)", transition: "background .15s" }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--surface)"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ flexShrink: 0, width: 20, height: 20, display: "grid", placeItems: "center" }}><CIcon name={icon} size={18} active={active} /></span>
      {open && <span style={{ whiteSpace: "nowrap", lineHeight: 1 }}>{label}</span>}
    </button>
  );

  const asideStyle = mobile
    ? { position: "fixed", top: 0, left: 0, bottom: 0, width: "min(300px, 84vw)", zIndex: 81, background: "var(--surface-2)", display: "flex", flexDirection: "column", transform: mobileOpen ? "translateX(0)" : "translateX(-102%)", transition: "transform .3s cubic-bezier(.32,.72,0,1)", boxShadow: mobileOpen ? "0 20px 60px -20px rgba(0,0,0,.5)" : "none" }
    : { width: open ? 252 : 72, flexShrink: 0, background: "var(--surface-2)", display: "flex", flexDirection: "column", transition: "width .2s" };

  return (
    <React.Fragment>
    {mobile && (
      <div onClick={onCloseMobile} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(20,16,10,.42)", backdropFilter: "blur(2px)", opacity: mobileOpen ? 1 : 0, pointerEvents: mobileOpen ? "auto" : "none", transition: "opacity .26s ease" }} />
    )}
    <aside style={asideStyle}>
      {/* brand + collapse */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: open ? "15px 6px 12px 14px" : "15px 0 12px", justifyContent: "center" }}>
        {open ? (
          <React.Fragment>
            <BotAvatar size={40} glow />
            <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
              <div style={{ fontWeight: 800, fontSize: 15.5, color: "var(--ink)" }}>AI 小博士</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, marginTop: 1 }}>你的备课教学助手</div>
            </div>
            <button data-home-nav onClick={collapse} data-tip={mobile ? "关闭菜单" : "收起菜单"} aria-label={mobile ? "关闭菜单" : "收起菜单"} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent", color: "var(--ink-3)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0, transition: "background .15s, color .15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.color = "var(--ink-2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--ink-3)"; }}>
              <Icon name={mobile ? "close" : "panelLeftClose"} size={17} sw={mobile ? 2.4 : 1.8} />
            </button>
          </React.Fragment>
        ) : (
          <button
            onClick={() => setOpen(true)}
            data-tip="展开菜单"
            data-tip-pos="right"
            aria-label="展开菜单"
            className="rail-brand-toggle"
            style={{ position: "relative", width: 44, height: 44, borderRadius: 12, border: "none", background: "transparent", padding: 0, cursor: "pointer", display: "grid", placeItems: "center" }}
          >
            <span className="rbt-avatar"><BotAvatar size={40} glow /></span>
            <span className="rbt-icon" style={{ position: "absolute", inset: 0, borderRadius: 12, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", color: "var(--brand-deep)", display: "grid", placeItems: "center" }}>
              <Icon name="panelLeftOpen" size={19} />
            </span>
          </button>
        )}
      </div>

      {/* new chat */}
      <div style={{ padding: open ? "0 12px 8px" : "0 12px 8px" }}>
        <button
          data-home-nav
          onClick={onNewChat}
          title="新对话"
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: open ? "11px 14px" : "11px 0", borderRadius: 999, border: "none", background: "var(--surface)", color: "var(--ink)", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", boxShadow: "0 1px 4px oklch(0.3 0.02 260 / .14)" }}
        >
          <Icon name="plus" size={17} sw={2.4} /> {open && "新对话"}
        </button>
      </div>

      {/* nav */}
      <div style={{ padding: open ? "8px 12px" : "8px 12px", display: "flex", flexDirection: "column", gap: 3 }}>
        <NavItem icon="file" label="智能组卷" active={page === "legacy:paper"} onClick={() => go("legacy:paper")} />
        <NavItem icon="interactive" label="互动课件" active={page === "legacy:interactive"} onClick={() => go("legacy:interactive")} />
        <NavItem icon="book" label="教材百科" active={page === "legacy:textbook"} onClick={() => go("legacy:textbook")} />
        <NavItem icon="grade" label="作文批改" active={page === "legacy:grade"} onClick={() => go("legacy:grade")} />
        <NavItem icon="image" label="AI 生图" active={page === "legacy:image"} onClick={() => go("legacy:image")} />
        <NavItem icon="megaphone" label="AI 讲卷" active={page === "legacy:explain"} onClick={() => go("legacy:explain")} />
        <NavItem icon="spark" label="智能体" active={page === "legacy:agent"} onClick={() => go("legacy:agent")} />
        <NavItem icon="grid" label="我的内容" active={page === "works"} onClick={() => go("works")} />
        {!open && (
          <NavItem icon="chat" label="历史对话" active={page === "history"} onClick={() => (loggedIn ? onNavigate("history") : onRequireLogin())} />
        )}
      </div>

      {/* conversation history (expanded only) */}
      {open && (
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", paddingTop: 6 }}>
          <div style={{ padding: "4px 8px 8px 18px", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-3)" }}>历史对话</span>
            <div style={{ flex: 1 }} />
            {loggedIn && (
              <button
                onClick={() => onNavigate("history")}
                data-tip="全部历史对话"
                aria-label="全部历史对话"
                style={{ border: "none", background: "transparent", color: "var(--ink-3)", cursor: "pointer", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7, transition: "background .15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <CIcon name="history" size={16} />
              </button>
            )}
          </div>
          {loggedIn ? (
            <div style={{ flex: 1, overflowY: "auto", padding: "0 10px 10px", display: "flex", flexDirection: "column", gap: 1 }}>
              {convs.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onResume && onResume({ ...c, isConversation: true })}
                  title={c.title}
                  style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 10, border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-zh)", textAlign: "left", transition: "background .15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ flexShrink: 0, display: "grid", placeItems: "center", width: 18 }}><CIcon name={c.icon} size={15} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ flex: 1 }}>
              <button onClick={onRequireLogin} style={{ margin: "4px 12px", padding: "16px 14px", width: "calc(100% - 24px)", borderRadius: 12, border: "1px dashed var(--line)", background: "var(--surface)", cursor: "pointer", fontFamily: "var(--font-zh)", textAlign: "center" }}>
                <div style={{ fontSize: 12.5, color: "var(--ink-2)", fontWeight: 600, lineHeight: 1.6 }}>登录后查看历史对话<br /><span style={{ color: "var(--ink-3)", fontWeight: 500 }}>你的每一次创作都会自动保存</span></div>
              </button>
            </div>
          )}
        </div>
      )}
      {!open && <div style={{ flex: 1 }} />}

      {/* account (bottom) */}
      <div style={{ padding: open ? "8px 12px 12px" : "8px 8px 12px", position: "relative" }}>
        {loggedIn ? (
          <React.Fragment>
            <button
              onClick={() => setAcctMenu((m) => !m)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: open ? "8px 10px" : "7px 0", justifyContent: open ? "flex-start" : "center", borderRadius: 12, border: "none", background: "transparent", boxShadow: "none", cursor: "pointer", fontFamily: "var(--font-zh)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "oklch(0.94 0.01 260)")}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", fontWeight: 700, fontSize: 13.5, flexShrink: 0 }}>李</span>
              {open && (
                <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>李老师</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>初中数学</div>
                </div>
              )}
              {open && <Icon name="filter" size={14} />}
            </button>
            {acctMenu && (
              <React.Fragment>
                <div onClick={() => setAcctMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 30 }} />
                <div className="enter-pop" style={{ position: "absolute", left: open ? 12 : 8, right: open ? 12 : "auto", bottom: "calc(100% - 2px)", minWidth: 180, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 13, boxShadow: "0 18px 44px -22px rgba(0,0,0,.4)", padding: 7, zIndex: 31 }}>
                  <MenuRow icon="feedback" label="反馈" onClick={() => { setAcctMenu(false); onNavigate("feedback"); }} />
                  <MenuRow icon="help" label="帮助" onClick={() => { setAcctMenu(false); onNavigate("help"); }} />
                  <MenuRow icon="megaphone" label="产品更新动态" onClick={() => { setAcctMenu(false); onNavigate("changelog"); }} />
                  
                  <div style={{ height: 1, background: "var(--line)", margin: "5px 4px" }} />
                  <MenuRow icon="back" label="退出登录" onClick={() => { setAcctMenu(false); onLogout && onLogout(); }} />
                </div>
              </React.Fragment>
            )}
          </React.Fragment>
        ) : (
          <button
            onClick={onRequireLogin}
            title="登录 / 注册"
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: open ? "10px 14px" : "10px 0", borderRadius: 11, border: "1px solid var(--brand)", background: "var(--brand-soft)", color: "var(--brand-deep)", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", whiteSpace: "nowrap" }}
          >
            <Icon name="login" size={17} /> {open && "登录 / 注册"}
          </button>
        )}
      </div>
    </aside>
    </React.Fragment>
  );
}

Object.assign(window, { Homepage, LeftRail });

// ---------- 记忆管理 (memory management page) ----------
function MemSwitch({ on, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ width: 38, height: 22, borderRadius: 999, border: "none", cursor: "pointer", padding: 2, background: on ? "var(--brand)" : "var(--line)", transition: "background .2s", flexShrink: 0, display: "flex", justifyContent: on ? "flex-end" : "flex-start" }}
    >
      <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.3)", transition: "all .2s" }} />
    </button>
  );
}

function MemoryPage({ onResume }) {
  const M = window.AIDATA.USER_MEMORY;
  const mobile = useIsMobile();
  const [tags, setTags] = useState(M.tags);
  const [entries, setEntries] = useState(M.entries.map((e) => ({ ...e })));
  const [cleared, setCleared] = useState(false);

  const removeTag = (i) => setTags((t) => t.filter((_, j) => j !== i));
  const toggleEntry = (id) => setEntries((es) => es.map((e) => (e.id === id ? { ...e, on: !e.on } : e)));
  const removeEntry = (id) => setEntries((es) => es.filter((e) => e.id !== id));
  const clearAll = () => { setTags([]); setEntries([]); setCleared(true); };

  const activeCount = entries.filter((e) => e.on).length;

  const Section = ({ icon, title, hint, action, children }) => (
    <div style={{ marginBottom: 26 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
        <span style={{ color: "var(--ink-3)" }}><Icon name={icon} size={16} /></span>
        <span style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>{title}</span>
        {hint && <span style={{ fontSize: 12, color: "var(--ink-3)", marginLeft: 4, whiteSpace: "nowrap" }}>{hint}</span>}
        <div style={{ flex: 1 }} />
        {action}
      </div>
      {children}
    </div>
  );

  return (
    <div className="home-fade" style={{ flex: 1, overflowY: "auto", padding: mobile ? "8px 16px 48px" : "10px 24px 60px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* page heading */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 0 22px" }}>
          <span style={{ width: 46, height: 46, borderRadius: 14, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}>
            <Icon name="spark" size={22} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 23, fontWeight: 800, color: "var(--ink)", margin: 0 }}>我的记忆</h1>
            <div style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 600, marginTop: 2 }}>小博士从你的使用中学到的内容 · 你可以随时编辑或删除</div>
          </div>
          {!cleared && (
            <button onClick={clearAll} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 10, border: "1px solid oklch(0.85 0.07 25)", background: "oklch(0.97 0.02 25)", color: "oklch(0.5 0.16 25)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", flexShrink: 0 }}>
              清空全部
            </button>
          )}
        </div>

        {cleared ? (
          <div style={{ textAlign: "center", padding: "70px 20px", color: "var(--ink-3)" }}>
            <div style={{ display: "inline-flex", marginBottom: 12, color: "var(--line)" }}><Icon name="spark" size={48} sw={1.3} /></div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-2)", marginBottom: 6 }}>记忆已清空</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>小博士会在你继续使用的过程中，重新学习你的偏好。</div>
          </div>
        ) : (
          <React.Fragment>
            <Section icon="quote" title="小博士眼中的你">
              <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: "16px 18px" }}>
                <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.8, color: "var(--ink-2)" }}>{M.summary}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 13, paddingTop: 12, borderTop: "1px dashed var(--line)" }}>
                  <span style={{ fontSize: 12, color: "var(--ink-3)", whiteSpace: "nowrap" }}>记忆更新于 {M.updated}</span>
                </div>
              </div>
            </Section>

            <Section icon="filter" title="教学画像" hint="自动推断 · 点 × 移除">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {tags.length === 0 && <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>暂无画像标签</span>}
                {tags.map((t, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 10px 7px 12px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--line)", fontSize: 13 }}>
                    <span style={{ color: "var(--ink-3)", fontSize: 11.5 }}>{t.k}</span>
                    <span style={{ color: "var(--brand-deep)", fontWeight: 700 }}>{t.v}</span>
                    <span onClick={() => removeTag(i)} style={{ display: "inline-flex", cursor: "pointer", color: "var(--ink-3)", marginLeft: 1 }}><Icon name="close" size={13} sw={2.6} /></span>
                  </span>
                ))}
              </div>
            </Section>

            <Section icon="layers" title="记忆条目" hint={`${activeCount} 条生效 / 共 ${entries.length} 条`}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {entries.length === 0 && <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>暂无记忆条目</span>}
                {entries.map((e) => (
                  <div key={e.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: "14px 16px", opacity: e.on ? 1 : 0.55, transition: "opacity .2s" }}>
                    <span style={{ width: 32, height: 32, borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--line)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0, marginTop: 1 }}>
                      <Icon name={e.icon} size={16} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)" }}>{e.text}</div>
                      <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 3, lineHeight: 1.5, display: "flex", alignItems: "center", gap: 5 }}>
                        <Icon name="spark" size={12} /> {e.basis}
                      </div>
                    </div>
                    <MemSwitch on={e.on} onClick={() => toggleEntry(e.id)} />
                    <button onClick={() => removeEntry(e.id)} title="删除这条记忆" style={{ width: 30, height: 30, borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface-2)", color: "var(--ink-3)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}>
                      <Icon name="close" size={14} sw={2.4} />
                    </button>
                  </div>
                ))}
              </div>
            </Section>

            <Section icon="history" title="记忆来源" hint="基于你的真实使用">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 20, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: "16px 18px" }}>
                {M.stats.map((s, i) => (
                  <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                    <span style={{ color: "var(--ink-3)" }}><CIcon name={s.icon} size={16} /></span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", fontFamily: "var(--font-num)" }}>{s.n}</span>
                    <span style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 600 }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </Section>

            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ink-3)", lineHeight: 1.5, padding: "4px 2px" }}>
              <Icon name="shield" size={14} /> 记忆仅用于改善你的创作体验，可随时关闭或清空。
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

// ---------- 我的作品 (finished deliverables library) ----------
// ---------- 我的内容 (all content: generated, downloaded, 备课 products…) ----------
function WorksPage({ onResume, onNewChat }) {
  const M = window.AIDATA.USER_MEMORY;
  const mobile = useIsMobile();
  const SOURCES = ["全部", "AI 生成", "找资源下载"];
  const [filter, setFilter] = useState("全部");
  // list is the default view; teachers scan their library faster as a dense list,
  // and switch to cards when they want the visual previews. choice persists.
  const [view, setViewState] = useState(() => localStorage.getItem("aida_works_view") || "list");
  const setView = (v) => { setViewState(v); try { localStorage.setItem("aida_works_view", v); } catch (e) {} };
  const items = M.works.filter((w) => filter === "全部" || w.source === filter);
  const srcStyle = (src) => {
    if (src === "AI 生成") return { c: "var(--brand-deep)", bg: "var(--brand-soft)", bd: "var(--brand-soft-border)", icon: "spark" };
    return { c: "var(--auth-ink)", bg: "var(--auth-bg)", bd: "var(--auth-border)", icon: "download" };
  };
  const ViewToggle = () => (
    <div style={{ display: "inline-flex", padding: 3, gap: 2, borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", flexShrink: 0 }}>
      {[{ k: "list", ic: "list", t: "列表" }, { k: "card", ic: "grid", t: "卡片" }].map((o) => (
        <button key={o.k} onClick={() => setView(o.k)} data-tip={o.t} aria-label={o.t}
          style={{ width: 32, height: 28, borderRadius: 7, border: "none", cursor: "pointer", display: "grid", placeItems: "center", background: view === o.k ? "var(--brand-soft)" : "transparent", color: view === o.k ? "var(--brand-deep)" : "var(--ink-3)", transition: "background .15s, color .15s" }}>
          <Icon name={o.ic} size={16} />
        </button>
      ))}
    </div>
  );

  return (
    <div className="home-fade" style={{ flex: 1, overflowY: "auto", padding: mobile ? "8px 16px 48px" : "10px 24px 60px" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        {/* heading */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 0 16px" }}>
          <span style={{ width: 46, height: 46, borderRadius: 14, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}>
            <Icon name="grid" size={21} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 23, fontWeight: 800, color: "var(--ink)", margin: 0 }}>我的内容</h1>
            <div style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 600, marginTop: 2 }}>你的全部教学资料 · AI 生成与找资源下载，共 {M.works.length} 份</div>
          </div>
        </div>

        {/* filter by source + view toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
          {SOURCES.map((k) => (
            <button key={k} onClick={() => setFilter(k)} style={{ padding: "7px 15px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", border: filter === k ? "1px solid var(--brand)" : "1px solid var(--line)", background: filter === k ? "var(--brand-soft)" : "var(--surface)", color: filter === k ? "var(--brand-deep)" : "var(--ink-2)", transition: "all .15s" }}>{k}</button>
          ))}
          <div style={{ flex: 1 }} />
          <ViewToggle />
        </div>

        {/* list view (default) */}
        {view === "list" ? (
          <div style={{ border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", background: "var(--surface)" }}>
            {items.map((w, i) => {
              const ss = srcStyle(w.source);
              return (
                <div key={w.id} className="works-row" style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", borderTop: i === 0 ? "none" : "1px solid var(--line)", transition: "background .14s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <ScenarioGlyph icon={w.icon} hue={w.hue} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{w.title}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: `oklch(0.42 0.13 ${w.hue})`, background: `oklch(0.95 0.04 ${w.hue})`, border: `1px solid oklch(0.86 0.06 ${w.hue})`, padding: "1px 7px", borderRadius: 999, whiteSpace: "nowrap", flexShrink: 0 }}>{w.kind}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.meta}</div>
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10.5, fontWeight: 700, color: ss.c, background: ss.bg, border: `1px solid ${ss.bd}`, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap", flexShrink: 0 }}><Icon name={ss.icon} size={11} /> {w.source}</span>
                  <span style={{ fontSize: 11.5, color: "var(--ink-3)", flexShrink: 0, width: 84, textAlign: "right" }}>{w.status === "draft" ? "草稿 · " : ""}{w.when}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
                    <button title="预览" style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer" }}><Icon name="eye" size={15} /></button>
                    <button title="下载" style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer" }}><Icon name="download" size={15} /></button>
                    <button onClick={() => onResume && onResume(w)} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 9, border: "none", background: "var(--brand-soft)", color: "var(--brand-deep)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>{w.source === "AI 生成" ? "继续" : "打开"} <Icon name="arrow" size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
        /* card view */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {items.map((w) => {
            const ss = srcStyle(w.source);
            return (
            <div key={w.id} className="work-card" style={{ display: "flex", flexDirection: "column", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden", transition: "transform .18s, box-shadow .25s, border-color .2s" }}>
              {/* preview strip */}
              <div className="ph-stripe" style={{ height: 116, position: "relative", display: "grid", placeItems: "center" }}>
                <ScenarioGlyph icon={w.icon} hue={w.hue} size={46} active />
                <span style={{ position: "absolute", top: 10, left: 10, fontSize: 10.5, fontWeight: 700, color: `oklch(0.42 0.13 ${w.hue})`, background: `oklch(0.95 0.04 ${w.hue})`, border: `1px solid oklch(0.86 0.06 ${w.hue})`, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>{w.kind}</span>
                <span style={{ position: "absolute", top: 10, right: 10, display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, color: ss.c, background: ss.bg, border: `1px solid ${ss.bd}`, padding: "2px 7px", borderRadius: 999, whiteSpace: "nowrap" }}><Icon name={ss.icon} size={10} /> {w.source}</span>
              </div>
              {/* body */}
              <div style={{ padding: "13px 15px", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)", lineHeight: 1.4 }}>{w.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 4, lineHeight: 1.5 }}>{w.meta}</div>
                <div style={{ flex: 1 }} />
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 13 }}>
                  <span style={{ fontSize: 11, color: "var(--ink-3)", flex: 1 }}>{w.status === "draft" ? "草稿 · " : ""}{w.when}</span>
                  <button title="预览" style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer" }}><Icon name="eye" size={15} /></button>
                  <button title="下载" style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer" }}><Icon name="download" size={15} /></button>
                  <button onClick={() => onResume && onResume(w)} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 9, border: "none", background: "var(--brand-soft)", color: "var(--brand-deep)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>{w.source === "AI 生成" ? "继续" : "打开"} <Icon name="arrow" size={14} /></button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}

// ---------- 历史对话 (all chat sessions) — vertical timeline ----------
function HistoryPage({ onResume, onNewChat, conversations }) {
  const M = window.AIDATA.USER_MEMORY;
  const mobile = useIsMobile();
  const convs = conversations || M.conversations;
  // group conversations into timeline milestones by their time bucket, preserving
  // the newest-first order the list already carries.
  const groups = [];
  const seen = {};
  convs.forEach((c) => {
    const k = c.when || "更早";
    if (!seen[k]) { seen[k] = { when: k, items: [] }; groups.push(seen[k]); }
    seen[k].items.push(c);
  });
  const SPINE = 9; // x-center of the vertical rail

  return (
    <div className="home-fade" style={{ flex: 1, overflowY: "auto", padding: mobile ? "8px 16px 48px" : "10px 24px 60px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 0 18px" }}>
          <span style={{ width: 46, height: 46, borderRadius: 14, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}>
            <Icon name="chat" size={21} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 23, fontWeight: 800, color: "var(--ink)", margin: 0 }}>历史对话</h1>
            <div style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 600, marginTop: 2 }}>你与小博士的每一次对话都已保存 · 共 {convs.length} 段，点击任意一条继续</div>
          </div>
        </div>

        {/* timeline */}
        <div style={{ position: "relative", paddingLeft: 30 }}>
          {/* the spine */}
          <div style={{ position: "absolute", left: SPINE - 1, top: 12, bottom: 14, width: 2, background: "var(--line)" }} />
          {groups.map((g, gi) => (
            <div key={gi} style={{ position: "relative" }}>
              {/* milestone label */}
              <div style={{ position: "relative", display: "flex", alignItems: "center", padding: gi === 0 ? "2px 0 10px" : "20px 0 10px" }}>
                <span style={{ position: "absolute", left: SPINE - 30 - 5, top: "50%", marginTop: -5, width: 10, height: 10, borderRadius: 999, background: "var(--brand)", boxShadow: "0 0 0 4px var(--canvas)" }} />
                <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--ink-2)", letterSpacing: ".02em" }}>{g.when}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", marginLeft: 8, fontFamily: "var(--font-num)" }}>{g.items.length}</span>
              </div>
              {/* entries */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 4 }}>
                {g.items.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onResume && onResume({ ...c, isConversation: true })}
                    style={{ position: "relative", width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 13, border: "1px solid var(--line)", background: "var(--surface)", cursor: "pointer", fontFamily: "var(--font-zh)", textAlign: "left", transition: "transform .15s, border-color .2s, box-shadow .2s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateX(2px)"; e.currentTarget.style.borderColor = "var(--brand-soft-border)"; e.currentTarget.style.boxShadow = "0 8px 20px -16px rgba(0,0,0,.45)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    {/* node on the spine */}
                    <span style={{ position: "absolute", left: SPINE - 30 - 4, top: "50%", marginTop: -4, width: 9, height: 9, borderRadius: 999, background: "var(--canvas)", border: "2px solid var(--ink-4, var(--line))", boxShadow: "0 0 0 3px var(--canvas)" }} />
                    <span style={{ width: 28, height: 28, display: "grid", placeItems: "center", flexShrink: 0 }}><CIcon name={c.icon} size={18} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>最近：{c.last}</div>
                    </div>
                    <span style={{ color: "var(--ink-3)", flexShrink: 0, opacity: .55 }}><Icon name="chevronRight" size={16} /></span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- 反馈 ----------
function FeedbackPage({ loggedIn, onRequireLogin }) {
  const mobile = useIsMobile();
  const CATS = [
    { k: "bug", label: "问题反馈" },
    { k: "idea", label: "功能建议" },
    { k: "other", label: "其他" },
  ];
  const catLabel = (k) => (CATS.find((c) => c.k === k) || {}).label || k;
  const [cat, setCat] = useState("bug");
  const [text, setText] = useState("");
  const [images, setImages] = useState([]); // { id, url, name }
  const [sent, setSent] = useState(false);
  const fileRef = useRef(null);
  // local record of past submissions — there's no backend, so this lives in
  // localStorage on this device; good enough for "did I already report this".
  const [log, setLog] = useState(() => {
    try { return JSON.parse(localStorage.getItem("aida_feedback_log") || "[]"); } catch (e) { return []; }
  });

  const addImages = (files) => {
    const room = Math.max(0, 4 - images.length);
    const next = Array.from(files || []).slice(0, room).map((f) => ({ id: Math.random().toString(36).slice(2), url: URL.createObjectURL(f), name: f.name }));
    if (next.length) setImages((im) => [...im, ...next]);
  };
  const removeImage = (id) => setImages((im) => im.filter((i) => i.id !== id));

  const submit = () => {
    if (!loggedIn) { onRequireLogin && onRequireLogin(); return; }
    if (!text.trim()) return;
    const entry = {
      id: Math.random().toString(36).slice(2),
      cat,
      text: text.trim(),
      imageCount: images.length,
      when: new Date().toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
    };
    const nextLog = [entry, ...log].slice(0, 20);
    setLog(nextLog);
    try { localStorage.setItem("aida_feedback_log", JSON.stringify(nextLog)); } catch (e) {}
    setSent(true);
  };

  const reset = () => { setSent(false); setText(""); setImages([]); };
  const canSubmit = !loggedIn || !!text.trim();

  return (
    <div className="home-fade" style={{ flex: 1, overflowY: "auto", padding: mobile ? "8px 16px 48px" : "10px 24px 60px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 0 22px" }}>
          <span style={{ width: 46, height: 46, borderRadius: 14, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}>
            <Icon name="feedback" size={21} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 23, fontWeight: 800, color: "var(--ink)", margin: 0 }}>反馈</h1>
            <div style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 600, marginTop: 2 }}>遇到问题，或者有功能建议？告诉小博士。</div>
          </div>
        </div>

        {sent ? (
          <div style={{ textAlign: "center", padding: "70px 20px", color: "var(--ink-3)" }}>
            <div style={{ display: "inline-flex", marginBottom: 12, color: "var(--brand-deep)" }}><Icon name="check" size={44} sw={1.6} /></div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-2)", marginBottom: 6 }}>已收到你的反馈，谢谢！</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.6, marginBottom: 20 }}>我们会尽快查看这条反馈，感谢你帮小博士变得更好用。</div>
            <button onClick={reset} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 16px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>
              再提一条
            </button>
          </div>
        ) : (
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-2)", marginBottom: 9 }}>类型</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {CATS.map((c) => (
                <button key={c.k} onClick={() => setCat(c.k)} style={{ padding: "7px 15px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", border: cat === c.k ? "1px solid var(--brand)" : "1px solid var(--line)", background: cat === c.k ? "var(--brand-soft)" : "var(--surface)", color: cat === c.k ? "var(--brand-deep)" : "var(--ink-2)" }}>{c.label}</button>
              ))}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-2)", marginBottom: 9 }}>详细描述</div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="请描述你遇到的问题，或希望小博士支持的功能…"
              rows={6}
              style={{ width: "100%", boxSizing: "border-box", resize: "vertical", padding: "12px 14px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface-2)", color: "var(--ink)", fontSize: 14, lineHeight: 1.6, fontFamily: "var(--font-zh)", outline: "none" }}
            />
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-2)", margin: "16px 0 9px" }}>图片（选填，最多 4 张）</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {images.map((img) => (
                <div key={img.id} style={{ position: "relative", width: 76, height: 76, borderRadius: 10, overflow: "hidden", border: "1px solid var(--line)", flexShrink: 0 }}>
                  <img src={img.url} alt={img.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <button onClick={() => removeImage(img.id)} aria-label="删除图片" style={{ position: "absolute", top: 3, right: 3, width: 18, height: 18, borderRadius: "50%", border: "none", background: "rgba(0,0,0,.55)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}>
                    <Icon name="close" size={10} sw={3} />
                  </button>
                </div>
              ))}
              {images.length < 4 && (
                <button onClick={() => fileRef.current && fileRef.current.click()} style={{ width: 76, height: 76, borderRadius: 10, border: "1px dashed var(--line)", background: "var(--surface-2)", color: "var(--ink-3)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer", fontFamily: "var(--font-zh)", flexShrink: 0 }}>
                  <Icon name="image" size={18} />
                  <span style={{ fontSize: 10.5 }}>上传图片</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => { addImages(e.target.files); e.target.value = ""; }} />
            </div>
            <button
              onClick={submit}
              disabled={!canSubmit}
              style={{ marginTop: 18, display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 22px", borderRadius: 11, border: "none", background: canSubmit ? "var(--brand-grad)" : "var(--line)", backgroundColor: "var(--brand)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: canSubmit ? "pointer" : "default", fontFamily: "var(--font-zh)", opacity: canSubmit ? 1 : 0.6 }}
            >
              <Icon name="send" size={16} /> 提交反馈
            </button>
            {!loggedIn && (
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 9 }}>登录后才能提交反馈，点击上方按钮会先引导你登录。</div>
            )}
          </div>
        )}

        {log.length > 0 && (
          <div style={{ marginTop: 26 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-3)", marginBottom: 10 }}>我的反馈记录</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {log.map((e) => (
                <div key={e.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: "11px 13px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--brand-deep)", background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", padding: "2px 8px", borderRadius: 999, flexShrink: 0, marginTop: 1, whiteSpace: "nowrap" }}>{catLabel(e.cat)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{e.text}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                      {e.imageCount > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Icon name="image" size={11} /> {e.imageCount}</span>}
                      <span>{e.when}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- 帮助 ----------
function HelpPage({ onNavigate }) {
  const mobile = useIsMobile();
  const FAQS = [
    { q: "小博士能帮我做什么？", a: "找资源、问教材、写教案、做课件、出卷子、做思维导图、批改作业——七大教学场景，直接在输入框描述需求，AI 会自动判断该进入哪个场景。" },
    { q: "找到的资源可靠吗？", a: "小博士的资源库来自学科网，找资源时会优先展示你自己的内容与已收藏资源，其余来自学科网公共库，均经过三审三校。" },
    { q: "登录后有什么不同？", a: "登录后可以查看历史对话、我的内容，创作时自动预填常用配置与我的记忆，随时续作。" },
    { q: "生成的内容存在哪里？", a: "AI 生成的课件、教案、试卷、思维导图会自动存入「我的内容」；从找资源下载的资料也会归档在这里，可随时续作或重新下载。" },
      ];
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <div className="home-fade" style={{ flex: 1, overflowY: "auto", padding: mobile ? "8px 16px 48px" : "10px 24px 60px" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 0 22px" }}>
          <span style={{ width: 46, height: 46, borderRadius: 14, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}>
            <Icon name="help" size={22} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 23, fontWeight: 800, color: "var(--ink)", margin: 0 }}>帮助</h1>
            <div style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 600, marginTop: 2 }}>常见问题与使用说明</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {FAQS.map((f, i) => {
            const isOpen = openIdx === i;
            return (
              <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden" }}>
                <button onClick={() => setOpenIdx(isOpen ? -1 : i)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-zh)" }}>
                  <span style={{ flex: 1, fontSize: 14.5, fontWeight: 700, color: "var(--ink)" }}>{f.q}</span>
                  <span style={{ color: "var(--ink-3)", flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}><Icon name="chevronDown" size={16} /></span>
                </button>
                {isOpen && (
                  <div style={{ padding: "0 16px 16px", fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.7 }}>{f.a}</div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 11, padding: "14px 16px", borderRadius: 14, border: "1px dashed var(--brand-soft-border)", background: "var(--brand-soft)" }}>
          <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--surface)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}>
            <Icon name="feedback" size={16} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>没找到答案？</div>
            <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 1 }}>去反馈页告诉我们，我们会尽快跟进。</div>
          </div>
          <button onClick={() => onNavigate && onNavigate("feedback")} style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 10, border: "1px solid var(--brand-soft-border)", background: "var(--surface)", color: "var(--brand-deep)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>
            去反馈 <Icon name="arrow" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- 产品更新动态 ----------
function ChangelogPage() {
  const mobile = useIsMobile();
  const UPDATES = [
        { date: "2026-06-10", title: "互动课件新增课堂活动", points: ["课件中可直接插入抢答、随堂练习等互动组件", "支持「传统 PPT」与「互动课件」两种形态自由切换"] },
    { date: "2026-05-22", title: "找资源支持专辑与视频章节锚点", points: ["结果按全部 / 文档 / 视频 / 专辑分轨呈现", "视频支持章节锚点跳转，资源可一键收藏进资源篮"] },
    { date: "2026-05-02", title: "上线批改场景", points: ["支持整班作业批改，自动生成错题本与评语", "可导出班级质量分析，含逐题正确率与共性错误"] },
  ];
  const SPINE = 9;

  return (
    <div className="home-fade" style={{ flex: 1, overflowY: "auto", padding: mobile ? "8px 16px 48px" : "10px 24px 60px" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 0 22px" }}>
          <span style={{ width: 46, height: 46, borderRadius: 14, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}>
            <Icon name="megaphone" size={21} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 23, fontWeight: 800, color: "var(--ink)", margin: 0 }}>产品更新动态</h1>
            <div style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 600, marginTop: 2 }}>我们如何让小博士越来越好用</div>
          </div>
        </div>

        <div style={{ position: "relative", paddingLeft: 30 }}>
          <div style={{ position: "absolute", left: SPINE - 1, top: 6, bottom: 6, width: 2, background: "var(--line)" }} />
          {UPDATES.map((u, i) => (
            <div key={i} style={{ position: "relative", paddingBottom: i < UPDATES.length - 1 ? 22 : 0 }}>
              <span style={{ position: "absolute", left: SPINE - 5 - 30, top: 3, width: 10, height: 10, borderRadius: "50%", background: "var(--brand)", border: "3px solid var(--brand-soft)" }} />
              <div style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 700, marginBottom: 6, fontFamily: "var(--font-num)" }}>{u.date}</div>
              <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>{u.title}</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.8 }}>
                  {u.points.map((p, j) => <li key={j}>{p}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MemoryPage, WorksPage, HistoryPage, FeedbackPage, HelpPage, ChangelogPage });

// ---------- 资源篮 (resource basket) — full PAGE when opened from the menu ----------
// (the right-side drawer form, BasketPanel, is kept for in-scenario quick access)
function BasketPage({ items = [], onRemove, onClear, onOpenContent, onNewChat, onGoFind }) {
  const mobile = useIsMobile();
  return (
    <div className="home-fade" style={{ flex: 1, overflowY: "auto", padding: mobile ? "8px 16px 48px" : "10px 24px 60px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* heading */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 0 18px" }}>
          <span style={{ width: 46, height: 46, borderRadius: 14, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}>
            <Icon name="basket" size={21} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 23, fontWeight: 800, color: "var(--ink)", margin: 0 }}>资源篮</h1>
            <div style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 600, marginTop: 2 }}>{items.length > 0 ? `已收集 ${items.length} 份资源 · 可一并下载，或送去出卷 / 备课` : "你跨场景收集的资源都会汇总到这里"}</div>
          </div>
          {items.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
              <button onClick={onClear} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 14px", borderRadius: 11, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-3)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>
                <Icon name="trash" size={15} /> 清空
              </button>
              <button style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 11, border: "none", background: "var(--brand-grad)", backgroundColor: "var(--brand)", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", boxShadow: "0 4px 14px -6px var(--brand-glow)" }}>
                <Icon name="download" size={16} /> 打包下载 {items.length} 份
              </button>
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <div style={{ border: "1px dashed var(--line)", borderRadius: 16, padding: "56px 24px", textAlign: "center", background: "var(--surface)" }}>
            <div style={{ display: "inline-flex", marginBottom: 14, color: "var(--line)" }}><Icon name="basket" size={52} sw={1.4} /></div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", marginBottom: 7 }}>资源篮还是空的</div>
            <div style={{ fontSize: 13.5, color: "var(--ink-3)", lineHeight: 1.7, maxWidth: 340, margin: "0 auto 18px" }}>在「找资源」里预览任意文档或视频，点<b style={{ color: "var(--brand-deep)" }}>加入资源篮</b>，就会出现在这里，随时取用。</div>
            <button onClick={onGoFind} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 11, border: "none", background: "var(--brand-soft)", color: "var(--brand-deep)", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>
              <CIcon name="search" size={16} /> 去找资源
            </button>
          </div>
        ) : (
          <div style={{ border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", background: "var(--surface)" }}>
            {items.map((it, i) => {
              const isAlbum = /专辑|合集/.test(it.type || "");
              const isVideo = /视频|微课|实验/.test(it.type || "");
              const ic = isAlbum ? "layers" : isVideo ? "interactive" : "file";
              const tint = isAlbum ? { c: "var(--brand-deep)", bg: "var(--brand-soft)", bd: "var(--brand-soft-border)" } : isVideo ? { c: "oklch(0.5 0.13 200)", bg: "oklch(0.95 0.04 200)", bd: "oklch(0.86 0.06 200)" } : { c: "var(--ink-3)", bg: "var(--surface-2)", bd: "var(--line)" };
              return (
                <div key={it.bid} className="basket-row" style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 16px", borderTop: i === 0 ? "none" : "1px solid var(--line)", transition: "background .14s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <span style={{ width: 38, height: 38, borderRadius: 10, background: tint.bg, border: "1px solid " + tint.bd, display: "grid", placeItems: "center", color: tint.c, flexShrink: 0 }}><Icon name={ic} size={18} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 3 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 800, color: tint.c, background: tint.bg, border: "1px solid " + tint.bd, padding: "1px 7px", borderRadius: 6, flexShrink: 0 }}>{it.type}</span>
                      {it.meta && <span style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.meta}</span>}
                    </div>
                  </div>
                  <button title="下载" style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}><Icon name="download" size={15} /></button>
                  <button onClick={() => onRemove && onRemove(it.bid)} title="移出资源篮" style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-3)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}><Icon name="trash" size={15} /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { BasketPage });

// ---------- Login modal (triggered by gated actions) ----------
function LoginModal({ onClose, onLogin }) {
  const [phone, setPhone] = useState("");
  const benefits = [
    { icon: "spark", t: "小博士记住你的学科、版本与偏好" },
    { icon: "history", t: "历史对话与作品云端同步" },
    { icon: "shield", t: "创作有据可依，安全可信" },
  ];
  return (
    <div data-login-modal style={{ position: "fixed", inset: 0, zIndex: 90, display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(20,16,10,.5)", backdropFilter: "blur(3px)" }} />
      <div className="intent-card" style={{ position: "relative", width: "min(420px, 100%)", background: "var(--canvas)", borderRadius: 22, border: "1px solid var(--line)", boxShadow: "0 40px 90px -40px rgba(0,0,0,.55)", overflow: "hidden" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, width: 32, height: 32, borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-3)", display: "grid", placeItems: "center", cursor: "pointer", zIndex: 2 }}>
          <Icon name="close" size={15} sw={2.4} />
        </button>
        <div style={{ padding: "30px 30px 26px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}><BotAvatar size={52} glow /></div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", textAlign: "center", margin: "0 0 6px" }}>登录 AI 小博士</h2>
          <p style={{ fontSize: 13, color: "var(--ink-3)", textAlign: "center", margin: "0 0 20px", lineHeight: 1.6 }}>登录后即可使用历史对话与作品管理</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号"
              inputMode="numeric"
              style={{ width: "100%", padding: "13px 15px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 14.5, fontFamily: "var(--font-zh)", color: "var(--ink)", outline: "none", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 9 }}>
              <input placeholder="验证码" style={{ flex: 1, minWidth: 0, padding: "13px 15px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 14.5, fontFamily: "var(--font-zh)", color: "var(--ink)", outline: "none", boxSizing: "border-box" }} />
              <button style={{ flexShrink: 0, padding: "0 14px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface-2)", color: "var(--ink-2)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", whiteSpace: "nowrap" }}>获取验证码</button>
            </div>
          </div>

          <button
            onClick={onLogin}
            style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: "var(--brand-grad)", backgroundColor: "var(--brand)", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-zh)", boxShadow: "0 6px 18px -6px var(--brand-glow)" }}
          >
            登录 / 注册
          </button>

          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 20, paddingTop: 18, borderTop: "1px dashed var(--line)" }}>
            {benefits.map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, color: "var(--ink-2)" }}>
                <span style={{ width: 22, height: 22, borderRadius: 7, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}><Icon name={b.icon} size={12} /></span>
                {b.t}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
            登录即代表同意《用户协议》与《隐私政策》<br />演示环境，点击「登录」即可直接进入
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginModal });

// ---------- 资源篮 (resource basket) — global overlay, openable anywhere ----------
function BasketPanel({ open, items, onClose, onRemove, onClear, onOpenContent }) {
  const mobile = useIsMobile();
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const panelStyle = mobile
    ? { position: "fixed", left: 0, right: 0, bottom: 0, height: "82dvh", maxHeight: "82vh", borderRadius: "18px 18px 0 0", transform: open ? "translateY(0)" : "translateY(101%)" }
    : { position: "fixed", top: 0, right: 0, bottom: 0, width: "min(420px, 92vw)", borderRadius: 0, transform: open ? "translateX(0)" : "translateX(102%)" };

  return (
    <React.Fragment>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(20,16,10,.42)", backdropFilter: "blur(2px)", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity .26s ease" }} />
      <div style={{ ...panelStyle, zIndex: 91, background: "var(--canvas)", boxShadow: "0 -18px 50px -24px rgba(0,0,0,.5)", display: "flex", flexDirection: "column", overflow: "hidden", transition: "transform .3s cubic-bezier(.32,.72,0,1)" }}>
        {mobile && <div style={{ width: 40, height: 4, borderRadius: 999, background: "var(--line)", margin: "8px auto 0", flexShrink: 0 }} />}
        {/* header */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 11, padding: "14px 18px", borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
          <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}><Icon name="basket" size={19} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>资源篮</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600 }}>{items.length > 0 ? `已收集 ${items.length} 份资源，可一并下载或送去出卷` : "把找到的资源加进来，随时取用"}</div>
          </div>
          <button onClick={onClose} aria-label="关闭" style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}>
            <Icon name="close" size={16} sw={2.4} />
          </button>
        </div>
        {/* list */}
        {items.length === 0 ? (
          <div style={{ flex: 1, display: "grid", placeItems: "center", padding: "30px 24px", textAlign: "center" }}>
            <div>
              <div style={{ display: "inline-flex", marginBottom: 12, color: "var(--line)" }}><Icon name="basket" size={46} sw={1.4} /></div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)", marginBottom: 6 }}>资源篮还是空的</div>
              <div style={{ fontSize: 13, color: "var(--ink-3)", lineHeight: 1.6, maxWidth: 280 }}>在「找资源」里预览任意文档或视频，点<b style={{ color: "var(--brand-deep)" }}>加入资源篮</b>，就会出现在这里。</div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 9 }}>
            {items.map((it) => {
              const isAlbum = /专辑|合集/.test(it.type || "");
              const isVideo = /视频|微课|实验/.test(it.type || "");
              const ic = isAlbum ? "layers" : isVideo ? "interactive" : "file";
              const tint = isAlbum ? { c: "var(--brand-deep)", bg: "var(--brand-soft)", bd: "var(--brand-soft-border)" } : isVideo ? { c: "oklch(0.5 0.13 200)", bg: "oklch(0.95 0.04 200)", bd: "oklch(0.86 0.06 200)" } : { c: "var(--ink-3)", bg: "var(--surface-2)", bd: "var(--line)" };
              return (
                <div key={it.bid} style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 13px", borderRadius: 13, background: "var(--surface)", border: "1px solid var(--line)" }}>
                  <span style={{ width: 36, height: 36, borderRadius: 9, background: tint.bg, border: "1px solid " + tint.bd, display: "grid", placeItems: "center", color: tint.c, flexShrink: 0 }}><Icon name={ic} size={17} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 3 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 800, color: tint.c, background: tint.bg, border: "1px solid " + tint.bd, padding: "1px 7px", borderRadius: 6, flexShrink: 0 }}>{it.type}</span>
                      {it.meta && <span style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.meta}</span>}
                    </div>
                  </div>
                  <button onClick={() => onRemove(it.bid)} title="移出资源篮" style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-3)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}>
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {/* footer */}
        {items.length > 0 && (
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 10, padding: 14, borderTop: "1px solid var(--line)", background: "var(--surface)" }}>
            <button onClick={onClear} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 13px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-3)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>
              <Icon name="trash" size={15} /> 清空
            </button>
            <div style={{ flex: 1 }} />
            <Btn kind="primary" icon="download" onClick={onClose}>打包下载 {items.length} 份</Btn>
          </div>
        )}
      </div>
    </React.Fragment>
  );
}

Object.assign(window, { BasketPanel });

// ---------- 我的内容 (content library) — global overlay, openable from a workspace ----------
function ContentPanel({ open, onClose, onResume }) {
  const M = window.AIDATA.USER_MEMORY;
  const mobile = useIsMobile();
  const SOURCES = ["全部", "AI 生成", "找资源下载"];
  const [filter, setFilter] = useState("全部");
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  const items = M.works.filter((w) => filter === "全部" || w.source === filter);
  const srcStyle = (src) =>
    src === "AI 生成" ? { c: "var(--brand-deep)", bg: "var(--brand-soft)", bd: "var(--brand-soft-border)", icon: "spark" }
      : { c: "var(--auth-ink)", bg: "var(--auth-bg)", bd: "var(--auth-border)", icon: "download" };

  const panelStyle = mobile
    ? { position: "fixed", left: 0, right: 0, bottom: 0, height: "82dvh", maxHeight: "82vh", borderRadius: "18px 18px 0 0", transform: open ? "translateY(0)" : "translateY(101%)" }
    : { position: "fixed", top: 0, right: 0, bottom: 0, width: "min(440px, 94vw)", borderRadius: 0, transform: open ? "translateX(0)" : "translateX(102%)" };

  return (
    <React.Fragment>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(20,16,10,.42)", backdropFilter: "blur(2px)", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity .26s ease" }} />
      <div style={{ ...panelStyle, zIndex: 91, background: "var(--canvas)", boxShadow: "0 -18px 50px -24px rgba(0,0,0,.5)", display: "flex", flexDirection: "column", overflow: "hidden", transition: "transform .3s cubic-bezier(.32,.72,0,1)" }}>
        {mobile && <div style={{ width: 40, height: 4, borderRadius: 999, background: "var(--line)", margin: "8px auto 0", flexShrink: 0 }} />}
        {/* header */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 11, padding: "14px 18px 12px", borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
          <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}><Icon name="grid" size={18} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>我的内容</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600 }}>AI 生成与找资源下载，共 {M.works.length} 份</div>
          </div>
          <button onClick={onClose} aria-label="关闭" style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}>
            <Icon name="close" size={16} sw={2.4} />
          </button>
        </div>
        {/* source filter */}
        <div style={{ flexShrink: 0, display: "flex", gap: 7, padding: "10px 16px", borderBottom: "1px solid var(--line)", background: "var(--surface)", overflowX: "auto", scrollbarWidth: "none" }}>
          {SOURCES.map((k) => (
            <button key={k} onClick={() => setFilter(k)} style={{ flexShrink: 0, padding: "5px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", whiteSpace: "nowrap", border: filter === k ? "1px solid var(--brand)" : "1px solid var(--line)", background: filter === k ? "var(--brand-soft)" : "var(--surface)", color: filter === k ? "var(--brand-deep)" : "var(--ink-2)" }}>{k}</button>
          ))}
        </div>
        {/* slim list */}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 9 }}>
          {items.map((w) => {
            const ss = srcStyle(w.source);
            return (
              <button key={w.id} onClick={() => { onResume && onResume(w); onClose(); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 13, background: "var(--surface)", border: "1px solid var(--line)", cursor: "pointer", fontFamily: "var(--font-zh)", textAlign: "left", transition: "border-color .2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--brand-soft-border)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--line)")}>
                <ScenarioGlyph icon={w.icon} hue={w.hue} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.title}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 3 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, color: ss.c, background: ss.bg, border: "1px solid " + ss.bd, padding: "1px 7px", borderRadius: 999, flexShrink: 0 }}><Icon name={ss.icon} size={10} /> {w.source}</span>
                    <span style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.meta}</span>
                  </div>
                </div>
                <span style={{ fontSize: 11, color: "var(--ink-3)", flexShrink: 0 }}>{w.when}</span>
                <span style={{ color: "var(--ink-3)", flexShrink: 0 }}><Icon name="chevron" size={16} /></span>
              </button>
            );
          })}
        </div>
      </div>
    </React.Fragment>
  );
}

Object.assign(window, { ContentPanel });


// ======== intentflow.jsx ========
// intentflow.jsx — AI intent recognition transition
const { useState: useStateIF, useEffect: useEffectIF } = React;

// crude keyword-based intent detection over the 7 scenarios
function detectScenario(text) {
  const t = text || "";
  // grading is checked first — it must win over data-analysis & paper when a
  // teacher says 批改/改作业 (even if the query also mentions 卷 or 质量分析).
  if (/(批改|改作业|阅卷|批一批|批一下|批这|帮我批|打个分|评分并|写评语)/.test(t)) return "grade";
  // route teaching-consult / planning / data-analysis / translation to the
  // general assistant FIRST — these shouldn't be pulled into a making-tool.
  if (/(公开课|有什么建议|有何建议|教学建议|怎么(上|讲|教|引入)|如何(上|讲|教|提升|引入|设计)|教学计划|复习计划|备考方案|教学规划|教学反思|心得体会)/.test(t)) return "general";
  if (/(平均分|及格率|优秀率|质量分析|成绩分析|学情分析)/.test(t) && /\d/.test(t)) return "general";
  if (/(翻译|translate)/.test(t)) return "general";
  const rules = [
    { id: "grade", kw: ["批改", "批批", "改作业", "改一下", "打分", "评分", "阅卷", "给这份", "这份作业", "学生作业", "错因", "写评语", "批一下"] },
    { id: "paper", kw: ["卷", "试卷", "组卷", "测试卷", "考试", "练习卷", "测验", "出题", "出一道", "出一套", "命题", "变式题", "每日一练"] },
    { id: "lesson", kw: ["教案", "教学设计", "详案", "学案", "导学案", "学习任务单", "说课"] },
    { id: "courseware", kw: ["课件", "ppt", "幻灯", "演示", "互动", "拖拽", "课堂活动", "抢答", "互动课件"] },
    { id: "mindmap", kw: ["导图", "思维导图", "知识结构", "脑图"] },
    { id: "textbook", kw: ["区别", "为什么", "什么是", "原理", "讲讲", "怎么理解", "有什么不同", "怎么证明", "是什么意思"] },
    { id: "find", kw: ["找", "搜索", "查找", "资源", "练习", "微课", "素材", "下载", "真题", "课件", "讲义", "知识清单", "视频", "专辑", "合集", "实验"] },
  ];
  for (const r of rules) {
    if (r.kw.some((k) => t.toLowerCase().includes(k.toLowerCase()))) return r.id;
  }
  return "general";
}

// Stricter detector used for RE-ROUTING inside a workspace. Only fires on an
// explicit "make a different thing" cue — weak/ambiguous words (题, 练习, 互动…)
// must NOT pull the teacher out of the tool they're already iterating in.
function detectSwitchTarget(text) {
  const t = (text || "").toLowerCase();
  const strong = [
    { id: "grade", kw: ["批改作业", "批一批", "改作业", "批改这", "整班批改", "帮我批改", "打个分", "评分并", "阅卷", "生成质量分析"] },
    { id: "paper", kw: ["出卷", "出一份卷", "出张卷", "组卷", "出试卷", "出一套", "出份卷", "生成试卷", "出测试卷", "出练习卷", "来份卷子", "出个卷子", "出份卷子", "做份卷子", "做一份卷子", "出道卷子"] },
    { id: "lesson", kw: ["写教案", "出教案", "做教案", "生成教案", "教学设计", "写个教案", "来份教案"] },
    { id: "courseware", kw: ["做课件", "做个课件", "做ppt", "做个ppt", "生成课件", "做互动课件", "来个课件", "做张ppt", "做幻灯", "做演示文稿"] },
    { id: "mindmap", kw: ["思维导图", "画导图", "做导图", "知识导图", "脑图", "画个导图", "画张导图"] },
    { id: "find", kw: ["找资源", "找一些", "找一份", "找点", "找几份", "找现成", "搜资源", "搜一些", "下载资源", "有没有现成"] },
    { id: "textbook", kw: ["问教材", "查教材", "翻教材", "教材里", "课本里", "课本上", "教材上"] },
  ];
  for (const r of strong) {
    if (r.kw.some((k) => t.includes(k))) return r.id;
  }
  return null; // no explicit switch cue
}

// extract pseudo entities to display
function extractEntities(text) {
  const t = text || "";
  const ents = [];
  const editions = ["人教版", "北师大版", "苏教版", "外研版", "统编版", "沪教版"];
  const grades = ["七年级", "八年级", "九年级", "高一", "高二", "高三", "初一", "初二", "初三", "一年级", "二年级", "三年级", "四年级", "五年级", "六年级"];
  const subjects = ["语文", "数学", "英语", "物理", "化学", "生物", "历史", "地理", "政治", "道德与法治", "科学"];
  editions.forEach((e) => t.includes(e) && ents.push({ k: "版本", v: e }));
  grades.forEach((g) => t.includes(g) && ents.push({ k: "学段", v: g }));
  subjects.forEach((s) => t.includes(s) && ents.push({ k: "学科", v: s }));
  // grab a 《》 topic
  const m = t.match(/《(.+?)》/);
  if (m) ents.push({ k: "知识点", v: m[1] });
  if (ents.length === 0) ents.push({ k: "需求", v: "教学创作" });
  return ents;
}

// Whitelist: only these scenarios auto-route; others get legacy fallback
const INTENT_WHITELIST = ["find", "courseware", "lesson", "mindmap"];
const LEGACY_MAP = {
  paper: { intent: "出卷子", entry: "智能组卷" },
  textbook: { intent: "问教材", entry: "教材百科" },
  grade: { intent: "改作业", entry: "作文批改" },
  explain: { intent: "讲卷", entry: "AI 讲卷" },
  image: { intent: "生成图片", entry: "AI 生图" },
  agent: { intent: "智能体", entry: "智能体" },
};

function detectMultiIntent(text) {
  const t = (text || "").toLowerCase();
  const groups = [
    { id: "find", kw: ["找资源","找一份","找一些","找点","搜资源","找现成","找几份","找份"] },
    { id: "courseware", kw: ["做课件","做个课件","生成课件","做ppt","做个ppt"] },
    { id: "lesson", kw: ["写教案","做教案","生成教案"] },
    { id: "mindmap", kw: ["思维导图","画导图","做导图"] },
  ];
  const hits = groups.filter(g => g.kw.some(k => t.includes(k)));
  return hits.length > 1 ? hits.map(h => h.id) : null;
}

function resolveIntent(query) {
  const multi = detectMultiIntent(query);
  if (multi) return { type: "multi", intents: multi, entities: extractEntities(query) };
  const raw = detectScenario(query);
  const entities = extractEntities(query);
  const hidden = window.AIDATA.HIDDEN_SCENARIOS || [];
  if (raw === "general") return { type: "nomatch", entities };
  if (hidden.includes(raw)) return { type: "legacy", scenarioId: raw, legacy: LEGACY_MAP[raw] || { intent: raw, entry: raw }, entities };
  const scenario = (window.AIDATA.SCENARIOS || []).find(s => s.id === raw);
  return { type: "hit", scenarioId: raw, scenario, entities };
}

function IntentFlow({ query, onDone }) {
  const S = window.AIDATA.SCENARIOS;
  const target = detectScenario(query);
  const scenario = S.find((s) => s.id === target);
  const entities = extractEntities(query);
  const [step, setStep] = useStateIF(0);
  // steps: 0 understand, 1 entities, 2 retrieve authority, 3 matched, 4 done->transition

  useEffectIF(() => {
    const timers = [];
    timers.push(setTimeout(() => setStep(1), 700));
    timers.push(setTimeout(() => setStep(2), 1500));
    timers.push(setTimeout(() => setStep(3), 2500));
    timers.push(setTimeout(() => setStep(4), 3450));
    timers.push(setTimeout(() => onDone(target), 4350));
    return () => timers.forEach(clearTimeout);
  }, []);

  const Step = ({ idx, icon, children, accent }) => {
    const state = step > idx ? "done" : step === idx ? "active" : "wait";
    return (
      <div
        style={{
          display: "flex",
          gap: 14,
          alignItems: "flex-start",
          opacity: state === "wait" ? 0.3 : 1,
          transform: state === "wait" ? "translateY(6px)" : "none",
          transition: "all .4s ease",
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            background:
              state === "done"
                ? "var(--brand)"
                : state === "active"
                ? "var(--brand-soft)"
                : "var(--line)",
            color: state === "done" ? "#fff" : "var(--brand)",
            border: state === "active" ? "2px solid var(--brand)" : "none",
            transition: "all .3s",
          }}
        >
          {state === "done" ? (
            <Icon name="check" size={16} sw={2.6} />
          ) : (
            <Icon name={icon} size={15} sw={2} />
          )}
        </div>
        <div style={{ flex: 1, paddingTop: 3 }}>{children}</div>
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "var(--intent-bg)",
      }}
    >
      <div
        className="intent-card"
        style={{
          width: "min(560px, 92vw)",
          background: "var(--surface)",
          borderRadius: 26,
          border: "1px solid var(--line)",
          boxShadow: "0 40px 90px -50px rgba(0,0,0,.45)",
          padding: "34px 34px 30px",
        }}
      >
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
          <div style={{ position: "relative" }}>
            <BotAvatar size={48} glow />
            <span className="bot-ring" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", display: "flex", alignItems: "center", gap: 8 }}>
              AI 小博士正在理解 {step < 4 && <Dots />}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 600 }}>
              意图识别 · 自动匹配场景
            </div>
          </div>
        </div>

        {/* user query echo */}
        <div
          style={{
            background: "var(--brand-soft)",
            border: "1px solid var(--brand-soft-border)",
            borderRadius: "16px 16px 16px 4px",
            padding: "12px 15px",
            margin: "16px 0 22px",
            fontSize: 14.5,
            color: "var(--brand-deep)",
            lineHeight: 1.6,
            fontWeight: 500,
          }}
        >
          "{query}"
        </div>

        {/* steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Step idx={0} icon="spark">
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)" }}>理解你的需求</div>
          </Step>

          <Step idx={1} icon="filter">
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)", marginBottom: step >= 1 ? 9 : 0 }}>
              提取关键信息
            </div>
            {step >= 1 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {entities.map((e, i) => (
                  <span
                    key={i}
                    className="ent-pop"
                    style={{
                      animationDelay: `${i * 0.09}s`,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "4px 10px",
                      borderRadius: 8,
                      background: "var(--surface-2)",
                      border: "1px solid var(--line)",
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: "var(--ink-2)",
                    }}
                  >
                    <span style={{ color: "var(--ink-3)", fontSize: 11 }}>{e.k}</span>
                    <span style={{ color: "var(--brand-deep)", fontWeight: 700 }}>{e.v}</span>
                  </span>
                ))}
              </div>
            )}
          </Step>

          <Step idx={2} icon="shield">
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)" }}>
              检索学科网权威资源库
            </div>
            {step >= 2 && (
              <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 4, lineHeight: 1.5 }}>
                匹配 <b style={{ color: "var(--auth-ink)" }}>三审三校</b> 精品内容作为创作底座
              </div>
            )}
          </Step>

          <Step idx={3} icon="check">
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)" }}>识别场景</div>
            {step >= 3 && (
              <div
                className="match-pop"
                style={{
                  marginTop: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 12,
                  borderRadius: 14,
                  background: `oklch(0.96 0.04 ${scenario.hue})`,
                  border: `1px solid oklch(0.82 0.08 ${scenario.hue})`,
                }}
              >
                <ScenarioGlyph icon={scenario.icon} hue={scenario.hue} size={42} active />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)" }}>{scenario.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 1 }}>{scenario.tagline}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: `oklch(0.5 0.14 ${scenario.hue})`, fontFamily: "var(--font-num)" }}>
                    97%
                  </div>
                  <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}>匹配度</div>
                </div>
              </div>
            )}
          </Step>
        </div>

        {step >= 4 && (
          <div className="enter-pop" style={{ marginTop: 22, textAlign: "center", fontSize: 13.5, color: "var(--ink-2)", fontWeight: 600 }}>
            正在进入 <b style={{ color: "var(--brand-deep)" }}>{scenario.name}</b> 工作台…
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { IntentFlow, detectScenario, detectSwitchTarget, extractEntities, resolveIntent, detectMultiIntent, INTENT_WHITELIST, LEGACY_MAP });

// ---- Inline intent recognition: lives inside a chat bubble ----
// PRD: process state ("正在理解你的需求…") → brief result (~0.5s) → collapsed one-line.
// No step checklist, no confidence score.
function InlineIntent({ query, onDone, instant }) {
  const result = resolveIntent(query);
  const [phase, setPhase] = React.useState(instant ? "collapsed" : "loading");
  React.useEffect(() => {
    if (instant) return;
    const t1 = setTimeout(() => setPhase("result"), 1200);
    const t2 = setTimeout(() => { setPhase("collapsed"); onDone && onDone(result); }, 1700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  const entities = result.entities ? result.entities.filter(e => e.k !== "需求") : [];
  // Build collapsed line
  let lineContent;
  if (result.type === "hit") {
    const ps = entities.length > 0 ? entities.map(e => e.v).join(" · ") : "";
    lineContent = ps
      ? <span>已识别：<b style={{ color: "var(--ink)" }}>{ps}</b> → <b style={{ color: `oklch(0.45 0.12 ${result.scenario.hue})` }}>{result.scenario.name}</b></span>
      : <span>已识别 → <b style={{ color: `oklch(0.45 0.12 ${result.scenario.hue})` }}>{result.scenario.name}</b></span>;
  } else if (result.type === "multi") {
    lineContent = "识别到多个需求，先和你确认先做哪个";
  } else {
    lineContent = "未匹配到特定场景，直接为你解答";
  }
  if (phase === "loading") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-2)", fontWeight: 600, padding: "2px 0" }}>
        <span className="mini-spin" style={{ width: 14, height: 14 }} />
        正在理解你的需求…
      </div>
    );
  }
  const isResult = phase === "result";
  if (result.type === "hit" && isResult) {
    return (
      <div className="clarify-pop" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 11px", borderRadius: 8, background: `oklch(0.96 0.04 ${result.scenario.hue})`, border: `1px solid oklch(0.88 0.06 ${result.scenario.hue})`, fontSize: 13, fontWeight: 600, color: "var(--ink-2)" }}>
        <ScenarioGlyph icon={result.scenario.icon} hue={result.scenario.hue} size={22} active />
        {lineContent}
      </div>
    );
  }
  return (
    <div className={isResult ? "clarify-pop" : ""} style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 500, padding: "2px 0" }}>
      {lineContent}
    </div>
  );
}

// Multi-intent confirmation: user picks which task to do first
function MultiIntentAsk({ intents, onPick }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.7 }}>
        你是想先{intents.map((s, i) => (
          <React.Fragment key={s.id}>
            {i > 0 && "，还是先"}
            <b style={{ color: `oklch(0.45 0.12 ${s.hue})` }}>{s.name}</b>
          </React.Fragment>
        ))}？我可以一件一件来。
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {intents.map(s => (
          <button key={s.id} onClick={() => onPick(s.id)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 10, border: `1px solid oklch(0.84 0.07 ${s.hue})`, background: `oklch(0.96 0.04 ${s.hue})`, cursor: "pointer", fontFamily: "var(--font-zh)", fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>
            <ScenarioGlyph icon={s.icon} hue={s.hue} size={24} active />
            先{s.name}
          </button>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { InlineIntent, MultiIntentAsk });


// ======== workspace_find_media.jsx ========
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
