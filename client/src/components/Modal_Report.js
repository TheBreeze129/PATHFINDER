import styled from 'styled-components';
import { IoMdClose } from 'react-icons/io';
import ChatItem from './ChatItem';
import axios from 'axios';
import { useState, useEffect } from 'react';
import LoadingIndicator from './Loading';

const Modal_Report = ({
  teacherName,
  studentName,
  roomId,
  onClose,
  closeChatModal,
}) => {
  const [data, setData] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    postData();
    console.log(teacherName, studentName, roomId);
    closeChatModal();
  }, []);

  const postData = async () => {
    setIsLoading(true);
    const jwtToken = localStorage.getItem('accessToken');

    try {
      const response = await axios.post(
        'https://192.168.0.2:3456/reports',
        {
          teacherName: teacherName,
          studentName: studentName,
          roomId: roomId,
        },
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        },
      );
      if (response.status === 200) {
        console.log('Succeeded to get reports', response.data.message);
        setData(response.data.message.slice(7, -3));
      } else {
        console.log('Succeeded to get reports', response);
      }
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to get chat logs', err);
      setIsLoading(false);
    }
  };

  const handleClickOutside = event => {
    if (event.target.id === 'modal-overlay') {
      onClose(); // 모달 바깥 클릭 시 닫기
    }
  };

  return (
    <>
      {isLoading && <LoadingIndicator />}

      <Overlay id="modal-overlay" onClick={handleClickOutside}>
        <Wrapper>
          <IconWrapper onClick={onClose}>
            <IoMdClose color={'#484538'} size={40} />
          </IconWrapper>
          <Title>상담 보고서</Title>
          <ContentBox>
            <div key={1} dangerouslySetInnerHTML={{ __html: data }} />
          </ContentBox>
        </Wrapper>
      </Overlay>
    </>
  );
};

export default Modal_Report;

const Overlay = styled.div`
  height: 100vh;
  width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Wrapper = styled.div`
  background-color: white;
  border-radius: 30px;
  padding: 40px;
  width: 80%;
  height: 80%;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
`;

const IconWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  position: absolute;
  right: 20px;
  top: 20px;
`;

const Title = styled.div`
  color: rgba(72, 69, 56);
  font-size: 25px;
  font-weight: 600;
  margin: 20px 0px;
`;

const ContentBox = styled.div`
  height: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
`;
