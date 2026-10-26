/**
 * J.A.R.V.I.S. Automation Registry and Dispatcher
 * 
 * Manages automation lifecycle, evaluates triggers against runtime environments,
 * and delegates actions either to internal handlers or the native Accessibility Bridge.
 */

import {
  AutomationDefinition,
  ExecutionResult,
} from './AutomationTypes';
import { AccessibilityBridgeContract } from './AccessibilityBridgeContract';

export class AutomationRegistry {
  private automations: Map<string, AutomationDefinition> = new Map();
  private executionListeners: ((result: ExecutionResult) => void)[] = [];

  constructor() {
    this.seedDefaultAutomations();
  }

  private seedDefaultAutomations() {
    const defaultRules: AutomationDefinition[] = [
      {
        id: 'auto_morning_report',
        name: 'Relatório Matinal por Comando Vocal',
        description: 'Dispara síntese de voz com resumo das tarefas do dia ao ouvir "Jarvis, relatório matinal".',
        trigger: {
          source: 'VOICE_COMMAND',
          filter: {
            keywordPattern: 'relatório matinal',
          },
        },
        action: {
          target: 'INTERNAL_SYNTHESIS',
          payload: {
            ttsPrompt: 'Iniciando briefing de missões diárias.',
            internalActionId: 'read_daily_missions',
          },
        },
        enabled: true,
        requiresAccessibilityService: false,
        minAndroidSdk: 21,
        createdAt: Date.now(),
      },
      {
        id: 'auto_battery_conservation',
        name: 'Protocolo de Baixo Consumo de Bateria',
        description: 'Reduz taxa de atualização do núcleo neural e desativa efeitos pesados abaixo de 20%.',
        trigger: {
          source: 'BATTERY_TELEMETRY',
          filter: {
            batteryPercentThreshold: 20,
          },
        },
        action: {
          target: 'INTERNAL_SYNTHESIS',
          payload: {
            internalActionId: 'enable_low_power_mode',
          },
        },
        enabled: true,
        requiresAccessibilityService: false,
        minAndroidSdk: 21,
        createdAt: Date.now(),
      },
      {
        id: 'auto_accessibility_back_button',
        name: 'Gesto Acessibilidade: Botão Voltar do Android',
        description: 'Dispara GLOBAL_ACTION_BACK no Android OS através do AccessibilityService nativo.',
        trigger: {
          source: 'VOICE_COMMAND',
          filter: {
            keywordPattern: 'voltar tela',
          },
        },
        action: {
          target: 'SYSTEM_GLOBAL_ACTION',
          payload: {
            globalActionCode: 1, // GLOBAL_ACTION_BACK
          },
        },
        enabled: false,
        requiresAccessibilityService: true,
        minAndroidSdk: 26,
        createdAt: Date.now(),
      },
      {
        id: 'auto_accessibility_expand_notifications',
        name: 'Painel de Notificações do Android',
        description: 'Abre a barra de notificações do Android via JarvisAccessibilityService.',
        trigger: {
          source: 'VOICE_COMMAND',
          filter: {
            keywordPattern: 'abrir notificações',
          },
        },
        action: {
          target: 'SYSTEM_GLOBAL_ACTION',
          payload: {
            globalActionCode: 4, // GLOBAL_ACTION_NOTIFICATIONS
          },
        },
        enabled: false,
        requiresAccessibilityService: true,
        minAndroidSdk: 26,
        createdAt: Date.now(),
      },
    ];

    defaultRules.forEach((rule) => this.automations.set(rule.id, rule));
  }

  public getAll(): AutomationDefinition[] {
    return Array.from(this.automations.values());
  }

  public register(rule: AutomationDefinition): void {
    this.automations.set(rule.id, rule);
  }

  public toggleRule(id: string, enabled: boolean): boolean {
    const existing = this.automations.get(id);
    if (!existing) return false;
    existing.enabled = enabled;
    this.automations.set(id, existing);
    return true;
  }

  public addExecutionListener(listener: (result: ExecutionResult) => void): () => void {
    this.executionListeners.push(listener);
    return () => {
      this.executionListeners = this.executionListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Executes an automation rule safely based on current runtime capabilities.
   */
  public execute(id: string): ExecutionResult {
    const rule = this.automations.get(id);
    if (!rule) {
      const errorResult: ExecutionResult = {
        automationId: id,
        success: false,
        dispatchedAt: Date.now(),
        environment: AccessibilityBridgeContract.getExecutionEnvironment(),
        statusMessage: `Automação "${id}" não encontrada no registro.`,
      };
      this.notifyListeners(errorResult);
      return errorResult;
    }

    let result: ExecutionResult;

    // Route based on action target
    switch (rule.action.target) {
      case 'SYSTEM_GLOBAL_ACTION': {
        const code = rule.action.payload.globalActionCode || 1;
        result = AccessibilityBridgeContract.executeGlobalAction(code, rule.id);
        break;
      }

      case 'ACCESSIBILITY_INTERACTION': {
        const viewId = rule.action.payload.clickByViewId || '';
        result = AccessibilityBridgeContract.executeViewClick(viewId, rule.id);
        break;
      }

      case 'INTERNAL_SYNTHESIS':
      default: {
        result = {
          automationId: rule.id,
          success: true,
          dispatchedAt: Date.now(),
          environment: 'browser_web',
          statusMessage: `Automação interna "${rule.name}" executada com sucesso.`,
        };
        break;
      }
    }

    this.notifyListeners(result);
    return result;
  }

  private notifyListeners(result: ExecutionResult) {
    this.executionListeners.forEach((listener) => {
      try {
        listener(result);
      } catch {
        // ignore
      }
    });
  }
}

export const automationRegistry = new AutomationRegistry();
