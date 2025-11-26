import { useSelector } from 'react-redux';
import type{ RootState } from '../store/store';

const Dashboard = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Welcome, {user?.fullName}!</h2>
          <p className="text-gray-600">Email: {user?.email}</p>
          <p className="text-gray-600">Role: {user?.role}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-6 border rounded-lg hover:shadow-md transition">
            <h3 className="text-lg font-semibold mb-2">Create Meeting</h3>
            <p className="text-gray-600 mb-4">Start a new video meeting</p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Start Meeting
            </button>
          </div>

          <div className="p-6 border rounded-lg hover:shadow-md transition">
            <h3 className="text-lg font-semibold mb-2">Join Meeting</h3>
            <p className="text-gray-600 mb-4">Enter a meeting code</p>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Join Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;