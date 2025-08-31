import React from 'react';
import { useSimulationMode } from '../hooks/useSimulationMode.ts';

export const RealityToggle: React.FC = () => {
    const { isSimulationMode, toggleSimulationMode } = useSimulationMode();

    const handleToggle = () => {
        if (!isSimulationMode) {
            // When switching back to simulation, no confirmation is needed.
            toggleSimulationMode();
            return;
        }
        
        // When switching to live mode, show a confirmation dialog.
        if (window.confirm("WARNING: You are entering Live Mode. This will connect to real services and may incur costs or perform real actions. Are you sure you want to continue?")) {
            toggleSimulationMode();
        }
    };

    return (
        <button 
            onClick={handleToggle} 
            className="flex items-center space-x-2 cursor-pointer hover:text-primary transition-colors"
            title={isSimulationMode ? "Current mode: Simulation. Click to switch to Live Mode." : "Current mode: Live. Click to switch to Simulation Mode."}
        >
            <div className={`w-3 h-3 rounded-full transition-colors ${isSimulationMode ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
            <span className={isSimulationMode ? 'text-green-400' : 'text-red-400 font-bold'}>
                {isSimulationMode ? 'Simulation' : 'Live'}
            </span>
        </button>
    );
};
