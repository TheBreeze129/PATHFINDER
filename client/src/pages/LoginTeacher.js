import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios'; // Axios를 이용해 백엔드와 통신
const LoginTeacher = () => {
  const navigate = useNavigate();
  const [userID, setUserID] = useState('');
  const [userPW, setUserPW] = useState('');
  const [error, setError] = useState(''); // 에러 메시지 상태 추가

  const handleLogin = async () => {
    try {
      // 백엔드 API 호출
      const response = await axios.post(
        'https://' + process.env.REACT_APP_BASE_URL + '/api/v1/login',
        {
          username: userID,
          password: userPW,
        },
      );

      // 로그인 성공 시 토큰 저장 및 리다이렉션
      localStorage.setItem('accessToken', response.data.access_token);
      navigate('/dashboard'); // 로그인 후 이동할 페이지
    } catch (err) {
      // 로그인 실패 시 에러 메시지 처리
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail); // 백엔드 에러 메시지 표시
      } else {
        setError('로그인에 실패했습니다. 다시 시도해주세요.');
      }
      alert(error);
    }
  };

  const handleSignUp = () => {
    navigate('/signup');
  };

  return (
    <Container>
      <Text_1>선생님으로 로그인하기</Text_1>
      <LoginContainer>
        <LoginInput
          type="text"
          placeholder="아이디를 입력해주세요"
          value={userID}
          onChange={e => setUserID(e.target.value)}
        />
        <LoginInput
          type="password"
          placeholder="비밀번호를 입력해주세요"
          value={userPW}
          onChange={e => setUserPW(e.target.value)}
        />
      </LoginContainer>
      <Btn onClick={handleLogin}>로그인</Btn>
      <SmallBtn onClick={handleSignUp}>회원가입</SmallBtn>
    </Container>
  );
};

export default LoginTeacher;

const SmallBtn = styled.button`
  height: 36px;
  width: 144px;
  border: 2px solid rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  color: rgba(0, 0, 0, 0.5);
  font-size: 12px;
  font-weight: 400;
  margin-top: 24px;
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

const LoginInput = styled.input`
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
const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 0px;
  margin-top: 30px;
  margin-bottom: 46px;
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
`;
