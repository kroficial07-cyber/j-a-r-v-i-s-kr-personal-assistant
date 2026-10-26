package com.kr.jarvis.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kr.jarvis.service.JarvisAccessibilityService
import com.kr.jarvis.ui.theme.*
import com.kr.jarvis.viewmodel.JarvisViewModel

@Composable
fun SettingsScreen(
    viewModel: JarvisViewModel,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(JarvisBackground)
            .padding(horizontal = 16.dp, vertical = 8.dp)
            .verticalScroll(scrollState)
    ) {
        // --- HEADER ---
        Column(modifier = Modifier.padding(bottom = 12.dp)) {
            Text(text = "CENTRAL DE CONFIGURAÇÕES // KR-OS", style = MaterialTheme.typography.labelSmall)
            Text(text = "Diretrizes & Parâmetros", style = MaterialTheme.typography.titleLarge)
        }

        // --- VOZ & SÍNTESE TTS ---
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = JarvisSurface,
            border = androidx.compose.foundation.BorderStroke(1.dp, JarvisBorder),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.VolumeUp, contentDescription = null, tint = JarvisCyan, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = "Voz e Síntese Neural (pt-BR)", style = MaterialTheme.typography.titleMedium)
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Rate Slider
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(text = "Velocidade da Voz", style = MaterialTheme.typography.bodyMedium)
                    Text(text = "%.2fx".format(uiState.voiceRate), color = JarvisCyanBright, style = MaterialTheme.typography.labelSmall)
                }
                Slider(
                    value = uiState.voiceRate,
                    onValueChange = { viewModel.setVoiceRate(it) },
                    valueRange = 0.8f..1.4f,
                    colors = SliderDefaults.colors(thumbColor = JarvisCyan, activeTrackColor = JarvisCyan)
                )

                // Pitch Slider
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(text = "Tom de Frequência (Pitch)", style = MaterialTheme.typography.bodyMedium)
                    Text(text = "%.2f".format(uiState.voicePitch), color = JarvisCyanBright, style = MaterialTheme.typography.labelSmall)
                }
                Slider(
                    value = uiState.voicePitch,
                    onValueChange = { viewModel.setVoicePitch(it) },
                    valueRange = 0.7f..1.3f,
                    colors = SliderDefaults.colors(thumbColor = JarvisCyan, activeTrackColor = JarvisCyan)
                )

                // Auto Speak Toggle
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = "Leitura automática das respostas", style = MaterialTheme.typography.bodyMedium)
                    Switch(
                        checked = uiState.autoSpeakResponses,
                        onCheckedChange = { viewModel.setAutoSpeakResponses(it) },
                        colors = SwitchDefaults.colors(checkedThumbColor = JarvisCyanBright, checkedTrackColor = JarvisSurfaceVariant)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Button(
                    onClick = { viewModel.speak("Comunicação vocal calibrada com sucesso, Senhor ${uiState.userName}.") },
                    colors = ButtonDefaults.buttonColors(containerColor = JarvisSurfaceVariant),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.PlayArrow, contentDescription = null, tint = JarvisCyanBright, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Testar Calibração de Voz", color = JarvisCyanBright, fontSize = 12.sp)
                }
            }
        }

        // --- IDENTIDADE DO USUÁRIO ---
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = JarvisSurface,
            border = androidx.compose.foundation.BorderStroke(1.dp, JarvisBorder),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Person, contentDescription = null, tint = JarvisCyan, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = "Identidade do Usuário Mestre", style = MaterialTheme.typography.titleMedium)
                }

                Spacer(modifier = Modifier.height(10.dp))
                OutlinedTextField(
                    value = uiState.userName,
                    onValueChange = { viewModel.setUserName(it) },
                    label = { Text("Nome Preferencial") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = JarvisCyan,
                        unfocusedBorderColor = JarvisBorder,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    ),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }

        // --- PERMISSÕES DO ANDROID ---
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = JarvisSurface,
            border = androidx.compose.foundation.BorderStroke(1.dp, JarvisBorder),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Security, contentDescription = null, tint = JarvisCyan, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = "Diagnóstico de Permissões", style = MaterialTheme.typography.titleMedium)
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(text = "Microfone (Áudio pt-BR)", style = MaterialTheme.typography.bodyMedium)
                    Text(text = "CONCEDIDO", color = JarvisEmerald, style = MaterialTheme.typography.labelSmall)
                }

                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(text = "Serviço de Acessibilidade", style = MaterialTheme.typography.bodyMedium)
                    Text(
                        text = if (JarvisAccessibilityService.isRunning) "CONECTADO" else "AGUARDANDO ATIVAÇÃO",
                        color = if (JarvisAccessibilityService.isRunning) JarvisEmerald else JarvisCyanBright,
                        style = MaterialTheme.typography.labelSmall
                    )
                }

                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(text = "Banco Room Offline", style = MaterialTheme.typography.bodyMedium)
                    Text(text = "PERSISTIDO", color = JarvisEmerald, style = MaterialTheme.typography.labelSmall)
                }
            }
        }

        // --- MODO ECONÔMICO ---
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = JarvisSurface,
            border = androidx.compose.foundation.BorderStroke(1.dp, JarvisBorder),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 24.dp)
        ) {
            Row(
                modifier = Modifier
                    .padding(14.dp)
                    .fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(text = "Modo Econômico de Recursos", style = MaterialTheme.typography.titleMedium)
                    Text(text = "Otimiza animações para celulares de entrada", style = MaterialTheme.typography.bodyMedium, fontSize = 11.sp)
                }
                Switch(
                    checked = uiState.lowPowerMode,
                    onCheckedChange = { viewModel.setLowPowerMode(it) },
                    colors = SwitchDefaults.colors(checkedThumbColor = JarvisCyanBright, checkedTrackColor = JarvisSurfaceVariant)
                )
            }
        }
    }
}
