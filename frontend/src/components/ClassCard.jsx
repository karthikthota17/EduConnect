import React from 'react';
import { Users, Trash2, ArrowRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { deleteClass } from '../store/classSlice';

const ClassCard = ({ classData, role }) => {
  const dispatch = useDispatch();

  const handleDelete = (e) => {
    e.preventDefault();
    if (window.confirm('Terminate this classroom protocol? All associated data packets will be purged.')) {
      dispatch(deleteClass(classData._id));
    }
  };

  return (
    <div className="glass-panel rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 relative group hover:-translate-y-1">
      {/* Banner Section */}
      <div className="h-28 bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 p-5 relative overflow-hidden">
        {/* Animated Accent */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
        
        {(role === 'teacher' || role === 'admin') && (
          <button 
            onClick={handleDelete}
            className="absolute top-5 right-5 p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition-all z-20 border border-rose-500/20"
            title="Delete Classroom"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}

        <Link to={`/class/${classData._id}`} className="relative z-10 block h-full flex flex-col justify-end">
          <h3 className="text-xl font-black text-white truncate drop-shadow-sm">
            {classData.name}
          </h3>
          <p className="text-indigo-100/80 text-[10px] font-bold uppercase tracking-widest truncate mt-1">
            {classData.description}
          </p>
        </Link>
      </div>

      {/* Content Section */}
      <div className="p-6 pt-10 relative flex flex-col justify-between h-[130px] bg-white/5">
        {/* Absolute position Teacher Avatar */}
        <div className="absolute -top-10 right-8">
          <div className="h-16 w-16 bg-[#0f172a] rounded-2xl p-1 shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500 border border-white/10">
            <div className="h-full w-full bg-indigo-600/20 rounded-xl flex items-center justify-center overflow-hidden">
               {classData.teacher?.avatar && classData.teacher.avatar !== 'default-avatar.png' ? (
                  <img src={classData.teacher.avatar} alt="Teacher" className="object-cover h-full w-full" />
                ) : (
                  <BookOpen className="h-6 w-6 text-indigo-400" />
                )}
            </div>
          </div>
        </div>

         <div>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
               <Users className="w-3 h-3" /> Instructional Lead
            </p>
            <p className="text-sm font-black text-white">
               {classData.teacher?.name ? classData.teacher.name : 'Unknown Instructor'}
            </p>
         </div>

        <div className="flex items-center justify-between pt-4 mt-auto border-t border-white/5">
            {role === 'teacher' && classData.code ? (
              <div className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg font-mono text-[10px] font-bold text-indigo-400 bg-indigo-400/10 border border-indigo-400/20">
                {classData.code}
              </div>
            ) : <div />}

            <Link 
              to={`/class/${classData._id}`} 
              className="flex items-center gap-1.5 text-indigo-400 text-xs font-black uppercase tracking-widest hover:text-indigo-300 transition-colors group/btn"
            >
               Enter <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
        </div>
      </div>
    </div>
  );
};

export default ClassCard;
