import { createHmac, timingSafeEqual } from 'node:crypto';
import { resolveLine, lineKey } from '../docs/catalog.js';
export class AppError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
export function authenticate(initData, botToken, now = Date.now()) {
  if (!initData || initData.length > 12000) throw new AppError('Откройте приложение заново в Telegram.', 401);
  const params = new URLSearchParams(initData);
  if (new Set(params.keys()).size !== [...params.keys()].length) throw new AppError('Некорректная авторизация.', 401);
  const hash = params.get('hash'); params.delete('hash');
  if (!/^[a-f0-9]{64}$/i.test(hash || '')) throw new AppError('Некорректная авторизация.', 401);
  const text = [...params].sort(([a],[b]) => a < b ? -1 : a > b ? 1 : 0).map(([k,v]) => `${k}=${v}`).join('\n');
  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const actual = createHmac('sha256', secret).update(text).digest();
  if (!timingSafeEqual(actual, Buffer.from(hash, 'hex'))) throw new AppError('Некорректная авторизация.', 401);
  const age = now / 1000 - Number(params.get('auth_date'));
  if (!params.get('auth_date') || !Number.isFinite(age) || age < -30 || age > 3600) throw new AppError('Сессия истекла. Откройте приложение заново.', 401);
  let user;
  try { user = JSON.parse(params.get('user')); } catch { throw new AppError('Нет данных пользователя.', 401); }
  if (!Number.isSafeInteger(user?.id) || user.id <= 0) throw new AppError('Нет данных пользователя.', 401);
  return user;
}
export function priceOrder(input) {
  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 30) throw new AppError('В заказе должно быть от 1 до 30 позиций.');
  if (!['soon','30','60'].includes(input.pickup)) throw new AppError('Выберите время самовывоза.');
  if (typeof input.comment !== 'string' || input.comment.length > 300) throw new AppError('Комментарий слишком длинный.');
  let lines;
  try { lines = input.items.map(l => resolveLine({ productId: l.productId, sizeId: l.sizeId, milkId: l.milkId, syrupId: l.syrupId, extraShot: l.extraShot, quantity: l.quantity })); } catch { throw new AppError('Меню обновилось. Проверьте заказ.'); }
  const keys = lines.map(lineKey);
  if (new Set(keys).size !== keys.length || lines.reduce((s,l) => s + l.quantity, 0) > 50) throw new AppError('Слишком большой заказ или повторяющиеся позиции.');
  const amount = lines.reduce((s,l) => s + l.quantity * l.unitPrice * 100, 0);
  return { lines, amount, pickup: input.pickup, comment: input.comment.trim() };
}
export function paymentMatches(order, payment, userId) {
  return Boolean(order && order.user_id === userId && order.id === payment.invoice_payload && order.amount === payment.total_amount && payment.currency === 'RUB');
}
export function checkRequestId(id) { if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id || '')) throw new AppError('Некорректный номер заказа.'); }
