import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { authenticate, priceOrder, paymentMatches } from './core.mjs';
const token = '123:test-token';
const now = 1793448000000;
function signed(fields = {}, signingToken = token) {
  const values = { auth_date: String(now / 1000), user: JSON.stringify({ id: 123, first_name: 'Гость' }), signature: 'test-signature', ...fields };
  const params = new URLSearchParams(values);
  const secret = createHmac('sha256', 'WebAppData').update(signingToken).digest();
  params.set('hash', createHmac('sha256', secret).update(Object.keys(values).sort().map(k => `${k}=${values[k]}`).join('\n')).digest('hex'));
  return params.toString();
}
const base = () => ({ items: [{ productId: 'cappuccino', sizeId: '350', milkId: 'oat', quantity: 2, unitPrice: 1 }], pickup: 'soon', comment: '' });
test('valid Telegram signature with signature field authenticates user', () => assert.equal(authenticate(signed(), token, now).id, 123));
test('changed user, wrong token, expired and future sessions are rejected', () => {
  assert.throws(() => authenticate(signed().replace('123%2C', '124%2C'), token, now));
  assert.throws(() => authenticate(signed({}, 'wrong'), token, now));
  assert.throws(() => authenticate(signed({ auth_date: String(now/1000 - 3601) }), token, now));
  assert.throws(() => authenticate(signed({ auth_date: String(now/1000 + 90) }), token, now));
  assert.throws(() => authenticate(signed() + '&auth_date=0', token, now));
});
test('server prices size, milk and quantity independently of client price', () => { const order = priceOrder(base()); assert.equal(order.amount, 66000); assert.equal(order.lines[0].unitPrice, 330); });
test('invalid product, milk, quantity and duplicate lines are rejected', () => {
  for (const change of [{ productId: 'fake' },{ sizeId: '999' },{ milkId: 'none' },{ quantity: -1 },{ quantity: 1.5 },{ quantity: 21 }]) { const b = base(); Object.assign(b.items[0],change); assert.throws(() => priceOrder(b)); }
  const b = base(); b.items.push({...b.items[0]}); assert.throws(() => priceOrder(b));
});
test('paid confirmation must match user, currency, amount and order', () => {
  const order = { id: 'order-1', user_id: 123, amount: 68000 };
  const payment = { invoice_payload: 'order-1', currency: 'RUB', total_amount: 68000 };
  assert.equal(paymentMatches(order,payment,123),true);
  for (const p of [{...payment,total_amount:1},{...payment,currency:'XTR'},{...payment,invoice_payload:'other'}]) assert.equal(paymentMatches(order,p,123),false);
  assert.equal(paymentMatches(order,payment,999),false);
});

test('menu modifiers follow cup size and preserve different recipes', () => {
  const b=base(); b.items[0].sizeId='600'; b.items[0].syrupId='vanilla'; b.items[0].extraShot=true;
  assert.equal(priceOrder(b).amount,120000); // (380 + 80 + 60 + 80) × 2
  b.items.push({...b.items[0],syrupId:'caramel'}); assert.equal(priceOrder(b).lines.length,2);
  b.items[0].syrupId='fake'; assert.throws(()=>priceOrder(b));
});
test('menu includes 37 items and all published cappuccino sizes', async () => {
  const {products}=await import('../docs/catalog.js'); assert.equal(products.length,37);
  assert.deepEqual(products.find(p=>p.id==='cappuccino').sizes.map(s=>[s.id,s.price]),[['250',230],['350',280],['450',330],['600',380]]);
});
