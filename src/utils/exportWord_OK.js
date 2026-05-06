import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  ImageRun
} from "docx";
import { saveAs } from "file-saver";

// ===== helper =====
const stripHTML = (html = "") =>
  html.replace(/<[^>]+>/g, "").trim();

// ===== fetch image =====
const fetchImage = async (url) => {
  try {
    const res = await fetch(url);
    return await res.arrayBuffer();
  } catch {
    return null;
  }
};

// ===== CONST =====
const FONT_SIZE = 24; // 13pt

const createText = (text, bold = false, align = "left") =>
  new Paragraph({
    alignment:
      align === "center"
        ? AlignmentType.CENTER
        : AlignmentType.LEFT,
    children: [
      new TextRun({
        text,
        bold,
        size: FONT_SIZE,
        font: "Times New Roman",
      }),
    ],
  });

// ===== MAIN =====
export const exportQuestionsToWord = async (
  questions = [],
  fileName = "questions.docx"
) => {
  if (!questions.length) return;

  let finalName = fileName.trim() || "questions";
  finalName = finalName.replace(/\.docx$/i, "") + ".docx";

  const children = [];

  // ===== TITLE =====
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: finalName.replace(".docx", ""),
          bold: true,
          size: 32,
          font: "Times New Roman",
        }),
      ],
      spacing: { after: 300 },
    })
  );

  // ===== LOOP QUESTIONS =====
  for (let index = 0; index < questions.length; index++) {
    const q = questions[index];
    const qIndex = index + 1;

    // ===== QUESTION TEXT =====
    children.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: `Câu ${qIndex}: ${stripHTML(q.question)}`,
            bold: true,
            size: FONT_SIZE,
            font: "Times New Roman",
          }),
        ],
      })
    );

    // ===== IMAGE QUESTION =====
    if (q.questionImage) {
      const img = await fetchImage(q.questionImage);

      if (img) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new ImageRun({
                data: img,
                transformation: {
                  width: 300,
                  height: 200,
                },
              }),
            ],
          })
        );
      }
    }

    // ===== SINGLE / MULTIPLE =====
    if (q.type === "single" || q.type === "multiple") {
      const labels = ["A", "B", "C", "D"];

      for (let i = 0; i < q.options.length; i++) {
        const opt = q.options[i];
        const isCorrect = q.correct.includes(i);

        children.push(
          createText(
            `${labels[i]}. ${stripHTML(opt.text)}${
              isCorrect ? " *" : ""
            }`
          )
        );
      }
    }

    // ===== IMAGE QUESTION TYPE (🔥 FIX CHÍNH) =====
    else if (q.type === "image") {
      const labels = ["A", "B", "C", "D"];
      const maxPerRow = 4;

      for (let row = 0; row < q.options.length; row += maxPerRow) {
        const slice = q.options.slice(row, row + maxPerRow);

        const rowCells = [];

        for (let i = 0; i < slice.length; i++) {
          const opt = slice[i];
          const realIndex = row + i;

          // ✅ lấy đúng URL (data của bạn là string)
          const imgUrl =
            typeof opt === "string"
              ? opt
              : opt?.formats?.image || opt?.text || null;

          const cellChildren = [];

          // ===== LABEL A B C D =====
          cellChildren.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: labels[realIndex] || "",
                  bold: true,
                  size: FONT_SIZE,
                }),
              ],
            })
          );

          // ===== IMAGE =====
          if (imgUrl && imgUrl.startsWith("http")) {
            const img = await fetchImage(imgUrl);

            if (img) {
              cellChildren.push(
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new ImageRun({
                      data: img,
                      transformation: {
                        width: 90,
                        height: 90,
                      },
                    }),
                  ],
                })
              );
            }
          }

          rowCells.push(
            new TableCell({
              children: cellChildren,
              width: {
                size: Math.floor(100 / slice.length),
                type: WidthType.PERCENTAGE,
              },
            })
          );
        }

        children.push(
          new Table({
            rows: [new TableRow({ children: rowCells })],
            width: { size: 100, type: WidthType.PERCENTAGE },
            alignment: AlignmentType.CENTER,
          })
        );
      }
    }

    // ===== SORT =====
    else if (q.type === "sort") {
      q.options.forEach((opt, i) => {
        children.push(
          createText(`${i + 1}. ${stripHTML(opt.text)}`)
        );
      });
    }

    // ===== TRUE FALSE =====
    else if (q.type === "truefalse") {
      q.options.forEach((opt, i) => {
        const label = q.correct[i] === "Đ" ? "Đ" : "S";
        const isCorrect = q.correct[i] === "Đ";

        children.push(
          createText(
            `${label}. ${stripHTML(opt)}${
              isCorrect ? " *" : ""
            }`
          )
        );
      });
    }

    // ===== FILL BLANK =====
    else if (q.type === "fillblank") {
      children.push(createText(stripHTML(q.option)));

      if (q.correct?.length) {
        children.push(
          createText(
            `Từ cần điền: ${q.correct.join(", ")}`,
            true
          )
        );
      }
    }

    // ===== MATCHING =====
    else if (q.type === "matching") {
      const rows = q.pairs.map((pair) => {
        return new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                createText(stripHTML(pair.left)),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                createText(stripHTML(pair.right)),
              ],
            }),
          ],
        });
      });

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows,
        })
      );
    }

    // ===== SPACING =====
    children.push(
      new Paragraph({
        children: [],
        spacing: { after: 200 },
      })
    );
  }

  // ===== CREATE DOC =====
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            size: FONT_SIZE,
            font: "Times New Roman",
          },
        },
      },
    },
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, finalName);
};