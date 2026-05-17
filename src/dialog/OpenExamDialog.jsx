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
  Chip,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";

import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";

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

  const [namHoc, setNamHoc] = useState("");

  const navigate = useNavigate();

  // ===== LOAD NĂM HỌC =====
  useEffect(() => {
    const loadNamHoc = async () => {
      try {
        const snap = await getDoc(doc(db, "CONFIG", "config"));

        if (snap.exists()) {
          setNamHoc(snap.data().namHoc);
        }
      } catch (err) {
        console.error("❌ Lỗi load năm học:", err);
      }
    };

    loadNamHoc();
  }, []);

  // ===== HELPER COLLECTION =====
  const getTracNghiemCollection = (lop) => {
    const num = lop.match(/\d+/)?.[0];

    if (!num || !namHoc) return null;

    const isOldYear = namHoc === "2025-2026";

    return isOldYear
      ? `TRACNGHIEM${num}`
      : `TRACNGHIEM${num}_New`;
  };

  // ===== LOAD DANH SÁCH =====
  useEffect(() => {
    if (!open) {
      setDocs([]);
      setSelectedDoc(null);
      return;
    }

    const fetchDocs = async () => {
      setLoading(true);

      try {
        const colName =
          getTracNghiemCollection(selectedClass);

        if (!colName) return;

        const snapshot = await getDocs(
          collection(db, colName)
        );

        const data = snapshot.docs
          .map((d) => ({
            id: d.id,
            ...d.data(),
          }))
          .sort((a, b) => {
            const numA =
              parseInt(a.id.match(/\d+/)?.[0] || 0);

            const numB =
              parseInt(b.id.match(/\d+/)?.[0] || 0);

            return numA - numB;
          });

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
  }, [open, selectedClass, namHoc]);

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
      navigate(
        `/trac-nghiem_test?lop=${lopParam}&bai=${docId}`
      );

      onClose();
    }
  };

  // ===== CLICK XÓA =====
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
      const collectionName =
        getTracNghiemCollection(selectedClass);

      if (!collectionName)
        throw new Error("Thiếu collection");

      // 🔥 XÓA TRẮC NGHIỆM
      await deleteDoc(
        doc(db, collectionName, deletedId)
      );

      // 🔥 XÓA TENBAI
      const lopNumber =
        selectedClass.replace("Lớp ", "");

      const isOldYear =
        namHoc === "2025-2026";

      const tenBaiCollection = isOldYear
        ? `TENBAI_Lop${lopNumber}`
        : `TENBAI_Lop${lopNumber}_New`;

      await deleteDoc(
        doc(db, tenBaiCollection, deletedId)
      );

      // 🔥 UPDATE UI
      setDocs((prev) =>
        prev.filter(
          (item) => item.id !== deletedId
        )
      );

      setSelectedDoc(null);

      setOpenDeleteDialog(false);
      setSnackbarOpen(true);
    } catch (error) {
      console.error("❌ Lỗi khi xóa:", error);
    }
  };

  return (
  <>
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          height: "82vh",
          borderRadius: "14px",
          overflow: "hidden",
          background: "#f8fafc",
          boxShadow: "0 10px 35px rgba(0,0,0,0.12)",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          px: 3,
          py: 1.4,
          background: "#1976d2",
          color: "#fff",
          flexShrink: 0,
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
              Danh sách đề kiểm tra
            </Typography>
          </Box>

          <IconButton
            onClick={onClose}
            sx={{
              color: "#fff",
              bgcolor: "rgba(255,255,255,0.12)",

              "&:hover": {
                bgcolor: "rgba(255,255,255,0.2)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* FILTER */}
      <Box
        sx={{
          px: 3,
          pt: 2.5,
          pb: 2,
          flexShrink: 0,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
        >
          <FormControl
            size="small"
            sx={{
              minWidth: 170,
            }}
          >
            <InputLabel>Lớp</InputLabel>

            <Select
              value={selectedClass}
              onChange={(e) =>
                setSelectedClass(e.target.value)
              }
              label="Lớp"
              sx={{
                bgcolor: "#fff",
                borderRadius: "5px",

                "& .MuiOutlinedInput-notchedOutline":
                  {
                    borderColor: "#dbe2ea",
                  },

                "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                  {
                    borderColor: "#1976d2",
                    borderWidth: 2,
                  },
              }}
            >
              {[3, 4, 5].map((n) => (
                <MenuItem
                  key={n}
                  value={`Lớp ${n}`}
                >
                  Lớp {n}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Chip
            label={`${docs.length} đề`}
            sx={{
              bgcolor: "#e3f2fd",
              color: "#1976d2",
              fontWeight: 700,
              borderRadius: "5px",
            }}
          />
        </Stack>
      </Box>

      {/* CONTENT */}
      <DialogContent
        sx={{
          flex: 1,
          overflow: "hidden",
          px: 3,
          pt: 0,
          pb: 2,
        }}
      >
        <Box
          sx={{
            height: "100%",
            overflowY: "auto",
            borderRadius: "5px",
            bgcolor: "#fff",
            border: "1px solid #e2e8f0",
            p: 1.2,

            "&::-webkit-scrollbar": {
              width: 6,
            },

            "&::-webkit-scrollbar-thumb": {
              background: "#cbd5e1",
              borderRadius: 999,
            },
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
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                color: "#94a3b8",
              }}
            >
              <DescriptionOutlinedIcon
                sx={{
                  fontSize: 50,
                  mb: 1,
                  opacity: 0.5,
                }}
              />

              <Typography
                sx={{
                  fontWeight: 600,
                }}
              >
                Không có đề nào
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1}>
              {docs.map((docItem) => {
                const isSelected =
                  selectedDoc === docItem.id;

                return (
                  <Box
                    key={docItem.id}
                    onClick={() =>
                      setSelectedDoc(docItem.id)
                    }
                    sx={{
                      p: 1.6,
                      borderRadius: "5px",
                      cursor: "pointer",
                      transition: ".18s",

                      border: isSelected
                        ? "2px solid #1976d2"
                        : "1px solid #e2e8f0",

                      bgcolor: isSelected
                        ? "#f0f7ff"
                        : "#fff",

                      "&:hover": {
                        bgcolor: "#f8fbff",
                        borderColor: "#90caf9",
                      },
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1.5}
                    >
                      {/* TITLE */}
                      <Typography
                        sx={{
                          flex: 1,
                          fontSize: 15,
                          fontWeight: 500,
                          color: "#1e293b",
                          lineHeight: 1.5,
                          fontFamily: "Roboto, sans-serif",
                        }}
                      >
                        {docItem.id}
                      </Typography>

                      {/* RADIO */}
                      <Box
                        sx={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",

                          border: isSelected
                            ? "5px solid #1976d2"
                            : "2px solid #cbd5e1",

                          transition: ".2s",
                          flexShrink: 0,
                        }}
                      />
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>
      </DialogContent>

      {/* FOOTER */}
      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          pt: 1,
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            textTransform: "none",
            color: "#64748b",
            fontWeight: 600,
          }}
        >
          Đóng
        </Button>

        <Button
          variant="contained"
          color="error"
          disabled={!selectedDoc}
          startIcon={<DeleteOutlineIcon />}
          onClick={handleDeleteClick}
          sx={{
            textTransform: "none",
            borderRadius: "12px",
            px: 3,
            fontWeight: 700,
            boxShadow: "none",
          }}
        >
          Xóa đề
        </Button>
      </DialogActions>
    </Dialog>

    {/* CONFIRM DELETE */}
    <DeleteConfirmDialog
      open={openDeleteDialog}
      onClose={() =>
        setOpenDeleteDialog(false)
      }
      onConfirm={handleConfirmDelete}
      examName={selectedDoc}
    />

    {/* SNACKBAR */}
    <Snackbar
      open={snackbarOpen}
      autoHideDuration={3000}
      onClose={() => setSnackbarOpen(false)}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
    >
      <Alert
        severity="success"
        variant="filled"
        sx={{
          borderRadius: "12px",
          fontWeight: 600,
        }}
      >
        ✅ Đã xóa đề thành công
      </Alert>
    </Snackbar>
  </>
);
};

export default OpenExamDialog;