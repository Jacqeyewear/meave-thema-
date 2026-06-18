// assets/collection-swatches-fix.js
(() => {
  const productCache = new Map(); // handle -> Promise(productJson)
  const cardStates = new WeakMap(); // cardEl -> state

  const isDesktopHover = () =>
    window.matchMedia &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function getHandleFromUrl(url) {
    const m = String(url).match(/\/products\/([^\/\?#]+)/);
    return m ? m[1] : null;
  }

  function getHandleFromLocation() {
    return getHandleFromUrl(window.location.pathname);
  }

  function findSwatchArea(el) {
    return el.closest?.(
      ".swatches--variant, .swatches, .product-form__swatches, [data-swatches]"
    );
  }

  function getInputFromClickable(clickable) {
    return (
      (clickable?.matches?.('input[type="radio"], input[type="checkbox"]') ? clickable : null) ||
      clickable?.querySelector?.('input[type="radio"], input[type="checkbox"]') ||
      clickable?.closest?.("label")?.querySelector?.('input[type="radio"], input[type="checkbox"]') ||
      clickable?.closest?.("li")?.querySelector?.('input[type="radio"], input[type="checkbox"]') ||
      null
    );
  }

  function getVariantIdFromElement(el) {
    // 1) data attributes
    const ds = el?.dataset || {};
    const fromData =
      ds.variantId || ds.variant || ds.idVariant || ds.selectedVariantId || null;
    if (fromData && /^\d+$/.test(fromData)) return fromData;

    // 2) href?variant=123
    const a =
      el.closest?.('a[href*="/products/"], a[href*="variant="]') ||
      (el.tagName === "A" ? el : null);
    if (a?.getAttribute) {
      const href = a.getAttribute("href");
      try {
        const u = new URL(href, window.location.origin);
        const v = u.searchParams.get("variant");
        if (v && /^\d+$/.test(v)) return v;
      } catch (_) {}
    }

    // 3) input dataset/value
    const input = el
      .closest?.("li, .swatch, .swatches--variant")
      ?.querySelector?.('input[type="radio"], input[type="checkbox"]');
    if (input) {
      const v = input.dataset?.variantId || input.dataset?.variant || input.value;
      if (v && /^\d+$/.test(v)) return v;
    }

    return null;
  }

  function getSwatchValueFromClickable(clickable) {
    const input = getInputFromClickable(clickable);

    const v =
      input?.dataset?.value ||
      input?.value ||
      clickable?.dataset?.value ||
      clickable?.getAttribute?.("aria-label") ||
      clickable?.textContent ||
      "";

    return String(v).trim();
  }

  // --- Card helpers ---
  function findCardRoot(target) {
    const card =
      target.closest?.(".product-card") ||
      target.closest?.(".card-product") ||
      target.closest?.(".product-item") ||
      target.closest?.(".grid-product") ||
      null;

    if (card) return card;

    const li = target.closest?.("li") || null;
    if (!li) return null;

    const link = li.querySelector?.('a[href*="/products/"]') || null;
    const img = link?.querySelector?.("img") || li.querySelector?.("img") || null;
    if (link && img) return li;

    return null;
  }

  function findProductLink(card) {
    return card?.querySelector?.('a[href*="/products/"]') || null;
  }

  function findCardImages(card) {
    if (!card) return [];
    const selectors = [
      ".card__media img",
      ".product-card__media img",
      ".product-card__image img",
      ".card-product__media img",
      ".media img",
      'a[href*="/products/"] img',
    ];

    const set = new Set();
    selectors.forEach((sel) => {
      card.querySelectorAll(sel).forEach((img) => set.add(img));
    });

    if (set.size === 0) {
      const img = card.querySelector("img");
      if (img) set.add(img);
    }

    // skip tiny icons
    return Array.from(set).filter((img) => {
      const w = Number(img.getAttribute("width")) || img.naturalWidth || 0;
      const h = Number(img.getAttribute("height")) || img.naturalHeight || 0;
      return (w === 0 && h === 0) || (w >= 80 && h >= 80);
    });
  }

  function setImage(img, src) {
    if (!img || !src) return;

    img.setAttribute("src", src);

    // Sync srcset if present (theme may rely on it)
    if (img.hasAttribute("srcset")) img.setAttribute("srcset", src);

    if (img.dataset) {
      if ("src" in img.dataset) img.dataset.src = src;
      if ("srcset" in img.dataset) img.dataset.srcset = src;
    }

    // If inside <picture>, update sources too (avoid mismatch)
    const pic = img.closest?.("picture");
    if (pic) {
      pic.querySelectorAll("source").forEach((s) => {
        if (s.hasAttribute("srcset")) s.setAttribute("srcset", src);
        if (s.dataset && "srcset" in s.dataset) s.dataset.srcset = src;
      });
    }
  }

  function setLinkVariant(link, variantId) {
    if (!link || !variantId) return;
    try {
      const u = new URL(link.getAttribute("href"), window.location.origin);
      u.searchParams.set("variant", variantId);
      link.setAttribute("href", u.pathname + (u.search ? u.search : ""));
    } catch (_) {}
  }

  async function fetchProductJson(handle) {
    if (!handle) return null;
    if (!productCache.has(handle)) {
      productCache.set(
        handle,
        fetch(`/products/${handle}.js`, { credentials: "same-origin" })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      );
    }
    return productCache.get(handle);
  }

  function getOrInitCardState(card, productLink) {
    let st = cardStates.get(card);
    if (st) return st;

    const imgs = findCardImages(card);
    const firstSrc = imgs[0]?.getAttribute("src") || imgs[0]?.src || null;

    let initialVariantId = null;
    try {
      const u = new URL(productLink?.getAttribute("href") || "", window.location.origin);
      const v = u.searchParams.get("variant");
      if (v && /^\d+$/.test(v)) initialVariantId = v;
    } catch (_) {}

    st = {
      handle: getHandleFromUrl(productLink?.getAttribute("href") || ""),
      selectedVariantId: initialVariantId,
      selectedSrc: firstSrc,
      _initialSrc: firstSrc,
      hoverVariantId: null,
      hoverSrc: null,
      selectToken: 0,
      hoverToken: 0,
    };

    cardStates.set(card, st);
    return st;
  }

  function setActiveSwatch(clicked) {
    const wrap = clicked.closest?.(".swatches--variant");
    if (!wrap) return;

    const li = clicked.closest?.("li, .swatch") || clicked.parentElement;
    const input = li?.querySelector?.('input[type="radio"], input[type="checkbox"]');
    if (input) input.checked = true;

    wrap
      .querySelectorAll(".color-swatch.is-active")
      .forEach((n) => n.classList.remove("is-active"));

    const sw = clicked.classList?.contains("color-swatch")
      ? clicked
      : clicked.querySelector?.(".color-swatch") ||
        clicked.closest?.(".color-swatch");

    if (sw) sw.classList.add("is-active");
  }

  function findVariantWithImageByValue(product, swatchValue) {
    if (!product?.variants?.length || !swatchValue) return null;
    const val = String(swatchValue).toLowerCase();

    let v = product.variants.find((x) => {
      const o1 = String(x.option1 || "").toLowerCase();
      return o1 === val && x?.featured_image?.src;
    });
    if (v) return v;

    v = product.variants.find((x) => {
      const opts = (x.options || []).map((o) => String(o || "").toLowerCase());
      return opts.includes(val) && x?.featured_image?.src;
    });
    return v || null;
  }

  async function resolveVariantImage(product, variantId, swatchValue) {
    if (!product?.variants?.length) return { variant: null, src: null };

    if (variantId) {
      const v = product.variants.find((x) => String(x.id) === String(variantId)) || null;
      const src = v?.featured_image?.src || null;
      return { variant: v, src };
    }

    const vv = findVariantWithImageByValue(product, swatchValue);
    return { variant: vv, src: vv?.featured_image?.src || null };
  }

  // Use an overlay image on top of the card media instead of modifying
  // existing img srcs. This avoids all LazyImage / carousel state issues.
  function showVariantOverlay(card, src) {
    if (!card || !src) return;
    removeVariantOverlay(card);

    const mediaWrap = card.querySelector('.product-card__media, .card__media');
    if (!mediaWrap) return;

    const overlay = document.createElement('img');
    overlay.src = src;
    overlay.className = 'swatch-variant-overlay';
    Object.assign(overlay.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      zIndex: '2',
      pointerEvents: 'none',
      background: '#fff',
      borderRadius: 'var(--card-radius, 0px)',
      overflow: 'hidden',
    });
    mediaWrap.style.position = 'relative';
    mediaWrap.appendChild(overlay);
  }

  function removeVariantOverlay(card) {
    if (!card) return;
    const overlay = card.querySelector('.swatch-variant-overlay');
    if (overlay) overlay.remove();
  }

  async function applySelected(card, productLink, clickable, variantId) {
    const st = getOrInitCardState(card, productLink);
    st.selectToken += 1;
    const token = st.selectToken;

    const handle = st.handle || getHandleFromUrl(productLink.getAttribute("href"));
    if (!handle) return;

    st.selectedVariantId = String(variantId || "");
    const swatchValue = getSwatchValueFromClickable(clickable);

    const product = await fetchProductJson(handle);
    if (!product) return;
    if (st.selectToken !== token) return;

    const { variant, src } = await resolveVariantImage(product, variantId, swatchValue);

    if (!src) {
      if (variantId) setLinkVariant(productLink, String(variantId));
      return;
    }

    st.selectedSrc = src;

    if (!st.hoverVariantId) {
      showVariantOverlay(card, src);
    }

    if (variant?.id) setLinkVariant(productLink, String(variant.id));
  }

  async function applyHover(card, productLink, clickable, variantId) {
    const st = getOrInitCardState(card, productLink);
    st.hoverToken += 1;
    const token = st.hoverToken;

    const handle = st.handle || getHandleFromUrl(productLink.getAttribute("href"));
    if (!handle) return;

    st.hoverVariantId = String(variantId || "");
    const swatchValue = getSwatchValueFromClickable(clickable);

    const product = await fetchProductJson(handle);
    if (!product) return;

    if (st.hoverToken !== token) return;
    if (!st.hoverVariantId || String(variantId || "") !== st.hoverVariantId) return;

    const { src } = await resolveVariantImage(product, variantId, swatchValue);
    if (!src) return;

    st.hoverSrc = src;
    showVariantOverlay(card, src);
  }

  function restoreFromHover(card) {
    const st = cardStates.get(card);
    if (!st) return;
    st.hoverVariantId = null;
    st.hoverSrc = null;

    // If a variant was selected (clicked), keep its overlay; otherwise remove
    if (st.selectedSrc && st.selectedSrc !== st._initialSrc) {
      showVariantOverlay(card, st.selectedSrc);
    } else {
      removeVariantOverlay(card);
    }
  }

  function isLeavingArea(e) {
    const area = findSwatchArea(e.target);
    if (!area) return false;
    const rt = e.relatedTarget;
    if (rt && area.contains(rt)) return false;
    return true;
  }

  // =========================
  // Product page hover support
  // =========================

  function getCurrentVariantIdFromPage() {
    const idInput =
      document.querySelector('form[action*="/cart/add"] input[name="id"]') ||
      document.querySelector('input[name="id"]');
    const v1 = idInput?.value;
    if (v1 && /^\d+$/.test(v1)) return v1;

    try {
      const u = new URL(window.location.href);
      const v2 = u.searchParams.get("variant");
      if (v2 && /^\d+$/.test(v2)) return v2;
    } catch (_) {}

    return null;
  }

  function readSelectedOptionsFromForm(product) {
    const form =
      document.querySelector('form[action*="/cart/add"]') ||
      document.querySelector(".product-form form") ||
      document.querySelector("form");

    const selected = new Map();
    if (!form || !product?.options?.length) return selected;

    form.querySelectorAll('select[name^="options["], select[name^="option"]').forEach((sel) => {
      const name = sel.getAttribute("name") || "";
      const value = sel.value;

      const m2 = name.match(/options\[(.+?)\]/i);
      if (m2) selected.set(m2[1], value);

      const m1 = name.match(/option(\d)/i);
      if (m1) {
        const idx = Math.max(0, parseInt(m1[1], 10) - 1);
        selected.set(product.options[idx], value);
      }
    });

    form
      .querySelectorAll('input[type="radio"]:checked[name^="options["], input[type="radio"]:checked[name^="option"]')
      .forEach((inp) => {
        const name = inp.getAttribute("name") || "";
        const value = inp.value;

        const m2 = name.match(/options\[(.+?)\]/i);
        if (m2) selected.set(m2[1], value);

        const m1 = name.match(/option(\d)/i);
        if (m1) {
          const idx = Math.max(0, parseInt(m1[1], 10) - 1);
          selected.set(product.options[idx], value);
        }
      });

    return selected;
  }

  function getOptionIndexFromInput(input, product) {
    if (!input) return null;

    const di = input.dataset?.optionIndex || input.dataset?.index;
    if (di && /^\d+$/.test(di)) return Math.max(0, parseInt(di, 10));

    const name = input.getAttribute?.("name") || "";

    const m1 = name.match(/option(\d)/i);
    if (m1) return Math.max(0, parseInt(m1[1], 10) - 1);

    const m2 = name.match(/options\[(.+?)\]/i);
    if (m2 && product?.options?.length) {
      const optName = m2[1].trim().toLowerCase();
      const idx = product.options.findIndex((o) => String(o).toLowerCase() === optName);
      if (idx >= 0) return idx;
    }

    return null;
  }

  function findVariantIdByOptions(product, hoveredValue, hoveredOptionIndex) {
    if (!product?.variants?.length) return null;

    const currentId = getCurrentVariantIdFromPage();
    const currentVariant = currentId
      ? product.variants.find((v) => String(v.id) === String(currentId))
      : null;

    const selected = readSelectedOptionsFromForm(product);

    const opts = product.options.map((optName, i) => {
      const fromForm = selected.get(optName);
      const fromCurrent = currentVariant?.options?.[i];
      return fromForm || fromCurrent || null;
    });

    if (hoveredOptionIndex != null) {
      opts[hoveredOptionIndex] = hoveredValue;
    } else if (opts.length === 1) {
      opts[0] = hoveredValue;
    } else {
      return null;
    }

    if (opts.some((v) => !v)) return null;

    const match = product.variants.find((v) => {
      if (!Array.isArray(v.options)) return false;
      return v.options.every((val, i) => String(val) === String(opts[i]));
    });

    return match ? String(match.id) : null;
  }

  function findProductPageMainImage() {
    const selectors = [
      ".product__media-item.is-active img",
      '.product__media-item[aria-current="true"] img',
      "media-gallery .is-active img",
      "media-gallery img",
      ".product__media img",
      ".product__media-list img",
      ".product-gallery img",
      ".product-media img",
      ".product__gallery img",
      "main img",
    ];
    for (const sel of selectors) {
      const img = document.querySelector(sel);
      if (img && img.getAttribute) return img;
    }
    return null;
  }

  const productPageState = {
    token: 0,
    imgEl: null,
    restoreSrc: null,
    restoreTimer: null,
  };

  function cancelProductPageRestore() {
    if (productPageState.restoreTimer) {
      clearTimeout(productPageState.restoreTimer);
      productPageState.restoreTimer = null;
    }
  }

  function resetProductPageState() {
    cancelProductPageRestore();
    productPageState.token += 1;
    productPageState.imgEl = null;
    productPageState.restoreSrc = null;
  }

  function scheduleProductPageRestore() {
    cancelProductPageRestore();
    productPageState.restoreTimer = setTimeout(() => {
      if (productPageState.imgEl && productPageState.restoreSrc) {
        setImage(productPageState.imgEl, productPageState.restoreSrc);
      }
      productPageState.imgEl = null;
      productPageState.restoreSrc = null;
      productPageState.restoreTimer = null;
    }, 80);
  }

  async function applyProductPageHover(clickable) {
    const handle = getHandleFromLocation();
    if (!handle) return;

    const product = await fetchProductJson(handle);
    if (!product?.variants?.length) return;

    const myToken = ++productPageState.token;

    // variantId direct? (soms niet)
    let variantId = getVariantIdFromElement(clickable);

    // fallback: match via huidige opties + hovered waarde
    if (!variantId) {
      const input = getInputFromClickable(clickable);
      const hoveredValue = getSwatchValueFromClickable(clickable);
      if (!hoveredValue) return;

      const optIdx = getOptionIndexFromInput(input, product);
      variantId = findVariantIdByOptions(product, hoveredValue, optIdx);
    }

    if (!variantId) return;

    const v = product.variants.find((x) => String(x.id) === String(variantId));
    const src = v?.featured_image?.src || null;

    // Alleen hover preview als variant een eigen image heeft (anders geen “foute” foto)
    if (!src) return;

    if (productPageState.token !== myToken) return;

    const img = findProductPageMainImage();
    if (!img) return;

    cancelProductPageRestore();

    // restore = huidige geselecteerde foto (actueel bij start hover-sessie)
    productPageState.imgEl = img;
    if (!productPageState.restoreSrc) {
      productPageState.restoreSrc = img.getAttribute("src") || img.src || null;
    }

    setImage(img, src);
  }

  // -------- Events --------
  async function onSwatchHover(e) {
    if (!isDesktopHover()) return;

    const swatchArea = findSwatchArea(e.target);
    if (!swatchArea) return;

    const clickable = e.target.closest?.(
      "a, label, .color-swatch, [data-variant-id], input"
    );
    if (!clickable) return;

    const card = findCardRoot(clickable);
    const productLink = findProductLink(card);

    // Card hover
    if (card && productLink) {
      const variantId = getVariantIdFromElement(clickable);
      if (!variantId) return;
      await applyHover(card, productLink, clickable, variantId);
      return;
    }

    // Product page hover
    await applyProductPageHover(clickable);
  }

  function onSwatchClick(e) {
    const swatchArea = findSwatchArea(e.target);
    if (!swatchArea) return;

    const clickable = e.target.closest?.(
      "a, label, .color-swatch, [data-variant-id], input"
    );
    if (!clickable) return;

    const card = findCardRoot(clickable);
    const productLink = findProductLink(card);

    // Card click
    if (card && productLink) {
      const variantId = getVariantIdFromElement(clickable);
      if (!variantId) return;

      e.preventDefault();
      e.stopPropagation();

      setActiveSwatch(clickable);
      applySelected(card, productLink, clickable, variantId);
      return;
    }

    // Product page click: theme is truth, dus cancel onze hover-restore
    resetProductPageState();
  }

  // Hover preview (desktop only)
  document.addEventListener("pointerover", onSwatchHover, true);

  // Restore when leaving swatch area
  document.addEventListener(
    "pointerout",
    (e) => {
      if (!isDesktopHover()) return;

      const swatchArea = findSwatchArea(e.target);
      if (!swatchArea) return;
      if (!isLeavingArea(e)) return;

      const card = findCardRoot(e.target);
      const productLink = findProductLink(card);

      // Cards: restore selected
      if (card && productLink) {
        restoreFromHover(card);
        return;
      }

      // Product page: restore selected image
      scheduleProductPageRestore();
    },
    true
  );

  // Click on cards + cancel productpage hover restore on selection
  document.addEventListener("click", onSwatchClick, true);
})();