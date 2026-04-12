"""
Whisper STT HTTP Server
POST /transcribe  — send audio (WAV/webm), returns JSON { "text": "..." }
GET  /health      — returns 200 OK

Uses faster-whisper with tiny model for low latency.
Model auto-downloads on first run (~75MB).
"""
import json
import tempfile
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler

# Load model — tiny is ~75MB, fast, good enough for conversational English
from faster_whisper import WhisperModel

model = WhisperModel("tiny", device="cpu", compute_type="int8")


class STTHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/transcribe":
            self.send_error(404)
            return

        content_length = int(self.headers.get("Content-Length", 0))
        if content_length == 0 or content_length > 10 * 1024 * 1024:  # max 10MB
            self.send_error(400, "Bad audio size")
            return

        audio_data = self.rfile.read(content_length)

        # Write to temp file (whisper needs a file path)
        tmp = tempfile.NamedTemporaryFile(suffix=".webm", delete=False)
        try:
            tmp.write(audio_data)
            tmp.close()

            segments, info = model.transcribe(
                tmp.name, beam_size=3, language="en", vad_filter=True
            )
            text = " ".join([s.text.strip() for s in segments if s.text.strip()])

            result = json.dumps({"text": text}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(result)))
            self.end_headers()
            self.wfile.write(result)
        except Exception as e:
            err = json.dumps({"text": "", "error": str(e)}).encode()
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(err)
        finally:
            try:
                os.unlink(tmp.name)
            except:
                pass

    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"ok")
        else:
            self.send_error(404)

    def log_message(self, format, *args):
        pass  # suppress HTTP logs


if __name__ == "__main__":
    server = HTTPServer(("127.0.0.1", 0), STTHandler)
    port = server.server_address[1]
    print(f"PORT:{port}", flush=True)
    server.serve_forever()
