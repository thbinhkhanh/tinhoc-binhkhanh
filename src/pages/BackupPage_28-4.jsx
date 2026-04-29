import React, { useState, useEffect } from "react"; 
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  LinearProgress,
  Stack,
  Typography,
  Snackbar,
  Alert,
  Divider,
} from "@mui/material";
import BackupIcon from "@mui/icons-material/Backup";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

// ====== Cấu hình backup ======
const BACKUP_KEYS = [
  { key: "CONFIG", label: "Cấu hình hệ thống" },
  { key: "MATKHAU", label: "Mật khẩu tài khoản" },

  // ===== Nhóm Dữ liệu =====
  { key: "DANHSACHLOP", label: "Danh sách lớp", group: "Dữ liệu" },
  { key: "DATA", label: "Kết quả đánh giá", group: "Dữ liệu" },

  // ===== Nhóm Tên bài học =====
  { key: "TENBAI_Lop1", label: "Bài lớp 1", group: "Bài học" },
  { key: "TENBAI_Lop2", label: "Bài lớp 2", group: "Bài học" },
  { key: "TENBAI_Lop3", label: "Bài lớp 3", group: "Bài học" },
  { key: "TENBAI_Lop4", label: "Bài lớp 4", group: "Bài học" },
  { key: "TENBAI_Lop5", label: "Bài lớp 5", group: "Bài học" },

  // ===== Nhóm Trắc nghiệm =====
  { key: "TRACNGHIEM1", label: "Trắc nghiệm lớp 1", group: "Trắc nghiệm" },
  { key: "TRACNGHIEM2", label: "Trắc nghiệm lớp 2", group: "Trắc nghiệm" },
  { key: "TRACNGHIEM3", label: "Trắc nghiệm lớp 3", group: "Trắc nghiệm" },
  { key: "TRACNGHIEM4", label: "Trắc nghiệm lớp 4", group: "Trắc nghiệm" },
  { key: "TRACNGHIEM5", label: "Trắc nghiệm lớp 5", group: "Trắc nghiệm" },
];


