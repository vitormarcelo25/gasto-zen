// Utilitários de Máscara Monetária Automática (estilo caixa eletrônico / app bancário)

/**
 * Converte dígitos brutos em formato de moeda em tempo real.
 * Exemplo:
 * '1' -> '0,01'
 * '10' -> '0,10'
 * '1000' -> '10,00'
 * '1010' -> '10,10'
 * '100050' -> '1.000,50'
 */
export const maskCurrency = (rawText) => {
  if (rawText === null || rawText === undefined || rawText === '') {
    return { formatted: '', floatValue: 0, digits: '' };
  }

  // Remove tudo que não for dígito
  const digits = String(rawText).replace(/\D/g, '');

  if (!digits || digits === '0') {
    return { formatted: '0,00', floatValue: 0, digits: '0' };
  }

  const cents = parseInt(digits, 10);
  const floatValue = cents / 100;

  const formatted = floatValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return { formatted, floatValue, digits };
};

/**
 * Converte um número decimal float para a string mascarada.
 * Exemplo: 10.5 -> '10,50'
 */
export const floatToMasked = (num) => {
  if (num === null || num === undefined || isNaN(num) || num === 0) {
    return '';
  }
  return Number(num).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Converte uma string formatada ('1.250,50') de volta para float (1250.50).
 */
export const maskedToFloat = (formattedStr) => {
  if (!formattedStr) return 0;
  const digits = String(formattedStr).replace(/\D/g, '');
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
};
