import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  Button,
} from '@mui/material';

import {
  BookOpen, Search, FileText, Folder, Lock, Brush, Smile, ShieldCheck,
  Globe, FileCode2, GitCompare, Repeat, Calculator, PlayCircle, ScrollText, 
  HelpingHand,
  ClipboardList
} from 'lucide-react';

import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import Banner from '../pages/Banner';
import { ConfigContext } from '../context/ConfigContext';


// ================= ICON + COLOR THEO STT =================
const lessonUIByStt = {
  1:  { icon: <BookOpen size={32} color="#1976d2" />, color: 'primary' },
  2:  { icon: <Search size={32} color="#1976d2" />, color: 'success' },
  3:  { icon: <FileText size={32} color="#1976d2" />, color: 'warning' },
  4:  { icon: <Folder size={32} color="#1976d2" />, color: 'primary' },
  5:  { icon: <Lock size={32} color="#1976d2" />, color: 'error' },
  6:  { icon: <Brush size={32} color="#1976d2" />, color: 'success' },
  7:  { icon: <Smile size={32} color="#1976d2" />, color: 'warning' },
  8:  { icon: <Brush size={32} color="#1976d2" />, color: 'primary' },
  9:  { icon: <Globe size={32} color="#1976d2" />, color: 'success' },
  
  10: { icon: <FileCode2 size={32} color="#1976d2" />, color: 'warning' },
  11: { icon: <GitCompare size={32} color="#1976d2" />, color: 'primary' },
  12: { icon: <Repeat size={32} color="#1976d2" />, color: 'success' },
  13: { icon: <Calculator size={32} color="#1976d2" />, color: 'warning' },
  14: { icon: <PlayCircle size={32} color="#1976d2" />, color: 'primary' },
  15: { icon: <ScrollText size={32} color="#1976d2" />, color: 'success' },
  16: { icon: <PlayCircle size={32} color="#1976d2" />, color: 'warning' },
  17: { icon: <ShieldCheck size={32} color="#1976d2" />, color: 'error' },
  18: { icon: <ShieldCheck size={32} color="#1976d2" />, color: 'error' },
  19: { icon: <GitCompare size={32} color="#1976d2" />, color: 'primary' },
  20: { icon: <HelpingHand size={32} color="#1976d2" />, color: 'success' },
  21: { icon: <Brush size={32} color="#1976d2" />, color: 'primary' },
  22: { icon: <Globe size={32} color="#1976d2" />, color: 'success' },
};


// ================= CARD =================
const LessonCard = ({ title, icon, color, onClick }) => {
  const bgColors = {
    primary: '#E3F2FD',
    success: '#E8F5E9',
    warning: '#FFF8E1',
    error: '#FFEBEE',
  };

  return (
    <Card
      elevation={4}
      sx={{
        p: 3,
        borderRadius: 3,
        textAlign: 'center',
        cursor: 'pointer',
        transition: '0.2s',
        '&:hover': { transform: 'scale(1.03)', boxShadow: 6 },
      }}
      onClick={onClick}
    >
      <Box
        sx={{
          bgcolor: bgColors[color] || '#eee',
          borderRadius: '50%',
          width: 80,
          height: 80,
          mx: 'auto',
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </Box>

      <Typography fontWeight="bold">
        {title.toUpperCase()}
      </Typography>

      <Button
        variant="contained"
        color={color || 'primary'}
        size="small"
        sx={{ mt: 2 }}
      >
        VÀO
      </Button>
    </Card>
  );
};


// ================= MAIN =================
export default function Lop3() {
  const navigate = useNavigate();
  const { config, setConfig } = useContext(ConfigContext);

  const [lessons, setLessons] = useState([]);

  // 1️⃣ Khởi tạo state hocKi từ localStorage hoặc context
  const [hocKi, setHocKi] = useState(
    parseInt(localStorage.getItem('hocKi')) || config.hocKi || 1
  );

  // 2️⃣ Khi context thay đổi, cập nhật lại tab
  useEffect(() => {
    setHocKi(parseInt(localStorage.getItem('hocKi')) || config.hocKi || 1);
  }, [config.hocKi]);

  // ===== LOAD FIRESTORE =====
  useEffect(() => {
    const fetchLessons = async () => {
      const snapshot = await getDocs(collection(db, 'TENBAI_Lop3'));

      const data = snapshot.docs
        .map(doc => ({
          title: doc.id,
          stt: doc.data().stt,
        }))
        .sort((a, b) => a.stt - b.stt);

      setLessons(data);
    };

    fetchLessons();
  }, []);

  // ===== LỌC THEO HỌC KÌ =====
  const lessonsByHocKi = lessons.filter(lesson =>
    hocKi === 1 ? lesson.stt <= 9 : lesson.stt > 9
  );

  // ===== CLICK CARD =====
  const handleSelect = (title) => {
    navigate(`/trac-nghiem?lop=3&bai=${encodeURIComponent(title)}`);
  };

  // ===== XỬ LÝ THAY ĐỔI HỌC KÌ =====
  const handleHocKiChange = (hk) => {
    setHocKi(hk); // cập nhật state local
    setConfig(prev => ({ ...prev, hocKi: hk })); // cập nhật context
    localStorage.setItem('hocKi', hk); // lưu vào localStorage
    console.log("Học kì đã chọn:", hk);
  };

  return (
    <>
      <Banner title="TIN HỌC - LỚP 3" />

      <Box sx={{ p: 4, background: '#e3f2fd', minHeight: '100vh' }}>

        {/* ===== TAB HỌC KÌ ===== */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4, gap: 2 }}>
          <Button
            variant={hocKi === 1 ? 'contained' : 'outlined'}
            onClick={() => handleHocKiChange(1)}
            sx={{ px: 4, fontWeight: 'bold' }}
          >
            HỌC KÌ I
          </Button>

          <Button
            variant={hocKi === 2 ? 'contained' : 'outlined'}
            onClick={() => handleHocKiChange(2)}
            sx={{ px: 4, fontWeight: 'bold' }}
          >
            HỌC KÌ II
          </Button>
        </Box>

        {/* ===== DANH SÁCH BÀI HỌC ===== */}
        <Box textAlign="center" mb={3}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}
          >
            DANH SÁCH BÀI HỌC
          </Typography>

          <Box
            sx={{
              width: '60px',
              height: '4px',
              backgroundColor: '#1976d2',
              margin: '0 auto',
              borderRadius: '2px',
            }}
          />
        </Box>

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          }}
        >
          {lessonsByHocKi.map((lesson) => {
            const ui = lessonUIByStt[lesson.stt] || {};

            return (
              <LessonCard
                key={lesson.stt}
                title={lesson.title}
                icon={ui.icon}
                color={ui.color || 'primary'}
                onClick={() => handleSelect(lesson.title)}
              />
            );
          })}
        </Box>
      </Box>
    </>
  );
}
