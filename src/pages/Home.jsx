import React, { useState, useEffect, useContext } from "react";
import {
  Box, Grid, Typography, Card, CardContent, Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import Banner from "../pages/Banner"; // giữ nguyên banner
import { ConfigContext } from "../context/ConfigContext";
import SystemLockedDialog from "../dialog/SystemLockedDialog";

export default function Home() {
  const navigate = useNavigate();
  const { config } = useContext(ConfigContext); // lấy context
  const [useNewVersion, setUseNewVersion] = useState(false);
  const [lockedDialogOpen, setLockedDialogOpen] = useState(false);

  useEffect(() => {
    const fetchToggle = async () => {
      try {
        const toggleSnap = await getDoc(doc(db, "SETTINGS", "TOGGLE"));
        if (toggleSnap.exists()) {
          setUseNewVersion(toggleSnap.data().useNewVersion === true);
        }
      } catch (error) {
        console.error("❌ Lỗi khi tải trạng thái toggle:", error);
      }
    };
    fetchToggle();
  }, []);

  const khốiList = ["LỚP 1", "LỚP 2", "LỚP 3", "LỚP 4", "LỚP 5"];
  const imageList = ["L1.png", "L2.png", "L3.png", "L4.png", "L5.png"];
  const colorMap = ["#42a5f5", "#66bb6a", "#ffb300", "#ab47bc", "#ef5350"];

  const handleClassClick = (index) => {
    if (config.locked) {
      setLockedDialogOpen(true);
      return;
    }

    const soKhoi = index + 1;

    // ✅ HỆ THỐNG CŨ → VÀO THẲNG LỚP
    if (config.heThong === "old") {
      navigate(`/lop${soKhoi}`);
      return;
    }

    // ✅ HỆ THỐNG MỚI → QUA INFO
    const newRouteMap = {
      1: "/lop1-new",
      2: "/lop2-new",
      3: "/lop3-new",
      4: "/lop4-new",
      5: "/lop5-new",
    };

    navigate("/info", {
      state: {
        khoi: `Khối ${soKhoi}`,
        heThong: "new",
        target: newRouteMap[soKhoi],
      },
    });
  };


  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #e3f2fd, #bbdefb)",
        py: 0,
        px: 0,
      }}
    >
      <Banner title="LUYỆN TẬP TIN HỌC" />

      <Box sx={{ px: 2 }}>
        <Grid container spacing={3} justifyContent="center" sx={{ mt: 3, mb: 4 }}>
          {khốiList.map((label, index) => (
            <Grid item xs={12} sm={6} md={4} key={label}>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.2 }}>
                <Card
                  elevation={4}
                  sx={{ borderRadius: 2, overflow: "hidden", textAlign: "center", height: "100%" }}
                >
                  <Box
                    sx={{
                      bgcolor: "#fff",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      p: 1.5,
                      cursor: "pointer",
                    }}
                    onClick={() => handleClassClick(index)}
                  >
                    <img
                      src={`/${imageList[index]}`}
                      alt={label}
                      width="120px"
                      height="120px"
                      style={{ borderRadius: "8px", boxShadow: "0 3px 8px rgba(0,0,0,0.1)" }}
                    />
                  </Box>

                  <CardContent sx={{ py: 1 }}>
                    <Typography variant="h6" fontWeight="600" gutterBottom sx={{ fontSize: { xs: "1rem", sm: "1.1rem" } }}>
                      {label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: { xs: "0.8rem", sm: "0.9rem" } }}>
                      Nhấn để vào bài tập lớp {index + 1}
                    </Typography>

                    <Button
                      variant="contained"
                      fullWidth
                      sx={{
                        backgroundColor: colorMap[index],
                        fontWeight: 600,
                        py: { xs: 0.5, sm: 1 },
                        fontSize: { xs: "0.8rem", sm: "0.9rem" },
                        "&:hover": { backgroundColor: colorMap[index], filter: "brightness(0.9)" },
                      }}
                      onClick={() => handleClassClick(index)}
                    >
                      Vào {label}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Dialog khi hệ thống bị khóa */}
      <SystemLockedDialog open={lockedDialogOpen} onClose={() => setLockedDialogOpen(false)} />
    </Box>
  );
}
