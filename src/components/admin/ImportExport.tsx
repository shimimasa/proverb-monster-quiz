import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaUpload, FaDownload, FaFileImport, FaFileExport } from 'react-icons/fa';
import { ContentType } from '../../types';
import { ImportResult } from '../../types/admin';

interface ImportExportProps {
  onImport: (csvData: string, type: ContentType) => ImportResult;
  onExport: (type?: ContentType) => string;
}

export const ImportExport: React.FC<ImportExportProps> = ({ onImport, onExport }) => {
  const [selectedType, setSelectedType] = useState<ContentType>('proverb');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const result = onImport(text, selectedType);
      setImportResult(result);
    } catch (error) {
      setImportResult({
        success: 0,
        failed: 1,
        errors: [{ row: 0, field: 'file', message: 'ファイルの読み込みに失敗しました' }]
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExportAll = () => {
    const data = onExport();
    downloadFile(data, 'all_contents.json', 'application/json');
  };

  const handleExportByType = () => {
    const data = onExport(selectedType);
    const filename = `${selectedType}_contents.json`;
    downloadFile(data, filename, 'application/json');
  };

  const handleDownloadTemplate = () => {
    const template = 'テキスト,読み方,意味,難易度,例文\n' +
      '猿も木から落ちる,さるもきからおちる,どんなに得意なことでも時には失敗することがある,小学生,プロの料理人でも失敗することがある。猿も木から落ちるというものだ。\n' +
      '石の上にも三年,いしのうえにもさんねん,辛抱強く続ければ必ず成果が出る,小学生,最初は難しかったけど、石の上にも三年で上達した。';
    
    downloadFile(template, 'import_template.csv', 'text/csv');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getTypeLabel = (type: ContentType): string => {
    const labels: Record<ContentType, string> = {
      proverb: 'ことわざ',
      four_character_idiom: '四字熟語',
      idiom: '慣用句'
    };
    return labels[type];
  };

  return (
    <div className="space-y-6">
      {/* タイプ選択 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          コンテンツタイプ
        </label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as ContentType)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          <option value="proverb">ことわざ</option>
          <option value="four_character_idiom">四字熟語</option>
          <option value="idiom">慣用句</option>
        </select>
      </div>

      {/* インポート */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-bold mb-3 flex items-center">
          <FaFileImport className="mr-2" />
          CSVインポート
        </h3>
        
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            CSVファイルから{getTypeLabel(selectedType)}データを一括インポートできます。
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <FaDownload />
              <span>テンプレートをダウンロード</span>
            </button>
            
            <label className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
              <FaUpload />
              <span>CSVファイルを選択</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isImporting}
              />
            </label>
          </div>
        </div>

        {/* インポート結果 */}
        {importResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-3 rounded-lg ${
              importResult.failed === 0 ? 'bg-green-100' : 'bg-yellow-100'
            }`}
          >
            <p className="font-medium">
              インポート完了: 成功 {importResult.success}件 / 失敗 {importResult.failed}件
            </p>
            
            {importResult.errors.length > 0 && (
              <div className="mt-2 text-sm">
                <p className="font-medium text-red-700">エラー詳細:</p>
                <ul className="mt-1 space-y-1">
                  {importResult.errors.slice(0, 5).map((error, index) => (
                    <li key={index} className="text-red-600">
                      行{error.row}: {error.field} - {error.message}
                    </li>
                  ))}
                  {importResult.errors.length > 5 && (
                    <li className="text-gray-600">
                      他{importResult.errors.length - 5}件のエラー
                    </li>
                  )}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* エクスポート */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="text-lg font-bold mb-3 flex items-center">
          <FaFileExport className="mr-2" />
          JSONエクスポート
        </h3>
        
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            カスタムコンテンツをJSON形式でエクスポートできます。
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={handleExportByType}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaDownload />
              <span>{getTypeLabel(selectedType)}をエクスポート</span>
            </button>
            
            <button
              onClick={handleExportAll}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors"
            >
              <FaDownload />
              <span>すべてエクスポート</span>
            </button>
          </div>
        </div>
      </div>

      {/* 使用方法 */}
      <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
        <h4 className="font-bold mb-2">CSVフォーマットについて</h4>
        <ul className="space-y-1 list-disc list-inside">
          <li>1行目はヘッダー行として扱われます</li>
          <li>列の順序: テキスト, 読み方, 意味, 難易度, 例文（任意）</li>
          <li>難易度は「小学生」「中学生」「高校生」のいずれか</li>
          <li>カンマを含む場合は二重引用符で囲んでください</li>
          <li>文字コードはUTF-8を推奨します</li>
        </ul>
      </div>
    </div>
  );
};