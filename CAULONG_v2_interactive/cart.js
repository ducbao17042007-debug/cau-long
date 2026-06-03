/**
 * VNB Sports – Cart & Checkout Engine
 * Dùng chung cho tất cả các trang
 * Storage: localStorage key "vnb_cart"
 */

/* ===================================================
   DATA LAYER
   =================================================== */
const VNB = (() => {

  const STORAGE_KEY = 'vnb_cart';
  const USER_KEY    = 'vnb_user';

  /* ---------- Cart helpers ---------- */
  function getCart() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }
  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    _notifyCartChange(cart);
  }
  function addItem(product) {
    // product: { id, name, brand, price, originalPrice, image, weight, tension }
    const cart = getCart();
    const idx  = cart.findIndex(i => i.id === product.id);
    if (idx >= 0) { cart[idx].qty += 1; }
    else { cart.push({ ...product, qty: 1 }); }
    saveCart(cart);
    _showToast(`✓ Đã thêm "${product.name}" vào giỏ`);
  }
  function removeItem(id) {
    saveCart(getCart().filter(i => i.id !== id));
  }
  function setQty(id, qty) {
    if (qty < 1) { removeItem(id); return; }
    const cart = getCart();
    const idx  = cart.findIndex(i => i.id === id);
    if (idx >= 0) { cart[idx].qty = qty; saveCart(cart); }
  }
  function clearCart() { saveCart([]); }

  function cartCount()  { return getCart().reduce((s, i) => s + i.qty, 0); }
  function cartTotal()  { return getCart().reduce((s, i) => s + i.price * i.qty, 0); }

  /* ---------- User helpers ---------- */
  function getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) || null; }
    catch { return null; }
  }
  function saveUser(data) { localStorage.setItem(USER_KEY, JSON.stringify(data)); }
  function logout() { localStorage.removeItem(USER_KEY); }

  /* ---------- Discount codes ---------- */
  const DISCOUNTS = {
    'VNB10':     { type: 'percent', value: 10, label: 'Giảm 10%' },
    'CAULONG50': { type: 'fixed',   value: 50000, label: 'Giảm 50.000đ' },
    'FREESHIP':  { type: 'ship',    value: 0, label: 'Miễn phí vận chuyển' },
    'NEWMEMBER': { type: 'percent', value: 15, label: 'Giảm 15% cho thành viên mới' },
  };
  function applyDiscount(code) {
    const d = DISCOUNTS[code.trim().toUpperCase()];
    return d ? { ...d, code: code.toUpperCase() } : null;
  }

  /* ---------- Toast ---------- */
  function _showToast(msg, type = 'success') {
    let el = document.getElementById('vnb-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'vnb-toast';
      el.style.cssText = `
        position:fixed; bottom:24px; left:50%; transform:translateX(-50%) translateY(80px);
        background:#191c1d; color:#fff; padding:12px 24px; border-radius:999px;
        font-size:14px; font-weight:600; z-index:9999; box-shadow:0 8px 24px rgba(0,0,0,.3);
        transition:transform .35s cubic-bezier(.34,1.56,.64,1), opacity .3s;
        opacity:0; white-space:nowrap; max-width:90vw;
      `;
      document.body.appendChild(el);
    }
    if (type === 'error') el.style.background = '#ba1a1a';
    else if (type === 'info') el.style.background = '#7c5800';
    else el.style.background = '#191c1d';

    el.textContent = msg;
    el.style.transform = 'translateX(-50%) translateY(0)';
    el.style.opacity   = '1';
    clearTimeout(el._tid);
    el._tid = setTimeout(() => {
      el.style.transform = 'translateX(-50%) translateY(80px)';
      el.style.opacity   = '0';
    }, 2800);
  }

  /* ---------- Cart change broadcast ---------- */
  function _notifyCartChange(cart) {
    document.dispatchEvent(new CustomEvent('vnb:cartChanged', { detail: cart }));
  }

  return {
    getCart, saveCart, addItem, removeItem, setQty, clearCart,
    cartCount, cartTotal,
    getUser, saveUser, logout,
    applyDiscount,
    toast: _showToast,
  };
})();


/* ===================================================
   HEADER BADGE – auto-update on all pages
   =================================================== */
(function initBadge() {
  function update() {
    const n = VNB.cartCount();
    document.querySelectorAll('.vnb-cart-badge').forEach(el => {
      el.textContent = n;
      el.style.display = n ? 'flex' : 'none';
    });
  }
  document.addEventListener('vnb:cartChanged', update);
  document.addEventListener('DOMContentLoaded', update);
})();


/* ===================================================
   SANPHAM PAGE – "Thêm vào giỏ" buttons
   =================================================== */
