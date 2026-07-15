import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../../store/api/authApi';
import { setCredentials } from '../../store/slices/authSlice';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [login, { isLoading, error }] = useLoginMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login({ email, password }).unwrap();
      // Backend returns { token, role, userId } — map it to our auth slice shape
      dispatch(setCredentials({ 
        user: { role: response.data.role, id: response.data.userId }, 
        token: response.data.token 
      }));
      
      // Route based on role
      if (response.data.role === 'OWNER') navigate('/dashboard');
      else navigate('/search');
      
    } catch (err) {
      console.error('Failed to log in:', err);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-lg shadow-md border border-gray-100">
      <h2 className="text-2xl font-bold text-center mb-6">Welcome Back</h2>
      
      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{error.data?.message || 'Login failed'}</div>}

      <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-md border border-blue-200 text-sm">
        <p className="font-semibold mb-1">Demo Credentials (Evaluators):</p>
        <p>Email: <span className="font-mono font-medium">test@gmail.com</span></p>
        <p>Password: <span className="font-mono font-medium">test1234</span></p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input 
            type="email" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)} 
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input 
            type="password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)} 
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-gray-800 disabled:opacity-50"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}