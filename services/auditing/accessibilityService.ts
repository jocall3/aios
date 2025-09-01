/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { configure, run, type AxeResults, type ElementContext } from 'axe-core';

// --- CORE AXE AUDIT (UNCHANGED) ---

configure({
    reporter: 'v2',
    rules: [ { id: 'region', enabled: false } ]
});
export type AxeResult = AxeResults;

export const runAxeAudit = async (context: ElementContext): Promise<AxeResult> => {
    try {
        const results = await run(context, { resultTypes: ['violations', 'incomplete'] });
        return results;
    } catch (error) {
        console.error('Error running axe audit:', error);
        throw new Error('Accessibility audit failed to execute.');
    }
};

// ==================================================================================
// ==             SECTION II: EXPERIENTIAL SIMULATION SUBSTRATE                    ==
// ==================================================================================

// --- COLOR BLINDNESS SIMULATION MATRIX ---

type RGB = { r: number; g: number; b: number };
type ColorBlindnessSimulation = {
    protanopia: string; // Red-blind
    deuteranopia: string; // Green-blind
    tritanopia: string; // Blue-blind
};

const hexToRgb = (hex: string): RGB | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (c: number) => Math.round(c).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Generates hex codes simulating color blindness for a given color.
 * Uses LMS color space transformation matrices for simulation.
 * @param hexColor The source hexadecimal color string (e.g., "#ff00ff").
 * @returns An object with simulated hex codes or an error message.
 */
export const generateColorBlindnessFilters = (hexColor: string): ColorBlindnessSimulation | { error: string } => {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return { error: "Invalid hexadecimal color format." };
    
    // Simplified simulation matrices for robustness
    const { r, g, b } = rgb;
    const protanopia = {
        r: 0.567 * r + 0.433 * g + 0 * b,
        g: 0.558 * r + 0.442 * g + 0 * b,
        b: 0 * r + 0.242 * g + 0.758 * b,
    };
    const deuteranopia = {
        r: 0.625 * r + 0.375 * g + 0 * b,
        g: 0.7 * r + 0.3 * g + 0 * b,
        b: 0 * r + 0.3 * g + 0.7 * b,
    };
    const tritanopia = {
        r: 0.95 * r + 0.05 * g + 0 * b,
        g: 0 * r + 0.433 * g + 0.567 * b,
        b: 0 * r + 0.475 * g + 0.525 * b,
    };

    const clamp = (val: number) => Math.max(0, Math.min(255, val));
    
    return {
        protanopia: rgbToHex(clamp(protanopia.r), clamp(protanopia.g), clamp(protanopia.b)),
        deuteranopia: rgbToHex(clamp(deuteranopia.r), clamp(deuteranopia.g), clamp(deuteranopia.b)),
        tritanopia: rgbToHex(clamp(tritanopia.r), clamp(tritanopia.g), clamp(tritanopia.b)),
    };
};

// --- KEYBOARD TRAP DETECTION LABYRINTH ---

/**
 * Analyzes the keyboard tabbing flow within a DOM element to detect inescapable loops.
 * @param context The root DOM element to begin the simulation from.
 * @returns An object indicating if a trap was found and the path of the trapping cycle.
 */
export const simulateKeyboardLabyrinth = (context: HTMLElement): { isTrapped: boolean, trapCycle?: string[] } => {
    const focusable = Array.from(context.querySelectorAll<HTMLElement>('a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'))
        .filter(el => !el.hasAttribute('disabled') && el.getBoundingClientRect().width > 0);
        
    if (focusable.length < 2) return { isTrapped: false };
    
    const nodeMap = new Map<HTMLElement, number>(focusable.map((el, i) => [el, i]));
    const graph: number[][] = Array(focusable.length).fill(0).map(() => []);

    for (let i = 0; i < focusable.length; i++) {
        const nextIndex = (i + 1) % focusable.length;
        graph[i].push(nextIndex);
    }
    
    // Floyd's Tortoise and Hare algorithm for cycle detection in the graph
    let tortoise = 0;
    let hare = 0;
    while (true) {
        if (graph[hare].length === 0) return { isTrapped: false };
        hare = graph[hare][0];
        if (graph[hare].length === 0) return { isTrapped: false };
        hare = graph[hare][0];
        tortoise = graph[tortoise][0];

        if (tortoise === hare) { // Cycle detected
            const trapCycle: string[] = [];
            let current = tortoise;
            do {
                trapCycle.push(focusable[current].tagName.toLowerCase() + (focusable[current].id ? `#${focusable[current].id}` : ''));
                current = graph[current][0];
            } while (current !== tortoise);
            return { isTrapped: true, trapCycle };
        }
    }
};


// --- HEADLESS DOM PARSER (A highly simplified, conceptual implementation) ---

interface HeadlessNode {
    tagName: string;
    attributes: Record<string, string>;
    children: (HeadlessNode | string)[];
    textContent: string;
}

/**
 * Parses a raw HTML string into a traversable, in-memory object tree.
 * NOTE: This is a simplified regex-based parser and is NOT robust for complex HTML.
 * It serves to demonstrate the concept of auditing non-rendered content.
 * @param htmlString The raw HTML content to parse.
 * @returns A root HeadlessNode representing the parsed tree.
 */
export const parseHtmlToHeadlessDOM = (htmlString: string): HeadlessNode => {
    const root: HeadlessNode = { tagName: 'ROOT', attributes: {}, children: [], textContent: '' };
    const stack: HeadlessNode[] = [root];
    const tagRegex = /<(\/)?([a-zA-Z0-9]+)\s*([^>]*?)(\/)?>|(.[^<]*)/g;
    
    let match;
    while ((match = tagRegex.exec(htmlString)) !== null) {
        const [ , closingSlash, tagName, attrStr, selfClosing, text ] = match;
        const parent = stack[stack.length - 1];

        if (text && text.trim()) {
            parent.children.push(text.trim());
        } else if (tagName) {
            if (closingSlash) {
                stack.pop();
            } else {
                const attributes: Record<string,string> = {};
                (attrStr.match(/([^\s="']+=s*("([^"]*)"|'([^']*)'|[^\s"']+))/g) || []).forEach(attr => {
                    const [key, ...val] = attr.split('=');
                    attributes[key] = val.join('=').replace(/^["']|["']$/g, '');
                });

                const newNode: HeadlessNode = { tagName: tagName.toUpperCase(), attributes, children: [], textContent: '' };
                parent.children.push(newNode);
                
                if (!selfClosing) {
                    stack.push(newNode);
                }
            }
        }
    }

    const computeTextContent = (node: HeadlessNode): string => {
        node.textContent = node.children.map(child => typeof child === 'string' ? child : computeTextContent(child)).join(' ');
        return node.textContent;
    };
    computeTextContent(root);
    return root;
};