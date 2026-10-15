import {
  getInvoiceDate,
  generateInstallmentTransactions,
  calculateCardSummary,
  DEFAULT_CARD_SETTINGS,
} from '../utils/cardCalculations';

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
