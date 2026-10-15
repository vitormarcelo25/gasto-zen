import {
  toDateKey,
  isSameWeek,
  isSameMonth,
  getCurrentWeekDays,
  calculateWeeklyStats,
  calculateMonthProjection,
  calculateCategoryBreakdown,
} from '../utils/calculations';

// Datas locais (12h evita problemas de fuso; 0h testa o toDateKey)
const d = (y, m, day, h = 12) => new Date(y, m, day, h);

describe('toDateKey', () => {
  it('gera a chave no fuso local (sem conversão UTC)', () => {
    expect(toDateKey(d(2026, 0, 5, 0))).toBe('2026-01-05');
    expect(toDateKey(d(2026, 11, 31, 0))).toBe('2026-12-31');
  });

  it('não anda um dia para trás à meia-noite em fusos negativos', () => {
    // Regressão: toISOString() em UTC-3 retornaria '2026-10-11' para 00:00 local
    expect(toDateKey(d(2026, 9, 12, 0))).toBe('2026-10-12');
  });
});

describe('isSameWeek (Segunda a Domingo)', () => {
  // 12/10/2026 = Segunda, 15/10/2026 = Quinta, 18/10/2026 = Domingo
  it('reconhece dias da mesma semana', () => {
    expect(isSameWeek(d(2026, 9, 12), d(2026, 9, 15))).toBe(true);
    expect(isSameWeek(d(2026, 9, 18), d(2026, 9, 15))).toBe(true);
  });

  it('separa semanas adjacentes', () => {
    expect(isSameWeek(d(2026, 9, 11), d(2026, 9, 12))).toBe(false);
    expect(isSameWeek(d(2026, 9, 19), d(2026, 9, 15))).toBe(false);
  });
});

describe('isSameMonth', () => {
  it('compara mês e ano', () => {
    expect(isSameMonth(d(2026, 9, 1), d(2026, 9, 31))).toBe(true);
    expect(isSameMonth(d(2026, 8, 30), d(2026, 9, 1))).toBe(false);
    expect(isSameMonth(d(2026, 9, 1), d(2025, 9, 1))).toBe(false);
  });
});

describe('getCurrentWeekDays', () => {
  it('retorna Segunda a Domingo com datas locais corretas', () => {
    const days = getCurrentWeekDays(new Date(2026, 9, 12, 0, 0, 0));
    expect(days).toHaveLength(7);
    expect(days[0].dayName).toBe('Seg');
    expect(days[0].dateString).toBe('2026-10-12');
    expect(days[6].dayName).toBe('Dom');
    expect(days[6].date.getDate()).toBe(18);
    expect(days[0].isToday).toBe(false); // hoje real não é 12/10/2026 garantido
  });
});

describe('calculateWeeklyStats', () => {
  const ref = d(2026, 9, 15); // Quinta-feira
  const txs = [
    { id: 'a', type: 'expense', amount: 50, category: 'Lazer', date: d(2026, 9, 12).toISOString() },
    { id: 'b', type: 'expense', amount: 30, category: 'Transporte', date: d(2026, 9, 15).toISOString() },
    { id: 'c', type: 'income', amount: 200, category: 'Salário', date: d(2026, 9, 15).toISOString() },
    { id: 'd', type: 'expense', amount: 999, category: 'Outros', date: d(2026, 9, 5).toISOString() },
  ];

  const stats = calculateWeeklyStats(txs, ref);

  it('agrega despesas e receitas da semana correta', () => {
    expect(stats.weeklyExpense).toBe(80);
    expect(stats.weeklyIncome).toBe(200);
    expect(stats.weeklyBalance).toBe(120);
    expect(stats.transactionCount).toBe(3);
  });

  it('mapeia os 7 dias com valores por dia', () => {
    expect(stats.dailyData).toHaveLength(7);
    expect(stats.dailyData[0].expense).toBe(50); // Segunda
    expect(stats.dailyData[3].expense).toBe(30); // Quinta
    expect(stats.dailyData[3].income).toBe(200);
    expect(stats.dailyData[0].topCategory).toBe('Lazer');
  });

  it('identifica o dia de maior gasto e a semana anterior', () => {
    expect(stats.highestExpenseDay.expense).toBe(50);
    expect(stats.previousWeekExpense).toBe(999);
  });
});

