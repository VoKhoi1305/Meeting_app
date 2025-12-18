import React from 'react';
import { useSelector } from 'react-redux';
import { type RootState } from '../../store/store';

interface Subtitle {
  peerId: string;
  displayName: string;
  text: string;
}

const SubtitleOverlay: React.FC = () => {
  const activeSubtitles = useSelector((state: RootState) => (state as any).subtitles.activeSubtitles);
  const subtitlesList = Object.values(activeSubtitles) as Subtitle[];

  if (subtitlesList.length === 0) return null;

  return (
    <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 w-full max-w-3xl px-6 pointer-events-none">
      {subtitlesList.map((sub) => (
        <div 
          key={sub.peerId} 
          className="bg-black/60 backdrop-blur-md text-white px-5 py-2.5 rounded-2xl self-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500 border border-white/10 shadow-2xl"
        >
          <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold block mb-0.5">
            {sub.displayName}
          </span>
          <p className="text-lg font-medium leading-relaxed drop-shadow-md">
            {sub.text}
          </p>
        </div>
      ))}
    </div>
  );
};

export default SubtitleOverlay