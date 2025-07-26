import { AppColors } from '@/constants/Colors';
import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Question {
  id: string;
  text: string;
  options: string[];
  marks: number;
}

interface QuestionStatus {
  answered: boolean;
  marked: boolean;
  visited: boolean;
  selectedOption?: number;
}

const PracticeExamQuestionsScreen = () => {
  const { id, duration } = useLocalSearchParams<{ id: string, duration?: string }>();
 
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [statuses, setStatuses] = useState<QuestionStatus[]>([]);
  const [timer, setTimer] = useState(() => duration ? parseInt(duration) * 60 : 12 * 60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch questions directly since join is already handled in the previous screen
  useEffect(() => {
    if (!id || !user?.token) return;
    fetchQuestions();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id, user?.token]);

  useEffect(() => {
    if (duration) {
      setTimer(parseInt(duration) * 60);
    }
  }, [duration]);

  const fetchQuestions = async () => {
    if (!user?.token) return;
    console.log('Fetching questions with user ID:', user.id, 'Exam ID:', id);
    setLoading(true);
    try {
      const res = await apiFetchAuth(`/student/practice-exams/${id}/questions`, user.token);
      if (res.ok) {
        console.log('Successfully fetched questions');
        setQuestions(res.data);
        setStatuses(res.data.map(() => ({ answered: false, marked: false, visited: false })));
        setLoading(false);
        startTimer();
      } else {
        Alert.alert('Error', 'Could not fetch questions.');
        setLoading(false);
      }
    } catch (e) {
      console.error('Error fetching questions:', e);
      Alert.alert('Error', 'Could not fetch questions.');
      setLoading(false);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `00 : ${m} : ${s}`;
  };

  const handleOptionSelect = (optionIdx: number) => {
    setStatuses((prev) => {
      const updated = [...prev];
      updated[current] = {
        ...updated[current],
        answered: true,
        selectedOption: optionIdx,
        visited: true,
      };
      return updated;
    });
  };

  const handleMark = () => {
    setStatuses((prev) => {
      const updated = [...prev];
      updated[current] = {
        ...updated[current],
        marked: !updated[current].marked,
        visited: true,
      };
      return updated;
    });
  };

  const handleNav = (idx: number) => {
    setCurrent(idx);
    setStatuses((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], visited: true };
      return updated;
    });
    setShowSidePanel(false); // Close side panel when navigating
  };

  const handleNext = () => {
    if (current < questions.length - 1) handleNav(current + 1);
  };

  const handleSkip = () => {
    // Mark current question as visited but not answered
    setStatuses((prev) => {
      const updated = [...prev];
      updated[current] = {
        ...updated[current],
        visited: true,
        answered: false,
        selectedOption: undefined,
      };
      return updated;
    });
    
    // Move to next question
    if (current < questions.length - 1) {
      handleNav(current + 1);
    }
  };

  const isLastQuestion = current === questions.length - 1;

  const handleSubmit = async () => {
    setShowSubmitModal(true);
  };

  const confirmSubmit = async () => {
    setSubmitting(true);
    try {
      // Prepare answers payload
      const answers: { [key: string]: number } = {};
      statuses.forEach((status, index) => {
        if (status.answered && status.selectedOption !== undefined) {
          answers[questions[index].id] = status.selectedOption;
        }
      });

      console.log('Submitting answers:', answers);

      // Make API call to submit the test
      const response = await apiFetchAuth(`/student/practice-exams/${id}/submit`, user?.token || '', {
        method: 'POST',
        body: { answers }
      });

      if (response.ok) {
        console.log('Test submitted successfully');
        setShowSubmitModal(false);
        setSubmitting(false);
        // Direct redirect to result page
        router.push(`/(tabs)/practice-exam/result/${id}`);
      } else {
        console.error('Failed to submit test:', response);
        setSubmitting(false);
        Alert.alert('Error', 'Failed to submit the test. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      setSubmitting(false);
      Alert.alert('Error', 'An error occurred while submitting the test. Please try again.');
    }
  };

  // Summary counts
  const answered = statuses.filter(s => s.answered).length;
  const marked = statuses.filter(s => s.marked).length;
  const notVisited = statuses.filter(s => !s.visited).length;
  const markedAndAnswered = statuses.filter(s => s.answered && s.marked).length;
  const notAnswered = statuses.filter(s => s.visited && !s.answered).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.loadingText}>Loading Exam...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Timer and Side Panel Toggle */}
      <View style={styles.timerRow}>
        <TouchableOpacity 
          style={styles.sidePanelToggle} 
          onPress={() => setShowSidePanel(!showSidePanel)}
        >
          <Ionicons name={showSidePanel ? "close" : "menu"} size={24} color={AppColors.primary} />
        </TouchableOpacity>
        <Text style={styles.timerText}>{formatTime(timer)}</Text>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {/* Current Question */}
        <View style={styles.questionCard}>
          <Text style={styles.qNumber}>Q{current + 1}.</Text>
          <Text style={styles.qText}>{questions[current]?.text}</Text>
          <View style={styles.optionsList}>
            {questions[current]?.options.map((opt, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.optionBtn, statuses[current]?.selectedOption === idx && styles.optionBtnSelected]}
                onPress={() => handleOptionSelect(idx)}
              >
                <View style={[styles.radioOuter, statuses[current]?.selectedOption === idx && styles.radioOuterSelected]}>
                  {statuses[current]?.selectedOption === idx && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.qActionsRow}>
            <TouchableOpacity style={styles.markBtn} onPress={handleMark}>
              <Ionicons name={statuses[current]?.marked ? 'bookmark' : 'bookmark-outline'} size={18} color={AppColors.primary} />
              <Text style={styles.markBtnText}>{statuses[current]?.marked ? 'Unmark' : 'Mark for Review'}</Text>
            </TouchableOpacity>
            <View style={styles.navigationButtons}>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitBtnText}>Submit Test</Text>
              </TouchableOpacity>
              {!isLastQuestion && (
                <>
                  <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                    <Text style={styles.skipBtnText}>Next</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                    <Text style={styles.nextBtnText}>Save & Next →</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </View>



      {/* Side Panel */}
      {showSidePanel && (
        <View style={styles.sidePanel}>
          <ScrollView style={styles.sidePanelScroll} showsVerticalScrollIndicator={false}>
            {/* User Profile */}
            <View style={styles.sidePanelSection}>
              <View style={styles.userRow}>
                <Ionicons name="person-circle" size={32} color={AppColors.primary} />
                <Text style={styles.userName}>{user?.name || 'User'}</Text>
              </View>
            </View>

            {/* Summary Stats */}
            <View style={styles.sidePanelSection}>
              <Text style={styles.sidePanelTitle}>Summary</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusBox, { backgroundColor: '#4CAF50' }]}>
                  <Text style={styles.statusCount}>{answered}</Text>
                  <Text style={styles.statusLabel}>Answered</Text>
                </View>
                <View style={[styles.statusBox, { backgroundColor: '#FFC107' }]}>
                  <Text style={styles.statusCount}>{marked}</Text>
                  <Text style={styles.statusLabel}>Marked</Text>
                </View>
                <View style={[styles.statusBox, { backgroundColor: '#BDBDBD' }]}>
                  <Text style={styles.statusCount}>{notVisited}</Text>
                  <Text style={styles.statusLabel}>Not Visited</Text>
                </View>
              </View>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.legendText}>Marked and answered</Text>
                </View>
                <View style={styles.legendItem}>
                  <Ionicons name="close-circle" size={16} color="#F44336" />
                  <Text style={styles.legendText}>Not Answered</Text>
                </View>
              </View>
            </View>

            {/* Question Navigation */}
            <View style={styles.sidePanelSection}>
              <Text style={styles.sidePanelTitle}>Question Navigation</Text>
              <View style={styles.questionGrid}>
                {questions.map((q, idx) => {
                  let bg = '#fff', border = '#BDBDBD', color = AppColors.darkGrey;
                  if (statuses[idx]?.answered && statuses[idx]?.marked) { bg = '#4CAF50'; color = '#fff'; }
                  else if (statuses[idx]?.answered) { bg = '#4CAF50'; color = '#fff'; }
                  else if (statuses[idx]?.marked) { bg = '#FFC107'; color = '#000'; }
                  else if (!statuses[idx]?.visited) { bg = '#fff'; border = '#BDBDBD'; color = AppColors.darkGrey; }
                  else if (statuses[idx]?.visited && !statuses[idx]?.answered) { bg = '#F44336'; color = '#fff'; }
                  
                  return (
                    <TouchableOpacity
                      key={q.id}
                      style={[
                        styles.qNavBtn, 
                        { backgroundColor: bg, borderColor: border },
                        current === idx && styles.currentQuestion
                      ]}
                      onPress={() => handleNav(idx)}
                    >
                      <Text style={[styles.qNavText, { color }]}>{idx + 1}</Text>
                      {statuses[idx]?.answered && statuses[idx]?.marked && (
                        <Ionicons name="checkmark" size={14} color="#fff" style={styles.checkmarkIcon} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Advanced Submit Confirmation Modal */}
      <Modal
        visible={showSubmitModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSubmitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.modalHeader}
            >
              <View style={styles.modalIconContainer}>
                <Ionicons name="checkmark-circle" size={40} color="#fff" />
              </View>
              <Text style={styles.modalTitle}>Submit Exam</Text>
              <Text style={styles.modalSubtitle}>Are you sure you want to submit your exam?</Text>
            </LinearGradient>

            <View style={styles.modalContent}>
              <View style={styles.summarySection}>
                <Text style={styles.summaryTitle}>Exam Summary</Text>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    <Text style={styles.summaryLabel}>Answered</Text>
                    <Text style={styles.summaryValue}>{answered}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Ionicons name="close-circle" size={20} color="#F44336" />
                    <Text style={styles.summaryLabel}>Unanswered</Text>
                    <Text style={styles.summaryValue}>{questions.length - answered}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Ionicons name="bookmark" size={20} color="#FFC107" />
                    <Text style={styles.summaryLabel}>Marked</Text>
                    <Text style={styles.summaryValue}>{marked}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.warningSection}>
                <Ionicons name="warning" size={24} color="#FF9800" />
                <Text style={styles.warningText}>
                  Once submitted, you cannot change your answers. Please review all questions before proceeding.
                </Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowSubmitModal(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonText}>Review More</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitConfirmButton}
                onPress={confirmSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="#fff" />
                    <Text style={styles.submitConfirmButtonText}>Submit Exam</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F6F8FB',
    paddingTop: 10 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    marginTop: 10, 
    fontSize: 16, 
    color: AppColors.primary 
  },
  timerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    marginBottom: 6 
  },
  sidePanelToggle: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: AppColors.primary
  },
  timerText: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: AppColors.primary 
  },
  pauseBtn: { 
    backgroundColor: '#fff', 
    borderRadius: 6, 
    paddingHorizontal: 14, 
    paddingVertical: 4, 
    borderWidth: 1, 
    borderColor: AppColors.primary 
  },
  pauseText: { 
    color: AppColors.primary, 
    fontWeight: 'bold' 
  },
  mainContent: {
    flex: 1,
    marginRight: 0
  },
  questionCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    margin: 10, 
    padding: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 4, 
    elevation: 2 
  },
  qNumber: { 
    fontWeight: 'bold', 
    fontSize: 16, 
    color: AppColors.primary, 
    marginBottom: 6 
  },
  qText: { 
    fontSize: 16, 
    color: AppColors.darkGrey, 
    marginBottom: 16 
  },
  optionsList: { 
    marginBottom: 12 
  },
  optionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F6F8FB', 
    borderRadius: 8, 
    padding: 10, 
    marginBottom: 8 
  },
  optionBtnSelected: { 
    backgroundColor: '#E0F7FA', 
    borderColor: AppColors.primary, 
    borderWidth: 1 
  },
  radioOuter: { 
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    borderWidth: 2, 
    borderColor: AppColors.primary, 
    marginRight: 10, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#fff' 
  },
  radioOuterSelected: { 
    backgroundColor: AppColors.primary 
  },
  radioInner: { 
    width: 10, 
    height: 10, 
    borderRadius: 5, 
    backgroundColor: '#fff' 
  },
  optionText: { 
    fontSize: 15, 
    color: AppColors.darkGrey 
  },
  qActionsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 10 
  },
  markBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F3F4F6', 
    borderRadius: 8, 
    paddingVertical: 8, 
    paddingHorizontal: 14 
  },
  markBtnText: { 
    color: AppColors.primary, 
    fontWeight: 'bold', 
    marginLeft: 6 
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  skipBtn: {
    backgroundColor: '#E0F7FA',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 4
  },
  skipBtnText: {
    color: AppColors.primary,
    fontWeight: 'bold'
  },
  nextBtn: { 
    backgroundColor: AppColors.primary, 
    borderRadius: 8, 
    paddingVertical: 10, 
    paddingHorizontal: 18 
  },
  nextBtnText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 15 
  },
  bottomRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 10, 
    backgroundColor: '#fff', 
    borderTopWidth: 1, 
    borderColor: '#E0E0E0' 
  },
  bottomBtn: { 
    backgroundColor: '#E0F7FA', 
    borderRadius: 8, 
    paddingVertical: 10, 
    paddingHorizontal: 14, 
    marginHorizontal: 2 
  },
  bottomBtnText: { 
    color: AppColors.primary, 
    fontWeight: 'bold' 
  },
  submitBtn: { 
    backgroundColor: AppColors.primary, 
    borderRadius: 8, 
    paddingVertical: 10, 
    paddingHorizontal: 18, 
    marginLeft: 4 
  },
  submitBtnText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 15 
  },
  // Side Panel Styles
  sidePanel: {
    position: 'absolute',
    right: 0,
    top: 60,
    width: 280,
    height: '100%',
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000
  },
  sidePanelScroll: {
    flex: 1,
    padding: 16
  },
  sidePanelSection: {
    marginBottom: 20
  },
  sidePanelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.primary,
    marginBottom: 12
  },
  userRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  userName: { 
    fontWeight: 'bold', 
    fontSize: 16, 
    marginLeft: 8, 
    color: AppColors.primary 
  },
  statusRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 8 
  },
  statusBox: { 
    flex: 1, 
    marginHorizontal: 4, 
    borderRadius: 8, 
    padding: 6, 
    alignItems: 'center' 
  },
  statusCount: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  statusLabel: { 
    color: '#fff', 
    fontSize: 12 
  },
  legendRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 4 
  },
  legendItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginRight: 10 
  },
  legendText: { 
    fontSize: 12, 
    color: AppColors.darkGrey, 
    marginLeft: 4 
  },
  questionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start'
  },
  qNavBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    borderWidth: 2, 
    margin: 4, 
    alignItems: 'center', 
    justifyContent: 'center', 
    position: 'relative' 
  },
  currentQuestion: {
    borderWidth: 3,
    borderColor: AppColors.primary,
    transform: [{ scale: 1.1 }]
  },
  qNavText: { 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  checkmarkIcon: {
    position: 'absolute', 
    top: -6, 
    right: -6 
  },
  // Rough Work Styles
  roughWorkContainer: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 0
  },
  roughWorkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#F8F9FA'
  },
  roughWorkTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.primary,
    marginLeft: 8
  },
  roughWorkArea: {
    minHeight: 120,
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12
  },
  roughWorkPlaceholder: {
    fontSize: 14,
    color: '#9E9E9E',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20
  },
  modalContent: {
    padding: 20,
    paddingBottom: 10
  },
  summarySection: {
    marginBottom: 20
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.primary,
    marginBottom: 10
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap'
  },
  summaryItem: {
    alignItems: 'center',
    marginHorizontal: 10,
    marginBottom: 10
  },
  summaryLabel: {
    fontSize: 14,
    color: AppColors.darkGrey,
    marginTop: 5
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.primary,
    marginTop: 5
  },
  warningSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    marginTop: 10
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    marginLeft: 10,
    flexShrink: 1
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flex: 1,
    marginRight: 10
  },
  cancelButtonText: {
    color: AppColors.primary,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  submitConfirmButton: {
    backgroundColor: AppColors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 10
  },
  submitConfirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 5
  }
});

export default PracticeExamQuestionsScreen; 