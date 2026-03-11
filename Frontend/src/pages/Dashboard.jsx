import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents');
      setDocuments(res.data);
    } catch (err) {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/documents', { title: newTitle || 'Untitled Document' });
      setNewTitle('');
      setShowCreate(false);
      navigate(`/document/${res.data._id}`);
    } catch (err) {
      setError('Failed to create document');
    }
  };

  const deleteDocument = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/documents/${id}`);
      setDocuments(documents.filter(d => d._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete document');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-[#e6e6e6] shadow-sm">
        <h1 className="text-xl font-bold text-gray-700">CollabEdit</h1>
        <div className="flex items-center gap-3">
          <span className="bg-[#eae6e1] text-gray-700 px-3 py-1 rounded-full text-sm font-medium">{user?.username}</span>
          <button onClick={logout} className="px-4 py-2 border border-[#e6e6e6] rounded-lg text-gray-800 text-sm hover:bg-[#f5f5f5] hover:border-[#a8a8a8] transition">Logout</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">My Documents</h2>
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 transition">
            + New Document
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-500 border border-red-200 px-4 py-2.5 rounded-lg mb-4 text-sm">{error}</div>}

        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
            <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-lg" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-5">Create New Document</h3>
              <form onSubmit={createDocument}>
                <div className="mb-4">
                  <label className="block mb-1 text-sm font-medium text-gray-800">Document Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Enter document title"
                    autoFocus
                    className="w-full px-3 py-2.5 border border-[#e6e6e6] rounded-lg outline-none transition focus:border-[#a8a8a8] focus:ring-2 focus:ring-[#e2e6e9]"
                  />
                </div>
                <div className="flex gap-3 justify-end mt-5">
                  <button type="button" className="px-4 py-2 border border-[#e6e6e6] rounded-lg text-gray-800 text-sm hover:bg-[#f5f5f5] transition" onClick={() => setShowCreate(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 transition">Create</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-[200px] text-[#a8a8a8]">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 text-[#a8a8a8]">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No documents yet</h3>
            <p>Create your first document to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {documents.map(doc => (
              <div key={doc._id} className="bg-white border border-[#e6e6e6] rounded-xl p-5 cursor-pointer shadow-sm hover:shadow-md hover:border-[#a8a8a8] hover:-translate-y-0.5 transition-all" onClick={() => navigate(`/document/${doc._id}`)}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-base font-semibold text-gray-800 break-words">{doc.title}</h3>
                  {doc.owner._id === user?.id && (
                    <button
                      className="text-red-500 hover:bg-red-50 rounded p-0.5 text-lg leading-none cursor-pointer bg-transparent border-none"
                      onClick={(e) => { e.stopPropagation(); deleteDocument(doc._id); }}
                      title="Delete document"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p className="text-[#a8a8a8] text-sm mb-3 min-h-[2.5rem] leading-relaxed">
                  {doc.content ? doc.content.substring(0, 100) + (doc.content.length > 100 ? '...' : '') : 'Empty document'}
                </p>
                <div className="flex justify-between text-xs text-[#a8a8a8]">
                  <span>By {doc.owner.username}</span>
                  <span>{formatDate(doc.updatedAt)}</span>
                </div>
                {doc.collaborators && doc.collaborators.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {doc.collaborators.map(c => (
                      <span key={c._id} className="bg-[#eae6e1] text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">{c.username}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
