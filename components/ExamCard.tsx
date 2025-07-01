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
    const [instructions, setInstructions] = useState<string[] | null>(null);
    const [instructionsLoading, setInstructionsLoading] = useState(false);
    const [liveExamTitle, setLiveExamTitle] = useState('');
    const [declarationChecked, setDeclarationChecked] = useState(false);

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
        setInstructionsLoading(true);
        try {
            const res = await apiFetchAuth(`/student/live-exams/${exam.id}`, user.token);
            if (res.ok) {
                setLiveExamTitle(res.data.title || 'Live Exam');
                if (res.data.instructions) {
                    // If instructions is a string, wrap in array
                    const instrArr = Array.isArray(res.data.instructions)
                        ? res.data.instructions
                        : typeof res.data.instructions === 'string'
                        ? [res.data.instructions]
                        : [];
                    setInstructions(instrArr);
                    setShowInstructionsModal(true);
                } else {
                    // No instructions - proceed directly with exam flow
                    setInstructions(null);
                    setShowInstructionsModal(false);
                    
                    // Directly start the exam flow
                    try {
                        // 1. Join the exam as participant (POST)
                        const joinRes = await apiFetchAuth('/student/live-exams/join', user.token, {
                            method: 'POST',
                            body: { examId: exam.id },
                        });
                        if (!joinRes.ok) throw new Error(joinRes.data?.message || 'Failed to join exam');
                        
                        // 2. Now call /participant
                        const participantRes = await apiFetchAuth(`/student/live-exams/${exam.id}/participant`, user.token);
                        if (!participantRes.ok) throw new Error('Failed to get participant info');
                        
                        // 3. Fetch questions
                        const questionsRes = await apiFetchAuth(`/student/live-exams/${exam.id}/questions`, user.token);
                        if (!questionsRes.ok) throw new Error('Failed to fetch questions');
                        
                        router.push({ 
                            pathname: '/(tabs)/live-exam/questions', 
                            params: { 
                                id: exam.id, 
                                duration: exam.duration, 
                                questions: JSON.stringify(questionsRes.data) 
                            } 
                        });
                    } catch (e: any) {
                        Alert.alert('Error', e.message || 'Could not start the exam.');
                    }
                }
            } else {
                Alert.alert('Error', 'Failed to fetch live exam details.');
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to fetch live exam details.');
        } finally {
            setInstructionsLoading(false);
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
        {/* Instructions Modal for Live Exam */}
        <Modal
          visible={showInstructionsModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowInstructionsModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 24, width: '90%', maxWidth: 400 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: AppColors.primary }}>{liveExamTitle}</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 10 }}>Instructions</Text>
              {instructionsLoading ? (
                <ActivityIndicator size="large" color={AppColors.primary} />
              ) : instructions && instructions.length > 0 ? (
                <ScrollView style={{ maxHeight: 120, marginBottom: 10 }}>
                  {instructions.map((inst, idx) => (
                    <Text key={idx} style={{ fontSize: 15, color: '#333', marginBottom: 8 }}>• {inst}</Text>
                  ))}
                </ScrollView>
              ) : (
                <Text style={{ color: '#888', marginBottom: 10 }}>No instructions found.</Text>
              )}
              {/* Declaration Section */}
              <Text style={{ fontWeight: 'bold', marginTop: 10, marginBottom: 4 }}>Declaration:</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                <TouchableOpacity
                  style={{
                    width: 20,
                    height: 20,
                    borderWidth: 2,
                    borderColor: declarationChecked ? AppColors.primary : '#ccc',
                    borderRadius: 4,
                    backgroundColor: declarationChecked ? AppColors.primary : 'transparent',
                    marginRight: 8,
                    marginTop: 2,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onPress={() => setDeclarationChecked(!declarationChecked)}
                >
                  {declarationChecked && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </TouchableOpacity>
                <Text style={{ flex: 1, color: '#333' }}>
                  I have read all the instructions carefully and have understood them. I agree not to cheat or use unfair means in this examination. I understand that using unfair means of any sort for my own or someone else's advantage will lead to my immediate disqualification.
                </Text>
              </View>
              <TouchableOpacity
                style={{ backgroundColor: declarationChecked ? AppColors.primary : '#ccc', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 8 }}
                disabled={!declarationChecked || instructionsLoading}
                onPress={async () => {
                  if (!user?.token) return;
                  setInstructionsLoading(true);
                  try {
                    // 1. Join the exam as participant (POST)
                    const joinRes = await apiFetchAuth('/student/live-exams/join', user.token, {
                      method: 'POST',
                      body: { examId: exam.id },
                    });
                    if (!joinRes.ok) throw new Error(joinRes.data?.message || 'Failed to join exam');
                    
                    // 2. Now call /participant
                    const participantRes = await apiFetchAuth(`/student/live-exams/${exam.id}/participant`, user.token);
                    if (!participantRes.ok) throw new Error('Failed to get participant info');
                    
                    // 3. Fetch questions
                    const questionsRes = await apiFetchAuth(`/student/live-exams/${exam.id}/questions`, user.token);
                    if (!questionsRes.ok) throw new Error('Failed to fetch questions');
                    
                    setShowInstructionsModal(false);
                    setInstructionsLoading(false);
                    router.push({ 
                      pathname: '/(tabs)/live-exam/questions', 
                      params: { 
                        id: exam.id, 
                        duration: exam.duration, 
                        questions: JSON.stringify(questionsRes.data) 
                      } 
                    });
                  } catch (e: any) {
                    setInstructionsLoading(false);
                    Alert.alert('Error', e.message || 'Could not start the exam.');
                  }
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>I am ready to begin</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ marginTop: 10, alignItems: 'center' }}
                onPress={() => setShowInstructionsModal(false)}
              >
                <Text style={{ color: AppColors.primary, fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
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
});

export default ExamCard; 