import type { Monster, ContentItem, MonsterRarity } from '@/types';

// ハッシュ関数（cyrb53）
function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

// シード付きランダム生成器
class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  
  nextRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  
  nextInt(min: number, max: number): number {
    return Math.floor(this.nextRange(min, max + 1));
  }
  
  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }
}

// モンスターDNA構造
export interface MonsterDNA {
  seed: string;
  bodyType: number;
  features: {
    eyes: { type: string; color: string; size: number; glow: boolean };
    mouth: { type: string; expression: number; size: number };
    limbs: { type: string; count: number; positions: number[] };
    accessories: { type: string; placement: string; color: string }[];
    patterns: { type: string; density: number; color: string };
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    glow?: string;
    gradient?: { start: string; end: string };
  };
  animations: {
    idle: string;
    hover: string;
    special?: string;
  };
  personality: {
    trait: string;
    mood: number; // 0-1
    energy: number; // 0-1
  };
}

// カラーパレット（拡張版）
const enhancedColorPalettes = {
  proverb: {
    common: {
      primary: ['#4ADE80', '#34D399', '#10B981', '#059669'],
      secondary: ['#86EFAC', '#A7F3D0', '#D1FAE5'],
      accent: ['#FCA5A5', '#FDE047', '#A78BFA']
    },
    rare: {
      primary: ['#2DD4BF', '#14B8A6', '#0D9488'],
      secondary: ['#5EEAD4', '#99F6E4', '#CCFBF1'],
      accent: ['#F87171', '#FBBF24', '#C084FC']
    },
    epic: {
      primary: ['#06B6D4', '#0891B2', '#0E7490'],
      secondary: ['#67E8F9', '#A5F3FC', '#CFFAFE'],
      accent: ['#EF4444', '#F59E0B', '#A855F7'],
      glow: '#67E8F9'
    },
    legendary: {
      primary: ['#8B5CF6', '#7C3AED', '#6D28D9'],
      secondary: ['#A78BFA', '#C4B5FD', '#DDD6FE'],
      accent: ['#DC2626', '#EA580C', '#9333EA'],
      glow: '#C4B5FD',
      gradient: { start: '#8B5CF6', end: '#EC4899' }
    }
  },
  idiom: {
    common: {
      primary: ['#3B82F6', '#2563EB', '#1D4ED8'],
      secondary: ['#93C5FD', '#BFDBFE', '#DBEAFE'],
      accent: ['#FCA5A5', '#FDE047', '#A78BFA']
    },
    rare: {
      primary: ['#6366F1', '#4F46E5', '#4338CA'],
      secondary: ['#A5B4FC', '#C7D2FE', '#E0E7FF'],
      accent: ['#F87171', '#FBBF24', '#C084FC']
    },
    epic: {
      primary: ['#8B5CF6', '#7C3AED', '#6D28D9'],
      secondary: ['#A78BFA', '#C4B5FD', '#DDD6FE'],
      accent: ['#EF4444', '#F59E0B', '#A855F7'],
      glow: '#A78BFA'
    },
    legendary: {
      primary: ['#EC4899', '#DB2777', '#BE185D'],
      secondary: ['#F9A8D4', '#FBCFE8', '#FCE7F3'],
      accent: ['#DC2626', '#EA580C', '#9333EA'],
      glow: '#F9A8D4',
      gradient: { start: '#EC4899', end: '#F59E0B' }
    }
  },
  four_character_idiom: {
    common: {
      primary: ['#F59E0B', '#D97706', '#B45309'],
      secondary: ['#FCD34D', '#FDE68A', '#FEF3C7'],
      accent: ['#FCA5A5', '#93C5FD', '#A78BFA']
    },
    rare: {
      primary: ['#EF4444', '#DC2626', '#B91C1C'],
      secondary: ['#FCA5A5', '#FECACA', '#FEE2E2'],
      accent: ['#FDE047', '#93C5FD', '#C084FC']
    },
    epic: {
      primary: ['#DC2626', '#B91C1C', '#991B1B'],
      secondary: ['#F87171', '#FCA5A5', '#FECACA'],
      accent: ['#FBBF24', '#60A5FA', '#A855F7'],
      glow: '#F87171'
    },
    legendary: {
      primary: ['#B91C1C', '#991B1B', '#7F1D1D'],
      secondary: ['#EF4444', '#F87171', '#FCA5A5'],
      accent: ['#F59E0B', '#3B82F6', '#8B5CF6'],
      glow: '#EF4444',
      gradient: { start: '#DC2626', end: '#F59E0B' }
    }
  }
};

