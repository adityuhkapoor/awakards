# Awakards — Gemini Integration Design Notes

## Architecture

```
Phone Camera → Photo capture screen
    ↓
Photo → Python proxy → Gemini 3 Vision API
    ↓
Structured JSON (monster name, type, stats, 3 abilities)
    ↓
Monster description → Python proxy → Imagen 4 API
    ↓
Generated monster portrait (displayed in UI)
    ↓
Both players scanned → AR battle with Gemini-generated monsters
```

## Priority 1: Gemini Vision + Imagen 4 + Proxy

### Proxy Server (`serve.py`)
- Add `/api/gemini` POST endpoint — forwards image + prompt to Gemini API
- Add `/api/imagen` POST endpoint — forwards text prompt to Imagen 4 API
- Both use same GEMINI_API_KEY from env var
- CORS headers already handled

### Game Flow Change
1. **NEW: Scan Phase** — Player taps "Scan" → phone camera captures a photo (NOT MindAR, just a `<input type="file" capture="environment">` or canvas grab)
2. **NEW: Summoning Phase** — Photo sent to Gemini → loading spinner "Analyzing..." → monster stats returned → Imagen generates portrait → "Your monster: [name]!" with portrait + stats displayed
3. **EXISTING: Battle Phase** — Player places summoning card on table → AR activates → monster cube appears (later: replace cube with generated portrait as texture) → fight with Gemini-generated abilities
4. P2 flow: either second player scans OR we auto-generate an enemy via Gemini text-only prompt

### Gemini Vision Prompt
```
Analyze this image and create a fantasy battle monster inspired by it.
Return JSON with this exact schema:
{
  "name": string,           // creative monster name (2-3 words)
  "type": string,           // one of: fire, ice, lightning, shadow, nature
  "description": string,    // one sentence visual description
  "hp": number,             // between 80-120
  "skills": [
    {
      "name": string,       // creative skill name
      "damage": number,     // between 15-40
      "color": string,      // hex color for projectile
      "description": string // short flavor text
    }
    // exactly 3 skills, third should be an "ultimate" with 50-80 damage
  ]
}
```

### Imagen 4 Prompt
Built from Gemini's response:
```
"Fantasy battle monster portrait: [description]. [type] elemental creature.
Digital art style, dramatic lighting, game card art, detailed, vibrant colors.
Black background."
```

### Technical Notes
- Gemini structured output: use `response_mime_type: "application/json"` + `response_schema`
- Imagen 4 model: `imagen-4.0-fast-generate-001` (faster, good enough for hackathon)
- Image capture: `<input type="file" accept="image/*" capture="environment">` — works on all phones, no permissions hassle
- API key: stored in `.env`, loaded by Python server, never exposed to browser
- Monster portrait: displayed as HTML img during summoning, optionally mapped as Three.js texture on the cube during AR

### Risks
- Gemini occasionally returns malformed JSON even with schema → add try/catch + retry once
- Imagen can take 5-10s → show Gemini results (name, stats) immediately, load portrait async
- Phone photo quality varies → Gemini handles this well, it's multimodal

---

## Priority 2: Lyria RealTime (timeboxed 1hr)

### Notes
- WebSocket: `wss://generativelanguage.googleapis.com/ws/...v1alpha...BidiGenerateMusic`
- Auth unclear for browser WebSocket — may need proxy to establish connection
- Audio: raw PCM 48kHz stereo → Web Audio API AudioWorklet for playback
- State-driven prompts: swap weighted prompts at game state transitions
- 10 min session cap — fine for demo
- FALLBACK: royalty-free battle loop if this fights us

---

## Priority 3: Gemini TTS Announcer (stretch)

### Notes
- Pre-generate key phrases during load: "FIGHT!", "Victory!", "Defeat!", skill names
- Cache as audio blobs, play instantly during combat
- Uses Gemini API with `response_modalities: ["AUDIO"]`
- Could narrate monster descriptions during summoning phase
