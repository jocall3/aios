import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateAdeptProtocol } from '../../services/AdeptProtocolAI'; // An invented, much more powerful service
import type { AdeptProtocol } from '../../types/AdeptProtocol'; // Invented, structured type
import { BeakerIcon, PlayIcon, CheckCircleIcon, XCircleIcon } from '../icons';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { MarkdownRenderer } from '../shared/MarkdownRenderer';

const initialCode = `// Solve the protocol here.\n\nfunction solve(input) {\n  return input;\n}`;

enum StageStatus {
    LOCKED,
    ACTIVE,
    PASSED,
    FAILED,
}

const StageIndicator: React.FC<{ name: string; status: StageStatus }> = ({ name, status }) => {
    const baseStyle = "w-full p-2 border-t-4 text-center text-xs font-bold uppercase transition-all duration-300";
    let statusStyle = "border-border text-text-secondary";
    if (status === StageStatus.ACTIVE) statusStyle = "border-primary text-primary animate-pulse";
    if (status === StageStatus.PASSED) statusStyle = "border-green-500 text-green-500";
    if (status === StageStatus.FAILED) statusStyle = "border-red-500 text-red-500";
    return <div className={`${baseStyle} ${statusStyle}`}>{name}</div>;
};

const TestResult: React.FC<{ result: any }> = ({ result }) => {
    const isPassed = result.status === 'passed';
    return (
        <div className={`flex items-start gap-2 p-1 text-xs font-mono border-l-2 ${isPassed ? 'border-green-500' : 'border-red-500'}`}>
            {isPassed ? <CheckCircleIcon className="text-green-500 w-4 h-4 flex-shrink-0"/> : <XCircleIcon className="text-red-500 w-4 h-4 flex-shrink-0"/>}
            <div>
                <p className={isPassed ? 'text-text-primary' : 'text-red-400'}>{result.description}</p>
                {!isPassed && <p className="text-red-600">Expected: {result.expected}, Got: {result.actual}</p>}
            </div>
        </div>
    );
}

export const AiCodingChallenge: React.FC = () => {
    const [protocol, setProtocol] = useState<AdeptProtocol | null>(null);
    const [solutionCode, setSolutionCode] = useState(initialCode);
    const [isLoading, setIsLoading] = useState(true);
    const [testResults, setTestResults] = useState<any[]>([]);
    const [currentStage, setCurrentStage] = useState(0);
    const sandboxRef = useRef<HTMLIFrameElement>(null);

    const initProtocol = useCallback(async () => {
        setIsLoading(true);
        setProtocol(null);
        setCurrentStage(0);
        setTestResults([]);
        try {
            const newProtocol = await generateAdeptProtocol();
            setProtocol(newProtocol);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        initProtocol();
    }, [initProtocol]);

    const runTests = useCallback(() => {
        if (!protocol || !sandboxRef.current?.contentWindow) return;
        
        const stage = protocol.stages[currentStage];
        if (!stage) return;
        
        const message = {
            solutionCode,
            testCases: stage.testCases
        };

        sandboxRef.current.contentWindow.postMessage(message, '*');
    }, [protocol, solutionCode, currentStage]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.source !== sandboxRef.current?.contentWindow) return;
            const { results } = event.data;
            setTestResults(results);

            const allPassed = results.every((r: any) => r.status === 'passed');
            if (allPassed && protocol && currentStage < protocol.stages.length - 1) {
                setTimeout(() => setCurrentStage(s => s + 1), 1000);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [protocol, currentStage]);
    
    const sandboxSrcDoc = `
        <script>
            window.addEventListener('message', (event) => {
                const { solutionCode, testCases } = event.data;
                const results = [];
                try {
                    const solve = new Function('return ' + solutionCode)();
                    for (const test of testCases) {
                        try {
                            const actual = solve(test.input);
                            if (JSON.stringify(actual) === JSON.stringify(test.expected)) {
                                results.push({ status: 'passed', description: test.description });
                            } else {
                                results.push({ status: 'failed', description: test.description, expected: JSON.stringify(test.expected), actual: JSON.stringify(actual) });
                            }
                        } catch(e) {
                             results.push({ status: 'failed', description: test.description, expected: JSON.stringify(test.expected), actual: 'Error: ' + e.message });
                        }
                    }
                } catch (e) {
                     results.push({ status: 'error', description: 'Failed to compile solution', error: e.message });
                }
                event.source.postMessage({ results }, event.origin);
            });
        </script>
    `;

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><BeakerIcon /><span className="ml-3">Adept Protocol: Live Combat Simulator</span></h1>
                <p className="text-text-secondary mt-1">Execute. Evolve. Conquer. Your solution is tested in real-time against an adversarial AI.</p>
            </header>

            <div className="flex w-full mb-4">
                <StageIndicator name="Stage 1: Inception" status={currentStage === 0 ? StageStatus.ACTIVE : currentStage > 0 ? StageStatus.PASSED : StageStatus.LOCKED} />
                <StageIndicator name="Stage 2: Mutation" status={currentStage === 1 ? StageStatus.ACTIVE : currentStage > 1 ? StageStatus.PASSED : StageStatus.LOCKED} />
                <StageIndicator name="Stage 3: Synthesis" status={currentStage === 2 ? StageStatus.ACTIVE : currentStage > 2 ? StageStatus.PASSED : StageStatus.LOCKED} />
            </div>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col gap-4">
                    <div className="bg-surface border rounded-lg p-4 flex-grow flex flex-col">
                        <h3 className="text-lg font-bold flex-shrink-0">Protocol Briefing</h3>
                        <div className="flex-grow overflow-y-auto mt-2 pr-2">
                             {isLoading ? <LoadingSpinner/> : <MarkdownRenderer content={protocol?.stages[currentStage]?.description || ''}/>}
                        </div>
                    </div>
                     <div className="bg-surface border rounded-lg p-4 flex-shrink-0">
                        <h3 className="text-lg font-bold">Real-time Test Results</h3>
                        <div className="mt-2 h-40 overflow-y-auto space-y-1">
                            {testResults.length > 0 ? testResults.map((r,i)=><TestResult key={i} result={r}/>) : <p className="text-sm text-text-secondary">Awaiting execution...</p>}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col h-full">
                    <iframe ref={sandboxRef} srcDoc={sandboxSrcDoc} style={{ display: 'none' }} title="Execution Sandbox"/>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium">Solution Code</label>
                        <button onClick={runTests} className="btn-primary flex items-center gap-2 px-4 py-1 text-sm"><PlayIcon /> Execute</button>
                    </div>
                    <div className="flex-grow border rounded-md bg-surface overflow-hidden">
                        <textarea
                            value={solutionCode}
                            onChange={(e) => setSolutionCode(e.target.value)}
                            onKeyUp={runTests} // Live re-running on every key press
                            spellCheck="false"
                            className="w-full h-full p-4 bg-transparent resize-none font-mono text-sm"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};