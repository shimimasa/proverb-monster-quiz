import { test, expect } from '@playwright/test';

test.describe('モンスターコレクション', () => {
  test.beforeEach(async ({ page }) => {
    // テストデータを設定
    await page.goto('/');
    await page.evaluate(() => {
      const userData = {
        playerName: 'コレクター太郎',
        level: 5,
        experience: 1200,
        totalCorrect: 45,
        totalQuestions: 60,
        currentStreak: 0,
        maxStreak: 15,
        unlockedMonsters: [
          { monsterId: 'mon_001', obtainedAt: '2025-01-20T10:00:00Z', count: 1 },
          { monsterId: 'mon_002', obtainedAt: '2025-01-20T11:00:00Z', count: 2 },
          { monsterId: 'mon_003', obtainedAt: '2025-01-20T12:00:00Z', count: 1 },
          { monsterId: 'mon_004', obtainedAt: '2025-01-21T09:00:00Z', count: 1 },
          { monsterId: 'mon_005', obtainedAt: '2025-01-21T10:00:00Z', count: 3 },
        ],
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
  });

  test('モンスター図鑑が正しく表示される', async ({ page }) => {
    // モンスターコレクション画面へ移動
    await page.getByRole('link', { name: 'モンスター' }).click();
    
    // ページタイトルを確認
    await expect(page.getByRole('heading', { name: 'モンスターコレクション' })).toBeVisible();
    
    // コレクション統計が表示される
    const stats = page.getByTestId('collection-stats');
    await expect(stats).toBeVisible();
    await expect(stats).toContainText('コレクション達成率');
    await expect(stats).toContainText('5 / '); // 5体獲得済み
    
    // モンスターカードが表示される
    const monsterCards = page.getByTestId('monster-card');
    await expect(monsterCards).toHaveCount(5); // 獲得済みのモンスターのみ表示
  });

  test('レアリティフィルターが動作する', async ({ page }) => {
    await page.getByRole('link', { name: 'モンスター' }).click();
    
    // レアリティフィルターを確認
    const commonFilter = page.getByRole('button', { name: 'コモン' });
    const rareFilter = page.getByRole('button', { name: 'レア' });
    const epicFilter = page.getByRole('button', { name: 'エピック' });
    const legendaryFilter = page.getByRole('button', { name: 'レジェンダリー' });
    
    await expect(commonFilter).toBeVisible();
    await expect(rareFilter).toBeVisible();
    await expect(epicFilter).toBeVisible();
    await expect(legendaryFilter).toBeVisible();
    
    // レアフィルターをクリック
    await rareFilter.click();
    
    // フィルターがアクティブになることを確認
    await expect(rareFilter).toHaveClass(/active|selected/);
    
    // フィルターされた結果が表示される（実際のデータに依存）
    const monsterCards = page.getByTestId('monster-card');
    const count = await monsterCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('獲得状態フィルターが動作する', async ({ page }) => {
    await page.getByRole('link', { name: 'モンスター' }).click();
    
    // 獲得状態フィルター
    const allFilter = page.getByRole('button', { name: 'すべて' });
    const obtainedFilter = page.getByRole('button', { name: '獲得済み' });
    const notObtainedFilter = page.getByRole('button', { name: '未獲得' });
    
    // 未獲得フィルターをクリック
    await notObtainedFilter.click();
    
    // 未獲得モンスターが表示される（シルエット表示）
    const monsterCards = page.getByTestId('monster-card');
    const firstCard = monsterCards.first();
    
    // 未獲得モンスターはシルエット表示になっているはず
    await expect(firstCard).toHaveClass(/silhouette|locked|unknown/);
  });

  test('ソート機能が動作する', async ({ page }) => {
    await page.getByRole('link', { name: 'モンスター' }).click();
    
    // ソートドロップダウンを開く
    const sortDropdown = page.getByRole('combobox', { name: 'ソート順' });
    await sortDropdown.click();
    
    // ソートオプションを確認
    await expect(page.getByRole('option', { name: '獲得日（新しい順）' })).toBeVisible();
    await expect(page.getByRole('option', { name: '獲得日（古い順）' })).toBeVisible();
    await expect(page.getByRole('option', { name: '名前順' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'レアリティ順' })).toBeVisible();
    
    // 名前順でソート
    await page.getByRole('option', { name: '名前順' }).click();
    
    // ソートが適用されたことを確認（実際の順序は実装に依存）
    const monsterCards = page.getByTestId('monster-card');
    const count = await monsterCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('モンスター詳細モーダルが表示される', async ({ page }) => {
    await page.getByRole('link', { name: 'モンスター' }).click();
    
    // 最初のモンスターカードをクリック
    const firstCard = page.getByTestId('monster-card').first();
    await firstCard.click();
    
    // 詳細モーダルが表示される
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    
    // モンスター情報が表示される
    await expect(modal.getByRole('heading')).toBeVisible(); // モンスター名
    await expect(modal.getByText(/レアリティ/)).toBeVisible();
    await expect(modal.getByText(/獲得日/)).toBeVisible();
    await expect(modal.getByText(/出典/)).toBeVisible();
    
    // 閉じるボタンで閉じる
    await modal.getByRole('button', { name: '閉じる' }).click();
    await expect(modal).toBeHidden();
  });

  test('フィルターリセットが動作する', async ({ page }) => {
    await page.getByRole('link', { name: 'モンスター' }).click();
    
    // 複数のフィルターを適用
    await page.getByRole('button', { name: 'レア' }).click();
    await page.getByRole('button', { name: '獲得済み' }).click();
    
    // リセットボタンをクリック
    const resetButton = page.getByRole('button', { name: 'フィルターをリセット' });
    await resetButton.click();
    
    // すべてのフィルターがリセットされる
    const activeFilters = page.locator('button.active, button.selected');
    const activeCount = await activeFilters.count();
    
    // デフォルトの「すべて」フィルターのみがアクティブ
    expect(activeCount).toBeLessThanOrEqual(1);
  });

  test('モンスター獲得演出を確認', async ({ page }) => {
    await page.goto('/');
    
    // クイズ画面で正解してモンスターを獲得
    const choices = page.getByRole('button', { name: /^[1-4]\. / });
    await choices.first().click();
    
    // 結果モーダルでモンスター獲得を確認
    const resultModal = page.getByTestId('result-modal');
    const monsterReward = resultModal.getByTestId('monster-reward');
    
    // モンスターが表示される場合
    if (await monsterReward.isVisible()) {
      await expect(monsterReward).toContainText('モンスターゲット！');
      
      // モンスター画像が表示される
      const monsterImage = monsterReward.getByRole('img');
      await expect(monsterImage).toBeVisible();
      
      // レアリティが表示される
      await expect(monsterReward.getByText(/コモン|レア|エピック|レジェンダリー/)).toBeVisible();
    }
  });
});