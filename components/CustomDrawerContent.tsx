import { AppColors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CustomDrawerContent = (props: any) => {
    const { user, logout } = useAuth();
    const { navigation } = props;

    const navigateToWallet = () => {
        navigation.navigate('(tabs)', { screen: 'wallet' });
        navigation.closeDrawer();
    };

    const navigateToTimetable = () => {
        navigation.navigate('(tabs)', { screen: 'timetable' });
        navigation.closeDrawer();
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
                    {/* Profile Section with Gradient */}
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.profileGradient}
                    >
                        <View style={styles.profileContainer}>
                            <Image
                                source={{ uri: user?.profilePicture || 'https://via.placeholder.com/80' }}
                                style={styles.profileImage}
                            />
                            <Text style={styles.profileName}>{user?.name || 'MAYUR KJ'}</Text>
                            <Text style={styles.profileHandle}>{user?.handle || '@BB11A01833224'}</Text>
                            
                            {/* Simple Stats */}
                            <View style={styles.statsContainer}>
                                <View style={styles.statBox}>
                                    <Text style={styles.statNumber}>12</Text>
                                    <Text style={styles.statLabel}>Exams</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <Text style={styles.statNumber}>85%</Text>
                                    <Text style={styles.statLabel}>Score</Text>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>

                    {/* Menu Items */}
                    <View style={styles.menuContainer}>
                        <DrawerItem icon="people-outline" label="Find Guru" />
                        <DrawerItem icon="person-outline" label="My Profile" />
                        <DrawerItem icon="stats-chart-outline" label="Leaderboard" />
                        <DrawerItem icon="calendar-outline" label="My Timetable" onPress={navigateToTimetable} />
                        <DrawerItem icon="wallet-outline" label="My Balance" value="₹0.00" onPress={navigateToWallet} />
                        <DrawerItem icon="person-add-outline" label="Invite Friends" />
                        <DrawerItem icon="information-circle-outline" label="Settings" />
                        <DrawerItem icon="star-outline" label="BB Pass" />
                        <DrawerItem icon="document-text-outline" label="Point System" />
                        <DrawerItem icon="log-out-outline" label="Logout" onPress={logout} />
                    </View>

                    {/* Follow Us Section with Gradient */}
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.followGradient}
                    >
                        <View style={styles.followContainer}>
                            <Text style={styles.followTitle}>Follow Us</Text>
                            <View style={styles.socialIconsContainer}>
                                <TouchableOpacity style={styles.socialIcon}>
                                    <Ionicons name="logo-instagram" size={24} color="#E4405F" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.socialIcon}>
                                    <Ionicons name="logo-facebook" size={24} color="#1877F2" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.socialIcon}>
                                    <Ionicons name="logo-youtube" size={24} color="#FF0000" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.socialIcon}>
                                    <Ionicons name="logo-twitter" size={24} color="#1DA1F2" />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.versionText}>v7.2</Text>
                        </View>
                    </LinearGradient>
                </DrawerContentScrollView>
            </SafeAreaView>
        </View>
    );
};

const DrawerItem = ({ icon, label, value, onPress }: { icon: any; label: string; value?: string; onPress?: () => void }) => (
    <TouchableOpacity style={styles.drawerItem} onPress={onPress}>
        <Ionicons name={icon} size={24} color={AppColors.white} />
        <Text style={styles.drawerLabel}>{label}</Text>
        {value && <Text style={styles.drawerValue}>{value}</Text>}
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.white,
    },
    profileGradient: {
        padding: 15,
        borderRadius: 15,
        marginHorizontal: 10,
        marginBottom: 15,
        marginTop: 10,
    },
    profileContainer: {
        alignItems: 'center',
    },
    profileImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        marginBottom: 10,
    },
    profileName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.white,
        marginBottom: 5,
    },
    profileHandle: {
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 15,
        fontSize: 14,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    statBox: {
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 10,
        minWidth: 60,
    },
    statNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: AppColors.white,
    },
    statLabel: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 11,
        marginTop: 2,
    },
    menuContainer: {
        paddingVertical: 5,
    },
    drawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        marginHorizontal: 10,
        marginVertical: 1,
        borderRadius: 10,
        backgroundColor: AppColors.lightGrey,
    },
    drawerLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: AppColors.darkGrey,
        marginLeft: 15,
        flex: 1,
    },
    drawerValue: {
        fontSize: 15,
        color: AppColors.primary,
        fontWeight: 'bold',
    },
    followGradient: {
        padding: 15,
        borderRadius: 15,
        marginHorizontal: 10,
        marginBottom: 20,
    },
    followContainer: {
        alignItems: 'center',
    },
    followTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: AppColors.white,
        marginBottom: 10,
    },
    socialIconsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 10,
    },
    socialIcon: {
        padding: 8,
        borderRadius: 15,
        backgroundColor: AppColors.white,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    versionText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 11,
    }
});

export default CustomDrawerContent; 