import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, ContactShadows, PerspectiveCamera } from '@react-three/drei';
import { Caliper3D } from './components/Caliper3D';
import { Overlay } from './components/Overlay';
import { TargetObjects } from './components/TargetObjects';
import { Suspense } from 'react';
import { useStore } from './store';

export default function App() {
  const isDraggingObject = useStore((state) => state.isDraggingObject);
  const isViewLocked = useStore((state) => state.isViewLocked);

  return (
    <div className="w-full h-screen bg-slate-50 overflow-hidden relative font-sans">
      <Overlay />
      
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 25]} fov={35} />
        
        <Suspense fallback={null}>
          <Environment preset="city" />
          
          <group position={[0, 1, 0]}>
            <Caliper3D />
            <TargetObjects />
          </group>

          <ContactShadows position={[0, -4, 0]} opacity={0.4} scale={40} blur={2} far={4.5} />
        </Suspense>

        <OrbitControls 
          makeDefault 
          enabled={!isDraggingObject && !isViewLocked}
          minPolarAngle={Math.PI / 2.5} 
          maxPolarAngle={Math.PI / 1.8}
          minAzimuthAngle={-Math.PI / 6}
          maxAzimuthAngle={Math.PI / 6}
          enablePan={true}
          minDistance={10}
          maxDistance={50}
          target={[5, 0, 0]} 
        />
      </Canvas>
    </div>
  );
}
