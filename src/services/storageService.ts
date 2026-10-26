import {
  ChatMessage,
  MemoryItem,
  MissionTask,
  AutomationRule,
  AppSettings,
} from '../types';

const STORAGE_KEYS = {
  CHAT: 'jarvis_kr_chat_messages_v1',
  MEMORY: 'jarvis_kr_memory_items_v1',
  MISSIONS: 'jarvis_kr_missions_v1',
  AUTOMATIONS: 'jarvis_kr_automations_v1',
  SETTINGS: 'jarvis_kr_settings_v1',
};

const DEFAULT_SETTINGS: AppSettings = {
  userName: 'KR',
  voicePitch: 0.95,
  voiceRate: 1.05,
  selectedVoiceName: '',
  soundEffects: true,
  hapticFeedback: true,
  autoSpeakResponses: true,
  lowPowerMode: false,
  recoveryEmail: 'kr.oficial.07@gmail.com',
  securityPin: '0707',
  themeStyle: 'cyan_neon',
  lastMissionsRenewalDate: '',
};

const INITIAL_MEMORIES: MemoryItem[] = [
  {
    id: 'mem_1',
    title: 'Identidade do Usuário',
    content: 'O usuário mestre se chama KR. Tratamento preferencial: Senhor KR ou Comandante KR.',
    category: 'preferencia',
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: 'mem_2',
    title: 'Diretriz de Automação',
    content: 'O objetivo principal do projeto é a integração com Android Accessibility Service para comandos hands-free.',
    category: 'diretriz',
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
    updatedAt: Date.now() - 1000 * 60 * 60 * 12,
  },
  {
    id: 'mem_3',
    title: 'Preferência de Voz',
    content: 'Comunicação verbal em Português do Brasil com respostas diretas, precisas e objetivas.',
    category: 'preferencia',
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
    updatedAt: Date.now() - 1000 * 60 * 60 * 6,
  },
];

const INITIAL_MISSIONS: MissionTask[] = [
  {
    id: 'miss_1',
    title: 'Sincronizar Protocolo Diário',
    description: 'Revisar status do assistente e calibrar comandos de voz matinais.',
    category: 'foco',
    priority: 'alta',
    completed: true,
    completedAt: Date.now() - 1000 * 60 * 30,
    isDaily: true,
    createdAt: Date.now(),
  },
  {
    id: 'miss_2',
    title: 'Revisão das Metas de Produtividade',
    description: 'Definir as 3 metas primárias do dia no painel de missões.',
    category: 'foco',
    priority: 'alta',
    completed: false,
    isDaily: true,
    createdAt: Date.now(),
  },
  {
    id: 'miss_3',
    title: 'Pausa para Hidratação e Foco',
    description: 'Ingerir água e alongamento para manter foco neural.',
    category: 'saude',
    priority: 'media',
    completed: false,
    isDaily: true,
    createdAt: Date.now(),
  },
  {
    id: 'miss_4',
    title: 'Estudo de Arquitetura Android Compose',
    description: 'Explorar integração entre StateFlow, Room e AccessibilityService.',
    category: 'estudo',
    priority: 'media',
    completed: false,
    isDaily: false,
    createdAt: Date.now(),
  },
  {
    id: 'miss_5',
    title: 'Backup Local de Memórias',
    description: 'Exportar arquivo de contingência com notas e configurações.',
    category: 'sistema',
    priority: 'baixa',
    completed: false,
    isDaily: true,
    createdAt: Date.now(),
  },
];

