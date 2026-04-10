const rooms = {}; // roomId -> { teacherSocketId, sharingSocketId, userCount }

module.exports = function(io) {
  const socketToRoom = {};
  
  io.on('connection', (socket) => {
    socket.on('join-room', (roomId, userId, userName, role, options = {}) => {
      const normalizedRole = role?.toLowerCase();
      const isLive = !!options.isLive;

      socket.join(roomId);
      socketToRoom[socket.id] = { roomId, role: normalizedRole, isLive };
      
      if (!rooms[roomId]) {
         rooms[roomId] = { teacherSocketId: null, sharingSocketId: null, userCount: 0 };
      }
      rooms[roomId].userCount++;

      console.log(`[SESSION] User ${userName} (${normalizedRole}) joined room ${roomId}. Context: ${isLive ? 'LIVE' : 'DASH'}`);

      if (isLive && (normalizedRole === 'teacher' || normalizedRole === 'admin')) {
         rooms[roomId].teacherSocketId = socket.id;
         socket.to(roomId).emit('teacher-status', { online: true });
         console.log(`[SESSION] Instructional Lead initialized LIVE for room ${roomId}`);
      }

      socket.emit('room-status', {
         isTeacherOnline: !!rooms[roomId].teacherSocketId,
         sharingSocketId: rooms[roomId].sharingSocketId
      });
    });

    socket.on('ready-to-call', (payload) => {
       const userState = socketToRoom[socket.id];
       if (userState) {
          socket.to(userState.roomId).emit('user-joined', socket.id, payload.userId, payload.userName);
          console.log(`[SESSION] User ${payload.userName} is ready to call in ${userState.roomId}`);
       }
    });

    socket.on('start-sharing', () => {
       const userState = socketToRoom[socket.id];
       if (userState && (userState.role === 'teacher' || userState.role === 'admin')) {
          const roomId = userState.roomId;
          rooms[roomId].sharingSocketId = socket.id;
          socket.to(roomId).emit('sharing-status', { sharingSocketId: socket.id });
          console.log(`[STREAM] Screen broadcast started by ${socket.id} in ${roomId}`);
       } else {
          socket.emit('error', 'Only the instructional lead can initiative a screen broadcast.');
       }
    });

    socket.on('stop-sharing', () => {
       const userState = socketToRoom[socket.id];
       if (userState) {
          const roomId = userState.roomId;
          if (rooms[roomId].sharingSocketId === socket.id) {
             rooms[roomId].sharingSocketId = null;
             socket.to(roomId).emit('sharing-status', { sharingSocketId: null });
             console.log(`[STREAM] Screen broadcast terminated in ${roomId}`);
          }
       }
    });

    socket.on('offer', (payload) => {
       io.to(payload.targetSocketId).emit('offer', payload);
    });

    socket.on('answer', (payload) => {
       io.to(payload.targetSocketId).emit('answer', payload);
    });

    socket.on('ice-candidate', (payload) => {
       io.to(payload.targetSocketId).emit('ice-candidate', payload);
    });

    socket.on('send-chat', (payload) => {
       socket.to(payload.roomId).emit('receive-chat', payload);
    });

    socket.on('emit-classwork-update', (roomId) => {
       socket.to(roomId).emit('classwork-updated');
    });

    socket.on('end-session', (roomId) => {
       const userState = socketToRoom[socket.id];
       if (userState && (userState.role === 'teacher' || userState.role === 'admin')) {
          console.log(`[SESSION] Instructional Lead explicitly terminated session ${roomId}`);
          socket.to(roomId).emit('end-call');
          // Optional: Cleanup room state immediately
          if (rooms[roomId]) {
             rooms[roomId].teacherSocketId = null;
             rooms[roomId].sharingSocketId = null;
          }
       }
    });

    const handleDisconnect = () => {
      const userState = socketToRoom[socket.id];
      if (userState) {
        const roomId = userState.roomId;
        if (rooms[roomId].teacherSocketId === socket.id) {
           console.log(`[SESSION] Instructional Lead disconnected from ${roomId}. Terminating session...`);
           rooms[roomId].teacherSocketId = null;
           socket.to(roomId).emit('teacher-status', { online: false });
           socket.to(roomId).emit('end-call');
        }
        if (rooms[roomId].sharingSocketId === socket.id) {
           rooms[roomId].sharingSocketId = null;
           socket.to(roomId).emit('sharing-status', { sharingSocketId: null });
        }
        rooms[roomId].userCount--;
        if (rooms[roomId].userCount <= 0) delete rooms[roomId];

        socket.to(roomId).emit('user-disconnected', socket.id);
        delete socketToRoom[socket.id];
      }
    };

    socket.on('leave-room', handleDisconnect);
    socket.on('disconnect', handleDisconnect);
  });
};
