// Web Speech APIとWeb Audio APIを使用した音声サービス
import type { SoundEffectType } from '@/types/audio';

export interface AudioSettings {
  soundEnabled: boolean;
  effectsVolume: number;
  speechRate?: number;
  speechPitch?: number;
}


class AudioService {
  private static instance: AudioService;
  private audioContext: AudioContext | null = null;
  private speechSynthesis: SpeechSynthesis | null = null;
  private audioBuffers: Map<SoundEffectType, AudioBuffer> = new Map();
  private settings: AudioSettings = {
    soundEnabled: true,
    effectsVolume: 0.5,
    speechRate: 1.0,
    speechPitch: 1.0,
  };
  private isSpeaking: boolean = false;
  // private currentUtterance: SpeechSynthesisUtterance | null = null;

  private constructor() {
    // ブラウザのサポートを確認
    if (typeof window !== 'undefined') {
      if ('AudioContext' in window || 'webkitAudioContext' in window) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      if ('speechSynthesis' in window) {
        this.speechSynthesis = window.speechSynthesis;
      }
    }
  }

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  // 設定を更新
  updateSettings(settings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  // テキストを読み上げる
  async speak(text: string, options?: {
    rate?: number;
    pitch?: number;
    voice?: string;
    onEnd?: () => void;
  }): Promise<void> {
    if (!this.speechSynthesis || !this.settings.soundEnabled) {
      options?.onEnd?.();
      return;
    }

    // 既存の読み上げを停止
    this.stopSpeaking();

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // 日本語の音声を設定
      const voices = this.speechSynthesis!.getVoices();
      const japaneseVoice = voices.find(voice => 
        voice.lang === 'ja-JP' || voice.lang.startsWith('ja')
      );
      
      if (japaneseVoice) {
        utterance.voice = japaneseVoice;
      }
      
      utterance.rate = options?.rate || this.settings.speechRate || 1.0;
      utterance.pitch = options?.pitch || this.settings.speechPitch || 1.0;
      utterance.volume = this.settings.effectsVolume;
      
      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        options?.onEnd?.();
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        this.isSpeaking = false;
        this.currentUtterance = null;
        resolve();
      };
      
      this.currentUtterance = utterance;
      this.isSpeaking = true;
      this.speechSynthesis!.speak(utterance);
    });
  }

  // 読み上げを停止
  stopSpeaking(): void {
    if (this.speechSynthesis && this.isSpeaking) {
      this.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
    }
  }

  // 読み上げ中かどうか
  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  // 効果音を再生（シンプルな音の生成）
  async playSound(type: SoundEffectType): Promise<void> {
    if (!this.audioContext || !this.settings.soundEnabled) return;

    // AudioContextが停止している場合は再開
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // 効果音のパラメータ設定
    switch (type) {
      case 'correct':
        // 正解音：上昇する明るい音
        oscillator.frequency.setValueAtTime(523.25, now); // C5
        oscillator.frequency.exponentialRampToValueAtTime(1046.5, now + 0.15); // C6
        gainNode.gain.setValueAtTime(this.settings.effectsVolume * 0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;
        
      case 'incorrect':
        // 不正解音：下降する低い音
        oscillator.frequency.setValueAtTime(300, now);
        oscillator.frequency.exponentialRampToValueAtTime(150, now + 0.2);
        gainNode.gain.setValueAtTime(this.settings.effectsVolume * 0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;
        
      case 'levelUp':
        // レベルアップ音：ファンファーレ風
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
          const osc = this.audioContext!.createOscillator();
          const gain = this.audioContext!.createGain();
          osc.connect(gain);
          gain.connect(this.audioContext!.destination);
          
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
          gain.gain.setValueAtTime(this.settings.effectsVolume * 0.3, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.4);
          
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.4);
        });
        break;
        
      case 'achievement':
        // アチーブメント音：キラキラ音
        for (let i = 0; i < 3; i++) {
          const osc = this.audioContext!.createOscillator();
          const gain = this.audioContext!.createGain();
          osc.connect(gain);
          gain.connect(this.audioContext!.destination);
          
          osc.frequency.setValueAtTime(800 + i * 200, now + i * 0.05);
          osc.type = 'sine';
          gain.gain.setValueAtTime(this.settings.effectsVolume * 0.1, now + i * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.2);
          
          osc.start(now + i * 0.05);
          osc.stop(now + i * 0.05 + 0.2);
        }
        break;
        
      case 'monsterGet':
        // モンスター獲得音：明るいメロディ
        const melody = [523.25, 659.25, 523.25, 783.99]; // C5, E5, C5, G5
        melody.forEach((freq, i) => {
          const osc = this.audioContext!.createOscillator();
          const gain = this.audioContext!.createGain();
          osc.connect(gain);
          gain.connect(this.audioContext!.destination);
          
          osc.frequency.setValueAtTime(freq, now + i * 0.15);
          gain.gain.setValueAtTime(this.settings.effectsVolume * 0.25, now + i * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.1);
          
          osc.start(now + i * 0.15);
          osc.stop(now + i * 0.15 + 0.1);
        });
        break;
        
      case 'click':
        // クリック音：短い高音
        oscillator.frequency.setValueAtTime(1000, now);
        gainNode.gain.setValueAtTime(this.settings.effectsVolume * 0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        oscillator.start(now);
        oscillator.stop(now + 0.05);
        break;
        
      case 'hover':
        // ホバー音：柔らかい音
        oscillator.frequency.setValueAtTime(600, now);
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(this.settings.effectsVolume * 0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
        break;
    }
  }

  // リソースのクリーンアップ
  dispose(): void {
    this.stopSpeaking();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.audioBuffers.clear();
  }
}

export const audioService = AudioService.getInstance();