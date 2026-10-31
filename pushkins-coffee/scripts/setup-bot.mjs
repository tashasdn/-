// Запуск: node --env-file=backend/.env scripts/setup-bot.mjs
const { BOT_TOKEN, WEBHOOK_SECRET, API_URL, APP_URL } = process.env;
if (![BOT_TOKEN, WEBHOOK_SECRET, API_URL, APP_URL].every(Boolean)) throw new Error('Заполните BOT_TOKEN, WEBHOOK_SECRET, API_URL, APP_URL');
for (const url of [API_URL, APP_URL]) if (new URL(url).protocol !== 'https:') throw new Error('Нужны HTTPS URL');
for (const [method, data] of [
  ['setWebhook', { url: API_URL.replace(/\/$/, '') + '/telegram/webhook', secret_token: WEBHOOK_SECRET, allowed_updates: ['message','pre_checkout_query'] }],
  ['setChatMenuButton', { menu_button: { type: 'web_app', text: 'Заказать кофе', web_app: { url: APP_URL } } }],
]) {
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: AbortSignal.timeout(15000) });
  const result = await response.json();
  if (!result.ok) throw new Error(`Не удалось выполнить ${method}. Проверьте настройки в BotFather.`);
  console.log(`${method}: OK`);
}
