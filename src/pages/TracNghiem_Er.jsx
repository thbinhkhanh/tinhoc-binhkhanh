import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  Stack,
  LinearProgress,
  IconButton,
  Tooltip,
  Snackbar, 
  Alert,
  Divider,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Card,
} from "@mui/material";
import { doc, getDoc, getDocs, setDoc, collection, updateDoc } from "firebase/firestore";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import { db } from "../firebase";
import { handleSubmitQuiz } from "../utils/submitQuiz";
import { useConfig } from "../context/ConfigContext";
import { useStudentQuizContext } from "../context/StudentQuizContext";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import AccessTimeIcon from "@mui/icons-material/AccessTime";


import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import IncompleteAnswersDialog from "../dialog/IncompleteAnswersDialog";
import ExitConfirmDialog from "../dialog/ExitConfirmDialog";
import ResultDialog from "../dialog/ResultDialog";
import { useSearchParams } from "react-router-dom";
import ImageZoomDialog from "../dialog/ImageZoomDialog";
import QuizQuestion from "../Types/questions/options/QuizQuestion";
import { buildRuntimeQuestions } from "../utils/buildRuntimeQuestions";

// Hàm shuffle mảng
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function TracNghiem() {
  const location = useLocation();
  const navigate = useNavigate();
  const { config } = useConfig();

  // 🔹 Lấy học sinh từ context hoặc fallback localStorage
  const savedStudentInfo = JSON.parse(localStorage.getItem("studentInfo") || "{}");

  const studentId = config?.studentId || savedStudentInfo.studentId || "HS001";
  const fullname = config?.fullname || savedStudentInfo.fullname || "";
  const lop = config?.lop || savedStudentInfo.lop || "";
  const khoi = config?.khoi || savedStudentInfo.khoi || "";
  const mon = config?.mon || savedStudentInfo.mon || "Tin học";
  const { quizCache, setQuizCache } = useStudentQuizContext();

  // 🔹 State quiz
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizClass, setQuizClass] = useState("");
  const [score, setScore] = useState(0);

  const [openAlertDialog, setOpenAlertDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState(""); 
  const [unansweredQuestions, setUnansweredQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [openExitConfirm, setOpenExitConfirm] = useState(false);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(config?.timeLimit ? config.timeLimit * 60 : 600);
  const [startTime, setStartTime] = useState(null);

  const [openResultDialog, setOpenResultDialog] = useState(false);
  const [studentResult, setStudentResult] = useState(null);
  const [fillBlankStatus, setFillBlankStatus] = useState({});
  const [dialogMessage, setDialogMessage] = useState("");
  const [notFoundMessage, setNotFoundMessage] = useState(""); 
  const [selectedExamType, setSelectedExamType] = useState("Giữa kỳ I");

  const [zoomImage, setZoomImage] = useState(null);

  const choXemDiem = config?.choXemDiem ?? false;
  const choXemDapAn = config?.choXemDapAn ?? false;
  const timeLimitMinutes = config?.timeLimit ?? 10;

  const [searchParams] = useSearchParams();
  const tenBai = decodeURIComponent(searchParams.get("bai") || "");
  const lopHoc = searchParams.get("lop");

  const tenBaiRutGon = getTenBaiRutGon(tenBai);
  
  function getTenBaiRutGon(tenBai) {
    if (!tenBai) return "";
    const match = tenBai.match(/^Bài\s+\d+[A-Z]?/i);
    return match ? match[0] : tenBai;
  }

  useEffect(() => {
    // ✅ 0️⃣ LƯU BÀI ĐANG LÀM (ĐÚNG CHỖ)
    if (lopHoc || tenBai) {
      const khoi = lopHoc ? `Khối ${lopHoc[0]}` : undefined;

      localStorage.setItem(
        "lastExam",
        JSON.stringify({
          khoi,
          lop: lopHoc,
          bai: tenBai,
          bai: tenBaiRutGon, // ✅ dùng rút gọn
          path: location.pathname + location.search,
        })
      );
    }

    // ✅ 1️⃣ VÉ THÔNG HÀNH (TỪ INFO QUAY LẠI)
    if (location.state?.fromInfo) {
      navigate(location.pathname + location.search, { replace: true });
      return;
    }

    // ✅ 2️⃣ MỞ LINK TRỰC TIẾP → INFO
    const khoiFinal = lopHoc ? `Khối ${lopHoc[0]}` : undefined;

    navigate("/info", {
      replace: true,
      state: {
        ...(khoiFinal ? { khoi: khoiFinal } : {}),
        target: location.pathname + location.search,
        disableKhoi: true,
      },
    });
  }, []);

  // Đồng bộ thời gian nếu config thay đổi
  useEffect(() => {
    setTimeLeft(timeLimitMinutes * 60);
  }, [timeLimitMinutes]);

  // Lấy thông tin học sinh tiện dùng
  const studentInfo = {
    id: studentId,
    name: fullname,
    className: lop,
    khoi,
    mon,
  };

  const studentClass = studentInfo.className;
  const studentName = studentInfo.name;

  useEffect(() => {
    if (started && !startTime) {
      setStartTime(Date.now());
    }
  }, [started, startTime]);

  // Timer
  useEffect(() => {
    if (!started || submitted) return; // <-- thêm !started
    if (timeLeft <= 0) {
      //autoSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [started, timeLeft, submitted]);


  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleMatchSelect = (questionId, leftIndex, rightIndex) => {
    setAnswers(prev => {
      const prevAns = prev[questionId] ?? [];
      const newAns = [...prevAns];
      newAns[leftIndex] = rightIndex;
      return { ...prev, [questionId]: newAns };
    });
  };

  // Hàm shuffleUntilDifferent: đảo mảng cho đến khi khác ít nhất 1 phần tử so với gốc
  function shuffleUntilDifferent(items) {
    if (!Array.isArray(items) || items.length === 0) return items;
    let shuffled = [...items];
    let attempts = 0;
    do {
      shuffled = shuffleArray([...items]);
      attempts++;
    } while (
      shuffled.every((item, idx) => item.idx === items[idx].idx) &&
      attempts < 100
    );
    return shuffled;
  }

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);

        // =======================
        // ❌ CHẶN LỖI NGAY ĐẦU
        // =======================
        if (!lopHoc || !tenBai) {
          setSnackbar({
            open: true,
            message: "❌ Thiếu lớp hoặc tên bài học",
            severity: "error",
          });
          setLoading(false);
          return;
        }

        const CACHE_KEY = `quiz_${lopHoc}_${tenBai}`;
        const collectionName = `TRACNGHIEM${lopHoc}`;
        const docId = tenBai;

        // =======================
        // 🔥 1. LUÔN ĐỌC FIRESTORE TRƯỚC (LẤY updatedAt)
        // =======================
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          const msg = "❌ Không tìm thấy đề trắc nghiệm!";
          setSnackbar({ open: true, message: msg, severity: "error" });
          setNotFoundMessage(msg);
          setLoading(false);
          return;
        }

        const data = docSnap.data();
        const serverUpdatedAt =
          typeof data.updatedAt === "number"
            ? data.updatedAt
            : data.updatedAt?.toMillis?.() ?? 0;

        // =======================
        // ✅ 2. CONTEXT (VALIDATE)
        // =======================
        const cacheFromContext = quizCache?.[CACHE_KEY];

        if (
          cacheFromContext &&
          cacheFromContext.updatedAt === serverUpdatedAt &&
          Array.isArray(cacheFromContext.questions)
        ) {

          setQuestions(cacheFromContext.questions);
          setQuizClass(cacheFromContext.class || "");
          setStarted(true);
          setProgress(100);
          setLoading(false);
          return;
        }

        // =======================
        // ✅ 3. LOCALSTORAGE (VALIDATE)
        // =======================
        const stored = localStorage.getItem(CACHE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);

          if (
            parsed.updatedAt === serverUpdatedAt &&
            Array.isArray(parsed.questions)
          ) {

            setQuestions(parsed.questions);
            setQuizClass(parsed.class || "");
            setStarted(true);
            setProgress(100);

            // ✅ sync lại context (LƯU NHIỀU ĐỀ)
            setQuizCache(prev => ({
              ...prev,
              [CACHE_KEY]: parsed,
            }));

            setLoading(false);
            return;
          } else {
            // ❌ đề cũ → xoá
            localStorage.removeItem(CACHE_KEY);
          }
        }

        // --- Xử lý câu hỏi ---
        const loadedQuestions = buildRuntimeQuestions(data.questions || []);
        
        // --- Lọc câu hợp lệ bao gồm fillblank ---
       const validQuestions = loadedQuestions.filter(q => {
          if (q.type === "matching") return q.question.trim() !== "" && q.leftOptions.length > 0 && q.rightOptions.length > 0;
          if (q.type === "sort") return q.question.trim() !== "" && q.options.length > 0;
          if (["single", "multiple", "image"].includes(q.type)) return q.question.trim() !== "" && q.options.length > 0 && Array.isArray(q.correct);
          if (q.type === "truefalse") return q.question.trim() !== "" && q.options.length >= 2 && Array.isArray(q.correct);
          if (q.type === "fillblank") return q.question.trim() !== "" && q.options.length > 0;
          return false;
        });
        

        setQuestions(validQuestions);
        // =======================
        // ✅ LƯU CONTEXT + STORAGE
        // =======================
        const cachePayload = {
          key: CACHE_KEY,
          lopHoc,
          tenBai,
          class: data.class || "",
          questions: validQuestions,

          updatedAt: serverUpdatedAt, // ✅ BẮT BUỘC
          savedAt: Date.now(),        // (tuỳ, để debug)
        };


        setQuizCache(prev => ({
          ...prev,
          [CACHE_KEY]: cachePayload
        }));

        localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));


        setProgress(100);
        setStarted(true);

        setAnswers(prev => {
          const next = { ...prev };
          validQuestions.forEach(q => {
            if (q.type === "sort" && Array.isArray(q.initialSortOrder)) {
              if (!Array.isArray(next[q.id])) {
                next[q.id] = q.initialSortOrder;
              }
            }
          });
          return next;
        });

      } catch (err) {
        console.error("❌ Lỗi khi load câu hỏi:", err);
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [tenBai, lopHoc]);

  // Hàm chuyển chữ đầu thành hoa
  const capitalizeName = (name = "") =>
    name
      .toLowerCase()
      .split(" ")
      .filter(word => word.trim() !== "")
      .map(word => word[0].toUpperCase() + word.slice(1))
      .join(" ");

  // Sử dụng:
  const hoVaTen = capitalizeName(studentName);

  const getQuestionMax = (q) => {
    // Nếu có scoreTotal thì dùng (tổng sẵn của câu)
    if (typeof q.scoreTotal === "number") return q.scoreTotal;

    // Nếu có per-item score và có danh sách tiểu mục
    if (typeof q.perItemScore === "number") {
      // xác định số tiểu mục theo loại
      const subCount =
        q.type === "truefalse" ? (Array.isArray(q.correct) ? q.correct.length : 0) :
        q.type === "fillblank" ? (Array.isArray(q.options) ? q.options.length : 0) :
        q.type === "matching" ? (Array.isArray(q.correct) ? q.correct.length : 0) :
        q.type === "sort" ? (Array.isArray(q.correctTexts) ? q.correctTexts.length : 0) :
        1;
      return q.perItemScore * subCount;
    }

    // Mặc định: dùng score nếu có, nếu không thì 1
    return typeof q.score === "number" ? q.score : 1;
  };

  const maxScore = questions.reduce((sum, q) => sum + getQuestionMax(q), 0);

  const currentQuestion = questions[currentIndex] || null;
  const isEmptyQuestion = currentQuestion?.question === "";

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const handleCloseSnackbar = (event, reason) => { if (reason === "clickaway") return; setSnackbar(prev => ({ ...prev, open: false })); };

  const handleSubmit = () =>
    handleSubmitQuiz({
      studentName,
      studentClass,
      tenBaiRutGon,
      studentId,
      studentInfo,
      studentResult,
      setStudentResult,
      setSnackbar,
      setSaving,
      setSubmitted,
      setOpenAlertDialog,
      setUnansweredQuestions,
      setOpenResultDialog,
      questions,
      answers,
      startTime,
      db,
      config,
      getQuestionMax,
      capitalizeName,
      formatTime,
    });

  const handleNext = () => currentIndex < questions.length - 1 && setCurrentIndex(currentIndex + 1);
  const handlePrev = () => currentIndex > 0 && setCurrentIndex(currentIndex - 1);

  const convertPercentToScore = (percent) => {
    if (percent === undefined || percent === null) return "?";
    const raw = percent / 10;
    const decimal = raw % 1;
    if (decimal < 0.25) return Math.floor(raw);
    if (decimal < 0.75) return Math.floor(raw) + 0.5;
    return Math.ceil(raw);
  };

  function reorder(list, startIndex, endIndex) {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  }


