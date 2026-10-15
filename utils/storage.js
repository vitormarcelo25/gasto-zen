import AsyncStorage from '@react-native-async-storage/async-storage';

const TRANSACTIONS_KEY = '@gasto_zen:transactions';
const SETTINGS_KEY = '@gasto_zen:settings';

export const saveTransactions = async (transactions) => {
  try {
    const jsonValue = JSON.stringify(transactions);
    await AsyncStorage.setItem(TRANSACTIONS_KEY, jsonValue);
  } catch (e) {
    console.error('Erro ao salvar transações:', e);
  }
};

export const loadTransactions = async (fallbackData = []) => {
  try {
    const jsonValue = await AsyncStorage.getItem(TRANSACTIONS_KEY);
    if (jsonValue != null) {
      const parsed = JSON.parse(jsonValue);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    return fallbackData;
  } catch (e) {
    console.error('Erro ao carregar transações:', e);
    return fallbackData;
  }
};

export const saveSettings = async (settings) => {
  try {
    const jsonValue = JSON.stringify(settings);
    await AsyncStorage.setItem(SETTINGS_KEY, jsonValue);
  } catch (e) {
    console.error('Erro ao salvar configurações:', e);
  }
};

export const loadSettings = async (fallbackSettings = {}) => {
  try {
    const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
    return jsonValue != null ? { ...fallbackSettings, ...JSON.parse(jsonValue) } : fallbackSettings;
  } catch (e) {
    console.error('Erro ao carregar configurações:', e);
    return fallbackSettings;
  }
};
