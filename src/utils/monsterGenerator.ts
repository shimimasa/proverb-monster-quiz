import type { Monster } from '@/types';

// カラーパレット定義
const colorPalettes = {
  proverb: {
    primary: ['#2E7D32', '#388E3C', '#43A047', '#4CAF50', '#66BB6A'],
    secondary: ['#81C784', '#A5D6A7', '#C8E6C9', '#E8F5E9'],
    accent: ['#FF6B6B', '#FFD93D', '#6BCF7F']
  },
  idiom: {
    primary: ['#1565C0', '#1976D2', '#1E88E5', '#2196F3', '#42A5F5'],
    secondary: ['#64B5F6', '#90CAF9', '#BBDEFB', '#E3F2FD'],
    accent: ['#FF6B6B', '#FFD93D', '#6BCF7F']
  },
  four_character_idiom: {
    primary: ['#6A1B9A', '#7B1FA2', '#8E24AA', '#9C27B0', '#AB47BC'],
    secondary: ['#BA68C8', '#CE93D8', '#E1BEE7', '#F3E5F5'],
    accent: ['#FF6B6B', '#FFD93D', '#6BCF7F']
  }
};

// 形状パターン定義
const shapePatterns = {
  common: ['circle', 'square', 'triangle'],
  rare: ['star', 'hexagon', 'diamond'],
  epic: ['octagon', 'heart', 'cloud'],
  legendary: ['dragon', 'phoenix', 'unicorn']
};

// パーツ定義
const bodyParts = {
  eyes: {
    common: ['dot', 'circle'],
    rare: ['star', 'heart'],
    epic: ['sparkle', 'flame'],
    legendary: ['galaxy', 'rainbow']
  },
  mouth: {
    common: ['smile', 'neutral'],
    rare: ['grin', 'tongue'],
    epic: ['fangs', 'magic'],
    legendary: ['cosmic', 'elemental']
  },
  accessories: {
    common: [],
    rare: ['hat', 'ribbon'],
    epic: ['crown', 'wings'],
    legendary: ['aura', 'halo', 'constellation']
  }
};

// シード値からランダムな値を生成（決定論的）
function seededRandom(seed: string, index: number): number {
  const str = seed + index.toString();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) / 2147483647;
}

// 配列からシード値に基づいて要素を選択
function selectFromArray<T>(array: T[], seed: string, index: number): T {
  const randomValue = seededRandom(seed, index);
  return array[Math.floor(randomValue * array.length)];
}

// SVGパスを生成
function generateShape(shape: string, size: number): string {
  const center = size / 2;
  const radius = size * 0.4;
  
  switch (shape) {
    case 'circle':
      return `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center} ${center + radius} A ${radius} ${radius} 0 1 1 ${center} ${center - radius}`;
    
    case 'square':
      const squareSize = radius * 1.5;
      return `M ${center - squareSize} ${center - squareSize} h ${squareSize * 2} v ${squareSize * 2} h ${-squareSize * 2} z`;
    
    case 'triangle':
      return `M ${center} ${center - radius} L ${center - radius} ${center + radius} L ${center + radius} ${center + radius} z`;
    
    case 'star':
      const outerRadius = radius;
      const innerRadius = radius * 0.5;
      let path = '';
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
      }
      return path + ' z';
    
    case 'hexagon':
      let hexPath = '';
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        hexPath += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
      }
      return hexPath + ' z';
    
    case 'diamond':
      return `M ${center} ${center - radius} L ${center + radius * 0.7} ${center} L ${center} ${center + radius} L ${center - radius * 0.7} ${center} z`;
    
    case 'octagon':
      let octPath = '';
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        octPath += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
      }
      return octPath + ' z';
    
    case 'heart':
      const x = center;
      const y = center;
      return `M ${x} ${y + radius * 0.3} C ${x - radius * 0.5} ${y - radius * 0.3} ${x - radius} ${y - radius * 0.1} ${x - radius} ${y - radius * 0.4} C ${x - radius} ${y - radius * 0.7} ${x - radius * 0.5} ${y - radius} ${x} ${y - radius * 0.7} C ${x + radius * 0.5} ${y - radius} ${x + radius} ${y - radius * 0.7} ${x + radius} ${y - radius * 0.4} C ${x + radius} ${y - radius * 0.1} ${x + radius * 0.5} ${y - radius * 0.3} ${x} ${y + radius * 0.3} z`;
    
    case 'cloud':
      return `M ${center - radius * 0.4} ${center} C ${center - radius * 0.4} ${center - radius * 0.3} ${center - radius * 0.2} ${center - radius * 0.5} ${center} ${center - radius * 0.5} C ${center + radius * 0.2} ${center - radius * 0.5} ${center + radius * 0.4} ${center - radius * 0.3} ${center + radius * 0.4} ${center} C ${center + radius * 0.4} ${center + radius * 0.2} ${center + radius * 0.2} ${center + radius * 0.4} ${center} ${center + radius * 0.4} C ${center - radius * 0.2} ${center + radius * 0.4} ${center - radius * 0.4} ${center + radius * 0.2} ${center - radius * 0.4} ${center} z`;
    
    default:
      // デフォルトは円
      return `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center} ${center + radius} A ${radius} ${radius} 0 1 1 ${center} ${center - radius}`;
  }
}

