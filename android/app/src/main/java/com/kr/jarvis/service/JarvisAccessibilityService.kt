package com.kr.jarvis.service

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * JarvisAccessibilityService
 * Subserviço de automação nativa desacoplado da interface.
 * Monitora eventos do sistema Android e executa toques/ações globais.
 */
class JarvisAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "JarvisAccessibility"
        var instance: JarvisAccessibilityService? = null
            private set

        fun isRunning(): Boolean = instance != null
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        val info = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED or
                    AccessibilityEvent.TYPE_VIEW_CLICKED or
                    AccessibilityEvent.TYPE_NOTIFICATION_STATE_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS or
                    AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
            notificationTimeout = 80
        }
        serviceInfo = info
        Log.i(TAG, "JarvisAccessibilityService conectado com sucesso.")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        val pkg = event.packageName?.toString() ?: ""
        // Roteamento seguro de eventos para automações cadastradas
        Log.d(TAG, "Evento interceptado no pacote: $pkg")
    }

    override fun onInterrupt() {
        Log.w(TAG, "JarvisAccessibilityService interrompido pelo usuário.")
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
    }

    /**
     * Executa toque em nó por View ID
     */
    fun performClick(viewId: String): Boolean {
        val root = rootInActiveWindow ?: return false
        val nodes = root.findAccessibilityNodeInfosByViewId(viewId)
        if (nodes.isNullOrEmpty()) return false
        return nodes[0].performAction(AccessibilityNodeInfo.ACTION_CLICK)
    }

    /**
     * Executa ação global do sistema (ex: voltar, início, notificações)
     */
    fun triggerGlobalAction(actionCode: Int): Boolean {
        return performGlobalAction(actionCode)
    }
}
