import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Loader2, Zap } from 'lucide-react';

const SmartScanner = ({ isOpen, onClose, mode = 'attendance', classId = null }) => {
   const navigate = useNavigate();
   const scannerRef = useRef(null);
   const qrCodeId = "qr-reader";
   const html5QrCode = useRef(null);
   const isProcessing = useRef(false);

   useEffect(() => {
      const toggleScanner = async () => {
         if (isOpen) {
            await startScanner();
         } else {
            await stopScanner();
         }
      };
      toggleScanner();
      return () => {
         if (html5QrCode.current && html5QrCode.current.isScanning) {
            stopScanner();
         }
      };
   }, [isOpen]);

   const startScanner = async () => {
      if (isProcessing.current) return;
      isProcessing.current = true;
      try {
         if (!html5QrCode.current) {
            html5QrCode.current = new Html5Qrcode(qrCodeId);
         }
         
         const config = { fps: 10, qrbox: { width: 250, height: 250 } };
         await html5QrCode.current.start(
            { facingMode: "environment" }, 
            config, 
            (decodedText) => {
               handleDecoded(decodedText);
            }
         );
      } catch (err) {
         console.warn("Camera node start conflict:", err);
      } finally {
         isProcessing.current = false;
      }
   };

   const stopScanner = async () => {
      if (isProcessing.current || !html5QrCode.current || !html5QrCode.current.isScanning) return;
      isProcessing.current = true;
      try {
         await html5QrCode.current.stop();
         if (document.getElementById(qrCodeId)) {
            html5QrCode.current.clear();
         }
      } catch (err) {
         console.warn("Scanner state transition lock handled silently.");
      } finally {
         isProcessing.current = false;
      }
   };

   const handleDecoded = (text) => {
      // Find relative path for join or attendance
      const joinMatch = text.match(/\/join\/([^\s/]+)/);
      const attendanceMatch = text.match(/\/class\/([^\s/]+)\/attendance\/([^\s/]+)/);

      if (joinMatch) {
         navigate(`/join/${joinMatch[1]}`);
      } else if (attendanceMatch) {
         navigate(`/class/${attendanceMatch[1]}/attendance/${attendanceMatch[2]}`);
      } else if (mode === 'join' && text.length >= 6 && text.length <= 15) {
         // Manual class code
         navigate(`/join/${text}`);
      } else if (mode === 'attendance' && text.length > 20) {
         // Likely an attendance token, but we need classId
         if (classId) {
            navigate(`/class/${classId}/attendance/${text}`);
         } else {
            alert("To mark attendance manually, please enter the code from within the class portal.");
         }
      } else {
         alert("Unrecognized signature node. Please ensure you are scanning a valid classroom QR.");
      }
      stopScanner();
      onClose();
   };

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#020617]/95 backdrop-blur-3xl animate-in fade-in duration-500">
         <div className="max-w-md w-full bg-slate-900 border border-white/5 rounded-[3rem] p-8 shadow-3xl relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-1.5 ${mode === 'join' ? 'bg-indigo-600' : 'bg-emerald-600'} animate-pulse`}></div>
            
            <button onClick={onClose} className="absolute top-6 right-6 p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all z-50">
               <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-10 pt-4">
               <h3 className="text-2xl font-black text-white tracking-widest uppercase mb-2">
                  {mode === 'join' ? 'Cluster Alignment' : 'Temporal Verification'}
               </h3>
               <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${mode === 'join' ? 'text-indigo-400' : 'text-emerald-400'}`}>
                  {mode === 'join' ? 'Align camera with classroom join node' : 'Finalize presence mark with terminal QR'}
               </p>
            </div>

            <div className="relative aspect-square rounded-[2.5rem] overflow-hidden bg-black border-4 border-white/5 shadow-2xl indigo-glow">
               <div id={qrCodeId} className="w-full h-full object-cover"></div>
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-10">
                  <Camera className="w-16 h-16 text-slate-800" />
               </div>
               {/* Scanning Laser Line */}
               <div className={`absolute top-1/2 left-0 w-full h-1 ${mode === 'join' ? 'bg-indigo-500/30' : 'bg-emerald-500/30'} -translate-y-1/2 animate-[scan_2s_ease-in-out_infinite] z-20 shadow-[0_0_15px_rgba(79,150,229,0.4)]`}></div>
            </div>

            <div className="mt-10 flex flex-col items-center gap-6">
               <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-white/5 border border-white/5">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Deciphering Optical Data...</span>
               </div>
               
               <div className="w-full space-y-4">
                  <div className="relative">
                     <input 
                        type="text" 
                        onKeyDown={(e) => e.key === 'Enter' && handleDecoded(e.target.value)}
                        placeholder={mode === 'join' ? "Enter Class Code" : "Enter Attendance Token"}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-center font-black tracking-widest text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all uppercase placeholder:text-slate-700 text-xs"
                     />
                  </div>
                  <p className="text-[9px] text-slate-600 font-bold italic tracking-wider text-center px-4">
                     {mode === 'join' 
                        ? "Manually inject the classroom identifier if the optical link is unstable." 
                        : "Authorize your presence manually using the instructor's validation key."}
                  </p>
               </div>

               {mode === 'attendance' && (
                  <div className="flex items-center gap-2 text-emerald-400/50">
                     <Zap className="w-3 h-3" />
                     <span className="text-[9px] font-black uppercase tracking-widest">Temporal Node Hub Active</span>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default SmartScanner;
