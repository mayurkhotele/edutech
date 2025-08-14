import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface QuestionData {
  id: string;
  question: string;
  options: string[];
  correct: number;
  timeLimit: number;
  isActive: boolean;
  hasAttempted: boolean;
  selectedOption?: number; // User's selected option
  isCorrect?: boolean; // Whether user's answer was correct
  correctAnswer?: number; // Alternative field for correct answer
}

const QuestionOfTheDay = () => {
  const { user } = useAuth();
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showResult, setShowResult] = useState(false);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  
  useEffect(() => {
    if (user?.token) {
      fetchQuestionOfTheDay();
    }
  }, [user?.token]);

  useEffect(() => {
    if (questionData) {
      console.log('Setting timer to:', questionData.timeLimit);
      setTimeLeft(questionData.timeLimit);
      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [questionData]);

  useEffect(() => {
    console.log('Timer effect - timeLeft:', timeLeft, 'isAnswered:', isAnswered, 'hasAttempted:', questionData?.hasAttempted);
    if (timeLeft > 0 && !isAnswered && !questionData?.hasAttempted) {
      const timer = setTimeout(() => {
        console.log('Timer tick - new timeLeft:', timeLeft - 1);
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, isAnswered, questionData?.hasAttempted]);

  const fetchQuestionOfTheDay = async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiFetchAuth('/student/question-of-the-day', user.token);
      
      if (response.ok) {
        setQuestionData(response.data);
        
        // Simple logic: if already attempted, show result; if not, allow answering
        if (response.data.hasAttempted) {
          // Show previous attempt result
          setSelectedOption(response.data.selectedOption || null);
          setIsAnswered(true);
          setShowResult(true);
          setTimeLeft(0);
        } else {
          // Allow answering - reset all states
          setSelectedOption(null);
          setIsAnswered(false);
          setShowResult(false);
        }
      }
    } catch (error) {
      console.error('Error fetching question of the day:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = async (optionIndex: number) => {
    // Only allow selection if question hasn't been attempted
    if (questionData?.hasAttempted) {
      return;
    }
    
    setSelectedOption(optionIndex);
    setIsAnswered(true);
    
    // Submit answer to API
    try {
      const response = await apiFetchAuth('/student/question-of-the-day', user?.token || '', {
        method: 'POST',
        body: {
          questionId: questionData?.id,
          selectedOption: optionIndex,
        },
      });
      
      // After successful submission, fetch updated question data
      if (response.ok) {
        console.log('Answer submitted successfully, fetching updated data...');
        await fetchQuestionOfTheDay(); // Refresh the data
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
    
    // Show result immediately
    setShowResult(true);
  };

  const handleTimeout = () => {
    console.log('Time up!');
    setIsAnswered(true);
    setShowResult(true);
  };

  const handleRefresh = () => {
    console.log('Refreshing question...');
    setSelectedOption(null);
    setIsAnswered(false);
    setShowResult(false);
    setTimeLeft(0);
    fetchQuestionOfTheDay();
  };

  const getOptionStyle = (index: number) => {
    // If question hasn't been attempted yet, show normal selection state
    if (!questionData?.hasAttempted) {
      return [
        styles.optionButton,
        selectedOption === index && styles.selectedOption,
      ];
    }

    // For attempted questions, show correct/incorrect indicators
    if (index === (questionData?.correct || 0)) {
      return [styles.optionButton, styles.correctOption];
    } else if ((questionData?.selectedOption || 0) === index && index !== (questionData?.correct || 0)) {
      return [styles.optionButton, styles.incorrectOption];
    }
    
    return [styles.optionButton, styles.disabledOption];
  };

  const getOptionTextStyle = (index: number) => {
    // If question hasn't been attempted yet, show normal selection state
    if (!questionData?.hasAttempted) {
      return [
        styles.optionText,
        selectedOption === index && styles.selectedOptionText,
      ];
    }

    // For attempted questions, show correct/incorrect indicators
    if (index === (questionData?.correct || 0)) {
      return [styles.optionText, styles.correctOptionText];
    } else if ((questionData?.selectedOption || 0) === index && index !== (questionData?.correct || 0)) {
      return [styles.optionText, styles.incorrectOptionText];
    }
    
    return [styles.optionText, styles.disabledOptionText];
  };

  const getOptionIcon = (index: number) => {
    // Only show icons for attempted questions
    if (!questionData?.hasAttempted) return null;
    
    if (index === (questionData?.correct || 0)) {
      return <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />;
    } else if ((questionData?.selectedOption || 0) === index && index !== (questionData?.correct || 0)) {
      return <Ionicons name="close-circle" size={24} color="#F44336" />;
    }
    return null;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a08efe" />
        <Text style={styles.loadingText}>Loading today's question...</Text>
      </View>
    );
  }

  if (!questionData) {
    return (
      <View style={styles.noQuestionContainer}>
        <Ionicons name="help-circle-outline" size={64} color="#a08efe" />
        <Text style={styles.noQuestionText}>No Question Available</Text>
        <Text style={styles.noQuestionSubtext}>Check back tomorrow for a new question!</Text>
      </View>
    );
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim }
          ]
        }
      ]}
    >
      {/* Timer Section */}
      <View style={styles.timerSection}>
        {!questionData.hasAttempted ? (
          <>
            <View style={styles.timerCard}>
              <Ionicons name="time" size={20} color={timeLeft < 30 ? "#F44336" : "#fff"} />
              <Text style={[styles.timerText, timeLeft < 30 && styles.timerWarning]}>
                {formatTime(timeLeft)}
              </Text>
            </View>
            <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
              <Ionicons name="refresh" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.timerProgressContainer}>
              <Animated.View 
                style={[
                  styles.timerProgress,
                  {
                    width: `${(timeLeft / questionData.timeLimit) * 100}%`,
                    backgroundColor: timeLeft < 30 ? "#F44336" : "#fff"
                  }
                ]} 
              />
            </View>
            {/* Add countdown display */}
            <Text style={styles.countdownText}>
              {timeLeft} seconds remaining
            </Text>
          </>
        ) : (
          <>
            <View style={styles.completedCard}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.completedText}>Question Completed</Text>
            </View>
            <Text style={styles.completedSubtext}>
              You have already answered this question
            </Text>
          </>
        )}
      </View>

      {/* Question Container */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{questionData.question}</Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {questionData.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={getOptionStyle(index)}
            onPress={() => handleOptionSelect(index)}
            disabled={questionData.hasAttempted}
            activeOpacity={0.8}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionNumber}>
                <Text style={styles.optionNumberText}>{String.fromCharCode(65 + index)}</Text>
              </View>
              <Text style={getOptionTextStyle(index)}>
                {option}
              </Text>
              {getOptionIcon(index)}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Result Section */}
      {showResult && (
        <Animated.View 
          style={[styles.resultContainer]}
        >
          <View style={styles.resultContent}>
            {questionData?.isCorrect ? (
              <>
                {/* Victory Celebration */}
                <View style={styles.victoryContainer}>
                  <View style={styles.victoryIconContainer}>
                    <Ionicons name="trophy" size={48} color="#FFD700" />
                  </View>
                  <Text style={[styles.resultTitle, { color: '#4CAF50' }]}>🎉 Correct! 🎉</Text>
                  <Text style={styles.resultSubtext}>Excellent! You got it right!</Text>
                  <View style={styles.celebrationContainer}>
                    <Text style={styles.celebrationText}>🏆 Great Job! 🏆</Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                {/* Wrong Answer Result */}
                <View style={styles.wrongAnswerContainer}>
                  <View style={styles.resultIconContainer}>
                    <Ionicons name="close-circle" size={48} color="#F44336" />
                  </View>
                  <Text style={[styles.resultTitle, { color: '#F44336' }]}>Incorrect!</Text>
                  <Text style={styles.resultSubtext}>
                    Your answer: <Text style={styles.userAnswerText}>
                      {questionData.options[questionData.selectedOption || 0]}
                    </Text>
                  </Text>
                  <Text style={styles.correctAnswerText}>
                    Correct answer: <Text style={styles.correctAnswerHighlight}>
                      {questionData.options[questionData.correct || 0]}
                    </Text>
                  </Text>
                </View>
              </>
            )}
            
            {/* Show "Already Attempted" message if previously answered */}
            {questionData?.hasAttempted && (
              <View style={styles.attemptedMessageContainer}>
                <Text style={styles.attemptedMessage}>
                  You have already attempted this question today
                </Text>
                <Text style={styles.attemptedSubtext}>
                  Come back tomorrow for a new question!
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  noQuestionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noQuestionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  noQuestionSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(160, 142, 254, 0.1)',
    borderRadius: 12,
    padding: 10,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(160, 142, 254, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(160, 142, 254, 0.2)',
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a08efe',
    marginLeft: 8,
  },
  timerWarning: {
    color: '#F44336',
  },
  timerProgressContainer: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    marginLeft: 15,
    overflow: 'hidden',
  },
  timerProgress: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  questionContainer: {
    marginBottom: 24,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 80,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 10,
  },
  optionButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedOption: {
    backgroundColor: '#fff',
    borderColor: '#a08efe',
  },
  correctOption: {
    backgroundColor: '#fff',
    borderColor: '#4CAF50',
  },
  incorrectOption: {
    backgroundColor: '#fff',
    borderColor: '#F44336',
  },
  disabledOption: {
    backgroundColor: '#fff',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  selectedOptionText: {
    color: '#a08efe',
    fontWeight: '600',
  },
  correctOptionText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  incorrectOptionText: {
    color: '#F44336',
    fontWeight: '600',
  },
  disabledOptionText: {
    color: '#999',
    fontWeight: '400',
  },
  resultContainer: {
    marginTop: 24,
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  resultContent: {
    alignItems: 'center',
  },
  resultIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 12,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  resultSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    textAlign: 'center',
  },
  timerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optionNumber: {
    backgroundColor: 'rgba(160, 142, 254, 0.2)',
    borderRadius: 10,
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  optionNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#a08efe',
  },
  countdownText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: 'rgba(160, 142, 254, 0.2)',
    borderRadius: 20,
    padding: 8,
    marginLeft: 10,
  },
  victoryContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  victoryIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 12,
    marginBottom: 16,
  },
  celebrationContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },
  celebrationText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
  },
  wrongAnswerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  userAnswerText: {
    fontWeight: 'bold',
    color: '#F44336',
  },
  correctAnswerText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    textAlign: 'center',
  },
  correctAnswerHighlight: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  attemptedMessageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  attemptedMessage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
    textAlign: 'center',
  },
  attemptedSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    textAlign: 'center',
  },
  completedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  completedSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    textAlign: 'center',
  },
  debugContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  debugText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
});

export default QuestionOfTheDay; 