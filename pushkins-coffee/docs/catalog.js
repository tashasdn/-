// Данные перенесены из меню PUSHKIN’S COFFEE. Обновляйте витрину и сервер вместе.
export const shop = {
  name: 'PUSHKIN’S COFFEE', currency: 'RUB', locale: 'ru-RU',
  address: 'Адрес кофейни уточняется', hours: 'Часы работы уточняются',
  apiUrl: '', // HTTPS-адрес API. Пустая строка = деморежим.
  supportUrl: '',
};
export const categories = [
  { id: 'all', name: 'Всё меню' }, { id: 'coffee', name: 'Кофе классика' },
  { id: 'sweet', name: 'Сладкий кофе' }, { id: 'tea', name: 'Не кофе' },
  { id: 'bakery', name: 'Street food' }, { id: 'drinks', name: 'Напитки' },
];
const milk = [
  { id: 'regular', name: 'Обычное' }, { id: 'lactose-free', name: 'Безлактозное' },
  { id: 'banana', name: 'Банановое' }, { id: 'oat', name: 'Овсяное' },
  { id: 'almond', name: 'Миндальное' }, { id: 'coconut', name: 'Кокосовое' },
];
export const milkExtra = (milkId, sizeId) => milkId === 'regular' || milkId === 'none' ? 0 : ({ '250': 40, '350': 50, '450': 60, '600': 80 }[sizeId] || 0);
export const syrups = [
  { id: 'none', name: 'Без сиропа' }, { id: 'salted-caramel', name: 'Солёная карамель' },
  { id: 'ginger-cookie', name: 'Имбирное печенье' }, { id: 'almond-cookie', name: 'Миндальное печенье' },
  { id: 'caramel', name: 'Карамель' }, { id: 'eucalyptus-mint', name: 'Эвкалипт-мята' },
  { id: 'amaretto', name: 'Амаретто' }, { id: 'almond', name: 'Миндаль' },
  { id: 'maple', name: 'Кленовый' }, { id: 'hazelnut', name: 'Лесной орех' },
  { id: 'vanilla', name: 'Ваниль' }, { id: 'coconut', name: 'Кокос' },
  { id: 'raspberry', name: 'Малина' }, { id: 'chocolate', name: 'Шоколад' },
  { id: 'orange', name: 'Апельсин' }, { id: 'pumpkin', name: 'Тыква' },
  { id: 'peach', name: 'Персик' }, { id: 'lavender', name: 'Лаванда' },
];
const sizes = prices => Object.entries(prices).map(([id,price]) => ({ id, name: id === 'one' ? '1 шт.' : id === 'two' ? '2 шт.' : `${id} мл`, price }));
const item = (id,name,category,prices,options = {}) => ({ id,name,category,sizes:sizes(prices),description:'',color:'#fff6dc',art:'cup',...options });
const milky = { milk, syrup:true, shot:true };
export const products = [
  item('cappuccino','Капучино','coffee',{250:230,350:280,450:330,600:380},{...milky,description:'Эспрессо, молоко и нежная пена.',tag:'Классика'}),
  item('latte','Латте','coffee',{250:230,350:280,450:330,600:380},{...milky,description:'Мягкий молочный кофе на каждый день.'}),
  item('flat-white','Флэт-уайт','coffee',{250:250,350:300},{...milky,description:'Насыщенный кофе с молоком.'}),
  item('americano','Американо','coffee',{250:190,350:210,450:260},{art:'black',syrup:true,shot:true,description:'Классический чёрный кофе.'}),
  item('cappuccino-strong','Капучино стронг','coffee',{450:420,600:470},{...milky,description:'Ваш капучино с более ярким характером.'}),
  item('espresso','Двойной эспрессо','coffee',{40:190},{art:'black',syrup:true,shot:true,description:'40 мл чистого кофейного вкуса.'}),
  item('raf-coconut','Раф кокосовый','sweet',{450:350},{...milky,description:'Сладкий кофе с кокосовым вкусом.'}),
  item('raf-lavender','Раф лаванда','sweet',{450:350},{...milky,description:'Кофейная пауза с лавандовым настроением.'}),
  item('raf-vanilla','Раф ванильный','sweet',{450:350},{...milky,description:'Сладкая ванильная классика.'}),
  item('raf-citrus','Раф цитрусовый','sweet',{450:350},{...milky,description:'Кофе с ярким цитрусовым акцентом.'}),
  item('raf-urbech','Раф урбеч','sweet',{450:380},{...milky,description:'Насыщенный сладкий кофе.'}),
  item('raf-halva','Раф с халвой','sweet',{450:370},{...milky,description:'Любимый кофе со вкусом халвы.'}),
  item('mocco','Мокко','sweet',{450:310},{...milky,description:'Когда хочется кофе и шоколада.'}),
  item('cocoa','Какао','tea',{250:220,350:250,450:290,600:340},{milk,syrup:true,description:'Шоколадное настроение в вашем стакане.'}),
  item('tea','Чай облепиха–апельсин','tea',{350:250,600:430},{art:'tea',description:'Яркий фруктовый чай.'}),
  item('tea-lemon','Чай лимон–имбирь','tea',{350:250,600:430},{art:'tea',description:'Согревающий цитрусовый вкус.'}),
  item('tea-mango','Чай манго–маракуйя','tea',{350:250,600:430},{art:'tea',description:'Тропическое настроение.'}),
  item('tea-leaf','Чай листовой','tea',{350:250,600:430},{art:'tea',description:'Ваш любимый чай. Сорт уточните в комментарии.'}),
  item('bumble','Бамбл','tea',{350:430},{art:'iced',description:'Кофе с апельсиновым настроением.'}),
  item('matcha','Матча-латте','tea',{250:260,350:320,450:360},{milk,syrup:true,art:'matcha',description:'Матча и молоко — мягкое сочетание.'}),
  item('fresh','Фреш апельсиновый','tea',{350:400},{art:'juice',description:'Апельсиновая пауза в течение дня.'}),
  item('croissant','Круассан классик','bakery',{one:190},{art:'bakery',description:'Тот самый спутник к кофе.'}),
  item('croissant-chocolate','Круассан шоколад','bakery',{one:230},{art:'bakery',description:'Круассан с шоколадным настроением.'}),
  item('croissant-almond','Круассан миндаль','bakery',{one:230},{art:'bakery',description:'Круассан с миндальным вкусом.'}),
  item('hot-dog','Хот-дог','bakery',{one:300},{art:'hotdog',description:'Перекус по пути.'}),
  item('sandwich','Сэндвич','bakery',{one:350},{art:'sandwich',description:'К кофе, когда хочется подкрепиться.'}),
  item('cake','Кекс','bakery',{one:350},{art:'cake'}),
  item('wafer','Трубочки со сгущёнкой','bakery',{one:110},{art:'wafer'}),
  item('chocolate','Шоколадки в ассортименте','bakery',{one:120},{art:'chocolate',description:'Вкус уточните в комментарии к заказу.'}),
  item('cookies','Печенье','bakery',{two:50},{art:'cookies',description:'Две штуки к любимому напитку.'}),
  item('water-still','Вода без газа','drinks',{one:130},{art:'bottle'}),
  item('water-sparkling','Вода с газом','drinks',{one:130},{art:'bottle'}),
  item('juice','Сок в ассортименте','drinks',{one:130},{art:'juice-box',description:'Вкус уточните в комментарии к заказу.'}),
  item('adrenaline','Адреналин','drinks',{one:210},{art:'can'}),
  item('monster','Монстер (energy)','drinks',{one:300},{art:'can'}),
  item('redbull-250','Ред Булл','drinks',{250:210},{art:'can'}),
  item('redbull-330','Ред Булл','drinks',{330:260},{art:'can'}),
];
export const money = value => new Intl.NumberFormat(shop.locale, { style:'currency', currency:shop.currency, maximumFractionDigits:0 }).format(value);
export const lineKey = l => `${l.productId}:${l.sizeId}:${l.milkId}:${l.syrupId || 'none'}:${l.extraShot ? 1 : 0}`;
export function resolveLine(line) {
  const product = products.find(p => p.id === line.productId);
  const size = product?.sizes.find(s => s.id === line.sizeId);
  const selectedMilk = product?.milk?.find(m => m.id === line.milkId);
  const syrupId = line.syrupId ?? 'none';
  const syrup = syrups.find(s => s.id === syrupId);
  const extraShot = line.extraShot ?? false;
  if (!product || !size || (product.milk ? !selectedMilk : line.milkId !== 'none') || !syrup || (syrupId !== 'none' && !product.syrup) || typeof extraShot !== 'boolean' || (extraShot && !product.shot) || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 20) throw new Error('Проверьте состав заказа');
  return { productId:product.id,sizeId:size.id,milkId:line.milkId,syrupId,extraShot,quantity:line.quantity,
    name:product.name, details:[size.name,selectedMilk?.name,syrupId !== 'none' ? `Сироп: ${syrup.name}` : '',extraShot ? 'Доп. эспрессо' : ''].filter(Boolean).join(' · '),
    unitPrice:size.price + (selectedMilk ? milkExtra(selectedMilk.id,size.id) : 0) + (syrupId !== 'none' ? 60 : 0) + (extraShot ? 80 : 0) };
}
