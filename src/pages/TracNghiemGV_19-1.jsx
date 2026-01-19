import * as XLSX from "xlsx";
import React, { useState, useEffect, useRef } from "react";

import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  Select,
  MenuItem,
  IconButton,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Card,
  Tooltip,
} from "@mui/material";

import { db } from "../firebase";
import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  collection,
  writeBatch,
} from "firebase/firestore";

import SaveIcon from "@mui/icons-material/Save";
import FileUploadIcon from "@mui/icons-material/FileUpload";

import QuestionCard from "../Types/questions/QuestionCard";
import { saveAllQuestions } from "../utils/saveAllQuestions";

export default function TracNghiemGV() {
  const fileInputRef = useRef(null);

  const savedConfig = JSON.parse(localStorage.getItem("teacherConfig") || "{}");
  const [selectedClass, setSelectedClass] = useState(savedConfig.selectedClass || "");
  const [semester, setSemester] = useState(savedConfig.semester || "");
  const [lesson, setLesson] = useState(savedConfig.lesson || "");
  const [lessonsFromFirestore, setLessonsFromFirestore] = useState([]);

  const classes = ["Lớp 1", "Lớp 2", "Lớp 3", "Lớp 4", "Lớp 5"];

  const [questions, setQuestions] = useState([]);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // ===== HELPERS =====
  const createEmptyQuestion = () => ({
    id: `q_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    title: "",
    question: "",
    option: "",
    type: "single",
    options: ["", "", "", ""],
    score: 0.5,
    correct: [],
    sortType: "fixed",
    pairs: [],
    answers: [],
    questionImage: "",
  });

  // ===== INIT QUESTIONS =====
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("teacherQuiz") || "[]");
    if (Array.isArray(saved) && saved.length > 0) {
      setQuestions(saved);
    } else {
      setQuestions([createEmptyQuestion()]);
    }
  }, []);

  // ===== SAVE CONFIG LOCAL =====
  useEffect(() => {
    localStorage.setItem(
      "teacherConfig",
      JSON.stringify({ selectedClass, semester, lesson })
    );
  }, [selectedClass, semester, lesson]);

  // ===== FIRESTORE COLLECTION =====
  const getTracNghiemCollection = (lop) => {
    const num = lop.match(/\d+/)?.[0];
    return num ? `TRACNGHIEM${num}` : null;
  };

  // ===== FETCH EXAM =====
  const fetchExam = async ({ selectedClass, lessonFullName }) => {
    if (!selectedClass || !lessonFullName) return;

    try {
      const num = selectedClass.replace("Lớp ", "");
      const collectionName = `TRACNGHIEM${num}`;
      const docRef = doc(db, collectionName, lessonFullName);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        setQuestions(
          Array.isArray(data.questions)
            ? data.questions
            : [createEmptyQuestion()]
        );
        localStorage.setItem(
          "teacherQuiz",
          JSON.stringify(data.questions || [])
        );
      } else {
        setQuestions([createEmptyQuestion()]);
        localStorage.removeItem("teacherQuiz");
      }

      // lưu config mở gần nhất
      await setDoc(
        doc(db, "CONFIG", "config"),
        { selectedClass, lesson: lessonFullName },
        { merge: true }
      );
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "❌ Không tải được đề",
        severity: "error",
      });
    }
  };

  // ===== FETCH LESSONS =====
  const fetchLessonsFromFirestore = async (lop) => {
    if (!lop) return [];
    try {
      const lopNumber = lop.replace("Lớp ", "");
      const collectionName = `TENBAI_Lop${lopNumber}`;
      const snapshot = await getDocs(collection(db, collectionName));

      const lessons = snapshot.docs
        .sort((a, b) => (a.data().stt || 0) - (b.data().stt || 0))
        .map((d) => d.data().tenBai);

      setLessonsFromFirestore(lessons);
      return lessons;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  // ===== LOAD LAST OPENED EXAM =====
  useEffect(() => {
    const loadLastOpenedExam = async () => {
      try {
        const snap = await getDoc(doc(db, "CONFIG", "config"));
        if (!snap.exists()) return;

        const { selectedClass, lesson } = snap.data();
        if (!selectedClass || !lesson) return;

        setSelectedClass(selectedClass);
        const lessons = await fetchLessonsFromFirestore(selectedClass);

        if (lessons.includes(lesson)) {
          setLesson(lesson);
          fetchExam({ selectedClass, lessonFullName: lesson });
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadLastOpenedExam();
  }, []);

  // ===== WHEN CLASS CHANGES: ONLY LOAD LESSON LIST =====
  useEffect(() => {
    const loadLessonsOnly = async () => {
      if (!selectedClass) {
        setLessonsFromFirestore([]);
        setLesson("");
        setQuestions([createEmptyQuestion()]);
        localStorage.removeItem("teacherQuiz");
        return;
      }

      await fetchLessonsFromFirestore(selectedClass);
    };

    loadLessonsOnly();
  }, [selectedClass]);

  // ===== UI ACTIONS =====
  const addQuestion = () =>
    setQuestions((prev) => [...prev, createEmptyQuestion()]);

  const updateQuestionAt = (index, patch) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const handleDeleteQuestion = async (index) => {
    if (!window.confirm(`Xóa câu hỏi ${index + 1}?`)) return;

    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);

    try {
      const collectionName = getTracNghiemCollection(selectedClass);
      if (!collectionName) return;

      await updateDoc(doc(db, collectionName, lesson), {
        questions: updatedQuestions,
      });

      localStorage.setItem("teacherQuiz", JSON.stringify(updatedQuestions));
      setSnackbar({ open: true, message: "✅ Xóa câu hỏi thành công", severity: "success" });
    } catch (err) {
      setSnackbar({ open: true, message: "❌ Xóa thất bại", severity: "error" });
    }
  };

  const handleSaveAll = () => {
    saveAllQuestions({
      questions,
      db,
      selectedClass,
      semester,
      lesson,
      setSnackbar,
    });
    localStorage.setItem("teacherQuiz", JSON.stringify(questions));
  };

  // ===== UPLOAD EXCEL =====
  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      const dataByClass = {};
      rows.forEach((row) => {
        const lop = row["Lớp"];
        if (!dataByClass[lop]) dataByClass[lop] = [];
        dataByClass[lop].push({
          stt: row["STT"] || 0,
          tenBai: row["Tên bài học"],
        });
      });

      for (const lop in dataByClass) {
        const batch = writeBatch(db);
        const colRef = collection(db, `TENBAI_Lop${lop}`);

        const snap = await getDocs(colRef);
        snap.forEach((d) => batch.delete(d.ref));

        dataByClass[lop].forEach((b) => {
          batch.set(doc(colRef, b.tenBai), b);
        });

        await batch.commit();
      }

      setSnackbar({ open: true, message: "✅ Upload Excel thành công", severity: "success" });
    } catch (err) {
      setSnackbar({ open: true, message: "❌ Upload thất bại", severity: "error" });
    } finally {
      e.target.value = "";
    }
  };

  // ===== RENDER =====
  return (
    <Box sx={{ minHeight: "100vh", pt: 10, px: 3, backgroundColor: "#e3f2fd", display: "flex", justifyContent: "center" }}>
      <Card elevation={4} sx={{ width: "100%", maxWidth: 970, p: 3, borderRadius: 3, position: "relative" }}>
        {/* BUTTONS */}
        <Stack direction="row" spacing={1} sx={{ position: "absolute", top: 8, left: 8 }}>
          <Tooltip title="Lưu đề">
            <IconButton onClick={handleSaveAll} sx={{ color: "#1976d2" }}>
              <SaveIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Tải tên bài học từ Excel">
            <IconButton onClick={handleUploadClick} sx={{ color: "#1976d2" }}>
              <FileUploadIcon />
            </IconButton>
          </Tooltip>

          <input
            type="file"
            accept=".xlsx,.xls"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </Stack>

        <Typography variant="h5" fontWeight="bold" textAlign="center" sx={{ mt: 3, mb: 2, color: "#1976d2" }}>
          SOẠN ĐỀ TRẮC NGHIỆM
        </Typography>

        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Lớp</InputLabel>
              <Select value={selectedClass} label="Lớp" onChange={(e) => setSelectedClass(e.target.value)}>
                <MenuItem value="">Chọn</MenuItem>
                {classes.map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 600 }} disabled={!selectedClass}>
              <InputLabel>Bài học</InputLabel>
              <Select
                value={lesson}
                label="Bài học"
                onChange={(e) => {
                  const value = e.target.value;
                  setLesson(value);
                  fetchExam({ selectedClass, lessonFullName: value });
                }}
              >
                <MenuItem value="">Chọn</MenuItem>
                {lessonsFromFirestore.map((bai) => (
                  <MenuItem key={bai} value={bai}>{bai}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        <Stack spacing={3}>
          {questions.map((q, qi) => (
            <QuestionCard
              key={q.id}
              q={q}
              qi={qi}
              updateQuestionAt={updateQuestionAt}
              handleDeleteQuestion={handleDeleteQuestion}
              handleSaveAll={handleSaveAll}
            />
          ))}
        </Stack>

        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button variant="contained" onClick={addQuestion}>
            Thêm câu hỏi
          </Button>
        </Stack>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
      </Card>
    </Box>
  );
}
