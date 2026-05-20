/* ========== Customize Defaults ========== */
const DEFAULT_MEN = [
  "Shirts", "T-Shirts", "With/Without Collar T-shirt", "With/Without Collar Shirts",
  "Short sleeve Shirts", "Short sleeve T-Shirts", "Long sleeve Shirts", "Long sleeve T-Shirts",
  "Denims", "Linen Pants", "Cotton Pants", "Trousers"
];
const DEFAULT_BOYS = ["T-Shirts", "Shirts", "Denim", "Linen Pants", "Cotton Pants"];
const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL"];
const DEFAULT_COLORS = [
  { name: "Red", value: "#ef4444" },
  { name: "Black", value: "#000000" },
  { name: "Blue", value: "#2563eb" },
  { name: "Green", value: "#16a34a" },
  { name: "White", value: "#ffffff" }
];


const load = (k, d) => {
  try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; }
  catch { return d; }
};

let MEN_CATEGORIES = [...DEFAULT_MEN];
let BOYS_CATEGORIES = [...DEFAULT_BOYS];
let SIZES = [...DEFAULT_SIZES];
let COLORS = DEFAULT_COLORS.map(c => ({...c}));
let WA_NUMBER = "+94700000000";
let DELIVERY_FEE = 350;
let BANK_DETAILS = {
  bankName: "BANK OF CEYLON",
  accountNumber: "0094609936",
  accountName: "Ikram Fashion Outlet",
  branchName: "Galle",
  remarks: "IFO Galle"
};


/* ========== Error/Toast UI ========== */
const showCustomizeError = (msg) => {
  const errDiv = $("customizeError");
  if (!errDiv) return;
  if (msg) { errDiv.innerText = msg; errDiv.style.display = 'block'; }
  else { errDiv.style.display = 'none'; }
};

let toastTimer = null;
const showToast = (msg, type = "success") => {
  let toast = document.getElementById("adminToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "adminToast";
    toast.style.cssText = `
      position:fixed;bottom:28px;right:28px;z-index:9999;
      padding:14px 22px;border-radius:10px;font-size:14px;font-weight:500;
      color:#fff;box-shadow:0 4px 24px rgba(0,0,0,.18);
      opacity:0;transform:translateY(12px);
      transition:opacity .25s,transform .25s;pointer-events:none;
      max-width:320px;line-height:1.4;
    `;
    document.body.appendChild(toast);
  }
  toast.style.background = type === "error" ? "#e53e3e" : "#22c55e";
  toast.textContent = msg;
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(12px)";
  }, 3200);
};

/* ========== Supabase Options ========== */
const persistOptions = async () => {
  const updates = [
    { key: "men_categories", value: MEN_CATEGORIES },
    { key: "boys_categories", value: BOYS_CATEGORIES },
    { key: "sizes", value: SIZES },
    { key: "colors", value: COLORS },
    { key: "wa_number", value: WA_NUMBER }
  ];
  if (window.supabaseClient) {
    const { error } = await window.supabaseClient.from('custom_options').upsert(updates, { onConflict: 'key' });
    if (error) {
      console.error("Error saving options:", error);
      showCustomizeError("Error saving to database: " + error.message);
    } else { showCustomizeError(""); }
  }
};

const loadOptionsFromDB = async () => {
  if (!window.supabaseClient) return;
  const { data, error } = await window.supabaseClient.from('custom_options').select('key, value');
  if (error) { console.error("Error loading options:", error); return; }
  if (data && data.length > 0) {
    const opts = data.reduce((acc, row) => { acc[row.key] = row.value; return acc; }, {});
    if (opts.men_categories) MEN_CATEGORIES = opts.men_categories;
    if (opts.boys_categories) BOYS_CATEGORIES = opts.boys_categories;
    if (opts.sizes) SIZES = opts.sizes;
    if (opts.colors) COLORS = opts.colors;
    if (opts.wa_number) WA_NUMBER = opts.wa_number;
    if ($("waNumber")) $("waNumber").value = WA_NUMBER;
    if (opts.delivery_fee !== undefined) DELIVERY_FEE = Number(opts.delivery_fee);
    if ($("deliveryFee")) $("deliveryFee").value = DELIVERY_FEE;
    
    if (opts.bank_details) {
      BANK_DETAILS = { ...BANK_DETAILS, ...opts.bank_details };
    }
    
    if ($("bankName")) $("bankName").value = BANK_DETAILS.bankName || "";
    if ($("bankAccount")) $("bankAccount").value = BANK_DETAILS.accountNumber || "";
    if ($("bankAccountName")) $("bankAccountName").value = BANK_DETAILS.accountName || "";
    if ($("bankBranch")) $("bankBranch").value = BANK_DETAILS.branchName || "";
    if ($("bankRemarks")) $("bankRemarks").value = BANK_DETAILS.remarks || "";

    renderSubCategory(); renderSizes(); renderColors();
  }
};

