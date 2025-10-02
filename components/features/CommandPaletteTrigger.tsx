// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, CameraShake } from '@react-three/drei';
import * as THREE from 'three';
import { getPredictiveCommands } from '../../services/IntentClarionAI'; // Invented service
import { CommandLineIcon } from '../icons';

// --- Lorenz Attractor Logic ---
const LorenzPoints: React.FC = () => {
  const points = useMemo(() => {
    const points = [];
    let x = 0.1, y = 0, z = 0;
    const a = 10, b = 28, c = 8 / 3, dt = 0.005;
    for (let i = 0; i < 2000; i++) {
      const dx = a * (y - x);
      const dy = x * (b - z) - y;
      const dz = x * y - c * z;
      x += dx * dt;
      y += dy * dt;
      z += dz * dt;
      points.push(new THREE.Vector3(x, y, z - 25));
    }
    return points;
  }, []);
  const lineRef = useRef<THREE.Line>();
  useFrame(() => {
    if(lineRef.current) lineRef.current.rotation.z += 0.001;
  });
  
  return <Line points={points} color="var(--color-primary)" lineWidth={0.5} ref={lineRef} />;
};


const PredictiveCommand: React.FC<{ command: string; index: number }> = ({ command, index }) => {
    const textRef = useRef<any>();
    const angle = (index / 3) * Math.PI * 2;
    const radius = 5;

    useFrame(({ clock }) => {
        if (textRef.current) {
            const time = clock.getElapsedTime();
            const x = radius * Math.cos(angle + time * 0.2);
            const z = radius * Math.sin(angle + time * 0.2);
            const y = Math.sin(angle + time * 0.5) * 0.5;
            textRef.current.position.set(x, y, z - 5);
        }
    });
    
    return <Text ref={textRef} fontSize={0.5} color="white" material-fog={false}>{command}</Text>
};

export const CommandPaletteTrigger: React.FC = () => {
    const [predictedCommands, setPredictedCommands] = useState<string[]>([]);
    
    useEffect(() => {
        // This simulates the AI watching the user's actions and providing predictions
        const fetchPredictions = async () => {
            const commands = await getPredictiveCommands(); // Assume this service call works
            setPredictedCommands(commands);
        };

        const interval = setInterval(fetchPredictions, 5000); // Re-evaluate predictions every 5 seconds
        fetchPredictions(); // Initial fetch
        return () => clearInterval(interval);
    }, []);

    // Placeholder for vocal hotword detection - a real implementation is complex
    useEffect(() => {
        console.log("CONCEPT: Vocal Hotword 'Engine,...' listener would be initialized here.");
    }, [])

    return (
        <div className="flex flex-col items-center justify-center h-full text-text-primary bg-background select-none">
             <div className="absolute inset-0 z-0">
                 <Canvas camera={{ position: [0, 0, 15], fov: 75 }}>
                    <Suspense fallback={null}>
                         <ambientLight intensity={0.5} />
                         <pointLight position={[0, 0, 15]} color="var(--color-primary)" intensity={100} />
                         <LorenzPoints />
                         {predictedCommands.map((cmd, i) => <PredictiveCommand key={i} command={cmd} index={i} />)}
                         <CameraShake intensity={0.5} maxYaw={0.01} maxPitch={0.01} maxRoll={0.01} />
                    </Suspense>
                 </Canvas>
            </div>
             <div className="relative z-10 flex flex-col items-center justify-center text-center p-8">
                <div className="text-6xl mb-4 text-primary drop-shadow-[0_0_10px_var(--color-primary)]">
                    <CommandLineIcon />
                </div>
                <h1 className="text-3xl font-bold mb-2">
                    INTENT CLARION
                </h1>
                <p className="text-lg text-text-secondary">Awaiting Directive</p>
            </div>
        </div>
    );
};