# Awakards — Product Requirements Document (MVP)

## 1. Product Vision

Awakards is an augmented reality (AR) tabletop card battle game where players design their own monsters from scratch and battle them in the real world. Players draw a creature on paper, assign it conceptual stats, and use AI to transform the rough sketch into polished card art while an AI "Game Master" balances the mechanics into hard numbers. Using AR technology, these custom digital cards are projected over physical tokens on a table, creating a social, user-generated hybrid of Pokemon and Yu-Gi-Oh! where imagination is the only limit.

The primary objective of the MVP is to demonstrate real-time, zero-friction integration of Generative AI (image + text) into a live game environment.

## 2. Target Audience

- **Primary**: Hackathon judges, demo-day attendees, portfolio reviewers
- **Secondary**: Friends playing together at a table — the "Stranger Things making up a game together" vibe

## 3. Core Systems

### System 1: The Generation Engine (Card Creation)

Turns a player's physical sketch + conceptual stats into a complete digital card.

**Flow:**
1. Player draws a monster on paper (e.g., "red cyclops with an ice eye")
2. Player snaps a photo of the drawing via the companion app
3. Player selects conceptual stats via UI dropdowns (not voice):
   - **Health**: Low / Medium / High
   - **Attack**: Low / Medium / High
   - **Special Ability**: Free-text name (e.g., "Drain", "Ice Beam", "Shadow Step")
4. App fires **two parallel API calls**:
   - **Image Generation API** — transforms the sketch into polished, anime-inspired trading card art
   - **Stat Balancing LLM** — translates conceptual stats into balanced numerical values using a point-budget system
5. Both results are merged into a single card profile (JSON) keyed by a unique UUID
6. A masking animation ("Forging Card...") plays for ~5-8 seconds to hide API latency

### System 2: The AR Engine (Card Projection)

Maps digital card profiles to physical markers and renders them in AR.

**Flow:**
1. Physical blank cards have pre-printed fiducial markers (ArUco markers or similar)
2. Each marker ID is mapped to a card UUID in the backend
3. Phone camera (mounted on tripod, looking down at table) continuously scans for markers
4. When a marker is detected, the system retrieves the card profile by UUID and overlays:
   - The polished 2D card art
   - Floating HP bar and stat display
5. The overlay tracks the physical card's position — move the card, the digital monster moves with it

### System 3: Combat State Machine

Simple turn-based battle logic running locally on one device.

**Flow:**
1. Both players have created and placed their cards on the table
2. AR displays both monsters with floating HP bars
3. Players take turns tapping an "Attack" button on screen
4. Each turn: calculate damage, apply special ability, update HP bars, check win condition
5. Game ends when one monster's HP reaches zero

## 4. Card Data Model

```json
{
  "id": "card_8472",
  "name": "Red Cyclops",
  "image_url": "https://...",
  "original_sketch_url": "https://...",
  "stats": {
    "hp": 20,
    "attack": 50,
    "special": {
      "name": "Ice Eye",
      "description": "Freezes opponent, skipping their next turn. 30% chance to trigger.",
      "effect_type": "status"
    }
  },
  "marker_id": "aruco_17",
  "created_at": "2026-02-28T12:00:00Z"
}
```

## 5. Stat Balancing Rules

Every card gets a **base budget of 100 points** to distribute across stats. The AI Game Master must follow these constraints:

| Player Input | Point Allocation | Example Value |
|---|---|---|
| Low | ~20% of budget | 20 |
| Medium | ~35% of budget | 35 |
| High | ~50% of budget | 50 |

- Health + Attack + Special Power cost must sum to ~100
- Special abilities with high impact (e.g., skip turn, drain) consume more of the budget
- The AI must return structured JSON, never conversational text

## 6. User Flow (Demo Script)

### Phase 1 — The Canvas
Player grabs pen and paper, draws their monster.

### Phase 2 — Digitization
Player places sketch under camera, taps "Capture." Selects stats via dropdown. Taps "Forge Monster."

### Phase 3 — The Masked Sprint
App shows a flashy processing animation. Behind the scenes, image generation and stat balancing run in parallel. Results merge into one card profile.

### Phase 4 — The Anchor
App signals the card is ready. Player places a physical blank card (with fiducial marker) on the table. AR engine detects the marker, pulls the card profile, and renders the monster hovering over the card.

### Phase 5 — The Showdown
Player 2 repeats Phases 1-4. Two monsters are now on the table. Players take turns attacking. Floating HP bars update. Game ends when one monster falls.

## 7. Technical Architecture

```
[Phone Camera] --> [Capture Sketch]
                        |
                   [Generate UUID]
                        |
               +--------+--------+
               |                 |
     [Image Gen API]    [Stat Balance LLM]
               |                 |
               +--------+--------+
                        |
                [Merged Card JSON]
                        |
                  [Card Database]
                        |
            [AR Marker Detection]
                        |
              [Render Card in AR]
                        |
              [Combat State Machine]
```

**Key architectural decisions:**
- **Parallel API calls**: Image and stat generation fire simultaneously, never sequentially
- **Latency masking**: Processing animations buy 5-8 seconds for API turnaround
- **Centralized state**: All data keyed by UUID — single source of truth
- **Local combat**: No networking; all battle logic runs on one device
- **Tripod mount**: Phone points down at table, freeing players' hands

## 8. MVP Feature Checklist

- [ ] Photo capture of hand-drawn sketch
- [ ] Stat selection UI (Health, Attack, Special dropdowns)
- [ ] Image generation API integration (sketch -> polished card art)
- [ ] Stat balancing LLM integration (conceptual stats -> balanced numbers)
- [ ] Card profile storage (UUID-keyed JSON)
- [ ] Fiducial marker detection (ArUco or similar)
- [ ] AR overlay rendering (2D sprite + floating HP bar)
- [ ] Turn-based combat loop (attack, damage calc, special ability, HP update, win check)
- [ ] Processing animation to mask API latency

## 9. Out of Scope (Do Not Build for MVP)

- Voice recognition / speech-to-text commands
- Full 3D monster models (use 2D sprites in 3D space)
- Complex deck-building or multi-card synergies
- Multiplayer networking (single device only)
- Environment cards (forest, weather, etc.) — cool idea, defer to v2
- User accounts or persistent card libraries

## 10. Open Questions

1. **AR SDK choice**: Unity + Vuforia, AR Foundation, or a web-based AR solution (AR.js / MindAR)?
2. **Image generation provider**: Which API for sketch-to-art? (Gemini/Nano Banana 2, DALL-E, Stable Diffusion)
3. **Hosting**: Local-only for demo, or deploy a lightweight backend?
4. **Physical cards**: How many pre-printed marker cards do we need for the demo? (Minimum: 2)
