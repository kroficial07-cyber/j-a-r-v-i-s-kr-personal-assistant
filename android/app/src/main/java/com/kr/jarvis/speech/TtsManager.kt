package com.kr.jarvis.speech

import android.content.Context
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import java.util.Locale

class TtsManager(
    context: Context,
    private val onSpeakingStateChanged: (Boolean) -> Unit
) : TextToSpeech.OnInitListener {

    private var tts: TextToSpeech? = null
    private var isInitialized = false
    private val ptBrLocale = Locale("pt", "BR")

    companion object {
        private const val TAG = "JarvisTts"
        private const val UTTERANCE_ID = "jarvis_speech_utterance"
    }

    init {
        tts = TextToSpeech(context.applicationContext, this)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            val result = tts?.setLanguage(ptBrLocale)
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                Log.w(TAG, "Pacote de voz pt-BR não suportado nativamente, tentando fallback pt.")
                tts?.setLanguage(Locale("pt"))
            }

            tts?.setPitch(0.95f)
            tts?.setSpeechRate(1.05f)

            tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(utteranceId: String?) {
                    onSpeakingStateChanged(true)
                }

                override fun onDone(utteranceId: String?) {
                    onSpeakingStateChanged(false)
                }

                override fun onError(utteranceId: String?) {
                    onSpeakingStateChanged(false)
                }
            })

            isInitialized = true
            Log.i(TAG, "TextToSpeech inicializado com sucesso.")
        } else {
            Log.e(TAG, "Falha ao inicializar TextToSpeech. Código: $status")
        }
    }

    fun speak(text: String, pitch: Float = 0.95f, rate: Float = 1.05f) {
        if (!isInitialized) return

        stop()

        val cleanText = text
            .replace(Regex("[*_#`~]"), "")
            .replace(Regex("\\[([^\\]]+)\\]\\([^)]+\\)"), "$1")
            .replace(Regex("https?://\\S+"), "link")
            .trim()

        if (cleanText.isEmpty()) return

        tts?.setPitch(pitch)
        tts?.setSpeechRate(rate)
        tts?.speak(cleanText, TextToSpeech.QUEUE_FLUSH, null, UTTERANCE_ID)
    }

    fun stop() {
        if (tts?.isSpeaking == true) {
            tts?.stop()
            onSpeakingStateChanged(false)
        }
    }

    fun shutdown() {
        stop()
        tts?.shutdown()
        tts = null
    }
}
