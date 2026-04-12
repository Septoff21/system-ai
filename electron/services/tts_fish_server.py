"""
Fish Speech TTS HTTP Server (Optional)
POST /speak  — {text, voice} → returns MP3
GET  /health → 200 OK

To install:
  pip install fish-speech

Then place a voice reference audio in:
  electron/services/voices/jarvis.wav   (short clip of Jarvis from the movies)
  electron/services/voices/friday.wav   (short clip of Friday from the movies)

This server uses the same pattern as tts_server.py for seamless integration.
"""
import json
import sys
import os
from http.server import HTTPServer, BaseHTTPRequestHandler

# Check if fish-speech is installed
try:
    import fish_speech
    HAS_FISH = True
except ImportError:
    HAS_FISH = False

VOICES_DIR = os.path.join(os.path.dirname(__file__), 'voices')


class FishTTSHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != '/speak':
            self.send_error(404)
            return

        if not HAS_FISH:
            self.send_error(503, 'fish-speech not installed. Run: pip install fish-speech')
            return

        content_length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(content_length))
        text = body.get('text', '')
        voice = body.get('voice', 'jarvis')

        if not text:
            self.send_error(400, 'No text provided')
            return

        try:
            # TODO: Implement fish-speech inference
            # model_path = os.path.join(VOICES_DIR, f'{voice}.wav')
            # result = fish_speech.synthesize(text, reference_audio=model_path)
            # audio_bytes = result.to_mp3()

            self.send_response(501)
            self.end_headers()
            self.wfile.write(b'Fish Speech not yet implemented. Use Edge TTS.')
        except Exception as e:
            err = str(e).encode()
            self.send_response(500)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(err)

    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.end_headers()
            status = 'ready' if HAS_FISH else 'not_installed'
            self.wfile.write(json.dumps({'engine': 'fish-speech', 'status': status}).encode())
        else:
            self.send_error(404)

    def log_message(self, format, *args):
        pass


if __name__ == '__main__':
    if not HAS_FISH:
        print('[Fish TTS] fish-speech not installed. Install with: pip install fish-speech', file=sys.stderr)
        print('[Fish TTS] Falling back to Edge TTS.', file=sys.stderr)
        sys.exit(1)

    server = HTTPServer(('127.0.0.1', 0), FishTTSHandler)
    port = server.server_address[1]
    print(f'PORT:{port}', flush=True)
    server.serve_forever()
