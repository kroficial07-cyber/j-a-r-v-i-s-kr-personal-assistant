export type AssistantState = 'idle' | 'listening' | 'processing' | 'speaking';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'jarvis' | 'system';
  timestamp: number;
  isVoiceTriggered?: boolean;
}

export type MemoryCategory = 'preferencia' | 'nota' | 'fato' | 'diretriz';

export interface MemoryItem {
  id: string;
  title: string;
  content: string;
  category: MemoryCategory;
  createdAt: number;
  updatedAt: number;
}

export type MissionPriority = 'baixa' | 'media' | 'alta';
export type MissionCategory = 'foco' | 'saude' | 'estudo' | 'sistema';

export interface MissionTask {
  id: string;
  title: string;
  description: string;
  category: MissionCategory;
  priority: MissionPriority;
  completed: boolean;
  completedAt?: number;
  isDaily: boolean;
  createdAt: number;
}

export type AutomationTriggerType = 
  | 'palavra_chave_voz' 
  | 'nivel_bateria' 
  | 'horario_agendado' 
  | 'desbloqueio_tela'
  | 'gesto_movimento';

export type AutomationActionType = 
  | 'relatorio_matinal' 
  | 'modo_baixo_consumo' 
  | 'alerta_voz' 
  | 'executar_fluxo_acessibilidade' 
  | 'abrir_modulo_tarefas';

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  triggerType: AutomationTriggerType;
  triggerDetails: string;
  actionType: AutomationActionType;
  actionDetails: string;
  enabled: boolean;
  requiresAccessibilityService: boolean;
  nativeStatus: 'disponivel_web' | 'preparado_accessibility_service' | 'planejado_apk';
  lastTriggered?: number;
}

export interface AppSettings {
  userName: string;
  voicePitch: number;
  voiceRate: number;
  selectedVoiceName: string;
  soundEffects: boolean;
  hapticFeedback: boolean;
  autoSpeakResponses: boolean;
  lowPowerMode: boolean;
  recoveryEmail: string;
  securityPin: string;
  themeStyle: 'cyan_neon' | 'deep_blue' | 'stealth_dark';
  lastMissionsRenewalDate: string;
}

export type ActiveTab = 
  | 'home' 
  | 'chat' 
  | 'missions' 
  | 'drive' 
  | 'gmail' 
  | 'memory' 
  | 'automations' 
  | 'settings' 
  | 'kotlin_source';
