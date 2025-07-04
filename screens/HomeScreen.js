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

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('youtube');
    const [isLoading, setIsLoading] = useState(false);
    const [webViewKey, setWebViewKey] = useState(0); // For forcing WebView refresh

    const webViewRefs = {
        youtube: useRef(null),
        tiktok: useRef(null),
        instagram: useRef(null)
    };

    // Platform order for swiping
    const platformOrder = ['youtube', 'tiktok', 'instagram'];
    const currentIndex = platformOrder.indexOf(activeTab);

    // Start tracking when component mounts
    useEffect(() => {
        TrackingService.startSession(activeTab);

        // Handle app state changes
        const handleAppStateChange = (nextAppState) => {
            if (nextAppState === 'background' || nextAppState === 'inactive') {
                TrackingService.endSession();
            } else if (nextAppState === 'active') {
                TrackingService.startSession(activeTab);
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        // Cleanup
        return () => {
            TrackingService.endSession();
            subscription?.remove();
        };
    }, []);

    // Track platform switches
    useEffect(() => {
        if (activeTab) {
            TrackingService.switchPlatform(activeTab);
        }
    }, [activeTab]);

    // Platform configurations
    const platforms = {
        youtube: {
            name: 'YouTube',
            color: '#FF0000',
            url: 'https://m.youtube.com/playlist?list=PLrAXtmRdnEQy8VtkaWvaJnCMjj_ZsDCiI', // YouTube Shorts playlist
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
            url: 'https://www.instagram.com/reels/',
            icon: '📸'
        }
    };

    const handleTabSwitch = (tab) => {
        if (tab === activeTab) return;

        setIsLoading(true);
        setActiveTab(tab);

        // Simulate loading time
        setTimeout(() => {
            setIsLoading(false);
        }, 800);
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
            await Share.share({
                message: `Schau dir das auf ${currentPlatform.name} an! - GoonScroll App`,
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

    // In deiner HomeScreen.js - ersetze die navigateToScreen Funktion mit dieser:

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

    const webViewSource = {
        uri: platforms[activeTab].url,
        headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
        }
    };

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

                {/* WebView Container with Swipe Gesture */}
                <PanGestureHandler onHandlerStateChange={onSwipeGesture}>
                    <View style={styles.webViewContainer}>
                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={platforms[activeTab].color} />
                                <Text style={styles.loadingText}>
                                    {platforms[activeTab].name} wird geladen...
                                </Text>
                            </View>
                        ) : (
                            <WebView
                                key={`${activeTab}-${webViewKey}`}
                                ref={webViewRefs[activeTab]}
                                source={webViewSource}
                                style={styles.webView}
                                startInLoadingState={true}
                                renderLoading={() => (
                                    <View style={styles.webViewLoading}>
                                        <ActivityIndicator size="large" color={platforms[activeTab].color} />
                                    </View>
                                )}
                                onLoadStart={() => setIsLoading(true)}
                                onLoadEnd={() => setIsLoading(false)}
                                onError={(syntheticEvent) => {
                                    const { nativeEvent } = syntheticEvent;
                                    Alert.alert(
                                        'Fehler beim Laden',
                                        `${platforms[activeTab].name} konnte nicht geladen werden. Überprüfe deine Internetverbindung.`,
                                        [
                                            { text: 'Wiederholen', onPress: handleRefresh },
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
                            />
                        )}
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
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    webViewContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    webView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    webViewLoading: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    bottomBar: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    bottomInfo: {
        alignItems: 'center',
    },
    bottomText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    bottomSubtext: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
});

export default HomeScreen;