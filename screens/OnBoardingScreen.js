import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoginModal from '../components/LoginModal';
import LoginService from '../services/LoginService';

const OnboardingScreen = ({ navigation }) => {
    const [loginStatus, setLoginStatus] = useState({
        youtube: false,
        tiktok: false,
        instagram: false
    });
    const [loginModalVisible, setLoginModalVisible] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sessionHealth, setSessionHealth] = useState(null);

    const platforms = [
        {
            id: 'youtube',
            name: 'YouTube Shorts',
            color: '#FF0000',
            icon: '📺',
            desc: 'Kurze, kreative Videos',
            priority: 1
        },
        {
            id: 'tiktok',
            name: 'TikTok',
            color: '#000000',
            icon: '🎵',
            desc: 'Trending Videos & Musik',
            priority: 2
        },
        {
            id: 'instagram',
            name: 'Instagram Reels',
            color: '#E4405F',
            icon: '📸',
            desc: 'Stories & Lifestyle',
            priority: 3
        }
    ];

    // Initialisierung beim Component Mount
    useEffect(() => {
        initializeOnboarding();

        // Login-Service Listener hinzufügen
        const removeListener = LoginService.addListener((newStates) => {
            setLoginStatus(newStates);
            checkSessionHealth();
        });

        return () => {
            removeListener();
        };
    }, []);

    // Onboarding initialisieren
    const initializeOnboarding = async () => {
        setIsLoading(true);
        try {
            // Login-Status laden
            const states = await LoginService.loadLoginStates();
            setLoginStatus(states);

            // Session-Gesundheit prüfen
            await checkSessionHealth();

            console.log('🚀 Onboarding initialized:', states);
        } catch (error) {
            console.error('Error initializing onboarding:', error);
            Alert.alert(
                'Fehler',
                'Beim Laden der Login-Daten ist ein Fehler aufgetreten.',
                [{ text: 'OK' }]
            );
        }
        setIsLoading(false);
    };

    // Session-Gesundheit prüfen
    const checkSessionHealth = async () => {
        try {
            const health = await LoginService.getSessionHealth();
            setSessionHealth(health);

            // Warnung bei kritischen Sessions
            if (health.overall === 'critical') {
                Alert.alert(
                    'Session-Warnung',
                    'Einige deiner Login-Sessions sind abgelaufen oder haben Probleme. Bitte melde dich erneut an.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('Error checking session health:', error);
        }
    };

    // Login-Handler
    const handleLogin = (platformId) => {
        if (loginStatus[platformId]) {
            // Bereits angemeldet - zeige Optionen
            Alert.alert(
                'Bereits angemeldet',
                `Du bist bereits bei ${platforms.find(p => p.id === platformId)?.name} angemeldet.`,
                [
                    { text: 'Abbrechen', style: 'cancel' },
                    {
                        text: 'Abmelden',
                        style: 'destructive',
                        onPress: () => handleLogout(platformId)
                    },
                    {
                        text: 'Session erneuern',
                        onPress: () => handleRenewSession(platformId)
                    }
                ]
            );
        } else {
            // Noch nicht angemeldet - öffne Login Modal
            setSelectedPlatform(platformId);
            setLoginModalVisible(true);
        }
    };

    // Logout-Handler
    const handleLogout = async (platformId) => {
        try {
            const success = await LoginService.logout(platformId);
            if (success) {
                Alert.alert(
                    'Abgemeldet',
                    `Du wurdest erfolgreich von ${platforms.find(p => p.id === platformId)?.name} abgemeldet.`,
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Fehler', 'Abmeldung fehlgeschlagen.');
        }
    };

    // Session erneuern
    const handleRenewSession = async (platformId) => {
        try {
            const success = await LoginService.renewSession(platformId);
            if (success) {
                Alert.alert(
                    'Session erneuert',
                    `Deine ${platforms.find(p => p.id === platformId)?.name} Session wurde erfolgreich erneuert.`,
                    [{ text: 'OK' }]
                );
                await checkSessionHealth();
            } else {
                Alert.alert(
                    'Erneuerung fehlgeschlagen',
                    'Die Session konnte nicht erneuert werden. Bitte melde dich erneut an.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('Session renewal error:', error);
        }
    };

    // Login-Erfolg Handler
    const handleLoginSuccess = async (platformId) => {
        await checkSessionHealth();
        setLoginModalVisible(false);
        setSelectedPlatform(null);

        // Positive Feedback
        const platform = platforms.find(p => p.id === platformId);
        Alert.alert(
            '🎉 Login erfolgreich!',
            `Du bist jetzt bei ${platform?.name} angemeldet und kannst loslegen!`,
            [{ text: 'Super!' }]
        );
    };

    // Modal schließen
    const handleCloseModal = () => {
        setLoginModalVisible(false);
        setSelectedPlatform(null);
    };

    // Alle Sessions aktualisieren
    const handleRefreshAllSessions = async () => {
        setIsLoading(true);
        try {
            const results = await LoginService.refreshAllSessions();
            await checkSessionHealth();

            const refreshedCount = Object.values(results).filter(Boolean).length;
            Alert.alert(
                'Sessions aktualisiert',
                `${refreshedCount} Sessions wurden erfolgreich aktualisiert.`,
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('Refresh error:', error);
            Alert.alert('Fehler', 'Sessions konnten nicht aktualisiert werden.');
        }
        setIsLoading(false);
    };

    // Fortschritts-Berechnung
    const loggedInCount = Object.values(loginStatus).filter(Boolean).length;
    const progressPercentage = (loggedInCount / 3) * 100;
    const allLoggedIn = loggedInCount === 3;

    // Empfohlene nächste Platform
    const getRecommendedPlatform = () => {
        const notLoggedIn = platforms.filter(p => !loginStatus[p.id]);
        return notLoggedIn.sort((a, b) => a.priority - b.priority)[0];
    };

    const recommendedPlatform = getRecommendedPlatform();

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="dark" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Lade Login-Status...</Text>
                </View>
            </SafeAreaView>
        );
    }

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

                {/* Session Health Indicator */}
                {sessionHealth && (
                    <View style={[
                        styles.healthIndicator,
                        {
                            backgroundColor:
                                sessionHealth.overall === 'healthy' ? '#10B981' :
                                    sessionHealth.overall === 'warning' ? '#F59E0B' : '#EF4444'
                        }
                    ]}>
                        <Text style={styles.healthText}>
                            {sessionHealth.overall === 'healthy' ? '✓' :
                                sessionHealth.overall === 'warning' ? '⚠' : '✗'}
                        </Text>
                    </View>
                )}
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Welcome Section */}
                <View style={styles.welcomeSection}>
                    <View style={styles.appIcon}>
                        <Text style={styles.appIconEmoji}>🎥</Text>
                    </View>
                    <Text style={styles.welcomeTitle}>
                        {loggedInCount === 0 ? 'Willkommen!' :
                            loggedInCount === 3 ? 'Alles bereit!' : 'Fast geschafft!'}
                    </Text>
                    <Text style={styles.welcomeText}>
                        {loggedInCount === 0 ?
                            'Melde dich bei allen drei Plattformen an, um deine Videos in einer App zu sehen.' :
                            loggedInCount === 3 ?
                                'Du bist bei allen Plattformen angemeldet und kannst die App nutzen!' :
                                `Noch ${3 - loggedInCount} Platform${3 - loggedInCount > 1 ? 'en' : ''} für die komplette Erfahrung!`}
                    </Text>
                </View>

                {/* Recommended Platform (wenn nicht alle angemeldet) */}
                {recommendedPlatform && (
                    <View style={styles.recommendedSection}>
                        <Text style={styles.recommendedTitle}>🌟 Empfohlen als nächstes:</Text>
                        <TouchableOpacity
                            style={[styles.recommendedCard, { borderColor: recommendedPlatform.color }]}
                            onPress={() => handleLogin(recommendedPlatform.id)}
                        >
                            <View style={[styles.platformIcon, { backgroundColor: recommendedPlatform.color }]}>
                                <Text style={styles.platformEmoji}>{recommendedPlatform.icon}</Text>
                            </View>
                            <View style={styles.recommendedText}>
                                <Text style={styles.recommendedName}>{recommendedPlatform.name}</Text>
                                <Text style={styles.recommendedDesc}>{recommendedPlatform.desc}</Text>
                            </View>
                            <Text style={styles.recommendedArrow}>→</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Platform Cards */}
                <View style={styles.platformsContainer}>
                    <Text style={styles.sectionTitle}>Alle Plattformen</Text>
                    {platforms.map((platform) => {
                        const isLoggedIn = loginStatus[platform.id];
                        const hasIssues = sessionHealth?.issues?.some(issue =>
                            issue.toLowerCase().includes(platform.id)
                        );

                        return (
                            <View key={platform.id} style={styles.platformCard}>
                                <View style={styles.platformInfo}>
                                    <View style={[styles.platformIcon, { backgroundColor: platform.color }]}>
                                        <Text style={styles.platformEmoji}>{platform.icon}</Text>
                                    </View>
                                    <View style={styles.platformText}>
                                        <Text style={styles.platformName}>{platform.name}</Text>
                                        <Text style={styles.platformDesc}>{platform.desc}</Text>
                                        {hasIssues && (
                                            <Text style={styles.platformWarning}>⚠ Session-Problem</Text>
                                        )}
                                    </View>
                                </View>
                                <View style={styles.platformActions}>
                                    {isLoggedIn && (
                                        <View style={[
                                            styles.checkmark,
                                            { backgroundColor: hasIssues ? '#F59E0B' : '#10B981' }
                                        ]}>
                                            <Text style={styles.checkmarkText}>
                                                {hasIssues ? '⚠' : '✓'}
                                            </Text>
                                        </View>
                                    )}
                                    <TouchableOpacity
                                        style={[
                                            styles.loginButton,
                                            {
                                                backgroundColor: isLoggedIn ?
                                                    (hasIssues ? '#F59E0B' : '#10B981') :
                                                    platform.color,
                                            }
                                        ]}
                                        onPress={() => handleLogin(platform.id)}
                                    >
                                        <Text style={styles.loginButtonText}>
                                            {isLoggedIn ?
                                                (hasIssues ? 'Erneuern' : 'Angemeldet') :
                                                'Anmelden'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })}
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
                    {sessionHealth && sessionHealth.issues.length > 0 && (
                        <View style={styles.issuesContainer}>
                            <Text style={styles.issuesTitle}>⚠ Session-Probleme:</Text>
                            {sessionHealth.issues.slice(0, 2).map((issue, index) => (
                                <Text key={index} style={styles.issueText}>• {issue}</Text>
                            ))}
                        </View>
                    )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    {/* Continue Button */}
                    {allLoggedIn && (
                        <TouchableOpacity
                            style={styles.continueButton}
                            onPress={() => navigation.replace('Home')}
                        >
                            <Text style={styles.continueButtonText}>🚀 App starten</Text>
                        </TouchableOpacity>
                    )}

                    {/* Partial Continue Button */}
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

                    {/* Refresh Sessions Button */}
                    {loggedInCount > 0 && (
                        <TouchableOpacity
                            style={styles.refreshButton}
                            onPress={handleRefreshAllSessions}
                        >
                            <Text style={styles.refreshButtonText}>🔄 Sessions aktualisieren</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Debug Button (nur in Development) */}
                {__DEV__ && (
                    <TouchableOpacity
                        style={styles.debugButton}
                        onPress={() => LoginService.debugLoginData()}
                    >
                        <Text style={styles.debugButtonText}>🔍 Debug Login-Status</Text>
                    </TouchableOpacity>
                )}

                {/* Footer */}
                <Text style={styles.footerText}>
                    🔐 Deine Login-Daten werden sicher auf dem Gerät gespeichert und automatisch verwaltet.
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
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
    healthIndicator: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    healthText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
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
    recommendedSection: {
        marginBottom: 24,
    },
    recommendedTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#059669',
        marginBottom: 12,
    },
    recommendedCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    recommendedText: {
        flex: 1,
        marginLeft: 12,
    },
    recommendedName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    recommendedDesc: {
        fontSize: 14,
        color: '#6B7280',
    },
    recommendedArrow: {
        fontSize: 18,
        color: '#6B7280',
        marginLeft: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
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
    platformWarning: {
        fontSize: 12,
        color: '#F59E0B',
        fontWeight: '500',
        marginTop: 2,
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
    issuesContainer: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#FEF3C7',
        borderRadius: 8,
    },
    issuesTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#92400E',
        marginBottom: 4,
    },
    issueText: {
        fontSize: 12,
        color: '#92400E',
        lineHeight: 16,
    },
    actionButtons: {
        marginBottom: 24,
    },
    continueButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
    },
    partialContinueButton: {
        backgroundColor: '#F59E0B',
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    refreshButton: {
        backgroundColor: '#6B7280',
        paddingVertical: 10,
        borderRadius: 6,
        alignItems: 'center',
        marginBottom: 8,
    },
    refreshButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },
    debugButton: {
        backgroundColor: '#8B5CF6',
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