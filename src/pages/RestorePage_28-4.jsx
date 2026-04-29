import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Stack,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  Typography,
  Snackbar,
  Alert,
  Divider,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RestoreIcon from "@mui/icons-material/Restore";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

/* ================= BACKUP KEYS (GIỐNG BACKUP) ================= */
const BACKUP_KEYS = [
  { key: "CONFIG", label: "Cấu hình hệ thống", group: "Hệ thống" },
  { key: "MATKHAU", label: "Mật khẩu tài khoản", group: "Hệ thống" },

  { key: "DANHSACHLOP", label: "Danh sách lớp", group: "Dữ liệu" },
  { key: "DATA", label: "Kết quả đánh giá", group: "Dữ liệu" },

  { key: "TENBAI_Lop1", label: "Bài lớp 1", group: "Bài học" },
  { key: "TENBAI_Lop2", label: "Bài lớp 2", group: "Bài học" },
  { key: "TENBAI_Lop3", label: "Bài lớp 3", group: "Bài học" },
  { key: "TENBAI_Lop4", label: "Bài lớp 4", group: "Bài học" },
  { key: "TENBAI_Lop5", label: "Bài lớp 5", group: "Bài học" },

  { key: "TRACNGHIEM1", label: "Trắc nghiệm lớp 1", group: "Trắc nghiệm" },
  { key: "TRACNGHIEM2", label: "Trắc nghiệm lớp 2", group: "Trắc nghiệm" },
  { key: "TRACNGHIEM3", label: "Trắc nghiệm lớp 3", group: "Trắc nghiệm" },
  { key: "TRACNGHIEM4", label: "Trắc nghiệm lớp 4", group: "Trắc nghiệm" },
  { key: "TRACNGHIEM5", label: "Trắc nghiệm lớp 5", group: "Trắc nghiệm" },
];

