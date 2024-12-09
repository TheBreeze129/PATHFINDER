from pydantic import BaseModel, EmailStr, Field


class UserSignup(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    name: str
    school: str
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    username: str
    email: EmailStr
    name: str
    school: str


class RoomInfo(BaseModel):
    room_id: str
    student_name: str


class RecognizedData(BaseModel):
    recognized_text: str
    filename: str


class ChatInfo(BaseModel):
    roomId: str


class ReportBase(BaseModel):
    teacherName: str
    studentName: str
    roomId: str
