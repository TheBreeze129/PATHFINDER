import asyncio
import websockets
import ssl
import json
import random
import string
import os
from dotenv import load_dotenv

load_dotenv()


def generate_room_id():
    """Generate an 8-character room ID with uppercase letters and numbers."""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))


rooms = {}  # 방 ID를 키로 클라이언트 WebSocket 리스트를 저장
MAX_CLIENTS_PER_ROOM = 2

# STUN 서버 설정 (필요 시 TURN 서버 추가)
STUN_SERVER = "stun:stun.l.google.com:19302"


async def handler(websocket, path):
    global rooms
    print(f"Client connected: {websocket.remote_address}")

    try:
        async for message in websocket:
            print(
                f"Message received from {websocket.remote_address}: {message}")

            # 데이터 검증
            try:
                data = json.loads(message)
                action = data.get("action")
                print("ACTION:", action)
                if not action:
                    await websocket.send(json.dumps({"status": "error", "message": "Invalid action"}))
                    continue
            except json.JSONDecodeError:
                print(
                    f"Invalid JSON received from {websocket.remote_address}: {message}")
                await websocket.send(json.dumps({"status": "error", "message": "Invalid JSON format"}))
                continue

            # 방 생성
            if action == "create_room":
                room_id = generate_room_id()
                while room_id in rooms:  # 중복 방지
                    room_id = generate_room_id()
                rooms[room_id] = []
                await websocket.send(json.dumps({"status": "success", "room_id": room_id}))
                print(f"Room created: {room_id}")

            # 방 참가
            elif action == "join_room":
                room_id = data.get("room_id")
                print(room_id)
                if not room_id or room_id not in rooms:
                    await websocket.send(json.dumps({"status": "error", "message": "Room not found"}))
                    continue

                if websocket in rooms[room_id]:  # 클라이언트가 이미 방에 있는지 확인
                    await websocket.send(json.dumps({"status": "error", "message": "Already in the room"}))
                    continue

                if len(rooms[room_id]) >= MAX_CLIENTS_PER_ROOM:
                    await websocket.send(json.dumps({"status": "error", "message": "Room is full"}))
                    continue

                rooms[room_id].append(websocket)
                await websocket.send(json.dumps({"status": "success", "message": f"Joined room {room_id}"}))
                print(
                    f"Client {websocket.remote_address} joined room {room_id}")

            # 시그널링 메시지 처리: offer, answer, candidate
            elif action in ["offer", "answer", "candidate"]:
                room_id = data.get("room_id")
                if not room_id or room_id not in rooms:
                    await websocket.send(json.dumps({"status": "error", "message": "Room not found"}))
                    continue

                # 해당 방에 있는 다른 클라이언트에게 시그널링 메시지 전송
                for client in rooms[room_id]:
                    if client != websocket:  # 자신을 제외한 클라이언트에게만 전송
                        await client.send(json.dumps(data))

            else:
                await websocket.send(json.dumps({"status": "error", "message": "Unknown action"}))

    except websockets.ConnectionClosedOK:
        print(f"Client {websocket.remote_address} disconnected normally.")
    except websockets.ConnectionClosedError as e:
        print(f"Connection error with {websocket.remote_address}: {e}")
    except Exception as e:
        print(f"Unexpected error with {websocket.remote_address}: {e}")
    finally:
        # 클라이언트를 모든 방에서 제거
        for room_id, clients in list(rooms.items()):  # 방 목록을 복사하여 안전하게 반복
            if websocket in clients:
                clients.remove(websocket)
                print(
                    f"Client {websocket.remote_address} removed from room {room_id}")
                # 방이 비어 있으면 삭제
                if not clients:
                    del rooms[room_id]
                    print(f"Room {room_id} deleted")

# WebSocket 서버 시작 (wss://)
start_server = websockets.serve(handler, os.environ.get(
    'SIG_SERVER_IP'), int(os.environ.get('SIG_SERVER_PORT')))
print("Secure WebSocket (WSS) server running on port" +
      os.environ.get('SIG_SERVER_PORT'))

try:
    asyncio.get_event_loop().run_until_complete(start_server)
    asyncio.get_event_loop().run_forever()
except KeyboardInterrupt:
    print("Server shutdown requested by user.")
finally:
    print("Closing server...")
    asyncio.get_event_loop().stop()
