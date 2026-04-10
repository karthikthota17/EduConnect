import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axiosConfig';
import { 
  BarChart3, TrendingUp, CheckCircle2, AlertCircle, 
  Loader2, Award, Users, BookOpen, Clock, Target,
  ArrowUpRight, ArrowDownRight, Zap, ArrowLeft, Scan,
  Calendar as CalendarIcon, Camera, X
} from 'lucide-react';
import Background3D from '../components/Background3D';
import Modal from '../components/Modal';

const Analytics = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isScannerOpen, setScannerOpen] = useState(false);
  const [attendanceToken, setAttendanceToken] = useState('');
  const [hasCamera, setHasCamera] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/classes/analytics');
      setStats(res.data.data);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttendanceSubmit = async (e) => {
     if (e) e.preventDefault();
     if (!attendanceToken) return;
     try {
        const classesRes = await api.get('/classes');
        const myClasses = classesRes.data.data;
        let success = false;
        for (const cls of myClasses) {
           try {
              await api.post(`/classes/${cls._id}/attendance/${attendanceToken}`);
              success = true;
              break;
           } catch (e) { continue; }
        }
        if (success) {
           alert("Attendance Mark Synchronized Successfully.");
           setScannerOpen(false);
           setAttendanceToken('');
        } else {
           alert("Invalid Security Token. Direct entry rejected.");
        }
     } catch (err) {
        alert("Communications error with the central server node.");
     }
  };

  useEffect(() => {
    if (isScannerOpen) {
       startCamera();
    } else {
       stopCamera();
    }
    return () => stopCamera();
  }, [isScannerOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasCamera(true);
      }
    } catch (err) {
      setHasCamera(false);
    }
  };

  const stopCamera = () => {
     if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
     }
  };

  const StatCard = ({ label, value, icon: Icon, trend, color }) => (
    <div className="glass-panel p-6 rounded-[2rem] relative overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 border-white/5 bg-white/5">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-2xl ${color} bg-opacity-10 text-opacity-90 indigo-glow`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
           <div className={`flex items-center gap-1 text-xs font-black ${trend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(trend)}%
           </div>
        )}
      </div>
      <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-2">{label}</p>
      <h2 className="text-3xl font-black text-white tracking-tighter">{value}</h2>
      <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-3xl opacity-10 ${color}`}></div>
    </div>
  );

  const ProgressBar = ({ label, value, color }) => (
    <div className="space-y-3">
      <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400">
        <span>{label}</span>
        <span className="text-white">{value}%</span>
      </div>
      <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(99,102,241,0.5)]`} 
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen relative bg-[#020617] flex items-center justify-center">
        <Background3D />
        <div className="relative z-10 flex flex-col items-center gap-4">
           <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
           <p className="text-indigo-400 font-black uppercase tracking-widest text-xs animate-pulse">Syncing Intel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-[#020617] text-white selection:bg-indigo-500/30 overflow-x-hidden">
      <Background3D />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 md:pt-32 pb-24 md:pb-20">
        <header className="mb-12 md:mb-16 animate-in fade-in slide-in-from-left-4 duration-700">
           <button onClick={() => navigate('/dashboard')} className="mb-8 p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all group shrink-0 hidden md:flex items-center gap-3">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest leading-none tracking-tighter">Exit Terminal</span>
           </button>
           <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-12 bg-indigo-500"></div>
              <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em]">Performance Command</p>
           </div>
           <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-4 leading-tight">
             Detailed <span className="text-gradient">Insights</span>.
           </h1>
           <p className="text-slate-400 max-w-xl font-medium text-lg leading-relaxed">
             Comprehensive data synthesis of your academic engagement and efficiency metrics.
           </p>
        </header>

        {user?.role === 'teacher' || user?.role === 'admin' ? (
          <div className="space-y-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <StatCard label="Total Classes" value={stats.totalClasses} icon={BookOpen} color="bg-indigo-500 text-indigo-500" />
              <StatCard label="Student Base" value={stats.totalStudents} icon={Users} color="bg-purple-500 text-purple-500" />
              <StatCard label="Avg Completion" value={`${stats.avgCompletionRate}%`} icon={Target} trend={12} color="bg-emerald-500 text-emerald-500" />
              <StatCard label="Avg Quiz Rank" value={stats.avgQuizScore} icon={Zap} trend={-3} color="bg-amber-500 text-amber-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 glass-panel p-10 rounded-[3rem] border-white/5 bg-white/5">
                 <h3 className="text-xl font-black text-white mb-10 tracking-tight flex items-center gap-3">
                    <TrendingUp className="text-indigo-400" /> Global Performance Distribution
                 </h3>
                 <div className="space-y-10">
                    <ProgressBar label="Assignment Engagement" value={stats.avgCompletionRate} color="bg-indigo-600" />
                    <ProgressBar label="Quiz Accuracy" value={stats.avgQuizScore * 10} color="bg-emerald-500" />
                    <ProgressBar label="Material Interaction" value={78} color="bg-purple-500" />
                    <ProgressBar label="Student Participation" value={92} color="bg-rose-500" />
                 </div>
              </div>

              <div className="glass-panel p-10 rounded-[3rem] border-white/5 bg-white/5 flex flex-col justify-between">
                 <div>
                    <h3 className="text-xl font-black text-white mb-8 tracking-tight">System Status</h3>
                    <div className="space-y-6">
                       <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></div>
                          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Classrooms Active</p>
                       </div>
                    </div>
                 </div>
                 <div className="pt-10">
                    <div className="p-8 rounded-[2rem] bg-indigo-600/20 border border-indigo-500/20 indigo-glow">
                       <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Teacher Intelligence</p>
                       <p className="text-sm font-bold text-white leading-relaxed">Your students are most active between 6 PM - 9 PM. Schedule live sessions then for 40% higher turnout.</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <StatCard label="Overall Progress" value={`${stats.completionRate}%`} icon={TrendingUp} trend={8} color="bg-indigo-500 text-indigo-500" />
              <StatCard label="Attendance" value={`${stats.attendanceRate}%`} icon={Clock} color="bg-emerald-500 text-emerald-500" />
              <StatCard label="Learning Points" value={stats.pointsEarned} icon={Award} trend={24} color="bg-amber-500 text-amber-500" />
              <StatCard label="Quiz Mastery" value={`${stats.avgQuizScore}/10`} icon={Target} color="bg-rose-500 text-rose-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 glass-panel p-10 rounded-[3rem] border-white/5 bg-white/5">
                  <h3 className="text-xl font-black text-white mb-10 tracking-tight flex items-center gap-3">
                     <Zap className="text-amber-400" /> Learning Trajectory
                  </h3>
                  <div className="space-y-10">
                     <ProgressBar label="Assignment Focus" value={stats.completionRate} color="bg-indigo-600" />
                     <ProgressBar label="Subject Comprehension" value={stats.avgQuizScore * 10} color="bg-emerald-500" />
                  </div>
               </div>

               <div className="glass-panel p-10 rounded-[3rem] border-white/5 bg-white/5">
                  <h3 className="text-xl font-black text-white mb-10 tracking-tight">Achievements</h3>
                  <div className="space-y-4">
                     {["Perfect Week Streak", "Mathematics Top 10%", "Early Submitter", "Active Contributor"].map((ach, i) => (
                        <div key={i} className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition cursor-default">
                           <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400 indigo-glow">
                              <Award className="w-5 h-5" />
                           </div>
                           <span className="text-xs font-black uppercase tracking-widest text-slate-200">{ach}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isScannerOpen} onClose={() => setScannerOpen(false)} title="Temporal Verification">
          <div className="flex flex-col items-center gap-10 p-6">
             <div className="relative w-full aspect-square max-w-[280px] bg-black rounded-[3rem] overflow-hidden border-4 border-emerald-500/10 shadow-3xl group indigo-glow">
                <video 
                   ref={videoRef} 
                   autoPlay 
                   playsInline 
                   className={`w-full h-full object-cover grayscale brightness-125 contrast-150 transition-opacity duration-1000 ${hasCamera ? 'opacity-100' : 'opacity-0'}`}
                />
                <div className="absolute inset-0 border-2 border-emerald-500/20 animate-pulse z-10 pointer-events-none opacity-20"></div>
                <div className="absolute top-1/2 left-0 w-full h-1 bg-emerald-500/30 -translate-y-1/2 animate-[scan_2s_ease-in-out_infinite] z-20 shadow-[0_0_15px_rgba(16,185,129,0.4)]"></div>
                {!hasCamera && (
                   <div className="absolute inset-0 flex items-center justify-center text-slate-800">
                      <Camera className="w-12 h-12 opacity-5" />
                   </div>
                )}
             </div>

             <div className="w-full space-y-6">
                <div className="space-y-4">
                   <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1 text-center font-mono">Manual Verification Token</label>
                   <div className="flex items-center gap-3">
                      <input 
                         value={attendanceToken}
                         onChange={(e) => setAttendanceToken(e.target.value)}
                         placeholder="SYNC-000-000" 
                         className="flex-1 px-8 py-5 text-xl font-black tracking-widest bg-white/5 border-2 border-emerald-500/20 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/40 outline-none transition-all text-white text-center font-mono placeholder-slate-800 uppercase" 
                      />
                      <button 
                         onClick={handleAttendanceSubmit}
                         className="bg-emerald-600 hover:bg-emerald-500 p-5 rounded-2xl text-white transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
                      >
                         <Zap className="w-6 h-6" />
                      </button>
                   </div>
                </div>
                <p className="text-[10px] font-black text-slate-500 text-center italic tracking-widest">Alignment with Central Node Required for Authorization</p>
             </div>
          </div>
      </Modal>

      <nav className="fixed bottom-0 left-0 w-full z-[100] md:hidden glass-panel border-t border-white/5 pb-safe animate-in slide-in-from-bottom-8 duration-500">
         <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
            <Link to="/dashboard" className="flex flex-col items-center gap-1.5 px-4 text-slate-500 hover:text-slate-200 transition-all">
               <BookOpen className="w-5 h-5" />
               <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
            </Link>
            <Link to="/calendar" className="flex flex-col items-center gap-1.5 px-4 text-slate-500 hover:text-slate-200 transition-all">
               <CalendarIcon className="w-5 h-5" />
               <span className="text-[9px] font-black uppercase tracking-widest">Plan</span>
            </Link>
            <Link to="/analytics" className="flex flex-col items-center gap-1.5 px-4 text-indigo-400 relative">
               <div className="w-1 h-1 rounded-full bg-indigo-400 absolute -top-2"></div>
               <BarChart3 className="w-5 h-5" />
               <span className="text-[9px] font-black uppercase tracking-widest">Stats</span>
            </Link>
            {isTeacher ? (
               <div className="flex flex-col items-center gap-1.5 px-4 text-slate-500 opacity-20">
                  <Zap className="w-5 h-5" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Live</span>
               </div>
            ) : (
               <button onClick={() => setScannerOpen(true)} className="flex flex-col items-center gap-1.5 px-4 text-emerald-400 hover:text-emerald-300 transition-all">
                  <Scan className="w-5 h-5" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Scan</span>
               </button>
            )}
         </div>
      </nav>
    </div>
  );
};

export default Analytics;
