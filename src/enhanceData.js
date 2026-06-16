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

// 재료 OVR -> 강화부스트 게이지(%) 근사 계산.
// 넥슨은 "강화 포인트"가 재료 OVR로부터 어떻게 산정되는지 정확한 공식을
// 공개하지 않았다 (공식 강화부스트 도우미도 BP 합계만 보여줄 뿐 산출식은 비공개).
// 커뮤니티에서 확인되는 사실만 반영한 근사 모델:
//  - 재료 OVR이 강화 대상 OVR 이상이면 슬롯 1칸(=1/5=20%) 가득 채움
//  - 대상보다 낮으면 `tolerance` OVR차 구간 안에서 선형으로 감소, 그 이상 차이나면 0
// tolerance는 실제 게임 관찰값으로 사용자가 직접 보정할 수 있도록 노출한다.
export function calcGaugePercent(materials, targetOvr, tolerance) {
  const slots = materials.slice(0, MAX_MATERIALS);
  const totalRatio = slots.reduce((sum, m) => {
    if (m.ovr === '' || m.ovr === null || m.ovr === undefined) return sum;
    const diff = Number(m.ovr) - targetOvr;
    const ratio = diff >= 0 ? 1 : Math.max(0, 1 + diff / tolerance);
    return sum + ratio;
  }, 0);
  return Math.min(100, (totalRatio / MAX_MATERIALS) * 100);
}

export function calcFinalProbability(baseRate, gaugePercent) {
  return baseRate * (gaugePercent / 100);
}

export function sumMaterialCost(materials) {
  return materials.reduce((sum, m) => sum + (Number(m.cost) || 0), 0);
}
