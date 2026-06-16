import { useMemo } from 'react';
import {
  MAX_MATERIALS,
  MAX_STAGE,
  calcFinalProbability,
  calcGaugePercent,
  getDeltaOvr,
  getStageInfo,
  sumMaterialCost,
} from './enhanceData';
import { useSimulatorState } from './useSimulatorState';
import { formatKoreanCurrency, parseKoreanCurrency } from './koreanCurrency';
import { PlayerCard, TierBadge } from './PlayerCard';
import './App.css';

const fmt = (n) => formatKoreanCurrency(n);
const pct = (n) => `${(n * 100).toFixed(1)}%`;
const normalizeCost = (value) => formatKoreanCurrency(parseKoreanCurrency(value));

function App() {
  const [state, dispatch] = useSimulatorState();
  const {
    targetOvr,
    targetStage,
    materials,
    protectionEnabled,
    protectionCost,
    tolerance,
    totalAttempts,
    totalCost,
    successCount,
    failCount,
    roundAttempts,
    roundCost,
    history,
    lastResult,
  } = state;

  const isMaxed = targetStage >= MAX_STAGE;
  const stageInfo = isMaxed ? null : getStageInfo(targetStage);
  const gaugePercent = useMemo(
    () => calcGaugePercent(materials, targetOvr, tolerance),
    [materials, targetOvr, tolerance]
  );
  const finalProb = stageInfo ? calcFinalProbability(stageInfo.successRate, gaugePercent) : 0;
  const materialCost = useMemo(() => sumMaterialCost(materials), [materials]);
  const attemptCost =
    materialCost + (protectionEnabled ? parseKoreanCurrency(protectionCost) : 0);
  const delta = isMaxed ? 0 : getDeltaOvr(targetStage);

  return (
    <div className="page">
      <header className="page-header">
        <h1>FC 강화 시뮬레이터</h1>
        <p className="subtitle">선수 OVR 입력 없이, 강화 등급과 OVR만으로 빠르게 연습하세요</p>
      </header>

      <section className="card">
        <h2>강화 대상</h2>
        <PlayerCard ovr={targetOvr} stage={targetStage} />
        <div className="row">
          <label>
            현재 OVR
            <input
              type="number"
              inputMode="numeric"
              value={targetOvr}
              onChange={(e) =>
                dispatch({ type: 'SET_TARGET_OVR', value: Number(e.target.value) })
              }
            />
          </label>
          <label>
            현재 강화 단계
            <select
              value={targetStage}
              onChange={(e) =>
                dispatch({ type: 'SET_TARGET_STAGE', value: Number(e.target.value) })
              }
            >
              {Array.from({ length: MAX_STAGE }, (_, i) => i + 1).map((s) => (
                <option key={s} value={s}>
                  {s}강
                </option>
              ))}
            </select>
          </label>
        </div>
        {!isMaxed && (
          <p className="hint">
            성공 시 {targetStage}강 → {targetStage + 1}강 (OVR +{delta})
          </p>
        )}
        {isMaxed && <p className="hint">최대 강화 단계입니다.</p>}
      </section>

      <section className="card">
        <h2>강화 재료 (최대 {MAX_MATERIALS}개)</h2>
        {materials.map((m, i) => (
          <div className="material-row" key={i}>
            <TierBadge ovr={m.ovr} />
            <input
              type="number"
              inputMode="numeric"
              placeholder="재료 OVR"
              value={m.ovr}
              onChange={(e) =>
                dispatch({
                  type: 'SET_MATERIAL',
                  index: i,
                  field: 'ovr',
                  value: e.target.value === '' ? '' : Number(e.target.value),
                })
              }
            />
            <input
              type="text"
              placeholder="비용 (예: 5억)"
              value={m.cost}
              onChange={(e) =>
                dispatch({
                  type: 'SET_MATERIAL',
                  index: i,
                  field: 'cost',
                  value: e.target.value,
                })
              }
              onBlur={(e) =>
                e.target.value &&
                dispatch({
                  type: 'SET_MATERIAL',
                  index: i,
                  field: 'cost',
                  value: normalizeCost(e.target.value),
                })
              }
            />
            <button
              type="button"
              className="clear-btn"
              aria-label="재료 비우기"
              onClick={() => dispatch({ type: 'CLEAR_MATERIAL', index: i })}
            >
              ×
            </button>
          </div>
        ))}
        <details className="advanced">
          <summary>고급 설정: 재료 보정값</summary>
          <label className="tolerance-label">
            재료 OVR이 대상보다 낮을 때, 게이지가 0이 되는 OVR차
            <input
              type="number"
              inputMode="numeric"
              value={tolerance}
              onChange={(e) =>
                dispatch({ type: 'SET_TOLERANCE', value: Number(e.target.value) || 1 })
              }
            />
          </label>
          <p className="hint small">
            넥슨이 재료 OVR → 강화 포인트 환산식을 공개하지 않아 근사치입니다. 실제 게임에서
            관찰한 값으로 직접 보정해보세요.
          </p>
        </details>
      </section>

      <section className="card">
        <h2>강화등급 보호</h2>
        <div className="row protection-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={protectionEnabled}
              onChange={(e) =>
                dispatch({ type: 'SET_PROTECTION_ENABLED', value: e.target.checked })
              }
            />
            이번 시도에 등급 보호 사용
          </label>
          <label>
            보호 비용
            <input
              type="text"
              placeholder="비용 (예: 3000만)"
              disabled={!protectionEnabled}
              value={protectionCost}
              onChange={(e) =>
                dispatch({ type: 'SET_PROTECTION_COST', value: e.target.value })
              }
              onBlur={(e) =>
                e.target.value &&
                dispatch({ type: 'SET_PROTECTION_COST', value: normalizeCost(e.target.value) })
              }
            />
          </label>
        </div>
        <p className="hint small">
          보호를 사용하면 실패해도 강화 등급이 유지됩니다 (1강 초기화 없음).
        </p>
      </section>

      <section className="card result-card">
        <h2>강화 시도</h2>
        <div className="gauge-wrap">
          <div className="gauge-bar">
            <div className="gauge-fill" style={{ width: `${gaugePercent}%` }} />
          </div>
          <span className="gauge-label">게이지 {gaugePercent.toFixed(0)}%</span>
        </div>
        <div className="prob-display">
          최종 성공 확률 <strong>{pct(finalProb)}</strong>
        </div>
        <div className="cost-display">이번 시도 비용 {fmt(attemptCost)}</div>
        <button
          type="button"
          className="attempt-btn"
          disabled={isMaxed}
          onClick={() => dispatch({ type: 'ATTEMPT' })}
        >
          강화 시도
        </button>
        {lastResult && (
          <p className={`result-banner ${lastResult.success ? 'ok' : 'fail'}`}>
            {lastResult.message}
          </p>
        )}
        <div className="round-stats">
          이번 라운드 누적: {roundAttempts}회 시도 / 비용 {fmt(roundCost)}
        </div>
      </section>

      <section className="card">
        <h2>전체 통계</h2>
        <div className="stats-grid">
          <div>
            <span className="stat-num">{totalAttempts}</span>
            <span className="stat-label">총 시도</span>
          </div>
          <div>
            <span className="stat-num">{successCount}</span>
            <span className="stat-label">성공</span>
          </div>
          <div>
            <span className="stat-num">{failCount}</span>
            <span className="stat-label">실패</span>
          </div>
          <div>
            <span className="stat-num">{fmt(totalCost)}</span>
            <span className="stat-label">총 비용</span>
          </div>
        </div>
        <button
          type="button"
          className="reset-btn"
          onClick={() => {
            if (confirm('전체 통계와 강화 상태를 초기화할까요?')) {
              dispatch({ type: 'RESET_SESSION' });
            }
          }}
        >
          전체 초기화
        </button>
      </section>

      <section className="card">
        <h2>강화 기록</h2>
        {history.length === 0 && <p className="hint">아직 강화 기록이 없습니다.</p>}
        <ul className="history-list">
          {history.map((h) => (
            <li key={h.id} className={h.success ? 'ok' : 'fail'}>
              <span>
                {h.fromStage}강 → {h.toStage}강
                {h.protectedUsed ? ' (보호)' : ''}
              </span>
              <span>{h.success ? `${h.attemptsInRound}회 누적 비용 ${fmt(h.roundCost)}` : '실패'}</span>
            </li>
          ))}
        </ul>
        {history.length > 0 && (
          <button
            type="button"
            className="reset-btn"
            onClick={() => dispatch({ type: 'CLEAR_HISTORY' })}
          >
            기록 지우기
          </button>
        )}
      </section>
    </div>
  );
}

export default App;
