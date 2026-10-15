import React, { useState, useMemo, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  TextInput, Modal, StatusBar, Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';

// Constantes e Dados Iniciais
import { CURRENCIES } from '../constants/categories';
import { getInitialTransactions, DEFAULT_SETTINGS } from '../constants/initialData';

// Persistência
import { 
  saveTransactions, loadTransactions, saveSettings, loadSettings 
} from '../utils/storage';

// Motor de Cálculos Financeiros
import { 
  calculateWeeklyStats, calculateMonthProjection, calculateCategoryBreakdown, isSameMonth, isSameWeek 
} from '../utils/calculations';

// Componentes Modulares
import WeeklyBarChart from '../components/WeeklyBarChart';
import ProjectionCard from '../components/ProjectionCard';
import CategoryBreakdownCard from '../components/CategoryBreakdownCard';
import TransactionItem from '../components/TransactionItem';
import TransactionModal from '../components/TransactionModal';
import SalaryConfigModal from '../components/SalaryConfigModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

export default function App() {
  // Configurações e Tema
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currency, setCurrency] = useState('BRL');
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'analytics' | 'history'

  // Transações
  const [transactions, setTransactions] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Modais
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  // Filtros do Extrato
  const [searchQuery, setSearchQuery] = useState('');
  const [historyPeriodFilter, setHistoryPeriodFilter] = useState('month'); // 'week' | 'month' | 'all'
  const [historyTypeFilter, setHistoryTypeFilter] = useState('all'); // 'all' | 'expense' | 'income'

  // Tema Dinâmico Zen
  const theme = {
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
  };

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
        setCurrency(loadedSett.currency || 'BRL');
      } catch (e) {
        console.error('Erro ao inicializar dados:', e);
      } finally {
        setIsLoaded(true);
      }
    }
    initData();
  }, []);

  // Salvar transações sempre que houver alteração
  const handleUpdateTransactions = (newTransactions) => {
    setTransactions(newTransactions);
    saveTransactions(newTransactions);
  };

  // Salvar configurações
  const handleUpdateSettings = (newSettings) => {
    setSettings(newSettings);
    setIsDarkMode(newSettings.isDarkMode);
    setCurrency(newSettings.currency);
    saveSettings(newSettings);
  };

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    handleUpdateSettings({ ...settings, isDarkMode: nextDark });
  };

  const handleSelectCurrency = (code) => {
    setCurrency(code);
    handleUpdateSettings({ ...settings, currency: code });
    setIsCurrencyModalOpen(false);
  };

  // Símbolo da Moeda Atual
  const currencySymbol = useMemo(() => {
    return CURRENCIES.find(c => c.code === currency)?.symbol || 'R$';
  }, [currency]);

  // Formatador de Moeda
  const formatMoney = (val) => {
    const num = Number(val) || 0;
    return `${currencySymbol} ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Cálculos Gerais do Mês e Totais
  const monthCalculations = useMemo(() => {
    const now = new Date();
    const monthTxs = transactions.filter(t => isSameMonth(t.date, now));

    let income = 0;
    let expense = 0;

    monthTxs.forEach(t => {
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
  }, [transactions]);

  // Estatísticas Semanais
  const weeklyStats = useMemo(() => {
    return calculateWeeklyStats(transactions);
  }, [transactions]);

  // Projeção de Final do Mês
  const monthProjection = useMemo(() => {
    return calculateMonthProjection(transactions, settings);
  }, [transactions, settings]);

  // Gastos por Categoria
  const categoryBreakdownMonth = useMemo(() => {
    return calculateCategoryBreakdown(transactions, 'month');
  }, [transactions]);

  const categoryBreakdownWeek = useMemo(() => {
    return calculateCategoryBreakdown(transactions, 'week');
  }, [transactions]);

  // Transações Filtradas para a Aba "Extrato"
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      // Filtro por Período
      if (historyPeriodFilter === 'week' && !isSameWeek(t.date, now)) return false;
      if (historyPeriodFilter === 'month' && !isSameMonth(t.date, now)) return false;

      // Filtro por Tipo
      if (historyTypeFilter !== 'all' && t.type !== historyTypeFilter) return false;

      // Filtro por Busca
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const cat = (t.category || '').toLowerCase();
        return desc.includes(query) || cat.includes(query);
      }

      return true;
    });
  }, [transactions, historyPeriodFilter, historyTypeFilter, searchQuery]);

  // Ações de Adicionar, Editar e Excluir Transação
  const handleAddTransaction = (newTx) => {
    const updated = [newTx, ...transactions];
    handleUpdateTransactions(updated);
  };

  const handleUpdateSingleTransaction = (updatedTx) => {
    const updated = transactions.map(t => t.id === updatedTx.id ? updatedTx : t);
    handleUpdateTransactions(updated);
  };

  const handleEditTransaction = (tx) => {
    setEditingTransaction(tx);
    setIsTransactionModalOpen(true);
  };

  const handleRequestDelete = (tx) => {
    setTransactionToDelete(tx);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = (id) => {
    const updated = transactions.filter(t => t.id !== id);
    handleUpdateTransactions(updated);
    setTransactionToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleResetDemoData = () => {
    const seed = getInitialTransactions();
    handleUpdateTransactions(seed);
  };

  // Salário semanal estimado configurado pelo usuário
  const weeklySalaryEstimated = useMemo(() => {
    const base = Number(settings.baseSalary) || 0;
    if (settings.salaryType === 'weekly') {
      return base;
    }
    return base / 4.33;
  }, [settings]);

  // Limite diário de gastos = (salário semanal - parcela semanal da meta de poupança) / 7
  const dailyBudget = useMemo(() => {
    const weeklyGoal = (Number(settings.savingsGoal) || 0) / 4.33;
    return Math.max(0, (weeklySalaryEstimated - weeklyGoal) / 7);
  }, [weeklySalaryEstimated, settings]);

  if (!isLoaded) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.bg }]}>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
          backgroundColor={theme.bg} 
        />
        <View style={[styles.logoBoxLarge, { backgroundColor: theme.green + '20' }]}>
          <Feather name="feather" size={36} color={theme.green} />
        </View>
        <Text style={[styles.headerTitle, { color: theme.textMain, marginTop: 14 }]}>
          Gasto<Text style={{ color: theme.green, fontWeight: '300' }}>Zen</Text>
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSub, marginTop: 4 }]}>
          Carregando suas finanças...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.bg} 
      />

      {/* HEADER SUPERIOR */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.logoBox, { backgroundColor: theme.green + '20' }]}>
            <Feather name="feather" size={22} color={theme.green} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: theme.textMain }]}>
              Gasto<Text style={{ color: theme.green, fontWeight: '300' }}>Zen</Text>
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSub }]}>
              Controle Financeiro Sereno
            </Text>
          </View>
        </View>

        {/* Botões de Moeda e Tema */}
        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={() => setIsCurrencyModalOpen(true)}
            style={[styles.headerBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Text style={[styles.currencyBtnText, { color: theme.textMain }]}>{currencySymbol}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={toggleTheme}
            style={[styles.headerBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Feather name={isDarkMode ? "sun" : "moon"} size={18} color={theme.textSub} />
          </TouchableOpacity>
        </View>
      </View>

      {/* BARRA DE NAVEGAÇÃO / ABAS */}
      <View style={[styles.navTabs, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity 
          onPress={() => setActiveTab('home')}
          style={[styles.navTabBtn, activeTab === 'home' && { backgroundColor: theme.indigo + '20' }]}
        >
          <Feather 
            name="home" 
            size={16} 
            color={activeTab === 'home' ? theme.indigo : theme.textSub} 
          />
          <Text style={[
            styles.navTabText, 
            { color: activeTab === 'home' ? theme.indigo : theme.textSub, fontWeight: activeTab === 'home' ? 'bold' : '600' }
          ]}>
            Início
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => setActiveTab('analytics')}
          style={[styles.navTabBtn, activeTab === 'analytics' && { backgroundColor: theme.indigo + '20' }]}
        >
          <Feather 
            name="pie-chart" 
            size={16} 
            color={activeTab === 'analytics' ? theme.indigo : theme.textSub} 
          />
          <Text style={[
            styles.navTabText, 
            { color: activeTab === 'analytics' ? theme.indigo : theme.textSub, fontWeight: activeTab === 'analytics' ? 'bold' : '600' }
          ]}>
            Estatísticas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => setActiveTab('history')}
          style={[styles.navTabBtn, activeTab === 'history' && { backgroundColor: theme.indigo + '20' }]}
        >
          <Feather 
            name="list" 
            size={16} 
            color={activeTab === 'history' ? theme.indigo : theme.textSub} 
          />
          <Text style={[
            styles.navTabText, 
            { color: activeTab === 'history' ? theme.indigo : theme.textSub, fontWeight: activeTab === 'history' ? 'bold' : '600' }
          ]}>
            Extrato
          </Text>
        </TouchableOpacity>
      </View>

      {/* CONTEÚDO PRINCIPAL ROLÁVEL */}
      <ScrollView 
        style={styles.contentScroll} 
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================
            ABA 1: INÍCIO (VISÃO GERAL + AÇÕES RÁPIDAS)
        ======================================================== */}
        {activeTab === 'home' && (
          <View>
            {/* CARTÃO DE SALDO PRINCIPAL */}
            <View style={[styles.balanceHeroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.balanceHeroTop}>
                <Text style={[styles.balanceHeroLabel, { color: theme.textSub }]}>Saldo Líquido do Mês</Text>
                <View style={[styles.monthTag, { backgroundColor: theme.bg }]}>
                  <Feather name="calendar" size={12} color={theme.textSub} style={{ marginRight: 4 }} />
                  <Text style={[styles.monthTagText, { color: theme.textSub }]}>Mês Atual</Text>
                </View>
              </View>

              <Text style={[
                styles.balanceHeroValue, 
                { color: monthCalculations.balance >= 0 ? theme.green : theme.red }
              ]}>
                {formatMoney(monthCalculations.balance)}
              </Text>

              {/* Linha de Indicadores de Entradas e Saídas */}
              <View style={[styles.heroStatsRow, { borderTopColor: theme.border }]}>
                <View style={styles.heroStatItem}>
                  <View style={[styles.statIconBadge, { backgroundColor: theme.green + '20' }]}>
                    <Feather name="arrow-up" size={14} color={theme.green} />
                  </View>
                  <View>
                    <Text style={[styles.heroStatSub, { color: theme.textSub }]}>RECEITAS</Text>
                    <Text style={[styles.heroStatAmt, { color: theme.textMain }]}>
                      {formatMoney(monthCalculations.income)}
                    </Text>
                  </View>
                </View>

                <View style={[styles.heroStatItem, { borderLeftColor: theme.border, borderLeftWidth: 1, paddingLeft: 16 }]}>
                  <View style={[styles.statIconBadge, { backgroundColor: theme.red + '20' }]}>
                    <Feather name="arrow-down" size={14} color={theme.red} />
                  </View>
                  <View>
                    <Text style={[styles.heroStatSub, { color: theme.textSub }]}>DESPESAS</Text>
                    <Text style={[styles.heroStatAmt, { color: theme.textMain }]}>
                      {formatMoney(monthCalculations.expense)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* CARD RESUMO SEMANAL RÁPIDO */}
            <View style={[styles.weeklySummaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.weeklySummaryHeader}>
                <View style={styles.weeklyTitleRow}>
                  <Feather name="clock" size={16} color={theme.indigo} />
                  <Text style={[styles.weeklySummaryTitle, { color: theme.textMain }]}>
                    Painel da Semana
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setIsSalaryModalOpen(true)}
                  style={[styles.salaryBadge, { backgroundColor: theme.indigo + '15' }]}
                >
                  <Feather name="dollar-sign" size={12} color={theme.indigo} />
                  <Text style={[styles.salaryBadgeText, { color: theme.indigo }]}>
                    Salário Semanal: {formatMoney(weeklySalaryEstimated)}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.weeklyMetricsRow}>
                <View style={styles.weeklyMetricBox}>
                  <Text style={[styles.weeklyMetricLabel, { color: theme.textSub }]}>Gasto na Semana</Text>
                  <Text style={[styles.weeklyMetricValue, { color: theme.red }]}>
                    {formatMoney(weeklyStats.weeklyExpense)}
                  </Text>
                </View>

                <View style={styles.weeklyMetricBox}>
                  <Text style={[styles.weeklyMetricLabel, { color: theme.textSub }]}>Recebido na Semana</Text>
                  <Text style={[styles.weeklyMetricValue, { color: theme.green }]}>
                    {formatMoney(weeklyStats.weeklyIncome)}
                  </Text>
                </View>

                <View style={styles.weeklyMetricBox}>
                  <Text style={[styles.weeklyMetricLabel, { color: theme.textSub }]}>Saldo Semanal</Text>
                  <Text style={[
                    styles.weeklyMetricValue, 
                    { color: weeklyStats.weeklyBalance >= 0 ? theme.green : theme.red }
                  ]}>
                    {weeklyStats.weeklyBalance >= 0 ? '+' : ''}{formatMoney(weeklyStats.weeklyBalance)}
                  </Text>
                </View>
              </View>
            </View>

            {/* GRÁFICO DE BARRAS DA SEMANA */}
            <WeeklyBarChart dailyBudget={dailyBudget} 
              weeklyStats={weeklyStats} 
              theme={theme} 
              formatMoney={formatMoney} 
            />

            {/* CARD PROJEÇÃO DE FINAL DE MÊS */}
            <ProjectionCard 
              projection={monthProjection} 
              theme={theme} 
              formatMoney={formatMoney}
              onConfigureSalary={() => setIsSalaryModalOpen(true)}
              settings={settings}
            />

            {/* TRANSAÇÕES RECENTES */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textMain }]}>Últimas Transações</Text>
              <TouchableOpacity onPress={() => setActiveTab('history')}>
                <Text style={[styles.sectionLink, { color: theme.indigo }]}>Ver todas ({transactions.length})</Text>
              </TouchableOpacity>
            </View>

            {transactions.slice(0, 5).map(t => (
              <TransactionItem 
                key={t.id}
                transaction={t}
                theme={theme}
                formatMoney={formatMoney}
                onDelete={handleRequestDelete}
                onPress={handleEditTransaction}
              />
            ))}
          </View>
        )}

        {/* ========================================================
            ABA 2: ESTATÍSTICAS & PROJEÇÕES COMPLETAS
        ======================================================== */}
        {activeTab === 'analytics' && (
          <View>
            {/* CARD PROJEÇÃO DE FINAL DE MÊS DETALHADA */}
            <ProjectionCard 
              projection={monthProjection} 
              theme={theme} 
              formatMoney={formatMoney}
              onConfigureSalary={() => setIsSalaryModalOpen(true)}
              settings={settings}
            />

            {/* GRÁFICO SEMANAL DETALHADO */}
            <WeeklyBarChart dailyBudget={dailyBudget} 
              weeklyStats={weeklyStats} 
              theme={theme} 
              formatMoney={formatMoney} 
            />

            {/* DISTRIBUIÇÃO DE GASTOS POR CATEGORIA (MÊS) */}
            <CategoryBreakdownCard 
              breakdown={categoryBreakdownMonth}
              theme={theme}
              formatMoney={formatMoney}
              period="month"
            />

            {/* DISTRIBUIÇÃO DE GASTOS POR CATEGORIA (SEMANA) */}
            <CategoryBreakdownCard 
              breakdown={categoryBreakdownWeek}
              theme={theme}
              formatMoney={formatMoney}
              period="week"
            />

            {/* CARD RESUMO DE HÁBITOS ZEN */}
            <View style={[styles.zenTipsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.zenTipHeader}>
                <Feather name="compass" size={20} color={theme.green} />
                <Text style={[styles.zenTipTitle, { color: theme.textMain }]}>Indicadores Zen do Mês</Text>
              </View>
              <View style={styles.zenTipGrid}>
                <View style={styles.zenTipCol}>
                  <Text style={[styles.zenTipLabel, { color: theme.textSub }]}>Dias no Mês</Text>
                  <Text style={[styles.zenTipValue, { color: theme.textMain }]}>
                    {monthProjection.daysPassed} de {monthProjection.totalDaysInMonth} dias
                  </Text>
                </View>
                <View style={styles.zenTipCol}>
                  <Text style={[styles.zenTipLabel, { color: theme.textSub }]}>Gasto Médio/Dia</Text>
                  <Text style={[styles.zenTipValue, { color: theme.red }]}>
                    {formatMoney(monthProjection.averageDailyExpense)}
                  </Text>
                </View>
                <View style={styles.zenTipCol}>
                  <Text style={[styles.zenTipLabel, { color: theme.textSub }]}>Orçamento Diário Livre</Text>
                  <Text style={[styles.zenTipValue, { color: theme.green }]}>
                    {formatMoney(monthProjection.recommendedDailyBudget)}
                  </Text>
                </View>
                <View style={styles.zenTipCol}>
                  <Text style={[styles.zenTipLabel, { color: theme.textSub }]}>Salário Base</Text>
                  <Text style={[styles.zenTipValue, { color: theme.indigo }]}>
                    {formatMoney(settings.baseSalary || 0)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ========================================================
            ABA 3: EXTRATO COMPLETO & FILTROS
        ======================================================== */}
        {activeTab === 'history' && (
          <View>
            {/* Barra de Pesquisa */}
            <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Feather name="search" size={18} color={theme.textSub} style={{ marginRight: 10 }} />
              <TextInput 
                style={[styles.searchInput, { color: theme.textMain }]}
                placeholder="Pesquisar por descrição ou categoria..."
                placeholderTextColor={theme.textSub}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery !== '' && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Feather name="x-circle" size={18} color={theme.textSub} />
                </TouchableOpacity>
              )}
            </View>

            {/* Filtros por Período */}
            <View style={styles.filtersGroup}>
              <View style={[styles.filterPills, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {[
                  { id: 'month', label: 'Este Mês' },
                  { id: 'week', label: 'Esta Semana' },
                  { id: 'all', label: 'Todos' },
                ].map(p => (
                  <TouchableOpacity 
                    key={p.id}
                    onPress={() => setHistoryPeriodFilter(p.id)}
                    style={[
                      styles.filterPillBtn, 
                      historyPeriodFilter === p.id && { backgroundColor: theme.indigo }
                    ]}
                  >
                    <Text style={[
                      styles.filterPillText, 
                      { color: historyPeriodFilter === p.id ? '#FFF' : theme.textSub }
                    ]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Filtros por Tipo (Todas / Despesas / Receitas) */}
              <View style={[styles.filterPills, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 8 }]}>
                {[
                  { id: 'all', label: 'Todas' },
                  { id: 'expense', label: 'Despesas' },
                  { id: 'income', label: 'Receitas' },
                ].map(t => (
                  <TouchableOpacity 
                    key={t.id}
                    onPress={() => setHistoryTypeFilter(t.id)}
                    style={[
                      styles.filterPillBtn, 
                      historyTypeFilter === t.id && { 
                        backgroundColor: t.id === 'expense' ? theme.red : (t.id === 'income' ? theme.green : theme.indigo) 
                      }
                    ]}
                  >
                    <Text style={[
                      styles.filterPillText, 
                      { color: historyTypeFilter === t.id ? '#FFF' : theme.textSub }
                    ]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Contador de Resultados */}
            <View style={styles.historyCounterRow}>
              <Text style={[styles.historyCounterText, { color: theme.textSub }]}>
                {filteredTransactions.length} {filteredTransactions.length === 1 ? 'registro encontrado' : 'registros encontrados'}
              </Text>
            </View>

            {/* Lista Filtrada */}
            {filteredTransactions.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Feather name="inbox" size={36} color={theme.textSub} />
                <Text style={[styles.emptyTitle, { color: theme.textMain }]}>Nenhuma transação encontrada</Text>
                <Text style={[styles.emptyDesc, { color: theme.textSub }]}>
                  Tente alterar os filtros ou clique no botão + para adicionar um novo registro.
                </Text>
              </View>
            ) : (
              filteredTransactions.map(t => (
                <TransactionItem 
                  key={t.id}
                  transaction={t}
                  theme={theme}
                  formatMoney={formatMoney}
                  onDelete={handleRequestDelete}
                  onPress={handleEditTransaction}
                />
              ))
            )}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB - BOTÃO FLUTUANTE DE NOVO LANÇAMENTO */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: theme.green }]} 
        onPress={() => {
          setEditingTransaction(null);
          setIsTransactionModalOpen(true);
        }}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={30} color="#FFF" />
      </TouchableOpacity>

      {/* MODAL DE NOVO/EDITAR LANÇAMENTO */}
      <TransactionModal 
        visible={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditingTransaction(null);
        }}
        onAddTransaction={handleAddTransaction}
        onUpdateTransaction={handleUpdateSingleTransaction}
        onDeleteTransaction={handleRequestDelete}
        transactionToEdit={editingTransaction}
        theme={theme}
        currencySymbol={currencySymbol}
      />

      {/* MODAL DE CONFIGURAÇÃO DE SALÁRIO E METAS */}
      <SalaryConfigModal 
        visible={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        settings={settings}
        onSaveSettings={handleUpdateSettings}
        onResetData={handleResetDemoData}
        theme={theme}
        currencySymbol={currencySymbol}
      />

      {/* MODAL DE CONFIRMAÇÃO PROFISSIONAL DE EXCLUSÃO */}
      <DeleteConfirmModal 
        visible={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setTransactionToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        transaction={transactionToDelete}
        theme={theme}
        formatMoney={formatMoney}
      />

      {/* MODAL ESCOLHER MOEDA */}
      <Modal visible={isCurrencyModalOpen} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitleText, { color: theme.textMain }]}>Selecionar Moeda</Text>
              <TouchableOpacity onPress={() => setIsCurrencyModalOpen(false)}>
                <Feather name="x" size={20} color={theme.textSub} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 10, marginTop: 14 }}>
              {CURRENCIES.map(c => (
                <TouchableOpacity 
                  key={c.code}
                  onPress={() => handleSelectCurrency(c.code)}
                  style={[
                    styles.currencyRow, 
                    { 
                      backgroundColor: currency === c.code ? theme.indigo + '20' : theme.bg,
                      borderColor: currency === c.code ? theme.indigo : theme.border,
                    }
                  ]}
                >
                  <Text style={[styles.currencyRowSymbol, { color: currency === c.code ? theme.indigo : theme.textMain }]}>
                    {c.symbol}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.currencyRowName, { color: theme.textMain }]}>{c.name}</Text>
                    <Text style={[styles.currencyRowCode, { color: theme.textSub }]}>{c.code}</Text>
                  </View>
                  {currency === c.code && <Feather name="check" size={18} color={theme.indigo} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 45 : 55,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  navTabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  navTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6,
  },
  navTabText: {
    fontSize: 12,
  },
  contentScroll: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  balanceHeroCard: {
    padding: 22,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
  },
  balanceHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  balanceHeroLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  monthTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  monthTagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  balanceHeroValue: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 18,
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
  },
  heroStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroStatSub: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  heroStatAmt: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  weeklySummaryCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  weeklySummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weeklyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weeklySummaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  salaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  salaryBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  weeklyMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  weeklyMetricBox: {
    flex: 1,
  },
  weeklyMetricLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  weeklyMetricValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  zenTipsCard: {
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 20,
  },
  zenTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  zenTipTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  zenTipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  zenTipCol: {
    width: '46%',
  },
  zenTipLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  zenTipValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  filtersGroup: {
    marginBottom: 14,
  },
  filterPills: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  filterPillBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 10,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyCounterRow: {
    marginBottom: 10,
  },
  historyCounterText: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  currencyRowSymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    width: 32,
    textAlign: 'center',
  },
  currencyRowName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  currencyRowCode: {
    fontSize: 11,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBoxLarge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});