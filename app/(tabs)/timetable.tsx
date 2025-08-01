import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Animated, LayoutAnimation, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import { apiFetchAuth } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatTime(dateString: string) {
  const date = new Date(dateString);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const mins = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${mins} ${ampm}`;
}

function formatTimeShort(dateString: string) {
  const date = new Date(dateString);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  hours = hours % 12;
  hours = hours ? hours : 12;
  const mins = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${mins}`;
}

// Helper to get week days from a start date
function getWeekDays(startDate: Date) {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

// Get calendar days for current month
function getCalendarDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + i);
    days.push(day);
  }
  return days;
}

// Faint background colors for schedule cards
const scheduleBackgroundColors = [
  '#f0f4ff', // Light blue
  '#fff0f4', // Light pink
  '#f0fff4', // Light green
  '#fff4f0', // Light orange
  '#f4f0ff', // Light purple
  '#fffff0', // Light yellow
  '#f0ffff', // Light cyan
  '#fff0f0', // Light red
];

export default function TimetableScreen() {
  const { user } = useAuth();
  const [timetables, setTimetables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<{ [id: string]: boolean }>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline'>('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Time picker states
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [activeTimeSlot, setActiveTimeSlot] = useState<number>(-1);
  const [activeTimeType, setActiveTimeType] = useState<'start' | 'end'>('start');

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isWeekly, setIsWeekly] = useState(false);
  const [slots, setSlots] = useState<any[]>([{
    day: 1,
    startTime: '',
    endTime: '',
    subject: '',
    topic: '',
    notes: '',
    reminder: false,
  }]);

  const calendarDays = getCalendarDays(currentMonth);
  const weekDays = getWeekDays(selectedDate);

  // Group slots by day
  const slotsByDay = weekDays.map(day => ({
    date: day,
    slots: timetables.flatMap(t => t.slots.filter((s: any) => {
      const slotDate = new Date(s.startTime);
      return slotDate.toDateString() === day.toDateString();
    }))
  }));

  // Get selected date's slots
  const selectedDateSlots = timetables.flatMap(t => t.slots.filter((s: any) => {
    const slotDate = new Date(s.startTime);
    return (
      slotDate.getFullYear() === selectedDate.getFullYear() &&
      slotDate.getMonth() === selectedDate.getMonth() &&
      slotDate.getDate() === selectedDate.getDate()
    );
  })).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // Get upcoming plans (next 7 days)
  const upcomingPlans = timetables.flatMap(t => t.slots.filter((s: any) => {
    const slotDate = new Date(s.startTime);
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    return slotDate >= today && slotDate <= nextWeek;
  })).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).slice(0, 3);

  useEffect(() => {
    fetchTimetable();
    // Simple fade animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchTimetable = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetchAuth('/student/timetable', user?.token || '');
      if (res.ok) {
        setTimetables(res.data);
      } else {
        setError('Failed to load timetable');
      }
    } catch (e) {
      setError('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddSlot = () => {
    setSlots(prev => [...prev, {
      day: 1,
      startTime: '',
      endTime: '',
      subject: '',
      topic: '',
      notes: '',
      reminder: false,
    }]);
  };

  const handleRemoveSlot = (idx: number) => {
    setSlots(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSlotChange = (idx: number, key: string, value: any) => {
    setSlots(prev => prev.map((slot, i) => i === idx ? { ...slot, [key]: value } : slot));
  };

  // Time picker handlers
  const handleTimePress = (slotIndex: number, timeType: 'start' | 'end') => {
    console.log('Time pressed:', slotIndex, timeType);
    setActiveTimeSlot(slotIndex);
    setActiveTimeType(timeType);
    if (timeType === 'start') {
      console.log('Setting showStartTimePicker to true');
      setShowStartTimePicker(true);
    } else {
      console.log('Setting showEndTimePicker to true');
      setShowEndTimePicker(true);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
      setShowEndTimePicker(false);
    }

    if (selectedTime && activeTimeSlot >= 0) {
      const timeString = selectedTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      const key = activeTimeType === 'start' ? 'startTime' : 'endTime';
      handleSlotChange(activeTimeSlot, key, timeString);
    }
  };

  // Get current time value for picker
  const getCurrentTimeValue = () => {
    if (activeTimeSlot >= 0) {
      const slot = slots[activeTimeSlot];
      const timeString = activeTimeType === 'start' ? slot.startTime : slot.endTime;
      
      if (timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
      }
    }
    return new Date();
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setIsWeekly(false);
    setSlots([{
      day: 1,
      startTime: '',
      endTime: '',
      subject: '',
      topic: '',
      notes: '',
      reminder: false,
    }]);
  };

  const handleCreateTimetable = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a timetable name');
      return;
    }

    setCreating(true);
    try {
      const res = await apiFetchAuth('/student/timetable', user?.token || '', {
        method: 'POST',
        body: {
          name,
          description,
          isWeekly,
          slots: slots.filter(s => s.subject.trim() && s.startTime && s.endTime)
        }
      });

      if (res.ok) {
        Alert.alert('Success', 'Timetable created successfully!');
        setModalVisible(false);
        resetForm();
        fetchTimetable();
      } else {
        Alert.alert('Error', res.data?.message || 'Failed to create timetable');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to create timetable');
    } finally {
      setCreating(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelectedDate = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const hasEvents = (date: Date) => {
    return timetables.some(t => t.slots.some((s: any) => {
      const slotDate = new Date(s.startTime);
      return (
        slotDate.getFullYear() === date.getFullYear() &&
        slotDate.getMonth() === date.getMonth() &&
        slotDate.getDate() === date.getDate()
      );
    }));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a08efe" />
        <Text style={styles.loadingText}>Loading your schedule...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Simple Month Selector */}
      <View style={styles.simpleHeader}>
        <TouchableOpacity 
          style={styles.monthNavButton}
          onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
        >
          <Ionicons name="chevron-back" size={20} color="#a08efe" />
        </TouchableOpacity>
        
        <Text style={styles.currentMonthText}>
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
        
        <TouchableOpacity 
          style={styles.monthNavButton}
          onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
        >
          <Ionicons name="chevron-forward" size={20} color="#a08efe" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {viewMode === 'calendar' ? (
          <Animated.View style={[styles.calendarContent, { opacity: fadeAnim }]}>
            {/* Calendar Grid */}
            <View style={styles.calendarContainer}>
              {/* Day Headers */}
              <View style={styles.dayHeaders}>
                {shortDayNames.map((day, index) => (
                  <View key={index} style={styles.dayHeader}>
                    <Text style={styles.dayHeaderText}>{day}</Text>
                  </View>
                ))}
              </View>

              {/* Calendar Days */}
              <View style={styles.calendarGrid}>
                {calendarDays.map((date, index) => {
                  const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                  const isTodayDate = isToday(date);
                  const isSelectedDateValue = isSelectedDate(date);
                  const hasEventsOnDate = hasEvents(date);
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.calendarDay,
                        isTodayDate && styles.calendarDayToday,
                        isSelectedDateValue && styles.calendarDaySelected,
                        !isCurrentMonth && styles.calendarDayOtherMonth
                      ]}
                      onPress={() => setSelectedDate(date)}
                    >
                      <Text style={[
                        styles.calendarDayText,
                        isTodayDate && styles.calendarDayTextToday,
                        isSelectedDateValue && styles.calendarDayTextSelected,
                        !isCurrentMonth && styles.calendarDayTextOtherMonth
                      ]}>
                        {date.getDate()}
                      </Text>
                      {hasEventsOnDate && <View style={styles.eventDot} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Today's Plan Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Ionicons name="today" size={20} color="#a08efe" />
                  <Text style={styles.sectionTitle}>Today's Schedule</Text>
                </View>
                <TouchableOpacity 
                  style={styles.viewModeButton}
                  onPress={() => setViewMode('timeline')}
                >
                  <Ionicons name="time" size={18} color="#a08efe" />
                  <Text style={styles.viewModeText}>Timeline</Text>
                </TouchableOpacity>
              </View>
              
              {selectedDateSlots.length === 0 ? (
                <View style={styles.emptyPlan}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="calendar-outline" size={48} color="#a08efe" />
                  </View>
                  <Text style={styles.emptyPlanText}>No plans for today</Text>
                  <Text style={styles.emptyPlanSubtext}>Tap the + button to add a schedule</Text>
                </View>
              ) : (
                <View style={styles.planCardsContainer}>
                  {selectedDateSlots.map((slot, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.planCard,
                        { backgroundColor: scheduleBackgroundColors[index % scheduleBackgroundColors.length] }
                      ]}
                    >
                      <View style={styles.planTimeContainer}>
                        <Ionicons name="time" size={16} color="#a08efe" />
                        <Text style={styles.planTimeText}>{formatTime(slot.startTime)}</Text>
                      </View>
                      <View style={styles.planContent}>
                        <Text style={styles.planTitle}>{slot.subject}</Text>
                        {slot.topic && (
                          <Text style={styles.planSubtitle}>{slot.topic}</Text>
                        )}
                        <View style={styles.planLocation}>
                          <Ionicons name="location" size={14} color="#666" />
                          <Text style={styles.planLocationText}>Study Session</Text>
                        </View>
                        <Text style={styles.planNote}>30 minutes ahead of time</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Upcoming Plans Section */}
            {upcomingPlans.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleContainer}>
                    <Ionicons name="calendar" size={20} color="#a08efe" />
                    <Text style={styles.sectionTitle}>Upcoming ({upcomingPlans.length})</Text>
                  </View>
                </View>
                <View style={styles.upcomingContainer}>
                  {upcomingPlans.map((plan, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.upcomingCard,
                        { backgroundColor: scheduleBackgroundColors[index % scheduleBackgroundColors.length] }
                      ]}
                    >
                      <View style={styles.upcomingIcon}>
                        <Ionicons name="calendar" size={20} color="#a08efe" />
                      </View>
                      <View style={styles.upcomingContent}>
                        <Text style={styles.upcomingTitle}>{plan.subject}</Text>
                        <Text style={styles.upcomingDate}>
                          {new Date(plan.startTime).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Animated.View>
        ) : (
          <Animated.View style={[styles.timelineContent, { opacity: fadeAnim }]}>
            {/* Timeline Header */}
            <View style={styles.timelineHeader}>
              <TouchableOpacity onPress={() => setViewMode('calendar')} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#333" />
              </TouchableOpacity>
              <View style={styles.timelineHeaderCenter}>
                <Text style={styles.timelineDate}>
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </Text>
                <Text style={styles.timelineGreeting}>
                  HELLO Today is {dayNames[selectedDate.getDay()]}
                </Text>
              </View>
            </View>

            {/* Timeline */}
            <View style={styles.timelineContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Ionicons name="time" size={20} color="#a08efe" />
                  <Text style={styles.timelineSectionTitle}>Today's Timeline</Text>
                </View>
              </View>
              
              {selectedDateSlots.length === 0 ? (
                <View style={styles.emptyTimeline}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="time-outline" size={48} color="#a08efe" />
                  </View>
                  <Text style={styles.emptyTimelineText}>No plans scheduled</Text>
                  <Text style={styles.emptyTimelineSubtext}>Add a schedule to get started</Text>
                </View>
              ) : (
                                <View style={styles.timelineItemsContainer}>
                  {selectedDateSlots.map((slot, index) => (
                    <View key={index} style={styles.timelineItem}>
                      <View style={styles.timelineMarker}>
                        <View style={styles.timelineDot} />
                        {index < selectedDateSlots.length - 1 && <View style={styles.timelineLine} />}
                      </View>
                      <View style={styles.timelineContent}>
                        <View style={styles.timelineTime}>
                          <Text style={styles.timelineTimeText}>{formatTime(slot.startTime)}</Text>
                        </View>
                        <View 
                          style={[
                            styles.timelineCard,
                            { backgroundColor: scheduleBackgroundColors[index % scheduleBackgroundColors.length] }
                          ]}
                        >
                          <Text style={styles.timelineTitle}>{slot.subject}</Text>
                          {slot.topic && (
                            <Text style={styles.timelineSubtitle}>{slot.topic}</Text>
                          )}
                          <View style={styles.timelineLocation}>
                            <Ionicons name="location" size={14} color="#666" />
                            <Text style={styles.timelineLocationText}>Study Session</Text>
                          </View>
                          <Text style={styles.timelineNote}>30 minutes ahead of time</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <LinearGradient
          colors={['#a08efe', '#7c3aed']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Add Timetable Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Schedule</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Time Pickers - Inside Modal */}
            {showStartTimePicker && (
              <View style={styles.modalTimePickerOverlay}>
                <View style={styles.modalTimePickerContainer}>
                  <View style={styles.timePickerHeader}>
                    <TouchableOpacity onPress={() => setShowStartTimePicker(false)}>
                      <Text style={styles.timePickerCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.timePickerTitle}>Start Time</Text>
                    <TouchableOpacity onPress={() => setShowStartTimePicker(false)}>
                      <Text style={styles.timePickerDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={getCurrentTimeValue()}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={handleTimeChange}
                    textColor="#333"
                    style={styles.timePickerComponent}
                  />
                </View>
              </View>
            )}
            
            {showEndTimePicker && (
              <View style={styles.modalTimePickerOverlay}>
                <View style={styles.modalTimePickerContainer}>
                  <View style={styles.timePickerHeader}>
                    <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                      <Text style={styles.timePickerCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.timePickerTitle}>End Time</Text>
                    <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                      <Text style={styles.timePickerDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={getCurrentTimeValue()}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={handleTimeChange}
                    textColor="#333"
                    style={styles.timePickerComponent}
                  />
                </View>
              </View>
            )}

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Schedule Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter schedule name"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Add a description"
                  value={description}
                  onChangeText={setDescription}
                  placeholderTextColor="#999"
                  multiline
                />
              </View>
              
              <View style={styles.switchContainer}>
                <View style={styles.switchLabelContainer}>
                  <Ionicons name="repeat" size={20} color="#a08efe" />
                  <Text style={styles.switchLabel}>Repeat Weekly</Text>
                </View>
                <Switch 
                  value={isWeekly} 
                  onValueChange={setIsWeekly} 
                  thumbColor={isWeekly ? '#a08efe' : '#f4f3f4'} 
                  trackColor={{ true: '#e0d5ff', false: '#f4f3f4' }} 
                />
              </View>
              
              <Text style={styles.sectionTitle}>Study Sessions</Text>
              
              {slots.map((slot, idx) => (
                <View key={idx} style={styles.slotFormCard}>
                  <View style={styles.slotFormHeader}>
                    <Text style={styles.slotFormTitle}>Session {idx + 1}</Text>
                    {slots.length > 1 && (
                      <TouchableOpacity onPress={() => handleRemoveSlot(idx)} style={styles.removeSlotBtn}>
                        <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Day</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayPillRow}>
                      {dayNames.map((d, i) => (
                        <TouchableOpacity
                          key={i}
                          style={[styles.dayPill, slot.day === i && styles.dayPillActive]}
                          onPress={() => handleSlotChange(idx, 'day', i)}
                        >
                          <Text style={[styles.dayPillText, slot.day === i && styles.dayPillTextActive]}>
                            {d.slice(0, 3)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  
                  <View style={styles.timeRow}>
                    <View style={styles.timeInputGroup}>
                      <Text style={styles.inputLabel}>Start Time</Text>
                      <TouchableOpacity
                        style={styles.timeInput}
                        onPress={() => handleTimePress(idx, 'start')}
                      >
                        <Text style={slot.startTime ? styles.timeText : styles.timePlaceholder}>
                          {slot.startTime || '09:00'}
                        </Text>
                        <Ionicons name="time" size={20} color="#a08efe" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.timeInputGroup}>
                      <Text style={styles.inputLabel}>End Time</Text>
                      <TouchableOpacity
                        style={styles.timeInput}
                        onPress={() => handleTimePress(idx, 'end')}
                      >
                        <Text style={slot.endTime ? styles.timeText : styles.timePlaceholder}>
                          {slot.endTime || '10:30'}
                        </Text>
                        <Ionicons name="time" size={20} color="#a08efe" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Subject</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Mathematics"
                      value={slot.subject}
                      onChangeText={v => handleSlotChange(idx, 'subject', v)}
                      placeholderTextColor="#999"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Topic</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Algebra"
                      value={slot.topic}
                      onChangeText={v => handleSlotChange(idx, 'topic', v)}
                      placeholderTextColor="#999"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Notes</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Additional notes..."
                      value={slot.notes}
                      onChangeText={v => handleSlotChange(idx, 'notes', v)}
                      placeholderTextColor="#999"
                      multiline
                    />
                  </View>
                  
                  <View style={styles.switchContainer}>
                    <View style={styles.switchLabelContainer}>
                      <Ionicons name="notifications" size={20} color="#a08efe" />
                      <Text style={styles.switchLabel}>Set Reminder</Text>
                    </View>
                    <Switch 
                      value={slot.reminder} 
                      onValueChange={v => handleSlotChange(idx, 'reminder', v)} 
                      thumbColor={slot.reminder ? '#a08efe' : '#f4f3f4'} 
                      trackColor={{ true: '#e0d5ff', false: '#f4f3f4' }} 
                    />
                  </View>
                </View>
              ))}
              
              <TouchableOpacity style={styles.addSlotBtn} onPress={handleAddSlot}>
                <Ionicons name="add-circle" size={24} color="#a08efe" />
                <Text style={styles.addSlotText}>Add Another Session</Text>
              </TouchableOpacity>
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.createBtn} 
                  onPress={handleCreateTimetable} 
                  disabled={creating}
                >
                  <LinearGradient
                    colors={['#a08efe', '#7c3aed']}
                    style={styles.createBtnGradient}
                  >
                    {creating ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={20} color="#fff" />
                        <Text style={styles.createBtnText}>Create Schedule</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.cancelBtn} 
                  onPress={() => { setModalVisible(false); resetForm(); }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  menuButton: {
    padding: 10,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerDate: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#e0e0e0',
  },
  settingsButton: {
    padding: 10,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
  },
  monthNavButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  simpleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#F6F8FB',
  },
  currentMonthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  monthItem: {
    alignItems: 'center',
    marginRight: 15,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e0e0e0',
  },
  monthTextActive: {
    color: '#fff',
  },
  monthItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  calendarContent: {
    paddingBottom: 80,
  },
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  dayHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  dayHeader: {
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%', // 7 days in a week
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  calendarDayText: {
    fontSize: 14,
    color: '#333',
  },
  calendarDayTextToday: {
    color: '#fff',
    fontWeight: 'bold',
  },
  calendarDayTextSelected: {
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    padding: 5,
  },
  calendarDayTextOtherMonth: {
    color: '#ccc',
  },
  calendarDayToday: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 5,
  },
  calendarDaySelected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  eventDot: {
    width: 8,
    height: 8,
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
    marginTop: 5,
  },
  eventIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventCount: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 16,
    marginBottom: 10,
    marginLeft: 10,
  },
  viewModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  viewModeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  emptyPlan: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyPlanGradient: {
    backgroundColor: '#f8f9ff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  emptyPlanText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 10,
  },
  emptyPlanSubtext: {
    fontSize: 12,
    color: '#e0e0e0',
    marginTop: 5,
  },
  planCardsContainer: {
    backgroundColor: 'transparent',
  },
  planCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  planCardGradient: {
    borderRadius: 12,
    padding: 12,
  },
  planTimeContainer: {
    width: 60,
    alignItems: 'center',
    position: 'absolute',
    left: -30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  planTimeText: {
    fontSize: 12,
    color: '#fff',
    marginTop: 5,
  },
  planContent: {
    flex: 1,
    marginLeft: 60,
    padding: 12,
  },
  planTitle: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 15,
    marginBottom: 4,
  },
  planSubtitle: {
    color: '#666',
    fontSize: 12,
    marginBottom: 8,
  },
  planLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  planLocationText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 8,
  },
  planNote: {
    fontSize: 12,
    color: '#888',
  },
  reminderBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  upcomingContainer: {
    backgroundColor: 'transparent',
  },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  upcomingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(160, 142, 254, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  upcomingIconGradient: {
    borderRadius: 20,
    padding: 10,
  },
  upcomingContent: {
    flex: 1,
  },
  upcomingTitle: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 15,
    marginBottom: 2,
  },
  upcomingDate: {
    fontSize: 12,
    color: '#666',
  },
  upcomingArrow: {
    marginLeft: 'auto',
    padding: 5,
  },
  timelineContent: {
    paddingBottom: 80,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  backButton: {
    padding: 10,
  },
  timelineHeaderCenter: {
    alignItems: 'center',
  },
  timelineDate: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  timelineGreeting: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  timelineSectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 16,
    marginBottom: 10,
    marginLeft: 10,
  },
  timelineContainer: {
    backgroundColor: 'transparent', // Make it transparent
    borderRadius: 15,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  timelineItemsContainer: {
    backgroundColor: 'transparent',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  timelineMarker: {
    width: 60,
    alignItems: 'center',
    position: 'absolute',
    left: -30,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  timelineLine: {
    width: 1,
    height: '100%',
    backgroundColor: '#eee',
    position: 'absolute',
    left: 29,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 60,
  },
  timelineTime: {
    width: 60,
    alignItems: 'center',
    position: 'absolute',
    left: -30,
  },
  timelineTimeText: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  timelineCard: {
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  timelineTitle: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 15,
    marginBottom: 4,
  },
  timelineSubtitle: {
    color: '#666',
    fontSize: 12,
    marginBottom: 8,
  },
  timelineLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  timelineLocationText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 8,
  },
  timelineNote: {
    fontSize: 12,
    color: '#ccc',
  },
  emptyTimeline: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTimelineGradient: {
    backgroundColor: '#f8f9ff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  emptyTimelineText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 10,
  },
  emptyTimelineSubtext: {
    fontSize: 12,
    color: '#e0e0e0',
    marginTop: 5,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 36,
    backgroundColor: '#6C63FF',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 12,
    marginHorizontal: 2,
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#f7f7fa',
    borderRadius: 14,
    padding: 14,
    color: '#222',
    fontSize: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalLabel: {
    color: '#6C63FF',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 8,
  },
  modalSectionTitle: {
    fontWeight: 'bold',
    color: '#7366FF',
    fontSize: 16,
    marginTop: 10,
    marginBottom: 6,
  },
  slotFormCard: {
    backgroundColor: '#F9F9FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#eee',
  },
  inputLabel: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 4,
    marginTop: 10,
    marginLeft: 2,
  },
  dayPillRow: {
    flexDirection: 'row',
    marginBottom: 12,
    marginTop: 2,
  },
  dayPill: {
    backgroundColor: '#f3eaff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dayPillActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  dayPillText: {
    color: '#7366FF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  dayPillTextActive: {
    color: '#fff',
  },
  addSlotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  addSlotText: {
    color: '#6C63FF',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 15,
  },
  removeSlotBtn: {
    marginLeft: 'auto',
    padding: 4,
  },
  createBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 4,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    textAlign: 'center',
    paddingVertical: 14,
    letterSpacing: 1,
  },
  cancelBtn: {
    alignItems: 'center',
    marginTop: 8,
  },
  cancelBtnText: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F8FB',
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F8FB',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#f7f7fa',
    borderRadius: 14,
    padding: 14,
    color: '#222',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    color: '#6C63FF',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  modalActions: {
    marginTop: 16,
  },
  createBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
  },
  enhancedCreateBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    marginLeft: 8,
    letterSpacing: 1,
  },
  fabGradient: {
    position: 'absolute',
    right: 24,
    bottom: 36,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  enhancedFab: {
    position: 'absolute',
    right: 24,
    bottom: 36,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  enhancedDayPill: {
    backgroundColor: '#f3eaff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  enhancedDayPillActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  enhancedDayPillText: {
    color: '#7366FF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  enhancedDayPillTextActive: {
    color: '#fff',
  },
  dateItemActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  weeklyContent: {
    paddingBottom: 80,
  },
  daysRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  slotTimeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  calendarDayOtherMonth: {
    opacity: 0.3,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalContent: {
    paddingBottom: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  slotFormCard: {
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#eee',
  },
  slotFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  slotFormTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#333',
  },
  removeSlotBtn: {
    padding: 5,
  },
  dayPillRow: {
    flexDirection: 'row',
    marginTop: 5,
  },
  dayPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  dayPillActive: {
    backgroundColor: '#a08efe',
  },
  dayPillText: {
    fontSize: 12,
    color: '#666',
  },
  dayPillTextActive: {
    color: '#fff',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  timeInputGroup: {
    flex: 1,
    marginRight: 10,
  },
  addSlotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginVertical: 10,
  },
  addSlotText: {
    color: '#a08efe',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  createBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  createBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelBtnText: {
    color: '#666',
    fontSize: 16,
  },
  emptyIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
    padding: 10,
    marginBottom: 10,
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f7f7fa',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  timeText: {
    color: '#222',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timePlaceholder: {
    color: '#999',
    fontSize: 16,
  },
  timePickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  timePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    minWidth: 300,
    maxWidth: 350,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  timePickerCancel: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  timePickerTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#333',
  },
  timePickerDone: {
    color: '#a08efe',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000, // Ensure it's above other content
  },
  timePickerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalTimePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000, // Ensure it's above other content
  },
  modalTimePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    minWidth: 300,
    maxWidth: 350,
    minHeight: 200,
  },
  timePickerComponent: {
    width: '100%',
    height: '100%',
  },
});
