import { Link, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function Home() {
  const { token, user } = useSelector((state) => state.auth);

  // Smart Routing: If a logged-in user hits the home page, redirect them to their app area
  if (token) {
    return <Navigate to={user?.role === 'OWNER' ? '/dashboard' : '/search'} replace />;
  }

  return (
    <div className="flex flex-col min-h-[80vh]">
      
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-20 px-4 flex-grow">
        <div className="inline-block px-4 py-1.5 rounded-full bg-gray-100 text-sm font-semibold text-gray-800 mb-6">
          Powered by Hybrid AI Matching
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight mb-6 max-w-4xl">
          Find your next home.<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-500 to-gray-900">
            Find your next flatmate.
          </span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl leading-relaxed">
          Roomzy is the first dual-discovery marketplace that matches you with the perfect physical space and the perfect human harmony using our proprietary 70/30 algorithm.
        </p>
        
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <Link 
            to="/register" 
            className="px-8 py-4 bg-primary text-white text-lg font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-lg"
          >
            Get Started for Free
          </Link>
          <Link 
            to="/login" 
            className="px-8 py-4 bg-white text-gray-900 border-2 border-gray-200 text-lg font-medium rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 border-t border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
          
          {/* Feature 1 */}
          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Beautiful Properties</h3>
            <p className="text-gray-500 text-sm">
              Explore high-quality rooms listed by verified owners. Filter by rent, location, and amenities to find your exact match.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Deep Compatibility</h3>
            <p className="text-gray-500 text-sm">
              Our AI evaluates lifestyle traits—from cleanliness to sociability—to ensure you love who you live with.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Real-Time Chat</h3>
            <p className="text-gray-500 text-sm">
              Connect securely inside the platform. Accept a connection request and start messaging instantly.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
}