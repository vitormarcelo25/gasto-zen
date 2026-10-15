import React, { useState } from 'react';
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
  currencySymbol,
  formatMoney,
}) {
  // O modal é remontado a cada abertura (key em AppModals),
  // então o estado inicial deriva direto das props.
  const [salaryType, setSalaryType] = useState(settings?.salaryType || 'monthly'); // 'monthly' | 'weekly'
  const [baseSalary, setBaseSalary] = useState(() => {
    const sFloat = Number(settings?.baseSalary) || 0;
    return sFloat > 0 ? floatToMasked(sFloat) : '';
  });
  const [baseSalaryFloat, setBaseSalaryFloat] = useState(() => Number(settings?.baseSalary) || 0);
  const [savingsGoal, setSavingsGoal] = useState(() => {
    const gFloat = Number(settings?.savingsGoal) || 0;
    return gFloat > 0 ? floatToMasked(gFloat) : '';
  });
  const [savingsGoalFloat, setSavingsGoalFloat] = useState(() => Number(settings?.savingsGoal) || 0);

  const handleToggleSalaryType = (newType) => {
    if (newType === salaryType) return;
    setSalaryType(newType);

    // Converte automaticamente o valor para que mensal e semanal façam sentido proporcional
    if (baseSalaryFloat > 0) {
      if (newType === 'weekly') {
        // Estava mensal, virou semanal: divide por 4
        const converted = Math.round((baseSalaryFloat / 4) * 100) / 100;
        setBaseSalaryFloat(converted);
        setBaseSalary(floatToMasked(converted));
      } else {
        // Estava semanal, virou mensal: multiplica por 4
        const converted = Math.round((baseSalaryFloat * 4) * 100) / 100;
        setBaseSalaryFloat(converted);
        setBaseSalary(floatToMasked(converted));
      }
    }
  };

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

  const fmt = formatMoney || ((v) => `${currencySymbol} ${Number(v) || 0}`);

  const calculatedWeekly = fmt(baseSalaryFloat / 4);
  const calculatedMonthly = fmt(baseSalaryFloat * 4);
  const dailyReference = fmt(
    salaryType === 'weekly' ? baseSalaryFloat / 7 : baseSalaryFloat / 30
  );

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
                  Usado para previsões inteligentes e limites de gastos
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
                onPress={() => handleToggleSalaryType('monthly')}
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
                onPress={() => handleToggleSalaryType('weekly')}
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

            {/* Card Informativo com Conversão Automática e Meta Diária */}
            {baseSalaryFloat > 0 ? (
              <View style={[styles.conversionBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <Feather name="info" size={18} color={theme.indigo} style={{ marginTop: 2 }} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[styles.conversionText, { color: theme.textMain }]}>
                    {salaryType === 'monthly' 
                      ? `Equivale a aprox. ${calculatedWeekly} por semana (4 semanas)`
                      : `Equivale a ${calculatedMonthly} por mês (4 semanas × ${fmt(baseSalaryFloat)})`}
                  </Text>
                  <Text style={[styles.conversionSub, { color: theme.textSub }]}>
                    {salaryType === 'weekly'
                      ? `Meta diária base: ${dailyReference} / dia (${fmt(baseSalaryFloat)} ÷ 7 dias)`
                      : `Meta diária base: ${dailyReference} / dia (${fmt(baseSalaryFloat)} ÷ 30 dias)`}
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
    fontWeight: '600',
  },
  conversionSub: {
    fontSize: 11,
    lineHeight: 15,
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
