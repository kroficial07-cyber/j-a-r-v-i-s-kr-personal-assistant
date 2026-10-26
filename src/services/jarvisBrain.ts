import { storageService } from './storageService';
import { MemoryItem, MissionTask } from '../types';

export interface JarvisActionResponse {
  replyText: string;
  actionTaken?: 'task_added' | 'memory_added' | 'task_completed' | 'diagnostics_run' | 'navigate' | 'none';
  navigateToTab?: 'home' | 'chat' | 'missions' | 'drive' | 'gmail' | 'memory' | 'automations' | 'settings' | 'kotlin_source';
  updatedTasks?: MissionTask[];
  updatedMemories?: MemoryItem[];
}

export function processJarvisCommand(input: string): JarvisActionResponse {
  const text = input.trim();
  const lower = text.toLowerCase();
  const settings = storageService.getSettings();
  const userName = settings.userName || 'KR';

  // 1. GREETINGS
  if (
    lower.includes('olá jarvis') ||
    lower.includes('ola jarvis') ||
    lower.includes('oi jarvis') ||
    lower.includes('e aí jarvis') ||
    lower === 'jarvis' ||
    lower === 'olá' ||
    lower === 'ola' ||
    lower === 'oi'
  ) {
    const hours = new Date().getHours();
    let timeGreeting = 'Bom dia';
    if (hours >= 12 && hours < 18) timeGreeting = 'Boa tarde';
    else if (hours >= 18 || hours < 5) timeGreeting = 'Boa noite';

    return {
      replyText: `${timeGreeting}, Senhor ${userName}. Todos os subsistemas do J.A.R.V.I.S. estão operando em potência ideal. Como posso ser útil neste momento?`,
      actionTaken: 'none',
    };
  }

  // 2. TIME AND DATE
  if (
    lower.includes('que horas são') ||
    lower.includes('que horas sao') ||
    lower.includes('hora atual') ||
    lower.includes('horário') ||
    lower.includes('horario')
  ) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return {
      replyText: `São exatamente ${timeStr}, Senhor ${userName}.`,
      actionTaken: 'none',
    };
  }

  if (
    lower.includes('que dia é hoje') ||
    lower.includes('que dia e hoje') ||
    lower.includes('data de hoje') ||
    lower.includes('qual a data')
  ) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return {
      replyText: `Hoje é ${dateStr}, Senhor ${userName}.`,
      actionTaken: 'none',
    };
  }

  // 3. WHO AM I / MEMORY QUERY
  if (
    lower.includes('quem sou eu') ||
    lower.includes('qual é o meu nome') ||
    lower.includes('qual meu nome') ||
    lower.includes('você me conhece') ||
    lower.includes('voce me conhece')
  ) {
    const memories = storageService.getMemories();
    const prefCount = memories.length;
    return {
      replyText: `O senhor é ${userName}, meu criador e usuário mestre. Mantenho atualmente ${prefCount} registros gravados em meu módulo de memória local relativos às suas diretrizes.`,
      actionTaken: 'none',
    };
  }

  // 4. MEMORY CREATION ("lembre-se que...", "anote que...", "guarde na memória...")
  const memoryPatterns = [
    /^(?:jarvis\s+)?(?:lembre-se\s+que|lembre\s+que|anote\s+que|guarde\s+que|salve\s+que|memorize\s+que)\s+(.+)$/i,
    /^(?:jarvis\s+)?(?:anotar|lembrete|memorizar):\s*(.+)$/i,
  ];

  for (const pattern of memoryPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const memoryContent = match[1].trim();
      const existingMemories = storageService.getMemories();
      const newMemory: MemoryItem = {
        id: `mem_${Date.now()}`,
        title: `Nota registrada via comando`,
        content: memoryContent,
        category: 'nota',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const updated = [newMemory, ...existingMemories];
      storageService.saveMemories(updated);
      return {
        replyText: `Afirmativo, Senhor ${userName}. Registrei em minha memória permanente: "${memoryContent}".`,
        actionTaken: 'memory_added',
        updatedMemories: updated,
      };
    }
  }

  // 5. QUERY MEMORIES
  if (
    lower.includes('minhas notas') ||
    lower.includes('minhas memórias') ||
    lower.includes('minhas memorias') ||
    lower.includes('o que você lembra') ||
    lower.includes('o que voce lembra')
  ) {
    const memories = storageService.getMemories();
    if (memories.length === 0) {
      return {
        replyText: `Senhor ${userName}, sua matriz de memória local está vazia no momento. Pode me solicitar gravações dizendo "Lembre-se que...".`,
        actionTaken: 'none',
      };
    }
    const sample = memories.slice(0, 3).map((m, i) => `${i + 1}. ${m.content}`).join('; ');
    return {
      replyText: `Recuperei ${memories.length} memórias locais do Senhor ${userName}. Principais notas: ${sample}.`,
      actionTaken: 'none',
    };
  }

  // 6. TASK CREATION ("adicionar tarefa...", "nova missão...", "criar tarefa...")
  const taskPatterns = [
    /^(?:jarvis\s+)?(?:adicionar\s+tarefa|adicionar\s+missão|nova\s+tarefa|nova\s+missão|criar\s+tarefa)\s+(.+)$/i,
  ];

  for (const pattern of taskPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const taskTitle = match[1].trim();
      const { missions } = storageService.getMissions();
      const newTask: MissionTask = {
        id: `task_${Date.now()}`,
        title: taskTitle,
        description: 'Criada via comando vocal no J.A.R.V.I.S.',
        category: 'foco',
        priority: 'media',
        completed: false,
        isDaily: false,
        createdAt: Date.now(),
      };
      const updated = [newTask, ...missions];
      storageService.saveMissions(updated);
      return {
        replyText: `Nova tarefa adicionada ao painel de missões: "${taskTitle}". Prioridade média configurada.`,
        actionTaken: 'task_added',
        updatedTasks: updated,
      };
    }
  }

  // 7. TASK QUERY
  if (
    lower.includes('quais minhas tarefas') ||
    lower.includes('minhas missões') ||
    lower.includes('minhas missoes') ||
    lower.includes('relatório de tarefas') ||
    lower.includes('tarefas de hoje') ||
    lower.includes('relatório matinal') ||
    lower.includes('relatorio matinal')
  ) {
    const { missions } = storageService.getMissions();
    const pending = missions.filter((m) => !m.completed);
    const completed = missions.filter((m) => m.completed);

    if (pending.length === 0) {
      return {
        replyText: `Excelente, Senhor ${userName}! Todas as ${completed.length} missões registradas foram cumpridas. O sistema está com 100% de conformidade operacional.`,
        actionTaken: 'none',
      };
    }

    const pendingTitles = pending.slice(0, 3).map((t, idx) => `${idx + 1}. ${t.title}`).join('; ');
    return {
      replyText: `Senhor ${userName}, você possui ${pending.length} tarefas pendentes e ${completed.length} concluídas. Principais pendências: ${pendingTitles}.`,
      actionTaken: 'none',
    };
  }

  // 8. SYSTEM STATUS & DIAGNOSTICS
  if (
    lower.includes('status do sistema') ||
    lower.includes('status') ||
    lower.includes('diagnóstico') ||
    lower.includes('diagnostico') ||
    lower.includes('como você está') ||
    lower.includes('como voce esta')
  ) {
    const isOnline = navigator.onLine;
    const { missions } = storageService.getMissions();
    const pendingCount = missions.filter((m) => !m.completed).length;
    const memoriesCount = storageService.getMemories().length;
    const automations = storageService.getAutomations();
    const activeAutoCount = automations.filter((a) => a.enabled).length;

    return {
      replyText: `Diagnóstico do J.A.R.V.I.S. concluído: Núcleo neural estável. Conectividade: ${isOnline ? 'Online' : 'Offline (Modo Local Ativo)'}. Missões pendentes: ${pendingCount}. Registros de memória: ${memoriesCount}. Automações ativas: ${activeAutoCount}. Preparado para integração com Android Accessibility Service.`,
      actionTaken: 'diagnostics_run',
    };
  }

  // 9. GOOGLE DRIVE COMMANDS
  if (
    lower.includes('drive') ||
    lower.includes('google drive') ||
    lower.includes('meus arquivos') ||
    lower.includes('listar arquivos') ||
    lower.includes('documentos na nuvem') ||
    lower.includes('buscar arquivo') ||
    lower.includes('abrir drive')
  ) {
    return {
      replyText: `Acessando o subsistema do Google Drive, Senhor ${userName}. Redirecionando para o terminal de arquivos na nuvem.`,
      actionTaken: 'navigate',
      navigateToTab: 'drive',
    };
  }

  // 10. GMAIL COMMANDS
  if (
    lower.includes('gmail') ||
    lower.includes('email') ||
    lower.includes('e-mail') ||
    lower.includes('caixa de entrada') ||
    lower.includes('mensagens') ||
    lower.includes('meus emails') ||
    lower.includes('enviar email') ||
    lower.includes('ler email')
  ) {
    return {
      replyText: `Acessando a central do Gmail, Senhor ${userName}. Redirecionando para o painel de mensagens e correspondências.`,
      actionTaken: 'navigate',
      navigateToTab: 'gmail',
    };
  }

  // 11. AUTOMATIONS & ACCESSIBILITY SERVICE
  if (
    lower.includes('automação') ||
    lower.includes('automacao') ||
    lower.includes('accessibility service') ||
    lower.includes('serviço de acessibilidade') ||
    lower.includes('servico de acessibilidade')
  ) {
    return {
      replyText: `O módulo de automações está isolado da interface e modularizado. Os contratos para integração com o Android Accessibility Service (Kotlin) estão prontos no repositório nativo, aguardando compilação do APK para acesso aos nós de acessibilidade do sistema operacional.`,
      actionTaken: 'none',
    };
  }

  // 12. HELP / CAPABILITIES
  if (
    lower.includes('ajuda') ||
    lower.includes('o que você faz') ||
    lower.includes('o que voce faz') ||
    lower.includes('comandos')
  ) {
    return {
      replyText: `Estou ao seu dispor, Senhor ${userName}. Posso gerenciar suas missões diárias, consultar seu Google Drive, verificar e enviar mensagens no Gmail, arquivar notas em sua memória local, ler respostas por voz em português, fornecer diagnósticos em tempo real e orquestrar rotinas de automação preparadas para o Android nativo. Experimente dizer: "Abrir Google Drive", "Ver meus emails", "Status do sistema", ou "Lembre-se que preciso revisar o código".`,
      actionTaken: 'none',
    };
  }

  // 11. CONTEXTUAL INTELLIGENT FALLBACK
  return {
    replyText: `Compreendido, Senhor ${userName}. Processei sua mensagem: "${text}". O comando foi registrado na trilha de eventos locais e estou pronto para a próxima diretriz.`,
    actionTaken: 'none',
  };
}
