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
  return [{ role: "sys", text: `已切换到「${scenario.name}」`, icon: scenario.icon, back }];
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

Object.assign(window, { IntentFlow, detectScenario, detectSwitchTarget, extractEntities });

// ---- Inline intent recognition: lives inside a chat bubble ----
function InlineIntent({ query, onDone, instant }) {
  const S = window.AIDATA.SCENARIOS;
  const target = detectScenario(query);
  const isGeneral = target === "general";
  const scenario = S.find((s) => s.id === target) || window.AIDATA.GENERAL;
  const entities = extractEntities(query);
  const [step, setStep] = React.useState(instant ? 4 : 0);
  // 0 understand, 1 entities, 2 retrieve, 3 matched, 4 done

  React.useEffect(() => {
    if (instant) return;
    const timers = [];
    timers.push(setTimeout(() => setStep(1), 650));
    timers.push(setTimeout(() => setStep(2), 1400));
    timers.push(setTimeout(() => setStep(3), 2300));
    timers.push(setTimeout(() => setStep(4), 3150));
    timers.push(setTimeout(() => onDone && onDone(target), 3700));
    return () => timers.forEach(clearTimeout);
  }, []);

  const Row = ({ idx, icon, label, children }) => {
    const state = step > idx ? "done" : step === idx ? "active" : "wait";
    return (
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", opacity: state === "wait" ? 0.35 : 1, transition: "opacity .35s" }}>
        <div style={{ width: 22, height: 22, flexShrink: 0, borderRadius: "50%", display: "grid", placeItems: "center", marginTop: 1, background: state === "done" ? "var(--brand)" : state === "active" ? "var(--brand-soft)" : "var(--line)", color: state === "done" ? "#fff" : "var(--brand)", border: state === "active" ? "1.5px solid var(--brand)" : "none", transition: "all .3s" }}>
          {state === "done" ? <Icon name="check" size={12} sw={2.8} /> : <Icon name={icon} size={11} sw={2} />}
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{label}</div>
          {state !== "wait" && children}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 700, color: "var(--ink-2)" }}>
        {instant ? "已理解你的需求" : "正在理解你的需求"} {step < 4 && <Dots />}
      </div>
      <Row idx={0} icon="spark" label="理解需求" />
      <Row idx={1} icon="filter" label="提取关键信息">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 7 }}>
          {entities.map((e, i) => (
            <span key={i} className="ent-pop" style={{ animationDelay: `${i * 0.08}s`, display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 7, background: "var(--surface)", border: "1px solid var(--line)", fontSize: 11.5, fontWeight: 600 }}>
              <span style={{ color: "var(--ink-3)", fontSize: 10.5 }}>{e.k}</span>
              <span style={{ color: "var(--brand-deep)", fontWeight: 700 }}>{e.v}</span>
            </span>
          ))}
        </div>
      </Row>
      <Row idx={2} icon="shield" label="检索学科网权威库">
        <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 3 }}>匹配三审三校精品内容作为底座</div>
      </Row>
      <Row idx={3} icon="check" label={isGeneral ? "未匹配到专用工具" : "识别场景"}>
        {step >= 3 && (
          <div className="match-pop" style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10, padding: 9, borderRadius: 11, maxWidth: "100%", boxSizing: "border-box", background: `oklch(0.96 0.04 ${scenario.hue})`, border: `1px solid oklch(0.84 0.07 ${scenario.hue})` }}>
            <ScenarioGlyph icon={scenario.icon} hue={scenario.hue} size={32} active />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>{isGeneral ? "由通用助手解答" : scenario.name}</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{isGeneral ? "直接对话回答你的问题" : scenario.tagline}</div>
            </div>
            {!isGeneral && <div style={{ fontSize: 16, fontWeight: 800, color: `oklch(0.5 0.14 ${scenario.hue})`, fontFamily: "var(--font-num)" }}>97%</div>}
          </div>
        )}
      </Row>
      {step >= 4 && !instant && (
        <div className="enter-pop" style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 600 }}>
          {isGeneral ? <span>正在为你解答…</span> : <span>已为你打开 <b style={{ color: "var(--brand-deep)" }}>{scenario.name}</b>，继续为你准备…</span>}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { InlineIntent });


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


// ======== workspace_find.jsx ========
// workspace_find.jsx — 找资源 workspace (human-AI collaboration)
const { useState: uS, useEffect: uE, useRef: uR } = React;

// ---- Shared workspace shell (top bar) ----
const MIN_CHAT_W = 320;   // chat panel never narrower than a phone screen
const MIN_CONTENT_W = 380; // content side keeps at least this much room

// Resizable two-pane: [ChatPanel, content]. Drag the seam to rebalance.
function ChatResizer({ children }) {
  const kids = React.Children.toArray(children);
  const first = kids[0];
  const rest = kids.slice(1);
  const wrapRef = uR(null);
  const [w, setW] = uS(() => {
    const s = parseInt(localStorage.getItem("aida_chat_w") || "", 10);
    return Number.isFinite(s) && s >= MIN_CHAT_W ? s : (first.props.width || 380);
  });
  const [dragging, setDragging] = uS(false);
  const dref = uR(false);

  uE(() => { try { localStorage.setItem("aida_chat_w", String(Math.round(w))); } catch (e) {} }, [w]);

  uE(() => {
    const clamp = (val) => {
      const total = wrapRef.current ? wrapRef.current.getBoundingClientRect().width : 99999;
      const maxW = Math.max(MIN_CHAT_W, total - MIN_CONTENT_W);
      return Math.min(Math.max(val, MIN_CHAT_W), maxW);
    };
    const move = (e) => {
      if (!dref.current || !wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      setW(clamp(e.clientX - rect.left));
    };
    const up = () => {
      if (!dref.current) return;
      dref.current = false; setDragging(false);
      document.body.style.cursor = ""; document.body.style.userSelect = "";
    };
    const onResize = () => setW((v) => clamp(v));
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("resize", onResize);
    setW((v) => clamp(v)); // clamp on mount to the live container size
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const startDrag = (e) => {
    dref.current = true; setDragging(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    e.preventDefault();
  };

  return (
    <div ref={wrapRef} style={{ flex: 1, minWidth: 0, display: "flex" }}>
      {React.cloneElement(first, { width: w })}
      <div
        className={"ws-resizer" + (dragging ? " dragging" : "")}
        onPointerDown={startDrag}
        title="拖动调整左右宽度"
        style={{ width: 12, margin: "0 -6px", flexShrink: 0, cursor: "col-resize", position: "relative", zIndex: 6, touchAction: "none" }}
      >
        <span className="ws-resizer-grip" />
      </div>
      {rest}
    </div>
  );
}

// ---- Current-scenario label: lives at the TOP OF THE STAGE (right pane). Pure
// status ("你在哪") — it no longer switches scenarios. Switching now happens down
// by the composer (see ScenePills), the same visual focus area as typing. ----
function StageScenarioLabel({ scenario }) {
  if (!scenario) return null;
  return (
    <div data-screen-label="当前场景标识" style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px 6px 12px", minWidth: 0 }}>
      <ScenarioGlyph icon={scenario.icon} hue={scenario.hue} size={22} active />
      <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{scenario.name}</span>
    </div>
  );
}

// ---- Scene pills: lives ABOVE THE COMPOSER (left pane, same visual focus area as
// typing). Clicking a pill is a manual scene switch — the session's conversation
// keeps flowing, only the right-side workspace (and this row's highlight) changes.
// Overflow rule: whatever doesn't fit in one row collapses into a "更多" menu; if the
// CURRENT scenario would land in that collapsed set, it's swapped into the visible
// row instead — the active scene must always stay visible. ----
function ScenePills({ scenario, onSwitch, disabled }) {
  const HID = window.AIDATA.HIDDEN_SCENARIOS || [];
  const SC = window.AIDATA.SCENARIOS.filter((s) => !HID.includes(s.id) || (scenario && s.id === scenario.id));
  const wrapRef = uR(null);
  const measureRefs = uR([]);
  const moreRef = uR(null);
  const [fit, setFit] = uS(SC.length);
  const [moreOpen, setMoreOpen] = uS(false);
  const canSwitch = typeof onSwitch === "function" && !disabled;

  const recalc = () => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const avail = wrap.clientWidth;
    const GAP = 6;
    const widths = measureRefs.current.map((el) => (el ? el.getBoundingClientRect().width : 0));
    const moreW = (moreRef.current ? moreRef.current.getBoundingClientRect().width : 64) + GAP;
    let total = 0, count = 0;
    for (let i = 0; i < widths.length; i++) {
      const w = widths[i] + (i > 0 ? GAP : 0);
      const isLast = i === widths.length - 1;
      const budget = isLast ? avail : avail - moreW;
      if (total + w <= budget) { total += w; count = i + 1; } else break;
    }
    setFit(Math.max(1, count));
  };

  uE(() => {
    recalc();
    const ro = new ResizeObserver(() => recalc());
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  uE(() => {
    if (!moreOpen) return;
    const close = (e) => { if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [moreOpen]);

  const activeIdx = SC.findIndex((s) => scenario && s.id === scenario.id);
  let visible = SC.slice(0, fit);
  let overflow = SC.slice(fit);
  if (activeIdx >= fit && fit > 0) {
    visible = [...SC.slice(0, fit - 1), SC[activeIdx]];
    overflow = SC.filter((s) => !visible.some((v) => v.id === s.id));
  }

  const pillStyle = (active) => ({
    display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0, whiteSpace: "nowrap",
    padding: "5px 11px 5px 6px", borderRadius: 999,
    border: "1px solid " + (active ? "var(--brand-soft-border)" : "var(--line)"),
    background: active ? "var(--brand-soft)" : "var(--surface)",
    color: active ? "var(--brand-deep)" : "var(--ink-2)",
    fontSize: 12.5, fontWeight: active ? 800 : 600,
    cursor: active || !canSwitch ? "default" : "pointer", fontFamily: "var(--font-zh)",
    opacity: disabled ? 0.55 : 1,
    transition: "background .15s, border-color .15s, color .15s",
  });
  const Pill = ({ s, refCb }) => {
    const active = scenario && s.id === scenario.id;
    return (
      <button
        data-scenario-pill
        ref={refCb}
        key={s.id}
        onClick={() => { if (canSwitch && !active) { window.ChatSession && (window.ChatSession.switchMeta = { source: "manual" }); onSwitch(s.id, ""); } }}
        title={active ? "当前场景" : "切换到" + s.name}
        style={pillStyle(active)}
        onMouseEnter={(e) => { if (canSwitch && !active) e.currentTarget.style.background = "var(--surface-2)"; }}
        onMouseLeave={(e) => { if (canSwitch && !active) e.currentTarget.style.background = active ? "var(--brand-soft)" : "var(--surface)"; }}
      >
        <ScenarioGlyph icon={s.icon} hue={s.hue} size={20} active={active} />
        {s.name}
      </button>
    );
  };

  return (
    <div ref={wrapRef} data-screen-label="场景切换胶囊" style={{ position: "relative", display: "flex", alignItems: "center", gap: 6, minWidth: 0, marginBottom: 8 }}>
      {/* hidden measuring row — same markup as the real pills, used only to learn natural widths */}
      <div style={{ position: "absolute", top: 0, left: 0, visibility: "hidden", pointerEvents: "none", display: "flex", gap: 6, zIndex: -1 }} aria-hidden="true">
        {SC.map((s, i) => <Pill key={s.id} s={s} refCb={(el) => (measureRefs.current[i] = el)} />)}
      </div>
      {visible.map((s) => <Pill key={s.id} s={s} />)}
      {overflow.length > 0 && (
        <div ref={moreRef} style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={() => setMoreOpen((v) => !v)}
            style={{ ...pillStyle(false), cursor: canSwitch ? "pointer" : "default", paddingLeft: 11 }}
          >
            更多 <span style={{ display: "inline-flex", transform: moreOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }}><Icon name="chevron" size={12} /></span>
          </button>
          {moreOpen && (
            <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: 0, minWidth: 168, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "0 12px 32px -10px rgba(20,30,50,.22)", padding: 6, zIndex: 40 }}>
              {overflow.map((s) => {
                const active = scenario && s.id === scenario.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => { setMoreOpen(false); if (canSwitch && !active) { window.ChatSession && (window.ChatSession.switchMeta = { source: "manual" }); onSwitch(s.id, ""); } }}
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 9px", borderRadius: 8, border: "none", background: active ? "var(--brand-soft)" : "transparent", color: active ? "var(--brand-deep)" : "var(--ink-2)", fontSize: 12.5, fontWeight: active ? 800 : 600, fontFamily: "var(--font-zh)", cursor: active || !canSwitch ? "default" : "pointer", textAlign: "left" }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--surface-2)"; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                  >
                    <ScenarioGlyph icon={s.icon} hue={s.hue} size={20} active={active} />
                    {s.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WorkspaceShell({ scenario, onHome, onSwitch, children, right, afterTitle, titleMeta, subtitleOverride, recognizing, headerRecognizing, mobilePanelLabel = "结果", mobilePanelIcon = "layers", openSheetKey, nav, chatLed }) {
  const showRec = recognizing || headerRecognizing;
  const mobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [navOpen, setNavOpen] = React.useState(false); // mobile nav drawer
  // desktop rail: collapsed = fully hidden, just an expand button in the header (Claude/豆包 style)
  const [railOpen, setRailOpenState] = React.useState(() => localStorage.getItem("aida_rail_open") !== "0");
  const setRailOpen = (v) => { setRailOpenState(v); try { localStorage.setItem("aida_rail_open", v ? "1" : "0"); } catch (e) {} };
  // right stage pane: collapse-to-edge (give the conversation full width) and fullscreen (focus the output)
  const [stageCollapsed, setStageCollapsedState] = React.useState(() => localStorage.getItem("aida_stage_collapsed") === "1");
  const setStageCollapsed = (v) => { setStageCollapsedState(v); try { localStorage.setItem("aida_stage_collapsed", v ? "1" : "0"); } catch (e) {} };
  const [stageFull, setStageFull] = React.useState(false);
  const kids = React.Children.toArray(children);
  const isChatLed = chatLed || (kids.length >= 2 && kids[0] && kids[0].type === ChatPanel);
  // live messages of the chat column — drives the 成果 (artifacts) quick-menu in the header
  const chatMsgs = (isChatLed && kids[0] && kids[0].props && kids[0].props.messages) || [];
  // mobile: auto-slide the content sheet up when the result pane becomes ready
  // or the user opens a specific item (key changes). Never auto-opens twice for
  // the same state, so it stays out of the way once dismissed.
  const lastKey = React.useRef(undefined);
  React.useEffect(() => {
    if (!isChatLed) { lastKey.current = openSheetKey; return; }
    if (openSheetKey && openSheetKey !== lastKey.current) {
      if (mobile) setSheetOpen(true);
      else { setStageCollapsed(false); setStageFull(false); } // new content arrived → reveal collapsed stage AND drop fullscreen so the conversation is visible
    }
    lastKey.current = openSheetKey;
  }, [openSheetKey, mobile, isChatLed]);

  // assistant identity — mobile header only (the desktop rail already carries the brand,
  // so the chat column gets a slim status line instead of a second avatar)
  const identity = (small) => showRec ? (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
      <div style={{ position: "relative", flexShrink: 0 }}><BotAvatar size={small ? 30 : 32} glow /><span className="bot-ring" /></div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: small ? 13.5 : 14.5, fontWeight: 800, color: "var(--ink)", display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>正在识别你的需求 <Dots /></div>
        <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, whiteSpace: "nowrap" }}>判断该用哪个场景为你服务…</div>
      </div>
    </div>
  ) : (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
      <BotAvatar size={small ? 30 : 32} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: small ? 13.5 : 14.5, fontWeight: 800, color: "var(--ink)", display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" }}>AI 小博士 {titleMeta}</div>
        <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{subtitleOverride || (scenario && scenario.id !== "general" ? `正在陪你 · ${scenario.name}` : "有问必答，全程陪伴的教学助手")}</div>
      </div>
    </div>
  );

  // expand + new-chat buttons shown when the rail is collapsed — no narrow icon bar, just these
  const iconBtnStyle = { width: 32, height: 32, borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 };
  const hoverFx = {
    onMouseEnter: (e) => (e.currentTarget.style.background = "var(--surface-2)"),
    onMouseLeave: (e) => (e.currentTarget.style.background = "var(--surface)"),
  };
  const expandBtn = nav && !mobile && !railOpen ? (
    <span style={{ display: "inline-flex", gap: 6 }}>
      <button data-home-nav onClick={() => setRailOpen(true)} data-tip="展开菜单" data-tip-pos="bottom-left" aria-label="展开菜单" style={iconBtnStyle} {...hoverFx}>
        <Icon name="panelLeftOpen" size={17} />
      </button>
      {nav.onNewChat && (
        <button data-home-nav onClick={() => nav.onNewChat()} data-tip="新对话" aria-label="新对话" style={iconBtnStyle} {...hoverFx}>
          <Icon name="plus" size={17} />
        </button>
      )}
    </span>
  ) : null;

  // collapse / fullscreen controls for the RIGHT stage pane (desktop, chat-led only)
  const stageCtrlBtn = { width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 };
  const stageControls = (!mobile && isChatLed) ? (
    <span style={{ display: "inline-flex", gap: 6, marginLeft: 8 }}>
      {stageFull ? (
        <button onClick={() => setStageFull(false)} data-tip="退出全屏" data-tip-pos="bottom-right" aria-label="退出全屏" style={stageCtrlBtn} {...hoverFx}>
          <Icon name="exitFull" size={16} />
        </button>
      ) : (
        <React.Fragment>
          <button onClick={() => setStageFull(true)} data-tip="全屏" data-tip-pos="bottom-right" aria-label="进入全屏" style={stageCtrlBtn} {...hoverFx}>
            <Icon name="enterFull" size={16} />
          </button>
          <button onClick={() => setStageCollapsed(true)} data-tip="收起面板" data-tip-pos="bottom-right" aria-label="收起面板" style={stageCtrlBtn} {...hoverFx}>
            <Icon name="panelRightClose" size={17} />
          </button>
        </React.Fragment>
      )}
    </span>
  ) : null;

  // slim chat-column header: status only — the avatar lives in the rail, not here.
  // rightSlot lets the collapsed state drop an "expand panel" button at the top-right.
  const makeChatHeader = (rightSlot) => (
    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 12px", borderBottom: "1px solid var(--line)", background: "var(--surface)", flexShrink: 0, height: 51 }}>
      {expandBtn}
      {showRec ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 800, color: "var(--brand-deep)", minWidth: 0, whiteSpace: "nowrap" }}>
          正在识别你的需求 <Dots />
        </span>
      ) : (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: "var(--ink-2)", minWidth: 0 }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: "oklch(0.72 0.17 150)", flexShrink: 0 }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtitleOverride || (scenario && scenario.id !== "general" ? `正在陪你 · ${scenario.name}` : "有问必答 · 全程陪伴")}</span>
        </span>
      )}
      {titleMeta}
      <div style={{ flex: 1 }} />
      {!showRec && <SessionArtifactsMenu messages={chatMsgs} />}
      {rightSlot}
    </div>
  );
  const chatHeader = makeChatHeader(null);
  // when the stage is collapsed, the conversation goes full-width and this button (top-right of the
  // chat header, same spot the collapse button lived) brings the panel back — no weird full-height rail.
  const expandStageBtn = (
    <button onClick={() => setStageCollapsed(false)} data-tip={`展开${mobilePanelLabel}面板`} data-tip-pos="bottom-right" aria-label="展开面板" style={stageCtrlBtn} {...hoverFx}>
      <Icon name="panelRightOpen" size={17} />
    </button>
  );

  // stage header — scenario tabs + per-scenario controls + actions, top of the RIGHT pane
  const stageHeader = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 12px 0 4px", background: "var(--surface)", borderBottom: "1px solid var(--line)", flexShrink: 0, minHeight: 51 }}>
      {!isChatLed && expandBtn && <span style={{ marginLeft: 8, display: "inline-flex" }}>{expandBtn}</span>}
      {!isChatLed && showRec && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 11px", marginLeft: 8, borderRadius: 999, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", fontSize: 12, fontWeight: 700, color: "var(--brand-deep)", whiteSpace: "nowrap", flexShrink: 0 }}>
          <BotAvatar size={20} /> 正在识别需求 <Dots />
        </span>
      )}
      <StageScenarioLabel scenario={scenario} />
      {!showRec && afterTitle}
      <div style={{ flex: 1 }} />
      {!mobile && right}
      {stageControls}
    </div>
  );

  const stage = (content) => (
    <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", background: "var(--canvas)" }}>
      {stageHeader}
      <div style={{ flex: 1, minHeight: 0, display: "flex", position: "relative" }}>{content}</div>
    </div>
  );

  return (
    <WSMobileContext.Provider value={{ mobile, sheetOpen, setSheetOpen, isChatLed }}>
    <div style={{ height: "100dvh", display: "flex", background: "var(--canvas)", overflow: "hidden" }}>
      {nav && (mobile
        ? <LeftRail page="" {...nav} mobile mobileOpen={navOpen} onCloseMobile={() => setNavOpen(false)} />
        : railOpen
        ? <LeftRail page="" {...nav} forceOpen onCollapse={() => setRailOpen(false)} />
        : null)}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {mobile && (
          <header style={{ display: "flex", alignItems: "center", gap: 8, height: 56, padding: "0 12px", background: "var(--surface)", borderBottom: "1px solid var(--line)", flexShrink: 0, zIndex: 30 }}>
            {nav ? (
              <button onClick={() => setNavOpen(true)} aria-label="打开菜单" style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 11, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer" }}>
                <Icon name="menu" size={19} />
              </button>
            ) : (
              <button onClick={onHome} aria-label="返回首页" style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 11, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer" }}>
                <Icon name="home" size={18} />
              </button>
            )}
            {identity(true)}
            {!showRec && isChatLed && <SessionArtifactsMenu messages={chatMsgs} />}
            {!showRec && (isChatLed ? <SheetPill label={mobilePanelLabel} icon={mobilePanelIcon} onClick={() => setSheetOpen(true)} /> : right)}
          </header>
        )}
        <div style={{ flex: 1, minHeight: 0, display: "flex", position: "relative" }}>
          {mobile && isChatLed ? (
            <React.Fragment>
              {React.cloneElement(kids[0], { width: "100%", scenario, onSwitch })}
              <MobileSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={mobilePanelLabel} headerRight={right}>
                {stage(kids.slice(1))}
              </MobileSheet>
            </React.Fragment>
          ) : isChatLed ? (
            stageFull ? (
              <React.Fragment>
                {/* fullscreen: stage covers the ENTIRE viewport (incl. left rail) via a fixed overlay;
                    chat stays mounted (hidden) so its state survives */}
                <div style={{ display: "none" }}>{React.cloneElement(kids[0], { header: null, scenario, onSwitch })}</div>
                <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "var(--canvas)", display: "flex", flexDirection: "column" }}>
                  {stage(kids.slice(1))}
                </div>
              </React.Fragment>
            ) : stageCollapsed ? (
              // only the conversation remains — full-width chrome, content centered in a readable column (WorkBuddy-style)
              React.cloneElement(kids[0], { header: makeChatHeader(expandStageBtn), width: "100%", centered: true, scenario, onSwitch })
            ) : (
              <ChatResizer>
                {React.cloneElement(kids[0], { header: chatHeader, scenario, onSwitch })}
                {stage(kids.slice(1))}
              </ChatResizer>
            )
          ) : (
            stage(children)
          )}
        </div>
      </div>
    </div>
    </WSMobileContext.Provider>
  );
}

