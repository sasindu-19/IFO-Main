// ===== IFO Menswear — site script =====

const BRANDS = [
  { name: "Polo Ralph Lauren", tag: "Heritage Americana" },
  { name: "Tommy Hilfiger", tag: "Classic Cool" },
  { name: "Banana Republic", tag: "Modern Refined" },
  { name: "Eddie Bauer", tag: "Outdoor Essentials" },
  { name: "Balmain Paris", tag: "Parisian Luxury" },
  { name: "GAP", tag: "Everyday Icons" },
  { name: "Diesel", tag: "Bold Denim" },
  { name: "Levi's", tag: "Original Denim" },
  { name: "Calvin Klein", tag: "Minimalist" },
  { name: "Armani Exchange", tag: "Italian Edge" },
  { name: "Hugo Boss", tag: "Tailored Excellence" },
];

const MEN_CATEGORIES = [
  "Shirts", "T-Shirts", "With/Without Collar T-shirt", "With/Without Collar Shirts",
  "Short sleeve Shirts", "Short sleeve T-Shirts", "Long sleeve Shirts", "Long sleeve T-Shirts",
  "Denims", "Linen Pants", "Cotton Pants", "Trousers",
];

const BOYS_CATEGORIES = [
  "T-Shirts", "Shirts", "Denim", "Linen Pants",
  "Cotton Pants", "", "", ""
];
const SIZES = ["4Y", "5Y", "6Y", "7Y", "8Y", "10Y", "12Y", "14Y", "16Y"];

// ---- Renderers (only run if target exists on the page) ----

const marqueeEl = document.querySelector("[data-marquee]");
if (marqueeEl) {
  const items = [...BRANDS, ...BRANDS]
    .map(b => `<div class="marquee-item"><span class="name">${b.name.toUpperCase()}</span><span class="dot"></span></div>`)
    .join("");
  marqueeEl.innerHTML = items;
}

const brandGridEl = document.querySelector("[data-brand-grid]");
if (brandGridEl) {
  brandGridEl.innerHTML = BRANDS.map(b => `
    <div class="brand-cell">
      <span class="name">${b.name.toUpperCase()}</span>
      <span class="tag">${b.tag}</span>
    </div>`).join("");
}

const brandCardsEl = document.querySelector("[data-brand-cards]");
if (brandCardsEl) {
  brandCardsEl.innerHTML = BRANDS.map(b => `
    <div class="brand-card">
      <div class="name">${b.name.toUpperCase()}</div>
      <div class="tag">${b.tag}</div>
    </div>`).join("");
}

const maisonGridEl = document.querySelector("[data-maison-grid]");
if (maisonGridEl) {
  maisonGridEl.innerHTML = BRANDS.map((b, i) => `
    <div class="maison">
      <span class="num">N° ${String(i + 1).padStart(2, "0")}</span>
      <div>
        <h2>${b.name.toUpperCase()}</h2>
        <p class="tag">${b.tag}</p>
      </div>
      <div class="links">
        <a href="men.html">Men →</a>
        <a href="boys.html">Boys →</a>
      </div>
    </div>`).join("");
}

const menTilesEl = document.querySelector("[data-men-tiles]");
if (menTilesEl) {
  menTilesEl.innerHTML = MEN_CATEGORIES.map(c => `<button class="tile">${c}</button>`).join("");
}

const boysTilesEl = document.querySelector("[data-boys-tiles]");
if (boysTilesEl) {
  boysTilesEl.innerHTML = BOYS_CATEGORIES.map(c => `<button class="tile">${c}</button>`).join("");
}

const sizesEl = document.querySelector("[data-sizes]");
if (sizesEl) {
  sizesEl.innerHTML = SIZES.map(s => `<button class="size-chip">${s}</button>`).join("");
}

// ---- Mobile drawer ----
const menuBtn = document.querySelector("[data-menu]");
const drawer = document.querySelector("[data-drawer]");
const closeBtn = document.querySelector("[data-close]");
if (menuBtn && drawer) {
  menuBtn.addEventListener("click", () => drawer.classList.add("open"));
  closeBtn?.addEventListener("click", () => drawer.classList.remove("open"));
  drawer.querySelectorAll("a").forEach(a => a.addEventListener("click", () => drawer.classList.remove("open")));
}

// ---- Newsletter ----
document.querySelectorAll("form.newsletter").forEach(f => {
  f.addEventListener("submit", e => {
    e.preventDefault();
    alert("Thanks for joining IFO. Check your inbox.");
    f.reset();
  });
});

// ---- Footer year ----
document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());



const viewBtn = document.getElementById("viewBtn");
if (viewBtn) {
  viewBtn.addEventListener("click", function (e) {
    e.preventDefault();
    alert("View All button clicked!");
  });
}







window.scrollSection = function(btn, amount) {
  const container = btn.parentElement.querySelector('.cat-scroll-horizontal');
  if (container) container.scrollBy({ left: amount, behavior: 'smooth' });
};


window.showToast = function(msg, isError = false) {
  let toast = document.getElementById("global-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "global-toast";
    document.body.appendChild(toast);
  }
  toast.className = `toast ${isError ? 'error' : ''}`;
  toast.textContent = msg;
  
  void toast.offsetWidth; // Reflow
  toast.classList.add("show");
  
  if (window.toastTimeout) clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
};

const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot-btn');
const capText = document.querySelector('.cap-text');
let i = 0, timer;

function show(n){
  i = (n + slides.length) % slides.length;
  slides.forEach((s,idx)=>s.classList.toggle('active', idx===i));
  dots.forEach((d,idx)=>d.classList.toggle('active', idx===i));
  capText.textContent = slides[i].alt;
}
function next(){ show(i+1); }
function prev(){ show(i-1); }
function reset(){ clearInterval(timer); timer = setInterval(next, 4000); }

document.querySelector('.next').addEventListener('click', ()=>{next();reset();});
document.querySelector('.prev').addEventListener('click', ()=>{prev();reset();});
dots.forEach(d=>d.addEventListener('click', e=>{show(+e.target.dataset.i);reset();}));

reset();
