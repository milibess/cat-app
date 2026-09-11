// ========================================================
// localStorage を使ったデータ管理レイヤー
// 将来 IndexedDB や外部APIに差し替えやすいよう、
// 呼び出し側は db.js の関数だけを使う。
// ========================================================

const CATS_KEY = 'uchineko_cats_v1';
const DIARY_KEY = 'uchineko_diary_v1';
const MAX_CATS = 3;
const MAX_DIARY = 30;

export const ACCENT_COLORS = [
  '#D8A46E', // テラコッタ
  '#8FA98B', // セージグリーン
  '#A98FB0', // くすみパープル
  '#7FA3B0', // ダスティブルー
  '#C98F8F', // ローズ
  '#BFA15E', // マスタード
];

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (e) {
    console.warn('storage read error', key, e);
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn('storage write error', key, e);
    return false;
  }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ---------------- 猫プロフィール ---------------- */

export function getCats() {
  return readJSON(CATS_KEY, []);
}

export function getCat(id) {
  return getCats().find((c) => c.id === id) || null;
}

export function canAddCat() {
  return getCats().length < MAX_CATS;
}

export function saveCat(cat) {
  const cats = getCats();
  if (cat.id) {
    const idx = cats.findIndex((c) => c.id === cat.id);
    if (idx >= 0) {
      cats[idx] = { ...cats[idx], ...cat };
    } else {
      cats.push(cat);
    }
  } else {
    cat.id = uid();
    cat.createdAt = Date.now();
    cats.push(cat);
  }
  writeJSON(CATS_KEY, cats);
  return cat;
}

export function deleteCat(id) {
  const cats = getCats().filter((c) => c.id !== id);
  writeJSON(CATS_KEY, cats);
  // 関連する日記は猫情報のスナップショットを保持しているため削除しない
}

/* ---------------- 猫日記（結果の保存） ---------------- */

export function getDiary() {
  return readJSON(DIARY_KEY, []);
}

export function getDiaryEntry(id) {
  return getDiary().find((d) => d.id === id) || null;
}

export function addDiaryEntry(entry) {
  const diary = getDiary();
  entry.id = uid();
  entry.createdAt = Date.now();
  diary.unshift(entry);
  if (diary.length > MAX_DIARY) diary.length = MAX_DIARY;
  writeJSON(DIARY_KEY, diary);
  return entry;
}

export function updateDiaryEntry(id, patch) {
  const diary = getDiary();
  const idx = diary.findIndex((d) => d.id === id);
  if (idx >= 0) {
    diary[idx] = { ...diary[idx], ...patch };
    writeJSON(DIARY_KEY, diary);
    return diary[idx];
  }
  return null;
}

export function toggleFavorite(id) {
  const diary = getDiary();
  const idx = diary.findIndex((d) => d.id === id);
  if (idx >= 0) {
    diary[idx].favorite = !diary[idx].favorite;
    writeJSON(DIARY_KEY, diary);
    return diary[idx].favorite;
  }
  return false;
}

export function deleteDiaryEntry(id) {
  const diary = getDiary().filter((d) => d.id !== id);
  writeJSON(DIARY_KEY, diary);
}

export function getFavorites() {
  return getDiary().filter((d) => d.favorite);
}
