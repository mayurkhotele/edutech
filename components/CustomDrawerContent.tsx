import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CustomDrawerContent = (props: any) => {
    const { user, logout } = useAuth();
    const { navigation } = props;

    const navigateToTimetable = () => {
        navigation.navigate('(tabs)', { screen: 'timetable' });
        navigation.closeDrawer();
    };

    const navigateToRefer = () => {
        navigation.navigate('(tabs)', { screen: 'refer' });
        navigation.closeDrawer();
    };

    const navigateToProfile = () => {
        navigation.navigate('(tabs)', { screen: 'profile' });
        navigation.closeDrawer();
    };

    const navigateToMyExams = () => {
        navigation.navigate('(tabs)', { screen: 'my-exams' });
        navigation.closeDrawer();
    };

    const navigateToPracticeExam = () => {
        navigation.navigate('practice-exam');
        navigation.closeDrawer();
    };

    const navigateToBattleQuiz = () => {
        navigation.navigate('(tabs)', { screen: 'battle-room' });
        navigation.closeDrawer();
    };

    const navigateToPrivacyPolicy = () => {
        navigation.navigate('privacy-policy');
        navigation.closeDrawer();
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Yottascore</Text>
                    </View>

                    {/* Main Menu Items */}
                    <View style={styles.menuContainer}>
                        <DrawerItem icon="person-outline" label="My Profile" onPress={navigateToProfile} />
                        <DrawerItem icon="document-text-outline" label="My Exams" onPress={navigateToMyExams} />
                        <DrawerItem icon="school-outline" label="Practice Exam" onPress={navigateToPracticeExam} />
                        <DrawerItem icon="game-controller-outline" label="Battle Quiz" onPress={navigateToBattleQuiz} />
                        <DrawerItem icon="stats-chart-outline" label="Leaderboard" />
                        <DrawerItem icon="calendar-outline" label="My Timetable" onPress={navigateToTimetable} />
                        <DrawerItem icon="person-add-outline" label="Refer & Earn" onPress={navigateToRefer} />
                        <DrawerItem icon="headset-outline" label="24/7 Support" onPress={() => navigation.navigate('(tabs)', { screen: 'support-tickets' })} />
                        <DrawerItem icon="shield-checkmark-outline" label="Privacy Policy" onPress={navigateToPrivacyPolicy} />
                        <DrawerItem icon="log-out-outline" label="Logout" onPress={logout} />
                    </View>

                    {/* User Profile Section */}
                    <View style={styles.profileSection}>
                        <View style={styles.profileContainer}>
                            {user?.profilePhoto ? (
                                <Image
                                    source={{ uri: user.profilePhoto }}
                                    style={styles.profileImage}
                                />
                            ) : (
                                <View style={styles.profileImagePlaceholder}>
                                    <Text style={styles.profileImageInitials}>
                                        {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.profileInfo}>
                                <Text style={styles.profileName}>{user?.name || 'MAYUR KJ'}</Text>
                                <Text style={styles.profileEmail}>{user?.email || 'mayur@example.com'}</Text>
                            </View>
                        </View>
                    </View>
                </DrawerContentScrollView>
            </SafeAreaView>
        </View>
    );
};

const DrawerItem = ({ icon, label, value, onPress }: { icon: any; label: string; value?: string; onPress?: () => void }) => (
    <TouchableOpacity style={styles.drawerItem} onPress={onPress}>
        <View style={styles.drawerItemContent}>
            <Ionicons name={icon} size={24} color="#666" />
            <Text style={styles.drawerLabel}>{label}</Text>
            {value && <Text style={styles.drawerValue}>{value}</Text>}
        </View>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingVertical: 15,
        paddingHorizontal: 10,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    searchContainer: {
        paddingHorizontal: 10,
        paddingBottom: 10,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 14,
    },
    menuContainer: {
        paddingVertical: 5,
    },
    drawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        marginHorizontal: 10,
        marginVertical: 2,
        borderRadius: 12,
        backgroundColor: '#f8f9fa',
    },
    drawerItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    drawerLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginLeft: 15,
        flex: 1,
    },
    drawerValue: {
        fontSize: 16,
        color: '#007bff',
        fontWeight: 'bold',
    },
    profileSection: {
        marginHorizontal: 10,
        marginBottom: 15,
        marginTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 15,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 15,
    },
    profileImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    profileImagePlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#007bff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    profileImageInitials: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    profileEmail: {
        fontSize: 14,
        color: '#666',
    },
    profileSettings: {
        padding: 5,
    },
});

export default CustomDrawerContent; 