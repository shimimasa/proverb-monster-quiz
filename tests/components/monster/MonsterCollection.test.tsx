import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MonsterCollection } from '@/components/monster/MonsterCollection';
import { GameProvider } from '@/contexts/GameContext';
import type { Monster, MonsterRarity, ContentType } from '@/types';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock MonsterCard component
vi.mock('@/components/monster/MonsterCard', () => ({
  MonsterCard: ({ monster }: { monster: Monster }) => (
    <div data-testid={`monster-card-${monster.id}`}>
      {monster.name} - {monster.rarity} - {monster.unlocked ? 'Unlocked' : 'Locked'}
    </div>
  ),
}));

// Mock data
const mockMonsters: Monster[] = [
  {
    id: 'monster1',
    name: '火炎ドラゴン',
    image: 'dragon.png',
    rarity: 'legendary' as MonsterRarity,
    sourceContent: {
      id: 1,
      text: '猿も木から落ちる',
      reading: 'さるもきからおちる',
      meaning: '達人でも失敗することがある',
      difficulty: '小学生',
      example_sentence: '',
      type: 'proverb' as ContentType,
    },
    unlocked: true,
    dateObtained: new Date('2025-01-20'),
  },
  {
    id: 'monster2',
    name: '水の精霊',
    image: 'spirit.png',
    rarity: 'rare' as MonsterRarity,
    sourceContent: {
      id: 2,
      text: '井の中の蛙',
      reading: 'いのなかのかわず',
      meaning: '狭い世界しか知らない',
      difficulty: '小学生',
      example_sentence: '',
      type: 'proverb' as ContentType,
    },
    unlocked: true,
    dateObtained: new Date('2025-01-19'),
  },
  {
    id: 'monster3',
    name: '風の妖精',
    image: 'fairy.png',
    rarity: 'common' as MonsterRarity,
    sourceContent: {
      id: 3,
      text: '手を焼く',
      reading: 'てをやく',
      meaning: '世話に困る',
      difficulty: '小学生',
      example_sentence: '',
      type: 'idiom' as ContentType,
    },
    unlocked: false,
    dateObtained: undefined,
  },
  {
    id: 'monster4',
    name: '雷獣',
    image: 'thunder.png',
    rarity: 'epic' as MonsterRarity,
    sourceContent: {
      id: 4,
      text: '一石二鳥',
      reading: 'いっせきにちょう',
      meaning: '一つの行動で二つの利益を得る',
      difficulty: '小学生',
      example_sentence: '',
      type: 'four_character_idiom' as ContentType,
    },
    unlocked: true,
    dateObtained: new Date('2025-01-21'),
  },
];

const mockStats = {
  total: 4,
  unlocked: 3,
  byRarity: {
    common: 0,
    rare: 1,
    epic: 1,
    legendary: 1,
  },
  byType: {
    proverb: 2,
    idiom: 1,
    four_character_idiom: 1,
  },
};

const mockCompletionInfo = {
  percentage: 75,
  nextMilestone: 80,
  monstersToNext: 1,
};

// Mock useGame hook
vi.mock('@/contexts/GameContext', () => ({
  GameProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useGame: () => ({
    monsterManager: {
      getAllMonsters: () => mockMonsters,
      getCollectionStats: () => mockStats,
      getCompletionProgress: () => mockCompletionInfo,
    },
    progressManager: {},
  }),
}));

