'use client';

import React, { useState, useEffect } from 'react';
import TrustedUsersManager from './TrustedUsersManager';

// Neutral naming - these represent display configuration options
export interface DisplayConfig {
  // Core display settings
  photoVisibility: boolean;      // Show third-party photos
  searchDetail: boolean;         // Show detailed search results
  reportVisibility: boolean;     // Show community reports
  alertLevel: boolean;           // Full guardian alerts
  flyerDetail: boolean;          // Include photos in emergency flyers
}

// Default configuration for "trusted" mode (all features enabled)
export const DEFAULT_CONFIG: DisplayConfig = {
  photoVisibility: true,
  searchDetail: true,
  reportVisibility: true,
  alertLevel: true,
  flyerDetail: true,
};

// Configuration for "safe" mode (restricted features)
export const SAFE_CONFIG: DisplayConfig = {
  photoVisibility: false,
  searchDetail: false,
  reportVisibility: false,
  alertLevel: false,
  flyerDetail: false,
};

interface ConfigOption {
  key: keyof DisplayConfig;
  label: string;
  description: string;
}

const CONFIG_OPTIONS: ConfigOption[] = [
  {
    key: 'photoVisibility',
    label: 'Visualización de imágenes',
    description: 'Mostrar fotos de perfiles verificados en resultados',
  },
  {
    key: 'searchDetail',
    label: 'Detalle de verificación',
    description: 'Mostrar información detallada en verificaciones',
  },
  {
    key: 'reportVisibility',
    label: 'Reportes de comunidad',
    description: 'Mostrar reportes y calificaciones de la comunidad',
  },
  {
    key: 'alertLevel',
    label: 'Nivel de alertas Guardian',
    description: 'Alertas completas con toda la información',
  },
  {
    key: 'flyerDetail',
    label: 'Detalle en emergencias',
    description: 'Incluir imágenes en flyers de emergencia',
  },
];

type Tab = 'config' | 'users';

interface SafeModeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: DisplayConfig, safeMode: boolean) => Promise<boolean>;
  currentConfig: DisplayConfig;
  isSafeMode: boolean;
}

const SafeModeConfigModal: React.FC<SafeModeConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentConfig,
  isSafeMode,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('config');
  const [config, setConfig] = useState<DisplayConfig>(currentConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingSafeMode, setPendingSafeMode] = useState(isSafeMode);

  useEffect(() => {
    if (isOpen) {
      setConfig(currentConfig);
      setPendingSafeMode(isSafeMode);
      setActiveTab('config');
    }
  }, [isOpen, currentConfig, isSafeMode]);

  const handleToggle = (key: keyof DisplayConfig) => {
    setConfig(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSafeModeToggle = () => {
    const newSafeMode = !pendingSafeMode;
    setPendingSafeMode(newSafeMode);
    // When enabling safe mode, enable all features (trusted view)
    // When disabling safe mode, disable all features (restricted view)
    setConfig(newSafeMode ? DEFAULT_CONFIG : SAFE_CONFIG);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const success = await onSave(config, pendingSafeMode);
    setIsSaving(false);
    if (success) {
      onClose();
    }
  };

  const handleCancel = () => {
    setConfig(currentConfig);
    setPendingSafeMode(isSafeMode);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
      onClick={handleCancel}
    >
      <div
        className="bg-gray-900 rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Tabs */}
        <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white text-lg font-semibold">Panel de Control</h2>
            <button
              onClick={handleCancel}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tab Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('config')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'config'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              Configuración
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              Usuarios Trusted
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'config' ? (
            <div className="p-6">
              {/* Main Safe Mode Toggle */}
              <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Modo Seguro (Trusted)</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {pendingSafeMode ? 'Activo - Vista completa para Trusted' : 'Inactivo - Vista restringida'}
                    </p>
                  </div>
                  <button
                    onClick={handleSafeModeToggle}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                      pendingSafeMode ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                        pendingSafeMode ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Individual Options */}
              <div className="space-y-3">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">Opciones individuales</p>
                {CONFIG_OPTIONS.map((option) => (
                  <div
                    key={option.key}
                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                  >
                    <div className="flex-1 mr-4">
                      <p className="text-white text-sm font-medium">{option.label}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{option.description}</p>
                    </div>
                    <button
                      onClick={() => handleToggle(option.key)}
                      className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${
                        config[option.key] ? 'bg-green-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                          config[option.key] ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              {/* Status Summary */}
              <div className="mt-6 p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                <p className="text-gray-400 text-xs">
                  Estado: {Object.values(config).filter(Boolean).length} de {Object.values(config).length} opciones activas
                </p>
              </div>

              {/* Save Button */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-3 bg-gray-700 text-gray-300 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : 'Aplicar'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <TrustedUsersManager onBack={() => setActiveTab('config')} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SafeModeConfigModal;
