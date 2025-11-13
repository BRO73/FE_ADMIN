import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
  onRemove: () => void;
  currentNote?: string;
  itemName: string;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onRemove,
  currentNote,
  itemName
}) => {
  const [note, setNote] = useState(currentNote || '');

  useEffect(() => {
    setNote(currentNote || '');
  }, [currentNote, isOpen]);

  const handleSave = () => {
    onSave(note);
  };

  const handleRemove = () => {
    onRemove();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl p-6 max-w-md w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
          onClick={onClose}
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        <div className="pr-8">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Thêm ghi chú</h3>
          <p className="text-sm text-gray-600 mb-4">Món: {itemName}</p>
        </div>

        <textarea
          className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder="Nhập ghi chú cho món ăn (ví dụ: ít cay, không hành...)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="flex gap-3 mt-4">
          {currentNote && (
            <button
              className="flex-1 h-11 rounded-lg border-2 border-red-500 text-red-500 font-medium hover:bg-red-50 transition-colors"
              onClick={handleRemove}
            >
              Xoá ghi chú
            </button>
          )}
          <button
            className="flex-1 h-11 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={!note.trim()}
          >
            {currentNote ? 'Cập nhật' : 'Thêm ghi chú'}
          </button>
        </div>
      </div>
    </div>
  );
};