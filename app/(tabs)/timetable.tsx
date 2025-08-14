import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Animated, LayoutAnimation, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    <SafeAreaView style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.fixedHeader}>
        {/* Compact Month Selector */}
        <View style={styles.compactMonthSelector}>
          <TouchableOpacity 
            style={styles.monthNavButton}
            onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
          >
            <Ionicons name="chevron-back" size={20} color="#6C63FF" />
          </TouchableOpacity>
          
          <Text style={styles.currentMonthText}>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          
          <TouchableOpacity 
            style={styles.monthNavButton}
            onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
          >
            <Ionicons name="chevron-forward" size={20} color="#6C63FF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchTimetable} />}>
        {viewMode === 'calendar' ? (
          <Animated.View style={[styles.calendarContent, { opacity: fadeAnim }]}>
            {/* Compact Calendar Grid */}
            <View style={styles.compactCalendarContainer}>
              {/* Day Headers */}
              <View style={styles.dayHeaders}>
                {shortDayNames.map((day, index) => (
                  <View key={index} style={styles.dayHeader}>
                    <Text style={styles.dayHeaderText}>{day}</Text>
                  </View>
                ))}
              </View>

              {/* Compact Calendar Days */}
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
                        styles.compactCalendarDay,
                        isTodayDate && styles.calendarDayToday,
                        isSelectedDateValue && styles.calendarDaySelected,
                        !isCurrentMonth && styles.calendarDayOtherMonth
                      ]}
                      onPress={() => setSelectedDate(date)}
                    >
                      <Text style={[
                        styles.compactCalendarDayText,
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

            {/* Enhanced Today's Schedule Section */}
            <View style={styles.enhancedSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <LinearGradient
                    colors={['#6C63FF', '#FF6CAB']}
                    style={styles.sectionIconContainer}
                  >
                    <Ionicons name="calendar" size={20} color="#fff" />
                  </LinearGradient>
                  <View>
                    <Text style={styles.enhancedSectionTitle}>Today's Schedule</Text>
                    <Text style={styles.sectionSubtitle}>
                      {selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.viewModeButton}
                  onPress={() => setViewMode('timeline')}
                >
                  <Ionicons name="time" size={16} color="#6C63FF" />
                  <Text style={styles.viewModeText}>Timeline</Text>
                </TouchableOpacity>
              </View>
              
              {selectedDateSlots.length === 0 ? (
                <View style={styles.enhancedEmptyPlan}>
                  <LinearGradient
                    colors={['rgba(108, 99, 255, 0.05)', 'rgba(255, 108, 171, 0.05)']}
                    style={styles.emptyPlanGradient}
                  >
                  <View style={styles.emptyIconContainer}>
                      <Ionicons name="calendar-outline" size={48} color="#6C63FF" />
                  </View>
                  <Text style={styles.emptyPlanText}>No plans for today</Text>
                  <Text style={styles.emptyPlanSubtext}>Tap the + button to add a schedule</Text>
                    <TouchableOpacity 
                      style={styles.addFirstPlanButton}
                      onPress={() => setModalVisible(true)}
                    >
                      <LinearGradient
                        colors={['#6C63FF', '#FF6CAB']}
                        style={styles.addFirstPlanGradient}
                      >
                        <Ionicons name="add" size={18} color="#fff" />
                        <Text style={styles.addFirstPlanText}>Add Your First Plan</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              ) : (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.eventsSlider}
                  contentContainerStyle={styles.eventsSliderContent}
                >
                  {selectedDateSlots.map((slot, index) => {
                    // Different background colors for variety
                    const backgroundColors: [string, string][] = [
                      ['rgba(108, 99, 255, 0.08)', 'rgba(255, 108, 171, 0.08)'],
                      ['rgba(255, 108, 171, 0.08)', 'rgba(255, 212, 82, 0.08)'],
                      ['rgba(255, 212, 82, 0.08)', 'rgba(108, 99, 255, 0.08)'],
                      ['rgba(76, 175, 80, 0.08)', 'rgba(33, 150, 243, 0.08)'],
                      ['rgba(156, 39, 176, 0.08)', 'rgba(255, 87, 34, 0.08)'],
                    ];
                    const cardColors = backgroundColors[index % backgroundColors.length];
                    
                    return (
                      <View 
                        key={index} 
                        style={styles.sliderEventCard}
                      >
                        <LinearGradient
                          colors={cardColors}
                          style={styles.sliderCardGradient}
                        >
                          <View style={styles.sliderEventHeader}>
                            <LinearGradient
                              colors={['#6C63FF', '#FF6CAB']}
                              style={styles.sliderTimeBadge}
                            >
                              <Ionicons name="time" size={14} color="#fff" />
                              <Text style={styles.sliderTimeText}>{formatTime(slot.startTime)}</Text>
                            </LinearGradient>
                            <View style={styles.sliderStatus}>
                              <View style={styles.sliderStatusDot} />
                              <Text style={styles.sliderStatusText}>Today</Text>
                            </View>
                          </View>
                          <View style={styles.sliderEventContent}>
                            {/* Schedule Name */}
                            {name && (
                              <Text style={styles.sliderScheduleName}>{name}</Text>
                            )}
                            {/* Subject */}
                            <Text style={styles.sliderEventTitle}>{slot.subject}</Text>
                            {/* Topic */}
                            {slot.topic && (
                              <Text style={styles.sliderEventSubtitle}>{slot.topic}</Text>
                            )}
                            {/* Description */}
                            {description && (
                              <View style={styles.sliderEventDescription}>
                                <Ionicons name="document" size={12} color="#6C63FF" />
                                <Text style={styles.sliderDescriptionText} numberOfLines={2}>
                                  {description}
                                </Text>
                              </View>
                            )}
                            {/* Location */}
                            <View style={styles.sliderEventLocation}>
                              <Ionicons name="location" size={12} color="#6C63FF" />
                              <Text style={styles.sliderLocationText}>Study Session</Text>
                            </View>
                            {/* Notes */}
                            {slot.notes && (
                              <View style={styles.sliderEventNotes}>
                                <Ionicons name="document-text" size={12} color="#6C63FF" />
                                <Text style={styles.sliderNotesText} numberOfLines={2}>
                                  {slot.notes}
                                </Text>
                              </View>
                            )}
                            {/* Event Details */}
                            <View style={styles.sliderEventDetails}>
                              <View style={styles.sliderDetailItem}>
                                <Ionicons name="calendar" size={10} color="#666" />
                                <Text style={styles.sliderDetailText}>
                                  {dayNames[slot.day]}
                                </Text>
                              </View>
                              {slot.reminder && (
                                <View style={styles.sliderDetailItem}>
                                  <Ionicons name="notifications" size={10} color="#666" />
                                  <Text style={styles.sliderDetailText}>Reminder</Text>
                                </View>
                              )}
                              {isWeekly && (
                                <View style={styles.sliderDetailItem}>
                                  <Ionicons name="repeat" size={10} color="#666" />
                                  <Text style={styles.sliderDetailText}>Weekly</Text>
                                </View>
                              )}
                            </View>
                            <View style={styles.sliderEventActions}>
                              <TouchableOpacity style={styles.sliderActionButton}>
                                <Ionicons name="notifications-outline" size={14} color="#6C63FF" />
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.sliderActionButton}>
                                <Ionicons name="share-outline" size={14} color="#6C63FF" />
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.sliderActionButton}>
                                <Ionicons name="ellipsis-horizontal" size={14} color="#6C63FF" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </LinearGradient>
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* Enhanced Upcoming Plans Section */}
            {upcomingPlans.length > 0 && (
              <View style={styles.enhancedSection}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleContainer}>
                    <LinearGradient
                      colors={['#FF6CAB', '#FFD452']}
                      style={styles.sectionIconContainer}
                    >
                      <Ionicons name="calendar" size={20} color="#fff" />
                    </LinearGradient>
                    <View>
                      <Text style={styles.enhancedSectionTitle}>Upcoming Plans</Text>
                      <Text style={styles.sectionSubtitle}>{upcomingPlans.length} events this week</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.enhancedUpcomingContainer}>
                  {upcomingPlans.map((plan, index) => (
                    <View 
                      key={index} 
                      style={styles.enhancedUpcomingCard}
                    >
                      <LinearGradient
                        colors={['rgba(255, 108, 171, 0.1)', 'rgba(255, 212, 82, 0.1)']}
                        style={styles.upcomingCardGradient}
                      >
                        <View style={styles.upcomingIcon}>
                          <LinearGradient
                            colors={['#FF6CAB', '#FFD452']}
                            style={styles.upcomingIconGradient}
                          >
                            <Ionicons name="calendar" size={20} color="#fff" />
                          </LinearGradient>
                        </View>
                        <View style={styles.upcomingContent}>
                          <Text style={styles.upcomingTitle}>{plan.subject}</Text>
                          <Text style={styles.upcomingDate}>
                            {new Date(plan.startTime).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              weekday: 'short'
                            })} • {formatTimeShort(plan.startTime)}
                          </Text>
                        </View>
                        <TouchableOpacity style={styles.upcomingArrow}>
                          <Ionicons name="chevron-forward" size={20} color="#FF6CAB" />
                        </TouchableOpacity>
                      </LinearGradient>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Animated.View>
        ) : (
          <Animated.View style={[styles.timelineContent, { opacity: fadeAnim }]}>
            {/* Enhanced Timeline Header */}
            <View style={styles.enhancedTimelineHeader}>
              <TouchableOpacity onPress={() => setViewMode('calendar')} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#6C63FF" />
              </TouchableOpacity>
              <View style={styles.timelineHeaderCenter}>
                <Text style={styles.enhancedTimelineDate}>
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </Text>
                <Text style={styles.enhancedTimelineGreeting}>
                  {dayNames[selectedDate.getDay()]} • {getGreeting()}
                </Text>
              </View>
            </View>

            {/* Enhanced Timeline */}
            <View style={styles.enhancedTimelineContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <LinearGradient
                    colors={['#6C63FF', '#FF6CAB']}
                    style={styles.sectionIconContainer}
                  >
                    <Ionicons name="time" size={20} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.enhancedTimelineSectionTitle}>Today's Timeline</Text>
                </View>
              </View>
              
              {selectedDateSlots.length === 0 ? (
                <View style={styles.enhancedEmptyTimeline}>
                  <LinearGradient
                    colors={['rgba(108, 99, 255, 0.1)', 'rgba(255, 108, 171, 0.1)']}
                    style={styles.emptyTimelineGradient}
                  >
                    <View style={styles.emptyIconContainer}>
                      <Ionicons name="time-outline" size={48} color="#6C63FF" />
                    </View>
                    <Text style={styles.emptyTimelineText}>No plans scheduled</Text>
                    <Text style={styles.emptyTimelineSubtext}>Add a schedule to get started</Text>
                  </LinearGradient>
                </View>
              ) : (
                <View style={styles.enhancedTimelineItemsContainer}>
                  {selectedDateSlots.map((slot, index) => (
                    <View key={index} style={styles.enhancedTimelineItem}>
                      <View style={styles.enhancedTimelineMarker}>
                        <LinearGradient
                          colors={['#6C63FF', '#FF6CAB']}
                          style={styles.enhancedTimelineDot}
                        />
                        {index < selectedDateSlots.length - 1 && <View style={styles.enhancedTimelineLine} />}
                      </View>
                      <View style={styles.enhancedTimelineContent}>
                        <View style={styles.enhancedTimelineTime}>
                          <Text style={styles.enhancedTimelineTimeText}>{formatTime(slot.startTime)}</Text>
                        </View>
                        <View style={styles.enhancedTimelineCard}>
                          <LinearGradient
                            colors={['rgba(108, 99, 255, 0.1)', 'rgba(255, 108, 171, 0.1)']}
                            style={styles.timelineCardGradient}
                          >
                            <Text style={styles.enhancedTimelineTitle}>{slot.subject}</Text>
                            {slot.topic && (
                              <Text style={styles.enhancedTimelineSubtitle}>{slot.topic}</Text>
                            )}
                            <View style={styles.enhancedTimelineLocation}>
                              <Ionicons name="location" size={14} color="#6C63FF" />
                              <Text style={styles.enhancedTimelineLocationText}>Study Session</Text>
                            </View>
                            <View style={styles.enhancedTimelineActions}>
                              <TouchableOpacity style={styles.timelineActionButton}>
                                <Ionicons name="notifications-outline" size={16} color="#6C63FF" />
                                <Text style={styles.timelineActionText}>Remind</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.timelineActionButton}>
                                <Ionicons name="share-outline" size={16} color="#6C63FF" />
                                <Text style={styles.timelineActionText}>Share</Text>
                              </TouchableOpacity>
                            </View>
                          </LinearGradient>
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

      {/* Enhanced Floating Action Button */}
      <TouchableOpacity style={styles.enhancedFab} onPress={() => setModalVisible(true)}>
        <LinearGradient
          colors={['#6C63FF', '#FF6CAB']}
          style={styles.enhancedFabGradient}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  compactMonthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Platform.OS === 'ios' ? -5 : 0,
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  monthNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 2 : 3 },
    shadowOpacity: Platform.OS === 'ios' ? 0.2 : 0.3,
    shadowRadius: Platform.OS === 'ios' ? 4 : 6,
    elevation: Platform.OS === 'android' ? 3 : 0,
  },
  currentMonthText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    flex: 1,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  calendarContent: {
    paddingBottom: Platform.OS === 'ios' ? 120 : 140,
  },
  compactCalendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 4 : 6 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.15,
    shadowRadius: Platform.OS === 'ios' ? 12 : 15,
    elevation: Platform.OS === 'android' ? 5 : 0,
    marginBottom: 25,
  },
  dayHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  dayHeader: {
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 13,
    color: '#6C63FF',
    fontWeight: 'bold',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  compactCalendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 15,
  },
  compactCalendarDayText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif',
      },
    }),
  },
  calendarDayToday: {
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
  },
  calendarDaySelected: {
    backgroundColor: 'rgba(255, 108, 171, 0.2)',
  },
  calendarDayTextToday: {
    color: '#6C63FF',
    fontWeight: 'bold',
  },
  calendarDayTextSelected: {
    color: '#FF6CAB',
    fontWeight: 'bold',
  },
  calendarDayTextOtherMonth: {
    color: '#ccc',
  },
  calendarDayOtherMonth: {
    opacity: 0.3,
  },
  eventDot: {
    width: 6,
    height: 6,
    backgroundColor: '#FF6CAB',
    borderRadius: 3,
    marginTop: 3,
  },
  enhancedSection: {
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 5,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 3 : 4 },
    shadowOpacity: Platform.OS === 'ios' ? 0.25 : 0.3,
    shadowRadius: Platform.OS === 'ios' ? 6 : 8,
    elevation: Platform.OS === 'android' ? 4 : 0,
  },
  enhancedSectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 18,
    marginBottom: 2,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  sectionSubtitle: {
    color: '#666',
    fontSize: 13,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif',
      },
    }),
  },
  viewModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 2 : 3 },
    shadowOpacity: Platform.OS === 'ios' ? 0.2 : 0.3,
    shadowRadius: Platform.OS === 'ios' ? 4 : 6,
    elevation: Platform.OS === 'android' ? 3 : 0,
  },
  viewModeText: {
    color: '#6C63FF',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 6,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  enhancedEmptyPlan: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyPlanGradient: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 6 : 8 },
    shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0.12,
    shadowRadius: Platform.OS === 'ios' ? 12 : 15,
    elevation: Platform.OS === 'android' ? 4 : 0,
  },
  emptyIconContainer: {
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
    borderRadius: 25,
    padding: 12,
    marginBottom: 12,
  },
  emptyPlanText: {
    fontSize: 18,
    color: '#333',
    marginTop: 8,
    fontWeight: 'bold',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  emptyPlanSubtext: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif',
      },
    }),
  },
  addFirstPlanButton: {
    marginTop: 20,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 3 : 4 },
    shadowOpacity: Platform.OS === 'ios' ? 0.2 : 0.25,
    shadowRadius: Platform.OS === 'ios' ? 6 : 8,
    elevation: Platform.OS === 'android' ? 4 : 0,
  },
  addFirstPlanGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 18,
  },
  addFirstPlanText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
    letterSpacing: 0.5,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  enhancedPlanCardsContainer: {
    backgroundColor: 'transparent',
  },
  enhancedPlanCard: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 6 : 8 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.15,
    shadowRadius: Platform.OS === 'ios' ? 12 : 15,
    elevation: Platform.OS === 'android' ? 8 : 0,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.06)',
  },
  planCardGradient: {
    borderRadius: 18,
    padding: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planTimeContainer: {
    alignItems: 'center',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 2 : 3 },
    shadowOpacity: Platform.OS === 'ios' ? 0.2 : 0.25,
    shadowRadius: Platform.OS === 'ios' ? 4 : 6,
    elevation: Platform.OS === 'android' ? 3 : 0,
  },
  planTimeText: {
    fontSize: 13,
    color: '#fff',
    marginLeft: 4,
    fontWeight: 'bold',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  planStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 99, 255, 0.06)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.12)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6CAB',
    marginRight: 6,
  },
  statusText: {
    color: '#6C63FF',
    fontSize: 11,
    fontWeight: '600',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  planContent: {
    flex: 1,
  },
  planTitle: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 16,
    marginBottom: 4,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  planSubtitle: {
    color: '#666',
    fontSize: 13,
    marginBottom: 10,
    lineHeight: 18,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif',
      },
    }),
  },
  planLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 99, 255, 0.06)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.1)',
  },
  planLocationText: {
    color: '#6C63FF',
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  planActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  planActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 99, 255, 0.06)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.1)',
    flex: 1,
    marginHorizontal: 3,
    justifyContent: 'center',
  },
  planActionText: {
    color: '#6C63FF',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 18,
    marginBottom: 10,
    marginLeft: 10,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  enhancedUpcomingContainer: {
    backgroundColor: 'transparent',
  },
  enhancedUpcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#FF6CAB',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 4 : 6 },
    shadowOpacity: Platform.OS === 'ios' ? 0.15 : 0.2,
    shadowRadius: Platform.OS === 'ios' ? 8 : 10,
    elevation: Platform.OS === 'android' ? 5 : 0,
  },
  upcomingCardGradient: {
    borderRadius: 20,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  upcomingIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  upcomingIconGradient: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6CAB',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 4 : 6 },
    shadowOpacity: Platform.OS === 'ios' ? 0.3 : 0.4,
    shadowRadius: Platform.OS === 'ios' ? 8 : 10,
    elevation: Platform.OS === 'android' ? 5 : 0,
  },
  upcomingContent: {
    flex: 1,
  },
  upcomingTitle: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 16,
    marginBottom: 4,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  upcomingDate: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif',
      },
    }),
  },
  upcomingArrow: {
    marginLeft: 'auto',
    padding: 8,
    backgroundColor: 'rgba(255, 108, 171, 0.1)',
    borderRadius: 15,
  },
  enhancedFab: {
    position: 'absolute',
    right: 25,
    bottom: Platform.OS === 'ios' ? 80 : 90,
    width: 65,
    height: 65,
    borderRadius: 32.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 8 : 10 },
    shadowOpacity: Platform.OS === 'ios' ? 0.3 : 0.4,
    shadowRadius: Platform.OS === 'ios' ? 15 : 18,
    elevation: Platform.OS === 'android' ? 10 : 0,
  },
  enhancedFabGradient: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineContent: {
    paddingBottom: Platform.OS === 'ios' ? 120 : 140,
  },
  enhancedTimelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  backButton: {
    padding: 10,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderRadius: 20,
  },
  timelineHeaderCenter: {
    alignItems: 'center',
  },
  enhancedTimelineDate: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  enhancedTimelineGreeting: {
    fontSize: 15,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif',
      },
    }),
  },
  enhancedTimelineContainer: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: 15,
  },
  enhancedTimelineItemsContainer: {
    backgroundColor: 'transparent',
  },
  enhancedTimelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  enhancedTimelineMarker: {
    width: 60,
    alignItems: 'center',
    position: 'absolute',
    left: -30,
  },
  enhancedTimelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 2 : 3 },
    shadowOpacity: Platform.OS === 'ios' ? 0.3 : 0.4,
    shadowRadius: Platform.OS === 'ios' ? 4 : 6,
    elevation: Platform.OS === 'android' ? 3 : 0,
  },
  enhancedTimelineLine: {
    width: 2,
    height: '100%',
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
    position: 'absolute',
    left: 29,
  },
  enhancedTimelineContent: {
    flex: 1,
    marginLeft: 60,
  },
  enhancedTimelineTime: {
    width: 60,
    alignItems: 'center',
    position: 'absolute',
    left: -30,
  },
  enhancedTimelineTimeText: {
    fontSize: 13,
    color: '#6C63FF',
    marginTop: 8,
    fontWeight: 'bold',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  enhancedTimelineCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 6 : 8 },
    shadowOpacity: Platform.OS === 'ios' ? 0.15 : 0.2,
    shadowRadius: Platform.OS === 'ios' ? 12 : 15,
    elevation: Platform.OS === 'android' ? 8 : 0,
  },
  enhancedTimelineTitle: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 18,
    marginBottom: 6,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  enhancedTimelineSubtitle: {
    color: '#666',
    fontSize: 14,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif',
      },
    }),
  },
  enhancedTimelineLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 15,
  },
  enhancedTimelineLocationText: {
    color: '#6C63FF',
    fontSize: 13,
    marginLeft: 8,
    fontWeight: '500',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  enhancedTimelineActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  timelineActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  timelineActionText: {
    color: '#6C63FF',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 6,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  enhancedEmptyTimeline: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTimelineGradient: {
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 8 : 10 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.15,
    shadowRadius: Platform.OS === 'ios' ? 15 : 18,
    elevation: Platform.OS === 'android' ? 5 : 0,
  },
  emptyTimelineText: {
    fontSize: 20,
    color: '#333',
    marginTop: 10,
    fontWeight: 'bold',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  emptyTimelineSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif',
      },
    }),
  },
  enhancedTimelineSectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 20,
    marginBottom: 15,
    marginLeft: 10,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  timelineCardGradient: {
    borderRadius: 20,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
  },
  loadingText: {
    color: '#6C63FF',
    fontSize: 18,
    marginTop: 15,
    fontWeight: '500',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? -4 : -6 },
    shadowOpacity: Platform.OS === 'ios' ? 0.15 : 0.2,
    shadowRadius: Platform.OS === 'ios' ? 15 : 18,
    elevation: Platform.OS === 'android' ? 15 : 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 22,
    color: '#333',
    textAlign: 'center',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  modalContent: {
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    marginLeft: 2,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  input: {
    backgroundColor: '#f8f9ff',
    borderRadius: 15,
    padding: 16,
    color: '#333',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.2)',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 2 : 3 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.15,
    shadowRadius: Platform.OS === 'ios' ? 4 : 6,
    elevation: Platform.OS === 'android' ? 2 : 0,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif',
      },
    }),
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    color: '#6C63FF',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 10,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  modalActions: {
    marginTop: 15,
  },
  createBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 4 : 6 },
    shadowOpacity: Platform.OS === 'ios' ? 0.3 : 0.4,
    shadowRadius: Platform.OS === 'ios' ? 8 : 10,
    elevation: Platform.OS === 'android' ? 5 : 0,
  },
  createBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    marginLeft: 10,
    letterSpacing: 0.5,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  cancelBtnText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9ff',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.2)',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 2 : 3 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.15,
    shadowRadius: Platform.OS === 'ios' ? 4 : 6,
    elevation: Platform.OS === 'android' ? 2 : 0,
  },
  timeText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  timePlaceholder: {
    color: '#999',
    fontSize: 16,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif',
      },
    }),
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timeInputGroup: {
    flex: 1,
    marginRight: 15,
  },
  dayPillRow: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 15,
  },
  dayPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.2)',
  },
  dayPillActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  dayPillText: {
    fontSize: 13,
    color: '#6C63FF',
    fontWeight: 'bold',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  dayPillTextActive: {
    color: '#fff',
  },
  addSlotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginVertical: 8,
  },
  addSlotText: {
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  slotFormCard: {
    backgroundColor: '#f8f9ff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.1)',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 2 : 3 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.15,
    shadowRadius: Platform.OS === 'ios' ? 6 : 8,
    elevation: Platform.OS === 'android' ? 3 : 0,
  },
  slotFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  slotFormTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  removeSlotBtn: {
    padding: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 15,
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
    zIndex: 1000,
  },
  modalTimePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 8 : 10 },
    shadowOpacity: Platform.OS === 'ios' ? 0.3 : 0.4,
    shadowRadius: Platform.OS === 'ios' ? 15 : 18,
    elevation: Platform.OS === 'android' ? 15 : 0,
    minWidth: 320,
    maxWidth: 380,
    minHeight: 250,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(108, 99, 255, 0.2)',
  },
  timePickerCancel: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  timePickerTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#333',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  timePickerDone: {
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: 'bold',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  timePickerComponent: {
    width: '100%',
    height: '100%',
  },
  eventsSlider: {
    height: 160,
    marginBottom: 20,
  },
  eventsSliderContent: {
    paddingHorizontal: 10,
  },
  sliderEventCard: {
    width: 320,
    marginRight: 15,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 4 : 6 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.15,
    shadowRadius: Platform.OS === 'ios' ? 12 : 15,
    elevation: Platform.OS === 'android' ? 5 : 0,
    backgroundColor: '#fff',
  },
  sliderCardGradient: {
    borderRadius: 18,
    padding: 18,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  sliderEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 2 : 3 },
    shadowOpacity: Platform.OS === 'ios' ? 0.2 : 0.25,
    shadowRadius: Platform.OS === 'ios' ? 4 : 6,
    elevation: Platform.OS === 'android' ? 3 : 0,
  },
  sliderTimeText: {
    fontSize: 13,
    color: '#fff',
    marginLeft: 4,
    fontWeight: 'bold',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  sliderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 99, 255, 0.06)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.12)',
  },
  sliderStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6CAB',
    marginRight: 6,
  },
  sliderStatusText: {
    color: '#6C63FF',
    fontSize: 11,
    fontWeight: '600',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  sliderEventContent: {
    flex: 1,
  },
  sliderEventTitle: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 18,
    marginBottom: 6,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  sliderEventSubtitle: {
    color: '#666',
    fontSize: 14,
    marginBottom: 10,
    lineHeight: 18,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif',
      },
    }),
  },
  sliderEventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 99, 255, 0.06)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.1)',
  },
  sliderLocationText: {
    color: '#6C63FF',
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  sliderEventActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  sliderActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 99, 255, 0.06)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.1)',
    flex: 1,
    marginHorizontal: 3,
    justifyContent: 'center',
  },
  sliderEventNotes: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 99, 255, 0.06)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.1)',
  },
  sliderNotesText: {
    color: '#6C63FF',
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
    flex: 1,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  sliderEventDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sliderDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 99, 255, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.1)',
  },
  sliderDetailText: {
    color: '#6C63FF',
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '500',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  sliderScheduleName: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 16,
    marginBottom: 4,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  sliderEventDescription: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 99, 255, 0.06)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.1)',
  },
  sliderDescriptionText: {
    color: '#6C63FF',
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
    flex: 1,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
});
