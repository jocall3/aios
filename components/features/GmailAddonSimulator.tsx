// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Plane, Image } from '@react-three/drei';
import * as THREE from 'three';
import { activateGoogleService } from '../../services'; // Use the monolithic index
import { distillEmailIntent, forgeActionableCommands } from '../../services/GmailTriageAI'; // Invented
import type { Email, DistilledIntent, ForgedCommand } from '../../types/GmailTriage'; // Invented
import { MailIcon, SparklesIcon } from '../icons';

// --- 3D Holographic Email Card ---
const EmailCard: React.FC<{ email: Email; isActive: boolean; zPos: number }> = ({ email, isActive, zPos }) => {
    const groupRef = useRef<THREE.Group>(null);
    useFrame(() => {
        if (groupRef.current) {
            // Animate card into focus
            groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, zPos, 0.1);
        }
    });
    return (
        <group ref={groupRef}>
            <Plane args={[5, 3]} rotation={[0, -0.2, 0]} material-color="#1e293b" material-opacity={0.8} material-transparent>
                 <Text anchorX="left" position={[-2.3, 1.3, 0.1]} fontSize={0.2} color="white">{email.subject}</Text>
                 <Text anchorX="left" position={[-2.3, 1.0, 0.1]} fontSize={0.15} color="#94a3b8">{`From: ${email.from}`}</Text>
                 <Text anchorX="left" position={[-2.3, 0.7, 0.1]} fontSize={0.1} color="#e2e8f0" maxWidth={4.5} lineHeight={1.5} whiteSpace="overflow-wrap">{email.snippet}</Text>
            </Plane>
        </group>
    );
};

export const GmailAddonSimulator: React.FC = () => {
    const [emails, setEmails] = useState<Email[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [distilledIntent, setDistilledIntent] = useState<DistilledIntent | null>(null);
    const [forgedCommands, setForgedCommands] = useState<ForgedCommand[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const fetchEmails = useCallback(async () => {
        setIsLoading(true);
        try {
            const gmail = await activateGoogleService<{users:{messages:{list:any,get:any}}}>('gmail', 'v1');
            const res = await gmail.users.messages.list({ userId: 'me', maxResults: 5, q: 'is:unread' });
            if (!res.result.messages) { setEmails([]); return; }
            const messagePromises = res.result.messages.map((m: any) => gmail.users.messages.get({ userId: 'me', id: m.id, format: 'metadata' }));
            const messageResults = await Promise.all(messagePromises);
            const fetchedEmails = messageResults.map((r: any): Email => {
                 const headers = r.result.payload.headers;
                 return {
                    id: r.result.id,
                    subject: headers.find((h:any) => h.name === 'Subject')?.value || '',
                    from: headers.find((h:any) => h.name === 'From')?.value || '',
                    snippet: r.result.snippet,
                 };
            });
            setEmails(fetchedEmails);
        } catch(e) { console.error(e); } 
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => { fetchEmails(); }, [fetchEmails]);
    
    useEffect(() => {
        const analyzeEmail = async () => {
            if (!emails[activeIndex]) return;
            setDistilledIntent(null);
            setForgedCommands([]);
            const intent = await distillEmailIntent(emails[activeIndex]);
            setDistilledIntent(intent);
            const commands = await forgeActionableCommands(intent);
            setForgedCommands(commands);
        };
        analyzeEmail();
    }, [activeIndex, emails]);
    
    const handleScroll = (e: React.WheelEvent) => {
        if (e.deltaY > 0) setActiveIndex(i => Math.min(i + 1, emails.length - 1));
        else setActiveIndex(i => Math.max(i - 1, 0));
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><MailIcon /><span className="ml-3">Live Gmail Triage & AI Action Console</span></h1>
                <p className="text-text-secondary mt-1">Interface directly with your live inbox, distill intent, and execute forged commands.</p>
            </header>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
                 <div className="md:col-span-2 flex flex-col min-h-[400px] h-full">
                     <h3 className="text-xl font-bold mb-2">Inbox Stream (Holographic View)</h3>
                      <div className="flex-grow bg-black rounded-lg relative overflow-hidden" onWheel={handleScroll}>
                         {isLoading ? <div className="h-full flex items-center justify-center"><LoadingSpinner/></div> :
                             <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
                                 <ambientLight intensity={1} />
                                 <pointLight position={[0, 5, 10]} intensity={5}/>
                                 {emails.map((email, i) => <EmailCard key={email.id} email={email} isActive={i === activeIndex} zPos={(i-activeIndex)*3.5} />)}
                            </Canvas>
                         }
                      </div>
                 </div>
                 
                 <div className="md:col-span-1 flex flex-col min-h-0 gap-3">
                    <h3 className="text-xl font-bold">Triage & Action Console</h3>
                     <div className="bg-surface border rounded-lg p-3">
                         <p className="font-bold text-sm">Distilled Intent:</p>
                         <p className={`font-mono text-lg mt-1 ${distilledIntent ? 'text-primary' : 'text-text-secondary'}`}>
                             {distilledIntent ? distilledIntent.intentType : 'ANALYZING...'}
                         </p>
                    </div>
                     <div className="flex-grow bg-surface border rounded-lg p-3 space-y-2 overflow-y-auto">
                        <p className="font-bold text-sm">Forged Commands:</p>
                         {!distilledIntent ? <div className="h-full flex items-center justify-center"><LoadingSpinner/></div> :
                         forgedCommands.map(cmd => (
                            <button key={cmd.commandId} className="w-full btn-primary py-2 text-left px-3 text-sm">{cmd.label}</button>
                         ))
                         }
                    </div>
                 </div>
            </div>
        </div>
    );
};