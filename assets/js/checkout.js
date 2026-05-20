/* ========== Checkout Logic ========== */
const itemsContainer = document.getElementById('items');

let BANK_DETAILS = {
  bankName: "BANK OF CEYLON",
  accountNumber: "0094609936",
  accountName: "Ikram Fashion Outlet",
  branchName: "Galle",
  remarks: "IFO Galle"
};
let WA_NUMBER = "94700000000";
let DELIVERY_FEE = 350;

async function loadOptionsAndInitialize() {
  renderCheckout();
  
  // Load options from Supabase
  try {
    if (window.supabaseClient) {
      const { data } = await window.supabaseClient.from('custom_options').select('key, value');
      if (data && data.length > 0) {
        const opts = data.reduce((acc, row) => { acc[row.key] = row.value; return acc; }, {});
        if (opts.wa_number) WA_NUMBER = opts.wa_number;
        if (opts.bank_details) BANK_DETAILS = { ...BANK_DETAILS, ...opts.bank_details };
        if (opts.delivery_fee !== undefined) DELIVERY_FEE = Number(opts.delivery_fee);
      }
    }
  } catch (e) {
    console.error("Error loading options:", e);
  }

  // Populate UI Bank Details card
  const displayBankName = document.getElementById('displayBankName');
  const displayBankAccount = document.getElementById('displayBankAccount');
  const displayBankAccountName = document.getElementById('displayBankAccountName');
  const displayBankBranchRemarks = document.getElementById('displayBankBranchRemarks');
  const bankCard = document.getElementById('bankDetailsCard');

  if (displayBankName) displayBankName.textContent = BANK_DETAILS.bankName;
  if (displayBankAccount) displayBankAccount.textContent = BANK_DETAILS.accountNumber;
  if (displayBankAccountName) displayBankAccountName.textContent = BANK_DETAILS.accountName;
  
  if (displayBankBranchRemarks) {
    let branchRemarks = BANK_DETAILS.branchName || "";
    if (BANK_DETAILS.remarks) {
      branchRemarks += branchRemarks ? ` (${BANK_DETAILS.remarks})` : BANK_DETAILS.remarks;
    }
    displayBankBranchRemarks.textContent = branchRemarks || "—";
  }

  if (bankCard) bankCard.style.display = "block";

  // Attach copy event listener
  document.getElementById('btnCopyAccount')?.addEventListener('click', () => {
    navigator.clipboard.writeText(BANK_DETAILS.accountNumber).then(() => {
      const btn = document.getElementById('btnCopyAccount');
      const origHtml = btn.innerHTML;
      btn.innerHTML = `<i class="bx bx-check"></i> Copied`;
      btn.classList.add('copied');
      setTimeout(() => {
        btn.innerHTML = origHtml;
        btn.classList.remove('copied');
      }, 2000);
    });
  });

  renderCheckout();
}

function renderCheckout() {
  const cart = window.Cart.getCart();
  const gridEl = document.querySelector('.grid');
  const summaryWrap = document.querySelector('.summary-wrap');
  
  if (cart.length === 0) {
    if (gridEl) gridEl.classList.add('grid-empty');
    if (summaryWrap) summaryWrap.style.display = 'none';
    itemsContainer.innerHTML = `
      <div class="empty-cart fade-in">
        <div class="empty-cart-icon" style="font-size: 3.5rem; color: var(--muted); margin-bottom: 1.2rem;"><i class="bx bx-shopping-bag" style="color: var(--primary-2);"></i></div>
        <h2>Your bag is empty</h2>
        <p>Explore our premium collection and discover essentials tailored for you.</p>
        <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; margin-top: 1.5rem;">
          <a href="/men" class="btn btn-secondary" style="border-radius: 30px; padding: 12px 24px;">Shop Men</a>
          <a href="/boys" class="btn btn-secondary" style="border-radius: 30px; padding: 12px 24px;">Shop Boys</a>
        </div>
      </div>
    `;
    updateSummary(0, 0);
    return;
  }

  if (gridEl) gridEl.classList.remove('grid-empty');
  if (summaryWrap) summaryWrap.style.display = 'block';

  itemsContainer.innerHTML = cart.map((item, index) => `
    <div class="item fade-in">
      <div class="item-img">
        <img src="${item.image}" alt="${item.name}">
      </div>
      <div class="item-info">
        <div>
          <h3>${item.name}</h3>
          <p class="item-meta">${item.category} · ${item.color?.name || 'Default Color'} · ${item.size || 'Default Size'}</p>
        </div>
        <div class="item-controls">
          <div class="item-qty">
            <button onclick="updateQty(${index}, -1)">−</button>
            <span>${item.quantity}</span>
            <button onclick="updateQty(${index}, 1)">+</button>
          </div>
          <p class="item-price">LKR ${(item.price * item.quantity).toLocaleString()}</p>
        </div>
        <button class="item-remove" onclick="removeItem(${index})">Remove</button>
      </div>
    </div>
  `).join('');

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const count = cart.reduce((acc, item) => acc + item.quantity, 0);
  updateSummary(subtotal, count);
}

