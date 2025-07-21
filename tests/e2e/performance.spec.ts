import { test, expect } from '@playwright/test';

test.describe('E2Eパフォーマンステスト', () => {
  test('初期ロード時間が3秒以内', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // 設定画面が表示されるまで待機
    await expect(page.getByRole('heading', { name: '設定' })).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3秒以内
  });

  test('クイズ画面への遷移が1秒以内', async ({ page }) => {
    await page.goto('/');
    
    // 既存ユーザーをシミュレート
    await page.evaluate(() => {
      const userData = {
        playerName: 'パフォーマンステスター',
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
    
    const startTime = Date.now();
    
    // クイズ画面に遷移
    await page.getByRole('link', { name: 'クイズ' }).click();
    await expect(page.getByText(/第\d+問/)).toBeVisible();
    
    const transitionTime = Date.now() - startTime;
    expect(transitionTime).toBeLessThan(1000); // 1秒以内
  });

  test('大量のモンスターデータでのスクロールパフォーマンス', async ({ page }) => {
    await page.goto('/');
    
    // 大量のモンスターを持つユーザーデータ
    await page.evaluate(() => {
      const monsters = Array.from({ length: 200 }, (_, i) => ({
        monsterId: `mon_${String(i + 1).padStart(3, '0')}`,
        obtainedAt: new Date().toISOString(),
        count: 1,
      }));
      
      const userData = {
        playerName: 'コレクター',
        level: 50,
        experience: 10000,
        totalCorrect: 1000,
        totalQuestions: 1200,
        currentStreak: 0,
        maxStreak: 100,
        unlockedMonsters: monsters,
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
    await page.getByRole('link', { name: 'モンスター' }).click();
    
    // モンスターコレクション画面が表示される
    await expect(page.getByRole('heading', { name: 'モンスターコレクション' })).toBeVisible();
    
    // スクロールパフォーマンスを測定
    const startTime = Date.now();
    
    // ページの最下部までスクロール
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // スクロール完了を待つ
    await page.waitForTimeout(100);
    
    // ページの最上部に戻る
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    
    const scrollTime = Date.now() - startTime;
    expect(scrollTime).toBeLessThan(500); // スムーズなスクロール
  });

  test('問題回答のレスポンス時間', async ({ page }) => {
    await page.goto('/');
    
    // 既存ユーザーをシミュレート
    await page.evaluate(() => {
      const userData = {
        playerName: 'レスポンステスター',
        level: 1,
        experience: 0,
        totalCorrect: 0,
        totalQuestions: 0,
        currentStreak: 0,
        maxStreak: 0,
        unlockedMonsters: [],
        lastPlayedDate: new Date().toISOString(),
        settings: {
          soundEnabled: false, // 音声を無効化してパフォーマンスを測定
          volume: 0.5,
          difficulty: 'normal' as const,
          contentTypes: ['proverb'] as const[],
        },
      };
      window.localStorage.setItem('kotodama-user-progress', JSON.stringify(userData));
    });
    
    await page.reload();
    
    // 10問連続で回答してレスポンス時間を測定
    const responseTimes: number[] = [];
    
    for (let i = 0; i < 10; i++) {
      await expect(page.getByText(/第\d+問/)).toBeVisible();
      
      const choices = page.getByRole('button', { name: /^[1-4]\. / });
      const firstChoice = choices.first();
      
      const startTime = Date.now();
      await firstChoice.click();
      
      // 結果モーダルが表示されるまで
      await expect(page.getByTestId('result-modal')).toBeVisible();
      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);
      
      // 次の問題へ
      await page.getByRole('button', { name: '次の問題へ' }).click();
    }
    
    // 平均レスポンス時間を計算
    const avgResponseTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
    expect(avgResponseTime).toBeLessThan(300); // 平均300ms以内
    
    // 最大レスポンス時間も確認
    const maxResponseTime = Math.max(...responseTimes);
    expect(maxResponseTime).toBeLessThan(500); // 最大でも500ms以内
  });

  test('統計画面のチャート描画パフォーマンス', async ({ page }) => {
    await page.goto('/');
    
    // 統計データが豊富なユーザー
    await page.evaluate(() => {
      const userData = {
        playerName: '統計テスター',
        level: 30,
        experience: 5000,
        totalCorrect: 500,
        totalQuestions: 600,
        currentStreak: 10,
        maxStreak: 50,
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
    
    const startTime = Date.now();
    
    // 統計画面へ移動
    await page.getByRole('link', { name: '統計' }).click();
    
    // チャートが表示されるまで待機
    await expect(page.getByTestId('stats-chart')).toBeVisible();
    
    const renderTime = Date.now() - startTime;
    expect(renderTime).toBeLessThan(1500); // 1.5秒以内
    
    // 期間切り替えのパフォーマンス
    const periodStartTime = Date.now();
    
    // 週間表示に切り替え
    await page.getByRole('button', { name: '週間' }).click();
    await page.waitForTimeout(100);
    
    // 月間表示に切り替え
    await page.getByRole('button', { name: '月間' }).click();
    await page.waitForTimeout(100);
    
    const periodSwitchTime = Date.now() - periodStartTime;
    expect(periodSwitchTime).toBeLessThan(500); // 切り替えは高速
  });

  test('設定変更の即時反映パフォーマンス', async ({ page }) => {
    await page.goto('/');
    
    // 既存ユーザーをシミュレート
    await page.evaluate(() => {
      const userData = {
        playerName: '設定変更テスター',
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
    await page.getByRole('link', { name: '設定' }).click();
    
    // 複数の設定を連続で変更
    const startTime = Date.now();
    
    // プレイヤー名変更
    const nameInput = page.getByLabel('プレイヤー名');
    await nameInput.clear();
    await nameInput.fill('新しい名前');
    
    // 難易度変更
    await page.getByLabel('難易度').selectOption('hard');
    
    // サウンド切り替え
    await page.getByLabel('効果音').click();
    
    // コンテンツタイプ追加
    await page.getByLabel('四字熟語').check();
    await page.getByLabel('慣用句').check();
    
    // 保存
    await page.getByRole('button', { name: '設定を保存' }).click();
    
    // 保存完了メッセージが表示される
    await expect(page.getByText('設定を保存しました')).toBeVisible();
    
    const saveTime = Date.now() - startTime;
    expect(saveTime).toBeLessThan(1000); // 1秒以内に完了
  });

  test('メモリ使用量の安定性（長時間プレイ）', async ({ page }) => {
    await page.goto('/');
    
    // 既存ユーザーをシミュレート
    await page.evaluate(() => {
      const userData = {
        playerName: 'メモリテスター',
        level: 1,
        experience: 0,
        totalCorrect: 0,
        totalQuestions: 0,
        currentStreak: 0,
        maxStreak: 0,
        unlockedMonsters: [],
        lastPlayedDate: new Date().toISOString(),
        settings: {
          soundEnabled: false,
          volume: 0.5,
          difficulty: 'normal' as const,
          contentTypes: ['proverb'] as const[],
        },
      };
      window.localStorage.setItem('kotodama-user-progress', JSON.stringify(userData));
    });
    
    await page.reload();
    
    // 初期メモリ使用量を記録
    const initialMetrics = await page.metrics();
    const initialJSHeapSize = initialMetrics.JSHeapUsedSize;
    
    // 50問連続でプレイ
    for (let i = 0; i < 50; i++) {
      const choices = page.getByRole('button', { name: /^[1-4]\. / });
      await choices.first().click();
      await page.getByRole('button', { name: '次の問題へ' }).click();
    }
    
    // 最終メモリ使用量を記録
    const finalMetrics = await page.metrics();
    const finalJSHeapSize = finalMetrics.JSHeapUsedSize;
    
    // メモリリークがないことを確認（増加が10MB以内）
    const memoryIncrease = finalJSHeapSize - initialJSHeapSize;
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB以内
  });
});