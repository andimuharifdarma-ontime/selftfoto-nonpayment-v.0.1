"use client";
import { motion } from 'framer-motion';
import { Camera, X, RotateCcw } from 'lucide-react';
import { PhotoData } from '@/store/usePhotoStore';

interface PhotoSlotProps {
  photo?: PhotoData;
  index: number;
  onRetake?: (index: number) => void;
  onRemove?: (id: string) => void;
  onPreview?: (photoUrl: string) => void;
  className?: string;
}

const PhotoSlot: React.FC<PhotoSlotProps> = ({ 
  photo, 
  index, 
  onRetake, 
  onRemove,
  onPreview,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className={`relative bg-white rounded-2xl border-4 border-primary-200 overflow-hidden ${className}`}
    >
      {photo ? (
        <>
          <img
            src={photo.dataUrl}
            alt={`Photo ${index + 1}`}
            className="w-full h-full object-cover rounded-lg cursor-pointer"
            onClick={() => onPreview && onPreview(photo.dataUrl)}
          />
          
          {/* Photo overlay with controls */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2"
          >
            {onRetake && (
              <button
                onClick={() => onRetake(index)}
                className="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-full transition-colors"
                title="Foto Ulang"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            )}
            {onRemove && (
              <button
                onClick={() => onRemove(photo.id)}
                className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                title="Hapus Foto"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </motion.div>
          
          {/* Photo number badge */}
          <div className="absolute top-2 left-2 bg-primary-800 text-white text-xs font-bold px-2 py-1 rounded-full">
            {index + 1}
          </div>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
          <div className="text-center text-gray-500">
            <Camera className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm font-medium">Foto {index + 1}</p>
            <p className="text-xs">Kosong</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PhotoSlot;