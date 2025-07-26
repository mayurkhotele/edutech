import { AppColors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// import client from '../../api/client';
import { apiFetchAuth } from '@/constants/api';

const WalletScreen = () => {
    const { user, logout } = useAuth();
    const [walletData, setWalletData] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    const [refreshing, setRefreshing] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [depositModalVisible, setDepositModalVisible] = React.useState(false);
    const [depositAmount, setDepositAmount] = React.useState('');
    const [depositLoading, setDepositLoading] = React.useState(false);

    const fetchWalletData = React.useCallback(async () => {
        if (!user?.token) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await apiFetchAuth('/student/wallet', user.token);
            if (response.ok) {
                setWalletData(response.data);
                setError(null);
            } else {
                 setError(response.data.message || 'Failed to fetch wallet data.');
            }
        } catch (err: any) {
            console.error('Error fetching wallet:', err);
            if (err.status === 401) {
                setError('Session expired. Please log in again.');
                logout();
            } else {
                setError(err.data?.message || 'Failed to fetch wallet data.');
            }
        } finally {
            setLoading(false);
        }
    }, [user, logout]);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        try {
            await fetchWalletData();
        } catch (error) {
            console.error('Error refreshing wallet:', error);
        } finally {
            setRefreshing(false);
        }
    }, [fetchWalletData]);

    React.useEffect(() => {
        fetchWalletData();
    }, [fetchWalletData]);

    const handleDeposit = async () => {
        if (!depositAmount || parseFloat(depositAmount) <= 0 || !user?.token) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
            return;
        }

        setDepositLoading(true);
        try {
            const response = await apiFetchAuth('/student/wallet/deposit', user.token, {
                method: 'POST',
                body: { amount: parseFloat(depositAmount) }
            });
            
            if (response.ok) {
                Alert.alert('Success', `Successfully deposited ₹${depositAmount}`, [
                    {
                        text: 'OK',
                        onPress: () => {
                            setDepositModalVisible(false);
                            setDepositAmount('');
                            fetchWalletData(); // Refresh wallet data
                        }
                    }
                ]);
            } else {
                 Alert.alert('Error', response.data.message || 'Failed to deposit amount.');
            }
        } catch (err: any) {
            console.error('Error depositing:', err);
            if (err.status === 401) {
                Alert.alert('Session Expired', 'Please log in again.');
                logout();
            } else {
                Alert.alert('Error', err.data?.message || 'Failed to deposit amount.');
            }
        } finally {
            setDepositLoading(false);
        }
    };

    if (loading) {
        return <ActivityIndicator size="large" color={AppColors.primary} style={styles.centered} />;
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Error: {error}</Text>
            </View>
        );
    }

    return (
        <>
            <ScrollView 
                style={styles.container}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[AppColors.primary]}
                        tintColor={AppColors.primary}
                        title="Pull to refresh"
                        titleColor={AppColors.primary}
                        progressBackgroundColor="#f4f4f4"
                    />
                }
            >
                {/* Balance Card */}
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.balanceCard}
                >
                    <Text style={styles.balanceTitle}>Available Balance</Text>
                    <Text style={styles.balanceAmount}>₹{walletData?.balance?.toFixed(2) || '0.00'}</Text>
                    <View style={styles.offerBanner}>
                        <Ionicons name="bulb-outline" size={20} color="#FFD700" />
                        <Text style={styles.offerText}>By Deposit Offer, You have <Text style={styles.savedAmount}>SAVED: ₹0.00</Text></Text>
                    </View>
                    <View style={styles.alertIcon}>
                        <Ionicons name="warning" size={24} color="#FFD700" />
                    </View>
                </LinearGradient>

                {/* Money Details */}
                <View style={styles.card}>
                    <MoneyDetailRow 
                        icon="server-outline" 
                        title="Deposit" 
                        amount={walletData?.balance?.toFixed(2) || '0.00'} 
                        action="Add Cash" 
                        onAction={() => setDepositModalVisible(true)} 
                    />
                    <MoneyDetailRow icon="trophy-outline" title="Winnings" amount="0.00" action="Withdraw" onAction={() => {}} isWithdraw />
                    <MoneyDetailRow icon="wallet-outline" title="Real Cash" amount="0.00" />
                </View>

                {/* Options List */}
                <View style={styles.card}>
                    <OptionRow icon="list-outline" title="My Transactions" />
                    <OptionRow icon="card-outline" title="My KYC Details" />
                    <OptionRow icon="newspaper-outline" title="Withdraw History" />
                    <OptionRow icon="cloud-download-outline" title="Statement Download" />
                </View>
            </ScrollView>

            {/* Deposit Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={depositModalVisible}
                onRequestClose={() => setDepositModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Cash</Text>
                            <TouchableOpacity 
                                onPress={() => setDepositModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color={AppColors.darkGrey} />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Enter Amount (₹)</Text>
                            <TextInput
                                style={styles.amountInput}
                                value={depositAmount}
                                onChangeText={setDepositAmount}
                                placeholder="0.00"
                                keyboardType="numeric"
                                placeholderTextColor={AppColors.grey}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.depositButton, depositLoading && styles.depositButtonDisabled]}
                            onPress={handleDeposit}
                            disabled={depositLoading}
                        >
                            {depositLoading ? (
                                <ActivityIndicator size="small" color={AppColors.white} />
                            ) : (
                                <Text style={styles.depositButtonText}>Deposit</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const MoneyDetailRow = ({ icon, title, amount, action, onAction, isWithdraw = false }: any) => (
    <View style={styles.moneyRow}>
        <Ionicons name={icon} size={24} color={AppColors.primary} style={styles.moneyIcon} />
        <View style={{ flex: 1 }}>
            <Text style={styles.moneyTitle}>{title}</Text>
            <Text style={styles.moneyAmount}>₹{amount}</Text>
        </View>
        {action && (
            <TouchableOpacity onPress={onAction} style={isWithdraw ? styles.withdrawButton : styles.addButton}>
                <Text style={isWithdraw ? styles.withdrawButtonText : styles.addButtonText}>{action}</Text>
            </TouchableOpacity>
        )}
    </View>
);

const OptionRow = ({ icon, title }: any) => (
    <TouchableOpacity style={styles.optionRow}>
        <Ionicons name={icon} size={24} color={AppColors.primary} style={styles.optionIcon} />
        <Text style={styles.optionTitle}>{title}</Text>
        <Ionicons name="chevron-forward-outline" size={24} color={AppColors.grey} />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: 'red', fontSize: 16 },
    container: {
        flex: 1,
        backgroundColor: '#f4f4f4',
    },
    balanceCard: {
        padding: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        marginBottom: 10,
    },
    balanceTitle: {
        color: AppColors.lightGrey,
        fontSize: 16,
    },
    balanceAmount: {
        color: AppColors.white,
        fontSize: 40,
        fontWeight: 'bold',
    },
    offerBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
    },
    offerText: {
        color: AppColors.white,
        marginLeft: 10,
    },
    savedAmount: {
        fontWeight: 'bold',
        borderWidth: 1,
        borderColor: AppColors.white,
        paddingHorizontal: 5,
        borderRadius: 4,
    },
    alertIcon: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: 5,
        borderRadius: 15,
    },
    card: {
        backgroundColor: AppColors.white,
        borderRadius: 10,
        marginHorizontal: 10,
        marginBottom: 10,
        padding: 15,
    },
    moneyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    moneyIcon: {
        backgroundColor: '#eef5ff',
        padding: 10,
        borderRadius: 8,
        marginRight: 15,
    },
    moneyTitle: {
        fontSize: 16,
        color: AppColors.darkGrey,
    },
    moneyAmount: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    addButton: {
        backgroundColor: AppColors.primary,
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    addButtonText: {
        color: AppColors.white,
        fontWeight: 'bold',
    },
    withdrawButton: {
        backgroundColor: 'green',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    withdrawButtonText: {
        color: AppColors.white,
        fontWeight: 'bold',
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
    },
    optionIcon: {
        backgroundColor: '#eef5ff',
        padding: 8,
        borderRadius: 8,
        marginRight: 15,
    },
    optionTitle: {
        flex: 1,
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: AppColors.white,
        padding: 20,
        borderRadius: 20,
        width: '80%',
        alignItems: 'center',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 5,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    amountInput: {
        width: '100%',
        padding: 10,
        borderWidth: 1,
        borderColor: AppColors.grey,
        borderRadius: 5,
    },
    depositButton: {
        backgroundColor: AppColors.primary,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    depositButtonDisabled: {
        backgroundColor: AppColors.grey,
    },
    depositButtonText: {
        color: AppColors.white,
        fontWeight: 'bold',
    },
});

export default WalletScreen; 