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
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kr.jarvis.modules.krdigital.KrDigitalModule
import com.kr.jarvis.ui.theme.*
import com.kr.jarvis.viewmodel.JarvisViewModel

@Composable
fun KrDigitalScreen(
    viewModel: JarvisViewModel,
    modifier: Modifier = Modifier
) {
    var conversationInput by remember { mutableStateOf("") }
    var clientName by remember { mutableStateOf("Cliente") }
    var analysisResult by remember { mutableStateOf<KrDigitalModule.AnalysisResult?>(null) }
    var proposalDraft by remember { mutableStateOf<KrDigitalModule.ProposalDraft?>(null) }
    var selectedProjectType by remember { mutableStateOf("Site Institucional Completo") }

    val clipboardManager = LocalClipboardManager.current
    val scrollState = rememberScrollState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(JarvisBackground)
            .padding(horizontal = 16.dp, vertical = 8.dp)
            .verticalScroll(scrollState)
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
                Text(text = "MÓDULO COMERCIAL // KR DIGITAL", style = MaterialTheme.typography.labelSmall, color = JarvisCyan)
                Text(text = "Inteligência de Vendas & Clientes", style = MaterialTheme.typography.titleLarge)
            }
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = JarvisSurfaceVariant
            ) {
                Text(
                    text = "KR DIGITAL OS",
                    color = JarvisCyanBright,
                    fontSize = 10.sp,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
        }

        // --- SECTION 1: ANALISADOR DE CONVERSA COM CLIENTE ---
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = JarvisSurface,
            border = androidx.compose.foundation.BorderStroke(1.dp, JarvisBorder),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.SupportAgent, contentDescription = null, tint = JarvisCyan, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = "Análise de Conversa com Cliente", style = MaterialTheme.typography.titleMedium)
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Cole o trecho da conversa do WhatsApp para identificar o estágio e sugerir respostas sem agressividade comercial.",
                    style = MaterialTheme.typography.bodyMedium,
                    fontSize = 11.sp
                )

                Spacer(modifier = Modifier.height(10.dp))
                OutlinedTextField(
                    value = clientName,
                    onValueChange = { clientName = it },
                    label = { Text("Nome do Cliente / Empresa") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = conversationInput,
                    onValueChange = { conversationInput = it },
                    label = { Text("Texto da conversa ou solicitação...") },
                    placeholder = { Text("Ex: Olá, gostaria de saber quanto custa para fazer um site institucional para minha clínica...", color = JarvisTextSecondary, fontSize = 12.sp) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(110.dp),
                    shape = RoundedCornerShape(10.dp)
                )

                Spacer(modifier = Modifier.height(10.dp))
                Button(
                    onClick = {
                        if (conversationInput.isNotBlank()) {
                            analysisResult = KrDigitalModule.analyzeConversation(conversationInput, clientName)
                            viewModel.showInfo("Conversa analisada com sucesso pelo módulo KR Digital.")
                        }
                    },
                    enabled = conversationInput.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(containerColor = JarvisCyan),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Psychology, contentDescription = null, tint = JarvisBackground, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Analisar Conversa & Gerar Resposta", color = JarvisBackground, fontSize = 12.sp)
                }

                // Exibição do Resultado da Análise
                analysisResult?.let { res ->
                    Spacer(modifier = Modifier.height(14.dp))
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = JarvisBackground,
                        border = androidx.compose.foundation.BorderStroke(1.dp, JarvisBorderHighlight),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(text = "ESTÁGIO DETECTADO", style = MaterialTheme.typography.labelSmall, fontSize = 9.sp)
                                Text(text = res.sentiment, color = JarvisCyanBright, fontSize = 10.sp)
                            }
                            Text(text = res.stage.displayName, style = MaterialTheme.typography.titleMedium, color = Color.White)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = res.stage.description, style = MaterialTheme.typography.bodyMedium, fontSize = 11.sp)

                            Spacer(modifier = Modifier.height(8.dp))
                            Text(text = "RESPOSTA RECOMENDADA (SEM PRESSÃO COMERCIAL):", style = MaterialTheme.typography.labelSmall, fontSize = 9.sp, color = JarvisCyan)
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = JarvisSurface,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp)
                            ) {
                                Text(
                                    text = "\"${res.suggestedResponse}\"",
                                    color = JarvisTextPrimary,
                                    fontSize = 12.sp,
                                    modifier = Modifier.padding(8.dp)
                                )
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.End
                            ) {
                                OutlinedButton(
                                    onClick = {
                                        clipboardManager.setText(AnnotatedString(res.suggestedResponse))
                                        viewModel.showInfo("Resposta copiada para a área de transferência!")
                                    },
                                    shape = RoundedCornerShape(8.dp),
                                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                                ) {
                                    Icon(Icons.Default.ContentCopy, contentDescription = null, tint = JarvisCyan, modifier = Modifier.size(14.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Copiar Resposta", color = JarvisCyan, fontSize = 11.sp)
                                }
                            }
                        }
                    }
                }
            }
        }

        // --- SECTION 2: GERADOR DE PROPOSTAS COMERCIAIS ---
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
                    Icon(Icons.Default.Description, contentDescription = null, tint = JarvisCyan, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = "Elaboração de Propostas e Orçamentos", style = MaterialTheme.typography.titleMedium)
                }

                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val projectTypes = listOf("Site Institucional", "Landing Page", "Automação KR")
                    projectTypes.forEach { type ->
                        val isSelected = selectedProjectType.contains(type)
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = if (isSelected) JarvisCyan.copy(alpha = 0.2f) else JarvisSurfaceVariant,
                            border = androidx.compose.foundation.BorderStroke(1.dp, if (isSelected) JarvisCyan else JarvisBorder),
                            modifier = Modifier
                                .weight(1f)
                                .clickable { selectedProjectType = type }
                        ) {
                            Text(
                                text = type,
                                color = if (isSelected) JarvisCyanBright else JarvisTextSecondary,
                                fontSize = 11.sp,
                                modifier = Modifier.padding(vertical = 8.dp, horizontal = 4.dp),
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
                Button(
                    onClick = {
                        proposalDraft = KrDigitalModule.generateProposal(
                            clientName = clientName.ifBlank { "Cliente KR Digital" },
                            projectType = selectedProjectType
                        )
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = JarvisCyan),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Calculate, contentDescription = null, tint = JarvisBackground, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Gerar Estrutura de Proposta", color = JarvisBackground, fontSize = 12.sp)
                }

                proposalDraft?.let { prop ->
                    Spacer(modifier = Modifier.height(12.dp))
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = JarvisBackground,
                        border = androidx.compose.foundation.BorderStroke(1.dp, JarvisBorderHighlight),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(text = "RASCUNHO GERADO:", style = MaterialTheme.typography.labelSmall, color = JarvisCyan)
                            Text(
                                text = prop.formattedSummary,
                                color = JarvisTextPrimary,
                                fontSize = 11.sp,
                                modifier = Modifier.padding(vertical = 6.dp)
                            )

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                OutlinedButton(
                                    onClick = {
                                        clipboardManager.setText(AnnotatedString(prop.formattedSummary))
                                        viewModel.showInfo("Proposta copiada para a área de transferência!")
                                    },
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(Icons.Default.ContentCopy, contentDescription = null, tint = JarvisCyan, modifier = Modifier.size(14.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Copiar Proposta", color = JarvisCyan, fontSize = 11.sp)
                                }

                                Button(
                                    onClick = {
                                        viewModel.addMemory(
                                            title = "Proposta KR Digital: ${prop.clientName}",
                                            content = prop.formattedSummary,
                                            category = "proposta"
                                        )
                                    },
                                    shape = RoundedCornerShape(8.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = JarvisSurfaceVariant),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(Icons.Default.Save, contentDescription = null, tint = JarvisCyanBright, modifier = Modifier.size(14.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Salvar na Memória", color = JarvisCyanBright, fontSize = 11.sp)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
