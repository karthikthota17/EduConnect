import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClasswork } from '../store/classworkSlice';
import api from '../api/axiosConfig';
import { 
  ArrowLeft, Loader2, CheckCircle2, ChevronRight, 
  ListChecks, Zap, Award, Target, HelpCircle,
  TrendingUp, Clock, AlertTriangle
} from 'lucide-react';
import Background3D from '../components/Background3D';

const TakeQuiz = () => {
  const { classId, quizId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { quizzes } = useSelector(state => state.classwork);
  const [quiz, setQuiz] = useState(null);
  
  const [answers, setAnswers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);
  const totalSecondsRef = useRef(0);

  useEffect(() => {
    if (quizzes.length === 0) {
      dispatch(fetchClasswork(classId));
    }
  }, [dispatch, classId, quizzes.length]);

  useEffect(() => {
    const found = quizzes.find(q => q._id === quizId);
     if (found) {
        if (found.submitted) {
           setResult({ score: found.score, total: found.questions.length * 10 });
           return;
        }

        setQuiz(found);
        setAnswers(new Array(found.questions.length).fill(null));
        
        // Initialize timer
        const durationMinutes = found.duration || 30;
        const durationSeconds = durationMinutes * 60;
        setTimeLeft(durationSeconds);
        totalSecondsRef.current = durationSeconds;
     } else {
        dispatch(fetchClasswork(classId));
     }
  }, [quizzes, quizId, dispatch, classId]);

  // Timer Logic
  useEffect(() => {
    if (timeLeft === null || result) return;

    if (timeLeft <= 0) {
       autoSubmit();
       return;
    }

    timerRef.current = setInterval(() => {
       setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft, result]);

  const autoSubmit = () => {
     console.log("Time expired. Force synchronizing assessment packets...");
     handleSubmit(true);
  };

  const handleSelectOption = (qIndex, optionIndex) => {
     const newAnswers = [...answers];
     newAnswers[qIndex] = optionIndex;
     setAnswers(newAnswers);
  };

  const handleSubmit = async (isAuto = false) => {
    if (!isAuto && answers.includes(null)) {
      if(!window.confirm("Detected incomplete question sets. Proceed with partial evaluation?")) return;
    }
    
    setIsSubmitting(true);
    try {
       const res = await api.post(`/classwork/${classId}/quizzes/${quizId}/submit`, { answers });
       setResult({ score: res.data.data.score, total: quiz.questions.length * 10 });
    } catch (e) {
       alert("Sync Error: Failed to transmit evaluation data.");
    } finally {
       setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
     const mins = Math.floor(seconds / 60);
     const secs = seconds % 60;
     return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!quiz) return (
    <div className="min-h-screen relative bg-[#020617] flex items-center justify-center">
       <Background3D />
       <div className="flex flex-col items-center gap-4 relative z-10">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600"/>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Calibrating Assessment Stream...</p>
       </div>
    </div>
  );

  if (result) {
      return (
         <div className="min-h-screen relative bg-[#020617] text-white flex items-center justify-center p-6 selection:bg-indigo-500/30">
            <Background3D />
            <div className="glass-panel p-12 rounded-[4rem] border-white/5 bg-white/5 max-w-xl w-full text-center relative z-10 shadow-3xl">
               <div className="relative mx-auto mb-10 w-fit">
                  <div className="p-8 rounded-[3rem] bg-emerald-500/10 border border-emerald-500/10 shadow-2xl shadow-emerald-500/20">
                     <Award className="w-16 h-16 text-emerald-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 p-3 bg-indigo-600 rounded-2xl shadow-xl">
                     <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
               </div>

               <h2 className="text-4xl font-black text-white tracking-tighter mb-4">Assessment Terminated</h2>
               <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-10">Data packets successfully synchronized</p>
               
               <div className="glass-panel p-12 rounded-[3.5rem] bg-indigo-600/10 border border-white/5 mb-12 relative overflow-hidden group">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-4 relative z-10">Synthesized Performance Index</p>
                  <div className="flex items-center justify-center gap-2 relative z-10">
                     <p className="text-7xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(79,70,229,0.3)]">{result.score}</p>
                     <p className="text-2xl font-black text-slate-400 tracking-tight">/ {result.total}</p>
                  </div>
               </div>

               <button 
                 onClick={() => navigate(`/class/${classId}`)}
                 className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs py-6 rounded-[2.5rem] transition-all shadow-2xl shadow-indigo-600/30 active:scale-95 flex items-center justify-center gap-3"
               >
                  <TrendingUp className="w-4 h-4" />
                  Continue Operations
               </button>
            </div>
         </div>
      );
  }

  const isLowTime = timeLeft <= 60;

  return (
    <div className="min-h-screen relative bg-[#020617] text-white selection:bg-indigo-500/30 overflow-x-hidden">
      <Background3D />
      
      <header className="fixed top-0 left-0 w-full z-[100] glass-panel border-b border-white/5 h-16 md:h-20 px-4 md:px-6 backdrop-blur-2xl">
        <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between">
           <div className="flex items-center gap-2 md:gap-4 truncate">
              <button 
                onClick={() => navigate(`/class/${classId}`)} 
                className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all group"
              >
                 <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center gap-2 md:gap-3 truncate">
                 <div className="bg-indigo-600 p-1.5 md:p-2 rounded-xl shadow-lg shadow-indigo-600/20 shrink-0">
                    <ListChecks className="w-4 h-4 md:w-5 md:h-5 text-white" />
                 </div>
                 <div className="truncate">
                    <h1 className="text-sm md:text-lg font-black text-white tracking-tight uppercase leading-none truncate">{quiz.title}</h1>
                    <p className="hidden sm:block text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Live Assessment Protocol</p>
                 </div>
              </div>
           </div>

           <div className={`flex items-center gap-2 md:gap-4 px-3 md:px-6 py-1.5 md:py-2 rounded-xl md:rounded-2xl border transition-all duration-500 ${isLowTime ? 'bg-rose-500/10 border-rose-500/50 animate-pulse' : 'bg-white/5 border-white/5'}`}>
              <div className="text-right">
                 <p className={`hidden sm:block text-[9px] font-black uppercase tracking-widest ${isLowTime ? 'text-rose-400' : 'text-slate-400'}`}>Operational Time Remaining</p>
                 <p className={`text-sm md:text-xl font-black tabular-nums tracking-widest ${isLowTime ? 'text-rose-400' : 'text-white'}`}>{formatTime(timeLeft)}</p>
              </div>
              <Clock className={`w-4 h-4 md:w-5 md:h-5 ${isLowTime ? 'text-rose-400' : 'text-indigo-400'}`} />
           </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-40 relative z-10 space-y-12">
         {/* Instruction Block */}
         <div className="glass-panel p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border-white/5 bg-white/5 relative overflow-hidden group">
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter mb-4">{quiz.title}</h1>
            <p className="text-slate-400 font-medium text-sm md:text-lg leading-relaxed max-w-2xl">{quiz.description}</p>
            <div className="mt-8 flex flex-wrap gap-2 md:gap-4">
               <div className="px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl bg-white/5 border border-white/5 flex items-center gap-2">
                  <Target className="w-3 h-3 md:w-4 md:h-4 text-rose-400" />
                  <span className="text-[8px] md:text-[10px] font-black text-white uppercase tracking-widest">{quiz.questions.length} Modules</span>
               </div>
               <div className="px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl bg-white/5 border border-white/5 flex items-center gap-2">
                  <Clock className="w-3 h-3 md:w-4 md:h-4 text-indigo-400" />
                  <span className="text-[8px] md:text-[10px] font-black text-white uppercase tracking-widest">{quiz.duration} Min मिशन</span>
                  <span className="text-[8px] md:text-[10px] font-black text-white uppercase tracking-widest">{quiz.duration} Min</span>
               </div>
            </div>
         </div>

         {/* Question Set */}
         <div className="space-y-8">
            {quiz.questions.map((q, qIdx) => (
               <div key={qIdx} className={`glass-panel p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border-white/5 transition-all duration-700 ${answers[qIdx] !== null ? 'bg-indigo-600/[0.03] border-indigo-500/10 shadow-2xl shadow-indigo-600/5' : 'bg-white/[0.03]'}`}>
                  <div className="flex flex-col gap-6 md:gap-8">
                     <div className="flex items-start gap-4">
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                           <span className="text-xs md:text-sm font-black text-indigo-400">{qIdx + 1}</span>
                        </div>
                        <h3 className="text-lg md:text-xl font-black text-white tracking-tight leading-tight">{q.questionText}</h3>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                       {q.options.map((opt, oIdx) => (
                          <label key={oIdx} className={`flex items-center gap-3 md:gap-4 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border transition-all cursor-pointer group ${answers[qIdx] === oIdx ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-600/20' : 'bg-white/5 border-white/5 hover:bg-white/[0.08] hover:border-white/10'}`}>
                             <input 
                               type="radio" 
                               name={`question-${qIdx}`} 
                               checked={answers[qIdx] === oIdx}
                               onChange={() => handleSelectOption(qIdx, oIdx)}
                               className="hidden"
                             />
                             <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${answers[qIdx] === oIdx ? 'bg-white border-white' : 'border-white/20 group-hover:border-indigo-400'}`}>
                                {answers[qIdx] === oIdx && <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-indigo-600" />}
                             </div>
                             <span className={`text-sm md:text-base font-bold tracking-tight ${answers[qIdx] === oIdx ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{opt}</span>
                          </label>
                       ))}
                     </div>
                  </div>
               </div>
            ))}
         </div>

         {/* Submit Dock */}
         <div className="fixed bottom-10 left-0 w-full px-6 z-50">
          <div className="max-w-4xl mx-auto glass-panel p-4 md:p-6 rounded-3xl md:rounded-[2.5rem] border-white/10 bg-white/5 backdrop-blur-3xl shadow-3xl flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 overflow-hidden">
             <div className="absolute top-0 left-0 h-1 bg-indigo-600 transition-all duration-700" style={{ width: `${(answers.filter(a => a !== null).length / quiz.questions.length) * 100}%` }}></div>
             
             <div className="flex items-center justify-between w-full md:w-auto md:gap-8">
                <div className="flex flex-col">
                   <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Execution Progress</p>
                   <div className="flex items-center gap-2 md:gap-3">
                      <span className="text-xl md:text-2xl font-black text-white">{answers.filter(a => a !== null).length}</span>
                      <span className="text-[10px] md:text-xs font-black text-slate-400">/ {quiz.questions.length} EVALUATED</span>
                   </div>
                </div>
                {isLowTime && (
                   <div className="flex items-center gap-2 text-rose-500 animate-pulse">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="hidden sm:block text-[9px] font-black uppercase tracking-widest">Temporal Breach</span>
                   </div>
                )}
             </div>

             <button 
               onClick={() => handleSubmit()} 
               disabled={isSubmitting}
               className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[10px] px-8 md:px-12 py-4 md:py-5 rounded-2xl md:rounded-[1.5rem] shadow-2xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-4 disabled:opacity-30 active:scale-95"
             >
               {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4"/>}
               Finalize Assessment
             </button>
          </div>
         </div>
      </main>
    </div>
  );
}

export default TakeQuiz;
