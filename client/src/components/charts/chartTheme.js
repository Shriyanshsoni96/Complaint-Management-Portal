import {
  Chart,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { useTheme } from '../../context/ThemeContext.jsx';

Chart.register(
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
);

// Validated categorical palette - see the dataviz skill's references/palette.md.
// Fixed order, never cycled or reassigned per series. Dark steps are the same
// eight hues re-stepped for the dark surface, validated separately.
export const CATEGORICAL = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];
export const CATEGORICAL_DARK = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'];

export const INK = {
  primary: '#0b0b0b',
  secondary: '#52514e',
  muted: '#898781',
  gridline: '#e1e0d9',
  baseline: '#c3c2b7',
};

export const INK_DARK = {
  primary: '#ffffff',
  secondary: '#c3c2b7',
  muted: '#898781',
  gridline: '#2c2c2a',
  baseline: '#383835',
};

export const chartFont = {
  family: 'system-ui, -apple-system, "Segoe UI", sans-serif',
};

export function useChartColors() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const categorical = isDark ? CATEGORICAL_DARK : CATEGORICAL;
  const ink = isDark ? INK_DARK : INK;

  return {
    categorical,
    ink,
    legendLabelDefaults: {
      color: ink.secondary,
      font: chartFont,
      usePointStyle: true,
      pointStyle: 'circle',
    },
    axisTickDefaults: {
      color: ink.muted,
      font: chartFont,
    },
  };
}
