const { dynasties, getDynastyAtYear, getDynastyObj, formatDynastyYears } = require('../../utils/dynasties');
const { POP_DATA, POP_MAX, POP_MILESTONES, getPopAtYear, formatPop } = require('../../utils/population');
const TIMELINE_RAW = require('../../utils/data');

const CATS = {
  '政治': { c: '#e74c3c', half: 'upper' },
  '军事': { c: '#e67e22', half: 'lower' },
  '科技': { c: '#3498db', half: 'upper' },
  '文化': { c: '#9b59b6', half: 'upper' },
  '人物': { c: '#f39c12', half: 'lower' },
  '社会': { c: '#2ecc71', half: 'lower' }
};

const DATA_MIN = -2070, DATA_MAX = 2026;

Page({
  data: {
    statusBarHeight: 20,
    dynastyList: dynasties,
    currentDynasty: '',
    focusText: '',
    showPopCurve: true,
    densityVal: 100,
    densityText: '1.0x',
    activeCats: { all: true, '政治': true, '军事': true, '科技': true, '文化': true, '人物': true, '社会': true },
    detailShow: false,
    detailData: {},
    searchShow: false,
    searchResults: []
  },

  // State
  _canvas: null,
  _ctx: null,
  _cw: 0,
  _ch: 0,
  _dpr: 1,
  events: [],
  offsetX: 0,
  pixelsPerYear: 0.15,
  densityMultiplier: 1.0,
  showPopCurve: true,
  activeCategories: new Set(['政治', '军事', '科技', '文化', '人物', '社会']),
  currentFocusDynasty: '',
  manualFocusDynasty: null,

  // Touch state
  _touchState: 'idle',
  _lastTouchX: 0,
  _lastTouchY: 0,
  _lastTime: 0,
  _velocity: 0,
  _pinchDist: 0,
  _pinchConfirmed: false,
  _lastPinchTime: 0,

  // Hit areas for tap detection
  _hitAreas: [],

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 });

    // Parse events
    const raw = TIMELINE_RAW.TIMELINE_DATA || TIMELINE_RAW;
    this.events = raw.map(d => ({
      year: d[0], month: d[1], day: d[2], title: d[3], summary: d[4],
      detail: d[5], context: d[6], image: d[7], dynasty: d[8], level: d[9], category: d[10]
    }));

    // Init position
    const centerYear = (DATA_MIN + DATA_MAX) / 2;
    this.offsetX = this._cw ? this._cw / 2 - centerYear * this.pixelsPerYear : 0;
  },

  onReady() {
    this._initCanvas();
  },

  _initCanvas() {
    const query = wx.createSelectorQuery();
    query.select('#timelineCanvas').fields({ node: true, size: true }).exec(res => {
      if (!res[0]) return;
      const canvas = res[0].node;
      const dpr = wx.getSystemInfoSync().pixelRatio;
      this._canvas = canvas;
      this._ctx = canvas.getContext('2d');
      this._dpr = dpr;
      this._cw = res[0].width * dpr;
      this._ch = res[0].height * dpr;
      canvas.width = this._cw;
      canvas.height = this._ch;

      // Init position after we know canvas size
      const centerYear = (DATA_MIN + DATA_MAX) / 2;
      this.offsetX = this._cw / 2 - centerYear * this.pixelsPerYear;
      this._clampOffsetSoft();

      this._render();
    });
  },

  // ===== Coordinate helpers =====
  _yearToX(y) { return y * this.pixelsPerYear + this.offsetX; },
  _xToYear(x) { return (x - this.offsetX) / this.pixelsPerYear; },
  _formatYear(y) { return y < 0 ? '前' + Math.abs(y) + '年' : y + '年'; },

  // ===== 边界限制 =====
  _clampOffset() {
    const vw = this._cw, ppy = this.pixelsPerYear;
    const maxOX = -DATA_MIN * ppy + vw * 0.2;
    const minOX = vw * 0.8 - DATA_MAX * ppy;
    if (this.offsetX > maxOX) { this.offsetX = maxOX; this._velocity = 0; }
    else if (this.offsetX < minOX) { this.offsetX = minOX; this._velocity = 0; }
  },
  _clampOffsetSoft() {
    const vw = this._cw, ppy = this.pixelsPerYear;
    const maxOX = -DATA_MIN * ppy + vw * 0.2;
    const minOX = vw * 0.8 - DATA_MAX * ppy;
    if (this.offsetX > maxOX) this.offsetX = maxOX;
    else if (this.offsetX < minOX) this.offsetX = minOX;
  },

  _getZoomLevel() {
    const ppy = this.pixelsPerYear;
    if (ppy < 0.15) return 1;
    if (ppy < 0.4) return 2;
    if (ppy < 1.0) return 3;
    if (ppy < 2.5) return 4;
    return 5;
  },

  _getZoomLabel() {
    const l = this._getZoomLevel();
    return l === 1 ? '宏观 · 朝代' : l === 2 ? '中观 · 年代' : l === 3 ? '细节 · 事件' : l === 4 ? '微观 · 始末' : '精览 · 全貌';
  },

  // ===== Rendering =====
  _render() {
    if (!this._ctx) return;
    const ctx = this._ctx;
    const cw = this._cw, ch = this._ch;
    const dpr = this._dpr;

    // Clear
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, cw, ch);

    const centerY = ch / 2;
    const visS = this._xToYear(0);
    const visE = this._xToYear(cw);
    const centerYear = this._xToYear(cw / 2);

    // Update focus
    this.currentFocusDynasty = this.manualFocusDynasty || getDynastyAtYear(Math.round(centerYear));
    this.setData({
      currentDynasty: this.currentFocusDynasty,
      focusText: this.currentFocusDynasty + ' · ' + this._getZoomLabel()
    });

    // ---- Starfield ----
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 137.5) % cw);
      const sy = ((i * 97.3 + 50) % ch);
      ctx.beginPath();
      ctx.arc(sx, sy, 0.5 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }

    // ---- Dynasty bands ----
    const bandH = Math.min(40 * dpr, ch * 0.12);
    const visDynasties = dynasties.filter(d => d.end > visS && d.start < visE);

    visDynasties.forEach(d => {
      const x1 = this._yearToX(Math.max(d.start, visS - 200));
      const x2 = this._yearToX(Math.min(d.end, visE + 200));
      if (x2 < 0 || x1 > cw) return;

      const isFocus = this.currentFocusDynasty === d.name;
      const opacity = isFocus ? 0.15 : 0.04;

      // Upper band
      ctx.fillStyle = 'rgba(' + d.rgb + ',' + opacity + ')';
      const bandY = centerY - bandH;
      ctx.fillRect(x1, bandY, x2 - x1, bandH);

      // Divider
      const divOpacity = isFocus ? 0.4 : 0.08;
      ctx.fillStyle = 'rgba(' + d.rgb + ',' + divOpacity + ')';
      ctx.fillRect(x1, bandY, 1 * dpr, bandH);

      // Label
      const cx = (x1 + x2) / 2;
      if (cx > -50 && cx < cw + 50) {
        const labelOpacity = isFocus ? 0.9 : 0.3;
        ctx.fillStyle = 'rgba(201,169,110,' + labelOpacity + ')';
        const fontSize = (isFocus ? 13 : 9) * dpr;
        ctx.font = (isFocus ? '500 ' : '300 ') + fontSize + 'px "PingFang SC"';
        ctx.textAlign = 'center';
        ctx.fillText(d.name, cx, bandY - 6 * dpr);
      }
    });

    // ---- Timeline line ----
    const lineGrad = ctx.createLinearGradient(0, 0, cw, 0);
    lineGrad.addColorStop(0, 'transparent');
    lineGrad.addColorStop(0.03, '#8a6d3b');
    lineGrad.addColorStop(0.2, '#c9a96e');
    lineGrad.addColorStop(0.5, '#dbb87a');
    lineGrad.addColorStop(0.8, '#c9a96e');
    lineGrad.addColorStop(0.97, '#8a6d3b');
    lineGrad.addColorStop(1, 'transparent');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(cw, centerY);
    ctx.stroke();

    // ---- Population curve ----
    if (this.showPopCurve) {
      const popBandH = bandH;
      const popBaseY = centerY + 4 * dpr;
      const popMaxH = popBandH - 8 * dpr;
      const yr = visE - visS;
      const popStep = yr > 2000 ? 50 : yr > 500 ? 20 : yr > 100 ? 10 : 5;
      const popStart = Math.max(Math.floor(visS / popStep) * popStep, -2000);
      const popEnd = Math.min(Math.ceil(visE / popStep) * popStep, 2025);

      ctx.beginPath();
      let first = true;
      for (let y = popStart; y <= popEnd; y += popStep) {
        const x = this._yearToX(y);
        const pop = getPopAtYear(y);
        const h = (pop / POP_MAX) * popMaxH;
        const py = popBaseY + popBandH - 4 * dpr - h;
        if (first) { ctx.moveTo(x, py); first = false; }
        else ctx.lineTo(x, py);
      }

      // Curve stroke
      ctx.strokeStyle = 'rgba(201,169,110,0.3)';
      ctx.lineWidth = 1.5 * dpr;
      ctx.stroke();

      // Fill area
      const lastX = this._yearToX(popEnd);
      ctx.lineTo(lastX, popBaseY + popBandH - 4 * dpr);
      ctx.lineTo(this._yearToX(popStart), popBaseY + popBandH - 4 * dpr);
      ctx.closePath();
      ctx.fillStyle = 'rgba(201,169,110,0.04)';
      ctx.fill();

      // Milestones (Z3+)
      const zl = this._getZoomLevel();
      if (zl >= 3) {
        POP_MILESTONES.forEach(m => {
          if (m.year < visS - 100 || m.year > visE + 100) return;
          const mx = this._yearToX(m.year);
          const mh = (m.pop / POP_MAX) * popMaxH;
          const my = popBaseY + popBandH - 4 * dpr - mh;
          if (mx < -30 || mx > cw + 30) return;

          ctx.fillStyle = 'rgba(201,169,110,0.55)';
          ctx.font = (8 * dpr) + 'px "PingFang SC"';
          ctx.textAlign = 'left';
          ctx.fillText(m.label, mx + 4 * dpr, my - 6 * dpr);
        });
      }

      // Center year dot + label
      const centerPop = getPopAtYear(Math.round(centerYear));
      const centerPopH = (centerPop / POP_MAX) * popMaxH;
      const centerPopY = popBaseY + popBandH - 4 * dpr - centerPopH;
      const centerPopX = this._yearToX(centerYear);
      if (centerPopX > -20 && centerPopX < cw + 20) {
        // Glow
        ctx.beginPath();
        ctx.arc(centerPopX, centerPopY, 10 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(201,169,110,0.12)';
        ctx.fill();
        // Dot
        ctx.beginPath();
        ctx.arc(centerPopX, centerPopY, 4 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(201,169,110,0.7)';
        ctx.fill();
        // Label
        const popText = formatPop(centerPop);
        ctx.fillStyle = 'rgba(10,10,20,0.85)';
        const tw = (popText.length * 10 + 12) * dpr;
        ctx.fillRect(centerPopX + 10 * dpr - 4 * dpr, centerPopY - 14 * dpr, tw, 16 * dpr);
        ctx.fillStyle = 'rgba(201,169,110,0.85)';
        ctx.font = '500 ' + (10 * dpr) + 'px "PingFang SC"';
        ctx.textAlign = 'left';
        ctx.fillText(popText, centerPopX + 10 * dpr, centerPopY - 2 * dpr);
      }
    }

    // ---- Ticks ----
    const yr = visE - visS;
    let ti;
    if (yr > 4000) ti = 500; else if (yr > 1500) ti = 200; else if (yr > 600) ti = 100;
    else if (yr > 200) ti = 50; else if (yr > 80) ti = 20; else if (yr > 30) ti = 10;
    else if (yr > 10) ti = 5; else ti = 1;

    const ft = Math.max(Math.floor(visS / ti) * ti, DATA_MIN);
    const lt = Math.min(visE + ti, DATA_MAX);
    for (let y = ft; y <= lt; y += ti) {
      const x = this._yearToX(y);
      if (x < -20 || x > cw + 20) continue;
      const isMaj = ti >= 200 || y % (ti * 5) === 0;
      const tH = isMaj ? 16 * dpr : 6 * dpr;
      ctx.fillStyle = isMaj ? 'rgba(201,169,110,0.25)' : 'rgba(201,169,110,0.06)';
      ctx.fillRect(x, centerY - tH / 2, 1 * dpr, tH);
      if (isMaj || ti <= 20) {
        ctx.fillStyle = isMaj ? 'rgba(168,155,140,0.6)' : 'rgba(90,82,72,0.5)';
        ctx.font = (isMaj ? 9 : 8) * dpr + 'px "PingFang SC"';
        ctx.textAlign = 'center';
        ctx.fillText(this._formatYear(y), x, centerY + tH / 2 + 12 * dpr);
      }
    }

    // ---- Events ----
    this._hitAreas = [];
    const zl = this._getZoomLevel();
    const maxEvents = this._getMaxVisible(cw, zl);
    const visible = this._selectEvents(visS - 50, visE + 50, maxEvents, centerYear);
    const laid = this._layoutEvents(visible, ch, cw);

    laid.forEach(item => {
      const e = item.event;
      const x = item.x;
      const pos = item.pos; // 'above' or 'below'
      const cc = CATS[e.category] ? CATS[e.category].c : '#c9a96e';
      const isImportant = e.level <= 2;

      // Dot
      const dotSize = e.level === 1 ? 14 : e.level === 2 ? 10 : e.level === 3 ? 7 : e.level === 4 ? 5 : 4;
      const r = dotSize / 2 * dpr;
      ctx.beginPath();
      ctx.arc(x, centerY, r, 0, Math.PI * 2);
      ctx.fillStyle = cc;
      ctx.globalAlpha = e.level >= 4 ? 0.7 : 1;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Stem
      const stemLen = (pos === 'above' ? 20 : 20) * dpr;
      ctx.strokeStyle = 'rgba(201,169,110,0.15)';
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(x, centerY + (pos === 'above' ? -r : r));
      ctx.lineTo(x, centerY + (pos === 'above' ? -r - stemLen : r + stemLen));
      ctx.stroke();

      // Card
      const cardY = pos === 'above' ? centerY - r - stemLen - 50 * dpr : centerY + r + stemLen;
      const cardW = 180 * dpr;
      const cardH = 44 * dpr;
      const cardX = x - cardW / 2;

      // Card bg
      ctx.fillStyle = 'rgba(18,18,42,0.94)';
      ctx.fillRect(cardX, cardY, cardW, cardH);
      // Left border
      ctx.fillStyle = cc;
      ctx.fillRect(cardX, cardY, 3 * dpr, cardH);
      // Border
      if (isImportant) {
        ctx.strokeStyle = 'rgba(201,169,110,0.4)';
        ctx.lineWidth = 1 * dpr;
        ctx.strokeRect(cardX, cardY, cardW, cardH);
      }

      // Year
      ctx.fillStyle = '#c9a96e';
      ctx.font = (9 * dpr) + 'px "PingFang SC"';
      ctx.textAlign = 'left';
      const yearText = this._formatYear(e.year);
      ctx.fillText(yearText, cardX + 10 * dpr, cardY + 16 * dpr);

      // Title
      ctx.fillStyle = '#e8e0d0';
      ctx.font = (isImportant ? '600 ' : '500 ') + (11 * dpr) + 'px "PingFang SC"';
      ctx.fillText(e.title, cardX + 10 * dpr, cardY + 34 * dpr);

      // Hit area
      this._hitAreas.push({ x: cardX, y: cardY, w: cardW, h: cardH, event: e });
    });

    this._canvas.requestAnimationFrame(() => {}); // keep canvas alive
  },

  _getMaxVisible(cw, zl) {
    const base = zl === 1 ? Math.floor(cw / 100) : zl === 2 ? Math.floor(cw / 70) :
      zl === 3 ? Math.floor(cw / 50) : zl === 4 ? Math.floor(cw / 40) : Math.floor(cw / 30);
    return Math.max(5, Math.floor(base * this.densityMultiplier));
  },

  _selectEvents(visS, visE, max, centerYear) {
    const filtered = this.events.filter(e =>
      e.year >= visS && e.year <= visE && this.activeCategories.has(e.category)
    );

    // Score by level + focus proximity
    const focusDynasty = this.currentFocusDynasty;
    filtered.forEach(e => {
      const levelScore = e.level === 1 ? 100 : e.level === 2 ? 80 : e.level === 3 ? 60 : e.level === 4 ? 40 : 20;
      const dynScore = getDynastyAtYear(e.year) === focusDynasty ? 50 : 0;
      const distScore = Math.max(0, 30 - Math.abs(e.year - centerYear) / 100);
      e._score = levelScore + dynScore + distScore;
    });

    filtered.sort((a, b) => b._score - a._score);
    return filtered.slice(0, max).sort((a, b) => a.year - b.year);
  },

  _layoutEvents(events, vh, vw) {
    const result = [];
    const halfGap = 60;
    const upperSlots = [], lowerSlots = [];

    events.forEach(e => {
      const x = this._yearToX(e.year);
      const cat = CATS[e.category];
      const pos = cat && cat.half === 'lower' ? 'below' : 'above';
      const slots = pos === 'above' ? upperSlots : lowerSlots;
      const slotIdx = slots.findIndex(s => Math.abs(s - x) > halfGap);
      if (slotIdx >= 0) {
        slots[slotIdx] = x;
      } else {
        slots.push(x);
      }
      result.push({ event: e, x, pos });
    });
    return result;
  },

  // ===== Touch =====
  onTouchStart(e) {
    if (e.touches.length === 1) {
      this._touchState = 'drag';
      this._lastTouchX = e.touches[0].x * this._dpr;
      this._lastTouchY = e.touches[0].y * this._dpr;
      this._lastTime = Date.now();
      this._velocity = 0;
      this.manualFocusDynasty = null;
    } else if (e.touches.length === 2) {
      this._touchState = 'pinch';
      const dx = e.touches[1].x - e.touches[0].x;
      const dy = e.touches[1].y - e.touches[0].y;
      this._pinchDist = Math.sqrt(dx * dx + dy * dy) * this._dpr;
      this._pinchConfirmed = false;
      this._lastPinchTime = Date.now();
    }
  },

  onTouchMove(e) {
    if (this._touchState === 'drag' && e.touches.length === 1) {
      const x = e.touches[0].x * this._dpr;
      const dx = x - this._lastTouchX;
      this.offsetX += dx;
      this._clampOffsetSoft();
      const now = Date.now();
      const dt = now - this._lastTime;
      if (dt > 0) this._velocity = dx / dt * 16;
      this._lastTouchX = x;
      this._lastTime = now;
      this._render();
    } else if (this._touchState === 'pinch' && e.touches.length === 2) {
      const dx = e.touches[1].x - e.touches[0].x;
      const dy = e.touches[1].y - e.touches[0].y;
      const dist = Math.sqrt(dx * dx + dy * dy) * this._dpr;
      if (this._pinchDist > 0) {
        const scale = dist / this._pinchDist;
        const centerX = this._cw / 2;
        const centerYear = this._xToYear(centerX);
        this.pixelsPerYear = Math.max(0.01, Math.min(30, this.pixelsPerYear * scale));
        this.offsetX = centerX - centerYear * this.pixelsPerYear;
        this._clampOffsetSoft();
        this.manualFocusDynasty = null;
      }
      this._pinchDist = dist;
      this._render();
    }
  },

  onTouchEnd(e) {
    if (this._touchState === 'drag') {
      this._touchState = 'idle';
      if (Math.abs(this._velocity) < 2) {
        // Check for tap (hit test)
        const tx = this._lastTouchX;
        const ty = this._lastTouchY;
        for (const area of this._hitAreas) {
          if (tx >= area.x && tx <= area.x + area.w && ty >= area.y && ty <= area.y + area.h) {
            this._showDetail(area.event);
            return;
          }
        }
      }
      // Inertia
      this._inertia();
    } else if (this._touchState === 'pinch') {
      this._touchState = 'idle';
    }
  },

  _inertia() {
    if (Math.abs(this._velocity) > 0.3) {
      this.offsetX += this._velocity;
      this._velocity *= 0.93;
      this._clampOffset();
      this._render();
      if (Math.abs(this._velocity) > 0.3) requestAnimationFrame(() => this._inertia());
    }
  },

  // ===== UI Actions =====
  togglePopCurve() {
    this.showPopCurve = !this.showPopCurve;
    this.setData({ showPopCurve: this.showPopCurve });
    this._render();
  },

  onDensityChange(e) {
    this.densityMultiplier = e.detail.value / 100;
    this.setData({ densityText: this.densityMultiplier.toFixed(1) + 'x' });
    this._render();
  },

  onDynastyTap(e) {
    const name = e.currentTarget.dataset.dynasty;
    const d = getDynastyObj(name);
    if (!d) return;
    this.manualFocusDynasty = name;
    const centerYear = (d.start + d.end) / 2;
    const vw = this._cw;
    const dynastySpan = d.end - d.start;
    const targetPPY = Math.max(0.15, (vw * 0.6) / Math.max(dynastySpan, 1));
    this.pixelsPerYear = Math.min(30, Math.max(0.01, targetPPY));
    this.offsetX = vw / 2 - centerYear * this.pixelsPerYear;
    this._clampOffsetSoft();
    this._render();
  },

  onFilterTap(e) {
    const cat = e.currentTarget.dataset.cat;
    const ac = { ...this.data.activeCats };
    if (cat === 'all') {
      const allActive = ac.all;
      Object.keys(ac).forEach(k => ac[k] = !allActive);
      this.activeCategories = !allActive ? new Set(['政治', '军事', '科技', '文化', '人物', '社会']) : new Set();
    } else {
      ac[cat] = !ac[cat];
      if (ac[cat]) this.activeCategories.add(cat);
      else this.activeCategories.delete(cat);
      ac.all = this.activeCategories.size === 6;
    }
    this.setData({ activeCats: ac });
    this._render();
  },

  onSearchTap() {
    this.setData({ searchShow: true, searchResults: [] });
  },

  closeSearch() {
    this.setData({ searchShow: false });
  },

  onSearchInput(e) {
    const q = e.detail.value.trim().toLowerCase();
    if (!q) { this.setData({ searchResults: [] }); return; }
    const results = this.events.filter(ev =>
      ev.title.toLowerCase().includes(q) || ev.summary.toLowerCase().includes(q) || ev.dynasty.includes(q)
    ).slice(0, 20).map((ev, idx) => ({
      idx, yearText: this._formatYear(ev.year), title: ev.title,
      category: ev.category, catColor: CATS[ev.category] ? CATS[ev.category].c : '#c9a96e',
      event: ev
    }));
    this.setData({ searchResults: results });
  },

  onSearchResultTap(e) {
    const idx = e.currentTarget.dataset.idx;
    const ev = this.data.searchResults[idx].event;
    // Navigate to event
    this.pixelsPerYear = 1.0;
    this.offsetX = this._cw / 2 - ev.year * this.pixelsPerYear;
    this._clampOffsetSoft();
    this.setData({ searchShow: false });
    this._render();
    setTimeout(() => this._showDetail(ev), 300);
  },

  _showDetail(e) {
    const catColor = CATS[e.category] ? CATS[e.category].c : '#c9a96e';
    let yearText = this._formatYear(e.year);
    if (e.month) yearText += e.month + '月';
    if (e.day) yearText += e.day + '日';
    const stars = e.level === 1 ? '★★★★★' : e.level === 2 ? '★★★★' : e.level === 3 ? '★★★' : e.level === 4 ? '★★' : '★';
    this.setData({
      detailShow: true,
      detailData: {
        yearText, title: e.title, category: e.category, dynasty: e.dynasty,
        starText: stars, detail: e.detail, context: e.context, catColor
      }
    });
  },

  closeDetail() {
    this.setData({ detailShow: false });
  },

  onFeedbackTap() {
    wx.navigateToMiniProgram ? null : null;
    // Open GitHub issues
    wx.setClipboardData({ data: 'https://github.com/O-kai/china-history-timeline/issues' });
    wx.showToast({ title: '已复制反馈链接', icon: 'none' });
  }
});