const INITIAL_AUTOMATIONS: AutomationRule[] = [
  {
    id: 'auto_1',
    name: 'Briefing Matinal por Voz',
    description: 'Ao ouvir "Jarvis, relatório matinal", lê as tarefas pendentes e status.',
    triggerType: 'palavra_chave_voz',
    triggerDetails: 'jarvis relatório matinal',
    actionType: 'relatorio_matinal',
    actionDetails: 'Voz sintética anuncia tarefas diárias e hora atual',
    enabled: true,
    requiresAccessibilityService: false,
    nativeStatus: 'disponivel_web',
  },
  {
    id: 'auto_2',
    name: 'Modo Econômico com Pouca Bateria',
    description: 'Desativa animações pesadas e reduz brilho quando a bateria for menor que 20%.',
    triggerType: 'nivel_bateria',
    triggerDetails: 'bateria <= 20%',
    actionType: 'modo_baixo_consumo',
    actionDetails: 'Ativa modo low-power do núcleo neural',
    enabled: true,
    requiresAccessibilityService: false,
    nativeStatus: 'disponivel_web',
  },
  {
    id: 'auto_3',
    name: 'Ponte Accessibility Service (Android Nativo)',
    description: 'Permite que o JARVIS interaja com botões e notificações do Android quando empacotado no APK.',
    triggerType: 'palavra_chave_voz',
    triggerDetails: 'Comandos globais do sistema Android',
    actionType: 'executar_fluxo_acessibilidade',
    actionDetails: 'Comunicação via JarvisAccessibilityService.kt',
    enabled: false,
    requiresAccessibilityService: true,
    nativeStatus: 'preparado_accessibility_service',
  },
  {
    id: 'auto_4',
    name: 'Alerta de Desbloqueio e Boas-Vindas',
    description: 'Emite saudação sonora rápida ao desbloquear o aparelho.',
    triggerType: 'desbloqueio_tela',
    triggerDetails: 'ACTION_USER_PRESENT (Android Intent)',
    actionType: 'alerta_voz',
    actionDetails: 'Chime de ativação curto',
    enabled: false,
    requiresAccessibilityService: true,
    nativeStatus: 'planejado_apk',
  },
];

const INITIAL_CHAT: ChatMessage[] = [
  {
    id: 'chat_init_1',
    text: 'Sistemas online. J.A.R.V.I.S. — KR Personal Assistant inicializado com sucesso. Como posso auxiliá-lo hoje, Senhor KR?',
    sender: 'jarvis',
    timestamp: Date.now() - 1000 * 60 * 5,
  },
];

export const storageService = {
  // SETTINGS
  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  },

  saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  },

  // CHAT
  getChatMessages(): ChatMessage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHAT);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // fallback
    }
    return INITIAL_CHAT;
  },

  saveChatMessages(messages: ChatMessage[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(messages));
    } catch {
      // ignore
    }
  },

  clearChatMessages(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.CHAT);
    } catch {
      // ignore
    }
  },

  // MEMORY
  getMemories(): MemoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEMORY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // fallback
    }
    return INITIAL_MEMORIES;
  },

  saveMemories(items: MemoryItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MEMORY, JSON.stringify(items));
    } catch {
      // ignore
    }
  },

  // MISSIONS & TASKS
  getMissions(): { missions: MissionTask[]; renewed: boolean } {
    const todayStr = new Date().toISOString().split('T')[0];
    const settings = this.getSettings();
    let missions: MissionTask[] = INITIAL_MISSIONS;

    try {
      const data = localStorage.getItem(STORAGE_KEYS.MISSIONS);
      if (data) {
        missions = JSON.parse(data);
      }
    } catch {
      missions = INITIAL_MISSIONS;
    }

    // Daily Mission Renewal Check
    let renewed = false;
    if (settings.lastMissionsRenewalDate !== todayStr) {
      missions = missions.map((m) => {
        if (m.isDaily) {
          return { ...m, completed: false, completedAt: undefined };
        }
        return m;
      });
      settings.lastMissionsRenewalDate = todayStr;
      this.saveSettings(settings);
      this.saveMissions(missions);
      renewed = true;
    }

    return { missions, renewed };
  },

  saveMissions(tasks: MissionTask[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(tasks));
    } catch {
      // ignore
    }
  },

  // AUTOMATIONS
  getAutomations(): AutomationRule[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTOMATIONS);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // fallback
    }
    return INITIAL_AUTOMATIONS;
  },

  saveAutomations(rules: AutomationRule[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTOMATIONS, JSON.stringify(rules));
    } catch {
      // ignore
    }
  },

  // EXPORT / IMPORT ALL
  exportAllData(): string {
    const backup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      chat: this.getChatMessages(),
      memories: this.getMemories(),
      missions: this.getMissions().missions,
      automations: this.getAutomations(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importAllData(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.settings) this.saveSettings(parsed.settings);
      if (parsed.chat) this.saveChatMessages(parsed.chat);
      if (parsed.memories) this.saveMemories(parsed.memories);
      if (parsed.missions) this.saveMissions(parsed.missions);
      if (parsed.automations) this.saveAutomations(parsed.automations);
      return true;
    } catch {
      return false;
    }
  },

  resetToDefaults(): void {
    localStorage.clear();
  },
};
