import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  read<T>(key: string, fallback: T): T {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) as T : fallback;
    } catch {
      return fallback;
    }
  }

  write<T>(key: string, value: T): void {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage may be disabled. */ }
  }

  remove(key: string): void {
    try { localStorage.removeItem(key); } catch { /* Storage may be disabled. */ }
  }
}
