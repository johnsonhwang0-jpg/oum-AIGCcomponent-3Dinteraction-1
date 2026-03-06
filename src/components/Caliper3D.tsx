import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture, Text, Html, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import { createMainScaleTexture, createVernierScaleTexture } from '../utils/textures';

const MATERIAL_METAL = new THREE.MeshStandardMaterial({
  color: '#e5e7eb',
  roughness: 0.3,
  metalness: 0.6,
});

const MATERIAL_DARK_METAL = new THREE.MeshStandardMaterial({
  color: '#9ca3af',
  roughness: 0.4,
  metalness: 0.5,
});

function Label({ position, text, partId, visible }: { position: [number, number, number], text: string, partId: string, visible: boolean }) {
  const setHoveredPart = useStore((state) => state.setHoveredPart);
  
  if (!visible) return null;
  return (
    <Html position={position} center distanceFactor={10}>
      <div 
        className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap select-none backdrop-blur-sm cursor-help hover:bg-indigo-600 transition-colors pointer-events-auto"
        onPointerEnter={() => setHoveredPart(partId)}
        onPointerLeave={() => setHoveredPart(null)}
      >
        {text}
      </div>
    </Html>
  );
}

export function Caliper3D() {
  const { measurement, setMeasurement, showLabels, targetObject, objectPosition } = useStore();
  const sliderRef = useRef<THREE.Group>(null);
  const isDragging = useRef(false);
  const dragStart = useRef(0);
  const startMeasurement = useRef(0);
  const { camera, gl } = useThree();

  // Generate textures
  const mainScaleTexture = useMemo(() => {
    const canvas = createMainScaleTexture();
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = gl.capabilities.getMaxAnisotropy();
    return tex;
  }, [gl]);

  const vernierScaleTexture = useMemo(() => {
    const canvas = createVernierScaleTexture();
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = gl.capabilities.getMaxAnisotropy();
    return tex;
  }, [gl]);

  // Drag logic
  const onPointerDown = (e: any) => {
    e.stopPropagation();
    isDragging.current = true;
    dragStart.current = e.point.x;
    startMeasurement.current = measurement;
    // document.body.style.cursor = 'grabbing';
  };

  const onPointerUp = () => {
    isDragging.current = false;
    // document.body.style.cursor = 'default';
  };

  const onPointerMove = (e: any) => {
    if (isDragging.current) {
      const deltaX = e.point.x - dragStart.current;
      // 1 unit = 1 cm = 10 mm
      const deltaMM = deltaX * 10;
      let newMeasurement = startMeasurement.current + deltaMM;
      
      // Collision constraint
      if (targetObject !== 'none') {
        const [objX, objY, objZ] = objectPosition;
        
        // Check if object is vertically aligned with the outside jaws
        // Jaws are roughly at Y = [-4, 0]
        // Object center Y should be within this range roughly
        // Objects are radius 1 (size 2). 
        // If objY is between -4 and 1, it's likely in the jaw area.
        const inJawZoneY = objY > -5 && objY < 1;
        
        // Check if object is horizontally aligned (between fixed jaw and slider)
        // Fixed jaw edge is at 1.5.
        // Object radius is 1 (width 2).
        // Object left edge = objX - 1.
        // If Object left edge is near Fixed Jaw (1.5), we consider it "in place".
        // Let's be generous: if objX is > 1.0 (so it's to the right of the main body start)
        const inJawZoneX = objX > 1.0;

        if (inJawZoneY && inJawZoneX) {
             // All objects are approx 20mm wide (radius 1 = diameter 2cm = 20mm)
             const objectWidth = 20;
             
             // If we are trying to make the measurement SMALLER than the object width
             if (newMeasurement < objectWidth) {
                 // But only clamp if the object is actually "blocking" the slider.
                 // i.e., the slider is trying to move LEFT past the object's right edge.
                 // Object right edge X = objX + 1.
                 // Slider jaw left edge X = 1.5 + (newMeasurement/10).
                 // If Slider Jaw X < Object Right Edge X, collision!
                 
                 // Wait, simpler:
                 // If the object is "in the jaws", you can't close the jaws smaller than the object.
                 // We assume if it's in the zone, it's being measured.
                 
                 // To prevent "snapping" when dragging from far away:
                 // Only clamp if we were ALREADY close to or above the object width?
                 // Or just hard clamp. Hard clamp is safer for "simulation" feel.
                 newMeasurement = Math.max(objectWidth, newMeasurement);
             }
        }
      }
      
      setMeasurement(newMeasurement);
    }
  };

  // Global pointer up to catch release outside mesh
  useEffect(() => {
    window.addEventListener('pointerup', onPointerUp);
    return () => window.removeEventListener('pointerup', onPointerUp);
  }, []);

  // Offset slider by 1.5cm (width of fixed jaw) so that 0 measurement = jaws touching
  const sliderPos = (measurement / 10) + 1.5; 

  return (
    <group position={[-6, 0, 0]}>
      {/* --- Main Body (Fixed) --- */}
      <group>
        {/* Beam */}
        <RoundedBox args={[20, 1.5, 0.2]} radius={0.05} position={[10, 0, 0]} material={MATERIAL_METAL}>
           {/* Main Scale Texture Plane */}
           {/* Shifted to start at x=1.5 (Fixed Jaw Edge) */}
           {/* Plane width 16. Center at 1.5 + 8 = 9.5. Relative to Beam (10) is -0.5 */}
           <mesh position={[-0.5, 0.1, 0.11]}>
              <planeGeometry args={[16, 1.3]} />
              <meshBasicMaterial map={mainScaleTexture} transparent opacity={0.9} />
           </mesh>
        </RoundedBox>
        
        {/* Fixed Jaw (Outside) */}
        {/* Right edge at 1.5 */}
        <RoundedBox args={[1.5, 4, 0.2]} radius={0.05} position={[0.75, -2, 0]} material={MATERIAL_METAL} />
        {/* Jaw Tip */}
        <mesh position={[1.5, -3.5, 0]} rotation={[0,0,0]}>
            <cylinderGeometry args={[0.1, 0, 1, 3]} /> 
        </mesh>
        
        {/* Fixed Jaw (Inside) */}
        <RoundedBox args={[0.8, 1.5, 0.2]} radius={0.05} position={[0.4, 1.2, 0]} material={MATERIAL_METAL} />

        {/* Labels */}
        <Label position={[10, 1, 0]} text="Main Scale" partId="main-scale" visible={showLabels} />
        <Label position={[0.75, -4.2, 0]} text="Fixed Jaw" partId="fixed-jaw" visible={showLabels} />
        <Label position={[0.4, 2.2, 0]} text="Inside Jaws" partId="inside-jaws" visible={showLabels} />
      </group>

      {/* --- Slider Assembly (Moving) --- */}
      <group 
        ref={sliderRef} 
        position={[sliderPos, 0, 0.05]} 
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerOver={() => document.body.style.cursor = 'grab'}
        onPointerOut={() => !isDragging.current && (document.body.style.cursor = 'auto')}
      >
        {/* Slider Body */}
        <RoundedBox args={[4.5, 1.6, 0.25]} radius={0.05} position={[2.25, 0, 0.1]} material={MATERIAL_DARK_METAL}>
           {/* Vernier Scale Texture Plane */}
           {/* 19mm width in world units is 1.9. Texture maps to this. */}
           <mesh position={[-0.5, -0.4, 0.13]}>
              <planeGeometry args={[2.1, 0.6]} /> 
              <meshBasicMaterial map={vernierScaleTexture} transparent opacity={0.9} />
           </mesh>
        </RoundedBox>

        {/* Slider Jaw (Outside) */}
        {/* Left edge at 0 (relative) */}
        <RoundedBox args={[1.5, 4, 0.2]} radius={0.05} position={[0.75, -2, 0.1]} material={MATERIAL_DARK_METAL} />
        
        {/* Slider Jaw (Inside) */}
        <RoundedBox args={[0.8, 1.5, 0.2]} radius={0.05} position={[0.4, 1.2, 0.1]} material={MATERIAL_DARK_METAL} />

        {/* Thumb Rest / Lock Screw simulation */}
        <RoundedBox args={[0.5, 0.3, 0.1]} radius={0.1} position={[2.5, -0.9, 0.25]} material={MATERIAL_METAL} />
        <RoundedBox args={[0.2, 0.2, 0.3]} radius={0.05} position={[2.5, 0.9, 0.1]} material={new THREE.MeshStandardMaterial({ color: '#333' })} />

        {/* Depth Probe (Attached to slider, extends to tail) */}
        {/* The probe moves with slider. It should be a long thin rod starting from slider end and going left? 
            Actually, on a real caliper, the depth probe is a thin rod that slides inside the main beam groove.
            When jaws are closed, it is flush with the end of the beam.
            As slider moves right, the probe moves right, extending out of the beam's tail.
            Wait, the probe is attached to the slider. So if slider moves +X, probe moves +X.
            The beam is fixed. The probe slides IN the beam.
            Let's visualize it sticking out the RIGHT side of the beam end? 
            No, standard calipers: probe extends from the RIGHT end of the beam as you open the jaws.
            So it is attached to the slider.
        */}
        <group position={[0, 0, -0.15]}>
             {/* The rod itself. Length needs to be long enough. */}
             {/* It starts at the slider and goes right. */}
             <mesh position={[10, 0, 0]} rotation={[0, 0, 1.57]}>
                <cylinderGeometry args={[0.05, 0.05, 22, 8]} />
                <meshStandardMaterial color="#d1d5db" />
             </mesh>
        </group>

        {/* Labels */}
        <Label position={[2.25, 1, 0.3]} text="Vernier Scale" partId="vernier-scale" visible={showLabels} />
        <Label position={[0.75, -4.2, 0.3]} text="Sliding Jaw" partId="sliding-jaw" visible={showLabels} />
        <Label position={[2.5, 1.2, 0.3]} text="Lock Screw" partId="lock-screw" visible={showLabels} />
      </group>
      
      {/* Depth Probe Label (Fixed relative to world, pointing to the end) */}
      <Label position={[20 + sliderPos, 0, 0]} text="Depth Probe" partId="depth-probe" visible={showLabels && sliderPos > 2} />

    </group>
  );
}