/* ========== Products (Supabase) ========== */
let products = [];
let selectedSizes = [];
let selectedColors = [];
let newImageFiles = []; // Array of { id, file, previewUrl }
let existingImageUrls = []; // Array of strings (for editing)
let editingId = null;

const $ = (id) => document.getElementById(id);
const modal = $("modal");
const viewModal = $("viewModal");
const customizeModal = $("customizeModal");

/* ========== Image Compression ========== */
function compressImage(file, maxWidth = 900, quality = 0.82) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ========== Upload Image to Supabase Storage ========== */
async function uploadImage(file) {
  const compressed = await compressImage(file);
  const ext = "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await window.supabaseClient.storage
    .from("product-images")
    .upload(filename, compressed, { contentType: "image/jpeg", upsert: false });
  if (error) throw error;
  const { data: urlData } = window.supabaseClient.storage.from("product-images").getPublicUrl(filename);
  return urlData.publicUrl;
}

/* ========== Load Products from DB ========== */
const loadProducts = async () => {
  if (!window.supabaseClient) return;
  const { data, error } = await window.supabaseClient
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { showToast("Failed to load products", "error"); return; }
  products = (data || []).map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    subCategory: p.sub_category,
    price: p.price,
    oldPrice: p.old_price || 0,
    trending: p.trending,
    active: p.active,
    sizes: p.sizes,
    colors: p.colors,
    description: p.description,
    image: p.image_url,
    images: p.image_urls || (p.image_url ? [p.image_url] : [])
  }));
  renderProducts();
};

/* ========== Save Product to DB ========== */
async function saveProductToDB(data, newFiles, existingUrls) {
  let finalUrls = [...existingUrls];

  if (newFiles.length > 0) {
    try {
      setSaveLoading(true);
      const uploadPromises = newFiles.map(item => uploadImage(item.file));
      const uploadedUrls = await Promise.all(uploadPromises);
      finalUrls = [...finalUrls, ...uploadedUrls];
    } catch (err) {
      showToast("Image upload failed: " + err.message, "error");
      setSaveLoading(false);
      return false;
    }
  }

  if (finalUrls.length === 0) {
    showToast("Please select at least one image", "error");
    setSaveLoading(false);
    return false;
  }

  const row = {
    name: data.name,
    category: data.category,
    sub_category: data.subCategory,
    price: data.price,
    old_price: data.oldPrice,
    trending: data.trending,
    active: data.active,
    sizes: data.sizes,
    colors: data.colors,
    description: data.description,
    image_url: finalUrls[0], // Main image
    image_urls: finalUrls    // All images
  };

  if (editingId) {
    const { error } = await window.supabaseClient.from('products').update(row).eq('id', editingId);
    if (error) { showToast("Update failed: " + error.message, "error"); setSaveLoading(false); return false; }
    showToast("Product updated!");
  } else {
    const { error } = await window.supabaseClient.from('products').insert([row]);
    if (error) { showToast("Save failed: " + error.message, "error"); setSaveLoading(false); return false; }
    showToast("Product added!");
  }

  setSaveLoading(false);
  return true;
}

async function deleteProductFromDB(id, imageUrl) {
  // Delete image from storage if exists
  if (imageUrl) {
    const path = imageUrl.split("/product-images/")[1];
    if (path) await window.supabaseClient.storage.from("product-images").remove([path]);
  }
  const { error } = await window.supabaseClient.from('products').delete().eq('id', id);
  if (error) { showToast("Delete failed: " + error.message, "error"); return false; }
  showToast("Product deleted");
  return true;
}

function setSaveLoading(loading) {
  const btn = $("saveBtn");
  if (loading) { btn.textContent = "Saving…"; btn.disabled = true; }
  else { btn.textContent = editingId ? "Update Product" : "Save Product"; btn.disabled = false; }
}

