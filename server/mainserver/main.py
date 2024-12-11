from fastapi import FastAPI, HTTPException, Depends
from passlib.context import CryptContext
from jose import JWTError, jwt
from typing import Optional
from datetime import datetime, timedelta
from supabase import create_client, Client
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from uuid import UUID
import websockets
import json
import ssl
from datetime import date
from openai import OpenAI
from dotenv import load_dotenv
import os
from datamodel import *

load_dotenv()
# OAuth2PasswordBearer 객체 생성
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

chatgpt = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

# FastAPI 앱 생성
app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get('CORS_ALLOW_ORIGIN').split(
        ','),  # 클라이언트 URL을 여기에 추가
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메서드 허용 (GET, POST 등)
    allow_headers=["*"],  # 모든 HTTP 헤더 허용
)

# Supabase 연결 설정
SIGNALING_SERVER_URL = "ws://" + \
    os.environ.get('SIG_SERVER_IP')+':' + \
    os.environ.get('SIG_SERVER_PORT')  # 시그널링 서버 URL
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Password 암호화 및 검증
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT 설정
SECRET_KEY = os.environ.get('SECRET_KEY')
ALGORITHM = os.environ.get('ALGORITHM')
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.environ.get('ACCESS_TOKEN_EXPIRE_MINUTES'))


def hash_password(password: str) -> str:
    """비밀번호 해시 생성"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """비밀번호 검증"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: str):
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,  # user_id는 반드시 UUID 형식이어야 함
        "exp": expire,
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token

# API Endpoints


@app.post("/api/v1/signup")
def signup(user: UserSignup):
    """회원가입"""
    # Check if username or email already exists
    existing_user = supabase.table("users").select(
        "*").eq("username", user.username).execute()
    if existing_user.data:
        raise HTTPException(status_code=400, detail="Username already exists")

    existing_email = supabase.table("users").select(
        "*").eq("email", user.email).execute()
    if existing_email.data:
        raise HTTPException(status_code=400, detail="Email already exists")

    # Hash the password and save the user
    hashed_password = hash_password(user.password)
    response = supabase.table("users").insert({
        "username": user.username,
        "email": user.email,
        "name": user.name,
        "school": user.school,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow().isoformat(),
    }).execute()
    if response.data:
        return {"message": "User created successfully"}
    elif response.error:
        raise HTTPException(status_code=500, detail=response.error.message)
    # 알 수 없는 오류 처리
    raise HTTPException(status_code=500, detail="Unknown error occurred")


@app.post("/api/v1/login", response_model=dict)
def login(user: UserLogin):
    """로그인"""
    # Fetch user by username
    response = supabase.table("users").select(
        "*").eq("username", user.username).execute()
    db_user = response.data[0] if response.data else None
    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(
            status_code=401, detail="Invalid username or password")

    # Generate JWT token
    # 새로운 JWT 발급 (UUID 사용)
    access_token = create_access_token(user_id=db_user["id"])  # UUID가 사용됨
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/v1/userinfo")
def get_user_info(token: str = Depends(oauth2_scheme)):
    try:
        # JWT 디코딩
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=400, detail="Token missing 'sub' claim")

        # UUID 유효성 검증
        user_id = UUID(user_id)

        # Supabase에서 사용자 정보 가져오기
        response = supabase.table("users").select(
            "id, name, school").eq("id", str(user_id)).execute()

        if not response.data:  # 데이터가 없으면 사용자 없음
            raise HTTPException(status_code=404, detail="User not found")

        return response.data[0]  # 사용자 데이터 반환

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except ValueError as ve:
        print(f"ValueError: {ve}")
        raise HTTPException(status_code=400, detail="Invalid input")
    except Exception as e:
        print(f"Unhandled exception: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/conferences")
def get_conferences(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        teacher_id: str = payload.get("sub")
        print(teacher_id)
        if teacher_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    response = supabase.table("conference_logs").select(
        "*").eq("teacher_id", teacher_id).execute()
    if response.data is None:
        raise HTTPException(
            status_code=500, detail="Failed to fetch conference logs")

    return response.data


@app.post("/api/v1/getlogs")
def get_chaglogs(data: ChatInfo, token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        teacher_id: str = payload.get("sub")
        print(teacher_id)
        if teacher_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    response = supabase.table("chat_logs").select(
        "*").eq("teacher_id", teacher_id).eq("roomId", data.roomId).order("startat").execute()
    if response.data is None:
        raise HTTPException(
            status_code=500, detail="Failed to fetch conference logs")
    return response.data


@app.post("/api/v1/rooms")
async def create_room():
    try:
        print("Creating room")

        async with websockets.connect(SIGNALING_SERVER_URL) as websocket:
            # 방 생성 요청
            create_request = json.dumps({"action": "create_room"})
            print(create_request)
            await websocket.send(create_request)

            # 응답 받기
            response = await websocket.recv()
            response_data = json.loads(response)
            print(response)

            if response_data["status"] == "success":
                room_id = response_data["room_id"]
                return {"room_id": room_id}
            else:
                raise HTTPException(
                    status_code=500, detail="Failed to create room.")
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error connecting to signaling server: {e}")


@app.post("/api/v1/roominfo")
async def roominfo(data: RoomInfo, token: str = Depends(oauth2_scheme)):
    """
    JWT 토큰에서 teacher_id를 추출하고 conference_logs 테이블에 데이터 삽입.
    """
    try:
        # 토큰 디코딩
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        teacher_id = payload.get("sub")
        if not teacher_id:
            raise HTTPException(
                status_code=401, detail="Invalid token: 'sub' claim missing")

        # UUID 유효성 검증
        teacher_uuid = UUID(teacher_id)

    except (JWTError, ValueError) as e:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Supabase에 데이터 삽입
    try:
        insert_response = supabase.table("conference_logs").insert({
            "teacher_id": str(teacher_uuid),
            "student_name": data.student_name,
            "roomId": data.room_id,
            "description": "",
            "date": date.today().isoformat(),
            "created_at": datetime.utcnow().isoformat()
        }).execute()

        if insert_response.data:
            return {"message": "Successfully"}
        else:
            raise HTTPException(
                status_code=500, detail="Database insertion failed")
    except Exception as e:
        print(f"Unhandled exception: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/v1/chatlog")
def chat_log(data: RecognizedData, token: str = Depends(oauth2_scheme)):
    # 파일명에서 정보 추출
    talkertype, roomId, startdate, starttime = data.filename.split(".")[
        0].split("_")
    try:
        # JWT 토큰 디코딩 및 검증
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        teacher_id = payload.get("sub")

        # UUID 유효성 검증
        teacher_uuid = UUID(teacher_id)

    except (JWTError, ValueError) as e:
        teacher = supabase.table("conference_logs").select("teacher_id").eq(
            "roomId", roomId).order("created_at", desc=True).execute()
        teacher_id = teacher.data[0]['teacher_id']
        teacher_uuid = UUID(teacher_id)

    try:

        dt_object = datetime.strptime(
            f"{startdate}_{starttime}", "%Y%m%d_%H%M%S")
        formatted_datetime = dt_object.strftime("%Y-%m-%d %H:%M:%S")
        print(talkertype, roomId, startdate, starttime)
        # Supabase에 데이터 삽입
        insert_response = supabase.table("chat_logs").insert({
            "teacher_id": str(teacher_uuid),
            "roomId": roomId,
            "startat": formatted_datetime,
            "text": data.recognized_text,
            "created_at": datetime.utcnow().isoformat(),
            "talker": 0 if talkertype.lower() == 's' else 1  # 's'나 'S'일 경우 0, 나머지는 1
        }).execute()

        # 성공 여부 확인
        if insert_response.data:
            return {"message": "Successfully logged chat"}
        else:
            raise HTTPException(
                status_code=500, detail="Database insertion failed")

    except ValueError as ve:
        print(f"ValueError: {ve}")
        raise HTTPException(status_code=400, detail="Invalid filename format")

    except Exception as e:
        print(f"Unhandled exception: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/v1/end")
def endmeeting(data: ReportBase, token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        teacher_id: str = payload.get("sub")
        print(teacher_id)
        if teacher_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        teacher_uuid = UUID(teacher_id)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    response = supabase.table("chat_logs").select(
        "*").eq("teacher_id", teacher_id).eq("roomId", data.roomId).order("startat").execute()
    if response.data is None:
        raise HTTPException(
            status_code=500, detail="Failed to fetch conference logs")

    chatdata = "\n".join(
        [f"발화자 : {data.teacherName if x['talker']==1 else data.studentName} / 내용 : {x['text']} / 시간 : {x['startat']}" for x in response.data])

    try:
        completion = chatgpt.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "supabase에서 가져온 학생 진로상담 음성인식 데이터야. S는 학생, T는 선생이야. 데이터를 20자 이내로 요약해줘."},
                {'role': 'user', 'content': chatdata}
            ]
        )
        result = completion.choices[0].message.content
    except:
        raise HTTPException(
            status_code=500, detail="ChatGPT Not Working...")

    try:
        insert_response = supabase.table("conference_logs").update(
            {'description': result}
        ).eq('teacher_id', str(teacher_uuid)).eq("roomId", data.roomId).execute()

        if insert_response.data:
            return {"message": "Successfully"}
        else:
            raise HTTPException(
                status_code=500, detail="Database Changed failed")
    except Exception as e:
        print(f"Unhandled exception: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    return {"message": "Successfully"}


@app.post("/api/v1/recommendations")
async def recommend(data: ReportBase, token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        teacher_id: str = payload.get("sub")
        print(teacher_id)
        if teacher_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        teacher_uuid = UUID(teacher_id)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    response = supabase.table("chat_logs").select(
        "*").eq("teacher_id", teacher_id).eq("roomId", data.roomId).order("startat").execute()
    if response.data is None:
        raise HTTPException(
            status_code=500, detail="Failed to fetch conference logs")

    chatdata = [['T' if x['talker'] == 1 else 'S', x['text']]
                for x in response.data]
    temp_prev = 0
    todel = []
    for i in range(len(chatdata)-1):
        if chatdata[i][0] != chatdata[i+1][0]:
            temp_prev = i+1
        else:
            chatdata[temp_prev][1] += chatdata[i+1][1]
            todel.append(i+1)
    todel.sort(reverse=True)
    for i in todel:
        del chatdata[i]
    if chatdata[-1][0] == 'T':
        del chatdata[-1]
    messages = []
    for i in chatdata[-10:]:
        if i[0] == 'T':
            messages.append({'role': 'assistant', 'content': i[1]})
        else:
            messages.append({'role': 'user', 'content': i[1]})
    print(chatdata[-5:])
    try:
        completion = chatgpt.chat.completions.create(
            model="ft:gpt-4o-mini-2024-07-18:personal:hsver2:AW7mRKCh",
            messages=messages
        )
        result = completion.choices[0].message.content
        return {'message': result}
    except:
        raise HTTPException(
            status_code=500, detail="ChatGPT Not Working...")


@app.post("/api/v1/reports")
async def reports(data: ReportBase, token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        teacher_id: str = payload.get("sub")
        print(teacher_id)
        if teacher_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        teacher_uuid = UUID(teacher_id)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    response = supabase.table("chat_logs").select(
        "*").eq("teacher_id", teacher_id).eq("roomId", data.roomId).order("startat").execute()
    if response.data is None:
        raise HTTPException(
            status_code=500, detail="Failed to fetch conference logs")

    chatdata = "\n".join(
        [f"발화자 : {data.teacherName if x['talker']==1 else data.studentName} / 내용 : {x['text']} / 시간 : {x['startat']}" for x in response.data])

    try:
        print(chatdata)
        completion = chatgpt.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": f"""supabase에서 가져온 학생 진로상담 음성인식 데이터야. 
                선생님의 이름은 {data.teacherName}, 학생 이름은 {data.studentName}일 때, 상담 보고서를 Html문법으로 작성해줘. 상담 기본 정보, 상담요약, 주요 내용, 추후 과제 등이 포함되어야 해. 답변은 <html>로 시작해서 </html>로 끝나야 해."""},
                {'role': 'user', 'content': chatdata}
            ]
        )
        result = completion.choices[0].message.content
        print(result)
        return {'message': result}
    except:
        raise HTTPException(
            status_code=500, detail="ChatGPT Not Working...")
