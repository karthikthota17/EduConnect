import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Video, BookOpen, ClipboardList, Shield, QrCode, MessageSquare, 
  ListChecks, Users, BarChart3, Calendar, Bell, Star, 
  ArrowRight, CheckCircle, Smartphone, Globe, Lock, Cpu
} from 'lucide-react';
import Background3D from '../components/Background3D';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    { icon: <Video className="w-6 h-6"/>, title: "Live Classes", desc: "Native WebRTC video mesh with screen sharing and low-latency P2P mesh." },
    { icon: <ListChecks className="w-6 h-6"/>, title: "Auto-Grading", desc: "MCQ Quizzes with instant results and automated student performance metrics." },
    { icon: <QrCode className="w-6 h-6"/>, title: "QR Attendance", desc: "Secure, single-use QR tokens for fast classroom check-ins." },
    { icon: <Shield className="w-6 h-6"/>, title: "Private Access", desc: "Join via unique class codes or invite-only QR landing pages." },
    { icon: <BarChart3 className="w-6 h-6"/>, title: "Analytics", desc: "Visual dashboards for teachers to track engagement and completion." },
    { icon: <Calendar className="w-6 h-6"/>, title: "Smart Scheduling", desc: "Unified calendar view for all assignments and upcoming live sessions." }
  ];

  const allModules = [
    "JWT Authentication", "Role-Based Access", "Classroom Management", "QR Join Support", 
    "Live Video Mesh", "Screen Sharing", "Real-time Chat", "Material Storage",
    "Assignment Workflow", "Submission Tracking", "Grading System", "Feedback Loop", 
    "MCQ Quiz Engine", "QR Attendance", "Announcements", "Notification Center",
    "Calendar Schedule", "Student Analytics", "Admin Dashboard"
  ];

  return (
    <div className="min-h-screen text-white overflow-x-hidden">
      <Background3D />
      
      {/* Navigation */}
       <nav className="fixed top-0 left-0 w-full z-50 bg-slate-950/20 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                 <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-white"/>
              </div>
              <span className="text-lg md:text-xl font-bold tracking-tighter uppercase">Edu<span className="text-indigo-400">Connect</span></span>
           </div>
           
           <div className="flex items-center gap-2 md:gap-10">
              <div className="hidden md:flex items-center gap-10 mr-10">
                 <a href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition">Features</a>
                 <a href="#tech" className="text-sm font-medium text-slate-300 hover:text-white transition">Modules</a>
              </div>
              <button 
                onClick={() => navigate('/login')}
                className="bg-white/10 hover:bg-white/20 px-4 md:px-6 py-2 rounded-full text-[10px] md:text-sm font-semibold transition border border-white/10"
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate('/register')}
                className="bg-indigo-600 hover:bg-indigo-700 px-4 md:px-6 py-2 rounded-full text-[10px] md:text-sm font-semibold transition shadow-lg shadow-indigo-600/20 hidden sm:block"
              >
                Get Started
              </button>
           </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-48 pb-24 px-6">
         <div className="max-w-7xl mx-auto relative">
            <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
               <h1 className="text-3xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-[0.95] text-white">
                 BEYOND THE <br />
                 <span className="text-indigo-500 uppercase">CLASSROOM.</span>
               </h1>
               <p className="text-sm md:text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed px-4">
                  A high-performance EduConnect environment built with the MERN stack. Live video, secure assessments, and real-time analytics in one private workspace.
               </p>
               
               <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-8 px-6">
                   <button 
                     onClick={() => navigate('/register')}
                     className="w-full sm:w-auto bg-white text-slate-950 px-6 md:px-10 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black text-sm md:text-lg transition hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group"
                   >
                     Set Up Class <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition"/>
                   </button>
                   <button 
                     onClick={() => navigate('/login')}
                     className="w-full sm:w-auto bg-slate-900/50 backdrop-blur-xl border border-white/10 px-6 md:px-10 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black text-sm md:text-lg transition hover:bg-white/10"
                   >
                     Join Session
                   </button>
                </div>
               
               <div className="pt-20 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60 grayscale hover:grayscale-0 transition duration-500">
                  <div className="flex items-center gap-3 justify-center"><Cpu className="w-5 h-5"/> REACT 19</div>
                  <div className="flex items-center gap-3 justify-center"><Lock className="w-5 h-5"/> JWT SECURE</div>
                  <div className="flex items-center gap-3 justify-center"><Globe className="w-5 h-5"/> SOCKET.IO</div>
                  <div className="flex items-center gap-3 justify-center"><Smartphone className="w-5 h-5"/> CROSS-PLATFORM</div>
               </div>
            </div>
         </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 py-32 px-6 bg-slate-950/20 backdrop-blur-3xl border-t border-white/5">
         <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {features.map((f, i) => (
                 <div 
                   key={i}
                   className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-default group animate-in fade-in slide-in-from-bottom-4 duration-700"
                   style={{ animationDelay: `${i * 100}ms` }}
                 >
                    <div className="w-14 h-14 bg-indigo-600/20 rounded-2xl flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition duration-500">
                       {f.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{f.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* All Modules List */}
      <section id="tech" className="relative z-10 pb-32 px-6">
         <div className="max-w-7xl mx-auto">
            <div className="bg-indigo-600 rounded-[4rem] p-12 md:p-24 shadow-2xl shadow-indigo-600/30 overflow-hidden relative">
               <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
               
               <h2 className="text-2xl md:text-6xl font-black text-white mb-12 relative z-10 uppercase tracking-tighter">Everything <br /> In One Place.</h2>
               
               <div className="flex flex-wrap gap-2 md:gap-3 relative z-10">
                  {allModules.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 bg-indigo-700/50 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-white/90">
                       <CheckCircle className="w-3 h-3 text-white"/> {m}
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-12 px-6">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <span className="text-slate-400 text-sm font-medium">© 2026 EduConnect Platform. Built with MERN Stack.</span>
            <div className="flex gap-8">
               <a href="#" className="text-slate-400 hover:text-white transition text-sm font-bold uppercase tracking-widest">Twitter</a>
               <a href="#" className="text-slate-400 hover:text-white transition text-sm font-bold uppercase tracking-widest">Github</a>
               <a href="#" className="text-slate-400 hover:text-white transition text-sm font-bold uppercase tracking-widest">Dribbble</a>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default Home;
