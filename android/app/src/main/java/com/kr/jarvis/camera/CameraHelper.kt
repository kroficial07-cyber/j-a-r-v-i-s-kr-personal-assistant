package com.kr.jarvis.camera

import android.content.Context
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat

/**
 * CameraHelper
 * 
 * Auxiliar para gerenciamento seguro e explícito da câmera no Android.
 * Regras de Privacidade:
 * - NUNCA captura fotos ou vídeos em segundo plano sem consentimento.
 * - Verifica permissão CAMERA antes de qualquer ação.
 * - Libera recursos de hardware imediatamente.
 */
object CameraHelper {

    fun isCameraPermissionGranted(context: Context): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            android.Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED
    }

    fun getCameraStatus(context: Context): String {
        return if (isCameraPermissionGranted(context)) {
            "Permissão de câmera concedida. Captura sob demanda disponível."
        } else {
            "Permissão de câmera não concedida. Requer autorização explícita do usuário."
        }
    }
}
