export type MoroccoCity = 'CASABLANCA' | 'RABAT' | 'MARRAKECH' | 'AGADIR' | 'TANGER' | 'FES' | 'MEKNES' | 'OUJDA' | 'KENITRA' | 'TETOUAN' | 'SALE' | 'TEMARA' | 'NADOR' | 'BENI_MELLAL' | 'MOHAMMEDIA' | 'KHOURIBGA' | 'EL_JADIDA' | 'SAFI' | 'KHEMISSET' | 'LAAYOUNE' | 'SETTAT' | 'LARACHE' | 'KSAR_EL_KEBIR' | 'GUELMIM' | 'TAZA' | 'BERRECHID' | 'ERRACHIDIA' | 'ESSAOUIRA' | 'OUARZAZATE' | 'TAROUDANT';

export const MOROCCO_CITIES: string[] = [
  'Casablanca',
  'Rabat',
  'Marrakech',
  'Agadir',
  'Tanger',
  'Fes',
  'Meknes',
  'Oujda',
  'Kenitra',
  'Tetouan',
  'Sale',
  'Temara',
  'Nador',
  'Beni Mellal',
  'Mohammedia',
  'Khouribga',
  'El Jadida',
  'Safi',
  'Khemisset',
  'Laayoune',
  'Settat',
  'Larache',
  'Ksar El Kebir',
  'Guelmim',
  'Taza',
  'Berrechid',
  'Errachidia',
  'Essaouira',
  'Ouarzazate',
  'Taroudant',
];

export const CITY_INFO: Record<MoroccoCity, { name: string; emoji: string }> = {
  CASABLANCA: { name: 'Casablanca', emoji: '🌊' },
  RABAT: { name: 'Rabat', emoji: '🏛️' },
  MARRAKECH: { name: 'Marrakech', emoji: '🕌' },
  AGADIR: { name: 'Agadir', emoji: '🏖️' },
  TANGER: { name: 'Tanger', emoji: '⛴️' },
  FES: { name: 'Fes', emoji: '🏛️' },
  MEKNES: { name: 'Meknes', emoji: '🏛️' },
  OUJDA: { name: 'Oujda', emoji: '🏛️' },
  KENITRA: { name: 'Kenitra', emoji: '🌊' },
  TETOUAN: { name: 'Tetouan', emoji: '⛴️' },
  SALE: { name: 'Sale', emoji: '🌊' },
  TEMARA: { name: 'Temara', emoji: '🏛️' },
  NADOR: { name: 'Nador', emoji: '🌊' },
  BENI_MELLAL: { name: 'Beni Mellal', emoji: '🏛️' },
  MOHAMMEDIA: { name: 'Mohammedia', emoji: '🌊' },
  KHOURIBGA: { name: 'Khouribga', emoji: '🏛️' },
  EL_JADIDA: { name: 'El Jadida', emoji: '🌊' },
  SAFI: { name: 'Safi', emoji: '🌊' },
  KHEMISSET: { name: 'Khemisset', emoji: '🏛️' },
  LAAYOUNE: { name: 'Laayoune', emoji: '🏜️' },
  SETTAT: { name: 'Settat', emoji: '🏛️' },
  LARACHE: { name: 'Larache', emoji: '🌊' },
  KSAR_EL_KEBIR: { name: 'Ksar El Kebir', emoji: '🏛️' },
  GUELMIM: { name: 'Guelmim', emoji: '🏜️' },
  TAZA: { name: 'Taza', emoji: '🏛️' },
  BERRECHID: { name: 'Berrechid', emoji: '🏛️' },
  ERRACHIDIA: { name: 'Errachidia', emoji: '🏜️' },
  ESSAOUIRA: { name: 'Essaouira', emoji: '🌊' },
  OUARZAZATE: { name: 'Ouarzazate', emoji: '🏜️' },
  TAROUDANT: { name: 'Taroudant', emoji: '🏛️' },
};

export interface Field {
  id: string;
  name: string;
  city: MoroccoCity;
  address: string;
  type: 'indoor' | 'outdoor';
}

export const FIELDS: Field[] = [
  {
    id: 'casa-1',
    name: 'Sport City Casablanca',
    city: 'CASABLANCA',
    address: 'Maarif, Casablanca',
    type: 'indoor',
  },
  {
    id: 'casa-2',
    name: 'Arena Club Casa',
    city: 'CASABLANCA',
    address: 'Ain Diab, Casablanca',
    type: 'outdoor',
  },
  {
    id: 'casa-3',
    name: 'Casa Gaming Hub',
    city: 'CASABLANCA',
    address: 'Anfa, Casablanca',
    type: 'indoor',
  },
  {
    id: 'rabat-1',
    name: 'Capital Sports Arena',
    city: 'RABAT',
    address: 'Agdal, Rabat',
    type: 'indoor',
  },
  {
    id: 'rabat-2',
    name: 'Rabat Elite Club',
    city: 'RABAT',
    address: 'Hassan, Rabat',
    type: 'outdoor',
  },
  {
    id: 'rabat-3',
    name: 'Royal Gaming Center',
    city: 'RABAT',
    address: 'Hay Riad, Rabat',
    type: 'indoor',
  },
  {
    id: 'marrakech-1',
    name: 'Red City Arena',
    city: 'MARRAKECH',
    address: 'Guéliz, Marrakech',
    type: 'indoor',
  },
  {
    id: 'marrakech-2',
    name: 'Marrakech Sports Complex',
    city: 'MARRAKECH',
    address: 'Hivernage, Marrakech',
    type: 'outdoor',
  },
  {
    id: 'marrakech-3',
    name: 'Atlas Gaming Hub',
    city: 'MARRAKECH',
    address: 'Targa, Marrakech',
    type: 'indoor',
  },
  {
    id: 'agadir-1',
    name: 'Beach Arena Agadir',
    city: 'AGADIR',
    address: 'Marina, Agadir',
    type: 'outdoor',
  },
  {
    id: 'agadir-2',
    name: 'Agadir Sports Center',
    city: 'AGADIR',
    address: 'Nouveau Talborjt, Agadir',
    type: 'indoor',
  },
  {
    id: 'agadir-3',
    name: 'Souss Gaming Club',
    city: 'AGADIR',
    address: 'Founty, Agadir',
    type: 'indoor',
  },
  {
    id: 'tanger-1',
    name: 'Tanger Bay Arena',
    city: 'TANGER',
    address: 'Malabata, Tanger',
    type: 'outdoor',
  },
  {
    id: 'tanger-2',
    name: 'Gibraltar Gaming Center',
    city: 'TANGER',
    address: 'City Center, Tanger',
    type: 'indoor',
  },
  {
    id: 'tanger-3',
    name: 'Tanger Elite Club',
    city: 'TANGER',
    address: 'Medina, Tanger',
    type: 'indoor',
  },
];

export function getFieldsByCity(city: MoroccoCity): Field[] {
  return FIELDS.filter((field) => field.city === city);
}
