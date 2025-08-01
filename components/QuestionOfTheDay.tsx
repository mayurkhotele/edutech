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
    if (timeLeft > 0 && !isAnswered) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
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

  const getOptionTextStyle = (index: number) => {
    if (!isAnswered) {
      return [
        styles.optionText,
        selectedOption === index && styles.selectedOptionText,
      ];
    }

    if (index === questionData?.correct) {
      return [styles.optionText, styles.correctOptionText];
    } else if (selectedOption === index && index !== questionData?.correct) {
      return [styles.optionText, styles.incorrectOptionText];
    }
    
    return [styles.optionText, styles.disabledOptionText];
  };

  const getOptionIcon = (index: number) => {
    if (!isAnswered) return null;
    
    if (index === questionData?.correct) {
      return <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />;
    } else if (selectedOption === index && index !== questionData?.correct) {
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
        <View style={styles.timerCard}>
          <Ionicons name="time" size={20} color={timeLeft < 30 ? "#F44336" : "#fff"} />
          <Text style={[styles.timerText, timeLeft < 30 && styles.timerWarning]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
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
            disabled={isAnswered}
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
            {selectedOption === questionData.correct ? (
              <>
                <View style={styles.resultIconContainer}>
                  <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
                </View>
                <Text style={[styles.resultTitle, { color: '#4CAF50' }]}>Correct!</Text>
                <Text style={styles.resultSubtext}>Great job! You got it right.</Text>
              </>
            ) : (
              <>
                <View style={styles.resultIconContainer}>
                  <Ionicons name="close-circle" size={48} color="#F44336" />
                </View>
                <Text style={[styles.resultTitle, { color: '#F44336' }]}>Incorrect!</Text>
                <Text style={styles.resultSubtext}>
                  The correct answer was: <Text style={{ fontWeight: 'bold' }}>
                    {questionData.options[questionData.correct]}
                  </Text>
                </Text>
              </>
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
});

export default QuestionOfTheDay; 