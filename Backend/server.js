const dotenv = require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const connectDb = require('./src/db/db');
const initSocket = require('./src/socket/socket.server');

const PORT = process.env.PORT || 5000;

connectDb();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

initSocket(io);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});