export default function RestorePage({ open, onClose }) {
  const fileInputRef = useRef(null);

  const [restoreOptions, setRestoreOptions] = useState({});
  const [disabledOptions, setDisabledOptions] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  /* ================= INIT ================= */
  useEffect(() => {
    if (!open) return;
    const initChecked = {};
    const initDisabled = {};
    BACKUP_KEYS.forEach(({ key }) => {
      initChecked[key] = false;
      initDisabled[key] = true;
    });
    setRestoreOptions(initChecked);
    setDisabledOptions(initDisabled);
    setSelectedFile(null);
    setProgress(0);
    setLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [open]);

  const toggleOption = (key) => {
    setRestoreOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  /* ================= FILE LOAD ================= */
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);

    try {
      const json = JSON.parse(await file.text());
      const checked = {};
      const disabled = {};

      BACKUP_KEYS.forEach(({ key }) => {
        const hasData = json[key] && Object.keys(json[key]).length > 0;
        checked[key] = hasData;
        disabled[key] = !hasData;
      });

      setRestoreOptions(checked);
      setDisabledOptions(disabled);
    } catch {
      setSnackbar({
        open: true,
        severity: "error",
        message: "❌ File backup không hợp lệ",
      });
    }
  };

  /* ================= RESTORE ================= */
  const handleRestore = async () => {
    const selectedKeys = Object.keys(restoreOptions).filter(
      (k) => restoreOptions[k]
    );

    if (!selectedFile) {
      setSnackbar({
        open: true,
        severity: "warning",
        message: "Vui lòng chọn file phục hồi",
      });
      return;
    }

    if (selectedKeys.length === 0) {
      setSnackbar({
        open: true,
        severity: "warning",
        message: "Vui lòng chọn dữ liệu phục hồi",
      });
      return;
    }

    try {
      setLoading(true);
      setProgress(0);

      const data = JSON.parse(await selectedFile.text());

      // ===== Đếm tổng document =====
      let total = 0;
      selectedKeys.forEach((key) => {
        if (key === "DATA") {
          Object.values(data.DATA || {}).forEach((cls) => {
            total += Object.keys(cls.HOCSINH || {}).length;
          });
        } else {
          total += Object.keys(data[key] || {}).length;
        }
      });

      let done = 0;

      // ===== Restore =====
      for (const key of selectedKeys) {
        if (key === "DATA") {
          for (const classKey of Object.keys(data.DATA || {})) {
            const hs = data.DATA[classKey].HOCSINH || {};
            for (const id of Object.keys(hs)) {
              await setDoc(
                doc(db, "DATA", classKey, "HOCSINH", id),
                hs[id],
                { merge: true }
              );
              done++;
              setProgress(Math.round((done / total) * 100));
            }
          }
        } else {
          for (const id of Object.keys(data[key] || {})) {
            await setDoc(doc(db, key, id), data[key][id], {
              merge: true,
            });
            done++;
            setProgress(Math.round((done / total) * 100));
          }
        }
      }

      setSnackbar({
        open: true,
        severity: "success",
        message: "✅ Phục hồi dữ liệu thành công",
      });
      onClose();
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        severity: "error",
        message: "❌ Lỗi khi phục hồi dữ liệu",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  const renderGroup = (title, keys) => (
    <>
      <Typography
        sx={{ fontSize: "1rem", fontWeight: "bold", color: "error.main" }}
      >
        {title}
      </Typography>

      <Box
        sx={{
          ml: 3,
          display: "flex",
          flexDirection: "column",   // 👈 ÉP XUỐNG HÀNG
        }}
      >
        {keys.map((key) => (
          <FormControlLabel
            key={key}
            sx={{
              width: "100%",        // 👈 mỗi checkbox chiếm trọn 1 hàng
              m: 0,
            }}
            control={
              <Checkbox
                checked={restoreOptions[key] || false}
                disabled={disabledOptions[key]}
                onChange={() => toggleOption(key)}
              />
            }
            label={BACKUP_KEYS.find((b) => b.key === key)?.label}
          />
        ))}
      </Box>

      <Divider sx={{ mt: 1, mb: 1 }} />
    </>
  );


  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 3,
            bgcolor: "#fff",
            boxShadow: "0 4px 12px rgba(33,150,243,0.15)",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Box
            sx={{
              bgcolor: "#42a5f5",
              color: "#fff",
              borderRadius: "50%",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mr: 1.5,
              fontSize: 18,
            }}
          >
            ♻️
          </Box>
          <DialogTitle sx={{ p: 0, fontWeight: "bold", color: "#1565c0" }}>
            PHỤC HỒI DỮ LIỆU
          </DialogTitle>
          <IconButton
            onClick={onClose}
            sx={{
              ml: "auto",
              color: "#f44336",
              "&:hover": { bgcolor: "rgba(244,67,54,0.1)" },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Button
          variant="outlined"
          startIcon={<UploadFileIcon />}
          onClick={() => fileInputRef.current.click()}
          sx={{ mb: 1 }}
        >
          Chọn file phục hồi (.json)
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept=".json"
          onChange={handleFileChange}
        />

        {selectedFile && (
          <Typography sx={{ color: "red", fontWeight: "bold", mb: 1 }}>
            📄 {selectedFile.name}
          </Typography>
        )}

        <DialogContent dividers>
          <Stack spacing={1}>
            {renderGroup("Hệ thống", ["CONFIG", "MATKHAU"])}
            {renderGroup("Dữ liệu", ["DANHSACHLOP", "DATA"])}
            {renderGroup("Bài học", [
              "TENBAI_Lop1",
              "TENBAI_Lop2",
              "TENBAI_Lop3",
              "TENBAI_Lop4",
              "TENBAI_Lop5",
            ])}
            {renderGroup("Trắc nghiệm", [
              "TRACNGHIEM1",
              "TRACNGHIEM2",
              "TRACNGHIEM3",
              "TRACNGHIEM4",
              "TRACNGHIEM5",
            ])}
          </Stack>
        </DialogContent>

        {loading && (
          <>
            <Box sx={{ width: "50%", mx: "auto", mt: 3 }}>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
            <Typography
              align="center"
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              Đang phục hồi... {progress}%
            </Typography>
          </>
        )}

        <DialogActions>
          <Button onClick={onClose}>Hủy</Button>
          <Button
            variant="contained"
            startIcon={<RestoreIcon />}
            onClick={handleRestore}
            disabled={loading}
          >
            Phục hồi
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
