import { AppColors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 65;
const ICON_SIZE = 24;

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
    const { routes, index: activeIndex } = state;

    // Filter to only the routes we expect, to prevent duplicates
    const expectedRoutes = ['home', 'exam', 'quiz', 'social', 'profile'];
    const filteredRoutes = routes.filter((r: any) => expectedRoutes.includes(r.name));

    const onTabPress = (route: any, isFocused: boolean) => {
        const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
        });

        if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
        }
    };

    return (
        <View style={styles.tabBarContainer}>
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBackground}
            />

            <View style={styles.tabBarItemsContainer}>
                {filteredRoutes.map((route: any) => {
                    const { options } = descriptors[route.key];
                    // Check if the current route in the filtered list is the active one
                    const isFocused = routes[activeIndex].key === route.key;

                    let iconName: any = 'home';
                    let label = 'Home';

                    switch (route.name) {
                        case 'home':
                            iconName = isFocused ? 'home' : 'home-outline';
                            label = 'Home';
                            break;
                        case 'exam':
                            iconName = isFocused ? 'book' : 'book-outline';
                            label = 'Exam';
                            break;
                        case 'quiz':
                            iconName = 'qr-code';
                            label = 'Quiz';
                            break;
                        case 'social':
                            iconName = isFocused ? 'people' : 'people-outline';
                            label = 'Social';
                            break;
                        case 'profile':
                            iconName = isFocused ? 'person' : 'person-outline';
                            label = 'Profile';
                            break;
                    }
                    
                    const isCenter = route.name === 'quiz';

                    if (isCenter) {
                        return (
                            <TouchableOpacity
                                key={route.key}
                                onPress={() => onTabPress(route, isFocused)}
                                style={styles.centerTab}
                            >
                                <Ionicons name={iconName} size={ICON_SIZE * 1.5} color={AppColors.white} />
                                <Text style={styles.centerLabel}>{label}</Text>
                            </TouchableOpacity>
                        );
                    }

                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={() => onTabPress(route, isFocused)}
                            style={styles.tab}
                        >
                            <Ionicons 
                                name={iconName} 
                                size={ICON_SIZE} 
                                color={isFocused ? AppColors.white : 'rgba(255, 255, 255, 0.7)'}
                            />
                            <Text style={[styles.label, { color: isFocused ? AppColors.white : 'rgba(255, 255, 255, 0.7)' }]}>
                                {label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        bottom: 0,
        width: width,
        height: TAB_BAR_HEIGHT,
        alignItems: 'center',
    },
    tabBarItemsContainer: {
        flexDirection: 'row',
        width: '100%',
        height: '100%',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 10,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 12,
        marginTop: 4,
    },
    centerTab: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#FF6B35',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 35, // This moves the button up
        borderWidth: 5,
        borderColor: AppColors.white,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 3.5,
    },
    centerLabel: {
        fontSize: 12,
        color: AppColors.white,
        marginTop: 4,
    },
    gradientBackground: {
        position: 'absolute',
        bottom: 0,
        width: width,
        height: TAB_BAR_HEIGHT,
        borderRadius: 20,
    },
});

export default CustomTabBar; 