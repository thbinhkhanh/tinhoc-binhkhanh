import { shuffleArray } from "./shuffleArray";

export function shuffleAvoidSamePosition(items) {
  if (!Array.isArray(items) || items.length <= 1) return items;

  const original = items.map((_, i) => i);

  let result = [];
  let attempts = 0;
  const maxAttempts = 20;

  do {
    result = shuffleArray(items);
    attempts++;

    const hasSamePosition = result.some((item, i) => {
      if (!item) return true;
      return item._originalIndex !== undefined
        ? item._originalIndex === i
        : false;
    });

    if (!hasSamePosition) break;
  } while (attempts < maxAttempts);

  return result;
}