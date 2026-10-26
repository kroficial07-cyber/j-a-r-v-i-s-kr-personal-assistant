/**
 * J.A.R.V.I.S. Android Accessibility Service Bridge Contract
 * 
 * Formal interface specification for communication between J.A.R.V.I.S.
 * and the Android OS Accessibility Service.
 * 
 * Guarantees zero simulation: if the native bridge is not injected by the APK,
 * it returns explicit 'NOT_AVAILABLE_STANDALONE' status rather than fake success.
 */

import { ExecutionResult, ExecutionEnvironment } from './AutomationTypes';

export interface NativeAndroidBridge {
  isAccessibilityServiceEnabled(): boolean;
  clickByViewId(viewId: string): boolean;
  clickByText(text: string): boolean;
  performGlobalAction(actionCode: number): boolean;
  sendBroadcastIntent(action: string, extrasJson: string): boolean;
}

declare global {
  interface Window {
    AndroidAccessibilityBridge?: NativeAndroidBridge;
  }
}

export class AccessibilityBridgeContract {
  /**
   * Detects whether the current runtime environment is hosted inside the native Android APK
   * with the Accessibility Bridge injected into the Web view.
   */
  public static getExecutionEnvironment(): ExecutionEnvironment {
    if (typeof window !== 'undefined' && window.AndroidAccessibilityBridge) {
      return 'android_webview';
    }
    return 'browser_web';
  }

  /**
   * Checks if Android Accessibility Service is active on the operating system.
   */
  public static isServiceBound(): boolean {
    if (typeof window !== 'undefined' && window.AndroidAccessibilityBridge) {
      try {
        return window.AndroidAccessibilityBridge.isAccessibilityServiceEnabled();
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Dispatches a click to a specific Android View ID via the Accessibility Service.
   */
  public static executeViewClick(viewId: string, automationId: string): ExecutionResult {
    const env = this.getExecutionEnvironment();

    if (env === 'browser_web') {
      return {
        automationId,
        success: false,
        dispatchedAt: Date.now(),
        environment: 'browser_web',
        statusMessage:
          'Ação nativa retida: Esta automação exige nós do sistema operacional Android. Compile o APK fornecido com JarvisAccessibilityService para habilitar toques em nós do sistema.',
      };
    }

    try {
      const result = window.AndroidAccessibilityBridge?.clickByViewId(viewId) ?? false;
      return {
        automationId,
        success: result,
        dispatchedAt: Date.now(),
        environment: 'android_webview',
        statusMessage: result
          ? `Nó Android "${viewId}" acionado com sucesso pelo Accessibility Service.`
          : `Nó "${viewId}" não encontrado na janela ativa do dispositivo.`,
      };
    } catch (err: any) {
      return {
        automationId,
        success: false,
        dispatchedAt: Date.now(),
        environment: 'android_webview',
        statusMessage: `Falha na ponte nativa: ${err?.message || 'Erro de barramento'}`,
      };
    }
  }

  /**
   * Executes a system-level Global Action (e.g. Back, Home, Recents, Notifications).
   */
  public static executeGlobalAction(
    actionCode: 1 | 2 | 3 | 4,
    automationId: string
  ): ExecutionResult {
    const env = this.getExecutionEnvironment();

    if (env === 'browser_web') {
      const actionName =
        actionCode === 1
          ? 'GLOBAL_ACTION_BACK'
          : actionCode === 2
          ? 'GLOBAL_ACTION_HOME'
          : actionCode === 3
          ? 'GLOBAL_ACTION_RECENTS'
          : 'GLOBAL_ACTION_NOTIFICATIONS';

      return {
        automationId,
        success: false,
        dispatchedAt: Date.now(),
        environment: 'browser_web',
        statusMessage: `Gatilho preparado para Android: Ação ${actionName} registrada no contrato Kotlin. Pronto para disparo no APK nativo.`,
      };
    }

    try {
      const result = window.AndroidAccessibilityBridge?.performGlobalAction(actionCode) ?? false;
      return {
        automationId,
        success: result,
        dispatchedAt: Date.now(),
        environment: 'android_webview',
        statusMessage: result
          ? 'Ação global do Android executada.'
          : 'O sistema operacional recusou a ação de acessibilidade.',
      };
    } catch (err: any) {
      return {
        automationId,
        success: false,
        dispatchedAt: Date.now(),
        environment: 'android_webview',
        statusMessage: `Falha ao despachar ação global: ${err?.message}`,
      };
    }
  }
}
