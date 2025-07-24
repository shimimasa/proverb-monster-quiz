import React, { useState } from 'react';
import { AudioControls, SpeechButton, AudioVisualizer } from '@/components/audio/AudioControls';
import { QuestionDisplayV2 } from '@/components/quiz/QuestionDisplayV2';
import { AnswerFeedbackV2 } from '@/components/quiz/AnswerFeedbackV2';
import { advancedAudioService } from '@/services/advancedAudioService';
import type { QuizQuestion, ContentItem } from '@/types';

// テスト用のデータ
const testQuestion: QuizQuestion = {
  id: 1,
  question: '何度失敗してもくじけずに立ち上がることを表すことわざは？',
  choices: ['七転八起', '一石二鳥', '猿も木から落ちる', '石の上にも三年'],
  correctAnswer: 0,
  explanation: '七転八起（しちてんはっき）は、七回転んでも八回起き上がるという意味から、何度失敗してもあきらめずに立ち上がることを表します。',
  contentItem: {
    id: 1,
    text: '七転八起',
    reading: 'しちてんはっき',
    meaning: '何度失敗してもくじけずに立ち上がること',
    difficulty: '中学生',
    example_sentence: '彼は七転八起の精神で、ついに事業を成功させた。',
    type: 'four_character_idiom'
  }
};

const testSentences = [
  {
    text: 'こんにちは！ことだまモンスターで楽しく学習しましょう。',
    description: '基本的な挨拶'
  },
  {
    text: '猿も木から落ちる、さるもきからおちる。どんなに得意なことでも失敗することがある。',
    description: 'ことわざの読み上げ'
  },
  {
    text: '一期一会（いちごいちえ）とは、一生に一度だけの機会という意味です。',
    description: '四字熟語の説明'
  },
  {
    text: '頭隠して尻隠さず。一部だけ隠して、全体を隠したつもりになることのたとえ。',
    description: '慣用句の例'
  }
];

export function AudioTestScreen() {
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState(true);
  const [selectedEffect, setSelectedEffect] = useState<string>('correct');
  const [testText, setTestText] = useState(testSentences[0].text);

  const playEffect = () => {
    advancedAudioService.playAdvancedSound(selectedEffect as any, {
      variation: Math.floor(Math.random() * 3)
    });
  };

  const playBackgroundMusic = async () => {
    // 実際の実装では音楽ファイルのURLを指定
    console.log('Background music would play here');
    // await advancedAudioService.playBackgroundMusic('/music/gentle-bgm.mp3', {
    //   loop: true,
    //   fadeIn: 2000
    // });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          音声読み上げシステム テスト画面
        </h1>

        {/* 音声コントロール */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">音声設定コントロール</h2>
          <div className="flex items-center justify-between">
            <p className="text-gray-600 dark:text-gray-400">
              詳細な音声設定を調整できます
            </p>
            <AudioControls showAdvanced={true} />
          </div>
        </section>

        {/* 読み上げテスト */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">読み上げテスト</h2>
          
          <div className="space-y-4">
            {/* テキスト選択 */}
            <div>
              <label className="block text-sm font-medium mb-2">テストテキスト選択</label>
              <select
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                {testSentences.map((sentence, index) => (
                  <option key={index} value={sentence.text}>
                    {sentence.description}
                  </option>
                ))}
              </select>
            </div>

            {/* カスタムテキスト入力 */}
            <div>
              <label className="block text-sm font-medium mb-2">カスタムテキスト</label>
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                rows={3}
              />
            </div>

            {/* 読み上げボタン */}
            <div className="flex items-center gap-4">
              <SpeechButton
                text={testText}
                size="large"
                variant="primary"
                className="px-6"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                クリックして読み上げを開始/停止
              </span>
            </div>
          </div>
        </section>

        {/* 効果音テスト */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">効果音テスト</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['correct', 'incorrect', 'levelUp', 'achievement', 'monsterGet', 'click', 'hover'].map(effect => (
              <button
                key={effect}
                onClick={() => {
                  setSelectedEffect(effect);
                  advancedAudioService.playAdvancedSound(effect as any);
                }}
                className={`
                  px-4 py-2 rounded-lg transition-colors
                  ${selectedEffect === effect 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}
                `}
              >
                {effect}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={playEffect}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              選択した効果音を再生
            </button>
            <button
              onClick={playBackgroundMusic}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              背景音楽を再生
            </button>
          </div>
        </section>

        {/* クイズコンポーネントテスト */}
        <section className="space-y-8 mb-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">クイズ問題表示（自動読み上げ付き）</h2>
            <QuestionDisplayV2
              question={testQuestion}
              autoRead={true}
              onReadComplete={() => console.log('Question read complete')}
            />
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">解答フィードバック表示</h2>
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => {
                  setIsCorrect(true);
                  setShowAnswer(true);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                正解パターンを表示
              </button>
              <button
                onClick={() => {
                  setIsCorrect(false);
                  setShowAnswer(true);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                不正解パターンを表示
              </button>
            </div>
            
            {showAnswer && (
              <AnswerFeedbackV2
                isCorrect={isCorrect}
                question={testQuestion}
                onNext={() => setShowAnswer(false)}
                autoRead={true}
              />
            )}
          </div>
        </section>

        {/* 音声ビジュアライザー */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">音声ビジュアライザー</h2>
          <div className="flex justify-center">
            <AudioVisualizer className="w-full max-w-md" />
          </div>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
            音声再生中に波形が表示されます
          </p>
        </section>

        {/* 使用方法 */}
        <section className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">音声読み上げシステムの特徴</h2>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li>✅ 日本語に最適化された読み上げ速度の自動調整</li>
            <li>✅ 漢字の読みがな対応（contentItemのreadingを使用）</li>
            <li>✅ 句読点での適切な間の挿入</li>
            <li>✅ 複数の音声バリエーション</li>
            <li>✅ 効果音のバリエーション（同じ効果音でも毎回少し違う音）</li>
            <li>✅ 背景音楽のクロスフェード対応</li>
            <li>✅ 振動フィードバック（モバイルデバイス）</li>
            <li>✅ 音声の可視化表示</li>
            <li>✅ キューシステムによる読み上げの順序管理</li>
          </ul>
        </section>
      </div>
    </div>
  );
}