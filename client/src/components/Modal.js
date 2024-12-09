import styled from 'styled-components';
import { IoMdClose } from 'react-icons/io';
import ChatItem from './ChatItem';
import axios from 'axios';
import { useState, useEffect } from 'react';

const Modal = ({ teacherId, roomId, onClose }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    postData();
  }, []);

  const postData = async () => {
    const jwtToken = localStorage.getItem('accessToken');

    try {
      const response = await axios.post(
        'https://' + process.env.REACT_APP_BASE_URL + '/api/v1/getlogs',
        {
          roomId: roomId,
        },
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        },
      );
      if (response.status === 200) {
        console.log('Succeeded to get chat logs', response.data);
        setData(response.data);
      } else {
        console.log('Succeeded to get chat logs', response);
      }
    } catch (err) {
      console.error('Failed to get chat logs', err);
    }
  };

  const handleClickOutside = event => {
    if (event.target.id === 'modal-overlay') {
      onClose(); // 모달 바깥 클릭 시 닫기
    }
  };

  return (
    <Overlay id="modal-overlay" onClick={handleClickOutside}>
      <Wrapper>
        <IconWrapper onClick={onClose}>
          <IoMdClose color={'#484538'} size={40} />
        </IconWrapper>
        <Title>회의록</Title>
        <ContentBox>
          {data.map(item => (
            <ChatItem key={item.text} role={item.talker} text={item.text} />
          ))}
        </ContentBox>
      </Wrapper>
    </Overlay>
  );
};

export default Modal;

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
