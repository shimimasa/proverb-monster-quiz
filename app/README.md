# ことだまモンスタークイズ

<div align="center">
  <img src="./public/icon-512.png" alt="ことだまモンスターロゴ" width="200" />
  
  **日本語の知識を楽しく学べる教育ゲームアプリケーション**
  
  [![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com)
  [![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com)
  [![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
</div>

## 📖 概要

ことだまモンスタークイズは、子どもたちが楽しみながら日本語の知識（ことわざ、四字熟語、慣用句）を学習できる教育ゲームアプリケーションです。クイズに正解するとモンスターを獲得でき、コレクション要素によって学習意欲を持続させます。

### 主な特徴

- 🎯 **1,050問以上**の充実したコンテンツ
- 🎮 **ゲーミフィケーション**による楽しい学習体験
- 🏆 **ランキング機能**で友達と競争
- 📊 **詳細な学習統計**で進捗を可視化
- 🌙 **ダークモード**対応
- 📱 **レスポンシブデザイン**でどんなデバイスでも快適
- 🔊 **音声読み上げ機能**
- ♿ **アクセシビリティ**対応

## 🚀 クイックスタート

### 必要な環境

- Node.js 18.0.0 以上
- npm 9.0.0 以上

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/yourusername/proverb-monster-quiz.git
cd proverb-monster-quiz/app

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

開発サーバーが起動したら、ブラウザで http://localhost:5173 にアクセスしてください。

### ビルド

```bash
# プロダクションビルド
npm run build

# プロダクションビルド（最適化版）
npm run build:prod

# ビルド結果のプレビュー
npm run preview
```

## 📁 プロジェクト構造

```
app/
├── src/
│   ├── components/     # UIコンポーネント
│   ├── contexts/       # React Context
│   ├── core/          # コアビジネスロジック
│   ├── hooks/         # カスタムフック
│   ├── types/         # TypeScript型定義
│   └── utils/         # ユーティリティ関数
├── public/
│   └── data/         # ゲームデータ（JSON）
├── tests/            # テストファイル
└── docs/             # ドキュメント
```

## 🧪 テスト

```bash
# ユニットテストの実行
npm test

# カバレッジレポート付きテスト
npm run test:coverage

# E2Eテストの実行
npm run test:e2e

# UIモードでのテスト
npm run test:ui
```

## 📚 ドキュメント

詳細なドキュメントは `docs/` ディレクトリを参照してください：

- [ユーザーマニュアル](./docs/USER_MANUAL.md) - ゲームの遊び方
- [開発者ガイド](./docs/DEVELOPER_GUIDE.md) - 開発に参加する方法
- [運用ガイド](./docs/OPERATIONS_GUIDE.md) - デプロイと運用方法

### APIドキュメント

TypeDocによるAPIドキュメントの生成：

```bash
# APIドキュメントの生成
npm run docs:api

# ドキュメントサーバーの起動
npm run docs:serve
```

## 🛠️ 開発

### 環境変数

`.env.production` ファイルを作成し、必要な環境変数を設定してください：

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
# ... その他の設定
```

### コーディング規約

- ESLint と Prettier を使用したコード整形
- TypeScript の strict モードを有効化
- React Hooks のルールに従う
- コンポーネントは関数コンポーネントで記述

### コミット規約

```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: コードスタイル修正
refactor: リファクタリング
test: テスト追加・修正
chore: ビルド設定等
```

## 🚢 デプロイ

### GitHub Pages

```bash
npm run deploy:gh-pages
```

### Netlify

```bash
npm run deploy:netlify
```

### Vercel

```bash
npm run deploy:vercel
```

## 🤝 コントリビューション

プルリクエストを歓迎します！大きな変更を行う場合は、まずイシューを作成して変更内容について議論してください。

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細は [LICENSE](./LICENSE) ファイルを参照してください。

## 🙏 謝辞

- 日本語コンテンツの監修にご協力いただいた皆様
- オープンソースコミュニティ
- すべてのコントリビューターとテスター

## 📞 お問い合わせ

質問や提案がある場合は、[Issues](https://github.com/yourusername/proverb-monster-quiz/issues) でお知らせください。

---

<div align="center">
  Made with ❤️ by ことだまモンスター開発チーム
</div>