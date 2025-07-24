# 2025-01-21 GitHub Pages デプロイ作業

## 概要

ことだまモンスタークイズをGitHub Pagesにデプロイし、発生した問題を解決して、正常に動作するようになるまでの作業記録です。

## 実施した作業

### 1. デプロイ検証準備

#### 環境確認
- Node.js v22.17.0（要件: 18以上）✅
- npm 10.9.2（要件: 8以上）✅
- 288個のパッケージがインストール済み ✅

#### 開発サーバーでの動作確認
- `npm run dev` で開発サーバー起動
- http://localhost:5173/ で正常動作を確認

#### プロダクションビルド
初回ビルド時に以下のパッケージが不足していたため追加：
- `@tailwindcss/postcss`
- `date-fns`
- `terser`

### 2. GitHub Pagesへのデプロイ

#### リポジトリ作成
- GitHubユーザー: shimimasa
- リポジトリ名: proverb-monster-quiz
- URL: https://github.com/shimimasa/proverb-monster-quiz

#### デプロイ設定
1. **Vite設定の修正**
   - `vite.config.ts`と`vite.config.prod.ts`に`base: '/proverb-monster-quiz/'`を追加
   - GitHub Pagesのサブディレクトリ配信に対応

2. **デプロイツールの設定**
   - `gh-pages`パッケージをインストール
   - `package.json`に`deploy:gh-pages`スクリプトを追加
   - GitHubトークンを使用した認証設定

3. **デプロイ実行**
   ```bash
   npm run deploy:gh-pages
   ```

### 3. 発生した問題と解決

#### 問題1: LocalStorageアクセスエラー
**エラー内容**: `j.get is not a function`

**原因**: RankingManagerがlocalStorageManagerの`get`メソッドを呼び出していたが、該当メソッドが存在しなかった

**解決策**: localStorageManager.tsに汎用的な`get`と`set`メソッドを追加
```typescript
get(key: string): string | null {
  if (!this.isAvailable()) {
    return null;
  }
  try {
    const fullKey = this.prefix + key;
    return localStorage.getItem(fullKey);
  } catch (error) {
    console.error(`Failed to get data for key: ${key}`, error);
    return null;
  }
}

set(key: string, value: string): void {
  if (!this.isAvailable()) {
    throw new StorageError('LocalStorage is not available');
  }
  try {
    const fullKey = this.prefix + key;
    localStorage.setItem(fullKey, value);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw new StorageQuotaError('LocalStorage quota exceeded');
    }
    throw new StorageError(`Failed to save data for key: ${key}`, error);
  }
}
```

#### 問題2: JSONファイルの404エラー
**エラー内容**: data/proverbs.json, data/idioms.json, data/four_character_idioms.jsonが404エラー

**原因**: GitHub Pagesでは`/data/`ではなく`/proverb-monster-quiz/data/`のパスが必要

**解決策**: dataLoader.tsのbaseUrlを修正
```typescript
constructor(baseUrl: string = import.meta.env.BASE_URL + 'data/') {
  this.baseUrl = baseUrl;
}
```

#### 問題3: getLevelProgressメソッドが存在しない
**エラー内容**: `t.getLevelProgress is not a function`

**原因**: ProgressBarコンポーネントが期待する`getLevelProgress`メソッドがProgressManagerクラスに存在しなかった

**解決策**: ProgressManager.tsに`getLevelProgress`メソッドを追加
```typescript
getLevelProgress(): { currentExp: number; expForNext: number; progressPercentage: number } {
  const expInfo = this.getExperienceForNextLevel();
  return {
    currentExp: expInfo.current,
    expForNext: expInfo.required,
    progressPercentage: expInfo.percentage,
  };
}
```

#### 問題4: エラー詳細が表示されない
**問題**: 本番環境でエラーの詳細が表示されず、デバッグが困難

**解決策**: ErrorBoundary.tsxを修正
- `process.env.NODE_ENV === 'development'`の条件を削除
- ホームボタンのパスを`import.meta.env.BASE_URL`に修正

### 4. 最終的な成果

- **公開URL**: https://shimimasa.github.io/proverb-monster-quiz/
- **ステータス**: 正常に動作 ✅
- **主要機能**:
  - クイズゲームの開始と進行
  - モンスターコレクション
  - 統計情報の表示
  - ランキング機能
  - 管理者機能（フッター5回クリックでアクセス）

## 技術的な学び

### GitHub Pages特有の注意点
1. **ベースパスの設定**: サブディレクトリでの配信には`base`設定が必須
2. **静的ファイルのパス**: 相対パスではなく、ベースURLを含む絶対パスが必要
3. **環境変数**: `import.meta.env.BASE_URL`を活用してパスを動的に設定

### Viteビルドの注意点
1. **必須パッケージ**: terserは別途インストールが必要（Vite v3以降）
2. **PostCSS設定**: TailwindCSSの最新版では`@tailwindcss/postcss`が必要

## 今後の作業

### 短期的な改善（1-2週間）
1. **タイトルとファビコンの更新**
   - 現在「Vite + React + TS」となっているタイトルを「ことだまモンスタークイズ」に変更
   - オリジナルのファビコンを作成

2. **パフォーマンス最適化**
   - 画像の遅延読み込み実装
   - モンスター画像の最適化
   - Service Workerの実装によるオフライン対応

3. **SEO対策**
   - メタタグの追加
   - OGP設定
   - sitemap.xmlの生成

### 中期的な改善（1-2ヶ月）
1. **CI/CD パイプラインの構築**
   - GitHub Actionsでの自動テスト
   - mainブランチへのプッシュで自動デプロイ
   - プルリクエストのプレビューデプロイ

2. **監視とアナリティクス**
   - Google Analytics 4の導入
   - エラー監視（Sentry）の設定
   - パフォーマンス監視の実装

3. **コンテンツの拡充**
   - モンスター画像の追加（現在プレースホルダー）
   - 新しいことわざ・四字熟語・慣用句の追加
   - 季節イベントコンテンツの準備

### 長期的な展望（3ヶ月以降）
1. **マルチプラットフォーム対応**
   - PWA化によるアプリライクな体験
   - デスクトップアプリ版（Electron）
   - モバイルアプリ版（React Native）

2. **オンライン機能**
   - ユーザー登録・ログイン機能
   - クラウドセーブ
   - グローバルランキング
   - フレンド機能

3. **教育機能の強化**
   - 学習進捗の詳細分析
   - 個別最適化された問題出題
   - 保護者向けダッシュボード

## デプロイ手順（メンテナンス用）

### 通常の更新
```bash
# 1. 変更をコミット
git add -A
git commit -m "Update: 変更内容"
git push origin main

# 2. GitHub Pagesを更新
npm run deploy:gh-pages
```

### トラブルシューティング
```bash
# キャッシュクリア
npm run clean

# 依存関係の再インストール
rm -rf node_modules package-lock.json
npm install

# ビルドエラーの詳細確認
npm run build:prod -- --debug
```

## まとめ

ことだまモンスタークイズのGitHub Pagesデプロイが完了し、世界中からアクセス可能な状態になりました。いくつかの技術的な課題はありましたが、すべて解決され、安定して動作しています。

今後は、ユーザー体験の向上とコンテンツの充実に注力し、より多くの子どもたちが楽しみながら日本語を学べるアプリケーションに育てていきます。