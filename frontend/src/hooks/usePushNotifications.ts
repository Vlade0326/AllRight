import { useEffect } from 'react';
import { apiFetch } from '../api/client';

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    (async () => {
      try {
        const { publicKey } = await apiFetch<{ publicKey: string | null }>(
          '/notifications/vapid-public-key',
        );
        if (!publicKey) return;

        const reg = await navigator.serviceWorker.register('/sw.js');
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        await apiFetch('/notifications/subscribe', {
          method: 'POST',
          body: JSON.stringify(subscription.toJSON()),
        });
      } catch {
        // Push is optional
      }
    })();
  }, []);
}
