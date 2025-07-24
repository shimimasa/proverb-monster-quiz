import React, { useState } from 'react';
import { TutorialEngine } from '@/components/tutorial/TutorialEngine';
import { 
  mainMenuTutorialSteps, 
  quizTutorialSteps, 
  collectionTutorialSteps,
  statsTutorialSteps,
  createCustomTutorialSteps,
  interactiveTutorialSteps
} from '@/components/tutorial/TutorialSteps';
import { useTutorial } from '@/hooks/useTutorial';

// テスト用のダミーゲーム画面
const DummyGameScreen: React.FC = () => {
  const [answered, setAnswered] = useState(false);
  const [combo, setCombo] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ヘッダー */}
      <header className="bg-white dark:bg-gray-800 shadow-sm p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button data-page="quiz" className="px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
              クイズ
            </button>
            <button data-page="collection" className="px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
              コレクション
            </button>
            <button data-page="stats" className="px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
              統計
            </button>
          </div>
          <div className="header-progress flex items-center gap-4">
            <span className="text-sm">レベル: 1</span>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 w-1/3"></div>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto p-8">
        {/* クイズセクション */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <div className="quiz-question mb-6">
            <h2 className="text-xl font-bold mb-2">問題</h2>
            <p className="text-lg">「何度失敗してもくじけずに立ち上がること」を表すことわざは？</p>
          </div>
          
          <div className="quiz-choices grid grid-cols-2 gap-4">
            {['七転八起', '一石二鳥', '猿も木から落ちる', '石の上にも三年'].map((choice, index) => (
              <button
                key={index}
                className="quiz-choice-button p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                onClick={() => setAnswered(true)}
              >
                {choice}
              </button>
            ))}
          </div>
          
          {answered && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-green-700 dark:text-green-300">正解！モンスターを獲得しました！</p>
            </div>
          )}
        </div>

        {/* コンボインジケーター */}
        <div className="combo-indicator fixed top-20 right-4 bg-orange-500 text-white px-4 py-2 rounded-lg">
          コンボ: {combo}
        </div>

        {/* コレクションプレビュー */}
        <div className="collection-filter mb-4">
          <select className="px-4 py-2 border rounded">
            <option>すべて</option>
            <option>レア度順</option>
            <option>獲得日順</option>
          </select>
        </div>
        
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="monster-card bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <p className="text-sm text-center">モンスター{i}</p>
            </div>
          ))}
        </div>

        {/* 統計グラフ */}
        <div className="accuracy-chart mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">正解率</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-20">ことわざ</span>
              <div className="flex-1 h-4 bg-gray-200 rounded">
                <div className="h-full bg-green-500 rounded w-3/4"></div>
              </div>
              <span>75%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-20">四字熟語</span>
              <div className="flex-1 h-4 bg-gray-200 rounded">
                <div className="h-full bg-blue-500 rounded w-1/2"></div>
              </div>
              <span>50%</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// カスタムチュートリアルのサンプル
const customTutorialSteps = createCustomTutorialSteps([
  {
    id: 'custom-1',
    title: 'カスタムチュートリアル',
    description: 'これはカスタムチュートリアルのデモです。',
    tips: 'ファクトリー関数を使って簡単に作成できます。',
  },
  {
    id: 'custom-2',
    title: 'ターゲット指定',
    description: '特定の要素をハイライトできます。',
    target: '.quiz-question',
    position: 'bottom',
  },
]);

