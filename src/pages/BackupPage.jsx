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
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { onSnapshot } from "firebase/firestore";

// ================== BACKUP KEYS ==================
const BACKUP_KEYS = [
  { key: "DANHSACHLOP", label: "Danh sách lớp", group: "Dữ liệu" },
  { key: "DATA", label: "Kết quả đánh giá", group: "Dữ liệu" },

  { key: "TENBAI_Lop1", label: "Bài lớp 1", group: "Bài học" },
  { key: "TENBAI_Lop2", label: "Bài lớp 2", group: "Bài học" },
  { key: "TENBAI_Lop3", label: "Bài lớp 3", group: "Bài học" },
  { key: "TENBAI_Lop4", label: "Bài lớp 4", group: "Bài học" },
  { key: "TENBAI_Lop5", label: "Bài lớp 5", group: "Bài học" },

  { key: "TRACNGHIEM1", label: "Lớp 1", group: "Trắc nghiệm" },
  { key: "TRACNGHIEM2", label: "Lớp 2", group: "Trắc nghiệm" },
  { key: "TRACNGHIEM3", label: "Lớp 3", group: "Trắc nghiệm" },
  { key: "TRACNGHIEM4", label: "Lớp 4", group: "Trắc nghiệm" },
  { key: "TRACNGHIEM5", label: "Lớp 5", group: "Trắc nghiệm" },
];

const TENBAI_MAP = {
  1: "Lop1",
  2: "Lop2",
  3: "Lop3",
  4: "Lop4",
  5: "Lop5",
};

// ================== FIX LOGIC THEO NAM HỌC ==================
const isOldYear = (namHoc) => namHoc === "2025-2026";

// nếu là 2025-2026 => CŨ
// ngược lại => MỚI
const getCollectionName = (base, namHoc) => {
  return isOldYear(namHoc) ? base : `${base}_New`;
};

const getTenBaiCollection = (lop, namHoc) => {
  const lopKey = TENBAI_MAP[lop];
  if (!lopKey) return null;

  return isOldYear(namHoc)
    ? `TENBAI_${lopKey}`
    : `TENBAI_${lopKey}_New`;
};

export default function BackupPage({ open, onClose }) {
  const [backupOptions, setBackupOptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [namHoc, setNamHoc] = useState("");

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "CONFIG", "config"), (snap) => {
      if (snap.exists()) {
        setNamHoc(snap.data().namHoc);
      }
    });
    return () => unsub();
  }, []);

  // ================== INIT ==================
  useEffect(() => {
    const options = {};
    BACKUP_KEYS.forEach(({ key }) => (options[key] = true));
    setBackupOptions(options);
  }, []);

  const toggleOption = (key) => {
    setBackupOptions((prev) => {
      const newState = { ...prev };
      const nextValue = !prev[key];

      newState[key] = nextValue;

      const match = key.match(/TRACNGHIEM(\d)/);
      if (match) {
        const lop = match[1];
        const baiKey = `TENBAI_Lop${lop}`;
        if (newState[baiKey] !== undefined) {
          newState[baiKey] = nextValue;
        }
      }

      return newState;
    });
  };

  // ================== BACKUP DATA ==================
  const fetchAllBackup = async (onProgress, selected) => {
    const backupData = {};
    let progressCount = 0;

    const hasDATA = selected.includes("DATA");
    const others = selected.filter((c) => c !== "DATA");

    const DATA_WEIGHT = hasDATA ? 80 : 0;
    const OTHER_WEIGHT = hasDATA ? 20 : 100;
    const step = others.length ? OTHER_WEIGHT / others.length : 0;

    // ================== OTHER ==================
    for (const col of others) {
      let realCol;

      // Nếu là TENBAI_LopX thì dùng getTenBaiCollection
      if (col.startsWith("TENBAI_Lop")) {
        const lop = col.replace("TENBAI_Lop", "");
        realCol = getTenBaiCollection(lop, namHoc);
      } else {
        realCol = getCollectionName(col, namHoc);
      }

      if (!realCol) continue;

      const snap = await getDocs(collection(db, realCol));
      backupData[realCol] = {};

      snap.forEach((d) => {
        backupData[realCol][d.id] = d.data();
      });

      // ===== TENBAI auto theo TRACNGHIEM =====
      if (col.startsWith("TRACNGHIEM")) {
        const lop = col.replace("TRACNGHIEM", "");
        const tenBaiCol = getTenBaiCollection(lop, namHoc);

        if (tenBaiCol) {
          const snapTB = await getDocs(collection(db, tenBaiCol));
          backupData[tenBaiCol] = {};

          snapTB.forEach((d) => {
            backupData[tenBaiCol][d.id] = d.data();
          });
        }
      }

      progressCount += step;
      onProgress((p) => Math.max(p, Math.round(progressCount)));
    }

    // ================== DATA ==================
    if (hasDATA) {
      const dataKey = getCollectionName("DATA", namHoc);
      backupData[dataKey] = {};

      // Sửa chỗ này: dùng getCollectionName cho DANHSACHLOP
      const listSnap = await getDocs(collection(db, getCollectionName("DANHSACHLOP", namHoc)));
      const listDoc = listSnap.docs.find((d) => d.id === "list");
      const classList = listDoc?.data()?.list || [];

      const perClass = DATA_WEIGHT / (classList.length || 1);

      const results = await Promise.all(
        classList.map(async (lop) => {
          const classKey = lop.replace(".", "_");

          const snap = await getDocs(
            collection(db, dataKey, classKey, "HOCSINH")
          );

          const hs = {};
          snap.forEach((d) => (hs[d.id] = d.data()));

          return { classKey, hs };
        })
      );

      for (const r of results) {
        backupData[dataKey][r.classKey] = { HOCSINH: r.hs };

        progressCount += perClass;
        onProgress((p) => Math.max(p, Math.round(progressCount)));
      }
    }

    onProgress(100);
    return backupData;
  };


  // ================== EXPORT ==================
  const exportBackupToJson = (data) => {
    const now = new Date();

    // Tạo chuỗi ngày/giờ: dd-mm-yyyy hh-mm-ss
    const dateStr = `${String(now.getDate()).padStart(2, "0")}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${now.getFullYear()}`;
    const timeStr = `${String(now.getHours()).padStart(2, "0")}-${String(
      now.getMinutes()
    ).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}`;

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    // Đặt tên file: Backup_<namHoc> (dd-mm-yyyy hh-mm-ss).json
    a.download = `LTTH_${namHoc} (${dateStr} ${timeStr}).json`;

    a.click();
  };


  // ================== HANDLE ==================
  const handleBackup = async () => {
    const selected = Object.keys(backupOptions).filter(
      (k) => backupOptions[k]
    );

    if (!selected.length) {
      setSnackbar({
        open: true,
        severity: "warning",
        message: "Chọn ít nhất 1 mục",
      });
      return;
    }

    setLoading(true);
    setProgress(5);

    const data = await fetchAllBackup(setProgress, selected);

    setProgress(95);
    exportBackupToJson(data);

    setProgress(100);
    setSnackbar({
      open: true,
      severity: "success",
      message: "Backup thành công",
    });

    setLoading(false);
    onClose();
  };

  /* ================= UI GIỮ NGUYÊN ================= */
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
          {/*<Typography sx={{ fontSize: "1rem", fontWeight: "bold", color: "error.main" }}>
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

          <Divider sx={{ mt: 1, mb: 1 }} />*/}

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
          {/*<Typography sx={{ fontSize: "1rem", fontWeight: "bold", color: "error.main" }}>
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

          <Divider sx={{ mt: 1, mb: 1 }} />*/}

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