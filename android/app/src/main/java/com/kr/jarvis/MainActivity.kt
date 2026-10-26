package com.kr.jarvis

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.darkColorScheme
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.kr.jarvis.ui.screens.HomeScreen

/**
 * MainActivity - J.A.R.V.I.S. KR Personal Assistant
 * Native Jetpack Compose Entry Point
 */
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val jarvisDarkColorScheme = darkColorScheme(
                primary = Color(0xFF06B6D4), // Cyan 500
                secondary = Color(0xFF3B82F6), // Blue 500
                background = Color(0xFF030712), // Deep dark slate
                surface = Color(0xFF0F172A),
                onPrimary = Color(0xFF030712),
                onBackground = Color(0xFFF8FAFC),
                onSurface = Color(0xFFF1F5F9)
            )

            MaterialTheme(colorScheme = jarvisDarkColorScheme) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    HomeScreen()
                }
            }
        }
    }
}
