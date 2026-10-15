// Formatação monetária correta por moeda (locale, símbolo e casas decimais)

import { CURRENCIES } from '../constants/categories';

const CURRENCY_LOCALES = {
  BRL: 'pt-BR',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  JPY: 'ja-JP',
};

const CURRENCY_DECIMALS = {
  JPY: 0,
};

const getFallbackDecimals = (code) => (code in CURRENCY_DECIMALS ? CURRENCY_DECIMALS[code] : 2);

// Formatação manual usada apenas quando Intl não está disponível no runtime
const manualFormat = (num, symbol, decimals, isBRL) => {
  const fixed = Math.abs(num).toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const signal = num < 0 ? '-' : '';
  const body = decPart ? `${grouped}.${decPart}` : grouped;
  if (isBRL) return `${signal}${symbol} ${body}`;
  return `${signal}${symbol}${body}`;
};

export const getCurrencySymbol = (code) => {
  const found = CURRENCIES.find((c) => c.code === code);
  return found ? found.symbol : 'R$';
};

export const formatMoney = (value, currencyCode = 'BRL') => {
  const num = Number(value) || 0;
  const decimals = getFallbackDecimals(currencyCode);
  const symbol = getCurrencySymbol(currencyCode);

  try {
    if (typeof Intl !== 'undefined' && typeof Intl.NumberFormat === 'function') {
      const locale = CURRENCY_LOCALES[currencyCode] || 'pt-BR';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(num);
    }
  } catch (e) {
    // Intl indisponível ou moeda inválida: cai no formato manual
  }

  return manualFormat(num, symbol, decimals, currencyCode === 'BRL');
};
