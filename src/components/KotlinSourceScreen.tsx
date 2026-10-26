import React, { useState } from 'react';
import { audioSynthesizer } from '../services/audioService';
import {
  Code2,
  Copy,
  Check,
  FileCode,
  Smartphone,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export const KotlinSourceScreen: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>('MainActivity.kt');
  const [copied, setCopied] = useState(false);

  const files: Record<string, { desc: string; code: string; path: string }> = {
    'MainActivity.kt': {
      desc: 'Ponto de entrada nativo com Jetpack Compose Material 3 Dark theme',
      path: 'android/app/src/main/java/com/kr/jarvis/MainActivity.kt',
      code: `package com.kr.jarvis

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.kr.jarvis.ui.JarvisAppRoot
import com.kr.jarvis.ui.theme.JarvisTheme
import com.kr.jarvis.viewmodel.JarvisViewModel

class MainActivity : ComponentActivity() {
    private val viewModel: JarvisViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            JarvisTheme(darkTheme = true) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    JarvisAppRoot(viewModel = viewModel)
                }
            }
        }
    }
}`,
    },
    'HomeScreen.kt': {
      desc: 'HUD futurista Jetpack Compose com relógio, status e botão central de voz',
      path: 'android/app/src/main/java/com/kr/jarvis/ui/screens/HomeScreen.kt',
      code: `package com.kr.jarvis.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kr.jarvis.ui.components.NeuralCoreCanvas
import com.kr.jarvis.viewmodel.AssistantState
import com.kr.jarvis.viewmodel.JarvisViewModel

@Composable
fun HomeScreen(
    viewModel: JarvisViewModel,
    onNavigateToChat: () -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF030712))
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Top HUD Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "J.A.R.V.I.S. // KR-OS",
                    color = Color(0xFF06B6D4),
                    fontSize = 12.sp
                )
                Text(
                    text = "BOM DIA, SENHOR KR",
                    color = Color.White,
                    fontSize = 18.sp,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                )
            }
            Text(
                text = uiState.currentTimeFormatted,
                color = Color(0xFF22D3EE),
                fontSize = 16.sp
            )
        }

        Spacer(modifier = Modifier.weight(1f))

        // Center Neural Core Arc Reactor Canvas
        NeuralCoreCanvas(
            state = uiState.assistantState,
            onClick = { viewModel.toggleVoiceInteraction() },
            modifier = Modifier.size(260.dp)
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Voice Trigger Button
        Button(
            onClick = { viewModel.toggleVoiceInteraction() },
            colors = ButtonDefaults.buttonColors(
                containerColor = if (uiState.assistantState == AssistantState.LISTENING)
                    Color(0xFF06B6D4) else Color(0xFF0F172A)
            ),
            shape = CircleShape,
            modifier = Modifier.height(52.dp)
        ) {
            Icon(
                imageVector = if (uiState.assistantState == AssistantState.LISTENING)
                    Icons.Default.MicOff else Icons.Default.Mic,
                contentDescription = "Microfone",
                tint = if (uiState.assistantState == AssistantState.LISTENING)
                    Color(0xFF030712) else Color(0xFF22D3EE)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = if (uiState.assistantState == AssistantState.LISTENING)
                    "OUVINDO PT-BR..." else "ATIVAR VOZ (PT-BR)",
                color = if (uiState.assistantState == AssistantState.LISTENING)
                    Color(0xFF030712) else Color(0xFF22D3EE)
            )
        }

        Spacer(modifier = Modifier.weight(1f))
    }
}`,
    },
    'NeuralCoreCanvas.kt': {
      desc: 'Canvas Jetpack Compose nativo com anéis concêntricos rotativos e pulso neural',
      path: 'android/app/src/main/java/com/kr/jarvis/ui/components/NeuralCoreCanvas.kt',
      code: `package com.kr.jarvis.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import com.kr.jarvis.viewmodel.AssistantState
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun NeuralCoreCanvas(
    state: AssistantState,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "core_anim")
    
    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = if (state == AssistantState.LISTENING) 3000 else 8000, easing = LinearEasing)
        ),
        label = "rotation"
    )

    val pulse by infiniteTransition.animateFloat(
        initialValue = 0.85f,
        targetValue = 1.15f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )

    val interactionSource = remember { MutableInteractionSource() }

    Canvas(
        modifier = modifier.clickable(
            interactionSource = interactionSource,
            indication = null,
            onClick = onClick
        )
    ) {
        val center = Offset(size.width / 2, size.height / 2)
        val baseRadius = size.minDimension * 0.38f

        // 1. Ambient Glow Ring
        drawCircle(
            color = Color(0x2606B6D4),
            radius = baseRadius * pulse,
            center = center
        )

        // 2. Rotating Segmented Outer Ring
        rotate(rotation, pivot = center) {
            drawCircle(
                color = Color(0x6606B6D4),
                radius = baseRadius * 0.95f,
                center = center,
                style = Stroke(width = 3f)
            )
        }

        // 3. Counter-rotating Inner Ring
        rotate(-rotation * 1.4f, pivot = center) {
            drawCircle(
                color = Color(0x803B82F6),
                radius = baseRadius * 0.72f,
                center = center,
                style = Stroke(width = 4f)
            )
        }

        // 4. Central Glowing Arc Reactor Core
        drawCircle(
            color = Color(0xFF06B6D4),
            radius = baseRadius * 0.42f * pulse,
            center = center
        )

        drawCircle(
            color = Color.White,
            radius = baseRadius * 0.18f,
            center = center
        )
    }
}`,
    },
    'JarvisAccessibilityService.kt': {
      desc: 'Serviço Android Accessibility Service nativo para automações globais no OS',
      path: 'android/app/src/main/java/com/kr/jarvis/service/JarvisAccessibilityService.kt',
      code: `package com.kr.jarvis.service

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * Android Accessibility Service para o J.A.R.V.I.S.
 * Permite comandos de voz executarem ações no aparelho quando compilado em APK nativo.
 */
class JarvisAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "JarvisAccessibility"
        var instance: JarvisAccessibilityService? = null
            private set
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
            notificationTimeout = 100
        }
        serviceInfo = info
        Log.i(TAG, "J.A.R.V.I.S. Accessibility Service conectado com sucesso.")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        val packageName = event.packageName?.toString() ?: ""
        // Intercepta eventos para automações cadastradas no módulo de automações
        Log.d(TAG, "Evento detectado no pacote: $packageName")
    }

    override fun onInterrupt() {
        Log.w(TAG, "J.A.R.V.I.S. Accessibility Service interrompido.")
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
    }

    /** Executa toque em nó específico por ID de visualização */
    fun clickNodeByViewId(viewId: String): Boolean {
        val rootNode = rootInActiveWindow ?: return false
        val nodes = rootNode.findAccessibilityNodeInfosByViewId(viewId)
        if (nodes.isNullOrEmpty()) return false
        return nodes[0].performAction(AccessibilityNodeInfo.ACTION_CLICK)
    }
}`,
    },
    'JarvisDatabase.kt': {
      desc: 'Banco de dados Room nativo para persistência de conversas, memórias e missões',
      path: 'android/app/src/main/java/com/kr/jarvis/data/local/JarvisDatabase.kt',
      code: `package com.kr.jarvis.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "chat_messages")
data class ChatMessageEntity(
    @PrimaryKey val id: String,
    val text: String,
    val sender: String,
    val timestamp: Long
)

@Entity(tableName = "memory_items")
data class MemoryItemEntity(
    @PrimaryKey val id: String,
    val title: String,
    val content: String,
    val category: String,
    val createdAt: Long,
    val updatedAt: Long
)

@Entity(tableName = "mission_tasks")
data class MissionTaskEntity(
    @PrimaryKey val id: String,
    val title: String,
    val description: String,
    val category: String,
    val priority: String,
    val completed: Boolean,
    val isDaily: Boolean,
    val createdAt: Long
)

@Dao
interface JarvisDao {
    @Query("SELECT * FROM chat_messages ORDER BY timestamp ASC")
    fun getAllMessages(): Flow<List<ChatMessageEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessage(msg: ChatMessageEntity)

    @Query("SELECT * FROM memory_items ORDER BY updatedAt DESC")
    fun getAllMemories(): Flow<List<MemoryItemEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMemory(memory: MemoryItemEntity)

    @Delete
    suspend fun deleteMemory(memory: MemoryItemEntity)

    @Query("SELECT * FROM mission_tasks ORDER BY createdAt DESC")
    fun getAllMissions(): Flow<List<MissionTaskEntity>>

    @Update
    suspend fun updateMission(task: MissionTaskEntity)

    @Query("UPDATE mission_tasks SET completed = 0 WHERE isDaily = 1")
    suspend fun resetDailyMissions()
}

@Database(
    entities = [ChatMessageEntity::class, MemoryItemEntity::class, MissionTaskEntity::class],
    version = 1,
    exportSchema = false
)
abstract class JarvisDatabase : RoomDatabase() {
    abstract fun jarvisDao(): JarvisDao
}`,
    },
    'VoiceInteractionManager.kt': {
      desc: 'Gerenciador nativo de SpeechRecognizer e TextToSpeech em pt-BR',
      path: 'android/app/src/main/java/com/kr/jarvis/speech/VoiceInteractionManager.kt',
      code: `package com.kr.jarvis.speech

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import java.util.Locale

class VoiceInteractionManager(
    private val context: Context,
    private val onResult: (String) -> Unit,
    private val onError: (String) -> Unit
) : TextToSpeech.OnInitListener {

    private var speechRecognizer: SpeechRecognizer? = null
    private var textToSpeech: TextToSpeech? = null
    private val ptBrLocale = Locale("pt", "BR")

    init {
        initSpeechRecognizer()
        textToSpeech = TextToSpeech(context, this)
    }

    private fun initSpeechRecognizer() {
        if (!SpeechRecognizer.isRecognitionAvailable(context)) return
        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context).apply {
            setRecognitionListener(object : RecognitionListener {
                override fun onResults(results: Bundle?) {
                    val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    if (!matches.isNullOrEmpty()) {
                        onResult(matches[0])
                    }
                }
                override fun onError(error: Int) {
                    onError("Erro de reconhecimento de voz código: $error")
                }
                override fun onReadyForSpeech(params: Bundle?) {}
                override fun onBeginningOfSpeech() {}
                override fun onRmsChanged(rmsdB: Float) {}
                override fun onBufferReceived(buffer: ByteArray?) {}
                override fun onEndOfSpeech() {}
                override fun onPartialResults(partialResults: Bundle?) {}
                override fun onEvent(eventType: Int, params: Bundle?) {}
            })
        }
    }

    fun startListening() {
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, ptBrLocale)
            putExtra(RecognizerIntent.EXTRA_PROMPT, "Fale com o J.A.R.V.I.S. em Português")
        }
        speechRecognizer?.startListening(intent)
    }

    fun stopListening() {
        speechRecognizer?.stopListening()
    }

    fun speak(text: String) {
        textToSpeech?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "jarvis_tts_utterance")
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            textToSpeech?.language = ptBrLocale
            textToSpeech?.setPitch(0.95f)
            textToSpeech?.setSpeechRate(1.05f)
        }
    }

    fun destroy() {
        speechRecognizer?.destroy()
        textToSpeech?.stop()
        textToSpeech?.shutdown()
    }
}`,
    },
    'AndroidManifest.xml': {
      desc: 'Manifest nativo com permissões de microfone, internet e declaração do AccessibilityService',
      path: 'android/app/src/main/AndroidManifest.xml',
      code: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.kr.jarvis">

    <!-- Permissões Requeridas -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="J.A.R.V.I.S. — KR"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.Jarvis">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.Jarvis">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Serviço de Acessibilidade do JARVIS -->
        <service
            android:name=".service.JarvisAccessibilityService"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
            android:exported="false">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_service_config" />
        </service>

    </application>
</manifest>`,
    },
  };

  const currentFileData = files[selectedFile] || files['MainActivity.kt'];

  const handleCopy = () => {
    audioSynthesizer.playTap();
    navigator.clipboard.writeText(currentFileData.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-full px-4 pt-3 pb-28 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
          <Code2 className="w-3.5 h-3.5" />
          <span>REPOSITÓRIO NATIVO ANDROID // KOTLIN + JETPACK COMPOSE</span>
        </div>
        <h2 className="text-lg font-bold text-white mt-0.5">Código-Fonte para Android Studio</h2>
        <p className="text-xs text-slate-400 mt-1">
          Arquitetura nativa modular pronta para empacotar em APK: ViewModel, Room Database, StateFlow e AccessibilityService.
        </p>
      </div>

      {/* File selector pill bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
        {Object.keys(files).map((fileName) => (
          <button
            key={fileName}
            onClick={() => {
              audioSynthesizer.playTap();
              setSelectedFile(fileName);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              selectedFile === fileName
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>{fileName}</span>
          </button>
        ))}
      </div>

      {/* Code Viewer Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Code Bar Header */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-mono font-bold text-cyan-300">
              {currentFileData.path}
            </span>
            <span className="text-[11px] text-slate-400">
              {currentFileData.desc}
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white rounded-lg text-xs font-mono transition-colors active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Código</span>
              </>
            )}
          </button>
        </div>

        {/* Preformatted Code Content */}
        <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-[500px] scrollbar-thin">
          <code>{currentFileData.code}</code>
        </pre>
      </div>

      {/* Guide Card */}
      <div className="mt-4 p-4 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-2 font-mono">
        <div className="flex items-center gap-2 text-cyan-400 font-bold">
          <Smartphone className="w-4 h-4" />
          <span>INSTRUÇÕES PARA COMPILAÇÃO NO ANDROID STUDIO:</span>
        </div>
        <ol className="list-decimal pl-4 space-y-1 text-slate-400 text-[11px]">
          <li>Abra o Android Studio Hedgehog ou superior.</li>
          <li>Crie um projeto vazio com "Empty Activity (Compose)".</li>
          <li>Substitua os arquivos pelos módulos acima nas pastas correspondentes.</li>
          <li>Compile com JDK 17 e instale no dispositivo Android do Senhor KR.</li>
        </ol>
      </div>
    </div>
  );
};
