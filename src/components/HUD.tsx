import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { Terminal as TerminalIcon, Activity, Cpu, Eye, Zap, ShieldAlert, Crosshair, Flame, Target as TargetIcon } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import * as THREE from 'three';

const Terminal = () => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([
    "System initialized...",
    "Connected to NVIDIA Isaac Sim interface...",
    "Robot 'Blue' online.",
    "Waiting for input..."
  ]);
  const { setIsPaused, setIsDancing, setLoss, setRobotPosition, setShowHeatmap, showHeatmap } = useStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const cmd = input.toLowerCase();
    setHistory(prev => [...prev.slice(-10), `> ${input}`]);
    
    if (cmd.includes("stop")) setIsPaused(true);
    else if (cmd.includes("go") || cmd.includes("start")) { setIsPaused(false); setIsDancing(false); }
    else if (cmd.includes("dance")) { setIsDancing(true); setIsPaused(false); }
    else if (cmd.includes("reset")) { 
      setLoss(1.0); 
      setRobotPosition(new THREE.Vector3(0, 1.5, 0));
    }
    else if (cmd.includes("heatmap")) setShowHeatmap(!showHeatmap);
    else setHistory(prev => [...prev, "Command not recognized."]);

    setInput('');
  };

  return (
    <div className="pointer-events-auto bg-black/80 backdrop-blur-md border border-cyan-500/30 p-4 rounded-lg font-mono text-sm h-48 md:h-64 flex flex-col w-full shadow-[0_0_20px_rgba(0,255,255,0.1)]">
      <div className="flex items-center gap-2 mb-2 text-cyan-500 border-b border-cyan-900 pb-2">
        <TerminalIcon size={16} />
        <span className="font-bold tracking-widest">SYS.TERMINAL</span>
      </div>
      <div className="flex-1 overflow-y-auto mb-2 text-cyan-400 space-y-1 text-xs">
        {history.map((line, i) => (
          <div key={i} className="opacity-90">{line}</div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <span className="text-green-500 animate-pulse">➜</span>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="bg-transparent border-none outline-none text-white w-full placeholder-cyan-800"
          placeholder="Enter command (e.g., 'dance', 'stop')"
          autoFocus
        />
      </form>
    </div>
  );
};

const StatCard = ({ label, value, subtext, color = "cyan", icon: Icon }: any) => (
  <div className={`bg-black/60 backdrop-blur border-l-2 border-${color}-500 p-2 md:p-3 w-full relative overflow-hidden group`}>
    <div className={`absolute -right-4 -top-4 opacity-10 text-${color}-500 group-hover:opacity-20 transition-opacity`}>
      {Icon && <Icon size={64} />}
    </div>
    <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-400 uppercase tracking-wider mb-1">
      {Icon && <Icon size={12} className={`text-${color}-500`} />}
      {label}
    </div>
    <div className={`text-xl md:text-2xl font-bold text-${color}-400 drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]`}>{value}</div>
    {subtext && <div className="text-[8px] md:text-[10px] text-gray-500 mt-1">{subtext}</div>}
  </div>
);

const VisionPanel = () => {
  const { targetInView, cvConfidence } = useStore();
  const confPercent = (cvConfidence * 100).toFixed(1) + '%';

  return (
    <div className="pointer-events-auto relative w-48 md:w-64 h-36 md:h-48 bg-black border-2 border-red-900 overflow-hidden shadow-[0_0_30px_rgba(255,0,0,0.2)]">
      <div className="absolute top-2 left-2 text-[8px] md:text-[10px] bg-red-600 text-white px-1 z-10 font-mono">LIVE FEED</div>
      <div className="absolute top-2 right-2 text-[8px] md:text-[10px] text-red-500 flex items-center gap-1 z-10 font-mono">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div> REC
      </div>
      
      <div className="w-full h-full bg-gradient-to-b from-transparent to-red-900/20 flex items-center justify-center relative">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
          backgroundSize: '100% 2px, 3px 100%'
        }}></div>

        {targetInView ? (
          <div className="relative w-24 h-24 md:w-32 md:h-32 border border-red-500/50 flex items-center justify-center">
            <div className="absolute -top-4 -left-1 text-[8px] md:text-[10px] text-red-400 bg-black/80 px-1 font-mono flex items-center gap-1 whitespace-nowrap">
              <Crosshair size={10} /> TARGET_LOCKED
            </div>
            <div className="text-red-500 text-[10px] md:text-xs font-bold font-mono">{confPercent}</div>
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-red-500"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-red-500"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-red-500"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-red-500"></div>
            
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <div className="w-full h-[1px] bg-red-500"></div>
              <div className="h-full w-[1px] bg-red-500 absolute"></div>
            </div>
          </div>
        ) : (
          <div className="text-red-900/80 text-[10px] md:text-xs font-mono flex flex-col items-center gap-2">
            <ShieldAlert size={24} className="animate-pulse" />
            NO SIGNAL
          </div>
        )}
      </div>
    </div>
  );
};

