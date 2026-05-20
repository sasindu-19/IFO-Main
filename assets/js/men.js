/* ========== Supabase Setup ========== */
const SUPABASE_URL = 'https://umdbrzfsjtenaoiugzpr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtZGJyemZzanRlbmFvaXVnenByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4Njg3MDEsImV4cCI6MjA5NDQ0NDcwMX0.uIWMzucUZNC-97R8fnFM6K-3KQKegLeA1AcSYYd2eK4';

const DEFAULT_TITLE = document.title;
const DEFAULT_DESC = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";

let PRODUCTS = [];
let CATEGORIES = [];
let DB_COLORS = {};

/* ========== Load from Supabase ========== */
async function loadMenData() {
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // Show skeleton loading
  catalogRoot.innerHTML = skeletonHTML(8);

  const { data: opts } = await client.from('custom_options').select('key, value').eq('key', 'colors');
  if (opts && opts[0]) {
    opts[0].value.forEach(c => { DB_COLORS[c.name] = c.value; });
  }

  const { data, error } = await client
    .from('products')
    .select('*')
    .eq('category', "Men's Fashion")
    .eq('active', true)
    .order('trending', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    catalogRoot.innerHTML = `<div class="catalog-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      <p>Failed to load products. Please try again.</p>
    </div>`;
    return;
  }

  PRODUCTS = (data || []).map(p => ({
    id: p.id, name: p.name, category: p.sub_category || p.category,
    price: p.price, oldPrice: p.old_price || 0, image: p.image_url || "",
    images: p.image_urls || (p.image_url ? [p.image_url] : []),
    description: p.description || "",
    trending: p.trending,
    colors: (p.colors || []).map(name => ({ name, hex: DB_COLORS[name] || "#ccc" })),
    sizes: p.sizes || []
  }));

  const catSet = new Set();
  PRODUCTS.forEach(p => catSet.add(p.category));
  CATEGORIES = [...catSet];

  renderCatalog();
  const initial = location.hash.match(/product=(.+)/);
  if (initial) openProduct(decodeURIComponent(initial[1]));
}

function skeletonHTML(count) {
  const card = `<div class="skeleton-card"><div class="skeleton-img"></div><div class="skeleton-body"><div class="skeleton-line"></div><div class="skeleton-line short"></div></div></div>`;
  return `<div class="catalog-loading">${card.repeat(count)}</div>`;
}

const getProduct = (id) => PRODUCTS.find((p) => p.id === id);
const getByCategory = (cat) => PRODUCTS.filter((p) => p.category === cat);

/* ========== Render Catalog ========== */
const catalogRoot = document.getElementById("catalog-root");

function renderCatalog() {
  if (PRODUCTS.length === 0) {
    catalogRoot.innerHTML = `<div class="catalog"><div class="catalog-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
      <p>No products yet. Check back soon!</p>
    </div></div>`;
    return;
  }

  const trendingItems = PRODUCTS.filter(p => p.trending);
  const discountItems = PRODUCTS.filter(p => p.oldPrice > 0);
  const otherItems = PRODUCTS.filter(p => !p.trending && p.oldPrice <= 0);

  let html = '<div class="catalog">';

  // 1. New Arrivals Section (Horizontal)
  if (trendingItems.length > 0) {
    html += `
      <section class="cat-row trending-section">
        <div class="cat-head">
          <h2 class="cat-title"><span class="cat-title-slash">/</span> New Arrivals</h2>
          <span class="cat-count">${trendingItems.length} item${trendingItems.length !== 1 ? "s" : ""}</span>
        </div>
        <div class="scroll-wrapper">
          <button class="scroll-btn left" onclick="window.scrollSection(this, -300)">❮</button>
          <div class="cat-scroll-horizontal">
            ${trendingItems.map(productCardHTML).join("")}
          </div>
          <button class="scroll-btn right" onclick="window.scrollSection(this, 300)">❯</button>
        </div>
      </section>`;
  }

  // 2. Discounts Section (Horizontal)
  if (discountItems.length > 0) {
    html += `
      <section class="cat-row discount-section">
        <div class="cat-head">
          <h2 class="cat-title"><span class="cat-title-slash" style="color:#e53e3e;">%</span> Special Offers</h2>
          <span class="cat-count">${discountItems.length} item${discountItems.length !== 1 ? "s" : ""}</span>
        </div>
        <div class="scroll-wrapper">
          <button class="scroll-btn left" onclick="window.scrollSection(this, -300)">❮</button>
          <div class="cat-scroll-horizontal">
            ${discountItems.map(productCardHTML).join("")}
          </div>
          <button class="scroll-btn right" onclick="window.scrollSection(this, 300)">❯</button>
        </div>
      </section>`;
  }

  // 3. Regular Categories (Grid)
  const categories = [...new Set(otherItems.map(p => p.category))];
  
  html += categories.map(cat => {
    const items = otherItems.filter(p => p.category === cat);
    if (items.length === 0) return "";
    return `
      <section class="cat-row">
        <div class="cat-head">
          <h2 class="cat-title"><span class="cat-title-slash">/</span> ${cat}</h2>
          <span class="cat-count">${items.length} item${items.length !== 1 ? "s" : ""}</span>
        </div>
        <div class="cat-scroll">
          ${items.map(productCardHTML).join("")}
        </div>
      </section>`;
  }).join("");

  html += '</div>';
  catalogRoot.innerHTML = html;

  catalogRoot.querySelectorAll(".card").forEach((el) => {
    el.addEventListener("click", () => openProduct(el.dataset.id));
  });
}

