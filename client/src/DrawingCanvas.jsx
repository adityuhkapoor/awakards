import { useRef, useState, useEffect } from 'react';

export default function DrawingCanvas({ onGenerate }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(6);
  const [description, setDescription] = useState('');
  const [skipImageGen, setSkipImageGen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches?.[0] ?? e;
    return {
      x: (touch.clientX - rect.left) * (canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function startDraw(e) {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setDrawing(true);
  }

  function draw(e) {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e, canvas);
    ctx.lineTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  function stopDraw() { setDrawing(false); }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  async function handleGenerate() {
    if (!description.trim()) {
      alert('Please describe your monster first!');
      return;
    }
    const canvas = canvasRef.current;
    const imageBase64 = canvas.toDataURL('image/png').split(',')[1];
    setLoading(true);
    try {
      await onGenerate(imageBase64, description, skipImageGen);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="canvas-panel">
      <h2>Draw Your Monster</h2>

      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        style={{ border: '3px solid #333', borderRadius: 8, cursor: 'crosshair', touchAction: 'none' }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />

      <div className="controls">
        <label>
          Color
          <input type="color" value={color} onChange={e => setColor(e.target.value)} />
        </label>
        <label>
          Size: {size}px
          <input type="range" min={2} max={30} value={size} onChange={e => setSize(+e.target.value)} />
        </label>
        <button onClick={clearCanvas} className="btn-secondary">Clear</button>
      </div>

      <textarea
        placeholder="Describe your monster's stats in plain English... e.g. 'low hp, medium attack, poison ability that deals 1 dmg each turn'"
        value={description}
        onChange={e => setDescription(e.target.value)}
        rows={3}
      />

      <label className="skip-label">
        <input
          type="checkbox"
          checked={skipImageGen}
          onChange={e => setSkipImageGen(e.target.checked)}
        />
        Use my drawing as the card image (skip AI image gen)
      </label>

      <button onClick={handleGenerate} disabled={loading} className="btn-primary">
        {loading ? 'Generating...' : 'Generate Card'}
      </button>
    </div>
  );
}
