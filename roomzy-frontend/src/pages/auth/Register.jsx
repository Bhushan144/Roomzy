import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useRegisterMutation } from '../../store/api/authApi';
import { setCredentials } from '../../store/slices/authSlice';

export default function Register() {
  const [formData, setFormData] = useState({ email: '', password: '', role: 'TENANT' });
  
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [register, { isLoading: isRegistering, error: registerError }] = useRegisterMutation();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await register(formData).unwrap();
      // Backend now returns { token, role, userId } directly on register
      dispatch(setCredentials({ 
        user: { role: response.data.role, id: response.data.userId }, 
        token: response.data.token 
      }));
      
      // Route based on role
      if (response.data.role === 'OWNER') navigate('/dashboard');
      else navigate('/search');
      
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-lg shadow-md border border-gray-100">
      <h2 className="text-2xl font-bold text-center mb-6">
        Create an Account
      </h2>

      <form onSubmit={handleRegister} className="space-y-4">
        {registerError && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{registerError.data?.message || 'Error'}</div>}
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password (Min 8 chars)</label>
          <input type="password" required minLength="8" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">I want to...</label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input type="radio" value="TENANT" checked={formData.role === 'TENANT'} onChange={(e) => setFormData({...formData, role: e.target.value})} className="mr-2" />
              Find a Room
            </label>
            <label className="flex items-center">
              <input type="radio" value="OWNER" checked={formData.role === 'OWNER'} onChange={(e) => setFormData({...formData, role: e.target.value})} className="mr-2" />
              List a Room
            </label>
          </div>
        </div>
        <button type="submit" disabled={isRegistering} className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-gray-800 disabled:opacity-50">
          {isRegistering ? 'Processing...' : 'Register'}
        </button>
      </form>
    </div>
  );
}