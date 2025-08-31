import React, { useState, useRef, useCallback } from 'react';
import { forgeUiPatchFromDom, runPerceptionAgent } from '../../services/AIVisionCognition'; // Invented ultra-capable service
import type { PerceptionScanResult, ReforgedUIPayload } from '../../types/AIVisionCognition'; // Invented types
import { EyeIcon, SparklesIcon, HammerIcon, DocumentTextIcon } from '../icons';
import { LoadingSpinner, MarkdownRenderer } from '../shared/MarkdownRenderer';

type PerceptionMode = 'baseline' | 'achromatopsia' | 'dyslexia' | 'motor_impairment' | 'cognitive_tunneling';

export const AccessibilityAuditor: React.FC = () => {
    const [url, setUrl] = useState('https://react.dev');
    const [scanUrl, setScanUrl] = useState('');
    const [scanResults, setScanResults] = useState<PerceptionScanResult | null>(null);
    const [forgedPayload, setForgedPayload] = useState<ReforgedUIPayload | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isForging, setIsForging] = useState(false);
    const [perceptionMode, setPerceptionMode] = useState<PerceptionMode>('baseline');
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const forgeRef = useRef<HTMLDivElement>(null);

    const applyPerceptionFilter = useCallback((mode: PerceptionMode) => {
        if (!iframeRef.current) return;
        const iFrameDoc = iframeRef.current.contentDocument;
        if (!iFrameDoc || !iFrameDoc.body) return;
        iFrameDoc.body.style.filter = 'none';
        iFrameDoc.body.classList.remove('jitters');

        if (mode === 'achromatopsia') {
            iFrameDoc.body.style.filter = 'grayscale(100%)';
        } else if (mode === 'dyslexia') {
            const style = iFrameDoc.createElement('style');
            style.innerHTML = `
                @keyframes jitter { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-1px); } 50% { transform: translateX(1px); } 75% { transform: translateX(-0.5px); } }
                .jitters span { display: inline-block; animation: jitter 0.15s infinite; }
            `;
            iFrameDoc.head.appendChild(style);
            iFrameDoc.querySelectorAll('p, h1, h2, h3, h4, span, a, li, button').forEach(el => {
                 el.innerHTML = el.textContent?.split('').map(char => `<span>${char}</span>`).join('') ?? '';
            });
            iFrameDoc.body.classList.add('jitters');
        }
    }, []);

    useEffect(() => {
        applyPerceptionFilter(perceptionMode);
    }, [perceptionMode, applyPerceptionFilter]);

    const handleScan = useCallback(() => {
        const targetUrl = url.startsWith('http') ? url : `https://${url}`;
        setScanUrl(targetUrl);
        setScanResults(null);
        setForgedPayload(null);
        setIsScanning(true);
    }, [url]);

    const handleIframeLoad = useCallback(async () => {
        if (isScanning && iframeRef.current?.contentWindow) {
            try {
                const results = await runPerceptionAgent(iframeRef.current.contentWindow.document.body);
                setScanResults(results);
            } catch (error) {
                console.error(error);
            } finally {
                setIsScanning(false);
            }
        }
    }, [isScanning]);

    const handleForge = useCallback(async () => {
        if (!scanResults) return;
        setIsForging(true);
        setForgedPayload(null);
        try {
            const result = await forgeUiPatchFromDom(scanResults.rawHtml, scanResults.violations);
            setForgedPayload(result);
        } finally {
            setIsForging(false);
        }
    }, [scanResults]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4"><h1 className="text-3xl font-bold flex items-center"><EyeIcon /><span className="ml-3">UI Sense-Scanner & Adaptive Forge</span></h1><p className="text-text-secondary mt-1">Deploy an AI Perception Agent to experience and reforge flawed user interfaces.</p></header>
            
            <div className="flex gap-2 mb-2"><input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://target-ui.com" className="flex-grow p-2 border rounded"/><button onClick={handleScan} disabled={isScanning} className="btn-primary px-6 py-2">{isScanning ? <LoadingSpinner /> : 'Deploy Agent'}</button></div>
            
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col gap-2 min-h-0">
                    <div className="flex justify-between items-center"><h3 className="text-lg font-bold">Target UI</h3>
                        <div className="flex gap-1 bg-surface p-1 rounded-lg border">{Object.keys({baseline:'👁️',achromatopsia:'🎨',dyslexia:'Abc',motor_impairment:'🎯',cognitive_tunneling:'🧠'}).map(mode=><button key={mode} onClick={()=>setPerceptionMode(mode as PerceptionMode)} className={`px-2 py-1 text-sm rounded-md ${perceptionMode === mode ? 'bg-primary text-text-on-primary' : 'hover:bg-background'}`} title={mode.replace('_',' ')}>{({baseline:'👁️',achromatopsia:'🎨',dyslexia:'Abc',motor_impairment:'🎯',cognitive_tunneling:'🧠'})[mode]}</button>)}</div>
                    </div>
                    <div className="flex-grow bg-background border-2 border-dashed border-border rounded-lg overflow-hidden"><iframe ref={iframeRef} src={scanUrl} title="Target UI" className="w-full h-full bg-white" onLoad={handleIframeLoad} sandbox="allow-scripts allow-same-origin"/></div>
                </div>

                <div className="flex flex-col gap-2 min-h-0">
                    <div className="flex justify-between items-center"><h3 className="text-lg font-bold">Forge Output</h3><button onClick={handleForge} disabled={!scanResults || isForging} className="btn-primary flex items-center gap-2 px-4 py-1 text-sm">{isForging?<LoadingSpinner />:<HammerIcon />}Forge UI Patch</button></div>
                    <div ref={forgeRef} className="flex-grow bg-background border-2 border-dashed border-border rounded-lg overflow-hidden relative">
                         {(isScanning || isForging) && <div className="absolute inset-0 bg-surface/80 flex items-center justify-center z-10"><LoadingSpinner/></div>}
                         {forgedPayload ? <iframe srcDoc={forgedPayload.html} title="Forged UI" className="w-full h-full bg-white"/> : <div className="p-4 text-center text-text-secondary">A reforged, superior UI will be constructed here.</div>}
                    </div>
                </div>
                
                <div className="md:col-span-2 flex flex-col min-h-0 bg-surface p-4 border rounded-lg max-h-[40vh] overflow-hidden">
                    <h3 className="text-lg font-bold mb-2 flex-shrink-0">Perception Agent Report</h3>
                    <div className="flex-grow grid grid-cols-2 gap-4 overflow-y-auto pr-2">
                        <div>
                            <h4 className="font-semibold text-sm mb-1">Critical Violations</h4>
                            {scanResults?.violations.filter(v => v.impact === 'critical').map((v, i) => <div key={i} className="text-xs p-1 bg-red-500/10 rounded">{v.help}</div>)}
                        </div>
                         <div>
                            <h4 className="font-semibold text-sm mb-1">Experiential Friction Points</h4>
                            <pre className="text-xs p-2 bg-background rounded h-full whitespace-pre-wrap">{scanResults?.experientialAnalysis || 'Deploy agent to generate report.'}</pre>
                         </div>
                    </div>
                </div>

            </div>
        </div>
    );
};