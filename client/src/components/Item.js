import styled from 'styled-components';

const Item = ({
  teacherId,
  roodId,
  studentName,
  date,
  desc,
  onClick,
  onBtnClick,
}) => {
  return (
    <ItemWrapper onClick={onClick}>
      <StudentName>{studentName}</StudentName>
      <Split />
      <ContentWrapper>
        <Content>{date}</Content>
        <Content>{desc}</Content>
        <ReportBtn onClick={onBtnClick}>보고서 다운받기</ReportBtn>
      </ContentWrapper>
    </ItemWrapper>
  );
};

export default Item;

const ItemWrapper = styled.div`
  border-radius: 10px;
  width: 85%;
  height: 64px;
  background-color: rgba(0, 187, 249, 0.1);
  padding: 18px 50px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 55px;
  cursor: pointer;
`;

const StudentName = styled.div`
  font-size: 20px;
  font-weight: 600;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Split = styled.div`
  height: 100%;
  width: 1px;
  background-color: #484538;
`;
const ContentWrapper = styled.div`
  flex: 8;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;
const Content = styled.div`
  font-size: 16px;
`;

const ReportBtn = styled.div`
  height: 48px;
  border-radius: 20px;
  background-color: rgba(72, 69, 56, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-weight: 600;
  padding: 0px 27px;
`;
