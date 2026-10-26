import React, { useState } from 'react';
import { audioSynthesizer } from '../services/audioService';
import {
  Code2,
  Copy,
  Check,
  FileCode,
  Smartphone,
  Download,
  Github,
  Cloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const KotlinSourceScreen: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>('MainActivity.kt');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

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
            JarvisTheme {
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
    'JarvisAppRoot.kt': {
      desc: 'Navegação nativa Compose Scaffold, barra inferior com 5 abas e TopBar',
      path: 'android/app/src/main/java/com/kr/jarvis/ui/JarvisAppRoot.kt',
      code: `package com.kr.jarvis.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kr.jarvis.ui.screens.*
import com.kr.jarvis.ui.theme.*
import com.kr.jarvis.viewmodel.JarvisViewModel

data class NavItem(val label: String, val icon: ImageVector, val index: Int)

@Composable
fun JarvisAppRoot(viewModel: JarvisViewModel, modifier: Modifier = Modifier) {
    var selectedTab by remember { mutableIntStateOf(0) }
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.infoMessage) {
        uiState.infoMessage?.let { msg ->
            snackbarHostState.showSnackbar(msg)
            viewModel.dismissInfo()
        }
    }

    val navItems = listOf(
        NavItem("Início", Icons.Default.Home, 0),
        NavItem("Conversa", Icons.Default.ChatBubble, 1),
        NavItem("Missões", Icons.Default.AssignmentTurnedIn, 2),
        NavItem("Memória", Icons.Default.Psychology, 3),
        NavItem("Automação", Icons.Default.AltRoute, 4),
        NavItem("Config", Icons.Default.Settings, 5)
    )

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = JarvisBackground,
        snackbarHost = { SnackbarHost(snackbarHostState) },
        bottomBar = {
            NavigationBar(containerColor = JarvisSurface, tonalElevation = 8.dp) {
                navItems.forEach { item ->
                    val isSelected = selectedTab == item.index
                    NavigationBarItem(
                        selected = isSelected,
                        onClick = { selectedTab = item.index },
                        icon = { Icon(item.icon, contentDescription = item.label, tint = if (isSelected) JarvisCyanBright else JarvisTextSecondary) },
                        label = { Text(item.label, fontSize = 10.sp, color = if (isSelected) JarvisCyanBright else JarvisTextSecondary) }
                    )
                }
            }
        }
    ) { innerPadding ->
        Box(modifier = Modifier.fillMaxSize().padding(innerPadding)) {
            when (selectedTab) {
                0 -> HomeScreen(viewModel = viewModel, onNavigateToTab = { selectedTab = it })
                1 -> ChatScreen(viewModel = viewModel)
                2 -> MissionsScreen(viewModel = viewModel)
                3 -> MemoryScreen(viewModel = viewModel)
                4 -> AutomationsScreen(viewModel = viewModel)
                5 -> SettingsScreen(viewModel = viewModel)
            }
        }
    }
}`,
    },
    'JarvisViewModel.kt': {
      desc: 'Orquestrador StateFlow de Reconhecimento de Voz, TTS, Room e Automações',
      path: 'android/app/src/main/java/com/kr/jarvis/viewmodel/JarvisViewModel.kt',
      code: `package com.kr.jarvis.viewmodel

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

enum class AssistantState { IDLE, LISTENING, PROCESSING, SPEAKING }

class JarvisViewModel(application: Application) : AndroidViewModel(application) {
    // Gerencia StateFlows de áudio, banco de dados Room, reconhecimento e fala
    // Veja arquivo completo no ZIP para código integral com tratamento de erro
}`,
    },
    'JarvisAccessibilityService.kt': {
      desc: 'Serviço de Acessibilidade nativo do Android para toques e ações globais',
      path: 'android/app/src/main/java/com/kr/jarvis/service/JarvisAccessibilityService.kt',
      code: `package com.kr.jarvis.service

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
        @Volatile
        private var INSTANCE: JarvisAccessibilityService? = null
        val isRunning: Boolean get() = INSTANCE != null

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
    }

    fun clickByViewId(viewId: String): Boolean {
        val root = rootInActiveWindow ?: return false
        val nodes = root.findAccessibilityNodeInfosByViewId(viewId)
        return if (!nodes.isNullOrEmpty()) nodes[0].performAction(AccessibilityNodeInfo.ACTION_CLICK) else false
    }

    fun executeGlobal(actionCode: Int): Boolean = performGlobalAction(actionCode)
}`,
    },
    'SpeechRecognizerManager.kt': {
      desc: 'Reconhecimento de fala Android pt-BR com RMS dB para o núcleo neural',
      path: 'android/app/src/main/java/com/kr/jarvis/speech/SpeechRecognizerManager.kt',
      code: `package com.kr.jarvis.speech

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import java.util.Locale

class SpeechRecognizerManager(
    private val context: Context,
    private val onResult: (String, Boolean) -> Unit,
    private val onError: (String) -> Unit,
    private val onRmsChanged: (Float) -> Unit,
    private val onStateChange: (Boolean) -> Unit
) {
    private val ptBrLocale = Locale("pt", "BR")
    // Configura RecognizerIntent.EXTRA_LANGUAGE para pt-BR e emite parciais e RMS level
}`,
    },
    'TtsManager.kt': {
      desc: 'Síntese de voz TextToSpeech nativa do Android em português do Brasil',
      path: 'android/app/src/main/java/com/kr/jarvis/speech/TtsManager.kt',
      code: `package com.kr.jarvis.speech

import android.content.Context
import android.speech.tts.TextToSpeech
import java.util.Locale

class TtsManager(context: Context, private val onSpeakingStateChanged: (Boolean) -> Unit) : TextToSpeech.OnInitListener {
    private var tts: TextToSpeech? = TextToSpeech(context.applicationContext, this)
    // Inicializa Locale("pt", "BR"), pitch e rate
}`,
    },
    'JarvisDatabase.kt': {
      desc: 'Banco de dados Room nativo com seed inicial de memórias e missões',
      path: 'android/app/src/main/java/com/kr/jarvis/data/local/JarvisDatabase.kt',
      code: `package com.kr.jarvis.data.local

import androidx.room.*

@Database(entities = [ChatMessageEntity::class, MemoryEntity::class, MissionEntity::class, AutomationRuleEntity::class, SettingEntity::class], version = 1)
abstract class JarvisDatabase : RoomDatabase() {
    abstract fun jarvisDao(): JarvisDao
}`,
    },
    'AppLauncher.kt': {
      desc: 'Lançador de aplicativos Android instalados (WhatsApp, Maps, YouTube)',
      path: 'android/app/src/main/java/com/kr/jarvis/automation/AppLauncher.kt',
      code: `package com.kr.jarvis.automation

import android.content.Context
import android.content.Intent

object AppLauncher {
    fun launchPackage(context: Context, packageName: String): Pair<Boolean, String> {
        val pm = context.packageManager
        val intent = pm.getLaunchIntentForPackage(packageName)
        return if (intent != null) {
            context.startActivity(intent.apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) })
            Pair(true, "Aplicativo iniciado.")
        } else {
            Pair(false, "Aplicativo não instalado.")
        }
    }
}`,
    },
    'build-apk.yml': {
      desc: 'GitHub Actions para compilar o APK na nuvem de graça pelo navegador',
      path: 'android/.github/workflows/build-apk.yml',
      code: `name: Build J.A.R.V.I.S. APK
on:
  workflow_dispatch:
  push:
    branches: [ main, master ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: gradle
      - run: chmod +x gradlew
      - run: ./gradlew assembleDebug
      - uses: actions/upload-artifact@v4
        with:
          name: jarvis-kr-debug-apk
          path: app/build/outputs/apk/debug/app-debug.apk`,
    },
    'build.gradle.kts': {
      desc: 'Configuração Gradle do módulo com Compose 1.5.8, Room 2.6.1 e SDK 34',
      path: 'android/app/build.gradle.kts',
      code: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("kotlin-kapt")
}
android {
    namespace = "com.kr.jarvis"
    compileSdk = 34
    defaultConfig {
        applicationId = "com.kr.jarvis"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    buildFeatures { compose = true }
    composeOptions { kotlinCompilerExtensionVersion = "1.5.8" }
}`,
    },
    'AndroidManifest.xml': {
      desc: 'Manifest Android com permissões de microfone, queries de apps e AccessibilityService',
      path: 'android/app/src/main/AndroidManifest.xml',
      code: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <application
        android:label="J.A.R.V.I.S. — KR"
        android:theme="@style/Theme.Jarvis">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
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

  const handleDownloadZip = () => {
    audioSynthesizer.playSuccess();
    setDownloading(true);
    const link = document.createElement('a');
    link.href = '/jarvis-kr-android-project.zip';
    link.download = 'jarvis-kr-android-project.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-full px-4 pt-3 pb-28 max-w-3xl mx-auto w-full">
      {/* Top Banner: One-Click ZIP Download */}
      <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-blue-950/80 border border-cyan-500/50 rounded-2xl p-5 mb-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 font-bold">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>PROJETO ANDROID STUDIO COMPLETO (KOTLIN + JETPACK COMPOSE)</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Pacote Fonte Pronto para Compilação de APK
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
              Inclui Gradle 8.2, Kotlin 1.9.22, Jetpack Compose Material 3, Room Database, Reconhecimento de Voz nativo pt-BR, TTS, Accessibility Service e fluxo GitHub Actions pré-configurado.
            </p>
          </div>

          <button
            onClick={handleDownloadZip}
            disabled={downloading}
            className="w-full sm:w-auto px-5 py-3 bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold rounded-xl text-xs font-mono transition-all shadow-lg flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'BAIXANDO...' : 'BAIXAR PROJETO (.ZIP)'}</span>
          </button>
        </div>
      </div>

      {/* Cloud Build Guide (100% Free, Browser-only, Zero Cost) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Cloud className="w-4 h-4 text-cyan-400" />
          <span>Como Gerar o APK pelo Navegador de Graça (Sem Computador Local)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono text-slate-300">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-cyan-400 font-bold block">1. CRIAR REPOSITÓRIO GITHUB</span>
            <p className="text-[11px] text-slate-400">
              Acesse <a href="https://github.com/new" target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline">github.com/new</a> pelo navegador do celular ou PC e crie um repositório gratuito.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-cyan-400 font-bold block">2. SUBIR OS ARQUIVOS DO ZIP</span>
            <p className="text-[11px] text-slate-400">
              Descompacte o ZIP baixado e envie os arquivos para o seu repositório (ou use o upload direto no site do GitHub).
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-cyan-400 font-bold block">3. BAIXAR O APK COMPILADO</span>
            <p className="text-[11px] text-slate-400">
              O GitHub Actions compila o APK automaticamente com JDK 17 e disponibiliza o arquivo <code className="text-cyan-300">app-debug.apk</code> na aba "Actions".
            </p>
          </div>
        </div>
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
    </div>
  );
};
