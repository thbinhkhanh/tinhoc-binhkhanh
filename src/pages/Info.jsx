import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Card,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";

import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

import SchoolIcon from "@mui/icons-material/School";
import { useNavigate, useLocation } from "react-router-dom";
import { ConfigContext } from "../context/ConfigContext";

export default function Info() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setConfig } = useContext(ConfigContext);

  const [fullname, setFullname] = useState("");
  const [lop, setLop] = useState("");
  const [filteredClasses, setFilteredClasses] = useState([]);

 
// Lấy lop từ query nếu có
const searchParams = new URLSearchParams(location.search);
const lopHoc = searchParams.get("lop"); // ví dụ "5"

// Fallback từ localStorage
const savedStudent = JSON.parse(localStorage.getItem("studentInfo") || "{}");
const lastExam = JSON.parse(localStorage.getItem("lastExam") || "{}");


// Khởi tạo ban đầu: query → state → localStorage → "Khối 3"
const initialKhoi =
  lastExam.khoi ||
  (lopHoc ? `Khối ${lopHoc}` : null) ||
  location.state?.khoi ||
  savedStudent.khoi ||
  "Khối 3";


const [khoi, setKhoi] = useState(initialKhoi);
const disableKhoi = location.state?.disableKhoi === true;

// ⭐ Đồng bộ khi mở link mới hoặc state.khoi thay đổi
useEffect(() => {
  const params = new URLSearchParams(location.search);
  const lop = params.get("lop");

  let khoiFinal = null;
  if (lop) {
    khoiFinal = `Khối ${lop}`;
  } else if (location.state?.khoi) {
    khoiFinal = location.state.khoi;
  } else if (savedStudent.khoi) {
    khoiFinal = savedStudent.khoi;   // ✅ thêm nhánh này
  }

  if (khoiFinal) {
    setKhoi(khoiFinal);

    // Luôn cập nhật localStorage với khối hiện tại
    const saved = JSON.parse(localStorage.getItem("studentInfo") || "{}");
    localStorage.setItem(
      "studentInfo",
      JSON.stringify({ ...saved, khoi: khoiFinal })
    );
  }
}, [location.search, location.state?.khoi]);

  const [errorMsg, setErrorMsg] = useState("");

  // 🔹 Sinh danh sách lớp theo khối
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const snap = await getDoc(doc(db, "DANHSACHLOP", "list"));
        if (snap.exists()) {
          const allClasses = snap.data()?.list || [];

          if (khoi) {
            const soKhoi = khoi.replace("Khối ", "");
            const classList = allClasses.filter(c =>
              c.startsWith(`${soKhoi}`)
            );
            setFilteredClasses(classList);
            setLop(classList[0] || "");
          } else {
            setFilteredClasses(allClasses);
            setLop(allClasses[0] || "");
          }
        }
      } catch (err) {
        console.error("❌ Lỗi lấy lớp từ Firestore:", err);
        setFilteredClasses([]);
        setLop("");
      }
    };

    fetchClasses();
  }, [khoi]);

  const handleStart = async () => {
    if (!fullname.trim()) {
      setErrorMsg("❌ Vui lòng nhập Họ và tên!");
      return;
    }
    if (!lop) {
      setErrorMsg("❌ Vui lòng chọn lớp!");
      return;
    }

    setErrorMsg("");

    const studentId = `HS${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`;

    const newUserInfo = {
      studentId,
      fullname,
      khoi,
      lop,
    };

    // 🔥 LOG để kiểm tra trước khi lưu context
    console.log("🔥 INFO LOGIN:", newUserInfo);

    // ✅ Lưu vào Context (KHÔNG cần localStorage nữa nếu bạn muốn sạch)
    await setConfig(newUserInfo, false);

    // 🔥 LOG SAU KHI SET
    console.log("✅ CONTEXT UPDATED (expected):", newUserInfo);

    // điều hướng
    if (location.state?.target) {
      navigate(location.state.target, {
        state: { fromInfo: true },
      });
    } else {
      console.log("🚀 NAVIGATE /trac-nghiem?lop =", lop);

      navigate(`/trac-nghiem?lop=${lop}`, {
        state: { fromInfo: true },
      });
    }
  };



  return (
    <Box
      sx={{
        minHeight: "100vh",
        pt: 12,
        px: 3,
        backgroundColor: "#e3f2fd",
        display: "flex",
        justifyContent: "center"
      }}
    >
      <Box sx={{ width: { xs: "95%", sm: 400 }, mx: "auto" }}>
        <Card elevation={10} sx={{ p: 3, borderRadius: 4, pt: 4 }}>
          <Stack spacing={3} alignItems="center">
            <SchoolIcon sx={{ fontSize: 60, color: "#1976d2" }} />

            <Typography variant="h5" fontWeight="bold" color="primary">
              THÔNG TIN HỌC SINH
            </Typography>

            {/* Khối */}
            <FormControl fullWidth size="small">
              <InputLabel>Khối</InputLabel>
              <Select
                value={khoi}
                label="Khối"
                onChange={(e) => {
                  if (!disableKhoi) setKhoi(e.target.value);
                }}
                disabled={disableKhoi}
              >
                {["Khối 1", "Khối 2", "Khối 3", "Khối 4", "Khối 5"].map(k => (
                  <MenuItem key={k} value={k}>{k}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Lớp */}
            <FormControl fullWidth size="small">
              <InputLabel>Lớp</InputLabel>
              <Select
                value={lop}
                label="Lớp"
                onChange={(e) => setLop(e.target.value)}
              >
                {filteredClasses.map(cl => (
                  <MenuItem key={cl} value={cl}>
                    {cl}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Họ và tên */}
            <TextField
              label="Họ và tên"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              fullWidth
              size="small"
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
            />

            <Button
              variant="contained"
              fullWidth
              sx={{ textTransform: "none", fontSize: "1rem" }}
              onClick={handleStart}
            >
              BẮT ĐẦU LÀM BÀI
            </Button>

            {errorMsg && (
              <Typography color="error" variant="body2">
                {errorMsg}
              </Typography>
            )}
          </Stack>
        </Card>
      </Box>
    </Box>
  );
}
