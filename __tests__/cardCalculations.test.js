import {
  getInvoiceDate,
  generateInstallmentTransactions,
  calculateCardSummary,
  migrateCards,
  filterCardTransactions,
  reassignTransactionsCardId,
  DEFAULT_CARD_SETTINGS,
} from '../utils/cardCalculations';

describe('migrateCards', () => {
  it('mantém a lista cards quando já existe', () => {
    const cards = migrateCards({
      cards: [
        { id: 'a', name: 'Nubank', closingDay: 5, dueDay: 12, limit: 1000, color: '#111' },
        { id: 'b', name: 'Inter', closingDay: 8, dueDay: 15, limit: 2000, color: '#222' },
      ],
    });
    expect(cards).toHaveLength(2);
    expect(cards[0].name).toBe('Nubank');
    expect(cards[1].name).toBe('Inter');
  });

  it('converte o formato antigo settings.card para uma lista com um cartão', () => {
    const cards = migrateCards({
      card: { name: 'Itaú', closingDay: 20, dueDay: 27, limit: 5000, color: '#F00' },
    });
    expect(cards).toHaveLength(1);
    expect(cards[0].name).toBe('Itaú');
    expect(cards[0].closingDay).toBe(20);
    expect(cards[0].id).toBe('card-1');
  });

  it('usa o cartão padrão quando não há nada salvo', () => {
    const cards = migrateCards({});
    expect(cards).toHaveLength(1);
    expect(cards[0]).toEqual(DEFAULT_CARD_SETTINGS);
  });

  it('preenche ids ausentes na lista existente', () => {
    const cards = migrateCards({ cards: [{ name: 'Sem Id' }] });
    expect(cards[0].id).toBeTruthy();
    expect(cards[0].closingDay).toBe(10); // defaults preenchidos
  });
});

describe('filterCardTransactions', () => {
  it('filtra por cardId e atribui legadas sem cardId ao cartão fallback', () => {
    const txs = [
      { id: '1', paymentMethod: 'credit', cardId: 'a', amount: 100 },
      { id: '2', paymentMethod: 'credit', cardId: 'b', amount: 200 },
      { id: '3', paymentMethod: 'credit', amount: 300 }, // legada
      { id: '4', paymentMethod: 'cash', amount: 400 },
    ];

    const forA = filterCardTransactions(txs, 'a', 'a');
    expect(forA.map((t) => t.id)).toEqual(['1', '3']);

    const forB = filterCardTransactions(txs, 'b', 'a');
    expect(forB.map((t) => t.id)).toEqual(['2']);
  });
});

describe('reassignTransactionsCardId', () => {
  it('realoca transações do cartão excluído para o restante', () => {
    const cards = [{ id: 'a' }, { id: 'b' }];
    const txs = [
      { id: '1', paymentMethod: 'credit', cardId: 'a' },
      { id: '2', paymentMethod: 'credit', cardId: 'b' },
      { id: '3', paymentMethod: 'cash' },
    ];

    const result = reassignTransactionsCardId(txs, cards, 'a', 'b');
    expect(result.find((t) => t.id === '1').cardId).toBe('b');
    expect(result.find((t) => t.id === '2').cardId).toBe('b');
    expect(result.find((t) => t.id === '3').cardId).toBeUndefined();
  });

  it('inclui legadas sem cardId quando o primeiro cartão é excluído', () => {
    const cards = [{ id: 'a' }, { id: 'b' }];
    const txs = [
      { id: '1', paymentMethod: 'credit' }, // legada → primeiro cartão
      { id: '2', paymentMethod: 'credit', cardId: 'b' },
    ];

    const result = reassignTransactionsCardId(txs, cards, 'a', 'b');
    expect(result.find((t) => t.id === '1').cardId).toBe('b');
  });
});

