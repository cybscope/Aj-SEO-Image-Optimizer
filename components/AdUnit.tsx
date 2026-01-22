import React, { useEffect, useRef, useState } from 'react';

interface AdUnitProps {
  client: string; // Your Publisher ID
  slot: string;   // The specific Ad Slot ID
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal' | 'autorelaxed';
  style?: React.CSSProperties;
  label?: string; 
  className?: string;
}

export const AdUnit: React.FC<AdUnitProps> = ({ 
  client, 
  slot, 
  format = 'auto', 
  style,
  label,
  className = ''
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const adRequested = useRef(false);
  const [shouldLoadAd, setShouldLoadAd] = useState(false);

  useEffect(() => {
    // Placeholder check
    if (client === 'ca-pub-YOUR_ID_HERE' || !client || !slot) return;

    // ResizeObserver watches for visibility changes (e.g. sidebar showing up)
    const observer = new ResizeObserver((entries) => {
      // Wrap in requestAnimationFrame to prevent "ResizeObserver loop completed with undelivered notifications"
      // This error occurs when a resize event triggers a state update that immediately causes another layout change.
      window.requestAnimationFrame(() => {
        const entry = entries[0];
        if (entry) {
            // Check if element has actual dimensions (is visible)
            // Using Math.floor to handle sub-pixel values where 0.something might technically be > 0 but effectively hidden
            const width = Math.floor(entry.contentRect.width);
            const height = Math.floor(entry.contentRect.height);

            if (width > 0 && height > 0 && !shouldLoadAd) {
                setShouldLoadAd(true);
            }
        }
      });
    });

    if (containerRef.current) {
        observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, [client, slot, shouldLoadAd]);

  useEffect(() => {
      // Only request the ad when the container is confirmed visible (shouldLoadAd is true)
      // This prevents "No slot size for availableWidth=0" error.
      if (shouldLoadAd && !adRequested.current) {
          try {
             // Double check ref existence
             if (adRef.current) {
                 // Check if slot is already filled to prevent "All 'ins' elements... already have ads" error
                 const isFilled = adRef.current.innerHTML.trim() !== '' || 
                                  adRef.current.getAttribute('data-ad-status') === 'filled';

                 if (!isFilled) {
                    // @ts-ignore
                    const adsbygoogle = (window as any).adsbygoogle || [];
                    adsbygoogle.push({});
                    adRequested.current = true;
                 }
             }
          } catch (e) {
            console.error("AdSense error:", e);
          }
      }
  }, [shouldLoadAd]);

  // Placeholder UI for development or missing config
  if (client === 'ca-pub-YOUR_ID_HERE' || !slot || !client) {
     return (
        <div className={`w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 p-4 text-center min-h-[150px] ${className}`}>
           <span className="font-semibold text-gray-500 text-xs uppercase mb-1">Ad Space</span>
           <span className="text-[10px]">{label || 'Responsive'}</span>
        </div>
     );
  }

  return (
    <div 
        ref={containerRef}
        className={`ad-wrapper flex flex-col items-center justify-center my-4 ${className}`}
    >
        {label && <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 text-center w-full border-b border-gray-100 pb-1">Sponsored</div>}
        {/* Added h-full and flex-1 to ensure it fills the wrapper */}
        <div className="w-full h-full flex-1 overflow-hidden bg-white/50 rounded-lg min-h-[100px] flex justify-center">
            {/* 
              CRITICAL FIX: We conditionally apply the 'adsbygoogle' class.
              If the component is hidden (e.g., mobile sidebar), 'shouldLoadAd' is false,
              so the class is missing. This prevents the global adsbygoogle script from 
              detecting and trying to render into a 0-width container.
            */}
            <ins ref={adRef}
                className={shouldLoadAd ? "adsbygoogle" : ""}
                style={{ display: 'block', width: '100%', ...style }}
                data-ad-client={client}
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive="true"
            />
        </div>
    </div>
  );
};