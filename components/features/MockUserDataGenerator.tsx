// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback, useMemo } from 'react';
import { synthesizeDataCohort } from '../../services/CohortSynthesisAI'; // Invented AI Service
import { useNotification } from '../../contexts/NotificationContext';
import { DocumentTextIcon, SparklesIcon, UserGroupIcon, PlusIcon } from '../icons';
import { LoadingSpinner, MarkdownRenderer } from '../shared';

// --- SELF CONTAINED COMPONENTS ---
const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

const SchemaField: React.FC<{field:any, onUpdate: any, onDelete: any}> = ({ field, onUpdate, onDelete }) => (
    <div className="grid grid-cols-[1fr,1fr,auto] gap-2 items-center text-xs">
        <input value={field.name} onChange={e=> onUpdate({name: e.target.value})} placeholder="Field Name" className="p-1 bg-background border"/>
        <select value={field.type} onChange={e=> onUpdate({type: e.target.value})} className="p-1 bg-background border">
            <option>uuid</option><option>personName</option><option>email</option><option>countryCode</option><option>isoTimestamp</option><option>randomFloat</option>
        </select>
        <button onClick={onDelete} className="text-red-500">X</button>
    </div>
);


export const MockUserDataGenerator: React.FC = () => {
    const [schema, setSchema] = useState([{id: 1, name: 'id', type:'uuid'}, {id:2, name:'name', type:'personName'}, {id:3, name:'email', type:'email'}]);
    const [cohortSize, setCohortSize] = useState(100);
    const [synthesizeProfile, setSynthesizeProfile] = useState(true);
    const [generatedData, setGeneratedData] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { addNotification } = useNotification();

    const addField = () => setSchema(s => [...s, {id:Date.now(), name:'', type: 'randomFloat'}]);
    const updateField = (id: number, updates: any) => setSchema(s => s.map(f => f.id === id ? {...f, ...updates} : f));
    const deleteField = (id: number) => setSchema(s => s.filter(f => f.id !== id));
    
    const handleForge = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await synthesizeDataCohort({schema, cohortSize, synthesizeProfile});
            setGeneratedData(JSON.stringify(result, null, 2));
            addNotification(`${cohortSize} synthetic entities forged.`, 'success');
        } catch(e) {
            addNotification('Cohort forging failed.', 'error');
        } finally { setIsLoading(false); }
    }, [schema, cohortSize, synthesizeProfile, addNotification]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><UserGroupIcon /><span className="ml-3">Synthetic Data Cohort & Behavioral Profile Forge</span></h1>
                <p className="text-text-secondary mt-1">Forge statistically significant cohorts of synthetic entities with predictable behavioral profiles.</p>
            </header>
            
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 min-h-0">
                 <div className="lg:col-span-2 flex flex-col gap-3 min-h-0">
                     <h3 className="text-xl font-bold">1. Ontological Schema Builder</h3>
                     <div className="flex-grow bg-surface border rounded p-2 overflow-y-auto space-y-2">
                        {schema.map(f => <SchemaField key={f.id} field={f} onUpdate={u => updateField(f.id,u)} onDelete={()=>deleteField(f.id)}/>)}
                         <button onClick={addField} className="w-full text-sm mt-1 p-1 bg-background border rounded hover:border-primary hover:text-primary"><PlusIcon/></button>
                     </div>
                      <div className="p-3 bg-surface border rounded-lg">
                        <h3 className="text-xl font-bold">2. Synthesis Configuration</h3>
                         <div className="grid grid-cols-2 gap-3 mt-2">
                            <div><label className="text-sm">Cohort Size</label><input type="number" value={cohortSize} onChange={e=>setCohortSize(parseInt(e.target.value))} className="w-full mt-1 p-2 bg-background border"/></div>
                            <div><label className="text-sm flex items-center justify-between">Behavioral Profile <input type="checkbox" checked={synthesizeProfile} onChange={e=>setSynthesizeProfile(e.target.checked)}/></label></div>
                         </div>
                      </div>
                     <button onClick={handleForge} disabled={isLoading} className="btn-primary w-full py-3">{isLoading ? <LoadingSpinner/> : 'Forge Cohort'}</button>
                 </div>

                <div className="lg:col-span-3 flex flex-col min-h-0">
                     <h3 className="text-xl font-bold">3. Forged Data Manifest</h3>
                     <div className="flex-grow mt-3 bg-background border rounded-lg overflow-hidden">
                        <textarea value={generatedData} readOnly className="w-full h-full p-2 font-mono text-xs bg-transparent"/>
                    </div>
                </div>

            </div>
        </div>
    );
};