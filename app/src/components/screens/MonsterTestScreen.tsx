import React, { useState } from 'react';
import { MonsterCardV2, MonsterDetailModal } from '@/components/monster/MonsterCardV2';
import type { Monster, ContentItem } from '@/types';

// テスト用のコンテンツアイテム
const testContentItems: ContentItem[] = [
  {
    id: 1,
    text: "猿も木から落ちる",
    reading: "さるもきからおちる",
    meaning: "どんなに得意なことでも失敗することがある",
    difficulty: "小学生",
    example_sentence: "プロでも失敗することがある。猿も木から落ちるというものだ。",
    type: "proverb"
  },
  {
    id: 2,
    text: "頭隠して尻隠さず",
    reading: "あたまかくしてしりかくさず",
    meaning: "一部だけ隠して、全体を隠したつもりになること",
    difficulty: "小学生",
    example_sentence: "彼の言い訳は頭隠して尻隠さずだった。",
    type: "idiom"
  },
  {
    id: 3,
    text: "一期一会",
    reading: "いちごいちえ",
    meaning: "一生に一度だけの機会",
    difficulty: "中学生",
    example_sentence: "この出会いを一期一会と思って大切にしよう。",
    type: "four_character_idiom"
  },
  {
    id: 4,
    text: "七転八起",
    reading: "しちてんはっき",
    meaning: "何度失敗しても立ち上がること",
    difficulty: "高校生",
    example_sentence: "七転八起の精神で挑戦を続けた。",
    type: "four_character_idiom"
  }
];

// テスト用のモンスター生成
function generateTestMonsters(): Monster[] {
  const rarities: Array<'common' | 'rare' | 'epic' | 'legendary'> = ['common', 'rare', 'epic', 'legendary'];
  
  return testContentItems.map((content, index) => ({
    id: `monster-${content.id}`,
    name: `${content.text}モンスター`,
    image: '', // V2では使用しない
    rarity: rarities[index % rarities.length],
    sourceContent: content,
    unlocked: true,
    dateObtained: new Date().toISOString()
  }));
}

export function MonsterTestScreen() {
  const [monsters] = useState<Monster[]>(generateTestMonsters());
  const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null);
  const [cardSize, setCardSize] = useState<'small' | 'medium' | 'large'>('medium');
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          モンスター生成システムV2 テスト画面
        </h1>
        
        {/* コントロール */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-8 shadow">
          <h2 className="text-lg font-semibold mb-4">表示設定</h2>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <span>サイズ:</span>
              <select 
                value={cardSize} 
                onChange={(e) => setCardSize(e.target.value as any)}
                className="border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="small">小</option>
                <option value="medium">中</option>
                <option value="large">大</option>
              </select>
            </label>
          </div>
        </div>
        
        {/* レアリティ別セクション */}
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              コモン (Common)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {monsters.filter(m => m.rarity === 'common').map(monster => (
                <MonsterCardV2
                  key={monster.id}
                  monster={monster}
                  size={cardSize}
                  onClick={() => setSelectedMonster(monster)}
                />
              ))}
            </div>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              レア (Rare)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {monsters.filter(m => m.rarity === 'rare').map(monster => (
                <MonsterCardV2
                  key={monster.id}
                  monster={monster}
                  size={cardSize}
                  onClick={() => setSelectedMonster(monster)}
                />
              ))}
            </div>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              エピック (Epic)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {monsters.filter(m => m.rarity === 'epic').map(monster => (
                <MonsterCardV2
                  key={monster.id}
                  monster={monster}
                  size={cardSize}
                  onClick={() => setSelectedMonster(monster)}
                />
              ))}
            </div>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              レジェンダリー (Legendary)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {monsters.filter(m => m.rarity === 'legendary').map(monster => (
                <MonsterCardV2
                  key={monster.id}
                  monster={monster}
                  size={cardSize}
                  onClick={() => setSelectedMonster(monster)}
                />
              ))}
            </div>
          </section>
        </div>
        
        {/* バリエーションテスト */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            同じコンテンツの異なるモンスター（シード値テスト）
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => {
              const testMonster: Monster = {
                id: `test-${i}`,
                name: `テストモンスター${i}`,
                image: '',
                rarity: 'epic',
                sourceContent: {
                  ...testContentItems[0],
                  id: 100 + i // 異なるIDで異なるモンスターを生成
                },
                unlocked: true,
                dateObtained: new Date().toISOString()
              };
              
              return (
                <MonsterCardV2
                  key={testMonster.id}
                  monster={testMonster}
                  size={cardSize}
                  onClick={() => setSelectedMonster(testMonster)}
                />
              );
            })}
          </div>
        </section>
      </div>
      
      {/* モンスター詳細モーダル */}
      {selectedMonster && (
        <MonsterDetailModal
          monster={selectedMonster}
          onClose={() => setSelectedMonster(null)}
        />
      )}
    </div>
  );
}