/* ========== Modal Controls ========== */
$("openModal").addEventListener("click", () => {
  editingId = null;
  $("modalTitle").textContent = "Add Product";
  $("saveBtn").textContent = "Save Product";
  resetForm();
  modal.classList.add("open");
});
$("closeModal").addEventListener("click", () => modal.classList.remove("open"));
modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("open"); });

$("closeView").addEventListener("click", () => viewModal.classList.remove("open"));
viewModal.addEventListener("click", (e) => { if (e.target === viewModal) viewModal.classList.remove("open"); });

$("openCustomize").addEventListener("click", () => { renderCustomize(); customizeModal.classList.add("open"); });
$("closeCustomize").addEventListener("click", () => customizeModal.classList.remove("open"));
customizeModal.addEventListener("click", (e) => { if (e.target === customizeModal) customizeModal.classList.remove("open"); });

document.querySelectorAll(".tab").forEach(t => {
  t.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    document.querySelector(`.tab-panel[data-panel="${t.dataset.tab}"]`).classList.add("active");
  });
});

$("category").addEventListener("change", () => renderSubCategory());

function renderSubCategory(selected) {
  const cat = $("category").value;
  const list = cat === "Men's Fashion" ? MEN_CATEGORIES : BOYS_CATEGORIES;
  $("subCategoryLabel").textContent = cat === "Men's Fashion" ? "Men Category" : "Boys Category";
  $("subCategory").innerHTML = list.map(c =>
    `<option${selected === c ? " selected" : ""}>${escape(c)}</option>`).join("");
}

function renderSizes() {
  $("sizeGroup").innerHTML = SIZES.map(s =>
    `<button type="button" class="chip${selectedSizes.includes(s) ? " active" : ""}" data-size="${escape(s)}">${escape(s)}</button>`
  ).join("");
  $("sizeGroup").querySelectorAll(".chip").forEach(b => {
    b.addEventListener("click", () => {
      const s = b.dataset.size;
      selectedSizes = selectedSizes.includes(s) ? selectedSizes.filter(x => x !== s) : [...selectedSizes, s];
      renderSizes();
    });
  });
}

function renderColors() {
  $("colorGroup").innerHTML = COLORS.map(c =>
    `<div class="color-dot${selectedColors.includes(c.name) ? " active" : ""}"
      data-color="${escape(c.name)}" style="background:${c.value}" title="${escape(c.name)}"></div>`
  ).join("");
  $("colorGroup").querySelectorAll(".color-dot").forEach(d => {
    d.addEventListener("click", () => {
      const n = d.dataset.color;
      selectedColors = selectedColors.includes(n) ? selectedColors.filter(x => x !== n) : [...selectedColors, n];
      renderColors();
    });
  });
}

/* ========== Customize Panel ========== */
function renderCustomize() {
  renderSimpleList("menList", MEN_CATEGORIES, (i) => { MEN_CATEGORIES.splice(i, 1); afterCustomChange(); });
  renderSimpleList("boysList", BOYS_CATEGORIES, (i) => { BOYS_CATEGORIES.splice(i, 1); afterCustomChange(); });
  renderSimpleList("sizesList", SIZES, (i) => { SIZES.splice(i, 1); afterCustomChange(); });
  renderColorList();
  
}


function renderSimpleList(id, arr, onRemove) {
  const el = $(id);
  if (!arr.length) { el.innerHTML = `<p class="muted">Empty</p>`; return; }
  el.innerHTML = arr.map((item, i) => `
    <div class="custom-item">
      <div class="left"><span class="label">${escape(item)}</span></div>
      <button type="button" class="remove" data-i="${i}">Remove</button>
    </div>
  `).join("");
  el.querySelectorAll(".remove").forEach(b => b.addEventListener("click", () => onRemove(+b.dataset.i)));
}

function renderColorList() {
  const el = $("colorsList");
  if (!COLORS.length) { el.innerHTML = `<p class="muted">Empty</p>`; return; }
  el.innerHTML = COLORS.map((c, i) => `
    <div class="custom-item">
      <div class="left">
        <span class="swatch" style="background:${c.value}"></span>
        <span class="label">${escape(c.name)} <span class="muted">${escape(c.value)}</span></span>
      </div>
      <button type="button" class="remove" data-i="${i}">Remove</button>
    </div>
  `).join("");
  el.querySelectorAll(".remove").forEach(b => b.addEventListener("click", () => {
    COLORS.splice(+b.dataset.i, 1); afterCustomChange();
  }));
}

