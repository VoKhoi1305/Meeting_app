import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import VideoPlayer from './VideoPlayer';

const LocalVideo: React.FC = () => {
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
      displayName={localParticipant.displayName}
    //   displayName={localParticipant.displayName ?? ''}
      isAudioEnabled={isAudioEnabled}
      isVideoEnabled={isVideoEnabled}
      isMirrored={true}
      isLocal={true}
    />
  );
};

export default LocalVideo;