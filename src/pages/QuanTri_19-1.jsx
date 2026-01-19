import React, { useState, useEffect, useContext } from "react";
import {
  Box, Typography, Card, Stack, Select, MenuItem, FormControl, InputLabel,
  Button, TextField, IconButton, Checkbox, Snackbar, Alert, Dialog, DialogContent, Tooltip, 
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import CloseIcon from "@mui/icons-material/Close";

import { ConfigContext } from "../context/ConfigContext";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

// Import Backup & Restore Page
import BackupPage from "./BackupPage";
import RestorePage from "./RestorePage";

export default function QuanTri() {
  const account = localStorage.getItem("account") || "";
  const { config, setConfig } = useContext(ConfigContext);

  const [openChangePw, setOpenChangePw] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(config.lop || "");
  const [addingClass, setAddingClass] = useState(false);
  const [newClass, setNewClass] = useState("");
  const [timeInput, setTimeInput] = useState(config.timeLimit || 10);
  const [selectedYear, setSelectedYear] = useState(config.namHoc || "2025-2026");

  // ===== State mở Backup/Restore Dialog =====
  const [openBackup, setOpenBackup] = useState(false);
  const [openRestore, setOpenRestore] = useState(false);

  const heThong = config.heThong || "cu";

  // ===== Lấy danh sách lớp =====
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const snap = await getDoc(doc(db, "DANHSACHLOP", "list"));
        if (snap.exists()) {
          const list = snap.data()?.list || [];
          setClasses(list.sort());
          setSelectedClass(config.lop || list[0] || "");
        }
      } catch (err) {
        console.error("❌ Lỗi lấy danh sách lớp:", err);
      }
    };
    fetchClasses();
  }, [config.lop]);

  // ===== Cập nhật config =====
  const updateConfigField = async (field, value, saveToFirestore = false) => {
    setConfig({ [field]: value }, saveToFirestore);

    if (field === "lop") setSelectedClass(value);
    if (field === "timeLimit") setTimeInput(value);
    if (field === "namHoc") setSelectedYear(value);

    if (saveToFirestore) {
      try {
        await setDoc(
          doc(db, "CONFIG", "config"),
          { [field]: value },
          { merge: true }
        );
      } catch (err) {
        console.error(`❌ Lỗi cập nhật ${field} Firestore:`, err);
      }
    }
  };


  const handleTimeLimitChange = (value) => {
    const v = Math.max(1, Number(value));
    setTimeInput(v);
    updateConfigField("timeLimit", v, true);
  };

  // ===== Thêm / xóa lớp =====
  const handleAddClass = async () => {
    let input = newClass.trim();
    if (!input) return alert("Tên lớp không được để trống!");

    let newClasses = [];
    if (input.includes("->")) {
      const [start, end] = input.split("->").map(s => s.trim());
      if (/^\d+(\.\d+)?$/.test(start) && /^\d+(\.\d+)?$/.test(end)) {
        const [startMajor, startMinor = 0] = start.split(".").map(Number);
        const [endMajor, endMinor = 0] = end.split(".").map(Number);
        if (startMajor !== endMajor) return alert("Dãy lớp số phải cùng lớp cha!");
        for (let i = startMinor; i <= endMinor; i++) newClasses.push(`${startMajor}.${i}`);
      } else if (/^\d+[A-Z]$/i.test(start) && /^\d+[A-Z]$/i.test(end)) {
        const startNum = Number(start.match(/\d+/)[0]);
        const endNum = Number(end.match(/\d+/)[0]);
        const startChar = start.match(/[A-Z]$/i)[0].toUpperCase().charCodeAt(0);
        const endChar = end.match(/[A-Z]$/i)[0].toUpperCase().charCodeAt(0);
        if (startNum !== endNum) return alert("Dãy lớp chữ phải cùng lớp số!");
        for (let c = startChar; c <= endChar; c++) newClasses.push(`${startNum}${String.fromCharCode(c)}`);
      } else {
        return alert("Định dạng lớp không hợp lệ!");
      }
    } else {
      newClasses.push(input.replace(/([a-zA-Z])$/, (m) => m.toUpperCase()));
    }

    newClasses = newClasses.filter(c => !classes.includes(c));
    if (!newClasses.length) return alert("Tất cả lớp đã tồn tại!");

    const updated = [...classes, ...newClasses].sort();
    setClasses(updated);
    setSelectedClass(newClasses[0]);
    updateConfigField("lop", newClasses[0], true);

    try {
      await setDoc(doc(db, "DANHSACHLOP", "list"), { list: updated }, { merge: true });
    } catch (err) {
      console.error("❌ Lỗi lưu lớp vào Firestore:", err);
      alert("Lỗi lưu lớp vào Firestore!");
    }

    setNewClass("");
    setAddingClass(false);
  };

  const handleDeleteClass = async () => {
    const updated = classes.filter((c) => c !== selectedClass).sort();
    setClasses(updated);
    const nextClass = updated[0] || "";
    setSelectedClass(nextClass);
    updateConfigField("lop", nextClass, true);

    try {
      await setDoc(doc(db, "DANHSACHLOP", "list"), { list: updated }, { merge: true });
    } catch (err) {
      console.error("❌ Lỗi xóa lớp Firestore:", err);
      alert("Lỗi cập nhật Firestore khi xóa lớp!");
    }
  };

  // ===== Đổi mật khẩu =====
  const handleChangePassword = async () => {
    if (!newPw.trim()) {
      return setPwError("❌ Mật khẩu mới không được để trống!");
    }

    if (newPw !== confirmPw) {
      return setPwError("❌ Mật khẩu nhập lại không khớp!");
    }

    const account = localStorage.getItem("account");

    if (!account) {
      setPwError("❌ Không xác định được tài khoản!");
      return;
    }

    try {
      await setDoc(
        doc(db, "MATKHAU", account),
        { pass: newPw },
        { merge: true }
      );

      setOpenChangePw(false);
      setNewPw("");
      setConfirmPw("");
      setPwError("");

      setSnackbar({
        open: true,
        message: `✅ Đổi mật khẩu ${account} thành công!`,
        severity: "success",
      });
    } catch (err) {
      console.error(err);
      setPwError("❌ Lỗi khi lưu mật khẩu!");
      setSnackbar({
        open: true,
        message: "❌ Lỗi khi lưu mật khẩu!",
        severity: "error",
      });
    }
  };


  return (
    <Box sx={{ minHeight: "100vh", pt: 12, px: 3, backgroundColor: "#e3f2fd", display: "flex", justifyContent: "center" }}>
      <Stack spacing={2} sx={{ width: { xs: "95%", sm: "400px" } }}>
        <Card elevation={6} sx={{ p: 5, borderRadius: 3 }}>
          <Typography variant="h5" fontWeight="bold" color="primary" textAlign="center" mb={2}>
            CẤU HÌNH HỆ THỐNG
          </Typography>

          {/* ===== Account + Change PW ===== */}
          <Box display="flex" justifyContent="center" alignItems="center" mb={2} gap={1}>
            <Typography fontWeight="bold">{account || "Chưa đăng nhập"}</Typography>
            <IconButton sx={{ color: "orange" }} onClick={() => setOpenChangePw(true)}>
              <VpnKeyIcon />
            </IconButton>
          </Box>

          {/* ===== Năm học / Lớp / Thời gian / Checkboxes ===== */}
          <Stack spacing={2}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel id="namHoc-label">Năm học</InputLabel>
              <Select
                labelId="namHoc-label"
                value={selectedYear}
                label="Năm học"
                onChange={(e) => updateConfigField("namHoc", e.target.value, true)}
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const start = 2025 + i;
                  const end = start + 1;
                  const value = `${start}-${end}`;
                  return <MenuItem key={value} value={value}>{value}</MenuItem>;
                })}
              </Select>
            </FormControl>

            {/* Lớp */}
            <Stack direction="row" spacing={1} alignItems="center">
              <FormControl size="small" sx={{ flex: 1 }} variant="outlined">
                <InputLabel id="lop-label">Lớp</InputLabel>
                <Select
                  labelId="lop-label"
                  value={selectedClass}
                  label="Lớp"
                  onChange={(e) => updateConfigField("lop", e.target.value, true)}
                >
                  {classes.map(cls => <MenuItem key={cls} value={cls}>{cls}</MenuItem>)}
                </Select>
              </FormControl>
              <IconButton sx={{ color: "green" }} onClick={() => setAddingClass(true)}><Add /></IconButton>
              <IconButton sx={{ color: "red" }} onClick={handleDeleteClass}><Delete /></IconButton>
            </Stack>

            {addingClass && (
              <Stack direction="row" spacing={1}>
                <Tooltip title="Nhập 1 lớp hoặc dãy lớp liên tiếp, ví dụ: 4.1->4.6, 5A->5H, 3A" arrow placement="top">
                  <TextField
                    size="small"
                    label="Tên lớp"
                    value={newClass}
                    onChange={(e) => setNewClass(e.target.value)}
                    fullWidth
                  />
                </Tooltip>

                <Button variant="contained" size="small" sx={{ bgcolor: "green" }} onClick={handleAddClass}>Lưu</Button>
                <Button size="small" onClick={() => setAddingClass(false)}>Hủy</Button>
              </Stack>
            )}

            {/* Thời gian làm bài */}
            <Box display="flex" alignItems="center" gap={1}>
              <Typography sx={{ minWidth: 140 }}>Thời gian làm bài (phút)</Typography>
              <TextField
                type="number"
                size="small"
                value={timeInput}
                onChange={(e) => handleTimeLimitChange(e.target.value)}
                inputProps={{ min: 1, style: { width: 60, textAlign: "center" } }}
              />
            </Box>
            
            {/* ===== CHỌN HỆ THỐNG ===== */}
            <Box ml={2} mb={1}>
              <FormLabel sx={{ fontWeight: "bold" }}>Chọn hệ thống</FormLabel>
              <RadioGroup
                row
                value={config.heThong || "old"}
                onChange={(e) =>
                  updateConfigField("heThong", e.target.value, true)
                }
              >
                <FormControlLabel
                  value="old"
                  control={<Radio />}
                  label="Hệ thống cũ"
                />
                <FormControlLabel
                  value="new"
                  control={<Radio />}
                  label="Hệ thống mới"
                />
              </RadioGroup>

            </Box>

            {/* Checkboxes */}
            <Box ml={2} mt={1}>
              {/* 🔒 KHÓA HỆ THỐNG */}
              <Box display="flex" alignItems="center" gap={1}>
                <Checkbox
                  checked={config.locked}
                  onChange={(e) =>
                    updateConfigField("locked", e.target.checked, true)
                  }
                />
                <Typography fontWeight="bold" color="error">
                  Khóa hệ thống
                </Typography>
              </Box>
              
              {/*<Box display="flex" alignItems="center" gap={1}>
                <Checkbox checked={config.choXemDiem} onChange={(e) => updateConfigField("choXemDiem", e.target.checked, true)} />
                <Typography>Cho xem điểm</Typography>
              </Box>*/}
              
              <Box display="flex" alignItems="center" gap={1}>
                <Checkbox checked={config.choXemDapAn} onChange={(e) => updateConfigField("choXemDapAn", e.target.checked, true)} />
                <Typography>Cho xem đáp án</Typography>
              </Box>
            </Box>

            {/* ===== Nút Sao lưu / Phục hồi ===== */}
            <Stack direction="row" spacing={2} mt={2} justifyContent="center">
              <Button variant="contained" color="primary" onClick={() => setOpenBackup(true)}>Sao lưu</Button>
              <Button variant="outlined" color="secondary" onClick={() => setOpenRestore(true)}>Phục hồi</Button>
            </Stack>
          </Stack>
        </Card>
      </Stack>

      {/* ===== Snackbar ===== */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>

      {/* ===== Dialog đổi mật khẩu ===== */}
      <Dialog open={openChangePw} onClose={() => setOpenChangePw(false)} disableEscapeKeyDown maxWidth="xs" fullWidth>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "#1976d2", color: "#fff", px: 2, py: 1.2 }}>
          <Typography variant="subtitle1" fontWeight="bold">ĐỔI MẬT KHẨU</Typography>
          <IconButton onClick={() => setOpenChangePw(false)} sx={{ color: "#fff" }}><CloseIcon fontSize="small" /></IconButton>
        </Box>
        <DialogContent>
          <Stack spacing={2}>
            <TextField label="Mật khẩu mới" type="password" fullWidth size="small" value={newPw} onChange={e => setNewPw(e.target.value)} />
            <TextField label="Nhập lại mật khẩu" type="password" fullWidth size="small" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
            {pwError && <Typography color="error" fontWeight={600}>{pwError}</Typography>}
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button onClick={() => setOpenChangePw(false)}>Hủy</Button>
              <Button variant="contained" onClick={handleChangePassword}>Lưu</Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* ===== Backup Page Dialog ===== */}
      <BackupPage open={openBackup} onClose={() => setOpenBackup(false)} />

      {/* ===== Restore Page Dialog ===== */}
      <RestorePage open={openRestore} onClose={() => setOpenRestore(false)} />
    </Box>
  );
}
