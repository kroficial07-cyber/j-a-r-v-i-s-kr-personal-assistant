package com.kr.jarvis.automation

import android.view.accessibility.AccessibilityNodeInfo
import com.kr.jarvis.service.JarvisAccessibilityService

/**
 * ScreenAnalyzer
 * 
 * Análise autorizada de elementos visíveis na tela ativa do Android via AccessibilityService.
 * Respeita integralmente a privacidade do usuário:
 * - NUNCA extrai campos marcados como senha (isPassword == true).
 * - Executa SOMENTE quando expressamente solicitado pelo usuário.
 * - Limita o tamanho de texto para evitar overhead de memória no Samsung Galaxy A11.
 */
object ScreenAnalyzer {

    data class ScreenInspectionResult(
        val isAvailable: Boolean,
        val appPackageName: String,
        val visibleTexts: List<String>,
        val interactiveButtons: List<String>,
        val summary: String
    )

    fun inspectActiveScreen(): ScreenInspectionResult {
        val service = JarvisAccessibilityService.getInstance()
        if (service == null) {
            return ScreenInspectionResult(
                isAvailable = false,
                appPackageName = "",
                visibleTexts = emptyList(),
                interactiveButtons = emptyList(),
                summary = "Serviço de acessibilidade do JARVIS não está ativo. Ative-o nas Configurações de Acessibilidade do Android para habilitar a visão de tela."
            )
        }

        val rootNode = service.rootInActiveWindow
        if (rootNode == null) {
            return ScreenInspectionResult(
                isAvailable = false,
                appPackageName = "",
                visibleTexts = emptyList(),
                interactiveButtons = emptyList(),
                summary = "Não foi possível acessar a janela ativa no momento (janela do sistema ou protegida por flag segura)."
            )
        }

        val visibleTexts = mutableListOf<String>()
        val interactiveButtons = mutableListOf<String>()
        val packageName = rootNode.packageName?.toString() ?: "app_desconhecido"

        try {
            traverseNode(rootNode, visibleTexts, interactiveButtons, depth = 0)
        } finally {
            try {
                rootNode.recycle()
            } catch (_: Exception) {}
        }

        val summary = if (visibleTexts.isEmpty() && interactiveButtons.isEmpty()) {
            "Tela ativa de '$packageName' inspecionada, porém nenhum texto acessível foi detectado."
        } else {
            "Tela de '$packageName' inspecionada com sucesso. Textos identificados: ${visibleTexts.take(4).joinToString("; ")}. Botões interativos: ${interactiveButtons.take(3).joinToString("; ")}."
        }

        return ScreenInspectionResult(
            isAvailable = true,
            appPackageName = packageName,
            visibleTexts = visibleTexts.take(30), // Limite prudente de memória para o Galaxy A11
            interactiveButtons = interactiveButtons.take(15),
            summary = summary
        )
    }

    private fun traverseNode(
        node: AccessibilityNodeInfo?,
        texts: MutableList<String>,
        buttons: MutableList<String>,
        depth: Int
    ) {
        if (node == null || depth > 20) return

        // REGRA DE PRIVACIDADE ABSOLUTA: Ignora qualquer campo de senha
        if (node.isPassword) return

        val text = node.text?.toString()?.trim() ?: ""
        val contentDesc = node.contentDescription?.toString()?.trim() ?: ""

        if (text.isNotBlank() && text.length > 1) {
            texts.add(text)
        } else if (contentDesc.isNotBlank() && contentDesc.length > 1) {
            texts.add(contentDesc)
        }

        if (node.isClickable && (text.isNotBlank() || contentDesc.isNotBlank())) {
            buttons.add(if (text.isNotBlank()) text else contentDesc)
        }

        val childCount = node.childCount
        for (i in 0 until childCount) {
            val child = node.getChild(i)
            if (child != null) {
                traverseNode(child, texts, buttons, depth + 1)
                try {
                    child.recycle()
                } catch (_: Exception) {}
            }
        }
    }
}
