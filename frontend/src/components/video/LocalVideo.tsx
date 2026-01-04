import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import VideoPlayer from './VideoPlayer';

interface LocalVideoProps {
  name?: string;
}

const LocalVideo: React.FC<LocalVideoProps> = ({ name }) => {
  const { localStream, isAudioEnabled, isVideoEnabled } = useSelector(
    (state: RootState) => state.mediaDevices
  );
  
  const localParticipant = useSelector(
    (state: RootState) => state.participants.localParticipant
  );

  if (!localParticipant) return null;

  return (
    <VideoPlayer
      stream={localStream || undefined}
      displayName={name || localParticipant.displayName}
      isAudioEnabled={isAudioEnabled}
      isVideoEnabled={isVideoEnabled}
      isMirrored={true}
      isLocal={true}
    />
  );
};

export default LocalVideo;