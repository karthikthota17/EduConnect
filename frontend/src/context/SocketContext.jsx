import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useSelector } from 'react-redux';

const SocketContext = createContext(undefined);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (isAuthenticated && user) {
            const socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
                transports: ['websocket', 'polling']
            });
            
            socketInstance.on('connect', () => {
                console.log("Socket connection established for user:", user.name);
                socketInstance.emit('join-room', `user_${user._id}`);
            });

            setSocket(socketInstance);

            return () => {
                socketInstance.disconnect();
                setSocket(null);
            };
        }
    }, [isAuthenticated, user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
