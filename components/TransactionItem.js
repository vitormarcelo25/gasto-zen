import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';

export default function TransactionItem({ 
  transaction, 
  theme, 
  formatMoney, 
  onDelete,
  onPress 
}) {
  const isIncome = transaction.type === 'income';

  const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
  const cat = allCategories.find(
    c => c.id === transaction.categoryId || c.label.toLowerCase() === (transaction.category || '').toLowerCase()
  ) || { icon: isIncome ? 'trending-up' : 'trending-down', color: isIncome ? theme.green : theme.red };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
  };

  const handleDeletePress = (e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    Alert.alert(
      'Excluir Transação',
      `Deseja remover "${transaction.description}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => onDelete(transaction.id) },
      ]
    );
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent 
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={onPress ? () => onPress(transaction) : undefined}
      activeOpacity={0.7}
    >
      <View style={styles.leftRow}>
        <View style={[styles.iconBox, { backgroundColor: cat.color + '20' }]}>
          <Feather name={cat.icon} size={18} color={cat.color} />
        </View>
        <View style={styles.infoCol}>
          <Text style={[styles.description, { color: theme.textMain }]} numberOfLines={1}>
            {transaction.description}
          </Text>
          <View style={styles.badgeRow}>
            <Text style={[styles.categoryBadge, { color: theme.textSub }]}>
              {transaction.category}
            </Text>
            <Text style={[styles.bullet, { color: theme.textSub }]}>•</Text>
            <Text style={[styles.dateText, { color: theme.textSub }]}>
              {formatDateLabel(transaction.date)}
            </Text>
            {transaction.recurrence && transaction.recurrence !== 'single' && (
              <>
                <Text style={[styles.bullet, { color: theme.textSub }]}>•</Text>
                <View style={[styles.recurrenceTag, { backgroundColor: theme.indigo + '20' }]}>
                  <Text style={[styles.recurrenceText, { color: theme.indigo }]}>
                    {transaction.recurrence === 'weekly' ? 'Semanal' : 'Mensal'}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </View>

      <View style={styles.rightRow}>
        <Text style={[
          styles.amount, 
          { color: isIncome ? theme.green : theme.red }
        ]}>
          {isIncome ? '+' : '-'}{formatMoney(transaction.amount)}
        </Text>
        <TouchableOpacity 
          onPress={handleDeletePress} 
          style={styles.deleteBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="trash-2" size={14} color={theme.textSub} />
        </TouchableOpacity>
      </View>
    </CardComponent>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  categoryBadge: {
    fontSize: 11,
    fontWeight: '600',
  },
  bullet: {
    fontSize: 10,
  },
  dateText: {
    fontSize: 11,
  },
  recurrenceTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  recurrenceText: {
    fontSize: 10,
    fontWeight: '600',
  },
  rightRow: {
    alignItems: 'flex-end',
    gap: 6,
    marginLeft: 10,
  },
  amount: {
    fontSize: 15,
    fontWeight: '900',
  },
  deleteBtn: {
    padding: 2,
    opacity: 0.7,
  },
});
