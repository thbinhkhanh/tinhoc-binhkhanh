import { createContext, useContext, useState } from "react";

const QuizContext = createContext(null);

export const QuizProvider = ({ children }) => {
  // cache NHIỀU đề: { [CACHE_KEY]: { questions, class, updatedAt } }
  const [quizCache, setQuizCache] = useState({});

  return (
    <QuizContext.Provider value={{ quizCache, setQuizCache }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuizContext = () => {
  const ctx = useContext(QuizContext);
  if (!ctx) {
    throw new Error("useQuizContext must be used inside QuizProvider");
  }
  return ctx;
};
