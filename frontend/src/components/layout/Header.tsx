import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store/store';
import { logout } from '../../store/slices/authSlice';
import { LogOut, User, Shield } from 'lucide-react';

const Header = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            MeetingApp
          </Link>

          <nav className="flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="hover:text-blue-600">
                  Dashboard
                </Link>
                
                {user?.role === 'admin' && (
                  <Link to="/admin" className="flex items-center gap-1 hover:text-blue-600">
                    <Shield size={18} />
                    Admin Panel
                  </Link>
                )}
                  <Link 
                to="/ai-chat" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/ai-chat' 
                    ? 'bg-indigo-700 text-white' 
                    : 'text-gray-300 hover:bg-indigo-700 hover:text-white'
                }`}
              >
                Trợ lý AI
              </Link>
                <div className="flex items-center gap-2">
                  <User size={18} />
                  <span className="text-sm">{user?.fullName}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-blue-600">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Register
                </Link>
               
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;