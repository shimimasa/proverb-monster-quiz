import React from 'react';
import type { CategoryPerformance } from '@/types/analytics';

interface Props {
  performance: CategoryPerformance[];
}

export const CategoryRadarChart: React.FC<Props> = ({ performance }) => {
  // レーダーチャートの設定
  const categories = [
    { type: 'proverb', label: 'ことわざ', color: 'blue' },
    { type: 'idiom', label: '慣用句', color: 'green' },
    { type: 'four_character_idiom', label: '四字熟語', color: 'purple' },
  ];

  // SVGのサイズと中心点
  const size = 240;
  const center = size / 2;
  const radius = 80;
  const angleStep = (Math.PI * 2) / categories.length;

  // ポイントの計算
  const getPoint = (value: number, index: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // ポリゴンのパスを生成
  const points = categories.map((cat, index) => {
    const perf = performance.find(p => p.contentType === cat.type);
    const accuracy = perf?.accuracy || 0;
    return getPoint(accuracy, index);
  });

  const polygonPath = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* 背景のグリッド */}
        <g opacity="0.2">
          {[20, 40, 60, 80, 100].map(level => (
            <polygon
              key={level}
              points={categories
                .map((_, index) => {
                  const point = getPoint(level, index);
                  return `${point.x},${point.y}`;
                })
                .join(' ')}
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-gray-400"
            />
          ))}
        </g>

        {/* 軸線 */}
        {categories.map((_, index) => {
          const endPoint = getPoint(100, index);
          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={endPoint.x}
              y2={endPoint.y}
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.2"
              className="text-gray-400"
            />
          );
        })}

        {/* データポリゴン */}
        <polygon
          points={polygonPath}
          fill="url(#gradient)"
          fillOpacity="0.3"
          stroke="url(#gradient)"
          strokeWidth="2"
        />

        {/* グラデーション定義 */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>

        {/* データポイント */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="white"
            stroke="url(#gradient)"
            strokeWidth="2"
          />
        ))}

        {/* ラベル */}
        {categories.map((cat, index) => {
          const labelPoint = getPoint(120, index);
          const perf = performance.find(p => p.contentType === cat.type);
          
          return (
            <g key={cat.type}>
              <text
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-sm font-medium fill-current text-gray-700 dark:text-gray-300"
              >
                {cat.label}
              </text>
              <text
                x={labelPoint.x}
                y={labelPoint.y + 15}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs fill-current text-gray-500 dark:text-gray-400"
              >
                {perf ? `${perf.accuracy.toFixed(1)}%` : '0%'}
              </text>
            </g>
          );
        })}
      </svg>

      {/* 統計サマリ */}
      <div className="mt-4 w-full space-y-2">
        {categories.map(cat => {
          const perf = performance.find(p => p.contentType === cat.type);
          if (!perf || perf.totalAttempts === 0) return null;
          
          return (
            <div key={cat.type} className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{cat.label}</span>
              <div className="flex gap-4">
                <span>出題: {perf.totalAttempts}</span>
                <span>正解: {perf.correctAnswers}</span>
                <span className="font-medium">{perf.accuracy.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};