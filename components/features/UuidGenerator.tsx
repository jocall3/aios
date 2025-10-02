// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { forgeUIDs } from '../../services/MetaphysicalUID'; // Invented, advanced service
import type { UIDForgingResult } from '../../types/MetaphysicalUID'; // Invented
import { useNotification } from '../../contexts/NotificationContext';
import { TerminalIcon } from '../icons';

const a = new THREE_Vector3(), b = new THREE_Vector3(), c = new THREE_Vector3();

// --- 3D Visualization of the UID Forging Process ---
const ForgingVortex: React.FC<{ isForging: boolean; onComplete: () => void }> = ({ isForging, onComplete }) => {
    const pointsRef = useRef<THREE.Points>(null);
    const time = useRef(0);

    const particles = useMemo(() => {
        const p = new Float32Array(500 * 3);
        for (let i = 0; i < p.length; i++) {
            p[i] = (Math.random() - 0.5) * 10;
        }
        return p;
    }, []);

    useFrame((_, delta) => {
        if (!pointsRef.current) return;
        time.current += delta;
        
        let scale = 1.0;
        if (isForging) {
             scale = Math.max(0, 1.0 - time.current);
             if (scale <= 0) {
                 time.current = 0;
                 onComplete();
             }
        } else {
            time.current = 0;
            scale = 1.0;
        }

        pointsRef.current.scale.set(scale, scale, scale);
        pointsRef.current.rotation.y += delta * 0.5;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={particles.length / 3} array={particles} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={0.05} color="var(--color-primary)" transparent opacity={0.7} blending={THREE.AdditiveBlending} />
        </points>
    );
};

const UIDDisplay: React.FC<{ label: string; value: string; onCopy: (val: string) => void }> = ({ label, value, onCopy }) => (
    <div className="flex justify-between items-center bg-background p-2 rounded border border-border">
        <span className="text-sm font-semibold">{label}:</span>
        <div className="flex items-center gap-2">
            <span className="font-mono text-primary text-xs truncate">{value}</span>
            <button onClick={() => onCopy(value)} className="text-xs px-2 py-0.5 bg-surface rounded hover:bg-gray-100">Copy</button>
        </div>
    </div>
);


export const UuidGenerator: React.FC = () => {
    const [seed, setSeed] = useState('Primary User Authentication Service');
    const [forgedIds, setForgedIds] = useState<UIDForgingResult | null>(null);
    const [isForging, setIsForging] = useState(false);
    const { addNotification } = useNotification();
    
    const handleForge = useCallback(() => {
        setIsForging(true);
        // The visualization `onComplete` will trigger the actual data forging
    }, []);

    const executeForge = useCallback(async () => {
        try {
            const result = await forgeUIDs(seed);
            setForgedIds(result);
            addNotification(`UIDs for "${result.noeticHandle}" forged.`, 'success');
        } catch(e) {
            console.error(e);
        } finally {
            setIsForging(false);
        }
    }, [seed, addNotification]);
    
    const handleCopy = (value: string) => {
        navigator.clipboard.writeText(value);
        addNotification('UID copied to clipboard!', 'info');
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center">
                    <TerminalIcon />
                    <span className="ml-3">Entity Entanglement & UID Metaphysics Engine</span>
                </h1>
                <p className="text-text-secondary mt-1">Forge contextually significant, metaphysically sound identifiers from pure concept.</p>
            </header>
            
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col gap-3">
                    <h3 className="text-xl font-bold">Conceptual Seed</h3>
                    <input value={seed} onChange={e => setSeed(e.target.value)}
                           className="w-full p-2 bg-surface border rounded" 
                           placeholder="Describe the entity to be named..."
                    />
                    <button onClick={handleForge} disabled={isForging} className="btn-primary w-full py-2">
                        {isForging ? 'Forging...' : 'Forge Identifier Set'}
                    </button>
                    <div className="flex-grow bg-black rounded-lg relative overflow-hidden">
                        <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
                           <Suspense fallback={null}>
                                <ForgingVortex isForging={isForging} onComplete={executeForge}/>
                               {!isForging && !forgedIds && <Text position={[0,0,0]} fontSize={0.3} color="#4b5563">Awaiting Conceptual Seed</Text>}
                               {!isForging && forgedIds && <Text position={[0,0,0]} fontSize={0.5} color="var(--color-primary)">{forgedIds.noeticHandle}</Text>}
                           </Suspense>
                        </Canvas>
                    </div>
                </div>

                <div className="flex flex-col gap-3 min-h-0">
                    <h3 className="text-xl font-bold">Forged Identifier Manifest</h3>
                     <div className="flex-grow bg-surface border rounded p-3 space-y-2 overflow-y-auto">
                        {forgedIds && (
                           <>
                             <UIDDisplay label="Noetic Handle (True Name)" value={forgedIds.noeticHandle} onCopy={handleCopy}/>
                             <UIDDisplay label="ULID (Chronological)" value={forgedIds.ulid} onCopy={handleCopy}/>
                             <UIDDisplay label="UUIDv4 (Chaotic)" value={forgedIds.uuid} onCopy={handleCopy}/>
                             <UIDDisplay label="HashID (Obfuscated)" value={forgedIds.hashid} onCopy={handleCopy}/>
                           </>
                        )}
                        {!forgedIds && !isForging && (
                             <p className="text-sm text-text-secondary text-center p-8">The UID manifest will be revealed here upon completion of the forging.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};