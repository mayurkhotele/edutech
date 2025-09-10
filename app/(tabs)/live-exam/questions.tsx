import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// interface Question {
//   id: string;
//   text: string;
//   options: string[];
//   marks: number;
// }
interface Question {
  id: string;
  text: string;
  type: "MCQ" | "TRUE_FALSE";  // ✅ Add this line
  options: string[];
  marks: number;
}
interface QuestionStatus {
  answered: boolean;
  marked: boolean;
  visited: boolean;
  selectedOption?: number;
}

const LiveExamQuestionsScreen = () => {
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
  const [currentSelection, setCurrentSelection] = useState<number | undefined>(undefined);

  // Animation refs - removed to fix clickable issues
  // const fadeAnim = useRef(new Animated.Value(0)).current;
  // const slideAnim = useRef(new Animated.Value(50)).current;
  // const timerPulseAnim = useRef(new Animated.Value(1)).current;
  // const scaleAnim = useRef(new Animated.Value(0.8)).current;
  // const rotateAnim = useRef(new Animated.Value(0)).current;
  // const progressAnim = useRef(new Animated.Value(0)).current;

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

  // Question change animation
  useEffect(() => {
    // Reset current selection when question changes
    setCurrentSelection(statuses[current]?.selectedOption);
  }, [current, questions.length, statuses]);

  // Timer pulse animation when time is low
  useEffect(() => {
    // Removed animation to fix clickable issues
  }, [timer]);

  // Rotating animation for loading
  useEffect(() => {
    // Removed animation to fix clickable issues
  }, [loading]);

  const fetchQuestions = async () => {
    if (!user?.token) return;
    console.log('Fetching questions with user ID:', user.id, 'Exam ID:', id);
    setLoading(true);
    try {
      const res = await apiFetchAuth(`/student/live-exams/${id}/questions`, user.token);
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
    const h = Math.floor(sec / 3600).toString().padStart(2, '0');
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${h} : ${m} : ${s}`;
  };

  const handleOptionSelect = (optionIdx: number) => {
    console.log('Option selected:', optionIdx);
    setCurrentSelection(optionIdx);
  };

  const handleMark = () => {
    console.log('Mark button pressed');
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

  const handleNext = () => {
    console.log('Next button pressed');
    // Just move to next question without saving
    if (current < questions.length - 1) {
      setCurrent(current + 1);
      setShowSidePanel(false);
    }
  };

  const handleSaveAndNext = () => {
    console.log('Save & Next button pressed');
    // Save the current selection
    setStatuses((prev) => {
      const updated = [...prev];
      updated[current] = {
        ...updated[current],
        answered: currentSelection !== undefined,
        selectedOption: currentSelection,
        visited: true,
      };
      return updated;
    });

    // Move to next question
    if (current < questions.length - 1) {
      setCurrent(current + 1);
      setShowSidePanel(false);
    }
  };

  const handleNav = (idx: number) => {
    // Save current selection before navigating
    if (currentSelection !== undefined) {
      setStatuses((prev) => {
        const updated = [...prev];
        updated[current] = {
          ...updated[current],
          answered: true,
          selectedOption: currentSelection,
          visited: true,
        };
        return updated;
      });
    }

    setCurrent(idx);
    setStatuses((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], visited: true };
      return updated;
    });
    setShowSidePanel(false);
  };

  const isLastQuestion = current === questions.length - 1;

  const handleSubmit = async () => {
    // Save current selection before submitting
    if (currentSelection !== undefined) {
      setStatuses((prev) => {
        const updated = [...prev];
        updated[current] = {
          ...updated[current],
          answered: true,
          selectedOption: currentSelection,
          visited: true,
        };
        return updated;
      });
    }

    Alert.alert('Submit Test', 'Are you sure you want to submit the test?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Submit', 
        style: 'destructive', 
        onPress: async () => {
          try {
            // Wait a bit to ensure state is updated
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Prepare answers payload - include current selection if it exists
            const answers: { [key: string]: number } = {};
            
            // Add all previously answered questions
            statuses.forEach((status, index) => {
              if (status.answered && status.selectedOption !== undefined) {
                answers[questions[index].id] = status.selectedOption;
              }
            });
            
            // Add current question if it has a selection
            if (currentSelection !== undefined) {
              answers[questions[current].id] = currentSelection;
            }

            console.log('Submitting answers:', answers);
            console.log('Current question:', current);
            console.log('Current selection:', currentSelection);

            // Make API call to submit the test
            const response = await apiFetchAuth(`/student/live-exams/${id}/submit`, user?.token || '', {
              method: 'POST',
              body: { answers }
            });

            if (response.ok) {
              console.log('Test submitted successfully');
              console.log('Submit response:', response.data);
              
              // Store the result data
              const resultData = response.data;
              
              // Navigate directly to result page with the exam ID and result data
              router.push({
                pathname: '/(tabs)/live-exam/result/[id]' as any,
                params: { 
                  id: id,
                  resultData: JSON.stringify(resultData)
                }
              });
            } else {
              console.error('Failed to submit test:', response);
              Alert.alert('Error', 'Failed to submit the test. Please try again.');
            }
          } catch (error) {
            console.error('Error submitting test:', error);
            Alert.alert('Error', 'An error occurred while submitting the test. Please try again.');
          }
        }
      }
    ]);
  };

  // Summary counts
  const answered = statuses.filter(s => s.answered).length;
  const marked = statuses.filter(s => s.marked).length;
  const notVisited = statuses.filter(s => !s.visited).length;
  const markedAndAnswered = statuses.filter(s => s.answered && s.marked).length;
  const notAnswered = statuses.filter(s => s.visited && !s.answered).length;

  // Removed spin variable

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
          style={styles.loadingGradient}
        >
          <View style={styles.loadingIconContainer}>
            <Ionicons name="school" size={48} color="#fff" />
          </View>
          <Text style={styles.loadingText}>Loading Exam...</Text>
          <Text style={styles.loadingSubtext}>Preparing your questions</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Timer */}
      <LinearGradient
        colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.sidePanelToggle} 
            onPress={() => setShowSidePanel(!showSidePanel)}
          >
            <Ionicons name={showSidePanel ? "close" : "menu"} size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.questionProgress}>Question {current + 1} of {questions.length}</Text>
            
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill,
                    { width: `${((current + 1) / questions.length) * 100}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{Math.round(((current + 1) / questions.length) * 100)}%</Text>
            </View>
          </View>
          
          <View style={styles.timerContainer}>
            <Ionicons name="time" size={18} color="#fff" style={styles.timerIcon} />
            <Text style={[styles.timerText, timer <= 300 && styles.timerTextWarning]}>
              {formatTime(timer)}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Main Content Area */}
      <ScrollView style={styles.mainContent} contentContainerStyle={styles.mainContentContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentCenter}>
        <View 
          style={[
            styles.questionCard,
            {
              opacity: 1, // Removed fadeAnim
              transform: [
                { translateY: 0 }, // Removed slideAnim
                { scale: 1 } // Removed scaleAnim
              ]
            }
          ]}
        >
          {/* Question Header */}
          <View style={styles.questionHeader}>
            <View style={styles.headerLeft}>
              <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                style={styles.questionNumberBadge}
              >
                <Text style={styles.questionNumber}>Q{current + 1}</Text>
              </LinearGradient>
            </View>
            <View style={styles.questionMarks}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.marksText}>{questions[current]?.marks || 1} mark</Text>
            </View>
          </View>

          {/* Question Text - Below Header */}
          <View style={styles.questionTextSection}>
            <Text style={styles.questionTitleInline}>
              {questions[current]?.text}
            </Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {questions[current]?.type === "TRUE_FALSE" ? (
              // True/False Options - 2 buttons side by side
              <View style={styles.trueFalseContainer}>
                {questions[current]?.options.map((opt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.trueFalseButton,
                      (currentSelection === idx || statuses[current]?.selectedOption === idx) && styles.trueFalseButtonSelected
                    ]}
                    onPress={() => handleOptionSelect(idx)}
                  >
                    <View style={styles.trueFalseContent}>
                      <View style={[
                        styles.radioButton,
                        (currentSelection === idx || statuses[current]?.selectedOption === idx) && styles.radioButtonSelected
                      ]}>
                        {(currentSelection === idx || statuses[current]?.selectedOption === idx) && (
                          <View style={styles.radioButtonInner} />
                        )}
                      </View>
                      <Text style={[
                        styles.trueFalseText,
                        (currentSelection === idx || statuses[current]?.selectedOption === idx) && styles.trueFalseTextSelected
                      ]}>
                        {opt}
                      </Text>
                    </View>
                    {(currentSelection === idx || statuses[current]?.selectedOption === idx) && (
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              // MCQ Options
              questions[current]?.options.map((opt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.optionButton,
                    (currentSelection === idx || statuses[current]?.selectedOption === idx) && styles.optionButtonSelected
                  ]}
                  onPress={() => handleOptionSelect(idx)}
                >
                  <View style={styles.optionContent}>
                    <View style={[
                      styles.radioButton,
                      (currentSelection === idx || statuses[current]?.selectedOption === idx) && styles.radioButtonSelected
                    ]}>
                      {(currentSelection === idx || statuses[current]?.selectedOption === idx) && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                    <Text style={[
                      styles.optionText,
                      (currentSelection === idx || statuses[current]?.selectedOption === idx) && styles.optionTextSelected
                    ]}>
                      {opt}
                    </Text>
                  </View>
                  {(currentSelection === idx || statuses[current]?.selectedOption === idx) && (
                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <View style={styles.leftActions}>
              <TouchableOpacity 
                style={[
                  styles.markButton,
                  statuses[current]?.marked && styles.markButtonActive
                ]} 
                onPress={handleMark}
              >
                <Ionicons 
                  name={statuses[current]?.marked ? 'bookmark' : 'bookmark-outline'} 
                  size={16} 
                  color={statuses[current]?.marked ? '#fff' : '#4F46E5'} 
                />
                <Text style={[
                  styles.markButtonText,
                  statuses[current]?.marked && styles.markButtonTextActive
                ]}>
                  {statuses[current]?.marked ? 'Marked' : 'Mark'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.navigationActions}>
              {!isLastQuestion ? (
                <>
                  <TouchableOpacity 
                    style={[
                      styles.saveNextButton,
                      currentSelection === undefined && styles.saveNextButtonDisabled
                    ]} 
                    onPress={handleSaveAndNext}
                    disabled={currentSelection === undefined}
                  >
                    <LinearGradient
                      colors={currentSelection !== undefined ? ['#4F46E5', '#7C3AED'] : ['#CBD5E1', '#9CA3AF']}
                      style={styles.saveNextButtonGradient}
                    >
                      <Text style={styles.saveNextButtonText}>Save & Next</Text>
                      <Ionicons name="arrow-forward" size={16} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <LinearGradient
                      colors={['#4F46E5', '#7C3AED']}
                      style={styles.nextButtonGradient}
                    >
                      <Ionicons name="arrow-forward" size={16} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          </View>
        </View>

        {/* Bottom Submit Button for all questions */}
        <View style={styles.submitContainer}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <LinearGradient
              colors={['#FF6B6B', '#FF5252', '#FF1744']}
              style={styles.submitButtonGradient}
            >
              <Ionicons name="checkmark-circle" size={26} color="#fff" />
              <Text style={styles.submitButtonText}>Submit Test</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>

      {/* Side Panel */}
      {showSidePanel && (
        <View style={[styles.sidePanel, { width: Math.min(width * 0.9, 320) }]}>
          <ScrollView style={styles.sidePanelScroll} showsVerticalScrollIndicator={false}>
            

            {/* Progress Summary */}
            <View style={styles.sidePanelSection}>
              <View style={styles.sidePanelTitleRow}>
                <Ionicons name="stats-chart" size={18} color="#374151" style={styles.sidePanelTitleIcon} />
                <Text style={styles.sidePanelTitle}>Progress Summary</Text>
              </View>
              <View style={styles.progressBarWrap}>
                <View style={styles.progressBarOuter}>
                  <LinearGradient
                    colors={['#4F46E5', '#7C3AED']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.progressBarInner,
                      { width: `${Math.min(100, (answered / Math.max(1, questions.length)) * 100)}%` }
                    ]}
                  />
                </View>
                <Text style={styles.progressBarText}>{answered}/{questions.length} completed</Text>
              </View>
              <View style={styles.progressGrid}>
                <View style={[styles.progressCard, styles.progressCardGreen]}>
                  <Ionicons name="checkmark-circle" size={16} color="#059669" style={styles.progressCardIcon} />
                  <Text style={[styles.progressNumber, styles.progressNumberGreen]}>{answered}</Text>
                  <Text style={[styles.progressLabel, styles.progressLabelGreen]}>Answered</Text>
                </View>
                <View style={[styles.progressCard, styles.progressCardAmber]}>
                  <Ionicons name="bookmark" size={16} color="#B45309" style={styles.progressCardIcon} />
                  <Text style={[styles.progressNumber, styles.progressNumberAmber]}>{marked}</Text>
                  <Text style={[styles.progressLabel, styles.progressLabelAmber]}>Marked</Text>
                </View>
                <View style={[styles.progressCard, styles.progressCardGray]}>
                  <Ionicons name="eye-off" size={16} color="#4B5563" style={styles.progressCardIcon} />
                  <Text style={[styles.progressNumber, styles.progressNumberGray]}>{notVisited}</Text>
                  <Text style={[styles.progressLabel, styles.progressLabelGray]}>Not Visited</Text>
                </View>
                <View style={[styles.progressCard, styles.progressCardRed]}>
                  <Ionicons name="close-circle" size={16} color="#B91C1C" style={styles.progressCardIcon} />
                  <Text style={[styles.progressNumber, styles.progressNumberRed]}>{notAnswered}</Text>
                  <Text style={[styles.progressLabel, styles.progressLabelRed]}>Not Answered</Text>
                </View>
              </View>
            </View>

            {/* Question Navigation */}
            <View style={styles.sidePanelSection}>
              <View style={styles.sidePanelTitleRow}>
                <Ionicons name="grid" size={18} color="#374151" style={styles.sidePanelTitleIcon} />
                <Text style={styles.sidePanelTitle}>Question Navigation</Text>
              </View>
              <View style={styles.questionNavigationGrid}>
                {questions.map((q, idx) => {
                  let statusColor = '#E0E0E0';
                  let textColor = '#666';
                  let borderColor = '#E0E0E0';
                  
                  if (statuses[idx]?.answered && statuses[idx]?.marked) {
                    statusColor = '#4CAF50';
                    textColor = '#fff';
                    borderColor = '#4CAF50';
                  } else if (statuses[idx]?.answered) {
                    statusColor = '#4CAF50';
                    textColor = '#fff';
                    borderColor = '#4CAF50';
                  } else if (statuses[idx]?.marked) {
                    statusColor = '#FFC107';
                    textColor = '#000';
                    borderColor = '#FFC107';
                  } else if (statuses[idx]?.visited && !statuses[idx]?.answered) {
                    statusColor = '#F44336';
                    textColor = '#fff';
                    borderColor = '#F44336';
                  }
                  
                  return (
                    <TouchableOpacity
                      key={q.id}
                      style={[
                        styles.questionNavButton,
                        { 
                          backgroundColor: statusColor,
                          borderColor: current === idx ? '#4F46E5' : borderColor
                        },
                        current === idx && styles.currentQuestionNav
                      ]}
                      onPress={() => handleNav(idx)}
                    >
                      <Text style={[styles.questionNavText, { color: textColor }]}>
                        {idx + 1}
                      </Text>
                      {statuses[idx]?.answered && statuses[idx]?.marked && (
                        <View style={styles.checkmarkBadge}>
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC'
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30
  },
  loadingText: { 
    marginTop: 20, 
    fontSize: 20, 
    fontWeight: 'bold',
    color: '#fff'
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)'
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    paddingBottom: 6,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  sidePanelToggle: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1
  },
  examTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2
  },
  securityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 4
  },
  securityText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#fff',
    fontWeight: '600'
  },
  questionProgress: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: 2
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 180,
    gap: 8
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3
  },
  progressText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600'
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DC2626'
  },
  timerIcon: {
    marginRight: 4
  },
  timerText: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#fff'
  },
  timerTextWarning: {
    color: '#fff'
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16
  },
  mainContentContent: {
    paddingBottom: 24,
  },
  contentCenter: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  questionCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    marginTop: 0,
    marginBottom: 20,
    padding: 20, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 12, 
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  questionTextSection: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  questionNumberBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  },
  questionMarks: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  marksText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#D97706'
  },
  questionTitleInline: { 
    fontSize: 15, 
    lineHeight: 22,
    color: '#111827', 
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'left'
  },
  optionsContainer: { 
    marginBottom: 16
  },
  optionButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC', 
    borderRadius: 16, 
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  optionButtonSelected: { 
    backgroundColor: '#EEF2FF', 
    borderColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    transform: [{ scale: 1.03 }]
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  radioButton: { 
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    borderWidth: 2, 
    borderColor: '#CBD5E1', 
    marginRight: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#fff',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2
  },
  radioButtonSelected: { 
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4
  },
  radioButtonInner: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: '#fff',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2
  },
  optionText: { 
    fontSize: 15, 
    color: '#1F2937',
    flex: 1,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: 0.2
  },
  optionTextSelected: {
    color: '#1F2937',
    fontWeight: '800'
  },
  actionButtonsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 12,
    paddingTop: 14,
    borderTopWidth: 2,
    borderTopColor: '#E0E7FF'
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  markButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F3F4F6', 
    borderRadius: 14, 
    paddingVertical: 10, 
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2
  },
  markButtonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6
  },
  markButtonText: { 
    color: '#4F46E5', 
    fontWeight: '700', 
    marginLeft: 8,
    fontSize: 14
  },
  markButtonTextActive: {
    color: '#fff'
  },
  navigationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  saveNextButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8
  },
  saveNextButtonDisabled: {
    shadowColor: '#CBD5E1',
    shadowOpacity: 0.1,
    elevation: 2
  },
  saveNextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12
  },
  saveNextButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14
  },
  nextButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8
  },
  submitContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginTop: 4
  },
  submitButton: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#FF1744',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 14,
    gap: 10
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18
  },
  // ✅ Question Type Badge Styles
