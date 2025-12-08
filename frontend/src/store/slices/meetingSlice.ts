

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { meetingService } from '../../services/meeting.service';
import type { Meeting, CreateMeetingDto, MeetingState } from '../../types/meeting.types';
import toast from 'react-hot-toast';

const initialState: MeetingState = {
  current: null,
  myParticipantId: null,
  isHost: false,
  loading: false,
  error: null,
};

export const createMeeting = createAsyncThunk(
  'meeting/create',
  async (data: CreateMeetingDto, { rejectWithValue }) => {
    try {
      const meeting = await meetingService.createMeeting(data);
      return meeting;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create meeting');
    }
  }
);

export const getMeetingByRoomId = createAsyncThunk(
  'meeting/getByRoomId',
  async (roomId: string, { rejectWithValue }) => {
    try {
      const meeting = await meetingService.getMeetingByRoomId(roomId);
      return meeting;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Meeting not found');
    }
  }
);

export const joinMeeting = createAsyncThunk(
  'meeting/join',
  async (
    { meetingId, displayName }: { meetingId: string; displayName: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await meetingService.joinMeeting(meetingId, { displayName });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to join meeting');
    }
  }
);

export const endMeeting = createAsyncThunk(
  'meeting/end',
  async (meetingId: string, { rejectWithValue }) => {
    try {
      await meetingService.endMeeting(meetingId);
      return meetingId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to end meeting');
    }
  }
);

const meetingSlice = createSlice({
  name: 'meeting',
  initialState,
  reducers: {
    setCurrentMeeting: (state, action: PayloadAction<Meeting>) => {
      state.current = action.payload;
    },
    setMyParticipantId: (state, action: PayloadAction<string>) => {
      console.log('📝 Setting participant ID:', action.payload);
      state.myParticipantId = action.payload;
    },
    setIsHost: (state, action: PayloadAction<boolean>) => {
      state.isHost = action.payload;
    },
    clearMeeting: (state) => {
      state.current = null;
      state.myParticipantId = null;
      state.isHost = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Create meeting
    builder.addCase(createMeeting.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createMeeting.fulfilled, (state, action) => {
      state.loading = false;
      state.current = action.payload;
      state.isHost = true;
      toast.success('Meeting created successfully!');
    });
    builder.addCase(createMeeting.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      toast.error(action.payload as string);
    });

    // Get meeting by room ID
    builder.addCase(getMeetingByRoomId.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getMeetingByRoomId.fulfilled, (state, action) => {
      state.loading = false;
      state.current = action.payload;
    });
    builder.addCase(getMeetingByRoomId.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      toast.error(action.payload as string);
    });

    // Join meeting
    builder.addCase(joinMeeting.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(joinMeeting.fulfilled, (state, action) => {
      state.loading = false;
      state.current = action.payload.meeting;
      state.myParticipantId = action.payload.participant.id;
      console.log('✅ Join meeting fulfilled, participant ID:', action.payload.participant.id);
    });
    builder.addCase(joinMeeting.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      toast.error(action.payload as string);
    });

    // End meeting
    builder.addCase(endMeeting.fulfilled, (state) => {
      if (state.current) {
        state.current.status = 'ended';
      }
      toast.success('Meeting ended');
    });
  },
});

export const { setCurrentMeeting, setMyParticipantId, setIsHost, clearMeeting } =
  meetingSlice.actions;
export default meetingSlice.reducer;