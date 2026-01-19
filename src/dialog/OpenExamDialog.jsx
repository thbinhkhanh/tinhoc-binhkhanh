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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

const OpenExamDialog = ({ open, onClose, onSelectExam }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedClass, setSelectedClass] = useState("Lớp 4");
  const navigate = useNavigate();

  // Lấy danh sách đề khi dialog mở và khi lớp thay đổi
  useEffect(() => {
    if (!open || selectedClass === "Tất cả") {
      setDocs([]);
      setSelectedDoc(null); // ✅ reset khi không có docs
      return;
    }

    const fetchDocs = async () => {
      setLoading(true);
      try {
        const colName = `TRACNGHIEM${selectedClass.replace("Lớp ", "")}`;
        const colRef = collection(db, colName);
        const snapshot = await getDocs(colRef);
        const newDocs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setDocs(newDocs);
        setSelectedDoc(null); // ✅ reset mỗi lần load đề mới
      } catch (err) {
        console.error("❌ Lỗi load danh sách đề:", err);
        setDocs([]);
        setSelectedDoc(null); // ✅ reset khi lỗi
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, [open, selectedClass]);


  const handleOpenSelected = (docId) => {
    if (!docId) {
      alert("⚠️ Vui lòng chọn đề trước khi mở!");
      return;
    }

    const lopParam = selectedClass.replace("Lớp ", "");
    console.log("🔥 Mở đề:", { lopParam, docId }); // ✅ log kiểm tra lớp + bài

    if (onSelectExam) {
      console.log("✅ Gọi callback parent với:", { lopParam, docId });
      onSelectExam(lopParam, docId); // Gọi callback parent
      onClose();
    } else {
      // fallback navigate nếu parent không truyền onSelectExam
      const collectionName = `TRACNGHIEM${lopParam}`;
      console.log("🚀 Navigate tới:", `/trac-nghiem_test?lop=${lopParam}&bai=${docId}`);
      navigate(`/trac-nghiem_test?lop=${lopParam}&bai=${docId}`);
      onClose();
    }
  };


  return (
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
        <IconButton onClick={onClose} sx={{ color: "#fff", p: 0.6 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* DROPDOWN CHỌN LỚP */}
      <Box sx={{ px: 1, py: 2 }}>
        <FormControl size="small" fullWidth>
          <InputLabel>Lớp</InputLabel>
          <Select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            label="Lớp"
          >
            <MenuItem value="Tất cả">Tất cả</MenuItem>
            {[1, 2, 3, 4, 5].map((n) => (
              <MenuItem key={n} value={`Lớp ${n}`}>
                Lớp {n}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* CONTENT */}
      <DialogContent dividers sx={{ height: 340, px: 2, py: 2, bgcolor: "#fff" }}>
        <Box sx={{ flex: 1, overflowY: "auto", border: "1px solid #ccc", borderRadius: 2 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
              <CircularProgress />
            </Box>
          ) : docs.length === 0 ? (
            <Typography align="center" sx={{ p: 2, color: "gray" }}>
              Chọn lớp để xem danh sách đề.
            </Typography>
          ) : (
            docs.map((doc) => (
              <Stack
                key={doc.id}
                direction="row"
                alignItems="center"
                sx={{
                  px: 1,
                  py: 0.5,
                  height: 36,
                  cursor: "pointer",
                  borderRadius: 1,
                  backgroundColor: selectedDoc === doc.id ? "#E3F2FD" : "transparent",
                  "&:hover": { backgroundColor: "#f5f5f5" },
                }}
                onClick={() => setSelectedDoc(doc.id)}
                onDoubleClick={() => handleOpenSelected(doc.id)}
              >
                <Typography variant="subtitle1">{doc.id}</Typography>
              </Stack>
            ))
          )}
        </Box>
      </DialogContent>

      {/* ACTIONS */}
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: "center" }}>
        <Button
          onClick={() => handleOpenSelected(selectedDoc)}
          variant="contained"
          disabled={!selectedDoc}
        >
          Mở đề
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OpenExamDialog;
