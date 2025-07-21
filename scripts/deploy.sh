#!/bin/bash

# =====================================================
# ことだまモンスタークイズ デプロイスクリプト
# =====================================================

set -e  # エラーが発生したら即座に終了

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ロゴ表示
echo -e "${BLUE}"
echo "======================================"
echo " ことだまモンスタークイズ"
echo " デプロイスクリプト v1.0"
echo "======================================"
echo -e "${NC}"

# 使用方法の表示
usage() {
    echo "使用方法: $0 [オプション]"
    echo ""
    echo "オプション:"
    echo "  netlify     Netlifyにデプロイ"
    echo "  vercel      Vercelにデプロイ"
    echo "  build       ビルドのみ実行"
    echo "  test        テストとビルドを実行"
    echo "  clean       ビルド成果物をクリーン"
    echo "  help        このヘルプを表示"
    echo ""
    exit 1
}

# 環境チェック
check_environment() {
    echo -e "${YELLOW}環境をチェックしています...${NC}"
    
    # Node.jsバージョンチェック
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo -e "${RED}エラー: Node.js 18以上が必要です${NC}"
        exit 1
    fi
    
    # npm依存関係チェック
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}依存関係をインストールしています...${NC}"
        npm install
    fi
    
    echo -e "${GREEN}環境チェック完了！${NC}"
}

# テスト実行
run_tests() {
    echo -e "${YELLOW}テストを実行しています...${NC}"
    
    # TypeScriptの型チェック
    echo "TypeScript型チェック..."
    npx tsc --noEmit
    
    # 単体テスト
    echo "単体テストを実行..."
    npm run test -- --run
    
    echo -e "${GREEN}テスト完了！${NC}"
}

# ビルド実行
build_production() {
    echo -e "${YELLOW}プロダクションビルドを実行しています...${NC}"
    
    # 既存のビルドをクリーン
    rm -rf dist
    
    # ビルド実行
    npm run build:prod
    
    # ビルドサイズの表示
    echo -e "${BLUE}ビルドサイズ:${NC}"
    du -sh dist/
    
    echo -e "${GREEN}ビルド完了！${NC}"
}

# Netlifyデプロイ
deploy_netlify() {
    echo -e "${YELLOW}Netlifyにデプロイしています...${NC}"
    
    # Netlify CLIの存在確認
    if ! command -v netlify &> /dev/null; then
        echo -e "${RED}エラー: Netlify CLIがインストールされていません${NC}"
        echo "インストール: npm install -g netlify-cli"
        exit 1
    fi
    
    # デプロイ実行
    netlify deploy --prod --dir=dist
    
    echo -e "${GREEN}Netlifyデプロイ完了！${NC}"
}

# Vercelデプロイ
deploy_vercel() {
    echo -e "${YELLOW}Vercelにデプロイしています...${NC}"
    
    # Vercel CLIの存在確認
    if ! command -v vercel &> /dev/null; then
        echo -e "${RED}エラー: Vercel CLIがインストールされていません${NC}"
        echo "インストール: npm install -g vercel"
        exit 1
    fi
    
    # デプロイ実行
    vercel --prod
    
    echo -e "${GREEN}Vercelデプロイ完了！${NC}"
}

# クリーンアップ
clean_build() {
    echo -e "${YELLOW}ビルド成果物をクリーンアップしています...${NC}"
    npm run clean
    echo -e "${GREEN}クリーンアップ完了！${NC}"
}

# メイン処理
main() {
    case "$1" in
        netlify)
            check_environment
            run_tests
            build_production
            deploy_netlify
            ;;
        vercel)
            check_environment
            run_tests
            build_production
            deploy_vercel
            ;;
        build)
            check_environment
            build_production
            ;;
        test)
            check_environment
            run_tests
            build_production
            ;;
        clean)
            clean_build
            ;;
        help|--help|-h)
            usage
            ;;
        *)
            usage
            ;;
    esac
}

# スクリプト実行
main "$@"

echo -e "${GREEN}"
echo "======================================"
echo " 処理が完了しました！"
echo "======================================"
echo -e "${NC}"