import React, { useState, useEffect } from 'react';
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

const PowerModeScreen = ({ navigation }) => {
    const [orientation, setOrientation] = useState('portrait');

    // Platform configuration - working URLs
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
            url: 'https://www.tiktok.com/@tiktok',  // TikTok profile page - usually works better
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

    // Lock orientation - simplified without tracking for now
    useEffect(() => {
        const lockOrientation = async () => {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
            setOrientation('landscape');

            console.log('🚀 PowerMode: Ready (tracking disabled for now)');
        };

        lockOrientation();

        return () => {
            ScreenOrientation.unlockAsync();
        };
    }, []);

    const handleExit = async () => {
        await ScreenOrientation.unlockAsync();
        navigation.goBack();
    };

    // Portrait mode screen
    if (orientation !== 'landscape') {
        return (
            <View style={styles.orientationContainer}>
                <Text style={styles.orientationIcon}>🔄</Text>
                <Text style={styles.orientationTitle}>PowerMode</Text>
                <Text style={styles.orientationText}>
                    Drehe dein Gerät ins Querformat für drei parallele Video-Streams
                </Text>
                <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
                    <Text style={styles.exitButtonText}>← Zurück</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Landscape mode - Ultra Minimalistic PowerMode
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar hidden />

            {/* Minimal Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={handleExit}>
                <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            {/* Three Isolated Video Streams */}
            <View style={styles.videoContainer}>
                {platforms.map((platform, index) => (
                    <View key={`${platform.key}-${index}`} style={styles.videoColumn}>
                        <WebView
                            key={`isolated-${platform.key}-${Date.now()}-${Math.random()}`}
                            source={{
                                uri: platform.url,  // Remove timestamp parameters that might cause issues
                                headers: {
                                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
                                }
                            }}
                            style={styles.webView}
                            javaScriptEnabled={true}
                            scrollEnabled={true}  // Make sure scrolling is enabled
                            allowsInlineMediaPlayback={true}
                            mediaPlaybackRequiresUserAction={false}
                            domStorageEnabled={true}
                            mixedContentMode="compatibility"
                            showsHorizontalScrollIndicator={false}
                            showsVerticalScrollIndicator={false}
                            startInLoadingState={false}
                            bounces={true}  // Enable bouncing for better scroll feel
                            scalesPageToFit={true}  // Let it scale properly
                            originWhitelist={['*']}
                            onShouldStartLoadWithRequest={() => true}
                            injectedJavaScript={`
                // Simplified video management - no scrolling interference
                (function() {
                  console.log('${platform.key}: Loading...');
                  
                  // Don't block pause completely - causes scroll issues
                  const videos = document.querySelectorAll('video');
                  console.log('${platform.key}: Found', videos.length, 'videos');
                  
                  // Try to auto-play after 2 seconds
                  setTimeout(() => {
                    const vids = document.querySelectorAll('video');
                    vids.forEach(video => {
                      if (video.paused) {
                        video.play().catch(e => console.log('${platform.key}: Play failed -', e.message));
                      }
                    });
                  }, 2000);
                  
                  console.log('${platform.key}: Ready');
                })();
                true;
              `}
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

    // Landscape PowerMode - Ultra Minimal
    backButton: {
        position: 'absolute',
        top: 10,
        left: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    backButtonText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },

    // Video Layout - Better scaling
    videoContainer: {
        flex: 1,
        flexDirection: 'row',
        gap: 1,
    },
    videoColumn: {
        flex: 1,
        backgroundColor: '#000000',
        borderRadius: 4,
        overflow: 'hidden',
    },
    webView: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
});

export default PowerModeScreen;