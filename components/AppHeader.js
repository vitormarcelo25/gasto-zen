import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useApp } from '../context/AppContext';

export default function AppHeader() {
  const { theme, isDarkMode, currencySymbol, toggleTheme, openCurrencyModal } = useApp();

  return (
    <View>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../assets/images/icon.png')}
            style={{ width: 36, height: 36, borderRadius: 10, marginRight: 10 }}
          />
          <View>
            <Text style={[styles.headerTitle, { color: theme.textMain }]}>
              Gasto<Text style={{ color: theme.green, fontWeight: '300' }}>Zen</Text>
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSub }]}>
              Controle Financeiro Sereno
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={openCurrencyModal}
            style={[styles.headerBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Text style={[styles.currencyBtnText, { color: theme.textMain }]}>{currencySymbol}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleTheme}
            style={[styles.headerBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Feather name={isDarkMode ? 'sun' : 'moon'} size={18} color={theme.textSub} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 45 : 55,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});
