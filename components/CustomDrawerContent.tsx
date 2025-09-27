import { useAuth } from '@/context/AuthContext';
import { ShadowUtils } from '@/utils/shadowUtils';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CustomDrawerContent = (props: any) => {
    const { user, logout } = useAuth();
    const { navigation } = props;
    const [activeMenu, setActiveMenu] = useState('');
    const [isDarkMode] = useState(false);

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
        <View style={[styles.container, isDarkMode && styles.darkContainer]}>
            <SafeAreaView style={{ flex: 1 }}>
                <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent}>
                    
                    {/* Top Section with Window Controls */}
                    <View style={styles.topSection}>
                        <View style={styles.windowControls}>
                            <View style={[styles.controlDot, styles.redDot]} />
                            <View style={[styles.controlDot, styles.yellowDot]} />
                            <View style={[styles.controlDot, styles.greenDot]} />
                        </View>
                        
                        {/* Logo and App Name */}
                        <View style={styles.logoSection}>
                            <View style={styles.logoContainer}>
                                <View style={styles.logoSquare}>
                                    <Ionicons name="school" size={20} color="#FFFFFF" />
                                </View>
                            </View>
                            <View style={styles.appNameContainer}>
                                <Text style={[styles.appName, isDarkMode && styles.darkText]}>Yottascore</Text>
                            </View>
                        </View>

                    </View>

                    {/* Menu Section */}
                    <View style={styles.menuSection}>
                        <View style={styles.menuItems}>
                            <MenuItem 
                                icon="person-outline" 
                                label="My Profile" 
                                onPress={navigateToProfile}
                                isActive={activeMenu === 'profile'}
                                isDarkMode={isDarkMode}
                                iconColor="#FF4757"
                            />
                            
                            <MenuItem 
                                icon="document-text-outline" 
                                label="My Exams" 
                                onPress={navigateToMyExams}
                                isActive={activeMenu === 'my-exams'}
                                isDarkMode={isDarkMode}
                                iconColor="#2ED573"
                            />
                            
                            <MenuItem 
                                icon="school-outline" 
                                label="Practise" 
                                onPress={navigateToPracticeExam}
                                isActive={activeMenu === 'practice-exam'}
                                isDarkMode={isDarkMode}
                                iconColor="#1E90FF"
                            />
                            
                            <MenuItem 
                                icon="game-controller-outline" 
                                label="Battle Quiz" 
                                onPress={navigateToBattleQuiz}
                                isActive={activeMenu === 'quiz'}
                                isDarkMode={isDarkMode}
                                iconColor="#96CEB4"
                            />
                            
                            <MenuItem 
                                icon="eye-outline" 
                                label="Spy Game" 
                                onPress={navigateToSpyGame}
                                isActive={activeMenu === 'spy-game'}
                                isDarkMode={isDarkMode}
                                iconColor="#F59E0B"
                            />
                            
                            <MenuItem 
                                icon="chatbubbles-outline" 
                                label="Messages" 
                                onPress={navigateToMessages}
                                isActive={activeMenu === 'messages'}
                                isDarkMode={isDarkMode}
                                iconColor="#667eea"
                            />
                            
                            <MenuItem 
                                icon="stats-chart-outline" 
                                label="Leaderboard" 
                                onPress={handleLeaderboardPress}
                                isActive={activeMenu === 'leaderboard'}
                                isDarkMode={isDarkMode}
                                iconColor="#FF6348"
                            />
                            
                                   <MenuItem 
                                       icon="calendar-outline" 
                                       label="Timetable" 
                                       onPress={navigateToTimetable}
                                       isActive={activeMenu === 'timetable'}
                                       isDarkMode={isDarkMode}
                                       iconColor="#9C88FF"
                                   />
                            
                            <MenuItem 
                                icon="person-add-outline" 
                                label="Refer & Earn" 
                                onPress={navigateToRefer}
                                isActive={activeMenu === 'refer'}
                                isDarkMode={isDarkMode}
                                iconColor="#FF9FF3"
                            />
                            
                            <MenuItem 
                                icon="diamond-outline" 
                                label="Membership" 
                                onPress={navigateToMembership}
                                isActive={activeMenu === 'membership'}
                                isDarkMode={isDarkMode}
                                iconColor="#FFD700"
                            />
                            
                            {/* <MenuItem 
                                icon="headset-outline" 
                                label="24/7 Support" 
                                onPress={handleSupportPress}
                                isActive={activeMenu === 'support'}
                                isDarkMode={isDarkMode}
                                iconColor="#54A0FF"
                            /> */}
                        </View>
                    </View>



                    {/* User Profile Section */}
                    <View style={styles.profileSection}>
                        <View style={styles.profileContainer}>
                            <View style={styles.profileImageContainer}>
                                <Image 
                                    source={{ uri: user?.profilePhoto || 'https://via.placeholder.com/40' }}
                                    style={styles.profileImage}
                                />
                            </View>
                            <View style={styles.profileInfo}>
                                <Text style={[styles.profileName, isDarkMode && styles.darkText]}>
                                    {user?.name || 'Asal Design'}
                                </Text>
                            </View>
                            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                                <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
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

                    {/* Privacy Policy and Terms */}
                    <View style={styles.privacySection}>
                        <View style={styles.privacyLinks}>
                            <TouchableOpacity onPress={navigateToPrivacyPolicy}>
                                <Text style={styles.privacyLinkText}>Privacy Policy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={navigateToTerms} style={styles.termsContainer}>
                                <Text style={styles.privacyLinkText}>Terms & Conditions</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                </DrawerContentScrollView>
            </SafeAreaView>
        </View>
    );
};

