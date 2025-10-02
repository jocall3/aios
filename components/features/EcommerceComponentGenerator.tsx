// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback, useEffect, useReducer } from 'react';
import { generateEcommerceFunnel } from '../../services/ConversionFunnelAI'; // Invented AI Service
import { ArchiveBoxIcon, CurrencyDollarIcon } from '../icons';
import { LoadingSpinner, MarkdownRenderer } from '../shared';

// --- SELF-CONTAINED SIMULATION ENGINE ---
const funnelReducer = (state: any, action: any) => {
    switch (action.type) {
        case 'VISIT':
            return { ...state, views: state.views + 1 };
        case 'ADD_TO_CART':
            if (state.inventory > 0) return { ...state, carts: state.carts + 1, price: state.price * 1.01 }; // Price increases with demand
            return state;
        case 'PURCHASE':
            return { ...state, purchases: state.purchases + 1, carts: state.carts - 1, inventory: state.inventory - 1, revenue: state.revenue + state.price };
        case 'RESET':
            return { ...action.payload };
        default: return state;
    }
};

const LiveFunnelChart: React.FC<{ state: any }> = ({ state }) => {
    const max = state.views || 1;
    return <div className="space-y-2 text-xs font-mono">{Object.entries({Views:state.views, Carts:state.carts, Purchases:state.purchases}).map(([name, val]: [string, any]) => <div key={name}><p>{name}: {val}</p><div className="h-2 w-full bg-surface"><div className="h-2 bg-primary" style={{width: `${(val/max)*100}%`}}/></div></div>)}</div>
};


export const EcommerceComponentGenerator: React.FC = () => {
    const [description, setDescription] = useState('a high-end red sneaker');
    const [initialPrice, setInitialPrice] = useState(99);
    const [inventory, setInventory] = useState(100);
    const [generatedCode, setGeneratedCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [simState, dispatch] = useReducer(funnelReducer, { views:0, carts:0, purchases:0, price: initialPrice, revenue: 0, inventory });

    useEffect(() => { // The simulation loop
        const interval = setInterval(() => {
            const actionRoll = Math.random();
            if (actionRoll < 0.5) dispatch({type: 'VISIT'});
            else if (actionRoll < 0.8) dispatch({type: 'ADD_TO_CART'});
            else if (simState.carts > 0) dispatch({type: 'PURCHASE'});
        }, 500);
        return () => clearInterval(interval);
    }, [simState.carts]);

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const code = await generateEcommerceComponent(`${description} with dynamic scarcity and pricing indicators.`);
            setGeneratedCode(code);
            dispatch({ type: 'RESET', payload: { views:0, carts:0, purchases:0, price: initialPrice, revenue: 0, inventory } });
        } finally { setIsLoading(false); }
    };
    
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><ArchiveBoxIcon /><span className="ml-3">Dynamic Pricing & Conversion Funnel Forging Engine</span></h1>
                <p className="text-text-secondary mt-1">Forge and simulate revenue-optimized, psychologically-tuned e-commerce experiences.</p>
            </header>
            
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 min-h-0">
                 <div className="lg:col-span-2 flex flex-col gap-3">
                     <h3 className="text-xl font-bold">1. Product Ontology</h3>
                      <div className="bg-surface p-3 border rounded-lg space-y-3">
                        <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full h-16 p-2 bg-background border rounded"/>
                        <div className="grid grid-cols-2 gap-2">
                           <input type="number" value={initialPrice} onChange={e=>setInitialPrice(parseInt(e.target.value))} placeholder="Initial Price" className="w-full p-2 bg-background border"/>
                           <input type="number" value={inventory} onChange={e=>setInventory(parseInt(e.target.value))} placeholder="Inventory" className="w-full p-2 bg-background border"/>
                        </div>
                     </div>
                     <button onClick={handleGenerate} disabled={isLoading} className="btn-primary w-full py-2">{isLoading ? <LoadingSpinner/> : 'Forge & Launch Simulation'}</button>
                      <h3 className="text-xl font-bold mt-2">2. Live Simulation</h3>
                      <div className="bg-surface p-3 border rounded-lg">
                          <LiveFunnelChart state={simState} />
                          <p className="font-mono text-xs mt-2 pt-2 border-t">Simulated Revenue: <span className="font-bold text-green-400">${simState.revenue.toFixed(2)}</span></p>
                      </div>
                 </div>

                 <div className="lg:col-span-3 flex flex-col min-h-0">
                     <h3 className="text-xl font-bold mb-2">3. Forged Component Preview</h3>
                      <div className="flex-grow bg-white border rounded overflow-hidden relative">
                         <div className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-lg font-mono text-center">
                            <p className="text-2xl">${simState.price.toFixed(2)}</p>
                            <p className={`text-xs ${simState.inventory < 10 ? 'text-red-400 animate-pulse' : 'text-gray-300'}`}>
                                {simState.inventory} LEFT IN STOCK
                            </p>
                         </div>
                          {isLoading ? <div className="h-full w-full flex items-center justify-center"><LoadingSpinner/></div> :
                           generatedCode && <iframe srcDoc={`<script src="https://cdn.tailwindcss.com"></script><body class="bg-white">${generatedCode}</body>`} className="w-full h-full"/>
                          }
                      </div>
                 </div>
            </div>
        </div>
    );
};