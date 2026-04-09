// src/dialog/ExitAddLessonDialog.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";

const ExitAddLessonDialog = ({
  open,
  onClose,
  onConfirmExit, // callback để reset lessonInput + restore prevLesson/prevQuestions
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 450,                             // chiều rộng cố định giống ExportDialog
          borderRadius: 2,                        // bo góc nhẹ
          p: 3,
          bgcolor: "#fff",                         // nền trắng
          boxShadow: "0px 8px 24px rgba(0,0,0,0.12)", // shadow hiện đại
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Box
          sx={{
            bgcolor: "#42a5f5",    // icon xanh đậm
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
          ⚠️
        </Box>
        <DialogTitle sx={{ p: 0, fontWeight: "bold", color: "#1565c0" }}>
          Cảnh báo
        </DialogTitle>
      </Box>

      <DialogContent sx={{ pt: 0 }}>
        <Typography
          sx={{ fontSize: 16, color: "#0d47a1", whiteSpace: "nowrap" }}
        >
          Dữ liệu chưa lưu sẽ mất. Bạn có chắc chắn muốn thoát?
        </Typography>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pt: 2 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Hủy
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirmExit}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Xác nhận
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExitAddLessonDialog;