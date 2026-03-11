import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#a8a8a8] to-[#e2e6e9] p-4">
      <div className="bg-white p-10 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-700">CollabEdit</h1>
          <p className="text-[#a8a8a8] text-sm mt-1">Real-time Collaboration Platform</p>
        </div>
        <h2 className="text-xl font-semibold mb-5">Sign In</h2>
        {error && <div className="bg-red-50 text-red-500 border border-red-200 px-4 py-2.5 rounded-lg mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-gray-800">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full px-3 py-2.5 border border-[#e6e6e6] rounded-lg outline-none transition focus:border-[#a8a8a8] focus:ring-2 focus:ring-[#e2e6e9]"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-gray-800">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full px-3 py-2.5 border border-[#e6e6e6] rounded-lg outline-none transition focus:border-[#a8a8a8] focus:ring-2 focus:ring-[#e2e6e9]"
            />
          </div>
          <button type="submit" className="w-full inline-flex items-center justify-center px-5 py-2.5 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 disabled:opacity-60 disabled:cursor-not-allowed transition" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center mt-5 text-[#a8a8a8] text-sm">
          Don't have an account? <Link to="/register" className="text-gray-700 hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
