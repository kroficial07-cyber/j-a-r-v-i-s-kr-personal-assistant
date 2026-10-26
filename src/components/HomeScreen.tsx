import React, { useState, useEffect } from 'react';
import { AssistantState, MissionTask } from '../types';
import { NeuralCore } from './NeuralCore';
import { audioSynthesizer } from '../services/audioService';
import {
  Mic,
  MicOff,
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  Sparkles,
  Zap,
} from 'lucide-react';

interface HomeScreenProps {
  userName: string;
  assistantState: AssistantState;
  onToggleVoice: () => void;
  onQuickCommand: (command: string) => void;
  missions: MissionTask[];
  memoryCount: number;
  lowPowerMode: boolean;
  onNavigateToTab: (tab: any) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  userName,
  assistantState,
  onToggleVoice,
  onQuickCommand,
  missions,
  memoryCount,
  lowPowerMode,
  onNavigateToTab,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [greeting, setGreeting] = useState<string>('BOM DIA');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setCurrentDate(
        now.toLocaleDateString('pt-BR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
        }).toUpperCase()
      );

      const hours = now.getHours();
      if (hours >= 5 && hours < 12) setGreeting('BOM DIA');
      else if (hours >= 12 && hours < 18) setGreeting('BOA TARDE');
      else setGreeting('BOA NOITE');
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const completedMissions = missions.filter((m) => m.completed).length;
  const totalMissions = missions.length;
  const completionPercent = totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0;

  const quickPrompts = [
    'Status do sistema',
    'Relatório matinal',
    'Que dia é hoje',
    'Quem sou eu',
    'Ajuda',
  ];

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-24 max-w-2xl mx-auto w-full">
      {/* Top HUD Bar */}
      <header className="flex items-center justify-between border-b border-cyan-950/80 pb-3 mb-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Cpu className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span className="tracking-wider">J.A.R.V.I.S. // KR-OS v1.0</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white mt-0.5">
            {greeting}, SENHOR {userName}
          </h1>
        </div>

        {/* HUD Clock */}
        <div className="text-right font-mono">
          <div className="text-base font-bold text-cyan-300 tracking-wider flex items-center justify-end gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-500" />
            <span>{currentTime || '--:--:--'}</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-end gap-1">
            <Calendar className="w-3 h-3 text-slate-500" />
            <span>{currentDate || '---'}</span>
          </div>
        </div>
      </header>

      {/* Center Neural Core Section */}
      <section className="flex-1 flex flex-col items-center justify-center my-4 relative">
        {/* Subtle holographic ambient ring backdrop */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 rounded-full border border-cyan-500/10 animate-ping opacity-25" />
          <div className="w-80 h-80 rounded-full border border-blue-500/10 animate-pulse opacity-20" />
        </div>

        <NeuralCore
          state={assistantState}
          onClick={onToggleVoice}
          size={250}
          lowPowerMode={lowPowerMode}
        />

        {/* Central Voice Activation Button */}
        <div className="mt-6 flex flex-col items-center">
          <button
            onClick={() => {
              audioSynthesizer.playTap();
              onToggleVoice();
            }}
            className={`flex items-center gap-3 px-6 py-3.5 rounded-full font-mono text-sm font-semibold tracking-wide transition-all shadow-lg active:scale-95 ${
              assistantState === 'listening'
                ? 'bg-cyan-500 text-slate-950 glow-cyan ring-4 ring-cyan-400/30'
                : 'bg-slate-900/90 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 hover:bg-slate-800'
            }`}
          >
            {assistantState === 'listening' ? (
              <>
                <MicOff className="w-5 h-5 text-slate-950 animate-pulse" />
                <span>CANCELAR ESCUTA</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 text-cyan-400" />
                <span>ATIVAR VOZ (PT-BR)</span>
              </>
            )}
          </button>
          <span className="text-[11px] text-slate-400 font-mono mt-2 tracking-tight">
            Toque no microfone ou no núcleo para falar
          </span>
        </div>
      </section>

      {/* System Metrics Overview */}
      <section className="grid grid-cols-2 gap-3 my-4">
        {/* Missions card */}
        <div
          onClick={() => {
            audioSynthesizer.playTap();
            onNavigateToTab('missions');
          }}
          className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-3.5 cursor-pointer transition-all active:scale-[0.98]"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-1">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              MISSÕES DO DIA
            </span>
            <span className="text-cyan-300 font-bold">{completionPercent}%</span>
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            {completedMissions} <span className="text-xs text-slate-400 font-normal">de {totalMissions} feitas</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        {/* Memory card */}
        <div
          onClick={() => {
            audioSynthesizer.playTap();
            onNavigateToTab('memory');
          }}
          className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-3.5 cursor-pointer transition-all active:scale-[0.98]"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              MEMÓRIA LOCAL
            </span>
            <span className="text-blue-300 font-bold">OFFLINE</span>
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            {memoryCount} <span className="text-xs text-slate-400 font-normal">registros salvos</span>
          </div>
          <div className="text-[11px] text-slate-400 truncate mt-1">
            Preferências & notas do KR
          </div>
        </div>
      </section>

      {/* Quick Voice Command Chips */}
      <section className="mt-2">
        <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          Comandos Rápidos
        </div>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((cmd) => (
            <button
              key={cmd}
              onClick={() => {
                audioSynthesizer.playTap();
                onQuickCommand(cmd);
              }}
              className="px-3 py-1.5 bg-slate-900/70 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 rounded-lg text-xs font-mono text-slate-300 hover:text-cyan-300 transition-colors active:scale-95 text-left"
            >
              {cmd}
            </button>
          ))}
        </div>
      </section>

      {/* Status Bar */}
      <footer className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>MOTOR NEURAL ATIVO</span>
        </div>
        <div className="text-slate-400">
          PT-BR // ANDROID COMPATÍVEL
        </div>
      </footer>
    </div>
  );
};
