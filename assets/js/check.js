const initial = [
  { id: '1', name: 'Onyx Bomber Jacket', meta: 'Tailored Outerwear', size: 'M', color: 'Jet Black', price: 289, qty: 1, image: 'jacket.jpg' },
  { id: '2', name: 'Indigo Slim Denim', meta: 'Japanese Selvedge', size: '32', color: 'Deep Indigo', price: 178, qty: 1, image: 'jeans.jpg' },
  { id: '3', name: 'Court Low Sneakers', meta: 'Italian Leather', size: '42', color: 'Optic White', price: 215, qty: 1, image: 'sneakers.jpg' },
  { id: '4', name: 'Essential Crew Tee', meta: 'Pima Cotton', size: 'M', color: 'Charcoal', price: 58, qty: 2, image: 'tshirt.jpg' },
];

let items = [...initial];
let promoApplied = false;

const $ = (s) => document.querySelector(s);
const itemsEl = $('#items');

function fmt(n) { return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

function render() {
  if (items.length === 0) {
    itemsEl.innerHTML = `
      <div class="empty">
        <h2>Your bag is empty</h2>
        <p>Discover our latest drop.</p>
        <button class="btn btn-secondary" id="restore">Restore items</button>
      </div>`;
    $('#restore').onclick = () => { items = [...initial]; render(); };
  } else {
    itemsEl.innerHTML = items.map((it, i) => `
      <article class="item" data-id="${it.id}" style="animation-delay:${i * 70}ms">
        <div class="item-img"><img src="${it.image}" alt="${it.name}" loading="lazy" /></div>
        <div class="item-body">
          <div class="item-top">
            <div>
              <p class="item-meta">${it.meta}</p>
              <h3 class="item-name">${it.name}</h3>
              <p class="item-spec">Size ${it.size} · ${it.color}</p>
            </div>
            <button class="remove" data-act="remove" aria-label="Remove">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          <div class="item-bottom">
            <div class="qty">
              <button data-act="dec" aria-label="Decrease"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg></button>
              <span class="val pop" key="${it.qty}">${it.qty}</span>
              <button data-act="inc" aria-label="Increase"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg></button>
            </div>
            <p class="item-price">$${(it.price * it.qty).toLocaleString()}</p>
          </div>
        </div>
      </article>
    `).join('');
  }
  updateSummary();
}

function updateSummary() {
  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = promoApplied ? subtotal * 0.1 : 0;
  const shipping = subtotal > 250 || subtotal === 0 ? 0 : 15;
  const total = subtotal - discount + shipping;

  $('#countLbl').textContent = count;
  $('#subtotal').textContent = '$' + subtotal.toLocaleString();
  $('#shipping').innerHTML = shipping === 0 ? '<span style="color:var(--primary)">Free</span>' : '$' + shipping;
  $('#discountRow').hidden = !promoApplied;
  $('#discount').textContent = '−$' + discount.toFixed(2);

  const totalEl = $('#total');
  totalEl.textContent = fmt(total);
  totalEl.classList.remove('pop'); void totalEl.offsetWidth; totalEl.classList.add('pop');

  const bag = $('#bagCount');
  bag.textContent = count;
  bag.classList.remove('pop'); void bag.offsetWidth; bag.classList.add('pop');

  $('#checkout').disabled = items.length === 0;
}

itemsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const article = btn.closest('.item');
  const id = article.dataset.id;
  const act = btn.dataset.act;
  const item = items.find((i) => i.id === id);
  if (!item) return;

  if (act === 'inc' || act === 'dec') {
    item.qty = Math.max(1, item.qty + (act === 'inc' ? 1 : -1));
    const val = article.querySelector('.val');
    val.textContent = item.qty;
    val.classList.remove('pop'); void val.offsetWidth; val.classList.add('pop');
    article.querySelector('.item-price').textContent = '$' + (item.price * item.qty).toLocaleString();
    updateSummary();
  } else if (act === 'remove') {
    article.classList.add('removing');
    setTimeout(() => {
      items = items.filter((i) => i.id !== id);
      render();
    }, 380);
  }
});

$('#applyBtn').addEventListener('click', () => {
  const v = $('#promo').value.trim();
  if (!v || promoApplied) return;
  promoApplied = true;
  $('#applyBtn').textContent = 'Applied';
  $('#applyBtn').disabled = true;
  $('#promoMsg').hidden = false;
  updateSummary();
});

$('#checkout').addEventListener('click', () => {
  alert('Redirecting to secure checkout…');
});

render();
