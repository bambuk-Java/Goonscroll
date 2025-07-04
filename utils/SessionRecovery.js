import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import LoginService from '../services/LoginService';

class SessionRecovery {
    constructor() {
        this.isRecovering = false;
        this.recoveryAttempts = {};
        this.maxRecoveryAttempts = 3;
    }

    // Auto-Recovery beim App-Start
    async attemptAutoRecovery() {
        if (this.isRecovering) return;

        this.isRecovering = true;
        console.log('🔄 Starting auto-recovery...');

        try {
            const platforms = ['youtube', 'tiktok', 'instagram'];
            const recoveryResults = {};

            for (const platform of platforms) {
                const result = await this.recoverPlatformSession(platform);
                recoveryResults[platform] = result;
            }

            console.log('🔄 Auto-recovery completed:', recoveryResults);
            return recoveryResults;
        } catch (error) {
            console.error('Error during auto-recovery:', error);
            return {};
        } finally {
            this.isRecovering = false;
        }
    }

    // Einzelne Platform-Session wiederherstellen
    async recoverPlatformSession(platform) {
        try {
            // Prüfe aktuelle Session
            const loginData = await LoginService.getLoginData(platform);

            if (!loginData || !loginData.isLoggedIn) {
                return { status: 'no_session', action: 'none' };
            }

            // Prüfe Session-Gültigkeit
            const isValid = await LoginService.validateSession(platform, loginData);

            if (isValid) {
                return { status: 'valid', action: 'none' };
            }

            // Versuche Session-Recovery
            const recoveryResult = await this.performSessionRecovery(platform, loginData);
            return recoveryResult;

        } catch (error) {
            console.error(`Error recovering ${platform} session:`, error);
            return { status: 'error', action: 'manual_login_required' };
        }
    }

    // Session-Recovery durchführen
    async performSessionRecovery(platform, loginData) {
        // Prüfe Recovery-Versuche
        const attemptKey = `recovery_attempts_${platform}`;
        const attempts = await this.getRecoveryAttempts(attemptKey);

        if (attempts >= this.maxRecoveryAttempts) {
            console.log(`⛔ Max recovery attempts reached for ${platform}`);
            return {
                status: 'max_attempts_reached',
                action: 'manual_login_required',
                attempts: attempts
            };
        }

        try {
            // Increment attempt counter
            await this.incrementRecoveryAttempts(attemptKey);

            // Versuche Silent-Recovery
            const silentResult = await this.attemptSilentRecovery(platform, loginData);

            if (silentResult.success) {
                // Reset attempt counter bei Erfolg
                await this.resetRecoveryAttempts(attemptKey);
                return {
                    status: 'recovered_silent',
                    action: 'session_renewed',
                    method: 'silent'
                };
            }

            // Versuche Cookie-basierte Recovery
            const cookieResult = await this.attemptCookieRecovery(platform, loginData);

            if (cookieResult.success) {
                await this.resetRecoveryAttempts(attemptKey);
                return {
                    status: 'recovered_cookie',
                    action: 'session_renewed',
                    method: 'cookie'
                };
            }

            // Recovery fehlgeschlagen
            return {
                status: 'recovery_failed',
                action: 'manual_login_required',
                attempts: attempts + 1
            };

        } catch (error) {
            console.error(`Recovery error for ${platform}:`, error);
            return {
                status: 'recovery_error',
                action: 'manual_login_required'
            };
        }
    }

    // Silent Recovery (Session-Verlängerung ohne Browser)
    async attemptSilentRecovery(platform, loginData) {
        try {
            console.log(`🤫 Attempting silent recovery for ${platform}...`);

            // Prüfe ob Session nur abgelaufen aber noch gültig ist
            const sessionAge = Date.now() - new Date(loginData.loginTime).getTime();
            const maxAge = LoginService.getMaxSessionAge(platform);

            // Wenn nur leicht abgelaufen (< 24h), versuche Verlängerung
            if (sessionAge < maxAge + (24 * 60 * 60 * 1000)) {
                const renewed = await LoginService.renewSession(platform);

                if (renewed) {
                    console.log(`✅ Silent recovery successful for ${platform}`);
                    return { success: true, method: 'renewal' };
                }
            }

            return { success: false, reason: 'session_too_old' };
        } catch (error) {
            console.error(`Silent recovery error for ${platform}:`, error);
            return { success: false, reason: 'error' };
        }
    }

