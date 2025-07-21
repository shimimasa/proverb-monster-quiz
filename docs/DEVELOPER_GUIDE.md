# ことだまモンスタークイズ 開発者ガイド

## 目次

1. [アーキテクチャ概要](#アーキテクチャ概要)
2. [プロジェクト構造](#プロジェクト構造)
3. [主要コンポーネント](#主要コンポーネント)
4. [APIリファレンス](#apiリファレンス)
5. [開発ワークフロー](#開発ワークフロー)
6. [コーディング規約](#コーディング規約)
7. [テスト戦略](#テスト戦略)
8. [パフォーマンス最適化](#パフォーマンス最適化)
9. [コントリビューション](#コントリビューション)

## アーキテクチャ概要

### 技術スタック

```
Frontend Framework: React 18+ with TypeScript
Build Tool: Vite
Styling: Tailwind CSS + CSS Modules
Animation: Framer Motion
State Management: React Context API + useReducer
Data Persistence: localStorage
Testing: Vitest + React Testing Library + Playwright
Code Quality: ESLint + Prettier
```

### アーキテクチャパターン

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  React Components (Quiz, Monster, Stats, Settings)       │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│  Contexts (GameContext, AdminContext)                    │
│  Hooks (useAudio, useKeyboardNavigation)                │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                      Domain Layer                        │
│  Core Classes (ContentManager, QuizEngine,               │
│  MonsterManager, ProgressManager, AdminManager)          │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                 Infrastructure Layer                     │
│  Data Loaders, LocalStorage Manager, Audio Service       │
└─────────────────────────────────────────────────────────┘
```

### データフロー

1. **ユーザー操作** → React Component
2. **状態更新** → Context/Reducer
3. **ビジネスロジック** → Core Classes
4. **データ永続化** → LocalStorage
5. **UI更新** → React Re-render

## プロジェクト構造

```
proverb-monster-quiz/
├── app/
│   ├── src/
│   │   ├── components/      # UIコンポーネント
│   │   │   ├── admin/      # 管理者機能
│   │   │   ├── common/     # 共通コンポーネント
│   │   │   ├── export/     # エクスポート機能
│   │   │   ├── monster/    # モンスター関連
│   │   │   ├── quiz/       # クイズ関連
│   │   │   ├── ranking/    # ランキング
│   │   │   └── stats/      # 統計
│   │   ├── contexts/       # React Context
│   │   ├── core/          # コアビジネスロジック
│   │   ├── hooks/         # カスタムフック
│   │   ├── loaders/       # データローダー
│   │   ├── services/      # 外部サービス
│   │   ├── types/         # TypeScript型定義
│   │   └── utils/         # ユーティリティ
│   ├── public/
│   │   └── data/         # JSONデータファイル
│   ├── tests/           # テストファイル
│   ├── docs/           # ドキュメント
│   └── _docs/          # 実装ログ
```

## 主要コンポーネント

### Core Classes

#### ContentManager
コンテンツ（ことわざ、四字熟語、慣用句）の管理を担当。

```typescript
class ContentManager {
  async loadContent(type: ContentType): Promise<void>
  getRandomContent(type: ContentType, difficulty?: Difficulty): ContentItem
  generateChoices(correct: ContentItem, count: number): string[]
  getAllContent(type: ContentType): ContentItem[]
  getContentStats(type: ContentType): ContentStats
}
```

#### QuizEngine
クイズロジックの実装。

```typescript
class QuizEngine {
  generateQuestion(contentItem: ContentItem): QuizQuestion
  checkAnswer(questionId: number, selectedChoice: number): boolean
  getChoicesWithIndices(choices: string[]): ChoiceWithIndex[]
}
```

#### MonsterManager
モンスターコレクションの管理。

```typescript
class MonsterManager {
  generateMonsterFromContent(content: ContentItem): Monster
  unlockMonster(monster: Monster): void
  getCollection(): Monster[]
  getCollectionStats(): { total: number; unlocked: number; byRarity: ... }
}
```

#### ProgressManager
ユーザーの進捗管理。

```typescript
class ProgressManager {
  updateProgress(isCorrect: boolean, question: QuizQuestion): void
  getProgress(): UserProgress
  checkAchievements(): Achievement[]
  calculateLevel(experience: number): number
}
```

### React Components

#### 主要コンポーネントの責務

- **App.tsx**: アプリケーションのエントリーポイント
- **GameContext**: グローバル状態管理
- **QuizScreen**: クイズ画面の実装
- **MonsterCollection**: モンスター図鑑
- **StatsScreen**: 統計情報表示
- **SettingsScreen**: 設定画面

### カスタムフック

#### useAudio
音声機能の管理。

```typescript
const useAudio = () => {
  playSound(type: SoundEffectType): void
  speak(text: string, options?: SpeechOptions): void
  stopSpeaking(): void
}
```

#### useKeyboardNavigation
キーボード操作のサポート。

```typescript
const useKeyboardNavigation = () => {
  isKeyboardNavigation: boolean
  // キーボード操作の検出とスタイル適用
}
```

## APIリファレンス

### 型定義

#### ContentItem
```typescript
interface ContentItem {
  id: number
  text: string
  reading: string
  meaning: string
  difficulty: Difficulty
  example_sentence?: string
  type: ContentType
}
```

#### Monster
```typescript
interface Monster {
  id: string
  name: string
  image: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  sourceContent: ContentItem
  unlocked: boolean
  dateObtained?: Date
}
```

#### UserProgress
```typescript
interface UserProgress {
  level: number
  experience: number
  totalQuestions: number
  correctAnswers: number
  streak: number
  maxStreak: number
  achievements: Achievement[]
  settings: GameSettings
}
```

### Context API

#### GameContext
```typescript
interface GameContextType {
  // 状態
  currentQuestion: QuizQuestion | null
  isLoading: boolean
  error: Error | null
  
  // マネージャー
  contentManager: ContentManager
  quizEngine: QuizEngine
  monsterManager: MonsterManager
  progressManager: ProgressManager
  
  // アクション
  loadNewQuestion: (type?: ContentType) => Promise<void>
  answerQuestion: (selectedChoice: number) => void
  resetQuiz: () => void
}
```

## 開発ワークフロー

### 環境セットアップ

```bash
# リポジトリのクローン
git clone https://github.com/your-org/proverb-monster-quiz.git
cd proverb-monster-quiz/app

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# テストの実行
npm run test

# ビルド
npm run build
```

### 開発サーバー

- URL: http://localhost:5173
- ホットリロード対応
- TypeScriptの型チェック

### ブランチ戦略

```
main
  ├── develop
  │   ├── feature/feature-name
  │   ├── fix/bug-description
  │   └── refactor/component-name
  └── release/v1.0.0
```

### コミットメッセージ

```
feat: 新機能の追加
fix: バグの修正
refactor: リファクタリング
test: テストの追加・修正
docs: ドキュメントの更新
style: コードスタイルの修正
chore: ビルド設定等の変更
```

## コーディング規約

### TypeScript

```typescript
// 1. インターフェースは I プレフィックスなし
interface User {  // Good
interface IUser { // Bad

// 2. 型は Type サフィックスなし
type ContentCategory = 'proverb' | 'idiom'  // Good
type ContentCategoryType = ...               // Bad

// 3. Enum は PascalCase
enum Difficulty {
  Easy = '小学生',
  Medium = '中学生',
  Hard = '高校生'
}

// 4. 関数は動詞で始める
function calculateScore() {}  // Good
function score() {}          // Bad
```

### React

```typescript
// 1. 関数コンポーネントを使用
const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  return <div>...</div>
}

// 2. カスタムフックは use で始める
const useCustomHook = () => {
  // ...
}

// 3. イベントハンドラは handle で始める
const handleClick = () => {
  // ...
}

// 4. Props の型定義は別途定義
interface MyComponentProps {
  title: string
  onClose: () => void
}
```

### ファイル構成

```typescript
// Component.tsx の構成
import React from 'react'              // 1. React
import { motion } from 'framer-motion' // 2. 外部ライブラリ
import { useGame } from '@contexts'    // 3. 内部モジュール
import type { ContentItem } from '@types' // 4. 型定義

interface Props {                      // 5. Props定義
  // ...
}

export const Component: React.FC<Props> = (props) => { // 6. コンポーネント
  // ...
}
```

## テスト戦略

### テストの種類

#### 単体テスト（Unit Tests）
```typescript
// core/ContentManager.test.ts
describe('ContentManager', () => {
  test('should load content successfully', async () => {
    const manager = new ContentManager()
    await manager.loadContent('proverb')
    expect(manager.getAllContent('proverb')).toHaveLength(50)
  })
})
```

#### 統合テスト（Integration Tests）
```typescript
// integration/GameFlow.test.tsx
test('complete quiz flow', async () => {
  render(<App />)
  // クイズ開始 → 回答 → モンスター獲得
})
```

#### E2Eテスト（End-to-End Tests）
```typescript
// e2e/quiz-flow.spec.ts
test('user can complete a quiz', async ({ page }) => {
  await page.goto('/')
  await page.click('text=クイズを始める')
  // ...
})
```

### テストカバレッジ目標

- 単体テスト: 80%以上
- 統合テスト: 主要フロー
- E2Eテスト: クリティカルパス

## パフォーマンス最適化

### コード分割

```typescript
// 動的インポート
const AdminPanel = lazy(() => import('./components/admin/AdminPanel'))

// 使用箇所
<Suspense fallback={<LoadingScreen />}>
  <AdminPanel />
</Suspense>
```

### メモ化

```typescript
// React.memo
export const ExpensiveComponent = React.memo(({ data }) => {
  // ...
})

// useMemo
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data)
}, [data])
```

### 画像最適化

```typescript
// 遅延読み込み
<img loading="lazy" src={monsterImage} />

// WebP形式の使用
<picture>
  <source srcSet="monster.webp" type="image/webp" />
  <img src="monster.png" />
</picture>
```

### バンドルサイズ

```javascript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom'],
        'framer-motion': ['framer-motion'],
        'recharts': ['recharts'],
      }
    }
  }
}
```

## コントリビューション

### 貢献方法

1. **Issue の作成**
   - バグ報告
   - 機能提案
   - 質問

2. **Pull Request**
   - Fork してブランチ作成
   - コードの変更
   - テストの追加
   - PR の作成

### PR チェックリスト

- [ ] コードがビルドできる
- [ ] すべてのテストが通る
- [ ] 新機能にはテストを追加
- [ ] ドキュメントを更新
- [ ] コミットメッセージが規約に従っている

### レビュープロセス

1. 自動テストの実行
2. コードレビュー
3. 修正対応
4. マージ

### ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

---

**最終更新日**: 2025年1月21日  
**バージョン**: 1.0.0

質問や提案がある場合は、GitHub の Issue でお知らせください。