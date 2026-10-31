import { shop, products, categories, money, resolveLine } from './catalog.js';
const $ = s => document.querySelector(s);
const tg = window.Telegram?.WebApp;
const live = Boolean(shop.apiUrl);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const keyOf = l => `${l.productId}:${l.sizeId}:${l.milkId}`;
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Работаем и без localStorage. */ } };
let cart = [];
for (const line of (Array.isArray(read('pushkins-cart', [])) ? read('pushkins-cart', []) : []).slice(0, 50)) {
  try { const valid = resolveLine(line); const old = cart.find(l => keyOf(l) === keyOf(valid)); if (old) old.quantity = Math.min(20, old.quantity + valid.quantity); else cart.push(valid); } catch { /* Удалённые позиции не восстанавливаем. */ }
}
let pending = read('pushkins-pending', null);
if (!pending?.requestId || !pending?.payload || !Array.isArray(pending.payload.items)) pending = null;
let category = 'all', query = '', toastTimer, currentProduct, busy = false, polling = false;
let pickup = 'soon', comment = '';
function fallback(product) {
  const drink = product.art === 'black' ? '#3d251b' : product.art === 'tea' ? '#c58725' : '#b77d4f';
  const inside = product.art === 'bakery'
    ? '<g transform="rotate(-17 160 130)"><path d="M62 146Q69 89 113 89L147 116 122 169Q82 184 62 146M258 146Q251 89 207 89L173 116 198 169Q238 184 258 146" fill="#ba742e"/><path d="M104 107Q159 47 216 107L195 171Q157 189 125 170Z" fill="#da9e50" stroke="#ab6a30" stroke-width="3"/><path d="m129 86 14 90m38-91-7 93m-24-99 11 100" stroke="#f2c982" stroke-width="6"/></g>'
    : `<ellipse cx="160" cy="206" rx="87" ry="13" fill="#000" opacity=".08"/><ellipse cx="158" cy="167" rx="101" ry="55" fill="#eee9dd"/><path d="M212 103c61-7 62 66 6 59" fill="none" stroke="#f6f3eb" stroke-width="15"/><path d="M88 103h139l-13 70q-55 49-113 0Z" fill="#faf7ed"/><ellipse cx="157" cy="104" rx="69" ry="34" fill="#fff9eb"/><ellipse cx="157" cy="103" rx="59" ry="27" fill="${drink}"/>${['black','tea'].includes(product.art) ? '' : '<path d="M158 119c-49-19-27-42-7-22 8-25 46-9 7 22" fill="#f2e7cf"/><path d="m158 119-4-24" stroke="#ba895e" stroke-width="2"/>'}<text x="157" y="160" text-anchor="middle" fill="#344b3b" font-family="Georgia" font-size="13">PUSHKINS</text>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 270"><rect width="320" height="270" fill="${product.color}"/>${inside}</svg>`);
}
function imageFor(p, className = 'product-image') { return `<img class="${className}" src="${esc(p.image || fallback(p))}" data-product-image="${esc(p.id)}" alt="${esc(p.name)}" loading="lazy">`; }
document.addEventListener('error', e => { const p = products.find(p => p.id === e.target.dataset?.productImage); if (p && e.target.src !== fallback(p)) e.target.src = fallback(p); }, true);
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3200); }
function haptic() { try { tg?.HapticFeedback?.impactOccurred('light'); } catch {} }
function showDialog(id) { const d = $(id); if (!d.open) d.showModal(); if (tg?.isVersionAtLeast?.('6.1')) tg.BackButton.show(); }
function closeDialog(d) { d.close(); }
for (const dialog of document.querySelectorAll('dialog')) {
  dialog.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeDialog(dialog); else if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeDialog(dialog); } });
  dialog.addEventListener('close', () => { if (!document.querySelector('dialog[open]')) tg?.BackButton?.hide(); });
}
tg?.ready(); tg?.expand();
try { tg?.setHeaderColor('#f6f3eb'); tg?.setBackgroundColor('#f6f3eb'); tg?.BackButton?.onClick(() => document.querySelector('dialog[open]')?.close()); } catch {}
$('#demo-bar').hidden = live;
$('#year').textContent = new Date().getFullYear();
function renderMenu() {
  $('#categories').innerHTML = categories.map(c => `<button class="category" data-category="${c.id}" aria-pressed="${category === c.id}">${c.name}</button>`).join('');
  const list = products.filter(p => (category === 'all' || p.category === category) && `${p.name} ${p.description}`.toLocaleLowerCase('ru').includes(query));
  $('#products').innerHTML = list.map(p => `<article class="product-card" style="--card-color:${p.color}"><button class="product-image-button" data-product="${p.id}" aria-label="Выбрать ${esc(p.name)}">${imageFor(p)}${p.tag ? `<span class="tag">${esc(p.tag)}</span>` : ''}</button><h3><button class="product-title" data-product="${p.id}">${esc(p.name)}</button></h3><p class="description">${esc(p.description)}</p><div class="product-bottom"><div><div class="price">${p.sizes.length > 1 ? 'от ' : ''}${money(p.sizes[0].price)}</div><div class="volume">${p.sizes[0].name}</div></div><button class="add-button" data-product="${p.id}" aria-label="Добавить ${esc(p.name)}">+</button></div></article>`).join('');
  $('#no-results').hidden = list.length > 0;
}
$('#categories').addEventListener('click', e => { const b = e.target.closest('[data-category]'); if (b) { category = b.dataset.category; renderMenu(); } });
$('#search').addEventListener('input', e => { query = e.target.value.trim().toLocaleLowerCase('ru'); renderMenu(); });
$('#products').addEventListener('click', e => { const b = e.target.closest('[data-product]'); if (b) openProduct(b.dataset.product); });
function openProduct(id) {
  currentProduct = products.find(p => p.id === id);
  const p = currentProduct;
  $('#product-detail').innerHTML = `${imageFor(p, 'detail-image')}<form class="detail-body" id="product-form"><h2>${esc(p.name)}</h2><p>${esc(p.description)}</p><fieldset class="option-group"><legend>${p.category === 'bakery' ? 'Порция' : 'Объём'}</legend><div class="options">${p.sizes.map((s,i) => `<label class="option"><input type="radio" name="size" value="${s.id}" ${i === 0 ? 'checked' : ''}>${s.name}<small>${money(s.price)}</small></label>`).join('')}</div></fieldset>${p.milk ? `<fieldset class="option-group"><legend>Молоко</legend><div class="options">${p.milk.map((m,i) => `<label class="option"><input type="radio" name="milk" value="${m.id}" ${i === 0 ? 'checked' : ''}>${m.name}<small>${m.extra ? '+ ' + money(m.extra) : 'Включено'}</small></label>`).join('')}</div></fieldset>` : ''}<button class="primary wide" type="submit"><span>Добавить в заказ</span><span id="detail-price"></span></button></form>`;
  const form = $('#product-form');
  const getLine = () => resolveLine({ productId: p.id, sizeId: form.elements.size.value, milkId: form.elements.milk?.value || 'none', quantity: 1 });
  form.addEventListener('change', () => { $('#detail-price').textContent = money(getLine().unitPrice); });
  $('#detail-price').textContent = money(getLine().unitPrice);
  form.addEventListener('submit', e => { e.preventDefault(); const l = getLine(); const existing = cart.find(x => keyOf(x) === keyOf(l)); if (existing?.quantity >= 20) return toast('Не более 20 одинаковых позиций'); if (existing) existing.quantity++; else cart.push(l); updateCart(); haptic(); closeDialog($('#product-dialog')); toast(`${p.name} — в вашем заказе`); });
  showDialog('#product-dialog');
}
function updateCart() {
  save('pushkins-cart', cart);
  $('#cart-count').textContent = cart.reduce((s,l) => s + l.quantity, 0);
  $('#cart-total').textContent = money(cart.reduce((s,l) => s + l.unitPrice * l.quantity, 0));
  $('#cart-button').hidden = cart.length === 0 && !pending;
  if (pending) $('#cart-total').textContent = 'К оплате';
}
function renderCart() {
  if (pending) { renderPending(); return; }
  if (!cart.length) { $('#cart-content').innerHTML = '<div class="empty">Ваша кофейная пауза ещё впереди.<br>Добавьте что-нибудь вкусное из меню.</div>'; return; }
  $('#cart-content').innerHTML = `<div>${cart.map((l,i) => `<div class="cart-line">${imageFor(products.find(p => p.id === l.productId), 'cart-thumb')}<div class="line-text"><strong>${esc(l.name)}</strong><small>${esc(l.details)}</small></div><div class="line-actions"><b>${money(l.unitPrice * l.quantity)}</b><div class="quantity"><button data-quantity="${i}" data-delta="-1" aria-label="Уменьшить количество ${esc(l.name)}">−</button><span>${l.quantity}</span><button data-quantity="${i}" data-delta="1" aria-label="Увеличить количество ${esc(l.name)}">+</button></div></div></div>`).join('')}</div><form id="checkout-form"><label class="checkout-label" for="pickup">Заберу с собой</label><select id="pickup" class="checkout-field"><option value="soon">Как можно скорее</option><option value="30">Примерно через 30 минут</option><option value="60">Примерно через час</option></select><p class="pickup-note">${esc(shop.address)}<br>Время приготовления подтвердит кофейня.</p><label class="checkout-label" for="comment">Пожелания к заказу</label><textarea id="comment" class="checkout-field" maxlength="300" placeholder="Например: без сахара, пожалуйста">${esc(comment)}</textarea><div class="total-row"><span>Итого</span><span>${money(cart.reduce((s,l) => s + l.unitPrice * l.quantity, 0))}</span></div><button class="primary wide" id="pay-button" type="submit"><span>${live ? 'Перейти к оплате' : 'Посмотреть демозаказ'}</span><span>→</span></button><p class="payment-note">${live ? 'Оплата откроется в защищённом окне Telegram.' : 'Это демонстрация. Деньги не списываются, заказ не отправляется.'}</p></form>`;
  $('#pickup').value = pickup;
  $('#pickup').addEventListener('change', e => { pickup = e.target.value; });
  $('#comment').addEventListener('input', e => { comment = e.target.value; });
  $('#checkout-form').addEventListener('submit', e => { e.preventDefault(); checkout(); });
}
$('#cart-content').addEventListener('click', e => { const b = e.target.closest('[data-quantity]'); if (!b) return; const line = cart[Number(b.dataset.quantity)]; if (!line) return; const next = line.quantity + Number(b.dataset.delta); if (next > 20) return toast('Не более 20 одинаковых позиций'); line.quantity = next; cart = cart.filter(l => l.quantity > 0); updateCart(); renderCart(); haptic(); });
$('#cart-button').addEventListener('click', () => { renderCart(); showDialog('#cart-dialog'); });
async function api(path, options = {}) {
  if (!tg?.initData) throw new Error('Откройте приложение через кнопку меню вашего Telegram-бота.');
  const response = await fetch(shop.apiUrl.replace(/\/$/, '') + path, { ...options, headers: { 'Content-Type': 'application/json', Authorization: 'tma ' + tg.initData }, signal: AbortSignal.timeout(20000) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Не удалось связаться с кофейней. Попробуйте ещё раз.');
  return data;
}
async function checkout() {
  if (busy) return;
  if (!live) {
    $('#cart-content').innerHTML = `<div class="order-state"><div class="order-symbol">☕</div><div class="eyebrow" style="justify-content:center">ДЕМОНСТРАЦИЯ</div><h2>Так будет выглядеть<br>ваша кофейная пауза</h2><p>${cart.reduce((s,l) => s + l.quantity, 0)} поз. · ${money(cart.reduce((s,l) => s + l.unitPrice * l.quantity, 0))}</p><div class="notice"><strong>Заказ не отправлен и не оплачен.</strong>После подключения оплаты здесь появится счёт Telegram, а кофейня получит ваш заказ.</div><button class="primary wide" id="demo-back">Вернуться к заказу <span>→</span></button></div>`;
    $('#demo-back').onclick = renderCart; return;
  }
  if (!tg?.initData) return toast('Для оплаты откройте приложение внутри Telegram');
  pending = { requestId: crypto.randomUUID(), payload: { items: cart.map(({ productId, sizeId, milkId, quantity }) => ({ productId, sizeId, milkId, quantity })), pickup, comment }, snapshot: cart.map(l => ({...l})) };
  save('pushkins-pending', pending); updateCart(); renderPending();
  await createInvoice();
}
function renderPending(message = '') {
  $('#cart-content').innerHTML = `<div class="order-state"><div class="order-symbol">↗</div><h2>Осталось оплатить</h2><p>Заказ ${esc(pending.requestId.slice(0,8).toUpperCase())}<br>Кофейня начнёт готовить после подтверждения оплаты.</p>${message ? `<div class="notice" role="status">${esc(message)}</div>` : ''}<button class="primary wide" id="continue-payment">${pending.invoiceUrl ? 'Продолжить оплату' : 'Получить счёт'} <span>→</span></button><button class="retry-status" id="check-payment">Проверить статус оплаты</button><p class="payment-note">Счёт сохраняется при закрытии приложения.<br>Не создавайте повторный заказ, если деньги уже списались.</p></div>`;
  $('#continue-payment').onclick = () => pending.invoiceUrl ? openInvoice() : createInvoice();
  $('#check-payment').onclick = () => checkStatus(true);
}
async function createInvoice() {
  if (busy || !pending) return;
  busy = true; $('#continue-payment').disabled = true;
  try {
    const data = await api('/orders', { method: 'POST', body: JSON.stringify({ ...pending.payload, requestId: pending.requestId }) });
    if (data.status === 'paid') { completeOrder(); return; }
    pending.invoiceUrl = data.invoiceUrl; save('pushkins-pending', pending); renderPending(); openInvoice();
  } catch (error) { renderPending(error.message); } finally { busy = false; if ($('#continue-payment')) $('#continue-payment').disabled = false; }
}
function openInvoice() {
  if (!pending?.invoiceUrl) return;
  try { tg.openInvoice(pending.invoiceUrl, status => { if (status === 'paid' || status === 'pending') checkStatus(false); else renderPending(status === 'cancelled' ? 'Вы закрыли окно оплаты. Можно продолжить, когда будете готовы.' : 'Оплата не прошла. Попробуйте ещё раз.'); }); } catch { renderPending('Не удалось открыть счёт. Обновите Telegram и попробуйте снова.'); }
}
async function checkStatus(manual) {
  if (polling || !pending) return;
  polling = true;
  try {
    for (let i = 0; i < (manual ? 1 : 8); i++) {
      const result = await api('/orders/' + pending.requestId);
      if (result.status === 'paid') { completeOrder(); return; }
      if (!manual) await new Promise(resolve => setTimeout(resolve, 1800));
    }
    if (pending && $('#cart-dialog').open) renderPending('Подтверждение оплаты ещё не получено. Если вы оплатили заказ, проверьте статус чуть позже.');
  } catch (error) { if (pending) renderPending(error.message); } finally { polling = false; }
}
function completeOrder() {
  const id = pending.requestId.slice(0,8).toUpperCase();
  for (const paidLine of pending.snapshot || []) { const l = cart.find(x => keyOf(x) === keyOf(paidLine)); if (l) l.quantity -= paidLine.quantity; }
  cart = cart.filter(l => l.quantity > 0); pending = null; save('pushkins-pending', null); comment = ''; updateCart();
  $('#cart-content').innerHTML = `<div class="order-state"><div class="order-symbol">✓</div><div class="eyebrow" style="justify-content:center">ОПЛАТА ПОДТВЕРЖДЕНА</div><h2>Спасибо за заказ!</h2><p>Ваш номер: <b>${id}</b><br>Покажите его бариста, когда придёте.<br>${esc(shop.address)}</p><p>Время готовности уточните в кофейне.</p><button class="primary wide" data-close>Вернуться в меню <span>→</span></button></div>`;
}
function showInfo() {
  $('#shop-info').innerHTML = `<p><strong>Самовывоз</strong><br>${esc(shop.address)}<br>${esc(shop.hours)}</p><hr class="info-rule"><p>Выберите напитки и выпечку, добавьте пожелания и оплатите заказ внутри Telegram. Покажите номер заказа бариста при получении.</p>${shop.supportUrl && /^https:\/\/t\.me\//.test(shop.supportUrl) ? `<p><a href="${esc(shop.supportUrl)}" target="_blank" rel="noopener noreferrer">Связаться с кофейней ↗</a></p>` : ''}${live ? '' : '<div class="notice"><strong>Сейчас это демонстрационная витрина.</strong>Меню и цены примерные. Адрес, часы работы и онлайн-оплата будут добавлены перед запуском.</div>'}`;
  showDialog('#info-dialog');
}
$('#info-button').onclick = showInfo; $('#about-button').onclick = showInfo;
renderMenu(); updateCart();
