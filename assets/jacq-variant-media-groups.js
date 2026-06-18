(() => {
  const HIDDEN_CLASS = "jacq-media-hidden";

  const getMap = () => {
    const el = document.querySelector("script[data-jacq-variant-media-map]");
    if (!el) return null;
    try { return JSON.parse(el.textContent.trim()); } catch { return null; }
  };

  const getSelectedVariantId = () => {
    // meest betrouwbare: de input in de add-to-cart form
    const input = document.querySelector('form[action*="/cart/add"] [name="id"]');
    if (input?.value) return String(input.value);

    // fallback: URL param
    const v = new URL(window.location.href).searchParams.get("variant");
    return v ? String(v) : null;
  };

  const parseMediaId = (el) => {
    const v =
      el?.dataset?.mediaId ||
      el?.getAttribute?.("data-media-id") ||
      el?.dataset?.thumbnailMediaId ||
      el?.getAttribute?.("data-thumbnail-media-id") ||
      el?.dataset?.thumbMediaId ||
      el?.getAttribute?.("data-thumb-media-id");

    if (!v) return null;
    const m = String(v).match(/(\d{6,})/);
    return m ? m[1] : null;
  };

  // Zet verbergen “hard” (class + hidden + inline)
  const hideEl = (el) => {
    el.classList.add(HIDDEN_CLASS, "hidden");
    el.setAttribute("aria-hidden", "true");
    el.style.display = "none";
  };

  const showEl = (el) => {
    el.classList.remove(HIDDEN_CLASS, "hidden");
    el.removeAttribute("aria-hidden");
    el.style.removeProperty("display");
  };

  function buildAnchorGroups(map) {
    const order = (map?.mediaOrder || []).map(String);
    const variantAnchor = map?.variantAnchor || {};

    // variantId -> anchorMediaId (string)
    const vToAnchor = new Map(
      Object.entries(variantAnchor).map(([vid, mid]) => [String(vid), String(mid)])
    );

    // unieke anchorMediaIds die ook echt bestaan in mediaOrder
    const uniqueAnchors = Array.from(new Set([...vToAnchor.values()]))
      .filter((mid) => mid && mid !== "0" && order.includes(mid));

    // map anchorMediaId -> index
    const anchorIdx = uniqueAnchors
      .map((mid) => [mid, order.indexOf(mid)])
      .sort((a, b) => a[1] - b[1]);

    // anchorMediaId -> allowedSet (range in mediaOrder)
    const anchorToSet = new Map();
    for (let i = 0; i < anchorIdx.length; i++) {
      const [anchorMid, start] = anchorIdx[i];
      const end = i + 1 < anchorIdx.length ? anchorIdx[i + 1][1] - 1 : order.length - 1;

      const set = new Set();
      for (let j = start; j <= end; j++) set.add(order[j]);
      anchorToSet.set(anchorMid, set);
    }

    return { vToAnchor, anchorToSet };
  }

  function applyFilter() {
    const map = getMap();
    if (!map) return;

    const selectedVariantId = getSelectedVariantId();
    if (!selectedVariantId) return;

    const { vToAnchor, anchorToSet } = buildAnchorGroups(map);

    const anchorMid = vToAnchor.get(selectedVariantId);
    const allowed = anchorMid ? anchorToSet.get(anchorMid) : null;

    // Als we geen mapping kunnen vinden: laat alles zien
    if (!allowed) {
      document.querySelectorAll("[data-media-id]").forEach(showEl);
      document.querySelectorAll("[data-thumbnail-media-id], [data-thumb-media-id], .thumbnail-list [data-media-id]").forEach(showEl);
      return;
    }

    // Grote media items
    document.querySelectorAll("[data-media-id]").forEach((el) => {
      const id = parseMediaId(el);
      if (!id) return;
      allowed.has(id) ? showEl(el) : hideEl(el);
    });

    // Thumbnails (brede selectors)
    document.querySelectorAll([
      "[data-thumbnail-media-id]",
      "[data-thumb-media-id]",
      ".thumbnail-list [data-media-id]",
      ".product__thumbnails [data-media-id]",
      ".product__thumbnail[data-media-id]"
    ].join(",")).forEach((el) => {
      const id = parseMediaId(el);
      if (!id) return;
      allowed.has(id) ? showEl(el) : hideEl(el);
    });
  }

  const schedule = () => requestAnimationFrame(() => requestAnimationFrame(applyFilter));

  document.addEventListener("DOMContentLoaded", schedule);
  document.addEventListener("change", schedule, true);
  document.addEventListener("click", schedule, true);
})();
