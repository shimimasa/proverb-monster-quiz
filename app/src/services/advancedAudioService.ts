// 高度な音声読み上げと音響効果サービス
import type { SoundEffectType } from '@/types/audio';
import type { ContentItem } from '@/types';

// 音声設定の拡張インターフェース
export interface AdvancedAudioSettings {
  soundEnabled: boolean;
  effectsVolume: number;
  speechRate: number;
  speechPitch: number;
  speechVoice: string | null;
  autoReadQuestions: boolean;
  autoReadAnswers: boolean;
  enableVoiceEffects: boolean;
  backgroundMusicVolume: number;
  enableHapticFeedback: boolean;
}

// 音声キューのアイテム
interface SpeechQueueItem {
  text: string;
  options?: SpeechOptions;
  priority: 'high' | 'normal' | 'low';
  callback?: () => void;
}

// 音声オプション
interface SpeechOptions {
  rate?: number;
  pitch?: number;
  voice?: string;
  emphasis?: 'strong' | 'moderate' | 'none';
  pauseBefore?: number;
  pauseAfter?: number;
}

// 音声解析結果
interface SpeechAnalysis {
  hasKanji: boolean;
  hasDifficultReading: boolean;
  estimatedDuration: number;
  recommendedRate: number;
}

// キャッシュエントリ
interface AudioCacheEntry {
  blob: Blob;
  timestamp: number;
  duration: number;
}

class AdvancedAudioService {
  private static instance: AdvancedAudioService;
  private audioContext: AudioContext | null = null;
  private speechSynthesis: SpeechSynthesis | null = null;
  private analyser: AnalyserNode | null = null;
  private speechQueue: SpeechQueueItem[] = [];
  private isProcessingQueue = false;
  private audioCache = new Map<string, AudioCacheEntry>();
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private backgroundMusic: HTMLAudioElement | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  
  private settings: AdvancedAudioSettings = {
    soundEnabled: true,
    effectsVolume: 0.5,
    speechRate: 1.0,
    speechPitch: 1.0,
    speechVoice: null,
    autoReadQuestions: false,
    autoReadAnswers: true,
    enableVoiceEffects: true,
    backgroundMusicVolume: 0.2,
    enableHapticFeedback: true,
  };

  private voices: SpeechSynthesisVoice[] = [];
  private preferredVoices: Map<string, SpeechSynthesisVoice> = new Map();

  private constructor() {
    this.initialize();
  }

  static getInstance(): AdvancedAudioService {
    if (!AdvancedAudioService.instance) {
      AdvancedAudioService.instance = new AdvancedAudioService();
    }
    return AdvancedAudioService.instance;
  }

  private async initialize() {
    if (typeof window === 'undefined') return;

    // AudioContext初期化
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
    }

    // Speech Synthesis初期化
    if ('speechSynthesis' in window) {
      this.speechSynthesis = window.speechSynthesis;
      
      // 音声リストの読み込み
      const loadVoices = () => {
        this.voices = this.speechSynthesis!.getVoices();
        this.categorizeVoices();
      };

      loadVoices();
      if (this.speechSynthesis.onvoiceschanged !== undefined) {
        this.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }

    // キャッシュのクリーンアップ（30分経過したものを削除）
    setInterval(() => this.cleanupCache(), 30 * 60 * 1000);
  }

  // 音声をカテゴリ分け
  private categorizeVoices() {
    const japaneseVoices = this.voices.filter(voice => 
      voice.lang === 'ja-JP' || voice.lang.startsWith('ja')
    );

    // 優先順位付け
    const priorities = {
      'Google 日本語': 3,
      'Microsoft Haruka': 2,
      'Microsoft Ayumi': 2,
      'Microsoft Ichiro': 2,
    };

    japaneseVoices.sort((a, b) => {
      const aPriority = Object.entries(priorities).find(([name]) => 
        a.name.includes(name)
      )?.[1] || 0;
      const bPriority = Object.entries(priorities).find(([name]) => 
        b.name.includes(name)
      )?.[1] || 0;
      return bPriority - aPriority;
    });

    // カテゴリ別に保存
    if (japaneseVoices.length > 0) {
      this.preferredVoices.set('default', japaneseVoices[0]);
      
      // 女性声
      const femaleVoice = japaneseVoices.find(v => 
        v.name.includes('Haruka') || v.name.includes('Ayumi') || !v.name.includes('Ichiro')
      );
      if (femaleVoice) this.preferredVoices.set('female', femaleVoice);

      // 男性声
      const maleVoice = japaneseVoices.find(v => 
        v.name.includes('Ichiro')
      );
      if (maleVoice) this.preferredVoices.set('male', maleVoice);
    }
  }

