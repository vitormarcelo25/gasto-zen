import React from 'react';
import { Tabs } from 'expo-router';

import ZenTabBar from '../../components/ZenTabBar';
import FabButton from '../../components/FabButton';

export default function TabsLayout() {
  return (
    <>
      <Tabs
        tabBar={(props) => <ZenTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarPosition: 'top',
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Início' }} />
        <Tabs.Screen name="estatisticas" options={{ title: 'Estatísticas' }} />
        <Tabs.Screen name="extrato" options={{ title: 'Extrato' }} />
      </Tabs>
      <FabButton />
    </>
  );
}
