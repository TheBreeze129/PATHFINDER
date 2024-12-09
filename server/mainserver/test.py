import ssl
import websockets
import asyncio

async def test_connection():
    uri = "wss://192.168.0.2:8765"

    # SSL 검증 비활성화
    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    try:
        async with websockets.connect(uri, ssl=ssl_context) as websocket:
            print("Connected to signaling server")
            await websocket.send('{"action": "create_room"}')
            response = await websocket.recv()
            print("Response:", response)
    except Exception as e:
        print(f"Connection failed: {e}")

asyncio.run(test_connection())
