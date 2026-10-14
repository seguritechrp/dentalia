/* @ds-bundle: {"format":4,"namespace":"SeguriTechDesignSystem_019dda","components":[],"sourceHashes":{"slides/deck-stage.js":"0ef6f7c67690","ui_kits/saimon/Dashboard.jsx":"cceb5be0f184","ui_kits/saimon/Login.jsx":"0594a0ea882e"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.SeguriTechDesignSystem_019dda = window.SeguriTechDesignSystem_019dda || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// slides/deck-stage.js
try { (() => {
/**
 * <deck-stage> — reusable web component for HTML decks.
 *
 * Handles:
 *  (a) speaker notes — reads <script type="application/json" id="speaker-notes">
 *      and posts {slideIndexChanged: N} to the parent window on nav.
 *  (b) keyboard navigation — ←/→, PgUp/PgDn, Space, Home/End, number keys.
 *  (c) press R to reset to slide 0 (with a tasteful keyboard hint).
 *  (d) bottom-center overlay showing slide count + hints, fades out on idle.
 *  (e) auto-scaling — inner canvas is a fixed design size (default 1920×1080)
 *      scaled with `transform: scale()` to fit the viewport, letterboxed.
 *      Set the `noscale` attribute to render at authored size (1:1) — the
 *      PPTX exporter sets this so its DOM capture sees unscaled geometry.
 *  (f) print — `@media print` lays every slide out as its own page at the
 *      design size, so the browser's Print → Save as PDF produces a clean
 *      one-page-per-slide PDF with no extra setup.
 *
 * Slides are HIDDEN, not unmounted. Non-active slides stay in the DOM with
 * `visibility: hidden` + `opacity: 0`, so their state (videos, iframes,
 * form inputs, React trees) is preserved across navigation.
 *
 * Lifecycle event — the component dispatches a `slidechange` CustomEvent on
 * itself whenever the active slide changes (including the initial mount).
 * The event bubbles and composes out of shadow DOM, so you can listen on
 * the <deck-stage> element or on document:
 *
 *   document.querySelector('deck-stage').addEventListener('slidechange', (e) => {
 *     e.detail.index         // new 0-based index
 *     e.detail.previousIndex // previous index, or -1 on init
 *     e.detail.total         // total slide count
 *     e.detail.slide         // the new active slide element
 *     e.detail.previousSlide // the prior slide element, or null on init
 *     e.detail.reason        // 'init' | 'keyboard' | 'click' | 'tap' | 'api'
 *   });
 *
 * Persistence: none at the deck level. The host app keeps the current slide
 * in its own URL (?slide=) and re-delivers it via location.hash on load, so a
 * bare load with no hash always starts at slide 1.
 *
 * Usage:
 *   <deck-stage width="1920" height="1080">
 *     <section data-label="Title">...</section>
 *     <section data-label="Agenda">...</section>
 *   </deck-stage>
 *
 * Slides are the direct element children of <deck-stage>. Each slide is
 * automatically tagged with:
 *   - data-screen-label="NN Label"   (1-indexed, for comment flow)
 *   - data-om-validate="no_overflowing_text,no_overlapping_text,slide_sized_text"
 */

