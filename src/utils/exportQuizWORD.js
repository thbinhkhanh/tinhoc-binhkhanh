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

// ===== lấy image chuẩn (🔥 QUAN TRỌNG NHẤT) =====
const getImageUrl = (opt) => {
  if (!opt) return null;

  if (typeof opt === "string" && opt.startsWith("http")) return opt;

  if (opt.image) return opt.image;

  if (opt.formats?.image) return opt.formats.image;

  if (typeof opt.text === "string" && opt.text.startsWith("http"))
    return opt.text;

  return null;
};

// ===== fetch image =====
const fetchImage = async (url) => {
  try {
    const res = await fetch(url, {
      mode: "cors",
      cache: "no-cache",
    });

    if (!res.ok) {
      console.warn("❌ fetch fail:", url);
      return null;
    }

    const buffer = await res.arrayBuffer();
    return buffer;
  } catch (err) {
    console.error("❌ fetch error:", url, err);
    return null;
  }
};

// ===== CONST =====
const FONT_SIZE = 24; // ~13pt

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
            children: [
              new ImageRun({
                data: img,
                transformation: { width: 300, height: 200 },
              }),
            ],
          })
        );
      }
    }

    // =====================================================
    // ===== SINGLE / MULTIPLE (🔥 FIX FULL IMAGE + TEXT)
    // =====================================================
    if (q.type === "single" || q.type === "multiple") {
      const labels = ["A", "B", "C", "D"];

      for (let i = 0; i < q.options.length; i++) {
        const opt = q.options[i];

        const isCorrect = Array.isArray(q.correct)
          ? q.correct.includes(i)
          : q.correct === i;

        const text =
          typeof opt === "string"
            ? ""
            : stripHTML(opt?.text || "");

        const imgUrl = getImageUrl(opt);

        // ===== TEXT =====
        children.push(
          createText(
            `${labels[i]}. ${text}${isCorrect ? " *" : ""}`,
            false
          )
        );

        // ===== IMAGE =====
        if (imgUrl) {
          const img = await fetchImage(imgUrl);

          if (img) {
            children.push(
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
                children: [
                  new ImageRun({
                    data: img,
                    transformation: { width: 25, height: 25 },
                  }),
                ],
              })
            );
          }
        }
      }
    }

    // =====================================================
    // ===== IMAGE TYPE (GRID)
    // =====================================================
    else if (q.type === "image") {
      const labels = ["A", "B", "C", "D"];
      const maxPerRow = 4;

      for (let row = 0; row < q.options.length; row += maxPerRow) {
        const slice = q.options.slice(row, row + maxPerRow);

        const rowCells = [];

        for (let i = 0; i < slice.length; i++) {
          const opt = slice[i];
          const realIndex = row + i;

          const imgUrl = getImageUrl(opt);

          const cellChildren = [];

          // label
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

          // image
          if (imgUrl) {
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
      const cleanText = (str) => {
        return str
          .replace(/&nbsp;/gi, " ")
          .replace(/<[^>]*>/g, "")
          .replace(/\s+/g, " ")
          .trim();
      };

      for (let i = 0; i < q.options.length; i++) {
        const opt = q.options[i];

        // ✅ FIX dư &nbsp; + HTML
        const text = cleanText(stripHTML(opt?.text || ""));
        const imgUrl = opt?.image || "";

        const childrenRun = [
          new TextRun({
            text: `${i + 1}. `,
            bold: true,
            size: FONT_SIZE,
            font: "Times New Roman",
          }),
          new TextRun({
            text: text ? text + " " : "",
            size: FONT_SIZE,
            font: "Times New Roman",
          }),
        ];

        const paragraphChildren = [...childrenRun];

        // ===== IMAGE SAFE =====
        if (
          imgUrl &&
          typeof imgUrl === "string" &&
          imgUrl.startsWith("http")
        ) {
          try {
            const res = await fetch(imgUrl);

            if (!res.ok) {
              console.warn("Image fail:", imgUrl);
            } else {
              const buffer = await res.arrayBuffer();

              if (buffer && buffer.byteLength > 0) {
                paragraphChildren.push(
                  new ImageRun({
                    data: buffer,
                    transformation: {
                      width: 60,
                      height: 60,
                    },
                  })
                );
              }
            }
          } catch (err) {
            console.warn("Image error:", imgUrl);
          }
        }

        children.push(
          new Paragraph({
            children: paragraphChildren,
            spacing: { after: 100 },
          })
        );
      }
    }

    // ===== TRUE FALSE =====
    else if (q.type === "truefalse") {
      const cleanText = (str) => {
        return str
          .replace(/&nbsp;/gi, " ")
          .replace(/<[^>]*>/g, "")
          .replace(/\s+/g, " ")
          .trim();
      };

      q.options.forEach((opt, i) => {
        const label = q.correct[i] === "Đ" ? "Đ" : "S";

        children.push(
          createText(`${label}. ${cleanText(stripHTML(opt))}`)
        );
      });
    }

    // ===== FILL BLANK =====
    else if (q.type === "fillblank") {
      const rawOption =
        typeof q.option === "string"
          ? q.option
          : typeof q.option?.text === "string"
          ? q.option.text
          : "";

      // ===== normalize =====
      let option = rawOption
        .replace(/&nbsp;/gi, " ")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<p[^>]*>/gi, "")
        .replace(/\r\n/g, "\n");

      option = stripHTML(option)
        .replace(/([a-zA-Z]\))\s*/g, "\n$1 ")
        .replace(/\[\s*\.\.\.\s*\]/g, "[...]")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{2,}/g, "\n")
        .trim();

      // ===== split dòng =====
      const optionLines = option
        .split("\n")
        .map(l => l.trim())
        .filter(Boolean);

      // ===== render từng dòng riêng (GIỐNG MẪU) =====
      optionLines.forEach(line => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                size: FONT_SIZE,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 80 },
          })
        );
      });

      // ===== answers =====
      const answers =
        Array.isArray(q.correct) && q.correct.length
          ? q.correct
          : Array.isArray(q.options)
          ? q.options.map(o =>
              typeof o === "string" ? o : o?.text || ""
            )
          : [];

      const cleanAnswers = answers
        .map(a => stripHTML(a))
        .filter(Boolean);

      if (cleanAnswers.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Từ cần điền: ${cleanAnswers.join(" / ")}`,
                bold: true,
                size: FONT_SIZE,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 120 },
          })
        );
      }
    }

    // ===== MATCHING =====
    else if (q.type === "matching") {

  // ✅ FIX toàn bộ lỗi &nbsp; + unicode nbsp + HTML
  const cleanText = (str) => {
    return String(str || "")
      .replace(/&nbsp;/gi, " ")
      .replace(/\u00A0/g, " ")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const rows = [];

  for (let i = 0; i < q.pairs.length; i++) {

    const pair = q.pairs[i];

    const leftChildren = [];
    const rightChildren = [];

    // ===== LEFT (IMAGE hoặc TEXT) =====
    if (pair.leftImage?.url) {

      const img = await fetchImage(pair.leftImage.url);

      if (img) {
        leftChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: img,
                transformation: {
                  width: 40,
                  height: 40,
                },
              }),
            ],
          })
        );
      }

    } else if (pair.left) {

      const leftText = cleanText(
        stripHTML(pair.left)
      );

      leftChildren.push(
        createText(leftText)
      );
    }

    // ===== RIGHT TEXT =====
    const rightText = cleanText(
      stripHTML(pair.right || "")
    );

    rightChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: rightText,
            size: FONT_SIZE,
            font: "Times New Roman",
          }),
        ],
      })
    );

    // ===== ROW =====
    rows.push(
      new TableRow({
        children: [

          new TableCell({
            width: {
              size: q.columnRatio?.left
                ? (q.columnRatio.left * 100) /
                  (q.columnRatio.left + q.columnRatio.right)
                : 30,
              type: WidthType.PERCENTAGE,
            },
            children: leftChildren,
          }),

          new TableCell({
            width: {
              size: q.columnRatio?.right
                ? (q.columnRatio.right * 100) /
                  (q.columnRatio.left + q.columnRatio.right)
                : 70,
              type: WidthType.PERCENTAGE,
            },
            children: rightChildren,
          }),

        ],
      })
    );
  }

  children.push(
    new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      rows,
    })
  );
}

    // ===== spacing =====
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