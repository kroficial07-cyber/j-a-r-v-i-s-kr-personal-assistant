package com.kr.jarvis.service

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.text.TextUtils
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * JarvisAccessibilityService
 * 
 * Serviço de acessibilidade nativo do J.A.R.V.I.S. para o Android OS.
 * Projetado para interação segura e autorizada com a interface do sistema
 * e aplicativos parceiros, acionado SOMENTE após consentimento explícito
 * do usuário nas Configurações do Android.
 */
class JarvisAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "JarvisAccessibility"

        @Volatile
        private var instance: JarvisAccessibilityService? = null

        private val _isServiceActive = MutableStateFlow(false)
        val isServiceActive: StateFlow<Boolean> = _isServiceActive.asStateFlow()

        val isRunning: Boolean
            get() = instance != null

        fun getInstance(): JarvisAccessibilityService? = instance

        /**
         * Verifica se o usuário ativou explicitamente o serviço nas Configurações de Acessibilidade do Android.
         */
        fun isAccessibilityPermissionGranted(context: Context): Boolean {
            val expectedComponentName = ComponentName(context, JarvisAccessibilityService::class.java)
            val enabledServicesSetting = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: return false

            val colonSplitter = TextUtils.SimpleStringSplitter(':')
            colonSplitter.setString(enabledServicesSetting)

            while (colonSplitter.hasNext()) {
                val componentNameString = colonSplitter.next()
                val enabledComponent = ComponentName.unflattenFromString(componentNameString)
                if (enabledComponent != null && enabledComponent == expectedComponentName) {
                    return true
                }
            }
            return false
        }

        /**
         * Abre a tela oficial de Configurações de Acessibilidade do Android para o usuário ativar o serviço.
         */
        fun openAccessibilitySettings(context: Context) {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            context.startActivity(intent)
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        _isServiceActive.value = true

        val info = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED or
                    AccessibilityEvent.TYPE_VIEW_CLICKED or
                    AccessibilityEvent.TYPE_NOTIFICATION_STATE_CHANGED or
                    AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS or
                    AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS or
                    AccessibilityServiceInfo.FLAG_REQUEST_FILTER_KEY_EVENTS
            notificationTimeout = 100
        }
        serviceInfo = info
        Log.i(TAG, "J.A.R.V.I.S. Accessibility Service conectado com sucesso após autorização do usuário.")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        val packageName = event.packageName?.toString() ?: ""

        // Processamento seguro de eventos sem violação de privacidade
        when (event.eventType) {
            AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> {
                Log.d(TAG, "Janela alterada no pacote: $packageName (${event.className})")
            }
            AccessibilityEvent.TYPE_NOTIFICATION_STATE_CHANGED -> {
                Log.d(TAG, "Notificação detectada para automação no pacote: $packageName")
            }
        }
    }

    override fun onInterrupt() {
        Log.w(TAG, "J.A.R.V.I.S. Accessibility Service interrompido pelo sistema.")
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
        _isServiceActive.value = false
        Log.i(TAG, "J.A.R.V.I.S. Accessibility Service finalizado.")
    }

    // =========================================================================
    // BASE PARA INTERAÇÃO COM OUTROS APLICATIVOS (ACTIONS & QUERIES)
    // =========================================================================

    /**
     * Clica em um elemento de interface especificado pelo View ID (ex: "com.whatsapp:id/send").
     */
    fun clickByViewId(viewId: String): Boolean {
        val root = rootInActiveWindow ?: return false
        val nodes = root.findAccessibilityNodeInfosByViewId(viewId)
        if (nodes.isNullOrEmpty()) return false

        for (node in nodes) {
            if (performClickOnNodeOrParent(node)) {
                recycleNodes(nodes)
                return true
            }
        }
        recycleNodes(nodes)
        return false
    }

    /**
     * Clica em um elemento de interface com determinado texto visível.
     */
    fun clickByText(text: String, exactMatch: Boolean = false): Boolean {
        val root = rootInActiveWindow ?: return false
        val nodes = root.findAccessibilityNodeInfosByText(text)
        if (nodes.isNullOrEmpty()) return false

        for (node in nodes) {
            val nodeText = node.text?.toString() ?: ""
            val matches = if (exactMatch) nodeText.equals(text, ignoreCase = true) else nodeText.contains(text, ignoreCase = true)
            if (matches && performClickOnNodeOrParent(node)) {
                recycleNodes(nodes)
                return true
            }
        }
        recycleNodes(nodes)
        return false
    }

    /**
     * Insere texto em um campo de entrada (EditText) pelo View ID.
     */
    fun inputTextByViewId(viewId: String, text: String): Boolean {
        val root = rootInActiveWindow ?: return false
        val nodes = root.findAccessibilityNodeInfosByViewId(viewId)
        if (nodes.isNullOrEmpty()) return false

        val target = nodes[0]
        val arguments = Bundle().apply {
            putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text)
        }
        val result = target.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, arguments)
        recycleNodes(nodes)
        return result
    }

    /**
     * Executa ações globais do sistema Android (Voltar, Início, Recentes, Notificações).
     */
    fun executeGlobal(actionCode: Int): Boolean {
        return performGlobalAction(actionCode)
    }

    private fun performClickOnNodeOrParent(node: AccessibilityNodeInfo?): Boolean {
        var current = node
        while (current != null) {
            if (current.isClickable) {
                return current.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            }
            current = current.parent
        }
        return false
    }

    private fun recycleNodes(nodes: List<AccessibilityNodeInfo>) {
        for (node in nodes) {
            try {
                node.recycle()
            } catch (_: Exception) {}
        }
    }
}
