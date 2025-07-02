// Simple in-memory storage as fallback
let memoryStorage = {};

const SimpleStorage = {
    async getItem(key) {
        return memoryStorage[key] || null;
    },

    async setItem(key, value) {
        memoryStorage[key] = value;
        return Promise.resolve();
    },

    async getAllKeys() {
        return Object.keys(memoryStorage);
    },

    async multiRemove(keys) {
        keys.forEach(key => delete memoryStorage[key]);
        return Promise.resolve();
    }
};

class TrackingService {
    constructor() {
        this.isTracking = false;
        this.currentSession = null;
        this.sessionStartTime = null;
        this.currentPlatform = null;
        this.isPowerMode = false;
        this.powerModeStartTime = null;
    }

    // PowerMode tracking - counts for all three platforms
    async startPowerModeSession() {
        if (this.isTracking) {
            await this.endSession(); // End any existing session
        }

        this.isPowerMode = true;
        this.isTracking = true;
        this.powerModeStartTime = new Date();

        console.log(`🔥 Started PowerMode tracking at ${this.powerModeStartTime.toLocaleTimeString()}`);
    }

    async endPowerModeSession() {
        if (!this.isPowerMode || !this.powerModeStartTime) return;

        const endTime = new Date();
        const totalDuration = Math.round((endTime - this.powerModeStartTime) / 1000); // in seconds

        if (totalDuration > 5) { // Only track sessions longer than 5 seconds
            // Split time equally across all three platforms
            const durationPerPlatform = Math.round(totalDuration / 3);

            // Create sessions for all three platforms
            const platforms = ['youtube', 'tiktok', 'instagram'];

            for (const platform of platforms) {
                const sessionData = {
                    platform,
                    startTime: this.powerModeStartTime,
                    endTime,
                    duration: durationPerPlatform,
                    date: this.getDateString(this.powerModeStartTime),
                    isPowerMode: true
                };

                await this.saveSession(sessionData);
            }

            console.log(`🔥 Ended PowerMode: ${totalDuration}s total (${durationPerPlatform}s per platform)`);
        }

        this.isPowerMode = false;
        this.isTracking = false;
        this.powerModeStartTime = null;
        this.currentSession = null;
    }

    // Start tracking session
    async startSession(platform) {
        // Skip if we're in PowerMode (handled separately)
        if (this.isPowerMode) return;

        if (this.isTracking) {
            await this.endSession(); // End previous session
        }

        this.isTracking = true;
        this.currentPlatform = platform;
        this.sessionStartTime = new Date();

        this.currentSession = {
            platform,
            startTime: this.sessionStartTime,
            date: this.getDateString(this.sessionStartTime)
        };

        console.log(`🟢 Started tracking ${platform} at ${this.sessionStartTime.toLocaleTimeString()}`);
    }

    // End tracking session
    async endSession() {
        // Skip if we're in PowerMode (handled separately)
        if (this.isPowerMode) return;

        if (!this.isTracking || !this.currentSession) return;

        const endTime = new Date();
        const sessionDuration = Math.round((endTime - this.sessionStartTime) / 1000); // in seconds

        const sessionData = {
            ...this.currentSession,
            endTime,
            duration: sessionDuration
        };

        await this.saveSession(sessionData);

        console.log(`🔴 Ended tracking ${this.currentPlatform}, duration: ${sessionDuration}s`);

        this.isTracking = false;
        this.currentSession = null;
        this.sessionStartTime = null;
        this.currentPlatform = null;
    }

    // Switch platform (end current, start new)
    async switchPlatform(newPlatform) {
        // Skip if we're in PowerMode (handled separately)
        if (this.isPowerMode) return;

        if (this.currentPlatform === newPlatform) return;

        await this.endSession();
        await this.startSession(newPlatform);
    }

    // Save session to Storage
    async saveSession(sessionData) {
        try {
            const dateKey = sessionData.date;
            const storageKey = `analytics_${dateKey}`;

            // Get existing data for this date
            const existingData = await SimpleStorage.getItem(storageKey);
            const dayData = existingData ? JSON.parse(existingData) : {
                date: dateKey,
                totalTime: 0,
                videosWatched: 0,
                sharesCount: 0,
                sessions: [],
                platforms: {
                    youtube: { time: 0, videos: 0 },
                    tiktok: { time: 0, videos: 0 },
                    instagram: { time: 0, videos: 0 }
                }
            };

            // Add new session
            dayData.sessions.push(sessionData);
            dayData.totalTime += sessionData.duration;
            dayData.platforms[sessionData.platform].time += sessionData.duration;

            // Estimate videos watched (rough estimate: 1 video per 30 seconds)
            const videosThisSession = Math.max(1, Math.round(sessionData.duration / 30));
            dayData.videosWatched += videosThisSession;
            dayData.platforms[sessionData.platform].videos += videosThisSession;

            // Save updated data
            await SimpleStorage.setItem(storageKey, JSON.stringify(dayData));

            console.log(`💾 Saved session data for ${dateKey}:`, sessionData);
        } catch (error) {
            console.error('Error saving session:', error);
        }
    }

