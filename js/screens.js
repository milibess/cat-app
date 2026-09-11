// ========================================================
// 各画面の HTML テンプレートを返す純粋関数群。
// 状態(state)は持たず、渡された値を描画するだけ。
// ========================================================

import { ACCENT_COLORS } from './db.js';
import { PERSONALITIES, TONES, TRAITS } from './quotes.js';

const EVENT_LABELS = {
  conference: '緊急猫会議',
  trial: '飼い主裁判',
  'title-boost': '称号強化',
  'news-special': 'ニュース特番',
  'snack-crisis': 'おやつ危機',
  'boss-cat': 'ボス猫決定',
};

export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatDate(ts) {
  const d = new Date(ts);
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getMonth() + 1}月${d.getDate()}日(${days[d.getDay()]})`;
}

export function formatDateTime(ts) {
  const d = new Date(ts);
  return `${formatDate(ts)} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function avatarHtml(cat, size = 68) {
  if (cat.photo) {
    return `<img class="avatar" src="${cat.photo}" alt="${escapeHtml(cat.name)}" style="width:${size}px;height:${size}px;--cat-color:${cat.color}">`;
  }
  return `<div class="avatar placeholder" style="width:${size}px;height:${size}px;--cat-color:${cat.color}">🐱</div>`;
}

function resolveCat(cats, id) {
  return cats.find((c) => c.id === id) || { id, name: '（削除済みの猫）', color: '#D8A46E', photo: null };
}

/* ---------------- トップ画面 ---------------- */

export function renderTop(cats, playSuggestion, oneLiner, muted) {
  const chips = cats
    .map(
      (c) => `
      <button class="cat-chip" data-action="edit-cat" data-id="${c.id}">
        ${avatarHtml(c)}
        <span class="name">${escapeHtml(c.name)}</span>
      </button>`
    )
    .join('');

  const addChip =
    cats.length < 3
      ? `<button class="cat-chip add-chip" data-action="add-cat">
          <div class="avatar placeholder">＋</div>
          <span class="name">猫を追加</span>
        </button>`
      : '';

  const hasAnyCat = cats.length > 0;

  return `
    <div class="top-hero">
      <button class="sound-toggle-btn" data-action="toggle-sound" aria-label="音のON/OFF">
        ${muted ? '🔇 音OFF' : '🔊 音ON'}
      </button>
      <h1 class="app-title">うちの猫、今こう言ってます 🐾</h1>
      <p class="app-sub">写真から、今日の気持ちを聞いてみよう</p>
    </div>
    <div class="cat-strip">${chips}${addChip}</div>
    ${!hasAnyCat ? `<div class="empty-hint">まずは「猫を追加」から、猫プロフィールを登録してください🐾</div>` : ''}
    ${hasAnyCat ? `
    <div class="play-hint">
      <div class="play-suggestion"><span class="emoji">🎲</span>今日のおすすめ：${escapeHtml(playSuggestion)}</div>
      <div class="one-liner">${escapeHtml(oneLiner)}</div>
    </div>` : ''}
    <div class="action-buttons">
      <button class="btn-primary filled" data-action="open-camera" ${!hasAnyCat ? 'disabled' : ''}>
        <span class="emoji">📷</span>今撮る
      </button>
      <button class="btn-primary" data-action="open-album" ${!hasAnyCat ? 'disabled' : ''}>
        <span class="emoji">🖼️</span>写真から選ぶ
      </button>
    </div>
    <div class="quick-links">
      <button class="quick-link" data-action="root" data-screen="conferenceSelect">
        <span class="emoji">🗣️</span>猫会議
      </button>
      <button class="quick-link" data-action="root" data-screen="diary">
        <span class="emoji">📓</span>猫日記
      </button>
      <button class="quick-link" data-action="root" data-screen="favorites">
        <span class="emoji">♡</span>お気に入り
      </button>
      <button class="quick-link" data-action="root" data-screen="catManage">
        <span class="emoji">🐾</span>プロフィール
      </button>
    </div>
  `;
}

/* ---------------- 猫プロフィール管理（一覧） ---------------- */

const APP_VERSION = '2.1';

