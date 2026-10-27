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
        NavItem("KR Digital", Icons.Default.SupportAgent, 2),
        NavItem("Criador", Icons.Default.Movie, 3),
        NavItem("Foco", Icons.Default.Timer, 4),
        NavItem("Missões", Icons.Default.AssignmentTurnedIn, 5),
        NavItem("Memória", Icons.Default.Psychology, 6),
        NavItem("Automação", Icons.Default.AltRoute, 7),
        NavItem("Config", Icons.Default.Settings, 8)
    )

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = JarvisBackground,
        snackbarHost = { SnackbarHost(snackbarHostState) },
        bottomBar = {
            ScrollableTabRow(
                selectedTabIndex = selectedTab,
                containerColor = JarvisSurface,
                contentColor = JarvisCyanBright,
                edgePadding = 8.dp,
                modifier = Modifier.height(64.dp)
            ) {
                navItems.forEach { item ->
                    val isSelected = selectedTab == item.index
                    Tab(
                        selected = isSelected,
                        onClick = { selectedTab = item.index },
                        text = {
                            Text(
                                text = item.label,
                                fontSize = 11.sp,
                                color = if (isSelected) JarvisCyanBright else JarvisTextSecondary
                            )
                        },
                        icon = {
                            Icon(
                                imageVector = item.icon,
                                contentDescription = item.label,
                                tint = if (isSelected) JarvisCyanBright else JarvisTextSecondary,
                                modifier = Modifier.size(18.dp)
                            )
                        }
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
                2 -> KrDigitalScreen(viewModel = viewModel)
                3 -> ContentCreatorScreen(viewModel = viewModel)
                4 -> FocusScreen(viewModel = viewModel)
                5 -> MissionsScreen(viewModel = viewModel)
                6 -> MemoryScreen(viewModel = viewModel)
                7 -> AutomationsScreen(viewModel = viewModel)
                8 -> SettingsScreen(viewModel = viewModel)
            }
        }
    }
}
