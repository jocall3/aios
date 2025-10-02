// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { LinkIcon, ServerStackIcon, BugAntIcon, ShareIcon } from '../icons';
import { useNotification } from '../../contexts/NotificationContext';
import { LoadingSpinner } from '../shared/LoadingSpinner';

// --- SELF-CONTAINED AI & SIMULATION LOGIC ---

type ArsenalModule = 'path-traversal' | 'subdomain-enum' | 'param-fuzz';
type NodeStatus = 'probed' | 'vulnerable' | 'dead' | 'unprobed';
type NodeType = 'ROOT' | 'PATH' | 'SUBDOMAIN' | 'PARAM';

interface AttackGraphNode {
    id: string;
    label: string;
    type: NodeType;
    status: NodeStatus;
    x: number;
    y: number;
    description?: string;
}

interface AttackGraphEdge {
    from: string;
    to: string;
}

// SIMULATED AI SERVICE - ALL LOGIC IS CONTAINED WITHIN THIS COMPONENT
const useArsenalAI = () => {
    const simulateAIOperation = <T,>(result: T, delay: number = 1500): Promise<T> => {
        return new Promise(resolve => setTimeout(() => resolve(result), delay + Math.random() * 500));
    };

    const probePath = async (url: URL, pathSegment: string): Promise<boolean> => {
        // Simulate checking if a path like /api/v1 exists
        return simulateAIOperation(Math.random() > 0.4);
    };
    
    const probeSubdomain = async (domain: string, subdomain: string): Promise<boolean> => {
        return simulateAIOperation(Math.random() > 0.85); // Subdomains are rarer
    };

    const fuzzParameter = async (url: URL, param: string): Promise<{ vulnerable: boolean, exploit: string }> => {
        const isVulnerable = Math.random() > 0.7;
        const exploits = ['SQL Injection', 'Cross-Site Scripting (XSS)', 'Path Traversal'];
        return simulateAIOperation({ vulnerable: isVulnerable, exploit: exploits[Math.floor(Math.random()*exploits.length)] });
    };

    return { probePath, probeSubdomain, fuzzParameter };
};


