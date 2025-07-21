import React from 'react';

interface ChartAccessibilityProps {
  chartType: 'pie' | 'bar' | 'line' | 'area';
  data: any[];
  description: string;
  title: string;
}

/**
 * チャート用のアクセシビリティコンポーネント
 * スクリーンリーダー向けにチャートデータの代替テキストを提供
 */
export const ChartAccessibility: React.FC<ChartAccessibilityProps> = ({
  chartType,
  data,
  description,
  title,
}) => {
  const formatChartData = () => {
    switch (chartType) {
      case 'pie':
        return data.map(item => 
          `${item.name}: ${item.value}件 (${item.accuracy}%正答率)`
        ).join(', ');
      
      case 'bar':
        return data.map(item => 
          `${item.type || item.name}: ${item.accuracy}%正答率`
        ).join(', ');
      
      case 'line':
      case 'area':
        return data.map(item => 
          `${item.date || item.month}: ${item.questions}問, ${item.correct}問正解, ${item.accuracy}%正答率`
        ).join(', ');
      
      default:
        return description;
    }
  };

  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true">
      <h3>{title}</h3>
      <p>{description}</p>
      <p>データ: {formatChartData()}</p>
    </div>
  );
};

/**
 * テーブル用のキャプション
 */
export const TableCaption: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <caption className="sr-only">
      {children}
    </caption>
  );
};