import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { EXPENSE_CATEGORIES } from '../constants/categories';

export default function CategoryBreakdownCard({ breakdown, theme, formatMoney, period = 'month' }) {
  const { categories, totalExpense } = breakdown;

  const getCategoryDetails = (catName) => {
    const found = EXPENSE_CATEGORIES.find(
      c => c.label.toLowerCase() === catName.toLowerCase() || c.id === catName.toLowerCase()
    );
    return found || { icon: 'grid', color: '#64748B', label: catName };
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconCircle, { backgroundColor: theme.pink ? theme.pink + '20' : '#EC489920' }]}>
            <Feather name="pie-chart" size={18} color="#EC4899" />
          </View>
          <View>
            <Text style={[styles.title, { color: theme.textMain }]}>Gastos por Categoria</Text>
            <Text style={[styles.subtitle, { color: theme.textSub }]}>
              {period === 'week' ? 'Nesta semana' : 'Neste mês'} ({formatMoney(totalExpense)})
            </Text>
          </View>
        </View>
      </View>

      {categories.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.textSub }]}>
            Nenhuma despesa registrada neste período.
          </Text>
        </View>
      ) : (
        <View style={styles.categoriesList}>
          {categories.slice(0, 6).map((item) => {
            const details = getCategoryDetails(item.category);
            return (
              <View key={item.category} style={styles.categoryItem}>
                <View style={styles.catHeader}>
                  <View style={styles.catNameRow}>
                    <View style={[styles.catIconBox, { backgroundColor: details.color + '20' }]}>
                      <Feather name={details.icon} size={14} color={details.color} />
                    </View>
                    <Text style={[styles.catName, { color: theme.textMain }]}>
                      {details.label}
                    </Text>
                  </View>

                  <View style={styles.catAmountRow}>
                    <Text style={[styles.catAmount, { color: theme.textMain }]}>
                      {formatMoney(item.amount)}
                    </Text>
                    <Text style={[styles.catPercent, { color: theme.textSub }]}>
                      {item.percentage}%
                    </Text>
                  </View>
                </View>

                {/* Barra de progresso */}
                <View style={[styles.progressTrack, { backgroundColor: theme.bg }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${item.percentage}%`, backgroundColor: details.color }
                    ]} 
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
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
  emptyState: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
  },
  categoriesList: {
    gap: 14,
  },
  categoryItem: {
    gap: 6,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
  },
  catAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catAmount: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  catPercent: {
    fontSize: 11,
    fontWeight: '600',
    width: 30,
    textAlign: 'right',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
