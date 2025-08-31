import React, { Suspense, useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Text, Box, Edges, Billboard } from '@react-three/drei';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';

import type { Feature, CustomFeature, ManifoldViewState as WindowState, QuantumFeature } from '../../types';
import { LoadingIndicator } from '../../App';
import { MinimizeIcon, XMarkIcon, CpuChipIcon } from '../icons';
import { ALL_FEATURES } from '../features/index';

const ICON_MAP: Record<string, React.FC> = ALL_FEATURES.reduce((acc, feature) => {
    const iconType = (feature.icon as React.ReactElement)?.type;
    if (typeof iconType === 'function' && iconType.name) acc[iconType.name] = iconType as React.FC;
    return acc;
}, {} as Record<string, React.FC>);
  
const IconComponent = ({ name }: { name: string }) => ICON_MAP[name] ? React.createElement(ICON_MAP[name]) : <CpuChipIcon />;

interface ManifoldProps {
  feature: Feature & { props?: any }; // This will become QuantumFeature later
  state: WindowState;
  isActive: boolean;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onFocus: (id: string) => void;
  onUpdate: (id: string, updates: Partial<WindowState>) => void;
}

const MANIFOLD_THICKNESS = 0.05;
const HEADER_OFFSET = 0.05;

export const Window: React.FC<ManifoldProps> = ({ feature, state, isActive, onClose, onMinimize, onFocus, onUpdate }) => {
  const sizeVec: [number, number, number] = [state.size.width / 100, state.size.height / 100, MANIFOLD_THICKNESS];
  
  const [ref, api] = useBox(() => ({
    mass: 1,
    position: [state.position.x, state.position.y, 0],
    args: sizeVec,
    linearDamping: 0.95,
    angularDamping: 0.95,
  }));
  
  const groupRef = useRef<THREE.Group>(null);
  const headerRef = useRef<THREE.Mesh>(null);
  const featureIcon = typeof feature.icon === 'string' ? <IconComponent name={feature.icon} /> : feature.icon;
  const FeatureComponent = feature.component;

  // Sync physics body position with group position for rendering
  useEffect(() => api.position.subscribe(p => groupRef.current?.position.set(p[0], p[1], p[2])), [api.position]);
  useEffect(() => api.quaternion.subscribe(q => groupRef.current?.quaternion.set(q[0], q[1], q[2], q[3])), [api.quaternion]);

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    onFocus(state.id);
    
    // Apply an impulse to move the object instead of directly setting position
    // This could be made more sophisticated, calculating impulse based on cursor movement
    // For simplicity, we can apply force in a direction
    const worldPoint = e.point;
    const localPoint = ref.current.worldToLocal(worldPoint);
    const impulse = new THREE.Vector3(0,0, -0.2); // Pull it "forward" slightly on click
    api.applyLocalImpulse(impulse.toArray(), localPoint.toArray());
  };
  
  const headerMaterial = useMemo(() => new THREE.MeshStandardMaterial({
      color: isActive ? '#334155' : '#1e293b',
      transparent: true,
      opacity: 0.8,
      roughness: 0.3,
      metalness: 0.2
  }), [isActive]);
  
  const bodyMaterial = useMemo(() => new THREE.MeshStandardMaterial({
      color: '#1e293b', // slate-800
      transparent: true,
      opacity: isActive ? 1.0 : 0.6,
      roughness: 0.5,
      metalness: 0.1,
  }), [isActive]);


  return (
    <group ref={groupRef} onPointerDown={handlePointerDown}>
        {/* The glowing active state indicator */}
        {isActive && <pointLight color="var(--color-primary)" intensity={15} distance={3} />}

        {/* Holographic Header */}
        <Box ref={headerRef} args={[sizeVec[0], 0.3, MANIFOLD_THICKNESS]} position={[0, sizeVec[1]/2 + 0.15, HEADER_OFFSET]} material={headerMaterial}>
           <Edges color={isActive ? "var(--color-primary)" : "#475569"}/>
           <Billboard>
             <Text position={[-sizeVec[0]/2 + 0.2, 0, 0.05]} fontSize={0.08} color={isActive ? "white" : "#94a3b8"} anchorX="left">
               {feature.name}
             </Text>
           </Billboard>
        </Box>
      
        {/* Main Manifold Body */}
        <Box args={sizeVec} material={bodyMaterial}>
            <Html transform prepend center style={{ width: `${state.size.width}px`, height: `${state.size.height}px`, pointerEvents: 'none' }}>
                <div 
                    className={`w-full h-full flex flex-col bg-surface transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-80 grayscale'}`}
                    style={{
                        pointerEvents: 'auto', // Re-enable pointer events for the HTML content
                        clipPath: 'inset(0% round 8px)'
                    }}
                >
                    {/* Header bar content inside HTML for interaction */}
                    <header className={`flex items-center justify-between h-8 px-2 flex-shrink-0 bg-transparent text-text-primary`}>
                        <div className="flex items-center gap-2 text-xs">
                           <div className="w-4 h-4" style={{ filter: isActive ? 'none': 'grayscale(1)'}}>{featureIcon}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => onMinimize(state.id)} className="p-1 rounded hover:bg-white/10"><MinimizeIcon /></button>
                          <button onClick={() => onClose(state.id)} className="p-1 rounded hover:bg-red-500/50"><XMarkIcon className="w-4 h-4"/></button>
                        </div>
                    </header>
                    {/* Feature content */}
                    <main className="flex-1 overflow-auto bg-transparent rounded-b-lg">
                        {FeatureComponent ? (
                          <Suspense fallback={<LoadingIndicator/>}>
                            <FeatureComponent {...state.props} />
                          </Suspense>
                        ) : (
                            <div className="p-4 text-red-400">Error: Component not found</div>
                        )}
                    </main>
                </div>
            </Html>
        </Box>
    </group>
  );
};