function productCardHTML(p) {
  const colorDots = p.colors.slice(0, 5).map(c =>
    `<span class="card-color-dot" style="background:${c.hex}" title="${c.name}"></span>`).join("");
  const priceHTML = p.oldPrice > 0
    ? `<span class="card-price"><span style="text-decoration:line-through;color:#999;font-size:0.8em;margin-right:6px;">LKR ${p.oldPrice.toLocaleString()}</span>LKR ${p.price.toLocaleString()}</span>`
    : `<span class="card-price">LKR ${p.price.toLocaleString()}</span>`;
  
  const badgeHTML = p.oldPrice > 0 
    ? `<span class="card-badge" style="background:#e53e3e;">Discount</span>`
    : (p.trending ? `<span class="card-badge">New Arrival</span>` : "");

  const imgHTML = p.image
    ? `<img src="${p.image}" alt="${p.name}" loading="lazy" />`
    : `<div class="no-img-placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
        <span>No image</span>
      </div>`;
  return `
    <div class="card" data-id="${p.id}">
      <div class="card-img">
        ${imgHTML}
        ${badgeHTML}
        <div class="card-overlay"><span class="card-overlay-label">View Details</span></div>
      </div>
      <div class="card-body">
        <h3 class="card-name">${p.name}</h3>
        <div class="card-row">
          ${priceHTML}
          <div class="card-colors">${colorDots}</div>
        </div>
        ${p.sizes.length ? `<div class="card-sizes">${p.sizes.join(" · ")}</div>` : ""}
      </div>
    </div>`;
}

/* ========== Product Detail View ========== */
const catalogView = document.getElementById("catalog-view");
const productView = document.getElementById("product-view");
let currentProduct = null;
let selectedSize = null;
let selectedColor = null;