  // 設定更新
  updateSettings(settings: Partial<AdvancedAudioSettings>): void {
    this.settings = { ...this.settings, ...settings };
    
    // 背景音楽の音量更新
    if (this.backgroundMusic && 'backgroundMusicVolume' in settings) {
      this.backgroundMusic.volume = settings.backgroundMusicVolume!;
    }
  }

  // テキスト解析
  private analyzeText(text: string): SpeechAnalysis {
    const kanjiPattern = /[\u4e00-\u9faf]/g;
    const difficultReadingPattern = /[々〃ヶ]/g;
    
    const hasKanji = kanjiPattern.test(text);
    const hasDifficultReading = difficultReadingPattern.test(text);
    
    // 文字数と複雑さから推定時間を計算
    const charCount = text.length;
    const kanjiCount = (text.match(kanjiPattern) || []).length;
    const complexity = kanjiCount / charCount;
    
    const baseRate = 4; // 1秒あたり4文字
    const complexityFactor = 1 + complexity * 0.5;
    const estimatedDuration = (charCount / baseRate) * complexityFactor;
    
    // 推奨読み上げ速度
    const recommendedRate = hasDifficultReading ? 0.9 : 
                           complexity > 0.5 ? 0.95 : 
                           1.0;

    return {
      hasKanji,
      hasDifficultReading,
      estimatedDuration,
      recommendedRate
    };
  }

  // 読み上げテキストの前処理
  private preprocessText(text: string, contentItem?: ContentItem): string {
    let processed = text;

    // 読みがなが提供されている場合
    if (contentItem?.reading) {
      // 必要に応じて読みがなを挿入
      processed = `${text}、${contentItem.reading}`;
    }

    // 句読点での一時停止を強調
    processed = processed
      .replace(/、/g, '、<break time="200ms"/>')
      .replace(/。/g, '。<break time="400ms"/>')
      .replace(/！/g, '！<break time="300ms"/>')
      .replace(/？/g, '？<break time="300ms"/>');

    // 括弧内の説明を読みやすく
    processed = processed.replace(/（([^）]+)）/g, '<break time="100ms"/>、$1、<break time="100ms"/>');

    return processed;
  }

