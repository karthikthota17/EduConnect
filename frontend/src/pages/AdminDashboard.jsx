import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { Users, BookOpen, Trash2, Shield, Loader2, Search, ArrowLeft, Zap, ExternalLink } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import Background3D from '../components/Background3D';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, classesRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/classes')
      ]);
      setUsers(usersRes.data.data);
      setClasses(classesRes.data.data);
    } catch (err) {
      addToast("Failed to fetch administrative intel", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Authorize permanent deletion of this subject?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
      addToast("Subject eliminated successfully.");
    } catch (err) {
      addToast("Failed to delete user", "error");
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen relative bg-[#020617] text-white selection:bg-indigo-500/30 overflow-x-hidden">
      <Background3D />
      
      <header className="fixed top-0 left-0 w-full z-[50] glass-panel border-b border-white/5 h-16 md:h-20 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4 truncate">
            <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all group">
               <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="flex items-center gap-2 md:gap-3">
              <Shield className="h-5 w-5 md:h-6 md:w-6 text-indigo-400" />
              <h1 className="text-sm md:text-xl font-black text-white tracking-widest uppercase truncate">Central Hub</h1>
            </div>
          </div>
          <div className="relative w-40 md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
             <input 
               type="text"
               placeholder="Search intel..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 outline-none transition-all text-white placeholder:text-slate-700"
             />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-24 md:pt-32 pb-20 relative z-10 w-full">
        <div className="flex items-center gap-2 md:gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
           <button 
             onClick={() => setActiveTab('users')}
             className={`px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] transition-all flex items-center gap-2 shrink-0 ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'}`}
           >
             <Users className="h-3.5 w-3.5" /> Subjects ({users.length})
           </button>
           <button 
             onClick={() => setActiveTab('classes')}
             className={`px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] transition-all flex items-center gap-2 shrink-0 ${activeTab === 'classes' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'}`}
           >
             <BookOpen className="h-3.5 w-3.5" /> Terminals ({classes.length})
           </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
             <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 animate-pulse">Syncing Administrative Packets...</p>
          </div>
        ) : activeTab === 'users' ? (
          <div className="glass-panel rounded-[2rem] md:rounded-[3rem] border-white/5 bg-white/2 overflow-hidden shadow-3xl">
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead className="bg-white/5">
                     <tr>
                        <th className="px-6 md:px-8 py-5 md:py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Subject</th>
                        <th className="px-6 md:px-8 py-5 md:py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hidden sm:table-cell">Authorization</th>
                        <th className="px-6 md:px-8 py-5 md:py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hidden lg:table-cell">Deployment</th>
                        <th className="px-6 md:px-8 py-5 md:py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Operations</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {filteredUsers.map(u => (
                        <tr key={u._id} className="hover:bg-white/[0.03] transition-colors group">
                           <td className="px-6 md:px-8 py-4 md:py-6">
                              <div className="flex items-center gap-3 md:gap-4">
                                 <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center text-xs font-black text-indigo-400">
                                    {u.name.charAt(0).toUpperCase()}
                                 </div>
                                 <div className="truncate max-w-[120px] md:max-w-none">
                                    <p className="text-sm md:text-base font-black text-white tracking-tight">{u.name}</p>
                                    <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase truncate">{u.email}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 md:px-8 py-4 md:py-6 hidden sm:table-cell">
                              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${u.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : u.role === 'teacher' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-white/5 text-slate-400 border-white/10'}`}>
                                 {u.role}
                              </span>
                           </td>
                           <td className="px-6 md:px-8 py-4 md:py-6 text-xs text-slate-500 hidden lg:table-cell font-mono">
                              {new Date(u.createdAt).toLocaleDateString()}
                           </td>
                           <td className="px-6 md:px-8 py-4 md:py-6 text-right">
                              <button 
                                onClick={() => handleDeleteUser(u._id)}
                                disabled={u.role === 'admin'}
                                className="p-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white disabled:opacity-5 transition-all active:scale-90"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>
        ) : (
          <div className="glass-panel rounded-[2rem] md:rounded-[3rem] border-white/5 bg-white/2 overflow-hidden shadow-3xl">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white/5">
                     <tr>
                        <th className="px-6 md:px-8 py-5 md:py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Terminal</th>
                        <th className="px-6 md:px-8 py-5 md:py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hidden sm:table-cell">Instructor</th>
                        <th className="px-6 md:px-8 py-5 md:py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Access Token</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {filteredClasses.map(c => (
                        <tr key={c._id} className="hover:bg-white/[0.03] transition-colors group">
                           <td className="px-6 md:px-8 py-4 md:py-6">
                              <div className="flex flex-col truncate">
                                 <p className="text-sm md:text-base font-black text-white tracking-tight flex items-center gap-2">
                                    {c.name}
                                 </p>
                                 <p className="text-[10px] text-slate-500 truncate max-w-xs uppercase font-bold tracking-widest">{c.description}</p>
                              </div>
                           </td>
                           <td className="px-6 md:px-8 py-4 md:py-6 hidden sm:table-cell">
                              <div className="flex items-center gap-3">
                                 <div className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                                    {c.teacher?.name}
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 md:px-8 py-4 md:py-6 text-right">
                              <code className="bg-indigo-600/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl text-indigo-400 font-mono font-black tracking-widest text-xs md:text-sm">
                                 {c.code}
                              </code>
                           </td>
                        </tr>
                     ))}
                  </tbody>
                </table>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
