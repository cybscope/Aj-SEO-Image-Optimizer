import React, { useEffect, useRef } from 'react';

interface AdUnitProps {
  client: string; // Your Publisher ID (e.g., ca-pub-xxxxxxxxxxxxxxxx)
  slot: string;   // The specific Ad Slot ID for this unit
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical';
  style?: React.CSSProperties;
  label?: string; // Just for internal labeling (e.g. "Left Sidebar")
}

export const AdUnit: React.FC<AdUnitProps> = ({ 
  client, 
  slot, 
  format = 'auto', 
  style,
  label 
}) => {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    // If we are in the placeholder state, do not attempt to push ads
    if (!client || client === 'ca-pub-YOUR_ID_HERE' || !slot) {
      return;
    }

    // Wrap in timeout to handle React Strict Mode double-mount in dev
    // and ensure the element is truly in the DOM.
    const timer = setTimeout(() => {
      // Check if component is still mounted and ref exists
      if (adRef.current) {
         try {
           // Check if this specific slot is already filled to be extra safe
           if (adRef.current.getAttribute('data-ad-status') === 'filled') {
             return;
           }

           // @ts-ignore
           const adsbygoogle = (window as any).adsbygoogle || [];
           adsbygoogle.push({});
         } catch (e) {
           console.error("AdSense error:", e);
         }
      }
    }, 100);

    // Cleanup: If the component unmounts before the timeout (e.g. React Strict Mode),
    // cancel the ad push.
    return () => clearTimeout(timer);
  }, [client, slot]);

  // If no client ID is provided yet, show a placeholder
  if (client === 'ca-pub-6989783976135951' || !slot) {
     return (
        <div className="w-full h-full min-h-[600px] bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 p-4 text-center">
           <span className="font-semibold text-gray-500 mb-2">Ad Space ({label})</span>
           <span className="text-xs">Paste your AdSense Client & Slot ID in App.tsx to activate.</span>
        </div>
     );
  }

  return (
    <div className="ad-container overflow-hidden rounded-lg bg-gray-50 min-h-[250px]">
        {/* Google AdSense Unit */}
        <ins ref={adRef}
            className="adsbygoogle"
            style={{ display: 'block', ...style }}
            data-ad-client={client}
            data-ad-slot={slot}
            data-ad-format={format}
            data-full-width-responsive="true"
        />
    </div>
  );
};