package com.kr.jarvis.automation

import android.content.Context
import android.content.Intent
import android.net.Uri

object AppLauncher {

    fun launchPackage(context: Context, packageName: String): Pair<Boolean, String> {
        return try {
            val pm = context.packageManager
            val intent = pm.getLaunchIntentForPackage(packageName)
            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
                Pair(true, "Aplicativo $packageName iniciado com sucesso.")
            } else {
                Pair(false, "Aplicativo $packageName não está instalado neste dispositivo.")
            }
        } catch (e: Exception) {
            Pair(false, "Falha ao iniciar $packageName: ${e.localizedMessage}")
        }
    }

    fun openWebUrl(context: Context, url: String): Pair<Boolean, String> {
        return try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            Pair(true, "Link aberto no navegador.")
        } catch (e: Exception) {
            Pair(false, "Não foi possível abrir o link: ${e.localizedMessage}")
        }
    }
}
