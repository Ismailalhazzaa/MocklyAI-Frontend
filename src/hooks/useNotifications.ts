// src/hooks/useNotifications.ts
import { useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging } from '@/firebase';
import axiosInstance from '@/api/axiosInstance';
import { useToast } from '@/hooks/use-toast';

const VAPID_KEY = 'BLDNSagDGjADwGp2JLdC3Cr2-t7y2C6x3lYXlFAI1j2UbLtuE65pWFCI79Nhx37bpgmsx6f3JchtIK5ONbbSeF0';

export function useNotifications() {
  const { toast } = useToast();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) return;

    const initNotifications = async () => {
      try {
        // 1. طلب الإذن أولاً
        const permission = await Notification.requestPermission();
        console.log('🔔 Notification permission:', permission);
        if (permission !== 'granted') return;

        // 2. التحقق من دعم المتصفح
        const messagingInstance = await getFirebaseMessaging();
        if (!messagingInstance) {
          console.warn('Firebase Messaging غير مدعوم في هذا المتصفح');
          return;
        }

        // 3. الحصول على التوكن
        const token = await getToken(messagingInstance, { vapidKey: VAPID_KEY });
        console.log('🔑 FCM Token:', token);
        if (!token) return;

        // 4. إرسال التوكن للـ Backend
        await axiosInstance.post('/users/save-fcm-token', { fcmToken: token });
        console.log('✅ FCM Token saved to backend');

        // 5. استقبال الإشعارات وهو التطبيق مفتوح
        onMessage(messagingInstance, (payload) => {
          console.log('📩 Notification received:', payload);
          toast({
            title: payload.notification?.title ?? 'إشعار جديد',
            description: payload.notification?.body ?? '',
          });
        });

      } catch (err) {
        console.error('❌ Notification init error:', err);
      }
    };

    initNotifications();
  }, []);
}