import { apiFetchAuth } from '@/constants/api';
import { AppColors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ExamCard = ({ exam, navigation }: any) => {
    const router = useRouter();
    const { user } = useAuth();
    const [remainingTime, setRemainingTime] = useState('');
    const [showInstructionsModal, setShowInstructionsModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [instructions, setInstructions] = useState<string[] | null>(null);
    const [instructionsLoading, setInstructionsLoading] = useState(false);
    const [liveExamTitle, setLiveExamTitle] = useState('');
    const [declarationChecked, setDeclarationChecked] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
    const [walletLoading, setWalletLoading] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);

    // Fetch wallet balance
    const fetchWalletBalance = async () => {
        if (!user?.token) return;
        
        try {
            setWalletLoading(true);
            const response = await apiFetchAuth('/student/wallet', user.token);
            if (response.ok) {
                setWalletBalance(response.data.balance || 0);
            }
        } catch (error) {
            console.error('Error fetching wallet balance:', error);
        } finally {
            setWalletLoading(false);
        }
    };

    // Check if user has sufficient balance
    const hasSufficientBalance = () => {
        console.log('Checking balance - Wallet:', walletBalance, 'Fee:', exam.entryFee);
        return walletBalance >= exam.entryFee;
    };

    // Handle payment and join exam
    const handlePaymentAndJoin = async () => {
        if (!user?.token) {
            Alert.alert('Error', 'You must be logged in to attempt this exam.');
            return;
        }

        if (walletBalance < exam.entryFee) {
            Alert.alert(
                'Insufficient Balance',
                `You need ₹${exam.entryFee} to join this exam. Your current balance is ₹${walletBalance.toFixed(2)}.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Add Money', onPress: () => router.push('/(tabs)/wallet') }
                ]
            );
            return;
        }

        setPaymentLoading(true);
        try {
            // 1. Deduct amount from wallet
            const paymentResponse = await apiFetchAuth('/student/wallet/deduct', user.token, {
                method: 'POST',
                body: { 
                    amount: exam.entryFee,
                    examId: exam.id,
                    description: `Payment for ${exam.title}`
                }
            });

            if (!paymentResponse.ok) {
                throw new Error(paymentResponse.data?.message || 'Payment failed');
            }

            // 2. Join the exam
            const joinRes = await apiFetchAuth('/student/live-exams/join', user.token, {
                method: 'POST',
                body: { examId: exam.id },
            });
            
            if (!joinRes.ok) {
                throw new Error(joinRes.data?.message || 'Failed to join exam');
            }

            // 3. Get participant info
            const participantRes = await apiFetchAuth(`/student/live-exams/${exam.id}/participant`, user.token);
            if (!participantRes.ok) {
                throw new Error('Failed to get participant info');
            }

            // 4. Fetch questions
            const questionsRes = await apiFetchAuth(`/student/live-exams/${exam.id}/questions`, user.token);
            if (!questionsRes.ok) {
                throw new Error('Failed to fetch questions');
            }

            // 5. Update wallet balance locally
            setWalletBalance(prev => prev - exam.entryFee);
            
            // 5. Update wallet balance locally
            setWalletBalance(prev => prev - exam.entryFee);
            
            // 6. Close modals and start exam directly
            setShowPaymentModal(false);
            setShowInstructionsModal(false);
            
            // Navigate directly to questions page to start the exam
            router.push({ 
                pathname: '/(tabs)/live-exam/questions', 
                params: { 
                    id: exam.id, 
                    duration: exam.duration, 
                    questions: JSON.stringify(questionsRes.data) 
                } 
            });

        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to process payment and join exam.');
        } finally {
            setPaymentLoading(false);
        }
    };

    useEffect(() => {
        const calculateRemainingTime = () => {
            const now = new Date();
            const endTime = new Date(exam.endTime);
            const diff = endTime.getTime() - now.getTime();

            if (diff <= 0) {
                setRemainingTime('00:00:00');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            setRemainingTime(
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
            );
        };

        const timer = setInterval(calculateRemainingTime, 1000);
        calculateRemainingTime(); // Initial call
        return () => clearInterval(timer);
    }, [exam.endTime]);

    const progress = exam.spots > 0 ? ((exam.spots - exam.spotsLeft) / exam.spots) * 100 : 0;

    const handleCardPress = () => {
        router.push({
            pathname: "/exam/[id]",
            params: { id: exam.id }
        });
    };

    // New: Handle Attempt for live exam
    const handleAttemptLiveExam = async () => {
        if (!user?.token) {
            Alert.alert('Error', 'You must be logged in to attempt this exam.');
            return;
        }

        try {
            // First fetch wallet balance
            setWalletLoading(true);
            const response = await apiFetchAuth('/student/wallet', user.token);
            if (response.ok) {
                const currentBalance = response.data.balance || 0;
                setWalletBalance(currentBalance);
                
                console.log('Wallet Balance:', currentBalance);
                console.log('Exam Entry Fee:', exam.entryFee);
                console.log('Has Sufficient Balance:', currentBalance >= exam.entryFee);
                
                // Check if user has sufficient balance
                if (currentBalance < exam.entryFee) {
                    Alert.alert(
                        'Insufficient Balance',
                        `You need ₹${exam.entryFee} to join this exam. Your current balance is ₹${currentBalance.toFixed(2)}.`,
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Add Money', onPress: () => router.push('/(tabs)/wallet') }
                        ]
                    );
                    return;
                }

                // Show payment confirmation modal
                setShowPaymentModal(true);
            } else {
                Alert.alert('Error', 'Failed to fetch wallet balance.');
            }
        } catch (error) {
            console.error('Error fetching wallet:', error);
            Alert.alert('Error', 'Failed to fetch wallet balance.');
        } finally {
            setWalletLoading(false);
        }
    };

    return (
        <>
        <TouchableOpacity style={styles.card} onPress={handleCardPress} activeOpacity={0.8}>
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={1}>{exam.title}</Text>
                    <Text style={styles.subtitle} numberOfLines={1}>Daily GK & Current Affairs • GK • 5Qs</Text>
                </View>
                <Image source={require('../assets/images/trophy.jpg')} style={styles.trophyIcon} />
            </View>

            <View style={styles.spotsContainer}>
                <View style={styles.spotsTextContainer}>
                    <Text style={styles.spotsLeft}>{exam.spotsLeft} Spots left</Text>
                    <Text style={styles.totalSpots}>{exam.spots} Spots</Text>
                </View>
                <View style={styles.progressBar}>
                    <View style={[styles.progress, { width: `${progress}%` }]} />
                </View>
            </View>

            <View style={styles.detailsContainer}>
                <View style={styles.tags}>
                    <View style={styles.tag}>
                        <Ionicons name="gift-outline" size={16} color="#E67E22" />
                        <Text style={styles.tagText}>{exam.entryFee}</Text>
                    </View>
                    <View style={styles.tag}>
                        <Ionicons name="trophy-outline" size={16} color="#9B59B6" />
                        <Text style={styles.tagText}>50%</Text>
                    </View>
                </View>
                <Text style={styles.remainingTime}>Remaining time: {remainingTime}</Text>
            </View>

            <View style={styles.footer}>
                <View>
                    <Text style={styles.prizePoolText}>Prize pool of up to</Text>
                    <Text style={styles.prizePoolAmount}>₹{exam.prizePool.toFixed(2)}*</Text>
                </View>
                <TouchableOpacity style={styles.attemptButton} onPress={handleAttemptLiveExam}>
                    <Text style={styles.attemptButtonText}>Attempt</Text>
                    <View style={styles.attemptFeeContainer}>
                        <Text style={styles.attemptButtonFee}>₹{exam.entryFee}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
        
        {/* Payment Confirmation Modal */}
        <Modal
          visible={showPaymentModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPaymentModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Payment Confirmation</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowPaymentModal(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.paymentDetails}>
                <View style={styles.examInfo}>
                  <Text style={styles.examTitle}>{exam.title}</Text>
                  <Text style={styles.examSubtitle}>Live Exam</Text>
                </View>
                
                <View style={styles.paymentBreakdown}>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Entry Fee:</Text>
                    <Text style={styles.paymentAmount}>₹{exam.entryFee}</Text>
                  </View>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Your Balance:</Text>
                    <Text style={[styles.paymentAmount, { color: walletBalance >= exam.entryFee ? '#28a745' : '#dc3545' }]}>
                      ₹{walletBalance.toFixed(2)}
                    </Text>
                  </View>
                  <View style={[styles.paymentRow, styles.balanceAfterRow]}>
                    <Text style={styles.paymentLabel}>Balance After:</Text>
                    <Text style={styles.paymentAmount}>
                      ₹{(walletBalance - exam.entryFee).toFixed(2)}
                    </Text>
                  </View>
                </View>
                
                {walletBalance < exam.entryFee && (
                  <View style={styles.insufficientWarning}>
                    <Ionicons name="warning" size={20} color="#dc3545" />
                    <Text style={styles.insufficientText}>
                      Insufficient balance. Please add money to your wallet.
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowPaymentModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    (walletBalance < exam.entryFee || paymentLoading) && styles.confirmButtonDisabled
                  ]}
                  disabled={walletBalance < exam.entryFee || paymentLoading}
                  onPress={handlePaymentAndJoin}
                >
                  {paymentLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.confirmButtonText}>
                      Pay ₹{exam.entryFee} & Join
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Instructions Modal for Live Exam */}
        <Modal
          visible={showInstructionsModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowInstructionsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{liveExamTitle}</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowInstructionsModal(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.instructionsTitle}>Instructions</Text>
              {instructionsLoading ? (
                <ActivityIndicator size="large" color={AppColors.primary} />
              ) : instructions && instructions.length > 0 ? (
                <ScrollView style={styles.instructionsScroll}>
                  {instructions.map((inst, idx) => (
                    <Text key={idx} style={styles.instructionText}>• {inst}</Text>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.noInstructionsText}>No instructions found.</Text>
              )}
              
              {/* Declaration Section */}
              <Text style={styles.declarationTitle}>Declaration:</Text>
              <View style={styles.declarationContainer}>
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    declarationChecked && styles.checkboxChecked
                  ]}
                  onPress={() => setDeclarationChecked(!declarationChecked)}
                >
                  {declarationChecked && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </TouchableOpacity>
                <Text style={styles.declarationText}>
                  I have read all the instructions carefully and have understood them. I agree not to cheat or use unfair means in this examination. I understand that using unfair means of any sort for my own or someone else's advantage will lead to my immediate disqualification.
                </Text>
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowInstructionsModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    (!declarationChecked || instructionsLoading) && styles.confirmButtonDisabled
                  ]}
                  disabled={!declarationChecked || instructionsLoading}
                  onPress={handlePaymentAndJoin}
                >
                  {instructionsLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Start Exam</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: AppColors.white,
        borderRadius: 15,
        padding: 15,
        marginVertical: 10,
        marginHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
    },
    subtitle: {
        fontSize: 12,
        color: AppColors.grey,
        marginTop: 4,
    },
    trophyIcon: {
        width: 50,
        height: 50,
        marginLeft: 10,
    },
    spotsContainer: {
        marginTop: 15,
    },
     progressBar: {
        height: 8,
        backgroundColor: '#EAEAEA',
        borderRadius: 4,
        overflow: 'hidden',
        marginTop: 5,
    },
    progress: {
        height: '100%',
        backgroundColor: '#5DADE2',
    },
    spotsTextContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    spotsLeft: {
        color: '#E67E22',
        fontWeight: 'bold',
        fontSize: 12,
    },
    totalSpots: {
        color: AppColors.grey,
        fontSize: 12,
    },
    detailsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.lightGrey,
    },
    tags: {
        flexDirection: 'row',
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
    },
    tagText: {
        marginLeft: 4,
        color: AppColors.darkGrey,
        fontSize: 12,
    },
    remainingTime: {
        color: '#E74C3C',
        fontSize: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 15,
    },
    prizePoolText: {
        color: AppColors.grey,
        fontSize: 12,
    },
    prizePoolAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: AppColors.primary,
    },
    attemptButton: {
        backgroundColor: '#6C3483',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingLeft: 20,
        paddingRight: 10,
        borderRadius: 8,
    },
    attemptButtonText: {
        color: AppColors.white,
        fontWeight: 'bold',
        fontSize: 16,
        marginRight: 10,
    },
    attemptFeeContainer: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 5,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    attemptButtonFee: {
        color: AppColors.white,
        fontWeight: 'bold',
        fontSize: 12,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: AppColors.white,
        borderRadius: 20,
        margin: 20,
        maxHeight: '80%',
        width: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
    },
    closeButton: {
        padding: 5,
    },
    // Payment Modal Styles
    paymentDetails: {
        padding: 20,
    },
    examInfo: {
        marginBottom: 20,
    },
    examTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
        marginBottom: 4,
    },
    examSubtitle: {
        fontSize: 14,
        color: AppColors.grey,
    },
    paymentBreakdown: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    balanceAfterRow: {
        borderTopWidth: 1,
        borderTopColor: '#dee2e6',
        paddingTop: 8,
        marginTop: 8,
    },
    paymentLabel: {
        fontSize: 16,
        color: AppColors.darkGrey,
        fontWeight: '500',
    },
    paymentAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: AppColors.primary,
    },
    insufficientWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8d7da',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
    },
    insufficientText: {
        fontSize: 14,
        color: '#721c24',
        marginLeft: 8,
        flex: 1,
    },
    // Instructions Modal Styles
    instructionsTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        color: AppColors.darkGrey,
        paddingHorizontal: 20,
    },
    instructionsScroll: {
        maxHeight: 120,
        marginBottom: 10,
        paddingHorizontal: 20,
    },
    instructionText: {
        fontSize: 15,
        color: '#333',
        marginBottom: 8,
    },
    noInstructionsText: {
        color: '#888',
        marginBottom: 10,
        paddingHorizontal: 20,
    },
    declarationTitle: {
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 4,
        color: AppColors.darkGrey,
        paddingHorizontal: 20,
    },
    declarationContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
        paddingHorizontal: 20,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: '#ccc',
        borderRadius: 4,
        backgroundColor: 'transparent',
        marginRight: 8,
        marginTop: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: AppColors.primary,
        borderColor: AppColors.primary,
    },
    declarationText: {
        flex: 1,
        color: '#333',
        fontSize: 14,
        lineHeight: 20,
    },
    // Modal Actions
    modalActions: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: AppColors.darkGrey,
    },
    confirmButton: {
        flex: 1,
        backgroundColor: AppColors.primary,
        borderRadius: 10,
        padding: 12,
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        backgroundColor: '#ccc',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: AppColors.white,
    },
});

export default ExamCard; 