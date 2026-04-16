// src/utils/cleanAnswersField.js

import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

export const cleanAnswersFieldInAllQuizzes = async (db) => {
  try {
    const collections = ["TRACNGHIEM3", "TRACNGHIEM4", "TRACNGHIEM5"];

    for (const colName of collections) {
      const snapshot = await getDocs(collection(db, colName));

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        if (!data.questions) continue;

        const hasAnswers = data.questions.some((q) => "answers" in q);
        if (!hasAnswers) continue; // ✅ tránh update thừa

        const cleanedQuestions = data.questions.map((q) => {
          const { answers, ...rest } = q;
          return rest;
        });

        await updateDoc(doc(db, colName, docSnap.id), {
          questions: cleanedQuestions,
        });

        console.log(`✅ Cleaned: ${colName}/${docSnap.id}`);
      }
    }

    console.log("🎉 DONE: Đã xoá toàn bộ answers");
  } catch (err) {
    console.error("❌ Lỗi khi clean answers:", err);
  }
};