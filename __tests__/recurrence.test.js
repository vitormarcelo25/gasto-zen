import {
  generateRecurringTransactions,
  extendRecurringSeries,
  addMonthsClamped,
  generateId,
  RECURRENCE_HORIZON_MONTHS,
} from '../utils/recurrence';

const baseTx = (overrides = {}) => ({
  id: 'tx-base',
  type: 'expense',
  amount: 100,
  description: 'Mercado',
  category: 'Alimentação',
  categoryId: 'alimentacao',
  recurrence: 'single',
  date: new Date(2026, 9, 12, 12).toISOString(), // Segunda, 12/10/2026
  ...overrides,
});

describe('addMonthsClamped', () => {
  it('preserva o dia quando o mês de destino tem o mesmo tamanho', () => {
    const result = addMonthsClamped(new Date(2026, 10, 15), 1);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(11);
    expect(result.getDate()).toBe(15);
  });

  it('faz clamp para o último dia em meses mais curtos', () => {
    const result = addMonthsClamped(new Date(2026, 0, 31), 1);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(28); // 2026 não é bissexto
  });

  it('usa 29 em fevereiro bissexto', () => {
    const result = addMonthsClamped(new Date(2028, 0, 31), 1);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(29);
  });
});

describe('generateId', () => {
  it('gera ids únicos', () => {
    const ids = new Set(Array.from({ length: 500 }, () => generateId()));
    expect(ids.size).toBe(500);
  });
});

describe('generateRecurringTransactions', () => {
  it('retorna apenas a transação original quando é única', () => {
    const tx = baseTx();
    const result = generateRecurringTransactions(tx);
    expect(result).toEqual([tx]);
  });

  it('retorna a transação original quando não há data válida', () => {
    const tx = baseTx({ date: 'data-invalida' });
    expect(generateRecurringTransactions(tx)).toEqual([tx]);
  });

  it('expande recorrência semanal mantendo o dia da semana', () => {
    const result = generateRecurringTransactions(baseTx({ recurrence: 'weekly' }));
    const base = new Date(2026, 9, 12, 12);

    expect(result.length).toBeGreaterThanOrEqual(26);
    expect(result.length).toBeLessThanOrEqual(28);
    expect(result[0].id).toBe('tx-base');

    result.forEach((tx) => {
      expect(new Date(tx.date).getDay()).toBe(base.getDay());
      expect(tx.seriesId).toBe('tx-base');
      expect(tx.amount).toBe(100);
    });

    const ids = new Set(result.map((t) => t.id));
    expect(ids.size).toBe(result.length);

    // Todas dentro do horizonte de 6 meses
    const limit = addMonthsClamped(base, RECURRENCE_HORIZON_MONTHS);
    expect(new Date(result[result.length - 1].date).getTime()).toBeLessThanOrEqual(limit.getTime());
  });

  it('expande recorrência mensal com exatamente o horizonte de meses', () => {
    const tx = baseTx({ recurrence: 'monthly', date: new Date(2026, 0, 31, 12).toISOString() });
    const result = generateRecurringTransactions(tx);

    expect(result).toHaveLength(1 + RECURRENCE_HORIZON_MONTHS);
    expect(result[0].id).toBe('tx-base');

    // 31/jan → 28/fev → 31/mar → 31/abr ...
    expect(new Date(result[1].date).getMonth()).toBe(1);
    expect(new Date(result[1].date).getDate()).toBe(28);
    expect(new Date(result[2].date).getDate()).toBe(31);
    expect(new Date(result[2].date).getMonth()).toBe(2);
  });

  it('cada ocorrência futura tem id próprio e datas ascendentes', () => {
    const result = generateRecurringTransactions(baseTx({ recurrence: 'weekly' }));
    const dates = result.map((t) => new Date(t.date).getTime());

    for (let i = 1; i < dates.length; i++) {
      expect(dates[i]).toBeGreaterThan(dates[i - 1]);
    }
    expect(new Set(result.map((t) => t.id)).size).toBe(result.length);
  });

  it('respeita horizonte personalizado', () => {
    const result = generateRecurringTransactions(baseTx({ recurrence: 'monthly' }), 2);
    expect(result).toHaveLength(3);
  });
});

describe('extendRecurringSeries', () => {
  it('estende série mensal antiga até o novo horizonte', () => {
    // Série criada em jan/2026, com ocorrências até jul/2026 (6 meses).
    // Referência: out/2026 — precisa estender até abr/2027.
    const oldTx = baseTx({
      recurrence: 'monthly',
      seriesId: 'tx-base',
      date: new Date(2026, 0, 10, 12).toISOString(),
    });
    const existing = generateRecurringTransactions(oldTx); // jan..jul 2026

    const ref = new Date(2026, 9, 15, 12); // 15/out/2026
    const { transactions: result, added } = extendRecurringSeries(existing, 6, ref);

    // Última ocorrência existente: 10/jul/2026 → estende até 10/abr/2027 (limite: 15/abr/2027)
    expect(added.length).toBe(9); // ago, set, out, nov, dez 2026 + jan..abr 2027
    expect(result.length).toBe(existing.length + added.length);

    // Sem duplicatas por dia
    const keys = result.map((t) => {
      const d = new Date(t.date);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    });
    expect(new Set(keys).size).toBe(keys.length);

    // Ocorrências herdam campos da série
    added.forEach((t) => {
      expect(t.seriesId).toBe('tx-base');
      expect(t.amount).toBe(100);
      expect(t.id).not.toBe('tx-base');
    });
  });

  it('não duplica ocorrências que já existem', () => {
    const monthly = generateRecurringTransactions(
      baseTx({ recurrence: 'monthly', seriesId: 'tx-base' })
    );
    // Série vai até 12/abr/2027; horizonte a partir de 15/out/2026 termina em 15/abr/2027
    const ref = new Date(2026, 9, 15);
    const { transactions: result, added } = extendRecurringSeries(monthly, 6, ref);
    expect(added).toHaveLength(0);
    expect(result).toBe(monthly);
  });

  it('ignora transações únicas e listas vazias', () => {
    const single = [baseTx()];
    const r1 = extendRecurringSeries(single);
    expect(r1.added).toHaveLength(0);
    expect(r1.transactions).toBe(single);

    const r2 = extendRecurringSeries([]);
    expect(r2.added).toHaveLength(0);
    expect(r2.transactions).toEqual([]);
  });

  it('estende série semanal pelo dia da semana correto', () => {
    const weekly = generateRecurringTransactions(
      baseTx({ recurrence: 'weekly', seriesId: 'tx-base' })
    );
    // Ocorrências iniciais: 12/out/2026 + 6 meses
    const ref = new Date(2027, 2, 15, 12); // 15/mar/2027 (além do horizonte inicial)
    const { added } = extendRecurringSeries(weekly, 2, ref);

    expect(added.length).toBeGreaterThan(0);
    const baseDay = new Date(2026, 9, 12).getDay();
    added.forEach((t) => {
      expect(new Date(t.date).getDay()).toBe(baseDay);
    });
  });
});
