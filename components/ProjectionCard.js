import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function ProjectionCard({ 
  projection, 
  theme, 
  formatMoney, 
  onConfigureSalary 
}) {
  const {
    projectedEndBalance,
    totalProjectedIncome,
    projectedTotalExpense,
    averageDailyExpense,
    daysRemaining,
    projectedSavingsRate,
    recommendedDailyBudget,
    status
  } = projection;

  const isPositive = projectedEndBalance >= 0;

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* Topo do Card com Status */}
      <View style={styles.topRow}>
        <View style={styles.titleWithIcon}>
          <View style={[styles.iconBox, { backgroundColor: status.color + '20' }]}>
            <Feather name="trending-up" size={18} color={status.color} />
          </View>
          <View>
            <Text style={[styles.cardTitle, { color: theme.textMain }]}>Previsão Final do Mês</Text>
            <Text style={[styles.cardSubtitle, { color: theme.textSub }]}>
              {daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'}
            </Text>
          </View>
        </View>

        {/* Botão para configurar renda esperada */}
        <TouchableOpacity 
          onPress={onConfigureSalary}
          style={[styles.configBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}
        >
          <Feather name="sliders" size={14} color={theme.textSub} />
          <Text style={[styles.configBtnText, { color: theme.textSub }]}>Renda</Text>
        </TouchableOpacity>
      </View>

      {/* Destaque: Quanto vai sobrar no fim do mês */}
      <View style={styles.mainProjection}>
        <Text style={[styles.projectionLabel, { color: theme.textSub }]}>
          Estimativa de Sobra ao Fim do Mês
        </Text>
        <Text style={[
          styles.projectionValue, 
          { color: isPositive ? theme.green : theme.red }
        ]}>
          {isPositive ? '+' : ''}{formatMoney(projectedEndBalance)}
        </Text>

        {/* Barra de Progresso de Poupança */}
        <View style={styles.savingsRateContainer}>
          <View style={styles.savingsRateTextRow}>
            <Text style={[styles.savingsRateLabel, { color: theme.textSub }]}>
              Taxa de Poupança Estimada
            </Text>
            <Text style={[styles.savingsRateNumber, { color: isPositive ? theme.green : theme.red }]}>
              {projectedSavingsRate}%
            </Text>
          </View>
          <View style={[styles.progressBarTrack, { backgroundColor: theme.bg }]}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${Math.min(100, Math.max(0, projectedSavingsRate))}%`,
                  backgroundColor: isPositive ? theme.green : theme.red 
                }
              ]} 
            />
          </View>
        </View>
      </View>

      {/* Renda Prevista e Gasto Total Projetado */}
      <View style={[styles.incomeExpenseRow, { backgroundColor: theme.bg, borderColor: theme.border }]}>
        <View style={styles.incomeExpenseCol}>
          <View style={styles.colHeader}>
            <Feather name="arrow-down-left" size={13} color={theme.green} />
            <Text style={[styles.colLabel, { color: theme.textSub }]}>Renda Prevista</Text>
          </View>
          <Text style={[styles.colValue, { color: theme.textMain }]}>
            {formatMoney(totalProjectedIncome)}
          </Text>
        </View>

        <View style={[styles.incomeExpenseCol, { borderLeftColor: theme.border, borderLeftWidth: 1, paddingLeft: 12 }]}>
          <View style={styles.colHeader}>
            <Feather name="arrow-up-right" size={13} color={theme.red} />
            <Text style={[styles.colLabel, { color: theme.textSub }]}>Gasto Total Previsto</Text>
          </View>
          <Text style={[styles.colValue, { color: theme.textMain }]}>
            {formatMoney(projectedTotalExpense)}
          </Text>
        </View>
      </View>

      {/* Grid de Métricas Inteligentes */}
      <View style={[styles.metricsGrid, { borderTopColor: theme.border }]}>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: theme.textSub }]}>Gasto Médio/Dia</Text>
          <Text style={[styles.metricValue, { color: theme.textMain }]}>
            {formatMoney(averageDailyExpense)}
          </Text>
        </View>

        <View style={[styles.metricItem, { borderLeftColor: theme.border, borderLeftWidth: 1, paddingLeft: 12 }]}>
          <Text style={[styles.metricLabel, { color: theme.textSub }]}>Meta Diária Limite</Text>
          <Text style={[styles.metricValue, { color: theme.green }]}>
            {formatMoney(recommendedDailyBudget)}
          </Text>
        </View>
      </View>

      {/* Alerta Zen com mensagem explicativa */}
      <View style={[styles.statusBanner, { backgroundColor: status.color + '15', borderColor: status.color + '40' }]}>
        <Text style={[styles.statusTitle, { color: status.color }]}>{status.title}</Text>
        <Text style={[styles.statusMessage, { color: theme.textMain }]}>{status.message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  configBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  configBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  mainProjection: {
    marginBottom: 14,
  },
  projectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  projectionValue: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  savingsRateContainer: {
    marginTop: 10,
  },
  savingsRateTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  savingsRateLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  savingsRateNumber: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  incomeExpenseRow: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  incomeExpenseCol: {
    flex: 1,
  },
  colHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  colLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  colValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginBottom: 14,
    borderTopWidth: 1,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  statusBanner: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statusMessage: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
});
