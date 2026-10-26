package com.kr.jarvis.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kr.jarvis.data.local.MemoryEntity
import com.kr.jarvis.ui.theme.*
import com.kr.jarvis.viewmodel.JarvisViewModel
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun MemoryScreen(
    viewModel: JarvisViewModel,
    modifier: Modifier = Modifier
) {
    val memories by viewModel.memories.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("all") }
    var showAddDialog by remember { mutableStateOf(false) }

    val categories = listOf("all" to "TODAS", "preferencia" to "PREFERÊNCIAS", "diretriz" to "DIRETRIZES", "fato" to "FATOS", "nota" to "NOTAS")

    val filteredMemories = memories.filter {
        val matchesCategory = if (selectedCategory == "all") true else it.category == selectedCategory
        val matchesSearch = it.title.contains(searchQuery, ignoreCase = true) || it.content.contains(searchQuery, ignoreCase = true)
        matchesCategory && matchesSearch
    }

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
                Text(text = "ARQUIVO NEURAL LOCAL", style = MaterialTheme.typography.labelSmall)
                Text(text = "Memória do Usuário KR", style = MaterialTheme.typography.titleLarge)
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

        // --- SEARCH BAR ---
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Buscar preferências ou diretrizes...", color = JarvisTextSecondary, fontSize = 12.sp) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = JarvisTextSecondary) },
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = JarvisCyan,
                unfocusedBorderColor = JarvisBorder,
                focusedContainerColor = JarvisSurface,
                unfocusedContainerColor = JarvisSurface,
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White
            ),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 8.dp)
        )

        // --- CATEGORY CHIPS ---
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

        // --- MEMORIES FEED ---
        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.weight(1f)
        ) {
            items(filteredMemories, key = { it.id }) { memory ->
                MemoryItemCard(
                    memory = memory,
                    onDelete = { viewModel.deleteMemory(memory.id) }
                )
            }
        }
    }

    if (showAddDialog) {
        AddMemoryDialog(
            onDismiss = { showAddDialog = false },
            onConfirm = { t, c, cat ->
                viewModel.addMemory(t, c, cat)
                showAddDialog = false
            }
        )
    }
}

@Composable
fun MemoryItemCard(
    memory: MemoryEntity,
    onDelete: () -> Unit
) {
    val dateStr = SimpleDateFormat("dd MMM yyyy", Locale("pt", "BR")).format(Date(memory.updatedAt))

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
                Text(text = memory.title, style = MaterialTheme.typography.titleMedium, color = Color.White)
                Text(text = memory.category.uppercase(), style = MaterialTheme.typography.labelSmall, fontSize = 10.sp)
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = memory.content,
                style = MaterialTheme.typography.bodyMedium,
                color = JarvisTextSecondary,
                fontSize = 13.sp
            )
            Spacer(modifier = Modifier.height(10.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = "Salvo em: $dateStr", style = MaterialTheme.typography.bodyMedium, fontSize = 10.sp)
                IconButton(onClick = onDelete, modifier = Modifier.size(24.dp)) {
                    Icon(Icons.Default.DeleteOutline, contentDescription = "Excluir", tint = JarvisTextSecondary, modifier = Modifier.size(16.dp))
                }
            }
        }
    }
}

@Composable
fun AddMemoryDialog(
    onDismiss: () -> Unit,
    onConfirm: (title: String, content: String, category: String) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var content by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("nota") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Novo Registro de Memória") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Título do Registro") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = content,
                    onValueChange = { content = it },
                    label = { Text("Conteúdo / Detalhes") },
                    minLines = 3,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { if (title.isNotBlank() && content.isNotBlank()) onConfirm(title, content, category) },
                enabled = title.isNotBlank() && content.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = JarvisCyan)
            ) {
                Text("Gravar Memória", color = JarvisBackground)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancelar") }
        },
        containerColor = JarvisSurface
    )
}
