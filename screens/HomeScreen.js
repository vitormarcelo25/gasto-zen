import React from 'react';
import { Text, View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useApp } from '../context/AppContext';
import WeeklyBarChart from '../components/WeeklyBarChart';
import ProjectionCard from '../components/ProjectionCard';
import TransactionItem from '../components/TransactionItem';

export default function HomeScreen() {
  const {
    theme,
    formatMoney,
    monthCalculations,
    weeklyStats,
    monthProjection,
    dailyBudget,
    weeklySalaryEstimated,
    transactions,
    cards,
    selectedCard,
    cardSummary,
    getCardForTransaction,
    openSalaryModal,
    openEditTransaction,
    requestDelete,
  } = useApp();

  const router = useRouter();

  return (
    <ScrollView
      style={[styles.contentScroll, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.scrollInner}
      showsVerticalScrollIndicator={false}
    >
      {/* CARTÃO DE SALDO PRINCIPAL */}
      <View style={[styles.balanceHeroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.balanceHeroTop}>
          <Text style={[styles.balanceHeroLabel, { color: theme.textSub }]}>Saldo Líquido do Mês</Text>
          <View style={[styles.monthTag, { backgroundColor: theme.bg }]}>
            <Feather name="calendar" size={12} color={theme.textSub} style={{ marginRight: 4 }} />
            <Text style={[styles.monthTagText, { color: theme.textSub }]}>Mês Atual</Text>
          </View>
        </View>

        <Text
          style={[
            styles.balanceHeroValue,
            { color: monthCalculations.balance >= 0 ? theme.green : theme.red },
          ]}
        >
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

          <View
            style={[
              styles.heroStatItem,
              { borderLeftColor: theme.border, borderLeftWidth: 1, paddingLeft: 16 },
            ]}
          >
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
            onPress={openSalaryModal}
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
            <Text
              style={[
                styles.weeklyMetricValue,
                { color: weeklyStats.weeklyBalance >= 0 ? theme.green : theme.red },
              ]}
            >
              {weeklyStats.weeklyBalance >= 0 ? '+' : ''}
              {formatMoney(weeklyStats.weeklyBalance)}
            </Text>
          </View>
        </View>
      </View>

      {/* GRÁFICO DE BARRAS DA SEMANA */}
      <WeeklyBarChart
        dailyBudget={dailyBudget}
        weeklyStats={weeklyStats}
        theme={theme}
        formatMoney={formatMoney}
      />

      {/* CARD PROJEÇÃO DE FINAL DE MÊS */}
      <ProjectionCard
        projection={monthProjection}
        theme={theme}
        formatMoney={formatMoney}
        onConfigureSalary={openSalaryModal}
      />

      {/* ATALHO PARA CARTÕES & FATURAS */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/cartoes')}
        style={[styles.cardQuickBar, { backgroundColor: theme.card, borderColor: theme.border }]}
        activeOpacity={0.8}
      >
        <View style={styles.cardQuickLeft}>
          <View style={[styles.cardQuickIconBox, { backgroundColor: (selectedCard?.color || '#6366F1') + '20' }]}>
            <Feather name="credit-card" size={16} color={selectedCard?.color || '#6366F1'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardQuickTitle, { color: theme.textMain }]}>
              {cards.length > 1 ? `${cards.length} cartões` : (selectedCard?.name || 'Meu Cartão')}
              {' • Fatura: '}{formatMoney(cardSummary?.currentInvoiceAmount || 0)}
            </Text>
            <Text style={[styles.cardQuickSub, { color: theme.textSub }]}>
              {cardSummary?.futureDebtRemaining > 0
                ? `Dívida restante a pagar: ${formatMoney(cardSummary.futureDebtRemaining)}`
                : `Fecha dia ${selectedCard?.closingDay || 10} • Vence dia ${selectedCard?.dueDay || 17}`}
            </Text>
          </View>
        </View>
        <Feather name="chevron-right" size={16} color={theme.textSub} />
      </TouchableOpacity>

      {/* TRANSAÇÕES RECENTES */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textMain }]}>Últimas Transações</Text>
        <TouchableOpacity onPress={() => router.push('/extrato')}>
          <Text style={[styles.sectionLink, { color: theme.indigo }]}>
            Ver todas ({transactions.length})
          </Text>
        </TouchableOpacity>
      </View>

      {transactions.slice(0, 5).map((t) => (
        <TransactionItem
          key={t.id}
          transaction={t}
          theme={theme}
          formatMoney={formatMoney}
          onDelete={requestDelete}
          onPress={openEditTransaction}
          card={getCardForTransaction(t)}
        />
      ))}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  cardQuickBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
  },
  cardQuickLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  cardQuickIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardQuickTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  cardQuickSub: {
    fontSize: 11,
    marginTop: 2,
  },
});
