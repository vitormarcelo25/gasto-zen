import { addMonthsClamped, generateId } from './recurrence';

export const DEFAULT_CARD_SETTINGS = {
  id: 'card-1',
  name: 'Meu Cartão',
  closingDay: 10,  // Dia de fechamento da fatura
  dueDay: 17,      // Dia de vencimento da fatura
  limit: 2500,     // Limite total do cartão
  color: '#6366F1', // Cor do cartão
};

export const generateCardId = () =>
  `card-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * Migra o formato antigo (settings.card único) para a lista settings.cards.
 * Prioriza `cards` já existente; senão converte `card`; senão usa o default.
 */
export const migrateCards = (settings) => {
  if (Array.isArray(settings?.cards) && settings.cards.length > 0) {
    return settings.cards.map((c, i) => ({
      ...DEFAULT_CARD_SETTINGS,
      ...c,
      id: c.id || (i === 0 ? DEFAULT_CARD_SETTINGS.id : generateCardId()),
    }));
  }

  if (settings?.card && typeof settings.card === 'object') {
    return [{ ...DEFAULT_CARD_SETTINGS, ...settings.card, id: settings.card.id || DEFAULT_CARD_SETTINGS.id }];
  }

  return [DEFAULT_CARD_SETTINGS];
};

/**
 * Filtra as transações de crédito de um cartão específico.
 * Transações legadas sem cardId pertencem ao primeiro cartão (fallbackCardId).
 */
export const filterCardTransactions = (transactions = [], cardId, fallbackCardId = null) =>
  transactions.filter(
    (t) =>
      t.paymentMethod === 'credit' &&
      (t.cardId === cardId || (!t.cardId && cardId === fallbackCardId))
  );

/**
 * Ao excluir um cartão, realoca as transações dele para o cartão restante.
 * Inclui transações legadas sem cardId quando o cartão excluído é o primeiro.
 */
export const reassignTransactionsCardId = (transactions = [], cards = [], fromCardId, toCardId) => {
  const firstCardId = cards[0]?.id || null;
  return transactions.map((t) => {
    if (t.paymentMethod !== 'credit') return t;
    const currentCardId = t.cardId || firstCardId;
    if (currentCardId !== fromCardId) return t;
    return { ...t, cardId: toCardId };
  });
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

  const cardId = cardSettings?.id || DEFAULT_CARD_SETTINGS.id;

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
      cardId,
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
      cardId,
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
          cardId: t.cardId || null,
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
