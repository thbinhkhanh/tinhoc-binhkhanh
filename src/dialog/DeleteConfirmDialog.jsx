// src/dialog/DeleteConfirmDialog.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
} from "@mui/material";

import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

const DeleteConfirmDialog = ({
  open,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "14px",
          overflow: "hidden",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.12)",
        },
      }}
    >
      {/* HEADER */}
      <DialogTitle
        sx={{
          px: 3,
          pt: 2.5,
          pb: 1,
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(244,67,54,0.12)",
              flexShrink: 0,
            }}
          >
            <WarningAmberRoundedIcon
              sx={{
                color: "#f44336",
                fontSize: 24,
              }}
            />
          </Box>

          <Typography
            sx={{
              fontSize: 20,
              fontWeight: 700,
              color: "#d32f2f",
            }}
          >
            Xác nhận xóa
          </Typography>
        </Stack>
      </DialogTitle>

      {/* CONTENT */}
      <DialogContent
        sx={{
          px: 3,
          pt: 1,
          pb: 1,
        }}
      >
        <Typography
          sx={{
            color: "#475569",
            lineHeight: 1.7,
            fontSize: 15,
          }}
        >
          Bạn có chắc chắn muốn xóa đề thi này?
          <br />
          Hành động này{" "}
          <Box
            component="span"
            sx={{
              fontWeight: 700,
            }}
          >
            không thể hoàn tác
          </Box>
          .
        </Typography>
      </DialogContent>

      {/* ACTIONS */}
      <DialogActions
        sx={{
          px: 3,
          pb: 2.5,
          pt: 1,
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          width="100%"
        >
          <Button
            onClick={onClose}
            variant="outlined"
            fullWidth
            sx={{
              textTransform: "none",
              borderRadius: "10px",
              fontWeight: 600,
              borderColor: "#cbd5e1",
              color: "#475569",

              "&:hover": {
                borderColor: "#94a3b8",
                bgcolor: "#f8fafc",
              },
            }}
          >
            Hủy
          </Button>

          <Button
            onClick={onConfirm}
            variant="contained"
            color="error"
            fullWidth
            sx={{
              textTransform: "none",
              borderRadius: "10px",
              fontWeight: 700,
              boxShadow: "none",

              "&:hover": {
                boxShadow: "none",
              },
            }}
          >
            Xóa
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmDialog;