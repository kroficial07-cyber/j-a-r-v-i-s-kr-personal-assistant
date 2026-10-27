package com.kr.jarvis.modules.krdigital

import java.util.Locale

/**
 * KrDigitalModule
 * 
 * Módulo especializado em inteligência comercial, prospecção e atendimento
 * para a KR Digital. Projetado para rodar com eficiência no Samsung Galaxy A11
 * e operar localmente com heurísticas sólidas ou conectar-se ao Gemini na nuvem.
 */
object KrDigitalModule {

    enum class NegotiationStage(val displayName: String, val description: String) {
        PROSPECTING("Prospecção Inicial", "Primeiro contato, apresentação de valor e sondagem inicial."),
        QUALIFICATION("Qualificação de Demanda", "Entendendo o nicho, volume de clientes e dores principais."),
        SOLUTION_PRESENTATION("Apresentação de Solução", "Explicando como o site, sistema ou automação resolve o problema."),
        PROPOSAL("Proposta & Orçamento", "Apresentação de escopo técnico, prazos e faixas de investimento."),
        NEGOTIATION("Negociação de Condições", "Ajustes de formas de pagamento, escopo e início imediato."),
        CLOSING("Fechamento & Onboarding", "Confirmação de contrato, coleta de materiais e início da produção."),
        POST_SALE("Pós-Venda & Suporte", "Acompanhamento de métricas, manutenção e novas oportunidades.")
    }

    data class AnalysisResult(
        val stage: NegotiationStage,
        val explicitNeeds: List<String>,
        val implicitOpportunities: List<String>,
        val sentiment: String,
        val suggestedResponse: String,
        val nextActionRecommendation: String
    )

    data class ProposalDraft(
        val clientName: String,
        val projectType: String, // "Site Institucional", "Landing Page de Alta Conversão", "Automação KR", "Sistema Web"
        val deliverables: List<String>,
        val estimatedDays: Int,
        val suggestedPriceBrl: Double,
        val formattedSummary: String
    )

    /**
     * Analisa uma conversa enviada pelo usuário (ex: prints transcritos ou histórico do WhatsApp).
     * Separa fatos confirmados de hipóteses sem alucinações.
     */
    fun analyzeConversation(conversationText: String, clientName: String = "Cliente"): AnalysisResult {
        val lower = conversationText.lowercase(Locale.ROOT)

        val stage = when {
            lower.contains("contrato") || lower.contains("fechado") || lower.contains("pix") || lower.contains("fechar") ->
                NegotiationStage.CLOSING
            lower.contains("desconto") || lower.contains("parcela") || lower.contains("valor final") || lower.contains("condição") ->
                NegotiationStage.NEGOTIATION
            lower.contains("orçamento") || lower.contains("preço") || lower.contains("quanto custa") || lower.contains("tabela") ->
                NegotiationStage.PROPOSAL
            lower.contains("como funciona") || lower.contains("exemplo") || lower.contains("portfólio") || lower.contains("funciona") ->
                NegotiationStage.SOLUTION_PRESENTATION
            lower.contains("preciso de") || lower.contains("meu negócio") || lower.contains("problema") || lower.contains("vender mais") ->
                NegotiationStage.QUALIFICATION
            else ->
                NegotiationStage.PROSPECTING
        }

        val explicitNeeds = mutableListOf<String>()
        val implicitOpportunities = mutableListOf<String>()

        if (lower.contains("site") || lower.contains("página") || lower.contains("landing")) {
            explicitNeeds.add("Presença digital profissional (Site/Landing Page)")
            implicitOpportunities.add("Otimização de SEO local e carregamento rápido para celular")
        }
        if (lower.contains("vender") || lower.contains("leads") || lower.contains("clientes")) {
            explicitNeeds.add("Geração ativa de oportunidades de vendas")
            implicitOpportunities.add("Integração com botão de WhatsApp e pixel de conversão")
        }
        if (lower.contains("automatizar") || lower.contains("manual") || lower.contains("demora")) {
            explicitNeeds.add("Automação de processos repetitivos")
            implicitOpportunities.add("Integração de mensagens com webhook ou banco de dados")
        }
        if (lower.contains("lento") || lower.contains("antigo") || lower.contains("atualizar")) {
            explicitNeeds.add("Modernização de infraestrutura digital existente")
            implicitOpportunities.add("Migração para layout responsivo moderno KR-OS")
        }

        if (explicitNeeds.isEmpty()) {
            explicitNeeds.add("Avaliação técnica da presença digital atual da empresa")
        }
        if (implicitOpportunities.isEmpty()) {
            implicitOpportunities.add("Diagnóstico de conversão e posicionamento no Google")
        }

        val sentiment = when {
            lower.contains("urgente") || lower.contains("rápido") || lower.contains("preciso logo") -> "Alta Urgência / Decidido"
            lower.contains("caro") || lower.contains("não sei") || lower.contains("depois vejo") -> "Cético / Cauteloso"
            lower.contains("obrigado") || lower.contains("legal") || lower.contains("gostei") || lower.contains("ótimo") -> "Receptivo / Entusiasmado"
            else -> "Neutro / Exploratório"
        }

        // Sugestão de resposta não agressiva, natural e profissional
        val suggestedResponse = when (stage) {
            NegotiationStage.PROSPECTING ->
                "Olá, $clientName! Prazer em falar com você. Aqui na KR Digital nós desenvolvemos soluções digitais sob medida para acelerar vendas e organizar processos. Me conta um pouco mais: qual é o principal objetivo da sua empresa no momento?"
            NegotiationStage.QUALIFICATION ->
                "Perfeito, $clientName! Compreendi o que você precisa. Para desenharmos o projeto ideal para a sua realidade, você já possui domínio ou identidade visual pronta, ou prefere que a KR Digital cuide de toda a estruturação do zero?"
            NegotiationStage.SOLUTION_PRESENTATION ->
                "$clientName, uma solução com Landing Page de alta velocidade focada em conversão mobile seria o caminho ideal para o seu nicho. O usuário encontra seus produtos com apenas 1 clique direto no WhatsApp. Quer dar uma olhada em projetos similares que construímos?"
            NegotiationStage.PROPOSAL ->
                "Com certeza, $clientName! Preparei um resumo do escopo com tudo o que sua empresa precisa, sem custos ocultos ou cobranças surpresa: design sob medida, hospedagem rápida e integração de mensagens. Posso te enviar o arquivo detalhado para sua avaliação?"
            NegotiationStage.NEGOTIATION ->
                "Entendo seu ponto, $clientName. Na KR Digital buscamos sempre viabilizar a parceria de forma sustentável para você. Conseguimos parcelar a implementação em até 3x ou ajustar a entrega em duas fases operacionais. Qual formato fica mais confortável para darmos a largada?"
            NegotiationStage.CLOSING ->
                "Excelente decisão, $clientName! Será uma honra para a KR Digital impulsionar o seu negócio. Vou gerar o termo de início com o cronograma de entrega de 7 dias úteis. Qual o melhor e-mail e CNPJ/CPF para formalizarmos?"
            NegotiationStage.POST_SALE ->
                "Olá, $clientName! Como estão os resultados do projeto esta semana? Estou à disposição para ajustes de rotina ou novas melhorias no sistema da KR Digital."
        }

        val nextAction = when (stage) {
            NegotiationStage.PROSPECTING -> "Fazer pergunta aberta sobre o objetivo comercial do cliente."
            NegotiationStage.QUALIFICATION -> "Mapear prazo desejado e público-alvo antes de passar valores."
            NegotiationStage.SOLUTION_PRESENTATION -> "Enviar demonstração visual e comprovar agilidade da solução."
            NegotiationStage.PROPOSAL -> "Enviar proposta formal em PDF ou mensagem clara e combinar prazo de retorno."
            NegotiationStage.NEGOTIATION -> "Oferecer parcelamento sem depreciar o valor técnico do trabalho."
            NegotiationStage.CLOSING -> "Solicitar dados cadastrais e agendar o onboarding."
            NegotiationStage.POST_SALE -> "Coletar depoimento para o portfólio e propor manutenção preventiva."
        }

        return AnalysisResult(
            stage = stage,
            explicitNeeds = explicitNeeds,
            implicitOpportunities = implicitOpportunities,
            sentiment = sentiment,
            suggestedResponse = suggestedResponse,
            nextActionRecommendation = nextAction
        )
    }

