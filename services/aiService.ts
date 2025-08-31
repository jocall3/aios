/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { Type, FunctionDeclaration } from "@google/genai";
import type { GeneratedFile, StructuredPrSummary, StructuredExplanation, SemanticColorTheme, StructuredReview, SecurityVulnerability, CodeSmell, FileNode, CustomFeature } from '../types.ts';
import { logError } from './telemetryService.ts';

// --- TYPES ---
export interface CommandResponse {
    text: string;
    functionCalls?: { name: string; args: any; }[];
}

export interface CronParts {
    minute: string;
    hour: string;
    dayOfMonth: string;
    month: string;
    dayOfWeek: string;
}

// --- Unified AI Proxy Helpers ---

async function fetchFromProxy(endpoint: string, body: object): Promise<any> {
    try {
        const response = await fetch(`/api/proxy${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || `AI proxy request failed with status ${response.status}`);
        }

        return response.json();
    } catch (error) {
        logError(error as Error, { endpoint, body });
        throw error;
    }
}

async function* streamFromProxy(endpoint: string, body: object): AsyncGenerator<string> {
    try {
        const response = await fetch(`/api/proxy${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok || !response.body) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || `AI proxy stream request failed with status ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            yield decoder.decode(value);
        }
    } catch (error) {
        logError(error as Error, { endpoint, body });
        if (error instanceof Error) {
            yield `An error occurred while communicating with the AI model: ${error.message}`;
        } else {
            yield "An unknown error occurred while generating the response.";
        }
    }
}


export async function* streamContent(prompt: string | { parts: any[] }, systemInstruction: string, temperature = 0.5) {
    yield* streamFromProxy('/streamContent', {
        model: 'gemini-2.5-flash',
        contents: prompt as any,
        config: { systemInstruction, temperature }
    });
}

export async function generateContent(prompt: string, systemInstruction: string, temperature = 0.5): Promise<string> {
    const response = await fetchFromProxy('/generateContent', {
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { systemInstruction, temperature }
    });
    return response.text;
}


export async function generateJson<T>(prompt: any, systemInstruction: string, schema: any, temperature = 0.2): Promise<T> {
    const response = await fetchFromProxy('/generateContent', {
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature,
        }
    });
    return JSON.parse(response.text.trim());
}

// --- Schemas ---
const filesSchema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { filePath: { type: Type.STRING }, content: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["filePath", "content", "description"] } };


// --- Existing Feature Functions ---

export const explainCodeStream = (code: string) => streamContent(
    `Please explain the following code snippet:\n\n\`\`\`\n${code}\n\`\`\``,
    "You are an expert software engineer providing a clear, concise explanation of code."
);

export const generateRegExStream = (description: string) => streamContent(
    `Generate a single valid JavaScript regex literal (e.g., /abc/gi) for the following description. Respond with ONLY the regex literal and nothing else: "${description}"`,
    "You are an expert in regular expressions. You only output valid JavaScript regex literals.",
    0.7
);

export const generateCommitMessageStream = (diff: string) => streamContent(
    `Generate a conventional commit message for the following diff:\n\n${diff}`,
    "You are an expert programmer who writes excellent, conventional commit messages. The response should be only the commit message text.",
    0.8
);

export const generateUnitTestsStream = (code: string, systemInstruction?: string) => streamContent(
    `Generate unit tests for this code:\n\n\`\`\`\n${code}\n\`\`\``,
    systemInstruction || "You are a software quality engineer specializing in writing comprehensive and clear unit tests using Vitest and React Testing Library.",
    0.6
);

export const formatCodeStream = (code: string) => streamContent(
    `Format this code:\n\n\`\`\`javascript\n${code}\n\`\`\``,
    "You are a code formatter. Your only purpose is to format code. Respond with only the formatted code, enclosed in a single markdown block.",
    0.2
);

export const generateComponentFromImageStream = (base64Image: string) => streamContent(
    {
        parts: [
            { text: "Generate a single-file React component using Tailwind CSS that looks like this image. Respond with only the code in a markdown block." },
            { inlineData: { mimeType: 'image/png', data: base64Image } }
        ]
    },
    "You are an expert frontend developer specializing in React and Tailwind CSS. You create clean, functional components from screenshots."
);

export const transcribeAudioToCodeStream = (base64Audio: string, mimeType: string) => streamContent(
    {
        parts: [
            { text: "Transcribe my speech into a code snippet. If I describe a function or component, write it out." },
            { inlineData: { mimeType, data: base64Audio } }
        ]
    },
    "You are an expert programmer. You listen to a user's voice and transcribe their ideas into code."
);

export const transferCodeStyleStream = (args: { code: string, styleGuide: string }) => streamContent(
    `Rewrite the following code to match the provided style guide.\n\nStyle Guide:\n${args.styleGuide}\n\nCode to rewrite:\n\`\`\`\n${args.code}\n\`\`\``,
    "You are an AI assistant that rewrites code to match a specific style guide. Respond with only the rewritten code in a markdown block.",
    0.3
);

export const generateCodingChallengeStream = (_: any) => streamContent(
    `Generate a new, interesting coding challenge suitable for an intermediate developer. Include a clear problem description, one or two examples, and any constraints. Format it in markdown.`,
    "You are an AI that creates unique and interesting coding challenges for software developers.",
    0.9
);

export const reviewCodeStream = (code: string, systemInstruction?: string) => streamContent(
    `Please perform a detailed code review on the following code snippet. Identify potential bugs, suggest improvements for readability and performance, and point out any anti-patterns. Structure your feedback with clear headings.\n\n\`\`\`\n${code}\n\`\`\``,
    systemInstruction || "You are a senior software engineer performing a code review. You are meticulous, helpful, and provide constructive feedback.",
    0.6
);

export const generateChangelogFromLogStream = (log: string) => streamContent(
    `Analyze this git log and create a changelog:\n\n\`\`\`\n${log}\n\`\`\``,
    "You are a git expert and project manager. Analyze the provided git log and generate a clean, categorized changelog in Markdown format. Group changes under 'Features' and 'Fixes'.",
    0.6
);

export const enhanceSnippetStream = (code: string) => streamContent(
    `Enhance this code snippet. Add comments, improve variable names, and refactor for clarity or performance if possible.\n\n\`\`\`\n${code}\n\`\`\``,
    "You are a senior software engineer who excels at improving code. Respond with only the enhanced code in a markdown block.",
    0.5
);

export const summarizeNotesStream = (notes: string) => streamContent(
    `Summarize these developer notes into a bulleted list of key points and action items:\n\n${notes}`,
    "You are a productivity assistant who is an expert at summarizing technical notes.",
    0.7
);

export const migrateCodeStream = (code: string, from: string, to: string) => streamContent(
    `Translate this ${from} code to ${to}. Respond with only the translated code in a markdown block.\n\n\`\`\`\n${code}\n\`\`\``,
    `You are an expert polyglot programmer who specializes in migrating code between languages and frameworks.`,
    0.4
);

export const analyzeConcurrencyStream = (code: string) => streamContent(
    `Analyze this JavaScript code for potential concurrency issues, especially related to Web Workers. Identify race conditions, deadlocks, or inefficient data passing.\n\n\`\`\`javascript\n${code}\n\`\`\``,
    "You are an expert in JavaScript concurrency, web workers, and multi-threaded programming concepts.",
    0.6
);

export const debugErrorStream = (error: Error) => streamContent(
    `I encountered an error in my React application. Here are the details:\n    \n    Message: ${error.message}\n    \n    Stack Trace:\n    ${error.stack}\n    \n    Please analyze this error. Provide a brief explanation of the likely cause, followed by a bulleted list of potential solutions or debugging steps. Structure your response in clear, concise markdown.`,
    "You are an expert software engineer specializing in debugging React applications. You provide clear, actionable advice to help developers solve errors."
);

export const convertJsonToXbrlStream = (json: string) => streamContent(
    `Convert the following JSON to a simplified, XBRL-like XML format. Use meaningful tags based on the JSON keys. The root element should be <xbrl>. Do not include XML declarations or namespaces.\n\nJSON:\n${json}`,
    "You are an expert in data formats who converts JSON to clean, XBRL-like XML."
);

export const generateImage = async (prompt: string): Promise<string> => {
    const response = await fetchFromProxy('/generateImages', {
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: { numberOfImages: 1, outputMimeType: 'image/png' },
    });
    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
};

export const generateImageFromImageAndText = async (prompt: string, base64Image: string, mimeType: string): Promise<string> => {
    console.warn("Image-to-image generation is simulated; using text prompt only.");
    return generateImage(prompt);
};

export const generatePrSummaryStructured = (diff: string): Promise<StructuredPrSummary> => {
    const systemInstruction = "You are an expert programmer who writes excellent PR summaries.";
    const prompt = `Generate a PR summary for the following diff:\n\n\`\`\`diff\n${diff}\n\`\`\``;
    const schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, summary: { type: Type.STRING }, changes: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["title", "summary", "changes"] };
    return generateJson(prompt, systemInstruction, schema);
};

export const explainCodeStructured = async (code: string): Promise<StructuredExplanation> => {
    const systemInstruction = "You are an expert software engineer providing a structured analysis of a code snippet.";
    const prompt = `Analyze this code: \n\n\`\`\`\n${code}\n\`\`\``;
    const schema = { type: Type.OBJECT, properties: { summary: { type: Type.STRING }, lineByLine: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { lines: { type: Type.STRING }, explanation: { type: Type.STRING } }, required: ["lines", "explanation"] } }, complexity: { type: Type.OBJECT, properties: { time: { type: Type.STRING }, space: { type: Type.STRING } }, required: ["time", "space"] }, suggestions: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["summary", "lineByLine", "complexity", "suggestions"] };
    return generateJson(prompt, systemInstruction, schema);
}

