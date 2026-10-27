package com.kr.jarvis.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.kr.jarvis.automation.AppLauncher
import com.kr.jarvis.data.local.*
import com.kr.jarvis.data.repository.JarvisRepository
import com.kr.jarvis.service.JarvisAccessibilityService
import com.kr.jarvis.speech.SpeechRecognizerManager
import com.kr.jarvis.speech.TtsManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

enum class AssistantState {
    IDLE, LISTENING, PROCESSING, SPEAKING
}

data class JarvisUiState(
    val assistantState: AssistantState = AssistantState.IDLE,
    val currentTimeFormatted: String = "",
    val currentDateFormatted: String = "",
    val greeting: String = "BOM DIA",
    val interimTranscript: String = "",
    val audioLevel: Float = 0f,
    val userName: String = "KR",
    val autoSpeakResponses: Boolean = true,
    val lowPowerMode: Boolean = false,
    val voicePitch: Float = 0.95f,
    val voiceRate: Float = 1.05f,
    val infoMessage: String? = null
)

class JarvisViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: JarvisRepository
    private val speechRecognizerManager: SpeechRecognizerManager
    private val ttsManager: TtsManager
    val brain: com.kr.jarvis.core.JarvisBrain

    val focusState = com.kr.jarvis.modules.focus.FocusRoutineManager.focusState

    private val _uiState = MutableStateFlow(JarvisUiState())
    val uiState: StateFlow<JarvisUiState> = _uiState.asStateFlow()

    val messages: StateFlow<List<ChatMessageEntity>>
    val memories: StateFlow<List<MemoryEntity>>
    val missions: StateFlow<List<MissionEntity>>
    val automations: StateFlow<List<AutomationRuleEntity>>

    init {
        val database = JarvisDatabase.getDatabase(application, viewModelScope)
        repository = JarvisRepository(database.jarvisDao())
        brain = com.kr.jarvis.core.JarvisBrain(application, repository)

        messages = repository.allMessages.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
        memories = repository.allMemories.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
        missions = repository.allMissions.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
        automations = repository.allAutomations.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

        ttsManager = TtsManager(application) { isSpeaking ->
            _uiState.update { it.copy(assistantState = if (isSpeaking) AssistantState.SPEAKING else AssistantState.IDLE) }
        }

        speechRecognizerManager = SpeechRecognizerManager(
            context = application,
            onResult = { text, isFinal ->
                if (isFinal) {
                    _uiState.update { it.copy(interimTranscript = "") }
                    processUserCommand(text, isVoice = true)
                } else {
                    _uiState.update { it.copy(interimTranscript = text) }
                }
            },
            onError = { err ->
                showInfo(err)
                _uiState.update { it.copy(assistantState = AssistantState.IDLE, audioLevel = 0f) }
            },
            onRmsChanged = { level ->
                _uiState.update { it.copy(audioLevel = level) }
            },
            onStateChange = { isListening ->
                _uiState.update { it.copy(assistantState = if (isListening) AssistantState.LISTENING else AssistantState.IDLE) }
            }
        )

        startClockUpdates()
        checkDailyMissionsRenewal()
    }

    private fun startClockUpdates() {
        viewModelScope.launch(Dispatchers.Default) {
            while (true) {
                val now = Calendar.getInstance()
                val timeStr = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(now.time)
                val dateStr = SimpleDateFormat("EEE, dd MMM", Locale("pt", "BR")).format(now.time).uppercase()
                val hour = now.get(Calendar.HOUR_OF_DAY)
                val greet = when {
                    hour in 5..11 -> "BOM DIA"
                    hour in 12..17 -> "BOA TARDE"
                    else -> "BOA NOITE"
                }

                _uiState.update {
                    it.copy(
                        currentTimeFormatted = timeStr,
                        currentDateFormatted = dateStr,
                        greeting = greet
                    )
                }
                delay(1000)
            }
        }
    }

    private fun checkDailyMissionsRenewal() {
        viewModelScope.launch(Dispatchers.IO) {
            val renewed = repository.checkAndRenewDailyMissions()
            if (renewed) {
                showInfo("Missões diárias renovadas para o novo ciclo de hoje, Senhor KR.")
            }
        }
    }

    fun toggleVoiceInteraction() {
        if (_uiState.value.assistantState == AssistantState.LISTENING) {
            speechRecognizerManager.stopListening()
            _uiState.update { it.copy(assistantState = AssistantState.IDLE) }
        } else {
            ttsManager.stop()
            val started = speechRecognizerManager.startListening()
            if (!started) {
                showInfo("Toque no campo de texto para digitar seu comando.")
            }
        }
    }

    fun processUserCommand(input: String, isVoice: Boolean = false) {
        val trimmed = input.trim()
        if (trimmed.isEmpty()) return

        val now = System.currentTimeMillis()
        val userMsg = ChatMessageEntity(
            id = "user_$now",
            text = trimmed,
            sender = "user",
            timestamp = now,
            isVoiceTriggered = isVoice
        )

        viewModelScope.launch(Dispatchers.IO) {
            repository.insertMessage(userMsg)
            _uiState.update { it.copy(assistantState = AssistantState.PROCESSING) }

            delay(350)
            val replyText = generateJarvisResponse(trimmed)

            val jarvisMsg = ChatMessageEntity(
                id = "jarvis_${System.currentTimeMillis()}",
                text = replyText,
                sender = "jarvis",
                timestamp = System.currentTimeMillis()
            )
            repository.insertMessage(jarvisMsg)

            if (_uiState.value.autoSpeakResponses || isVoice) {
                speak(replyText)
            } else {
                _uiState.update { it.copy(assistantState = AssistantState.IDLE) }
            }
        }
    }

    private suspend fun generateJarvisResponse(text: String): String {
        val plan = brain.processRequest(
            input = text,
            userName = _uiState.value.userName,
            activeMemories = memories.value,
            activeMissions = missions.value
        )
        return plan.responseText
    }

    fun speak(text: String) {
        ttsManager.speak(
            text = text,
            pitch = _uiState.value.voicePitch,
            rate = _uiState.value.voiceRate
        )
    }

    fun toggleMission(mission: MissionEntity) {
        viewModelScope.launch(Dispatchers.IO) {
            val updated = mission.copy(
                completed = !mission.completed,
                completedAt = if (!mission.completed) System.currentTimeMillis() else null
            )
            repository.updateMission(updated)
        }
    }

    fun addMission(title: String, description: String, category: String, priority: String, isDaily: Boolean) {
        viewModelScope.launch(Dispatchers.IO) {
            val now = System.currentTimeMillis()
            repository.insertMission(
                MissionEntity(
                    id = "miss_$now",
                    title = title,
                    description = description,
                    category = category,
                    priority = priority,
                    completed = false,
                    isDaily = isDaily,
                    createdAt = now
                )
            )
            showInfo("Nova missão cadastrada com sucesso!")
        }
    }

    fun deleteMission(id: String) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.deleteMission(id)
            showInfo("Missão removida.")
        }
    }

    fun renewDailyMissions() {
        viewModelScope.launch(Dispatchers.IO) {
            repository.forceRenewDailyMissions()
            showInfo("Ciclo de missões diárias renovado com sucesso!")
            if (_uiState.value.autoSpeakResponses) {
                speak("Missões diárias renovadas para o novo ciclo, Senhor ${_uiState.value.userName}.")
            }
        }
    }

    fun addMemory(title: String, content: String, category: String) {
        viewModelScope.launch(Dispatchers.IO) {
            val now = System.currentTimeMillis()
            repository.insertMemory(
                MemoryEntity("mem_$now", title, content, category, now, now)
            )
            showInfo("Memória permanente gravada com sucesso.")
        }
    }

    fun updateMemory(id: String, title: String, content: String, category: String) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.updateMemory(
                MemoryEntity(id, title, content, category, System.currentTimeMillis(), System.currentTimeMillis())
            )
            showInfo("Memória atualizada.")
        }
    }

    fun deleteMemory(id: String) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.deleteMemory(id)
            showInfo("Memória removida do banco local.")
        }
    }

    fun toggleAutomation(automation: AutomationRuleEntity) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.updateAutomation(automation.copy(enabled = !automation.enabled))
        }
    }

    fun testAutomation(automation: AutomationRuleEntity) {
        if (automation.targetPackage != null) {
            val res = AppLauncher.launchPackage(getApplication(), automation.targetPackage)
            showInfo(res.second)
            if (res.first) speak("Iniciando ${automation.name}.")
        } else if (automation.requiresAccessibilityService) {
            val service = JarvisAccessibilityService.getInstance()
            if (service != null) {
                val executed = service.executeGlobal(1) // GLOBAL_ACTION_BACK
                showInfo(if (executed) "Ação de acessibilidade executada." else "Sistema recusou a ação.")
            } else {
                showInfo("O JarvisAccessibilityService não está ativo. Ative-o em Acessibilidade nas Configurações do Android.")
            }
        } else {
            processUserCommand(automation.triggerDetails, false)
        }
    }

    fun clearChat() {
        viewModelScope.launch(Dispatchers.IO) {
            repository.clearMessages()
            showInfo("Histórico de conversas limpo.")
        }
    }

    fun setUserName(name: String) {
        _uiState.update { it.copy(userName = name) }
    }

    fun setAutoSpeakResponses(enabled: Boolean) {
        _uiState.update { it.copy(autoSpeakResponses = enabled) }
    }

    fun setVoiceRate(rate: Float) {
        _uiState.update { it.copy(voiceRate = rate) }
    }

    fun setVoicePitch(pitch: Float) {
        _uiState.update { it.copy(voicePitch = pitch) }
    }

    fun setLowPowerMode(enabled: Boolean) {
        _uiState.update { it.copy(lowPowerMode = enabled) }
    }

    fun showInfo(msg: String) {
        _uiState.update { it.copy(infoMessage = msg) }
    }

    fun dismissInfo() {
        _uiState.update { it.copy(infoMessage = null) }
    }

    override fun onCleared() {
        super.onCleared()
        speechRecognizerManager.destroy()
        ttsManager.shutdown()
    }
}
