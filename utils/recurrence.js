// Geração de transações recorrentes (semanais e mensais)
// Ao criar uma transação recorrente, materializamos as ocorrências futuras
// para um horizonte configurado, mantendo cada ocorrência editável/excluível.

export const RECURRENCE_HORIZON_MONTHS = 6;

// Limite de segurança para o laço semanal (~10 anos)
const MAX_WEEKLY_STEPS = 520;
// Limite de segurança para o laço mensal (~10 anos)
const MAX_MONTHLY_STEPS = 120;

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

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/**
 * Estende séries recorrentes existentes até referenceDate + horizonte.
 * Não duplica ocorrências por dia. Retorna { transactions, added }.
 */
export const extendRecurringSeries = (
  transactions,
  horizonMonths = RECURRENCE_HORIZON_MONTHS,
  referenceDate = new Date()
) => {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return { transactions: transactions || [], added: [] };
  }

  const seriesMap = new Map();
  transactions.forEach((t) => {
    if (!t.seriesId || !t.recurrence || t.recurrence === 'single') return;
    const list = seriesMap.get(t.seriesId) || [];
    list.push(t);
    seriesMap.set(t.seriesId, list);
  });

  if (seriesMap.size === 0) {
    return { transactions, added: [] };
  }

  const ref = new Date(referenceDate);
  const limit = addMonthsClamped(ref, horizonMonths).getTime();
  const added = [];

  seriesMap.forEach((items) => {
    const template = items.find((t) => t.recurrence === 'weekly' || t.recurrence === 'monthly') || items[0];
    if (!template) return;

    let latest = new Date(template.date);
    items.forEach((t) => {
      const d = new Date(t.date);
      if (!Number.isNaN(d.getTime()) && d.getTime() > latest.getTime()) latest = d;
    });
    if (Number.isNaN(latest.getTime())) return;

    const existing = new Set(items.map((t) => dayKey(new Date(t.date))));

    const pushIfNew = (date) => {
      if (date.getTime() > limit) return false;
      const key = dayKey(date);
      if (!existing.has(key)) {
        const occurrence = { ...template, id: generateId(), date: date.toISOString() };
        added.push(occurrence);
        existing.add(key);
      }
      return true;
    };

    if (template.recurrence === 'weekly') {
      let step = 1;
      while (step <= MAX_WEEKLY_STEPS) {
        const next = new Date(latest);
        next.setDate(next.getDate() + step * 7);
        if (next.getTime() > limit) break;
        pushIfNew(next);
        step += 1;
      }
    } else if (template.recurrence === 'monthly') {
      let i = 1;
      while (i <= MAX_MONTHLY_STEPS) {
        const next = addMonthsClamped(latest, i);
        if (next.getTime() > limit) break;
        pushIfNew(next);
        i += 1;
      }
    }
  });

  if (added.length === 0) return { transactions, added: [] };
  return { transactions: [...added, ...transactions], added };
};
