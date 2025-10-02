"use client";
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Download, Printer, QrCode, ArrowLeft, Home } from 'lucide-react';
import { usePhotoStore } from '@/store/usePhotoStore';
import type { PhotoData } from '@/store/usePhotoStore';
import FrameRenderer from '../components/frames/FrameRenderer';
import QRCodeGenerator from '../components/QRCodeGenerator';
// removed unused html2canvas

const FinalResultPage: React.FC = () => {
  const router = useRouter();
  const { photos, selectedFrame, clearPhotos, stopCamera } = usePhotoStore();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Redirect to session if photos are insufficient
  useEffect(() => {
    if (photos.length < 4) {
      router.push('/session');
    }
  }, [photos.length, router]);

  // When QR panel is opened, prepare a shareable image URL
  useEffect(() => {
    const generate = async () => {
      setIsGeneratingQR(true);
      try {
        const imgUrl = await generateDownloadImage();
        if (!imgUrl) return;
        const blob = await fetch(imgUrl).then(r => r.blob());
        URL.revokeObjectURL(imgUrl);
        const id = `img-${Date.now()}`;
        const res = await fetch(`/api/images/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'image/png' },
          body: blob
        });
        if (res.ok) {
          setShareUrl(`${window.location.origin}/download/${id}`);
        }
      } finally {
        setIsGeneratingQR(false);
      }
    };
    if (showQR && !shareUrl && !isGeneratingQR) {
      generate();
    }
  }, [showQR]);

  // Don't render if photos are insufficient
  if (photos.length < 4) {
    return null;
  }

  const generateDownloadImage = async (): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve('');

      // Set high resolution canvas (1x4 vertical strip)
      canvas.width = 2000;
      canvas.height = 6000;

      // Create frame renderer canvas
      const frameCanvas = document.createElement('canvas');
      frameCanvas.width = 2000;
      frameCanvas.height = 6000;
      
      // Render frame to temporary canvas
      const tempRenderer = document.createElement('div');
      document.body.appendChild(tempRenderer);
      tempRenderer.innerHTML = `
        <canvas id="temp-frame-canvas" width="2000" height="6000"></canvas>
      `;
      
      const tempCanvas = document.getElementById('temp-frame-canvas') as HTMLCanvasElement;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        // Clear canvas
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, 2000, 6000);

        // Calculate photo dimensions for 1x4 vertical strip with safe areas
        const photoWidth = 2000 * 0.8; // 80% of width
        const horizontalMargin = (2000 - photoWidth) / 2; // center horizontally

        // Safe areas to prevent overlap with top logos and bottom text
        const safeTop = 6000 * 0.08; // 8% top safe area
        const safeBottom = 6000 * 0.08; // 8% bottom safe area
        const availableHeight = 6000 - safeTop - safeBottom;

        // Balanced vertical gap and dynamic photo height
        const verticalGap = availableHeight * 0.045;
        const photoHeight = (availableHeight - 3 * verticalGap) / 4;

        // Load and draw photos
        const imagePromises = photos.map((photo: PhotoData) => {
          return new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = photo.dataUrl;
          });
        });

        Promise.all(imagePromises).then(async images => {
          // Draw frame background
          drawFrameBackground(tempCtx, selectedFrame, 2000, 6000);

          // Position photos in 1x4 vertical strip starting below top safe area
          const topStart = safeTop;
          const positions = Array.from({ length: 4 }).map((_, i) => ({
            x: horizontalMargin,
            y: topStart + i * (photoHeight + verticalGap)
          }));

          images.forEach((img: HTMLImageElement, index: number) => {
            if (positions[index]) {
              const pos = positions[index];
              tempCtx.save();
              
              // Draw rounded rectangle
              drawRoundedRect(tempCtx, pos.x, pos.y, photoWidth, photoHeight, 20);
              tempCtx.clip();
              
              // Calculate aspect ratio
              const imgAspect = img.width / img.height;
              const targetAspect = photoWidth / photoHeight;
              
              let drawWidth, drawHeight, offsetX, offsetY;
              
              if (imgAspect > targetAspect) {
                drawHeight = photoHeight;
                drawWidth = photoHeight * imgAspect;
                offsetX = (photoWidth - drawWidth) / 2;
                offsetY = 0;
              } else {
                drawWidth = photoWidth;
                drawHeight = photoWidth / imgAspect;
                offsetX = 0;
                offsetY = (photoHeight - drawHeight) / 2;
              }
              
              tempCtx.drawImage(img, pos.x + offsetX, pos.y + offsetY, drawWidth, drawHeight);
              tempCtx.restore();
            }
          });

          // Draw PNG overlay ON TOP so it covers above photos
          try {
            const overlay = await new Promise<HTMLImageElement>((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve(img);
              img.onerror = reject;
              img.src = `/frames/${selectedFrame}.png`;
            });
            tempCtx.drawImage(overlay, 0, 0, 2000, 6000);
          } catch (_) {
            // If overlay missing, you could draw minimal decorations
            // drawFrameDecorations(tempCtx, selectedFrame, 2000, 6000);
          }
          
          // Convert to blob URL
          tempCanvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              resolve(url);
            } else {
              resolve('');
            }
            document.body.removeChild(tempRenderer);
          }, 'image/png');
        });
      }
    });
  };

  // Helper functions (same as FrameRenderer)
  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  const drawFrameBackground = (ctx: CanvasRenderingContext2D, frameType: string, width: number, height: number) => {
    // Same implementation as FrameRenderer
    switch (frameType) {
      case 'classic':
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#71604b';
        ctx.lineWidth = 10;
        ctx.strokeRect(5, 5, width - 10, height - 10);
        break;
      case 'vintage':
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#f5e8c6');
        gradient.addColorStop(1, '#e6d7b3');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        break;
      case 'modern':
        const modernGradient = ctx.createLinearGradient(0, 0, width, height);
        modernGradient.addColorStop(0, '#71604b');
        modernGradient.addColorStop(0.5, '#f5e8c6');
        modernGradient.addColorStop(1, '#71604b');
        ctx.fillStyle = modernGradient;
        ctx.fillRect(0, 0, width, height);
        break;
      case 'elegant':
        ctx.fillStyle = '#2c1810';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#71604b';
        ctx.lineWidth = 15;
        ctx.strokeRect(20, 20, width - 40, height - 40);
        break;
      default:
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
    }
  };

  const drawFrameDecorations = (ctx: CanvasRenderingContext2D, frameType: string, width: number, height: number) => {
    // Same implementation as FrameRenderer
    // const titleY = height * 0.65;
    // const titleHeight = height * 0.15;
    
    // ctx.fillStyle = 'rgba(113, 96, 75, 0.1)';
    // ctx.fillRect(width * 0.1, titleY, width * 0.8, titleHeight);
    
    // ctx.fillStyle = '#71604b';
    // ctx.font = `bold ${width * 0.04}px Arial, sans-serif`;
    // ctx.textAlign = 'center';
    // ctx.fillText('PHOTOBOOTH MEMORIES', width / 2, titleY + titleHeight / 2);
    
    // const currentDate = new Date().toLocaleDateString('id-ID', {
    //   year: 'numeric',
    //   month: 'long',
    //   day: 'numeric'
    // });
    
    // ctx.font = `${width * 0.02}px Arial, sans-serif`;
    // ctx.fillText(currentDate, width / 2, titleY + titleHeight * 0.8);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      const imageUrl = await generateDownloadImage();
      
      if (imageUrl) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `photobooth-${new Date().getTime()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(imageUrl);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Gagal mendownload foto. Silakan coba lagi.');
    }
    
    setIsDownloading(false);
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    
    try {
      const imageUrl = await generateDownloadImage();
      
      if (imageUrl) {
        // Create hidden iframe to ensure reliable print across browsers and printer drivers
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.setAttribute('aria-hidden', 'true');
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) {
          throw new Error('Tidak dapat membuka dokumen untuk print');
        }

        // Target paper size: 2in x 6in (strip). Adjust below if your paper differs.
        const paperWidthIn = 2;  // change to your roll/sheet width in inches
        const paperHeightIn = 6; // change to your roll/sheet height in inches
        doc.open();
        doc.write(`
          <html>
            <head>
              <title>Print Photobooth</title>
              <style>
                @page { size: ${paperWidthIn}in ${paperHeightIn}in; margin: 0; }
                html, body { width: 100%; height: 100%; }
                body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
                .page {
                  width: ${paperWidthIn}in;
                  height: ${paperHeightIn}in;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  page-break-inside: avoid;
                }
                img { width: 100%; height: 100%; object-fit: contain; page-break-inside: avoid; image-rendering: -webkit-optimize-contrast; }
                /* Ensure high resolution printing */
                img { image-rendering: optimizeQuality; }
              </style>
            </head>
            <body>
              <div class="page">
                <img id="print-image" src="${imageUrl}" />
              </div>
              <script>
                const img = document.getElementById('print-image');
                function trigger() {
                  try { window.focus(); } catch (e) {}
                  setTimeout(() => { window.print(); }, 50);
                }
                if (img.complete) { trigger(); } else { img.onload = trigger; }
                window.onafterprint = () => { try { window.close(); } catch (e) {} };
              <\/script>
            </body>
          </html>
        `);
        doc.close();

        // Cleanup after some seconds in case onafterprint doesn't fire
        setTimeout(() => {
          try { document.body.removeChild(iframe); } catch {}
          URL.revokeObjectURL(imageUrl);
        }, 10000);
      }
    } catch (error) {
      console.error('Print error:', error);
      alert('Gagal mencetak foto. Silakan coba lagi.');
    }
    
    setIsPrinting(false);
  };

  const handleFinish = () => {
    clearPhotos();
    stopCamera();
    router.push('/video');
  };

  const generateShareableLink = () => shareUrl ?? '';

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
            onClick={() => router.push('/frames')}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Kembali</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-primary-800">
              Hasil Photobooth
            </h1>
            <p className="text-sm text-primary-600">
              Foto siap untuk didownload dan dibagikan
            </p>
          </div>

          <button
            onClick={handleFinish}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-800 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Selesai</span>
          </button>
        </div>
      </motion.header>

      <div className="flex-1 p-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
          
          {/* Final Result Preview */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              ref={frameRef}
              className="bg-white rounded-2xl p-6 shadow-xl"
            >
              <h2 className="text-lg font-semibold text-primary-800 mb-4 text-center">
                Hasil Final (2000 × 6000 px)
              </h2>
              
              <div className="border-4 border-primary-200 rounded-2xl overflow-hidden">
                <FrameRenderer
                  photos={photos}
                  frameType={selectedFrame}
                  width={400}
                  height={1200}
                  className="w-full"
                />
              </div>
            </motion.div>
          </div>

          {/* Actions Panel */}
          <div className="space-y-6">
            
            {/* Download & Print Actions */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
            >
              <h3 className="text-lg font-semibold text-primary-800 mb-4">
                Download & Print
              </h3>
              
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isDownloading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Download (2000×6000)</span>
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePrint}
                  disabled={isPrinting}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isPrinting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Mencetak...</span>
                    </>
                  ) : (
                    <>
                      <Printer className="w-5 h-5" />
                      <span>Print Foto</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>

            {/* QR Code Section */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary-800">
                  Scan & Download
                </h3>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="p-2 hover:bg-primary-100 rounded-lg transition-colors"
                >
                  <QrCode className="w-5 h-5 text-primary-600" />
                </button>
              </div>

              {showQR ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-3"
                >
                  <QRCodeGenerator
                    value={generateShareableLink()}
                    size={160}
                    className="mx-auto border-2 border-primary-200 rounded-lg p-2"
                  />
                  <p className="text-sm text-primary-600">
                    Scan QR code untuk download ke HP
                  </p>
                </motion.div>
              ) : (
                <div className="text-center">
                  <button
                    onClick={() => setShowQR(true)}
                    className="text-primary-600 hover:text-primary-800 transition-colors"
                  >
                    Tampilkan QR Code
                  </button>
                </div>
              )}
            </motion.div>

            {/* Session Summary */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white shadow-lg"
            >
              <h3 className="text-lg font-semibold mb-3">
                Ringkasan Sesi
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Jumlah Foto:</span>
                  <span className="font-medium">4 foto</span>
                </div>
                <div className="flex justify-between">
                  <span>Frame Dipilih:</span>
                  <span className="font-medium capitalize">{selectedFrame}</span>
                </div>
                <div className="flex justify-between">
                  <span>Resolusi:</span>
                  <span className="font-medium">2000×6000 px</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span className="font-medium">
                    {new Date().toLocaleDateString('id-ID')}
                  </span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFinish}
                className="w-full mt-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-medium py-2 px-4 rounded-lg transition-all"
              >
                Selesai & Kembali ke Awal
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalResultPage;