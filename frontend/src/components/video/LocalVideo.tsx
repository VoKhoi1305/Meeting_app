// import React from 'react';
// import { useSelector } from 'react-redux';
// import type { RootState } from '../../store/store';
// import VideoPlayer from './VideoPlayer';

// const LocalVideo: React.FC = () => {
//   const { localStream, isAudioEnabled, isVideoEnabled } = useSelector(
//     (state: RootState) => state.mediaDevices
//   );
//   const localParticipant = useSelector(
//     (state: RootState) => state.participants.localParticipant
//   );

//   if (!localParticipant) return null;

//   return (
//     <VideoPlayer
//       stream={localStream || undefined}
//       displayName={localParticipant.displayName}
//       isAudioEnabled={isAudioEnabled}
//       isVideoEnabled={isVideoEnabled}
//       isMirrored={true}
//       isLocal={true}
//     />
//   );
// };

// export default LocalVideo;

import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import VideoPlayer from './VideoPlayer';

// [MỚI] Thêm interface để nhận prop name
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

  // Nếu chưa có participant (chưa join xong) thì không render
  if (!localParticipant) return null;

  return (
    <VideoPlayer
      stream={localStream || undefined}
      // [QUAN TRỌNG] Ưu tiên lấy 'name' được truyền vào, nếu không có mới lấy từ Redux
      displayName={name || localParticipant.displayName}
      isAudioEnabled={isAudioEnabled}
      isVideoEnabled={isVideoEnabled}
      isMirrored={true}
      isLocal={true}
    />
  );
};

export default LocalVideo;