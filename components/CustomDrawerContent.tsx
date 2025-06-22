import { AppColors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView } from '@react-navigation/drawer';
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

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
                <View style={styles.profileContainer}>
                    <Image
                        source={{ uri: user?.profilePicture || 'https://via.placeholder.com/80' }} // Use real image or placeholder
                        style={styles.profileImage}
                    />
                    {/* Display the user's name from context, fallback to 'Guest' */}
                    <Text style={styles.profileName}>{user?.name || 'MAYUR KJ'}</Text>
                    <Text style={styles.profileHandle}>{user?.handle || '@BB11A01833224'}</Text>
                    <View style={styles.followContainer}>
                        <View style={styles.followBox}>
                            <Text style={styles.followCount}>{user?.followers || 0}</Text>
                            <Text style={styles.followText}>Followers</Text>
                        </View>
                        <View style={styles.followBox}>
                            <Text style={styles.followCount}>{user?.following || 0}</Text>
                            <Text style={styles.followText}>Following</Text>
                        </View>
                    </View>
                </View>

                {/* Custom Drawer Items */}
                <View style={styles.menuContainer}>
                    <DrawerItem icon="people-outline" label="Find Guru" />
                    <DrawerItem icon="person-outline" label="My Profile" />
                    <DrawerItem icon="stats-chart-outline" label="Leaderboard" />
                    <DrawerItem icon="wallet-outline" label="My Balance" value="₹0.00" onPress={navigateToWallet} />
                    <DrawerItem icon="person-add-outline" label="Invite Friends" />
                    <DrawerItem icon="information-circle-outline" label="My Info & Setting" />
                    <DrawerItem icon="star-outline" label="BB Pass" />
                    <DrawerItem icon="document-text-outline" label="Point System" />
                    <DrawerItem icon="log-out-outline" label="Logout" onPress={logout} />
                </View>

                <View style={styles.donateContainer}>
                    <Text style={styles.donateTitle}>Donate</Text>
                    <Text style={styles.donateSubtitle}>Indian Army</Text>
                    <TouchableOpacity style={styles.donateButton}>
                        <Text style={styles.donateButtonText}>Donate Now</Text>
                    </TouchableOpacity>
                    <Text style={styles.versionText}>v7.2</Text>
                </View>
            </DrawerContentScrollView>
        </SafeAreaView>
    );
};

const DrawerItem = ({ icon, label, value, onPress }: { icon: any; label: string; value?: string; onPress?: () => void }) => (
    <TouchableOpacity style={styles.drawerItem} onPress={onPress}>
        <Ionicons name={icon} size={24} color={AppColors.primary} />
        <Text style={styles.drawerLabel}>{label}</Text>
        {value && <Text style={styles.drawerValue}>{value}</Text>}
    </TouchableOpacity>
);


const styles = StyleSheet.create({
    profileContainer: {
        paddingTop: 5,
        paddingBottom: 15,
        paddingHorizontal: 20,
        backgroundColor: AppColors.white,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.lightGrey,
        alignItems: 'center',
    },
    profileImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 8,
    },
    profileName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    profileHandle: {
        color: AppColors.grey,
        marginBottom: 15,
    },
    followContainer: {
        flexDirection: 'row',
    },
    followBox: {
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginHorizontal: 5,
    },
    followCount: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    followText: {
        color: AppColors.grey,
    },
    menuContainer: {
        paddingVertical: 10,
    },
    drawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    drawerLabel: {
        marginLeft: 20,
        fontSize: 16,
        flex: 1,
        fontWeight: '500',
        color: '#333',
    },
    drawerValue: {
        fontSize: 16,
        color: AppColors.primary,
        fontWeight: 'bold',
    },
    donateContainer: {
        padding: 20,
        backgroundColor: AppColors.primary,
        marginTop: 20,
    },
    donateTitle: {
        color: AppColors.white,
        fontSize: 16,
    },
    donateSubtitle: {
        color: AppColors.white,
        fontSize: 24,
        fontWeight: 'bold',
    },
    donateButton: {
        backgroundColor: 'green',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
    },
    donateButtonText: {
        color: AppColors.white,
        fontWeight: 'bold',
    },
    versionText: {
        color: AppColors.lightGrey,
        textAlign: 'right',
        marginTop: 5,
        fontSize: 12,
    }
});

export default CustomDrawerContent; 