import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
} from '@mui/material';
import {
  BrainCircuit, Settings, Laptop, Monitor, Keyboard, Newspaper,
  Folder, ShieldCheck, Save, Image, MousePointerClick,
  ListTodo, Divide, CheckCheck, Users,
} from 'lucide-react';
import Banner from '../pages/Banner';

const lessonsHK1 = [
  { title: 'Bài 1. Thông tin và quyết định', icon: <BrainCircuit size={32} color="#1976d2" />, color: 'primary', link: '/scorm/Bai01L3/res/index.html' },
  { title: 'Bài 2. Xử lí thông tin', icon: <Settings size={32} color="#1976d2" />, color: 'success', link: '/scorm/Bai02L3/res/index.html' },
  { title: 'Bài 3. Máy tính - những người bạn mới', icon: <Laptop size={32} color="#1976d2" />, color: 'warning', link: '/scorm/Bai03L3/res/index.html' },
  { title: 'Bài 4. Làm việc với máy tính', icon: <Monitor size={32} color="#1976d2" />, color: 'primary', link: '/scorm/Bai04L3/res/index.html' },
  { title: 'Bài 5. Tập gõ bàn phím', icon: <Keyboard size={32} color="#1976d2" />, color: 'success', link: '/scorm/Bai05L3/res/index.html' },
  { title: 'Bài 6. Xem tin và giải trí trên Internet', icon: <Newspaper size={32} color="#1976d2" />, color: 'warning', link: '/scorm/Bai06L3/res/index.html' },
  { title: 'Bài 7. Sắp xếp để dễ tìm', icon: <Folder size={32} color="#1976d2" />, color: 'primary', link: '/scorm/Bai07L3/res/index.html' },
  { title: 'Ôn tập học kì I', icon: <ShieldCheck size={32} color="#1976d2" />, color: 'error', link: '/scorm/OntapHKIL3/res/index.html' },
  { title: 'Ôn tập kiểm tra học kì I', icon: <ShieldCheck size={32} color="#1976d2" />, color: 'error' , link: '' },
];

const lessonsHK2 = [
  { title: 'Bài 8. Làm quen với thư mục', icon: <Folder size={32} color="#1976d2" />, color: 'success', link: '/scorm/Bai08L3/res/index.html' },
  { title: 'Bài 9. Lưu trữ, bảo vệ thông tin của em và gia đình', icon: <Save size={32} color="#1976d2" />, color: 'warning', link: '/scorm/Bai09L3/res/index.html' },
  { title: 'Bài 10. Trang trình chiếu của em', icon: <Image size={32} color="#1976d2" />, color: 'primary', link: '/scorm/Bai10L3/res/index.html' },
  { title: 'Bài 11A. Hệ Mặt Trời', icon: <Users size={32} color="#1976d2" />, color: 'success', link: '/scorm/Bai11AL3/res/index.html' },
  { title: 'Bài 11B. Luyện tập, sử dụng chuột máy tính', icon: <MousePointerClick size={32} color="#1976d2" />, color: 'primary', link: '' },
  { title: 'Bài 12. Thực hiện công việc theo các bước', icon: <ListTodo size={32} color="#1976d2" />, color: 'warning', link: '/scorm/Bai12L3/res/index.html' },
  { title: 'Bài 13. Chia việc lớn thành việc nhỏ để giải quyết', icon: <Divide size={32} color="#1976d2" />, color: 'success', link: '/scorm/Bai13L3/res/index.html' },
  { title: 'Bài 14. Thực hiện công việc theo điều kiện', icon: <CheckCheck size={32} color="#1976d2" />, color: 'primary', link: '/scorm/Bai14L3/res/index.html' },
  { title: 'Bài 15. Nhiệm vụ của em và sự trợ giúp của máy tính', icon: <Laptop size={32} color="#1976d2" />, color: 'success', link: '/scorm/Bai15L3/res/index.html' },
  { title: 'Ôn tập học kì II', icon: <ShieldCheck size={32} color="#1976d2" />, color: 'error', link: '/scorm/OntapHKIIL3/res/index.html' },
  { title: 'Ôn tập kiểm tra học kì II', icon: <ShieldCheck size={32} color="#1976d2" />, color: 'error' , link: '' },
];

const LessonCard = ({ title, icon, color, onSelect }) => {
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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        backgroundColor: '#fff',
        cursor: 'pointer',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: 6,
        },
      }}
      onClick={onSelect}
    >
      <Box
        sx={{
          bgcolor: bgColors[color] || '#eee',
          borderRadius: '50%',
          width: 80,
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </Box>
      <Typography variant="subtitle1" fontWeight="bold">
        {title.toUpperCase()}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Nhấn để truy cập
      </Typography>
      <Button
        variant="contained"
        color={color || 'primary'}
        size="small"
        sx={{ mt: 'auto', px: 4 }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        VÀO
      </Button>
    </Card>
  );
};

export default function Lop3() {
  const navigate = useNavigate();
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [selectedLesson, setSelectedLesson] = useState(null); // lưu bài học đã chọn

  const handleSelect = (link, title) => {
    setSelectedLesson(`Lớp 3 - ${title}`);
    navigate(
      `/scorm-viewer?link=${encodeURIComponent(link)}&lop=Lớp 3&bai=${encodeURIComponent(title)}`
    );
  };

  const currentLessons = selectedSemester === 1 ? lessonsHK1 : lessonsHK2;

  return (
    <>
      <Banner title="TIN HỌC - LỚP 3" />
      <Box
        sx={{
          p: { xs: 2, sm: 4 },
          pt: { xs: 4, sm: 6 },
          background: '#e3f2fd',
          minHeight: '100vh',
        }}
      >
        {/* Nút chọn học kỳ */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4, gap: 2 }}>
          <Button
            variant={selectedSemester === 1 ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => setSelectedSemester(1)}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 'bold',
              borderRadius: 2,
              minWidth: 150,
            }}
          >
            HỌC KÌ I
          </Button>
          <Button
            variant={selectedSemester === 2 ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => setSelectedSemester(2)}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 'bold',
              borderRadius: 2,
              minWidth: 150,
            }}
          >
            HỌC KÌ II
          </Button>
        </Box>

        {/* Tiêu đề danh sách bài học */}
        <Typography variant="h5" fontWeight="bold" color="primary" align="center" sx={{ mb: 2 }}>
          DANH SÁCH BÀI HỌC
        </Typography>
        <Box
          sx={{
            width: 100,
            height: 3,
            backgroundColor: 'primary.main',
            margin: '0 auto 24px',
            borderRadius: 2,
          }}
        />

        {/* Dòng hiện tên bài học đã chọn */}
        {selectedLesson && (
          <Box
            sx={{
              mt: 6, // Tăng khoảng cách tách ra khỏi menu
              mb: 4,
              px: 3,
              py: 2,
              mx: 'auto',
              maxWidth: 600,
              backgroundColor: '#fffde7', // màu vàng nhạt nổi bật hơn
              border: '2px solid #ffeb3b',
              borderRadius: 3,
              textAlign: 'center',
              boxShadow: 3,
            }}
          >
            <Typography variant="h6" fontWeight="bold" color="primary">
              {selectedLesson}
            </Typography>
          </Box>
        )}


        {/* Danh sách bài học */}
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          }}
        >
          {currentLessons.map((item, index) => (
            <LessonCard
              key={index}
              {...item}
              onSelect={() => handleSelect(item.link, item.title)}
            />
          ))}
        </Box>
      </Box>
    </>
  );
}
