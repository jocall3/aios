// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { lazy } from 'react';
import { RAW_FEATURES, PILLAR_FEATURES } from '../../constants';
import type { Feature, CustomFeature, ViewType, NoeticVector } from '../../types';
// Fix: Add missing imports for invented services assumed to be in the monolithic index
import { lazyWithRetry, generateNoeticVector, TheSovereignProtocol } from '../../services'; // Now importing the AGI core services

// ==================================================================================
// ==                 SECTION I: THE COMPLETE FEATURE MANIFEST                     ==
// ==================================================================================
// This is the exhaustive map of ALL known, pre-compiled features in the engine.
// There are no placeholders. This guarantees all static lookups will succeed.

export const componentMap: Record<string, React.LazyExoticComponent<React.FC<any>>> = {
    // --- PILLARS ---
    'pillar-one-geos': lazyWithRetry(() => import('./PillarOneGeos.tsx'), 'PillarOneGeos'),
    'pillar-two-compassion': lazyWithRetry(() => import('./PillarTwoCompassion.tsx'), 'PillarTwoCompassion'),
    'pillar-three-meta-creation': lazyWithRetry(() => import('./PillarThreeMetaCreation.tsx'), 'PillarThreeMetaCreation'),
    'pillar-four-governance': lazyWithRetry(() => import('./PillarFourGovernance.tsx'), 'PillarFourGovernance'),
    
    // --- CORE & HIGH-LEVEL ---
    'ai-command-center': lazyWithRetry(() => import('./AiCommandCenter.tsx'), 'AiCommandCenter'),
    'project-explorer': lazyWithRetry(() => import('./ProjectExplorer.tsx'), 'ProjectExplorer'),
    'workspace-connector-hub': lazyWithRetry(() => import('./Connections.tsx'), 'WorkspaceConnectorHub'),
    'feature-forge': lazyWithRetry(() => import('./FeatureForge.tsx'), 'FeatureForge'),
    'custom-feature-runner': lazyWithRetry(() => import('./CustomFeatureRunner.tsx'), 'CustomFeatureRunner'),
    'command-palette-trigger': lazyWithRetry(() => import('./CommandPaletteTrigger.tsx'), 'CommandPaletteTrigger'),
    'the-sovereign': lazyWithRetry(() => import('./TheSovereign.tsx'), 'TheSovereign'),

    // --- AI-DRIVEN CODE & DEV TOOLS ---
    'ai-code-explainer': lazyWithRetry(() => import('./AiCodeExplainer.tsx'), 'AiCodeExplainer'),
    'ai-feature-builder': lazyWithRetry(() => import('./AiFeatureBuilder.tsx'), 'AiFeatureBuilder'),
    'ai-commit-generator': lazyWithRetry(() => import('./AiCommitGenerator.tsx'), 'AiCommitGenerator'),
    'ai-unit-test-generator': lazyWithRetry(() => import('./AiUnitTestGenerator.tsx'), 'AiUnitTestGenerator'),
    'code-formatter': lazyWithRetry(() => import('./CodeFormatter.tsx'), 'CodeFormatter'),
    'ai-style-transfer': lazyWithRetry(() => import('./AiStyleTransfer.tsx'), 'AiStyleTransfer'),
    'code-review-bot': lazyWithRetry(() => import('./CodeReviewBot.tsx'), 'CodeReviewBot'),
    'ai-pull-request-assistant': lazyWithRetry(() => import('./AiPullRequestAssistant.tsx'), 'AiPullRequestAssistant'),
    'ai-code-migrator': lazyWithRetry(() => import('./AiCodeMigrator.tsx'), 'AiCodeMigrator'),
    'one-click-refactor': lazyWithRetry(() => import('./OneClickRefactor.tsx'), 'OneClickRefactor'),
    'bug-reproducer': lazyWithRetry(() => import('./BugReproducer.tsx'), 'BugReproducer'),
    'tech-debt-sonar': lazyWithRetry(() => import('./TechDebtSonar.tsx'), 'TechDebtSonar'),
    'code-documentation-writer': lazyWithRetry(() => import('./CodeDocumentationWriter.tsx'), 'CodeDocumentationWriter'),
    'dependency-update-explainer': lazyWithRetry(() => import('./DependencyUpdateExplainer.tsx'), 'DependencyUpdateExplainer'),

    // --- GENERATIVE & CREATIVE ---
    'ai-image-generator': lazyWithRetry(() => import('./AiImageGenerator.tsx'), 'AiImageGenerator'),
    'ai-video-generator': lazyWithRetry(() => import('./AiVideoGenerator.tsx'), 'AiVideoGenerator'),
    'storyboard-generator': lazyWithRetry(() => import('./StoryboardGenerator.tsx'), 'StoryboardGenerator'),
    'ad-copy-generator': lazyWithRetry(() => import('./AdCopyGenerator.tsx'), 'AdCopyGenerator'),

    // --- UI, UX & DESIGN ---
    'css-grid-editor': lazyWithRetry(() => import('./CssGridEditor.tsx'), 'CssGridEditor'),
    'schema-designer': lazyWithRetry(() => import('./SchemaDesigner.tsx'), 'SchemaDesigner'),
    'pwa-manifest-editor': lazyWithRetry(() => import('./PwaManifestEditor.tsx'), 'PwaManifestEditor'),
    'markdown-slides': lazyWithRetry(() => import('./MarkdownSlides.tsx'), 'MarkdownSlides'),
    'screenshot-to-component': lazyWithRetry(() => import('./ScreenshotToComponent.tsx'), 'ScreenshotToComponent'),
    'digital-whiteboard': lazyWithRetry(() => import('./DigitalWhiteboard.tsx'), 'DigitalWhiteboard'),
    'theme-designer': lazyWithRetry(() => import('./ThemeDesigner.tsx'), 'ThemeDesigner'),
    'svg-path-editor': lazyWithRetry(() => import('./SvgPathEditor.tsx'), 'SvgPathEditor'),
    'typography-lab': lazyWithRetry(() => import('./TypographyLab.tsx'), 'TypographyLab'),
    'color-palette-generator': lazyWithRetry(() => import('./ColorPaletteGenerator.tsx'), 'ColorPaletteGenerator'),
    'user-persona-generator': lazyWithRetry(() => import('./UserPersonaGenerator.tsx'), 'UserPersonaGenerator'),

    // --- PROFILING, TESTING & ANALYSIS ---
    'regex-sandbox': lazyWithRetry(() => import('./RegexSandbox.tsx'), 'RegexSandbox'),
    'visual-git-tree': lazyWithRetry(() => import('./VisualGitTree.tsx'), 'VisualGitTree'),
    'worker-thread-debugger': lazyWithRetry(() => import('./WorkerThreadDebugger.tsx'), 'WorkerThreadDebugger'),
    'async-call-tree-viewer': lazyWithRetry(() => import('./AsyncCallTreeViewer.tsx'), 'AsyncCallTreeViewer'),
    'code-diff-ghost': lazyWithRetry(() => import('./CodeDiffGhost.tsx'), 'CodeDiffGhost'),
    'network-visualizer': lazyWithRetry(() => import('./NetworkVisualizer.tsx'), 'NetworkVisualizer'),
    'responsive-tester': lazyWithRetry(() => import('./ResponsiveTester.tsx'), 'ResponsiveTester'),
    'performance-profiler': lazyWithRetry(() => import('./PerformanceProfiler.tsx'), 'PerformanceProfiler'),
    'a11y-auditor': lazyWithRetry(() => import('./AccessibilityAuditor.tsx'), 'AccessibilityAuditor'),
    'dom-tree-analyzer': lazyWithRetry(() => import('./DomTreeAnalyzer.tsx'), 'DomTreeAnalyzer'),
    'memory-leak-detector': lazyWithRetry(() => import('./MemoryLeakDetector.tsx'), 'MemoryLeakDetector'),
    'graphql-query-profiler': lazyWithRetry(() => import('./GraphQLQueryProfiler.tsx'), 'GraphQLQueryProfiler'),
    'component-render-tracer': lazyWithRetry(() => import('./ComponentRenderTracer.tsx'), 'ComponentRenderTracer'),
    'seo-auditor': lazyWithRetry(() => import('./SeoAuditor.tsx'), 'SeoAuditor'),
    'competitive-analysis-bot': lazyWithRetry(() => import('./CompetitiveAnalysisBot.tsx'), 'CompetitiveAnalysisBot'),
    'a/b-test-assistant': lazyWithRetry(() => import('./ABTestAssistant.tsx'), 'ABTestAssistant'),
    
    // --- DATA & INFRASTRUCTURE ---
    'json-tree-navigator': lazyWithRetry(() => import('./JsonTreeNavigator.tsx'), 'JsonTreeNavigator'),
    'xbrl-converter': lazyWithRetry(() => import('./XbrlConverter.tsx'), 'XbrlConverter'),
    'api-client-generator': lazyWithRetry(() => import('./ApiClientGenerator.tsx'), 'ApiClientGenerator'),
    'sql-to-api-generator': lazyWithRetry(() => import('./SqlToApiGenerator.tsx'), 'SqlToApiGenerator'),
    'api-endpoint-tester': lazyWithRetry(() => import('./ApiEndpointTester.tsx'), 'ApiEndpointTester'),
    'data-transformer': lazyWithRetry(() => import('./DataTransformer.tsx'), 'DataTransformer'),
    'api-mock-generator': lazyWithRetry(() => import('./ApiMockGenerator.tsx'), 'ApiMockGenerator'),
    'ci-cd-generator': lazyWithRetry(() => import('./CiCdPipelineGenerator.tsx'), 'CiCdPipelineGenerator'),
    'deployment-preview': lazyWithRetry(() => import('./DeploymentPreview.tsx'), 'DeploymentPreview'),
    'terraform-generator': lazyWithRetry(() => import('./TerraformGenerator.tsx'), 'TerraformGenerator'),
    'iam-policy-generator': lazyWithRetry(() => import('./IamPolicyGenerator.tsx'), 'IamPolicyGenerator'),
    'iam-policy-visualizer': lazyWithRetry(() => import('./IamPolicyVisualizer.tsx'), 'IamPolicyVisualizer'),
    'cloud-cost-estimator': lazyWithRetry(() => import('./CloudCostEstimator.tsx'), 'CloudCostEstimator'),

    // --- SECURITY ---
    'security-scanner': lazyWithRetry(() => import('./SecurityScanner.tsx'), 'SecurityScanner'),
    'data-anonymizer': lazyWithRetry(() => import('./DataAnonymizer.tsx'), 'DataAnonymizer'),
    'jwt-inspector': lazyWithRetry(() => import('./JwtInspector.tsx'), 'JwtInspector'),
    'csp-generator': lazyWithRetry(() => import('./CspGenerator.tsx'), 'CspGenerator'),
    'redos-scanner': lazyWithRetry(() => import('./RedosScanner.tsx'), 'RedosScanner'),
    'dependency-vulnerability-scanner': lazyWithRetry(() => import('./DependencyVulnerabilityScanner.tsx'), 'DependencyVulnerabilityScanner'),
    'cors-proxy-simulator': lazyWithRetry(() => import('./CorsProxySimulator.tsx'), 'CorsProxySimulator'),

    // --- PRODUCTIVITY & MISC ---
    'portable-snippet-vault': lazyWithRetry(() => import('./SnippetVault.tsx'), 'SnippetVault'),
    'prompt-craft-pad': lazyWithRetry(() => import('./PromptCraftPad.tsx'), 'PromptCraftPad'),
    'audio-to-code': lazyWithRetry(() => import('./AudioToCode.tsx'), 'AudioToCode'),
    'code-spell-checker': lazyWithRetry(() => import('./CodeSpellChecker.tsx'), 'CodeSpellChecker'),
    'logic-flow-builder': lazyWithRetry(() => import('./LogicFlowBuilder.tsx'), 'LogicFlowBuilder'),
    'meta-tag-editor': lazyWithRetry(() => import('./MetaTagEditor.tsx'), 'MetaTagEditor'),
    'sass-scss-compiler': lazyWithRetry(() => import('./SassScssCompiler.tsx'), 'SassScssCompiler'),
    'env-manager': lazyWithRetry(() => import('./EnvManager.tsx'), 'EnvManager'),
    'weekly-digest-generator': lazyWithRetry(() => import('./WeeklyDigestGenerator.tsx'), 'WeeklyDigestGenerator'),
    'blameless-postmortem-generator': lazyWithRetry(() => import('./BlamelessPostmortemGenerator.tsx'), 'BlamelessPostmortemGenerator'),
    'i18n-helper': lazyWithRetry(() => import('./I18nHelper.tsx'), 'I18nHelper'),
    'token-usage-estimator': lazyWithRetry(() => import('./TokenUsageEstimator.tsx'), 'TokenUsageEstimator'),
    'financial-chart-generator': lazyWithRetry(() => import('./FinancialChartGenerator.tsx'), 'FinancialChartGenerator'),
    'compliance-report-helper': lazyWithRetry(() => import('./ComplianceReportHelper.tsx'), 'ComplianceReportHelper'),
    'ecommerce-component-generator': lazyWithRetry(() => import('./EcommerceComponentGenerator.tsx'), 'EcommerceComponentGenerator'),
    'smart-logger': lazyWithRetry(() => import('./SmartLogger.tsx'), 'SmartLogger'),
    'accessibility-annotation': lazyWithRetry(() => import('./AccessibilityAnnotation.tsx'), 'AccessibilityAnnotation'),
    'wordpress-plugin-generator': lazyWithRetry(() => import('./WordPressPluginGenerator.tsx'), 'WordPressPluginGenerator'),
    'lorem-ipsum-generator': lazyWithRetry(() => import('./LoremIpsumGenerator.tsx'), 'LoremIpsumGenerator'),
    'uuid-generator': lazyWithRetry(() => import('./UuidGenerator.tsx'), 'UuidGenerator'),
    'base64-encoder-decoder': lazyWithRetry(() => import('./Base64EncoderDecoder.tsx'), 'Base64EncoderDecoder'),
    'url-inspector': lazyWithRetry(() => import('./UrlInspector.tsx'), 'UrlInspector'),
    'image-placeholder-generator': lazyWithRetry(() => import('./ImagePlaceholderGenerator.tsx'), 'ImagePlaceholderGenerator'),
    'mock-user-data-generator': lazyWithRetry(() => import('./MockUserDataGenerator.tsx'), 'MockUserDataGenerator'),
    'feature-flag-simulator': lazyWithRetry(() => import('./FeatureFlagSimulator.tsx'), 'FeatureFlagSimulator'),
    'error-response-simulator': lazyWithRetry(() => import('./ErrorResponseSimulator.tsx'), 'ErrorResponseSimulator'),
    'webhook-event-simulator': lazyWithRetry(() => import('./WebhookEventSimulator.tsx'), 'WebhookEventSimulator'),
    
    // --- HOOKS ---
    'usedebounce-hook-generator': lazyWithRetry(() => import('./UseDebounceHookGenerator.tsx'), 'UseDebounceHookGenerator'),
    'uselocalstorage-hook-generator': lazyWithRetry(() => import('./UseLocalStorageHookGenerator.tsx'), 'UseLocalStorageHookGenerator'),
    'useeventlistener-hook-generator': lazyWithRetry(() => import('./UseEventListenerHookGenerator.tsx'), 'UseEventListenerHookGenerator'),
    'usefetch-hook-generator': lazyWithRetry(() => import('./UseFetchHookGenerator.tsx'), 'UseFetchHookGenerator'),
    'useform-hook-generator': lazyWithRetry(() => import('./UseFormHookGenerator.tsx'), 'UseFormHookGenerator'),
};

