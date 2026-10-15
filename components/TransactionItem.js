import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
    if (onDelete) {
      onDelete(transaction);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* Área clicável principal para abrir edição */}
      <TouchableOpacity 
        style={styles.clickableContent}
        onPress={onPress ? () => onPress(transaction) : undefined}
        activeOpacity={0.7}
      >
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
            {transaction.paymentMethod === 'credit' && (
              <>
                <Text style={[styles.bullet, { color: theme.textSub }]}>•</Text>
                <View style={[styles.recurrenceTag, { backgroundColor: theme.indigo + '20' }]}>
                  <Text style={[styles.recurrenceText, { color: theme.indigo }]}>
                    {transaction.isSubscription
                      ? '💳 Assinatura'
                      : (transaction.installmentsCount > 1
                        ? `💳 ${transaction.installmentIndex}/${transaction.installmentsCount}`
                        : '💳 Crédito')}
                  </Text>
                </View>
              </>
            )}
            {transaction.recurrence && transaction.recurrence !== 'single' && !transaction.isSubscription && (
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
      </TouchableOpacity>

      {/* Área lateral com valor e botão de exclusão */}
      <View style={styles.rightActions}>
        <Text style={[
          styles.amount, 
          { color: isIncome ? theme.green : theme.red }
        ]}>
          {isIncome ? '+' : '-'}{formatMoney(transaction.amount)}
        </Text>
        <TouchableOpacity 
          onPress={handleDeletePress} 
          style={[styles.deleteBtn, { backgroundColor: theme.red + '15' }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.6}
        >
          <Feather name="trash-2" size={15} color={theme.red} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
  },
  clickableContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingVertical: 4,
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
  rightActions: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    marginLeft: 12,
  },
  amount: {
    fontSize: 14,
    fontWeight: '900',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
