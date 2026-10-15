import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { maskCurrency } from '../utils/mask';

export default function CurrencyInput({
  value = '', // string formatada, ex: "10,10"
  onChangeValue, // callback (formatted, floatValue)
  currencySymbol = 'R$',
  theme,
  placeholder = '0,00',
  quickIncrements = false,
  incrementsList = [10, 50, 100, 500],
  autoFocus = false,
  style,
  inputStyle,
}) {
  const handleChangeText = (text) => {
    const { formatted, floatValue } = maskCurrency(text);
    if (onChangeValue) {
      onChangeValue(formatted, floatValue);
    }
  };

  const handleClear = () => {
    if (onChangeValue) {
      onChangeValue('', 0);
    }
  };

  const handleAddAmount = (addAmount) => {
    const currentDigits = String(value || '').replace(/\D/g, '');
    const currentCents = currentDigits ? parseInt(currentDigits, 10) : 0;
    const newCents = currentCents + Math.round(addAmount * 100);
    const { formatted, floatValue } = maskCurrency(String(newCents));
    if (onChangeValue) {
      onChangeValue(formatted, floatValue);
    }
  };

  const increments = Array.isArray(quickIncrements) ? quickIncrements : incrementsList;

  return (
    <View style={[styles.wrapper, style]}>
      {/* Campo com Prefixo da Moeda e Input Mascarado */}
      <View style={[
        styles.inputContainer, 
        { backgroundColor: theme.bg, borderColor: theme.border }
      ]}>
        <View style={[styles.currencyPrefixBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.currencyPrefixText, { color: theme.indigo }]}>
            {currencySymbol}
          </Text>
        </View>

        <TextInput
          style={[
            styles.input, 
            { color: theme.textMain },
            inputStyle
          ]}
          keyboardType="number-pad"
          placeholder={placeholder}
          placeholderTextColor={theme.textSub}
          value={value}
          onChangeText={handleChangeText}
          autoFocus={autoFocus}
          maxLength={15}
        />

        {value && value !== '0,00' ? (
          <TouchableOpacity 
            onPress={handleClear} 
            style={styles.clearBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="x-circle" size={18} color={theme.textSub} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Botões rápidos de incremento (+10, +50, +100) opcional */}
      {quickIncrements && (
        <View style={styles.quickAddRow}>
          {increments.map(addVal => (
            <TouchableOpacity
              key={addVal}
              onPress={() => handleAddAmount(addVal)}
              style={[styles.quickAddBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <Text style={[styles.quickAddText, { color: theme.textSub }]}>
                +{currencySymbol} {addVal}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  currencyPrefixBox: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 10,
  },
  currencyPrefixText: {
    fontSize: 16,
    fontWeight: '900',
  },
  input: {
    flex: 1,
    fontSize: 22,
    fontWeight: '900',
    paddingVertical: 8,
  },
  clearBtn: {
    padding: 6,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    justifyContent: 'flex-start',
  },
  quickAddBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  quickAddText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
