const Document = require('../models/Document');
const User = require('../models/user.model');

async function createDocument(req, res) {
    try {
    const { title } = req.body;
    const doc = new Document({
      title: title || 'Untitled Document',
      content: '',
      owner: req.user.id,
      versions: []
    });
    await doc.save();
    await doc.populate('owner', 'username email');
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function getDocuments(req, res) {
    try {
    const docs = await Document.find({
      $or: [
        { owner: req.user.id },
        { collaborators: req.user.id }
      ]
    })
    .populate('owner', 'username email')
    .populate('collaborators', 'username email')
    .sort({ updatedAt: -1 });

    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}


async function getDocumentById(req, res) {
    try {
    const doc = await Document.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('collaborators', 'username email')
      .populate('versions.editedBy', 'username');

    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const isOwner = doc.owner._id.toString() === req.user.id;
    const isCollaborator = doc.collaborators.some(c => c._id.toString() === req.user.id);

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function updateDocument(req, res) {
    try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const isOwner = doc.owner.toString() === req.user.id;
    const isCollaborator = doc.collaborators.some(c => c.toString() === req.user.id);

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, content } = req.body;
    if (title !== undefined) doc.title = title;
    if (content !== undefined) {
      doc.versions.push({
        content: doc.content,
        editedBy: req.user.id,
        editedAt: new Date()
      });
      doc.content = content;
    }

    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}


async function deleteDocument(req, res) {
    try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    if (doc.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the owner can delete' });
    }

    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function addCollaborator(req, res) {
    try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    if (doc.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the owner can add collaborators' });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'You are already the owner' });
    }

    if (doc.collaborators.some(c => c.toString() === user._id.toString())) {
      return res.status(400).json({ message: 'User is already a collaborator' });
    }

    doc.collaborators.push(user._id);
    await doc.save();
    await doc.populate('collaborators', 'username email');

    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function removeCollaborator(req, res) {
    try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    if (doc.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the owner can remove collaborators' });
    }

    doc.collaborators = doc.collaborators.filter(
      c => c.toString() !== req.params.userId
    );
    await doc.save();

    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function getDocumentVersions(req, res) {
    try {
    const doc = await Document.findById(req.params.id)
      .populate('versions.editedBy', 'username');

    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const isOwner = doc.owner.toString() === req.user.id;
    const isCollaborator = doc.collaborators.some(c => c.toString() === req.user.id);

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(doc.versions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

module.exports = {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  addCollaborator,
  removeCollaborator,
  getDocumentVersions
};