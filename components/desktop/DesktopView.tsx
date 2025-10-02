// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback, useEffect, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics, usePlane, useBox } from '@react-three/cannon';
import { CameraControls } from '@react-three/drei';
import { Window } from './Window'; // Assuming this will also be reforged for 3D
import { FeatureDock } from './FeatureDock';
import { Taskbar } from './Taskbar';
import { ALL_FEATURES } from '../features/index';
import type { Feature, CustomFeature, ManifoldViewState as WindowState, ViewType } from '../../types';

// The physics boundary for the manifold canvas
const ManifoldBoundary: React.FC = () => {
    usePlane(() => ({ position: [0, 0, -10], rotation: [0, 0, 0] })); // Back wall
    usePlane(() => ({ position: [0, 0, 10], rotation: [0, -Math.PI, 0] })); // Front wall
    usePlane(() => ({ position: [-10, 0, 0], rotation: [0, Math.PI / 2, 0] })); // Left wall
    usePlane(() => ({ position: [10, 0, 0], rotation: [0, -Math.PI / 2, 0] })); // Right wall
    usePlane(() => ({ position: [0, -10, 0], rotation: [-Math.PI / 2, 0, 0] })); // Floor
    usePlane(() => ({ position: [0, 10, 0], rotation: [Math.PI / 2, 0, 0] })); // Ceiling
    return null;
};

// Represents a Feature Manifold within the 3D physics simulation
const ManifoldBody: React.FC<{
  manifoldState: WindowState;
  feature: Feature | CustomFeature;
  isActive: boolean;
  onFocus: (id: string) => void;
  onUpdate: (id: string, updates: Partial<WindowState>) => void;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
}> = ({ manifoldState, ...props }) => {
    const [ref, api] = useBox(() => ({
        mass: 10, // More complex features could have higher mass
        position: [manifoldState.position.x, manifoldState.position.y, 0],
        args: [manifoldState.size.width / 100, manifoldState.size.height / 100, 0.2], // Represent size as physical box
    }));

    // Sync React state with physics state
    useEffect(() => {
        const unsubscribe = api.position.subscribe(p => {
            props.onUpdate(manifoldState.id, { position: { x: p[0], y: p[1] }});
        });
        return unsubscribe;
    }, [api, props, manifoldState.id]);
    
    return (
        // The actual rendered component is placed here, perhaps on an HTML plane inside the 3D space.
        // For simplicity, we pass the ref to the outer Window component which will be adapted for 3D.
        <group ref={ref as any}>
            <Window 
                state={manifoldState}
                {...props} 
            />
        </group>
    );
};


export const DesktopView: React.FC<{ openFeatureId?: string; customFeatures: CustomFeature[] }> = ({ openFeatureId, customFeatures }) => {
    const [windows, setWindows] = useState<Record<string, WindowState>>({});
    const [activeId, setActiveId] = useState<string | null>(null);
    const [nextZIndex, setNextZIndex] = useState(10);
    
    const openWindow = useCallback((featureId: string, props: any = {}) => {
        const newZIndex = nextZIndex + 1;
        setNextZIndex(newZIndex);
        setActiveId(featureId);

        setWindows(prev => {
            const id = `${featureId}-${Date.now()}`; // Allow multiple instances
            const newWindow: WindowState = {
                id,
                props,
                position: { x: (Math.random() - 0.5) * 5, y: (Math.random() - 0.5) * 5 }, // Random initial position in 3D space
                size: { width: 800, height: 600 },
                zIndex: newZIndex,
                isMinimized: false,
            };
            return { ...prev, [id]: newWindow };
        });
    }, [nextZIndex]);
    
    useEffect(() => {
        if(openFeatureId) {
            openWindow(openFeatureId);
        }
    }, [openFeatureId, openWindow]);

    const closeWindow = (id: string) => setWindows(prev => { const n = {...prev}; delete n[id]; return n; });
    const minimizeWindow = (id: string) => { setWindows(prev => ({ ...prev, [id]: { ...prev[id], isMinimized: true } })); setActiveId(null); };
    const focusWindow = (id: string) => {
        if (id === activeId) return;
        const newZIndex = nextZIndex + 1;
        setNextZIndex(newZIndex);
        setActiveId(id);
        setWindows(prev => ({ ...prev, [id]: { ...prev[id], zIndex: newZIndex } }));
    };
    const updateWindowState = (id: string, updates: Partial<WindowState>) => setWindows(prev => ({ ...prev, [id]: { ...prev[id], ...updates } }));

    const openWindows = Object.values(windows).filter(w => !w.isMinimized);
    const minimizedWindows = Object.values(windows).filter(w => w.isMinimized);
    const featuresMap = useMemo(() => new Map(ALL_FEATURES.map(f => [f.id, f])), []);

    return (
        <div className="h-full flex flex-col bg-transparent">
            {/* The Noosphere is now part of the canvas, not a separate div */}
            {/* The Taskbar is an overlay */}
            
            <Canvas camera={{ position: [0, 0, 12], fov: 60 }}>
                <Suspense fallback={null}>
                    <ambientLight intensity={1.5} />
                    <pointLight position={[0, 5, 10]} intensity={3} />
                    <CameraControls makeDefault />

                    <FeatureDock onOpen={openWindow} customFeatures={customFeatures} />
                    
                    <Physics gravity={[0, 0, 0]} defaultContactMaterial={{ friction: 0.1, restitution: 0.8 }}>
                        <ManifoldBoundary />
                        {openWindows.map(win => {
                            const featureId = win.id.split('-')[0];
                            const feature = featuresMap.get(featureId);
                            if (!feature) return null;

                            return (
                                <ManifoldBody
                                    key={win.id}
                                    manifoldState={win}
                                    feature={feature}
                                    isActive={win.id === activeId}
                                    onClose={closeWindow}
                                    onMinimize={minimizeWindow}
                                    onFocus={focusWindow}
                                    onUpdate={updateWindowState}
                                />
                            );
                        })}
                    </Physics>

                </Suspense>
            </Canvas>
            
            <Taskbar
                minimizedWindows={minimizedWindows.map(w => {
                    const featureId = w.id.split('-')[0];
                    return featuresMap.get(featureId)
                }).filter(Boolean) as (Feature | CustomFeature)[]}
                onRestore={openWindow} // Restore would need logic to find the specific minimized window instance
            />
        </div>
    );
};