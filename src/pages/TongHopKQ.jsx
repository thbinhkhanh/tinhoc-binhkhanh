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
import { collection, getDocs, doc, getDoc, writeBatch, setDoc, deleteDoc } from "firebase/firestore";
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
  const [baiList, setBaiList] = useState([]);
  const [selectedBai, setSelectedBai] = useState("ALL");

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

      const hsColRef = collection(
        db,
        "DATA",
        classKey,
        "HOCSINH"
      );

      const hsSnap = await getDocs(hsColRef);

      if (hsSnap.empty) {
        setResults([]);
        setBaiList(["ALL"]);
        return;
      }

      const rows = [];
      const baiSet = new Set();

      await Promise.all(
        hsSnap.docs.map(async (hsDoc) => {
          const hsData = hsDoc.data();

          const baiColRef = collection(
            db,
            "DATA",
            classKey,
            "HOCSINH",
            hsDoc.id,
            "BAITHI"
          );

          const baiSnap = await getDocs(baiColRef);

          if (baiSnap.empty) return;

          baiSnap.forEach((baiDoc) => {
            const baiData = baiDoc.data();

            if (!baiData?.bai) return;

            baiSet.add(baiData.bai);

            // lọc theo bài
            if (
              selectedBai !== "ALL" &&
              baiData.bai !== selectedBai
            ) {
              return;
            }

            rows.push({
              hoVaTen: hsData.hoVaTen || "",
              lop: hsData.lop || selectedLop,

              bai: baiData.bai || "",

              diem: baiData.diem ?? 0,
              diemTN: baiData.diemTN ?? 0,

              thoiGianLamBai:
                baiData.thoiGianLamBai || "",

              ngayKiemTra:
                baiData.ngayKiemTra || "",

              soLan: baiData.soLan ?? 0,
            });
          });
        })
      );

      // sort bài + tên
      rows.sort((a, b) => {
        const numA =
          parseInt(a.bai.match(/\d+/)?.[0]) || 0;

        const numB =
          parseInt(b.bai.match(/\d+/)?.[0]) || 0;

        if (numA !== numB) return numA - numB;

        return a.hoVaTen.localeCompare(
          b.hoVaTen,
          "vi"
        );
      });

      setResults(
        rows.map((r, i) => ({
          stt: i + 1,
          ...r,
        }))
      );

      setBaiList([
        "ALL",
        ...Array.from(baiSet).sort((a, b) => {
          const numA =
            parseInt(a.match(/\d+/)?.[0]) || 0;

          const numB =
            parseInt(b.match(/\d+/)?.[0]) || 0;

          return numA - numB;
        }),
      ]);
    } catch (err) {
      console.error("❌ loadResults:", err);

      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, [selectedLop, selectedBai]);

  /*const migrateOldDataToNew = async () => {
    if (!selectedLop) return;

    const classKey = selectedLop.replace(".", "_");
    const hsColRef = collection(db, "DATA", classKey, "HOCSINH");
    const hsSnap = await getDocs(hsColRef);

    if (hsSnap.empty) return;

    for (const hsDoc of hsSnap.docs) {
      const hsData = hsDoc.data();

      // 🔹 Không có dữ liệu cũ → bỏ
      if (hsData.diem === undefined) continue;

      // 🔹 ref đúng BAITHI/Bài_9
      const bai9Ref = doc(
        db,
        "DATA",
        classKey,
        "HOCSINH",
        hsDoc.id,
        "BAITHI",
        "Bài_9"
      );

      // 🔹 nếu đã có Bài_9 → bỏ
      const bai9Snap = await getDocs(
        collection(
          db,
          "DATA",
          classKey,
          "HOCSINH",
          hsDoc.id,
          "BAITHI"
        )
      );
      if (bai9Snap.docs.some(d => d.id === "Bài_9")) continue;

      // 🔹 ghi dữ liệu cũ sang cấu trúc mới
      await setDoc(bai9Ref, {
        bai: "Bài 9",
        diem: hsData.diem ?? 0,
        ngayKiemTra: hsData.ngayKiemTra || "",
        thoiGianLamBai: hsData.thoiGianLamBai || "",
        soLan: hsData.soLan ?? 1,
        migratedAt: new Date()
      });

      console.log(`✅ Migrated: ${hsData.hoVaTen}`);
    }

    console.log("🎉 Hoàn tất migrate dữ liệu cũ → BAITHI/Bài_9");
  };


  useEffect(() => {
    if (selectedLop) {
      migrateOldDataToNew();
    }
  }, [selectedLop]);*/

  /*const deleteNotBai9 = async () => {
    if (!selectedLop) return;

    const classKey = selectedLop.replace(".", "_");
    const hsColRef = collection(db, "DATA", classKey, "HOCSINH");
    const hsSnap = await getDocs(hsColRef);

    if (hsSnap.empty) return;

    for (const hsDoc of hsSnap.docs) {
      const baiColRef = collection(
        db,
        "DATA",
        classKey,
        "HOCSINH",
        hsDoc.id,
        "BAITHI"
      );

      const baiSnap = await getDocs(baiColRef);
      if (baiSnap.empty) continue;

      for (const baiDoc of baiSnap.docs) {
        // ❌ KHÔNG phải Bài_9 → xóa
        if (baiDoc.id !== "Bài_9") {
          await deleteDoc(
            doc(
              db,
              "DATA",
              classKey,
              "HOCSINH",
              hsDoc.id,
              "BAITHI",
              baiDoc.id
            )
          );

          console.log(
            `🗑️ Đã xóa ${baiDoc.id} của ${hsDoc.data().hoVaTen}`
          );
        }
      }
    }

    console.log("✅ Hoàn tất xóa tất cả BAITHI ≠ Bài_9");
  };

  useEffect(() => {
    if (!selectedLop) return;

    // ⚠️ chỉ dùng khi cần dọn dữ liệu
    deleteNotBai9();

  }, [selectedLop]);*/


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

  /*const handleDeleteClass = () => {
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
  };*/

  const handleDeleteClass = () => {
    openConfirmDialog(
      "Xóa lớp",
      `⚠️ Bạn có chắc muốn xóa toàn bộ kết quả lớp ${selectedLop}?\nHành động này không thể hoàn tác.`,
      async () => {
        if (!selectedLop) return;

        const classKey = selectedLop.replace(".", "_");
        const hsColRef = collection(db, "DATA", classKey, "HOCSINH");
        const hsSnap = await getDocs(hsColRef);
        if (hsSnap.empty) return;

        const CHUNK_SIZE = 400; // chừa dư cho BAITHI

        let operations = [];

        for (const hsDoc of hsSnap.docs) {
          const hsRef = doc(db, "DATA", classKey, "HOCSINH", hsDoc.id);

          // 🔹 Lấy BAITHI của học sinh
          const baiColRef = collection(hsRef, "BAITHI");
          const baiSnap = await getDocs(baiColRef);

          // 🔹 Xóa từng bài thi
          baiSnap.forEach(baiDoc => {
            operations.push(doc(baiColRef, baiDoc.id));
          });

          // 🔹 Xóa học sinh
          operations.push(hsRef);

          // 🔸 Commit theo chunk
          if (operations.length >= CHUNK_SIZE) {
            const batch = writeBatch(db);
            operations.forEach(ref => batch.delete(ref));
            await batch.commit();
            operations = [];
          }
        }

        // 🔹 Commit phần còn lại
        if (operations.length > 0) {
          const batch = writeBatch(db);
          operations.forEach(ref => batch.delete(ref));
          await batch.commit();
        }

        setResults([]);
        setSnackbarSeverity("success");
        setSnackbarMessage(`✅ Đã xóa toàn bộ dữ liệu lớp ${selectedLop}`);
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
        const CHUNK_SIZE = 400;
        let operations = [];

        for (const lop of classesList) {
          const classKey = lop.replace(".", "_");
          const hsColRef = collection(db, "DATA", classKey, "HOCSINH");
          const hsSnap = await getDocs(hsColRef);
          if (hsSnap.empty) continue;

          for (const hsDoc of hsSnap.docs) {
            const hsRef = doc(db, "DATA", classKey, "HOCSINH", hsDoc.id);

            // 🔹 Xóa BAITHI
            const baiColRef = collection(hsRef, "BAITHI");
            const baiSnap = await getDocs(baiColRef);

            baiSnap.forEach(baiDoc => {
              operations.push(doc(baiColRef, baiDoc.id));
            });

            // 🔹 Xóa HOCSINH
            operations.push(hsRef);

            // 🔸 Commit theo chunk
            if (operations.length >= CHUNK_SIZE) {
              const batch = writeBatch(db);
              operations.forEach(ref => batch.delete(ref));
              await batch.commit();
              operations = [];
            }
          }
        }

        // 🔹 Commit phần còn lại
        if (operations.length > 0) {
          const batch = writeBatch(db);
          operations.forEach(ref => batch.delete(ref));
          await batch.commit();
        }

        setResults([]);
        setSnackbarSeverity("success");
        setSnackbarMessage(`✅ Đã xóa toàn bộ dữ liệu khối ${khoi}`);
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
      <Paper sx={{ p: 4, borderRadius: 3, width: "100%", maxWidth: 920, position: "relative" }} elevation={6}>

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
            <FormControl size="small" sx={{ width: 100 }} variant="outlined">
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

            <FormControl size="small" sx={{ width: 100 }} variant="outlined">
              <InputLabel id="bai-label">Bài học</InputLabel>
              <Select
                labelId="bai-label"
                value={selectedBai}
                label="Bài học"
                onChange={e => setSelectedBai(e.target.value)}
              >
                <MenuItem value="ALL">Tất cả</MenuItem>
                {baiList.filter(b => b !== "ALL").map(bai => (
                  <MenuItem key={bai} value={bai}>{bai}</MenuItem>
                ))}
              </Select>
            </FormControl>

          </Box>

        </Box>

        {/* Table */}
        {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <TableContainer component={Paper} sx={{ boxShadow: "none", minWidth: 700 }}>
            <Table
              size="small"
              sx={{
                tableLayout: "fixed", // ✅ QUAN TRỌNG: CỐ ĐỊNH ĐỘ RỘNG
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 60, bgcolor: "#1976d2", color: "#fff", textAlign: "center" }}>
                    STT
                  </TableCell>
                  <TableCell sx={{ width: 180, bgcolor: "#1976d2", color: "#fff", textAlign: "center" }}>
                    Họ và tên
                  </TableCell>
                  <TableCell sx={{ width: 80, bgcolor: "#1976d2", color: "#fff", textAlign: "center" }}>
                    Tên bài học
                  </TableCell>
                  <TableCell sx={{ width: 80, bgcolor: "#1976d2", color: "#fff", textAlign: "center" }}>
                    Điểm
                  </TableCell>
                  <TableCell sx={{ width: 80, bgcolor: "#1976d2", color: "#fff", textAlign: "center" }}>
                    Thời gian
                  </TableCell>
                  <TableCell sx={{ width: 90, bgcolor: "#1976d2", color: "#fff", textAlign: "center" }}>
                    Ngày
                  </TableCell>
                  <TableCell sx={{ width: 110, bgcolor: "#1976d2", color: "#fff", textAlign: "center" }}>
                    Số lần kiểm tra
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {(results.length > 0
                  ? results
                  : Array.from({ length: 5 }, (_, i) => ({ stt: i + 1 }))
                ).map((r) => (
                  <TableRow key={r.stt}>
                    <TableCell sx={{ width: 60, textAlign: "center", border: "1px solid rgba(0,0,0,0.12)" }}>
                      {r.stt}
                    </TableCell>
                    <TableCell
                      sx={{
                        width: 180,
                        textAlign: "left",
                        border: "1px solid rgba(0,0,0,0.12)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {r.hoVaTen}
                    </TableCell>
                    <TableCell sx={{ width: 80, textAlign: "center", border: "1px solid rgba(0,0,0,0.12)" }}>
                      {r.bai}
                    </TableCell>
                    <TableCell sx={{ width: 80, textAlign: "center", border: "1px solid rgba(0,0,0,0.12)", fontWeight: "bold" }}>
                      {r.diem}
                    </TableCell>
                    <TableCell sx={{ width: 80, textAlign: "center", border: "1px solid rgba(0,0,0,0.12)" }}>
                      {r.thoiGianLamBai}
                    </TableCell>
                    <TableCell sx={{ width: 90, textAlign: "center", border: "1px solid rgba(0,0,0,0.12)" }}>
                      {r.ngayKiemTra}
                    </TableCell>
                    <TableCell sx={{ width: 110, textAlign: "center", border: "1px solid rgba(0,0,0,0.12)" }}>
                      {r.soLan}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

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
