import React, { useState, useEffect } from 'react';
import { Bell, BellRing, BellOff, Download, Smartphone, Sparkles, Send } from 'lucide-react';
import { WeatherCondition } from '../types';
import { getSeasonStageForMonth, getCurrentMonth } from '../utils/seasonUtils';
import { getSavedFcmToken, isIosDevice, isStandalonePwa } from '../services/firebaseService';

interface NotificationPermissionControlProps {
  weather: WeatherCondition;
  currentMonth?: number;
  onOpenPushModal?: () => void;
}

export const NotificationPermissionControl: React.FC<NotificationPermissionControlProps> = ({
  weather,
  currentMonth = getCurrentMonth(),
  onOpenPushModal,
}) => {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [hasFcmToken, setHasFcmToken] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  const isIos = isIosDevice();
  const isStandalone = isStandalonePwa();
  const seasonInfo = getSeasonStageForMonth(currentMonth);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    } else {
      setPermission('unsupported');
    }

    const { token } = getSavedFcmToken();
    setHasFcmToken(Boolean(token));

    // Capture PWA beforeinstallprompt event for Chromium / Android
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    setIsInstalling(true);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install prompt outcome: ${outcome}`);
    setDeferredPrompt(null);
    setIsInstalling(false);
  };

  return (
    <div className="flex items-center space-x-2 text-xs font-mono">
      {/* PWA Install Button for Chrome/Android if prompt available */}
      {deferredPrompt && (
        <button
          onClick={handleInstallApp}
          disabled={isInstalling}
          className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white border border-emerald-700 flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer"
          title="Install Garden & Lawn Scheduler as a Progressive Web App"
        >
          <Download className="w-3.5 h-3.5 text-amber-300" />
          <span>Install App</span>
        </button>
      )}

      {/* Main Dedicated Push Reminders Button */}
      <button
        id="header-push-reminders-btn"
        onClick={onOpenPushModal}
        className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all shadow-2xs font-medium cursor-pointer ${
          hasFcmToken || permission === 'granted'
            ? 'bg-emerald-800 hover:bg-emerald-900 text-emerald-100 border border-emerald-700'
            : 'bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold border border-amber-500'
        }`}
        title="Open Push Reminders & FCM Configuration Hub"
      >
        {hasFcmToken || permission === 'granted' ? (
          <>
            <BellRing className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
            <span className="text-white">Push Alerts Active</span>
          </>
        ) : (
          <>
            <Bell className="w-3.5 h-3.5 text-slate-950" />
            <span>Enable Reminders</span>
          </>
        )}
      </button>
    </div>
  );
};
