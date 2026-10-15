// Geração de transações recorrentes (semanais e mensais)
// Ao criar uma transação recorrente, materializamos as ocorrências futuras
// para um horizonte configurado, mantendo cada ocorrência editável/excluível.

export const RECURRENCE_HORIZON_MONTHS = 6;

// Limite de segurança para o laço semanal (~10 anos)
const MAX_WEEKLY_STEPS = 520;

export const generateId = () =>
  `tx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

/**
 * Soma meses preservando o dia do mês, com clamp para meses mais curtos.
 * Ex: 31/jan + 1 mês = 28/fev (ou 29 em bissexto).
 */
export const addMonthsClamped = (date, months) => {
  const d = new Date(date);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDayOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDayOfMonth));
  return d;
};

/**
 * Expande uma transação recorrente em suas ocorrências.
 * Retorna sempre um array cujo primeiro elemento é a transação base.
 * - 'single'  → apenas a própria transação
 * - 'weekly'  → ocorrências semanais até base + horizonte
 * - 'monthly' → uma ocorrência por mês até base + horizonte
 */
export const generateRecurringTransactions = (
  transaction,
  horizonMonths = RECURRENCE_HORIZON_MONTHS
) => {
  if (!transaction) return [];

  const recurrence = transaction.recurrence || 'single';
  if (recurrence === 'single') return [transaction];

  const baseDate = new Date(transaction.date);
  if (Number.isNaN(baseDate.getTime())) return [transaction];

  const base = { ...transaction, seriesId: transaction.id };
  const occurrences = [base];

  if (recurrence === 'weekly') {
    const limit = addMonthsClamped(baseDate, horizonMonths);
    let step = 1;
    while (step <= MAX_WEEKLY_STEPS) {
      const next = new Date(baseDate);
      next.setDate(next.getDate() + step * 7);
      if (next.getTime() > limit.getTime()) break;
      occurrences.push({ ...base, id: generateId(), date: next.toISOString() });
      step += 1;
    }
  } else if (recurrence === 'monthly') {
    for (let i = 1; i <= horizonMonths; i++) {
      const next = addMonthsClamped(baseDate, i);
      occurrences.push({ ...base, id: generateId(), date: next.toISOString() });
    }
  }

  return occurrences;
};