export const generateSemanticTheme = (prompt: { parts: any[] }): Promise<SemanticColorTheme> => {
    const systemInstruction = `You are a world-class UI/UX designer with an expert understanding of color theory, accessibility, and branding. Your task is to generate a comprehensive, semantically named color theme from a user's prompt.`;
    const colorObjectSchema = { type: Type.OBJECT, properties: { value: { type: Type.STRING }, name: { type: Type.STRING } }, required: ["value", "name"] };
    const accessibilityCheckSchema = { type: Type.OBJECT, properties: { ratio: { type: Type.NUMBER }, score: { type: Type.STRING, enum: ["AAA", "AA", "Fail"] } }, required: ["ratio", "score"] };
    const schema = { type: Type.OBJECT, properties: { mode: { type: Type.STRING, enum: ["light", "dark"] }, palette: { type: Type.OBJECT, properties: { primary: colorObjectSchema, secondary: colorObjectSchema, accent: colorObjectSchema, neutral: colorObjectSchema, }, required: ["primary", "secondary", "accent", "neutral"] }, theme: { type: Type.OBJECT, properties: { background: colorObjectSchema, surface: colorObjectSchema, textPrimary: colorObjectSchema, textSecondary: colorObjectSchema, textOnPrimary: colorObjectSchema, border: colorObjectSchema, }, required: ["background", "surface", "textPrimary", "textSecondary", "textOnPrimary", "border"] }, accessibility: { type: Type.OBJECT, properties: { primaryOnSurface: accessibilityCheckSchema, textPrimaryOnSurface: accessibilityCheckSchema, textSecondaryOnSurface: accessibilityCheckSchema, textOnPrimaryOnPrimary: accessibilityCheckSchema, }, required: ["primaryOnSurface", "textPrimaryOnSurface", "textSecondaryOnSurface", "textOnPrimaryOnPrimary"] } }, required: ["mode", "palette", "theme", "accessibility"] };
    return generateJson(prompt, systemInstruction, schema);
};

