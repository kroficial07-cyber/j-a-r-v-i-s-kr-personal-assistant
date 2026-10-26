import { getWorkspaceAccessToken } from './workspaceAuth';

export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  starred?: boolean;
  trashed?: boolean;
  owners?: { displayName?: string; emailAddress?: string; photoLink?: string }[];
}

export interface DriveStorageQuota {
  limit?: string;
  usage?: string;
  usageInDrive?: string;
  usageInDriveTrash?: string;
}

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';

const getHeaders = () => {
  const token = getWorkspaceAccessToken();
  if (!token) {
    throw new Error('Sessão do Google Workspace não autenticada. Por favor, conecte sua conta Google.');
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const driveService = {
  /**
   * List files from user's Google Drive
   */
  async listFiles(params?: {
    search?: string;
    category?: 'all' | 'docs' | 'sheets' | 'slides' | 'images' | 'folders' | 'pdf';
    pageSize?: number;
  }): Promise<{ files: DriveItem[]; nextPageToken?: string }> {
    const headers = getHeaders();
    const pageSize = params?.pageSize || 25;

    const queries: string[] = ['trashed = false'];

    if (params?.search && params.search.trim()) {
      const sanitized = params.search.trim().replace(/'/g, "\\'");
      queries.push(`name contains '${sanitized}'`);
    }

    if (params?.category) {
      switch (params.category) {
        case 'docs':
          queries.push("(mimeType = 'application/vnd.google-apps.document' or mimeType = 'text/plain' or mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')");
          break;
        case 'sheets':
          queries.push("(mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'text/csv' or mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')");
          break;
        case 'slides':
          queries.push("(mimeType = 'application/vnd.google-apps.presentation' or mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation')");
          break;
        case 'images':
          queries.push("mimeType contains 'image/'");
          break;
        case 'folders':
          queries.push("mimeType = 'application/vnd.google-apps.folder'");
          break;
        case 'pdf':
          queries.push("mimeType = 'application/pdf'");
          break;
      }
    }

    const q = encodeURIComponent(queries.join(' and '));
    const fields = encodeURIComponent(
      'nextPageToken,files(id,name,mimeType,size,modifiedTime,webViewLink,iconLink,thumbnailLink,starred,trashed,owners)'
    );
    const url = `${DRIVE_API_BASE}/files?pageSize=${pageSize}&fields=${fields}&orderBy=modifiedTime desc&q=${q}`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Erro ao carregar arquivos do Drive (${res.status})`);
    }

    const data = await res.json();
    return {
      files: data.files || [],
      nextPageToken: data.nextPageToken,
    };
  },

  /**
   * Retrieve Drive Storage Quota and User Info
   */
  async getQuota(): Promise<DriveStorageQuota> {
    const headers = getHeaders();
    const url = `${DRIVE_API_BASE}/about?fields=storageQuota,user`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Erro ao consultar capacidade do Drive');
    }

    const data = await res.json();
    return data.storageQuota || {};
  },

  /**
   * Create a text or markdown file directly in Google Drive
   */
  async createTextFile(fileName: string, content: string, mimeType = 'text/plain'): Promise<DriveItem> {
    const token = getWorkspaceAccessToken();
    if (!token) throw new Error('Google Workspace não conectado.');

    const metadata = {
      name: fileName,
      mimeType: mimeType,
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
      content +
      closeDelimiter;

    const res = await fetch(`${UPLOAD_API_BASE}/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,modifiedTime,size`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Erro ao criar arquivo no Drive (${res.status})`);
    }

    return await res.json();
  },

  /**
   * Delete a file permanently or move to trash
   */
  async deleteFile(fileId: string): Promise<void> {
    const headers = getHeaders();
    const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
      method: 'DELETE',
      headers,
    });

    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Erro ao excluir arquivo (${res.status})`);
    }
  },
};
