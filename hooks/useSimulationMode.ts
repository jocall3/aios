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