export function TutorialTestScreen() {
  const tutorial = useTutorial();
  const [selectedTutorial, setSelectedTutorial] = useState<string>('main');
  const [showDummyScreen, setShowDummyScreen] = useState(true);
  const [gameState, setGameState] = useState({
    hasAnswered: false,
    comboEnabled: true,
    hasMonsters: true,
  });

  const tutorials = {
    main: { steps: mainMenuTutorialSteps, name: 'メインメニュー' },
    quiz: { steps: quizTutorialSteps, name: 'クイズ画面' },
    collection: { steps: collectionTutorialSteps, name: 'コレクション' },
    stats: { steps: statsTutorialSteps, name: '統計画面' },
    custom: { steps: customTutorialSteps, name: 'カスタム' },
    interactive: { steps: interactiveTutorialSteps, name: 'インタラクティブ' },
  };

  const handleStartTutorial = () => {
    const tutorialData = tutorials[selectedTutorial as keyof typeof tutorials];
    tutorial.startTutorial(tutorialData.steps, selectedTutorial);
  };

  return (
    <div className="relative">
      {/* コントロールパネル */}
      <div className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg p-4 z-[9997]">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">チュートリアルシステム テスト画面</h1>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="tutorial-select">チュートリアル:</label>
              <select
                id="tutorial-select"
                value={selectedTutorial}
                onChange={(e) => setSelectedTutorial(e.target.value)}
                className="px-3 py-1 border rounded dark:bg-gray-700"
              >
                {Object.entries(tutorials).map(([key, value]) => (
                  <option key={key} value={key}>{value.name}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handleStartTutorial}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              チュートリアル開始
            </button>
            
            <button
              onClick={() => tutorial.resetTutorial()}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              履歴リセット
            </button>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showDummyScreen}
                onChange={(e) => setShowDummyScreen(e.target.checked)}
              />
              ダミー画面を表示
            </label>
          </div>
          
          {/* 状態表示 */}
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
              <span className="font-semibold">アクティブ:</span> {tutorial.isActive ? 'はい' : 'いいえ'}
            </div>
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
              <span className="font-semibold">完了済み:</span> {tutorial.hasCompletedTutorial ? 'はい' : 'いいえ'}
            </div>
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
              <span className="font-semibold">現在のID:</span> {selectedTutorial}
            </div>
          </div>
          
          {/* ゲーム状態コントロール */}
          <div className="mt-4 flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={gameState.hasAnswered}
                onChange={(e) => setGameState(prev => ({ ...prev, hasAnswered: e.target.checked }))}
              />
              回答済み
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={gameState.comboEnabled}
                onChange={(e) => setGameState(prev => ({ ...prev, comboEnabled: e.target.checked }))}
              />
              コンボ有効
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={gameState.hasMonsters}
                onChange={(e) => setGameState(prev => ({ ...prev, hasMonsters: e.target.checked }))}
              />
              モンスター所持
            </label>
          </div>
        </div>
      </div>
      
      {/* ダミーゲーム画面 */}
      <div className="mt-40">
        {showDummyScreen && <DummyGameScreen />}
      </div>
      
      {/* チュートリアルエンジン */}
      {tutorial.isActive && (
        <TutorialEngine
          steps={tutorial.steps}
          onComplete={() => tutorial.completeTutorial(selectedTutorial)}
          onSkip={() => tutorial.skipTutorial()}
          gameState={gameState}
        />
      )}
      
      {/* 使用方法の説明 */}
      {!showDummyScreen && (
        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">チュートリアルシステムの使用方法</h2>
            
            <div className="space-y-4">
              <section>
                <h3 className="font-semibold mb-2">1. 基本的な使い方</h3>
                <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-x-auto">
{`import { useTutorial } from '@/hooks/useTutorial';
import { TutorialEngine } from '@/components/tutorial/TutorialEngine';

function MyComponent() {
  const tutorial = useTutorial();
  
  const steps = [
    {
      id: 'step1',
      content: <div>最初のステップ</div>,
      target: '.my-element',
      position: 'bottom'
    }
  ];
  
  return (
    <>
      <button onClick={() => tutorial.startTutorial(steps)}>
        チュートリアル開始
      </button>
      
      {tutorial.isActive && (
        <TutorialEngine
          steps={tutorial.steps}
          onComplete={() => tutorial.completeTutorial()}
        />
      )}
    </>
  );
}`}</pre>
              </section>
              
              <section>
                <h3 className="font-semibold mb-2">2. 主な機能</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>スポットライト効果でターゲット要素をハイライト</li>
                  <li>ツールチップの自動位置調整</li>
                  <li>進捗表示とスキップ機能</li>
                  <li>バリデーション機能（条件付き進行）</li>
                  <li>LocalStorageによる履歴管理</li>
                  <li>インタラクティブなポインター表示</li>
                </ul>
              </section>
              
              <section>
                <h3 className="font-semibold mb-2">3. カスタマイズ</h3>
                <p>createCustomTutorialSteps関数を使用して、簡単にチュートリアルを作成できます。</p>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}