import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { AppError, authenticate, priceOrder, paymentMatches, checkRequestId } from './core.mjs';

const { BOT_TOKEN, PROVIDER_TOKEN, WEBHOOK_SECRET, FRONTEND_ORIGIN, ADMIN_CHAT_ID } = process.env;
for (const [key,value] of Object.entries({ BOT_TOKEN, PROVIDER_TOKEN, WEBHOOK_SECRET, FRONTEND_ORIGIN, ADMIN_CHAT_ID, APP_URL: process.env.APP_URL })) if (!value) throw new Error(`Set ${key} in environment`);
if (!/^[A-Za-z0-9_-]{32,256}$/.test(WEBHOOK_SECRET)) throw new Error('WEBHOOK_SECRET: use 32+ random letters, digits, _ or -');
if (new URL(FRONTEND_ORIGIN).origin !== FRONTEND_ORIGIN) throw new Error('FRONTEND_ORIGIN must be an origin without a path or trailing slash');
const dbPath = process.env.DB_PATH || './data/orders.sqlite';
mkdirSync(dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec(`PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS orders (
 id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, user_name TEXT NOT NULL,
 amount INTEGER NOT NULL, details TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
 invoice_url TEXT, charge_id TEXT UNIQUE, provider_charge_id TEXT,
 notified INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, paid_at INTEGER
);
CREATE INDEX IF NOT EXISTS orders_user_time ON orders(user_id, created_at);`);
const orderById = id => db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
async function telegram(method, body) {
  let response;
  try { response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(6500) }); } catch { throw new AppError('Telegram временно недоступен. Попробуйте ещё раз.', 503); }
  const data = await response.json();
  if (!data.ok) { console.error('Telegram API rejected method:', method, 'code:', data.error_code); throw new AppError('Не удалось выполнить запрос к Telegram. Обратитесь в кофейню.', 502); }
  return data.result;
}
async function readJSON(req) {
  let size = 0; const chunks = [];
  for await (const chunk of req) { size += chunk.length; if (size > 32768) throw new AppError('Слишком большой запрос.', 413); chunks.push(chunk); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new AppError('Некорректный JSON.'); }
}
async function createOrder(user, input) {
  checkRequestId(input.requestId);
  let order = orderById(input.requestId);
  if (order && order.user_id !== user.id) throw new AppError('Заказ не найден.', 404);
  if (!order) {
    const details = priceOrder(input);
    const count = db.prepare('SELECT COUNT(*) AS n FROM orders WHERE user_id = ? AND created_at > ?').get(user.id, Date.now() - 3600000).n;
    if (count >= 20) throw new AppError('Слишком много заказов. Обратитесь в кофейню.', 429);
    db.prepare('INSERT INTO orders(id,user_id,user_name,amount,details,created_at) VALUES (?,?,?,?,?,?)').run(input.requestId, user.id, String(user.first_name || 'Гость').slice(0,128), details.amount, JSON.stringify(details), Date.now());
    order = orderById(input.requestId);
  }
  if (order.status === 'paid') return { status: 'paid', id: order.id };
  // Повтор запроса использует сохранённый заказ и сумму: сетевой сбой не создаёт второй заказ.
  if (!order.invoice_url) {
    const details = JSON.parse(order.details);
    const invoiceUrl = await telegram('createInvoiceLink', {
      title: 'PUSHKINS COFFEE', description: `Самовывоз · ${order.id.slice(0,8).toUpperCase()} · ` + details.lines.map(l => `${l.name} × ${l.quantity}`).join(', ').slice(0,180),
      payload: order.id, provider_token: PROVIDER_TOKEN, currency: 'RUB', prices: [{ label: 'Заказ в PUSHKINS COFFEE', amount: order.amount }],
      // Параметры фискализации зависят от договора с провайдером.
      // Перед запуском добавьте provider_data и нужные поля чека по документации вашего эквайринга.
    });
    db.prepare('UPDATE orders SET invoice_url = COALESCE(invoice_url, ?) WHERE id = ?').run(invoiceUrl, order.id);
    order = orderById(order.id);
  }
  return { id: order.id, status: order.status, invoiceUrl: order.invoice_url };
}
async function notifyOrder(order) {
  const details = JSON.parse(order.details);
  const pickup = { soon: 'Как можно скорее', '30': 'Примерно через 30 минут', '60': 'Примерно через час' }[details.pickup];
  const text = `☕ Оплачен заказ ${order.id.slice(0,8).toUpperCase()}\n${order.user_name} · Telegram ID ${order.user_id}\n\n${details.lines.map(l => `${l.name} · ${l.details} × ${l.quantity} — ${l.unitPrice * l.quantity} ₽`).join('\n')}\n\nИтого: ${order.amount / 100} ₽\nСамовывоз: ${pickup}\nКомментарий: ${details.comment || '—'}`;
  await telegram('sendMessage', { chat_id: ADMIN_CHAT_ID, text });
  db.prepare('UPDATE orders SET notified = 1 WHERE id = ?').run(order.id);
}
async function webhook(update) {
  if (update.pre_checkout_query) {
    const q = update.pre_checkout_query, order = orderById(q.invoice_payload);
    const ok = order?.status === 'pending' && paymentMatches(order, q, q.from.id);
    await telegram('answerPreCheckoutQuery', { pre_checkout_query_id: q.id, ok, ...(ok ? {} : { error_message: 'Заказ уже оплачен или его данные не совпадают. Свяжитесь с кофейней.' }) });
  }
  const payment = update.message?.successful_payment;
  if (payment) {
    let order = orderById(payment.invoice_payload);
    if (!paymentMatches(order, payment, update.message.from?.id)) throw new AppError('Payment mismatch', 400);
    if (order.status === 'pending') {
      db.prepare("UPDATE orders SET status = 'paid', charge_id = ?, provider_charge_id = ?, paid_at = ? WHERE id = ? AND status = 'pending'").run(payment.telegram_payment_charge_id, payment.provider_payment_charge_id, Date.now(), order.id);
      order = orderById(order.id);
    }
    // При ошибке доставки Telegram повторит webhook; статус оплаты уже сохранён.
    // Редкий сбой между sendMessage и UPDATE может повторить уведомление, но не заказ.
    if (!order.notified) await notifyOrder(order);
  }
  const message = update.message;
  if (message?.text?.match(/^\/start(?:\s|$)/)) {
    await telegram('sendMessage', { chat_id: message.chat.id, text: 'Добро пожаловать в PUSHKINS COFFEE! Выберите любимый кофе и заберите с собой.', reply_markup: { inline_keyboard: [[{ text: 'Открыть меню ☕', web_app: { url: process.env.APP_URL } }]] } });
  }
}
const server = createServer(async (req,res) => {
  const origin = req.headers.origin;
  const send = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(data)); };
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname === '/telegram/webhook' && req.method === 'POST') {
      const received = String(req.headers['x-telegram-bot-api-secret-token'] || '');
      if (Buffer.byteLength(received) !== Buffer.byteLength(WEBHOOK_SECRET) || !timingSafeEqual(Buffer.from(received), Buffer.from(WEBHOOK_SECRET))) throw new AppError('Forbidden', 403);
      await webhook(await readJSON(req)); send(200, { ok: true }); return;
    }
    if (origin !== FRONTEND_ORIGIN) throw new AppError('Origin denied', 403);
    res.setHeader('Access-Control-Allow-Origin', FRONTEND_ORIGIN);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    const auth = req.headers.authorization || '';
    const user = authenticate(auth.startsWith('tma ') ? auth.slice(4) : '', BOT_TOKEN);
    if (url.pathname === '/orders' && req.method === 'POST') { send(200, await createOrder(user, await readJSON(req))); return; }
    const match = /^\/orders\/([a-f0-9-]+)$/i.exec(url.pathname);
    if (match && req.method === 'GET') { checkRequestId(match[1]); const order = orderById(match[1]); if (!order || order.user_id !== user.id) throw new AppError('Заказ не найден.', 404); send(200, { id: order.id, status: order.status }); return; }
    throw new AppError('Не найдено.', 404);
  } catch (error) { if (!(error instanceof AppError)) console.error('Request failed:', error.name); send(error.status || 500, { error: error instanceof AppError ? error.message : 'Временная ошибка сервера. Попробуйте ещё раз.' }); }
});
server.requestTimeout = 30000;
server.listen(Number(process.env.PORT || 8787), process.env.HOST || '127.0.0.1', () => console.log('PUSHKINS API is running'));
