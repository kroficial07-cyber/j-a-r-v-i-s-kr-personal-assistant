package com.kr.jarvis.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "chat_messages")
data class ChatMessageEntity(
    @PrimaryKey
    val id: String,
    val text: String,
    val sender: String, // "user" or "jarvis"
    val timestamp: Long,
    val isVoiceTriggered: Boolean = false
)

@Entity(tableName = "memory_items")
data class MemoryEntity(
    @PrimaryKey
    val id: String,
    val title: String,
    val content: String,
    val category: String, // "preferencia", "diretriz", "fato", "nota"
    val createdAt: Long,
    val updatedAt: Long
)

@Entity(tableName = "missions")
data class MissionEntity(
    @PrimaryKey
    val id: String,
    val title: String,
    val description: String,
    val category: String, // "foco", "saude", "estudo", "sistema"
    val priority: String, // "alta", "media", "baixa"
    val completed: Boolean,
    val completedAt: Long? = null,
    val isDaily: Boolean,
    val createdAt: Long
)

@Entity(tableName = "automations")
data class AutomationRuleEntity(
    @PrimaryKey
    val id: String,
    val name: String,
    val description: String,
    val triggerType: String,
    val triggerDetails: String,
    val actionType: String,
    val actionDetails: String,
    val enabled: Boolean,
    val requiresAccessibilityService: Boolean,
    val targetPackage: String? = null
)

@Entity(tableName = "settings")
data class SettingEntity(
    @PrimaryKey
    val key: String,
    val value: String
)
