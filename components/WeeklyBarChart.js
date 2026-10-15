import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Feather } from '@expo/vector-icons';

const CHART_H = 150;
const Y_AXIS_W = 34;
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const FULL_DAY = {
  Seg: 'Segunda', Ter: 'Terça', Qua: 'Quarta', Qui: 'Quinta',
  Sex: 'Sexta', 'Sáb': 'Sábado', Dom: 'Domingo',
};

// Arredonda o topo da escala para um valor "bonito" (1, 2, 2.5, 5 x 10^n)
const niceMax = (v) => {
  if (!v || v <= 0) return 100;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return m * p;
};

const compact = (v) => {
  if (v >= 1000) {
    const k = v / 1000;
    return `${k % 1 === 0 ? k : k.toFixed(1).replace('.', ',')}k`;
  }
  return String(Math.round(v));
};

// Linha pontilhada confiável em todas as plataformas
const DottedLine = ({ color }) => (
  <View style={styles.dottedRow}>
    {Array.from({ length: 40 }).map((_, i) => (
      <View key={i} style={[styles.dot, { backgroundColor: color }]} />
    ))}
  </View>
);

export default function WeeklyBarChart({ weeklyStats, theme, formatMoney, dailyBudget = 0 }) {
  const {
    dailyData,
    weeklyExpense,
    weeklyIncome,
    previousWeekExpense = 0,
    averageDailyExpense = 0,
    daysElapsed = 7,
  } = weeklyStats;

  const todayIdx = dailyData.findIndex(d => d.isToday);
  const [selectedIdx, setSelectedIdx] = useState(todayIdx >= 0 ? todayIdx : 0);
  const selected = dailyData[selectedIdx] || dailyData[0];

  // Animação de crescimento das barras
  const grow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    grow.setValue(0);
    Animated.timing(grow, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [weeklyExpense, grow]);

  // Escala baseada APENAS em despesas e no limite diário
  const maxExpense = Math.max(...dailyData.map(d => d.expense), 0);
  const scaleMax = niceMax(Math.max(maxExpense, dailyBudget) * 1.1);
  const toH = (v) => Math.min(CHART_H, (v / scaleMax) * CHART_H);
  const hasBudget = dailyBudget > 0;

  // Indicadores
  const weeklyBudget = dailyBudget * 7;
  const budgetUsedPct = weeklyBudget > 0 ? (weeklyExpense / weeklyBudget) * 100 : 0;
  const diffPct = previousWeekExpense > 0
    ? Math.round(((weeklyExpense - previousWeekExpense) / previousWeekExpense) * 100)
    : null;
  const spentMore = diffPct !== null && diffPct > 0;
  const pastDays = dailyData.filter(d => !d.isFuture);
  const daysWithinLimit = hasBudget ? pastDays.filter(d => d.expense <= dailyBudget).length : null;

  const first = dailyData[0]?.date;
  const last = dailyData[6]?.date;
  const rangeLabel = first && last
    ? `${first.getDate()} ${MONTHS[first.getMonth()]} – ${last.getDate()} ${MONTHS[last.getMonth()]}`
    : '';

  const barColor = (day) => {
    if (hasBudget && day.expense > dailyBudget) return theme.red;
    return theme.green;
  };

  // Status do dia selecionado
  const dayStatus = (() => {
    if (!selected) return null;
    if (selected.isFuture) return { label: 'Dia futuro', color: theme.textSub, icon: 'clock' };
    if (selected.expense === 0) return { label: 'Sem gastos', color: theme.green, icon: 'smile' };
    if (!hasBudget) return { label: 'Registrado', color: theme.indigo, icon: 'check' };
    if (selected.expense > dailyBudget) return { label: 'Acima do limite', color: theme.red, icon: 'alert-triangle' };
    return { label: 'Dentro do limite', color: theme.green, icon: 'check-circle' };
  })();

  const selectedLimitPct = hasBudget && selected ? Math.min(100, (selected.expense / dailyBudget) * 100) : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={[styles.iconCircle, { backgroundColor: theme.indigo + '20' }]}>
            <Feather name="activity" size={18} color={theme.indigo} />
          </View>
          <View>
            <Text style={[styles.title, { color: theme.textMain }]}>Evolução Semanal</Text>
            <Text style={[styles.subtitle, { color: theme.textSub }]}>{rangeLabel}</Text>
          </View>
        </View>

        {diffPct !== null && (
          <View style={[styles.diffBadge, { backgroundColor: (spentMore ? theme.red : theme.green) + '18' }]}>
            <Feather
              name={spentMore ? 'trending-up' : 'trending-down'}
              size={12}
              color={spentMore ? theme.red : theme.green}
            />
            <Text style={[styles.diffBadgeText, { color: spentMore ? theme.red : theme.green }]}>
              {spentMore ? '+' : ''}{diffPct}% vs sem. passada
            </Text>
          </View>
        )}
      </View>

      {/* HERO: total gasto + orçamento */}
      <View style={styles.heroRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroLabel, { color: theme.textSub }]}>Gasto nesta semana</Text>
          <Text style={[styles.heroValue, { color: theme.textMain }]}>{formatMoney(weeklyExpense)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.heroLabel, { color: theme.textSub }]}>Entradas</Text>
          <Text style={[styles.heroIncome, { color: theme.green }]}>+{formatMoney(weeklyIncome)}</Text>
        </View>
      </View>

      {hasBudget && (
        <View style={styles.budgetBlock}>
          <View style={[styles.budgetTrack, { backgroundColor: theme.bg }]}>
            <View
              style={[
                styles.budgetFill,
                {
                  width: `${Math.min(100, budgetUsedPct)}%`,
                  backgroundColor: budgetUsedPct > 100 ? theme.red : budgetUsedPct > 80 ? theme.yellow : theme.green,
                },
              ]}
            />
          </View>
          <Text style={[styles.budgetText, { color: theme.textSub }]}>
            <Text style={{ color: theme.textMain, fontWeight: '700' }}>{Math.round(budgetUsedPct)}%</Text>
            {' '}do orçamento semanal de {formatMoney(weeklyBudget)}
          </Text>
        </View>
      )}

      {/* GRÁFICO */}
      <View style={styles.chartRow}>
        {/* Eixo Y */}
        <View style={[styles.yAxis, { height: CHART_H }]}>
          {[1, 0.5, 0].map(f => (
            <Text key={f} style={[styles.yLabel, { color: theme.textSub }]}>
              {compact(scaleMax * f)}
            </Text>
          ))}
        </View>

        {/* Área de plotagem */}
        <View style={[styles.plot, { height: CHART_H }]}>
          {/* Grid */}
          {[1, 0.5, 0].map(f => (
            <View
              key={f}
              style={[
                styles.gridLine,
                { bottom: CHART_H * f, backgroundColor: theme.border, opacity: f === 0 ? 1 : 0.5 },
              ]}
            />
          ))}

          {/* Linha do limite diário */}
          {hasBudget && (
            <View style={[styles.limitLine, { bottom: toH(dailyBudget) }]} pointerEvents="none">
              <DottedLine color={theme.yellow} />
              <View style={[styles.limitPill, { backgroundColor: theme.yellow }]}>
                <Text style={styles.limitPillText}>limite {compact(dailyBudget)}</Text>
              </View>
            </View>
          )}

          {/* Barras */}
          <View style={styles.barsRow}>
            {dailyData.map((day, idx) => {
              const isSel = idx === selectedIdx;
              const h = day.expense > 0 ? Math.max(6, toH(day.expense)) : 4;
              const color = barColor(day);

              return (
                <TouchableOpacity
                  key={day.dateString}
                  style={styles.barSlot}
                  activeOpacity={0.8}
                  onPress={() => setSelectedIdx(idx)}
                >
                  {isSel && <View style={[styles.selHighlight, { backgroundColor: theme.indigo + '12' }]} />}

                  {day.isFuture ? (
                    <View style={[styles.futureBar, { borderColor: theme.border }]} />
                  ) : (
                    <Animated.View
                      style={[
                        styles.bar,
                        {
                          height: grow.interpolate({ inputRange: [0, 1], outputRange: [0, h] }),
                          backgroundColor: day.expense > 0 ? color : theme.border,
                          opacity: isSel ? 1 : 0.6,
                          width: isSel ? 22 : 18,
                        },
                      ]}
                    >
                      {day.expense > 0 && <View style={[styles.barShine]} />}
                    </Animated.View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Rótulos dos dias */}
      <View style={[styles.daysRow, { marginLeft: Y_AXIS_W }]}>
        {dailyData.map((day, idx) => {
          const isSel = idx === selectedIdx;
          return (
            <TouchableOpacity key={day.dateString} style={styles.dayCell} onPress={() => setSelectedIdx(idx)}>
              <Text
                style={[
                  styles.dayLabel,
                  {
                    color: isSel ? theme.indigo : day.isToday ? theme.textMain : theme.textSub,
                    fontWeight: isSel || day.isToday ? '800' : '600',
                  },
                ]}
              >
                {day.dayName}
              </Text>
              <View style={styles.dayMarkers}>
                {day.isToday && <View style={[styles.todayDot, { backgroundColor: theme.indigo }]} />}
                {day.income > 0 && <View style={[styles.todayDot, { backgroundColor: theme.green }]} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legenda */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: theme.green }]} />
          <Text style={[styles.legendText, { color: theme.textSub }]}>No limite</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: theme.red }]} />
          <Text style={[styles.legendText, { color: theme.textSub }]}>Acima</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDotSmall, { backgroundColor: theme.green }]} />
          <Text style={[styles.legendText, { color: theme.textSub }]}>Teve entrada</Text>
        </View>
      </View>

      {/* DETALHE DO DIA SELECIONADO */}
      {selected && dayStatus && (
        <View style={[styles.detailCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
          <View style={styles.detailHeader}>
            <Text style={[styles.detailTitle, { color: theme.textMain }]}>
              {FULL_DAY[selected.dayName] || selected.dayName}, {selected.dayOfMonth} {MONTHS[selected.date.getMonth()]}
              {selected.isToday ? ' · hoje' : ''}
            </Text>
            <View style={[styles.statusPill, { backgroundColor: dayStatus.color + '1F' }]}>
              <Feather name={dayStatus.icon} size={11} color={dayStatus.color} />
              <Text style={[styles.statusPillText, { color: dayStatus.color }]}>{dayStatus.label}</Text>
            </View>
          </View>

          <View style={styles.detailMetrics}>
            <View style={styles.detailMetric}>
              <Text style={[styles.detailMetricLabel, { color: theme.textSub }]}>Gastos</Text>
              <Text style={[styles.detailMetricValue, { color: selected.expense > 0 ? theme.red : theme.textMain }]}>
                {formatMoney(selected.expense)}
              </Text>
            </View>
            <View style={[styles.detailDivider, { backgroundColor: theme.border }]} />
            <View style={styles.detailMetric}>
              <Text style={[styles.detailMetricLabel, { color: theme.textSub }]}>Entradas</Text>
              <Text style={[styles.detailMetricValue, { color: selected.income > 0 ? theme.green : theme.textMain }]}>
                {formatMoney(selected.income)}
              </Text>
            </View>
            <View style={[styles.detailDivider, { backgroundColor: theme.border }]} />
            <View style={styles.detailMetric}>
              <Text style={[styles.detailMetricLabel, { color: theme.textSub }]}>Lançamentos</Text>
              <Text style={[styles.detailMetricValue, { color: theme.textMain }]}>{selected.count}</Text>
            </View>
          </View>

          {hasBudget && !selected.isFuture && (
            <View style={{ marginTop: 12 }}>
              <View style={[styles.budgetTrack, { backgroundColor: theme.card, height: 6 }]}>
                <View
                  style={[
                    styles.budgetFill,
                    {
                      width: `${selectedLimitPct}%`,
                      backgroundColor: selected.expense > dailyBudget ? theme.red : theme.green,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.detailFoot, { color: theme.textSub }]}>
                {selected.expense > dailyBudget
                  ? `Passou ${formatMoney(selected.expense - dailyBudget)} do limite diário`
                  : `Sobrou ${formatMoney(dailyBudget - selected.expense)} do limite diário`}
              </Text>
            </View>
          )}

          {selected.topCategory && (
            <View style={[styles.topCatRow, { borderTopColor: theme.border }]}>
              <Feather name="tag" size={12} color={theme.textSub} />
              <Text style={[styles.detailFoot, { color: theme.textSub, marginTop: 0 }]}>
                Maior gasto em{' '}
                <Text style={{ color: theme.textMain, fontWeight: '700' }}>{selected.topCategory}</Text>
                {' '}({formatMoney(selected.topCategoryAmount)})
              </Text>
            </View>
          )}
        </View>
      )}

      {/* INSIGHTS */}
      <View style={styles.insightsRow}>
        <View style={[styles.insightTile, { backgroundColor: theme.bg }]}>
          <Feather name="bar-chart" size={14} color={theme.indigo} />
          <Text style={[styles.insightValue, { color: theme.textMain }]}>{formatMoney(averageDailyExpense)}</Text>
          <Text style={[styles.insightLabel, { color: theme.textSub }]}>média/dia</Text>
        </View>
        <View style={[styles.insightTile, { backgroundColor: theme.bg }]}>
          <Feather name="target" size={14} color={theme.green} />
          <Text style={[styles.insightValue, { color: theme.textMain }]}>
            {daysWithinLimit !== null ? `${daysWithinLimit}/${daysElapsed}` : '—'}
          </Text>
          <Text style={[styles.insightLabel, { color: theme.textSub }]}>dias no limite</Text>
        </View>
        <View style={[styles.insightTile, { backgroundColor: theme.bg }]}>
          <Feather name="zap" size={14} color={theme.yellow} />
          <Text style={[styles.insightValue, { color: theme.textMain }]}>
            {hasBudget ? formatMoney(Math.max(0, weeklyBudget - weeklyExpense)) : '—'}
          </Text>
          <Text style={[styles.insightLabel, { color: theme.textSub }]}>livre na semana</Text>
        </View>
      </View>
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
    marginTop: 1,
  },
  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  diffBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  heroValue: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroIncome: {
    fontSize: 14,
    fontWeight: '800',
  },
  budgetBlock: {
    marginBottom: 18,
  },
  budgetTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  budgetFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetText: {
    fontSize: 11,
    marginTop: 6,
  },
  chartRow: {
    flexDirection: 'row',
  },
  yAxis: {
    width: Y_AXIS_W,
    justifyContent: 'space-between',
    paddingRight: 6,
  },
  yLabel: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'right',
    marginVertical: -6,
  },
  plot: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  limitLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    zIndex: 2,
    justifyContent: 'center',
  },
  dottedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  dot: {
    width: 4,
    height: 1.5,
    borderRadius: 1,
  },
  limitPill: {
    position: 'absolute',
    right: 0,
    top: -18,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  limitPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1A1300',
  },
  barsRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  barSlot: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  selHighlight: {
    ...StyleSheet.absoluteFillObject,
    marginHorizontal: 3,
    borderRadius: 10,
  },
  bar: {
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    overflow: 'hidden',
  },
  barShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '40%',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  futureBar: {
    width: 18,
    height: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderBottomWidth: 0,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
  },
  daysRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 11,
  },
  dayMarkers: {
    flexDirection: 'row',
    gap: 3,
    height: 8,
    marginTop: 3,
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: 8,
    marginBottom: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '600',
  },
  detailCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  detailTitle: {
    fontSize: 13,
    fontWeight: '800',
    flexShrink: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  detailMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailMetric: {
    flex: 1,
    alignItems: 'center',
  },
  detailDivider: {
    width: 1,
    height: 28,
  },
  detailMetricLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 3,
  },
  detailMetricValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  detailFoot: {
    fontSize: 11,
    marginTop: 6,
  },
  topCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  insightsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  insightTile: {
    flex: 1,
    borderRadius: 14,
    padding: 10,
    gap: 4,
  },
  insightValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  insightLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
});
