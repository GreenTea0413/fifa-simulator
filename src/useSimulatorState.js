import { useEffect, useReducer } from 'react';
import {
  CUM_OVR,
  MAX_MATERIALS,
  MAX_STAGE,
  calcFinalProbability,
  calcGaugePercent,
  getDeltaOvr,
  getStageInfo,
  sumMaterialCost,
} from './enhanceData';
import { parseKoreanCurrency } from './koreanCurrency';

const STORAGE_KEY = 'fc-enhance-sim-v1';

const emptyMaterials = () =>
  Array.from({ length: MAX_MATERIALS }, () => ({ ovr: '', cost: '' }));

const defaultState = {
  targetOvr: 80,
  targetStage: 1,
  materials: emptyMaterials(),
  protectionEnabled: false,
  protectionCost: '',
  totalAttempts: 0,
  totalCost: 0,
  successCount: 0,
  failCount: 0,
  roundAttempts: 0,
  roundCost: 0,
  history: [],
  lastResult: null,
};

function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    return { ...defaultState, ...parsed, materials: parsed.materials ?? emptyMaterials() };
  } catch {
    return defaultState;
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_TARGET_OVR':
      return { ...state, targetOvr: action.value };
    case 'SET_TARGET_STAGE':
      return { ...state, targetStage: action.value };
    case 'SET_MATERIAL': {
      const materials = state.materials.map((m, i) =>
        i === action.index ? { ...m, [action.field]: action.value } : m
      );
      return { ...state, materials };
    }
    case 'CLEAR_MATERIAL': {
      const materials = state.materials.map((m, i) =>
        i === action.index ? { ovr: '', cost: '' } : m
      );
      return { ...state, materials };
    }
    case 'SET_PROTECTION_ENABLED':
      return { ...state, protectionEnabled: action.value };
    case 'SET_PROTECTION_COST':
      return { ...state, protectionCost: action.value };
    case 'CLEAR_HISTORY':
      return { ...state, history: [] };
    case 'RESET_SESSION':
      return { ...defaultState };
    case 'ATTEMPT': {
      if (state.targetStage >= MAX_STAGE) return state;
      const stageInfo = getStageInfo(state.targetStage);
      const gaugePercent = calcGaugePercent(state.materials, state.targetOvr, state.targetStage);
      const finalProb = calcFinalProbability(stageInfo.successRate, gaugePercent);
      const materialCost = sumMaterialCost(state.materials);
      const protectionCost = state.protectionEnabled
        ? parseKoreanCurrency(state.protectionCost)
        : 0;
      const attemptCost = materialCost + protectionCost;
      const isSuccess = Math.random() < finalProb;

      const roundAttempts = state.roundAttempts + 1;
      const roundCost = state.roundCost + attemptCost;

      let nextStage = state.targetStage;
      let nextOvr = state.targetOvr;
      let lastResult;
      let historyEntry;

      if (isSuccess) {
        const delta = getDeltaOvr(state.targetStage);
        nextStage = state.targetStage + 1;
        nextOvr = state.targetOvr + delta;
        lastResult = {
          success: true,
          message: `성공! ${state.targetStage}강 → ${nextStage}강 (OVR +${delta})`,
        };
        historyEntry = {
          id: Date.now(),
          success: true,
          fromStage: state.targetStage,
          toStage: nextStage,
          gaugePercent,
          finalProb,
          attemptsInRound: roundAttempts,
          roundCost,
          protectedUsed: false,
        };
      } else if (state.protectionEnabled) {
        lastResult = {
          success: false,
          protected: true,
          message: `실패... 강화등급 보호로 ${state.targetStage}강 유지`,
        };
        historyEntry = {
          id: Date.now(),
          success: false,
          fromStage: state.targetStage,
          toStage: state.targetStage,
          gaugePercent,
          finalProb,
          attemptsInRound: roundAttempts,
          roundCost,
          protectedUsed: true,
        };
      } else {
        const baseOvr = state.targetOvr - CUM_OVR[state.targetStage];
        nextStage = 1;
        nextOvr = baseOvr;
        lastResult = {
          success: false,
          protected: false,
          message: `실패... 강화등급이 1강으로 초기화되었습니다`,
        };
        historyEntry = {
          id: Date.now(),
          success: false,
          fromStage: state.targetStage,
          toStage: 1,
          gaugePercent,
          finalProb,
          attemptsInRound: roundAttempts,
          roundCost,
          protectedUsed: false,
        };
      }

      return {
        ...state,
        targetStage: nextStage,
        targetOvr: nextOvr,
        totalAttempts: state.totalAttempts + 1,
        totalCost: state.totalCost + attemptCost,
        successCount: state.successCount + (isSuccess ? 1 : 0),
        failCount: state.failCount + (isSuccess ? 0 : 1),
        roundAttempts: isSuccess ? 0 : roundAttempts,
        roundCost: isSuccess ? 0 : roundCost,
        lastResult,
        history: [historyEntry, ...state.history].slice(0, 50),
      };
    }
    default:
      return state;
  }
}

export function useSimulatorState() {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return [state, dispatch];
}
