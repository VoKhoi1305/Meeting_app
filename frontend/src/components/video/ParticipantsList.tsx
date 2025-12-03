import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { Users, Mic, MicOff, Video, VideoOff, Monitor } from 'lucide-react';

const ParticipantsList: React.FC = () => {
  const participants = useSelector((state: RootState) => state.participants.list);
  const localParticipant = useSelector(
    (state: RootState) => state.participants.localParticipant
  );

  const allParticipants = localParticipant
    ? [localParticipant, ...participants.filter((p) => p.id !== localParticipant.id)]
    : participants;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-full overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <Users size={20} className="text-gray-600" />
        <h3 className="text-lg font-semibold">
          Participants ({allParticipants.length})
        </h3>
      </div>

      <div className="space-y-2">
        {allParticipants.map((participant) => {
          const isLocal = participant.id === localParticipant?.id;

          return (
            <div
              key={participant.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                  {participant.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {participant.displayName}
                    {isLocal && (
                      <span className="ml-2 text-xs text-gray-500">(You)</span>
                    )}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {participant.connectionStatus === 'connected' ? (
                      <span className="text-xs text-green-600">● Connected</span>
                    ) : participant.connectionStatus === 'connecting' ? (
                      <span className="text-xs text-yellow-600">● Connecting</span>
                    ) : (
                      <span className="text-xs text-red-600">● Disconnected</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {participant.isScreenSharing && (
                  <Monitor size={16} className="text-blue-600" />
                )}
                {participant.isAudioEnabled ? (
                  <Mic size={16} className="text-gray-600" />
                ) : (
                  <MicOff size={16} className="text-red-600" />
                )}
                {participant.isVideoEnabled ? (
                  <Video size={16} className="text-gray-600" />
                ) : (
                  <VideoOff size={16} className="text-red-600" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {allParticipants.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No participants yet
        </div>
      )}
    </div>
  );
};

export default ParticipantsList;