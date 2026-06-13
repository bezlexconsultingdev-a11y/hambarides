import { api } from './client';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export function isAdminWebPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function enableAdminWebPush() {
  if (!isAdminWebPushSupported()) {
    throw new Error('This browser does not support web push notifications.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not allowed.');
  }

  const registration = await navigator.serviceWorker.ready;
  const { data } = await api.get('/admin/web-push/public-key');
  const publicKey = String(data?.publicKey || '');
  if (!publicKey) {
    throw new Error('Admin push is not configured on Render yet.');
  }

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  await api.post('/admin/web-push/subscribe', {
    subscription: subscription.toJSON(),
  });

  return subscription;
}

export async function getAdminWebPushStatus() {
  if (!isAdminWebPushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) return 'enabled';
  return Notification.permission === 'granted' ? 'ready' : 'default';
}
