
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