// ボディタイプ定義
const bodyTypes = [
  { name: 'blob', pathFn: (size: number) => generateBlobPath(size) },
  { name: 'crystal', pathFn: (size: number) => generateCrystalPath(size) },
  { name: 'flame', pathFn: (size: number) => generateFlamePath(size) },
  { name: 'cloud', pathFn: (size: number) => generateCloudPath(size) },
  { name: 'star', pathFn: (size: number) => generateStarPath(size) },
  { name: 'geometric', pathFn: (size: number) => generateGeometricPath(size) },
  { name: 'organic', pathFn: (size: number) => generateOrganicPath(size) },
  { name: 'mythical', pathFn: (size: number) => generateMythicalPath(size) }
];

// パスジェネレーター関数
function generateBlobPath(size: number): string {
  const c = size / 2;
  const r = size * 0.4;
  return `M ${c} ${c - r} C ${c + r * 0.5} ${c - r} ${c + r} ${c - r * 0.5} ${c + r} ${c} C ${c + r} ${c + r * 0.5} ${c + r * 0.5} ${c + r} ${c} ${c + r} C ${c - r * 0.5} ${c + r} ${c - r} ${c + r * 0.5} ${c - r} ${c} C ${c - r} ${c - r * 0.5} ${c - r * 0.5} ${c - r} ${c} ${c - r} Z`;
}

function generateCrystalPath(size: number): string {
  const c = size / 2;
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6;
    const r = i % 2 === 0 ? size * 0.4 : size * 0.3;
    points.push(`${c + Math.cos(angle) * r},${c + Math.sin(angle) * r}`);
  }
  return `M ${points.join(' L ')} Z`;
}

function generateFlamePath(size: number): string {
  const c = size / 2;
  const b = size * 0.8;
  return `M ${c} ${b} C ${c - size * 0.2} ${b} ${c - size * 0.3} ${c + size * 0.1} ${c - size * 0.2} ${c} C ${c - size * 0.15} ${c - size * 0.1} ${c - size * 0.1} ${c - size * 0.2} ${c} ${c - size * 0.4} C ${c + size * 0.1} ${c - size * 0.2} ${c + size * 0.15} ${c - size * 0.1} ${c + size * 0.2} ${c} C ${c + size * 0.3} ${c + size * 0.1} ${c + size * 0.2} ${b} ${c} ${b} Z`;
}

function generateCloudPath(size: number): string {
  const c = size / 2;
  const r = size * 0.15;
  return `M ${c - r * 2} ${c} A ${r} ${r} 0 0 1 ${c - r} ${c - r} A ${r} ${r} 0 0 1 ${c + r} ${c - r} A ${r} ${r} 0 0 1 ${c + r * 2} ${c} A ${r} ${r} 0 0 1 ${c + r} ${c + r} A ${r} ${r} 0 0 1 ${c - r} ${c + r} A ${r} ${r} 0 0 1 ${c - r * 2} ${c} Z`;
}

function generateStarPath(size: number): string {
  const c = size / 2;
  const outerR = size * 0.4;
  const innerR = size * 0.2;
  const points = [];
  
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    points.push(`${c + r * Math.cos(angle)},${c + r * Math.sin(angle)}`);
  }
  
  return `M ${points.join(' L ')} Z`;
}

function generateGeometricPath(size: number): string {
  const c = size / 2;
  const r = size * 0.4;
  const sides = 8;
  const points = [];
  
  for (let i = 0; i < sides; i++) {
    const angle = (i * Math.PI * 2) / sides - Math.PI / 2;
    points.push(`${c + r * Math.cos(angle)},${c + r * Math.sin(angle)}`);
  }
  
  return `M ${points.join(' L ')} Z`;
}

