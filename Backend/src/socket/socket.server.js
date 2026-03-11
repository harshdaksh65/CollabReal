const jwt = require('jsonwebtoken');
const Document = require('../models/Document');

module.exports = function (io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username}`);

    // Join a document room
    socket.on('join-document', async (documentId) => {
      socket.join(documentId);
      socket.documentId = documentId;

      try {
        const doc = await Document.findById(documentId);
        if (doc) {
          // Send current content to joining user
          socket.emit('load-document', doc.content);

          // Track active user in document
          const existing = doc.activeUsers.find(
            u => u.userId && u.userId.toString() === socket.user.id
          );
          if (!existing) {
            doc.activeUsers.push({
              userId: socket.user.id,
              username: socket.user.username
            });
            await doc.save();
          }

          // Notify others
          socket.to(documentId).emit('user-joined', {
            userId: socket.user.id,
            username: socket.user.username
          });

          // Send active users list
          io.to(documentId).emit('active-users', doc.activeUsers);
        }
      } catch (err) {
        console.error('Error joining document:', err.message);
      }
    });

    // Handle text changes
    socket.on('send-changes', (delta) => {
      if (socket.documentId) {
        socket.to(socket.documentId).emit('receive-changes', delta);
      }
    });

    // Handle cursor position updates
    socket.on('cursor-update', (cursorData) => {
      if (socket.documentId) {
        socket.to(socket.documentId).emit('cursor-update', {
          userId: socket.user.id,
          username: socket.user.username,
          ...cursorData
        });
      }
    });

    // Save document
    socket.on('save-document', async ({ documentId, content }) => {
      try {
        const doc = await Document.findById(documentId);
        if (doc) {
          // Save version
          doc.versions.push({
            content: doc.content,
            editedBy: socket.user.id,
            editedAt: new Date()
          });
          doc.content = content;
          await doc.save();
          socket.emit('document-saved', { success: true });
          socket.to(documentId).emit('document-saved-notification', {
            savedBy: socket.user.username
          });
        }
      } catch (err) {
        socket.emit('document-saved', { success: false, error: err.message });
      }
    });

    // Handle title update
    socket.on('update-title', async ({ documentId, title }) => {
      try {
        await Document.findByIdAndUpdate(documentId, { title });
        socket.to(documentId).emit('title-updated', title);
      } catch (err) {
        console.error('Error updating title:', err.message);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.username}`);
      if (socket.documentId) {
        try {
          const doc = await Document.findById(socket.documentId);
          if (doc) {
            doc.activeUsers = doc.activeUsers.filter(
              u => !u.userId || u.userId.toString() !== socket.user.id
            );
            await doc.save();

            socket.to(socket.documentId).emit('user-left', {
              userId: socket.user.id,
              username: socket.user.username
            });
            io.to(socket.documentId).emit('active-users', doc.activeUsers);
          }
        } catch (err) {
          console.error('Error on disconnect:', err.message);
        }
      }
    });
  });
};
