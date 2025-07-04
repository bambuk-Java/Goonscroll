// Ersetze den OnboardingScreen in deiner App.js mit diesem:

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoginModal from './../components/LoginModal';
import LoginService from './../services/LoginService';

const OnboardingScreen = ({ navigation }) => {
    const [loginStatus, setLoginStatus] = useState({
        youtube: false,
        tiktok: false,
        instagram: false
    });
    const [loginModalVisible, setLoginModalVisible] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState(null);

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

    // Login-Status beim Laden abrufen
    useEffect(() => {
        loadLoginStates();

        // Login-Listener hinzufügen
        const removeListener = LoginService.addListener((newStates) => {
            setLoginStatus(newStates);
        });

        return removeListener;
    }, []);

    const loadLoginStates = async () => {
        const states = await LoginService.loadLoginStates();
        setLoginStatus(states);
    };

    const handleLogin = (platformId) => {
        if (loginStatus[platformId]) {
            // Bereits angemeldet - zeige Logout Option
            LoginService.logout(platformId);
        } else {
            // Noch nicht angemeldet - öffne Login Modal
            setSelectedPlatform(platformId);
            setLoginModalVisible(true);
        }
    };

    const handleLoginSuccess = async (platformId) => {
        await LoginService.setLoginStatus(platformId, true);
        setLoginModalVisible(false);
        setSelectedPlatform(null);
    };

    const handleCloseModal = () => {
        setLoginModalVisible(false);
        setSelectedPlatform(null);
    };

    const allLoggedIn = Object.values(loginStatus).every(status => status);
    const loggedInCount = Object.values(loginStatus).filter(Boolean).length;
    const progressPercentage = (loggedInCount / 3) * 100;

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
                                        }
                                    ]}
                                    onPress={() => handleLogin(platform.id)}
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
                        <Text style={styles.progressCount}>{loggedInCount}/3</Text>
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

                {/* Alternative Continue Button für Testing */}
                {!allLoggedIn && loggedInCount > 0 && (
                    <TouchableOpacity
                        style={[styles.continueButton, styles.partialContinueButton]}
                        onPress={() => navigation.replace('Home')}
                    >
                        <Text style={styles.continueButtonText}>
                            Mit {loggedInCount} Platform{loggedInCount > 1 ? 'en' : ''} fortfahren
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Debug Info */}
                <TouchableOpacity
                    style={styles.debugButton}
                    onPress={() => LoginService.debugLoginData()}
                >
                    <Text style={styles.debugButtonText}>🔍 Debug Login-Status</Text>
                </TouchableOpacity>

                {/* Footer */}
                <Text style={styles.footerText}>
                    🔐 Echte Login-Daten werden sicher gespeichert und langfristig auf dem Gerät aufbewahrt.
                </Text>
            </ScrollView>

            {/* Login Modal */}
            <LoginModal
                visible={loginModalVisible}
                platform={selectedPlatform}
                onClose={handleCloseModal}
                onLoginSuccess={handleLoginSuccess}
            />
        </SafeAreaView>
    );
};

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
        marginBottom: 16,
    },
    partialContinueButton: {
        backgroundColor: '#F59E0B',
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    debugButton: {
        backgroundColor: '#6B7280',
        paddingVertical: 8,
        borderRadius: 6,
        alignItems: 'center',
        marginBottom: 16,
    },
    debugButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '500',
    },
    footerText: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 18,
        marginVertical: 32,
    },
});

export default OnboardingScreen;