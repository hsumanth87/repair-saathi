import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type {
  Booking,
  Device,
  Diagnosis,
  EwasteRequest,
  NotificationItem,
  Payment,
  Quotation,
  RecyclingPartner,
  RefurbishedListing,
  ScreenId,
  Technician,
  User,
  UserRole,
  Warranty,
} from '../types/repair';

export interface UploadedImageDraft {
  previewUrl: string;
  base64?: string;
  mimeType?: string;
  samplePath?: string;
  fileName: string;
}

interface AppContextValue {
  user: User | null;
  token: string | null;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  screen: ScreenId;
  initializing: boolean;
  navigate: (next: ScreenId) => void;
  loading: boolean;
  errorMessage: string | null;
  clearError: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Selection state across screens
  selectedTechId: string | null;
  setSelectedTechId: (id: string | null) => void;
  selectedBookingId: string | null;
  setSelectedBookingId: (id: string | null) => void;
  activeDiagnosis: Diagnosis | null;
  setActiveDiagnosis: (d: Diagnosis | null) => void;
  uploadedImage: UploadedImageDraft | null;
  setUploadedImage: (img: UploadedImageDraft | null) => void;
  diagnosisDraftDeviceId: string;
  setDiagnosisDraftDeviceId: (id: string) => void;
  diagnosisDraftSymptom: string;
  setDiagnosisDraftSymptom: (s: string) => void;

  // Domain datasets
  devices: Device[];
  technicians: Technician[];
  diagnoses: Diagnosis[];
  bookings: Booking[];
  quotations: Quotation[];
  payments: Payment[];
  warranties: Warranty[];
  recyclingPartners: RecyclingPartner[];
  refurbishedListings: RefurbishedListing[];
  ewasteRequests: EwasteRequest[];
  notifications: NotificationItem[];

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
    city: string;
    area: string;
  }) => Promise<void>;
  loginDemoRole: (role: UserRole, emailOverride?: string) => Promise<void>;
  logout: () => void;
  refreshWorkspaceData: () => Promise<void>;
  apiFetch: <T>(url: string, options?: RequestInit) => Promise<T>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'repairsaathi_token_v1';
