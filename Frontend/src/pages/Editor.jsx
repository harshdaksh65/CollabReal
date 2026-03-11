import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);

  const [document, setDocument] = useState(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState([]);
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [collabEmail, setCollabEmail] = useState('');
  const [collabError, setCollabError] = useState('');
  const [notification, setNotification] = useState('');

  const socketRef = useRef(null);
  const textareaRef = useRef(null);
  const isRemoteChange = useRef(false);

  // Connect socket
  useEffect(() => {
    const socket = io('http://localhost:5000', {
      auth: { token }
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-document', id);
    });

    socket.on('load-document', (docContent) => {
      isRemoteChange.current = true;
      setContent(docContent || '');
      isRemoteChange.current = false;
    });

    socket.on('receive-changes', (newContent) => {
      isRemoteChange.current = true;
      setContent(newContent);
      isRemoteChange.current = false;
    });

    socket.on('active-users', (users) => {
      setActiveUsers(users);
    });

    socket.on('user-joined', (userData) => {
      setNotification(`${userData.username} joined`);
      setTimeout(() => setNotification(''), 3000);
    });

    socket.on('user-left', (userData) => {
      setNotification(`${userData.username} left`);
      setTimeout(() => setNotification(''), 3000);
    });

    socket.on('document-saved', (result) => {
      setSaving(false);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });

    socket.on('document-saved-notification', ({ savedBy }) => {
      setNotification(`Document saved by ${savedBy}`);
      setTimeout(() => setNotification(''), 3000);
    });

    socket.on('title-updated', (newTitle) => {
      setTitle(newTitle);
    });

    return () => {
      socket.disconnect();
    };
  }, [id, token]);

  // Load document
  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await api.get(`/documents/${id}`);
        setDocument(res.data);
        setTitle(res.data.title);
        setContent(res.data.content || '');
      } catch (err) {
        setError('Failed to load document');
      }
    };
    fetchDoc();
  }, [id]);

  const handleContentChange = useCallback((e) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (!isRemoteChange.current && socketRef.current) {
      socketRef.current.emit('send-changes', newContent);
    }
  }, []);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (socketRef.current) {
      socketRef.current.emit('update-title', { documentId: id, title: newTitle });
    }
  };

  const saveDocument = () => {
    if (socketRef.current) {
      setSaving(true);
      socketRef.current.emit('save-document', { documentId: id, content });
    }
  };

  const loadVersions = async () => {
    try {
      const res = await api.get(`/documents/${id}/versions`);
      setVersions(res.data);
      setShowVersions(true);
    } catch (err) {
      setError('Failed to load versions');
    }
  };

  const restoreVersion = (versionContent) => {
    setContent(versionContent);
    if (socketRef.current) {
      socketRef.current.emit('send-changes', versionContent);
    }
    setShowVersions(false);
    setNotification('Version restored – remember to save!');
    setTimeout(() => setNotification(''), 3000);
  };

  const addCollaborator = async (e) => {
    e.preventDefault();
    setCollabError('');
    try {
      const res = await api.post(`/documents/${id}/collaborators`, { email: collabEmail });
      setDocument(res.data);
      setCollabEmail('');
      setShowCollabModal(false);
    } catch (err) {
      setCollabError(err.response?.data?.message || 'Failed to add collaborator');
    }
  };

  const removeCollaborator = async (userId) => {
    try {
      const res = await api.delete(`/documents/${id}/collaborators/${userId}`);
      setDocument(res.data);
    } catch (err) {
      setError('Failed to remove collaborator');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const isOwner = document && document.owner && document.owner._id === user?.id;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h2 className="text-xl font-semibold">Error</h2>
        <p className="text-[#a8a8a8]">{error}</p>
        <button onClick={() => navigate('/')} className="px-5 py-2.5 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 transition">Back to Dashboard</button>
      </div>
    );
  }

  if (!document) {
    return <div className="flex items-center justify-center min-h-screen text-[#a8a8a8]">Loading document...</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-[#e6e6e6] gap-4 shadow-sm shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button onClick={() => navigate('/')} className="px-3 py-1.5 border border-[#e6e6e6] rounded-lg text-gray-800 text-sm hover:bg-[#f5f5f5] transition whitespace-nowrap">
            ← Back
          </button>
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            className="border border-transparent px-2.5 py-1.5 text-lg font-semibold rounded-lg w-full max-w-sm outline-none transition focus:border-[#a8a8a8] focus:bg-[#f5f5f5]"
            placeholder="Document title"
          />
        </div>
        <div className="flex items-center gap-2">
          {notification && <span className="bg-[#eae6e1] text-gray-700 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap animate-fade-in">{notification}</span>}
          {saving && <span className="text-sm font-medium text-amber-500 whitespace-nowrap">Saving...</span>}
          {saved && <span className="text-sm font-medium text-green-500 whitespace-nowrap">Saved ✓</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex gap-1">
            {activeUsers.map((u, i) => (
              <span key={i} className="w-7 h-7 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs font-semibold border-2 border-white" title={u.username}>
                {u.username?.[0]?.toUpperCase()}
              </span>
            ))}
          </div>
          {isOwner && (
            <button onClick={() => setShowCollabModal(true)} className="px-3 py-1.5 border border-[#e6e6e6] rounded-lg text-gray-800 text-sm hover:bg-[#f5f5f5] transition">
              Share
            </button>
          )}
          <button onClick={loadVersions} className="px-3 py-1.5 border border-[#e6e6e6] rounded-lg text-gray-800 text-sm hover:bg-[#f5f5f5] transition">
            History
          </button>
          <button onClick={saveDocument} className="px-4 py-1.5 bg-gray-800 text-white font-medium rounded-lg text-sm hover:bg-gray-900 disabled:opacity-60 transition" disabled={saving}>
            Save
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          className="w-full h-full border-none outline-none resize-none px-12 py-8 font-serif text-base leading-relaxed text-gray-800 bg-white"
          placeholder="Start typing here..."
          spellCheck={false}
        />
      </div>

      {/* Version History Modal */}
      {showVersions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowVersions(false)}>
          <div className="bg-white rounded-xl p-8 w-full max-w-xl max-h-[80vh] overflow-y-auto shadow-lg" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold">Version History</h3>
              <button className="text-[#a8a8a8] hover:bg-[#f5f5f5] rounded p-1 text-lg bg-transparent border-none cursor-pointer" onClick={() => setShowVersions(false)}>✕</button>
            </div>
            <div className="flex flex-col gap-3">
              {versions.length === 0 ? (
                <p className="text-center py-8 text-[#a8a8a8]">No previous versions</p>
              ) : (
                versions.slice().reverse().map((v, i) => (
                  <div key={i} className="border border-[#e6e6e6] rounded-lg p-4 hover:border-[#a8a8a8] transition">
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold text-sm text-gray-700">
                        {v.editedBy?.username || 'Unknown'}
                      </span>
                      <span className="text-xs text-[#a8a8a8]">{formatDate(v.editedAt)}</span>
                    </div>
                    <div className="text-xs text-[#a8a8a8] mb-2.5 leading-relaxed break-words">
                      {v.content ? v.content.substring(0, 150) + '...' : '(empty)'}
                    </div>
                    <button
                      className="px-3 py-1.5 border border-[#e6e6e6] rounded-lg text-gray-800 text-sm hover:bg-[#f5f5f5] transition"
                      onClick={() => restoreVersion(v.content)}
                    >
                      Restore
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Collaborator Modal */}
      {showCollabModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCollabModal(false)}>
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-lg" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold">Share Document</h3>
              <button className="text-[#a8a8a8] hover:bg-[#f5f5f5] rounded p-1 text-lg bg-transparent border-none cursor-pointer" onClick={() => setShowCollabModal(false)}>✕</button>
            </div>
            <form onSubmit={addCollaborator}>
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium text-gray-800">Add collaborator by email</label>
                <input
                  type="email"
                  value={collabEmail}
                  onChange={(e) => setCollabEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                  className="w-full px-3 py-2.5 border border-[#e6e6e6] rounded-lg outline-none transition focus:border-[#a8a8a8] focus:ring-2 focus:ring-[#e2e6e9]"
                />
              </div>
              {collabError && <div className="bg-red-50 text-red-500 border border-red-200 px-4 py-2.5 rounded-lg mb-4 text-sm">{collabError}</div>}
              <button type="submit" className="px-5 py-2 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 transition">Add</button>
            </form>
            {document.collaborators && document.collaborators.length > 0 && (
              <div className="mt-6 border-t border-[#e6e6e6] pt-4">
                <h4 className="text-sm font-semibold mb-3">Current Collaborators</h4>
                {document.collaborators.map(c => (
                  <div key={c._id} className="flex justify-between items-center py-2 text-sm">
                    <span>{c.username} ({c.email})</span>
                    <button
                      className="text-red-500 hover:bg-red-50 rounded p-0.5 text-lg leading-none cursor-pointer bg-transparent border-none"
                      onClick={() => removeCollaborator(c._id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