questionTypeContainer: {
  flexDirection: 'row',
  alignItems: 'center',
},
questionTypeBadge: {
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 12,
  marginRight: 12,
},
trueFalseBadge: {
  backgroundColor: '#DC2626', // Red for True/False
},
mcqBadge: {
  backgroundColor: '#2563EB', // Blue for MCQ
},
questionTypeText: {
  fontSize: 12,
  fontWeight: '600',
},

mcqText: {
  color: '#fff',
},

// ✅ True/False Specific Styles
trueFalseContainer: {
  flexDirection: 'row',
  gap: 20,
},
trueFalseButton: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#F8FAFC',
  borderRadius: 24,
  padding: 22,
  borderWidth: 2,
  borderColor: 'transparent',
  shadowColor: '#4F46E5',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 8,
  elevation: 4,
},
trueFalseButtonSelected: {
  backgroundColor: '#FEF2F2',
  borderColor: '#DC2626',
  shadowColor: '#DC2626',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.3,
  shadowRadius: 16,
  elevation: 8,
  transform: [{ scale: 1.03 }]
},
trueFalseContent: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
},
trueFalseText: {
  fontSize: 18,
  color: '#374151',
  fontWeight: '700',
  marginLeft: 16,
  letterSpacing: 0.4
},
trueFalseTextSelected: {
  color: '#DC2626',
  fontWeight: '800',
},
  // Side Panel Styles
  sidePanel: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 320,
    height: '100%',
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 1000
  },
  sidePanelScroll: {
    flex: 1,
    padding: 20
  },
  sidePanelSection: {
    marginBottom: 24
  },
  sidePanelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sidePanelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 0
  },
  sidePanelTitleIcon: {
    marginRight: 8,
  },
  userProfileCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 8
  },
  userProfileContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  userInfo: {
    flex: 1
  },
  userName: { 
    fontWeight: 'bold', 
    fontSize: 18, 
    color: '#fff',
    marginBottom: 4
  },
  userStatus: { 
    fontSize: 14, 
    color: 'rgba(255, 255, 255, 0.8)'
  },
  progressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  progressBarWrap: {
    marginBottom: 12,
  },
  progressBarOuter: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  progressBarText: {
    marginTop: 6,
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  progressCard: { 
    flex: 1,
    minWidth: '45%',
    borderRadius: 10, 
    padding: 12, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
  },
  progressSub: {
    marginTop: 2,
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600'
  },
  progressCardIcon: {
    marginBottom: 6,
  },
  progressCardGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  progressCardAmber: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  progressCardGray: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  progressCardRed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  progressNumber: { 
    color: '#111827', 
    fontWeight: 'bold', 
    fontSize: 20,
    marginBottom: 2
  },
  progressNumberGreen: { color: '#065F46' },
  progressNumberAmber: { color: '#92400E' },
  progressNumberGray: { color: '#374151' },
  progressNumberRed: { color: '#991B1B' },
  progressLabel: { 
    color: '#374151', 
    fontSize: 11,
    fontWeight: '500'
  },
  progressLabelGreen: { color: '#047857' },
  progressLabelAmber: { color: '#B45309' },
  progressLabelGray: { color: '#4B5563' },
  progressLabelRed: { color: '#B91C1C' },
  questionNavigationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  questionNavButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    borderWidth: 2, 
    alignItems: 'center', 
    justifyContent: 'center', 
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  currentQuestionNav: {
    borderWidth: 3,
    transform: [{ scale: 1.1 }]
  },
  questionNavText: { 
    fontWeight: 'bold', 
    fontSize: 14
  },
  checkmarkBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center'
  }
});

export default LiveExamQuestionsScreen; 