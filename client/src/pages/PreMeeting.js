import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios'; // Axios를 이용해 백엔드와 통신

const PreMeeting = () => {
  const navigate = useNavigate();
  const [roomID, setroomID] = useState('NGDIFW');
  const [timer, setTimer] = useState(600); // 10분 타이머 (600초)
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [stdName, setStdName] = useState('');

  const startNewMeeting = async () => {
    try {
      const response = await axios.post(
        'https://' + process.env.REACT_APP_BASE_URL + '/api/v1/rooms',
      );
      console.log(response.data);
      setroomID(response.data['room_id']);
    } catch (error) {
      console.error('Error creating room:', error);
      alert('방 생성에 실패했습니다.');
    }
  };

  useEffect(() => {
    startNewMeeting();

    // 타이머 시작
    const interval = setInterval(() => {
      setTimer(prevTimer => {
        if (prevTimer <= 1) {
          clearInterval(interval);
          setIsButtonDisabled(true); // 타이머 종료 시 버튼 비활성화
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);

    return () => clearInterval(interval); // 컴포넌트 언마운트 시 인터벌 정리
  }, []);

  const formatTime = seconds => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Container>
      <InfoBox>
        <InfoText>상담 입장 코드 : {roomID}</InfoText>
        <DescText>
          학생 이름을 아래에 입력한 후, 10분 내 입장하지 않을 시 상담실이
          삭제됩니다.
        </DescText>
        <DescText>학생에게 상담 입장 코드를 전송해주세요.</DescText>
        <Names
          type="text"
          placeholder="상담 학생 이름을 입력해주세요"
          value={stdName}
          onChange={e => setStdName(e.target.value)}
        />
        <NextBtn
          onClick={async () => {
            if (stdName.length < 2) {
              alert('이름을 두 글자 이상 입력해주세요.');
            } else if (!isButtonDisabled) {
              try {
                const response = await axios.post(
                  'https://' +
                    process.env.REACT_APP_BASE_URL +
                    '/api/v1/roominfo',

                  {
                    room_id: roomID,
                    student_name: stdName,
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                    },
                  },
                );
                console.log('res:', response.data);
                window.localStorage.setItem('stdName', stdName);

                if (response.status === 200) {
                  navigate('/meeting/teacher?invite_code=' + roomID);
                } else {
                  console.log('입장 실패:', response);
                }
              } catch (err) {
                console.error('입장 실패:', err);
              }
            }
          }}
          disabled={isButtonDisabled}
          style={{
            backgroundColor: isButtonDisabled ? 'gray' : 'rgba(255,0,0,0.5)',
            cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
          }}
        >
          <Text_1>입장하기</Text_1>
          <Split />
          <Text_1>{formatTime(timer)}</Text_1>
        </NextBtn>
      </InfoBox>
    </Container>
  );
};

export default PreMeeting;

const Names = styled.input`
  height: 48px;
  width: 524px;
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

const Text_1 = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 24px;
  font-weight: 600;
`;

const NextBtn = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 540px;
  height: 100px;
  border-radius: 15px;
`;

const Split = styled.div`
  height: 60%;
  width: 2px;
  background-color: white;
`;

const DescText = styled.div`
  font-size: 16px;
  color: rgb(72, 69, 56);
`;

const InfoText = styled.div`
  font-size: 25px;
  font-weight: 600;
  color: rgb(72, 69, 56);
  margin-top: 8px;
`;

const InfoBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: left;
  justify-content: space-between;
  width: 540px;
  height: 270px;
  border-radius: 30px;
  border: 1px solid rgb(0, 187, 249);
  padding: 30px;
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
