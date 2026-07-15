import type { iLandingPageEvents } from "../interface";

type EventCallback<T> = (data: T) => void;

export class EventEmitter {
  private listeners: Record<string, EventCallback<any>[]> = {};

  public on<K extends keyof iLandingPageEvents>(event: K, callback: EventCallback<iLandingPageEvents[K]>): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  public emit<K extends keyof iLandingPageEvents>(event: K, data: iLandingPageEvents[K]): void {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach((callback) => {
      try {
        callback(data);
      } catch (err) {
        console.error(`[EventEmitter] Error executing callback for event "${event}":`, err);
      }
    });
  }

  public off<K extends keyof iLandingPageEvents>(event: K, callback: EventCallback<iLandingPageEvents[K]>): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
  }

  public clear(): void {
    this.listeners = {};
  }
}