// 目を生成
function generateEyes(type: string, size: number, color: string): string {
  const eyeSize = size * 0.1;
  const eyeY = size * 0.35;
  const leftEyeX = size * 0.35;
  const rightEyeX = size * 0.65;
  
  switch (type) {
    case 'dot':
      return `
        <circle cx="${leftEyeX}" cy="${eyeY}" r="${eyeSize * 0.5}" fill="${color}" />
        <circle cx="${rightEyeX}" cy="${eyeY}" r="${eyeSize * 0.5}" fill="${color}" />
      `;
    
    case 'circle':
      return `
        <circle cx="${leftEyeX}" cy="${eyeY}" r="${eyeSize}" fill="white" stroke="${color}" stroke-width="2" />
        <circle cx="${leftEyeX}" cy="${eyeY}" r="${eyeSize * 0.5}" fill="${color}" />
        <circle cx="${rightEyeX}" cy="${eyeY}" r="${eyeSize}" fill="white" stroke="${color}" stroke-width="2" />
        <circle cx="${rightEyeX}" cy="${eyeY}" r="${eyeSize * 0.5}" fill="${color}" />
      `;
    
    case 'star':
      return `
        <text x="${leftEyeX}" y="${eyeY + eyeSize * 0.5}" text-anchor="middle" font-size="${eyeSize * 2}" fill="${color}">⭐</text>
        <text x="${rightEyeX}" y="${eyeY + eyeSize * 0.5}" text-anchor="middle" font-size="${eyeSize * 2}" fill="${color}">⭐</text>
      `;
    
    case 'heart':
      return `
        <text x="${leftEyeX}" y="${eyeY + eyeSize * 0.5}" text-anchor="middle" font-size="${eyeSize * 2}" fill="${color}">❤️</text>
        <text x="${rightEyeX}" y="${eyeY + eyeSize * 0.5}" text-anchor="middle" font-size="${eyeSize * 2}" fill="${color}">❤️</text>
      `;
    
    default:
      return `
        <circle cx="${leftEyeX}" cy="${eyeY}" r="${eyeSize * 0.5}" fill="${color}" />
        <circle cx="${rightEyeX}" cy="${eyeY}" r="${eyeSize * 0.5}" fill="${color}" />
      `;
  }
}

