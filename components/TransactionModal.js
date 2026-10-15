import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert, ScrollView 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';
import CurrencyInput from './CurrencyInput';
import { floatToMasked, maskedToFloat } from '../utils/mask';
import { RECURRENCE_HORIZON_MONTHS } from '../utils/recurrence';

const QUICK_EXPENSES = ['Supermercado', 'Almoço', 'Uber', 'Farmácia', 'Combustível', 'Internet', 'Lazer'];
const QUICK_INCOMES = ['Salário', 'Freelance', 'Pix Recebido', 'Bônus', 'Venda'];

// 'today' | 'yesterday' | 'original' — preserva datas antigas na edição
const resolveDateChoice = (tx) => {
  if (!tx || !tx.date) return 'today';
  const tDate = new Date(tx.date);
  if (Number.isNaN(tDate.getTime())) return 'today';

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (tDate.toDateString() === today.toDateString()) return 'today';
  if (tDate.toDateString() === yesterday.toDateString()) return 'yesterday';
  return 'original';
};

export default function TransactionModal({ 
  visible, 
  onClose, 
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  transactionToEdit = null,
  theme, 
  currencySymbol,
  cardSettings = null 
}) {
  // O modal é remontado a cada abertura (key em AppModals),
  // então o estado inicial deriva direto das props.
  const [type, setType] = useState(transactionToEdit?.type || 'expense'); // 'expense' | 'income'
  const [amount, setAmount] = useState(() =>
    transactionToEdit ? floatToMasked(transactionToEdit.amount) : ''
  );
  const [amountFloat, setAmountFloat] = useState(() => Number(transactionToEdit?.amount) || 0);
  const [description, setDescription] = useState(transactionToEdit?.description || '');
  const [category, setCategory] = useState(() => {
    if (transactionToEdit?.categoryId) return transactionToEdit.categoryId;
    return (transactionToEdit?.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0].id;
  });
  const [paymentMethod, setPaymentMethod] = useState(transactionToEdit?.paymentMethod || 'cash'); // 'cash' | 'debit' | 'credit'
  const [creditMode, setCreditMode] = useState(() => {
    if (transactionToEdit?.isSubscription) return 'subscription';
    if (transactionToEdit?.installmentsCount && transactionToEdit.installmentsCount > 1) return 'installment';
    return 'single';
  }); // 'single' | 'installment' | 'subscription'
  const [installmentsCount, setInstallmentsCount] = useState(transactionToEdit?.installmentsCount || 3);
  const [dateChoice, setDateChoice] = useState(() => resolveDateChoice(transactionToEdit));
  const [recurrence, setRecurrence] = useState(transactionToEdit?.recurrence || 'single'); // 'single' | 'weekly' | 'monthly'

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleDeleteFromModal = () => {
    if (!transactionToEdit || !onDeleteTransaction) return;
    onClose();
    onDeleteTransaction(transactionToEdit);
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    setCategory(newType === 'expense' ? EXPENSE_CATEGORIES[0].id : INCOME_CATEGORIES[0].id);
  };

  const handleQuickSelect = (desc) => {
    setDescription(desc);
    // Auto sugerir categoria baseada no nome comum
    const lower = desc.toLowerCase();
    if (type === 'expense') {
      if (lower.includes('almoço') || lower.includes('supermercado')) setCategory('alimentacao');
      else if (lower.includes('uber') || lower.includes('combustível')) setCategory('transporte');
      else if (lower.includes('farmácia')) setCategory('saude');
      else if (lower.includes('internet') || lower.includes('aluguel')) setCategory('contas');
      else if (lower.includes('lazer') || lower.includes('cinema')) setCategory('lazer');
    } else {
      if (lower.includes('salário')) setCategory('salario');
      else if (lower.includes('freelance')) setCategory('freelance');
      else if (lower.includes('pix') || lower.includes('bônus') || lower.includes('venda')) setCategory('presente');
    }
  };

  const handleSubmit = () => {
    const finalAmount = amountFloat > 0 ? amountFloat : maskedToFloat(amount);

    if (!finalAmount || finalAmount <= 0) {
      Alert.alert('Atenção', 'Por favor insira um valor válido maior que zero.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Atenção', 'Por favor informe uma descrição.');
      return;
    }

    let tDate = new Date();
    if (dateChoice === 'yesterday') {
      tDate.setDate(tDate.getDate() - 1);
    } else if (dateChoice === 'original' && transactionToEdit && transactionToEdit.date) {
      tDate = new Date(transactionToEdit.date);
    }

    const categoryItem = categories.find(c => c.id === category) || categories[0];

    const isCredit = type === 'expense' && paymentMethod === 'credit';
    const isInstallment = isCredit && creditMode === 'installment';
    const isSubscription = isCredit && creditMode === 'subscription';

    const txPayload = {
      id: transactionToEdit ? transactionToEdit.id : Math.random().toString(36).substr(2, 9),
      type,
      amount: finalAmount,
      description: description.trim(),
      category: categoryItem.label,
      categoryId: categoryItem.id,
      date: tDate.toISOString(),
      recurrence: isSubscription ? 'monthly' : recurrence,
      paymentMethod: type === 'expense' ? paymentMethod : 'cash',
      installmentsCount: isInstallment ? installmentsCount : 1,
      isSubscription: isSubscription,
    };

    if (transactionToEdit && onUpdateTransaction) {
      onUpdateTransaction(txPayload);
    } else if (onAddTransaction) {
      onAddTransaction(txPayload);
    }

    onClose();
  };

  const isEditing = !!transactionToEdit;

  // Rótulo dd/MM da data original (para preservar datas antigas na edição)
  const originalDateLabel = (() => {
    if (!isEditing || !transactionToEdit.date) return '';
    const d = new Date(transactionToEdit.date);
    if (Number.isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  })();

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={[styles.title, { color: theme.textMain }]}>
                  {isEditing ? 'Editar Lançamento' : 'Novo Lançamento'}
                </Text>
                <Text style={[styles.subtitle, { color: theme.textSub }]}>
                  {type === 'expense' ? 'Cadastrar saída de dinheiro' : 'Cadastrar entrada de dinheiro'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.bg }]}>
                <Feather name="x" size={20} color={theme.textSub} />
              </TouchableOpacity>
            </View>

            {/* Alternador Despesa vs Receita */}
            <View style={[styles.typeToggle, { backgroundColor: theme.bg }]}>
              <TouchableOpacity 
                onPress={() => handleTypeChange('expense')} 
                style={[styles.toggleBtn, type === 'expense' && { backgroundColor: theme.red }]}
              >
                <Feather 
                  name="arrow-down-circle" 
                  size={16} 
                  color={type === 'expense' ? '#FFF' : theme.textSub} 
                  style={{ marginRight: 6 }} 
                />
                <Text style={[styles.toggleText, { color: type === 'expense' ? '#FFF' : theme.textSub }]}>
                  Despesa
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => handleTypeChange('income')} 
                style={[styles.toggleBtn, type === 'income' && { backgroundColor: theme.green }]}
              >
                <Feather 
                  name="arrow-up-circle" 
                  size={16} 
                  color={type === 'income' ? '#FFF' : theme.textSub} 
                  style={{ marginRight: 6 }} 
                />
                <Text style={[styles.toggleText, { color: type === 'income' ? '#FFF' : theme.textSub }]}>
                  Receita
                </Text>
              </TouchableOpacity>
            </View>

            {/* Input de Valor Mascarado */}
            <Text style={[styles.inputLabel, { color: theme.textSub }]}>
              VALOR
            </Text>
            <CurrencyInput
              value={amount}
              onChangeValue={(formatted, floatVal) => {
                setAmount(formatted);
                setAmountFloat(floatVal);
              }}
              currencySymbol={currencySymbol}
              theme={theme}
              placeholder="0,00"
              quickIncrements={type === 'expense' ? [10, 50, 100, 500] : [100, 500, 1000, 2000]}
            />

            {/* Sugestões rápidas de Descrição */}
            <Text style={[styles.inputLabel, { color: theme.textSub, marginTop: 14 }]}>
              ATALHOS RÁPIDOS
            </Text>
            <View style={styles.quickChipsRow}>
              {(type === 'expense' ? QUICK_EXPENSES : QUICK_INCOMES).map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => handleQuickSelect(item)}
                  style={[styles.quickChip, { backgroundColor: theme.bg, borderColor: theme.border }]}
                >
                  <Text style={[styles.quickChipText, { color: theme.textSub }]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Input Descrição */}
            <Text style={[styles.inputLabel, { color: theme.textSub }]}>DESCRIÇÃO</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: theme.bg, color: theme.textMain, borderColor: theme.border }]}
              placeholder={type === 'expense' ? "Ex: Mercado Semanal, Restaurante..." : "Ex: Salário da semana, Bônus..."}
              placeholderTextColor={theme.textSub}
              value={description}
              onChangeText={setDescription}
            />

            {/* Seletor de Categoria com Ícones */}
            <Text style={[styles.inputLabel, { color: theme.textSub }]}>CATEGORIA</Text>
            <View style={styles.categoryGrid}>
              {categories.map(cat => {
                const isSelected = category === cat.id;
                return (
                  <TouchableOpacity 
                    key={cat.id} 
                    onPress={() => setCategory(cat.id)}
                    style={[
                      styles.categoryCard, 
                      { 
                        backgroundColor: isSelected ? cat.color + '25' : theme.bg,
                        borderColor: isSelected ? cat.color : theme.border,
                      }
                    ]}
                  >
                    <View style={[styles.catIconWrap, { backgroundColor: isSelected ? cat.color : theme.card }]}>
                      <Feather name={cat.icon} size={14} color={isSelected ? '#FFF' : cat.color} />
                    </View>
                    <Text 
                      style={[
                        styles.catLabel, 
                        { color: isSelected ? cat.color : theme.textSub, fontWeight: isSelected ? 'bold' : '500' }
                      ]}
                      numberOfLines={1}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Forma de Pagamento (somente para despesas) */}
            {type === 'expense' && (
              <>
                <Text style={[styles.inputLabel, { color: theme.textSub }]}>FORMA DE PAGAMENTO</Text>
                <View style={[styles.smallToggle, { backgroundColor: theme.bg, marginBottom: 8 }]}>
                  <TouchableOpacity
                    onPress={() => setPaymentMethod('cash')}
                    style={[styles.smallToggleBtn, paymentMethod === 'cash' && { backgroundColor: theme.card }]}
                  >
                    <Text style={[styles.smallToggleText, { color: paymentMethod === 'cash' ? theme.textMain : theme.textSub }]}>
                      💵 Pix / Dinheiro
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setPaymentMethod('debit')}
                    style={[styles.smallToggleBtn, paymentMethod === 'debit' && { backgroundColor: theme.card }]}
                  >
                    <Text style={[styles.smallToggleText, { color: paymentMethod === 'debit' ? theme.textMain : theme.textSub }]}>
                      💳 Débito
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setPaymentMethod('credit')}
                    style={[styles.smallToggleBtn, paymentMethod === 'credit' && { backgroundColor: theme.indigo }]}
                  >
                    <Text style={[styles.smallToggleText, { color: paymentMethod === 'credit' ? '#FFF' : theme.textSub }]}>
                      💳 Crédito
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Opções de Cartão de Crédito */}
                {paymentMethod === 'credit' && (
                  <View style={[styles.creditOptionsCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <Text style={[styles.subSectionTitle, { color: theme.textMain }]}>
                      Condição no Cartão ({cardSettings?.name || 'Meu Cartão'})
                    </Text>
                    <View style={[styles.smallToggle, { backgroundColor: theme.card, marginTop: 6 }]}>
                      <TouchableOpacity
                        onPress={() => setCreditMode('single')}
                        style={[styles.smallToggleBtn, creditMode === 'single' && { backgroundColor: theme.indigo }]}
                      >
                        <Text style={[styles.smallToggleText, { color: creditMode === 'single' ? '#FFF' : theme.textSub }]}>
                          À vista (1x)
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setCreditMode('installment')}
                        style={[styles.smallToggleBtn, creditMode === 'installment' && { backgroundColor: theme.indigo }]}
                      >
                        <Text style={[styles.smallToggleText, { color: creditMode === 'installment' ? '#FFF' : theme.textSub }]}>
                          Parcelado
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setCreditMode('subscription')}
                        style={[styles.smallToggleBtn, creditMode === 'subscription' && { backgroundColor: theme.indigo }]}
                      >
                        <Text style={[styles.smallToggleText, { color: creditMode === 'subscription' ? '#FFF' : theme.textSub }]}>
                          Assinatura
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Seletor de Parcelas */}
                    {creditMode === 'installment' && (
                      <View style={{ marginTop: 10 }}>
                        <Text style={[styles.installmentLabel, { color: theme.textSub }]}>NÚMERO DE PARCELAS</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                          {[2, 3, 4, 5, 6, 8, 10, 12, 18, 24].map((num) => (
                            <TouchableOpacity
                              key={num}
                              onPress={() => setInstallmentsCount(num)}
                              style={[
                                styles.installmentChip,
                                {
                                  backgroundColor: installmentsCount === num ? theme.indigo : theme.card,
                                  borderColor: installmentsCount === num ? theme.indigo : theme.border,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.installmentChipText,
                                  { color: installmentsCount === num ? '#FFF' : theme.textMain },
                                ]}
                              >
                                {num}x
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>

                        {/* Preview da Parcela */}
                        {amountFloat > 0 && (
                          <View style={[styles.installmentPreview, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <Feather name="info" size={14} color={theme.indigo} />
                            <Text style={[styles.installmentPreviewText, { color: theme.textMain }]}>
                              {installmentsCount}x de {currencySymbol} {(amountFloat / installmentsCount).toFixed(2).replace('.', ',')} por mês
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {creditMode === 'subscription' && (
                      <Text style={[styles.creditHintText, { color: theme.textSub }]}>
                        💡 Cobrança fixa mensal na fatura do cartão (ex: Netflix, Spotify, academia).
                      </Text>
                    )}
                  </View>
                )}
              </>
            )}

            {/* Opções de Data */}
            <Text style={[styles.inputLabel, { color: theme.textSub }]}>QUANDO?</Text>
            <View style={[styles.smallToggle, { backgroundColor: theme.bg }]}>
              <TouchableOpacity 
                onPress={() => setDateChoice('today')} 
                style={[styles.smallToggleBtn, dateChoice === 'today' && { backgroundColor: theme.card }]}
              >
                <Text style={[styles.smallToggleText, { color: dateChoice === 'today' ? theme.textMain : theme.textSub }]}>
                  Hoje
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setDateChoice('yesterday')} 
                style={[styles.smallToggleBtn, dateChoice === 'yesterday' && { backgroundColor: theme.card }]}
              >
                <Text style={[styles.smallToggleText, { color: dateChoice === 'yesterday' ? theme.textMain : theme.textSub }]}>
                  Ontem
                </Text>
              </TouchableOpacity>
              {isEditing && originalDateLabel && (
                <TouchableOpacity 
                  onPress={() => setDateChoice('original')} 
                  style={[styles.smallToggleBtn, dateChoice === 'original' && { backgroundColor: theme.card }]}
                >
                  <Text style={[styles.smallToggleText, { color: dateChoice === 'original' ? theme.textMain : theme.textSub }]}>
                    {originalDateLabel}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Repetição */}
            <Text style={[styles.inputLabel, { color: theme.textSub }]}>REPETIÇÃO</Text>
            <View style={[styles.smallToggle, { backgroundColor: theme.bg }]}>
              <TouchableOpacity 
                onPress={() => setRecurrence('single')} 
                style={[styles.smallToggleBtn, recurrence === 'single' && { backgroundColor: theme.card }]}
              >
                <Text style={[styles.smallToggleText, { color: recurrence === 'single' ? theme.textMain : theme.textSub }]}>
                  Única
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setRecurrence('weekly')} 
                style={[styles.smallToggleBtn, recurrence === 'weekly' && { backgroundColor: theme.card }]}
              >
                <Text style={[styles.smallToggleText, { color: recurrence === 'weekly' ? theme.textMain : theme.textSub }]}>
                  Semanal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setRecurrence('monthly')} 
                style={[styles.smallToggleBtn, recurrence === 'monthly' && { backgroundColor: theme.card }]}
              >
                <Text style={[styles.smallToggleText, { color: recurrence === 'monthly' ? theme.textMain : theme.textSub }]}>
                  Mensal
                </Text>
              </TouchableOpacity>
            </View>

            {recurrence !== 'single' && (
              <Text style={[styles.recurrenceHint, { color: theme.textSub }]}>
                Ao confirmar, serão criadas ocorrências automáticas para os próximos {RECURRENCE_HORIZON_MONTHS} meses.
                Cada ocorrência pode ser editada ou excluída individualmente.
              </Text>
            )}

            {/* Botão de Envio */}
            <TouchableOpacity 
              style={[
                styles.submitBtn, 
                { 
                  backgroundColor: (!amount || !description.trim()) 
                    ? theme.border 
                    : (type === 'expense' ? theme.red : theme.green) 
                }
              ]} 
              onPress={handleSubmit}
              disabled={!amount || !description.trim()}
            >
              <Feather name={isEditing ? "check-circle" : "check"} size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>
                {isEditing ? 'Salvar Alterações' : 'Confirmar Lançamento'}
              </Text>
            </TouchableOpacity>

            {/* Botão de Excluir dentro do Modal de Edição */}
            {isEditing && onDeleteTransaction && (
              <TouchableOpacity 
                style={[styles.deleteModalBtn, { backgroundColor: theme.red + '15', borderColor: theme.red + '35' }]} 
                onPress={handleDeleteFromModal}
                activeOpacity={0.7}
              >
                <Feather name="trash-2" size={16} color={theme.red} style={{ marginRight: 8 }} />
                <Text style={[styles.deleteModalBtnText, { color: theme.red }]}>
                  Excluir esta transação
                </Text>
              </TouchableOpacity>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  content: {
    padding: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 16,
  },
  typeToggle: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    flexDirection: 'row',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 12,
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  quickChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  input: {
    padding: 14,
    borderRadius: 16,
    fontSize: 15,
    fontWeight: '600',
    borderWidth: 1,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    minWidth: '30%',
    flexGrow: 1,
  },
  catIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catLabel: {
    fontSize: 11,
  },
  rowOptions: {
    flexDirection: 'row',
    marginTop: 6,
  },
  recurrenceHint: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
  },
  smallToggle: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
  },
  smallToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  smallToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  creditOptionsCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  subSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  installmentLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  installmentChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 6,
  },
  installmentChipText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  installmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
  },
  installmentPreviewText: {
    fontSize: 12,
    fontWeight: '600',
  },
  creditHintText: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 8,
  },
  submitBtn: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  submitBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteModalBtn: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  deleteModalBtnText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
});
