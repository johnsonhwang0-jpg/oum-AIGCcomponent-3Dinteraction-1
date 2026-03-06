import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Ruler, Eye, HelpCircle, X, ZoomIn, Lock, Unlock } from 'lucide-react';

function ZoomView({ measurement }: { measurement: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensions
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear
    ctx.fillStyle = '#f8fafc'; // Slate-50
    ctx.fillRect(0, 0, width, height);
    
    // Scale factor for zoom: 1mm = 20px (Huge zoom)
    const pxPerMM = 20;
    
    // Draw Main Scale (Top)
    ctx.save();
    ctx.translate(0, 0);
    ctx.fillStyle = '#e2e8f0'; // Slate-200
    ctx.fillRect(0, 0, width, height / 2);
    
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.font = '14px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // Determine visible range
    // We want to center the view on the Vernier 0 mark.
    // Vernier 0 mark is at `measurement` mm relative to Main Scale 0.
    // Let's place `measurement` at the center of the canvas.
    const centerX = width / 2;
    
    // Draw Main Scale Ticks
    // Range: measurement - (width/2)/pxPerMM to measurement + ...
    const startMM = Math.floor((measurement - (width / 2) / pxPerMM));
    const endMM = Math.ceil((measurement + (width / 2) / pxPerMM));
    
    for (let m = startMM; m <= endMM; m++) {
      const x = centerX + (m - measurement) * pxPerMM;
      
      let tickH = 15;
      if (m % 10 === 0) {
        tickH = 30;
        ctx.fillText((m/10).toString(), x, 35);
      } else if (m % 5 === 0) {
        tickH = 22;
      }
      
      ctx.beginPath();
      ctx.moveTo(x, height/2);
      ctx.lineTo(x, height/2 - tickH);
      ctx.stroke();
    }
    ctx.restore();
    
    // Draw Vernier Scale (Bottom)
    ctx.save();
    ctx.translate(0, height / 2);
    ctx.fillStyle = '#cbd5e1'; // Slate-300
    ctx.fillRect(0, 0, width, height / 2);
    
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    
    // Vernier 0 is at `measurement` relative to Main Scale.
    // In our canvas coordinate system centered on `measurement`, Vernier 0 is at centerX.
    
    // 20 divisions = 19mm.
    // Each division = 19/20 = 0.95mm.
    const vernierDivWidthMM = 0.95;
    
    for (let i = 0; i <= 20; i++) {
      const offsetMM = i * vernierDivWidthMM;
      const x = centerX + offsetMM * pxPerMM;
      
      let tickH = 15;
      if (i % 10 === 0) {
        tickH = 30;
        ctx.fillText(i === 20 ? '10' : (i/2).toString(), x, height/2 - 35);
      } else if (i % 5 === 0) {
        tickH = 22;
      }
      
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, tickH);
      ctx.stroke();
      
      // Highlight matching line?
      // Check coincidence
      // Main scale value at this position: measurement + offsetMM
      // If close to integer?
      const mainVal = measurement + offsetMM;
      const distToInt = Math.abs(mainVal - Math.round(mainVal));
      if (distToInt < 0.01) {
         ctx.strokeStyle = 'red';
         ctx.lineWidth = 3;
         ctx.beginPath();
         ctx.moveTo(x, 0);
         ctx.lineTo(x, tickH);
         ctx.stroke();
         ctx.strokeStyle = '#000';
         ctx.lineWidth = 2;
      }
    }
    
    ctx.restore();
    
  }, [measurement]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden relative">
       <div className="absolute top-2 left-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
         <ZoomIn size={14} /> Zoom View
       </div>
       <canvas ref={canvasRef} width={400} height={120} className="w-full h-auto" />
       {/* Center Line Indicator */}
       <div className="absolute top-0 bottom-0 left-1/2 w-px bg-red-500/30 pointer-events-none"></div>
    </div>
  );
}

const PART_DETAILS: Record<string, { title: string; description: string }> = {
  'main-scale': {
    title: 'Main Scale',
    description: 'The fixed scale marked in millimeters (mm). Read this first to get the whole number part of the measurement.',
  },
  'vernier-scale': {
    title: 'Vernier Scale',
    description: 'The sliding scale that provides precision. Find the line that aligns perfectly with the main scale to get the decimal part (0.05mm precision).',
  },
  'fixed-jaw': {
    title: 'Fixed Jaw',
    description: 'The stationary part of the jaw system. Place one side of the object against this jaw.',
  },
  'sliding-jaw': {
    title: 'Sliding Jaw',
    description: 'Moves with the vernier scale. Slide this gently against the other side of the object to take a measurement.',
  },
  'inside-jaws': {
    title: 'Inside Jaws',
    description: 'Used to measure the internal diameter of holes or cylinders. Insert into the hole and expand until touching the sides.',
  },
  'depth-probe': {
    title: 'Depth Probe',
    description: 'A thin rod extending from the end. Used to measure the depth of holes or recesses.',
  },
  'lock-screw': {
    title: 'Lock Screw',
    description: 'Tighten this to lock the slider in place, preserving the measurement after removing the object.',
  },
};

