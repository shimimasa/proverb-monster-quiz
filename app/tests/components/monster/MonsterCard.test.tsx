import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MonsterCard } from '@/components/monster/MonsterCard';
import type { Monster } from '@/types';

// MonsterImageコンポーネントのモック
vi.mock('@/components/monster/MonsterImage', () => ({
  MonsterImage: ({ monster, size, className }: any) => (
    <div 
      data-testid="monster-image" 
      className={className}
      style={{ width: size, height: size }}
    >
      {monster.image}
    </div>
  ),
}));

describe('MonsterCard', () => {
  const mockMonster: Monster = {
    id: 'monster_1',
    name: 'ことわざドラゴン',
    image: 'dragon.png',
    rarity: 'rare',
    sourceContent: {
      id: 1,
      text: '猿も木から落ちる',
      reading: 'さるもきからおちる',
      meaning: 'どんなに得意なことでも、時には失敗することがある',
      difficulty: '小学生',
      example_sentence: 'プロの料理人でも失敗することがある。',
      type: 'proverb',
    },
    unlocked: true,
    dateObtained: new Date('2025-01-20'),
  };

  describe('未解放のモンスター', () => {
    it('未発見として表示される', () => {
      const unlockedMonster: Monster = {
        ...mockMonster,
        unlocked: false,
      };

      render(<MonsterCard monster={unlockedMonster} />);

      expect(screen.getByText('未発見')).toBeInTheDocument();
      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('鍵アイコンが表示される', () => {
      const unlockedMonster: Monster = {
        ...mockMonster,
        unlocked: false,
      };

      const { container } = render(<MonsterCard monster={unlockedMonster} />);
      const lockIcon = container.querySelector('.fa-lock');
      expect(lockIcon).toBeInTheDocument();
    });

    it('レアリティに応じたグラデーションが表示される', () => {
      const unlockedMonster: Monster = {
        ...mockMonster,
        unlocked: false,
        rarity: 'legendary',
      };

      const { container } = render(<MonsterCard monster={unlockedMonster} />);
      const gradient = container.querySelector('.bg-gradient-to-r');
      expect(gradient).toHaveClass('from-yellow-400', 'to-yellow-600');
    });
  });

  describe('解放済みのモンスター', () => {
    it('モンスター情報が正しく表示される', () => {
      render(<MonsterCard monster={mockMonster} />);

      expect(screen.getByText('ことわざドラゴン')).toBeInTheDocument();
      expect(screen.getByText('ことわざ')).toBeInTheDocument();
      expect(screen.getByTestId('monster-image')).toBeInTheDocument();
    });

    it('レアリティに応じたボーダーカラーが適用される', () => {
      const { container } = render(<MonsterCard monster={mockMonster} />);
      const card = container.querySelector('.border-2');
      expect(card).toHaveClass('border-blue-400');
    });

    it('レジェンダリーの場合は星アイコンが表示される', () => {
      const legendaryMonster: Monster = {
        ...mockMonster,
        rarity: 'legendary',
      };

      const { container } = render(<MonsterCard monster={legendaryMonster} />);
      const starIcon = container.querySelector('.fa-star');
      expect(starIcon).toBeInTheDocument();
      expect(starIcon).toHaveClass('animate-pulse');
    });

    it('レジェンダリー以外では星アイコンが表示されない', () => {
      const { container } = render(<MonsterCard monster={mockMonster} />);
      const starIcon = container.querySelector('.fa-star');
      expect(starIcon).not.toBeInTheDocument();
    });

    it('クリックすると詳細が表示される', () => {
      render(<MonsterCard monster={mockMonster} />);

      const card = screen.getByText('ことわざドラゴン').closest('div[class*="cursor-pointer"]');
      fireEvent.click(card!);

      // 詳細モーダルが表示されることを確認
      expect(screen.getByText('モンスター詳細')).toBeInTheDocument();
      expect(screen.getByText('獲得日')).toBeInTheDocument();
    });
  });

  describe('コンテンツタイプの表示', () => {
    it('ことわざタイプが正しく表示される', () => {
      render(<MonsterCard monster={mockMonster} />);
      expect(screen.getByText('ことわざ')).toBeInTheDocument();
    });

    it('慣用句タイプが正しく表示される', () => {
      const idiomMonster: Monster = {
        ...mockMonster,
        sourceContent: {
          ...mockMonster.sourceContent,
          type: 'idiom',
        },
      };

      render(<MonsterCard monster={idiomMonster} />);
      expect(screen.getByText('慣用句')).toBeInTheDocument();
    });

    it('四字熟語タイプが正しく表示される', () => {
      const fourCharMonster: Monster = {
        ...mockMonster,
        sourceContent: {
          ...mockMonster.sourceContent,
          type: 'four_character_idiom',
        },
      };

      render(<MonsterCard monster={fourCharMonster} />);
      expect(screen.getByText('四字熟語')).toBeInTheDocument();
    });
  });

  describe('レアリティ表示', () => {
    const testCases: { rarity: Monster['rarity']; borderClass: string; glowClass?: string }[] = [
      { rarity: 'common', borderClass: 'border-gray-300' },
      { rarity: 'rare', borderClass: 'border-blue-400', glowClass: 'shadow-blue-300' },
      { rarity: 'epic', borderClass: 'border-purple-400', glowClass: 'shadow-purple-300' },
      { rarity: 'legendary', borderClass: 'border-yellow-400', glowClass: 'shadow-yellow-300' },
    ];

    testCases.forEach(({ rarity, borderClass, glowClass }) => {
      it(`${rarity}のボーダーとシャドウが正しく適用される`, () => {
        const monster: Monster = {
          ...mockMonster,
          rarity,
        };

        const { container } = render(<MonsterCard monster={monster} />);
        const card = container.querySelector('.border-2');
        
        expect(card).toHaveClass(borderClass);
        if (glowClass) {
          expect(card).toHaveClass(glowClass);
        }
      });
    });
  });

  describe('モンスター詳細モーダル', () => {
    it('詳細情報が正しく表示される', () => {
      render(<MonsterCard monster={mockMonster} />);

      const card = screen.getByText('ことわざドラゴン').closest('div[class*="cursor-pointer"]');
      fireEvent.click(card!);

      // 詳細情報の確認
      expect(screen.getByText('レア')).toBeInTheDocument();
      expect(screen.getByText('猿も木から落ちる')).toBeInTheDocument();
      expect(screen.getByText('さるもきからおちる')).toBeInTheDocument();
      expect(screen.getByText('どんなに得意なことでも、時には失敗することがある')).toBeInTheDocument();
    });

    it('閉じるボタンでモーダルが閉じる', () => {
      render(<MonsterCard monster={mockMonster} />);

      const card = screen.getByText('ことわざドラゴン').closest('div[class*="cursor-pointer"]');
      fireEvent.click(card!);

      const closeButton = screen.getByText('閉じる');
      fireEvent.click(closeButton);

      expect(screen.queryByText('モンスター詳細')).not.toBeInTheDocument();
    });

    it('獲得日が正しく表示される', () => {
      render(<MonsterCard monster={mockMonster} />);

      const card = screen.getByText('ことわざドラゴン').closest('div[class*="cursor-pointer"]');
      fireEvent.click(card!);

      expect(screen.getByText('2025/1/20')).toBeInTheDocument();
    });
  });

  describe('インタラクション', () => {
    it('ホバー時にスケールアップする', () => {
      const { container } = render(<MonsterCard monster={mockMonster} />);
      const card = container.querySelector('[class*="cursor-pointer"]');
      
      expect(card).toHaveClass('hover:shadow-lg');
    });

    it('未解放モンスターはクリックできない', () => {
      const unlockedMonster: Monster = {
        ...mockMonster,
        unlocked: false,
      };

      render(<MonsterCard monster={unlockedMonster} />);
      
      const card = screen.getByText('未発見').closest('div');
      fireEvent.click(card!);

      // 詳細モーダルが表示されないことを確認
      expect(screen.queryByText('モンスター詳細')).not.toBeInTheDocument();
    });
  });
});