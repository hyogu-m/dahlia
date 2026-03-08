const startButton = document.querySelector('.start-btn');
const startAudio = document.querySelector('#start-audio');
const START_SOUND_SRC = 'assets/start-sound.mp3';
const START_SOUND_PENDING_KEY = 'dahlia_start_sound_pending';
const START_SOUND_STARTED_AT_KEY = 'dahlia_start_sound_started_at';

if (startButton) {
  startButton.addEventListener('click', () => {
    let hasNavigated = false;
    const navigateToCategory = () => {
      if (hasNavigated) {
        return;
      }
      hasNavigated = true;
      window.location.href = 'category.html';
    };

    if (!startAudio) {
      navigateToCategory();
      return;
    }

    startAudio.currentTime = 0;
    const playPromise = startAudio.play();
    sessionStorage.setItem(START_SOUND_PENDING_KEY, '1');
    sessionStorage.setItem(START_SOUND_STARTED_AT_KEY, String(Date.now()));

    // Keep transition snappy while preserving sound continuity after navigation.
    setTimeout(navigateToCategory, 120);

    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        navigateToCategory();
      });
    }
  });
}

if (document.body.classList.contains('menu-page')) {
  resumeStartSoundOnMenuPage();
  initMenuPage();
}

function resumeStartSoundOnMenuPage() {
  const isPending = sessionStorage.getItem(START_SOUND_PENDING_KEY) === '1';
  if (!isPending) {
    return;
  }

  sessionStorage.removeItem(START_SOUND_PENDING_KEY);

  const startedAt = Number(sessionStorage.getItem(START_SOUND_STARTED_AT_KEY) ?? '0');
  sessionStorage.removeItem(START_SOUND_STARTED_AT_KEY);

  if (!Number.isFinite(startedAt) || startedAt <= 0) {
    return;
  }

  const elapsed = Math.max(0, (Date.now() - startedAt) / 1000);
  const carryAudio = new Audio(START_SOUND_SRC);
  carryAudio.preload = 'auto';

  const playWithOffset = () => {
    if (!Number.isFinite(carryAudio.duration) || carryAudio.duration <= 0 || elapsed >= carryAudio.duration) {
      return;
    }

    carryAudio.currentTime = Math.min(elapsed, Math.max(0, carryAudio.duration - 0.05));
    carryAudio.play().catch(() => {});
  };

  if (carryAudio.readyState >= 1) {
    playWithOffset();
    return;
  }

  carryAudio.addEventListener('loadedmetadata', playWithOffset, { once: true });
}

