import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { joinClass } from '../store/classSlice';
import { Loader2, CheckCircle2, XCircle, Zap, ShieldCheck, ArrowRight, Home } from 'lucide-react';
import Background3D from '../components/Background3D';

const JoinClassViaQR = () => {
   const { code } = useParams();
   const navigate = useNavigate();
   const dispatch = useDispatch();

   const [status, setStatus] = useState('joining'); // joining, success, error
   const [errorMsg, setErrorMsg] = useState('');

   useEffect(() => {
      const performJoin = async () => {
         try {
            const action = await dispatch(joinClass(code));
            if (joinClass.fulfilled.match(action)) {
               setStatus('success');
               setTimeout(() => {
                  navigate(`/class/${action.payload._id}`);
               }, 2000);
            } else {
               setStatus('error');
               setErrorMsg(action.payload || "Could not synchronize with classroom node. Check if code is valid.");
            }
         } catch (err) {
            setStatus('error');
            setErrorMsg("An unexpected communication breach occurred.");
         }
      };

      performJoin();
   }, [code, dispatch, navigate]);

   return (
      <div className="min-h-screen relative bg-[#020617] text-white flex items-center justify-center p-6 selection:bg-indigo-500/30">
         <Background3D />
         
         <div className="glass-panel p-8 md:p-12 rounded-[2rem] md:rounded-[4rem] border-white/5 bg-white/5 max-w-lg w-full text-center relative z-10 shadow-3xl animate-in fade-in zoom-in-95 duration-700">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-500 animate-pulse"></div>
            
            {status === 'joining' && (
               <div className="space-y-8 py-10">
                  <div className="relative mx-auto w-fit">
                     <div className="p-8 rounded-[3rem] bg-indigo-500/10 border border-indigo-500/10 shadow-2xl">
                        <Loader2 className="w-16 h-16 animate-spin text-indigo-500" />
                     </div>
                  </div>
                  <div className="space-y-4">
                     <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase tracking-widest">Bridging Link...</h2>
                     <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-xs mx-auto">Calibrating your enrollment data with the central classroom node.</p>
                  </div>
               </div>
            )}

            {status === 'success' && (
               <div className="space-y-8 py-10">
                  <div className="relative mx-auto w-fit">
                     <div className="p-8 rounded-[3rem] bg-emerald-500/10 border border-emerald-500/10 shadow-2xl shadow-emerald-500/20">
                        <CheckCircle2 className="w-16 h-16 text-emerald-400" />
                     </div>
                     <div className="absolute -top-2 -right-2 p-3 bg-indigo-600 rounded-2xl shadow-xl">
                        <ShieldCheck className="w-6 h-6 text-white" />
                     </div>
                  </div>
                  <div className="space-y-4">
                     <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase tracking-widest">Sync Complete!</h2>
                     <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-8">Access granted. Redirecting to your assigned terminal...</p>
                  </div>
                  <div className="flex justify-center">
                     <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 animate-pulse">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Handshaking</span>
                        <ArrowRight className="w-4 h-4 text-indigo-400" />
                     </div>
                  </div>
               </div>
            )}

            {status === 'error' && (
               <div className="space-y-8 py-10">
                  <div className="relative mx-auto w-fit">
                     <div className="p-8 rounded-[3rem] bg-rose-500/10 border border-rose-500/10 shadow-2xl shadow-rose-500/20">
                        <XCircle className="w-16 h-16 text-rose-500" />
                     </div>
                     <div className="absolute -top-2 -right-2 p-3 bg-amber-600 rounded-2xl shadow-xl">
                        <Zap className="w-6 h-6 text-white" />
                     </div>
                  </div>
                  <div className="space-y-4">
                     <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase tracking-widest">Sync Breach</h2>
                     <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-xs mx-auto italic">{errorMsg}</p>
                  </div>
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs py-5 rounded-[2rem] transition-all shadow-2xl shadow-indigo-600/30 active:scale-95 flex items-center justify-center gap-3"
                  >
                     <Home className="w-4 h-4" />
                     Return to Dashboard
                  </button>
               </div>
            )}
         </div>
      </div>
   );
};

export default JoinClassViaQR;
