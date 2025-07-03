import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Switch,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import TrackingService from './TrackingService';

const SettingsScreen = ({ navigation }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [storageInfo, setStorageInfo] = useState(null);
    const [settings, setSettings] = useState({
        trackingEnabled: true,
        autoCleanup: true,
        dataRetentionDays: 30
    });

    // Load storage info when screen opens
    useEffect(() => {
        loadStorageInfo();
    }, []);

    const loadStorageInfo = async () => {
        try {
            const info = await TrackingService.getStorageSize();
            setStorageInfo(info);
        } catch (error) {
            console.error('Error loading storage info:', error);
        }
    };

    const handleClearAllData = () => {
        Alert.alert(
            '⚠️ Alle Daten löschen',
            'Möchtest du wirklich ALLE Analytics-Daten dauerhaft löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
            [
                { text: 'Abbrechen', style: 'cancel' },
                {
                    text: 'ALLES LÖSCHEN',
                    style: 'destructive',
                    onPress: async () => {
                        setIsLoading(true);
                        const deletedCount = await TrackingService.clearAllData();
                        Alert.alert('✅ Erledigt', `${deletedCount} Einträge wurden gelöscht`);
                        await loadStorageInfo();
                        setIsLoading(false);
                    }
                }
            ]
        );
    };

    const handleClearOldData = () => {
        Alert.alert(
            '🗑️ Alte Daten löschen',
            `Daten älter als ${settings.dataRetentionDays} Tage löschen?`,
            [
                { text: 'Abbrechen', style: 'cancel' },
                {
                    text: 'Alte Daten löschen',
                    onPress: async () => {
                        setIsLoading(true);
                        const deletedCount = await TrackingService.clearOldData(settings.dataRetentionDays);
                        Alert.alert('✅ Erledigt', `${deletedCount} alte Einträge wurden gelöscht`);
                        await loadStorageInfo();
                        setIsLoading(false);
                    }
                }
            ]
        );
    };

    const handleExportData = async () => {
        try {
            setIsLoading(true);
            const exportData = await TrackingService.exportAllData();

            if (exportData) {
                // In einer echten App würdest du hier die Daten teilen/speichern
                Alert.alert(
                    '📤 Export bereit',
                    `${exportData.totalEntries} Einträge exportiert.\n\nIn einer echten App würden die Daten jetzt geteilt oder gespeichert.`,
                    [
                        { text: 'OK' },
                        {
                            text: 'Debug Log anzeigen',
                            onPress: () => {
                                console.log('📊 Export Data:', JSON.stringify(exportData, null, 2));
                                Alert.alert('📊 Debug', 'Export-Daten wurden in die Konsole geschrieben');
                            }
                        }
                    ]
                );
            }
        } catch (error) {
            Alert.alert('❌ Fehler', 'Export fehlgeschlagen');
        }
        setIsLoading(false);
    };

    const handleShowAllKeys = async () => {
        try {
            const keys = await TrackingService.getAllStorageKeys();
            console.log('🔑 All Storage Keys:', keys);
            Alert.alert(
                '🔑 Storage Keys',
                `${keys.length} Keys gefunden:\n\n${keys.slice(0, 5).join('\n')}${keys.length > 5 ? '\n...' : ''}`,
                [
                    { text: 'OK' },
                    {
                        text: 'Alle in Konsole',
                        onPress: () => console.log('🔑 Complete Keys List:', keys)
                    }
                ]
            );
        } catch (error) {
            Alert.alert('❌ Fehler', 'Konnte Keys nicht laden');
        }
    };

    const SettingItem = ({ title, subtitle, value, onValueChange, type = 'switch' }) => (
        <View style={styles.settingItem}>
            <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{title}</Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
            {type === 'switch' && (
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                    thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
                />
            )}
        </View>
    );

    const ActionButton = ({ title, subtitle, icon, onPress, color = '#3B82F6', destructive = false }) => (
        <TouchableOpacity
            style={[styles.actionButton, destructive && styles.destructiveButton]}
            onPress={onPress}
            disabled={isLoading}
        >
            <View style={styles.actionButtonContent}>
                <Text style={styles.actionButtonIcon}>{icon}</Text>
                <View style={styles.actionButtonText}>
                    <Text style={[styles.actionButtonTitle, destructive && styles.destructiveText]}>
                        {title}
                    </Text>
                    {subtitle && (
                        <Text style={[styles.actionButtonSubtitle, destructive && styles.destructiveText]}>
                            {subtitle}
                        </Text>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
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
                        <Text style={styles.appTitle}>Settings</Text>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Storage Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>💾 Speicher-Info</Text>
                    <View style={styles.infoCard}>
                        {storageInfo ? (
                            <>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Gespeicherte Einträge:</Text>
                                    <Text style={styles.infoValue}>{storageInfo.totalKeys}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Speicher verwendet:</Text>
                                    <Text style={styles.infoValue}>{storageInfo.totalSizeKB} KB</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.refreshButton}
                                    onPress={loadStorageInfo}
                                >
                                    <Text style={styles.refreshButtonText}>🔄 Aktualisieren</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <ActivityIndicator size="small" color="#3B82F6" />
                        )}
                    </View>
                </View>

                {/* App Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>⚙️ App-Einstellungen</Text>
                    <View style={styles.settingsCard}>
                        <SettingItem
                            title="Tracking aktiviert"
                            subtitle="Analytics-Daten sammeln"
                            value={settings.trackingEnabled}
                            onValueChange={(value) => setSettings(prev => ({ ...prev, trackingEnabled: value }))}
                        />
                        <SettingItem
                            title="Auto-Cleanup"
                            subtitle="Alte Daten automatisch löschen"
                            value={settings.autoCleanup}
                            onValueChange={(value) => setSettings(prev => ({ ...prev, autoCleanup: value }))}
                        />
                    </View>
                </View>

                {/* Data Management */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🗂️ Daten-Verwaltung</Text>
                    <View style={styles.actionsCard}>
                        <ActionButton
                            icon="📤"
                            title="Daten exportieren"
                            subtitle="Backup aller Analytics-Daten erstellen"
                            onPress={handleExportData}
                        />

                        <ActionButton
                            icon="🗑️"
                            title="Alte Daten löschen"
                            subtitle={`Daten älter als ${settings.dataRetentionDays} Tage entfernen`}
                            onPress={handleClearOldData}
                        />

                        <ActionButton
                            icon="🔑"
                            title="Storage Keys anzeigen"
                            subtitle="Alle gespeicherten Schlüssel anzeigen"
                            onPress={handleShowAllKeys}
                        />
                    </View>
                </View>

                {/* Danger Zone */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>⚠️ Gefahrenbereich</Text>
                    <View style={styles.actionsCard}>
                        <ActionButton
                            icon="💥"
                            title="ALLE DATEN LÖSCHEN"
                            subtitle="Kompletter Reset - kann nicht rückgängig gemacht werden"
                            onPress={handleClearAllData}
                            destructive={true}
                        />
                    </View>
                </View>

                {/* Debug Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🐛 Debug Info</Text>
                    <View style={styles.debugCard}>
                        <Text style={styles.debugText}>
                            Storage Prefix: goonscroll_{'\n'}
                            AsyncStorage Keys: {storageInfo?.keys?.length || 0}{'\n'}
                            Letzte Aktualisierung: {new Date().toLocaleTimeString()}
                        </Text>
                    </View>
                </View>

                {/* Bottom Padding */}
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Loading Overlay */}
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <View style={styles.loadingModal}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text style={styles.loadingText}>Wird verarbeitet...</Text>
                    </View>
                </View>
            )}
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
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

    // Info Card Styles
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
    refreshButton: {
        marginTop: 8,
        paddingVertical: 8,
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
    },
    refreshButtonText: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '500',
    },

    // Settings Card Styles
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

    // Actions Card Styles
    actionsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
        overflow: 'hidden',
    },
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    destructiveButton: {
        backgroundColor: '#FEF2F2',
        borderBottomColor: '#FECACA',
    },
    actionButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButtonIcon: {
        fontSize: 24,
        marginRight: 12,
        width: 32,
        textAlign: 'center',
    },
    actionButtonText: {
        flex: 1,
    },
    actionButtonTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    actionButtonSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    destructiveText: {
        color: '#DC2626',
    },

    // Debug Card Styles
    debugCard: {
        backgroundColor: '#1F2937',
        borderRadius: 12,
        padding: 16,
    },
    debugText: {
        fontSize: 12,
        color: '#D1D5DB',
        fontFamily: 'monospace',
        lineHeight: 18,
    },

    // Loading Overlay
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingModal: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        minWidth: 120,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
    },
});

export default SettingsScreen;