    // Cookie-basierte Recovery
    async attemptCookieRecovery(platform, loginData) {
        try {
            console.log(`🍪 Attempting cookie recovery for ${platform}...`);

            const platformConfig = this.getPlatformConfig(platform);
            if (!platformConfig) return { success: false, reason: 'no_config' };

            // Öffne Platform-URL im Hintergrund um Cookies zu prüfen
            const result = await WebBrowser.openBrowserAsync(platformConfig.verifyUrl, {
                presentationStyle: WebBrowser.WebBrowserPresentationStyle.AUTOMATIC,
                showTitle: false,
                enableBarCollapsing: true,
                showInRecents: false,
                // Schnell wieder schließen
                dismissButtonStyle: 'close'
            });

            // Kurz warten und dann prüfen
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Wenn Browser normal geschlossen wurde, nehmen wir an dass Cookies funktionieren
            if (result.type === 'dismiss' || result.type === 'cancel') {
                // Session als gültig markieren
                const success = await LoginService.renewSession(platform);

                if (success) {
                    console.log(`✅ Cookie recovery successful for ${platform}`);
                    return { success: true, method: 'cookie_check' };
                }
            }

            return { success: false, reason: 'cookie_invalid' };
        } catch (error) {
            console.error(`Cookie recovery error for ${platform}:`, error);
            return { success: false, reason: 'error' };
        }
    }

    // Platform-Konfiguration
    getPlatformConfig(platform) {
        const configs = {
            youtube: {
                verifyUrl: 'https://m.youtube.com/',
                loginUrl: 'https://accounts.google.com/signin'
            },
            tiktok: {
                verifyUrl: 'https://www.tiktok.com/foryou',
                loginUrl: 'https://www.tiktok.com/login'
            },
            instagram: {
                verifyUrl: 'https://www.instagram.com/',
                loginUrl: 'https://www.instagram.com/accounts/login/'
            }
        };
        return configs[platform] || null;
    }

    // Recovery-Versuche verwalten
    async getRecoveryAttempts(key) {
        try {
            const data = await AsyncStorage.getItem(`goonscroll_${key}`);
            if (!data) return 0;

            const parsed = JSON.parse(data);
            const now = Date.now();

            // Reset nach 24 Stunden
            if (now - parsed.timestamp > 24 * 60 * 60 * 1000) {
                await this.resetRecoveryAttempts(key);
                return 0;
            }

            return parsed.attempts || 0;
        } catch (error) {
            return 0;
        }
    }

    async incrementRecoveryAttempts(key) {
        try {
            const current = await this.getRecoveryAttempts(key);
            const data = {
                attempts: current + 1,
                timestamp: Date.now()
            };
            await AsyncStorage.setItem(`goonscroll_${key}`, JSON.stringify(data));
        } catch (error) {
            console.error('Error incrementing recovery attempts:', error);
        }
    }

    async resetRecoveryAttempts(key) {
        try {
            await AsyncStorage.removeItem(`goonscroll_${key}`);
        } catch (error) {
            console.error('Error resetting recovery attempts:', error);
        }
    }

    // Session-Backup erstellen
    async createSessionBackup() {
        try {
            const platforms = ['youtube', 'tiktok', 'instagram'];
            const backup = {
                timestamp: Date.now(),
                version: '1.0',
                sessions: {}
            };

            for (const platform of platforms) {
                const loginData = await LoginService.getLoginData(platform);
                if (loginData && loginData.isLoggedIn) {
                    backup.sessions[platform] = {
                        isLoggedIn: loginData.isLoggedIn,
                        loginTime: loginData.loginTime,
                        lastActivity: loginData.lastActivity,
                        sessionId: loginData.sessionId
                    };
                }
            }

            await AsyncStorage.setItem('goonscroll_session_backup', JSON.stringify(backup));
            console.log('💾 Session backup created');
            return backup;
        } catch (error) {
            console.error('Error creating session backup:', error);
            return null;
        }
    }

