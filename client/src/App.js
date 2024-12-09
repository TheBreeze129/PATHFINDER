import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginStudent from './pages/LoginStudent';
import MeetingStudent from './pages/MeetingStudent';
import EndMeeting from './pages/EndMeeting';
import Landing from './pages/Landing';
import LoginTeacher from './pages/LoginTeacher';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import PreMeeting from './pages/PreMeeting';
import MeetingTeacher from './pages/MeetingTeacher';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/premeeting" element={<PreMeeting />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/" element={<Landing />} />
        <Route path="/login/teacher" element={<LoginTeacher />} />
        <Route path="/login/student" element={<LoginStudent />} />
        <Route path="/meeting/student" element={<MeetingStudent />} />
        <Route path="/meeting/teacher" element={<MeetingTeacher />} />
        <Route path="/endmeeting" element={<EndMeeting />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
