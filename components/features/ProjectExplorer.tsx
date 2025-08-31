import React, { useState, useEffect, useCallback } from 'react';
import { useGlobalState } from '../../contexts/GlobalStateContext.tsx';
import { useNotification } from '../../contexts/NotificationContext.tsx';
import { initializeOctokit } from '../../services/authService.ts';
import { getDecryptedCredential } from '../../services/vaultService.ts';
import { getRepos, getRepoTree, getFileContent, commitFiles } from '../../services/githubService.ts';
import { generateCommitMessageStream, answerProjectQuestion, generateNewFilesForProject } from '../../services/index.ts';
import type { Repo, FileNode, GeneratedFile } from '../../types.ts';
import { FolderIcon, DocumentIcon, SparklesIcon, XMarkIcon } from '../icons.tsx';
import { LoadingSpinner, MarkdownRenderer } from '../shared/index.tsx';
import * as Diff from 'diff';

const FileTree: React.FC<{ node: FileNode, onFileSelect: (path: string, name: string) => void, activePath: string | null }> = ({ node, onFileSelect, activePath }) => {
    const [isOpen, setIsOpen] = useState(true);

    if (node.type === 'file') {
        const isActive = activePath === node.path;
        return (
            <div
                className={`flex items-center space-x-2 pl-4 py-1 cursor-pointer rounded ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                onClick={() => onFileSelect(node.path, node.name)}
            >
                <DocumentIcon />
                <span>{node.name}</span>
            </div>
        );
    }

    return (
        <div>
            <div
                className="flex items-center space-x-2 py-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className={`transform transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</div>
                <FolderIcon />
                <span className="font-semibold">{node.name}</span>
            </div>
            {isOpen && node.children && (
                <div className="pl-4 border-l border-border ml-3">
                    {node.children.map(child => <FileTree key={child.path} node={child} onFileSelect={onFileSelect} activePath={activePath} />)}
                </div>
            )}
        </div>
    );
};

const GeneratedFilesModal: React.FC<{
    files: GeneratedFile[];
    onClose: () => void;
    onCommit: (commitMessage: string) => void;
    isCommitting: boolean;
}> = ({ files, onClose, onCommit, isCommitting }) => {
    const [commitMessage, setCommitMessage] = useState('');
    const [activeFile, setActiveFile] = useState(files[0]);

    useEffect(() => {
        const generateMessage = async () => {
            const diffContext = files.map(f => `File: ${f.filePath}\n\n${f.content}`).join('\n---\n');
            const stream = generateCommitMessageStream(diffContext);
            let message = '';
            for await (const chunk of stream) {
                message += chunk;
                setCommitMessage(message);
            }
        };
        generateMessage();
    }, [files]);
    
    return (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-surface rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-bold">Generated Files</h2>
                    <button onClick={onClose}><XMarkIcon/></button>
                </header>
                <div className="flex-grow flex min-h-0">
                    <aside className="w-1/3 border-r p-2 overflow-y-auto">
                        <ul>
                            {files.map(f => (
                                <li key={f.filePath} onClick={() => setActiveFile(f)} className={`p-2 rounded cursor-pointer ${activeFile.filePath === f.filePath ? 'bg-primary/10' : ''}`}>{f.filePath}</li>
                            ))}
                        </ul>
                    </aside>
                    <main className="w-2/3 overflow-y-auto">
                        <MarkdownRenderer content={'```\n' + activeFile.content + '\n```'} />
                    </main>
                </div>
                <footer className="p-4 border-t flex gap-4 items-center">
                    <input type="text" value={commitMessage} onChange={e => setCommitMessage(e.target.value)} placeholder="Commit message..." className="flex-grow p-2 bg-background border rounded"/>
                    <button onClick={() => onCommit(commitMessage)} disabled={isCommitting} className="btn-primary px-4 py-2 flex items-center justify-center min-w-[120px]">{isCommitting ? <LoadingSpinner/> : 'Commit to Repo'}</button>
                </footer>
            </div>
        </div>
    )
}

const AiAssistantPanel: React.FC<{ 
    projectFiles: FileNode | null;
    onFilesGenerated: (files: GeneratedFile[]) => void;
}> = ({ projectFiles, onFilesGenerated }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [tab, setTab] = useState<'ask' | 'generate'>('ask');
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState('');

    const handleSubmit = async () => {
        if (!prompt.trim() || !projectFiles) return;
        setIsLoading(true);
        setResult('');

        try {
            if (tab === 'ask') {
                const stream = answerProjectQuestion(prompt, projectFiles);
                let fullResponse = '';
                for await (const chunk of stream) {
                    fullResponse += chunk;
                    setResult(fullResponse);
                }
            } else {
                const files = await generateNewFilesForProject(prompt, projectFiles);
                onFilesGenerated(files);
            }
        } catch (e) {
            setResult(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
            setPrompt('');
        }
    };
    
    return (
        <div className="flex-shrink-0 bg-surface border-t border-border">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full p-2 text-left text-sm font-semibold flex items-center justify-between">
                <span><SparklesIcon/> AI Project Assistant</span>
                <span>{isOpen ? '▼' : '▲'}</span>
            </button>
            {isOpen && (
                <div className="p-4 border-t">
                    <div className="flex border-b mb-2">
                        <button onClick={() => setTab('ask')} className={`px-3 py-1 text-sm ${tab === 'ask' ? 'border-b-2 border-primary' : ''}`}>Ask AI</button>
                        <button onClick={() => setTab('generate')} className={`px-3 py-1 text-sm ${tab === 'generate' ? 'border-b-2 border-primary' : ''}`}>Generate Files</button>
                    </div>
                    {result && tab === 'ask' && <div className="p-2 bg-background rounded mb-2 max-h-48 overflow-y-auto"><MarkdownRenderer content={result} /></div>}
                    <div className="flex gap-2">
                        <input value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} placeholder={tab === 'ask' ? 'e.g., Where is the auth logic?' : 'e.g., Create a new utility file with a date formatting function.'} className="flex-grow p-2 text-sm bg-background border rounded"/>
                        <button onClick={handleSubmit} disabled={isLoading} className="btn-primary px-4 py-1 text-sm">{isLoading ? <LoadingSpinner/> : 'Send'}</button>
                    </div>
                </div>
            )}
        </div>
    )
};


export const ProjectExplorer: React.FC = () => {
    const { state, dispatch } = useGlobalState();
    const { user, githubUser, selectedRepo, projectFiles } = state;
    const { addNotification } = useNotification();
    const [repos, setRepos] = useState<Repo[]>([]);
    const [isLoading, setIsLoading] = useState<'repos' | 'tree' | 'file' | 'commit' | null>(null);
    const [error, setError] = useState('');
    const [activeFile, setActiveFile] = useState<{ path: string; name: string; originalContent: string; editedContent: string} | null>(null);
    const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[] | null>(null);
    
    const getApiClient = useCallback(async () => {
        if (!user) {
            throw new Error("You must be logged in to use the Project Explorer.");
        }
        const token = await getDecryptedCredential('github_pat');
        if (!token) {
            throw new Error("GitHub token not found. Please add it on the Connections page.");
        }
        return initializeOctokit(token);
    }, [user]);


    useEffect(() => {
        const loadRepos = async () => {
            if (user && githubUser) {
                setIsLoading('repos');
                setError('');
                try {
                    const octokit = await getApiClient();
                    const userRepos = await getRepos(octokit);
                    setRepos(userRepos);
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to load repositories');
                } finally {
                    setIsLoading(null);
                }
            } else {
                setRepos([]);
            }
        };
        loadRepos();
    }, [user, githubUser, getApiClient]);

    useEffect(() => {
        const loadTree = async () => {
             if (selectedRepo && user && githubUser) {
                setIsLoading('tree');
                setError('');
                setActiveFile(null);
                try {
                    const octokit = await getApiClient();
                    const tree = await getRepoTree(octokit, selectedRepo.owner, selectedRepo.repo);
                    dispatch({ type: 'LOAD_PROJECT_FILES', payload: tree });
                } catch (err) {
                     setError(err instanceof Error ? err.message : 'Failed to load repository tree');
                } finally {
                    setIsLoading(null);
                }
            }
        };
        loadTree();
    }, [selectedRepo, user, githubUser, dispatch, getApiClient]);

    const handleFileSelect = async (path: string, name: string) => {
        if (!selectedRepo) return;
        setIsLoading('file');
        try {
            const octokit = await getApiClient();
            const content = await getFileContent(octokit, selectedRepo.owner, selectedRepo.repo, path);
            setActiveFile({ path, name, originalContent: content, editedContent: content });
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(null);
        }
    };

    const handleCommit = async () => {
        if (!activeFile || !selectedRepo || activeFile.originalContent === activeFile.editedContent) return;

        setIsLoading('commit');
        setError('');
        try {
            const diff = Diff.createPatch(activeFile.path, activeFile.originalContent, activeFile.editedContent);
            
            const stream = generateCommitMessageStream(diff);
            let commitMessage = '';
            for await (const chunk of stream) { commitMessage += chunk; }
            
            const finalMessage = window.prompt("Confirm or edit commit message:", commitMessage);
            if (!finalMessage) {
                setIsLoading(null);
                return;
            }

            const octokit = await getApiClient();
            await commitFiles(
                octokit,
                selectedRepo.owner,
                selectedRepo.repo,
                [{ path: activeFile.path, content: activeFile.editedContent }],
                finalMessage
            );
            
            addNotification(`Successfully committed to ${selectedRepo.repo}`, 'success');
            setActiveFile(prev => prev ? { ...prev, originalContent: prev.editedContent } : null);

        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to commit changes';
            setError(message);
            addNotification(message, 'error');
        } finally {
            setIsLoading(null);
        }
    };

     const handleCommitGeneratedFiles = async (commitMessage: string) => {
        if (!generatedFiles || !selectedRepo) return;
        setIsLoading('commit');
        try {
             const octokit = await getApiClient();
             await commitFiles(
                octokit,
                selectedRepo.owner,
                selectedRepo.repo,
                generatedFiles.map(f => ({ path: f.filePath, content: f.content })),
                commitMessage
             );
             addNotification(`Successfully committed ${generatedFiles.length} new files!`, 'success');
             setGeneratedFiles(null);
             // Reload tree
             const tree = await getRepoTree(octokit, selectedRepo.owner, selectedRepo.repo);
             dispatch({ type: 'LOAD_PROJECT_FILES', payload: tree });
        } catch (err) {
            addNotification(err instanceof Error ? err.message : 'Failed to commit', 'error');
        } finally {
            setIsLoading(null);
        }
    };
    
    if (!user) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center text-text-secondary p-4">
                <FolderIcon />
                <h2 className="text-lg font-semibold mt-2">Please Sign In</h2>
                <p>Sign in via the "Connections" tab to explore your repositories.</p>
            </div>
        );
    }
    
    if (!githubUser) {
         return (
            <div className="h-full flex flex-col items-center justify-center text-center text-text-secondary p-4">
                <FolderIcon />
                <h2 className="text-lg font-semibold mt-2">Connect to GitHub</h2>
                <p>Please go to the "Connections" tab and provide a Personal Access Token to explore your repositories.</p>
            </div>
        );
    }

    const hasChanges = activeFile ? activeFile.originalContent !== activeFile.editedContent : false;

    return (
        <div className="h-full flex flex-col text-text-primary">
            {generatedFiles && <GeneratedFilesModal files={generatedFiles} onClose={() => setGeneratedFiles(null)} onCommit={handleCommitGeneratedFiles} isCommitting={isLoading === 'commit'}/>}
            <header className="p-4 border-b border-border flex-shrink-0">
                <h1 className="text-xl font-bold flex items-center"><FolderIcon /><span className="ml-3">Project Explorer</span></h1>
                <div className="mt-2">
                    <select
                        value={selectedRepo ? `${selectedRepo.owner}/${selectedRepo.repo}` : ''}
                        onChange={e => {
                            const [owner, repo] = e.target.value.split('/');
                            dispatch({ type: 'SET_SELECTED_REPO', payload: { owner, repo } });
                        }}
                        className="w-full p-2 bg-surface border border-border rounded-md text-sm"
                    >
                        <option value="" disabled>{isLoading === 'repos' ? 'Loading...' : 'Select a repository'}</option>
                        {repos.map(r => <option key={r.id} value={r.full_name}>{r.full_name}</option>)}
                    </select>
                </div>
                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            </header>
            <div className="flex-grow flex min-h-0">
                <aside className="w-1/3 bg-background border-r border-border p-4 overflow-y-auto">
                    {isLoading === 'tree' && <div className="flex justify-center"><LoadingSpinner /></div>}
                    {projectFiles && <FileTree node={projectFiles} onFileSelect={handleFileSelect} activePath={activeFile?.path ?? null} />}
                </aside>
                <main className="flex-1 bg-surface flex flex-col">
                     <div className="flex justify-between items-center p-2 border-b border-border bg-gray-50 dark:bg-slate-800">
                        <span className="text-sm font-semibold">{activeFile?.name || 'No file selected'}</span>
                        <button onClick={handleCommit} disabled={!hasChanges || isLoading === 'commit'} className="btn-primary px-4 py-1 text-sm flex items-center justify-center min-w-[100px]">
                           {isLoading === 'commit' ? <LoadingSpinner/> : 'Commit'}
                        </button>
                     </div>
                     {isLoading === 'file' ? <div className="flex items-center justify-center h-full"><LoadingSpinner /></div> :
                        <textarea 
                            value={activeFile?.editedContent ?? 'Select a file to view its content.'}
                            onChange={e => setActiveFile(prev => prev ? { ...prev, editedContent: e.target.value } : null)}
                            disabled={!activeFile}
                            className="w-full h-full p-4 text-sm font-mono bg-transparent resize-none focus:outline-none"
                        />
                    }
                </main>
            </div>
            <AiAssistantPanel projectFiles={projectFiles} onFilesGenerated={setGeneratedFiles} />
        </div>
    );
};