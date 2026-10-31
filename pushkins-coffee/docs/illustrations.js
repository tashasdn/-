// Векторные иллюстрации в стиле печатного меню, без внешних изображений.
const ink = '#191713', gold = '#ffbb22';
export function illustration(art = 'cup', variant = 0) {
  let shapes = '';
  const start = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><g stroke="${ink}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">`;
  if (['cup','black','tea','matcha','iced','juice'].includes(art)) {
    const fill = art === 'matcha' ? '#a8b76c' : ['tea','juice'].includes(art) ? '#eab152' : '#c58e54';
    shapes = `<g transform="rotate(${variant % 2 ? 5 : -5} 120 120)"><path d="M71 66 84 204Q121 217 157 204L170 66Z" fill="#fffdf6"/><path d="m76 103 8 68q37 14 76 0l8-68q-48 9-92 0Z" fill="${fill}"/><path d="M69 66Q119 55 171 65L173 81Q121 89 67 81Z" fill="#faf6e9"/><path d="m78 64 4-16q39-14 79 0l3 16Z" fill="${art === 'black' ? '#575d58' : '#d1a46a'}"/><path d="m87 54 63-1" fill="none" stroke="#f4daaf" stroke-width="3"/><path d="m89 88 7 106" stroke="#fff" stroke-width="3" opacity=".7"/><path d="M115 119c-14-14-27 7 6 23 30-23 10-37-6-23Z" fill="${variant % 2 ? '#ffbdd0' : gold}" stroke-width="2.5"/><text x="123" y="158" text-anchor="middle" fill="${ink}" stroke="none" font-family="Comic Sans MS,cursive" font-size="13" font-weight="bold">Coffee</text><path d="M97 188q22 7 43 0" fill="none" stroke-width="2"/></g>`;
    if (art === 'iced') shapes += '<path d="m141 48 15-34" fill="none"/><path d="m94 105 17 5-4 18-18-5m45 13 15 4-5 15-14-4" fill="#fff6" stroke="#fff" stroke-width="2"/>';
  } else if (art === 'bakery') {
    shapes = `<g transform="rotate(-15 120 120)"><path d="M32 146Q24 98 63 82l38 47-18 47q-34 15-51-30Zm176 0q8-48-31-64l-38 47 18 47q34 15 51-30Z" fill="#c77931"/><path d="M59 91Q119 33 181 91l-18 84q-40 30-83 0Z" fill="#e5a24d"/><path d="m85 72 15 112m42-111-9 116m-26-123 12 123" fill="none" stroke="#8a4b1d" stroke-width="4"/><path d="m73 95 14 68m66-73-8 78m-32-87 9 83" stroke="#ffda85" stroke-width="8"/><path d="m43 116 20 38m128-37-17 37" stroke="#efa952" stroke-width="6"/></g>`;
  } else if (art === 'sandwich') {
    shapes = '<path d="m32 142 120-37 65 50-124 53Z" fill="#dca849"/><path d="m34 132 30-12 14 8 21-20 18 8 15-20 26 11 17-6 35 30-24 26-27-2-21 22-30-8-19 18-32-17Z" fill="#8ebd50"/><path d="m40 113 111-36 64 54-122 42Z" fill="#b83229"/><path d="m36 100 117-43 66 55-126 45Z" fill="#f0ca79"/><path d="m66 95 46 37m-17-49 48 35m-18-47 49 34" fill="none" stroke="#a87934" stroke-width="6"/><path d="m35 74-9-10m159-13 8-11m30 97 10 3m-118 86 3 10" fill="none"/>';
  } else if (art === 'hotdog') {
    shapes = '<g transform="rotate(-30 120 120)"><rect x="30" y="83" width="183" height="83" rx="41" fill="#e4ae56"/><rect x="17" y="107" width="201" height="37" rx="18" fill="#b56530"/><path d="M53 93q13-24 31-17h101q25 5 26 34l-4 19H56Z" fill="#f4cf80"/><path d="M75 97c-12 23 39 7 27 30s42 7 29-14 35-28 47-4" fill="none" stroke="#bd3528" stroke-width="7"/></g>';
  } else if (art === 'bottle') {
    shapes = `<path d="M100 50h40v35l22 27v95q-40 18-81 0v-95l19-27Z" fill="#d5e9ed"/><rect x="98" y="36" width="44" height="20" rx="4" fill="${gold}"/><path d="M82 132h80v46H82Z" fill="#fff"/><path d="m102 153 9 7 16-17" fill="none"/><path d="M94 111v15m0 61v12" stroke="#fff" stroke-width="6"/>`;
  } else if (art === 'can' || art === 'juice-box') {
    shapes = `<rect x="72" y="45" width="97" height="169" rx="${art === 'can' ? '16' : '3'}" fill="${gold}"/><path d="M73 64h94M73 196h94" fill="none"/><path d="m120 96-19 35h21l-7 39 31-48h-23l15-26Z" fill="#fff"/><path d="m87 80 1 98" stroke="#fff" stroke-width="4"/>`;
    if (art === 'juice-box') shapes += '<path d="m142 46 4-29 22-8" fill="none"/>';
  } else if (art === 'cookies') {
    shapes = '<circle cx="90" cy="133" r="53" fill="#dca864"/><circle cx="152" cy="101" r="53" fill="#ebbf7e"/><path d="m139 76 7 3m29 18 5-3m-39 32 5-1m-60-4 5 4m-25 24 6 2m36-2 2 7m29-64 2 4" stroke="#5b3a22" stroke-width="9"/>';
  } else if (art === 'wafer') {
    shapes = '<g transform="rotate(-25 120 120)"><path d="M40 95h151v43H40Z" fill="#dbaa5b"/><ellipse cx="191" cy="116" rx="13" ry="22" fill="#fff1cf"/><path d="m58 95 25 43m7-43 25 43m8-43 25 43m7-43 25 43" stroke="#a57636" stroke-width="3"/></g>';
  } else if (art === 'chocolate') {
    shapes = `<g transform="rotate(-15 120 120)"><rect x="63" y="38" width="111" height="169" rx="4" fill="#71462e"/><path d="M64 88h110M64 137h110m-55-98v166" fill="none" stroke="#42291c" stroke-width="6"/><path d="m59 141 119-18v88H59Z" fill="${gold}"/><path d="m87 163 15 12 32-26" fill="none"/></g>`;
  } else {
    shapes = `<path d="m70 116 15 88h73l15-88" fill="${gold}"/><path d="M65 119q-12-33 18-40-1-33 36-29 31-21 43 16 33 6 24 38l-15 17Z" fill="#b77e42"/><path d="m98 135 5 55m38-55-3 55" fill="none"/><path d="m104 81 3 2m35-7 3 2m15 20 3 2" stroke="#5c3b21" stroke-width="7"/>`;
  }
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(start + shapes + '</g></svg>');
}
