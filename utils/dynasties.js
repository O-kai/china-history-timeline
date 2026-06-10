// 朝代数据（与网页版一致）
const dynasties = [
  { name: '夏', start: -2070, end: -1600, color: '#8B7355', rgb: '139,115,85', overlap: false },
  { name: '商', start: -1600, end: -1046, color: '#A0522D', rgb: '160,82,45', overlap: false },
  { name: '西周', start: -1046, end: -771, color: '#6B8E23', rgb: '107,142,35', overlap: false },
  { name: '东周', start: -770, end: -256, color: '#556B2F', rgb: '85,107,47', overlap: false },
  { name: '秦', start: -221, end: -207, color: '#2F4F4F', rgb: '47,79,79', overlap: false },
  { name: '西汉', start: -202, end: 8, color: '#4682B4', rgb: '70,130,180', overlap: false },
  { name: '新', start: 9, end: 23, color: '#5F9EA0', rgb: '95,158,160', overlap: true },
  { name: '东汉', start: 25, end: 220, color: '#4682B4', rgb: '70,130,180', overlap: false },
  { name: '三国', start: 220, end: 280, color: '#8B4513', rgb: '139,69,19', overlap: true },
  { name: '西晋', start: 265, end: 316, color: '#DAA520', rgb: '218,165,32', overlap: true },
  { name: '东晋十六国', start: 317, end: 420, color: '#B8860B', rgb: '184,134,11', overlap: true },
  { name: '南北朝', start: 420, end: 589, color: '#696969', rgb: '105,105,105', overlap: true },
  { name: '隋', start: 581, end: 618, color: '#CD853F', rgb: '205,133,63', overlap: true },
  { name: '唐', start: 618, end: 906, color: '#DC143C', rgb: '220,20,60', overlap: false },
  { name: '五代十国', start: 907, end: 959, color: '#8B8682', rgb: '139,134,130', overlap: true },
  { name: '北宋', start: 960, end: 1127, color: '#9370DB', rgb: '147,112,219', overlap: false },
  { name: '南宋', start: 1127, end: 1279, color: '#7B68EE', rgb: '123,104,238', overlap: false },
  { name: '辽', start: 907, end: 1125, color: '#8B6914', rgb: '139,105,20', overlap: true },
  { name: '金', start: 1115, end: 1234, color: '#BDB76B', rgb: '189,183,107', overlap: true },
  { name: '西夏', start: 1038, end: 1227, color: '#9ACD32', rgb: '154,205,50', overlap: true },
  { name: '元', start: 1271, end: 1368, color: '#4169E1', rgb: '65,105,225', overlap: false },
  { name: '明', start: 1368, end: 1644, color: '#B22222', rgb: '178,34,34', overlap: false },
  { name: '清', start: 1644, end: 1912, color: '#DAA520', rgb: '218,165,32', overlap: false },
  { name: '民国', start: 1912, end: 1949, color: '#3CB371', rgb: '60,179,113', overlap: false },
  { name: '新中国', start: 1949, end: 2026, color: '#FF4500', rgb: '255,69,0', overlap: false }
];

function getDynastyAtYear(y) {
  const covering = dynasties.filter(d => y >= d.start && y <= d.end);
  if (covering.length === 0) {
    if (y < -2070) return '夏';
    if (y > 2026) return '新中国';
    return '';
  }
  const main = covering.filter(d => !d.overlap);
  if (main.length > 0) {
    const starting = main.filter(d => d.start === y);
    if (starting.length > 0) return starting[0].name;
    main.sort((a, b) => (a.end - a.start) - (b.end - b.start));
    return main[0].name;
  }
  covering.sort((a, b) => (a.end - a.start) - (b.end - b.start));
  return covering[0].name;
}

function getDynastyObj(name) {
  return dynasties.find(d => d.name === name);
}

function formatDynastyYears(d) {
  const fmtY = y => y < 0 ? '前' + Math.abs(y) : '' + y;
  return fmtY(d.start) + '-' + fmtY(d.end);
}

module.exports = { dynasties, getDynastyAtYear, getDynastyObj, formatDynastyYears };
