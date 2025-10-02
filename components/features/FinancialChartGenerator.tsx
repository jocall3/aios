// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { synthesizeChartSchemaFromData, analyzeTimeSeriesForAnomalies } from '../../services/ChartingSingularityAI'; // Invented
import type { ChartSchema, TimeSeriesAnomaly } from '../../types/ChartingSingularity'; // Invented
import { ChartBarIcon } from '../icons';
import { LoadingSpinner } from '../shared';

// --- SELF-CONTAINED WEB WORKER ---
const DataVortexWorker = () => {
    let intervalId: any;
    self.onmessage = async (e) => {
        const { endpoint, interval } = e.data;
        if (intervalId) clearInterval(intervalId);

        const fetchData = async () => {
            try {
                const response = await fetch(endpoint);
                if (!response.ok) throw new Error(`API returned ${response.status}`);
                const data = await response.json();
                self.postMessage({ type: 'DATA_UPDATE', payload: data });
            } catch (error) {
                self.postMessage({ type: 'ERROR', payload: error instanceof Error ? error.message : 'Unknown worker error' });
            }
        };

        fetchData(); // Initial fetch
        intervalId = setInterval(fetchData, interval);
    };
};

// A helper to create the worker from the above function
const createWorker = () => {
    const code = DataVortexWorker.toString();
    const blob = new Blob([`(${code})()`]);
    return new Worker(URL.createObjectURL(blob));
};

export const FinancialChartGenerator: React.FC = () => {
    const [endpoint, setEndpoint] = useState('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1');
    const [schema, setSchema] = useState<ChartSchema | null>(null);
    const [liveData, setLiveData] = useState<any[]>([]);
    const [anomaly, setAnomaly] = useState<TimeSeriesAnomaly | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const workerRef = useRef<Worker | null>(null);

    const handleAssimilate = useCallback(async () => {
        setIsLoading(true);
        setSchema(null);
        setLiveData([]);
        setAnomaly(null);
        
        if (workerRef.current) workerRef.current.terminate();

        try {
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error(`Initial fetch failed: ${response.statusText}`);
            const initialData = await response.json();

            // AI synthesizes the chart configuration from the data shape
            const newSchema = await synthesizeChartSchemaFromData(initialData);
            setSchema(newSchema);

            // Spawn the data vortex worker
            const worker = createWorker();
            workerRef.current = worker;
            worker.onmessage = (e) => {
                if(e.data.type === 'DATA_UPDATE') {
                    const freshData = e.data.payload[newSchema.dataKey];
                    setLiveData(freshData.map((d: any) => ({ [newSchema.xAxisKey]: d[0], [newSchema.yAxisKey]: d[1] })));
                }
            };
            worker.postMessage({ endpoint, interval: 5000 }); // Poll every 5s

        } catch (err) { console.error(err); } 
        finally { setIsLoading(false); }
    }, [endpoint]);
    
    useEffect(() => {
        if(liveData.length > 10) {
             analyzeTimeSeriesForAnomalies(liveData, schema!).then(setAnomaly);
        }
    }, [liveData, schema]);
    
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><ChartBarIcon /><span className="ml-3">Real-Time Data-Vortex & Charting Singularity</span></h1>
                <p className="text-text-secondary mt-1">Assimilate any live data endpoint and manifest a self-constructing, intelligent charting daemon.</p>
            </header>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
                <div className="md:col-span-1 flex flex-col gap-3">
                    <h3 className="text-xl font-bold">Data Source Vector</h3>
                    <div className="bg-surface p-3 border rounded-lg">
                        <label className="text-sm font-medium">Live API or GraphQL Endpoint</label>
                        <input value={endpoint} onChange={e => setEndpoint(e.target.value)} className="w-full mt-1 p-2 bg-background border rounded font-mono text-xs"/>
                        <button onClick={handleAssimilate} disabled={isLoading} className="btn-primary w-full mt-2 py-2">
                           {isLoading ? <LoadingSpinner/> : 'Assimilate & Visualize'}
                        </button>
                    </div>
                     <div className="flex-grow bg-surface border rounded-lg p-3 min-h-[200px] flex flex-col">
                        <h3 className="text-xl font-bold mb-2">Synthesized Schema</h3>
                        {schema ? (
                             <pre className="text-xs font-mono bg-background p-2 rounded overflow-auto flex-grow">{JSON.stringify(schema, null, 2)}</pre>
                        ) : <p className="text-xs text-text-secondary">Awaiting assimilation...</p>}
                    </div>
                </div>
                 <div className="md:col-span-2 flex flex-col min-h-0 relative">
                     <h3 className="text-xl font-bold mb-2">Live Charting Manifold</h3>
                      <div className="flex-grow bg-surface border rounded-lg p-4">
                        {isLoading && <div className="h-full flex items-center justify-center"><LoadingSpinner/></div>}
                        {schema && liveData.length > 0 && (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={liveData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                    <XAxis dataKey={schema.xAxisKey} tickFormatter={(ts)=>new Date(ts).toLocaleTimeString()} stroke="var(--color-text-secondary)" style={{fontSize:'10px'}}/>
                                    <YAxis stroke="var(--color-text-secondary)" style={{fontSize:'10px'}}/>
                                    <Tooltip contentStyle={{backgroundColor:'var(--color-background)', border:'1px solid var(--color-border)'}}/>
                                    <Line type="monotone" dataKey={schema.yAxisKey} stroke="var(--color-primary)" strokeWidth={2} dot={false} isAnimationActive={false}/>
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                      </div>
                     {anomaly && (
                         <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-yellow-400/80 backdrop-blur-sm text-yellow-900 font-bold p-2 text-xs rounded-lg shadow-lg animate-pulse">
                            STRATEGIC INSIGHT: {anomaly.description}
                         </div>
                     )}
                 </div>

            </div>
        </div>
    );
};