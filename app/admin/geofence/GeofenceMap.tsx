'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

interface GeofenceMapProps {
  country: Country | null;
  onStateClick: (stateCode: string) => void;
}

// Country center coordinates and zoom levels
const COUNTRY_VIEWS: Record<string, { center: [number, number]; zoom: number }> = {
  US: { center: [39.8283, -98.5795], zoom: 4 },
  MX: { center: [23.6345, -102.5528], zoom: 5 },
  CA: { center: [56.1304, -106.3468], zoom: 3 },
  AR: { center: [-38.4161, -63.6167], zoom: 4 },
  BR: { center: [-14.2350, -51.9253], zoom: 4 },
  CO: { center: [4.5709, -74.2973], zoom: 5 },
  ES: { center: [40.4637, -3.7492], zoom: 5 },
  DE: { center: [51.1657, 10.4515], zoom: 5 },
  FR: { center: [46.2276, 2.2137], zoom: 5 },
  GB: { center: [55.3781, -3.4360], zoom: 5 },
  IT: { center: [41.8719, 12.5674], zoom: 5 },
  RU: { center: [61.5240, 105.3188], zoom: 3 },
  AU: { center: [-25.2744, 133.7751], zoom: 4 },
  JP: { center: [36.2048, 138.2529], zoom: 5 },
  CN: { center: [35.8617, 104.1954], zoom: 4 },
};

// GeoJSON sources for each country
const GEOJSON_URLS: Record<string, string> = {
  US: 'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json',
  MX: 'https://raw.githubusercontent.com/angelnmara/geojson/master/mexicoHigh.json',
  CA: 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/canada.geojson',
  AR: 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/argentina-provinces.geojson',
  BR: 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson',
  CO: 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/colombia-departments.geojson',
  ES: 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/spain-communities.geojson',
  DE: 'https://raw.githubusercontent.com/isellsoap/deutschern-geodaten/main/4_kreise/2_hoch.geo.json',
  FR: 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions-version-simplifiee.geojson',
  GB: 'https://raw.githubusercontent.com/martinjc/UK-GeoJSON/master/json/eng/topo_eer.json',
  IT: 'https://raw.githubusercontent.com/openpolis/geojson-italy/master/geojson/limits_IT_regions.geojson',
  RU: 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/russia.geojson',
  AU: 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/australia.geojson',
  JP: 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/japan.geojson',
  CN: 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/china.geojson',
};

