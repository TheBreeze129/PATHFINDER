import React from 'react';
import { useNavigate } from 'react-router-dom';
import teacherimage from '../assets/pngs/login_teacher.png';
import studentimage from '../assets/pngs/login_student.png';
import styled from 'styled-components';
import Logo from '../assets/pngs/Logo.png';
const Landing = () => {
  const navigate = useNavigate();

  const handleStudintLogin = () => {
    navigate('/login/student');
  };

  const handleTeacherLogin = () => {
    navigate('/login/teacher');
  };

  return (
    <Container>
      <Logoimg src={Logo} />
      <Text_1>PATHFINDER</Text_1>
      <Text_2>환영합니다</Text_2>
      <Btns>
        <Btn>
          <img
            src={teacherimage}
            onClick={handleTeacherLogin}
            alt={'선생님으로 로그인하기'}
          />
          <div>선생님으로 로그인하기</div>
        </Btn>
        <Btn>
          <img
            src={studentimage}
            onClick={handleStudintLogin}
            alt={'학생으로 로그인하기'}
          />
          <div>학생으로 로그인하기</div>
        </Btn>
      </Btns>
    </Container>
  );
};

export default Landing;

const Logoimg = styled.img`
  height: 150px;
  width: 150px;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  position: relative;
  overflow: hidden;
`;

const Text_1 = styled.div`
  color: rgb(0, 187, 249);
  font-weight: 900;
  font-size: 30px;
  margin-top: 37px;
`;

const Btns = styled.div`
  display: flex;
  flex-direction: row;
  gap: 100px;
  margin-top: 57px;
`;

const Btn = styled.button`
  height: 300px;
  width: 300px;
  background-color: white;
  color: rgb(72, 69, 56);
  border: 2px solid rgba(0, 0, 0, 0.5);
  font-size: 24px;
  border-radius: 8px;
  gap: 17px;
  font-weight: 600;
`;

const Text_2 = styled.div`
  font-size: 16px;
  color: rgb(72, 69, 56);
  margin-top: 8px;
`;
