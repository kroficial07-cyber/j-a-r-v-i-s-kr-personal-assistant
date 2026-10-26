package com.kr.jarvis.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface JarvisDao {

    // --- CHAT MESSAGES ---
    @Query("SELECT * FROM chat_messages ORDER BY timestamp ASC")
    fun getAllMessages(): Flow<List<ChatMessageEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessage(message: ChatMessageEntity)

    @Query("DELETE FROM chat_messages")
    suspend fun clearAllMessages()

    // --- MEMORIES ---
    @Query("SELECT * FROM memory_items ORDER BY updatedAt DESC")
    fun getAllMemories(): Flow<List<MemoryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMemory(memory: MemoryEntity)

    @Update
    suspend fun updateMemory(memory: MemoryEntity)

    @Query("DELETE FROM memory_items WHERE id = :id")
    suspend fun deleteMemoryById(id: String)

    // --- MISSIONS & TASKS ---
    @Query("SELECT * FROM missions ORDER BY createdAt DESC")
    fun getAllMissions(): Flow<List<MissionEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMission(mission: MissionEntity)

    @Update
    suspend fun updateMission(mission: MissionEntity)

    @Query("DELETE FROM missions WHERE id = :id")
    suspend fun deleteMissionById(id: String)

    @Query("UPDATE missions SET completed = 0, completedAt = NULL WHERE isDaily = 1")
    suspend fun resetDailyMissions()

    // --- AUTOMATIONS ---
    @Query("SELECT * FROM automations")
    fun getAllAutomations(): Flow<List<AutomationRuleEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAutomations(automations: List<AutomationRuleEntity>)

    @Update
    suspend fun updateAutomation(automation: AutomationRuleEntity)

    // --- SETTINGS ---
    @Query("SELECT value FROM settings WHERE `key` = :key LIMIT 1")
    suspend fun getSetting(key: String): String?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveSetting(setting: SettingEntity)
}
