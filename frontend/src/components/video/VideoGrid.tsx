// import React, { useMemo } from 'react';
// import { useSelector } from 'react-redux';
// import type { RootState } from '../../store/store';
// import LocalVideo from './LocalVideo';
// import RemoteVideo from './RemoteVideo';

// const VideoGrid: React.FC = () => {
//   const participants = useSelector((state: RootState) => state.participants.list);
//   const localParticipant = useSelector(
//     (state: RootState) => state.participants.localParticipant
//   );

//   // Filter out local participant from remote list
//   const remoteParticipants = useMemo(() => {
//     return participants.filter((p) => p.id !== localParticipant?.id);
//   }, [participants, localParticipant]);

//   // Calculate grid layout
//   const totalVideos = remoteParticipants.length + 1; // +1 for local

//   const getGridClass = () => {
//     if (totalVideos === 1) return 'grid-cols-1';
//     if (totalVideos === 2) return 'grid-cols-2';
//     if (totalVideos <= 4) return 'grid-cols-2';
//     if (totalVideos <= 6) return 'grid-cols-3';
//     return 'grid-cols-4';
//   };

//   return (
//     <div className={`grid ${getGridClass()} gap-4 w-full h-full p-4`}>
//       {/* Local video */}
//       <div className="aspect-video">
//         <LocalVideo />
//       </div>

//       {/* Remote videos */}
//       {remoteParticipants.map((participant) => (
//         <div key={participant.id} className="aspect-video">
//           <RemoteVideo participant={participant} />
//         </div>
//       ))}
//     </div>
//   );
// };

// export default VideoGrid;

import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import LocalVideo from './LocalVideo';
import RemoteVideo from './RemoteVideo';

const VideoGrid: React.FC = () => {
  // 1. Lấy danh sách participant và ID của mình
  const participants = useSelector((state: RootState) => state.participants.list);
  const { myParticipantId } = useSelector((state: RootState) => state.meeting);
  
  // 2. Lấy thông tin User gốc (để làm fallback nếu chưa load được participant)
  const { user } = useSelector((state: RootState) => state.auth);

  // 3. Tìm object participant của chính mình trong danh sách (Object này mới chứa displayName cập nhật)
  const localParticipantData = useMemo(() => {
    return participants.find(p => p.id === myParticipantId);
  }, [participants, myParticipantId]);

  // 4. Xác định tên hiển thị: Ưu tiên tên đã đổi > Tên đăng nhập > 'Me'
  const myDisplayName = localParticipantData?.displayName || user?.fullName || 'Me';

  // Filter out local participant from remote list
  const remoteParticipants = useMemo(() => {
    return participants.filter((p) => p.id !== myParticipantId);
  }, [participants, myParticipantId]);

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
        {/* 5. Truyền tên đã tính toán vào LocalVideo */}
        <LocalVideo name={myDisplayName} />
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