const ControlSwitch = () => {
  const { controlMode, setControlMode } = useStore();
  
  return (
    <div className="pointer-events-auto bg-black/90 backdrop-blur border border-cyan-500/50 shadow-[0_0_20px_rgba(0,255,255,0.2)] p-1 rounded-full flex gap-1 mb-2 md:mb-4">
      <button 
        onClick={() => setControlMode('AI')}
        className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-bold transition-all flex items-center gap-2 ${controlMode === 'AI' ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(0,255,255,0.6)]' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
      >
        <Cpu size={14} /> AUTONOMOUS
      </button>
      <button 
        onClick={() => setControlMode('MANUAL')}
        className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-bold transition-all flex items-center gap-2 ${controlMode === 'MANUAL' ? 'bg-orange-600 text-white shadow-[0_0_15px_rgba(255,165,0,0.6)]' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
      >
        <Zap size={14} /> OVERRIDE
      </button>
    </div>
  );
}

const RLChart = () => {
  const { loss, steps } = useStore();
  const [data, setData] = useState<{step: number, loss: number}[]>([]);

  useEffect(() => {
    setData(prev => {
      const newData = [...prev, { step: steps, loss }];
      if (newData.length > 50) return newData.slice(-50);
      return newData;
    });
  }, [loss, steps]);

  return (
    <div className="bg-black/60 border border-gray-800 p-4 rounded-lg backdrop-blur w-full h-48 flex flex-col pointer-events-auto">
      <div className="flex justify-between text-xs text-gray-400 mb-2 font-mono">
        <span className="flex items-center gap-1"><Activity size={12} className="text-cyan-500"/> RL TRAINING LOSS</span>
        <span className="text-cyan-400">{loss.toFixed(6)}</span>
      </div>
      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <YAxis domain={[0, 'auto']} hide />
            <Line type="monotone" dataKey="loss" stroke="#00ffff" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}></div>
      </div>
    </div>
  );
}

export function HUD() {
  const { steps, loss, distance, controlMode, difficulty, catchCount, targetVulnerable } = useStore();
  const dist = distance.toFixed(2);

  return (
    <div className="absolute inset-0 pointer-events-none p-4 md:p-6 flex flex-col justify-between z-10 overflow-hidden">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
            PROJECT BLUE
          </h1>
          <div className="text-[8px] md:text-xs text-cyan-500 font-mono mt-1 tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-cyan-500 rounded-full animate-pulse"></div>
            NVIDIA ISAAC SIM // RL_TRAINING_ENV_v3.0
          </div>
        </div>
        
        <div className="flex flex-col gap-1 md:gap-2 w-40 md:w-56 items-end">
          <ControlSwitch />
          <StatCard label="Difficulty" value={`LVL ${difficulty.toFixed(1)}`} color={difficulty > 7 ? "red" : difficulty > 4 ? "yellow" : "green"} icon={Flame} />
          <StatCard label="Interceptions" value={catchCount} color="blue" icon={TargetIcon} />
          <StatCard label="Sim Speed" value={(1.0 + steps/1000).toFixed(1) + "x"} color="green" icon={Zap} />
          <StatCard label="Target Distance" value={`${dist}m`} subtext="Real-time tracking" color="purple" icon={Crosshair} />
        </div>
      </div>

      {targetVulnerable && (
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 text-center pointer-events-none z-50 w-full px-4">
          <div className="text-yellow-400 text-sm md:text-xl font-black animate-pulse tracking-widest drop-shadow-[0_0_10px_rgba(255,255,0,0.8)] border border-yellow-500/50 bg-yellow-900/40 px-4 md:px-6 py-2 rounded-full backdrop-blur-sm inline-block">
            ⚠️ TARGET FATIGUED // INTERCEPT NOW
          </div>
        </div>
      )}

      {loss < 0.05 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <div className="text-green-400 text-4xl md:text-6xl font-black opacity-30 animate-pulse tracking-widest drop-shadow-[0_0_20px_rgba(0,255,0,0.8)]">
            MASTERY ACHIEVED
          </div>
        </div>
      )}

      <div className="flex flex-wrap md:flex-nowrap items-end justify-between gap-4 md:gap-6 w-full">
        <div className="w-full md:w-auto md:max-w-md flex-shrink-0">
          <Terminal />
        </div>
        <div className="flex-1 hidden lg:block min-w-0">
          <RLChart />
        </div>
        <div className="flex flex-col gap-2 items-end flex-shrink-0 ml-auto">
          <div className="text-right font-mono">
            <div className="text-[10px] md:text-xs text-gray-400 flex items-center justify-end gap-1"><Eye size={12}/> COMPUTER VISION</div>
          </div>
          <VisionPanel />
          {controlMode === 'MANUAL' && (
            <div className="text-[8px] md:text-[10px] text-orange-500 bg-black/50 px-2 py-1 border border-orange-800/50 font-mono">
              WASD / ARROW KEYS ENABLED
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