function openProduct(id) {
  const p = getProduct(id);
  if (!p) return;
  currentProduct = p;
  selectedSize = p.sizes[0] || null;
  selectedColor = p.colors[0] || null;

  const mainImg = document.getElementById("pd-image");
  mainImg.src = p.image || p.images[0] || "";
  mainImg.alt = p.name;
  
  // Render gallery thumbs
  const gallery = document.getElementById("pd-gallery");
  gallery.innerHTML = (p.images || []).map(img => `
    <div class="pd-gallery-thumb ${img === mainImg.src ? "is-active" : ""}" data-src="${img}">
      <img src="${img}" alt="" />
    </div>
  `).join("");

  gallery.querySelectorAll(".pd-gallery-thumb").forEach(thumb => {
    thumb.addEventListener("click", () => {
      mainImg.src = thumb.dataset.src;
      gallery.querySelectorAll(".pd-gallery-thumb").forEach(t => t.classList.remove("is-active"));
      thumb.classList.add("is-active");
    });
  });

  document.getElementById("pd-category").textContent = p.category;
  document.getElementById("pd-title").textContent = p.name;
  document.getElementById("pd-price").innerHTML = p.oldPrice > 0 ? `LKR ${p.price.toLocaleString()}.00 <span style="text-decoration:line-through;color:#999;font-size:0.6em;margin-left:8px;">LKR ${p.oldPrice.toLocaleString()}.00</span>` : `LKR ${p.price.toLocaleString()}.00`;
  document.getElementById("pd-desc").textContent = p.description;

  renderDetailColors();
  renderDetailSizes();

  // Quantity controls
  const qtyInput = document.getElementById("pd-qty-input");
  qtyInput.value = 1;
  document.getElementById("pd-qty-minus").onclick = () => {
    if (qtyInput.value > 1) qtyInput.value = parseInt(qtyInput.value) - 1;
  };
  document.getElementById("pd-qty-plus").onclick = () => {
    if (qtyInput.value < 99) qtyInput.value = parseInt(qtyInput.value) + 1;
  };

  // Update page metadata dynamically for product SEO
  document.title = `${p.name} — Men's Fashion | IFO Galle`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute("content", `${p.name} - ${p.description || "Premium men's clothing item from Ikram Fashion Outlet Galle."} Price: LKR ${p.price.toLocaleString()}.`);
  }

  catalogView.hidden = true;
  productView.hidden = false;
  window.scrollTo(0, 0);
  history.pushState({ id }, "", `#product=${encodeURIComponent(id)}`);
}

function renderDetailColors() {
  if (!currentProduct.colors.length) {
    document.getElementById("pd-colors").innerHTML = "<span style='color:#aaa'>—</span>";
    return;
  }
  document.getElementById("pd-color-name").textContent = selectedColor ? selectedColor.name : "";
  const wrap = document.getElementById("pd-colors");
  wrap.innerHTML = currentProduct.colors.map(c => `
    <button class="pd-color-btn ${selectedColor && c.name === selectedColor.name ? "is-active" : ""}"
            data-color="${c.name}" style="background:${c.hex}" aria-label="${c.name}"></button>
  `).join("");
  wrap.querySelectorAll(".pd-color-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedColor = currentProduct.colors.find(c => c.name === btn.dataset.color);
      renderDetailColors();
    });
  });
}

function renderDetailSizes() {
  const wrap = document.getElementById("pd-sizes");
  if (!currentProduct.sizes.length) { wrap.innerHTML = "<span style='color:#aaa'>—</span>"; return; }
  wrap.innerHTML = currentProduct.sizes.map(s => `
    <button class="pd-size-btn ${s === selectedSize ? "is-active" : ""}" data-size="${s}">${s}</button>
  `).join("");
  wrap.querySelectorAll(".pd-size-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedSize = btn.dataset.size;
      renderDetailSizes();
    });
  });
}

document.getElementById("pd-back").addEventListener("click", (e) => {
  e.preventDefault();
  closeProduct();
});

document.getElementById("pd-cart-btn").onclick = (e) => {
  const btn = e.currentTarget;
  const qty = parseInt(document.getElementById("pd-qty-input").value);
  
  if (!currentProduct) return;
  
  // Add to Cart
  const selectedImage = document.getElementById("pd-image").src;
  window.Cart.addToCart(currentProduct, qty, selectedSize, selectedColor, selectedImage);

  btn.classList.add("is-added");
  btn.textContent = `✓ Added ${qty} item${qty > 1 ? "s" : ""}`;
  
  setTimeout(() => {
    btn.classList.remove("is-added");
    btn.textContent = "Add to Cart";
  }, 2000);
};

function closeProduct() {
  // Restore default page metadata
  document.title = DEFAULT_TITLE;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute("content", DEFAULT_DESC);
  }

  productView.hidden = true;
  catalogView.hidden = false;
  history.pushState({}, "", location.pathname);
}

window.addEventListener("popstate", () => {
  const m = location.hash.match(/product=(.+)/);
  if (m) openProduct(decodeURIComponent(m[1])); else closeProduct();
});

/* ========== Init ========== */
loadMenData();
