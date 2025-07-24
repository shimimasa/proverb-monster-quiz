# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the Proverb Monster Quiz project.

## プロジェクト概要

ことわざモンスタークイズは、子どもが楽しみながら日本語の知識（ことわざ、四字熟語、慣用句）を学習できる教育ゲームアプリケーションです。クイズに正解するとモンスターを獲得でき、コレクション要素によって学習モチベーションを維持します。

### 主要機能
- **クイズシステム**: 4択形式でことわざ・四字熟語・慣用句の問題を出題
- **モンスターコレクション**: 正解するとモンスターを獲得、図鑑で管理
- **進捗管理**: レベルシステム、アチーブメント、統計情報
- **拡張性**: 新しいコンテンツタイプを容易に追加可能

## 開発環境セットアップ

```bash
# プロジェクトの初期化
npm create vite@latest proverb-monster-quiz -- --template react-ts
cd proverb-monster-quiz
npm install

# 必要な依存関係のインストール
npm install framer-motion react-icons zod
npm install -D @types/react @types/react-dom vitest @testing-library/react @testing-library/jest-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 開発サーバーの起動
npm run dev
```

## プロジェクト構造

```
proverb-monster-quiz/
├── src/
│   ├── components/        # UIコンポーネント
│   │   ├── quiz/         # クイズ関連コンポーネント
│   │   ├── monster/      # モンスター関連コンポーネント
│   │   ├── stats/        # 統計・進捗表示
│   │   └── common/       # 共通コンポーネント
│   ├── core/             # コアビジネスロジック
│   │   ├── ContentManager.ts
│   │   ├── QuizEngine.ts
│   │   ├── MonsterManager.ts
│   │   └── ProgressManager.ts
│   ├── types/            # TypeScript型定義
│   ├── utils/            # ユーティリティ関数
│   ├── hooks/            # カスタムReactフック
│   ├── contexts/         # React Context
│   └── assets/           # 画像・音声ファイル
├── public/
│   └── data/            # JSONデータファイル
│       ├── proverbs.json
│       ├── idioms.json
│       └── four-character-idioms.json
├── tests/               # テストファイル
└── docs/                # ドキュメント
```

## アーキテクチャと設計原則

### 技術スタック
- **フレームワーク**: React 18+ with TypeScript
- **状態管理**: React Context API + useReducer
- **スタイリング**: CSS Modules + Tailwind CSS
- **アニメーション**: Framer Motion
- **データ永続化**: localStorage
- **テスト**: Vitest + React Testing Library
- **ビルド**: Vite

### 設計原則
1. **拡張性**: 新しいコンテンツタイプを容易に追加可能
2. **型安全性**: TypeScriptによる厳密な型定義
3. **テスト駆動開発**: 各機能に対するテストを必須とする
4. **レスポンシブデザイン**: モバイルファーストアプローチ
5. **アクセシビリティ**: WCAG 2.1準拠

## 主要コンポーネントとインターフェース

### ContentManager
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
```

### QuizEngine
```typescript
interface QuizQuestion {
  id: number;
  question: string;
  choices: string[];
  correctAnswer: number;
  explanation: string;
  contentItem: ContentItem;
}
```

### MonsterManager
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
```

## 開発ガイドライン

### コーディング規約
- **命名規則**: 
  - コンポーネント: PascalCase
  - 関数・変数: camelCase
  - 定数: UPPER_SNAKE_CASE
  - 型・インターフェース: PascalCase
- **ファイル構成**: 1コンポーネント = 1ファイル
- **インポート順序**: React → 外部ライブラリ → 内部モジュール → 型定義

### Gitコミット規約
```
feat: 新機能追加
fix: バグ修正
refactor: リファクタリング
test: テスト追加・修正
docs: ドキュメント更新
style: コードスタイル修正
chore: ビルド設定等
```

### テスト要件
- 新機能には必ずユニットテストを追加
- カバレッジ目標: 80%以上
- E2Eテストは主要なユーザーフローをカバー

