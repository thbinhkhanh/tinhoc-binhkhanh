import { doc, setDoc } from "firebase/firestore";

export const saveAllQuestions = async ({
  questions,
  db,
  selectedClass,
  lesson,
  setSnackbar,
}) => {
  try {
    if (!selectedClass || !lesson) {
      throw new Error("Vui lòng chọn Lớp và Bài học");
    }

    const uploadImage = async (file) => {
      if (!(file instanceof File)) return file; // nếu đã là URL thì không upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "tracnghiem_upload");

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload",
        { method: "POST", body: formData }
      );
      if (!response.ok) throw new Error("Upload hình thất bại");
      const data = await response.json();
      return data.secure_url;
    };

    const questionsToSave = [];

    for (let q of questions) {
      let updatedQ = { ...q };

      // Upload images cho các thuộc tính chung
      if (q.images) {
        const uploadedImages = await Promise.all(
          q.images.map(async (img) => await uploadImage(img))
        );
        updatedQ.images = uploadedImages;
      }

      // Nếu là type "matching", upload leftImage và leftIconImage
      if (q.type === "matching" && Array.isArray(q.pairs)) {
        updatedQ.pairs = await Promise.all(
          q.pairs.map(async (pair) => {
            const newPair = { ...pair };

            // leftImage
            if (pair.leftImage?.url) {
              const uploadedUrl = await uploadImage(pair.leftImage.url);
              newPair.leftImage = { ...pair.leftImage, url: uploadedUrl };
            }

            // leftIconImage
            if (pair.leftIconImage?.url) {
              const uploadedUrl = await uploadImage(pair.leftIconImage.url);
              newPair.leftIconImage = { ...pair.leftIconImage, url: uploadedUrl };
            }

            return newPair;
          })
        );

        // Chuẩn hóa correct
        updatedQ.correct = q.pairs.map((_, i) => i);
      }

      // Nếu type "image", upload options
      if (q.type === "image") {
        const uploadedOptions = await Promise.all(
          (q.options || []).map(async (opt) => await uploadImage(opt))
        );
        updatedQ.options = uploadedOptions;
        updatedQ.correct = updatedQ.correct || [];
      }

      // Chuẩn hóa correct cho các loại khác
      if (q.type === "sort") updatedQ.correct = q.options.map((_, i) => i);
      if (q.type === "single") updatedQ.correct = q.correct?.length ? q.correct : [0];
      if (q.type === "multiple") updatedQ.correct = q.correct || [];
      if (q.type === "truefalse")
        updatedQ.correct =
          q.correct?.length === q.options?.length
            ? q.correct
            : q.options.map(() => "");

      questionsToSave.push(updatedQ);
    }

    const classNumber = selectedClass.replace(/\D/g, "");
    const collectionName = `TRACNGHIEM${classNumber}`;

    const quizRef = doc(db, collectionName, lesson);
    await setDoc(quizRef, {
      class: selectedClass,
      lesson,
      questions: questionsToSave,
      updatedAt: Date.now(),
    });

    localStorage.setItem("teacherQuiz", JSON.stringify(questionsToSave));
    localStorage.setItem(
      "teacherConfig",
      JSON.stringify({ selectedClass, lesson })
    );

    setSnackbar({
      open: true,
      message: "✅ Đã lưu bài học thành công!",
      severity: "success",
    });
  } catch (err) {
    console.error(err);
    setSnackbar({
      open: true,
      message: `❌ Lỗi khi lưu: ${err.message}`,
      severity: "error",
    });
  }
};

