import React from 'react';
import type { TutorialStep } from './TutorialEngine';

// メインメニューのチュートリアル
export const mainMenuTutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    content: (
      <div>
        <h3 className="text-xl font-bold mb-3 text-blue-600">ことだまモンスターへようこそ！</h3>
        <p className="mb-2">このゲームでは、日本語の知識を楽しく学びながら、</p>
        <p>かわいいモンスターたちを集めることができます。</p>
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm">💡 ヒント: クイズに正解するとモンスターが手に入ります！</p>
        </div>
      </div>
    ),
    position: 'center',
    highlight: false,
  },
  {
    id: 'quiz-start',
    target: '[data-page="quiz"]',
    content: (
      <div>
        <h3 className="text-lg font-bold mb-2">クイズに挑戦！</h3>
        <p>ここをクリックしてクイズを始めましょう。</p>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          ことわざ、四字熟語、慣用句の問題が出題されます。
        </p>
      </div>
    ),
    position: 'bottom',
    highlight: true,
  },
  {
    id: 'collection',
    target: '[data-page="collection"]',
    content: (
      <div>
        <h3 className="text-lg font-bold mb-2">モンスターコレクション</h3>
        <p>獲得したモンスターはここで見ることができます。</p>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          レアなモンスターも存在するので、全て集めてみましょう！
        </p>
      </div>
    ),
    position: 'bottom',
    highlight: true,
  },
  {
    id: 'progress',
    target: '.header-progress',
    content: (
      <div>
        <h3 className="text-lg font-bold mb-2">進捗状況</h3>
        <p>あなたのレベルと経験値がここに表示されます。</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
            <span className="font-semibold">レベル:</span> 経験値で上昇
          </div>
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
            <span className="font-semibold">正解率:</span> 実力の指標
          </div>
        </div>
      </div>
    ),
    position: 'bottom',
    highlight: true,
  },
];

// クイズ画面のチュートリアル
export const quizTutorialSteps: TutorialStep[] = [
  {
    id: 'quiz-intro',
    content: (
      <div>
        <h3 className="text-xl font-bold mb-3 text-green-600">クイズの遊び方</h3>
        <p>問題文を読んで、正しい答えを選択しましょう。</p>
        <p className="mt-2">制限時間はないので、じっくり考えて大丈夫です！</p>
      </div>
    ),
    position: 'center',
    highlight: false,
  },
  {
    id: 'question',
    target: '.quiz-question',
    content: (
      <div>
        <h3 className="text-lg font-bold mb-2">問題文</h3>
        <p>ここに問題が表示されます。</p>
        <p className="mt-2 text-sm">意味から正しいことわざや慣用句を当ててください。</p>
      </div>
    ),
    position: 'bottom',
    highlight: true,
  },
  {
    id: 'choices',
    target: '.quiz-choices',
    content: (
      <div>
        <h3 className="text-lg font-bold mb-2">選択肢</h3>
        <p>4つの選択肢から正解を選んでクリックしてください。</p>
        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-sm">💡 ヒント: わからない時は消去法で考えてみよう！</p>
        </div>
      </div>
    ),
    position: 'top',
    highlight: true,
  },
  {
    id: 'combo',
    target: '.combo-indicator',
    content: (
      <div>
        <h3 className="text-lg font-bold mb-2">コンボシステム</h3>
        <p>連続正解でコンボが発生！</p>
        <ul className="mt-2 space-y-1 text-sm">
          <li>🔥 5連続: ボーナス経験値</li>
          <li>⚡ 10連続: レアモンスター確率UP</li>
          <li>🌟 20連続: 特別な報酬！</li>
        </ul>
      </div>
    ),
    position: 'left',
    highlight: true,
    skipCondition: (state) => !state?.comboEnabled,
  },
];

