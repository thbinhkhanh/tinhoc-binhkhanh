// src/DangCau/questions/QuestionTypeSelector.jsx
import React from "react";
import {
  Stack,
  FormControl,
  TextField,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

const QuestionTypeSelector = ({ q, qi, update }) => {
  const handleChange = (type) => {
    if (type === q.type) return;

    let patch = { type };

    // =========================
    // IMAGE → OTHER TYPE
    // 👉 CHUYỂN image → text (GIỮ LINK)
    // =========================
    if (q.type === "image" && type !== "image") {
      patch.options = (q.options || []).map((opt) => ({
        text: opt.image || opt.preview || "",
        image: opt.image || "",
      }));

      // KHÔNG XOÁ correct
    }

    // =========================
    // BACK TO IMAGE
    // 👉 text → image
    // =========================
    if (type === "image") {
      const baseOptions =
        q.options?.length > 0
          ? q.options
          : Array.from({ length: 4 }, () => ({
              text: "",
              image: "",
            }));

      patch.options = baseOptions.map((opt) => ({
        text: "",
        image: opt.image || opt.text || "",
      }));
    }

    // =========================
    // SORT
    // =========================
    if (type === "sort") {
      patch.correct =
        q.options?.map((_, i) => i) || [];
    }

    // =========================
    // MATCHING
    // =========================
    if (type === "matching") {
      patch.pairs =
        q.pairs?.length > 0
          ? q.pairs
          : Array.from({ length: 4 }, () => ({
              left: "",
              right: "",
            }));
    }

    // =========================
    // SINGLE
    // =========================
    if (type === "single") {
      patch.correct = [0];
    }

    // =========================
    // MULTIPLE
    // =========================
    if (type === "multiple") {
      patch.correct = q.correct || [];
    }

    // =========================
    // FILLBLANK
    // =========================
    if (type === "fillblank") {
      patch.option = q.option || "";
      patch.answers = q.answers || [];
    }

    update(qi, patch);
  };

  // =========================
  // SCORE FIX (QUAN TRỌNG)
  // =========================
  const handleScoreChange = (e) => {
    const v = e.target.value;
    const num = v === "" ? "" : parseFloat(v);

    if (num === q.score) return;

    update(qi, { score: num });
  };

  return (
    <Stack direction="row" spacing={2} sx={{ mb: -2 }}>
      {/* TYPE */}
      <FormControl size="small" sx={{ width: 180 }}>
        <InputLabel>Loại câu hỏi</InputLabel>
        <Select
          value={q.type}
          label="Loại câu hỏi"
          onChange={(e) => handleChange(e.target.value)}
        >
          <MenuItem value="truefalse">Đúng – Sai</MenuItem>
          <MenuItem value="single">Một lựa chọn</MenuItem>
          <MenuItem value="multiple">Nhiều lựa chọn</MenuItem>
          <MenuItem value="matching">Ghép đôi</MenuItem>
          <MenuItem value="image">Hình ảnh</MenuItem>
          <MenuItem value="sort">Sắp xếp</MenuItem>
          <MenuItem value="fillblank">Điền khuyết</MenuItem>
        </Select>
      </FormControl>

      {/* SCORE */}
      <TextField
        label="Điểm"
        type="number"
        size="small"
        value={q.score ?? ""}
        inputProps={{ step: 0.5 }}
        onChange={handleScoreChange}
        sx={{ width: 80 }}
      />
    </Stack>
  );
};

export default QuestionTypeSelector;