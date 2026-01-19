import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
} from '@mui/material';
import {
  Monitor, Keyboard, Newspaper, Folder, ShieldCheck, ClipboardList,
  Search, Image, Type, Film, FileText, Edit, Video, Gamepad, Code, Lightbulb, UserCheck
} from 'lucide-react';
import Banner from '../pages/Banner';

const lessonsHK1 = [
  { title: 'Bài 1. Phần cứng và phần mềm máy tính', icon: <Monitor size={32} color="#1976d2" />, color: 'primary', link: '/scorm/Bai01L4/res/index.html' },
  { title: 'Bài 2. Gõ bàn phím đúng cách', icon: <Keyboard size={32} color="#1976d2" />, color: 'success', link: '/scorm/Bai02L4/res/index.html' },
  { title: 'Bài 3. Thông tin trên trang web', icon: <Newspaper size={32} color="#1976d2" />, color: 'warning', link: '/scorm/Bai03L4/res/index.html' },
  { title: 'Bài 4. Tìm kiếm thông tin trên Internet', icon: <Search size={32} color="#1976d2" />, color: 'primary', link: '/scorm/Bai04L4/res/index.html' },
  { title: 'Bài 5. Thao tác với thư mục, tệp', icon: <Folder size={32} color="#1976d2" />, color: 'success', link: '/scorm/Bai05L4/res/index.html' },
  { title: 'Bài 6. Sử dụng phần mềm khi được phép', icon: <ShieldCheck size={32} color="#1976d2" />, color: 'warning', link: '/scorm/Bai06L4/res/index.html' },
  { title: 'Bài 7. Soạn thảo văn bản tiếng Việt', icon: <FileText size={32} color="#1976d2" />, color: 'primary', link: '/scorm/Bai07L4/res/index.html' },
  { title: 'Bài 8. Chèn hình ảnh, sao chép, di chuyển, xoá văn bản', icon: <Edit size={32} color="#1976d2" />, color: 'success', link: '/scorm/Bai08L4/res/index.html' },
  { title: 'Ôn tập học kì I', icon: <ClipboardList size={32} color="#1976d2" />, color: 'error', link: '/scorm/OntapHKIL4/res/index.html' },
  { title: 'Ôn tập kiểm tra học kì I', icon: <ShieldCheck size={32} color="#1976d2" />, color: 'error', link: '' },
];

const lessonsHK2 = [
  { title: 'Bài 9. Bài trình chiếu của em', icon: <Image size={32} color="#1976d2" />, color: 'primary', link: '/scorm/Bai09L4/res/index.html' },
  { title: 'Bài 10. Định dạng, tạo hiệu ứng cho trang chiếu', icon: <Film size={32} color="#1976d2" />, color: 'success', link: '/scorm/Bai10L4/res/index.html' },
  { title: 'Bài 11A. Xem video về lịch sử, văn hóa', icon: <Video size={32} color="#1976d2" />, color: 'warning', link: '' },
  { title: 'Bài 11B. Thực hành luyện tập gõ bàn phím', icon: <Keyboard size={32} color="#1976d2" />, color: 'primary', link: '' },
  { title: 'Bài 12. Làm quen với Scratch', icon: <Code size={32} color="#1976d2" />, color: 'success', link: '/scorm/Bai12L4/res/index.html' },
  { title: 'Bài 13. Tạo chương trình máy tính để kể chuyện', icon: <Lightbulb size={32} color="#1976d2" />, color: 'warning', link: '/scorm/Bai13L4/res/index.html' },
  { title: 'Bài 14. Điều khiển nhân vật chuyển động trên sân khấu', icon: <UserCheck size={32} color="#1976d2" />, color: 'primary', link: '/scorm/Bai14L4/res/index.html' },
  { title: 'Ôn tập học kì II', icon: <ClipboardList size={32} color="#1976d2" />, color: 'error', link: '/scorm/OntapHKIIL4/res/index.html' },
  { title: 'Ôn tập kiểm tra học kì II', icon: <ShieldCheck size={32} color="#1976d2" />, color: 'error', link: '' },
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
  const [selectedLesson, setSelectedLesson] = useState(null);

  const handleSelect = (link, title) => {
    setSelectedLesson(`Lớp 4 - ${title}`);
    navigate(
      `/scorm-viewer?link=${encodeURIComponent(link)}&lop=Lớp 4&bai=${encodeURIComponent(title)}`
    );
  };

  const currentLessons = selectedSemester === 1 ? lessonsHK1 : lessonsHK2;

  return (
    <>
      <Banner title="TIN HỌC - LỚP 4" />
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
