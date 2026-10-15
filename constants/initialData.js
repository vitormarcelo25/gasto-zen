// Dados iniciais com datas relativas à semana e mês atuais
export const getInitialTransactions = () => {
  const now = new Date();
  
  const createDate = (daysAgo = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString();
  };

  return [
    {
      id: 'tx-1',
      type: 'income',
      amount: 3800,
      description: 'Salário Mensal',
      category: 'Salário',
      categoryId: 'salario',
      date: createDate(3),
      recurrence: 'monthly',
    },
    {
      id: 'tx-2',
      type: 'income',
      amount: 650,
      description: 'Freelance Consultoria',
      category: 'Freelance / Bicos',
      categoryId: 'freelance',
      date: createDate(1),
      recurrence: 'single',
    },
    {
      id: 'tx-3',
      type: 'expense',
      amount: 280,
      description: 'Compras Supermercado',
      category: 'Alimentação',
      categoryId: 'alimentacao',
      date: createDate(0), // Hoje
      recurrence: 'weekly',
    },
    {
      id: 'tx-4',
      type: 'expense',
      amount: 45.5,
      description: 'Almoço Restaurante',
      category: 'Alimentação',
      categoryId: 'alimentacao',
      date: createDate(0), // Hoje
      recurrence: 'single',
    },
    {
      id: 'tx-5',
      type: 'expense',
      amount: 35,
      description: 'Uber para Reunião',
      category: 'Transporte',
      categoryId: 'transporte',
      date: createDate(1), // Ontem
      recurrence: 'single',
    },
    {
      id: 'tx-6',
      type: 'expense',
      amount: 150,
      description: 'Abastecimento Carro',
      category: 'Transporte',
      categoryId: 'transporte',
      date: createDate(2),
      recurrence: 'single',
    },
    {
      id: 'tx-7',
      type: 'expense',
      amount: 85,
      description: 'Cinema & Lazer',
      category: 'Lazer & Cultura',
      categoryId: 'lazer',
      date: createDate(4),
      recurrence: 'single',
    },
    {
      id: 'tx-8',
      type: 'expense',
      amount: 120,
      description: 'Conta de Internet Fibra',
      category: 'Contas & Boletos',
      categoryId: 'contas',
      date: createDate(5),
      recurrence: 'monthly',
    },
  ];
};

export const DEFAULT_SETTINGS = {
  currency: 'BRL',
  isDarkMode: true,
  salaryType: 'monthly', // 'monthly' ou 'weekly'
  baseSalary: 4500,
  savingsGoal: 800,
};
