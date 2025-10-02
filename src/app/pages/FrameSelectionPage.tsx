"use client";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { usePhotoStore } from '@/store/usePhotoStore';
import FrameRenderer from '../components/frames/FrameRenderer';

interface FrameItem {
  id: string;
  name: string;
  url: string;
}

const FrameSelectionPage: React.FC = () => {
  const router = useRouter();
  const { photos, selectedFrame, setSelectedFrame } = usePhotoStore();
  const [isLoading, setIsLoading] = useState(false);
  const [frames, setFrames] = useState<FrameItem[]>([]);
  const [loadingFrames, setLoadingFrames] = useState(true);

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

  useEffect(() => {
    let alive = true;
    const fetchFrames = async () => {
      try {
        const res = await fetch('/api/frames', { cache: 'no-store' });
        const data = await res.json();
        if (!alive) return;
        const apiFrames: FrameItem[] = Array.isArray(data.frames) ? data.frames : [];
        setFrames(apiFrames);
        if (apiFrames.length > 0 && !apiFrames.find(f => f.id === selectedFrame)) {
          setSelectedFrame(apiFrames[0].id);
        }
      } catch (e) {
        const fallback: FrameItem[] = [
          { id: 'classic', name: 'Classic', url: '/frames/classic.png' },
          { id: 'elegant', name: 'Elegant', url: '/frames/elegant.png' },
          { id: 'modern', name: 'Modern', url: '/frames/modern.png' },
          { id: 'vintage', name: 'Vintage', url: '/frames/vintage.png' },
        ];
        if (alive) setFrames(fallback);
      } finally {
        if (alive) setLoadingFrames(false);
      }
    };
    fetchFrames();
    return () => { alive = false; };
  }, [selectedFrame, setSelectedFrame]);

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
                    width={500}
                    height={1500}
                    className="w-full max-h-[600px] object-contain"
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
                  {loadingFrames && (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                      <span className="ml-3 text-primary-600">Memuat frame...</span>
                    </div>
                  )}
                  {(!loadingFrames ? frames : []).map((frame, index) => (
                    <motion.div
                      key={frame.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleFrameSelect(frame.id)}
                      className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-6 ${
                        selectedFrame === frame.id
                          ? 'border-primary-600 bg-primary-50 shadow-lg'
                          : 'border-gray-200 hover:border-primary-400 hover:shadow-md'
                      }`}
                    >
                      {/* Thumbnail */}
                      <img
                        src={frame.url}
                        alt={frame.name}
                        className="w-24 h-36 rounded-lg object-contain bg-white flex-shrink-0 shadow-inner"
                      />

                      {/* Label */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-primary-800 mb-1">
                          {frame.name}
                        </h3>
                      </div>

                      {/* Radio Indicator on the right */}
                      <div className="ml-auto">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
                            selectedFrame === frame.id ? 'border-primary-600' : 'border-gray-300'
                          }`}
                          aria-checked={selectedFrame === frame.id}
                          role="radio"
                        >
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              selectedFrame === frame.id ? 'bg-primary-600' : 'bg-transparent'
                            }`}
                          />
                        </span>
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