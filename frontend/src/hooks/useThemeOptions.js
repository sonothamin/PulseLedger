import { LaptopFill, SunFill, MoonFill } from 'react-bootstrap-icons';

export default function getThemeOptions(t) {
  return [
    { value: 'system', label: t('themeSystem'), icon: LaptopFill },
    { value: 'light', label: t('themeLight'), icon: SunFill },
    { value: 'dark', label: t('themeDark'), icon: MoonFill },
  ];
} 