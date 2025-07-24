// PWAアイコン生成スクリプト
// SVGから各サイズのPNGアイコンを生成

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const sizes = [192, 512];
const svgPath = path.join(__dirname, '../public/favicon.svg');
const publicDir = path.join(__dirname, '../public');

async function generateIcons() {
  try {
    // SVGファイルを読み込み
    const svgBuffer = await fs.readFile(svgPath);
    
    // 各サイズのアイコンを生成
    for (const size of sizes) {
      const outputPath = path.join(publicDir, `icon-${size}.png`);
      
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated ${outputPath}`);
    }
    
    // マスカブルアイコン用（余白付き）
    const maskableSizes = [192, 512];
    for (const size of maskableSizes) {
      const outputPath = path.join(publicDir, `icon-maskable-${size}.png`);
      const padding = Math.floor(size * 0.1); // 10%のパディング
      const innerSize = size - (padding * 2);
      
      // 背景付きのマスカブルアイコンを生成
      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 79, g: 70, b: 229, alpha: 1 } // #4F46E5
        }
      })
        .composite([
          {
            input: await sharp(svgBuffer)
              .resize(innerSize, innerSize)
              .toBuffer(),
            top: padding,
            left: padding
          }
        ])
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated ${outputPath}`);
    }
    
    console.log('\n🎉 All icons generated successfully!');
    
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

// 手動でアイコンを作成する場合の代替SVG
async function createFallbackIcons() {
  // SVGを直接PNGに変換できない場合の代替実装
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect width="512" height="512" fill="#4F46E5"/>
      <circle cx="256" cy="256" r="200" fill="#FDE68A"/>
      <circle cx="200" cy="220" r="40" fill="#FFFFFF"/>
      <circle cx="312" cy="220" r="40" fill="#FFFFFF"/>
      <circle cx="200" cy="220" r="25" fill="#1F2937"/>
      <circle cx="312" cy="220" r="25" fill="#1F2937"/>
      <path d="M 180 300 Q 256 350 332 300" stroke="#1F2937" stroke-width="15" fill="none"/>
    </svg>
  `;
  
  // ここに手動でPNG生成のロジックを追加
  console.log('Fallback SVG created. Please use an online converter or image editor to create PNG icons.');
}

// sharp がインストールされていない場合の案内
if (!sharp) {
  console.log('📦 Please install sharp first: npm install --save-dev sharp');
  console.log('Or create icons manually using the SVG file.');
  createFallbackIcons();
} else {
  generateIcons();
}