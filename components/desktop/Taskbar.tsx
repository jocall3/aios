// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, CameraControls } from '@react-three/drei';
import * as THREE from 'three';
import { ALL_FEATURES } from '../features/index';
import type { Feature, ViewType, CustomFeature } from '../../types';
import { CpuChipIcon } from '../icons';

// --- Shader for the Chronoslip Stream ---
const streamShader = {
    vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
    fragmentShader: `
    uniform float uTime;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    varying vec2 vUv;

    // 2D Perlin Noise function
    float perlin(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f*f*(3.0-2.0*f);
        float a = perlin(i);
        float b = perlin(i + vec2(1.0, 0.0));
        float c = perlin(i + vec2(0.0, 1.0));
        float d = perlin(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }
    
    void main() {
      vec2 uv = vUv;
      float t = uTime * 0.1;
      uv.x += noise(uv * 2.0 + t) * 0.1;
      uv.y += noise(uv * 3.0 - t) * 0.1;
      float n = noise(uv * 5.0 + t * 0.5) * 0.7 + 0.3;
      vec3 color = mix(uColorA, uColorB, n);
      gl_FragColor = vec4(color, 1.0);
    }`
};

const StreamBackground: React.FC<{ temporalDebt: number }> = ({ temporalDebt }) => {
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    const colorA = useMemo(() => new THREE.Color('#0f172a'), []); // Slate 900
    const colorB = useMemo(() => new THREE.Color('#7c3aed'), []); // Violet 600

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
            // Lerp the base color towards entropic violet based on temporal debt
            materialRef.current.uniforms.uColorA.value.lerp(
                new THREE.Color('#ef4444'), // Red 500 for high entropy
                temporalDebt
            );
        }
    });

    return (
        <mesh>
            <planeGeometry args={[20, 1]} />
            <shaderMaterial
                ref={materialRef}
                uniforms={{
                    uTime: { value: 0 },
                    uColorA: { value: colorA },
                    uColorB: { value: colorB },
                }}
                vertexShader={streamShader.vertexShader}
                fragmentShader={streamShader.fragmentShader}
            />
        </mesh>
    );
};

const StasisCrystal: React.FC<{ 
    feature: Feature | CustomFeature; 
    index: number; 
    total: number; 
    onRestore: (id: ViewType) => void;
}> = ({ feature, index, total, onRestore }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const textRef = useRef<any>(null);
    const [isHovered, setHovered] = useState(false);

    useFrame((state) => {
        if (meshRef.current) {
            const time = state.clock.getElapsedTime();
            meshRef.current.rotation.y = time * 0.3 + index;
            meshRef.current.rotation.x = time * 0.2 + index;
            meshRef.current.position.y = Math.sin(time + index * Math.PI) * 0.1;
        }
        if (textRef.current) {
            textRef.current.visible = isHovered;
        }
    });
    
    // Position crystals along the stream
    const xPos = -8 + (16 / (total + 1)) * (index + 1);

    return (
        <group 
            position={[xPos, 0, 0.1]}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            onClick={() => onRestore(feature.id)}
        >
            <mesh ref={meshRef}>
                <icosahedronGeometry args={[0.2, 0]} />
                <meshStandardMaterial 
                    color={isHovered ? '#ffffff' : '#38bdf8'} 
                    roughness={0.1} 
                    metalness={0.9} 
                    emissive={isHovered ? '#38bdf8' : '#000000'}
                    emissiveIntensity={2}
                />
            </mesh>
             <Text
                ref={textRef}
                position={[0, -0.4, 0]}
                fontSize={0.15}
                color="white"
                anchorX="center"
                anchorY="middle"
            >
                {feature.name}
            </Text>
        </group>
    );
};

interface TaskbarProps {
  minimizedWindows: (Feature | CustomFeature)[];
  onRestore: (id: ViewType) => void;
}

export const Taskbar: React.FC<TaskbarProps> = ({ minimizedWindows, onRestore }) => {
    const temporalDebt = useMemo(() => {
        // Simple metric for now: debt increases with the number of minimized complex features
        const debt = Math.min(1, minimizedWindows.length / 10);
        return debt;
    }, [minimizedWindows]);

  return (
    <footer className="absolute bottom-0 left-0 right-0 h-16 bg-transparent z-50">
      <Canvas camera={{ position: [0, 0, 2], fov: 75 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[0, 5, 5]} intensity={3}/>
        <StreamBackground temporalDebt={temporalDebt}/>
        {minimizedWindows.map((feature, index) => (
             <StasisCrystal
                key={feature.id}
                feature={feature}
                index={index}
                total={minimizedWindows.length}
                onRestore={onRestore}
             />
        ))}
        {minimizedWindows.length === 0 && (
            <Text
                position={[0, 0, 0]}
                fontSize={0.1}
                color="#94a3b8" // Slate 400
            >
                CHRONOSLIP STREAM IDLE
            </Text>
        )}
      </Canvas>
    </footer>
  );
};