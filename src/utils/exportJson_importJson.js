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

        option: q.option || "",
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
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);

        if (!Array.isArray(jsonData)) {
          throw new Error("INVALID_FORMAT");
        }

        // =========================
        // detect NEW format
        // =========================
        const isNewFormat = (q) => {
          return (
            Array.isArray(q?.options) &&
            q.options.length > 0 &&
            typeof q.options[0] === "object"
          );
        };

        // =========================
        // convert option NEW → OLD
        // giữ HTML + URL + text
        // =========================
        const toOldOption = (opt) => {
          if (!opt) return "";

          if (typeof opt === "string") return opt;

          const text = opt.text ?? "";
          const image = opt.image ?? "";

          if (typeof text === "string" && text.includes("<")) return text;
          if (typeof text === "string" && text.startsWith("http")) return text;
          if (image) return image;

          return text || "";
        };

        // =========================
        // MAP QUESTIONS
        // =========================
        const questions = jsonData.map((q, index) => {
          const base = {
            id: q.id || `q_${Date.now()}_${index}`,
            question: q.question || "",
            questionImage: q.questionImage || "",
            type: q.type || "single",
            score: q.score ?? 0.5,
            option: q.option || "",
          };

          // =========================
          // OLD → OLD (GIỮ NGUYÊN 100%)
          // =========================
          if (!isNewFormat(q)) {
            return {
              ...base,
              options: q.options || [],
              correct: q.correct || [],
              pairs: q.pairs || [],
              columnRatio: q.columnRatio || { left: 1, right: 1 },
              sortType: q.sortType || "fixed",
              answers: q.answers || [],
            };
          }

          // =========================
          // NEW → OLD
          // =========================
          const options = (q.options || []).map(toOldOption);

          switch (q.type) {
            // ================= SINGLE =================
            case "single":
            case "multiple":
              return {
                ...base,
                options: options.map((t) =>
                  typeof t === "string" && t.startsWith("http")
                    ? { text: "", image: t }
                    : { text: t, image: "" }
                ),
                correct: Array.isArray(q.correct)
                  ? q.correct.map(Number).filter((n) => !isNaN(n))
                  : [],
                sortType: q.sortType || "shuffle",
              };

            // ================= SORT =================
            case "sort":
              return {
                ...base,
                options: options.map((t) =>
                  typeof t === "string" && t.startsWith("http")
                    ? { text: "", image: t }
                    : { text: t, image: "" }
                ),
                correct:
                  Array.isArray(q.correct) && q.correct.length
                    ? q.correct
                    : options.map((_, i) => i),
                sortType: q.sortType || "shuffle",
              };

            // ================= TRUEFALSE =================
            case "truefalse":
              return {
                ...base,
                options: options.map((t) =>
                  typeof t === "string" && t.startsWith("http")
                    ? { text: "", image: t }
                    : { text: t, image: "" }
                ),
                correct: Array.isArray(q.correct)
                  ? q.correct
                  : ["Đ", "S", "Đ", "S"],
                sortType: q.sortType || "shuffle",
              };

            // ================= IMAGE =================
            case "image":
              return {
                ...base,

                // 🔥 QUAN TRỌNG: giữ đúng format CŨ (string array có thể là URL)
                options: Array.isArray(q.options)
                  ? q.options.map((o) => {
                      if (typeof o === "string") return o;

                      const text = o?.text ?? "";
                      const image = o?.image ?? "";

                      // 🔥 ưu tiên image trước (QUAN TRỌNG)
                      if (image) return image;

                      // nếu text là URL ảnh
                      if (typeof text === "string" && text.startsWith("http")) {
                        return text;
                      }

                      return text || "";
                    })
                  : [],

                correct: Array.isArray(q.correct)
                  ? q.correct.map(Number).filter((n) => !isNaN(n))
                  : [],
              };

            // ================= FILLBLANK =================
            case "fillblank":
              return {
                ...base,

                // giữ nguyên format cũ
                option: q.option || "",

                // convert options: giữ đúng text/image như dữ liệu cũ yêu cầu
                options: (q.options || []).map((o) => {
                  if (typeof o === "string") return o;

                  // ưu tiên text (giống hàm cũ handleImportQuiz)
                  if (o?.text) return o.text;

                  // fallback image nếu không có text
                  if (o?.image) return o.image;

                  return "";
                }),

                // QUAN TRỌNG: giữ answers nguyên như cũ
                answers: Array.isArray(q.answers) ? q.answers : [],

                // fillblank luôn không dùng correct
                correct: [],
              };

            // ================= MATCHING =================
            case "matching":
              return {
                ...base,
                pairs: (q.pairs || []).map((p) => ({
                  left: p.left || "",
                  right: p.right || "",
                  leftImage: p.leftImage?.url
                    ? {
                        url: p.leftImage.url,
                        name: p.leftImage.name || "",
                      }
                    : p.leftImage || "",
                  rightImage: p.rightImage?.url
                    ? {
                        url: p.rightImage.url,
                        name: p.rightImage.name || "",
                      }
                    : p.rightImage || "",
                })),
                columnRatio: q.columnRatio || {
                  left: 1,
                  right: 3,
                },
              };

            // ================= DEFAULT =================
            default:
              return {
                ...base,
                options: options.map((t) =>
                  typeof t === "string" && t.startsWith("http")
                    ? { text: "", image: t }
                    : { text: t, image: "" }
                ),
                correct: q.correct || [],
              };
          }
        });

        // =========================
        // FIX CRITICAL: ALWAYS RETURN ARRAY
        // =========================
        resolve({
          success: true,
          data: questions, // <-- QUAN TRỌNG NHẤT
        });
      } catch (err) {
        resolve({
          success: false,
          error: "❌ JSON lỗi hoặc sai cấu trúc",
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
  });
};