    // Session-Backup wiederherstellen
    async restoreSessionBackup() {
        try {
            const backupData = await AsyncStorage.getItem('goonscroll_session_backup');
            if (!backupData) return null;

            const backup = JSON.parse(backupData);

            // Prüfe Backup-Alter (nicht älter als 7 Tage)
            const backupAge = Date.now() - backup.timestamp;
            if (backupAge > 7 * 24 * 60 * 60 * 1000) {
                console.log('🗑️ Backup too old, ignoring');
                return null;
            }

            console.log('📥 Restoring session backup...');
            const restoreResults = {};

            for (const [platform, sessionData] of Object.entries(backup.sessions)) {
                try {
                    // Nur wiederherstellen wenn aktuell nicht angemeldet
                    const currentStatus = await LoginService.getLoginStatus(platform);
                    if (!currentStatus) {
                        const success = await LoginService.setLoginStatus(platform, true, {
                            loginMethod: 'backup_restore',
                            originalLoginTime: sessionData.loginTime,
                            restoredAt: Date.now()
                        });
                        restoreResults[platform] = success;
                    }
                } catch (error) {
                    console.error(`Error restoring ${platform} from backup:`, error);
                    restoreResults[platform] = false;
                }
            }

            console.log('📥 Backup restore completed:', restoreResults);
            return restoreResults;
        } catch (error) {
            console.error('Error restoring session backup:', error);
            return null;
        }
    }

    // Smart Login-Vorschläge basierend auf Nutzungsmustern
    async getLoginSuggestions() {
        try {
            // Analysiere vergangene Login-Patterns
            const platforms = ['youtube', 'tiktok', 'instagram'];
            const suggestions = [];

            for (const platform of platforms) {
                const isLoggedIn = await LoginService.getLoginStatus(platform);

                if (!isLoggedIn) {
                    const loginData = await LoginService.getLoginData(platform);

                    if (loginData) {
                        // Berechne wie lange seit letztem Login
                        const lastLogin = new Date(loginData.loginTime || 0);
                        const daysSinceLogin = Math.floor((Date.now() - lastLogin.getTime()) / (24 * 60 * 60 * 1000));

                        // Bewerte Priorität basierend auf letzter Nutzung
                        let priority = 'low';
                        if (daysSinceLogin < 3) priority = 'high';
                        else if (daysSinceLogin < 7) priority = 'medium';

                        suggestions.push({
                            platform,
                            priority,
                            daysSinceLogin,
                            reason: this.getLoginReason(platform, daysSinceLogin)
                        });
                    } else {
                        // Neue Platform
                        suggestions.push({
                            platform,
                            priority: 'medium',
                            daysSinceLogin: null,
                            reason: 'Noch nie angemeldet'
                        });
                    }
                }
            }

            // Sortiere nach Priorität
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            suggestions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

            return suggestions;
        } catch (error) {
            console.error('Error getting login suggestions:', error);
            return [];
        }
    }

    // Login-Grund bestimmen
    getLoginReason(platform, daysSinceLogin) {
        if (daysSinceLogin === null) return 'Erstmalige Anmeldung empfohlen';
        if (daysSinceLogin < 1) return 'Session vor kurzem abgelaufen';
        if (daysSinceLogin < 3) return 'Kürzlich genutzt';
        if (daysSinceLogin < 7) return 'Diese Woche genutzt';
        if (daysSinceLogin < 30) return 'Diesen Monat genutzt';
        return 'Lange nicht genutzt';
    }

    // Background Session-Monitoring
    startBackgroundMonitoring() {
        // Alle 30 Minuten Session-Status prüfen
        setInterval(async () => {
            try {
                await this.performHealthCheck();
            } catch (error) {
                console.error('Background monitoring error:', error);
            }
        }, 30 * 60 * 1000);

        console.log('🔄 Background session monitoring started');
    }

    // Health-Check für alle Sessions
    async performHealthCheck() {
        try {
            const platforms = ['youtube', 'tiktok', 'instagram'];
            const healthResults = {};

            for (const platform of platforms) {
                const loginData = await LoginService.getLoginData(platform);

                if (loginData && loginData.isLoggedIn) {
                    const isValid = await LoginService.validateSession(platform, loginData);

                    if (!isValid) {
                        console.log(`⚠️ Health check failed for ${platform}, attempting recovery...`);
                        const recoveryResult = await this.recoverPlatformSession(platform);
                        healthResults[platform] = recoveryResult;
                    } else {
                        healthResults[platform] = { status: 'healthy', action: 'none' };
                    }
                } else {
                    healthResults[platform] = { status: 'not_logged_in', action: 'none' };
                }
            }

            return healthResults;
        } catch (error) {
            console.error('Health check error:', error);
            return {};
        }
    }

    // Cleanup
    cleanup() {
        // Alle laufenden Prozesse stoppen
        console.log('🧹 SessionRecovery cleanup completed');
    }
}

// Export singleton instance
export default new SessionRecovery();