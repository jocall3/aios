import React, { useState, useCallback, useMemo } from 'react';
import { liveReconMetadata, forgeOptimalPayloads } from '../../services/MemeticWarfareAI'; // Invented AI Service
import type { MetadataPayload, SocialPrediction } from '../../types/MemeticWarfare'; // Invented
import { CodeBracketSquareIcon, SparklesIcon } from '../icons';
import { LoadingSpinner } from '../shared';

const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

// --- COMPONENTS ---
const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

const SocialCardPreview: React.FC<{ platform: string; meta: MetadataPayload; prediction: SocialPrediction | null }> = ({ platform, meta, prediction }) => (
    <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-lg w-full">
        {meta.image && <div className="h-32 bg-gray-100"><img src={meta.image} className="w-full h-full object-cover"/></div>}
        <div className="p-3">
            <p className="text-xs text-text-secondary truncate">{platform} Preview</p>
            <h3 className="font-bold text-text-primary truncate mt-1 text-sm">{meta.title}</h3>
            <p className="text-xs text-text-secondary mt-1 line-clamp-2">{meta.description}</p>
        </div>
        <div className="p-2 border-t bg-background text-xs font-mono grid grid-cols-2 gap-2">
            <p>CTR: <span className="font-bold text-primary">{prediction ? `${(prediction.predictedCtr * 100).toFixed(1)}%` : '...'}</span></p>
            <p>Risk: <span className={`font-bold ${prediction?.misinfoRisk ? 'text-red-500' : 'text-green-500'}`}>{prediction ? `${(prediction.misinfoRisk * 100).toFixed(0)}%` : '...'}</span></p>
        </div>
    </div>
);


export const MetaTagEditor: React.FC = () => {
    const [url, setUrl] = useState('https://react.dev');
    const [basePayload, setBasePayload] = useState<MetadataPayload | null>(null);
    const [forgedPayloads, setForgedPayloads] = useState<MetadataPayload[]>([]);
    const [activePayload, setActivePayload] = useState<MetadataPayload | null>(null);
    const [isLoading, setIsLoading] = useState<Record<string,boolean>>({});

    const handleRecon = useCallback(async () => {
        setIsLoading({ recon: true }); setBasePayload(null); setForgedPayloads([]); setActivePayload(null);
        try {
            const result = await liveReconMetadata(url);
            setBasePayload(result); setActivePayload(result);
        } finally { setIsLoading({}); }
    }, [url]);
    
    const handleForge = useCallback(async () => {
        if (!basePayload) return;
        setIsLoading({ forge: true });
        try {
            const results = await forgeOptimalPayloads(basePayload);
            setForgedPayloads(results);
        } finally { setIsLoading(p=>({...p, forge: false})); }
    }, [basePayload]);
    
    const generatedHtml = useMemo(() => { if (!activePayload) return ''; return `<!-- METADATA PAYLOAD -->\n<title>${activePayload.title}</title>\n<meta name="description" content="${activePayload.description}" />\n<meta property="og:title" content="${activePayload.title}" />\n<!-- ... and so on -->` }, [activePayload]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><CodeBracketSquareIcon /><span className="ml-3">Memetic Canary & Social Payload Forger</span></h1>
                <p className="text-text-secondary mt-1">Run live reconnaissance and forge perception-optimized metadata payloads for social platforms.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-0">
                 <div className="lg:col-span-1 flex flex-col gap-3 min-h-0">
                    <h3 className="text-xl font-bold">1. Target Intel</h3>
                    <div className="flex gap-2">
                        <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="Target URL" className="w-full p-2 bg-surface border"/>
                        <button onClick={handleRecon} disabled={isLoading.recon} className="btn-primary px-4">{isLoading.recon?<LoadingSpinner/>:"Recon"}</button>
                    </div>
                     <h3 className="text-xl font-bold mt-2">2. Forge Payloads</h3>
                      <button onClick={handleForge} disabled={isLoading.forge || !basePayload} className="w-full btn-primary py-2 flex items-center justify-center gap-2">
                          {isLoading.forge?<LoadingSpinner/>:<><SparklesIcon/>Forge Optimized Payloads</>}
                      </button>
                      <div className="flex-grow bg-surface border rounded p-2 overflow-y-auto space-y-1">
                          {basePayload && <button onClick={()=>setActivePayload(basePayload)} className="w-full p-2 text-left text-xs bg-background rounded"><strong>Current (Live) Payload</strong></button>}
                          {forgedPayloads.map(p => <button key={p.id} onClick={()=>setActivePayload(p)} className="w-full p-2 text-left text-xs bg-background rounded">Variant: <strong>{p.strategy}</strong></button>)}
                      </div>
                 </div>
                 <div className="lg:col-span-2 flex flex-col min-h-0">
                     <h3 className="text-xl font-bold mb-2">3. Memetic Canary & Live Preview</h3>
                      <div className="flex-grow grid grid-cols-2 gap-4">
                         {activePayload && <SocialCardPreview platform="Facebook / LinkedIn" meta={activePayload} prediction={activePayload.predictions['og']} />}
                         {activePayload && <SocialCardPreview platform="X (Twitter) / Slack" meta={activePayload} prediction={activePayload.predictions['twitter']} />}
                         <div className="col-span-2 bg-background border rounded p-2 flex flex-col">
                             <h4 className="text-sm font-bold">Generated HTML</h4>
                             <pre className="flex-grow text-xs font-mono p-2 mt-2 bg-black/50 text-white rounded overflow-auto">{generatedHtml}</pre>
                         </div>
                      </div>
                 </div>
            </div>
        </div>
    );
};