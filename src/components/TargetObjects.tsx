import React, { useState, useRef } from 'react';
import { useStore } from '../store';
import { Sphere, Box, Cylinder } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

function DraggableObject({ children, initialPos, name }: { children: React.ReactNode, initialPos: [number, number, number], name: string }) {
  const [pos, setPos] = useState(initialPos);
  const { size, viewport } = useThree();
  const aspect = size.width / viewport.width;
  const setIsDraggingObject = useStore((state) => state.setIsDraggingObject);
  const setObjectPosition = useStore((state) => state.setObjectPosition);

  // Sync initial position
  React.useEffect(() => {
    setObjectPosition(initialPos);
  }, []);

  const ref = useRef<THREE.Group>(null);
  const isDragging = useRef(false);
  
  const onPointerDown = (e: any) => {
    e.stopPropagation();
    isDragging.current = true;
    setIsDraggingObject(true);
    // @ts-ignore
    e.target.setPointerCapture(e.pointerId);
  };
  
  const onPointerUp = (e: any) => {
    e.stopPropagation();
    isDragging.current = false;
    setIsDraggingObject(false);
    // @ts-ignore
    e.target.releasePointerCapture(e.pointerId);
  };
  
  const onPointerMove = (e: any) => {
    if (isDragging.current) {
        e.stopPropagation();
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const target = new THREE.Vector3();
        e.ray.intersectPlane(plane, target);
        const newPos: [number, number, number] = [target.x, target.y, 0];
        setPos(newPos);
        setObjectPosition(newPos);
    }
  };

  return (
    <group 
      position={pos as [number, number, number]} 
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerOver={() => document.body.style.cursor = 'move'}
      onPointerOut={() => document.body.style.cursor = 'auto'}
    >
      {children}
      {/* Label for the object */}
      {/* <Html position={[0, 1.2, 0]} center pointerEvents="none">
         <div className="text-xs bg-black/50 text-white px-1 rounded">{name}</div>
      </Html> */}
    </group>
  );
}

export function TargetObjects() {
  const { targetObject } = useStore();

  if (targetObject === 'none') return null;

  // Initial position: slightly below the jaws, ready to be dragged up
  const initialPos: [number, number, number] = [2.5, -3.5, 0];

  return (
    <>
      {targetObject === 'sphere' && (
        <DraggableObject initialPos={initialPos} name="Sphere">
          <Sphere args={[1, 32, 32]}>
            <meshStandardMaterial color="#ef4444" roughness={0.4} />
          </Sphere>
        </DraggableObject>
      )}
      {targetObject === 'cube' && (
        <DraggableObject initialPos={initialPos} name="Cube">
          <Box args={[2, 2, 2]}>
            <meshStandardMaterial color="#3b82f6" roughness={0.4} />
          </Box>
        </DraggableObject>
      )}
      {targetObject === 'cylinder' && (
        <DraggableObject initialPos={initialPos} name="Cylinder">
          <Cylinder args={[1, 1, 3, 32]} rotation={[1.57, 0, 0]}>
            <meshStandardMaterial color="#10b981" roughness={0.4} />
          </Cylinder>
        </DraggableObject>
      )}
    </>
  );
}
