import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import CreateMeetingModal from '../components/meeting/CreateMeetingModal';
import JoinMeetingModal from '../components/meeting/JoinMeetingModal';
import { Video, Users, Calendar, Plus, LogIn } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Welcome Section
      <div className="bg-white p-8 rounded-lg shadow-md mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.fullName}!</h1>
        <p className="text-gray-600">Start or join a meeting to collaborate with your team</p>
      </div> */}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-8 rounded-lg shadow-lg transition transform hover:scale-105"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Plus size={32} />
            <Video size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">New Meeting</h2>
          <p className="text-blue-100">Start an instant meeting</p>
        </button>

        <button
          onClick={() => setShowJoinModal(true)}
          className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-8 rounded-lg shadow-lg transition transform hover:scale-105"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <LogIn size={32} />
            <Users size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Join Meeting</h2>
          <p className="text-green-100">Join with a meeting code</p>
        </button>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Video className="text-blue-600" size={24} />
          </div>
          <h3 className="text-lg font-semibold mb-2">HD Video & Audio</h3>
          <p className="text-gray-600 text-sm">
            Crystal clear video calls with high-quality audio
          </p>
        </div> */}

        {/* <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <Users className="text-green-600" size={24} />
          </div>
          <h3 className="text-lg font-semibold mb-2">Screen Sharing</h3>
          <p className="text-gray-600 text-sm">
            Share your screen with participants easily
          </p>
        </div> */}

        {/* <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <Calendar className="text-purple-600" size={24} />
          </div>
          <h3 className="text-lg font-semibold mb-2">Easy Access</h3>
          <p className="text-gray-600 text-sm">
            Join meetings with a simple code or link
          </p>
        </div> */}
      </div>

      {/* Recent Meetings Section - Coming Soon */}
      {/* <div className="mt-8 bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Recent Meetings</h2>
        <div className="text-center text-gray-500 py-8">
          <Calendar size={48} className="mx-auto mb-4 opacity-50" />
          <p>No recent meetings</p>
          <p className="text-sm mt-2">Start a meeting to see your history here</p>
        </div>
      </div> */}

      {/* Modals */}
      <CreateMeetingModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
      <JoinMeetingModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
      />
    </div>
  );
};

export default Dashboard;