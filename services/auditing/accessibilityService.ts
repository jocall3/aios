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
    
    // RGB to LMS conversion matrix
    const LMSMatrix = [[17.8824, 43.5161, 4.11935], [3.45565, 27.1554, 3.86714], [0.0299566, 0.184309, 1.46709]];
    const r = rgb.r, g = rgb.g, b = rgb.b;
    const l = LMSMatrix[0][0] * r + LMSMatrix[0][1] * g + LMSMatrix[0][2] * b;
    const m = LMSMatrix[1][0] * r + LMSMatrix[1][1] * g + LMSMatrix[1][2] * b;
    const s = LMSMatrix[2][0] * r + LMSMatrix[2][1] * g + LMSMatrix[2][2] * b;
    
    // Protanopia simulation (L is missing)
    const p_l = 0.0 * m + 0.0 * s;
    // Deuteranopia simulation (M is missing)
    const d_m = 0.0 * l + 0.0 * s;
    // Tritanopia simulation (S is missing)
    const t_s = 0.0 * l + 0.0 * m;

    // LMS to RGB conversion matrix (inverted)
    const RGBMatrix = [[0.0809, -0.1305, 0.1167], [-0.0102, 0.0540, -0.1136], [-0.0003, -0.0041, 0.6935]];

    const simulate = (l_s: number, m_s: number, s_s: number): RGB => ({
        r: Math.max(0, Math.min(255, RGBMatrix[0][0] * l_s + RGBMatrix[0][1] * m_s + RGBMatrix[0][2] * s_s)),
        g: Math.max(0, Math.min(255, RGBMatrix[1][0] * l_s + RGBMatrix[1][1] * m_s + RGBMatrix[1][2] * s_s)),
        b: Math.max(0, Math.min(255, RGBMatrix[2][0] * l_s + RGBMatrix[2][1] * m_s + RGBMatrix[2][2] * s_s)),
    });

    const protanopiaRgb = simulate(p_l, m, s);
    const deuteranopiaRgb = simulate(l, d_m, s);
    const tritanopiaRgb = simulate(l, m, t_s);
    
    return {
        protanopia: rgbToHex(protanopiaRgb.r, protanopiaRgb.g, protanopiaRgb.b),
        deuteranopia: rgbToHex(deuteranopiaRgb.r, deuteranopiaRgb.g, deuteranopiaRgb.b),
        tritanopia: rgbToHex(tritanopiaRgb.r, tritanopiaRgb.g, tritanopiaRgb.b),
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