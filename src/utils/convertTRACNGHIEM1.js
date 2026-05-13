import { collection, getDocs, doc, setDoc } from "firebase/firestore";

export const convertTRACNGHIEM = async (db, setSnackbar) => {
  try {
    const colRef = collection(db, "TRACNGHIEM3");
    const snap = await getDocs(colRef);

    const convertQuestion = (q) => {
      const updatedQ = {
        ...q,
        columnRatio: q.columnRatio || { left: 1, right: 1 },
        answers: q.answers || [],
        pairs: q.pairs || [],
      };

      // chuẩn hóa options
      updatedQ.options = (q.options || []).map((opt) => {
        if (typeof opt === "string") {
          return { text: opt, image: "", formats: {} };
        }

        return {
          text: opt.text || "",
          image: opt.image || "",
          formats: opt.formats || {},
        };
      });

      // correct theo type
      switch (q.type) {
        case "matching":
          updatedQ.correct = q.pairs?.map((_, i) => i) || [];
          break;

        case "sort":
          updatedQ.correct = updatedQ.options.map((_, i) => i);
          break;

        case "single":
          updatedQ.correct = q.correct?.length ? q.correct : [0];
          break;

        case "multiple":
          updatedQ.correct = q.correct || [];
          break;

        case "truefalse":
          updatedQ.correct =
            q.correct?.length === updatedQ.options.length
              ? q.correct
              : updatedQ.options.map(() => "");
          break;

        case "image":
          updatedQ.correct = q.correct || [];
          break;

        default:
          updatedQ.correct = q.correct || [];
      }

      return updatedQ;
    };

    let count = 0;

    for (const docSnap of snap.docs) {
      const data = docSnap.data();

      const newQuestions = (data.questions || []).map(convertQuestion);

      await setDoc(doc(db, "TRACNGHIEM3", docSnap.id), {
        ...data,
        questions: newQuestions,
        updatedAt: Date.now(),
      });

      count++;
    }

    if (setSnackbar) {
      setSnackbar({
        open: true,
        message: `✅ Convert xong ${count} đề TRACNGHIEM4`,
        severity: "success",
      });
    }

    console.log("✅ Convert TRACNGHIEM4 done:", count);
  } catch (err) {
    console.error("❌ Convert lỗi:", err);

    if (setSnackbar) {
      setSnackbar({
        open: true,
        message: "❌ Convert thất bại",
        severity: "error",
      });
    }
  }
};