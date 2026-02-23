const normalizeValue = (val) => {
  if (typeof val === "object") {
    if (val.image) return String(val.image).trim().toLowerCase();
    if (val.text) return val.text.trim().toLowerCase();
  }
  if (typeof val === "string") {
    return val.trim().toLowerCase();
  }
  return String(val).trim().toLowerCase();
};

export function getQuestionStatus({ question, userAnswer, submitted = false }) {
  const isUnanswered = () => {
    if (userAnswer === undefined || userAnswer === null) return true;

    switch (question.type) {
      case "single":
        return userAnswer === "";

      case "multiple":
      case "image":
        return !Array.isArray(userAnswer) || userAnswer.length === 0;

      case "fillblank":
        return (
          !Array.isArray(userAnswer) ||
          userAnswer.every((v) => !v || v.trim() === "")
        );

      case "sort": {
        if (!Array.isArray(userAnswer) || userAnswer.length === 0) return true;

        // mặc định nếu chưa kéo thì thứ tự = [0,1,2,3...]
        const defaultOrder = question.options.map((_, i) => i);

        return userAnswer.every((val, i) => val === defaultOrder[i]);
      }

      case "matching":
        return !Array.isArray(userAnswer) || userAnswer.length === 0;

      case "truefalse": {
        const defaultOrder = question.options.map((_, i) => i);
        return (
          Array.isArray(userAnswer) &&
          userAnswer.every((val, i) => val === defaultOrder[i])
        );
      }

      default:
        return false;
    }
  };

  if (!submitted && isUnanswered()) return "unanswered";
  if (!submitted) return "answered";

  let isCorrect = false;

  switch (question.type) {
    case "single": {
      const ua = Number(userAnswer);
      isCorrect = Array.isArray(question.correct)
        ? question.correct.includes(ua)
        : question.correct === ua;
      break;
    }

    case "multiple":
    case "image": {
      const userSet = new Set(Array.isArray(userAnswer) ? userAnswer : []);
      const correctSet = new Set(
        Array.isArray(question.correct) ? question.correct : [question.correct]
      );
      isCorrect =
        userSet.size === correctSet.size &&
        [...correctSet].every((x) => userSet.has(x));
      break;
    }

    case "truefalse": {
      const ua = Array.isArray(userAnswer) ? userAnswer : [];
      const ca = Array.isArray(question.correct) ? question.correct : [];
      isCorrect =
        ua.length === ca.length &&
        ua.every((val, i) => {
          const originalIdx = question.initialOrder?.[i] ?? i;
          return normalizeValue(val) === normalizeValue(ca[originalIdx]);
        });
      break;
    }

    case "fillblank": {
      const ua = Array.isArray(userAnswer) ? userAnswer : [];
      const ca = Array.isArray(question.options) ? question.options : [];
      isCorrect =
        ua.length === ca.length &&
        ca.every(
          (correct, i) =>
            ua[i] &&
            normalizeValue(ua[i]) ===
              normalizeValue(typeof correct === "object" ? correct.text : correct)
        );
      break;
    }

    case "sort": {
      const ua = Array.isArray(userAnswer) ? userAnswer : [];
      const userTexts = ua.map((idx) => question.options[idx]);
      const correctTexts = Array.isArray(question.correctTexts)
        ? question.correctTexts
        : [];
      isCorrect =
        userTexts.length === correctTexts.length &&
        userTexts.every(
          (val, i) => normalizeValue(val) === normalizeValue(correctTexts[i])
        );
      break;
    }

    case "matching": {
      const ua = Array.isArray(userAnswer) ? userAnswer : [];
      const ca = Array.isArray(question.correct) ? question.correct : [];
      isCorrect =
        ua.length > 0 &&
        ua.length === ca.length &&
        ua.every((val, i) => normalizeValue(val) === normalizeValue(ca[i]));
      break;
    }
  }

  return isCorrect ? "correct" : "wrong";
}