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
  const noDivider = ChatSession.noDivider || false;
  ChatSession.noDivider = false;
  if (!hasHistory || noDivider) return [];
  const back = meta && meta.source === "auto" && meta.from && meta.from.id !== scenario.id ? meta.from : null;
  return [{ role: "sys", text: `已切到「${scenario.name}」`, icon: scenario.icon, back }];
}
Object.assign(window, { enterThread, takeSwitchDivider });


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
    const t1 = setTimeout(() => {
      setPhase("collapsed");
      onDone && onDone(result);
    }, 1200);
    return () => clearTimeout(t1);
  }, []);
  const entities = result.entities ? result.entities.filter(e => e.k !== "需求") : [];
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
  return (
    <div style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 500, padding: "2px 0", animation: "pulseBg .5s ease" }}>
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
