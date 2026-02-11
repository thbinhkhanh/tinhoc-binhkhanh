import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Button,
  Stack,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import DeleteConfirmDialog from "../dialog/DeleteConfirmDialog";

const OpenExamDialog = ({ open, onClose, onSelectExam }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedClass, setSelectedClass] = useState("Lớp 3");

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const navigate = useNavigate();

  // ===== LOAD DANH SÁCH =====
  useEffect(() => {
    if (!open || selectedClass === "Tất cả") {
      setDocs([]);
      setSelectedDoc(null);
      return;
    }

    const fetchDocs = async () => {
      setLoading(true);
      try {
        const colName = `TRACNGHIEM${selectedClass.replace("Lớp ", "")}`;
        const snapshot = await getDocs(collection(db, colName));

        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setDocs(data);
        setSelectedDoc(null);
      } catch (err) {
        console.error("❌ Lỗi load danh sách:", err);
        setDocs([]);
        setSelectedDoc(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, [open, selectedClass]);

  // ===== MỞ ĐỀ =====
  const handleOpenSelected = (docId) => {
    if (!docId) {
      alert("⚠️ Vui lòng chọn đề trước khi mở!");
      return;
    }

    const lopParam = selectedClass.replace("Lớp ", "");

    if (onSelectExam) {
      onSelectExam(lopParam, docId);
      onClose();
    } else {
      navigate(`/trac-nghiem_test?lop=${lopParam}&bai=${docId}`);
      onClose();
    }
  };

  // ===== MỞ DIALOG XÁC NHẬN =====
  const handleDeleteClick = () => {
    if (!selectedDoc) {
      alert("⚠️ Vui lòng chọn đề cần xóa!");
      return;
    }
    setOpenDeleteDialog(true);
  };

  // ===== XÁC NHẬN XÓA =====
  const handleConfirmDelete = async () => {
    if (!selectedDoc) return;

    const deletedId = selectedDoc;

    try {
      // 1️⃣ Cập nhật giao diện trước
      setDocs(prev => prev.filter(item => item.id !== deletedId));
      setSelectedDoc(null);

      // 2️⃣ Đóng dialog xác nhận
      setOpenDeleteDialog(false);

      // 3️⃣ Xóa Firestore (chỉ từ lớp 3 -> 5)
      const batchDeletes = [];

      for (let i = 3; i <= 5; i++) {
        batchDeletes.push(deleteDoc(doc(db, `TRACNGHIEM${i}`, deletedId)));
        batchDeletes.push(deleteDoc(doc(db, `TENBAI_Lop${i}`, deletedId)));
      }

      await Promise.all(batchDeletes);

      // 4️⃣ Hiện snackbar
      setSnackbarOpen(true);

    } catch (error) {
      console.error("❌ Lỗi khi xóa:", error);
    }
  };


  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        {/* HEADER */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(to right, #1976d2, #42a5f5)",
            color: "#fff",
            px: 2,
            py: 2,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
            📂 Danh sách đề
          </Typography>
          <IconButton onClick={onClose} sx={{ color: "#fff" }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* CHỌN LỚP */}
        <Box sx={{ px: 2, py: 2 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Lớp</InputLabel>
            <Select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              label="Lớp"
            >
              <MenuItem value="Tất cả">Tất cả</MenuItem>
              {[3, 4, 5].map((n) => (
                <MenuItem key={n} value={`Lớp ${n}`}>
                  Lớp {n}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* DANH SÁCH */}
        <DialogContent dividers sx={{ height: 340 }}>
          <Box
            sx={{
              height: "100%",
              overflowY: "auto",
              border: "1px solid #ccc",
              borderRadius: 2,
            }}
          >
            {loading ? (
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CircularProgress />
              </Box>
            ) : docs.length === 0 ? (
              <Typography align="center" sx={{ p: 2, color: "gray" }}>
                Không có đề nào.
              </Typography>
            ) : (
              docs.map((docItem) => (
                <Stack
                  key={docItem.id}
                  sx={{
                    px: 1.5,
                    py: 0.8,
                    cursor: "pointer",
                    borderRadius: 1,
                    backgroundColor:
                      selectedDoc === docItem.id ? "#E3F2FD" : "transparent",
                    "&:hover": { backgroundColor: "#f5f5f5" },
                  }}
                  onClick={() => setSelectedDoc(docItem.id)}
                  onDoubleClick={() => handleOpenSelected(docItem.id)}
                >
                  <Typography>{docItem.id}</Typography>
                </Stack>
              ))
            )}
          </Box>
        </DialogContent>

        {/* ACTION */}
        <DialogActions sx={{ justifyContent: "center", gap: 2, pb: 2 }}>
          <Button
            variant="contained"
            disabled={!selectedDoc}
            onClick={() => handleOpenSelected(selectedDoc)}
          >
            Mở đề
          </Button>

          <Button
            variant="contained"
            color="error"
            disabled={!selectedDoc}
            onClick={handleDeleteClick}
          >
            Xóa đề
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG XÁC NHẬN */}
      <DeleteConfirmDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        examName={selectedDoc}
      />

      {/* SNACKBAR */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled">
          ✅ Đã xóa đề thành công
        </Alert>
      </Snackbar>
    </>
  );
};

export default OpenExamDialog;
