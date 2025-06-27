import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import Banner from '../pages/Banner';

export default function Lop2() {
  const [selectedSemester, setSelectedSemester] = useState(1);

  return (
    <>
      <Banner title="TIN HỌC - LỚP 2" />

      <Box
        sx={{
          p: { xs: 2, sm: 4 },
          pt: { xs: 4, sm: 6 },
          background: '#e3f2fd',
          minHeight: '100vh',
        }}
      >
        {/* Nút chọn học kỳ */}
        <Box
          sx={{ display: 'flex', justifyContent: 'center', mb: 4, gap: 2 }}
        >
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

        {/* Tiêu đề DANH SÁCH BÀI HỌC */}
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

        {/* Nội dung bài học theo học kỳ sẽ chèn ở đây sau */}
      </Box>
    </>
  );
}
