import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa'

// Production build configuration
export default defineConfig({
  base: '/proverb-monster-quiz/',
  plugins: [
    react(),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,json,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    // アウトプットディレクトリ
    outDir: 'dist',
    
    // ソースマップを生成（デバッグ用。本番環境では false にすることも可）
    sourcemap: false,
    
    // 圧縮設定
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // console.log を削除
        drop_debugger: true, // debugger を削除
      },
    },
    
    // CSS コード分割
    cssCodeSplit: true,
    
    // アセットの inline 化の閾値（4KB以下は inline 化）
    assetsInlineLimit: 4096,
    
    // チャンクサイズ警告の閾値
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        // チャンク分割戦略
        manualChunks: (id) => {
          // node_modules内のパッケージを分離
          if (id.includes('node_modules')) {
            // React関連
            if (id.includes('react') && !id.includes('react-icons') && !id.includes('recharts')) {
              return 'react-vendor';
            }
            // アニメーション
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            // チャート
            if (id.includes('recharts')) {
              return 'recharts';
            }
            // アイコン
            if (id.includes('react-icons')) {
              return 'icons';
            }
            // ユーティリティ
            if (id.includes('zod') || id.includes('date-fns')) {
              return 'utils';
            }
          }
          
          // コンポーネントの分割
          if (id.includes('src/components')) {
            // 管理者機能は別チャンク
            if (id.includes('/admin/')) {
              return 'admin';
            }
            // 統計・ランキング機能
            if (id.includes('/stats/') || id.includes('/ranking/')) {
              return 'analytics';
            }
            // エクスポート機能
            if (id.includes('/export/')) {
              return 'export';
            }
          }
        },
        
        // チャンクファイル名の設定
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/js/${facadeModuleId}-[hash].js`;
        },
        
        // エントリーファイル名の設定
        entryFileNames: 'assets/js/[name]-[hash].js',
        
        // アセットファイル名の設定
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.');
          const extType = info?.[info.length - 1];
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name || '')) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/\.(woff2?|ttf|eot)$/i.test(assetInfo.name || '')) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          if (extType === 'css') {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    
    // レポート生成
    reportCompressedSize: true,
  },
  
  // 本番環境用の最適化
  esbuild: {
    drop: ['console', 'debugger'],
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@core': path.resolve(__dirname, './src/core'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
  
  // プレビューサーバー設定
  preview: {
    port: 4173,
    strictPort: true,
    host: true,
  },
})