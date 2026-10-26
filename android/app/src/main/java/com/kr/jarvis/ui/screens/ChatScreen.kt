package com.kr.jarvis.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kr.jarvis.data.local.ChatMessageEntity
import com.kr.jarvis.ui.theme.*
import com.kr.jarvis.viewmodel.AssistantState
import com.kr.jarvis.viewmodel.JarvisViewModel
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun ChatScreen(
    viewModel: JarvisViewModel,
    modifier: Modifier = Modifier
) {
    val messages by viewModel.messages.collectAsState()
    val uiState by viewModel.uiState.collectAsState()
    var inputText by remember { mutableStateOf("") }
    var showClearConfirm by remember { mutableStateOf(false) }

    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(messages.size, uiState.interimTranscript) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(JarvisBackground)
            .padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
        // --- CHAT HEADER ---
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(text = "CANAL DE COMUNICAÇÃO NEURAL", style = MaterialTheme.typography.titleMedium)
                Text(
                    text = when (uiState.assistantState) {
                        AssistantState.LISTENING -> "ESCUTANDO COMANDO DE VOZ (PT-BR)..."
                        AssistantState.PROCESSING -> "PROCESSANDO RESPOSTA..."
                        AssistantState.SPEAKING -> "FALANDO EM PORTUGUÊS..."
                        AssistantState.IDLE -> "PRONTO // STANDBY"
                    },
                    style = MaterialTheme.typography.labelSmall
                )
            }

            IconButton(onClick = { showClearConfirm = true }) {
                Icon(imageVector = Icons.Default.DeleteOutline, contentDescription = "Limpar", tint = JarvisTextSecondary)
            }
        }

        // --- MESSAGE FEED ---
        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(messages, key = { it.id }) { msg ->
                ChatMessageBubble(
                    message = msg,
                    onSpeak = { viewModel.speak(msg.text) }
                )
            }

            // Interim speech bubble
            if (uiState.assistantState == AssistantState.LISTENING && uiState.interimTranscript.isNotEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(start = 40.dp),
                        contentAlignment = Alignment.CenterEnd
                    ) {
                        Surface(
                            shape = RoundedCornerShape(16.dp, 4.dp, 16.dp, 16.dp),
                            color = JarvisSurfaceVariant,
                            border = androidx.compose.foundation.BorderStroke(1.dp, JarvisCyanBright)
                        ) {
                            Text(
                                text = "\"${uiState.interimTranscript}...\"",
                                color = JarvisCyanBright,
                                style = MaterialTheme.typography.bodyMedium,
                                modifier = Modifier.padding(12.dp)
                            )
                        }
                    }
                }
            }
        }

        // --- INPUT BAR ---
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 8.dp, bottom = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Voice Mic Button
            IconButton(
                onClick = { viewModel.toggleVoiceInteraction() },
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(if (uiState.assistantState == AssistantState.LISTENING) JarvisCyan else JarvisSurface)
                    .border(1.dp, JarvisBorderHighlight, RoundedCornerShape(12.dp))
            ) {
                Icon(
                    imageVector = if (uiState.assistantState == AssistantState.LISTENING) Icons.Default.MicOff else Icons.Default.Mic,
                    contentDescription = "Falar",
                    tint = if (uiState.assistantState == AssistantState.LISTENING) JarvisBackground else JarvisCyanBright
                )
            }

            Spacer(modifier = Modifier.width(8.dp))

            // Text input field
            OutlinedTextField(
                value = inputText,
                onValueChange = { inputText = it },
                placeholder = { Text("Digite um comando para o J.A.R.V.I.S....", color = JarvisTextSecondary, fontSize = 13.sp) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = JarvisCyan,
                    unfocusedBorderColor = JarvisBorder,
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedContainerColor = JarvisSurface,
                    unfocusedContainerColor = JarvisSurface
                ),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.weight(1f)
            )

            Spacer(modifier = Modifier.width(8.dp))

            // Send Button
            IconButton(
                onClick = {
                    if (inputText.isNotBlank()) {
                        viewModel.processUserCommand(inputText, isVoice = false)
                        inputText = ""
                    }
                },
                enabled = inputText.isNotBlank(),
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(if (inputText.isNotBlank()) JarvisCyan else JarvisSurfaceVariant)
            ) {
                Icon(
                    imageVector = Icons.Default.Send,
                    contentDescription = "Enviar",
                    tint = if (inputText.isNotBlank()) JarvisBackground else JarvisTextSecondary
                )
            }
        }
    }

    if (showClearConfirm) {
        AlertDialog(
            onDismissRequest = { showClearConfirm = false },
            title = { Text("Limpar Histórico") },
            text = { Text("Deseja apagar todas as mensagens da conversa persistidas localmente?") },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.clearChat()
                    showClearConfirm = false
                }) {
                    Text("Limpar", color = JarvisRed)
                }
            },
            dismissButton = {
                TextButton(onClick = { showClearConfirm = false }) {
                    Text("Cancelar", color = JarvisTextPrimary)
                }
            },
            containerColor = JarvisSurface
        )
    }
}

@Composable
fun ChatMessageBubble(
    message: ChatMessageEntity,
    onSpeak: () -> Unit
) {
    val isUser = message.sender == "user"
    val timeStr = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date(message.timestamp))

    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = if (isUser) Alignment.End else Alignment.Start
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = if (isUser) "VOCÊ" else "J.A.R.V.I.S.",
                style = MaterialTheme.typography.labelSmall,
                color = if (isUser) JarvisCyanBright else JarvisBlue
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = timeStr,
                style = MaterialTheme.typography.bodyMedium,
                fontSize = 10.sp
            )
        }

        Spacer(modifier = Modifier.height(2.dp))

        Surface(
            shape = if (isUser) RoundedCornerShape(16.dp, 4.dp, 16.dp, 16.dp) else RoundedCornerShape(4.dp, 16.dp, 16.dp, 16.dp),
            color = if (isUser) Color(0xFF082F49) else JarvisSurface,
            border = androidx.compose.foundation.BorderStroke(
                1.dp,
                if (isUser) JarvisCyan.copy(alpha = 0.4f) else JarvisBorder
            ),
            modifier = Modifier.widthIn(max = 300.dp)
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text(
                    text = message.text,
                    style = MaterialTheme.typography.bodyLarge,
                    fontSize = 14.sp
                )

                if (!isUser) {
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        TextButton(
                            onClick = onSpeak,
                            contentPadding = PaddingValues(0.dp),
                            modifier = Modifier.height(28.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.VolumeUp,
                                contentDescription = "Ouvir",
                                tint = JarvisCyan,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(text = "Ouvir Resposta", color = JarvisCyan, fontSize = 11.sp)
                        }
                    }
                }
            }
        }
    }
}
