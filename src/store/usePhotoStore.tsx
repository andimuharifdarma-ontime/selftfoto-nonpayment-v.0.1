"use client";
import React, { createContext, useContext, useRef, useState, ReactNode } from 'react';

export interface PhotoData {
  id: string;
  dataUrl: string;
  timestamp: number;
}

interface PhotoContextType {
  photos: PhotoData[];
  selectedFrame: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  addPhoto: (dataUrl: string) => void;
  removePhoto: (id: string) => void;
  updatePhoto: (id: string, dataUrl: string) => void;
  setSelectedFrame: (frameId: string) => void;
  clearPhotos: () => void;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  capturePhoto: () => string | null;
}

const PhotoContext = createContext<PhotoContextType | undefined>(undefined);

export const PhotoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<string>('classic');
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const addPhoto = (dataUrl: string) => {
    if (photos.length < 4) {
      const newPhoto: PhotoData = {
        id: `photo-${Date.now()}`,
        dataUrl,
        timestamp: Date.now(),
      };
      setPhotos(prev => [...prev, newPhoto]);
    }
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id));
  };

  const updatePhoto = (id: string, dataUrl: string) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === id 
        ? { ...photo, dataUrl, timestamp: Date.now() }
        : photo
    ));
  };

  const clearPhotos = () => {
    setPhotos([]);
  };

  const startCamera = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung akses kamera. Gunakan browser modern seperti Chrome, Firefox, atau Safari terbaru.');
      }

      // Check if running on HTTPS or localhost
      const isSecureContext = window.isSecureContext || 
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' ||
        window.location.protocol === 'https:';
      
      if (!isSecureContext) {
        throw new Error('Kamera membutuhkan HTTPS atau localhost untuk berfungsi. Pastikan aplikasi berjalan di environment yang aman.');
      }

      // Try with ideal settings first
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
            facingMode: 'user'
          },
          audio: false
        });
      } catch (idealError) {
        console.warn('Failed with ideal constraints, trying basic:', idealError);
        // Fallback to basic constraints
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { min: 640 },
              height: { min: 480 }
            },
            audio: false
          });
        } catch (basicError) {
          console.warn('Failed with basic constraints, trying minimal:', basicError);
          // Final fallback - just video
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        }
      }
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Add error handling for video play
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.warn('Video play failed, but stream is available:', playError);
          // Sometimes play() fails but the video still works
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      
      // Provide specific error messages based on error type
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          throw new Error('Permission kamera ditolak. Klik ikon kamera di address bar browser dan izinkan akses kamera.');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          throw new Error('Kamera tidak ditemukan. Pastikan kamera terpasang dan tidak sedang digunakan aplikasi lain.');
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          throw new Error('Kamera sedang digunakan aplikasi lain. Tutup aplikasi lain yang menggunakan kamera dan coba lagi.');
        } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
          throw new Error('Kamera tidak mendukung pengaturan yang diperlukan. Coba gunakan kamera lain.');
        } else if (error.message.includes('HTTPS') || error.message.includes('localhost')) {
          throw error; // Re-throw HTTPS error as-is
        } else {
          throw new Error(`Camera tidak dapat diakses: ${error.message}. Pastikan browser memiliki permission untuk menggunakan kamera.`);
        }
      } else {
        throw new Error('Camera tidak dapat diakses. Pastikan browser memiliki permission untuk menggunakan kamera.');
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);
    
    // Convert to data URL
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const value: PhotoContextType = {
    photos,
    selectedFrame,
    videoRef,
    canvasRef,
    addPhoto,
    removePhoto,
    updatePhoto,
    setSelectedFrame,
    clearPhotos,
    startCamera,
    stopCamera,
    capturePhoto,
  };

  return (
    <PhotoContext.Provider value={value}>
      {children}
    </PhotoContext.Provider>
  );
};

export const usePhotoStore = () => {
  const context = useContext(PhotoContext);
  if (context === undefined) {
    throw new Error('usePhotoStore must be used within a PhotoProvider');
  }
  return context;
};