import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_STORAGE_SECRET_KEY || 'my-super-secret-key-123!@#';

export const SecureStorage = {
  setItem: (key: string, data: any): void => {
    try {
      const jsonString = JSON.stringify(data);
      const encryptedData = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
      localStorage.setItem(key, encryptedData);
    } catch (error) {
      console.error('Error saving to secure storage', error);
    }
  },

  getItem: <T>(key: string): T | null => {
    try {
      const encryptedData = localStorage.getItem(key);
      if (!encryptedData) return null;

      const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

      if (!decryptedString) return null;

      return JSON.parse(decryptedString) as T;
    } catch (error) {
      console.error('Error reading from secure storage', error);
      return null;
    }
  },

  removeItem: (key: string): void => {
    localStorage.removeItem(key);
  },

  clear: (): void => {
    localStorage.clear();
  }
};
