import { getWorkspaceAccessToken } from './workspaceAuth';

export interface GmailEmailHeader {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  unread: boolean;
  starred: boolean;
  labels: string[];
}

export interface GmailFullEmail extends GmailEmailHeader {
  bodyText: string;
  bodyHtml?: string;
}

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

const getHeaders = () => {
  const token = getWorkspaceAccessToken();
  if (!token) {
    throw new Error('Sessão do Google Workspace não autenticada. Por favor, conecte sua conta Google.');
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

// Helper to decode Base64URL string
function decodeBase64Url(input: string): string {
  try {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const binStr = atob(base64);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch (e) {
    console.warn('Failed to decode email payload part:', e);
    return '';
  }
}

// Helper to encode UTF-8 string to Base64URL
function encodeBase64Url(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export const gmailService = {
  /**
   * Get Gmail Profile
   */
  async getProfile(): Promise<GmailProfile> {
    const headers = getHeaders();
    const res = await fetch(`${GMAIL_API_BASE}/profile`, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Erro ao carregar perfil do Gmail');
    }
    return await res.json();
  },

  /**
   * List recent messages from Gmail inbox with details
   */
  async listMessages(options?: {
    query?: string;
    maxResults?: number;
  }): Promise<GmailEmailHeader[]> {
    const headers = getHeaders();
    const max = options?.maxResults || 15;
    const q = options?.query ? encodeURIComponent(options.query) : '';
    const url = `${GMAIL_API_BASE}/messages?maxResults=${max}${q ? `&q=${q}` : ''}`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Erro ao consultar mensagens do Gmail (${res.status})`);
    }

    const data = await res.json();
    const messageRefs: { id: string; threadId: string }[] = data.messages || [];

    if (messageRefs.length === 0) return [];

    // Fetch details for each message in parallel
    const details = await Promise.all(
      messageRefs.map(async (msgRef) => {
        try {
          const detailRes = await fetch(
            `${GMAIL_API_BASE}/messages/${msgRef.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
            { headers }
          );
          if (!detailRes.ok) return null;
          const detailData = await detailRes.json();

          const headerList: { name: string; value: string }[] = detailData.payload?.headers || [];
          const getHeader = (name: string) =>
            headerList.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

          const subject = getHeader('Subject') || '(Sem assunto)';
          const from = getHeader('From') || 'Desconhecido';
          const to = getHeader('To') || '';
          const date = getHeader('Date') || '';
          const labels: string[] = detailData.labelIds || [];

          return {
            id: detailData.id,
            threadId: detailData.threadId,
            snippet: detailData.snippet || '',
            subject,
            from,
            to,
            date,
            unread: labels.includes('UNREAD'),
            starred: labels.includes('STARRED'),
            labels,
          } as GmailEmailHeader;
        } catch (e) {
          console.warn(`Failed to fetch message ${msgRef.id}:`, e);
          return null;
        }
      })
    );

    return details.filter((m): m is GmailEmailHeader => m !== null);
  },

  /**
   * Get full message content (including body text/html)
   */
  async getMessage(id: string): Promise<GmailFullEmail> {
    const headers = getHeaders();
    const res = await fetch(`${GMAIL_API_BASE}/messages/${id}?format=full`, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Erro ao carregar conteúdo do email');
    }

    const data = await res.json();
    const headerList: { name: string; value: string }[] = data.payload?.headers || [];
    const getHeader = (name: string) =>
      headerList.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    const subject = getHeader('Subject') || '(Sem assunto)';
    const from = getHeader('From') || 'Desconhecido';
    const to = getHeader('To') || '';
    const date = getHeader('Date') || '';
    const labels: string[] = data.labelIds || [];

    let bodyText = '';
    let bodyHtml = '';

    const extractParts = (part: any) => {
      if (!part) return;
      if (part.mimeType === 'text/plain' && part.body?.data) {
        bodyText += decodeBase64Url(part.body.data);
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        bodyHtml += decodeBase64Url(part.body.data);
      }
      if (part.parts && Array.isArray(part.parts)) {
        part.parts.forEach(extractParts);
      }
    };

    extractParts(data.payload);

    if (!bodyText && !bodyHtml && data.payload?.body?.data) {
      bodyText = decodeBase64Url(data.payload.body.data);
    }

    return {
      id: data.id,
      threadId: data.threadId,
      snippet: data.snippet || '',
      subject,
      from,
      to,
      date,
      unread: labels.includes('UNREAD'),
      starred: labels.includes('STARRED'),
      labels,
      bodyText: bodyText || data.snippet || '',
      bodyHtml,
    };
  },

  /**
   * Send an email with RFC 2822 format
   */
  async sendEmail(params: {
    to: string;
    subject: string;
    body: string;
  }): Promise<{ id: string; threadId: string }> {
    const headers = getHeaders();

    // Build standard RFC 2822 message
    // Encode Subject as UTF-8 B-encoded header if it contains non-ASCII characters
    const encodedSubject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(params.subject)))}?=`;
    const rfcMessage = [
      `To: ${params.to}`,
      `Subject: ${encodedSubject}`,
      'Content-Type: text/plain; charset=UTF-8',
      'MIME-Version: 1.0',
      '',
      params.body,
    ].join('\r\n');

    const raw = encodeBase64Url(rfcMessage);

    const res = await fetch(`${GMAIL_API_BASE}/messages/send`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Erro ao enviar email (${res.status})`);
    }

    return await res.json();
  },

  /**
   * Toggle Star or Mark Read/Unread
   */
  async modifyLabels(id: string, options: { addLabels?: string[]; removeLabels?: string[] }): Promise<void> {
    const headers = getHeaders();
    const res = await fetch(`${GMAIL_API_BASE}/messages/${id}/modify`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        addLabelIds: options.addLabels || [],
        removeLabelIds: options.removeLabels || [],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Erro ao alterar estado do email');
    }
  },
};
