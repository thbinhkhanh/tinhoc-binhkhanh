import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportKetQuaExcel = async (results, className) => {
  if (!results || results.length === 0) {
    alert("Không có dữ liệu để xuất Excel!");
    return;
  }

  try {
    // ===============================
    // 🔹 NĂM HỌC (chuẩn theo tháng VN)
    // ===============================
    const getSchoolYear = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
    };
    const schoolYear = getSchoolYear();

    // ===============================
    // 🔹 TẠO WORKBOOK
    // ===============================
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Kết quả", {
      pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true },
    });

    // ===============================
    // 🔹 TIÊU ĐỀ
    // ===============================
    const row1 = sheet.addRow(["TRƯỜNG TIỂU HỌC BÌNH KHÁNH"]);
    row1.font = { size: 12, bold: true, color: { argb: "FF0D47A1" } };
    row1.alignment = { horizontal: "left", vertical: "middle" };
    row1.height = 20;

    sheet.addRow([]);

    const row3 = sheet.addRow([`BẢNG TỔNG HỢP - LỚP ${className}`]);
    sheet.mergeCells("A3:F3"); // mở rộng vì có thêm cột mới
    row3.font = { size: 14, bold: true, color: { argb: "FF0D47A1" } };
    row3.alignment = { horizontal: "center", vertical: "middle" };
    row3.height = 22;

    const row4 = sheet.addRow([`NĂM HỌC: ${schoolYear}`]);
    sheet.mergeCells("A4:F4");
    row4.font = { size: 12, bold: true, color: { argb: "FF0D47A1" } };
    row4.alignment = { horizontal: "center", vertical: "middle" };
    row4.height = 18;

    sheet.addRow([]);

    // ===============================
    // 🔹 HEADER
    // ===============================
    const headerKeys = ["STT", "Họ và tên", "Điểm", "Thời gian", "Ngày", "Số lần kiểm tra"];
    const headerRow = sheet.addRow(headerKeys);
    headerRow.height = 25;

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1976D2" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // ===============================
    // 🔹 DỮ LIỆU
    // ===============================
    results.forEach((r, idx) => {
      const row = sheet.addRow([
        r.stt || idx + 1,
        r.hoVaTen || "",
        r.diem, // không chia /10 nữa
        r.thoiGianLamBai || "",
        r.ngayKiemTra || "",
        r.soLan || 1, // thêm cột số lần kiểm tra
      ]);

      row.height = 30;

      row.eachCell((cell, colNumber) => {
        const key = headerKeys[colNumber - 1];
        cell.alignment = {
          horizontal: key === "HỌ VÀ TÊN" ? "left" : "center",
          vertical: "middle",
          wrapText: true,
          indent: key === "HỌ VÀ TÊN" ? 1 : 0,
        };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // ===============================
    // 🔹 ĐỘ RỘNG CỘT
    // ===============================
    sheet.columns = [
      { width: 6 },  // STT
      { width: 30 }, // Họ và tên
      { width: 10 }, // Điểm
      { width: 15 }, // Thời gian
      { width: 15 }, // Ngày
      { width: 15 }, // Số lần kiểm tra
    ];

    // ===============================
    // 💾 XUẤT FILE
    // ===============================
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `Ket_qua_${className}.xlsx`);
  } catch (err) {
    console.error("❌ Lỗi khi xuất Excel:", err);
    alert("Xuất Excel thất bại!");
  }
};
