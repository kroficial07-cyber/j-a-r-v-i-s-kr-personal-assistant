package com.kr.jarvis.service

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class JarvisAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "JarvisAccessibility"

        @Volatile
        private var INSTANCE: JarvisAccessibilityService? = null

        val isRunning: Boolean
            get() = INSTANCE != null

        fun getInstance(): JarvisAccessibilityService? = INSTANCE

        /** Abre as configurações de acessibilidade do Android para o usuário autorizar explicitamente */
        fun openAccessibilitySettings(context: Context) {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        INSTANCE = this

        val info = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED or
                    AccessibilityEvent.TYPE_VIEW_CLICKED or
                    AccessibilityEvent.TYPE_NOTIFICATION_STATE_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS or
                    AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
            notificationTimeout = 100
        }
        serviceInfo = info
        Log.i(TAG, "JarvisAccessibilityService conectado com sucesso pelo usuário.")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        val packageName = event.packageName?.toString() ?: ""
        // Interceptação segura e contextual: não armazena nem envia dados sensíveis
        Log.d(TAG, "Evento de acessibilidade em: $packageName (Tipo: ${event.eventType})")
    }

    override fun onInterrupt() {
        Log.w(TAG, "JarvisAccessibilityService interrompido.")
    }

    override fun onDestroy() {
        super.onDestroy()
        INSTANCE = null
    }

    /** Executa clique em nó da interface por View ID */
    fun clickByViewId(viewId: String): Boolean {
        val root = rootInActiveWindow ?: return false
        val nodes = root.findAccessibilityNodeInfosByViewId(viewId)
        if (nodes.isNullOrEmpty()) return false
        val target = nodes[0]
        val result = target.performAction(AccessibilityNodeInfo.ACTION_CLICK)
        target.recycle()
        return result
    }

    /** Executa clique em botão/elemento contendo determinado texto */
    fun clickByText(text: String): Boolean {
        val root = rootInActiveWindow ?: return false
        val nodes = root.findAccessibilityNodeInfosByText(text)
        if (nodes.isNullOrEmpty()) return false
        val target = nodes[0]
        val result = target.performAction(AccessibilityNodeInfo.ACTION_CLICK)
        target.recycle()
        return result
    }

    /** Executa ação global do sistema (ex: voltar, home, notificações) */
    fun executeGlobal(actionCode: Int): Boolean {
        return performGlobalAction(actionCode)
    }
}
