// Utilitários de cálculos financeiros e estatísticos para GastoZen

/**
 * Retorna se duas datas pertencem à mesma semana (considerando Segunda a Domingo).
 */
export const isSameWeek = (date1, date2 = new Date()) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  // Ajuste para considerar Segunda-feira como início da semana
  const day1 = d1.getDay() === 0 ? 6 : d1.getDay() - 1;
  const day2 = d2.getDay() === 0 ? 6 : d2.getDay() - 1;
  
  const monday1 = new Date(d1);
  monday1.setDate(d1.getDate() - day1);
  monday1.setHours(0, 0, 0, 0);

  const monday2 = new Date(d2);
  monday2.setDate(d2.getDate() - day2);
  monday2.setHours(0, 0, 0, 0);

  return monday1.getTime() === monday2.getTime();
};

/**
 * Retorna se duas datas pertencem ao mesmo mês e ano.
 */
export const isSameMonth = (date1, date2 = new Date()) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
};

/**
 * Retorna os 7 dias da semana atual (Segunda a Domingo).
 */
export const getCurrentWeekDays = (referenceDate = new Date()) => {
  const ref = new Date(referenceDate);
  const dayOfWeek = ref.getDay() === 0 ? 6 : ref.getDay() - 1; // 0=Seg, ..., 6=Dom
  
  const monday = new Date(ref);
  monday.setDate(ref.getDate() - dayOfWeek);
  monday.setHours(0, 0, 0, 0);

  const days = [];
  const dayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push({
      date: d,
      dateString: d.toISOString().split('T')[0],
      dayName: dayLabels[i],
      dayOfMonth: d.getDate(),
      isToday: d.toDateString() === new Date().toDateString(),
    });
  }
  return days;
};

/**
 * Calcula estatísticas detalhadas da semana atual.
 */
export const calculateWeeklyStats = (transactions, referenceDate = new Date()) => {
  const weekDays = getCurrentWeekDays(referenceDate);
  
  // Transações da semana
  const weekTransactions = transactions.filter(t => isSameWeek(t.date, referenceDate));

  let weeklyExpense = 0;
  let weeklyIncome = 0;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Mapa diário
  const dailyData = weekDays.map(day => {
    let dayExpense = 0;
    let dayIncome = 0;
    let count = 0;
    const catMap = {};

    weekTransactions.forEach(t => {
      const tDate = new Date(t.date);
      if (tDate.toDateString() === day.date.toDateString()) {
        count += 1;
        const amt = Number(t.amount) || 0;
        if (t.type === 'expense') {
          dayExpense += amt;
          const cat = t.category || 'Outros';
          catMap[cat] = (catMap[cat] || 0) + amt;
        } else {
          dayIncome += amt;
        }
      }
    });

    weeklyExpense += dayExpense;
    weeklyIncome += dayIncome;

    const topCategory = Object.keys(catMap).sort((a, b) => catMap[b] - catMap[a])[0] || null;

    return {
      ...day,
      expense: dayExpense,
      income: dayIncome,
      count,
      topCategory,
      topCategoryAmount: topCategory ? catMap[topCategory] : 0,
      isFuture: day.date.getTime() > todayStart.getTime(),
    };
  });

  // Semana anterior (para comparação)
  const prevRef = new Date(referenceDate);
  prevRef.setDate(prevRef.getDate() - 7);
  const previousWeekExpense = transactions
    .filter(t => t.type === 'expense' && isSameWeek(t.date, prevRef))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const daysElapsed = Math.max(dailyData.filter(d => !d.isFuture).length, 1);

  // Identificar dia com maior gasto
  const highestExpenseDay = [...dailyData].sort((a, b) => b.expense - a.expense)[0];
  const maxDayExpense = Math.max(...dailyData.map(d => Math.max(d.expense, d.income)), 1);

  return {
    weeklyExpense,
    weeklyIncome,
    weeklyBalance: weeklyIncome - weeklyExpense,
    dailyData,
    highestExpenseDay: highestExpenseDay && highestExpenseDay.expense > 0 ? highestExpenseDay : null,
    maxDailyValue: maxDayExpense,
    transactionCount: weekTransactions.length,
    previousWeekExpense,
    daysElapsed,
    averageDailyExpense: weeklyExpense / daysElapsed,
  };
};

/**
 * Calcula projeção de final de mês:
 * - Quanto foi gasto até hoje no mês
 * - Gasto médio diário
 * - Quantos dias restam no mês
 * - Previsão de gasto total no mês
 * - Quanto vai sobrar no final do mês
 */
