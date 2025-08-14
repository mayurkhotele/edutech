import { AppColors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import CustomDrawerContent from '../components/CustomDrawerContent';
import ErrorBoundary from '../components/ErrorBoundary';
import SplashScreen from '../components/SplashScreen';
import { apiFetchAuth } from '../constants/api';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { RefreshProvider } from '../context/RefreshContext';
import { ToastProvider } from '../context/ToastContext';
import '../utils/errorHandler'; // Initialize global error handler
// import { WebSocketProvider } from '../context/WebSocketContext';

// Header Right Component
const HeaderRight = ({ navigation }: any) => {
    const { user } = useAuth();
    const [walletAmount, setWalletAmount] = React.useState<string>('0.00');

    React.useEffect(() => {
        const fetchWalletAmount = async () => {
            if (!user?.token) return;
            
            try {
                const response = await apiFetchAuth('/student/wallet', user.token);
                if (response.ok && response.data.balance) {
                    setWalletAmount(response.data.balance.toFixed(2));
                }
            } catch (error) {
                console.error('Error fetching wallet amount:', error);
            }
        };

        fetchWalletAmount();
    }, [user]);

    return (
        <View style={styles.headerRight}>
            {/* Notification Icon */}
            <TouchableOpacity style={styles.notificationContainer}>
                <Ionicons name="notifications-outline" size={24} color={AppColors.white} />
                <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>3</Text>
                </View>
            </TouchableOpacity>
            
            {/* Wallet Amount */}
            <TouchableOpacity 
                style={styles.walletContainer}
                onPress={() => navigation.navigate('(tabs)', { screen: 'wallet' })}
            >
                <Ionicons name="wallet-outline" size={20} color={AppColors.white} />
                <Text style={styles.walletAmount}>₹{walletAmount}</Text>
            </TouchableOpacity>
        </View>
    );
};

function RootNavigator() {
    const { user } = useAuth();

    // If the user is not logged in, show the authentication screens.
    if (!user) {
        return (
            <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="register" options={{ headerShown: false }} />
            </Stack>
        );
    }
    
    // If the user is logged in, show the main app with a drawer.
    return (
        <Drawer
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={({ navigation }) => ({
                headerShown: true, // Show the header
                headerStyle: {
                    backgroundColor: 'transparent', // Make background transparent for gradient
                },
                headerTintColor: AppColors.white,
                headerBackground: () => (
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ flex: 1 }}
                    />
                ),
                headerLeft: () => (
                    <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={{ marginLeft: 15 }}>
                        <Ionicons name="menu" size={24} color="white" />
                    </TouchableOpacity>
                ),
                headerRight: () => <HeaderRight navigation={navigation} />,
                drawerStyle: {
                    width: 250, // Set the width of the drawer
                },
            })}
        >
            <Drawer.Screen
                name="(tabs)"
                options={{
                  title: '', // Remove the title
                }}
            />
        </Drawer>
    );
}

const styles = StyleSheet.create({
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
    },
    walletContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        marginLeft: 10,
    },
    walletAmount: {
        color: AppColors.white,
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    notificationContainer: {
        position: 'relative',
    },
    notificationBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#FF4444',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationBadgeText: {
        color: AppColors.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
});

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const colorScheme = useColorScheme();
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <AuthProvider>
      <RefreshProvider>
        <ToastProvider>
          <ErrorBoundary>
            <RootNavigator />
          </ErrorBoundary>
        </ToastProvider>
      </RefreshProvider>
    </AuthProvider>
  );
}