export function renderCatManage(cats) {
  if (!cats.length) {
    return `
      <div class="screen">
        <div class="empty-state">
          <span class="emoji">🐾</span>
          まだ猫が登録されていません。<br>右下の「猫を追加」から登録しましょう。
        </div>
        <button class="btn-block" data-action="add-cat">＋ 猫を追加する</button>
        <div class="app-version">Version ${APP_VERSION}</div>
      </div>
    `;
  }

  const items = cats
    .map(
      (c) => `
      <div class="cat-list-item">
        ${avatarHtml(c, 56)}
        <div class="info">
          <div class="name">${escapeHtml(c.name)}</div>
          <div class="meta">${escapeHtml(c.personality)}・${escapeHtml(c.tone)}</div>
        </div>
        <button class="edit-btn" data-action="edit-cat" data-id="${c.id}">編集</button>
      </div>`
    )
    .join('');

  return `
    <div class="screen">
      ${items}
      ${cats.length < 3 ? `<button class="btn-block secondary" data-action="add-cat">＋ 猫を追加する（あと${3 - cats.length}匹）</button>` : ''}
      <div class="app-version">Version ${APP_VERSION}</div>
    </div>
  `;
}

/* ---------------- 猫プロフィール登録・編集 ---------------- */

export function renderCatForm(form, isEdit) {
  const personalityChips = PERSONALITIES.map(
    (p) => `<button type="button" class="chip-option ${form.personality === p ? 'selected' : ''}" data-action="pick-personality" data-value="${p}">${p}</button>`
  ).join('');

  const toneChips = TONES.map(
    (t) => `<button type="button" class="chip-option ${form.tone === t ? 'selected' : ''}" data-action="pick-tone" data-value="${t}">${t}</button>`
  ).join('');

  const traitChips = TRAITS.map(
    (t) => `<button type="button" class="chip-option ${form.traits.includes(t) ? 'selected' : ''}" data-action="toggle-trait" data-value="${t}">${t}</button>`
  ).join('');

  const colorSwatches = ACCENT_COLORS.map(
    (c) => `<button type="button" class="color-swatch ${form.color === c ? 'selected' : ''}" data-action="pick-color" data-value="${c}" style="background:${c}"></button>`
  ).join('');

  const photoPreview = form.photo
    ? `<img class="preview" src="${form.photo}" alt="プロフィール写真">`
    : `<div class="preview placeholder">🐱</div>`;

  return `
    <div class="screen">
      <div class="card">
        <div class="field">
          <label>プロフィール写真</label>
          <div class="photo-picker">
            ${photoPreview}
            <div class="btn-row">
              <button type="button" class="btn-outline" data-action="profile-open-camera">📷 撮影</button>
              <button type="button" class="btn-outline" data-action="profile-open-album">🖼️ 選択</button>
            </div>
          </div>
        </div>
        <div class="field">
          <label for="catNameInput">名前</label>
          <input type="text" id="catNameInput" data-field="name" value="${escapeHtml(form.name)}" placeholder="例：もち" maxlength="12">
        </div>
      </div>

      <div class="section-title">性格</div>
      <div class="card"><div class="chip-group">${personalityChips}</div></div>

      <div class="section-title">口調</div>
      <div class="card"><div class="chip-group">${toneChips}</div></div>

      <div class="section-title">特徴（複数選択可）</div>
      <div class="card"><div class="chip-group">${traitChips}</div></div>

      <div class="section-title">アクセントカラー</div>
      <div class="card"><div class="color-swatches">${colorSwatches}</div></div>

      <div class="section-title">自由コメント（任意）</div>
      <div class="card">
        <div class="field" style="margin-bottom:0">
          <textarea data-field="comment" rows="3" placeholder="例：朝だけ甘える／掃除機が苦手／袋の音ですぐ来る" maxlength="60">${escapeHtml(form.comment)}</textarea>
        </div>
      </div>

      <button class="btn-block" data-action="save-cat">${isEdit ? '保存する' : '登録する'}</button>
      ${isEdit ? `<button class="btn-block danger" data-action="delete-cat" style="margin-top:10px">この猫を削除する</button>` : ''}
    </div>
  `;
}

/* ---------------- 写真→猫選択 ---------------- */

