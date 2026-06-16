// 강화 재료 1장당 게이지 포인트 (풀게이지 = 5포인트).
// row: 재료 OVR - 대상 OVR, col index: 강화 단계 - 1 (0 = "1강→2강" ... 6 = "7강→8강")
// 8강 이후 단계는 공개된 실측치가 없어 "7강→8강" 값을 그대로 근사로 사용한다.
// 출처: https://canfactory.tistory.com/901 (사용자 제공 실측 자료, 풀게이지 기준 성공확률과도 일치 확인)
const POINT_TABLE = {
  6: [5, 5, 5, 5, 5, 5, 5],
  5: [5, 5, 5, 4.15, 4.16, 4.18, 4.21],
  4: [5, 5, 3.88, 3.12, 3.13, 3.14, 3.16],
  3: [5, 3.89, 2.92, 2.34, 2.35, 2.36, 2.37],
  2: [4.39, 2.93, 2.2, 1.67, 1.77, 1.77, 1.77],
  1: [3.31, 2.2, 1.65, 1.33, 1.33, 1.33, 1.33],
  0: [2.5, 1.66, 1.25, 1.0, 0.99, 0.99, 0.99],
  '-1': [1.88, 1.25, 0.94, 0.75, 0.75, 0.75, 0.75],
  '-2': [1.42, 0.94, 0.71, 0.57, 0.57, 0.57, 0.57],
  '-3': [1.07, 0.71, 0.53, 0, 0, 0, 0],
  '-4': [0.81, 0.54, 0, 0, 0, 0, 0],
  '-5': [0.81, 0, 0, 0, 0, 0, 0],
};

export const FULL_GAUGE_POINTS = 5;
export const TABLE_MAX_STAGE = 7;

export function getMaterialPoints(materialOvr, targetOvr, stage) {
  const diff = Math.round(Number(materialOvr) - Number(targetOvr));
  if (diff >= 6) return FULL_GAUGE_POINTS;
  if (diff < -5) return 0;
  const col = Math.min(stage, TABLE_MAX_STAGE) - 1;
  const row = POINT_TABLE[String(diff)];
  return row ? row[col] : 0;
}