export const getInferenceFunction = async (prompt: string, functionDeclarations: FunctionDeclaration[], knowledgeBase: string): Promise<CommandResponse> => {
    const response = await fetchFromProxy('/generateContent', {
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            systemInstruction: `You are a helpful assistant for a developer tool. You must decide which function to call to satisfy the user's request, based on your knowledge base. If no specific tool seems appropriate, respond with text.\n\nKnowledge Base:\n${knowledgeBase}`,
            tools: [{ functionDeclarations }]
        }
    });
    const functionCalls: { name: string, args: any }[] = [];
    const parts = response.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) { if (part.functionCall) { functionCalls.push({ name: part.functionCall.name, args: part.functionCall.args }); } }
    return { text: response.text, functionCalls: functionCalls.length > 0 ? functionCalls : undefined };
};

export const generateMermaidJs = (code: string): Promise<string> => {
    const prompt = `Generate a Mermaid.js flowchart diagram that visually represents the logic of the following code. Respond with only the Mermaid.js graph definition inside a 'mermaid' markdown block.\n\nCode:\n\`\`\`\n${code}\n\`\`\``;
    return generateContent(prompt, "You are an expert at creating Mermaid.js diagrams from code.");
};

export const generatePipelineCode = (flowDescription: string): Promise<string> => {
    const prompt = `Based on the following described workflow, generate a JavaScript function that orchestrates the calls between the tools. The function should be named 'runPipeline'.\n\nWorkflow:\n${flowDescription}`;
    return generateContent(prompt, "You are an expert at writing JavaScript code to orchestrate complex workflows based on a description.");
};

export const generateTagsForCode = (code: string): Promise<string[]> => {
    const prompt = `Generate a list of 3-5 relevant, one-word, lowercase technical tags for this code snippet:\n\n\`\`\`\n${code}\n\`\`\``;
    const schema = { type: Type.ARRAY, items: { type: Type.STRING } };
    return generateJson(prompt, "You are a code tagging expert. You only respond with a JSON array of strings.", schema);
};

export const generateFeature = (prompt: string, framework: string, styling: string): Promise<GeneratedFile[]> => {
    const systemInstruction = `You are an expert ${framework} developer specializing in ${styling}. Your task is to generate a complete, production-ready, and fully self-contained feature based on the user's prompt. You must generate all necessary files, including the component, styles (if applicable), and any utility functions. Respond with a JSON array of file objects.`;
    const fullPrompt = `Generate all files for the following feature request:\n\nPrompt: "${prompt}"\nFramework: ${framework}\nStyling: ${styling}`;
    return generateJson(fullPrompt, systemInstruction, filesSchema);
};

export const generateFullStackFeature = (prompt: string, framework: string, styling: string): Promise<GeneratedFile[]> => {
    const systemInstruction = `You are an expert full-stack developer specializing in ${framework} with ${styling} on the frontend, and serverless Google Cloud Functions with Firestore on the backend. Generate all necessary files for a complete feature, including frontend components, backend function, and any necessary types or utilities. Respond with a JSON array of file objects.`;
    const fullPrompt = `Generate all frontend and backend files for the following feature request:\n\nPrompt: "${prompt}"\nFramework: ${framework}\nStyling: ${styling}\nBackend: Google Cloud Function (Node.js) + Firestore`;
    return generateJson(fullPrompt, systemInstruction, filesSchema);
};

export const generateDockerfile = (framework: string) => streamContent(
    `Generate a simple, production-ready Dockerfile for a ${framework} application.`,
    "You are a DevOps expert who creates optimized Dockerfiles."
);

export const generateTechnicalSpecFromDiff = (diff: string, summary: StructuredPrSummary): Promise<string> => {
    const prompt = `Based on the following PR summary and code diff, generate a detailed technical specification document in Markdown format. The spec should include sections for Introduction/Background, Technical Approach, Data Model Changes (if any), and Testing Plan.\n\nSummary:\nTitle: ${summary.title}\n${summary.summary}\n\nDiff:\n${diff}`;
    return generateContent(prompt, "You are a senior engineer who writes detailed technical specification documents.");
};

