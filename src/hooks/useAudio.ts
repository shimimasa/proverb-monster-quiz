import { useEffect, useCallback, useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { audioService } from '@/services/audioService';
import type { SoundEffectType } from '@/types/audio';

export interface UseAudioReturn {
  // 音声読み上げ
  speak: (text: string, options?: SpeakOptions) => Promise<void>;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  
  // 効果音
  playSound: (type: SoundEffectType) => Promise<void>;
  
  // 設定
  isEnabled: boolean;
  volume: number;
  updateVolume: (volume: number) => void;
  toggleSound: () => void;
}

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
}

export function useAudio(): UseAudioReturn {
  const { progressManager } = useGame();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const settings = progressManager.getSettings();

  // 設定が変更されたときにaudioServiceを更新
  useEffect(() => {
    audioService.updateSettings({
      soundEnabled: settings.soundEnabled,
      effectsVolume: settings.effectsVolume,
    });
  }, [settings.soundEnabled, settings.effectsVolume]);

  // テキスト読み上げ
  const speak = useCallback(async (text: string, options?: SpeakOptions) => {
    if (!settings.soundEnabled) return;
    
    setIsSpeaking(true);
    try {
      await audioService.speak(text, {
        ...options,
        onEnd: () => {
          setIsSpeaking(false);
          options?.onEnd?.();
        }
      });
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
    }
  }, [settings.soundEnabled]);

  // 読み上げ停止
  const stopSpeaking = useCallback(() => {
    audioService.stopSpeaking();
    setIsSpeaking(false);
  }, []);

  // 効果音再生
  const playSound = useCallback(async (type: SoundEffectType) => {
    if (!settings.soundEnabled) return;
    
    try {
      await audioService.playSound(type);
    } catch (error) {
      console.error('Sound playback error:', error);
    }
  }, [settings.soundEnabled]);

  // 音量更新
  const updateVolume = useCallback((volume: number) => {
    progressManager.updateSettings({ effectsVolume: volume });
    audioService.updateSettings({ effectsVolume: volume });
  }, [progressManager]);

  // サウンドのON/OFF切り替え
  const toggleSound = useCallback(() => {
    const newEnabled = !settings.soundEnabled;
    progressManager.updateSettings({ soundEnabled: newEnabled });
    audioService.updateSettings({ soundEnabled: newEnabled });
    
    // 音声読み上げ中なら停止
    if (!newEnabled && isSpeaking) {
      stopSpeaking();
    }
  }, [settings.soundEnabled, progressManager, isSpeaking, stopSpeaking]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  return {
    speak,
    stopSpeaking,
    isSpeaking,
    playSound,
    isEnabled: settings.soundEnabled,
    volume: settings.effectsVolume,
    updateVolume,
    toggleSound,
  };
}