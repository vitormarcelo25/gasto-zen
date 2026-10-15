import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function WeeklyBarChart({ weeklyStats, theme, formatMoney }) {
  const { dailyData, weeklyExpense, weeklyIncome, weeklyBalance, highestExpenseDay, maxDailyValue } = weeklyStats;

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* Header do Card */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={[styles.iconCircle, { backgroundColor: theme.indigo + '20' }]}>
            <Feather name="bar-chart-2" size={18} color={theme.indigo} />
          </View>
          <View>
            <Text style={[styles.title, { color: theme.textMain }]}>Evolução Semanal</Text>
            <Text style={[styles.subtitle, { color: theme.textSub }]}>Segunda a Domingo</Text>
          </View>
        </View>

        {/* Badge do Saldo da Semana */}
        <View style={[
          styles.balanceBadge, 
          { backgroundColor: weeklyBalance >= 0 ? theme.green + '15' : theme.red + '15' }
        ]}>
          <Text style={[
            styles.balanceBadgeText, 
            { color: weeklyBalance >= 0 ? theme.green : theme.red }
          ]}>
            {weeklyBalance >= 0 ? '+' : ''}{formatMoney(weeklyBalance)}
          </Text>
        </View>
      </View>

      {/* Gráfico de Barras */}
      <View style={styles.chartArea}>
        {dailyData.map((day) => {
          // Altura proporcional (max 100px)
          const expenseHeight = maxDailyValue > 0 ? Math.min(100, Math.max(6, (day.expense / maxDailyValue) * 100)) : 6;
          const incomeHeight = maxDailyValue > 0 ? Math.min(100, Math.max(6, (day.income / maxDailyValue) * 100)) : 6;

          return (
            <View key={day.dateString} style={styles.dayColumn}>
              {/* Tooltip rápido do valor gasto se houver */}
              {day.expense > 0 && (
                <Text style={[styles.tinyValue, { color: theme.textSub }]} numberOfLines={1}>
                  {Math.round(day.expense)}
                </Text>
              )}

              {/* Trilho de Barras */}
              <View style={styles.barTrack}>
                {day.income > 0 && (
                  <View 
                    style={[
                      styles.bar, 
                      styles.incomeBar, 
                      { height: incomeHeight, backgroundColor: theme.green }
                    ]} 
                  />
                )}
                <View 
                  style={[
                    styles.bar, 
                    styles.expenseBar, 
                    { 
                      height: expenseHeight, 
                      backgroundColor: day.expense > 0 ? theme.red : theme.border,
                      opacity: day.expense > 0 ? 1 : 0.4
                    }
                  ]} 
                />
              </View>

              {/* Rótulo do Dia */}
              <View style={[
                styles.dayLabelContainer, 
                day.isToday && { backgroundColor: theme.indigo, borderRadius: 8 }
              ]}>
                <Text style={[
                  styles.dayLabel, 
                  { color: day.isToday ? '#FFF' : theme.textSub, fontWeight: day.isToday ? 'bold' : '600' }
                ]}>
                  {day.dayName}
                </Text>
              </View>

              <Text style={[styles.dayDate, { color: theme.textSub }]}>
                {day.dayOfMonth}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Legenda & Destaques da Semana */}
      <View style={[styles.footerRow, { borderTopColor: theme.border }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.red }]} />
          <Text style={[styles.legendText, { color: theme.textSub }]}>Gastos: </Text>
          <Text style={[styles.legendValue, { color: theme.textMain }]}>{formatMoney(weeklyExpense)}</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.green }]} />
          <Text style={[styles.legendText, { color: theme.textSub }]}>Receitas: </Text>
          <Text style={[styles.legendValue, { color: theme.textMain }]}>{formatMoney(weeklyIncome)}</Text>
        </View>
      </View>

      {/* Dica / Alerta do Maior Gasto da semana */}
      {highestExpenseDay && (
        <View style={[styles.alertTip, { backgroundColor: theme.bg }]}>
          <Feather name="info" size={14} color={theme.textSub} />
          <Text style={[styles.alertTipText, { color: theme.textSub }]}>
            Maior despesa na <Text style={{ color: theme.textMain, fontWeight: 'bold' }}>{highestExpenseDay.dayName} ({formatMoney(highestExpenseDay.expense)})</Text>
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  balanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  balanceBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingVertical: 10,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  tinyValue: {
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 4,
  },
  barTrack: {
    height: 100,
    width: 20,
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  bar: {
    width: 8,
    borderRadius: 4,
  },
  incomeBar: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  expenseBar: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  dayLabelContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 8,
  },
  dayLabel: {
    fontSize: 11,
  },
  dayDate: {
    fontSize: 9,
    marginTop: 2,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
  },
  legendValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  alertTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 10,
  },
  alertTipText: {
    fontSize: 11,
  },
});
