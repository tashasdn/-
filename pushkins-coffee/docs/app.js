import { shop, products, categories, money, resolveLine, milkExtra, syrups, lineKey } from './catalog.js';
import { illustration } from './illustrations.js';
const $ = s => document.querySelector(s);
const tg = window.Telegram?.WebApp;
const live = Boolean(shop.apiUrl);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const keyOf = lineKey;
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
function imageFor(p, className = 'product-image') { return `<img class="${className}" src="${esc(illustration(p.art, products.indexOf(p)))}" alt="${esc(p.name)}" loading="lazy">`; }
$('#hero-cups').innerHTML = ['250','350','450','600'].map((size,i) => `<div class="cup-size"><img src="${esc(illustration('cup',i))}" alt=""><b>${size}</b></div>`).join('');
$('#extras-cup').src = illustration('cup',1);
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3200); }
function haptic() { try { tg?.HapticFeedback?.impactOccurred('light'); } catch {} }
function showDialog(id) { const d = $(id); if (!d.open) d.showModal(); if (tg?.isVersionAtLeast?.('6.1')) tg.BackButton.show(); }
function closeDialog(d) { d.close(); }
for (const dialog of document.querySelectorAll('dialog')) {
  dialog.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeDialog(dialog); else if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeDialog(dialog); } });
  dialog.addEventListener('close', () => { if (!document.querySelector('dialog[open]')) tg?.BackButton?.hide(); });
}
tg?.ready(); tg?.expand();
try { tg?.setHeaderColor('#ffffff'); tg?.setBackgroundColor('#ffffff'); tg?.BackButton?.onClick(() => document.querySelector('dialog[open]')?.close()); } catch {}
$('#demo-bar').hidden = live;
$('#year').textContent = new Date().getFullYear();
function renderMenu() {
  $('#categories').innerHTML = categories.map(c => `<button class="category" data-category="${c.id}" aria-pressed="${category === c.id}">${c.name}</button>`).join('');
  const list = products.filter(p => (category === 'all' || p.category === category) && `${p.name} ${p.description}`.toLocaleLowerCase('ru').includes(query));
  $('#products').innerHTML = categories.filter(c => c.id !== 'all').map(c => {
    const group = list.filter(p => p.category === c.id);
    if (!group.length) return '';
    return `<section class="menu-group" aria-label="${esc(c.name)}"><div class="group-heading"><h3>${esc(c.name)}</h3><span>${c.id === 'coffee' ? '250 / 350 / 450 / 600 МЛ' : c.id === 'sweet' ? '450 МЛ СЛАДКОГО СЧАСТЬЯ' : c.id === 'bakery' ? 'КОЕ-ЧТО К КОФЕ' : 'ВЫБИРАЙ ЛЮБИМОЕ'}</span></div><div class="product-grid">${group.map(p => `<article class="product-card"><button class="product-image-button" data-product="${p.id}" aria-label="Выбрать ${esc(p.name)}">${imageFor(p)}</button><div class="product-info"><h4><button class="product-title" data-product="${p.id}">${esc(p.name)}</button></h4>${p.description ? `<p class="description">${esc(p.description)}</p>` : ''}<div class="menu-price-row"><span class="volume">${p.sizes.map(s => s.name.replace(' мл','')).join(' / ')}${p.sizes[0].name.includes('мл') ? ' мл' : ''}</span><span class="dots"></span><span class="price">${p.sizes.length > 1 ? 'от ' : ''}${money(p.sizes[0].price)}</span></div></div><button class="add-button" data-product="${p.id}" aria-label="Добавить ${esc(p.name)}">+</button></article>`).join('')}</div></section>`;
  }).join('');
  $('#no-results').hidden = list.length > 0;
}
$('#categories').addEventListener('click', e => { const b = e.target.closest('[data-category]'); if (b) { category = b.dataset.category; renderMenu(); } });
$('#search').addEventListener('input', e => { query = e.target.value.trim().toLocaleLowerCase('ru'); renderMenu(); });
$('#products').addEventListener('click', e => { const b = e.target.closest('[data-product]'); if (b) openProduct(b.dataset.product); });
function openProduct(id) {
  currentProduct = products.find(p => p.id === id);
  const p = currentProduct;
  $('#product-detail').innerHTML = `${imageFor(p, 'detail-image')}<form class="detail-body" id="product-form"><h2>${esc(p.name)}</h2>${p.description ? `<p>${esc(p.description)}</p>` : ''}<fieldset class="option-group"><legend>${p.sizes[0].name.includes('шт.') ? 'Порция' : 'Объём'}</legend><div class="options">${p.sizes.map((s,i) => `<label class="option"><input type="radio" name="size" value="${s.id}" ${i === 0 ? 'checked' : ''}>${s.name}<small>${money(s.price)}</small></label>`).join('')}</div></fieldset>${p.milk ? `<fieldset class="option-group"><legend>На каком молоке?</legend><div class="options">${p.milk.map((m,i) => `<label class="option"><input type="radio" name="milk" value="${m.id}" ${i === 0 ? 'checked' : ''}>${m.name}<small data-milk-price="${m.id}"></small></label>`).join('')}</div></fieldset>` : ''}${p.syrup ? `<fieldset class="option-group"><legend>Сироп <small>+60 ₽</small></legend><select name="syrup" class="syrup-select" aria-label="Сироп">${syrups.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></fieldset>` : ''}${p.shot ? '<label class="shot-option"><input type="checkbox" name="extraShot">Ещё эспрессо<span>+80 ₽</span></label>' : ''}<button class="primary wide" type="submit"><span>Добавить в заказ</span><span id="detail-price"></span></button></form>`;
  const form = $('#product-form');
  const getLine = () => resolveLine({ productId:p.id, sizeId:form.elements.size.value, milkId:form.elements.milk?.value || 'none', syrupId:form.elements.syrup?.value || 'none', extraShot:form.elements.extraShot?.checked || false, quantity:1 });
  const updatePrice = () => {
    $('#detail-price').textContent = money(getLine().unitPrice);
    for (const el of form.querySelectorAll('[data-milk-price]')) { const extra = milkExtra(el.dataset.milkPrice,form.elements.size.value); el.textContent = extra ? '+ ' + money(extra) : 'Включено'; }
  };
  form.addEventListener('change', updatePrice); updatePrice();
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
  pending = { requestId: crypto.randomUUID(), payload: { items: cart.map(({ productId, sizeId, milkId, syrupId, extraShot, quantity }) => ({ productId, sizeId, milkId, syrupId, extraShot, quantity })), pickup, comment }, snapshot: cart.map(l => ({...l})) };
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
  $('#shop-info').innerHTML = `<p><strong>Самовывоз</strong><br>${esc(shop.address)}<br>${esc(shop.hours)}</p><hr class="info-rule"><p>Выберите напитки и выпечку, добавьте пожелания и оплатите заказ внутри Telegram. Покажите номер заказа бариста при получении.</p>${shop.supportUrl && /^https:\/\/t\.me\//.test(shop.supportUrl) ? `<p><a href="${esc(shop.supportUrl)}" target="_blank" rel="noopener noreferrer">Связаться с кофейней ↗</a></p>` : ''}${live ? '' : '<div class="notice"><strong>Сейчас это демонстрационная витрина.</strong>Меню и цены перенесены из меню кофейни. Адрес, часы работы и онлайн-оплата будут добавлены перед запуском.</div>'}`;
  showDialog('#info-dialog');
}
$('#info-button').onclick = showInfo; $('#about-button').onclick = showInfo;
renderMenu(); updateCart();
