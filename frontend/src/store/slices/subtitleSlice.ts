// import { createSlice,type PayloadAction } from '@reduxjs/toolkit';

// interface Subtitle {
//   peerId: string;
//   displayName: string;
//   text: string;
// }

// interface SubtitleState {
//   activeSubtitles: Record<string, Subtitle>;
// }

// const initialState: SubtitleState = {
//   activeSubtitles: {},
// };

// const subtitleSlice = createSlice({
//   name: 'subtitles',
//   initialState,
//   reducers: {
//     updateSubtitle: (state, action: PayloadAction<Subtitle>) => {
//       state.activeSubtitles[action.payload.peerId] = action.payload;
//     },
//     removeSubtitle: (state, action: PayloadAction<string>) => {
//       delete state.activeSubtitles[action.payload];
//     },
//   },
// });

// export const { updateSubtitle, removeSubtitle } = subtitleSlice.actions;
// export default subtitleSlice.reducer;

import { createSlice,type PayloadAction } from '@reduxjs/toolkit';

interface Subtitle {
  peerId: string;
  displayName: string;
  text: string;
  isFinal?: boolean; // Phân biệt kết quả cuối và tạm thời
}

interface SubtitleState {
  activeSubtitles: Record<string, Subtitle>;
}

const initialState: SubtitleState = {
  activeSubtitles: {},
};

const subtitleSlice = createSlice({
  name: 'subtitles',
  initialState,
  reducers: {
    updateSubtitle: (state, action: PayloadAction<Subtitle>) => {
      state.activeSubtitles[action.payload.peerId] = action.payload;
    },
    removeSubtitle: (state, action: PayloadAction<string>) => {
      delete state.activeSubtitles[action.payload];
    },
  },
});

export const { updateSubtitle, removeSubtitle } = subtitleSlice.actions;
export default subtitleSlice.reducer;