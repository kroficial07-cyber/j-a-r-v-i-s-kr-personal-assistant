import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);

// Scopes required for Drive and Gmail
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
];

// In-memory token storage (NEVER store in localStorage or sessionStorage)
let memoryAccessToken: string | null = null;

// Auth state listeners
type AuthStateCallback = (user: User | null, token: string | null) => void;
const listeners: Set<AuthStateCallback> = new Set();

export const subscribeToWorkspaceAuth = (callback: AuthStateCallback): (() => void) => {
  listeners.add(callback);
  callback(auth.currentUser, memoryAccessToken);
  return () => {
    listeners.delete(callback);
  };
};

const notifyListeners = () => {
  listeners.forEach((callback) => {
    callback(auth.currentUser, memoryAccessToken);
  });
};

// Monitor Firebase auth state
onAuthStateChanged(auth, (user) => {
  if (!user) {
    memoryAccessToken = null;
  }
  notifyListeners();
});

export const getWorkspaceAccessToken = (): string | null => {
  return memoryAccessToken;
};

export const isWorkspaceConnected = (): boolean => {
  return !!memoryAccessToken && !!auth.currentUser;
};

/**
 * Client-side Sign-in with Google Workspace Popup
 */
export const signInWithGoogleWorkspace = async (): Promise<{ user: User; accessToken: string }> => {
  const provider = new GoogleAuthProvider();
  WORKSPACE_SCOPES.forEach((scope) => provider.addScope(scope));
  provider.setCustomParameters({
    prompt: 'consent',
    access_type: 'offline',
  });

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || null;

    if (!token) {
      throw new Error('Falha ao obter token de acesso do Google Workspace. Permissão negada.');
    }

    memoryAccessToken = token;
    notifyListeners();
    return { user: result.user, accessToken: token };
  } catch (error: unknown) {
    console.error('Google Workspace Auth Error:', error);
    memoryAccessToken = null;
    notifyListeners();
    throw error;
  }
};

/**
 * Disconnect Google Workspace
 */
export const signOutFromGoogleWorkspace = async (): Promise<void> => {
  memoryAccessToken = null;
  await firebaseSignOut(auth);
  notifyListeners();
};
