// 실제 선수 사진 대신, FC 온라인 카드 등급(브론즈~아이콘) 느낌의 색상 티어만 부여한다.
export const TIERS = [
  { min: 95, key: 'icon', label: '아이콘' },
  { min: 88, key: 'special', label: '스페셜' },
  { min: 80, key: 'gold', label: '골드' },
  { min: 70, key: 'silver', label: '실버' },
  { min: 0, key: 'bronze', label: '브론즈' },
];

export function getTier(ovr) {
  const n = Number(ovr);
  if (!Number.isFinite(n)) return TIERS[TIERS.length - 1];
  return TIERS.find((t) => n >= t.min) ?? TIERS[TIERS.length - 1];
}
