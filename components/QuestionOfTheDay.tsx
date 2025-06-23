import { AppColors } from '@/constants/Colors';
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
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);
  const timerAnim = new Animated.Value(1);

  useEffect(() => {
    fetchQuestionOfTheDay();
  }, []);

  useEffect(() => {
    if (questionData) {
      setTimeLeft(questionData.timeLimit);
      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [questionData]);

  useEffect(() => {
    if (timeLeft > 0 && !isAnswered) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
        // Animate timer progress
        Animated.timing(timerAnim, {
          toValue: (timeLeft - 1) / (questionData?.timeLimit || 10),
          duration: 1000,
          useNativeDriver: false,
        }).start();
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isAnswered) {
      handleTimeout();
    }
  }, [timeLeft, isAnswered]);

  const fetchQuestionOfTheDay = async () => {
    if (!user?.token) {
      console.log('No user token available');
      setLoading(false);
      return;
    }
    
    try {
      console.log('Fetching question of the day...');
      setLoading(true);
      const response = await apiFetchAuth('/student/question-of-the-day', user.token);
      console.log('API Response:', response);
      if (response.ok) {
        setQuestionData(response.data);
        if (response.data.hasAttempted) {
          setIsAnswered(true);
        }
      }
    } catch (error) {
      console.error('Error fetching question of the day:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (optionIndex: number) => {
    if (isAnswered || selectedOption !== null) return;
    
    setSelectedOption(optionIndex);
    setIsAnswered(true);
    
    // Show result after a short delay
    setTimeout(() => {
      setShowResult(true);
    }, 500);
  };

  const handleTimeout = () => {
    setIsAnswered(true);
    setShowResult(true);
  };

  const getOptionStyle = (index: number) => {
    if (!isAnswered) {
      return [
        styles.optionButton,
        selectedOption === index && styles.selectedOption,
      ];
    }

    if (index === questionData?.correct) {
      return [styles.optionButton, styles.correctOption];
    } else if (selectedOption === index && index !== questionData?.correct) {
      return [styles.optionButton, styles.incorrectOption];
    }
    
    return [styles.optionButton, styles.disabledOption];
  };

  const getOptionIcon = (index: number) => {
    if (!isAnswered) return null;
    
    if (index === questionData?.correct) {
      return <Ionicons name="checkmark-circle" size={20} color={AppColors.success} />;
    } else if (selectedOption === index && index !== questionData?.correct) {
      return <Ionicons name="close-circle" size={20} color={AppColors.error} />;
    }
    return null;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Add a simple test render to see if component is working
  console.log('QuestionOfTheDay component rendering, loading:', loading, 'questionData:', questionData);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.loadingText}>Loading Question of the Day...</Text>
        </View>
      </View>
    );
  }

  if (!questionData) {
    return (
      <View style={styles.container}>
        <View style={styles.noQuestionContainer}>
          <Ionicons name="bulb-outline" size={48} color={AppColors.grey} />
          <Text style={styles.noQuestionText}>Question of the Day</Text>
          <Text style={styles.noQuestionSubtext}>Loading or no question available</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={fetchQuestionOfTheDay}
          >
            <Ionicons name="refresh" size={16} color={AppColors.white} />
            <Text style={styles.refreshButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!questionData.isActive) {
    return (
      <View style={styles.container}>
        <View style={styles.noQuestionContainer}>
          <Ionicons name="calendar-outline" size={48} color={AppColors.grey} />
          <Text style={styles.noQuestionText}>No Question Available</Text>
          <Text style={styles.noQuestionSubtext}>Check back tomorrow for a new question!</Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="bulb-outline" size={24} color={AppColors.primary} />
          <Text style={styles.headerTitle}>Question of the Day</Text>
        </View>
        
        {/* Timer */}
        <View style={styles.timerContainer}>
          <Ionicons name="time-outline" size={16} color={AppColors.primary} />
          <Text style={[
            styles.timerText,
            timeLeft <= 5 && styles.timerWarning
          ]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
      </View>

      {/* Timer Progress Bar */}
      <View style={styles.timerProgressContainer}>
        <Animated.View 
          style={[
            styles.timerProgress,
            {
              width: timerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            }
          ]}
        />
      </View>

      {/* Question */}
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
            disabled={isAnswered}
            activeOpacity={0.7}
          >
            <View style={styles.optionContent}>
              <Text style={[
                styles.optionText,
                selectedOption === index && styles.selectedOptionText,
                isAnswered && index === questionData.correct && styles.correctOptionText,
                isAnswered && selectedOption === index && index !== questionData.correct && styles.incorrectOptionText,
              ]}>
                {option}
              </Text>
              {getOptionIcon(index)}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Result */}
      {showResult && (
        <Animated.View 
          style={[
            styles.resultContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
          <View style={styles.resultContent}>
            {selectedOption === questionData.correct ? (
              <>
                <Ionicons name="trophy" size={32} color={AppColors.success} />
                <Text style={styles.resultTitle}>Correct!</Text>
                <Text style={styles.resultSubtext}>Great job! You got it right.</Text>
              </>
            ) : (
              <>
                <Ionicons name="close-circle" size={32} color={AppColors.error} />
                <Text style={styles.resultTitle}>Incorrect</Text>
                <Text style={styles.resultSubtext}>
                  The correct answer was: {questionData.options[questionData.correct]}
                </Text>
              </>
            )}
          </View>
        </Animated.View>
      )}

      {/* Refresh Button */}
      {isAnswered && (
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={fetchQuestionOfTheDay}
        >
          <Ionicons name="refresh" size={16} color={AppColors.white} />
          <Text style={styles.refreshButtonText}>Next Question</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    margin: 15,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(20px)',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: AppColors.grey,
  },
  noQuestionContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noQuestionText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.grey,
    marginTop: 10,
  },
  noQuestionSubtext: {
    fontSize: 14,
    color: AppColors.grey,
    marginTop: 8,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.darkGrey,
    marginLeft: 10,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.primary,
    marginLeft: 6,
  },
  timerWarning: {
    color: AppColors.error,
  },
  timerProgressContainer: {
    height: 6,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 3,
    marginBottom: 24,
    overflow: 'hidden',
  },
  timerProgress: {
    height: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: 3,
  },
  questionContainer: {
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.darkGrey,
    lineHeight: 26,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedOption: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  correctOption: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: AppColors.success,
  },
  incorrectOption: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderColor: AppColors.error,
  },
  disabledOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: AppColors.darkGrey,
    flex: 1,
  },
  selectedOptionText: {
    color: AppColors.white,
    fontWeight: '600',
  },
  correctOptionText: {
    color: AppColors.success,
    fontWeight: '600',
  },
  incorrectOptionText: {
    color: AppColors.error,
    fontWeight: '600',
  },
  resultContainer: {
    marginTop: 24,
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  resultContent: {
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.darkGrey,
    marginTop: 12,
  },
  resultSubtext: {
    fontSize: 16,
    color: AppColors.grey,
    marginTop: 8,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  refreshButtonText: {
    color: AppColors.white,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default QuestionOfTheDay; 