# Awakards

AR card battle game where you draw monsters, AI generates balanced cards, and you battle them in augmented reality.

## Quick Start

```bash
# 1. Generate SSL certs (needed for camera access)
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj '/CN=localhost'

# 2. Create .env with your Gemini API key
echo "GEMINI_API_KEY=your-key-here" > .env

# 3. Start server
python3 serve.py
```

Open https://localhost:8443 (accept the self-signed cert warning).

For phone testing, use the IP address printed by the server (e.g. `https://192.168.x.x:8443`).

## How to Play

### 1. Create Cards

Go to the lobby and click **Create Card** for Player 1.

- Draw a monster on paper and take a photo
- Pick **Health** (Low / Med / High) and **Attack** (Low / Med / High)
- Type a **Special Ability** name (e.g. "Drain", "Shield", "Burn")
- Hit **Forge Monster** — Gemini generates balanced stats, Imagen creates card art
- Save the card, then repeat for Player 2

### 2. Print AR Targets

Go to https://localhost:8443/cards.html and print the two target images (raccoon = Player 1, bear = Player 2). Cut them out and place them on a table.

### 3. Battle

Click **Start Battle** from the lobby. Point your phone camera at both printed cards on the table. Once both are detected, combat begins automatically.

- Tap skill buttons to attack
- Enemy responds automatically
- Special abilities trigger with 30% chance per attack
- Game ends when one monster's HP hits zero

## Pages

| URL | Purpose |
|-----|---------|
| `/` | Lobby — card slots, create/battle links |
| `/create.html?player=1` | Create Player 1's card |
| `/create.html?player=2` | Create Player 2's card |
| `/battle.html` | AR combat |
| `/cards.html` | Print AR target images |
| `/test.html` | Standalone monster generator (debug) |

## Testing Without AR

Paste this in your browser console to mock two cards, then open `/battle.html`:

```javascript
localStorage.setItem('awakards_p1', JSON.stringify({name:"Red Cyclops",type:"ice",hp:95,attack:25,specialAbility:{name:"Ice Eye",mechanic:"freeze",value:1,description:"Freezes the enemy"},skills:[{name:"Frost Beam",damage:22,color:"#0099ff",description:"A beam of ice"},{name:"Blizzard",damage:30,color:"#00ccff",description:"A freezing storm"},{name:"Absolute Zero",damage:60,color:"#ffffff",description:"Freezes everything"}],portrait:""}));
localStorage.setItem('awakards_p2', JSON.stringify({name:"Shadow Bat",type:"shadow",hp:80,attack:30,specialAbility:{name:"Drain",mechanic:"drain",value:15,description:"Steals life"},skills:[{name:"Dark Slash",damage:28,color:"#8833cc",description:"A shadowy strike"},{name:"Nightmare",damage:32,color:"#660099",description:"Haunting attack"},{name:"Void Crush",damage:65,color:"#440066",description:"Crushing darkness"}],portrait:""}));
```

## Special Abilities

| Type | Effect |
|------|--------|
| Drain | Heal attacker by X HP per attack |
| Shield | Reduce incoming damage by X for 3 turns |
| Burn | Deal X damage per turn for 3 turns |
| Freeze | Skip enemy's next turn |
| Boost | Increase next attack damage by X |

## Tech Stack

- **Frontend**: Vanilla JS, Three.js, MindAR
- **Backend**: Python 3 HTTPS server
- **AI**: Gemini 2.5 Flash (stats), Imagen 4.0 Fast (portraits)
- **No build step** — just HTML files served over HTTPS
