import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { meetingService } from '../../services/meeting.service';
import { X } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';

interface JoinMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const JoinMeetingModal: React.FC<JoinMeetingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const meeting = await meetingService.getMeetingByRoomCode(roomCode);
      navigate(`/meeting/${meeting.roomId}`);
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Meeting not found');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Join Meeting</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <Input
            label="Meeting Code"
            placeholder="Enter 6-digit code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            maxLength={6}
            required
          />

          <div className="flex gap-3">
            <Button type="submit" loading={loading} className="flex-1">
              Join Meeting
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinMeetingModal;