import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useApp } from '../context/AppContext';

export default function FabButton() {
  const { theme, openAddTransaction } = useApp();

  return (
    <TouchableOpacity
      style={[styles.fab, { backgroundColor: theme.green }]}
      onPress={openAddTransaction}
      activeOpacity={0.85}
    >
      <Feather name="plus" size={30} color="#FFF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
});
