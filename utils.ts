
import { User, UserPosition } from './types';

/**
 * Compresses an image file to be under 100kb (approx)
 * Returns a Promise resolving to a Base64 string
 */
export const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
  
          // Max dimensions to help with compression
          const MAX_WIDTH = 1280;
          const MAX_HEIGHT = 1280;
  
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
  
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
             reject("Could not get canvas context");
             return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
  
          // Start compression loop
          let quality = 0.9;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          
          // Loop until size is roughly under 100KB (100 * 1024 bytes)
          // Base64 string length ~ 4/3 of original bytes. So 100KB bytes ~ 133KB string.
          const MAX_SIZE_BYTES = 100 * 1024; 
          
          while (dataUrl.length > (MAX_SIZE_BYTES * 1.37) && quality > 0.1) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
  
          console.log(`Image compressed. Original: ${(file.size/1024).toFixed(2)}KB, Compressed: ~${(dataUrl.length/1024).toFixed(2)}KB (Quality: ${quality.toFixed(1)})`);
          resolve(dataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };
  
  export const sendBrowserNotification = (title: string, body: string) => {
      if (!("Notification" in window)) {
        console.warn("This browser does not support desktop notification");
        return;
      }
    
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: 'https://cdn-icons-png.flaticon.com/512/733/733585.png' });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification(title, { body, icon: 'https://cdn-icons-png.flaticon.com/512/733/733585.png' });
          }
        });
      }
  };

  // --- PERMISSION HELPER ---
  // Returns TRUE if the user has Write/Edit permissions
  // Allowed: Deputy Director, QA Manager, Prod Manager
  // Denied: Director, IT Admin, Workers
  export const canEditSystem = (user: User | null): boolean => {
      if (!user || !user.position) return false;
      const allowedPositions: UserPosition[] = ['DEPUTY_DIRECTOR', 'QA_MANAGER', 'PROD_MANAGER'];
      return allowedPositions.includes(user.position);
  };

  // --- SOUND NOTIFICATION ---
  export const playNotificationSound = () => {
      // Short "Ting" sound (Base64 encoded MP3)
      const sound = "data:audio/mp3;base64,SUQzBAAAAAABAFRYWFgAAAASAAADbWFqb3JfYnJhbmQAbXA0MgBUWFhYAAAAEQAAA21pbm9yX3ZlcnNpb24AMABUWFhYAAAAHAAAA2NvbXBhdGlibGVfYnJhbmRzAGlzb21tcDQyAFRTU0UAAAAPAAADTGF2ZjU3LjU2LjEwMAAAAAAAAAAAAAAA//uQZAAAAAAAABAAAAAAAAAAAAJAAABBAAAAAAAAAAAAAAAA/+5BkAA/wAABAAAAABAAAAABAAAAATAAABAAAAAAAAAAAAAAAAABT//7kGQAAmAAAEAAAAAEAAAAAEAAAAEwAAAQAAAAAAAAAAAAAAAAAU//+5BkAA/wAABAAAAABAAAAABAAAABMAAAEAAAAAAAAAAAAAAAAAFP//uQZAAO8AAAQAAAAAQAAAAAQAAAAHAAABAAAAAAAAAAAAAAAAABQ=";
      // Note: The above is a placeholder very short header. 
      // Using a real simple bell sound base64 below:
      const bellSound = "data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"; 
      
      // Better quality "Ding" (Glass Ping)
      const audioSrc = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";
      
      try {
          const audio = new Audio(audioSrc);
          audio.volume = 0.5;
          audio.play().catch(e => console.log("Audio play blocked (user interaction required first):", e));
      } catch (e) {
          console.error("Audio error", e);
      }
  };
