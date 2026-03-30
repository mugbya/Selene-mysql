export interface ThemeOption {
  key: string;
  label: string;
  labelEn: string;
  icon: string;
  primary: string;
  background: string;
  border: string;
}

export const themeOptions: ThemeOption[] = [
  {
    key: 'light',
    label: '浅色',
    labelEn: 'Light',
    icon: '☀️',
    primary: '#3b82f6',
    background: '#ffffff',
    border: '#e5e7eb',
  },
  {
    key: 'dark',
    label: '深色',
    labelEn: 'Dark',
    icon: '🌙',
    primary: '#60a5fa',
    background: '#1f2937',
    border: '#374151',
  },
  {
    key: 'blue',
    label: '蓝色科技',
    labelEn: 'Blue',
    icon: '💙',
    primary: '#0ea5e9',
    background: '#f0f9ff',
    border: '#bae6fd',
  },
  {
    key: 'green',
    label: '绿色护眼',
    labelEn: 'Green',
    icon: '💚',
    primary: '#22c55e',
    background: '#f0fdf4',
    border: '#bbf7d0',
  },
  {
    key: 'purple',
    label: '紫色优雅',
    labelEn: 'Purple',
    icon: '💜',
    primary: '#a855f7',
    background: '#faf5ff',
    border: '#e9d5ff',
  },
  {
    key: 'orange',
    label: '橙色活力',
    labelEn: 'Orange',
    icon: '🧡',
    primary: '#f97316',
    background: '#fff7ed',
    border: '#fed7aa',
  },
];

// 主题色配置（保持兼容性）
export const themeColors: Record<string, { primary: string; background: string; border: string }> = {
  light: { primary: '#3b82f6', background: '#ffffff', border: '#e5e7eb' },
  dark: { primary: '#60a5fa', background: '#1f2937', border: '#374151' },
  blue: { primary: '#0ea5e9', background: '#f0f9ff', border: '#bae6fd' },
  green: { primary: '#22c55e', background: '#f0fdf4', border: '#bbf7d0' },
  purple: { primary: '#a855f7', background: '#faf5ff', border: '#e9d5ff' },
  orange: { primary: '#f97316', background: '#fff7ed', border: '#fed7aa' },
};