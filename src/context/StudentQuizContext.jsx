import { createContext, useContext, useState } from "react";

const StudentQuizContext = createContext(null);

export const StudentQuizProvider = ({ children }) => {
  // ✅ Map nhiều đề: { [CACHE_KEY]: cachePayload }
  const [quizCache, setQuizCache] = useState({});

  return (
    <StudentQuizContext.Provider value={{ quizCache, setQuizCache }}>
      {children}
    </StudentQuizContext.Provider>
  );
};

export const useStudentQuizContext = () => {
  const ctx = useContext(StudentQuizContext);
  if (!ctx) {
    throw new Error(
      "useStudentQuizContext must be used inside StudentQuizProvider"
    );
  }
  return ctx;
};
