# Awakards — Product Requirements Document (MVP v2)

## 1. Product Vision

Awakards MVP is a browser-based AR card combat demo that proves one core technical claim:
two physical cards can be tracked simultaneously on a phone camera feed while card-to-card combat effects resolve reliably in real time.

The MVP is optimized for a 3-minute hackathon demo and judged primarily on live reliability and visual clarity.

## 2. Success Criteria

- Dual-card tracking works handheld on iPhone in real table conditions.
- Combat sequence runs end-to-end: `P1 skill -> P2 skill -> P1 ultimate -> game over`.
- If Gemini is slow or unavailable, combat still resolves locally.
- Demo completes in under 30 seconds of combat after card placement.

## 3. Scope (MVP)

### In Scope

- MindAR image-target tracking with one `.mind` file.
- Two monster cards tracked simultaneously (`maxTrack: 2`).
- Monsters rendered as anchored visuals (cubes first, models optional).
- Scene-level projectile VFX traveling from cached attacker position to cached defender position.
- Local turn state machine, HP updates, KO/victory overlay.
- Skill buttons for Basic/Special/Ultimate with deterministic damage values.
- Optional Gemini narration/referee output as non-blocking enhancement.

### Out of Scope

- Hand-drawn sketch-to-card generation as required flow.
- ArUco/fiducial marker pipeline and marker-ID backend mapping.
- Persistent backend card database and UUID profile retrieval.
- Multiplayer networking across devices.
- Full deck-building systems, economy, accounts, or progression.

## 4. Source of Truth

Implementation decisions are locked for MVP:

- AR stack: `MindAR v1.2.5 + Three.js` (importmap, no build step).
- Tracking method: image targets from compiled `.mind` file.
- Runtime model: single web page running on phone browser.
- Combat authority: local deterministic resolver.
- Gemini role: additive, non-blocking.

If documentation conflicts with these items, this section wins.

## 5. Core System Architecture

1. Camera Feed -> MindAR Tracker.
2. MindAR emits `targetFound/targetLost` pose updates.
3. Anchor manager tracks monster anchors and debounced dual-target readiness.
4. Game state machine controls turns, HP, win conditions.
5. FX system executes projectiles and hit/KO effects between cached positions.
6. UI overlay shows turn, skills, HP, prompts.
7. Optional Gemini call returns commentary/structured flavor; never blocks turn resolution.

## 6. Mandatory Spike Gates (Do First)

### Spike 1: Version Compatibility

- Goal: 1 target, 1 cube, no console errors.
- Pass: cube appears on target with selected library versions.
- Fail action: pin Three.js to a known-compatible version and retest.

### Spike 2: Dual-Target Tracking

- Goal: 2 targets, 2 cubes concurrently.
- Pass: both anchors stable together in one frame.
- Fail action: adjust targets/spacing and tracking parameters.

### Spike 3: Handheld Stability

- Goal: run on real phone over a real table.
- Pass: acceptable jitter/flicker with brief occlusions.
- Fail action: tune `filterBeta`, `missTolerance`, `warmupTolerance`.

### Spike 4: Combat Path

- Goal: projectile A->B from cached world positions.
- Pass: clear, repeatable card-to-card effect.
- Fail action: rework position caching and effect timing.

## 7. Demo Flow (Judge-Facing)

1. Place two monster cards on table.
2. Both anchors lock; prompt changes to `Fight`.
3. P1 uses Skill 1.
4. P2 auto-responds after short delay.
5. P1 uses Ultimate; KO and victory overlay.

Target runtime for this sequence: 20-30 seconds.

## 8. Gameplay Rules (MVP)

- Initial HP: fixed and scripted for demo pacing.
- Skill tiers:
  - Basic: moderate damage.
  - Special: lower/variant damage with distinct VFX.
  - Ultimate: high damage, intended finishing move.
- Turn order: P1 -> P2 -> P1 scripted win.
- No randomness required for MVP.

## 9. Gemini Integration (MVP-safe)

Gemini is used in a way that is visible but non-critical to demo reliability.

- Recommended: short combat narration line per turn.
- Optional: structured referee JSON for flavor metadata.
- Hard requirement: local fallback path if Gemini call fails or times out.
- Constraint: no Gemini dependency in tracking, animation timing, or damage application.

## 10. Risks and Mitigations

- Dual-target instability.
  - Mitigation: spike gating first; no feature work before pass.
- Performance drop on phone.
  - Mitigation: simple geometry/materials first; profile before polish.
- State flicker from intermittent tracking.
  - Mitigation: debounce readiness/loss windows.
- Network/API instability.
  - Mitigation: all combat local; Gemini is optional overlay.

## 11. Acceptance Checklist

- [ ] Spike 1 passed.
- [ ] Spike 2 passed.
- [ ] Spike 3 passed.
- [ ] Spike 4 passed.
- [ ] Full scripted combat loop works start-to-finish.
- [ ] Demo can run without Gemini responses.
- [ ] One fallback mode documented (single tracked card + fixed enemy offset).

## 12. Post-MVP Stretch

- Replace cubes with curated GLB monsters.
- Better particles, hit reactions, and sound.
- Ability card tracking for physical move selection.
- Optional generation pipeline (photo -> monster metadata/art) as pre-battle bonus flow.
