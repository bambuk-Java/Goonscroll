import AsyncStorage from '@react-native-async-storage/async-storage';

class LoginService {
    constructor() {
        this.loginStates = {
            youtube: false,
            tiktok: false,
            instagram: false
        };
        this.listeners = [];
        this.sessionTimers = {}; // Für Session-Timeouts
    }

    // Service initialisieren
    async initializeService() {
        await this.loadLoginStates();
        await this.validateAllSessions();
        this.startSessionMonitoring();
    }

    // Login-Status laden beim App-Start
    async loadLoginStates() {
        try {
            const platforms = ['youtube', 'tiktok', 'instagram'];
            const loginPromises = platforms.map(platform => this.getLoginStatus(platform));
            const results = await Promise.all(loginPromises);

            platforms.forEach((platform, index) => {
                this.loginStates[platform] = results[index];
            });

            console.log('📱 Login states loaded:', this.loginStates);
            this.notifyListeners();
            return this.loginStates;
        } catch (error) {
            console.error('Error loading login states:', error);
            return this.loginStates;
        }
    }

    // Einzelnen Login-Status prüfen mit verbesserter Validierung
    async getLoginStatus(platform) {
        try {
            const loginData = await AsyncStorage.getItem(`goonscroll_login_${platform}`);
            if (!loginData) return false;

            const parsed = JSON.parse(loginData);

            // Session-Validierung
            const isValid = await this.validateSession(platform, parsed);

            if (!isValid) {
                console.log(`❌ Invalid session for ${platform}, logging out`);
                await this.logout(platform);
                return false;
            }

            return parsed.isLoggedIn || false;
        } catch (error) {
            console.error(`Error getting login status for ${platform}:`, error);
            return false;
        }
    }

    // Session validieren
    async validateSession(platform, loginData) {
        try {
            // Basis-Validierung
            if (!loginData || !loginData.isLoggedIn) return false;

            // Zeitbasierte Validierung
            const loginAge = Date.now() - new Date(loginData.loginTime).getTime();
            const maxAge = this.getMaxSessionAge(platform);

            if (loginAge > maxAge) {
                console.log(`⏰ Session expired for ${platform}`);
                return false;
            }

            // Inaktivitäts-Validierung
            if (loginData.lastActivity) {
                const inactiveTime = Date.now() - new Date(loginData.lastActivity).getTime();
                const maxInactiveTime = 7 * 24 * 60 * 60 * 1000; // 7 Tage

                if (inactiveTime > maxInactiveTime) {
                    console.log(`😴 Session inactive too long for ${platform}`);
                    return false;
                }
            }

            // Session-Integrität prüfen
            if (!this.checkSessionIntegrity(loginData)) {
                console.log(`🔍 Session integrity check failed for ${platform}`);
                return false;
            }

            return true;
        } catch (error) {
            console.error(`Error validating session for ${platform}:`, error);
            return false;
        }
    }

    // Session-Integrität prüfen
    checkSessionIntegrity(loginData) {
        // Grundlegende Struktur-Checks
        const requiredFields = ['platform', 'isLoggedIn', 'loginTime'];
        const hasRequiredFields = requiredFields.every(field => loginData.hasOwnProperty(field));

        if (!hasRequiredFields) return false;

        // Plausibilitäts-Checks
        const loginTime = new Date(loginData.loginTime);
        const now = new Date();

        // Login-Zeit kann nicht in der Zukunft liegen
        if (loginTime > now) return false;

        // Login-Zeit kann nicht älter als 1 Jahr sein
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        if (loginTime < oneYearAgo) return false;

        return true;
    }

    // Maximale Session-Dauer je Platform
    getMaxSessionAge(platform) {
        const sessionLimits = {
            youtube: 30 * 24 * 60 * 60 * 1000,    // 30 Tage (Google Sessions)
            tiktok: 7 * 24 * 60 * 60 * 1000,      // 7 Tage (Kürzere Sessions)
            instagram: 14 * 24 * 60 * 60 * 1000   // 14 Tage (Meta Sessions)
        };
        return sessionLimits[platform] || 7 * 24 * 60 * 60 * 1000; // Default: 7 Tage
    }

    // Login-Daten abrufen
    async getLoginData(platform) {
        try {
            const loginData = await AsyncStorage.getItem(`goonscroll_login_${platform}`);
            return loginData ? JSON.parse(loginData) : null;
        } catch (error) {
            console.error(`Error getting login data for ${platform}:`, error);
            return null;
        }
    }

