import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserShield, FaPlus, FaList, FaFileImport, FaSignOutAlt, FaTimes, FaEye, FaEdit } from 'react-icons/fa';
import { useAdmin } from '../../contexts/AdminContext';
import { useGame } from '../../contexts/GameContext';
import { ContentItem } from '../../types';
import { ContentFormData } from '../../types/admin';
import { AdminLogin } from './AdminLogin';
import { ContentForm } from './ContentForm';
import { ContentList } from './ContentList';
import { ImportExport } from './ImportExport';
import { ContentPreview } from './ContentPreview';
import { BulkEditModal } from './BulkEditModal';

type AdminTab = 'list' | 'add' | 'import';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const { isAdmin, logout, adminManager } = useAdmin();
  const { contentManager } = useGame();
  const [showLogin, setShowLogin] = useState(!isAdmin);
  const [activeTab, setActiveTab] = useState<AdminTab>('list');
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const [formErrors, setFormErrors] = useState<any[]>([]);
  const [allContents, setAllContents] = useState<ContentItem[]>([]);
  const [customContentIds, setCustomContentIds] = useState<Set<string>>(new Set());

  // コンテンツを読み込む
  useEffect(() => {
    loadContents();
  }, []);

  const loadContents = async () => {
    // オリジナルコンテンツを読み込む
    await contentManager.loadAllContent();
    const originalContents = [
      ...contentManager.getAllContent('proverb'),
      ...contentManager.getAllContent('four_character_idiom'),
      ...contentManager.getAllContent('idiom')
    ];

    // カスタムコンテンツを読み込む
    const customContents = adminManager.getAllCustomContent();
    const customIds = new Set(customContents.map(c => `${c.type}-${c.id}`));
    
    // 結合（カスタムコンテンツを優先）
    const allContentMap = new Map<string, ContentItem>();
    
    originalContents.forEach(content => {
      const key = `${content.type}-${content.id}`;
      allContentMap.set(key, content);
    });
    
    customContents.forEach(content => {
      const key = `${content.type}-${content.id}`;
      allContentMap.set(key, content);
    });

    setAllContents(Array.from(allContentMap.values()));
    setCustomContentIds(customIds);
  };

  const handleLoginSuccess = () => {
    setShowLogin(false);
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleAddContent = (data: ContentFormData) => {
    const result = adminManager.addContent(data);
    if (result.success) {
      setActiveTab('list');
      setFormErrors([]);
      loadContents();
    } else {
      setFormErrors(result.errors || []);
    }
  };

  const handleUpdateContent = (data: ContentFormData) => {
    const result = adminManager.updateContent(data);
    if (result.success) {
      setEditingContent(null);
      setActiveTab('list');
      setFormErrors([]);
      loadContents();
    } else {
      setFormErrors(result.errors || []);
    }
  };

  const handleDeleteContent = (content: ContentItem) => {
    const success = adminManager.deleteContent(content.id, content.type);
    if (success) {
      loadContents();
    }
  };

  const handleEdit = (content: ContentItem) => {
    setEditingContent(content);
    setActiveTab('add');
  };

  const handleImport = (csvData: string, type: any) => {
    const result = adminManager.importCSV(csvData, type);
    if (result.success > 0) {
      loadContents();
    }
    return result;
  };

  const handleExport = (type?: any) => {
    return adminManager.exportCustomContent(type);
  };

  const isCustomContent = (content: ContentItem): boolean => {
    return customContentIds.has(`${content.type}-${content.id}`);
  };

  if (showLogin) {
    return <AdminLogin onSuccess={handleLoginSuccess} onCancel={onClose} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* ヘッダー */}
        <div className="bg-purple-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FaUserShield className="text-2xl" />
            <h2 className="text-xl font-bold">管理者パネル</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-purple-700 rounded hover:bg-purple-800 transition-colors flex items-center space-x-1"
            >
              <FaSignOutAlt />
              <span>ログアウト</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-purple-700 rounded transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        {/* タブ */}
        <div className="bg-gray-100 px-4 py-2 flex space-x-2">
          <button
            onClick={() => {
              setActiveTab('list');
              setEditingContent(null);
            }}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              activeTab === 'list' 
                ? 'bg-white text-purple-600 shadow-sm' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FaList />
            <span>コンテンツ一覧</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('add');
              setEditingContent(null);
            }}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              activeTab === 'add' 
                ? 'bg-white text-purple-600 shadow-sm' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FaPlus />
            <span>{editingContent ? '編集' : '新規追加'}</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              activeTab === 'import' 
                ? 'bg-white text-purple-600 shadow-sm' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FaFileImport />
            <span>インポート/エクスポート</span>
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            {activeTab === 'list' && (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <ContentList
                  contents={allContents}
                  onEdit={handleEdit}
                  onDelete={handleDeleteContent}
                  isCustomContent={isCustomContent}
                />
              </motion.div>
            )}

            {activeTab === 'add' && (
              <motion.div
                key="add"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="max-w-2xl mx-auto">
                  <h3 className="text-lg font-bold mb-4">
                    {editingContent ? 'コンテンツ編集' : '新規コンテンツ追加'}
                  </h3>
                  <ContentForm
                    initialData={editingContent || undefined}
                    onSubmit={editingContent ? handleUpdateContent : handleAddContent}
                    onCancel={() => {
                      setActiveTab('list');
                      setEditingContent(null);
                      setFormErrors([]);
                    }}
                    errors={formErrors}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'import' && (
              <motion.div
                key="import"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="max-w-2xl mx-auto">
                  <h3 className="text-lg font-bold mb-4">
                    インポート/エクスポート
                  </h3>
                  <ImportExport
                    onImport={handleImport}
                    onExport={handleExport}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};