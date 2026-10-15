import { maskCurrency, floatToMasked, maskedToFloat } from '../utils/mask';

describe('maskCurrency', () => {
  it('converte dígitos brutos para formato brasileiro', () => {
    expect(maskCurrency('1')).toEqual({ formatted: '0,01', floatValue: 0.01, digits: '1' });
    expect(maskCurrency('10')).toEqual({ formatted: '0,10', floatValue: 0.1, digits: '10' });
    expect(maskCurrency('1000')).toEqual({ formatted: '10,00', floatValue: 10, digits: '1000' });
    expect(maskCurrency('100050')).toEqual({ formatted: '1.000,50', floatValue: 1000.5, digits: '100050' });
  });

  it('ignora caracteres não numéricos', () => {
    expect(maskCurrency('R$ 12,34').floatValue).toBe(12.34);
    expect(maskCurrency('12a3b4').floatValue).toBe(12.34);
  });

  it('trata entrada vazia e zero', () => {
    expect(maskCurrency('')).toEqual({ formatted: '', floatValue: 0, digits: '' });
    expect(maskCurrency('0')).toEqual({ formatted: '0,00', floatValue: 0, digits: '0' });
  });
});

describe('floatToMasked', () => {
  it('formata números no padrão brasileiro', () => {
    expect(floatToMasked(10.5)).toBe('10,50');
    expect(floatToMasked(1250)).toBe('1.250,00');
    expect(floatToMasked(0)).toBe('');
    expect(floatToMasked(null)).toBe('');
    expect(floatToMasked(undefined)).toBe('');
    expect(floatToMasked('abc')).toBe('');
  });
});

describe('maskedToFloat', () => {
  it('converte string formatada de volta para número', () => {
    expect(maskedToFloat('1.250,50')).toBe(1250.5);
    expect(maskedToFloat('10,10')).toBe(10.1);
    expect(maskedToFloat('')).toBe(0);
    expect(maskedToFloat(null)).toBe(0);
  });

  it('faz ida e volta sem perda', () => {
    expect(maskedToFloat(floatToMasked(87.45))).toBe(87.45);
    expect(maskedToFloat(floatToMasked(1000000.99))).toBe(1000000.99);
  });
});
