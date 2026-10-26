import React, { useState, useEffect, useCallback } from 'react';
import {
  gmailService,
  GmailEmailHeader,
  GmailFullEmail,
  GmailProfile,
} from '../services/gmailService';
import {
  isWorkspaceConnected,
  signInWithGoogleWorkspace,
  signOutFromGoogleWorkspace,
  subscribeToWorkspaceAuth,
} from '../services/workspaceAuth';
import { User } from 'firebase/auth';
import {
  Mail,
  Search,
  PenSquare,
  RefreshCw,
  Star,
  StarOff,
  Inbox,
  Send,
  AlertTriangle,
  X,
  Check,
  LogIn,
  LogOut,
  Clock,
  User as UserIcon,
  Reply,
  MailCheck,
  MailQuestion,
} from 'lucide-react';

interface GmailScreenProps {
  onShowToast: (message: string, type?: 'info' | 'error' | 'success') => void;
}

type MailFilter = 'all' | 'unread' | 'starred' | 'sent';

export const GmailScreen: React.FC<GmailScreenProps> = ({ onShowToast }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(isWorkspaceConnected());
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  const [emails, setEmails] = useState<GmailEmailHeader[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<MailFilter>('all');
  const [profile, setProfile] = useState<GmailProfile | null>(null);

  // Read message modal state
  const [selectedEmail, setSelectedEmail] = useState<GmailFullEmail | null>(null);
  const [loadingEmailBody, setLoadingEmailBody] = useState<boolean>(false);

  // Compose email modal state
  const [showComposeModal, setShowComposeModal] = useState<boolean>(false);
  const [composeTo, setComposeTo] = useState<string>('');
  const [composeSubject, setComposeSubject] = useState<string>('');
  const [composeBody, setComposeBody] = useState<string>('');

  // Mandatory explicit confirmation dialog state before sending email
  const [showSendConfirmation, setShowSendConfirmation] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);

  // Subscribe to auth changes
  useEffect(() => {
    const unsubscribe = subscribeToWorkspaceAuth((user, token) => {
      setCurrentUser(user);
      setIsConnected(!!token && !!user);
    });
    return unsubscribe;
  }, []);

  const loadGmailData = useCallback(async () => {
    if (!isWorkspaceConnected()) return;
    setLoading(true);
    try {
      let queryFilter = searchQuery.trim();
      if (activeFilter === 'unread') {
        queryFilter = queryFilter ? `${queryFilter} is:unread` : 'is:unread';
      } else if (activeFilter === 'starred') {
        queryFilter = queryFilter ? `${queryFilter} is:starred` : 'is:starred';
      } else if (activeFilter === 'sent') {
        queryFilter = queryFilter ? `${queryFilter} in:sent` : 'in:sent';
      }

      const [listResult, profileResult] = await Promise.allSettled([
        gmailService.listMessages({
          query: queryFilter,
          maxResults: 20,
        }),
        gmailService.getProfile(),
      ]);

      if (listResult.status === 'fulfilled') {
        setEmails(listResult.value);
      } else {
        console.error('Error fetching emails:', listResult.reason);
        onShowToast(listResult.reason?.message || 'Falha ao buscar mensagens do Gmail', 'error');
      }

      if (profileResult.status === 'fulfilled') {
        setProfile(profileResult.value);
      }
    } catch (e: any) {
      console.error(e);
      onShowToast(e.message || 'Erro de comunicação com o Gmail', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeFilter, onShowToast]);

  useEffect(() => {
    if (isConnected) {
      loadGmailData();
    } else {
      setEmails([]);
      setProfile(null);
    }
  }, [isConnected, loadGmailData]);

  const handleConnect = async () => {
    setIsAuthenticating(true);
    try {
      await signInWithGoogleWorkspace();
      onShowToast('Gmail conectado com sucesso!', 'success');
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
      onShowToast('Sessão do Google Workspace encerrada.', 'info');
    } catch (err: any) {
      onShowToast('Erro ao desconectar conta', 'error');
    }
  };

  const handleOpenEmail = async (header: GmailEmailHeader) => {
    setLoadingEmailBody(true);
    try {
      const full = await gmailService.getMessage(header.id);
      setSelectedEmail(full);

      // Auto mark as read in local state
      if (header.unread) {
        gmailService.modifyLabels(header.id, { removeLabels: ['UNREAD'] }).catch(console.warn);
        setEmails((prev) =>
          prev.map((e) => (e.id === header.id ? { ...e, unread: false } : e))
        );
      }
    } catch (err: any) {
      onShowToast(err.message || 'Erro ao carregar conteúdo do email', 'error');
    } finally {
      setLoadingEmailBody(false);
    }
  };

  const handleToggleStar = async (e: React.MouseEvent, msg: GmailEmailHeader) => {
    e.stopPropagation();
    const newStarred = !msg.starred;
    try {
      await gmailService.modifyLabels(msg.id, {
        addLabels: newStarred ? ['STARRED'] : [],
        removeLabels: newStarred ? [] : ['STARRED'],
      });
      setEmails((prev) =>
        prev.map((item) => (item.id === msg.id ? { ...item, starred: newStarred } : item))
      );
      if (selectedEmail?.id === msg.id) {
        setSelectedEmail({ ...selectedEmail, starred: newStarred });
      }
    } catch (err: any) {
      onShowToast('Erro ao alterar estrela do email', 'error');
    }
  };

  const handleToggleRead = async (e: React.MouseEvent, msg: GmailEmailHeader) => {
    e.stopPropagation();
    const newUnread = !msg.unread;
    try {
      await gmailService.modifyLabels(msg.id, {
        addLabels: newUnread ? ['UNREAD'] : [],
        removeLabels: newUnread ? [] : ['UNREAD'],
      });
      setEmails((prev) =>
        prev.map((item) => (item.id === msg.id ? { ...item, unread: newUnread } : item))
      );
      if (selectedEmail?.id === msg.id) {
        setSelectedEmail({ ...selectedEmail, unread: newUnread });
      }
    } catch (err: any) {
      onShowToast('Erro ao atualizar status de leitura', 'error');
    }
  };

  const handleInitiateSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim()) {
      onShowToast('Informe o endereço de destinatário', 'error');
      return;
    }
    if (!composeSubject.trim()) {
      onShowToast('Informe o assunto da mensagem', 'error');
      return;
    }
    // Show mandatory confirmation modal before sending
    setShowSendConfirmation(true);
  };

  const handleConfirmSendEmail = async () => {
    setIsSending(true);
    try {
      await gmailService.sendEmail({
        to: composeTo.trim(),
        subject: composeSubject.trim(),
        body: composeBody,
      });
      onShowToast(`Email enviado com sucesso para ${composeTo.trim()}!`, 'success');
      setShowSendConfirmation(false);
      setShowComposeModal(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      loadGmailData();
    } catch (err: any) {
      onShowToast(err.message || 'Erro ao enviar email', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleReply = (email: GmailFullEmail) => {
    // Extract raw email from format "Name <email@domain>"
    const emailMatch = email.from.match(/<([^>]+)>/);
    const toAddress = emailMatch ? emailMatch[1] : email.from;
    const reSubject = email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`;

    setComposeTo(toAddress);
    setComposeSubject(reSubject);
    setComposeBody(`\n\n--- Mensagem Original em ${email.date} ---\n${email.bodyText.substring(0, 300)}...`);
    setSelectedEmail(null);
    setShowComposeModal(true);
  };

  const filters: { key: MailFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'unread', label: 'Não Lidos' },
    { key: 'starred', label: 'Com Estrela' },
    { key: 'sent', label: 'Enviados' },
  ];

  return (
    <div className="space-y-5 pb-16">
      {/* HUD Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 border border-cyan-500/30 p-5 shadow-lg backdrop-blur-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Mail className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-wider text-slate-100 uppercase font-mono">
                  Gmail Terminal HUD
                </h2>
                <span
                  className={`px-2 py-0.5 text-xs font-mono rounded-full border ${
                    isConnected
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {isConnected ? 'ONLINE / SINCRONIZADO' : 'OFFLINE'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Comunicação segura com sua caixa de entrada, envio de emails e triagem neural.
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
                Conectar Gmail
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
                    {profile?.emailAddress || currentUser?.email || 'Conectado'}
                  </p>
                  <p className="text-[10px] text-cyan-400 font-mono">
                    {profile ? `${profile.messagesTotal} mensagens no total` : 'Sincronizado'}
                  </p>
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
      </div>

      {!isConnected ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center backdrop-blur-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <Mail className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-200 font-mono tracking-wide">
            Gmail Desconectado
          </h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-2">
            Conecte sua conta Google Workspace para que o J.A.R.V.I.S. consiga verificar sua caixa de entrada, ler mensagens importantes e enviar respostas sob comando.
          </p>
          <button
            onClick={handleConnect}
            disabled={isAuthenticating}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold font-mono tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
          >
            {isAuthenticating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            Conectar Gmail
          </button>
        </div>
      ) : (
        <>
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-cyan-400/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Pesquisar emails por remetente, assunto ou termo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadGmailData()}
                className="w-full bg-slate-900/80 border border-slate-700/80 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 text-slate-200 text-sm rounded-xl pl-10 pr-4 py-2.5 placeholder-slate-500 font-sans outline-none transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowComposeModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 text-sm font-bold font-mono transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
              >
                <PenSquare className="w-4 h-4" />
                <span>Compor Email</span>
              </button>
              <button
                onClick={loadGmailData}
                disabled={loading}
                title="Atualizar caixa de entrada"
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                  activeFilter === f.key
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Emails list */}
          {loading && emails.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
              <p className="text-sm font-mono text-slate-400">Consultando mensagens no Gmail...</p>
            </div>
          ) : emails.length === 0 ? (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/30 p-12 text-center">
              <Inbox className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-base font-medium text-slate-300">Nenhum email encontrado</p>
              <p className="text-xs text-slate-500 mt-1">
                Sua caixa postal está em dia ou não há resultados para a busca informada.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {emails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => handleOpenEmail(email)}
                  className={`group relative flex items-start justify-between gap-3 p-4 rounded-xl transition-all duration-200 cursor-pointer backdrop-blur-sm border ${
                    email.unread
                      ? 'bg-slate-900/90 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                      : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={(e) => handleToggleStar(e, email)}
                      title={email.starred ? 'Remover estrela' : 'Adicionar estrela'}
                      className="p-1 rounded text-slate-500 hover:text-amber-400 mt-0.5 cursor-pointer"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          email.starred ? 'fill-amber-400 text-amber-400' : ''
                        }`}
                      />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs truncate ${
                            email.unread
                              ? 'font-bold text-slate-100'
                              : 'font-medium text-slate-300'
                          }`}
                        >
                          {email.from}
                        </span>
                        {email.unread && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        )}
                      </div>
                      <h4
                        className={`text-sm mt-0.5 truncate ${
                          email.unread
                            ? 'font-bold text-cyan-200'
                            : 'font-medium text-slate-200 group-hover:text-cyan-300'
                        }`}
                      >
                        {email.subject}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5 font-sans">
                        {email.snippet}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                      {email.date.split(' ').slice(0, 4).join(' ')}
                    </span>
                    <button
                      onClick={(e) => handleToggleRead(e, email)}
                      title={email.unread ? 'Marcar como lido' : 'Marcar como não lido'}
                      className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-cyan-300 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                    >
                      {email.unread ? <MailCheck className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* READ EMAIL MODAL */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-slate-900 border border-cyan-500/40 p-6 shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800 gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100 font-sans">
                  {selectedEmail.subject}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 text-xs font-mono text-slate-400">
                  <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>De: <strong>{selectedEmail.from}</strong></span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs font-mono text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{selectedEmail.date}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Body */}
            <div className="flex-1 overflow-y-auto my-4 pr-2 font-sans text-sm text-slate-200 leading-relaxed whitespace-pre-wrap selection:bg-cyan-500/30">
              {loadingEmailBody ? (
                <div className="py-12 text-center">
                  <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-2" />
                  <p className="text-xs font-mono text-slate-400">Decodificando mensagem...</p>
                </div>
              ) : (
                selectedEmail.bodyText || selectedEmail.snippet
              )}
            </div>

            {/* Actions footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedEmail(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium font-mono"
              >
                Fechar
              </button>
              <button
                onClick={() => handleReply(selectedEmail)}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold font-mono shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                <Reply className="w-4 h-4" />
                Responder Mensagem
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPOSE EMAIL MODAL */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-cyan-500/40 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <PenSquare className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100 font-mono">
                  Compor Mensagem no Gmail
                </h3>
              </div>
              <button
                onClick={() => setShowComposeModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInitiateSend} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-mono text-cyan-300 mb-1">
                  Para (Destinatário)
                </label>
                <input
                  type="email"
                  required
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="destinatario@exemplo.com"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-cyan-300 mb-1">
                  Assunto
                </label>
                <input
                  type="text"
                  required
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Assunto da mensagem"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-cyan-300 mb-1">
                  Mensagem
                </label>
                <textarea
                  rows={6}
                  required
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Escreva sua mensagem..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl p-3 text-sm text-slate-100 outline-none font-sans resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium font-mono"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold font-mono shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                >
                  <Send className="w-4 h-4" />
                  Revisar e Enviar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANDATORY EXPLICIT CONFIRMATION MODAL BEFORE SENDING EMAIL */}
      {showSendConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-cyan-500/60 p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-cyan-400 mb-3">
              <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40">
                <Send className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-slate-100 font-mono">
                Confirmar Disparo de Email
              </h3>
            </div>

            <p className="text-sm text-slate-300 mt-2">
              Confirma o envio desta mensagem através da sua conta oficial do Gmail?
            </p>

            <div className="my-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1.5">
              <div>
                <span className="text-slate-500">Destinatário:</span>{' '}
                <strong className="text-cyan-300">{composeTo}</strong>
              </div>
              <div>
                <span className="text-slate-500">Assunto:</span>{' '}
                <strong className="text-slate-200">{composeSubject}</strong>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Esta ação enviará uma mensagem real pela API do Google Workspace para o destinatário informado.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowSendConfirmation(false)}
                disabled={isSending}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium font-mono"
              >
                Voltar e Revisar
              </button>
              <button
                type="button"
                onClick={handleConfirmSendEmail}
                disabled={isSending}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold font-mono shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50"
              >
                {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirmar e Enviar Agora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
