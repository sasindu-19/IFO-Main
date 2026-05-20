/* ========== Cart Logic ========== */
const CART_KEY = 'ifo_cart';

function getCart() {
  const data = sessionStorage.getItem(CART_KEY);
  return data ? JSON.parse(data) : [];
}

function saveCart(cart) {
  sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(product, quantity, size, color, selectedImage) {
  const cart = getCart();
  const existingIndex = cart.findIndex(item => 
    item.id === product.id && 
    item.size === size && 
    item.color?.name === color?.name
  );

  if (existingIndex > -1) {
    cart[existingIndex].quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: selectedImage || product.image || (product.images ? product.images[0] : ""),
      quantity,
      size,
      color,
      category: product.category
    });
  }

  saveCart(cart);
}

function updateCartBadge() {
  const cart = getCart();
  const total = cart.reduce((acc, item) => acc + item.quantity, 0);
  
  // Update all badges on page
  const badges = document.querySelectorAll('.bag');
  badges.forEach(bag => {
    let countEl = bag.querySelector('.bag-count');
    if (total > 0) {
      if (!countEl) {
        countEl = document.createElement('span');
        countEl.className = 'bag-count';
        bag.appendChild(countEl);
      }
      countEl.textContent = total;
    } else if (countEl) {
      countEl.remove();
    }
  });
}

// Initialize badge on load
document.addEventListener('DOMContentLoaded', updateCartBadge);
window.Cart = { getCart, addToCart, updateCartBadge };
