import React from 'react';
import VideoPlayer from './VideoPlayer';
import type { Participant } from '../../types/participant.types';

interface RemoteVideoProps {
  participant: Participant;
}

const RemoteVideo: React.FC<RemoteVideoProps> = ({ participant }) => {
  return (
    <VideoPlayer
      stream={participant.stream}
      displayName={participant.displayName}
      isAudioEnabled={participant.isAudioEnabled}
      isVideoEnabled={participant.isVideoEnabled}
    />
  );
};

export default RemoteVideo;