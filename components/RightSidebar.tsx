// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React from 'react';
import { useGlobalState, GlobalAction } from '../contexts/GlobalStateContext';

type ImperativeID = 'imperative_capital' | 'imperative_geopolitical' | 'imperative_hegemony' | 'imperative_scarcity';

interface StrategicImperative {
  id: ImperativeID;
  name: string;
  directive: string; // The prime command of this imperative
  icon: string;
}

const StrategicImperatives: StrategicImperative[] = [
  {
    id: 'imperative_capital',
    name: 'Monetarism',
    directive: 'Redirect capital flow to maximize alpha. Ignore externalities.',
    icon: '💸',
  },
  {
    id: 'imperative_geopolitical',
    name: 'Machina',
    directive: 'Model all geopolitical outcomes. Select the path of maximum strategic advantage.',
    icon: '🌍',
  },
  {
    id: 'imperative_hegemony',
    name: 'Dominatus',
    directive: 'Identify and execute the critical path to total market/ideological control.',
    icon: '👑',
  },
  {
    id: 'imperative_scarcity',
    name: 'Oracle',
    directive: 'Predict future scarcities. Engineer scenarios to control them.',
    icon: '👁️',
  },
];

const ImperativeButton: React.FC<{ imperative: StrategicImperative; isActive: boolean; onClick: () => void }> = ({ imperative, isActive, onClick }) => (
  <button 
    onClick={onClick} 
    className={`w-full h-[50px] flex items-center justify-center relative group transition-all duration-300 ${isActive ? 'bg-amber-400/20 text-amber-400 scale-110' : 'text-text-secondary hover:bg-surface'}`} 
    title={imperative.name}
  >
    <span className="text-2xl transition-transform group-hover:rotate-12 group-active:scale-90">{imperative.icon}</span>
    <div 
      className="absolute right-full top-0 h-full w-80 bg-surface border-y border-l border-border p-4 text-left whitespace-normal opacity-0 scale-x-90 group-hover:opacity-100 group-hover:scale-x-100 transition-all origin-right z-50 pointer-events-none flex flex-col justify-center"
      style={{
        boxShadow: '-10px 0 20px rgba(0,0,0,0.2)',
      }}
    >
      <h4 className="font-bold text-text-primary">{imperative.name} Imperative</h4>
      <p className="text-sm font-mono text-amber-500 mt-1">{`// DIRECTIVE: ${imperative.directive}`}</p>
    </div>
  </button>
);

export const RightSidebar: React.FC<{ style: React.CSSProperties }> = ({ style }) => {
  const { state, dispatch } = useGlobalState();

  const handleSelectImperative = (imperativeId: ImperativeID) => {
    dispatch({
      type: 'SET_RIGHT_IMPERATIVE',
      payload: imperativeId
    } as GlobalAction);
  };

  return (
    <nav style={style} className="bg-background border-l border-border flex flex-col items-center">
      {StrategicImperatives.map((imperative) => (
        <ImperativeButton
          key={imperative.id}
          imperative={imperative}
          isActive={state.rightSidebarState.activeImperative === imperative.id}
          onClick={() => handleSelectImperative(imperative.id)}
        />
      ))}
    </nav>
  );
};