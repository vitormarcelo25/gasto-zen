import { formatMoney, getCurrencySymbol } from '../utils/format';

describe('getCurrencySymbol', () => {
  it('retorna o símbolo da moeda', () => {
    expect(getCurrencySymbol('BRL')).toBe('R$');
    expect(getCurrencySymbol('USD')).toBe('$');
    expect(getCurrencySymbol('EUR')).toBe('€');
    expect(getCurrencySymbol('JPY')).toBe('¥');
    expect(getCurrencySymbol('XXX')).toBe('R$');
  });
});

describe('formatMoney', () => {
  it('formata BRL no padrão brasileiro', () => {
    expect(formatMoney(1234.5, 'BRL')).toMatch(/R\$\s?1\.234,50/);
    expect(formatMoney(0, 'BRL')).toMatch(/R\$\s?0,00/);
    expect(formatMoney(-500.25, 'BRL')).toMatch(/-?R\$\s?500,25/);
  });

  it('formata USD no padrão americano', () => {
    expect(formatMoney(1234.5, 'USD')).toMatch(/\$1,234\.50/);
  });

  it('formata EUR sem casas decimais erradas', () => {
    expect(formatMoney(1234.5, 'EUR')).toMatch(/1[.,]234[.,]50/);
  });

  it('formata JPY sem casas decimais (moeda sem centavos)', () => {
    const formatted = formatMoney(1235, 'JPY');
    expect(formatted).toMatch(/1,235/);
    expect(formatted).not.toMatch(/[.,]\d{1,2}$/);
    expect(formatted).toMatch(/[/¥\uFFE5]/);
  });

  it('usa fallback manual quando Intl está indisponível', () => {
    const originalIntl = global.Intl;
    global.Intl = undefined;
    try {
      expect(formatMoney(1234.5, 'BRL')).toBe('R$ 1.234,50');
      expect(formatMoney(1234.5, 'USD')).toBe('$1,234.50');
      expect(formatMoney(1235, 'JPY')).toBe('¥1,235');
      expect(formatMoney(-10, 'BRL')).toBe('-R$ 10,00');
    } finally {
      global.Intl = originalIntl;
    }
  });

  it('usa fallback quando a moeda é desconhecida pelo Intl', () => {
    expect(formatMoney(5, 'XXX')).toMatch(/5,00/);
  });

  it('trata valores inválidos como zero', () => {
    expect(formatMoney(undefined, 'BRL')).toMatch(/0,00/);
    expect(formatMoney('abc', 'BRL')).toMatch(/0,00/);
    expect(formatMoney(null, 'BRL')).toMatch(/0,00/);
  });
});
