import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClassDetails } from '../store/classSlice';
import { fetchClasswork } from '../store/classworkSlice';
import api from '../api/axiosConfig';
import { ArrowLeft, FileText, ClipboardList, Loader2, Link as LinkIcon, Upload, CheckCircle2, User, ExternalLink, Save, Plus, Zap } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import Background3D from '../components/Background3D';

const AssignmentDetails = () => {
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { activeClass } = useSelector(state => state.classes);
  const { assignments } = useSelector(state => state.classwork);
  const { user } = useSelector(state => state.auth);

  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  // Teacher-only state
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [isNotifLoading, setIsNotifLoading] = useState(false); // Reuse loader
  const [gradingData, setGradingData] = useState({}); // { submissionId: { grade, feedback } }

  useEffect(() => {
    if (!activeClass || activeClass._id !== classId) dispatch(fetchClassDetails(classId));
    if (assignments.length === 0) dispatch(fetchClasswork(classId));
  }, [dispatch, classId, activeClass, assignments.length]);

  useEffect(() => {
    const found = assignments.find(a => a._id === assignmentId);
    if (found) {
       setAssignment(found);
       if (found.submitted) {
          setSubmission({ fileUrl: 'synced', status: 'turned_in' });
       }
    }
  }, [assignments, assignmentId]);

  // If student, check if they have already submitted
  useEffect(() => {
    if (user?.role === 'teacher' || user?.role === 'admin') {
       fetchSubmissions();
    }
  }, [user, assignmentId]);

  const fetchSubmissions = async () => {
    try {
      const res = await api.get(`/classwork/${classId}/assignments/${assignmentId}/submissions`);
      setAllSubmissions(res.data.data);
      
      // Init grading data
      const initialData = {};
      res.data.data.forEach(s => {
         initialData[s._id] = { grade: s.grade || '', feedback: s.feedback || '' };
      });
      setGradingData(initialData);
    } catch (err) {
      console.error("Failed to fetch submissions");
    }
  };

  const handleGradeSubmit = async (submissionId) => {
     try {
        const { grade, feedback } = gradingData[submissionId];
        await api.put(`/classwork/${classId}/submissions/${submissionId}/grade`, { grade, feedback });
        addToast("Grade updated successfully!");
        setAllSubmissions(allSubmissions.map(s => s._id === submissionId ? {...s, grade, feedback, status: 'turned_in'} : s));
     } catch (err) {
        addToast("Failed to update grade", "error");
     }
  };

  const handleTurnIn = async () => {
    if (!file) return alert("Please attach your work");
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/classwork/${classId}/assignments/${assignmentId}/submit`, formData, {
         headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSubmission({ fileUrl: 'submitted', status: 'turned_in' });
    } catch (e) {
      console.error(e);
      alert("Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!assignment) return <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" /></div>;

  return (
    <div className="min-h-screen relative bg-[#020617] text-white selection:bg-indigo-500/30 overflow-x-hidden">
      <Background3D />
      
      {/* Premium Header */}
      <header className="fixed top-0 left-0 w-full z-[50] glass-panel border-b border-white/5 h-16 md:h-20 backdrop-blur-2xl">
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 h-full flex items-center justify-between">
           <div className="flex items-center gap-2 md:gap-4 truncate">
              <button 
                onClick={() => navigate(`/class/${classId}`)} 
                className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all group"
              >
                 <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="h-6 w-px bg-white/10 hidden sm:block"></div>
              <div className="flex items-center gap-2 md:gap-3 truncate">
                 <div className="bg-indigo-600 p-1.5 md:p-2 rounded-xl shadow-lg shadow-indigo-600/20 shrink-0">
                    <ClipboardList className="w-4 h-4 md:w-5 md:h-5 text-white" />
                 </div>
                 <h1 className="text-sm md:text-lg font-black text-white tracking-tight leading-tight truncate">{assignment.title}</h1>
              </div>
           </div>

           <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end mr-1">
                 <p className="text-[10px] font-bold text-white">{user?.name}</p>
                 <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none">{user?.role}</p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center indigo-glow text-xs md:text-sm">
                 <span className="font-black text-white">{user?.name?.charAt(0)}</span>
              </div>
           </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-6 pt-32 pb-20 relative z-10 w-full flex-1 flex flex-col lg:flex-row gap-12">
         {/* Main Content */}
         <div className="flex-1 space-y-10 animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                   <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-indigo-400 border border-indigo-500/10">Assessment Module</span>
                   <span className="px-3 py-1 rounded-full bg-rose-500/10 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-rose-400 border border-rose-500/10">{assignment.points} Points Available</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight">{assignment.title}</h1>
               <div className="flex flex-wrap items-center gap-6 pt-4">
                   <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/5">
                         <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="text-sm font-bold text-slate-300">{activeClass?.teacher?.name || 'Lead Instructor'}</span>
                   </div>
                   {assignment.dueDate && (
                      <div className="flex items-center gap-3">
                         <div className="h-8 w-8 bg-rose-500/10 rounded-lg flex items-center justify-center border border-rose-500/10">
                            <Clock className="w-4 h-4 text-rose-400" />
                         </div>
                         <span className="text-sm font-bold text-rose-400">Deadline: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      </div>
                   )}
               </div>
            </div>

            <div className="glass-panel p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/5 bg-white/5 min-h-[200px] md:min-h-[300px]">
               <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">Instructional Context</h3>
               <p className="text-slate-300 font-medium text-sm md:text-lg leading-relaxed whitespace-pre-wrap">{assignment.description}</p>
               
               {assignment.originalName && (
                  <div className="pt-10 mt-10 border-t border-white/5">
                    <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                       <LinkIcon className="w-3.5 h-3.5"/> Supplemental Intelligence
                    </h3>
                    <a href={`http://localhost:5000${assignment.fileUrl}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-4 p-4 glass-panel border-white/5 bg-white/5 rounded-3xl hover:bg-white/10 transition-all group max-w-sm w-full">
                       <div className="h-12 w-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                          <FileText className="w-6 h-6" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <span className="font-black text-white text-sm block truncate tracking-tight">{assignment.originalName}</span>
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Reference PDF</span>
                       </div>
                       <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                    </a>
                  </div>
               )}
            </div>
         </div>

          {/* Student Work Panel */}
          {user?.role === 'student' && (
            <div className="w-full lg:w-96 shrink-0 animate-in fade-in slide-in-from-right-4 duration-700">
               <div className="glass-panel p-8 rounded-[3rem] border-white/5 bg-white/5 relative overflow-hidden sticky top-32">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-emerald-500"></div>
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-xl font-black text-white tracking-tight">Your Solution</h3>
                     <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${submission ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'}`}>
                       {submission ? 'Validated' : 'Pending'}
                     </div>
                  </div>
                  
                  {submission ? (
                     <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="h-20 w-20 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center text-emerald-400 shadow-2xl shadow-emerald-500/20">
                           <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <div>
                           <p className="font-black text-white text-lg tracking-tight">Mission Accomplished</p>
                           <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Work has been synced</p>
                        </div>
                        <button className="pt-4 text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors">Resubmit Module</button>
                     </div>
                  ) : (
                     <div className="space-y-6">
                        <input type="file" id="upload" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                        <label htmlFor="upload" className="w-full aspect-square rounded-[2.5rem] border-2 border-dashed border-white/10 text-slate-400 hover:border-indigo-500 hover:text-indigo-400 transition-all flex flex-col items-center justify-center gap-4 font-bold cursor-pointer bg-white/[0.02] group">
                           <div className="h-16 w-16 bg-white/5 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Plus className={`w-8 h-8 ${file ? 'text-indigo-400' : ''}`}/>
                           </div>
                           <p className="text-xs font-black uppercase tracking-widest px-6 text-center line-clamp-2">
                              {file ? file.name : 'Inject Solution File'}
                           </p>
                        </label>
                        <button 
                          onClick={handleTurnIn}
                          disabled={isSubmitting || !file} 
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs py-5 rounded-[2rem] transition-all disabled:opacity-30 flex justify-center items-center gap-3 shadow-2xl shadow-indigo-600/30 active:scale-95"
                        >
                           {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Zap className="w-4 h-4" />}
                           Execute Submission
                        </button>
                        <p className="text-[10px] text-slate-400 font-bold text-center uppercase tracking-widest">Supported: PDF, DOCX, ZIP • Max 50MB</p>
                     </div>
                  )}
               </div>
            </div>
          )}

          {/* Teacher Grading Panel */}
          {(user?.role === 'teacher' || user?.role === 'admin') && (
             <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
                <div className="flex items-center justify-between px-2">
                   <h2 className="text-2xl font-black text-white tracking-tight uppercase tracking-widest border-l-4 border-indigo-600 pl-4">Validation Queue</h2>
                   <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-indigo-400">{allSubmissions.length} Turned In</span>
                </div>

                {allSubmissions.length === 0 ? (
                   <div className="glass-panel p-20 rounded-[3rem] border-white/5 bg-white/5 text-center">
                      <User className="h-16 w-16 text-slate-700 mx-auto mb-6" />
                      <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Awaiting student submissions...</p>
                   </div>
                ) : (
                   <div className="space-y-6">
                      {allSubmissions.map(sub => (
                         <div key={sub._id} className="glass-panel p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border-white/5 bg-white/5 flex flex-col xl:flex-row gap-8 md:gap-10 hover:bg-white/[0.07] transition-all group">
                            <div className="flex-1">
                               <div className="flex items-center gap-4 md:gap-6 mb-6 md:mb-8">
                                  <div className="h-12 w-12 md:h-14 md:w-14 bg-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                                     <span className="font-black text-lg md:text-xl text-white">{sub.student.name.charAt(0).toUpperCase()}</span>
                                  </div>
                                  <div>
                                     <h4 className="font-black text-lg md:text-xl text-white tracking-tight leading-none mb-1">{sub.student.name}</h4>
                                     <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest">Synced: {new Date(sub.createdAt).toLocaleDateString()}</p>
                                  </div>
                               </div>
                               
                               <a href={`http://localhost:5000${sub.fileUrl}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center w-full sm:w-auto gap-3 px-6 py-3.5 glass-panel border-white/5 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-all shadow-xl">
                                  <ExternalLink className="w-3.5 h-3.5" /> Inspect Module
                               </a>
                            </div>

                            <div className="w-full xl:w-80 space-y-4 md:space-y-5 glass-panel p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] bg-black/20 border-white/5">
                               <div className="space-y-2">
                                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Grade Assignment</label>
                                  <div className="relative">
                                     <input 
                                       type="number"
                                       max={assignment.points}
                                       value={gradingData[sub._id]?.grade || ''}
                                       onChange={(e) => setGradingData({...gradingData, [sub._id]: {...gradingData[sub._id], grade: e.target.value}})}
                                       className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-lg font-black text-indigo-400 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                       placeholder="0"
                                     />
                                     <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-black">/ {assignment.points}</span>
                                  </div>
                               </div>
                               <div className="space-y-2">
                                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Feedback Protocol</label>
                                  <textarea 
                                    rows="3"
                                    value={gradingData[sub._id]?.feedback || ''}
                                    onChange={(e) => setGradingData({...gradingData, [sub._id]: {...gradingData[sub._id], feedback: e.target.value}})}
                                    className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-xs font-medium text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
                                    placeholder="Synthesize constructive critique..."
                                  />
                               </div>
                               <button 
                                 onClick={() => handleGradeSubmit(sub._id)}
                                 className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-2xl shadow-indigo-600/30 active:scale-95"
                               >
                                  <Save className="w-3.5 h-3.5"/> Push Evaluation
                               </button>
                            </div>
                         </div>
                      ))}
                   </div>
                )}
             </div>
          )}
       </main>
    </div>
  );
};

export default AssignmentDetails;
