/**
 * Speech Recognition and Voice Synthesis Architecture for J.A.R.V.I.S.
 * Fully optimized for Brazilian Portuguese (pt-BR).
 * 
 * Supports:
 * - Live Speech-to-Text via Web Speech Recognition (pt-BR)
 * - Decibel volume analyzer for Neural Core waveform visualization
 * - Speech synthesis (Text-to-Speech) for verbal responses
 * - Error recovery and graceful permission handling
 * - Portuguese grammar and wake-word normalization
 */

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
        confidence?: number;
      };
      isFinal: boolean;
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface IWindowSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export type SpeechState = 'idle' | 'listening' | 'processing' | 'speaking';

export interface SpeechEngineCallbacks {
  onTranscript: (text: string, isFinal: boolean) => void;
  onVolumeChange?: (volume: number) => void;
  onError: (errorMessage: string) => void;
  onStateChange: (state: SpeechState) => void;
  onAudioLevel?: (level: number) => void;
}

export class SpeechEngine {
  private recognition: any = null;
  private isListening = false;
  private isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private callbacks: SpeechEngineCallbacks | null = null;

  // Web Audio decibel analyzer
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private animFrameId: number | null = null;

  constructor() {
    this.initRecognition();
  }

  /**
   * Initializes the Brazilian Portuguese speech recognition instance.
   */
  private initRecognition() {
    const win = window as IWindowSpeech;
    const RecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!RecognitionClass) {
      console.warn('SpeechRecognition API not available in this browser engine.');
      return;
    }

    try {
      this.recognition = new RecognitionClass();
      this.recognition.lang = 'pt-BR';
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 2;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.callbacks?.onStateChange('listening');
        this.startVolumeMonitoring();
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          const normalized = this.normalizePortugueseCommand(finalTranscript.trim());
          this.callbacks?.onTranscript(normalized, true);
        } else if (interimTranscript) {
          this.callbacks?.onTranscript(interimTranscript.trim(), false);
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        this.stopVolumeMonitoring();
        this.isListening = false;
        this.callbacks?.onStateChange(this.isSpeaking ? 'speaking' : 'idle');

        let message = 'Falha no reconhecimento de voz.';
        switch (event.error) {
          case 'not-allowed':
          case 'permission-denied':
            message = 'Permissão de microfone negada. Conceda acesso nas permissões do navegador ou Android.';
            break;
          case 'no-speech':
            message = 'Nenhum som detectado. Fale próximo ao microfone.';
            break;
          case 'network':
            message = 'Instabilidade de conexão no serviço de reconhecimento de voz.';
            break;
          case 'aborted':
            // User cancelled intentionally, don't show alarm
            return;
          default:
            message = `Erro de captura de voz: ${event.error}`;
        }
        this.callbacks?.onError(message);
      };

      this.recognition.onend = () => {
        this.stopVolumeMonitoring();
        this.isListening = false;
        this.callbacks?.onStateChange(this.isSpeaking ? 'speaking' : 'idle');
      };
    } catch (err) {
      console.warn('Failed to construct SpeechRecognition:', err);
    }
  }

  /**
   * Normalizes Brazilian Portuguese speech recognition artifacts.
   */
  private normalizePortugueseCommand(raw: string): string {
    let text = raw;
    // Fix phonetic transcription variants for "Jarvis"
    text = text.replace(/^(?:e aí\s+|ei\s+)?(?:iarves|jarves|jarvez|jarve|xarvis)\b/gi, 'Jarvis');
    return text;
  }

  /**
   * Connects callback listeners.
   */
  public registerCallbacks(callbacks: SpeechEngineCallbacks) {
    this.callbacks = callbacks;
  }

  public isRecognitionSupported(): boolean {
    const win = window as IWindowSpeech;
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  public isSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  /**
   * Starts listening for Brazilian Portuguese speech.
   */
  public startListening(): boolean {
    // If Jarvis is currently speaking, silence him before listening to user
    if (this.isSpeaking) {
      this.stopSpeaking();
    }

    if (!this.recognition) {
      this.initRecognition();
    }

    if (!this.recognition) {
      this.callbacks?.onError(
        'Reconhecimento de voz não suportado neste navegador. Digite sua mensagem no campo de texto.'
      );
      return false;
    }

    try {
      this.recognition.start();
      return true;
    } catch {
      try {
        this.recognition.stop();
        setTimeout(() => {
          try {
            this.recognition.start();
          } catch (e: any) {
            this.callbacks?.onError(e?.message || 'Falha ao acionar microfone.');
          }
        }, 150);
        return true;
      } catch (err: any) {
        this.callbacks?.onError(err?.message || 'Microfone indisponível.');
        return false;
      }
    }
  }

  /**
   * Stops listening.
   */
  public stopListening() {
    this.stopVolumeMonitoring();
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
    this.isListening = false;
    this.callbacks?.onStateChange(this.isSpeaking ? 'speaking' : 'idle');
  }

  /**
   * Starts monitoring microphone volume for audio visualizer.
   */
  private async startVolumeMonitoring() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      const source = this.audioCtx.createMediaStreamSource(this.micStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);

      const buffer = new Uint8Array(this.analyser.frequencyBinCount);
      const checkVolume = () => {
        if (!this.analyser || !this.isListening) return;
        this.analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const avg = sum / buffer.length;
        const normalized = Math.min(1, avg / 80);
        this.callbacks?.onAudioLevel?.(normalized);
        this.animFrameId = requestAnimationFrame(checkVolume);
      };
      this.animFrameId = requestAnimationFrame(checkVolume);
    } catch {
      // Audio level monitoring is optional
    }
  }

  private stopVolumeMonitoring() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close();
      } catch {
        // ignore
      }
      this.audioCtx = null;
    }
    this.analyser = null;
    this.callbacks?.onAudioLevel?.(0);
  }

  /**
   * Retrieves list of available SpeechSynthesis voices.
   */
  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.isSynthesisSupported()) return [];
    return window.speechSynthesis.getVoices();
  }

  /**
   * Voice Output (Text-to-Speech) calibrated for Brazilian Portuguese.
   */
  public speak(
    text: string,
    options?: { pitch?: number; rate?: number; voiceName?: string }
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isSynthesisSupported()) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      // Clean special characters for natural speech
      const cleaned = text
        .replace(/[*_#`~]/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/https?:\/\/\S+/g, 'link')
        .replace(/[\n\r]+/g, '. ')
        .trim();

      if (!cleaned) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = 'pt-BR';
      utterance.pitch = options?.pitch ?? 0.95;
      utterance.rate = options?.rate ?? 1.05;

      const voices = window.speechSynthesis.getVoices();
      let selectedVoice: SpeechSynthesisVoice | undefined;

      if (options?.voiceName) {
        selectedVoice = voices.find((v) => v.name === options.voiceName);
      }

      if (!selectedVoice) {
        // Preferred Brazilian Portuguese voice match
        selectedVoice =
          voices.find((v) => v.lang === 'pt-BR' || v.lang === 'pt_BR') ||
          voices.find((v) => v.lang.toLowerCase().includes('pt-br')) ||
          voices.find((v) => v.lang.startsWith('pt'));
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.callbacks?.onStateChange('speaking');
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.callbacks?.onStateChange(this.isListening ? 'listening' : 'idle');
        resolve();
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.callbacks?.onStateChange(this.isListening ? 'listening' : 'idle');
        resolve();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    });
  }

  public stopSpeaking() {
    if (this.isSynthesisSupported()) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
      this.isSpeaking = false;
      this.callbacks?.onStateChange(this.isListening ? 'listening' : 'idle');
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}

export const speechEngine = new SpeechEngine();