function afterCustomChange() {
  persistOptions();
  renderCustomize();
  renderSubCategory();
  renderSizes();
  renderColors();
    renderProducts();
}

function addItem(arr, value) {
  const v = value.trim();
  if (!v) return false;
  if (arr.includes(v)) { showCustomizeError("Already exists"); return false; }
  showCustomizeError("");
  arr.push(v);
  return true;
}

$("addMen").addEventListener("click", () => {
  if (addItem(MEN_CATEGORIES, $("newMen").value)) { $("newMen").value = ""; afterCustomChange(); }
});
$("addBoys").addEventListener("click", () => {
  if (addItem(BOYS_CATEGORIES, $("newBoys").value)) { $("newBoys").value = ""; afterCustomChange(); }
});
$("addSize").addEventListener("click", () => {
  if (addItem(SIZES, $("newSize").value)) { $("newSize").value = ""; afterCustomChange(); }
});
$("addColor").addEventListener("click", () => {
  const name = $("newColorName").value.trim();
  const value = $("newColorValue").value;
  if (!name) return;
  if (COLORS.some(c => c.name === name)) { showCustomizeError("Color name already exists"); return; }
  showCustomizeError("");
  COLORS.push({ name, value });
  $("newColorName").value = "";
  afterCustomChange();
});

$("resetDefaults").addEventListener("click", () => {
  if (!confirm("Reset all categories, sizes & colors to defaults?")) return;
  MEN_CATEGORIES = [...DEFAULT_MEN];
  BOYS_CATEGORIES = [...DEFAULT_BOYS];
  SIZES = [...DEFAULT_SIZES];
  COLORS = DEFAULT_COLORS.map(c => ({ ...c }));
  afterCustomChange();
});

/* ========== Image Input ========== */
$("image").addEventListener("change", (e) => {
  const files = Array.from(e.target.files);
  if (!files.length) return;

  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = () => {
      const id = Date.now() + Math.random();
      newImageFiles.push({ id, file, previewUrl: reader.result });
      renderImagePreviews();
    };
    reader.readAsDataURL(file);
  });
  e.target.value = ""; // Reset input so same file can be picked again if needed
});

function renderImagePreviews() {
  const container = $("imagePreview");
  container.innerHTML = "";

  // Show existing URLs if editing
  existingImageUrls.forEach((url, index) => {
    const item = document.createElement("div");
    item.className = "image-preview-item";
    item.style.backgroundImage = `url(${url})`;
    item.innerHTML = `<button type="button" class="remove-img" onclick="removeExistingImage(${index})">×</button>`;
    container.appendChild(item);
  });

  // Show new files
  newImageFiles.forEach(item => {
    const div = document.createElement("div");
    div.className = "image-preview-item";
    div.style.backgroundImage = `url(${item.previewUrl})`;
    div.innerHTML = `<button type="button" class="remove-img" onclick="removeNewImage(${item.id})">×</button>`;
    container.appendChild(div);
  });
}

window.removeNewImage = (id) => {
  newImageFiles = newImageFiles.filter(item => item.id !== id);
  renderImagePreviews();
};

window.removeExistingImage = (index) => {
  existingImageUrls.splice(index, 1);
  renderImagePreviews();
};

/* ========== Form Submit ========== */
$("productForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {
    name: $("name").value.trim(),
    category: $("category").value,
    subCategory: $("subCategory").value,
    price: $("hasDiscount").checked ? (Number($("newPrice").value) || 0) : (Number($("price").value) || 0),
    oldPrice: $("hasDiscount").checked ? (Number($("oldPrice").value) || 0) : 0,
    trending: $("trending").checked,
    active: $("active").checked,
    sizes: [...selectedSizes],
    colors: [...selectedColors],
    description: $("description").value.trim(),
  };
  if (!data.name) return;

  const ok = await saveProductToDB(data, newImageFiles, existingImageUrls);
  if (ok) {
    modal.classList.remove("open");
    await loadProducts();
  }
});

function resetForm() {
  $("productForm").reset();
  $("active").checked = true;
  selectedSizes = [];
  selectedColors = [];
  newImageFiles = [];
  existingImageUrls = [];
  renderImagePreviews();
  renderSubCategory();
  renderSizes();
  renderColors();
  if ($("hasDiscount")) {
    $("hasDiscount").checked = false;
    $("hasDiscount").dispatchEvent(new Event("change"));
  }
}

