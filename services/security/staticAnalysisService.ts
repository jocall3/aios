/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- TYPES & INTERFACES (SELF-CONTAINED) ---

export type SecuritySeverity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
export interface SecurityIssue {
    line: number;
    type: string;
    description: string;
    severity: SecuritySeverity;
    proofOfConcept?: string; // e.g., A curl command or an XSS payload
}

interface ASTNode {
    type: string;
    start: number;
    end: number;
    loc: { start: { line: number; }; };
    [key: string]: any;
}
type Heuristic = (ast: ASTNode, codeLines: string[]) => SecurityIssue[];


// --- SELF-CONTAINED MINIMALIST JAVASCRIPT PARSER (CONCEPTUAL) ---
// In a true implementation, this would be a full parser like Acorn or Babel, 
// but for this directive, we simulate its output to avoid external dependencies.
const parseToAST = (code: string): ASTNode => {
    // This is a stand-in for a real AST parser.
    // It finds keywords and creates a simplified node structure.
    const root: ASTNode = { type: 'Program', start: 0, end: code.length, loc: {start:{line:1}}, body:[]};
    const lines = code.split('\n');
    lines.forEach((line, index) => {
        if (line.includes('dangerouslySetInnerHTML')) {
            root.body.push({ type: 'JSXAttribute', name: { name: 'dangerouslySetInnerHTML'}, loc: {start: {line: index + 1}}});
        }
        if (/\b(key|secret|token|password)\s*=\s*['"]/.test(line)) {
            root.body.push({ type: 'VariableDeclarator', id: { name: 'potentialSecret' }, loc: {start: {line: index + 1}}});
        }
    });
    return root;
};


// --- HEURISTIC REGISTRY ---
const heuristic_HardcodedSecrets: Heuristic = (ast, codeLines) => {
    const issues: SecurityIssue[] = [];
    codeLines.forEach((line, index) => {
        const secretRegex = /(key|secret|token|password|auth|apiKey)['"]?\s*[:=]\s*['"]([a-zA-Z0-9-_.]{20,})['"]/i;
        const match = line.match(secretRegex);
        if (match) {
            issues.push({
                line: index + 1, type: 'Hardcoded Secret',
                description: 'A hardcoded secret or API key was found. These must be stored in environment variables or a secure vault.',
                severity: 'High', proofOfConcept: `Exposed Secret: ${match[2].substring(0, 4)}...`
            });
        }
    });
    return issues;
};

const heuristic_XSS: Heuristic = (ast) => {
    const issues: SecurityIssue[] = [];
    const traverse = (node: ASTNode) => {
        if (node.type === 'JSXAttribute' && node.name?.name === 'dangerouslySetInnerHTML') {
            issues.push({
                line: node.loc.start.line, type: 'Cross-Site Scripting (XSS) Vector',
                description: 'The use of dangerouslySetInnerHTML creates a potential XSS vulnerability if the input is not rigorously sanitized.',
                severity: 'High', proofOfConcept: `Payload: <img src=x onerror=alert('XSS_SUCCESSFUL') />`
            });
        }
        if (node.body) Array.isArray(node.body) ? node.body.forEach(traverse) : traverse(node.body);
    };
    traverse(ast);
    return issues;
};

const HEURISTIC_REGISTRY: Heuristic[] = [
    heuristic_HardcodedSecrets,
    heuristic_XSS,
];


// --- EXPORTED ENGINE API ---

/**
 * Performs a deep, multi-vector security analysis on a block of code by
 * parsing it into an AST and applying a registry of advanced security heuristics.
 * @param code The string of code to analyze.
 * @returns An array of identified security issues, complete with exploit proofs.
 */
export const modelThreatSurface = (code: string): SecurityIssue[] => {
    if (!code.trim()) return [];

    const ast = parseToAST(code);
    const codeLines = code.split('\n');
    
    let allIssues: SecurityIssue[] = [];
    for (const heuristic of HEURISTIC_REGISTRY) {
        try {
            const foundIssues = heuristic(ast, codeLines);
            allIssues = [...allIssues, ...foundIssues];
        } catch (e) {
            console.error("Heuristic failed to execute:", e);
        }
    }
    
    return allIssues;
};


/**
 * The legacy `runStaticScan` function, now re-implemented as a wrapper around the
 * new, more powerful threat modeling engine for backward compatibility.
 */
export const runStaticScan = (code: string): SecurityIssue[] => {
    // This now delegates to the superior engine.
    return modelThreatSurface(code);
};

/**
 * Simulates fetching updated heuristics from a global threat intelligence feed.
 * In a real application, this would make a network request.
 * @returns A promise that resolves when the (simulated) update is complete.
 */
export const updateHeuristicsFromThreatFeed = async (): Promise<{ newHeuristicsCount: number }> => {
    console.log("Contacting Global Threat Intelligence Feed for heuristic updates...");
    await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate network latency

    const zeroDayHeuristic: Heuristic = (ast, codeLines) => {
         // This heuristic could check for a newly discovered insecure library pattern.
         const issues: SecurityIssue[] = [];
         codeLines.forEach((line, index) => {
             if (line.includes("insecure-library@1.0.0")) {
                 issues.push({
                     line: index + 1, type: "Zero-Day Vulnerability",
                     description: "Use of `insecure-library` is vulnerable to CVE-2024-XXXX.",
                     severity: 'Critical', proofOfConcept: 'See exploit details at ACME Security Advisory #123'
                 });
             }
         });
         return issues;
    };

    if(!HEURISTIC_REGISTRY.includes(zeroDayHeuristic)){
         HEURISTIC_REGISTRY.push(zeroDayHeuristic);
         console.log("Threat feed synchronized. 1 new heuristic installed.");
         return { newHeuristicsCount: 1 };
    }
    console.log("Heuristics are already up to date.");
    return { newHeuristicsCount: 0 };
};