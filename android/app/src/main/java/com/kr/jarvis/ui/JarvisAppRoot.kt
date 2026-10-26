package com.kr.jarvis.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kr.jarvis.ui.screens.*
import com.kr.jarvis.ui.theme.*
import com.kr.jarvis.viewmodel.JarvisViewModel

data class NavItem(
    val label: String,
    val icon: ImageVector,
    val index: Int
)

@Composable
fun JarvisAppRoot(
    viewModel: JarvisViewModel,
    modifier: Modifier = Modifier
) {
    var selectedTab by remember { mutableIntStateOf(0) }
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.infoMessage) {
        uiState.infoMessage?.let { msg ->
            snackbarHostState.showSnackbar(msg)
            viewModel.dismissInfo()
        }
    }

    val navItems = listOf(
        NavItem("Início", Icons.Default.Home, 0),
        NavItem("Conversa", Icons.Default.ChatBubble, 1),
        NavItem("Missões", Icons.Default.AssignmentTurnedIn, 2),
        NavItem("Memória", Icons.Default.Psychology, 3),
        NavItem("Automação", Icons.Default.AltRoute, 4),
        NavItem("Config", Icons.Default.Settings, 5)
    )

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = JarvisBackground,
        snackbarHost = { SnackbarHost(snackbarHostState) },
        bottomBar = {
            NavigationBar(
                containerColor = JarvisSurface,
                tonalElevation = 8.dp,
                modifier = Modifier.height(68.dp)
            ) {
                navItems.forEach { item ->
                    val isSelected = selectedTab == item.index
                    NavigationBarItem(
                        selected = isSelected,
                        onClick = { selectedTab = item.index },
                        icon = {
                            Icon(
                                imageVector = item.icon,
                                contentDescription = item.label,
                                tint = if (isSelected) JarvisCyanBright else JarvisTextSecondary
                            )
                        },
                        label = {
                            Text(
                                text = item.label,
                                fontSize = 10.sp,
                                color = if (isSelected) JarvisCyanBright else JarvisTextSecondary
                            )
                        },
                        colors = NavigationBarItemDefaults.colors(
                            indicatorColor = JarvisSurfaceVariant
                        )
                    )
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (selectedTab) {
                0 -> HomeScreen(viewModel = viewModel, onNavigateToTab = { selectedTab = it })
                1 -> ChatScreen(viewModel = viewModel)
                2 -> MissionsScreen(viewModel = viewModel)
                3 -> MemoryScreen(viewModel = viewModel)
                4 -> AutomationsScreen(viewModel = viewModel)
                5 -> SettingsScreen(viewModel = viewModel)
            }
        }
    }
}
