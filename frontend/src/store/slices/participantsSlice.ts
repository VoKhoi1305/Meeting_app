import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Participant, ParticipantsState } from '../../types/participant.types';

const initialState: ParticipantsState = {
  list: [],
  localParticipant: null,
};

const participantsSlice = createSlice({
  name: 'participants',
  initialState,
  reducers: {
    setParticipants: (state, action: PayloadAction<Participant[]>) => {
      state.list = action.payload;
    },
    addParticipant: (state, action: PayloadAction<Participant>) => {
      const exists = state.list.some((p) => p.id === action.payload.id);
      if (!exists) {
        state.list.push(action.payload);
      }
    },
    removeParticipant: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter((p) => p.id !== action.payload);
    },
    updateParticipant: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Participant> }>
    ) => {
      const participant = state.list.find((p) => p.id === action.payload.id);
      if (participant) {
        Object.assign(participant, action.payload.updates);
      }
    },
    setParticipantStream: (
      state,
      action: PayloadAction<{ peerId: string; stream: MediaStream }>
    ) => {
      const participant = state.list.find((p) => p.peerId === action.payload.peerId);
      if (participant) {
        participant.stream = action.payload.stream;
        participant.isVideoEnabled = true;
      } else {
        console.warn(' [Redux] cannot find participant with peerId:', action.payload.peerId);
      }
    },
    setLocalParticipant: (state, action: PayloadAction<Participant>) => {
      state.localParticipant = action.payload;
    },
    updateLocalParticipant: (state, action: PayloadAction<Partial<Participant>>) => {
      if (state.localParticipant) {
        Object.assign(state.localParticipant, action.payload);
      }
    },
    clearParticipants: (state) => {
      state.list = [];
      state.localParticipant = null;
    },
  },
});

export const {
  setParticipants,
  addParticipant,
  removeParticipant,
  updateParticipant,
  setParticipantStream,
  setLocalParticipant,
  updateLocalParticipant,
  clearParticipants,
} = participantsSlice.actions;

export default participantsSlice.reducer;