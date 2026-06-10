// 人口数据（与网页版一致，单位：百万人）
const POP_DATA = [
  { year: -2000, pop: 13 }, { year: -1500, pop: 15 }, { year: -1000, pop: 20 }, { year: -800, pop: 20 },
  { year: -600, pop: 20 }, { year: -400, pop: 25 }, { year: -221, pop: 20 }, { year: -202, pop: 16 },
  { year: -1, pop: 59 }, { year: 57, pop: 21 }, { year: 105, pop: 53 }, { year: 157, pop: 56 },
  { year: 220, pop: 16 }, { year: 280, pop: 24 }, { year: 370, pop: 30 }, { year: 520, pop: 50 },
  { year: 609, pop: 46 }, { year: 705, pop: 58 }, { year: 755, pop: 80 }, { year: 820, pop: 50 },
  { year: 960, pop: 32 }, { year: 1000, pop: 55 }, { year: 1060, pop: 90 }, { year: 1120, pop: 120 },
  { year: 1200, pop: 115 }, { year: 1235, pop: 100 }, { year: 1290, pop: 75 }, { year: 1330, pop: 68 },
  { year: 1400, pop: 65 }, { year: 1450, pop: 80 }, { year: 1500, pop: 110 }, { year: 1550, pop: 140 },
  { year: 1600, pop: 150 }, { year: 1620, pop: 120 }, { year: 1660, pop: 80 }, { year: 1680, pop: 120 },
  { year: 1710, pop: 150 }, { year: 1740, pop: 180 }, { year: 1770, pop: 250 }, { year: 1790, pop: 300 },
  { year: 1810, pop: 350 }, { year: 1840, pop: 410 }, { year: 1860, pop: 380 }, { year: 1870, pop: 350 },
  { year: 1890, pop: 395 }, { year: 1910, pop: 430 }, { year: 1920, pop: 460 }, { year: 1930, pop: 480 },
  { year: 1940, pop: 510 }, { year: 1950, pop: 550 }, { year: 1955, pop: 610 }, { year: 1960, pop: 660 },
  { year: 1965, pop: 720 }, { year: 1970, pop: 800 }, { year: 1975, pop: 920 }, { year: 1980, pop: 980 },
  { year: 1985, pop: 1050 }, { year: 1990, pop: 1130 }, { year: 1995, pop: 1200 }, { year: 2000, pop: 1260 },
  { year: 2005, pop: 1300 }, { year: 2010, pop: 1340 }, { year: 2015, pop: 1370 }, { year: 2020, pop: 1400 }
];

const POP_MAX = 1500;

const POP_MILESTONES = [
  { year: -1, pop: 59, label: '西汉巅峰 ~5900万' },
  { year: 157, pop: 56, label: '东汉巅峰 ~5600万' },
  { year: 220, pop: 16, label: '三国谷底 ~1600万' },
  { year: 755, pop: 80, label: '盛唐巅峰 ~8000万' },
  { year: 1120, pop: 120, label: '北宋破亿 ~1.2亿' },
  { year: 1660, pop: 80, label: '明清之际 人口减半' },
  { year: 1790, pop: 300, label: '清朝破3亿' },
  { year: 1840, pop: 410, label: '道光4.1亿' },
  { year: 1950, pop: 550, label: '新中国5.5亿' },
  { year: 1980, pop: 980, label: '近10亿' },
  { year: 2020, pop: 1400, label: '14亿' }
];

function getPopAtYear(y) {
  if (y <= POP_DATA[0].year) return POP_DATA[0].pop;
  if (y >= POP_DATA[POP_DATA.length - 1].year) return POP_DATA[POP_DATA.length - 1].pop;
  for (let i = 1; i < POP_DATA.length; i++) {
    if (y <= POP_DATA[i].year) {
      const p = POP_DATA[i - 1], c = POP_DATA[i];
      const t = (y - p.year) / (c.year - p.year);
      return p.pop + t * (c.pop - p.pop);
    }
  }
  return POP_DATA[POP_DATA.length - 1].pop;
}

function formatPop(millions) {
  const wan = millions * 100;
  if (wan >= 10000) return (wan / 10000).toFixed(wan >= 100000 ? 0 : 1) + '亿';
  return Math.round(wan) + '万';
}

module.exports = { POP_DATA, POP_MAX, POP_MILESTONES, getPopAtYear, formatPop };
