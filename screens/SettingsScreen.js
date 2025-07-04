import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import LoginService from '../services/LoginService';
import SessionRecovery from '../utils/SessionRecovery';

const SettingsScreen = ({ navigation }) => {
    const [sessionStats, setSessionStats] = useState(null);
    const [sessionHealth, setSessionHealth] = useState(null);

    useEffect(() => {
        loadSessionData();
    }, []);

    const loadSessionData = async () => {
        try {
            const [stats, health] = await Promise.all([
                LoginService.getLoginStats(),
                LoginService.getSessionHealth()
            ]);

            setSessionStats(stats);
            setSessionHealth(health);
        } catch (error) {
            console.error('Error loading session data:', error);
        }
    };

    const handleRefreshSessions = async () => {
        Alert.alert(
            'Sessions aktualisieren',
            'Möchtest du alle aktiven Sessions aktualisieren?',
            [
                { text: 'Abbrechen', style: 'cancel' },
                {
                    text: 'Aktualisieren',
                    onPress: async () => {
                        try {
                            await SessionRecovery.attemptAutoRecovery();
                            await loadSessionData();
                            Alert.alert('Erfolg', 'Sessions wurden aktualisiert!');
                        } catch (error) {
                            Alert.alert('Fehler', 'Sessions konnten nicht aktualisiert werden.');
                        }
                    }
                }
            ]
        );
    };

    const handleCreateBackup = async () => {
        try {
            await SessionRecovery.createSessionBackup();
            Alert.alert('Backup erstellt', 'Session-Backup wurde erfolgreich erstellt.');
        } catch (error) {
            Alert.alert('Fehler', 'Backup konnte nicht erstellt werden.');
        }
    };

    const handleLogoutAll = async () => {
        Alert.alert(
            'Alle Abmelden',
            'Möchtest du dich von allen Plattformen abmelden?',
            [
                { text: 'Abbrechen', style: 'cancel' },
                {
                    text: 'Alle Abmelden',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await LoginService.logoutAll();
                            await loadSessionData();
                            Alert.alert('Abgemeldet', 'Du wurdest von allen Plattformen abgemeldet.');
                        } catch (error) {
                            Alert.alert('Fehler', 'Abmeldung fehlgeschlagen.');
                        }
                    }
                }
            ]
        );
    };

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
                    <Image
                        source={require('../assets/SchweinBild.png')}
                        style={styles.pigImage}
                        resizeMode="cover"
                    />
                    <Text style={styles.appTitle}>Einstellungen</Text>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Session-Status */}
                {sessionHealth && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📊 Session-Status</Text>
                        <View style={[
                            styles.sessionHealthCard,
                            {
                                borderLeftColor:
                                    sessionHealth.overall === 'healthy' ? '#10B981' :
                                        sessionHealth.overall === 'warning' ? '#F59E0B' : '#EF4444'
                            }
                        ]}>
                            <View style={styles.healthHeader}>
                                <Text style={styles.healthTitle}>
                                    {sessionHealth.overall === 'healthy' ? '✅ Alle Sessions gesund' :
                                        sessionHealth.overall === 'warning' ? '⚠️ Session-Warnungen' : '❌ Session-Probleme'}
                                </Text>
                                <Text style={[
                                    styles.healthStatus,
                                    {
                                        color:
                                            sessionHealth.overall === 'healthy' ? '#10B981' :
                                                sessionHealth.overall === 'warning' ? '#F59E0B' : '#EF4444'
                                    }
                                ]}>
                                    {sessionHealth.overall}
                                </Text>
                            </View>

                            {sessionHealth.issues.length > 0 && (
                                <View style={styles.issuesContainer}>
                                    <Text style={styles.issuesTitle}>Probleme:</Text>
                                    {sessionHealth.issues.map((issue, index) => (
                                        <Text key={index} style={styles.issueText}>• {issue}</Text>
                                    ))}
                                </View>
                            )}

                            {sessionHealth.recommendations.length > 0 && (
                                <View style={styles.recommendationsContainer}>
                                    <Text style={styles.recommendationsTitle}>Empfehlungen:</Text>
                                    {sessionHealth.recommendations.map((rec, index) => (
                                        <Text key={index} style={styles.recommendationText}>• {rec}</Text>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Session-Management */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🔧 Session-Management</Text>
                    <View style={styles.managementCard}>
                        <TouchableOpacity
                            style={styles.managementButton}
                            onPress={handleRefreshSessions}
                        >
                            <Text style={styles.managementIcon}>🔄</Text>
                            <View style={styles.managementText}>
                                <Text style={styles.managementTitle}>Sessions aktualisieren</Text>
                                <Text style={styles.managementDesc}>Alle aktiven Sessions prüfen und erneuern</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.managementButton}
                            onPress={handleCreateBackup}
                        >
                            <Text style={styles.managementIcon}>💾</Text>
                            <View style={styles.managementText}>
                                <Text style={styles.managementTitle}>Backup erstellen</Text>
                                <Text style={styles.managementDesc}>Session-Backup für Wiederherstellung</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.managementButton}
                            onPress={() => navigation.navigate('Onboarding')}
                        >
                            <Text style={styles.managementIcon}>🔑</Text>
                            <View style={styles.managementText}>
                                <Text style={styles.managementTitle}>Logins verwalten</Text>
                                <Text style={styles.managementDesc}>Zu Login-Verwaltung wechseln</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.managementButton, styles.dangerButton]}
                            onPress={handleLogoutAll}
                        >
                            <Text style={styles.managementIcon}>🚪</Text>
                            <View style={styles.managementText}>
                                <Text style={[styles.managementTitle, styles.dangerText]}>Alle abmelden</Text>
                                <Text style={styles.managementDesc}>Von allen Plattformen abmelden</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Detaillierte Session-Infos */}
                {sessionStats && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📋 Session-Details</Text>
                        <View style={styles.detailsCard}>
                            {Object.entries(sessionStats.platforms).map(([platform, data]) => (
                                <View key={platform} style={styles.platformDetail}>
                                    <View style={styles.platformDetailHeader}>
                                        <Text style={styles.platformDetailName}>
                                            {platform === 'youtube' ? 'YouTube' :
                                                platform === 'tiktok' ? 'TikTok' : 'Instagram'}
                                        </Text>
                                        <Text style={[
                                            styles.platformDetailStatus,
                                            { color: data.isLoggedIn ? '#10B981' : '#6B7280' }
                                        ]}>
                                            {data.isLoggedIn ? '✅ Angemeldet' : '❌ Nicht angemeldet'}
                                        </Text>
                                    </View>

                                    {data.isLoggedIn && (
                                        <View style={styles.platformDetailInfo}>
                                            <Text style={styles.platformDetailText}>
                                                Session: {data.sessionAgeFormatted}
                                            </Text>
                                            <Text style={styles.platformDetailText}>
                                                Letzte Aktivität: {data.lastActivityFormatted}
                                            </Text>
                                            {data.isExpired && (
                                                <Text style={styles.expiredText}>⚠️ Session abgelaufen</Text>
                                            )}
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* App Info */}
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
                            <Text style={styles.infoLabel}>Session-Recovery:</Text>
                            <Text style={styles.infoValue}>✅ Aktiv</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Angemeldete Plattformen:</Text>
                            <Text style={styles.infoValue}>
                                {sessionStats ? sessionStats.summary.totalLoggedIn : 0}/3
                            </Text>
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

    // Session Health Card
    sessionHealthCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    healthHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    healthTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        flex: 1,
    },
    healthStatus: {
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    issuesContainer: {
        marginTop: 8,
        padding: 12,
        backgroundColor: '#FEF3C7',
        borderRadius: 6,
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
    recommendationsContainer: {
        marginTop: 8,
        padding: 12,
        backgroundColor: '#EFF6FF',
        borderRadius: 6,
    },
    recommendationsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E40AF',
        marginBottom: 4,
    },
    recommendationText: {
        fontSize: 12,
        color: '#1E40AF',
        lineHeight: 16,
    },

    // Management Card
    managementCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    managementButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    managementIcon: {
        fontSize: 24,
        marginRight: 12,
        width: 32,
        textAlign: 'center',
    },
    managementText: {
        flex: 1,
    },
    managementTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    managementDesc: {
        fontSize: 14,
        color: '#6B7280',
    },
    dangerButton: {
        borderBottomWidth: 0,
    },
    dangerText: {
        color: '#EF4444',
    },

    // Details Card
    detailsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    platformDetail: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    platformDetailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    platformDetailName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    platformDetailStatus: {
        fontSize: 12,
        fontWeight: '500',
    },
    platformDetailInfo: {
        marginLeft: 8,
    },
    platformDetailText: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
    },
    expiredText: {
        fontSize: 12,
        color: '#EF4444',
        fontWeight: '500',
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
});

export default SettingsScreen;