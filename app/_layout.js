import React from 'react';
import { View, Text, Image, StyleSheet, StatusBar } from 'react-native';
import { Slot } from 'expo-router';
import * as Updates from 'expo-updates';

import { AppProvider, useApp } from '../context/AppContext';
import AppHeader from '../components/AppHeader';
import AppModals from '../components/AppModals';

function AppShell() {
  const { theme, isDarkMode, isLoaded } = useApp();

  React.useEffect(() => {
    async function checkAppUpdates() {
      if (__DEV__) return;
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (err) {
        // Silencioso em caso de offline
      }
    }
    checkAppUpdates();
  }, []);

  if (!isLoaded) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.bg }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={theme.bg}
        />
        <Image
          source={require('../assets/images/icon.png')}
          style={{ width: 64, height: 64, borderRadius: 18 }}
        />
        <Text style={[styles.loadingTitle, { color: theme.textMain }]}>
          Gasto<Text style={{ color: theme.green, fontWeight: '300' }}>Zen</Text>
        </Text>
        <Text style={[styles.loadingSubtitle, { color: theme.textSub }]}>
          Carregando suas finanças...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <AppHeader />
      <Slot />
      <AppModals />
    </View>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 14,
  },
  loadingSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
});
