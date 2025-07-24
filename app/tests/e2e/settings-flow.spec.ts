import { test, expect } from '@playwright/test';

test.describe('設定画面フロー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 既存ユーザーデータを設定
    await page.evaluate(() => {
      const userData = {
        playerName: '設定テストユーザー',
        level: 3,
        experience: 750,
        totalCorrect: 25,
        totalQuestions: 40,
        currentStreak: 5,
        maxStreak: 10,
        unlockedMonsters: [
          { monsterId: 'mon_001', obtainedAt: '2025-01-20T10:00:00Z', count: 1 },
          { monsterId: 'mon_002', obtainedAt: '2025-01-20T11:00:00Z', count: 1 },
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
    await page.reload();
  });

  test('設定タブで各種設定を変更できる', async ({ page }) => {
    // 設定画面へ移動
    await page.getByRole('link', { name: '設定' }).click();
    
    // 設定タブがアクティブであることを確認
    const settingsTab = page.getByRole('tab', { name: '設定' });
    await expect(settingsTab).toHaveAttribute('aria-selected', 'true');
    
    // プレイヤー名を変更
    const nameInput = page.getByLabel('プレイヤー名');
    await expect(nameInput).toHaveValue('設定テストユーザー');
    await nameInput.clear();
    await nameInput.fill('新しい名前');
    
    // 難易度を変更
    const difficultySelect = page.getByLabel('難易度');
    await difficultySelect.selectOption('hard');
    
    // コンテンツタイプを追加
    const idiomCheckbox = page.getByLabel('四字熟語');
    await idiomCheckbox.check();
    await expect(idiomCheckbox).toBeChecked();
    
    // サウンド設定を変更
    const soundToggle = page.getByLabel('効果音');
    await soundToggle.click();
    await expect(soundToggle).not.toBeChecked();
    
    // 音量を調整
    const volumeSlider = page.getByLabel('音量');
    await volumeSlider.fill('0.8');
    
    // 設定を保存
    await page.getByRole('button', { name: '設定を保存' }).click();
    
    // 保存成功メッセージを確認
    await expect(page.getByText('設定を保存しました')).toBeVisible();
    
    // ページをリロードして設定が保持されていることを確認
    await page.reload();
    await page.getByRole('link', { name: '設定' }).click();
    
    await expect(nameInput).toHaveValue('新しい名前');
    await expect(difficultySelect).toHaveValue('hard');
    await expect(idiomCheckbox).toBeChecked();
    await expect(soundToggle).not.toBeChecked();
  });

  test('統計タブで進捗情報が表示される', async ({ page }) => {
    await page.getByRole('link', { name: '設定' }).click();
    
    // 統計タブをクリック
    const statsTab = page.getByRole('tab', { name: '統計' });
    await statsTab.click();
    
    // 統計情報が表示される
    const statsPanel = page.getByRole('tabpanel', { name: '統計' });
    await expect(statsPanel).toBeVisible();
    
    // 基本統計
    await expect(statsPanel.getByText('レベル 3')).toBeVisible();
    await expect(statsPanel.getByText('750 / 1000 XP')).toBeVisible();
    await expect(statsPanel.getByText('総プレイ数: 40問')).toBeVisible();
    await expect(statsPanel.getByText('正解数: 25問')).toBeVisible();
    await expect(statsPanel.getByText('正答率: 62.5%')).toBeVisible();
    
    // ストリーク情報
    await expect(statsPanel.getByText('現在の連続正解: 5')).toBeVisible();
    await expect(statsPanel.getByText('最高連続正解: 10')).toBeVisible();
    
    // モンスター統計
    await expect(statsPanel.getByText('獲得モンスター: 2')).toBeVisible();
  });

  test('実績タブで達成状況が表示される', async ({ page }) => {
    await page.getByRole('link', { name: '設定' }).click();
    
    // 実績タブをクリック
    const achievementsTab = page.getByRole('tab', { name: '実績' });
    await achievementsTab.click();
    
    // 実績一覧が表示される
    const achievementsPanel = page.getByRole('tabpanel', { name: '実績' });
    await expect(achievementsPanel).toBeVisible();
    
    // 実績アイテムが表示される
    const achievementItems = achievementsPanel.getByTestId('achievement-item');
    const count = await achievementItems.count();
    expect(count).toBeGreaterThan(0);
    
    // 実績の詳細情報
    const firstAchievement = achievementItems.first();
    await expect(firstAchievement).toBeVisible();
    
    // 進捗バーが表示される
    const progressBar = firstAchievement.getByRole('progressbar');
    await expect(progressBar).toBeVisible();
  });

  test('データのエクスポート・インポートが動作する', async ({ page }) => {
    await page.getByRole('link', { name: '設定' }).click();
    
    // エクスポートボタンをクリック
    const exportButton = page.getByRole('button', { name: 'データをエクスポート' });
    
    // ダウンロードイベントを待機
    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;
    
    // ダウンロードファイルの確認
    expect(download.suggestedFilename()).toContain('kotodama-monsters-');
    expect(download.suggestedFilename()).toContain('.json');
    
    // インポート機能のテスト
    const importInput = page.getByLabel('データをインポート');
    
    // テスト用のJSONデータを作成
    const testData = {
      playerName: 'インポートテストユーザー',
      level: 10,
      experience: 5000,
      totalCorrect: 100,
      totalQuestions: 120,
      currentStreak: 0,
      maxStreak: 25,
      unlockedMonsters: [],
      lastPlayedDate: new Date().toISOString(),
      settings: {
        soundEnabled: false,
        volume: 0.3,
        difficulty: 'easy' as const,
        contentTypes: ['idiom'] as const[],
      },
    };
    
    // ファイルをアップロード（実際のテストではファイル操作が必要）
    const dataStr = JSON.stringify(testData);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const fileName = 'test-import.json';
    
    // ファイル入力をシミュレート
    await importInput.setInputFiles({
      name: fileName,
      mimeType: 'application/json',
      buffer: Buffer.from(dataStr),
    });
    
    // インポート成功メッセージを確認
    await expect(page.getByText('データをインポートしました')).toBeVisible();
    
    // インポートされたデータが反映されていることを確認
    await page.reload();
    await page.getByRole('link', { name: '設定' }).click();
    
    const nameInput = page.getByLabel('プレイヤー名');
    await expect(nameInput).toHaveValue('インポートテストユーザー');
  });

  test('進捗リセットの確認ダイアログが動作する', async ({ page }) => {
    await page.getByRole('link', { name: '設定' }).click();
    
    // リセットボタンをクリック
    const resetButton = page.getByRole('button', { name: '進捗をリセット' });
    
    // 確認ダイアログのモック
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('すべての進捗データが削除されます');
      
      // キャンセルをクリック
      await dialog.dismiss();
    });
    
    await resetButton.click();
    
    // データが削除されていないことを確認
    const nameInput = page.getByLabel('プレイヤー名');
    await expect(nameInput).toHaveValue('設定テストユーザー');
    
    // 今度は確認する
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    
    await resetButton.click();
    
    // リセット成功メッセージ
    await expect(page.getByText('進捗をリセットしました')).toBeVisible();
    
    // 初期状態に戻ることを確認
    await page.reload();
    const heading = page.getByRole('heading', { name: '設定' });
    await expect(heading).toBeVisible();
  });

  test('コンテンツタイプの最低1つ選択制約が動作する', async ({ page }) => {
    await page.getByRole('link', { name: '設定' }).click();
    
    // すべてのコンテンツタイプを取得
    const proverbCheckbox = page.getByLabel('ことわざ');
    const idiomCheckbox = page.getByLabel('四字熟語');
    const phraseCheckbox = page.getByLabel('慣用句');
    
    // 現在ことわざのみ選択されている
    await expect(proverbCheckbox).toBeChecked();
    await expect(idiomCheckbox).not.toBeChecked();
    await expect(phraseCheckbox).not.toBeChecked();
    
    // 唯一選択されていることわざのチェックを外そうとする
    await proverbCheckbox.click();
    
    // エラーメッセージが表示される
    await expect(page.getByText('少なくとも1つのコンテンツタイプを選択してください')).toBeVisible();
    
    // チェックボックスは選択されたままになる
    await expect(proverbCheckbox).toBeChecked();
    
    // 他のコンテンツタイプを選択してから、ことわざを外す
    await idiomCheckbox.check();
    await proverbCheckbox.click();
    
    // 今度は成功する
    await expect(proverbCheckbox).not.toBeChecked();
    await expect(idiomCheckbox).toBeChecked();
  });
});