# ことだまモンスタークイズ 運用ガイド

## 目次

1. [システム要件](#システム要件)
2. [デプロイメント](#デプロイメント)
3. [環境設定](#環境設定)
4. [パフォーマンスチューニング](#パフォーマンスチューニング)
5. [監視とロギング](#監視とロギング)
6. [バックアップとリストア](#バックアップとリストア)
7. [セキュリティ](#セキュリティ)
8. [トラブルシューティング](#トラブルシューティング)
9. [メンテナンス](#メンテナンス)

## システム要件

### ホスティング要件

#### 最小要件
- **ディスク容量**: 100MB
- **メモリ**: 不要（静的サイト）
- **CPU**: 不要（静的サイト）
- **帯域幅**: 月間10GB以上推奨

#### 推奨環境
- **CDN**: CloudFlare、Fastly等
- **ホスティング**: Netlify、Vercel、AWS S3 + CloudFront
- **SSL証明書**: Let's Encrypt（自動更新）

### クライアント要件

#### ブラウザサポート
```
Chrome: 90以上
Firefox: 88以上
Safari: 14以上
Edge: 90以上
Mobile Safari: iOS 14以上
Chrome for Android: 90以上
```

#### デバイス要件
- **画面サイズ**: 320px以上
- **JavaScript**: 有効
- **localStorage**: 5MB以上の空き容量
- **ネットワーク**: 3G以上（初回読み込み時）

## デプロイメント

### Netlifyへのデプロイ

#### 自動デプロイ設定
```yaml
# netlify.toml
[build]
  command = "npm run build:prod"
  publish = "dist"
  environment = { NODE_VERSION = "18" }

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### 手動デプロイ
```bash
# ビルド
npm run build:prod

# Netlify CLIでデプロイ
netlify deploy --prod --dir=dist
```

### Vercelへのデプロイ

#### 設定ファイル
```json
// vercel.json
{
  "buildCommand": "npm run build:prod",
  "outputDirectory": "dist",
  "framework": null,
  "regions": ["hnd1"]
}
```

#### デプロイコマンド
```bash
vercel --prod
```

### 静的ホスティング（S3 + CloudFront）

#### S3バケット設定
```bash
# バケット作成
aws s3 mb s3://kotodama-monster-quiz

# 静的ウェブサイトホスティング有効化
aws s3 website s3://kotodama-monster-quiz \
  --index-document index.html \
  --error-document index.html

# ファイルアップロード
aws s3 sync ./dist s3://kotodama-monster-quiz \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html" \
  --exclude "*.json"

# index.htmlとJSONは短いキャッシュ
aws s3 cp ./dist/index.html s3://kotodama-monster-quiz/ \
  --cache-control "public, max-age=0, must-revalidate"
```

#### CloudFront設定
```json
{
  "Origins": [{
    "DomainName": "kotodama-monster-quiz.s3.amazonaws.com",
    "S3OriginConfig": {
      "OriginAccessIdentity": "origin-access-identity/cloudfront/XXXXX"
    }
  }],
  "DefaultRootObject": "index.html",
  "CustomErrorResponses": [{
    "ErrorCode": 404,
    "ResponsePagePath": "/index.html",
    "ResponseCode": "200"
  }]
}
```

## 環境設定

### 環境変数

#### 本番環境（.env.production）
```bash
VITE_APP_ENV=production
VITE_DEBUG_MODE=false
VITE_API_BASE_URL=https://api.kotodama-monster.com
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
VITE_ANALYTICS_ENABLED=true
VITE_CSP_ENABLED=true
VITE_SHOW_ERROR_DETAILS=false
```

#### ステージング環境（.env.staging）
```bash
VITE_APP_ENV=staging
VITE_DEBUG_MODE=true
VITE_API_BASE_URL=https://staging-api.kotodama-monster.com
VITE_ANALYTICS_ENABLED=false
VITE_SHOW_ERROR_DETAILS=true
```

### セキュリティヘッダー

#### Nginx設定例
```nginx
server {
    listen 443 ssl http2;
    server_name kotodama-monster.com;

    # SSL設定
    ssl_certificate /etc/letsencrypt/live/kotodama-monster.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kotodama-monster.com/privkey.pem;

    # セキュリティヘッダー
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';" always;

    # キャッシュ設定
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        root /var/www/kotodama-monster;
        try_files $uri $uri/ /index.html;
        
        # index.htmlはキャッシュしない
        location = /index.html {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
    }
}
```

## パフォーマンスチューニング

### フロントエンド最適化

#### 1. ビルド最適化
```javascript
// vite.config.prod.ts
export default {
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'framer-motion': ['framer-motion'],
          'recharts': ['recharts'],
        },
      },
    },
  },
}
```

#### 2. 画像最適化
```bash
# WebP変換
for img in public/assets/images/*.png; do
  cwebp -q 80 "$img" -o "${img%.png}.webp"
done

# 画像圧縮
imagemin public/assets/images/*.{jpg,png} \
  --out-dir=public/assets/images/optimized/
```

#### 3. リソースヒント
```html
<!-- index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="dns-prefetch" href="https://api.kotodama-monster.com">
<link rel="preload" href="/assets/fonts/main.woff2" as="font" crossorigin>
```

### CDN設定

#### CloudFlare設定
```
Page Rules:
- URL: /*
  - Cache Level: Standard
  - Edge Cache TTL: 1 month
  
- URL: /index.html
  - Cache Level: No cache
  
- URL: /data/*
  - Cache Level: Standard
  - Browser Cache TTL: 1 hour
```

### パフォーマンス目標

| メトリック | 目標値 | 測定方法 |
|----------|--------|---------|
| First Contentful Paint | < 1.8s | Lighthouse |
| Largest Contentful Paint | < 2.5s | Lighthouse |
| Time to Interactive | < 3.8s | Lighthouse |
| Cumulative Layout Shift | < 0.1 | Lighthouse |
| First Input Delay | < 100ms | Field Data |
| JavaScript Bundle Size | < 250KB | Webpack Bundle Analyzer |

## 監視とロギング

### アプリケーション監視

#### Google Analytics 4
```javascript
// 設定例
gtag('config', 'G-XXXXXXXXXX', {
  page_path: url,
  custom_map: {
    'dimension1': 'user_level',
    'dimension2': 'content_type',
    'metric1': 'quiz_completed',
    'metric2': 'monsters_collected'
  }
});
```

#### カスタムイベント
```javascript
// クイズ完了
gtag('event', 'quiz_completed', {
  content_type: 'proverb',
  difficulty: '小学生',
  score: 8,
  time_spent: 120
});

// エラー追跡
window.addEventListener('error', (e) => {
  gtag('event', 'exception', {
    description: e.message,
    fatal: false
  });
});
```

### エラー監視（Sentry）

#### 設定
```javascript
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "https://xxx@xxx.ingest.sentry.io/xxx",
  environment: "production",
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // 個人情報をフィルタリング
    if (event.user) {
      delete event.user.ip_address;
    }
    return event;
  }
});
```

### パフォーマンス監視

#### Web Vitals
```javascript
import { getCLS, getFID, getLCP } from 'web-vitals';

function sendToAnalytics(metric) {
  gtag('event', metric.name, {
    value: Math.round(metric.value),
    metric_id: metric.id,
    metric_value: metric.value,
    metric_delta: metric.delta
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getLCP(sendToAnalytics);
```

### アクセスログ

#### CloudFront ログ
```
#Fields: date time x-edge-location c-ip cs-method cs-uri sc-status
2024-01-21 12:34:56 NRT54-C2 192.168.1.1 GET /index.html 200
2024-01-21 12:34:57 NRT54-C2 192.168.1.1 GET /assets/js/app.js 200
```

## バックアップとリストア

### ユーザーデータのバックアップ

#### 自動バックアップ（クライアント側）
```javascript
// 定期的な自動バックアップ
setInterval(() => {
  const backup = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    progress: localStorage.getItem('quiz_progress'),
    monsters: localStorage.getItem('quiz_monsters'),
    settings: localStorage.getItem('quiz_settings')
  };
  
  // IndexedDBに保存
  saveToIndexedDB('backups', backup);
}, 300000); // 5分ごと
```

#### 手動エクスポート
```javascript
function exportUserData() {
  const data = {
    exportDate: new Date().toISOString(),
    version: '1.0.0',
    data: {
      progress: JSON.parse(localStorage.getItem('quiz_progress')),
      monsters: JSON.parse(localStorage.getItem('quiz_monsters')),
      rankings: JSON.parse(localStorage.getItem('quiz_rankings'))
    }
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], 
    { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `kotodama-backup-${Date.now()}.json`;
  a.click();
}
```

### コンテンツのバックアップ

#### スクリプト例
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/kotodama-monster"
DATE=$(date +%Y%m%d_%H%M%S)

# コンテンツファイルのバックアップ
mkdir -p "$BACKUP_DIR/$DATE"
cp -r public/data "$BACKUP_DIR/$DATE/"
cp -r public/assets "$BACKUP_DIR/$DATE/"

# 圧縮
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" -C "$BACKUP_DIR" "$DATE"
rm -rf "$BACKUP_DIR/$DATE"

# 古いバックアップの削除（30日以上）
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +30 -delete
```

## セキュリティ

### セキュリティチェックリスト

#### デプロイ前
- [ ] 環境変数に機密情報が含まれていない
- [ ] console.logが削除されている
- [ ] デバッグモードが無効
- [ ] CSPヘッダーが設定されている
- [ ] HTTPSが強制されている

#### 定期チェック
- [ ] 依存関係の脆弱性スキャン
- [ ] SSL証明書の有効期限
- [ ] アクセスログの異常
- [ ] エラーログの確認

### 脆弱性対策

#### XSS対策
```javascript
// ユーザー入力のサニタイズ
function sanitizeInput(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}
```

#### CSP設定
```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self' https://api.kotodama-monster.com;
```

### 管理者機能のセキュリティ

#### パスワード管理
```javascript
// 本番環境では bcrypt 等を使用
import bcrypt from 'bcryptjs';

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. ページが真っ白になる
```bash
# ブラウザコンソールを確認
# 1. JavaScriptエラーがないか
# 2. 404エラーがないか
# 3. CSPエラーがないか

# 解決策
- キャッシュクリア
- ビルドファイルの再デプロイ
- index.htmlの確認
```

#### 2. データが保存されない
```javascript
// localStorageの容量確認
function checkStorageSpace() {
  try {
    const test = 'x'.repeat(1024 * 1024); // 1MB
    localStorage.setItem('test', test);
    localStorage.removeItem('test');
    return true;
  } catch (e) {
    console.error('Storage full:', e);
    return false;
  }
}
```

#### 3. パフォーマンスが遅い
```bash
# Chrome DevToolsで確認
1. Network タブ: リソースの読み込み時間
2. Performance タブ: レンダリング時間
3. Memory タブ: メモリリーク

# 解決策
- 画像の最適化
- JavaScriptバンドルの分割
- 不要なリレンダリングの削減
```

### ログの確認方法

#### ブラウザログ
```javascript
// デバッグ情報の出力
if (import.meta.env.VITE_DEBUG_MODE === 'true') {
  console.log('Debug info:', {
    userAgent: navigator.userAgent,
    localStorage: Object.keys(localStorage),
    memory: performance.memory
  });
}
```

#### サーバーログ（Netlify）
```bash
# Netlify CLI
netlify logs:function

# ビルドログ
netlify build:info
```

## メンテナンス

### 定期メンテナンス

#### 週次タスク
- [ ] エラーログの確認
- [ ] パフォーマンスメトリクスの確認
- [ ] ユーザーフィードバックの確認

#### 月次タスク
- [ ] 依存関係のアップデート
- [ ] セキュリティパッチの適用
- [ ] バックアップの確認
- [ ] アクセス解析レポート

#### 四半期タスク
- [ ] パフォーマンス最適化
- [ ] コンテンツの追加・更新
- [ ] ユーザビリティテスト

### アップデート手順

1. **開発環境でテスト**
   ```bash
   npm update
   npm run test
   npm run build
   ```

2. **ステージング環境でテスト**
   ```bash
   npm run deploy:staging
   # 動作確認
   ```

3. **本番環境へデプロイ**
   ```bash
   npm run deploy:production
   # 動作確認
   ```

### バージョン管理

#### セマンティックバージョニング
```
MAJOR.MINOR.PATCH

1.0.0 - 初回リリース
1.1.0 - 新機能追加
1.1.1 - バグ修正
2.0.0 - 破壊的変更
```

---

**最終更新日**: 2025年1月21日  
**バージョン**: 1.0.0

運用に関する質問は、開発チームまでお問い合わせください。