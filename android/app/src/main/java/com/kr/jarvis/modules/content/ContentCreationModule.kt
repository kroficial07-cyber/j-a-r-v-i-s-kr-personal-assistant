package com.kr.jarvis.modules.content

import java.util.Locale

/**
 * ContentCreationModule
 * 
 * Módulo especializado em criação de conteúdo, roteirização,
 * geração de ganchos (hooks) de retenção, SEO e calendário editorial.
 */
object ContentCreationModule {

    enum class ContentFormat(val displayName: String) {
        SHORTS_REELS_TIKTOK("Vídeo Curto (Shorts/Reels 30s-60s)"),
        YOUTUBE_LONG("Vídeo Longo YouTube (8-12 min)"),
        CAROUSEL_POST("Carrossel Educativo"),
        COMMUNITY_POST("Post de Comunidade / Texto")
    }

    data class VideoScript(
        val title: String,
        val format: ContentFormat,
        val targetAudience: String,
        val hooks: List<String>,
        val scriptBody: String,
        val callToAction: String,
        val suggestedBroll: List<String>,
        val seoTags: List<String>,
        val thumbnailIdea: String
    )

    data class ContentIdea(
        val theme: String,
        val hookAngle: String,
        val whyItWorks: String,
        val format: ContentFormat
    )

    /**
     * Gera ideias de conteúdo com base em um tema ou nicho.
     */
    fun brainstormIdeas(topic: String): List<ContentIdea> {
        val cleanTopic = topic.trim().ifEmpty { "tecnologia e inteligência artificial" }

        return listOf(
            ContentIdea(
                theme = "O erro que 90% das pessoas cometem ao usar $cleanTopic",
                hookAngle = "Alerta de erro / Quebra de padrão",
                whyItWorks = "Gera curiosidade imediata e medo de estar fazendo errado.",
                format = ContentFormat.SHORTS_REELS_TIKTOK
            ),
            ContentIdea(
                theme = "Como apliquei $cleanTopic para dobrar minha produtividade no dia a dia",
                hookAngle = "Estudo de caso prático e pessoal",
                whyItWorks = "Transmite autoridade genuína sem parecer genérico.",
                format = ContentFormat.YOUTUBE_LONG
            ),
            ContentIdea(
                theme = "3 ferramentas secretas de $cleanTopic que ninguém te conta",
                hookAngle = "Lista com valor prático imediato",
                whyItWorks = "Gera alto índice de salvamentos e compartilhamentos.",
                format = ContentFormat.SHORTS_REELS_TIKTOK
            ),
            ContentIdea(
                theme = "Guia definitivo: do zero ao avançado em $cleanTopic sem gastar R$ 1",
                hookAngle = "Transformação acessível",
                whyItWorks = "Apela diretamente ao público com orçamento limitado que busca evolução.",
                format = ContentFormat.YOUTUBE_LONG
            )
        )
    }

