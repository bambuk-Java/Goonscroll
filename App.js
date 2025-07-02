import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const Stack = createStackNavigator();

// Onboarding Screen Component
const OnboardingScreen = ({ navigation }) => {
  const [loginStatus, setLoginStatus] = useState({
    youtube: false,
    tiktok: false,
    instagram: false
  });

  const platforms = [
    {
      id: 'youtube',
      name: 'YouTube Shorts',
      color: '#FF0000',
      icon: '📺',
      desc: 'Kurze, kreative Videos'
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      color: '#000000',
      icon: '🎵',
      desc: 'Trending Videos & Musik'
    },
    {
      id: 'instagram',
      name: 'Instagram Reels',
      color: '#E4405F',
      icon: '📸',
      desc: 'Stories & Lifestyle'
    }
  ];

  const handleLogin = (platformId) => {
    Alert.alert(
      'Anmeldung',
      `Bei ${platforms.find(p => p.id === platformId)?.name} anmelden?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Anmelden',
          onPress: () => {
            setLoginStatus(prev => ({ ...prev, [platformId]: true }));
          }
        }
      ]
    );
  };

  const allLoggedIn = Object.values(loginStatus).every(status => status);

  const progressPercentage = (Object.values(loginStatus).filter(Boolean).length / 3) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.pigLogo}>
            <View style={styles.pigFace}>
              <View style={[styles.pigEye, { left: 6 }]} />
              <View style={[styles.pigEye, { right: 6 }]} />
              <View style={styles.pigSnout} />
            </View>
          </View>
          <Text style={styles.appTitle}>GoonScroll</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.appIcon}>
            <Text style={styles.appIconEmoji}>🎥</Text>
          </View>
          <Text style={styles.welcomeTitle}>Willkommen!</Text>
          <Text style={styles.welcomeText}>
            Melde dich bei allen drei Plattformen an, um deine Videos in einer App zu sehen.
          </Text>
        </View>

        {/* Platform Cards */}
        <View style={styles.platformsContainer}>
          {platforms.map((platform) => (
            <View key={platform.id} style={styles.platformCard}>
              <View style={styles.platformInfo}>
                <View style={[styles.platformIcon, { backgroundColor: platform.color }]}>
                  <Text style={styles.platformEmoji}>{platform.icon}</Text>
                </View>
                <View style={styles.platformText}>
                  <Text style={styles.platformName}>{platform.name}</Text>
                  <Text style={styles.platformDesc}>{platform.desc}</Text>
                </View>
              </View>
              <View style={styles.platformActions}>
                {loginStatus[platform.id] && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    {
                      backgroundColor: loginStatus[platform.id] ? '#10B981' : platform.color,
                      opacity: loginStatus[platform.id] ? 0.7 : 1
                    }
                  ]}
                  onPress={() => handleLogin(platform.id)}
                  disabled={loginStatus[platform.id]}
                >
                  <Text style={styles.loginButtonText}>
                    {loginStatus[platform.id] ? 'Angemeldet' : 'Anmelden'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Fortschritt</Text>
            <Text style={styles.progressCount}>
              {Object.values(loginStatus).filter(Boolean).length}/3
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
          </View>
        </View>

        {/* Continue Button */}
        {allLoggedIn && (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => navigation.replace('Home')}
          >
            <Text style={styles.continueButtonText}>App starten 🚀</Text>
          </TouchableOpacity>
        )}

        {/* Footer */}
        <Text style={styles.footerText}>
          Deine Anmeldedaten werden sicher gespeichert und nur für die App-Funktionalität verwendet.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

// Import HomeScreen component
import HomeScreen from './screens/HomeScreen';
import PowerModeScreen from './screens/PowerModeScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';

// Main App Component
export default function App() {
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
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pigLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EC4899',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pigFace: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F9A8D4',
    position: 'relative',
  },
  pigEye: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#BE185D',
    position: 'absolute',
    top: 4,
  },
  pigSnout: {
    width: 8,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#BE185D',
    position: 'absolute',
    bottom: 6,
    left: 8,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  welcomeSection: {
    alignItems: 'center',
    marginVertical: 32,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appIconEmoji: {
    fontSize: 32,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  platformsContainer: {
    marginBottom: 32,
  },
  platformCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  platformIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  platformEmoji: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  platformText: {
    flex: 1,
  },
  platformName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  platformDesc: {
    fontSize: 14,
    color: '#6B7280',
  },
  platformActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loginButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  progressCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  continueButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 32,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginVertical: 32,
  },
  placeholder: {
    fontSize: 24,
    textAlign: 'center',
    marginTop: 100,
    marginBottom: 16,
  },
  placeholderSub: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});