// 口を生成
function generateMouth(type: string, size: number, color: string): string {
  const mouthY = size * 0.6;
  const mouthX = size * 0.5;
  const mouthWidth = size * 0.3;
  
  switch (type) {
    case 'smile':
      return `<path d="M ${mouthX - mouthWidth / 2} ${mouthY} Q ${mouthX} ${mouthY + mouthWidth / 2} ${mouthX + mouthWidth / 2} ${mouthY}" stroke="${color}" stroke-width="2" fill="none" />`;
    
    case 'neutral':
      return `<line x1="${mouthX - mouthWidth / 2}" y1="${mouthY}" x2="${mouthX + mouthWidth / 2}" y2="${mouthY}" stroke="${color}" stroke-width="2" />`;
    
    case 'grin':
      return `
        <path d="M ${mouthX - mouthWidth / 2} ${mouthY} Q ${mouthX} ${mouthY + mouthWidth / 2} ${mouthX + mouthWidth / 2} ${mouthY}" stroke="${color}" stroke-width="2" fill="white" />
        <line x1="${mouthX - mouthWidth / 3}" y1="${mouthY}" x2="${mouthX - mouthWidth / 3}" y2="${mouthY + 5}" stroke="${color}" stroke-width="1" />
        <line x1="${mouthX}" y1="${mouthY}" x2="${mouthX}" y2="${mouthY + 5}" stroke="${color}" stroke-width="1" />
        <line x1="${mouthX + mouthWidth / 3}" y1="${mouthY}" x2="${mouthX + mouthWidth / 3}" y2="${mouthY + 5}" stroke="${color}" stroke-width="1" />
      `;
    
    case 'tongue':
      return `
        <path d="M ${mouthX - mouthWidth / 2} ${mouthY} Q ${mouthX} ${mouthY + mouthWidth / 3} ${mouthX + mouthWidth / 2} ${mouthY}" stroke="${color}" stroke-width="2" fill="none" />
        <ellipse cx="${mouthX}" cy="${mouthY + mouthWidth / 3}" rx="${mouthWidth / 4}" ry="${mouthWidth / 3}" fill="#FF69B4" />
      `;
    
    default:
      return `<path d="M ${mouthX - mouthWidth / 2} ${mouthY} Q ${mouthX} ${mouthY + mouthWidth / 2} ${mouthX + mouthWidth / 2} ${mouthY}" stroke="${color}" stroke-width="2" fill="none" />`;
  }
}

// アクセサリーを生成
function generateAccessory(type: string, size: number): string {
  const center = size / 2;
  
  switch (type) {
    case 'hat':
      return `
        <rect x="${center - size * 0.25}" y="${size * 0.05}" width="${size * 0.5}" height="${size * 0.15}" fill="#4B5563" />
        <rect x="${center - size * 0.15}" y="${size * 0.15}" width="${size * 0.3}" height="${size * 0.1}" fill="#374151" />
      `;
    
    case 'ribbon':
      return `
        <path d="M ${center - size * 0.2} ${size * 0.1} L ${center} ${size * 0.15} L ${center + size * 0.2} ${size * 0.1} L ${center + size * 0.15} ${size * 0.2} L ${center} ${size * 0.15} L ${center - size * 0.15} ${size * 0.2} z" fill="#EC4899" />
      `;
    
    case 'crown':
      return `
        <path d="M ${center - size * 0.25} ${size * 0.2} L ${center - size * 0.25} ${size * 0.1} L ${center - size * 0.15} ${size * 0.05} L ${center} ${size * 0.1} L ${center + size * 0.15} ${size * 0.05} L ${center + size * 0.25} ${size * 0.1} L ${center + size * 0.25} ${size * 0.2} z" fill="#FFD700" stroke="#FFA500" stroke-width="1" />
      `;
    
    case 'wings':
      return `
        <path d="M ${center - size * 0.5} ${center} Q ${center - size * 0.7} ${center - size * 0.2} ${center - size * 0.4} ${center - size * 0.3} Q ${center - size * 0.3} ${center - size * 0.1} ${center - size * 0.3} ${center}" fill="rgba(255,255,255,0.7)" stroke="#E5E7EB" stroke-width="1" />
        <path d="M ${center + size * 0.5} ${center} Q ${center + size * 0.7} ${center - size * 0.2} ${center + size * 0.4} ${center - size * 0.3} Q ${center + size * 0.3} ${center - size * 0.1} ${center + size * 0.3} ${center}" fill="rgba(255,255,255,0.7)" stroke="#E5E7EB" stroke-width="1" />
      `;
    
    case 'aura':
      return `
        <circle cx="${center}" cy="${center}" r="${size * 0.45}" fill="none" stroke="url(#auraGradient)" stroke-width="3" opacity="0.6" />
        <defs>
          <radialGradient id="auraGradient">
            <stop offset="0%" stop-color="#FFD700" />
            <stop offset="50%" stop-color="#FFA500" />
            <stop offset="100%" stop-color="#FF6347" />
          </radialGradient>
        </defs>
      `;
    
    default:
      return '';
  }
}

