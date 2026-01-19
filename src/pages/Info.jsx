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

  // ✅ Nhận khối từ menu
  const [khoi, setKhoi] = useState("Khối 3");

  // ⭐ NEW: nhận hệ thống + target
  const heThong = location.state?.heThong || "old";
  const targetNew = location.state?.target || null;

  useEffect(() => {
    if (location.state?.khoi) {
      setKhoi(location.state.khoi);
    }
  }, [location.state?.khoi]);

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

  const handleLogin = async () => {
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
      lop
    };

    // 1️⃣ Cập nhật context
    await setConfig(newUserInfo, false);

    // 2️⃣ Điều hướng OLD / NEW
    const soKhoi = khoi.replace("Khối ", "");

    if (heThong === "new" && targetNew) {
      // ⭐ NEW
      navigate(targetNew, {
        state: { fullname, lop, khoi }
      });
    } else {
      // 🔹 OLD (giữ nguyên)
      navigate(`/lop${soKhoi}`, {
        state: { fullname, lop, khoi }
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
                onChange={(e) => setKhoi(e.target.value)}
              >
                {["Khối 1", "Khối 2", "Khối 3", "Khối 4", "Khối 5"].map(k => (
                  <MenuItem key={k} value={k}>
                    {k}
                  </MenuItem>
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
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />

            <Button
              variant="contained"
              fullWidth
              sx={{ textTransform: "none", fontSize: "1rem" }}
              onClick={handleLogin}
            >
              ĐĂNG NHẬP
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
