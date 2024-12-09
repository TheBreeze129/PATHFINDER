import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const LoginStudent = () => {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState(''); // 초대 코드 상태 관리

  const handleLogin = () => {
    if (inviteCode.trim() === '') {
      alert('참여 코드를 입력해주세요!');
      return;
    }
    navigate('/meeting/student?invite_code=' + inviteCode);
  };

  return (
    <Container>
      <Text_1>회의 참여하기 (학생용)</Text_1>
      <Code
        type="text"
        placeholder="참여코드를 입력해주세요"
        value={inviteCode}
        onChange={e => setInviteCode(e.target.value)} // 입력값 상태 업데이트
      />
      <Btn className="btn" onClick={handleLogin}>
        로그인
      </Btn>
    </Container>
  );
};

export default LoginStudent;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3%;
  height: 100vh;
  position: relative;
  overflow: hidden;
`;

const Text_1 = styled.div`
  color: rgb(0, 187, 249);
  font-weight: 900;
  font-size: 30px;
`;

const Code = styled.input`
  height: 48px;
  width: 400px;
  background-color: rgb(228, 227, 225);
  border: 0px;
  border-radius: 4px;
  padding: 0px;
  padding-left: 16px;

  &::placeholder {
    font-size: 16px;
  }
`;

const Btn = styled.button`
  height: 48px;
  width: 416px;
  background-color: rgb(0, 187, 249);
  border: 0px;
  border-radius: 4px;
  font-size: 16px;
  color: white;
  font-weight: 600;
`;
