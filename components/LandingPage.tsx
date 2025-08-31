import React, { useState, useRef, useMemo, Suspense, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three-fiber';
import { Text, Stars, Box, Line } from '@react-three-drei';
import * as THREE from 'three';

// --- SELF-CONTAINED SUB-COMPONENTS ---

const Tesseract: React.FC<{ onIgnite: () => void; isIgniting: boolean }> = ({ onIgnite, isIgniting }) => {
    const group = useRef<THREE.Group>(null);
    const [isHovered, setHovered] = useState(false);
    useFrame((state, delta) => {
        if (group.current) {
            const speed = isHovered ? 1.5 : 0.15;
            const ignitionSpeed = isIgniting ? 100 : 1;
            group.current.rotation.x += delta * speed * ignitionSpeed * 0.5;
            group.current.rotation.y += delta * speed * ignitionSpeed;
        }
    });
    return (
        <group ref={group} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)} onClick={!isIgniting ? onIgnite : undefined} scale={isHovered && !isIgniting ? 1.2 : 1} rotation={[Math.PI / 6, Math.PI / 4, 0]}>
            <Box args={[1, 1, 1]}><meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={isHovered ? 2.5 : 0.7} toneMapped={false}/></Box>
            <Box args={[1, 1, 1]} scale={0.5}><meshStandardMaterial color="white" emissive="white" emissiveIntensity={isHovered ? 5 : 2} toneMapped={false} /></Box>
        </group>
    );
};

const PillarMonolith: React.FC<{ position: [number, number, number]; title: string; description: string; isIgniting: boolean; onHover: (desc: string | null) => void; }> = ({ position, title, description, isIgniting, onHover }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const lineRef = useRef<any>(null);
    const [localHover, setLocalHover] = useState(false);

    useFrame((state) => {
        if (meshRef.current && lineRef.current) {
            meshRef.current.material.emissiveIntensity = THREE.MathUtils.lerp(meshRef.current.material.emissiveIntensity, localHover ? 1.5 : 0.1, 0.1);
            if (isIgniting) {
                // Fire the beam at the tesseract
                lineRef.current.visible = true;
                const endPoint = new THREE.Vector3(0,0,0);
                lineRef.current.geometry.setPositions([position[0], position[1], position[2], endPoint.x, endPoint.y, endPoint.z]);
            }
        }
    });

    return (
        <group position={position}>
            <mesh ref={meshRef} onPointerOver={() => { setLocalHover(true); onHover(title + "\n\n" + description); }} onPointerOut={() => { setLocalHover(false); onHover(null); }}>
                <boxGeometry args={[0.2, 3, 0.2]} />
                <meshStandardMaterial color="#ffffff" emissive="#38bdf8" emissiveIntensity={0.1} transparent opacity={0.8} roughness={0.2} metalness={0.8} />
            </mesh>
            <Line ref={lineRef} points={[[0,0,0], [0,0,0]]} color="white" lineWidth={3} visible={false} />
        </group>
    );
};

const PILLARS = [
    { title: "Pillar I: The GEOS", description: "Orchestrate the planet's financial and logistical backbone." },
    { title: "Pillar II: Computational Compassion", description: "Apply planetary-scale optimization to humanity's most intractable problems." },
    { title: "Pillar III: Meta-Creation", description: "Accelerate the very pace of discovery, creation, and cultural evolution." },
    { title: "Pillar IV: Governance", description: "Wield absolute power with a new form of ruthlessly efficient, AI-driven control." }
];

export const LandingPage: React.FC<{ onLaunch: () => void }> = ({ onLaunch }) => {
    const [isIgniting, setIsIgniting] = useState(false);
    const [activeDescription, setActiveDescription] = useState<string | null>(null);
    
    const handleIgnite = () => {
        if (isIgniting) return;
        setIsIgniting(true);
        setTimeout(onLaunch, 2000); // Wait for the ignition and fade animation
    };

    return (
        <div className={`fixed inset-0 z-40 bg-black transition-opacity duration-1000 ${isIgniting ? 'opacity-0' : 'opacity-100'}`}>
            <Canvas camera={{ position: [0, 0, 10], fov: 75 }}>
                 <Suspense fallback={null}>
                    <ambientLight intensity={0.2} />
                    <pointLight position={[0,0,0]} color="#38bdf8" intensity={isIgniting ? 2000 : 20} distance={150} decay={2}/>
                    <Stars radius={150} depth={50} count={10000} factor={6} saturation={0} fade speed={1} />
                    
                    <Tesseract onIgnite={handleIgnite} isIgniting={isIgniting} />
                    
                    {PILLARS.map((pillar, i) => (
                        <PillarMonolith
                            key={pillar.title}
                            position={[(i - 1.5) * 4, 0, -4]}
                            title={pillar.title}
                            description={pillar.description}
                            isIgniting={isIgniting}
                            onHover={setActiveDescription}
                        />
                    ))}

                    <Text position={[0, 3.5, 0]} color="white" fontSize={0.6} textAlign="center" font="/fonts/Oswald-Bold.ttf">
                      THE INTEGRATED REALITY ENGINE
                    </Text>

                    <Text position={[0, -3.5, 0]} color="#94a3b8" fontSize={0.2} maxWidth={10} textAlign="center" visible={!activeDescription}>
                        This is not an application. It is an operating system for intent.
                    </Text>
                    
                     <Text position={[0, -3, 0]} color="white" fontSize={0.35} maxWidth={10} textAlign="center" visible={!!activeDescription} anchorY="middle">
                         {activeDescription}
                    </Text>

                    {isIgniting && (
                        <mesh scale={200}>
                            <planeGeometry />
                            <meshBasicMaterial color="white" transparent opacity={1} />
                        </mesh>
                    )}

                </Suspense>
            </Canvas>
        </div>
    );
};