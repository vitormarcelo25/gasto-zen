import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert, ScrollView 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';
import CurrencyInput from './CurrencyInput';
import { floatToMasked, maskedToFloat } from '../utils/mask';

const QUICK_EXPENSES = ['Supermercado', 'Almoço', 'Uber', 'Farmácia', 'Combustível', 'Internet', 'Lazer'];
const QUICK_INCOMES = ['Salário', 'Freelance', 'Pix Recebido', 'Bônus', 'Venda'];

export default function TransactionModal({ 
  visible, 
  onClose, 
  onAddTransaction,
  onUpdateTransaction,
  transactionToEdit = null,
  theme, 
  currencySymbol 
}) {
  const [type, setType] = useState('expense'); // 'expense' | 'income'
  const [amount, setAmount] = useState('');
  const [amountFloat, setAmountFloat] = useState(0);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].id);
  const [dateChoice, setDateChoice] = useState('today'); // 'today' | 'yesterday'
  const [recurrence, setRecurrence] = useState('single'); // 'single' | 'weekly' | 'monthly'

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  useEffect(() => {
    if (visible) {
      if (transactionToEdit) {
        setType(transactionToEdit.type || 'expense');
        const masked = floatToMasked(transactionToEdit.amount);
        setAmount(masked);
        setAmountFloat(Number(transactionToEdit.amount) || 0);
        setDescription(transactionToEdit.description || '');
        setCategory(transactionToEdit.categoryId || (transactionToEdit.type === 'expense' ? EXPENSE_CATEGORIES[0].id : INCOME_CATEGORIES[0].id));
        setRecurrence(transactionToEdit.recurrence || 'single');

        // Determinar se data é hoje, ontem ou outra
        if (transactionToEdit.date) {
          const tDate = new Date(transactionToEdit.date);
          const today = new Date();
          const yesterday = new Date();
          yesterday.setDate(today.getDate() - 1);
          if (tDate.toDateString() === yesterday.toDateString()) {
            setDateChoice('yesterday');
          } else {
            setDateChoice('today');
          }
        } else {
          setDateChoice('today');
        }
      } else {
        // Novo lançamento
        setType('expense');
        setAmount('');
        setAmountFloat(0);
        setDescription('');
        setCategory(EXPENSE_CATEGORIES[0].id);
        setDateChoice('today');
        setRecurrence('single');
      }
    }
  }, [visible, transactionToEdit]);

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
    if (transactionToEdit && transactionToEdit.date && dateChoice !== 'today' && dateChoice !== 'yesterday') {
      tDate = new Date(transactionToEdit.date);
    } else if (dateChoice === 'yesterday') {
      tDate.setDate(tDate.getDate() - 1);
    }

    const categoryItem = categories.find(c => c.id === category) || categories[0];

    const txPayload = {
      id: transactionToEdit ? transactionToEdit.id : Math.random().toString(36).substr(2, 9),
      type,
      amount: finalAmount,
      description: description.trim(),
      category: categoryItem.label,
      categoryId: categoryItem.id,
      date: tDate.toISOString(),
      recurrence,
    };

    if (transactionToEdit && onUpdateTransaction) {
      onUpdateTransaction(txPayload);
    } else if (onAddTransaction) {
      onAddTransaction(txPayload);
    }

    onClose();
  };

  const isEditing = !!transactionToEdit;

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

            {/* Opções de Data e Recorrência */}
            <View style={styles.rowOptions}>
              <View style={{ flex: 1, marginRight: 8 }}>
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
                </View>
              </View>

              <View style={{ flex: 1, marginLeft: 8 }}>
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
                </View>
              </View>
            </View>

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
});
