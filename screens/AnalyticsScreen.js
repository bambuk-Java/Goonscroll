import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Animated,
    RefreshControl,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import TrackingService from './TrackingService';

const { width } = Dimensions.get('window');

const AnalyticsScreen = ({ navigation }) => {
    const [selectedPeriod, setSelectedPeriod] = useState('heute');
    const [analyticsData, setAnalyticsData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [animatedValues] = useState({
        youtube: new Animated.Value(0),
        tiktok: new Animated.Value(0),
        instagram: new Animated.Value(0),
    });

    // Load real analytics data
    const loadAnalytics = async () => {
        setIsLoading(true);
        try {
            const stats = await TrackingService.getUsageStats();

            // Process data for display
            const processedData = {
                heute: {
                    totalTime: TrackingService.formatTime(stats.today.totalTime),
                    totalTimeSeconds: stats.today.totalTime,
                    videosWatched: stats.today.videosWatched,
                    sharesCount: stats.today.sharesCount,
                    averageSession: stats.today.totalTime > 0 ?
                        TrackingService.formatTime(Math.round(stats.today.totalTime / Math.max(1, stats.today.videosWatched))) : '0s',
                    platformStats: {
                        youtube: {
                            percentage: stats.today.totalTime > 0 ? Math.round((stats.today.platforms.youtube.time / stats.today.totalTime) * 100) : 0,
                            time: TrackingService.formatTime(stats.today.platforms.youtube.time),
                            videos: stats.today.platforms.youtube.videos,
                            color: '#FF0000'
                        },
                        tiktok: {
                            percentage: stats.today.totalTime > 0 ? Math.round((stats.today.platforms.tiktok.time / stats.today.totalTime) * 100) : 0,
                            time: TrackingService.formatTime(stats.today.platforms.tiktok.time),
                            videos: stats.today.platforms.tiktok.videos,
                            color: '#000000'
                        },
                        instagram: {
                            percentage: stats.today.totalTime > 0 ? Math.round((stats.today.platforms.instagram.time / stats.today.totalTime) * 100) : 0,
                            time: TrackingService.formatTime(stats.today.platforms.instagram.time),
                            videos: stats.today.platforms.instagram.videos,
                            color: '#E4405F'
                        }
                    },
                    weeklyData: generateWeeklyData(stats.week.dailyData)
                },
                woche: {
                    totalTime: TrackingService.formatTime(stats.week.totalTime),
                    totalTimeSeconds: stats.week.totalTime,
                    videosWatched: stats.week.videosWatched,
                    sharesCount: stats.week.sharesCount,
                    averageSession: stats.week.totalTime > 0 ?
                        TrackingService.formatTime(Math.round(stats.week.totalTime / Math.max(1, stats.week.videosWatched))) : '0s',
                    platformStats: {
                        youtube: {
                            percentage: stats.week.totalTime > 0 ? Math.round((stats.week.platforms.youtube.time / stats.week.totalTime) * 100) : 0,
                            time: TrackingService.formatTime(stats.week.platforms.youtube.time),
                            videos: stats.week.platforms.youtube.videos,
                            color: '#FF0000'
                        },
                        tiktok: {
                            percentage: stats.week.totalTime > 0 ? Math.round((stats.week.platforms.tiktok.time / stats.week.totalTime) * 100) : 0,
                            time: TrackingService.formatTime(stats.week.platforms.tiktok.time),
                            videos: stats.week.platforms.tiktok.videos,
                            color: '#000000'
                        },
                        instagram: {
                            percentage: stats.week.totalTime > 0 ? Math.round((stats.week.platforms.instagram.time / stats.week.totalTime) * 100) : 0,
                            time: TrackingService.formatTime(stats.week.platforms.instagram.time),
                            videos: stats.week.platforms.instagram.videos,
                            color: '#E4405F'
                        }
                    }
                }
            };

            setAnalyticsData(processedData);
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
        setIsLoading(false);
    };

    // Generate weekly data for chart
    const generateWeeklyData = (dailyData) => {
        const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
        const today = new Date();
        const weekData = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = TrackingService.getDateString(date);

            const dayData = dailyData?.find(d => d.date === dateString);
            const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1]; // Adjust for Monday start

            weekData.push({
                day: dayName,
                minutes: dayData ? Math.round(dayData.totalTime / 60) : 0
            });
        }

        return weekData;
    };

    useEffect(() => {
        loadAnalytics();
    }, []);

    // Load data when period changes
    useEffect(() => {
        if (analyticsData) {
            const currentData = analyticsData[selectedPeriod];
            if (currentData) {
                // Animate bars
                const animations = Object.entries(currentData.platformStats).map(([platform, data]) =>
                    Animated.timing(animatedValues[platform], {
                        toValue: data.percentage,
                        duration: 1000,
                        delay: platform === 'youtube' ? 0 : platform === 'tiktok' ? 200 : 400,
                        useNativeDriver: false,
                    })
                );

                Animated.parallel(animations).start();
            }
        }
    }, [selectedPeriod, analyticsData]);

    if (isLoading || !analyticsData) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="dark" />
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Lade Analytics...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const currentData = analyticsData[selectedPeriod];

    const StatCard = ({ title, value, subtitle, icon, color = '#3B82F6' }) => (
        <View style={[styles.statCard, { borderLeftColor: color }]}>
            <View style={styles.statHeader}>
                <Text style={styles.statIcon}>{icon}</Text>
                <Text style={styles.statTitle}>{title}</Text>
            </View>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
    );

    const PlatformBar = ({ platform, data }) => {
        const animatedWidth = animatedValues[platform].interpolate({
            inputRange: [0, 100],
            outputRange: ['0%', '100%'],
        });

        return (
            <View style={styles.platformBarContainer}>
                <View style={styles.platformBarHeader}>
                    <View style={styles.platformInfo}>
                        <View style={[styles.platformDot, { backgroundColor: data.color }]} />
                        <Text style={styles.platformName}>
                            {platform === 'youtube' ? 'YouTube' : platform === 'tiktok' ? 'TikTok' : 'Instagram'}
                        </Text>
                    </View>
                    <Text style={styles.platformPercentage}>{data.percentage}%</Text>
                </View>

                <View style={styles.platformBarBackground}>
                    <Animated.View
                        style={[
                            styles.platformBarFill,
                            { backgroundColor: data.color, width: animatedWidth }
                        ]}
                    />
                </View>

                <View style={styles.platformStats}>
                    <Text style={styles.platformStatText}>{data.time} • {data.videos} Videos</Text>
                </View>
            </View>
        );
    };

    const WeeklyChart = () => {
        const maxMinutes = Math.max(...currentData.weeklyData.map(d => d.minutes));

        return (
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Wöchentliche Aktivität</Text>
                <View style={styles.chart}>
                    {currentData.weeklyData.map((day, index) => {
                        const height = (day.minutes / maxMinutes) * 100;
                        return (
                            <View key={day.day} style={styles.chartBar}>
                                <View style={styles.chartBarContainer}>
                                    <View
                                        style={[
                                            styles.chartBarFill,
                                            {
                                                height: `${height}%`,
                                                backgroundColor: '#3B82F6'
                                            }
                                        ]}
                                    />
                                </View>
                                <Text style={styles.chartBarLabel}>{day.day}</Text>
                                <Text style={styles.chartBarValue}>{day.minutes}m</Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

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
                        <Image
                            source={require('../assets/SchweinBild.png')}
                            style={styles.pigImage}
                            resizeMode="cover"
                        />
                        <Text style={styles.appTitle}>Analytics</Text>
                    </View>
                </View>
            </View>

            {/* Period Selector */}
            <View style={styles.periodSelector}>
                {['heute', 'woche'].map((period) => (
                    <TouchableOpacity
                        key={period}
                        style={[
                            styles.periodButton,
                            selectedPeriod === period && styles.periodButtonActive
                        ]}
                        onPress={() => setSelectedPeriod(period)}
                    >
                        <Text style={[
                            styles.periodButtonText,
                            selectedPeriod === period && styles.periodButtonTextActive
                        ]}>
                            {period === 'heute' ? 'Heute' : 'Diese Woche'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={loadAnalytics} />
                }
            >
                {/* Overview Stats */}
                <View style={styles.statsGrid}>
                    <StatCard
                        title="Angesehen"
                        value={currentData.totalTime}
                        subtitle="Gesamtzeit"
                        icon="⏱️"
                        color="#10B981"
                    />
                    <StatCard
                        title="Videos"
                        value={currentData.videosWatched}
                        subtitle="Angeschaut"
                        icon="📺"
                        color="#3B82F6"
                    />
                    <StatCard
                        title="Geteilt"
                        value={currentData.sharesCount}
                        subtitle="Videos"
                        icon="📤"
                        color="#8B5CF6"
                    />
                    <StatCard
                        title="Session"
                        value={currentData.averageSession}
                        subtitle="Durchschnitt"
                        icon="⚡"
                        color="#F59E0B"
                    />
                </View>

                {/* Platform Distribution */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Plattform-Verteilung</Text>
                    <View style={styles.platformBars}>
                        {Object.entries(currentData.platformStats).map(([platform, data]) => (
                            <PlatformBar key={platform} platform={platform} data={data} />
                        ))}
                    </View>
                </View>

                {/* Weekly Chart */}
                {selectedPeriod === 'heute' && <WeeklyChart />}

                {/* Quick Insights */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Insights</Text>
                    <View style={styles.insightsContainer}>
                        <View style={styles.insightCard}>
                            <Text style={styles.insightIcon}>🔥</Text>
                            <View style={styles.insightContent}>
                                <Text style={styles.insightTitle}>Top Plattform</Text>
                                <Text style={styles.insightText}>
                                    {Object.entries(currentData.platformStats)
                                        .sort(([, a], [, b]) => b.percentage - a.percentage)[0]?.[0] === 'youtube' ? 'YouTube' :
                                        Object.entries(currentData.platformStats)
                                            .sort(([, a], [, b]) => b.percentage - a.percentage)[0]?.[0] === 'tiktok' ? 'TikTok' : 'Instagram'} führt mit {Object.entries(currentData.platformStats)
                                                .sort(([, a], [, b]) => b.percentage - a.percentage)[0]?.[1]?.percentage || 0}%
                                </Text>
                            </View>
                        </View>
                        <View style={styles.insightCard}>
                            <Text style={styles.insightIcon}>⭐</Text>
                            <View style={styles.insightContent}>
                                <Text style={styles.insightTitle}>Aktivität</Text>
                                <Text style={styles.insightText}>
                                    {currentData.totalTimeSeconds > 0 ?
                                        `${currentData.videosWatched} Videos in ${currentData.totalTime}` :
                                        'Noch keine Aktivität heute'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.insightCard}>
                            <Text style={styles.insightIcon}>📈</Text>
                            <View style={styles.insightContent}>
                                <Text style={styles.insightTitle}>Shares</Text>
                                <Text style={styles.insightText}>
                                    {currentData.sharesCount > 0 ?
                                        `${currentData.sharesCount} Videos geteilt` :
                                        'Noch nichts geteilt'}
                                </Text>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#6B7280',
    },
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
    periodSelector: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginVertical: 16,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 4,
    },
    periodButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
    },
    periodButtonActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    periodButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
    },
    periodButtonTextActive: {
        color: '#374151',
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        width: (width - 44) / 2,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    statTitle: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statSubtitle: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
    },
    platformBars: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    platformBarContainer: {
        marginBottom: 16,
    },
    platformBarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    platformInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    platformDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    platformName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    platformPercentage: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
    },
    platformBarBackground: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 6,
    },
    platformBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    platformStats: {
        alignItems: 'flex-start',
    },
    platformStatText: {
        fontSize: 12,
        color: '#6B7280',
    },
    chartContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
    },
    chart: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 120,
    },
    chartBar: {
        flex: 1,
        alignItems: 'center',
    },
    chartBarContainer: {
        height: 80,
        width: 20,
        backgroundColor: '#E5E7EB',
        borderRadius: 10,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    chartBarFill: {
        width: '100%',
        borderRadius: 10,
    },
    chartBarLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
        fontWeight: '500',
    },
    chartBarValue: {
        fontSize: 10,
        color: '#9CA3AF',
        marginTop: 2,
    },
    insightCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    insightIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    insightContent: {
        flex: 1,
    },
    insightTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 2,
    },
    insightText: {
        fontSize: 12,
        color: '#6B7280',
    },
    insightsContainer: {
        gap: 12,
    },
});

export default AnalyticsScreen;