// Single: luôn lưu là số index
const handleSingleSelect = (questionId, optionIndex) => {
  // Đảm bảo là number (tránh trường hợp optionIndex là string)
  const idx = Number(optionIndex);
  setAnswers(prev => ({ ...prev, [questionId]: idx }));
};

// Multiple: lưu là mảng số
const handleMultipleSelect = (questionId, optionIndex, checked) => {
  const idx = Number(optionIndex);
  setAnswers(prev => {
    const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
    const next = checked
      ? Array.from(new Set([...current, idx]))
      : current.filter(x => x !== idx);
    return { ...prev, [questionId]: next };
  });
};

const handleDragEnd = (result) => {
  const { source, destination, draggableId } = result;
  if (!destination) return;

  setQuestions((prev) => {
    const updated = [...prev];
    const q = updated[currentIndex];

    let filled = q.filled ? [...q.filled] : [];

    // Kéo từ words vào blank
    if (destination.droppableId.startsWith("blank-") && source.droppableId === "words") {
      const blankIndex = Number(destination.droppableId.split("-")[1]);
      const word = draggableId.replace("word-", "");
      while (filled.length <= blankIndex) filled.push("");
      filled[blankIndex] = word;
    }

    // Kéo từ blank ra words
    if (destination.droppableId === "words" && source.droppableId.startsWith("blank-")) {
      const blankIndex = Number(source.droppableId.split("-")[1]);
      filled[blankIndex] = ""; // ô blank trở về rỗng
    }

    updated[currentIndex] = { ...q, filled };

    // ✅ Cập nhật luôn answers để chấm điểm
    setAnswers((prevAns) => ({
      ...prevAns,
      [q.id]: filled
    }));

    return updated;
  });
};

