const TYPE_COLORS = {
  Fire: '#FF4500', Water: '#1E90FF', Grass: '#32CD32',
  Electric: '#FFD700', Psychic: '#FF69B4', Normal: '#A8A878',
  Dark: '#705848', Ice: '#98D8D8', Dragon: '#7038F8', Fighting: '#C03028',
};

function Pips({ value, max = 5, color }) {
  return (
    <div className="pips">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className="pip" style={{ background: i < value ? color : '#333' }} />
      ))}
    </div>
  );
}

export default function MonsterCard({ imageBase64, stats }) {
  if (!stats) return null;

  const color = TYPE_COLORS[stats.type] ?? '#A8A878';

  return (
    <div className="card" style={{ borderColor: color, boxShadow: `0 0 24px ${color}88` }}>
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
        <div className="stat-row">
          <span className="stat-label">HP</span>
          <Pips value={stats.hp} color={color} />
          <span className="stat-value">{stats.hp}/5</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">ATK</span>
          <Pips value={stats.attack} color={color} />
          <span className="stat-value">{stats.attack} dmg</span>
        </div>
      </div>

      <div className="ability-box" style={{ borderColor: color }}>
        <div className="ability-name" style={{ color }}>
          ✦ {stats.specialAbility.name}
        </div>
        <div className="ability-desc">{stats.specialAbility.description}</div>
      </div>
    </div>
  );
}
