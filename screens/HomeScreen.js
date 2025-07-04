import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Share,
    Dimensions,
    AppState,
    Image
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import TrackingService from './TrackingService';
import LoginService from '../services/LoginService';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('youtube');
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

    // Platform configurations with personalized URLs
    const platforms = {
        youtube: {
            name: 'YouTube',
            color: '#FF0000',
            url: 'https://m.youtube.com/feed/shorts',
            icon: '📺'
        },
        tiktok: {
            name: 'TikTok',
            color: '#000000',
            url: 'https://www.tiktok.com/foryou',
            icon: '🎵'
        },
        instagram: {
            name: 'Instagram',
            color: '#E4405F',
            url: 'https://www.instagram.com/',
            icon: '📸'
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
                loadLoginStates();
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

    const handleShare = async () => {
        try {
            const currentPlatform = platforms[activeTab];
            const isLoggedIn = loginStates[activeTab];

            await Share.share({
                message: `Schau dir ${isLoggedIn ? 'meinen personalisierten' : 'diesen'} ${currentPlatform.name} Feed an! - GoonScroll App`,
                url: currentPlatform.url
            });

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

    const webViewSource = getPersonalizedWebViewSource(activeTab);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../assets/SchweinBild.png')}
                        style={styles.pigImage}
                        resizeMode="cover"
                    />
                    <Text style={styles.appTitle}>goonscroll_</Text>
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
                    </TouchableOpacity>
                ))}
            </View>

            {/* Action Bar */}
            <View style={styles.actionBar}>
                <TouchableOpacity style={styles.actionButton} onPress={handleRefresh}>
                    <Text style={styles.actionButtonText}>🔄 Aktualisieren</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                    <Text style={styles.actionButtonText}>📤 Teilen</Text>
                </TouchableOpacity>
            </View>

            {/* WebView Container */}
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
                            `${platforms[activeTab].name} konnte nicht geladen werden.`,
                            [
                                { text: 'Wiederholen', onPress: handleRefresh },
                                { text: 'OK', style: 'cancel' }
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
                    sharedCookiesEnabled={true}
                    thirdPartyCookiesEnabled={true}
                    cacheEnabled={true}
                    incognito={false}
                    injectedJavaScript={`
                        (function() {
                            console.log('🎯 GoonScroll: Personalized feed loaded for ${activeTab}');
                            
                            if (document.cookie) {
                                console.log('🍪 Cookies active for ${activeTab}');
                            }
                            
                            document.body.style.overscrollBehavior = 'contain';
                        })();
                    `}
                />
            </View>
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
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pigImage: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
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
    webViewContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    webView: {
        flex: 1,
    },
});

export default HomeScreen;