describe('MonsterCollection', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コレクション統計が正しく表示される', () => {
    render(<MonsterCollection />);

    // ヘッダー
    expect(screen.getByText('モンスターコレクション')).toBeInTheDocument();

    // 完成度
    expect(screen.getByText('完成度')).toBeInTheDocument();
    expect(screen.getByText('75.0%')).toBeInTheDocument();

    // 統計情報
    expect(screen.getByText('獲得数')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('コモン')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('レア')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('エピック+')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    // 次のマイルストーン
    expect(screen.getByText(/次のマイルストーン（80%）まで/)).toBeInTheDocument();
    expect(screen.getByText('あと1体')).toBeInTheDocument();
  });

  it('すべてのモンスターカードが表示される', () => {
    render(<MonsterCollection />);

    expect(screen.getByText('4体のモンスターを表示中')).toBeInTheDocument();
    
    mockMonsters.forEach(monster => {
      expect(screen.getByTestId(`monster-card-${monster.id}`)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(monster.name))).toBeInTheDocument();
    });
  });

  it('フィルター&ソートパネルの開閉が動作する', async () => {
    render(<MonsterCollection />);

    const toggleButton = screen.getByText('フィルター & ソート');
    
    // 初期状態では閉じている
    expect(screen.queryByText('レアリティ')).not.toBeInTheDocument();

    // クリックで開く
    await user.click(toggleButton);
    expect(screen.getByText('レアリティ')).toBeInTheDocument();
    expect(screen.getByText('獲得状態')).toBeInTheDocument();
    expect(screen.getByText('タイプ')).toBeInTheDocument();
    expect(screen.getByText('並び順')).toBeInTheDocument();

    // 再度クリックで閉じる
    await user.click(toggleButton);
    await waitFor(() => {
      expect(screen.queryByText('レアリティ')).not.toBeInTheDocument();
    });
  });

  it('レアリティフィルターが動作する', async () => {
    render(<MonsterCollection />);

    await user.click(screen.getByText('フィルター & ソート'));
    
    // レジェンダリーのみ表示
    await user.click(screen.getByRole('button', { name: 'レジェンダリー' }));
    
    expect(screen.getByText('1体のモンスターを表示中')).toBeInTheDocument();
    expect(screen.getByText(/火炎ドラゴン/)).toBeInTheDocument();
    expect(screen.queryByText(/水の精霊/)).not.toBeInTheDocument();
  });

  it('獲得状態フィルターが動作する', async () => {
    render(<MonsterCollection />);

    await user.click(screen.getByText('フィルター & ソート'));
    
    // 未獲得のみ表示
    const statusButtons = screen.getAllByText('未獲得');
    await user.click(statusButtons[statusButtons.length - 1]); // 最後の「未獲得」ボタンをクリック
    
    expect(screen.getByText('1体のモンスターを表示中')).toBeInTheDocument();
    expect(screen.getByText(/風の妖精/)).toBeInTheDocument();
    expect(screen.queryByText(/火炎ドラゴン/)).not.toBeInTheDocument();
  });

  it('タイプフィルターが動作する', async () => {
    render(<MonsterCollection />);

    await user.click(screen.getByText('フィルター & ソート'));
    
    // 慣用句のみ表示
    await user.click(screen.getByRole('button', { name: '慣用句' }));
    
    expect(screen.getByText('1体のモンスターを表示中')).toBeInTheDocument();
    expect(screen.getByText(/風の妖精/)).toBeInTheDocument();
    expect(screen.queryByText(/火炎ドラゴン/)).not.toBeInTheDocument();
  });

  it('ソート機能が動作する', async () => {
    render(<MonsterCollection />);

    await user.click(screen.getByText('フィルター & ソート'));
    
    // 名前順でソート
    await user.click(screen.getByRole('button', { name: '名前順' }));
    
    const cards = screen.getAllByTestId(/monster-card-/);
    expect(cards[0]).toHaveTextContent('雷獣');
    expect(cards[1]).toHaveTextContent('火炎ドラゴン');
    expect(cards[2]).toHaveTextContent('水の精霊');
    expect(cards[3]).toHaveTextContent('風の妖精');
  });

  it('複数フィルターの組み合わせが動作する', async () => {
    render(<MonsterCollection />);

    await user.click(screen.getByText('フィルター & ソート'));
    
    // 獲得済み + ことわざ
    const statusButtons = screen.getAllByText('獲得済み');
    await user.click(statusButtons[statusButtons.length - 1]);
    await user.click(screen.getByRole('button', { name: 'ことわざ' }));
    
    expect(screen.getByText('2体のモンスターを表示中')).toBeInTheDocument();
    expect(screen.getByText(/火炎ドラゴン/)).toBeInTheDocument();
    expect(screen.getByText(/水の精霊/)).toBeInTheDocument();
    expect(screen.queryByText(/雷獣/)).not.toBeInTheDocument();
  });

  it('フィルターリセットが動作する', async () => {
    render(<MonsterCollection />);

    await user.click(screen.getByText('フィルター & ソート'));
    
    // フィルターを適用
    await user.click(screen.getByRole('button', { name: 'レジェンダリー' }));
    expect(screen.getByText('1体のモンスターを表示中')).toBeInTheDocument();
    
    // 検索結果が0になるようなフィルターを適用
    const statusButtons = screen.getAllByText('未獲得');
    await user.click(statusButtons[statusButtons.length - 1]);
    
    expect(screen.getByText('0体のモンスターを表示中')).toBeInTheDocument();
    expect(screen.getByText('該当するモンスターが見つかりません')).toBeInTheDocument();
    
    // リセットボタンをクリック
    await user.click(screen.getByText('フィルターをリセット'));
    
    expect(screen.getByText('4体のモンスターを表示中')).toBeInTheDocument();
  });

  it('日付順ソートがデフォルトで適用される', () => {
    render(<MonsterCollection />);
    
    const cards = screen.getAllByTestId(/monster-card-/);
    // 最新の日付が最初に来る
    expect(cards[0]).toHaveTextContent('雷獣'); // 2025-01-21
    expect(cards[1]).toHaveTextContent('火炎ドラゴン'); // 2025-01-20
    expect(cards[2]).toHaveTextContent('水の精霊'); // 2025-01-19
    expect(cards[3]).toHaveTextContent('風の妖精'); // 未獲得は最後
  });

  it('レアリティ順ソートが正しく動作する', async () => {
    render(<MonsterCollection />);

    await user.click(screen.getByText('フィルター & ソート'));
    await user.click(screen.getByRole('button', { name: 'レアリティ順' }));
    
    const cards = screen.getAllByTestId(/monster-card-/);
    expect(cards[0]).toHaveTextContent('火炎ドラゴン'); // legendary
    expect(cards[1]).toHaveTextContent('雷獣'); // epic
    expect(cards[2]).toHaveTextContent('水の精霊'); // rare
    expect(cards[3]).toHaveTextContent('風の妖精'); // common
  });

  it('プログレスバーがアニメーション表示される', () => {
    render(<MonsterCollection />);
    
    const progressBar = screen.getByText('完成度').parentElement?.parentElement?.querySelector('.bg-gradient-to-r');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveStyle({ width: '75%' });
  });
});