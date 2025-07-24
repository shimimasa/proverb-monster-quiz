#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixReadings() {
  const files = ['proverbs.json', 'idioms.json', 'four_character_idioms.json'];
  let totalFixed = 0;
  
  console.log('読みがなの修正を開始します...\n');
  
  for (const file of files) {
    const filePath = path.join(__dirname, '..', 'public', 'data', file);
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      let fixedCount = 0;
      
      // 読みがなの「・」を削除
      const fixed = data.map(item => {
        if (item.reading && item.reading.includes('・')) {
          fixedCount++;
          return {
            ...item,
            reading: item.reading.replace(/・/g, '')
          };
        }
        return item;
      });
      
      // ファイルに書き戻し
      await fs.writeFile(filePath, JSON.stringify(fixed, null, 2), 'utf-8');
      
      console.log(`✅ ${file}: ${fixedCount}件の読みがなを修正しました`);
      totalFixed += fixedCount;
      
    } catch (error) {
      console.error(`❌ ${file}: エラーが発生しました - ${error.message}`);
    }
  }
  
  console.log(`\n合計 ${totalFixed} 件の読みがなを修正しました。`);
}

// 実行
fixReadings().catch(console.error);