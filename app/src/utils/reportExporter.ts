import type { LearningAnalytics, ReportConfig } from '@/types/analytics';

export async function exportAnalyticsReport(
  analytics: LearningAnalytics,
  config: ReportConfig
): Promise<void> {
  switch (config.format) {
    case 'csv':
      await exportAsCSV(analytics, config);
      break;
    case 'pdf':
      await exportAsPDF(analytics, config);
      break;
    case 'json':
      await exportAsJSON(analytics, config);
      break;
    default:
      throw new Error(`Unsupported format: ${config.format}`);
  }
}

async function exportAsCSV(analytics: LearningAnalytics, config: ReportConfig): Promise<void> {
  const lines: string[] = [];
  
  // ヘッダー
  lines.push('ことだまモンスター 学習レポート');
  lines.push(`生成日: ${new Date().toLocaleDateString('ja-JP')}`);
  lines.push(`期間: ${config.period === 'week' ? '週間' : config.period === 'month' ? '月間' : '全期間'}`);
  lines.push('');
  
  // 概要
  lines.push('概要');
  lines.push(`総学習日数,${analytics.overview.totalDays}`);
  lines.push(`総問題数,${analytics.overview.totalQuestions}`);
  lines.push(`総正解数,${analytics.overview.totalCorrect}`);
  lines.push(`全体正解率,${analytics.overview.overallAccuracy.toFixed(1)}%`);
  lines.push(`総学習時間,${Math.floor(analytics.overview.totalStudyTime / 60)}時間${analytics.overview.totalStudyTime % 60}分`);
  lines.push(`現在の連続記録,${analytics.overview.currentStreak}日`);
  lines.push(`最長連続記録,${analytics.overview.longestStreak}日`);
  lines.push('');
  
  // 日次統計
  lines.push('日次統計');
  lines.push('日付,問題数,正解数,正解率,学習時間(分),コンテンツタイプ');
  analytics.dailyStats.forEach(stat => {
    lines.push(
      `${stat.date},${stat.questionsAnswered},${stat.correctAnswers},` +
      `${stat.accuracy.toFixed(1)}%,${stat.studyTime},` +
      `"${stat.contentTypes.join(', ')}"`
    );
  });
  lines.push('');
  
  // カテゴリー別パフォーマンス
  lines.push('カテゴリー別パフォーマンス');
  lines.push('タイプ,出題数,正解数,正解率');
  analytics.categoryPerformance.forEach(perf => {
    lines.push(
      `${getContentTypeName(perf.contentType)},${perf.totalAttempts},` +
      `${perf.correctAnswers},${perf.accuracy.toFixed(1)}%`
    );
  });
  
  // CSVファイルとしてダウンロード
  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, `learning_report_${getDateString()}.csv`);
}

async function exportAsPDF(analytics: LearningAnalytics, config: ReportConfig): Promise<void> {
  // PDF生成は複雑なため、簡易的なHTMLを生成してブラウザの印刷機能を使用
  const html = generateHTMLReport(analytics, config);
  
  // 新しいウィンドウで開く
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('PDFの生成に失敗しました。ポップアップブロッカーを無効にしてください。');
    return;
  }
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  // 印刷ダイアログを開く
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

async function exportAsJSON(analytics: LearningAnalytics, config: ReportConfig): Promise<void> {
  const data = {
    reportInfo: {
      generatedAt: new Date().toISOString(),
      period: config.period,
    },
    analytics,
  };
  
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadFile(blob, `learning_report_${getDateString()}.json`);
}

function generateHTMLReport(analytics: LearningAnalytics, config: ReportConfig): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ことだまモンスター 学習レポート</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 40px;
      color: #333;
      line-height: 1.6;
    }
    h1, h2, h3 {
      color: #2563eb;
      margin-bottom: 16px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }
    .section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      padding: 20px;
      background: #f3f4f6;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 2em;
      font-weight: bold;
      color: #2563eb;
      margin: 10px 0;
    }
    .stat-label {
      color: #6b7280;
      font-size: 0.9em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #f3f4f6;
      font-weight: 600;
      color: #374151;
    }
    .insight {
      padding: 16px;
      margin: 10px 0;
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 4px;
    }
    @media print {
      body { margin: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🐾 ことだまモンスター 学習レポート</h1>
    <p>生成日: ${new Date().toLocaleDateString('ja-JP')}</p>
    <p>期間: ${config.period === 'week' ? '週間' : config.period === 'month' ? '月間' : '全期間'}</p>
  </div>

  <div class="section">
    <h2>📊 学習概要</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">総学習日数</div>
        <div class="stat-value">${analytics.overview.totalDays}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">総問題数</div>
        <div class="stat-value">${analytics.overview.totalQuestions}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">正解率</div>
        <div class="stat-value">${analytics.overview.overallAccuracy.toFixed(1)}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">現在の連続記録</div>
        <div class="stat-value">${analytics.overview.currentStreak}日</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>📈 カテゴリー別成績</h2>
    <table>
      <thead>
        <tr>
          <th>カテゴリー</th>
          <th>出題数</th>
          <th>正解数</th>
          <th>正解率</th>
        </tr>
      </thead>
      <tbody>
        ${analytics.categoryPerformance.map(perf => `
          <tr>
            <td>${getContentTypeName(perf.contentType)}</td>
            <td>${perf.totalAttempts}</td>
            <td>${perf.correctAnswers}</td>
            <td>${perf.accuracy.toFixed(1)}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  ${config.includeInsights && analytics.insights.length > 0 ? `
    <div class="section">
      <h2>💡 学習インサイト</h2>
      ${analytics.insights.map(insight => `
        <div class="insight">
          <h3>${insight.icon} ${insight.title}</h3>
          <p>${insight.description}</p>
        </div>
      `).join('')}
    </div>
  ` : ''}

  <div class="section">
    <h2>🎯 学習パターン</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">最も生産的な時間</div>
        <div class="stat-value">${analytics.learningPatterns.mostProductiveHour}時</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">平均学習時間</div>
        <div class="stat-value">${analytics.learningPatterns.averageSessionDuration}分</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">継続スコア</div>
        <div class="stat-value">${analytics.learningPatterns.consistencyScore}%</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
}

function getContentTypeName(type: string): string {
  const names: Record<string, string> = {
    proverb: 'ことわざ',
    idiom: '慣用句',
    four_character_idiom: '四字熟語',
  };
  return names[type] || type;
}