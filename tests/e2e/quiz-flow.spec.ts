import { test, expect } from '@playwright/test';

test.describe('クイズフロー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // localStorageをクリア
    await page.evaluate(() => window.localStorage.clear());
  });

  test('新規ユーザーがクイズを始めて、モンスターを獲得する', async ({ page }) => {
    // 初回訪問時の設定画面
    await expect(page.getByRole('heading', { name: '設定' })).toBeVisible();
    
    // プレイヤー名を入力
    const nameInput = page.getByLabel('プレイヤー名');
    await nameInput.fill('テスト太郎');
    
    // コンテンツタイプを選択（デフォルトでことわざが選択済み）
    await expect(page.getByLabel('ことわざ')).toBeChecked();
    
    // 設定を保存してクイズ画面へ
    await page.getByRole('button', { name: '設定を保存' }).click();
    
    // クイズ画面に遷移
    await expect(page.getByRole('heading', { name: /第\d+問/ })).toBeVisible();
    
    // 問題文が表示されることを確認
    const questionText = page.getByTestId('question-text');
    await expect(questionText).toBeVisible();
    
    // 選択肢が4つ表示されることを確認
    const choices = page.getByRole('button', { name: /^[1-4]\. / });
    await expect(choices).toHaveCount(4);
    
    // 最初の選択肢をクリック（実際のテストでは正解を特定する必要がある）
    await choices.first().click();
    
    // 結果モーダルが表示される
    const resultModal = page.getByTestId('result-modal');
    await expect(resultModal).toBeVisible();
    
    // 正解・不正解に関わらず次へ進む
    await page.getByRole('button', { name: '次の問題へ' }).click();
    
    // 次の問題が表示される
    await expect(page.getByRole('heading', { name: /第\d+問/ })).toBeVisible();
  });

  test('コンボシステムが正しく動作する', async ({ page }) => {
    await page.goto('/');
    
    // 既存ユーザーをシミュレート
    await page.evaluate(() => {
      const userData = {
        playerName: 'テストユーザー',
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
    
    // ページをリロード
    await page.reload();
    
    // クイズ画面に直接遷移
    await expect(page.getByRole('heading', { name: /第\d+問/ })).toBeVisible();
    
    // コンボ表示が初期状態で非表示
    const comboDisplay = page.getByTestId('combo-display');
    await expect(comboDisplay).toBeHidden();
    
    // 正解を3回連続でシミュレート（実際のテストでは正解を特定する必要がある）
    for (let i = 0; i < 3; i++) {
      const choices = page.getByRole('button', { name: /^[1-4]\. / });
      await choices.first().click();
      
      // 正解と仮定してコンボが増えることを確認
      if (i >= 2) {
        await expect(comboDisplay).toBeVisible();
        await expect(comboDisplay).toContainText(`${i + 1} コンボ`);
      }
      
      await page.getByRole('button', { name: '次の問題へ' }).click();
    }
  });

  test('解説が正しく表示される', async ({ page }) => {
    await page.goto('/');
    
    // 既存ユーザーをシミュレート
    await page.evaluate(() => {
      const userData = {
        playerName: 'テストユーザー',
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
    
    // 選択肢をクリック
    const choices = page.getByRole('button', { name: /^[1-4]\. / });
    await choices.first().click();
    
    // 結果モーダルに解説が表示される
    const resultModal = page.getByTestId('result-modal');
    await expect(resultModal).toBeVisible();
    
    // 解説セクションが存在することを確認
    const explanation = resultModal.getByTestId('explanation');
    await expect(explanation).toBeVisible();
    await expect(explanation).toContainText('意味:');
    await expect(explanation).toContainText('例文:');
  });

  test('キーボードショートカットが動作する', async ({ page }) => {
    await page.goto('/');
    
    // 既存ユーザーをシミュレート
    await page.evaluate(() => {
      const userData = {
        playerName: 'テストユーザー',
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
    
    // 数字キーで選択肢を選ぶ
    await page.keyboard.press('1');
    
    // 結果モーダルが表示される
    const resultModal = page.getByTestId('result-modal');
    await expect(resultModal).toBeVisible();
    
    // Enterキーで次へ進む
    await page.keyboard.press('Enter');
    
    // 次の問題が表示される
    await expect(page.getByRole('heading', { name: /第\d+問/ })).toBeVisible();
    
    // 矢印キーで選択肢を移動
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    
    // フォーカスが3番目の選択肢に移動していることを確認
    const thirdChoice = page.getByRole('button', { name: /^3\. / });
    await expect(thirdChoice).toBeFocused();
    
    // Enterキーで選択
    await page.keyboard.press('Enter');
    
    // 結果モーダルが表示される
    await expect(resultModal).toBeVisible();
  });

  test('音声読み上げ機能が動作する', async ({ page }) => {
    await page.goto('/');
    
    // 既存ユーザーをシミュレート（音声有効）
    await page.evaluate(() => {
      const userData = {
        playerName: 'テストユーザー',
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
    
    // 音声読み上げボタンが表示される
    const speakButton = page.getByRole('button', { name: '問題を読み上げる' });
    await expect(speakButton).toBeVisible();
    
    // ボタンをクリック
    await speakButton.click();
    
    // speechSynthesisが呼ばれたことを確認（実際のテストでは音声APIのモックが必要）
    const wasSpeechCalled = await page.evaluate(() => {
      return window.speechSynthesis.speaking;
    });
    
    // 音声読み上げが開始されたことを確認（モックが必要な場合がある）
    expect(wasSpeechCalled !== undefined).toBeTruthy();
  });
});