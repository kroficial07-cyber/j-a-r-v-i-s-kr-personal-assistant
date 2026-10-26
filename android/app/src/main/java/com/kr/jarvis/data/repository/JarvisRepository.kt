package com.kr.jarvis.data.repository

import com.kr.jarvis.data.local.*
import kotlinx.coroutines.flow.Flow
import java.text.SimpleDateFormat
import java.util.*

class JarvisRepository(private val dao: JarvisDao) {

    val allMessages: Flow<List<ChatMessageEntity>> = dao.getAllMessages()
    val allMemories: Flow<List<MemoryEntity>> = dao.getAllMemories()
    val allMissions: Flow<List<MissionEntity>> = dao.getAllMissions()
    val allAutomations: Flow<List<AutomationRuleEntity>> = dao.getAllAutomations()

    suspend fun insertMessage(message: ChatMessageEntity) = dao.insertMessage(message)
    suspend fun clearMessages() = dao.clearAllMessages()

    suspend fun insertMemory(memory: MemoryEntity) = dao.insertMemory(memory)
    suspend fun updateMemory(memory: MemoryEntity) = dao.updateMemory(memory)
    suspend fun deleteMemory(id: String) = dao.deleteMemoryById(id)

    suspend fun insertMission(mission: MissionEntity) = dao.insertMission(mission)
    suspend fun updateMission(mission: MissionEntity) = dao.updateMission(mission)
    suspend fun deleteMission(id: String) = dao.deleteMissionById(id)

    suspend fun updateAutomation(automation: AutomationRuleEntity) = dao.updateAutomation(automation)

    suspend fun checkAndRenewDailyMissions(): Boolean {
        val todayStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        val lastDate = dao.getSetting("last_missions_renewal")

        if (lastDate != todayStr) {
            dao.resetDailyMissions()
            dao.saveSetting(SettingEntity("last_missions_renewal", todayStr))
            return true
        }
        return false
    }

    suspend fun forceRenewDailyMissions() {
        val todayStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        dao.resetDailyMissions()
        dao.saveSetting(SettingEntity("last_missions_renewal", todayStr))
    }
}
