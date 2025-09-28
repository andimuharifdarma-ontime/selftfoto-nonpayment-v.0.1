"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Camera, ArrowRight, Shield } from 'lucide-react';
import CameraPreview from '../components/CameraPreview';
import CameraPermissionButton from '../components/CameraPermissionButton';

const VideoStartPage: React.FC = () => {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [showPermissionHelper, setShowPermissionHelper] = useState(false);

  const handleStartSession = () => {
    router.push('/session');
  };

  const handlePermissionGranted = () => {
    setIsReady(true);
    setShowPermissionHelper(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-6 text-center"
      >
        <h1 className="text-4xl md:text-6xl font-bold text-primary-800 mb-2">
          Self Photobooth
        </h1>
        <p className="text-lg text-primary-600">
          Ambil 4 foto terbaik Anda dengan mudah
        </p>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 items-center">
          
          {/* Video Preview */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <CameraPreview 
              className="aspect-[4/3] w-full"
              autoStart={true}
            />
          </motion.div>

          {/* Action Panel */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center space-y-6"
          >
            <div className="space-y-4">
              <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
                <Camera className="w-16 h-16 text-primary-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-primary-800 mb-2">
                  Siap Memulai?
                </h2>
                <p className="text-primary-600 mb-4">
                  Pastikan kamera sudah aktif dan posisi Anda terlihat jelas di preview
                </p>
                
                <div className="space-y-2 text-sm text-primary-700">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Kamera aktif</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Pencahayaan cukup</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Posisi terpusat</span>
                  </div>
                </div>
                
                {/* Permission Helper Button */}
                {!isReady && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-800 mb-2">
                      <Shield className="w-4 h-4" />
                      <span className="text-sm font-medium">Butuh akses kamera?</span>
                    </div>
                    <CameraPermissionButton 
                      onPermissionGranted={handlePermissionGranted}
                      className="text-sm py-2"
                    />
                  </div>
                )}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartSession}
              className="group w-full max-w-sm mx-auto bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-4 px-8 rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-center gap-3"
            >
              <span className="text-lg">Foto Sekarang</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Footer Instructions */}
      <motion.footer
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="p-6 bg-white/60 backdrop-blur-sm border-t border-primary-200"
      >
        <div className="max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold text-primary-800 mb-2 text-center">
            Cara Penggunaan:
          </h3>
          <div className="grid md:grid-cols-4 gap-4 text-center">
            <div className="space-y-2">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto font-bold">1</div>
              <p className="text-sm text-primary-700">Pastikan kamera aktif</p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto font-bold">2</div>
              <p className="text-sm text-primary-700">Ambil 4 foto berbeda</p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto font-bold">3</div>
              <p className="text-sm text-primary-700">Pilih frame favorit</p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto font-bold">4</div>
              <p className="text-sm text-primary-700">Download hasil</p>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
};

export default VideoStartPage;