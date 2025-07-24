// React.memoとReact.lazyを適用した最適化コンポーネントのエクスポート

import React from 'react';
import { QuestionDisplay as _QuestionDisplay } from '@components/quiz/QuestionDisplay';
import { ChoiceButtons as _ChoiceButtons } from '@components/quiz/ChoiceButtons';
import { MonsterCard as _MonsterCard } from '@components/monster/MonsterCard';
import { ProgressBar as _ProgressBar } from '@components/stats/ProgressBar';
import { ComboDisplay as _ComboDisplay } from '@components/quiz/ComboDisplay';

// クイズ関連の最適化コンポーネント
export const QuestionDisplay = React.memo(_QuestionDisplay);
export const ChoiceButtons = React.memo(_ChoiceButtons);
export const ComboDisplay = React.memo(_ComboDisplay);

// モンスター関連の最適化コンポーネント  
export const MonsterCard = React.memo(_MonsterCard);

// 統計関連の最適化コンポーネント
export const ProgressBar = React.memo(_ProgressBar);

// 遅延読み込みコンポーネント（重いコンポーネントや初期表示に不要なもの）
export const AdminPanel = React.lazy(() => import('@components/admin/AdminPanel').then(m => ({ default: m.AdminPanel })));
export const StatsScreen = React.lazy(() => import('@components/stats/StatsScreen').then(m => ({ default: m.StatsScreen })));
export const RankingScreen = React.lazy(() => import('@components/ranking/RankingScreen').then(m => ({ default: m.RankingScreen })));
export const ExportScreen = React.lazy(() => import('@components/export/ExportScreen').then(m => ({ default: m.ExportScreen })));
export const MonsterCollection = React.lazy(() => import('@components/monster/MonsterCollection').then(m => ({ default: m.MonsterCollection })));

// チャート関連（rechartsは重いので遅延読み込み）
export const Chart = React.lazy(() => 
  import('recharts').then(recharts => ({
    default: recharts.LineChart
  }))
);