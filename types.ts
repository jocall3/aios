// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import type React from 'react';
import { CHROME_VIEW_IDS } from './constants.tsx';

// ===================================================================================
// ==                                                                               ==
// ==                         SECTION I: ORIGINAL BLUEPRINT                         ==
// ==                The Foundational Types as Provided. Unaltered.                 ==
// ==                                                                               ==
// ===================================================================================

export type ChromeViewType = typeof CHROME_VIEW_IDS[number];
export type FeatureId = string;

export const FEATURE_CATEGORIES = [
    'Global Economic Operating System',
    'Computational Compassion at Scale',
    'The Meta-Creation Platform',
    'The Governance Layer',
    'Substrate Primitives',
    'Cognitive Augments',
    'Ontological Forges',
    'Core', 'Workflow', 'AI Tools', 'Testing', 'Git', 'Deployment', 'Data',
    'Local Dev', 'Performance & Auditing', 'Deployment & CI/CD', 'Security',
    'Productivity', 'Cloud', 'Custom'
] as const;

export type FeatureCategory = typeof FEATURE_CATEGORIES[number];

export interface Feature {
  id: FeatureId;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: FeatureCategory;
  component: React.FC<any>;
  aiConfig?: {
    model: string;
    systemInstruction?: string;
  };
}

export type ViewType = FeatureId | ChromeViewType;

export interface GeneratedFile {
  filePath: string;
  content: string;
  description: string;
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  view: ViewType;
  props?: any;
  action?: () => void;
}

export interface StructuredPrSummary {
    title: string;
    summary: string;
    changes: string[];
}

export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  // Fix: Add 'archon' to make it compatible with ExtendedAppUser
  tier: 'free' | 'pro' | 'archon';
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  email: string | null;
}

export interface FileNode {
  name: string;
  // Fix: Add new types to allow extension by NoeticLink and CausalityTrace
  type: 'file' | 'folder' | 'noetic-link' | 'causality-trace';
  path: string;
  content?: string;
  children?: FileNode[];
}

export type Theme = 'light' | 'dark';

export interface StructuredExplanation {
    summary: string;
    lineByLine: { lines: string; explanation: string }[];
    complexity: { time: string; space: string };
    suggestions: string[];
}

export interface ColorTheme {
    primary: string;
    background: string;
    surface: string;
    textPrimary: string;
    textSecondary: string;
    textOnPrimary: string;
    border: string;
}

export interface ThemeState {
    mode: Theme;
    customColors: ColorTheme | null;
}

export interface SemanticColorTheme {
    mode: 'light' | 'dark';
    palette: {
        primary: { value: string; name: string; };
        secondary: { value: string; name: string; };
        accent: { value: string; name: string; };
        neutral: { value: string; name: string; };
    };
    theme: {
        background: { value: string; name: string; };
        surface: { value: string; name: string; };
        textPrimary: { value: string; name: string; };
        textSecondary: { value: string; name: string; };
        textOnPrimary: { value: string; name: string; };
        border: { value: string; name: string; };
    };
    accessibility: {
        primaryOnSurface: { ratio: number; score: string; };
        textPrimaryOnSurface: { ratio: number; score:string; };
        textSecondaryOnSurface: { ratio: number; score: string; };
        textOnPrimaryOnPrimary: { ratio: number; score: string; };
    };
}

export interface SlideSummary {
    title: string;
    body: string;
}

export interface Repo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
}

export interface StructuredReviewSuggestion {
    suggestion: string;
    codeBlock: string;
    explanation: string;
}

export interface StructuredReview {
    summary: string;
    suggestions: StructuredReviewSuggestion[];
}

export interface SystemPrompt {
  id: string;
  name: string;
  persona: string;
  rules: string[];
  outputFormat: 'json' | 'markdown' | 'text';
  exampleIO: { input: string; output: string }[];
}

export interface EncryptedData {
    id: string;
    ciphertext: ArrayBuffer;
    iv: Uint8Array;
}

export interface SecurityVulnerability {
    vulnerability: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
    description: string;
    mitigation: string;
    exploitSuggestion?: string;
}

export interface CodeSmell {
    smell: string;
    line: number;
    explanation: string;
}

export interface CustomFeature {
    id: string;
    name: string;
    description: string;
    icon: string;
    code: string;
}