    // Track share action
    async trackShare(platform) {
        try {
            const today = this.getDateString(new Date());
            const storageKey = `analytics_${today}`;

            const existingData = await SimpleStorage.getItem(storageKey);
            const dayData = existingData ? JSON.parse(existingData) : {
                date: today,
                totalTime: 0,
                videosWatched: 0,
                sharesCount: 0,
                sessions: [],
                platforms: {
                    youtube: { time: 0, videos: 0 },
                    tiktok: { time: 0, videos: 0 },
                    instagram: { time: 0, videos: 0 }
                }
            };

            dayData.sharesCount += 1;

            await SimpleStorage.setItem(storageKey, JSON.stringify(dayData));
            console.log(`📤 Tracked share for ${platform}`);
        } catch (error) {
            console.error('Error tracking share:', error);
        }
    }

    // Get analytics for specific date
    async getAnalytics(date) {
        try {
            const storageKey = `analytics_${date}`;
            const data = await SimpleStorage.getItem(storageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting analytics:', error);
            return null;
        }
    }

    // Get analytics for date range
    async getAnalyticsRange(startDate, endDate) {
        try {
            const dateRange = this.getDateRange(startDate, endDate);
            const analyticsPromises = dateRange.map(date => this.getAnalytics(date));
            const analyticsArray = await Promise.all(analyticsPromises);

            // Combine data
            const combinedData = {
                totalTime: 0,
                videosWatched: 0,
                sharesCount: 0,
                platforms: {
                    youtube: { time: 0, videos: 0 },
                    tiktok: { time: 0, videos: 0 },
                    instagram: { time: 0, videos: 0 }
                },
                dailyData: []
            };

            analyticsArray.forEach(dayData => {
                if (dayData) {
                    combinedData.totalTime += dayData.totalTime;
                    combinedData.videosWatched += dayData.videosWatched;
                    combinedData.sharesCount += dayData.sharesCount;

                    Object.keys(combinedData.platforms).forEach(platform => {
                        combinedData.platforms[platform].time += dayData.platforms[platform].time;
                        combinedData.platforms[platform].videos += dayData.platforms[platform].videos;
                    });

                    combinedData.dailyData.push(dayData);
                }
            });

            return combinedData;
        } catch (error) {
            console.error('Error getting analytics range:', error);
            return null;
        }
    }

    // Get today's analytics
    async getTodayAnalytics() {
        const today = this.getDateString(new Date());
        return await this.getAnalytics(today);
    }

    // Get this week's analytics
    async getWeekAnalytics() {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 6); // Last 7 days

        return await this.getAnalyticsRange(this.getDateString(weekStart), this.getDateString(today));
    }

    // Helper: Get date string in YYYY-MM-DD format
    getDateString(date) {
        return date.toISOString().split('T')[0];
    }

    // Helper: Get array of dates between start and end
    getDateRange(startDate, endDate) {
        const dates = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        while (start <= end) {
            dates.push(this.getDateString(start));
            start.setDate(start.getDate() + 1);
        }

        return dates;
    }

    // Format time for display
    formatTime(seconds) {
        if (seconds < 60) {
            return `${seconds}s`;
        } else if (seconds < 3600) {
            const minutes = Math.round(seconds / 60);
            return `${minutes}m`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.round((seconds % 3600) / 60);
            return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
        }
    }

    // Clear all analytics data (for testing/reset)
    async clearAllData() {
        try {
            const keys = await SimpleStorage.getAllKeys();
            const analyticsKeys = keys.filter(key => key.startsWith('analytics_'));
            await SimpleStorage.multiRemove(analyticsKeys);
            console.log('🗑️ Cleared all analytics data');
        } catch (error) {
            console.error('Error clearing data:', error);
        }
    }

    // Get app usage stats
    async getUsageStats() {
        const today = await this.getTodayAnalytics();
        const week = await this.getWeekAnalytics();

        return {
            today: today || {
                totalTime: 0,
                videosWatched: 0,
                sharesCount: 0,
                platforms: {
                    youtube: { time: 0, videos: 0 },
                    tiktok: { time: 0, videos: 0 },
                    instagram: { time: 0, videos: 0 }
                }
            },
            week: week || {
                totalTime: 0,
                videosWatched: 0,
                sharesCount: 0,
                platforms: {
                    youtube: { time: 0, videos: 0 },
                    tiktok: { time: 0, videos: 0 },
                    instagram: { time: 0, videos: 0 }
                },
                dailyData: []
            }
        };
    }
}

// Export singleton instance
export default new TrackingService();