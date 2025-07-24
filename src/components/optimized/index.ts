// React.memoを適用した最適化コンポーネントのエクスポート

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