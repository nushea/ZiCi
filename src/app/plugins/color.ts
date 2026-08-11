import chroma from 'chroma-js';
import { ThemeKind } from '../hooks/useTheme';

export const accessibleColor = (themeKind: ThemeKind, color?: string): string => {
  if (!color) return themeKind === ThemeKind.Dark ? '#ffffff' : '#000000';
  if (!chroma.valid(color)) return color;

  let lightness = chroma(color).lab()[0];
  if (themeKind === ThemeKind.Dark && lightness < 60) {
    lightness = 60;
  }
  if (themeKind === ThemeKind.Light && lightness > 50) {
    lightness = 50;
  }

  return chroma(color).set('lab.l', lightness).hex();
};
