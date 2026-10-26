import React, { useState } from 'react';
import { MissionTask, MissionCategory, MissionPriority } from '../types';
import { audioSynthesizer } from '../services/audioService';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Circle,
  Plus,
  RotateCcw,
  Trash2,
  Flag,
  Target,
  Calendar,
  X,
  AlertCircle,
} from 'lucide-react';

interface MissionsScreenProps {
  missions: MissionTask[];
  onToggleComplete: (id: string) => void;
  onAddTask: (task: Omit<MissionTask, 'id' | 'createdAt' | 'completed'>) => void;
  onDeleteTask: (id: string) => void;
  onRenewDailyMissions: () => void;
}

export const MissionsScreen: React.FC<MissionsScreenProps> = ({
  missions,
  onToggleComplete,
  onAddTask,
  onDeleteTask,
  onRenewDailyMissions,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | MissionCategory>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<MissionCategory>('foco');
  const [priority, setPriority] = useState<MissionPriority>('media');
  const [isDaily, setIsDaily] = useState(true);

  const completedCount = missions.filter((m) => m.completed).length;
  const totalCount = missions.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredMissions = missions.filter((m) => {
    if (selectedFilter === 'all') return true;
    return m.category === selectedFilter;
  });

  const handleToggle = (id: string, currentState: boolean) => {
    onToggleComplete(id);
    if (!currentState) {
      // Marking completed
      audioSynthesizer.playSuccess();
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#06b6d4', '#3b82f6', '#38bdf8', '#ffffff'],
        });
      } catch {
        // ignore
      }
    } else {
      audioSynthesizer.playTap();
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    audioSynthesizer.playSuccess();
    onAddTask({
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      isDaily,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setCategory('foco');
    setPriority('media');
    setIsDaily(true);
    setShowAddModal(false);
  };

  const getPriorityBadge = (p: MissionPriority) => {
    switch (p) {
      case 'alta':
        return <span className="text-red-400 font-mono text-[11px] flex items-center gap-1"><Flag className="w-3 h-3" /> Alta</span>;
      case 'media':
        return <span className="text-amber-400 font-mono text-[11px] flex items-center gap-1"><Flag className="w-3 h-3" /> Média</span>;
      case 'baixa':
        return <span className="text-cyan-400 font-mono text-[11px] flex items-center gap-1"><Flag className="w-3 h-3" /> Baixa</span>;
    }
  };

  return (
    <div className="flex flex-col min-h-full px-4 pt-3 pb-24 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Target className="w-3.5 h-3.5" />
            <span>MÓDULO DE MISSÕES OPERACIONAIS</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-0.5">Metas & Diretrizes Diárias</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              audioSynthesizer.playTap();
              onRenewDailyMissions();
            }}
            title="Renovar ciclo diário de missões"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-cyan-500/50 rounded-lg text-xs font-mono text-slate-300 hover:text-cyan-300 transition-colors active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Renovar Diárias</span>
          </button>

          <button
            onClick={() => {
              audioSynthesizer.playTap();
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs font-mono hover:bg-cyan-400 transition-all active:scale-95 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Missão</span>
          </button>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-slate-400">CONFORMIDADE DO PROTOCOLO</span>
          <span className="text-sm font-mono font-bold text-cyan-400">{progressPercent}% CONCLUÍDO</span>
        </div>
        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>{completedCount} concluídas</span>
          <span>·</span>
          <span>{totalCount - completedCount} pendentes</span>
          <span>·</span>
          <span className="text-cyan-400">Auto-renovação 00:00</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
        {(['all', 'foco', 'saude', 'estudo', 'sistema'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => {
              audioSynthesizer.playTap();
              setSelectedFilter(cat);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-colors ${
              selectedFilter === cat
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            {cat === 'all' && 'TODAS'}
            {cat === 'foco' && 'FOCO'}
            {cat === 'saude' && 'SAÚDE'}
            {cat === 'estudo' && 'ESTUDO'}
            {cat === 'sistema' && 'SISTEMA'}
          </button>
        ))}
      </div>

      {/* Missions List */}
      <div className="space-y-2.5">
        {filteredMissions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-mono text-xs">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-300">Nenhuma missão encontrada para esta categoria.</p>
            <p className="mt-1">Clique em "Nova Missão" para cadastrar.</p>
          </div>
        ) : (
          filteredMissions.map((task) => (
            <div
              key={task.id}
              className={`p-3.5 rounded-xl border transition-all ${
                task.completed
                  ? 'bg-slate-950/60 border-slate-800/80 opacity-75'
                  : 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/40 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleToggle(task.id, task.completed)}
                  title={task.completed ? 'Marcar pendente' : 'Marcar concluída'}
                  className="mt-0.5 text-cyan-400 hover:text-cyan-300 transition-colors p-0.5 active:scale-90"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400 hover:text-cyan-400" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      className={`text-sm font-semibold truncate ${
                        task.completed ? 'line-through text-slate-400' : 'text-slate-100'
                      }`}
                    >
                      {task.title}
                    </h3>
                    <div className="shrink-0">{getPriorityBadge(task.priority)}</div>
                  </div>

                  {task.description && (
                    <p className={`text-xs mt-1 leading-relaxed ${task.completed ? 'text-slate-400' : 'text-slate-300'}`}>
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-slate-400">
                    <span className="uppercase">{task.category}</span>
                    <span>·</span>
                    {task.isDaily ? (
                      <span className="text-cyan-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Diária
                      </span>
                    ) : (
                      <span>Única</span>
                    )}
                    {task.completed && (
                      <>
                        <span>·</span>
                        <span className="text-emerald-400">Cumprida</span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    audioSynthesizer.playTap();
                    onDeleteTask(task.id);
                  }}
                  title="Remover missão"
                  className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-5 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                Cadastrar Nova Missão
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Título da Missão *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Treino matinal ou Revisão de código"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Instruções / Detalhes
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve descrição da meta..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MissionCategory)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  >
                    <option value="foco">Foco & Trabalho</option>
                    <option value="saude">Saúde & Treino</option>
                    <option value="estudo">Estudo & Pesquisa</option>
                    <option value="sistema">Sistema & Manutenção</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as MissionPriority)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isDaily"
                  checked={isDaily}
                  onChange={(e) => setIsDaily(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 w-4 h-4"
                />
                <label htmlFor="isDaily" className="text-xs text-slate-300 select-none cursor-pointer">
                  Missão diária recorrente (renova a cada dia)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs font-mono transition-colors shadow-md"
                >
                  Confirmar Missão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
