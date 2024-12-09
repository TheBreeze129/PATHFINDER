import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Item from '../components/Item';
import Modal from '../components/Modal';
import Modal_Report from '../components/Modal_Report';
import axios from 'axios'; // Axios로 백엔드 API 호출
import { useNavigate } from 'react-router-dom';

const MainServer =
  process.env.REACT_APP_MAIN_SERVER_IP +
  ':' +
  process.env.REACT_APP_MAIN_SERVER_PORT;

const Dashboard = () => {
  const [isChatOpen, setIsChatOpen] = useState(false); // 모달 열림 상태
  const [isReportOpen, setIsReportOpen] = useState(false); //
  const [data, setData] = useState([]); // 회의 데이터 상태
  const [userName, setUserName] = useState(''); // 사용자 이름 상태
  const [userSchool, setUserSchool] = useState(''); // 학교 정보 상태
  const [clickedItem, setClickedItem] = useState({});

  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/premeeting');
  };

  // 대화 모달 열기
  const openModal = () => {
    setIsChatOpen(true);
  };

  // 대화 모달 닫기
  const closeModal = () => {
    setIsChatOpen(false);
    setClickedItem({});
  };

  // 보고서 모달 열기
  const openReportModal = () => {
    closeModal();
    setIsReportOpen(true);
  };

  // 보고서 모달 닫기
  const closeReportModal = () => {
    setIsReportOpen(false);
    setClickedItem({});
  };

  // 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          throw new Error('Access token not found. Please log in again.');
        }
        // 1. 사용자 정보 가져오기
        const userResponse = await axios.get(
          'https://' + MainServer + '/api/v1/userinfo',
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          },
        );

        const userData = userResponse.data;
        setUserName(userData.name);
        setUserSchool(userData.school);
        window.localStorage.setItem('userName', userData.name);

        // 2. 회의 데이터 가져오기
        const conferenceResponse = await axios.get(
          'https://' + MainServer + '/api/v1/conferences',
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          },
        );
        if (conferenceResponse.status === 200) {
          console.log(conferenceResponse.data);
          setData(conferenceResponse.data);
        } else {
          console.log('Failed to get conference data', conferenceResponse);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // 로그인 만료 또는 인증 실패 시 처리
        if (error.response && error.response.status === 401) {
          alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
          // navigate('/login'); // 로그인 페이지로 리다이렉트
        }
      }
    };

    fetchData();
  }, []);

  return (
    <>
      {isChatOpen && (
        <Modal
          teacherId={clickedItem.teacher_id}
          roomId={clickedItem.roomId}
          onClose={closeModal}
        />
      )}
      {isReportOpen && (
        <Modal_Report
          teacherName={userName}
          studentName={clickedItem.studentName}
          roomId={clickedItem.roomId}
          onClose={closeReportModal}
          closeChatModal={closeModal}
        />
      )}
      <Container>
        <Wrapper>
          <Menu>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              <UserName>{userName} 선생님</UserName>
              <UserSchool>{userSchool}</UserSchool>
            </div>
            <ConfBtn onClick={handleStart}>새 회의 시작하기</ConfBtn>
          </Menu>
          <ConfLogs>
            <UserName>회의록</UserName>
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                marginTop: '23px',
              }}
            >
              {data.map(item => (
                <Item
                  key={item.conf_id}
                  teacherId={item.teacher_id}
                  roomId={item.roomId}
                  studentName={item.student_name}
                  date={item.date}
                  desc={item.description}
                  onClick={() => {
                    setClickedItem({
                      teacherId: item.teacher_id,
                      roomId: item.roomId,
                      studentName: item.student_name,
                    });
                    openModal();
                  }}
                  onBtnClick={() => {
                    setClickedItem({
                      teacherId: item.teacher_id,
                      roomId: item.roomId,
                      studentName: item.student_name,
                    });
                    openReportModal();
                  }}
                />
              ))}
            </div>
          </ConfLogs>
        </Wrapper>
      </Container>
    </>
  );
};

export default Dashboard;

// 스타일 컴포넌트는 기존과 동일

const ConfLogs = styled.div`
  display: flex;
  flex: 4;
  flex-direction: column;
  padding: 30px;
  padding-right: 0px;
  height: 90%;
`;

const ConfBtn = styled.div`
  width: 100%;
  height: 20%;
  background-color: rgba(0, 0, 0, 0.2);
  font-size: 24px;
  color: rgba(72, 69, 56);
  font-weight: 600;
  border-radius: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
`;

const UserName = styled.div`
  color: rgba(72, 69, 56);
  font-size: 25px;
  font-weight: 600;
  /* margin-top:6px;
    margin-bottom:22px; */
`;

const UserSchool = styled.div`
  color: rgba(72, 69, 56);
  font-size: 16px;
  font-weight: 300;
`;

const Menu = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 90%;
  border: 1px solid rgb(0, 187, 249);
  border-radius: 30px;
  padding: 30px;
`;
const Wrapper = styled.div`
  width: 90%;
  height: 90%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 20px;
`;

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  color: #484538;
`;