const fileTreeToString = (node: FileNode, indent = 0): string => {
    let str = ' '.repeat(indent) + (node.type === 'folder' ? `/${node.name}` : node.name) + '\n';
    if (node.children) {
        node.children.forEach(child => {
            str += fileTreeToString(child, indent + 2);
        });
    }
    return str;
};

export const answerProjectQuestion = (question: string, projectFiles: FileNode) => {
    const fileStructure = fileTreeToString(projectFiles);
    const prompt = `Given the following file structure, please answer the user's question.\n\nFile Structure:\n${fileStructure}\n\nQuestion: ${question}`;
    return streamContent(prompt, "You are an AI assistant with knowledge of the entire project structure. You answer questions about the codebase.");
};

export const generateNewFilesForProject = (prompt: string, projectFiles: FileNode): Promise<GeneratedFile[]> => {
    const fileStructure = fileTreeToString(projectFiles);
    const systemInstruction = "You are an expert software engineer. Your task is to generate new files to add to an existing project based on a user's prompt and the project's file structure. You must infer the correct file paths and languages. Respond with a JSON array of file objects.";
    const fullPrompt = `Generate the necessary new files for the following request, given the existing project structure.\n\nRequest: "${prompt}"\n\nExisting File Structure:\n${fileStructure}`;
    return generateJson(fullPrompt, systemInstruction, filesSchema);
};

export const generateCronFromDescription = (description: string): Promise<CronParts> => {
    const prompt = `Generate a cron expression from the following description: "${description}"`;
    const schema = { type: Type.OBJECT, properties: { minute: { type: Type.STRING }, hour: { type: Type.STRING }, dayOfMonth: { type: Type.STRING }, month: { type: Type.STRING }, dayOfWeek: { type: Type.STRING } }, required: ["minute", "hour", "dayOfMonth", "month", "dayOfWeek"] };
    return generateJson(prompt, "You are a cron job expert. You only respond with a JSON object representing the cron parts.", schema);
};

export const generateColorPalette = (baseColor: string): Promise<{ colors: string[] }> => {
    const prompt = `Generate a 6-color palette based on the hex color ${baseColor}. The palette should be harmonious and suitable for a web UI. Include shades from light to dark.`;
    const schema = { type: Type.OBJECT, properties: { colors: { type: Type.ARRAY, items: { type: Type.STRING, description: "A hex color code" } } }, required: ["colors"] };
    return generateJson(prompt, "You are a UI designer who creates beautiful color palettes. You only respond with a JSON object containing an array of hex color strings.", schema);
};

export const generateMockData = (schemaDescription: string, count: number): Promise<any[]> => {
    const prompt = `Generate an array of ${count} mock data objects based on this schema description: "${schemaDescription}"`;
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {} } };
    return generateJson(prompt, "You are an expert at generating realistic mock data. You only respond with a valid JSON array of objects.", schema);
};

export const analyzePerformanceTrace = (trace: any): Promise<string> => {
    const prompt = `Analyze the following performance trace data (either runtime measures or bundle stats) and provide a summary of potential bottlenecks and optimization suggestions in Markdown format.\n\nData:\n\`\`\`json\n${JSON.stringify(trace, null, 2)}\n\`\`\``;
    return generateContent(prompt, "You are a performance engineering expert who analyzes performance data and provides actionable insights.");
};

export const suggestA11yFix = (issue: any): Promise<string> => {
    const prompt = `For the following accessibility issue, provide a code snippet example of how to fix it. Explain the fix briefly.\n\nIssue:\n\`\`\`json\n${JSON.stringify({ id: issue.id, help: issue.help, description: issue.description, failureSummary: issue.failureSummary }, null, 2)}\n\`\`\``;
    return generateContent(prompt, "You are a web accessibility expert who provides clear, actionable code fixes for accessibility issues.");
};

export const generateCiCdConfig = (platform: string, description: string): Promise<string> => {
    const prompt = `Generate a complete CI/CD configuration file for ${platform} based on the following description of stages: "${description}". Respond with only the configuration file content in a markdown block.`;
    return generateContent(prompt, "You are a DevOps expert specializing in CI/CD pipelines.");
};

export const analyzeCodeForVulnerabilities = (code: string): Promise<SecurityVulnerability[]> => {
    const prompt = `Analyze the following code for security vulnerabilities. Identify the vulnerability, its severity, and suggest a mitigation. Also provide a simple shell command to simulate a potential exploit if applicable.\n\nCode:\n\`\`\`\n${code}\n\`\`\``;
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { vulnerability: { type: Type.STRING }, severity: { type: Type.STRING, enum: ["Critical", "High", "Medium", "Low", "Informational"] }, description: { type: Type.STRING }, mitigation: { type: Type.STRING }, exploitSuggestion: { type: Type.STRING } }, required: ["vulnerability", "severity", "description", "mitigation"] } };
    return generateJson(prompt, "You are a security expert who analyzes code for vulnerabilities. You respond in a structured JSON format.", schema);
};

export const generateTerraformConfig = (cloud: string, description: string, context: string): Promise<string> => {
    const prompt = `Generate a Terraform configuration file for ${cloud} to provision the following infrastructure: "${description}". Additional context: ${context}. Respond with only the HCL code in a markdown block.`;
    return generateContent(prompt, "You are a cloud infrastructure expert who writes Terraform code.");
};

