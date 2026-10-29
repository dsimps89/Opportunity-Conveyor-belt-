
"""Launch Situational Geometry from Pyto on localhost."""
import http.server, os, socketserver, webbrowser
from pathlib import Path
os.chdir(Path(__file__).resolve().parent)
class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control','no-store, max-age=0')
        super().end_headers()
with socketserver.TCPServer(('127.0.0.1',0),Handler) as server:
    url=f'http://127.0.0.1:{server.server_address[1]}/index.html'
    print('Situational Geometry V50:',url,flush=True)
    try:webbrowser.open(url)
    except Exception:pass
    server.serve_forever()