function loadForEdit(p) {
  editingId = p.id;
  $("modalTitle").textContent = "Edit Product";
  $("saveBtn").textContent = "Update Product";
  $("name").value = p.name;
  $("category").value = p.category;
  renderSubCategory(p.subCategory);
  $("price").value = p.price;
  
  if (p.oldPrice > 0) {
    $("hasDiscount").checked = true;
    $("oldPrice").value = p.oldPrice;
    $("newPrice").value = p.price;
  } else {
    $("hasDiscount").checked = false;
    $("oldPrice").value = "";
    $("newPrice").value = "";
  }
  if ($("hasDiscount")) $("hasDiscount").dispatchEvent(new Event("change"));

  $("trending").checked = p.trending;
  $("active").checked = p.active;
  $("description").value = p.description || "";
  selectedSizes = [...(p.sizes || [])];
  selectedColors = [...(p.colors || [])];
  newImageFiles = [];
  existingImageUrls = [...(p.images || [])];
  renderImagePreviews();
  renderSizes();
  renderColors();
  modal.classList.add("open");
}

function viewProduct(p) {
  const colorDots = (p.colors || []).map(name => {
    const c = COLORS.find(x => x.name === name);
    const bg = c ? c.value : "#ccc";
    return `<span class="color-dot" style="background:${bg}" title="${escape(name)}"></span>`;
  }).join("");

  const images = p.images || (p.image ? [p.image] : []);
  const imagesHTML = images.map(img => `<img src="${img}" alt="" style="width:100px;height:100px;object-fit:cover;border-radius:8px;border:1px solid #eee;">`).join("");

$("viewBody").innerHTML = `
    <div class="view-image-list" style="display:flex;gap:10px;overflow-x:auto;padding-bottom:10px;">${imagesHTML || "<span class='muted'>No images</span>"}</div>
    <h2>${escape(p.name)}</h2>    
    <p class="muted">${escape(p.category)} • ${escape(p.subCategory)}</p>
    <p class="price-big">LKR ${p.price}</p>
    <div class="view-row"><strong>Status:</strong> ${p.active ? "Active" : "Inactive"} ${p.trending ? "• Trending" : ""}</div>
    <div class="view-row"><strong>Sizes:</strong> ${(p.sizes || []).join(", ") || "—"}</div>
    <div class="view-row"><strong>Colors:</strong> <span class="color-group inline">${colorDots || "—"}</span></div>
    <div class="view-row"><strong>Description:</strong><p>${escape(p.description || "—")}</p></div>
  `;
  viewModal.classList.add("open");
}

function viewProduct(p) {
  const colorDots = (p.colors || []).map(name => {
    const c = COLORS.find(x => x.name === name);
    const bg = c ? c.value : "#ccc";
    return `<span class="color-dot" style="background:${bg}" title="${escape(name)}"></span>`;
  }).join("");
  const d = +p.discount || 0;
  const finalPrice = d > 0 ? (p.price - p.price * d / 100) : p.price;
  const priceHtml = d > 0
    ? `<p class="price-big">LKR ${finalPrice.toFixed(2)}<span class="price-original">LKR ${p.price}</span></p>`
    : `<p class="price-big">LKR ${p.price}</p>`;
  $("viewBody").innerHTML = `
    <div class="view-image">
      ${p.image ? `<img src="${p.image}" alt="">` : "<span class='muted'>No image</span>"}
      ${d > 0 ? `<span class="discount-badge">-${d}% OFF</span>` : ""}
    </div>
    <h2>${escape(p.name)}</h2>
    <p class="muted">${escape(p.category)} • ${escape(p.subCategory)}</p>
    ${priceHtml}
    <div class="view-row"><strong>Status:</strong> ${p.active ? "Active" : "Inactive"} ${p.trending ? "• Trending" : ""}</div>
    <div class="view-row"><strong>Sizes:</strong> ${(p.sizes || []).join(", ") || "—"}</div>
    <div class="view-row"><strong>Colors:</strong> <span class="color-group inline">${colorDots || "—"}</span></div>
    <div class="view-row"><strong>Description:</strong><p>${escape(p.description || "—")}</p></div>
  `;
  viewModal.classList.add("open");
}

