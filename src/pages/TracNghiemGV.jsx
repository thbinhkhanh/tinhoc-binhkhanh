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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

import { db } from "../firebase";
import { doc, getDoc, getDocs, updateDoc, setDoc, collection, writeBatch } from "firebase/firestore";

import SaveIcon from "@mui/icons-material/Save";
//import FileUploadIcon from "@mui/icons-material/FileUpload";

import QuestionCard from "../Types/questions/QuestionCard";
import { saveAllQuestions } from "../utils/saveAllQuestions";
import { useTeacherQuizContext } from "../context/TeacherQuizContext";
import DeleteIcon from "@mui/icons-material/Delete";
import OpenExamDialog from "../dialog/OpenExamDialog";
import ExitAddLessonDialog from "../dialog/ExitAddLessonDialog";
import ExportDialog from "../dialog/ExportDialog";

import { exportQuestionsToJSON } from "../utils/exportJson_importJson.js";
import { importQuestionsFromJSON } from "../utils/exportJson_importJson.js";
import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import InputAdornment from "@mui/material/InputAdornment";
import { cleanAnswersFieldInAllQuizzes } from "../utils/cleanAnswersField";


export default function TracNghiemGV() {
  const fileInputRef = useRef(null);

  const savedConfig = JSON.parse(localStorage.getItem("teacherConfig") || "{}");
  const [selectedClass, setSelectedClass] = useState(savedConfig.selectedClass || "");
  const [semester, setSemester] = useState(savedConfig.semester || "");
  const [lesson, setLesson] = useState(savedConfig.lesson || "");
  const [lessonsFromFirestore, setLessonsFromFirestore] = useState([]);
  const { quizCache, setQuizCache } = useTeacherQuizContext();
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const [fileName, setFileName] = useState("");
  const [openExportDialog, setOpenExportDialog] = useState(false); // dialog export

  const classes = ["Lớp 1", "Lớp 2", "Lớp 3", "Lớp 4", "Lớp 5"];

  const [prevLesson, setPrevLesson] = useState("");
  const [prevQuestions, setPrevQuestions] = useState([]);
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [newLessonName, setNewLessonName] = useState("");
  const [week, setWeek] = useState("");
  const [lessonInput, setLessonInput] = useState("");
  const [openExitDialog, setOpenExitDialog] = useState(false);
  const [onConfirmExit, setOnConfirmExit] = useState(() => () => {});
  const [justSaved, setJustSaved] = useState(false);

  const weeks =
    String(semester) === "1"
      ? Array.from({ length: 18 }, (_, i) => i + 1)      // HK I: 1 → 18
      : Array.from({ length: 17 }, (_, i) => i + 19);    // HK II: 19 → 35

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

  // ===== INIT QUESTIONS (FIX MẤT DỮ LIỆU KHI ĐANG SOẠN) =====
  useEffect(() => {
    const isAdding = localStorage.getItem("isAddingLesson") === "true";

    // 🔥 Nếu đang thêm bài → dùng draft
    if (isAdding) {
      const draft = JSON.parse(localStorage.getItem("draftQuestions") || "[]");

      if (Array.isArray(draft) && draft.length > 0) {
        setQuestions(draft);
        return;
      }
    }

    // 🔥 QUAN TRỌNG: nếu đã có lesson → KHÔNG load ở đây
    if (savedConfig.lesson) {
      return; // 👉 để fetchExam xử lý
    }

    // fallback
    const saved = JSON.parse(localStorage.getItem("teacherQuiz") || "[]");

    if (Array.isArray(saved) && saved.length > 0) {
      setQuestions(saved);
    } else {
      setQuestions([createEmptyQuestion()]);
    }
  }, []);

  // ===== AUTO SAVE DRAFT =====
  useEffect(() => {
    if (isAddingLesson) {
      localStorage.setItem("draftQuestions", JSON.stringify(questions));
    }
  }, [questions, isAddingLesson]);

  // ===== SAVE CONFIG LOCAL =====
  useEffect(() => {
    localStorage.setItem(
      "teacherConfig",
      JSON.stringify({ selectedClass, semester, lesson })
    );
  }, [selectedClass, semester, lesson]);

  // ===== SYNC lesson → lessonInput =====
  useEffect(() => {
    if (lesson) {
      setLessonInput(lesson);
    }
  }, [lesson]);

  // ===== FIRESTORE COLLECTION =====
  const getTracNghiemCollection = (lop) => {
    const num = lop.match(/\d+/)?.[0];
    return num ? `TRACNGHIEM${num}` : null;
  };

  useEffect(() => {
    const flag = localStorage.getItem("isAddingLesson") === "true";
    setIsAddingLesson(flag);
  }, []);

  // ===== FETCH EXAM =====
  const fetchExam = async ({ selectedClass, lessonFullName }) => {
    // 🔥 CHẶN NGAY TỪ ĐẦU (an toàn hơn)
    const isAdding =
      isAddingLesson || localStorage.getItem("isAddingLesson") === "true";

    if (isAdding) {
      console.log("🚫 Đang thêm bài → bỏ qua fetchExam");
      return;
    }

    if (!selectedClass || !lessonFullName) return;

    const CACHE_KEY = `teacher_quiz_${selectedClass}_${lessonFullName}`;

    try {
      const num = selectedClass.replace("Lớp ", "");
      const collectionName = `TRACNGHIEM${num}`;
      const docRef = doc(db, collectionName, lessonFullName);

      // =======================
      // 1️⃣ FIRESTORE – chỉ lấy updatedAt
      // =======================
      const snap = await getDoc(docRef);

      if (!snap.exists()) {
        //console.warn("❌ GV KHÔNG TÌM THẤY ĐỀ:", lessonFullName);
        setQuestions([createEmptyQuestion()]);
        localStorage.removeItem(CACHE_KEY);

        // xoá cache đề này trong context
        setQuizCache(prev => {
          if (!prev) return {};
          const next = { ...prev };
          delete next[CACHE_KEY];
          return next;
        });

        return;
      }

      const data = snap.data();
      const serverUpdatedAt =
        typeof data.updatedAt === "number"
          ? data.updatedAt
          : data.updatedAt?.toMillis?.() ?? 0;

      // =======================
      // 2️⃣ CONTEXT (VALID)
      // =======================
      const cacheFromContext = quizCache?.[CACHE_KEY];
      console.groupEnd();

      if (
        cacheFromContext &&
        cacheFromContext.updatedAt === serverUpdatedAt &&
        Array.isArray(cacheFromContext.questions)
      ) {
        //console.log("🧠 GV LOAD FROM CONTEXT ✅", CACHE_KEY);
        setQuestions(cacheFromContext.questions);
        return;
      }

      // =======================
      // 3️⃣ LOCALSTORAGE (VALID)
      // =======================
      const stored = localStorage.getItem(CACHE_KEY);

      //console.group("💾 GV CHECK LOCALSTORAGE");
      //console.log("CACHE_KEY:", CACHE_KEY);
      //console.log("stored raw:", stored);
      console.groupEnd();

      if (stored) {
        const parsed = JSON.parse(stored);

        //console.group("💾 GV PARSED LOCAL");
        //console.log("parsed.updatedAt:", parsed.updatedAt);
        //console.log("serverUpdatedAt:", serverUpdatedAt);
        console.groupEnd();

        if (
          parsed.updatedAt === serverUpdatedAt &&
          Array.isArray(parsed.questions)
        ) {
          //console.log("💾 GV LOAD FROM LOCALSTORAGE ✅", CACHE_KEY);

          setQuestions(parsed.questions);

          // ✅ sync lại context (LƯU NHIỀU ĐỀ)
          setQuizCache(prev => ({
            ...prev,
            [CACHE_KEY]: parsed,
          }));

          return;
        } else {
          console.warn("❌ GV LOCALSTORAGE OUTDATED → REMOVE", CACHE_KEY);
          localStorage.removeItem(CACHE_KEY);
        }
      }

      // =======================
      // 4️⃣ FIRESTORE – LOAD FULL QUESTIONS
      // =======================
      const questionsFromServer = Array.isArray(data.questions)
        ? data.questions
        : [createEmptyQuestion()];

      setQuestions(questionsFromServer);

      const cachePayload = {
        key: CACHE_KEY,
        class: selectedClass,
        lesson: lessonFullName,
        questions: questionsFromServer,
        updatedAt: serverUpdatedAt,
        savedAt: Date.now(),
      };

      // =======================
      // 5️⃣ SAVE CACHE (CONTEXT + STORAGE)
      // =======================
      setQuizCache(prev => ({
        ...prev,
        [CACHE_KEY]: cachePayload,
      }));

      localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));

      //console.log("🔥 GV LOAD FROM FIRESTORE & CACHE SAVED", CACHE_KEY);

    } catch (err) {
      console.error("❌ GV FETCH EXAM ERROR:", err);
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
        .map((d) => d.data())
        .sort((a, b) => {
          const aIsWeek = a.tenBai?.startsWith("Tuần");
          const bIsWeek = b.tenBai?.startsWith("Tuần");

          // 👉 bài Tuần luôn xuống cuối
          if (aIsWeek && !bIsWeek) return 1;
          if (!aIsWeek && bIsWeek) return -1;

          // 👉 cùng loại thì sort theo stt
          return (a.stt || 0) - (b.stt || 0);
        })
        .map((d) => d.tenBai);

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
      if (justSaved) return; // 🔥 chặn fetch sau khi vừa lưu
      if (!lesson && lessonInput) return;
      if (isAddingLesson || localStorage.getItem("isAddingLesson") === "true") return;

      try {
        const snap = await getDoc(doc(db, "CONFIG", "config"));
        if (!snap.exists()) return;

        const { selectedClass, lesson } = snap.data();
        if (!selectedClass || !lesson) return;

        setSelectedClass(selectedClass);
        const lessons = await fetchLessonsFromFirestore(selectedClass);

        if (lessons.includes(lesson)) {
          setLesson(lesson);
          setLessonInput(lesson);
          fetchExam({ selectedClass, lessonFullName: lesson });
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadLastOpenedExam();
  }, [isAddingLesson, lessonInput, justSaved]);

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

  /*const handleSaveAll = () => {
    saveAllQuestions({
      questions,
      db,
      selectedClass,
      semester,
      lesson,
      setSnackbar,
    });
    localStorage.setItem("teacherQuiz", JSON.stringify(questions));
  };*/

const handleSaveAll = async () => {
  // 🔴 kiểm tra lớp + bài học
  const finalLesson = (lesson || lessonInput || "").trim();

  if (!selectedClass || !finalLesson) {
    setSnackbar({
      open: true,
      severity: "warning",
      message: "⚠️ Vui lòng chọn lớp và nhập bài học",
    });
    return;
  }

  const lessonName = finalLesson;

  // 🔴 nếu là bài tuần → validate format
  const isWeekLesson = lessonName.toLowerCase().startsWith("tuần");
  if (isWeekLesson) {
    const isValid = /^Tuần\s\d+\.\s.+/.test(lessonName);
    if (!isValid) {
      setSnackbar({
        open: true,
        severity: "warning",
        message: "⚠️ Định dạng phải: Tuần X. Tên bài",
      });
      return;
    }
  }

  try {
    // ===== LƯU ĐỀ =====
    await saveAllQuestions({
      questions,
      db,
      selectedClass,
      semester,
      lesson: lessonName,
      setSnackbar,
    });

    // ✅ SET LẠI LESSON
    setLesson(lessonName);
    setLessonInput(lessonName);

    // 🔥 Chặn fetchExam sau khi vừa lưu
    setJustSaved(true);

    // 🔥 XÓA CACHE CŨ
    const CACHE_KEY = `teacher_quiz_${selectedClass}_${lessonName}`;
    localStorage.removeItem(CACHE_KEY);
    setQuizCache((prev) => {
      if (!prev) return {};
      const next = { ...prev };
      delete next[CACHE_KEY];
      return next;
    });

    localStorage.setItem("teacherQuiz", JSON.stringify(questions));

    // 🔥 TẮT CỜ thêm bài
    setIsAddingLesson(false);
    localStorage.removeItem("isAddingLesson");
    localStorage.removeItem("draftQuestions");

    // ===== AUTO THÊM BÀI MỚI NẾU CHƯA CÓ =====
    if (!lessonsFromFirestore.includes(lessonName)) {
      const lopNumber = selectedClass.replace("Lớp ", "");
      const stt = lessonsFromFirestore.length + 1; // gán stt cho bài mới
      await setDoc(doc(db, `TENBAI_Lop${lopNumber}`, lessonName), {
        tenBai: lessonName,
        createdAt: new Date(),
        stt,
      });

      // reload list lessons & set state đúng
      const lessons = await fetchLessonsFromFirestore(selectedClass);
      setLessonsFromFirestore(lessons);
    }

    // ===== LƯU CONFIG =====
    await setDoc(
      doc(db, "CONFIG", "config"),
      {
        selectedClass,
        lesson: lessonName,
      },
      { merge: true }
    );

    {/*setSnackbar({
      open: true,
      message: "✅ Lưu đề thành công",
      severity: "success",
    });*/}

  } catch (err) {
    console.error("❌ Lỗi lưu đề:", err);
    setSnackbar({
      open: true,
      message: "❌ Lưu đề thất bại",
      severity: "error",
    });
  }
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

  const handleAddLesson = () => {
    setPrevLesson(lesson);
    setPrevQuestions(questions);

    setLesson("");          // 🔥 clear
    setLessonInput("");     // 🔥 clear
    setQuestions([createEmptyQuestion()]);

    setIsAddingLesson(true);
    localStorage.setItem("isAddingLesson", "true");
  };

  const handleExportJSON = () => {
    let defaultName = "";

    if (selectedClass && lesson) {
      // thay khoảng trắng bằng "_", bỏ dấu chấm
      const lop = selectedClass.replace(/\s+/g, " ");
      const bai = lesson.replace(/\s+/g, " ").replace(/\./g, "");
      defaultName = `${lop}_${bai}`;
    }

    setFileName(defaultName);
    setOpenExportDialog(true);
  };
  
  const handleConfirmExport = () => {
    setOpenExportDialog(false); // đóng dialog

    let finalName = fileName.trim();

    if (!finalName) {
      setSnackbar({
        open: true,
        message: "❌ Tên file không được để trống",
        severity: "error",
      });
      return;
    }

    // 🔥 Xóa hẳn phần: .json_123456
    finalName = finalName.replace(/\.json_\d+$/, "");

    // 🔥 nếu chưa có .json thì thêm
    if (!finalName.endsWith(".json")) {
      finalName += ".json";
    }

    const result = exportQuestionsToJSON({
      questions,
      fileName: finalName,
    });

    if (result.success) {
      setSnackbar({
        open: true,
        message: "✅ Xuất đề thành công!",
        severity: "success",
      });
    } else {
      setSnackbar({
        open: true,
        message: "❌ Lỗi khi xuất đề!",
        severity: "error",
      });
    }
  };
  const handleImportJSON = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const result = await importQuestionsFromJSON(file);

    if (result.success) {
      // 🔥 Lưu trạng thái bài học hiện tại để restore
      setPrevLesson(lesson);
      setPrevQuestions(questions);

      // 🔥 Chuyển sang chế độ thêm bài học (textfield)
      setIsAddingLesson(true);

      // 🔥 Set dữ liệu mới từ JSON
      setQuestions(result.data);
      setLessonInput(""); // user sẽ nhập tên mới
      setLesson("");      // ẩn dropdown

      setSnackbar({
        open: true,
        message: "✅ Nhập đề thành công!",
        severity: "success",
      });
    } else {
      setSnackbar({
        open: true,
        message: `❌ ${result.error}`,
        severity: "error",
      });
    }

    // reset input để chọn lại file cùng tên vẫn trigger
    e.target.value = "";
  };

  const handleCleanAnswers = async () => {
    if (!window.confirm("Xóa toàn bộ answers trong tất cả đề?")) return;

    try {
      await cleanAnswersFieldInAllQuizzes(db);

      setSnackbar({
        open: true,
        message: "✅ Đã xóa toàn bộ answers",
        severity: "success",
      });
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "❌ Lỗi khi xóa answers",
        severity: "error",
      });
    }
  };

  // ===== RENDER =====
  return (
    <Box sx={{ minHeight: "100vh", pt: 10, px: 3, backgroundColor: "#e3f2fd", display: "flex", justifyContent: "center" }}>
      <Card elevation={4} sx={{ width: "100%", maxWidth: 970, p: 3, borderRadius: 3, position: "relative" }}>
        {/* BUTTONS */}
        <Stack
          direction="row"
          spacing={1}
          sx={{ position: "absolute", top: 8, left: 8 }}
        >
          <Tooltip title="Thêm bài học">
            <IconButton
              onClick={handleAddLesson} // reuse logic nút Thêm bài học
              sx={{ color: "#1976d2" }}
            >
              <Box
                sx={{
                  fontSize: 24,
                  fontWeight: "bold",
                  lineHeight: 1,
                }}
              >
                +
              </Box>
            </IconButton>
          </Tooltip>

          <Tooltip title="Lưu đề">
            <IconButton onClick={handleSaveAll} sx={{ color: "#1976d2" }}>
              <SaveIcon />
            </IconButton>
          </Tooltip>

          {/*<Tooltip title="Tải tên bài học từ Excel">
            <IconButton onClick={handleUploadClick} sx={{ color: "#1976d2" }}>
              <UploadFileIcon /> 
            </IconButton>
          </Tooltip>*/}

          {/* 🗑️ ICON XÓA ĐỀ */}
          <Tooltip title="Xóa đề trắc nghiệm">
            <IconButton
              onClick={() => setOpenDeleteDialog(true)}
              sx={{ color: "#f57c00" }}   // cam cảnh báo
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>

          <input
            type="file"
            accept=".xlsx,.xls"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          {/* Export */}
          <Tooltip title="Xuất đề kiểm tra (JSON)">
            <IconButton onClick={handleExportJSON} sx={{ color: "#2e7d32" }}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>

          {/* Import */} 
          <Tooltip title="Nhập đề kiểm tra (JSON)">
            <IconButton
              onClick={() => fileInputRef.current.click()}
              sx={{ color: "#ed6c02" }}
            >
              <UploadFileIcon />
            </IconButton>
          </Tooltip>

          {/* Input file ẩn */}
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleImportJSON}
          />

          {/* Xóa answers [] */}
          <Tooltip title="Xóa toàn bộ answers">
            <IconButton
              onClick={handleCleanAnswers}
              sx={{ color: "#d32f2f" }}
            >
              🧹
            </IconButton>
          </Tooltip>
        </Stack>

        <Typography variant="h5" fontWeight="bold" textAlign="center" sx={{ mt: 3, mb: 2, color: "#1976d2" }}>
          SOẠN ĐỀ TRẮC NGHIỆM
        </Typography>

        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>

            {/* LỚP */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Lớp</InputLabel>
              <Select
                value={selectedClass}
                label="Lớp"
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <MenuItem value="">Chọn</MenuItem>
                {classes.map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* BÀI HỌC */}
            {!isAddingLesson ? (
              // ===== DROPDOWN =====
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Bài học</InputLabel>
                <Select
                  value={lesson}
                  label="Bài học"
                  onChange={async (e) => {
                    const value = e.target.value;

                    setLesson(value);
                    setLessonInput(value); // 🔥 sync luôn

                    if (!value) {
                      setQuestions([createEmptyQuestion()]);
                      return;
                    }

                    await setDoc(doc(db, "CONFIG", "config"), {
                      selectedClass,
                      lesson: value,
                    }, { merge: true });

                    fetchExam({
                      selectedClass,
                      lessonFullName: value,
                    });
                  }}
                >
                  <MenuItem value="">Chọn</MenuItem>
                  {lessonsFromFirestore.map((l) => (
                    <MenuItem key={l} value={l}>
                      {l}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              // ===== INPUT NHẬP TÊN + NÚT X =====
              <TextField
                label="Nhập tên bài học mới"
                size="small"
                value={lessonInput}
                onChange={(e) => setLessonInput(e.target.value)}
                sx={{ flex: 1 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Thoát chế độ nhập" arrow>
                        <IconButton
                          size="small"
                          edge="end"
                          onClick={() => {
                            // gán callback reset dữ liệu
                            setOnConfirmExit(() => () => {
                              setIsAddingLesson(false);
                              localStorage.removeItem("isAddingLesson");

                              setLessonInput("");

                              if (prevLesson) {
                                setLesson(prevLesson);
                                setQuestions(prevQuestions);
                              } else {
                                setLesson("");
                                setQuestions([createEmptyQuestion()]);
                              }

                              setOpenExitDialog(false); // đóng dialog
                            });

                            // mở dialog cảnh báo
                            setOpenExitDialog(true);
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />

            )}

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

        <OpenExamDialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
        />

        <ExitAddLessonDialog
          open={openExitDialog}
          onClose={() => setOpenExitDialog(false)}
          onConfirmExit={onConfirmExit}
        />

        <ExportDialog
          open={openExportDialog}
          onClose={() => setOpenExportDialog(false)}
          fileName={fileName}
          setFileName={setFileName}
          onConfirm={handleConfirmExport}
        />

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