function generateOrganicPath(size: number): string {
  const c = size / 2;
  const r = size * 0.35;
  return `M ${c} ${c - r} Q ${c + r} ${c - r * 0.5} ${c + r * 0.7} ${c} T ${c + r} ${c + r * 0.5} Q ${c + r * 0.5} ${c + r} ${c} ${c + r} T ${c - r * 0.5} ${c + r} Q ${c - r} ${c + r * 0.5} ${c - r * 0.7} ${c} T ${c - r} ${c - r * 0.5} Q ${c - r * 0.5} ${c - r} ${c} ${c - r} Z`;
}

function generateMythicalPath(size: number): string {
  const c = size / 2;
  const r = size * 0.4;
  return `M ${c} ${c - r} C ${c + r * 0.8} ${c - r * 0.8} ${c + r * 1.2} ${c} ${c + r * 0.5} ${c + r * 0.2} L ${c + r * 0.3} ${c + r * 0.5} C ${c + r * 0.1} ${c + r * 0.8} ${c - r * 0.1} ${c + r * 0.8} ${c - r * 0.3} ${c + r * 0.5} L ${c - r * 0.5} ${c + r * 0.2} C ${c - r * 1.2} ${c} ${c - r * 0.8} ${c - r * 0.8} ${c} ${c - r} Z`;
}

// 目のタイプ
const eyeTypes = {
  common: ['simple', 'round', 'oval'],
  rare: ['star', 'diamond', 'crescent'],
  epic: ['spiral', 'flame', 'crystal'],
  legendary: ['galaxy', 'void', 'ancient']
};

// パターンジェネレーター
function generatePattern(type: string, size: number, color: string, density: number): string {
  switch (type) {
    case 'dots':
      return generateDotsPattern(size, color, density);
    case 'stripes':
      return generateStripesPattern(size, color, density);
    case 'scales':
      return generateScalesPattern(size, color, density);
    case 'stars':
      return generateStarsPattern(size, color, density);
    default:
      return '';
  }
}

function generateDotsPattern(size: number, color: string, density: number): string {
  let pattern = '';
  const dotSize = size * 0.02;
  const spacing = size * (0.1 / density);
  
  for (let x = spacing; x < size; x += spacing) {
    for (let y = spacing; y < size; y += spacing) {
      pattern += `<circle cx="${x}" cy="${y}" r="${dotSize}" fill="${color}" opacity="0.3"/>`;
    }
  }
  
  return pattern;
}

function generateStripesPattern(size: number, color: string, density: number): string {
  let pattern = '';
  const stripeWidth = size * (0.05 / density);
  const spacing = stripeWidth * 2;
  
  for (let x = 0; x < size; x += spacing) {
    pattern += `<rect x="${x}" y="0" width="${stripeWidth}" height="${size}" fill="${color}" opacity="0.2"/>`;
  }
  
  return pattern;
}

function generateScalesPattern(size: number, color: string, density: number): string {
  let pattern = '';
  const scaleSize = size * (0.06 / density);
  const spacing = scaleSize * 0.8;
  
  for (let y = 0; y < size; y += spacing) {
    for (let x = (y / spacing) % 2 * (spacing / 2); x < size; x += spacing) {
      pattern += `<path d="M ${x} ${y} A ${scaleSize/2} ${scaleSize/2} 0 0 1 ${x + scaleSize} ${y}" fill="none" stroke="${color}" stroke-width="1" opacity="0.3"/>`;
    }
  }
  
  return pattern;
}

function generateStarsPattern(size: number, color: string, density: number): string {
  let pattern = '';
  const starSize = size * (0.04 / density);
  const spacing = size * (0.15 / density);
  
  for (let x = spacing; x < size; x += spacing) {
    for (let y = spacing; y < size; y += spacing) {
      pattern += `<text x="${x}" y="${y}" font-size="${starSize}" fill="${color}" opacity="0.3">✦</text>`;
    }
  }
  
  return pattern;
}

