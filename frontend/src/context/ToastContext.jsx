import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
         {toasts.map(toast => (
            <div key={toast.id} className={`flex items-center justify-between gap-3 min-w-[300px] p-4 rounded-xl shadow-lg border animate-in slide-in-from-right duration-300 ${toast.type === 'success' ? 'bg-white border-green-200 text-slate-800' : 'bg-red-50 border-red-200 text-red-900'}`}>
               <div className="flex items-center gap-3">
                  {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                  <span className="font-medium text-sm">{toast.message}</span>
               </div>
               <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="text-slate-400 hover:text-slate-600">
                 <X className="w-4 h-4"/>
               </button>
            </div>
         ))}
      </div>
    </ToastContext.Provider>
  );
};
