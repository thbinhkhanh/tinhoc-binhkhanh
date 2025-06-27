import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Box, Typography } from '@mui/material';

export default function ScormViewer() {
  const location = useLocation();
  const navigate = useNavigate();

  const query = new URLSearchParams(location.search);
  const link = query.get('link');
  const lop = query.get('lop');   // Lấy lớp
  const bai = query.get('bai');   // Lấy tên bài học

  if (!link) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6">Không có bài học để hiển thị</Typography>
        <Button variant="contained" onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Quay lại
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Thanh tiêu đề trên cùng */}
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Button variant="contained" onClick={() => navigate(-1)}>
          ← Quay lại
        </Button>
      </Box>

      {/* Tiêu đề bài học – in đậm, nhỏ gọn, không có nền trắng */}
      {lop && bai && (
        <Box sx={{ textAlign: 'center', py: 1, backgroundColor: 'transparent' }}>
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            color="primary"
            sx={{
              fontSize: '1rem',
              lineHeight: 1.3,
            }}
          >
            {lop} - {bai}
          </Typography>
        </Box>
      )}

      {/* Phần iframe */}
      <Box sx={{ flexGrow: 1 }}>
        <iframe
          src={link}
          title="Bài học SCORM"
          style={{ width: '100%', height: '100%', border: 'none' }}
          allowFullScreen
        />
      </Box>
    </Box>
  );
}
