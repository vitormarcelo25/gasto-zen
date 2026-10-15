import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useApp } from '../context/AppContext';
import { CURRENCIES } from '../constants/categories';
import TransactionModal from './TransactionModal';
import SalaryConfigModal from './SalaryConfigModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import CardConfigModal from './CardConfigModal';

export default function AppModals() {
  const {
    theme,
    currencySymbol,
    formatMoney,
    settings,
    updateSettings,
    resetDemoData,
    isTransactionModalOpen,
    editingTransaction,
    closeTransactionModal,
    addTransaction,
    updateTransaction,
    requestDelete,
    isSalaryModalOpen,
    closeSalaryModal,
    isCardModalOpen,
    closeCardModal,
    cards,
    cardModalTarget,
    saveCard,
    deleteCard,
    isCurrencyModalOpen,
    closeCurrencyModal,
    selectCurrency,
    isDeleteModalOpen,
    transactionToDelete,
    closeDeleteModal,
    confirmDelete,
    currency,
  } = useApp();

  return (
    <>
      <TransactionModal
        key={isTransactionModalOpen ? (editingTransaction ? editingTransaction.id : 'new') : 'closed'}
        visible={isTransactionModalOpen}
        onClose={closeTransactionModal}
        onAddTransaction={addTransaction}
        onUpdateTransaction={updateTransaction}
        onDeleteTransaction={requestDelete}
        transactionToEdit={editingTransaction}
        theme={theme}
        currencySymbol={currencySymbol}
        cards={cards}
      />

      <CardConfigModal
        key={isCardModalOpen ? (cardModalTarget ? cardModalTarget.id : 'card-new') : 'card-closed'}
        visible={isCardModalOpen}
        onClose={closeCardModal}
        card={cardModalTarget}
        onSaveCard={saveCard}
        onDeleteCard={deleteCard}
        canDelete={cards.length > 1}
        theme={theme}
        currencySymbol={currencySymbol}
      />

      <SalaryConfigModal
        key={isSalaryModalOpen ? 'salary-open' : 'salary-closed'}
        visible={isSalaryModalOpen}
        onClose={closeSalaryModal}
        settings={settings}
        onSaveSettings={updateSettings}
        onResetData={resetDemoData}
        theme={theme}
        currencySymbol={currencySymbol}
        formatMoney={formatMoney}
      />

      <DeleteConfirmModal
        visible={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        transaction={transactionToDelete}
        theme={theme}
        formatMoney={formatMoney}
      />

      <Modal visible={isCurrencyModalOpen} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitleText, { color: theme.textMain }]}>Selecionar Moeda</Text>
              <TouchableOpacity onPress={closeCurrencyModal}>
                <Feather name="x" size={20} color={theme.textSub} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 10, marginTop: 14 }}>
              {CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  onPress={() => selectCurrency(c.code)}
                  style={[
                    styles.currencyRow,
                    {
                      backgroundColor: currency === c.code ? theme.indigo + '20' : theme.bg,
                      borderColor: currency === c.code ? theme.indigo : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.currencyRowSymbol,
                      { color: currency === c.code ? theme.indigo : theme.textMain },
                    ]}
                  >
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
    </>
  );
}

const styles = StyleSheet.create({
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
});
