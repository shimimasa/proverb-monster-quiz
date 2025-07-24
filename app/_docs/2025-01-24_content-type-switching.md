# 2025-01-24: コンテンツタイプ切り替え機能の完全実装

## 実装内容

### 1. 設定画面のコンテンツタイプ選択UI拡張

#### SettingsScreen.tsxの改修
- 混合モードのトグルを追加
- 各コンテンツタイプにアイコンと比率調整スライダーを追加
- タイプ別のカードUIで視覚的に分かりやすく
- 比率表示をリアルタイムで更新

#### types/index.tsの更新
```typescript
export interface GameSettings {
  soundEnabled: boolean;
  effectsVolume: number;
  difficulty: Difficulty;
  contentTypes: ContentType[];
  contentTypeWeights?: {
    proverb?: number;
    idiom?: number;
    four_character_idiom?: number;
  };
}
```

### 2. QuizScreenにコンテンツタイプ表示UI追加

#### QuizScreen.tsxの改修
- 問題表示エリアに現在のコンテンツタイプを表示
- タイプごとのアイコンを表示（📖ことわざ、💬慣用句、🈲四字熟語）
- 混合モード時には有効なタイプをアイコンで表示

### 3. ContentManagerの混合出題ロジック実装

#### ContentManager.tsの改修
- `getRandomQuestionMixed`メソッドを追加
- 重み付けに基づいてコンテンツタイプを選択
- 累積重みアルゴリズムで比率に応じた出題

### 4. GameContextの混合モード対応

#### GameContext.tsxの改修
- loadNewQuestionメソッドを混合モードに対応
- contentTypeWeightsが設定されている場合は混合モードで出題
- ContentItem型をインポートに追加

### 5. ProgressManagerのタイプ別進捗記録機能追加

#### ProgressManager.tsの改修
- contentTypeCorrect Mapを追加してタイプ別正解数を追跡
- updateContentTypeTrackingメソッドを改修して正解数も記録
- loadContentTypeStats/saveContentTypeStatsメソッドを追加
- getDetailedStatsメソッドでタイプ別正解数を返すように修正

### 6. 統計画面のタイプ別成績表示機能追加

#### SettingsScreen.tsxの統計タブ改修
- タイプ別成績セクションを追加
- 各タイプの出題数、正解数、正解率を表示
- プログレスバーで視覚的に正解率を表示
- タイプごとのカラーテーマ（blue、green、purple）

## 技術的なポイント

1. **重み付けアルゴリズム**: 累積重みを使用して効率的にタイプを選択
2. **リアルタイム更新**: 比率スライダーの変更が即座に反映
3. **永続化**: localStorageを使用してタイプ別統計を保存
4. **アクセシビリティ**: ARIAラベルと適切なコントラストを確保

## 今後の拡張可能性

1. タイプ別の難易度調整
2. タイプ別の学習目標設定
3. タイプ別のランキング
4. タイプ別の学習履歴グラフ