function initMenuPage() {
  const STORAGE_HISTORY_KEY = 'dahlia_checkout_history';
  if (isReloadNavigation()) {
    localStorage.removeItem(STORAGE_HISTORY_KEY);
  }

  const menuCards = Array.from(document.querySelectorAll('.menu-card'));
  const checkoutButton = document.querySelector('.checkout-btn');
  const cartIconButton = document.querySelector('.cart-icon-btn');
  const menuToggleButton = document.querySelector('.menu-toggle');
  const categoryNav = document.querySelector('.category-nav');
  const categoryNavItems = Array.from(document.querySelectorAll('.category-nav-item'));
  const menuContent = document.querySelector('.menu-content');
  const cartCount = document.querySelector('.cart-count');
  const cartPanel = document.querySelector('.cart-panel');
  const cartOverlay = document.querySelector('.cart-overlay');
  const cartCloseButton = document.querySelector('.cart-close-btn');
  const historyCheckoutButton = document.querySelector('.history-checkout-btn');
  const historyList = document.querySelector('.history-list');
  const historyEmpty = document.querySelector('.history-empty');
  const historyTotal = document.querySelector('.history-total');
  const orderModal = document.querySelector('.order-modal');
  const orderOverlay = document.querySelector('.order-overlay');
  const orderList = document.querySelector('.order-list');
  const orderEmpty = document.querySelector('.order-empty');
  const orderTotal = document.querySelector('.order-total');
  const orderCancelButton = document.querySelector('.order-cancel-btn');
  const orderConfirmButton = document.querySelector('.order-confirm-btn');

  let cartItems = [];
  let checkoutHistory = load(STORAGE_HISTORY_KEY);

  menuCards.forEach((card) => {
    setupQuantityControl(card);
  });

  checkoutButton?.addEventListener('click', () => {
    cartItems = collectOrderByQuantities();
    renderCart();
    renderOrderModal();

    if (cartItems.length === 0) {
      window.alert('数量を選んでください');
      return;
    }

    openOrderModal();
  });

  orderCancelButton?.addEventListener('click', () => {
    closeOrderModal();
  });

  orderOverlay?.addEventListener('click', closeOrderModal);

  orderConfirmButton?.addEventListener('click', () => {
    if (cartItems.length === 0) {
      return;
    }

    const diagnosisOrders = cartItems.map((item) => ({ tags: item.tags ?? [] }));
    const total = cartItems.reduce((sum, item) => sum + item.price, 0);
    const items = Object.values(groupByName(cartItems));
    checkoutHistory.unshift({
      id: Date.now(),
      total,
      itemCount: cartItems.length,
      items,
      diagnosisOrders,
      at: new Date().toLocaleString('ja-JP'),
    });

    checkoutHistory = checkoutHistory.slice(0, 30);
    clearAllCardQuantities();
    cartItems = [];

    save(STORAGE_HISTORY_KEY, checkoutHistory);

    renderCart();
    closeOrderModal();
  });

  historyCheckoutButton?.addEventListener('click', () => {
    if (checkoutHistory.length === 0) {
      window.alert('注文履歴がありません');
      return;
    }

    const diagnosisOrders = checkoutHistory.flatMap((history) => {
      if (Array.isArray(history.diagnosisOrders)) {
        return history.diagnosisOrders;
      }
      return [];
    });

    if (diagnosisOrders.length === 0) {
      window.alert('診断できる注文履歴がありません');
      return;
    }

    closeCartPanel();
    if (typeof goToResultPage === 'function') {
      goToResultPage(diagnosisOrders);
    }
  });

  cartIconButton?.addEventListener('click', openCartPanel);
  menuToggleButton?.addEventListener('click', () => {
    if (!categoryNav || !menuToggleButton) {
      return;
    }

    const isOpen = categoryNav.style.display === 'flex';
    if (isOpen) {
      closeCategoryNav();
      return;
    }

    categoryNav.hidden = false;
    categoryNav.style.display = 'flex';
    menuToggleButton.setAttribute('aria-expanded', 'true');
  });

  categoryNavItems.forEach((item) => {
    item.addEventListener('click', () => {
      const targetId = item.getAttribute('data-target');
      if (!targetId) {
        return;
      }

      const target = document.getElementById(targetId);
      if (!target || !menuContent) {
        return;
      }

      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      closeCategoryNav();
    });
  });

  document.addEventListener('click', (event) => {
    if (!categoryNav || !menuToggleButton) {
      return;
    }

    const clickedNode = event.target;
    if (!(clickedNode instanceof Node)) {
      return;
    }

    if (categoryNav.contains(clickedNode) || menuToggleButton.contains(clickedNode)) {
      return;
    }

    closeCategoryNav();
  });

  cartCloseButton?.addEventListener('click', (event) => {
    event.preventDefault();
    closeCartPanel();
  });
  cartOverlay?.addEventListener('click', closeCartPanel);

  // Always start from the menu list view, not an opened cart state.
  closeCartPanel();
  window.addEventListener('pageshow', closeCartPanel);

  renderCart();

  function extractItem(card) {
    const name = card.querySelector('.menu-name')?.textContent?.trim();
    const priceText = card.querySelector('.menu-price')?.textContent?.trim() ?? '';
    const price = Number(priceText.replace(/[^0-9]/g, ''));
    const tags = extractTags(card);

    if (!name || Number.isNaN(price)) {
      return null;
    }

    return { name, price, tags };
  }

  function extractTags(card) {
    const raw = card.querySelector('.menu-tags')?.textContent?.trim() ?? '';
    if (!raw) {
      return [];
    }

    return raw
      .split('・')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  function collectOrderByQuantities() {
    const nextItems = [];
    menuCards.forEach((card) => {
      const item = extractItem(card);
      const quantity = getCardQuantity(card);
      if (item && quantity > 0) {
        for (let i = 0; i < quantity; i += 1) {
          nextItems.push(item);
        }
      }
    });
    return nextItems;
  }

  function clearAllCardQuantities() {
    menuCards.forEach((card) => {
      setCardQuantity(card, 0);
    });
  }

  function setupQuantityControl(card) {
    const control = document.createElement('div');
    control.className = 'qty-control';
    control.innerHTML = `
      <button type="button" class="qty-btn qty-minus" aria-label="1つ減らす">-</button>
      <span class="qty-value">0</span>
      <button type="button" class="qty-btn qty-plus" aria-label="1つ増やす">+</button>
    `;
    card.appendChild(control);

    const minus = control.querySelector('.qty-minus');
    const plus = control.querySelector('.qty-plus');

    setCardQuantity(card, 0);

    minus?.addEventListener('click', (event) => {
      event.stopPropagation();
      const next = Math.max(0, getCardQuantity(card) - 1);
      setCardQuantity(card, next);
    });

    plus?.addEventListener('click', (event) => {
      event.stopPropagation();
      const next = getCardQuantity(card) + 1;
      setCardQuantity(card, next);
    });
  }

  function getCardQuantity(card) {
    const value = Number(card.dataset.qty ?? '0');
    return Number.isNaN(value) ? 0 : value;
  }

  function setCardQuantity(card, value) {
    const quantity = Math.max(0, value);
    card.dataset.qty = String(quantity);
    const view = card.querySelector('.qty-value');
    if (view) {
      view.textContent = String(quantity);
    }
    card.classList.toggle('has-qty', quantity > 0);
    updateCartCount();
  }

  function renderCart() {
    renderHistoryItems();
    updateCartCount();
  }

  function updateCartCount() {
    if (!cartCount) {
      return;
    }
    const total = menuCards.reduce((sum, card) => sum + getCardQuantity(card), 0);
    cartCount.textContent = String(total);
  }

  function renderHistoryItems() {
    if (!historyList || !historyEmpty || !historyTotal) {
      return;
    }

    historyList.innerHTML = '';

    if (checkoutHistory.length === 0) {
      historyEmpty.hidden = false;
      historyList.hidden = true;
      historyTotal.textContent = '累計: 0円';
      return;
    }

    historyEmpty.hidden = true;
    historyList.hidden = false;

    checkoutHistory.forEach((history) => {
      const li = document.createElement('li');
      li.className = 'history-row';
      const detailText = Array.isArray(history.items) && history.items.length > 0
        ? history.items.map((item) => `${item.name}×${item.count}`).join(' / ')
        : `${history.itemCount ?? 0}点`;
      li.innerHTML = `
        <p class="history-meta">
          <span>${history.at}</span>
          <span>${formatYen(history.total)}</span>
        </p>
        <p class="history-items">${detailText}</p>
      `;
      historyList.appendChild(li);
    });

    const total = checkoutHistory.reduce((sum, history) => sum + history.total, 0);
    historyTotal.textContent = `累計: ${formatYen(total)}`;
  }

  function openCartPanel() {
    if (!cartPanel || !cartOverlay) {
      return;
    }

    cartPanel.hidden = false;
    cartOverlay.hidden = false;
    cartPanel.style.display = 'flex';
    cartOverlay.style.display = 'block';
    document.body.classList.add('modal-open');
  }

  function closeCartPanel() {
    if (!cartPanel || !cartOverlay) {
      return;
    }

    cartPanel.hidden = true;
    cartOverlay.hidden = true;
    cartPanel.style.display = 'none';
    cartOverlay.style.display = 'none';
    document.body.classList.remove('modal-open');
  }

  function renderOrderModal() {
    if (!orderList || !orderEmpty || !orderTotal) {
      return;
    }

    const grouped = Object.values(groupByName(cartItems));
    orderList.innerHTML = '';

    if (grouped.length === 0) {
      orderList.hidden = true;
      orderEmpty.hidden = false;
      orderTotal.textContent = '合計: 0円';
      return;
    }

    orderList.hidden = false;
    orderEmpty.hidden = true;

    grouped.forEach((row) => {
      const li = document.createElement('li');
      li.className = 'order-row';
      li.innerHTML = `<span>${row.name} × ${row.count}</span><span>${formatYen(row.subtotal)}</span>`;
      orderList.appendChild(li);
    });

    const total = cartItems.reduce((sum, item) => sum + item.price, 0);
    orderTotal.textContent = `合計: ${formatYen(total)}`;
  }

  function openOrderModal() {
    if (!orderModal || !orderOverlay) {
      return;
    }

    orderModal.hidden = false;
    orderOverlay.hidden = false;
    orderModal.style.display = 'block';
    orderOverlay.style.display = 'block';
    document.body.classList.add('modal-open');
  }

  function closeOrderModal() {
    if (!orderModal || !orderOverlay) {
      return;
    }

    orderModal.hidden = true;
    orderOverlay.hidden = true;
    orderModal.style.display = 'none';
    orderOverlay.style.display = 'none';
    document.body.classList.remove('modal-open');
  }

  function closeCategoryNav() {
    if (!categoryNav || !menuToggleButton) {
      return;
    }

    categoryNav.style.display = 'none';
    categoryNav.hidden = true;
    menuToggleButton.setAttribute('aria-expanded', 'false');
  }

  function load(key) {
    try {
      const value = localStorage.getItem(key);
      if (!value) {
        return [];
      }

      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }

  function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function groupByName(items) {
    return items.reduce((acc, item) => {
      if (!acc[item.name]) {
        acc[item.name] = { name: item.name, count: 0, subtotal: 0 };
      }

      acc[item.name].count += 1;
      acc[item.name].subtotal += item.price;
      return acc;
    }, {});
  }

  function formatYen(value) {
    return `${value.toLocaleString('ja-JP')}円`;
  }
}

function isReloadNavigation() {
  const navEntries = performance.getEntriesByType('navigation');
  if (Array.isArray(navEntries) && navEntries.length > 0) {
    return navEntries[0].type === 'reload';
  }

  // Fallback for older Navigation Timing API.
  return typeof performance.navigation !== 'undefined' && performance.navigation.type === 1;
}
