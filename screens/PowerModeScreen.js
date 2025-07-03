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

const PowerModeScreen = ({ navigation }) => {
    const [orientation, setOrientation] = useState('portrait');
    const [isTracking, setIsTracking] = useState(false);

    // WebView refs
    const webViewRefs = {
        youtube: useRef(null),
        tiktok: useRef(null),
        instagram: useRef(null)
    };

    // Platform configuration
    const platforms = [
        {
            key: 'youtube',
            name: 'YouTube',
            url: 'https://m.youtube.com/shorts',
            color: '#FF0000',
            icon: '📺'
        },
        {
            key: 'tiktok',
            name: 'TikTok',
            url: 'https://www.tiktok.com/foryou',
            color: '#000000',
            icon: '🎵'
        },
        {
            key: 'instagram',
            name: 'Instagram',
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

            // Start PowerMode tracking
            await TrackingService.startPowerModeSession();
            setIsTracking(true);

            console.log('🚀 PowerMode: Clean Minimal Mode');
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

    // AGGRESSIVE Multi-Video JavaScript - ALLE Videos gleichzeitig!
    const getMultiVideoScript = (platform) => {
        return `
            (function() {
                console.log('${platform}: 🔥 MULTI-VIDEO MODE - Force simultaneous playback');
                
                let videoCount = 0;
                let playbackForced = false;
                
                // AGGRESSIVE Video-Management für simultane Wiedergabe
                function forceSimultaneousPlayback() {
                    const videos = document.querySelectorAll('video');
                    videoCount = videos.length;
                    
                    console.log('${platform}: Found', videoCount, 'videos - forcing simultaneous play');
                    
                    videos.forEach((video, index) => {
                        // KOMPLETT Pause blockieren
                        const originalPause = video.pause;
                        video.pause = function() {
                            console.log('${platform}: 🚫 PAUSE BLOCKED on video', index);
                            return Promise.resolve();
                        };
                        
                        // ALLE Pause-Events abfangen und blockieren
                        video.addEventListener('pause', function(e) {
                            console.log('${platform}: 🛑 Pause event intercepted on video', index);
                            e.preventDefault();
                            e.stopPropagation();
                            e.stopImmediatePropagation();
                            
                            // Sofort wieder abspielen
                            setTimeout(() => {
                                if (video.paused) {
                                    video.play().catch(err => console.log('${platform}: Force play failed:', err));
                                }
                            }, 10);
                            
                            return false;
                        }, { capture: true, passive: false });
                        
                        // Auto-play Events blockieren die pausieren könnten
                        ['loadstart', 'loadeddata', 'canplay', 'canplaythrough'].forEach(eventType => {
                            video.addEventListener(eventType, function() {
                                if (video.paused) {
                                    console.log('${platform}: Auto-starting video', index, 'on', eventType);
                                    video.play().catch(err => console.log('${platform}: Auto-play failed:', err));
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
                                        console.log('${platform}: Video', index, 'visible - forcing play');
                                        entry.target.play().catch(err => console.log('${platform}: Observer play failed:', err));
                                    }
                                });
                            }, { threshold: 0.1 });
                            
                            observer.observe(video);
                        }
                        
                        // Sofort versuchen abzuspielen
                        if (video.paused) {
                            console.log('${platform}: Initial play attempt on video', index);
                            video.play().catch(err => console.log('${platform}: Initial play failed:', err));
                        }
                    });
                    
                    playbackForced = true;
                    console.log('${platform}: ✅ Forced simultaneous playback on', videoCount, 'videos');
                }
                
                // AGGRESSIVE Browser-Policy Override
                function overrideBrowserPolicies() {
                    // Override Autoplay Policy
                    if (navigator.mediaSession) {
                        navigator.mediaSession.setActionHandler('pause', function() {
                            console.log('${platform}: 🚫 MediaSession pause blocked');
                            // Do nothing - block pause
                        });
                        
                        navigator.mediaSession.setActionHandler('play', function() {
                            console.log('${platform}: 🎵 MediaSession play requested');
                            document.querySelectorAll('video').forEach(video => {
                                if (video.paused) {
                                    video.play().catch(err => console.log('${platform}: MediaSession play failed:', err));
                                }
                            });
                        });
                    }
                    
                    // Override document visibility change (prevents auto-pause)
                    Object.defineProperty(document, 'hidden', {
                        value: false,
                        writable: false
                    });
                    
                    Object.defineProperty(document, 'visibilityState', {
                        value: 'visible',
                        writable: false
                    });
                    
                    // Block visibilitychange events
                    document.addEventListener('visibilitychange', function(e) {
                        console.log('${platform}: 🚫 Visibility change blocked');
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                    }, { capture: true, passive: false });
                    
                    console.log('${platform}: 🔧 Browser policies overridden');
                }
                
                // Kontinuierliche Playback-Überwachung
                function continuousPlaybackCheck() {
                    const videos = document.querySelectorAll('video');
                    let pausedCount = 0;
                    
                    videos.forEach((video, index) => {
                        if (video.paused) {
                            pausedCount++;
                            console.log('${platform}: 🔄 Restarting paused video', index);
                            video.play().catch(err => console.log('${platform}: Restart failed:', err));
                        }
                    });
                    
                    if (pausedCount > 0) {
                        console.log('${platform}: ⚡ Restarted', pausedCount, 'paused videos');
                    }
                }
                
                // UI-Buttons verstecken (sanft)
                function hideUIButtons() {
                    const uiSelectors = [
                        '[data-testid*="like"]', '[data-testid*="comment"]', '[data-testid*="share"]',
                        '[aria-label*="like" i]', '[aria-label*="comment" i]', '[aria-label*="share" i]',
                        '.like-button', '.comment-button', '.share-button',
                        '[class*="ActionButton"]', '[class*="caption"]:not(video)',
                        '[class*="username"]:not(video)', 'nav:not([class*="video"])'
                    ];
                    
                    uiSelectors.forEach(selector => {
                        try {
                            const elements = document.querySelectorAll(selector);
                            elements.forEach(el => {
                                if (el.tagName !== 'VIDEO' && !el.querySelector('video')) {
                                    el.style.visibility = 'hidden';
                                    el.style.opacity = '0';
                                    el.style.pointerEvents = 'none';
                                }
                            });
                        } catch (e) { /* ignore */ }
                    });
                }
                
                // ALLES starten
                overrideBrowserPolicies();
                forceSimultaneousPlayback();
                hideUIButtons();
                
                // Aggressive kontinuierliche Überwachung
                setInterval(() => {
                    forceSimultaneousPlayback();
                    continuousPlaybackCheck();
                }, 2000); // Alle 2 Sekunden prüfen
                
                // Sanftere UI-Updates
                setInterval(() => {
                    hideUIButtons();
                }, 10000);
                
                // Bei neuen Videos (z.B. beim Scrollen)
                const observer = new MutationObserver(() => {
                    const currentVideoCount = document.querySelectorAll('video').length;
                    if (currentVideoCount > videoCount) {
                        console.log('${platform}: 🆕 New videos detected, forcing playback');
                        forceSimultaneousPlayback();
                    }
                });
                
                observer.observe(document.body, { childList: true, subtree: true });
                
                console.log('${platform}: 🔥 MULTI-VIDEO MODE ACTIVE - All videos should play simultaneously');
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
                    Drehe dein Gerät ins Querformat für drei saubere Video-Streams
                </Text>
                <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
                    <Text style={styles.exitButtonText}>← Zurück</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // PowerMode mit Zurück-Button aber ohne Video-UI
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar hidden />

            {/* Zurück-Button oben links - bleibt da! */}
            <TouchableOpacity style={styles.floatingExitButton} onPress={handleExit}>
                <Text style={styles.floatingExitText}>←</Text>
            </TouchableOpacity>

            {/* Drei Videos - UI-Elemente in den Videos werden entfernt */}
            <View style={styles.videosContainer}>
                {platforms.map((platform) => (
                    <View key={platform.key} style={styles.videoBox}>
                        <WebView
                            ref={webViewRefs[platform.key]}
                            source={{ uri: platform.url }}
                            style={styles.cleanWebView}
                            javaScriptEnabled={true}
                            allowsInlineMediaPlayback={true}
                            mediaPlaybackRequiresUserAction={false}
                            domStorageEnabled={true}
                            showsHorizontalScrollIndicator={false}
                            showsVerticalScrollIndicator={false}
                            bounces={true}
                            scrollEnabled={true}

                            // AGGRESSIVE Multi-Video JavaScript - simultane Wiedergabe + UI-Cleaning
                            injectedJavaScript={getMultiVideoScript(platform.key)}

                            onLoadEnd={() => {
                                console.log(`${platform.key}: Clean mode loaded - video UI cleaned`);
                            }}

                            onError={(error) => {
                                console.log(`${platform.key}: Error -`, error.nativeEvent.description);
                            }}
                        />
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

    // Zurück-Button oben links - bleibt sichtbar
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
    },
    cleanWebView: {
        flex: 1,
        backgroundColor: '#000000',
    },
});

export default PowerModeScreen;