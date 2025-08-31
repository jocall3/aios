import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, CameraControls, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { ALL_FEATURES } from '../features/index';
import type { Feature, ViewType, CustomFeature } from '../../types';
import { useGlobalState } from '../../contexts/GlobalStateContext';

type NoosphereNode = {
    id: ViewType;
    name: string;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    mass: number;
    color: string;
    feature: Feature | CustomFeature;
};

// --- Physics Constants ---
const REPULSION_STRENGTH = 0.05;
const ATTRACTION_STRENGTH = 0.0005;
const DAMPING = 0.95;
const CENTER_FORCE = 0.0001;

const categoryColors: Record<string, string> = {
    'Global Economic Operating System': '#ff6347', // Tomato
    'Computational Compassion at Scale': '#4682b4', // SteelBlue
    'The Meta-Creation Platform': '#32cd32', // LimeGreen
    'The Governance Layer': '#dda0dd', // Plum
    'Custom': '#ffd700', // Gold
    'default': '#ffffff'
};

const NodeParticle: React.FC<{ node: NoosphereNode; onClick: (id: ViewType) => void }> = ({ node, onClick }) => {
    const textRef = useRef<any>();
    const [isHovered, setIsHovered] = useState(false);

    useFrame(({ camera }) => {
        if (textRef.current) {
            textRef.current.quaternion.copy(camera.quaternion);
            const dist = textRef.current.position.distanceTo(camera.position);
            // Dynamically scale text to be readable but not overwhelming
            const scale = Math.max(0.1, Math.min(0.5, dist / 20));
            textRef.current.scale.set(scale, scale, scale);
        }
    });

    return (
        <group 
            position={node.position} 
            onPointerOver={() => setIsHovered(true)} 
            onPointerOut={() => setIsHovered(false)}
            onClick={() => onClick(node.id)}
        >
            <Points positions={new Float32Array([0, 0, 0])}>
                 <PointMaterial
                    transparent
                    color={node.color}
                    size={isHovered ? 25 : 15}
                    sizeAttenuation
                    depthWrite={false}
                 />
            </Points>
            {(isHovered) && (
                <Text
                    ref={textRef}
                    position={[0, -0.2, 0]}
                    fontSize={1}
                    color="white"
                    anchorX="center"
                    anchorY="top"
                >
                    {node.name}
                </Text>
            )}
        </group>
    );
};


const ForceGraph: React.FC<{ nodes: NoosphereNode[]; onClick: (id: ViewType) => void }> = ({ nodes, onClick }) => {
    const nodeRefs = useRef(nodes);

    useFrame(() => {
        const currentNodes = nodeRefs.current;
        
        // --- Calculate Forces ---
        for (let i = 0; i < currentNodes.length; i++) {
            for (let j = i + 1; j < currentNodes.length; j++) {
                const nodeA = currentNodes[i];
                const nodeB = currentNodes[j];
                const distanceVec = new THREE.Vector3().subVectors(nodeB.position, nodeA.position);
                const distance = distanceVec.length() + 0.001; // Avoid division by zero
                distanceVec.normalize();
                
                // Repulsion force (Coulomb's Law)
                const repulsionForce = distanceVec.multiplyScalar(-REPULSION_STRENGTH / (distance * distance));
                nodeA.velocity.add(repulsionForce.clone().divideScalar(nodeA.mass));
                nodeB.velocity.add(repulsionForce.clone().negate().divideScalar(nodeB.mass));

                // Attraction force for same category (Hooke's Law)
                if (nodeA.feature.category === nodeB.feature.category) {
                     const attractionForce = distanceVec.multiplyScalar(distance * ATTRACTION_STRENGTH);
                     nodeA.velocity.add(attractionForce.clone().divideScalar(nodeA.mass));
                     nodeB.velocity.add(attractionForce.clone().negate().divideScalar(nodeB.mass));
                }
            }
        }
        
        // --- Update Positions ---
        currentNodes.forEach(node => {
            // Center gravity
            node.velocity.add(node.position.clone().multiplyScalar(-CENTER_FORCE));
            
            // Damping to prevent infinite oscillation
            node.velocity.multiplyScalar(DAMPING);
            
            // Apply velocity to position
            node.position.add(node.velocity);
        });
    });

    return (
        <>
            {nodes.map(node => (
                <NodeParticle key={node.id} node={node} onClick={onClick} />
            ))}
        </>
    );
};

interface FeatureDockProps {
    onOpen: (id: ViewType, props?: any) => void;
    customFeatures: CustomFeature[];
}

export const FeatureDock: React.FC<FeatureDockProps> = ({ onOpen, customFeatures }) => {
    const { state } = useGlobalState();
    
    const allFeatures = useMemo(() => {
      return [...ALL_FEATURES, ...customFeatures];
    }, [customFeatures]);
    
    const noosphereNodes = useMemo(() => {
        return allFeatures.map((feature, i): NoosphereNode => {
            return {
                id: feature.id,
                name: feature.name,
                position: new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10),
                velocity: new THREE.Vector3(),
                mass: 1.0,
                color: categoryColors[(feature.category as string)] || categoryColors.default,
                feature: feature,
            };
        });
    }, [allFeatures]);

    return (
        <div className="absolute inset-0 bg-transparent cursor-grab active:cursor-grabbing">
            <Canvas camera={{ position: [0, 0, 15], fov: 75 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <ForceGraph nodes={noosphereNodes} onClick={onOpen} />
                <CameraControls makeDefault />
                <Stars />
            </Canvas>
        </div>
    );
};