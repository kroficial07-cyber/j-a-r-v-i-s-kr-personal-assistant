import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { speechEngine } from '../services/speechService';
import { audioSynthesizer } from '../services/audioService';
import { storageService } from '../services/storageService';
import {
  Settings,
  Volume2,
  Sliders,
  Shield,
  Smartphone,
  Download,
  Upload,
  RefreshCw,
  Check,
  Play,
  KeyRound,
  BatteryCharging,
  Mic,
  Bell,
  HardDrive,
} from 'lucide-react';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetAllData: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onResetAllData,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    setLocalSettings(settings);
    // Load voices
    const updateVoices = () => {
      const voices = speechEngine.getVoices();
      setAvailableVoices(voices);
    };
    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [settings]);

  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    onUpdateSettings(updated);
    audioSynthesizer.setSoundEnabled(updated.soundEffects);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleTestVoice = () => {
    audioSynthesizer.playTap();
    speechEngine.speak(
      `Comunicação vocal calibrada com sucesso, Senhor ${localSettings.userName}. Todos os subsistemas neurais estão operantes.`,
      {
        rate: localSettings.voiceRate,
        pitch: localSettings.voicePitch,
        voiceName: localSettings.selectedVoiceName,
      }
    );
  };

  const handleExportData = () => {
    audioSynthesizer.playTap();
    const dataStr = storageService.exportAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jarvis_kr_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = storageService.importAllData(content);
      if (success) {
        audioSynthesizer.playSuccess();
        setImportStatus('Backup restaurado com sucesso! Atualizando aplicação...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        audioSynthesizer.playWarning();
        setImportStatus('Erro: O arquivo selecionado não é um backup válido do J.A.R.V.I.S.');
      }
    };
    reader.readAsText(file);
  };

  const ptVoices = availableVoices.filter(
    (v) => v.lang.startsWith('pt') || v.lang.includes('BR')
  );

  return (
    <div className="flex flex-col min-h-full px-4 pt-3 pb-28 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Settings className="w-3.5 h-3.5" />
            <span>CENTRAL DE CONFIGURAÇÕES // KR-OS</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-0.5">Diretrizes & Parâmetros</h2>
        </div>

        {isSaved && (
          <span className="flex items-center gap-1 text-xs font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
            <Check className="w-3.5 h-3.5" /> Salvo
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Section 1: Voz & Fala */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            Voz e Síntese Neural (pt-BR)
          </h3>

          <div className="space-y-3.5">
            {/* Voice select */}
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Sintetizador de Voz Disponível
              </label>
              <select
                value={localSettings.selectedVoiceName}
                onChange={(e) => handleChange('selectedVoiceName', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
              >
                <option value="">Voz Padrão do Sistema (Português Brasil)</option>
                {ptVoices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            {/* Voice Rate Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-slate-300">Velocidade da Voz:</span>
                <span className="text-cyan-400 font-bold">{localSettings.voiceRate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.4"
                step="0.05"
                value={localSettings.voiceRate}
                onChange={(e) => handleChange('voiceRate', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Voice Pitch Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-slate-300">Tom de Frequência (Pitch):</span>
                <span className="text-cyan-400 font-bold">{localSettings.voicePitch.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.05"
                value={localSettings.voicePitch}
                onChange={(e) => handleChange('voicePitch', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Auto speak responses */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-200">Leitura verbal automática das respostas</span>
              <button
                onClick={() => handleChange('autoSpeakResponses', !localSettings.autoSpeakResponses)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  localSettings.autoSpeakResponses ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                    localSettings.autoSpeakResponses ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Test Voice button */}
            <button
              onClick={handleTestVoice}
              className="w-full mt-2 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-mono flex items-center justify-center gap-2 transition-colors active:scale-98"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Testar Calibração de Voz</span>
            </button>
          </div>
        </div>

        {/* Section 2: Identidade e Acesso */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <KeyRound className="w-4 h-4 text-cyan-400" />
            Identidade do Usuário & PIN de Acesso
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Nome Mestre
              </label>
              <input
                type="text"
                value={localSettings.userName}
                onChange={(e) => handleChange('userName', e.target.value)}
                placeholder="KR"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                PIN de Recuperação
              </label>
              <input
                type="text"
                maxLength={6}
                value={localSettings.securityPin}
                onChange={(e) => handleChange('securityPin', e.target.value)}
                placeholder="0707"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-xs font-mono text-slate-300 mb-1">
              E-mail de Recuperação do Dispositivo
            </label>
            <input
              type="email"
              value={localSettings.recoveryEmail}
              onChange={(e) => handleChange('recoveryEmail', e.target.value)}
              placeholder="kr.oficial.07@gmail.com"
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Section 3: Desempenho & Efeitos */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Desempenho e Efeitos do Sistema
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-200 block">Sons de interface futuristas</span>
                <span className="text-[11px] text-slate-400 block">Beeps e chimes sintetizados offline</span>
              </div>
              <button
                onClick={() => handleChange('soundEffects', !localSettings.soundEffects)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  localSettings.soundEffects ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                    localSettings.soundEffects ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div>
                <span className="text-xs text-slate-200 block">Modo Econômico de Recursos</span>
                <span className="text-[11px] text-slate-400 block">Otimiza GPU para smartphones de entrada</span>
              </div>
              <button
                onClick={() => handleChange('lowPowerMode', !localSettings.lowPowerMode)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  localSettings.lowPowerMode ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                    localSettings.lowPowerMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Diagnóstico de Permissões */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-cyan-400" />
            Status de Permissões & Subsistemas
          </h3>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Mic className="w-3.5 h-3.5 text-cyan-400" /> Microfone
              </span>
              <span className="text-emerald-400 font-bold">ATIVO</span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Voz TTS
              </span>
              <span className="text-emerald-400 font-bold">ATIVO</span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-300">
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" /> Local Storage
              </span>
              <span className="text-emerald-400 font-bold">PERSISTIDO</span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Smartphone className="w-3.5 h-3.5 text-blue-400" /> Acessibilidade
              </span>
              <span className="text-cyan-400 font-bold">PRONTO APK</span>
            </div>
          </div>
        </div>

        {/* Section 5: Backup & Contingência */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
            <Download className="w-4 h-4 text-cyan-400" />
            Backup Local & Exportação de Dados
          </h3>
          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            Seus dados nunca saem do seu aparelho sem sua autorização. Gere um arquivo JSON com todas as memórias, missões e histórico.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExportData}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-mono flex items-center justify-center gap-2 transition-colors active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Backup</span>
            </button>

            <label className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono flex items-center justify-center gap-2 transition-colors active:scale-95 cursor-pointer text-center">
              <Upload className="w-3.5 h-3.5" />
              <span>Restaurar Backup</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>
          </div>

          {importStatus && (
            <p className="mt-2 text-xs font-mono text-cyan-300 text-center animate-pulse">
              {importStatus}
            </p>
          )}

          <div className="pt-3 mt-3 border-t border-slate-800/80 flex justify-end">
            <button
              onClick={() => {
                if (
                  window.confirm(
                    'ATENÇÃO: Deseja redefinir todo o banco de dados do J.A.R.V.I.S. para os valores padrão de fábrica?'
                  )
                ) {
                  audioSynthesizer.playWarning();
                  onResetAllData();
                }
              }}
              className="text-xs font-mono text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Redefinir Todos os Dados de Fábrica</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
