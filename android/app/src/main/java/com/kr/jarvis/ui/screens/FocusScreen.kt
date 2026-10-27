package com.kr.jarvis.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
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
import com.kr.jarvis.modules.focus.FocusRoutineManager
import com.kr.jarvis.ui.theme.*
import com.kr.jarvis.viewmodel.JarvisViewModel

@Composable
fun FocusScreen(
    viewModel: JarvisViewModel,
    modifier: Modifier = Modifier
) {
    val focusState by viewModel.focusState.collectAsState()
    val scrollState = rememberScrollState()

    val minutes = focusState.remainingSeconds / 60
    val seconds = focusState.remainingSeconds % 60
    val timeFormatted = "%02d:%02d".format(minutes, seconds)

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(JarvisBackground)
            .padding(horizontal = 16.dp, vertical = 8.dp)
            .verticalScroll(scrollState),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // --- HEADER ---
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(text = "MÓDULO DE DISCIPLINA // FOCO & ESTUDOS", style = MaterialTheme.typography.labelSmall, color = JarvisCyan)
                Text(text = "Deep Work & Rotina", style = MaterialTheme.typography.titleLarge)
            }
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = if (focusState.isFocusActive) JarvisCyan else JarvisSurfaceVariant
            ) {
                Text(
                    text = if (focusState.isFocusActive) "MODO FOCO ATIVO" else "STANDBY",
                    color = if (focusState.isFocusActive) JarvisBackground else JarvisCyanBright,
                    fontSize = 10.sp,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
        }

        // --- SAFETY EMBLEM (CRITICAL REQUIREMENT) ---
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = JarvisSurface,
            border = androidx.compose.foundation.BorderStroke(1.dp, JarvisEmerald.copy(alpha = 0.5f)),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp)
        ) {
            Row(
                modifier = Modifier.padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Default.VerifiedUser, contentDescription = null, tint = JarvisEmerald, modifier = Modifier.size(22.dp))
                Spacer(modifier = Modifier.width(10.dp))
                Column {
                    Text(text = "PROTOCOLO DE SEGURANÇA KR-OS", style = MaterialTheme.typography.labelSmall, color = JarvisEmerald)
                    Text(
                        text = "Discador telefônico e chamadas de emergência (190, 192, 193) permanecem 100% liberados e imunes a qualquer bloqueio.",
                        style = MaterialTheme.typography.bodyMedium,
                        fontSize = 11.sp
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // --- CIRCULAR TIMER HUD ---
        Box(
            modifier = Modifier
                .size(240.dp)
                .background(JarvisSurface, CircleShape)
                .border(2.dp, if (focusState.isFocusActive) JarvisCyanBright else JarvisBorder, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = focusState.activeSessionTag.uppercase(),
                    style = MaterialTheme.typography.labelSmall,
                    color = JarvisCyan
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = timeFormatted,
                    fontSize = 52.sp,
                    style = MaterialTheme.typography.headlineLarge,
                    color = if (focusState.isFocusActive) JarvisCyanBright else Color.White
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${focusState.sessionsCompletedToday} sessões concluídas hoje",
                    style = MaterialTheme.typography.bodyMedium,
                    fontSize = 11.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // --- CONTROLS ---
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            if (!focusState.isFocusActive) {
                Button(
                    onClick = { FocusRoutineManager.startFocusSession(25, "Estudo & Deep Work") },
                    colors = ButtonDefaults.buttonColors(containerColor = JarvisCyan),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp)
                ) {
                    Icon(Icons.Default.PlayArrow, contentDescription = null, tint = JarvisBackground)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Iniciar Sessão (25m)", color = JarvisBackground, style = MaterialTheme.typography.titleMedium)
                }
            } else {
                Button(
                    onClick = { FocusRoutineManager.stopFocusSession() },
                    colors = ButtonDefaults.buttonColors(containerColor = JarvisSurfaceVariant),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp)
                ) {
                    Icon(Icons.Default.Pause, contentDescription = null, tint = JarvisCyanBright)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Pausar Foco", color = JarvisCyanBright, style = MaterialTheme.typography.titleMedium)
                }

                Button(
                    onClick = { FocusRoutineManager.completeSession() },
                    colors = ButtonDefaults.buttonColors(containerColor = JarvisEmerald),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp)
                ) {
                    Icon(Icons.Default.Check, contentDescription = null, tint = JarvisBackground)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Concluir", color = JarvisBackground, style = MaterialTheme.typography.titleMedium)
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // --- BLOCKED APPS CONFIGURATION ---
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = JarvisSurface,
            border = androidx.compose.foundation.BorderStroke(1.dp, JarvisBorder),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 24.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Block, contentDescription = null, tint = JarvisCyan, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = "Aplicativos em Contenção no Foco", style = MaterialTheme.typography.titleMedium)
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Quando o Modo Foco está ativo, a abertura destes pacotes é redirecionada de volta à tela inicial pelo serviço de acessibilidade.",
                    style = MaterialTheme.typography.bodyMedium,
                    fontSize = 11.sp
                )

                Spacer(modifier = Modifier.height(10.dp))
                focusState.blockedAppsList.forEach { pkg ->
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = JarvisBackground,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 3.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 10.dp, vertical = 6.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(text = pkg, color = JarvisTextPrimary, fontSize = 11.sp)
                            Text(text = "CONTIDO NO FOCO", color = JarvisCyan, fontSize = 9.sp)
                        }
                    }
                }
            }
        }
    }
}
