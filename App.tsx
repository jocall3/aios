
import React, { Suspense, useCallback, useMemo, useState, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { useGlobalState } from './contexts/GlobalStateContext.tsx';
import type { ViewType, AppUser, Feature, CustomFeature, FeatureCategory } from './types.ts';
import { CommandPalette } from './components/CommandPalette.tsx';
import { NotificationProvider } from './contexts/NotificationContext.tsx';
import { useTheme } from './hooks/useTheme.ts';
import { VaultProvider } from './components/vault/VaultProvider.tsx';
import { initGoogleAuth, getAllCustomFeatures } from './services/index.ts';
import { Window } from './components/desktop/Window.tsx';
import { FeatureDock } from './components/desktop/FeatureDock.tsx';
import { Taskbar } from './components/desktop/Taskbar.tsx';
import { FEATURES_MAP, componentMap } from './components/features/index.ts';
import { LandingPage } from './components/LandingPage.tsx';
import { OnboardingModal } from './components/OnboardingModal.tsx';
import { useLocalStorage } from './hooks/useLocalStorage.ts';


export const LoadingIndicator: React.FC = () => (
    <div className="w-full h-full flex items-center justify-center bg-surface">
        <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0s' }}></div>
            <div className="w-4 h-4 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-4 h-4 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            <span className="text-text-secondary ml-2">Loading Feature...</span>
        </div>
    </div>
);

interface LocalStorageConsentModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

const LocalStorageConsentModal: React.FC<LocalStorageConsentModalProps> = ({ onAccept, onDecline }) => {
  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center fade-in">
      <div 
        className="bg-surface border border-border rounded-2xl shadow-2xl shadow-black/50 w-full max-w-md m-4 p-8 text-center animate-pop-in"
      >
        <h2 className="text-2xl mb-4">Store Data Locally?</h2>
        <p className="text-text-secondary mb-6">
          This application uses your browser's local storage to save your settings and remember your progress between sessions. This data stays on your computer and is not shared.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onDecline}
            className="px-6 py-2 bg-surface border border-border text-text-primary font-bold rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            className="btn-primary px-6 py-2"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

interface WindowState {
  id: string;
  props?: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isMinimized: boolean;
}

const Z_INDEX_BASE = 10;

const DesktopExperience: React.FC = () => {
    const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const [windows, setWindows] = useState<Record<string, WindowState>>({});
    const [activeId, setActiveId] = useState<string | null>(null);
    const [nextZIndex, setNextZIndex] = useState(Z_INDEX_BASE);
    const [customFeatures, setCustomFeatures] = useState<CustomFeature[]>([]);

    const fetchCustomFeatures = useCallback(async () => {
        const features = await getAllCustomFeatures();
        setCustomFeatures(features);
    }, []);

    useEffect(() => {
        fetchCustomFeatures();
        window.addEventListener('custom-feature-update', fetchCustomFeatures);
        return () => window.removeEventListener('custom-feature-update', fetchCustomFeatures);
    }, [fetchCustomFeatures]);

    const allFeatures = useMemo(() => {
        const features = new Map<string, Feature | (Omit<CustomFeature, 'code'> & { component: React.FC<any>, category: FeatureCategory, props: any })>();
        FEATURES_MAP.forEach((value, key) => features.set(key, value));
        customFeatures.forEach(f => {
            features.set(f.id, { 
                ...f, 
                component: componentMap['custom-feature-runner'], 
                category: 'Custom', 
                props: { feature: f } 
            });
        });
        return features;
    }, [customFeatures]);


    const openWindow = useCallback((featureId: ViewType, props: any = {}) => {
        const newZIndex = nextZIndex + 1;
        setNextZIndex(newZIndex);
        setActiveId(featureId);

        setWindows(prev => {
            const existingWindow = prev[featureId];
            if (existingWindow) {
                return {
                    ...prev,
                    [featureId]: {
                        ...existingWindow,
                        isMinimized: false,
                        zIndex: newZIndex,
                        props: { ...existingWindow.props, ...props },
                    }
                };
            }

            const openWindowsCount = Object.values(prev).filter(w => !w.isMinimized).length;
            const newWindow: WindowState = {
                id: featureId,
                position: { x: 50 + openWindowsCount * 30, y: 50 + openWindowsCount * 30 },
                size: { width: 960, height: 720 },
                zIndex: newZIndex,
                isMinimized: false,
                props,
            };
            return { ...prev, [featureId]: newWindow };
        });
    }, [nextZIndex]);

    const handlePaletteSelect = (view: ViewType) => {
        openWindow(view);
        setCommandPaletteOpen(false);
    };

    const closeWindow = (id: string) => {
        setWindows(prev => {
            const newState = { ...prev };
            delete newState[id];
            return newState;
        });
        if (activeId === id) {
            setActiveId(null);
        }
    };

    const minimizeWindow = (id: string) => {
        setWindows(prev => ({
            ...prev,
            [id]: { ...prev[id], isMinimized: true }
        }));
        if (activeId === id) {
            setActiveId(null);
        }
    };

    const focusWindow = (id: string) => {
        if (id === activeId) return;
        const newZIndex = nextZIndex + 1;
        setNextZIndex(newZIndex);
        setActiveId(id);
        setWindows(prev => ({
            ...prev,
            [id]: { ...prev[id], zIndex: newZIndex }
        }));
    };
    
    const updateWindowState = (id: string, updates: Partial<WindowState>) => {
        setWindows(prev => ({
            ...prev,
            [id]: { ...prev[id], ...updates }
        }));
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setCommandPaletteOpen(o => !o);
            }
            if (e.key === 'Escape') {
                setCommandPaletteOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const openWindowsList = Object.values(windows).filter(w => !w.isMinimized);
    const minimizedWindowsList = Object.values(windows).filter(w => w.isMinimized);

    return (
        <div className="h-full w-full flex flex-col bg-transparent overflow-hidden">
            <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} onSelect={handlePaletteSelect} />

            <div className="flex-grow relative">
                <FeatureDock onOpen={openWindow} customFeatures={customFeatures} />
                {openWindowsList.map(win => {
                    const feature = allFeatures.get(win.id);
                    if (!feature) return null;
                    const featureWithProps = { ...feature, props: win.props };
                    return (
                        <Window
                            key={win.id}
                            feature={featureWithProps}
                            state={win}
                            isActive={win.id === activeId}
                            onClose={() => closeWindow(win.id)}
                            onMinimize={() => minimizeWindow(win.id)}
                            onFocus={() => focusWindow(win.id)}
                            onUpdate={updateWindowState}
                        />
                    );
                })}
            </div>

            <Taskbar
                minimizedWindows={minimizedWindowsList.map(w => allFeatures.get(w.id)).filter(Boolean) as (Feature | CustomFeature)[]}
                onRestore={(id) => openWindow(id)}
            />
        </div>
    );
};


function App() {
  useTheme();
  const { dispatch } = useGlobalState();
  
  const [lsConsent, setLsConsent] = useLocalStorage<'granted' | 'declined' | null>('devcore_ls_consent', null);
  const [showOnboarding, setShowOnboarding] = useLocalStorage('devcore_show_onboarding', true);
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    initGoogleAuth((appUser: AppUser | null) => {
        dispatch({ type: 'SET_APP_USER', payload: appUser });
    });
  }, [dispatch]);

  const handleConsent = (consent: 'granted' | 'declined') => {
      setLsConsent(consent);
      if (consent === 'granted') {
        window.location.reload();
      }
  };
  
  const handleLaunch = () => {
      setShowLanding(false);
  }

  if (lsConsent === null) {
      return <LocalStorageConsentModal onAccept={() => handleConsent('granted')} onDecline={() => handleConsent('declined')} />;
  }
  
  if (showLanding) {
      return <LandingPage onLaunch={handleLaunch} />;
  }

  return (
    <ErrorBoundary>
        <NotificationProvider>
            <VaultProvider>
                {showOnboarding && <OnboardingModal onAcknowledge={() => setShowOnboarding(false)} />}
                <DesktopExperience />
            </VaultProvider>
        </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
