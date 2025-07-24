import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaVolumeUp, 
  FaVolumeMute, 
  FaPlay, 
  FaPause, 
  FaStop,
  FaCog,
  FaMicrophone,
  FaMusic
} from 'react-icons/fa';
import { advancedAudioService, type AdvancedAudioSettings } from '@/services/advancedAudioService';

interface AudioControlsProps {
  className?: string;
  showAdvanced?: boolean;
  onSettingsChange?: (settings: AdvancedAudioSettings) => void;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  className = '',
  showAdvanced = false,
  onSettingsChange
}) => {
  const [settings, setSettings] = useState<AdvancedAudioSettings>(
    advancedAudioService.getSettings()
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<Array<{
    name: string;
    lang: string;
    category: string;
  }>>([]);

  useEffect(() => {
    // 利用可能な音声を取得
    const loadVoices = () => {
      const voices = advancedAudioService.getAvailableVoices();
      setAvailableVoices(voices);
    };

    loadVoices();
    
    // 音声リストが変更された場合の対応
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const updateSetting = useCallback(<K extends keyof AdvancedAudioSettings>(
    key: K,
    value: AdvancedAudioSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    advancedAudioService.updateSettings({ [key]: value });
    onSettingsChange?.(newSettings);
  }, [settings, onSettingsChange]);

  const toggleSound = () => {
    updateSetting('soundEnabled', !settings.soundEnabled);
    if (!settings.soundEnabled) {
      // 音を有効にした時のフィードバック
      advancedAudioService.playAdvancedSound('click');
    }
  };

  const testSpeech = async () => {
    if (isPlaying) {
      advancedAudioService.stopSpeaking();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      await advancedAudioService.speakAdvanced(
        'こんにちは！ことだまモンスターで楽しく学習しましょう。',
        {
          emphasis: 'moderate',
          visualFeedback: (progress) => {
            // プログレス表示の更新
            console.log(`Speech progress: ${Math.round(progress * 100)}%`);
          }
        }
      );
      setIsPlaying(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* メインコントロール */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSound}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={settings.soundEnabled ? '音声をミュート' : '音声を有効化'}
        >
          {settings.soundEnabled ? (
            <FaVolumeUp className="text-xl text-gray-700 dark:text-gray-300" />
          ) : (
            <FaVolumeMute className="text-xl text-gray-400" />
          )}
        </button>

        {showAdvanced && (
          <>
            <button
              onClick={testSpeech}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={isPlaying ? '読み上げ停止' : '読み上げテスト'}
            >
              {isPlaying ? (
                <FaPause className="text-xl text-red-600" />
              ) : (
                <FaPlay className="text-xl text-green-600" />
              )}
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="音声設定"
            >
              <FaCog className="text-xl text-gray-700 dark:text-gray-300" />
            </button>
          </>
        )}
      </div>

      {/* 詳細設定パネル */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50"
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              音声設定
            </h3>

            {/* 効果音音量 */}
            <div className="mb-4">
              <label className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  効果音音量
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(settings.effectsVolume * 100)}%
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.effectsVolume * 100}
                onChange={(e) => updateSetting('effectsVolume', Number(e.target.value) / 100)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>

            {/* 読み上げ速度 */}
            <div className="mb-4">
              <label className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  読み上げ速度
                </span>
                <span className="text-sm text-gray-500">
                  {settings.speechRate.toFixed(1)}x
                </span>
              </label>
              <input
                type="range"
                min="50"
                max="200"
                value={settings.speechRate * 100}
                onChange={(e) => updateSetting('speechRate', Number(e.target.value) / 100)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>

            {/* 音声の高さ */}
            <div className="mb-4">
              <label className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  音声の高さ
                </span>
                <span className="text-sm text-gray-500">
                  {settings.speechPitch.toFixed(1)}
                </span>
              </label>
              <input
                type="range"
                min="50"
                max="200"
                value={settings.speechPitch * 100}
                onChange={(e) => updateSetting('speechPitch', Number(e.target.value) / 100)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>

            {/* 音声選択 */}
            {availableVoices.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  音声の種類
                </label>
                <select
                  value={settings.speechVoice || ''}
                  onChange={(e) => updateSetting('speechVoice', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">自動選択</option>
                  {availableVoices
                    .filter(v => v.category === 'japanese')
                    .map(voice => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* 自動読み上げ設定 */}
            <div className="space-y-3 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.autoReadQuestions}
                  onChange={(e) => updateSetting('autoReadQuestions', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  問題文を自動で読み上げる
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.autoReadAnswers}
                  onChange={(e) => updateSetting('autoReadAnswers', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  正解を自動で読み上げる
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.enableVoiceEffects}
                  onChange={(e) => updateSetting('enableVoiceEffects', e.target.checked)}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  音声エフェクトを有効化
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.enableHapticFeedback}
                  onChange={(e) => updateSetting('enableHapticFeedback', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  振動フィードバック（モバイル）
                </span>
              </label>
            </div>

            {/* 背景音楽音量 */}
            <div className="mb-4">
              <label className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <FaMusic className="text-xs" />
                  背景音楽
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(settings.backgroundMusicVolume * 100)}%
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.backgroundMusicVolume * 100}
                onChange={(e) => updateSetting('backgroundMusicVolume', Number(e.target.value) / 100)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>

            {/* プリセット */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                プリセット
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const preset = {
                      speechRate: 0.9,
                      speechPitch: 1.0,
                      effectsVolume: 0.5,
                      backgroundMusicVolume: 0.2
                    };
                    Object.entries(preset).forEach(([key, value]) => {
                      updateSetting(key as keyof AdvancedAudioSettings, value as any);
                    });
                  }}
                  className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                >
                  ゆっくり
                </button>
                <button
                  onClick={() => {
                    const preset = {
                      speechRate: 1.0,
                      speechPitch: 1.0,
                      effectsVolume: 0.5,
                      backgroundMusicVolume: 0.2
                    };
                    Object.entries(preset).forEach(([key, value]) => {
                      updateSetting(key as keyof AdvancedAudioSettings, value as any);
                    });
                  }}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  標準
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 音声読み上げボタンコンポーネント
interface SpeechButtonProps {
  text: string;
  contentItem?: any;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'ghost';
}

export const SpeechButton: React.FC<SpeechButtonProps> = ({
  text,
  contentItem,
  className = '',
  size = 'medium',
  variant = 'secondary'
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleClick = async () => {
    if (isPlaying) {
      advancedAudioService.stopSpeaking();
      setIsPlaying(false);
      setProgress(0);
    } else {
      setIsPlaying(true);
      try {
        await advancedAudioService.speakAdvanced(text, {
          contentItem,
          visualFeedback: setProgress
        });
      } finally {
        setIsPlaying(false);
        setProgress(0);
      }
    }
  };

  const sizeClasses = {
    small: 'p-1 text-sm',
    medium: 'p-2 text-base',
    large: 'p-3 text-lg'
  };

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600',
    ghost: 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
  };

  return (
    <button
      onClick={handleClick}
      className={`
        relative rounded-lg transition-all
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      aria-label={isPlaying ? '読み上げ停止' : '読み上げ開始'}
    >
      {isPlaying ? (
        <>
          <FaStop />
          {progress > 0 && (
            <div
              className="absolute bottom-0 left-0 h-0.5 bg-blue-600 transition-all"
              style={{ width: `${progress * 100}%` }}
            />
          )}
        </>
      ) : (
        <FaVolumeUp />
      )}
    </button>
  );
};

// 音声ビジュアライザー
export const AudioVisualizer: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const data = advancedAudioService.getVisualizationData();
      if (!data) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / data.length) * 2.5;
      let x = 0;

      for (let i = 0; i < data.length; i++) {
        const barHeight = (data[i] / 255) * canvas.height;
        
        const r = barHeight + 25 * (i / data.length);
        const g = 250 * (i / data.length);
        const b = 50;

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={100}
      className={`rounded-lg bg-gray-900 ${className}`}
    />
  );
};