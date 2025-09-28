"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { usePhotoStore } from '@/store/usePhotoStore';
import FrameRenderer from '../components/frames/FrameRenderer';

interface FrameOption {
  id: string;
  name: string;
  description: string;
  preview: string;
}

const frameOptions: FrameOption[] = [
  {
    id: 'classic',
    name: 'Klasik',
    description: 'Frame putih klasik dengan border elegant',
    preview: 'bg-white border-4 border-primary-600'
  },
  {
    id: 'vintage',
    name: 'Vintage',
    description: 'Frame retro dengan warna sepia hangat',
    preview: 'bg-gradient-to-b from-secondary-200 to-secondary-300 border-2 border-secondary-500'
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Design kontemporer dengan gradient mewah',
    preview: 'bg-gradient-to-br from-primary-600 via-secondary-200 to-primary-600'
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Frame mewah dengan aksen emas',
    preview: 'bg-gray-900 border-4 border-primary-600'
  }
];

const FrameSelectionPage: React.FC = () => {
  const router = useRouter();
  const { photos, selectedFrame, setSelectedFrame } = usePhotoStore();
  const [isLoading, setIsLoading] = useState(false);

  if (photos.length < 4) {
    router.push('/session');
    return null;
  }

  const handleFrameSelect = (frameId: string) => {
    setSelectedFrame(frameId);
  };

  const handleNext = async () => {
    setIsLoading(true);
    // Small delay to show loading state
    setTimeout(() => {
      router.push('/result');
    }, 500);
  };

  const handleBack = () => {
    router.push('/session');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100">
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
              Pilih Frame Favorit
            </h1>
            <p className="text-sm text-primary-600">
              Pilih desain frame untuk 4 foto Anda
            </p>
          </div>

          <div className="w-20" /> {/* Spacer for alignment */}
        </div>
      </motion.header>

      <div className="flex-1 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* Preview Section */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="space-y-4"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-primary-800 mb-4 text-center">
                  Preview Hasil
                </h2>
                
                <div className="border-4 border-primary-200 rounded-2xl overflow-hidden bg-white">
                  <FrameRenderer
                    photos={photos}
                    frameType={selectedFrame}
                    width={400}
                    height={1200}
                    className="w-full"
                  />
                </div>

                <p className="text-sm text-primary-600 text-center mt-4">
                  Ukuran akhir: 2000 × 6000 pixel
                </p>
              </div>
            </motion.div>

            {/* Frame Selection */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="space-y-4"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-primary-800 mb-6 text-center">
                  Pilihan Frame
                </h2>

                <div className="grid gap-4">
                  {frameOptions.map((frame, index) => (
                    <motion.div
                      key={frame.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleFrameSelect(frame.id)}
                      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedFrame === frame.id
                          ? 'border-primary-600 bg-primary-50 shadow-lg'
                          : 'border-gray-200 hover:border-primary-400 hover:shadow-md'
                      }`}
                    >
                      {/* Frame Preview */}
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-24 rounded-lg ${frame.preview} flex-shrink-0 shadow-inner`}>
                          <div className="w-full h-full p-1">
                            <div className="grid grid-cols-2 gap-0.5 h-full">
                              {photos.slice(0, 4).map((photo, i) => (
                                <div key={i} className="bg-gray-300 rounded-sm overflow-hidden">
                                  <img 
                                    src={photo.dataUrl} 
                                    alt={`Preview ${i + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex-1">
                          <h3 className="font-semibold text-primary-800 mb-1">
                            {frame.name}
                          </h3>
                          <p className="text-sm text-primary-600">
                            {frame.description}
                          </p>
                        </div>

                        {/* Selection Indicator */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          selectedFrame === frame.id
                            ? 'bg-primary-600 text-white'
                            : 'border-2 border-gray-300'
                        }`}>
                          {selectedFrame === frame.id && (
                            <Check className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Continue Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNext}
                  disabled={isLoading}
                  className="w-full mt-6 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <span>Lanjutkan ke Hasil</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </div>

              {/* Tips */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-blue-50 border border-blue-200 rounded-xl p-4"
              >
                <h3 className="font-semibold text-blue-800 mb-2">💡 Tips:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Frame Klasik cocok untuk foto formal</li>
                  <li>• Frame Vintage memberikan kesan retro</li>
                  <li>• Frame Modern untuk tampilan kontemporer</li>
                  <li>• Frame Elegant untuk acara mewah</li>
                </ul>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrameSelectionPage;