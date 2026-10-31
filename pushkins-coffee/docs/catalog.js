// Меню общее для витрины и сервера. После изменения цен обновите оба размещения.
export const shop = {
  name: 'PUSHKINS COFFEE', currency: 'RUB', locale: 'ru-RU',
  address: 'Адрес кофейни уточняется', hours: 'Часы работы уточняются',
  apiUrl: '', // URL развёрнутого Worker, без / на конце. Пусто = деморежим.
  supportUrl: '', // Например https://t.me/your_support
};
export const categories = [
  { id: 'all', name: 'Всё меню' }, { id: 'coffee', name: 'Кофе' },
  { id: 'cold', name: 'Холодные' }, { id: 'tea', name: 'Не кофе' },
  { id: 'bakery', name: 'Выпечка' },
];
const milk = [{ id: 'regular', name: 'Обычное', extra: 0 }, { id: 'oat', name: 'Овсяное', extra: 60 }, { id: 'coconut', name: 'Кокосовое', extra: 60 }];
export const products = [
  { id: 'cappuccino', name: 'Капучино', category: 'coffee', description: 'Эспрессо и нежная молочная пена. Тот самый баланс.', tag: 'Любимый', art: 'cup', color: '#e9dfd0', image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=700&q=85', sizes: [{ id: '250', name: '250 мл', price: 230 }, { id: '350', name: '350 мл', price: 280 }], milk },
  { id: 'latte', name: 'Латте', category: 'coffee', description: 'Больше молока, мягче вкус. Для неспешного утра.', art: 'cup', color: '#e4d8cd', image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=700&q=85', sizes: [{ id: '300', name: '300 мл', price: 260 }, { id: '400', name: '400 мл', price: 310 }], milk },
  { id: 'flat-white', name: 'Флэт уайт', category: 'coffee', description: 'Двойной эспрессо, шелковистое молоко и характер.', art: 'cup', color: '#d9ddd4', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=700&q=85', sizes: [{ id: '200', name: '200 мл', price: 260 }], milk },
  { id: 'americano', name: 'Американо', category: 'coffee', description: 'Чистый вкус нашего зерна. Ничего лишнего.', art: 'black', color: '#ddd8cc', sizes: [{ id: '200', name: '200 мл', price: 180 }, { id: '300', name: '300 мл', price: 210 }] },
  { id: 'iced-latte', name: 'Айс-латте', category: 'cold', description: 'Эспрессо, прохладное молоко и много льда.', tag: 'Освежает', art: 'iced', color: '#dedfd4', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=700&q=85', sizes: [{ id: '400', name: '400 мл', price: 310 }], milk },
  { id: 'cocoa', name: 'Какао', category: 'tea', description: 'Густой шоколадный вкус и немного детства.', art: 'cup', color: '#ead8c9', sizes: [{ id: '300', name: '300 мл', price: 250 }], milk },
  { id: 'tea', name: 'Облепиховый чай', category: 'tea', description: 'Облепиха, апельсин и мёд. Согревает изнутри.', art: 'tea', color: '#eedfbc', sizes: [{ id: '400', name: '400 мл', price: 290 }] },
  { id: 'croissant', name: 'Круассан', category: 'bakery', description: 'Хрустящая корочка, воздушные слои и сливочное масло.', tag: 'К кофе', art: 'bakery', color: '#e6dccb', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=700&q=85', sizes: [{ id: 'one', name: '1 шт. · 70 г', price: 190 }] },
];
export const money = value => new Intl.NumberFormat(shop.locale, { style: 'currency', currency: shop.currency, maximumFractionDigits: 0 }).format(value);
export function resolveLine(line) {
  const product = products.find(p => p.id === line.productId);
  const size = product?.sizes.find(s => s.id === line.sizeId);
  const selectedMilk = product?.milk?.find(m => m.id === line.milkId);
  if (!product || !size || (product.milk ? !selectedMilk : line.milkId !== 'none') || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 20) throw new Error('Проверьте состав заказа');
  return { ...line, name: product.name, details: [size.name, selectedMilk?.name].filter(Boolean).join(' · '), unitPrice: size.price + (selectedMilk?.extra || 0) };
}
