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
      // fullWidth bỏ đi, maxWidth không cần thiết nữa
      PaperProps={{
        sx: {
          width: "fit-content",  // tự co theo nội dung
          minWidth: 300,         // có thể set minWidth nếu muốn
          borderRadius: 3,
          p: 3,
          bgcolor: "#e3f2fd",
          boxShadow: "0 4px 12px rgba(33, 150, 243, 0.15)",
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

      <DialogContent>
        <Typography
          sx={{ fontSize: 16, color: "#0d47a1", whiteSpace: "nowrap" }} // ngăn xuống dòng
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