export function renderPhotoCatSelect(cats, photo, selectedId) {
  const items = cats
    .map(
      (c) => `
      <button class="cat-select-item ${selectedId === c.id ? 'selected' : ''}" style="--cat-color:${c.color}" data-action="select-photo-cat" data-id="${c.id}">
        ${avatarHtml(c, 54)}
        <span class="name">${escapeHtml(c.name)}</span>
      </button>`
    )
    .join('');

  return `
    <div class="screen">
      <div class="selected-photo-preview"><img src="${photo}" alt="選択した写真"></div>
      <div class="section-title">この猫は誰？</div>
      <div class="cat-select-grid">${items}</div>
      <button class="btn-block" data-action="confirm-photo-cat" ${selectedId ? '' : 'disabled'} style="margin-top:22px">この猫で決定</button>
    </div>
  `;
}

/* ---------------- 今日の称号バッジ ---------------- */

function titleBadgeHtml(title) {
  if (!title) return '';
  if (title.rare) {
    return `
      <div class="title-badge rare">
        <span class="title-badge-label">✨ 本日の称号（強化版）</span>
        <div class="title-badge-text">${escapeHtml(title.text)}</div>
        <div class="title-badge-text sub">＋ ${escapeHtml(title.text2)}</div>
      </div>`;
  }
  return `
    <div class="title-badge">
      <span class="title-badge-label">🏷️ 本日の称号</span>
      <div class="title-badge-text">${escapeHtml(title.text)}</div>
    </div>`;
}

/* ---------------- レアイベントバナー ---------------- */

function eventBannerHtml(event) {
  if (!event) return '';
  return `
    <div class="event-banner">
      <span class="event-banner-tag">${event.emoji} レアイベント発生！</span>
      <div class="event-banner-label">${escapeHtml(event.label)}</div>
    </div>`;
}

/* ---------------- 猫会議（共通パーツ） ---------------- */

function conferenceBubblesHtml(conference, cats) {
  const rows = conference.lines
    .map((line) => {
      const cat = resolveCat(cats, line.catId);
      return `
      <div class="conf-row">
        ${avatarHtml(cat, 40)}
        <div class="conf-bubble-wrap">
          <div class="conf-name" style="--cat-color:${cat.color}">${escapeHtml(cat.name)}</div>
          <div class="conf-bubble">${escapeHtml(line.text)}</div>
        </div>
      </div>`;
    })
    .join('');

  return `
    <div class="conference-theme-card">
      <span class="conference-theme-label">本日の議題</span>
      <div class="conference-theme-text">${escapeHtml(conference.theme)}</div>
    </div>
    <div class="conference-log">${rows}</div>
  `;
}

export function renderConferenceSelect(cats, selectedIds) {
  if (cats.length < 2) {
    return `<div class="screen"><div class="empty-state"><span class="emoji">🗣️</span>猫会議には猫が2匹以上必要です。<br>プロフィールを追加してください。</div></div>`;
  }

  const items = cats
    .map((c) => {
      const selected = selectedIds.includes(c.id);
      return `
      <button class="cat-select-item ${selected ? 'selected' : ''}" style="--cat-color:${c.color}" data-action="toggle-conference-cat" data-id="${c.id}">
        ${avatarHtml(c, 54)}
        <span class="name">${escapeHtml(c.name)}</span>
        ${selected ? '<span class="select-check">✓</span>' : ''}
      </button>`;
    })
    .join('');

  const count = selectedIds.length;
  const canStart = count >= 2 && count <= 3;

  return `
    <div class="screen">
      <div class="empty-hint" style="margin:0 0 18px">参加する猫を2〜3匹選んでください（${count}匹選択中）</div>
      <div class="cat-select-grid">${items}</div>
      <button class="btn-block" data-action="start-conference" style="margin-top:22px" ${canStart ? '' : 'disabled'}>会議開始</button>
    </div>
  `;
}

export function renderConferenceResult(conference, cats, savedId) {
  return `
    <div class="screen">
      ${conferenceBubblesHtml(conference, cats)}
      <div class="result-actions" style="margin-top:18px">
        <button class="icon-btn ${savedId ? 'filled' : ''}" data-action="save-conference">
          ${savedId ? '✓ 保存済み（更新する）' : '💾 保存'}
        </button>
        <button class="icon-btn" data-action="regenerate-conference">🔁 もう一回会議</button>
      </div>
    </div>
  `;
}

