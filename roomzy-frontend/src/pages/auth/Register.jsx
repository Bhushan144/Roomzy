import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useRegisterMutation, useVerifyOtpMutation } from '../../store/api/authApi';
import { setCredentials } from '../../store/slices/authSlice';

export default function Register() {
  const [formData, setFormData] = useState({ email: '', password: '', role: 'TENANT' });
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState(null);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [register, { isLoading: isRegistering, error: registerError }] = useRegisterMutation();
  const [verifyOtp, { isLoading: isVerifying, error: otpError }] = useVerifyOtpMutation();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const result = await register(formData).unwrap();
      // The backend returns dev_otp in the data object for development
      if (result?.data?.dev_otp) {
        setDevOtp(result.data.dev_otp);
      }
      setStep(2); // Move to OTP step on success
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      await verifyOtp({ email: formData.email, otp }).unwrap();
      // Backend only confirms verification — user must now login separately
      navigate('/login');
    } catch (err) {
      console.error('OTP verification failed:', err);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-lg shadow-md border border-gray-100">
      <h2 className="text-2xl font-bold text-center mb-6">
        {step === 1 ? 'Create an Account' : 'Verify Your Email'}
      </h2>

      {step === 1 ? (
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
      ) : (
        <form onSubmit={handleVerify} className="space-y-4">
          {otpError && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{otpError.data?.message || 'Invalid OTP'}</div>}
          <p className="text-sm text-gray-600 text-center mb-4">
            We sent a 6-digit code to {formData.email}.
          </p>
          {devOtp && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md text-sm text-center font-medium">
              DEV MODE: Your OTP is {devOtp}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">6-Digit Code</label>
            <input type="text" required maxLength="6" value={otp} onChange={(e) => setOtp(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-center text-xl tracking-widest" />
          </div>
          <button type="submit" disabled={isVerifying} className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-gray-800 disabled:opacity-50">
            {isVerifying ? 'Verifying...' : 'Verify & Login'}
          </button>
        </form>
      )}
    </div>
  );
}