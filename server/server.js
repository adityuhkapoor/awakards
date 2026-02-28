require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve React build
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/generate-image
// Body: { imageBase64: string }  (the user's drawing as a base64 PNG)
// Returns: { imageBase64: string }  (Gemini-generated Pokemon-style image)
app.post('/api/generate-image', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' });

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp-image-generation',
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'image/png',
          data: imageBase64,
        },
      },
      `You are a Pokemon card artist. Based on this hand-drawn monster sketch, generate a
      clean, vibrant, Pokemon-style creature illustration. Make it look like official Pokemon
      card artwork: bold outlines, bright colors, dynamic pose, white background.
      Keep the core shape and features of the original drawing.`,
    ]);

    const response = await result.response;

    // Extract generated image from response parts
    const parts = response.candidates[0].content.parts;
    const imagePart = parts.find((p) => p.inlineData);
    if (!imagePart) return res.status(500).json({ error: 'No image returned from Gemini' });

    res.json({ imageBase64: imagePart.inlineData.data });
  } catch (err) {
    console.error('generate-image error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/parse-stats
// Body: { description: string }  (natural language like "this monster is very fast but weak")
// Returns: { stats: { hp, attack, defense, speed, special } }
app.post('/api/parse-stats', async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) return res.status(400).json({ error: 'description required' });

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a game designer creating monster card stats from a player's description.
The player describes their monster: "${description}"

Convert this into card stats. Rules:
- hp and attack are integers on a scale of 1-5 (1=very low, 2=low, 3=medium, 4=high, 5=very high)
- attack represents how much HP damage this card deals when it hits
- specialAbility is a unique named ability derived from the description (e.g. Poison, Freeze, Shield)
- The ability description should explain exactly what it does in one short sentence (e.g. "Deals 1 damage each turn after hitting an enemy")
- Be creative and faithful to the description

Respond ONLY with valid JSON, no explanation:
{
  "name": "<short monster name>",
  "type": "<one of: Fire, Water, Grass, Electric, Psychic, Normal, Dark, Ice, Dragon, Fighting>",
  "hp": <1-5>,
  "attack": <1-5>,
  "specialAbility": {
    "name": "<ability name>",
    "description": "<one sentence describing exactly what it does>"
  },
  "flavor": "<one sentence flavor text for the card>"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip markdown code fences if present
    const json = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    const stats = JSON.parse(json);

    res.json({ stats });
  } catch (err) {
    console.error('parse-stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// All non-API routes serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`App running on http://localhost:${PORT}`));
