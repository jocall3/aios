// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PhotoIcon, SparklesIcon, ArrowDownTrayIcon } from '../icons';

// --- SELF-CONTAINED PERLIN NOISE & PROCEDURAL GENERATION ENGINE ---
const perlin = {
    rand_vect: function(){ let theta=Math.random()*2*Math.PI; return {x:Math.cos(theta), y:Math.sin(theta)}; },
    dot_prod_grid: function(x:number,y:number,vx:number,vy:number){ let g_vect=this.grid[vy][vx]; return x*g_vect.x+y*g_vect.y; },
    smootherstep: function(x:number){ return 6*x**5-15*x**4+10*x**3; },
    interp: function(x:number,a:number,b:number){ return a+(this.smootherstep(x))*(b-a); },
    seed: function(){ this.grid=[]; for(let i=0;i<257;i++){ let row=[]; for(let j=0;j<257;j++){ row.push(this.rand_vect()); } this.grid.push(row); }},
    get: function(x:number,y:number) { if(!this.grid)this.seed(); let xf=Math.floor(x);let yf=Math.floor(y); let tl=this.dot_prod_grid(x-xf,y-yf,xf,yf); let tr=this.dot_prod_grid(x-xf-1,y-yf,xf+1,yf); let bl=this.dot_prod_grid(x-xf,y-yf-1,xf,yf+1); let br=this.dot_prod_grid(x-xf-1,y-yf-1,xf+1,yf+1); let xt=this.interp(x-xf,tl,tr); let xb=this.interp(x-xf,bl,br); return this.interp(y-yf,xt,xb); },
    grid: null as any
};

const hexToRgb = (hex:string) => { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return [r,g,b]; };


export const ImagePlaceholderGenerator: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [seed, setSeed] = useState('Nebula');
    const [baseColor, setBaseColor] = useState('#38bdf8'); // sky-400
    const [turbulence, setTurbulence] = useState(5);
    const [time, setTime] = useState(0);

    const palette = useMemo(() => {
        const [r,g,b] = hexToRgb(baseColor);
        return [ [r,g,b], [255-r,255-g,255-b], [g,b,r] ]; // simple complementary palette
    }, [baseColor]);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        
        perlin.seed();

        for (let x = 0; x < w; x++) {
            for (let y = 0; y < h; y++) {
                const i = (x + y * w) * 4;
                const value = Math.abs(perlin.get(x / turbulence / 10, y / turbulence / 10 + time * 0.01));
                const color = palette[Math.floor(value * palette.length)];
                
                imgData.data[i] = color[0] * value;
                imgData.data[i + 1] = color[1] * value;
                imgData.data[i + 2] = color[2] * value;
                imgData.data[i + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);
    }, [seed, baseColor, turbulence, time, palette]);

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if(canvas) {
            const url = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = url;
            a.download = `synthetic_asset_${seed}.png`;
            a.click();
        }
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><PhotoIcon /><span className="ml-3">Procedural Asset & Synthetic Texture Weaver</span></h1>
                <p className="text-text-secondary mt-1">Weave infinite, unique visual assets from the raw mathematics of procedural generation.</p>
            </header>
            
            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
                 <div className="md:col-span-1 flex flex-col gap-3">
                     <h3 className="text-xl font-bold">Generative Controls</h3>
                      <div className="bg-surface border p-4 rounded-lg space-y-4">
                          <div>
                            <label className="text-sm">Abstract Concept</label>
                            <select value={seed} onChange={e => setSeed(e.target.value)} className="w-full mt-1 p-2 bg-background border rounded">
                                <option>Nebula</option><option>Marble</option><option>Flow Field</option>
                            </select>
                         </div>
                         <div>
                            <label className="text-sm">Palette Seed Color</label>
                            <input type="color" value={baseColor} onChange={e => setBaseColor(e.target.value)} className="w-full mt-1 h-10 rounded bg-background border"/>
                         </div>
                         <div>
                            <label className="text-sm">Turbulence: {turbulence.toFixed(1)}</label>
                            <input type="range" min="1" max="20" step="0.5" value={turbulence} onChange={e=>setTurbulence(parseFloat(e.target.value))} className="w-full"/>
                         </div>
                           <div>
                            <label className="text-sm">Time Evolution</label>
                            <input type="range" min="0" max="100" value={time} onChange={e=>setTime(parseFloat(e.target.value))} className="w-full"/>
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setSeed(Math.random().toString())} className="btn-primary w-full py-2 flex items-center justify-center gap-2"><SparklesIcon/> New Seed</button>
                        <button onClick={handleDownload} className="btn-primary w-full py-2 flex items-center justify-center gap-2"><ArrowDownTrayIcon/> Export</button>
                      </div>
                 </div>
                 
                 <div className="md:col-span-2 flex flex-col min-h-0">
                    <h3 className="text-xl font-bold mb-2">Live Generative Canvas</h3>
                    <div className="flex-grow bg-background border-2 border-dashed border-border rounded-lg aspect-video">
                        <canvas ref={canvasRef} width="512" height="512" className="w-full h-full object-contain"/>
                    </div>
                </div>
            </div>
        </div>
    );
};