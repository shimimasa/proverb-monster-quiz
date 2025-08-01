import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaDownload, 
  FaFileExport, 
  FaChartBar, 
  FaHistory, 
  FaDragon,
  FaTrophy,
  FaCalendarAlt,
  FaDatabase,
  FaCheck,
  FaSpinner
} from 'react-icons/fa';
import { useGame } from '@/contexts/GameContext';
import { DataExportManager } from '@/core/DataExportManager';

interface ExportOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  format: 'json' | 'csv';
  action: () => void;
}

export const ExportScreen: React.FC = () => {
  const { progressManager, monsterManager } = useGame();
  const [exportManager] = useState(() => new DataExportManager(progressManager, monsterManager));
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportedItems, setExportedItems] = useState<Set<string>>(new Set());

  const handleExport = async (option: ExportOption) => {
    setExporting(option.id);
    
    try {
      // ���������L
      await new Promise(resolve => setTimeout(resolve, 500)); // ���գ���ïn_�nE�
      option.action();
      
      // �����h:
      setExportedItems(prev => new Set([...prev, option.id]));
      
      // 3Ҍk������Y
      setTimeout(() => {
        setExportedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(option.id);
          return newSet;
        });
      }, 3000);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(null);
    }
  };

  const exportOptions: ExportOption[] = [
    {
      id: 'all-data',
      title: 'h���',
      description: 'Yyfn�������JSONbg������',
      icon: <FaDatabase className="text-2xl" />,
      format: 'json',
      action: () => {
        const data = exportManager.exportAllData();
        const filename = `kotodama-monster-all-data_${new Date().toISOString().split('T')[0]}.json`;
        exportManager.downloadFile(data, filename, 'application/json');
      }
    },
    {
      id: 'learning-history',
      title: 'f�et',
      description: '�÷��Thnf�2�CSVbg������',
      icon: <FaHistory className="text-2xl" />,
      format: 'csv',
      action: () => {
        const data = exportManager.exportLearningHistoryCSV();
        const filename = `learning-history_${new Date().toISOString().split('T')[0]}.csv`;
        exportManager.downloadFile(data, filename, 'text/csv');
      }
    },
    {
      id: 'monster-collection',
      title: '����쯷��',
      description: 'r�W_���n ��CSVbg������',
      icon: <FaDragon className="text-2xl" />,
      format: 'csv',
      action: () => {
        const data = exportManager.exportMonsterCollectionCSV();
        const filename = `monster-collection_${new Date().toISOString().split('T')[0]}.csv`;
        exportManager.downloadFile(data, filename, 'text/csv');
      }
    },
    {
      id: 'statistics',
      title: 'q�1',
      description: 'f�>nq����CSVbg������',
      icon: <FaChartBar className="text-2xl" />,
      format: 'csv',
      action: () => {
        const data = exportManager.exportStatisticsCSV();
        const filename = `statistics_${new Date().toISOString().split('T')[0]}.csv`;
        exportManager.downloadFile(data, filename, 'text/csv');
      }
    },
    {
      id: 'daily-activity',
      title: '�%;�2',
      description: '�Thnf�;ՒCSVbg������',
      icon: <FaCalendarAlt className="text-2xl" />,
      format: 'csv',
      action: () => {
        const data = exportManager.exportDailyActivityCSV();
        const filename = `daily-activity_${new Date().toISOString().split('T')[0]}.csv`;
        exportManager.downloadFile(data, filename, 'text/csv');
      }
    },
    {
      id: 'content-stats',
      title: '�����%q',
      description: 'Sh�V��W���c(�%n>�CSVbg������',
      icon: <FaTrophy className="text-2xl" />,
      format: 'csv',
      action: () => {
        const data = exportManager.exportContentTypeStatsCSV();
        const filename = `content-type-stats_${new Date().toISOString().split('T')[0]}.csv`;
        exportManager.downloadFile(data, filename, 'text/csv');
      }
    },
    {
      id: 'backup',
      title: '�ï������',
      description: '�������jbg�ï��ג\',
      icon: <FaFileExport className="text-2xl" />,
      format: 'json',
      action: () => {
        const data = exportManager.createBackup();
        const filename = `kotodama-monster-backup_${new Date().toISOString().split('T')[0]}.json`;
        exportManager.downloadFile(data, filename, 'application/json');
      }
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto p-4"
    >
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
          <FaFileExport className="mr-3 text-blue-600" />
          ���������
        </h1>
        <p className="text-gray-600 mb-6">
          f��������n2W�������Wf�g�W_��XW_�gM~Y
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {exportOptions.map((option) => (
            <motion.div
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative"
            >
              <button
                onClick={() => handleExport(option)}
                disabled={exporting !== null}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  exporting === option.id
                    ? 'border-blue-400 bg-blue-50'
                    : exportedItems.has(option.id)
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-md bg-white'
                } ${exporting !== null && exporting !== option.id ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${
                    exporting === option.id
                      ? 'bg-blue-200 text-blue-700'
                      : exportedItems.has(option.id)
                      ? 'bg-green-200 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {exporting === option.id ? (
                      <FaSpinner className="text-2xl animate-spin" />
                    ) : exportedItems.has(option.id) ? (
                      <FaCheck className="text-2xl" />
                    ) : (
                      option.icon
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-800">{option.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                    <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                      option.format === 'json'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {option.format.toUpperCase()}b
                    </span>
                  </div>
                </div>
              </button>
              
              {/* �������� */}
              <AnimatePresence>
                {exportedItems.has(option.id) && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-2"
                  >
                    <FaCheck />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* (
n� */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
            <FaDownload className="mr-2" />
            ���������kdDf
          </h3>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>CSVbnա��oExcel�Google����ɷ��g�OShLgM~Y</li>
            <li>JSONbnա��o�����gn���ï���kiWfD~Y</li>
            <li>������U�_���ko��1o+~�~[�</li>
            <li>�ï������oen�����_�g�C��gY</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
};