// モンスターコレクションのチュートリアル
export const collectionTutorialSteps: TutorialStep[] = [
  {
    id: 'collection-intro',
    content: (
      <div>
        <h3 className="text-xl font-bold mb-3 text-purple-600">モンスター図鑑</h3>
        <p>ここでは獲得したモンスターを確認できます。</p>
        <p className="mt-2">モンスターをクリックすると詳細情報が見られます。</p>
      </div>
    ),
    position: 'center',
    highlight: false,
  },
  {
    id: 'monster-card',
    target: '.monster-card:first-child',
    content: (
      <div>
        <h3 className="text-lg font-bold mb-2">モンスターカード</h3>
        <p>各モンスターには以下の情報があります：</p>
        <ul className="mt-2 space-y-1 text-sm">
          <li>✨ レアリティ（コモン〜レジェンダリー）</li>
          <li>📖 出典となることわざ・慣用句</li>
          <li>📅 獲得日</li>
        </ul>
      </div>
    ),
    position: 'right',
    highlight: true,
    skipCondition: (state) => !state?.hasMonsters,
  },
  {
    id: 'filter',
    target: '.collection-filter',
    content: (
      <div>
        <h3 className="text-lg font-bold mb-2">フィルター機能</h3>
        <p>モンスターを絞り込んで表示できます。</p>
        <p className="mt-2 text-sm">レアリティやタイプで検索してみましょう。</p>
      </div>
    ),
    position: 'bottom',
    highlight: true,
  },
];

// 統計画面のチュートリアル
export const statsTutorialSteps: TutorialStep[] = [
  {
    id: 'stats-intro',
    content: (
      <div>
        <h3 className="text-xl font-bold mb-3 text-indigo-600">学習統計</h3>
        <p>あなたの学習進捗を詳しく確認できます。</p>
        <p className="mt-2">データを見て、得意・不得意を把握しましょう！</p>
      </div>
    ),
    position: 'center',
    highlight: false,
  },
  {
    id: 'accuracy-chart',
    target: '.accuracy-chart',
    content: (
      <div>
        <h3 className="text-lg font-bold mb-2">正解率グラフ</h3>
        <p>カテゴリー別の正解率を確認できます。</p>
        <p className="mt-2 text-sm">苦手な分野を重点的に練習しましょう。</p>
      </div>
    ),
    position: 'bottom',
    highlight: true,
  },
];

// チュートリアルステップのファクトリー関数
export const createCustomTutorialSteps = (
  steps: Array<{
    id: string;
    title: string;
    description: string;
    target?: string;
    position?: TutorialStep['position'];
    tips?: string;
  }>
): TutorialStep[] => {
  return steps.map(step => ({
    id: step.id,
    target: step.target,
    position: step.position || 'bottom',
    highlight: !!step.target,
    content: (
      <div>
        <h3 className="text-lg font-bold mb-2">{step.title}</h3>
        <p>{step.description}</p>
        {step.tips && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm">💡 {step.tips}</p>
          </div>
        )}
      </div>
    ),
  }));
};

// インタラクティブチュートリアルのサンプル
export const interactiveTutorialSteps: TutorialStep[] = [
  {
    id: 'interactive-1',
    target: '.quiz-choice-button',
    content: (
      <div>
        <h3 className="text-lg font-bold mb-2">実際に試してみよう！</h3>
        <p>選択肢をクリックして回答してください。</p>
        <p className="mt-2 text-sm text-gray-600">間違えても大丈夫です！</p>
      </div>
    ),
    position: 'top',
    highlight: true,
    interactive: true,
    validation: (state) => state?.hasAnswered === true,
  },
  {
    id: 'interactive-2',
    content: (
      <div>
        <h3 className="text-lg font-bold mb-2">素晴らしい！</h3>
        <p>回答後は解説が表示されます。</p>
        <p className="mt-2">しっかり読んで知識を深めましょう。</p>
      </div>
    ),
    position: 'center',
    highlight: false,
    delay: 1000,
  },
];