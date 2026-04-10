import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyClasses, createClass, joinClass, clearClassError } from '../store/classSlice';
import { Plus, BookOpen, Loader2, Calendar as CalendarIcon, BarChart3, Shield, Bell, LogOut, Search, Clock, Zap, Scan, QrCode } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import ClassCard from '../components/ClassCard';
import Modal from '../components/Modal';
import Background3D from '../components/Background3D';
import { useSocket } from '../context/SocketContext';
import SmartScanner from '../components/SmartScanner';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { myClasses, isLoading, error } = useSelector((state) => state.classes);

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [createData, setCreateData] = useState({ name: '', description: '' });

  const [isJoinModalOpen, setJoinModalOpen] = useState(false);
  const [isScannerOpen, setScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState('attendance'); // attendance, join
  const [joinCode, setJoinCode] = useState('');

  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const [todoItems, setTodoItems] = useState([]);
  const [isTodoLoading, setIsTodoLoading] = useState(false);
  
  const socket = useSocket();

  useEffect(() => {
    dispatch(fetchMyClasses());
    fetchNotifications();
    fetchTodo();

    if (socket) {
       socket.on('classwork-updated', () => {
          fetchNotifications();
          fetchTodo();
       });
       
       return () => {
          socket.off('classwork-updated');
       };
    }
  }, [dispatch, socket]);

  const fetchTodo = async () => {
    setIsTodoLoading(true);
    try {
      const res = await api.get('/classwork/todo');
      setTodoItems(res.data.data);
    } catch (err) {
      console.error("Failed to fetch todo items");
    } finally {
      setIsTodoLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data);
    } catch (err) {
      console.error("Failed to fetch notifications");
    }
  };

  const markNotifRead = async () => {
    if (unreadCount === 0) return;
    try {
      await api.put('/notifications/read');
      setNotifications(notifications.map(n => ({...n, read: true})));
    } catch (err) {
      console.error("Failed to mark notifications as read");
    }
  };

  useEffect(() => {
    if (isNotifOpen) {
      markNotifRead();
    }
  }, [isNotifOpen]);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    dispatch(createClass(createData)).then((res) => {
      if (!res.error) {
        setCreateModalOpen(false);
        setCreateData({ name: '', description: '' });
      }
    });
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    dispatch(joinClass(joinCode)).then((res) => {
      if (!res.error) {
        setJoinModalOpen(false);
        setJoinCode('');
        if (res.payload?._id) {
           navigate(`/class/${res.payload._id}`);
        }
      }
    });
  };


  const handleOpenScanner = (mode) => {
     setScannerMode(mode);
     setScannerOpen(true);
  };

  useEffect(() => {
    if (!isCreateModalOpen && !isJoinModalOpen) {
      dispatch(clearClassError());
    }
  }, [isCreateModalOpen, isJoinModalOpen, dispatch]);

  return (
    <div className="min-h-screen relative text-white selection:bg-indigo-500/30 overflow-x-hidden">
      <Background3D />
      
      <header className="fixed top-0 left-0 w-full z-50 glass-panel border-b border-white/5 h-16 md:h-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 md:gap-4 truncate">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center indigo-glow shrink-0">
              <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
            <h1 className="text-sm md:text-xl font-black text-white tracking-tighter uppercase truncate">Edu<span className="text-indigo-400">Connect</span></h1>
          </Link>
          
          <div className="flex items-center gap-2 md:gap-6">
             <div className="hidden md:flex items-center gap-2">
                <Link to="/calendar" className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all" title="Calendar">
                   <CalendarIcon className="h-5 w-5" />
                </Link>
                <Link to="/analytics" className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all" title="Analytics">
                   <BarChart3 className="h-5 w-5" />
                </Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" className="p-3 text-indigo-400 hover:text-white hover:bg-indigo-600 rounded-2xl transition-all" title="Admin Panel">
                    <Shield className="h-5 w-5" />
                  </Link>
                )}
                 {user?.role === 'student' && (
                  <button onClick={() => handleOpenScanner('attendance')} className="p-3 text-emerald-400 hover:text-white hover:bg-emerald-600 rounded-2xl transition-all" title="Scan Attendance">
                    <Scan className="h-5 w-5" />
                  </button>
                 )}
             </div>

             <div className="h-8 w-px bg-white/10 hidden md:block"></div>

             <div className="relative">
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="p-2.5 md:p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl md:rounded-2xl transition-all relative" 
                >
                   <Bell className="h-4 w-4 md:h-5 md:w-5" />
                   {unreadCount > 0 && (
                      <span className="absolute top-2.5 right-2.5 h-2 w-2 md:h-2.5 md:w-2.5 bg-indigo-500 border-2 border-slate-900 rounded-full"></span>
                   )}
                </button>
                
                {isNotifOpen && (
                   <div className="absolute right-0 mt-4 w-[calc(100vw-2rem)] md:w-80 glass-panel rounded-2xl md:rounded-3xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 border-white/10 indigo-glow shadow-2xl z-[60]">
                      <div className="p-4 md:p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
                         <h3 className="font-black text-[10px] md:text-xs text-white uppercase tracking-widest">Recent Alerts</h3>
                         <span className="text-[8px] md:text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">{unreadCount} New</span>
                      </div>
                      <div className="max-h-80 md:max-h-96 overflow-y-auto">
                         {notifications.length > 0 ? (
                            notifications.map(n => (
                               <div key={n._id} className={`p-4 md:p-5 border-b border-white/5 last:border-none flex gap-3 md:gap-4 hover:bg-white/5 transition cursor-default ${!n.read ? 'bg-indigo-500/5' : ''}`}>
                                  <div className={`h-1.5 w-1.5 md:h-2 md:w-2 rounded-full mt-1.5 md:mt-2 shrink-0 ${!n.read ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'bg-transparent'}`}></div>
                                  <div>
                                     <p className="text-xs md:text-sm font-medium text-slate-200 leading-normal">{n.message}</p>
                                     <p className="text-[8px] md:text-[10px] font-bold text-slate-500 mt-1 md:mt-2 uppercase tracking-widest">{new Date(n.createdAt).toLocaleDateString()}</p>
                                  </div>
                                </div>
                            ))
                         ) : (
                            <div className="p-10 md:p-12 text-center text-slate-500 text-xs italic font-medium">Everything is quiet within the node.</div>
                         )}
                      </div>
                   </div>
                )}
             </div>

             <div className="flex items-center gap-2 md:gap-3 pl-2 border-l border-white/10">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                   <span className="text-white font-black text-xs md:text-sm uppercase">{user?.name?.charAt(0)}</span>
                </div>
                 <button onClick={() => { dispatch({ type: 'auth/logout' }); navigate('/'); }} className="p-2 md:p-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl md:rounded-2xl transition-all" title="Logout">
                   <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                 </button>
             </div>
          </div>
        </div>
      </header>

       <main className="max-w-7xl mx-auto px-4 md:px-6 pt-24 md:pt-32 pb-12 md:pb-20 relative z-10">
         <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-6 md:gap-8 overflow-x-hidden">
            <div className="animate-in fade-in slide-in-from-left-4 duration-700">
               <p className="text-[9px] md:text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-2 md:mb-4">Space Overview</p>
               <h2 className="text-2xl md:text-5xl font-black text-white tracking-tighter leading-tight drop-shadow-lg">Hello, {user?.name?.split(' ')[0]}. 👋<br className="hidden md:block" />Your digital terminal.</h2>
            </div>
            <div className="flex gap-3 md:gap-4 animate-in fade-in slide-in-from-right-4 duration-700 delay-100">
               {user?.role === 'teacher' || user?.role === 'admin' ? (
                 <button onClick={() => setCreateModalOpen(true)} className="flex-1 md:flex-none px-6 md:px-8 py-3.5 md:py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl md:rounded-2xl font-black transition-all flex items-center justify-center gap-2 md:gap-3 shadow-xl shadow-indigo-600/20 active:scale-95 text-[10px] md:text-sm uppercase tracking-widest">
                   <Plus className="h-4 w-4 md:h-5 md:w-5" /> Create
                 </button>
               ) : (
                 <button onClick={() => setJoinModalOpen(true)} className="flex-1 md:flex-none px-6 md:px-8 py-3.5 md:py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl md:rounded-2xl font-black transition-all flex items-center justify-center gap-2 md:gap-3 shadow-xl shadow-indigo-600/20 active:scale-95 text-[10px] md:text-sm uppercase tracking-widest">
                   <Plus className="h-4 w-4 md:h-5 md:w-5" /> Join
                 </button>
               )}
            </div>
         </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-12">
          <div className="xl:col-span-3">
            {isLoading && myClasses.length === 0 ? (
               <div className="flex justify-center items-center h-48"><Loader2 className="h-10 w-10 animate-spin text-indigo-500" /></div>
            ) : myClasses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {myClasses.map((cls) => <ClassCard key={cls._id} classData={cls} role={user?.role} />)}
              </div>
            ) : (
              <div className="glass-panel p-20 rounded-[4rem] text-center max-w-2xl mx-auto border-dashed border-2 border-white/10 animate-in zoom-in duration-1000">
                <div className="w-24 h-24 bg-white/5 rounded-3xl mx-auto mb-10 flex items-center justify-center indigo-glow"><BookOpen className="h-12 w-12 text-indigo-500" /></div>
                <h2 className="text-3xl font-black text-white mb-6 tracking-tight">Your world is empty.</h2>
                <p className="text-slate-400 font-medium text-lg leading-relaxed mb-10">{user?.role === 'teacher' ? "Start your digital teaching empire." : "The void awaits. Grab a secret code."}</p>
                <button onClick={() => user?.role === 'teacher' ? setCreateModalOpen(true) : setJoinModalOpen(true)} className="bg-white text-slate-950 font-black py-4 px-12 rounded-2xl hover:scale-105 active:scale-95 transition-all text-lg">Initialize Now</button>
              </div>
            )}
          </div>

          <div className="xl:col-span-1 space-y-8 animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
             <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-black text-white px-2 uppercase tracking-[0.2em]">Next Directives</h3>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{todoItems.length} Pending</span>
             </div>
             <div className="space-y-4 max-h-150 overflow-y-auto pr-2 scrollbar-hide">
                {isTodoLoading ? (
                   <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-slate-700" /></div>
                ) : todoItems.length > 0 ? (
                   todoItems.map((item, idx) => (
                      <Link key={idx} to={`/class/${item.classId}/assignment/${item._id}`} className="block glass-panel p-6 rounded-3xl border-white/5 bg-white/5 hover:bg-white/8 transition-all group">
                         <div className="flex gap-4">
                            <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${item.type === 'quiz' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                               {item.type === 'quiz' ? <BarChart3 className="w-5 h-5" /> : <CalendarIcon className="w-5 h-5" />}
                            </div>
                            <div>
                               <h4 className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{item.title}</h4>
                               <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest leading-none">In {item.className}</p>
                               <div className="mt-4 flex items-center gap-2">
                                  <Clock className="w-3 h-3 text-rose-400" />
                                  <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">{new Date(item.dueDate).toLocaleDateString()}</span>
                               </div>
                            </div>
                         </div>
                      </Link>
                   ))
                ) : (
                   <div className="p-10 rounded-3xl border-2 border-dashed border-white/5 text-center"><p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-relaxed">No pending directives found in the current stream.</p></div>
                )}
             </div>
          </div>
        </div>
      </main>

          {/* Mobile Bottom Navigation */}
          <nav className="fixed bottom-0 left-0 w-full z-[100] md:hidden glass-panel border-t border-white/5 pb-safe animate-in slide-in-from-bottom-8 duration-500">
             <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
                <Link to="/dashboard" className="flex flex-col items-center gap-1.5 px-4 text-indigo-400 relative">
                   <div className="w-1 h-1 rounded-full bg-indigo-400 absolute -top-2"></div>
                   <BookOpen className="w-5 h-5" />
                   <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
                </Link>
                <Link to="/calendar" className="flex flex-col items-center gap-1.5 px-4 text-slate-500">
                   <CalendarIcon className="w-5 h-5" />
                   <span className="text-[9px] font-black uppercase tracking-widest">Plan</span>
                </Link>
                <Link to="/analytics" className="flex flex-col items-center gap-1.5 px-4 text-slate-500">
                   <BarChart3 className="w-5 h-5" />
                   <span className="text-[9px] font-black uppercase tracking-widest">Stats</span>
                </Link>
                {user?.role === 'admin' ? (
                   <Link to="/admin" className="flex flex-col items-center gap-1.5 px-4 text-indigo-400">
                      <Shield className="w-5 h-5" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Admin</span>
                   </Link>
                ) : user?.role === 'student' ? (
                   <button onClick={() => handleOpenScanner('attendance')} className="flex flex-col items-center gap-1.5 px-4 text-emerald-400">
                      <Scan className="w-5 h-5" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Scan</span>
                   </button>
                ) : (
                   <div className="flex flex-col items-center gap-1.5 px-4 text-slate-500 opacity-20">
                      <Zap className="w-5 h-5" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Live</span>
                   </div>
                )}
             </div>
          </nav>

      {/* Modal Redesign - Create */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} title="New Space">
         <form onSubmit={handleCreateSubmit} className="space-y-6">
           <div className="space-y-2">
             <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Class Title</label>
             <input autoFocus required maxLength={50} value={createData.name} onChange={(e) => setCreateData({...createData, name: e.target.value})} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-white placeholder-slate-700" placeholder="e.g. Advanced Physics" />
           </div>
           <div className="space-y-2">
             <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Mission Description</label>
             <textarea required maxLength={500} rows={4} value={createData.description} onChange={(e) => setCreateData({...createData, description: e.target.value})} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all resize-none text-white h-32 placeholder-slate-700" placeholder="Explain the objective of this classroom..." />
           </div>
           <div className="flex justify-end gap-4 mt-10">
             <button type="button" onClick={() => setCreateModalOpen(false)} className="px-6 py-4 text-sm font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
             <button type="submit" disabled={isLoading} className="flex items-center gap-3 px-10 py-4 font-black text-white bg-indigo-600 hover:bg-indigo-500 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95">
                {isLoading && <Loader2 className="w-4 h-4 animate-spin"/>} Manifest
             </button>
           </div>
         </form>
      </Modal>

      {/* Modal Redesign - Join */}
      <Modal isOpen={isJoinModalOpen} onClose={() => setJoinModalOpen(false)} title="Join Cluster">
         <form onSubmit={handleJoinSubmit} className="space-y-8">
           <div className="bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-2xl text-indigo-400 text-sm font-medium text-center">Synchronizing as <span className="text-white font-bold">{user?.email}</span></div>
           <div className="space-y-4">
             <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 ml-1 text-center">Enter Secret Key</label>
             <div className="flex justify-center">
               <input autoFocus required placeholder="000-000" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} className="w-65 px-6 py-5 text-3xl text-center font-black tracking-[0.2em] bg-white/5 border-2 border-indigo-500/30 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-white placeholder-slate-800" />
             </div>
           </div>
           <div className="flex justify-center gap-4 mt-6">
             <button type="button" onClick={() => setJoinModalOpen(false)} className="px-8 py-4 font-bold text-slate-400 hover:text-white transition-colors">Abort</button>
             <button type="submit" disabled={isLoading || !joinCode} className="flex items-center gap-3 px-12 py-4 font-black text-white bg-indigo-600 hover:bg-indigo-500 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95">
                {isLoading && <Loader2 className="w-4 h-4 animate-spin"/>} Sync Interface
             </button>
           </div>
           {/* Added Scanner Option in Join Modal */}
           <div className="mt-8 pt-8 border-t border-white/5 text-center">
              <button 
                type="button" 
                onClick={() => { setJoinModalOpen(false); handleOpenScanner('join'); }} 
                className="inline-flex items-center gap-3 text-indigo-400 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
              >
                 <QrCode className="w-5 h-5" /> Scan Join Node Instead
              </button>
           </div>
         </form>
      </Modal>

      <SmartScanner 
         isOpen={isScannerOpen} 
         onClose={() => setScannerOpen(false)} 
         mode={scannerMode} 
      />
    </div>
  );
};

export default Dashboard;