function PartDetailTooltip() {
  const hoveredPart = useStore((state) => state.hoveredPart);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!hoveredPart || !PART_DETAILS[hoveredPart]) return null;

  const detail = PART_DETAILS[hoveredPart];
  const isScale = hoveredPart === 'main-scale' || hoveredPart === 'vernier-scale';

  return (
    <div 
      className="fixed z-50 pointer-events-none flex gap-4 items-start"
      style={{ 
        left: Math.min(mousePos.x + 20, window.innerWidth - 320), 
        top: Math.min(mousePos.y + 20, window.innerHeight - 200) 
      }}
    >
      {/* Magnifier / Visual */}
      <div className="w-32 h-32 bg-white rounded-full border-4 border-indigo-500 shadow-2xl overflow-hidden flex items-center justify-center relative">
         <div className="absolute inset-0 bg-slate-100 opacity-50"></div>
         {isScale ? (
           <div className="scale-[2] origin-center opacity-80">
             <Ruler size={48} className="text-slate-800" />
           </div>
         ) : (
           <Info size={48} className="text-indigo-500" />
         )}
         {/* Crosshair */}
         <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <div className="w-full h-px bg-indigo-900"></div>
            <div className="h-full w-px bg-indigo-900 absolute"></div>
         </div>
      </div>

      {/* Detail Card */}
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white/95 backdrop-blur p-4 rounded-xl shadow-xl border border-slate-200 w-64"
      >
        <h3 className="font-bold text-slate-900 text-lg mb-1">{detail.title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{detail.description}</p>
      </motion.div>
    </div>
  );
}

export function Overlay() {
  const { 
    measurement, 
    showLabels, 
    toggleLabels, 
    showHelp, 
    toggleHelp,
    targetObject,
    setTargetObject,
    isViewLocked,
    toggleViewLock
  } = useStore();

  // Calculate reading components
  const mainScaleReading = Math.floor(measurement); // Whole mm
  // Vernier reading: (measurement - mainScaleReading)
  // But due to float precision, we should be careful.
  // Our precision is 0.05mm.
  const remainder = measurement - mainScaleReading;
  const vernierReading = Math.round(remainder / 0.05) * 0.05;
  
  // For display, reconstruct to avoid float errors like 12.00000001
  const displayMeasurement = (mainScaleReading + vernierReading).toFixed(2);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
      <PartDetailTooltip />
      
      {/* Header / Title */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Vernier Caliper Lab</h1>
          <p className="text-slate-500 font-medium">Interactive 3D Simulation</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={toggleLabels}
            className={`p-3 rounded-xl flex items-center gap-2 transition-all shadow-sm border ${showLabels ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
          >
            <Info size={20} />
            <span className="font-medium hidden sm:inline">Labels</span>
          </button>
          
          <button 
            onClick={toggleHelp}
            className={`p-3 rounded-xl flex items-center gap-2 transition-all shadow-sm border ${showHelp ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
          >
            <HelpCircle size={20} />
            <span className="font-medium hidden sm:inline">Guide</span>
          </button>

          <button 
            onClick={toggleViewLock}
            className={`p-3 rounded-xl flex items-center gap-2 transition-all shadow-sm border ${isViewLocked ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
            title={isViewLocked ? "Unlock View" : "Lock View"}
          >
            {isViewLocked ? <Lock size={20} /> : <Unlock size={20} />}
            <span className="font-medium hidden sm:inline">{isViewLocked ? 'Locked' : 'View'}</span>
          </button>
        </div>
      </div>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute top-24 right-6 w-96 bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-slate-200 pointer-events-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">How to Read</h3>
              <button onClick={toggleHelp} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <div className="space-y-4 text-sm text-slate-600">
              <p>
                <strong className="text-slate-900 block mb-1">1. Read Main Scale (主尺)</strong>
                Look at the <span className="font-mono bg-slate-100 px-1 rounded">0</span> mark on the Vernier (sliding) scale. Read the millimeter value on the Main scale just to the left of it.
              </p>
              <p>
                <strong className="text-slate-900 block mb-1">2. Read Vernier Scale (游标)</strong>
                Find the line on the Vernier scale that aligns perfectly with any line on the Main scale. Multiply that line's index by the precision (0.05mm).
              </p>
              <p>
                <strong className="text-slate-900 block mb-1">3. Add Them Up</strong>
                Total = Main Scale + Vernier Scale
              </p>
              <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 mt-2">
                <p className="font-medium text-indigo-900">Current Example:</p>
                <p>Main: {mainScaleReading} mm</p>
                <p>Vernier: {vernierReading.toFixed(2)} mm</p>
                <p className="font-bold text-indigo-700 mt-1">Result: {displayMeasurement} mm</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between pointer-events-auto w-full">
        
        {/* Object Selector */}
        <div className="bg-white/90 backdrop-blur p-2 rounded-2xl shadow-lg border border-slate-200 flex gap-1">
          {(['none', 'sphere', 'cube', 'cylinder'] as const).map((obj) => (
            <button
              key={obj}
              onClick={() => setTargetObject(obj)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${targetObject === obj ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {obj.charAt(0).toUpperCase() + obj.slice(1)}
            </button>
          ))}
        </div>

        {/* Zoom View */}
        <div className="hidden md:block">
           <ZoomView measurement={measurement} />
        </div>

        {/* Digital Readout */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl min-w-[200px] text-center border border-slate-700">
          <div className="text-slate-400 text-xs font-mono uppercase tracking-widest mb-1">Measurement</div>
          <div className="text-4xl font-mono font-bold tracking-tighter tabular-nums text-emerald-400">
            {displayMeasurement}
            <span className="text-lg text-slate-500 ml-1">mm</span>
          </div>
        </div>

      </div>
    </div>
  );
}
