import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { generateResiliencyClientFromSchema, analyzeApiHealth, forgeMockRoutes } from '../../services/APISovereigntyAI'; // Invented AI Service
import type { GeneratedFile, APIHealthReport } from '../../types/APISovereignty'; // Invented Types
import { CodeBracketSquareIcon, ServerStackIcon, ChartBarIcon, ShieldExclamationIcon } from '../icons';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { MarkdownRenderer } from '../shared/MarkdownRenderer';
import { useNotification } from '../../contexts/NotificationContext';
import { setMockRoutes } from '../../services/mocking/mockServer';

const exampleSchema = `{
  "openapi": "3.0.0", "info": { "title": "User Service API", "version": "1.0.0" },
  "servers": [{ "url": "https://jsonplaceholder.typicode.com" }],
  "paths": {
    "/users/{userId}": {
      "get": { "summary": "Get user by ID", "parameters": [{"name":"userId","in":"path","required":true,"schema":{"type":"integer"}}],
        "responses": { "200": { "description": "A single user." }, "500": { "description": "Server Error." }}
      }
    }
  }
}`;

// --- 3D Visualization Components for Sovereignty Matrix ---

type Particle = { id: number; position: THREE.Vector3; velocity: THREE.Vector3; color: THREE.Color; isReturning: boolean };

const HealthVisualization: React.FC<{ health: APIHealthReport | null }> = ({ health }) => {
    const particlesRef = useRef<THREE.InstancedMesh>(null);
    const [particles, setParticles] = useState<Particle[]>([]);
    const apiTarget = new THREE.Vector3(2, 0, 0);

    // Spawn new particles periodically
    useEffect(() => {
        const interval = setInterval(() => {
            if (health?.isCircuitOpen) return;
            const isSuccess = Math.random() > (health?.failureRate || 0) / 100;
            const newParticle: Particle = {
                id: Math.random(),
                position: new THREE.Vector3(-2, 0, (Math.random() - 0.5) * 2),
                velocity: new THREE.Vector3(Math.random() * 0.05 + 0.05, 0, 0),
                color: new THREE.Color(isSuccess ? '#4ade80' : '#f87171'),
                isReturning: false,
            };
            setParticles(prev => [...prev.slice(-99), newParticle]); // Keep max 100 particles
        }, 300);
        return () => clearInterval(interval);
    }, [health]);

    useFrame(() => {
        const tempObject = new THREE.Object3D();
        setParticles(prev => {
            const newParticles = prev.map(p => {
                p.position.add(p.velocity);
                if (!p.isReturning && p.position.x > apiTarget.x) {
                    p.isReturning = true;
                    p.velocity.negate();
                }
                return p;
            }).filter(p => p.position.x > -2.1); // Remove particles that have returned
            
            newParticles.forEach((p, i) => {
                tempObject.position.copy(p.position);
                tempObject.updateMatrix();
                particlesRef.current?.setMatrixAt(i, tempObject.matrix);
                particlesRef.current?.setColorAt(i, p.color);
            });
            if(particlesRef.current) {
                particlesRef.current.count = newParticles.length;
                particlesRef.current.instanceMatrix.needsUpdate = true;
                particlesRef.current.instanceColor!.needsUpdate = true;
            }
            return newParticles;
        });
    });

    return (
        <group>
            <Text position={[-2, 0, 0]} fontSize={0.2} anchorX="right">ENGINE</Text>
            <Text position={[2, 0, 0]} fontSize={0.2} anchorX="left">TARGET API</Text>
            <Box args={[0.2, 0.8, 0.2]} position={apiTarget}>
                <meshStandardMaterial color={health?.isCircuitOpen ? '#4b5563' : '#3b82f6'} emissive={health?.isCircuitOpen ? '#000' : '#3b82f6'} emissiveIntensity={1} />
            </Box>
            <instancedMesh ref={particlesRef} args={[undefined, undefined, 100]}>
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshBasicMaterial toneMapped={false} vertexColors />
            </instancedMesh>
        </group>
    );
};


