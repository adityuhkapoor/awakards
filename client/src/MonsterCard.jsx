import { useRef } from 'react';
import html2canvas from 'html2canvas';

const TYPE_COLORS = {
  Fire: '#FF4500', Water: '#1E90FF', Grass: '#32CD32',
  Electric: '#FFD700', Psychic: '#FF69B4', Normal: '#A8A878',
  Dark: '#705848', Ice: '#98D8D8', Dragon: '#7038F8', Fighting: '#C03028',
};

function StatBadge({ icon, value }) {
  return (
    <div className="stat-badge">
      <span className="stat-badge-icon">{icon}</span>
      <span className="stat-badge-value">{value}</span>
    </div>
  );
}

export default function MonsterCard({ imageBase64, stats }) {
  const cardRef = useRef(null);

  if (!stats) return null;

  const color = TYPE_COLORS[stats.type] ?? '#A8A878';

  async function handleDownload() {
    const canvas = await html2canvas(cardRef.current, { useCORS: true, backgroundColor: null });
    const link = document.createElement('a');
    link.download = `${stats.name.replace(/\s+/g, '_')}_card.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  return (
    <div className="card-wrapper">
      <div className="card" ref={cardRef} style={{ borderColor: color, boxShadow: `0 0 24px ${color}88` }}>
        <div className="card-header" style={{ background: color }}>
          <span className="card-name">{stats.name}</span>
          <span className="card-type">{stats.type}</span>
        </div>

        <div className="card-image-wrapper">
          {imageBase64 ? (
            <img
              src={`data:image/png;base64,${imageBase64}`}
              alt="Monster"
              className="card-image"
            />
          ) : (
            <div className="card-image-placeholder">No image</div>
          )}
        </div>

        <p className="card-flavor">"{stats.flavor}"</p>

        <div className="stats">
          <StatBadge icon="❤️" value={stats.hp} />
          <StatBadge icon="⚔️" value={stats.attack} />
        </div>

        <div className="ability-box" style={{ borderColor: color }}>
          <div className="ability-name" style={{ color }}>
            ✦ {stats.specialAbility.name}
          </div>
          <div className="ability-desc">{stats.specialAbility.description}</div>
        </div>
      </div>

      <button className="btn-download" onClick={handleDownload}>
        Download Card PNG
      </button>
    </div>
  );
}
