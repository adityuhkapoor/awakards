# Awakards — Team Task Breakdown

## Before You Start

Everyone is on branch `feature/unified-card-battle`. Since you're all editing **different files**, there should be zero merge conflicts. Just `git pull` before committing.

Agree on the shared data schema below, then split up and build.

---

## Shared Data Schema

Both `create.html` and `battle.html` read/write this JSON to `localStorage`. Keys are `"awakards_p1"` and `"awakards_p2"`.

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

**Type colors** (use these consistently):
```
fire: #ff4400, ice: #0099ff, lightning: #ffcc00, shadow: #8833cc, nature: #22cc44
```

**Special ability mechanics** (one of):
- `drain` — steal HP equal to `value` on each attack
- `shield` — reduce incoming damage by `value` for 3 turns
- `burn` — deal `value` damage per turn for 3 turns
- `freeze` — skip enemy's next turn (once per battle)
- `boost` — increase next attack damage by `value`

---

## Person 1: Card Creation (`create.html` + `serve.py`)

**Files you own:** `create.html` (new), `serve.py` (modify)
**Time estimate:** ~45 min

### What to build

A page where a player draws a monster, takes a photo, selects conceptual stats, and the AI generates a balanced card.

### serve.py changes

1. Replace `MONSTER_PROMPT` with a template that accepts `{health_tier}`, `{attack_tier}`, `{special_ability}` placeholders
2. The new prompt should tell Gemini to return the full schema above (with `hp`, `attack`, `specialAbility`, and `skills` with `damage` values)
3. Tell Gemini it's the "AI Game Master" and must balance stats using a ~200 point budget: `HP + (attack * 4) + (special_value * 2) ≈ 200`
4. Update `gemini_proxy()` to read `health`, `attack`, `specialAbility` from the request body (default to "Medium"/"Medium"/"Fireball" if missing for backward compat with test.html)
5. Add validation after parsing: clamp `hp` to 60-140, skill `damage` to 10-80, special `value` to 5-25

### create.html structure

```
URL: create.html?player=1  (or ?player=2)

[Header: "Player 1's Monster" or "Player 2's Monster"]
[Take Photo button]  [Photo preview]
[Health: Low / Med / High — button group]
[Attack: Low / Med / High — button group]
[Special Ability: text input, placeholder "e.g. Drain, Shield, Burn"]
[FORGE MONSTER button]

-- after generation --

[Pokemon-style card showing: portrait + name + type + HP + skills + special]
[SAVE CARD button → saves to localStorage as awakards_p1 or awakards_p2]
[Links: "Create other player's card" / "Go to Battle"]
```

### Key patterns to reuse from test.html

- Photo capture: `<input type="file" accept="image/*" capture="environment">` with FileReader → base64
- Gemini fetch: `POST /api/gemini` with `{ image, mime, health, attack, specialAbility }`
- Imagen fetch: `POST /api/imagen` with `{ description, type }` — fire this in parallel, show stats immediately
- Show portrait loading state while Imagen runs

### Save to localStorage

```javascript
const params = new URLSearchParams(location.search);
const playerNum = params.get('player') || '1';
// After card is generated:
localStorage.setItem(`awakards_p${playerNum}`, JSON.stringify(cardData));
```

---

## Person 2: AR Battle (`battle.html`)

**Files you own:** `battle.html` (new, based on current `index.html`)
**Time estimate:** ~45 min

### What to build

Copy `index.html` to `battle.html`, then refactor it to load monster data dynamically from localStorage instead of using hardcoded skills.

### Step-by-step

1. **Copy `index.html` → `battle.html`**

2. **Load monsters from localStorage** (replace hardcoded `SKILLS` and `MAX_HP`):
   ```javascript
   const p1Data = JSON.parse(localStorage.getItem('awakards_p1'));
   const p2Data = JSON.parse(localStorage.getItem('awakards_p2'));
   if (!p1Data || !p2Data) {
     // Show error: "Both players need to create cards first!"
     // Link to create.html
   }
   ```

3. **Build skill configs dynamically** from monster data:
   ```javascript
   function buildSkillConfig(skills) {
     const config = {};
     skills.forEach((sk, i) => {
       const key = i === 2 ? 'ultimate' : `skill${i}`;
       config[key] = {
         damage: sk.damage,
         color: parseInt(sk.color.replace('#', ''), 16),
         size: i === 2 ? 0.14 : 0.07,
         duration: i === 2 ? 700 : 480,
         flash: i === 2,
         shake: i === 2,
         name: sk.name,
       };
     });
     return config;
   }
   const P1_SKILLS = buildSkillConfig(p1Data.skills);
   const P2_SKILLS = buildSkillConfig(p2Data.skills);
   ```

4. **Per-player HP** — replace `MAX_HP = 100` with:
   ```javascript
   let p1HP = p1Data.hp;
   let p2HP = p2Data.hp;
   const P1_MAX = p1Data.hp;
   const P2_MAX = p2Data.hp;
   ```

