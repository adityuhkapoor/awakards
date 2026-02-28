# Awakards Demo Design

## Overview
AR card combat game. Physical cards on a table, phone on tripod tracks them, AR overlays + combat VFX render on screen (AirPlay to monitor for audience). Gemini generates monsters pre-game, narrates combat live. No app install — runs in mobile Safari.

## Physical Setup
- Camera phone on tripod, pointed at table
- AirPlay/HDMI to Mac/monitor for audience view
- Cards displayed on iPad/phones for dev, printed for final demo
- Two players play cards in front of the camera

## MindAR Targets (5 total, one .mind file)

| Target | Card | Image |
|--------|------|-------|
| 0 | P1 Monster | Simple distinct pattern/color |
| 1 | P2 Monster | Simple distinct pattern/color |
| 2 | Basic Attack | Shared — both players use |
| 3 | Special Attack | Shared |
| 4 | Ultimate Attack | Shared |

Card images: simplest possible geometric patterns with bold colors. Upgrade later if time allows.

## Game Flow

### Pre-battle
Pre-cached monsters loaded (curated best outputs from Gemini+Imagen pipeline). Both monster cards on table. Camera detects both → AR card overlays appear.

### Turn Loop
1. Turn banner: "Player 1's Turn"
2. P1 holds up ability card (Basic/Special/Ultimate) in front of camera
3. MindAR detects target → radial timer fills over 2 seconds
4. Timer completes → attack fires (deterministic VFX + fixed damage)
5. Simultaneously: POST game state to Gemini → narration text fades in async
6. HP bar updates on the card overlay itself
7. Turn passes to P2, repeat

### Climax (scripted ~turn 4)
P1 plays Ultimate → big VFX + screen flash + shake → KO → death dissolve → victory screen.

### Bonus
"Want to see how monsters are made?" → test.html, scan random object live.

## Responsibility Split

| Layer | Owner | Notes |
|-------|-------|-------|
| Monster generation | Gemini Vision + Imagen 4 | Pre-cached for demo |
| Turn narration | Gemini Flash | Non-blocking POST per turn |
| Demo scripting | Gemini system prompt | "Close fight, P1 wins turn 4" |
| Damage | Local JS | Fixed: Basic=25, Special=20, Ultimate=65 |
| VFX | Local Three.js | Beam, projectile, ultimate — deterministic |
| HP/turns/win | Local JS | Never touches Gemini |
| Card detection | MindAR | 5 targets in one .mind file |
| Confirm mechanic | Radial timer (2s hold) | Sustained MindAR detection |

## Ability Tiers

| Tier | Target | Damage | VFX |
|------|--------|--------|-----|
| Basic | 2 | 25 | Beam/line from attacker to defender |
| Special | 3 | 20 | Projectile sphere with trail |
| Ultimate | 4 | 65 | Large projectile + screen flash + shake |

3 basics + 1 ultimate = 140 > 100 HP. Game ends ~turn 4.

## Card Overlays (replacing cubes)
- CanvasTexture on PlaneGeometry (512x768)
- Layout: portrait, name, type badge, 3 skills, HP bar
- Pre-cached Imagen portrait in portrait area
- HP bar redraws live as damage taken
- Glow plane behind card, subtle pulse
- Gentle bob animation, no spin (cards face camera)

## Gemini Narration

**Per-turn payload:**
```json
{
  "p1": {"name": "Ceramic Golem", "type": "nature", "hp": 75},
  "p2": {"name": "Ice Serpent", "type": "ice", "hp": 55},
  "turn": 3,
  "attacker": "p1",
  "ability": "Basic Attack",
  "damage": 25,
  "history": ["p1 Basic 25", "p2 Special 20", "p1 Basic 25"]
}
```

**System prompt includes:** hidden directive for dramatic pacing, P1 wins ~turn 4.

**Display:** Semi-transparent banner at bottom, fades after 3 seconds.

**Non-blocking:** VFX + damage resolve instantly. Narration is flavor that arrives 1-2s later. If Gemini fails, combat still works.

## Demo Script (~90 seconds)

| Time | Action | Screen |
|------|--------|--------|
| 0:00 | Both monster cards on table | AR overlays appear |
| 0:10 | "Player 1's turn" | Turn banner |
| 0:15 | P1 holds Basic Attack | Radial timer → beam → HP drop |
| 0:20 | Gemini narration | "Ceramic Golem opens with a searing blast..." |
| 0:25 | P2 holds Special Attack | Timer → projectile → HP drop |
| 0:35 | Two more exchanges | HP getting low both sides |
| 0:50 | P1 holds Ultimate | Big timer → flash + shake → KO → death dissolve |
| 1:00 | Victory screen | "Ceramic Golem stands victorious!" |
| 1:10 | Bonus: test.html | Live scan of random object |

## Build Order
1. Compile .mind file with 5 simple card images
2. Card canvas rendering (CanvasTexture + PlaneGeometry)
3. Replace cubes with card groups, wire into anchors
4. Ability card detection + radial timer + turn integration
5. Deterministic VFX per tier (beam, projectile, ultimate)
6. Gemini narration pipeline (non-blocking POST per turn)
7. Pre-cache demo monsters (best Gemini+Imagen outputs)
8. Polish: entrance animation, glow pulse, death VFX on card groups
9. Test on iPhone + AirPlay
