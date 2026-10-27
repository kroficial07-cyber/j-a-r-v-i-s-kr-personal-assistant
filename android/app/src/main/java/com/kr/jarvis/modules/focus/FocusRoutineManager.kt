package com.kr.jarvis.modules.focus

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * FocusRoutineManager
 * 
 * Gerenciador de modo foco, rotina de estudos e bloqueio configurável de apps de distração.
 * 
 * DIRETRIZ CRÍTICA DE SEGURANÇA:
 * Chamadas de emergência (190, 192, 193), discadores oficiais do Android e serviços
 * essenciais do sistema NUNCA são bloqueados sob nenhuma circunstância.
 */
object FocusRoutineManager {

    data class FocusState(
        val isFocusActive: Boolean = false,
        val sessionDurationMinutes: Int = 25,
        val remainingSeconds: Int = 25 * 60,
        val blockedAppsList: List<String> = listOf("com.instagram.android", "com.zhiliaoapp.musically", "com.twitter.android"),
        val activeSessionTag: String = "Estudo & Deep Work",
        val sessionsCompletedToday: Int = 0
    )

    // Lista sagrada de pacotes imunes a bloqueio (Segurança & Emergência)
    private val SACRED_IMMUNE_PACKAGES = setOf(
        "com.android.phone",
        "com.samsung.android.dialer",
        "com.google.android.dialer",
        "com.android.server.telecom",
        "com.android.emergency",
        "com.samsung.android.app.telephonyui",
        "com.kr.jarvis" // Próprio assistente
    )

    private val _focusState = MutableStateFlow(FocusState())
    val focusState: StateFlow<FocusState> = _focusState.asStateFlow()

    fun startFocusSession(durationMinutes: Int = 25, tag: String = "Estudo & Deep Work") {
        _focusState.value = _focusState.value.copy(
            isFocusActive = true,
            sessionDurationMinutes = durationMinutes,
            remainingSeconds = durationMinutes * 60,
            activeSessionTag = tag
        )
    }

    fun stopFocusSession() {
        _focusState.value = _focusState.value.copy(
            isFocusActive = false,
            remainingSeconds = _focusState.value.sessionDurationMinutes * 60
        )
    }

    fun completeSession() {
        _focusState.value = _focusState.value.copy(
            isFocusActive = false,
            sessionsCompletedToday = _focusState.value.sessionsCompletedToday + 1,
            remainingSeconds = _focusState.value.sessionDurationMinutes * 60
        )
    }

    fun updateRemainingTime(seconds: Int) {
        if (_focusState.value.isFocusActive) {
            _focusState.value = _focusState.value.copy(remainingSeconds = seconds)
        }
    }

    fun setBlockedPackages(packages: List<String>) {
        // Filtra para garantir que nenhum app imune seja colocado na lista de bloqueio
        val safePackages = packages.filterNot { SACRED_IMMUNE_PACKAGES.contains(it) }
        _focusState.value = _focusState.value.copy(blockedAppsList = safePackages)
    }

    /**
     * Verifica se determinado pacote deve ser contido durante o Modo Foco.
     * Retorna FALSE se for discador/emergência ou se o modo foco estiver inativo.
     */
    fun shouldBlockPackage(packageName: String): Boolean {
        if (!_focusState.value.isFocusActive) return false

        // Emergências e telefonia sempre livres
        if (SACRED_IMMUNE_PACKAGES.contains(packageName)) {
            return false
        }

        return _focusState.value.blockedAppsList.contains(packageName)
    }
}
