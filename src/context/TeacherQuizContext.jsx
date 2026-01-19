// TeacherQuizContext.jsx
import { createContext, useContext, useState } from "react";

const TeacherQuizContext = createContext(null);

export const TeacherQuizProvider = ({ children }) => {
  const [quizCache, setQuizCache] = useState({}); // ✅ object nhiều đề

  return (
    <TeacherQuizContext.Provider value={{ quizCache, setQuizCache }}>
      {children}
    </TeacherQuizContext.Provider>
  );
};

export const useTeacherQuizContext = () => {
  const ctx = useContext(TeacherQuizContext);
  if (!ctx) {
    throw new Error("useTeacherQuizContext must be used inside TeacherQuizProvider");
  }
  return ctx;
};
