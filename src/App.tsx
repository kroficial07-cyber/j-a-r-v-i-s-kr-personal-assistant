import React, { useState, useEffect, useCallback } from 'react';
import {
  ActiveTab,
  AssistantState,
  ChatMessage,
  MemoryItem,
  MissionTask,
  AutomationRule,
  AppSettings,
} from './types';
import { storageService } from './services/storageService';
import { speechEngine, SpeechState } from './services/speechService';
import { audioSynthesizer } from './services/audioService';
import { processJarvisCommand } from './services/jarvisBrain';

import { HomeScreen } from './components/HomeScreen';
import { ChatScreen } from './components/ChatScreen';
import { MissionsScreen } from './components/MissionsScreen';
import { MemoryScreen } from './components/MemoryScreen';
import { AutomationsScreen } from './components/AutomationsScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { KotlinSourceScreen } from './components/KotlinSourceScreen';

import {
  Home,
  MessageSquare,
  CheckSquare,
  Brain,
  Sliders,
  Settings,
  Code2,
  Smartphone,
  Maximize2,
  Volume2,
  VolumeX,
  AlertCircle,
  X,
  Download,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);

  // App data loaded from offline storage
  const [settings, setSettings] = useState<AppSettings>(() => storageService.getSettings());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => storageService.getChatMessages());
  const [memories, setMemories] = useState<MemoryItem[]>(() => storageService.getMemories());
  const [missions, setMissions] = useState<MissionTask[]>(() => {
    const { missions } = storageService.getMissions();
    return missions;
  });
  const [automations, setAutomations] = useState<AutomationRule[]>(() => storageService.getAutomations());

  // Frame toggle: Phone frame vs Fullscreen on desktop
  const [showDeviceFrame, setShowDeviceFrame] = useState<boolean>(false);

  const showToast = useCallback((message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  }, []);

  // Handle TTS Speaking
  const handleSpeakText = useCallback(
    async (text: string) => {
      try {
        setAssistantState('speaking');
        await speechEngine.speak(text, {
          rate: settings.voiceRate,
          pitch: settings.voicePitch,
          voiceName: settings.selectedVoiceName,
        });
        setAssistantState('idle');
      } catch (e) {
        console.warn('TTS error:', e);
        setAssistantState('idle');
      }
    },
    [settings]
  );

  // Process user command (vocal or typed)
  const handleProcessUserCommand = useCallback(
    async (text: string, isVoice = false) => {
      if (!text.trim()) return;

      const userMsg: ChatMessage = {
        id: `user_${Date.now()}`,
        text: text.trim(),
        sender: 'user',
        timestamp: Date.now(),
        isVoiceTriggered: isVoice,
      };

      const updatedChat = [...chatMessages, userMsg];
      setChatMessages(updatedChat);
      storageService.saveChatMessages(updatedChat);

      setAssistantState('processing');

      // Process command in Jarvis Brain
      setTimeout(async () => {
        const result = processJarvisCommand(text);

        const jarvisMsg: ChatMessage = {
          id: `jarvis_${Date.now()}`,
          text: result.replyText,
          sender: 'jarvis',
          timestamp: Date.now(),
        };

        const finalChat = [...updatedChat, jarvisMsg];
        setChatMessages(finalChat);
        storageService.saveChatMessages(finalChat);

        // Update state if mission or memory was modified by command
        if (result.updatedTasks) {
          setMissions(result.updatedTasks);
        }
        if (result.updatedMemories) {
          setMemories(result.updatedMemories);
        }

        // Play feedback
        audioSynthesizer.playTap();

        // Speak response if autoSpeak is enabled or triggered by voice
        if (settings.autoSpeakResponses || isVoice) {
          await handleSpeakText(result.replyText);
        } else {
          setAssistantState('idle');
        }
      }, 400);
    },
    [chatMessages, settings, handleSpeakText]
  );

  // Initialize Speech Engine callbacks
  useEffect(() => {
    speechEngine.registerCallbacks({
      onTranscript: (transcript, isFinal) => {
        setInterimTranscript(transcript);
        if (isFinal) {
          setInterimTranscript('');
          handleProcessUserCommand(transcript, true);
        }
      },
      onStateChange: (state: SpeechState) => {
        setAssistantState(state);
      },
      onError: (errMsg) => {
        showToast(errMsg, 'error');
        setAssistantState('idle');
      },
    });

    audioSynthesizer.setSoundEnabled(settings.soundEffects);

    // Check daily mission auto-renewal
    const { renewed } = storageService.getMissions();
    if (renewed) {
      showToast('Ciclo diário de missões renovado para o dia de hoje, Senhor KR.', 'success');
    }
  }, [handleProcessUserCommand, settings.soundEffects, showToast]);

  // Toggle voice recognition
  const handleToggleVoice = () => {
    if (assistantState === 'listening') {
      speechEngine.stopListening();
      setAssistantState('idle');
    } else {
      audioSynthesizer.playActivation();
      const started = speechEngine.startListening();
      if (!started) {
        showToast('Clique no ícone de chat para digitar seu comando.', 'info');
      }
    }
  };

  // Missions handlers
  const handleToggleTaskComplete = (id: string) => {
    const updated = missions.map((m) => {
      if (m.id === id) {
        const nextState = !m.completed;
        return {
          ...m,
          completed: nextState,
          completedAt: nextState ? Date.now() : undefined,
        };
      }
      return m;
    });
    setMissions(updated);
    storageService.saveMissions(updated);
  };

  const handleAddTask = (newTaskData: Omit<MissionTask, 'id' | 'createdAt' | 'completed'>) => {
    const newTask: MissionTask = {
      ...newTaskData,
      id: `task_${Date.now()}`,
      createdAt: Date.now(),
      completed: false,
    };
    const updated = [newTask, ...missions];
    setMissions(updated);
    storageService.saveMissions(updated);
    showToast('Nova missão registrada com sucesso!', 'success');
  };

  const handleDeleteTask = (id: string) => {
    const updated = missions.filter((m) => m.id !== id);
    setMissions(updated);
    storageService.saveMissions(updated);
  };

  const handleRenewDailyMissions = () => {
    const updated = missions.map((m) => {
      if (m.isDaily) {
        return { ...m, completed: false, completedAt: undefined };
      }
      return m;
    });
    setMissions(updated);
    storageService.saveMissions(updated);
    audioSynthesizer.playSuccess();
    showToast('Missões diárias renovadas com sucesso!', 'success');
    if (settings.autoSpeakResponses) {
      handleSpeakText('Protocolo diário renovado. Todas as missões do dia estão prontas para execução.');
    }
  };

  // Memory handlers
  const handleAddMemory = (item: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newMem: MemoryItem = {
      ...item,
      id: `mem_${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [newMem, ...memories];
    setMemories(updated);
    storageService.saveMemories(updated);
    showToast('Registro gravado na memória permanente!', 'success');
  };

  const handleUpdateMemory = (id: string, updates: Partial<MemoryItem>) => {
    const updated = memories.map((m) => (m.id === id ? { ...m, ...updates } : m));
    setMemories(updated);
    storageService.saveMemories(updated);
    showToast('Memória atualizada!', 'success');
  };

  const handleDeleteMemory = (id: string) => {
    const updated = memories.filter((m) => m.id !== id);
    setMemories(updated);
    storageService.saveMemories(updated);
    showToast('Memória excluída do arquivo local.', 'info');
  };

  // Automations handlers
  const handleToggleAutomation = (id: string) => {
    const updated = automations.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a));
    setAutomations(updated);
    storageService.saveAutomations(updated);
  };

  const handleTestAutomation = (rule: AutomationRule) => {
    if (rule.actionType === 'relatorio_matinal') {
      handleProcessUserCommand('relatório matinal');
    } else if (rule.actionType === 'alerta_voz') {
      handleSpeakText('Alerta de automação do J.A.R.V.I.S. acionado.');
    } else if (rule.actionType === 'modo_baixo_consumo') {
      const updated = { ...settings, lowPowerMode: !settings.lowPowerMode };
      setSettings(updated);
      storageService.saveSettings(updated);
      showToast(`Modo econômico ${updated.lowPowerMode ? 'ativado' : 'desativado'}.`, 'info');
    }
  };

  // Settings handlers
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
  };

  const handleResetAllData = () => {
    storageService.resetToDefaults();
    setSettings(storageService.getSettings());
    setChatMessages(storageService.getChatMessages());
    setMemories(storageService.getMemories());
    setMissions(storageService.getMissions().missions);
    setAutomations(storageService.getAutomations());
    showToast('Sistema redefinido para as configurações originais.', 'info');
  };

  // Navigation tabs config (touch-ergonomic, >=44px touch target)
  const navItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'chat', label: 'Conversa', icon: MessageSquare },
    { id: 'missions', label: 'Missões', icon: CheckSquare },
    { id: 'memory', label: 'Memória', icon: Brain },
    { id: 'automations', label: 'Automação', icon: Sliders },
    { id: 'settings', label: 'Config', icon: Settings },
    { id: 'kotlin_source', label: 'Kotlin', icon: Code2 },
  ];

  // Inner content rendered for active tab
  const renderScreenContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            userName={settings.userName}
            assistantState={assistantState}
            onToggleVoice={handleToggleVoice}
            onQuickCommand={(cmd) => handleProcessUserCommand(cmd, false)}
            missions={missions}
            memoryCount={memories.length}
            lowPowerMode={settings.lowPowerMode}
            onNavigateToTab={setActiveTab}
          />
        );
      case 'chat':
        return (
          <ChatScreen
            messages={chatMessages}
            assistantState={assistantState}
            interimTranscript={interimTranscript}
            onSendMessage={(msg) => handleProcessUserCommand(msg, false)}
            onToggleVoice={handleToggleVoice}
            onSpeakText={handleSpeakText}
            onClearHistory={() => {
              storageService.clearChatMessages();
              setChatMessages([]);
              showToast('Histórico apagado.', 'info');
            }}
          />
        );
      case 'missions':
        return (
          <MissionsScreen
            missions={missions}
            onToggleComplete={handleToggleTaskComplete}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onRenewDailyMissions={handleRenewDailyMissions}
          />
        );
      case 'memory':
        return (
          <MemoryScreen
            memories={memories}
            onAddMemory={handleAddMemory}
            onUpdateMemory={handleUpdateMemory}
            onDeleteMemory={handleDeleteMemory}
          />
        );
      case 'automations':
        return (
          <AutomationsScreen
            automations={automations}
            onToggleAutomation={handleToggleAutomation}
            onTestAutomation={handleTestAutomation}
            onNavigateToKotlinSource={() => setActiveTab('kotlin_source')}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onResetAllData={handleResetAllData}
          />
        );
      case 'kotlin_source':
        return <KotlinSourceScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col items-center justify-center cyber-grid selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Desktop Controls Bar */}
      <div className="w-full bg-slate-950/80 border-b border-slate-900 px-4 py-2 hidden md:flex items-center justify-between text-xs font-mono text-slate-400 z-30">
        <div className="flex items-center gap-3">
          <span className="text-cyan-400 font-bold tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
            J.A.R.V.I.S. — KR PERSONAL ASSISTANT
          </span>
          <span className="text-slate-600">|</span>
          <span>ARQUITETURA ANDROID JETPACK COMPOSE & WEB ENGINE</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Download Android Project ZIP */}
          <a
            href="/jarvis-kr-android-project.zip"
            download="jarvis-kr-android-project.zip"
            onClick={() => audioSynthesizer.playSuccess()}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 hover:text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Baixar Projeto Android (.ZIP)</span>
          </a>

          {/* Sound Mute Toggle */}
          <button
            onClick={() => {
              const updated = { ...settings, soundEffects: !settings.soundEffects };
              handleUpdateSettings(updated);
              audioSynthesizer.setSoundEnabled(updated.soundEffects);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            {settings.soundEffects ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sons ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                <span>Sons OFF</span>
              </>
            )}
          </button>

          {/* Toggle Device Frame */}
          <button
            onClick={() => setShowDeviceFrame(!showDeviceFrame)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white transition-colors"
          >
            {showDeviceFrame ? (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Modo Tela Cheia</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5" />
                <span>Modo Moldura Android</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Container: optionally enclosed in Android Phone Chassis if toggled */}
      <div
        className={`w-full flex-1 flex flex-col transition-all duration-300 ${
          showDeviceFrame
            ? 'max-w-[420px] my-6 h-[860px] max-h-[92vh] rounded-[48px] border-[8px] border-slate-800 bg-[#030712] shadow-2xl relative overflow-hidden ring-1 ring-cyan-500/30'
            : 'max-w-4xl min-h-screen'
        }`}
      >
        {/* Android Punch Hole & Status Bar if in Device Frame */}
        {showDeviceFrame && (
          <div className="h-7 bg-slate-950/90 flex items-center justify-between px-6 select-none shrink-0 border-b border-slate-900">
            <span className="text-[11px] font-mono text-slate-400">
              {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {/* Camera Punch hole */}
            <div className="w-3.5 h-3.5 rounded-full bg-black border border-slate-800" />
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400">
              <span>5G</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Dynamic Toast / Notification Banner */}
        {notification && (
          <div
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm px-4 py-2.5 rounded-xl text-xs font-mono shadow-2xl flex items-center gap-2 border animate-fade-in ${
              notification.type === 'error'
                ? 'bg-red-950/95 border-red-500/50 text-red-200'
                : notification.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
                : 'bg-cyan-950/95 border-cyan-500/50 text-cyan-200'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="p-0.5 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto relative flex flex-col">{renderScreenContent()}</main>

        {/* Android Bottom Navigation Tab Bar (Strictly Touch ergonomic, >=44px) */}
        <nav
          aria-label="Navegação Principal do JARVIS"
          className={`${
            showDeviceFrame ? 'absolute bottom-0 left-0 right-0' : 'fixed bottom-0 left-0 right-0'
          } z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 pb-safe`}
        >
          <div className="max-w-2xl mx-auto flex items-center justify-around h-16 px-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    audioSynthesizer.playTap();
                    setActiveTab(item.id);
                  }}
                  className={`flex-1 min-h-[44px] flex flex-col items-center justify-center py-1 transition-colors relative select-none active:scale-95 ${
                    isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  <span className={`text-[10px] font-mono mt-1 ${isActive ? 'font-bold' : 'font-normal'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 absolute bottom-1 shadow-sm shadow-cyan-400" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
