'use client';

import { DisplayConfig, DEFAULT_CONFIG } from '../components/SafeModeConfigModal';

// Simple pub/sub store for config
type Listener = (config: DisplayConfig) => void;

interface GlobalConfigStore {
  config: DisplayConfig;
  listeners: Set<Listener>;
  getConfig: () => DisplayConfig;
  setConfig: (newConfig: DisplayConfig) => void;
  subscribe: (listener: Listener) => () => void;
}

// Use window global to ensure single instance across all modules
declare global {
  interface Window {
    __CONFIG_STORE__?: GlobalConfigStore;
  }
}

function createConfigStore(): GlobalConfigStore {
  const store: GlobalConfigStore = {
    config: DEFAULT_CONFIG,
    listeners: new Set(),

    getConfig() {
      return this.config;
    },

    setConfig(newConfig: DisplayConfig) {
      this.config = { ...newConfig };
      // Notify all listeners immediately and synchronously
      this.listeners.forEach(listener => {
        listener(this.config);
      });
    },

    subscribe(listener: Listener) {
      this.listeners.add(listener);
      return () => {
        this.listeners.delete(listener);
      };
    }
  };

  return store;
}

// Get or create the global store - always call this function, don't cache
export function getConfigStore(): GlobalConfigStore {
  if (typeof window === 'undefined') {
    // Server-side: return a dummy store
    return createConfigStore();
  }

  if (!window.__CONFIG_STORE__) {
    window.__CONFIG_STORE__ = createConfigStore();
  }

  return window.__CONFIG_STORE__;
}
