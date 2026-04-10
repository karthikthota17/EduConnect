import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createMaterial, createAssignment, createQuiz } from '../store/classworkSlice';
import Modal from './Modal';
import { FileText, ClipboardList, Loader2, Link as LinkIcon, FilePlus, ListChecks } from 'lucide-react';

const CreateClassworkModals = ({ classId, socket }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading } = useSelector(state => state.classwork);

  const [openModalType, setOpenModalType] = useState(null); // 'material', 'assignment', 'quiz'
  
  // States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [points, setPoints] = useState(100);
  const [dueDate, setDueDate] = useState('');

  const closeModals = () => {
    setOpenModalType(null);
    setTitle('');
    setDescription('');
    setFile(null);
    setPoints(100);
    setDueDate('');
  };

  const handleMaterialSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('type', 'document');
    if (file) formData.append('file', file);
    
    dispatch(createMaterial({ classId, formData })).then((res) => {
      if (!res.error && socket) {
         socket.emit('emit-classwork-update', classId);
      }
      closeModals();
    });
  };

  const handleAssignmentSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('points', points);
    if (dueDate) formData.append('dueDate', dueDate);
    if (file) formData.append('file', file);
    
    dispatch(createAssignment({ classId, formData })).then((res) => {
      if (!res.error && socket) {
         socket.emit('emit-classwork-update', classId);
      }
      closeModals();
    });
  };

  return (
    <>
      <div className="flex gap-4 mb-10">
         <button 
           onClick={() => setOpenModalType('material')} 
           className="flex-1 flex flex-col items-center gap-3 p-6 rounded-[2rem] bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all group shadow-xl hover:shadow-indigo-600/20"
         >
           <div className="p-3 rounded-2xl bg-indigo-500/10 group-hover:bg-white/10 transition-colors">
              <FilePlus className="w-8 h-8" />
           </div>
           <span className="text-[10px] font-black uppercase tracking-widest">Post Material</span>
         </button>
         
         <button 
           onClick={() => setOpenModalType('assignment')} 
           className="flex-1 flex flex-col items-center gap-3 p-6 rounded-[2rem] bg-rose-600/10 border border-rose-500/20 text-rose-400 hover:bg-rose-600 hover:text-white transition-all group shadow-xl hover:shadow-rose-600/20"
         >
           <div className="p-3 rounded-2xl bg-rose-500/10 group-hover:bg-white/10 transition-colors">
              <ClipboardList className="w-8 h-8" />
           </div>
           <span className="text-[10px] font-black uppercase tracking-widest">Assign Task</span>
         </button>
         
         <button 
           onClick={() => navigate(`/class/${classId}/quiz/new`)} 
           className="flex-1 flex flex-col items-center gap-3 p-6 rounded-[2rem] bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all group shadow-xl hover:shadow-emerald-600/20"
         >
           <div className="p-3 rounded-2xl bg-emerald-500/10 group-hover:bg-white/10 transition-colors">
              <ListChecks className="w-8 h-8" />
           </div>
           <span className="text-[10px] font-black uppercase tracking-widest">Build Quiz</span>
         </button>
      </div>

      <Modal isOpen={openModalType === 'material'} onClose={closeModals} title="New Material Expansion">
        <form onSubmit={handleMaterialSubmit} className="space-y-6">
           <div className="space-y-2">
             <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Transmission Title</label>
             <input 
               required 
               value={title} 
               onChange={(e) => setTitle(e.target.value)} 
               placeholder="Knowledge segment title..."
               className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all" 
             />
           </div>
           <div className="space-y-2">
             <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Contextual Description</label>
             <textarea 
               rows={4} 
               value={description} 
               onChange={(e) => setDescription(e.target.value)} 
               placeholder="Instructions or context for students..."
               className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium transition-all" 
             />
           </div>
           <div className="space-y-2">
             <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Support Assets</label>
             <div className="relative group">
                <input 
                  type="file" 
                  onChange={(e) => setFile(e.target.files[0])} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                />
                <div className="w-full px-6 py-4 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-3 text-slate-400 group-hover:border-indigo-500 group-hover:text-white transition-all">
                   <LinkIcon className="w-4 h-4" />
                   <span className="text-sm font-bold truncate max-w-[200px]">{file ? file.name : 'Drop Asset or Click to Link'}</span>
                </div>
             </div>
           </div>
           <div className="pt-4">
             <button 
               type="submit" 
               disabled={isLoading} 
               className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-3xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-3 active:scale-95"
             > 
               {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <FilePlus className="w-4 h-4" />} 
               Publish To Stream 
             </button>
           </div>
        </form>
      </Modal>

      <Modal isOpen={openModalType === 'assignment'} onClose={closeModals} title="New Tactical Assignment">
        <form onSubmit={handleAssignmentSubmit} className="space-y-6">
           <div className="space-y-2">
             <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Operation Objective</label>
             <input 
               required 
               value={title} 
               onChange={(e) => setTitle(e.target.value)} 
               placeholder="Assignment goal..."
               className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-rose-500 font-medium transition-all" 
             />
           </div>
           <div className="space-y-2">
             <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Mission Briefing</label>
             <textarea 
               rows={3} 
               value={description} 
               onChange={(e) => setDescription(e.target.value)} 
               placeholder="Detailed instructions..."
               className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-rose-500 resize-none font-medium transition-all" 
             />
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Point Value</label>
                 <input 
                   type="number" 
                   min="0" 
                   value={points} 
                   onChange={(e) => setPoints(e.target.value)} 
                   className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-rose-500 font-medium transition-all" 
                 />
              </div>
              <div className="space-y-2">
                 <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Deadline</label>
                 <input 
                   type="date" 
                   value={dueDate} 
                   onChange={(e) => setDueDate(e.target.value)} 
                   className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-rose-500 font-black uppercase tracking-widest text-[10px] transition-all" 
                 />
              </div>
           </div>
           <div className="space-y-2">
             <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Tactical Assets</label>
             <div className="relative group">
                <input 
                  type="file" 
                  onChange={(e) => setFile(e.target.files[0])} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                />
                <div className="w-full px-6 py-4 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-3 text-slate-400 group-hover:border-rose-500 group-hover:text-white transition-all">
                   <LinkIcon className="w-4 h-4" />
                   <span className="text-sm font-bold truncate max-w-[200px]">{file ? file.name : 'Link Support File'}</span>
                </div>
             </div>
           </div>
           <div className="pt-4">
             <button 
               type="submit" 
               disabled={isLoading} 
               className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-3xl shadow-rose-600/30 transition-all flex items-center justify-center gap-3 active:scale-95"
             > 
               {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <ClipboardList className="w-4 h-4" />} 
               Initiate Assignment 
             </button>
           </div>
        </form>
      </Modal>
    </>
  );
};

export default CreateClassworkModals;
