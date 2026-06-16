// src/utils/storage.ts

// 型定義：number または null が3つ並ぶ配列
export type ThresholdList = [number | null, number | null, number | null];

const STORAGE_KEY = 'bluetooth_pnp_thresholds';
// 初期値（例：1つ目は30%、2つ目は60%、3つ目は使わない）
const DEFAULT_THRESHOLDS: ThresholdList = [30, 60, null]; 

const thresholdStorage = {
  get: (): ThresholdList => {
    if (typeof window === 'undefined') return DEFAULT_THRESHOLDS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return DEFAULT_THRESHOLDS;
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === 3) {
        return parsed as ThresholdList;
      }
      return DEFAULT_THRESHOLDS;
    } catch {
      return DEFAULT_THRESHOLDS;
    }
  },

  set: (thresholds: ThresholdList): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(thresholds));
    } catch (error) {
      console.error('保存失敗', error);
    }
  }
};

export default thresholdStorage;