// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useGlobalState } from '../../contexts/GlobalStateContext';
import { getDecryptedCredential, initializeOctokit, getFileContent, commitFiles } from '../../services'; // Using monolithic index
import { generateCronFromDescription, CronParts } from '../../services';
import { LoadingSpinner } from '../shared';
import { CommandLineIcon, SparklesIcon, GitBranchIcon, PlusIcon, TrashIcon } from '../icons';

type ScheduledTask = { id: string; cron: string; description: string; action: 'execute_ai_command'; payload: string; };

const WORKFLOW_PATH = '.github/workflows/reality_engine_scheduler.yml';
const CRONTAB_PATH = 'crontab.reality-engine.json';

const GITHUB_WORKFLOW_TEMPLATE = `
name: Reality Engine Command Scheduler
on:
  workflow_dispatch:
  schedule:
    - cron: '0 * * * *' # Runs every hour on the hour
jobs:
  execute-scheduled-tasks:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
      - name: Execute Engine Commands
        run: |
          # In a real implementation, this script would parse crontab.json,
          # check the cron schedule against the current time, and if it matches,
          # make a cURL request to a secure Reality Engine API endpoint.
          echo "Simulating cron execution..."
          echo "Current UTC Hour: $(date -u +'%H')"
          cat ${CRONTAB_PATH} || echo "No crontab found."
`;

export const CronJobBuilder: React.FC = () => {
    const { state } = useGlobalState();
    const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
    const [cronExpression, setCronExpression] = useState('0 * * * *');
    const [description, setDescription] = useState('Daily project summary');
    const [payload, setPayload] = useState('Summarize todays commits and post to Slack #dev-log');
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
    
    const loadCrontab = useCallback(async () => {
        if (!state.user || !state.githubUser || !state.selectedRepo) return;
        setIsLoading(p => ({ ...p, sync: true }));
        try {
            const token = await getDecryptedCredential('github_pat');
            const octokit = initializeOctokit(token!);
            const content = await getFileContent(octokit, state.selectedRepo.owner, state.selectedRepo.repo, CRONTAB_PATH);
            setScheduledTasks(JSON.parse(content));
        } catch {
            setScheduledTasks([]); // File doesn't exist yet, which is fine
        } finally {
            setIsLoading(p => ({ ...p, sync: false }));
        }
    }, [state.user, state.githubUser, state.selectedRepo]);

    useEffect(() => { loadCrontab() }, [loadCrontab]);

    const handleScheduleTask = async () => {
        if (!state.selectedRepo || !description || !payload) return;
        setIsLoading(p => ({ ...p, schedule: true }));
        try {
            const newTask: ScheduledTask = { id: `task_${Date.now()}`, cron: cronExpression, description, action: 'execute_ai_command', payload };
            const updatedTasks = [...scheduledTasks, newTask];

            const token = await getDecryptedCredential('github_pat');
            const octokit = initializeOctokit(token!);
            
            await commitFiles(octokit, state.selectedRepo.owner, state.selectedRepo.repo, [
                { path: CRONTAB_PATH, content: JSON.stringify(updatedTasks, null, 2) },
                { path: WORKFLOW_PATH, content: GITHUB_WORKFLOW_TEMPLATE }
            ], `[REALITY ENGINE] Schedule new task: ${description}`);
            
            setScheduledTasks(updatedTasks);
            setDescription(''); setPayload('');
        } catch(e) { console.error(e); } 
        finally { setIsLoading(p => ({ ...p, schedule: false })); }
    };
    
    if (!state.user || !state.githubUser || !state.selectedRepo) {
        return <div className="p-8 text-center">Please connect to Google & GitHub and select a repository in the Project Explorer to use the Cron Orchestrator.</div>;
    }

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><CommandLineIcon /><span className="ml-3">Distributed Cron & GitHub Actions Orchestrator</span></h1>
                <p className="text-text-secondary mt-1">Schedule commands to be executed by a decentralized network agent hosted in your own repository.</p>
            </header>
             <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col gap-3 min-h-0">
                    <h3 className="font-bold text-lg">New Task Manifest</h3>
                    <div className="bg-surface p-3 border rounded-lg space-y-3">
                         <input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Task Description (e.g., 'Daily summary')" className="w-full p-2 bg-background border"/>
                        <textarea value={payload} onChange={e=>setPayload(e.target.value)} placeholder="AI Command Payload..." className="w-full h-24 p-2 bg-background border font-mono text-sm"/>
                        <div className="flex items-center gap-2">
                             <input value={cronExpression} onChange={e=>setCronExpression(e.target.value)} placeholder="Cron Expression" className="flex-grow p-2 bg-background border font-mono text-sm"/>
                              <button className="btn-primary p-2"><SparklesIcon/></button>
                        </div>
                         <button onClick={handleScheduleTask} disabled={isLoading.schedule} className="btn-primary w-full py-2">
                            {isLoading.schedule ? <LoadingSpinner/> : "Schedule Command"}
                         </button>
                    </div>
                </div>
                <div className="flex flex-col min-h-0">
                     <div className="flex justify-between items-center mb-2">
                         <h3 className="font-bold text-lg">Scheduled Task Ledger <span className="font-mono text-xs text-primary">{state.selectedRepo.owner}/{state.selectedRepo.repo}</span></h3>
                         <button onClick={loadCrontab} disabled={isLoading.sync}>{isLoading.sync ? <LoadingSpinner/> : <GitBranchIcon />}</button>
                    </div>
                     <div className="flex-grow bg-background border rounded-lg p-3 overflow-y-auto space-y-2">
                        {scheduledTasks.map(task => (
                             <div key={task.id} className="bg-surface p-2 border rounded">
                                 <p className="font-bold text-sm flex justify-between">{task.description}<span className="font-mono text-primary text-xs">{task.cron}</span></p>
                                <p className="font-mono text-xs mt-1 text-text-secondary">{task.payload}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};