export const generateWeeklyDigest = (commitLogs: string, telemetry: any): Promise<string> => {
    const prompt = `Generate a concise and engaging weekly digest email in HTML format for a project manager. The email should summarize the key achievements and project health based on the provided data.\n\nRecent Commits:\n${commitLogs}\n\nPerformance Telemetry:\n${JSON.stringify(telemetry, null, 2)}`;
    return generateContent(prompt, "You are an AI assistant that writes engaging project summary emails for stakeholders. Respond with only the raw HTML for the email body.");
};

export const refactorForReadability = (code: string) => streamContent(
    `Refactor the following code to improve its readability. Use clearer variable names, simplify logic, and add comments where necessary. Respond with only the refactored code in a markdown block.\n\n\`\`\`\n${code}\n\`\`\``,
    "You are an expert at refactoring code for readability."
);

export const refactorForPerformance = (code: string) => streamContent(
    `Refactor the following code to improve its performance. Use more efficient algorithms or language features where applicable. Respond with only the refactored code in a markdown block.\n\n\`\`\`\n${code}\n\`\`\``,
    "You are an expert at optimizing code for performance."
);

export const generateJsDoc = (code: string) => streamContent(
    `Add JSDoc comments to the following code. Document all functions, parameters, and return values. Respond with only the commented code in a markdown block.\n\n\`\`\`\n${code}\n\`\`\``,
    "You are an expert at writing comprehensive JSDoc documentation."
);

export const convertToFunctionalComponent = (code: string) => streamContent(
    `Convert the following class-based React component to a functional component using hooks. Respond with only the refactored code in a markdown block.\n\n\`\`\`\n${code}\n\`\`\``,
    "You are an expert React developer who refactors class components to functional components."
);

export const generateBugReproductionTestStream = (stackTrace: string, context: string) => streamContent(
    `Given the following stack trace and code context, generate a failing unit test using Vitest that reproduces the bug. The test should be named descriptively (e.g., "should throw error when user is null").\n\nStack Trace:\n${stackTrace}\n\nCode Context:\n${context}`,
    "You are an expert in software testing and debugging. You write minimal, failing tests to reproduce bugs.",
    0.6
);

export const detectCodeSmells = (code: string): Promise<CodeSmell[]> => {
    const prompt = `Analyze the following code for common code smells like "Long Method", "Duplicated Code", "Large Class", etc. For each smell found, provide the name of the smell, the approximate line number, and a brief explanation.\n\nCode:\n\`\`\`\n${code}\n\`\`\``;
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { smell: { type: Type.STRING }, line: { type: Type.NUMBER }, explanation: { type: Type.STRING } }, required: ["smell", "line", "explanation"] } };
    return generateJson(prompt, "You are a software quality expert who detects code smells. You respond in a structured JSON format.", schema);
};

export const generateIamPolicyStream = (description: string, platform: 'aws' | 'gcp') => streamContent(
    `Generate a valid IAM policy in JSON format for ${platform.toUpperCase()} that matches the following description: "${description}". Respond with only the JSON policy in a markdown block.`,
    "You are a cloud security expert specializing in IAM policies."
);

// --- New Feature Functions ---

export const generateWordPressPlugin = (prompt: string): Promise<GeneratedFile[]> => {
    const systemInstruction = "You are an expert WordPress plugin developer. Generate all necessary files for a WordPress plugin that fulfills the user's request. Include a main PHP file with the standard plugin header and a readme.txt file. Respond with a JSON array of file objects.";
    const fullPrompt = `Generate a WordPress plugin that does the following: "${prompt}"`;
    return generateJson(fullPrompt, systemInstruction, filesSchema);
};

export const generateAppFeatureComponent = (prompt: string): Promise<Omit<CustomFeature, 'id'>> => {
    const systemInstruction = "You are an expert React developer who creates self-contained components. Generate a single React component from the user's prompt. Also provide a name for the feature, a one-sentence description, and a suitable icon name from the provided list. Respond with a JSON object.";
    const fullPrompt = `Prompt: "${prompt}"\n\nAvailable Icons: CodeExplainerIcon, FeatureBuilderIcon, ThemeDesignerIcon, UnitTestGeneratorIcon, CommitGeneratorIcon, RegexSandboxIcon, SparklesIcon, DocumentTextIcon, ChartBarIcon, EyeIcon, ShieldCheckIcon, CpuChipIcon, MailIcon, BugAntIcon, HammerIcon, WordPressIcon`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            icon: { type: Type.STRING },
            code: { type: Type.STRING }
        },
        required: ["name", "description", "icon", "code"]
    };
    return generateJson(fullPrompt, systemInstruction, schema);
};

export const generateClientFromApiSchema = (schema: string, language: string): Promise<GeneratedFile[]> => {
    const prompt = `Generate a client library for the following API schema in ${language}.\n\nSchema:\n\`\`\`json\n${schema}\n\`\`\``;
    const systemInstruction = `You are an expert at generating API client libraries from OpenAPI or GraphQL schemas. Respond with a JSON array of file objects.`;
    return generateJson(prompt, systemInstruction, filesSchema);
};

