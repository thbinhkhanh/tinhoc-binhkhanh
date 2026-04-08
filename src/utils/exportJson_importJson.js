export const exportQuestionsToJSON = ({
  questions,
  fileName = "de_trac_nghiem",
}) => {
  try {
    const exportData = questions.map((q, index) => {
      // 🔥 FIX MATCHING (giữ đầy đủ ảnh + text)
      let pairs = [];
      if (q.type === "matching") {
        pairs = (q.pairs || []).map((p) => ({
          left: p.left || "",
          right: p.right || "",
          leftImage: p.leftImage || "",
          rightImage: p.rightImage || "",
        }));
      }

      return {
        id: q.id || `q_${index + 1}`,
        question: q.question || "",
        questionImage: q.questionImage || "",

        type: q.type || "single",

        // 🔥 giữ nguyên options (có thể chứa image URL)
        options: Array.isArray(q.options) ? [...q.options] : [],

        correct: Array.isArray(q.correct) ? [...q.correct] : [],

        score: q.score ?? 0.5,

        sortType: q.sortType || "fixed",

        // 🔥 FIX ở đây
        pairs,

        columnRatio: q.columnRatio || { left: 1, right: 1 },

        answers: Array.isArray(q.answers) ? [...q.answers] : [],
      };
    });

    // 👉 stringify đẹp
    const jsonString = JSON.stringify(exportData, null, 2);

    // 👉 tạo file
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;

    // 🔥 đảm bảo có .json
    const finalName = fileName.endsWith(".json")
      ? fileName
      : `${fileName}.json`;

    a.download = finalName;
    a.click();

    URL.revokeObjectURL(url);

    return { success: true };
  } catch (err) {
    console.error("❌ Export JSON error:", err);
    return { success: false, error: err.message };
  }
};

export const importQuestionsFromJSON = (file) => {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target.result);
          if (!Array.isArray(jsonData)) throw new Error("JSON không đúng format");

          const questions = jsonData.map((q, index) => {
            const base = {
              id: q.id || `q_${Date.now()}_${index}`,
              question: q.question || "",
              questionImage: q.questionImage || "",
              type: q.type || "single",
              options: q.options || [],
              correct: q.correct || [],
              score: q.score ?? 0.5,
            };

            switch (q.type) {
              case "image":
                // Convert tất cả các object option sang URL string
                const optionsArray = base.options.map((opt) => {
                  if (typeof opt === "string") return opt; // App 1 đã đúng format
                  // Nếu là object App 2, lấy URL từ text hoặc image
                  return opt.image || opt.text || "";
                });
                return {
                  ...base,
                  options: optionsArray,
                  correct: Array.isArray(base.correct) ? base.correct : [],
                };

              case "truefalse":
                return {
                  ...base,
                  options: base.options.length ? base.options : ["Đúng", "Sai"],
                  correct: base.correct.length ? base.correct : ["Đúng"],
                };

              case "matching":
                return {
                  ...base,
                  pairs: q.pairs || [],
                  columnRatio: q.columnRatio || { left: 1, right: 1 },
                };

              case "sort":
                return {
                  ...base,
                  options: base.options.length ? base.options : ["", "", "", ""],
                  correct: base.correct.length ? base.correct : base.options.map((_, i) => i),
                  sortType: q.sortType || "fixed",
                };

              case "fillblank":
                return {
                  ...base,
                  options: base.options || [],
                  answers: q.answers || [],
                };

              case "multiple":
              case "single":
              default:
                return {
                  ...base,
                  options: base.options.length ? base.options : ["", "", "", ""],
                  correct: base.correct || [],
                };
            }
          });

          resolve({ success: true, data: questions });
        } catch (parseErr) {
          resolve({
            success: false,
            error: "❌ File JSON không hợp lệ hoặc sai cấu trúc",
          });
        }
      };

      reader.onerror = () => {
        resolve({
          success: false,
          error: "❌ Không thể đọc file",
        });
      };

      reader.readAsText(file);
    } catch (err) {
      resolve({ success: false, error: err.message });
    }
  });
};
export const importQuestionsFromJSON_1 = (file) => {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target.result);

          if (!Array.isArray(jsonData)) {
            throw new Error("JSON không đúng format");
          }

          const questions = jsonData.map((q, index) => {
            const base = {
              id: q.id || `q_${Date.now()}_${index}`,
              question: q.question || "",
              questionImage: q.questionImage || "",
              type: q.type || "single",
              options: q.options || [],
              correct: q.correct || [],
              score: q.score ?? 0.5,
            };

            switch (q.type) {
              case "image":
                return {
                  ...base,
                  options: Array.from({ length: 4 }, (_, i) => q.options?.[i] || ""),
                  correct: Array.isArray(q.correct) ? q.correct : [],
                };

              case "truefalse":
                return {
                  ...base,
                  options: q.options?.length ? q.options : ["Đúng", "Sai"],
                  correct: q.correct?.length ? q.correct : ["Đúng"],
                };

              case "matching":
                return {
                  ...base,
                  pairs: q.pairs || [],
                  columnRatio: q.columnRatio || { left: 1, right: 1 },
                };

              case "sort":
                return {
                  ...base,
                  options: q.options || ["", "", "", ""],
                  correct: q.correct || q.options?.map((_, i) => i) || [],
                  sortType: q.sortType || "fixed",
                };

              case "fillblank":
                return {
                  ...base,
                  options: q.options || [],
                  answers: q.answers || [],
                };

              case "multiple":
              case "single":
              default:
                return {
                  ...base,
                  options: q.options || ["", "", "", ""],
                  correct: q.correct || [],
                };
            }
          });

          resolve({ success: true, data: questions });
        } catch (parseErr) {
          resolve({
            success: false,
            error: "❌ File JSON không hợp lệ hoặc sai cấu trúc",
          });
        }
      };

      reader.onerror = () => {
        resolve({
          success: false,
          error: "❌ Không thể đọc file",
        });
      };

      reader.readAsText(file);
    } catch (err) {
      resolve({ success: false, error: err.message });
    }
  });
};