// State/Province name to code mapping for each country
const STATE_NAME_TO_CODE: Record<string, Record<string, string>> = {
  US: {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
    'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
    'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
    'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
    'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
    'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
    'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
    'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
    'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
    'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
    'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC', 'Puerto Rico': 'PR',
  },
  MX: {
    'Aguascalientes': 'AGU', 'Baja California': 'BCN', 'Baja California Sur': 'BCS',
    'Campeche': 'CAM', 'Chiapas': 'CHP', 'Chihuahua': 'CHH', 'Coahuila': 'COA',
    'Coahuila de Zaragoza': 'COA', 'Colima': 'COL', 'Ciudad de México': 'CMX',
    'Distrito Federal': 'CMX', 'Durango': 'DUR', 'Guanajuato': 'GUA',
    'Guerrero': 'GRO', 'Hidalgo': 'HID', 'Jalisco': 'JAL', 'México': 'MEX',
    'Estado de México': 'MEX', 'Michoacán': 'MIC', 'Michoacán de Ocampo': 'MIC',
    'Morelos': 'MOR', 'Nayarit': 'NAY', 'Nuevo León': 'NLE', 'Oaxaca': 'OAX',
    'Puebla': 'PUE', 'Querétaro': 'QUE', 'Quintana Roo': 'ROO', 'San Luis Potosí': 'SLP',
    'Sinaloa': 'SIN', 'Sonora': 'SON', 'Tabasco': 'TAB', 'Tamaulipas': 'TAM',
    'Tlaxcala': 'TLA', 'Veracruz': 'VER', 'Veracruz de Ignacio de la Llave': 'VER',
    'Yucatán': 'YUC', 'Zacatecas': 'ZAC',
  },
  CA: {
    'Alberta': 'AB', 'British Columbia': 'BC', 'Manitoba': 'MB',
    'New Brunswick': 'NB', 'Newfoundland and Labrador': 'NL', 'Nova Scotia': 'NS',
    'Northwest Territories': 'NT', 'Nunavut': 'NU', 'Ontario': 'ON',
    'Prince Edward Island': 'PE', 'Quebec': 'QC', 'Saskatchewan': 'SK', 'Yukon': 'YT',
  },
  AR: {
    'Buenos Aires': 'BA', 'Ciudad Autónoma de Buenos Aires': 'CABA',
    'Catamarca': 'CT', 'Chaco': 'CC', 'Chubut': 'CH', 'Córdoba': 'CB',
    'Corrientes': 'CR', 'Entre Ríos': 'ER', 'Formosa': 'FO', 'Jujuy': 'JY',
    'La Pampa': 'LP', 'La Rioja': 'LR', 'Mendoza': 'MZ', 'Misiones': 'MN',
    'Neuquén': 'NQ', 'Río Negro': 'RN', 'Salta': 'SA', 'San Juan': 'SJ',
    'San Luis': 'SL', 'Santa Cruz': 'SC', 'Santa Fe': 'SF',
    'Santiago del Estero': 'SE', 'Tierra del Fuego': 'TF', 'Tucumán': 'TM',
  },
  BR: {
    'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM',
    'Bahia': 'BA', 'Ceará': 'CE', 'Distrito Federal': 'DF', 'Espírito Santo': 'ES',
    'Goiás': 'GO', 'Maranhão': 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS',
    'Minas Gerais': 'MG', 'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR',
    'Pernambuco': 'PE', 'Piauí': 'PI', 'Rio de Janeiro': 'RJ',
    'Rio Grande do Norte': 'RN', 'Rio Grande do Sul': 'RS', 'Rondônia': 'RO',
    'Roraima': 'RR', 'Santa Catarina': 'SC', 'São Paulo': 'SP', 'Sergipe': 'SE',
    'Tocantins': 'TO',
  },
  CO: {
    'Amazonas': 'AMA', 'Antioquia': 'ANT', 'Arauca': 'ARA', 'Atlántico': 'ATL',
    'Bogotá': 'DC', 'Bolívar': 'BOL', 'Boyacá': 'BOY', 'Caldas': 'CAL',
    'Caquetá': 'CAQ', 'Casanare': 'CAS', 'Cauca': 'CAU', 'Cesar': 'CES',
    'Chocó': 'CHO', 'Córdoba': 'COR', 'Cundinamarca': 'CUN', 'Guainía': 'GUA',
    'Guaviare': 'GUV', 'Huila': 'HUI', 'La Guajira': 'LAG', 'Magdalena': 'MAG',
    'Meta': 'MET', 'Nariño': 'NAR', 'Norte de Santander': 'NSA', 'Putumayo': 'PUT',
    'Quindío': 'QUI', 'Risaralda': 'RIS', 'San Andrés y Providencia': 'SAP',
    'Santander': 'SAN', 'Sucre': 'SUC', 'Tolima': 'TOL', 'Valle del Cauca': 'VAC',
    'Vaupés': 'VAU', 'Vichada': 'VID',
  },
  ES: {
    'Andalucía': 'AN', 'Aragón': 'AR', 'Asturias': 'AS', 'Principado de Asturias': 'AS',
    'Islas Baleares': 'IB', 'Illes Balears': 'IB', 'Canarias': 'CN',
    'Cantabria': 'CB', 'Castilla y León': 'CL', 'Castilla-La Mancha': 'CM',
    'Cataluña': 'CT', 'Catalunya': 'CT', 'Comunidad Valenciana': 'VC',
    'Comunitat Valenciana': 'VC', 'Extremadura': 'EX', 'Galicia': 'GA',
    'Comunidad de Madrid': 'MD', 'Madrid': 'MD', 'Región de Murcia': 'MC', 'Murcia': 'MC',
    'Comunidad Foral de Navarra': 'NC', 'Navarra': 'NC', 'País Vasco': 'PV',
    'Euskadi': 'PV', 'La Rioja': 'RI', 'Ceuta': 'CE', 'Melilla': 'ML',
  },
  DE: {
    'Baden-Württemberg': 'BW', 'Bayern': 'BY', 'Bavaria': 'BY', 'Berlin': 'BE',
    'Brandenburg': 'BB', 'Bremen': 'HB', 'Hamburg': 'HH', 'Hessen': 'HE', 'Hesse': 'HE',
    'Mecklenburg-Vorpommern': 'MV', 'Niedersachsen': 'NI', 'Lower Saxony': 'NI',
    'Nordrhein-Westfalen': 'NW', 'North Rhine-Westphalia': 'NW',
    'Rheinland-Pfalz': 'RP', 'Rhineland-Palatinate': 'RP', 'Saarland': 'SL',
    'Sachsen': 'SN', 'Saxony': 'SN', 'Sachsen-Anhalt': 'ST', 'Saxony-Anhalt': 'ST',
    'Schleswig-Holstein': 'SH', 'Thüringen': 'TH', 'Thuringia': 'TH',
  },
  FR: {
    'Auvergne-Rhône-Alpes': 'ARA', 'Bourgogne-Franche-Comté': 'BFC',
    'Bretagne': 'BRE', 'Centre-Val de Loire': 'CVL', 'Corse': 'COR',
    'Grand Est': 'GES', 'Hauts-de-France': 'HDF', 'Île-de-France': 'IDF',
    'Normandie': 'NOR', 'Nouvelle-Aquitaine': 'NAQ', 'Occitanie': 'OCC',
    'Pays de la Loire': 'PDL', 'Provence-Alpes-Côte d\'Azur': 'PAC',
    'Guadeloupe': 'GUA', 'Martinique': 'MTQ', 'Guyane': 'GUF',
    'La Réunion': 'LRE', 'Mayotte': 'MAY',
  },
  GB: {
    'England': 'ENG', 'Scotland': 'SCT', 'Wales': 'WLS', 'Northern Ireland': 'NIR',
    'East Midlands': 'EM', 'East of England': 'EE', 'London': 'LDN',
    'North East': 'NE', 'North West': 'NW', 'South East': 'SE',
    'South West': 'SW', 'West Midlands': 'WM', 'Yorkshire and The Humber': 'YH',
  },
  IT: {
    'Abruzzo': 'ABR', 'Basilicata': 'BAS', 'Calabria': 'CAL', 'Campania': 'CAM',
    'Emilia-Romagna': 'EMR', 'Friuli-Venezia Giulia': 'FVG', 'Friuli Venezia Giulia': 'FVG',
    'Lazio': 'LAZ', 'Liguria': 'LIG', 'Lombardia': 'LOM', 'Lombardy': 'LOM',
    'Marche': 'MAR', 'Molise': 'MOL', 'Piemonte': 'PIE', 'Piedmont': 'PIE',
    'Puglia': 'PUG', 'Apulia': 'PUG', 'Sardegna': 'SAR', 'Sardinia': 'SAR',
    'Sicilia': 'SIC', 'Sicily': 'SIC', 'Toscana': 'TOS', 'Tuscany': 'TOS',
    'Trentino-Alto Adige': 'TAA', 'Trentino-Alto Adige/Südtirol': 'TAA',
    'Umbria': 'UMB', 'Valle d\'Aosta': 'VDA', 'Aosta Valley': 'VDA',
    'Veneto': 'VEN',
  },
  RU: {
    'Moscow': 'MOW', 'Saint Petersburg': 'SPE', 'Adygea': 'AD', 'Altai Republic': 'AL',
    'Altai Krai': 'ALT', 'Amur Oblast': 'AMU', 'Arkhangelsk Oblast': 'ARK',
    'Astrakhan Oblast': 'AST', 'Bashkortostan': 'BA', 'Belgorod Oblast': 'BEL',
    'Bryansk Oblast': 'BRY', 'Buryatia': 'BU', 'Chechen Republic': 'CE', 'Chechnya': 'CE',
    'Chelyabinsk Oblast': 'CHE', 'Chukotka': 'CHU', 'Chuvashia': 'CU',
    'Crimea': 'CR', 'Dagestan': 'DA', 'Ingushetia': 'IN', 'Irkutsk Oblast': 'IRK',
    'Ivanovo Oblast': 'IVA', 'Jewish Autonomous Oblast': 'YEV', 'Kabardino-Balkaria': 'KB',
    'Kaliningrad Oblast': 'KGD', 'Kalmykia': 'KL', 'Kaluga Oblast': 'KLU',
    'Kamchatka Krai': 'KAM', 'Karachay-Cherkessia': 'KC', 'Karelia': 'KR',
    'Kemerovo Oblast': 'KEM', 'Khabarovsk Krai': 'KHA', 'Khakassia': 'KK',
    'Khanty-Mansi': 'KHM', 'Kirov Oblast': 'KIR', 'Komi': 'KO', 'Kostroma Oblast': 'KOS',
    'Krasnodar Krai': 'KDA', 'Krasnoyarsk Krai': 'KYA', 'Kurgan Oblast': 'KGN',
    'Kursk Oblast': 'KRS', 'Leningrad Oblast': 'LEN', 'Lipetsk Oblast': 'LIP',
    'Magadan Oblast': 'MAG', 'Mari El': 'ME', 'Mordovia': 'MO', 'Moscow Oblast': 'MOS',
    'Murmansk Oblast': 'MUR', 'Nenets': 'NEN', 'Nizhny Novgorod Oblast': 'NIZ',
    'North Ossetia': 'SE', 'Novgorod Oblast': 'NGR', 'Novosibirsk Oblast': 'NVS',
    'Omsk Oblast': 'OMS', 'Orenburg Oblast': 'ORE', 'Oryol Oblast': 'ORL',
    'Penza Oblast': 'PNZ', 'Perm Krai': 'PER', 'Primorsky Krai': 'PRI',
    'Pskov Oblast': 'PSK', 'Rostov Oblast': 'ROS', 'Ryazan Oblast': 'RYA',
    'Sakha': 'SA', 'Yakutia': 'SA', 'Sakhalin Oblast': 'SAK', 'Samara Oblast': 'SAM',
    'Saratov Oblast': 'SAR', 'Sevastopol': 'SEV', 'Smolensk Oblast': 'SMO',
    'Stavropol Krai': 'STA', 'Sverdlovsk Oblast': 'SVE', 'Tambov Oblast': 'TAM',
    'Tatarstan': 'TA', 'Tomsk Oblast': 'TOM', 'Tula Oblast': 'TUL', 'Tuva': 'TY',
    'Tver Oblast': 'TVE', 'Tyumen Oblast': 'TYU', 'Udmurtia': 'UD',
    'Ulyanovsk Oblast': 'ULY', 'Vladimir Oblast': 'VLA', 'Volgograd Oblast': 'VGG',
    'Vologda Oblast': 'VLG', 'Voronezh Oblast': 'VOR', 'Yamalo-Nenets': 'YAN',
    'Yaroslavl Oblast': 'YAR', 'Zabaykalsky Krai': 'ZAB',
  },
  AU: {
    'New South Wales': 'NSW', 'Victoria': 'VIC', 'Queensland': 'QLD',
    'South Australia': 'SA', 'Western Australia': 'WA', 'Tasmania': 'TAS',
    'Northern Territory': 'NT', 'Australian Capital Territory': 'ACT',
  },
  JP: {
    'Hokkaido': 'HKD', 'Aomori': 'AOM', 'Iwate': 'IWT', 'Miyagi': 'MYG',
    'Akita': 'AKT', 'Yamagata': 'YGT', 'Fukushima': 'FKS', 'Ibaraki': 'IBR',
    'Tochigi': 'TCG', 'Gunma': 'GNM', 'Saitama': 'STM', 'Chiba': 'CHB',
    'Tokyo': 'TKY', 'Kanagawa': 'KNG', 'Niigata': 'NGT', 'Toyama': 'TYM',
    'Ishikawa': 'ISK', 'Fukui': 'FKI', 'Yamanashi': 'YMN', 'Nagano': 'NGN',
    'Gifu': 'GIF', 'Shizuoka': 'SZK', 'Aichi': 'AIC', 'Mie': 'MIE',
    'Shiga': 'SIG', 'Kyoto': 'KYT', 'Osaka': 'OSK', 'Hyogo': 'HYG',
    'Nara': 'NAR', 'Wakayama': 'WKY', 'Tottori': 'TTR', 'Shimane': 'SMN',
    'Okayama': 'OKY', 'Hiroshima': 'HRS', 'Yamaguchi': 'YMG', 'Tokushima': 'TKS',
    'Kagawa': 'KGW', 'Ehime': 'EHM', 'Kochi': 'KCH', 'Fukuoka': 'FKO',
    'Saga': 'SAG', 'Nagasaki': 'NGS', 'Kumamoto': 'KMM', 'Oita': 'OIT',
    'Miyazaki': 'MYZ', 'Kagoshima': 'KGS', 'Okinawa': 'OKN',
  },
  CN: {
    'Beijing': 'BJ', 'Tianjin': 'TJ', 'Hebei': 'HE', 'Shanxi': 'SX',
    'Inner Mongolia': 'NM', 'Liaoning': 'LN', 'Jilin': 'JL', 'Heilongjiang': 'HL',
    'Shanghai': 'SH', 'Jiangsu': 'JS', 'Zhejiang': 'ZJ', 'Anhui': 'AH',
    'Fujian': 'FJ', 'Jiangxi': 'JX', 'Shandong': 'SD', 'Henan': 'HA',
    'Hubei': 'HB', 'Hunan': 'HN', 'Guangdong': 'GD', 'Guangxi': 'GX',
    'Hainan': 'HI', 'Chongqing': 'CQ', 'Sichuan': 'SC', 'Guizhou': 'GZ',
    'Yunnan': 'YN', 'Tibet': 'XZ', 'Shaanxi': 'SN', 'Gansu': 'GS',
    'Qinghai': 'QH', 'Ningxia': 'NX', 'Xinjiang': 'XJ', 'Taiwan': 'TW',
    'Hong Kong': 'HK', 'Macau': 'MO',
  },
};

