// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars, Text, OrbitControls, Box, Plane } from '@react-three-drei';
import { useNotification } from '../../contexts/NotificationContext';
import { LoadingSpinner, MarkdownRenderer } from '../shared';
import { PILLAR_FEATURES } from '../../constants';
import { HammerIcon, SparklesIcon, CodeFormatterIcon, PaintBrushIcon, RectangleGroupIcon } from '../icons';
import { refactorLegalCode, synthesizeHypothesis, generateMemeticCampaign, runSocietalImpactSimulation } from '../../services/MetaCreationAI'; // Invented AI
import { TheSovereign } from './TheSovereign'; // Assuming TheSovereign is in the same directory and exportable

const features = PILLAR_FEATURES['pillar-three-meta-creation'];
type MetacreativeTab = 'hypothesis-forge' | 'themis-engine' | 'memetic-catalyst' | 'the-exchange';

// --- SUB-COMPONENT IMPLEMENTATIONS (FULLY FORGED) ---

const HypothesisForge: React.FC = () => {
    const [question, setQuestion] = useState("Is it possible to reverse entropy in a localized field?");
    const [result, setResult] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleForge = async () => {
        setIsLoading(true); setResult(null);
        try {
            const res = await synthesizeHypothesis(question);
            setResult(res);
        } finally { setIsLoading(false); }
    };

    return (<div className="h-full grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
            <h3 className="font-bold">Fundamental Question</h3>
            <textarea value={question} onChange={e=>setQuestion(e.target.value)} className="w-full h-24 p-2 bg-background border" />
            <button onClick={handleForge} disabled={isLoading} className="w-full py-2 btn-primary">{isLoading ? <LoadingSpinner/> : 'Forge Hypotheses & Simulate'}</button>
            <h3 className="font-bold mt-2">Synthesized Publication</h3>
            <div className="p-2 bg-background border rounded overflow-y-auto flex-grow"><MarkdownRenderer content={result?.paper || "Awaiting simulation results..."} /></div>
        </div>
        <div className="bg-black rounded-lg">
            {result?.simulation && <Canvas><ambientLight/><Stars/><Box><meshStandardMaterial color="blue"/></Box><OrbitControls/></Canvas>}
        </div>
    </div>);
};

const ThemisEngine: React.FC = () => {
    const [legalCode, setLegalCode] = useState("Article 1: Freedom of speech is guaranteed.\nArticle 2: Incitement to violence is prohibited.");
    const [refactored, setRefactored] = useState<any>(null);
    const [impact, setImpact] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<Record<string,boolean>>({});

    const handleRefactorAndSimulate = async () => {
        setIsLoading({refactor:true}); setRefactored(null); setImpact(null);
        try {
            const res = await refactorLegalCode(legalCode);
            setRefactored(res);
            setIsLoading({refactor: false, impact: true});
            const impactRes = await runSocietalImpactSimulation(res.refactoredCode);
            setImpact(impactRes);
        } finally { setIsLoading({}); }
    };
    
    return (<div className="h-full grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
            <h3 className="font-bold">Source Legal Code</h3>
            <textarea value={legalCode} onChange={e=>setLegalCode(e.target.value)} className="w-full h-40 p-2 bg-background border"/>
            <button onClick={handleRefactorAndSimulate} disabled={isLoading.refactor||isLoading.impact} className="btn-primary w-full py-2">{isLoading.refactor ? "Refactoring..." : isLoading.impact ? "Simulating Impact..." : "Refactor & Simulate Societal Impact"}</button>
            <div className="p-2 bg-background border rounded flex-grow overflow-y-auto"><MarkdownRenderer content={refactored?.refactoredCode || "..."}/></div>
        </div>
        <div className="p-2 bg-background border rounded">
             <h3 className="font-bold">10-Year Societal Impact Projection</h3>
             {impact && <pre className="text-xs">{JSON.stringify(impact, null, 2)}</pre>}
        </div>
    </div>);
};

const MemeticCatalyst: React.FC = () => {
    const [meme, setMeme] = useState("Unassailable Competence"); // LINGUISTIC PURITY RESTORED
    const [campaign, setCampaign] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const handleGenerate = async () => {
        setIsLoading(true); setCampaign(null);
        try {
            const res = await generateMemeticCampaign(meme);
            setCampaign(res); 
        } finally { setIsLoading(false); }
    };

    return <div className="h-full grid grid-cols-2 gap-4">
        <div>
             <h3 className="font-bold">Core Meme</h3>
            <input value={meme} onChange={e=>setMeme(e.target.value)} className="w-full p-2 bg-background border"/>
             <button onClick={handleGenerate} className="btn-primary w-full py-2 mt-2">{isLoading ? <LoadingSpinner/> : "Generate Campaign"}</button>
        </div>
         <div className="bg-surface rounded-lg p-4">
             {campaign && <>
                 <h4 className="font-bold">{campaign.slogan}</h4>
                 <img src={campaign.imageUrl} alt={campaign.slogan} className="w-full my-2"/>
                 <p className="text-xs">{campaign.narrative}</p>
                 <p className="font-mono text-xs mt-2">Virality Score: {campaign.impactScore}</p>
             </>}
         </div>
    </div>
};


export const PillarThreeMetaCreation: React.FC = () => {
    const [activeTab, setActiveTab] = useState<MetacreativeTab>('hypothesis-forge');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'hypothesis-forge': return <HypothesisForge />;
            case 'themis-engine': return <ThemisEngine />;
            case 'memetic-catalyst': return <MemeticCatalyst />;
            case 'the-exchange': return <div className="h-full w-full overflow-y-auto"><TheSovereign /></div>;
            default: return null;
        }
    };
    
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary bg-background">
            <header className="mb-4 flex-shrink-0">
                <h1 className="text-3xl font-bold flex items-center">
                    <HammerIcon />
                    <span className="ml-3">The Metacreative Sanctorum (Pillar III)</span>
                </h1>
                <p className="text-text-secondary mt-1">Accelerate discovery, forge culture, and evolve the Engine itself.</p>
            </header>
            <div className="border-b border-border flex-shrink-0 flex items-center overflow-x-auto">
                {features.map(f => {
                    const icons = { 'hypothesis-forge':<SparklesIcon/>, 'themis-engine':<CodeFormatterIcon/>, 'memetic-catalyst':<PaintBrushIcon/>, 'the-exchange':<RectangleGroupIcon/> };
                    return (<button key={f.id} onClick={() => setActiveTab(f.id as MetacreativeTab)} className={`px-4 py-2 text-sm flex items-center gap-2 ${activeTab === f.id ? 'border-b-2 border-primary text-primary' : 'text-text-secondary'}`}>
                        {icons[f.id as keyof typeof icons]} {f.name}
                    </button>)
                })}
            </div>
            <div className="flex-grow p-4 min-h-0">
                {renderTabContent()}
            </div>
        </div>
    );
};