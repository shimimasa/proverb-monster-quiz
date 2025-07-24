# GitHub Pagesへのデプロイ手順

## 1. GitHubでリポジトリを作成

1. **GitHubにログイン**
   - https://github.com にアクセス
   - ログイン

2. **新しいリポジトリを作成**
   - 右上の「+」ボタン → 「New repository」をクリック
   - または https://github.com/new にアクセス

3. **リポジトリ設定**
   - **Repository name**: `proverb-monster-quiz`（または好きな名前）
   - **Description**: 「ことだまモンスタークイズ - 楽しく学べる日本語学習ゲーム」（任意）
   - **Public**を選択（GitHub Pagesは無料版ではPublicのみ）
   - **他のオプションはチェックしない**（READMEやライセンスは既にあるため）
   - 「Create repository」をクリック

## 2. ローカルリポジトリをGitHubに接続

GitHubでリポジトリを作成すると、以下のようなコマンドが表示されます：

```bash
git remote add origin https://github.com/YOUR_USERNAME/proverb-monster-quiz.git
git branch -M main
git push -u origin main
```

**YOUR_USERNAME**の部分を自分のGitHubユーザー名に置き換えて実行してください。

## 3. GitHub Pages用の設定

### vite.config.tsの修正が必要

GitHub Pagesでは、URLが `https://USERNAME.github.io/REPOSITORY_NAME/` となるため、
ベースパスの設定が必要です。

`vite.config.ts`に以下を追加：

```typescript
export default defineConfig({
  base: '/proverb-monster-quiz/', // リポジトリ名を指定
  // ... 他の設定
})
```

## 4. GitHub Actions用のデプロイワークフロー作成

`.github/workflows/deploy.yml`ファイルを作成：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build:prod
        
      - name: Setup Pages
        uses: actions/configure-pages@v4
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
          
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## 5. GitHub Pagesを有効化

1. GitHubリポジトリのページで「Settings」タブをクリック
2. 左メニューの「Pages」をクリック
3. **Source**で「GitHub Actions」を選択
4. 保存

## 6. 変更をプッシュ

```bash
git add .
git commit -m "Add GitHub Pages deployment configuration"
git push origin main
```

## 7. デプロイ状況の確認

1. GitHubリポジトリの「Actions」タブでデプロイの進行状況を確認
2. 成功すると、`https://YOUR_USERNAME.github.io/proverb-monster-quiz/` でアクセス可能

## 注意事項

- 初回デプロイには数分かかることがあります
- GitHub Pagesの反映には最大10分程度かかる場合があります
- 404エラーが出る場合は、少し待ってからアクセスしてください