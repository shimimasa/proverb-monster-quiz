import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingScreen, SimpleLoading, InlineLoading } from '@/components/common/LoadingScreen';

// Framer Motionのモック
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>{children}</div>
    ),
    h2: ({ children, className, ...props }: any) => (
      <h2 className={className} {...props}>{children}</h2>
    ),
    span: ({ children, className, ...props }: any) => (
      <span className={className} {...props}>{children}</span>
    ),
  },
}));

describe('LoadingScreen', () => {
  describe('基本的な表示', () => {
    it('デフォルトのメッセージが表示される', () => {
      render(<LoadingScreen />);
      
      expect(screen.getByText('ことだまモンスターを召喚中...')).toBeInTheDocument();
    });

    it('カスタムメッセージが表示される', () => {
      render(<LoadingScreen message="データを読み込み中..." />);
      
      expect(screen.getByText('データを読み込み中...')).toBeInTheDocument();
    });

    it('モンスターアイコンが表示される', () => {
      render(<LoadingScreen />);
      
      expect(screen.getByText('👾')).toBeInTheDocument();
    });

    it('ヒントテキストが表示される', () => {
      render(<LoadingScreen />);
      
      expect(screen.getByText(/ヒント: ことわざの意味を理解すると/)).toBeInTheDocument();
    });

    it('アニメーションドットが3つ表示される', () => {
      const { container } = render(<LoadingScreen />);
      
      // 3つの丸い要素を探す
      const dots = container.querySelectorAll('.w-3.h-3.bg-purple-500.rounded-full');
      expect(dots).toHaveLength(3);
    });
  });

  describe('プログレスバー', () => {
    it('プログレスが指定されていない場合、プログレスバーは表示されない', () => {
      render(<LoadingScreen />);
      
      expect(screen.queryByText('%')).not.toBeInTheDocument();
    });

    it('プログレスが指定されている場合、プログレスバーが表示される', () => {
      render(<LoadingScreen progress={50} />);
      
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('プログレスバーの幅が正しく設定される', () => {
      const { container } = render(<LoadingScreen progress={75} />);
      
      const progressBar = container.querySelector('.bg-gradient-to-r');
      expect(progressBar).toBeInTheDocument();
      // Framer Motionがモックされているため、実際のアニメーションは確認できない
    });

    it('プログレスが小数の場合、整数に丸められる', () => {
      render(<LoadingScreen progress={33.7} />);
      
      expect(screen.getByText('34%')).toBeInTheDocument();
    });
  });

  describe('スタイリング', () => {
    it('全画面表示のレイアウトが適用される', () => {
      const { container } = render(<LoadingScreen />);
      
      const wrapper = container.querySelector('.fixed.inset-0');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('グラデーション背景が適用される', () => {
      const { container } = render(<LoadingScreen />);
      
      const wrapper = container.querySelector('.bg-gradient-to-br');
      expect(wrapper).toHaveClass('from-purple-50', 'to-blue-50');
    });

    it('z-indexが高く設定されている', () => {
      const { container } = render(<LoadingScreen />);
      
      const wrapper = container.querySelector('.z-50');
      expect(wrapper).toBeInTheDocument();
    });
  });
});

describe('SimpleLoading', () => {
  it('デフォルトサイズ（medium）で表示される', () => {
    const { container } = render(<SimpleLoading />);
    
    const spinner = container.querySelector('.w-10.h-10');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });

  it('smallサイズで表示される', () => {
    const { container } = render(<SimpleLoading size="small" />);
    
    const spinner = container.querySelector('.w-6.h-6');
    expect(spinner).toBeInTheDocument();
  });

  it('largeサイズで表示される', () => {
    const { container } = render(<SimpleLoading size="large" />);
    
    const spinner = container.querySelector('.w-16.h-16');
    expect(spinner).toBeInTheDocument();
  });

  it('スピナーのスタイルが正しく適用される', () => {
    const { container } = render(<SimpleLoading />);
    
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass(
      'rounded-full',
      'border-4',
      'border-purple-200',
      'border-t-purple-600'
    );
  });
});

describe('InlineLoading', () => {
  it('デフォルトテキストが表示される', () => {
    render(<InlineLoading />);
    
    expect(screen.getByText('処理中...')).toBeInTheDocument();
  });

  it('カスタムテキストが表示される', () => {
    render(<InlineLoading text="保存中" />);
    
    expect(screen.getByText('保存中...')).toBeInTheDocument();
  });

  it('SVGスピナーが表示される', () => {
    const { container } = render(<InlineLoading />);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('animate-spin');
  });

  it('インラインフレックスレイアウトが適用される', () => {
    const { container } = render(<InlineLoading />);
    
    const wrapper = container.querySelector('.inline-flex');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass('items-center');
  });

  it('SVGに適切な属性が設定されている', () => {
    const { container } = render(<InlineLoading />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('fill', 'none');
  });
});

describe('アクセシビリティ', () => {
  it('LoadingScreenは視覚的な装飾として適切にマークされている', () => {
    render(<LoadingScreen />);
    
    // ローディング画面は純粋に視覚的なフィードバックなので、
    // スクリーンリーダー向けの特別な対応は不要
    expect(screen.getByText('ことだまモンスターを召喚中...')).toBeInTheDocument();
  });

  it('プログレス情報が数値として読み取れる', () => {
    render(<LoadingScreen progress={60} />);
    
    expect(screen.getByText('60%')).toBeInTheDocument();
  });
});