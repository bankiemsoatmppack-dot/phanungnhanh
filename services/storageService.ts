
import { DriveSlot } from '../types';

// Helper to get configuration
const getActiveSlot = (): DriveSlot | null => {
    const saved = localStorage.getItem('storage_slots');
    if (!saved) return null;
    const slots: DriveSlot[] = JSON.parse(saved);
    return slots.find(s => s.isActive) || null;
};

// Rotate logic (Simulated)
const rotateToNextSlot = () => {
    const saved = localStorage.getItem('storage_slots');
    if (!saved) return;
    let slots: DriveSlot[] = JSON.parse(saved);
    
    const activeIndex = slots.findIndex(s => s.isActive);
    if (activeIndex === -1 || activeIndex === slots.length - 1) {
        console.warn("No more slots available or last slot reached!");
        return;
    }

    // Mark current as full, next as active
    slots[activeIndex].isActive = false;
    slots[activeIndex].status = 'full';
    slots[activeIndex + 1].isActive = true;
    slots[activeIndex + 1].status = 'active';

    localStorage.setItem('storage_slots', JSON.stringify(slots));
    console.log(`Rotated storage from Slot ${slots[activeIndex].id} to Slot ${slots[activeIndex + 1].id}`);
};

export const saveToGoogleSheet = async (data: any) => {
  const activeSlot = getActiveSlot();
  
  if (!activeSlot) {
      console.warn('No active storage configuration found. Saving locally...');
      return new Promise((resolve) => setTimeout(resolve, 500));
  }

  // SIMULATION: Check capacity
  if (activeSlot.capacityUsed >= 98) {
      rotateToNextSlot();
      // Retry with new slot
      return saveToGoogleSheet(data);
  }

  console.log(`Sending data to Google Sheet (ID: ${activeSlot.sheetId}) in Slot: ${activeSlot.name}`, data);
  // Implementation: gapi.client.sheets.spreadsheets.values.append(...)
  return new Promise((resolve) => setTimeout(resolve, 500));
};

export const uploadToGoogleDrive = async (file: File | Blob, filename: string) => {
  const activeSlot = getActiveSlot();

  if (!activeSlot) {
      console.warn('No active storage configuration found. Using default...');
      return new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`Uploading file ${filename} to Google Drive Folder (ID: ${activeSlot.driveFolderId}) in Slot: ${activeSlot.name}`);
  
  // Implementation: gapi.client.drive.files.create(...)
  // On success, return a google drive link
  return new Promise((resolve) => {
      setTimeout(() => {
          resolve(`https://drive.google.com/file/d/mock_id_for_${filename}/view`);
      }, 1000);
  });
};
