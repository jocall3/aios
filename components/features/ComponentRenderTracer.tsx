import React, { useState, useCallback, useMemo, useRef, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { instrumentAndProfileReactCode } from '../../services/ReactFiberAI'; // Invented
import type { ProfilerReport, ComponentRenderData } from '../../types/ReactFiber'; // Invented
import { EyeIcon } from '../icons';
import { LoadingSpinner } from '../shared';

const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

// --- Live Re-Render Storm Visualizer ---
const RenderStormNode: React.FC<{ data: ComponentRenderData, flash: number }> = ({ data, flash }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    useFrame(() => {
        if(meshRef.current) {
            meshRef.current.material.emissiveIntensity = Math.max(0, meshRef.current.material.emissiveIntensity - 0.1);
        }
    });

    useEffect(() => {
        if(meshRef.current && flash > 0) {
            meshRef.current.material.emissiveIntensity = 5.0;
        }
    }, [flash]);

    const color = data.wasUnnecessary ? '#ef4444' : '#3b82f6';

    return (
        <group position={[data.x, data.y, 0]}>
            <mesh ref={meshRef}>
                <boxGeometry args={[2, 0.5, 0.2]} />
                <meshStandardMaterial color="#27272a" emissive={color} emissiveIntensity={0} />
            </mesh>
            <Text position={[0,0,0.11]} fontSize={0.2} color="white">{data.name}</Text>
        </group>
    )
}


export const ComponentRenderTracer: React.FC = () => {
    const [code, setCode] = useState(`const Inefficient = ({obj}) => <div>{obj.name}</div>;\nconst App = () => { const [c, setC]=useState(0); const d={name:'Data'}; return <><button onClick={()=>setC(c+1)}>Render {c}</button><Inefficient obj={d}/></>}`);
    const [report, setReport] = useState<ProfilerReport | null>(null);
    const [renderFlashes, setRenderFlashes] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(false);
    const liveComponentRef = useRef<HTMLDivElement>(null);
    
    const handleProfile = useCallback(async () => {
        setIsLoading(true);
        setReport(null);
        try {
            // This service would mount the code and use the profiler API
            const result = await instrumentAndProfileReactCode(code, (renderEvent) => {
                setRenderFlashes(f => ({ ...f, [renderEvent.name]: (f[renderEvent.name] || 0) + 1 }));
            });
            setReport(result);
        } finally {
            setIsLoading(false);
        }
    }, [code]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><EyeIcon /><span className="ml-3">React Fiber-Level Profiler & Live Re-Render Storm Visualizer</span></h1>
                <p className="text-text-secondary mt-1">Witness the render cascade. Hunt wasted cycles. Enforce performance purity.</p>
            </header>
            
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                 <div className="flex flex-col gap-3 min-h-0">
                     <h3 className="text-xl font-bold">Component Source Code</h3>
                     <textarea value={code} onChange={e => setCode(e.target.value)}
                         className="flex-grow p-2 bg-surface border rounded font-mono text-xs"/>
                    <button onClick={handleProfile} disabled={isLoading} className="btn-primary w-full py-2">
                        {isLoading ? <LoadingSpinner/> : 'Mount & Profile Component'}
                    </button>
                      <div className="h-48 flex-shrink-0 flex flex-col mt-2">
                         <h4 className="font-semibold text-sm mb-1">Live Component Sandbox</h4>
                         <div ref={liveComponentRef} className="flex-grow bg-white border rounded p-4">
                            {/* In a real implementation, the profiled component would be dynamically mounted here */}
                            <p className="text-black">Live component interacts here.</p>
                         </div>
                    </div>
                 </div>
                 
                <div className="flex flex-col min-h-0">
                     <h3 className="text-xl font-bold mb-2">Re-Render Storm</h3>
                      <div className="flex-grow bg-black rounded-lg border border-primary relative">
                         {report && (
                            <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
                                <ambientLight intensity={0.5} />
                                <pointLight position={[0, 5, 10]} intensity={5}/>
                                {report.componentTree.map(c => <RenderStormNode key={c.name} data={c} flash={renderFlashes[c.name] || 0} />)}
                            </Canvas>
                         )}
                         {isLoading && <div className="h-full w-full flex items-center justify-center"><LoadingSpinner/></div>}
                     </div>
                      <div className="flex-shrink-0 bg-surface border rounded-lg p-3 mt-3 min-h-[150px] overflow-y-auto">
                           <h4 className="font-semibold text-sm mb-2">Root Cause Analysis</h4>
                            <div className="text-xs prose prose-sm max-w-none">
                                {report?.analysis ? <MarkdownRenderer content={report.analysis} /> : "Analysis will appear here after profiling."}
                            </div>
                      </div>
                 </div>
            </div>
        </div>
    );
};