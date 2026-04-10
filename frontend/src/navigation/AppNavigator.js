import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import GoalsScreen from '../screens/GoalsScreen';
import ChatScreen from '../screens/ChatScreen';
import InvestScreen from '../screens/InvestScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChartScreen from '../screens/ChartScreen';

let Ionicons = null;
try {
  Ionicons = require('@expo/vector-icons/Ionicons').default;
} catch (e) {
  // vector-icons not available, use text fallback
}

const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

const ICON_MAP = {
  Dashboard: { icon: 'home', fallback: '\u{1F3E0}' },
  Goals: { icon: 'flag', fallback: '\u{1F3AF}' },
  'AI Chat': { icon: 'chatbubble-ellipses', fallback: '\u{1F4AC}' },
  Invest: { icon: 'trending-up', fallback: '\u{1F4C8}' },
  Charts: { icon: 'bar-chart', fallback: '\u{1F4CA}' },
  Profile: { icon: 'person', fallback: '\u{1F464}' },
};

function TabBarIcon({ routeName, focused, color, size }) {
  const config = ICON_MAP[routeName] || { icon: 'ellipse', fallback: '?' };

  if (Ionicons) {
    const iconName = focused ? config.icon : `${config.icon}-outline`;
    return <Ionicons name={iconName} size={size || 24} color={color} />;
  }

  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
      {config.fallback}
    </Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FF6B00',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          height: 88,
          paddingBottom: 28,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => (
          <TabBarIcon
            routeName={route.name}
            focused={focused}
            color={color}
            size={size}
          />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen name="AI Chat" component={ChatScreen} />
      <Tab.Screen name="Invest" component={InvestScreen} />
      <Tab.Screen name="Charts" component={ChartScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const linking = {
  prefixes: ['http://localhost:8081', 'bharatniveshsaathi://'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Dashboard: 'Dashboard',
          Goals: 'Goals',
          'AI Chat': 'Chat',
          Invest: 'Invest',
          Charts: 'Charts',
          Profile: 'Profile',
        },
      },
      ChartDetail: 'ChartDetail',
    },
  },
};

export default function AppNavigator() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (!auth) {
      setInitializing(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, []);

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  if (!user) {
    return (
      <NavigationContainer linking={linking}>
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
        </AuthStack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="MainTabs" component={MainTabs} />
        <RootStack.Screen
          name="ChartDetail"
          component={ChartScreen}
          options={{ presentation: 'modal' }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
});
