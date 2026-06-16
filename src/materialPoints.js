// 강화 재료 1장당 게이지 포인트 (풀게이지 = 5포인트).
// row: 재료 OVR - 대상 OVR, col index: 강화 단계 - 1 (0 = "1강→2강" ... 6 = "7강→8강")
// null인 칸은 원본 자료에 측정값이 없던 칸("-")이다. 표 전체를 보면 diff가 1 낮아질
// 때마다 포인트가 거의 정확히 0.75배가 되는 패턴이 모든 열에서 일관되게 나타난다
// (예: 4강→5강 열의 +1,0,-1,-2 = 1.33, 1.00, 0.75, 0.57 → 비율 0.75, 0.75, 0.76).
// 따라서 측정값이 없는 칸은 0이 아니라, 같은 열에서 가장 가까운 상위 diff의 값에
// DECAY_RATIO를 거듭 곱해 추정한다 (0이 되는 게 아니라 점점 작아질 뿐).
// 출처: https://canfactory.tistory.com/901 (사용자 제공 실측 자료, 풀게이지 기준 성공확률과도 일치 확인)
const DECAY_RATIO = 0.75;

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
  '-3': [1.07, 0.71, 0.53, null, null, null, null],
  '-4': [0.81, 0.54, null, null, null, null, null],
  '-5': [0.81, null, null, null, null, null, null],
};

// 8강 이후 단계는 공개된 실측치가 부족해 기본적으로 "7강→8강" 값을 근사로 쓰지만,
// 사용자가 실제 게임 화면에서 직접 확인해 제공한 diff 값은 8강 이후 전체 구간에
// 동일하게 적용한다 (11강과 12강 양쪽에서 거의 같은 값으로 재확인되어, 7강 이후로는
// 더 이상 변하지 않고 수렴한다고 판단).
// 출처: 사용자 제공 스크린샷.
//  - 11강→12강, 대상 OVR 127: 재료 127(diff 0) 5장 -> 100.00%(장당 20.00%=1.00pt),
//    재료 130(diff +3) 1장 -> 49.22%(=2.461pt), 재료 131(diff +4) 1장 -> 66.50%(=3.325pt)
//  - 12강→13강, 대상 OVR 130: 재료 130(diff 0) -> 20.00%/장(=1.00pt, 위와 동일 확인),
//    재료 133(diff +3) 1장 -> 49.37%(=2.4685pt, 위와 거의 동일)
const HIGH_STAGE_THRESHOLD = 8;
const HIGH_STAGE_DIFF_OVERRIDES = { 0: 1.0, 3: 2.465, 4: 3.325 };

export const FULL_GAUGE_POINTS = 5;
export const TABLE_MAX_STAGE = 7;

function lookupColumn(diff, col) {
  const row = POINT_TABLE[String(diff)];
  if (row && row[col] != null) return row[col];
  // 측정값이 없으면 같은 열에서 가장 가까운 상위 diff 값을 찾아 0.75배씩 감쇠시켜 추정한다.
  for (let d = diff + 1; d <= 6; d++) {
    const anchorRow = POINT_TABLE[String(d)];
    if (anchorRow && anchorRow[col] != null) {
      return anchorRow[col] * Math.pow(DECAY_RATIO, d - diff);
    }
  }
  return 0;
}

export function getMaterialPoints(materialOvr, targetOvr, stage) {
  const diff = Math.round(Number(materialOvr) - Number(targetOvr));
  if (diff >= 6) return FULL_GAUGE_POINTS;

  if (stage >= HIGH_STAGE_THRESHOLD && HIGH_STAGE_DIFF_OVERRIDES[diff] !== undefined) {
    return HIGH_STAGE_DIFF_OVERRIDES[diff];
  }

  const col = Math.min(stage, TABLE_MAX_STAGE) - 1;
  return lookupColumn(diff, col);
}
