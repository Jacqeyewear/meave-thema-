/* JACQ – Brillen Quiz
 * Vanilla JS, client-side.
 * Laadt product data uit window.JACQ_QUIZ_PRODUCTS (via Liquid in de section).
 */
(function () {
  "use strict";

  const QUIZ_IMAGES = {
    "bril": [
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/noah-6825687.webp?v=1773431028",
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/amel-5683217.webp?v=1775070123",
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/charlotte-1021190.webp?v=1765298309"
    ],
    "zonnebril": [
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/ben-4663257.webp?v=1765319683",
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/senn-6171873.webp?v=1765297975",
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/zion-4168338.webp?v=1765298018"
    ],
    "Rond": [
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/cameron-8203631.webp?v=1773416145",
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/noah-6825687.webp?v=1773431028",
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/loren-3576665.webp?v=1773425140"
    ],
    "Vierkant": [
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/lux-2166440.webp?v=1773427768",
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/amel-5683217.webp?v=1775070123",
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/bram-9813960.webp?v=1765319684"
    ],
    "Rechthoek": [
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/sven-6321515.webp?v=1774993221",
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/jacky-2538312.webp?v=1765298737",
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/alec-7547605.webp?v=1773413488"
    ],
    "Cat eye": [
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/miranda-7932858.webp?v=1774992397",
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/lila-8584358.webp?v=1765299176",
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/daantje-7768740.webp?v=1765298381"
    ],
    "Hexagon": [
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/mikki-1418763.webp?v=1773429631",
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/dominique-9651417.webp?v=1774990005",
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/fem-2348443.webp?v=1765298601"
    ],
    "Acetaat": [
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/charlotte-1021190.webp?v=1765298309",
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/amel-5683217.webp?v=1775070123",
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/lux-2166440.webp?v=1773427768"
    ],
    "Kunststof": [
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/cameron-8203631.webp?v=1773416145",
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/noah-6825687.webp?v=1773431028",
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/loren-3576665.webp?v=1773425140"
    ],
    "Metaal": [
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/bram-9813960.webp?v=1765319684",
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/kasper-6765464.webp?v=1765298971",
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/koen-4425954.webp?v=1765299044"
    ],
    "Titanium": [
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/henny-5213629.webp?v=1773419446",
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/beau-5179226.webp?v=1774986556",
      "https://cdn.shopify.com/s/files/1/0910/4719/9056/files/bobby-7785729.webp?v=1774986750"
    ]
  };

  const COLOR_MAP = {
    "Zwart": ["Zwart", "Mat zwart", "Zwart/Zilver", "Zwart/Goud", "Zwart/Blauw", "Zwart/Rosé goud"],
    "Bruin / Havana": ["Havana", "Bruin", "Havana/Groen", "Havana/Geel", "Havana/Bruin", "Beige/Havana", "Grijs/Havana", "Beige", "Transparant bruin"],
    "Grijs": ["Grijs", "Donkergrijs", "Lichtgrijs", "Transparant grijs"],
    "Blauw": ["Blauw", "Transparant blauw", "Transparant Blauw", "Lichtblauw", "Blauw/Groen", "Transparant/Blauw", "Zwart/Blauw"],
    "Groen": ["Groen", "Groen/Havana", "Havana/Groen", "Blauw/Groen"],
    "Goud": ["Goud", "Roségoud", "Rosé Goud", "Zwart/Goud", "Zwart/Rosé goud"],
    "Zilver": ["Zilver", "Zwart/Zilver"],
    "Kleur": ["Rood", "Roze", "Paars", "Oranje", "Geel", "Wit", "Transparant Roze", "Transparant paars", "Transparant beige"],
    "Transparant": ["Transparant", "Transparant blauw", "Transparant Blauw", "Transparant grijs", "Transparant paars", "Transparant beige", "Transparant bruin", "Transparant Roze", "Transparant/Blauw"]
  };

  const COLOR_SWATCHES = {
    "Zwart": { type: "solid", value: "#1a1a1a" },
    "Bruin / Havana": { type: "solid", value: "#8B4513" },
    "Grijs": { type: "solid", value: "#999999" },
    "Blauw": { type: "solid", value: "#3478F6" },
    "Groen": { type: "solid", value: "#30845A" },
    "Goud": { type: "solid", value: "#C9A84C" },
    "Zilver": { type: "solid", value: "#A8A8AD" },
    "Kleur": { type: "rainbow" },
    "Transparant": { type: "transparent" }
  };

  const STEPS = [
    {
      key: "type",
      title: "Wat zoek je?",
      kind: "single",
      variant: "stacked-large",
      options: [
        { value: "bril", label: "Brillen" },
        { value: "zonnebril", label: "Zonnebrillen" }
      ],
      skip: null
    },
    {
      key: "voor",
      title: "Voor wie?",
      kind: "single",
      variant: "text",
      options: [
        { value: "Dames", label: "Dames" },
        { value: "Heren", label: "Heren" }
      ],
      skip: "Geen voorkeur"
    },
    {
      key: "vorm",
      title: "Welke vormen vind je mooi?",
      subtitle: "Kies er zoveel als je wilt",
      kind: "multi",
      variant: "stacked",
      options: [
        { value: "Rond", label: "Rond" },
        { value: "Vierkant", label: "Vierkant" },
        { value: "Rechthoek", label: "Rechthoek" },
        { value: "Cat eye", label: "Cat eye" },
        { value: "Hexagon", label: "Hexagon" }
      ],
      skip: "Geen voorkeur"
    },
    {
      key: "kleur",
      title: "Welke kleuren?",
      subtitle: "Kies er zoveel als je wilt",
      kind: "multi",
      variant: "color",
      options: [
        { value: "Zwart", label: "Zwart" },
        { value: "Bruin / Havana", label: "Bruin / Havana" },
        { value: "Grijs", label: "Grijs" },
        { value: "Blauw", label: "Blauw" },
        { value: "Groen", label: "Groen" },
        { value: "Goud", label: "Goud" },
        { value: "Zilver", label: "Zilver" },
        { value: "Kleur", label: "Kleur" },
        { value: "Transparant", label: "Transparant" }
      ],
      skip: "Geen voorkeur"
    },
    {
      key: "materiaal",
      title: "Welk materiaal?",
      subtitle: "Kies er zoveel als je wilt",
      kind: "multi",
      variant: "material",
      options: [
        { value: "Acetaat", label: "Acetaat", description: "Stevig & kleurrijk" },
        { value: "Kunststof", label: "Kunststof", description: "Licht & flexibel" },
        { value: "Metaal", label: "Metaal", description: "Dun & minimaal" },
        { value: "Titanium", label: "Titanium", description: "Ultra licht" }
      ],
      skip: "Geen voorkeur"
    },
    {
      key: "pasvorm",
      title: "Hoe breed is je gezicht?",
      kind: "single",
      variant: "face",
      options: [
        { value: "Smal", label: "Smal" },
        { value: "Gemiddeld", label: "Gemiddeld" },
        { value: "Breed", label: "Breed" }
      ],
      skip: "Weet ik niet"
    }
  ];

  const STORAGE_KEY = "jacq_quiz_state_v1";

  // ── Paspakket mode ─────────────────────────────────────────────
  // When the quiz is opened from /pages/pas-pakket?from=paspakket,
  // result cards become "add to paspakket" toggles instead of
  // links to the product page. Selection persists in the same
  // localStorage key the paspakket page uses, so the chosen frames
  // appear in the slots when the user returns.
  const PASPAKKET_KEY = "jacq-paspakket-v1";
  const PASPAKKET_MAX = 4;
  const IS_PASPAKKET = (function () {
    try {
      const params = new URLSearchParams(location.search);
      if (params.get("from") === "paspakket") return true;
      return /\/pages\/pas-pakket(\/|\?|$)/i.test(document.referrer || "");
    } catch (e) { return false; }
  })();
  function paspakketRead() {
    try {
      const raw = localStorage.getItem(PASPAKKET_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.slice(0, PASPAKKET_MAX) : [];
    } catch (e) { return []; }
  }
  function paspakketWrite(arr) {
    try { localStorage.setItem(PASPAKKET_KEY, JSON.stringify(arr.slice(0, PASPAKKET_MAX))); }
    catch (e) {}
  }
  function paspakketHas(key) {
    return paspakketRead().some(function (s) {
      return String(s.productId) === String(key) || String(s.productHandle) === String(key);
    });
  }
  function paspakketToggle(item) {
    const arr = paspakketRead();
    const idx = arr.findIndex(function (s) {
      return (item.productId && String(s.productId) === String(item.productId)) ||
             (item.productHandle && String(s.productHandle) === String(item.productHandle));
    });
    if (idx >= 0) {
      arr.splice(idx, 1);
      paspakketWrite(arr);
      return false;
    }
    if (arr.length >= PASPAKKET_MAX) return null;
    arr.push(item);
    paspakketWrite(arr);
    return true;
  }

  const state = {
    stepIndex: 0,
    answers: {
      type: null,
      voor: null,
      vorm: [],
      kleur: [],
      materiaal: [],
      pasvorm: null
    },
    completed: false,
    newsletterSeen: false
  };

  function saveState() {
    try {
      const payload = {
        stepIndex: state.stepIndex,
        answers: state.answers,
        completed: state.completed,
        newsletterSeen: state.newsletterSeen,
        savedAt: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      // localStorage kan falen (private mode, quota) — negeer
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      return parsed;
    } catch (err) {
      return null;
    }
  }

  function clearState() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {}
  }

  // ===== Microsoft Clarity API events =====
  // Fire-and-forget funnel tracking. Each event fires only once per
  // page-view session; flags are reset when the quiz is restarted.
  const clarityFlags = {};
  function fireClarity(name) {
    if (clarityFlags[name]) return;
    clarityFlags[name] = true;
    try {
      if (typeof clarity === "function") {
        clarity("event", name);
      }
    } catch (e) { /* no-op: never break the quiz on tracking */ }
  }
  function resetClarityFlags() {
    for (const k in clarityFlags) delete clarityFlags[k];
  }

  // Elements
  const root = document.querySelector("[data-jacq-quiz]");
  if (!root) return;
  const stage = root.querySelector("[data-jacq-stage]");
  const progressFill = root.querySelector("[data-jacq-progress]");

  // Helpers
  function el(tag, opts = {}, children = []) {
    const node = document.createElement(tag);
    if (opts.class) node.className = opts.class;
    if (opts.attrs) {
      Object.keys(opts.attrs).forEach(k => node.setAttribute(k, opts.attrs[k]));
    }
    if (opts.text != null) node.textContent = opts.text;
    if (opts.html != null) node.innerHTML = opts.html;
    if (opts.on) {
      Object.keys(opts.on).forEach(ev => node.addEventListener(ev, opts.on[ev]));
    }
    (Array.isArray(children) ? children : [children]).forEach(c => {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function stackedPhotos(key) {
    const imgs = QUIZ_IMAGES[key] || [];
    const wrap = el("div", { class: "jacq-stack" });
    imgs.forEach((src, i) => {
      const cls = "jacq-stack__img jacq-stack__img--" + i;
      wrap.appendChild(el("div", { class: cls }, [
        el("img", { attrs: { src: src, alt: "", loading: "lazy" } })
      ]));
    });
    return wrap;
  }

  function colorSwatch(value) {
    const s = COLOR_SWATCHES[value];
    const node = el("div", { class: "jacq-swatch" });
    // Inline styles zodat thema CSS ze niet kan overschrijven
    node.style.display = "block";
    node.style.width = "64px";
    node.style.height = "64px";
    node.style.minWidth = "64px";
    node.style.minHeight = "64px";
    node.style.borderRadius = "50%";
    node.style.border = "1px solid rgba(0,0,0,0.08)";
    node.style.boxShadow = "inset 0 1px 2px rgba(255,255,255,0.25)";
    node.style.flexShrink = "0";
    if (!s) return node;
    if (s.type === "solid") {
      node.style.background = s.value;
    } else if (s.type === "rainbow") {
      node.style.background = "conic-gradient(from 0deg, #ff3b30, #ff9500, #ffcc00, #34c759, #30b0c7, #007aff, #af52de, #ff2d55, #ff3b30)";
    } else if (s.type === "transparent") {
      node.style.background = "#ffffff";
      node.style.border = "2px dashed rgba(0,0,0,0.25)";
    }
    return node;
  }

  function faceIllustration(value) {
    // Three visually distinct face-shape outlines (oval, round, square jaw).
    const stroke = "#1d1d1f";
    let path = "";
    if (value === "Smal") {
      // Tall narrow oval — height clearly greater than width
      path = `<path d="M55 14
                       C 71 14, 80 30, 80 55
                       C 80 80, 71 96, 55 96
                       C 39 96, 30 80, 30 55
                       C 30 30, 39 14, 55 14 Z"
                    fill="none" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`;
    } else if (value === "Breed") {
      // Wide face with squared jawline — width > height, soft corners
      path = `<path d="M22 36
                       C 22 24, 32 18, 55 18
                       C 78 18, 88 24, 88 36
                       L 88 70
                       C 88 84, 76 96, 55 96
                       C 34 96, 22 84, 22 70 Z"
                    fill="none" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`;
    } else {
      // Gemiddeld — balanced round oval
      path = `<path d="M55 16
                       C 76 16, 86 32, 86 55
                       C 86 80, 76 96, 55 96
                       C 34 96, 24 80, 24 55
                       C 24 32, 34 16, 55 16 Z"
                    fill="none" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`;
    }

    return el("div", {
      class: "jacq-face",
      html: `
        <svg viewBox="0 0 110 110" width="92" height="92" aria-hidden="true">
          ${path}
        </svg>
      `
    });
  }

  function updateProgress() {
    const total = STEPS.length;
    const pct = ((state.stepIndex) / total) * 100;
    if (progressFill) progressFill.style.width = pct + "%";
  }

  function isSelected(step, value) {
    const a = state.answers[step.key];
    if (step.kind === "multi") return Array.isArray(a) && a.indexOf(value) !== -1;
    return a === value;
  }

  function toggleSelection(step, value) {
    if (step.kind === "multi") {
      const current = state.answers[step.key] || [];
      const idx = current.indexOf(value);
      if (idx === -1) current.push(value);
      else current.splice(idx, 1);
      state.answers[step.key] = current;
    } else {
      state.answers[step.key] = value;
    }
  }

  function canContinue(step) {
    const a = state.answers[step.key];
    if (step.kind === "multi") return Array.isArray(a) && a.length > 0;
    return a != null && a !== "";
  }

  function renderOption(step, option, index) {
    const selected = isSelected(step, option.value);
    const card = el("button", {
      class: "jacq-option jacq-option--" + step.variant + (selected ? " is-selected" : ""),
      attrs: { type: "button", "aria-pressed": selected ? "true" : "false" },
      on: {
        click: (e) => {
          e.preventDefault();
          toggleSelection(step, option.value);
          updateSelectionUI(step);
          // 10. tap pulse
          card.classList.remove("is-just-tapped");
          // re-trigger animation
          void card.offsetWidth;
          card.classList.add("is-just-tapped");
          setTimeout(() => card.classList.remove("is-just-tapped"), 260);
        }
      }
    });
    if (typeof index === "number") {
      card.style.setProperty("--i", index);
    }

    // Visual / media
    if (step.variant === "stacked" || step.variant === "stacked-large") {
      card.appendChild(el("div", { class: "jacq-option__media" }, [stackedPhotos(option.value)]));
    } else if (step.variant === "color") {
      card.appendChild(el("div", { class: "jacq-option__media jacq-option__media--color" }, [colorSwatch(option.value)]));
    } else if (step.variant === "material") {
      card.appendChild(el("div", { class: "jacq-option__media" }, [stackedPhotos(option.value)]));
    } else if (step.variant === "face") {
      card.appendChild(el("div", { class: "jacq-option__media jacq-option__media--face" }, [faceIllustration(option.value)]));
    }

    // Label + description
    const labelWrap = el("div", { class: "jacq-option__label-wrap" });
    labelWrap.appendChild(el("div", { class: "jacq-option__label", text: option.label }));
    if (option.description) {
      labelWrap.appendChild(el("div", { class: "jacq-option__desc", text: option.description }));
    }
    card.appendChild(labelWrap);

    return card;
  }

  function updateSelectionUI(step) {
    // In-place update van de huidige stap zonder her-render / animatie
    const optionButtons = stage.querySelectorAll(".jacq-option");
    optionButtons.forEach((btn, i) => {
      const opt = step.options[i];
      if (!opt) return;
      const sel = isSelected(step, opt.value);
      btn.classList.toggle("is-selected", sel);
      btn.setAttribute("aria-pressed", sel ? "true" : "false");
    });
    const primary = stage.querySelector(".jacq-btn-primary");
    if (primary) {
      primary.classList.toggle("is-hidden", !canContinue(step));
    }
    // Multi-select counter live update (idea 2)
    if (step.kind === "multi") {
      const counter = stage.querySelector("[data-multi-count]");
      if (counter) {
        const count = (state.answers[step.key] || []).length;
        counter.textContent = count > 0 ? count + " geselecteerd" : "";
        counter.classList.toggle("is-active", count > 0);
      }
    }
    saveState();
  }

  function scrollToQuizTop() {
    if (!root) return;
    // scroll-margin-top (in CSS) zorgt dat er ruimte onder de sticky header blijft
    try {
      root.scrollIntoView({ block: "start", behavior: "smooth" });
    } catch (err) {
      // Fallback voor oudere browsers
      const rect = root.getBoundingClientRect();
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      window.scrollTo(0, currentScroll + rect.top - 100);
    }
  }

  function transitionOut(direction, done) {
    var current = stage.querySelector(".jacq-step, .jacq-results, .jacq-newsletter");
    if (!current) {
      done();
      return;
    }
    var leaveClass = direction === "back" ? "is-leaving is-leaving--back" : "is-leaving";
    current.className += " " + leaveClass;
    var ran = false;
    function finish() {
      if (ran) return;
      ran = true;
      done();
    }
    setTimeout(finish, 240);
  }

  function nextStep() {
    console.log("[JACQ quiz] nextStep", state.stepIndex, state.answers);
    transitionOut("forward", function () {
      try {
        if (state.stepIndex < STEPS.length - 1) {
          state.stepIndex += 1;
          state.completed = false;
          saveState();
          renderStep("forward");
        } else {
          state.completed = true;
          saveState();
          if (!state.newsletterSeen) {
            renderNewsletterGate("forward");
          } else {
            renderResults("forward");
          }
        }
        scrollToQuizTop();
      } catch (err) {
        console.error("[JACQ quiz] nextStep error", err);
        showError(err);
      }
    });
  }

  function showError(err) {
    stage.innerHTML = "";
    const box = el("div", { class: "jacq-step" });
    box.appendChild(el("h2", { text: "Er ging iets mis" }));
    box.appendChild(el("p", { text: String(err && err.message ? err.message : err) }));
    box.appendChild(el("button", {
      class: "jacq-btn-primary",
      attrs: { type: "button" },
      text: "Opnieuw beginnen",
      on: { click: resetQuiz }
    }));
    stage.appendChild(box);
  }

  function prevStep() {
    if (state.stepIndex <= 0) return;
    transitionOut("back", function () {
      state.stepIndex -= 1;
      renderStep("back");
      scrollToQuizTop();
    });
  }

  function renderStep(direction) {
    const step = STEPS[state.stepIndex];
    updateProgress();
    fireClarity("quiz_step_" + step.key);

    const wrap = el("div", { class: "jacq-step", attrs: { "data-step": step.key } });

    // Back button (above header, small)
    const topBar = el("div", { class: "jacq-step__topbar" });
    if (state.stepIndex > 0) {
      topBar.appendChild(el("button", {
        class: "jacq-back",
        attrs: { type: "button" },
        text: "← Terug",
        on: { click: prevStep }
      }));
    }
    topBar.appendChild(el("div", {
      class: "jacq-step__counter",
      text: "Stap " + (state.stepIndex + 1) + " van " + STEPS.length
    }));
    wrap.appendChild(topBar);

    // Header
    const header = el("header", { class: "jacq-step__header" });
    header.appendChild(el("h1", { class: "jacq-step__title", text: step.title }));
    if (step.subtitle) {
      header.appendChild(el("p", { class: "jacq-step__subtitle", text: step.subtitle }));
    }
    // Multi-select counter (idea 2)
    if (step.kind === "multi") {
      const count = (state.answers[step.key] || []).length;
      header.appendChild(el("p", {
        class: "jacq-step__count" + (count > 0 ? " is-active" : ""),
        attrs: { "data-multi-count": "" },
        text: count > 0 ? count + " geselecteerd" : ""
      }));
    }
    wrap.appendChild(header);

    // Options grid
    const grid = el("div", { class: "jacq-options jacq-options--" + step.variant });
    step.options.forEach((option, i) => grid.appendChild(renderOption(step, option, i)));
    wrap.appendChild(grid);

    // Footer: continue button (for multi) + skip
    const footer = el("div", { class: "jacq-step__footer" });

    const canGo = canContinue(step);
    const isLastStep = state.stepIndex === STEPS.length - 1;
    footer.appendChild(el("button", {
      class: "jacq-btn-primary" + (canGo ? "" : " is-hidden"),
      attrs: { type: "button" },
      text: isLastStep ? "Bekijk resultaten" : "Verder",
      on: { click: nextStep }
    }));

    if (step.skip) {
      footer.appendChild(el("button", {
        class: "jacq-skip",
        attrs: { type: "button" },
        text: step.skip,
        on: {
          click: () => {
            if (step.kind === "multi") state.answers[step.key] = [];
            else state.answers[step.key] = null;
            nextStep();
          }
        }
      }));
    }
    wrap.appendChild(footer);

    // Animate in (fail-safe: content is zichtbaar default, pre-enter class voor animatie)
    wrap.classList.add("is-pre-enter");
    if (direction === "back") wrap.classList.add("is-pre-enter--back");
    stage.innerHTML = "";
    stage.appendChild(wrap);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        wrap.classList.remove("is-pre-enter");
        wrap.classList.remove("is-pre-enter--back");
      });
    });
  }

  function buildResultControls(allCards, gridContainer) {
    // 5. filter/sort controls
    const controls = el("div", { class: "jacq-results__controls" });

    // Filter pills based on match buckets
    const filters = el("div", { class: "jacq-results__filters" });
    const buckets = [
      { key: "all",   label: "Alle",        test: () => true },
      { key: "high",  label: "75%+",        test: (m) => m >= 75 },
      { key: "perfect", label: "100%",      test: (m) => m === 100 }
    ];
    let active = "all";

    function applyFilter() {
      const bucket = buckets.find(b => b.key === active) || buckets[0];
      allCards.forEach(card => {
        const m = parseFloat(card.dataset.match || "0");
        const show = bucket.test(m);
        card.classList.toggle("is-hidden", !show);
      });
    }

    function applySort(mode) {
      const sorted = allCards.slice().sort((a, b) => {
        const ma = parseFloat(a.dataset.match || "0");
        const mb = parseFloat(b.dataset.match || "0");
        const pa = parseFloat(a.dataset.price || "0");
        const pb = parseFloat(b.dataset.price || "0");
        if (mode === "price-asc")  return pa - pb;
        if (mode === "price-desc") return pb - pa;
        return mb - ma; // best match default
      });
      sorted.forEach(card => gridContainer.appendChild(card));
    }

    buckets.forEach(b => {
      const count = allCards.filter(c => b.test(parseFloat(c.dataset.match || "0"))).length;
      if (count === 0 && b.key !== "all") return;
      const pill = el("button", {
        class: "jacq-filter-pill" + (b.key === active ? " is-active" : ""),
        attrs: { type: "button" },
        text: b.label + " (" + count + ")",
        on: {
          click: () => {
            active = b.key;
            filters.querySelectorAll(".jacq-filter-pill").forEach(p =>
              p.classList.toggle("is-active", p === pill));
            applyFilter();
          }
        }
      });
      filters.appendChild(pill);
    });

    const sort = el("select", {
      class: "jacq-results__sort",
      attrs: { "aria-label": "Sorteren" },
      on: { change: (e) => applySort(e.target.value) }
    });
    [
      { value: "match",      text: "Beste match" },
      { value: "price-asc",  text: "Prijs ↑" },
      { value: "price-desc", text: "Prijs ↓" }
    ].forEach(opt => {
      const o = document.createElement("option");
      o.value = opt.value;
      o.textContent = opt.text;
      sort.appendChild(o);
    });

    controls.appendChild(filters);
    controls.appendChild(sort);
    return controls;
  }

  function asArray(v) {
    if (Array.isArray(v)) return v;
    if (v == null || v === "") return [];
    return [v];
  }

  function normStr(s) {
    if (s == null) return "";
    if (typeof s === "object") {
      // Fallback voor metaobjects die toch als object doorkomen
      if (s.label) return normStr(s.label);
      if (s.name) return normStr(s.name);
      if (s.title) return normStr(s.title);
      if (s.handle) return normStr(s.handle);
      return "";
    }
    return String(s).toLowerCase().trim();
  }

  function arrIncludesCI(arr, needle) {
    const n = normStr(needle);
    if (!n) return false;
    return arr.some(item => normStr(item) === n);
  }

  function displayLabel(s) {
    if (s == null) return "";
    let str;
    if (typeof s === "object") {
      str = s.label || s.name || s.title || s.handle || "";
    } else {
      str = String(s);
    }
    str = String(str).trim();
    if (!str) return "";
    // "cat-eye" -> "Cat eye", "acetaat" -> "Acetaat"
    const parts = str.replace(/-/g, " ").split(" ");
    return parts
      .map((p, i) => (i === 0 ? p.charAt(0).toUpperCase() + p.slice(1) : p))
      .join(" ");
  }

  // Gewichten per filter — pasvorm weegt veel lichter omdat het "extra" is
  const FILTER_WEIGHTS = {
    vorm: 1.0,
    kleur: 1.0,
    materiaal: 1.0,
    pasvorm: 0.3
  };

  function scoreProduct(p, answers) {
    let score = 0;     // raw count (voor "N van M voorkeuren" display)
    let max = 0;
    let weighted = 0;  // gewogen score (voor sortering + perfect-classificatie)
    let weightedMax = 0;
    try {
      if (answers.vorm && answers.vorm.length > 0) {
        max += 1;
        weightedMax += FILTER_WEIGHTS.vorm;
        const vorm = asArray(p.vorm);
        if (answers.vorm.some(v => arrIncludesCI(vorm, v))) {
          score += 1;
          weighted += FILTER_WEIGHTS.vorm;
        }
      }
      if (answers.kleur && answers.kleur.length > 0) {
        max += 1;
        weightedMax += FILTER_WEIGHTS.kleur;
        const kleuren = asArray(p.kleuren);
        const matchColors = answers.kleur.flatMap(k => COLOR_MAP[k] || []);
        if (matchColors.some(mc => arrIncludesCI(kleuren, mc))) {
          score += 1;
          weighted += FILTER_WEIGHTS.kleur;
        }
      }
      if (answers.materiaal && answers.materiaal.length > 0) {
        max += 1;
        weightedMax += FILTER_WEIGHTS.materiaal;
        const materiaal = asArray(p.materiaal);
        if (answers.materiaal.some(m => arrIncludesCI(materiaal, m))) {
          score += 1;
          weighted += FILTER_WEIGHTS.materiaal;
        }
      }
      if (answers.pasvorm) {
        max += 1;
        weightedMax += FILTER_WEIGHTS.pasvorm;
        if (normStr(p.pasvorm) === normStr(answers.pasvorm)) {
          score += 1;
          weighted += FILTER_WEIGHTS.pasvorm;
        }
      }
    } catch (err) {
      console.warn("[JACQ quiz] score error on product", p, err);
    }
    return { score: score, max: max, weighted: weighted, weightedMax: weightedMax };
  }

  function filterProducts(answers) {
    const products = Array.isArray(window.JACQ_QUIZ_PRODUCTS) ? window.JACQ_QUIZ_PRODUCTS : [];

    // Hard filters: type en voor (met Unisex fallback) — deze moeten matchen
    const hardFiltered = products.filter(p => {
      try {
        if (answers.type && p.type !== answers.type) return false;
        if (answers.voor) {
          const voor = asArray(p.voor);
          if (!arrIncludesCI(voor, answers.voor) && !arrIncludesCI(voor, "Unisex")) return false;
        }
        return true;
      } catch (err) {
        console.warn("[JACQ quiz] hard filter error on product", p, err);
        return false;
      }
    });

    // Score op basis van soft filters (vorm, kleur, materiaal, pasvorm)
    const scored = hardFiltered.map(p => {
      const s = scoreProduct(p, answers);
      return { product: p, score: s.score, max: s.max, weighted: s.weighted, weightedMax: s.weightedMax };
    });

    // Sorteer op gewogen score (hoog naar laag)
    scored.sort((a, b) => b.weighted - a.weighted);

    // Perfect = gewogen score >= 90% van weightedMax. Door de lage weight
    // van pasvorm (0.3) telt een 3/4 match zonder pasvorm nog steeds als
    // ~91% en komt in de 'perfect' sectie.
    const PERFECT_THRESHOLD = 0.9;
    const perfect = scored.filter(s => s.weightedMax > 0 && (s.weighted / s.weightedMax) >= PERFECT_THRESHOLD);
    const partial = scored.filter(s => s.weightedMax > 0 && s.weighted > 0 && (s.weighted / s.weightedMax) < PERFECT_THRESHOLD);
    const rest = scored.filter(s => s.weightedMax === 0 || s.weighted === 0);

    return {
      all: scored,
      perfect: perfect,
      partial: partial,
      rest: rest,
      maxPossible: scored.length > 0 ? scored[0].max : 0
    };
  }

  function pickMatchingVariant(p, answers) {
    // Als er een kleurfilter actief is, probeer een variant te vinden waarvan
    // de titel matcht met een van de geselecteerde kleuren (via COLOR_MAP).
    const variants = Array.isArray(p.variants) ? p.variants : [];
    if (!variants.length) return null;
    if (!answers.kleur || answers.kleur.length === 0) return null;
    const matchColors = answers.kleur.flatMap(k => COLOR_MAP[k] || []);
    for (const mc of matchColors) {
      const found = variants.find(v => normStr(v.title) === normStr(mc));
      if (found) return found;
    }
    return null;
  }

  function buildResultCard(entry) {
    const p = entry.product;
    const score = entry.score || 0;
    const max = entry.max || 0;

    // Kies de matchende variant-image als er een kleurfilter is
    const matchedVariant = pickMatchingVariant(p, state.answers);
    const cardImage = (matchedVariant && matchedVariant.image) ? matchedVariant.image : p.image;
    let cardHref = "https://jacqeyewear.nl/products/" + p.handle;
    if (matchedVariant && matchedVariant.id) {
      cardHref += "?variant=" + encodeURIComponent(matchedVariant.id);
    }

    const matchPct = max > 0 ? Math.round((score / max) * 100) : 0;
    const priceNum = parseFloat(String(p.price).replace(/[^0-9.,-]/g, "").replace(",", "."));
    // Use the product handle as the stable identifier in paspakket mode
    // (id may be missing from the quiz data; handle is always present
    // and unique per product). Falling back to id keeps existing data
    // shape compatible.
    const ppKey = p.handle || String(p.id || "");
    // In paspakket mode the card is a toggle button (no navigation);
    // otherwise it's a link to the PDP as before.
    const card = IS_PASPAKKET
      ? el("button", {
          class: "jacq-result-card jacq-result-card--toggle",
          attrs: {
            type: "button",
            "aria-label": p.title,
            "aria-pressed": paspakketHas(ppKey) ? "true" : "false",
            "data-product-id": ppKey,
            "data-match": String(matchPct),
            "data-price": isFinite(priceNum) ? String(priceNum) : "0"
          },
          on: {
            click: function (e) {
              e.preventDefault();
              const item = {
                productId: p.id || p.handle,
                variantId: (matchedVariant && matchedVariant.id) ? matchedVariant.id : (p.variants && p.variants[0] && p.variants[0].id) || null,
                productHandle: p.handle,
                productTitle: p.title,
                variantTitle: (matchedVariant && matchedVariant.title) ? matchedVariant.title : ((p.variants && p.variants[0] && p.variants[0].title) || ""),
                image: cardImage
              };
              const res = paspakketToggle(item);
              if (res === null) {
                // pakket full — bounce + toast
                card.classList.remove("is-just-bounced");
                void card.offsetWidth;
                card.classList.add("is-just-bounced");
                setTimeout(function () { card.classList.remove("is-just-bounced"); }, 600);
                if (typeof window.JACQ_PASPAKKET_TOAST === "function") {
                  window.JACQ_PASPAKKET_TOAST();
                }
              } else {
                card.classList.toggle("is-selected", res === true);
                card.setAttribute("aria-pressed", res === true ? "true" : "false");
              }
              if (typeof window.JACQ_PASPAKKET_REFRESH === "function") {
                window.JACQ_PASPAKKET_REFRESH();
              }
            }
          }
        })
      : el("a", {
          class: "jacq-result-card",
          attrs: {
            href: cardHref,
            "aria-label": p.title,
            "data-match": String(matchPct),
            "data-price": isFinite(priceNum) ? String(priceNum) : "0"
          }
        });
    if (IS_PASPAKKET && paspakketHas(p.id)) {
      card.classList.add("is-selected");
    }
    const imgWrap = el("div", { class: "jacq-result-card__image" });
    if (cardImage) {
      imgWrap.appendChild(el("img", {
        attrs: { src: cardImage, alt: p.title, loading: "lazy" }
      }));
    }
    card.appendChild(imgWrap);

    const info = el("div", { class: "jacq-result-card__info" });
    const titleRow = el("div", { class: "jacq-result-card__title-row" });
    titleRow.appendChild(el("div", { class: "jacq-result-card__title", text: p.title }));
    titleRow.appendChild(el("div", { class: "jacq-result-card__price", text: "€" + p.price }));
    info.appendChild(titleRow);

    // Match score indicator — alleen tonen als er soft filters zijn ingevuld
    if (max > 0) {
      const pct = Math.round((score / max) * 100);
      const matchWrap = el("div", { class: "jacq-match" });
      const matchHeader = el("div", { class: "jacq-match__header" });
      matchHeader.appendChild(el("span", {
        class: "jacq-match__label",
        text: score + " van " + max + " voorkeuren"
      }));
      matchHeader.appendChild(el("span", {
        class: "jacq-match__pct",
        text: pct + "%"
      }));
      matchWrap.appendChild(matchHeader);

      const bar = el("div", { class: "jacq-match__bar" });
      // Inline styles zodat theme CSS ze niet overschrijft
      bar.style.position = "relative";
      bar.style.width = "100%";
      bar.style.height = "5px";
      bar.style.background = "#f0f0f2";
      bar.style.borderRadius = "999px";
      bar.style.overflow = "hidden";
      bar.style.display = "block";

      const fill = el("div", { class: "jacq-match__fill" });
      fill.style.position = "absolute";
      fill.style.top = "0";
      fill.style.left = "0";
      fill.style.height = "100%";
      fill.style.width = "0%";
      fill.style.borderRadius = "999px";
      fill.style.display = "block";
      // Smooth red -> orange -> yellow -> green based on match %.
      // Hue: 0 (red) at 0% -> 130 (green) at 100%.
      const hue = Math.min(130, Math.max(0, Math.round(pct * 1.3)));
      const fillColor = "hsl(" + hue + ", 72%, 46%)";
      fill.style.background = fillColor;
      fill.style.transition = "width 700ms cubic-bezier(0.22, 1, 0.36, 1)";
      // Animate to target width on next frame so the bar visibly slides in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          fill.style.width = pct + "%";
        });
      });
      bar.appendChild(fill);
      matchWrap.appendChild(bar);
      info.appendChild(matchWrap);
    }

    card.appendChild(info);
    return card;
  }

  function buildNewsletterTags() {
    const tags = ["newsletter", "quiz"];
    const a = state.answers;
    const slug = function (s) {
      return String(s).toLowerCase().replace(/[\s/]+/g, "-").replace(/[^a-z0-9-]/g, "");
    };
    if (a.type) tags.push("quiz-" + slug(a.type));
    if (a.voor) tags.push("quiz-voor-" + slug(a.voor));
    if (a.pasvorm) tags.push("quiz-pasvorm-" + slug(a.pasvorm));
    (a.vorm || []).forEach(function (v) { tags.push("quiz-vorm-" + slug(v)); });
    (a.kleur || []).forEach(function (v) { tags.push("quiz-kleur-" + slug(v)); });
    (a.materiaal || []).forEach(function (v) { tags.push("quiz-materiaal-" + slug(v)); });
    return tags.join(", ");
  }

  function submitNewsletter(email) {
    const formData = new FormData();
    formData.append("form_type", "customer");
    formData.append("utf8", "✓");
    formData.append("contact[email]", email);
    formData.append("contact[tags]", buildNewsletterTags());
    formData.append("contact[context]", "quiz");
    return fetch("/contact#contact_form", {
      method: "POST",
      body: formData,
      headers: { "Accept": "text/html" }
    }).then(function (resp) {
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      return resp;
    });
  }

  function proceedToResults(direction) {
    transitionOut(direction || "forward", function () {
      renderResults("forward");
      scrollToQuizTop();
    });
  }

  function renderNewsletterGate(direction) {
    if (progressFill) progressFill.style.width = "100%";
    fireClarity("quiz_newsletter_shown");

    const wrap = el("div", { class: "jacq-newsletter", attrs: { "data-step": "newsletter" } });

    const header = el("header", { class: "jacq-newsletter__header" });
    header.appendChild(el("p", {
      class: "jacq-newsletter__eyebrow",
      text: "Jouw resultaten zijn klaar"
    }));
    header.appendChild(el("h1", {
      class: "jacq-newsletter__title",
      text: "Blijf op de hoogte"
    }));
    header.appendChild(el("p", {
      class: "jacq-newsletter__subtitle",
      text: "Ontvang als eerste bericht over nieuwe collecties en beperkte edities."
    }));
    wrap.appendChild(header);

    const form = el("form", {
      class: "jacq-newsletter__form",
      attrs: { novalidate: "" }
    });

    const field = el("div", { class: "jacq-newsletter__field" });
    const input = el("input", {
      class: "jacq-newsletter__input",
      attrs: {
        type: "email",
        name: "email",
        placeholder: "Je e‑mailadres",
        autocomplete: "email",
        autocapitalize: "off",
        autocorrect: "off",
        spellcheck: "false",
        required: ""
      }
    });
    field.appendChild(input);
    form.appendChild(field);

    const status = el("p", {
      class: "jacq-newsletter__status",
      attrs: { "aria-live": "polite", role: "status" }
    });
    form.appendChild(status);

    const actions = el("div", { class: "jacq-newsletter__actions" });
    const submit = el("button", {
      class: "jacq-btn-primary jacq-newsletter__submit",
      attrs: { type: "submit" },
      text: "Inschrijven"
    });
    actions.appendChild(submit);

    const skip = el("button", {
      class: "jacq-btn-secondary jacq-newsletter__skip",
      attrs: { type: "button" },
      text: "Bekijk resultaten",
      on: {
        click: function () {
          fireClarity("quiz_newsletter_skipped");
          state.newsletterSeen = true;
          saveState();
          proceedToResults("forward");
        }
      }
    });
    actions.appendChild(skip);
    form.appendChild(actions);

    wrap.appendChild(form);

    wrap.appendChild(el("p", {
      class: "jacq-newsletter__trust",
      text: "Geen spam. Uitschrijven kan op elk moment."
    }));

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = (input.value || "").trim();
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        status.textContent = "Vul een geldig e‑mailadres in.";
        status.className = "jacq-newsletter__status is-error";
        input.focus();
        return;
      }
      submit.disabled = true;
      submit.textContent = "Bezig…";
      status.textContent = "";
      status.className = "jacq-newsletter__status";
      submitNewsletter(email).then(function () {
        fireClarity("quiz_newsletter_subscribed");
        state.newsletterSeen = true;
        saveState();
        status.textContent = "Bedankt — we houden je op de hoogte.";
        status.className = "jacq-newsletter__status is-success";
        setTimeout(function () { proceedToResults("forward"); }, 1100);
      }).catch(function (err) {
        console.error("[JACQ quiz] newsletter submit error", err);
        status.textContent = "Er ging iets mis. Probeer het nog eens.";
        status.className = "jacq-newsletter__status is-error";
        submit.disabled = false;
        submit.textContent = "Inschrijven";
      });
    });

    wrap.classList.add("is-pre-enter");
    if (direction === "back") wrap.classList.add("is-pre-enter--back");
    stage.innerHTML = "";
    stage.appendChild(wrap);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        wrap.classList.remove("is-pre-enter");
        wrap.classList.remove("is-pre-enter--back");
      });
    });
  }

  function renderResults(opts) {
    opts = opts || {};
    if (progressFill) progressFill.style.width = "100%";
    fireClarity("quiz_completed");

    const results = filterProducts(state.answers);
    const wrap = el("div", { class: "jacq-results" });

    // Banner als de resultaten worden getoond op basis van opgeslagen state
    if (opts.fromSaved) {
      const banner = el("div", { class: "jacq-saved-banner" });
      banner.appendChild(el("span", {
        class: "jacq-saved-banner__text",
        text: "Gebaseerd op je eerdere keuzes"
      }));
      banner.appendChild(el("button", {
        class: "jacq-link-button jacq-saved-banner__action",
        attrs: { type: "button" },
        text: "Opnieuw doen",
        on: { click: resetQuiz }
      }));
      wrap.appendChild(banner);
    }

    const hasPerfect = results.perfect.length > 0;
    const hasPartial = results.partial.length > 0;
    const totalShown = results.all.length;
    const typeLabel = state.answers.type === "zonnebril" ? "zonnebrillen" : "brillen";
    const typeSingular = state.answers.type === "zonnebril" ? "zonnebril" : "bril";
    const perfectLabel = results.perfect.length === 1 ? typeSingular : typeLabel;

    const header = el("header", { class: "jacq-results__header" });

    if (totalShown === 0) {
      header.appendChild(el("h1", {
        class: "jacq-results__title",
        text: "Geen " + typeLabel + " gevonden"
      }));
      header.appendChild(el("p", {
        class: "jacq-results__subtitle",
        text: "Er zijn momenteel geen producten beschikbaar in deze categorie. Probeer opnieuw."
      }));
    } else if (hasPerfect) {
      header.appendChild(el("h1", {
        class: "jacq-results__title",
        text: results.perfect.length + " " + perfectLabel + " voor jou"
      }));
      header.appendChild(el("p", {
        class: "jacq-results__subtitle",
        text: "Perfect afgestemd op je voorkeuren."
      }));
    } else if (hasPartial) {
      header.appendChild(el("h1", {
        class: "jacq-results__title",
        text: "Onze beste matches voor jou"
      }));
      header.appendChild(el("p", {
        class: "jacq-results__subtitle",
        text: "Niets die precies past, maar deze " + typeLabel + " komen dicht in de buurt."
      }));
    } else {
      header.appendChild(el("h1", {
        class: "jacq-results__title",
        text: "Geen perfecte match"
      }));
      header.appendChild(el("p", {
        class: "jacq-results__subtitle",
        text: "Bekijk hieronder onze populairste " + typeLabel + "."
      }));
    }
    wrap.appendChild(header);

    // Build the unified card list
    const allCards = [];
    let primaryList = [];
    if (hasPerfect) {
      primaryList = results.perfect;
    } else if (hasPartial) {
      primaryList = results.partial;
    } else {
      primaryList = results.rest;
    }
    primaryList.forEach(p => allCards.push(buildResultCard(p)));

    // 8. Empty state — no products at all
    if (totalShown > 0 && allCards.length === 0) {
      const empty = el("div", { class: "jacq-results__empty" });
      empty.appendChild(el("p", {
        class: "jacq-results__empty-title",
        text: "Geen perfecte match gevonden"
      }));
      empty.appendChild(el("p", {
        class: "jacq-results__empty-text",
        text: "Bekijk hieronder onze populairste " + typeLabel + " uit het assortiment."
      }));
      wrap.appendChild(empty);
    }

    // Primary grid + filter/sort controls (idea 5)
    if (allCards.length > 0) {
      const grid = el("div", { class: "jacq-results__grid" });
      allCards.forEach(card => grid.appendChild(card));
      // Only show filter controls when there's variation worth filtering on
      if (allCards.length >= 4) {
        wrap.appendChild(buildResultControls(allCards, grid));
      }
      wrap.appendChild(grid);
    }

    // Secondary grid: "Ook interessant" — only when we already had perfect matches
    if (hasPerfect) {
      const more = results.partial.concat(results.rest);
      if (more.length > 0) {
        wrap.appendChild(el("div", {
          class: "jacq-results__divider",
          html: '<h2 class="jacq-results__subheading">Ook interessant</h2><p class="jacq-results__subtitle">Andere ' + typeLabel + ' die je misschien leuk vindt.</p>'
        }));
        const grid2 = el("div", { class: "jacq-results__grid" });
        more.forEach(p => grid2.appendChild(buildResultCard(p)));
        wrap.appendChild(grid2);
      }
    }

    const footer = el("div", { class: "jacq-results__footer" });
    footer.appendChild(el("button", {
      class: "jacq-link-button",
      attrs: { type: "button" },
      text: "Quiz opnieuw doen",
      on: { click: resetQuiz }
    }));
    wrap.appendChild(footer);

    // Paspakket mode: sticky bottom bar showing selection count + a
    // "Terug naar paspakket" CTA. Updates live on every card toggle.
    // The bar is appended to <body> (not the results container) — the
    // results container has its own `transform`, which would otherwise
    // make `position: fixed` resolve against it instead of the
    // viewport, breaking the sticky-on-scroll behaviour.
    if (IS_PASPAKKET) {
      // Remove any leftover bar from a previous render
      const oldBar = document.getElementById('jacq-paspakket-bar');
      if (oldBar) oldBar.parentNode.removeChild(oldBar);
      const oldToast = document.getElementById('jacq-paspakket-toast');
      if (oldToast) oldToast.parentNode.removeChild(oldToast);

      const bar = el("div", { class: "jacq-paspakket-bar", attrs: { id: "jacq-paspakket-bar" } });
      const label = el("div", { class: "jacq-paspakket-bar__label" });
      const cta = el("a", {
        class: "jacq-paspakket-bar__cta",
        attrs: { href: "/pages/pas-pakket" }
      });
      bar.appendChild(label);
      bar.appendChild(cta);
      document.body.appendChild(bar);

      const toastEl = el("div", { class: "jacq-paspakket-toast", attrs: { id: "jacq-paspakket-toast" }, text: "Je pakket zit al vol (4 brillen)." });
      document.body.appendChild(toastEl);

      window.JACQ_PASPAKKET_REFRESH = function () {
        const arr = paspakketRead();
        const n = arr.length;
        label.innerHTML =
          '<strong>' + n + '/' + PASPAKKET_MAX + '</strong> ' +
          (n === 1 ? 'bril' : 'brillen') + ' geselecteerd';
        cta.textContent = n > 0 ? 'Terug naar paspakket →' : 'Naar paspakket';
        bar.classList.toggle('is-active', n > 0);
        // Re-sync card selected states (cards may exist before bar render).
        // Match by either productId OR productHandle — the quiz card's
        // data-product-id is the handle (stable, always present),
        // while selection items may use either as their key depending
        // on origin (paspakket page vs quiz).
        document.querySelectorAll('.jacq-result-card--toggle').forEach(function (c) {
          const pid = c.getAttribute('data-product-id');
          const has = arr.some(function (s) {
            return String(s.productId) === String(pid) || String(s.productHandle) === String(pid);
          });
          c.classList.toggle('is-selected', has);
          c.setAttribute('aria-pressed', has ? 'true' : 'false');
        });
      };
      window.JACQ_PASPAKKET_TOAST = function () {
        toastEl.classList.remove('is-visible');
        void toastEl.offsetWidth;
        toastEl.classList.add('is-visible');
        setTimeout(function () { toastEl.classList.remove('is-visible'); }, 2400);
      };
      requestAnimationFrame(window.JACQ_PASPAKKET_REFRESH);
    }

    wrap.classList.add("is-pre-enter");
    stage.innerHTML = "";
    stage.appendChild(wrap);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => wrap.classList.remove("is-pre-enter"));
    });
    console.log("[JACQ quiz] renderResults done. perfect:", results.perfect.length, "partial:", results.partial.length, "rest:", results.rest.length);
  }

  function resetQuiz() {
    state.stepIndex = 0;
    state.answers = {
      type: null,
      voor: null,
      vorm: [],
      kleur: [],
      materiaal: [],
      pasvorm: null
    };
    state.completed = false;
    state.newsletterSeen = false;
    clearState();
    fireClarity("quiz_reset");
    resetClarityFlags();
    // Tear down the paspakket sticky bar so it doesn't linger while
    // the user re-takes the quiz.
    const stickyBar = document.getElementById('jacq-paspakket-bar');
    if (stickyBar) stickyBar.parentNode.removeChild(stickyBar);
    const stickyToast = document.getElementById('jacq-paspakket-toast');
    if (stickyToast) stickyToast.parentNode.removeChild(stickyToast);
    renderStep();
    scrollToQuizTop();
  }

  // Kickoff — laad opgeslagen state indien aanwezig
  (function init() {
    fireClarity("quiz_opened");
    const saved = loadState();
    if (saved && saved.answers && typeof saved.stepIndex === "number") {
      state.answers = Object.assign(state.answers, saved.answers);
      state.stepIndex = saved.stepIndex;
      state.completed = !!saved.completed;
      state.newsletterSeen = !!saved.newsletterSeen;
      if (state.completed) {
        renderResults({ fromSaved: true });
        return;
      }
      if (state.stepIndex < 0 || state.stepIndex >= STEPS.length) {
        state.stepIndex = 0;
      }
      renderStep();
      return;
    }
    renderStep();
  })();
})();