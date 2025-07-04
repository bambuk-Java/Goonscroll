import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Alert,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginModal = ({ visible, platform, onClose, onLoginSuccess }) => {
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // Platform-spezifische Login-URLs
    const getLoginUrl = (platformKey) => {
        const loginUrls = {
            youtube: 'https://accounts.google.com/signin',
            tiktok: 'https://www.tiktok.com/login',
            instagram: 'https://www.instagram.com/accounts/login/'
        };
        return loginUrls[platformKey] || '';
    };

    // Login-Status speichern
    const saveLoginStatus = async (platformKey, loginData) => {
        try {
            const loginInfo = {
                platform: platformKey,
                isLoggedIn: true,
                loginTime: new Date().toISOString(),
                sessionData: loginData || {}
            };

            await AsyncStorage.setItem(`login_${platformKey}`, JSON.stringify(loginInfo));
            console.log(`✅ Login saved for ${platformKey}`);
            return true;
        } catch (error) {
            console.error('Error saving login:', error);
            return false;
        }
    };

    // Browser öffnen und Login handhaben
    const handleLogin = async () => {
        if (!platform) return;

        setIsLoggingIn(true);
        const loginUrl = getLoginUrl(platform);

        try {
            console.log(`${platform}: Opening browser for login...`);

            // WebBrowser konfigurieren
            const result = await WebBrowser.openBrowserAsync(loginUrl, {
                // Browser-Optionen
                presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
                showTitle: true,
                enableBarCollapsing: false,
                // iOS-spezifische Optionen
                controlsColor: getPlatformColor(platform),
                // Android-spezifische Optionen
                browserPackage: undefined, // Nutzt Standard-Browser
            });

            console.log(`${platform}: Browser result:`, result);

            // Prüfe Ergebnis
            if (result.type === 'cancel') {
                console.log(`${platform}: Login cancelled by user`);
                setIsLoggingIn(false);
                return;
            }

            if (result.type === 'dismiss') {
                console.log(`${platform}: Login dismissed`);
                // Hier nehmen wir an, dass Login erfolgreich war wenn Browser geschlossen wurde
                await handleLoginSuccess();
            }

        } catch (error) {
            console.error(`${platform}: Login error:`, error);
            Alert.alert(
                'Login Fehler',
                'Es gab ein Problem beim Öffnen des Browsers. Bitte versuche es erneut.',
                [{ text: 'OK' }]
            );
        }

        setIsLoggingIn(false);
    };

    // Login-Erfolg handhaben
    const handleLoginSuccess = async () => {
        console.log(`${platform}: Processing login success...`);

        // Login-Status speichern
        const saveSuccess = await saveLoginStatus(platform, {
            loginMethod: 'webBrowser',
            timestamp: Date.now()
        });

        if (saveSuccess) {
            Alert.alert(
                '✅ Anmeldung erfolgreich',
                `Du bist jetzt bei ${getPlatformName(platform)} angemeldet!\n\nDu kannst jetzt den Browser schließen.`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            onLoginSuccess(platform);
                            onClose();
                        }
                    }
                ]
            );
        }
    };

    // Alternative: Manuell als "erfolgreich" markieren
    const handleManualSuccess = () => {
        Alert.alert(
            'Login abgeschlossen?',
            `Hast du dich erfolgreich bei ${getPlatformName(platform)} angemeldet?`,
            [
                { text: 'Nein', style: 'cancel' },
                {
                    text: 'Ja, bin angemeldet',
                    onPress: handleLoginSuccess
                }
            ]
        );
    };

    // Helper functions
    const getPlatformName = (platformKey) => {
        const names = {
            youtube: 'YouTube',
            tiktok: 'TikTok',
            instagram: 'Instagram'
        };
        return names[platformKey] || platformKey;
    };

    const getPlatformColor = (platformKey) => {
        const colors = {
            youtube: '#FF0000',
            tiktok: '#000000',
            instagram: '#E4405F'
        };
        return colors[platformKey] || '#3B82F6';
    };

    if (!visible) return null;

    const platformName = getPlatformName(platform);
    const platformColor = getPlatformColor(platform);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="formSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: platformColor }]}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>×</Text>
                    </TouchableOpacity>

                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>
                            Bei {platformName} anmelden
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            Login im externen Browser
                        </Text>
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Icon */}
                    <View style={[styles.iconContainer, { backgroundColor: platformColor }]}>
                        <Text style={styles.iconText}>
                            {platform === 'youtube' ? '📺' : platform === 'tiktok' ? '🎵' : '📸'}
                        </Text>
                    </View>

                    {/* Info */}
                    <Text style={styles.infoTitle}>Sicherer Login</Text>
                    <Text style={styles.infoText}>
                        Der Login öffnet sich in deinem Standard-Browser für maximale Sicherheit.
                        Nach der Anmeldung kehre einfach zur App zurück.
                    </Text>

                    {/* Login Button */}
                    <TouchableOpacity
                        style={[styles.loginButton, { backgroundColor: platformColor }]}
                        onPress={handleLogin}
                        disabled={isLoggingIn}
                    >
                        {isLoggingIn ? (
                            <View style={styles.buttonContent}>
                                <ActivityIndicator size="small" color="#FFFFFF" />
                                <Text style={styles.loginButtonText}>Browser wird geöffnet...</Text>
                            </View>
                        ) : (
                            <Text style={styles.loginButtonText}>
                                🌐 Bei {platformName} anmelden
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Manual Success Button */}
                    <TouchableOpacity
                        style={styles.manualButton}
                        onPress={handleManualSuccess}
                    >
                        <Text style={styles.manualButtonText}>
                            ✅ Ich bin bereits angemeldet
                        </Text>
                    </TouchableOpacity>

                    {/* Instructions */}
                    <View style={styles.instructionsContainer}>
                        <Text style={styles.instructionsTitle}>So funktioniert's:</Text>
                        <Text style={styles.instructionsText}>
                            1. Browser öffnet {platformName} Login-Seite{'\n'}
                            2. Melde dich normal an{'\n'}
                            3. Kehre zur App zurück{'\n'}
                            4. Markiere Login als erfolgreich
                        </Text>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    closeButtonText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    content: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    iconText: {
        fontSize: 32,
    },
    infoTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    infoText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    loginButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    manualButton: {
        width: '100%',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        marginBottom: 32,
    },
    manualButtonText: {
        color: '#374151',
        fontSize: 14,
        fontWeight: '500',
    },
    instructionsContainer: {
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 8,
        width: '100%',
    },
    instructionsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
    },
    instructionsText: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
});

export default LoginModal;