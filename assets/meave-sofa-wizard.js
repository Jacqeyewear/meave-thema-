/* Meave sofa-cover wizard: colour -> size -> overview, with bundling. */
(function () {
  class MeaveSofaWizard extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      try {
        this.variants = JSON.parse(this.querySelector('[data-msw-variants]').textContent);
      } catch (e) { this.variants = []; }
      this.variants = this.variants.filter(function (v) { return v && v.id; });

      this.afterAdd = this.getAttribute('data-after-add') || 'checkout';
      this.modal = this.querySelector('[data-msw-modal]');
      this.panels = Array.prototype.slice.call(this.querySelectorAll('[data-msw-panel]'));
      this.stepTabs = Array.prototype.slice.call(this.querySelectorAll('[data-msw-step-tab]'));
      this.coloursEl = this.querySelector('[data-msw-colours]');
      this.sizesEl = this.querySelector('[data-msw-sizesgrid]');
      this.colourLabel = this.querySelector('[data-msw-colour-label]');
      this.cartEl = this.querySelector('[data-msw-cart]');
      this.totalEl = this.querySelector('[data-msw-total]');
      this.backBtn = this.querySelector('[data-msw-back]');
      this.nextBtn = this.querySelector('[data-msw-next]');
      this.checkoutBtn = this.querySelector('[data-msw-checkout]');
      this.errorEl = this.querySelector('[data-msw-error]');

      // Money format from a sample price
      var sample = (this.variants[0] && this.variants[0].pf) || '£0.00';
      this.moneySymbol = (sample.match(/^[^\d\-]+/) || ['£'])[0];

      // Unique colours, in first-seen order, with a representative image
      this.colours = [];
      var seen = {};
      var self = this;
      this.variants.forEach(function (v) {
        if (!seen[v.c]) { seen[v.c] = { name: v.c, img: v.img || '' }; self.colours.push(seen[v.c]); }
        if (!seen[v.c].img && v.img) seen[v.c].img = v.img;
      });

      this.selColour = null;
      this.bundle = [];
      this.step = 1;

      this.renderColours();
      this.bind();
      this.render();
    }

    money(pence) { return this.moneySymbol + (pence / 100).toFixed(2); }

    bind() {
      var self = this;
      this.querySelectorAll('[data-msw-open]').forEach(function (b) { b.addEventListener('click', function () { self.open(); }); });
      this.querySelectorAll('[data-msw-close]').forEach(function (b) { b.addEventListener('click', function () { self.close(); }); });
      this.stepTabs.forEach(function (t) {
        t.addEventListener('click', function () {
          var n = parseInt(t.getAttribute('data-msw-step-tab'), 10);
          if (n === 2 && !self.selColour) return;
          if (n === 3 && !self.bundle.length) return;
          self.go(n);
        });
      });
      if (this.backBtn) this.backBtn.addEventListener('click', function () { self.go(Math.max(1, self.step - 1)); });
      if (this.nextBtn) this.nextBtn.addEventListener('click', function () { if (self.step === 2 && self.bundle.length) self.go(3); });
      if (this.checkoutBtn) this.checkoutBtn.addEventListener('click', function () { self.checkout(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && self.modal && !self.modal.hidden) self.close(); });
    }

    open() {
      if (this.modal.parentNode !== document.body) { this.modal.classList.add('msw-portal'); document.body.appendChild(this.modal); }
      this.modal.hidden = false;
      document.documentElement.style.overflow = 'hidden';
      document.body.classList.add('msw-open');
      var self = this;
      requestAnimationFrame(function () { self.modal.classList.add('is-open'); });
    }
    close() {
      this.modal.classList.remove('is-open');
      document.documentElement.style.overflow = '';
      document.body.classList.remove('msw-open');
      var m = this.modal;
      setTimeout(function () { m.hidden = true; }, 260);
    }

    go(n) { this.step = n; this.render(); var b = this.querySelector('.msw-body'); if (b) b.scrollTop = 0; }

    render() {
      var self = this;
      this.panels.forEach(function (p) { p.classList.toggle('is-active', parseInt(p.getAttribute('data-msw-panel'), 10) === self.step); });
      this.stepTabs.forEach(function (t) {
        var n = parseInt(t.getAttribute('data-msw-step-tab'), 10);
        t.classList.toggle('is-active', n === self.step);
        t.classList.toggle('is-done', n < self.step);
      });
      if (this.step === 2) this.renderSizes();
      if (this.step === 3) this.renderOverview();
      if (this.colourLabel) this.colourLabel.textContent = this.selColour || '';

      if (this.backBtn) this.backBtn.hidden = this.step === 1;
      if (this.nextBtn) {
        this.nextBtn.hidden = this.step !== 2;
        this.nextBtn.textContent = 'To overview';
        this.nextBtn.disabled = !this.bundle.length;
      }
      if (this.checkoutBtn) {
        this.checkoutBtn.hidden = this.step !== 3;
        this.checkoutBtn.disabled = !this.bundle.length;
      }
      this.clearError();
    }

    renderColours() {
      var self = this;
      this.coloursEl.innerHTML = '';
      this.colours.forEach(function (c) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'msw-colour' + (self.selColour === c.name ? ' is-on' : '');
        b.innerHTML =
          (c.img ? '<img class="msw-colour__img" src="' + c.img + '" alt="" loading="lazy">' : '<span class="msw-colour__img"></span>') +
          '<span class="msw-colour__name">' + esc(c.name) + '</span>';
        b.addEventListener('click', function () { self.selColour = c.name; self.renderColours(); self.go(2); });
        self.coloursEl.appendChild(b);
      });
    }

    sizesForColour(c) {
      var out = [], seen = {};
      this.variants.forEach(function (v) {
        if (v.c !== c || seen[v.s]) return;
        seen[v.s] = 1;
        out.push(v);
      });
      return out;
    }
    inBundle(id) { for (var i = 0; i < this.bundle.length; i++) if (this.bundle[i].id === id) return this.bundle[i]; return null; }

    renderSizes() {
      var self = this;
      this.sizesEl.innerHTML = '';
      var sizes = this.sizesForColour(this.selColour);
      sizes.forEach(function (v) {
        var row = document.createElement('div');
        row.className = 'msw-size' + (v.av ? '' : ' is-out');
        var line = self.inBundle(v.id);
        var right;
        if (!v.av) {
          right = '<span class="msw-size__price">Sold out</span>';
        } else if (line) {
          right =
            '<span class="msw-size__price">' + v.pf + '</span>' +
            '<span class="msw-size__qty"><button type="button" class="msw-size__qtybtn" data-dec>−</button>' +
            '<span class="msw-size__qtynum">' + line.qty + '</span>' +
            '<button type="button" class="msw-size__qtybtn" data-inc>+</button></span>';
        } else {
          right =
            '<span class="msw-size__price">' + v.pf + '</span>' +
            '<button type="button" class="msw-size__add" data-add><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Add</button>';
        }
        row.innerHTML = '<span class="msw-size__name">' + esc(v.s) + '</span>' + right;
        if (v.av) {
          var add = row.querySelector('[data-add]');
          if (add) add.addEventListener('click', function () { self.addItem(v); });
          var inc = row.querySelector('[data-inc]');
          if (inc) inc.addEventListener('click', function () { self.setQty(v.id, 1); });
          var dec = row.querySelector('[data-dec]');
          if (dec) dec.addEventListener('click', function () { self.setQty(v.id, -1); });
        }
        self.sizesEl.appendChild(row);
      });
    }

    addItem(v) {
      var line = this.inBundle(v.id);
      if (line) line.qty += 1;
      else this.bundle.push({ id: v.id, c: v.c, s: v.s, price: v.price, pf: v.pf, img: v.img || '', qty: 1 });
      this.render();
    }
    setQty(id, delta) {
      var line = this.inBundle(id);
      if (!line) return;
      line.qty += delta;
      if (line.qty <= 0) this.bundle = this.bundle.filter(function (b) { return b.id !== id; });
      this.render();
    }

    renderOverview() {
      var self = this;
      this.cartEl.innerHTML = '';
      var total = 0;
      this.bundle.forEach(function (b) {
        total += b.price * b.qty;
        var row = document.createElement('div');
        row.className = 'msw-line';
        row.innerHTML =
          (b.img ? '<img class="msw-line__img" src="' + b.img + '" alt="" loading="lazy">' : '<span class="msw-line__img"></span>') +
          '<span class="msw-line__meta"><span class="msw-line__name">' + esc(b.c) + ' · ' + esc(b.s) + '</span>' +
          '<button type="button" class="msw-line__rm" data-rm>Remove</button></span>' +
          '<span class="msw-line__price">' + (b.qty > 1 ? b.qty + ' × ' : '') + b.pf + '</span>';
        row.querySelector('[data-rm]').addEventListener('click', function () { self.setQty(b.id, -b.qty); });
        self.cartEl.appendChild(row);
      });
      if (this.totalEl) this.totalEl.textContent = this.money(total);
    }

    checkout() {
      var self = this;
      if (!this.bundle.length) return;
      this.clearError();
      this.checkoutBtn.classList.add('is-loading');
      var items = this.bundle.map(function (b) { return { id: b.id, quantity: b.qty }; });
      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ items: items })
      })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d && d.description ? d.description : 'Could not add to cart.'); return d; }); })
        .then(function () { window.location.assign(self.afterAdd === 'cart' ? '/cart' : '/checkout'); })
        .catch(function (err) { self.checkoutBtn.classList.remove('is-loading'); self.showError(err && err.message ? err.message : 'Something went wrong. Please try again.'); });
    }

    showError(m) { if (this.errorEl) { this.errorEl.textContent = m; this.errorEl.hidden = false; } }
    clearError() { if (this.errorEl) { this.errorEl.hidden = true; this.errorEl.textContent = ''; } }
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  if (!customElements.get('meave-sofa-wizard')) customElements.define('meave-sofa-wizard', MeaveSofaWizard);
})();
