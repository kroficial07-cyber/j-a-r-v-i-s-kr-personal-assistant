import React, { useState, useEffect } from 'react';
import { AutomationRule } from '../types';
import { audioSynthesizer } from '../services/audioService';
import {
  automationRegistry,
  AccessibilityBridgeContract,
  ExecutionResult,
} from '../services/automation';
import {
  Layers,
  Zap,
  Play,
  Cpu,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Code2,
  Info,
  Terminal,
} from 'lucide-react';

interface AutomationsScreenProps {
  automations: AutomationRule[];
  onToggleAutomation: (id: string) => void;
  onTestAutomation: (rule: AutomationRule) => void;
  onNavigateToKotlinSource: () => void;
}

export const AutomationsScreen: React.FC<AutomationsScreenProps> = ({
  automations,
  onToggleAutomation,
  onTestAutomation,
  onNavigateToKotlinSource,
}) => {
  const [lastExecutionResult, setLastExecutionResult] = useState<ExecutionResult | null>(null);
  const isNativeBound = AccessibilityBridgeContract.isServiceBound();
  const currentEnv = AccessibilityBridgeContract.getExecutionEnvironment();

  useEffect(() => {
    // Listen to real dispatches from the automation engine
    const unsubscribe = automationRegistry.addExecutionListener((result) => {
      setLastExecutionResult(result);
    });
    return () => unsubscribe();
  }, []);

  const handleTestExecution = (rule: AutomationRule) => {
    audioSynthesizer.playTap();

    // Dispatches through the formal automation engine
    const result = automationRegistry.execute(
      rule.id === 'auto_1'
        ? 'auto_morning_report'
        : rule.id === 'auto_2'
        ? 'auto_battery_conservation'
        : rule.id === 'auto_3'
        ? 'auto_accessibility_back_button'
        : 'auto_accessibility_expand_notifications'
    );

    // Also trigger UI action handler
    onTestAutomation(rule);

    if (result.success) {
      audioSynthesizer.playSuccess();
    } else {
      audioSynthesizer.playWarning();
    }
  };

  return (
    <div className="flex flex-col min-h-full px-4 pt-3 pb-28 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
          <Layers className="w-3.5 h-3.5" />
          <span>SUBSISTEMA DE AUTOMAÇÃO // ARQUITETURA MODULAR</span>
        </div>
        <h2 className="text-lg font-bold text-white mt-0.5">Automações & Android Bridge</h2>
        <p className="text-xs text-slate-400 mt-1">
          Lógica desacoplada da UI para recepção de eventos e comandos de acessibilidade.
        </p>
      </div>

      {/* Runtime Environment Status Badge */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-white">AMBIENTE DE EXECUÇÃO DETECTADO</span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
            {currentEnv === 'android_webview' ? 'APK NATIVO ANDROID' : 'WEB CLIENT (STANDALONE)'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 block text-[10px]">PONTE DE ACESSIBILIDADE:</span>
            <span className={`font-bold ${isNativeBound ? 'text-emerald-400' : 'text-cyan-400'}`}>
              {isNativeBound ? 'CONECTADA' : 'CONTRATO PRONTO (APK)'}
            </span>
          </div>
          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 block text-[10px]">INTEGRIDADE:</span>
            <span className="text-emerald-400 font-bold">100% SEM SIMULAÇÃO</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed">
          <span className="text-cyan-300 font-semibold">Sem simulação falsa:</span> Automações de voz e lógica operam imediatamente. Ações que dependem do sistema operacional (como tocar na tela de outros aplicativos ou abrir notificações) informam transparentemente a necessidade da compilação do <code className="text-cyan-300 font-mono">JarvisAccessibilityService.kt</code> no APK.
        </p>

        <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between items-center">
          <span className="text-[11px] font-mono text-slate-400">Pacote Nativo: com.kr.jarvis</span>
          <button
            onClick={() => {
              audioSynthesizer.playTap();
              onNavigateToKotlinSource();
            }}
            className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Ver JarvisAccessibilityService.kt →</span>
          </button>
        </div>
      </div>

      {/* Execution Console Feedback */}
      {lastExecutionResult && (
        <div
          className={`p-3.5 rounded-xl border mb-4 text-xs font-mono flex items-start gap-2.5 ${
            lastExecutionResult.success
              ? 'bg-slate-950 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-950 border-cyan-500/40 text-cyan-200'
          }`}
        >
          <Terminal className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">
                [RETORNO DO BARRAMENTO] {lastExecutionResult.automationId}
              </span>
              <span className="text-[10px] text-slate-400">
                {new Date(lastExecutionResult.dispatchedAt).toLocaleTimeString('pt-BR')}
              </span>
            </div>
            <p className="leading-relaxed">{lastExecutionResult.statusMessage}</p>
          </div>
          <button
            onClick={() => setLastExecutionResult(null)}
            className="text-slate-400 hover:text-white text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Automations List */}
      <div className="space-y-3">
        {automations.map((rule) => {
          return (
            <div
              key={rule.id}
              className={`bg-slate-900/90 border rounded-xl p-4 transition-all ${
                rule.enabled ? 'border-slate-800 hover:border-cyan-500/40' : 'border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{rule.name}</h3>
                    {rule.requiresAccessibilityService ? (
                      <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 px-2 py-0.5 rounded">
                        REQUER APK NATIVO
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 rounded">
                        ATIVO LOCALMENTE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{rule.description}</p>
                </div>

                {/* Toggle switch */}
                <button
                  onClick={() => {
                    audioSynthesizer.playTap();
                    onToggleAutomation(rule.id);
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
                    rule.enabled ? 'bg-cyan-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                      rule.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Technical trigger details */}
              <div className="grid grid-cols-2 gap-2 my-2.5 p-2 bg-slate-950/60 rounded-lg text-[11px] font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">TIPO DE GATILHO:</span>
                  <span className="text-cyan-300 truncate block">{rule.triggerDetails}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">AÇÃO VINCULADA:</span>
                  <span className="text-slate-200 truncate block">{rule.actionDetails}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-1.5">
                  {rule.requiresAccessibilityService ? (
                    <span className="text-cyan-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Aguardando compilação do serviço nativo
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Executável de forma autônoma
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleTestExecution(rule)}
                  className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-xs transition-colors active:scale-95"
                >
                  <Play className="w-3 h-3" />
                  <span>Testar Gatilho</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