    // Login setzen mit verbesserter Session-Erstellung
    async setLoginStatus(platform, isLoggedIn, additionalData = {}) {
        try {
            const now = new Date().toISOString();

            const loginInfo = {
                platform,
                isLoggedIn,
                loginTime: now,
                lastActivity: now,
                sessionId: this.generateSessionId(),
                appVersion: '1.0.0',
                deviceInfo: await this.getDeviceInfo(),
                sessionData: {
                    loginMethod: additionalData.loginMethod || 'webBrowser',
                    userAgent: additionalData.userAgent || 'GoonScroll/1.0.0',
                    timestamp: additionalData.timestamp || Date.now(),
                    ...additionalData
                }
            };

            await AsyncStorage.setItem(`goonscroll_login_${platform}`, JSON.stringify(loginInfo));
            this.loginStates[platform] = isLoggedIn;

            if (isLoggedIn) {
                // Session-Timer starten
                this.startSessionTimer(platform);
                console.log(`✅ Login successful: ${platform} (Session: ${loginInfo.sessionId})`);
            } else {
                // Session-Timer stoppen
                this.stopSessionTimer(platform);
                console.log(`🚪 Logout successful: ${platform}`);
            }

            this.notifyListeners();
            return true;
        } catch (error) {
            console.error(`Error setting login status for ${platform}:`, error);
            return false;
        }
    }

    // Session-ID generieren
    generateSessionId() {
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substr(2, 9);
        return `${timestamp}_${randomPart}`;
    }

