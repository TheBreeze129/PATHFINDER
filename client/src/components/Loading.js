import React from 'react';
import styled, { keyframes } from 'styled-components';

// 스피너 애니메이션 정의
const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const Overlay = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  height: 100vh;
  width: 100vw;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999999;
`;

// 로딩 인디케이터 스타일 정의
const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #3498db;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  z-index: 999999;
`;

const LoadingIndicator = () => {
  return (
    <Overlay>
      <Spinner />
    </Overlay>
  );
};

export default LoadingIndicator;
