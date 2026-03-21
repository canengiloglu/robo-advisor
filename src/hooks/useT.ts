import { useSettingsStore } from '../store/settingsStore';
import { translations } from '../i18n/translations';

export const useT = () => {
  const language = useSettingsStore(s => s.language);
  return translations[language];
};
