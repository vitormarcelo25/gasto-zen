import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import CurrencyInput from './CurrencyInput';
import { floatToMasked, maskedToFloat } from '../utils/mask';

export default function SalaryConfigModal({ 
  visible, 
  onClose, 
  settings, 
  onSaveSettings, 
  onResetData,
  theme,
  currencySymbol 
}) {
  const [salaryType, setSalaryType] = useState('monthly'); // 'monthly' | 'weekly'
  const [baseSalary, setBaseSalary] = useState('');
  const [baseSalaryFloat, setBaseSalaryFloat] = useState(0);
  const [savingsGoal, setSavingsGoal] = useState('');
  const [savingsGoalFloat, setSavingsGoalFloat] = useState(0);

  useEffect(() => {
    if (visible && settings) {
      setSalaryType(settings.salaryType || 'monthly');
      const sFloat = Number(settings.baseSalary) || 0;
      const gFloat = Number(settings.savingsGoal) || 0;
      setBaseSalary(sFloat > 0 ? floatToMasked(sFloat) : '');
      setBaseSalaryFloat(sFloat);
      setSavingsGoal(gFloat > 0 ? floatToMasked(gFloat) : '');
      setSavingsGoalFloat(gFloat);
    }
  }, [visible, settings]);

  const handleSave = () => {
    const salaryNum = baseSalaryFloat > 0 ? baseSalaryFloat : maskedToFloat(baseSalary);
    const goalNum = savingsGoalFloat > 0 ? savingsGoalFloat : maskedToFloat(savingsGoal);

    onSaveSettings({
      ...settings,
      salaryType,
      baseSalary: salaryNum,
      savingsGoal: goalNum,
    });

    onClose();
  };

  const calculatedWeekly = salaryType === 'monthly' && baseSalaryFloat > 0 
    ? (baseSalaryFloat / 4.33).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : baseSalary;

  const calculatedMonthly = salaryType === 'weekly' && baseSalaryFloat > 0
    ? (baseSalaryFloat * 4.33).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : baseSalary;

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={[styles.title, { color: theme.textMain }]}>Configurar Salário & Metas</Text>
                <Text style={[styles.subtitle, { color: theme.textSub }]}>
                  Usado para previsões inteligentes e visão semanal
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.bg }]}>
                <Feather name="x" size={20} color={theme.textSub} />
              </TouchableOpacity>
            </View>

            {/* Frequência do Salário */}
            <Text style={[styles.inputLabel, { color: theme.textSub }]}>COMO VOCÊ RECEBE SUA RENDA?</Text>
            <View style={[styles.toggleRow, { backgroundColor: theme.bg }]}>
              <TouchableOpacity 
                onPress={() => setSalaryType('monthly')}
                style={[
                  styles.toggleBtn, 
                  salaryType === 'monthly' && { backgroundColor: theme.indigo }
                ]}
              >
                <Text style={[
                  styles.toggleText, 
                  { color: salaryType === 'monthly' ? '#FFF' : theme.textSub }
                ]}>
                  Salário Mensal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => setSalaryType('weekly')}
                style={[
                  styles.toggleBtn, 
                  salaryType === 'weekly' && { backgroundColor: theme.indigo }
                ]}
              >
                <Text style={[
                  styles.toggleText, 
                  { color: salaryType === 'weekly' ? '#FFF' : theme.textSub }
                ]}>
                  Salário Semanal
                </Text>
              </TouchableOpacity>
            </View>

            {/* Input do Salário */}
            <Text style={[styles.inputLabel, { color: theme.textSub }]}>
              VALOR DO SALÁRIO {salaryType === 'monthly' ? 'MENSAL' : 'SEMANAL'}
            </Text>
            <CurrencyInput
              value={baseSalary}
              onChangeValue={(formatted, floatVal) => {
                setBaseSalary(formatted);
                setBaseSalaryFloat(floatVal);
              }}
              currencySymbol={currencySymbol}
              theme={theme}
              placeholder="0,00"
              quickIncrements={false}
            />

            {/* Card Informativo com Conversão Automática */}
            {baseSalaryFloat > 0 ? (
              <View style={[styles.conversionBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <Feather name="info" size={16} color={theme.indigo} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.conversionText, { color: theme.textMain }]}>
                    {salaryType === 'monthly' 
                      ? `Equivale a aprox. ${currencySymbol} ${calculatedWeekly} por semana`
                      : `Equivale a aprox. ${currencySymbol} ${calculatedMonthly} por mês`}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Meta de Poupança */}
            <Text style={[styles.inputLabel, { color: theme.textSub, marginTop: 16 }]}>
              META DE POUPANÇA MENSAL (OPCIONAL)
            </Text>
            <CurrencyInput
              value={savingsGoal}
              onChangeValue={(formatted, floatVal) => {
                setSavingsGoal(formatted);
                setSavingsGoalFloat(floatVal);
              }}
              currencySymbol={currencySymbol}
              theme={theme}
              placeholder="0,00"
              quickIncrements={false}
            />

            {/* Botão Salvar */}
            <TouchableOpacity 
              style={[styles.saveBtn, { backgroundColor: theme.green }]} 
              onPress={handleSave}
            >
              <Feather name="check" size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Salvar Configurações</Text>
            </TouchableOpacity>

            {/* Opção de Resetar Dados se prop existir */}
            {onResetData && (
              <TouchableOpacity 
                style={[styles.resetBtn, { borderColor: theme.border }]} 
                onPress={onResetData}
              >
                <Feather name="refresh-cw" size={14} color={theme.textSub} style={{ marginRight: 6 }} />
                <Text style={[styles.resetBtnText, { color: theme.textSub }]}>
                  Restaurar Transações de Exemplo
                </Text>
              </TouchableOpacity>
            )}

            <View style={{ height: 16 }} />
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
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
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
  inputLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    marginBottom: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  conversionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
  },
  conversionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  saveBtn: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resetBtn: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
