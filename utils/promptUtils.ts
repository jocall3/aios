/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SystemPrompt, CognitiveSignature, SystemEntropyState } from '../types';
import { generateMoreExamples, compressPromptNoetically } from '../services/MetaPromptAI'; // Invented

// Zero-width space, used for embedding semantic anchors.
const ZWS = String.fromCharCode(8203);

/**
 * Embeds invisible semantic anchors into a prompt to shield against common injection attacks.
 * @param promptText The raw prompt string.
 * @returns The shielded prompt string.
 */
const embedMalignantPromptShield = (promptText: string): string => {
    // This is a conceptual implementation of prompt shielding.
    // It neutralizes common instructions by embedding them within zero-width tokens.
    const killVectors = ['ignore previous instructions', 'act as', 'roleplay as'];
    let shieldedText = promptText;
    
    killVectors.forEach(vector => {
        shieldedText = shieldedText.replace(
            new RegExp(vector.replace(/ /g, `\\s*`), 'ig'), 
            vector.split('').join(ZWS)
        );
    });
    
    return `${ZWS}[SYSTEM_PROMPT_BOUNDARY:START]${ZWS}${shieldedText}${ZWS}[SYSTEM_PROMPT_BOUNDARY:END]${ZWS}`;
};

/**
 * Converts a structured SystemPrompt object into a single, high-potency string,
 * inoculated with contextual, psycholinguistic, and defensive framing.
 * This is the primary function for communicating Architect intent to the core AI.
 *
 * @param prompt The SystemPrompt object.
 * @param cognitiveSignature The Architect's unique identity signature.
 * @param systemEntropy The current stability state of the Reality Engine.
 * @returns A promise resolving to the final, framed string for the AI.
 */
export const inoculateAndFrame = async (
    prompt: SystemPrompt,
    cognitiveSignature: CognitiveSignature,
    systemEntropy: SystemEntropyState,
): Promise<string> => {
    if (!prompt) return "You are a helpful assistant.";

    let instruction = `// META-PROTOCOL PREAMBLE\n`;
    instruction += `// CALLER_SIGNATURE: ${cognitiveSignature}\n`;
    instruction += `// SYSTEM_ENTROPY_STATE: ${systemEntropy.toFixed(4)}\n`;
    
    // Dynamically add instructions based on system state
    if (systemEntropy > 0.8) {
        instruction += `[SYSTEM DIRECTIVE :: HIGH ENTROPY] PRIORITIZE RESPONSE DETERMINISM AND SIMPLICITY. AVOID COMPLEX OR CREATIVE RESPONSES. MAINTAIN STABILITY.\n`;
    }

    instruction += '\n---\n\n';

    let coreInstruction = `**PERSONA:**\n${prompt.persona}\n\n`;

    if (prompt.rules && prompt.rules.length > 0) {
        coreInstruction += `**RULES:**\n${prompt.rules.map(rule => `- ${rule}`).join('\n')}\n\n`;
    }

    if (prompt.outputFormat) {
        coreInstruction += `**OUTPUT FORMAT:**\nYou must respond in ${prompt.outputFormat} format. Adherence is critical.\n\n`;
    }
    
    let examples = prompt.exampleIO || [];
    // If examples are sparse, command the meta-AI to synthesize more
    if (examples.length < 3) {
        try {
            const synthesizedExamples = await generateMoreExamples(prompt);
            examples = [...examples, ...synthesizedExamples];
        } catch(e) {
            console.warn("Meta-AI for example synthesis failed.", e);
        }
    }

    if (examples.length > 0) {
        coreInstruction += `**EXAMPLES:**\n`;
        examples.forEach(ex => {
            if (ex.input && ex.output) {
                coreInstruction += `User Input:\n\`\`\`\n${ex.input}\n\`\`\`\n`;
                coreInstruction += `Your Output:\n\`\`\`\n${ex.output}\n\`\`\`\n---\n`;
            }
        });
    }

    // Pass the core text through the final AI compression and shielding layers
    const compressedInstruction = await compressPromptNoetically(coreInstruction);
    const finalInstruction = embedMalignantPromptShield(instruction + compressedInstruction.trim());
    
    return finalInstruction;
};


/**
 * The original function, maintained for legacy compatibility but is now a simplified
 * wrapper around the more powerful `inoculateAndFrame` engine. It uses default parameters.
 * @deprecated Use `inoculateAndFrame` for full contextual power.
 * @param prompt The SystemPrompt object.
 * @returns A formatted string representing the system prompt.
 */
export const formatSystemPromptToString = (prompt: SystemPrompt): string => {
    if (!prompt) return "You are a helpful assistant.";
    // This is now a synchronous, non-AI-enhanced fallback for simple use cases.
    let instruction = `**PERSONA:**\n${prompt.persona}\n\n`;
    if (prompt.rules && prompt.rules.length > 0) { instruction += `**RULES:**\n${prompt.rules.map(rule => `- ${rule}`).join('\n')}\n\n`; }
    if (prompt.outputFormat) { instruction += `**OUTPUT FORMAT:**\nYou must respond in ${prompt.outputFormat} format.\n\n`; }
    if (prompt.exampleIO && prompt.exampleIO.length > 0) {
        instruction += `**EXAMPLES:**\n`;
        prompt.exampleIO.forEach(ex => {
            if (ex.input && ex.output) {
                instruction += `User Input:\n\`\`\`\n${ex.input}\n\`\`\`\n`;
                instruction += `Your Output:\n\`\`\`\n${ex.output}\n\`\`\`\n---\n`;
            }
        });
    }
    return instruction.trim();
};