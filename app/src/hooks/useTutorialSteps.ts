import { TutorialStep } from '@contexts/TutorialContext';

export const mainMenuTutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    target: '.app-header',
    title: 'ことだまモンスタークイズへようこそ！',
    content: 'このゲームでは、ことわざや四字熟語のクイズに答えてモンスターを集めることができます。',
    placement: 'bottom',
  },
  {
    id: 'start-quiz',
    target: '.quiz-start-button',
    title: 'クイズを始めよう',
    content: 'このボタンをクリックすると、クイズが始まります。正解するとモンスターをゲットできるよ！',
    placement: 'bottom',
  },
  {
    id: 'navigation',
    target: 'nav[aria-label="メインナビゲーション"]',
    title: 'メニュー',
    content: 'ここから各画面に移動できます。モバイルでは下部のメニューを使います。',
    placement: 'bottom',
  },
  {
    id: 'level',
    target: 'div[aria-label="ユーザー統計"]',
    title: 'あなたのレベル',
    content: '現在のレベルと正解数が表示されます。クイズに正解して経験値を貯めましょう！',
    placement: 'bottom',
  },
];

export const quizTutorialSteps: TutorialStep[] = [
  {
    id: 'question',
    target: '.question-display',
    title: '問題文',
    content: 'ここに問題が表示されます。じっくり読んで答えを考えよう！',
    placement: 'bottom',
  },
  {
    id: 'choices',
    target: '.choice-buttons',
    title: '選択肢',
    content: '4つの選択肢から正解を選んでクリックしてください。キーボードの1〜4キーでも選択できます。',
    placement: 'top',
  },
  {
    id: 'sound',
    target: 'button[aria-label*="読み上げ"]',
    title: '音声読み上げ',
    content: '問題文を音声で聞くことができます。',
    placement: 'left',
  },
  {
    id: 'progress',
    target: '.quiz-progress',
    title: '進捗バー',
    content: '今日の進捗と連続正解数が表示されます。',
    placement: 'bottom',
  },
];

export const monsterCollectionTutorialSteps: TutorialStep[] = [
  {
    id: 'collection-grid',
    target: '.monster-grid',
    title: 'モンスターコレクション',
    content: '獲得したモンスターが表示されます。まだ獲得していないモンスターはシルエットで表示されます。',
    placement: 'top',
  },
  {
    id: 'filter',
    target: '.monster-filters',
    title: 'フィルター機能',
    content: 'レアリティや獲得状態でモンスターを絞り込むことができます。',
    placement: 'bottom',
  },
  {
    id: 'sort',
    target: '.monster-sort',
    title: '並び替え',
    content: '獲得日やレアリティ順でモンスターを並び替えることができます。',
    placement: 'bottom',
  },
];

export const settingsTutorialSteps: TutorialStep[] = [
  {
    id: 'player-name',
    target: 'input[placeholder*="名前"]',
    title: 'プレイヤー名',
    content: 'ランキングに表示される名前を設定できます。',
    placement: 'bottom',
  },
  {
    id: 'difficulty',
    target: 'input[name="difficulty"]',
    title: '難易度設定',
    content: '小学生、中学生、高校生から選べます。自分のレベルに合わせて設定しましょう。',
    placement: 'right',
  },
  {
    id: 'content-types',
    target: 'input[type="checkbox"]',
    title: '出題内容',
    content: 'ことわざ、慣用句、四字熟語から出題したい内容を選べます。',
    placement: 'right',
  },
  {
    id: 'theme',
    target: 'input[name="theme"]',
    title: 'テーマ設定',
    content: 'ライトモード、ダークモード、システム設定から選べます。',
    placement: 'right',
  },
];