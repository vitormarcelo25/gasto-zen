import { addMonthsClamped, generateId } from './recurrence';

export const DEFAULT_CARD_SETTINGS = {
  name: 'Meu Cartão',
  closingDay: 10,  // Dia de fechamento da fatura
  dueDay: 17,      // Dia de vencimento da fatura
  limit: 2500,     // Limite total do cartão
  color: '#6366F1', // Cor do cartão
};

/**
 * Determina a data da fatura com base na data da compra e no dia de fechamento.
 * Se a compra foi feita após o dia de fechamento, cai na fatura do mês seguinte.
 */
export const getInvoiceDate = (purchaseDate, closingDay = 10, dueDay = 17) => {
  const pDate = new Date(purchaseDate);
  if (Number.isNaN(pDate.getTime())) return new Date();

  const day = pDate.getDate();
  const year = pDate.getFullYear();
  const month = pDate.getMonth();

  let targetYear = year;
  let targetMonth = month;

  // Se o dia da compra for estritamente maior que o fechamento, fatura fecha no mês seguinte
  if (day > closingDay) {
    targetMonth += 1;
    if (targetMonth > 11) {
      targetMonth = 0;
      targetYear += 1;
    }
  }

  // Data de vencimento no mês correspondente
  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
  const clampedDueDay = Math.min(dueDay, lastDay);
  return new Date(targetYear, targetMonth, clampedDueDay, 12, 0, 0);
};

/**
 * Gera transações parceladas a partir de uma compra no cartão de crédito.
 * Distribui as parcelas mês a mês conforme os ciclos de fatura.
 */
export const generateInstallmentTransactions = (txPayload, cardSettings = DEFAULT_CARD_SETTINGS) => {
  const totalAmount = Number(txPayload.amount) || 0;
  const installmentsCount = Math.max(1, parseInt(txPayload.installmentsCount || 1, 10));

  if (installmentsCount === 1) {
    const invoiceDate = getInvoiceDate(
      txPayload.date || new Date(),
      cardSettings.closingDay,
      cardSettings.dueDay
    );
    return [{
      ...txPayload,
      type: txPayload.type || 'expense',
      paymentMethod: 'credit',
      installmentsCount: 1,
      installmentIndex: 1,
      invoiceDate: invoiceDate.toISOString(),
      date: invoiceDate.toISOString(), // para cair no mês da fatura
      purchaseDate: txPayload.date || new Date().toISOString(),
    }];
  }

  const parentId = txPayload.id || generateId();
  const installmentAmount = Math.round((totalAmount / installmentsCount) * 100) / 100;
  
  // Ajuste do centavo na última parcela para a soma ser exata
  const totalRounded = installmentAmount * installmentsCount;
  const difference = Math.round((totalAmount - totalRounded) * 100) / 100;

  const baseInvoiceDate = getInvoiceDate(
    txPayload.date || new Date(),
    cardSettings.closingDay,
    cardSettings.dueDay
  );

  const transactions = [];

  for (let i = 0; i < installmentsCount; i++) {
    const isLast = i === installmentsCount - 1;
    const finalAmt = isLast ? installmentAmount + difference : installmentAmount;
    const nextInvoiceDate = addMonthsClamped(baseInvoiceDate, i);

    transactions.push({
      ...txPayload,
      id: i === 0 ? parentId : generateId(),
      type: txPayload.type || 'expense',
      installmentParentId: parentId,
      installmentsCount,
      installmentIndex: i + 1,
      totalPurchaseAmount: totalAmount,
      amount: finalAmt,
      paymentMethod: 'credit',
      description: `${txPayload.description} (${i + 1}/${installmentsCount})`,
      originalDescription: txPayload.description,
      invoiceDate: nextInvoiceDate.toISOString(),
      date: nextInvoiceDate.toISOString(), // data da parcela na fatura respectiva
      purchaseDate: txPayload.date || new Date().toISOString(),
    });
  }

  return transactions;
};

