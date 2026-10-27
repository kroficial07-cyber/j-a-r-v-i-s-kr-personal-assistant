package com.kr.jarvis.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import com.kr.jarvis.modules.content.ContentCreationModule
import com.kr.jarvis.ui.theme.*
import com.kr.jarvis.viewmodel.JarvisViewModel

@Composable
fun ContentCreatorScreen(
    viewModel: JarvisViewModel,
    modifier: Modifier = Modifier
) {
    var topicInput by remember { mutableStateOf("") }
    var selectedFormat by remember { mutableStateOf(ContentCreationModule.ContentFormat.SHORTS_REELS_TIKTOK) }
    var generatedScript by remember { mutableStateOf<ContentCreationModule.VideoScript?>(null) }
    var brainstormedIdeas by remember { mutableStateOf<List<ContentCreationModule.ContentIdea>>(emptyList()) }

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
                Text(text = "ESTÚDIO DE CRIAÇÃO // VÍDEOS & ROTEIROS", style = MaterialTheme.typography.labelSmall, color = JarvisCyan)
                Text(text = "Gerador de Conteúdo & Retenção", style = MaterialTheme.typography.titleLarge)
            }
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = JarvisSurfaceVariant
            ) {
                Text(
                    text = "ALTA RETENÇÃO",
                    color = JarvisCyanBright,
                    fontSize = 10.sp,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
        }

        // --- SECTION 1: TOPIC INPUT & FORMAT ---
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = JarvisSurface,
            border = androidx.compose.foundation.BorderStroke(1.dp, JarvisBorder),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 14.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text(text = "Tema do Vídeo ou Nicho", style = MaterialTheme.typography.titleMedium)
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = topicInput,
                    onValueChange = { topicInput = it },
                    placeholder = { Text("Ex: Produtividade com J.A.R.V.I.S., Hábitos de Sucesso, Automação...", color = JarvisTextSecondary, fontSize = 12.sp) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                )

                Spacer(modifier = Modifier.height(10.dp))
                Text(text = "Formato Desejado", style = MaterialTheme.typography.labelSmall)
                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val formats = listOf(
                        ContentCreationModule.ContentFormat.SHORTS_REELS_TIKTOK to "Shorts / Reels",
                        ContentCreationModule.ContentFormat.YOUTUBE_LONG to "YouTube Longo"
                    )

                    formats.forEach { (fmt, label) ->
                        val isSelected = selectedFormat == fmt
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = if (isSelected) JarvisCyan.copy(alpha = 0.2f) else JarvisSurfaceVariant,
                            border = androidx.compose.foundation.BorderStroke(1.dp, if (isSelected) JarvisCyan else JarvisBorder),
                            modifier = Modifier
                                .weight(1f)
                                .clickable { selectedFormat = fmt }
                        ) {
                            Text(
                                text = label,
                                color = if (isSelected) JarvisCyanBright else JarvisTextSecondary,
                                fontSize = 11.sp,
                                modifier = Modifier.padding(vertical = 8.dp),
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = {
                            val clean = topicInput.ifBlank { "Produtividade e Tecnologia" }
                            generatedScript = ContentCreationModule.generateScript(clean, selectedFormat)
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = JarvisCyan),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.Movie, contentDescription = null, tint = JarvisBackground, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Gerar Roteiro", color = JarvisBackground, fontSize = 12.sp)
                    }

                    OutlinedButton(
                        onClick = {
                            val clean = topicInput.ifBlank { "Produtividade e Tecnologia" }
                            brainstormedIdeas = ContentCreationModule.brainstormIdeas(clean)
                        },
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.Lightbulb, contentDescription = null, tint = JarvisCyan, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Ideias de Tema", color = JarvisCyan, fontSize = 12.sp)
                    }
                }
            }
        }

        // --- BRAINSTORM IDEAS SECTION ---
        if (brainstormedIdeas.isNotEmpty()) {
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = JarvisSurface,
                border = androidx.compose.foundation.BorderStroke(1.dp, JarvisBorderHighlight.copy(alpha = 0.5f)),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 14.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(text = "IDEIAS COM ALTO POTENCIAL DE RETENÇÃO", style = MaterialTheme.typography.labelSmall, color = JarvisCyan)
                    Spacer(modifier = Modifier.height(8.dp))
                    brainstormedIdeas.forEachIndexed { idx, idea ->
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = JarvisBackground,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                                .clickable {
                                    topicInput = idea.theme
                                    selectedFormat = idea.format
                                    generatedScript = ContentCreationModule.generateScript(idea.theme, idea.format)
                                }
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                Text(text = "${idx + 1}. ${idea.theme}", color = Color.White, fontSize = 12.sp, style = MaterialTheme.typography.titleMedium)
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(text = "Ângulo: ${idea.hookAngle} · ${idea.whyItWorks}", color = JarvisTextSecondary, fontSize = 10.sp)
                            }
                        }
                    }
                }
            }
        }

        // --- SCRIPT RESULT SECTION ---
        generatedScript?.let { script ->
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = JarvisSurface,
                border = androidx.compose.foundation.BorderStroke(1.dp, JarvisBorderHighlight),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 24.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(text = "ROTEIRO ESTRUTURADO", style = MaterialTheme.typography.labelSmall, color = JarvisCyan)
                        Text(text = script.format.displayName, color = JarvisCyanBright, fontSize = 10.sp)
                    }

                    Spacer(modifier = Modifier.height(6.dp))
                    Text(text = script.title, style = MaterialTheme.typography.titleLarge)

                    Spacer(modifier = Modifier.height(10.dp))
                    Text(text = "GANCHO DE ABERTURA (PRIMEIROS 3 SEGUNDOS):", style = MaterialTheme.typography.labelSmall, fontSize = 9.sp)
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = JarvisBackground,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp)
                    ) {
                        Text(
                            text = "\"${script.hooks.firstOrNull() ?: ""}\"",
                            color = JarvisCyanBright,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(10.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Text(text = "CORPO DO ROTEIRO:", style = MaterialTheme.typography.labelSmall, fontSize = 9.sp)
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = JarvisBackground,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp)
                    ) {
                        Text(
                            text = script.scriptBody,
                            color = JarvisTextPrimary,
                            fontSize = 11.sp,
                            modifier = Modifier.padding(10.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Text(text = "CALL TO ACTION (CTA):", style = MaterialTheme.typography.labelSmall, fontSize = 9.sp)
                    Text(text = script.callToAction, color = JarvisTextSecondary, fontSize = 11.sp)

                    Spacer(modifier = Modifier.height(8.dp))
                    Text(text = "SUGESTÃO DE THUMBNAIL:", style = MaterialTheme.typography.labelSmall, fontSize = 9.sp)
                    Text(text = script.thumbnailIdea, color = JarvisCyan, fontSize = 11.sp)

                    Spacer(modifier = Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedButton(
                            onClick = {
                                val fullText = "${script.title}\n\nGANCHO:\n${script.hooks.firstOrNull()}\n\nROTEIRO:\n${script.scriptBody}\n\nCTA:\n${script.callToAction}\n\nTHUMBNAIL:\n${script.thumbnailIdea}"
                                clipboardManager.setText(AnnotatedString(fullText))
                                viewModel.showInfo("Roteiro copiado!")
                            },
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.ContentCopy, contentDescription = null, tint = JarvisCyan, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Copiar Roteiro", color = JarvisCyan, fontSize = 11.sp)
                        }

                        Button(
                            onClick = {
                                viewModel.addMemory(
                                    title = "Roteiro: ${script.title}",
                                    content = script.scriptBody,
                                    category = "roteiro"
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
