import React, { useState } from 'react';
import { useGame } from '@contexts/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCog, FaChartLine, FaTrophy, FaDownload, FaUpload, 
  FaTrash, FaVolumeUp, FaVolumeMute, FaGamepad,
  FaCalendar, FaClock, FaFire, FaStar, FaCheck, FaFileExport
} from 'react-icons/fa';
import type { Difficulty, ContentType } from '@types/index';

interface Props {
  onNavigate?: (page: string) => void;
}

export const SettingsScreen: React.FC<Props> = ({ onNavigate }) => {
  const { progressManager, monsterManager, localStorageManager } = useGame();
  const [activeTab, setActiveTab] = useState<'settings' | 'stats' | 'achievements'>('settings');
  const [playerName, setPlayerName] = useState(localStorage.getItem('playerName') || '');
  const settings = progressManager.getSettings();
  const stats = progressManager.getProgressStats();
  const achievements = progressManager.getProgress().achievements;

  const handleDifficultyChange = (difficulty: Difficulty) => {
    progressManager.updateSettings({ difficulty });
  };

  const handleContentTypeToggle = (type: ContentType) => {
    const currentTypes = settings.contentTypes;
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    
    // Ensure at least one content type is selected
    if (newTypes.length > 0) {
      progressManager.updateSettings({ contentTypes: newTypes });
    }
  };

  const handleSoundToggle = () => {
    progressManager.updateSettings({ soundEnabled: !settings.soundEnabled });
  };

  const handleVolumeChange = (volume: number) => {
    progressManager.updateSettings({ effectsVolume: volume });
  };

  const handleResetProgress = () => {
    if (window.confirm('本当に進捗をリセットしますか？この操作は取り消せません。')) {
      progressManager.resetProgress();
      monsterManager.resetCollection();
      window.location.reload();
    }
  };

  const handlePlayerNameChange = (name: string) => {
    setPlayerName(name);
    localStorage.setItem('playerName', name);
  };

  const handleExportData = async () => {
    try {
      const data = await localStorageManager.exportAllData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kotodama-monster-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('データのエクスポートに失敗しました。');
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await localStorageManager.importAllData(text);
      alert('データのインポートに成功しました。');
      window.location.reload();
    } catch (error) {
      alert('データのインポートに失敗しました。ファイルが正しいか確認してください。');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md p-2">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FaCog />
            <span>設定</span>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'stats'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FaChartLine />
            <span>統計</span>
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'achievements'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FaTrophy />
            <span>実績</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              <FaCog className="inline mr-2" />
              設定
            </h2>

        {/* Player Name Settings */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">プレイヤー名</h3>
          <input
            type="text"
            value={playerName}
            onChange={(e) => handlePlayerNameChange(e.target.value)}
            placeholder="名前を入力してください"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            ランキングに表示される名前です
          </p>
        </div>

        {/* Difficulty Settings */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">難易度</h3>
          <div className="space-y-2">
            {(['小学生', '中学生', '高校生'] as Difficulty[]).map(level => (
              <label key={level} className="flex items-center">
                <input
                  type="radio"
                  name="difficulty"
                  value={level}
                  checked={settings.difficulty === level}
                  onChange={() => handleDifficultyChange(level)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700">{level}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Content Type Settings */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">出題内容</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.contentTypes.includes('proverb')}
                onChange={() => handleContentTypeToggle('proverb')}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">ことわざ</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.contentTypes.includes('idiom')}
                onChange={() => handleContentTypeToggle('idiom')}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">慣用句</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.contentTypes.includes('four_character_idiom')}
                onChange={() => handleContentTypeToggle('four_character_idiom')}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">四字熟語</span>
            </label>
          </div>
        </div>

        {/* Sound Settings */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">サウンド</h3>
          <label className="flex items-center mb-4">
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={handleSoundToggle}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-gray-700">効果音を有効にする</span>
          </label>
          
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">音量:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.effectsVolume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              disabled={!settings.soundEnabled}
              className="flex-1"
            />
            <span className="text-gray-600 w-12 text-right">
              {Math.round(settings.effectsVolume * 100)}%
            </span>
          </div>
        </div>

            {/* Data Management */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">データ管理</h3>
              <div className="space-y-3">
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('export')}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <FaFileExport />
                    <span>詳細なデータエクスポート</span>
                  </button>
                )}
                
                <button
                  onClick={handleExportData}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FaDownload />
                  <span>バックアップをダウンロード</span>
                </button>
                
                <label className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                  <FaUpload />
                  <span>バックアップから復元</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-red-600 mb-3">危険な操作</h3>
              <button
                onClick={handleResetProgress}
                className="flex items-center space-x-2 px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                <FaTrash />
                <span>進捗をリセット</span>
              </button>
              <p className="text-sm text-gray-600 mt-2">
                すべての進捗、獲得したモンスター、実績がリセットされます。
              </p>
            </div>
          </motion.div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              <FaChartLine className="inline mr-2" />
              統計情報
            </h2>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <FaGamepad className="text-3xl text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">総問題数</p>
                <p className="text-2xl font-bold text-gray-800">{progressManager.getProgress().totalQuestions}</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <FaCheck className="text-3xl text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">正解率</p>
                <p className="text-2xl font-bold text-gray-800">{stats.accuracy.toFixed(1)}%</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <FaFire className="text-3xl text-orange-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">平均ストリーク</p>
                <p className="text-2xl font-bold text-gray-800">{stats.averageStreak.toFixed(1)}</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <FaClock className="text-3xl text-purple-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">1日の問題数</p>
                <p className="text-2xl font-bold text-gray-800">{stats.questionsPerDay.toFixed(1)}</p>
              </div>
            </div>

            {/* Level Progress */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">レベル進捗</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">現在のレベル</span>
                  <span className="text-xl font-bold text-blue-600">Lv.{progressManager.getProgress().level}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.levelProgress.percentage}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                  <span>{stats.levelProgress.current} EXP</span>
                  <span>次のレベルまで {stats.levelProgress.required - stats.levelProgress.current} EXP</span>
                </div>
              </div>
            </div>

            {/* Content Type Stats */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">コンテンツタイプ別統計</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">お気に入りのタイプ</span>
                  <span className="font-semibold text-gray-800">
                    {stats.favoriteContentType === 'proverb' && 'ことわざ'}
                    {stats.favoriteContentType === 'idiom' && '慣用句'}
                    {stats.favoriteContentType === 'four_character_idiom' && '四字熟語'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">最高ストリーク</span>
                  <span className="font-semibold text-gray-800">{stats.bestStreak}連続</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">1日あたりの問題数</span>
                  <span className="font-semibold text-gray-800">{stats.questionsPerDay.toFixed(1)}問</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <motion.div
            key="achievements"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              <FaTrophy className="inline mr-2" />
              実績
            </h2>

            <div className="space-y-4">
              {achievements.map((achievement) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 rounded-lg border-2 ${
                    achievement.unlockedAt
                      ? 'bg-yellow-50 border-yellow-300'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`text-2xl ${
                          achievement.unlockedAt ? '' : 'grayscale opacity-50'
                        }`}>
                          {achievement.icon}
                        </span>
                        <h3 className={`font-semibold ${
                          achievement.unlockedAt ? 'text-gray-800' : 'text-gray-500'
                        }`}>
                          {achievement.name}
                        </h3>
                      </div>
                      <p className={`text-sm ${
                        achievement.unlockedAt ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {achievement.description}
                      </p>
                      {achievement.unlockedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          <FaCalendar className="inline mr-1" />
                          {new Date(achievement.unlockedAt).toLocaleDateString('ja-JP')}に獲得
                        </p>
                      )}
                    </div>
                    {achievement.unlockedAt && (
                      <FaCheck className="text-green-500 text-xl ml-4" />
                    )}
                  </div>
                  
                  {/* Progress bar for incomplete achievements */}
                  {!achievement.unlockedAt && achievement.id.includes('correct') && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gray-400"
                          style={{
                            width: `${Math.min(
                              (progressManager.getProgress().correctAnswers / 
                                parseInt(achievement.id.split('_').pop() || '0')) * 100,
                              100
                            )}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">獲得済み実績</span>
                <span className="font-bold text-lg text-gray-800">
                  {achievements.filter(a => a.unlockedAt).length} / {achievements.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mt-2">
                <motion.div
                  className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${(achievements.filter(a => a.unlockedAt).length / achievements.length) * 100}%` 
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};