/* ---------------- 飼い主裁判（共通パーツ） ---------------- */

const VERDICT_CLASS = {
  '有罪': 'guilty',
  '執行猶予': 'probation',
  '無罪': 'innocent',
  '厳重注意': 'warning',
};

function trialCardHtml(trial, cats) {
  const testimonyRows = trial.testimonies
    .map((t) => {
      const cat = resolveCat(cats, t.catId);
      return `
      <div class="conf-row">
        ${avatarHtml(cat, 40)}
        <div class="conf-bubble-wrap">
          <div class="conf-name" style="--cat-color:${cat.color}">${escapeHtml(cat.name)}</div>
          <div class="conf-bubble">${escapeHtml(t.text)}</div>
        </div>
      </div>`;
    })
    .join('');

  const verdictClass = VERDICT_CLASS[trial.verdict.type] || 'warning';

  return `
    <div class="trial-card">
      <div class="trial-header">⚖️ 飼い主裁判</div>
      <div class="trial-theme">議題：${escapeHtml(trial.theme)}</div>
      <div class="conference-log">${testimonyRows}</div>
      <div class="verdict-card ${verdictClass}">
        <div class="verdict-type">判決：${escapeHtml(trial.verdict.type)}</div>
        <div class="verdict-detail">${escapeHtml(trial.verdict.detail)}</div>
      </div>
    </div>
  `;
}

/* ---------------- 結果画面 ---------------- */

export function renderResult(state) {
  const cat = state.cat;
  const r = state.result;
  const cats = state.cats || [];
  const event = r.event || null;

  const newsHtml = r.news
    ? `<div class="news-banner"><span class="news-label">NEWS</span>${escapeHtml(r.news)}</div>`
    : '';

  let eventExtraHtml = '';
  if (event) {
    if (event.type === 'conference') {
      eventExtraHtml = `<div class="event-section">${conferenceBubblesHtml(event.conference, cats)}</div>`;
    } else if (event.type === 'trial') {
      eventExtraHtml = `<div class="event-section">${trialCardHtml(event.trial, cats)}</div>`;
    } else if (event.type === 'news-special') {
      eventExtraHtml = `
        <div class="news-special-card">
          <div class="news-special-header">📺 猫ニュース特番</div>
          ${event.newsItems.map((n) => `<div class="news-special-item">${escapeHtml(n)}</div>`).join('')}
        </div>`;
    } else if (event.type === 'boss-cat') {
      const boss = resolveCat(cats, event.bossCat.id);
      eventExtraHtml = `
        <div class="boss-cat-card">
          <div class="boss-cat-header">👑 本日のボス猫</div>
          ${avatarHtml(boss, 64)}
          <div class="boss-cat-name">${escapeHtml(boss.name)}</div>
        </div>`;
    }
  }

  return `
    <div class="screen">
      ${eventBannerHtml(event)}
      <div class="result-photo">
        <img src="${r.photo}" alt="猫の写真">
        <div class="cat-tag"><span class="dot" style="--cat-color:${cat.color}"></span>${escapeHtml(cat.name)}</div>
      </div>

      <div class="speech-bubble">${escapeHtml(r.quote).replace(/\n/g, '<br>')}</div>

      ${titleBadgeHtml(r.title)}

      <div class="stat-row">
        <div class="stat-card"><div class="label">ごきげん</div><div class="value">${r.diagnosis.genki}</div></div>
        <div class="stat-card"><div class="label">甘えたい</div><div class="value">${r.diagnosis.amae}</div></div>
        <div class="stat-card"><div class="label">おやつ要求</div><div class="value">${r.diagnosis.oyatsu}</div></div>
        <div class="stat-card"><div class="label">眠気</div><div class="value">${r.diagnosis.nemuke}</div></div>
      </div>

      <div class="score-card">
        <div class="label">本日の飼い主評価</div>
        <div class="score">${r.score}<span class="unit">点</span></div>
        <div class="comment">${escapeHtml(r.scoreComment)}</div>
      </div>

      ${newsHtml}
      ${eventExtraHtml}

      <div class="result-actions">
        <button class="icon-btn" data-action="show-news">📰 猫ニュース</button>
        <button class="icon-btn ${r.favorite ? 'liked' : ''}" data-action="toggle-favorite-current">
          ${r.favorite ? '♥ お気に入り済み' : '♡ お気に入り'}
        </button>
      </div>
      <div class="result-actions">
        <button class="icon-btn ${r.savedId ? 'filled' : ''}" data-action="save-result">
          ${r.savedId ? '✓ 保存済み（更新する）' : '💾 保存'}
        </button>
        <button class="icon-btn" data-action="regenerate-quote">🔁 もう一言</button>
      </div>
    </div>
  `;
}

