import React from 'react';
import { Tabs } from 'expo-router';

import { useApp } from '../../context/AppContext';
import ZenTabBar from '../../components/ZenTabBar';
import FabButton from '../../components/FabButton';

export default function TabsLayout() {
  const { theme } = useApp();

  return (
    <>
      <Tabs
        tabBar={(props) => <ZenTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarPosition: 'top',
          sceneStyle: { backgroundColor: theme.bg },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Início' }} />
        <Tabs.Screen name="cartoes" options={{ title: 'Cartões' }} />
        <Tabs.Screen name="estatisticas" options={{ title: 'Estatísticas' }} />
        <Tabs.Screen name="extrato" options={{ title: 'Extrato' }} />
      </Tabs>
      <FabButton />
    </>
  );
}