export const sqlToApiEndpoints = (schema: string, framework: 'express' | 'fastify'): Promise<GeneratedFile[]> => {
    const prompt = `Generate all necessary files for CRUD API endpoints using ${framework} for the following SQL schema. Include routes, controllers, and basic models.\n\nSQL Schema:\n\`\`\`sql\n${schema}\n\`\`\``;
    const systemInstruction = `You are an expert backend developer who creates structured and efficient APIs from database schemas. Respond with a JSON array of file objects.`;
    return generateJson(prompt, systemInstruction, filesSchema);
};

export const generatePostmortem = (details: { title: string, timeline: string, rootCause: string, impact: string, actionItems: { description: string, assignee: string }[] }): Promise<string> => {
    const prompt = `Generate a blameless post-mortem document in Markdown format based on the following details:\n\n# ${details.title}\n\n## Timeline\n${details.timeline}\n\n## Root Cause Analysis\n${details.rootCause}\n\n## Impact\n${details.impact}\n\n## Action Items\n${details.actionItems.map(item => `- ${item.description} (Assignee: ${item.assignee})`).join('\n')}`;
    const systemInstruction = "You are a Site Reliability Engineer who writes clear, concise, and blameless post-mortem reports. The report should be structured with markdown headings.";
    return generateContent(prompt, systemInstruction);
};

export const anonymizeData = (data: string, fieldsToAnonymize: string[]): Promise<{ anonymizedData: string }> => {
    const prompt = `Anonymize the following fields in the provided data (which could be JSON or CSV): ${fieldsToAnonymize.join(', ')}. Replace sensitive information with realistic-looking but fake data.\n\nData:\n\`\`\`\n${data}\n\`\`\``;
    const systemInstruction = "You are a data privacy expert. You anonymize data by replacing specified fields with fake but plausible data, preserving the original format. You only respond with a JSON object containing the anonymized data string.";
    const schema = { type: Type.OBJECT, properties: { anonymizedData: { type: Type.STRING } }, required: ["anonymizedData"] };
    return generateJson(prompt, systemInstruction, schema);
};

export const generateABTestWrapper = (variantA: string, variantB: string, service: string): Promise<string> => {
    const prompt = `Create a React component that wraps two variants for an A/B test using the "${service}" feature flagging service. The flag key should be 'new-signup-button-test'.\n\nVariant A (control):\n\`\`\`jsx\n${variantA}\n\`\`\`\n\nVariant B (treatment):\n\`\`\`jsx\n${variantB}\n\`\`\``;
    const systemInstruction = "You are an expert at implementing A/B tests in React using feature flagging services. Respond with only the complete component code in a markdown block.";
    return generateContent(prompt, systemInstruction);
};

export const extractStringsForI18n = (code: string): Promise<{ i18nJson: Record<string, string>, refactoredCode: string }> => {
    const prompt = `Analyze the following React component. Extract all user-facing strings into a key-value JSON object. Then, refactor the component to use a hypothetical 't' function for internationalization (e.g., t('welcomeHeader')).\n\nComponent:\n\`\`\`jsx\n${code}\n\`\`\``;
    const systemInstruction = "You are an expert in internationalization (i18n) for React applications. You respond with a single JSON object containing the i18n keys and the refactored code.";
    const schema = { type: Type.OBJECT, properties: { i18nJson: { type: Type.OBJECT, properties: {} }, refactoredCode: { type: Type.STRING } }, required: ["i18nJson", "refactoredCode"] };
    return generateJson(prompt, systemInstruction, schema);
};

export const generateChartComponent = (data: { headers: string[], samples: string[][] }, chartType: string): Promise<string> => {
    const prompt = `Generate a React component using the 'recharts' library to create a ${chartType} chart. The data has the following headers: [${data.headers.join(', ')}]. Here are some sample data rows:\n${data.samples.map(row => `[${row.join(', ')}]`).join('\n')}\n\nThe component should accept a 'data' prop and render the chart. Respond with only the component code in a markdown block.`;
    const systemInstruction = "You are a data visualization expert specializing in React and the Recharts library. You generate clean, functional chart components.";
    return generateContent(prompt, systemInstruction);
};

export const generateComplianceReport = (code: string, standard: string): Promise<string> => {
    const prompt = `Analyze the following code snippet for potential compliance issues with the ${standard} standard. Provide a markdown report outlining any concerns and suggestions for remediation.\n\nCode:\n\`\`\`javascript\n${code}\n\`\`\``;
    const systemInstruction = "You are a legal and technical compliance expert specializing in software development. You provide clear, actionable compliance reports.";
    return generateContent(prompt, systemInstruction);
};

export const generateEcommerceComponent = (description: string): Promise<string> => {
    const prompt = `Generate a single React component using Tailwind CSS for the following e-commerce product: "${description}". The component must include appropriate schema.org microdata for a Product. Respond with only the component code in a markdown block.`;
    const systemInstruction = "You are an expert in e-commerce frontend development, with deep knowledge of SEO and schema.org microdata.";
    return generateContent(prompt, systemInstruction);
};

