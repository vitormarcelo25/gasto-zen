import React from 'react';
import { Text, View, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useApp } from '../context/AppContext';
import WeeklyBarChart from '../components/WeeklyBarChart';
import ProjectionCard from '../components/ProjectionCard';
import CategoryBreakdownCard from '../components/CategoryBreakdownCard';

export default function AnalyticsScreen() {
  const {
    theme,
    formatMoney,
    weeklyStats,
    monthProjection,
    categoryBreakdownMonth,
    categoryBreakdownWeek,
    dailyBudget,
    settings,
    openSalaryModal,
  } = useApp();

  return (
    <ScrollView
      style={styles.contentScroll}
      contentContainerStyle={styles.scrollInner}
      showsVerticalScrollIndicator={false}
    >
      {/* CARD PROJEÇÃO DE FINAL DE MÊS DETALHADA */}
      <ProjectionCard
        projection={monthProjection}
        theme={theme}
        formatMoney={formatMoney}
        onConfigureSalary={openSalaryModal}
      />

      {/* GRÁFICO SEMANAL DETALHADO */}
      <WeeklyBarChart
        dailyBudget={dailyBudget}
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
            <Text style={[styles.zenTipLabel, { color: theme.textSub }]}>Teto Diário Restante</Text>
            <Text style={[styles.zenTipValue, { color: theme.green }]}>
              {formatMoney(monthProjection.recommendedDailyBudget)}
            </Text>
          </View>
          <View style={styles.zenTipCol}>
            <Text style={[styles.zenTipLabel, { color: theme.textSub }]}>
              {settings.salaryType === 'weekly' ? 'Salário Semanal' : 'Salário Mensal'}
            </Text>
            <Text style={[styles.zenTipValue, { color: theme.indigo }]}>
              {formatMoney(settings.baseSalary || 0)}
              <Text style={{ fontSize: 10, fontWeight: 'normal' }}>
                {settings.salaryType === 'weekly' ? ' /sem' : ' /mês'}
              </Text>
            </Text>
          </View>
        </View>
      </View>

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
});
