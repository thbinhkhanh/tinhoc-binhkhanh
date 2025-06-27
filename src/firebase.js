import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCos379He3soZHU77F4g-yMSsFo3Dq50gw",
  authDomain: "ban-tru-data.firebaseapp.com",
  projectId: "ban-tru-data",
  storageBucket: "ban-tru-data.appspot.com",
  messagingSenderId: "213526359119",
  appId: "1:213526359119:web:d2001afd9b7051dcd40e3a"
};

// Chỉ khởi tạo Firebase 1 lần
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Lấy Firestore instance
const db = getFirestore(app);

export { db };
