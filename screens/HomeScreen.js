import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Share,
    Dimensions,
    AppState
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { PanGestureHandler, GestureHandlerRootView, State } from 'react-native-gesture-handler';
import TrackingService from './TrackingService';
import LoginService from '../services/LoginService';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('youtube');
    const [isLoading, setIsLoading] = useState(false);
    const [webViewKey, setWebViewKey] = useState(0);
    const [loginStates, setLoginStates] = useState({
        youtube: false,
        tiktok: false,
        instagram: false
    });

    const webViewRefs = {
        youtube: useRef(null),
        tiktok: useRef(null),
        instagram: useRef(null)
    };

    // Platform order for swiping
    const platformOrder = ['youtube', 'tiktok', 'instagram'];
    const currentIndex = platformOrder.indexOf(activeTab);

    // Platform configurations with personalized URLs
    const platforms = {
        youtube: {
            name: 'YouTube',
            color: '#FF0000',
            url: 'https://m.youtube.com/feed/shorts', // Personalized YouTube Shorts feed
            icon: '📺',
            personalizedFeatures: 'Deine Shorts, Subscriptions, Empfehlungen'
        },
        tiktok: {
            name: 'TikTok',
            color: '#000000',
            url: 'https://www.tiktok.com/foryou', // For You personalized page
            icon: '🎵',
            personalizedFeatures: 'For You, Following, Likes'
        },
        instagram: {
            name: 'Instagram',
            color: '#E4405F',
            url: 'https://www.instagram.com/', // Personal feed
            icon: '📸',
            personalizedFeatures: 'Feed, Stories, Reels, Explore'
        }
    };

    // Start tracking when component mounts
    useEffect(() => {
        TrackingService.startSession(activeTab);
        loadLoginStates();

        // Handle app state changes
        const handleAppStateChange = (nextAppState) => {
            if (nextAppState === 'background' || nextAppState === 'inactive') {
                TrackingService.endSession();
            } else if (nextAppState === 'active') {
                TrackingService.startSession(activeTab);
                loadLoginStates(); // Refresh login states when app becomes active
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        // Login state listener
        const removeLoginListener = LoginService.addListener((newStates) => {
            setLoginStates(newStates);
        });

        // Cleanup
        return () => {
            TrackingService.endSession();
            subscription?.remove();
            removeLoginListener();
        };
    }, []);

    // Load login states
    const loadLoginStates = async () => {
        try {
            const states = await LoginService.getAllLoginStates();
            setLoginStates(states);
        } catch (error) {
            console.error('Error loading login states:', error);
        }
    };

    // Track platform switches
    useEffect(() => {
        if (activeTab) {
            TrackingService.switchPlatform(activeTab);
        }
    }, [activeTab]);

    // Get personalized WebView source with cookies
    const getPersonalizedWebViewSource = (platform) => {
        return {
            uri: platforms[platform].url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1 GoonScroll/1.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
                'Cache-Control': 'no-cache'
            }
        };
    };

    const handleTabSwitch = (tab) => {
        if (tab === activeTab) return;
        setActiveTab(tab);
    };

    // Handle swipe gestures
    const onSwipeGesture = (event) => {
        if (event.nativeEvent.state === State.END) {
            const { translationX, velocityX } = event.nativeEvent;

            // Minimum swipe distance and velocity
            const minSwipeDistance = 50;
            const minVelocity = 500;

            if (Math.abs(translationX) > minSwipeDistance || Math.abs(velocityX) > minVelocity) {
                if (translationX > 0 && velocityX > 0) {
                    // Swipe right - go to previous tab
                    const prevIndex = currentIndex > 0 ? currentIndex - 1 : platformOrder.length - 1;
                    handleTabSwitch(platformOrder[prevIndex]);
                } else if (translationX < 0 && velocityX < 0) {
                    // Swipe left - go to next tab
                    const nextIndex = currentIndex < platformOrder.length - 1 ? currentIndex + 1 : 0;
                    handleTabSwitch(platformOrder[nextIndex]);
                }
            }
        }
    };

    const handleShare = async () => {
        try {
            const currentPlatform = platforms[activeTab];
            const isLoggedIn = loginStates[activeTab];

            await Share.share({
                message: `Schau dir ${isLoggedIn ? 'meinen personalisierten' : 'diesen'} ${currentPlatform.name} Feed an! - GoonScroll App`,
                url: currentPlatform.url
            });

            // Track the share
            await TrackingService.trackShare(activeTab);
        } catch (error) {
            Alert.alert('Fehler', 'Teilen fehlgeschlagen');
        }
    };

    const handleRefresh = () => {
        setWebViewKey(prev => prev + 1);
        if (webViewRefs[activeTab]?.current) {
            webViewRefs[activeTab].current.reload();
        }
    };

    // Check if login is expired and handle accordingly
    const handleLoginExpired = async (platform) => {
        try {
            await LoginService.logout(platform);
            await loadLoginStates();

            Alert.alert(
                'Login abgelaufen',
                `Dein ${platforms[platform].name} Login ist abgelaufen. Möchtest du dich neu anmelden für personalisierten Content?`,
                [
                    { text: 'Später', style: 'cancel' },
                    {
                        text: 'Neu anmelden',
                        onPress: () => navigation.navigate('Onboarding')
                    }
                ]
            );
        } catch (error) {
            console.error('Error handling login expiry:', error);
        }
    };

    const navigateToScreen = (screenName) => {
        if (screenName === 'PowerMode') {
            navigation.navigate('PowerMode');
        } else if (screenName === 'Analytics') {
            navigation.navigate('Analytics');
        } else if (screenName === 'Settings') {
            navigation.navigate('Settings');
        } else {
            Alert.alert(
                screenName,
                `${screenName} wird implementiert in der nächsten Version!`,
                [{ text: 'OK' }]
            );
        }
    };

    // Login Status Indicator Component
    const LoginStatusIndicator = () => {
        const currentPlatformLoggedIn = loginStates[activeTab];

        return (
            <View style={styles.loginStatusContainer}>
                <View style={[
                    styles.loginStatusDot,
                    { backgroundColor: currentPlatformLoggedIn ? '#10B981' : '#EF4444' }
                ]} />
                <Text style={styles.loginStatusText}>
                    {currentPlatformLoggedIn ? '🎯 Personalisiert' : '🔓 Öffentlich'}
                </Text>
                {!currentPlatformLoggedIn && (
                    <TouchableOpacity
                        style={styles.loginPrompt}
                        onPress={() => navigation.navigate('Onboarding')}
                    >
                        <Text style={styles.loginPromptText}>Anmelden</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    // Platform Info Banner
    const PlatformInfoBanner = () => {
        const currentPlatform = platforms[activeTab];
        const isLoggedIn = loginStates[activeTab];

        if (isLoggedIn) {
            return (
                <View style={[styles.infoBanner, { backgroundColor: `${currentPlatform.color}15` }]}>
                    <Text style={[styles.infoBannerText, { color: currentPlatform.color }]}>
                        ✨ Personalisiert: {currentPlatform.personalizedFeatures}
                    </Text>
                </View>
            );
        }

        return (
            <View style={styles.infoBanner}>
                <Text style={styles.infoBannerText}>
                    💡 Melde dich an für personalisierten {currentPlatform.name} Content
                </Text>
            </View>
        );
    };

    const webViewSource = getPersonalizedWebViewSource(activeTab);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
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

                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => navigateToScreen('PowerMode')}
                        >
                            <Text style={styles.headerButtonText}>⚡</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => navigateToScreen('Analytics')}
                        >
                            <Text style={styles.headerButtonText}>📊</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => navigateToScreen('Settings')}
                        >
                            <Text style={styles.headerButtonText}>⚙️</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Tab Navigation */}
                <View style={styles.tabContainer}>
                    {Object.entries(platforms).map(([key, platform]) => (
                        <TouchableOpacity
                            key={key}
                            style={[
                                styles.tab,
                                activeTab === key && { borderBottomColor: platform.color }
                            ]}
                            onPress={() => handleTabSwitch(key)}
                        >
                            <Text style={styles.tabIcon}>{platform.icon}</Text>
                            <Text style={[
                                styles.tabText,
                                activeTab === key && { color: platform.color }
                            ]}>
                                {platform.name}
                            </Text>
                            {loginStates[key] && (
                                <View style={[styles.tabLoginDot, { backgroundColor: platform.color }]} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Platform Info Banner */}
                <PlatformInfoBanner />

                {/* Action Bar */}
                <View style={styles.actionBar}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleRefresh}>
                        <Text style={styles.actionButtonText}>🔄 Aktualisieren</Text>
                    </TouchableOpacity>

                    <LoginStatusIndicator />

                    <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                        <Text style={styles.actionButtonText}>📤 Teilen</Text>
                    </TouchableOpacity>
                </View>

                {/* WebView Container with Swipe Gesture */}
                <PanGestureHandler onHandlerStateChange={onSwipeGesture}>
                    <View style={styles.webViewContainer}>
                        <WebView
                            key={`${activeTab}-${webViewKey}`}
                            ref={webViewRefs[activeTab]}
                            source={webViewSource}
                            style={styles.webView}
                            startInLoadingState={false}
                            onError={(syntheticEvent) => {
                                const { nativeEvent } = syntheticEvent;
                                console.log('WebView error:', nativeEvent);

                                Alert.alert(
                                    'Fehler beim Laden',
                                    `${platforms[activeTab].name} konnte nicht geladen werden.\n\nMöglicherweise ist der Login abgelaufen oder die Internetverbindung ist unterbrochen.`,
                                    [
                                        { text: 'Wiederholen', onPress: handleRefresh },
                                        {
                                            text: loginStates[activeTab] ? 'Login prüfen' : 'Anmelden',
                                            onPress: () => {
                                                if (loginStates[activeTab]) {
                                                    handleLoginExpired(activeTab);
                                                } else {
                                                    navigation.navigate('Onboarding');
                                                }
                                            }
                                        },
                                        { text: 'Abbrechen', style: 'cancel' }
                                    ]
                                );
                            }}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                            allowsInlineMediaPlayback={true}
                            mediaPlaybackRequiresUserAction={false}
                            scalesPageToFit={true}
                            bounces={true}
                            scrollEnabled={true}
                            showsHorizontalScrollIndicator={false}
                            showsVerticalScrollIndicator={false}
                            // KRITISCH: Cookies aktivieren für personalisierten Feed!
                            sharedCookiesEnabled={true}
                            thirdPartyCookiesEnabled={true}
                            // Cache für bessere Performance
                            cacheEnabled={true}
                            incognito={false}
                            // JavaScript für erweiterte Funktionen
                            injectedJavaScript={`
                                // Erweiterte Personalisierung
                                (function() {
                                    console.log('🎯 GoonScroll: Personalized feed loaded for ${activeTab}');
                                    
                                    // Cookie-Info für Debug
                                    if (document.cookie) {
                                        console.log('🍪 Cookies active for ${activeTab}');
                                    }
                                    
                                    // Scroll-Optimierung für mobile
                                    document.body.style.overscrollBehavior = 'contain';
                                })();
                            `}
                        />
                    </View>
                </PanGestureHandler>
            </SafeAreaView>
        </GestureHandlerRootView>
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
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
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
        gap: 8,
    },
    headerButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerButtonText: {
        fontSize: 16,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
        position: 'relative',
    },
    tabIcon: {
        fontSize: 16,
        marginBottom: 4,
    },
    tabText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    tabLoginDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    infoBanner: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    infoBannerText: {
        fontSize: 11,
        color: '#1D4ED8',
        fontWeight: '500',
        textAlign: 'center',
    },
    actionBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
    },
    actionButtonText: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '500',
    },
    loginStatusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        borderRadius: 12,
        gap: 4,
    },
    loginStatusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    loginStatusText: {
        fontSize: 10,
        color: '#374151',
        fontWeight: '500',
    },
    loginPrompt: {
        marginLeft: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: '#3B82F6',
        borderRadius: 8,
    },
    loginPromptText: {
        fontSize: 9,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    webViewContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    webView: {
        flex: 1,
    },
});

export default HomeScreen;