# Awakards — Design Notes

## Architecture

```
index.html (lobby)  →  create.html?player=1  →  create.html?player=2  →  battle.html
                         ↓                        ↓
                    /api/gemini              /api/gemini
                    /api/imagen              /api/imagen
                         ↓                        ↓
                    localStorage              localStorage
                    (awakards_p1)            (awakards_p2)
                                                  ↓
                                            battle.html reads both
                                            from localStorage
```

## Pages

| Page | Purpose |
|------|---------|
| `index.html` | Lobby — shows P1/P2 card slots, create/battle links |
| `create.html` | Card creation wizard — photo capture, stat input, AI generation |
| `battle.html` | AR combat — MindAR tracking, dynamic skills, special abilities |
| `cards.html` | Print AR target images for physical cards |
| `test.html` | Standalone monster generator test (legacy) |

## Card Data Schema (localStorage)

Keys: `awakards_p1`, `awakards_p2`

```json
{
  "name": "Inferno Stalker",
  "type": "fire",
  "description": "A serpentine beast wreathed in blue flame",
  "hp": 95,
  "attack": 25,
  "specialAbility": {
    "name": "Drain",
    "description": "Steals 15 HP from enemy on hit",
    "mechanic": "drain",
    "value": 15
  },
  "skills": [
    { "name": "Flame Lash", "damage": 20, "color": "#ff4400", "description": "A whip of fire" },
    { "name": "Ember Wave", "damage": 28, "color": "#ff6600", "description": "A wave of embers" },
    { "name": "Hellstorm", "damage": 55, "color": "#ffaa00", "description": "Rains fire from above" }
  ],
  "portrait": "data:image/png;base64,..."
}
```

## AI Stat Balancing

The Gemini prompt acts as "AI Game Master" with a ~200 point budget:
- `HP + (attack * 4) + (special_value * 2) ≈ 200`
- Health tiers: Low (60-80), Medium (85-105), High (110-140)
- Attack tiers: Low (15-20), Medium (21-28), High (29-35)
- Server-side validation clamps all values to safe ranges

## Special Ability Mechanics

| Mechanic | Effect | Trigger |
|----------|--------|---------|
| `drain` | Heal attacker by `value` HP | 30% per attack |
| `shield` | Reduce incoming damage by `value` for 3 turns | 30% per attack |
| `burn` | Deal `value` damage per turn for 3 turns | 30% per attack |
| `freeze` | Skip enemy's next turn | 30% per attack |
| `boost` | Increase next attack damage by `value` | 30% per attack |

## Tech Stack

- **Frontend**: Vanilla JS, Three.js v0.160.0, MindAR v1.2.5
- **Backend**: Python 3 HTTPS server (`serve.py`)
- **APIs**: Gemini 2.5 Flash (vision + stat gen), Imagen 4.0 Fast (portrait gen)
- **AR Targets**: MindAR band-example images (raccoon + bear)

## Proxy Server (`serve.py`)

- `POST /api/gemini` — image + conceptual stats → balanced monster JSON
- `POST /api/imagen` — description + type → portrait base64
- `POST /log` — remote console log relay from phone
- HTTPS on port 8443 with self-signed certs

---

## Stretch Goals

- Lyria RealTime adaptive music via WebSocket
- Gemini TTS announcer for combat narration
- GLB 3D models instead of portrait planes
- Environment cards (forest, weather effects)
