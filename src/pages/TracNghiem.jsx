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
// Thay cho react-beautiful-dnd
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
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

/*import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";*/

import { getQuestionStatus } from "../utils/questionStatus";
import { useTheme, useMediaQuery } from "@mui/material";

import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import IncompleteAnswersDialog from "../dialog/IncompleteAnswersDialog";
import ExitConfirmDialog from "../dialog/ExitConfirmDialog";
import ResultDialog from "../dialog/ResultDialog";
import { useSearchParams } from "react-router-dom";
import ImageZoomDialog from "../dialog/ImageZoomDialog";
import QuestionRenderer from "../Types/questions/QuestionRenderer";
import { normalizeQuestion } from "../utils/normalizeQuestion";

// Hàm shuffle mảng
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normalizeQuestions(rawQuestions) {
  if (!Array.isArray(rawQuestions)) return [];

  // Shuffle toàn bộ danh sách câu hỏi
  const shuffled = shuffleArray(rawQuestions);

  // Chuẩn hóa từng câu hỏi
  return shuffled
    .map((q, idx) => normalizeQuestion(q, idx))
    .filter(Boolean);
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

  const theme = useTheme();
  const isBelow1024 = useMediaQuery("(max-width:1023px)");
  const [showSidebar, setShowSidebar] = useState(true);

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
          lop: lopHoc,
          bai: tenBai,
          baiRutGon: tenBaiRutGon,
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

        if (!lopHoc || !tenBai) {
          setSnackbar({
            open: true,
            message: "❌ Thiếu lớp hoặc tên bài học",
            severity: "error",
          });
          setLoading(false);
          return;
        }

        const snapConfig = await getDoc(doc(db, "CONFIG", "config"));
        const namHoc = snapConfig.exists() ? snapConfig.data().namHoc : "";

        const collectionName =
          namHoc === "2025-2026"
            ? `TRACNGHIEM${lopHoc}`
            : `TRACNGHIEM${lopHoc}_New`;
        const docId = tenBai;

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

        // --- Chuẩn hóa + shuffle toàn bộ câu hỏi bằng hàm riêng ---
        const loadedQuestions = normalizeQuestions(data.questions);

        // --- Lọc câu hợp lệ ---
        const validQuestions = loadedQuestions.filter(q => {
          if (q.type === "matching") return q.question.trim() !== "" && q.leftOptions.length > 0 && q.rightOptions.length > 0;
          if (q.type === "sort") return q.question.trim() !== "" && q.options.length > 0;
          if (["single", "multiple", "image"].includes(q.type)) return q.question.trim() !== "" && q.options.length > 0 && Array.isArray(q.correct);
          if (q.type === "truefalse") return q.question.trim() !== "" && q.options.length >= 2 && Array.isArray(q.correct);
          if (q.type === "fillblank") return q.question.trim() !== "" && q.options.length > 0;
          return false;
        });

        // --- Set state ---
        setQuestions(validQuestions);
        setQuizClass(data.class || "");
        setProgress(100);
        setStarted(true);
        setAnswers({});

        // Nếu vẫn muốn lưu cache/context thì giữ lại đoạn này
        const cachePayload = {
          key: `quiz_${lopHoc}_${tenBai}`,
          lopHoc,
          tenBai,
          class: data.class || "",
          questions: validQuestions,
          updatedAt: serverUpdatedAt,
          savedAt: Date.now(),
        };
        setQuizCache(prev => ({ ...prev, [cachePayload.key]: cachePayload }));
        localStorage.setItem(cachePayload.key, JSON.stringify(cachePayload));

      } catch (err) {
        console.error("❌ Lỗi khi load câu hỏi:", err);
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [lopHoc, tenBai]);

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

  /*function mapHocKyToDocKey(loaiKT) {
    switch (loaiKT) {
      case "Giữa kỳ I": return "GKI";
      case "Cuối kỳ I": return "CKI";
      case "Giữa kỳ II": return "GKII";
      case "Cả năm": return "CN";
      default:
        console.warn("❌ Loại kiểm tra không xác định:", loaiKT);
        return "UNKNOWN";
    }
  }*/

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
  //console.log("🔎 Tổng điểm đề (maxScore):", maxScore);

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

/*useEffect(() => {
    if (config.timeLimit) setTimeLeft(config.timeLimit * 60);
  }, [config.timeLimit]);*/

  function reorder(list, startIndex, endIndex) {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  }

  // Giả sử bạn đang dùng useState để lưu đáp án

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

const questionCircleStyle = {
  width: { xs: 34, sm: 38 },
  height: { xs: 34, sm: 38 },
  borderRadius: "50%",
  minWidth: 0,
  fontSize: "0.85rem",
  fontWeight: 600,
  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
  transition: "all 0.2s ease",
};

const sidebarConfig = React.useMemo(() => {
  // < 1024px → ẨN sidebar
  if (isBelow1024) return null;

  // ≥ 1024px → sidebar 5 ô số
  return {
    width: 260,
    cols: 5,
  };
}, [isBelow1024]);

const hasSidebar = sidebarConfig && questions.length > 0;
const isSidebarVisible = hasSidebar && showSidebar;

