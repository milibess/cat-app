// ========================================================
// アプリのメインコントローラ（状態管理・画面遷移・イベント処理）
// ========================================================

import {
  getCats, getCat, saveCat, deleteCat,
  getDiary, getDiaryEntry, addDiaryEntry, updateDiaryEntry, getFavorites,
  ACCENT_COLORS,
} from './db.js';
import { fileToResizedDataURL } from './photo.js';
import { PERSONALITIES, TONES, generateQuote, generateOwnerScore, generateDiagnosis, generateNews } from './quotes.js';
import {
  escapeHtml, renderTop, renderCatManage, renderCatForm,
  renderPhotoCatSelect, renderResult, renderDiary, renderFavorites,
} from './screens.js';

const ROOT_SCREENS = ['top', 'diary', 'favorites', 'catManage'];
const FALLBACK_CAT = { id: null, name: '（削除済みの猫）', color: '#D8A46E', photo: null };

const state = {
  screen: 'top',
  stack: [],
  catForm: null,
  photoFlow: { photo: null, selectedCatId: null },
  photoInputMode: 'diary', // 'diary' | 'profile'
  result: null,
  diaryFilter: 'all',
};

const appEl = document.getElementById('app');
const cameraInput = document.getElementById('cameraInput');
const albumInput = document.getElementById('albumInput');

const bottomNavEl = document.createElement('nav');
bottomNavEl.className = 'bottom-nav';
bottomNavEl.innerHTML = `
  <button data-action="root" data-screen="top"><span class="emoji">🏠</span>ホーム</button>
  <button data-action="root" data-screen="diary"><span class="emoji">📓</span>日記</button>
  <button data-action="root" data-screen="favorites"><span class="emoji">♡</span>お気に入り</button>
  <button data-action="root" data-screen="catManage"><span class="emoji">🐾</span>プロフィール</button>
`;
document.body.appendChild(bottomNavEl);

/* ---------------- 画面遷移 ---------------- */

function gotoRoot(screen) {
  state.stack = [];
  state.screen = screen;
  renderScreen();
}

function pushScreen(screen) {
  state.stack.push(state.screen);
  state.screen = screen;
  renderScreen();
}

function goBack() {
  state.screen = state.stack.pop() || 'top';
  renderScreen();
}

/* ---------------- 描画 ---------------- */

function renderHeader(title, showBack) {
  if (!showBack) {
    return `<header class="app-header no-back"><h1>${escapeHtml(title)}</h1></header>`;
  }
  return `<header class="app-header"><button class="back-btn" data-action="back" aria-label="戻る">←</button><h1>${escapeHtml(title)}</h1><span class="header-spacer"></span></header>`;
}

function renderScreen() {
  const cats = getCats();
  let html = '';

  switch (state.screen) {
    case 'top':
      html = renderTop(cats);
      break;
    case 'catManage':
      html = renderHeader('プロフィール管理', false) + renderCatManage(cats);
      break;
    case 'catForm':
      html = renderHeader(state.catForm.id ? '猫プロフィール編集' : '猫プロフィール登録', true) + renderCatForm(state.catForm, !!state.catForm.id);
      break;
    case 'photoCatSelect':
      html = renderHeader('この猫は誰？', true) + renderPhotoCatSelect(cats, state.photoFlow.photo, state.photoFlow.selectedCatId);
      break;
    case 'result': {
      const cat = getCat(state.result.catId) || FALLBACK_CAT;
      html = renderHeader('結果', true) + renderResult({ cat, result: state.result });
      break;
    }
    case 'diary':
      html = renderHeader('猫日記', false) + `<div class="screen" style="padding-top:4px">` + renderDiary(getDiary(), cats, state.diaryFilter) + `</div>`;
      break;
    case 'favorites':
      html = renderHeader('お気に入り', false) + renderFavorites(getFavorites(), cats);
      break;
    default:
      html = renderTop(cats);
  }

  appEl.innerHTML = html;
  updateBottomNav();
}

function updateBottomNav() {
  const isRoot = ROOT_SCREENS.includes(state.screen);
  bottomNavEl.style.display = isRoot ? 'flex' : 'none';
  bottomNavEl.querySelectorAll('button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.screen === state.screen);
  });
}

/* ---------------- トースト ---------------- */

let toastTimer = null;
function showToast(message) {
  let el = document.getElementById('toastEl');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toastEl';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

/* ---------------- 確認モーダル ---------------- */

function showConfirm(title, message, confirmLabel, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(message)}</p>
      <div class="btn-row">
        <button class="btn-block secondary" data-role="cancel">キャンセル</button>
        <button class="btn-block danger" data-role="confirm">${escapeHtml(confirmLabel)}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.dataset.role === 'cancel') {
      overlay.remove();
    } else if (e.target.dataset.role === 'confirm') {
      overlay.remove();
      onConfirm();
    }
  });
}

/* ---------------- 猫プロフィール ---------------- */

function openCatForm(id) {
  const cats = getCats();
  if (id) {
    const cat = getCat(id);
    if (!cat) return;
    state.catForm = { ...cat, traits: [...(cat.traits || [])] };
  } else {
    if (cats.length >= 3) {
      showToast('登録できる猫は3匹までです');
      return;
    }
    state.catForm = {
      id: null,
      name: '',
      photo: null,
      personality: PERSONALITIES[0],
      tone: TONES[0],
      traits: [],
      comment: '',
      color: ACCENT_COLORS[cats.length % ACCENT_COLORS.length],
    };
  }
  pushScreen('catForm');
}

function handleSaveCat() {
  const name = state.catForm.name.trim();
  if (!name) {
    showToast('名前を入力してください');
    return;
  }
  state.catForm.name = name;
  saveCat(state.catForm);
  showToast('プロフィールを保存しました');
  goBack();
}

