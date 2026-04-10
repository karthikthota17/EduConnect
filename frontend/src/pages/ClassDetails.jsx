import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClassDetails, clearActiveClass } from '../store/classSlice';
import { fetchClasswork, deleteMaterial, deleteAssignment, deleteQuiz, deleteAnnouncement } from '../store/classworkSlice';
import { BookOpen, Users, LayoutDashboard, Settings, ArrowLeft, Loader2, FileText, ClipboardList, ListChecks, Video, QrCode, Scan, X, TrendingUp, Clock, Target, Zap, Award, ChevronRight, Calendar as CalendarIcon, MessageSquare, MoreVertical, Share2, ExternalLink, Trash2, PieChart, CheckCircle2, AlertTriangle, Save } from 'lucide-react';
import CreateClassworkModals from '../components/CreateClassworkModals';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/axiosConfig';
import Modal from '../components/Modal';
import Background3D from '../components/Background3D';
import SmartScanner from '../components/SmartScanner';
import { useSocket } from '../context/SocketContext';

const ClassDetails = () => {
   const { classId } = useParams();
   const dispatch = useDispatch();
   const navigate = useNavigate();

   const { user } = useSelector(state => state.auth);
   const { activeClass, isLoading: isClassLoading, error } = useSelector(state => state.classes);
   const { materials, assignments, quizzes, isLoading: isWorkLoading } = useSelector(state => state.classwork);

   const [activeTab, setActiveTab] = useState('stream');

   // State
   const [announcements, setAnnouncements] = useState([]);
   const [announcementText, setAnnouncementText] = useState('');
   const [isPostingAnnouncement, setIsPostingAnnouncement] = useState(false);
   const [isAnnouncementsLoading, setIsAnnouncementsLoading] = useState(false);
   const [students, setStudents] = useState([]);
   const [isStudentsLoading, setIsStudentsLoading] = useState(false);
   const [isShowingJoinQr, setIsShowingJoinQr] = useState(false);
   const [classStats, setClassStats] = useState(null);
   const [isStatsLoading, setIsStatsLoading] = useState(false);
   const [isSettingsOpen, setIsSettingsOpen] = useState(false);
   const [editName, setEditName] = useState('');
   const [editDescription, setEditDescription] = useState('');
   const [isUpdatingClass, setIsUpdatingClass] = useState(false);
   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
   const [isDeleting, setIsDeleting] = useState(false);
   const [qrToken, setQrToken] = useState(null);
   const [isGeneratingQr, setIsGeneratingQr] = useState(false);
   const [isTerminatingQr, setIsTerminatingQr] = useState(false);
   const [isExporting, setIsExporting] = useState(false);
   const [isScannerOpen, setIsScannerOpen] = useState(false);
   
   // Real-time synchronization
   const [isTeacherOnline, setIsTeacherOnline] = useState(false);

   const socket = useSocket();

   useEffect(() => {
      if (socket && classId && user) {
         socket.emit('join-room', classId, user._id, user.name, user.role, { isLive: false });
         socket.on('classwork-updated', () => {
            dispatch(fetchClasswork(classId));
            fetchAnnouncements();
         });
         socket.on('attendance-updated', () => {
            fetchClassStats();
         });
         socket.on('room-status', ({ isTeacherOnline }) => {
            setIsTeacherOnline(isTeacherOnline);
         });
         socket.on('teacher-status', ({ online }) => {
            setIsTeacherOnline(online);
         });
         
         // Fetch initial status
         socket.emit('get-room-status', classId);

         return () => {
            socket.emit('leave-room', classId);
            socket.off('classwork-updated');
            socket.off('attendance-updated');
            socket.off('room-status');
            socket.off('teacher-status');
         };
      }
   }, [classId, user, dispatch, socket]);

   useEffect(() => {
      if (activeClass) {
         setEditName(activeClass.name);
         setEditDescription(activeClass.description);
      }
   }, [activeClass]);

   useEffect(() => {
      dispatch(fetchClassDetails(classId));
      dispatch(fetchClasswork(classId));
      fetchAnnouncements();
      fetchStudents();
      fetchClassStats();

      const interval = setInterval(() => {
         dispatch(fetchClasswork(classId));
         fetchAnnouncements();
      }, 30000);

      return () => {
         dispatch(clearActiveClass());
         clearInterval(interval);
      };
   }, [dispatch, classId]);

   const fetchClassStats = async () => {
      setIsStatsLoading(true);
      try {
         const res = await api.get(`/classes/${classId}/analytics`);
         setClassStats(res.data.data);
      } catch (err) {
         console.error("Failed to fetch class stats:", err);
      } finally {
         setIsStatsLoading(false);
      }
   };

   const fetchStudents = async () => {
      setIsStudentsLoading(true);
      try {
         const res = await api.get(`/classes/${classId}/students`);
         setStudents(res.data.data);
      } catch (err) {
         console.error("Failed to fetch students:", err);
      } finally {
         setIsStudentsLoading(false);
      }
   };

   const fetchAnnouncements = async () => {
      setIsAnnouncementsLoading(true);
      try {
         const res = await api.get(`/classwork/${classId}/announcements`);
         setAnnouncements(res.data.data);
      } catch (err) {
         console.error("Failed to fetch announcements:", err);
      } finally {
         setIsAnnouncementsLoading(false);
      }
   };

   const handlePostAnnouncement = async (e) => {
      e.preventDefault();
      if (!announcementText.trim()) return;

      setIsPostingAnnouncement(true);
      try {
         const res = await api.post(`/classwork/${classId}/announcements`, { text: announcementText });
         const newAnn = res.data.data;
         setAnnouncements([newAnn, ...announcements]);
         setAnnouncementText('');

         if (socket) {
            socket.emit('emit-classwork-update', classId);
         }
      } catch (err) {
         alert("Failed to post announcement");
      } finally {
         setIsPostingAnnouncement(false);
      }
   };

   const handleDeleteClass = async () => {
      setIsDeleting(true);
      try {
         await api.delete(`/classes/${classId}`);
         navigate('/dashboard');
      } catch (err) {
         alert("Failed to purge classroom data.");
         setIsDeleting(false);
         setIsDeleteModalOpen(false);
      }
   };

   const handleUpdateClass = async (e) => {
      e.preventDefault();
      setIsUpdatingClass(true);
      try {
         await api.put(`/classes/${classId}`, { name: editName, description: editDescription });
         dispatch(fetchClassDetails(classId));
         setIsSettingsOpen(false);
      } catch (err) {
         alert("Failed to update class details");
      } finally {
         setIsUpdatingClass(false);
      }
   };

   const handleGenerateQR = async () => {
      setIsGeneratingQr(true);
      try {
         const res = await api.post(`/classes/${classId}/attendance`);
         setQrToken(res.data.token);
      } catch (err) {
         alert("Failed to generate QR Code");
      } finally {
         setIsGeneratingQr(false);
      }
   };

   const handleTerminateAttendance = async () => {
      if (!qrToken) return;
      setIsTerminatingQr(true);
      try {
         await api.put(`/classes/${classId}/attendance/${qrToken}/terminate`);
         setQrToken(null);
      } catch (err) {
         alert("Failed to terminate attendance session.");
      } finally {
         setIsTerminatingQr(false);
      }
   };

   const handleExportData = async () => {
      setIsExporting(true);
      try {
         const res = await api.get(`/classes/${classId}/export`);
         const data = res.data.data;
         if (data.length === 0) return alert("Insufficient data nodes for mobilization.");

         // Generate CSV stream
         const headers = Object.keys(data[0]);
         const csvRows = [
            headers.join(','),
            ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
         ];
         const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
         
         const encodedUri = encodeURI(csvContent);
         const link = document.createElement("a");
         link.setAttribute("href", encodedUri);
         link.setAttribute("download", `Midnight_Indigo_Export_${activeClass.name.replace(/\s+/g, '_')}.csv`);
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
      } catch (err) {
         alert("Data mobilization failed: Security node rejected request.");
      } finally {
         setIsExporting(false);
      }
   };

   const isTeacher = user?.role?.toLowerCase() === 'teacher' || user?.role?.toLowerCase() === 'admin';

   if (isClassLoading) {
      return (
         <div className="min-h-screen flex items-center justify-center bg-[#020617]">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
         </div>
      );
   }

   if (error || !activeClass) {
      return (
         <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] p-4 text-white">
            <div className="glass-panel p-8 rounded-[3rem] border-rose-500/10 max-w-md w-full text-center bg-white/5">
               <h2 className="text-2xl font-black mb-2">Access Denied</h2>
               <p className="text-slate-400 mb-6 font-medium">{error || 'Class not found'}</p>
               <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 mx-auto justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition">
                  <ArrowLeft className="w-4 h-4" /> Return to Dashboard
               </button>
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen relative bg-[#020617] text-white selection:bg-indigo-500/30 overflow-x-hidden">
         <Background3D />
         
         <header className="fixed top-0 left-0 w-full z-[50] glass-panel border-b border-white/5 h-20">
            <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all group">
                     <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  </button>
                  <div className="h-8 w-px bg-white/10 hidden sm:block"></div>
                  <div>
                     <h1 className="text-lg font-black text-white tracking-tight leading-tight">{activeClass.name}</h1>
                     <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hidden sm:block">
                        Class Overview • {isTeacher ? 'Instructor Access' : 'Student Access'}
                     </p>
                  </div>
               </div>

               {/* Desktop Navigation */}
               <div className="hidden lg:flex items-center gap-1">
                  {[
                     { id: 'stream', label: 'Stream', icon: MessageSquare },
                     { id: 'classwork', label: 'Classwork', icon: BookOpen },
                     { id: 'people', label: 'People', icon: Users },
                     { id: 'analytics', label: 'Analytics', icon: PieChart },
                     ...(isTeacher ? [{ id: 'attendance', label: 'Attendance', icon: QrCode }] : [{ id: 'attendance', label: 'Mark Attendance', icon: Scan }])
                  ].map(tab => (
                     <button
                        key={tab.id}
                        onClick={() => {
                           if (tab.id === 'attendance' && !isTeacher) {
                              setIsScannerOpen(true);
                           } else {
                              setActiveTab(tab.id);
                           }
                        }}
                        className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all hide-scrollbar flex items-center gap-2 ${activeTab === tab.id && (tab.id !== 'attendance' || isTeacher) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                     >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                     </button>
                  ))}
               </div>

               <div className="flex items-center gap-4">
                  <div className="hidden md:flex flex-col items-end mr-2">
                     <p className="text-xs font-bold text-white">{user?.name}</p>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{user?.role}</p>
                  </div>
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center indigo-glow">
                     <span className="font-black text-white">{user?.name?.charAt(0)}</span>
                  </div>
               </div>
            </div>
         </header>

         <main className="max-w-7xl mx-auto px-4 md:px-6 pt-24 md:pt-32 pb-12 md:pb-20 relative z-10 w-full flex-1">
            <div className="min-h-48 md:h-64 rounded-[2rem] md:rounded-[3rem] bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-6 md:p-10 flex flex-col justify-end relative shadow-2xl shadow-indigo-600/20 mb-8 md:mb-12 group">
               <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-1000"></div>

               {isTeacher && activeClass.code && (
                  <div className="absolute top-8 right-10 flex flex-col items-end gap-3 z-[100]">
                     <div className="glass-panel px-4 py-2 rounded-2xl border-white/10 flex items-center gap-3 backdrop-blur-2xl bg-black/20">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Access Key</span>
                        <span className="font-black tracking-[0.3em] text-xl text-white">{activeClass.code}</span>
                     </div>
                     <div className="flex gap-2 relative z-[100] pointer-events-auto">
                        <button
                           onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsDeleteModalOpen(true); }}
                           className="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-xl border border-rose-500/20 transition backdrop-blur-xl flex items-center gap-2 group cursor-pointer shadow-xl shadow-rose-600/10"
                        >
                           <Trash2 className="w-4 h-4" /> Purge Class
                        </button>
                        <button
                           onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsShowingJoinQr(true); }}
                           className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl border border-white/10 transition backdrop-blur-xl cursor-pointer shadow-xl"
                           title="Show Access QR"
                        >
                           <QrCode className="w-4 h-4" />
                        </button>
                        <button
                           onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsSettingsOpen(true); }}
                           className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl border border-white/10 transition backdrop-blur-xl cursor-pointer shadow-xl"
                           title="Configure Terminal"
                        >
                           <Settings className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
               )}

               <div className="flex flex-col md:flex-row md:items-end justify-between relative z-10 gap-6">
                  <div className="max-w-2xl">
                     <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">Active Session</span>
                     </div>
                     <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tighter leading-tight">{activeClass.name}</h2>
                     <p className="text-indigo-100 font-medium text-sm md:text-lg opacity-80 line-clamp-2">{activeClass.description}</p>
                  </div>
                  
                  {isTeacher ? (
                    <button onClick={() => navigate(`/class/${classId}/live`)} className="w-full md:w-auto bg-rose-500 hover:bg-rose-600 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-2xl shadow-rose-500/30 transition transform hover:scale-105 active:scale-95 group">
                       <Video className="w-5 h-5 shadow-inner" />
                       Start Live Class
                    </button>
                  ) : (
                    <button 
                      onClick={() => isTeacherOnline ? navigate(`/class/${classId}/live`) : alert("Instructor is currently offline. Sessions activate upon facilitator presence.")} 
                      className={`w-full md:w-auto px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-2xl transition transform group ${isTeacherOnline ? 'bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-105 active:scale-95 shadow-emerald-500/30' : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'}`}
                    >
                       {isTeacherOnline ? (
                          <>
                            <span className="relative flex h-3 w-3">
                               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                               <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                            </span>
                            Join Live Session
                          </>
                       ) : (
                          <>
                            <Clock className="w-5 h-5" />
                            Waiting for Instructor
                          </>
                       )}
                    </button>
                  )}
               </div>
            </div>

            {activeTab === 'stream' && (
               <div className="flex flex-col lg:flex-row gap-8 relative animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="lg:w-80 shrink-0 space-y-6">
                     <div className="glass-panel p-6 rounded-[2rem] border-white/5 bg-white/5 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                           <CalendarIcon className="w-4 h-4 text-indigo-400" />
                           <h3 className="font-black text-white text-xs uppercase tracking-widest">Upcoming</h3>
                        </div>
                        <div className="space-y-4">
                           {/* Combined items logic */}
                           {[...assignments, ...quizzes]
                             .sort((a,b) => new Date(a.dueDate || a.createdAt) - new Date(b.dueDate || b.createdAt))
                             .filter(item => new Date(item.dueDate || item.createdAt) > new Date())
                             .slice(0, 3)
                             .map((item, i) => (
                                <div key={i} className="group cursor-pointer">
                                   <p className="text-sm font-bold text-slate-200 group-hover:text-indigo-400 transition-colors line-clamp-1">{item.title}</p>
                                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Due {new Date(item.dueDate || item.createdAt).toLocaleDateString()}</p>
                                </div>
                             ))}
                           {assignments.length === 0 && quizzes.length === 0 && (
                              <div className="py-4 text-center">
                                 <p className="text-xs text-slate-400 font-bold italic">No pending deadlines</p>
                              </div>
                           )}
                        </div>
                        <button onClick={() => setActiveTab('classwork')} className="w-full mt-8 py-3 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:bg-white/10 transition-all">View Timeline</button>
                     </div>
                  </div>

                  <div className="flex-1 space-y-6">
                     {/* Stream content same as before ... */}
                     {isTeacher && (
                        <div className="glass-panel p-6 rounded-[2.5rem] border-indigo-500/10 bg-white/5 relative overflow-hidden group shadow-2xl">
                           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-50"></div>
                           <div className="flex items-start gap-4 mb-4">
                              <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/20">
                                 <span className="text-white font-black">{user?.name?.charAt(0).toUpperCase()}</span>
                              </div>
                              <textarea value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)} placeholder="Broadcast a message to your classroom..." className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-white placeholder:text-slate-400 py-3 resize-none text-lg font-medium" rows={1} onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} />
                           </div>
                           <div className="flex justify-between items-center pt-4 border-t border-white/5">
                              <div className="flex gap-2">
                                 <button className="p-2.5 rounded-xl hover:bg-white/5 text-slate-400 transition-all"><Share2 className="w-4 h-4" /></button>
                                 <button className="p-2.5 rounded-xl hover:bg-white/5 text-slate-400 transition-all"><ExternalLink className="w-4 h-4" /></button>
                              </div>
                              <div className="flex items-center gap-3">
                                 <button type="button" onClick={() => setAnnouncementText('')} className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition">Cancel</button>
                                 <button onClick={handlePostAnnouncement} disabled={isPostingAnnouncement || !announcementText.trim()} className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20">
                                    {isPostingAnnouncement ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Publish'}
                                 </button>
                              </div>
                           </div>
                        </div>
                     )}

                     <div className="space-y-6">
                        {announcements.map((ann) => (
                           <div key={ann._id} className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-white/5 space-y-6 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500">
                              <div className="flex justify-between items-center">
                                 <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-indigo-600/20 rounded-xl flex items-center justify-center border border-indigo-500/20">
                                       <span className="text-indigo-400 font-black text-xs">{(ann.author?.name || 'U').charAt(0).toUpperCase()}</span>
                                    </div>
                                    <div>
                                       <h4 className="text-sm font-black text-white tracking-tight">{ann.author.name}</h4>
                                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(ann.createdAt).toLocaleDateString()}</p>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-3">
                                    {isTeacher && (
                                       <button onClick={async () => { if(window.confirm('Purge this announcement?')) { try { await api.delete(`/classwork/${classId}/announcements/${ann._id}`); setAnnouncements(announcements.filter(a => a._id !== ann._id)); } catch(e) { alert("Error"); } } }} className="p-2 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all border border-transparent hover:border-rose-500/20">
                                          <Trash2 className="w-4 h-4" />
                                       </button>
                                    )}
                                    <button className="p-2 rounded-xl hover:bg-white/5 text-slate-400 active:scale-95 transition-all"><MoreVertical className="w-4 h-4" /></button>
                                 </div>
                              </div>
                              <p className="text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">{ann.text}</p>
                           </div>
                        ))}

                        {[...assignments, ...materials, ...quizzes].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map((item, i) => {
                           const isAssignment = !!item.points;
                           const isQuiz = !!item.questions;
                           const typeLabel = isAssignment ? 'assignment' : (isQuiz ? 'quiz' : 'material');
                           const linkPath = isAssignment ? `/class/${classId}/assignment/${item._id}` : (isQuiz ? `/class/${classId}/quiz/${item._id}` : (item.url ? `http://localhost:5000${item.url}` : '#'));
                           
                           return (
                              <div key={i} className="glass-panel p-6 rounded-[2.5rem] border-white/5 bg-white/5 flex gap-6 hover:bg-white/[0.07] transition-all group">
                                 <div className={`p-4 rounded-2xl ${isAssignment ? 'bg-rose-500/10 text-rose-400' : (isQuiz ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-500')} shrink-0 group-hover:scale-110 transition-transform shadow-xl`}>
                                    {isAssignment ? <ClipboardList className="w-6 h-6" /> : (isQuiz ? <ListChecks className="w-6 h-6" /> : <FileText className="w-6 h-6" />)}
                                 </div>
                                 <div className="flex-1 flex flex-col justify-center gap-1">
                                    <p className="text-sm font-bold text-white">
                                       <span className="opacity-60">{activeClass.teacher.name} published a new {typeLabel}:</span>
                                       <Link to={linkPath} className="ml-2 hover:underline text-indigo-400 tracking-tight">{item.title}</Link>
                                    </p>
                                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{new Date(item.createdAt).toLocaleDateString()}</p>
                                 </div>
                              </div>
                           );
                        })}

                        {announcements.length === 0 && assignments.length === 0 && materials.length === 0 && quizzes.length === 0 && (
                           <div className="py-24 glass-panel rounded-[3rem] border-white/5 bg-white/5 flex flex-col items-center justify-center text-center">
                              <div className="w-20 h-20 bg-indigo-500/10 rounded-[2rem] flex items-center justify-center text-indigo-400 mb-6 font-black tracking-tight"><BookOpen className="w-10 h-10" /></div>
                              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Clear Stream</h3>
                              <p className="text-slate-400 max-w-sm font-medium">When updates are published, they will materialize here in real-time.</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'classwork' && (
               <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {isTeacher && <CreateClassworkModals classId={classId} socket={socket} />}
                  <div className="space-y-10">
                     {quizzes.length > 0 && (
                        <div className="space-y-4">
                           <h2 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 px-2 flex items-center gap-3"><ListChecks className="w-4 h-4"/> Assessments</h2>
                           {quizzes.map(q => <Link key={q._id} to={`/class/${classId}/quiz/${q._id}`} className="glass-panel p-6 rounded-[2rem] border-white/5 bg-white/5 flex items-center justify-between hover:bg-white/10 transition-all group">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-lg"><ListChecks className="w-5 h-5"/></div>
                                 <span className="font-bold text-white tracking-tight">{q.title}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                 {isTeacher && (
                                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if(window.confirm('Purge quiz?')) dispatch(deleteQuiz({ classId, quizId: q._id })); }} className="p-2 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all"><Trash2 className="w-4 h-4"/></button>
                                 )}
                                 <ChevronRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 transition-all" />
                              </div>
                           </Link>)}
                        </div>
                     )}
                     {assignments.length > 0 && (
                        <div className="space-y-4">
                           <h2 className="text-xs font-black uppercase tracking-[0.2em] text-rose-400 px-2 flex items-center gap-3"><ClipboardList className="w-4 h-4"/> Assignments</h2>
                           {assignments.map(assg => <Link key={assg._id} to={`/class/${classId}/assignment/${assg._id}`} className="glass-panel p-6 rounded-[2rem] border-white/5 bg-white/5 flex items-center justify-between hover:bg-white/10 transition-all group">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 bg-rose-600/10 rounded-xl flex items-center justify-center text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-lg"><ClipboardList className="w-5 h-5"/></div>
                                 <span className="font-bold text-white tracking-tight">{assg.title}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                 {isTeacher && (
                                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if(window.confirm('Purge assignment?')) dispatch(deleteAssignment({ classId, assignmentId: assg._id })); }} className="p-2 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all"><Trash2 className="w-4 h-4"/></button>
                                 )}
                                 <ChevronRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 transition-all" />
                              </div>
                           </Link>)}
                        </div>
                     )}
                     {materials.length > 0 && (
                        <div className="space-y-4">
                           <h2 className="text-xs font-black uppercase tracking-[0.2em] text-amber-400 px-2 flex items-center gap-3"><FileText className="w-4 h-4"/> Knowledge Base</h2>
                           {materials.map(mat => <a key={mat._id} href={mat.url ? `http://localhost:5000${mat.url}` : '#'} target="_blank" rel="noreferrer" className="glass-panel p-6 rounded-[2rem] border-white/5 bg-white/5 flex items-center justify-between hover:bg-white/10 transition-all group">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 bg-amber-600/10 rounded-xl flex items-center justify-center text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-lg"><FileText className="w-5 h-5"/></div>
                                 <span className="font-bold text-white tracking-tight">{mat.title}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                 {isTeacher && (
                                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if(window.confirm('Purge material?')) dispatch(deleteMaterial({ classId, materialId: mat._id })); }} className="p-2 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all"><Trash2 className="w-4 h-4"/></button>
                                 )}
                                 <ChevronRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 transition-all" />
                              </div>
                           </a>)}
                        </div>
                     )}
                  </div>
               </div>
            )}

            {activeTab === 'people' && (
               <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
                  <div className="space-y-4">
                     <h2 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 px-2 flex items-center gap-3"><Users className="w-4 h-4"/> Facilitators</h2>
                     <div className="glass-panel p-6 rounded-[2rem] border-white/5 bg-white/5 flex items-center gap-4 shadow-xl">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-white shadow-lg">{(activeClass.teacher?.name || 'T').charAt(0).toUpperCase()}</div>
                        <div>
                           <p className="font-black text-white text-lg tracking-tight">{activeClass.teacher?.name || 'Instructor'}</p>
                           <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Primary Instructor</p>
                        </div>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center px-2">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-3"><Users className="w-4 h-4"/> Academic Cohort</h2>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{students.length} Total</span>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {students.map(s => (
                           <div key={s._id} className="glass-panel p-4 rounded-2xl border-white/5 bg-white/5 flex items-center gap-4 hover:shadow-xl transition-all group cursor-default">
                              <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-xs font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">{(s.name || 'S').charAt(0).toUpperCase()}</div>
                              <span className="text-sm font-black text-white tracking-tight">{s.name}</span>
                           </div>
                        ))}
                        {students.length === 0 && (
                           <div className="col-span-full py-12 glass-panel rounded-[2rem] border-white/5 bg-white/5 text-center border-dashed border-2 flex items-center justify-center">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Waiting for student check-ins...</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'analytics' && (
               <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700">
                  {isStatsLoading ? <div className="text-center py-20"><Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto"/><p className="mt-4 text-slate-500 font-black uppercase text-[10px]">Processing Node Data...</p></div> : classStats && (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <MetricCard icon={<Users className="w-5 h-5"/>} label="Network Load" value={classStats.totalStudents} color="indigo" />
                        <MetricCard icon={<Target className="w-5 h-5"/>} label="Assessment Rate" value={(classStats.submissionRate || 0) + '%'} color="rose" />
                        <MetricCard icon={<Award className="w-5 h-5"/>} label="Mean Accuracy" value={classStats.avgQuizScore || '0'} color="amber" />
                        <MetricCard icon={<Zap className="w-5 h-5"/>} label="Attendance Rate" value={(classStats.attendanceRate || 0) + '%'} color="emerald" />
                     </div>
                  )}

                  {isTeacher && (
                     <div className="glass-panel p-10 rounded-[3rem] border-indigo-500/10 bg-white/5 flex flex-col md:flex-row items-center justify-between gap-8 animate-in slide-in-from-bottom-8 duration-1000 shadow-3xl">
                        <div className="space-y-2">
                           <h3 className="text-2xl font-black text-white tracking-tight">Academic Record Mobilization</h3>
                           <p className="text-slate-400 font-medium max-w-md">Extract comprehensive student transcripts, including all validated marks and verified attendance percentages as a standardized CSV node.</p>
                        </div>
                        <button 
                          onClick={handleExportData} 
                          disabled={isExporting}
                          className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all flex items-center gap-4 shadow-2xl shadow-indigo-600/30 active:scale-95 disabled:opacity-50 group"
                        >
                           {isExporting ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileText className="w-4 h-4 group-hover:rotate-12 transition-transform"/>}
                           Execute Data Export
                        </button>
                     </div>
                  )}
               </div>
            )}

            {activeTab === 'attendance' && isTeacher && (
               <div className="max-w-3xl mx-auto animate-in fade-in zoom-in duration-700">
                  <div className="glass-panel p-12 rounded-[4rem] border-white/5 bg-white/5 text-center relative overflow-hidden shadow-2xl">
                     <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl"></div>
                     <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-600/30">
                        <QrCode className="w-10 h-10 text-white" />
                     </div>
                     <h2 className="text-4xl font-black text-white mb-4 tracking-tighter">Presence Protocol</h2>
                     <p className="text-slate-400 mb-12 max-w-sm mx-auto font-medium leading-relaxed">Synthesize a unique validation key for student check-ins. Token synchronization prevents unauthorized entry.</p>
                     {!qrToken ? (
                        <button onClick={handleGenerateQR} disabled={isGeneratingQr} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 md:px-12 py-4 md:py-5 rounded-2xl md:rounded-[2rem] font-black uppercase tracking-widest text-[9px] md:text-xs transition-all flex items-center gap-4 mx-auto shadow-2xl shadow-indigo-600/30 active:scale-95 disabled:opacity-50">
                           {isGeneratingQr ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                           Initialize QR Session
                        </button>
                     ) : (
                        <div className="flex flex-col items-center w-full">
                           <div className="p-4 md:p-8 bg-white rounded-[2rem] md:rounded-[3rem] mb-8 md:mb-10 shadow-3xl border-[6px] md:border-[8px] border-indigo-600/10 relative">
                              <QRCodeSVG value={`${window.location.origin}/class/${classId}/attendance/${qrToken}`} size={window.innerWidth < 768 ? 200 : 280} />
                           </div>
                            <div className="text-center space-y-3 mb-8 w-full max-w-sm px-4">
                               <p className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400/60">Manual Attendance Token</p>
                               <div className="group relative">
                                  <h3 className="text-xs md:text-sm font-black text-white tracking-widest break-all px-6 py-3 bg-white/5 rounded-2xl border border-white/10 select-all cursor-pointer hover:bg-white/10 transition-colors">{qrToken}</h3>
                                  <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity pointer-events-none"></div>
                               </div>
                               <p className="text-[8px] text-slate-500 italic mt-2">Optical link failover: provide this to students for manual terminal entry.</p>
                            </div>
                           <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-sm px-4">
                              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/join/${activeClass.code}`); alert("Link copied!"); }} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-3">
                                 <Share2 className="w-4 h-4" /> Copy Link
                              </button>
                              <button onClick={handleTerminateAttendance} disabled={isTerminatingQr} className="w-full py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-rose-600/20">
                                 {isTerminatingQr ? <Loader2 className="w-4 h-4 animate-spin"/> : <X className="w-4 h-4" />} End Session
                              </button>
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            )}
         </main>

         {/* Modals Layer */}
         <Modal isOpen={isShowingJoinQr} onClose={() => setIsShowingJoinQr(false)} title="Classroom Access Key">
            <div className="flex flex-col items-center gap-8 p-6">
               <div className="bg-white p-6 rounded-[3rem] shadow-3xl border-[10px] border-indigo-600/10">
                  <QRCodeSVG value={`${window.location.origin}/join/${activeClass.code}`} size={240} />
               </div>
               <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-2">Secure Identifier</p>
                  <h3 className="text-5xl font-black text-white tracking-[0.2em]">{activeClass.code}</h3>
               </div>
               <button onClick={() => { navigator.clipboard.writeText(activeClass.code); alert("Copied!"); }} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-3 shadow-xl">
                  <Share2 className="w-4 h-4" /> Copy Secure Access Key
               </button>
            </div>
         </Modal>

         <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="CRITICAL: Manifest Deletion">
            <div className="space-y-6 p-4">
               <div className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-[2.5rem] flex items-center gap-6 text-rose-400 shadow-inner">
                  <AlertTriangle className="w-12 h-12 shrink-0 animate-pulse" />
                  <p className="text-sm font-bold leading-relaxed">Warning: This operation will permanently purge all transcripts, assignments, and student records. This action cannot be reversed.</p>
               </div>
               <div className="flex gap-4">
                  <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">Abort</button>
                  <button onClick={handleDeleteClass} disabled={isDeleting} className="flex-1 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all shadow-rose-600/30 flex items-center justify-center gap-2">
                     {isDeleting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>} Confirm Purge
                  </button>
               </div>
            </div>
         </Modal>

         <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Configure Classroom Buffer">
            <form onSubmit={handleUpdateClass} className="space-y-6 p-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 ml-2">Classroom Designation</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"/>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 ml-2">Operational Context</label>
                  <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-medium outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none shadow-inner"/>
               </div>
               <button type="submit" disabled={isUpdatingClass} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl shadow-indigo-600/20 flex items-center justify-center gap-3">
                  {isUpdatingClass ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Apply Transformation
               </button>
            </form>
         </Modal>

         <SmartScanner 
            isOpen={isScannerOpen} 
            onClose={() => setIsScannerOpen(false)} 
            mode="attendance" 
            classId={classId}
         />

         {/* Mobile Bottom Navigation */}
         <nav className="fixed bottom-0 left-0 w-full z-[100] lg:hidden glass-panel border-t border-white/5 pb-safe animate-in slide-in-from-bottom-8 duration-500">
            <div className="flex items-center justify-around h-16 md:h-20 px-2 max-w-lg mx-auto">
               {[
                  { id: 'stream', label: 'Home', icon: MessageSquare },
                  { id: 'classwork', label: 'Work', icon: BookOpen },
                  { id: 'people', label: 'Peers', icon: Users },
                  { id: 'analytics', label: 'Stats', icon: PieChart },
                  ...(isTeacher ? [{ id: 'attendance', label: 'Live', icon: QrCode }] : [{ id: 'attendance', label: 'Presence', icon: Scan }])
               ].map(tab => (
                  <button
                     key={tab.id}
                     onClick={() => {
                        if (tab.id === 'attendance' && !isTeacher) {
                           setIsScannerOpen(true);
                        } else {
                           setActiveTab(tab.id);
                        }
                     }}
                     className={`flex flex-col items-center gap-1.5 px-4 transition-all duration-300 relative group ${activeTab === tab.id && (tab.id !== 'attendance' || isTeacher) ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                     <div className={`w-1 h-1 rounded-full bg-indigo-400 absolute -top-2 transition-all duration-300 ${activeTab === tab.id ? 'opacity-100 scale-100' : 'opacity-0 scale-0 group-hover:opacity-50'}`}></div>
                     <tab.icon className={`w-5 h-5 transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'group-active:scale-90'}`} />
                     <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
                  </button>
               ))}
            </div>
         </nav>
      </div>
   );
};

const MetricCard = ({ icon, label, value, color }) => {
  const themes = {
    indigo: 'from-indigo-600/10 to-indigo-600/5 text-indigo-400 border-indigo-500/10',
    emerald: 'from-emerald-600/10 to-emerald-600/5 text-emerald-400 border-emerald-500/10',
    rose: 'from-rose-600/10 to-rose-600/5 text-rose-400 border-rose-500/10',
    amber: 'from-amber-600/10 to-amber-600/5 text-amber-400 border-amber-500/10'
  };
  return (
    <div className={`glass-panel p-8 rounded-[2.5rem] border bg-gradient-to-br ${themes[color] || themes.indigo} hover:scale-[1.02] transition-all duration-500 group relative overflow-hidden shadow-xl`}>
      <div className="flex flex-col gap-5 relative z-10">
        <div className="p-3 rounded-2xl bg-white/5 w-fit border border-white/5 shadow-inner">{icon}</div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{label}</p>
          <h4 className="text-4xl font-black text-white tracking-tighter leading-tight">{value}</h4>
        </div>
      </div>
    </div>
  );
};

export default ClassDetails;