const THEME_STORAGE_KEY = 'repairsaathi_theme_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(THEME_STORAGE_KEY) : null;
    return saved === 'dark' ? 'dark' : 'light';
  });

  const [token, setToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
  });

  const [user, setUser] = useState<User | null>(null);
  const [screen, setScreen] = useState<ScreenId>(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('autostart=1')) {
      return 'customer-home';
    }
    return 'splash';
  });

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(
      localStorage.getItem(TOKEN_STORAGE_KEY) ||
        window.location.search.includes('autostart=1')
    );
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [selectedTechId, setSelectedTechId] = useState<string | null>('tech-1');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>('bk-101');
  const [activeDiagnosis, setActiveDiagnosis] = useState<Diagnosis | null>(null);
  const [uploadedImage, setUploadedImage] = useState<UploadedImageDraft | null>(null);
  const [diagnosisDraftDeviceId, setDiagnosisDraftDeviceId] = useState('dev-1');
  const [diagnosisDraftSymptom, setDiagnosisDraftSymptom] = useState('');

  const [devices, setDevices] = useState<Device[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [recyclingPartners, setRecyclingPartners] = useState<RecyclingPartner[]>([]);
  const [refurbishedListings, setRefurbishedListings] = useState<RefurbishedListing[]>([]);
  const [ewasteRequests, setEwasteRequests] = useState<EwasteRequest[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Sync dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  }, []);

  const clearError = useCallback(() => setErrorMessage(null), []);

  const navigate = useCallback((next: ScreenId) => {
    setErrorMessage(null);
    setScreen(next);
    window.scrollTo({ top: 0 });
  }, []);

  const apiFetch = useCallback(
    async <T,>(url: string, options: RequestInit = {}): Promise<T> => {
      const headers = new Headers(options.headers);
      if (!headers.has('Content-Type') && options.body) {
        headers.set('Content-Type', 'application/json');
      }
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      const res = await fetch(url, { ...options, headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = (data as { error?: string }).error || `Request failed (${res.status})`;
        throw new Error(message);
      }
      return data as T;
    },
    [token]
  );

  const loadPublicCatalog = useCallback(async () => {
    try {
      const [techRes, recycleRes] = await Promise.all([
        fetch('/api/technicians').then((r) => r.json()),
        fetch('/api/recycling/partners').then((r) => r.json()),
      ]);
      setTechnicians(techRes.technicians ?? []);
      setRecyclingPartners(recycleRes.partners ?? []);
      setRefurbishedListings(recycleRes.refurbished ?? []);
    } catch {
      // Non-fatal on boot
    }
  }, []);

  const refreshWorkspaceData = useCallback(async () => {
    await loadPublicCatalog();
    if (!token) return;
    try {
      const [
        devRes,
        diagRes,
        bookRes,
        quoteRes,
        payRes,
        warRes,
        ewasteRes,
        notifRes,
      ] = await Promise.all([
        apiFetch<{ devices: Device[] }>('/api/devices'),
        apiFetch<{ diagnoses: Diagnosis[] }>('/api/diagnoses'),
        apiFetch<{ bookings: Booking[] }>('/api/bookings'),
        apiFetch<{ quotations: Quotation[] }>('/api/quotations'),
        apiFetch<{ payments: Payment[] }>('/api/payments'),
        apiFetch<{ warranties: Warranty[] }>('/api/warranties'),
        apiFetch<{ requests: EwasteRequest[] }>('/api/recycling/requests'),
        apiFetch<{ notifications: NotificationItem[] }>('/api/notifications'),
      ]);
      setDevices(devRes.devices);
      setDiagnoses(diagRes.diagnoses);
      if (!activeDiagnosis && diagRes.diagnoses.length > 0) {
        setActiveDiagnosis(diagRes.diagnoses[0]);
      }
      setBookings(bookRes.bookings);
      if (bookRes.bookings.length > 0 && !bookRes.bookings.some((b) => b.id === selectedBookingId)) {
        setSelectedBookingId(bookRes.bookings[0].id);
      }
      setQuotations(quoteRes.quotations);
      setPayments(payRes.payments);
      setWarranties(warRes.warranties);
      setEwasteRequests(ewasteRes.requests);
      setNotifications(notifRes.notifications);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to sync workspace.');
    }
  }, [activeDiagnosis, apiFetch, loadPublicCatalog, selectedBookingId, token]);

  const applySession = useCallback((nextToken: string, nextUser: User, targetScreen?: ScreenId) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
    window.scrollTo({ top: 0 });
    if (targetScreen) {
      setScreen(targetScreen);
    } else if (nextUser.role === 'technician') {
      setScreen('tech-dashboard');
    } else if (nextUser.role === 'admin') {
      setScreen('admin-dashboard');
    } else {
      setScreen('customer-home');
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string, silentToast = false) => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        applySession(data.token, data.user);
        if (!silentToast) {
          showToast(`Signed in as ${data.user.name}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Login failed';
        setErrorMessage(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [applySession, showToast]
  );

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      phone: string;
      password: string;
      role: UserRole;
      city: string;
      area: string;
    }) => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        applySession(data.token, data.user);
        showToast(`Welcome to RepairSaathi, ${data.user.name}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Registration failed';
        setErrorMessage(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [applySession, showToast]
  );

  const loginDemoRole = useCallback(
    async (role: UserRole, emailOverride?: string, silentToast = false) => {
      const emailMap: Record<UserRole, string> = {
        customer: 'ananya@repairsaathi.in',
        technician: 'arjun@repairsaathi.in',
        admin: 'admin@repairsaathi.in',
      };
      const email = emailOverride ?? emailMap[role];
      await login(email, 'Repair@2026', silentToast);
    },
    [login]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
    setBookings([]);
    setDevices([]);
    setScreen('login');
  }, []);

  // Hydrate existing session or handle ?autostart=1
  useEffect(() => {
    loadPublicCatalog();
    const isAutostart = window.location.search.includes('autostart=1');

    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Session expired'))))
        .then((data: { user: User }) => {
          setUser(data.user);
          if (isAutostart) {
            setScreen(
              data.user.role === 'technician'
                ? 'tech-dashboard'
                : data.user.role === 'admin'
                ? 'admin-dashboard'
                : 'customer-home'
            );
          }
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          setToken(null);
          if (isAutostart) {
            return loginDemoRole('customer', undefined, true).catch(() => {});
          }
        })
        .finally(() => setInitializing(false));
    } else if (isAutostart) {
      loginDemoRole('customer', undefined, true)
        .catch(() => {})
        .finally(() => setInitializing(false));
    } else {
      setInitializing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (token && user) {
      refreshWorkspaceData();
    }
  }, [token, user, refreshWorkspaceData]);

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        theme,
        toggleTheme,
        screen,
        initializing,
        navigate,
        loading,
        errorMessage,
        clearError,
        toastMessage,
        showToast,
        selectedTechId,
        setSelectedTechId,
        selectedBookingId,
        setSelectedBookingId,
        activeDiagnosis,
        setActiveDiagnosis,
        uploadedImage,
        setUploadedImage,
        diagnosisDraftDeviceId,
        setDiagnosisDraftDeviceId,
        diagnosisDraftSymptom,
        setDiagnosisDraftSymptom,
        devices,
        technicians,
        diagnoses,
        bookings,
        quotations,
        payments,
        warranties,
        recyclingPartners,
        refurbishedListings,
        ewasteRequests,
        notifications,
        login,
        register,
        loginDemoRole,
        logout,
        refreshWorkspaceData,
        apiFetch,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}