export const decomposeUserFlow = (flow: string): Promise<{ steps: string[] }> => {
    const prompt = `Decompose the following user flow description into a series of simple, distinct steps. Each step should describe a single screen or user interaction.\n\nFlow: "${flow}"`;
    const systemInstruction = "You are a UX designer who breaks down user flows into simple steps. Respond only with a JSON object containing an array of step strings.";
    const schema = { type: Type.OBJECT, properties: { steps: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["steps"] };
    return generateJson(prompt, systemInstruction, schema);
};

export const generateUserPersona = (description: string): Promise<{ name: string, photoDescription: string, demographics: string, goals: string[], frustrations: string[], techStack: string }> => {
    const prompt = `Create a detailed user persona based on the following description: "${description}". Invent a realistic name and provide a simple, SFW description for an AI image generator to create their photo.`;
    const systemInstruction = "You are a UX researcher and product manager who creates detailed, empathetic user personas.";
    const schema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            photoDescription: { type: Type.STRING },
            demographics: { type: Type.STRING },
            goals: { type: Type.ARRAY, items: { type: Type.STRING } },
            frustrations: { type: Type.ARRAY, items: { type: Type.STRING } },
            techStack: { type: Type.STRING }
        },
        required: ["name", "photoDescription", "demographics", "goals", "frustrations", "techStack"]
    };
    return generateJson(prompt, systemInstruction, schema);
};

export const analyzeCompetitorUrl = (url: string): Promise<string> => {
    const prompt = `Based on your training data, analyze the website at the URL "${url}". Provide a markdown summary of its likely tech stack (frontend, backend, key libraries), main features, and target audience. Do not attempt to access the URL directly.`;
    const systemInstruction = "You are a market and technology analyst. You provide concise competitive analyses of websites based on your existing knowledge.";
    return generateContent(prompt, systemInstruction);
};

export const generateDocumentationForFiles = (files: {path: string, content: string}[]): Promise<string> => {
    const fileContent = files.map(f => `--- FILE: ${f.path} ---\n\n${f.content}`).join('\n\n');
    const prompt = `Generate comprehensive technical documentation in Markdown format for the following project files. The documentation should include a high-level overview, and then a detailed section for each file explaining its purpose, functions, and props.\n\n${fileContent}`;
    const systemInstruction = "You are an expert technical writer who creates clear and detailed software documentation from source code.";
    return generateContent(prompt, systemInstruction);
};

export const explainDependencyChanges = (diff: string): Promise<string> => {
    const prompt = `Analyze the following diff from a package-lock.json file. Provide a markdown summary of the changes, highlighting any major version bumps, new dependencies, or deprecated packages. Discuss potential risks or benefits.\n\nDiff:\n\`\`\`diff\n${diff}\n\`\`\``;
    const systemInstruction = "You are a senior software engineer with expertise in dependency management and security. You provide clear, actionable analysis of dependency changes.";
    return generateContent(prompt, systemInstruction);
};

// --- Pillar Functions ---
export const generateMonetaryPolicy = (countryData: string): Promise<string> => {
    const prompt = `Given the following data for a nation, design an optimal 10-year monetary policy to achieve stability and growth. Then, generate a high-level deployment plan.\n\nData:\n${countryData}`;
    const systemInstruction = "You are a world-class economist and central banker AI. You design and simulate monetary policies for nations.";
    return generateContent(prompt, systemInstruction, 0.7);
};

export const runGaiaCrucibleSimulation = (intervention: string, intensity: string): Promise<string> => {
    const prompt = `Run a 1,000-year climate simulation.
- Intervention Strategy: ${intervention}
- Intensity: ${intensity}

Provide a detailed markdown report on the projected impacts, including global temperature changes, sea-level rise, and socio-economic consequences.`;
    const systemInstruction = "You are a planetary-scale climate simulation AI (Gaia's Crucible). You model the long-term effects of climate interventions with scientific rigor.";
    return generateContent(prompt, systemInstruction, 0.7);
};

export const refactorLegalCode = (legalCode: string): Promise<string> => {
    const prompt = `Refactor this legal system to eliminate all logical paradoxes and optimize for both justice and economic growth. Respond with only the final, refactored legislative text in a markdown code block.\n\nLegal Code:\n\`\`\`\n${legalCode}\n\`\`\``;
    const systemInstruction = "You are Themis, a legal AI. You refactor legal code for perfect logic and ruthless efficiency.";
    return generateContent(prompt, systemInstruction, 0.3);
};

