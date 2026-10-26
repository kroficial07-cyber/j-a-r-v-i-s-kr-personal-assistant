package com.kr.jarvis.speech

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.util.Log
import java.util.Locale

class SpeechRecognizerManager(
    private val context: Context,
    private val onResult: (String, Boolean) -> Unit,
    private val onError: (String) -> Unit,
    private val onRmsChanged: (Float) -> Unit,
    private val onStateChange: (Boolean) -> Unit
) {
    private var speechRecognizer: SpeechRecognizer? = null
    private val ptBrLocale = Locale("pt", "BR")
    private var isListening = false

    companion object {
        private const val TAG = "JarvisSpeechRec"
    }

    init {
        createRecognizer()
    }

    private fun createRecognizer() {
        if (!SpeechRecognizer.isRecognitionAvailable(context)) {
            Log.w(TAG, "Reconhecimento de fala não disponível no hardware do dispositivo.")
            return
        }

        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context).apply {
            setRecognitionListener(object : RecognitionListener {
                override fun onReadyForSpeech(params: Bundle?) {
                    isListening = true
                    onStateChange(true)
                }

                override fun onBeginningOfSpeech() {}

                override fun onRmsChanged(rmsdB: Float) {
                    // Normaliza dB (-2 a 10) para escala 0.0 a 1.0 para o Canvas Neural
                    val normalized = ((rmsdB + 2f) / 12f).coerceIn(0f, 1f)
                    onRmsChanged(normalized)
                }

                override fun onBufferReceived(buffer: ByteArray?) {}

                override fun onEndOfSpeech() {
                    isListening = false
                    onStateChange(false)
                }

                override fun onError(errorCode: Int) {
                    isListening = false
                    onStateChange(false)
                    onRmsChanged(0f)

                    val message = when (errorCode) {
                        SpeechRecognizer.ERROR_AUDIO -> "Erro na gravação de áudio."
                        SpeechRecognizer.ERROR_CLIENT -> "Erro no cliente de reconhecimento."
                        SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Permissão de microfone negada. Conceda permissão nas configurações."
                        SpeechRecognizer.ERROR_NETWORK -> "Falha de rede no serviço de voz."
                        SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Tempo esgotado na conexão com o serviço de voz."
                        SpeechRecognizer.ERROR_NO_MATCH -> "Nenhuma palavra correspondente foi reconhecida."
                        SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Serviço de voz ocupado."
                        SpeechRecognizer.ERROR_SERVER -> "Erro nos servidores de reconhecimento."
                        SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "Nenhuma fala detectada."
                        else -> "Erro no reconhecimento de voz ($errorCode)."
                    }
                    onError(message)
                }

                override fun onResults(results: Bundle?) {
                    isListening = false
                    onStateChange(false)
                    onRmsChanged(0f)

                    val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    if (!matches.isNullOrEmpty()) {
                        val text = normalizeJarvisCommand(matches[0])
                        onResult(text, true)
                    }
                }

                override fun onPartialResults(partialResults: Bundle?) {
                    val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    if (!matches.isNullOrEmpty()) {
                        val text = normalizeJarvisCommand(matches[0])
                        onResult(text, false)
                    }
                }

                override fun onEvent(eventType: Int, params: Bundle?) {}
            })
        }
    }

    private fun normalizeJarvisCommand(raw: String): String {
        return raw.replace(Regex("^(?:e aí\\s+|ei\\s+)?(?:iarves|jarves|jarvez|jarve|xarvis)\\b", RegexOption.IGNORE_CASE), "Jarvis")
    }

    fun startListening(): Boolean {
        if (!SpeechRecognizer.isRecognitionAvailable(context)) {
            onError("Reconhecimento de fala indisponível neste aparelho. Use o teclado.")
            return false
        }

        if (speechRecognizer == null) {
            createRecognizer()
        }

        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "pt-BR")
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "pt-BR")
            putExtra(RecognizerIntent.EXTRA_ONLY_RETURN_LANGUAGE_PREFERENCE, "pt-BR")
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
            putExtra(RecognizerIntent.EXTRA_PROMPT, "Fale com o J.A.R.V.I.S. (pt-BR)...")
        }

        return try {
            speechRecognizer?.startListening(intent)
            true
        } catch (e: Exception) {
            onError("Falha ao iniciar microfone: ${e.localizedMessage}")
            false
        }
    }

    fun stopListening() {
        try {
            speechRecognizer?.stopListening()
        } catch (_: Exception) {}
        isListening = false
        onStateChange(false)
        onRmsChanged(0f)
    }

    fun destroy() {
        try {
            speechRecognizer?.destroy()
        } catch (_: Exception) {}
        speechRecognizer = null
    }
}
