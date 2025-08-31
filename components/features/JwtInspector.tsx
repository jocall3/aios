import React, { useState, useMemo, useCallback, useEffect } from 'eact';
import { LockClosedIcon, ShieldCheckIcon, ShieldExclamationIcon } from '../icons';
import { useNotification } from '../../contexts/NotificationContext';
import { LoadingSpinner } from '../shared';

// --- SELF-CONTAINED CRYPTO & DECODING LOGIC ---
const base64UrlDecode = (str: string): string => {
    let output = str.replace(/-/g, '+').replace(/_/g, '/');
    switch (output.length % 4) {
        case 0: break;
        case 2: output += '=='; break;
        case 3: output += '='; break;
        default: throw new Error('Illegal base64url string!');
    }
    try {
        return decodeURIComponent(atob(output).split('').map(c=>'%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    } catch(e) {
        return atob(output); // Fallback for non-url-encoded strings
    }
};
async function verifySignature(algo: string, key: string, signingInput: string, signature: ArrayBuffer): Promise<boolean> {
    try {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(key);
        const cryptoKey = await crypto.subtle.importKey(
            'raw', keyData, { name: 'HMAC', hash: 'SHA-256'}, false, ['verify']
        );
        return await crypto.subtle.verify('HMAC', cryptoKey, signature, encoder.encode(signingInput));
    } catch (e) {
        console.error("Verification error:", e);
        return false;
    }
}

export const JwtInspector: React.FC = () => {
    const [jwt, setJwt] = useState("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjI1MTYyMzkwMjJ9.X8bFhH3-N_2-5hG_frCQiSm51GUEvY2aYVwVb-Z6tHo");
    const [secret, setSecret] = useState('your-secret');
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const { addNotification } = useNotification();
    
    const decoded = useMemo(() => {
        try {
            const parts = jwt.split('.');
            if (parts.length !== 3) return { error: 'Invalid JWT structure' };
            const header = JSON.parse(base64UrlDecode(parts[0]));
            const payload = JSON.parse(base64UrlDecode(parts[1]));
            return { header, payload, error: null, parts };
        } catch (e) { return { error: 'Invalid Base64URL or JSON format' }; }
    }, [jwt]);

    useEffect(() => {
        const verify = async () => {
            if (decoded && decoded.parts && decoded.header.alg === 'HS256') {
                const [header, payload, signature] = decoded.parts;
                const signingInput = `${header}.${payload}`;
                const sigBytes = Uint8Array.from(base64UrlDecode(signature), c => c.charCodeAt(0));
                const result = await verifySignature(decoded.header.alg, secret, signingInput, sigBytes.buffer);
                setIsValid(result);
            } else {
                setIsValid(null); // Not verifiable with current setup
            }
        };
        verify();
    }, [decoded, secret]);
    
    const isExpired = decoded?.payload?.exp ? (decoded.payload.exp * 1000 < Date.now()) : false;

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><LockClosedIcon /><span className="ml-3">JWT Cryptographic Verifier & Claims Adjudicator</span></h1>
                <p className="text-text-secondary mt-1">Perform live cryptographic verification and claims adjudication of JSON Web Tokens.</p>
            </header>
            
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                 <div className="flex flex-col gap-3 min-h-0">
                     <h3 className="text-xl font-bold">Input Token & Secret</h3>
                     <label className="text-sm">JWT</label>
                     <textarea value={jwt} onChange={e => setJwt(e.target.value)} className="h-40 p-2 bg-surface border rounded font-mono text-xs"/>
                      <label className="text-sm">HMAC Secret / Public Key</label>
                     <input type="password" value={secret} onChange={e => setSecret(e.target.value)} className="w-full p-2 bg-surface border rounded font-mono text-sm"/>
                 </div>
                 
                 <div className="flex flex-col gap-3 min-h-0">
                    <div className="p-4 bg-surface border rounded-lg">
                        <h3 className="text-xl font-bold">Adjudication Report</h3>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                            <div className={`p-2 rounded font-bold flex items-center justify-center gap-2 ${isValid === true ? 'bg-green-800/50' : isValid === false ? 'bg-red-800/50' : 'bg-background'}`}>
                                {isValid === true ? <ShieldCheckIcon/> : <ShieldExclamationIcon/>} {isValid === true ? 'SIGNATURE VERIFIED' : isValid === false ? 'SIGNATURE INVALID' : 'UNVERIFIED'}
                            </div>
                            <div className={`p-2 rounded font-bold ${isExpired ? 'bg-red-800/50' : 'bg-green-800/50'}`}>{isExpired ? 'EXPIRED' : 'ACTIVE'}</div>
                        </div>
                    </div>
                     <div className="grid grid-rows-2 gap-3 flex-grow min-h-0">
                         <div className="flex flex-col">
                             <p className="font-bold mb-1">Header</p>
                             <pre className="text-xs flex-grow bg-background border p-2 rounded">{decoded.error || JSON.stringify(decoded.header, null, 2)}</pre>
                         </div>
                         <div className="flex flex-col">
                            <p className="font-bold mb-1">Payload</p>
                             <pre className="text-xs flex-grow bg-background border p-2 rounded">{decoded.error || JSON.stringify(decoded.payload, null, 2)}</pre>
                         </div>
                    </div>
                 </div>
            </div>
        </div>
    );
};