"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Camera, ArrowRight, ArrowLeft, CheckCircle, X } from 'lucide-react';
import { usePhotoStore } from '@/store/usePhotoStore';
import CameraPreview from '../components/CameraPreview';
import PhotoSlot from '../components/PhotoSlot';

const PhotoSessionPage: React.FC = () => {
  const router = useRouter();
  const { 
    photos, 
    canvasRef, 
    capturePhoto, 
    addPhoto, 
    updatePhoto, 
    removePhoto
  } = usePhotoStore();
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [retakeIndex, setRetakeIndex] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Camera is started by the `CameraPreview` component via its `autoStart` prop

  const handleCapture = async () => {
    if (isCapturing || countdown !== null) return;
    setCountdown(5);

    let current = 5;
    const timer = setInterval(() => {
      current -= 1;
      if (current > 0) {
        setCountdown(current);
      } else {
        clearInterval(timer);
        setCountdown(null);

        setIsCapturing(true);
        
        // Add capture animation delay
        setTimeout(() => {
          const photoDataUrl = capturePhoto();
          
          if (photoDataUrl) {
            if (retakeIndex !== null) {
              // Update existing photo
              const existingPhoto = photos[retakeIndex];
              if (existingPhoto) {
                updatePhoto(existingPhoto.id, photoDataUrl);
              }
              setRetakeIndex(null);
            } else {
              // Add new photo
              addPhoto(photoDataUrl);
            }
          }
          
          setIsCapturing(false);
        }, 200);
      }
    }, 1000);
  };

  const handleRetake = (index: number) => {
    setRetakeIndex(index);
  };

  const handleNext = () => {
    if (photos.length === 4) {
      router.push('/frames');
    }
  };

  const handleBack = () => {
    router.push('/video');
  };

  const handlePreviewPhoto = (photoUrl: string) => {
    setPreviewPhoto(photoUrl);
  };

  const handleReturnToLivePreview = () => {
    setPreviewPhoto(null);
  };

  const isComplete = photos.length === 4;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-4 bg-white/80 backdrop-blur-sm border-b border-primary-200"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Kembali</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-primary-800">
              Sesi Pemotretan
            </h1>
            <p className="text-sm text-primary-600">
              {photos.length}/4 foto telah diambil
              {retakeIndex !== null && ' (Mode Foto Ulang)'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {photos.length > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-sm text-primary-600 flex items-center gap-1"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{photos.length}/4</span>
              </motion.div>
            )}
          </div>
        </div>
      </motion.header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Live Camera View - Full width on mobile, left side on desktop */}
        <div className="lg:flex-1 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative h-[50vh] lg:h-full"
          >
            {previewPhoto ? (
              <div className="relative w-full h-full">
                <img
                  src={previewPhoto}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-2xl"
                />
                <motion.button
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={handleReturnToLivePreview}
                  className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full shadow-lg hover:bg-black/75 transition-all"
                  aria-label="Kembali ke live view"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>
            ) : (
              <CameraPreview 
                className="w-full h-full"
                autoStart={true}
              />
            )}
            
            {/* Capture Flash Effect */}
            {isCapturing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-white rounded-2xl"
              />
            )}

            {/* Countdown Overlay */}
            {countdown !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl"
              >
                <span className="text-white text-7xl font-extrabold drop-shadow-lg">{countdown}</span>
              </motion.div>
            )}

            {/* Retake Mode Indicator */}
            {retakeIndex !== null && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-4 left-4 right-4 bg-amber-500 text-white px-4 py-2 rounded-lg text-center font-medium"
              >
                Mode Foto Ulang - Foto #{retakeIndex + 1}
              </motion.div>
            )}

            {/* Capture Button */}
            <motion.div
              className="absolute bottom-6 left-1/2 transform -translate-x-1/2"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <button
                onClick={handleCapture}
                disabled={isCapturing || countdown !== null || (photos.length >= 4 && retakeIndex === null)}
                className="w-20 h-20 bg-white border-4 border-primary-600 rounded-full flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-50 transition-all"
              >
                {isCapturing ? (
                  <div className="w-8 h-8 bg-primary-600 rounded-full animate-pulse" />
                ) : countdown !== null ? (
                  <span className="text-xl font-bold text-primary-600">{countdown}</span>
                ) : (
                  <Camera className="w-8 h-8 text-primary-600" />
                )}
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Photo Slots Panel */}
        <div className="lg:w-96 p-4 bg-white/60 backdrop-blur-sm border-t lg:border-t-0 lg:border-l border-primary-200">
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-primary-800 mb-2">
                Hasil Foto
              </h2>
              <div className="w-full bg-primary-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(photos.length / 4) * 100}%` }}
                  className="bg-primary-600 h-2 rounded-full transition-all"
                />
              </div>
            </div>

            {/* Photo Grid */}
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <PhotoSlot
                  key={index}
                  photo={photos[index]}
                  index={index}
                  onRetake={handleRetake}
                  onRemove={removePhoto}
                  onPreview={() => {
                    if (photos[index]) {
                      handlePreviewPhoto(photos[index].dataUrl);
                    }
                  }}
                  className="aspect-square"
                />
              ))}
            </div>

            {/* Progress and Actions */}
            <div className="space-y-3">
              {photos.length > 0 && (
                <div className="text-sm text-primary-600 text-center">
                  {photos.length < 4 ? (
                    `Ambil ${4 - photos.length} foto lagi`
                  ) : (
                    'Semua foto telah diambil!'
                  )}
                </div>
              )}

              {retakeIndex !== null && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setRetakeIndex(null)}
                  className="w-full py-2 px-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                >
                  Batal Foto Ulang
                </motion.button>
              )}

              {isComplete && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNext}
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <span>Selanjutnya</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default PhotoSessionPage;