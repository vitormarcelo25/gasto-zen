import React from 'react';
import { Text, View, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useApp } from '../context/AppContext';
import TransactionItem from '../components/TransactionItem';

const PERIOD_OPTIONS = [
  { id: 'month', label: 'Este Mês' },
  { id: 'week', label: 'Esta Semana' },
  { id: 'all', label: 'Todos' },
];

const TYPE_OPTIONS = [
  { id: 'all', label: 'Todas' },
  { id: 'expense', label: 'Despesas' },
  { id: 'income', label: 'Receitas' },
];

export default function HistoryScreen() {
  const {
    theme,
    formatMoney,
    filteredTransactions,
    filters,
    openEditTransaction,
    requestDelete,
    getCardForTransaction,
  } = useApp();

  const { searchQuery, setSearchQuery, period, setPeriod, type, setType } = filters;

  return (
    <ScrollView
      style={[styles.contentScroll, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.scrollInner}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Barra de Pesquisa */}
      <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Feather name="search" size={18} color={theme.textSub} style={{ marginRight: 10 }} />
        <TextInput
          style={[styles.searchInput, { color: theme.textMain }]}
          placeholder="Pesquisar por descrição ou categoria..."
          placeholderTextColor={theme.textSub}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Feather name="x-circle" size={18} color={theme.textSub} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros por Período */}
      <View style={styles.filtersGroup}>
        <View style={[styles.filterPills, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {PERIOD_OPTIONS.map((p) => (
            <TouchableOpacity
              key={p.id}
              onPress={() => setPeriod(p.id)}
              style={[
                styles.filterPillBtn,
                period === p.id && { backgroundColor: theme.indigo },
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  { color: period === p.id ? '#FFF' : theme.textSub },
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Filtros por Tipo */}
        <View
          style={[
            styles.filterPills,
            { backgroundColor: theme.card, borderColor: theme.border, marginTop: 8 },
          ]}
        >
          {TYPE_OPTIONS.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setType(t.id)}
              style={[
                styles.filterPillBtn,
                type === t.id && {
                  backgroundColor:
                    t.id === 'expense' ? theme.red : t.id === 'income' ? theme.green : theme.indigo,
                },
              ]}
            >
              <Text
                style={[styles.filterPillText, { color: type === t.id ? '#FFF' : theme.textSub }]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Contador de Resultados */}
      <View style={styles.historyCounterRow}>
        <Text style={[styles.historyCounterText, { color: theme.textSub }]}>
          {filteredTransactions.length}{' '}
          {filteredTransactions.length === 1 ? 'registro encontrado' : 'registros encontrados'}
        </Text>
      </View>

      {/* Lista Filtrada */}
      {filteredTransactions.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Feather name="inbox" size={36} color={theme.textSub} />
          <Text style={[styles.emptyTitle, { color: theme.textMain }]}>
            Nenhuma transação encontrada
          </Text>
          <Text style={[styles.emptyDesc, { color: theme.textSub }]}>
            Tente alterar os filtros ou clique no botão + para adicionar um novo registro.
          </Text>
        </View>
      ) : (
        filteredTransactions.map((t) => (
          <TransactionItem
            key={t.id}
            transaction={t}
            theme={theme}
            formatMoney={formatMoney}
            onDelete={requestDelete}
            onPress={openEditTransaction}
            card={getCardForTransaction(t)}
          />
        ))
      )}

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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  filtersGroup: {
    marginBottom: 14,
  },
  filterPills: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  filterPillBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 10,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyCounterRow: {
    marginBottom: 10,
  },
  historyCounterText: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
