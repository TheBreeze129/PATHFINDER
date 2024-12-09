from fastapi import FastAPI, File, UploadFile, Depends
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
import uuid
from pydub import AudioSegment
import speech_recognition as sr
import requests

load_dotenv()

app = FastAPI()

# OAuth2PasswordBearer 객체 생성
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get('CORS_ALLOW_ORIGIN').split(
        ','),  # 클라이언트 URL을 여기에 추가
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메서드 허용 (GET, POST 등)
    allow_headers=["*"],  # 모든 HTTP 헤더 허용
)

# 업로드된 파일을 저장할 디렉토리 경로 설정
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.post("/api/v2/upload")
async def upload_audio(audio: UploadFile = File(...), token: str = Depends(oauth2_scheme)):
    try:
        # 고유한 파일 이름 생성하여 충돌 방지
        file_extension = os.path.splitext(audio.filename)[1]
        print(audio.filename)
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_location = os.path.join(UPLOAD_DIR, unique_filename)

        # 업로드된 파일 저장
        with open(file_location, "wb") as f:
            f.write(await audio.read())

        # webm 파일을 wav로 변환
        wav_filename = f"{uuid.uuid4()}.wav"
        wav_location = os.path.join(UPLOAD_DIR, wav_filename)

        # AudioSegment를 사용하여 변환
        audio_segment = AudioSegment.from_file(file_location, format="webm")
        audio_segment.export(wav_location, format="wav")

        # 음성 인식을 위한 Recognizer 인스턴스 생성
        recognizer = sr.Recognizer()

        # wav 파일 열기
        with sr.AudioFile(wav_location) as source:
            audio_data = recognizer.record(source)

        # 음성 인식 수행 (Google Web Speech API 사용)
        # 언어 코드는 한국어인 'ko-KR'로 설정
        recognized_text = recognizer.recognize_google(
            audio_data, language="ko-KR")
        print(recognized_text)

        try:
            response = requests.post(
                # 백엔드 URL
                f"https://{os.environ.get('MAIN_SERVER_IP')}:{os.environ.get('MAIN_SERVER_PORT')}/api/v1/chatlog",
                json={
                    "recognized_text": recognized_text,  # 인식된 텍스트
                    "filename": audio.filename         # 원본 파일 이름
                },
                headers={
                    "Content-Type": "application/json",
                    "Authorization": "Bearer "+token,  # 필요시 추가
                },
                verify=False
            )
            if response.status_code == 200:
                print("Data successfully sent to the backend.")
                backend_response = response.json()
            else:
                print(
                    f"Failed to send data to the backend: {response.status_code}")
                backend_response = response.json()

        except Exception as e:
            print(f"Error occurred while sending data to backend: {e}")
            backend_response = {
                "message": "Failed to send data to backend", "error": str(e)}

        # 필요에 따라 중간 파일 삭제 (선택 사항)
        os.remove(file_location)
        os.remove(wav_location)

        # 인식된 텍스트 반환
        return JSONResponse(
            content={
                "message": "File successfully uploaded and processed",
                "transcription": recognized_text,
                "backend_response": backend_response
            },
            status_code=200
        )

    except sr.UnknownValueError:
        return JSONResponse(
            content={
                "message": "Google Speech Recognition could not understand the audio"},
            status_code=400
        )
    except sr.RequestError as e:
        return JSONResponse(
            content={
                "message": f"Could not request results from Google Speech Recognition service; {e}"},
            status_code=500
        )
    except Exception as e:
        return JSONResponse(content={"message": str(e)}, status_code=500)
