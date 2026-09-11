// ========================================================
// 猫の性格・口調・特徴に応じたセリフ／診断／ニュースの生成
// 外部APIは使わず、あらかじめ用意した文章プールから
// ランダムに組み合わせて「毎回少し違う」結果を作る。
// 将来的にはここを外部AI呼び出しに差し替える想定。
// ========================================================

export const PERSONALITIES = ['王様・女王様', '甘えん坊', 'ツンデレ', '天然・おとぼけ', '食いしん坊', 'マイペース'];
export const TONES = ['上から目線', 'やさしい', '毒舌', 'おとぼけ', '赤ちゃん風'];
export const TRAITS = ['よく寝る', '箱が好き', '膝に乗る', '食いしん坊', 'よく鳴く', 'いたずら好き', '甘えん坊', '写真好き'];

/* ---------------- ひとことセリフ ---------------- */

const QUOTE_POOL = {
  '王様・女王様': [
    '人間、今日の対応は70点です。',
    'この席は本日より私専用です。',
    'その程度で撫でたつもりですか？',
    '朝の挨拶が3秒遅れています。',
    '私が座ったら、そこはもう玉座です。',
    'おやつの品質、見直しを求めます。',
    '今日は機嫌よくしてあげましょう。',
    '跪くところまでは求めていません。座るだけで十分です。',
    'まぁ、悪くない一日でした。及第点です。',
    '次はもう少し早く気づきなさい。',
  ],
  '甘えん坊': [
    'あと5分だけ一緒にいて？',
    '今日は膝、空いてますか？',
    'ちょっとだけ近くにいて。',
    'なでなで、まだ終わってないよ。',
    'ずっとここにいてもいい？',
    'さみしかったから、そばにいたいな。',
    '今だけ甘えさせて。',
    'ぎゅーってして。ちょっとだけでいいから。',
    '一緒にお昼寝しよ。',
    'そばにいると落ち着くんだ。',
  ],
  'ツンデレ': [
    '別に待ってたわけじゃない。',
    '撫でてもいいけど、今だけ。',
    '近くにいてもいいですよ。',
    '…ちょっとくらいなら、そばにいてあげる。',
    '勘違いしないでよね、たまたま近くにいただけ。',
    'かまってほしいなんて、一言も言ってない。',
    'ふん、まあ許してあげる。',
    '今日だけ特別だからね。',
    '別に心配なんてしてないし。',
    'そこ、少しだけ空けておいてあげる。',
  ],
  '天然・おとぼけ': [
    'ここに来た理由を忘れました。',
    'とりあえず座っておきます。',
    '何か大事なことがあった気がします。',
    'あれ、今日って何曜日でしたっけ。',
    'さっきまで何をしていたか、思い出せません。',
    'なんとなく、ここが良い気がします。',
    '深く考えるのはやめました。',
    'ふと気づいたら、ここにいました。',
    '多分、大丈夫だと思います。',
    '今、大事なことを考えていた気がするんですが。',
  ],
  '食いしん坊': [
    'その袋の音について詳しく聞こうか。',
    'ごはんはまだでしょうか。',
    'さっき食べた件は忘れました。',
    '次のごはんまで、あと何分ですか。',
    'おやつの気配を察知しました。',
    'その手に持っているもの、気になります。',
    '今日のごはん、量が少なかった気がします。',
    '冷蔵庫の音がしました。確認をお願いします。',
    'お皿はまだ空にはなっていませんが、念のため確認を。',
    'ながら食べ、応援しています。分けてくれるなら。',
  ],
  'マイペース': [
    '今はそういう気分じゃないんだよね。',
    'あとで気が向いたら考える。',
    '急かされるのは好きじゃないな。',
    '今日はここでのんびりする予定。',
    '呼ばれても、気分次第で行くね。',
    '自分のタイミングでやるから、待ってて。',
    '特に用事はないけど、ここにいる。',
    '今日はゆっくりが正解な気がする。',
    'マイペースが一番。それだけ。',
    '予定は特にありません。気分で動きます。',
  ],
};