  // 高度な読み上げ機能
  async speakAdvanced(
    text: string, 
    options?: SpeechOptions & { 
      contentItem?: ContentItem;
      useCache?: boolean;
      visualFeedback?: (progress: number) => void;
    }
  ): Promise<void> {
    if (!this.speechSynthesis || !this.settings.soundEnabled) {
      return;
    }

    const cacheKey = `${text}-${JSON.stringify(options)}`;
    
    // キャッシュチェック
    if (options?.useCache && this.audioCache.has(cacheKey)) {
      const cached = this.audioCache.get(cacheKey)!;
      return this.playAudioBlob(cached.blob);
    }

    // テキスト解析
    const analysis = this.analyzeText(text);
    const processedText = this.preprocessText(text, options?.contentItem);

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(processedText);
      
      // 音声選択
      const voice = this.selectVoice(options?.voice);
      if (voice) {
        utterance.voice = voice;
      }

      // パラメータ設定
      utterance.rate = options?.rate || 
                      analysis.recommendedRate * this.settings.speechRate;
      utterance.pitch = options?.pitch || this.settings.speechPitch;
      utterance.volume = this.settings.effectsVolume;

      // イベントハンドラ
      let startTime = 0;
      
      utterance.onstart = () => {
        startTime = Date.now();
        this.currentUtterance = utterance;
        
        // 振動フィードバック
        if (this.settings.enableHapticFeedback && 'vibrate' in navigator) {
          navigator.vibrate(50);
        }
      };

      utterance.onboundary = (event) => {
        if (options?.visualFeedback && startTime > 0) {
          const progress = event.charIndex / processedText.length;
          options.visualFeedback(progress);
        }
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        
        // キャッシュに保存（録音機能があれば）
        if (options?.useCache && this.mediaRecorder) {
          // 録音データをキャッシュに保存する処理
        }
        
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        this.currentUtterance = null;
        reject(event);
      };

      // キューに追加または即座に実行
      if (options?.emphasis === 'strong') {
        // 重要な読み上げは即座に実行
        this.speechSynthesis.cancel();
        this.speechSynthesis.speak(utterance);
      } else {
        this.addToQueue({
          text: processedText,
          options,
          priority: options?.emphasis === 'moderate' ? 'high' : 'normal',
          callback: resolve
        });
      }
    });
  }

  // 音声選択
  private selectVoice(voicePreference?: string): SpeechSynthesisVoice | null {
    if (voicePreference && this.preferredVoices.has(voicePreference)) {
      return this.preferredVoices.get(voicePreference)!;
    }

    if (this.settings.speechVoice) {
      const voice = this.voices.find(v => v.name === this.settings.speechVoice);
      if (voice) return voice;
    }

    return this.preferredVoices.get('default') || null;
  }

  // キュー管理
  private addToQueue(item: SpeechQueueItem) {
    this.speechQueue.push(item);
    this.speechQueue.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.speechQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }

    this.isProcessingQueue = true;
    const item = this.speechQueue.shift()!;

    try {
      await this.speakAdvanced(item.text, item.options);
      item.callback?.();
    } catch (error) {
      console.error('Error processing speech queue:', error);
    }

    // 次のアイテムを処理
    setTimeout(() => this.processQueue(), 100);
  }

  // 効果音の高度な再生
  async playAdvancedSound(type: SoundEffectType, options?: {
    variation?: number;
    delay?: number;
    pan?: number;
  }): Promise<void> {
    if (!this.audioContext || !this.settings.soundEnabled) return;

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const now = this.audioContext.currentTime + (options?.delay || 0);
    
    // ステレオパニング
    const panner = this.audioContext.createStereoPanner();
    panner.pan.value = options?.pan || 0;

    // 効果音生成（より豊かな音）
    switch (type) {
      case 'correct':
        this.playCorrectSound(now, panner, options?.variation);
        break;
      case 'levelUp':
        this.playLevelUpSound(now, panner);
        break;
      case 'monsterGet':
        this.playMonsterGetSound(now, panner, options?.variation);
        break;
      // 他の効果音も同様に実装
    }
  }

  // 正解音（バリエーション付き）
  private playCorrectSound(startTime: number, panner: StereoPannerNode, variation = 0) {
    const frequencies = [
      [523.25, 659.25, 783.99], // C-E-G
      [587.33, 739.99, 880],    // D-F#-A
      [659.25, 830.61, 987.77], // E-G#-B
    ];

    const selectedFreqs = frequencies[variation % frequencies.length];
    
    selectedFreqs.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      const filter = this.audioContext!.createBiquadFilter();

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(panner);
      panner.connect(this.audioContext!.destination);

      // より豊かな音色
      osc.type = 'sine';
      filter.type = 'lowpass';
      filter.frequency.value = 2000;
      filter.Q.value = 1;

      osc.frequency.setValueAtTime(freq, startTime + i * 0.08);
      gain.gain.setValueAtTime(this.settings.effectsVolume * 0.3, startTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + i * 0.08 + 0.4);

      osc.start(startTime + i * 0.08);
      osc.stop(startTime + i * 0.08 + 0.4);
    });
  }

  // レベルアップ音（より豪華に）
  private playLevelUpSound(startTime: number, panner: StereoPannerNode) {
    // ファンファーレのメロディ
    const melody = [
      { freq: 523.25, time: 0, duration: 0.2 },      // C5
      { freq: 523.25, time: 0.15, duration: 0.1 },   // C5
      { freq: 523.25, time: 0.25, duration: 0.1 },   // C5
      { freq: 659.25, time: 0.35, duration: 0.3 },   // E5
      { freq: 783.99, time: 0.5, duration: 0.2 },    // G5
      { freq: 1046.5, time: 0.7, duration: 0.5 },    // C6
    ];

    melody.forEach(note => {
      // メイン音
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      
      // ハーモニー追加
      const harmonyOsc = this.audioContext!.createOscillator();
      const harmonyGain = this.audioContext!.createGain();

      osc.connect(gain);
      harmonyOsc.connect(harmonyGain);
      gain.connect(panner);
      harmonyGain.connect(panner);
      panner.connect(this.audioContext!.destination);

      osc.frequency.setValueAtTime(note.freq, startTime + note.time);
      harmonyOsc.frequency.setValueAtTime(note.freq * 1.5, startTime + note.time);

      gain.gain.setValueAtTime(this.settings.effectsVolume * 0.4, startTime + note.time);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + note.time + note.duration);

      harmonyGain.gain.setValueAtTime(this.settings.effectsVolume * 0.2, startTime + note.time);
      harmonyGain.gain.exponentialRampToValueAtTime(0.01, startTime + note.time + note.duration);

      osc.start(startTime + note.time);
      osc.stop(startTime + note.time + note.duration);
      harmonyOsc.start(startTime + note.time);
      harmonyOsc.stop(startTime + note.time + note.duration);
    });
  }

  // モンスター獲得音（キャラクター別）
  private playMonsterGetSound(startTime: number, panner: StereoPannerNode, variation = 0) {
    const themes = [
      // かわいい系
      [659.25, 783.99, 987.77, 783.99], // E-G-B-G
      // クール系
      [440, 554.37, 659.25, 554.37],    // A-C#-E-C#
      // ミステリアス系
      [466.16, 554.37, 698.46, 554.37], // Bb-C#-F-C#
    ];

    const theme = themes[variation % themes.length];
    
    theme.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      const vibrato = this.audioContext!.createOscillator();
      const vibratoGain = this.audioContext!.createGain();

      // ビブラート効果
      vibrato.frequency.value = 5;
      vibratoGain.gain.value = 10;
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);

      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.audioContext!.destination);

      osc.frequency.setValueAtTime(freq, startTime + i * 0.15);
      osc.type = 'triangle';

      gain.gain.setValueAtTime(this.settings.effectsVolume * 0.3, startTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + i * 0.15 + 0.3);

      vibrato.start(startTime + i * 0.15);
      osc.start(startTime + i * 0.15);
      vibrato.stop(startTime + i * 0.15 + 0.3);
      osc.stop(startTime + i * 0.15 + 0.3);
    });
  }

  // 背景音楽の管理
  async playBackgroundMusic(url: string, options?: {
    loop?: boolean;
    fadeIn?: number;
    crossFade?: boolean;
  }): Promise<void> {
    if (!this.settings.soundEnabled) return;

    const newMusic = new Audio(url);
    newMusic.loop = options?.loop ?? true;
    newMusic.volume = 0;

    if (this.backgroundMusic && options?.crossFade) {
      // クロスフェード
      const oldMusic = this.backgroundMusic;
      const fadeOutDuration = options.fadeIn || 2000;
      
      // 古い音楽をフェードアウト
      this.fadeAudio(oldMusic, oldMusic.volume, 0, fadeOutDuration)
        .then(() => {
          oldMusic.pause();
          oldMusic.remove();
        });
    } else if (this.backgroundMusic) {
      this.backgroundMusic.pause();
    }

    this.backgroundMusic = newMusic;
    await newMusic.play();

    // フェードイン
    if (options?.fadeIn) {
      await this.fadeAudio(newMusic, 0, this.settings.backgroundMusicVolume, options.fadeIn);
    } else {
      newMusic.volume = this.settings.backgroundMusicVolume;
    }
  }

  // 音量フェード
  private fadeAudio(audio: HTMLAudioElement, from: number, to: number, duration: number): Promise<void> {
    return new Promise(resolve => {
      const startTime = Date.now();
      const endTime = startTime + duration;

      const fade = () => {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        
        audio.volume = from + (to - from) * progress;

        if (progress < 1) {
          requestAnimationFrame(fade);
        } else {
          resolve();
        }
      };

      fade();
    });
  }

  // 音声可視化データ取得
  getVisualizationData(): Uint8Array | null {
    if (!this.analyser) return null;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    return dataArray;
  }

  // キャッシュのクリーンアップ
  private cleanupCache() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30分

    for (const [key, entry] of this.audioCache.entries()) {
      if (now - entry.timestamp > maxAge) {
        this.audioCache.delete(key);
      }
    }
  }

  // Blobの再生
  private async playAudioBlob(blob: Blob): Promise<void> {
    const audio = new Audio(URL.createObjectURL(blob));
    audio.volume = this.settings.effectsVolume;
    
    return new Promise((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audio.src);
        resolve();
      };
      audio.onerror = reject;
      audio.play();
    });
  }

  // 利用可能な音声のリスト取得
  getAvailableVoices(): Array<{ name: string; lang: string; category: string }> {
    return this.voices.map(voice => ({
      name: voice.name,
      lang: voice.lang,
      category: voice.lang.startsWith('ja') ? 'japanese' : 'other'
    }));
  }

  // 読み上げの一時停止/再開
  pauseSpeaking() {
    if (this.speechSynthesis) {
      this.speechSynthesis.pause();
    }
  }

  resumeSpeaking() {
    if (this.speechSynthesis) {
      this.speechSynthesis.resume();
    }
  }

  // 読み上げ停止
  stopSpeaking() {
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
      this.speechQueue = [];
      this.isProcessingQueue = false;
      this.currentUtterance = null;
    }
  }

  // リソースの解放
  dispose() {
    this.stopSpeaking();
    
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.audioCache.clear();
  }
}

export const advancedAudioService = AdvancedAudioService.getInstance();