// neutral right-side placeholder shown while intent is still being recognised
function RecognizingPanel() {
  return (
    <div style={{ flex: 1, display: "grid", placeItems: "center", padding: "30px 24px", textAlign: "center" }}>
      <div className="home-fade" style={{ maxWidth: 360 }}>
        <div style={{ position: "relative", display: "inline-flex", marginBottom: 18 }}>
          <BotAvatar size={56} glow />
          <span className="bot-ring" />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", margin: "0 0 8px" }}>正在识别你的需求…</h2>
        <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.65, margin: 0 }}>小博士正从<b style={{ color: "var(--brand-deep)" }}>学科网资源库</b>判断最合适的场景，稍候就为你打开对应的工作台。</p>
      </div>
    </div>
  );
}

// ---- Session task bar (pinned above the composer) ----
// Surfaces an in-progress 出卷子/写教案 task started this session, so a teacher who
// jumped here (e.g. tapped a 引用 card) always has a fixed way back to their draft.
// Two visual states: 草稿条 (dashed/muted, draft in progress) → 结果条 (solid/brand, built).
// The bar is a "you left something elsewhere" anchor — gated on POSITION, not progress:
// only surfaces a task whose home scenario ≠ where the teacher currently is. So while
// you're inside 出卷子 it never points at the卷子 in front of you (which also sidesteps
// 出卷子 having no guided empty-state — its config screen would otherwise read as a draft
// the instant you arrive). built only toggles the wording (查看成品 vs 继续编辑).
function deriveSessionTask(currentScenario) {
  const clean = (s) => (s || "").replace(/[《》]/g, "").trim();
  const p = window.ChatSession.scratch.paper2;
  if (p && (p.q || p.paper) && currentScenario !== "paper") {
    const topic = clean((p.paper && p.paper.meta && p.paper.meta.topic) || ((p.q || "").match(/《(.+?)》/) || [])[1] || (p.q || "").replace(/^据/, "").slice(0, 12) || "卷子");
    return { scenario: "paper", icon: "paper", kind: "卷子", topic, built: !!p.paper };
  }
  const l = window.ChatSession.scratch.lesson;
  if (l && (l.q || l.doc) && currentScenario !== "lesson") {
    const topic = clean((l.doc && l.doc.topic) || ((l.q || "").match(/《(.+?)》/) || [])[1] || (l.q || "").replace(/^据/, "").slice(0, 12) || "教案");
    return { scenario: "lesson", icon: "lesson", kind: "教案", topic, built: !!l.doc };
  }
  return null;
}
function SessionTaskBar({ task, onOpen }) {
  if (!task) return null;
  const built = task.built;
  return (
    <div style={{ padding: "0 14px 10px" }}>
      <button onClick={onOpen} title={built ? "打开成品" : "回到草稿继续编辑"} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left", cursor: "pointer", fontFamily: "var(--font-zh)",
        padding: "9px 11px", borderRadius: 12,
        border: built ? "1px solid var(--brand-soft-border)" : "1.5px dashed var(--line-2)",
        background: built ? "var(--brand-soft)" : "var(--surface-2)",
        transition: "all .15s",
      }}>
        <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: "grid", placeItems: "center",
          background: built ? "var(--surface)" : "transparent",
          border: built ? "1px solid var(--brand-soft-border)" : "1px dashed var(--line-2)",
          color: built ? "var(--brand-deep)" : "var(--ink-4)" }}>
          <Icon name={task.icon} size={15} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 800, letterSpacing: ".3px", color: built ? "var(--brand-deep)" : "var(--ink-4)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: built ? "oklch(0.72 0.17 150)" : "var(--ink-4)", flexShrink: 0 }} />
            {built ? "已生成 · 点击查看" : "草稿编辑中 · 进度已保留"}
          </span>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
            {built ? "" : "继续编辑 "}《{task.topic}》{task.kind}
          </span>
        </span>
        <Icon name="chevronRight" size={16} />
      </button>
    </div>
  );
}

// ---- Chat panel (left) ----
function ChatPanel({ messages, onSend, suggestions, placeholder, width = 380, pinnedCard, roundsById, shownId, onOpenRound, retrieving, header, onOpenRef, clarify, onResolveClarify, onSkipClarify, clarifyNode, taskBar, centered, scenario, onSwitch }) {
  const [draft, setDraft] = uS("");
  const [att, setAtt] = uS([]);          // { id, name, status: uploading|parsing|ready }
  const [viewFile, setViewFile] = uS(null);
  const [atBottom, setAtBottom] = uS(true);
  const scrollRef = uR(null);
  const taRef = uR(null);
  const atBottomRef = uR(true);
  const prevLenRef = uR(messages.length);
  const TA_MAX = 116; // ~5 lines, then scroll in place
  const aiBusy = messages.some((m) => m.typing);

  // auto-scroll to latest ONLY when a new message arrives AND the user is already
  // at the bottom — never yank them up from history (clicking history = no jump)
  const recomputeBottom = () => {
    const el = scrollRef.current; if (!el) return;
    const nb = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    atBottomRef.current = nb; setAtBottom(nb);
  };
  // Always snap to the latest when the message list actually changes — sends, AI
  // replies, handoff seeds all reach the bottom. Clicking a history result card does
  // NOT change `messages`, so this effect won't fire and the chat stays put.
  uE(() => {
    const el = scrollRef.current; if (!el) return;
    el.scrollTop = el.scrollHeight;
    recomputeBottom();
  }, [messages]);
  const scrollToBottom = () => { const el = scrollRef.current; if (!el) return; el.scrollTop = el.scrollHeight; atBottomRef.current = true; setAtBottom(true); };

  // grow the textarea up to 5 lines, then keep height and scroll internally
  uE(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, TA_MAX) + "px";
    el.style.overflowY = el.scrollHeight > TA_MAX ? "auto" : "hidden";
  }, [draft]);

  // attachments: simulate upload → parse → ready so it feels real
  const addFiles = (names) => {
    const incoming = names.map((n) => ({ id: Math.random().toString(36).slice(2), name: n, status: "uploading" }));
    setAtt((f) => [...f, ...incoming].slice(0, 6));
    incoming.forEach((it) => {
      setTimeout(() => setAtt((f) => f.map((x) => (x.id === it.id && x.status === "uploading" ? { ...x, status: "parsing" } : x))), 700);
      setTimeout(() => setAtt((f) => f.map((x) => (x.id === it.id ? { ...x, status: "ready" } : x))), 1700);
    });
  };
  const busyUpload = att.some((a) => a.status !== "ready");

  // Opening a round (clicking a result pill) must NOT move the chat — it only swaps the
  // right pane. Capture the scroll position and pin it across the re-render frames, so
  // the conversation stays exactly where the teacher was reading.
  const handleOpenRound = (id) => {
    const el = scrollRef.current;
    const keep = el ? el.scrollTop : 0;
    onOpenRound && onOpenRound(id);
    const pin = () => { if (scrollRef.current) scrollRef.current.scrollTop = keep; };
    requestAnimationFrame(pin);
    requestAnimationFrame(() => requestAnimationFrame(pin));
    setTimeout(pin, 80);
  };

  const send = (txt) => {
    const v = (txt ?? draft).trim();
    if (!v && att.length === 0) return;
    if (busyUpload) return; // wait until attachments finish parsing
    onSend(v, att.map((a) => a.name));
    setDraft("");
    setAtt([]);
  };

  // 追问 dedup — mock 建议不得与会话中已发送过的消息重复（按发送文本比对）
  const sentTexts = new Set(messages.filter((m) => m.role === "user" && typeof m.text === "string").map((m) => m.text.trim()));
  const sugs = (suggestions || [])
    .filter((s) => { const t = (typeof s === "string" ? s : (s.send_text || s.label)) || ""; return !sentTexts.has(t.trim()); })
    .slice(0, 3); // 最多 3 条
  const CW = 760; // readable column width when the stage is collapsed (content centers, chrome stays full-width)
  const colWrap = centered ? { maxWidth: CW, marginLeft: "auto", marginRight: "auto", width: "100%" } : null;
  return (
    <div style={{ width, flexShrink: 0, display: "flex", flexDirection: "column", background: "var(--surface)", borderRight: centered ? "none" : "1px solid var(--line)" }}>
      {header}
      <div ref={scrollRef} onScroll={recomputeBottom} style={{ flex: 1, overflowY: "auto", padding: "20px 14px" }}>
        <div style={{ ...colWrap, display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.map((m, i) => {
          const round = roundsById && m.roundId != null ? roundsById[m.roundId] : null;
          const prev = messages[i - 1];
          const grouped = m.role !== "user" && m.role !== "sys" && !!prev && prev.role !== "user" && prev.role !== "sys";
          return <Bubble key={i} m={m} round={round} active={round && round.id === shownId && !retrieving} onOpenRound={handleOpenRound} grouped={grouped} onOpenRef={onOpenRef} onViewFile={setViewFile} />;
        })}
        {/* 追问 chips — live IN the chat flow, hanging under the latest AI reply (PRD 追问推荐 §4.1).
            Round-scoped and short-lived: the workspace clears `suggestions` the moment the user
            sends anything, so at most one group exists and it never lingers in history.
            Only render when the thread actually ends on an AI turn — never under a user message. */}
        {sugs.length > 0 && !clarify && !retrieving && messages.length > 0 && messages[messages.length - 1].role !== "user" && (
          <div data-screen-label="追问推荐" style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingLeft: 4, marginTop: -9, marginBottom: 4 }}>
            {sugs.map((s, i) => {
              const label = typeof s === "string" ? s : s.label;
              const sendText = typeof s === "string" ? s : (s.send_text || s.label);
              return (
                <button
                  key={label}
                  onClick={() => send(sendText)}
                  title={sendText !== label ? sendText : undefined}
                  className="sug-pop"
                  style={{
                    animationDelay: `${i * 0.05}s`,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "4px 10px",
                    borderRadius: 999,
                    border: "1px dashed var(--brand-soft-border)",
                    background: "transparent",
                    color: "var(--brand-deep)",
                    fontSize: 11.5,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "var(--font-zh)",
                    transition: "background .15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--brand-soft)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <Icon name="spark" size={11} /> {label}
                </button>
              );
            })}
          </div>
        )}
        {pinnedCard}
        </div>
      </div>
      {clarify && (clarifyNode || <ClarifyPopover analysis={clarify.analysis} onResolve={onResolveClarify} onSkip={onSkipClarify} />)}
      {!clarify && taskBar}
      <div style={{ padding: "8px 14px 12px", position: "relative" }}>
        {/* scroll-to-bottom — appears when scrolled up; heartbeats while 小博士 is outputting */}
        {!atBottom && (
          <button onClick={scrollToBottom} title={aiBusy ? "小博士正在输出…" : "回到最新"} className={aiBusy ? "heartbeat" : ""} style={{ position: "absolute", top: -44, left: "50%", transform: "translateX(-50%)", width: 34, height: 34, borderRadius: "50%", border: "1px solid var(--line)", background: "var(--surface)", boxShadow: "0 8px 20px -8px rgba(20,30,50,.3)", color: "var(--brand-deep)", display: "grid", placeItems: "center", cursor: "pointer", zIndex: 6 }}>
            {aiBusy ? <span className="mini-spin" /> : <Icon name="chevron" size={18} />}
          </button>
        )}
        {/* homepage-style composer: attachments (top, inside box) → input area → button row */}
        {scenario && (
          <div style={colWrap || undefined}>
            <ScenePills scenario={scenario} onSwitch={onSwitch} disabled={!!clarify} />
          </div>
        )}
        <div
          onFocusCapture={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.boxShadow = "var(--ring), var(--input-shadow)"; }}
          onBlurCapture={(e) => { e.currentTarget.style.borderColor = "var(--input-border)"; e.currentTarget.style.boxShadow = "none"; }}
          style={{ ...colWrap, background: "var(--surface)", border: "1.5px solid var(--input-border)", borderRadius: 16, padding: "10px 12px 8px", transition: "border-color .2s, box-shadow .25s" }}
        >
          <FileChips files={att} onRemove={(i) => setAtt((f) => f.filter((_, j) => j !== i))} onView={(n) => setViewFile(n)} style={{ marginBottom: att.length ? 8 : 0 }} />
          <textarea
            ref={taRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder={clarify ? "选上方，或直接在这里描述你要找的资源…" : (placeholder || "继续告诉我你的调整…")}
            style={{ width: "100%", display: "block", border: "none", outline: "none", background: "transparent", resize: "none", fontSize: 13.5, fontFamily: "var(--font-zh)", color: "var(--ink)", lineHeight: 1.5, padding: "2px 2px", maxHeight: TA_MAX, overflowY: "hidden", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 6 }}>
            <ClipButton onFiles={addFiles} compact />
            <button
              onClick={() => send()}
              disabled={busyUpload}
              title={busyUpload ? "附件解析中…" : "发送"}
              style={{ width: 34, height: 34, borderRadius: 10, border: "none", background: busyUpload ? "var(--line)" : "var(--brand-grad)", backgroundColor: busyUpload ? "var(--line)" : "var(--brand)", color: busyUpload ? "var(--ink-3)" : "#fff", display: "grid", placeItems: "center", cursor: busyUpload ? "default" : "pointer", flexShrink: 0, transition: "background .2s" }}
            >
              <Icon name="send" size={16} />
            </button>
          </div>
        </div>
        <div style={{ ...colWrap, textAlign: "center", fontSize: 10.5, color: "var(--ink-4)", marginTop: 5, lineHeight: 1.2 }}>AI 内容仅供教研参考</div>
      </div>
      {viewFile && <FileViewer name={viewFile} onClose={() => setViewFile(null)} />}
    </div>
  );
}

// artifact chip — a frozen round/creation carried across scenarios; click to reopen it
function ArtifactChip({ a }) {
  const S = (window.AIDATA.SCENARIOS.find((s) => s.id === a.scenario)) || window.AIDATA.GENERAL;
  const hue = S.hue || 255;
  const iconKey = a.icon || S.icon;
  const accent = (window.ICON_ACCENT && window.ICON_ACCENT[iconKey]) || `oklch(0.6 0.15 ${hue})`;
  const tags = [a.stage, a.subject, a.edition, a.book].filter(Boolean);
  if (!tags.length && a.meta) a.meta.split(/\s*·\s*/).forEach((t) => t && tags.push(t));
  const aKey = a.scenario + ":" + (a._uid || a.id || a.title);
  const [active, setActive] = uS(window.__activeArtifactKey === aKey);
  uE(() => {
    const handler = (e) => setActive(e.detail === aKey);
    window.addEventListener("artifact-select", handler);
    return () => window.removeEventListener("artifact-select", handler);
  }, [aKey]);
  const activeBg = accent + "18";
  const activeBorder = accent + "66";
  const handleClick = () => {
    window.__activeArtifactKey = aKey;
    window.dispatchEvent(new CustomEvent("artifact-select", { detail: aKey }));
    window.openSessionArtifact && window.openSessionArtifact(a);
  };
  return (
    <button
      onClick={handleClick}
      title={"重新打开这轮结果"}
      style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, textAlign: "left", padding: "10px 12px", borderRadius: 12, border: active ? `1.5px solid ${activeBorder}` : "1px solid var(--line)", background: active ? activeBg : "var(--surface)", cursor: "pointer", fontFamily: "var(--font-zh)", transition: "border-color .15s, background .15s" }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = "var(--brand-soft-border)"; e.currentTarget.style.background = "oklch(0.97 0.01 260)"; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.background = "var(--surface)"; } }}
    >
      <ScenarioGlyph icon={iconKey} hue={hue} size={28} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
        <div style={{ display: "flex", gap: 5, marginTop: 3, flexWrap: "wrap" }}>
          {(tags.length ? tags : [S.name]).map((t, i) => (
            <span key={i} style={{ padding: "1px 7px", borderRadius: 6, background: active ? "rgba(255,255,255,.6)" : "var(--surface-2)", border: "1px solid " + (active ? activeBorder : "var(--line)"), fontSize: 10.5, fontWeight: 600, color: "var(--ink-3)", whiteSpace: "nowrap" }}>{t}</span>
          ))}
        </div>
      </div>
      {active ? <span style={{ color: accent, display: "inline-flex" }}><Icon name="check" size={16} sw={2.6} /></span> : <Icon name="chevronRight" size={15} />}
    </button>
  );
}

// ── Session 成果 (consolidated artifacts) ──────────────────────────────────
// Across a single conversation the assistant freezes finished outputs (matched
// resources, papers, lessons, courseware, mind-maps…). They scroll away in the
// thread, so the chat header carries a quick-access menu listing every one with
// its creation time — click to reopen that round in its workspace.
function sessionArtifacts(liveMsgs) {
  const times = window.ChatSession.artifactTimes || (window.ChatSession.artifactTimes = {});
  // Pull from BOTH the frozen global log (carries artifacts from every scenario the
  // teacher has been through this session) and the live current-workspace messages
  // (newest artifacts not yet flushed to the log). Dedupe by stable key.
  const sources = [].concat(window.ChatSession.take() || [], liveMsgs || []);
  const seen = new Set();
  const out = [];
  sources.forEach((m, i) => {
    if (m && m.artifact && m.artifact.scenario) {
      const a = m.artifact;
      const key = a.scenario + ":" + (a.id || a.title || i);
      if (seen.has(key)) return;
      seen.add(key);
      if (!times[key]) times[key] = Date.now();
      out.push({ ...a, _key: key, ts: times[key] });
    }
  });
  return out;
}

