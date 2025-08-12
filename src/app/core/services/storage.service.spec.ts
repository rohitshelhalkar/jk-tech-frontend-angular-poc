import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StorageService]
    });

    service = TestBed.inject(StorageService);

    // Mock localStorage
    mockLocalStorage = {};
    spyOn(localStorage, 'getItem').and.callFake((key: string): string | null => {
      return mockLocalStorage[key] || null;
    });
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string): void => {
      mockLocalStorage[key] = value;
    });
    spyOn(localStorage, 'removeItem').and.callFake((key: string): void => {
      delete mockLocalStorage[key];
    });
    spyOn(localStorage, 'clear').and.callFake((): void => {
      mockLocalStorage = {};
    });
  });

  afterEach(() => {
    mockLocalStorage = {};
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isStorageAvailable', () => {
    it('should return true when localStorage is available', () => {
      const result = (service as any).isStorageAvailable();
      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith('__localStorage_test__', '__localStorage_test__');
      expect(localStorage.removeItem).toHaveBeenCalledWith('__localStorage_test__');
    });

    it('should return false when localStorage throws an error', () => {
      // Make localStorage.setItem throw an error
      (localStorage.setItem as jasmine.Spy).and.throwError('localStorage not available');
      
      const result = (service as any).isStorageAvailable();
      expect(result).toBe(false);
    });
  });

  describe('setItem', () => {
    it('should set item in localStorage successfully', () => {
      const result = service.setItem('testKey', 'testValue');
      
      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith('testKey', 'testValue');
      expect(mockLocalStorage['testKey']).toBe('testValue');
    });

    it('should return false when localStorage is not available', () => {
      spyOn(service as any, 'isStorageAvailable').and.returnValue(false);
      
      const result = service.setItem('testKey', 'testValue');
      
      expect(result).toBe(false);
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle and log errors when setting item', () => {
      spyOn(console, 'error');
      (localStorage.setItem as jasmine.Spy).and.throwError('Storage quota exceeded');
      
      const result = service.setItem('testKey', 'testValue');
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error saving to localStorage:', jasmine.any(Error));
    });

    it('should handle empty strings and special characters', () => {
      const testCases = [
        { key: 'emptyString', value: '' },
        { key: 'specialChars', value: 'Hello 世界! @#$%^&*()' },
        { key: 'jsonLike', value: '{"test": "value"}' },
        { key: 'unicode', value: '🚀 🎉 💖' }
      ];

      testCases.forEach(testCase => {
        const result = service.setItem(testCase.key, testCase.value);
        expect(result).toBe(true);
        expect(mockLocalStorage[testCase.key]).toBe(testCase.value);
      });
    });
  });

  describe('getItem', () => {
    it('should get item from localStorage successfully', () => {
      mockLocalStorage['testKey'] = 'testValue';
      
      const result = service.getItem('testKey');
      
      expect(result).toBe('testValue');
      expect(localStorage.getItem).toHaveBeenCalledWith('testKey');
    });

    it('should return null for non-existent keys', () => {
      const result = service.getItem('nonExistentKey');
      
      expect(result).toBeNull();
      expect(localStorage.getItem).toHaveBeenCalledWith('nonExistentKey');
    });

    it('should return null when localStorage is not available', () => {
      spyOn(service as any, 'isStorageAvailable').and.returnValue(false);
      
      const result = service.getItem('testKey');
      
      expect(result).toBeNull();
      expect(localStorage.getItem).not.toHaveBeenCalled();
    });

    it('should handle and log errors when getting item', () => {
      spyOn(console, 'error');
      (localStorage.getItem as jasmine.Spy).and.throwError('Access denied');
      
      const result = service.getItem('testKey');
      
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error reading from localStorage:', jasmine.any(Error));
    });

    it('should handle special values correctly', () => {
      const testCases = [
        { key: 'emptyString', value: '', expected: '' },
        { key: 'nullString', value: 'null', expected: 'null' },
        { key: 'undefinedString', value: 'undefined', expected: 'undefined' },
        { key: 'zeroString', value: '0', expected: '0' }
      ];

      testCases.forEach(testCase => {
        mockLocalStorage[testCase.key] = testCase.value;
        const result = service.getItem(testCase.key);
        expect(result).toBe(testCase.expected);
      });
    });
  });

  describe('removeItem', () => {
    it('should remove item from localStorage successfully', () => {
      mockLocalStorage['testKey'] = 'testValue';
      
      const result = service.removeItem('testKey');
      
      expect(result).toBe(true);
      expect(localStorage.removeItem).toHaveBeenCalledWith('testKey');
      expect(mockLocalStorage['testKey']).toBeUndefined();
    });

    it('should return false when localStorage is not available', () => {
      spyOn(service as any, 'isStorageAvailable').and.returnValue(false);
      
      const result = service.removeItem('testKey');
      
      expect(result).toBe(false);
      expect(localStorage.removeItem).not.toHaveBeenCalled();
    });

    it('should handle and log errors when removing item', () => {
      spyOn(console, 'error');
      (localStorage.removeItem as jasmine.Spy).and.throwError('Access denied');
      
      const result = service.removeItem('testKey');
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error removing from localStorage:', jasmine.any(Error));
    });

    it('should handle removing non-existent keys gracefully', () => {
      const result = service.removeItem('nonExistentKey');
      
      expect(result).toBe(true);
      expect(localStorage.removeItem).toHaveBeenCalledWith('nonExistentKey');
    });
  });

  describe('setObject', () => {
    it('should set object in localStorage successfully', () => {
      const testObject = { name: 'John', age: 30, active: true };
      
      const result = service.setObject('testObject', testObject);
      
      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith('testObject', JSON.stringify(testObject));
      expect(mockLocalStorage['testObject']).toBe(JSON.stringify(testObject));
    });

    it('should handle complex nested objects', () => {
      const complexObject = {
        user: {
          id: '123',
          profile: {
            name: 'John Doe',
            preferences: {
              theme: 'dark',
              notifications: true
            }
          }
        },
        metadata: {
          lastLogin: new Date('2024-01-01T00:00:00Z'),
          roles: ['admin', 'editor']
        }
      };
      
      const result = service.setObject('complexObject', complexObject);
      
      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith('complexObject', JSON.stringify(complexObject));
    });

    it('should handle arrays', () => {
      const testArray = [1, 'two', { three: 3 }, [4, 5]];
      
      const result = service.setObject('testArray', testArray);
      
      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith('testArray', JSON.stringify(testArray));
    });

    it('should handle primitive values', () => {
      const testCases = [
        { key: 'number', value: 42 },
        { key: 'string', value: 'hello' },
        { key: 'boolean', value: true },
        { key: 'null', value: null }
      ];

      testCases.forEach(testCase => {
        const result = service.setObject(testCase.key, testCase.value);
        expect(result).toBe(true);
        expect(localStorage.setItem).toHaveBeenCalledWith(testCase.key, JSON.stringify(testCase.value));
      });
    });

    it('should return false when JSON.stringify fails', () => {
      spyOn(console, 'error');
      // Create circular reference that will cause JSON.stringify to fail
      const circularObject: any = { name: 'circular' };
      circularObject.self = circularObject;
      
      const result = service.setObject('circularObject', circularObject);
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error stringifying object for localStorage:', jasmine.any(Error));
    });

    it('should return false when setItem fails', () => {
      spyOn(service, 'setItem').and.returnValue(false);
      
      const result = service.setObject('testObject', { test: 'value' });
      
      expect(result).toBe(false);
    });
  });

  describe('getObject', () => {
    it('should get object from localStorage successfully', () => {
      const testObject = { name: 'John', age: 30, active: true };
      mockLocalStorage['testObject'] = JSON.stringify(testObject);
      
      const result = service.getObject<typeof testObject>('testObject');
      
      expect(result).toEqual(testObject);
      expect(localStorage.getItem).toHaveBeenCalledWith('testObject');
    });

    it('should return null for non-existent keys', () => {
      const result = service.getObject('nonExistentKey');
      
      expect(result).toBeNull();
    });

    it('should return null when getItem returns null', () => {
      spyOn(service, 'getItem').and.returnValue(null);
      
      const result = service.getObject('testKey');
      
      expect(result).toBeNull();
    });

    it('should handle and log errors when JSON.parse fails', () => {
      spyOn(console, 'error');
      mockLocalStorage['invalidJson'] = 'invalid json string {';
      
      const result = service.getObject('invalidJson');
      
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error parsing object from localStorage:', jasmine.any(Error));
    });

    it('should handle complex nested objects correctly', () => {
      const complexObject = {
        user: {
          id: '123',
          profile: {
            name: 'John Doe',
            preferences: {
              theme: 'dark',
              notifications: true
            }
          }
        },
        metadata: {
          lastLogin: '2024-01-01T00:00:00Z', // Note: Date becomes string after JSON.stringify
          roles: ['admin', 'editor']
        }
      };
      
      mockLocalStorage['complexObject'] = JSON.stringify(complexObject);
      
      const result = service.getObject('complexObject');
      
      expect(result).toEqual(complexObject);
    });

    it('should handle arrays correctly', () => {
      const testArray = [1, 'two', { three: 3 }, [4, 5]];
      mockLocalStorage['testArray'] = JSON.stringify(testArray);
      
      const result = service.getObject('testArray');
      
      expect(result).toEqual(testArray);
    });

    it('should handle primitive values correctly', () => {
      const testCases = [
        { key: 'number', value: 42 },
        { key: 'string', value: 'hello' },
        { key: 'boolean', value: true },
        { key: 'null', value: null }
      ];

      testCases.forEach(testCase => {
        mockLocalStorage[testCase.key] = JSON.stringify(testCase.value);
        const result = service.getObject(testCase.key);
        expect(result).toEqual(testCase.value);
      });
    });

    it('should maintain type safety with generics', () => {
      interface TestInterface {
        id: string;
        name: string;
        count: number;
      }
      
      const testObject: TestInterface = { id: '1', name: 'Test', count: 5 };
      mockLocalStorage['typedObject'] = JSON.stringify(testObject);
      
      const result = service.getObject<TestInterface>('typedObject');
      
      expect(result).toEqual(testObject);
      // TypeScript should ensure result is of type TestInterface | null
      if (result) {
        expect(typeof result.id).toBe('string');
        expect(typeof result.name).toBe('string');
        expect(typeof result.count).toBe('number');
      }
    });
  });

  describe('clear', () => {
    it('should clear all localStorage successfully', () => {
      mockLocalStorage['key1'] = 'value1';
      mockLocalStorage['key2'] = 'value2';
      
      const result = service.clear();
      
      expect(result).toBe(true);
      expect(localStorage.clear).toHaveBeenCalled();
      expect(Object.keys(mockLocalStorage).length).toBe(0);
    });

    it('should return false when localStorage is not available', () => {
      spyOn(service as any, 'isStorageAvailable').and.returnValue(false);
      
      const result = service.clear();
      
      expect(result).toBe(false);
      expect(localStorage.clear).not.toHaveBeenCalled();
    });

    it('should handle and log errors when clearing localStorage', () => {
      spyOn(console, 'error');
      (localStorage.clear as jasmine.Spy).and.throwError('Access denied');
      
      const result = service.clear();
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error clearing localStorage:', jasmine.any(Error));
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete workflow: set, get, remove', () => {
      const testObject = { id: '1', name: 'Test User', preferences: { theme: 'dark' } };
      
      // Set object
      const setResult = service.setObject('user', testObject);
      expect(setResult).toBe(true);
      
      // Get object
      const getResult = service.getObject('user');
      expect(getResult).toEqual(testObject);
      
      // Remove object
      const removeResult = service.removeItem('user');
      expect(removeResult).toBe(true);
      
      // Verify removal
      const getAfterRemove = service.getObject('user');
      expect(getAfterRemove).toBeNull();
    });

    it('should handle multiple items simultaneously', () => {
      const items = {
        token: 'jwt-token-value',
        user: { id: '1', name: 'John' },
        settings: { theme: 'dark', language: 'en' },
        lastLogin: new Date().toISOString()
      };
      
      // Set all items
      Object.entries(items).forEach(([key, value]) => {
        if (typeof value === 'object') {
          expect(service.setObject(key, value)).toBe(true);
        } else {
          expect(service.setItem(key, value)).toBe(true);
        }
      });
      
      // Verify all items
      expect(service.getItem('token')).toBe(items.token);
      expect(service.getObject('user')).toEqual(items.user);
      expect(service.getObject('settings')).toEqual(items.settings);
      expect(service.getItem('lastLogin')).toBe(items.lastLogin);
      
      // Clear all
      expect(service.clear()).toBe(true);
      
      // Verify all cleared
      expect(service.getItem('token')).toBeNull();
      expect(service.getObject('user')).toBeNull();
      expect(service.getObject('settings')).toBeNull();
      expect(service.getItem('lastLogin')).toBeNull();
    });

    it('should handle edge cases with empty and whitespace keys', () => {
      const testCases = [
        { key: '', value: 'empty-key' },
        { key: ' ', value: 'space-key' },
        { key: '\t', value: 'tab-key' },
        { key: '\n', value: 'newline-key' }
      ];
      
      testCases.forEach(testCase => {
        const setResult = service.setItem(testCase.key, testCase.value);
        expect(setResult).toBe(true);
        
        const getResult = service.getItem(testCase.key);
        expect(getResult).toBe(testCase.value);
      });
    });

    it('should handle large data scenarios', () => {
      // Create a relatively large object
      const largeObject = {
        data: Array(1000).fill(0).map((_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `This is a description for item number ${i} with some additional text to make it longer.`,
          metadata: {
            created: new Date().toISOString(),
            tags: [`tag${i}`, `category${i % 10}`, 'general']
          }
        }))
      };
      
      const setResult = service.setObject('largeData', largeObject);
      expect(setResult).toBe(true);
      
      const getResult = service.getObject<typeof largeObject>('largeData');
      expect(getResult).toEqual(largeObject);
      expect(getResult?.data?.length).toBe(1000);
    });
  });
});