export default function BackupPage({ open, onClose }) {
  // ================== STATE ==================
const [backupOptions, setBackupOptions] = useState({});
const [loading, setLoading] = useState(false);
const [progress, setProgress] = useState(0);
const [snackbar, setSnackbar] = useState({
  open: false,
  message: "",
  severity: "success",
});
const [fakeProgress, setFakeProgress] = useState(null);

// ================== INIT CHECKBOX ==================
useEffect(() => {
  const options = {};
  BACKUP_KEYS.forEach(({ key }) => {
    options[key] = true; // check hết
  });
  setBackupOptions(options);
}, []);

const toggleOption = (key) => {
  setBackupOptions((prev) => ({ ...prev, [key]: !prev[key] }));
};

// ================== FAKE PROGRESS (QUAN TRỌNG) ==================
useEffect(() => {
  if (!loading) return;

  const timer = setInterval(() => {
    setProgress((prev) => {
      if (prev < 90) {
        return prev + Math.random() * 2; // tăng chậm – mượt
      }
      return prev;
    });
  }, 200);

  setFakeProgress(timer);

  return () => {
    clearInterval(timer);
    setFakeProgress(null);
  };
}, [loading]);

// ================== EXPORT FILE ==================
const exportBackupToJson = (data, backupOptions) => {
  if (!data || Object.keys(data).length === 0) return;

  const selectedCollections = Object.keys(backupOptions).filter(
    (k) => backupOptions[k]
  );
  const collectionsName =
    selectedCollections.length === BACKUP_KEYS.length
      ? "full"
      : selectedCollections.join("_");

  const now = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  const timestamp = `${pad(now.getDate())}-${pad(
    now.getMonth() + 1
  )}-${now.getFullYear().toString().slice(-2)} (${pad(
    now.getHours()
  )}:${pad(now.getMinutes())}:${pad(now.getSeconds())})`;

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Backup_TracNghiem_BK_${collectionsName}_${timestamp}.json`;
  a.click();
};

// ================== FETCH BACKUP ==================
const fetchAllBackup = async (onProgress, selectedCollections) => {
  try {
    const backupData = {};
    let progressCount = 0;

    const hasDATA = selectedCollections.includes("DATA");
    const otherCollections = selectedCollections.filter((c) => c !== "DATA");

    const DATA_WEIGHT = hasDATA ? 80 : 0;
    const OTHERS_WEIGHT = hasDATA ? 20 : 100;
    const otherStep =
      otherCollections.length > 0
        ? OTHERS_WEIGHT / otherCollections.length
        : 0;

    // ===== Backup các collection khác =====
    for (const colName of otherCollections) {
      const snap = await getDocs(collection(db, colName));
      if (!snap.empty) backupData[colName] = {};
      snap.forEach((d) => (backupData[colName][d.id] = d.data()));

      progressCount += otherStep;
      onProgress((prev) =>
        Math.max(prev, Math.round(progressCount))
      );
    }

    // ===== Backup DATA =====
    if (hasDATA) {
      backupData.DATA = {};

      const listSnap = await getDocs(collection(db, "DANHSACHLOP"));
      const listDoc = listSnap.docs.find((d) => d.id === "list");
      const classList = listDoc?.data()?.list || [];

      if (classList.length === 0) return backupData;

      const perClassStep = DATA_WEIGHT / classList.length;

      // đọc DATA song song
      const tasks = classList.map(async (lop) => {
        const classKey = lop.replace(".", "_");
        const hsSnap = await getDocs(
          collection(db, "DATA", classKey, "HOCSINH")
        );
        if (hsSnap.empty) return null;

        const hsData = {};
        hsSnap.forEach((hs) => (hsData[hs.id] = hs.data()));
        return { classKey, hsData };
      });

      const results = await Promise.all(tasks);

      for (const result of results) {
        progressCount += perClassStep;
        onProgress((prev) =>
          Math.max(prev, Math.round(progressCount))
        );

        if (!result) continue;
        backupData.DATA[result.classKey] = {
          HOCSINH: result.hsData,
        };
      }

      if (Object.keys(backupData.DATA).length === 0) {
        delete backupData.DATA;
      }
    }

    onProgress(100);
    return backupData;
  } catch (err) {
    console.error("❌ Lỗi backup:", err);
    return {};
  }
};

// ================== HANDLE BACKUP ==================
const handleBackup = async () => {
  const selected = Object.keys(backupOptions).filter(
    (k) => backupOptions[k]
  );
  if (selected.length === 0) {
    setSnackbar({
      open: true,
      severity: "warning",
      message: "Vui lòng chọn ít nhất một dữ liệu để sao lưu",
    });
    return;
  }

  try {
    setLoading(true);
    setProgress(5); // kickstart

    const data = await fetchAllBackup(setProgress, selected);

    setProgress(95); // export
    exportBackupToJson(data, backupOptions);

    setProgress(100);
    setSnackbar({
      open: true,
      severity: "success",
      message: "✅ Sao lưu dữ liệu thành công",
    });
    onClose();
  } catch (err) {
    console.error(err);
    setSnackbar({
      open: true,
      severity: "error",
      message: "❌ Lỗi khi sao lưu dữ liệu",
    });
  } finally {
    setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 500);
  }
};


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
      {/* Header */}
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
            fontWeight: "bold",
            fontSize: 18,
          }}
        >
          🗄️
        </Box>
        <DialogTitle
          sx={{ p: 0, fontWeight: "bold", color: "#1565c0", flex: 1 }}
        >
          SAO LƯU DỮ LIỆU
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

      {/* Content */}
      <DialogContent dividers>
        <Stack spacing={1}>
          {/* Hệ thống */}
          <Typography sx={{ fontSize: "1rem", fontWeight: "bold", color: "error.main" }}>
            Hệ thống
          </Typography>
          <Box sx={{ ml: 3, display: "flex", flexDirection: "column" }}>
            {["CONFIG", "MATKHAU"].map((key) => (
              <FormControlLabel
                key={key}
                control={
                  <Checkbox
                    checked={backupOptions[key] || false}
                    onChange={() => toggleOption(key)}
                  />
                }
                label={BACKUP_KEYS.find((b) => b.key === key)?.label}
              />
            ))}
          </Box>

          <Divider sx={{ mt: 1, mb: 1 }} />

          {/* Dữ liệu */}
          <Typography sx={{ fontSize: "1rem", fontWeight: "bold", color: "error.main" }}>
            Dữ liệu
          </Typography>
          <Box sx={{ ml: 3, display: "flex", flexDirection: "column" }}>
            {["DANHSACHLOP", "DATA"].map((key) => (
              <FormControlLabel
                key={key}
                control={
                  <Checkbox
                    checked={backupOptions[key] || false}
                    onChange={() => toggleOption(key)}
                  />
                }
                label={BACKUP_KEYS.find((b) => b.key === key)?.label}
              />
            ))}
          </Box>

          <Divider sx={{ mt: 1, mb: 1 }} />

          {/* Bài học */}
          <Typography sx={{ fontSize: "1rem", fontWeight: "bold", color: "error.main" }}>
            Bài học
          </Typography>
          <Box sx={{ ml: 3, display: "flex", flexDirection: "column" }}>
            {[
              "TENBAI_Lop1",
              "TENBAI_Lop2",
              "TENBAI_Lop3",
              "TENBAI_Lop4",
              "TENBAI_Lop5",
            ].map((key) => (
              <FormControlLabel
                key={key}
                control={
                  <Checkbox
                    checked={backupOptions[key] || false}
                    onChange={() => toggleOption(key)}
                  />
                }
                label={BACKUP_KEYS.find((b) => b.key === key)?.label}
              />
            ))}
          </Box>

          <Divider sx={{ mt: 1, mb: 1 }} />

          {/* Trắc nghiệm */}
          <Typography sx={{ fontSize: "1rem", fontWeight: "bold", color: "error.main" }}>
            Trắc nghiệm
          </Typography>
          <Box sx={{ ml: 3, display: "flex", flexDirection: "column" }}>
            {[
              "TRACNGHIEM1",
              "TRACNGHIEM2",
              "TRACNGHIEM3",
              "TRACNGHIEM4",
              "TRACNGHIEM5",
            ].map((key) => (
              <FormControlLabel
                key={key}
                control={
                  <Checkbox
                    checked={backupOptions[key] || false}
                    onChange={() => toggleOption(key)}
                  />
                }
                label={BACKUP_KEYS.find((b) => b.key === key)?.label}
              />
            ))}
          </Box>
        </Stack>
      </DialogContent>

      {/* Progress */}
      {loading && (
        <>
          <Box sx={{ width: "50%", mx: "auto", mt: 3 }}>
            <LinearProgress variant="determinate" value={progress} />
          </Box>
          <Typography
            variant="body2"
            align="center"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Đang sao lưu... {Math.round(progress)}%
          </Typography>
        </>
      )}

      {/* Actions */}
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button
          variant="contained"
          startIcon={<BackupIcon />}
          onClick={handleBackup}
          disabled={loading}
        >
          Sao lưu
        </Button>
      </DialogActions>
    </Dialog>

    {/* Snackbar */}
    <Snackbar
      open={snackbar.open}
      autoHideDuration={4000}
      onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert severity={snackbar.severity} variant="filled" sx={{ width: "100%" }}>
        {snackbar.message}
      </Alert>
    </Snackbar>
  </>
);

}