function handleDeleteCat() {
  showConfirm(
    '猫を削除しますか？',
    `「${state.catForm.name}」のプロフィールを削除します。保存済みの日記は残ります。`,
    '削除する',
    () => {
      deleteCat(state.catForm.id);
      showToast('削除しました');
      goBack();
    }
  );
}

/* ---------------- 写真・結果生成 ---------------- */

function startResult(catId, photo) {
  const cat = getCat(catId);
  if (!cat) {
    showToast('猫の情報が見つかりませんでした');
    return;
  }
  const quote = generateQuote(cat);
  const diagnosis = generateDiagnosis(cat);
  const { score, comment } = generateOwnerScore(cat);
  state.result = {
    catId,
    photo,
    quote,
    diagnosis,
    score,
    scoreComment: comment,
    news: null,
    favorite: false,
    savedId: null,
  };
  pushScreen('result');
}

async function handlePhotoInputChange(e) {
  const file = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!file) return;

  try {
    const dataUrl = await fileToResizedDataURL(file);
    if (state.photoInputMode === 'profile') {
      state.catForm.photo = dataUrl;
      renderScreen();
      return;
    }
    const cats = getCats();
    if (cats.length === 1) {
      startResult(cats[0].id, dataUrl);
    } else {
      state.photoFlow = { photo: dataUrl, selectedCatId: null };
      pushScreen('photoCatSelect');
    }
  } catch (err) {
    console.error(err);
    showToast('写真の読み込みに失敗しました');
  }
}

function openDiaryEntry(id) {
  const entry = getDiaryEntry(id);
  if (!entry) return;
  state.result = {
    catId: entry.catId,
    photo: entry.photo,
    quote: entry.quote,
    diagnosis: entry.diagnosis,
    score: entry.score,
    scoreComment: entry.scoreComment,
    news: entry.news,
    favorite: entry.favorite,
    savedId: entry.id,
  };
  pushScreen('result');
}

function saveCurrentResult() {
  const r = state.result;
  const payload = {
    catId: r.catId,
    photo: r.photo,
    quote: r.quote,
    diagnosis: r.diagnosis,
    score: r.score,
    scoreComment: r.scoreComment,
    news: r.news,
    favorite: r.favorite,
  };
  if (r.savedId) {
    updateDiaryEntry(r.savedId, payload);
    showToast('日記を更新しました');
  } else {
    const saved = addDiaryEntry(payload);
    r.savedId = saved.id;
    showToast('日記に保存しました');
  }
  renderScreen();
}

/* ---------------- イベント委譲 ---------------- */

document.body.addEventListener('click', (e) => {
  const target = e.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;

  switch (action) {
    case 'root':
    case 'nav':
      gotoRoot(target.dataset.screen);
      break;

    case 'back':
      goBack();
      break;

    case 'add-cat':
      openCatForm(null);
      break;

    case 'edit-cat':
      openCatForm(target.dataset.id);
      break;

    case 'delete-cat':
      handleDeleteCat();
      break;

    case 'pick-personality':
      state.catForm.personality = target.dataset.value;
      renderScreen();
      break;

    case 'pick-tone':
      state.catForm.tone = target.dataset.value;
      renderScreen();
      break;

    case 'toggle-trait': {
      const v = target.dataset.value;
      const traits = state.catForm.traits;
      const idx = traits.indexOf(v);
      if (idx >= 0) traits.splice(idx, 1);
      else traits.push(v);
      renderScreen();
      break;
    }

    case 'pick-color':
      state.catForm.color = target.dataset.value;
      renderScreen();
      break;

    case 'profile-open-camera':
      state.photoInputMode = 'profile';
      cameraInput.click();
      break;

    case 'profile-open-album':
      state.photoInputMode = 'profile';
      albumInput.click();
      break;

    case 'save-cat':
      handleSaveCat();
      break;

    case 'open-camera':
      state.photoInputMode = 'diary';
      cameraInput.click();
      break;

    case 'open-album':
      state.photoInputMode = 'diary';
      albumInput.click();
      break;

    case 'select-photo-cat':
      state.photoFlow.selectedCatId = target.dataset.id;
      renderScreen();
      break;

    case 'confirm-photo-cat':
      if (state.photoFlow.selectedCatId) {
        startResult(state.photoFlow.selectedCatId, state.photoFlow.photo);
      }
      break;

    case 'show-news': {
      const cat = getCat(state.result.catId) || FALLBACK_CAT;
      state.result.news = generateNews(cat.name);
      renderScreen();
      break;
    }

    case 'toggle-favorite-current': {
      const r = state.result;
      r.favorite = !r.favorite;
      if (r.savedId) updateDiaryEntry(r.savedId, { favorite: r.favorite });
      renderScreen();
      break;
    }

    case 'save-result':
      saveCurrentResult();
      break;

    case 'regenerate-quote': {
      const cat = getCat(state.result.catId);
      if (!cat) {
        showToast('猫の情報が見つかりませんでした');
        return;
      }
      state.result.quote = generateQuote(cat);
      renderScreen();
      break;
    }

    case 'filter-diary':
      state.diaryFilter = target.dataset.id;
      renderScreen();
      break;

    case 'open-diary':
      openDiaryEntry(target.dataset.id);
      break;
  }
});

document.body.addEventListener('input', (e) => {
  const field = e.target.dataset.field;
  if (!field || !state.catForm) return;
  state.catForm[field] = e.target.value;
});

cameraInput.addEventListener('change', handlePhotoInputChange);
albumInput.addEventListener('change', handlePhotoInputChange);

/* ---------------- 初期化 ---------------- */

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

registerServiceWorker();
gotoRoot('top');