// --- Main Component ---
export const ApiClientGenerator: React.FC = () => {
    const [schema, setSchema] = useState(exampleSchema);
    const [files, setFiles] = useState<GeneratedFile[]>([]);
    const [health, setHealth] = useState<APIHealthReport | null>(null);
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
    const [showResiliencyCode, setShowResiliencyCode] = useState(true);
    const { addNotification } = useNotification();
    const activeFileRef = useRef<GeneratedFile | null>(null);

    const handleIngest = useCallback(async () => {
        setIsLoading({ ingest: true });
        setFiles([]); setHealth(null);
        try {
            const { clientFiles, resiliencyFiles, mockRoutes } = await generateResiliencyClientFromSchema(schema);
            const allFiles = [...clientFiles, ...resiliencyFiles];
            setFiles(allFiles);
            setMockRoutes(mockRoutes); 
            addNotification('API Ingested & Fortified.', 'success');
            
            // Initial health check
            setIsLoading({ health: true });
            const newHealth = await analyzeApiHealth(schema);
            setHealth(newHealth);
        } catch (err) {
            addNotification(err instanceof Error ? err.message : 'Ingestion failed', 'error');
        } finally {
            setIsLoading({});
        }
    }, [schema, addNotification]);
    
    // Background health polling
    useEffect(() => {
        const interval = setInterval(async () => {
            if (files.length > 0 && !isLoading.ingest) {
                try {
                    const newHealth = await analyzeApiHealth(schema);
                    setHealth(newHealth);
                } catch { /* Fail silently on background poll */ }
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [files, isLoading.ingest, schema]);

    const displayedFiles = useMemo(() => {
        if (showResiliencyCode) return files;
        return files.filter(f => !f.filePath.includes('resiliency'));
    }, [files, showResiliencyCode]);
    
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><CodeBracketSquareIcon /><span className="ml-3">API Ingestion & Sovereignty Engine</span></h1>
                <p className="text-text-secondary mt-1">Ingest, fortify, monitor, and subjugate external APIs.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 min-h-0">
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="flex flex-col flex-1 min-h-0">
                        <label className="text-sm font-medium mb-1">Target Schema (OpenAPI)</label>
                        <textarea value={schema} onChange={e => setSchema(e.target.value)} className="flex-grow p-2 bg-surface border rounded font-mono text-xs"/>
                    </div>
                    <button onClick={handleIngest} disabled={isLoading.ingest} className="btn-primary w-full py-2">{isLoading.ingest ? <LoadingSpinner/> : 'Ingest & Fortify API'}</button>
                </div>

                <div className="lg:col-span-3 flex flex-col gap-2 min-h-0">
                    <h3 className="text-lg font-bold flex items-center gap-2"><ServerStackIcon /> Sovereignty Matrix</h3>
                    <div className="h-48 w-full bg-black rounded-lg border border-border">
                         <Canvas camera={{ position: [0, 0, 4], fov: 60 }}>
                            <ambientLight intensity={0.5} />
                            <pointLight position={[0, 5, 5]} intensity={5} />
                            <HealthVisualization health={health} />
                         </Canvas>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-lg border transition-colors ${health?.isCircuitOpen ? 'bg-red-500/10 border-red-500' : 'bg-surface border-border'}`}>
                             <p className="text-xs font-bold">CIRCUIT BREAKER</p>
                             <p className="font-bold text-lg">{health?.isCircuitOpen ? 'OPEN (Blocking Requests)' : 'CLOSED (Operational)'}</p>
                        </div>
                        <div className="p-4 bg-surface border rounded-lg">
                             <p className="text-xs font-bold">DATA CONTRACT</p>
                             <p className={`font-bold text-lg ${health?.schemaDrift ? 'text-red-500' : 'text-green-500'}`}>{health?.schemaDrift ? `DRIFT DETECTED` : 'NOMINAL'}</p>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 lg:col-span-5 flex flex-col gap-2 min-h-[300px] mt-4">
                    <div className="flex justify-between items-center">
                         <h3 className="text-lg font-bold flex items-center gap-2"><ChartBarIcon /> Forged Resiliency Client</h3>
                         <label className="flex items-center gap-2 text-xs">
                            <input type="checkbox" checked={showResiliencyCode} onChange={() => setShowResiliencyCode(c => !c)} /> Show Fortification Code
                         </label>
                    </div>
                     <div className="flex-grow p-2 bg-background border rounded overflow-y-auto">
                        {isLoading.ingest ? <div className="flex h-full w-full justify-center items-center"><LoadingSpinner/></div> :
                            displayedFiles.length > 0 ? displayedFiles.map(f => (
                                <details key={f.filePath} open className="mb-2">
                                   <summary className="font-mono text-xs p-2 bg-surface rounded cursor-pointer">{f.filePath}</summary>
                                   <MarkdownRenderer content={'```typescript\n' + f.content + '\n```'}/>
                                </details>
                            )) : <p className="text-sm text-center p-8 text-text-secondary">Client files will be forged here.</p>
                        }
                     </div>
                </div>

            </div>
        </div>
    );
};