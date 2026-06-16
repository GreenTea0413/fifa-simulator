import { MAX_STAGE } from './enhanceData';
import { getTier } from './cardTiers';

export function PlayerCard({ ovr, stage }) {
  const tier = getTier(ovr);
  const dots = Array.from({ length: MAX_STAGE - 1 }, (_, i) => i < stage - 1);

  return (
    <div className={`player-card tier-${tier.key}`}>
      <span className="player-card-tier">{tier.label}</span>
      <span className="player-card-ovr">{ovr}</span>
      <span className="player-card-stage">{stage}강</span>
      <div className="player-card-dots">
        {dots.map((filled, i) => (
          <span key={i} className={`dot ${filled ? 'filled' : ''}`} />
        ))}
      </div>
    </div>
  );
}

export function TierBadge({ ovr }) {
  if (ovr === '' || ovr === null || ovr === undefined) {
    return <span className="tier-badge empty" />;
  }
  const tier = getTier(ovr);
  return <span className={`tier-badge tier-${tier.key}`} title={tier.label} />;
}