/**
 * Calcula o resumo consolidado de cartões, faturas, dívida total restante e parcelas ativas.
 */
export const calculateCardSummary = (transactions = [], cardSettings = DEFAULT_CARD_SETTINGS, referenceDate = new Date()) => {
  const ref = new Date(referenceDate);
  const currentYear = ref.getFullYear();
  const currentMonth = ref.getMonth();

  const creditTransactions = transactions.filter(t => t.paymentMethod === 'credit' && (t.type === 'expense' || !t.type));

  let currentInvoiceAmount = 0;
  let futureDebtRemaining = 0;
  let totalSpentOnCard = 0;

  // Mapa de parcelas agrupadas por compra pai
  const installmentGroups = new Map();
  const subscriptions = [];

  creditTransactions.forEach(t => {
    const amt = Number(t.amount) || 0;
    totalSpentOnCard += amt;

    const tDate = new Date(t.date || t.invoiceDate || ref);
    const isCurrentInvoice = tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth;
    const isFutureInvoice = (tDate.getFullYear() > currentYear) || 
      (tDate.getFullYear() === currentYear && tDate.getMonth() > currentMonth);

    if (isCurrentInvoice) {
      currentInvoiceAmount += amt;
    }

    if (t.isSubscription) {
      if (isCurrentInvoice || !subscriptions.some(s => s.description === t.description)) {
        subscriptions.push(t);
      }
    }

    // Compras parceladas
    if (t.installmentsCount && t.installmentsCount > 1) {
      const parentKey = t.installmentParentId || t.originalDescription || t.id;
      
      if (!installmentGroups.has(parentKey)) {
        installmentGroups.set(parentKey, {
          parentId: parentKey,
          description: t.originalDescription || t.description.replace(/\s*\(\d+\/\d+\)$/, ''),
          installmentsCount: t.installmentsCount,
          totalPurchaseAmount: t.totalPurchaseAmount || (amt * t.installmentsCount),
          monthlyAmount: amt,
          category: t.category,
          purchaseDate: t.purchaseDate || t.date,
          paidInstallments: 0,
          remainingInstallments: 0,
          paidAmount: 0,
          remainingAmount: 0,
          installments: [],
        });
      }

      const group = installmentGroups.get(parentKey);
      group.installments.push(t);

      // Se a parcela já venceu (mês anterior ou atual), consideramos paga/faturada
      if (tDate.getFullYear() < currentYear || (tDate.getFullYear() === currentYear && tDate.getMonth() <= currentMonth)) {
        group.paidInstallments += 1;
        group.paidAmount += amt;
      } else {
        group.remainingInstallments += 1;
        group.remainingAmount += amt;
        futureDebtRemaining += amt;
      }
    }
  });

  const activeInstallments = Array.from(installmentGroups.values()).map(g => {
    // Garante que o total de parcelas restantes seja consistente
    const remainingCount = Math.max(0, g.installmentsCount - g.paidInstallments);
    const remainingVal = remainingCount * g.monthlyAmount;
    return {
      ...g,
      remainingInstallments: remainingCount,
      remainingAmount: remainingVal,
      progressPct: Math.min(100, Math.round((g.paidInstallments / g.installmentsCount) * 100)),
    };
  }).filter(g => g.remainingInstallments > 0 || g.paidInstallments > 0);

  // Limite disponível
  const cardLimit = Number(cardSettings.limit) || 0;
  // O que compromete o limite: fatura atual + parcelas futuras
  const totalCommitted = currentInvoiceAmount + futureDebtRemaining;
  const availableLimit = Math.max(0, cardLimit - totalCommitted);
  const limitUsedPct = cardLimit > 0 ? Math.min(100, Math.round((totalCommitted / cardLimit) * 100)) : 0;

  return {
    currentInvoiceAmount,
    futureDebtRemaining,
    totalCommitted,
    availableLimit,
    cardLimit,
    limitUsedPct,
    activeInstallments,
    subscriptions,
    totalSpentOnCard,
  };
};
