importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBXbIsr85sVlTIk2IQa_Aet5MP2V4tC5jA",
  authDomain: "notification-system-5e217.firebaseapp.com",
  projectId: "notification-system-5e217",
  storageBucket: "notification-system-5e217.firebasestorage.app",
  messagingSenderId: "348477901004",
  appId: "1:348477901004:web:b405f3cf367806e5c79a69",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, { body, icon: '/favicon.ico' });
});