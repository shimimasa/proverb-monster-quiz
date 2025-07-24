#!/bin/bash
# GitHub Pages手動デプロイスクリプト

# エラーが発生したら停止
set -e

echo "🏗️ Building project..."
npm run build:prod

echo "📁 Creating gh-pages branch..."
# gh-pagesブランチがある場合は削除
git branch -D gh-pages 2>/dev/null || true

# 新しいgh-pagesブランチを作成
git checkout -b gh-pages

# distフォルダの内容をルートにコピー
cp -r dist/* .

# .gitignoreを一時的に無効化してdistの内容をコミット
echo "" > .gitignore

# すべてのファイルを追加
git add -A
git commit -m "Deploy to GitHub Pages"

echo "🚀 Pushing to GitHub..."
# gh-pagesブランチをプッシュ
git push origin gh-pages --force

# mainブランチに戻る
git checkout main

echo "✅ Deployment complete!"
echo "📌 Next steps:"
echo "1. Go to https://github.com/shimimasa/proverb-monster-quiz/settings/pages"
echo "2. Under 'Source', select 'Deploy from a branch'"
echo "3. Select 'gh-pages' branch and '/ (root)' folder"
echo "4. Click 'Save'"
echo "5. Wait a few minutes and visit: https://shimimasa.github.io/proverb-monster-quiz/"