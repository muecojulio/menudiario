/**
 * Ciudades para el pronóstico. Solo se envían coordenadas de una lista fija,
 * nunca la ubicación del usuario.
 */

export type City = {
  id: string;
  name: string;
  state: string;
  lat: number;
  lon: number;
  tz: string;
};

export const CITIES: City[] = [
  {
    id: "cdmx",
    name: "Ciudad de México",
    state: "CDMX",
    lat: 19.4326,
    lon: -99.1332,
    tz: "America/Mexico_City",
  },
  {
    id: "guadalajara",
    name: "Guadalajara",
    state: "Jalisco",
    lat: 20.6597,
    lon: -103.3496,
    tz: "America/Mexico_City",
  },
  {
    id: "monterrey",
    name: "Monterrey",
    state: "Nuevo León",
    lat: 25.6866,
    lon: -100.3161,
    tz: "America/Monterrey",
  },
  {
    id: "puebla",
    name: "Puebla",
    state: "Puebla",
    lat: 19.0414,
    lon: -98.2063,
    tz: "America/Mexico_City",
  },
  {
    id: "leon",
    name: "León",
    state: "Guanajuato",
    lat: 21.1619,
    lon: -101.686,
    tz: "America/Mexico_City",
  },
  {
    id: "queretaro",
    name: "Querétaro",
    state: "Querétaro",
    lat: 20.5888,
    lon: -100.3899,
    tz: "America/Mexico_City",
  },
  {
    id: "san-luis",
    name: "San Luis Potosí",
    state: "San Luis Potosí",
    lat: 22.1565,
    lon: -100.9855,
    tz: "America/Mexico_City",
  },
  {
    id: "oaxaca",
    name: "Oaxaca",
    state: "Oaxaca",
    lat: 17.0732,
    lon: -96.7266,
    tz: "America/Mexico_City",
  },
  {
    id: "merida",
    name: "Mérida",
    state: "Yucatán",
    lat: 20.9674,
    lon: -89.5926,
    tz: "America/Merida",
  },
  {
    id: "cancun",
    name: "Cancún",
    state: "Quintana Roo",
    lat: 21.1619,
    lon: -86.8515,
    tz: "America/Cancun",
  },
  {
    id: "tijuana",
    name: "Tijuana",
    state: "Baja California",
    lat: 32.5149,
    lon: -117.0382,
    tz: "America/Tijuana",
  },
  {
    id: "hermosillo",
    name: "Hermosillo",
    state: "Sonora",
    lat: 29.0729,
    lon: -110.9559,
    tz: "America/Hermosillo",
  },
];

export const CITY_IDS = CITIES.map((city) => city.id) as [string, ...string[]];

export const DEFAULT_CITY_ID = "cdmx";

export function findCity(id: string): City | undefined {
  return CITIES.find((city) => city.id === id);
}

export function cityOrDefault(id: string | undefined): City {
  return findCity(id ?? DEFAULT_CITY_ID) ?? CITIES[0]!;
}
