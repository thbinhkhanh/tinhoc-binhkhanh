import React, { createContext, useState, useEffect, useContext } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  const defaultConfig = {
    heThong: "old",
    choXemDapAn: true,
    choXemDiem: true,
    timeLimit: 10,
    locked: false,
    fullname: "",
    khoi: "",
    lop: "",
    studentId: "",
    hocKi: 1,
    login: false,
    namHoc: "2025-2026",
  };

  // 1️⃣ Khởi tạo state
  const [config, setConfigState] = useState(() => {
    // Thử load từ localStorage trước
    const saved = localStorage.getItem("studentInfo");
    if (saved) {
      return { ...defaultConfig, ...JSON.parse(saved) };
    }
    return defaultConfig;
  });

  // 2️⃣ Lắng nghe Firestore (chỉ các cài đặt chung)
  useEffect(() => {
    const docRef = doc(db, "CONFIG", "config");
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data();

        const keysToSync = ["choXemDapAn", "choXemDiem", "timeLimit", "locked"];
        const filteredData = Object.fromEntries(
          Object.entries(data).filter(([k]) => keysToSync.includes(k))
        );

        setConfigState(prev => {
          const hasDiff = Object.keys(filteredData).some(
            key => prev[key] !== filteredData[key]
          );
          return hasDiff ? { ...prev, ...filteredData } : prev;
        });
      },
      (err) => console.error("❌ Firestore snapshot lỗi:", err)
    );

    return () => unsubscribe();
  }, []);

  // 3️⃣ Hàm cập nhật config
  const updateConfig = async (newValues, saveToFirestore = false) => {
    const allowedKeys = Object.keys(defaultConfig);
    const filtered = Object.fromEntries(
      Object.entries(newValues).filter(([k]) => allowedKeys.includes(k))
    );

    const hasDiff = Object.keys(filtered).some(k => filtered[k] !== config[k]);
    if (!hasDiff) return;

    // 3a️⃣ Cập nhật context
    setConfigState(prev => {
      const updated = { ...prev, ...filtered };

      // Lưu thông tin cá nhân vào localStorage
      const personalKeys = ["studentId", "fullname", "khoi", "lop"];
      const personalData = Object.fromEntries(
        Object.entries(updated).filter(([k]) => personalKeys.includes(k))
      );
      localStorage.setItem("studentInfo", JSON.stringify(personalData));

      return updated;
    });

    // 3b️⃣ Lưu Firestore chỉ các key cài đặt chung
    if (saveToFirestore) {
      const keysForFirestore = ["choXemDapAn", "choXemDiem", "timeLimit", "locked"];
      const firestoreData = Object.fromEntries(
        Object.entries(filtered).filter(([k]) => keysForFirestore.includes(k))
      );

      if (Object.keys(firestoreData).length > 0) {
        try {
          const docRef = doc(db, "CONFIG", "config");
          await setDoc(docRef, firestoreData, { merge: true });
          console.log("✅ Firestore cập nhật:", firestoreData);
        } catch (err) {
          console.error("❌ Lỗi cập nhật Firestore:", err);
        }
      }
    }
  };

  return (
    <ConfigContext.Provider value={{ config, setConfig: updateConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

// Hook tiện lợi
export const useConfig = () => useContext(ConfigContext);
