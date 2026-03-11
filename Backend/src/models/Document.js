const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  content: { type: String, default: '' },
  editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  editedAt: { type: Date, default: Date.now }
});

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  versions: [versionSchema],
  activeUsers: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    cursor: { line: Number, ch: Number }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
