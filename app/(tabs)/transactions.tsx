import { apiFetchAuth } from '@/constants/api';
import { AppColors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
}

export default function TransactionsScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalBalance, setTotalBalance] = useState(0);

  const fetchTransactions = async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiFetchAuth('/student/wallet', user.token);
      if (response.ok) {
        setTransactions(response.data.transactions || []);
        setTotalBalance(response.data.balance || 0);
        setError(null);
      } else {
        setError(response.data.message || 'Failed to fetch transactions.');
      }
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      if (err.status === 401) {
        setError('Session expired. Please log in again.');
        logout();
      } else {
        setError(err.data?.message || 'Failed to fetch transactions.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchTransactions();
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'BATTLE_QUIZ_ENTRY':
        return 'Battle Quiz Entry';
      case 'DEPOSIT':
        return 'Deposit';
      case 'WITHDRAWAL':
        return 'Withdrawal';
      case 'WINNING':
        return 'Winning';
      default:
        return type.replace(/_/g, ' ');
    }
  };

  const formatTransactionDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'BATTLE_QUIZ_ENTRY':
        return 'game-controller';
      case 'DEPOSIT':
        return 'add-circle';
      case 'WITHDRAWAL':
        return 'remove-circle';
      case 'WINNING':
        return 'trophy';
      default:
        return 'card';
    }
  };

  const getTransactionColor = (type: string, amount: number) => {
    if (amount > 0) return '#4CAF50'; // Green for positive
    if (amount < 0) return '#F44336'; // Red for negative
    return '#FF9800'; // Orange for neutral
  };

  const getTransactionBackground = (type: string, amount: number) => {
    if (amount > 0) return 'rgba(76, 175, 80, 0.1)'; // Light green
    if (amount < 0) return 'rgba(244, 67, 54, 0.1)'; // Light red
    return 'rgba(255, 152, 0, 0.1)'; // Light orange
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'SUCCESS':
        return '#4CAF50';
      case 'PENDING':
        return '#FF9800';
      case 'FAILED':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const renderTransactionItem = ({ item, index }: { item: Transaction; index: number }) => (
    <View style={styles.transactionCard}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
        style={styles.transactionGradient}
      >
        <View style={styles.transactionHeader}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: getTransactionBackground(item.type, item.amount) }
          ]}>
            <Ionicons 
              name={getTransactionIcon(item.type) as any} 
              size={24} 
              color={getTransactionColor(item.type, item.amount)} 
            />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionType}>{formatTransactionType(item.type)}</Text>
            <Text style={styles.transactionDate}>{formatTransactionDate(item.createdAt)}</Text>
          </View>
          <View style={styles.amountContainer}>
            <Text style={[
              styles.amountText,
              { color: getTransactionColor(item.type, item.amount) }
            ]}>
              {item.amount > 0 ? '+' : ''}₹{Math.abs(item.amount).toFixed(2)}
            </Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) }
            ]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.balanceSection}>
          <View style={styles.balanceCard}>
            <View style={styles.balanceRow}>
              <View style={styles.balanceInfo}>
                <Text style={styles.balanceLabel}>Balance</Text>
                <Text style={styles.balanceAmount}>₹{totalBalance.toFixed(2)}</Text>
              </View>
              <View style={styles.balanceIcon}>
                <Ionicons name="wallet" size={24} color="#fff" />
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="trending-up" size={14} color="#4CAF50" />
                <Text style={styles.statText}>₹0.00</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="trending-down" size={14} color="#F44336" />
                <Text style={styles.statText}>₹0.00</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="receipt" size={14} color="#fff" />
                <Text style={styles.statText}>{transactions.length}</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.errorContent}>
          <Ionicons name="alert-circle" size={64} color="#F44336" />
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchTransactions}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {renderHeader()}
      
      <FlatList
        data={transactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[AppColors.primary]}
            tintColor={AppColors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={80} color="#9E9E9E" />
            <Text style={styles.emptyTitle}>No Transactions Yet</Text>
            <Text style={styles.emptySubtitle}>
              Your transaction history will appear here once you start using the app
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    height: 120,
  },
  headerGradient: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  balanceSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  balanceCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statItem: {
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  transactionCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  transactionCard: {
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  transactionGradient: {
    borderRadius: 16,
    padding: 16,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: -width * 0.05,
    left: -width * 0.1,
  },
  circle2: {
    position: 'absolute',
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    bottom: height * 0.2,
    right: width * 0.2,
  },
  circle3: {
    position: 'absolute',
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    top: height * 0.4,
    left: width * 0.4,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10,
  },
}); 