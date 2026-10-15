import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { DEFAULT_SETTINGS, getInitialTransactions } from '../constants/initialData';
import {
  calculateCategoryBreakdown,
  calculateMonthProjection,
  calculateWeeklyStats,
  isSameMonth,
  isSameWeek,
} from '../utils/calculations';
import { formatMoney as formatMoneyForCurrency, getCurrencySymbol } from '../utils/format';
import { generateRecurringTransactions } from '../utils/recurrence';
import { loadSettings, loadTransactions, saveSettings, saveTransactions } from '../utils/storage';

const AppContext = createContext(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp deve ser usado dentro de <AppProvider>');
  }
  return ctx;
};

// Ordena por recência: transações passadas primeiro (mais recente no topo)
// e ocorrências futuras ao final (mais próxima primeiro).
const sortByRecency = (list) => {
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const limit = todayEnd.getTime();

  return [...list].sort((a, b) => {
    const da = new Date(a.date).getTime() || 0;
    const db = new Date(b.date).getTime() || 0;
    const aFuture = da > limit;
    const bFuture = db > limit;
    if (aFuture !== bFuture) return aFuture ? 1 : -1;
    return aFuture ? da - db : db - da;
  });
};

export function AppProvider({ children }) {
  // Configurações e tema
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currency, setCurrencyState] = useState('BRL');

  // Transações
  const [transactions, setTransactions] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Modais
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  // Filtros do extrato
  const [searchQuery, setSearchQuery] = useState('');
  const [historyPeriodFilter, setHistoryPeriodFilter] = useState('month');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('all');

  // Carregar dados salvos ao iniciar
  useEffect(() => {
    async function initData() {
      try {
        const initialSeed = getInitialTransactions();
        const loadedTxs = await loadTransactions(initialSeed);
        const loadedSett = await loadSettings(DEFAULT_SETTINGS);

        setTransactions(loadedTxs);
        setSettings(loadedSett);
        setIsDarkMode(loadedSett.isDarkMode ?? true);
        setCurrencyState(loadedSett.currency || 'BRL');
      } catch (e) {
        console.error('Erro ao inicializar dados:', e);
      } finally {
        setIsLoaded(true);
      }
    }
    initData();
  }, []);

  const updateTransactions = useCallback((next) => {
    setTransactions(next);
    saveTransactions(next);
  }, []);

  const updateSettings = useCallback((newSettings) => {
    setSettings(newSettings);
    setIsDarkMode(newSettings.isDarkMode);
    setCurrencyState(newSettings.currency);
    saveSettings(newSettings);
  }, []);

  const toggleTheme = useCallback(() => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    updateSettings({ ...settings, isDarkMode: nextDark });
  }, [isDarkMode, settings, updateSettings]);

  const handleSelectCurrency = useCallback(
    (code) => {
      setCurrencyState(code);
      updateSettings({ ...settings, currency: code });
      setIsCurrencyModalOpen(false);
    },
    [settings, updateSettings]
  );

  // Ações de transação (recorrência expandida na criação)
  const handleAddTransaction = useCallback(
    (newTx) => {
      const occurrences = generateRecurringTransactions(newTx);
      updateTransactions([...occurrences, ...transactions]);
    },
    [transactions, updateTransactions]
  );

  const handleUpdateSingleTransaction = useCallback(
    (updatedTx) => {
      updateTransactions(transactions.map((t) => (t.id === updatedTx.id ? updatedTx : t)));
    },
    [transactions, updateTransactions]
  );

  const handleConfirmDelete = useCallback(
    (id) => {
      updateTransactions(transactions.filter((t) => t.id !== id));
      setTransactionToDelete(null);
      setIsDeleteModalOpen(false);
    },
    [transactions, updateTransactions]
  );

  const handleResetDemoData = useCallback(() => {
    updateTransactions(getInitialTransactions());
  }, [updateTransactions]);

  // Abertura/fechamento de modais
  const openAddTransaction = useCallback(() => {
    setEditingTransaction(null);
    setIsTransactionModalOpen(true);
  }, []);

  const openEditTransaction = useCallback((tx) => {
    setEditingTransaction(tx);
    setIsTransactionModalOpen(true);
  }, []);

  const closeTransactionModal = useCallback(() => {
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
  }, []);

  const openSalaryModal = useCallback(() => setIsSalaryModalOpen(true), []);
  const closeSalaryModal = useCallback(() => setIsSalaryModalOpen(false), []);
  const openCurrencyModal = useCallback(() => setIsCurrencyModalOpen(true), []);
  const closeCurrencyModal = useCallback(() => setIsCurrencyModalOpen(false), []);

  const requestDelete = useCallback((tx) => {
    setTransactionToDelete(tx);
    setIsDeleteModalOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setTransactionToDelete(null);
  }, []);

  // Tema Dinâmico Zen
  const theme = useMemo(
    () => ({
      bg: isDarkMode ? '#0B0D11' : '#F8FAFC',
      card: isDarkMode ? '#161922' : '#FFFFFF',
      cardHover: isDarkMode ? '#1F2430' : '#F1F5F9',
      textMain: isDarkMode ? '#F8FAFC' : '#0F172A',
      textSub: isDarkMode ? '#94A3B8' : '#64748B',
      border: isDarkMode ? '#232936' : '#E2E8F0',
      green: '#10B981',
      greenLight: '#34D399',
      red: '#F43F5E',
      redLight: '#FB7185',
      indigo: '#6366F1',
      yellow: '#F59E0B',
      purple: '#8B5CF6',
    }),
    [isDarkMode]
  );

  const currencySymbol = useMemo(() => getCurrencySymbol(currency), [currency]);

  const formatMoney = useCallback((val) => formatMoneyForCurrency(val, currency), [currency]);

  // Lista ordenada por recência (passados recentes no topo, futuros ao final)
  const sortedTransactions = useMemo(() => sortByRecency(transactions), [transactions]);

  const monthCalculations = useMemo(() => {
    const now = new Date();
    const monthTxs = sortedTransactions.filter((t) => isSameMonth(t.date, now));

    let income = 0;
    let expense = 0;

    monthTxs.forEach((t) => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') income += amt;
      else expense += amt;
    });

    return {
      income,
      expense,
      balance: income - expense,
      count: monthTxs.length,
    };
  }, [sortedTransactions]);

  const weeklyStats = useMemo(() => calculateWeeklyStats(sortedTransactions), [sortedTransactions]);

  const monthProjection = useMemo(
    () => calculateMonthProjection(sortedTransactions, settings),
    [sortedTransactions, settings]
  );

  const categoryBreakdownMonth = useMemo(
    () => calculateCategoryBreakdown(sortedTransactions, 'month'),
    [sortedTransactions]
  );

  const categoryBreakdownWeek = useMemo(
    () => calculateCategoryBreakdown(sortedTransactions, 'week'),
    [sortedTransactions]
  );

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return sortedTransactions.filter((t) => {
      if (historyPeriodFilter === 'week' && !isSameWeek(t.date, now)) return false;
      if (historyPeriodFilter === 'month' && !isSameMonth(t.date, now)) return false;
      if (historyTypeFilter !== 'all' && t.type !== historyTypeFilter) return false;

      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const cat = (t.category || '').toLowerCase();
        if (!desc.includes(query) && !cat.includes(query)) return false;
      }

      return true;
    });
  }, [sortedTransactions, historyPeriodFilter, historyTypeFilter, searchQuery]);

  // Salário semanal estimado (usa o salário base, mas se recebeu renda extra na semana, expande o orçamento!)
  const weeklySalaryEstimated = useMemo(() => {
    const base = Number(settings.baseSalary) || 0;
    const baseWeekly = settings.salaryType === 'weekly' ? base : base / 4;
    // Se recebeu mais que o planejado nesta semana (renda extra/freelance/pix), ajusta a meta para cima
    return Math.max(baseWeekly, weeklyStats.weeklyIncome || 0);
  }, [settings, weeklyStats.weeklyIncome]);

  // Limite diário = (salário semanal real/planejado - parcela semanal da meta de poupança) / 7
  const dailyBudget = useMemo(() => {
    const weeklyGoal = (Number(settings.savingsGoal) || 0) / 4;
    return Math.max(0, (weeklySalaryEstimated - weeklyGoal) / 7);
  }, [weeklySalaryEstimated, settings]);

  const value = {
    // Estado
    isLoaded,
    theme,
    isDarkMode,
    toggleTheme,
    currency,
    currencySymbol,
    selectCurrency: handleSelectCurrency,
    settings,
    updateSettings,
    transactions: sortedTransactions,
    monthCalculations,
    weeklyStats,
    monthProjection,
    categoryBreakdownMonth,
    categoryBreakdownWeek,
    weeklySalaryEstimated,
    dailyBudget,
    formatMoney,

    // Filtros do extrato
    filters: {
      searchQuery,
      setSearchQuery,
      period: historyPeriodFilter,
      setPeriod: setHistoryPeriodFilter,
      type: historyTypeFilter,
      setType: setHistoryTypeFilter,
    },
    filteredTransactions,

    // Transações
    addTransaction: handleAddTransaction,
    updateTransaction: handleUpdateSingleTransaction,
    resetDemoData: handleResetDemoData,

    // Modais
    isTransactionModalOpen,
    editingTransaction,
    openAddTransaction,
    openEditTransaction,
    closeTransactionModal,
    isSalaryModalOpen,
    openSalaryModal,
    closeSalaryModal,
    isCurrencyModalOpen,
    openCurrencyModal,
    closeCurrencyModal,
    isDeleteModalOpen,
    transactionToDelete,
    requestDelete,
    closeDeleteModal,
    confirmDelete: handleConfirmDelete,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
