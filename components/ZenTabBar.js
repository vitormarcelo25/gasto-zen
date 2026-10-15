import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useApp } from '../context/AppContext';

const TAB_META = {
  index: { label: 'Início', icon: 'home' },
  cartoes: { label: 'Cartões', icon: 'credit-card' },
  estatisticas: { label: 'Estatísticas', icon: 'pie-chart' },
  extrato: { label: 'Extrato', icon: 'list' },
};

export default function ZenTabBar({ state, navigation }) {
  const { theme } = useApp();

  return (
    <View style={[styles.navTabs, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const meta = TAB_META[route.name] || { label: route.name, icon: 'circle' };

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            style={[styles.navTabBtn, isFocused && { backgroundColor: theme.indigo + '20' }]}
            activeOpacity={0.8}
          >
            <Feather
              name={meta.icon}
              size={16}
              color={isFocused ? theme.indigo : theme.textSub}
            />
            <Text
              style={[
                styles.navTabText,
                {
                  color: isFocused ? theme.indigo : theme.textSub,
                  fontWeight: isFocused ? 'bold' : '600',
                },
              ]}
            >
              {meta.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navTabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  navTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6,
  },
  navTabText: {
    fontSize: 12,
  },
});
