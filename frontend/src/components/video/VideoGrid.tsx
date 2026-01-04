import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import LocalVideo from './LocalVideo';
import RemoteVideo from './RemoteVideo';

const VideoGrid: React.FC = () => {
  const participants = useSelector((state: RootState) => state.participants.list);
  const { myParticipantId } = useSelector((state: RootState) => state.meeting);
  const { user } = useSelector((state: RootState) => state.auth);

  const localParticipantData = useMemo(() => {
    return participants.find(p => p.id === myParticipantId);
  }, [participants, myParticipantId]);

  const myDisplayName = localParticipantData?.displayName || user?.fullName || 'Me';

  const remoteParticipants = useMemo(() => {
    return participants.filter((p) => p.id !== myParticipantId);
  }, [participants, myParticipantId]);

  const totalVideos = remoteParticipants.length + 1;

  // Layout logic
  const getGridClass = () => {
    if (totalVideos === 1) return 'grid-cols-1 max-w-4xl mx-auto'; 
    if (totalVideos === 2) return 'grid-cols-1 md:grid-cols-2';
    if (totalVideos <= 4) return 'grid-cols-2';
    if (totalVideos <= 6) return 'grid-cols-3';
    return 'grid-cols-3 md:grid-cols-4';
  };

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar p-4 flex items-center justify-center">
      <div className={`grid ${getGridClass()} gap-4 w-full transition-all duration-500 ease-in-out`}>
        {/* Local video wrapper */}
        <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg border border-white/10 bg-gray-800/50 backdrop-blur-sm">
          <LocalVideo name={myDisplayName} />
        </div>

        {/* Remote videos wrapper */}
        {remoteParticipants.map((participant) => (
          <div key={participant.id} className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg border border-white/10 bg-gray-800/50 backdrop-blur-sm">
            <RemoteVideo participant={participant} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;