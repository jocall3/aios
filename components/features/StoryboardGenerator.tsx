// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback, useRef } from 'react';
import { decomposeUserFlowAndGeneratePrototype, generateComponentFromHtml } from '../../services/InteractiveFlowAI'; // Invented AI Service
import type { InteractivePrototype } from '../../types/InteractiveFlow'; // Invented
import { PhotoIcon, CodeBracketSquareIcon } from '../icons';
import { LoadingSpinner, MarkdownRenderer } from '../shared';
import { useNotification } from '../../contexts/NotificationContext';

const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

// --- COMPONENTS ---
const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

const ProgressBar: React.FC<{ progress: number; text: string }> = ({ progress, text }) => (
    <div className="w-full text-center">
        <p className="text-sm font-mono mb-2">{text}</p>
        <div className="w-full bg-surface rounded-full h-2.5 border"><div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div></div>
    </div>
);


export const StoryboardGenerator: React.FC = () => {
    const [flow, setFlow] = useState('User sees a login form with email and password. After logging in, they see a dashboard with a welcome message.');
    const [prototype, setPrototype] = useState<InteractivePrototype | null>(null);
    const [currentScreenId, setCurrentScreenId] = useState<string | null>(null);
    const [scaffoldedCode, setScaffoldedCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState({ percent: 0, text: '' });
    const { addNotification } = useNotification();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    
    const handleGenerate = useCallback(async () => {
        setIsLoading(true);
        setPrototype(null); setCurrentScreenId(null); setScaffoldedCode(null);
        
        const progressCallback = (p: number, t: string) => setProgress({ percent: p, text: t });
        try {
            const result = await decomposeUserFlowAndGeneratePrototype(flow, progressCallback);
            setPrototype(result);
            setCurrentScreenId(result.initialScreenId);
            addNotification('Interactive prototype generated!', 'success');
        } catch (err) {
            addNotification(err instanceof Error ? err.message : 'Generation failed', 'error');
        } finally {
            setIsLoading(false);
            setProgress({ percent: 0, text: ''});
        }
    }, [flow, addNotification]);
    
    // Logic to handle clicks inside the iframe
    useEffect(() => {
        const handleIframeClicks = (event: MouseEvent) => {
            const element = event.target as HTMLElement;
            const interactionId = element.getAttribute('data-interaction-id');
            if (interactionId && prototype?.interactionMap) {
                const targetScreenId = prototype.interactionMap[interactionId];
                if (targetScreenId) {
                    setCurrentScreenId(targetScreenId);
                }
            }
        };

        const iframe = iframeRef.current;
        iframe?.contentWindow?.document.body.addEventListener('click', handleIframeClicks);
        return () => iframe?.contentWindow?.document.body.removeEventListener('click', handleIframeClicks);

    }, [currentScreenId, prototype]);

    const handleScaffold = async () => {
        if (!currentScreenId || !prototype) return;
        setIsLoading(true); // Re-use loading state
        setProgress({ percent: 50, text: 'Analyzing DOM and synthesizing React component...'});
        try {
            const currentHtml = prototype.screens[currentScreenId].html;
            const code = await generateComponentFromHtml(currentHtml);
            setScaffoldedCode(code);
        } finally {
            setIsLoading(false);
        }
    };
    
    const currentScreen = prototype?.screens[currentScreenId || ''];

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><PhotoIcon /><span className="ml-3">Interactive User Flow Simulator & Component Scaffolder</span></h1>
                <p className="text-text-secondary mt-1">From user story to interactive prototype to production-ready React components, in one command.</p>
            </header>
            
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">User Flow Description</label>
                <div className="flex gap-2">
                    <textarea value={flow} onChange={e => setFlow(e.target.value)} className="w-full p-2 bg-surface border rounded text-sm h-16"/>
                    <button onClick={handleGenerate} disabled={isLoading} className="btn-primary px-6 font-bold">GENERATE</button>
                </div>
            </div>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0 mt-4">
                 <div className="flex flex-col min-h-0">
                     <h3 className="text-xl font-bold mb-2">Interactive Prototype</h3>
                      <div className="flex-grow bg-background border rounded-lg p-2">
                        {isLoading && <div className="h-full flex items-center justify-center"><ProgressBar {...progress} /></div>}
                        {!isLoading && currentScreen && (
                            <iframe ref={iframeRef} srcDoc={currentScreen.html} title="Prototype Screen" className="w-full h-full bg-white"/>
                        )}
                      </div>
                      {currentScreen && <div className="text-center p-2 bg-surface border rounded mt-2 text-sm"><strong>Screen:</strong> {currentScreen.description}</div>}
                 </div>
                 
                 <div className="flex flex-col min-h-0">
                     <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xl font-bold">Component Forge</h3>
                         <button onClick={handleScaffold} disabled={isLoading || !currentScreen} className="btn-primary text-xs flex items-center gap-1 px-3 py-1 font-bold">
                             <CodeBracketSquareIcon /> Scaffold React Component
                         </button>
                     </div>
                      <div className="flex-grow bg-background border rounded-lg p-1 overflow-y-auto">
                          {isLoading && progress.text.includes('Synthesizing') && <div className="h-full flex items-center justify-center"><LoadingSpinner/></div>}
                          {scaffoldedCode && (
                            <MarkdownRenderer content={"```typescript\n"+scaffoldedCode+"\n```"} />
                          )}
                     </div>
                 </div>
            </div>
        </div>
    );
};