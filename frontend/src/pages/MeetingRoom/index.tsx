// import React, { useEffect, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { useDispatch, useSelector } from 'react-redux';
// import type { RootState, AppDispatch } from '../../store/store';
// import { getMeetingByRoomId, joinMeeting, setIsHost } from '../../store/slices/meetingSlice';
// import { useMediaStream } from '../../hooks/useMediaStream';
// import { useMeeting } from '../../hooks/useMeeting';
// import { useWebRTC } from '../../hooks/useWebRTC';
// import websocketService from '../../services/websocket.service';
// import VideoGrid from '../../components/video/VideoGrid';
// import MeetingControls from '../../components/video/MeetingControls';
// import ParticipantsList from '../../components/video/ParticipantsList';
// import Loading from '../../components/common/Loading';
// import { Copy, Users } from 'lucide-react';
// import toast from 'react-hot-toast';

// const MeetingRoom: React.FC = () => {
//   const { roomId } = useParams<{ roomId: string }>();
//   const navigate = useNavigate();
//   const dispatch = useDispatch<AppDispatch>();
  
//   const { user } = useSelector((state: RootState) => state.auth);
//   const { current: meeting, myParticipantId, loading } = useSelector(
//     (state: RootState) => state.meeting
//   );
//   const { localStream } = useSelector((state: RootState) => state.mediaDevices);

//   const [showParticipants, setShowParticipants] = useState(false);
//   const [isJoining, setIsJoining] = useState(false);

//   const { startLocalStream, stopLocalStream } = useMediaStream();

//   // Initialize WebSocket connections
//   const meetingsSocket = websocketService.connectMeetings();
//   const webrtcSocket = websocketService.connectWebRTC();

//   // Use custom hooks
//   const { joinRoom, leaveRoom } = useMeeting(meeting?.roomId || null, myParticipantId);
//   useWebRTC(webrtcSocket, meeting?.roomId || null, localStream);

//   // Load meeting data
//   useEffect(() => {
//     if (roomId) {
//       dispatch(getMeetingByRoomId(roomId));
//     }
//   }, [roomId, dispatch]);

//   // Check if user is host
//   useEffect(() => {
//     if (meeting && user) {
//       dispatch(setIsHost(meeting.hostId === user.id));
//     }
//   }, [meeting, user, dispatch]);

//   // Join meeting
//   useEffect(() => {
//     const join = async () => {
//       if (meeting && user && !myParticipantId && !isJoining) {
//         setIsJoining(true);
//         try {
//           // Start local stream first
//           await startLocalStream();

//           // Join meeting
//           await dispatch(
//             joinMeeting({
//               meetingId: meeting.id,
//               displayName: user.fullName,
//             })
//           ).unwrap();

//           // Small delay to ensure participant is created
//           setTimeout(() => {
//             joinRoom();
//           }, 500);
//         } catch (error) {
//           console.error('Error joining meeting:', error);
//           toast.error('Failed to join meeting');
//           navigate('/dashboard');
//         } finally {
//           setIsJoining(false);
//         }
//       }
//     };

//     join();
//   }, [meeting, user, myParticipantId, isJoining, dispatch, startLocalStream, joinRoom, navigate]);

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       leaveRoom();
//       stopLocalStream();
//       websocketService.disconnectAll();
//     };
//   }, [leaveRoom, stopLocalStream]);

//   // Copy meeting code
//   const handleCopyCode = () => {
//     if (meeting) {
//       navigator.clipboard.writeText(meeting.roomCode);
//       toast.success('Meeting code copied!');
//     }
//   };

//   // Copy meeting link
//   const handleCopyLink = () => {
//     const link = `${window.location.origin}/meeting/${roomId}`;
//     navigator.clipboard.writeText(link);
//     toast.success('Meeting link copied!');
//   };

//   if (loading || !meeting) {
//     return <Loading />;
//   }

//   return (
//     <div className="h-screen bg-gray-900 flex flex-col">
//       {/* Header */}
//       <div className="bg-gray-800 border-b border-gray-700 p-4">
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-xl font-bold text-white">{meeting.title}</h1>
//             <div className="flex items-center gap-4 mt-1">
//               <button
//                 onClick={handleCopyCode}
//                 className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition"
//               >
//                 <Copy size={16} />
//                 Code: {meeting.roomCode}
//               </button>
//               <button
//                 onClick={handleCopyLink}
//                 className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition"
//               >
//                 <Copy size={16} />
//                 Copy Link
//               </button>
//             </div>
//           </div>

//           <button
//             onClick={() => setShowParticipants(!showParticipants)}
//             className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition"
//           >
//             <Users size={20} />
//             <span>Participants</span>
//           </button>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="flex-1 flex overflow-hidden">
//         {/* Video Grid */}
//         <div className="flex-1 overflow-hidden">
//           <VideoGrid />
//         </div>

//         {/* Participants Sidebar */}
//         {showParticipants && (
//           <div className="w-80 bg-white border-l border-gray-200 overflow-hidden">
//             <ParticipantsList />
//           </div>
//         )}
//       </div>

//       {/* Controls */}
//       <MeetingControls />
//     </div>
//   );
// };