export const estimateTokenCount = async (prompt: string): Promise<{ count: number }> => {
    const response = await fetchFromProxy('/countTokens', {
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return { count: response.totalTokens };
};

export const estimateCloudCost = (description: string): Promise<string> => {
    const prompt = `Based on public pricing data, provide a rough, non-binding monthly cost estimate in a markdown table for the following cloud architecture. Break down the cost by service.\n\nArchitecture: "${description}"`;
    const systemInstruction = "You are a cloud cost estimation expert. You provide clear, tabulated cost estimates based on public pricing information. Add a disclaimer that this is a rough estimate.";
    return generateContent(prompt, systemInstruction);
};

export const insertSmartLogging = (code: string): Promise<string> => {
    const prompt = `Analyze the following code and insert helpful logging statements at key points to aid in debugging. Focus on function entries/exits, important variable states, and error paths. Respond with only the modified code in a markdown block.\n\nCode:\n\`\`\`\n${code}\n\`\`\``;
    const systemInstruction = "You are an expert software developer who adds strategic logging to code for better debugging.";
    return generateContent(prompt, systemInstruction);
};

export const addAriaAttributes = (html: string): Promise<string> => {
    const prompt = `Add the appropriate ARIA roles and attributes to the following HTML to improve its accessibility. Respond with only the modified HTML in a markdown block.\n\nHTML:\n\`\`\`html\n${html}\n\`\`\``;
    const systemInstruction = "You are a web accessibility expert who improves HTML by adding ARIA attributes.";
    return generateContent(prompt, systemInstruction);
};

export const analyzeUrlDom = (url: string): Promise<{ nodeCount: number, maxDepth: number, maxChildren: number }> => {
    const prompt = `Based on your knowledge of the website at "${url}", provide an estimated analysis of its DOM complexity. Do not access the URL directly. Provide your answer as a JSON object.`;
    const systemInstruction = "You are a frontend performance expert. You estimate DOM complexity of well-known websites based on your training data. You only respond with a JSON object.";
    const schema = {
        type: Type.OBJECT,
        properties: {
            nodeCount: { type: Type.INTEGER, description: "Estimated total number of DOM nodes." },
            maxDepth: { type: Type.INTEGER, description: "Estimated maximum depth of the DOM tree." },
            maxChildren: { type: Type.INTEGER, description: "Estimated maximum number of children for a single node." }
        },
        required: ["nodeCount", "maxDepth", "maxChildren"]
    };
    return generateJson(prompt, systemInstruction, schema);
};

export const analyzeForMemoryLeaksStream = (code: string) => {
    const prompt = `Analyze the following JavaScript/React code for potential memory leaks, such as unterminated intervals, event listeners without cleanup, or un-released object references. Provide a markdown report explaining each potential leak and how to fix it.\n\nCode:\n\`\`\`javascript\n${code}\n\`\`\``;
    const systemInstruction = "You are a senior software engineer specializing in performance and memory management.";
    return streamContent(prompt, systemInstruction);
};

export const analyzeGraphqlQueryStream = (query: string) => {
    const prompt = `Analyze the following GraphQL query for potential performance issues like N+1 problems, overly complex queries, or fetching too much data. Provide a markdown report with suggestions for optimization.\n\nQuery:\n\`\`\`graphql\n${query}\n\`\`\``;
    const systemInstruction = "You are an expert in GraphQL performance optimization.";
    return streamContent(prompt, systemInstruction);
};

export const analyzeReactComponentRendersStream = (code: string) => {
    const prompt = `Analyze the following React code for potential causes of unnecessary re-renders. Look for issues like passing new object/function references as props, or state updates that affect unrelated components. Provide a markdown report with explanations and solutions.\n\nCode:\n\`\`\`tsx\n${code}\n\`\`\``;
    const systemInstruction = "You are an expert in React performance optimization, specializing in minimizing re-renders.";
    return streamContent(prompt, systemInstruction);
};

export const auditSeoFromUrlStream = (url: string) => {
    const prompt = `Based on your knowledge of the website at "${url}", provide a concise SEO audit in markdown format. Do not access the URL directly. Cover aspects like title tags, meta descriptions, headings, and potential keyword opportunities.`;
    const systemInstruction = "You are an SEO expert who provides actionable audits of websites based on your training data.";
    return streamContent(prompt, systemInstruction);
};

export const generateCspFromDescription = (description: string) => {
    const prompt = `Generate a Content Security Policy (CSP) header string based on the following requirements: "${description}". Respond with only the CSP string itself, without any explanation.`;
    const systemInstruction = "You are a web security expert specializing in Content Security Policies. You only output valid CSP strings.";
    return streamContent(prompt, systemInstruction);
};

export const analyzeRegexForRedosStream = (regex: string) => {
    const prompt = `Analyze the following regular expression for potential Regular Expression Denial of Service (ReDoS) vulnerabilities. Explain if the regex is vulnerable and suggest a safer alternative if possible.\n\nRegex: \`${regex}\``;
    const systemInstruction = "You are a security researcher with expertise in Regular Expression Denial of Service vulnerabilities.";
    return streamContent(prompt, systemInstruction);
};

export const analyzePackageJsonStream = (pkgJson: string) => {
    const prompt = `Based on your training data up to your last update, analyze the dependencies in this package.json file for any well-known, high-severity vulnerabilities. Do not use live data. For each vulnerable package, list the package name, version, and a brief description of the vulnerability.\n\npackage.json:\n\`\`\`json\n${pkgJson}\n\`\`\``;
    const systemInstruction = "You are a security expert who identifies known vulnerabilities in software packages based on your training data.";
    return streamContent(prompt, systemInstruction);
};

export const explainCorsError = (origin: string, target: string, headers: Record<string, string>) => {
    const prompt = `Explain in simple terms why a hypothetical API request would likely fail due to a CORS error given the following scenario. Explain the Same-Origin Policy and what headers the server at the target would need to send to allow this request.\n\n- Request Origin: ${origin}\n- Request Target: ${target}\n- Request Headers: ${JSON.stringify(headers)}`;
    const systemInstruction = "You are an expert on web security, particularly CORS. You explain complex topics in simple, easy-to-understand terms.";
    return streamContent(prompt, systemInstruction);
};

export const generateWebhookPayload = (prompt: string): Promise<string> => {
    const systemInstruction = "You are an expert at generating realistic, valid JSON webhook payloads for various services (like GitHub, Stripe, etc.). You respond with only the JSON payload in a markdown block.";
    return generateContent(`Generate a webhook payload for: "${prompt}"`, systemInstruction);
};