import { parseKoreanCurrency } from './koreanCurrency';
import { FULL_GAUGE_POINTS, getMaterialPoints } from './materialPoints';

// FC 온라인 선수 강화 성공 확률 / OVR 상승치
// 출처: 넥슨 공식 공지 "(26.4 기준) 선수 강화 성공 확률, 강화 실패 시 복구 확률 및
// 크리티컬 확률 안내"(fconline.nexon.com) + FC온라인 인벤 동일 자료로 교차 확인.
// cumOvr[stage] = 1강(기준) 대비 해당 강화등급에서의 누적 OVR 상승치.
export const CUM_OVR = {
  1: 0,
  2: 1,
  3: 2,
  4: 4,
  5: 6,
  6: 8,
  7: 11,
  8: 15,
  9: 17,
  10: 19,
  11: 21,
  12: 24,
  13: 27,
};

export const MAX_STAGE = 13;

// stage(N) -> N+1강으로 강화 시도할 때의 정보 (부스트 게이지 100% 기준 확률)
export const STAGE_TABLE = [
  { stage: 1, successRate: 1.0 },
  { stage: 2, successRate: 0.81 },
  { stage: 3, successRate: 0.64 },
  { stage: 4, successRate: 0.5 },
  { stage: 5, successRate: 0.26 },
  { stage: 6, successRate: 0.15 },
  { stage: 7, successRate: 0.07 },
  { stage: 8, successRate: 0.05 },
  { stage: 9, successRate: 0.04 },
  { stage: 10, successRate: 0.03 },
  { stage: 11, successRate: 0.02 },
  { stage: 12, successRate: 0.01 },
];

export function getStageInfo(stage) {
  return STAGE_TABLE.find((row) => row.stage === stage);
}

export function getDeltaOvr(stage) {
  return CUM_OVR[stage + 1] - CUM_OVR[stage];
}

export const MAX_MATERIALS = 5;

// 재료 OVR -> 강화부스트 게이지(%) 계산.
// 실측 재료표(materialPoints.js, 출처: canfactory.tistory.com/901)를 기반으로
// 재료별 포인트를 합산한다. 풀게이지(FULL_GAUGE_POINTS=5)에 도달하면 100%.
export function calcGaugePercent(materials, targetOvr, stage) {
  const slots = materials.slice(0, MAX_MATERIALS);
  const totalPoints = slots.reduce((sum, m) => {
    if (m.ovr === '' || m.ovr === null || m.ovr === undefined) return sum;
    return sum + getMaterialPoints(m.ovr, targetOvr, stage);
  }, 0);
  return Math.min(100, (totalPoints / FULL_GAUGE_POINTS) * 100);
}

export function calcFinalProbability(baseRate, gaugePercent) {
  return baseRate * (gaugePercent / 100);
}

export function sumMaterialCost(materials) {
  return materials.reduce((sum, m) => sum + parseKoreanCurrency(m.cost), 0);
}