// export default MeetingRoom;

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store/store';
import { 
  getMeetingByRoomId, 
  joinMeeting, 
  setIsHost,
} from '../../store/slices/meetingSlice';
import { useMediaStream } from '../../hooks/useMediaStream';
import { useMeeting } from '../../hooks/useMeeting';
import { useWebRTC } from '../../hooks/useWebRTC';
import websocketService from '../../services/websocket.service';
import VideoGrid from '../../components/video/VideoGrid';
import MeetingControls from '../../components/video/MeetingControls';
import ParticipantsList from '../../components/video/ParticipantsList';
import Loading from '../../components/common/Loading';
import { Copy, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const MeetingRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { current: meeting, myParticipantId, loading } = useSelector(
    (state: RootState) => state.meeting
  );
  const { localStream } = useSelector((state: RootState) => state.mediaDevices);

  const [showParticipants, setShowParticipants] = useState(false);
  const hasJoinedRef = useRef(false);
  const isInitializingRef = useRef(false);

  const { startLocalStream, stopLocalStream } = useMediaStream();

  // Check if coming from preview page
  const fromPreview = location.state?.fromPreview || false;
  
  // Initialize WebSocket connections ONCE
  const meetingsSocketRef = useRef<any>(null);
  const webrtcSocketRef = useRef<any>(null);

  useEffect(() => {
    if (!meetingsSocketRef.current) {
      meetingsSocketRef.current = websocketService.connectMeetings();
    }
    if (!webrtcSocketRef.current) {
      webrtcSocketRef.current = websocketService.connectWebRTC();
    }
  }, []);

  // Use custom hooks
  const { joinRoom, leaveRoom } = useMeeting(
    meeting?.roomId || null, 
    myParticipantId
  );
  
  useWebRTC(
    webrtcSocketRef.current, 
    meeting?.roomId || null, 
    localStream
  );

  // Load meeting data
  useEffect(() => {
    if (roomId && !meeting) {
      console.log('📥 Loading meeting:', roomId);
      dispatch(getMeetingByRoomId(roomId)).catch((error) => {
        console.error('Failed to load meeting:', error);
        toast.error('Meeting not found');
        navigate('/dashboard');
      });
    }
  }, [roomId, meeting, dispatch, navigate]);

  // Check if user is host
  useEffect(() => {
    if (meeting && user) {
      const isHost = meeting.hostId === user.id;
      dispatch(setIsHost(isHost));
      console.log('👑 Is host:', isHost);
    }
  }, [meeting, user, dispatch]);

  // Join meeting flow - WITH PROPER SEQUENCING
  useEffect(() => {
    const initializeMeeting = async () => {
      // Guard conditions
      if (!meeting || !user || !roomId) {
        console.log('⏳ Waiting for meeting/user data...');
        return;
      }

      if (hasJoinedRef.current) {
        console.log('✅ Already joined');
        return;
      }

      if (isInitializingRef.current) {
        console.log('⏳ Already initializing...');
        return;
      }

      console.log('🚀 Starting meeting initialization...');
      console.log('From preview:', fromPreview);
      console.log('Local stream exists:', !!localStream);
      
      isInitializingRef.current = true;

      try {
        // Step 1: Start local media stream (skip if coming from preview)
        if (!localStream) {
          console.log('📹 Step 1: Starting local stream...');
          await startLocalStream();
          console.log('✅ Local stream started');
          
          // Wait a bit for stream to be ready
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          console.log('✅ Using existing stream from preview');
        }

        // Step 2: Join meeting (create participant record)
        console.log('👤 Step 2: Joining meeting...');
        const result = await dispatch(
          joinMeeting({
            meetingId: meeting.id,
            displayName: user.fullName,
          })
        ).unwrap();
        
        console.log('✅ Joined meeting, participant:', result.participant);

        // Step 3: Wait for backend to persist
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Step 4: Join WebSocket room
        console.log('🔌 Step 3: Joining WebSocket room...');
        joinRoom();
        hasJoinedRef.current = true;
        
       // console.log('✅ All steps completed!');
     //   toast.success('Joined meeting successfully!');

      } catch (error: any) {
        console.error('❌ Error in meeting initialization:', error);
        toast.error(error.message || 'Failed to join meeting');
        
        // Cleanup and redirect
        stopLocalStream();
        navigate('/dashboard');
      } finally {
        isInitializingRef.current = false;
      }
    };

    initializeMeeting();
  }, [
    meeting, 
    user, 
    roomId,
    localStream,
    fromPreview,
    dispatch, 
    startLocalStream, 
    stopLocalStream,
    joinRoom, 
    navigate
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up meeting room...');
      leaveRoom();
      stopLocalStream();
      
      hasJoinedRef.current = false;
      isInitializingRef.current = false;
    };
  }, [leaveRoom, stopLocalStream]);

  // Copy meeting code
  const handleCopyCode = () => {
    if (meeting) {
      navigator.clipboard.writeText(meeting.roomCode);
      toast.success('Meeting code copied!');
    }
  };

  // Copy meeting link
  const handleCopyLink = () => {
    const link = `${window.location.origin}/meeting/${roomId}`;
    navigator.clipboard.writeText(link);
    toast.success('Meeting link copied!');
  };

  if (loading || !meeting) {
    return <Loading />;
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{meeting.title}</h1>
            <div className="flex items-center gap-4 mt-1">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition"
              >
                <Copy size={16} />
                Code: {meeting.roomCode}
              </button>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition"
              >
                <Copy size={16} />
                Copy Link
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition"
          >
            <Users size={20} />
            <span>Participants</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 overflow-hidden">
          {localStream ? (
            <VideoGrid />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Initializing...</p>
              </div>
            </div>
          )}
        </div>

        {/* Participants Sidebar */}
        {showParticipants && (
          <div className="w-80 bg-white border-l border-gray-200 overflow-hidden">
            <ParticipantsList />
          </div>
        )}
      </div>

      {/* Controls */}
      <MeetingControls />
    </div>
  );
};

export default MeetingRoom;