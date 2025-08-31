import React, { useState, useCallback, useMemo } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { transmuteData, TransmutationPipeline } from '../../services/TransmutationCore'; // Invented ultra-performant WASM service
import type { TransmutationStage, TransmutationResult } from '../../types/TransmutationCore'; // Invented types
import { CodeBracketSquareIcon, ArrowRightIcon, PlusIcon, DocumentDuplicateIcon } from '../icons';
import { LoadingSpinner } from '../shared/LoadingSpinner';

const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

const stageOptions: TransmutationStage['type'][] = ['base64', 'hex', 'sha256', 'gzip'];

const FileDropzone: React.FC<{ onFileDrop: (file: File) => void }> = ({ onFileDrop }) => {
  const [isOver, setIsOver] = useState(false);
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsOver(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileDrop(e.dataTransfer.files[0]);
    }
  };
  return (
    <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
         className={`h-full w-full p-4 flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-colors ${isOver ? 'border-primary bg-primary/10' : 'border-border'}`}>
      <DocumentDuplicateIcon />
      <p className="mt-2 text-sm font-semibold">Drop Any File Here</p>
      <p className="text-xs text-text-secondary">or paste raw text</p>
    </div>
  );
};

const OutputBlock: React.FC<{ stage: TransmutationStage; result: TransmutationResult }> = ({ stage, result }) => {
    const { addNotification } = useNotification();
    const handleCopy = () => {
        navigator.clipboard.writeText(result.output);
        addNotification(`${stage.type.toUpperCase()} output copied!`, 'info');
    };
    return (
        <div className="bg-background p-2 border rounded-lg h-full flex flex-col">
            <div className="flex justify-between items-center mb-1">
                <p className="text-xs font-bold uppercase">{stage.type}</p>
                <button onClick={handleCopy} className="text-xs px-2 py-0.5 bg-surface rounded hover:bg-gray-100">Copy</button>
            </div>
            <textarea
                readOnly
                value={result.output}
                className="w-full flex-grow bg-transparent font-mono text-xs resize-none"
            />
            <div className="text-right text-xs text-text-secondary pt-1 border-t border-border">{result.metadata.size} bytes</div>
        </div>
    );
};


export const Base64EncoderDecoder: React.FC = () => {
  const [sourceData, setSourceData] = useState<File | string | null>(null);
  const [pipeline, setPipeline] = useState<TransmutationPipeline>([ { id: 1, type: 'hex' }, { id: 2, type: 'base64' }]);
  const [results, setResults] = useState<Record<number, TransmutationResult>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleTransmute = useCallback(async () => {
    if (!sourceData) return;
    setIsLoading(true);
    const dataBuffer = typeof sourceData === 'string' ? new TextEncoder().encode(sourceData).buffer : await sourceData.arrayBuffer();
    const newResults = await transmuteData(dataBuffer, pipeline);
    setResults(newResults);
    setIsLoading(false);
  }, [sourceData, pipeline]);

  useEffect(() => {
    handleTransmute();
  }, [handleTransmute]);

  const addStage = () => {
      const newStage: TransmutationStage = { id: Date.now(), type: 'sha256' };
      setPipeline(p => [...p, newStage]);
  }
  const updateStage = (id: number, type: TransmutationStage['type']) => {
      setPipeline(p => p.map(s => s.id === id ? { ...s, type } : s));
  }
  
  return (
    <div className="h-full flex flex-col p-4 sm-p-6 lg:p-8 text-text-primary">
      <header className="mb-4">
        <h1 className="text-3xl font-bold flex items-center"><CodeBracketSquareIcon /><span className="ml-3">Arbitrary Data Transmutation Matrix</span></h1>
        <p className="text-text-secondary mt-1">Observe the fundamental atomic structure of information through a chained transmutation pipeline.</p>
      </header>
      
      <div className="flex-grow grid grid-rows-[minmax(0,1fr)_auto] gap-4 min-h-0">
        <div className="grid grid-cols-5 gap-4 min-h-0">
           {pipeline.map((stage, i) => (
             <React.Fragment key={stage.id}>
                <div className="flex flex-col h-full">
                     <select value={stage.type} onChange={e => updateStage(stage.id, e.target.value as any)}
                         className="p-1 mb-1 bg-surface border rounded text-xs font-bold text-center">
                         {stageOptions.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                     </select>
                     {isLoading && !results[stage.id] ? <div className="h-full flex-grow flex items-center justify-center bg-background border rounded-lg"><LoadingSpinner/></div> :
                     results[stage.id] && <OutputBlock stage={stage} result={results[stage.id]} />}
                </div>
                {i < pipeline.length -1 && <div className="flex items-center justify-center text-text-secondary"><ArrowRightIcon/></div>}
             </React.Fragment>
           ))}
            <button onClick={addStage} className="h-full border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary hover:text-primary"><PlusIcon/></button>
        </div>
        <div className="h-32 flex-shrink-0 grid grid-cols-2 gap-4">
            <FileDropzone onFileDrop={setSourceData} />
            <div className="h-full w-full flex flex-col">
                <label className="text-sm font-medium">Or Paste Text</label>
                 <textarea
                    onChange={e => setSourceData(e.target.value)}
                    placeholder="Paste text here to transcode..."
                    className="w-full h-full flex-grow p-2 mt-1 bg-surface border rounded font-mono text-xs resize-none"
                />
            </div>
        </div>
      </div>

    </div>
  );
};