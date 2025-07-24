import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('アクセシビリティテスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const userData = {
        playerName: 'アクセシビリティテスト',
        level: 1,
        experience: 0,
        totalCorrect: 0,
        totalQuestions: 0,
        currentStreak: 0,
        maxStreak: 0,
        unlockedMonsters: [],
        lastPlayedDate: new Date().toISOString(),
        settings: {
          soundEnabled: true,
          volume: 0.5,
          difficulty: 'normal' as const,
          contentTypes: ['proverb'] as const[],
        },
      };
      window.localStorage.setItem('kotodama-user-progress', JSON.stringify(userData));
    });
    await page.reload();
  });

  test('クイズ画面のアクセシビリティ', async ({ page }) => {
    await injectAxe(page);
    
    // クイズ画面でaxeを実行
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });
    
    // キーボードナビゲーションの確認
    await page.keyboard.press('Tab');
    let focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
    
    // スキップリンクの確認
    await page.keyboard.press('Tab');
    const skipLink = page.getByText('メインコンテンツへスキップ');
    await expect(skipLink).toBeFocused();
  });

  test('モンスターコレクション画面のアクセシビリティ', async ({ page }) => {
    await page.getByRole('link', { name: 'モンスター' }).click();
    
    await injectAxe(page);
    await checkA11y(page, null, {
      detailedReport: true,
    });
    
    // ARIAラベルの確認
    const heading = page.getByRole('heading', { name: 'モンスターコレクション' });
    await expect(heading).toBeVisible();
    
    // ランドマークロールの確認
    const main = page.getByRole('main');
    await expect(main).toBeVisible();
  });

  test('設定画面のアクセシビリティ', async ({ page }) => {
    await page.getByRole('link', { name: '設定' }).click();
    
    await injectAxe(page);
    await checkA11y(page, null, {
      detailedReport: true,
    });
    
    // フォーム要素のラベル確認
    const nameLabel = page.getByText('プレイヤー名');
    const nameInput = page.getByLabel('プレイヤー名');
    await expect(nameLabel).toBeVisible();
    await expect(nameInput).toBeVisible();
    
    // タブパネルのARIA属性確認
    const settingsTab = page.getByRole('tab', { name: '設定' });
    await expect(settingsTab).toHaveAttribute('aria-selected', 'true');
    await expect(settingsTab).toHaveAttribute('aria-controls');
  });

  test('カラーコントラストの確認', async ({ page }) => {
    // 各画面でコントラスト比を確認
    await injectAxe(page);
    
    const contrastResults = await page.evaluate(async () => {
      // @ts-ignore
      const results = await window.axe.run(document, {
        runOnly: ['color-contrast'],
      });
      return results;
    });
    
    expect(contrastResults.violations).toHaveLength(0);
  });

  test('キーボードナビゲーションの完全性', async ({ page }) => {
    // Tabキーですべてのインタラクティブ要素にアクセスできることを確認
    const interactiveElements = await page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])').all();
    
    for (let i = 0; i < interactiveElements.length; i++) {
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement);
      expect(focusedElement).toBeTruthy();
    }
  });

  test('スクリーンリーダー向けの動的アナウンス', async ({ page }) => {
    // aria-liveリージョンの確認
    const liveRegion = page.getByRole('status');
    await expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    
    // クイズで回答した際のアナウンス
    const choices = page.getByRole('button', { name: /^[1-4]\. / });
    await choices.first().click();
    
    // 結果がアナウンスされることを確認
    await expect(liveRegion).toContainText(/正解|不正解/);
  });

  test('フォーカス管理', async ({ page }) => {
    // モーダルが開いた時のフォーストラップ
    const choices = page.getByRole('button', { name: /^[1-4]\. / });
    await choices.first().click();
    
    const modal = page.getByTestId('result-modal');
    await expect(modal).toBeVisible();
    
    // フォーカスがモーダル内に移動していることを確認
    const focusedElement = await page.evaluate(() => document.activeElement);
    const isInModal = await page.evaluate((el) => {
      const modal = document.querySelector('[data-testid="result-modal"]');
      return modal?.contains(el as Node);
    }, focusedElement);
    
    expect(isInModal).toBeTruthy();
    
    // Escキーでモーダルを閉じられることを確認
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  });

  test('代替テキストとARIA説明', async ({ page }) => {
    await page.getByRole('link', { name: 'モンスター' }).click();
    
    // 画像の代替テキスト確認
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
      expect(alt).not.toBe('');
    }
    
    // アイコンのaria-hidden確認
    const icons = page.locator('[class*="icon"]');
    const iconCount = await icons.count();
    
    for (let i = 0; i < iconCount; i++) {
      const icon = icons.nth(i);
      const ariaHidden = await icon.getAttribute('aria-hidden');
      expect(ariaHidden).toBe('true');
    }
  });

  test('ハイコントラストモードの対応', async ({ page }) => {
    // ハイコントラストモードをシミュレート
    await page.emulateMedia({ colorScheme: 'dark' });
    
    // 基本的な要素が見えることを確認
    await expect(page.getByRole('heading', { name: /第\d+問/ })).toBeVisible();
    const choices = page.getByRole('button', { name: /^[1-4]\. / });
    await expect(choices.first()).toBeVisible();
  });

  test('モーション設定の尊重', async ({ page }) => {
    // prefers-reduced-motionをシミュレート
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    // アニメーションが無効化されていることを確認
    const animatedElement = page.locator('.animate-pulse, .animate-bounce, [class*="transition"]').first();
    
    if (await animatedElement.count() > 0) {
      const hasAnimation = await animatedElement.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.animationDuration !== '0s' || styles.transitionDuration !== '0s';
      });
      
      expect(hasAnimation).toBeFalsy();
    }
  });
});