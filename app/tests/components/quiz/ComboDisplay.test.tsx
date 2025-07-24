import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ComboDisplay } from '@/components/quiz/ComboDisplay';
import type { ComboState, ComboBonus } from '@/types';

describe('ComboDisplay', () => {
  const mockComboState: ComboState = {
    currentCombo: 0,
    maxCombo: 0,
    lastCorrectTime: null,
    comboMultiplier: 1.0,
    isOnFire: false,
  };

  const mockComboBonus: ComboBonus = {
    experienceMultiplier: 1.0,
    rareMonsterChanceBonus: 0,
    message: '',
    effectType: 'normal',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('表示条件', () => {
    it('コンボが0の場合は何も表示されない', () => {
      const { container } = render(
        <ComboDisplay 
          comboState={mockComboState} 
          comboBonus={mockComboBonus} 
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('コンボが1以上の場合はコンボ表示される', () => {
      const comboState: ComboState = {
        ...mockComboState,
        currentCombo: 3,
      };

      render(
        <ComboDisplay 
          comboState={comboState} 
          comboBonus={mockComboBonus} 
        />
      );

      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('COMBO')).toBeInTheDocument();
    });

    it('コンボブレイクアニメーション中は表示される', () => {
      render(
        <ComboDisplay 
          comboState={mockComboState} 
          comboBonus={mockComboBonus}
          showBreakAnimation={true}
        />
      );

      expect(screen.getByText('COMBO BREAK')).toBeInTheDocument();
    });
  });

  describe('コンボボーナス表示', () => {
    it('コンボボーナスメッセージが表示される', () => {
      const comboState: ComboState = {
        ...mockComboState,
        currentCombo: 3,
      };
      const comboBonus: ComboBonus = {
        ...mockComboBonus,
        message: '3連続正解！',
      };

      render(
        <ComboDisplay 
          comboState={comboState} 
          comboBonus={comboBonus} 
        />
      );

      expect(screen.getByText('3連続正解！')).toBeInTheDocument();
    });

    it('ボーナスメッセージは2秒後に消える', async () => {
      const comboState: ComboState = {
        ...mockComboState,
        currentCombo: 3,
      };
      const comboBonus: ComboBonus = {
        ...mockComboBonus,
        message: '3連続正解！',
      };

      render(
        <ComboDisplay 
          comboState={comboState} 
          comboBonus={comboBonus} 
        />
      );

      expect(screen.getByText('3連続正解！')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('3連続正解！')).not.toBeInTheDocument();
      }, { timeout: 2500 });
    });

    it('経験値ボーナス倍率が表示される', () => {
      const comboState: ComboState = {
        ...mockComboState,
        currentCombo: 5,
      };
      const comboBonus: ComboBonus = {
        ...mockComboBonus,
        experienceMultiplier: 1.2,
      };

      render(
        <ComboDisplay 
          comboState={comboState} 
          comboBonus={comboBonus} 
        />
      );

      expect(screen.getByText('EXP x1.2')).toBeInTheDocument();
    });
  });

  describe('炎エフェクト', () => {
    it('通常時は炎アイコンが表示されない', () => {
      const comboState: ComboState = {
        ...mockComboState,
        currentCombo: 3,
        isOnFire: false,
      };
      const comboBonus: ComboBonus = {
        ...mockComboBonus,
        effectType: 'normal',
      };

      render(
        <ComboDisplay 
          comboState={comboState} 
          comboBonus={comboBonus} 
        />
      );

      const fireIcons = screen.queryAllByTestId('fire-icon');
      expect(fireIcons).toHaveLength(0);
    });

    it('fireエフェクト時は炎アイコンが2つ', () => {
      const comboState: ComboState = {
        ...mockComboState,
        currentCombo: 5,
        isOnFire: true,
      };
      const comboBonus: ComboBonus = {
        ...mockComboBonus,
        effectType: 'fire',
      };

      render(
        <ComboDisplay 
          comboState={comboState} 
          comboBonus={comboBonus} 
        />
      );

      const fireIcons = screen.getAllByTestId('fire-icon');
      expect(fireIcons).toHaveLength(2);
    });

    it('super_fireエフェクト時は炎アイコンが3つ', () => {
      const comboState: ComboState = {
        ...mockComboState,
        currentCombo: 20,
        isOnFire: true,
      };
      const comboBonus: ComboBonus = {
        ...mockComboBonus,
        effectType: 'super_fire',
      };

      render(
        <ComboDisplay 
          comboState={comboState} 
          comboBonus={comboBonus} 
        />
      );

      const fireIcons = screen.getAllByTestId('fire-icon');
      expect(fireIcons).toHaveLength(3);
    });
  });

  describe('スタイル変化', () => {
    it('通常時のグラデーション', () => {
      const comboState: ComboState = {
        ...mockComboState,
        currentCombo: 3,
      };

      const { container } = render(
        <ComboDisplay 
          comboState={comboState} 
          comboBonus={mockComboBonus} 
        />
      );

      const comboContainer = container.querySelector('.bg-gradient-to-r');
      expect(comboContainer).toHaveClass('from-blue-400', 'to-purple-500');
    });

    it('fireエフェクト時のグラデーション', () => {
      const comboState: ComboState = {
        ...mockComboState,
        currentCombo: 5,
        isOnFire: true,
      };
      const comboBonus: ComboBonus = {
        ...mockComboBonus,
        effectType: 'fire',
      };

      const { container } = render(
        <ComboDisplay 
          comboState={comboState} 
          comboBonus={comboBonus} 
        />
      );

      const comboContainer = container.querySelector('.bg-gradient-to-r');
      expect(comboContainer).toHaveClass('from-orange-400', 'to-yellow-500');
    });

    it('super_fireエフェクト時のグラデーション', () => {
      const comboState: ComboState = {
        ...mockComboState,
        currentCombo: 20,
        isOnFire: true,
      };
      const comboBonus: ComboBonus = {
        ...mockComboBonus,
        effectType: 'super_fire',
      };

      const { container } = render(
        <ComboDisplay 
          comboState={comboState} 
          comboBonus={comboBonus} 
        />
      );

      const comboContainer = container.querySelector('.bg-gradient-to-r');
      expect(comboContainer).toHaveClass('from-red-500', 'to-orange-500');
    });
  });

  describe('タイムゲージ表示', () => {
    it('コンボ継続中はタイムゲージが表示される', () => {
      const comboState: ComboState = {
        ...mockComboState,
        currentCombo: 3,
        lastCorrectTime: new Date(),
      };

      const { container } = render(
        <ComboDisplay 
          comboState={comboState} 
          comboBonus={mockComboBonus} 
        />
      );

      const timeGauge = container.querySelector('.h-2.bg-gray-200');
      expect(timeGauge).toBeInTheDocument();
    });
  });
});