    // Device-Info für Session-Tracking
    async getDeviceInfo() {
        try {
            // Basis Device-Info (ohne sensible Daten)
            return {
                platform: 'react-native',
                timestamp: Date.now(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
        } catch (error) {
            return { platform: 'unknown' };
        }
    }

    // Session-Timer starten (für automatische Aktivitäts-Updates)
    startSessionTimer(platform) {
        // Alten Timer löschen falls vorhanden
        this.stopSessionTimer(platform);

        // Alle 5 Minuten Aktivität updaten
        this.sessionTimers[platform] = setInterval(async () => {
            await this.updateActivity(platform);
        }, 5 * 60 * 1000);

        console.log(`⏰ Session timer started for ${platform}`);
    }

    // Session-Timer stoppen
    stopSessionTimer(platform) {
        if (this.sessionTimers[platform]) {
            clearInterval(this.sessionTimers[platform]);
            delete this.sessionTimers[platform];
            console.log(`⏰ Session timer stopped for ${platform}`);
        }
    }

    // Alle Sessions validieren
    async validateAllSessions() {
        try {
            const platforms = ['youtube', 'tiktok', 'instagram'];
            let changedSessions = false;

            for (const platform of platforms) {
                const loginData = await this.getLoginData(platform);
                if (loginData && loginData.isLoggedIn) {
                    const isValid = await this.validateSession(platform, loginData);
                    if (!isValid) {
                        await this.logout(platform);
                        changedSessions = true;
                    } else {
                        // Session ist gültig, Timer starten
                        this.startSessionTimer(platform);
                    }
                }
            }

            if (changedSessions) {
                await this.loadLoginStates(); // Reload nach Änderungen
            }

            console.log('🔍 Session validation completed');
        } catch (error) {
            console.error('Error validating sessions:', error);
        }
    }

    // Session-Monitoring starten
    startSessionMonitoring() {
        // Alle 30 Minuten Sessions überprüfen
        setInterval(async () => {
            await this.validateAllSessions();
        }, 30 * 60 * 1000);

        console.log('🔄 Session monitoring started');
    }

    // Logout mit verbesserter Cleanup
    async logout(platform) {
        try {
            await AsyncStorage.removeItem(`goonscroll_login_${platform}`);
            this.loginStates[platform] = false;
            this.stopSessionTimer(platform);

            console.log(`🚪 Logged out from ${platform}`);
            this.notifyListeners();
            return true;
        } catch (error) {
            console.error(`Error logging out from ${platform}:`, error);
            return false;
        }
    }

    // Alle Logins löschen
    async logoutAll() {
        try {
            const platforms = ['youtube', 'tiktok', 'instagram'];
            await Promise.all(platforms.map(platform => this.logout(platform)));

            console.log('🚪 Logged out from all platforms');
            return true;
        } catch (error) {
            console.error('Error logging out from all platforms:', error);
            return false;
        }
    }

    // Login-Aktivität aktualisieren
    async updateActivity(platform) {
        try {
            const loginData = await this.getLoginData(platform);
            if (loginData && loginData.isLoggedIn) {
                loginData.lastActivity = new Date().toISOString();
                await AsyncStorage.setItem(`goonscroll_login_${platform}`, JSON.stringify(loginData));
                console.log(`🔄 Activity updated for ${platform}`);
            }
        } catch (error) {
            console.error(`Error updating activity for ${platform}:`, error);
        }
    }

    // Session erneuern (verlängern)
    async renewSession(platform) {
        try {
            const loginData = await this.getLoginData(platform);
            if (loginData && loginData.isLoggedIn) {
                const now = new Date().toISOString();
                loginData.lastActivity = now;
                loginData.renewedAt = now;

                await AsyncStorage.setItem(`goonscroll_login_${platform}`, JSON.stringify(loginData));
                console.log(`🔄 Session renewed for ${platform}`);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Error renewing session for ${platform}:`, error);
            return false;
        }
    }

    // Aktueller Login-Status aller Platforms
    getAllLoginStates() {
        return { ...this.loginStates };
    }

    // Anzahl angemeldeter Platforms
    getLoggedInCount() {
        return Object.values(this.loginStates).filter(Boolean).length;
    }

    // Prüfe ob alle Platforms angemeldet sind
    areAllLoggedIn() {
        return this.getLoggedInCount() === 3;
    }

    // Prüfe ob mindestens eine Platform angemeldet ist
    isAnyLoggedIn() {
        return this.getLoggedInCount() > 0;
    }

    // Login-Status Listener hinzufügen
    addListener(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(listener => listener !== callback);
        };
    }

    // Alle Listener benachrichtigen
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.loginStates);
            } catch (error) {
                console.error('Error notifying login listener:', error);
            }
        });
    }

    // Erweiterte Login-Statistiken
    async getLoginStats() {
        try {
            const platforms = ['youtube', 'tiktok', 'instagram'];
            const stats = {};

            for (const platform of platforms) {
                const loginData = await this.getLoginData(platform);
                if (loginData) {
                    const sessionAge = Date.now() - new Date(loginData.loginTime).getTime();
                    const lastActivityAge = loginData.lastActivity ?
                        Date.now() - new Date(loginData.lastActivity).getTime() : null;

                    stats[platform] = {
                        isLoggedIn: loginData.isLoggedIn,
                        loginTime: loginData.loginTime,
                        lastActivity: loginData.lastActivity,
                        sessionAge: sessionAge,
                        sessionAgeFormatted: this.formatDuration(sessionAge),
                        lastActivityAge: lastActivityAge,
                        lastActivityFormatted: lastActivityAge ? this.formatDuration(lastActivityAge) : 'Nie',
                        sessionId: loginData.sessionId,
                        loginMethod: loginData.sessionData?.loginMethod || 'unknown',
                        isExpired: sessionAge > this.getMaxSessionAge(platform),
                        timeToExpiry: this.getMaxSessionAge(platform) - sessionAge
                    };
                } else {
                    stats[platform] = {
                        isLoggedIn: false,
                        loginTime: null,
                        lastActivity: null,
                        sessionAge: 0,
                        sessionAgeFormatted: 'Nicht angemeldet',
                        lastActivityAge: null,
                        lastActivityFormatted: 'Nie',
                        sessionId: null,
                        loginMethod: null,
                        isExpired: false,
                        timeToExpiry: 0
                    };
                }
            }

            return {
                platforms: stats,
                summary: {
                    totalLoggedIn: this.getLoggedInCount(),
                    allLoggedIn: this.areAllLoggedIn(),
                    anyLoggedIn: this.isAnyLoggedIn(),
                    lastChecked: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('Error getting login stats:', error);
            return {};
        }
    }

    // Dauer formatieren
    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m`;
        return `${seconds}s`;
    }

    // Session-Gesundheit prüfen
    async getSessionHealth() {
        try {
            const stats = await this.getLoginStats();
            const health = {
                overall: 'healthy',
                issues: [],
                recommendations: []
            };

            Object.entries(stats.platforms).forEach(([platform, data]) => {
                if (data.isLoggedIn) {
                    // Prüfe auf baldigen Ablauf
                    if (data.timeToExpiry < 3 * 24 * 60 * 60 * 1000) { // 3 Tage
                        health.issues.push(`${platform}: Session läuft in ${this.formatDuration(data.timeToExpiry)} ab`);
                        health.recommendations.push(`Erneuere die ${platform} Session`);
                    }

                    // Prüfe auf lange Inaktivität
                    if (data.lastActivityAge > 24 * 60 * 60 * 1000) { // 1 Tag
                        health.issues.push(`${platform}: Lange inaktiv (${data.lastActivityFormatted})`);
                    }
                }
            });

            if (health.issues.length > 0) {
                health.overall = 'warning';
            }

            if (health.issues.length > 2) {
                health.overall = 'critical';
            }

            return health;
        } catch (error) {
            console.error('Error checking session health:', error);
            return { overall: 'unknown', issues: ['Fehler beim Prüfen'], recommendations: [] };
        }
    }

    // Login-Verlauf exportieren
    async exportLoginData() {
        try {
            const platforms = ['youtube', 'tiktok', 'instagram'];
            const exportData = {};

            for (const platform of platforms) {
                const loginData = await this.getLoginData(platform);
                if (loginData) {
                    // Sichere Daten für Export (keine sensiblen Session-Daten)
                    exportData[platform] = {
                        isLoggedIn: loginData.isLoggedIn,
                        loginTime: loginData.loginTime,
                        lastActivity: loginData.lastActivity,
                        platform: loginData.platform,
                        appVersion: loginData.appVersion,
                        loginMethod: loginData.sessionData?.loginMethod
                        // sessionId und andere sensible Daten werden nicht exportiert
                    };
                }
            }

            return {
                exportDate: new Date().toISOString(),
                exportVersion: '2.0',
                appVersion: '1.0.0',
                loginData: exportData,
                totalLogins: Object.keys(exportData).length,
                checksum: this.generateChecksum(exportData)
            };
        } catch (error) {
            console.error('Error exporting login data:', error);
            return null;
        }
    }

    // Checksum für Export-Integrität
    generateChecksum(data) {
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }

    // Bulk-Session-Management
    async refreshAllSessions() {
        try {
            const platforms = ['youtube', 'tiktok', 'instagram'];
            const results = {};

            for (const platform of platforms) {
                if (this.loginStates[platform]) {
                    results[platform] = await this.renewSession(platform);
                } else {
                    results[platform] = false;
                }
            }

            console.log('🔄 Bulk session refresh completed:', results);
            return results;
        } catch (error) {
            console.error('Error refreshing all sessions:', error);
            return {};
        }
    }

    // Platform-spezifische Login-URLs
    getPlatformLoginUrl(platform) {
        const loginUrls = {
            youtube: 'https://accounts.google.com/signin/v2/identifier?continue=https%3A%2F%2Fwww.youtube.com%2F',
            tiktok: 'https://www.tiktok.com/login/phone-or-email/email',
            instagram: 'https://www.instagram.com/accounts/login/'
        };
        return loginUrls[platform] || null;
    }

    // Debug: Alle Login-Daten anzeigen
    async debugLoginData() {
        try {
            const stats = await this.getLoginStats();
            const health = await this.getSessionHealth();
            const storageSize = await this.getStorageSize();

            console.log('🔍 === LOGIN DEBUG DATA ===');
            console.log('Current states:', this.loginStates);
            console.log('Detailed stats:', stats);
            console.log('Session health:', health);
            console.log('Storage usage:', storageSize);
            console.log('Active timers:', Object.keys(this.sessionTimers));

            return {
                states: this.loginStates,
                stats,
                health,
                storage: storageSize,
                activeTimers: Object.keys(this.sessionTimers)
            };
        } catch (error) {
            console.error('Error debugging login data:', error);
            return null;
        }
    }

    // Storage-Größe berechnen
    async getStorageSize() {
        try {
            const platforms = ['youtube', 'tiktok', 'instagram'];
            let totalSize = 0;
            const details = {};

            for (const platform of platforms) {
                const data = await AsyncStorage.getItem(`goonscroll_login_${platform}`);
                if (data) {
                    const size = new Blob([data]).size;
                    totalSize += size;
                    details[platform] = {
                        size: size,
                        sizeFormatted: `${Math.round(size / 1024 * 100) / 100} KB`
                    };
                }
            }

            return {
                totalSize,
                totalSizeFormatted: `${Math.round(totalSize / 1024 * 100) / 100} KB`,
                platformDetails: details
            };
        } catch (error) {
            console.error('Error calculating storage size:', error);
            return { totalSize: 0, totalSizeFormatted: '0 KB', platformDetails: {} };
        }
    }

    // Cleanup beim App-Beenden
    cleanup() {
        // Alle Timer stoppen
        Object.keys(this.sessionTimers).forEach(platform => {
            this.stopSessionTimer(platform);
        });

        // Listener leeren
        this.listeners = [];

        console.log('🧹 LoginService cleanup completed');
    }
    // === DEBUG METHODS ===

    // Debug: Komplette Diagnose
    async debugCompleteDiagnosis() {
        console.log('🔧 === COMPLETE LOGIN SERVICE DIAGNOSIS ===');

        try {
            // 1. Check current states
            console.log('1. Current login states:', this.loginStates);

            // 2. Check AsyncStorage directly
            console.log('2. Checking AsyncStorage directly...');
            const platforms = ['youtube', 'tiktok', 'instagram'];

            for (const platform of platforms) {
                const key = `goonscroll_login_${platform}`;
                const rawData = await AsyncStorage.getItem(key);
                console.log(`   ${platform}: ${rawData ? 'Data exists' : 'No data'}`);
                if (rawData) {
                    try {
                        const parsed = JSON.parse(rawData);
                        console.log(`   ${platform} parsed:`, parsed);
                    } catch (e) {
                        console.log(`   ${platform} parse error:`, e.message);
                    }
                }
            }

            // 3. Check all goonscroll keys
            console.log('3. All GoonScroll keys in AsyncStorage:');
            const allKeys = await AsyncStorage.getAllKeys();
            const goonscrollKeys = allKeys.filter(key => key.startsWith('goonscroll_'));
            console.log('   GoonScroll keys:', goonscrollKeys);

            // 4. Test setting a value
            console.log('4. Testing AsyncStorage write...');
            const testKey = 'goonscroll_test_' + Date.now();
            const testValue = { test: true, timestamp: Date.now() };
            await AsyncStorage.setItem(testKey, JSON.stringify(testValue));
            const readBack = await AsyncStorage.getItem(testKey);
            console.log('   Write test result:', readBack ? 'SUCCESS' : 'FAILED');
            await AsyncStorage.removeItem(testKey);

            // 5. Check session timers
            console.log('5. Active session timers:', Object.keys(this.sessionTimers));

            // 6. Check listeners
            console.log('6. Active listeners:', this.listeners.length);

            console.log('🔧 === DIAGNOSIS COMPLETE ===');

            return {
                states: this.loginStates,
                storage: goonscrollKeys,
                timers: Object.keys(this.sessionTimers),
                listeners: this.listeners.length
            };

        } catch (error) {
            console.error('❌ Diagnosis error:', error);
            return { error: error.message };
        }
    }

    // Debug: Test login directly
    async debugTestLogin(platform) {
        console.log(`🔧 [DEBUG] Testing direct login for ${platform}...`);

        try {
            // Direct AsyncStorage write
            const loginData = {
                platform,
                isLoggedIn: true,
                loginTime: new Date().toISOString(),
                lastActivity: new Date().toISOString(),
                sessionId: 'debug_' + Date.now(),
                debugTest: true
            };

            const key = `goonscroll_login_${platform}`;
            await AsyncStorage.setItem(key, JSON.stringify(loginData));
            console.log(`🔧 [DEBUG] Direct write completed for ${platform}`);

            // Read back
            const readBack = await AsyncStorage.getItem(key);
            console.log(`🔧 [DEBUG] Read back result:`, readBack ? 'SUCCESS' : 'FAILED');

            // Update internal state
            this.loginStates[platform] = true;
            this.notifyListeners();

            console.log(`🔧 [DEBUG] Internal state updated, listeners notified`);

            return true;
        } catch (error) {
            console.error(`❌ [DEBUG] Test login failed:`, error);
            return false;
        }
    }
}

// Export singleton instance
export default new LoginService();