5. **Dynamic skill buttons** — replace hardcoded HTML buttons. Generate from `p1Data.skills`:
   ```javascript
   function renderSkills(skills, container) {
     container.innerHTML = '';
     skills.forEach((sk, i) => {
       const btn = document.createElement('button');
       btn.className = 'skill-btn' + (i === 2 ? ' ultimate' : '');
       btn.dataset.skill = i === 2 ? 'ultimate' : `skill${i}`;
       btn.style.background = `linear-gradient(135deg, ${sk.color}, ${darken(sk.color)})`;
       btn.innerHTML = `${sk.name}<span class="skill-dmg">${sk.damage} DMG</span>`;
       container.appendChild(btn);
     });
   }
   ```

6. **Monster names in HUD** — replace "YOUR MONSTER" / "ENEMY" with actual names

7. **Portrait textures** (nice-to-have, skip if tight on time):
   ```javascript
   // Replace colored cubes with portrait on a plane:
   const tex = new THREE.TextureLoader().load(cardData.portrait);
   const plane = new THREE.Mesh(
     new THREE.PlaneGeometry(0.2, 0.2),
     new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide })
   );
   ```

8. **Enemy AI** — pick from P2's skills randomly:
   ```javascript
   function enemyPick() {
     const keys = Object.keys(P2_SKILLS);
     return keys[Math.floor(Math.random() * keys.length)];
   }
   ```

9. **attack() function** — change `SKILLS[skillKey]` to use the correct player's skill set:
   ```javascript
   const cfg = isP1 ? P1_SKILLS[skillKey] : P2_SKILLS[skillKey];
   ```

10. **Special abilities** (nice-to-have, implement if time allows):
    - 30% chance to trigger on each attack
    - `drain`: heal attacker by `value`
    - `burn`: apply DoT
    - `freeze`: skip next enemy turn
    - `shield`: reduce damage
    - `boost`: buff next attack

### Mock data for testing

Paste this in browser console to test without create.html:
```javascript
localStorage.setItem('awakards_p1', JSON.stringify({
  name: "Red Cyclops", type: "ice", hp: 95, attack: 25,
  specialAbility: { name: "Ice Eye", mechanic: "freeze", value: 1, description: "Freezes the enemy" },
  skills: [
    { name: "Frost Beam", damage: 22, color: "#0099ff", description: "A beam of ice" },
    { name: "Blizzard", damage: 30, color: "#00ccff", description: "A freezing storm" },
    { name: "Absolute Zero", damage: 60, color: "#ffffff", description: "Freezes everything" }
  ],
  portrait: ""
}));
localStorage.setItem('awakards_p2', JSON.stringify({
  name: "Shadow Bat", type: "shadow", hp: 80, attack: 30,
  specialAbility: { name: "Drain", mechanic: "drain", value: 15, description: "Steals life" },
  skills: [
    { name: "Dark Slash", damage: 28, color: "#8833cc", description: "A shadowy strike" },
    { name: "Nightmare", damage: 32, color: "#660099", description: "Haunting attack" },
    { name: "Void Crush", damage: 65, color: "#440066", description: "Crushing darkness" }
  ],
  portrait: ""
}));
```

---

## Person 3: Lobby + Integration (`index.html` + polish)

**Files you own:** `index.html` (replace content), `cards.html` (minor edit)
**Time estimate:** ~25 min, then help test/integrate

### What to build

Replace `index.html` with a simple lobby page that shows card slots and links to create/battle.

### index.html structure

```
[AWAKARDS title]

[Card 1 slot]          [Card 2 slot]
(empty or preview)     (empty or preview)
[Create P1 Card]       [Create P2 Card]

[START BATTLE button — disabled until both cards exist]
[Clear Cards button]
```

### Key behaviors

1. On load, check `localStorage` for `awakards_p1` and `awakards_p2`
2. If a card exists, show a mini preview (name, type, HP, portrait thumbnail)
3. "Create Card" links go to `create.html?player=1` and `create.html?player=2`
4. "START BATTLE" navigates to `battle.html` — only enabled when both cards exist
5. "Clear Cards" button: `localStorage.removeItem('awakards_p1'); localStorage.removeItem('awakards_p2');` then refresh

### cards.html update

Add a heading "Print these cards and place them on the table for AR tracking" and a link back to the lobby.

### After your page is done (~25 min)

- Help test the full flow end-to-end
- Fix any styling inconsistencies between pages
- Make sure the data contract works between create → localStorage → battle

---

## Git Workflow

```bash
# Everyone works on the same branch
git checkout feature/unified-card-battle

# Before committing, pull latest
git pull origin feature/unified-card-battle

# Commit your work
git add <your-files>
git commit -m "feat: <what you built>"
git push origin feature/unified-card-battle
```

Since you're editing **different files**, merge conflicts are extremely unlikely. Just communicate if you need to touch a file outside your scope.
