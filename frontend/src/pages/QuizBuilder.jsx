import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createQuiz, updateQuiz, fetchClasswork } from '../store/classworkSlice';
import { ArrowLeft, Plus, Trash2, Save, Loader2, ListChecks, CheckCircle2, Circle, X, Clock } from 'lucide-react';
import Background3D from '../components/Background3D';
import { useSocket } from '../context/SocketContext';

const QuizBuilder = () => {
  const { classId, quizId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, quizzes } = useSelector(state => state.classwork);
  const socket = useSocket();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(15);
  const [questions, setQuestions] = useState([
    {
      questionText: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0
    }
  ]);

  const isEditMode = !!quizId;

  useEffect(() => {
    if (isEditMode && quizzes.length > 0) {
      const quiz = quizzes.find(q => q._id === quizId);
      if (quiz) {
        setTitle(quiz.title);
        setDescription(quiz.description || '');
        setDuration(quiz.duration || 15);
        setQuestions(quiz.questions);
      }
    }
  }, [isEditMode, quizId, quizzes]);

  const handleAddQuestion = () => {
    setQuestions([...questions, { questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 }]);
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleQuestionChange = (index, value) => {
    const newQs = [...questions];
    newQs[index].questionText = value;
    setQuestions(newQs);
  };

  const handleOptionChange = (qIdx, oIdx, value) => {
    const newQs = [...questions];
    newQs[qIdx].options[oIdx] = value;
    setQuestions(newQs);
  };

  const handleCorrectOptionChange = (qIdx, oIdx) => {
    const newQs = [...questions];
    newQs[qIdx].correctOptionIndex = oIdx;
    setQuestions(newQs);
  };

  const handleAddOption = (qIdx) => {
    const newQs = [...questions];
    newQs[qIdx].options.push('');
    setQuestions(newQs);
  };

  const handleRemoveOption = (qIdx, oIdx) => {
    const newQs = [...questions];
    if (newQs[qIdx].options.length > 2) {
      newQs[qIdx].options = newQs[qIdx].options.filter((_, i) => i !== oIdx);
      if (newQs[qIdx].correctOptionIndex >= newQs[qIdx].options.length) {
         newQs[qIdx].correctOptionIndex = 0;
      }
      setQuestions(newQs);
    }
  };

  const handleSave = () => {
    if (!title) return alert("Title is required");
    for (let q of questions) {
       if (!q.questionText) return alert("All questions must have text");
       for (let o of q.options) {
          if (!o) return alert("All options must have text");
       }
    }

    const quizData = { title, description, duration, questions };
    const action = isEditMode 
       ? updateQuiz({ classId, quizId, quizData })
       : createQuiz({ classId, quizData });

    dispatch(action)
      .then((res) => {
         if (!res.error) {
            if (socket) {
               socket.emit('emit-classwork-update', classId);
            }
            navigate(`/class/${classId}`);
         }
      });
  };

  return (
    <div className="min-h-screen relative bg-[#020617] text-white selection:bg-indigo-500/30 overflow-x-hidden">
      <Background3D />
      
      <header className="fixed top-0 left-0 w-full z-[50] glass-panel border-b border-white/5 h-16 md:h-20 px-4 md:px-6 backdrop-blur-2xl">
        <div className="max-w-4xl mx-auto h-full flex items-center justify-between">
           <div className="flex items-center gap-2 md:gap-4 truncate">
              <button onClick={() => navigate(`/class/${classId}`)} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all group">
                 <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center gap-2 md:gap-3 truncate">
                 <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <ListChecks className="w-4 h-4 md:w-5 md:h-5" />
                 </div>
                 <h1 className="text-sm md:text-xl font-black text-white uppercase tracking-wider truncate">{isEditMode ? 'Edit Strategy' : 'Forge Assessment'}</h1>
              </div>
           </div>
           <button 
              onClick={handleSave}
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 md:px-8 py-2 md:py-3 rounded-lg md:rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs shadow-2xl transition-all flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50"
           >
              {isLoading ? <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : <Save className="w-3 h-3 md:w-4 md:h-4" />}
              <span className="hidden sm:inline">{isEditMode ? 'Update' : 'Deploy'}</span>
           </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-20 relative z-10">
         <div className="space-y-8">
            <div className="glass-panel p-6 md:p-10 rounded-[1.5rem] md:rounded-[2rem] border-white/10 shadow-3xl space-y-6 md:space-y-8 bg-slate-900/40">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                  <div className="md:col-span-2 space-y-3 md:space-y-4">
                     <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-indigo-400 px-1">Objective Title</label>
                     <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="ENTER ASSESSMENT NAME..."
                        className="w-full bg-slate-800/50 border border-white/5 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-bold text-sm md:text-base"
                     />
                  </div>
                  <div className="space-y-3 md:space-y-4">
                     <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-indigo-400 px-1 flex items-center gap-2"><Clock className="w-3 h-3" /> Duration (Min)</label>
                     <input 
                        type="number" 
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                        placeholder="MINUTES"
                        className="w-full bg-slate-800/50 border border-white/5 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-bold text-sm md:text-base"
                     />
                  </div>
               </div>
               <div className="space-y-3 md:space-y-4">
                  <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-indigo-400 px-1">Briefing Memorandum</label>
                  <textarea 
                     value={description}
                     onChange={(e) => setDescription(e.target.value)}
                     placeholder="DESCRIBE THE OBJECTIVE OF THIS ASSESSMENT..."
                     rows="3"
                     className="w-full bg-slate-800/50 border border-white/5 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium text-sm md:text-base resize-none"
                  />
               </div>
            </div>

            <div className="space-y-8">
               <div className="flex items-center justify-between px-2">
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Questions Sequence</h2>
                  <button onClick={handleAddQuestion} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-400/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                     <Plus className="w-4 h-4" /> Add Question
                  </button>
               </div>

                {questions.map((q, qIdx) => (
                   <div key={qIdx} className="glass-panel p-6 md:p-8 rounded-[2rem] border-white/5 shadow-2xl space-y-6 relative group bg-slate-900/30 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <button onClick={() => handleRemoveQuestion(qIdx)} className="absolute top-4 md:top-6 right-4 md:right-6 p-2 rounded-xl bg-rose-500/10 text-rose-500 md:opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white">
                         <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="space-y-3 md:space-y-4">
                         <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 md:gap-3">
                            <span className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-[9px] md:text-[10px]">{qIdx + 1}</span>
                            Question Statement
                         </label>
                         <input 
                            type="text" 
                            value={q.questionText}
                            onChange={(e) => handleQuestionChange(qIdx, e.target.value)}
                            placeholder="WHAT IS THE CORE INQUIRY?"
                            className="w-full bg-transparent border-b border-white/10 px-1 py-2 md:py-3 text-base md:text-lg font-bold text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500 transition-all"
                         />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 pt-2 md:pt-4">
                         {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className={`relative flex items-center p-3 md:p-4 rounded-xl md:rounded-2xl border transition-all ${q.correctOptionIndex === oIdx ? 'bg-indigo-600/10 border-indigo-500/50 shadow-inner' : 'bg-slate-800/30 border-white/5 hover:border-white/10'}`}>
                               <button 
                                  onClick={() => handleCorrectOptionChange(qIdx, oIdx)}
                                  className={`w-4 h-4 md:w-5 md:h-5 rounded-md md:rounded-lg flex items-center justify-center transition-all ${q.correctOptionIndex === oIdx ? 'bg-indigo-50 text-indigo-600 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-slate-700 text-transparent hover:bg-slate-600'}`}
                               >
                                  <CheckCircle2 className="w-3 h-3" />
                               </button>
                               <input 
                                  type="text" 
                                  value={opt}
                                  onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                                  placeholder={`OPTION ${oIdx + 1}`}
                                  className="flex-1 bg-transparent border-none px-3 md:px-4 text-xs md:text-sm font-bold text-slate-300 placeholder:text-slate-600 focus:outline-none"
                               />
                               {q.options.length > 2 && (
                                  <button onClick={() => handleRemoveOption(qIdx, oIdx)} className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-500/50 hover:text-rose-500 transition-all">
                                     <X className="w-3 h-3" />
                                  </button>
                               )}
                            </div>
                         ))}
                         <button onClick={() => handleAddOption(qIdx)} className="flex items-center justify-center gap-2 p-3 md:p-4 rounded-xl md:rounded-2xl border border-dashed border-white/10 text-slate-500 hover:text-indigo-400 hover:border-indigo-500/30 transition-all bg-white/2">
                            <Plus className="w-4 h-4" />
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-center">Append Option</span>
                         </button>
                      </div>
                   </div>
                ))}
            </div>
         </div>
      </main>
    </div>
  );
};

export default QuizBuilder;
