import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import CurrencyInput from './CurrencyInput';
import { floatToMasked, maskedToFloat } from '../utils/mask';

const CARD_COLORS = [
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
];

export default function CardConfigModal({
  visible,
  onClose,
  card = null, // cartão em edição ou null para novo
  onSaveCard,
  onDeleteCard,
  canDelete = false,
  theme,
  currencySymbol,
}) {
  // O modal é remontado a cada abertura (key em AppModals),
  // então o estado inicial deriva direto das props (sem efeitos).
  const [name, setName] = useState(card?.name || 'Meu Cartão');
  const [closingDay, setClosingDay] = useState(String(card?.closingDay ?? 10));
  const [dueDay, setDueDay] = useState(String(card?.dueDay ?? 17));
  const [limit, setLimit] = useState(() => floatToMasked(Number(card?.limit) || 2500));
  const [limitFloat, setLimitFloat] = useState(() => Number(card?.limit) || 2500);
  const [color, setColor] = useState(card?.color || '#6366F1');

  const isEditing = !!card;

  const handleSave = () => {
    const finalLimit = limitFloat > 0 ? limitFloat : maskedToFloat(limit);
    const parsedClosing = Math.max(1, Math.min(31, parseInt(closingDay || 10, 10)));
    const parsedDue = Math.max(1, Math.min(31, parseInt(dueDay || 17, 10)));

    onSaveCard({
      ...(card || {}),
      name: name.trim() || 'Meu Cartão',
      closingDay: parsedClosing,
      dueDay: parsedDue,
      limit: finalLimit,
      color,
    });

    onClose();
  };

  const handleDelete = () => {
    if (!card || !onDeleteCard) return;
    Alert.alert(
      'Excluir cartão',
      `Excluir "${card.name}"? As compras deste cartão passam para o cartão principal.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            onDeleteCard(card.id);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={[styles.title, { color: theme.textMain }]}>
                  {isEditing ? 'Editar Cartão' : 'Novo Cartão de Crédito'}
                </Text>
                <Text style={[styles.subtitle, { color: theme.textSub }]}>
                  Ciclos de fatura, limite e parcelamentos
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.bg }]}>
                <Feather name="x" size={20} color={theme.textSub} />
              </TouchableOpacity>
            </View>

            {/* Nome do Cartão */}
            <Text style={[styles.inputLabel, { color: theme.textSub }]}>NOME OU BANCO DO CARTÃO</Text>
            <View style={[styles.inputBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              <Feather name="credit-card" size={18} color={color} style={{ marginRight: 10 }} />
              <TextInput
                style={[styles.textInput, { color: theme.textMain }]}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Nubank, Inter, Bradesco..."
                placeholderTextColor={theme.textSub}
              />
            </View>

            {/* Dias de Fechamento e Vencimento */}
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.inputLabel, { color: theme.textSub }]}>DIA DO FECHAMENTO</Text>
                <View style={[styles.inputBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <Feather name="calendar" size={16} color={theme.textSub} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.textInput, { color: theme.textMain }]}
                    value={closingDay}
                    onChangeText={setClosingDay}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="10"
                    placeholderTextColor={theme.textSub}
                  />
                </View>
              </View>

              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[styles.inputLabel, { color: theme.textSub }]}>DIA DO VENCIMENTO</Text>
                <View style={[styles.inputBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <Feather name="check-circle" size={16} color={theme.green} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.textInput, { color: theme.textMain }]}
                    value={dueDay}
                    onChangeText={setDueDay}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="17"
                    placeholderTextColor={theme.textSub}
                  />
                </View>
              </View>
            </View>

            {/* Limite Total do Cartão */}
            <Text style={[styles.inputLabel, { color: theme.textSub, marginTop: 14 }]}>
              LIMITE TOTAL DO CARTÃO
            </Text>
            <CurrencyInput
              value={limit}
              onChangeValue={(formatted, floatVal) => {
                setLimit(formatted);
                setLimitFloat(floatVal);
              }}
              currencySymbol={currencySymbol}
              theme={theme}
              placeholder="2.500,00"
              quickIncrements={false}
            />

            {/* Escolha de Cor do Cartão */}
            <Text style={[styles.inputLabel, { color: theme.textSub, marginTop: 14 }]}>COR DO CARTÃO</Text>
            <View style={styles.colorPalette}>
              {CARD_COLORS.map((c) => {
                const isSelected = color === c;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setColor(c)}
                    style={[
                      styles.colorBall,
                      { backgroundColor: c },
                      isSelected && { borderColor: theme.textMain, borderWidth: 3 },
                    ]}
                  />
                );
              })}
            </View>

            {/* Dica explicativa dos ciclos */}
            <View style={[styles.infoCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              <Feather name="info" size={16} color={theme.indigo} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoText, { color: theme.textSub }]}>
                  Compras feitas até o dia <Text style={{ color: theme.textMain, fontWeight: '700' }}>{closingDay}</Text> caem na fatura do mês atual (vence dia {dueDay}). Compras após o dia {closingDay} vão automaticamente para o mês seguinte!
                </Text>
              </View>
            </View>

            {/* Botão Salvar */}
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.green }]}
              onPress={handleSave}
            >
              <Feather name="check" size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Salvar Cartão</Text>
            </TouchableOpacity>

            {/* Botão Excluir (somente ao editar) */}
            {isEditing && canDelete && (
              <TouchableOpacity
                style={[styles.deleteBtn, { borderColor: theme.red }]}
                onPress={handleDelete}
              >
                <Feather name="trash-2" size={16} color={theme.red} style={{ marginRight: 8 }} />
                <Text style={[styles.deleteBtnText, { color: theme.red }]}>Excluir Cartão</Text>
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
    marginTop: 10,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    marginTop: 4,
  },
  colorPalette: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 4,
  },
  colorBall: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
    gap: 10,
  },
  infoText: {
    fontSize: 11,
    lineHeight: 16,
  },
  saveBtn: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteBtn: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  deleteBtnText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
});
