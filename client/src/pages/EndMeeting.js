import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const EndMeeting = () => {
  const navigate = useNavigate();

  const gohome = () => {
    navigate('/');
  };

  return (
    <Container>
      <Text_1>회의가 종료되었습니다</Text_1>
      <Btn onClick={gohome}>홈으로 가기</Btn>
    </Container>
  );
};

export default EndMeeting;

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