// Property names in GeoJSON files that contain the region name
const GEOJSON_NAME_PROPERTIES: Record<string, string[]> = {
  US: ['name'],
  MX: ['name', 'ESTADO', 'NOM_ENT'],
  CA: ['name', 'PRENAME'],
  AR: ['name', 'NAM', 'provincia'],
  BR: ['name', 'nome', 'NOME'],
  CO: ['name', 'NOMBRE_DPT', 'DPTO'],
  ES: ['name', 'nom', 'NAME'],
  DE: ['name', 'NAME_1', 'GEN'],
  FR: ['name', 'nom', 'libelle'],
  GB: ['name', 'EER13NM', 'NAME'],
  IT: ['name', 'reg_name', 'NOME_REG'],
  RU: ['name', 'NAME', 'name_en'],
  AU: ['name', 'STATE_NAME', 'ste_name'],
  JP: ['name', 'nam', 'NAME'],
  CN: ['name', 'NAME', 'ADMIN_NAME'],
};

// Colors for the map
const COLORS = {
  enabled: {
    fill: '#CE93D8',      // Light purple (pastel)
    border: '#6A1B9A',    // Darker purple
  },
  disabled: {
    fill: '#E0E0E0',      // Light gray
    border: '#9E9E9E',    // Medium gray
  },
  hover: {
    fill: '#BA68C8',      // Slightly darker purple on hover
    border: '#4A148C',    // Even darker purple
  },
};

