'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DisplayConfig, DEFAULT_CONFIG } from '../components/SafeModeConfigModal';

interface SafeModeContextType {
  isSafeMode: boolean;
  config: DisplayConfig;
  isLoading: boolean;
  isAuthenticated: boolean;
  verifyPin: (pin: string) => Promise<boolean>;
  saveConfig: (config: DisplayConfig, safeMode: boolean) => Promise<boolean>;
  logout: () => void;
}

const SafeModeContext = createContext<SafeModeContextType | undefined>(undefined);

// SHA-256 hash function
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'snapface_salt_2025');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function SafeModeProvider({ children }: { children: ReactNode }) {
  const [isSafeMode, setIsSafeMode] = useState(false);
  const [config, setConfig] = useState<DisplayConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fetch current mode on mount
  useEffect(() => {
    fetchCurrentMode();
  }, []);

  const fetchCurrentMode = async () => {
    try {
      const response = await fetch('/api/display-mode');
      if (response.ok) {
        const data = await response.json();
        setIsSafeMode(data.safeMode === true);
        if (data.config) {
          setConfig(data.config);
        }
      }
    } catch (error) {
      console.error('Error fetching display mode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPin = async (pin: string): Promise<boolean> => {
    try {
      const hashedPin = await hashPin(pin);

      const response = await fetch('/api/display-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', hash: hashedPin }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.verified) {
          setIsAuthenticated(true);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error verifying pin:', error);
      return false;
    }
  };

  const saveConfig = async (newConfig: DisplayConfig, newSafeMode: boolean): Promise<boolean> => {
    try {
      const response = await fetch('/api/display-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          safeMode: newSafeMode,
          config: newConfig,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Create new object references to force React re-render
          setIsSafeMode(newSafeMode);
          setConfig({ ...newConfig });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error saving config:', error);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <SafeModeContext.Provider value={{
      isSafeMode,
      config,
      isLoading,
      isAuthenticated,
      verifyPin,
      saveConfig,
      logout,
    }}>
      {children}
    </SafeModeContext.Provider>
  );
}

export function useSafeMode() {
  const context = useContext(SafeModeContext);
  if (context === undefined) {
    throw new Error('useSafeMode must be used within a SafeModeProvider');
  }
  return context;
}