export const calculateMonthProjection = (transactions, settings = {}, referenceDate = new Date()) => {
  const now = new Date(referenceDate);
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // Total de dias no mês
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const daysPassed = Math.max(dayOfMonth, 1);
  const daysRemaining = Math.max(totalDaysInMonth - dayOfMonth, 0);

  // Transações do mês
  const monthTransactions = transactions.filter(t => isSameMonth(t.date, now));

  let monthIncome = 0;
  let monthExpense = 0;

  monthTransactions.forEach(t => {
    const amt = Number(t.amount) || 0;
    if (t.type === 'income') {
      monthIncome += amt;
    } else {
      monthExpense += amt;
    }
  });

  // Salário ou renda base configurada pelo usuário
  const baseMonthlyIncome = Number(settings.baseSalary) || 0;
  const isWeeklySalary = settings.salaryType === 'weekly';
  const effectiveExpectedIncome = isWeeklySalary 
    ? (baseMonthlyIncome * 4.33) 
    : Math.max(baseMonthlyIncome, monthIncome);

  // Se o usuário tem receita registrada maior que o esperado, usar a real
  const totalProjectedIncome = Math.max(effectiveExpectedIncome, monthIncome);

  // Gasto médio diário até o momento
  const averageDailyExpense = monthExpense / daysPassed;

  // Projeção de gastos nos dias restantes (mantendo o ritmo atual)
  const projectedRemainingExpense = averageDailyExpense * daysRemaining;
  const projectedTotalExpense = monthExpense + projectedRemainingExpense;

  // Quanto vai sobrar no final do mês
  const projectedEndBalance = totalProjectedIncome - projectedTotalExpense;

  // Saldo atual real
  const currentBalance = monthIncome - monthExpense;

  // Limite de gasto diário recomendado para os dias restantes se quiser poupar
  const targetSavings = Number(settings.savingsGoal) || 0;
  const availableToSpendRemaining = Math.max(0, totalProjectedIncome - monthExpense - targetSavings);
  const recommendedDailyBudget = daysRemaining > 0 
    ? (availableToSpendRemaining / daysRemaining) 
    : 0;

  // Taxa de poupança estimada
  const projectedSavingsRate = totalProjectedIncome > 0
    ? Math.round(((totalProjectedIncome - projectedTotalExpense) / totalProjectedIncome) * 100)
    : 0;

  // Status Zen
  let status = {
    level: 'safe',
    title: 'Finanças Zen 🧘',
    message: 'Neste ritmo você terminará o mês no positivo com boa folga!',
    color: '#10B981',
  };

  if (projectedEndBalance < 0) {
    status = {
      level: 'danger',
      title: 'Atenção aos Gastos ⚠️',
      message: 'Seu ritmo atual pode gerar um saldo negativo no fim do mês.',
      color: '#EF4444',
    };
  } else if (projectedSavingsRate < 10) {
    status = {
      level: 'warning',
      title: 'Orçamento Apertado ⚡',
      message: 'A sobra estimada está baixa. Monitore as próximas despesas.',
      color: '#F59E0B',
    };
  }

  return {
    daysPassed,
    daysRemaining,
    totalDaysInMonth,
    monthIncome,
    monthExpense,
    currentBalance,
    totalProjectedIncome,
    averageDailyExpense,
    projectedTotalExpense,
    projectedEndBalance,
    projectedSavingsRate,
    recommendedDailyBudget,
    status,
  };
};

/**
 * Agrupa as despesas por categoria com percentuais e ordenação.
 */
export const calculateCategoryBreakdown = (transactions, period = 'month', referenceDate = new Date()) => {
  const filtered = transactions.filter(t => {
    if (t.type !== 'expense') return false;
    if (period === 'week') return isSameWeek(t.date, referenceDate);
    if (period === 'month') return isSameMonth(t.date, referenceDate);
    return true; // 'all'
  });

  const categoryMap = {};
  let totalExpense = 0;

  filtered.forEach(t => {
    const amt = Number(t.amount) || 0;
    const cat = t.category || 'Outros';
    totalExpense += amt;
    categoryMap[cat] = (categoryMap[cat] || 0) + amt;
  });

  const categoriesList = Object.keys(categoryMap).map(cat => {
    const amount = categoryMap[cat];
    const percentage = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
    return {
      category: cat,
      amount,
      percentage,
    };
  }).sort((a, b) => b.amount - a.amount);

  return {
    totalExpense,
    categories: categoriesList,
  };
};