// DNA生成関数
export function generateMonsterDNA(contentItem: ContentItem, rarity: MonsterRarity): MonsterDNA {
  const hash = cyrb53(contentItem.id + contentItem.text);
  const rng = new SeededRandom(hash);
  
  // カラーパレット選択
  const palette = enhancedColorPalettes[contentItem.type][rarity];
  
  // 基本DNA生成
  const dna: MonsterDNA = {
    seed: contentItem.id.toString(),
    bodyType: rng.nextInt(0, bodyTypes.length - 1),
    features: {
      eyes: {
        type: rng.pick(eyeTypes[rarity] || eyeTypes.common),
        color: rng.pick(['#1F2937', '#374151', '#4B5563']),
        size: rng.nextRange(0.8, 1.2),
        glow: rarity === 'epic' || rarity === 'legendary'
      },
      mouth: {
        type: rng.pick(['smile', 'grin', 'neutral', 'surprised']),
        expression: rng.next(),
        size: rng.nextRange(0.8, 1.2)
      },
      limbs: {
        type: rarity === 'legendary' ? 'floating' : rng.pick(['none', 'stubby', 'tentacles']),
        count: rng.nextInt(0, 4),
        positions: []
      },
      accessories: generateAccessories(rng, rarity),
      patterns: {
        type: rng.pick(['dots', 'stripes', 'scales', 'stars', 'none']),
        density: rng.nextRange(0.5, 1.5),
        color: palette.accent[0]
      }
    },
    colors: {
      primary: rng.pick(palette.primary),
      secondary: rng.pick(palette.secondary),
      accent: rng.pick(palette.accent),
      glow: palette.glow,
      gradient: palette.gradient
    },
    animations: {
      idle: 'float',
      hover: 'bounce',
      special: rarity === 'legendary' ? 'rotate' : undefined
    },
    personality: {
      trait: generatePersonalityTrait(contentItem),
      mood: rng.next(),
      energy: rng.next()
    }
  };
  
  return dna;
}

// アクセサリー生成
function generateAccessories(rng: SeededRandom, rarity: MonsterRarity): MonsterDNA['features']['accessories'] {
  const accessories = [];
  const accessoryTypes = {
    common: ['none'],
    rare: ['hat', 'ribbon', 'glasses'],
    epic: ['crown', 'wings', 'halo'],
    legendary: ['aura', 'constellation', 'flames', 'crystals']
  };
  
  const count = rarity === 'legendary' ? rng.nextInt(2, 3) : rng.nextInt(0, 1);
  const available = accessoryTypes[rarity] || accessoryTypes.common;
  
  for (let i = 0; i < count; i++) {
    if (available[0] !== 'none') {
      accessories.push({
        type: rng.pick(available),
        placement: rng.pick(['top', 'sides', 'around']),
        color: rng.pick(['#FFD700', '#C0C0C0', '#CD7F32'])
      });
    }
  }
  
  return accessories;
}

// 性格特性生成
function generatePersonalityTrait(contentItem: ContentItem): string {
  const traits = {
    proverb: ['wise', 'thoughtful', 'patient', 'clever'],
    idiom: ['expressive', 'creative', 'dynamic', 'witty'],
    four_character_idiom: ['profound', 'mysterious', 'ancient', 'powerful']
  };
  
  const hash = cyrb53(contentItem.text);
  const index = hash % traits[contentItem.type].length;
  return traits[contentItem.type][index];
}

// モンスターレンダラー
export class MonsterRenderer {
  private static cache = new Map<string, string>();
  
