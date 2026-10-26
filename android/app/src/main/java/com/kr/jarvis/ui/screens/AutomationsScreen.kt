package com.kr.jarvis.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kr.jarvis.data.local.AutomationRuleEntity
import com.kr.jarvis.service.JarvisAccessibilityService
import com.kr.jarvis.ui.theme.*
import com.kr.jarvis.viewmodel.JarvisViewModel

@Composable
fun AutomationsScreen(
    viewModel: JarvisViewModel,
    modifier: Modifier = Modifier
) {
    val automations by viewModel.automations.collectAsState()
    val context = LocalContext.current
    val isAccessibilityActive = JarvisAccessibilityService.isRunning

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(JarvisBackground)
            .padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
        // --- HEADER ---
        Column(modifier = Modifier.padding(bottom = 12.dp)) {
            Text(text = "MÓDULO DE AUTOMAÇÃO E INTENTS", style = MaterialTheme.typography.labelSmall)
            Text(text = "Motor de Gatilhos & Serviços", style = MaterialTheme.typography.titleLarge)
            Text(
                text = "Integração segura com Accessibility Service e abertura de apps.",
                style = MaterialTheme.typography.bodyMedium,
                fontSize = 11.sp
            )
        }

        // --- ACCESSIBILITY STATUS BANNER ---
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = JarvisSurface,
            border = androidx.compose.foundation.BorderStroke(
                1.dp,
                if (isAccessibilityActive) JarvisEmerald else JarvisCyan.copy(alpha = 0.5f)
            ),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 14.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = if (isAccessibilityActive) Icons.Default.CheckCircle else Icons.Default.Security,
                            contentDescription = null,
                            tint = if (isAccessibilityActive) JarvisEmerald else JarvisCyan
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "JarvisAccessibilityService",
                            style = MaterialTheme.typography.titleMedium
                        )
                    }

                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = if (isAccessibilityActive) JarvisEmerald.copy(alpha = 0.2f) else JarvisSurfaceVariant
                    ) {
                        Text(
                            text = if (isAccessibilityActive) "ATIVO" else "AGUARDANDO",
                            color = if (isAccessibilityActive) JarvisEmerald else JarvisCyanBright,
                            fontSize = 10.sp,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = if (isAccessibilityActive) {
                        "O serviço de acessibilidade está autorizado pelo Senhor KR. Automações de clique e navegação no Android estão habilitadas."
                    } else {
                        "Para que o JARVIS execute toques e ações fora do aplicativo, ative o serviço nas Configurações de Acessibilidade do seu aparelho."
                    },
                    style = MaterialTheme.typography.bodyMedium,
                    fontSize = 12.sp
                )

                if (!isAccessibilityActive) {
                    Spacer(modifier = Modifier.height(10.dp))
                    Button(
                        onClick = { JarvisAccessibilityService.openAccessibilitySettings(context) },
                        colors = ButtonDefaults.buttonColors(containerColor = JarvisCyan),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Settings, contentDescription = null, tint = JarvisBackground, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Abrir Configurações de Acessibilidade", color = JarvisBackground, fontSize = 12.sp)
                    }
                }
            }
        }

        // --- AUTOMATIONS LIST ---
        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.weight(1f)
        ) {
            items(automations, key = { it.id }) { rule ->
                AutomationItemCard(
                    rule = rule,
                    onToggle = { viewModel.toggleAutomation(rule) },
                    onTest = { viewModel.testAutomation(rule) }
                )
            }
        }
    }
}

@Composable
fun AutomationItemCard(
    rule: AutomationRuleEntity,
    onToggle: () -> Unit,
    onTest: () -> Unit
) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = JarvisSurface,
        border = androidx.compose.foundation.BorderStroke(1.dp, JarvisBorder),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(text = rule.name, style = MaterialTheme.typography.titleMedium)
                    Text(
                        text = rule.description,
                        style = MaterialTheme.typography.bodyMedium,
                        fontSize = 11.sp
                    )
                }
                Switch(
                    checked = rule.enabled,
                    onCheckedChange = { onToggle() },
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = JarvisCyanBright,
                        checkedTrackColor = JarvisSurfaceVariant
                    )
                )
            }

            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(JarvisBackground, RoundedCornerShape(8.dp))
                    .padding(8.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(text = "GATILHO", style = MaterialTheme.typography.labelSmall, fontSize = 9.sp)
                    Text(text = rule.triggerDetails, style = MaterialTheme.typography.bodyMedium, fontSize = 11.sp, color = JarvisCyanBright)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(text = "AÇÃO", style = MaterialTheme.typography.labelSmall, fontSize = 9.sp)
                    Text(text = rule.actionDetails, style = MaterialTheme.typography.bodyMedium, fontSize = 11.sp)
                }
            }

            Spacer(modifier = Modifier.height(10.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                OutlinedButton(
                    onClick = onTest,
                    shape = RoundedCornerShape(8.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
                ) {
                    Icon(Icons.Default.PlayArrow, contentDescription = null, tint = JarvisCyan, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Testar Ação", color = JarvisCyan, fontSize = 11.sp)
                }
            }
        }
    }
}
