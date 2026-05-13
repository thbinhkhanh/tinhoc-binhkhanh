// helpers/normalizeQuestion.js

/* =========================
   🔥 NORMALIZE OPTION CHUNG
========================= */
const normalizeOption = (opt) => {
  if (typeof opt === "string") {
    return {
      text: opt.startsWith("http") ? "" : opt,
      image: opt.startsWith("http") ? opt : "",
    };
  }

  if (opt && typeof opt === "object") {
    return {
      text: opt.text || "",
      image: opt.image || "",
    };
  }

  return { text: "", image: "" };
};

/* =========================
   MAIN NORMALIZER
========================= */
export function normalizeQuestion(q, index) {
  const questionId = q.id ?? `q_${index}`;
  const questionText =
    typeof q.question === "string"
      ? q.question.trim()
      : "";

  const rawType = (q.type || "")
    .toString()
    .trim()
    .toLowerCase();

  const type = [
    "sort",
    "matching",
    "single",
    "multiple",
    "image",
    "truefalse",
    "fillblank",
  ].includes(rawType)
    ? rawType
    : null;

  if (!type) return null;

  const base = {
    ...q,
    id: questionId,
    type,
    question: questionText,
    image: q.image ?? null,
    score: q.score ?? 1,
  };

  /* =========================
     MATCHING
  ========================= */
  if (type === "matching") {
    const pairs = Array.isArray(q.pairs) ? q.pairs : [];

    if (pairs.length === 0) return null;

    const leftOptions = pairs.map((p, idx) => {
      if (p.leftImage?.url) {
        return {
          type: "image",
          url: p.leftImage.url,
          name: p.leftImage.name || `img-${idx}`,
        };
      }

      if (p.leftIconImage?.url) {
        return {
          type: "icon",
          url: p.leftIconImage.url,
          name: p.leftIconImage.name || `icon-${idx}`,
          text: p.left ?? "",
        };
      }

      if (typeof p.left === "string") {
        return {
          type: "text",
          text: p.left,
        };
      }

      return {
        type: "text",
        text: "",
      };
    });

    const rightOptions = pairs.map((p) =>
      normalizeOption(p.right)
    );

    return {
      ...base,
      leftOptions,
      rightOptions,

      // giữ nguyên correct cũ nếu có
      correct: Array.isArray(q.correct)
        ? q.correct
        : [],
    };
  }

  /* =========================
     SORT
  ========================= */
  if (type === "sort") {
    const options = (q.options || []).map(normalizeOption);

    return {
      ...base,
      options,

      // thứ tự gốc
      initialSortOrder: options.map((_, idx) => idx),

      correctTexts: options.map((o) => o.text),
    };
  }

  /* =========================
     SINGLE / MULTIPLE
  ========================= */
  if (type === "single" || type === "multiple") {
    const options = (q.options || []).map(normalizeOption);

    return {
      ...base,
      options,

      // giữ nguyên thứ tự
      displayOrder: options.map((_, idx) => idx),

      correct: Array.isArray(q.correct)
        ? q.correct.map(Number)
        : typeof q.correct === "number"
        ? [q.correct]
        : [],
    };
  }

  /* =========================
     IMAGE
  ========================= */
  if (type === "image") {
    const rawOptions =
      Array.isArray(q.options) && q.options.length > 0
        ? q.options
        : ["", "", "", ""];

    const options = rawOptions.map((opt) => {
      if (typeof opt === "string") {
        return {
          text: opt,
          image: "",
          formats: {},
        };
      }

      if (opt && typeof opt === "object") {
        return {
          text: opt.text || opt.image || "",
          image: opt.image || "",
          formats: opt.formats || {},
        };
      }

      return {
        text: "",
        image: "",
        formats: {},
      };
    });

    return {
      ...base,
      options,

      // giữ nguyên
      displayOrder: options.map((_, idx) => idx),

      correct: Array.isArray(q.correct)
        ? q.correct
        : [],
    };
  }

  /* =========================
     TRUEFALSE
  ========================= */
  if (type === "truefalse") {
    const options = (q.options || []).map(normalizeOption);

    return {
      ...base,
      options,

      // giữ nguyên
      initialOrder: options.map((_, idx) => idx),

      correct:
        Array.isArray(q.correct) &&
        q.correct.length === options.length
          ? q.correct
          : options.map(() => ""),
    };
  }

  /* =========================
     FILLBLANK
  ========================= */
  if (type === "fillblank") {
    const options = (q.options || []).map(normalizeOption);

    return {
      ...base,
      option: q.option,
      options,

      // KHÔNG shuffle
      shuffledOptions: options,
    };
  }

  return null;
}

/* =========================
   NORMALIZE ALL QUESTIONS
========================= */
export function normalizeQuestions(rawQuestions) {
  if (!Array.isArray(rawQuestions)) return [];

  return rawQuestions
    .map((q, idx) => normalizeQuestion(q, idx))
    .filter(Boolean);
}