describe('calculateMonthProjection', () => {
  const ref = new Date(2026, 9, 10, 12); // dia 10, outubro (31 dias)
  const txs = [
    { id: 'e1', type: 'expense', amount: 100, date: new Date(2026, 9, 1).toISOString() },
    { id: 'i1', type: 'income', amount: 1000, date: new Date(2026, 9, 1).toISOString() },
  ];

  it('projeta gasto e sobra do fim de mês', () => {
    const p = calculateMonthProjection(txs, { baseSalary: 1000, salaryType: 'monthly', savingsGoal: 0 }, ref);

    expect(p.daysPassed).toBe(10);
    expect(p.daysRemaining).toBe(21);
    expect(p.totalDaysInMonth).toBe(31);
    expect(p.monthExpense).toBe(100);
    expect(p.monthIncome).toBe(1000);
    expect(p.averageDailyExpense).toBe(10);
    expect(p.projectedTotalExpense).toBeCloseTo(310, 5);
    expect(p.projectedEndBalance).toBeCloseTo(690, 5);
    expect(p.totalProjectedIncome).toBe(1000);
    expect(p.recommendedDailyBudget).toBeCloseTo(900 / 21, 5);
    expect(p.projectedSavingsRate).toBe(69);
    expect(p.status.level).toBe('safe');
  });

  it('multiplica salário semanal por 4 na renda esperada', () => {
    const p = calculateMonthProjection([], { baseSalary: 400, salaryType: 'weekly', savingsGoal: 0 }, ref);
    expect(p.totalProjectedIncome).toBe(1600);
  });

  it('fica em alerta quando a taxa de poupança é baixa', () => {
    const p = calculateMonthProjection([], {}, ref);
    expect(p.status.level).toBe('warning');
  });

  it('fica em perigo quando o ritmo de gasto estoura a renda', () => {
    const txsDanger = [{ id: 'x', type: 'expense', amount: 5000, date: new Date(2026, 9, 1).toISOString() }];
    const p = calculateMonthProjection(txsDanger, { baseSalary: 1000, salaryType: 'monthly', savingsGoal: 0 }, ref);
    expect(p.status.level).toBe('danger');
    expect(p.projectedEndBalance).toBeLessThan(0);
  });
});

describe('calculateCategoryBreakdown', () => {
  const ref = d(2026, 9, 15);
  const txs = [
    { id: '1', type: 'expense', amount: 60, category: 'Alimentação', date: d(2026, 9, 1).toISOString() },
    { id: '2', type: 'expense', amount: 40, category: 'Transporte', date: d(2026, 9, 2).toISOString() },
    { id: '3', type: 'expense', amount: 30, category: 'Lazer', date: d(2026, 8, 30).toISOString() },
    { id: '4', type: 'income', amount: 100, category: 'Salário', date: d(2026, 9, 1).toISOString() },
    { id: '5', type: 'expense', amount: 20, category: 'Lazer', date: d(2026, 9, 13).toISOString() },
  ];

  it('agrupa apenas despesas do mês com percentuais ordenados', () => {
    const b = calculateCategoryBreakdown(txs, 'month', ref);
    expect(b.totalExpense).toBe(120);
    expect(b.categories[0].category).toBe('Alimentação');
    expect(b.categories[0].percentage).toBe(50);
    expect(b.categories[1].percentage).toBe(33);
    expect(b.categories[1].category).toBe('Transporte');
  });

  it('restringe à semana correta no período semanal', () => {
    const b = calculateCategoryBreakdown(txs, 'week', ref);
    expect(b.totalExpense).toBe(20);
    expect(b.categories).toHaveLength(1);
    expect(b.categories[0].category).toBe('Lazer');
  });
});