/* ========== Render Product Table ========== */
function renderProducts() {
  const tbody = $("productRows");
  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty">No products yet</td></tr>`;
  } else {
    tbody.innerHTML = products.map(p => `
      <tr>
        <td>${p.image ? `<img src="${p.image}" alt="">` : ""}</td>
        <td>${escape(p.name)}</td>
        <td>${escape(p.category)}</td>
        <td>${escape(p.subCategory || "")}</td>
        <td>${p.oldPrice > 0 ? `<span style="text-decoration:line-through;color:#999;font-size:0.9em;">LKR ${p.oldPrice}</span><br>LKR ${p.price}` : `LKR ${p.price}`}</td>
        <td>${p.trending ? "Yes" : "No"}</td>
        <td class="actions-cell">
          <button class="btn-sm view" data-id="${p.id}">View</button>
          <button class="btn-sm edit" data-id="${p.id}">Edit</button>
          <button class="btn-sm delete" data-id="${p.id}">Delete</button>
        </td>
      </tr>
    `).join("");

    tbody.querySelectorAll(".view").forEach(b => b.addEventListener("click", () => {
      const p = products.find(x => x.id === b.dataset.id); if (p) viewProduct(p);
    }));
    tbody.querySelectorAll(".edit").forEach(b => b.addEventListener("click", () => {
      const p = products.find(x => x.id === b.dataset.id); if (p) loadForEdit(p);
    }));
    tbody.querySelectorAll(".delete").forEach(b => b.addEventListener("click", async () => {
      if (!confirm("Delete this product?")) return;
      const p = products.find(x => x.id === b.dataset.id);
      const ok = await deleteProductFromDB(p.id, p.image);
      if (ok) await loadProducts();
    }));
  }
  $("totalCount").textContent = products.length;
  $("activeCount").textContent = products.filter(p => p.active).length;
  $("trendingCount").textContent = products.filter(p => p.trending).length;
}

function escape(s) {
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
}

/* ========== Init ========== */
renderSubCategory();
renderSizes();
renderColors();
renderProducts();

loadOptionsFromDB();
loadProducts();



$("hasDiscount")?.addEventListener("change", (e) => {
  if ($("discountFields")) $("discountFields").style.display = e.target.checked ? "grid" : "none";
  if ($("regularPriceField")) $("regularPriceField").style.display = e.target.checked ? "none" : "block";
});


// Prevent number inputs from changing value on scroll
document.addEventListener("wheel", function(event) {
  if (document.activeElement.type === "number") {
    document.activeElement.blur();
  }
});


$("saveWaNumber")?.addEventListener("click", () => {
  const num = $("waNumber").value.trim();
  if (!num) return showCustomizeError("Please enter a WhatsApp number");
  WA_NUMBER = num;
  afterCustomChange();
  showToast("WhatsApp Number Saved!");
  $("customizeModal").classList.remove("open");
});

$("saveDeliveryFee")?.addEventListener("click", async () => {
  const feeStr = $("deliveryFee").value.trim();
  if (feeStr === "") return showCustomizeError("Please enter a Delivery Fee");
  DELIVERY_FEE = Number(feeStr);
  
  if (window.supabaseClient) {
    const { error } = await window.supabaseClient.from('custom_options').upsert(
      [{ key: "delivery_fee", value: DELIVERY_FEE }], 
      { onConflict: 'key' }
    );
    if (error) {
      console.error("Error saving delivery fee:", error);
      showCustomizeError("Error saving to database: " + error.message);
    } else {
      showCustomizeError("");
      showToast("Delivery Fee Saved!");
      $("customizeModal").classList.remove("open");
    }
  }
});

$("saveBankDetails")?.addEventListener("click", async () => {
  const bankName = $("bankName").value.trim();
  const accountNumber = $("bankAccount").value.trim();
  const accountName = $("bankAccountName").value.trim();
  const branchName = $("bankBranch").value.trim();
  const remarks = $("bankRemarks").value.trim();

  if (!bankName || !accountNumber || !accountName) {
    return showCustomizeError("Please enter Bank Name, Account Number, and Account Name.");
  }

  BANK_DETAILS = { bankName, accountNumber, accountName, branchName, remarks };
  
  if (window.supabaseClient) {
    const { error } = await window.supabaseClient.from('custom_options').upsert(
      [{ key: "bank_details", value: BANK_DETAILS }], 
      { onConflict: 'key' }
    );
    if (error) {
      console.error("Error saving bank details:", error);
      showCustomizeError("Error saving to database: " + error.message);
    } else {
      showCustomizeError("");
      showToast("Bank Details Saved!");
      $("customizeModal").classList.remove("open");
    }
  }
});
