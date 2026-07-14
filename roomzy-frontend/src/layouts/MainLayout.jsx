import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { useGetFlatmateProfileQuery } from '../store/api/profileApi';

export default function MainLayout() {
  const { token, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data: profileResponse } = useGetFlatmateProfileQuery(undefined, {
    skip: !token,
  });
  const profilePicture = profileResponse?.data?.profilePicture;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <Link to={token ? (user.role === 'OWNER' ? '/dashboard' : '/search') : '/'} className="text-xl font-bold tracking-tight">
          Roomzy
        </Link>
        
        <div className="space-x-4 flex items-center">
          {!token ? (
            <>
              <Link to="/login" className="text-sm font-medium hover:text-gray-600">Log in</Link>
              <Link to="/register" className="text-sm font-medium bg-primary text-white px-4 py-2 rounded-md hover:bg-gray-800">Sign up</Link>
            </>
          ) : (
            <>
              <Link to="/profile-setup" className="text-sm font-medium text-gray-700 hover:text-primary mr-4 flex items-center">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                Profile
              </Link>
              {/* NEW INBOX LINK */}
              <Link to="/inbox" className="text-sm font-medium text-gray-700 hover:text-primary mr-4 flex items-center">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                </svg>
                Inbox
              </Link>
              
              <div className="hidden sm:flex items-center border-l border-gray-200 pl-4 mr-4 space-x-3">
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile" className="w-9 h-9 rounded-full object-cover shadow-sm border border-gray-100" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-sm shadow-sm border border-gray-200">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {profileResponse?.data?.fullName || user?.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{user?.role}</span>
                </div>
              </div>

              <span className="text-sm text-gray-300 mr-4 hidden sm:inline">|</span>
              <button onClick={handleLogout} className="text-sm font-medium text-red-600 hover:text-red-800">
                Log out
              </button>
            </>
          )}
        </div>
      </nav>
      
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}