const showNotFoundDialog = (msg) => {
  setDialogMessage(msg);
  setDialogMode("notFound");
  setOpenResultDialog(true);
};

// Chuẩn hóa dữ liệu dạng Sort
const normalizeValue = (val) => {
  if (typeof val === "object") {
    if (val.image) return String(val.image).trim();
    if (val.text) return val.text.trim();
  }
  if (typeof val === "string") {
    return val.trim();
  }
  return String(val).trim();
};

const ratio = currentQuestion?.columnRatio || { left: 1, right: 1 };

return (
  <Box
    id="quiz-container"
    sx={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      background: "linear-gradient(to bottom, #e3f2fd, #bbdefb)",
      pt: { xs: 10, sm: 10 }, // <-- Thêm khoảng trống trên như trang mẫu
      px: { xs: 1, sm: 2 },
    }}
  >
    <Paper
      sx={{
        p: { xs: 2, sm: 4 },
        borderRadius: 3,
        width: "100%",
        maxWidth: 1000,
        minWidth: { xs: "auto", sm: 700 },   // sửa minWidth giống mẫu
        minHeight: { xs: "auto", sm: 650 },  // sửa minHeight giống mẫu
        display: "flex",
        flexDirection: "column",
        gap: 2,
        position: "relative",
        boxSizing: "border-box",
        backgroundColor: "#fff",             // thêm nền trắng giống mẫu
        pb: 3,
      }}
    >
      {/* Nút thoát */}
      <Tooltip title="Thoát trắc nghiệm" arrow>
        <IconButton
          onClick={() => {
            const goToInfo = () => {
              navigate("/info", {
                replace: true,
                state: {
                  fromExam: true, // ⭐ cờ để disable menu
                  khoi: `Khối ${lopHoc}`,
                  target: location.pathname + location.search,
                },
              });
            };

            // ❌ Không tìm thấy đề → quay về Info luôn
            if (notFoundMessage?.includes("❌ Không tìm thấy đề trắc nghiệm!")) {
              goToInfo();
            }
            // ✅ Đã nộp bài → quay về Info
            else if (submitted) {
              goToInfo();
            }
            // ⚠️ Chưa nộp → hỏi xác nhận
            else {
              setOpenExitConfirm(true);
            }
          }}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            color: "#f44336",
            bgcolor: "rgba(255,255,255,0.9)",
            "&:hover": { bgcolor: "rgba(255,67,54,0.2)" },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Tooltip>

      {/* Tiêu đề */}
      <Typography
        variant="h6"
        fontWeight="bold"
        sx={{ color: "#1976d2", mt: { xs: 4, sm: -1 }, mb: { xs: 1, sm: -1 }, textAlign: "center" }}
      >
        {tenBai ? tenBai.toUpperCase() : "TRẮC NGHIỆM"}
      </Typography>

      {/* Đồng hồ với vị trí cố định */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mt: 0.5,
          mb: -2,
          minHeight: 10, // giữ khoảng trống luôn
          width: "100%",
        }}
      >
        {/* Nội dung đồng hồ chỉ hiển thị khi started && !loading */}
        {started && !loading && config.showTimer && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 3,
              py: 0.5,
              borderRadius: 2,
              bgcolor: "#fff",
            }}
          >
            <AccessTimeIcon sx={{ color: "#d32f2f" }} />
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", color: "#d32f2f" }}
            >
              {formatTime(timeLeft)}
            </Typography>
          </Box>
        )}


        {/* Đường gạch ngang màu xám nhạt luôn hiển thị */}
        <Box
          sx={{
            width: "100%",
            height: 1,
            bgcolor: "#e0e0e0", // màu xám nhạt
            mt: 0,
          }}
        />
      </Box>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 1, width: "100%" }}>
          <Box sx={{ width: { xs: "60%", sm: "30%" } }}>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 3, borderRadius: 3 }} />
            <Typography variant="body2" sx={{ mt: 0.5, textAlign: "center" }}>
              🔄 Đang tải... {progress}%
            </Typography>
          </Box>
        </Box>
      )}
      
      {/* KHU VỰC HIỂN THỊ CÂU HỎI */}
      <QuizQuestion
        loading={loading}
        currentQuestion={currentQuestion}
        currentIndex={currentIndex}
        answers={answers}
        setAnswers={setAnswers}
        submitted={submitted}
        started={started}
        choXemDapAn={choXemDapAn}
        setZoomImage={setZoomImage}
        handleSingleSelect={handleSingleSelect}
        handleMultipleSelect={handleMultipleSelect}
        handleDragEnd={handleDragEnd}
        reorder={reorder}
        normalizeValue={normalizeValue}
        ratio={ratio}
        />


      {/* Nút điều hướng luôn cố định ở đáy Paper */}
      <Box sx={{ flexGrow: 1 }} />
      {started && !loading && (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            position: "static",
            mt: 2,                     // cách option phía trên
            pt: 2,                     // ⬅⬅⬅ KHOẢNG CÁCH GIỮA GẠCH & NÚT
            mb: { xs: "20px", sm: "5px" },
            borderTop: "1px solid #e0e0e0",
          }}
        >

          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handlePrev}
            disabled={currentIndex === 0}
            sx={{
              width: { xs: "150px", sm: "150px" },
              bgcolor: currentIndex === 0 ? "#e0e0e0" : "#bbdefb",
              borderRadius: 1,
              color: "#0d47a1",
              "&:hover": { bgcolor: currentIndex === 0 ? "#e0e0e0" : "#90caf9" },
            }}
          >
            Câu trước
          </Button>

          {currentIndex < questions.length - 1 ? (
            <Button
              variant="outlined"
              endIcon={<ArrowForwardIcon />}
              onClick={handleNext}
              sx={{
                width: { xs: "150px", sm: "150px" },
                bgcolor: "#bbdefb",
                borderRadius: 1,
                color: "#0d47a1",
                "&:hover": { bgcolor: "#90caf9" },
              }}
            >
              Câu sau
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={submitted || isEmptyQuestion}
              sx={{ width: { xs: "120px", sm: "150px" }, borderRadius: 1 }}
            >
              Nộp bài
            </Button>
          )}
        </Stack>
      )}
    </Paper>

    {/* Dialog câu chưa làm */}
    <IncompleteAnswersDialog
      open={openAlertDialog}
      onClose={() => setOpenAlertDialog(false)}
      unansweredQuestions={unansweredQuestions}
    />

    {/* Dialog xác nhận thoát */}
      <ExitConfirmDialog
      open={openExitConfirm}
      onClose={() => setOpenExitConfirm(false)}
    />

    {/* Dialog xáchiển thị kết quả */}
    <ResultDialog
      open={openResultDialog}
      onClose={() => setOpenResultDialog(false)}
      dialogMode={dialogMode}
      dialogMessage={dialogMessage}
      studentResult={studentResult}
      choXemDiem={choXemDiem}
      convertPercentToScore={convertPercentToScore}
    />

    <ImageZoomDialog
      open={Boolean(zoomImage)}
      imageSrc={zoomImage}
      onClose={() => setZoomImage(null)}
    />

    {/* Snackbar */}
    <Snackbar
      open={snackbar.open}
      autoHideDuration={3000}
      onClose={handleCloseSnackbar}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert
        onClose={handleCloseSnackbar}
        severity={snackbar.severity}
        sx={{ width: "100%" }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  </Box>
);

}
