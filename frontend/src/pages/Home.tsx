import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { Video, Users, Shield, Calendar } from 'lucide-react';

const Home = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-20">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Welcome to MeetingApp
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Professional online meetings with screen sharing, video, and audio
        </p>
        <div className="flex gap-4 justify-center">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg font-medium"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg font-medium"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="px-8 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 text-lg font-medium"
              >
                Login
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Features
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 py-16">
        <div className="text-center p-6">
          <div className="inline-block p-3 bg-blue-100 rounded-lg mb-4">
            <Video className="text-blue-600" size={32} />
          </div>
          <h3 className="text-xl font-semibold mb-2">HD Video</h3>
          <p className="text-gray-600">Crystal clear video quality</p>
        </div>

        <div className="text-center p-6">
          <div className="inline-block p-3 bg-green-100 rounded-lg mb-4">
            <Users className="text-green-600" size={32} />
          </div>
          <h3 className="text-xl font-semibold mb-2">Multi-User</h3>
          <p className="text-gray-600">Connect with multiple participants</p>
        </div>

        <div className="text-center p-6">
          <div className="inline-block p-3 bg-orange-100 rounded-lg mb-4">
            <Calendar className="text-orange-600" size={32} />
          </div>
          <h3 className="text-xl font-semibold mb-2">Schedule</h3>
          <p className="text-gray-600">Plan meetings in advance</p>
        </div>
      </div> */}
    </div>
  );
};

export default Home;