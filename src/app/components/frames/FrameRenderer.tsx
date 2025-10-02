import { useRef, useEffect } from 'react';
import type { PhotoData } from '@/store/usePhotoStore';

interface FrameRendererProps {
  photos: PhotoData[];
  frameType: string;
  width?: number;
  height?: number;
  className?: string;
}

const FrameRenderer: React.FC<FrameRendererProps> = ({
  photos,
  frameType,
  width = 2000,
  height = 6000,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (photos.length === 4) {
      renderFrame();
    }
  }, [photos, frameType]);

  const renderFrame = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Calculate photo dimensions for 1x4 vertical strip with safe areas
    const photoWidth = width * 0.8; // 80% of frame width per photo (centered)
    const horizontalMargin = (width - photoWidth) / 2; // center horizontally

    // Reserve safe areas so top logos and bottom text are not overlapped by photos
    // ~2cm on a 6000px height ≈ 236px at 300DPI => ~4% of height
    const safeTop = height * 0.04; // top safe area (~2cm)
    const safeBottom = height * 0.06; // a bit larger bottom area for captions/logos
    const availableHeight = height - safeTop - safeBottom;

    // Distribute remaining height into 4 photos and 3 gaps
    const verticalGap = availableHeight * 0.045; // balanced spacing between photos
    const photoHeight = (availableHeight - 3 * verticalGap) / 4;

    // Load and draw photos
    const imagePromises = photos.map(photo => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = photo.dataUrl;
      });
    });

    const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

    try {
      // Load photos and overlay in parallel
      const [images, overlayMaybe] = await Promise.all([
        Promise.all(imagePromises),
        loadImage(`/frames/${frameType}.png`).catch(() => null as unknown as HTMLImageElement)
      ]);

      // Draw frame background based on type
      drawFrameBackground(ctx, frameType, width, height);

      // If overlay exists, draw it as BACKGROUND first (so pattern/background appears behind photos)
      if (overlayMaybe) {
        try {
          ctx.drawImage(overlayMaybe, 0, 0, width, height);
        } catch (_) {
          // ignore and proceed if overlay fails
        }
      }

      // Position photos in 1x4 vertical strip, starting after top safe area
      const topStart = safeTop;
      const positions = Array.from({ length: 4 }).map((_, i) => ({
        x: horizontalMargin,
        y: topStart + i * (photoHeight + verticalGap)
      }));

      images.forEach((img, index) => {
        if (positions[index]) {
          const pos = positions[index];
          
          // Draw photo with rounded corners
          ctx.save();
          drawRoundedRect(ctx, pos.x, pos.y, photoWidth, photoHeight, 20);
          ctx.clip();
          
          // Calculate aspect ratio and draw image
          const imgAspect = img.width / img.height;
          const targetAspect = photoWidth / photoHeight;
          
          let drawWidth, drawHeight, offsetX, offsetY;
          
          if (imgAspect > targetAspect) {
            // Image is wider
            drawHeight = photoHeight;
            drawWidth = photoHeight * imgAspect;
            offsetX = (photoWidth - drawWidth) / 2;
            offsetY = 0;
          } else {
            // Image is taller
            drawWidth = photoWidth;
            drawHeight = photoWidth / imgAspect;
            offsetX = 0;
            offsetY = (photoHeight - drawHeight) / 2;
          }
          
          ctx.drawImage(img, pos.x + offsetX, pos.y + offsetY, drawWidth, drawHeight);
          ctx.restore();
        }
      });

      // After photos, bring only the TOP and BOTTOM slices of overlay to FRONT
      // so logos/captions are above photos while the middle remains visible.
      if (overlayMaybe) {
        try {
          const topSlice = Math.floor(safeTop);
          const bottomSlice = Math.floor(safeBottom);
          if (topSlice > 0) {
            ctx.drawImage(overlayMaybe, 0, 0, width, topSlice, 0, 0, width, topSlice);
          }
          if (bottomSlice > 0) {
            ctx.drawImage(
              overlayMaybe,
              0,
              height - bottomSlice,
              width,
              bottomSlice,
              0,
              height - bottomSlice,
              width,
              bottomSlice
            );
          }
        } catch (_) {
          // ignore and proceed
        }
      } else {
        // If no overlay available, optionally add decorative strokes on top
        drawFrameDecorations(ctx, frameType, width, height);
      }

    } catch (error) {
      console.error('Error rendering frame:', error);
    }
  };

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
    switch (frameType) {
      case 'classic':
        // Classic white frame with border
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#71604b';
        ctx.lineWidth = 10;
        ctx.strokeRect(5, 5, width - 10, height - 10);
        break;
        
      case 'vintage':
        // Vintage sepia frame
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#f5e8c6');
        gradient.addColorStop(1, '#e6d7b3');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        break;
        
      case 'modern':
        // Modern gradient frame
        const modernGradient = ctx.createLinearGradient(0, 0, width, height);
        modernGradient.addColorStop(0, '#71604b');
        modernGradient.addColorStop(0.5, '#f5e8c6');
        modernGradient.addColorStop(1, '#71604b');
        ctx.fillStyle = modernGradient;
        ctx.fillRect(0, 0, width, height);
        break;
        
      case 'elegant':
        // Elegant dark frame
        ctx.fillStyle = '#2c1810';
        ctx.fillRect(0, 0, width, height);
        
        // Add ornate border
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
    // Decorative elements based on frame type (title, date, and title box removed)
    switch (frameType) {
      case 'vintage':
        drawVintageDecorations(ctx, width, height);
        break;
      case 'elegant':
        drawElegantDecorations(ctx, width, height);
        break;
      case 'modern':
        drawModernDecorations(ctx, width, height);
        break;
    }
  };

  const drawVintageDecorations = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Add vintage corner decorations
    const cornerSize = width * 0.05;
    ctx.strokeStyle = '#71604b';
    ctx.lineWidth = 3;
    
    // Top corners
    ctx.beginPath();
    ctx.moveTo(cornerSize, cornerSize * 2);
    ctx.lineTo(cornerSize, cornerSize);
    ctx.lineTo(cornerSize * 2, cornerSize);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(width - cornerSize * 2, cornerSize);
    ctx.lineTo(width - cornerSize, cornerSize);
    ctx.lineTo(width - cornerSize, cornerSize * 2);
    ctx.stroke();
  };

  const drawElegantDecorations = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Add elegant flourishes
    ctx.strokeStyle = '#71604b';
    ctx.lineWidth = 2;
    
    // Decorative lines
    for (let i = 0; i < 3; i++) {
      const y = height * 0.85 + i * 20;
      ctx.beginPath();
      ctx.moveTo(width * 0.3, y);
      ctx.lineTo(width * 0.7, y);
      ctx.stroke();
    }
  };

  const drawModernDecorations = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Add modern geometric elements
    ctx.fillStyle = 'rgba(113, 96, 75, 0.3)';
    
    // Geometric shapes
    ctx.fillRect(width * 0.05, height * 0.9, width * 0.1, height * 0.05);
    ctx.fillRect(width * 0.85, height * 0.9, width * 0.1, height * 0.05);
  };

  return (
    <canvas
      ref={canvasRef}
      className={`${className}`}
      style={{ 
        maxWidth: '100%', 
        height: 'auto',
        aspectRatio: `${width}/${height}`
      }}
    />
  );
};

export default FrameRenderer;