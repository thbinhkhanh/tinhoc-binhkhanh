import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';

// Các trang
import Home from './pages/Home';
import Info from './pages/Info';

import Lop1 from './pages/Lop1';
import Lop2 from './pages/Lop2';
import Lop3 from './pages/Lop3';
import Lop4 from './pages/Lop4';
import Lop5 from './pages/Lop5';

import Lop1New from './pages/Lop1New';
import Lop2New from './pages/Lop2New';
import Lop3New from './pages/Lop3New';
import Lop4New from './pages/Lop4New';
import Lop5New from './pages/Lop5New';


import About from './pages/About';
import Footer from './pages/Footer';
import HuongDan from './pages/HuongDan';
import TracNghiem from './pages/TracNghiem';
import TracNghiem_Test from './pages/TracNghiem_Test';
import TracNghiemGV from './pages/TracNghiemGV';
import ScormViewer from './pages/ScormViewer';
import Login from './pages/Login';
import QuanTri from './pages/QuanTri';
import TongHopKQ from './pages/TongHopKQ';
import SystemLockedDialog from './dialog/SystemLockedDialog';

// Context
import { ConfigProvider, ConfigContext } from './context/ConfigContext';
import { QuizProvider } from "./context/QuizContext";
import { StudentQuizProvider } from "./context/StudentQuizContext";
import { TeacherQuizProvider } from "./context/TeacherQuizContext";

// Firebase
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';

function App() {
  return (
    <TeacherQuizProvider>
      <StudentQuizProvider>
        <QuizProvider>
          <ConfigProvider>
            <Router>
              <Navigation />
              <div style={{ paddingTop: 0 }}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/info" element={<Info />} />

                  <Route path="/lop1" element={<Lop1 />} />
                  <Route path="/lop2" element={<Lop2 />} />
                  <Route path="/lop3" element={<Lop3 />} />
                  <Route path="/lop4" element={<Lop4 />} />
                  <Route path="/lop5" element={<Lop5 />} />

                  <Route path="/lop1-new" element={<Lop1New />} />
                  <Route path="/lop2-new" element={<Lop2New />} />
                  <Route path="/lop3-new" element={<Lop3New />} />
                  <Route path="/lop4-new" element={<Lop4New />} />
                  <Route path="/lop5-new" element={<Lop5New />} />

                  <Route path="/trac-nghiem" element={<TracNghiem />} />
                  <Route path="/test-de" element={<TracNghiem_Test />} />
                  <Route path="/soan-de" element={<TracNghiemGV />} />
                  <Route path="/scorm-viewer" element={<ScormViewer />} />
                  <Route path="/gioithieu" element={<About />} />
                  <Route path="/huongdan" element={<HuongDan />} />
                  <Route path="/chucnang" element={<About />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/quan-tri" element={<QuanTri />} />
                  <Route path="/tong-hop-kq" element={<TongHopKQ />} />
                </Routes>
                <Footer />
              </div>
            </Router>
          </ConfigProvider>
        </QuizProvider>
      </StudentQuizProvider>
    </TeacherQuizProvider>
  );
}

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { config } = useContext(ConfigContext);
  const selectedYear = config.namHoc || "2025-2026";

  const [loginState, setLoginState] = useState(false);
  const [lockedDialogOpen, setLockedDialogOpen] = useState(false); // 🔒 Dialog trạng thái khóa

  useEffect(() => {
    const docRef = doc(db, 'CONFIG', 'config');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setLoginState(data.login === true);
      }
    });
    return () => unsubscribe();
  }, []);

  const baseItems = [
    { path: '/', name: 'Trang chủ' },
    { path: '/lop1', name: 'Lớp 1', khoi: 'Khối 1' },
    { path: '/lop2', name: 'Lớp 2', khoi: 'Khối 2' },
    { path: '/lop3', name: 'Lớp 3', khoi: 'Khối 3' },
    { path: '/lop4', name: 'Lớp 4', khoi: 'Khối 4' },
    { path: '/lop5', name: 'Lớp 5', khoi: 'Khối 5' },
  ];

  const authItems = loginState
    ? [
        { path: '/tong-hop-kq', name: 'Tổng hợp' },
        { path: '/soan-de', name: 'Soạn đề' },
        { path: '/test-de', name: 'Test đề' },
        { path: '/quan-tri', name: 'Hệ thống' },
        {
          path: '/logout',
          name: 'Đăng xuất',
          action: async () => {
            const docRef = doc(db, 'CONFIG', 'config');
            await setDoc(docRef, { login: false }, { merge: true });
            navigate('/');
          },
        },
      ]
    : [{ path: '/login', name: 'Đăng nhập' }];

  const navItems = [...baseItems, ...authItems];

  const handleMenuClick = (item) => {
    if (item.action) {
      item.action();

    } else if (item.khoi) {
      if (config.locked) {
        setLockedDialogOpen(true);
        return;
      }

      const soKhoi = item.khoi.replace('Khối ', '');

      // ✅ HỆ THỐNG CŨ → VÀO THẲNG LỚP
      if (config.heThong === 'old') {
        navigate(`/lop${soKhoi}`);
        return;
      }

      // ✅ HỆ THỐNG MỚI → QUA INFO
      const newRouteMap = {
        'Khối 1': '/lop1-new',
        'Khối 2': '/lop2-new',
        'Khối 3': '/lop3-new',
        'Khối 4': '/lop4-new',
        'Khối 5': '/lop5-new',
      };

      navigate('/info', {
        state: {
          khoi: item.khoi,
          heThong: 'new',
          target: newRouteMap[item.khoi],
        },
      });
    }
    else {
      // ✅ BẮT BUỘC PHẢI CÓ
      navigate(item.path);
    }
  };

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          //padding: '12px',
          height: '48px',
padding: '0 12px',
          background: '#1976d2',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          overflowX: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'nowrap',
            overflowX: 'auto',
            paddingRight: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <img
            src="/Logo.png"
            alt="Logo"
            //style={{ height: '40px', marginRight: '16px', flexShrink: 0 }}
            style={{ height: '32px', marginRight: '12px', flexShrink: 0 }}

          />
          {navItems.map((item, index) => (
            <Box
              key={index}
              onClick={() => handleMenuClick(item)}
              sx={{
                cursor: 'pointer',
                color: 'white',
                //padding: '8px 12px',
                padding: '4px 10px',
                backgroundColor:
                  location.pathname === item.path ? '#1565c0' : 'transparent',
                borderBottom:
                  location.pathname === item.path ? '3px solid white' : 'none',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
              }}
            >
              {item.name}
            </Box>
          ))}
        </div>

        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            alignItems: 'center',
            gap: 1,
            flexShrink: 0,
          }}
        >
          <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
            Năm học:
          </Typography>
          <Box
            sx={{
              backgroundColor: 'white',
              minWidth: 100,
              maxWidth: 100,
              borderRadius: 1,
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #c4c4c4',
            }}
          >
            <Typography
              sx={{
                color: '#1976d2',
                fontWeight: 'bold',
                fontSize: '14px',
                textAlign: 'center',
                padding: '6px 8px',
                width: '100%',
              }}
            >
              {selectedYear}
            </Typography>
          </Box>
        </Box>
      </nav>

      {/* Dialog khi hệ thống bị khóa */}
      <SystemLockedDialog
        open={lockedDialogOpen}
        onClose={() => setLockedDialogOpen(false)}
      />
    </>
  );
}

export default App;
