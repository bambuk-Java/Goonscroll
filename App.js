import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppState, View, Text, ActivityIndicator } from 'react-native';

// Screen Imports - alle aus separaten Dateien
import OnboardingScreen from './screens/OnBoardingScreen';
import HomeScreen from './screens/HomeScreen';
import PowerModeScreen from './screens/PowerModeScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import SettingsScreen from './screens/SettingsScreen';

// Service Imports
import LoginService from './services/LoginService';
import SessionRecovery from './utils/SessionRecovery';

const Stack = createStackNavigator();

// Main App Component
export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [appStateVisible, setAppStateVisible] = useState(AppState.currentState);

  // App-Initialisierung
  useEffect(() => {
    initializeApp();

    // AppState Listener für Background/Foreground
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
      cleanupServices();
    };
  }, []);

  // App initialisieren
  const initializeApp = async () => {
    console.log('🚀 Initializing GoonScroll...');

    try {
      // 1. LoginService initialisieren
      await LoginService.initializeService();

      // 2. SessionRecovery starten
      console.log('🔄 Starting session recovery...');
      await SessionRecovery.attemptAutoRecovery();

      // 3. Background-Monitoring starten
      SessionRecovery.startBackgroundMonitoring();

      // 4. Session-Backup erstellen
      await SessionRecovery.createSessionBackup();

      console.log('✅ App initialization completed');
    } catch (error) {
      console.error('❌ App initialization failed:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  // App-State Änderungen handhaben
  const handleAppStateChange = async (nextAppState) => {
    console.log(`📱 App state: ${appStateVisible} → ${nextAppState}`);

    if (appStateVisible.match(/inactive|background/) && nextAppState === 'active') {
      // App kommt in den Vordergrund
      console.log('🔄 App became active, checking sessions...');

      try {
        // Sessions prüfen und Recovery versuchen
        await SessionRecovery.attemptAutoRecovery();

        // Session-Backup aktualisieren
        await SessionRecovery.createSessionBackup();
      } catch (error) {
        console.error('Error during foreground recovery:', error);
      }
    } else if (nextAppState.match(/inactive|background/)) {
      // App geht in den Hintergrund
      console.log('💤 App went to background, creating backup...');

      try {
        // Session-Backup vor dem Hintergrund
        await SessionRecovery.createSessionBackup();
      } catch (error) {
        console.error('Error during background backup:', error);
      }
    }

    setAppStateVisible(nextAppState);
  };

  // Services cleanup
  const cleanupServices = () => {
    console.log('🧹 Cleaning up services...');
    try {
      LoginService.cleanup();
      SessionRecovery.cleanup();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  // Loading Screen während Initialisierung
  if (isInitializing) {
    return (
      <SafeAreaProvider>
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F9FAFB'
        }}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={{
            marginTop: 16,
            fontSize: 16,
            color: '#6B7280',
            fontWeight: '500'
          }}>
            GoonScroll wird geladen...
          </Text>
          <Text style={{
            marginTop: 8,
            fontSize: 14,
            color: '#9CA3AF'
          }}>
            Sessions werden überprüft
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Onboarding"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="PowerMode" component={PowerModeScreen} />
          <Stack.Screen name="Analytics" component={AnalyticsScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}