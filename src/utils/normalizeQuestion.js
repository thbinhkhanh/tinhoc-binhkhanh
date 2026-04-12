// helpers/normalizeQuestion.js
import { shuffleArray } from "./shuffleArray";
import { shuffleAvoidSamePosition } from "./shuffleAvoidSamePosition";

export function normalizeQuestion(q, index) {
  const questionId = q.id ?? `q_${index}`;
  const questionText = typeof q.question === "string" ? q.question.trim() : "";
  const rawType = (q.type || "").toString().trim().toLowerCase();
  const type = ["sort", "matching", "single", "multiple", "image", "truefalse", "fillblank"].includes(rawType)
    ? rawType
    : null;
  if (!type) return null;

  // MATCHING
  if (type === "matching") {
    const pairs = Array.isArray(q.pairs) ? q.pairs : [];
    if (pairs.length === 0) return null;

    const leftOptions = pairs.map((p, idx) => {
      if (p.leftImage?.url) return { type: "image", url: p.leftImage.url, name: p.leftImage.name || `img-${idx}` };
      if (p.leftIconImage?.url) return { type: "icon", url: p.leftIconImage.url, name: p.leftIconImage.name || `icon-${idx}`, text: p.left ?? "" };
      if (typeof p.left === "string" && /^https?:\/\//i.test(p.left.trim())) return { type: "image", url: p.left.trim(), name: `img-${idx}` };
      if (typeof p.left === "string") return { type: "text", text: p.left };
      return { type: "text", text: "" };
    });

    const rightOptionsOriginal = pairs.map((p, idx) => ({ opt: p.right, idx }));
    const processedRightOptions = q.sortType === "shuffle" ? shuffleAvoidSamePosition(rightOptionsOriginal) : rightOptionsOriginal;

    const map = {};
    processedRightOptions.forEach((item, newIndex) => { map[item.idx] = newIndex; });
    const newCorrect = leftOptions.map((_, i) => map[i]);

    return { ...q, id: questionId, type, question: questionText, image: q.image ?? null, leftOptions, rightOptions: processedRightOptions.map(i => i.opt), correct: newCorrect, score: q.score ?? 1 };
  }

  // SORT
  if (type === "sort") {
    const options = Array.isArray(q.options) && q.options.length > 0 ? [...q.options] : ["", "", "", ""];
    const indexed = options.map((opt, idx) => ({ opt, idx }));
    const processed = q.sortType === "shuffle" ? shuffleAvoidSamePosition(indexed) : indexed;

    return { ...q, id: questionId, type, question: questionText, image: q.image ?? null, options: processed.map(i => i.opt), initialSortOrder: processed.map(i => i.idx), correctTexts: options, score: q.score ?? 1 };
  }

  // SINGLE / MULTIPLE
  if (type === "single" || type === "multiple") {
    const options = Array.isArray(q.options) && q.options.length > 0
      ? q.options.map(opt => {
          if (typeof opt === "string") {
            if (/^https?:\/\/.*\.(png|jpg|jpeg|gif)$/i.test(opt)) return { text: "", image: opt };
            return { text: opt, image: null };
          } else if (typeof opt === "object") {
            return { text: opt.text ?? "", image: opt.image ?? null };
          }
          return { text: "", image: null };
        })
      : [{ text: "", image: null }, { text: "", image: null }, { text: "", image: null }, { text: "", image: null }];

    const indexed = options.map((opt, idx) => ({ opt, idx }));
    const shuffled = (q.sortType === "shuffle" || q.shuffleOptions === true) ? shuffleArray(indexed) : indexed;

    return { ...q, id: questionId, type, question: questionText, image: q.image ?? null, options, displayOrder: shuffled.map(i => i.idx), correct: Array.isArray(q.correct) ? q.correct.map(Number) : typeof q.correct === "number" ? [q.correct] : [], score: q.score ?? 1 };
  }

  // IMAGE
  if (type === "image") {
    const options = Array.isArray(q.options) && q.options.length > 0 ? q.options : ["", "", "", ""];
    const correct = Array.isArray(q.correct) ? q.correct : [];
    return { ...q, id: questionId, type, question: questionText, image: q.image ?? null, options, displayOrder: shuffleArray(options.map((_, idx) => idx)), correct, score: q.score ?? 1 };
  }

  // TRUEFALSE
  if (type === "truefalse") {
    const options = Array.isArray(q.options) && q.options.length >= 2 ? [...q.options] : ["Đúng", "Sai"];
    const indexed = options.map((opt, idx) => ({ opt, idx }));
    const processed = q.sortType === "shuffle" ? shuffleArray(indexed) : indexed;

    return { ...q, id: questionId, type, question: questionText, image: q.image ?? null, options: processed.map(i => i.opt), initialOrder: processed.map(i => i.idx), correct: Array.isArray(q.correct) && q.correct.length === options.length ? q.correct : options.map(() => ""), score: q.score ?? 1 };
  }

  // FILLBLANK
  if (type === "fillblank") {
    const options = Array.isArray(q.options) ? q.options : [];
    return { ...q, id: questionId, type, question: questionText, image: q.image ?? null, option: q.option, options, shuffledOptions: shuffleArray([...options]), score: q.score ?? 1 };
  }

  return null;
}

// 🔥 Hàm mới: chuẩn hóa toàn bộ danh sách và shuffle thứ tự câu hỏi
export function normalizeQuestions(rawQuestions) {
  if (!Array.isArray(rawQuestions)) return [];

  // Shuffle toàn bộ danh sách câu hỏi
  const shuffled = shuffleArray(rawQuestions);

  // Chuẩn hóa từng câu hỏi
  return shuffled
    .map((q, idx) => normalizeQuestion(q, idx))
    .filter(Boolean);
}
