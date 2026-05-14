import { doc, setDoc } from "firebase/firestore";

export const saveAllQuestions = async ({
  questions,
  db,
  selectedClass,
  lesson,
  setSnackbar,
  collectionName,
}) => {
  try {
    if (!selectedClass || !lesson) {
      throw new Error("Vui lòng chọn Lớp và Bài học");
    }
    if (!collectionName) {
      throw new Error("Thiếu collectionName (lỗi năm học)");
    }

    // =========================
    // UPLOAD IMAGE (GIỮ NGUYÊN)
    // =========================
    const uploadImage = async (file) => {
      if (!(file instanceof File)) return file;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "tracnghiem_upload");
      formData.append("folder", "questions"); // optional nhưng nên giữ

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dxzpfljv4/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const err = await response.text();
        throw new Error("Upload hình thất bại: " + err);
      }

      const data = await response.json();
      return data.secure_url;
    };

    const isHttp = (v) =>
      typeof v === "string" && v.startsWith("http");

    const toFileFromBase64 = async (dataUrl, name = "image.png") => {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      return new File([blob], name, { type: blob.type });
    };

    // =========================
    // NORMALIZE IMAGE
    // =========================
    const normalizeImage = async (img) => {
      if (!img) return "";

      if (img instanceof File) return await uploadImage(img);

      if (isHttp(img)) return img;

      if (typeof img === "string" && img.startsWith("data:")) {
        const file = await toFileFromBase64(img);
        return await uploadImage(file);
      }

      return img;
    };

    // =========================
    // NORMALIZE OPTIONS
    // =========================
    const normalizeOptions = async (options = []) => {
      return Promise.all(
        options.map(async (opt) => {
          if (!opt) {
            return {
              text: "",
              image: "",
              formats: {},
            };
          }

          // legacy string
          if (typeof opt === "string") {
            return {
              text: opt,
              image: "",
              formats: {},
            };
          }

          let image = opt.image || opt.imagePreview || "";
          let text = opt.text || "";

          // =========================
          // IMAGE QUESTION (ImageOptions.jsx)
          // file -> upload -> lưu vào text
          // =========================
          if (opt.file instanceof File) {
            const uploadedUrl = await uploadImage(opt.file);

            return {
              text: uploadedUrl, // ✅ image question lưu url vào text
              image: "",
              formats: opt.formats || {},
            };
          }

          // =========================
          // OLD imageFile support
          // =========================
          if (opt.imageFile instanceof File) {
            image = await uploadImage(opt.imageFile);
          }

          // =========================
          // base64 image
          // =========================
          if (
            typeof image === "string" &&
            image.startsWith("data:")
          ) {
            image = await uploadImage(
              await toFileFromBase64(image)
            );
          }

          // =========================
          // giữ nguyên các loại câu hỏi khác
          // =========================
          return {
            text,
            image,
            formats: opt.formats || {},
          };
        })
      );
    };

    // =========================
    // NORMALIZE MATCHING
    // =========================
    const normalizeMatching = async (pairs = []) => {
      return Promise.all(
        pairs.map(async (p) => {
          let leftImg =
            p?.leftImage?.file ||
            p?.leftImage?.url ||
            p?.leftImage ||
            "";

          const url = await normalizeImage(leftImg);

          return {
            left: p.left || "",
            right: p.right || "",
            leftImage: {
              url,
              name: p.leftImage?.name || "",
            },
          };
        })
      );
    };

    // =========================
    // TO FIRESTORE SCHEMA (NEW)
    // =========================
    const toNormalizedSchema = (q) => ({
      id: q.id || `q_${Date.now()}`,
      type: q.type,
      question: q.question || "",
      image: q.image || q.questionImage || null,
      options: q.options || [],
      pairs: q.pairs || [],
      correct: q.correct || [],
      score: q.score || 1,
    });

    const questionsToSave = [];

    // =========================
    // MAIN LOOP
    // =========================
    for (let q of questions) {
      let updatedQ = {
        ...q,
        ...(q.type === "matching" && !("columnRatio" in q)
          ? { columnRatio: { left: 1, right: 1 } }
          : {}),
      };

      // IMAGE QUESTION
      const questionImage = await normalizeImage(
        q.questionImage?.file ||
        q.questionImage?.url ||
        q.questionImage ||
        ""
      );

      updatedQ.questionImage = questionImage;

      if (q.type === "image") {
        updatedQ.image = questionImage;
      }

      // OPTIONS
      if (Array.isArray(q.options)) {
        updatedQ.options = await normalizeOptions(q.options);
      }

      // MATCHING
      // =========================
      if (q.type === "matching") {
        updatedQ.pairs = await Promise.all(
          (q.pairs || []).map(async (p) => {
            let leftImg =
              p?.leftImage?.file ||
              p?.leftImage?.url ||
              "";

            // upload File
            if (leftImg instanceof File) {
              leftImg = await uploadImage(leftImg);
            }

            // base64
            if (typeof leftImg === "string" && leftImg.startsWith("data:")) {
              const res = await fetch(leftImg);
              const blob = await res.blob();
              leftImg = await uploadImage(
                new File([blob], "left.png", { type: blob.type })
              );
            }

            return {
              left: p.left || "",

              // giữ HTML như App2
              right: p.right || "",

              leftImage: leftImg
                ? {
                    url: leftImg,
                    name: p.leftImage?.name || "image.png",
                  }
                : {
                    url: "",
                    name: "",
                  },
            };
          })
        );

        // mapping đúng App2
        updatedQ.correct = updatedQ.pairs.map((_, i) => i);

        // ⚡ QUAN TRỌNG: App2 có options
        updatedQ.options = [];

        // giữ field chuẩn App2
        updatedQ.type = "matching";
        updatedQ.columnRatio = q.columnRatio || { left: 1, right: 3 };

        updatedQ.sortType = q.sortType || "fixed";

        // giữ id nếu có (App2 có id)
        if (q.id) updatedQ.id = q.id;

        // xoá rác
        //delete updatedQ.questionType;
        //delete updatedQ.leftOptions;
        //delete updatedQ.rightOptions;
      }

      // SORT
      if (q.type === "sort") {

        // chuẩn hoá options
        updatedQ.options = (updatedQ.options || []).map((opt) => ({
          text: (opt.text || "")
            // ❌ bỏ số thứ tự cuối câu
            .replace(/\s*\d+\s*<\/p>$/i, "</p>")
            .trim(),

          image: opt.image || "",
        }));

        // đáp án đúng luôn là thứ tự chuẩn
        updatedQ.correct = updatedQ.options.map((_, i) => i);

        // ❌ xoá field rác
        delete updatedQ.correctTexts;
        delete updatedQ.initialSortOrder;
      }

      // SINGLE
      if (q.type === "single") {
        updatedQ.correct = q.correct?.length ? q.correct : [0];
      }

      // MULTIPLE
      if (q.type === "multiple") {
        updatedQ.correct = q.correct || [];
      }

      // TRUEFALSE
      if (q.type === "truefalse") {
        updatedQ.correct =
          q.correct?.length === q.options?.length
            ? q.correct
            : (q.options || []).map(() => "");
      }

      if (q.type === "fillblank") {
        updatedQ = {
          ...q,

          id: q.id || `q_${Date.now()}`,
          type: "fillblank",

          // 🔥 GIỮ NGUYÊN HTML QUILL
          option: q.option || "",

          question: q.question || "",

          image: q.questionImage || null,

          // 🔥 schema mới
          answers: [
            {
              option: q.option || "",
              correct: q.correct || [],
            },
          ],

          options: Array.isArray(q.options)
            ? q.options.map((opt) => ({
                text: opt.text || "",
                image: opt.image || "",
                formats: opt.formats || {},
              }))
            : [],

          correct: q.correct || [],

          score: q.score || 1,
        };
      }

      // =========================
      // FINAL NORMALIZE BEFORE SAVE
      // =========================
      questionsToSave.push(updatedQ);
    }

    // =========================
    // SAVE FIRESTORE
    // =========================
    const quizRef = doc(db, collectionName, lesson);

    await setDoc(quizRef, {
      class: selectedClass,
      lesson,
      schemaVersion: 2, // 🔥 QUAN TRỌNG
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
      message: "✅ Lưu đề thành công",
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