describe('cardCalculations', () => {
  describe('getInvoiceDate', () => {
    it('mantém fatura no mesmo mês se compra for antes ou no dia do fechamento', () => {
      // Compra dia 5 de outubro, fechamento dia 10, vencimento dia 17
      const purchase = new Date(2026, 9, 5); // 05/Outubro
      const invoice = getInvoiceDate(purchase, 10, 17);
      expect(invoice.getMonth()).toBe(9); // Outubro
      expect(invoice.getDate()).toBe(17);
    });

    it('joga fatura para o mês seguinte se compra for após o dia de fechamento', () => {
      // Compra dia 12 de outubro, fechamento dia 10, vencimento dia 17
      const purchase = new Date(2026, 9, 12); // 12/Outubro
      const invoice = getInvoiceDate(purchase, 10, 17);
      expect(invoice.getMonth()).toBe(10); // Novembro
      expect(invoice.getDate()).toBe(17);
    });
  });

  describe('generateInstallmentTransactions', () => {
    it('gera número correto de parcelas com valores distribuídos', () => {
      const payload = {
        id: 'test-1',
        description: 'Smartphone',
        amount: 1000,
        installmentsCount: 5,
        date: new Date(2026, 9, 5).toISOString(),
      };

      const result = generateInstallmentTransactions(payload, DEFAULT_CARD_SETTINGS);
      expect(result).toHaveLength(5);
      expect(result[0].amount).toBe(200);
      expect(result[0].description).toBe('Smartphone (1/5)');
      expect(result[4].description).toBe('Smartphone (5/5)');
      expect(result[0].installmentParentId).toBe('test-1');
      expect(result[4].installmentParentId).toBe('test-1');

      // Verifica meses sequenciais
      const date1 = new Date(result[0].date);
      const date2 = new Date(result[1].date);
      expect(date1.getMonth()).toBe(9); // Outubro
      expect(date2.getMonth()).toBe(10); // Novembro
    });

    it('carimba o cardId do cartão em todas as parcelas', () => {
      const cartaoNubank = { ...DEFAULT_CARD_SETTINGS, id: 'card-nubank', name: 'Nubank' };
      const payload = {
        id: 'nike',
        description: 'Tênis',
        amount: 600,
        installmentsCount: 3,
        date: new Date(2026, 9, 5).toISOString(),
      };

      const result = generateInstallmentTransactions(payload, cartaoNubank);
      result.forEach((t) => expect(t.cardId).toBe('card-nubank'));
    });
  });

  describe('resumo por cartão', () => {
    it('só contabiliza as transações do cartão informado', () => {
      const payloadNubank = {
        id: 'celular-nubank',
        description: 'Celular',
        amount: 600,
        installmentsCount: 3,
        date: new Date(2026, 9, 5).toISOString(),
      };
      const payloadInter = {
        id: 'tv-inter',
        description: 'TV',
        amount: 1200,
        installmentsCount: 4,
        date: new Date(2026, 9, 5).toISOString(),
      };

      const txsNubank = generateInstallmentTransactions(payloadNubank, { ...DEFAULT_CARD_SETTINGS, id: 'nubank' });
      const txsInter = generateInstallmentTransactions(payloadInter, { ...DEFAULT_CARD_SETTINGS, id: 'inter' });
      const all = [...txsNubank, ...txsInter];

      const summaryNubank = calculateCardSummary(
        filterCardTransactions(all, 'nubank', 'nubank'),
        DEFAULT_CARD_SETTINGS,
        new Date(2026, 9, 15)
      );
      const summaryInter = calculateCardSummary(
        filterCardTransactions(all, 'inter', 'nubank'),
        DEFAULT_CARD_SETTINGS,
        new Date(2026, 9, 15)
      );

      expect(summaryNubank.currentInvoiceAmount).toBe(200);
      expect(summaryInter.currentInvoiceAmount).toBe(300);
      expect(summaryNubank.activeInstallments).toHaveLength(1);
      expect(summaryInter.activeInstallments).toHaveLength(1);
    });
  });

  describe('calculateCardSummary', () => {
    it('calcula fatura atual e dívida futura restante corretamente', () => {
      const payload = {
        id: 'celular',
        description: 'Celular',
        amount: 600,
        installmentsCount: 3,
        date: new Date(2026, 9, 5).toISOString(), // 1ª parcela em Outubro (R$ 200)
      };

      const txs = generateInstallmentTransactions(payload, DEFAULT_CARD_SETTINGS);
      const summary = calculateCardSummary(txs, DEFAULT_CARD_SETTINGS, new Date(2026, 9, 15));

      // 1ª parcela cai em Outubro = R$ 200
      expect(summary.currentInvoiceAmount).toBe(200);
      // Faltam 2 parcelas (Novembro e Dezembro) = R$ 400
      expect(summary.futureDebtRemaining).toBe(400);
      expect(summary.activeInstallments).toHaveLength(1);
      expect(summary.activeInstallments[0].remainingInstallments).toBe(2);
      expect(summary.activeInstallments[0].remainingAmount).toBe(400);
    });
  });
});