  static render(monster: Monster, size: number = 200): string {
    const cacheKey = `${monster.id}-${size}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    const dna = generateMonsterDNA(monster.sourceContent, monster.rarity);
    const svg = this.buildSVG(dna, size);
    this.cache.set(cacheKey, svg);
    return svg;
  }
  
  private static buildSVG(dna: MonsterDNA, size: number): string {
    const bodyType = bodyTypes[dna.bodyType];
    const bodyPath = bodyType.pathFn(size);
    
    const filters = this.generateFilters(dna);
    const body = this.renderBody(dna, bodyPath, size);
    const pattern = this.renderPattern(dna, size);
    const features = this.renderFeatures(dna, size);
    const accessories = this.renderAccessories(dna, size);
    const effects = this.renderEffects(dna, size);
    const animations = this.renderAnimations(dna);
    
    return `
      <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          ${filters}
          ${animations}
        </defs>
        <g class="monster-container">
          ${effects.background}
          ${body}
          ${pattern}
          ${features}
          ${accessories}
          ${effects.foreground}
        </g>
      </svg>
    `;
  }
  
  private static generateFilters(dna: MonsterDNA): string {
    let filters = '';
    
    if (dna.colors.glow) {
      filters += `
        <filter id="glow-${dna.seed}">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      `;
    }
    
    if (dna.colors.gradient) {
      filters += `
        <linearGradient id="gradient-${dna.seed}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${dna.colors.gradient.start}"/>
          <stop offset="100%" stop-color="${dna.colors.gradient.end}"/>
        </linearGradient>
      `;
    }
    
    return filters;
  }
  
  private static renderBody(dna: MonsterDNA, path: string, size: number): string {
    const fill = dna.colors.gradient ? `url(#gradient-${dna.seed})` : dna.colors.primary;
    const filter = dna.colors.glow ? `filter="url(#glow-${dna.seed})"` : '';
    
    return `
      <g class="monster-body" ${filter}>
        <path d="${path}" fill="${fill}" stroke="${dna.colors.secondary}" stroke-width="2"/>
      </g>
    `;
  }
  
  private static renderPattern(dna: MonsterDNA, size: number): string {
    if (dna.features.patterns.type === 'none') return '';
    
    return `
      <g class="monster-pattern" opacity="0.6">
        ${generatePattern(
          dna.features.patterns.type,
          size,
          dna.features.patterns.color,
          dna.features.patterns.density
        )}
      </g>
    `;
  }
  
  private static renderFeatures(dna: MonsterDNA, size: number): string {
    const eyes = this.renderEyes(dna.features.eyes, size);
    const mouth = this.renderMouth(dna.features.mouth, size);
    
    return `
      <g class="monster-features">
        ${eyes}
        ${mouth}
      </g>
    `;
  }
  
  private static renderEyes(eyes: MonsterDNA['features']['eyes'], size: number): string {
    const eyeSize = size * 0.08 * eyes.size;
    const eyeY = size * 0.35;
    const leftX = size * 0.35;
    const rightX = size * 0.65;
    
    let eyeElements = '';
    
    switch (eyes.type) {
      case 'simple':
        eyeElements = `
          <circle cx="${leftX}" cy="${eyeY}" r="${eyeSize}" fill="${eyes.color}"/>
          <circle cx="${rightX}" cy="${eyeY}" r="${eyeSize}" fill="${eyes.color}"/>
        `;
        break;
        
      case 'galaxy':
        eyeElements = `
          <defs>
            <radialGradient id="galaxy-eye">
              <stop offset="0%" stop-color="#8B5CF6"/>
              <stop offset="50%" stop-color="#EC4899"/>
              <stop offset="100%" stop-color="#1F2937"/>
            </radialGradient>
          </defs>
          <circle cx="${leftX}" cy="${eyeY}" r="${eyeSize * 1.5}" fill="url(#galaxy-eye)"/>
          <circle cx="${rightX}" cy="${eyeY}" r="${eyeSize * 1.5}" fill="url(#galaxy-eye)"/>
          <circle cx="${leftX}" cy="${eyeY}" r="${eyeSize * 0.3}" fill="white" opacity="0.8"/>
          <circle cx="${rightX}" cy="${eyeY}" r="${eyeSize * 0.3}" fill="white" opacity="0.8"/>
        `;
        break;
        
      default:
        eyeElements = `
          <circle cx="${leftX}" cy="${eyeY}" r="${eyeSize}" fill="${eyes.color}"/>
          <circle cx="${rightX}" cy="${eyeY}" r="${eyeSize}" fill="${eyes.color}"/>
        `;
    }
    
    if (eyes.glow) {
      eyeElements = `<g filter="url(#glow-${Date.now()})">${eyeElements}</g>`;
    }
    
    return eyeElements;
  }
  
  private static renderMouth(mouth: MonsterDNA['features']['mouth'], size: number): string {
    const mouthY = size * 0.6;
    const mouthX = size * 0.5;
    const mouthWidth = size * 0.3 * mouth.size;
    
    switch (mouth.type) {
      case 'smile':
        return `<path d="M ${mouthX - mouthWidth/2} ${mouthY} Q ${mouthX} ${mouthY + mouthWidth/3} ${mouthX + mouthWidth/2} ${mouthY}" stroke="#1F2937" stroke-width="2" fill="none"/>`;
        
      case 'grin':
        return `
          <path d="M ${mouthX - mouthWidth/2} ${mouthY} Q ${mouthX} ${mouthY + mouthWidth/3} ${mouthX + mouthWidth/2} ${mouthY}" stroke="#1F2937" stroke-width="2" fill="white"/>
          <line x1="${mouthX - mouthWidth/3}" y1="${mouthY}" x2="${mouthX - mouthWidth/3}" y2="${mouthY + 5}" stroke="#1F2937"/>
          <line x1="${mouthX}" y1="${mouthY}" x2="${mouthX}" y2="${mouthY + 5}" stroke="#1F2937"/>
          <line x1="${mouthX + mouthWidth/3}" y1="${mouthY}" x2="${mouthX + mouthWidth/3}" y2="${mouthY + 5}" stroke="#1F2937"/>
        `;
        
      default:
        return `<line x1="${mouthX - mouthWidth/2}" y1="${mouthY}" x2="${mouthX + mouthWidth/2}" y2="${mouthY}" stroke="#1F2937" stroke-width="2"/>`;
    }
  }
  
  private static renderAccessories(dna: MonsterDNA, size: number): string {
    let accessories = '';
    
    for (const accessory of dna.features.accessories) {
      switch (accessory.type) {
        case 'aura':
          accessories += `
            <circle cx="${size/2}" cy="${size/2}" r="${size * 0.45}" fill="none" stroke="${accessory.color}" stroke-width="3" opacity="0.6">
              <animate attributeName="r" values="${size * 0.45};${size * 0.5};${size * 0.45}" dur="2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.6;0.3;0.6" dur="2s" repeatCount="indefinite"/>
            </circle>
          `;
          break;
          
        case 'constellation':
          accessories += this.renderConstellation(size, accessory.color);
          break;
          
        case 'crown':
          accessories += `
            <path d="M ${size * 0.25} ${size * 0.2} L ${size * 0.25} ${size * 0.1} L ${size * 0.35} ${size * 0.05} L ${size * 0.5} ${size * 0.1} L ${size * 0.65} ${size * 0.05} L ${size * 0.75} ${size * 0.1} L ${size * 0.75} ${size * 0.2} Z" 
                  fill="${accessory.color}" stroke="#B8860B" stroke-width="1"/>
          `;
          break;
      }
    }
    
    return `<g class="monster-accessories">${accessories}</g>`;
  }
  
  private static renderConstellation(size: number, color: string): string {
    const points = [];
    const rng = new SeededRandom(Date.now());
    
    for (let i = 0; i < 5; i++) {
      points.push({
        x: rng.nextRange(size * 0.1, size * 0.9),
        y: rng.nextRange(size * 0.1, size * 0.3)
      });
    }
    
    let constellation = '';
    
    // 星
    points.forEach(p => {
      constellation += `
        <circle cx="${p.x}" cy="${p.y}" r="2" fill="${color}">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="${2 + Math.random()}s" repeatCount="indefinite"/>
        </circle>
      `;
    });
    
    // 接続線
    for (let i = 0; i < points.length - 1; i++) {
      constellation += `
        <line x1="${points[i].x}" y1="${points[i].y}" x2="${points[i+1].x}" y2="${points[i+1].y}" 
              stroke="${color}" stroke-width="0.5" opacity="0.3"/>
      `;
    }
    
    return constellation;
  }
  
  private static renderEffects(dna: MonsterDNA, size: number): string {
    const effects = {
      background: '',
      foreground: ''
    };
    
    // レジェンダリー用の特殊エフェクト
    if (dna.colors.glow) {
      effects.background += `
        <circle cx="${size/2}" cy="${size/2}" r="${size * 0.4}" fill="${dna.colors.glow}" opacity="0.2">
          <animate attributeName="r" values="${size * 0.4};${size * 0.45};${size * 0.4}" dur="3s" repeatCount="indefinite"/>
        </circle>
      `;
    }
    
    return effects;
  }
  
  private static renderAnimations(dna: MonsterDNA): string {
    let animations = '';
    
    if (dna.animations.idle === 'float') {
      animations += `
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0; 0,-5; 0,0"
          dur="3s"
          repeatCount="indefinite"/>
      `;
    }
    
    if (dna.animations.special === 'rotate') {
      animations += `
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 50 50"
          to="360 50 50"
          dur="20s"
          repeatCount="indefinite"/>
      `;
    }
    
    return animations;
  }
}

// データURL生成（後方互換性のため）
export function generateMonsterDataURL(monster: Monster, size: number = 100): string {
  const svg = MonsterRenderer.render(monster, size);
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}