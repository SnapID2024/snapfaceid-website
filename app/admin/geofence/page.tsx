'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const LOGO_URL = 'https://d64gsuwffb70l.cloudfront.net/6834a8f25630f332851529fb_1765418801539_cd77434c.png';

// Dynamic import for the map component (client-side only)
const GeofenceMap = dynamic(() => import('./GeofenceMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-xl">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span className="text-gray-500 text-sm">Loading map...</span>
      </div>
    </div>
  ),
});

// Types
interface StateRegion {
  code: string;
  name: string;
  enabled: boolean;
}

interface Country {
  code: string;
  name: string;
  flag: string;
  states: StateRegion[];
}

// Countries and States Data
const COUNTRIES_DATA: Country[] = [
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    states: [
      { code: 'AL', name: 'Alabama', enabled: false },
      { code: 'AK', name: 'Alaska', enabled: false },
      { code: 'AZ', name: 'Arizona', enabled: false },
      { code: 'AR', name: 'Arkansas', enabled: false },
      { code: 'CA', name: 'California', enabled: true },
      { code: 'CO', name: 'Colorado', enabled: false },
      { code: 'CT', name: 'Connecticut', enabled: false },
      { code: 'DE', name: 'Delaware', enabled: false },
      { code: 'FL', name: 'Florida', enabled: true },
      { code: 'GA', name: 'Georgia', enabled: false },
      { code: 'HI', name: 'Hawaii', enabled: false },
      { code: 'ID', name: 'Idaho', enabled: false },
      { code: 'IL', name: 'Illinois', enabled: true },
      { code: 'IN', name: 'Indiana', enabled: false },
      { code: 'IA', name: 'Iowa', enabled: false },
      { code: 'KS', name: 'Kansas', enabled: false },
      { code: 'KY', name: 'Kentucky', enabled: false },
      { code: 'LA', name: 'Louisiana', enabled: false },
      { code: 'ME', name: 'Maine', enabled: false },
      { code: 'MD', name: 'Maryland', enabled: false },
      { code: 'MA', name: 'Massachusetts', enabled: false },
      { code: 'MI', name: 'Michigan', enabled: false },
      { code: 'MN', name: 'Minnesota', enabled: false },
      { code: 'MS', name: 'Mississippi', enabled: false },
      { code: 'MO', name: 'Missouri', enabled: false },
      { code: 'MT', name: 'Montana', enabled: false },
      { code: 'NE', name: 'Nebraska', enabled: false },
      { code: 'NV', name: 'Nevada', enabled: true },
      { code: 'NH', name: 'New Hampshire', enabled: false },
      { code: 'NJ', name: 'New Jersey', enabled: false },
      { code: 'NM', name: 'New Mexico', enabled: false },
      { code: 'NY', name: 'New York', enabled: true },
      { code: 'NC', name: 'North Carolina', enabled: false },
      { code: 'ND', name: 'North Dakota', enabled: false },
      { code: 'OH', name: 'Ohio', enabled: false },
      { code: 'OK', name: 'Oklahoma', enabled: false },
      { code: 'OR', name: 'Oregon', enabled: false },
      { code: 'PA', name: 'Pennsylvania', enabled: false },
      { code: 'RI', name: 'Rhode Island', enabled: false },
      { code: 'SC', name: 'South Carolina', enabled: false },
      { code: 'SD', name: 'South Dakota', enabled: false },
      { code: 'TN', name: 'Tennessee', enabled: false },
      { code: 'TX', name: 'Texas', enabled: true },
      { code: 'UT', name: 'Utah', enabled: false },
      { code: 'VT', name: 'Vermont', enabled: false },
      { code: 'VA', name: 'Virginia', enabled: false },
      { code: 'WA', name: 'Washington', enabled: false },
      { code: 'WV', name: 'West Virginia', enabled: false },
      { code: 'WI', name: 'Wisconsin', enabled: false },
      { code: 'WY', name: 'Wyoming', enabled: false },
      { code: 'DC', name: 'Washington D.C.', enabled: false },
      { code: 'PR', name: 'Puerto Rico', enabled: false },
    ],
  },
  {
    code: 'MX',
    name: 'Mexico',
    flag: '🇲🇽',
    states: [
      { code: 'AGU', name: 'Aguascalientes', enabled: false },
      { code: 'BCN', name: 'Baja California', enabled: false },
      { code: 'BCS', name: 'Baja California Sur', enabled: false },
      { code: 'CAM', name: 'Campeche', enabled: false },
      { code: 'CHP', name: 'Chiapas', enabled: false },
      { code: 'CHH', name: 'Chihuahua', enabled: false },
      { code: 'COA', name: 'Coahuila', enabled: false },
      { code: 'COL', name: 'Colima', enabled: false },
      { code: 'CMX', name: 'Ciudad de México', enabled: false },
      { code: 'DUR', name: 'Durango', enabled: false },
      { code: 'GUA', name: 'Guanajuato', enabled: false },
      { code: 'GRO', name: 'Guerrero', enabled: false },
      { code: 'HID', name: 'Hidalgo', enabled: false },
      { code: 'JAL', name: 'Jalisco', enabled: false },
      { code: 'MEX', name: 'Estado de México', enabled: false },
      { code: 'MIC', name: 'Michoacán', enabled: false },
      { code: 'MOR', name: 'Morelos', enabled: false },
      { code: 'NAY', name: 'Nayarit', enabled: false },
      { code: 'NLE', name: 'Nuevo León', enabled: false },
      { code: 'OAX', name: 'Oaxaca', enabled: false },
      { code: 'PUE', name: 'Puebla', enabled: false },
      { code: 'QUE', name: 'Querétaro', enabled: false },
      { code: 'ROO', name: 'Quintana Roo', enabled: false },
      { code: 'SLP', name: 'San Luis Potosí', enabled: false },
      { code: 'SIN', name: 'Sinaloa', enabled: false },
      { code: 'SON', name: 'Sonora', enabled: false },
      { code: 'TAB', name: 'Tabasco', enabled: false },
      { code: 'TAM', name: 'Tamaulipas', enabled: false },
      { code: 'TLA', name: 'Tlaxcala', enabled: false },
      { code: 'VER', name: 'Veracruz', enabled: false },
      { code: 'YUC', name: 'Yucatán', enabled: false },
      { code: 'ZAC', name: 'Zacatecas', enabled: false },
    ],
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    states: [
      { code: 'AB', name: 'Alberta', enabled: false },
      { code: 'BC', name: 'British Columbia', enabled: false },
      { code: 'MB', name: 'Manitoba', enabled: false },
      { code: 'NB', name: 'New Brunswick', enabled: false },
      { code: 'NL', name: 'Newfoundland and Labrador', enabled: false },
      { code: 'NS', name: 'Nova Scotia', enabled: false },
      { code: 'ON', name: 'Ontario', enabled: false },
      { code: 'PE', name: 'Prince Edward Island', enabled: false },
      { code: 'QC', name: 'Quebec', enabled: false },
      { code: 'SK', name: 'Saskatchewan', enabled: false },
      { code: 'NT', name: 'Northwest Territories', enabled: false },
      { code: 'NU', name: 'Nunavut', enabled: false },
      { code: 'YT', name: 'Yukon', enabled: false },
    ],
  },
  {
    code: 'AR',
    name: 'Argentina',
    flag: '🇦🇷',
    states: [
      { code: 'BA', name: 'Buenos Aires', enabled: false },
      { code: 'CABA', name: 'Ciudad Autónoma de Buenos Aires', enabled: false },
      { code: 'CT', name: 'Catamarca', enabled: false },
      { code: 'CC', name: 'Chaco', enabled: false },
      { code: 'CH', name: 'Chubut', enabled: false },
      { code: 'CB', name: 'Córdoba', enabled: false },
      { code: 'CR', name: 'Corrientes', enabled: false },
      { code: 'ER', name: 'Entre Ríos', enabled: false },
      { code: 'FO', name: 'Formosa', enabled: false },
      { code: 'JY', name: 'Jujuy', enabled: false },
      { code: 'LP', name: 'La Pampa', enabled: false },
      { code: 'LR', name: 'La Rioja', enabled: false },
      { code: 'MZ', name: 'Mendoza', enabled: false },
      { code: 'MI', name: 'Misiones', enabled: false },
      { code: 'NQ', name: 'Neuquén', enabled: false },
      { code: 'RN', name: 'Río Negro', enabled: false },
      { code: 'SA', name: 'Salta', enabled: false },
      { code: 'SJ', name: 'San Juan', enabled: false },
      { code: 'SL', name: 'San Luis', enabled: false },
      { code: 'SC', name: 'Santa Cruz', enabled: false },
      { code: 'SF', name: 'Santa Fe', enabled: false },
      { code: 'SE', name: 'Santiago del Estero', enabled: false },
      { code: 'TF', name: 'Tierra del Fuego', enabled: false },
      { code: 'TU', name: 'Tucumán', enabled: false },
    ],
  },
  {
    code: 'BR',
    name: 'Brazil',
    flag: '🇧🇷',
    states: [
      { code: 'AC', name: 'Acre', enabled: false },
      { code: 'AL', name: 'Alagoas', enabled: false },
      { code: 'AP', name: 'Amapá', enabled: false },
      { code: 'AM', name: 'Amazonas', enabled: false },
      { code: 'BA', name: 'Bahia', enabled: false },
      { code: 'CE', name: 'Ceará', enabled: false },
      { code: 'DF', name: 'Distrito Federal', enabled: false },
      { code: 'ES', name: 'Espírito Santo', enabled: false },
      { code: 'GO', name: 'Goiás', enabled: false },
      { code: 'MA', name: 'Maranhão', enabled: false },
      { code: 'MT', name: 'Mato Grosso', enabled: false },
      { code: 'MS', name: 'Mato Grosso do Sul', enabled: false },
      { code: 'MG', name: 'Minas Gerais', enabled: false },
      { code: 'PA', name: 'Pará', enabled: false },
      { code: 'PB', name: 'Paraíba', enabled: false },
      { code: 'PR', name: 'Paraná', enabled: false },
      { code: 'PE', name: 'Pernambuco', enabled: false },
      { code: 'PI', name: 'Piauí', enabled: false },
      { code: 'RJ', name: 'Rio de Janeiro', enabled: false },
      { code: 'RN', name: 'Rio Grande do Norte', enabled: false },
      { code: 'RS', name: 'Rio Grande do Sul', enabled: false },
      { code: 'RO', name: 'Rondônia', enabled: false },
      { code: 'RR', name: 'Roraima', enabled: false },
      { code: 'SC', name: 'Santa Catarina', enabled: false },
      { code: 'SP', name: 'São Paulo', enabled: false },
      { code: 'SE', name: 'Sergipe', enabled: false },
      { code: 'TO', name: 'Tocantins', enabled: false },
    ],
  },
  {
    code: 'CO',
    name: 'Colombia',
    flag: '🇨🇴',
    states: [
      { code: 'AMA', name: 'Amazonas', enabled: false },
      { code: 'ANT', name: 'Antioquia', enabled: false },
      { code: 'ARA', name: 'Arauca', enabled: false },
      { code: 'ATL', name: 'Atlántico', enabled: false },
      { code: 'BOL', name: 'Bolívar', enabled: false },
      { code: 'BOY', name: 'Boyacá', enabled: false },
      { code: 'CAL', name: 'Caldas', enabled: false },
      { code: 'CAQ', name: 'Caquetá', enabled: false },
      { code: 'CAS', name: 'Casanare', enabled: false },
      { code: 'CAU', name: 'Cauca', enabled: false },
      { code: 'CES', name: 'Cesar', enabled: false },
      { code: 'CHO', name: 'Chocó', enabled: false },
      { code: 'COR', name: 'Córdoba', enabled: false },
      { code: 'CUN', name: 'Cundinamarca', enabled: false },
      { code: 'DC', name: 'Bogotá D.C.', enabled: false },
      { code: 'GUA', name: 'Guainía', enabled: false },
      { code: 'GUV', name: 'Guaviare', enabled: false },
      { code: 'HUI', name: 'Huila', enabled: false },
      { code: 'LAG', name: 'La Guajira', enabled: false },
      { code: 'MAG', name: 'Magdalena', enabled: false },
      { code: 'MET', name: 'Meta', enabled: false },
      { code: 'NAR', name: 'Nariño', enabled: false },
      { code: 'NSA', name: 'Norte de Santander', enabled: false },
      { code: 'PUT', name: 'Putumayo', enabled: false },
      { code: 'QUI', name: 'Quindío', enabled: false },
      { code: 'RIS', name: 'Risaralda', enabled: false },
      { code: 'SAP', name: 'San Andrés y Providencia', enabled: false },
      { code: 'SAN', name: 'Santander', enabled: false },
      { code: 'SUC', name: 'Sucre', enabled: false },
      { code: 'TOL', name: 'Tolima', enabled: false },
      { code: 'VAC', name: 'Valle del Cauca', enabled: false },
      { code: 'VAU', name: 'Vaupés', enabled: false },
      { code: 'VID', name: 'Vichada', enabled: false },
    ],
  },
  {
    code: 'ES',
    name: 'Spain',
    flag: '🇪🇸',
    states: [
      { code: 'AN', name: 'Andalucía', enabled: false },
      { code: 'AR', name: 'Aragón', enabled: false },
      { code: 'AS', name: 'Asturias', enabled: false },
      { code: 'IB', name: 'Islas Baleares', enabled: false },
      { code: 'CN', name: 'Canarias', enabled: false },
      { code: 'CB', name: 'Cantabria', enabled: false },
      { code: 'CL', name: 'Castilla y León', enabled: false },
      { code: 'CM', name: 'Castilla-La Mancha', enabled: false },
      { code: 'CT', name: 'Cataluña', enabled: false },
      { code: 'EX', name: 'Extremadura', enabled: false },
      { code: 'GA', name: 'Galicia', enabled: false },
      { code: 'MD', name: 'Madrid', enabled: false },
      { code: 'MC', name: 'Murcia', enabled: false },
      { code: 'NC', name: 'Navarra', enabled: false },
      { code: 'PV', name: 'País Vasco', enabled: false },
      { code: 'RI', name: 'La Rioja', enabled: false },
      { code: 'VC', name: 'Valencia', enabled: false },
      { code: 'CE', name: 'Ceuta', enabled: false },
      { code: 'ML', name: 'Melilla', enabled: false },
    ],
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    states: [
      { code: 'BW', name: 'Baden-Württemberg', enabled: false },
      { code: 'BY', name: 'Bayern', enabled: false },
      { code: 'BE', name: 'Berlin', enabled: false },
      { code: 'BB', name: 'Brandenburg', enabled: false },
      { code: 'HB', name: 'Bremen', enabled: false },
      { code: 'HH', name: 'Hamburg', enabled: false },
      { code: 'HE', name: 'Hessen', enabled: false },
      { code: 'MV', name: 'Mecklenburg-Vorpommern', enabled: false },
      { code: 'NI', name: 'Niedersachsen', enabled: false },
      { code: 'NW', name: 'Nordrhein-Westfalen', enabled: false },
      { code: 'RP', name: 'Rheinland-Pfalz', enabled: false },
      { code: 'SL', name: 'Saarland', enabled: false },
      { code: 'SN', name: 'Sachsen', enabled: false },
      { code: 'ST', name: 'Sachsen-Anhalt', enabled: false },
      { code: 'SH', name: 'Schleswig-Holstein', enabled: false },
      { code: 'TH', name: 'Thüringen', enabled: false },
    ],
  },
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    states: [
      { code: 'ARA', name: 'Auvergne-Rhône-Alpes', enabled: false },
      { code: 'BFC', name: 'Bourgogne-Franche-Comté', enabled: false },
      { code: 'BRE', name: 'Bretagne', enabled: false },
      { code: 'CVL', name: 'Centre-Val de Loire', enabled: false },
      { code: 'COR', name: 'Corse', enabled: false },
      { code: 'GES', name: 'Grand Est', enabled: false },
      { code: 'HDF', name: 'Hauts-de-France', enabled: false },
      { code: 'IDF', name: 'Île-de-France', enabled: false },
      { code: 'NOR', name: 'Normandie', enabled: false },
      { code: 'NAQ', name: 'Nouvelle-Aquitaine', enabled: false },
      { code: 'OCC', name: 'Occitanie', enabled: false },
      { code: 'PDL', name: 'Pays de la Loire', enabled: false },
      { code: 'PAC', name: 'Provence-Alpes-Côte d\'Azur', enabled: false },
    ],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    states: [
      { code: 'ENG', name: 'England', enabled: false },
      { code: 'SCT', name: 'Scotland', enabled: false },
      { code: 'WLS', name: 'Wales', enabled: false },
      { code: 'NIR', name: 'Northern Ireland', enabled: false },
    ],
  },
  {
    code: 'IT',
    name: 'Italy',
    flag: '🇮🇹',
    states: [
      { code: 'ABR', name: 'Abruzzo', enabled: false },
      { code: 'BAS', name: 'Basilicata', enabled: false },
      { code: 'CAL', name: 'Calabria', enabled: false },
      { code: 'CAM', name: 'Campania', enabled: false },
      { code: 'EMR', name: 'Emilia-Romagna', enabled: false },
      { code: 'FVG', name: 'Friuli-Venezia Giulia', enabled: false },
      { code: 'LAZ', name: 'Lazio', enabled: false },
      { code: 'LIG', name: 'Liguria', enabled: false },
      { code: 'LOM', name: 'Lombardia', enabled: false },
      { code: 'MAR', name: 'Marche', enabled: false },
      { code: 'MOL', name: 'Molise', enabled: false },
      { code: 'PMN', name: 'Piemonte', enabled: false },
      { code: 'PUG', name: 'Puglia', enabled: false },
      { code: 'SAR', name: 'Sardegna', enabled: false },
      { code: 'SIC', name: 'Sicilia', enabled: false },
      { code: 'TOS', name: 'Toscana', enabled: false },
      { code: 'TAA', name: 'Trentino-Alto Adige', enabled: false },
      { code: 'UMB', name: 'Umbria', enabled: false },
      { code: 'VDA', name: 'Valle d\'Aosta', enabled: false },
      { code: 'VEN', name: 'Veneto', enabled: false },
    ],
  },
  {
    code: 'RU',
    name: 'Russia',
    flag: '🇷🇺',
    states: [
      { code: 'MOW', name: 'Moscow', enabled: false },
      { code: 'SPE', name: 'Saint Petersburg', enabled: false },
      { code: 'AD', name: 'Adygea', enabled: false },
      { code: 'BA', name: 'Bashkortostan', enabled: false },
      { code: 'CE', name: 'Chechnya', enabled: false },
      { code: 'DA', name: 'Dagestan', enabled: false },
      { code: 'IN', name: 'Ingushetia', enabled: false },
      { code: 'KB', name: 'Kabardino-Balkaria', enabled: false },
      { code: 'KL', name: 'Kalmykia', enabled: false },
      { code: 'KC', name: 'Karachay-Cherkessia', enabled: false },
      { code: 'KR', name: 'Karelia', enabled: false },
      { code: 'KO', name: 'Komi', enabled: false },
      { code: 'ME', name: 'Mari El', enabled: false },
      { code: 'MO', name: 'Mordovia', enabled: false },
      { code: 'SE', name: 'North Ossetia-Alania', enabled: false },
      { code: 'TA', name: 'Tatarstan', enabled: false },
    ],
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    states: [
      { code: 'NSW', name: 'New South Wales', enabled: false },
      { code: 'VIC', name: 'Victoria', enabled: false },
      { code: 'QLD', name: 'Queensland', enabled: false },
      { code: 'WA', name: 'Western Australia', enabled: false },
      { code: 'SA', name: 'South Australia', enabled: false },
      { code: 'TAS', name: 'Tasmania', enabled: false },
      { code: 'ACT', name: 'Australian Capital Territory', enabled: false },
      { code: 'NT', name: 'Northern Territory', enabled: false },
    ],
  },
  {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    states: [
      { code: 'HOK', name: 'Hokkaido', enabled: false },
      { code: 'TOH', name: 'Tohoku', enabled: false },
      { code: 'KAN', name: 'Kanto', enabled: false },
      { code: 'CHU', name: 'Chubu', enabled: false },
      { code: 'KIN', name: 'Kinki', enabled: false },
      { code: 'CGK', name: 'Chugoku', enabled: false },
      { code: 'SHI', name: 'Shikoku', enabled: false },
      { code: 'KYU', name: 'Kyushu', enabled: false },
      { code: 'OKI', name: 'Okinawa', enabled: false },
    ],
  },
  {
    code: 'CN',
    name: 'China',
    flag: '🇨🇳',
    states: [
      { code: 'BJ', name: 'Beijing', enabled: false },
      { code: 'SH', name: 'Shanghai', enabled: false },
      { code: 'TJ', name: 'Tianjin', enabled: false },
      { code: 'CQ', name: 'Chongqing', enabled: false },
      { code: 'GD', name: 'Guangdong', enabled: false },
      { code: 'JS', name: 'Jiangsu', enabled: false },
      { code: 'ZJ', name: 'Zhejiang', enabled: false },
      { code: 'SD', name: 'Shandong', enabled: false },
      { code: 'HE', name: 'Hebei', enabled: false },
      { code: 'HN', name: 'Henan', enabled: false },
      { code: 'SC', name: 'Sichuan', enabled: false },
      { code: 'HB', name: 'Hubei', enabled: false },
      { code: 'FJ', name: 'Fujian', enabled: false },
      { code: 'LN', name: 'Liaoning', enabled: false },
      { code: 'SX', name: 'Shaanxi', enabled: false },
    ],
  },
];

