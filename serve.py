#!/usr/bin/env python3
"""Local HTTPS server for Awakards with remote log relay + Gemini/Imagen proxy."""
import http.server
import ssl
import os
import socket
import json
import urllib.request
import urllib.error
from datetime import datetime

PORT = 8443
DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(DIR)
LOG_FILE = os.path.join(DIR, "debug.log")

# Load API key from .env
API_KEY = ""
env_path = os.path.join(DIR, ".env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            if line.startswith("GEMINI_API_KEY="):
                API_KEY = line.strip().split("=", 1)[1]

if not API_KEY:
    print("  WARNING: No GEMINI_API_KEY in .env — /api/gemini and /api/imagen will fail")

# Get local IP for phone testing
s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
try:
    s.connect(("8.8.8.8", 80))
    local_ip = s.getsockname()[0]
except Exception:
    local_ip = "localhost"
finally:
    s.close()

GEMINI_MODEL = "gemini-2.5-flash"
IMAGEN_MODEL = "imagen-4.0-fast-generate-001"

MONSTER_PROMPT_TEMPLATE = """Analyze this image and create a fantasy battle monster inspired by what you see.
Be creative — the monster should visually reference the object/scene in the image.

The player has chosen these conceptual stats:
- Health: {health_tier} (Low = 60-80 HP, Medium = 85-105 HP, High = 110-140 HP)
- Attack: {attack_tier} (Low = base 15-20, Medium = 21-28, High = 29-35)
- Special Ability: "{special_ability}"

BALANCING RULES — you are the AI Game Master:
- Total stat budget is ~200 points. HP + (attack * 4) + (special_value * 2) should be close to 200.
- If the player picks High HP AND High Attack, reduce one slightly to stay balanced.
- Map the special ability text into one of these mechanics: drain (steal HP), shield (reduce incoming damage), burn (damage over time), freeze (skip enemy turn once), boost (increase next attack damage).
- Determine a numeric value for the special ability (5-25 range).
- Skill damages should be proportional to the attack stat.

Return JSON with this exact schema:
{{
  "name": string (2-3 word creative monster name),
  "type": string (one of: fire, ice, lightning, shadow, nature),
  "description": string (one sentence visual description of the monster for generating art — describe the monster's appearance, NOT the original image),
  "hp": number (balanced HP based on health tier and budget),
  "attack": number (base attack value based on attack tier),
  "specialAbility": {{
    "name": string (the player's special ability name, refined if needed),
    "description": string (one sentence explaining what it does in battle),
    "mechanic": string (one of: drain, shield, burn, freeze, boost),
    "value": number (the numeric parameter, 5-25)
  }},
  "skills": [
    {{"name": string (creative skill name), "damage": number (15-30), "color": string (hex color like #ff4400), "description": string (short flavor text)}},
    {{"name": string, "damage": number (20-35), "color": string, "description": string}},
    {{"name": string (this is the ultimate attack — make it epic), "damage": number (45-75), "color": string, "description": string}}
  ]
}}
Exactly 3 skills. The ultimate (3rd skill) should deal roughly 2-3x the first skill's damage."""


def validate_monster(monster):
    """Clamp stats to sane ranges in case Gemini goes wild."""
    monster["hp"] = max(60, min(140, monster.get("hp", 100)))
    monster["attack"] = max(15, min(35, monster.get("attack", 25)))
    for sk in monster.get("skills", []):
        sk["damage"] = max(10, min(80, sk.get("damage", 25)))
    sa = monster.get("specialAbility", {})
    sa["value"] = max(5, min(25, sa.get("value", 10)))
    valid_mechanics = {"drain", "shield", "burn", "freeze", "boost"}
    if sa.get("mechanic") not in valid_mechanics:
        sa["mechanic"] = "boost"
    monster["specialAbility"] = sa
    return monster


def gemini_proxy(body):
    """Forward image+prompt to Gemini, return monster JSON."""
    data = json.loads(body)
    image_b64 = data.get("image", "")
    mime = data.get("mime", "image/jpeg")
    health_tier = data.get("health", "Medium")
    attack_tier = data.get("attack", "Medium")
    special = data.get("specialAbility", "Fireball")

    prompt = MONSTER_PROMPT_TEMPLATE.format(
        health_tier=health_tier,
        attack_tier=attack_tier,
        special_ability=special,
    )

    payload = {
        "contents": [{"parts": [
            {"inlineData": {"mimeType": mime, "data": image_b64}},
            {"text": prompt},
        ]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.8,
            "thinkingConfig": {"thinkingBudget": 0},
        },
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={API_KEY}"
    req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"})
    resp = urllib.request.urlopen(req, timeout=15)
    result = json.loads(resp.read())
    text = result["candidates"][0]["content"]["parts"][0]["text"]
    # Clean potential trailing commas
    text = text.replace(",\n}", "\n}").replace(",\n]", "\n]")
    monster = json.loads(text)
    monster = validate_monster(monster)
    return monster


def imagen_proxy(body):
    """Generate monster portrait via Imagen 4."""
    data = json.loads(body)
    description = data.get("description", "")
    monster_type = data.get("type", "fire")

    prompt = f"Fantasy battle monster portrait: {description}. {monster_type} elemental creature. Digital art style, dramatic lighting, game card art, detailed, vibrant colors. Black background. No text or words."

    payload = {
        "instances": [{"prompt": prompt}],
        "parameters": {"sampleCount": 1, "aspectRatio": "1:1"},
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{IMAGEN_MODEL}:predict?key={API_KEY}"
    req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"})
    resp = urllib.request.urlopen(req, timeout=20)
    result = json.loads(resp.read())
    img_b64 = result["predictions"][0]["bytesBase64Encoded"]
    return {"image": img_b64}


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _json_response(self, code, data):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8", errors="replace")

        if self.path == "/log":
            try:
                entries = json.loads(body)
            except json.JSONDecodeError:
                entries = [{"level": "raw", "msg": body}]
            ts = datetime.now().strftime("%H:%M:%S.%f")[:-3]
            with open(LOG_FILE, "a") as f:
                for e in entries:
                    level = e.get("level", "log").upper()
                    msg = e.get("msg", str(e))
                    line = f"[{ts}] {level}: {msg}\n"
                    f.write(line)
                    print(f"  PHONE {line.strip()}")
            self.send_response(204)
            self._cors()
            self.end_headers()

        elif self.path == "/api/gemini":
            try:
                print(f"  [GEMINI] Generating monster...")
                t0 = datetime.now()
                monster = gemini_proxy(body)
                dt = (datetime.now() - t0).total_seconds()
                print(f"  [GEMINI] Done in {dt:.1f}s — {monster.get('name', '?')}")
                self._json_response(200, monster)
            except Exception as e:
                print(f"  [GEMINI] ERROR: {e}")
                self._json_response(500, {"error": str(e)})

        elif self.path == "/api/imagen":
            try:
                print(f"  [IMAGEN] Generating portrait...")
                t0 = datetime.now()
                result = imagen_proxy(body)
                dt = (datetime.now() - t0).total_seconds()
                print(f"  [IMAGEN] Done in {dt:.1f}s")
                self._json_response(200, result)
            except Exception as e:
                print(f"  [IMAGEN] ERROR: {e}")
                self._json_response(500, {"error": str(e)})

        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def log_message(self, fmt, *args):
        if "/log" not in (args[0] if args else "") and "/api/" not in (args[0] if args else ""):
            super().log_message(fmt, *args)


ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ctx.load_cert_chain(os.path.join(DIR, "cert.pem"), os.path.join(DIR, "key.pem"))

server = http.server.HTTPServer(("0.0.0.0", PORT), Handler)
server.socket = ctx.wrap_socket(server.socket, server_side=True)

print(f"\n  Awakards running at:")
print(f"    Local:    https://localhost:{PORT}")
print(f"    Phone:    https://{local_ip}:{PORT}")
print(f"    Create:   https://{local_ip}:{PORT}/create.html")
print(f"    Battle:   https://{local_ip}:{PORT}/battle.html")
print(f"    Test:     https://{local_ip}:{PORT}/test.html")
print(f"    Logs:     {LOG_FILE}")
print(f"    API key:  {'SET' if API_KEY else 'MISSING'}")
print(f"\n  (Accept the self-signed cert warning on your phone)\n")

server.serve_forever()