(() => {
  const DESIGN_W_DEFAULT = 1920;
  const DESIGN_H_DEFAULT = 1080;
  const OVERLAY_HIDE_MS = 1800;
  const VALIDATE_ATTR = 'no_overflowing_text,no_overlapping_text,slide_sized_text';
  const pad2 = n => String(n).padStart(2, '0');
  const stylesheet = `
    :host {
      position: fixed;
      inset: 0;
      display: block;
      background: #000;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif;
      overflow: hidden;
    }

    .stage {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .canvas {
      position: relative;
      transform-origin: center center;
      flex-shrink: 0;
      background: #fff;
      will-change: transform;
    }

    /* Slides live in light DOM (via <slot>) so authored CSS still applies.
       We absolutely position each slotted child to stack them. */
    ::slotted(*) {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      box-sizing: border-box !important;
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
      visibility: hidden;
    }
    ::slotted([data-deck-active]) {
      opacity: 1;
      pointer-events: auto;
      visibility: visible;
    }

    /* Tap zones for mobile — back/forward thirds like Stories.
       Transparent, no visible UI, don't block the overlay. */
    .tapzones {
      position: fixed;
      inset: 0;
      display: flex;
      z-index: 2147482000;
      pointer-events: none;
    }
    .tapzone {
      flex: 1;
      pointer-events: auto;
      -webkit-tap-highlight-color: transparent;
    }
    /* Only activate tap zones on coarse pointers (touch devices). */
    @media (hover: hover) and (pointer: fine) {
      .tapzones { display: none; }
    }

    .overlay {
      position: fixed;
      left: 50%;
      bottom: 22px;
      transform: translate(-50%, 6px) scale(0.92);
      filter: blur(6px);
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px;
      background: #000;
      color: #fff;
      border-radius: 999px;
      font-size: 12px;
      font-feature-settings: "tnum" 1;
      letter-spacing: 0.01em;
      opacity: 0;
      pointer-events: none;
      transition: opacity 260ms ease, transform 260ms cubic-bezier(.2,.8,.2,1), filter 260ms ease;
      transform-origin: center bottom;
      z-index: 2147483000;
      user-select: none;
    }
    .overlay[data-visible] {
      opacity: 1;
      pointer-events: auto;
      transform: translate(-50%, 0) scale(1);
      filter: blur(0);
    }

    .btn {
      appearance: none;
      -webkit-appearance: none;
      background: transparent;
      border: 0;
      margin: 0;
      padding: 0;
      color: inherit;
      font: inherit;
      cursor: default;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 28px;
      min-width: 28px;
      border-radius: 999px;
      color: rgba(255,255,255,0.72);
      transition: background 140ms ease, color 140ms ease;
      -webkit-tap-highlight-color: transparent;
    }
    .btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
    .btn:active { background: rgba(255,255,255,0.18); }
    .btn:focus { outline: none; }
    .btn:focus-visible { outline: none; }
    .btn::-moz-focus-inner { border: 0; }
    .btn svg { width: 14px; height: 14px; display: block; }
    .btn.reset {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.02em;
      padding: 0 10px 0 12px;
      gap: 6px;
      color: rgba(255,255,255,0.72);
    }
    .btn.reset .kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      font-size: 10px;
      line-height: 1;
      color: rgba(255,255,255,0.88);
      background: rgba(255,255,255,0.12);
      border-radius: 4px;
    }

    .count {
      font-variant-numeric: tabular-nums;
      color: #fff;
      font-weight: 500;
      padding: 0 8px;
      min-width: 42px;
      text-align: center;
      font-size: 12px;
    }
    .count .sep { color: rgba(255,255,255,0.45); margin: 0 3px; font-weight: 400; }
    .count .total { color: rgba(255,255,255,0.55); }

    .divider {
      width: 1px;
      height: 14px;
      background: rgba(255,255,255,0.18);
      margin: 0 2px;
    }

    /* ── Print: one page per slide, no chrome ────────────────────────────
       The screen layout stacks every slide at inset:0 inside a scaled
       canvas; for print we want them in document flow at the authored
       design size so the browser paginates one slide per sheet. The
       @page size is set from the width/height attributes via the inline
       <style id="deck-stage-print-page"> that connectedCallback injects
       into <head> (the @page at-rule has no effect inside shadow DOM). */
    @media print {
      :host {
        position: static;
        inset: auto;
        background: none;
        overflow: visible;
        color: inherit;
      }
      .stage { position: static; display: block; }
      .canvas {
        transform: none !important;
        width: auto !important;
        height: auto !important;
        background: none;
        will-change: auto;
      }
      ::slotted(*) {
        position: relative !important;
        inset: auto !important;
        width: var(--deck-design-w) !important;
        height: var(--deck-design-h) !important;
        box-sizing: border-box !important;
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto;
        break-after: page;
        page-break-after: always;
        break-inside: avoid;
        overflow: hidden;
      }
      ::slotted(*:last-child) {
        break-after: auto;
        page-break-after: auto;
      }
      .overlay, .tapzones { display: none !important; }
    }
  `;
  class DeckStage extends HTMLElement {
    static get observedAttributes() {
      return ['width', 'height', 'noscale'];
    }
    constructor() {
      super();
      this._root = this.attachShadow({
        mode: 'open'
      });
      this._index = 0;
      this._slides = [];
      this._notes = [];
      this._hideTimer = null;
      this._mouseIdleTimer = null;
      this._onKey = this._onKey.bind(this);
      this._onResize = this._onResize.bind(this);
      this._onSlotChange = this._onSlotChange.bind(this);
      this._onMouseMove = this._onMouseMove.bind(this);
      this._onTapBack = this._onTapBack.bind(this);
      this._onTapForward = this._onTapForward.bind(this);
    }
    get designWidth() {
      return parseInt(this.getAttribute('width'), 10) || DESIGN_W_DEFAULT;
    }
    get designHeight() {
      return parseInt(this.getAttribute('height'), 10) || DESIGN_H_DEFAULT;
    }
    connectedCallback() {
      this._render();
      this._loadNotes();
      this._syncPrintPageRule();
      window.addEventListener('keydown', this._onKey);
      window.addEventListener('resize', this._onResize);
      window.addEventListener('mousemove', this._onMouseMove, {
        passive: true
      });
      // Initial collection + layout happens via slotchange, which fires on mount.
    }
    disconnectedCallback() {
      window.removeEventListener('keydown', this._onKey);
      window.removeEventListener('resize', this._onResize);
      window.removeEventListener('mousemove', this._onMouseMove);
      if (this._hideTimer) clearTimeout(this._hideTimer);
      if (this._mouseIdleTimer) clearTimeout(this._mouseIdleTimer);
    }
    attributeChangedCallback() {
      if (this._canvas) {
        this._canvas.style.width = this.designWidth + 'px';
        this._canvas.style.height = this.designHeight + 'px';
        this._canvas.style.setProperty('--deck-design-w', this.designWidth + 'px');
        this._canvas.style.setProperty('--deck-design-h', this.designHeight + 'px');
        this._fit();
        this._syncPrintPageRule();
      }
    }
    _render() {
      const style = document.createElement('style');
      style.textContent = stylesheet;
      const stage = document.createElement('div');
      stage.className = 'stage';
      const canvas = document.createElement('div');
      canvas.className = 'canvas';
      canvas.style.width = this.designWidth + 'px';
      canvas.style.height = this.designHeight + 'px';
      canvas.style.setProperty('--deck-design-w', this.designWidth + 'px');
      canvas.style.setProperty('--deck-design-h', this.designHeight + 'px');
      const slot = document.createElement('slot');
      slot.addEventListener('slotchange', this._onSlotChange);
      canvas.appendChild(slot);
      stage.appendChild(canvas);

      // Tap zones (mobile): left third = back, right third = forward.
      const tapzones = document.createElement('div');
      tapzones.className = 'tapzones export-hidden';
      tapzones.setAttribute('aria-hidden', 'true');
      const tzBack = document.createElement('div');
      tzBack.className = 'tapzone tapzone--back';
      const tzMid = document.createElement('div');
      tzMid.className = 'tapzone tapzone--mid';
      tzMid.style.pointerEvents = 'none';
      const tzFwd = document.createElement('div');
      tzFwd.className = 'tapzone tapzone--fwd';
      tzBack.addEventListener('click', this._onTapBack);
      tzFwd.addEventListener('click', this._onTapForward);
      tapzones.append(tzBack, tzMid, tzFwd);

      // Overlay: compact, solid black, with clickable controls.
      const overlay = document.createElement('div');
      overlay.className = 'overlay export-hidden';
      overlay.setAttribute('role', 'toolbar');
      overlay.setAttribute('aria-label', 'Deck controls');
      overlay.innerHTML = `
        <button class="btn prev" type="button" aria-label="Previous slide" title="Previous (←)">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3L5 8l5 5"/></svg>
        </button>
        <span class="count" aria-live="polite"><span class="current">1</span><span class="sep">/</span><span class="total">1</span></span>
        <button class="btn next" type="button" aria-label="Next slide" title="Next (→)">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3l5 5-5 5"/></svg>
        </button>
        <span class="divider"></span>
        <button class="btn reset" type="button" aria-label="Reset to first slide" title="Reset (R)">Reset<span class="kbd">R</span></button>
      `;
      overlay.querySelector('.prev').addEventListener('click', () => this._go(this._index - 1, 'click'));
      overlay.querySelector('.next').addEventListener('click', () => this._go(this._index + 1, 'click'));
      overlay.querySelector('.reset').addEventListener('click', () => this._go(0, 'click'));
      this._root.append(style, stage, tapzones, overlay);
      this._canvas = canvas;
      this._slot = slot;
      this._overlay = overlay;
      this._countEl = overlay.querySelector('.current');
      this._totalEl = overlay.querySelector('.total');
    }

    /** @page must live in the document stylesheet — it's a no-op inside
     *  shadow DOM. Inject/update a single <head> style tag so the print
     *  sheet matches the design size and Save-as-PDF yields one slide per
     *  page with no margins. */
    _syncPrintPageRule() {
      const id = 'deck-stage-print-page';
      let tag = document.getElementById(id);
      if (!tag) {
        tag = document.createElement('style');
        tag.id = id;
        document.head.appendChild(tag);
      }
      tag.textContent = '@page { size: ' + this.designWidth + 'px ' + this.designHeight + 'px; margin: 0; } ' + '@media print { html, body { margin: 0 !important; padding: 0 !important; background: none !important; overflow: visible !important; height: auto !important; } ' + '* { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }';
    }
    _onSlotChange() {
      this._collectSlides();
      this._restoreIndex();
      this._applyIndex({
        showOverlay: false,
        broadcast: true,
        reason: 'init'
      });
      this._fit();
    }
    _collectSlides() {
      const assigned = this._slot.assignedElements({
        flatten: true
      });
      this._slides = assigned.filter(el => {
        // Skip template/style/script nodes even if someone slots them.
        const tag = el.tagName;
        return tag !== 'TEMPLATE' && tag !== 'SCRIPT' && tag !== 'STYLE';
      });
      this._slides.forEach((slide, i) => {
        const n = i + 1;
        // Determine a label for comment flow: prefer explicit data-label,
        // then an existing data-screen-label, then first heading, else "Slide".
        let label = slide.getAttribute('data-label');
        if (!label) {
          const existing = slide.getAttribute('data-screen-label');
          if (existing) {
            // Strip any leading number the author may have included.
            label = existing.replace(/^\s*\d+\s*/, '').trim() || existing;
          }
        }
        if (!label) {
          const h = slide.querySelector('h1, h2, h3, [data-title]');
          if (h) label = (h.textContent || '').trim().slice(0, 40);
        }
        if (!label) label = 'Slide';
        slide.setAttribute('data-screen-label', `${pad2(n)} ${label}`);

        // Validation attribute for comment flow / auto-checks.
        if (!slide.hasAttribute('data-om-validate')) {
          slide.setAttribute('data-om-validate', VALIDATE_ATTR);
        }
        slide.setAttribute('data-deck-slide', String(i));
      });
      if (this._totalEl) this._totalEl.textContent = String(this._slides.length || 1);
      if (this._index >= this._slides.length) this._index = Math.max(0, this._slides.length - 1);
    }
    _loadNotes() {
      const tag = document.getElementById('speaker-notes');
      if (!tag) {
        this._notes = [];
        return;
      }
      try {
        const parsed = JSON.parse(tag.textContent || '[]');
        if (Array.isArray(parsed)) this._notes = parsed;
      } catch (e) {
        console.warn('[deck-stage] Failed to parse #speaker-notes JSON:', e);
        this._notes = [];
      }
    }
    _restoreIndex() {
      // The host's ?slide= param is delivered as a #<int> hash (1-indexed) on
      // the iframe src. No hash → slide 1; the deck itself keeps no position
      // state across loads.
      const h = (location.hash || '').match(/^#(\d+)$/);
      if (h) {
        const n = parseInt(h[1], 10) - 1;
        if (n >= 0 && n < this._slides.length) this._index = n;
      }
    }
    _applyIndex({
      showOverlay = true,
      broadcast = true,
      reason = 'init'
    } = {}) {
      if (!this._slides.length) return;
      const prev = this._prevIndex == null ? -1 : this._prevIndex;
      const curr = this._index;
      // Keep the iframe's own hash in sync so an in-iframe location.reload()
      // (reload banner path in viewer-handle.ts) lands on the current slide,
      // not the stale deep-link hash from initial load.
      try {
        history.replaceState(null, '', '#' + (curr + 1));
      } catch (e) {}
      this._slides.forEach((s, i) => {
        if (i === curr) s.setAttribute('data-deck-active', '');else s.removeAttribute('data-deck-active');
      });
      if (this._countEl) this._countEl.textContent = String(curr + 1);
      if (broadcast) {
        // (1) Legacy: host-window postMessage for speaker-notes renderers.
        try {
          window.postMessage({
            slideIndexChanged: curr
          }, '*');
        } catch (e) {}

        // (2) In-page CustomEvent on the <deck-stage> element itself.
        //     Bubbles and composes out of shadow DOM so slide code can listen:
        //       document.querySelector('deck-stage').addEventListener('slidechange', e => {
        //         e.detail.index, e.detail.previousIndex, e.detail.total, e.detail.slide, e.detail.reason
        //       });
        const detail = {
          index: curr,
          previousIndex: prev,
          total: this._slides.length,
          slide: this._slides[curr] || null,
          previousSlide: prev >= 0 ? this._slides[prev] || null : null,
          reason: reason // 'init' | 'keyboard' | 'click' | 'tap' | 'api'
        };
        this.dispatchEvent(new CustomEvent('slidechange', {
          detail,
          bubbles: true,
          composed: true
        }));
      }
      this._prevIndex = curr;
      if (showOverlay) this._flashOverlay();
    }
    _flashOverlay() {
      if (!this._overlay) return;
      this._overlay.setAttribute('data-visible', '');
      if (this._hideTimer) clearTimeout(this._hideTimer);
      this._hideTimer = setTimeout(() => {
        this._overlay.removeAttribute('data-visible');
      }, OVERLAY_HIDE_MS);
    }
    _fit() {
      if (!this._canvas) return;
      // PPTX export sets noscale so the DOM capture sees authored-size
      // geometry — the scaled canvas is in shadow DOM, so the exporter's
      // resetTransformSelector can't reach .canvas.style.transform directly.
      if (this.hasAttribute('noscale')) {
        this._canvas.style.transform = 'none';
        return;
      }
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const s = Math.min(vw / this.designWidth, vh / this.designHeight);
      this._canvas.style.transform = `scale(${s})`;
    }
    _onResize() {
      this._fit();
    }
    _onMouseMove() {
      // Keep overlay visible while mouse moves; hide after idle.
      this._flashOverlay();
    }
    _onTapBack(e) {
      e.preventDefault();
      this._go(this._index - 1, 'tap');
    }
    _onTapForward(e) {
      e.preventDefault();
      this._go(this._index + 1, 'tap');
    }
    _onKey(e) {
      // Ignore when the user is typing.
      const t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key;
      let handled = true;
      if (key === 'ArrowRight' || key === 'PageDown' || key === ' ' || key === 'Spacebar') {
        this._go(this._index + 1, 'keyboard');
      } else if (key === 'ArrowLeft' || key === 'PageUp') {
        this._go(this._index - 1, 'keyboard');
      } else if (key === 'Home') {
        this._go(0, 'keyboard');
      } else if (key === 'End') {
        this._go(this._slides.length - 1, 'keyboard');
      } else if (key === 'r' || key === 'R') {
        this._go(0, 'keyboard');
      } else if (/^[0-9]$/.test(key)) {
        // 1..9 jump to that slide; 0 jumps to 10.
        const n = key === '0' ? 9 : parseInt(key, 10) - 1;
        if (n < this._slides.length) this._go(n, 'keyboard');
      } else {
        handled = false;
      }
      if (handled) {
        e.preventDefault();
        this._flashOverlay();
      }
    }
    _go(i, reason = 'api') {
      if (!this._slides.length) return;
      const clamped = Math.max(0, Math.min(this._slides.length - 1, i));
      if (clamped === this._index) {
        this._flashOverlay();
        return;
      }
      this._index = clamped;
      this._applyIndex({
        showOverlay: true,
        broadcast: true,
        reason
      });
    }

    // Public API ------------------------------------------------------------

    /** Current slide index (0-based). */
    get index() {
      return this._index;
    }
    /** Total slide count. */
    get length() {
      return this._slides.length;
    }
    /** Programmatically navigate. */
    goTo(i) {
      this._go(i, 'api');
    }
    next() {
      this._go(this._index + 1, 'api');
    }
    prev() {
      this._go(this._index - 1, 'api');
    }
    reset() {
      this._go(0, 'api');
    }
  }
  if (!customElements.get('deck-stage')) {
    customElements.define('deck-stage', DeckStage);
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "slides/deck-stage.js", error: String((e && e.message) || e) }); }

// ui_kits/saimon/Dashboard.jsx
try { (() => {
const {
  useState: useDashState
} = React;
const NAV_ITEMS = [{
  id: 'ops',
  label: 'Operaciones',
  icon: 'M3 12l9-9 9 9M5 10v10h14V10'
}, {
  id: 'cameras',
  label: 'Cámaras',
  icon: 'M23 7l-7 5 7 5V7zM1 5h15v14H1z'
}, {
  id: 'alerts',
  label: 'Alertas',
  icon: 'M12 2L2 22h20L12 2zM12 9v6M12 18v.5'
}, {
  id: 'units',
  label: 'Unidades',
  icon: 'M3 7h18v10H3zM7 17v3M17 17v3'
}, {
  id: 'analytics',
  label: 'Analítica',
  icon: 'M3 20h18M5 16V8m6 8V4m6 12v-6'
}, {
  id: 'reports',
  label: 'Reportes',
  icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6'
}, {
  id: 'admin',
  label: 'Administración',
  icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l3-1.5-1.5-2.6L17 9 15.5 6 12 6.5 8.5 6 7 9l-3.5-1L2 10.5 5 12l-3 1.5L3.5 16 7 15l1.5 3 3.5-.5L15.5 18l1.5-3 3.5 1L22 13.5z'
}];
function Sidebar({
  active,
  onSelect,
  onLogout
}) {
  return /*#__PURE__*/React.createElement("aside", {
    style: dashStyles.sidebar
  }, /*#__PURE__*/React.createElement("div", {
    style: dashStyles.sidebarLogo
  }, /*#__PURE__*/React.createElement(SaimonLogo, {
    size: 0.55
  })), /*#__PURE__*/React.createElement("nav", {
    style: dashStyles.nav
  }, NAV_ITEMS.map(item => /*#__PURE__*/React.createElement("button", {
    key: item.id,
    onClick: () => onSelect(item.id),
    style: {
      ...dashStyles.navItem,
      ...(active === item.id ? dashStyles.navItemActive : {})
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: item.icon
  })), /*#__PURE__*/React.createElement("span", null, item.label), active === item.id && /*#__PURE__*/React.createElement("div", {
    style: dashStyles.navItemBar
  })))), /*#__PURE__*/React.createElement("div", {
    style: dashStyles.sidebarFooter
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onLogout,
    style: dashStyles.logoutBtn
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
  })), "Cerrar sesi\xF3n"), /*#__PURE__*/React.createElement("div", {
    style: dashStyles.versionTagSidebar
  }, "SDC-W \xB7 QA \xB7 v.4.1.10")));
}
function TopBar({
  user
}) {
  const now = new Date().toLocaleString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  return /*#__PURE__*/React.createElement("header", {
    style: dashStyles.topbar
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: dashStyles.topEyebrow
  }, "Centro de Mando \xB7 CDMX-01"), /*#__PURE__*/React.createElement("h1", {
    style: dashStyles.topTitle
  }, "Operaciones en Tiempo Real")), /*#__PURE__*/React.createElement("div", {
    style: dashStyles.topRight
  }, /*#__PURE__*/React.createElement("div", {
    style: dashStyles.searchWrap
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#8C9BAB",
    strokeWidth: "2",
    style: {
      position: 'absolute',
      left: 12,
      top: '50%',
      transform: 'translateY(-50%)'
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 21l-4.35-4.35"
  })), /*#__PURE__*/React.createElement("input", {
    placeholder: "Buscar por placa, ID o c\xE1mara...",
    style: dashStyles.search
  })), /*#__PURE__*/React.createElement("div", {
    style: dashStyles.timeStamp
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: '#8C9BAB',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      fontWeight: 700
    }
  }, "Hora local \xB7 CDT"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: '#1A1A2E',
      fontWeight: 600,
      textTransform: 'capitalize'
    }
  }, now)), /*#__PURE__*/React.createElement("div", {
    style: dashStyles.userChip
  }, /*#__PURE__*/React.createElement("div", {
    style: dashStyles.avatar
  }, (user?.user?.[0] || 'O').toUpperCase()), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: '#1A1A2E',
      textTransform: 'uppercase',
      letterSpacing: '0.04em'
    }
  }, user?.user || 'operador'), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: '#6B7280',
      fontWeight: 600
    }
  }, "Operador C5 \xB7 En l\xEDnea")))));
}
function KpiCard({
  label,
  value,
  unit,
  delta,
  trend,
  accent
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: dashStyles.kpiCard
  }, /*#__PURE__*/React.createElement("div", {
    style: dashStyles.kpiLabel
  }, label), /*#__PURE__*/React.createElement("div", {
    style: dashStyles.kpiValue
  }, value), unit && /*#__PURE__*/React.createElement("div", {
    style: dashStyles.kpiUnit
  }, unit), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...dashStyles.kpiDelta,
      color: trend === 'up' ? '#D0212A' : '#1B2F8A'
    }
  }, trend === 'up' ? '▲' : '▼', " ", delta), /*#__PURE__*/React.createElement("div", {
    style: {
      ...dashStyles.kpiBar,
      background: accent
    }
  })));
}
const ALERTS = [{
  sev: 'critical',
  code: 'ALR-2841',
  title: 'Detección facial · objetivo prioritario',
  loc: 'Cámara CDMX-IZ-0142 · Iztapalapa',
  time: 'hace 32 s'
}, {
  sev: 'high',
  code: 'ALR-2840',
  title: 'Vehículo con placa de búsqueda',
  loc: 'ALPR · Periférico Sur km 12',
  time: 'hace 1 min 14 s'
}, {
  sev: 'medium',
  code: 'ALR-2839',
  title: 'Aglomeración inusual detectada',
  loc: 'Cámara CDMX-CTR-0008 · Centro Histórico',
  time: 'hace 4 min'
}, {
  sev: 'high',
  code: 'ALR-2838',
  title: 'Intrusión perimetral',
  loc: 'C5 Edomex · Zona técnica B',
  time: 'hace 7 min'
}, {
  sev: 'low',
  code: 'ALR-2837',
  title: 'Cámara fuera de línea',
  loc: 'CDMX-COY-0091 · Coyoacán',
  time: 'hace 12 min'
}, {
  sev: 'medium',
  code: 'ALR-2836',
  title: 'Audio anómalo (disparos posibles)',
  loc: 'Sensor SHA-44 · Tlalpan',
  time: 'hace 18 min'
}];
const SEV_STYLE = {
  critical: {
    bg: '#FDEAEB',
    fg: '#8B0D13',
    label: 'Crítica'
  },
  high: {
    bg: '#FDEAEB',
    fg: '#D0212A',
    label: 'Alta'
  },
  medium: {
    bg: '#E8ECFB',
    fg: '#1B2F8A',
    label: 'Media'
  },
  low: {
    bg: '#F4F6F8',
    fg: '#6B7280',
    label: 'Baja'
  }
};
function AlertRow({
  alert
}) {
  const s = SEV_STYLE[alert.sev];
  return /*#__PURE__*/React.createElement("div", {
    style: dashStyles.alertRow
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...dashStyles.sevPill,
      background: s.bg,
      color: s.fg
    }
  }, s.label), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'baseline'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: dashStyles.alertCode
  }, alert.code), /*#__PURE__*/React.createElement("span", {
    style: dashStyles.alertTitle
  }, alert.title)), /*#__PURE__*/React.createElement("div", {
    style: dashStyles.alertLoc
  }, alert.loc)), /*#__PURE__*/React.createElement("div", {
    style: dashStyles.alertTime
  }, alert.time), /*#__PURE__*/React.createElement("button", {
    style: dashStyles.alertBtn
  }, "Atender"));
}
const CAMERAS = [{
  id: 'CDMX-IZ-0142',
  name: 'Periférico · Iztapalapa',
  status: 'live',
  hue: 200
}, {
  id: 'CDMX-CTR-0008',
  name: 'Zócalo · Centro Histórico',
  status: 'live',
  hue: 30
}, {
  id: 'CDMX-COY-0091',
  name: 'Coyoacán · Av. Universidad',
  status: 'offline',
  hue: 0
}, {
  id: 'EDOMEX-NA-0042',
  name: 'Naucalpan · Vialidad principal',
  status: 'live',
  hue: 220
}, {
  id: 'CDMX-TLA-0033',
  name: 'Tlalpan · Zona técnica',
  status: 'live',
  hue: 280
}, {
  id: 'CDMX-GAM-0014',
  name: 'Gustavo A. Madero · Acceso norte',
  status: 'live',
  hue: 160
}];
function CameraTile({
  cam
}) {
  const isLive = cam.status === 'live';
  return /*#__PURE__*/React.createElement("div", {
    style: dashStyles.cameraTile
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...dashStyles.cameraView,
      background: isLive ? `linear-gradient(135deg, hsl(${cam.hue} 30% 18%) 0%, hsl(${cam.hue} 50% 8%) 100%)` : '#0A1340'
    }
  }, !isLive && /*#__PURE__*/React.createElement("div", {
    style: dashStyles.offlineMask
  }, /*#__PURE__*/React.createElement("svg", {
    width: "32",
    height: "32",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#6B7280",
    strokeWidth: "1.5"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2 2l20 20M16 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2M21 17V7l-7 5 4 2.86"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#8C9BAB',
      marginTop: 8,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      fontWeight: 700
    }
  }, "Sin se\xF1al")), isLive && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: dashStyles.cameraGrid
  }), /*#__PURE__*/React.createElement("div", {
    style: dashStyles.cameraRecDot
  }, /*#__PURE__*/React.createElement("div", {
    style: dashStyles.recDot
  }), /*#__PURE__*/React.createElement("span", null, "EN VIVO")), /*#__PURE__*/React.createElement("div", {
    style: dashStyles.cameraTimecode
  }, new Date().toLocaleTimeString('es-MX', {
    hour12: false
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '32%',
      top: '40%',
      width: 56,
      height: 70,
      border: '2px solid #D0212A',
      borderRadius: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: -18,
      left: -2,
      background: '#D0212A',
      color: '#fff',
      fontSize: 9,
      fontWeight: 700,
      padding: '1px 4px',
      fontFamily: 'monospace',
      letterSpacing: '0.05em'
    }
  }, "HUMANO \xB7 94%")))), /*#__PURE__*/React.createElement("div", {
    style: dashStyles.cameraMeta
  }, /*#__PURE__*/React.createElement("div", {
    style: dashStyles.cameraId
  }, cam.id), /*#__PURE__*/React.createElement("div", {
    style: dashStyles.cameraName
  }, cam.name)));
}
function MapPanel() {
  // Stylized abstract map — not real cartography, just a visual surface
  return /*#__PURE__*/React.createElement("div", {
    style: dashStyles.mapPanel
  }, /*#__PURE__*/React.createElement("div", {
    style: dashStyles.mapHeader
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: dashStyles.panelEyebrow
  }, "Cobertura territorial"), /*#__PURE__*/React.createElement("h3", {
    style: dashStyles.panelTitle
  }, "Mapa de Incidencia \xB7 Zona Metropolitana")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, ['1H', '6H', '24H', '7D'].map((t, i) => /*#__PURE__*/React.createElement("button", {
    key: t,
    style: {
      ...dashStyles.mapPill,
      background: i === 2 ? '#1B2F8A' : '#fff',
      color: i === 2 ? '#fff' : '#6B7280',
      borderColor: i === 2 ? '#1B2F8A' : '#E0E4EA'
    }
  }, t)))), /*#__PURE__*/React.createElement("div", {
    style: dashStyles.mapCanvas
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 600 320",
    preserveAspectRatio: "none",
    style: {
      width: '100%',
      height: '100%'
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("pattern", {
    id: "grid",
    width: "30",
    height: "30",
    patternUnits: "userSpaceOnUse"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M 30 0 L 0 0 0 30",
    fill: "none",
    stroke: "rgba(92,120,216,0.15)",
    strokeWidth: "0.5"
  })), /*#__PURE__*/React.createElement("radialGradient", {
    id: "hot",
    cx: "50%",
    cy: "50%",
    r: "50%"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#D0212A",
    stopOpacity: "0.6"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#D0212A",
    stopOpacity: "0"
  }))), /*#__PURE__*/React.createElement("rect", {
    width: "600",
    height: "320",
    fill: "url(#grid)"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 60 80 L 180 60 L 240 120 L 220 200 L 140 240 L 70 220 Z",
    fill: "rgba(27,47,138,0.12)",
    stroke: "rgba(27,47,138,0.4)",
    strokeWidth: "0.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 240 120 L 360 90 L 420 160 L 380 240 L 280 230 L 220 200 Z",
    fill: "rgba(27,47,138,0.18)",
    stroke: "rgba(27,47,138,0.4)",
    strokeWidth: "0.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 360 90 L 500 100 L 540 200 L 480 260 L 380 240 L 420 160 Z",
    fill: "rgba(27,47,138,0.10)",
    stroke: "rgba(27,47,138,0.4)",
    strokeWidth: "0.5"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "180",
    cy: "160",
    r: "60",
    fill: "url(#hot)"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "380",
    cy: "180",
    r: "45",
    fill: "url(#hot)"
  }), [{
    x: 180,
    y: 160,
    sev: 'critical'
  }, {
    x: 240,
    y: 140,
    sev: 'high'
  }, {
    x: 320,
    y: 200,
    sev: 'medium'
  }, {
    x: 380,
    y: 180,
    sev: 'critical'
  }, {
    x: 420,
    y: 130,
    sev: 'high'
  }, {
    x: 140,
    y: 200,
    sev: 'low'
  }, {
    x: 460,
    y: 220,
    sev: 'medium'
  }, {
    x: 280,
    y: 110,
    sev: 'low'
  }].map((m, i) => {
    const c = m.sev === 'critical' ? '#D0212A' : m.sev === 'high' ? '#E04048' : m.sev === 'medium' ? '#3554C8' : '#8C9BAB';
    return /*#__PURE__*/React.createElement("g", {
      key: i
    }, /*#__PURE__*/React.createElement("circle", {
      cx: m.x,
      cy: m.y,
      r: "8",
      fill: c,
      fillOpacity: "0.2"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: m.x,
      cy: m.y,
      r: "3",
      fill: c
    }));
  })), /*#__PURE__*/React.createElement("div", {
    style: dashStyles.mapLegend
  }, [{
    sev: 'critical',
    label: 'Crítica'
  }, {
    sev: 'high',
    label: 'Alta'
  }, {
    sev: 'medium',
    label: 'Media'
  }, {
    sev: 'low',
    label: 'Baja'
  }].map(l => {
    const s = SEV_STYLE[l.sev];
    return /*#__PURE__*/React.createElement("div", {
      key: l.sev,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: s.fg
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: '#1A1A2E',
        fontWeight: 600
      }
    }, l.label));
  }))));
}
function Dashboard({
  user,
  onLogout
}) {
  const [active, setActive] = useDashState('ops');
  return /*#__PURE__*/React.createElement("div", {
    style: dashStyles.shell
  }, /*#__PURE__*/React.createElement(Sidebar, {
    active: active,
    onSelect: setActive,
    onLogout: onLogout
  }), /*#__PURE__*/React.createElement("div", {
    style: dashStyles.main
  }, /*#__PURE__*/React.createElement(TopBar, {
    user: user
  }), /*#__PURE__*/React.createElement("div", {
    style: dashStyles.body
  }, /*#__PURE__*/React.createElement("div", {
    style: dashStyles.kpiRow
  }, /*#__PURE__*/React.createElement(KpiCard, {
    label: "C\xE1maras activas",
    value: "4,827",
    unit: "/ 5,012",
    delta: "+12 hoy",
    trend: "up",
    accent: "#1B2F8A"
  }), /*#__PURE__*/React.createElement(KpiCard, {
    label: "Alertas abiertas",
    value: "14",
    unit: "activas",
    delta: "+3 \xFAltimas 1h",
    trend: "up",
    accent: "#D0212A"
  }), /*#__PURE__*/React.createElement(KpiCard, {
    label: "Tiempo de respuesta",
    value: "2:14",
    unit: "min",
    delta: "\u221218 s vs. ayer",
    trend: "down",
    accent: "#1B2F8A"
  }), /*#__PURE__*/React.createElement(KpiCard, {
    label: "Unidades desplegadas",
    value: "63",
    unit: "patrullas",
    delta: "+5 esta hora",
    trend: "up",
    accent: "#1B2F8A"
  })), /*#__PURE__*/React.createElement("div", {
    style: dashStyles.grid
  }, /*#__PURE__*/React.createElement(MapPanel, null), /*#__PURE__*/React.createElement("div", {
    style: dashStyles.alertsPanel
  }, /*#__PURE__*/React.createElement("div", {
    style: dashStyles.panelHeader
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: dashStyles.panelEyebrow
  }, "Tiempo real"), /*#__PURE__*/React.createElement("h3", {
    style: dashStyles.panelTitle
  }, "Bandeja de Alertas")), /*#__PURE__*/React.createElement("button", {
    style: dashStyles.panelBtn
  }, "Ver todas")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, ALERTS.map(a => /*#__PURE__*/React.createElement(AlertRow, {
    key: a.code,
    alert: a
  }))))), /*#__PURE__*/React.createElement("div", {
    style: dashStyles.cameraSection
  }, /*#__PURE__*/React.createElement("div", {
    style: dashStyles.panelHeader
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: dashStyles.panelEyebrow
  }, "Videovigilancia urbana"), /*#__PURE__*/React.createElement("h3", {
    style: dashStyles.panelTitle
  }, "C\xE1maras en Monitoreo Activo")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...dashStyles.panelBtn,
      background: '#1B2F8A',
      color: '#fff',
      borderColor: '#1B2F8A'
    }
  }, "Vista 2\xD73"), /*#__PURE__*/React.createElement("button", {
    style: dashStyles.panelBtn
  }, "Vista 4\xD74"), /*#__PURE__*/React.createElement("button", {
    style: dashStyles.panelBtn
  }, "Pantalla completa"))), /*#__PURE__*/React.createElement("div", {
    style: dashStyles.cameraGrid2
  }, CAMERAS.map(c => /*#__PURE__*/React.createElement(CameraTile, {
    key: c.id,
    cam: c
  })))))));
}
const dashStyles = {
  shell: {
    display: 'grid',
    gridTemplateColumns: '232px 1fr',
    width: '100%',
    minHeight: '100vh',
    background: '#F4F6F8',
    fontFamily: 'Barlow, sans-serif',
    color: '#1A1A2E'
  },
  sidebar: {
    background: '#0A1340',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    height: '100vh'
  },
  sidebarLogo: {
    padding: '24px 20px 20px',
    borderBottom: '1px solid rgba(92,120,216,0.2)',
    display: 'flex',
    justifyContent: 'center',
    background: '#fff'
  },
  nav: {
    flex: 1,
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    overflowY: 'auto'
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '11px 14px',
    background: 'transparent',
    border: 'none',
    color: '#8FA2E8',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'Barlow, sans-serif',
    cursor: 'pointer',
    borderRadius: 4,
    textAlign: 'left',
    position: 'relative',
    letterSpacing: '0.02em',
    transition: 'all 0.12s'
  },
  navItemActive: {
    background: 'rgba(27,47,138,0.5)',
    color: '#fff'
  },
  navItemBar: {
    position: 'absolute',
    left: -12,
    top: 8,
    bottom: 8,
    width: 3,
    background: '#D0212A',
    borderRadius: '0 2px 2px 0'
  },
  sidebarFooter: {
    padding: 16,
    borderTop: '1px solid rgba(92,120,216,0.2)'
  },
  logoutBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    background: 'transparent',
    border: '1px solid rgba(92,120,216,0.3)',
    color: '#C2CEF4',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: 'Barlow, sans-serif',
    cursor: 'pointer',
    borderRadius: 4,
    letterSpacing: '0.04em'
  },
  versionTagSidebar: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#5C78D8',
    textAlign: 'center',
    marginTop: 12,
    letterSpacing: '0.05em'
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0
  },
  topbar: {
    background: '#fff',
    borderBottom: '1px solid #E0E4EA',
    padding: '20px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24
  },
  topEyebrow: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#D0212A',
    marginBottom: 4
  },
  topTitle: {
    fontFamily: 'Barlow Condensed, sans-serif',
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: '-0.01em',
    textTransform: 'uppercase',
    color: '#0A1340',
    lineHeight: 1
  },
  topRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 20
  },
  searchWrap: {
    position: 'relative',
    width: 240,
    flexShrink: 1
  },
  search: {
    width: '100%',
    padding: '10px 14px 10px 36px',
    border: '1px solid #E0E4EA',
    borderRadius: 4,
    fontFamily: 'Barlow, sans-serif',
    fontSize: 13,
    background: '#F4F6F8',
    outline: 'none'
  },
  timeStamp: {
    textAlign: 'right',
    whiteSpace: 'nowrap',
    flexShrink: 0
  },
  userChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 16,
    borderLeft: '1px solid #E0E4EA',
    whiteSpace: 'nowrap',
    flexShrink: 0
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 4,
    background: '#1B2F8A',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Barlow Condensed, sans-serif',
    fontWeight: 800,
    fontSize: 16
  },
  body: {
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 20
  },
  kpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16
  },
  kpiCard: {
    background: '#fff',
    border: '1px solid #E0E4EA',
    borderRadius: 4,
    padding: 20
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#6B7280',
    marginBottom: 14
  },
  kpiValue: {
    fontFamily: 'Barlow Condensed, sans-serif',
    fontSize: 30,
    fontWeight: 800,
    color: '#0A1340',
    lineHeight: 1,
    letterSpacing: '-0.02em',
    whiteSpace: 'nowrap'
  },
  kpiUnit: {
    fontSize: 11,
    fontWeight: 600,
    color: '#8C9BAB',
    whiteSpace: 'nowrap',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.06em'
  },
  kpiDelta: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.04em'
  },
  kpiBar: {
    width: 60,
    height: 3,
    borderRadius: 2
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
    gap: 16
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: '18px 20px',
    borderBottom: '1px solid #E0E4EA'
  },
  panelEyebrow: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#D0212A',
    marginBottom: 4
  },
  panelTitle: {
    fontFamily: 'Barlow Condensed, sans-serif',
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: '-0.01em',
    textTransform: 'uppercase',
    color: '#0A1340',
    lineHeight: 1
  },
  panelBtn: {
    padding: '7px 14px',
    background: '#fff',
    border: '1px solid #E0E4EA',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#1A1A2E',
    fontFamily: 'Barlow, sans-serif',
    cursor: 'pointer'
  },
  mapPanel: {
    background: '#fff',
    border: '1px solid #E0E4EA',
    borderRadius: 4,
    overflow: 'hidden'
  },
  mapHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: '18px 20px',
    borderBottom: '1px solid #E0E4EA'
  },
  mapPill: {
    padding: '6px 12px',
    border: '1px solid',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    cursor: 'pointer',
    fontFamily: 'Barlow, sans-serif'
  },
  mapCanvas: {
    height: 420,
    background: '#F4F6F8',
    position: 'relative'
  },
  mapLegend: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    background: '#fff',
    border: '1px solid #E0E4EA',
    borderRadius: 4,
    padding: '8px 12px',
    display: 'flex',
    gap: 14
  },
  alertsPanel: {
    background: '#fff',
    border: '1px solid #E0E4EA',
    borderRadius: 4,
    overflow: 'hidden'
  },
  alertRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 20px',
    borderBottom: '1px solid #F4F6F8'
  },
  sevPill: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    padding: '4px 8px',
    borderRadius: 2,
    minWidth: 64,
    textAlign: 'center',
    flexShrink: 0
  },
  alertCode: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 700,
    color: '#8C9BAB',
    letterSpacing: '0.05em'
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1A1A2E'
  },
  alertLoc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2
  },
  alertTime: {
    fontSize: 10,
    color: '#8C9BAB',
    fontFamily: 'monospace',
    letterSpacing: '0.04em',
    flexShrink: 0,
    width: 80,
    textAlign: 'right'
  },
  alertBtn: {
    padding: '6px 12px',
    background: '#1B2F8A',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    fontFamily: 'Barlow, sans-serif'
  },
  cameraSection: {
    background: '#fff',
    border: '1px solid #E0E4EA',
    borderRadius: 4,
    overflow: 'hidden'
  },
  cameraGrid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 1,
    background: '#E0E4EA'
  },
  cameraTile: {
    background: '#fff'
  },
  cameraView: {
    aspectRatio: '16 / 10',
    position: 'relative',
    overflow: 'hidden'
  },
  cameraGrid: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
    backgroundSize: '24px 24px'
  },
  cameraRecDot: {
    position: 'absolute',
    top: 10,
    left: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(10,19,64,0.7)',
    padding: '3px 8px',
    borderRadius: 2,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.12em',
    color: '#fff'
  },
  recDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#D0212A',
    animation: 'pulse 1.5s infinite'
  },
  cameraTimecode: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    background: 'rgba(10,19,64,0.7)',
    padding: '2px 8px',
    borderRadius: 2,
    fontSize: 10,
    color: '#fff',
    fontFamily: 'monospace',
    letterSpacing: '0.06em'
  },
  offlineMask: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cameraMeta: {
    padding: '10px 14px',
    borderTop: '1px solid #E0E4EA',
    background: '#fff'
  },
  cameraId: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#8C9BAB',
    letterSpacing: '0.05em',
    fontWeight: 700
  },
  cameraName: {
    fontSize: 12,
    fontWeight: 600,
    color: '#1A1A2E',
    marginTop: 2
  }
};
window.Dashboard = Dashboard;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/saimon/Dashboard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/saimon/Login.jsx
try { (() => {
const {
  useState
} = React;
function SaimonLogo({
  size = 1
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 0,
      lineHeight: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8 * size
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'Barlow Condensed, sans-serif',
      fontWeight: 800,
      fontStyle: 'italic',
      fontSize: 56 * size,
      lineHeight: 1,
      color: '#1B2F8A',
      letterSpacing: '-0.03em'
    }
  }, "Saimon"), /*#__PURE__*/React.createElement("svg", {
    width: 48 * size,
    height: 48 * size,
    viewBox: "0 0 48 48",
    fill: "none",
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M4 36 Q 24 12, 44 24 Q 36 40, 16 32",
    stroke: "#D0212A",
    strokeWidth: "3",
    fill: "none",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "40",
    cy: "22",
    r: "4",
    fill: "#1B2F8A"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "40",
    cy: "22",
    r: "7",
    stroke: "#D0212A",
    strokeWidth: "2",
    fill: "none"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Barlow, sans-serif',
      fontWeight: 700,
      fontSize: 10 * size,
      lineHeight: 1.4,
      letterSpacing: '0.06em',
      color: '#1A1A2E',
      textTransform: 'uppercase',
      marginTop: 6,
      whiteSpace: 'nowrap'
    }
  }, "Seguritech Artificial Intelligence"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'Barlow, sans-serif',
      fontWeight: 700,
      fontSize: 10 * size,
      lineHeight: 1.4,
      letterSpacing: '0.06em',
      color: '#1A1A2E',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap'
    }
  }, "Monitoring Operating Network"));
}
function Login({
  onLogin
}) {
  const [user, setUser] = useState('');
  const [profile, setProfile] = useState('');
  const [tab, setTab] = useState('password');
  const [password, setPassword] = useState('');
  const [extension, setExtension] = useState('');
  const [touched, setTouched] = useState(false);
  const userError = touched && !user;
  const submit = e => {
    e.preventDefault();
    setTouched(true);
    if (!user) return;
    onLogin({
      user,
      profile
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    style: loginStyles.shell
  }, /*#__PURE__*/React.createElement("div", {
    style: loginStyles.left
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/saimon-login-reference.png",
    alt: "",
    style: loginStyles.leftImage
  }), /*#__PURE__*/React.createElement("div", {
    style: loginStyles.leftOverlay
  })), /*#__PURE__*/React.createElement("div", {
    style: loginStyles.right
  }, /*#__PURE__*/React.createElement("div", {
    style: loginStyles.formWrap
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 40,
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(SaimonLogo, {
    size: 1.1
  })), /*#__PURE__*/React.createElement("form", {
    onSubmit: submit
  }, /*#__PURE__*/React.createElement("div", {
    style: loginStyles.group
  }, /*#__PURE__*/React.createElement("label", {
    style: loginStyles.label
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#D0212A'
    }
  }, "*"), " Usuario"), /*#__PURE__*/React.createElement("div", {
    style: loginStyles.inputWrap
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#8C9BAB",
    strokeWidth: "2",
    style: loginStyles.inputIcon
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "8",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 21c0-4 4-7 8-7s8 3 8 7"
  })), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "Introduce tu usuario",
    value: user,
    onChange: e => setUser(e.target.value),
    onBlur: () => setTouched(true),
    style: {
      ...loginStyles.input,
      paddingLeft: 36,
      borderColor: userError ? '#D0212A' : '#C4CDD6'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: loginStyles.charCount
  }, user.length, " / 15")), userError && /*#__PURE__*/React.createElement("div", {
    style: loginStyles.errorMsg
  }, "Campo obligatorio")), /*#__PURE__*/React.createElement("div", {
    style: loginStyles.group
  }, /*#__PURE__*/React.createElement("label", {
    style: loginStyles.label
  }, "Seleccione su perfil"), /*#__PURE__*/React.createElement("select", {
    value: profile,
    onChange: e => setProfile(e.target.value),
    style: loginStyles.select
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Seleccione una opci\xF3n..."), /*#__PURE__*/React.createElement("option", {
    value: "operador"
  }, "Operador C5"), /*#__PURE__*/React.createElement("option", {
    value: "supervisor"
  }, "Supervisor"), /*#__PURE__*/React.createElement("option", {
    value: "admin"
  }, "Administrador"), /*#__PURE__*/React.createElement("option", {
    value: "auditor"
  }, "Auditor"))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      margin: '28px 0 12px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: loginStyles.divider
  }, "Seleccione una forma de validaci\xF3n")), /*#__PURE__*/React.createElement("div", {
    style: loginStyles.tabGroup
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setTab('password'),
    style: {
      ...loginStyles.tab,
      ...(tab === 'password' ? loginStyles.tabActive : loginStyles.tabInactive)
    }
  }, "Contrase\xF1a"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setTab('extension'),
    style: {
      ...loginStyles.tab,
      ...(tab === 'extension' ? loginStyles.tabActive : loginStyles.tabInactive)
    }
  }, "# Extensi\xF3n")), /*#__PURE__*/React.createElement("div", {
    style: {
      ...loginStyles.tabPanel,
      marginBottom: 28
    }
  }, tab === 'password' ? /*#__PURE__*/React.createElement("div", {
    style: loginStyles.inputWrap
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#8C9BAB",
    strokeWidth: "2",
    style: loginStyles.inputIcon
  }, /*#__PURE__*/React.createElement("rect", {
    x: "5",
    y: "11",
    width: "14",
    height: "10",
    rx: "1"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 11V7a4 4 0 0 1 8 0v4"
  })), /*#__PURE__*/React.createElement("input", {
    type: "password",
    placeholder: "Contrase\xF1a",
    value: password,
    onChange: e => setPassword(e.target.value),
    style: {
      ...loginStyles.input,
      paddingLeft: 36
    }
  })) : /*#__PURE__*/React.createElement("div", {
    style: loginStyles.inputWrap
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#8C9BAB",
    strokeWidth: "2",
    style: loginStyles.inputIcon
  }, /*#__PURE__*/React.createElement("path", {
    d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
  })), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "N\xFAmero de extensi\xF3n",
    value: extension,
    onChange: e => setExtension(e.target.value),
    style: {
      ...loginStyles.input,
      paddingLeft: 36
    }
  }))), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    style: loginStyles.submit
  }, "Iniciar Sesi\xF3n")), /*#__PURE__*/React.createElement("div", {
    style: loginStyles.footerLinks
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: loginStyles.footerLink
  }, "T\xE9rminos y condiciones"), /*#__PURE__*/React.createElement("span", {
    style: loginStyles.versionTag
  }, "SDC-W | QA \xA9 v.4.1.10 |"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: loginStyles.footerLink
  }, "Aviso de privacidad")))));
}
const loginStyles = {
  shell: {
    width: '100%',
    height: '100vh',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    background: '#fff',
    fontFamily: 'Barlow, sans-serif'
  },
  left: {
    position: 'relative',
    background: '#0A1340',
    overflow: 'hidden'
  },
  leftImage: {
    width: '200%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'left center'
  },
  leftOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(90deg, rgba(10,19,64,0.05) 0%, rgba(10,19,64,0.4) 100%)'
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 60px',
    background: '#fff',
    position: 'relative'
  },
  formWrap: {
    width: '100%',
    maxWidth: 440
  },
  group: {
    marginBottom: 16
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#1A1A2E',
    marginBottom: 6
  },
  inputWrap: {
    position: 'relative'
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    border: '1px solid #C4CDD6',
    borderRadius: 4,
    fontFamily: 'Barlow, sans-serif',
    fontSize: 13,
    color: '#1A1A2E',
    outline: 'none',
    background: '#fff'
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none'
  },
  charCount: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 11,
    color: '#8C9BAB',
    fontFamily: 'monospace'
  },
  errorMsg: {
    fontSize: 12,
    color: '#D0212A',
    marginTop: 4,
    fontWeight: 500
  },
  select: {
    width: '100%',
    padding: '11px 14px',
    border: '1px solid #C4CDD6',
    borderRadius: 4,
    fontFamily: 'Barlow, sans-serif',
    fontSize: 13,
    color: '#6B7280',
    background: '#fff',
    appearance: 'none',
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238C9BAB' stroke-width='1.5' fill='none'/%3E%3C/svg%3E\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    cursor: 'pointer'
  },
  divider: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1A1A2E'
  },
  tabGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    border: '1px solid #E0E4EA',
    borderRadius: 4,
    overflow: 'hidden'
  },
  tab: {
    padding: '12px 0',
    fontFamily: 'Barlow, sans-serif',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.15s'
  },
  tabActive: {
    background: '#3554C8',
    color: '#fff'
  },
  tabInactive: {
    background: '#fff',
    color: '#6B7280'
  },
  tabPanel: {
    border: '1px solid #E0E4EA',
    borderTop: 'none',
    borderRadius: '0 0 4px 4px',
    padding: 14,
    background: '#fff'
  },
  submit: {
    width: '100%',
    padding: '13px',
    background: '#3554C8',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontFamily: 'Barlow, sans-serif',
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'background 0.15s'
  },
  footerLinks: {
    position: 'absolute',
    bottom: 24,
    left: 60,
    right: 60,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 11,
    color: '#6B7280',
    fontWeight: 600
  },
  footerLink: {
    color: '#1A1A2E',
    textDecoration: 'none',
    fontWeight: 600
  },
  versionTag: {
    fontFamily: 'monospace',
    color: '#8C9BAB',
    fontSize: 10
  }
};
window.Login = Login;
window.SaimonLogo = SaimonLogo;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/saimon/Login.jsx", error: String((e && e.message) || e) }); }

})();
