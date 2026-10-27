package com.kr.jarvis.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kr.jarvis.ui.components.NeuralCoreCanvas
import com.kr.jarvis.ui.theme.*
import com.kr.jarvis.viewmodel.AssistantState
import com.kr.jarvis.viewmodel.JarvisViewModel

@Composable
fun HomeScreen(
    viewModel: JarvisViewModel,
    onNavigateToTab: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val missions by viewModel.missions.collectAsState()
    val memories by viewModel.memories.collectAsState()

    val completedMissions = missions.count { it.completed }
    val totalMissions = missions.size
    val missionProgress = if (totalMissions > 0) completedMissions.toFloat() / totalMissions else 0f

    val quickCommands = listOf(
        "Status do sistema",
        "Modo foco",
        "Analisa essa conversa com cliente",
        "Ideia de vídeo",
        "Roteiro curto",
        "Proposta comercial",
        "Que horas são",
        "Abrir WhatsApp",
        "Minhas tarefas"
    )

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(JarvisBackground)
            .padding(horizontal = 16.dp, vertical = 8.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // --- TOP HUD BAR ---
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Memory,
                        contentDescription = null,
                        tint = JarvisCyan,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "J.A.R.V.I.S. // KR-OS v1.0",
                        style = MaterialTheme.typography.labelSmall
                    )
                }
                Text(
                    text = "${uiState.greeting}, SENHOR ${uiState.userName}",
                    style = MaterialTheme.typography.titleLarge
                )
            }

            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = uiState.currentTimeFormatted.ifEmpty { "--:--:--" },
                    style = MaterialTheme.typography.titleMedium,
                    color = JarvisCyanBright
                )
                Text(
                    text = uiState.currentDateFormatted.ifEmpty { "---" },
                    style = MaterialTheme.typography.bodyMedium,
                    fontSize = 11.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // --- CENTER NEURAL CORE ---
        Box(
            modifier = Modifier.size(260.dp),
            contentAlignment = Alignment.Center
        ) {
            NeuralCoreCanvas(
                state = uiState.assistantState,
                audioLevel = uiState.audioLevel,
                onClick = { viewModel.toggleVoiceInteraction() },
                modifier = Modifier.fillMaxSize(),
                lowPowerMode = uiState.lowPowerMode
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        // --- CENTRAL VOICE TRIGGER BUTTON ---
        Button(
            onClick = { viewModel.toggleVoiceInteraction() },
            colors = ButtonDefaults.buttonColors(
                containerColor = if (uiState.assistantState == AssistantState.LISTENING) JarvisCyan else JarvisSurface
            ),
            shape = CircleShape,
            modifier = Modifier
                .height(52.dp)
                .border(
                    width = 1.dp,
                    color = if (uiState.assistantState == AssistantState.LISTENING) JarvisCyanBright else JarvisBorderHighlight,
                    shape = CircleShape
                )
        ) {
            Icon(
                imageVector = if (uiState.assistantState == AssistantState.LISTENING) Icons.Default.MicOff else Icons.Default.Mic,
                contentDescription = "Microfone",
                tint = if (uiState.assistantState == AssistantState.LISTENING) JarvisBackground else JarvisCyanBright
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = when (uiState.assistantState) {
                    AssistantState.LISTENING -> "OUVINDO (PT-BR)..."
                    AssistantState.PROCESSING -> "PROCESSANDO..."
                    AssistantState.SPEAKING -> "RESPONDENDO..."
                    AssistantState.IDLE -> "ATIVAR VOZ (PT-BR)"
                },
                color = if (uiState.assistantState == AssistantState.LISTENING) JarvisBackground else JarvisCyanBright,
                style = MaterialTheme.typography.titleMedium
            )
        }

        Text(
            text = "Toque no núcleo ou botão para falar em português",
            style = MaterialTheme.typography.bodyMedium,
            fontSize = 11.sp,
            modifier = Modifier.padding(top = 6.dp)
        )

        Spacer(modifier = Modifier.height(20.dp))

        // --- METRIC CARDS ---
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Missions Card
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(16.dp))
                    .background(JarvisSurface)
                    .border(1.dp, JarvisBorder, RoundedCornerShape(16.dp))
                    .clickable { onNavigateToTab(5) } // Missions tab
                    .padding(12.dp)
            ) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(text = "MISSÕES", style = MaterialTheme.typography.labelSmall)
                        Text(text = "${(missionProgress * 100).toInt()}%", color = JarvisCyanBright, fontSize = 11.sp)
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "$completedMissions / $totalMissions",
                        style = MaterialTheme.typography.headlineMedium,
                        color = Color.White
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    LinearProgressIndicator(
                        progress = missionProgress,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(4.dp)
                            .clip(CircleShape),
                        color = JarvisCyan,
                        trackColor = JarvisSurfaceVariant,
                    )
                }
            }

            // Memory Card
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(16.dp))
                    .background(JarvisSurface)
                    .border(1.dp, JarvisBorder, RoundedCornerShape(16.dp))
                    .clickable { onNavigateToTab(6) } // Memory tab
                    .padding(12.dp)
            ) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(text = "MEMÓRIA", style = MaterialTheme.typography.labelSmall, color = JarvisBlue)
                        Text(text = "OFFLINE", color = JarvisBlue, fontSize = 11.sp)
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "${memories.size} notas",
                        style = MaterialTheme.typography.headlineMedium,
                        color = Color.White
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Preferências salvas",
                        style = MaterialTheme.typography.bodyMedium,
                        fontSize = 11.sp
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Module Quick Access Tiles
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = JarvisSurface,
                border = androidx.compose.foundation.BorderStroke(1.dp, JarvisBorder),
                modifier = Modifier
                    .weight(1f)
                    .clickable { onNavigateToTab(2) }
            ) {
                Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.SupportAgent, contentDescription = null, tint = JarvisCyan, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("KR Digital", fontSize = 11.sp, color = Color.White, style = MaterialTheme.typography.titleMedium)
                }
            }

            Surface(
                shape = RoundedCornerShape(12.dp),
                color = JarvisSurface,
                border = androidx.compose.foundation.BorderStroke(1.dp, JarvisBorder),
                modifier = Modifier
                    .weight(1f)
                    .clickable { onNavigateToTab(3) }
            ) {
                Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.Movie, contentDescription = null, tint = JarvisCyan, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Criador", fontSize = 11.sp, color = Color.White, style = MaterialTheme.typography.titleMedium)
                }
            }

            Surface(
                shape = RoundedCornerShape(12.dp),
                color = JarvisSurface,
                border = androidx.compose.foundation.BorderStroke(1.dp, JarvisBorder),
                modifier = Modifier
                    .weight(1f)
                    .clickable { onNavigateToTab(4) }
            ) {
                Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.Timer, contentDescription = null, tint = JarvisCyan, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Modo Foco", fontSize = 11.sp, color = Color.White, style = MaterialTheme.typography.titleMedium)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // --- QUICK COMMANDS CAROUSEL ---
        Column(modifier = Modifier.fillMaxWidth()) {
            Text(
                text = "COMANDOS RÁPIDOS",
                style = MaterialTheme.typography.labelSmall,
                modifier = Modifier.padding(bottom = 8.dp)
            )

            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                items(quickCommands) { cmd ->
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = JarvisSurface,
                        border = androidx.compose.foundation.BorderStroke(1.dp, JarvisBorder),
                        modifier = Modifier.clickable {
                            viewModel.processUserCommand(cmd, isVoice = false)
                        }
                    ) {
                        Text(
                            text = cmd,
                            color = JarvisTextPrimary,
                            style = MaterialTheme.typography.bodyMedium,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))
    }
}
