import { doc, setDoc, getDoc } from "firebase/firestore";

const normalizeValue = (val) => {
  if (typeof val === "object") {
    if (val.image) return String(val.image).trim();
    if (val.text) return val.text.trim();
  }
  if (typeof val === "string") {
    return val.trim();
  }
  return String(val).trim();
};

export const handleSubmitQuiz = async ({
  studentName,
  studentClass,
  tenBaiRutGon,
  setStudentResult,
  setSnackbar,
  setSaving,
  setSubmitted,
  setOpenAlertDialog,
  setUnansweredQuestions,
  setOpenResultDialog,
  questions,
  answers,
  startTime,
  db,
  getQuestionMax,
  capitalizeName,
  formatTime,
  isTestMode = false, // ✅ Thêm flag
}) => {
  try {
    if (!studentClass || !studentName) {
      setSnackbar({
        open: true,
        message: "Thiếu thông tin học sinh",
        severity: "info",
      });
      return;
    }

    // --- Kiểm tra câu chưa trả lời ---
    const unanswered = questions.filter((q) => {
      const userAnswer = answers[q.id];
      if (q.type === "single") {
        return userAnswer === undefined || userAnswer === null || userAnswer === "";
      }
      if (q.type === "multiple" || q.type === "image") {
        return !Array.isArray(userAnswer) || userAnswer.length === 0;
      }
      if (q.type === "truefalse") {
        return !Array.isArray(userAnswer) || userAnswer.length !== q.options.length;
      }
      return false;
    });

    if (unanswered.length > 0) {
      setUnansweredQuestions(
        unanswered.map((q) => questions.findIndex((item) => item.id === q.id) + 1)
      );
      setOpenAlertDialog(true);
      return;
    }

    // --- Tính điểm ---
    setSaving(true);
    let total = 0;

    questions.forEach((q) => {
      const rawAnswer = answers[q.id];

      if (q.type === "single") {
        const ua = Number(rawAnswer);
        if (Array.isArray(q.correct) ? q.correct.includes(ua) : q.correct === ua)
          total += q.score ?? 1;

      } else if (q.type === "multiple" || q.type === "image") {
        const userSet = new Set(Array.isArray(rawAnswer) ? rawAnswer : []);
        const correctSet = new Set(Array.isArray(q.correct) ? q.correct : [q.correct]);
        if (
          userSet.size === correctSet.size &&
          [...correctSet].every((x) => userSet.has(x))
        )
          total += q.score ?? 1;

      } else if (q.type === "sort") {
        const userOrder = Array.isArray(rawAnswer) ? rawAnswer : [];
        const correctTexts = Array.isArray(q.correctTexts) ? q.correctTexts : [];

        // Lấy ra mảng option theo thứ tự học sinh sắp xếp
        const userTexts = userOrder.map((idx) => q.options[idx]);

        const isCorrect =
          userTexts.length === correctTexts.length &&
          userTexts.every((val, i) => normalizeValue(val) === normalizeValue(correctTexts[i]));

        if (isCorrect) total += q.score ?? 1;
      } else if (q.type === "matching") {
  const userArray = Array.isArray(rawAnswer) ? rawAnswer : [];
  const correctArray = Array.isArray(q.correct) ? q.correct : [];

  const normalizedUser = correctArray.map((_, i) =>
    userArray[i] !== undefined ? userArray[i] : null
  );

  const isCorrect =
    normalizedUser.length === correctArray.length &&
    normalizedUser.every((val, i) => val === correctArray[i]);

  if (isCorrect) total += q.score ?? 1;
} else if (q.type === "truefalse") {
        const userArray = Array.isArray(rawAnswer) ? rawAnswer : [];
        const correctArray = Array.isArray(q.correct) ? q.correct : [];

        if (userArray.length === correctArray.length) {
          const isAllCorrect = userArray.every((val, i) => {
            const originalIdx = Array.isArray(q.initialOrder)
              ? q.initialOrder[i]
              : i;

            const normalizedVal =
              val === "Đúng" ? "Đ" :
              val === "Sai" ? "S" :
              val;

            return normalizedVal === correctArray[originalIdx];
          });

          if (isAllCorrect) total += q.score ?? 1;
        }
      } else if (q.type === "fillblank") {
        const userAnswers = Array.isArray(rawAnswer) ? rawAnswer : [];
        const correctAnswers = Array.isArray(q.options) ? q.options : [];
        if (userAnswers.length === correctAnswers.length) {
          const isAllCorrect = correctAnswers.every(
            (correct, i) =>
              userAnswers[i] && userAnswers[i].trim() === correct.trim()
          );
          if (isAllCorrect) total += q.score ?? 1;
        }
      }
    });

    setSubmitted(true);

    // --- Tính thời gian ---
    const durationSec = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    const durationStr = formatTime(durationSec);
    const ngayKiemTra = new Date().toLocaleDateString("vi-VN");
    const maxScore = questions.reduce((sum, q) => sum + getQuestionMax(q), 0);
    const phanTram = Math.round((total / maxScore) * 100);

    // --- Chuẩn hóa tên học sinh ---
    const normalizeName = (name) =>
      name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");

    // --- Hiển thị kết quả ---
    setStudentResult({
      hoVaTen: capitalizeName(studentName),
      lop: studentClass, 
      bai: tenBaiRutGon,
      diem: total,
      diemTN: phanTram,
    });
    setOpenResultDialog(true);

    // --- FIRESTORE (chỉ lưu nếu không phải test mode) ---
    if (!isTestMode) {
  try {
    const classKey = studentClass.replace(".", "_");
    const studentDocId = normalizeName(studentName);

    // ref học sinh
    const hsRef = doc(db, "DATA", classKey, "HOCSINH", studentDocId);

    // đảm bảo học sinh tồn tại
    await setDoc(
      hsRef,
      {
        hoVaTen: capitalizeName(studentName),
        lop: studentClass,
        mon: "Tin học"
      },
      { merge: true }
    );

    // ---- BÀI THI ----
    if (!tenBaiRutGon) {
      console.error("❌ Thiếu tên bài rút gọn");
      return;
    }

    const baiDocId = tenBaiRutGon
      .replace(/\s+/g, "_")
      .replace(/\./g, "");

    const baiRef = doc(
      db,
      "DATA",
      classKey,
      "HOCSINH",
      studentDocId,
      "BAITHI",
      baiDocId
    );

    const diemQuyDoi = Math.round(phanTram / 10);

    const baiSnap = await getDoc(baiRef);

    if (baiSnap.exists()) {
      // 🔁 ĐÃ CÓ BÀI → UPDATE
      const data = baiSnap.data();
      const currentSoLan = data.soLan ?? 0;
      const currentDiem = data.diem ?? 0;

      const updates = {
        soLan: currentSoLan + 1
      };

      if (diemQuyDoi > currentDiem) {
        updates.diem = diemQuyDoi;
        updates.diemTN = phanTram;
        updates.ngayKiemTra = ngayKiemTra;
        updates.thoiGianLamBai = durationStr;
      }

      await setDoc(baiRef, updates, { merge: true });
      console.log("✅ Cập nhật bài:", tenBaiRutGon);

    } else {
      // 🆕 CHƯA CÓ BÀI → TẠO MỚI
      await setDoc(baiRef, {
        bai: tenBaiRutGon,
        diem: diemQuyDoi,
        diemTN: phanTram,
        ngayKiemTra,
        thoiGianLamBai: durationStr,
        soLan: 1
      });

      console.log("✅ Lưu bài mới:", tenBaiRutGon);
    }

  } catch (err) {
    console.error("❌ Lỗi lưu bài thi:", err);
  }
} else {
  console.log("ℹ️ Test mode: không lưu Firestore");
}




  } catch (err) {
    console.error("❌ Lỗi khi lưu điểm:", err);
  } finally {
    setSaving(false);
  }
};