function updateQty(index, delta) {
  const cart = window.Cart.getCart();
  cart[index].quantity += delta;
  if (cart[index].quantity < 1) cart[index].quantity = 1;
  sessionStorage.setItem('ifo_cart', JSON.stringify(cart));
  window.Cart.updateCartBadge();
  renderCheckout();
}

function removeItem(index) {
  const cart = window.Cart.getCart();
  cart.splice(index, 1);
  sessionStorage.setItem('ifo_cart', JSON.stringify(cart));
  window.Cart.updateCartBadge();
  renderCheckout();
}

function updateSummary(subtotal, count) {
  document.getElementById('subtotal').textContent = `LKR ${subtotal.toLocaleString()}`;
  
  const shippingEl = document.getElementById('shipping');
  if (shippingEl) {
    shippingEl.textContent = DELIVERY_FEE > 0 ? `LKR ${DELIVERY_FEE.toLocaleString()}` : "Free";
  }
  
  const totalVal = subtotal + (subtotal > 0 ? DELIVERY_FEE : 0);
  document.getElementById('total').textContent = `LKR ${totalVal.toLocaleString()}`;
  document.getElementById('countLbl').textContent = count;
}

document.addEventListener('DOMContentLoaded', loadOptionsAndInitialize);


document.getElementById('checkout').addEventListener('click', async () => {
  const name = document.getElementById('name')?.value.trim();
  const phone = document.getElementById('phone')?.value.trim();
  const postcode = document.getElementById('postcode')?.value.trim();
  const district = document.getElementById('district')?.value;
  const address = document.getElementById('address')?.value.trim();

  if (!name || !phone || !address) {
    if(window.showToast) { window.showToast("Please fill in your Name, Phone, and Address.", true); } else { alert("Please fill in your Name, Phone Number, and Delivery Address."); }
    return;
  }

  const cart = window.Cart.getCart();
  if (cart.length === 0) return;

  const checkoutBtn = document.getElementById('checkout');
  const originalText = checkoutBtn.innerHTML;
  checkoutBtn.innerHTML = 'Processing...';
  checkoutBtn.disabled = true;

  let msg = `*New Order placed at Ikram Fashion Outlet!*\n\n`;
  msg += `*Customer Details:*\n`;
  msg += `Name: ${name}\n`;
  msg += `Phone: ${phone}\n`;
  msg += `District: ${district}\n`;
  if (postcode) msg += `Post Code: ${postcode}\n`;
  msg += `Address: ${address}\n\n`;
  
  msg += `*Order Details:*\n`;
  let subtotal = 0;
  cart.forEach((item, i) => {
    msg += `${i+1}. ${item.name} (${item.category})\n`;
    msg += `   Size: ${item.size || 'N/A'}, Color: ${item.color?.name || 'N/A'}\n`;
    msg += `   Qty: ${item.quantity} x LKR ${item.price.toLocaleString()}\n`;
    if (item.image) {
      msg += `   Image: ${item.image}\n`;
    }
    subtotal += item.price * item.quantity;
  });
  
  const finalTotal = subtotal + DELIVERY_FEE;
  msg += `\n*Subtotal:* LKR ${subtotal.toLocaleString()}\n`;
  msg += `*Delivery Fee:* LKR ${DELIVERY_FEE.toLocaleString()}\n`;
  msg += `*Total Amount:* LKR ${finalTotal.toLocaleString()}\n`;
  msg += `*Payment Method:* Bank Transfer\n\n`;
  
  msg += `-----------------------------\n`;
  msg += `*Bank Transfer Details:*\n`;
  msg += `Bank Name: ${BANK_DETAILS.bankName}\n`;
  msg += `Account Number: ${BANK_DETAILS.accountNumber}\n`;
  msg += `Account Name: ${BANK_DETAILS.accountName}\n`;
  if (BANK_DETAILS.branchName) msg += `Branch: ${BANK_DETAILS.branchName}\n`;
  if (BANK_DETAILS.remarks) msg += `Remarks: ${BANK_DETAILS.remarks}\n`;
  msg += `-----------------------------\n\n`;
  
  msg += `👉 *Next Step:* Please transfer the total of *LKR ${finalTotal.toLocaleString()}* to the bank details above and send a screenshot/photo of the *Payment Slip* in this chat to complete your order. Thank you!`;

  const cleanNum = WA_NUMBER.replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/${cleanNum}?text=${encodeURIComponent(msg)}`;
  
  sessionStorage.removeItem('ifo_cart');
  if (window.Cart.updateCartBadge) window.Cart.updateCartBadge();
  renderCheckout();

  window.open(waUrl, '_blank');
  
  // reset form
  document.getElementById('name').value = '';
  document.getElementById('phone').value = '';
  if (document.getElementById('postcode')) document.getElementById('postcode').value = '';
  document.getElementById('address').value = '';
  checkoutBtn.innerHTML = originalText;
  checkoutBtn.disabled = false;
});