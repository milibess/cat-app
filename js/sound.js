// ========================================================
// 効果音・BGM モジュール（Web Audio API による自前合成）
// 外部の音声ファイルは一切使用しない。
// 音量は MASTER_VOLUME の一箇所だけで調整できる。
// どの関数もエラーを外に投げない（失敗してもアプリ本体は動く）。
// ========================================================

const MUTE_KEY = 'uchineko_sound_muted_v1';
const MASTER_VOLUME = 0.16; // ここを変えるだけで全体の音量を調整できる

let ctx = null;
let masterGain = null;
let themePlayed = false;
let gestureListenersAttached = false;

/* ---------------- ミュート設定（localStorage） ---------------- */

export function isMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch (e) {
    return false;
  }
}

function setMuted(muted) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch (e) {
    /* localStorageが使えなくても無視 */
  }
}

export function toggleMuted() {
  const next = !isMuted();
  setMuted(next);
  return next;
}

/* ---------------- AudioContext ---------------- */

function getContext() {
  if (ctx) return ctx;
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    masterGain = ctx.createGain();
    masterGain.gain.value = MASTER_VOLUME;
    masterGain.connect(ctx.destination);
  } catch (e) {
    ctx = null;
  }
  return ctx;
}

function resumeContext() {
  try {
    const c = getContext();
    if (c && c.state === 'suspended') {
      c.resume().catch(() => {});
    }
  } catch (e) {
    /* noop */
  }
}

/* ---------------- 基本パーツ ---------------- */

// 1音を鳴らす。freqEndを指定すると滑らかにピッチが変化する。
function tone({ freq, freqEnd = null, start = 0, duration = 0.2, type = 'sine', peak = 1, attack = 0.008 }) {
  const c = getContext();
  if (!c || !masterGain || isMuted()) return;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    const t0 = c.currentTime + start;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t0 + duration);
    }
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(peak, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  } catch (e) {
    /* noop */
  }
}

// 短いノイズバースト（木槌の「カン」等に使用）。外部音源は使わず、
// ランダムサンプルのAudioBufferをその場で生成する。
function noiseBurst({ start = 0, duration = 0.08, peak = 1, filterFreq = 1200 }) {
  const c = getContext();
  if (!c || !masterGain || isMuted()) return;
  try {
    const sampleCount = Math.max(1, Math.floor(c.sampleRate * duration));
    const buffer = c.createBuffer(1, sampleCount, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / sampleCount);
    }
    const src = c.createBufferSource();
    src.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const gain = c.createGain();
    const t0 = c.currentTime + start;
    gain.gain.setValueAtTime(peak, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    src.start(t0);
  } catch (e) {
    /* noop */
  }
}

function safeRun(fn) {
  try {
    fn();
  } catch (e) {
    /* サウンド再生の失敗はアプリ本体に影響させない */
  }
}

/* ---------------- 起動テーマ（2〜4秒） ---------------- */

function themeMelody() {
  const notes = [523.25, 587.33, 659.25, 783.99, 659.25, 880.0]; // C5 D5 E5 G5 E5 A5
  const step = 0.22;
  notes.forEach((freq, i) => {
    tone({ freq, start: i * step, duration: step * 0.9, type: 'triangle', peak: 0.7 });
  });
  // 最後に猫の「にゃん」を思わせる上昇スイープ
  const tail = notes.length * step;
  tone({ freq: 700, freqEnd: 1050, start: tail, duration: 0.35, type: 'sine', peak: 0.55, attack: 0.03 });
  // きらっとしたハーモニー
  tone({ freq: 1568, start: tail + 0.05, duration: 0.3, type: 'sine', peak: 0.25 });
}

export function playThemeOnce() {
  if (themePlayed) return;
  if (isMuted()) return;
  const c = getContext();
  if (!c) return;
  if (c.state === 'running') {
    themePlayed = true;
    safeRun(themeMelody);
  }
  // suspended の場合は initSound() 側のジェスチャー待ちに任せる
}

/* ---------------- 各種効果音 ---------------- */

// 3. 今日のひとこと生成
export function playHitokoto() {
  safeRun(() => {
    tone({ freq: 660, freqEnd: 920, start: 0, duration: 0.12, type: 'sine', peak: 0.55, attack: 0.005 });
    tone({ freq: 1320, start: 0.09, duration: 0.1, type: 'sine', peak: 0.25 });
  });
}

