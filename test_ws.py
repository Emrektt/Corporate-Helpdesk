import asyncio
import websockets
import json

async def test():
    uri = "ws://localhost:8001/api/v1/chat/ws/4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlbXJlZWtlbjQ4NkBnbWFpbC5jb20iLCJleHAiOjE3ODQ5NzcxNDB9.fPP4xvl0mMW8ygMsh2jl1P9Bz4wfA35wTkPG281ZpFw"
    async with websockets.connect(uri) as websocket:
        print("Connected!")
        await websocket.send(json.dumps({"type": "message", "content": "Hello test!"}))
        print("Sent!")
        while True:
            try:
                msg = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                print(f"Received: {msg}")
            except Exception as e:
                print(f"Timeout/Error: {e}")
                break

asyncio.run(test())
