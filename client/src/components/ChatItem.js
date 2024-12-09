import styled from 'styled-components';

const ChatItem = ({ role, text }) => {
  console.log('role', role);
  return (
    <Wrapper role={role}>
      <ChatBubble role={role}>{text}</ChatBubble>
    </Wrapper>
  );
};

export default ChatItem;

const Wrapper = styled.div`
  display: flex;
  justify-content: ${props => (props.role === 0 ? 'flex-start' : 'flex-end')};
  margin: 10px 0;
`;

const ChatBubble = styled.div`
  max-width: 60%;
  padding: 10px 15px;
  background-color: ${props =>
    props.role === 0 ? 'rgba(72, 69, 56, 0.2)' : 'rgba(0, 187, 249, 0.1)'};
  font-size: 16px;
  border-radius: 15px;
  border-top-left-radius: ${props => (props.role === 0 ? '0' : '15px')};
  border-top-right-radius: ${props => (props.role === 0 ? '15px' : '0')};
  color: black;
`;
