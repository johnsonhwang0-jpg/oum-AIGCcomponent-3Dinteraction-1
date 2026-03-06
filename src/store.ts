import { create } from 'zustand';

interface AppState {
  measurement: number; // in mm
  setMeasurement: (val: number) => void;
  showLabels: boolean;
  toggleLabels: () => void;
  showHelp: boolean;
  toggleHelp: () => void;
  targetObject: 'none' | 'sphere' | 'cube' | 'cylinder';
  setTargetObject: (obj: 'none' | 'sphere' | 'cube' | 'cylinder') => void;
  hoveredPart: string | null;
  setHoveredPart: (part: string | null) => void;
  isDraggingObject: boolean;
  setIsDraggingObject: (val: boolean) => void;
  objectPosition: [number, number, number];
  setObjectPosition: (pos: [number, number, number]) => void;
  isViewLocked: boolean;
  toggleViewLock: () => void;
}

export const useStore = create<AppState>((set) => ({
  measurement: 0,
  setMeasurement: (val) => set({ measurement: Math.max(0, Math.min(150, val)) }),
  showLabels: true,
  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),
  showHelp: false,
  toggleHelp: () => set((state) => ({ showHelp: !state.showHelp })),
  targetObject: 'none',
  setTargetObject: (obj) => set({ targetObject: obj }),
  hoveredPart: null,
  setHoveredPart: (part) => set({ hoveredPart: part }),
  isDraggingObject: false,
  setIsDraggingObject: (val) => set({ isDraggingObject: val }),
  objectPosition: [0, 0, 0],
  setObjectPosition: (pos) => set({ objectPosition: pos }),
  isViewLocked: false,
  toggleViewLock: () => set((state) => ({ isViewLocked: !state.isViewLocked })),
}));
