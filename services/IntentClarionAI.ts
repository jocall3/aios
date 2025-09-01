
// Fix: Changed to type-only import and corrected path
import type { GlobalState } from '../contexts/GlobalStateContext';
import { FEATURE_TAXONOMY } from './taxonomyService';

type CommandId = string;

interface CommandSuggestion {
    commandId: CommandId;
    reasoning: string;
    score: number;
}

interface CommandHeuristic {
    (context: GlobalState, history: CommandId[]): CommandSuggestion[];
}

/**
 * The cognitive core of the predictive interface. This is a stateful singleton
 * that maintains a model of the user's current context and historical actions
 * to predict their next most likely intent.
 */
class IntentClarionEngine {
    private currentAppContext: GlobalState | null = null;
    private commandHistory: CommandId[] = [];
    private readonly MAX_HISTORY = 10;

    // A map defining logical follow-up actions.
    private readonly WORKFLOW_GRAPH: Record<CommandId, CommandId[]> = {
        'project-explorer': ['code-documentation-writer', 'visual-git-tree'],
        'visual-git-tree': ['ai-pull-request-assistant', 'changelog-generator'],
        'bug-reproducer': ['one-click-refactor', 'worker-thread-debugger'],
        'security-scanner': ['iam-policy-generator', 'redos-scanner'],
        'theme-designer': ['color-palette-generator', 'typography-lab', 'ad-copy-generator'],
        'api-client-generator': ['api-endpoint-tester', 'api-mock-generator'],
    };

    // A map defining problem -> solution relationships.
    private readonly PROBLEM_SOLUTION_MAP: Record<CommandId, CommandId[]> = {
        'tech-debt-sonar': ['one-click-refactor'],
        'performance-profiler': ['one-click-refactor'],
        'accessibility-auditor': ['accessibility-annotation'],
        'security-scanner': ['csp-generator'],
    };

    // The set of heuristic functions used for reasoning.
    private readonly heuristics: CommandHeuristic[] = [
        this.recencyHeuristic.bind(this),
        this.problemSolutionHeuristic.bind(this),
        this.categoryMomentumHeuristic.bind(this),
        this.sessionStartHeuristic.bind(this),
    ];

    /**
     * Ingests the latest state from the UI layer, allowing the engine
     * to remain context-aware.
     */
    public updateContext(state: GlobalState): void {
        if (this.currentAppContext?.activeView !== state.activeView) {
            this.commandHistory.push(state.activeView);
            if (this.commandHistory.length > this.MAX_HISTORY) {
                this.commandHistory.shift();
            }
        }
        this.currentAppContext = state;
    }

    /**
     * The core prediction logic. Aggregates scores from all heuristics.
     */
    public async getPredictiveCommands(): Promise<string[]> {
        if (!this.currentAppContext) {
            return ["Open Project Explorer", "Connect Workspace", "Design a Theme"];
        }

        const suggestionScores: Record<CommandId, { totalScore: number; reasons: string[] }> = {};

        for (const heuristic of this.heuristics) {
            const suggestions = heuristic(this.currentAppContext, this.commandHistory);
            for (const suggestion of suggestions) {
                if (!suggestionScores[suggestion.commandId]) {
                    suggestionScores[suggestion.commandId] = { totalScore: 0, reasons: [] };
                }
                suggestionScores[suggestion.commandId].totalScore += suggestion.score;
                suggestionScores[suggestion.commandId].reasons.push(suggestion.reasoning);
            }
        }

        // Exclude the current view from suggestions
        delete suggestionScores[this.currentAppContext.activeView];

        const sortedSuggestions = Object.entries(suggestionScores)
            .sort(([, a], [, b]) => b.totalScore - a.totalScore)
            .slice(0, 3)
            .map(([commandId]) => {
                const feature = FEATURE_TAXONOMY.find(f => f.id === commandId);
                return feature ? feature.name : commandId; // Return name for display
            });

        // Ensure we always return 3, even if logic fails.
        while (sortedSuggestions.length < 3) {
            const fallback = ["Generate Unit Tests", "Explore Snippet Vault", "Open Command Center"].find(
                cmd => !sortedSuggestions.includes(cmd)
            );
            if(fallback) sortedSuggestions.push(fallback);
            else break;
        }

        return sortedSuggestions;
    }

    // --- HEURISTIC IMPLEMENTATIONS ---

    private recencyHeuristic(context: GlobalState, history: CommandId[]): CommandSuggestion[] {
        const lastCommand = history[history.length - 1];
        if (!lastCommand || !this.WORKFLOW_GRAPH[lastCommand]) return [];

        return this.WORKFLOW_GRAPH[lastCommand].map(followUp => ({
            commandId: followUp,
            score: 100,
            reasoning: `High relevancy based on previous action (${context.activeView}).`
        }));
    }

    private problemSolutionHeuristic(context: GlobalState, history: CommandId[]): CommandSuggestion[] {
        const lastCommand = history[history.length - 1];
        if (!lastCommand || !this.PROBLEM_SOLUTION_MAP[lastCommand]) return [];
        
        return this.PROBLEM_SOLUTION_MAP[lastCommand].map(solution => ({
            commandId: solution,
            score: 80,
            reasoning: `Presents a solution to the problem identified by the previous tool.`
        }));
    }

    private categoryMomentumHeuristic(context: GlobalState, history: CommandId[]): CommandSuggestion[] {
        const lastCommand = history[history.length - 1];
        if (!lastCommand) return [];
        
        const lastFeature = FEATURE_TAXONOMY.find(f => f.id === lastCommand);
        if (!lastFeature) return [];

        const suggestions: CommandSuggestion[] = [];
        FEATURE_TAXONOMY.forEach(feature => {
            if (feature.category === lastFeature.category && feature.id !== lastCommand) {
                suggestions.push({
                    commandId: feature.id,
                    score: 40,
                    reasoning: `Maintains momentum within the '${lastFeature.category}' category.`
                });
            }
        });
        return suggestions;
    }
    
    private sessionStartHeuristic(context: GlobalState, history: CommandId[]): CommandSuggestion[] {
        if (history.length > 1) return []; // Only applies at the very start
        return [
            { commandId: 'project-explorer', score: 60, reasoning: 'Common starting action.'},
            { commandId: 'workspace-connector-hub', score: 50, reasoning: 'Common starting action.'}
        ];
    }
}

// Export a singleton instance to maintain state across the application lifecycle.
// Fix: Export IntentClarionCore
export const IntentClarionCore = new IntentClarionEngine();

// Exported functions that interact with the core singleton.
export const getPredictiveCommands = (): Promise<string[]> => {
    return IntentClarionCore.getPredictiveCommands();
};

export const updateClarionContext = (state: GlobalState): void => {
    IntentClarionCore.updateContext(state);
};