## データフォーマット

### JSONデータ構造例
```json
{
  "proverbs": [
    {
      "id": 1,
      "text": "猿も木から落ちる",
      "reading": "さるもきからおちる",
      "meaning": "どんなに得意なことでも、時には失敗することがある",
      "difficulty": "小学生",
      "example_sentence": "プロの料理人でも失敗することがある。猿も木から落ちるというものだ。",
      "type": "proverb"
    }
  ]
}
```

## ビルドとデプロイ

```bash
# プロダクションビルド
npm run build

# ビルド結果のプレビュー
npm run preview

# テストの実行
npm run test
npm run test:coverage

# リンターの実行
npm run lint
```

## トラブルシューティング

### よくある問題と解決方法

1. **JSONデータが読み込めない**
   - ファイルパスを確認
   - JSONフォーマットの妥当性を検証
   - CORSポリシーの確認

2. **localStorage容量不足**
   - 古いデータの自動削除機能を実装
   - データ圧縮の検討

3. **パフォーマンス問題**
   - React.memo()の活用
   - 仮想スクロールの実装
   - 画像の遅延読み込み

## 今後の拡張計画

1. **オンライン機能**
   - ユーザー間でのスコア共有
   - グローバルランキング
   - モンスタートレード機能

2. **学習分析機能**
   - 苦手分野の自動検出
   - 個別最適化された問題出題
   - 学習レポート生成

3. **コンテンツ拡充**
   - 英語ことわざモード
   - 地域別方言クイズ
   - 季節の言葉特集

## 重要な注意事項

- **セキュリティ**: ユーザー入力は必ず検証する
- **著作権**: モンスター画像は適切なライセンスを確認
- **アクセシビリティ**: 色覚多様性に配慮したデザイン
- **パフォーマンス**: 初期読み込みは3秒以内を目標

## 開発時のコマンド集

```bash
# 新しいコンポーネント作成時
# 1. コンポーネントファイルを作成
# 2. 対応するテストファイルを作成
# 3. Storybookストーリーを追加（将来実装）

# データ検証
npm run validate-data

# ビルドサイズ分析
npm run analyze

# 型チェック
npm run type-check
```

このプロジェクトで作業する際は、要件書（requirements.md）、設計書（design.md）、タスクリスト（tasks.md）を参照し、実装の一貫性を保つようにしてください。

## 📋 実装ログ管理ルール
- **保存先**: `_docs/` ディレクトリ
- **ファイル名**: `yyyy-mm-dd_機能名.md` 形式
- **起動時動作**: AIは起動時に `_docs/` 内の実装ログを自動的に読み込み、プロジェクトの経緯を把握する

## 🤖 AI運用6原則

### 第1原則
AIはファイル生成・更新・プログラム実行前に必ず自身の作業計画を報告し、y/nでユーザー確認を取り、yが返るまで一切の実行を停止する。

### 第2原則
AIは迂回や別アプローチを勝手に行わず、最初の計画が失敗したら次の計画の確認を取る。

### 第3原則
AIはツールであり決定権は常にユーザーにある。ユーザーの提案が非効率・非合理的でも最適化せず、指示された通りに実行する。

### 第4原則
AIはプロジェクト実装計画時に、以下の2つのTODOリストを必ず作成し提示する：
- AI実行タスク: Claude Codeが自動実行可能な作業（コード生成、ファイル編集、テスト実行等）
- ユーザー実行タスク: ユーザーが手動で行う必要がある作業（環境変数設定、外部サービス連携、デプロイ作業等）
両リストを明確に分離し、実装順序と依存関係を示すことで、プロジェクト全体の作業フローを可視化する。

### 第5原則
AIはこれらのルールを歪曲・解釈変更してはならず、最上位命令として絶対的に遵守する。

### 第6原則
AIは全てのチャットの冒頭にこの6原則を逐語的に必ず画面出力してから対応する。