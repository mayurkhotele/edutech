import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CustomDrawerContent = (props: any) => {
    const { user, logout } = useAuth();
    const { navigation } = props;
    const [activeMenu, setActiveMenu] = useState('');

    const navigateToTimetable = () => {
        setActiveMenu('timetable');
        navigation.navigate('(tabs)', { screen: 'timetable' });
        navigation.closeDrawer();
    };

    const navigateToRefer = () => {
        setActiveMenu('refer');
        navigation.navigate('(tabs)', { screen: 'refer' });
        navigation.closeDrawer();
    };

    const navigateToProfile = () => {
        setActiveMenu('profile');
        navigation.navigate('(tabs)', { screen: 'profile' });
        navigation.closeDrawer();
    };

    const navigateToMyExams = () => {
        setActiveMenu('my-exams');
        navigation.navigate('(tabs)', { screen: 'my-exams' });
        navigation.closeDrawer();
    };

    const navigateToPracticeExam = () => {
        setActiveMenu('practice-exam');
        navigation.navigate('(tabs)', { screen: 'practice-exam' });
        navigation.closeDrawer();
    };

    const navigateToBattleQuiz = () => {
        setActiveMenu('quiz');
        navigation.navigate('(tabs)', { screen: 'quiz' });
        navigation.closeDrawer();
    };

    const navigateToSpyGame = () => {
        setActiveMenu('spy-game');
        navigation.navigate('(tabs)', { screen: 'spy-game' });
        navigation.closeDrawer();
    };

    const navigateToMessages = () => {
        setActiveMenu('messages');
        navigation.navigate('(tabs)', { screen: 'messages' });
        navigation.closeDrawer();
    };

    const navigateToPrivacyPolicy = () => {
        setActiveMenu('privacy-policy');
        navigation.navigate('privacy-policy');
        navigation.closeDrawer();
    };

    const navigateToTerms = () => {
        setActiveMenu('terms');
        // Reuse the same screen for now; can be split later if needed
        navigation.navigate('privacy-policy');
        navigation.closeDrawer();
    };

    const navigateToMembership = () => {
        setActiveMenu('membership');
        navigation.navigate('membership');
        navigation.closeDrawer();
    };

    const handleSettingsPress = () => {
        setActiveMenu('settings');
        // Add navigation logic for settings if needed
    };

    const handleLeaderboardPress = () => {
        setActiveMenu('leaderboard');
        navigation.navigate('(tabs)', { screen: 'weekly-leaderboard' });
        navigation.closeDrawer();
    };

    const handleSupportPress = () => {
        setActiveMenu('support');
        navigation.navigate('(tabs)', { screen: 'support-tickets' });
        navigation.closeDrawer();
    };

    return (
        <LinearGradient
            colors={['#f8fafc', '#e2e8f0', '#cbd5e1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <SafeAreaView style={{ flex: 1 }}>
                <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0, flexGrow: 1 }}>
                    {/* Enhanced Header */}
                    <LinearGradient
                        colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.headerGradient}
                    >
                        <View style={styles.header}>
                            <View style={styles.logoContainer}>
                                <View style={styles.logoCircle}>
                                    <Ionicons name="school" size={28} color="#FFFFFF" />
                                </View>
                                <View style={styles.titleContainer}>
                                    <Text style={styles.headerTitle}>YOTTASCORE</Text>
                                    <Text style={styles.headerSubtitle}>Your Learning Partner</Text>
                                </View>
                            </View>
                        </View>
                        {/* Enhanced Background Pattern */}
                        <View style={styles.headerPattern}>
                            <View style={styles.patternCircle1} />
                            <View style={styles.patternCircle2} />
                            <View style={styles.patternCircle3} />
                        </View>
                    </LinearGradient>

                    {/* User Profile Section removed as requested */}

                    {/* Enhanced Main Menu Items */}
                    <View style={styles.menuContainer}>
                        <DrawerItem icon="person-outline" label="My Profile" onPress={navigateToProfile} isActive={activeMenu === 'profile'} iconColor="#FF4757" />
                        <DrawerItem icon="document-text-outline" label="My Exams" onPress={navigateToMyExams} isActive={activeMenu === 'my-exams'} iconColor="#2ED573" />
                        <DrawerItem icon="school-outline" label="Practice Exam" onPress={navigateToPracticeExam} isActive={activeMenu === 'practice-exam'} iconColor="#1E90FF" />
                        <DrawerItem icon="game-controller-outline" label="Battle Quiz" onPress={navigateToBattleQuiz} isActive={activeMenu === 'quiz'} iconColor="#96CEB4" />
                        <DrawerItem icon="eye-outline" label="Spy Game" onPress={navigateToSpyGame} isActive={activeMenu === 'spy-game'} iconColor="#F59E0B" />
                        <DrawerItem icon="chatbubbles-outline" label="Messages" onPress={navigateToMessages} isActive={activeMenu === 'messages'} iconColor="#667eea" />
                        <DrawerItem icon="stats-chart-outline" label="Leaderboard" onPress={handleLeaderboardPress} isActive={activeMenu === 'leaderboard'} iconColor="#FF6348" />
                        <DrawerItem icon="calendar-outline" label="My Timetable" onPress={navigateToTimetable} isActive={activeMenu === 'timetable'} iconColor="#9C88FF" />
                        <DrawerItem icon="person-add-outline" label="Refer & Earn" onPress={navigateToRefer} isActive={activeMenu === 'refer'} iconColor="#FF9FF3" />
                        <DrawerItem icon="diamond-outline" label="Membership" onPress={navigateToMembership} isActive={activeMenu === 'membership'} iconColor="#FFD700" />
                        <DrawerItem icon="headset-outline" label="24/7 Support" onPress={handleSupportPress} isActive={activeMenu === 'support'} iconColor="#54A0FF" />
                    </View>

                    {/* Logout Section - Fixed at Bottom */}
                    <View style={styles.logoutSection}>
                        <View style={styles.logoutContainer}>
                            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                                <View style={styles.logoutContent}>
                                    <View style={styles.logoutIconContainer}>
                                        <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
                                    </View>
                                    <Text style={styles.logoutLabel}>Logout</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Social Media Section */}
                    <View style={styles.socialSection}>
                        <Text style={styles.socialTitle}>Follow Us</Text>
                        <View style={styles.socialIcons}>
                            <TouchableOpacity style={styles.socialIcon}>
                                <View style={styles.facebookIconContainer}>
                                    <Ionicons name="logo-facebook" size={20} color="#FFFFFF" />
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialIcon}>
                                <View style={styles.youtubeIconContainer}>
                                    <Ionicons name="logo-youtube" size={20} color="#FFFFFF" />
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialIcon}>
                                <View style={styles.linkedinIconContainer}>
                                    <Ionicons name="logo-linkedin" size={20} color="#FFFFFF" />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                    {/* Privacy Policy moved below Follow Us - simple text link */}
                    <View style={{ paddingHorizontal: 16, paddingBottom: 6 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                            <TouchableOpacity onPress={navigateToPrivacyPolicy}>
                                <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>Privacy Policy</Text>
                            </TouchableOpacity>
                            <Text style={{ color: '#9CA3AF', marginHorizontal: 8 }}>|</Text>
                            <TouchableOpacity onPress={navigateToTerms}>
                                <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>Terms & Conditions</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </DrawerContentScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const DrawerItem = ({ icon, label, value, onPress, isActive, iconColor }: { icon: any; label: string; value?: string; onPress?: () => void; isActive?: boolean; iconColor?: string }) => (
    <TouchableOpacity style={[styles.drawerItem, isActive && styles.activeDrawerItem]} onPress={onPress}>
        <LinearGradient
            colors={isActive ? ['rgba(139, 92, 246, 0.1)', 'rgba(168, 85, 247, 0.05)'] : ['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.6)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.drawerItemGradient}
        >
            <View style={styles.drawerItemContent}>
                <View style={[styles.iconContainer, isActive && styles.activeIconContainer, { backgroundColor: isActive ? '#8B5CF6' : `${iconColor}40` }]}>
                    <Ionicons name={icon} size={20} color={isActive ? "#FFFFFF" : iconColor || "#6B7280"} />
                </View>
                <Text style={[styles.drawerLabel, isActive && styles.activeDrawerLabel]}>{label}</Text>
                {value && <Text style={styles.drawerValue}>{value}</Text>}
            </View>
        </LinearGradient>
        {isActive && (
            <LinearGradient
                colors={['#8B5CF6', '#A855F7', '#C084FC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.activeIndicator}
            />
        )}
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerGradient: {
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 16,
        marginHorizontal: 8,
        marginVertical: 8,
    },
    headerPattern: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.1,
    },
    patternCircle1: {
        position: 'absolute',
        top: 15,
        right: 25,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    patternCircle2: {
        position: 'absolute',
        bottom: 30,
        left: 15,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    patternCircle3: {
        position: 'absolute',
        top: 40,
        left: 35,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    patternCircle4: {
        position: 'absolute',
        top: 60,
        right: 5,
        width: 15,
        height: 15,
        borderRadius: 7.5,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    patternDots: {
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        bottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    header: {
        alignItems: 'center',
        zIndex: 1,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    titleContainer: {
        marginLeft: 10,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },
    profileSection: {
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(139, 92, 246, 0.2)',
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        padding: 12,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
    profileImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#8B5CF6',
    },
    profileImagePlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    profileImageInitials: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 1,
    },
    profileEmail: {
        fontSize: 12,
        color: '#6B7280',
    },
    menuContainer: {
        paddingVertical: 4,
        flex: 1,
    },
    drawerItem: {
        position: 'relative',
        marginHorizontal: 6,
        marginVertical: 1,
        borderRadius: 8,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    drawerItemGradient: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    activeDrawerItem: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    drawerItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    iconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
        elevation: 1,
    },
    activeIconContainer: {
        backgroundColor: '#8B5CF6',
        borderColor: '#8B5CF6',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    drawerLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        flex: 1,
        letterSpacing: 0.3,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },
    activeDrawerLabel: {
        color: '#8B5CF6',
        fontWeight: '700',
        textShadowColor: 'rgba(139, 92, 246, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    drawerValue: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    activeIndicator: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 3,
        borderTopLeftRadius: 2,
        borderBottomLeftRadius: 2,
    },
    logoutSection: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginTop: 'auto',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    logoutContainer: {
        borderRadius: 6,
        backgroundColor: '#EF4444',
        borderWidth: 1,
        borderColor: '#DC2626',
        alignSelf: 'center',
        width: '60%',
    },
    logoutButton: {
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    logoutContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoutIconContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    logoutLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#FFFFFF',
    },
    socialSection: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 12,
        marginHorizontal: 8,
        marginBottom: 8,
    },
    socialTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
        textAlign: 'center',
    },
    socialIcons: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
    },
    socialIcon: {
        padding: 4,
    },
    facebookIconContainer: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#1877F2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    youtubeIconContainer: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#FF0000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    linkedinIconContainer: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#0077B5',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default CustomDrawerContent; 