import { useMemo } from 'react';

const loadingTips = [
  'ことわざの意味を理解すると、モンスターとの絆が深まります！',
  '連続正解でコンボボーナス！レアモンスターが出やすくなります',
  'モンスター図鑑をコンプリートすると特別な称号がもらえます',
  '「猿も木から落ちる」の意味、知ってますか？',
  '四字熟語は漢字の組み合わせから意味を想像してみよう',
  '慣用句は日常会話でよく使われる表現です',
  'レジェンダリーモンスターはとてもレア！根気よく挑戦しよう',
  '難易度が高い問題ほど、レアなモンスターが出現しやすい！',
  'ストリークボーナスで経験値アップ！連続正解を目指そう',
  'モンスターの名前にはことわざのヒントが隠されています'
];

export const useLoadingTips = (): string => {
  return useMemo(() => {
    const randomIndex = Math.floor(Math.random() * loadingTips.length);
    return loadingTips[randomIndex];
  }, []);
};

// 初期ローディング用のメッセージ
export const getInitialLoadingMessage = (): string => {
  const messages = [
    'ことだまモンスターを召喚中...',
    'クイズデータを準備しています...',
    'モンスターたちが目覚めています...',
    '学習の冒険を始める準備中...',
    'ことわざの世界へようこそ！'
  ];
  
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
};