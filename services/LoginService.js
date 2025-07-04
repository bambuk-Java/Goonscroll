import AsyncStorage from '@react-native-async-storage/async-storage';

class LoginService {
    constructor() {
        this.loginStates = {
            youtube: false,
            tiktok: false,
            instagram: false
        };
        this.listeners = [];
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

    // Einzelnen Login-Status prüfen
    async getLoginStatus(platform) {
        try {
            const loginData = await AsyncStorage.getItem(`login_${platform}`);
            if (!loginData) return false;

            const parsed = JSON.parse(loginData);

            // Prüfe ob Login noch gültig ist (optional: Ablaufzeit)
            const loginAge = Date.now() - new Date(parsed.loginTime).getTime();
            const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 Tage

            if (loginAge > maxAge) {
                console.log(`⏰ Login for ${platform} expired`);
                await this.logout(platform);
                return false;
            }

            return parsed.isLoggedIn || false;
        } catch (error) {
            console.error(`Error getting login status for ${platform}:`, error);
            return false;
        }
    }

    // Login-Daten abrufen
    async getLoginData(platform) {
        try {
            const loginData = await AsyncStorage.getItem(`login_${platform}`);
            return loginData ? JSON.parse(loginData) : null;
        } catch (error) {
            console.error(`Error getting login data for ${platform}:`, error);
            return null;
        }
    }

    // Login setzen
    async setLoginStatus(platform, isLoggedIn, additionalData = {}) {
        try {
            const loginInfo = {
                platform,
                isLoggedIn,
                loginTime: new Date().toISOString(),
                lastActivity: new Date().toISOString(),
                sessionData: additionalData
            };

            await AsyncStorage.setItem(`login_${platform}`, JSON.stringify(loginInfo));
            this.loginStates[platform] = isLoggedIn;

            console.log(`✅ Login status updated: ${platform} = ${isLoggedIn}`);
            this.notifyListeners();
            return true;
        } catch (error) {
            console.error(`Error setting login status for ${platform}:`, error);
            return false;
        }
    }

    // Logout
    async logout(platform) {
        try {
            await AsyncStorage.removeItem(`login_${platform}`);
            this.loginStates[platform] = false;

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

    // Login-Aktivität aktualisieren
    async updateActivity(platform) {
        try {
            const loginData = await this.getLoginData(platform);
            if (loginData) {
                loginData.lastActivity = new Date().toISOString();
                await AsyncStorage.setItem(`login_${platform}`, JSON.stringify(loginData));
            }
        } catch (error) {
            console.error(`Error updating activity for ${platform}:`, error);
        }
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

    // Login-Statistiken
    async getLoginStats() {
        try {
            const platforms = ['youtube', 'tiktok', 'instagram'];
            const stats = {};

            for (const platform of platforms) {
                const loginData = await this.getLoginData(platform);
                if (loginData) {
                    stats[platform] = {
                        isLoggedIn: loginData.isLoggedIn,
                        loginTime: loginData.loginTime,
                        lastActivity: loginData.lastActivity,
                        sessionAge: Date.now() - new Date(loginData.loginTime).getTime()
                    };
                } else {
                    stats[platform] = {
                        isLoggedIn: false,
                        loginTime: null,
                        lastActivity: null,
                        sessionAge: 0
                    };
                }
            }

            return stats;
        } catch (error) {
            console.error('Error getting login stats:', error);
            return {};
        }
    }

    // Login-Daten exportieren (für Backup)
    async exportLoginData() {
        try {
            const platforms = ['youtube', 'tiktok', 'instagram'];
            const exportData = {};

            for (const platform of platforms) {
                const loginData = await this.getLoginData(platform);
                if (loginData) {
                    // Entferne sensible Daten für Export
                    exportData[platform] = {
                        isLoggedIn: loginData.isLoggedIn,
                        loginTime: loginData.loginTime,
                        platform: loginData.platform
                        // sessionData wird nicht exportiert (könnte sensible Daten enthalten)
                    };
                }
            }

            return {
                exportDate: new Date().toISOString(),
                loginData: exportData,
                totalLogins: Object.keys(exportData).length
            };
        } catch (error) {
            console.error('Error exporting login data:', error);
            return null;
        }
    }

    // Debug: Alle Login-Daten anzeigen
    async debugLoginData() {
        try {
            const stats = await this.getLoginStats();
            console.log('🔍 Login Debug Data:');
            console.log('Current states:', this.loginStates);
            console.log('Detailed stats:', stats);
            console.log('Logged in count:', this.getLoggedInCount());
            console.log('All logged in:', this.areAllLoggedIn());
            return stats;
        } catch (error) {
            console.error('Error debugging login data:', error);
            return null;
        }
    }
}

// Export singleton instance
export default new LoginService();