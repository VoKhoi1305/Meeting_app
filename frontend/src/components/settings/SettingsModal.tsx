import React, { useRef, useState, useEffect } from 'react';
import { X, Image as ImageIcon, Upload, User, Save, Trash2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onSaveName: (newName: string) => void;
  currentBackground: string | null;
  onBackgroundChange: (image: string | null) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentName,
  onSaveName,
  currentBackground,
  onBackgroundChange,
}) => {
  const [nameInput, setNameInput] = useState(currentName);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) setNameInput(currentName);
  }, [isOpen, currentName]);

  if (!isOpen) return null;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        onBackgroundChange(result);
        localStorage.setItem('meeting_background', result); // store in localStorage
      };
      reader.readAsDataURL(file);
    }
  };

  const clearBackground = () => {
    onBackgroundChange(null);
    localStorage.removeItem('meeting_background');
  };

  const handleSaveNameClick = () => {
    onSaveName(nameInput);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 p-5 bg-gray-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-blue-500" />
            meeting Settings
          </h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-700 text-gray-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-8">
          
          {/* Display Name */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Display Name</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-500" />
                </div>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="Enter your name..."
                />
              </div>
              <button 
                onClick={handleSaveNameClick}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center gap-2"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>

          <div className="h-px bg-gray-800 w-full"></div>

          {/*Meeting Background */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex justify-between">
              <span>Meeting Background</span>
              {currentBackground && (
                <button onClick={clearBackground} className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 transition">
                  <Trash2 size={12} /> Remove background
                </button>
              )}
            </label>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Preview Box */}
              <div 
                className="relative h-32 rounded-xl border-2 border-dashed border-gray-600 bg-gray-800 overflow-hidden group cursor-pointer hover:border-blue-500 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                {currentBackground ? (
                  <>
                    <img src={currentBackground} alt="Preview" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white text-xs font-medium">Change</span>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                    <span className="text-xs">No background image</span>
                  </div>
                )}
              </div>

              {/* Upload Action */}
              <div className="flex flex-col justify-center gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 border border-gray-600 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Upload size={16} /> Upload Image
                </button>
                <p className="text-[10px] text-gray-500 text-center">
                  Supports JPG, PNG. Recommended 1920x1080.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// Helper icon wrapper if needed, or import Settings from lucide-react directly
import { Settings as SettingsIcon } from 'lucide-react';

export default SettingsModal;