const MenuItem = ({ icon, label, onPress, isActive, isDarkMode, badge, iconColor }: any) => (
    <TouchableOpacity 
        style={[styles.menuItem, isActive && styles.activeMenuItem, isDarkMode && styles.darkMenuItem]} 
        onPress={onPress}
    >
        <View style={styles.menuItemContent}>
            <View style={[styles.iconWrapper, { backgroundColor: `${iconColor}15` }]}>
                <Ionicons 
                    name={icon} 
                    size={20} 
                    color={isActive ? "#FFFFFF" : iconColor} 
                />
            </View>
            <Text style={[
                styles.menuItemText, 
                isActive && styles.activeMenuItemText,
                isDarkMode && styles.darkMenuItemText
            ]}>
                {label}
            </Text>
            {badge && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                </View>
            )}
        </View>
    </TouchableOpacity>
);


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    darkContainer: {
        backgroundColor: '#0F172A',
    },
    scrollContent: {
        paddingTop: 0,
        flexGrow: 1,
    },
    
    // Top Section
    topSection: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 24,
        marginBottom: 12,
        ...ShadowUtils.noShadow(),
    },
    windowControls: {
        flexDirection: 'row',
        marginBottom: 24,
        paddingLeft: 6,
    },
    controlDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
        ...ShadowUtils.noShadow(),
    },
    redDot: {
        backgroundColor: '#FF5F56',
    },
    yellowDot: {
        backgroundColor: '#FFBD2E',
    },
    greenDot: {
        backgroundColor: '#27CA3F',
    },
    logoSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoContainer: {
        marginRight: 16,
    },
    logoSquare: {
        width: 40,
        height: 40,
        backgroundColor: '#6366F1',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        ...ShadowUtils.noShadow(),
    },
    appNameContainer: {
        flex: 1,
    },
    appName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1E293B',
        letterSpacing: 0.5,
        fontFamily: 'System',
    },
    darkText: {
        color: '#F8FAFC',
    },

    // Menu Section
    menuSection: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 12,
        marginBottom: 12,
        borderRadius: 16,
        paddingVertical: 20,
        ...ShadowUtils.noShadow(),
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 16,
        paddingHorizontal: 20,
        letterSpacing: 0.2,
        fontFamily: 'System',
    },
    menuItems: {
        paddingHorizontal: 12,
    },
    menuItem: {
        marginHorizontal: 8,
        marginVertical: 3,
        borderRadius: 12,
        ...ShadowUtils.noShadow(),
    },
    darkMenuItem: {
        backgroundColor: '#334155',
    },
    activeMenuItem: {
        backgroundColor: '#6366F1',
        ...ShadowUtils.noShadow(),
    },
    menuItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    menuItemText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
        marginLeft: 14,
        flex: 1,
        letterSpacing: 0.2,
        fontFamily: 'System',
    },
    darkMenuItemText: {
        color: '#F1F5F9',
    },
    activeMenuItemText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    badge: {
        backgroundColor: '#EF4444',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        minWidth: 24,
        alignItems: 'center',
        ...ShadowUtils.noShadow(),
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
        fontFamily: 'System',
    },


    // Social Media Section
    socialSection: {
        backgroundColor: '#F8FAFC',
        marginHorizontal: 12,
        marginBottom: 12,
        borderRadius: 16,
        paddingVertical: 20,
        paddingHorizontal: 20,
        ...ShadowUtils.noShadow(),
    },
    socialTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 16,
        textAlign: 'center',
        letterSpacing: 0.3,
        fontFamily: 'System',
    },
    socialIcons: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
    },
    socialIcon: {
        padding: 6,
    },
    facebookIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1877F2',
        justifyContent: 'center',
        alignItems: 'center',
        ...ShadowUtils.noShadow(),
    },
    youtubeIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FF0000',
        justifyContent: 'center',
        alignItems: 'center',
        ...ShadowUtils.noShadow(),
    },
    linkedinIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#0077B5',
        justifyContent: 'center',
        alignItems: 'center',
        ...ShadowUtils.noShadow(),
    },

    // Privacy Section
    privacySection: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    privacyLinks: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    termsContainer: {
        marginTop: 8,
    },
    privacyLinkText: {
        color: '#475569',
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 0.2,
        fontFamily: 'System',
    },

    // Profile Section
    profileSection: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 12,
        marginBottom: 12,
        borderRadius: 16,
        paddingVertical: 20,
        paddingHorizontal: 20,
        ...ShadowUtils.noShadow(),
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImageContainer: {
        marginRight: 16,
    },
    profileImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#F1F5F9',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
        letterSpacing: 0.1,
        fontFamily: 'System',
    },
    profileEmail: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
        fontFamily: 'System',
    },
    darkSubText: {
        color: '#CBD5E1',
    },
    logoutButton: {
        padding: 10,
        backgroundColor: '#FF4757',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
});

export default CustomDrawerContent; 