// Helper function to get the region name from GeoJSON feature properties
function getRegionName(properties: Record<string, unknown>, countryCode: string): string | null {
  const nameProps = GEOJSON_NAME_PROPERTIES[countryCode] || ['name'];
  for (const prop of nameProps) {
    if (properties[prop] && typeof properties[prop] === 'string') {
      return properties[prop] as string;
    }
  }
  return null;
}

// Helper function to get state code from name
function getStateCode(name: string, countryCode: string): string | null {
  const mapping = STATE_NAME_TO_CODE[countryCode];
  if (!mapping) return null;

  // Try exact match first
  if (mapping[name]) return mapping[name];

  // Try case-insensitive match
  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(mapping)) {
    if (key.toLowerCase() === lowerName) return value;
  }

  // Try partial match (for names that might have extra text)
  for (const [key, value] of Object.entries(mapping)) {
    if (name.includes(key) || key.includes(name)) return value;
  }

  return null;
}

export default function GeofenceMap({ country, onStateClick }: GeofenceMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [geoJsonCache, setGeoJsonCache] = useState<Record<string, GeoJSON.FeatureCollection>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch GeoJSON data for the selected country
  useEffect(() => {
    if (!country || geoJsonCache[country.code]) return;

    const url = GEOJSON_URLS[country.code];
    if (!url) {
      setLoadError(`No map data available for ${country.name}`);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        // Handle TopoJSON format (convert to GeoJSON if needed)
        let geoJson = data;
        if (data.type === 'Topology' && data.objects) {
          // This is TopoJSON, we need to extract the first object
          const objectKey = Object.keys(data.objects)[0];
          if (objectKey && typeof window !== 'undefined') {
            // For TopoJSON, we'll use the features directly if available
            // or show an error since we don't have topojson-client in browser
            console.warn('TopoJSON format detected, attempting to use as-is');
          }
        }

        setGeoJsonCache(prev => ({ ...prev, [country.code]: geoJson }));
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error loading GeoJSON:', err);
        setLoadError(`Failed to load map for ${country.name}`);
        setIsLoading(false);
      });
  }, [country?.code, geoJsonCache]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([39.8283, -98.5795], 4);

      // Add tile layer (grayscale style for better contrast with colored states)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map when country or states change
  useEffect(() => {
    if (!mapRef.current || !country) return;

    const map = mapRef.current;
    const geoJsonData = geoJsonCache[country.code];

    // Clear existing GeoJSON layer
    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.remove();
      geoJsonLayerRef.current = null;
    }

    // Set view for the selected country
    const view = COUNTRY_VIEWS[country.code];
    if (view) {
      map.setView(view.center, view.zoom);
    }

    // If we have GeoJSON data, render the polygons
    if (geoJsonData && geoJsonData.features) {
      const stateStatusMap = new Map<string, boolean>();
      country.states.forEach(state => {
        stateStatusMap.set(state.code, state.enabled);
      });

      geoJsonLayerRef.current = L.geoJSON(geoJsonData, {
        style: (feature) => {
          if (!feature?.properties) return {};
          const regionName = getRegionName(feature.properties as Record<string, unknown>, country.code);
          const stateCode = regionName ? getStateCode(regionName, country.code) : null;
          const isEnabled = stateCode ? stateStatusMap.get(stateCode) ?? false : false;

          return {
            fillColor: isEnabled ? COLORS.enabled.fill : COLORS.disabled.fill,
            color: isEnabled ? COLORS.enabled.border : COLORS.disabled.border,
            weight: 2,
            opacity: 1,
            fillOpacity: 0.7,
          };
        },
        onEachFeature: (feature, layer) => {
          if (!feature?.properties) return;

          const regionName = getRegionName(feature.properties as Record<string, unknown>, country.code);
          const stateCode = regionName ? getStateCode(regionName, country.code) : null;
          const isEnabled = stateCode ? stateStatusMap.get(stateCode) ?? false : false;
          const displayName = regionName || 'Unknown Region';

          // Add tooltip
          layer.bindTooltip(`
            <div style="text-align: center; padding: 4px;">
              <strong>${displayName}</strong><br/>
              <span style="color: ${isEnabled ? '#6A1B9A' : '#666'};">
                ${isEnabled ? '✓ Enabled' : '✗ Disabled'}
              </span>
            </div>
          `, {
            permanent: false,
            direction: 'top',
            className: 'geofence-tooltip',
          });

          // Add click handler
          layer.on('click', () => {
            if (stateCode) {
              onStateClick(stateCode);
            }
          });

          // Add hover effects
          layer.on('mouseover', () => {
            (layer as L.Path).setStyle({
              fillColor: COLORS.hover.fill,
              color: COLORS.hover.border,
              weight: 3,
            });
          });

          layer.on('mouseout', () => {
            (layer as L.Path).setStyle({
              fillColor: isEnabled ? COLORS.enabled.fill : COLORS.disabled.fill,
              color: isEnabled ? COLORS.enabled.border : COLORS.disabled.border,
              weight: 2,
            });
          });
        },
      }).addTo(map);
    }
  }, [country, geoJsonCache, onStateClick]);

  // Update styles when state enabled status changes
  useEffect(() => {
    if (!geoJsonLayerRef.current || !country) return;

    const stateStatusMap = new Map<string, boolean>();
    country.states.forEach(state => {
      stateStatusMap.set(state.code, state.enabled);
    });

    geoJsonLayerRef.current.eachLayer((layer) => {
      const feature = (layer as L.GeoJSON).feature as GeoJSON.Feature;
      if (!feature?.properties) return;

      const regionName = getRegionName(feature.properties as Record<string, unknown>, country.code);
      const stateCode = regionName ? getStateCode(regionName, country.code) : null;
      const isEnabled = stateCode ? stateStatusMap.get(stateCode) ?? false : false;
      const displayName = regionName || 'Unknown Region';

      (layer as L.Path).setStyle({
        fillColor: isEnabled ? COLORS.enabled.fill : COLORS.disabled.fill,
        color: isEnabled ? COLORS.enabled.border : COLORS.disabled.border,
      });

      // Update tooltip
      layer.unbindTooltip();
      layer.bindTooltip(`
        <div style="text-align: center; padding: 4px;">
          <strong>${displayName}</strong><br/>
          <span style="color: ${isEnabled ? '#6A1B9A' : '#666'};">
            ${isEnabled ? '✓ Enabled' : '✗ Disabled'}
          </span>
        </div>
      `, {
        permanent: false,
        direction: 'top',
        className: 'geofence-tooltip',
      });

      // Update hover handlers
      layer.off('mouseout');
      layer.on('mouseout', () => {
        (layer as L.Path).setStyle({
          fillColor: isEnabled ? COLORS.enabled.fill : COLORS.disabled.fill,
          color: isEnabled ? COLORS.enabled.border : COLORS.disabled.border,
          weight: 2,
        });
      });
    });
  }, [country?.states]);

  if (!country) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Select a country to view the map</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#6A1B9A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading map for {country.name}...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <svg className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500">{loadError}</p>
          <p className="text-gray-400 text-sm mt-1">Toggle states using the list on the left</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full" style={{ minHeight: '400px' }} />
  );
}
