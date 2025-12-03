import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import LocalVideo from './LocalVideo';
import RemoteVideo from './RemoteVideo';

const VideoGrid: React.FC = () => {
  const participants = useSelector((state: RootState) => state.participants.list);
  const localParticipant = useSelector(
    (state: RootState) => state.participants.localParticipant
  );

  // Filter out local participant from remote list
  const remoteParticipants = useMemo(() => {
    return participants.filter((p) => p.id !== localParticipant?.id);
  }, [participants, localParticipant]);

  // Calculate grid layout
  const totalVideos = remoteParticipants.length + 1; // +1 for local

  const getGridClass = () => {
    if (totalVideos === 1) return 'grid-cols-1';
    if (totalVideos === 2) return 'grid-cols-2';
    if (totalVideos <= 4) return 'grid-cols-2';
    if (totalVideos <= 6) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  return (
    <div className={`grid ${getGridClass()} gap-4 w-full h-full p-4`}>
      {/* Local video */}
      <div className="aspect-video">
        <LocalVideo />
      </div>

      {/* Remote videos */}
      {remoteParticipants.map((participant) => (
        <div key={participant.id} className="aspect-video">
          <RemoteVideo participant={participant} />
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;