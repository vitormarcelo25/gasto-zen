import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';

export default function DeleteConfirmModal({
  visible,
  onClose,
  onConfirm,
  transaction,
  theme,
  formatMoney,
}) {
  if (!transaction) return null;

  const isIncome = transaction.type === 'income';
  const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
  const cat = allCategories.find(
    c => c.id === transaction.categoryId || c.label.toLowerCase() === (transaction.category || '').toLowerCase()
  ) || { icon: isIncome ? 'trending-up' : 'trending-down', color: isIncome ? theme.green : theme.red };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Ícone com Glow Vermelho */}
          <View style={[styles.iconWrap, { backgroundColor: theme.red + '18' }]}>
            <View style={[styles.iconInner, { backgroundColor: theme.red + '25' }]}>
              <Feather name="trash-2" size={24} color={theme.red} />
            </View>
          </View>

          {/* Título & Descrição */}
          <Text style={[styles.title, { color: theme.textMain }]}>Excluir Transação</Text>
          <Text style={[styles.subtitle, { color: theme.textSub }]}>
            Tem certeza que deseja excluir esta transação? Essa ação não pode ser desfeita.
          </Text>

          {/* Card Resumo da Transação a ser Excluída */}
          <View style={[styles.previewBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <View style={[styles.catIconBox, { backgroundColor: cat.color + '20' }]}>
              <Feather name={cat.icon} size={16} color={cat.color} />
            </View>

            <View style={styles.previewInfo}>
              <Text style={[styles.previewDesc, { color: theme.textMain }]} numberOfLines={1}>
                {transaction.description}
              </Text>
              <Text style={[styles.previewCat, { color: theme.textSub }]}>
                {transaction.category}
              </Text>
            </View>

            <Text style={[styles.previewAmount, { color: isIncome ? theme.green : theme.red }]}>
              {isIncome ? '+' : '-'}{formatMoney(transaction.amount)}
            </Text>
          </View>

          {/* Botões de Ação */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelBtnText, { color: theme.textMain }]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteBtn, { backgroundColor: theme.red }]}
              onPress={() => {
                onConfirm(transaction.id);
                onClose();
              }}
              activeOpacity={0.85}
            >
              <Feather name="trash-2" size={16} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.deleteBtnText}>Sim, excluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 18,
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 22,
    gap: 10,
  },
  catIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewInfo: {
    flex: 1,
  },
  previewDesc: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  previewCat: {
    fontSize: 11,
    fontWeight: '500',
  },
  previewAmount: {
    fontSize: 14,
    fontWeight: '900',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  deleteBtn: {
    flex: 1.2,
    flexDirection: 'row',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F43F5E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
