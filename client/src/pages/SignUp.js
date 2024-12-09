import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios'; // Axios 사용

const SignUp = () => {
  const navigate = useNavigate();
  const [userID, setuserID] = useState('');
  const [userEmail, setuserEmail] = useState('');
  const [userName, setuserName] = useState('');
  const [userSchool, setuserSchool] = useState('');
  const [userPW, setuserPW] = useState('');
  const [userPWCheck, setuserPWCheck] = useState('');
  const [error, setError] = useState(''); // 에러 메시지 상태 추가

  const handleSignUp = async () => {
    // 비밀번호 확인
    if (userPW !== userPWCheck) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      // 회원가입 API 요청
      const response = await axios.post(
        'https://' + process.env.REACT_APP_BASE_URL + '/api/v1/signup',
        {
          username: userID,
          email: userEmail,
          name: userName,
          school: userSchool,
          password: userPW,
        },
      );

      // 성공 시 알림 및 리다이렉션
      alert('회원가입이 완료되었습니다.');
      navigate('/login/teacher'); // 로그인 페이지로 이동
    } catch (err) {
      // 오류 처리
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail); // 백엔드 에러 메시지 표시
      } else {
        setError('회원가입에 실패했습니다. 다시 시도해주세요.');
      }
      alert(error);
    }
  };

  return (
    <Container>
      <Text_1>회원가입하기</Text_1>
      <LoginContainer>
        <LoginInput
          type="text"
          placeholder="아이디를 입력해주세요"
          value={userID}
          onChange={e => setuserID(e.target.value)}
        />
        <LoginInput
          type="text"
          placeholder="이메일을 입력해주세요"
          value={userEmail}
          onChange={e => setuserEmail(e.target.value)}
        />
        <LoginInput
          type="text"
          placeholder="성함을 입력해주세요"
          value={userName}
          onChange={e => setuserName(e.target.value)}
        />
        <LoginInput
          type="text"
          placeholder="소속 학교를 입력해주세요"
          value={userSchool}
          onChange={e => setuserSchool(e.target.value)}
        />
        <LoginInput
          type="password"
          placeholder="비밀번호를 입력해주세요"
          value={userPW}
          onChange={e => setuserPW(e.target.value)}
        />
        <LoginInput
          type="password"
          placeholder="비밀번호를 다시 입력해주세요"
          value={userPWCheck}
          onChange={e => setuserPWCheck(e.target.value)}
        />
      </LoginContainer>
      <Btn onClick={handleSignUp}>회원가입</Btn>
    </Container>
  );
};

export default SignUp;

// 스타일 컴포넌트 (원래 코드 그대로 사용)
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
  font-size: 16px;
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
  margin-bottom: 30px;
`;

const Text_1 = styled.div`
  color: rgb(0, 187, 249);
  font-weight: 900;
  font-size: 30px;
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

const ErrorText = styled.div`
  color: red;
  font-size: 14px;
  margin-top: -10px;
  margin-bottom: 10px;
`;
