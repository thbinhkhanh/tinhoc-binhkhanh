import React from "react";

// MUI
import {
  Box,
  Stack,
  Typography,
  Paper,
  Divider,
  Grid,
  Button,
  Radio,
  Checkbox,
  FormControl,
  Select,
  MenuItem
} from "@mui/material";

// Drag and Drop
import {
  DragDropContext,
  Droppable,
  Draggable
} from "@hello-pangea/dnd";

const QuestionRenderer = ({
  loading,
  currentQuestion,
  normalizeValue,
  currentIndex,
  answers,
  setAnswers,
  submitted,
  started,
  choXemDapAn,
  handleSingleSelect,
  handleMultipleSelect,
  handleDragEnd,
  reorder,
  ratio,
  setZoomImage
}) => {
  if (loading || !currentQuestion) return null;

  return (
    <Box key={currentQuestion.id || currentIndex}>
      {!loading && currentQuestion && (
            <Box key={currentQuestion.id || currentIndex}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>
                <strong>Câu {currentIndex + 1}:</strong>{" "}
                <span
                  dangerouslySetInnerHTML={{
                    __html: (currentQuestion.question || "").replace(/^<p>|<\/p>$/g, "")
                  }}
                />
              </Typography>

              {currentQuestion.image && (
                <Box sx={{ width: "100%", textAlign: "center", mb: 2 }}>
                  <img
                    src={currentQuestion.image}
                    alt="question"
                    style={{
                      maxWidth: "100%",
                      maxHeight: 150,
                      objectFit: "contain",
                      borderRadius: 8
                    }}
                  />
                </Box>
              )}

              {/* SORT */}
              {currentQuestion.type === "sort" && (
                <Box sx={{ mt: 0 }}>
                  {currentQuestion.questionImage && (
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                      <Box
                        sx={{
                          maxHeight: 150,          // 🔥 chỉnh khung nhỏ ở đây
                          maxWidth: "100%",
                          overflow: "hidden",
                          borderRadius: 2,
                          border: "1px solid #ddd", // 🔥 khung hiện rõ
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          bgcolor: "#fafafa",
                        }}
                      >
                        <img
                          src={currentQuestion.questionImage}
                          alt="Hình minh họa"
                          style={{
                            maxHeight: 150,        // 🔥 trùng với Box
                            maxWidth: "100%",
                            objectFit: "contain",
                            cursor: "zoom-in",
                          }}
                          onClick={() => setZoomImage(currentQuestion.questionImage)}
                        />
                      </Box>
                    </Box>
                  )}

                  <DragDropContext
                    onDragEnd={(result) => {
                      if (!result.destination || submitted || !started) return;

                      const currentOrder =
                        answers[currentQuestion.id] ??
                        currentQuestion.options.map((_, idx) => idx);

                      const newOrder = reorder(
                        currentOrder,
                        result.source.index,
                        result.destination.index
                      );

                      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: newOrder }));
                    }}
                  >
                    <Droppable droppableId="sort-options">
                      {(provided) => {
                        const orderIdx =
                          answers[currentQuestion.id] ??
                          currentQuestion.options.map((_, idx) => idx);

                        return (
                          <Stack {...provided.droppableProps} ref={provided.innerRef} spacing={2}>
                            {orderIdx.map((optIdx, pos) => {
                              const optionData = currentQuestion.options[optIdx];
                              const optionText =
                                typeof optionData === "string" ? optionData : optionData.text ?? "";
                              const optionImage =
                                typeof optionData === "object" ? optionData.image ?? null : null;

                              // ✅ So sánh với correctTexts thay vì correct index
                              const correctData = currentQuestion.correctTexts[pos];
                              const isCorrectPos =
                                submitted &&
                                choXemDapAn &&
                                normalizeValue(optionData) === normalizeValue(correctData);

                              return (
                                <Draggable
                                  key={optIdx}
                                  draggableId={String(optIdx)}
                                  index={pos}
                                  isDragDisabled={submitted || !started}
                                >
                                  {(provided, snapshot) => (
                                    <Box
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      sx={{
                                        borderRadius: 1,
                                        bgcolor:
                                          submitted && choXemDapAn
                                            ? isCorrectPos
                                              ? "#c8e6c9" // xanh lá nhạt = đúng
                                              : "#ffcdd2" // đỏ nhạt = sai
                                            : "transparent",
                                        border: "1px solid #90caf9",
                                        cursor: submitted || !started ? "default" : "grab",
                                        boxShadow: "none",
                                        transition: "background-color 0.2s ease, border-color 0.2s ease",
                                        minHeight: 40,
                                        py: 0.5,
                                        px: 1,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        "&:hover": {
                                          borderColor: "#1976d2",
                                          bgcolor: "#f5f5f5",
                                        },
                                      }}
                                    >
                                      {optionImage && (
                                        <Box
                                          component="img"
                                          src={optionImage}
                                          alt={`option-${optIdx}`}
                                          sx={{
                                            maxHeight: 40,
                                            width: "auto",
                                            objectFit: "contain",
                                            borderRadius: 2,
                                            flexShrink: 0,
                                          }}
                                        />
                                      )}

                                      <Typography
                                        variant="body1"
                                        fontWeight="400"
                                        sx={{
                                          userSelect: "none",
                                          fontSize: "1.1rem",
                                          lineHeight: 1.5,
                                          flex: 1,
                                          whiteSpace: "pre-wrap",
                                          "& p": { margin: 0 },
                                        }}
                                        component="div"
                                        dangerouslySetInnerHTML={{ __html: optionText }}
                                      />
                                    </Box>
                                  )}
                                </Draggable>
                              );
                            })}
                            {provided.placeholder}
                          </Stack>
                        );
                      }}
                    </Droppable>
                  </DragDropContext>
                </Box>
              )}

              {/* MATCH */}
              {currentQuestion.type === "matching" && (
                <Box sx={{ width: "100%" }}>
                  {/* ================= HÌNH MINH HỌA DƯỚI CÂU HỎI ================= */}
                  {currentQuestion.questionImage && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          maxHeight: 150, // 🔥 đổi 100 nếu bạn muốn
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={currentQuestion.questionImage}
                          alt="Hình minh họa"
                          style={{
                            maxHeight: 150,
                            maxWidth: "100%",
                            height: "auto",
                            objectFit: "contain",
                            borderRadius: 8,
                            display: "block",
                            cursor: "zoom-in",
                          }}
                          onClick={() => setZoomImage(currentQuestion.questionImage)}
                        />

                      </Box>
                    </Box>
                  )}

                  {/* ================= MATCHING ================= */}
                  <DragDropContext
                    onDragEnd={(result) => {
                      if (!result.destination || submitted || !started) return;

                      const currentOrder =
                        answers[currentQuestion.id] ??
                        currentQuestion.pairs.map((_, idx) => idx);

                      const newOrder = reorder(
                        currentOrder,
                        result.source.index,
                        result.destination.index
                      );

                      setAnswers((prev) => ({
                        ...prev,
                        [currentQuestion.id]: newOrder,
                      }));
                    }}
                  >
                    <Stack spacing={1.5} sx={{ width: "100%", px: 1 }}>
                      {currentQuestion.pairs.map((pair, i) => {
                        const optionText = pair.left || "";
                        const optionImage =
                          pair.leftImage?.url || pair.leftIconImage?.url || null;

                        const userOrder =
                          answers[currentQuestion.id] ??
                          currentQuestion.rightOptions.map((_, idx) => idx);

                        const rightIdx = userOrder[i];
                        const rightVal = currentQuestion.rightOptions[rightIdx];
                        const rightText = typeof rightVal === "string" ? rightVal : "";
                        const rightImage =
                          typeof rightVal === "object" ? rightVal?.url : null;

                        const isCorrect =
                          submitted && userOrder[i] === currentQuestion.correct[i];

                        return (
                          <Stack
                            key={i}
                            direction="row"
                            spacing={2}
                            alignItems="stretch"
                            sx={{ minHeight: 50 }}
                          >
                            {/* ================= LEFT ================= */}
                            <Paper
                              sx={{
                                flexGrow: ratio.left,
                                flexBasis: 0,
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                px: 1,
                                py: 0.5,
                                border: "1px solid #64b5f6",
                                borderRadius: 1,
                                boxShadow: "none",
                              }}
                            >
                              {optionImage && (
                                <Box
                                  sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    maxHeight: 40,      // khung tối đa 40
                                    mr: 1,
                                    flexShrink: 0,
                                    overflow: "hidden",
                                  }}
                                >
                                  <img
                                    src={optionImage}
                                    alt={`left-${i}`}
                                    style={{
                                      maxHeight: 40,    // ⭐ QUAN TRỌNG: trùng với Box
                                      width: "auto",
                                      height: "auto",
                                      objectFit: "contain",
                                      borderRadius: 2,
                                      display: "block",
                                    }}
                                  />
                                </Box>
                              )}

                              {optionText && (
                                <Typography
                                  component="div"
                                  sx={{
                                    fontSize: "1.1rem",
                                    flex: 1,
                                    wordBreak: "break-word",
                                    whiteSpace: "pre-wrap",
                                    lineHeight: 1.5,
                                    "& p": { margin: 0 },
                                  }}
                                  dangerouslySetInnerHTML={{ __html: optionText }}
                                />
                              )}
                            </Paper>

                            {/* ================= RIGHT ================= */}
                            <Droppable droppableId={`right-${i}`} direction="vertical">
                              {(provided) => (
                                <Stack
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  sx={{ flexGrow: ratio.right, flexBasis: 0, }}
                                >
                                  <Draggable
                                    key={rightIdx}
                                    draggableId={String(rightIdx)}
                                    index={i}
                                    isDragDisabled={submitted || !started}
                                  >
                                    {(provided) => (
                                      <Paper
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        sx={{
                                          flex: 1,
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 1.5,
                                          px: 1,
                                          py: 0.5,
                                          border: "1px solid #90caf9",
                                          borderRadius: 1,
                                          boxShadow: "none",
                                          cursor:
                                            submitted || !started ? "default" : "grab",
                                          bgcolor:
                                            submitted && choXemDapAn
                                              ? isCorrect
                                                ? "#c8e6c9"
                                                : "#ffcdd2"
                                              : "transparent",
                                          transition:
                                            "background-color 0.2s ease, border-color 0.2s ease",
                                          "&:hover": {
                                            borderColor: "#1976d2",
                                            bgcolor: "#f5f5f5",
                                          },
                                        }}
                                      >
                                        {rightImage && (
                                          <Box
                                            sx={{
                                              display: "inline-flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              maxHeight: 40,
                                              mr: 1,
                                              flexShrink: 0,
                                            }}
                                          >
                                            <img
                                              src={rightImage}
                                              alt={`right-${rightIdx}`}
                                              style={{
                                                maxHeight: 40,
                                                width: "auto",
                                                height: "auto",
                                                objectFit: "contain",
                                                borderRadius: 2,
                                                display: "block",
                                              }}
                                            />
                                          </Box>
                                        )}

                                        {rightText && (
                                          <Typography
                                            component="div"
                                            sx={{
                                              fontSize: "1.1rem",
                                              flex: 1,
                                              wordBreak: "break-word",
                                              whiteSpace: "pre-wrap",
                                              lineHeight: 1.5,
                                              "& p": { margin: 0 },
                                            }}
                                            dangerouslySetInnerHTML={{
                                              __html: rightText,
                                            }}
                                          />
                                        )}
                                      </Paper>
                                    )}
                                  </Draggable>
                                  {provided.placeholder}
                                </Stack>
                              )}
                            </Droppable>
                          </Stack>
                        );
                      })}
                    </Stack>
                  </DragDropContext>
                </Box>
              )}

              {/* 1. Single */}
              {currentQuestion.type === "single" && (
                <Stack spacing={2}>
                  {/* Hình minh họa câu hỏi nếu có */}
                  {currentQuestion.questionImage && (
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                      {/* 🔲 KHUNG ẢNH */}
                      <Box
                        sx={{
                          maxHeight: 150,          // 🔥 chỉnh nhỏ khung tại đây
                          maxWidth: "100%",
                          overflow: "hidden",
                          borderRadius: 1,
                          border: "1px solid #ddd",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          bgcolor: "#fafafa",
                        }}
                      >
                        <img
                          src={currentQuestion.questionImage}
                          alt="Hình minh họa"
                          style={{
                            maxHeight: 150,        // 🔥 trùng với khung
                            maxWidth: "100%",
                            height: "auto",
                            objectFit: "contain",
                            borderRadius: 4,
                            cursor: "zoom-in",
                          }}
                          onClick={() => setZoomImage(currentQuestion.questionImage)}
                        />
                      </Box>
                    </Box>
                  )}
                  {currentQuestion.displayOrder.map((optIdx) => {
                    const selected = answers[currentQuestion.id] === optIdx;

                    const correctArray = Array.isArray(currentQuestion.correct)
                      ? currentQuestion.correct
                      : [currentQuestion.correct];

                    const isCorrect = submitted && correctArray.includes(optIdx);
                    const isWrong = submitted && selected && !correctArray.includes(optIdx);

                    const handleSelect = () => {
                      if (submitted || !started) return;
                      handleSingleSelect(currentQuestion.id, optIdx);
                    };

                    // Lấy dữ liệu option
                    const optionData = currentQuestion.options[optIdx];
                    const optionText =
                      typeof optionData === "object" && optionData.text
                        ? optionData.text
                        : typeof optionData === "string"
                        ? optionData
                        : "";
                    const optionImage =
                      typeof optionData === "object" && optionData.image
                        ? optionData.image
                        : null;

                    return (
                      <Paper
                        key={optIdx}
                        onClick={handleSelect}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          borderRadius: 1,
                          cursor: submitted || !started ? "default" : "pointer",
                          bgcolor:
                            submitted && choXemDapAn
                              ? isCorrect
                                ? "#c8e6c9"
                                : isWrong
                                ? "#ffcdd2"
                                : "transparent"   // 👈 nền mặc định trong suốt
                              : "transparent",
                          border: "1px solid #90caf9",
                          minHeight: 40,
                          py: 0.5,
                          px: 1,
                          boxShadow: "none",          // 👈 bỏ đổ bóng
                          transition: "background-color 0.2s ease, border-color 0.2s ease",
                          "&:hover": {
                            borderColor: "#1976d2",
                            bgcolor: "#f5f5f5",       // 👈 highlight khi hover
                          },
                        }}
                      >
                        {/* Radio button */}
                        <Radio checked={selected} onChange={handleSelect} sx={{ mr: 1 }} />

                        {/* Hình option nếu có */}
                        {optionImage && (
                          <Box
                            component="img"
                            src={optionImage}
                            alt={`option-${optIdx}`}
                            sx={{
                              maxHeight: 40,
                              maxWidth: "auto",
                              objectFit: "contain",
                              borderRadius: 2,
                              flexShrink: 0,
                            }}
                          />
                        )}

                        {/* Text option */}
                        <Typography
                          variant="body1"
                          sx={{
                            userSelect: "none",
                            fontSize: "1.1rem",
                            lineHeight: 1.5,
                            flex: 1,
                            whiteSpace: "pre-wrap",
                            "& p": { margin: 0 },
                          }}
                          component="div"
                          dangerouslySetInnerHTML={{ __html: optionText }}
                        />
                      </Paper>
                    );
                  })}
                </Stack>
              )}

              {/* 2. Multiple */}
              {currentQuestion.type === "multiple" && (
                <Stack spacing={2}>
                  {/* Hình minh họa câu hỏi nếu có */}
                  {currentQuestion.questionImage && (
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                      {/* 🔲 KHUNG ẢNH */}
                      <Box
                        sx={{
                          maxHeight: 150,        // 🔥 khung nhỏ lại
                          maxWidth: "100%",
                          overflow: "hidden",
                          borderRadius: 1,
                          border: "1px solid #ddd",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "#fafafa",
                        }}
                      >
                        <img
                          src={currentQuestion.questionImage}
                          alt="Hình minh họa"
                          style={{
                            maxHeight: 150,      // 🔥 ảnh co theo khung
                            maxWidth: "100%",
                            height: "auto",
                            objectFit: "contain",
                            borderRadius: 8,
                            cursor: "zoom-in",
                          }}
                          onClick={() => setZoomImage(currentQuestion.questionImage)}
                        />
                      </Box>
                    </Box>
                  )}

                  {currentQuestion.displayOrder.map((optIdx) => {
                    const optionData = currentQuestion.options[optIdx];
                    const optionText = optionData.text ?? "";
                    const optionImage = optionData.image ?? null;

                    const userAns = answers[currentQuestion.id] || [];
                    const checked = userAns.includes(optIdx);

                    const isCorrect =
                      submitted && currentQuestion.correct.includes(optIdx);
                    const isWrong =
                      submitted && checked && !currentQuestion.correct.includes(optIdx);

                    const handleSelect = () => {
                      if (submitted || !started) return;
                      handleMultipleSelect(currentQuestion.id, optIdx, !checked);
                    };

                    return (
                      <Paper
                        key={optIdx}
                        onClick={handleSelect}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          borderRadius: 1,
                          cursor: submitted || !started ? "default" : "pointer",
                          bgcolor:
                            submitted && choXemDapAn
                              ? isCorrect
                                ? "#c8e6c9"
                                : isWrong
                                ? "#ffcdd2"
                                : "transparent"   // 👈 nền mặc định trong suốt
                              : "transparent",
                          border: "1px solid #90caf9",
                          minHeight: 40,
                          py: 0.5,
                          px: 1,
                          gap: 1,
                          boxShadow: "none",          // 👈 bỏ đổ bóng
                          transition: "background-color 0.2s ease, border-color 0.2s ease",
                          "&:hover": {
                            borderColor: "#1976d2",
                            bgcolor: "#f5f5f5",       // 👈 highlight khi hover
                          },
                        }}
                      >
                        {/* Checkbox */}
                        <Checkbox
                          checked={checked}
                          onChange={handleSelect}
                          sx={{ mr: 1 }}
                        />

                        {/* Hình option nếu có */}
                        {optionImage && (
                          <Box
                            component="img"
                            src={optionImage}
                            alt={`option-${optIdx}`}
                            sx={{
                              maxHeight: 40,
                              maxWidth: 40,
                              objectFit: "contain",
                              borderRadius: 2,
                              flexShrink: 0,
                            }}
                          />
                        )}

                        {/* Text option */}
                        <Typography
                          variant="body1"
                          sx={{
                            userSelect: "none",
                            fontSize: "1.1rem",
                            lineHeight: 1.5,
                            flex: 1,
                            whiteSpace: "pre-wrap",
                            "& p": { margin: 0 },
                          }}
                          component="div"
                          dangerouslySetInnerHTML={{ __html: optionText }}
                        />
                      </Paper>
                    );
                  })}
                </Stack>
              )}

              {/* TRUE / FALSE */}
              {currentQuestion.type === "truefalse" && (
                <Stack spacing={2}>
                  {/* Hiển thị hình minh họa nếu có, căn giữa */}
                  {currentQuestion.questionImage && (
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                      {/* 🔲 KHUNG ẢNH */}
                      <Box
                        sx={{
                          maxHeight: 150,          // 🔥 chiều cao khung
                          maxWidth: "100%",
                          border: "1px solid #ddd", // 🔥 viền khung
                          borderRadius: 1,
                          padding: 1,
                          backgroundColor: "#fafafa",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={currentQuestion.questionImage}
                          alt="Hình minh họa"
                          style={{
                            maxHeight: 150,        // 🔥 ảnh co theo khung
                            maxWidth: "100%",
                            height: "auto",
                            objectFit: "contain",
                            borderRadius: 4,
                            cursor: "zoom-in",
                          }}
                          onClick={() => setZoomImage(currentQuestion.questionImage)}
                        />
                      </Box>
                    </Box>
                  )}

                  
                  {currentQuestion.options.map((opt, i) => {
                    const userAns = answers[currentQuestion.id] || [];
                    const selected = userAns[i] ?? "";

                    const originalIdx = Array.isArray(currentQuestion.initialOrder)
                      ? currentQuestion.initialOrder[i]
                      : i;

                    const correctArray = Array.isArray(currentQuestion.correct)
                      ? currentQuestion.correct
                      : [];

                    const correctVal = correctArray[originalIdx] ?? "";

                    const showResult = submitted && choXemDapAn;
                    const isCorrect = showResult && selected === correctVal;
                    const isWrong   = showResult && selected !== "" && selected !== correctVal;

                    return (
                      <Paper
                        key={i}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          borderRadius: 1,
                          minHeight: 40,          // 👈 giống single choice
                          py: 0.5,
                          px: 1,
                          bgcolor: isCorrect ? "#c8e6c9"
                                : isWrong   ? "#ffcdd2"
                                : "transparent",
                          border: "1px solid #90caf9",
                          boxShadow: "none",
                          transition: "background-color 0.2s ease, border-color 0.2s ease",
                          "&:hover": {
                            borderColor: "#1976d2",
                            bgcolor: "#f5f5f5",
                          },
                        }}
                      >
                        {/* Text option */}
                        <Typography
                          variant="body1"
                          component="div"
                          sx={{
                            userSelect: "none",
                            fontSize: "1.1rem",
                            lineHeight: 1.5,
                            flex: 1,
                            whiteSpace: "pre-wrap",
                            "& p": { margin: 0 },
                          }}
                          dangerouslySetInnerHTML={{ __html: opt }}
                        />

                        {/* Dropdown nhỏ gọn */}
                        <FormControl size="small" sx={{ width: 90 }}>
                          <Select
                            value={selected}
                            onChange={(e) => {
                              if (submitted || !started) return;
                              const val = e.target.value; // "Đ" | "S"
                              setAnswers((prev) => {
                                const arr = Array.isArray(prev[currentQuestion.id])
                                  ? [...prev[currentQuestion.id]]
                                  : Array(currentQuestion.options.length).fill("");
                                arr[i] = val;
                                return { ...prev, [currentQuestion.id]: arr };
                              });
                            }}
                            sx={{
                              height: 32,          // 👈 giảm chiều cao dropdown
                              fontSize: "0.95rem",
                              "& .MuiSelect-select": {
                                py: 0.5,
                              },
                            }}
                          >
                            <MenuItem value="Đ" sx={{ minHeight: 32, fontSize: "0.95rem" }}>
                              Đúng
                            </MenuItem>
                            <MenuItem value="S" sx={{ minHeight: 32, fontSize: "0.95rem" }}>
                              Sai
                            </MenuItem>
                          </Select>
                        </FormControl>
                      </Paper>
                    );
                  })}
                </Stack>
              )}

              {/* IMAGE MULTIPLE */}
              {currentQuestion.type === "image" && (
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  gap={2}
                  flexWrap="wrap"
                  justifyContent="center"
                  alignItems="center"
                  width="100%"
                >
                  {currentQuestion.displayOrder.map((optIdx) => {
                    const userAns = answers[currentQuestion.id] || [];
                    const checked = userAns.includes(optIdx);

                    const isCorrect = submitted && currentQuestion.correct.includes(optIdx);
                    const isWrong = submitted && checked && !currentQuestion.correct.includes(optIdx);

                    // ký hiệu đáp án đúng/sai
                    const bullet = submitted
                      ? isCorrect
                        ? "[●]" // hình đúng
                        : "( )" // hình sai
                      : "( )"; // chưa nộp thì tất cả là ( )

                    return (
                      <Paper
                        key={optIdx}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 1,
                          p: 1,
                          border: "1px solid #90caf9",
                          cursor: submitted || !started ? "default" : "pointer",

                          width: { xs: 150, sm: 150 },
                          height: { xs: "auto", sm: 180 },
                          boxSizing: "border-box",
                        }}
                        onClick={() => {
                          if (submitted || !started) return;
                          handleMultipleSelect(currentQuestion.id, optIdx, !checked);
                        }}
                      >
                        {/* bullet + số thứ tự */}
                        {/*<div style={{ marginBottom: 4, fontSize: 14 }}>
                          {bullet} Hình {optIdx + 1}
                        </div>*/}

                        {/* hình ảnh */}
                        <img
                          src={currentQuestion.options[optIdx]}
                          alt={`option ${optIdx + 1}`}
                          style={{
                            maxWidth: "70%",     // 🔽 giảm chiều ngang
                            maxHeight: 70,       // 🔽 giảm chiều cao
                            objectFit: "contain",
                            marginBottom: 8,
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />

                        {/* checkbox để chọn */}
                        <Checkbox
                          checked={checked}
                          disabled={submitted || !started}
                          onChange={() =>
                            handleMultipleSelect(currentQuestion.id, optIdx, !checked)
                          }
                          sx={{
                            color: !submitted
                              ? undefined
                              : isCorrect
                              ? "#388e3c"
                              : isWrong
                              ? "#d32f2f"
                              : undefined,
                            "&.Mui-checked": {
                              color: !submitted
                                ? undefined
                                : isCorrect
                                ? "#388e3c"
                                : isWrong
                                ? "#d32f2f"
                                : undefined,
                            },
                          }}
                        />
                      </Paper>
                    );
                  })}
                </Stack>
              )}

              {/* FILLBLANK */}
              {currentQuestion.type === "fillblank" && (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Stack spacing={2}>
                    {/* ======================= HÌNH MINH HỌA ======================= */}
                    {currentQuestion.questionImage && (
                      <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                        <Box
                          sx={{
                            maxHeight: 150,
                            maxWidth: "100%",
                            overflow: "hidden",
                            borderRadius: 2,
                            border: "1px solid #ddd",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            bgcolor: "#fafafa",
                          }}
                        >
                          <img
                            src={currentQuestion.questionImage}
                            alt="Hình minh họa"
                            style={{
                              maxHeight: 150,
                              maxWidth: "100%",
                              objectFit: "contain",
                              cursor: "zoom-in",
                            }}
                            onClick={() => setZoomImage(currentQuestion.questionImage)}
                          />
                        </Box>
                      </Box>
                    )}

                    {/* ======================= CÂU HỎI + CHỖ TRỐNG ======================= */}
                    <Box
                      sx={{
                        width: "100%",
                        lineHeight: 1.6,
                        fontSize: "1.1rem",
                        whiteSpace: "normal",
                        fontFamily: "Roboto, Arial, sans-serif",
                      }}
                    >
                      {currentQuestion.option.split("[...]").map((part, idx) => (
                        <span key={idx} style={{ display: "inline", fontFamily: "Roboto, Arial, sans-serif" }}>
                          
                          {/* Phần văn bản */}
                          <Typography
                            component="span"
                            variant="body1"
                            sx={{
                              mr: 0.5,
                              lineHeight: 1.5,
                              fontSize: "1.1rem",
                              "& p, & div": { display: "inline", margin: 0 }
                            }}
                            dangerouslySetInnerHTML={{
                              __html: part.replace(
                                /<\/p>\s*<p>/g,
                                "</p><p><br /></p><p><br /></p><p>"
                              ),
                            }}
                          />

                          {/* Chỗ trống */}
                          {idx < currentQuestion.option.split("[...]").length - 1 && (
                            <Droppable droppableId={`blank-${idx}`} direction="horizontal">
                              {(provided) => {
                                const userWord = currentQuestion.filled?.[idx] ?? "";
                                const correctWord = currentQuestion.options?.[idx] ?? "";
                                const color =
                                  submitted && userWord
                                    ? userWord.trim() === correctWord.trim()
                                      ? "green"
                                      : "red"
                                    : "#000";

                                return (
                                  <Box
                                    component="span"
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    sx={{
                                      display: "inline-flex",
                                      alignItems: "baseline",
                                      justifyContent: "center",
                                      minWidth: 80,
                                      maxWidth: 300,
                                      px: 1,
                                      border: "1px dashed #90caf9",
                                      borderRadius: 1,
                                      fontFamily: "Roboto, Arial, sans-serif",
                                      fontSize: "1.1rem",
                                      lineHeight: "normal",
                                      color: color,
                                      verticalAlign: "baseline",
                                    }}
                                  >
                                    {userWord && (
                                      <Draggable draggableId={`filled-${idx}`} index={0}>
                                        {(prov) => (
                                          <Paper
                                            ref={prov.innerRef}
                                            {...prov.draggableProps}
                                            {...prov.dragHandleProps}
                                            sx={{
                                              px: 2,
                                              py: 0.5,
                                              bgcolor: "#e3f2fd",
                                              cursor: "grab",
                                              fontFamily: "Roboto, Arial, sans-serif",
                                              fontSize: "1.1rem",
                                              display: "inline-flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              minHeight: 30,
                                              maxWidth: "100%",
                                              color: color,
                                              border: "1px solid #90caf9",   // 👈 thêm border
                                              boxShadow: "none",             // 👈 bỏ đổ bóng
                                              "&:hover": { bgcolor: "#bbdefb" }, // 👈 hover nhẹ
                                            }}
                                          >
                                            {userWord}
                                          </Paper>
                                        )}
                                      </Draggable>
                                    )}
                                    {provided.placeholder}
                                  </Box>
                                );
                              }}
                            </Droppable>
                          )}
                        </span>
                      ))}
                    </Box>

                    {/* ======================= KHU VỰC THẺ TỪ ======================= */}
                    <Box sx={{ mt: 2, textAlign: "left" }}>
                      <Typography sx={{ mb: 1, fontWeight: "bold", fontSize: "1.1rem", fontFamily: "Roboto, Arial, sans-serif" }}>
                        Các từ cần điền:
                      </Typography>

                      <Droppable droppableId="words" direction="horizontal">
                        {(provided) => (
                          <Box
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 1,
                              minHeight: 50,
                              maxHeight: 80,
                              p: 1,
                              border: "1px solid #90caf9",
                              borderRadius: 2,
                              bgcolor: "white",
                              overflowY: "auto",
                            }}
                          >
                            {(currentQuestion.shuffledOptions || currentQuestion.options)
                              .filter((o) => !(currentQuestion.filled ?? []).includes(o))
                              .map((word, idx) => (
                                <Draggable key={word} draggableId={`word-${word}`} index={idx}>
                                  {(prov) => (
                                    <Paper
                                      ref={prov.innerRef}
                                      {...prov.draggableProps}
                                      {...prov.dragHandleProps}
                                      elevation={0}                // 👈 tắt shadow mặc định
                                      sx={{
                                        px: 2,
                                        py: 0.5,
                                        bgcolor: "#e3f2fd",
                                        cursor: "grab",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        minHeight: 30,
                                        fontFamily: "Roboto, Arial, sans-serif",
                                        fontSize: "1.1rem",
                                        border: "1px solid #90caf9",   // 👈 thêm border nhẹ
                                        boxShadow: "none",             // 👈 đảm bảo không còn bóng
                                        "&:hover": { bgcolor: "#bbdefb" },
                                      }}
                                    >
                                      {word}
                                    </Paper>
                                  )}
                                </Draggable>
                              ))}

                            {provided.placeholder}
                          </Box>
                        )}
                      </Droppable>
                    </Box>
                  </Stack>
                </DragDropContext>
              )}
            </Box>
          )}
    </Box>
  );
};

export default QuestionRenderer;