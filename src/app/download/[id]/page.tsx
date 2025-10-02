"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, ArrowLeft, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DownloadPageProps {
  params: Promise<{ id: string }>;
}

const DownloadPage: React.FC<DownloadPageProps> = ({ params }) => {
  const router = useRouter();
  const [imageId, setImageId] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setImageId(resolvedParams.id);
      setImageUrl(`${window.location.origin}/api/images/${resolvedParams.id}`);
      setIsLoading(false);
    };
    getParams();
  }, [params]);

  const handleDownload = async () => {
    if (!imageUrl) return;
    
    setIsDownloading(true);
    
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Gagal memuat gambar');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `photobooth-${imageId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      setError('Gagal mendownload foto. Silakan coba lagi.');
    }
    
    setIsDownloading(false);
  };

  const handleGoHome = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button
            onClick={handleGoHome}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-4 bg-white/80 backdrop-blur-sm border-b border-primary-200"
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button
            onClick={handleGoHome}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-800 transition-colors"
          >
            {/* <ArrowLeft className="w-5 h-5" />
            <span>Kembali</span> */}
          </button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-primary-800">
              Download Photobooth
            </h1>
            <p className="text-sm text-primary-600">
              Hasil fotobooth siap didownload
            </p>
          </div>

          <button
            onClick={handleGoHome}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-800 transition-colors"
          >
            {/* <Home className="w-5 h-5" />
            <span>Beranda</span> */}
          </button>
        </div>
      </motion.header>

      <div className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Preview Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 shadow-xl mb-6"
          >
            <h2 className="text-lg font-semibold text-primary-800 mb-4 text-center">
              Hasil Photobooth (2000 × 6000 px)
            </h2>
            
            <div className="border-4 border-primary-200 p-6 rounded-2xl overflow-hidden">
              <img
                src={imageUrl}
                alt="Photobooth Result"
                className="w-full h-auto"
                style={{ maxHeight: '80vh', objectFit: 'contain' }}
              />
            </div>
          </motion.div>

          {/* Download Section */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-primary-800 mb-4 text-center">
              Download Foto
            </h3>
            
            <div className="text-center space-y-4">
              <p className="text-primary-600 mb-6">
                Klik tombol di bawah untuk mendownload hasil fotobooth dalam resolusi tinggi (PNG)
              </p>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDownload}
                disabled={isDownloading}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 text-white font-semibold py-4 px-8 rounded-xl shadow-md transition-all flex items-center justify-center gap-3 mx-auto text-lg"
              >
                {isDownloading ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Memproses Download...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-6 h-6" />
                    <span>Download Foto (PNG)</span>
                  </>
                )}
              </motion.button>

              <div className="text-sm text-primary-500 mt-4">
                <p>• Resolusi: 2000 × 6000 pixel</p>
                <p>• Format: PNG (kualitas tinggi)</p>
                <p>• Kompatibel dengan semua perangkat</p>
              </div>
            </div>
          </motion.div>

          {/* Info Section */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white shadow-lg mt-6"
          >
            <h3 className="text-lg font-semibold mb-3 text-center">
              Informasi
            </h3>
            <div className="text-center text-sm space-y-2">
              <p>Foto ini dihasilkan dari sesi fotobooth Anda</p>
              <p>ID Sesi: {imageId}</p>
              <p>Tanggal: {new Date().toLocaleDateString('id-ID')}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DownloadPage;