function ArtifactsPopover({ items, onClose }) {
  const fmt = (ts) => { const d = new Date(ts); const p = (n) => String(n).padStart(2, "0"); return `${p(d.getHours())}:${p(d.getMinutes())}`; };
  return (
    <div className="drawer-pop" style={{ position: "absolute", top: "calc(100% + 9px)", right: 0, width: 304, maxHeight: 392, overflowY: "auto", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 15, boxShadow: "var(--shadow-card)", zIndex: 320, padding: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px 9px" }}>
        <Icon name="artifacts" size={14} />
        <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--ink)" }}>本次对话的成果</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-3)", fontFamily: "var(--font-num)" }}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div style={{ padding: "16px 14px 22px", textAlign: "center", fontSize: 12, color: "var(--ink-3)", lineHeight: 1.75 }}>
          本次对话还没有固化的成果。<br />生成卷子、教案、课件等结果后，会自动出现在这里。
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {items.slice().reverse().map((a) => {
            const S = (window.AIDATA.SCENARIOS.find((s) => s.id === a.scenario)) || window.AIDATA.GENERAL;
            return (
              <button
                key={a._key}
                onClick={() => { onClose(); window.openSessionArtifact && window.openSessionArtifact(a); }}
                title={"重新打开：" + a.title}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left", padding: "8px 9px", borderRadius: 11, border: "1px solid transparent", background: "transparent", cursor: "pointer", fontFamily: "var(--font-zh)", transition: "background .14s, border-color .14s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.borderColor = "var(--line)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
              >
                <ScenarioGlyph icon={a.icon || S.icon} hue={S.hue} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
                  <div style={{ fontSize: 10.5, color: "var(--ink-3)", fontWeight: 600, marginTop: 2 }}>创建时间：{fmt(a.ts)}</div>
                </div>
                <Icon name="chevronRight" size={15} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// trigger button (+ count badge) that lives at the top-right of the chat column
function SessionArtifactsMenu({ messages }) {
  const items = sessionArtifacts(messages);
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);
  const count = items.length;
  if (count === 0) return null; // nothing frozen yet → no empty button cluttering the header
  return (
    <div ref={wrapRef} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        data-tip="本次对话的成果" data-tip-pos="bottom-right" aria-label="本次对话的成果"
        style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 30, padding: "0 8px", borderRadius: 8, border: "1px solid " + (open ? "var(--brand-soft-border)" : "var(--line)"), background: open ? "var(--brand-soft)" : "var(--surface)", color: open ? "var(--brand-deep)" : (count ? "var(--ink-2)" : "var(--ink-3)"), cursor: "pointer", fontFamily: "var(--font-zh)", transition: "background .14s, color .14s, border-color .14s" }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = "var(--surface-2)"; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = "var(--surface)"; }}
      >
        <Icon name="artifacts" size={16} />
        <span style={{ fontSize: 12, fontWeight: 800, fontFamily: "var(--font-num)", minWidth: 7, textAlign: "center" }}>{count}</span>
      </button>
      {open && <ArtifactsPopover items={items} onClose={() => setOpen(false)} />}
    </div>
  );
}
Object.assign(window, { SessionArtifactsMenu });

function Bubble({ m, round, active, onOpenRound, grouped, onOpenRef, onViewFile }) {
  // slim system marker — scenario switches etc. A divider, not a chat bubble.
  if (m.role === "sys") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "1px 0", justifyContent: "center" }}>
        <span style={{ width: 24, height: 1, background: "var(--line)", flexShrink: 0 }} />
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
          {m.icon && <Icon name={m.icon} size={13} />}
          {m.text}
          {m.back && (
            <button
              onClick={() => { window.ChatSession && (window.ChatSession.switchMeta = { source: "manual" }); window.__aidaSwitch && window.__aidaSwitch(m.back.id, ""); }}
              title={"切回" + m.back.name}
              style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 2, padding: "2px 9px", borderRadius: 999, border: "1px solid var(--brand-soft-border)", background: "var(--brand-soft)", color: "var(--brand-deep)", fontSize: 11.5, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-zh)" }}
            >
              切回{m.back.name}
            </button>
          )}
        </span>
        <span style={{ width: 24, height: 1, background: "var(--line)", flexShrink: 0 }} />
      </div>
    );
  }
  if (m.role === "user") {
    return (
      <div style={{ alignSelf: "flex-end", maxWidth: "85%", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
        {/* resource reference card — shown ABOVE the bubble when the question came from a resource detail */}
        {m.ref && (
          <button
            onClick={() => onOpenRef && m.refItem && onOpenRef(m.refItem)}
            title={m.refItem ? "查看这份资源" : ""}
            style={{ display: "flex", alignItems: "center", gap: 8, maxWidth: 260, padding: "7px 11px", borderRadius: 11, border: "1px solid var(--brand-soft-border)", background: "var(--brand-soft)", cursor: m.refItem ? "pointer" : "default", textAlign: "left", fontFamily: "var(--font-zh)" }}
          >
            <span style={{ width: 24, height: 24, borderRadius: 7, background: "var(--surface)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}><Icon name="quote" size={12} /></span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 11.5, fontWeight: 800, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 210 }}>{m.ref.title}</span>
              <span style={{ display: "block", fontSize: 10, color: "var(--brand-deep)", fontWeight: 700, marginTop: 1 }}>引用·{m.ref.type}{m.refItem ? " · 点此查看" : ""}</span>
            </span>
          </button>
        )}
        {m.files && m.files.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "flex-end" }}>
            {m.files.map((name, i) => (
              <span key={i} onClick={() => onViewFile && onViewFile(name)} title={onViewFile ? "点击查看" : undefined} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 8px", borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--line)", fontSize: 11.5, fontWeight: 600, color: "var(--ink-2)", maxWidth: 180, cursor: onViewFile ? "pointer" : "default" }}>
                <Icon name="file" size={12} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
              </span>
            ))}
          </div>
        )}
        {m.text && (
          <div style={{ background: "var(--brand-grad)", backgroundColor: "var(--brand)", color: "#fff", padding: "10px 13px", borderRadius: "14px 14px 4px 14px", fontSize: 13.5, lineHeight: 1.6, fontWeight: 500, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
            {m.text}
          </div>
        )}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", gap: 9, alignItems: "flex-start", maxWidth: "92%", width: m.wide ? "100%" : "auto", marginTop: grouped ? -8 : 0 }}>
      <div style={{ flex: m.wide ? 1 : "0 1 auto", minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {m.answered ? (
          /* resolved 追问 — a compact summary card inside the AI turn (question + chosen value) */
          <div style={{ border: "1px solid var(--line)", borderRadius: 13, background: "var(--surface)", padding: "11px 14px" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)", lineHeight: 1.45 }}>{m.answered.q}</div>
            <div style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 600, marginTop: 3, display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="check" size={13} sw={2.4} />{m.answered.value}</div>
          </div>
        ) : (
          <div style={{ background: "var(--surface-2)", border: "1px solid var(--line)", padding: "10px 13px", borderRadius: "4px 14px 14px 14px", fontSize: 13.5, lineHeight: 1.65, color: "var(--ink)" }}>
            {m.typing ? <Dots /> : m.render ? m.render() : (m.node || m.text)}
          </div>
        )}
        {/* per-round result pill — a sibling BELOW the bubble, not nested inside it */}
        {!m.typing && round && (
          <ResultPill count={round.count} active={active} onOpen={() => onOpenRound && onOpenRound(round.id)} />
        )}
        {/* cross-scenario artifact chip — reopens an earlier round/creation, even from another scenario */}
        {!m.typing && !round && m.artifact && (
          <ArtifactChip a={m.artifact} />
        )}
      </div>
    </div>
  );
}

// ---- 找资源 workspace ----
// 与标签树对齐：筛选维度 = 学段 / 学科 / 版本 / 类型[41] / 难度（业务流程§5.4）
const MORE_FILTERS = [
  { key: "stage", label: "学段", opts: ["小学", "初中", "高中", "中职"] },
  { key: "subject", label: "学科", opts: ["语文", "数学", "英语", "物理", "化学", "生物学", "历史", "地理", "道德与法治", "科学"] },
  { key: "edition", label: "版本", opts: ["人教版", "统编版", "北师大版", "苏教版", "外研版", "通用"] },
  { key: "type", label: "类型", opts: ["课件", "教案", "学案", "作业", "试卷", "题集", "素材", "示范课", "备课综合"] },
  { key: "diff", label: "难度", opts: ["基础", "中等", "拔高"] },
];

const HANDOFF = [
  { id: "paper", icon: "paper", label: "直接出一份卷子", hue: 25, hint: "从学科网题库智能组卷" },
  { id: "lesson", icon: "lesson", label: "生成配套教案", hue: 320, hint: "对齐课标的教学设计" },
  { id: "courseware", icon: "slides", label: "做成课件", hue: 255, hint: "结构清晰的 PPT / 互动课件" },
];

const RESULT_TABS = [
  { k: "all", label: "全部" },
  { k: "doc", label: "文档" },
  { k: "video", label: "视频" },
  { k: "album", label: "专辑" },
];
// 解析用别名表：含口语化写法，长名在前优先命中（生物学 > 生物、历史与社会 > 历史）
const SUBJ_LIST = ["语文", "数学", "英语", "物理", "化学", "生物学", "生物", "历史与社会", "历史", "地理", "道德与法治", "思想政治", "政治", "科学", "信息技术"];
const GRADE_LIST = ["七年级", "八年级", "九年级", "高一", "高二", "高三", "六年级", "五年级", "四年级", "三年级"];
function pickSubject(q) { return q ? SUBJ_LIST.find((s) => q.includes(s)) : null; }
function pickGrade(q) { return q ? GRADE_LIST.find((g) => q.includes(g)) : null; }
// does this message look like a resource-find request (vs. a vague follow-up / chit-chat)?
function isFindLike(q) {
  if (!q) return false;
  if (detectKind(q) !== "all") return true;
  return /找|搜|有没有|有无|资源|试卷|卷子|课件|教案|讲义|学案|练习|习题|真题|素材|课时|下载|来一?[份点个]|帮我找|推荐|有什么/.test(q);
}
// content-aware, self-consistent replies grounded in a resource/video's REAL fields
function replyForResource(q, item) {
  const isVideo = item && (item.kind === "video" || item.cat || item.chapters);
  const t = (item && item.title) || "这份资料";
  const tags = (item && item.tags) || [];
  const tagStr = tags.length ? tags.join("、") : "本节核心知识点";

  // album-level questions (专辑只回答合集级问题)
  if (item && (item.composition || item._kind === "album")) {
    const comp = (item.composition || []).map((c) => `${c.type}${c.n}`).join("、");
    if (/主题|涵盖|知识|范围|考点|重点/.test(q)) return <span>《{t}》是一套 <b>{item.total || ""} 份</b>的成套合集，含 {comp}，覆盖 <b style={{ color: "var(--brand-deep)" }}>{tagStr}</b> 等主题。可整套打包，也可只取其中的试卷或课件单独使用 —— 你想先看哪一类我都能帮你拆出来。</span>;
  }
  // 讲题（A 类，AI 从原卷挑典型题，不要求用户先指定哪道）
  if (/这道题|怎么讲|讲一下|讲题|讲解这|典型题|讲讲|挑几道/.test(q)) {
    return <span>好的，我从《{t}》里挑一道<b>典型题</b>来讲：先帮学生厘清 <b style={{ color: "var(--brand-deep)" }}>{tags[0] || "核心知识点"}</b> 的解题入口，再分步推导、标注易错点。你也可以指定第几题，我据原卷逐题讲解。</span>;
  }
  // 考点 / 教学重点 / 教学目标 / 学习目标 / 教学流程（A 类内容总结）
  if (/考点|教学重点|教学目标|学习目标|学习重点|要点|教学设计思路|教学流程|学习流程/.test(q)) {
    if (isVideo) return <span>《{t}》的核心要点：依次覆盖 {(item.chapters || []).slice(0, 3).map((c) => c.name).join("、") || tagStr}。我可整理成<b>逐条要点清单</b>，或据此<b style={{ color: "var(--brand-deep)" }}>配套出题</b>巩固。</span>;
    const lead = /流程/.test(q) ? "教学流程" : /设计思路/.test(q) ? "教学设计思路" : /学习目标|学习重点/.test(q) ? "学习目标与重点" : /目标/.test(q) ? "教学目标" : /考点/.test(q) ? "考点" : "教学重点";
    return <span>已通读《{t}》，为你梳理其<b>{lead}</b>：围绕 <b style={{ color: "var(--brand-deep)" }}>{tagStr}</b> 展开{item && item.qcount ? `，配 ${item.qcount} 道题逐层巩固` : ""}{item && item.pages ? `，共 ${item.pages} 页` : ""}。需要我整理成可直接用的清单，或据此<b>生成教案 / 出题</b>都行。</span>;
  }

  if (/出卷|出题|组卷|生成|做一份|出一份|出份/.test(q)) {
    if (isVideo) return <span>《{t}》是<b>{item.cat || "教学视频"}</b>，我可以按它讲解的知识点，<b style={{ color: "var(--brand-deep)" }}>配一套同步练习</b>。对我说「出卷子」即可带着这些知识点过去。</span>;
    return <span>没问题 —— 我可以基于《{t}》的知识点（{tagStr}）与<b>{item && item.diff ? item.diff : "中等"}</b>难度，<b style={{ color: "var(--brand-deep)" }}>直接组一份新卷子</b>。点下方「送去出卷子」，或对我说「出卷子」。</span>;
  }
  if (/适合|学情|班级|难不难|难度/.test(q)) {
    if (isVideo) return <span>《{t}》为 <b>{item.grade}{item.subject}</b>、{item.duration} {item.quality}，{item.chapters ? `分 ${item.chapters.length} 个章节、可按需跳转` : "时长适中"}，{item.cat === "实验视频" ? "适合课堂演示或课前预习" : "适合课堂讲解或研修"}。</span>;
    return <span>《{t}》为 <b>{item.grade}{item.subject} · {item.edition}</b>、难度<b>{item.diff || "中等"}</b>{item.qcount ? `、含 ${item.qcount} 题` : ""}，与你班级常用难度匹配度较高{item.match ? `（匹配度 ${item.match}%）` : ""}。需要更基础或更拔高的版本，我可再筛一批。</span>;
  }
  if (isVideo && /环节|哪个|什么时候|怎么用|课堂/.test(q)) {
    const chap = item.chapters && item.chapters[1];
    return <span>建议把《{t}》用在<b>新授或探究环节</b>：{item.chapters ? <span>例如「{chap.name}」一段（{chap.t} 起）很适合定格讲解。</span> : "可整段播放后组织讨论。"}已为 {item.grade}{item.subject} 学情做过校验。</span>;
  }
  if (isVideo) {
    const names = (item.chapters || []).slice(0, 3).map((c) => c.name).join("、");
    return <span>《{t}》是 <b>{item.cat}</b>（{item.duration}）：{item.chapters ? <span>依次讲解 {names} 等 {item.chapters.length} 个环节</span> : "完整呈现了该知识点"}，画质 {item.quality}，已播放 {item.plays}。需要我<b>提取讲解要点</b>或<b>配套出题</b>都可以。</span>;
  }
  return <span>我已通读《{t}》：<b>{item ? item.type : "资料"}</b>，{item && item.pages ? `共 ${item.pages} 页` : "篇幅适中"}{item && item.qcount ? `、含 ${item.qcount} 道题` : ""}，覆盖 {tagStr}，{item && item.reviewed ? "已通过学科网审校，" : ""}可直接用于课堂。需要我<b>提取讲解要点</b>或<b>据此出卷</b>都行。</span>;
}

function detectKind(q) {
  if (!q) return "all";
  if (/专辑|合集|套|打包|串讲|资源包|大单元|上好课/.test(q)) return "album";
  if (/视频|实验|研修|示范课|微课视频|讲解视频/.test(q)) return "video";
  return "all";
}

// ---- per-round result model ----------------------------------------------
// Every query produces a FROZEN result set ("round"). Each AI reply carries its
// round's id; clicking that reply's pill re-opens exactly those results. Rounds
// are never overwritten — "given to you, it's yours."

const SOURCE_STYLE = {
  "学科网": { label: "学科网", icon: "shield", c: "var(--auth-ink)", bg: "var(--auth-bg)", bd: "var(--auth-border)" },
  "我的内容": { label: "我的内容", icon: "grid", c: "oklch(0.47 0.13 300)", bg: "oklch(0.965 0.025 300)", bd: "oklch(0.88 0.05 300)" },
  "资源篮": { label: "资源篮", icon: "basket", c: "oklch(0.48 0.12 55)", bg: "oklch(0.965 0.04 75)", bd: "oklch(0.88 0.07 70)" },
};
function SourceTag({ source }) {
  const s = SOURCE_STYLE[source] || SOURCE_STYLE["学科网"];
  // low-key: a small dot + muted label, no colored pill (sources shouldn't dominate the card)
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.c, opacity: 0.75, flexShrink: 0 }} /> {s.label}
    </span>
  );
}

const KIND_LABEL = { all: "文档·视频·专辑", doc: "文档", video: "视频", album: "专辑" };

// build a frozen, source-tagged, mixed item list for one round
function buildRound(text, id, ctx, loggedIn, basketTitles) {
  const R = window.AIDATA.RESOURCES, V = window.AIDATA.VIDEOS, A = window.AIDATA.ALBUMS;
  const kind = detectKind(text);
  const subject = pickSubject(text) || ctx.subject;
  const grade = pickGrade(text) || ctx.grade;
  ctx.subject = subject; ctx.grade = grade; // remember for vague follow-ups
  const sjOK = (x) => !subject || x.subject === subject || x.subject === "通用";
  const grOK = (x) => !grade || !x.grade || x.grade === grade;
  let docs = R.filter((x) => sjOK(x) && grOK(x));
  if (!docs.length) docs = R.filter(sjOK);
  if (!docs.length) docs = R.slice();
  let vids = V.filter(sjOK); if (!vids.length) vids = V.slice();
  let albs = A.filter(sjOK); if (!albs.length) albs = A.slice();
  const tag = (arr, k) => arr.map((x) => ({ ...x, _kind: k }));
  let items;
  if (kind === "video") items = [...tag(vids, "video"), ...tag(albs.slice(0, 1), "album"), ...tag(docs.slice(0, 3), "doc")];
  else if (kind === "album") items = [...tag(albs, "album"), ...tag(docs.slice(0, 5), "doc"), ...tag(vids.slice(0, 2), "video")];
  else items = [...tag(albs.slice(0, 2), "album"), ...tag(docs.slice(0, 8), "doc"), ...tag(vids.slice(0, 3), "video")];
  items = items.slice(0, 14).map((x) => ({ ...x, _source: "学科网" }));
  const bt = basketTitles || [];
  items = items.map((it) => (bt.some((t) => t && (it.title.includes(t) || t.includes(it.title))) ? { ...it, _source: "资源篮" } : it));
  if (loggedIn) {
    const di = items.findIndex((x) => x._kind === "doc" && x._source === "学科网");
    if (di >= 0) items[di] = { ...items[di], _source: "我的内容" };
  }
  if (bt.length && !items.some((x) => x._source === "资源篮")) {
    const di = items.findIndex((x) => x._source === "学科网");
    if (di >= 0) items[di] = { ...items[di], _source: "资源篮" };
  }
  const rank = { "我的内容": 0, "资源篮": 1, "学科网": 2 };
  items.sort((a, b) => rank[a._source] - rank[b._source]);
  return { id, query: text, items, count: items.length, kind, subject, grade };
}

function roundReplyNode(round) {
  const ctxBits = [round.grade, round.subject].filter(Boolean).join("");
  const cnt = (s) => round.items.filter((x) => x._source === s).length;
  const mine = cnt("我的内容"), bag = cnt("资源篮");
  const extra = [];
  if (mine) extra.push(`${mine} 项来自你的内容`);
  if (bag) extra.push(`${bag} 项来自资源篮收藏`);
  return (
    <span>
      已按你的需求{ctxBits ? <span>（理解为 <b style={{ color: "var(--brand-deep)" }}>{ctxBits}</b>）</span> : null}，从<b style={{ color: "var(--auth-ink)" }}>学科网资源库</b>检索整理出 <b>{round.count}</b> 项{extra.length ? <span>，其中 {extra.join("、")}</span> : null}。点下方查看，合适就收藏或下载，不合适我也能直接生成。
    </span>
  );
}

const ROUND_SUGS = {
  video: ["只看实验视频", "教师研修视频", "下载这个视频", "据此配套出题"],
  album: ["展开专辑内容", "整套打包下载", "只要试卷部分", "换个复习专辑"],
  all: ["只看视频", "有没有成套专辑", "只要含答案的文档", "难度再高一点"],
};

// follow-up chips above the input — grounded in THIS round's真实理解（学科 / 章节 / 形态），
// 而不是一组写死的通用词。
function roundSuggestions(round) {
  if (!round) return [];
  const subj = round.subject || "";
  const topic = ((round.query || "").match(/《(.+?)》/) || [])[1] || "";
  if (round.kind === "video") return ["只看实验视频", "教师研修视频", topic ? `${topic}讲解视频` : "换个知识点的视频", "据此配套出题"];
  if (round.kind === "album") return ["展开专辑内容", "整套打包下载", "只要其中的试卷", "换个复习专辑"];
  // 文档 / 混合轨
  const s = ["只要含答案解析", "难度再高一点"];
  s.push(topic ? `${topic}易错题专项` : (subj ? `${subj}其它章节` : "换个章节"));
  s.push("有没有配套微课");
  return s;
}

// result pill — sits BELOW the reply bubble (not nested inside it), width follows the bubble column
function ResultPill({ count, active, onOpen }) {
  return (
    <button onClick={onOpen} style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, textAlign: "left", padding: "9px 11px", borderRadius: 11, border: `1px solid ${active ? "var(--brand)" : "var(--brand-soft-border)"}`, background: active ? "var(--brand-soft)" : "var(--surface)", cursor: "pointer", fontFamily: "var(--font-zh)" }}>
      <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}><CIcon name="search" size={15} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--brand-deep)" }}>已为你匹配 {count} 个资源</div>
        <div style={{ fontSize: 10.5, color: "var(--ink-3)", fontWeight: 600, marginTop: 1 }}>{active ? "当前正在查看" : "点此查看本轮结果"}</div>
      </div>
      <Icon name={active ? "check" : "chevronRight"} size={15} />
    </button>
  );
}

// right-pane skeleton shown WHILE retrieving (so results never appear before the reply)
function RetrievingPanel() {
  const mobile = useIsMobile();
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: mobile ? "12px 16px" : "14px 22px", borderBottom: "1px solid var(--line)", background: "var(--surface)", display: "flex", alignItems: "center", gap: 10 }}>
        <Dots /> <span style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 600 }}>正在从 <b style={{ color: "var(--auth-ink)" }}>学科网资源库</b> 检索匹配…</span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: mobile ? "14px 16px" : "16px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-row" style={{ height: 76, borderRadius: 14, background: "var(--surface-2)", border: "1px solid var(--line)", animationDelay: `${i * 0.12}s` }} />
        ))}
      </div>
    </div>
  );
}

// ---- resource-detail question list (资源详情页「问小博士」) ------------------
// Per《资源详情页-问题列表交互设计》：题组按资源类别生成，纯前端，2 固定 + 1~2 动态，
// 上限 4。固定的「适合我的班级」依赖记忆系统，未登录（记忆未就绪）时隐藏。
function resourceCategory(item) {
  if (!item) return "paper";
  if (item._kind === "video" || item.kind === "video" || item.cat || item.chapters) return "video";
  if (item._kind === "album" || item.composition) return "album";
  const t = (item.type || "") + "";
  if (/课件|PPT|幻灯/.test(t)) return "courseware";
  if (/学案|导学案|学习任务单|知识清单|实验报告单/.test(t)) return "studyguide";
  if (/教案|讲义|教学设计|学历案|作业设计|说课/.test(t)) return "lesson";
  if (/同步练|单元卷|作业|假期|寒假|暑假/.test(t)) return "homework";
  if (/微课/.test(t)) return "video";
  if (/素材|图片|图集|音频|动画/.test(t)) return "material";
  if (/备课|综合/.test(t)) return "comprehensive";
  return "paper"; // 试卷 / 题集（试题汇编·专项训练·综合训练）/ 真题…
}

// short category label shown on the chat reference card
function refLabel(item) {
  if (!item) return "资料";
  if (item.composition || item._kind === "album") return "专辑合集 · " + (item.total || (item.composition || []).reduce((s, c) => s + c.n, 0)) + " 份";
  return item.type || item.cat || "资料";
}

// build the ordered question list for one resource (cls: A 内容RAG / B 画像对比 / C 生成handoff)
function buildResourceAsks(item, loggedIn) {
  const cat = resourceCategory(item);
  const summary = {
    paper: "总结这份资料的考点", homework: "总结这份作业的考点",
    courseware: "总结这份课件的教学重点", lesson: "总结这份教案的教学重点",
    studyguide: "总结这份学案的教学重点", comprehensive: "总结这份资料的教学重点",
    video: "总结这个视频的要点", album: "总结这个合集的主题范围", material: null,
  }[cat];
  const dynamic = {
    paper: [{ text: "挑几道典型题讲讲", cls: "A" }, { text: "据此出一份同类卷子", cls: "C", to: "paper" }],
    homework: [{ text: "挑几道典型题讲讲", cls: "A" }, { text: "据此出一份同类练习", cls: "C", to: "paper" }],
    courseware: [{ text: "提取这份课件的教学目标", cls: "A" }, { text: "据此生成一份教案", cls: "C", to: "lesson" }],
    lesson: [{ text: "整理一下这份教案的教学流程", cls: "A" }],
    studyguide: [{ text: "提取学生学习目标和重点", cls: "A" }],
    comprehensive: [{ text: "提取这份资料的教学设计思路", cls: "A" }],
    video: [{ text: "这个视频适合课堂哪个环节", cls: "A" }],
    album: [{ text: "这个合集涵盖哪些知识主题", cls: "A" }],
    material: [],
  }[cat] || [];
  const list = [];
  if (summary) list.push({ text: summary, cls: "A" });
  if (loggedIn) list.push({ text: cat === "album" ? "这个合集适合我的班级吗？" : "这份适合我的班级吗？", cls: "B" });
  list.push(...dynamic);
  return list.slice(0, 4);
}