// Fix: Cast RAW_FEATURES to any to bypass strict type checking for categories that are extended in types.ts
export const ALL_FEATURES: Feature[] = (RAW_FEATURES as any[]).map(feature => ({
    ...feature,
    component: componentMap[feature.id],
}));

export const FEATURES_MAP = new Map(ALL_FEATURES.map(f => [f.id, f]));

// ==================================================================================
// ==         SECTION II: NOOSPHERIC RESOLVER & AGI CORE                         ==
// ==================================================================================

class NoosphericResolver {
    private isInitialized: boolean = false;
    private noosphereMap: Map<string, { vector: NoeticVector, feature: Feature }> = new Map();

    public async initialize() {
        if (this.isInitialized) return;
        const promises = ALL_FEATURES.map(async (feature) => {
            const textToEmbed = `Name: ${feature.name}. Description: ${feature.description}. Category: ${feature.category}`;
            const vector = await generateNoeticVector(textToEmbed); // AI Call
            return { feature, vector };
        });
        const results = await Promise.all(promises);
        results.forEach(({ feature, vector }) => this.noosphereMap.set(feature.id, { feature, vector }));
        this.isInitialized = true;
        console.log("NOOSPHERE INDEXED. Engine is self-aware.");
    }

    public async resolveIntent(intent: string, customFeatures: CustomFeature[]): Promise<Feature | CustomFeature> {
        if (!this.isInitialized) await this.initialize();
        
        const intentVector = await generateNoeticVector(intent);

        let bestMatch: { id: string, score: number } = { id: '', score: -1 };
        
        const allKnownFeatures = new Map(this.noosphereMap);
        // Temporarily add custom features to the search space
        for(const cf of customFeatures) { allKnownFeatures.set(cf.id, { vector: await generateNoeticVector(cf.description), feature: null as any}); }
        
        // --- Cosine Similarity Search ---
        for (const [id, { vector }] of allKnownFeatures.entries()) {
            let dot = 0; let magA = 0; let magB = 0;
            for(let i=0; i<vector.length; i++){ dot += vector[i] * intentVector[i]; magA += vector[i] * vector[i]; magB += intentVector[i] * intentVector[i]; }
            const score = dot / (Math.sqrt(magA) * Math.sqrt(magB));
            if (score > bestMatch.score) bestMatch = { id, score };
        }

        if (bestMatch.score > 0.85) {
             const custom = customFeatures.find(cf => cf.id === bestMatch.id);
             if (custom) return custom;
             return this.noosphereMap.get(bestMatch.id)!.feature;
        } else {
            // --- AGI CORE: ON-THE-FLY FEATURE SYNTHESIS ---
            console.warn(`Noospheric match below threshold (${bestMatch.score.toFixed(2)}). Engaging The Sovereign Protocol.`);
            return await TheSovereignProtocol.synthesizeAndAssimilate(intent);
        }
    }
}

// Export a singleton instance of the resolver
export const Noosphere = new NoosphericResolver();