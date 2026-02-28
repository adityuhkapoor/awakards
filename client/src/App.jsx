import { useState } from 'react';
import DrawingCanvas from './DrawingCanvas';
import MonsterCard from './MonsterCard';
import { generateImage, parseStats } from './api';
import './App.css';

export default function App() {
  const [cardImage, setCardImage] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  async function handleGenerate(imageBase64, description, skipImageGen) {
    setError(null);
    try {
      if (skipImageGen) {
        const [parsedStats] = await Promise.all([parseStats(description)]);
        setCardImage(imageBase64);
        setStats(parsedStats);
      } else {
        const [imgB64, parsedStats] = await Promise.all([
          generateImage(imageBase64),
          parseStats(description),
        ]);
        setCardImage(imgB64);
        setStats(parsedStats);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="app">
      <h1>Monster Card Maker</h1>
      {error && <div className="error">Error: {error}</div>}
      <div className="layout">
        <DrawingCanvas onGenerate={handleGenerate} />
        {stats
          ? <MonsterCard imageBase64={cardImage} stats={stats} />
          : <div className="card-placeholder">Your card will appear here</div>
        }
      </div>
    </div>
  );
}
