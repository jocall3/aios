// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import { useCallback } from 'react';
import { useGlobalState } from '../contexts/GlobalStateContext.tsx';

export const useSimulationMode = () => {
    const { state, dispatch } = useGlobalState();

    const toggleSimulationMode = useCallback(() => {
        dispatch({ type: 'TOGGLE_SIMULATION_MODE' });
    }, [dispatch]);

    return {
        isSimulationMode: state.isSimulationMode,
        toggleSimulationMode,
    };
};
