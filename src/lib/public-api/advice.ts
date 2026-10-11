/**
 * Lectura del clima para el menú. Solo cambia el texto de sugerencias;
 * nunca altera el planificador ni los precios.
 */

import type { DayForecast } from "./parsers.ts";

export type WeatherKind = "clear" | "cloudy" | "fog" | "drizzle" | "rain" | "snow" | "storm";

export function describeWeather(code: number | null): { kind: WeatherKind; label: string } {
  if (code === null) return { kind: "cloudy", label: "Sin dato" };
  if (code === 0) return { kind: "clear", label: "Despejado" };
  if (code === 1) return { kind: "clear", label: "Mayormente despejado" };
  if (code === 2) return { kind: "cloudy", label: "Parcialmente nublado" };
  if (code === 3) return { kind: "cloudy", label: "Nublado" };
  if (code === 45 || code === 48) return { kind: "fog", label: "Niebla" };
  if (code >= 51 && code <= 57) return { kind: "drizzle", label: "Llovizna" };
  if (code >= 61 && code <= 67) return { kind: "rain", label: "Lluvia" };
  if (code >= 71 && code <= 77) return { kind: "snow", label: "Nieve" };
  if (code >= 80 && code <= 82) return { kind: "rain", label: "Chubascos" };
  if (code === 85 || code === 86) return { kind: "snow", label: "Nevadas" };
  if (code === 95) return { kind: "storm", label: "Tormenta" };
  if (code === 96 || code === 99) return { kind: "storm", label: "Tormenta con granizo" };
  return { kind: "cloudy", label: "Variable" };
}

export type MenuTip = {
  tone: "hot" | "rain" | "cold" | "mild";
  title: string;
  body: string;
};

const RAINY_CODES = new Set([
  51, 52, 53, 54, 55, 56, 57, 61, 62, 63, 64, 65, 66, 67, 80, 81, 82, 95, 96, 99,
]);

export function menuTip(day: DayForecast): MenuTip {
  const rainy = (day.precip ?? 0) >= 60 || (day.code !== null && RAINY_CODES.has(day.code));
  if (day.tmax >= 30) {
    return {
      tone: "hot",
      title: "Día caluroso",
      body: "Agua de jamaica bien fría y ensaladas en la comida. Cena ligera.",
    };
  }
  if (rainy) {
    return {
      tone: "rain",
      title: "Día de lluvia",
      body: "Un caldo o sopa caliente en la comida, y cena calientita.",
    };
  }
  if (day.tmin <= 14) {
    return {
      tone: "cold",
      title: "Mañana fresca",
      body: "Avena con plátano o huevos calientes para empezar el día.",
    };
  }
  return {
    tone: "mild",
    title: "Clima templado",
    body: "El menú de siempre: equilibrado y sin prisas.",
  };
}