const TONE_FLAVORS = {
  '上から目線': ['心得なさい。', 'わかっていますね？', 'それでよろしい。', '以上です。'],
  'やさしい': ['ふふ、ありがとう。', 'いつも助かってるよ。', 'うれしいな。', 'これからもよろしくね。'],
  '毒舌': ['…まあ及第点ってところ。', 'それだけ？', 'あまり期待はしてないけど。', '次は頑張って。'],
  'おとぼけ': ['たぶん。', 'よくわからないけど。', 'なんとなく、そんな気がします。', '気のせいかもしれません。'],
  '赤ちゃん風': ['なの〜。', 'だもん。', 'なんだもーん。', 'きゅーん。'],
};

const TRAIT_QUOTES = {
  'よく寝る': ['今、大事な仕事中です。名前は「昼寝」といいます。', 'あと1時間だけ寝かせてください。'],
  '箱が好き': ['この箱、本日をもって私の家になりました。', '狭いところが落ち着くんです。文句ある？'],
  '膝に乗る': ['その膝、空いてますよね。座ります。', '膝の上、予約済みです。'],
  '食いしん坊': ['ごはんの匂い、キャッチしました。', 'おやつの時間、まだですか。'],
  'よく鳴く': ['さっきから呼んでるの、気づいてました？', '鳴けば大体なんとかなると思ってます。'],
  'いたずら好き': ['そのティッシュ、今から遊び道具にします。', 'ちょっとくらい、いいでしょう？'],
  '甘えん坊': ['今だけ、そばにいてもいいですか。', 'かまってもらえると、うれしいです。'],
  '写真好き': ['今日はどの角度で撮る予定ですか。', 'そろそろシャッターチャンスだと思います。'],
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateQuote(cat) {
  const base = QUOTE_POOL[cat.personality] || QUOTE_POOL['マイペース'];
  let quote = pick(base);

  const roll = Math.random();
  if (roll < 0.18 && cat.traits && cat.traits.length) {
    const trait = pick(cat.traits);
    const traitLines = TRAIT_QUOTES[trait];
    if (traitLines) quote = pick(traitLines);
  } else if (roll < 0.3 && cat.comment && cat.comment.trim()) {
    quote = `（${cat.comment.trim()}らしいです。今日もそんな気分。）`;
  }

  if (Math.random() < 0.35) {
    const flavors = TONE_FLAVORS[cat.tone];
    if (flavors) quote = `${quote}\n${pick(flavors)}`;
  }

  return quote;
}

/* ---------------- 本日の飼い主評価 ---------------- */

const SCORE_COMMENTS = {
  low: {
    '王様・女王様': ['お仕えする姿勢を、今一度見直しなさい。', 'その態度では及第点はあげられません。'],
    '甘えん坊': ['もっとぎゅーってしてほしかったな。', 'かまってくれる時間、少なかったよ。'],
    'ツンデレ': ['別に、もっとかまってほしいわけじゃないけど。', 'まあ…及第点ってことにしておく。'],
    '天然・おとぼけ': ['何が足りなかったか、忘れました。でも何か足りません。', 'なんとなく物足りない気がします。'],
    '食いしん坊': ['ごはん提供速度を再検討してください。', 'おやつの量、少なかったと思います。'],
    'マイペース': ['今日はちょっと構われすぎたかな。', 'まあ、こんな日もある。'],
    default: ['おやつ対応に改善の余地があります。', 'もう少し様子を見てほしかったです。'],
  },
  mid: {
    '王様・女王様': ['まずまずの働きでした。褒めてつかわす。', '合格点です。次も期待しています。'],
    '甘えん坊': ['今日もそばにいてくれてうれしかった。', 'まあまあ満足です。'],
    'ツンデレ': ['…悪くはなかった、と思う。', 'まあ、及第点はあげる。'],
    '天然・おとぼけ': ['特に不満はなかった気がします。', 'たぶん、いい一日でした。'],
    '食いしん坊': ['ごはんのタイミングは概ね良好でした。', 'おやつ、もう少し欲しかったですが許します。'],
    'マイペース': ['ちょうどいい距離感でした。', '特に問題ありませんでした。'],
    default: ['本日は概ね良好な対応でした。', 'まずまずの一日でした。'],
  },
  high: {
    '王様・女王様': ['本日はよく仕えました。褒美をあげましょう。', '完璧な対応でした。合格です。'],
    '甘えん坊': ['今日はいっぱい甘えさせてくれてうれしかった！', '最高の一日でした。ずっとそばにいてくれて。'],
    'ツンデレ': ['…今日は、ちょっとだけ良かったと思う。', 'まあまあ、よくやったんじゃない。'],
    '天然・おとぼけ': ['なんだかとても満たされた気がします。', 'よくわからないけど、いい一日でした。'],
    '食いしん坊': ['ごはんもおやつも完璧なタイミングでした！', '本日の食事対応、満点です。'],
    'マイペース': ['ちょうどよくて、いい一日でした。', '特に言うことはありません。満足です。'],
    default: ['本日はよく仕えました。', '満点に近い、すばらしい対応でした。'],
  },
};

export function generateOwnerScore(cat) {
  const score = Math.floor(Math.random() * 41) + 60; // 60〜100
  const tier = score >= 90 ? 'high' : score >= 75 ? 'mid' : 'low';
  const pool = SCORE_COMMENTS[tier][cat.personality] || SCORE_COMMENTS[tier].default;
  const comment = pick(pool);
  return { score, comment };
}

/* ---------------- 猫診断（4項目） ---------------- */

const DIAGNOSIS_BIAS = {
  '王様・女王様': { genki: 5, amae: -5, oyatsu: 10, nemuke: 0 },
  '甘えん坊': { genki: 0, amae: 20, oyatsu: 0, nemuke: -5 },
  'ツンデレ': { genki: 0, amae: -10, oyatsu: 5, nemuke: 0 },
  '天然・おとぼけ': { genki: -5, amae: 0, oyatsu: 0, nemuke: 10 },
  '食いしん坊': { genki: 5, amae: 0, oyatsu: 25, nemuke: -5 },
  'マイペース': { genki: -5, amae: -10, oyatsu: 0, nemuke: 15 },
};

function biasedRandom(bias) {
  const base = Math.floor(Math.random() * 71) + 20; // 20〜90
  const value = Math.max(0, Math.min(100, base + bias));
  return value;
}

export function generateDiagnosis(cat) {
  const bias = DIAGNOSIS_BIAS[cat.personality] || { genki: 0, amae: 0, oyatsu: 0, nemuke: 0 };
  return {
    genki: biasedRandom(bias.genki),
    amae: biasedRandom(bias.amae),
    oyatsu: biasedRandom(bias.oyatsu),
    nemuke: biasedRandom(bias.nemuke),
  };
}

/* ---------------- 猫ニュース速報 ---------------- */

const NEWS_TEMPLATES = [
  '速報：{time}、おやつ要求が発生',
  '緊急速報：お気に入りの箱が占拠されました',
  '続報：飼い主、なでなで要求に応じる',
  '現場からは以上です。',
  '速報：{cat}、玄関で待機中とのこと',
  '号外：ひざの上、本日も満席',
  '速報：{time}、窓の外の鳥を確認との情報',
  '続報：ごはんの音を検知、現場は色めき立っています',
  '速報：{cat}、突然の全力疾走を確認',
  '緊急：ブラッシング、思ったより好評だった模様',
  '速報：{time}、謎の高いところへ登頂を確認',
  '続報：飼い主のひざ、本日の争奪戦が激化',
  '速報：{cat}、段ボールへの入居を発表',
  '号外：おやつの袋の音、聞き逃さなかった模様',
];

export function generateNews(catName) {
  const now = new Date();
  const time = `${now.getHours()}時${now.getMinutes().toString().padStart(2, '0')}分`;
  const template = pick(NEWS_TEMPLATES);
  return template.replace('{time}', time).replace('{cat}', catName);
}

/* ---------------- 今日の称号 ---------------- */

const TITLES_BASE = [
  'ソファ占領王', 'おやつ監視官', '洗濯カゴの守護神', '気まぐれプリンセス', 'ごろごろ大臣',
  '箱入り名人', '夜ふかし警備隊長', '飼い主操作マスター', '本日のセンター猫', '無言の圧力王',
];

const TITLE_BIAS_TRAIT = {
  '箱が好き': ['箱入り名人'],
  'よく寝る': ['ごろごろ大臣', '夜ふかし警備隊長'],
  '膝に乗る': ['ソファ占領王'],
  '食いしん坊': ['おやつ監視官'],
  'いたずら好き': ['夜ふかし警備隊長', '無言の圧力王'],
  '甘えん坊': ['気まぐれプリンセス', '飼い主操作マスター'],
};

const TITLE_BIAS_PERSONALITY = {
  '王様・女王様': ['本日のセンター猫', '無言の圧力王'],
  '食いしん坊': ['おやつ監視官'],
  'マイペース': ['気まぐれプリンセス'],
};

function getBiasedTitlePool(cat) {
  const biased = new Set();
  (cat.traits || []).forEach((t) => (TITLE_BIAS_TRAIT[t] || []).forEach((x) => biased.add(x)));
  (TITLE_BIAS_PERSONALITY[cat.personality] || []).forEach((x) => biased.add(x));
  if (biased.size && Math.random() < 0.6) return Array.from(biased);
  return TITLES_BASE;
}

export function generateTitle(cat, boosted = false) {
  const pool = getBiasedTitlePool(cat);
  const text = pick(pool);
  if (!boosted) return { text, text2: null, rare: false };
  let text2 = pick(TITLES_BASE);
  let guard = 0;
  while (text2 === text && guard < 5) {
    text2 = pick(TITLES_BASE);
    guard++;
  }
  return { text, text2, rare: true };
}

/* ---------------- 猫会議 ---------------- */

export const CONFERENCE_THEMES = [
  '今日のおやつ', '誰が一番えらいか', 'お気に入りの寝場所', '飼い主への要望',
  '最近気になること', 'ごはんの時間', '箱の所有権', '窓辺の特等席の使用ルール',
];

const CONFERENCE_LINE_POOL = {
  '王様・女王様': [
    '私は賛成です。ただし条件付きで。', '異議はありません。当然の采配です。',
    'そのくらいは認めてあげましょう。', '正式に承認します。', '私の意見がすべてです。',
    'ふむ、悪くない議題ですね。', '採決の必要はありません。私が決めます。', 'よろしい、次の議題へ。',
  ],
  '甘えん坊': [
    '私は賛成です。', 'みんなで一緒がいいな。', '早く決まるとうれしいな。', 'それでいいと思うよ。',
    'ちょっとだけ意見してもいい？', '賛成！早くみんなでゴロゴロしたい。', 'うんうん、そう思う。', 'とりあえず、そばにいたいな。',
  ],
  'ツンデレ': [
    '別に反対はしてないけど。', 'まあ、それでいいんじゃない。', '…賛成、ということにしておく。',
    'ふん、そんなことより早く終わらせて。', '異議はないけど納得もしてない。', 'まあ悪くはないかな、知らないけど。',
    'べつに賛成したいわけじゃないから。', 'そこは譲ってあげる。',
  ],
  '天然・おとぼけ': [
    'え、今何の話でしたっけ。', '賛成でも反対でもある気がします。', 'もう食べた気もします。', 'とりあえず座ります。',
    'なんとなく良い気がします。', '議題を忘れました。もう一度お願いします。', 'たぶん、それで大丈夫です。', '気づいたらここにいました。',
  ],
  '食いしん坊': [
    'それより、おやつの話をしませんか。', '賛成です。ごはんが増えるなら。', 'お腹が空いてきました。',
    'その話、ごはんの後でもいいですか。', 'とりあえず賛成しておきます。', 'おやつが絡むなら全力で賛成です。',
    '食べながらでもいいですか。', '空腹には勝てません。',
  ],
  'マイペース': [
    '特に意見はありません。', '好きにしてください。', '急かされるのは苦手です。', 'まあ、それでいいんじゃない。',
    '気が向いたら参加します。', '今はそういう気分じゃないかな。', '特にこだわりはありません。', '自分のペースで考えます。',
  ],
};

function pickSpeaker(cats, prevId) {
  if (cats.length === 1) return cats[0];
  let candidate;
  let guard = 0;
  do {
    candidate = pick(cats);
    guard++;
  } while (candidate.id === prevId && guard < 8);
  return candidate;
}

export function generateConference(cats, forcedTheme) {
  const theme = forcedTheme || pick(CONFERENCE_THEMES);
  const lineCount = Math.floor(Math.random() * 4) + 3; // 3〜6
  const opener = pick(cats);
  const lines = [{ catId: opener.id, text: `本日の議題は、${theme}についてです。` }];
  let prevId = opener.id;
  for (let i = 1; i < lineCount; i++) {
    const speaker = pickSpeaker(cats, prevId);
    const pool = CONFERENCE_LINE_POOL[speaker.personality] || CONFERENCE_LINE_POOL['マイペース'];
    lines.push({ catId: speaker.id, text: pick(pool) });
    prevId = speaker.id;
  }
  return { theme, lines };
}

/* ---------------- 飼い主裁判 ---------------- */

export const TRIAL_THEMES = [
  'おやつが遅かった件', 'なでなで不足の件', '寝床の確保を妨害した件', '写真を撮りすぎた件',
  'ごはん後すぐ空になった件', '掃除機をかけた件', '来客時に隠れさせられた件', '爪切りを強行した件',
];

const TRIAL_TESTIMONY_POOL = {
  '王様・女王様': [
    '明らかに不服です。', '即刻の改善を求めます。', 'これは看過できません。',
    '厳正な対応を望みます。', '弁明の余地はないかと。', '当然、私が正しいです。',
  ],
  '甘えん坊': [
    'ちょっと寂しかったです…。', 'もっと構ってほしかったな。', '悲しかったけど、許せます。',
    '早く仲直りしたいです。', '寂しさは否定できません。', 'でも今はそばにいてほしいです。',
  ],
  'ツンデレ': [
    '別に怒ってないから。', '…まあ、ちょっとは思うところがある。', '気にしてないと言えば嘘になる。',
    '認めたくないけど不満はある。', 'まあ、今回は目をつぶる。', '次は気をつけてほしいだけ。',
  ],
  '天然・おとぼけ': [
    '何があったか忘れました。', 'たぶん何か問題があった気がします。', 'よくわからないけど、大変だったと思います。',
    '気づいたら終わっていました。', '特に怒ってはいないと思います。', '曖昧な記憶ですが、許します。',
  ],
  '食いしん坊': [
    'ごはんが関係するなら重大です。', 'おやつの補填を求めます。', '空腹だったのは事実です。',
    '食料問題は見過ごせません。', 'とにかくお腹が空きました。', '解決策はおやつだと思います。',
  ],
  'マイペース': [
    '特に気にしていません。', 'まあ、そんな日もあります。', '急かされなければ問題ありません。',
    '自分のペースが守られれば十分です。', '特に不満はありません。', '好きにしてくれて構いません。',
  ],
};

export const TRIAL_VERDICTS = [
  { type: '有罪', detail: '本日のおやつ1回追加' },
  { type: '執行猶予', detail: 'なでなで5分で和解可能' },
  { type: '無罪', detail: '今回は許す' },
  { type: '厳重注意', detail: '今後の対応改善を求める' },
  { type: '有罪', detail: '追加のブラッシング刑' },
  { type: '執行猶予', detail: '一緒に昼寝すれば減刑' },
];

export function generateTrial(cats) {
  const theme = pick(TRIAL_THEMES);
  const testimonies = cats.map((cat) => {
    const pool = TRIAL_TESTIMONY_POOL[cat.personality] || TRIAL_TESTIMONY_POOL['マイペース'];
    return { catId: cat.id, text: pick(pool) };
  });
  const verdict = pick(TRIAL_VERDICTS);
  return { theme, testimonies, verdict };
}

/* ---------------- ランダムイベント ---------------- */

const SNACK_CRISIS_QUOTES = [
  'おやつ要求レベル、本日はMAXに達しました。',
  '緊急事態です。おやつの残量を確認してください。',
  'おやつ在庫、危機的状況との報告です。',
  '本日、おやつ要求が過去最高を記録しました。',
];

const EVENT_POOL = [
  { type: 'conference', weight: 15, minCats: 2, emoji: '🗣️', label: '緊急猫会議が招集されました' },
  { type: 'trial', weight: 20, minCats: 1, emoji: '⚖️', label: '本日は飼い主裁判が開廷されます' },
  { type: 'title-boost', weight: 20, minCats: 1, emoji: '✨', label: '本日の称号が強化されました' },
  { type: 'news-special', weight: 20, minCats: 1, emoji: '📺', label: '猫ニュース特番' },
  { type: 'snack-crisis', weight: 15, minCats: 1, emoji: '🚨', label: 'おやつ危機速報' },
  { type: 'boss-cat', weight: 10, minCats: 2, emoji: '👑', label: '本日のボス猫が決定しました' },
];

const EVENT_CHANCE = 0.3;

export function pickRandomEvent(cats, currentCat) {
  if (!currentCat || Math.random() > EVENT_CHANCE) return null;
  const available = EVENT_POOL.filter((e) => cats.length >= e.minCats);
  if (!available.length) return null;

  const totalWeight = available.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;
  let chosen = available[available.length - 1];
  for (const e of available) {
    if (roll < e.weight) { chosen = e; break; }
    roll -= e.weight;
  }

  const base = { type: chosen.type, emoji: chosen.emoji, label: chosen.label };

  switch (chosen.type) {
    case 'conference': {
      const others = cats.filter((c) => c.id !== currentCat.id);
      const partner = pick(others);
      const conference = generateConference([currentCat, partner]);
      return { ...base, conference };
    }
    case 'trial': {
      const others = shuffleArray(cats.filter((c) => c.id !== currentCat.id)).slice(0, 2);
      const trial = generateTrial([currentCat, ...others]);
      return { ...base, trial };
    }
    case 'title-boost': {
      const title = generateTitle(currentCat, true);
      return { ...base, title };
    }
    case 'news-special': {
      const newsItems = [];
      let guard = 0;
      while (newsItems.length < 3 && guard < 20) {
        const item = generateNews(currentCat.name);
        if (!newsItems.includes(item)) newsItems.push(item);
        guard++;
      }
      return { ...base, newsItems };
    }
    case 'snack-crisis': {
      const message = pick(SNACK_CRISIS_QUOTES);
      return { ...base, message };
    }
    case 'boss-cat': {
      const boss = pick(cats);
      return { ...base, bossCat: { id: boss.id, name: boss.name, color: boss.color, photo: boss.photo } };
    }
    default:
      return null;
  }
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/* ---------------- トップ画面の遊びごころ ---------------- */

const PLAY_SUGGESTIONS = [
  '今日は猫会議を試してみよう', '飼い主裁判が起きるかも？', '本日の称号を集めよう',
  '猫ニュース特番に注目', '今日はどんな判決が出るかな', '称号コンプリートを目指そう',
];

const ONE_LINERS = [
  '猫たちが何か言いたそうです', '今日は誰が主役？', '会議の準備はできています',
  '裁判所が静かに開廷を待っています', '称号争いが激化中かもしれません', '今日はどんな一日になるでしょう',
];

export function generatePlaySuggestion() {
  return pick(PLAY_SUGGESTIONS);
}

export function generateOneLiner() {
  return pick(ONE_LINERS);
}
