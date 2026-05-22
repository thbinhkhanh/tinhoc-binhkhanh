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
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
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

  const heThong = config.heThong || "old";

  useEffect(() => {
    const ref = doc(db, "CONFIG", "config");

    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setConfig(snap.data());
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (config?.namHoc) setSelectedYear(config.namHoc);
  }, [config?.namHoc]);

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
  <Box
    sx={{
      minHeight: "100vh",
      background: "#f1f5f9",
      py: 10,
      px: 2,
      display: "flex",
      justifyContent: "center",
      fontFamily:
        '"Roboto","Inter","Arial",sans-serif',
    }}
  >
    <Box
      sx={{
        width: "100%",
        maxWidth: 450,
      }}
    >
      <Card
        elevation={0}
        sx={{
          borderRadius: "14px",
          overflow: "hidden",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          boxShadow:
            "0 10px 35px rgba(0,0,0,0.12)",
        }}
      >
        {/* ===== HEADER ===== */}
        <Box
          sx={{
            px: 3,
            py: 1.5,
            background: "#1976d2",
            color: "#fff",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography
                sx={{
                  fontSize: 17,
                  fontWeight: 700,
                }}
              >
                Cấu hình hệ thống
              </Typography>
            </Box>

            <Tooltip title="Đổi mật khẩu">
              <IconButton
                onClick={() =>
                  setOpenChangePw(true)
                }
                sx={{
                  color: "#fff",
                  bgcolor:
                    "rgba(255,255,255,0.12)",

                  "&:hover": {
                    bgcolor:
                      "rgba(255,255,255,0.22)",
                  },
                }}
              >
                <VpnKeyIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* ===== CONTENT ===== */}
        <Box
          sx={{
            px: 3,
            py: 2.5,
          }}
        >
          <Stack spacing={2}>
            {/* ACCOUNT */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: "5px",
                bgcolor: "#fff",
                border:
                  "1px solid #e2e8f0",
              }}
            >
              <Typography
                sx={{
                  fontSize: 13,
                  color: "#64748b",
                  mb: 0.5,
                }}
              >
                Tài khoản đăng nhập
              </Typography>

              <Typography
                sx={{
                  fontWeight: 700,
                  color: "#1e293b",
                }}
              >
                {account ||
                  "Chưa đăng nhập"}
              </Typography>
            </Box>

            {/* NĂM HỌC */}
            <FormControl
              fullWidth
              size="small"
            >
              <InputLabel>
                Năm học
              </InputLabel>

              <Select
                value={selectedYear}
                label="Năm học"
                onChange={(e) =>
                  updateConfigField(
                    "namHoc",
                    e.target.value,
                    true
                  )
                }
                sx={{
                  bgcolor: "#fff",
                  borderRadius: "5px",

                  "& .MuiOutlinedInput-notchedOutline":
                    {
                      borderColor:
                        "#dbe2ea",
                    },

                  "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                    {
                      borderColor:
                        "#1976d2",
                      borderWidth: 2,
                    },
                }}
              >
                {Array.from(
                  { length: 5 },
                  (_, i) => {
                    const start =
                      2025 + i;

                    const end =
                      start + 1;

                    const value = `${start}-${end}`;

                    return (
                      <MenuItem
                        key={value}
                        value={value}
                      >
                        {value}
                      </MenuItem>
                    );
                  }
                )}
              </Select>
            </FormControl>

            {/* QUẢN LÝ LỚP */}
            <Box
              sx={{
                p: 1.6,
                borderRadius: "5px",
                bgcolor: "#fff",
                border:
                  "1px solid #e2e8f0",
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 700,
                  mb: 1.5,
                  color: "#1e293b",
                }}
              >
                Quản lý lớp
              </Typography>

              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
              >
                <FormControl
                  size="small"
                  fullWidth
                >
                  <InputLabel>
                    Lớp
                  </InputLabel>

                  <Select
                    value={selectedClass}
                    label="Lớp"
                    onChange={(e) =>
                      updateConfigField(
                        "lop",
                        e.target.value,
                        true
                      )
                    }
                    sx={{
                      bgcolor: "#fff",
                      borderRadius:
                        "5px",

                      "& .MuiOutlinedInput-notchedOutline":
                        {
                          borderColor:
                            "#dbe2ea",
                        },

                      "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                        {
                          borderColor:
                            "#1976d2",
                          borderWidth: 2,
                        },
                    }}
                  >
                    {classes.map(
                      (cls) => (
                        <MenuItem
                          key={cls}
                          value={cls}
                        >
                          {cls}
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>

                <Tooltip title="Thêm lớp">
                  <IconButton
                    onClick={() =>
                      setAddingClass(true)
                    }
                    sx={{
                      color: "#fff",
                      bgcolor: "#22c55e",

                      "&:hover": {
                        bgcolor:
                          "#16a34a",
                      },
                    }}
                  >
                    <Add />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Xóa lớp">
                  <IconButton
                    onClick={
                      handleDeleteClass
                    }
                    sx={{
                      color: "#fff",
                      bgcolor: "#ef4444",

                      "&:hover": {
                        bgcolor:
                          "#dc2626",
                      },
                    }}
                  >
                    <Delete />
                  </IconButton>
                </Tooltip>
              </Stack>

              {addingClass && (
                <Stack
                  direction={{
                    xs: "column",
                    sm: "row",
                  }}
                  spacing={1}
                  mt={1.5}
                >
                  <Tooltip
                    title="Ví dụ: 4.1->4.6, 5A->5H"
                    arrow
                  >
                    <TextField
                      size="small"
                      label="Tên lớp"
                      placeholder="VD: 3A->3K"
                      value={newClass}
                      onChange={(e) =>
                        setNewClass(
                          e.target.value
                        )
                      }
                      fullWidth
                    />
                  </Tooltip>

                  <Button
                    variant="contained"
                    onClick={
                      handleAddClass
                    }
                    sx={{
                      textTransform:
                        "none",
                      borderRadius:
                        "12px",
                      fontWeight: 700,
                      boxShadow:
                        "none",
                    }}
                  >
                    Lưu
                  </Button>

                  <Button
                    onClick={() =>
                      setAddingClass(
                        false
                      )
                    }
                    sx={{
                      textTransform:
                        "none",
                    }}
                  >
                    Hủy
                  </Button>
                </Stack>
              )}
            </Box>

            {/* TÙY CHỌN */}
            <Box
              sx={{
                p: 1.6,
                borderRadius: "5px",
                bgcolor: "#fff",
                border:
                  "1px solid #e2e8f0",
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 700,
                  mb: 1,
                  color: "#1e293b",
                }}
              >
                Tùy chọn hệ thống
              </Typography>

              <Stack spacing={0.5}>
                <Box
                  display="flex"
                  alignItems="center"
                >
                  <Checkbox
                    checked={
                      config.locked ||
                      false
                    }
                    onChange={(e) =>
                      updateConfigField(
                        "locked",
                        e.target.checked,
                        true
                      )
                    }
                    sx={{
                      color:
                        "#ef4444",

                      "&.Mui-checked":
                        {
                          color:
                            "#ef4444",
                        },
                    }}
                  />

                  <Typography
                    fontWeight={700}
                    color="#ef4444"
                  >
                    Khóa hệ thống
                  </Typography>
                </Box>

                <Box
                  display="flex"
                  alignItems="center"
                >
                  <Checkbox
                    checked={
                      config.choXemDapAn
                    }
                    onChange={(e) =>
                      updateConfigField(
                        "choXemDapAn",
                        e.target.checked,
                        true
                      )
                    }
                  />

                  <Typography>
                    Cho xem đáp án
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* ACTIONS */}
            <Stack
              direction="row"
              spacing={1.5}
            >
              <Button
                fullWidth
                variant="contained"
                onClick={() =>
                  setOpenBackup(true)
                }
                sx={{
                  textTransform:
                    "none",
                  borderRadius:
                    "12px",
                  py: 1,
                  fontWeight: 700,
                  boxShadow: "none",
                }}
              >
                Sao lưu
              </Button>

              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                onClick={() =>
                  setOpenRestore(true)
                }
                sx={{
                  textTransform:
                    "none",
                  borderRadius:
                    "12px",
                  py: 1,
                  fontWeight: 700,
                }}
              >
                Phục hồi
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Card>
    </Box>

    {/* ===== Snackbar ===== */}
    <Snackbar
      open={snackbar.open}
      autoHideDuration={4000}
      onClose={() =>
        setSnackbar((s) => ({
          ...s,
          open: false,
        }))
      }
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
    >
      <Alert
        severity={snackbar.severity}
        variant="filled"
      >
        {snackbar.message}
      </Alert>
    </Snackbar>

    {/* ===== Dialog đổi mật khẩu ===== */}
    <Dialog
      open={openChangePw}
      onClose={() =>
        setOpenChangePw(false)
      }
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "14px",
        },
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 1.5,
          background: "#1976d2",
          color: "#fff",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            Đổi mật khẩu
          </Typography>

          <IconButton
            onClick={() =>
              setOpenChangePw(false)
            }
            sx={{
              color: "#fff",
              bgcolor:
                "rgba(255,255,255,0.12)",

              "&:hover": {
                bgcolor:
                  "rgba(255,255,255,0.22)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>

      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={2}>
          <TextField
            label="Mật khẩu mới"
            type="password"
            fullWidth
            size="small"
            value={newPw}
            onChange={(e) =>
              setNewPw(
                e.target.value
              )
            }
          />

          <TextField
            label="Nhập lại mật khẩu"
            type="password"
            fullWidth
            size="small"
            value={confirmPw}
            onChange={(e) =>
              setConfirmPw(
                e.target.value
              )
            }
          />

          {pwError && (
            <Typography
              color="error"
              fontWeight={600}
            >
              {pwError}
            </Typography>
          )}

          <Stack
            direction="row"
            justifyContent="flex-end"
            spacing={1}
          >
            <Button
              onClick={() =>
                setOpenChangePw(false)
              }
              sx={{
                textTransform:
                  "none",
              }}
            >
              Hủy
            </Button>

            <Button
              variant="contained"
              onClick={
                handleChangePassword
              }
              sx={{
                textTransform:
                  "none",
                borderRadius:
                  "12px",
                fontWeight: 700,
                boxShadow: "none",
              }}
            >
              Lưu
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>

    {/* ===== Backup ===== */}
    <BackupPage
      open={openBackup}
      onClose={() =>
        setOpenBackup(false)
      }
    />

    {/* ===== Restore ===== */}
    <RestorePage
      open={openRestore}
      onClose={() =>
        setOpenRestore(false)
      }
    />
  </Box>
);
}
