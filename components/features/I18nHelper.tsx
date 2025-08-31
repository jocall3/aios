import React, { useState, useCallback, useMemo } from 'react';
import { synthesizeLocalizationPackage } from '../../services/GeolinguisticAI'; // Invented
import type { LocalizationPackage, CulturalAnalysis } from '../../types/Geolinguistic'; // Invented
import { ProjectExplorerIcon, GlobeAltIcon, ExclamationTriangleIcon } from '../icons';
import { LoadingSpinner, MarkdownRenderer } from '../shared';

const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

// --- COMPONENTS ---
const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

const exampleCode = `const WelcomeCard = () => <div className="p-8 text-center"><h1 className="text-4xl font-bold">Giddy up, Partner!</h1><p>Let's wrangle some deals!</p><button>Start Now</button></div>`;
const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

export const I18nHelper: React.FC = () => {
    const [code, setCode] = useState(exampleCode);
    const [targetLocale, setTargetLocale] = useState('ja-JP');
    const [locPackage, setLocPackage] = useState<LocalizationPackage | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSynthesize = useCallback(async () => {
        setIsLoading(true); setLocPackage(null);
        try {
            // In a real implementation, a screenshot would be taken programmatically.
            const result = await synthesizeLocalizationPackage(code, "screenshot_base64_placeholder", targetLocale);
            setLocPackage(result);
        } finally { setIsLoading(false); }
    }, [code, targetLocale]);

    const previewSrcDoc = useMemo(() => {
        if (!locPackage) return '';
        return `
            <script src="https://cdn.tailwindcss.com"></script>
            <style>${locPackage.refactoredCss}</style>
            <body class="bg-white">
                <div id="root">${locPackage.refactoredHtml}</div>
                <script>
                    const t = (key) => ${JSON.stringify(locPackage.translationJson)}[key] || key;
                    document.querySelectorAll('[data-i18n-key]').forEach(el => {
                        el.textContent = t(el.getAttribute('data-i18n-key'));
                    });
                </script>
            </body>`;
    }, [locPackage]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><ProjectExplorerIcon /><span className="ml-3">Geolinguistic & Cultural Adaptation Engine</span></h1>
                <p className="text-text-secondary mt-1">Synthesize complete localization packages, including cultural and layout adaptations.</p>
            </header>
            
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 min-h-0">
                 <div className="lg:col-span-2 flex flex-col gap-3 min-h-0">
                     <h3 className="text-xl font-bold">1. Input Component</h3>
                     <textarea value={code} onChange={e => setCode(e.target.value)} className="flex-grow p-2 bg-surface border rounded font-mono text-xs"/>
                     <div className="flex gap-2">
                        <select value={targetLocale} onChange={e => setTargetLocale(e.target.value)} className="w-full p-2 bg-surface border rounded text-sm">
                           <option value="ja-JP">Japanese (Japan)</option>
                           <option value="de-DE">German (Germany)</option>
                           <option value="ar-SA">Arabic (Saudi Arabia)</option>
                        </select>
                        <button onClick={handleSynthesize} disabled={isLoading} className="btn-primary px-4 py-2">{isLoading?<LoadingSpinner/>:"Synthesize"}</button>
                    </div>
                 </div>

                 <div className="lg:col-span-3 flex flex-col min-h-0 gap-3">
                     <h3 className="text-xl font-bold">2. Live Adaptation Preview</h3>
                      <div className="flex-grow bg-white border rounded">
                        {isLoading && <div className="h-full flex items-center justify-center"><LoadingSpinner/></div>}
                        {locPackage && <iframe srcDoc={previewSrcDoc} title="preview" className="w-full h-full"/>}
                      </div>
                 </div>

                <div className="lg:col-span-5 flex flex-col min-h-0 gap-3 mt-4">
                     <h3 className="text-xl font-bold">3. Synthesized Localization Package</h3>
                     <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[200px]">
                         <div className="bg-surface border rounded p-2 flex flex-col">
                             <p className="font-bold text-sm">Refactored Code</p>
                             <div className="flex-grow mt-1 bg-background rounded overflow-auto"><MarkdownRenderer content={"```jsx\n"+(locPackage?.refactoredHtml||'')+"\n```"}/></div>
                         </div>
                         <div className="bg-surface border rounded p-2 flex flex-col">
                              <p className="font-bold text-sm">Translation File (`{targetLocale.split('-')[0]}.json`)</p>
                             <div className="flex-grow mt-1 bg-background rounded overflow-auto"><MarkdownRenderer content={"```json\n"+JSON.stringify(locPackage?.translationJson || {},null,2)+"\n```"}/></div>
                         </div>
                         <div className="bg-surface border rounded p-2 flex flex-col">
                              <p className="font-bold text-sm">Cultural Analysis</p>
                              <div className="flex-grow mt-1 bg-background rounded p-2 text-xs space-y-2 overflow-y-auto">
                                 {locPackage?.culturalAnalysis.warnings.map(w=><p key={w}><ExclamationTriangleIcon className="inline-block mr-1 text-yellow-400"/>{w}</p>)}
                              </div>
                         </div>
                     </div>
                 </div>
            </div>
        </div>
    );
};