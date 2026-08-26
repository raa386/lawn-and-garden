import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  Copy,
  Check,
  Smartphone,
  Sparkles,
  X,
  Send,
  AlertTriangle,
  Info,
  ShieldCheck,
  Settings,
  Share2,
  PlusSquare,
  RefreshCw,
  ExternalLink,
  Code,
  Terminal,
} from 'lucide-react';
import {
  registerForPushNotifications,
  getSavedFcmToken,
  clearSavedFcmToken,
  getActiveFirebaseConfig,
  saveActiveFirebaseConfig,
  isIosDevice,
  isStandalonePwa,
  FirebaseConfig,
} from '../services/firebaseService';
import { WeatherCondition } from '../types';
import { getCurrentFormattedDate, getSeasonStageForMonth, getCurrentMonth } from '../utils/seasonUtils';

interface FirebasePushManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  weather: WeatherCondition;
  currentMonth?: number;
}

export const FirebasePushManagerModal: React.FC<FirebasePushManagerModalProps> = ({
  isOpen,
  onClose,
  weather,
  currentMonth = getCurrentMonth(),
}) => {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [tokenTime, setTokenTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'reminders' | 'cron' | 'test' | 'config'>('reminders');

  // Vercel Cron Runner State
  const [isCronRunning, setIsCronRunning] = useState(false);
  const [cronResult, setCronResult] = useState<any | null>(null);
  const [copiedCronCurl, setCopiedCronCurl] = useState(false);
  const [copiedVercelJson, setCopiedVercelJson] = useState(false);

  // iOS detection
  const isIos = isIosDevice();
  const isStandalone = isStandalonePwa();
  const seasonInfo = getSeasonStageForMonth(currentMonth);

  // Config State
  const [config, setConfig] = useState<FirebaseConfig>(getActiveFirebaseConfig());
  const [showConfigSaved, setShowConfigSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    } else {
      setPermission('unsupported');
    }

    const saved = getSavedFcmToken();
    setFcmToken(saved.token);
    setTokenTime(saved.timestamp);
    setConfig(getActiveFirebaseConfig());
  }, [isOpen]);

  const handleEnableReminders = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await registerForPushNotifications();

    setPermission(result.permission);
    setIsLoading(false);

    if (result.success && result.token) {
      setFcmToken(result.token);
      setTokenTime(new Date().toISOString());
      setSuccessMessage('Lawn & plant reminders enabled! FCM token successfully generated.');
      console.log('Firebase Cloud Messaging (FCM) Token:', result.token);
    } else if (result.success && !result.token) {
      setSuccessMessage('Notification permission granted! Check Firebase config / VAPID key below to retrieve full FCM token.');
      if (result.error) {
        setErrorMessage(result.error);
      }
    } else {
      setErrorMessage(result.error || 'Failed to enable notifications.');
    }
  };

  const handleCopyToken = () => {
    if (!fcmToken) return;
    navigator.clipboard.writeText(fcmToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  const handleClearToken = () => {
    clearSavedFcmToken();
    setFcmToken(null);
    setTokenTime(null);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveActiveFirebaseConfig(config);
    setConfig(updated);
    setShowConfigSaved(true);
    setTimeout(() => setShowConfigSaved(false), 3000);
  };

  const [isSendingBackendPush, setIsSendingBackendPush] = useState(false);

  const handleSendBackendPush = async () => {
    if (!fcmToken) {
      setErrorMessage('Please enable push notifications first to obtain a device registration token.');
      return;
    }

    setIsSendingBackendPush(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: fcmToken,
          title: `🌾 GardenCare: Soil Temp Alert (${weather.soilTempF}°F)`,
          body: `Lawn & garden reminder for ${seasonInfo.label}. Check scheduled tasks for Islip Terrace, NY.`,
          url: '/',
          data: {
            soilTemp: String(weather.soilTempF),
            season: seasonInfo.label,
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccessMessage(`✓ Push sent successfully via Firebase Admin SDK! Message ID: ${data.messageId || 'OK'}`);
      } else {
        setSuccessMessage(`Backend response: ${data.message || 'Check Firebase credentials in environment'}`);
      }
    } catch (err: any) {
      console.error('Error triggering backend push:', err);
      setErrorMessage(`Failed to dispatch backend push: ${err?.message || err}`);
    } finally {
      setIsSendingBackendPush(false);
    }
  };

  const sendLocalTestAlert = () => {
    if (Notification.permission !== 'granted') {
      alert('Please enable notification permissions first.');
      return;
    }

    const title = `🌾 GardenCare: Soil Temp Alert (${weather.soilTempF}°F)`;
    const body = `${seasonInfo.label}: Soil is optimal for active landscape tasks. Pruning guard active for spring bloomers.`;

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          body: body,
          icon: '/icons/icon-192.svg',
          badge: '/icons/icon-192.svg',
          data: { url: '/' },
        });
      });
    } else {
      new Notification(title, {
        body: body,
        icon: '/icons/icon-192.svg',
      });
    }

    setSuccessMessage('Local test alert dispatched to your device!');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Sample Curl Payload for modern backend dispatch via Firebase Admin SDK (HTTP v1)
  const sampleCurl = `curl -X POST "${typeof window !== 'undefined' ? window.location.origin : ''}/api/send-push" \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "${fcmToken || 'YOUR_FCM_DEVICE_TOKEN'}",
    "title": "🌾 Lawn & Garden Care Alert",
    "body": "Soil temp is ${weather.soilTempF}°F in ${seasonInfo.label}. Time for scheduled feeding!",
    "url": "/",
    "data": {
      "soilTemp": "${weather.soilTempF}",
      "season": "${seasonInfo.label}"
    }
  }'`;

  const sampleJsonPayload = JSON.stringify(
    {
      message: {
        token: fcmToken || 'PASTE_FCM_TOKEN_HERE',
        notification: {
          title: `🌾 GardenCare: Soil Temp Alert (${weather.soilTempF}°F)`,
          body: `Lawn & garden reminder for ${seasonInfo.label}. Check ready tasks.`,
        },
        webpush: {
          notification: {
            icon: '/icons/icon-192.svg',
            badge: '/icons/icon-192.svg',
          },
        },
      },
    },
    null,
    2
  );

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(sampleCurl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2500);
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(sampleJsonPayload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2500);
  };

  const sampleVercelJson = `{
  "crons": [
    {
      "path": "/api/check-weather",
      "schedule": "0 11 * * *"
    }
  ]
}`;

  const sampleCronCurl = `curl -X POST "${typeof window !== 'undefined' ? window.location.origin : ''}/api/check-weather" \\
  -H "Content-Type: application/json" \\
  -d '{"token": "${fcmToken || 'YOUR_FCM_DEVICE_TOKEN'}"}'`;

  const handleCopyCronCurl = () => {
    navigator.clipboard.writeText(sampleCronCurl);
    setCopiedCronCurl(true);
    setTimeout(() => setCopiedCronCurl(false), 2500);
  };

  const handleCopyVercelJson = () => {
    navigator.clipboard.writeText(sampleVercelJson);
    setCopiedVercelJson(true);
    setTimeout(() => setCopiedVercelJson(false), 2500);
  };

  const handleRunCronCheck = async () => {
    setIsCronRunning(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const response = await fetch('/api/check-weather', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-request': 'true',
        },
        body: JSON.stringify({
          location: weather.locationName || 'Islip Terrace, NY',
          zip: '11752',
          token: fcmToken || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      setCronResult(data);
      setSuccessMessage(
        `✓ /api/check-weather executed successfully! 7-day action forecast & push alert generated for ${data?.sevenDayOutlook?.targetDate || 'upcoming week'}.`
      );

      // If user has notification permission granted in browser, dispatch immediate local preview
      if (Notification.permission === 'granted' && data?.pushNotification?.title) {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(data.pushNotification.title, {
              body: data.pushNotification.body,
              icon: '/icons/icon-192.svg',
              badge: '/icons/icon-192.svg',
              data: { url: '/' },
            });
          });
        } else {
          new Notification(data.pushNotification.title, {
            body: data.pushNotification.body,
            icon: '/icons/icon-192.svg',
          });
        }
      }
    } catch (err: any) {
      console.error('Failed to trigger /api/check-weather:', err);
      setErrorMessage(`Failed to execute /api/check-weather: ${err?.message || err}`);
    } finally {
      setIsCronRunning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-emerald-900 text-white p-4 border-b border-emerald-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-800 border border-emerald-700 flex items-center justify-center text-amber-300">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-natural font-bold text-lg text-white tracking-normal flex items-center space-x-2">
                <span>Lawn & Plant Push Reminders</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-800 text-emerald-100 border border-emerald-700">
                  FCM + Vercel Cron
                </span>
              </h3>
              <p className="text-xs text-emerald-200 font-sans">
                Automated 7 AM weather check, 7-day advance actions & push triggers
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 text-xs font-mono overflow-x-auto">
          <button
            onClick={() => setActiveTab('reminders')}
            className={`py-2.5 px-3 border-b-2 font-medium flex items-center space-x-1.5 transition-colors shrink-0 cursor-pointer ${
              activeTab === 'reminders'
                ? 'border-emerald-700 text-emerald-950 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
            <span>Reminders & Token</span>
          </button>
          <button
            onClick={() => setActiveTab('cron')}
            className={`py-2.5 px-3 border-b-2 font-medium flex items-center space-x-1.5 transition-colors shrink-0 cursor-pointer ${
              activeTab === 'cron'
                ? 'border-emerald-700 text-emerald-950 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Vercel 7 AM Cron (/api/check-weather)</span>
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`py-2.5 px-3 border-b-2 font-medium flex items-center space-x-1.5 transition-colors shrink-0 cursor-pointer ${
              activeTab === 'test'
                ? 'border-emerald-700 text-emerald-950 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-700" />
            <span>Push Tester & Payload</span>
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`py-2.5 px-3 border-b-2 font-medium flex items-center space-x-1.5 transition-colors shrink-0 cursor-pointer ${
              activeTab === 'config'
                ? 'border-emerald-700 text-emerald-950 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-emerald-700" />
            <span>Firebase Config & Keys</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50">
          {/* Messages */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-mono flex items-center space-x-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-700" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-sans flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: REMINDERS & TOKEN */}
          {activeTab === 'reminders' && (
            <div className="space-y-4">
              {/* iOS Requirement Notice Banner if on iOS Safari */}
              {isIos && !isStandalone && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-2">
                  <div className="flex items-center space-x-2 font-bold font-mono text-amber-900">
                    <Smartphone className="w-4 h-4" />
                    <span>iOS (iPhone) Safari Web Push Requirement:</span>
                  </div>
                  <p className="leading-relaxed font-sans">
                    On iOS 16.4+, Apple requires web applications to be added to your <strong>Home Screen</strong> to receive push notifications.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                    <div className="p-2.5 rounded-lg bg-white/90 border border-amber-200 flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-[10px]">1</span>
                      <span>Tap <strong>Share</strong> icon in Safari</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white/90 border border-amber-200 flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-[10px]">2</span>
                      <span>Tap <strong>Add to Home Screen</strong></span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white/90 border border-amber-200 flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-[10px]">3</span>
                      <span>Open <strong>GardenCare</strong> & tap below</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Status & Primary Action Card */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 font-mono">
                      Push Notification Service Status
                    </h4>
                    <p className="text-xs text-slate-600 font-sans">
                      Target: {weather.locationName} • Current Soil: {weather.soilTempF}°F ({seasonInfo.label})
                    </p>
                  </div>

                  {/* Permission Badge */}
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase ${
                        permission === 'granted'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : permission === 'denied'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {permission === 'granted' ? '✓ Permission Granted' : permission === 'denied' ? '✗ Blocked in Settings' : '○ Not Enabled'}
                    </span>
                  </div>
                </div>

                {/* THE DEDICATED BUTTON REQUESTED BY USER */}
                <div className="pt-2">
                  <button
                    id="enable-lawn-plant-reminders-btn"
                    onClick={handleEnableReminders}
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white text-sm font-mono font-bold flex items-center justify-center space-x-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                        <span>Connecting to Firebase Cloud Messaging...</span>
                      </>
                    ) : (
                      <>
                        <Bell className="w-4 h-4 text-amber-300" />
                        <span>Enable Lawn & Plant Reminders</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* FCM REGISTRATION TOKEN DISPLAY */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span className="font-bold text-xs font-mono text-slate-900">
                      FCM Registration Token (iPhone / Device Target)
                    </span>
                  </div>

                  {fcmToken && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleCopyToken}
                        className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white flex items-center space-x-1 transition-colors shadow-2xs cursor-pointer"
                      >
                        {copiedToken ? <Check className="w-3.5 h-3.5 text-amber-300" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedToken ? 'Copied!' : 'Copy Token'}</span>
                      </button>
                      <button
                        onClick={handleClearToken}
                        className="text-[10px] font-mono text-rose-600 hover:underline cursor-pointer"
                        title="Clear stored token"
                      >
                        Reset
                      </button>
                    </div>
                  )}
                </div>

                {fcmToken ? (
                  <div className="space-y-1.5">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-800 break-all select-all max-h-24 overflow-y-auto">
                      {fcmToken}
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-emerald-800">
                      <span>✓ Device registered with Firebase Cloud Messaging</span>
                      {tokenTime && <span>Created: {new Date(tokenTime).toLocaleDateString()} {new Date(tokenTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-slate-50 border border-dashed border-slate-300 text-center text-xs font-mono text-slate-500">
                    No FCM token registered yet. Tap "<strong>Enable Lawn & Plant Reminders</strong>" above to generate your iPhone push token.
                  </div>
                )}
              </div>

              {/* Quick Test Trigger */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200 text-xs font-mono">
                <span className="text-slate-600">Want to preview how the notification appears on your device?</span>
                <button
                  onClick={sendLocalTestAlert}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-slate-800 font-bold flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-amber-600" />
                  <span>Send Test Alert</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: VERCEL 7 AM CRON (/api/check-weather) */}
          {activeTab === 'cron' && (
            <div className="space-y-4">
              {/* Primary Cron Action & Status Card */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <h4 className="font-bold text-sm text-slate-900 font-mono">
                        Vercel Cron Job: /api/check-weather
                      </h4>
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-mono font-bold">
                        0 11 * * * (7:00 AM EDT)
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-sans mt-1">
                      Runs daily at 7:00 AM. Powered by <strong>Gemini 3.7 Flash + Google Search Grounding</strong> to analyze upcoming 7-day weather & soil temps, pinpoint actions starting in 7 days, and dispatch automated push notifications.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleRunCronCheck}
                    disabled={isCronRunning}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white text-sm font-mono font-bold flex items-center justify-center space-x-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                  >
                    {isCronRunning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                        <span>Running Gemini Search Grounding & Weather Check...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Run Daily 7 AM Cron Check Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* CRON EXECUTION RESULT CARD */}
              {cronResult && (
                <div className="p-4 rounded-xl bg-white border border-emerald-300 shadow-sm space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-700" />
                      <span className="font-mono font-bold text-xs text-slate-900">
                        Cron Output • {cronResult.location?.name || 'Long Island, NY'}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {new Date(cronResult.cronExecutionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* 7-Day Forecast & Soil Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="block text-[10px] text-slate-500">7-Day Target Date</span>
                      <span className="font-bold text-xs text-slate-900">{cronResult.sevenDayOutlook?.targetDate || 'In 7 Days'}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="block text-[10px] text-slate-500">Est. Air Temp</span>
                      <span className="font-bold text-xs text-slate-900">{cronResult.sevenDayOutlook?.estimatedAirTempF}°F</span>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                      <span className="block text-[10px] text-emerald-700">Est. Soil Temp</span>
                      <span className="font-bold text-xs text-emerald-950">{cronResult.sevenDayOutlook?.estimatedSoilTempF}°F</span>
                    </div>
                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                      <span className="block text-[10px] text-amber-700">Search Grounded</span>
                      <span className="font-bold text-xs text-amber-950">{cronResult.searchGrounded ? '✓ Google Search' : 'Agronomic Rules'}</span>
                    </div>
                  </div>

                  {/* Push Notification Triggered */}
                  <div className="p-3 rounded-xl bg-emerald-950 text-white space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono text-amber-300 font-bold">
                      <span className="flex items-center space-x-1.5">
                        <BellRing className="w-3.5 h-3.5" />
                        <span>Push Notification Triggered</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-800 text-emerald-200 border border-emerald-700">
                        {cronResult.pushNotification?.sent ? '✓ Sent to Device' : 'Ready / Active'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white pt-1">{cronResult.pushNotification?.title}</p>
                    <p className="text-[11px] text-emerald-200 leading-relaxed font-sans">{cronResult.pushNotification?.body}</p>
                  </div>

                  {/* Actions Starting in 7 Days */}
                  {cronResult.sevenDayOutlook?.actionsStartingIn7Days?.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="block text-xs font-mono font-bold text-slate-900">
                        📅 Landscape & Lawn Actions Starting in 7 Days:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {cronResult.sevenDayOutlook.actionsStartingIn7Days.map((act: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-medium"
                          >
                            • {act}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Product Recommendations & Lowest Prices */}
                  {cronResult.productRecommendations?.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <span className="block text-xs font-mono font-bold text-slate-900">
                        🏷️ Recommended Products & Lowest Retail Prices:
                      </span>
                      <div className="space-y-2">
                        {cronResult.productRecommendations.map((prod: any, idx: number) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-900">{prod.name}</span>
                              <p className="text-[11px] text-slate-600 font-sans">{prod.purpose}</p>
                              <div className="text-[10px] font-mono text-emerald-800 pt-0.5">
                                Lowest Price: <strong>{prod.cheapestPriceFormatted}</strong> at {prod.cheapestStore}
                              </div>
                            </div>
                            {prod.cheapestUrl && (
                              <a
                                href={prod.cheapestUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 rounded bg-emerald-800 hover:bg-emerald-900 text-white font-mono text-[10px] shrink-0 flex items-center space-x-1"
                              >
                                <span>Buy</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Citations / Grounding sources */}
                  {cronResult.groundingSources?.length > 0 && (
                    <div className="pt-1 text-[11px] font-mono text-slate-500">
                      <span>Grounding Sources: </span>
                      {cronResult.groundingSources.slice(0, 3).map((src: any, idx: number) => (
                        <a
                          key={idx}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:underline inline-block mr-2"
                        >
                          [{idx + 1}] {src.title || 'Source'}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Vercel Configuration & cURL Code Snippets */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs font-mono text-slate-900">
                      Vercel Configuration (vercel.json)
                    </h4>
                    <p className="text-[11px] font-sans text-slate-600">
                      Configured at project root to execute /api/check-weather automatically at 7:00 AM EDT:
                    </p>
                  </div>
                  <button
                    onClick={handleCopyVercelJson}
                    className="px-2.5 py-1 text-xs font-mono rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white flex items-center space-x-1 shadow-2xs cursor-pointer"
                  >
                    {copiedVercelJson ? <Check className="w-3.5 h-3.5 text-amber-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedVercelJson ? 'Copied!' : 'Copy JSON'}</span>
                  </button>
                </div>

                <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto border border-slate-800">
                  {sampleVercelJson}
                </pre>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs font-mono text-slate-900">
                      Manual Webhook / cURL Test
                    </h4>
                    <p className="text-[11px] font-sans text-slate-600">
                      Trigger the cron check manually or through external scheduler:
                    </p>
                  </div>
                  <button
                    onClick={handleCopyCronCurl}
                    className="px-2.5 py-1 text-xs font-mono rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white flex items-center space-x-1 shadow-2xs cursor-pointer"
                  >
                    {copiedCronCurl ? <Check className="w-3.5 h-3.5 text-amber-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCronCurl ? 'Copied!' : 'Copy cURL'}</span>
                  </button>
                </div>

                <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto border border-slate-800">
                  {sampleCronCurl}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: PUSH TESTER & PAYLOAD */}
          {activeTab === 'test' && (
            <div className="space-y-4">
              {/* Live Backend Dispatch Action */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs font-mono text-slate-900 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Dispatch Live Push via Firebase Admin SDK (HTTP v1)</span>
                    </h4>
                    <p className="text-[11px] font-sans text-slate-600">
                      Dispatches a real push notification via <code>/api/send-push</code> using Firebase Admin credentials.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendBackendPush}
                  disabled={isSendingBackendPush || !fcmToken}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white text-xs font-mono font-bold flex items-center justify-center space-x-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {isSendingBackendPush ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                      <span>Dispatching FCM HTTP v1 Push...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-amber-300" />
                      <span>Send Live Push to This Device Token</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs font-mono text-slate-900">
                      Send Automated Web Push via cURL / Backend
                    </h4>
                    <p className="text-[11px] font-sans text-slate-600">
                      Use this command in your terminal, server cron job, or GitHub Action to trigger a push to your iPhone:
                    </p>
                  </div>
                  <button
                    onClick={handleCopyCurl}
                    className="px-2.5 py-1 text-xs font-mono rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white flex items-center space-x-1 shadow-2xs cursor-pointer"
                  >
                    {copiedCurl ? <Check className="w-3.5 h-3.5 text-amber-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCurl ? 'Copied!' : 'Copy cURL'}</span>
                  </button>
                </div>

                <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto border border-slate-800">
                  {sampleCurl}
                </pre>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs font-mono text-slate-900">
                      Firebase Console / FCM HTTP v1 JSON Payload
                    </h4>
                    <p className="text-[11px] font-sans text-slate-600">
                      Target payload for Firebase Console -&gt; Cloud Messaging:
                    </p>
                  </div>
                  <button
                    onClick={handleCopyPayload}
                    className="px-2.5 py-1 text-xs font-mono rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white flex items-center space-x-1 shadow-2xs cursor-pointer"
                  >
                    {copiedPayload ? <Check className="w-3.5 h-3.5 text-amber-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPayload ? 'Copied!' : 'Copy JSON'}</span>
                  </button>
                </div>

                <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto border border-slate-800">
                  {sampleJsonPayload}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: FIREBASE CONFIG & KEYS */}
          {activeTab === 'config' && (
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs font-mono text-slate-900">
                      Firebase Project Credentials & VAPID Key
                    </h4>
                    <p className="text-[11px] font-sans text-slate-600">
                      These are loaded automatically from environment variables (e.g. on Vercel/Netlify) or can be saved below.
                    </p>
                  </div>
                  {showConfigSaved && (
                    <span className="text-[11px] font-mono text-emerald-700 font-bold animate-fade-in">
                      ✓ Saved to LocalStorage!
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <label className="block text-slate-700 mb-1">API Key (VITE_FIREBASE_API_KEY)</label>
                    <input
                      type="text"
                      value={config.apiKey}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      placeholder="AIzaSy..."
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-mono focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1">Project ID (VITE_FIREBASE_PROJECT_ID)</label>
                    <input
                      type="text"
                      value={config.projectId}
                      onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
                      placeholder="gardencare-app"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-mono focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1">Messaging Sender ID</label>
                    <input
                      type="text"
                      value={config.messagingSenderId}
                      onChange={(e) => setConfig({ ...config, messagingSenderId: e.target.value })}
                      placeholder="123456789012"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-mono focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1">App ID (VITE_FIREBASE_APP_ID)</label>
                    <input
                      type="text"
                      value={config.appId}
                      onChange={(e) => setConfig({ ...config, appId: e.target.value })}
                      placeholder="1:123456789012:web:..."
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-mono focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 mb-1">
                      Web Push Certificate Public Key (VAPID Key)
                    </label>
                    <input
                      type="text"
                      value={config.vapidKey || ''}
                      onChange={(e) => setConfig({ ...config, vapidKey: e.target.value })}
                      placeholder="BEl62iUYg..."
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-mono focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Found in Firebase Console &gt; Project Settings &gt; Cloud Messaging &gt; Web Push Certificates.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-mono text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                  >
                    Save Custom Config
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs font-mono text-slate-600">
          <div className="flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-emerald-700" />
            <span>iOS 16.4+ Web Push + Service Worker (firebase-messaging-sw.js)</span>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-xl font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
