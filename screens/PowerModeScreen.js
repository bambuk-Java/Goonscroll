import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import TrackingService from './TrackingService';
import LoginService from '../services/LoginService';

const PowerModeScreen = ({ navigation }) => {
    const [orientation, setOrientation] = useState('portrait');
    const [isTracking, setIsTracking] = useState(false);
    const [loginStates, setLoginStates] = useState({
        youtube: false,
        tiktok: false,
        instagram: false
    });

    // WebView refs
    const webViewRefs = {
        youtube: useRef(null),
        tiktok: useRef(null),
        instagram: useRef(null)
    };

    // Platform configuration mit personalisierten URLs
    const platforms = [
        {
            key: 'youtube',
            name: 'YouTube',
            // PERSONALISIERTE Shorts URL für angemeldeten Account
            url: 'https://m.youtube.com/feed/shorts',
            color: '#FF0000',
            icon: '📺'
        },
        {
            key: 'tiktok',
            name: 'TikTok',
            // PERSONALISIERTE For You Page für angemeldeten Account
            url: 'https://www.tiktok.com/foryou',
            color: '#000000',
            icon: '🎵'
        },
        {
            key: 'instagram',
            name: 'Instagram',
            // PERSONALISIERTE Reels für angemeldeten Account
            url: 'https://www.instagram.com/reels/',
            color: '#E4405F',
            icon: '📸'
        }
    ];

    // Lock orientation und start tracking
    useEffect(() => {
        const initializePowerMode = async () => {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
            setOrientation('landscape');

            // Load login states
            const states = await LoginService.getAllLoginStates();
            setLoginStates(states);

            // Start PowerMode tracking
            await TrackingService.startPowerModeSession();
            setIsTracking(true);

            console.log('🚀 PowerMode: Personalisierte Feeds aktiv', states);
        };

        initializePowerMode();

        return () => {
            const cleanup = async () => {
                await ScreenOrientation.unlockAsync();
                if (isTracking) {
                    await TrackingService.endPowerModeSession();
                }
            };
            cleanup();
        };
    }, []);

    const handleExit = async () => {
        if (isTracking) {
            await TrackingService.endPowerModeSession();
        }
        await ScreenOrientation.unlockAsync();
        navigation.goBack();
    };

    // Personalisierte WebView-Source mit Cookies
    const getPersonalizedWebViewSource = (platform) => {
        return {
            uri: platform.url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1 GoonScroll/1.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
                'Cache-Control': 'max-age=3600'
            }
        };
    };

    // AGGRESSIVE Multi-Video JavaScript für simultane Wiedergabe
    const getMultiVideoScript = (platform) => {
        return `
            (function() {
                console.log('${platform.key}: 🔥 PERSONALIZED MULTI-VIDEO MODE');
                
                let videoCount = 0;
                let playbackForced = false;
                
                // Check if logged in
                function checkLoginStatus() {
                    const loginIndicators = [
                        '#avatar-btn', 'img[alt*="avatar" i]', 'img[alt*="profilbild" i]',
                        '[data-e2e="profile-icon"]', '.avatar', 'svg[aria-label="Home"]'
                    ];
                    
                    for (let selector of loginIndicators) {
                        if (document.querySelector(selector)) {
                            console.log('${platform.key}: ✅ Logged in - personalized content active');
                            return true;
                        }
                    }
                    console.log('${platform.key}: ⚠️ Not logged in - public content');
                    return false;
                }
                
                // AGGRESSIVE Video-Management für simultane Wiedergabe
                function forceSimultaneousPlayback() {
                    const videos = document.querySelectorAll('video');
                    videoCount = videos.length;
                    
                    console.log('${platform.key}: Found', videoCount, 'videos - forcing simultaneous play');
                    
                    videos.forEach((video, index) => {
                        // KOMPLETT Pause blockieren
                        const originalPause = video.pause;
                        video.pause = function() {
                            console.log('${platform.key}: 🚫 PAUSE BLOCKED on video', index);
                            return Promise.resolve();
                        };
                        
                        // ALLE Pause-Events abfangen und blockieren
                        video.addEventListener('pause', function(e) {
                            console.log('${platform.key}: 🛑 Pause event intercepted on video', index);
                            e.preventDefault();
                            e.stopPropagation();
                            e.stopImmediatePropagation();
                            
                            // Sofort wieder abspielen
                            setTimeout(() => {
                                if (video.paused) {
                                    video.play().catch(err => console.log('${platform.key}: Force play failed:', err));
                                }
                            }, 10);
                            
                            return false;
                        }, { capture: true, passive: false });
                        
                        // Auto-play Events
                        ['loadstart', 'loadeddata', 'canplay', 'canplaythrough'].forEach(eventType => {
                            video.addEventListener(eventType, function() {
                                if (video.paused) {
                                    console.log('${platform.key}: Auto-starting video', index, 'on', eventType);
                                    video.play().catch(err => console.log('${platform.key}: Auto-play failed:', err));
                                }
                            });
                        });
                        
                        // Video-Eigenschaften für bessere Performance
                        video.setAttribute('playsinline', true);
                        video.setAttribute('webkit-playsinline', true);
                        video.setAttribute('autoplay', true);
                        video.muted = false; // NICHT stumm!
                        video.loop = true;
                        video.controls = false;
                        
                        // Intersection Observer für aggressive Auto-Play
                        if (window.IntersectionObserver) {
                            const observer = new IntersectionObserver((entries) => {
                                entries.forEach(entry => {
                                    if (entry.isIntersecting && entry.target.paused) {
                                        console.log('${platform.key}: Video', index, 'visible - forcing play');
                                        entry.target.play().catch(err => console.log('${platform.key}: Observer play failed:', err));
                                    }
                                });
                            }, { threshold: 0.1 });
                            
                            observer.observe(video);
                        }
                        
                        // Sofort versuchen abzuspielen
                        if (video.paused) {
                            console.log('${platform.key}: Initial play attempt on video', index);
                            video.play().catch(err => console.log('${platform.key}: Initial play failed:', err));
                        }
                    });
                    
                    playbackForced = true;
                    console.log('${platform.key}: ✅ Personalized videos playing simultaneously');
                }
                
                // Login-Status prüfen und anzeigen
                setTimeout(() => {
                    const isLoggedIn = checkLoginStatus();
                    if (isLoggedIn) {
                        console.log('${platform.key}: 🎯 PERSONALIZED CONTENT ACTIVE');
                    }
                }, 2000);
                
                // ALLES starten
                forceSimultaneousPlayback();
                
                // Aggressive kontinuierliche Überwachung
                setInterval(() => {
                    forceSimultaneousPlayback();
                }, 2000);
                
                // Bei neuen Videos (z.B. beim Scrollen)
                const observer = new MutationObserver(() => {
                    const currentVideoCount = document.querySelectorAll('video').length;
                    if (currentVideoCount > videoCount) {
                        console.log('${platform.key}: 🆕 New personalized videos detected');
                        forceSimultaneousPlayback();
                    }
                });
                
                observer.observe(document.body, { childList: true, subtree: true });
                
                console.log('${platform.key}: 🔥 PERSONALIZED MULTI-VIDEO MODE ACTIVE');
                return true;
            })();
        `;
    };

    // Portrait mode screen
    if (orientation !== 'landscape') {
        return (
            <View style={styles.orientationContainer}>
                <Text style={styles.orientationIcon}>🔄</Text>
                <Text style={styles.orientationTitle}>PowerMode</Text>
                <Text style={styles.orientationText}>
                    Drehe dein Gerät ins Querformat für drei personalisierte Video-Streams
                </Text>
                <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
                    <Text style={styles.exitButtonText}>← Zurück</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // PowerMode mit personalisierten Feeds
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar hidden />

            {/* Zurück-Button mit Login-Info */}
            <TouchableOpacity style={styles.floatingExitButton} onPress={handleExit}>
                <Text style={styles.floatingExitText}>←</Text>
            </TouchableOpacity>

            {/* Login-Status-Anzeige */}
            <View style={styles.loginStatusBanner}>
                {platforms.map((platform) => (
                    <View key={platform.key} style={styles.loginStatusItem}>
                        <Text style={platform.icon}>{platform.icon}</Text>
                        <View style={[
                            styles.loginStatusDot,
                            { backgroundColor: loginStates[platform.key] ? '#10B981' : '#EF4444' }
                        ]} />
                    </View>
                ))}
            </View>

            {/* Drei personalisierte Videos */}
            <View style={styles.videosContainer}>
                {platforms.map((platform) => (
                    <View key={platform.key} style={styles.videoBox}>
                        <WebView
                            ref={webViewRefs[platform.key]}
                            source={getPersonalizedWebViewSource(platform)}
                            style={styles.cleanWebView}
                            javaScriptEnabled={true}
                            allowsInlineMediaPlayback={true}
                            mediaPlaybackRequiresUserAction={false}
                            domStorageEnabled={true}
                            showsHorizontalScrollIndicator={false}
                            showsVerticalScrollIndicator={false}
                            bounces={true}
                            scrollEnabled={true}
                            // KRITISCH: Cookies für personalisierte Feeds
                            sharedCookiesEnabled={true}
                            thirdPartyCookiesEnabled={true}
                            cacheEnabled={true}
                            incognito={false}

                            // AGGRESSIVE Multi-Video JavaScript + Personalisierung
                            injectedJavaScript={getMultiVideoScript(platform)}

                            onLoadEnd={() => {
                                console.log(`${platform.key}: Personalized PowerMode loaded`);
                            }}

                            onError={(error) => {
                                console.log(`${platform.key}: Error -`, error.nativeEvent.description);
                            }}
                        />

                        {/* Platform-Label */}
                        <View style={[styles.platformLabel, { backgroundColor: platform.color }]}>
                            <Text style={styles.platformLabelText}>
                                {platform.icon} {loginStates[platform.key] ? '🎯' : '🔓'}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },

    // Orientation Screen
    orientationContainer: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    orientationIcon: {
        fontSize: 64,
        marginBottom: 24,
    },
    orientationTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    orientationText: {
        fontSize: 16,
        color: '#CCCCCC',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    exitButton: {
        backgroundColor: '#FF4444',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    exitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },

    // Zurück-Button
    floatingExitButton: {
        position: 'absolute',
        top: 16,
        left: 16,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 68, 68, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    floatingExitText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
        lineHeight: 20,
    },

    // Login-Status-Banner
    loginStatusBanner: {
        position: 'absolute',
        top: 16,
        right: 16,
        flexDirection: 'row',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        zIndex: 1000,
        gap: 8,
    },
    loginStatusItem: {
        alignItems: 'center',
        gap: 2,
    },
    loginStatusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },

    // Videos nehmen den Rest des Screens
    videosContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#000000',
    },
    videoBox: {
        flex: 1,
        backgroundColor: '#000000',
        borderRightWidth: 1,
        borderRightColor: '#111111',
        position: 'relative',
    },
    cleanWebView: {
        flex: 1,
        backgroundColor: '#000000',
    },
    platformLabel: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        opacity: 0.8,
    },
    platformLabelText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
});

export default PowerModeScreen;