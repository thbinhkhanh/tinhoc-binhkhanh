import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
} from '@mui/material';
import {
  BookOpen, Search, FileText, Folder, Lock, Brush, Smile, ShieldCheck,
  Globe, FileCode2, GitCompare, Repeat, Calculator, PlayCircle, ScrollText
} from 'lucide-react';
import Banner from '../pages/Banner';

// Dữ liệu bài học lớp 5 (học kỳ I)
const lessonsHK1 = [
  { title: 'Bài 1. Máy tính có thể giúp em làm những việc gì?', icon: <BookOpen size={32} color="#1976d2" />, color: 'primary', link: '/scorm/Bai01L5/res/index.html' },
  { title: 'Bài 2. Tìm kiếm thông tin trên website', icon: <Search size={32} color="#1976d2" />, color: 'success', link: '/scorm/Bai02L5/res/index.html' },
  { title: 'Bài 3. Thông tin trong giải quyết vấn đề', icon: <FileText size={32} color="#1976d2" />, color: 'warning', link: '/scorm/Bai03L5/res/index.html' },
  { title: 'Bài 4. Tổ chức lưu trữ và tìm kiếm tệp, thư mục trong máy tính', icon: <Folder size={32} color="#1976d2" />, color: 'primary', link: '/scorm/Bai04L5/res/index.html' },
  { title: 'Bài 5. Bản quyền nội dung thông tin', icon: <Lock size={32} color="#1976d2" />, color: 'error', link: '/scorm/Bai05L5/res/index.html' },
  { title: 'Bài 6. Chỉnh sửa văn bản', icon: <Brush size={32} color="#1976d2" />, color: 'success', link: '/scorm/Bai06L5/res/index.html' },
  { title: 'Bài 7. Định dạng kí tự', icon: <Smile size={32} color="#1976d2" />, color: 'warning', link: '/scorm/Bai07L5/res/index.html' },
  { title: 'Ôn tập học kì I', icon: <ShieldCheck size={32} color="#1976d2" />, color: 'error', link: '/scorm/OntapHKIL5/res/index.html' },
];

// Dữ liệu bài học lớp 5 (học kỳ II)
const lessonsHK2 = [
  { title: 'Bài 8A. Thực hành tạo thiệp chúc mừng', icon: <Brush size={32} color="#1976d2" />, color: 'primary', link: '/scorm/Bai08AL5/res/index.html' },
  { title: 'Bài 8B. Thực hành tạo sản phẩm thủ công theo video hướng dẫn', icon: <Globe size={32} color="#1976d2" />, color: 'success', link: '/scorm/Bai08BL5/res/index.html' },
  { title: 'Bài 9. Cấu trúc tuần tự', icon: <FileCode2 size={32} color="#1976d2" />, color: 'warning', link: '/scorm/Bai09L5/res/index.html' },
  { title: 'Bài 10. Cấu trúc rẽ nhánh', icon: <GitCompare size={32} color="#1976d2" />, color: 'primary', link: '/scorm/Bai10L5/res/index.html' },
  { title: 'Bài 11. Cấu trúc lặp', icon: <Repeat size={32} color="#1976d2" />, color: 'success', link: '/scorm/Bai11L5/res/index.html' },
  { title: 'Bài 12. Viết chương trình để tính toán', icon: <Calculator size={32} color="#1976d2" />, color: 'warning', link: '/scorm/Bai12L5/res/index.html' },
  { title: 'Bài 13. Chạy thử chương trình', icon: <PlayCircle size={32} color="#1976d2" />, color: 'primary', link: '/scorm/Bai13L5/res/index.html' },
  { title: 'Bài 14. Viết kịch bản chương trình máy tính', icon: <ScrollText size={32} color="#1976d2" />, color: 'success', link: '/scorm/Bai14L5/res/index.html' },
  { title: 'Bài 15. Thực hành tạo chương trình theo kịch bản', icon: <PlayCircle size={32} color="#1976d2" />, color: 'warning', link: '/scorm/Bai15L5/res/index.html' },
  { title: 'Ôn tập học kì II', icon: <ShieldCheck size={32} color="#1976d2" />, color: 'error', link: '/scorm/OntapHKIIL5/res/index.html' },
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

export default function Lop5() {
  const navigate = useNavigate();
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [selectedLesson, setSelectedLesson] = useState(null);

  const handleSelect = (link, title) => {
    setSelectedLesson(`Lớp 5 - ${title}`);
    navigate(
      `/scorm-viewer?link=${encodeURIComponent(link)}&lop=Lớp 5&bai=${encodeURIComponent(title)}`
    );
  };

  const currentLessons = selectedSemester === 1 ? lessonsHK1 : lessonsHK2;

  return (
    <>
      <Banner title="TIN HỌC - LỚP 5" />
      <Box
        sx={{
          p: { xs: 2, sm: 4 },
          pt: { xs: 4, sm: 6 },
          background: '#e3f2fd',
          minHeight: '100vh',
        }}
      >
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

        {selectedLesson && (
          <Box
            sx={{
              mt: 6,
              mb: 4,
              px: 3,
              py: 2,
              mx: 'auto',
              maxWidth: 600,
              backgroundColor: '#fffde7',
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
