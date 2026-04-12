"""
Edge TTS HTTP Server — 常驻进程，避免每次 spawn Python 的开销
POST /speak  { "text": "...", "voice": "en-GB-RyanNeural", "rate": "+10%", "pitch": "-15Hz" }
→ 返回 audio/mpeg (MP3)
GET /health → 200 OK
"""

import asyncio
import json
import sys
import tempfile
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
import edge_tts

VOICES = {
    "jarvis": {"name": "en-GB-RyanNeural", "rate": "+10%", "pitch": "-15Hz"},
    "friday": {"name": "en-US-JennyNeural", "rate": "+8%", "pitch": "+0Hz"},
}


class TTSHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/speak":
            self.send_error(404)
            return

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON")
            return

        text = data.get("text", "").strip()
        if not text:
            self.send_error(400, "No text")
            return

        voice_key = data.get("voice", "jarvis")
        voice_config = VOICES.get(voice_key, VOICES["jarvis"])
        voice_name = data.get("voice_name", voice_config["name"])
        rate = data.get("rate", voice_config["rate"])
        pitch = data.get("pitch", voice_config["pitch"])

        # Run async TTS in sync context
        try:
            loop = asyncio.new_event_loop()
            audio_data = loop.run_until_complete(
                _generate(text, voice_name, rate, pitch)
            )
            loop.close()
        except Exception as e:
            self.send_error(500, str(e))
            return

        self.send_response(200)
        self.send_header("Content-Type", "audio/mpeg")
        self.send_header("Content-Length", str(len(audio_data)))
        self.end_headers()
        self.wfile.write(audio_data)

    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"ok")
        else:
            self.send_error(404)

    def log_message(self, format, *args):
        # Suppress default logging
        pass


async def _generate(text, voice, rate, pitch):
    tmp = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False)
    tmp_path = tmp.name
    tmp.close()

    try:
        communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
        await communicate.save(tmp_path)

        with open(tmp_path, "rb") as f:
            return f.read()
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


def main():
    # Bind to localhost only, random port
    server = HTTPServer(("127.0.0.1", 0), TTSHandler)
    port = server.server_address[1]

    # Print port to stdout so Node.js can read it
    print(f"PORT:{port}", flush=True)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()


if __name__ == "__main__":
    main()
