import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import meetingReducer from './slices/meetingSlice';
import participantsReducer from './slices/participantsSlice';
import mediaDevicesReducer from './slices/mediaDevicesSlice';
import subtitleReducer from './slices/subtitleSlice'; 
export const store = configureStore({
  reducer: {
    auth: authReducer,
    meeting: meetingReducer,
    participants: participantsReducer,
    mediaDevices: mediaDevicesReducer,
    subtitles: subtitleReducer, 
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'mediaDevices/setLocalStream',
          'participants/setParticipantStream',
        ],
        ignoredPaths: ['mediaDevices.localStream', 'participants.list'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;