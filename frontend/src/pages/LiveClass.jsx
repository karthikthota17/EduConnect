import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Users, Loader2, MessageSquare, Send, X, Monitor, MonitorOff, Zap, ShieldCheck, ChevronRight } from 'lucide-react';
import Background3D from '../components/Background3D';
import { useSocket } from '../context/SocketContext';
import { fetchClassDetails } from '../store/classSlice';
import api from '../api/axiosConfig';
import { QRCodeSVG } from 'qrcode.react';

// Free google stun servers
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.services.mozilla.com' }
  ],
  bundlePolicy: 'max-bundle',
  iceCandidatePoolSize: 10
};

const LiveClass = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector(state => state.auth);
  const { activeClass } = useSelector(state => state.classes);

  const [localStream, setLocalStream] = useState(null);
  const localStreamRef = useRef(null);
  const [peers, setPeers] = useState([]); // List of { socketId, stream, userName }
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  
  // Teacher & Status synchronization
  const [isTeacherOnline, setIsTeacherOnline] = useState(false);
  const [sharingSocketId, setSharingSocketId] = useState(null);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isShowingEndModal, setIsShowingEndModal] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceToken, setAttendanceToken] = useState(null);
  const scrollRef = useRef();

  const socket = useSocket();
  const localVideoRef = useRef();
  const screenStreamRef = useRef(null);
  const peersRef = useRef({}); // maps socketId to { peerConnection, userName, candidateQueue }

  const isTeacher = user?.role?.toLowerCase() === 'teacher' || user?.role?.toLowerCase() === 'admin';

  useEffect(() => {
    if (!activeClass) dispatch(fetchClassDetails(classId));
  }, [dispatch, classId, activeClass]);

  const isJoinedRef = useRef(false);
  const isScreenSharingRef = useRef(false);

  useEffect(() => {
    isJoinedRef.current = isJoined;
  }, [isJoined]);

  useEffect(() => {
    isScreenSharingRef.current = isScreenSharing;
  }, [isScreenSharing]);

  // Unified Socket Signal Registry
  useEffect(() => {
    if (socket && classId && user) {
       // 1. Join room once per session/classId change, specifying LIVE context
       socket.emit('join-room', classId, user._id, user.name, user.role, { isLive: true });

       // 2. Register global signal listeners
       socket.on('room-status', ({ isTeacherOnline, sharingSocketId }) => {
          setIsTeacherOnline(isTeacherOnline);
          setSharingSocketId(sharingSocketId);
       });

       socket.on('teacher-status', ({ online }) => {
          setIsTeacherOnline(online);
       });

       socket.on('sharing-status', ({ sharingSocketId: remoteSharingId }) => {
          setSharingSocketId(remoteSharingId);
       });

        socket.on('user-joined', async (newSocketId, userId, userName) => {
           // Only initiate signaling if WE have already officially joined the call
           if (isJoinedRef.current) {
              console.log(`[P2P] Initiating connection handshake with ${userName} (${newSocketId})`);
              // We are the initiator for people who join after us
              createPeerConnection(newSocketId, userName, true);
           }
        });

       socket.on('offer', async (payload) => {
          if (isJoinedRef.current) {
             console.log(`[P2P] Received offer from ${payload.callerName} (${payload.callerSocketId})`);
             let pcObj = peersRef.current[payload.callerSocketId];
             if (!pcObj) {
                // We are NOT the initiator for incoming offers
                createPeerConnection(payload.callerSocketId, payload.callerName, false);
                pcObj = peersRef.current[payload.callerSocketId];
             }
             
             const pc = pcObj.peerConnection;
             try {
                await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                const answer = await pc.createAnswer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
                await pc.setLocalDescription(answer);
                
                socket.emit('answer', {
                   targetSocketId: payload.callerSocketId,
                   callerSocketId: socket.id,
                   sdp: pc.localDescription
                });

                // Flush queued candidates
                if (pcObj.candidateQueue) {
                   while (pcObj.candidateQueue.length > 0) {
                      const candidate = pcObj.candidateQueue.shift();
                      await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error("[P2P] Failed to add queued candidate", e));
                   }
                }
             } catch (err) {
                console.error("[P2P] Error handling offer:", err);
             }
          }
       });

        socket.on('answer', async (payload) => {
           const pcObj = peersRef.current[payload.callerSocketId];
           if (pcObj) {
              console.log(`[P2P] Received answer from ${payload.callerSocketId}`);
              try {
                 await pcObj.peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                 
                 if (pcObj.candidateQueue) {
                    while (pcObj.candidateQueue.length > 0) {
                       const candidate = pcObj.candidateQueue.shift();
                       await pcObj.peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error("[P2P] Failed to add queued candidate", e));
                    }
                 }
              } catch (err) {
                 console.error("[P2P] Error setting remote description from answer:", err);
              }
           }
        });

       socket.on('ice-candidate', async (payload) => {
          if (payload.candidate) {
             const pcObj = peersRef.current[payload.callerSocketId];
             if (pcObj) {
                const pc = pcObj.peerConnection;
                try {
                   if (pc.remoteDescription && pc.remoteDescription.type) {
                      await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
                   } else {
                      if (!pcObj.candidateQueue) pcObj.candidateQueue = [];
                      pcObj.candidateQueue.push(payload.candidate);
                   }
                } catch (e) {
                   console.error("[P2P] Error adding ice candidate:", e);
                }
             }
          }
       });

       socket.on('receive-chat', (payload) => {
          setMessages(prev => [...prev, payload]);
       });

         socket.on('end-call', () => {
            console.log("[SESSION] End call received");
            setMessages(prev => [...prev, { userName: 'SYSTEM', message: 'Session terminated by instructional lead.', timestamp: new Date().toISOString() }]);
            // Stop all local tracks immediately
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(t => t.stop());
            }
            if (screenStreamRef.current) {
               screenStreamRef.current.getTracks().forEach(t => t.stop());
            }
            setTimeout(() => navigate(`/class/${classId}`), 2500);
         });

       socket.on('user-disconnected', (socketId) => {
          if (peersRef.current[socketId]) {
             peersRef.current[socketId].peerConnection.close();
             delete peersRef.current[socketId];
             setPeers(prev => prev.filter(p => p.socketId !== socketId));
          }
       });

       return () => {
          socket.emit('leave-room', classId);
          socket.off('room-status');
          socket.off('teacher-status');
          socket.off('sharing-status');
          socket.off('user-joined');
          socket.off('offer');
          socket.off('answer');
          socket.off('ice-candidate');
          socket.off('receive-chat');
          socket.off('end-call');
          socket.off('user-disconnected');
       };
    }
  }, [socket, classId, user]);

  // Protective Redirect: Students can't stay if teacher isn't here
  useEffect(() => {
    if (isJoined && !isTeacher && !isTeacherOnline) {
       navigate(`/class/${classId}`);
    }
  }, [isJoined, isTeacher, isTeacherOnline, classId, navigate]);

  // Handle hardware termination separately
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
         localStreamRef.current.getTracks().forEach(t => t.stop());
         localStreamRef.current = null;
      }
      Object.keys(peersRef.current).forEach(id => {
         if (peersRef.current[id].peerConnection) {
            peersRef.current[id].peerConnection.close();
         }
      });
    };
  }, []);

  const initMedia = async () => {
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
       alert("Warning: Media protocols require a secure (HTTPS) environment. Operations may fail.");
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 }, 
          frameRate: { ideal: 24 },
          facingMode: "user"
        }, 
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsCamOn(true);
      setIsMicOn(true);
      console.log("[MEDIA] Media stream synchronized successfully.");
    } catch (err) {
      console.error('Failed to get media devices', err);
      alert("Media Access Denied: Ensure your camera/mic permissions are granted and you are on a secure connection (HTTPS/localhost).");
    }
  };

  useEffect(() => {
     if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
     }
  }, [localStream]);

  const joinCall = () => {
    if (!localStreamRef.current || !socket) return;
    setIsJoined(true);
    isJoinedRef.current = true;
    // Explicit signal that we are now officially part of the peer-to-peer session
    socket.emit('ready-to-call', { userId: user._id, userName: user.name });
  };

  const createPeerConnection = (targetSocketId, targetUserName, isInitiator) => {
     if (peersRef.current[targetSocketId]) {
        peersRef.current[targetSocketId].peerConnection.close();
     }

     const pc = new RTCPeerConnection(ICE_SERVERS);
     
     pc.onnegotiationneeded = async () => {
        if (!isInitiator) return;
        try {
           if (pc.signalingState !== 'stable') return;
           console.log(`[P2P] Creating offer for ${targetSocketId}`);
           const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
           await pc.setLocalDescription(offer);
           socket.emit('offer', {
              targetSocketId,
              callerSocketId: socket.id,
              sdp: pc.localDescription,
              callerName: user.name
           });
        } catch (e) {
           console.error("[P2P] Offer creation failed:", e);
        }
     };

     if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
           let trackToSend = track;
           if (isScreenSharingRef.current && track.kind === 'video' && screenStreamRef.current) {
              const screenTrack = screenStreamRef.current.getVideoTracks()[0];
              if (screenTrack) trackToSend = screenTrack;
           }
           console.log(`[P2P] Attaching ${trackToSend.kind} track to PC for ${targetUserName}`);
           pc.addTrack(trackToSend, localStreamRef.current);
        });
     }

     pc.onicecandidate = (event) => {
        if (event.candidate) {
           socket.emit('ice-candidate', {
              targetSocketId,
              callerSocketId: socket.id,
              candidate: event.candidate
           });
        }
     };

     pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        console.log(`[P2P] State with ${targetSocketId}: ${state}`);
        setPeers(prev => prev.map(p => p.socketId === targetSocketId ? { ...p, status: state } : p));
     };

     pc.ontrack = (event) => {
        console.log(`[P2P] Incoming ${event.track.kind} track from ${targetSocketId}`);
        const incomingStream = event.streams[0];
        
        setPeers(prev => {
           const existing = prev.find(p => p.socketId === targetSocketId);
           
           // We create a fresh MediaStream container every time a track arrives.
           // This forces React to see a 'prop change' in ParticipantTile -> VideoTile,
           // triggering the useEffect that sets srcObject.
           const streamToUse = incomingStream 
             ? new MediaStream(incomingStream.getTracks()) 
             : new MediaStream([event.track]);

           if (existing) {
              return prev.map(p => p.socketId === targetSocketId ? { ...p, stream: streamToUse } : p);
           }
           
           return [...prev, { 
              socketId: targetSocketId, 
              stream: streamToUse, 
              userName: targetUserName, 
              status: 'connecting' 
           }];
        });
     };

     peersRef.current[targetSocketId] = { peerConnection: pc, userName: targetUserName, candidateQueue: [] };
     return pc;
  };

  const toggleMic = () => {
    if (localStream) {
       const audioTrack = localStream.getAudioTracks()[0];
       if (audioTrack) {
          audioTrack.enabled = !isMicOn;
          setIsMicOn(!isMicOn);
       }
    }
  };

  const toggleCam = () => {
    if (localStream) {
       const videoTrack = localStream.getVideoTracks()[0];
       if (videoTrack) {
          videoTrack.enabled = !isCamOn;
          setIsCamOn(!isCamOn);
          // Broadcast status if needed, but for P2P, enabling/disabling track just works
       }
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        const videoTrack = stream.getVideoTracks()[0];
        
        Object.values(peersRef.current).forEach(({ peerConnection }) => {
          const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(videoTrack);
        });

        socket.emit('start-sharing');
        setSharingSocketId(socket.id);

        videoTrack.onended = () => stopScreenShare();
        setIsScreenSharing(true);
      } catch (err) {
        console.error("Error sharing screen:", err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    if (localStream) {
       const videoTrack = localStream.getVideoTracks()[0];
       Object.values(peersRef.current).forEach(({ peerConnection }) => {
         const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
         if (sender && videoTrack) sender.replaceTrack(videoTrack);
       });
    }
    socket.emit('stop-sharing');
    setSharingSocketId(null);
    setIsScreenSharing(false);
  };

   const terminateSession = () => {
     if (window.confirm("End the session for all participants? This will force-close the room.")) {
        socket.emit('end-session', classId);
        navigate(`/class/${classId}`);
     }
  };

  const handUp = () => {
    if (isTeacher) {
      terminateSession();
    } else {
      navigate(`/class/${classId}`);
    }
  };

  const handleSendMessage = (e) => {
     e.preventDefault();
     if (!chatInput.trim() || !socket) return;
     const payload = { roomId: classId, message: chatInput, userName: user.name, timestamp: new Date().toISOString() };
     socket.emit('send-chat', payload);
     setMessages(prev => [...prev, payload]);
     setChatInput('');
  };

  useEffect(() => {
     if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isChatOpen]);

  const spotlightUser = sharingSocketId === socket?.id 
    ? { stream: isScreenSharing ? screenStreamRef.current : localStream, userName: 'You (Sharing)' }
    : peers.find(p => p.socketId === sharingSocketId);

  return (
    <div className="min-h-screen relative bg-[#020617] text-white selection:bg-indigo-500/30 overflow-x-hidden">
      <Background3D />
      
      <header className="fixed top-0 left-0 w-full z-[50] glass-panel border-b border-white/5 h-16 md:h-20 px-4 md:px-6 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
           <div className="flex items-center gap-2 md:gap-4 truncate">
              <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                 <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                 </span>
                 <h1 className="text-sm md:text-lg font-black text-white tracking-tight uppercase tracking-widest truncate max-w-[120px] md:max-w-none">{activeClass?.name || 'Live Room'}</h1>
              </div>
              <div className="h-6 w-px bg-white/10 mx-1 md:mx-2"></div>
              <div className="flex items-center gap-2 md:gap-4 px-2 md:px-4 py-1 md:py-1.5 rounded-full bg-white/5 border border-white/5">
                 <Users className="w-3 h-3 md:w-3.5 md:h-3.5 text-indigo-400" />
                 <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-300">{peers.length + 1} SYNC</span>
              </div>
           </div>
           <button onClick={handUp} className="px-4 md:px-6 py-1.5 md:py-2 rounded-lg md:rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95">Exit</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-32 min-h-screen w-full relative z-10 flex flex-col">
          {!isJoined ? (
             <div className="flex-1 flex flex-col items-center justify-center space-y-6 md:y-10 animate-in fade-in zoom-in duration-1000 px-2 md:px-0">
                <div className="relative rounded-[2rem] md:rounded-[3rem] overflow-hidden glass-panel border-white/10 shadow-3xl w-full max-w-4xl aspect-video group bg-slate-900 flex items-center justify-center">
                   {!localStream ? (
                      <div className="flex flex-col items-center gap-4 md:gap-6 p-6 md:p-10 text-center">
                         <div className="w-12 h-12 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 mb-2 md:mb-4 animate-pulse">
                            <ShieldCheck className="w-6 h-6 md:w-10 md:h-10" />
                         </div>
                          <h2 className="text-xs md:text-xl font-black text-white uppercase tracking-[0.2em] leading-tight">Provisioning Required</h2>
                          <p className="text-slate-400 max-w-xs md:max-w-md text-[8px] md:text-xs font-medium leading-relaxed italic">Grant media access to initialize the secure broadcast layer.</p>
                         <button 
                           onClick={initMedia}
                           className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white px-6 md:px-10 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] shadow-2xl transition-all active:scale-95"
                         >
                            Initialize Media
                         </button>
                      </div>
                   ) : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
                        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror-x" />
                        <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3 md:gap-6 z-30">
                           <button onClick={toggleMic} className={`p-3.5 md:p-5 rounded-xl md:rounded-[1.5rem] ${isMicOn ? 'bg-white/10' : 'bg-rose-500'} text-white backdrop-blur-xl transition-all hover:scale-110 active:scale-90`} title={isMicOn ? "Mute Mic" : "Unmute Mic"}>{isMicOn ? <Mic className="w-5 h-5 md:w-6 md:h-6" /> : <MicOff className="w-5 h-5 md:w-6 md:h-6" />}</button>
                           <button onClick={toggleCam} className={`p-3.5 md:p-5 rounded-xl md:rounded-[1.5rem] ${isCamOn ? 'bg-white/10' : 'bg-rose-500'} text-white backdrop-blur-xl transition-all hover:scale-110 active:scale-90`} title={isCamOn ? "Stop Video" : "Start Video"}>{isCamOn ? <Video className="w-5 h-5 md:w-6 md:h-6" /> : <VideoOff className="w-5 h-5 md:w-6 md:h-6" />}</button>
                        </div>
                      </>
                   )}
                </div>
                <div className="text-center space-y-6 w-full max-w-xs mx-auto">
                   {(!isTeacher && !isTeacherOnline) ? (
                     <div className="glass-panel px-6 py-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-pulse font-black uppercase tracking-widest text-[8px] md:text-[10px] leading-tight">Waiting for Instructor...</div>
                   ) : (
                     <button 
                        onClick={joinCall} 
                        disabled={!localStream} 
                        className={`w-full bg-indigo-600 hover:bg-indigo-500 text-white px-10 md:px-16 py-4 md:py-5 rounded-2xl md:rounded-[2rem] font-black uppercase tracking-widest text-[10px] md:text-xs shadow-2xl transition-all flex items-center justify-center gap-3 md:gap-4 ${!localStream ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                     >
                        <Zap className="w-4 h-4" /> Enter Live Room
                        <ChevronRight className="w-4 h-4" />
                     </button>
                   )}
                </div>
             </div>
         ) : (
            <div className="w-full flex-1 flex flex-col gap-6 animate-in slide-in-from-bottom-8 duration-700">
               {sharingSocketId ? (
                 <div className="flex-1 flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                    <div className="flex-[3] relative rounded-[3rem] overflow-hidden glass-panel border-indigo-500/30 shadow-3xl bg-black/40">
                       <VideoTile stream={spotlightUser?.stream} />
                       <div className="absolute bottom-8 left-8 z-20 bg-indigo-600 px-6 py-3 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-3">
                          <Monitor className="w-4 h-4 text-white" />
                          <span className="text-white text-sm font-black uppercase tracking-widest">{spotlightUser?.userName}</span>
                       </div>
                    </div>
                    <div className="flex-1 flex flex-row lg:flex-col gap-4 overflow-x-auto lg:overflow-y-auto pr-2 pb-2 scrollbar-hide">
                       <ParticipantTile stream={localStream} name="You" isLocal />
                       {peers.filter(p => p.socketId !== sharingSocketId).map(peer => (
                          <ParticipantTile key={peer.socketId} stream={peer.stream} name={peer.userName} />
                       ))}
                    </div>
                 </div>
               ) : (
                 <div className={`flex-1 grid ${isChatOpen ? 'grid-cols-1 md:grid-cols-2 lg:mr-96' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'} gap-6 content-center auto-rows-fr`}>
                    <ParticipantTile stream={localStream} name={isTeacher ? "Session Coordinator (You)" : "You"} isLocal mirrored />
                    {peers.map(peer => (
                       <ParticipantTile 
                         key={peer.socketId} 
                         stream={peer.stream} 
                         name={peer.userName} 
                         status={peer.status}
                         onReconnect={() => createPeerConnection(peer.socketId, peer.userName, true)}
                       />
                    ))}
                    {peers.length === 0 && (
                       <div className="glass-panel rounded-[2.5rem] border-dashed border-2 flex flex-col items-center justify-center p-10 border-white/5">
                          <Users className="w-12 h-12 text-slate-800 mb-4" />
                          <h3 className="text-lg font-black text-slate-700 uppercase tracking-widest">Waiting for students...</h3>
                       </div>
                    )}
                 </div>
               )}
            </div>
         )}
         {isJoined && (
            <div className="fixed bottom-6 md:bottom-10 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-50 flex items-center justify-center md:justify-start gap-2 md:gap-4 glass-panel px-3 md:px-10 py-3 md:py-5 rounded-2xl md:rounded-[2.5rem] border-white/10 bg-white/5 backdrop-blur-3xl shadow-3xl">
              <button onClick={toggleMic} className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${isMicOn ? 'bg-indigo-600/10 text-indigo-400' : 'bg-rose-500 text-white hover:bg-rose-400 transition-colors'}`}>{isMicOn ? <Mic className="w-4 h-4 md:w-6 md:h-6"/> : <MicOff className="w-4 h-4 md:w-6 md:h-6"/>}</button>
              <button onClick={toggleCam} className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${isCamOn ? 'bg-indigo-600/10 text-indigo-400' : 'bg-rose-500 text-white hover:bg-rose-400 transition-colors'}`}>{isCamOn ? <Video className="w-4 h-4 md:w-6 md:h-6"/> : <VideoOff className="w-4 h-4 md:w-6 md:h-6"/>}</button>
              {isTeacher && (
                <>
                  <button onClick={toggleScreenShare} className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${isScreenSharing ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'bg-white/5 text-slate-400 hover:bg-white/10 transition-colors'}`}><Monitor className="w-4 h-4 md:w-6 md:h-6"/></button>
                  <button 
                    onClick={async () => {
                       try {
                          const res = await api.post(`/classes/${classId}/attendance`);
                          setAttendanceToken(res.data.token);
                          setIsAttendanceModalOpen(true);
                       } catch (e) {
                          alert("Failed to initialize ledger");
                       }
                    }} 
                    className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all shadow-xl"
                  >
                     <Zap className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
                  </button>
                </>
              )}
              <div className="w-px h-8 md:h-10 bg-white/10 mx-1 md:mx-2"></div>
              <button onClick={() => setIsChatOpen(!isChatOpen)} className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${isChatOpen ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'bg-white/5 text-slate-400 hover:bg-white/10 transition-colors'}`}><MessageSquare className="w-4 h-4 md:w-6 md:h-6"/></button>
               {isTeacher ? (
                 <button onClick={terminateSession} className="p-3 md:p-4 rounded-xl md:rounded-[1.5rem] bg-rose-600 hover:bg-rose-500 text-white shadow-2xl border border-white/10 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 group">
                    <PhoneOff className="w-4 h-4 md:w-5 md:h-5 rotate-[135deg]" />
                    <span className="text-[9px] font-black uppercase tracking-widest hidden sm:block">End Meeting</span>
                 </button>
               ) : (
                 <button onClick={handUp} className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-rose-600 text-white shadow-2xl shadow-rose-500/30 hover:bg-rose-500 transition-all hover:scale-110 active:scale-95"><PhoneOff className="w-4 h-4 md:w-6 md:h-6 rotate-[135deg]" /></button>
               )}
           </div>
         )}
         {isChatOpen && isJoined && (
             <div className="fixed inset-4 md:inset-auto md:top-24 md:bottom-32 md:right-6 md:w-full md:max-w-sm glass-panel rounded-[2rem] md:rounded-[2.5rem] border-white/10 bg-white/5 backdrop-blur-3xl shadow-3xl flex flex-col z-[100] animate-in slide-in-from-right-8 duration-500 overflow-hidden">
               <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                  <h3 className="font-black text-white text-[10px] uppercase tracking-widest">Live Feed</h3>
                  <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors"><X className="w-4 h-4 text-slate-400" /></button>
               </div>
               <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
                  {messages.map((msg, idx) => (
                     <div key={idx} className={`flex flex-col ${msg.userName === user.name ? 'items-end' : 'items-start'} space-y-1`}>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{msg.userName}</span>
                        <div className={`px-4 py-2 rounded-2xl text-sm ${msg.userName === user.name ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg' : 'bg-white/5 text-slate-200 rounded-tl-none border border-white/5'}`}>{msg.message}</div>
                     </div>
                  ))}
               </div>
               <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 flex gap-2 bg-white/2">
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Signal..." className="flex-1 bg-white/5 border-none rounded-xl px-4 text-xs font-medium focus:ring-1 focus:ring-indigo-500/50 transition-all" />
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl transition-all active:scale-95 shadow-lg"><Send className="w-4 h-4" /></button>
               </form>
            </div>
         )}

          {/* Attendance Generator Modal */}
          {isAttendanceModalOpen && (
             <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-3xl animate-in fade-in duration-500">
                 <div className="glass-panel p-6 md:p-12 rounded-[2rem] md:rounded-[4rem] border-white/5 bg-white/5 max-w-lg w-full text-center shadow-3xl transform scale-100 animate-in zoom-in-95 duration-500">
                   <h2 className="text-xl md:text-2xl font-black text-white tracking-widest uppercase mb-6 md:mb-8">Secure Attendance</h2>
                   <div className="bg-white p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-2xl mx-auto mb-8 md:mb-10 border-[8px] md:border-[12px] border-emerald-500/10 inline-block">
                      <QRCodeSVG value={`${window.location.origin}/class/${classId}/attendance/${attendanceToken}`} size={window.innerWidth < 768 ? 200 : 240} />
                   </div>
                   <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-6 md:mb-8 animate-pulse">Session Active: Live Sync</p>
                   <button 
                     onClick={() => setIsAttendanceModalOpen(false)}
                     className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all focus:outline-none"
                   >
                     Close Ledger
                   </button>
                </div>
             </div>
          )}
       </main>
    </div>
  );
};

const ParticipantTile = ({ stream, name, isLocal, mirrored, onReconnect, status }) => (
  <div className={`relative rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden glass-panel border-white/5 shadow-2xl group transition-all duration-500 hover:scale-[1.02] aspect-video bg-slate-900/50 ${isLocal ? 'w-full max-w-[280px] md:max-w-none mx-auto' : ''}`}>
     <VideoTile stream={stream} className={mirrored ? 'mirror-x' : ''} muted={isLocal} />
     <div className="absolute top-4 right-4 z-20 flex gap-2">
        {status && (
          <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest backdrop-blur-md border ${
            status === 'connected' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 
            status === 'failed' ? 'bg-rose-500/20 text-rose-400 border-rose-500/20' : 
            'bg-amber-500/20 text-amber-400 border-amber-500/20'
          }`}>
            {status}
          </div>
        )}
     </div>
     <div className="absolute bottom-3 md:bottom-4 left-3 md:left-4 z-20 bg-black/40 backdrop-blur-md px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-white/10 shadow-xl flex items-center gap-2">
        <span className="text-white text-[8px] md:text-[9px] font-black uppercase tracking-widest">{name}</span>
        {!isLocal && (
          <button onClick={onReconnect} title="Re-sync Video" className="p-1 hover:bg-white/10 rounded-md transition-colors">
            <Zap className="w-2.5 h-2.5 text-indigo-400" />
          </button>
        )}
     </div>
  </div>
);

const VideoTile = ({ stream, className, muted }) => {
   const ref = useRef();
    useEffect(() => { 
       if (ref.current && stream) {
          // Only re-assign if the stream object has actually changed
          if (ref.current.srcObject !== stream) {
             console.log("[VIDEO] Setting srcObject");
             ref.current.srcObject = stream;
             
             const playVideo = async () => {
                try {
                   if (ref.current) {
                      ref.current.volume = 1;
                      await ref.current.play();
                      console.log("[VIDEO] Playback started successfully");
                   }
                } catch (e) {
                   if (e.name !== 'AbortError') {
                      console.warn("[VIDEO] Autoplay prevented or failed:", e);
                   }
                }
             };
             playVideo();
          }

          // Handle tracks arriving later in the SAME stream object
          const onTrackAdded = () => { 
             console.log("[VIDEO] Late track detected");
             if (ref.current) {
                // We re-assign to ensure the new track is picked up
                ref.current.srcObject = stream; 
             }
          };
          stream.addEventListener('addtrack', onTrackAdded);
          return () => stream.removeEventListener('addtrack', onTrackAdded);
       }
    }, [stream]);
   return <video ref={ref} autoPlay playsInline muted={muted} className={`w-full h-full object-cover ${className}`} />;
};

export default LiveClass;