return (
  <Box
    id="quiz-container"
    sx={{
      minHeight: "100vh",
      background: "linear-gradient(to bottom, #e3f2fd, #bbdefb)",
      pt: { xs: 10, sm: 10 },
      px: { xs: 1, sm: 2 },
    }}
  >
    {/* ===== WRAPPER ===== */}
    <Box
      sx={{
        display: "flex",
        gap: 3,
        width: "100%",
        maxWidth: isSidebarVisible ? 1280 : 1000,
        mx: "auto",
        flexDirection: { xs: "column", md: "row" },
        alignItems: "stretch",
      }}
    >
      {/* ================= LEFT: CONTENT ================= */}
      <Box
        sx={{
          flex: 1,          // ✅ chiếm phần còn lại
          minWidth: 0,      // ✅ chống tràn
          maxWidth: 1000,   // ✅ giống mẫu
        }}
      >
        <Paper
          sx={{
            p: { xs: 2, sm: 4 },
            borderRadius: 3,
            minHeight: 650,     // ✅ giống mẫu
            display: "flex",
            flexDirection: "column",
            position: "relative",
            backgroundColor: "#fff",
          }}
        >

          {/* ===== TOGGLE SIDEBAR ===== */}
          {sidebarConfig && (
            <Tooltip title={showSidebar ? "Thu gọn bảng câu hỏi" : "Mở bảng câu hỏi"}>
              <IconButton
                onClick={() => setShowSidebar((prev) => !prev)}
                sx={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  bgcolor: "#e3f2fd",
                  border: "1px solid #90caf9",
                  "&:hover": {
                    bgcolor: "#bbdefb",
                  },
                  zIndex: 10,
                }}
              >
                {showSidebar ? <ChevronLeftIcon /> : <ChevronRightIcon />}
              </IconButton>
            </Tooltip>
          )}

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
              mt: 2,
              //mb: -2,
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
                //mt: 0,
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
          <QuestionRenderer
            normalizeValue={normalizeValue}
            loading={loading}
            currentQuestion={currentQuestion}
            currentIndex={currentIndex}
            answers={answers}
            setAnswers={setAnswers}
            submitted={submitted}
            started={started}
            choXemDapAn={choXemDapAn}
            handleSingleSelect={handleSingleSelect}
            handleMultipleSelect={handleMultipleSelect}
            handleDragEnd={handleDragEnd}
            reorder={reorder}
            ratio={ratio}
            setZoomImage={setZoomImage}
          />

          {/* ===== NÚT ĐIỀU HƯỚNG Ở ĐÁY PAPER ===== */}
          <Box sx={{ flexGrow: 1 }} />

          {started && !loading && (
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{
                mt: 2,
                pt: 2,
                mb: { xs: "20px", sm: "5px" },
                borderTop: "1px solid #e0e0e0",
              }}
            >
              {/* ===== CÂU TRƯỚC ===== */}
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={handlePrev}
                disabled={currentIndex === 0}
                sx={{
                  width: 150,
                  bgcolor: currentIndex === 0 ? "#e0e0e0" : "#bbdefb",
                  borderRadius: 1,
                  color: "#0d47a1",
                  "&:hover": {
                    bgcolor: currentIndex === 0 ? "#e0e0e0" : "#90caf9",
                  },
                }}
              >
                Câu trước
              </Button>

              {/* ===== CÂU SAU / NỘP BÀI ===== */}
              {currentIndex < questions.length - 1 ? (
                <Button
                  variant="outlined"
                  endIcon={<ArrowForwardIcon />}
                  onClick={handleNext}
                  sx={{
                    width: 150,
                    bgcolor: "#bbdefb",
                    borderRadius: 1,
                    color: "#0d47a1",
                    "&:hover": { bgcolor: "#90caf9" },
                  }}
                >
                  Câu sau
                </Button>
              ) : (
                // ✅ CHỈ HIỆN NỘP BÀI KHI SIDEBAR KHÔNG HIỂN THỊ
                !isSidebarVisible && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={submitted || isEmptyQuestion}
                    sx={{
                      width: 150,
                      borderRadius: 1,
                    }}
                  >
                    Nộp bài
                  </Button>
                )
              )}
            </Stack>
          )}
        </Paper>
      </Box>

      {/* ================= RIGHT: SIDEBAR ================= */}
      {isSidebarVisible && (
        <Box sx={{ width: 260, flexShrink: 0 }}>
          <Card
            sx={{
              p: 2,
              borderRadius: 2,
              position: "sticky",
              top: 24,
            }}
          >
            <Typography
              fontWeight="bold"
              textAlign="center"
              mb={2}
              fontSize="1.1rem"
              color="#0d47a1"
              sx={{
                userSelect: "none",        // ✅ CHẶN BÔI ĐEN
                cursor: "default",
              }}
            >
              Câu hỏi
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 1.2,
                mb: !submitted ? 6 : 0,
              }}
            >
              {questions.map((q, index) => {
                const status = getQuestionStatus({
                  question: q,
                  userAnswer: answers[q.id],
                  submitted,
                });

                const active = currentIndex === index;

                let bgcolor = "#eeeeee";
                let border = "1px solid transparent";

                if (!submitted) {
                  if (status === "answered") bgcolor = "#bbdefb";
                } else {
                  if (status === "correct") bgcolor = "#c8e6c9"; // xanh lá
                  else if (status === "wrong") bgcolor = "#ffcdd2"; // đỏ
                  else {
                    bgcolor = "#fafafa";
                    border = "1px dashed #bdbdbd";
                  }
                }

                if (active) {
                  border = "2px solid #1976d2";
                }

                return (
                  <IconButton
                    key={q.id}
                    onClick={() => setCurrentIndex(index)}
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      bgcolor,
                      border,
                    }}
                  >
                    {index + 1}
                  </IconButton>
                );
              })}
            </Box>

            {!submitted && (
              <Button fullWidth variant="contained" onClick={handleSubmit}>
                Nộp bài
              </Button>
            )}

            <Button
              fullWidth
              variant="outlined"
              color="error"
              sx={{ mt: submitted ? 6 : 1.5 }}
              onClick={() => setOpenExitConfirm(true)}
            >
              Thoát
            </Button>
          </Card>
        </Box>
      )}
    </Box>

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
      //configData={configData}
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
