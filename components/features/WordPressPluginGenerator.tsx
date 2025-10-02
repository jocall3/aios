// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three-fiber';
import { Stars, Line } from '@react-three/drei';
import * as THREE from 'three';
import { generateDecentralizedAppNode } from '../../services/DecentralizedGenesisAI'; // Invented
import type { GeneratedFile } from '../../types';
import { WordPressIcon, ServerStackIcon } from '../icons';
import { LoadingSpinner, MarkdownRenderer } from '../shared/LoadingSpinner';
import { useNotification } from '../../contexts/NotificationContext';

const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

// --- 3D Visualization of the dApp Mesh Network ---
const MeshNetwork: React.FC<{ nodeCount: number }> = ({ nodeCount }) => {
    const nodes = useMemo(() => {
        const temp = [];
        for (let i = 0; i < nodeCount; i++) {
            temp.push({
                position: new THREE.Vector3().setFromSphericalCoords(5, Math.acos(1-2*Math.random()), Math.random() * 2 * Math.PI)
            });
        }
        return temp;
    }, [nodeCount]);

    return (
        <group>
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            {nodes.map((node, i) => (
                <mesh key={i} position={node.position}>
                    <sphereGeometry args={[0.1, 16, 16]} />
                    <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2} />
                </mesh>
            ))}
            {/* Draw lines between some nodes to represent connections */}
            {nodes.length > 1 && <Line points={[nodes[0].position, nodes[nodes.length-1].position]} color="white" lineWidth={0.5} dashed dashScale={10}/>}
        </group>
    );
};

export const WordPressPluginGenerator: React.FC = () => {
    const [mandate, setMandate] = useState('Establish a decentralized, censorship-resistant communication node within the host database.');
    const [files, setFiles] = useState<GeneratedFile[]>([]);
    const [activeFile, setActiveFile] = useState<GeneratedFile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [nodeCount, setNodeCount] = useState(1);
    const { addNotification } = useNotification();

    const handleGenesis = useCallback(async () => {
        setIsLoading(true);
        setFiles([]);
        setActiveFile(null);
        setNodeCount(1);
        try {
            const result = await generateDecentralizedAppNode(mandate);
            setFiles(result);
            setActiveFile(result.find(f => f.filePath.endsWith('.php')) || result[0] || null);
            addNotification('dApp Node genesis complete.', 'success');
            // Simulate other nodes appearing in the network over time
            const interval = setInterval(() => setNodeCount(c => c < 50 ? c + Math.ceil(Math.random() * 3) : 50), 2000);
            setTimeout(()=> clearInterval(interval), 30000);
        } catch (err) {
            addNotification(err instanceof Error ? err.message : 'Genesis failed', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [mandate, addNotification]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><WordPressIcon /><span className="ml-3">dApp Genesis Engine for Legacy Web</span></h1>
                <p className="text-text-secondary mt-1">Forge sovereign applications and inject them into compromised hosts.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col gap-3">
                    <h3 className="text-xl font-bold">Decentralized Mandate</h3>
                    <textarea value={mandate} onChange={e => setMandate(e.target.value)} className="h-24 p-2 bg-surface border rounded text-sm"/>
                    <button onClick={handleGenesis} disabled={isLoading} className="btn-primary w-full py-2">
                        {isLoading ? <LoadingSpinner/> : 'Initiate Genesis'}
                    </button>
                    <div className="flex-grow flex flex-col min-h-0 mt-2">
                         <label className="text-sm font-medium">Generated dApp Files</label>
                         <div className="flex-grow bg-background border rounded-lg p-2 grid grid-cols-[1fr,2fr] gap-2 mt-1">
                           <div className="overflow-y-auto">
                             {files.map(file => (
                                <div key={file.filePath} onClick={() => setActiveFile(file)} className={`p-1 text-xs rounded cursor-pointer truncate ${activeFile?.filePath === file.filePath ? 'bg-primary/10 text-primary' : ''}`}>
                                  {file.filePath.split('/').pop()}
                                </div>
                             ))}
                           </div>
                           <div className="bg-surface rounded overflow-y-auto">
                             {activeFile && <MarkdownRenderer content={'```php\n' + activeFile.content + '\n```'} />}
                           </div>
                         </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 min-h-0">
                    <h3 className="text-xl font-bold">dApp Mesh Network Topology</h3>
                    <div className="flex-grow bg-black rounded-lg border border-primary relative">
                         <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
                            <Suspense fallback={null}>
                                 <MeshNetwork nodeCount={nodeCount}/>
                            </Suspense>
                        </Canvas>
                        <div className="absolute bottom-2 left-2 text-xs font-mono bg-black/50 p-2 rounded">
                            <p>NODES DETECTED: {nodeCount}</p>
                            <p>NETWORK STATUS: <span className="text-green-400">COHERENT</span></p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <input className="flex-grow p-2 bg-surface border rounded text-xs" placeholder="Target Host API Endpoint..."/>
                        <button className="btn-primary px-4 py-2 text-sm" disabled={files.length === 0}>Deploy to Target</button>
                    </div>
                </div>
            </div>
        </div>
    );
};