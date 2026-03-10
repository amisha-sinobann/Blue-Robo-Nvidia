import { create } from 'zustand';
import * as THREE from 'three';

interface AppState {
  controlMode: 'AI' | 'MANUAL';
  setControlMode: (mode: 'AI' | 'MANUAL') => void;
  
  // Mutable references for high-frequency updates (no re-renders)
  robotPosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
  
  // Throttled UI state
  distance: number;
  setDistance: (d: number) => void;
  
  loss: number;
  setLoss: (loss: number) => void;
  steps: number;
  incrementSteps: () => void;
  cvConfidence: number;
  setCvConfidence: (conf: number) => void;
  targetInView: boolean;
  setTargetInView: (inView: boolean) => void;
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
  isDancing: boolean;
  setIsDancing: (dancing: boolean) => void;
  showHeatmap: boolean;
  setShowHeatmap: (show: boolean) => void;
  obstacles: THREE.Vector3[];
  setObstacles: (obs: THREE.Vector3[]) => void;
  
  // Dynamic Training Metrics
  difficulty: number;
  setDifficulty: (d: number) => void;
  catchCount: number;
  incrementCatchCount: () => void;
  targetVulnerable: boolean;
  setTargetVulnerable: (v: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  controlMode: 'AI',
  setControlMode: (mode) => set({ controlMode: mode }),
  
  robotPosition: new THREE.Vector3(0, 1.5, 0),
  targetPosition: new THREE.Vector3(5, 1, 5),
  
  distance: 0,
  setDistance: (d) => set({ distance: d }),
  
  loss: 1.0,
  setLoss: (loss) => set({ loss }),
  steps: 0,
  incrementSteps: () => set((state) => ({ steps: state.steps + 1 })),
  cvConfidence: 0,
  setCvConfidence: (conf) => set({ cvConfidence: conf }),
  targetInView: false,
  setTargetInView: (inView) => set({ targetInView: inView }),
  isPaused: false,
  setIsPaused: (paused) => set({ isPaused: paused }),
  isDancing: false,
  setIsDancing: (dancing) => set({ isDancing: dancing }),
  showHeatmap: false,
  setShowHeatmap: (show) => set({ showHeatmap: show }),
  obstacles: [],
  setObstacles: (obs) => set({ obstacles: obs }),
  
  difficulty: 5,
  setDifficulty: (d) => set({ difficulty: d }),
  catchCount: 0,
  incrementCatchCount: () => set((state) => ({ catchCount: state.catchCount + 1 })),
  targetVulnerable: false,
  setTargetVulnerable: (v) => set({ targetVulnerable: v }),
}));