// 4. 猫会議：会議開始チャイム
export function playConferenceStart() {
  safeRun(() => {
    tone({ freq: 523.25, start: 0, duration: 0.5, type: 'sine', peak: 0.6, attack: 0.02 });
    tone({ freq: 1046.5, start: 0.02, duration: 0.4, type: 'sine', peak: 0.18 });
  });
}

// 5. 飼い主裁判：開廷音（コミカルな「カンカン！」）
export function playTrialOpen() {
  safeRun(() => {
    noiseBurst({ start: 0, duration: 0.09, peak: 0.8, filterFreq: 1500 });
    noiseBurst({ start: 0.14, duration: 0.09, peak: 0.7, filterFreq: 1300 });
  });
}

// 5. 飼い主裁判：判決音
export function playVerdict(type) {
  safeRun(() => {
    if (type === '有罪') {
      tone({ freq: 300, freqEnd: 140, start: 0, duration: 0.4, type: 'sawtooth', peak: 0.35, attack: 0.01 });
    } else if (type === '無罪') {
      tone({ freq: 523.25, start: 0, duration: 0.15, type: 'triangle', peak: 0.5 });
      tone({ freq: 659.25, start: 0.12, duration: 0.15, type: 'triangle', peak: 0.5 });
      tone({ freq: 783.99, start: 0.24, duration: 0.25, type: 'triangle', peak: 0.55 });
    } else {
      // 執行猶予・厳重注意など：やわらかい中間音
      tone({ freq: 440, start: 0, duration: 0.18, type: 'sine', peak: 0.4 });
      tone({ freq: 392, start: 0.15, duration: 0.22, type: 'sine', peak: 0.35 });
    }
  });
}

// 6. レアイベント発生：きらきらファンファーレ
export function playRareEvent() {
  safeRun(() => {
    const notes = [659.25, 783.99, 987.77, 1318.5];
    notes.forEach((freq, i) => {
      tone({ freq, start: i * 0.11, duration: 0.22, type: 'triangle', peak: 0.45 });
    });
    // 仕上げのきらめき
    tone({ freq: 1760, start: 0.44, duration: 0.4, type: 'sine', peak: 0.25 });
    tone({ freq: 2093, start: 0.5, duration: 0.35, type: 'sine', peak: 0.18 });
  });
}

// 7. 飼い主評価：点数に応じた音
export function playScoreSound(score) {
  safeRun(() => {
    if (score >= 90) {
      [659.25, 830.61, 987.77].forEach((freq, i) => {
        tone({ freq, start: i * 0.1, duration: 0.2, type: 'triangle', peak: 0.45 });
      });
    } else if (score >= 70) {
      tone({ freq: 587.33, start: 0, duration: 0.14, type: 'sine', peak: 0.45 });
      tone({ freq: 783.99, start: 0.11, duration: 0.18, type: 'sine', peak: 0.45 });
    } else {
      tone({ freq: 260, freqEnd: 180, start: 0, duration: 0.28, type: 'square', peak: 0.22, attack: 0.01 });
    }
  });
}

// 8. お気に入り登録
export function playFavorite() {
  safeRun(() => {
    tone({ freq: 1046.5, start: 0, duration: 0.1, type: 'sine', peak: 0.4 });
    tone({ freq: 1568, start: 0.07, duration: 0.14, type: 'sine', peak: 0.3 });
  });
}

// 9. 猫ニュース速報ジングル
export function playNewsJingle() {
  safeRun(() => {
    [880, 660, 880].forEach((freq, i) => {
      tone({ freq, start: i * 0.11, duration: 0.1, type: 'square', peak: 0.18 });
    });
  });
}

/* ---------------- 初期化 ---------------- */

export function initSound() {
  if (gestureListenersAttached) return;
  gestureListenersAttached = true;

  // 自動再生が許可されていれば起動時に一度だけテーマを再生
  safeRun(playThemeOnce);

  // 自動再生がブロックされた場合、最初のユーザー操作で1回だけ再生する
  const onFirstGesture = () => {
    resumeContext();
    // resume 完了を待たずに少し遅らせて再生を試みる
    setTimeout(() => safeRun(playThemeOnce), 60);
    document.removeEventListener('pointerdown', onFirstGesture);
    document.removeEventListener('keydown', onFirstGesture);
  };
  document.addEventListener('pointerdown', onFirstGesture, { once: true });
  document.addEventListener('keydown', onFirstGesture, { once: true });
}
