// src/firebase.js
import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBXbIsr85sVlTIk2IQa_Aet5MP2V4tC5jA",
  authDomain: "notification-system-5e217.firebaseapp.com",
  projectId: "notification-system-5e217",
  storageBucket: "notification-system-5e217.firebasestorage.app",
  messagingSenderId: "348477901004",
  appId: "1:348477901004:web:b405f3cf367806e5c79a69",
};

const app = initializeApp(firebaseConfig);

export const getFirebaseMessaging = async () => {
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(app);
};