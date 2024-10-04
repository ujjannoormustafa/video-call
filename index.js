const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('join', (room) => {
        socket.join(room);
        console.log(`User joined room: ${room}`);

        // Notify other users in the room that a new user has joined
        socket.to(room).emit('user-connected', socket.id);

        // Handle the case when a user disconnects
        socket.on('disconnect', () => {
            console.log('User disconnected');
            socket.to(room).emit('user-disconnected', socket.id);
        });
    });

    socket.on('ice-candidate', (data) => {
        socket.to(data.room).emit('ice-candidate', data);
    });

    socket.on('offer', (data) => {
        socket.to(data.room).emit('offer', data);
    });

    socket.on('answer', (data) => {
        socket.to(data.room).emit('answer', data);
    });
});

// Listening on PORT
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
