import React, { useState, useCallback, Suspense, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { generateLatentTrajectory, renderLatentVector } from '../../services/GenerativeLatentSpaceAI'; // Invented, advanced service
import type { NoeticVector } from '../../types'; // Our powerful vector type
import { VideoCameraIcon, SparklesIcon } from '../icons';
import { LoadingSpinner } from '../shared/LoadingSpinner';

const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

// --- SHADERS FOR VISUAL EFFECT ---
const screenShader = {
    uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0 },
        uVignette: { value: 0.3 },
        uAberration: { value: 0.002 }
    },
    vertexShader: `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
    fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uVignette;
    uniform float uAberration;
    varying vec2 vUv;
    void main() {
        vec2 uv = vUv;
        vec2 R = uv - 0.5; R *= 1.0 - uAberration * dot(R,R);
        vec2 G = uv - 0.5;
        vec2 B = uv - 0.5; B *= 1.0 + uAberration * dot(B,B);
        
        vec4 color;
        color.r = texture2D( tDiffuse, R + 0.5 ).r;
        color.g = texture2D( tDiffuse, G + 0.5 ).g;
        color.b = texture2D( tDiffuse, B + 0.5 ).b;
        color.a = 1.0;
        
        float vignette = 1.0 - uVignette * length(uv - 0.5);
        gl_FragColor = color * vignette;
    }`
};

// Component that renders the AI-generated texture to a plane
const LatentRenderer: React.FC<{ latentVector: NoeticVector }> = ({ latentVector }) => {
    const [texture, setTexture] = useState<THREE.Texture | null>(null);

    useEffect(() => {
        let alive = true;
        const render = async () => {
            const imageBlob = await renderLatentVector(latentVector);
            const url = URL.createObjectURL(imageBlob);
            const tex = await new THREE.TextureLoader().loadAsync(url);
            URL.revokeObjectURL(url);
            if(alive) setTexture(tex);
        };
        render();
        return () => { alive = false; texture?.dispose(); }
    }, [latentVector, texture]);

    return (
        <mesh>
            <planeGeometry args={[16/9, 1]} />
            <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
    );
};

export const AiVideoGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('A cinematic shot of a robot skateboarding through a neon-lit city at night.');
    const [trajectory, setTrajectory] = useState<NoeticVector[]>([]);
    const [scrubber, setScrubber] = useState(0); // 0.0 to 1.0
    const [isLoading, setIsLoading] = useState(false);
    
    const interpolatedVector = useMemo((): NoeticVector => {
        if (trajectory.length < 2) return new Float64Array(1024);
        
        const totalDuration = trajectory.length - 1;
        const currentSegment = Math.floor(scrubber * totalDuration);
        const nextSegment = Math.min(trajectory.length - 1, currentSegment + 1);
        const progressInSegment = (scrubber * totalDuration) - currentSegment;

        a.fromArray(trajectory[currentSegment] as any);
        b.fromArray(trajectory[nextSegment] as any);
        c.lerpVectors(a, b, progressInSegment);
        
        return new Float64Array(c.toArray());
    }, [scrubber, trajectory]);

    const handleGenerate = async () => {
        setIsLoading(true);
        setTrajectory([]);
        try {
            const vectors = await generateLatentTrajectory(prompt, 4);
            setTrajectory(vectors);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><VideoCameraIcon /><span className="ml-3">Latent Space Director</span></h1>
                <p className="text-text-secondary mt-1">Navigate the model's imagination. You are not generating a video; you are directing a dream.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
                <div className="md:col-span-1 flex flex-col gap-4">
                    <div className="flex-grow p-4 bg-surface border rounded-lg flex flex-col gap-4">
                        <div>
                            <label className="text-sm font-medium">Core Concept (Prompt)</label>
                            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full mt-1 p-2 bg-background border rounded h-24 text-sm"/>
                        </div>
                        <button onClick={handleGenerate} disabled={isLoading} className="btn-primary w-full py-2">{isLoading ? <LoadingSpinner/> : 'Generate Latent Trajectory'}</button>
                    </div>
                    <div className="flex-shrink-0 p-4 bg-surface border rounded-lg">
                        <label className="text-sm font-medium">Live Interpolation Control</label>
                        <input type="range" min="0" max="1" step="0.001" value={scrubber} onChange={e => setScrubber(parseFloat(e.target.value))}
                               className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"
                               disabled={trajectory.length === 0}
                        />
                         <div className="text-center font-mono text-xs mt-2">{`Interpolation: ${scrubber.toFixed(3)}`}</div>
                    </div>
                </div>

                <div className="md:col-span-2 flex flex-col min-h-[400px]">
                    <label className="text-sm font-medium mb-2">Generative Canvas</label>
                    <div className="w-full flex-grow bg-black border rounded-lg overflow-hidden">
                        {isLoading && <div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}
                        {!isLoading && trajectory.length > 0 && (
                            <Canvas camera={{ position: [0, 0, 1.2], fov: 50 }}>
                                <Suspense fallback={null}>
                                    <LatentRenderer latentVector={interpolatedVector} />
                                </Suspense>
                            </Canvas>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};