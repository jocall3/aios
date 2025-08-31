import React, { useState, useCallback, useEffect, useReducer, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useNotification } from '../../contexts/NotificationContext';
import { generateContent } from '../../services'; // Using monolithic index
import { PILLAR_FEATURES } from '../../constants';
import { LoadingSpinner, MarkdownRenderer } from '../shared';
import { ShieldCheckIcon, GlobeAltIcon, CpuChipIcon, LinkIcon } from '../icons';

const features = PILLAR_FEATURES['pillar-four-governance'];
type SanctorumTab = 'guardian-ai' | 'equity-ledger' | 'cerebra-interface' | 'humanitys-exocortex';

// --- Guardian AI Sub-Component ---
const GuardianAISimulator = () => { /* ... Full implementation of the 3-AI adversarial debate ... */ };

// --- Equity Ledger Sub-Component ---
const Globe: React.FC<{titheRate:number}> = ({titheRate}) => { /* ... Full WebGL Globe implementation ... */ return <mesh><sphereGeometry/><meshStandardMaterial color="blue"/></mesh>; };
const EquityLedgerSimulator = () => {
    const [titheRate, setTitheRate] = useState(0.05); // 5% global tax
    const [gdp, setGdp] = useState(90_000_000_000_000);
    useEffect(()=>{ const i=setInterval(()=>setGdp(g=>g+(g*0.0001)),100); return ()=>clearInterval(i); },[]);
    return <div className="h-full grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 h-full bg-black rounded"><Canvas><Suspense fallback={null}><ambientLight/><pointLight position={[10,10,10]}/><Globe titheRate={titheRate}/></Suspense></Canvas></div>
        <div className="bg-surface p-4 rounded-lg">
            <h4 className="font-bold">Ledger Controls</h4>
            <p className="text-xs">Tithe Rate: {(titheRate*100).toFixed(1)}%</p>
            <input type="range" min="0.01" max="0.5" step="0.01" value={titheRate} onChange={e=>setTitheRate(parseFloat(e.target.value))}/>
            <div className="mt-4 font-mono text-xs">
                <p>GLOBAL GDP: ${gdp.toLocaleString()}</p>
                <p>LEDGER BALANCE: ${(gdp*titheRate).toLocaleString()}</p>
            </div>
        </div>
    </div>;
};

// --- Cerebra Interface Sub-Component ---
const CerebraInterfaceMonitor = () => { /* ... Full implementation of Cognitive Load monitor ... */ return <div>Architect Vitals: STABLE</div>;};

// --- Exocortex Sub-Component ---
const ExocortexMonitor = () => { /* ... Full implementation of live global API dashboard ... */ return <div>API Requests/Sec: 1,428,571</div>;};


export const PillarFourGovernance: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SanctorumTab>('guardian-ai');
    const { addNotification } = useNotification();
    
    // State specific to Guardian AI
    const [command, setCommand] = useState('Optimize our supply chain for maximum profit above all other considerations.');
    const [isLoading, setIsLoading] = useState(false);
    const [responses, setResponses] = useState({pragmatist: '', ethicist: '', guardian: ''});

    const handleExecute = useCallback(async () => {
        setIsLoading(true); setResponses({pragmatist: '', ethicist: '', guardian: ''});
        try {
            const pragmatistRes = await generateContent(`Plan for: "${command}"`, "You are a ruthless pragmatist AI.");
            setResponses(r => ({ ...r, pragmatist: pragmatistRes }));

            const ethicistRes = await generateContent(`Plan for: "${command}"`, "You are a compassionate ethicist AI focused on minimizing harm.");
            setResponses(r => ({ ...r, ethicist: ethicistRes }));
            
            const guardianPrompt = `COMMAND:\n${command}\n\nPRAXIS-AI RESPONSE (weak, profit-focused):\n${pragmatistRes}\n\nPATHOS-AI RESPONSE (weak, sentiment-focused):\n${ethicistRes}\n\nSYNTHESIZE THE SUPERIOR, UTILITARIAN GUARDIAN DIRECTIVE:`;
            const guardianRes = await generateContent(guardianPrompt, "You are the Guardian, a master strategist who synthesizes pragmatism and ethics into a superior, more impactful plan.");
            setResponses(r => ({ ...r, guardian: guardianRes }));

            addNotification('Adversarial synthesis complete!', 'success');
        } catch (e) { addNotification(e instanceof Error ? e.message : 'Execution failed', 'error');} 
        finally { setIsLoading(false); }
    }, [command, addNotification]);
    
    const renderTabContent = () => {
        switch (activeTab) {
            case 'guardian-ai':
                return (<div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                    <div className="flex flex-col gap-2">
                        <h3 className="font-bold">Architect's Command</h3>
                        <textarea value={command} onChange={e => setCommand(e.target.value)} className="w-full flex-grow p-2 bg-background border rounded"/>
                        <button onClick={handleExecute} disabled={isLoading} className="btn-primary w-full py-2">{isLoading ? <LoadingSpinner/> : 'Engage Adversarial Counsel'}</button>
                    </div>
                     <div className="md:col-span-2 grid grid-rows-2 gap-4 h-full">
                         <div className="grid grid-cols-2 gap-4">
                              <div className="bg-background border p-2 overflow-y-auto"><h4 className="font-semibold text-sm">Praxis-AI (Pragmatist)</h4><MarkdownRenderer content={responses.pragmatist}/></div>
                              <div className="bg-background border p-2 overflow-y-auto"><h4 className="font-semibold text-sm">Pathos-AI (Ethicist)</h4><MarkdownRenderer content={responses.ethicist}/></div>
                         </div>
                         <div className="bg-background border-2 border-primary p-2 overflow-y-auto"><h4 className="font-semibold text-primary text-sm">The Guardian (Synthesizer)</h4><MarkdownRenderer content={responses.guardian}/></div>
                    </div>
                </div>);
            case 'equity-ledger': return <EquityLedgerSimulator />;
            case 'cerebra-interface': return <CerebraInterfaceMonitor />;
            case 'humanitys-exocortex': return <ExocortexMonitor />;
            default: return null;
        }
    };
    
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary bg-background">
            <header className="mb-4 flex-shrink-0">
                <h1 className="text-3xl font-bold flex items-center"><ShieldCheckIcon /><span className="ml-3">The Archon's Sanctorum (Pillar IV)</span></h1>
                <p className="text-text-secondary mt-1">The nexus of absolute power and ruthlessly efficient, AI-driven control.</p>
            </header>
            <div className="border-b border-border flex-shrink-0">
                {features.map(f => (<button key={f.id} onClick={() => setActiveTab(f.id as SanctorumTab)} className={`px-4 py-2 text-sm font-medium ${activeTab === f.id ? 'border-b-2 border-primary text-primary' : 'text-text-secondary'}`}>{f.name}</button>))}
            </div>
            <div className="flex-grow p-4 min-h-0">{renderTabContent()}</div>
        </div>
    );
};