    /**
     * Gera um roteiro completo adaptado ao formato desejado.
     */
    fun generateScript(theme: String, format: ContentFormat): VideoScript {
        return when (format) {
            ContentFormat.SHORTS_REELS_TIKTOK -> {
                val hooks = listOf(
                    "Pare de perder tempo com $theme antes de ver este vídeo!",
                    "Você não vai acreditar no que acontece se aplicar isso em $theme...",
                    "Se você faz $theme assim, você está deixando dinheiro na mesa."
                )
                val body = """
                    [00:00 - 00:03] GANCHO DE ATENÇÃO:
                    ${hooks[0]}
                    
                    [00:03 - 00:15] O PROBLEMA REAL:
                    A maioria das pessoas tenta resolver isso de forma manual e gasta horas sem ver resultado. O segredo não é trabalhar mais horas, é usar o fluxo correto.
                    
                    [00:15 - 00:35] A SOLUÇÃO EM 3 PASSOS:
                    Passo 1: Automatize a rotina repetitiva.
                    Passo 2: Filtre apenas as tarefas que trazem resultado direto.
                    Passo 3: Use o J.A.R.V.I.S. para gerenciar seus lembretes e prioridades.
                    
                    [00:35 - 00:50] CONCLUSÃO E VALOR:
                    Fazendo isso todo dia, você economiza pelo menos 2 horas e mantém foco absoluto no que importa.
                """.trimIndent()

                val cta = "Gostou do hack? Salva esse vídeo para não esquecer e me segue para mais dicas práticas de produtividade!"
                val brolls = listOf(
                    "Close na tela do celular mostrando interface rápida",
                    "Corte rápido com transição sonora sutil",
                    "Legenda grande centralizada nas palavras-chave"
                )
                val tags = listOf("#$theme", "#produtividade", "#jarvis", "#dicas", "#tecnologia", "#krdigital")
                val thumb = "Rosto com expressão de alerta + celular na mão com texto em amarelo: 'NÃO FAÇA ISSO'"

                VideoScript(
                    title = "Como dominar $theme no seu celular",
                    format = format,
                    targetAudience = "Jovens e profissionais buscando produtividade e automação",
                    hooks = hooks,
                    scriptBody = body,
                    callToAction = cta,
                    suggestedBroll = brolls,
                    seoTags = tags,
                    thumbnailIdea = thumb
                )
            }
            ContentFormat.YOUTUBE_LONG -> {
                val hooks = listOf(
                    "Neste vídeo eu vou te mostrar exatamente o passo a passo completo para dominar $theme.",
                    "Se você quer resultados consistentes com $theme, este é o único guia que você precisa assistir hoje."
                )
                val body = """
                    [00:00 - 00:45] INTRODUÇÃO & PROMESSA:
                    Olá pessoal, sejam bem-vindos! Se você já tentou avançar em $theme mas sentiu que faltava um método claro, você está no lugar certo. Hoje eu vou abrir meu processo completo.
                    
                    [00:45 - 03:00] BLOCO 1 — FUNDAMENTOS QUE NINGUÉM ENSINA:
                    Antes das ferramentas avançadas, precisamos alinhar a base: objetivos claros, métricas reais e eliminação de distrações.
                    
                    [03:00 - 06:30] BLOCO 2 — EXECUÇÃO PRÁTICA NA TELA:
                    Demonstração passo a passo na prática. Mostrando cada detalhe do fluxo operacional com clareza.
                    
                    [06:30 - 09:30] BLOCO 3 — OS 3 MAIORES ERROS E COMO EVITAR:
                    Erro 1: Falta de consistência diária.
                    Erro 2: Ignorar automações simples.
                    Erro 3: Não revisar as missões concluídas.
                    
                    [09:30 - 11:00] RECAPITULAÇÃO E PLANO DE AÇÃO:
                    Resumo em 3 pontos práticos para você aplicar ainda hoje.
                """.trimIndent()

                val cta = "Se esse conteúdo gerou valor para você, inscreva-se no canal, deixe seu like e comente aqui embaixo qual a sua maior dúvida sobre $theme!"
                val brolls = listOf(
                    "Capturas de tela demonstrando o fluxo em funcionamento",
                    "Gráficos explicativos simples e dinâmicos",
                    "Música de fundo em tom 'lo-fi' ou foco, volume em -22dB"
                )
                val tags = listOf(theme.lowercase(Locale.ROOT), "tutorial completo", "passo a passo", "kr digital", "assistente pessoal", "produtividade 2026")
                val thumb = "Dividida ao meio: Antes (caos/lento) vs Depois (organizado/rápido) com texto em caixa alta"

                VideoScript(
                    title = "Guia Prático: Como Dominar $theme Passo a Passo",
                    format = format,
                    targetAudience = "Criadores, estudantes e empreendedores focados em alta performance",
                    hooks = hooks,
                    scriptBody = body,
                    callToAction = cta,
                    suggestedBroll = brolls,
                    seoTags = tags,
                    thumbnailIdea = thumb
                )
            }
            else -> {
                VideoScript(
                    title = "Insights essenciais sobre $theme",
                    format = format,
                    targetAudience = "Público geral",
                    hooks = listOf("3 Lições práticas sobre $theme:"),
                    scriptBody = "Slide 1: Introdução.\nSlide 2: Desafio.\nSlide 3: Solução prática.\nSlide 4: Conclusão.",
                    callToAction = "Comente sua opinião e compartilhe com um amigo!",
                    suggestedBroll = emptyList(),
                    seoTags = listOf(theme, "conteudo", "kr"),
                    thumbnailIdea = "Card minimalista em tom ciano e azul escuro"
                )
            }
        }
    }
}
