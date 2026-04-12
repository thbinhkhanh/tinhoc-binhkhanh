export function shuffleArray(array) {
  if (!Array.isArray(array)) return [];   // ✅ tránh lỗi khi array không phải mảng
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}