export default function GeofencePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [countries, setCountries] = useState<Country[]>(COUNTRIES_DATA);
  const [expandedCountry, setExpandedCountry] = useState<string | null>('US');
  const [selectedCountry, setSelectedCountry] = useState<string>('US');
  const [searchTerm, setSearchTerm] = useState('');

  // Load geofence settings from API
  const loadSettings = useCallback(async (token: string) => {
    try {
      const response = await fetch('/api/admin/geofence', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          // Merge saved settings with default data
          setCountries(prevCountries =>
            prevCountries.map(country => ({
              ...country,
              states: country.states.map(state => ({
                ...state,
                enabled: data.settings[country.code]?.[state.code] ?? state.enabled,
              })),
            }))
          );
        }
      }
    } catch (error) {
      console.error('Error loading geofence settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }
    loadSettings(token);
  }, [router, loadSettings]);

  // Save settings to API
  const saveSettings = useCallback(async (newCountries: Country[]) => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setIsSaving(true);
    try {
      const settings: Record<string, Record<string, boolean>> = {};
      newCountries.forEach(country => {
        settings[country.code] = {};
        country.states.forEach(state => {
          settings[country.code][state.code] = state.enabled;
        });
      });

      await fetch('/api/admin/geofence', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });
    } catch (error) {
      console.error('Error saving geofence settings:', error);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Toggle state enabled/disabled
  const toggleState = (countryCode: string, stateCode: string) => {
    setCountries(prevCountries => {
      const newCountries = prevCountries.map(country => {
        if (country.code === countryCode) {
          return {
            ...country,
            states: country.states.map(state => {
              if (state.code === stateCode) {
                return { ...state, enabled: !state.enabled };
              }
              return state;
            }),
          };
        }
        return country;
      });

      // Auto-save after toggle
      saveSettings(newCountries);
      return newCountries;
    });
  };

  // Toggle all states in a country
  const toggleAllStates = (countryCode: string, enabled: boolean) => {
    setCountries(prevCountries => {
      const newCountries = prevCountries.map(country => {
        if (country.code === countryCode) {
          return {
            ...country,
            states: country.states.map(state => ({ ...state, enabled })),
          };
        }
        return country;
      });

      saveSettings(newCountries);
      return newCountries;
    });
  };

  // Get counts for a country
  const getCountryCounts = (country: Country) => {
    const enabled = country.states.filter(s => s.enabled).length;
    const total = country.states.length;
    return { enabled, total };
  };

  // Filter countries by search term
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.states.some(state => state.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get current country for map
  const currentCountry = countries.find(c => c.code === selectedCountry);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-full mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={LOGO_URL} alt="SnapFace ID" className="h-8" />
              <div className="h-5 w-px bg-gray-300" />
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h1 className="text-lg font-bold text-gray-900">Geofence Management</h1>
              </div>
              {isSaving && (
                <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded animate-pulse">
                  Saving...
                </span>
              )}
            </div>
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading geofence settings...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* Left Panel - Country/State List */}
            <div className="col-span-4 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Search */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search countries or states..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Countries List */}
              <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                {filteredCountries.map(country => {
                  const { enabled, total } = getCountryCounts(country);
                  const isExpanded = expandedCountry === country.code;

                  return (
                    <div key={country.code} className="border-b border-gray-100 last:border-b-0">
                      {/* Country Header */}
                      <button
                        onClick={() => {
                          setExpandedCountry(isExpanded ? null : country.code);
                          setSelectedCountry(country.code);
                        }}
                        className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                          selectedCountry === country.code ? 'bg-purple-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{country.flag}</span>
                          <div className="text-left">
                            <p className="font-medium text-gray-900">{country.name}</p>
                            <p className="text-xs text-gray-500">
                              {enabled}/{total} regions enabled
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            enabled > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {enabled > 0 ? `${enabled} active` : 'inactive'}
                          </span>
                          <svg
                            className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {/* States List (Expanded) */}
                      {isExpanded && (
                        <div className="bg-gray-50 border-t border-gray-100">
                          {/* Toggle All */}
                          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                            <span className="text-xs font-medium text-gray-500 uppercase">Toggle All</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => toggleAllStates(country.code, true)}
                                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                              >
                                Enable All
                              </button>
                              <button
                                onClick={() => toggleAllStates(country.code, false)}
                                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                              >
                                Disable All
                              </button>
                            </div>
                          </div>

                          {/* States */}
                          <div className="max-h-64 overflow-y-auto">
                            {country.states.map(state => (
                              <div
                                key={state.code}
                                className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${state.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                                  <span className="text-sm text-gray-700">{state.name}</span>
                                  <span className="text-xs text-gray-400">({state.code})</span>
                                </div>
                                <button
                                  onClick={() => toggleState(country.code, state.code)}
                                  className={`relative w-10 h-5 rounded-full transition-colors ${
                                    state.enabled ? 'bg-green-500' : 'bg-gray-300'
                                  }`}
                                >
                                  <span
                                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                      state.enabled ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                  />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Panel - Map */}
            <div className="col-span-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{currentCountry?.flag}</span>
                  <h2 className="font-semibold text-gray-900">{currentCountry?.name || 'Select a country'}</h2>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-green-500" />
                    <span className="text-gray-600">Enabled</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-gray-300" />
                    <span className="text-gray-600">Disabled</span>
                  </div>
                </div>
              </div>
              <div className="h-[calc(100vh-280px)]">
                <GeofenceMap
                  country={currentCountry || null}
                  onStateClick={(stateCode) => {
                    if (currentCountry) {
                      toggleState(currentCountry.code, stateCode);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 shadow-lg">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Users in disabled regions will see "App will be available in this area soon"
        </p>
      </div>
    </div>
  );
}