/* ---------------- 猫日記 ---------------- */

export function renderDiary(diary, cats, filterCatId) {
  const tabs = [
    `<button class="filter-tab ${filterCatId === 'all' ? 'active' : ''}" data-action="filter-diary" data-id="all">すべて</button>`,
    ...cats.map(
      (c) => `<button class="filter-tab ${filterCatId === c.id ? 'active' : ''}" data-action="filter-diary" data-id="${c.id}">${escapeHtml(c.name)}</button>`
    ),
  ].join('');

  const filtered = filterCatId === 'all' ? diary : diary.filter((d) => d.catId === filterCatId);

  const body = filtered.length
    ? `<div class="diary-grid">${filtered.map((d) => diaryCardHtml(d, cats)).join('')}</div>`
    : `<div class="empty-state"><span class="emoji">📓</span>まだ日記がありません。<br>写真を撮って、今日の一言を残してみましょう。</div>`;

  return `
    <div class="filter-tabs">${tabs}</div>
    ${body}
  `;
}

function diaryCardHtml(d, cats) {
  if (d.entryType === 'conference') {
    const participants = (d.participantIds || []).map((id) => resolveCat(cats, id));
    const avatars = participants.map((p) => avatarHtml(p, 32)).join('');
    const names = participants.map((p) => escapeHtml(p.name)).join('・');
    return `
      <button class="diary-card" data-action="open-diary-conference" data-id="${d.id}">
        <div class="diary-card-icon">🗣️</div>
        <div class="content">
          <div class="top-line">${names} ・ ${formatDate(d.createdAt)}</div>
          <div class="quote">議題：${escapeHtml(d.theme)}</div>
          <div class="bottom-line"><span class="diary-mini-avatars">${avatars}</span></div>
        </div>
      </button>
    `;
  }

  const cat = cats.find((c) => c.id === d.catId) || { name: '（削除済み）', color: '#D8A46E' };
  const tag = d.eventType ? `<span class="diary-event-tag">${EVENT_LABELS[d.eventType] || 'イベント'}</span>` : '';
  const titleTag = d.title ? `<span class="diary-title-tag">${escapeHtml(d.title.text)}</span>` : '';
  return `
    <button class="diary-card" data-action="open-diary" data-id="${d.id}">
      <img src="${d.photo}" alt="${escapeHtml(cat.name)}">
      <div class="content">
        <div class="top-line"><span class="dot" style="--cat-color:${cat.color}"></span>${escapeHtml(cat.name)} ・ ${formatDate(d.createdAt)}${tag}</div>
        <div class="quote">${escapeHtml(d.quote)}</div>
        ${titleTag ? `<div class="bottom-line">${titleTag}</div>` : ''}
        <div class="bottom-line">
          <span>飼い主評価 ${d.score}点</span>
          ${d.favorite ? '<span class="fav-mark">♥</span>' : ''}
        </div>
      </div>
    </button>
  `;
}

/* ---------------- お気に入り ---------------- */

export function renderFavorites(favorites, cats) {
  if (!favorites.length) {
    return `<div class="screen"><div class="empty-state"><span class="emoji">♡</span>まだお気に入りがありません。<br>結果画面の「♡ お気に入り」で登録できます。</div></div>`;
  }
  return `<div class="diary-grid" style="padding-top:16px">${favorites.map((d) => diaryCardHtml(d, cats)).join('')}</div>`;
}
