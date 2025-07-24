#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 検証結果を格納
const validationResults = {
  proverbs: { total: 0, errors: [], warnings: [] },
  idioms: { total: 0, errors: [], warnings: [] },
  four_character_idioms: { total: 0, errors: [], warnings: [] }
};

// 必須フィールド
const requiredFields = ['id', 'text', 'reading', 'meaning', 'difficulty', 'example_sentence'];

// 有効な難易度
const validDifficulties = ['小学生', '中学生', '高校生'];

// 有効なコンテンツタイプ
const validTypes = {
  proverbs: 'proverb',
  idioms: 'idiom',
  four_character_idioms: 'four_character_idiom'
};

// 日本語の表記ゆれパターン
const commonTypos = [
  { pattern: /ゐ|ゑ/, message: '旧仮名遣いが含まれています' },
  { pattern: /　/, message: '全角スペースが含まれています' },
  { pattern: /[０-９]/, message: '全角数字が含まれています' },
  { pattern: /[Ａ-Ｚａ-ｚ]/, message: '全角英字が含まれています' },
  { pattern: /^[　\s]+|[　\s]+$/, message: '先頭または末尾に空白があります' }
];

// ひらがな・カタカナのチェック
function validateReading(text, reading) {
  if (!/^[ぁ-んァ-ヶー・]+$/.test(reading)) {
    return '読みがなにひらがな・カタカナ以外の文字が含まれています';
  }
  // 実際に「・」が含まれているかチェック
  if (reading.includes('・')) {
    return '読みがなに「・」が含まれています';
  }
  return null;
}

// 難易度の妥当性チェック
function validateDifficulty(item, expectedType) {
  if (!validDifficulties.includes(item.difficulty)) {
    return `無効な難易度: ${item.difficulty}`;
  }
  
  // 四字熟語は一般的に難しいので、小学生レベルは警告
  if (expectedType === 'four_character_idiom' && item.difficulty === '小学生') {
    return '四字熟語で小学生レベルは珍しいです（警告）';
  }
  
  return null;
}

// 個別のアイテムを検証
function validateItem(item, index, expectedType, fileName) {
  const errors = [];
  const warnings = [];
  
  // 必須フィールドチェック
  for (const field of requiredFields) {
    if (!item[field]) {
      errors.push(`[ID:${item.id || index}] 必須フィールド '${field}' が欠落しています`);
    }
  }
  
  // タイプの一致チェック（typeフィールドがある場合のみ）
  if (item.type && item.type !== expectedType) {
    errors.push(`[ID:${item.id}] タイプが一致しません。期待値: ${expectedType}, 実際: ${item.type}`);
  }
  
  // 読みがなチェック
  if (item.reading) {
    const readingError = validateReading(item.text, item.reading);
    if (readingError) {
      errors.push(`[ID:${item.id}] ${readingError}`);
    }
  }
  
  // 難易度チェック
  if (item.difficulty) {
    const difficultyIssue = validateDifficulty(item, expectedType);
    if (difficultyIssue) {
      if (difficultyIssue.includes('警告')) {
        warnings.push(`[ID:${item.id}] ${difficultyIssue}`);
      } else {
        errors.push(`[ID:${item.id}] ${difficultyIssue}`);
      }
    }
  }
  
  // 表記ゆれチェック
  const fieldsToCheck = ['text', 'meaning', 'example_sentence'];
  for (const field of fieldsToCheck) {
    if (item[field]) {
      for (const typo of commonTypos) {
        if (typo.pattern.test(item[field])) {
          warnings.push(`[ID:${item.id}] ${field}に${typo.message}`);
        }
      }
    }
  }
  
  // 文字数チェック
  if (item.meaning && item.meaning.length < 10) {
    warnings.push(`[ID:${item.id}] 意味の説明が短すぎる可能性があります（${item.meaning.length}文字）`);
  }
  
  if (item.example_sentence && item.example_sentence.length < 15) {
    warnings.push(`[ID:${item.id}] 例文が短すぎる可能性があります（${item.example_sentence.length}文字）`);
  }
  
  // 重複IDチェックは後で一括で行う
  
  return { errors, warnings };
}

// JSONファイルを検証
async function validateJsonFile(fileName, expectedType) {
  const filePath = path.join(__dirname, '..', 'public', 'data', `${fileName}.json`);
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    // JSONファイルが直接配列の場合と、オブジェクトの場合の両方に対応
    let items;
    if (Array.isArray(data)) {
      items = data;
    } else if (data[fileName] && Array.isArray(data[fileName])) {
      items = data[fileName];
    } else {
      validationResults[fileName].errors.push(`有効なデータ構造ではありません`);
      return;
    }
    validationResults[fileName].total = items.length;
    
    // IDの重複チェック
    const idMap = new Map();
    for (const item of items) {
      if (item.id) {
        if (idMap.has(item.id)) {
          validationResults[fileName].errors.push(`重複ID: ${item.id}`);
        } else {
          idMap.set(item.id, true);
        }
      }
    }
    
    // 各アイテムの検証
    items.forEach((item, index) => {
      const { errors, warnings } = validateItem(item, index, expectedType, fileName);
      validationResults[fileName].errors.push(...errors);
      validationResults[fileName].warnings.push(...warnings);
    });
    
  } catch (error) {
    validationResults[fileName].errors.push(`ファイル読み込みエラー: ${error.message}`);
  }
}

// 統計情報を生成
function generateStatistics() {
  const stats = {
    総アイテム数: 0,
    難易度分布: {
      小学生: 0,
      中学生: 0,
      高校生: 0
    },
    タイプ別: {
      proverb: 0,
      idiom: 0,
      four_character_idiom: 0
    }
  };
  
  // 各ファイルの統計を集計
  for (const [fileName, result] of Object.entries(validationResults)) {
    stats.総アイテム数 += result.total;
  }
  
  return stats;
}

// レポートを生成
function generateReport() {
  console.log('=' .repeat(80));
  console.log('📊 コンテンツ検証レポート');
  console.log('=' .repeat(80));
  console.log(`実行日時: ${new Date().toLocaleString('ja-JP')}\n`);
  
  let totalErrors = 0;
  let totalWarnings = 0;
  
  for (const [fileName, result] of Object.entries(validationResults)) {
    console.log(`\n📁 ${fileName}.json`);
    console.log('-'.repeat(40));
    console.log(`総アイテム数: ${result.total}`);
    console.log(`エラー数: ${result.errors.length}`);
    console.log(`警告数: ${result.warnings.length}`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ エラー:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (result.warnings.length > 0) {
      console.log('\n⚠️  警告:');
      result.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📈 総合結果');
  console.log('-'.repeat(40));
  console.log(`総エラー数: ${totalErrors}`);
  console.log(`総警告数: ${totalWarnings}`);
  
  if (totalErrors === 0) {
    console.log('\n✅ すべてのコンテンツが検証を通過しました！');
  } else {
    console.log('\n❌ エラーが見つかりました。修正が必要です。');
  }
  
  console.log('\n' + '='.repeat(80));
}

// メイン処理
async function main() {
  console.log('コンテンツ検証を開始します...\n');
  
  // 各JSONファイルを検証
  await validateJsonFile('proverbs', validTypes.proverbs);
  await validateJsonFile('idioms', validTypes.idioms);
  await validateJsonFile('four_character_idioms', validTypes.four_character_idioms);
  
  // レポート生成
  generateReport();
  
  // エラーがある場合は終了コード1で終了
  const hasErrors = Object.values(validationResults).some(r => r.errors.length > 0);
  process.exit(hasErrors ? 1 : 0);
}

// 実行
main().catch(console.error);