package com.kr.jarvis.core

import android.content.Context
import com.kr.jarvis.automation.AppLauncher
import com.kr.jarvis.automation.ScreenAnalyzer
import com.kr.jarvis.data.local.ChatMessageEntity
import com.kr.jarvis.data.local.MemoryEntity
import com.kr.jarvis.data.local.MissionEntity
import com.kr.jarvis.data.repository.JarvisRepository
import com.kr.jarvis.modules.content.ContentCreationModule
import com.kr.jarvis.modules.focus.FocusRoutineManager
import com.kr.jarvis.modules.krdigital.KrDigitalModule
import com.kr.jarvis.service.JarvisAccessibilityService
import java.text.SimpleDateFormat
import java.util.*

/**
 * JarvisBrain
 * 
 * Núcleo Central de Orquestração, Raciocínio, Risco e Execução de Ferramentas.
 * Opera de forma autônoma e determinística offline, ou orquestra chamadas na nuvem.
 */
class JarvisBrain(
    private val context: Context,
    private val repository: JarvisRepository
) {

    enum class RiskLevel {
        LOW,      // Ações reversíveis, consultas, geração de conteúdo, comandos locais
        MEDIUM,   // Modificação de configurações, criação de regras locais
        HIGH      // Envio de mensagens/e-mails externos, exclusão de dados, compras
    }

    data class ActionPlan(
        val intentName: String,
        val riskLevel: RiskLevel,
        val requiresConfirmation: Boolean,
        val confirmationPrompt: String? = null,
        val responseText: String,
        val executedTool: String? = null
    )

    /**
     * Processa a solicitação do usuário, avaliando intenção, memória e riscos.
     */
    suspend fun processRequest(
        input: String,
        userName: String = "KR",
        activeMemories: List<MemoryEntity> = emptyList(),
        activeMissions: List<MissionEntity> = emptyList()
    ): ActionPlan {
        val trimmed = input.trim()
        val lower = trimmed.lowercase(Locale.ROOT)

        // 1. GATILHOS DO MÓDULO KR DIGITAL
        if (lower.contains("analisa essa conversa") || lower.contains("analisar conversa") || lower.contains("cliente") || lower.contains("proposta comercial") || lower.contains("orçamento")) {
            val isProposal = lower.contains("proposta") || lower.contains("orçamento")
            if (isProposal) {
                val draft = KrDigitalModule.generateProposal(clientName = "Cliente KR Digital", projectType = "Site Institucional & Automação")
                return ActionPlan(
                    intentName = "KR_DIGITAL_PROPOSAL",
                    riskLevel = RiskLevel.LOW,
                    requiresConfirmation = false,
                    responseText = "Senhor $userName, gerei o rascunho de proposta para a KR Digital:\n\n${draft.formattedSummary}\n\nPosso detalhar algum dos itens de entrega?",
                    executedTool = "KrDigitalModule.generateProposal"
                )
            } else {
                val analysis = KrDigitalModule.analyzeConversation(trimmed)
                return ActionPlan(
                    intentName = "KR_DIGITAL_ANALYSIS",
                    riskLevel = RiskLevel.LOW,
                    requiresConfirmation = false,
                    responseText = "Análise comercial concluída para a KR Digital, Senhor $userName:\n" +
                            "• Estágio identificado: ${analysis.stage.displayName}\n" +
                            "• Necessidade explícita: ${analysis.explicitNeeds.firstOrNull() ?: "Não especificada"}\n" +
                            "• Sugestão de resposta profissional:\n\"${analysis.suggestedResponse}\"\n" +
                            "• Próximo passo sugerido: ${analysis.nextActionRecommendation}",
                    executedTool = "KrDigitalModule.analyzeConversation"
                )
            }
        }

        // 2. GATILHOS DO MÓDULO DE VÍDEOS E CRIAÇÃO DE CONTEÚDO
        if (lower.contains("ideia de vídeo") || lower.contains("roteiro") || lower.contains("gancho") || lower.contains("conteúdo") || lower.contains("tiktok") || lower.contains("reels") || lower.contains("youtube")) {
            val topic = trimmed.replace(Regex("^(?:jarvis\\s+)?(?:crie|faça|gere|me dê|uma)?\\s*(?:ideia de vídeo|roteiro(?: curto)?|ideias de conteúdo)\\s*(?:sobre|de)?\\s*", RegexOption.IGNORE_CASE), "").trim()
            val cleanTopic = if (topic.isNotEmpty()) topic else "produtividade e automação mobile"

            if (lower.contains("roteiro")) {
                val format = if (lower.contains("longo") || lower.contains("youtube")) ContentCreationModule.ContentFormat.YOUTUBE_LONG else ContentCreationModule.ContentFormat.SHORTS_REELS_TIKTOK
                val script = ContentCreationModule.generateScript(cleanTopic, format)
                return ActionPlan(
                    intentName = "CONTENT_SCRIPT_GENERATION",
                    riskLevel = RiskLevel.LOW,
                    requiresConfirmation = false,
                    responseText = "Roteiro estruturado para $cleanTopic (${script.format.displayName}):\n\n" +
                            "• Gancho principal: \"${script.hooks.firstOrNull() ?: ""}\"\n\n" +
                            "${script.scriptBody}\n\n" +
                            "• CTA: ${script.callToAction}\n" +
                            "• Ideia de Thumbnail: ${script.thumbnailIdea}",
                    executedTool = "ContentCreationModule.generateScript"
                )
            } else {
                val ideas = ContentCreationModule.brainstormIdeas(cleanTopic)
                val formattedIdeas = ideas.mapIndexed { idx, idea -> "${idx + 1}. ${idea.theme} (${idea.hookAngle})" }.joinToString("\n")
                return ActionPlan(
                    intentName = "CONTENT_BRAINSTORM",
                    riskLevel = RiskLevel.LOW,
                    requiresConfirmation = false,
                    responseText = "Senhor $userName, selecionei as seguintes ideias de alta retenção para '$cleanTopic':\n$formattedIdeas\n\nDeseja que eu redija o roteiro de alguma delas?",
                    executedTool = "ContentCreationModule.brainstormIdeas"
                )
            }
        }

        // 3. GATILHOS DO MÓDULO DE FOCO E ESTUDOS
        if (lower.contains("modo foco") || lower.contains("iniciar foco") || lower.contains("estudar") || lower.contains("pomodoro")) {
            FocusRoutineManager.startFocusSession(25, "Estudo & Deep Work")
            return ActionPlan(
                intentName = "FOCUS_START",
                riskLevel = RiskLevel.LOW,
                requiresConfirmation = false,
                responseText = "Modo Foco KR-OS ativado por 25 minutos. Apps de distração contidos. Atenção: Serviços de emergência e telefonia permanecem 100% acessíveis e desimpedidos por segurança.",
                executedTool = "FocusRoutineManager.startFocusSession"
            )
        }

        if (lower.contains("parar foco") || lower.contains("pausar foco") || lower.contains("encerrar foco")) {
            FocusRoutineManager.stopFocusSession()
            return ActionPlan(
                intentName = "FOCUS_STOP",
                riskLevel = RiskLevel.LOW,
                requiresConfirmation = false,
                responseText = "Modo Foco desativado, Senhor $userName. Sessão pausada e restrições liberadas.",
                executedTool = "FocusRoutineManager.stopFocusSession"
            )
        }

        // 4. VISÃO DA TELA (SOB DEMANDA AUTORIZADA)
        if (lower.contains("ler tela") || lower.contains("analisar tela") || lower.contains("o que está na tela")) {
            val screenResult = ScreenAnalyzer.inspectActiveScreen()
            return ActionPlan(
                intentName = "SCREEN_ANALYSIS",
                riskLevel = RiskLevel.LOW,
                requiresConfirmation = false,
                responseText = screenResult.summary,
                executedTool = "ScreenAnalyzer.inspectActiveScreen"
            )
        }

        // 5. AÇÕES DE ACESSIBILIDADE DO SISTEMA
        if (lower.contains("voltar tela") || lower == "voltar" || lower == "jarvis voltar") {
            val service = JarvisAccessibilityService.getInstance()
            return if (service != null) {
                val executed = service.executeGlobal(1) // GLOBAL_ACTION_BACK
                ActionPlan(
                    intentName = "GLOBAL_BACK",
                    riskLevel = RiskLevel.LOW,
                    requiresConfirmation = false,
                    responseText = if (executed) "Ação de voltar executada no Android." else "O sistema não aceitou o comando de voltar.",
                    executedTool = "JarvisAccessibilityService.executeGlobal"
                )
            } else {
                ActionPlan(
                    intentName = "GLOBAL_BACK",
                    riskLevel = RiskLevel.LOW,
                    requiresConfirmation = false,
                    responseText = "JarvisAccessibilityService não está ativo. Ative-o em Acessibilidade nas Configurações.",
                    executedTool = null
                )
            }
        }

        // 6. AÇÕES DE ALTO RISCO (EXIGEM CONFIRMAÇÃO DO USUÁRIO)
        if (lower.startsWith("enviar email") || lower.startsWith("mandar email") || lower.contains("enviar mensagem no whatsapp")) {
            return ActionPlan(
                intentName = "EXTERNAL_DISPATCH",
                riskLevel = RiskLevel.HIGH,
                requiresConfirmation = true,
                confirmationPrompt = "Esta ação enviará uma mensagem externa em seu nome. Deseja confirmar o envio de: \"$trimmed\"?",
                responseText = "Ação de alto risco identificada: Envio de mensagem externa. Aguardando sua confirmação explícita antes de disparar.",
                executedTool = null
            )
        }

        if (lower.contains("apagar tudo") || lower.contains("deletar memórias") || lower.contains("excluir histórico")) {
            return ActionPlan(
                intentName = "DATA_PURGE",
                riskLevel = RiskLevel.HIGH,
                requiresConfirmation = true,
                confirmationPrompt = "Você solicitou a exclusão permanente de dados locais. Confirma esta ação irreversível?",
                responseText = "Operação de exclusão permanente requer autorização. Por favor confirme.",
                executedTool = null
            )
        }

        // 7. COMANDOS DETERMINÍSTICOS OFFLINE BÁSICOS
        if (lower.contains("horas") || lower.contains("que horas")) {
            val nowStr = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())
            return ActionPlan(
                intentName = "OFFLINE_TIME",
                riskLevel = RiskLevel.LOW,
                requiresConfirmation = false,
                responseText = "São exatamente $nowStr, Senhor $userName.",
                executedTool = "OfflineClock"
            )
        }

        if (lower.contains("status") || lower.contains("diagnóstico")) {
            val pendingMissions = activeMissions.count { !it.completed }
            val totalMemories = activeMemories.size
            val accServiceRunning = JarvisAccessibilityService.isRunning
            val focusState = FocusRoutineManager.focusState.value
            return ActionPlan(
                intentName = "OFFLINE_STATUS",
                riskLevel = RiskLevel.LOW,
                requiresConfirmation = false,
                responseText = "Diagnóstico operacional do J.A.R.V.I.S.:\n" +
                        "• Núcleo Neural: Ativo e responsivo\n" +
                        "• Missões Pendentes: $pendingMissions de ${activeMissions.size}\n" +
                        "• Memórias Locais (Room): $totalMemories registros\n" +
                        "• Acessibilidade Android: ${if (accServiceRunning) "Conectado" else "Pendente em Configurações"}\n" +
                        "• Modo Foco: ${if (focusState.isFocusActive) "Ativo (${focusState.remainingSeconds / 60}m restantes)" else "Inativo"}\n" +
                        "• Proteção de Emergência: Ativa e garantida",
                executedTool = "OfflineDiagnostic"
            )
        }

        if (lower.startsWith("abrir ")) {
            val app = lower.removePrefix("abrir ").trim()
            val pkg = when {
                app.contains("whatsapp") -> "com.whatsapp"
                app.contains("youtube") -> "com.google.android.youtube"
                app.contains("spotify") -> "com.spotify.music"
                app.contains("mapas") || app.contains("maps") -> "com.google.android.apps.maps"
                app.contains("chrome") -> "com.android.chrome"
                app.contains("configurações") || app.contains("configuracoes") -> "com.android.settings"
                else -> null
            }
            if (pkg != null) {
                val res = AppLauncher.launchPackage(context, pkg)
                return ActionPlan(
                    intentName = "OFFLINE_LAUNCH_APP",
                    riskLevel = RiskLevel.LOW,
                    requiresConfirmation = false,
                    responseText = res.second,
                    executedTool = "AppLauncher.launchPackage"
                )
            }
        }

        if (lower.startsWith("lembre-se que ") || lower.startsWith("anote ")) {
            val noteContent = trimmed.replace(Regex("^(?:jarvis\\s+)?(?:lembre-se que|anote)\\s*", RegexOption.IGNORE_CASE), "").trim()
            val now = System.currentTimeMillis()
            repository.insertMemory(
                MemoryEntity("mem_$now", "Nota por Comando Vocal", noteContent, "nota", now, now)
            )
            return ActionPlan(
                intentName = "SAVE_MEMORY",
                riskLevel = RiskLevel.LOW,
                requiresConfirmation = false,
                responseText = "Afirmativo, Senhor $userName. Gravei na memória permanente do banco local: \"$noteContent\".",
                executedTool = "JarvisRepository.insertMemory"
            )
        }

        // Resposta padrão contextual
        return ActionPlan(
            intentName = "GENERAL_CONVERSATION",
            riskLevel = RiskLevel.LOW,
            requiresConfirmation = false,
            responseText = "Compreendido, Senhor $userName. Registrei sua solicitação: \"$trimmed\". Módulos especializados KR Digital, Criação de Conteúdo, Rotina de Foco e Automações estão à sua disposição.",
            executedTool = null
        )
    }
}
