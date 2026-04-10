import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { CheckCircle2, XCircle, Loader2, ArrowLeft, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';
import Background3D from '../components/Background3D';

const TakeAttendance = () => {
   const { classId, token } = useParams();
   const navigate = useNavigate();
   
   const [status, setStatus] = useState('loading'); // loading, success, error
   const [message, setMessage] = useState('Verifying your temporal presence...');

   useEffect(() => {
     const markPresent = async () => {
        try {
           const res = await api.post(`/classes/${classId}/attendance/${token}`);
           setStatus('success');
           setMessage(res.data.message || "Your attendance has been successfully synchronized with the central node.");
        } catch (err) {
           setStatus('error');
           setMessage(err.response?.data?.message || err.message || "Authorization Breach: Failed to mark attendance. Token may be expired or invalid.");
        }
     };

     markPresent();
   }, [classId, token]);

   return (
      <div className="min-h-screen relative bg-[#020617] text-white flex items-center justify-center p-6 selection:bg-indigo-500/30">
         <Background3D />
         
         <div className="glass-panel p-8 md:p-12 rounded-[2rem] md:rounded-[4rem] border-white/5 bg-white/5 max-w-lg w-full text-center relative z-10 shadow-3xl animate-in fade-in zoom-in-95 duration-700">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-500 animate-pulse"></div>
            
            {status === 'loading' && (
               <div className="space-y-8 py-10">
                  <div className="relative mx-auto w-fit">
                     <div className="p-8 rounded-[3rem] bg-indigo-500/10 border border-indigo-500/10 shadow-2xl">
                        <Loader2 className="w-16 h-16 animate-spin text-indigo-500" />
                     </div>
                  </div>
                  <div className="space-y-4">
                     <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase tracking-widest">Processing Sync...</h2>
                     <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-xs mx-auto">{message}</p>
                  </div>
               </div>
            )}

            {status === 'success' && (
               <div className="space-y-8 shrink-0">
                  <div className="relative mx-auto w-fit">
                     <div className="p-8 rounded-[3rem] bg-emerald-500/10 border border-emerald-500/10 shadow-2xl shadow-emerald-500/20">
                        <CheckCircle2 className="w-16 h-16 text-emerald-400" />
                     </div>
                     <div className="absolute -top-2 -right-2 p-3 bg-indigo-600 rounded-2xl shadow-xl">
                        <Zap className="w-6 h-6 text-white" />
                     </div>
                  </div>
                  <div className="space-y-4">
                     <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter">Attendance Logged!</h2>
                     <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-8">{message}</p>
                  </div>
                  <button 
                    onClick={() => navigate(`/class/${classId}`)} 
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs py-5 rounded-[2rem] transition-all shadow-2xl shadow-indigo-600/30 active:scale-95 flex items-center justify-center gap-3"
                  >
                     <ShieldCheck className="w-4 h-4" />
                     Back to Class Terminal
                  </button>
               </div>
            )}

            {status === 'error' && (
               <div className="space-y-8 py-10">
                  <div className="relative mx-auto w-fit">
                     <div className="p-8 rounded-[3rem] bg-rose-500/10 border border-rose-500/10 shadow-2xl shadow-rose-500/20">
                        <XCircle className="w-16 h-16 text-rose-500" />
                     </div>
                     <div className="absolute -top-2 -right-2 p-3 bg-amber-600 rounded-2xl shadow-xl">
                        <AlertTriangle className="w-6 h-6 text-white" />
                     </div>
                  </div>
                  <div className="space-y-4">
                     <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase tracking-widest">Protocol Failure</h2>
                     <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-xs mx-auto italic">{message}</p>
                  </div>
                  <button 
                    onClick={() => navigate(`/class/${classId}`)} 
                    className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs py-5 rounded-[2rem] transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                     <ArrowLeft className="w-4 h-4" />
                     Return to Safety
                  </button>
               </div>
            )}
         </div>
      </div>
   )
}

export default TakeAttendance;
