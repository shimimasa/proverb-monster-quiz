# Design Document

## Overview

ことわざモンスタークイズは、教育とエンターテイメントを融合したWebベースのゲームアプリケーションです。子どもたちがことわざを学習しながら、モンスターをコレクションできる楽しい体験を提供します。将来的には四字熟語や慣用句にも拡張可能な柔軟なアーキテクチャを採用します。

### 設計原則

1. **拡張性**: 新しいコンテンツタイプ（四字熟語、慣用句）を容易に追加できる
2. **使いやすさ**: 子どもでも直感的に操作できるシンプルなUI
3. **パフォーマンス**: 軽量で高速な動作
4. **保守性**: コードの可読性と保守性を重視
5. **アクセシビリティ**: 様々な環境で利用可能

## Architecture

### システム構成

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Game Engine   │    │   Data Layer    │
│   (React/Vue)   │◄──►│   (JavaScript)  │◄──►│   (JSON Files)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Components │    │  Business Logic │    │  Local Storage  │
│   - Quiz Screen │    │  - Quiz Manager │    │  - User Progress│
│   - Monster     │    │  - Monster      │    │  - Settings     │
│     Collection  │    │    Manager      │    │  - Achievements │
│   - Statistics  │    │  - Score System │    └─────────────────┘
└─────────────────┘    └─────────────────┘
```

### 技術スタック

**フロントエンド**
- **フレームワーク**: React 18+ (コンポーネントベース開発)
- **状態管理**: React Context API + useReducer (軽量な状態管理)
- **スタイリング**: CSS Modules + Tailwind CSS (レスポンシブデザイン)
- **アニメーション**: Framer Motion (モンスター獲得演出)
- **アイコン**: React Icons (統一されたアイコンセット)

**データ管理**
- **データ形式**: JSON (軽量で読みやすい)
- **ローカルストレージ**: localStorage (ユーザー進捗の永続化)
- **データ検証**: Zod (型安全なデータ検証)

**開発・ビルドツール**
- **バンドラー**: Vite (高速な開発サーバー)
- **言語**: TypeScript (型安全性)
- **テスト**: Vitest + React Testing Library
- **リンター**: ESLint + Prettier

## Components and Interfaces

### コアコンポーネント

#### 1. ContentManager (コンテンツ管理)
```typescript
interface ContentItem {
  id: number;
  text: string;
  reading: string;
  meaning: string;
  difficulty: '小学生' | '中学生' | '高校生';
  example_sentence: string;
  type: 'proverb' | 'idiom' | 'four_character_idiom';
}

interface ContentManager {
  loadContent(type: ContentType): Promise<ContentItem[]>;
  getRandomQuestion(type: ContentType, difficulty?: string): ContentItem;
  generateChoices(correct: ContentItem, type: ContentType): string[];
}
```

#### 2. QuizEngine (クイズエンジン)
```typescript
interface QuizQuestion {
  id: number;
  question: string;
  choices: string[];
  correctAnswer: number;
  explanation: string;
  contentItem: ContentItem;
}

interface QuizEngine {
  generateQuestion(contentItem: ContentItem): QuizQuestion;
  checkAnswer(questionId: number, selectedChoice: number): boolean;
  getExplanation(questionId: number): string;
}
```

#### 3. MonsterManager (モンスター管理)
```typescript
interface Monster {
  id: string;
  name: string;
  image: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  sourceContent: ContentItem;
  unlocked: boolean;
  dateObtained?: Date;
}

interface MonsterManager {
  generateMonster(contentItem: ContentItem): Monster;
  unlockMonster(monsterId: string): void;
  getCollection(): Monster[];
  getCollectionStats(): { total: number; unlocked: number };
}
```

#### 4. ProgressManager (進捗管理)
```typescript
interface UserProgress {
  level: number;
  experience: number;
  totalQuestions: number;
  correctAnswers: number;
  streak: number;
  achievements: Achievement[];
  settings: GameSettings;
}