// モンスターSVGを生成
export function generateMonsterSVG(monster: Monster, size: number = 100): string {
  const seed = monster.id;
  const contentType = monster.sourceContent.type;
  const rarity = monster.rarity;
  
  // カラーパレットを選択
  const palette = colorPalettes[contentType] || colorPalettes.proverb;
  const primaryColor = selectFromArray(palette.primary, seed, 0);
  const secondaryColor = selectFromArray(palette.secondary, seed, 1);
  const accentColor = selectFromArray(palette.accent, seed, 2);
  
  // 形状を選択
  const availableShapes = shapePatterns[rarity] || shapePatterns.common;
  const shape = selectFromArray(availableShapes, seed, 3);
  
  // パーツを選択
  const eyeType = selectFromArray(bodyParts.eyes[rarity] || bodyParts.eyes.common, seed, 4);
  const mouthType = selectFromArray(bodyParts.mouth[rarity] || bodyParts.mouth.common, seed, 5);
  const accessories = bodyParts.accessories[rarity] || [];
  const accessory = accessories.length > 0 ? selectFromArray(accessories, seed, 6) : null;
  
  // SVGを構築
  const svgContent = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- 背景グラデーション -->
      <defs>
        <radialGradient id="bgGradient-${seed}">
          <stop offset="0%" stop-color="${primaryColor}" />
          <stop offset="100%" stop-color="${secondaryColor}" />
        </radialGradient>
        ${rarity === 'legendary' ? `
        <filter id="glow-${seed}">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        ` : ''}
      </defs>
      
      <!-- モンスター本体 -->
      <g ${rarity === 'legendary' ? `filter="url(#glow-${seed})"` : ''}>
        <!-- ボディ -->
        <path d="${generateShape(shape, size)}" fill="url(#bgGradient-${seed})" stroke="${accentColor}" stroke-width="2" />
        
        <!-- 模様 -->
        ${seededRandom(seed, 7) > 0.5 ? `
        <circle cx="${size * 0.3}" cy="${size * 0.5}" r="${size * 0.05}" fill="${accentColor}" opacity="0.5" />
        <circle cx="${size * 0.7}" cy="${size * 0.5}" r="${size * 0.05}" fill="${accentColor}" opacity="0.5" />
        ` : ''}
        
        <!-- 目 -->
        ${generateEyes(eyeType, size, '#333333')}
        
        <!-- 口 -->
        ${generateMouth(mouthType, size, '#333333')}
        
        <!-- アクセサリー -->
        ${accessory ? generateAccessory(accessory, size) : ''}
      </g>
      
      <!-- レアリティエフェクト -->
      ${rarity === 'legendary' ? `
      <g opacity="0.6">
        <circle cx="${size * 0.2}" cy="${size * 0.2}" r="2" fill="#FFD700">
          <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="${size * 0.8}" cy="${size * 0.2}" r="2" fill="#FFD700">
          <animate attributeName="opacity" values="0;1;0" dur="2s" begin="0.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="${size * 0.5}" cy="${size * 0.1}" r="2" fill="#FFD700">
          <animate attributeName="opacity" values="0;1;0" dur="2s" begin="1s" repeatCount="indefinite" />
        </circle>
      </g>
      ` : ''}
    </svg>
  `;
  
  return svgContent;
}

// データURLに変換
export function generateMonsterDataURL(monster: Monster, size: number = 100): string {
  const svg = generateMonsterSVG(monster, size);
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}