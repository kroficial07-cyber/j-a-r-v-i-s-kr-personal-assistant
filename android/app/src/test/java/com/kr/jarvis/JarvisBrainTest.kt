package com.kr.jarvis

import com.kr.jarvis.modules.content.ContentCreationModule
import com.kr.jarvis.modules.focus.FocusRoutineManager
import com.kr.jarvis.modules.krdigital.KrDigitalModule
import org.junit.Assert.*
import org.junit.Test

class JarvisBrainTest {

    @Test
    fun testKrDigitalConversationAnalysis_ProspectingStage() {
        val message = "Olá, gostaria de saber se vocês fazem sites para empresas."
        val result = KrDigitalModule.analyzeConversation(message, "Dr. Roberto")

        assertNotNull(result)
        assertEquals(KrDigitalModule.NegotiationStage.PROSPECTING, result.stage)
        assertTrue(result.suggestedResponse.contains("Dr. Roberto"))
        assertTrue(result.explicitNeeds.any { it.contains("Site") || it.contains("Presença") })
    }

    @Test
    fun testKrDigitalConversationAnalysis_ClosingStage() {
        val message = "Perfeito, me manda a chave PIX para fecharmos o contrato hoje."
        val result = KrDigitalModule.analyzeConversation(message, "Carlos")

        assertEquals(KrDigitalModule.NegotiationStage.CLOSING, result.stage)
        assertTrue(result.nextActionRecommendation.contains("onboarding") || result.nextActionRecommendation.contains("cadastrais"))
    }

    @Test
    fun testKrDigitalProposalGeneration() {
        val proposal = KrDigitalModule.generateProposal(
            clientName = "Tech Solutions",
            projectType = "Landing Page de Alta Conversão"
        )

        assertNotNull(proposal)
        assertEquals("Tech Solutions", proposal.clientName)
        assertEquals(5, proposal.estimatedDays)
        assertTrue(proposal.suggestedPriceBrl > 0)
        assertTrue(proposal.formattedSummary.contains("PROPOSTA COMERCIAL KR DIGITAL"))
    }

    @Test
    fun testContentCreation_ShortsScript() {
        val script = ContentCreationModule.generateScript(
            theme = "Automação no Android",
            format = ContentCreationModule.ContentFormat.SHORTS_REELS_TIKTOK
        )

        assertNotNull(script)
        assertTrue(script.hooks.isNotEmpty())
        assertTrue(script.scriptBody.contains("GANCHO DE ATENÇÃO"))
        assertTrue(script.callToAction.isNotBlank())
        assertTrue(script.seoTags.any { it.contains("automação", ignoreCase = true) })
    }

    @Test
    fun testContentCreation_BrainstormIdeas() {
        val ideas = ContentCreationModule.brainstormIdeas("Inteligência Artificial")
        assertTrue(ideas.size >= 4)
        assertTrue(ideas.any { it.theme.contains("Inteligência Artificial") })
    }

    @Test
    fun testFocusMode_StrictEmergencyImmunity() {
        // Ativa o modo foco
        FocusRoutineManager.startFocusSession(25, "Deep Work")

        // Instagram deve ser contido
        assertTrue(FocusRoutineManager.shouldBlockPackage("com.instagram.android"))

        // DIRETRIZ CRÍTICA: Discadores e emergências NUNCA podem ser bloqueados
        assertFalse(FocusRoutineManager.shouldBlockPackage("com.android.phone"))
        assertFalse(FocusRoutineManager.shouldBlockPackage("com.samsung.android.dialer"))
        assertFalse(FocusRoutineManager.shouldBlockPackage("com.google.android.dialer"))
        assertFalse(FocusRoutineManager.shouldBlockPackage("com.android.emergency"))

        // Quando o modo foco é pausado, nada é bloqueado
        FocusRoutineManager.stopFocusSession()
        assertFalse(FocusRoutineManager.shouldBlockPackage("com.instagram.android"))
    }
}