// --- ATTACK GRAPH VISUALIZATION ---
const AttackSurfaceGraph: React.FC<{ nodes: AttackGraphNode[], edges: AttackGraphEdge[] }> = ({ nodes, edges }) => {
    const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);
    const nodeStatusStyles: Record<NodeStatus, string> = {
        probed: 'bg-blue-900 border-blue-400',
        vulnerable: 'bg-red-900 border-red-500 animate-pulse',
        dead: 'bg-gray-800 border-gray-600',
        unprobed: 'bg-gray-600 border-gray-400',
    };
    return (
        <div className="w-full h-full bg-black rounded relative overflow-hidden">
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.3 }}>
                {edges.map(edge => {
                    const from = nodeMap.get(edge.from);
                    const to = nodeMap.get(edge.to);
                    if (!from || !to) return null;
                    return <line key={`${edge.from}-${edge.to}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#475569" strokeWidth="1" />;
                })}
            </svg>
             {nodes.map(node => (
                <div key={node.id}
                     className={`absolute p-2 border-2 rounded text-white text-xs font-bold text-center cursor-pointer transition-all duration-300 ${nodeStatusStyles[node.status]}`}
                     style={{ left: `${node.x}px`, top: `${node.y}px`, transform: 'translate(-50%, -50%)' }}
                     title={node.description || node.label}>
                    {node.label}
                </div>
            ))}
        </div>
    );
};

export const UrlInspector: React.FC = () => {
    const [url, setUrl] = useState('https://api.example.com/v1/users?id=123');
    const [nodes, setNodes] = useState<AttackGraphNode[]>([]);
    const [edges, setEdges] = useState<AttackGraphEdge[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<Partial<Record<ArsenalModule, boolean>>>({});
    const { addNotification } = useNotification();
    const arsenalAI = useArsenalAI();

    const addLog = (message: string) => setLogs(prev => [message, ...prev].slice(0, 100));

    const addNode = (node: AttackGraphNode, parentId?: string) => {
        setNodes(prev => [...prev.filter(n => n.id !== node.id), node]);
        if (parentId) {
            setEdges(prev => [...prev, { from: parentId, to: node.id }]);
        }
    };
    const updateNodeStatus = (nodeId: string, status: NodeStatus, description?: string) => {
        setNodes(prev => prev.map(n => n.id === nodeId ? {...n, status, description: description || n.description } : n));
    };

    const handleNewTarget = useCallback(() => {
        try {
            const parsed = new URL(url);
            setLogs([]); setEdges([]);
            const rootNode: AttackGraphNode = {
                id: parsed.hostname, label: parsed.hostname, type: 'ROOT', status: 'probed',
                x: 400, y: 200, description: `Target Root: ${parsed.hostname}`
            };
            setNodes([rootNode]);
        } catch {
            addNotification("Invalid URL format provided.", "error");
        }
    }, [url, addNotification]);
    
    useEffect(handleNewTarget, []); // Initial setup

    const handlePathTraversal = useCallback(async () => {
        const parsed = new URL(url);
        const parentNode = nodes.find(n => n.type === 'ROOT');
        if(!parentNode) return;

        setIsLoading(prev => ({ ...prev, "path-traversal": true }));
        addLog(`Initiating Path Traversal on ${parsed.hostname}...`);
        
        const paths = parsed.pathname.split('/').filter(Boolean);
        let currentPath = '';
        let lastParentId = parentNode.id;

        for (const [i, path] of paths.entries()) {
            currentPath += `/${path}`;
            const nodeId = `${parsed.hostname}${currentPath}`;
            const x = parentNode.x + (i + 1) * 80;
            const y = parentNode.y + (Math.random() - 0.5) * 100;

            addNode({ id: nodeId, label: path, type: 'PATH', status: 'unprobed', x, y }, lastParentId);
            addLog(`Probing path: ${currentPath}...`);
            const isValid = await arsenalAI.probePath(parsed, currentPath);
            updateNodeStatus(nodeId, isValid ? 'probed' : 'dead');
            addLog(`Path ${currentPath}: ${isValid ? 'VALID (200 OK)' : 'INVALID (404 Not Found)'}`);
            if (isValid) lastParentId = nodeId; else break;
        }

        setIsLoading(prev => ({ ...prev, "path-traversal": false }));
    }, [url, arsenalAI, nodes]);

     const handleSubdomainEnum = useCallback(async () => {
        const parsed = new URL(url);
        const parentNode = nodes.find(n => n.type === 'ROOT');
        if(!parentNode) return;
        setIsLoading(prev => ({...prev, "subdomain-enum": true}));
        addLog(`Initiating Subdomain Enumeration for ${parsed.hostname}...`);
        
        const commonSubs = ['api', 'dev', 'staging', 'mail', 'blog'];
        for(const [i, sub] of commonSubs.entries()) {
            const fullDomain = `${sub}.${parsed.hostname}`;
            const x = parentNode.x + (Math.random() - 0.5) * 300;
            const y = parentNode.y - 150 + (Math.random() - 0.5) * 50;

            addNode({ id: fullDomain, label: sub, type: 'SUBDOMAIN', status: 'unprobed', x, y}, parentNode.id);
            addLog(`Probing subdomain: ${fullDomain}...`);
            const isValid = await arsenalAI.probeSubdomain(parsed.hostname, sub);
            updateNodeStatus(fullDomain, isValid ? 'probed' : 'dead');
            if(isValid) addLog(`Subdomain ${fullDomain}: FOUND`);
        }
        setIsLoading(prev => ({...prev, "subdomain-enum": false}));
     }, [url, arsenalAI, nodes]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center">
                    <LinkIcon />
                    <span className="ml-3">URI Exploitation & Traversal Arsenal</span>
                </h1>
                <p className="text-text-secondary mt-1">Deconstruct and probe a target URI to map its live attack surface.</p>
            </header>
            
            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
                 <div className="md:col-span-1 flex flex-col gap-3">
                    <h3 className="text-xl font-bold">Target Vector & Arsenal</h3>
                     <div className="flex gap-2">
                         <input type="text" value={url} onChange={e => setUrl(e.target.value)} onBlur={handleNewTarget} className="flex-grow p-2 bg-surface border rounded-md font-mono text-sm"/>
                     </div>
                     <div className="grid grid-cols-1 gap-2 p-3 bg-surface border rounded">
                        <button onClick={handlePathTraversal} disabled={isLoading['path-traversal']} className="btn-primary text-sm py-2">Crawl Path Segments</button>
                        <button onClick={handleSubdomainEnum} disabled={isLoading['subdomain-enum']} className="btn-primary text-sm py-2">Enumerate Subdomains</button>
                        <button disabled className="btn-primary text-sm py-2 opacity-50">Fuzz Parameters (WIP)</button>
                     </div>
                      <div className="flex-grow bg-black rounded-lg p-2 min-h-[200px] flex flex-col">
                          <p className="text-xs uppercase font-bold text-red-500 flex-shrink-0">SIGINT STREAM</p>
                          <div className="flex-grow overflow-y-auto font-mono text-xs text-gray-300">
                             {logs.map((log,i)=><p key={i}>{log}</p>)}
                          </div>
                      </div>
                </div>

                <div className="md:col-span-2 flex flex-col min-h-0">
                    <h3 className="text-xl font-bold mb-2">Live Attack Surface Map</h3>
                    <div className="flex-grow bg-surface border rounded-lg overflow-hidden">
                       <AttackSurfaceGraph nodes={nodes} edges={edges} />
                    </div>
                </div>
            </div>
        </div>
    );
};