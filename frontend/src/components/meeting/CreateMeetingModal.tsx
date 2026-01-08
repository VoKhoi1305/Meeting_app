
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { AppDispatch } from '../../store/store';
import { createMeeting } from '../../store/slices/meetingSlice';
import { X } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a meeting title');
      return;
    }

    setLoading(true);

    try {
      console.log('📝 Creating meeting:', { title, description });
      
      const result = await dispatch(
        createMeeting({ 
          title: title.trim(), 
          description: description.trim() 
        })
      ).unwrap();
      
      console.log('✅ Meeting created:', result);
      
      onClose();
      
      // Small delay to ensure backend processes are complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navigate to join preview page first to set up media permissions
      navigate(`/meeting/${result.roomId}/join`);
      
    } catch (error: any) {
      console.error('❌ Error creating meeting:', error);
      toast.error(error || 'Failed to create meeting');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Create Meeting</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <Input
            label="Meeting Title"
            placeholder="Enter meeting title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter meeting description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" loading={loading} className="flex-1">
              Create Meeting
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMeetingModal;