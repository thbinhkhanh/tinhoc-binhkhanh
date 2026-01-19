// firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase configuration (project mới)
const firebaseConfig = {
  apiKey: "AIzaSyCIfoXnjMEZz5uIv88ArfPJrm-RHQD6QIU",
  authDomain: "tinhoc-bk.firebaseapp.com",
  projectId: "tinhoc-bk",
  storageBucket: "tinhoc-bk.firebasestorage.app",
  messagingSenderId: "98385305618",
  appId: "1:98385305618:web:bd184c48b5101e057ff8cb",
};

// 🔒 Chỉ khởi tạo 1 lần (tránh lỗi React StrictMode)
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

// Firestore
const db = getFirestore(app);

export { db };
