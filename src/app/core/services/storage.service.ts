import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() { }

  // Check if localStorage is available
  private isStorageAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  // Set item in localStorage with error handling
  setItem(key: string, value: string): boolean {
    try {
      if (this.isStorageAvailable()) {
        localStorage.setItem(key, value);
        return true;
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
    return false;
  }

  // Get item from localStorage with error handling
  getItem(key: string): string | null {
    try {
      if (this.isStorageAvailable()) {
        return localStorage.getItem(key);
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
    return null;
  }

  // Remove item from localStorage with error handling
  removeItem(key: string): boolean {
    try {
      if (this.isStorageAvailable()) {
        localStorage.removeItem(key);
        return true;
      }
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
    return false;
  }

  // Set object in localStorage
  setObject(key: string, value: any): boolean {
    try {
      const jsonString = JSON.stringify(value);
      return this.setItem(key, jsonString);
    } catch (error) {
      console.error('Error stringifying object for localStorage:', error);
      return false;
    }
  }

  // Get object from localStorage
  getObject<T>(key: string): T | null {
    try {
      const jsonString = this.getItem(key);
      if (jsonString) {
        return JSON.parse(jsonString) as T;
      }
    } catch (error) {
      console.error('Error parsing object from localStorage:', error);
    }
    return null;
  }

  // Clear all items from localStorage
  clear(): boolean {
    try {
      if (this.isStorageAvailable()) {
        localStorage.clear();
        return true;
      }
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
    return false;
  }
}