interface ProgressManager {
  updateProgress(correct: boolean): void;
  calculateLevel(experience: number): number;
  checkAchievements(): Achievement[];
  saveProgress(): void;
  loadProgress(): UserProgress;
}
```

### UIコンポーネント階層

```
App
├── Header
│   ├── Logo
│   ├── NavigationMenu
│   └── SettingsButton
├── MainContent
│   ├── QuizScreen
│   │   ├── QuestionDisplay
│   │   ├── ChoiceButtons
│   │   ├── ProgressBar
│   │   └── ScoreDisplay
│   ├── MonsterCollection
│   │   ├── CollectionGrid
│   │   ├── MonsterCard
│   │   └── FilterControls
│   ├── Statistics
│   │   ├── ProgressChart
│   │   ├── AchievementList
│   │   └── LevelDisplay
│   └── Settings
│       ├── AudioControls
│       ├── DifficultySelector
│       └── ContentTypeSelector
└── Footer
    ├── NavigationTabs
    └── VersionInfo
```

## Data Models

### コンテンツデータ構造

```typescript
// 統一されたコンテンツインターフェース
interface BaseContent {
  id: number;
  text: string;
  reading: string;
  meaning: string;
  difficulty: '小学生' | '中学生' | '高校生';
  example_sentence: string;
  type: ContentType;
}

// ことわざ
interface Proverb extends BaseContent {
  type: 'proverb';
  origin?: string; // 由来
}

// 四字熟語
interface FourCharacterIdiom extends BaseContent {
  type: 'four_character_idiom';
  characters: string[]; // 各文字の詳細
}

// 慣用句
interface Idiom extends BaseContent {
  type: 'idiom';
  category: string; // 体の部位、動物など
}
```

### ゲームデータ構造

```typescript
interface GameSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  questions: QuizQuestion[];
  answers: UserAnswer[];
  score: number;
  monstersUnlocked: string[];
}

interface UserAnswer {
  questionId: number;
  selectedChoice: number;
  isCorrect: boolean;
  timeSpent: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: AchievementCondition;
  unlocked: boolean;
  dateUnlocked?: Date;
}
```

## Error Handling

### エラー分類と対応

1. **データ読み込みエラー**
   - JSONファイルの形式不正
   - ファイルの読み込み失敗
   - 対応: フォールバック用のデフォルトデータを使用

2. **ユーザー入力エラー**
   - 不正な選択肢の選択
   - 対応: 入力検証とユーザーフレンドリーなエラーメッセージ

3. **ストレージエラー**
   - localStorage容量不足
   - データの破損
   - 対応: データの圧縮とバックアップ機能

4. **パフォーマンスエラー**
   - メモリ不足
   - 処理の遅延
   - 対応: 遅延読み込みとデータの最適化

### エラーハンドリング戦略

```typescript
interface ErrorHandler {
  handleDataError(error: DataError): void;
  handleUserError(error: UserError): void;
  handleSystemError(error: SystemError): void;
  showUserFriendlyMessage(message: string): void;
}

// エラー境界コンポーネント
class GameErrorBoundary extends React.Component {
  // エラーをキャッチして適切に処理
}
```

## Testing Strategy

### テスト階層

1. **単体テスト** (Vitest)
   - コアロジックの関数テスト
   - データ変換処理のテスト
   - カバレッジ目標: 80%以上

2. **コンポーネントテスト** (React Testing Library)
   - UIコンポーネントの動作テスト
   - ユーザーインタラクションのテスト
   - アクセシビリティテスト

3. **統合テスト**
   - クイズフローの端到端テスト
   - データ永続化のテスト
   - エラーハンドリングのテスト

4. **ユーザビリティテスト**
   - 子どもの操作性テスト
   - レスポンシブデザインテスト
   - パフォーマンステスト

### テスト自動化

```typescript
// テスト例
describe('QuizEngine', () => {
  test('正しい選択肢を生成する', () => {
    const question = quizEngine.generateQuestion(sampleProverb);
    expect(question.choices).toHaveLength(4);
    expect(question.choices).toContain(sampleProverb.meaning);
  });

  test('正解判定が正しく動作する', () => {
    const result = quizEngine.checkAnswer(1, 0);
    expect(result).toBe(true);
  });
});
```

### パフォーマンス最適化

1. **コード分割**: React.lazy()による動的インポート
2. **メモ化**: React.memo()とuseMemo()の活用
3. **仮想化**: 大量のモンスターリスト表示の最適化
4. **画像最適化**: WebP形式とレスポンシブ画像
5. **キャッシュ戦略**: Service Workerによるオフライン対応

この設計により、拡張性と保守性を兼ね備えた、子どもにとって魅力的で教育的価値の高いゲームアプリケーションを構築できます。