import React from 'react';
import { Book, GraduationCap, Binary, Shapes, Brain, Sparkles, Orbit, Microscope } from 'lucide-react';

const Background3D = () => {
  const items = [
    { Icon: Book, color: 'text-yellow-400' },
    { Icon: GraduationCap, color: 'text-blue-400' },
    { Icon: Binary, color: 'text-purple-400' },
    { Icon: Shapes, color: 'text-emerald-400' },
    { Icon: Brain, color: 'text-pink-400' },
    { Icon: Sparkles, color: 'text-amber-400' },
    { Icon: Orbit, color: 'text-cyan-400' },
    { Icon: Microscope, color: 'text-indigo-400' }
  ];

  const floatingElements = Array.from({ length: 25 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 40 + 30,
    duration: Math.random() * 20 + 20,
    delay: Math.random() * -30,
    z: Math.random() * 150 - 75,
    item: items[i % items.length]
  }));

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#020617] pointer-events-none select-none">
      <style>{`
        @keyframes float-hero {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          50% { transform: translateY(-50px) rotate(10deg) scale(1.1); }
        }
        @keyframes aurora-shift {
          0%, 100% { transform: translate(0,0) rotate(0deg); opacity: 0.4; }
          50% { transform: translate(100px, 50px) rotate(180deg); opacity: 0.6; }
        }
        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 10px currentColor); opacity: 0.6; }
          50% { filter: drop-shadow(0 0 25px currentColor); opacity: 0.9; }
        }
        .aurora {
          animation: aurora-shift 30s infinite alternate ease-in-out;
        }
        .hero-element {
          animation: float-hero var(--dur) infinite alternate ease-in-out;
        }
      `}</style>

      {/* Extreme Vibrant Auroras */}
      <div className="absolute inset-x-[-10%] top-[-10%] h-[120%] w-[120%] filter blur-[120px] opacity-70">
        <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] bg-blue-600/30 rounded-full aurora"></div>
        <div className="absolute top-[40%] right-[10%] w-[50%] h-[50%] bg-purple-600/30 rounded-full aurora" style={{ animationDelay: '-10s' }}></div>
        <div className="absolute bottom-[20%] left-[10%] w-[45%] h-[45%] bg-indigo-500/30 rounded-full aurora" style={{ animationDelay: '-20s' }}></div>
        <div className="absolute top-[20%] left-[50%] w-[35%] h-[35%] bg-blue-400/20 rounded-full aurora" style={{ animationDelay: '-5s' }}></div>
      </div>

      {/* Energy Grid Mesh (The Student Magnet) */}
      <div className="absolute inset-0 perspective-[1000px]">
        <div 
          className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:50px_50px]"
          style={{ 
            transform: 'rotateX(75deg) translateY(200px) translateZ(-100px)',
            maskImage: 'linear-gradient(to top, black, transparent)'
          }}
        ></div>
        <div 
          className="absolute inset-0 bg-[linear-gradient(rgba(147,51,234,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(147,51,234,0.1)_1px,transparent_1px)] bg-[size:52px_52px]"
          style={{ 
            transform: 'rotateX(-75deg) translateY(-200px) translateZ(-100px)',
            maskImage: 'linear-gradient(to bottom, black, transparent)'
          }}
        ></div>
      </div>

      {/* Floating 3D-Styled High-Contrast Icons */}
      <div className="absolute inset-0">
        {floatingElements.map((el) => {
          const { Icon, color } = el.item;
          return (
            <div
              key={el.id}
              className="absolute hero-element flex flex-col items-center justify-center opacity-60"
              style={{
                left: el.left,
                top: el.top,
                '--dur': `${el.duration}s`,
                animationDelay: `${el.delay}s`,
                transform: `scale(${1 + el.z / 300})`, // Simple 3D scaling
              }}
            >
              <div className={`p-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm animate-[pulse-glow_4s_infinite]`}>
                <Icon className={color} size={el.size} strokeWidth={1.5} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Technical Overlay & Scan Lines */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_4px,rgba(255,255,255,0.01)_5px)] opacity-30"></div>
      
      {/* Deep Vignette & Center Focus */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_90%)] opacity-80 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]"></div>
    </div>
  );
};

export default Background3D;
