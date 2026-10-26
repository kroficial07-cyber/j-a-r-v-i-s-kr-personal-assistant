import React, { useState } from 'react';
import { MemoryItem, MemoryCategory } from '../types';
import { audioSynthesizer } from '../services/audioService';
import {
  Sparkles,
  Plus,
  Search,
  Trash2,
  Edit3,
  Bookmark,
  Shield,
  FileText,
  UserCheck,
  X,
  Check,
} from 'lucide-react';

interface MemoryScreenProps {
  memories: MemoryItem[];
  onAddMemory: (item: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateMemory: (id: string, updates: Partial<MemoryItem>) => void;
  onDeleteMemory: (id: string) => void;
}

export const MemoryScreen: React.FC<MemoryScreenProps> = ({
  memories,
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | MemoryCategory>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<MemoryCategory>('nota');

  const filteredMemories = memories.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleOpenAdd = () => {
    audioSynthesizer.playTap();
    setEditingId(null);
    setTitle('');
    setContent('');
    setCategory('nota');
    setShowModal(true);
  };

  const handleOpenEdit = (item: MemoryItem) => {
    audioSynthesizer.playTap();
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setCategory(item.category);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    audioSynthesizer.playSuccess();
    if (editingId) {
      onUpdateMemory(editingId, {
        title: title.trim(),
        content: content.trim(),
        category,
        updatedAt: Date.now(),
      });
    } else {
      onAddMemory({
        title: title.trim(),
        content: content.trim(),
        category,
      });
    }

    setShowModal(false);
  };

  const getCategoryBadge = (cat: MemoryCategory) => {
    switch (cat) {
      case 'preferencia':
        return (
          <span className="text-cyan-400 font-mono text-[11px] flex items-center gap-1">
            <UserCheck className="w-3 h-3" /> Preferência
          </span>
        );
      case 'diretriz':
        return (
          <span className="text-blue-400 font-mono text-[11px] flex items-center gap-1">
            <Shield className="w-3 h-3" /> Diretriz
          </span>
        );
      case 'fato':
        return (
          <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
            <Bookmark className="w-3 h-3" /> Fato
          </span>
        );
      case 'nota':
      default:
        return (
          <span className="text-amber-400 font-mono text-[11px] flex items-center gap-1">
            <FileText className="w-3 h-3" /> Nota
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-full px-4 pt-3 pb-24 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ARQUIVO NEURAL LOCAL</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-0.5">Memória do Usuário KR</h2>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs font-mono hover:bg-cyan-400 transition-all active:scale-95 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Memória</span>
        </button>
      </div>

      {/* Search and Category Filter */}
      <div className="space-y-2 mb-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar notas, preferências ou diretrizes..."
            className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(['all', 'preferencia', 'diretriz', 'fato', 'nota'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                audioSynthesizer.playTap();
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {cat === 'all' && 'TODAS'}
              {cat === 'preferencia' && 'PREFERÊNCIAS'}
              {cat === 'diretriz' && 'DIRETRIZES'}
              {cat === 'fato' && 'FATOS'}
              {cat === 'nota' && 'NOTAS'}
            </button>
          ))}
        </div>
      </div>

      {/* Memory Items List */}
      <div className="space-y-3">
        {filteredMemories.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-mono text-xs">
            <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-slate-300">Nenhum registro neural localizado.</p>
            <p className="mt-1">Cadastre uma nova preferência ou diga "Jarvis, lembre-se que...".</p>
          </div>
        ) : (
          filteredMemories.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-4 transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <h3 className="text-sm font-bold text-white tracking-wide truncate">{item.title}</h3>
                <div className="shrink-0">{getCategoryBadge(item.category)}</div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{item.content}</p>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                <span>
                  Atualizado em{' '}
                  {new Date(item.updatedAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    title="Editar memória"
                    className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Deseja apagar a memória "${item.title}"?`)) {
                        audioSynthesizer.playTap();
                        onDeleteMemory(item.id);
                      }
                    }}
                    title="Excluir memória"
                    className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-5 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                {editingId ? 'Editar Registro de Memória' : 'Novo Registro de Memória'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Título do Registro *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Nome preferencial ou Diretriz de Automação"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as MemoryCategory)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                >
                  <option value="preferencia">Preferência Pessoal</option>
                  <option value="diretriz">Diretriz Operacional</option>
                  <option value="fato">Fato Fixo</option>
                  <option value="nota">Nota Rápida</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Conteúdo / Descrição *
                </label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Digite os detalhes da memória que o J.A.R.V.I.S. deve manter..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs font-mono transition-colors shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Salvar Memória
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
