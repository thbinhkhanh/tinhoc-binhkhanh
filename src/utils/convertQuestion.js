import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { convertQuestion } from "./convertQuestion";

export const migrateTRACNGHIEM = async (db) => {
  try {
    const colRef = collection(db, "TRACNGHIEM3");
    const snap = await getDocs(colRef);

    const allDocs = [];

    snap.forEach((d) => {
      allDocs.push({
        id: d.id,
        data: d.data(),
      });
    });

    for (const item of allDocs) {
      const questions = item.data.questions || [];

      const newQuestions = [];

      for (const q of questions) {
        newQuestions.push(await convertQuestion(q));
      }

      await setDoc(doc(db, "TRACNGHIEM3", item.id), {
        ...item.data,
        questions: newQuestions,
        updatedAt: Date.now(),
      });
    }

    console.log("✅ MIGRATE TRACNGHIEM5 DONE");
  } catch (err) {
    console.error("❌ MIGRATE ERROR:", err);
  }
};