    /**
     * Gera rascunho de proposta comercial completa sem inventar fatos.
     */
    fun generateProposal(clientName: String, projectType: String, customNotes: String = ""): ProposalDraft {
        val (deliverables, days, price) = when {
            projectType.contains("Landing", ignoreCase = true) -> Triple(
                listOf(
                    "Design responsivo otimizado para celulares (Mobile First)",
                    "Carregamento ultra-rápido com arquitetura moderna",
                    "Botão direto de WhatsApp com mensagem personalizada",
                    "Integração com Google Analytics e Meta Pixel",
                    "Certificado de Segurança SSL incluso"
                ),
                5,
                750.0
            )
            projectType.contains("Automação", ignoreCase = true) || projectType.contains("Sistema", ignoreCase = true) -> Triple(
                listOf(
                    "Mapeamento completo dos fluxos e regras operacionais",
                    "Integração segura com APIs e serviços parceiros",
                    "Painel de controle com status e relatórios em tempo real",
                    "Testes de estabilidade e tolerância a falhas",
                    "Treinamento operacional de 1h incluso para a equipe"
                ),
                10,
                1500.0
            )
            else -> Triple( // Site Institucional Completo
                listOf(
                    "Estrutura completa com Início, Sobre, Serviços, Portfólio e Contato",
                    "Painel intuitivo para edição básica de textos e imagens",
                    "SEO técnico configurado para buscas no Google",
                    "Layout exclusivo com a identidade visual do cliente",
                    "Hospedagem e suporte técnico nos primeiros 30 dias"
                ),
                8,
                1200.0
            )
        }

        val summary = """
            PROPOSTA COMERCIAL KR DIGITAL // CLIENTE: $clientName
            ==================================================
            PROJETO: $projectType
            PRAZO DE ENTREGA ESTIMADO: $days dias úteis
            INVESTIMENTO ESTIMADO: R$ ${"%.2f".format(price)}
            
            ESCOPO E ENTREGAS:
            ${deliverables.mapIndexed { idx, d -> "${idx + 1}. $d" }.joinToString("\n")}
            
            OBSERVAÇÕES ADICIONAIS:
            ${if (customNotes.isNotBlank()) customNotes else "Solução personalizada com suporte de garantia de entrega pela KR Digital."}
            ==================================================
        """.trimIndent()

        return ProposalDraft(
            clientName = clientName,
            projectType = projectType,
            deliverables = deliverables,
            estimatedDays = days,
            suggestedPriceBrl = price,
            formattedSummary = summary
        )
    }
}
