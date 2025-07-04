import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const SettingsScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <View style={styles.logoContainer}>
                    <View style={styles.pigLogo}>
                        <View style={styles.pigFace}>
                            <View style={[styles.pigEye, { left: 6 }]} />
                            <View style={[styles.pigEye, { right: 6 }]} />
                            <View style={styles.pigSnout} />
                        </View>
                    </View>
                    <Text style={styles.appTitle}>Einstellungen</Text>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* App Info - OHNE Switches */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ℹ️ App-Information</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>App Version:</Text>
                            <Text style={styles.infoValue}>1.0.0</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>PowerMode:</Text>
                            <Text style={styles.infoValue}>✅ Aktiviert</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Plattformen:</Text>
                            <Text style={styles.infoValue}>YouTube, TikTok, Instagram</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Entwickler:</Text>
                            <Text style={styles.infoValue}>GoonScroll Team</Text>
                        </View>
                    </View>
                </View>

                {/* Schnellzugriff */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🚀 Schnellzugriff</Text>
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            style={styles.quickAction}
                            onPress={() => navigation.navigate('PowerMode')}
                        >
                            <Text style={styles.quickActionIcon}>⚡</Text>
                            <Text style={styles.quickActionText}>PowerMode</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.quickAction}
                            onPress={() => navigation.navigate('Analytics')}
                        >
                            <Text style={styles.quickActionIcon}>📊</Text>
                            <Text style={styles.quickActionText}>Analytics</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.quickAction}
                            onPress={() => navigation.navigate('Home')}
                        >
                            <Text style={styles.quickActionIcon}>🏠</Text>
                            <Text style={styles.quickActionText}>Home</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Features */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>✨ Features</Text>
                    <View style={styles.featuresCard}>
                        <View style={styles.featureItem}>
                            <Text style={styles.featureIcon}>📺</Text>
                            <View style={styles.featureText}>
                                <Text style={styles.featureTitle}>Multi-Platform</Text>
                                <Text style={styles.featureSubtitle}>YouTube, TikTok & Instagram in einer App</Text>
                            </View>
                        </View>

                        <View style={styles.featureItem}>
                            <Text style={styles.featureIcon}>⚡</Text>
                            <View style={styles.featureText}>
                                <Text style={styles.featureTitle}>PowerMode</Text>
                                <Text style={styles.featureSubtitle}>Drei Videos gleichzeitig im Querformat</Text>
                            </View>
                        </View>

                        <View style={styles.featureItem}>
                            <Text style={styles.featureIcon}>📊</Text>
                            <View style={styles.featureText}>
                                <Text style={styles.featureTitle}>Analytics</Text>
                                <Text style={styles.featureSubtitle}>Detaillierte Nutzungsstatistiken</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Bottom Padding */}
                <View style={{ height: 40 }} />
            </ScrollView>
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
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    backButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
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
        paddingHorizontal: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
    },

    // Settings Card
    settingsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    settingText: {
        flex: 1,
        marginRight: 16,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    settingSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },

    // Info Card
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },

    // Quick Actions
    quickActions: {
        flexDirection: 'row',
        gap: 12,
    },
    quickAction: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    quickActionIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    quickActionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center',
    },

    // Features Card
    featuresCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    featureIcon: {
        fontSize: 24,
        marginRight: 12,
        width: 32,
        textAlign: 'center',
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    featureSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
});

export default SettingsScreen;