package com.kr.jarvis.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [
        ChatMessageEntity::class,
        MemoryEntity::class,
        MissionEntity::class,
        AutomationRuleEntity::class,
        SettingEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class JarvisDatabase : RoomDatabase() {

    abstract fun jarvisDao(): JarvisDao

    companion object {
        @Volatile
        private var INSTANCE: JarvisDatabase? = null

        fun getDatabase(context: Context, scope: CoroutineScope): JarvisDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    JarvisDatabase::class.java,
                    "jarvis_kr_database"
                )
                .addCallback(JarvisDatabaseCallback(scope))
                .build()
                INSTANCE = instance
                instance
            }
        }

        private class JarvisDatabaseCallback(
            private val scope: CoroutineScope
        ) : RoomDatabase.Callback() {
            override fun onCreate(db: SupportSQLiteDatabase) {
                super.onCreate(db)
                INSTANCE?.let { database ->
                    scope.launch(Dispatchers.IO) {
                        populateInitialData(database.jarvisDao())
                    }
                }
            }

            private suspend fun populateInitialData(dao: JarvisDao) {
                val now = System.currentTimeMillis()

                // Initial greeting
                dao.insertMessage(
                    ChatMessageEntity(
                        id = "msg_init",
                        text = "Sistemas online. J.A.R.V.I.S. — KR Personal Assistant inicializado com sucesso no Android. Todos os módulos estão operando em potência ideal.",
                        sender = "jarvis",
                        timestamp = now
                    )
                )

                // Initial memories
                dao.insertMemory(
                    MemoryEntity(
                        id = "mem_1",
                        title = "Identidade do Usuário",
                        content = "O usuário mestre se chama KR. Tratamento preferencial: Senhor KR ou Comandante KR.",
                        category = "preferencia",
                        createdAt = now,
                        updatedAt = now
                    )
                )
                dao.insertMemory(
                    MemoryEntity(
                        id = "mem_2",
                        title = "Diretriz de Automação",
                        content = "Integração segura via JarvisAccessibilityService para comandos hands-free no Android.",
                        category = "diretriz",
                        createdAt = now,
                        updatedAt = now
                    )
                )

                // Initial missions
                dao.insertMission(
                    MissionEntity(
                        id = "miss_1",
                        title = "Calibrar Reconhecimento de Voz pt-BR",
                        description = "Testar microfone e sintetizador de voz com saudação inicial.",
                        category = "foco",
                        priority = "alta",
                        completed = true,
                        completedAt = now,
                        isDaily = true,
                        createdAt = now
                    )
                )
                dao.insertMission(
                    MissionEntity(
                        id = "miss_2",
                        title = "Definir 3 Prioridades do Dia",
                        description = "Cadastrar no painel de missões as principais metas do Senhor KR.",
                        category = "foco",
                        priority = "alta",
                        completed = false,
                        isDaily = true,
                        createdAt = now
                    )
                )
                dao.insertMission(
                    MissionEntity(
                        id = "miss_3",
                        title = "Hidratação e Foco Mental",
                        description = "Pausa para beber água e manter desempenho neural ideal.",
                        category = "saude",
                        priority = "media",
                        completed = false,
                        isDaily = true,
                        createdAt = now
                    )
                )

                // Initial automations
                dao.insertAutomations(
                    listOf(
                        AutomationRuleEntity(
                            id = "auto_1",
                            name = "Briefing Matinal por Voz",
                            description = "Ao ouvir 'Jarvis, relatório matinal', resume missões diárias e status.",
                            triggerType = "voz",
                            triggerDetails = "jarvis relatório matinal",
                            actionType = "tts_summary",
                            actionDetails = "Leitura vocal das pendências do dia",
                            enabled = true,
                            requiresAccessibilityService = false
                        ),
                        AutomationRuleEntity(
                            id = "auto_2",
                            name = "Abrir WhatsApp por Comando",
                            description = "Inicia o aplicativo WhatsApp de forma segura via intent autorizada.",
                            triggerType = "voz",
                            triggerDetails = "abrir whatsapp",
                            actionType = "launch_app",
                            actionDetails = "Lança com.whatsapp",
                            enabled = true,
                            requiresAccessibilityService = false,
                            targetPackage = "com.whatsapp"
                        ),
                        AutomationRuleEntity(
                            id = "auto_3",
                            name = "Gesto Voltar no Android (Accessibility)",
                            description = "Dispara ação global de voltar tela no sistema Android.",
                            triggerType = "voz",
                            triggerDetails = "jarvis voltar",
                            actionType = "global_back",
                            actionDetails = "GLOBAL_ACTION_BACK",
                            enabled = false,
                            requiresAccessibilityService = true
                        )
                    )
                )
            }
        }
    }
}
