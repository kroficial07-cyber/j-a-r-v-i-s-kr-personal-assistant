package com.kr.jarvis.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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
import com.kr.jarvis.data.local.MissionEntity
import com.kr.jarvis.ui.theme.*
import com.kr.jarvis.viewmodel.JarvisViewModel

@Composable
fun MissionsScreen(
    viewModel: JarvisViewModel,
    modifier: Modifier = Modifier
) {
    val missions by viewModel.missions.collectAsState()
    var selectedCategory by remember { mutableStateOf("all") }
    var showAddDialog by remember { mutableStateOf(false) }

    val categories = listOf("all" to "TODAS", "foco" to "FOCO", "saude" to "SAÚDE", "estudo" to "ESTUDO", "sistema" to "SISTEMA")

    val filteredMissions = missions.filter {
        if (selectedCategory == "all") true else it.category == selectedCategory
    }

    val completedCount = missions.count { it.completed }
    val totalCount = missions.size
    val progress = if (totalCount > 0) completedCount.toFloat() / totalCount else 0f

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(JarvisBackground)
            .padding(horizontal = 16.dp, vertical = 8.dp)
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
                Text(text = "MÓDULO DE MISSÕES OPERACIONAIS", style = MaterialTheme.typography.labelSmall)
                Text(text = "Metas & Diretrizes", style = MaterialTheme.typography.titleLarge)
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(
                    onClick = { viewModel.renewDailyMissions() },
                    shape = RoundedCornerShape(10.dp),
                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    Icon(imageVector = Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Renovar", fontSize = 11.sp)
                }

                Button(
                    onClick = { showAddDialog = true },
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = JarvisCyan),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Icon(imageVector = Icons.Default.Add, contentDescription = null, tint = JarvisBackground, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Nova", color = JarvisBackground, fontSize = 12.sp)
                }
            }
        }

        // --- PROGRESS SUMMARY CARD ---
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = JarvisSurface,
            border = androidx.compose.foundation.BorderStroke(1.dp, JarvisBorder),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(text = "CONFORMIDADE OPERACIONAL", style = MaterialTheme.typography.labelSmall)
                    Text(text = "${(progress * 100).toInt()}% CONCLUÍDO", color = JarvisCyanBright, style = MaterialTheme.typography.labelSmall)
                }
                Spacer(modifier = Modifier.height(8.dp))
                LinearProgressIndicator(
                    progress = { progress },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(6.dp)
                        .clip(CircleShape),
                    color = JarvisCyan,
                    trackColor = JarvisSurfaceVariant
                )
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(text = "$completedCount concluídas / ${totalCount - completedCount} pendentes", style = MaterialTheme.typography.bodyMedium, fontSize = 11.sp)
                    Text(text = "Renovação: 00:00", style = MaterialTheme.typography.bodyMedium, fontSize = 11.sp, color = JarvisCyan)
                }
            }
        }

        // --- CATEGORY TABS ---
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp)
        ) {
            items(categories) { (key, label) ->
                val isSelected = selectedCategory == key
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = if (isSelected) JarvisCyan.copy(alpha = 0.2f) else JarvisSurface,
                    border = androidx.compose.foundation.BorderStroke(1.dp, if (isSelected) JarvisCyan else JarvisBorder),
                    modifier = Modifier.clickable { selectedCategory = key }
                ) {
                    Text(
                        text = label,
                        color = if (isSelected) JarvisCyanBright else JarvisTextSecondary,
                        style = MaterialTheme.typography.bodyMedium,
                        fontSize = 11.sp,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                    )
                }
            }
        }

        // --- MISSIONS LIST ---
        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.weight(1f)
        ) {
            items(filteredMissions, key = { it.id }) { mission ->
                MissionItemCard(
                    mission = mission,
                    onToggle = { viewModel.toggleMission(mission) },
                    onDelete = { viewModel.deleteMission(mission.id) }
                )
            }
        }
    }

    if (showAddDialog) {
        AddMissionDialog(
            onDismiss = { showAddDialog = false },
            onConfirm = { t, d, c, p, daily ->
                viewModel.addMission(t, d, c, p, daily)
                showAddDialog = false
            }
        )
    }
}

@Composable
fun MissionItemCard(
    mission: MissionEntity,
    onToggle: () -> Unit,
    onDelete: () -> Unit
) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = if (mission.completed) JarvisBackground else JarvisSurface,
        border = androidx.compose.foundation.BorderStroke(1.dp, if (mission.completed) JarvisBorder else JarvisBorderHighlight.copy(alpha = 0.3f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onToggle) {
                Icon(
                    imageVector = if (mission.completed) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                    contentDescription = null,
                    tint = if (mission.completed) JarvisEmerald else JarvisCyanBright
                )
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = mission.title,
                    style = MaterialTheme.typography.titleMedium,
                    color = if (mission.completed) JarvisTextSecondary else JarvisTextPrimary
                )
                if (mission.description.isNotBlank()) {
                    Text(
                        text = mission.description,
                        style = MaterialTheme.typography.bodyMedium,
                        fontSize = 11.sp
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(text = mission.category.uppercase(), style = MaterialTheme.typography.labelSmall, fontSize = 9.sp)
                    Text(text = "·", color = JarvisTextSecondary)
                    Text(
                        text = if (mission.isDaily) "DIÁRIA" else "ÚNICA",
                        color = if (mission.isDaily) JarvisCyan else JarvisTextSecondary,
                        fontSize = 9.sp
                    )
                }
            }

            IconButton(onClick = onDelete) {
                Icon(imageVector = Icons.Default.DeleteOutline, contentDescription = "Remover", tint = JarvisTextSecondary, modifier = Modifier.size(18.dp))
            }
        }
    }
}

@Composable
fun AddMissionDialog(
    onDismiss: () -> Unit,
    onConfirm: (title: String, desc: String, category: String, priority: String, isDaily: Boolean) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var desc by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("foco") }
    var priority by remember { mutableStateOf("media") }
    var isDaily by remember { mutableStateOf(true) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Cadastrar Nova Missão") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Título da Missão") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = desc,
                    onValueChange = { desc = it },
                    label = { Text("Instruções / Descrição") },
                    modifier = Modifier.fillMaxWidth()
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = isDaily, onCheckedChange = { isDaily = it })
                    Text("Missão diária (renova todo dia)", fontSize = 12.sp)
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { if (title.isNotBlank()) onConfirm(title, desc, category, priority, isDaily) },
                enabled = title.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = JarvisCyan)
            ) {
                Text("Confirmar", color = JarvisBackground)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancelar") }
        },
        containerColor = JarvisSurface
    )
}