document.addEventListener('DOMContentLoaded', function () {

  /* --- Product catalogue (embedded data) --- */
  const PRODUCTS = [
    { id: 'yonex-100zz',  name: 'Yonex Astrox 100ZZ Kurenai',          brand: 'Yonex',  price: 4150000, originalPrice: 4800000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQylzUNwbjTyPePq3sLS2RlUFCP90ydg8DECUs1rWICeJ2oZmnQBMSu_kqKh2FpYoozaLgZ75d2sVo7k6R3T-EGaIQ9GhD66yGC-oluLT6JXJnKWHFvY-HoxFPMw9GyHwauU32J9_7-tXuwMUeULbC66oUB7MvqmmHHFT5axVtdzqFPCSobAnw5zG3ZUnBksvpwPU-zepZuujTjyYOSFtCh99hxT5nCrzjCIWGOA299H3M-_0WSHdytwBv_pMX_0Z42N_dh97Mibc', weight: '4U/G5', tension: '28lbs' },
    { id: 'victor-thf',   name: 'Victor Thruster F Claw White Edition', brand: 'Victor', price: 3250000, originalPrice: 3820000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLF221Bv4NnKN3_jpzcT3lrJGzyC7eIJ8-dUMPQ6hqv0PWhs8Ph6iUmtmEZzodRgMAsWYaIgzI5WDQMkvOpCdEF1I6y57sx8c0kCNXbjJj6BfknnRVH6cEExqFyUmefxsMVIzKN6NLuhAA8ovyZjuhhwVzj_h6Vtl_u4ghEo30UBTxIViIRFonYi9HrnXVSypeg8_fDV6JujzT7JtKDreHP8UsjYw1LlLzrDwUi0klahg_lecifAU-Jj3DDDy47lDJfFMeOieRulM', weight: '4U/G5', tension: '26lbs' },
    { id: 'li-ning-n9',   name: 'Li-Ning N9 II Turbo Carbon',           brand: 'Li-Ning', price: 2890000, originalPrice: 2890000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCenPqBxtnC3e0WZDxMKvGgPJUeOtWvx5xdL-HPWZ6VG5avR5kRKMTEF7ZXZ8sKKVJ4OiPaApkAzY5Q3RY1ER3-C4tblqr3HJCrW9yNkFE9E-f5ARq7eO7oq_A8qlSjpLYj-rTlHt8cJMHDyFHfxXSYDAZYhEGBYuY1gCrBVIumC6gNlV-HQEqWOMDvr1ZcpzKGaEGGNGqIrp08Vr1NNJnBzXQ-ICJjSqFUZANt_L_Wm6RjsYfwNb2Js', weight: '3U/G5', tension: '24lbs' },
    { id: 'yonex-nf800',  name: 'Yonex Nanoflare 800 Game',             brand: 'Yonex',  price: 5200000, originalPrice: 5200000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRhaqk0sMPJCq4nXHmh8kPkq-ZWXaAH5GOaJmYiZsL-bQxqo0SifzFAVvLc4HZ3UzHlm8vqLpnuJ_dXcSJxTGzP4HRqVfxU3S-AWEF5e2N0XR5xoR5jbRf5LhBlQ3zXMgKRmPOdBH4SY_P7FkVFZdAMpYjKHPH1wGhf4QPmJTSnkYxXSvfyFmcX6jqdBF1N14yz6Yz1pJlEh_OsVwgSC8Xtjl-YGHw9M6eMRLl0VrUXTmRjCqOJFJY', weight: '4U/G5', tension: '28lbs' },
    { id: 'victor-p9200', name: 'Giày Victor P9200II TD Blue',           brand: 'Victor', price: 1850000, originalPrice: 1850000, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD534f_VXMc112GoJpaEQsk09R2k_fgy8AWOm2cDAJqbsEKKE64K-l5vp0mi3kBzgUiDsIzRyH2uIcWuIKENhP7KdratmYd02BwndcJpxxx', weight: 'Size 42', tension: '' },
    { id: 'yonex-65z2',   name: 'Yonex Aerosensa 65Z2 – Ống 10 quả',   brand: 'Yonex',  price: 320000,  originalPrice: 320000,  image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCabc', weight: '', tension: '' },
  ];

  /* --- Wire up "Thêm vào giỏ" buttons on sanpham.html --- */
  document.querySelectorAll('[data-product-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = PRODUCTS.find(x => x.id === btn.dataset.productId);
      if (p) VNB.addItem(p);
    });
  });

  /* --- Generic "shopping_basket" / "shopping_cart" icon buttons (no data attr) --- */
  document.querySelectorAll('.product-card .btn-add-cart, .btn-add-cart').forEach((btn, i) => {
    btn.addEventListener('click', () => {
      const p = PRODUCTS[i % PRODUCTS.length];
      VNB.addItem(p);
    });
  });

  /* =====================================================
     GIOHANG PAGE
     ===================================================== */
  const cartRoot = document.getElementById('vnb-cart-root');
  if (!cartRoot) return; // not on cart page

  let discountApplied = null;
  const SHIP_FEE = 0; // Free shipping for all (or set logic)

  function fmt(n) { return n.toLocaleString('vi-VN') + 'đ'; }

  function renderCart() {
    const cart = VNB.getCart();

    /* ---- Empty state ---- */
    if (cart.length === 0) {
      cartRoot.innerHTML = `
        <div class="flex flex-col items-center justify-center py-24 text-center gap-6">
          <span class="material-symbols-outlined text-[80px] text-on-surface-variant/30">shopping_cart</span>
          <h2 class="font-headline-lg text-2xl text-on-surface">Giỏ hàng trống</h2>
          <p class="text-on-surface-variant">Bạn chưa có sản phẩm nào trong giỏ. Hãy khám phá thêm!</p>
          <a href="sanpham.html" class="bg-primary text-on-primary px-8 py-3 rounded-full font-bold hover:bg-surface-tint transition-colors">
            Xem sản phẩm ngay →
          </a>
        </div>`;
      document.getElementById('vnb-order-summary').innerHTML = '';
      return;
    }

    /* ---- Cart items ---- */
    cartRoot.innerHTML = cart.map(item => `
      <div class="cart-item bg-white border border-outline-variant rounded-2xl p-4 flex gap-4 hover:shadow-md transition-shadow" data-id="${item.id}">
        <div class="w-24 h-24 md:w-28 md:h-28 bg-surface-container-low rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center">
          <img src="${item.image}" alt="${item.name}" class="w-full h-full object-contain mix-blend-multiply" onerror="this.src='https://via.placeholder.com/112?text=VNB'"/>
        </div>
        <div class="flex-1 flex flex-col justify-between">
          <div class="flex justify-between items-start gap-2">
            <div>
              <p class="text-primary font-bold text-xs uppercase tracking-widest mb-0.5">${item.brand}</p>
              <h3 class="font-bold text-base text-on-surface leading-snug">${item.name}</h3>
              ${item.weight ? `<p class="text-xs text-on-surface-variant mt-1">${item.weight}${item.tension ? ' | ' + item.tension : ''}</p>` : ''}
            </div>
            <button class="btn-remove text-error/50 hover:text-error transition-colors p-1 rounded-lg hover:bg-error/10 flex-shrink-0" data-id="${item.id}" title="Xóa">
              <span class="material-symbols-outlined text-xl">delete_outline</span>
            </button>
          </div>
          <div class="flex items-center justify-between mt-3">
            <div class="flex items-center bg-surface-container rounded-xl overflow-hidden border border-outline-variant">
              <button class="btn-minus w-9 h-9 flex items-center justify-center hover:bg-primary hover:text-white transition-colors font-bold text-lg" data-id="${item.id}">−</button>
              <span class="qty-display w-10 text-center font-bold text-base select-none">${item.qty}</span>
              <button class="btn-plus w-9 h-9 flex items-center justify-center hover:bg-primary hover:text-white transition-colors font-bold text-lg" data-id="${item.id}">+</button>
            </div>
            <div class="text-right">
              <span class="block font-bold text-lg text-primary">${fmt(item.price * item.qty)}</span>
              ${item.qty > 1 ? `<span class="text-xs text-on-surface-variant">${fmt(item.price)} / sản phẩm</span>` : ''}
              ${item.originalPrice > item.price ? `<span class="text-xs text-on-surface-variant line-through">${fmt(item.originalPrice * item.qty)}</span>` : ''}
            </div>
          </div>
        </div>
      </div>`).join('');

    /* ---- Bind qty / remove buttons ---- */
    cartRoot.querySelectorAll('.btn-remove').forEach(btn =>
      btn.addEventListener('click', () => { VNB.removeItem(btn.dataset.id); renderCart(); })
    );
    cartRoot.querySelectorAll('.btn-minus').forEach(btn =>
      btn.addEventListener('click', () => {
        const item = VNB.getCart().find(i => i.id === btn.dataset.id);
        if (item) { VNB.setQty(btn.dataset.id, item.qty - 1); renderCart(); }
      })
    );
    cartRoot.querySelectorAll('.btn-plus').forEach(btn =>
      btn.addEventListener('click', () => {
        const item = VNB.getCart().find(i => i.id === btn.dataset.id);
        if (item) { VNB.setQty(btn.dataset.id, item.qty + 1); renderCart(); }
      })
    );

    renderSummary();
  }

  function renderSummary() {
    const cart      = VNB.getCart();
    const subtotal  = VNB.cartTotal();
    const count     = VNB.cartCount();

    let discountAmt = 0;
    let discountLabel = '';
    if (discountApplied) {
      if (discountApplied.type === 'percent') {
        discountAmt   = Math.round(subtotal * discountApplied.value / 100);
        discountLabel = `- ${discountApplied.value}%`;
      } else if (discountApplied.type === 'fixed') {
        discountAmt   = discountApplied.value;
        discountLabel = `- ${fmt(discountApplied.value)}`;
      } else if (discountApplied.type === 'ship') {
        discountLabel = 'Miễn phí ship';
      }
    }

    const total = Math.max(0, subtotal - discountAmt);

    const sumEl = document.getElementById('vnb-order-summary');
    if (!sumEl) return;

    sumEl.innerHTML = `
      <div class="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm">
        <h2 class="font-bold text-xl mb-5 pb-4 border-b border-outline-variant">Tóm tắt đơn hàng</h2>
        <div class="space-y-3 text-base mb-5">
          <div class="flex justify-between">
            <span class="text-on-surface-variant">Tạm tính (${count} sp)</span>
            <span class="font-semibold">${fmt(subtotal)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-on-surface-variant">Phí vận chuyển</span>
            <span class="text-green-600 font-semibold">Miễn phí</span>
          </div>
          ${discountApplied ? `
          <div class="flex justify-between text-error">
            <span>Mã ${discountApplied.code}</span>
            <span class="font-semibold">${discountLabel}</span>
          </div>` : ''}
        </div>
        <div class="border-t border-outline-variant pt-4 flex justify-between items-center mb-6">
          <span class="font-bold text-lg">Tổng cộng</span>
          <span class="font-extrabold text-2xl text-primary">${fmt(total)}</span>
        </div>

        <!-- Discount code -->
        <div class="mb-5">
          <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Mã giảm giá / Voucher</label>
          <div class="flex gap-2">
            <input id="discount-input" type="text" placeholder="Nhập mã (VNB10, FREESHIP…)"
              value="${discountApplied ? discountApplied.code : ''}"
              class="flex-1 border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-surface-container-low"/>
            <button id="discount-btn" class="bg-on-surface text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-surface-tint transition-colors whitespace-nowrap">
              ${discountApplied ? 'Xóa' : 'Áp dụng'}
            </button>
          </div>
          <div id="discount-msg" class="text-xs mt-1.5 ${discountApplied ? 'text-green-600' : 'text-error'} font-semibold"></div>
        </div>

        <button id="btn-checkout" class="w-full bg-primary text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-surface-tint transition-all shadow-lg shadow-primary/20 text-base hover:-translate-y-0.5 active:translate-y-0">
          <span class="material-symbols-outlined">qr_code_2</span> THANH TOÁN NGAY
        </button>
        <p class="text-center text-xs text-on-surface-variant mt-3">Giá đã bao gồm VAT nếu có</p>
      </div>

      <!-- Incentives -->
      <div class="grid grid-cols-2 gap-3 mt-4">
        <div class="bg-green-50 border border-green-200 p-3 rounded-xl flex items-start gap-2 text-sm">
          <span class="material-symbols-outlined text-green-600 text-lg" style="font-variation-settings:'FILL' 1">local_shipping</span>
          <div><p class="font-bold text-green-800">Miễn phí vận chuyển</p><p class="text-green-700 text-xs">Cho đơn từ 2.000.000đ</p></div>
        </div>
        <div class="bg-yellow-50 border border-yellow-200 p-3 rounded-xl flex items-start gap-2 text-sm">
          <span class="material-symbols-outlined text-yellow-700 text-lg" style="font-variation-settings:'FILL' 1">verified_user</span>
          <div><p class="font-bold text-yellow-900">Bảo hành chính hãng</p><p class="text-yellow-800 text-xs">Đổi trả 7 ngày lỗi NSX</p></div>
        </div>
      </div>`;

    /* ---- Discount logic ---- */
    const discountBtn   = document.getElementById('discount-btn');
    const discountInput = document.getElementById('discount-input');
    const discountMsg   = document.getElementById('discount-msg');

    discountBtn.addEventListener('click', () => {
      if (discountApplied) {
        discountApplied = null;
        VNB.toast('Đã xóa mã giảm giá', 'info');
        renderCart();
        return;
      }
      const code = discountInput.value.trim();
      if (!code) { discountMsg.textContent = 'Vui lòng nhập mã giảm giá'; discountMsg.className = 'text-xs mt-1.5 text-error font-semibold'; return; }
      const result = VNB.applyDiscount(code);
      if (result) {
        discountApplied = result;
        discountMsg.textContent = `✓ ${result.label}`;
        discountMsg.className = 'text-xs mt-1.5 text-green-600 font-semibold';
        VNB.toast(`Áp dụng mã "${result.code}" thành công!`);
        renderCart();
      } else {
        discountMsg.textContent = '✗ Mã không hợp lệ hoặc đã hết hạn';
        discountMsg.className = 'text-xs mt-1.5 text-error font-semibold';
      }
    });

    discountInput.addEventListener('keypress', e => { if (e.key === 'Enter') discountBtn.click(); });

    /* ---- Checkout button → QR Modal ---- */
    document.getElementById('btn-checkout').addEventListener('click', () => {
      const cart = VNB.getCart();
      if (cart.length === 0) { VNB.toast('Giỏ hàng trống!', 'error'); return; }
      openCheckoutModal(total, cart);
    });
  }

  /* initial render */
  renderCart();
  document.addEventListener('vnb:cartChanged', renderCart);
});


/* ===================================================
   CHECKOUT / QR MODAL
   =================================================== */
function openCheckoutModal(total, cart) {
  // Remove existing
  document.getElementById('vnb-checkout-modal')?.remove();

  const fmt   = n => n.toLocaleString('vi-VN') + 'đ';
  const ORDER = 'VNB' + Date.now().toString().slice(-8);
  const QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=` +
    encodeURIComponent(`VIETCOMBANK|0123456789|VNB Sports|${total}|${ORDER}`);

  /* ---- Build step HTML ---- */
  const steps = ['Xác nhận', 'Giao hàng', 'Thanh toán', 'Xong'];

  const modal = document.createElement('div');
  modal.id = 'vnb-checkout-modal';
  modal.style.cssText = `
    position:fixed; inset:0; z-index:10000;
    background:rgba(0,0,0,.65); backdrop-filter:blur(4px);
    display:flex; align-items:center; justify-content:center; padding:16px;
    animation: vnbFadeIn .25s ease;
  `;
  modal.innerHTML = `
    <style>
      @keyframes vnbFadeIn { from { opacity:0; transform:scale(.97) } to { opacity:1; transform:scale(1) } }
      @keyframes vnbSlide  { from { opacity:0; transform:translateX(30px) } to { opacity:1; transform:none } }
      .vnb-step { animation: vnbSlide .3s ease; }
      .co-step-bar { display:flex; align-items:center; gap:0; margin-bottom:28px; }
      .co-step-node { width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0;transition:all .3s; }
      .co-step-node.done  { background:#7c5800;color:#fff; }
      .co-step-node.active{ background:#7c5800;color:#fff;box-shadow:0 0 0 4px rgba(124,88,0,.2); }
      .co-step-node.future{ background:#e7e8e9;color:#514532; }
      .co-step-line { flex:1;height:2px;background:#e7e8e9; }
      .co-step-line.done { background:#7c5800; }
      .co-input { width:100%;border:1.5px solid #d5c4ab;border-radius:12px;padding:10px 14px;font-size:14px;outline:none;transition:border-color .2s;font-family:inherit; }
      .co-input:focus { border-color:#7c5800;box-shadow:0 0 0 3px rgba(124,88,0,.12); }
      .co-btn-primary { width:100%;background:#7c5800;color:#fff;border:none;padding:14px;border-radius:14px;font-weight:700;font-size:15px;cursor:pointer;transition:all .2s;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px; }
      .co-btn-primary:hover { background:#6b4c00;transform:translateY(-1px);box-shadow:0 4px 16px rgba(124,88,0,.3); }
      .co-btn-secondary { background:#f3f4f5;color:#191c1d;border:none;padding:12px;border-radius:12px;font-weight:600;font-size:14px;cursor:pointer;transition:background .2s;font-family:inherit; }
      .co-btn-secondary:hover { background:#e7e8e9; }
      #vnb-qr-status { display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600;padding:10px 16px;border-radius:10px; }
      #vnb-qr-status.pending { background:#fff8e1;color:#7c5800; }
      #vnb-qr-status.success { background:#e8f5e9;color:#2e7d32; }
    </style>

    <div style="background:#fff;border-radius:24px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,.25);">
      <!-- Header -->
      <div style="padding:20px 24px;border-bottom:1px solid #edeeef;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:#fff;z-index:1;border-radius:24px 24px 0 0;">
        <div>
          <h2 style="font-size:18px;font-weight:800;color:#191c1d;margin:0">Thanh toán đơn hàng</h2>
          <p style="font-size:12px;color:#837560;margin:2px 0 0">Mã đơn: <strong style="color:#7c5800">${ORDER}</strong></p>
        </div>
        <button id="co-close" style="background:#f3f4f5;border:none;border-radius:50%;width:36px;height:36px;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;color:#191c1d">✕</button>
      </div>

      <!-- Step indicator -->
      <div style="padding:20px 24px 0;">
        <div class="co-step-bar" id="co-step-bar">
          ${steps.map((s, i) => `
            <div class="co-step-node ${i === 0 ? 'active' : 'future'}" id="co-node-${i}">${i + 1}</div>
            ${i < steps.length - 1 ? `<div class="co-step-line" id="co-line-${i}"></div>` : ''}
          `).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:-14px;margin-bottom:20px;">
          ${steps.map(s => `<span style="font-size:11px;font-weight:600;color:#514532;text-align:center;flex:1">${s}</span>`).join('')}
        </div>
      </div>

      <!-- Steps content -->
      <div id="co-body" style="padding:0 24px 24px;"></div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.getElementById('co-close').addEventListener('click', closeModal);

  function closeModal() {
    modal.style.opacity = '0'; modal.style.transform = 'scale(.97)';
    modal.style.transition = 'all .2s';
    setTimeout(() => modal.remove(), 200);
  }

  let currentStep = 0;
  let deliveryData = {};

  function setStep(n) {
    // Update step bar
    for (let i = 0; i < steps.length; i++) {
      const node = document.getElementById(`co-node-${i}`);
      if (i < n)  { node.className = 'co-step-node done'; node.textContent = '✓'; }
      else if (i === n) { node.className = 'co-step-node active'; node.textContent = i + 1; }
      else        { node.className = 'co-step-node future'; node.textContent = i + 1; }
      if (i < steps.length - 1) {
        document.getElementById(`co-line-${i}`).className = 'co-step-line' + (i < n ? ' done' : '');
      }
    }
    currentStep = n;
    renderStep(n);
  }

  function renderStep(n) {
    const body = document.getElementById('co-body');
    body.innerHTML = '';

    if (n === 0) {
      /* ---- Step 0: Confirm order ---- */
      body.innerHTML = `
        <div class="vnb-step">
          <h3 style="font-weight:700;margin:0 0 12px;font-size:15px;">Xác nhận đơn hàng</h3>
          <div style="max-height:200px;overflow-y:auto;space-y:8px;">
            ${cart.map(item => `
              <div style="display:flex;gap:12px;align-items:center;padding:10px;background:#f8f9fa;border-radius:12px;margin-bottom:8px;">
                <img src="${item.image}" style="width:48px;height:48px;object-fit:contain;background:#e7e8e9;border-radius:8px;" onerror="this.src='https://via.placeholder.com/48?text=VNB'"/>
                <div style="flex:1;min-width:0;">
                  <p style="font-size:13px;font-weight:600;color:#191c1d;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.name}</p>
                  <p style="font-size:12px;color:#514532;margin:2px 0 0;">x${item.qty} — <span style="color:#7c5800;font-weight:700;">${(item.price * item.qty).toLocaleString('vi-VN')}đ</span></p>
                </div>
              </div>`).join('')}
          </div>
          <div style="border-top:1px solid #edeeef;margin:12px 0;padding-top:12px;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:14px;color:#514532;">Tổng thanh toán</span>
            <span style="font-size:22px;font-weight:800;color:#7c5800;">${fmt(total)}</span>
          </div>
          <button class="co-btn-primary" id="co-step0-next">
            <span class="material-symbols-outlined">arrow_forward</span> Tiếp theo: Giao hàng
          </button>
        </div>`;
      document.getElementById('co-step0-next').onclick = () => setStep(1);
    }

    else if (n === 1) {
      /* ---- Step 1: Delivery info ---- */
      body.innerHTML = `
        <div class="vnb-step">
          <h3 style="font-weight:700;margin:0 0 16px;font-size:15px;">Thông tin giao hàng</h3>
          <div style="display:grid;gap:12px;">
            <div>
              <label style="font-size:12px;font-weight:700;color:#514532;display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em;">Họ & Tên *</label>
              <input class="co-input" id="co-name" placeholder="Nguyễn Văn A" value="${deliveryData.name || ''}"/>
            </div>
            <div>
              <label style="font-size:12px;font-weight:700;color:#514532;display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em;">Số điện thoại *</label>
              <input class="co-input" id="co-phone" type="tel" placeholder="0912 345 678" value="${deliveryData.phone || ''}"/>
            </div>
            <div>
              <label style="font-size:12px;font-weight:700;color:#514532;display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em;">Email</label>
              <input class="co-input" id="co-email" type="email" placeholder="email@example.com" value="${deliveryData.email || ''}"/>
            </div>
            <div>
              <label style="font-size:12px;font-weight:700;color:#514532;display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em;">Địa chỉ giao hàng *</label>
              <input class="co-input" id="co-address" placeholder="Số nhà, tên đường, phường/xã..." value="${deliveryData.address || ''}"/>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div>
                <label style="font-size:12px;font-weight:700;color:#514532;display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em;">Tỉnh / Thành phố *</label>
                <select class="co-input" id="co-city">
                  <option value="">Chọn thành phố</option>
                  ${['TP. Hồ Chí Minh','Hà Nội','Đà Nẵng','Cần Thơ','Hải Phòng','Nha Trang','Huế','Vũng Tàu','Bình Dương','Đồng Nai'].map(c => `<option ${deliveryData.city === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="font-size:12px;font-weight:700;color:#514532;display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em;">Phương thức</label>
                <select class="co-input" id="co-method">
                  <option value="standard">Giao hàng (2-3 ngày)</option>
                  <option value="express">Hỏa tốc (4-8 giờ)</option>
                  <option value="pickup">Nhận tại cửa hàng</option>
                </select>
              </div>
            </div>
            <div>
              <label style="font-size:12px;font-weight:700;color:#514532;display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em;">Ghi chú (tuỳ chọn)</label>
              <input class="co-input" id="co-note" placeholder="Lưu ý cho người giao hàng..." value="${deliveryData.note || ''}"/>
            </div>
          </div>
          <div id="co-delivery-err" style="color:#ba1a1a;font-size:13px;font-weight:600;margin:10px 0 0;display:none;"></div>
          <div style="display:flex;gap:10px;margin-top:16px;">
            <button class="co-btn-secondary" id="co-step1-back" style="flex:0 0 80px">← Quay lại</button>
            <button class="co-btn-primary" id="co-step1-next" style="flex:1">
              <span class="material-symbols-outlined">qr_code_2</span> Tiến tới thanh toán
            </button>
          </div>
        </div>`;

      document.getElementById('co-step1-back').onclick = () => setStep(0);
      document.getElementById('co-step1-next').onclick = () => {
        const name    = document.getElementById('co-name').value.trim();
        const phone   = document.getElementById('co-phone').value.trim();
        const address = document.getElementById('co-address').value.trim();
        const city    = document.getElementById('co-city').value;
        const errEl   = document.getElementById('co-delivery-err');
        if (!name || !phone || !address || !city) {
          errEl.textContent = '* Vui lòng điền đầy đủ các trường bắt buộc (*)';
          errEl.style.display = 'block'; return;
        }
        if (!/^(0|\+84)[0-9]{8,10}$/.test(phone.replace(/\s/g, ''))) {
          errEl.textContent = '* Số điện thoại không hợp lệ'; errEl.style.display = 'block'; return;
        }
        deliveryData = {
          name, phone,
          email: document.getElementById('co-email').value.trim(),
          address, city,
          method: document.getElementById('co-method').value,
          note: document.getElementById('co-note').value.trim(),
        };
        setStep(2);
      };
    }

    else if (n === 2) {
      /* ---- Step 2: QR Payment ---- */
      body.innerHTML = `
        <div class="vnb-step" style="text-align:center;">
          <h3 style="font-weight:700;margin:0 0 4px;font-size:15px;">Quét QR để thanh toán</h3>
          <p style="font-size:13px;color:#514532;margin:0 0 16px;">Mở app ngân hàng bất kỳ → Quét mã bên dưới</p>

          <div style="background:linear-gradient(135deg,#fffde7,#fff8e1);border:2px solid #ffb800;border-radius:20px;padding:20px;display:inline-block;margin-bottom:16px;position:relative;">
            <img src="${QR_URL}" alt="QR Code thanh toán" style="width:200px;height:200px;display:block;" id="co-qr-img"
              onerror="this.parentElement.innerHTML='<div style=width:200px;height:200px;background:#f8f9fa;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px><span style=font-size:40px>📱</span><p style=font-size:12px;color:#514532;margin:0>Quét mã QR<br>để thanh toán</p></div>'"/>
            <div style="position:absolute;top:-10px;right:-10px;background:#7c5800;color:#fff;font-size:10px;font-weight:700;padding:4px 10px;border-radius:999px;letter-spacing:.05em;">VNB PAY</div>
          </div>

          <div style="background:#f8f9fa;border-radius:14px;padding:14px;text-align:left;margin-bottom:16px;font-size:13px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <span style="color:#514532;">Ngân hàng</span>
              <span style="font-weight:700;">Vietcombank</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <span style="color:#514532;">Số tài khoản</span>
              <span style="font-weight:700;font-family:monospace;">0123 4567 89</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <span style="color:#514532;">Chủ tài khoản</span>
              <span style="font-weight:700;">VNB SPORTS JSC</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <span style="color:#514532;">Số tiền</span>
              <span style="font-weight:800;color:#7c5800;font-size:16px;">${fmt(total)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#514532;">Nội dung</span>
              <span style="font-weight:700;font-family:monospace;">${ORDER}</span>
            </div>
          </div>

          <div id="vnb-qr-status" class="pending" style="margin-bottom:16px;border-radius:12px;justify-content:center;">
            <span class="material-symbols-outlined" style="font-size:18px;animation:spin 2s linear infinite">sync</span>
            Đang chờ xác nhận thanh toán…
          </div>
          <style>@keyframes spin{to{transform:rotate(360deg)}}</style>

          <p style="font-size:12px;color:#837560;margin-bottom:16px;">Giao dịch sẽ được xác nhận tự động trong vòng 2 phút sau khi chuyển khoản</p>

          <div style="display:flex;gap:10px;">
            <button class="co-btn-secondary" id="co-step2-back" style="flex:0 0 80px">← Sửa</button>
            <button class="co-btn-primary" id="co-sim-paid" style="flex:1;background:#2e7d32">
              <span class="material-symbols-outlined">check_circle</span> Mô phỏng: Đã thanh toán
            </button>
          </div>
        </div>`;

      document.getElementById('co-step2-back').onclick = () => setStep(1);

      /* Simulate payment confirm after 3s or on button click */
      let paidTimer = setTimeout(confirmPaid, 15000); // auto after 15s demo

      function confirmPaid() {
        clearTimeout(paidTimer);
        const st = document.getElementById('vnb-qr-status');
        if (st) { st.className = 'success'; st.style.borderRadius = '12px'; st.style.justifyContent = 'center'; st.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;color:#2e7d32">check_circle</span> Thanh toán thành công!'; }
        setTimeout(() => setStep(3), 1000);
      }

      document.getElementById('co-sim-paid').onclick = confirmPaid;
    }

    else if (n === 3) {
      /* ---- Step 3: Success ---- */
      body.innerHTML = `
        <div class="vnb-step" style="text-align:center;padding:16px 0;">
          <div style="width:72px;height:72px;background:#e8f5e9;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
            <span class="material-symbols-outlined" style="font-size:40px;color:#2e7d32;font-variation-settings:'FILL' 1">check_circle</span>
          </div>
          <h3 style="font-weight:800;font-size:20px;color:#191c1d;margin:0 0 8px">Đặt hàng thành công! 🎉</h3>
          <p style="color:#514532;font-size:14px;margin:0 0 20px;">Cảm ơn <strong>${deliveryData.name || 'bạn'}</strong>! Đơn hàng <strong style="color:#7c5800">${ORDER}</strong> đã được xác nhận.</p>

          <div style="background:#f8f9fa;border-radius:14px;padding:14px;text-align:left;font-size:13px;margin-bottom:20px;">
            <p style="margin:0 0 6px;"><strong>Giao đến:</strong> ${deliveryData.address || ''}, ${deliveryData.city || ''}</p>
            <p style="margin:0 0 6px;"><strong>Liên hệ:</strong> ${deliveryData.phone || ''}</p>
            <p style="margin:0;"><strong>Phương thức:</strong> ${
              deliveryData.method === 'express' ? '🚀 Hỏa tốc (4–8 giờ)' :
              deliveryData.method === 'pickup'  ? '🏬 Nhận tại cửa hàng' :
              '📦 Giao hàng tiêu chuẩn (2–3 ngày)'
            }</p>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
            <div style="background:#fff8e1;border-radius:12px;padding:12px;text-align:center;">
              <p style="font-size:11px;color:#7c5800;font-weight:700;text-transform:uppercase;margin:0 0 4px">Tổng thanh toán</p>
              <p style="font-size:18px;font-weight:800;color:#7c5800;margin:0">${fmt(total)}</p>
            </div>
            <div style="background:#e8f5e9;border-radius:12px;padding:12px;text-align:center;">
              <p style="font-size:11px;color:#2e7d32;font-weight:700;text-transform:uppercase;margin:0 0 4px">Trạng thái</p>
              <p style="font-size:15px;font-weight:800;color:#2e7d32;margin:0">✓ Đã thanh toán</p>
            </div>
          </div>

          <button class="co-btn-primary" id="co-done-btn">
            <span class="material-symbols-outlined">home</span> Tiếp tục mua sắm
          </button>
        </div>`;

      VNB.clearCart();
      document.getElementById('co-done-btn').onclick = () => {
        closeModal();
        window.location.href = 'sanpham.html';
      };
    }
  }

  setStep(0);
}

/* ===================================================
   SANPHAM PAGE – bind data-product-id buttons
   =================================================== */
document.addEventListener('DOMContentLoaded', function() {
  const PRODUCTS_CATALOG = {
    'yonex-100zz':  { id: 'yonex-100zz',  name: 'Yonex Astrox 100ZZ Kurenai',       brand: 'Yonex',   price: 4150000, originalPrice: 4800000, weight: '4U/G5', tension: '28lbs', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQylzUNwbjTyPePq3sLS2RlUFCP90ydg8DECUs1rWICeJ2oZmnQBMSu_kqKh2FpYoozaLgZ75d2sVo7k6R3T-EGaIQ9GhD66yGC-oluLT6JXJnKWHFvY-HoxFPMw9GyHwauU32J9_7-tXuwMUeULbC66oUB7MvqmmHHFT5axVtdzqFPCSobAnw5zG3ZUnBksvpwPU-zepZuujTjyYOSFtCh99hxT5nCrzjCIWGOA299H3M-_0WSHdytwBv_pMX_0Z42N_dh97Mibc' },
    'victor-thf':   { id: 'victor-thf',   name: 'Victor Thruster F Claw White',      brand: 'Victor',  price: 3250000, originalPrice: 3820000, weight: '4U/G5', tension: '26lbs', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLF221Bv4NnKN3_jpzcT3lrJGzyC7eIJ8-dUMPQ6hqv0PWhs8Ph6iUmtmEZzodRgMAsWYaIgzI5WDQMkvOpCdEF1I6y57sx8c0kCNXbjJj6BfknnRVH6cEExqFyUmefxsMVIzKN6NLuhAA8ovyZjuhhwVzj_h6Vtl_u4ghEo30UBTxIViIRFonYi9HrnXVSypeg8_fDV6JujzT7JtKDreHP8UsjYw1LlLzrDwUi0klahg_lecifAU-Jj3DDDy47lDJfFMeOieRulM' },
    'lining-n9':    { id: 'lining-n9',    name: 'Li-Ning N9 II Turbo Carbon',        brand: 'Li-Ning', price: 2890000, originalPrice: 2890000, weight: '3U/G5', tension: '24lbs', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCenPqBxtnC3e0WZDxMKvGgPJUeOtWvx5xdL-HPWZ6VG5avR5kRKMTEF7ZXZ8sKKVJ4OiPaApkAzY5Q3RY1ER3-C4tblqr3HJCrW9yNkFE9E-f5ARq7eO7oq_A8qlSjpLYj-rTlHt8cJMHDyFHfxXSYDAZYhEGBYuY1gCrBVIumC6gNlV-HQEqWOMDvr1ZcpzKGaEGGNGqIrp08Vr1NNJnBzXQ-ICJjSqFUZANt_L_Wm6RjsYfwNb2Js' },
    'yonex-nf800':  { id: 'yonex-nf800',  name: 'Yonex Nanoflare 800 Game',         brand: 'Yonex',   price: 5200000, originalPrice: 5200000, weight: '4U/G5', tension: '28lbs', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRhaqk0sMPJCq4nXHmh8kPkq-ZWXaAH5GOaJmYiZsL-bQxqo0SifzFAVvLc4HZ3UzHlm8vqLpnuJ_dXcSJxTGzP4HRqVfxU3S-AWEF5e2N0XR5xoR5jbRf5LhBlQ3zXMgKRmPOdBH4SY_P7FkVFZdAMpYjKHPH1wGhf4QPmJTSnkYxXSvfyFmcX6jqdBF1N14yz6Yz1pJlEh_OsVwgSC8Xtjl-YGHw9M6eMRLl0VrUXTmRjCqOJFJY' },
    'victor-p9200': { id: 'victor-p9200', name: 'Giày Victor P9200II TD Blue',       brand: 'Victor',  price: 1850000, originalPrice: 1850000, weight: 'Size 42', tension: '', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD534f_VXMc112GoJpaEQsk09R2k_fgy8AWOm2cDAJqbsEKKE64K-l5vp0mi3kBzgUiDsIzRyH2uIcWuIKENhP7KdratmYd02BwndcJbJ' },
    'yonex-65z2':   { id: 'yonex-65z2',   name: 'Cầu lông Aerosensa 65Z2 (10 quả)', brand: 'Yonex',   price: 320000,  originalPrice: 320000,  weight: '', tension: '', image: '' },
  };

  // Bind buttons with data-product-id attribute
  document.querySelectorAll('[data-product-id]').forEach(btn => {
    const product = PRODUCTS_CATALOG[btn.dataset.productId];
    if (!product) return;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      VNB.addItem(product);
      // Visual feedback
      const orig = btn.innerHTML;
      btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;font-variation-settings:\'FILL\' 1">check_circle</span> ĐÃ THÊM';
      btn.style.background = '#2e7d32';
      btn.style.color = '#fff';
      setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; btn.style.color = ''; }, 1600);
    });
  });
});
