// components/RealLoginModal.js - Echter personalisierter Login!

import React, { useState, useRef } from 'react';
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
import { WebView } from 'react-native-webview';
import LoginService from '../services/LoginService';

const RealLoginModal = ({ visible, platform, onClose, onLoginSuccess }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [loginStep, setLoginStep] = useState('login'); // 'login', 'verify', 'success'
    const [currentUrl, setCurrentUrl] = useState('');
    const webViewRef = useRef(null);

    const getPlatformConfig = (platformKey) => {
        const configs = {
            youtube: {
                name: 'YouTube',
                color: '#FF0000',
                icon: '📺',
                loginUrl: 'https://accounts.google.com/signin?continue=https%3A%2F%2Fwww.youtube.com%2F',
                personalizedUrl: 'https://m.youtube.com/', // Personalized feed
                loggedInIndicators: [
                    '#avatar-btn',
                    'img[alt*="avatar" i]',
                    'img[alt*="profilbild" i]',
                    '[data-test-id="avatar"]'
                ],
                successUrls: ['youtube.com/', 'youtube.com/feed']
            },
            tiktok: {
                name: 'TikTok',
                color: '#000000',
                icon: '🎵',
                loginUrl: 'https://www.tiktok.com/login',
                personalizedUrl: 'https://www.tiktok.com/foryou', // For You feed
                loggedInIndicators: [
                    '[data-e2e="profile-icon"]',
                    '.avatar',
                    'img[alt*="avatar" i]'
                ],
                successUrls: ['tiktok.com/foryou', 'tiktok.com/following']
            },
            instagram: {
                name: 'Instagram',
                color: '#E4405F',
                icon: '📸',
                loginUrl: 'https://www.instagram.com/accounts/login/',
                personalizedUrl: 'https://www.instagram.com/', // Personal feed
                loggedInIndicators: [
                    'svg[aria-label="Home"]',
                    'img[alt*="profilbild" i]',
                    '[data-testid="user-avatar"]'
                ],
                successUrls: ['instagram.com/']
            }
        };
        return configs[platformKey] || null;
    };

    const platformConfig = getPlatformConfig(platform);

    // JavaScript für Login-Erkennung injizieren
    const getLoginDetectionScript = () => {
        return `
            (function() {
                let loginCheckInterval;
                let urlCheckInterval;
                
                // Login-Indikatoren für ${platform}
                const indicators = ${JSON.stringify(platformConfig.loggedInIndicators)};
                
                function checkForLogin() {
                    // 1. DOM-Elemente prüfen
                    for (let selector of indicators) {
                        const element = document.querySelector(selector);
                        if (element) {
                            console.log('✅ Login indicator found:', selector);
                            clearInterval(loginCheckInterval);
                            clearInterval(urlCheckInterval);
                            
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'LOGIN_SUCCESS',
                                platform: '${platform}',
                                method: 'dom_indicator',
                                indicator: selector,
                                url: window.location.href
                            }));
                            return true;
                        }
                    }
                    return false;
                }
                
                function checkUrl() {
                    const currentUrl = window.location.href;
                    const successUrls = ${JSON.stringify(platformConfig.successUrls)};
                    
                    // Prüfe ob URL auf Login-Erfolg hindeutet
                    const isSuccess = successUrls.some(url => 
                        currentUrl.includes(url) && 
                        !currentUrl.includes('login') && 
                        !currentUrl.includes('signin')
                    );
                    
                    if (isSuccess) {
                        console.log('✅ Success URL detected:', currentUrl);
                        
                        // Zusätzlich DOM prüfen für Bestätigung
                        setTimeout(() => {
                            if (checkForLogin()) {
                                return; // Login already detected via DOM
                            }
                            
                            // URL-basierte Erkennung als Fallback
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'LOGIN_SUCCESS',
                                platform: '${platform}',
                                method: 'url_pattern',
                                url: currentUrl
                            }));
                        }, 2000);
                    }
                }
                
                // Starte regelmäßige Checks
                loginCheckInterval = setInterval(checkForLogin, 2000);
                urlCheckInterval = setInterval(checkUrl, 1000);
                
                // Initial check nach dem Laden
                setTimeout(() => {
                    checkForLogin();
                    checkUrl();
                }, 3000);
                
                console.log('🔍 Login detection started for ${platform}');
            })();
        `;
    };

    // URL-Änderungen überwachen
    const handleNavigationStateChange = (navState) => {
        setCurrentUrl(navState.url);

        // Automatische Step-Erkennung
        if (navState.url.includes('accounts.google.com') ||
            navState.url.includes('login') ||
            navState.url.includes('signin')) {
            setLoginStep('login');
        } else if (platformConfig.successUrls.some(url => navState.url.includes(url))) {
            setLoginStep('verify');
        }
    };

    // WebView-Messages verarbeiten
    const handleWebViewMessage = (event) => {
        try {
            const message = JSON.parse(event.nativeEvent.data);

            if (message.type === 'LOGIN_SUCCESS') {
                console.log(`🎉 Login detected for ${platform}:`, message);
                handleLoginSuccess(message);
            }
        } catch (error) {
            console.log('WebView message error:', error);
        }
    };

    // Login als erfolgreich markieren
    const handleLoginSuccess = async (detectionData) => {
        setLoginStep('success');

        try {
            // Echten Login-Status speichern
            const success = await LoginService.setLoginStatus(platform, true, {
                loginMethod: 'realWebView',
                timestamp: Date.now(),
                detectionMethod: detectionData.method,
                detectedUrl: detectionData.url,
                indicator: detectionData.indicator,
                userAgent: 'GoonScroll/1.0.0 RealLogin'
            });

            if (success) {
                // Kurz warten und dann direkt zur App
                setTimeout(() => {
                    onLoginSuccess(platform);
                    onClose();
                }, 1500); // Kurze Verzögerung für Success-Overlay
            }
        } catch (error) {
            console.error('Error saving real login:', error);
            Alert.alert('Fehler', 'Login konnte nicht gespeichert werden');
        }
    };

    // Manueller Login-Erfolg
    const handleManualSuccess = () => {
        // Direkt ohne Alert zur Success-Verarbeitung
        handleLoginSuccess({
            method: 'manual_confirmation',
            url: currentUrl,
            platform: platform
        });
    };

    // Zur personalisierten Seite navigieren
    const goToPersonalizedFeed = () => {
        if (webViewRef.current) {
            webViewRef.current.postMessage('navigate_to_feed');

            // Navigation via injected JavaScript
            webViewRef.current.injectJavaScript(`
                window.location.href = '${platformConfig.personalizedUrl}';
            `);
        }
    };

    if (!visible || !platformConfig) return null;

    const getStepInfo = () => {
        switch (loginStep) {
            case 'login':
                return {
                    title: 'Anmelden',
                    subtitle: 'Melde dich mit deinem Account an',
                    color: platformConfig.color
                };
            case 'verify':
                return {
                    title: 'Überprüfen...',
                    subtitle: 'Login wird automatisch erkannt',
                    color: '#F59E0B'
                };
            case 'success':
                return {
                    title: 'Erfolgreich!',
                    subtitle: 'Personalisierter Feed aktiv',
                    color: '#10B981'
                };
            default:
                return {
                    title: platformConfig.name,
                    subtitle: 'Echter Login',
                    color: platformConfig.color
                };
        }
    };

    const stepInfo = getStepInfo();

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
        >
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: stepInfo.color }]}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>

                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>{stepInfo.title}</Text>
                        <Text style={styles.headerSubtitle}>{stepInfo.subtitle}</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={loginStep === 'verify' ? handleManualSuccess : goToPersonalizedFeed}
                    >
                        <Text style={styles.actionButtonText}>
                            {loginStep === 'verify' ? 'Bestätigen' : 'Feed'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* URL Bar */}
                <View style={styles.urlBar}>
                    <Text style={styles.urlText} numberOfLines={1}>
                        {currentUrl || platformConfig.loginUrl}
                    </Text>
                </View>

                {/* WebView */}
                <WebView
                    ref={webViewRef}
                    source={{ uri: platformConfig.loginUrl }}
                    style={styles.webView}
                    onNavigationStateChange={handleNavigationStateChange}
                    onMessage={handleWebViewMessage}
                    injectedJavaScript={getLoginDetectionScript()}
                    onLoadStart={() => { }} // Kein Loading setzen
                    onLoadEnd={() => { }} // Kein Loading setzen
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={false} // Kein Loading anzeigen
                    scalesPageToFit={true}
                    allowsInlineMediaPlayback={true}
                    // KRITISCH: Cookies aktivieren für echten Login!
                    sharedCookiesEnabled={true}
                    thirdPartyCookiesEnabled={true}
                    // User Agent für Desktop-ähnliche Erfahrung
                    userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1 GoonScroll/1.0"
                />

                {/* Success Overlay - nur bei erfolgreichem Login */}
                {loginStep === 'success' && (
                    <View style={styles.successOverlay}>
                        <View style={styles.successCard}>
                            <Text style={styles.successIcon}>🎯</Text>
                            <Text style={styles.successTitle}>Algorithmus aktiv!</Text>
                            <Text style={styles.successText}>
                                Dein personalisierter {platformConfig.name} Feed wird jetzt in der App angezeigt.
                            </Text>
                        </View>
                    </View>
                )}
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerContent: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 14,
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 6,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    urlBar: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    urlText: {
        fontSize: 12,
        color: '#6B7280',
        fontFamily: 'monospace',
    },
    webView: {
        flex: 1,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    successOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(16, 185, 129, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    successCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginHorizontal: 32,
    },
    successIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    successTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    successText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
    },
});

export default RealLoginModal;