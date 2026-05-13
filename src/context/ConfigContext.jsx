import React, { createContext, useState, useEffect, useContext } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  const defaultConfig = {
    heThong: "new",
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
    hideMenu: false,
  };

  // ======================
  // 1. INIT STATE
  // ======================
  const [config, setConfigState] = useState(() => {
    try {
      const saved = localStorage.getItem("studentInfo");
      if (saved) {
        const parsed = JSON.parse(saved);

        console.log("🔥 INIT from localStorage:", parsed);

        return { ...defaultConfig, ...parsed };
      }
    } catch (err) {
      console.error("❌ Lỗi parse localStorage:", err);
    }
    return defaultConfig;
  });

  // ======================
  // 2. FIRESTORE SYNC
  // ======================
  useEffect(() => {
    const docRef = doc(db, "CONFIG", "config");

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) return;

        const data = snapshot.data();

        const keysToSync = [
          "choXemDapAn",
          "choXemDiem",
          "timeLimit",
          "locked",
          "heThong",
        ];

        const filteredData = Object.fromEntries(
          Object.entries(data).filter(([k]) => keysToSync.includes(k))
        );

        setConfigState((prev) => {
          const hasDiff = Object.keys(filteredData).some(
            (key) => prev[key] !== filteredData[key]
          );

          if (!hasDiff) return prev;

          const updated = { ...prev, ...filteredData };

          console.log("🔥 FIRESTORE SYNC UPDATE:", filteredData);
          console.log("🔥 CONFIG AFTER SYNC:", updated);

          return updated;
        });
      },
      (err) => console.error("❌ Firestore snapshot lỗi:", err)
    );

    return () => unsubscribe();
  }, []);

  // ======================
  // 3. UPDATE CONFIG
  // ======================
  const updateConfig = async (newValues, saveToFirestore = false) => {
    const allowedKeys = Object.keys(defaultConfig);

    const filtered = Object.fromEntries(
      Object.entries(newValues).filter(([k]) => allowedKeys.includes(k))
    );

    console.log("🔥 setConfig INPUT:", newValues);
    console.log("🔥 setConfig FILTERED:", filtered);

    const hasDiff = Object.keys(filtered).some(
      (k) => filtered[k] !== config[k]
    );

    if (!hasDiff) {
      console.log("⚠️ No config change detected");
      return;
    }

    setConfigState((prev) => {
      const updated = { ...prev, ...filtered };

      // ======================
      // SAVE STUDENT INFO ONLY
      // ======================
      const studentKeys = [
        "studentId",
        "fullname",
        "khoi",
        "lop",
        "heThong",
      ];

      const studentData = Object.fromEntries(
        Object.entries(updated).filter(([k]) => studentKeys.includes(k))
      );

      console.log("🔥 SAVE TO LOCALSTORAGE:", studentData);

      localStorage.setItem(
        "studentInfo",
        JSON.stringify(studentData)
      );

      return updated;
    });

    // ======================
    // FIRESTORE SAVE (OPTIONAL)
    // ======================
    if (saveToFirestore) {
      const keysForFirestore = [
        "choXemDapAn",
        "choXemDiem",
        "timeLimit",
        "locked",
        "heThong",
      ];

      const firestoreData = Object.fromEntries(
        Object.entries(filtered).filter(([k]) =>
          keysForFirestore.includes(k)
        )
      );

      if (Object.keys(firestoreData).length > 0) {
        try {
          await setDoc(
            doc(db, "CONFIG", "config"),
            firestoreData,
            { merge: true }
          );

          console.log("✅ FIRESTORE UPDATED:", firestoreData);
        } catch (err) {
          console.error("❌ Firestore update error:", err);
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