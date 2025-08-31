import React, { useState, useCallback } from 'react';
import { generateDocumentationForFiles } from '../../services/aiService.ts';
import { useGlobalState } from '../../contexts/GlobalStateContext.tsx';
import type { FileNode } from '../../types.ts';
import { DocumentTextIcon, FolderIcon } from '../icons.tsx';
import { LoadingSpinner, MarkdownRenderer } from '../shared/index.tsx';
import { useNotification } from '../../contexts/NotificationContext.tsx';
import { getDecryptedCredential } from '../../services/vaultService.ts';
import { initializeOctokit } from '../../services/authService.ts';
import { getFileContent } from '../../services/githubService.ts';

const FileTreeSelector: React.FC<{ node: FileNode, selectedPaths: Set<string>, onToggle: (path: string, isFolder: boolean) => void }> = ({ node, selectedPaths, onToggle }) => {
    const [isOpen, setIsOpen] = useState(true);
    const isSelected = selectedPaths.has(node.path);

    const handleToggle = () => {
        onToggle(node.path, node.type === 'folder');
    };

    if (node.type === 'file') {
        return (
            <div className="flex items-center space-x-2 pl-4 py-1">
                <input type="checkbox" checked={isSelected} onChange={handleToggle} className="w-4 h-4 rounded text-primary focus:ring-primary" />
                <DocumentTextIcon />
                <span>{node.name}</span>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center space-x-2 py-1">
                <input type="checkbox" checked={isSelected} onChange={handleToggle} className="w-4 h-4 rounded text-primary focus:ring-primary"/>
                <button onClick={() => setIsOpen(!isOpen)} className={`transform transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</button>
                <FolderIcon />
                <span className="font-semibold">{node.name}</span>
            </div>
            {isOpen && node.children && (
                <div className="pl-4 border-l border-border ml-3">
                    {node.children.map(child => <FileTreeSelector key={child.path} node={child} selectedPaths={selectedPaths} onToggle={onToggle} />)}
                </div>
            )}
        </div>
    );
};


export const CodeDocumentationWriter: React.FC = () => {
    const { state } = useGlobalState();
    const { projectFiles, selectedRepo, user } = state;
    const [selectedPaths, setSelectedPaths] = useState(new Set<string>());
    const [documentation, setDocumentation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { addNotification } = useNotification();
    
    const getApiClient = useCallback(async () => {
        if (!user) {
            throw new Error("You must be logged in.");
        }
        const token = await getDecryptedCredential('github_pat');
        if (!token) {
            throw new Error("GitHub token not found. Please connect on the Connections page.");
        }
        return initializeOctokit(token);
    }, [user]);
    
    const findNodeByPath = (node: FileNode, path: string): FileNode | null => {
        if (node.path === path) return node;
        if (node.children) {
            for (const child of node.children) {
                const found = findNodeByPath(child, path);
                if (found) return found;
            }
        }
        return null;
    }

    const handleGenerate = async () => {
        if (selectedPaths.size === 0) {
            addNotification('Please select files to document.', 'error');
            return;
        }
        setIsLoading(true);
        setDocumentation('');
        try {
            if (!selectedRepo) {
                throw new Error('Please select a repository first.');
            }

            const pathsToFetch = Array.from(selectedPaths)
                .filter(path => path && projectFiles && findNodeByPath(projectFiles, path)?.type === 'file');

            if (pathsToFetch.length === 0) {
                addNotification('Please select specific files to document.', 'info');
                setIsLoading(false);
                return;
            }

            if (pathsToFetch.length > 10) {
                addNotification('For performance reasons, please select 10 files or fewer.', 'info');
                setIsLoading(false);
                return;
            }
            
            const octokit = await getApiClient();

            const filePromises = pathsToFetch.map(path => 
                getFileContent(octokit, selectedRepo.owner, selectedRepo.repo, path)
                    .then(content => ({ path, content }))
                    .catch(err => {
                        console.error(`Failed to fetch ${path}`, err);
                        return { path, content: `// Error fetching content for this file.` };
                    })
            );
            
            const filesToDocument = await Promise.all(filePromises);

            const result = await generateDocumentationForFiles(filesToDocument);
            setDocumentation(result);
            addNotification('Documentation generated!', 'success');
        } catch (err) {
            addNotification(err instanceof Error ? err.message : 'Failed to generate documentation.', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const getAllChildPaths = (node: FileNode): string[] => {
        let paths = node.type === 'file' ? [node.path] : [];
        if (node.children) {
            paths = paths.concat(...node.children.map(getAllChildPaths));
        }
        return paths;
    };
    
    const handleToggle = (path: string, isFolder: boolean) => {
        const newSelected = new Set(selectedPaths);
        const isSelected = newSelected.has(path);
        
        let pathsToToggle: string[] = [path];
        if (isFolder && projectFiles) {
            const folderNode = findNodeByPath(projectFiles, path);
            if(folderNode) pathsToToggle = [path, ...getAllChildPaths(folderNode)];
        }
        
        if (isSelected) {
            pathsToToggle.forEach(p => newSelected.delete(p));
        } else {
            pathsToToggle.forEach(p => newSelected.add(p));
        }
        setSelectedPaths(newSelected);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center"><DocumentTextIcon /><span className="ml-3">Code Documentation Writer</span></h1>
                <p className="text-text-secondary mt-1">Select files from your project to generate comprehensive documentation.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col">
                     <label className="text-sm font-medium mb-2">Select Files</label>
                     <div className="flex-grow p-2 bg-surface border rounded overflow-auto">
                        {projectFiles ? <FileTreeSelector node={projectFiles} selectedPaths={selectedPaths} onToggle={handleToggle} /> : <p>Load a project in the Project Explorer first.</p>}
                     </div>
                     <button onClick={handleGenerate} disabled={isLoading || selectedPaths.size === 0} className="btn-primary w-full mt-4 py-3">{isLoading ? <LoadingSpinner/> : 'Generate Documentation'}</button>
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-medium mb-2">Generated Documentation</label>
                    <div className="flex-grow p-4 bg-background border rounded overflow-auto">
                        {isLoading ? <div className="flex justify-center items-center h-full"><LoadingSpinner /></div> : <MarkdownRenderer content={documentation} />}
                    </div>
                </div>
            </div>
        </div>
    );
};