// shared 问小博士 bar at the bottom of every resource-detail surface (preview / player / album)
function AskBar({ item, loggedIn, onAsk }) {
  if (!onAsk) return null;
  const asks = buildResourceAsks(item, loggedIn);
  if (!asks.length) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: "1px solid var(--line)", background: "var(--brand-soft)" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "var(--brand-deep)", flexShrink: 0 }}>
        <Icon name="spark" size={14} /> 问小博士
      </span>
      <div style={{ flex: 1, minWidth: 0, display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2, scrollbarWidth: "none" }}>
        {asks.map((q, i) => (
          <button key={i} onClick={() => onAsk(q, item)} style={{ whiteSpace: "nowrap", flexShrink: 0, padding: "6px 12px", borderRadius: 999, border: "1px solid var(--brand-soft-border)", background: "var(--surface)", color: "var(--brand-deep)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", display: "inline-flex", alignItems: "center", gap: 5 }}>
            {q.text}{q.cls === "C" && <Icon name="sparkArrow" size={13} />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- 追问 / 澄清弹框（找资源「信息补全」引擎）---------------------------------
// 核心：根据用户意图识别已知字段，只追问「缺失的最小必要信息」。需要补的字段随
// 资源类型而变：课件/教案/学案 → 年级·学期·主题；试卷/作业 → 场景。
// 例：「沁园春雪」→ 已识别 初中·语文·九年级·上册·《沁园春雪》，只差「资料类型」。
const CLARIFY_STAGES = ["小学", "初中", "高中"];
const CLARIFY_SUBJECTS_BY_STAGE = {
  小学: ["语文", "数学", "英语", "科学", "道德与法治"],
  初中: ["语文", "数学", "英语", "物理", "化学", "生物学", "历史", "地理", "道德与法治"],
  高中: ["语文", "数学", "英语", "物理", "化学", "生物学", "历史", "地理", "思想政治"],
};
const CLARIFY_GRADES_BY_STAGE = {
  小学: ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"],
  初中: ["七年级", "八年级", "九年级"],
  高中: ["高一", "高二", "高三"],
};
// 资料类型（标签树[41]一级，对齐用户口径的 5 类）→ 决定其下需补字段
const FIND_TYPES = ["课件", "试卷", "教案", "学案", "作业"];
const PREP_TYPES = ["课件", "教案", "学案"];   // 备课类 → 年级·学期·主题
const ASSESS_TYPES = ["试卷", "作业"];          // 测练类 → 场景
const FIND_SEMESTERS = ["上册", "下册"];
// 场景（标签树[42]应用场景的常用取值）
const FIND_SCENES = ["开学", "周测", "阶段检测", "期中", "期末", "一模", "二模", "三模", "模拟预测", "真题"];
const FIELD_LABEL = { stage: "学段", subject: "学科", type: "资料类型", grade: "年级", semester: "学期", topic: "主题", scene: "场景" };
const ANY = "__any__"; // 「不限」哨兵值：算已选、但不进入检索条件

// —— 字段解析器（从一句话里抽取结构化条件）——
function stageOfGrade(g) {
  if (!g) return null;
  if (/[一二三四五六]年级/.test(g)) return "小学";
  if (/[七八九]年级/.test(g)) return "初中";
  if (/高[一二三]/.test(g)) return "高中";
  return null;
}
function pickStage(q) {
  if (!q) return null;
  if (/高中|高一(?![点些])|高二|高三/.test(q)) return "高中";
  if (/初中|初一|初二|初三|七年级|八年级|九年级/.test(q)) return "初中";
  if (/小学|一年级|二年级|三年级|四年级|五年级|六年级/.test(q)) return "小学";
  return null;
}
function pickGradeF(q) {
  if (!q) return null;
  const map = [["七年级", /七年级|初一/], ["八年级", /八年级|初二/], ["九年级", /九年级|初三/], ["高一", /高一(?![点些])/], ["高二", /高二/], ["高三", /高三/], ["六年级", /六年级/], ["五年级", /五年级/], ["四年级", /四年级/], ["三年级", /三年级/], ["二年级", /二年级/], ["一年级", /一年级/]];
  const hit = map.find(([, re]) => re.test(q));
  return hit ? hit[0] : null;
}
function pickSemester(q) {
  if (!q) return null;
  if (/上册|上学期/.test(q)) return "上册";
  if (/下册|下学期/.test(q)) return "下册";
  return null;
}
function pickType(q) {
  if (!q) return null;
  if (/学案|导学案|学习任务单|知识清单|实验报告单/.test(q)) return "学案";
  if (/教案|教学设计|讲义|学历案|说课|作业设计/.test(q)) return "教案";
  if (/课件|幻灯|PPT|ppt/.test(q)) return "课件";
  if (/同步练|单元卷|专项训练|综合训练|试题汇编|题集|练习|习题|作业/.test(q)) return "作业";
  if (/试卷|卷子|月考卷|期中卷|期末卷|模拟卷/.test(q)) return "试卷";
  return null;
}
function pickScene(q) {
  if (!q) return null;
  return FIND_SCENES.find((s) => q.includes(s)) || (/月考/.test(q) ? "阶段检测" : (/中考|高考|学业考试/.test(q) ? "真题" : null));
}

// —— 主题知识库：常见课文 / 知识点 → 可推断的 学段·学科·年级·学期·主题 ——
// 让「沁园春雪」这类输入无需用户明说就能识别到大部分字段，只剩最小缺口。
const TOPIC_KB = [
  { kw: ["沁园春雪", "沁园春·雪", "沁园春 雪"], stage: "初中", subject: "语文", grade: "九年级", semester: "上册", topic: "沁园春·雪" },
  { kw: ["背影"], stage: "初中", subject: "语文", grade: "八年级", semester: "上册", topic: "背影" },
  { kw: ["故乡"], stage: "初中", subject: "语文", grade: "九年级", semester: "上册", topic: "故乡" },
  { kw: ["腊八粥"], stage: "小学", subject: "语文", grade: "六年级", semester: "下册", topic: "腊八粥" },
  { kw: ["草原"], stage: "小学", subject: "语文", grade: "六年级", semester: "上册", topic: "草原" },
  { kw: ["荷塘月色"], stage: "高中", subject: "语文", grade: "高一", semester: "上册", topic: "荷塘月色" },
  { kw: ["有理数"], stage: "初中", subject: "数学", grade: "七年级", semester: "上册", topic: "有理数" },
  { kw: ["整式的加减", "整式"], stage: "初中", subject: "数学", grade: "七年级", semester: "上册", topic: "整式的加减" },
  { kw: ["一元一次方程"], stage: "初中", subject: "数学", grade: "七年级", semester: "上册", topic: "一元一次方程" },
  { kw: ["勾股定理"], stage: "初中", subject: "数学", grade: "八年级", semester: "下册", topic: "勾股定理" },
  { kw: ["平行四边形"], stage: "初中", subject: "数学", grade: "八年级", semester: "下册", topic: "平行四边形" },
  { kw: ["二次函数"], stage: "初中", subject: "数学", grade: "九年级", semester: "上册", topic: "二次函数" },
  { kw: ["函数的概念", "函数概念"], stage: "高中", subject: "数学", grade: "高一", semester: "上册", topic: "函数的概念" },
  { kw: ["凸透镜成像", "凸透镜"], stage: "初中", subject: "物理", grade: "八年级", semester: "上册", topic: "凸透镜成像规律" },
  { kw: ["欧姆定律"], stage: "初中", subject: "物理", grade: "九年级", semester: "上册", topic: "欧姆定律" },
  { kw: ["牛顿第一定律", "惯性"], stage: "初中", subject: "物理", grade: "八年级", semester: "下册", topic: "牛顿第一定律" },
  { kw: ["氧气的实验室制取", "氧气的制取", "制取氧气"], stage: "初中", subject: "化学", grade: "九年级", semester: "上册", topic: "氧气的实验室制取" },
  { kw: ["燃烧与灭火", "燃烧的条件"], stage: "初中", subject: "化学", grade: "九年级", semester: "上册", topic: "燃烧与灭火" },
  { kw: ["光合作用"], stage: "初中", subject: "生物学", grade: "七年级", semester: "上册", topic: "光合作用" },
  { kw: ["鸦片战争"], stage: "初中", subject: "历史", grade: "八年级", semester: "上册", topic: "鸦片战争" },
  { kw: ["热力环流"], stage: "高中", subject: "地理", grade: "高一", semester: "上册", topic: "热力环流" },
];

// 把一句话解析成完整画像 v + 各字段来源 src（kb 推断 / text 明示 / ctx 累积）
function analyzeFind(q, ctx) {
  const v = { stage: null, subject: null, type: null, grade: null, semester: null, topic: null, scene: null };
  const src = {};
  const kb = q ? TOPIC_KB.find((e) => e.kw.some((k) => q.includes(k))) : null;
  if (kb) ["stage", "subject", "grade", "semester", "topic"].forEach((k) => { if (kb[k]) { v[k] = kb[k]; src[k] = "kb"; } });
  const tEx = q && (q.match(/《(.+?)》/) || [])[1];
  if (tEx) { v.topic = tEx.replace(/\s/g, ""); src.topic = "text"; }
  const ex = { stage: pickStage(q), subject: pickSubject(q), type: pickType(q), grade: pickGradeF(q), semester: pickSemester(q), scene: pickScene(q) };
  Object.keys(ex).forEach((k) => { if (ex[k]) { v[k] = ex[k]; src[k] = "text"; } });
  if (!v.stage && v.grade) { v.stage = stageOfGrade(v.grade); if (v.stage) src.stage = "text"; }
  if (ctx) {
    if (!v.subject && ctx.subjectConfirmed && ctx.subject) { v.subject = ctx.subject; src.subject = "ctx"; }
    if (!v.grade && ctx.grade) { v.grade = ctx.grade; src.grade = "ctx"; }
    if (!v.stage && ctx.stage) { v.stage = ctx.stage; src.stage = "ctx"; }
    if (!v.stage && v.grade) { v.stage = stageOfGrade(v.grade); if (v.stage) src.stage = "ctx"; }
  }
  return { v, src };
}

// 资料类型决定「最小必要信息」需要哪些字段（学期作为软性项，不强制）
function requiredKeys(type) {
  const base = ["stage", "subject", "type"];
  if (PREP_TYPES.includes(type)) return [...base, "grade", "topic"]; // 备课类：年级 + 主题
  if (ASSESS_TYPES.includes(type)) return [...base, "scene"];        // 测练类：场景
  return base; // 类型未定，先把类型问出来
}
// 当前画像下，还缺哪些「最小必要信息」（顺序即追问顺序）
function findGaps(v) {
  return requiredKeys(v.type).filter((k) => v[k] == null);
}

// 把补全后的画像拼成一条检索 query（驱动下游 buildRound 的解析）
function valsToQuery(v) {
  const real = (x) => (x && x !== ANY) ? x : null;
  return [real(v.grade) || real(v.stage), real(v.subject), real(v.semester), real(v.type), real(v.scene), real(v.topic) ? `《${real(v.topic)}》` : null].filter(Boolean).join(" ");
}

// 触发追问前，小博士先回一句「随缺口程度而变」的铺垫话
function clarifyIntro(v, gaps, rawText) {
  const ctxStr = [v.stage, v.subject, v.grade, v.semester].filter(Boolean).join("·");
  const gapStr = gaps.map((k) => FIELD_LABEL[k]).join("、");
  const onlyType = gaps.length === 1 && gaps[0] === "type";
  if (onlyType && v.topic) {
    return <span>已经识别到你要找的是 <b style={{ color: "var(--brand-deep)" }}>《{v.topic}》</b>{ctxStr ? <span>（{ctxStr}）</span> : null} —— 只差一步：你想要哪<b>一类资料</b>？课件、教案还是试卷？下面选一下就好。</span>;
  }
  if (ctxStr || v.type) {
    return <span>好的{v.type ? <span>，帮你找<b>{v.type}</b></span> : null}{ctxStr ? <span>（已识别 <b style={{ color: "var(--brand-deep)" }}>{ctxStr}</b>）</span> : null} —— 再补一下 <b style={{ color: "var(--brand-deep)" }}>{gapStr}</b>，我就能精准检索。</span>;
  }
  const wantWord = (rawText.match(/试卷|卷子|课件|教案|讲义|学案|练习|习题|真题|作业|资源/) || ["资源"])[0];
  return <span>好的，帮你找{wantWord} —— 先确认 <b style={{ color: "var(--brand-deep)" }}>{gapStr}</b>，免得给你一堆不相关的。下面选一下，也可以直接打字告诉我。</span>;
}
// 动态「信息补全」卡：已识别字段折叠成一行，下方只渲染缺失的最小必要字段；
// 选了资料类型后，按类型展开它特有的字段（备课类→年级/学期/主题；测练类→场景）。
function ClarifyPopover({ analysis, onResolve, onSkip }) {
  const init = (analysis && analysis.v) || { stage: null, subject: null, type: null, grade: null, semester: null, topic: null, scene: null };
  const [vals, setVals] = uS(init);
  const [edit, setEdit] = uS({}); // 已识别字段被点「改」→ 重新展开为可选
  const valsRef = uR(vals); valsRef.current = vals;
  const real = (x) => (x && x !== ANY) ? x : null;
  const set = (k, val) => setVals((s) => ({ ...s, [k]: val }));
  const openEdit = (k) => setEdit((e) => ({ ...e, [k]: true }));
  // 字段是否处于「待选」态：初始就缺，或被点击重新编辑
  const open = (k) => (init[k] == null) || !!edit[k];

  const isPrep = PREP_TYPES.includes(vals.type);
  const isAssess = ASSESS_TYPES.includes(vals.type);
  const filled = (k) => vals[k] != null; // ANY（不限）也算已选
  const ready = requiredKeys(vals.type).every(filled);

  uE(() => {
    const onKey = (e) => {
      const typing = /^(input|textarea)$/i.test((e.target && e.target.tagName) || "");
      if (e.key === "Escape") { onSkip && onSkip(); return; }
      if (typing) return;
      if (e.key === "Enter" && requiredKeys(valsRef.current.type).every((k) => valsRef.current[k] != null)) { e.preventDefault(); onResolve(valsRef.current); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [vals.type]);

  const lbl = { fontSize: 11, fontWeight: 800, color: "var(--ink-3)", marginBottom: 8, letterSpacing: ".3px", display: "flex", alignItems: "center", gap: 6 };
  const wrap = { display: "flex", flexWrap: "wrap", gap: 7 };
  const chip = (active) => ({ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, border: `1px solid ${active ? "var(--brand)" : "var(--line)"}`, background: active ? "var(--brand-soft)" : "var(--surface)", color: active ? "var(--brand-deep)" : "var(--ink-2)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", transition: "all .12s" });

  // 已识别（锁定）字段 → 顶部一行小标签，可点「改」
  const lockedKeys = ["stage", "subject", "grade", "semester", "type", "topic", "scene"].filter((k) => !open(k) && vals[k] != null);
  const lockLabel = (k) => k === "topic" ? (real(vals.topic) ? `《${vals.topic}》` : "不限主题") : (vals[k] === ANY ? (k === "scene" ? "不限场景" : "不限") : vals[k]);

  const chooser = (k) => {
    if (k === "stage") return <div style={wrap}>{CLARIFY_STAGES.map((s) => <button key={s} style={chip(vals.stage === s)} onClick={() => { setVals((v) => ({ ...v, stage: s, subject: v.subject && !CLARIFY_SUBJECTS_BY_STAGE[s].includes(v.subject) ? null : v.subject, grade: v.grade && !CLARIFY_GRADES_BY_STAGE[s].includes(v.grade) ? null : v.grade })); }}>{s}</button>)}</div>;
    if (k === "subject") return vals.stage ? <div style={wrap}>{CLARIFY_SUBJECTS_BY_STAGE[vals.stage].map((s) => <button key={s} style={chip(vals.subject === s)} onClick={() => set("subject", s)}>{s}</button>)}</div> : <div style={{ fontSize: 12, color: "var(--ink-4)", fontWeight: 600 }}>请先选择学段</div>;
    if (k === "type") return <div style={wrap}>{FIND_TYPES.map((s) => <button key={s} style={chip(vals.type === s)} onClick={() => set("type", s)}>{s}</button>)}</div>;
    if (k === "grade") return vals.stage ? <div style={wrap}>{CLARIFY_GRADES_BY_STAGE[vals.stage].map((s) => <button key={s} style={chip(vals.grade === s)} onClick={() => set("grade", s)}>{s}</button>)}</div> : <div style={{ fontSize: 12, color: "var(--ink-4)", fontWeight: 600 }}>请先选择学段</div>;
    if (k === "semester") return <div style={wrap}>{FIND_SEMESTERS.map((s) => <button key={s} style={chip(vals.semester === s)} onClick={() => set("semester", s)}>{s}</button>)}<button style={chip(vals.semester === ANY)} onClick={() => set("semester", ANY)}>不限</button></div>;
    if (k === "scene") return <div style={wrap}>{FIND_SCENES.map((s) => <button key={s} style={chip(vals.scene === s)} onClick={() => set("scene", s)}>{s}</button>)}<button style={chip(vals.scene === ANY)} onClick={() => set("scene", ANY)}>不限场景</button></div>;
    if (k === "topic") return (
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
        <input value={real(vals.topic) || ""} onChange={(e) => set("topic", e.target.value ? e.target.value : null)} placeholder="输入知识点或章节，如 有理数 / 第一单元" style={{ flex: 1, minWidth: 190, padding: "7px 11px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 12.5, fontFamily: "var(--font-zh)", outline: "none", color: "var(--ink)", background: "var(--surface)" }} />
        <button style={chip(vals.topic === ANY)} onClick={() => set("topic", ANY)}>暂不指定</button>
      </div>
    );
    return null;
  };

  // 待选字段，按依赖顺序；类型未定时不展开其下字段
  const order = ["stage", "subject", "type"];
  if (vals.type && isPrep) order.push("grade", "semester", "topic");
  if (vals.type && isAssess) order.push("scene");
  const bodyFields = order.filter((k) => open(k));
  const optional = (k) => k === "semester" || k === "topic" || k === "scene";
  const onlyFew = bodyFields.filter((k) => k !== "semester").length <= 1;
  const summary = ["stage", "subject", "grade", "semester", "type", "scene"].map((k) => real(vals[k])).filter(Boolean).concat(real(vals.topic) ? [`《${vals.topic}》`] : []).join(" · ");

  return (
    <div className="clarify-pop" style={{ margin: "0 14px 10px", borderRadius: 16, border: "1px solid var(--line)", background: "var(--surface)", boxShadow: "0 16px 40px -16px rgba(20,30,50,0.28), 0 2px 8px -4px rgba(20,30,50,0.12)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "13px 14px 10px" }}>
        <span style={{ width: 26, height: 26, borderRadius: 8, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0, marginTop: 1 }}><Icon name="spark" size={14} /></span>
        <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: "var(--ink)", lineHeight: 1.5 }}>{onlyFew ? <span>只差一步 —— 补齐后我就能为你精准检索</span> : <span>帮你补齐<b style={{ color: "var(--brand-deep)" }}>最小必要信息</b>，筛得更准</span>}</div>
        <button onClick={() => onSkip && onSkip()} title="跳过（Esc）" style={{ width: 24, height: 24, borderRadius: 7, border: "none", background: "transparent", color: "var(--ink-4)", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="close" size={15} /></button>
      </div>

      {lockedKeys.length > 0 && (
        <div style={{ padding: "0 14px 11px" }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: "var(--ink-4)", marginBottom: 7, letterSpacing: ".3px", display: "flex", alignItems: "center", gap: 5 }}><Icon name="check" size={12} sw={2.6} /> 已为你识别</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {lockedKeys.map((k) => (
              <button key={k} onClick={() => openEdit(k)} title={`修改${FIELD_LABEL[k]}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 9px 5px 10px", borderRadius: 999, border: "1px solid var(--brand-soft-border)", background: "var(--brand-soft)", color: "var(--brand-deep)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>
                <span style={{ fontSize: 9.5, fontWeight: 800, color: "var(--ink-4)" }}>{FIELD_LABEL[k]}</span>{lockLabel(k)}<span style={{ fontSize: 10, fontWeight: 700, color: "var(--ink-4)", borderLeft: "1px solid var(--brand-soft-border)", paddingLeft: 6 }}>改</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: "2px 14px 12px", display: "flex", flexDirection: "column", gap: 13 }}>
        {bodyFields.map((k) => (
          <div key={k}>
            <div style={lbl}>{FIELD_LABEL[k]}{optional(k) ? <span style={{ fontWeight: 600, color: "var(--ink-4)" }}>（可不限）</span> : <span style={{ fontWeight: 700, color: "var(--brand-deep)" }}>必选</span>}</div>
            {chooser(k)}
          </div>
        ))}
        {!vals.type && <div style={{ fontSize: 11.5, color: "var(--ink-4)", fontWeight: 600, marginTop: -4 }}>选好资料类型后，我会按类型继续补齐它需要的字段。</div>}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 14px", borderTop: "1px solid var(--line-2)", background: "var(--surface-2)" }}>
        <button onClick={() => onSkip && onSkip()} style={{ border: "none", background: "transparent", color: "var(--ink-3)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)" }}>请补齐必选项</button>
        <button
          disabled={!ready}
          onClick={() => onResolve(vals)}
          style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: ready ? "var(--brand)" : "var(--line)", color: ready ? "#fff" : "var(--ink-4)", fontSize: 13, fontWeight: 700, cursor: ready ? "pointer" : "default", fontFamily: "var(--font-zh)", display: "inline-flex", alignItems: "center", gap: 6, maxWidth: 320 }}
        >
          <CIcon name="search" size={14} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>确认</span>
        </button>
      </div>
    </div>
  );
}

function FindWorkspace({ scenario, query, onHome, onSwitch, fromIntent, resume, loggedIn, nav, onAddBasket, onOpenBasket, onOpenContent, basketCount = 0, basketItems }) {
  const ALL = window.AIDATA.RESOURCES;
  const isResume = !!resume;
  const initKind = detectKind(query);
  const topicMatch = query && (query.match(/《(.+?)》/) || [])[1];
  const initSubject = pickSubject(query) || ((loggedIn && initKind === "all") ? "数学" : null);
  const initGrade = pickGrade(query) || ((loggedIn && initKind === "all") ? "七年级" : null);

  const [preview, setPreview] = uS(null);
  const [player, setPlayer] = uS(null);
  const [album, setAlbum] = uS(null);
  const [toast, setToast] = uS(null);
  const [clarify, setClarify] = uS(null); // {forText} when the slide-up 追问 popover is open
  const mobile = useIsMobile();

  // accumulated understanding (subject/grade) so vague follow-ups still resolve.
  // subjectConfirmed = 学科已由记忆画像 / 用户输入 / 追问确认（非软默认）；决定是否还需追问。
  const ctxRef = uR({ subject: initSubject, grade: initGrade, subjectConfirmed: !!pickSubject(query) || !!(loggedIn && initSubject) });
  const skippedRef = uR(false); // 跳过补全后，同一会话内不再追问（除非用户带了新的明确信息）
  const findStored = window.ChatSession.scratch.find || {};
  const idRef = uR(findStored.nextId || 0);
  const sheetSeqRef = uR(0);
  const basketTitles = (basketItems || []).map((b) => b.title).filter(Boolean);
  // a clicked artifact chip reopens that round, even when arriving from another scenario
  const pendingA = window.ChatSession.pendingArtifact && window.ChatSession.pendingArtifact.scenario === "find" ? window.ChatSession.pendingArtifact : null;
  if (pendingA) window.ChatSession.pendingArtifact = null;

  // every query → a FROZEN round; rounds are appended, never overwritten —
  // and they SURVIVE scenario switches via the session scratch store
  const [rounds, setRounds] = uS(() => {
    const prev = findStored.rounds || [];
    if (isResume) return [...prev, buildRound(resume.title || query || "", idRef.current++, ctxRef.current, loggedIn, basketTitles)];
    if (query && !fromIntent) return [...prev, buildRound(query, idRef.current++, ctxRef.current, loggedIn, basketTitles)];
    return prev;
  });
  const [activeRound, setActiveRound] = uS(pendingA ? pendingA.id : null); // null → show the latest round
  const [retrieving, setRetrieving] = uS(false);
  const [sheetAnchor, setSheetAnchor] = uS(""); // "" so the first round doesn't auto-cover the chat on mobile
  // persist rounds so every round stays reopenable for the whole session
  uE(() => { window.ChatSession.scratch.find = { rounds, nextId: idRef.current }; }, [rounds]);

  // an AI reply that carries its round: result pill locally + artifact chip across scenarios
  const roundMsg = (round, node) => ({
    role: "ai",
    roundId: round.id,
    artifact: (() => { const a = { scenario: "find", id: round.id, icon: "search", title: `已匹配 ${round.count} 个资源`, meta: (round.query || "").slice(0, 18), _uid: "fd" + round.id }; window.__activeArtifactKey = "find:" + a._uid; window.dispatchEvent(new CustomEvent("artifact-select", { detail: "find:" + a._uid })); return a; })(),
    node: node || roundReplyNode(round),
  });

  // build & commit the first round after the cross-scenario intent animation
  const beginFirstRound = (text) => {
    setRetrieving(true);
    setTimeout(() => {
      const round = buildRound(text, idRef.current++, ctxRef.current, loggedIn, basketTitles);
      setRounds([...(findStored.rounds || []), round]);
      setRetrieving(false);
      setActiveRound(round.id);
      setMessages((m) => [...m, roundMsg(round)]);
      setSuggestions(roundSuggestions(round));
    }, 220);
  };

  const [messages, setMessages] = uS(() => {
    if (isResume) {
      const r0 = rounds[rounds.length - 1];
      return [roundMsg(r0, (<div>已恢复你 <b>{resume.when}</b> 关于「{(resume.title || "").replace(/[《》]/g, "")}」的检索，下面就是当时整理的结果，<b style={{ color: "var(--brand-deep)" }}>已收藏的资源</b>也都还在。继续筛选或换个方向都行。</div>))];
    }
    if (fromIntent && query) {
      return [
        ...window.ChatSession.take(),
        ...window.takeSwitchDivider(scenario, window.ChatSession.log.length > 0),
        ...(window.ChatSession.echoed(query) ? [] : [{ role: "user", text: query }]),
        { role: "ai", wide: true, intent: query, render: () => <InlineIntent query={query} onDone={() => beginFirstRound(query)} /> },
      ];
    }
    if (query) {
      return [
        ...window.ChatSession.take(),
        ...window.takeSwitchDivider(scenario, window.ChatSession.log.length > 0),
        ...(window.ChatSession.echoed(query) ? [] : [{ role: "user", text: query }]),
        roundMsg(rounds[rounds.length - 1]),
      ];
    }
    {
      const hist = window.ChatSession.take();
      if (hist.length) return window.enterThread(scenario);
    }
    return [{ role: "ai", node: (<div>老师你好，告诉我你要找什么，我会从<b style={{ color: "var(--auth-ink)" }}>学科网资源库</b>为你精准匹配。</div>) }];
  });
  const [suggestions, setSuggestions] = uS(rounds.length ? roundSuggestions(rounds[rounds.length - 1]) : []);
  // persist the thread so the assistant keeps the SAME conversation across scenario switches
  uE(() => { window.ChatSession.save(window.freezeChat(messages)); }, [messages]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  // open a (frozen) round in the result pane; also close any open resource detail
  // (preview / player / album) so the chat's result entries stay clickable on top of a drawer
  const openRound = (id) => { setPreview(null); setPlayer(null); setAlbum(null); setRetrieving(false); setActiveRound(id); setSheetAnchor("r" + id + "#" + (sheetSeqRef.current++)); };

  // commit a retrieval round (shared by typed sends and 追问 resolution)
  const doRetrieve = (text) => {
    setMessages((m) => [...m, { role: "ai", typing: true }]);
    setRetrieving(true);
    setActiveRound(null);
    setSuggestions([]);
    const id = idRef.current++;
    setTimeout(() => {
      const round = buildRound(text, id, ctxRef.current, loggedIn, basketTitles);
      setRounds((rs) => [...rs, round]);
      setRetrieving(false);
      setActiveRound(round.id);
      setSheetAnchor("r" + round.id + "#" + (sheetSeqRef.current++));
      setMessages((m) => [...m.slice(0, -1), roundMsg(round)]);
      setSuggestions(roundSuggestions(round));
    }, 850);
  };

  const handleSend = (text, files) => {
    setMessages((m) => [...m, { role: "user", text, files }]);
    // keep an open item if the message is about it; otherwise the pane follows the chat
    const aboutCurrent = /这个|这份|这节|这道|这段|这本|它|当前|上面|本视频|本资料|本节|刚才/.test(text || "");
    if (!aboutCurrent && (preview || player || album)) { setPreview(null); setPlayer(null); setAlbum(null); }
    // explicit generation request → hand off to the 出卷子 scenario
    if (text.includes("出卷") && !aboutCurrent) { onSwitch && onSwitch("paper", text); return; }
    // 把一句话的解析结果并入累积上下文（学科/学段/年级）
    const absorb = (v) => {
      if (v.subject) { ctxRef.current.subject = v.subject; ctxRef.current.subjectConfirmed = true; }
      if (v.grade) ctxRef.current.grade = v.grade;
      if (v.stage) ctxRef.current.stage = v.stage;
    };
    // 追问弹框开着时，用户在输入框打字 = 独立的新一轮（不合并）
    // 关闭当前弹框 → 重新分析新输入 → 如果仍不完整，再弹一次补全卡
    if (clarify) {
      setClarify(null);
      // 继续往下走正常的补全判断流程（不 return）
    }
    // 信息补全判断：仅对「文档类」找资源意图生效（视频/专辑形态另走分轨，不在此补全）。
    // 触发条件 = 这条消息从「文本明示」或「知识库推断」抽到了 学科/类型/主题/年级/场景 等新条件
    //（而非「难度再高一点」这类仅靠累积上下文的模糊跟进）。
    const analysis = analyzeFind(text, ctxRef.current);
    const fromText = ["stage", "subject", "type", "grade", "semester", "topic", "scene"].some((k) => analysis.src[k] === "text" || analysis.src[k] === "kb");
    if (!aboutCurrent && detectKind(text) === "all" && (fromText || isFindLike(text))) {
      // 跳过过一次后，仅靠上下文的模糊输入不再追问；带了新的明确信息则重新激活
      if (fromText) skippedRef.current = false;
      if (skippedRef.current) { absorb(analysis.v); doRetrieve(text); return; }
      const gaps = findGaps(analysis.v);
      if (gaps.length) {
        const intro = clarifyIntro(analysis.v, gaps, text);
        setMessages((m) => [...m, { role: "ai", typing: true }]);
        setTimeout(() => {
          setMessages((m) => [...m.slice(0, -1), { role: "ai", node: intro }]);
          setClarify({ forText: text, analysis });
        }, 600);
        return;
      }
    }
    // 信息已足够（或视频/专辑/模糊跟进）→ 吸收上下文，直接检索
    absorb(analysis.v);
    doRetrieve(text);
  };

  // 补全卡提交后：写入上下文（标记已确认）→ 在 AI 回复里补一张紧凑的「已答」摘要卡 → 继续检索
  const resolveClarify = (vals) => {
    const real = (x) => (x && x !== "__any__") ? x : null;
    if (real(vals.subject)) { ctxRef.current.subject = real(vals.subject); ctxRef.current.subjectConfirmed = true; }
    if (real(vals.grade)) ctxRef.current.grade = real(vals.grade);
    if (real(vals.stage)) ctxRef.current.stage = real(vals.stage);
    const forText = clarify ? clarify.forText : "";
    setClarify(null);
    const value = ["stage", "subject", "grade", "semester", "type", "scene"].map((k) => real(vals[k])).filter(Boolean).concat(real(vals.topic) ? [`《${real(vals.topic)}》`] : []).join(" · ");
    setMessages((m) => [...m, { role: "ai", answered: { q: "补齐资源信息", value } }]);
    doRetrieve(valsToQuery(vals) || forText);
  };

  // 追问弹框跳过 / 关闭：不带学科，先给一批混合结果（不空手）
  // 记住跳过状态，后续模糊输入不再弹补全卡（除非用户带了新的明确信息）
  const skipClarify = () => {
    const forText = clarify ? clarify.forText : "";
    setClarify(null);
    skippedRef.current = true;
    doRetrieve(forText);
  };

  const { headerRecognizing, send } = useSmartSend({ scenarioId: scenario.id, onSwitch, setMessages, localSend: handleSend });

  // ask the AI about a specific open item. The question is sent to the SAME left
  // conversation (no new session); a resource reference card is pinned above the
  // user bubble. Replies stay grounded in the item's real fields. C-class questions
  // (出同类卷子 / 生成教案) hand off to the matching generation scenario — right pane
  // switches, the left conversation continues.
  const askAbout = (q, item) => {
    const text = typeof q === "string" ? q : q.text;
    const cls = (typeof q === "object" && q.cls) || "A";
    const ref = { title: item.title, type: refLabel(item) };
    if (cls === "C") {
      const to = (typeof q === "object" && q.to) || "paper";
      // carry the originating resource into the target scenario so its seeded user
      // message shows a reference card — otherwise "据此…" loses its anchor on scroll
      window.ChatSession.handoffRef = { title: item.title, type: refLabel(item), item };
      // strip any existing 《》 from the title so we don't double-wrap (e.g. 据《《有理数》…》)
      const cleanTitle = (item.title || "").replace(/[《》]/g, "").slice(0, 16);
      // honor the question's own verb (同类练习 vs 同类卷子) so the target seeds the right form
      const verb = to === "lesson" ? "生成配套教案" : /练习/.test(text || "") ? "出一份同类练习" : "出一份同类卷子";
      onSwitch && onSwitch(to, `据《${cleanTitle}》${verb}`);
      return;
    }
    setMessages((m) => [...m, { role: "user", text, ref, refItem: item }, { role: "ai", typing: true }]);
    // 场景区保持不变：桌面端详情（预览/播放器/专辑）留在原位，回答只进入左侧对话区；
    // 也不 bump anchor（否则会退出全屏/展开面板）。移动端无双栏，仍关闭详情并提示对话。
    if (mobile) {
      setPreview(null); setPlayer(null); setAlbum(null);
      setSheetAnchor("ask#" + (sheetSeqRef.current++));
    }
    setTimeout(() => {
      setMessages((m) => [...m.slice(0, -1), { role: "ai", node: replyForResource(text, item) }]);
    }, 750);
  };

  // reopen a resource referenced from a chat message (reference card click)
  const openRef = (item) => {
    if (!item) return;
    if (item._kind === "video" || item.kind === "video" || item.cat || item.chapters) { setAlbum(null); setPreview(null); setPlayer(item); }
    else if (item._kind === "album" || item.composition) { setPlayer(null); setPreview(null); setAlbum(item); }
    else { setPlayer(null); setAlbum(null); setPreview(item); }
  };

  // returning from a 出卷子/教案 handoff via the reference card → reopen that resource here
  uE(() => {
    const po = window.ChatSession.pendingOpenResource;
    if (po) { window.ChatSession.pendingOpenResource = null; setTimeout(() => openRef(po), 0); }
  }, []);

  // album item helpers
  const previewItem = (it) => setPreview({ title: it.title, pages: it.pages || 12, qcount: it.q || 0, updated: album ? album.updated : "2025", type: it.type });
  const playItem = (it) => setPlayer({ title: it.title, cat: "微课", subject: album ? album.subject : "", grade: album ? album.grade : "", edition: album ? album.edition : "", duration: it.dur || "08:00", quality: "1080P", plays: "—", updated: album ? album.updated : "2025", chapters: [{ t: "00:00", name: "精讲开始" }, { t: "03:00", name: "重点解析" }, { t: "06:00", name: "小结" }] });

  const addBasket = (item) => {
    // PRD FE-20：未登录时收藏被拦截并引导登录
    if (!loggedIn) { nav && nav.onRequireLogin && nav.onRequireLogin(); return; }
    const ok = onAddBasket ? onAddBasket(item) : true;
    showToast(ok ? "已加入资源篮" : "已在资源篮中");
  };

  // PRD §3.2：找资源的登录时机是「操作触发」—— 点击下载时拦截引导登录
  const guardDownload = (msg) => {
    if (!loggedIn) { nav && nav.onRequireLogin && nav.onRequireLogin(); return; }
    showToast(msg);
  };

  // which round is shown on the right (explicit selection, else the latest)
  const roundsById = {}; rounds.forEach((r) => { roundsById[r.id] = r; });
  const shownRound = (activeRound != null ? roundsById[activeRound] : null) || (rounds.length ? rounds[rounds.length - 1] : null);
  const shownId = shownRound ? shownRound.id : null;

  // mobile: which thing the sheet should reveal (open item overrides the round anchor).
  // 桌面端只传检索轮次锚点 —— 打开/关闭详情不得触发 shell 的「新内容展开 + 退出全屏」逻辑（全屏下关详情应保持全屏）
  const sheetKey = mobile
    ? (preview ? "p:" + preview.title : player ? "v:" + player.title : album ? "a:" + (album.id || album.title) : sheetAnchor)
    : sheetAnchor;

  const renderItem = (it, idx) => {
    const key = it._kind + "_" + (it.id || it.title) + "_" + idx;
    if (it._kind === "video") return <VideoCard key={key} v={it} source={it._source} onPlay={() => setPlayer(it)} onDownload={() => guardDownload(`已开始下载《${(it.title || "").slice(0, 12)}…》`)} />;
    if (it._kind === "album") return <AlbumCard key={key} a={it} source={it._source} onOpen={() => setAlbum(it)} />;
    return <ResourceCard key={key} r={it} source={it._source} onPreview={() => setPreview(it)} onDownload={() => guardDownload(`已开始下载《${(it.title || "").slice(0, 12)}…》`)} />;
  };

  const items = shownRound ? shownRound.items.filter((x) => x._kind !== "video" && x._kind !== "album") : [];
  const presentSources = ["我的内容", "资源篮", "学科网"].filter((s) => items.some((x) => x._source === s));
  const resultBody = items.length
    ? <React.Fragment>{items.map(renderItem)}<HandoffBar topic={shownRound.subject || ""} onSwitch={onSwitch} query={shownRound.query} /></React.Fragment>
    : <NotFound topic={shownRound ? (shownRound.subject || "") : ""} onSwitch={onSwitch} query={shownRound ? shownRound.query : query} />;

  const hdrBtn = { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", flexShrink: 0 };

  return (
    <WorkspaceShell scenario={scenario} onHome={onHome} onSwitch={onSwitch} nav={nav} headerRecognizing={headerRecognizing} mobilePanelLabel="资源" mobilePanelIcon="search" openSheetKey={sheetKey}>
      <ChatPanel messages={messages} onSend={send} suggestions={suggestions} placeholder="例如：只看实验视频 / 整套打包下载" roundsById={roundsById} shownId={shownId} retrieving={retrieving} onOpenRound={openRound} onOpenRef={openRef} clarify={clarify} onResolveClarify={resolveClarify} onSkipClarify={skipClarify} taskBar={(() => { const t = deriveSessionTask(scenario && scenario.id); return t ? <SessionTaskBar task={t} onOpen={() => onSwitch && onSwitch(t.scenario, "")} /> : null; })()} />
      {/* results */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", position: "relative" }}>
        {!rounds.length && !retrieving && <FindColdStart loggedIn={!resume && loggedIn} onPick={(q) => handleSend(q)} onLogin={() => nav && nav.onRequireLogin && nav.onRequireLogin()} />}
        {retrieving && <RetrievingPanel />}
        {!retrieving && shownRound && (
          <React.Fragment>
            <div style={{ padding: mobile ? "11px 16px" : "13px 22px", borderBottom: "1px solid var(--line)", background: "var(--surface)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", rowGap: 7 }}>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>以下是为你匹配的资源</span>
              <span style={{ fontSize: 11.5, fontWeight: 800, fontFamily: "var(--font-num)", padding: "1px 8px", borderRadius: 999, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", color: "var(--brand-deep)" }}>{items.length} 项</span>
              <div style={{ flex: 1 }} />
              {presentSources.length > 0 && null}
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: mobile ? "11px 16px 20px" : "14px 22px 24px", display: "flex", flexDirection: "column", gap: mobile ? 9 : 12 }}>
              {resultBody}
            </div>
          </React.Fragment>
        )}

        {album && <AlbumPage a={album} loggedIn={loggedIn} onAsk={askAbout} onClose={() => setAlbum(null)} onPreviewItem={previewItem} onPlayItem={playItem} onDownload={(msg) => guardDownload(msg)} onAddBasket={addBasket} />}
        {preview && <PreviewDrawer r={preview} loggedIn={loggedIn} onClose={() => setPreview(null)} onAsk={askAbout} onAddBasket={addBasket} onDownload={() => guardDownload("已开始下载，可在「资源篮」查看")} />}
        {player && <VideoPlayer v={player} loggedIn={loggedIn} onClose={() => setPlayer(null)} onAsk={askAbout} onAddBasket={addBasket} onDownload={() => guardDownload(`已开始下载视频《${player.title.slice(0, 12)}…》`)} />}
        {toast && (
          <div className="enter-pop" style={{ position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)", background: "var(--ink)", color: "var(--surface)", padding: "11px 18px", borderRadius: 12, fontSize: 13.5, fontWeight: 600, boxShadow: "0 12px 30px -12px rgba(0,0,0,.5)", display: "inline-flex", alignItems: "center", gap: 8, zIndex: 60 }}>
            <Icon name="check" size={16} sw={2.6} /> {toast}
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}

function HandoffBar({ topic, onSwitch, query }) {
  return (
    <div style={{ marginTop: 4, padding: 16, borderRadius: 16, border: "1px dashed var(--brand-soft-border)", background: "var(--brand-soft)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Icon name="sparkArrow" size={17} />
        <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--brand-deep)" }}>没找到完全合适的？把需求说得更具体些我再帮你精准筛选 —— 或让小博士基于学科网资源库直接生成</span>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {HANDOFF.map((h) => (
          <button
            key={h.id}
            onClick={() => onSwitch && onSwitch(h.id, query || `基于「${topic}」`)}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", cursor: "pointer", fontFamily: "var(--font-zh)", transition: "transform .15s, border-color .2s" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = `oklch(0.78 0.09 ${h.hue})`; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--line)"; }}
          >
            <ScenarioGlyph icon={h.icon} hue={h.hue} size={34} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{h.label}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 1 }}>{h.hint}</div>
            </div>
            <Icon name="arrow" size={16} />
          </button>
        ))}
      </div>
    </div>
  );
}

// cold-start panel: shown when teacher entered 找资源 without any input
function FindColdStart({ onPick, loggedIn, onLogin }) {
  const M = window.AIDATA.USER_MEMORY;
  const mobile = useIsMobile();
  const memExamples = [];
  const genExamples = [];
  const memHot = ["有理数 易错题", "整式的加减 课件", "七年级数学 期中卷"];
  const genHot = ["平行四边形的判定 教学设计", "热力环流 复习课件", "2025 昆明中考化学卷", "凸透镜成像 实验视频"];

  const examples = loggedIn ? memExamples : genExamples;
  const hot = loggedIn ? memHot : genHot;

  return (
    <div style={{ flex: 1, overflowY: "auto", display: "grid", placeItems: "center", padding: "30px 24px" }}>
      <div className="home-fade" style={{ width: "min(540px, 100%)" }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ display: "inline-flex", marginBottom: 12 }}><ScenarioGlyph icon="search" hue={150} size={52} active /></div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", margin: "0 0 7px" }}>想找点什么教学资源？</h2>
          <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: 0, lineHeight: 1.6 }}>在左侧用一句话描述你要查找的资源，包括但不限于<b style={{ color: "var(--brand-deep)" }}>试卷、教案、课件、作业</b>等</p>
        </div>

        {/* login prompt removed for v1 */}

        {/* example search cards */}
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-3)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="search" size={14} /> 试试这样问
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {(loggedIn ? [
            "人教版七年级上《有理数》同步练习",
            "七年级数学《整式的加减》易错题专项",
            "《一元一次方程》单元测试卷 含答案",
          ] : [
            "北师大版八下 平行四边形的判定 教学设计",
            "2025年云南昆明 中考化学试卷",
            "凸透镜成像规律 实验视频",
            "高三数学 函数与导数 一轮复习",
          ]).map((it, i) => (
            <button key={i} onClick={() => onPick(it)} style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left", padding: "12px 14px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", fontSize: 13, fontWeight: 600, lineHeight: 1.5, cursor: "pointer", fontFamily: "var(--font-zh)", transition: "all .15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px -6px rgba(0,0,0,.15)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
              <Icon name="search" size={14} />
              <span style={{ flex: 1 }}>{it}</span>
              <Icon name="arrow" size={13} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotFound({ topic, onSwitch, query }) {
  return (
    <div style={{ textAlign: "center", padding: "30px 20px 10px" }}>
      <div style={{ display: "inline-flex", marginBottom: 12, color: "var(--line)" }}>
        <CIcon name="search" size={44} sw={1.4} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", marginBottom: 6 }}>当前条件下暂无现成资源完全匹配</div>
      <div style={{ fontSize: 13.5, color: "var(--ink-3)", marginBottom: 22, lineHeight: 1.6 }}>
        先把需求说得更具体些（学段、版本、知识点、难度…），我再帮你精准筛一批；或者 —— 让小博士基于学科网资源库<b style={{ color: "var(--brand-deep)" }}>直接为你生成</b>
      </div>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <HandoffBar topic={topic} onSwitch={onSwitch} query={query} />
      </div>
    </div>
  );
}

function ResourceCard({ r, onPreview, onDownload, source }) {
  return (
    <div
      className="res-card"
      style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 13, transition: "box-shadow .2s, border-color .2s", cursor: "pointer", display: "flex", gap: 13, alignItems: "center" }}
      onClick={onPreview}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 10px 24px -18px rgba(0,0,0,.3)"; e.currentTarget.style.borderColor = "var(--brand-soft-border)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "var(--line)"; }}
    >
      <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 12, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center" }}>
        <CIcon name={/课件/.test(r.type) ? "slides" : /教案|讲义|学案|学历/.test(r.type) ? "doc" : /试卷|卷|练习|习题|真题|作业|检测|训练/.test(r.type) ? "paper" : "search"} size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 7 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: "var(--ink-3)", flexWrap: "wrap", rowGap: 5 }}>
          <span style={{ padding: "1.5px 8px", borderRadius: 6, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", color: "var(--brand-deep)", fontWeight: 800, whiteSpace: "nowrap" }}>{r.type}</span>
          <span style={{ fontWeight: 700, color: "var(--ink-2)", whiteSpace: "nowrap" }}>{r.edition} · {r.grade}{r.subject}</span>
          {(r.chips || []).slice(0, 4).map((c, i) => <span key={i} style={{ padding: "1.5px 7px", borderRadius: 6, background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--ink-3)", fontWeight: 600, whiteSpace: "nowrap" }}>{c}</span>)}
          {(r.qcount > 0 || r.pages) && <span style={{ whiteSpace: "nowrap" }}>{r.qcount > 0 ? `${r.qcount}题` : ""}{r.qcount > 0 && r.pages ? " · " : ""}{r.pages ? `${r.pages}页` : ""}</span>}
        </div>
      </div>
      <Icon name="chevronRight" size={18} />
    </div>
  );
}

function PreviewDrawer({ r, onClose, onDownload, onAsk, onAddBasket, loggedIn }) {
  return (
    <div className="drawer-pop" style={{ position: "absolute", inset: 0, zIndex: 25, background: "var(--canvas)", display: "flex", flexDirection: "column" }}>
      {/* header */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)", background: "var(--surface)", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <button onClick={onClose} title="返回结果" style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}>
          <Icon name="back" size={16} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)", lineHeight: 1.4 }}>{r.title}</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 3 }}>{r.pages} 页 · {r.qcount > 0 ? `${r.qcount} 题` : "课件"} · 更新 {r.updated}</div>
        </div>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}>
          <Icon name="close" size={16} sw={2.4} />
        </button>
      </div>
      {/* pages preview */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
        {[0, 1].map((p) => (
          <div key={p} style={{ width: "100%", maxWidth: 460, background: "#fff", borderRadius: 8, boxShadow: "0 6px 20px -12px rgba(0,0,0,.3)", border: "1px solid var(--line)", padding: "26px 28px", aspectRatio: "1 / 1.414" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#1a1a1a", textAlign: "center", marginBottom: 4 }}>{r.title}</div>
            <div style={{ fontSize: 10.5, color: "#888", textAlign: "center", marginBottom: 18 }}>学科网 · 精品资源 · 第 {p + 1} 页</div>
            {[...Array(6)].map((_, k) => (
              <div key={k} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#333", marginBottom: 6 }}>{p * 6 + k + 1}. 题目内容预览</div>
                <div style={{ height: 7, background: "#eee", borderRadius: 3, marginBottom: 5, width: "92%" }} />
                <div style={{ height: 7, background: "#eee", borderRadius: 3, width: `${60 + ((k * 13) % 35)}%` }} />
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* bottom: keep-collaborating asks (sticky, thumb-reachable) + actions */}
      <div style={{ flexShrink: 0, borderTop: "1px solid var(--line)", background: "var(--surface)" }}>
        <AskBar item={r} loggedIn={loggedIn} onAsk={onAsk} />
        <div style={{ padding: 14, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", rowGap: 10, justifyContent: "flex-end" }}>
          <Btn kind="soft" icon="basket" onClick={() => onAddBasket && onAddBasket(r)}>加入资源篮</Btn>
          <Btn kind="primary" icon="download" onClick={onDownload}>下载文档</Btn>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { FindWorkspace, WorkspaceShell, ChatPanel, Bubble, RecognizingPanel, SourceTag, AskBar, buildResourceAsks, ScenePills, StageScenarioLabel });


// ======== workspace_courseware.jsx ========
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
        {allDone && (
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


// ======== workspace_lesson.jsx ========
// workspace_lesson.jsx — 写教案：真实成稿的教学设计工作台
// 左侧对话驱动，右侧生成一份结构完整、可直接编辑的教学设计文档。
const { useState: lS, useEffect: lE, useRef: lR } = React;

// ---- 从自然语言里解析课题信息 ----
function parseLessonQuery(q) {
  const text = q || "";
  const edition = (text.match(/(人教版|北师大版|部编版|苏教版|外研社|湘教版|沪科版|译林版|统编版)/) || [])[1] || null;
  const gradeRaw = (text.match(/(高[一二三]|[一二三四五六七八九]年级(上|下)?册?|[七八九][上下]册?)/) || [])[0] || null;
  const subject = (text.match(/(数学|语文|英语|物理|化学|生物|历史|地理|政治|道德与法治|音乐|美术|体育|科学|信息技术)/) || [])[1] || null;
  // 课题：优先书名号，其次去掉修饰词后的主体
  let topic = (text.match(/《([^》]+)》/) || [])[1];
  if (!topic) {
    topic = text
      .replace(/(帮我|请|给我|来一?份|写个?|做个?|生成|出个?)/g, "")
      .replace(/(人教版|北师大版|部编版|苏教版|外研社|湘教版|沪科版|译林版|统编版)/g, "")
      .replace(/(高[一二三]|[一二三四五六七八九]年级(上|下)?册?|[七八九][上下]册?)/g, "")
      .replace(/(数学|语文|英语|物理|化学|生物|历史|地理|政治|道德与法治|音乐|美术|体育|科学|信息技术)/g, "")
      .replace(/(的)?(教学设计|教案|详案|学案|导学案|学习任务单|说课稿?|教学方案)/g, "")
      .replace(/第\d+课/g, (m) => m)
      .trim()
      .replace(/^[,，、·\s]+|[,，、·\s]+$/g, "");
  }
  if (!topic) topic = "本节课内容";
  return { topic, edition, grade: gradeRaw, subject };
}

// ---- 文档类型：教案 / 学案 两大类，各含子类型 ----
const LESSON_CATEGORIES = [
  { key: "教案", types: ["教学设计", "讲义", "学历案", "作业设计方案"] },
  { key: "学案", types: ["导学案", "学习任务单", "知识清单", "实验报告单"] },
];

// ---- 每种文档类型对应的大纲模板（结构各不相同，可在此基础上增删改）----
const OUTLINE_TEMPLATES = {
  "教学设计": [
    ["analysis", "教材分析", "本节在知识体系中的地位与作用"],
    ["students", "学情分析", "学生已有基础、认知特点与困难"],
    ["objectives", "教学目标", "知识技能 / 过程方法 / 情感态度"],
    ["keypoints", "教学重难点", "重点、难点与突破策略"],
    ["prep", "教学准备", "课件、教具、学具与分组"],
    ["process", "教学过程", "导入→探究→精讲→巩固→小结"],
    ["board", "板书设计", "核心板书结构"],
    ["homework", "作业布置", "必做 / 选做 分层作业"],
  ],
  "讲义": [
    ["objectives", "学习目标", "本节要达成的目标"],
    ["knowledge", "知识梳理", "核心概念与结论逐条梳理"],
    ["examples", "典型例题", "例题 + 思路点拨"],
    ["methods", "方法归纳", "解题方法与规律总结"],
    ["exercises", "巩固练习", "分层练习题"],
    ["summary", "课堂小结", "知识与方法回顾"],
  ],
  "学历案": [
    ["objectives", "学习目标", "可评可测的学习目标"],
    ["situation", "情境与任务", "真实情境与驱动任务"],
    ["process", "学习过程", "自主—合作—展示的学习活动"],
    ["evaluation", "评价任务", "对应目标的评价标准"],
    ["summary", "学后反思", "学生自我反思与延伸"],
  ],
  "作业设计方案": [
    ["objectives", "作业目标", "作业要巩固的核心目标"],
    ["layered", "分层作业", "A 基础 / B 提升 / C 拓展"],
    ["expand", "实践拓展", "跨学科或生活化实践任务"],
    ["answer", "参考答案与评价", "答案要点与评价标准"],
  ],
  "导学案": [
    ["objectives", "学习目标", "本节学习目标"],
    ["selfstudy", "自主学习", "课前自学与填空"],
    ["explore", "合作探究", "小组探究问题串"],
    ["check", "当堂检测", "当堂达标检测题"],
    ["summary", "归纳小结", "知识网络梳理"],
  ],
  "学习任务单": [
    ["objectives", "学习目标", "任务要达成的目标"],
    ["tasks", "学习任务", "逐项学习任务"],
    ["record", "学习记录", "学习过程记录区"],
    ["check", "自我检测", "自评与互评"],
  ],
  "知识清单": [
    ["knowledge", "知识要点", "本节知识点逐条罗列"],
    ["formula", "核心公式 / 结论", "必记公式与结论"],
    ["wrong", "易错提醒", "常见错误与辨析"],
    ["map", "知识结构图", "知识之间的逻辑结构"],
  ],
  "实验报告单": [
    ["purpose", "实验目的", "本实验要解决的问题"],
    ["material", "实验器材", "所需器材与药品"],
    ["expsteps", "实验步骤", "操作步骤与注意事项"],
    ["record", "数据记录", "数据表格与现象记录"],
    ["conclusion", "实验结论", "结论与误差分析"],
  ],
};
function buildOutline(type) {
  const t = OUTLINE_TEMPLATES[type] || OUTLINE_TEMPLATES["教学设计"];
  return t.map((o, i) => ({ id: "o" + i, key: o[0], name: o[1], hint: o[2] }));
}
function lessonMeta(q, mem) {
  const p = parseLessonQuery(q);
  return {
    topic: p.topic,
    edition: p.edition || (mem && mem.edition) || "人教版",
    grade: p.grade || (mem && (mem.grade || (mem.book ? lzGrade(mem) : null))) || "七年级",
    subject: p.subject || (mem && mem.subject) || "数学",
    periods: "1 课时", type: "新授课",
  };
}

// ---- 单个章节的内容生成器：按 key 产出对应正文（不同文档类型共用同一份生成库）----
function buildSection(key, name, c) {
  const { topic, edition, grade, subject } = c;
  switch (key) {
    case "analysis":
      return { paras: [
        `「${topic}」是${edition}${subject}${grade}教材中的重要内容，在知识体系中起承上启下的作用：它既是对已学知识的延伸与综合，又为后续学习奠定方法与思维基础。`,
        `教材通过具体情境引出${topic}，遵循“感知—理解—运用”的认知路径，注重引导学生经历知识的形成过程，体会其中蕴含的基本思想方法。`,
      ] };
    case "students":
      return { paras: [
        `${grade}学生已具备一定的前置知识与生活经验，能在教师引导下进行观察、比较和归纳，但抽象概括能力仍在发展中，对${topic}的本质理解容易停留在表面。`,
        `教学中需要借助直观素材与递进式问题串，帮助学生从具体情境逐步过渡到抽象理解，并通过变式练习巩固易混点。`,
      ] };
    case "objectives":
      return { list: [
        { tag: "知识与技能", text: `理解${topic}的核心概念与基本结论，能准确表述并在典型情境中正确运用。` },
        { tag: "过程与方法", text: `经历观察、猜想、验证、归纳的探究过程，体会从特殊到一般的思想方法，发展合作交流与表达能力。` },
        { tag: "情感态度与价值观", text: `在探究活动中获得成功体验，感受${subject}与现实生活的联系，激发学习兴趣与求知欲。` },
      ] };
    case "keypoints":
      return { list: [
        { tag: "重点", text: `${topic}的核心概念、基本结论及其简单运用。` },
        { tag: "难点", text: `${topic}本质特征的抽象与概括，以及在变式情境中的灵活迁移。` },
        { tag: "突破策略", text: "以问题串驱动探究，借助直观演示与小组讨论搭建脚手架，通过对比辨析突破易混点。" },
      ] };
    case "prep":
      return { paras: ["多媒体课件、导学单；学生分组（4 人一组）；板书用具及相关教具 / 学具。"] };
    case "process":
      return { steps: [
        { stage: "一、情境导入", time: "5 分钟", teacher: `呈现与${topic}相关的生活情境或旧知问题，提出核心问题，引发认知冲突。`, student: "观察情境，尝试用已有知识回答，发现新问题。", intent: "从学生最近发展区切入，自然引出课题，明确学习目标。" },
        { stage: "二、探究新知", time: "15 分钟", teacher: `组织学生围绕${topic}开展操作 / 观察活动，用问题串引导：你发现了什么规律？能否用自己的话概括？`, student: "动手操作、小组讨论，记录发现，尝试归纳结论并汇报交流。", intent: "让学生经历知识的形成过程，在做中学，培养归纳概括能力。" },
        { stage: "三、精讲点拨", time: "8 分钟", teacher: `结合学生汇报，规范表述${topic}的结论；通过例题示范规范的思考路径与书写格式。`, student: "对照修正自己的表述，跟随例题理清思路，提出疑问。", intent: "在学生自主建构的基础上精准点拨，规范知识与方法。" },
        { stage: "四、巩固练习", time: "9 分钟", teacher: "布置基础题与变式题各 2 道，巡视指导，收集典型错误进行投影讲评。", student: "独立完成练习，同桌互批，参与错例分析。", intent: "分层递进巩固新知，通过错例辨析突破难点。" },
        { stage: "五、小结作业", time: "3 分钟", teacher: "引导学生从知识、方法、感受三方面总结；布置作业。", student: "自主梳理本课收获，互相补充。", intent: "完善认知结构，实现课内向课外的延伸。" },
      ] };
    case "board":
    case "map":
      return { board: { title: topic, left: ["核心概念 / 结论", "关键条件与注意点"], right: ["典型例题思路", "方法小结：观察 → 猜想 → 验证 → 归纳"] } };
    case "homework":
      return { list: [
        { tag: "必做", text: "教材本节课后习题（基础巩固）。" },
        { tag: "选做", text: `完成一道与${topic}相关的拓展题，下节课分享思路。` },
      ] };
    case "layered":
      return { list: [
        { tag: "A 层 · 基础", text: "教材课后基础题，巩固本课核心结论，面向全体学生。" },
        { tag: "B 层 · 提升", text: "变式练习 2 道，要求写出完整思考过程。" },
        { tag: "C 层 · 拓展", text: `查找一个${topic}的实际应用例子，写一段说明，下节课分享。` },
      ] };
    case "knowledge":
      return { list: [
        { tag: "要点一", text: `${topic}的定义与表示方法，能用自己的话准确复述。` },
        { tag: "要点二", text: `${topic}的基本性质与适用条件。` },
        { tag: "要点三", text: `${topic}与已学知识的联系与区别。` },
      ] };
    case "examples":
      return { list: [
        { tag: "例 1", text: `围绕${topic}的基础题：考查概念的直接运用，给出规范解答步骤。` },
        { tag: "例 2", text: `${topic}的变式题：在新情境中迁移运用，并提示易错处。` },
      ] };
    case "methods":
      return { list: [
        { tag: "通法", text: `${topic}一类问题的通用思路：审题 → 找关键条件 → 选择策略 → 规范作答。` },
        { tag: "提醒", text: "关注适用条件，避免把结论用错范围；先估算再精算便于检查。" },
      ] };
    case "exercises":
    case "check":
      return { list: [
        { tag: "基础", text: `针对${topic}的达标题 3 道（概念识记与直接运用）。` },
        { tag: "提升", text: "综合 / 变式题 2 道，检测灵活迁移能力。" },
      ] };
    case "summary":
      return { paras: [
        `从知识、方法、感受三方面回顾本节：${topic}是什么、怎么用、易错在哪。`,
        "用一句话或一张知识结构图把本节内容串起来，并指出与下节课的联系。",
      ] };
    case "situation":
      return { paras: [
        `创设与${topic}相关的真实情境，提出一个驱动性问题，让学生带着任务进入学习。`,
        "明确本节要完成的核心任务与最终成果形式（如一份说明、一组结论）。",
      ] };
    case "evaluation":
      return { list: [
        { tag: "评价任务一", text: "能用自己的话说清核心概念——对应「学习目标 1」。" },
        { tag: "评价任务二", text: `能在新情境中正确运用${topic}——对应「学习目标 2」。` },
        { tag: "评价标准", text: "分「达成 / 基本达成 / 待加强」三级，附简要描述供自评互评。" },
      ] };
    case "expand":
      return { paras: [
        `设计一项与${topic}相关的实践或跨学科任务，让学生在真实问题中迁移运用所学。`,
        "鼓励以小组协作完成，下节课展示成果，关注过程与表达。",
      ] };
    case "answer":
      return { list: [
        { tag: "答案要点", text: "给出各题关键步骤与最终结果，标注得分点。" },
        { tag: "评价说明", text: "说明分层作业的批改重点与反馈方式，便于精准讲评。" },
      ] };
    case "formula":
      return { list: [
        { tag: "必记", text: `${topic}的核心公式 / 结论及其文字表述。` },
        { tag: "条件", text: "公式成立的前提条件与常见变形。" },
      ] };
    case "wrong":
      return { list: [
        { tag: "易错一", text: `忽略${topic}的适用条件，导致结论用错范围。` },
        { tag: "易错二", text: "符号、单位或表述不规范；通过正反例对比加以辨析。" },
      ] };
    case "purpose":
      return { paras: [`通过实验探究与${topic}相关的规律 / 现象，理解其本质并学会规范操作。`] };
    case "material":
      return { paras: ["列出本实验所需的主要器材、药品 / 材料及数量，并标注安全注意事项。"] };
    case "expsteps":
      return { list: [
        { tag: "步骤 1", text: "组装与检查器材，明确观察对象。" },
        { tag: "步骤 2", text: `按方案进行操作，记录与${topic}相关的现象 / 数据。` },
        { tag: "步骤 3", text: "重复测量，整理数据，规范收尾。" },
      ] };
    case "record":
      return { paras: ["此处为数据 / 学习记录区：用表格记录每次测量或学习过程的关键信息，便于后续分析。"] };
    case "conclusion":
      return { paras: [
        `根据数据与现象归纳结论，回应实验目的中关于${topic}的问题。`,
        "分析可能的误差来源与改进方法。",
      ] };
    case "selfstudy":
      return { list: [
        { tag: "自学一", text: `阅读教材，圈出${topic}的定义与关键词，尝试填空式记录。` },
        { tag: "自学二", text: "完成 2 道前置小题，标记不会的地方，带到课堂讨论。" },
      ] };
    case "explore":
      return { steps: [
        { stage: "探究一", time: "8 分钟", teacher: `提出关于${topic}的核心问题，引导小组观察与讨论。`, student: "小组合作，记录发现并尝试归纳。", intent: "在做中学，培养归纳概括能力。" },
        { stage: "探究二", time: "7 分钟", teacher: "组织汇报，针对分歧追问，规范结论表述。", student: "展示成果，互相质疑补充。", intent: "在交流中完善认知，规范知识与方法。" },
      ] };
    case "tasks":
      return { list: [
        { tag: "任务一", text: `读懂${topic}：用自己的话写出它的含义。` },
        { tag: "任务二", text: "做一做：完成配套小题并记录思路。" },
        { tag: "任务三", text: "想一想：举一个生活中的例子。" },
      ] };
    case "reflect":
      return { paras: [
        "本课以学生活动为主线，探究环节学生参与度较高；但部分小组归纳结论时表述不够严谨，下次可提前给出表述支架。",
        "练习反馈显示变式题正确率偏低，难点突破还需加强——可在精讲环节增加一组对比辨析，并布置针对性补偿练习。",
      ] };
    default:
      return { paras: [`（${name}）这一部分先留好位置——告诉我具体要求，我来帮你补充内容；也可以直接在此点击撰写。`] };
  }
}

// ---- 备课文档生成器：按课题 + 文档类型 + 大纲产出完整文档 ----
function buildLessonDoc(q, mem, outline, type) {
  const m = lessonMeta(q, mem);
  const ctx = { topic: m.topic, edition: m.edition, grade: m.grade, subject: m.subject };
  const ol = outline && outline.length ? outline : buildOutline(type);
  const sections = ol.map((o) => ({ id: o.key, name: o.name, ...buildSection(o.key, o.name, ctx) }));
  return { topic: m.topic, edition: m.edition, grade: m.grade, subject: m.subject, periods: m.periods, type: m.type, docType: type || "教学设计", sections };
}

// ---- 对话指令 → 文档修改 ----
function applyLessonCommand(text, doc) {
  const t = text || "";
  const clone = { ...doc, sections: doc.sections.map((s) => ({ ...s })) };
  if (/反思/.test(t)) {
    if (!clone.sections.find((s) => s.id === "reflect")) {
      clone.sections = [...clone.sections, {
        id: "reflect", name: "教学反思",
        paras: [
          "本课以学生活动为主线，探究环节学生参与度较高；但部分小组归纳结论时表述不够严谨，下次可提前给出表述支架。",
          "练习反馈显示变式题正确率偏低，说明难点突破还需加强——可在精讲环节增加一组对比辨析，并在课后布置针对性补偿练习。",
        ],
      }];
      return { doc: clone, reply: "已在文末补充「教学反思」，从课堂效果和改进方向两个角度写了初稿，你可以直接在右侧修改。" };
    }
    return { doc, reply: "「教学反思」已经在文档里了，可以直接在右侧编辑补充。" };
  }
  if (/分层/.test(t)) {
    clone.sections = clone.sections.map((s) => s.id === "homework" ? {
      ...s,
      list: [
        { tag: "A 层 · 基础", text: "教材课后习题 1–3 题，巩固本课核心结论。" },
        { tag: "B 层 · 提升", text: `变式练习 2 道，要求写出完整的思考过程。` },
        { tag: "C 层 · 拓展", text: `查找一个${clone.topic}在实际中的应用例子，写一段说明，下节课分享。` },
      ],
    } : s);
    return { doc: clone, reply: "已把作业改为 A/B/C 三层：基础巩固、能力提升、实践拓展，各层要求都写明了。" };
  }
  if (/细化|重难点/.test(t)) {
    clone.sections = clone.sections.map((s) => s.id === "keypoints" ? {
      ...s,
      list: [
        { tag: "重点", text: `${clone.topic}的核心概念、基本结论及其简单运用。` },
        { tag: "重点落实", text: "通过探究活动让结论由学生自己归纳得出；例题示范后安排同型练习即时检测。" },
        { tag: "难点", text: `${clone.topic}本质特征的抽象与概括，以及在变式情境中的灵活迁移。` },
        { tag: "难点成因", text: "学生的抽象概括能力尚在发展，容易被表面特征干扰，对适用条件关注不足。" },
        { tag: "突破策略", text: "①直观演示降低抽象度；②正反例对比辨析适用条件；③变式梯度练习实现迁移。" },
      ],
    } : s);
    return { doc: clone, reply: "已细化「教学重难点」：补充了重点落实方式、难点成因分析和三步突破策略。" };
  }
  if (/课时/.test(t)) {
    const m = t.match(/([一二两三四12234])\s*课时/);
    const n = m ? m[1].replace("两", "二") : "二";
    clone.periods = `${n} 课时`;
    return { doc: clone, reply: `已把课时调整为 ${clone.periods}，教学过程的环节安排你可以按课时在右侧拆分调整。` };
  }
  if (/导入|情境/.test(t)) {
    clone.sections = clone.sections.map((s) => s.id === "process" ? {
      ...s,
      steps: s.steps.map((st, i) => i === 0 ? { ...st, teacher: `播放一段贴近学生生活的短视频/实物演示，引出与${clone.topic}相关的真实问题，请学生先猜一猜。`, intent: "用真实情境激发兴趣，让学生带着问题进入学习。" } : st),
    } : s);
    return { doc: clone, reply: "已把导入环节改为更具体的情境式导入（短视频/实物演示 + 猜想），设计意图也同步更新了。" };
  }
  return null;
}

const LESSON_COLD = ["北师大版八下 平行四边形的判定 教学设计", "部编版历史八下 第18课 教学设计", "苏教版六下数学《正比例的意义》教案", "高一英语外研社必修2 Unit6 教学设计"];

// ---- 教材选择维度：学段 / 学科 / 版本 / 册别（与「问教材」一致）----
const LZ_STAGES = ["小学", "初中", "高中"];
const LZ_SUBJECTS = ["语文", "数学", "英语", "物理", "化学", "生物", "历史", "地理", "道德与法治", "科学"];
const LZ_EDITIONS = ["人教版", "统编版", "北师大版", "苏教版", "外研版", "沪教版"];
function lzBooks(stage) {
  if (stage === "高中") return ["必修1", "必修2", "选择性必修1", "选择性必修2"];
  if (stage === "小学") return ["一年级上册", "二年级上册", "三年级上册", "四年级上册", "五年级上册", "六年级上册"];
  return ["七年级上册", "七年级下册", "八年级上册", "八年级下册", "九年级上册", "九年级下册"];
}
function lzGrade(tb) {
  if (tb.stage === "高中") return "高一";
  const m = (tb.book || "").match(/^(.+?年级)/);
  return m ? m[1] : "七年级";
}
// ---- 章节目录（按 学科|册别 取，缺省给通用目录）----
const LZ_CATALOG = {
  "数学|七年级上册": [
    { ch: "第一章 有理数", secs: ["正数和负数", "有理数", "有理数的加减法", "有理数的乘除法", "有理数的乘方"] },
    { ch: "第二章 整式的加减", secs: ["整式", "整式的加减"] },
    { ch: "第三章 一元一次方程", secs: ["从算式到方程", "解一元一次方程", "实际问题与一元一次方程"] },
    { ch: "第四章 几何图形初步", secs: ["几何图形", "直线、射线、线段", "角"] },
  ],
  "数学|八年级上册": [
    { ch: "第十一章 三角形", secs: ["与三角形有关的线段", "与三角形有关的角", "多边形及其内角和"] },
    { ch: "第十二章 全等三角形", secs: ["全等三角形", "三角形全等的判定", "角的平分线的性质"] },
    { ch: "第十三章 轴对称", secs: ["轴对称", "画轴对称图形", "等腰三角形"] },
  ],
  "语文|七年级上册": [
    { ch: "第一单元", secs: ["春", "济南的冬天", "雨的四季", "古代诗歌四首"] },
    { ch: "第二单元", secs: ["秋天的怀念", "散步", "散文诗二首", "《世说新语》二则"] },
  ],
  "生物|必修1": [
    { ch: "第5章 细胞的能量供应和利用", secs: ["降低化学反应活化能的酶", "细胞的能量“货币”ATP", "ATP的主要来源——细胞呼吸", "光合作用与能量转化"] },
    { ch: "第6章 细胞的生命历程", secs: ["细胞的增殖", "细胞的分化", "细胞的衰老和死亡"] },
  ],
  "物理|九年级上册": [
    { ch: "第十三章 内能", secs: ["分子热运动", "内能", "比热容"] },
    { ch: "第十五章 电流和电路", secs: ["两种电荷", "电流和电路", "串联和并联"] },
  ],
};
function lzCatalog(tb) {
  return LZ_CATALOG[`${tb.subject}|${tb.book}`] || [
    { ch: "第一单元", secs: ["第 1 节", "第 2 节", "第 3 节"] },
    { ch: "第二单元", secs: ["第 1 节", "第 2 节", "第 3 节"] },
  ];
}
function lzLabel(tb) { return `${tb.edition} · ${tb.subject} · ${tb.book}`; }
// 登录用户的记忆默认教材
function lessonTextbookFor(mem) {
  if (mem) return { stage: "初中", subject: mem.subject || "数学", edition: mem.edition || "人教版", book: "七年级上册" };
  return { stage: "初中", subject: "数学", edition: "人教版", book: "七年级上册" };
}

// ---- 文档区的小组件 ----
function LsTag({ children }) {
  return <span style={{ flexShrink: 0, alignSelf: "flex-start", padding: "3px 9px", borderRadius: 7, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", color: "var(--brand-deep)", fontSize: 11.5, fontWeight: 800, whiteSpace: "nowrap" }}>{children}</span>;
}

function LsSection({ sec, idx, animate }) {
  const body = sec.paras ? (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {sec.paras.map((p, i) => (
        <p key={i} contentEditable suppressContentEditableWarning style={{ margin: 0, fontSize: 13.5, lineHeight: 1.85, color: "var(--ink)", outline: "none" }}>{p}</p>
      ))}
    </div>
  ) : sec.list ? (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {sec.list.map((it, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <LsTag>{it.tag}</LsTag>
          <p contentEditable suppressContentEditableWarning style={{ margin: 0, flex: 1, fontSize: 13.5, lineHeight: 1.75, color: "var(--ink)", outline: "none" }}>{it.text}</p>
        </div>
      ))}
    </div>
  ) : sec.steps ? (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {sec.steps.map((st, i) => (
        <div key={i} style={{ border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 13px", background: "var(--surface-2)", borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>{st.stage}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", fontFamily: "var(--font-num)" }}>{st.time}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            <div style={{ padding: "9px 13px", borderRight: "1px solid var(--line)" }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: "var(--brand-deep)", marginBottom: 4 }}>教师活动</div>
              <p contentEditable suppressContentEditableWarning style={{ margin: 0, fontSize: 12.5, lineHeight: 1.7, color: "var(--ink-2)", outline: "none" }}>{st.teacher}</p>
            </div>
            <div style={{ padding: "9px 13px" }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: "oklch(0.55 0.12 175)", marginBottom: 4 }}>学生活动</div>
              <p contentEditable suppressContentEditableWarning style={{ margin: 0, fontSize: 12.5, lineHeight: 1.7, color: "var(--ink-2)", outline: "none" }}>{st.student}</p>
            </div>
          </div>
          <div style={{ padding: "7px 13px", borderTop: "1px dashed var(--line)", display: "flex", gap: 7, alignItems: "baseline" }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: "var(--ink-3)", flexShrink: 0 }}>设计意图</span>
            <p contentEditable suppressContentEditableWarning style={{ margin: 0, fontSize: 12, lineHeight: 1.65, color: "var(--ink-3)", outline: "none" }}>{st.intent}</p>
          </div>
        </div>
      ))}
    </div>
  ) : sec.board ? (
    <div style={{ border: "1.5px solid var(--ink)", borderRadius: 4, padding: "14px 18px", background: "var(--surface-2)" }}>
      <div style={{ textAlign: "center", fontSize: 14.5, fontWeight: 800, color: "var(--ink)", marginBottom: 10 }}>{sec.board.title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sec.board.left.map((l, i) => <div key={i} contentEditable suppressContentEditableWarning style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.6, outline: "none" }}>· {l}</div>)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sec.board.right.map((l, i) => <div key={i} contentEditable suppressContentEditableWarning style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.6, outline: "none" }}>· {l}</div>)}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <section className={animate ? "block-pop" : ""} style={{ animationDelay: `${idx * 0.09}s` }}>
      <h3 style={{ display: "flex", alignItems: "center", gap: 9, margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>
        <span style={{ width: 22, height: 22, borderRadius: 7, background: "var(--brand-grad)", backgroundColor: "var(--brand)", color: "#fff", fontSize: 11.5, fontWeight: 800, display: "grid", placeItems: "center", fontFamily: "var(--font-num)", flexShrink: 0 }}>{idx + 1}</span>
        {sec.name}
      </h3>
      {body}
    </section>
  );
}

function LessonOutlinePanel({ meta, docType, outline, setOutline, onConfirm, mobile }) {
  const rename = (id, name) => setOutline((o) => o.map((x) => (x.id === id ? { ...x, name } : x)));
  const remove = (id) => setOutline((o) => (o.length <= 2 ? o : o.filter((x) => x.id !== id)));
  const move = (id, dir) => setOutline((o) => {
    const i = o.findIndex((x) => x.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= o.length) return o;
    const n = o.slice();
    [n[i], n[j]] = [n[j], n[i]];
    return n;
  });
  const add = () => setOutline((o) => [...o, { id: "c" + Date.now().toString(36), key: "custom" + Date.now(), name: "新部分", hint: "自定义部分，点标题改名" }]);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 18 }}>
        <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", color: "var(--brand-deep)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="list" size={20} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "var(--ink)" }}>《{meta.topic}》{docType || "教学设计"}大纲</h2>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[meta.edition, meta.subject, meta.grade, meta.periods].map((c, i) => (
              <span key={i} style={{ padding: "2px 9px", borderRadius: 999, background: "var(--surface-2)", border: "1px solid var(--line)", fontSize: 11, fontWeight: 700, color: "var(--ink-2)" }}>{c}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 12.5, color: "var(--ink-3)", fontWeight: 600 }}>
        <Icon name="spark" size={14} /> 先确认教案结构 —— 增删条目、调整顺序或改名，满意后再展开成完整内容。
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {outline.map((o, i) => (
          <div key={o.id} className="block-pop" style={{ animationDelay: `${i * 0.05}s`, display: "flex", alignItems: "center", gap: 12, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 13, padding: "12px 14px" }}>
            <span style={{ width: 24, height: 24, borderRadius: 7, background: "var(--brand-grad)", backgroundColor: "var(--brand)", color: "#fff", fontSize: 12, fontWeight: 800, display: "grid", placeItems: "center", fontFamily: "var(--font-num)", flexShrink: 0 }}>{i + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <input value={o.name} onChange={(e) => rename(o.id, e.target.value)} spellCheck={false}
                style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: 14.5, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-zh)", padding: 0 }} />
              <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>{o.hint}</div>
            </div>
            <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
              <button onClick={() => move(o.id, -1)} disabled={i === 0} aria-label="上移" style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: i === 0 ? "var(--line)" : "var(--ink-3)", display: "grid", placeItems: "center", cursor: i === 0 ? "default" : "pointer" }}><span style={{ display: "inline-flex", transform: "rotate(180deg)" }}><Icon name="chevron" size={14} /></span></button>
              <button onClick={() => move(o.id, 1)} disabled={i === outline.length - 1} aria-label="下移" style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: i === outline.length - 1 ? "var(--line)" : "var(--ink-3)", display: "grid", placeItems: "center", cursor: i === outline.length - 1 ? "default" : "pointer" }}><Icon name="chevron" size={14} /></button>
              <button onClick={() => remove(o.id)} aria-label="删除" data-tip="删除" style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-3)", display: "grid", placeItems: "center", cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "oklch(0.55 0.18 25)"; e.currentTarget.style.borderColor = "oklch(0.8 0.1 25)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ink-3)"; e.currentTarget.style.borderColor = "var(--line)"; }}><Icon name="trash" size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={add} style={{ width: "100%", marginTop: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px", borderRadius: 12, border: "1px dashed var(--line)", background: "transparent", color: "var(--ink-3)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", transition: "all .15s" }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.color = "var(--brand-deep)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--ink-3)"; }}>
        <Icon name="plus" size={15} sw={2.2} /> 添加一个部分
      </button>

      <div style={{ position: "sticky", bottom: 0, marginTop: 20, paddingTop: 14, display: "flex", justifyContent: "center" }}>
        <button onClick={onConfirm} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 26px", borderRadius: 13, border: "none", background: "var(--brand-grad)", backgroundColor: "var(--brand)", color: "#fff", fontSize: 14.5, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-zh)", boxShadow: "0 10px 26px -12px var(--brand-glow)" }}>
          <Icon name="check" size={16} sw={2.6} /> 生成教案内容
        </button>
      </div>
    </div>
  );
}

function LessonWorkspace({ scenario, query, onHome, onSwitch, fromIntent, resume, loggedIn, nav }) {
  const mobile = useIsMobile();
  const M = window.AIDATA.USER_MEMORY;
  const mem = loggedIn ? { edition: "人教版", grade: "七年级", subject: "数学" } : null;
  const stored = window.ChatSession.scratch.lesson || {};
  // 选中的教材（版本/年级/学科，可在工具栏「教材」处更换）—— 必须在 doc 初始化前声明
  const [textbook, setTextbook] = lS(stored.textbook || lessonTextbookFor(mem));
  const isResume = !!resume;
  const initialQ = query || (isResume ? resume.title : "") || stored.q || "";
  const buildResumeDoc = isResume && !stored.doc;
  const [doc, setDoc] = lS(() => stored.doc || (buildResumeDoc ? buildLessonDoc(initialQ, textbook, null, stored.docType || "教学设计") : null));
  const freshQuery = !isResume && !stored.doc && !!initialQ;
  const [meta, setMeta] = lS(() => (freshQuery ? lessonMeta(initialQ, textbook) : null));
  const [outline, setOutline] = lS(() => (freshQuery && !fromIntent ? buildOutline(stored.docType || "教学设计") : null));
  const [rawQ, setRawQ] = lS(freshQuery ? initialQ : "");
  const [generating, setGenerating] = lS(false);
  const [toast, setToast] = lS(null);
  const docRef = lR(null);
  // 文档分类（教案 / 学案）与具体类型；默认选中第一个，绝不阻断用户
  const [docCat, setDocCat] = lS(stored.docCat || "教案");
  const [docType, setDocType] = lS(stored.docType || "教学设计");
  // 已保存的文档列表 + 下拉/教材选择的弹层开关
  const [savedDocs, setSavedDocs] = lS(stored.savedDocs || []);
  const [savedOpen, setSavedOpen] = lS(false);
  const [pickTextbook, setPickTextbook] = lS(false);

  const greet = <span>好的，我来帮你<b style={{ color: "var(--brand-deep)" }}>写教案</b>。告诉我课题，或者在右侧选好教材章节，我先给你列个大纲。</span>;

  // 保存（独立动作，不新建）—— 同课题+同类型覆盖，避免重复堆叠
  const saveDoc = () => {
    if (!doc) return;
    const key = doc.topic + "|" + docType;
    setSavedDocs((s) => [...s.filter((x) => (x.doc.topic + "|" + x.docType) !== key), { doc, meta, rawQ, docCat, docType, when: "刚刚" }]);
    setToast(`已保存《${doc.topic}》${docType || ""}`);
    setTimeout(() => setToast(null), 1800);
  };
  // 新建（独立动作，不保存）—— 清空当前，回到选择态
  const createNew = () => {
    setDoc(null); setOutline(null); setMeta(null); setRawQ(""); setSugs([]);
    window.__activeArtifactKey = null; window.dispatchEvent(new CustomEvent("artifact-select", { detail: null }));
    setMessages((m) => [...m, { role: "ai", node: <span>已新建一份空白文档——在右上选好教材章节和文档类型，或直接告诉我课题。</span> }]);
  };

  // 打开已保存文档：静默切换，仅用轻提示，不再往对话里堆消息
  const openSaved = (idx) => {
    const s = savedDocs[idx];
    if (!s) return;
    setDoc(s.doc); setMeta(s.meta); setRawQ(s.rawQ); setDocCat(s.docCat); setDocType(s.docType);
    setOutline(null); setSavedOpen(false); setSugs(LESSON_SUGS);
    setToast(`已打开《${s.doc.topic}》${s.docType}`);
    setTimeout(() => setToast(null), 1800);
  };
  const removeSaved = (idx) => setSavedDocs((s) => s.filter((_, i) => i !== idx));

  const genDoc = (q, ol, type, after) => {
    setGenerating(true);
    setOutline(null);
    setTimeout(() => {
      const d = buildLessonDoc(q, textbook, ol, type || docType || "教学设计");
      setDoc(d);
      setGenerating(false);
      after && after(d);
    }, 1300);
  };
  const outlineNote = (m, type) => (
    <span>我先把《<b>{m.topic}</b>》这节课的<b>{type || docType || "教学设计"}</b>大纲列在右侧了——你可以增删条目、调整顺序或改名字。满意后点 <b style={{ color: "var(--brand-deep)" }}>「确认大纲，开始生成」</b>，我再把每一部分展开成完整内容。</span>
  );
  const proposeOutline = (q) => {
    const t = docType || "教学设计";
    if (!docType) setDocType(t);
    const m = lessonMeta(q, textbook);
    setMeta(m); setRawQ(q); setDoc(null); setOutline(buildOutline(t));
    window.__activeArtifactKey = null; window.dispatchEvent(new CustomEvent("artifact-select", { detail: null }));
    setMessages((ms) => [...ms.filter((x) => !x.typing), { role: "ai", node: outlineNote(m, t) }]);
  };
  const confirmOutline = () => {
    const m = meta;
    setMessages((ms) => [...ms, { role: "ai", node: <span>好的，正在按确认后的大纲展开《{m.topic}》的完整{docType || "教学设计"}…</span> }]);
    genDoc(rawQ || m.topic, outline, docType, (d) => { setMessages((ms) => [...ms, { role: "ai", node: doneNote(d), artifact: artFor(d) }]); setSugs(LESSON_SUGS); });
  };

  // 分类切换：默认选中该类第一个子类型，不阻断
  const chooseCat = (key) => {
    if (key === docCat) return;
    const cat = LESSON_CATEGORIES.find((c) => c.key === key) || LESSON_CATEGORIES[0];
    setDocCat(key);
    chooseType(cat.types[0]);
  };
  // 类型切换：若已有成稿/大纲，按新类型重建（不同类型大纲不同）
  const chooseType = (t) => {
    if (t === docType) return;
    setDocType(t);
    if (doc) {
      setMessages((ms) => [...ms, { role: "ai", node: <span>已切换为 <b style={{ color: "var(--brand-deep)" }}>{t}</b> —— 右侧大纲与正文已按「{t}」的结构重新生成。</span> }]);
      genDoc(rawQ || doc.topic, buildOutline(t), t, () => {});
    } else if (outline) {
      setMeta(meta); setOutline(buildOutline(t));
    }
  };

  const [messages, setMessages] = lS(() => {
    if (isResume) {
      return [{ role: "ai", node: <span>已为你恢复 <b>{resume.when}</b> 写的《{(resume.title || "").replace(/[《》]/g, "")}》教学设计，右侧就是当时的成稿，接着改就行。</span> }];
    }
    if (stored.doc) return window.enterThread(scenario);
    if (fromIntent && query) {
      return [
        ...window.ChatSession.take(),
        ...window.takeSwitchDivider(scenario, window.ChatSession.log.length > 0),
        ...(window.ChatSession.echoed(query) ? [] : [window.ChatSession.seedUser(query)]),
        { role: "ai", wide: true, intent: query, render: () => <InlineIntent query={query} onDone={() => { const m = lessonMeta(query, textbook); setMeta(m); setRawQ(query); setOutline(buildOutline(stored.docType || "教学设计")); setMessages((ms) => [...ms, { role: "ai", node: outlineNote(m, stored.docType || "教学设计") }]); }} /> },
      ];
    }
    if (freshQuery) return [...window.ChatSession.take(), ...window.takeSwitchDivider(scenario, window.ChatSession.log.length > 0), ...(window.ChatSession.echoed(query) ? [] : [window.ChatSession.seedUser(query)]), { role: "ai", node: outlineNote(lessonMeta(initialQ, textbook), stored.docType || "教学设计") }];
    return window.enterThread(scenario, greet);
  });
  const LESSON_SUGS = ["补充教学反思", "作业改成分层", "重难点再细化", "导入换成情境式"];
  const [sugs, setSugs] = lS(doc ? LESSON_SUGS : []);

  const artFor = (d) => { const a = { scenario: "lesson", icon: "lesson", title: `《${d.topic}》${d.docType || "教学设计"}`, meta: `${d.edition} · ${d.grade} · ${d.subject}`, _uid: "ls" + Date.now() }; window.__activeArtifactKey = "lesson:" + a._uid; window.dispatchEvent(new CustomEvent("artifact-select", { detail: "lesson:" + a._uid })); return a; };
  const doneNote = (d) => (
    <span>《<b>{d.topic}</b>》的教案已经写好了，共 <b>{d.sections.length}</b> 个模块。可以点「编辑」继续改，也可以直接下载。</span>
  );

  // 持久化
  lE(() => { window.ChatSession.save(window.freezeChat(messages)); }, [messages]);
  lE(() => { window.ChatSession.scratch.lesson = { doc, q: initialQ, docCat, docType, savedDocs, textbook }; }, [doc, docCat, docType, savedDocs, textbook]);

  const handleSend = (text, files) => {
    setMessages((m) => [...m, { role: "user", text, files }, { role: "ai", typing: true }]);
    setTimeout(() => {
      // 已成稿 → 先看是不是修改指令
      if (doc) {
        const r = applyLessonCommand(text, doc);
        if (r) {
          setDoc(r.doc);
          setMessages((m) => [...m.slice(0, -1), { role: "ai", node: <span>{r.reply}</span> }]);
          return;
        }
        if ((text || "").length >= 4) { setMessages((m) => m.slice(0, -1)); proposeOutline(text); return; }
        setMessages((m) => [...m.slice(0, -1), { role: "ai", node: <span>可以告诉我具体改哪里——比如「补充教学反思」「作业改成分层」，或者直接给我一个新课题。</span> }]);
        return;
      }
      // 大纲阶段 → 可用对话调整大纲，或重新列
      if (outline) {
        if (/反思/.test(text) && !outline.some((o) => o.key === "reflect")) {
          setOutline((o) => [...o, { id: "reflect", key: "reflect", name: "教学反思", hint: "课后反思与改进方向" }]);
          setMessages((m) => [...m.slice(0, -1), { role: "ai", node: <span>已在大纲末尾加上「教学反思」，确认后会一并展开。</span> }]);
          return;
        }
        if ((text || "").length >= 4) { setMessages((m) => m.slice(0, -1)); proposeOutline(text); return; }
        setMessages((m) => [...m.slice(0, -1), { role: "ai", node: <span>可以在右侧直接调整大纲；或者告诉我新的课题，我重新列。确认后我才开始展开。</span> }]);
        return;
      }
      // 还没有大纲/文档（问候态）→ 当作课题，先列大纲
      if ((text || "").length >= 2) { setMessages((m) => m.slice(0, -1)); proposeOutline(text); return; }
      setMessages((m) => [...m.slice(0, -1), { role: "ai", node: <span>告诉我课题（最好带上版本和年级），我先列个大纲给你过目。</span> }]);
    }, 600);
  };
  const { headerRecognizing, send } = useSmartSend({ scenarioId: scenario.id, onSwitch, setMessages, localSend: handleSend });

  // 从章节直接开写（docType 始终有默认值，不阻断）
  const writeSection = (topic) => {
    send(`${textbook.edition}${lzGrade(textbook)}${textbook.subject}《${topic}》${docType}`);
  };

  const exportDoc = () => { setToast("已开始下载（演示）— 实际产品中将下载文档文件"); setTimeout(() => setToast(null), 2600); };
  // 返回上一层级：离开当前文档，回到「写教案」选择页。离开前自动留存，方便从「接着上次」找回。
  const goBack = () => {
    if (doc) {
      const key = doc.topic + "|" + docType;
      setSavedDocs((s) => [...s.filter((x) => (x.doc.topic + "|" + x.docType) !== key), { doc, meta, rawQ, docCat, docType, when: "刚刚" }]);
    }
    setDoc(null); setSugs([]);
    window.__activeArtifactKey = null; window.dispatchEvent(new CustomEvent("artifact-select", { detail: null }));
  };

  return (
    <WorkspaceShell scenario={scenario} onHome={onHome} onSwitch={onSwitch} nav={nav} headerRecognizing={headerRecognizing} mobilePanelLabel="教案" mobilePanelIcon="lesson" openSheetKey={doc ? doc.topic : null}>
      <ChatPanel messages={messages} onSend={send} suggestions={sugs} placeholder="课题，或要修改的地方…" onOpenRef={(item) => { window.ChatSession.pendingOpenResource = item; onSwitch && onSwitch("find", ""); }} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "var(--canvas)" }}>
        {/* 文档工具栏 —— 上排：选择教材；下排：文档类型 + 操作 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: doc ? "10px 16px" : (outline || generating) ? "9px 16px" : "0", borderBottom: (doc || outline || generating) ? "1px solid var(--line)" : "none", background: "var(--surface)", flexShrink: 0 }}>
          {doc ? (
            /* 编辑阶段：极简头——返回 + 当前文档 + 下载 */
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={goBack} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px 5px 8px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-2)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.color = "var(--brand-deep)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--ink-2)"; }}>
                <span style={{ display: "inline-flex", transform: "rotate(180deg)" }}><Icon name="arrow" size={15} /></span> 返回
              </button>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: "var(--ink-2)" }}><span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--brand)", display: "inline-block" }} />正在编辑 · {doc.docType || "教学设计"}</span>
              <div style={{ flex: 1 }} />
              <Btn size="sm" kind="primary" onClick={() => { setToast("正在跳转文档编辑页（演示）"); setTimeout(() => setToast(null), 2200); }}>编辑</Btn>
              <Btn size="sm" kind="ghost" icon="download" onClick={exportDoc}>下载</Btn>
            </div>
          ) : (
          <React.Fragment>
          {/* 上排：当前教材身份 — hide on start page since catalog has it inline */}
          {(outline || generating) && <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ width: 26, height: 26, borderRadius: 8, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}><CIcon name="book" size={14} /></span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)", lineHeight: 1.2 }}>{lzLabel(textbook)}</div>
              <div style={{ fontSize: 10.5, color: "var(--ink-3)", fontWeight: 600 }}>{textbook.stage} · {lzGrade(textbook)}</div>
            </div>
            <button onClick={() => setPickTextbook(true)} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface-2)", color: "var(--ink-2)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.color = "var(--brand-deep)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--ink-2)"; }}>
              <Icon name="refresh" size={13} /> 切换教材
            </button>
            <div style={{ flex: 1 }} />
            {savedDocs.length > 0 && (
              <div style={{ position: "relative" }}>
                <button onClick={() => setSavedOpen((v) => !v)} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 8, border: "1px solid var(--line)", background: savedOpen ? "var(--brand-soft)" : "var(--surface-2)", color: savedOpen ? "var(--brand-deep)" : "var(--ink-2)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>
                  <CIcon name="lesson" size={13} /> 已保存 {savedDocs.length}
                  <span style={{ display: "inline-flex", transform: savedOpen ? "rotate(180deg)" : "none", transition: "transform .15s", color: "var(--ink-3)" }}><Icon name="chevron" size={12} /></span>
                </button>
                {savedOpen && (
                  <React.Fragment>
                    <div onClick={() => setSavedOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 49 }} />
                    <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50, width: 268, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "0 16px 40px -18px rgba(20,30,50,.34)", padding: 6 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 800, color: "var(--ink-3)", padding: "5px 8px" }}>已保存的文档</div>
                      {savedDocs.map((s, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: 4, borderRadius: 9, padding: "2px 2px 2px 0" }}>
                          <button onClick={() => openSaved(idx)} style={{ flex: 1, minWidth: 0, textAlign: "left", display: "flex", alignItems: "center", gap: 8, padding: "8px 9px", borderRadius: 9, border: "none", background: "transparent", color: "var(--ink-2)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-2)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                            <CIcon name="lesson" size={13} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>《{s.doc.topic}》{s.docType}</span>
                          </button>
                          <button onClick={() => removeSaved(idx)} aria-label="删除" style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 7, border: "none", background: "transparent", color: "var(--ink-3)", display: "grid", placeItems: "center", cursor: "pointer" }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "oklch(0.55 0.18 25)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ink-3)"; }}><Icon name="trash" size={13} /></button>
                        </div>
                      ))}
                    </div>
                  </React.Fragment>
                )}
              </div>
            )}
          </div>}

          </React.Fragment>
          )}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: mobile ? "16px 14px" : "26px clamp(18px,4%,48px)" }}>
          {generating ? (
            <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, color: "var(--brand-deep)", fontSize: 13, fontWeight: 700 }}>
                <BotAvatar size={26} glow /> 正在按课标生成{docType || "教学设计"} <Dots />
              </div>
              {[180, 320, 260, 380, 300].map((w, i) => (
                <div key={i} className="ph-stripe" style={{ height: i === 0 ? 30 : 70, borderRadius: 12, maxWidth: i === 0 ? w + 200 : "100%" }} />
              ))}
            </div>
          ) : outline ? (
            <LessonOutlinePanel meta={meta} docType={docType} outline={outline} setOutline={setOutline} onConfirm={confirmOutline} mobile={mobile} />
          ) : !doc ? (
            <LessonStartPage textbook={textbook} docType={docType} loggedIn={loggedIn} savedDocs={savedDocs} onWrite={writeSection} onPickTextbook={() => setPickTextbook(true)} onExample={(c) => send(c)} onOpenSaved={openSaved} mobile={mobile} />
          ) : (
            <article ref={docRef} style={{ maxWidth: 800, margin: "0 auto", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "var(--shadow-card, 0 10px 30px -18px rgba(30,40,60,.18))", padding: mobile ? "22px 18px" : "34px 42px" }}>
            <header style={{ textAlign: "center", marginBottom: 22 }}>
              <h1 contentEditable suppressContentEditableWarning style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 800, color: "var(--ink)", outline: "none" }}>《{doc.topic}》{doc.docType || "教学设计"}</h1>
              <div style={{ display: "flex", justifyContent: "center", gap: 7, flexWrap: "wrap" }}>
                {[doc.edition, doc.subject, doc.grade, doc.periods, doc.type].map((c, i) => (
                  <span key={i} style={{ padding: "3px 11px", borderRadius: 999, background: "var(--surface-2)", border: "1px solid var(--line)", fontSize: 11.5, fontWeight: 700, color: "var(--ink-2)" }}>{c}</span>
                ))}
              </div>
            </header>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {doc.sections.map((sec, i) => <LsSection key={sec.id} sec={sec} idx={i} animate />)}
            </div>
            <footer style={{ marginTop: 26, paddingTop: 14, borderTop: "1px dashed var(--line)", textAlign: "center", fontSize: 11.5, color: "var(--ink-3)" }}>
              本设计对齐课程标准 · 结构参考学科网三审三校权威范例
            </footer>
            </article>
          )}
        </div>
        {toast && (
          <div style={{ position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)", background: "oklch(0.3 0.01 260 / .95)", color: "#fff", fontSize: 12.5, fontWeight: 600, padding: "9px 16px", borderRadius: 11, zIndex: 40, whiteSpace: "nowrap" }}>{toast}</div>
        )}
        {/* 切换教材抽屉：学段 / 学科 / 版本 / 册别 → 章节目录 */}
        <div onClick={() => setPickTextbook(false)} style={{ position: "fixed", inset: 0, zIndex: 84, background: "rgba(20,16,10,.42)", backdropFilter: "blur(2px)", opacity: pickTextbook ? 1 : 0, pointerEvents: pickTextbook ? "auto" : "none", transition: "opacity .2s" }} />
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 85, width: mobile ? "100%" : "min(560px, 94vw)", background: "var(--canvas)", boxShadow: "-20px 0 60px -30px rgba(0,0,0,.5)", transform: pickTextbook ? "translateX(0)" : "translateX(102%)", transition: "transform .26s cubic-bezier(.22,1,.36,1)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "13px 18px", borderBottom: "1px solid var(--line)", background: "var(--surface)", flexShrink: 0 }}>
            <span style={{ width: 28, height: 28, borderRadius: 9, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)" }}><CIcon name="book" size={16} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--ink)" }}>选择教材</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600 }}>学段 · 学科 · 版本 · 册别 → 章节目录</div>
            </div>
            <button onClick={() => setPickTextbook(false)} aria-label="关闭" style={{ width: 30, height: 30, borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink-3)", display: "grid", placeItems: "center", cursor: "pointer" }}><Icon name="close" size={15} /></button>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            {pickTextbook && <LessonTextbookPicker current={textbook} onApply={(tb) => { setTextbook({ ...tb, _chosen: true }); setPickTextbook(false); }} onWrite={(tb, topic) => { setTextbook({ ...tb, _chosen: true }); setPickTextbook(false); send(`${tb.edition}${lzGrade(tb)}${tb.subject}《${topic}》${docType}`); }} docType={docType} mobile={mobile} />}
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}

// ---- 写教案启动页（右侧辅助区）：对话优先，章节目录近顶部、按需展开 ----
function LessonStartPage({ textbook, docType, loggedIn, savedDocs, onWrite, onPickTextbook, onExample, onOpenSaved, mobile }) {
  const catalog = lzCatalog(textbook);
  const [catOpen, setCatOpen] = lS(false);
  const firstSec = (catalog[0] && catalog[0].secs[0]) || "本节";
  const secondSec = (catalog[0] && catalog[0].secs[1]) || (catalog[1] && catalog[1].secs[0]) || firstSec;
  // 自然语言示例 —— 桥：教用户怎么向左侧对话框开口
  const examples = [
    `备《${firstSec}》的${docType}`,
    `${secondSec}，重点突出探究活动`,
    `这一节的重难点该怎么处理`,
  ];
  const recents = (savedDocs || []).slice(-3).reverse();

  return (
    <div className="home-fade" style={{ height: "100%", display: "grid", placeItems: "center", padding: mobile ? 16 : 24 }}>
    <div style={{ width: "min(540px,100%)" }}>
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ display: "inline-flex", marginBottom: 13 }}><ScenarioGlyph icon="lesson" hue={320} size={52} active /></div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", margin: "0 0 6px" }}>来写教案吧</h2>
        <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: 0, lineHeight: 1.6 }}>在左侧告诉我课题或描述写教案的需求，也可以直接选择教材章节</p>
      </div>

      {/* 本册目录 or 选教材入口 */}
      {textbook && textbook._chosen ? (
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", marginBottom: 18 }}>
        <button onClick={() => setCatOpen((v) => !v)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 15px", border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-zh)", textAlign: "left" }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--brand-soft)", border: "1px solid var(--brand-soft-border)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}><Icon name="list" size={15} /></span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>从本册目录里挑一节</span>
            <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lzLabel(textbook)}</span>
          </span>
          <button onClick={(e) => { e.stopPropagation(); onPickTextbook(); }} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface-2)", color: "var(--ink-3)", fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", flexShrink: 0 }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.color = "var(--brand-deep)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--ink-3)"; }}>
            <Icon name="refresh" size={12} /> 换教材
          </button>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "var(--ink-3)", flexShrink: 0 }}>
            {catOpen ? "收起" : "展开"}
            <span style={{ display: "inline-flex", transform: catOpen ? "rotate(180deg)" : "none", transition: "transform .18s" }}><Icon name="chevron" size={14} /></span>
          </span>
        </button>
        {catOpen && (
          <div className="zx-pop" style={{ borderTop: "1px solid var(--line)" }}>
            {catalog.map((c, ci) => (
              <div key={ci} style={{ borderTop: ci ? "1px solid var(--line)" : "none" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-2)", padding: "10px 15px 6px", background: "var(--surface-2)" }}>{c.ch}</div>
                {c.secs.map((s, si) => (
                  <button key={si} onClick={() => onWrite(s)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 15px", border: "none", borderTop: si ? "1px solid var(--line)" : "none", background: "transparent", color: "var(--ink)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", textAlign: "left", transition: "background .14s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--brand-soft)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                    <span style={{ flex: 1, minWidth: 0 }}>{s}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "var(--brand-deep)", flexShrink: 0 }}>写{docType} <Icon name="arrow" size={12} /></span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      ) : (
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <button onClick={onPickTextbook} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", borderRadius: 13, border: "1px solid var(--brand-soft-border)", background: "var(--brand-soft)", color: "var(--brand-deep)", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)", transition: "all .15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--brand)"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--brand-soft)"; e.currentTarget.style.color = "var(--brand-deep)"; }}>
          <CIcon name="book" size={16} /> 选教材章节
        </button>
      </div>
      )}

      {/* 试试这样问 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-3)", marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="spark" size={14} /> 试试这样问
        </div>
        {examples.map((ex, i) => (
          <button key={i} onClick={() => onExample(ex)} style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left", padding: "12px 14px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", fontSize: 13, fontWeight: 600, lineHeight: 1.5, cursor: "pointer", fontFamily: "var(--font-zh)", transition: "all .15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px -6px rgba(0,0,0,.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
            <Icon name="spark" size={14} />
            <span style={{ flex: 1 }}>{ex}</span>
            <Icon name="arrow" size={13} />
          </button>
        ))}
      </div>

      {/* 接着上次 */}
      {recents.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "0 2px 9px", fontSize: 12, fontWeight: 800, color: "var(--ink-3)" }}>
            <CIcon name="lesson" size={13} /> 接着上次
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recents.map((s, i) => {
              const idx = (savedDocs || []).indexOf(s);
              return (
                <button key={i} onClick={() => onOpenSaved(idx)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 14px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", cursor: "pointer", fontFamily: "var(--font-zh)", textAlign: "left", transition: "all .15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; }}>
                  <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--surface-2)", border: "1px solid var(--line)", display: "grid", placeItems: "center", color: "var(--brand-deep)", flexShrink: 0 }}><CIcon name="lesson" size={15} /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>《{s.doc.topic}》{s.docType}</span>
                    <span style={{ display: "block", fontSize: 11, color: "var(--ink-3)", fontWeight: 600 }}>{s.doc.edition} · {s.doc.grade} · {s.when}</span>
                  </span>
                  <Icon name="arrow" size={14} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

// ---- 教材选择器（学段 / 学科 / 版本 / 册别 → 章节目录）----
function LessonTextbookPicker({ current, onApply, onWrite, docType, mobile }) {
  const [stage, setStage] = lS(current.stage || "初中");
  const [subject, setSubject] = lS(current.subject || "数学");
  const [edition, setEdition] = lS(current.edition || "人教版");
  const books = lzBooks(stage);
  const [book, setBook] = lS(books.includes(current.book) ? current.book : books[0]);
  const ready = stage && subject && edition && book;
  const tb = { stage, subject, edition, book };
  const catalog = ready ? lzCatalog(tb) : [];

  // 学段变化时，册别需重新归一
  const pickStage = (s) => { setStage(s); const bs = lzBooks(s); if (!bs.includes(book)) setBook(bs[0]); };

  const ChipRow = ({ label, opts, value, set }) => (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 13 }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-3)", width: 44, flexShrink: 0, paddingTop: 7 }}>{label}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {opts.map((o) => (
          <button key={o} onClick={() => set(o)} style={{ padding: "6px 13px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", border: value === o ? "1px solid var(--brand)" : "1px solid var(--line)", background: value === o ? "var(--brand-soft)" : "var(--surface)", color: value === o ? "var(--brand-deep)" : "var(--ink-2)", transition: "all .15s" }}>{o}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ padding: mobile ? "18px 16px 28px" : "22px 22px 32px" }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: "16px 18px", marginBottom: 18 }}>
        <ChipRow label="学段" opts={LZ_STAGES} value={stage} set={pickStage} />
        <ChipRow label="学科" opts={LZ_SUBJECTS} value={subject} set={setSubject} />
        <ChipRow label="版本" opts={LZ_EDITIONS} value={edition} set={setEdition} />
        <ChipRow label="册别" opts={books} value={book} set={setBook} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 11 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 800, color: "var(--ink-3)" }}><Icon name="list" size={14} /> {lzLabel(tb)} · 章节目录</span>
        <button onClick={() => onApply(tb)} style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 9, border: "1px solid var(--brand)", background: "var(--brand-soft)", color: "var(--brand-deep)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-zh)" }}>
          <Icon name="check" size={13} /> 选用本教材
        </button>
      </div>
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden" }}>
        {catalog.map((c, ci) => (
          <div key={ci} style={{ borderTop: ci ? "1px solid var(--line)" : "none" }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--ink-2)", padding: "11px 15px 7px", background: "var(--surface-2)" }}>{c.ch}</div>
            {c.secs.map((s, si) => (
              <button key={si} onClick={() => onWrite(tb, s)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 15px", border: "none", borderTop: si ? "1px solid var(--line)" : "none", background: "transparent", color: "var(--ink)", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)", textAlign: "left", transition: "background .14s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--brand-soft)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                <span style={{ flex: 1, minWidth: 0 }}>{s}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, color: "var(--brand-deep)", flexShrink: 0 }}>写{docType} <Icon name="arrow" size={13} /></span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { LessonWorkspace });


// ======== workspace_mindmap.jsx ========
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


// ======== workspace_assistant.jsx ========
// workspace_assistant.jsx — 通用助手 (general assistant)
// Intent recognition happens HERE first; if a specific scenario is matched,
// we hand off to that workspace. Otherwise the assistant answers directly.
const { useState: gaS, useEffect: gaE, useRef: gaR } = React;

// ---- content-aware mock answers (knowledge Q&A / teaching consult / grade analysis) ----
// A small hand-written knowledge base + pattern responses so the assistant feels
// like it actually answered, instead of echoing a template.
const GA_KB = [
  { re: /悬浊液|乳浊液/, title: "悬浊液 vs 乳浊液", body: [
    "都是把一种物质分散到液体里、静置会分层的不均一、不稳定混合物，区别在分散质的状态：",
    "· 悬浊液：固体小颗粒分散在液体中，如泥水、石灰乳；",
    "· 乳浊液：小液滴分散在液体中，如牛奶、油水混合物。",
    "课堂上可让学生各举一例并解释为什么久置会分层。",
  ] },
  { re: /牛顿第二定律|F\s*=\s*ma|加速度.*合外力|合外力.*加速度/, title: "牛顿第二定律", body: [
    "F = ma：物体加速度的大小与所受合外力成正比、与质量成反比，方向与合外力方向相同。",
    "讲解三个易错点：① 是「合外力」而非某一个力；② 瞬时对应（力变 a 立即变）；③ 矢量式，要分方向列方程。",
    "建议用「同一辆车，空载 vs 满载，同样的推力谁加速更快」的情境引入。",
  ] },
  { re: /蒸发|沸腾/, title: "蒸发与沸腾的区别", body: [
    "两者都是汽化，但：蒸发只在液体表面、任何温度都能发生、缓慢；沸腾在液体表面和内部同时进行、要达到沸点、剧烈。",
    "可用「湿衣服晾干」对「烧开水冒泡」两个生活场景对比引出。",
  ] },
  { re: /文言|实词|虚词|之乎者也|翻译.*(文言|古文)/, title: "文言文复习思路", body: [
    "抓「一词多义、古今异义、词类活用、特殊句式」四条主线，配合课文逐句落实。",
    "建议先做课内重点篇目的字词清单，再用同主题课外短文迁移检测。",
  ] },
];

function gradeAnalysis(query) {
  const nums = (query.match(/\d+(\.\d+)?/g) || []).map(Number);
  const avg = nums.find((n) => n > 0 && n <= 150);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.75 }}>
        收到这组成绩数据，我从<b style={{ color: "var(--brand-deep)" }}>整体水平、分化程度、薄弱点</b>三方面给你一个分析框架：
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.85 }}>
        <li><b>整体水平</b>：{avg ? `平均分 ${avg}` : "平均分"}对照年级均分判断班级位次，及格率反映基础达标情况。</li>
        <li><b>分化程度</b>：优秀率与及格率的差距越大，说明两极分化越明显，需关注「中间段」学生。</li>
        <li><b>薄弱点定位</b>：建议把试卷按知识板块统计得分率，找出全班得分率最低的 2–3 个考点重点讲评。</li>
      </ul>
      <div style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.7 }}>
        把成绩表传给我，我可以直接生成<b style={{ color: "var(--brand-deep)" }}>班级质量分析报告</b>，含分数段分布、薄弱知识点和针对性建议。
      </div>
    </div>
  );
}

function teachingConsult(query) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.75 }}>
        这是个教学设计层面的问题，给你几条可落地的思路：
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.85 }}>
        <li><b>情境驱动</b>：用一个贴近学生生活或真实问题的情境导入，让知识「有用武之地」。</li>
        <li><b>活动设计</b>：设置 1–2 个学生动手或合作的环节（实验、辩论、小组探究），避免满堂灌。</li>
        <li><b>AI 应用</b>：可用互动课件做即时投票/抢答，或用 AI 生成分层练习当堂检测。</li>
        <li><b>评价闭环</b>：留 3–5 分钟用小问题检验目标达成，并预留弹性时间。</li>
      </ul>
      <div style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.7 }}>
        需要的话，我可以直接把它落成<b style={{ color: "var(--brand-deep)" }}>教案、课件或教学计划</b>——说一声就带你进对应工作台。
      </div>
    </div>
  );
}

function knowledgeAnswer(query, hit) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>{hit.title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.8 }}>
        {hit.body.map((line, i) => <div key={i}>{line}</div>)}
      </div>
    </div>
  );
}

function GeneralAnswer({ query }) {
  const q = query || "";
  const hit = GA_KB.find((k) => k.re.test(q));
  const isTranslate = /翻译|translate|用英(语|文)|英文怎么(说|表达)|中文怎么说/.test(q);
  const isGrades = /(平均分|及格率|优秀率|成绩|质量分析)/.test(q) && /\d/.test(q);
  const isConsult = /(公开课|建议|教学计划|复习计划|备课|怎么(讲|上|教|引入|提升|设计)|如何(讲|上|教|提升|设计|引入)|有没有.*办法|思路)/.test(q);

  let content;
  if (hit) content = knowledgeAnswer(q, hit);
  else if (isGrades) content = gradeAnalysis(q);
  else if (isTranslate) content = (
    <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.75 }}>
      可以，把要翻译的<b style={{ color: "var(--brand-deep)" }}>原文（中/英）</b>发给我即可。我会给出准确译文，并可按需附上重点字词的解释，适合直接用于课堂或讲义。
    </div>
  );
  else if (isConsult) content = teachingConsult(q);
  else content = (
    <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.75 }}>
      关于「{q.replace(/[《》"]/g, "").slice(0, 24)}」，我的建议是：先用一句话讲清核心概念，再用一个贴近学生生活的情境切入，最后用 2–3 个由浅入深的小问题检验理解。需要我把它做成<b style={{ color: "var(--brand-deep)" }}>课件、教案或练习</b>，随时说一声，我就带你进对应的工作台。
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {content}
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--auth-ink)", background: "var(--auth-bg)", border: "1px solid var(--auth-border)", borderRadius: 10, padding: "8px 11px" }}>
        <Icon name="shield" size={13} /> 回答参考学科网权威教研资源，成稿可一键溯源教材原文
      </div>
    </div>
  );
}

// centered single-column chat (assistant feel, not the split workspace)
function CenteredChat({ messages, onSend, suggestions, placeholder, recognizing }) {
  const [draft, setDraft] = gaS("");
  const [att, setAtt] = gaS([]);
  const scrollRef = gaR(null);
  const taRef = gaR(null);
  gaE(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);
  // auto-grow textarea: 1 line → up to 5 lines, then scroll inside
  gaE(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxH = Math.round(14 * 1.5 * 5) + 10; // 5 lines + padding
    const next = Math.min(el.scrollHeight, maxH);
    el.style.height = next + "px";
    el.style.overflowY = el.scrollHeight > maxH + 1 ? "auto" : "hidden";
  }, [draft]);
  const send = (txt) => {
    const v = (txt ?? draft).trim();
    if (!v && att.length === 0) return;
    onSend(v, att);
    setDraft("");
    setAtt([]);
  };
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "var(--canvas)" }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "26px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
          {messages.map((m, i) => (
            <Bubble key={i} m={m} />
          ))}
        </div>
      </div>
      {!recognizing && (
        <div style={{ padding: "0 24px 18px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            {suggestions && suggestions.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => send(s)}
                    className="sug-pop"
                    style={{ animationDelay: `${i * 0.05}s`, display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 999, border: "1px dashed var(--brand-soft-border)", background: "var(--brand-soft)", color: "var(--brand-deep)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-zh)" }}
                  >
                    <Icon name="spark" size={12} /> {s}
                  </button>
                ))}
              </div>
            )}
            <FileChips files={att} onRemove={(i) => setAtt((f) => f.filter((_, j) => j !== i))} style={{ marginBottom: 8 }} />
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: 10, boxShadow: "0 6px 20px -16px rgba(0,0,0,.3)" }}>
              <textarea
                ref={taRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                rows={1}
                placeholder={placeholder || "问我任何教学问题…"}
                style={{ flex: 1, border: "none", outline: "none", background: "transparent", resize: "none", fontSize: 14, fontFamily: "var(--font-zh)", color: "var(--ink)", lineHeight: 1.5, padding: "5px 4px", overflowY: "hidden", boxSizing: "border-box" }}
              />
              <ClipButton onFiles={(names) => setAtt((f) => [...f, ...names].slice(0, 6))} compact />
              <button onClick={() => send()} style={{ width: 36, height: 36, borderRadius: 11, border: "none", background: "var(--brand-grad)", backgroundColor: "var(--brand)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}>
                <Icon name="send" size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- The stage (right pane) for the general assistant: scenarios open here ----
function GeneralStage({ onSwitch, recognizing }) {
  const SC = window.AIDATA.SCENARIOS.filter((s) => !(window.AIDATA.HIDDEN_SCENARIOS || []).includes(s.id));
  return (
    <div style={{ flex: 1, minWidth: 0, overflowY: "auto", display: "grid", placeItems: "center", padding: "30px 24px", background: "var(--canvas)" }}>
      <div className="home-fade" style={{ width: "min(560px, 100%)", textAlign: "center" }}>
        {recognizing ? (
          <React.Fragment>
            <div style={{ position: "relative", display: "inline-flex", marginBottom: 16 }}>
              <BotAvatar size={52} glow />
              <span className="bot-ring" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", margin: "0 0 8px" }}>正在理解你的需求…</h2>
            <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.65, margin: 0 }}>如果需要动手创作，我会在这里为你打开对应的场景。</p>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", margin: "0 0 8px" }}>这里是场景区</h2>
            <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.7, margin: "0 0 22px" }}>
              在左侧告诉我你想做什么，我理解后会在这里为你打开对应场景；<br />也可以直接选一个开始 —— 对话不会中断。
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
              {SC.map((s, i) => (
                <button
                  key={s.id}
                  className="chip-pop"
                  onClick={() => onSwitch && onSwitch(s.id, "")}
                  style={{ animationDelay: `${i * 0.05}s`, display: "flex", alignItems: "center", gap: 10, padding: "12px 13px", borderRadius: 14, border: "1px solid var(--line)", background: "var(--surface)", cursor: "pointer", fontFamily: "var(--font-zh)", textAlign: "left", transition: "transform .18s var(--ease-out), border-color .2s, box-shadow .2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = `oklch(0.78 0.09 ${s.hue})`; e.currentTarget.style.boxShadow = `0 10px 22px -12px oklch(0.55 0.12 ${s.hue} / .5)`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <ScenarioGlyph icon={s.icon} hue={s.hue} size={36} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.tagline}</div>
                  </div>
                </button>
              ))}
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

function GeneralWorkspace({ query, fromIntent, onHome, onSwitch, nav }) {
  const GEN = window.AIDATA.GENERAL;
  const willRecognize = fromIntent && !!query;
  const [recognizing, setRecognizing] = gaS(willRecognize);

  const recapRef = gaR(null);
  const handleRecognized = (target) => {
    if (target && target !== "general") {
      onSwitch(target, query);
      return;
    }
    setRecognizing(false);
    setMessages((m) => [...m, { role: "ai", node: <GeneralAnswer query={query} /> }]);
    setSugs(["展开讲讲", "给我一个课堂导入", "帮我整理成要点"]);
  };

  const [messages, setMessages] = gaS(() => {
    if (willRecognize) {
      return [
        ...window.ChatSession.take(),
        ...window.takeSwitchDivider(GEN, window.ChatSession.log.length > 0),
        ...(window.ChatSession.echoed(query) ? [] : [{ role: "user", text: query }]),
        { role: "ai", wide: true, intent: query, render: () => <InlineIntent query={query} onDone={(t) => recapRef.current(t)} /> },
      ];
    }
    const hist = window.ChatSession.take();
    if (hist.length) return window.enterThread(GEN);
    return [
      ...hist,
      { role: "ai", node: (
        <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.75 }}>
          <span>你好，我是 <b style={{ color: "var(--brand-deep)" }}>AI 小博士</b>。教学上的问题都可以问我；当你需要找资料、做课件、写教案时，我会在右侧为你打开对应的场景。</span>
        </div>
      ) },
    ];
  });
  const [sugs, setSugs] = gaS(willRecognize ? [] : ["悬浊液和乳浊液的区别", "我要上公开课，有什么学生活动建议？", "平均分 72、及格率 85%，帮我分析", "近三年化学高考实验安全的考查规律"]);
  recapRef.current = handleRecognized;
  // persist the thread — the assistant keeps ONE conversation across scenario switches
  gaE(() => { window.ChatSession.save(window.freezeChat(messages)); }, [messages]);

  const handleSend = (text) => {
    // a follow-up might itself be a specific request → re-route
    const t = window.detectSwitchTarget ? window.detectSwitchTarget(text) : null;
    if (t && t !== "general") {
      setMessages((m) => [...m, { role: "user", text }]);
      setTimeout(() => onSwitch(t, text), 300);
      return;
    }
    setMessages((m) => [...m, { role: "user", text }, { role: "ai", node: <GeneralAnswer query={text} /> }]);
    setSugs([]);
  };

  return (
    <WorkspaceShell scenario={GEN} onHome={onHome} onSwitch={onSwitch} nav={nav} headerRecognizing={recognizing} mobilePanelLabel="场景" mobilePanelIcon="grid">
      <ChatPanel
        messages={messages}
        onSend={handleSend}
        suggestions={recognizing ? [] : sugs}
        placeholder="问我任何教学问题，或描述你想创作的内容…"
      />
      <GeneralStage onSwitch={onSwitch} recognizing={recognizing} />
    </WorkspaceShell>
  );
}

Object.assign(window, { GeneralWorkspace });


// ======== workspace_stubs.jsx ========
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


// ======== app.jsx ========
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
