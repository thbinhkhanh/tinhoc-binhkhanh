import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from "@mui/material";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, writeBatch } from "firebase/firestore";
import { FileDownload, Delete, DeleteForever } from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import { exportKetQuaExcel } from "../utils/exportKetQuaExcel";

export default function TongHopKQ() {
  const [khoi, setKhoi] = useState("Khối 4");
  const [classesList, setClassesList] = useState([]);
  const [selectedLop, setSelectedLop] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogContent, setDialogContent] = useState("");
  const [dialogAction, setDialogAction] = useState(null);

  const circleIconStyle = {
    bgcolor: "white",
    boxShadow: 1,
    p: 0.5,
    width: 35,
    height: 35,
    "& svg": { fontSize: 20 },
    "&:hover": { bgcolor: "primary.light", color: "white" },
  };

  // 🔹 Lấy danh sách lớp theo khối
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const snap = await getDoc(doc(db, "DANHSACHLOP", "list"));
        if (snap.exists()) {
          const allClasses = snap.data()?.list || [];
          const soKhoi = khoi.replace("Khối ", "");
          const filtered = allClasses.filter(c => c.startsWith(`${soKhoi}`));
          setClassesList(filtered);
          setSelectedLop(filtered[0] || "");
        }
      } catch (err) {
        console.error(err);
        setClassesList([]);
        setSelectedLop("");
      }
    };
    fetchClasses();
  }, [khoi]);

  // Load kết quả
  const loadResults = async () => {
    if (!selectedLop) return;
    setLoading(true);
    try {
      const classKey = selectedLop.replace(".", "_");
      const colRef = collection(db, "DATA", classKey, "HOCSINH");
      const snapshot = await getDocs(colRef);

      if (snapshot.empty) {
        setResults([]);
        setSnackbarSeverity("warning");
        setSnackbarMessage(`Không tìm thấy học sinh trong lớp ${selectedLop}`);
        setSnackbarOpen(true);
        setLoading(false);
        return;
      }

      const data = snapshot.docs.map(docSnap => {
        const studentData = docSnap.data();
        const phanTram = studentData.phanTram ?? 0;
        return {
          hoVaTen: studentData.hoVaTen || "",
          lop: selectedLop,
          diem: studentData.diem ?? 0, // ✅ LẤY ĐIỂM TRỰC TIẾP
          ngayKiemTra: studentData.ngayKiemTra || "",
          thoiGianLamBai: studentData.thoiGianLamBai || "",
          soLan: studentData.soLan ?? 1,
        };
      });

      data.sort((a, b) => {
        const nameA = (a.hoVaTen || "").trim().split(" ").reverse();
        const nameB = (b.hoVaTen || "").trim().split(" ").reverse();
        for (let i = 0; i < Math.max(nameA.length, nameB.length); i++) {
          const cmp = (nameA[i] || "").toLowerCase().localeCompare((nameB[i] || "").toLowerCase());
          if (cmp !== 0) return cmp;
        }
        return 0;
      });

      setResults(data.map((item, idx) => ({ stt: idx + 1, ...item })));
    } catch (err) {
      console.error(err);
      setResults([]);
      setSnackbarSeverity("error");
      setSnackbarMessage("❌ Lỗi khi load kết quả!");
      setSnackbarOpen(true);
    }
    setLoading(false);
  };

  useEffect(() => { loadResults(); }, [selectedLop]);

  // ======================== DIALOG & XÓA =========================
  const openConfirmDialog = (title, content, onConfirm) => {
    setDialogTitle(title);
    setDialogContent(content);
    setDialogAction(() => () => {
      setDialogOpen(false);
      setTimeout(onConfirm, 0);
    });
    setDialogOpen(true);
  };

  const handleDeleteClass = () => {
    openConfirmDialog(
      "Xóa lớp",
      `⚠️ Bạn có chắc muốn xóa toàn bộ kết quả lớp ${selectedLop}?\nHành động này không thể hoàn tác.`,
      async () => {
        if (!selectedLop) return;
        const classKey = selectedLop.replace(".", "_");
        const colRef = collection(db, "DATA", classKey, "HOCSINH");
        const snapshot = await getDocs(colRef);
        if (snapshot.empty) return;

        const CHUNK_SIZE = 450;
        const docsList = snapshot.docs.map(docSnap => ({ docRef: doc(db, "DATA", classKey, "HOCSINH", docSnap.id) }));

        for (let i = 0; i < docsList.length; i += CHUNK_SIZE) {
          const batch = writeBatch(db);
          docsList.slice(i, i + CHUNK_SIZE).forEach(item => batch.delete(item.docRef));
          await batch.commit();
        }

        setResults([]);
        setSnackbarSeverity("success");
        setSnackbarMessage(`✅ Đã xóa lớp ${selectedLop}`);
        setSnackbarOpen(true);
      }
    );
  };

  const handleDeleteSchool = () => {
    if (!classesList || classesList.length === 0) return;
    openConfirmDialog(
      "Xóa toàn trường",
      `⚠️ Bạn có chắc muốn xóa toàn bộ dữ liệu của khối ${khoi}?\nHành động này không thể hoàn tác.`,
      async () => {
        const CHUNK_SIZE = 450;
        for (const lop of classesList) {
          const classKey = lop.replace(".", "_");
          const colRef = collection(db, "DATA", classKey, "HOCSINH");
          const snapshot = await getDocs(colRef);
          if (snapshot.empty) continue;
          const docsList = snapshot.docs.map(docSnap => ({ docRef: doc(db, "DATA", classKey, "HOCSINH", docSnap.id) }));
          for (let i = 0; i < docsList.length; i += CHUNK_SIZE) {
            const batch = writeBatch(db);
            docsList.slice(i, i + CHUNK_SIZE).forEach(item => batch.delete(item.docRef));
            await batch.commit();
          }
        }
        setResults([]);
        setSnackbarSeverity("success");
        setSnackbarMessage(`✅ Đã xóa toàn trường khối ${khoi}`);
        setSnackbarOpen(true);
      }
    );
  };

  const handleExportExcel = () => {
    if (!results.length) {
      setSnackbarSeverity("error");
      setSnackbarMessage("Không có dữ liệu để xuất Excel!");
      setSnackbarOpen(true);
      return;
    }
    exportKetQuaExcel(results, selectedLop);
    setSnackbarSeverity("success");
    setSnackbarMessage("✅ Xuất file Excel thành công!");
    setSnackbarOpen(true);
  };
  // ================================================================

  return (
    <Box sx={{ minHeight: "100vh", pt: 10, px: 3, background: "linear-gradient(to bottom, #e3f2fd, #bbdefb)", display: "flex", justifyContent: "center" }}>
      <Paper sx={{ p: 4, borderRadius: 3, width: "100%", maxWidth: 800, position: "relative" }} elevation={6}>

        <Box sx={{ position: "absolute", top: 16, left: 16 }}>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Xuất Excel"><IconButton onClick={handleExportExcel} sx={circleIconStyle}><FileDownload /></IconButton></Tooltip>
            <Tooltip title="Xóa lớp"><IconButton onClick={handleDeleteClass} sx={{ ...circleIconStyle, color: "error.main", "&:hover": { bgcolor: "error.main", color: "#fff" } }}><Delete /></IconButton></Tooltip>
            <Tooltip title="Xóa toàn trường"><IconButton onClick={handleDeleteSchool} sx={{ ...circleIconStyle, color: "#d32f2f", "&:hover": { bgcolor: "#d32f2f", color: "#fff" } }}><DeleteForever /></IconButton></Tooltip>
          </Stack>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 3 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ color: "#1976d2" }}>KẾT QUẢ KIỂM TRA</Typography>
        </Box>

        {/* Khối + Lớp */}
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", justifyContent: "center" }}>
          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", justifyContent: "center" }}>
            {/* Khối */}
            <FormControl size="small" sx={{ width: 100 }} variant="outlined">
              <InputLabel id="khoi-label">Khối</InputLabel>
              <Select
                labelId="khoi-label"
                value={khoi}
                label="Khối"
                onChange={e => setKhoi(e.target.value)}
              >
                {["Khối 1","Khối 2","Khối 3","Khối 4","Khối 5"].map(k => (
                  <MenuItem key={k} value={k}>{k}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Lớp */}
            <FormControl size="small" sx={{ width: 80 }} variant="outlined">
              <InputLabel id="lop-label">Lớp</InputLabel>
              <Select
                labelId="lop-label"
                value={selectedLop}
                label="Lớp"
                onChange={e => setSelectedLop(e.target.value)}
              >
                {classesList.map(lop => (
                  <MenuItem key={lop} value={lop}>{lop}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

        </Box>

        {/* Table */}
        {loading ? <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}><CircularProgress /></Box> :
          <Box sx={{ width: "100%", overflowX: "auto" }}>
            <TableContainer component={Paper} sx={{ boxShadow: "none", minWidth: 700 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{ width: 60, bgcolor: "#1976d2", color: "#fff", textAlign: "center" }}
                    >
                      STT
                    </TableCell>

                    <TableCell
                      sx={{ minWidth: 180, bgcolor: "#1976d2", color: "#fff", textAlign: "center" }}
                    >
                      Họ và tên
                    </TableCell>

                    <TableCell
                      sx={{ width: 80, bgcolor: "#1976d2", color: "#fff", textAlign: "center" }}
                    >
                      Điểm
                    </TableCell>

                    <TableCell
                      sx={{ width: 110, bgcolor: "#1976d2", color: "#fff", textAlign: "center" }}
                    >
                      Thời gian
                    </TableCell>

                    <TableCell
                      sx={{ width: 110, bgcolor: "#1976d2", color: "#fff", textAlign: "center" }}
                    >
                      Ngày
                    </TableCell>

                    <TableCell
                      sx={{ width: 120, bgcolor: "#1976d2", color: "#fff", textAlign: "center" }}
                    >
                      Số lần kiểm tra
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {(results.length > 0 ? results : Array.from({ length: 5 }, (_, i) => ({ stt:i+1, hoVaTen:"", diem:"", thoiGianLamBai:"", ngayKiemTra:"" }))).map(r => (
                    <TableRow key={r.stt}>
                      <TableCell sx={{ textAlign:"center", border:"1px solid rgba(0,0,0,0.12)" }}>{r.stt}</TableCell>
                      <TableCell sx={{ textAlign:"left", border:"1px solid rgba(0,0,0,0.12)" }}>{r.hoVaTen}</TableCell>
                      <TableCell sx={{ textAlign:"center", border:"1px solid rgba(0,0,0,0.12)", fontWeight:"bold" }}>{r.diem}</TableCell>
                      <TableCell sx={{ textAlign:"center", border:"1px solid rgba(0,0,0,0.12)" }}>{r.thoiGianLamBai}</TableCell>
                      <TableCell sx={{ textAlign:"center", border:"1px solid rgba(0,0,0,0.12)" }}>{r.ngayKiemTra}</TableCell>
                      <TableCell sx={{ textAlign:"center", border:"1px solid rgba(0,0,0,0.12)" }}>{r.soLan}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        }

        {/* Snackbar */}
        <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical:"bottom", horizontal:"right" }}>
          <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width:"100%" }}>{snackbarMessage}</Alert>
        </Snackbar>

        {/* Dialog cảnh báo xóa */}
        <Dialog open={dialogOpen} onClose={(_, reason)=>{ if(reason==="backdropClick"||reason==="escapeKeyDown") return; setDialogOpen(false); }} maxWidth="xs" fullWidth PaperProps={{ sx:{ borderRadius:3, p:3, bgcolor:"#fff", boxShadow:"0 4px 12px rgba(33,150,243,0.15)" } }}>
          <Box sx={{ display:"flex", alignItems:"center", mb:2 }}>
            <Box sx={{ bgcolor:"#42a5f5", color:"#fff", borderRadius:"50%", width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", mr:1.5, fontWeight:"bold", fontSize:18 }}>❓</Box>
            <DialogTitle sx={{ p:0, fontWeight:"bold", color:"#1565c0", flex:1 }}>{dialogTitle}</DialogTitle>
            <IconButton onClick={()=>setDialogOpen(false)} sx={{ ml:"auto", color:"#f44336", "&:hover":{bgcolor:"rgba(244,67,54,0.1)"}}}><CloseIcon /></IconButton>
          </Box>
          <DialogContent dividers>
            <Typography sx={{ fontSize:16, color:"#333", whiteSpace:"pre-line", mb:2 }}>{dialogContent}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={()=>setDialogOpen(false)}>Hủy</Button>
            <Button variant="contained" color="primary" onClick={dialogAction} sx={{ fontWeight:"bold" }}>Xác nhận</Button>
          </DialogActions>
        </Dialog>

      </Paper>
    </Box>
  );
}
