import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

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
        manualChunks: {
          // React関連
          'react-vendor': ['react', 'react-dom'],
          
          // アニメーション
          'framer-motion': ['framer-motion'],
          
          // チャート
          'recharts': ['recharts'],
          
          // ユーティリティ
          'utils': ['zod', 'date-fns'],
          
          // アイコン
          'icons': ['react-icons'],
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