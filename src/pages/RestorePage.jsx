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
import { writeBatch, collection, getDocs } from "firebase/firestore";

/* ================= BACKUP KEYS ================= */
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

  { key: "TRACNGHIEM1", label: "Lớp 1", group: "Trắc nghiệm" },
  { key: "TRACNGHIEM2", label: "Lớp 2", group: "Trắc nghiệm" },
  { key: "TRACNGHIEM3", label: "Lớp 3", group: "Trắc nghiệm" },
  { key: "TRACNGHIEM4", label: "Lớp 4", group: "Trắc nghiệm" },
  { key: "TRACNGHIEM5", label: "Lớp 5", group: "Trắc nghiệm" },
];

/* ================= FIX: map cũ / new ================= */
const getRestoreCollection = (key, dataKeys) => {
  const newKey = `${key}_New`;

  if (dataKeys.includes(newKey)) return newKey;
  return key;
};

export default function RestorePage({ open, onClose }) {
  const fileInputRef = useRef(null);

  const [restoreOptions, setRestoreOptions] = useState({});
  const [disabledOptions, setDisabledOptions] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [namHoc, setNamHoc] = useState("");

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [fileData, setFileData] = useState({}); // 👈 quan trọng

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
    setFileData({});
    setProgress(0);
    setLoading(false);

    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [open]);

  const toggleOption = (key) => {
    setRestoreOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  /* ================= FILE LOAD ================= */
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);

    try {
      const json = JSON.parse(await file.text());

      setFileData(json); // 👈 lưu toàn bộ file

      const checked = {};
      const disabled = {};

      BACKUP_KEYS.forEach(({ key }) => {
        const hasOld = json[key] && Object.keys(json[key]).length > 0;
        const hasNew = json[`${key}_New`] && Object.keys(json[`${key}_New`]).length > 0;

        const hasData = hasOld || hasNew;

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
  /*const handleRestore = async () => {
    const selectedKeys = Object.keys(restoreOptions).filter((k) => restoreOptions[k]);
    if (!selectedFile) return;
    if (!selectedKeys.length) return;

    try {
      setLoading(true);
      setProgress(0);

      const data = fileData;
      let total = 0;

      // Tính tổng số bản ghi
      selectedKeys.forEach((key) => {
        const val = data[key] || data[`${key}_New`]; // chỉ lấy 1 trong 2
        if (!val) return;

        if (key === "DATA") {
          Object.values(val).forEach((cls) => {
            total += Object.keys(cls.HOCSINH || {}).length;
          });
        } else {
          total += Object.keys(val).length;
        }
      });

      let done = 0;

      for (const key of selectedKeys) {
        const value = data[key] || data[`${key}_New`]; // lấy đúng key có trong file
        if (!value) continue;

        // ===== DATA =====
        if (key === "DATA") {
          // Ghi đúng vào collection có trong file (DATA hoặc DATA_New)
          const realKey = Object.keys(data).includes(`${key}_New`) ? `${key}_New` : key;
          for (const classKey of Object.keys(value)) {
            const hs = value[classKey].HOCSINH || {};
            for (const id of Object.keys(hs)) {
              await setDoc(
                doc(db, realKey, classKey, "HOCSINH", id),
                hs[id],
                { merge: true }
              );
              done++;
              setProgress(Math.round((done / total) * 100));
            }
          }
          continue;
        }

        // ===== NORMAL (TENBAI, TRACNGHIEM, CONFIG, ...) =====
        const realKey = Object.keys(data).includes(`${key}_New`) ? `${key}_New` : key;
        for (const id of Object.keys(value)) {
          await setDoc(doc(db, realKey, id), value[id], { merge: true });
          done++;
          setProgress(Math.round((done / total) * 100));
        }
      }

      setSnackbar({
        open: true,
        severity: "success",
        message: "✅ Phục hồi thành công",
      });
      onClose();
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        severity: "error",
        message: "❌ Lỗi phục hồi",
      });
    } finally {
      setLoading(false);
    }
  };*/

  const handleRestore = async () => {
    try {
      setLoading(true);
      setProgress(0);

      const data = fileData;
      const selectedKeys = Object.keys(restoreOptions).filter((k) => restoreOptions[k]);
      if (!selectedFile || !selectedKeys.length) return;

      for (const key of selectedKeys) {
        const value = data[key] || data[`${key}_New`];
        if (!value) continue;

        const realKey = Object.keys(data).includes(`${key}_New`) ? `${key}_New` : key;

        // Tạo batch cho từng collection
        const batch = writeBatch(db);

        // Xoá toàn bộ document cũ
        const snap = await getDocs(collection(db, realKey));
        snap.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });

        // Ghi đè toàn bộ document mới từ file backup
        if (key === "DATA") {
          for (const classKey of Object.keys(value)) {
            const hs = value[classKey].HOCSINH || {};
            for (const id of Object.keys(hs)) {
              batch.set(doc(db, realKey, classKey, "HOCSINH", id), hs[id]);
            }
          }
        } else {
          for (const id of Object.keys(value)) {
            batch.set(doc(db, realKey, id), value[id]);
          }
        }

        // Commit batch một lần
        await batch.commit();
      }

      setSnackbar({
        open: true,
        severity: "success",
        message: "✅ Phục hồi thành công!",
      });
      onClose();
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        severity: "error",
        message: "❌ Lỗi phục hồi",
      });
    } finally {
      setLoading(false);
    }
  };




  /* ================= UI (GIỮ NGUYÊN) ================= */
  const renderGroup = (title, keys) => (
    <>
      <Typography sx={{ fontWeight: "bold", color: "error.main" }}>
        {title}
      </Typography>

      <Box sx={{ ml: 3, display: "flex", flexDirection: "column" }}>
        {keys.map((key) => (
          <FormControlLabel
            key={key}
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

      <Divider sx={{ my: 1 }} />
    </>
  );


  return (
  <>
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          width: "100%",
          maxWidth: "450px",

          borderRadius: "14px",
          overflow: "hidden",

          background: "#f8fafc",
          border: "1px solid #e2e8f0",

          boxShadow:
            "0 10px 35px rgba(0,0,0,0.12)",

          m: 0,
        },
      }}
      sx={{
        "& .MuiDialog-container": {
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",

          pt: "80px",
          px: "16px",
        },

        "& .MuiBackdrop-root": {
          background:
            "rgba(15,23,42,0.45)",
          backdropFilter: "blur(2px)",
        },
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
              Phục hồi dữ liệu
            </Typography>
          </Box>

          <IconButton
            onClick={onClose}
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

      {/* ===== CONTENT ===== */}
      <DialogContent
        sx={{
          px: 3,
          py: 2.5,
          bgcolor: "#f8fafc",
        }}
      >
        <Stack spacing={2}>
          {/* CHỌN FILE */}
          <Box
            sx={{
              p: 1.8,
              borderRadius: "5px",
              bgcolor: "#fff",
              border:
                "1px solid #e2e8f0",
            }}
          >
            <Button
              variant="outlined"
              fullWidth
              startIcon={
                <UploadFileIcon />
              }
              onClick={() =>
                fileInputRef.current.click()
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
              Chọn file phục hồi
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".json"
              onChange={
                handleFileChange
              }
            />

            {selectedFile && (
              <Box
                sx={{
                  mt: 1.5,
                  p: 1.2,
                  borderRadius:
                    "10px",
                  bgcolor:
                    "#eff6ff",
                  border:
                    "1px solid #bfdbfe",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 13,
                    color:
                      "#1d4ed8",
                    fontWeight: 600,
                    wordBreak:
                      "break-all",
                  }}
                >
                  📄{" "}
                  {
                    selectedFile.name
                  }
                </Typography>
              </Box>
            )}
          </Box>

          {/* DỮ LIỆU */}
          <Box
            sx={{
              p: 1.8,
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
              Dữ liệu
            </Typography>

            <Stack spacing={0.5}>
              {[
                "DANHSACHLOP",
                "DATA",
              ].map((key) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Checkbox
                      checked={
                        restoreOptions[
                          key
                        ] || false
                      }
                      disabled={
                        disabledOptions[
                          key
                        ]
                      }
                      onChange={() =>
                        toggleOption(
                          key
                        )
                      }
                    />
                  }
                  label={
                    BACKUP_KEYS.find(
                      (b) =>
                        b.key === key
                    )?.label
                  }
                />
              ))}
            </Stack>
          </Box>

          {/* TRẮC NGHIỆM */}
          <Box
            sx={{
              p: 1.8,
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
              Trắc nghiệm
            </Typography>

            <Stack spacing={0.5}>
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
                      checked={
                        restoreOptions[
                          key
                        ] || false
                      }
                      disabled={
                        disabledOptions[
                          key
                        ]
                      }
                      onChange={() =>
                        toggleOption(
                          key
                        )
                      }
                    />
                  }
                  label={
                    BACKUP_KEYS.find(
                      (b) =>
                        b.key === key
                    )?.label
                  }
                />
              ))}
            </Stack>
          </Box>

          {/* PROGRESS */}
          {loading && (
            <Box
              sx={{
                p: 2,
                borderRadius: "5px",
                bgcolor: "#fff",
                border:
                  "1px solid #e2e8f0",
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 600,
                  mb: 1,
                  color: "#1e293b",
                }}
              >
                Đang phục hồi dữ liệu...
              </Typography>

              <LinearProgress
                sx={{
                  height: 8,
                  borderRadius: 999,
                }}
              />

              <Typography
                sx={{
                  mt: 1,
                  fontSize: 13,
                  color: "#64748b",
                  textAlign:
                    "center",
                }}
              >
                Vui lòng chờ...
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>

      {/* ===== ACTIONS ===== */}
      <Box
        sx={{
          px: 3,
          py: 2,
          borderTop:
            "1px solid #e2e8f0",
          bgcolor: "#fff",
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          justifyContent="flex-end"
        >
          <Button
            onClick={onClose}
            sx={{
              textTransform:
                "none",
            }}
          >
            Hủy
          </Button>

          <Button
            variant="contained"
            startIcon={<RestoreIcon />}
            onClick={handleRestore}
            disabled={loading}
            sx={{
              textTransform:
                "none",
              borderRadius:
                "12px",
              fontWeight: 700,
              boxShadow: "none",

              "&:hover": {
                boxShadow: "none",
              },
            }}
          >
            Phục hồi
          </Button>
        </Stack>
      </Box>
    </Dialog>

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
        sx={{ width: "100%" }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  </>
);
}
