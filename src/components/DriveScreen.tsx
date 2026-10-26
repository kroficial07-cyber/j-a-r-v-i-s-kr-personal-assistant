import React, { useState, useEffect, useCallback } from 'react';
import {
  driveService,
  DriveItem,
  DriveStorageQuota,
} from '../services/driveService';
import {
  isWorkspaceConnected,
  signInWithGoogleWorkspace,
  signOutFromGoogleWorkspace,
  subscribeToWorkspaceAuth,
} from '../services/workspaceAuth';
import { User } from 'firebase/auth';
import {
  HardDrive,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  Trash2,
  FileText,
  FileSpreadsheet,
  FileImage,
  Folder,
  File,
  LogIn,
  LogOut,
  AlertTriangle,
  X,
  Check,
  Cloud,
  FileCode,
} from 'lucide-react';

interface DriveScreenProps {
  onShowToast: (message: string, type?: 'info' | 'error' | 'success') => void;
}

type CategoryFilter = 'all' | 'docs' | 'sheets' | 'slides' | 'pdf' | 'images' | 'folders';

export const DriveScreen: React.FC<DriveScreenProps> = ({ onShowToast }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(isWorkspaceConnected());
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  const [files, setFiles] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [quota, setQuota] = useState<DriveStorageQuota | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newFileName, setNewFileName] = useState<string>('nota_jarvis.txt');
  const [newFileContent, setNewFileContent] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Delete confirmation modal state
  const [fileToDelete, setFileToDelete] = useState<DriveItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Subscribe to auth changes
  useEffect(() => {
    const unsubscribe = subscribeToWorkspaceAuth((user, token) => {
      setCurrentUser(user);
      setIsConnected(!!token && !!user);
    });
    return unsubscribe;
  }, []);

  const loadDriveData = useCallback(async () => {
    if (!isWorkspaceConnected()) return;
    setLoading(true);
    try {
      const [filesResult, quotaResult] = await Promise.allSettled([
        driveService.listFiles({
          search: searchQuery,
          category: activeCategory,
        }),
        driveService.getQuota(),
      ]);

      if (filesResult.status === 'fulfilled') {
        setFiles(filesResult.value.files);
      } else {
        console.error('Error fetching files:', filesResult.reason);
        onShowToast(filesResult.reason?.message || 'Falha ao carregar arquivos do Drive', 'error');
      }

      if (quotaResult.status === 'fulfilled') {
        setQuota(quotaResult.value);
      }
    } catch (e: any) {
      console.error(e);
      onShowToast(e.message || 'Erro de comunicação com o Google Drive', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeCategory, onShowToast]);

  useEffect(() => {
    if (isConnected) {
      loadDriveData();
    } else {
      setFiles([]);
      setQuota(null);
    }
  }, [isConnected, loadDriveData]);

  const handleConnect = async () => {
    setIsAuthenticating(true);
    try {
      await signInWithGoogleWorkspace();
      onShowToast('Google Drive conectado com sucesso!', 'success');
    } catch (err: any) {
      console.error(err);
      onShowToast(err.message || 'Falha na autenticação do Google', 'error');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await signOutFromGoogleWorkspace();
      onShowToast('Sessão do Google Workspace desconectada.', 'info');
    } catch (err: any) {
      onShowToast('Erro ao desconectar conta', 'error');
    }
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) {
      onShowToast('Informe um nome válido para o arquivo', 'error');
      return;
    }
    setIsCreating(true);
    try {
      const created = await driveService.createTextFile(newFileName.trim(), newFileContent);
      onShowToast(`Arquivo "${created.name}" salvo no Google Drive!`, 'success');
      setShowCreateModal(false);
      setNewFileName('nota_jarvis.txt');
      setNewFileContent('');
      loadDriveData();
    } catch (err: any) {
      onShowToast(err.message || 'Erro ao criar arquivo no Drive', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await driveService.deleteFile(fileToDelete.id);
      onShowToast(`"${fileToDelete.name}" removido com sucesso.`, 'success');
      setFileToDelete(null);
      loadDriveData();
    } catch (err: any) {
      onShowToast(err.message || 'Erro ao excluir arquivo', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper formatting
  const formatBytes = (bytesStr?: string) => {
    if (!bytesStr) return '0 B';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes) || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '--';
    const date = new Date(isoStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('folder')) return <Folder className="w-5 h-5 text-amber-400" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('csv')) return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    if (mimeType.includes('document') || mimeType.includes('word')) return <FileText className="w-5 h-5 text-cyan-400" />;
    if (mimeType.includes('image')) return <FileImage className="w-5 h-5 text-purple-400" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-rose-400" />;
    if (mimeType.includes('json') || mimeType.includes('javascript') || mimeType.includes('typescript')) return <FileCode className="w-5 h-5 text-cyan-300" />;
    return <File className="w-5 h-5 text-slate-400" />;
  };

  const categories: { key: CategoryFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'docs', label: 'Documentos' },
    { key: 'sheets', label: 'Planilhas' },
    { key: 'pdf', label: 'PDFs' },
    { key: 'images', label: 'Imagens' },
    { key: 'folders', label: 'Pastas' },
  ];

  return (
    <div className="space-y-5 pb-16">
      {/* Header card with cybernetic HUD aesthetics */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 border border-cyan-500/30 p-5 shadow-lg backdrop-blur-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <HardDrive className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-wider text-slate-100 uppercase font-mono">
                  Google Drive HUD
                </h2>
                <span className={`px-2 py-0.5 text-xs font-mono rounded-full border ${
                  isConnected 
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' 
                    : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                }`}>
                  {isConnected ? 'ONLINE / SINCRONIZADO' : 'OFFLINE'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Acesso aos arquivos na nuvem, busca em tempo real e criação de diretrizes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isConnected ? (
              <button
                onClick={handleConnect}
                disabled={isAuthenticating}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono tracking-wide shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all disabled:opacity-50 cursor-pointer"
              >
                {isAuthenticating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                Conectar Google Workspace
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {currentUser?.photoURL && (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-cyan-500/50"
                  />
                )}
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-medium text-slate-200">
                    {currentUser?.displayName || 'Usuário Google'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">{currentUser?.email}</p>
                </div>
                <button
                  onClick={handleDisconnect}
                  title="Desconectar do Google"
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 border border-slate-700/60 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quota bar if connected */}
        {isConnected && quota && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-cyan-400" />
              <span>
                Armazenamento em Nuvem: <strong className="text-cyan-300">{formatBytes(quota.usage)}</strong> utilizados de{' '}
                <strong className="text-slate-200">{quota.limit ? formatBytes(quota.limit) : 'Ilimitado'}</strong>
              </span>
            </div>
            {quota.usage && quota.limit && (
              <div className="w-full sm:w-48 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((parseInt(quota.usage, 10) / parseInt(quota.limit, 10)) * 100)
                    )}%`,
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {!isConnected ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center backdrop-blur-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <HardDrive className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-200 font-mono tracking-wide">
            Google Drive Desconectado
          </h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-2">
            Conecte sua conta Google Workspace para que o J.A.R.V.I.S. consiga listar, abrir, buscar documentos e criar relatórios salvos diretamente no seu Drive.
          </p>
          <button
            onClick={handleConnect}
            disabled={isAuthenticating}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold font-mono tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
          >
            {isAuthenticating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            Conectar Google Drive
          </button>
        </div>
      ) : (
        <>
          {/* Controls bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-cyan-400/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Pesquisar arquivos no Google Drive..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadDriveData()}
                className="w-full bg-slate-900/80 border border-slate-700/80 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 text-slate-200 text-sm rounded-xl pl-10 pr-4 py-2.5 placeholder-slate-500 font-sans outline-none transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-sm font-medium font-mono transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Arquivo</span>
              </button>
              <button
                onClick={loadDriveData}
                disabled={loading}
                title="Atualizar lista de arquivos"
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Category filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                  activeCategory === cat.key
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Files List */}
          {loading && files.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
              <p className="text-sm font-mono text-slate-400">Consultando subsistema Google Drive...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/30 p-12 text-center">
              <File className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-base font-medium text-slate-300">Nenhum arquivo encontrado</p>
              <p className="text-xs text-slate-500 mt-1">
                Tente ajustar os filtros ou pesquisar por outro termo.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="group relative flex items-start justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all duration-200 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)] backdrop-blur-sm"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex-shrink-0 mt-0.5">
                      {getFileIcon(file.mimeType)}
                    </div>
                    <div className="min-w-0">
                      <h4
                        className="text-sm font-medium text-slate-200 truncate group-hover:text-cyan-300 transition-colors"
                        title={file.name}
                      >
                        {file.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-400">
                        {file.size && <span>{formatBytes(file.size)}</span>}
                        {file.size && <span>•</span>}
                        <span>{formatDate(file.modifiedTime)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir no Google Drive"
                        className="p-2 rounded-lg bg-slate-800/80 hover:bg-cyan-950/60 hover:text-cyan-300 text-slate-400 border border-slate-700/60 transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => setFileToDelete(file)}
                      title="Excluir arquivo do Drive"
                      className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 border border-slate-700/60 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* CREATE FILE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-cyan-500/40 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100 font-mono">
                  Salvar Nota / Arquivo no Google Drive
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFile} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-mono text-cyan-300 mb-1">
                  Nome do Arquivo
                </label>
                <input
                  type="text"
                  required
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="ex: relatorio_jarvis.txt ou notas.md"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-cyan-300 mb-1">
                  Conteúdo do Arquivo
                </label>
                <textarea
                  rows={6}
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  placeholder="Escreva as diretrizes, notas ou dados para salvar na sua nuvem Google Drive..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl p-3 text-sm text-slate-100 outline-none font-sans resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium font-mono"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold font-mono shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50"
                >
                  {isCreating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Salvar no Drive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANDATORY EXPLICIT CONFIRMATION MODAL FOR DELETION */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-rose-500/50 p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-100 font-mono">
                Confirmar Exclusão no Google Drive
              </h3>
            </div>

            <p className="text-sm text-slate-300 mt-2">
              Tem certeza de que deseja excluir permanentemente o arquivo:
            </p>
            <div className="my-3 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-rose-300 truncate">
              {fileToDelete.name}
            </div>
            <p className="text-xs text-slate-400">
              Esta ação removerá o arquivo diretamente do seu Google Drive.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium font-mono"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold font-mono shadow-[0_0_15px_rgba(244,63,94,0.4)] disabled:opacity-50"
              >
                {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Confirmar e Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