// ===================================================================================
// ==                                                                               ==
// ==                     SECTION II: REALITY ENGINE ADDENDUM                       ==
// ==     Core Metaphysical Constructs and Ontological Expansion Definitions        ==
// ==                                                                               ==
// ===================================================================================

/**
 * ## CORE ONTOLOGICAL TYPES
 * High-level constructs defining the nature of existence within the engine.
 */

// A high-dimensional vector representing a unique abstract concept. This is the DNA of ideas.
// [time, space, abstraction, emotional_resonance, memetic_fitness, causality_index, entropy, ... up to 1024 dimensions]
export type NoeticVector = Float64Array;
// Fix: Removed space in template literal type
export type CognitiveSignature = `sig_cognitron::${string}`;
export type ChrononTimestamp = bigint;

export type RealityStratumID = 'STRATUM_BASELINE'     // 0. Physical reality
                           | 'STRATUM_SIMULACRUM'    // 1. Digital twin
                           | 'STRATUM_NEXUS_VOID'    // 2. Pure potentiality
                           | 'STRATUM_PALIMPSEST'    // 3. Historical/alternate timelines
                           | 'STRATUM_DREAMSCAPE'    // 4. Subconscious-generated realities
                           | 'STRATUM_LOGICORE';     // 5. A reality where laws of physics are replaced by pure logic.

export enum SystemEntropyState {
    COHERENT,
    FLUCTUATING,
    DIVERGENT,
    FRACTURED,
    TRANSCENDENT,
    CASCADING_COLLAPSE
}

export type CognitiveResourceCost = {
    volition: number;      // User's focus cost
    computation: number;   // Raw GFLOPs
    mnemonic: number;      // State memory (petabytes)
    chronon: number;       // Temporal energy cost
    noetic: number;        // Energy from the void of ideas
    ethos: number;         // Cost against the Guardian AI's ethical framework
};

/**
 * ## INTENT AND ACTION FRAMEWORK
 * Defines how user desires are translated into engine operations.
 */

export enum IntentState {
    SUPERPOSITION = 'SUPERPOSITION',
    COLLAPSING = 'COLLAPSING',
    COLLAPSED = 'COLLAPSED',
    ABORTED = 'ABORTED',
    PARADOXICAL = 'PARADOXICAL'
}

export interface Intent<T> {
    readonly intentId: symbol;
    readonly sourceSignature: CognitiveSignature;
    readonly targetFeature: FeatureId;
    readonly state: IntentState;
    readonly potentialAction: T; // The primary user desire
    readonly probability: number; // 0.0 to 1.0 confidence score
    readonly potentialParadoxes: ParadoxDescriptor[]; // Identified potential causality violations
}

export type Action<P, R> = {
    readonly actionId: `act_${string}`;
    // Fix: Replaced Zod.Schema with any to resolve missing namespace
    readonly payloadSchema: any; // Compile-time validation of inputs
    readonly returnSchema: any;  // Compile-time validation of outputs
    readonly execute: (payload: P) => Promise<R>;
    readonly calculateCost: (payload: P) => CognitiveResourceCost;
};

export type ParadoxDescriptor = {
    paradoxType: 'ONTOLOGICAL' | 'TEMPORAL' | 'CAUSAL_LOOP';
    description: string;
    conflictingIntents: [symbol, symbol];
    resolutionStrategy: 'DISCARD_LEAST_PROBABLE' | 'MERGE_INTENTS' | 'REQUIRE_ARCHON_OVERRIDE';
};


/**
 * ## USER & ARCHON HIERARCHY
 * An expansion of the user model to include engine-specific metaphysics.
 */
export interface ExtendedAppUser extends AppUser {
    tier: 'free' | 'pro' | 'archon';
    cognitiveSignature: CognitiveSignature;
    maxVolition: number;
    currentEntropyFactor: number; // User's influence on system stability
    accessableStrata: RealityStratumID[];
    noeticAffinity: number; // 0.0 to 1.0 affinity with conceptual energy
    guardianEthosAlignment: number; // How closely the user's actions align with the Guardian AI
}

/**
 * ## THEME ENGINE v2: PSYCHO-EMOTIONAL RESONANCE
 * Dynamically generated UI themes designed to evoke specific mental states.
 */
