import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  Loader2, ClipboardList, ListChecks, Video, 
  Zap, Clock, Target, Plus, Search, Filter,
  ArrowLeft, MessageSquare, BookOpen, Users, BarChart3, QrCode, Scan, Camera, X
} from 'lucide-react';
import Background3D from '../components/Background3D';
import api from '../api/axiosConfig';
import Modal from '../components/Modal';

const Calendar = () => {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  const [isScannerOpen, setScannerOpen] = useState(false);
  const [attendanceToken, setAttendanceToken] = useState('');
  const [hasCamera, setHasCamera] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/classes');
      const allEvents = [];
      const classWorkPromises = res.data.data.map(c => api.get(`/classwork/${c._id}`));
      const results = await Promise.all(classWorkPromises);
      
      results.forEach((cwRes) => {
         const { assignments, quizzes, materials } = cwRes.data.data || { assignments: [], quizzes: [], materials: [] };
         assignments.forEach(a => {
            if (a.dueDate) {
               allEvents.push({
                 id: a._id,
                 title: a.title,
                 date: new Date(a.dueDate),
                 type: 'assignment',
                 meta: 'Operational Milestone'
               });
            }
         });
         quizzes.forEach(q => {
             allEvents.push({
               id: q._id,
               title: q.title,
               date: new Date(q.createdAt),
               type: 'quiz',
               meta: 'Live Evaluation'
             });
         });
         materials.forEach(m => {
             allEvents.push({
               id: m._id,
               title: m.title,
               date: new Date(m.createdAt),
               type: 'material',
               meta: 'Intel Resource'
             });
         });
      });
      setEvents(allEvents);
    } catch (err) {
      console.error("Failed to synchronize temporal data nodes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDayOfMonth = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const getEventsForDay = (day) => {
    if (!day) return [];
    return events.filter(e => 
      e.date.getDate() === day && 
      e.date.getMonth() === currentDate.getMonth() && 
      e.date.getFullYear() === currentDate.getFullYear()
    );
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

  const selectedDayEvents = getEventsForDay(selectedDay);

  return (
    <div className="min-h-screen relative bg-[#020617] text-white selection:bg-indigo-500/30 overflow-x-hidden pt-24 pb-40 px-6 sm:px-12">
      <Background3D />
      
      <div className="max-w-[1400px] mx-auto space-y-6 md:space-y-10 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
         <div className="flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8 bg-white/5 glass-panel p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border-white/5 shadow-2xl backdrop-blur-3xl">
            <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-8 w-full lg:w-auto text-center sm:text-left">
               <button onClick={() => navigate('/dashboard')} className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all group shrink-0 hidden md:flex items-center gap-3">
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">Dashboard</span>
               </button>
               <div className="h-10 w-px bg-white/10 hidden md:block"></div>
               <div className="h-14 w-14 md:h-20 md:w-20 bg-indigo-600 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center shadow-[0_0_50px_rgba(79,150,229,0.3)] group hover:scale-110 transition-transform">
                  <CalendarIcon className="h-6 w-6 md:h-10 md:w-10 text-white group-hover:rotate-12 transition-transform" />
               </div>
               <div className="truncate">
                  <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight drop-shadow-lg truncate">
                    {monthNames[currentDate.getMonth()]} <span className="text-indigo-500">{currentDate.getFullYear()}</span>
                  </h2>
                  <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1 md:mt-2 flex items-center justify-center sm:justify-start gap-2">
                    <Zap className="w-3 h-3 text-indigo-400" /> Temporal Scheduling
                  </p>
               </div>
            </div>
            
            <div className="flex items-center gap-4 md:gap-6 bg-black/40 p-2 md:p-3 rounded-2xl md:rounded-[2rem] border border-white/5 shadow-inner">
               <button onClick={prevMonth} className="p-3 md:p-5 hover:bg-white/10 rounded-xl md:rounded-2xl transition-all text-slate-400 hover:text-white group">
                  <ChevronLeft className="h-5 w-5 md:h-8 md:w-8 group-active:-translate-x-1 transition-transform" />
               </button>
               <div className="h-6 md:h-10 w-px bg-white/10 mx-1 md:mx-2"></div>
               <button onClick={nextMonth} className="p-3 md:p-5 hover:bg-white/10 rounded-xl md:rounded-2xl transition-all text-slate-400 hover:text-white group">
                  <ChevronRight className="h-5 w-5 md:h-8 md:w-8 group-active:translate-x-1 transition-transform" />
               </button>
            </div>
         </div>

         <div className="grid grid-cols-1 xl:grid-cols-4 gap-10 h-full">
            <div className="xl:col-span-3 glass-panel rounded-[2rem] md:rounded-[4rem] border-white/10 bg-white/[0.02] overflow-hidden shadow-3xl backdrop-blur-md">
               <div className="grid grid-cols-7 border-b border-white/5 bg-white/5 backdrop-blur-xl">
                 {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                   <div key={day} className="py-4 md:py-8 text-center text-[8px] md:text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] md:tracking-[0.3em] font-mono">
                     {day}
                   </div>
                 ))}
               </div>

               {isLoading ? (
                 <div className="flex flex-col items-center justify-center py-40 md:py-60 gap-4 md:gap-6">
                    <Loader2 className="h-12 w-12 md:h-20 md:w-20 animate-spin text-indigo-500" />
                    <p className="text-[9px] md:text-[10px] text-indigo-400 font-black uppercase tracking-[0.5em] animate-pulse">Syncing Time Nodes...</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-7 auto-rows-[minmax(80px,auto)] md:auto-rows-[minmax(160px,auto)]">
                    {days.map((day, idx) => {
                       const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
                       const dayEvents = getEventsForDay(day);
                       const isSelected = selectedDay === day;
                       
                       return (
                          <div 
                             key={idx} 
                             onClick={() => day && setSelectedDay(day)}
                             className={`p-2 md:p-6 border-r border-b border-white/5 last:border-r-0 relative hover:bg-white/5 transition-all duration-500 group cursor-pointer ${day === null ? 'bg-black/20' : ''} ${isSelected ? 'bg-indigo-600/10' : ''}`}
                          >
                             {day && (
                                <div className="h-full flex flex-col gap-1 md:gap-4">
                                   <div className="flex justify-between items-start">
                                      <span className={`text-[10px] md:text-base font-black w-6 h-6 md:w-10 md:h-10 flex items-center justify-center rounded-lg md:rounded-2xl transition-all ${isToday ? 'bg-indigo-600 text-white shadow-[0_0_30px_rgba(79,150,229,0.5)] scale-110' : 'text-slate-400 group-hover:text-white'} ${isSelected ? 'text-indigo-400 font-bold' : ''}`}>
                                        {day}
                                      </span>
                                      {dayEvents.length > 0 && (
                                         <div className="px-1 md:px-2 py-0.5 md:py-1 rounded-md md:rounded-lg bg-indigo-600 text-[6px] md:text-[8px] font-black uppercase tracking-tighter shadow-lg">
                                            {dayEvents.length} TX
                                         </div>
                                      )}
                                   </div>
                                   
                                   <div className="flex-1 space-y-1 md:space-y-2 overflow-y-auto max-h-24 md:max-h-32 scrollbar-hide">
                                      {dayEvents.slice(0, 3).map(event => (
                                         <div key={event.id} className={`px-1.5 md:px-4 py-1 md:py-2.5 rounded-md md:rounded-2xl text-[6px] md:text-[9px] font-black uppercase tracking-tight flex items-center gap-1.5 md:gap-3 group/event transition-all border border-transparent hover:border-white/10 ${
                                           event.type === 'assignment' ? 'bg-indigo-500/10 text-indigo-400' : 
                                           event.type === 'quiz' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                                         }`}>
                                            <div className={`w-1 md:w-1.5 h-1 md:h-1.5 rounded-full shrink-0 ${
                                              event.type === 'assignment' ? 'bg-indigo-400' : 
                                              event.type === 'quiz' ? 'bg-rose-400' : 'bg-emerald-400'
                                            }`}></div>
                                            <span className="truncate flex-1 hidden sm:inline">{event.title}</span>
                                         </div>
                                      ))}
                                      {dayEvents.length > 3 && (
                                         <p className="text-[6px] md:text-[8px] font-black text-slate-600 uppercase tracking-widest text-center">+ {dayEvents.length - 3}</p>
                                      )}
                                   </div>
                                </div>
                             )}
                          </div>
                       );
                    })}
                 </div>
               )}
            </div>

            <div className="space-y-10">
               <div className="glass-panel p-8 rounded-[3.5rem] border-white/10 bg-indigo-600/5 shadow-2xl backdrop-blur-md h-fit">
                  <div className="flex items-center gap-4 mb-10">
                     <div className="p-4 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-600/20 text-white">
                        <Target className="w-6 h-6" />
                     </div>
                     <div>
                        <h4 className="text-xl font-black text-white tracking-tight uppercase tracking-widest leading-none">Chronicle Inspector</h4>
                        <p className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.2em] mt-2">Active Timeline Details</p>
                     </div>
                  </div>

                  <div className="space-y-6">
                     {selectedDay ? (
                        <>
                           <div className="flex items-end gap-3 mb-8 border-b border-white/5 pb-6">
                              <span className="text-6xl font-black text-white tracking-tighter">{selectedDay}</span>
                              <div className="flex flex-col">
                                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">{monthNames[currentDate.getMonth()]}</p>
                                 <p className="text-sm font-bold text-slate-500">{currentDate.getFullYear()}</p>
                              </div>
                           </div>

                           <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                              {selectedDayEvents.length > 0 ? selectedDayEvents.map(event => (
                                 <div key={event.id} className="glass-panel p-6 rounded-3xl border-white/5 bg-white/5 group hover:bg-white/[0.08] transition-all">
                                    <div className="flex items-center justify-between mb-4">
                                       <span className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest ${
                                          event.type === 'assignment' ? 'bg-indigo-500/10 text-indigo-400' :
                                          event.type === 'quiz' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                                       }`}>
                                          {event.meta}
                                       </span>
                                       <Clock className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                                    </div>
                                    <h5 className="font-black text-white text-lg tracking-tight mb-2 truncate">{event.title}</h5>
                                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
                                       <Video className="w-3 h-3" /> Scheduled Deployment
                                    </p>
                                 </div>
                              )) : (
                                 <div className="py-20 text-center space-y-4">
                                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/10 mx-auto flex items-center justify-center">
                                       <Plus className="w-6 h-6 text-slate-700" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No Active Packets</p>
                                 </div>
                              )}
                           </div>
                        </>
                     ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
                           <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/5 flex items-center justify-center animate-bounce">
                              <Target className="w-8 h-8 text-slate-700" />
                           </div>
                           <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] max-w-[200px] leading-relaxed">Select a temporal node for specific operational data</p>
                        </div>
                     )}
                  </div>
               </div>

               <div className="glass-panel p-8 rounded-[3rem] border-white/5 bg-emerald-500/5 shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Zap className="w-32 h-32 text-emerald-400 grayscale" />
                   </div>
                   <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-4">Upcoming Integrity</h5>
                   <p className="text-4xl font-black text-white tracking-tighter">{events.length} TX Modules</p>
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-2 italic font-mono">Synchronized with Node Hub</p>
               </div>
            </div>
         </div>
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
            <Link to="/calendar" className="flex flex-col items-center gap-1.5 px-4 text-indigo-400 relative">
               <div className="w-1 h-1 rounded-full bg-indigo-400 absolute -top-2"></div>
               <CalendarIcon className="w-5 h-5" />
               <span className="text-[9px] font-black uppercase tracking-widest">Plan</span>
            </Link>
            <Link to="/analytics" className="flex flex-col items-center gap-1.5 px-4 text-slate-500 hover:text-slate-200 transition-all">
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

export default Calendar;
