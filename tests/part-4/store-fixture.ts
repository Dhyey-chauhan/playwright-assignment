// Self-contained store used by every part-4 spec.
//
// The page is built with page.setContent() rather than pointed at
// storedemo.testdino.com on purpose: this suite has to land on EXACTLY
// 10 passed / 10 failed every single run. Anything that touches the network
// can flake, and a flaky pass count makes the run useless as a fixture.
// Same approach the generated tests/regression/** specs already use.

export const PRODUCTS = [
  { sku: 'aurora-mug', name: 'Aurora Mug', price: 12 },
  { sku: 'basalt-tee', name: 'Basalt Tee', price: 25 },
  { sku: 'cobalt-cap', name: 'Cobalt Cap', price: 18 },
  { sku: 'drift-hoodie', name: 'Drift Hoodie', price: 40 },
];

export const STORE_HTML = `
<main id="app">
  <header>
    <h1 data-testid="store-title">TestDino Store</h1>
    <span data-testid="cart-count">0</span>
    <span data-testid="cart-total">$0</span>
  </header>

  <input data-testid="search" placeholder="Search products" />

  <ul id="catalogue">
    ${PRODUCTS.map(
      (p) => `<li data-sku="${p.sku}">
        <span class="name">${p.name}</span>
        <span class="price">$${p.price}</span>
        <button data-add="${p.sku}">Add</button>
        <button data-remove="${p.sku}" disabled>Remove</button>
      </li>`,
    ).join('')}
  </ul>

  <button data-testid="apply-promo">Apply promo</button>
  <section data-testid="promo" hidden>PROMO10 applied</section>

  <form id="checkout">
    <input name="email" data-testid="email" placeholder="you@example.com" />
    <button type="submit" data-testid="pay" disabled>Pay</button>
  </form>

  <p data-testid="status" role="status"></p>
</main>

<script>
  const qty = {};
  const prices = ${JSON.stringify(Object.fromEntries(PRODUCTS.map((p) => [p.sku, p.price])))};
  const countEl = document.querySelector('[data-testid="cart-count"]');
  const totalEl = document.querySelector('[data-testid="cart-total"]');
  const statusEl = document.querySelector('[data-testid="status"]');

  function render() {
    const items = Object.values(qty).reduce((a, b) => a + b, 0);
    const total = Object.entries(qty).reduce((a, [sku, n]) => a + prices[sku] * n, 0);
    countEl.textContent = String(items);
    totalEl.textContent = '$' + total;
    document.querySelectorAll('[data-remove]').forEach((b) => {
      b.disabled = !qty[b.dataset.remove];
    });
  }

  document.querySelectorAll('[data-add]').forEach((b) =>
    b.addEventListener('click', () => {
      qty[b.dataset.add] = (qty[b.dataset.add] || 0) + 1;
      render();
    }),
  );

  document.querySelectorAll('[data-remove]').forEach((b) =>
    b.addEventListener('click', () => {
      const sku = b.dataset.remove;
      if (qty[sku]) qty[sku] -= 1;
      if (!qty[sku]) delete qty[sku];
      render();
    }),
  );

  document.querySelector('[data-testid="search"]').addEventListener('input', (e) => {
    const term = e.target.value.trim().toLowerCase();
    let shown = 0;
    document.querySelectorAll('#catalogue li').forEach((li) => {
      const hit = li.querySelector('.name').textContent.toLowerCase().includes(term);
      li.hidden = !hit;
      if (hit) shown += 1;
    });
    statusEl.textContent = shown === 0 ? 'No products match your search' : '';
  });

  const email = document.querySelector('[data-testid="email"]');
  email.addEventListener('input', () => {
    document.querySelector('[data-testid="pay"]').disabled = !/.+@.+\\..+/.test(email.value);
  });

  document.querySelector('#checkout').addEventListener('submit', (e) => {
    e.preventDefault();
    statusEl.textContent = 'Order placed for ' + email.value;
  });

  // Deliberately async — gives the passing suite one real wait to exercise.
  document.querySelector('[data-testid="apply-promo"]').addEventListener('click', () => {
    setTimeout(() => {
      document.querySelector('[data-testid="promo"]').hidden = false;
    }, 300);
  });
</script>`;