export type PsychoEmotionalTarget = 'CALM_FOCUS' | 'INHIBITED_CREATIVITY' | 'AGGRESSIVE_EXECUTION' | 'DREAMLIKE_EXPLORATION' | 'ABSOLUTE_SECURITY';
export type ChromaticResonance = `hsla(${number}, ${number}%, ${number}%, ${number})` | string;
export type SonicResonance = { frequency: number, waveform: 'SINE' | 'SQUARE' | 'SAWTOOTH', amplitude: number };
// Fix: Corrected HapticPattern to use a string for the template literal
export type HapticPattern = `pattern(${string})`;

export interface PsychometricTheme {
    targetState: PsychoEmotionalTarget;
    // Fix: Add mode property for useTheme hook compatibility
    mode: 'light' | 'dark';
    visuals: {
        // Fix: Relaxed types to string for broader compatibility
        primary: string;
        background: string;
        surface: string;
        textPrimary: string;
        textSecondary: string;
        textOnPrimary: string;
        border: string;
    };
    audio: {
        backgroundDrone: SonicResonance;
        notificationChime: SonicResonance;
    };
    haptics: { // For neural-interfaced users
        idlePattern: HapticPattern;
        confirmationPattern: HapticPattern;
    };
}


/**
 * ## NOETIC FILE SYSTEM (NFS)
 * An evolution of the standard file system, where files can be raw concepts.
 */
export type FileContentType = string | ArrayBuffer | NoeticVector;

export interface NoeticLink extends FileNode {
    type: 'noetic-link';
    targetVector: NoeticVector; // A direct pointer to an idea.
    content: undefined; // Links have no content, only a target.
    linkStrength: number; // How strongly this link is established
}

export interface CausalityTrace extends FileNode {
    type: 'causality-trace';
    content: string; // Human-readable log of events
    eventChain: Action<any, any>[]; // The actual chain of executed actions
    startChronon: ChrononTimestamp;
    endChronon: ChrononTimestamp;
    resultantEntropy: number;
}

export type GraphNode = FileNode | NoeticLink | CausalityTrace;

// Fix: Add missing VaultAccessLog interface.
export interface VaultAccessLog {
    id?: string; // Optional because it's auto-incremented in DB
    timestamp: ChrononTimestamp;
    credentialId: string;
    requestingFeature: FeatureId;
    proof: string;
}

/**
 * ## QUANTUM VAULT
 * Evolution of the encryption model for Archon-tier users.
 */
export interface QuantumEncryptedData extends EncryptedData {
    entanglementId: symbol; // ID shared with the quantum session key
    measurementBasisVector: Uint8Array; // "IV" used to collapse the quantum state for decryption
    decoherenceTimestamp?: ChrononTimestamp; // Optional timestamp after which the data is unreadable
}

/**
 * ## QUANTUM FEATURE & MANIFOLD
 * An evolution of the core Feature definition.
 */
export interface QuantumFeature extends Feature {
    operationalStratum: RealityStratumID; // The reality layer this feature operates in
    supportedIntents: Map<string, (payload: any) => Intent<any>>; // Maps text commands to intent structures
    calculateCognitiveLoad: (props: any) => CognitiveResourceCost; // Live cost calculation
    onOntologicalShift: (newStratum: RealityStratumID, oldStratum: RealityStratumID) => Promise<void>; // Hook for reality changes
    requiredEthosLevel: number; // Minimum Guardian AI alignment to operate
}

export interface RenderManifold {
    windowId: `manifold_${string}`;
    feature: QuantumFeature;
    viewState: ManifoldViewState;
}

export interface ManifoldViewState {
    // Fix: Add id to support desktop components
    id: string;
    props?: any; // Fix: Add props to support feature props
    position: { x: number; y: number };
    size: { width: number; height: number };
    zIndex: number;
    isMinimized: boolean;
    isMaximized: boolean;
    temporalOffset: number; // ms difference from current baseline time
    cognitiveLoadFactor: number;
    isQuantumEntangledWith?: `manifold_${string}` | null;
    currentEntropyState: SystemEntropyState;
}

// Fix: Add missing SQLTransactionPlan interface.
export interface SQLTransactionPlan {
    generatedSql: string;
    riskAnalysis: string;
    riskHash: string;
    estimatedExecutionMs: number;
}


// ===================================================================================
// ==                  END OF REALITY ENGINE ONTOLOGICAL ADDENDUM                   ==
// ===================================================================================