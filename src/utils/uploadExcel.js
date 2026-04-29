import * as XLSX from "xlsx";
import {
  collection,
  getDocs,
  writeBatch,
  doc,
  getDoc,
} from "firebase/firestore";

export const handleUploadExcel = async ({
  event,
  db,
  setSnackbar,
}) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    // 🔥 1. Lấy config (FIX CHỖ NÀY)
    const configRef = doc(db, "CONFIG", "config");
    const configSnap = await getDoc(configRef);

    if (!configSnap.exists()) {
      throw new Error("Không tìm thấy config");
    }

    const config = configSnap.data();
    const namHoc = config?.namHoc || "2025-2026"; // fallback

    // 🔥 2. Xác định suffix
    const isOldYear = namHoc === "2025-2026";

    // 🔥 3. Đọc Excel
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (!rows.length) {
      throw new Error("File Excel không có dữ liệu");
    }

    // 🔥 4. Gom theo lớp
    const dataByClass = {};
    rows.forEach((row) => {
      let lop = row["Lớp"];

      // 👉 fix nếu Excel ghi "Lớp 3"
      if (typeof lop === "string") {
        lop = lop.replace("Lớp ", "").trim();
      }

      if (!lop) return;

      if (!dataByClass[lop]) dataByClass[lop] = [];

      dataByClass[lop].push({
        stt: row["STT"] || 0,
        tenBai: row["Tên bài học"] || "",
      });
    });

    // 🔥 5. Upload
    for (const lop in dataByClass) {
      const batch = writeBatch(db);

      const colName = isOldYear
        ? `TENBAI_Lop${lop}`
        : `TENBAI_Lop${lop}_New`;

      const colRef = collection(db, colName);

      const snap = await getDocs(colRef);
      snap.forEach((d) => batch.delete(d.ref));

      dataByClass[lop].forEach((b) => {
        if (!b.tenBai) return; // tránh lỗi doc id rỗng
        batch.set(doc(colRef, b.tenBai), b);
      });

      await batch.commit();
    }

    setSnackbar({
      open: true,
      message: `✅ Upload thành công (${namHoc})`,
      severity: "success",
    });
  } catch (err) {
    console.error(err);
    setSnackbar({
      open: true,
      message: `❌ ${err.message || "Upload thất bại"}`,
      severity: "error",
    });
  } finally {
    event.target.value = "";
  }
};